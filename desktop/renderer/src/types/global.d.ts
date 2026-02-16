export {};

declare global {
  interface Window {
    puterDesktopApi: {
      proxyStart: () => Promise<unknown>;
      proxyStop: () => Promise<unknown>;
      proxyRestart: () => Promise<unknown>;
      proxyStatus: () => Promise<unknown>;
      tokenSave: (token: string) => Promise<unknown>;
      tokenClear: () => Promise<unknown>;
      logsSubscribe: (cursor?: string) => Promise<unknown>;
    };
  }
}
