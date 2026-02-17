import { desktopRuntimeConfig } from "./config";
import {
  IPC_CHANNELS,
  assertAllowedChannel,
  errorResponse,
  isAllowedIpcChannel,
  okResponse,
  type IpcChannel,
  type IpcRequestMap,
  type IpcResponseEnvelope,
  type IpcResponseMap,
} from "./ipc";
import { proxyManager, type LogEntry, type ProxyManagerError } from "./proxy-manager";
import { createTokenSecureStore } from "./security-store";

export interface IpcMainLike {
  handle(channel: string, handler: (_event: unknown, payload?: unknown) => Promise<unknown> | unknown): void;
}

interface TokenState {
  value: string;
  masked: boolean;
}

interface PublicTokenState {
  masked: boolean;
}

const tokenState: TokenState = {
  value: "",
  masked: false,
};

const tokenStore = createTokenSecureStore();

function applyTokenToRuntime(token: string): void {
  tokenState.value = token;
  tokenState.masked = token.length > 0;
  if (token.length > 0) {
    proxyManager.setPuterToken(token);
    return;
  }

  proxyManager.clearPuterToken();
}

async function restartProxyIfRunning(): Promise<void> {
  const status = proxyManager.status();
  if (status.status === "running" || status.status === "starting") {
    await proxyManager.restart();
  }
}

async function initializeTokenState(): Promise<void> {
  let token = "";

  if (desktopRuntimeConfig.puterToken) {
    token = desktopRuntimeConfig.puterToken;
  } else {
    try {
      token = await tokenStore.loadToken();
    } catch {
      token = "";
    }
  }

  applyTokenToRuntime(token);
}

const tokenReady = initializeTokenState();

function normalizeError(err: unknown): ProxyManagerError {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    const cast = err as ProxyManagerError;
    return {
      code: cast.code,
      message: cast.message,
      details: cast.details,
    };
  }

  const message = err instanceof Error ? err.message : "Unexpected proxy manager failure";
  return {
    code: "internal_error",
    message,
  };
}

function asRecord(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function extractCursor(payload: unknown): string | undefined {
  const record = asRecord(payload);
  const cursor = record.cursor;
  if (typeof cursor === "string" && cursor.trim() !== "") {
    return cursor;
  }
  return undefined;
}

function extractToken(payload: unknown): string {
  const record = asRecord(payload);
  const token = record.token;
  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("token.save requires non-empty token string");
  }
  return token.trim();
}

function logsPayload(entries: LogEntry[]): IpcResponseMap["logs.subscribe"] & { entries: LogEntry[] } {
  return {
    subscribed: true,
    channel: "logs",
    entries,
  };
}

function emptyPayload(payload: unknown): payload is Record<string, never> {
  return typeof payload === "object" && payload !== null && Object.keys(payload as Record<string, unknown>).length === 0;
}

function assertPayload<C extends IpcChannel>(
  channel: C,
  payload: unknown,
): IpcRequestMap[C] {
  if (
    channel === IPC_CHANNELS.PROXY_START ||
    channel === IPC_CHANNELS.PROXY_STOP ||
    channel === IPC_CHANNELS.PROXY_RESTART ||
    channel === IPC_CHANNELS.PROXY_STATUS ||
    channel === IPC_CHANNELS.TOKEN_CLEAR
  ) {
    if (payload === undefined || emptyPayload(payload)) {
      return {} as IpcRequestMap[C];
    }
    throw new Error(`${channel} does not accept payload fields`);
  }

  if (channel === IPC_CHANNELS.TOKEN_SAVE) {
    const token = extractToken(payload);
    return { token } as IpcRequestMap[C];
  }

  if (channel === IPC_CHANNELS.LOGS_SUBSCRIBE) {
    const cursor = extractCursor(payload);
    if (!cursor) {
      return {} as IpcRequestMap[C];
    }
    return { cursor } as IpcRequestMap[C];
  }

  throw new Error(`Unsupported allowlisted channel: ${channel}`);
}

async function handleProxyChannel(channel: IpcChannel, payload: unknown): Promise<IpcResponseEnvelope<unknown>> {
  try {
    await tokenReady;

    if (channel === IPC_CHANNELS.PROXY_START) {
      return okResponse<IpcResponseMap["proxy.start"]>(await proxyManager.start());
    }

    if (channel === IPC_CHANNELS.PROXY_STOP) {
      return okResponse<IpcResponseMap["proxy.stop"]>(await proxyManager.stop());
    }

    if (channel === IPC_CHANNELS.PROXY_RESTART) {
      return okResponse<IpcResponseMap["proxy.restart"]>(await proxyManager.restart());
    }

    if (channel === IPC_CHANNELS.PROXY_STATUS) {
      const status = proxyManager.status();
      return okResponse<IpcResponseMap["proxy.status"]>({
        ...status,
        token_masked: tokenState.masked,
      });
    }

    if (channel === IPC_CHANNELS.TOKEN_SAVE) {
      const token = extractToken(payload);
      await tokenStore.saveToken(token);
      applyTokenToRuntime(token);
      await restartProxyIfRunning();
      return okResponse<IpcResponseMap["token.save"]>({ saved: true });
    }

    if (channel === IPC_CHANNELS.TOKEN_CLEAR) {
      await tokenStore.clearToken();
      applyTokenToRuntime("");
      await restartProxyIfRunning();
      return okResponse<IpcResponseMap["token.clear"]>({ cleared: true });
    }

    if (channel === IPC_CHANNELS.LOGS_SUBSCRIBE) {
      const result = proxyManager.subscribeLogs(extractCursor(payload));
      return okResponse(logsPayload(result.entries));
    }

    return errorResponse("invalid_request", `No handler registered for ${channel}`);
  } catch (err) {
    const normalized = normalizeError(err);
    return errorResponse(normalized.code, normalized.message, normalized.details);
  }
}

export async function dispatchIpcCommand(
  channel: string,
  payload?: unknown,
): Promise<IpcResponseEnvelope<unknown>> {
  if (!isAllowedIpcChannel(channel)) {
    return errorResponse("invalid_request", `IPC channel is not allowlisted: ${channel}`);
  }

  try {
    const validated = assertPayload(channel, payload);
    return await handleProxyChannel(channel, validated as IpcRequestMap[IpcChannel]);
  } catch (err) {
    const normalized = normalizeError(err);
    return errorResponse(normalized.code, normalized.message, normalized.details);
  }
}

export function registerIpcHandlers(ipcMain: IpcMainLike): void {
  const channels: IpcChannel[] = Object.values(IPC_CHANNELS);

  for (const channel of channels) {
    ipcMain.handle(channel, async (_event, payload?: unknown) => {
      const allowlisted = assertAllowedChannel(channel);
      return await dispatchIpcCommand(allowlisted, payload);
    });
  }
}

export function getTokenState(): PublicTokenState {
  return {
    masked: tokenState.masked,
  };
}
