import { contextBridge, ipcRenderer } from "electron";

import { createDesktopBridgeApi } from "./api";

const api = createDesktopBridgeApi({
  invoke: async <T = unknown>(channel: string, payload?: unknown): Promise<T> => {
    return await ipcRenderer.invoke(channel, payload) as T;
  },
});

contextBridge.exposeInMainWorld("puterDesktopApi", api);
