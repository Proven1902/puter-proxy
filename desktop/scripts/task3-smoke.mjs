import { createServer } from "node:net";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, "..", "..");
const desktopRoot = resolve(workspaceRoot, "desktop");
const tmpOutDir = resolve(desktopRoot, ".tmp-task3");
const evidenceDir = resolve(workspaceRoot, ".sisyphus", "evidence");

mkdirSync(evidenceDir, { recursive: true });

function compileDesktopMainTs() {
  rmSync(tmpOutDir, { recursive: true, force: true });

  const tscEntrypoint = resolve(desktopRoot, "node_modules", "typescript", "bin", "tsc");
  const args = [
    "--target",
    "ES2022",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--lib",
    "ES2022,DOM",
    "--types",
    "node",
    "--outDir",
    ".tmp-task3",
    "main/config.ts",
    "main/ipc.ts",
    "main/proxy-manager.ts",
    "main/index.ts",
  ];

  const compile = spawnSync(process.execPath, [tscEntrypoint, ...args], {
    cwd: desktopRoot,
    encoding: "utf-8",
  });

  if (compile.error) {
    throw new Error(`TypeScript compile failed: ${String(compile.error)}`);
  }

  if (compile.status !== 0) {
    throw new Error(`TypeScript compile failed: ${compile.stderr || compile.stdout || "unknown error"}`);
  }
}

compileDesktopMainTs();

const mainIndexPath = pathToFileURL(resolve(tmpOutDir, "index.js")).href;
const proxyManagerPath = pathToFileURL(resolve(tmpOutDir, "proxy-manager.js")).href;

const {
  dispatchIpcCommand,
} = await import(mainIndexPath);

const {
  ProxyManager,
} = await import(proxyManagerPath);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function asOkEnvelope(value) {
  return value && typeof value === "object" && value.ok === true ? value : null;
}

function asErrEnvelope(value) {
  return value && typeof value === "object" && value.ok === false ? value : null;
}

