import { spawn, spawnSync, type ChildProcessByStdio } from "node:child_process";
import { existsSync } from "node:fs";
import * as net from "node:net";
import { resolve } from "node:path";
import type { Readable } from "node:stream";

import { desktopRuntimeConfig } from "./config";
import type { ProxyStatusPayload } from "./ipc";

export type ProxyManagerState = "stopped" | "starting" | "running" | "error";

export interface ProxyManagerError {
  code:
    | "port_in_use"
    | "python_runtime_missing"
    | "proxy_unavailable"
    | "internal_error"
    | "proxy_feature_disabled"
    | "secure_store_unavailable";
  message: string;
  details?: Record<string, unknown>;
}

export interface ProxyManagerOptions {
  host: string;
  port: number;
  pythonPath: string;
  proxyApp: string;
  cwd: string;
  healthzUrl: string;
  maxRestartAttempts: number;
  restartWindowMs: number;
  restartBackoffMs: number;
  healthPollIntervalMs: number;
  healthPollTimeoutMs: number;
  startupTimeoutMs: number;
  postStopDrainMs: number;
  env: Record<string, string | undefined>;
}

export interface LogEntry {
  ts: string;
  level: "INFO" | "WARN" | "ERROR";
  event: string;
  message: string;
  details?: Record<string, unknown>;
}

const DEFAULT_PYTHON = process.platform === "win32" ? "python" : "python3";
const DEFAULT_PROXY_APP = "proxy.app.main:app";

