import { app, BrowserWindow, ipcMain } from "electron";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { registerIpcHandlers } from "./index";

function createMainWindow(): BrowserWindow {
  const preloadPath = resolve(__dirname, "..", "preload", "runtime.js");
  if (!existsSync(preloadPath)) {
    throw new Error(`Preload entrypoint not found: ${preloadPath}`);
  }
  const rendererCandidates = [
    resolve(__dirname, "..", "..", "..", "renderer", "dist", "index.html"),
    resolve(__dirname, "..", "renderer", "dist", "index.html"),
  ];
  const rendererPath = rendererCandidates.find((candidate) => existsSync(candidate));

  if (!rendererPath) {
    throw new Error("Renderer entrypoint not found in packaged runtime");
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: preloadPath,
    },
  });

  void win.loadFile(rendererPath);
  return win;
}

app.whenReady().then(() => {
  registerIpcHandlers(ipcMain);
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
