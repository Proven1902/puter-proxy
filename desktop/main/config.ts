declare const process: {
  env: Record<string, string | undefined>;
};

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface DesktopRuntimeConfig {
  host: string;
  port: number;
  puterToken: string;
  logLevel: LogLevel;
  proxyFeatureEnabled: boolean;
}

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const ALLOWED_LOG_LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

function parsePort(raw: string | undefined): number {
  const fallback = "11435";
  const source = raw?.trim() || fallback;
  const parsed = Number.parseInt(source, 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${source}`);
  }

  return parsed;
}

function parseHost(raw: string | undefined): string {
  const host = raw?.trim() || "127.0.0.1";

  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`Invalid HOST value for MVP localhost-only mode: ${host}`);
  }

  return host;
}

function parseLogLevel(raw: string | undefined): LogLevel {
  const level = (raw?.trim().toUpperCase() || "INFO") as LogLevel;

  if (!ALLOWED_LOG_LEVELS.includes(level)) {
    throw new Error(`Invalid LOG_LEVEL value: ${raw ?? "<empty>"}`);
  }

  return level;
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw.trim() === "") {
    return fallback;
  }

  return TRUE_VALUES.has(raw.trim().toLowerCase());
}

function parsePuterToken(env: Record<string, string | undefined>): string {
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();
  if (nodeEnv === "production") {
    return "";
  }

  return env.PUTER_TOKEN?.trim() || "";
}

export function loadDesktopRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): DesktopRuntimeConfig {
  return {
    host: parseHost(env.HOST),
    port: parsePort(env.PORT),
    puterToken: parsePuterToken(env),
    logLevel: parseLogLevel(env.LOG_LEVEL),
    proxyFeatureEnabled: parseBoolean(env.PROXY_FEATURE_ENABLED, true),
  };
}

export const desktopRuntimeConfig = loadDesktopRuntimeConfig();