function nowIso(): string {
  return new Date().toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function isPortInUse(host: string, port: number): Promise<boolean> {
  return await new Promise<boolean>((resolveInUse) => {
    const socket = new net.Socket();
    socket.setTimeout(400);

    socket.once("connect", () => {
      socket.destroy();
      resolveInUse(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolveInUse(false);
    });

    socket.once("error", () => {
      socket.destroy();
      resolveInUse(false);
    });

    socket.connect(port, host);
  });
}

async function fetchHealthz(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status?: string };
    return data?.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeLogMessage(input: string, tokenRaw: string): string {
  const token = tokenRaw.trim();
  if (!token) {
    return input;
  }

  return input.split(token).join("[REDACTED_TOKEN]");
}

type ProxyChildProcess = ChildProcessByStdio<null, Readable, Readable>;

function hasProxyApp(cwd: string): boolean {
  return existsSync(resolve(cwd, "proxy", "app", "main.py"));
}

function resolveProxyCwd(): string {
  const override = process.env.PROXY_CWD?.trim();
  if (override) {
    return resolve(override);
  }

  const candidates = [
    resolve(__dirname, "..", ".."),
    resolve(__dirname, "..", "..", "..", ".."),
    process.cwd(),
  ];

  for (const candidate of candidates) {
    if (hasProxyApp(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

function baseOptions(): ProxyManagerOptions {
  const host = desktopRuntimeConfig.host;
  const port = desktopRuntimeConfig.port;
  const pythonPath = process.env.PYTHON_PATH?.trim() || DEFAULT_PYTHON;
  const cwd = resolveProxyCwd();

  return {
    host,
    port,
    pythonPath,
    proxyApp: process.env.PROXY_APP?.trim() || DEFAULT_PROXY_APP,
    cwd,
    healthzUrl: `http://${host}:${port}/healthz`,
    maxRestartAttempts: 3,
    restartWindowMs: 60_000,
    restartBackoffMs: 500,
    healthPollIntervalMs: 1_000,
    healthPollTimeoutMs: 800,
    startupTimeoutMs: 15_000,
    postStopDrainMs: 250,
    env: {
      HOST: host,
      PORT: String(port),
      LOG_LEVEL: desktopRuntimeConfig.logLevel,
      PUTER_TOKEN: desktopRuntimeConfig.puterToken,
      PROXY_FEATURE_ENABLED: desktopRuntimeConfig.proxyFeatureEnabled ? "1" : "0",
    },
  };
}

export class ProxyManager {
  private readonly options: ProxyManagerOptions;

  private state: ProxyManagerState = "stopped";
  private process: ProxyChildProcess | null = null;
  private lastError: ProxyManagerError | null = null;
  private lastTransitionAt = nowIso();
  private readonly restartAttempts: number[] = [];
  private readonly logs: LogEntry[] = [];
  private readonly logsLimit = 500;
  private healthPollTimer: NodeJS.Timeout | null = null;
  private healthPollGeneration = 0;
  private stopRequested = false;
  private puterToken = "";

  private runtimeErrorSnapshot(): ProxyManagerError | null {
    return this.lastError;
  }

  constructor(options?: Partial<ProxyManagerOptions>) {
    this.options = {
      ...baseOptions(),
      ...options,
    };

    this.puterToken = this.options.env.PUTER_TOKEN?.trim() || "";
  }

  public setPuterToken(token: string): void {
    this.puterToken = token.trim();
    this.options.env = {
      ...this.options.env,
      PUTER_TOKEN: this.puterToken,
    };
  }

  public clearPuterToken(): void {
    this.puterToken = "";
    this.options.env = {
      ...this.options.env,
      PUTER_TOKEN: "",
    };
  }

  public async start(): Promise<ProxyStatusPayload> {
    if (!desktopRuntimeConfig.proxyFeatureEnabled) {
      this.setError({
        code: "proxy_feature_disabled",
        message: "Proxy feature is disabled via PROXY_FEATURE_ENABLED=0",
      });
      throw this.lastError;
    }

    if (this.state === "running") {
      return this.status();
    }

    if (this.state === "starting") {
      return this.status();
    }

    this.stopRequested = false;
    this.ensurePythonRuntimeAvailable();
    await this.ensurePortAvailable();
    await this.startWithRetries();
    return this.status();
  }

  public async stop(): Promise<ProxyStatusPayload> {
    this.stopRequested = true;
    const proc = this.process;
    this.process = null;
    if (proc) {
      proc.kill();
    }

    this.stopHealthPolling();
    await sleep(this.options.postStopDrainMs);
    this.transitionTo("stopped");
    this.lastError = null;
    this.log("INFO", "proxy.stop", "Proxy process stopped by manager");
    return this.status();
  }

  public async restart(): Promise<ProxyStatusPayload> {
    await this.stop();
    await this.waitForStopped();
    await this.start();
    return this.status();
  }

  public status(): ProxyStatusPayload {
    return {
      status: this.state,
      pid: this.process?.pid,
      retries_in_window: this.retriesInWindow(),
      last_transition_at: this.lastTransitionAt,
      error_code: this.lastError?.code,
      error_message: this.lastError?.message,
    };
  }

  public subscribeLogs(cursor?: string): { subscribed: true; channel: "logs"; entries: LogEntry[] } {
    const entries = this.logsSince(cursor);
    return {
      subscribed: true,
      channel: "logs",
      entries,
    };
  }

  private logsSince(cursor?: string): LogEntry[] {
    if (!cursor) {
      return [...this.logs];
    }
    const idx = this.logs.findIndex((entry) => entry.ts === cursor);
    if (idx < 0) {
      return [...this.logs];
    }
    return this.logs.slice(idx + 1);
  }

  private async ensurePortAvailable(): Promise<void> {
    const inUse = await isPortInUse(this.options.host, this.options.port);
    if (!inUse) {
      return;
    }

    this.setError({
      code: "port_in_use",
      message: `Port ${this.options.host}:${this.options.port} is already in use`,
      details: { host: this.options.host, port: this.options.port },
    });
    throw this.lastError;
  }

  private ensurePythonRuntimeAvailable(): void {
    const probe = spawnSync(this.options.pythonPath, ["--version"], {
      stdio: "ignore",
      windowsHide: true,
    });

    if (!probe.error) {
      return;
    }

    const message = probe.error instanceof Error ? probe.error.message : String(probe.error);
    if (message.toLowerCase().includes("enoent") || message.toLowerCase().includes("not found")) {
      this.setError({
        code: "python_runtime_missing",
        message: `Python runtime not found: ${this.options.pythonPath}`,
      });
      throw this.lastError;
    }

    this.setError({
      code: "internal_error",
      message: `Failed to validate python runtime: ${message}`,
    });
    throw this.lastError;
  }

  private async spawnProxy(): Promise<void> {
    this.transitionTo("starting");
    this.lastError = null;
    this.log("INFO", "proxy.start", "Spawning uvicorn proxy process", {
      host: this.options.host,
      port: this.options.port,
    });

    const childEnv = {
      ...process.env,
      ...this.options.env,
    };

    try {
      this.process = spawn(
        this.options.pythonPath,
        [
          "-m",
          "uvicorn",
          this.options.proxyApp,
          "--host",
          this.options.host,
          "--port",
          String(this.options.port),
        ],
        {
          cwd: this.options.cwd,
          env: childEnv,
          stdio: ["ignore", "pipe", "pipe"],
          windowsHide: true,
        },
      );
    } catch (err) {
      this.handleSpawnFailure(err);
      throw this.lastError;
    }

    const spawned = this.process;
    if (!spawned) {
      this.setError({
        code: "internal_error",
        message: "Proxy process spawn returned no process handle",
      });
      throw this.lastError;
    }

    this.attachProcessListeners(spawned);

    const becameHealthy = await this.waitUntilHealthy(this.options.startupTimeoutMs);
    if (!becameHealthy) {
      const startupError = this.runtimeErrorSnapshot();
      if (startupError && startupError.code !== "proxy_unavailable") {
        this.process?.kill();
        this.process = null;
        throw startupError;
      }

      this.setError({
        code: "proxy_unavailable",
        message: "Proxy did not become healthy within startup timeout",
      });
      this.process?.kill();
      this.process = null;
      throw this.lastError;
    }

    if (this.stopRequested) {
      this.process?.kill();
      this.process = null;
      this.transitionTo("stopped");
      return;
    }

    this.transitionTo("running");
    this.log("INFO", "proxy.running", "Proxy process is healthy and running", {
      pid: this.process?.pid,
    });
    this.startHealthPolling();
  }

  private attachProcessListeners(proc: ProxyChildProcess): void {
    proc.stdout.on("data", (chunk: Buffer | string) => {
      this.log("INFO", "proxy.stdout", sanitizeLogMessage(String(chunk).trim(), this.puterToken));
    });

    proc.stderr.on("data", (chunk: Buffer | string) => {
      const msg = sanitizeLogMessage(String(chunk).trim(), this.puterToken);
      if (msg.length > 0) {
        this.log("WARN", "proxy.stderr", msg);
      }
    });

    proc.on("error", (err) => {
      this.handleSpawnFailure(err);
    });

    proc.on("exit", (code, signal) => {
      this.log("WARN", "proxy.exit", "Proxy process exited", {
        code: code ?? null,
        signal: signal ?? null,
      });

      this.process = null;
      this.stopHealthPolling();

      if (this.state === "stopped") {
        return;
      }

      if (this.state === "starting") {
        return;
      }

      if (this.stopRequested) {
        return;
      }

      void this.handleUnexpectedExit();
    });
  }

  private async handleUnexpectedExit(): Promise<void> {
    const withinWindow = this.bumpRestartBudget();
    if (!withinWindow) {
      this.setError({
        code: "proxy_unavailable",
        message: "Proxy crash loop detected (max 3 attempts in 60 seconds)",
      });
      return;
    }

    this.log("WARN", "proxy.restart", "Attempting bounded auto-restart", {
      retries_in_window: this.retriesInWindow(),
    });

    try {
      await this.spawnProxy();
    } catch {
      // spawnProxy sets structured error state.
    }
  }

  private async startWithRetries(): Promise<void> {
    let attempt = 0;
    let lastError: ProxyManagerError | null = null;

    this.restartAttempts.length = 0;

    while (attempt < this.options.maxRestartAttempts) {
      attempt += 1;

      try {
        await this.spawnProxy();
        return;
      } catch {
        if (this.stopRequested) {
          this.transitionTo("stopped");
          this.lastError = null;
          return;
        }

        lastError = this.lastError;

        if (!lastError) {
          throw new Error("Unknown proxy start failure");
        }

        if (lastError.code === "python_runtime_missing" || lastError.code === "port_in_use") {
          throw lastError;
        }

        this.recordRetryAttempt();

        if (attempt >= this.options.maxRestartAttempts) {
          break;
        }

        this.log("WARN", "proxy.start.retry", "Retrying proxy start after failed startup attempt", {
          attempt,
          max_attempts: this.options.maxRestartAttempts,
          code: lastError.code,
        });
        await sleep(this.options.restartBackoffMs * attempt);
      }
    }

    this.setError({
      code: "proxy_unavailable",
      message: `Proxy failed to start after ${this.options.maxRestartAttempts} attempts`,
      details: {
        retries_in_window: this.retriesInWindow(),
        last_error_code: lastError?.code,
      },
    });
    throw this.lastError;
  }

  private bumpRestartBudget(): boolean {
    const count = this.recordRetryAttempt();
    return count <= this.options.maxRestartAttempts;
  }

  private recordRetryAttempt(): number {
    const now = Date.now();
    this.pruneRetryAttempts(now);
    this.restartAttempts.push(now);
    return this.restartAttempts.length;
  }

  private pruneRetryAttempts(now: number): void {
    const threshold = now - this.options.restartWindowMs;
    while (this.restartAttempts.length > 0 && this.restartAttempts[0] < threshold) {
      this.restartAttempts.shift();
    }
  }

  private retriesInWindow(): number {
    this.pruneRetryAttempts(Date.now());
    return this.restartAttempts.length;
  }

  private async waitUntilHealthy(timeoutMs: number): Promise<boolean> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (this.stopRequested) {
        return false;
      }

      if (!this.process) {
        return false;
      }

      const healthy = await fetchHealthz(this.options.healthzUrl, this.options.healthPollTimeoutMs);
      if (healthy) {
        return true;
      }

      await sleep(200);
    }
    return false;
  }

  private startHealthPolling(): void {
    const generation = ++this.healthPollGeneration;
    this.stopHealthPolling();
    this.healthPollTimer = setInterval(async () => {
      if (generation !== this.healthPollGeneration) {
        return;
      }

      if (!this.process || this.state !== "running") {
        return;
      }

      const pidAtTick = this.process.pid;
      const healthy = await fetchHealthz(this.options.healthzUrl, this.options.healthPollTimeoutMs);
      if (generation !== this.healthPollGeneration) {
        return;
      }

      if (!this.process || this.state !== "running") {
        return;
      }

      if (this.process.pid !== pidAtTick) {
        return;
      }

      if (!healthy) {
        this.log("WARN", "proxy.health", "Healthz probe failed while running", {
          pid: pidAtTick,
        });
      }
    }, this.options.healthPollIntervalMs);
  }

  private stopHealthPolling(): void {
    this.healthPollGeneration += 1;
    if (!this.healthPollTimer) {
      return;
    }
    clearInterval(this.healthPollTimer);
    this.healthPollTimer = null;
  }

  private async waitForStopped(timeoutMs = 5_000): Promise<void> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (!this.process && this.state === "stopped") {
        return;
      }
      await sleep(50);
    }
  }

  private handleSpawnFailure(err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("enoent") || message.toLowerCase().includes("not found")) {
      this.setError({
        code: "python_runtime_missing",
        message: `Python runtime not found: ${this.options.pythonPath}`,
      });
      return;
    }

    this.setError({
      code: "internal_error",
      message: `Failed to spawn proxy process: ${message}`,
    });
  }

  private transitionTo(next: ProxyManagerState): void {
    this.state = next;
    this.lastTransitionAt = nowIso();
  }

  private setError(error: ProxyManagerError): void {
    this.lastError = error;
    this.transitionTo("error");
    this.log("ERROR", "proxy.error", error.message, {
      code: error.code,
      ...(error.details || {}),
    });
  }

  private log(
    level: "INFO" | "WARN" | "ERROR",
    event: string,
    message: string,
    details?: Record<string, unknown>,
  ): void {
    if (!message) {
      return;
    }

    const entry: LogEntry = {
      ts: nowIso(),
      level,
      event,
      message,
      details,
    };
    this.logs.push(entry);
    if (this.logs.length > this.logsLimit) {
      this.logs.splice(0, this.logs.length - this.logsLimit);
    }
  }
}

export const proxyManager = new ProxyManager();
