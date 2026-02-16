import type { DesktopIpcClient } from "../lib/ipc-client";

export {};

declare global {
  interface Window {
    puterDesktopApi: DesktopIpcClient;
  }
}
