import {
  IPC_CHANNELS,
  assertAllowedChannel,
  errorResponse,
  type IpcChannel,
  type IpcRequestMap,
  type IpcResponseEnvelope,
  type IpcResponseMap,
} from "../main/ipc";

export interface IpcInvoker {
  invoke<T = unknown>(channel: string, payload?: unknown): Promise<T>;
}

export interface DesktopBridgeApi {
  proxyStart(): Promise<IpcResponseEnvelope<IpcResponseMap["proxy.start"]>>;
  proxyStop(): Promise<IpcResponseEnvelope<IpcResponseMap["proxy.stop"]>>;
  proxyRestart(): Promise<IpcResponseEnvelope<IpcResponseMap["proxy.restart"]>>;
  proxyStatus(): Promise<IpcResponseEnvelope<IpcResponseMap["proxy.status"]>>;
  tokenSave(token: string): Promise<IpcResponseEnvelope<IpcResponseMap["token.save"]>>;
  tokenClear(): Promise<IpcResponseEnvelope<IpcResponseMap["token.clear"]>>;
  logsSubscribe(cursor?: string): Promise<IpcResponseEnvelope<IpcResponseMap["logs.subscribe"]>>;
}

async function invokeChannel<C extends IpcChannel>(
  ipc: IpcInvoker,
  channel: C,
  payload: IpcRequestMap[C],
): Promise<IpcResponseEnvelope<IpcResponseMap[C]>> {
  try {
    const allowlisted = assertAllowedChannel(channel);
    return await ipc.invoke<IpcResponseEnvelope<IpcResponseMap[C]>>(allowlisted, payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "IPC invoke failed";
    return errorResponse("ipc_invoke_failed", message) as IpcResponseEnvelope<IpcResponseMap[C]>;
  }
}

export function createDesktopBridgeApi(ipc: IpcInvoker): DesktopBridgeApi {
  return {
    proxyStart: () => invokeChannel(ipc, IPC_CHANNELS.PROXY_START, {}),
    proxyStop: () => invokeChannel(ipc, IPC_CHANNELS.PROXY_STOP, {}),
    proxyRestart: () => invokeChannel(ipc, IPC_CHANNELS.PROXY_RESTART, {}),
    proxyStatus: () => invokeChannel(ipc, IPC_CHANNELS.PROXY_STATUS, {}),
    tokenSave: (token: string) => invokeChannel(ipc, IPC_CHANNELS.TOKEN_SAVE, { token }),
    tokenClear: () => invokeChannel(ipc, IPC_CHANNELS.TOKEN_CLEAR, {}),
    logsSubscribe: (cursor?: string) => invokeChannel(ipc, IPC_CHANNELS.LOGS_SUBSCRIBE, { cursor }),
  };
}

declare global {
  interface Window {
    puterDesktopApi: DesktopBridgeApi;
  }
}

export { IPC_CHANNELS };
