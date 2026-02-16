export type ProxyStatus = "stopped" | "starting" | "running" | "error";

export interface ProxyStatusPayload {
  status: ProxyStatus;
  pid?: number;
  retries_in_window?: number;
  last_transition_at?: string;
  error_code?: string;
  error_message?: string;
  token_masked?: boolean;
}

export interface IpcLogEntry {
  ts: string;
  level: "INFO" | "WARN" | "ERROR";
  event: string;
  message: string;
  details?: Record<string, unknown>;
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

export interface DesktopIpcClient {
  proxyStart(): Promise<IpcResponseEnvelope<ProxyStatusPayload>>;
  proxyStop(): Promise<IpcResponseEnvelope<ProxyStatusPayload>>;
  proxyRestart(): Promise<IpcResponseEnvelope<ProxyStatusPayload>>;
  proxyStatus(): Promise<IpcResponseEnvelope<ProxyStatusPayload>>;
  tokenSave(token: string): Promise<IpcResponseEnvelope<{ saved: true }>>;
  tokenClear(): Promise<IpcResponseEnvelope<{ cleared: true }>>;
  logsSubscribe(cursor?: string): Promise<
    IpcResponseEnvelope<{ subscribed: true; channel: "logs"; entries: IpcLogEntry[] }>
  >;
}

const fallbackError = <T>(message: string): IpcResponseEnvelope<T> => ({
  ok: false,
  error: {
    code: "ipc_unavailable",
    message,
    request_id: `req_${Date.now().toString(36)}`,
  },
});

function getApi() {
  if (typeof window === "undefined" || !window.puterDesktopApi) {
    return null;
  }
  return window.puterDesktopApi;
}

async function invoke<T>(fn: (api: Window["puterDesktopApi"]) => Promise<unknown>): Promise<IpcResponseEnvelope<T>> {
  const api = getApi();
  if (!api) {
    return fallbackError<T>("Desktop API bridge is unavailable");
  }

  try {
    return (await fn(api)) as IpcResponseEnvelope<T>;
  } catch (err) {
    const message = err instanceof Error ? err.message : "IPC invoke failure";
    return fallbackError<T>(message);
  }
}

export const desktopIpcClient: DesktopIpcClient = {
  proxyStart: () => invoke<ProxyStatusPayload>((api) => api.proxyStart()),
  proxyStop: () => invoke<ProxyStatusPayload>((api) => api.proxyStop()),
  proxyRestart: () => invoke<ProxyStatusPayload>((api) => api.proxyRestart()),
  proxyStatus: () => invoke<ProxyStatusPayload>((api) => api.proxyStatus()),
  tokenSave: (token: string) => invoke<{ saved: true }>((api) => api.tokenSave(token)),
  tokenClear: () => invoke<{ cleared: true }>((api) => api.tokenClear()),
  logsSubscribe: (cursor?: string) => invoke<{ subscribed: true; channel: "logs"; entries: IpcLogEntry[] }>((api) => api.logsSubscribe(cursor)),
};