async function checkLifecycleCommands() {
  const lifecycle = {
    start: null,
    statusAfterStart: null,
    restart: null,
    stop: null,
  };

  try {
    const start = await dispatchIpcCommand("proxy.start", {});
    const okStart = asOkEnvelope(start);
    assert(okStart, "proxy.start should return ok envelope");
    assert(["starting", "running"].includes(okStart.data.status), "proxy.start should enter starting/running");
    lifecycle.start = okStart.data;

    let latestStatus = okStart.data;
    for (let i = 0; i < 40; i += 1) {
      const statusResp = await dispatchIpcCommand("proxy.status", {});
      const okStatus = asOkEnvelope(statusResp);
      assert(okStatus, "proxy.status should return ok envelope during lifecycle check");
      latestStatus = okStatus.data;
      if (okStatus.data.status === "running") {
        break;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    }
    assert(["running", "starting"].includes(latestStatus.status), "proxy should reach running/starting state");
    lifecycle.statusAfterStart = latestStatus;

    const restart = await dispatchIpcCommand("proxy.restart", {});
    const okRestart = asOkEnvelope(restart);
    if (!okRestart) {
      writeFileSync(resolve(evidenceDir, "task-3-restart-debug.json"), JSON.stringify(restart, null, 2), "utf-8");
    }
    assert(okRestart, "proxy.restart should return ok envelope");
    assert(["starting", "running"].includes(okRestart.data.status), "proxy.restart should return starting/running");
    lifecycle.restart = okRestart.data;
  } finally {
    const stop = await dispatchIpcCommand("proxy.stop", {});
    const okStop = asOkEnvelope(stop);
    assert(okStop, "proxy.stop should return ok envelope");
    assert(okStop.data.status === "stopped", "proxy.stop should return stopped state");
    lifecycle.stop = okStop.data;
  }

  writeFileSync(resolve(evidenceDir, "task-3-lifecycle.json"), JSON.stringify(lifecycle, null, 2), "utf-8");
}

async function checkAllowlistAndStatus() {
  const notAllowed = await dispatchIpcCommand("proxy.exec", {});
  const denied = asErrEnvelope(notAllowed);
  assert(denied, "non-allowlisted channel must fail");
  assert(denied.error.code === "invalid_request", "invalid allowlist error code expected");

  const status = await dispatchIpcCommand("proxy.status", {});
  const okStatus = asOkEnvelope(status);
  assert(okStatus, "proxy.status should return ok envelope");
  assert(
    ["stopped", "starting", "running", "error"].includes(okStatus.data.status),
    "proxy.status state should be valid",
  );

  const logs = await dispatchIpcCommand("logs.subscribe", {});
  const okLogs = asOkEnvelope(logs);
  assert(okLogs, "logs.subscribe should return ok envelope");
  assert(okLogs.data.subscribed === true, "logs.subscribe should acknowledge subscription");
  assert(Array.isArray(okLogs.data.entries), "logs.subscribe should include entries array");
}

async function checkPortInUse() {
  const holder = createServer();

  await new Promise((resolveListen, rejectListen) => {
    holder.once("error", rejectListen);
    holder.listen(11435, "127.0.0.1", () => resolveListen());
  });

  const manager = new ProxyManager({
    host: "127.0.0.1",
    port: 11435,
    pythonPath: process.env.PYTHON_PATH || "python",
  });

  let caught = null;
  try {
    await manager.start();
  } catch (err) {
    caught = err;
  } finally {
    holder.close();
  }

  assert(caught && typeof caught === "object", "port-in-use should throw structured error");
  assert(caught.code === "port_in_use", "port-in-use should use code=port_in_use");

  writeFileSync(
    resolve(evidenceDir, "task-3-port-in-use.json"),
    JSON.stringify({ error: { code: caught.code, message: caught.message, details: caught.details || {} } }, null, 2),
    "utf-8",
  );
}

async function checkMissingPython() {
  const manager = new ProxyManager({
    host: "127.0.0.1",
    port: 11436,
    pythonPath: "nonexistent-python-binary-task3",
  });

  let caught = null;
  try {
    await manager.start();
  } catch (err) {
    caught = err;
  }

  assert(caught && typeof caught === "object", "missing-python should throw structured error");
  assert(caught.code === "python_runtime_missing", "missing-python should use code=python_runtime_missing");

  writeFileSync(
    resolve(evidenceDir, "task-3-python-missing.json"),
    JSON.stringify({ error: { code: caught.code, message: caught.message, details: caught.details || {} } }, null, 2),
    "utf-8",
  );
}

async function checkCrashLoopBudget() {
  const manager = new ProxyManager({
    host: "127.0.0.1",
    port: 11436,
    pythonPath: process.execPath,
    proxyApp: "this.module.does.not.exist",
    startupTimeoutMs: 150,
    maxRestartAttempts: 3,
    restartBackoffMs: 10,
    restartWindowMs: 60_000,
    healthPollIntervalMs: 500,
    healthPollTimeoutMs: 200,
  });

  let caught = null;
  try {
    await manager.start();
  } catch (err) {
    caught = err;
  }

  assert(caught && typeof caught === "object", "crash-loop startup should throw structured error");
  assert(caught.code === "proxy_unavailable", "crash-loop should end with proxy_unavailable");

  const status = manager.status();
  assert(status.status === "error", "manager should end in error state after retries");
  assert(
    typeof status.retries_in_window === "number" && status.retries_in_window <= 3,
    "retry count should be bounded to configured budget",
  );

  writeFileSync(
    resolve(evidenceDir, "task-3-retry-failure.txt"),
    `code=${caught.code}\nmessage=${caught.message}\nstatus=${status.status}\nretries_in_window=${status.retries_in_window}\n`,
    "utf-8",
  );
}

async function main() {
  await checkLifecycleCommands();
  await checkAllowlistAndStatus();
  await checkPortInUse();
  await checkMissingPython();
  await checkCrashLoopBudget();

  writeFileSync(
    resolve(evidenceDir, "task-3-smoke-summary.json"),
    JSON.stringify(
      {
        task3_smoke_ok: true,
        checks: [
          "start_stop_restart_status",
          "allowlist/status",
          "port_in_use",
          "python_runtime_missing",
          "crash_loop_budget",
        ],
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log("task3_smoke_ok=true");
}

main().catch((err) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  console.error(message);
  process.exit(1);
});
