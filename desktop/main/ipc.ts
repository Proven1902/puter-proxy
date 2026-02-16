export const IPC_CHANNELS = {
  PROXY_START: "proxy.start",
  PROXY_STOP: "proxy.stop",
  PROXY_RESTART: "proxy.restart",
  PROXY_STATUS: "proxy.status",
  TOKEN_SAVE: "token.save",
  TOKEN_CLEAR: "token.clear",
  LOGS_SUBSCRIBE: "logs.subscribe",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

const IPC_ALLOWLIST = new Set<IpcChannel>(Object.values(IPC_CHANNELS));

export function isAllowedIpcChannel(channel: string): channel is IpcChannel {
  return IPC_ALLOWLIST.has(channel as IpcChannel);
}

export interface IpcRequestMap {
  "proxy.start": Record<string, never>;
  "proxy.stop": Record<string, never>;
  "proxy.restart": Record<string, never>;
  "proxy.status": Record<string, never>;
  "token.save": { token: string };
  "token.clear": Record<string, never>;
  "logs.subscribe": { cursor?: string };
}

export type ProxyLifecycleState = "stopped" | "starting" | "running" | "error";

export interface ProxyStatusPayload {
  status: ProxyLifecycleState;
  pid?: number;
  retries_in_window?: number;
  last_transition_at?: string;
  error_code?: string;
  error_message?: string;
}

export interface IpcLogEntry {
  ts: string;
  level: "INFO" | "WARN" | "ERROR";
  event: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface IpcResponseMap {
  "proxy.start": ProxyStatusPayload;
  "proxy.stop": ProxyStatusPayload;
  "proxy.restart": ProxyStatusPayload;
  "proxy.status": ProxyStatusPayload;
  "token.save": { saved: true };
  "token.clear": { cleared: true };
  "logs.subscribe": { subscribed: true; channel: "logs"; entries: IpcLogEntry[] };
}

export interface IpcErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id: string;
}

export type IpcResponseEnvelope<T> =
  | {
      ok: true;
      data: T;
      request_id: string;
    }
  | {
      ok: false;
      error: IpcErrorBody;
    };

function nextRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function okResponse<T>(data: T, requestId = nextRequestId()): IpcResponseEnvelope<T> {
  return {
    ok: true,
    data,
    request_id: requestId,
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  requestId = nextRequestId(),
): IpcResponseEnvelope<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      details,
      request_id: requestId,
    },
  };
}

export function assertAllowedChannel(channel: string): IpcChannel {
  if (!isAllowedIpcChannel(channel)) {
    throw new Error(`IPC channel is not allowlisted: ${channel}`);
  }

  return channel;
}
