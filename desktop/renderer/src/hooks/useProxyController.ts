import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  desktopIpcClient,
  type IpcErrorBody,
  type IpcLogEntry,
  type ProxyStatusPayload,
} from "../lib/ipc-client";

type BannerLevel = "error" | "warning" | "info";

export interface UiBanner {
  level: BannerLevel;
  code: string;
  message: string;
}

function mapError(error: IpcErrorBody): UiBanner {
  if (error.code === "unauthorized" || error.code === "token_missing") {
    return {
      level: "error",
      code: error.code,
      message: "Token invalid or missing. Save a valid Puter token to continue.",
    };
  }

  if (error.code === "proxy_unavailable" || error.code === "port_in_use") {
    return {
      level: "warning",
      code: error.code,
      message: "Proxy unavailable. Check lifecycle controls and host/port configuration.",
    };
  }

  return {
    level: "error",
    code: error.code,
    message: error.message,
  };
}

export function useProxyController() {
  const [status, setStatus] = useState<ProxyStatusPayload>({ status: "stopped", token_masked: false });
  const [logs, setLogs] = useState<IpcLogEntry[]>([]);
  const [banner, setBanner] = useState<UiBanner | null>(null);
  const [busy, setBusy] = useState(false);
  const [tokenMasked, setTokenMasked] = useState(false);
  const [tokenSavedToast, setTokenSavedToast] = useState(false);
  const lastCursorRef = useRef<string | undefined>(undefined);
  const busyRef = useRef(false);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const setBusyState = useCallback((value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  }, []);

  const refreshStatus = useCallback(async () => {
    if (busyRef.current) {
      return;
    }

    const response = await desktopIpcClient.proxyStatus();
    if (!response.ok) {
      setBanner(mapError(response.error));
      return;
    }
    setStatus(response.data);
    setTokenMasked(Boolean(response.data.token_masked));
  }, []);

  const refreshLogs = useCallback(async () => {
    const response = await desktopIpcClient.logsSubscribe(lastCursorRef.current);
    if (!response.ok) {
      setBanner(mapError(response.error));
      return;
    }

    if (response.data.entries.length > 0) {
      const newest = response.data.entries[response.data.entries.length - 1];
      lastCursorRef.current = newest.ts;
      setLogs((prev) => [...prev, ...response.data.entries].slice(-400));
    }
  }, []);

  const handlePollingError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : "Background refresh failed";
    setBanner((previous) =>
      previous ?? {
        level: "warning",
        code: "refresh_failed",
        message,
      },
    );
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== undefined) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    refreshStatus().catch(handlePollingError);
    refreshLogs().catch(handlePollingError);

    const timer = window.setInterval(() => {
      refreshStatus().catch(handlePollingError);
      refreshLogs().catch(handlePollingError);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [handlePollingError, refreshLogs, refreshStatus]);

  const invokeLifecycle = useCallback(async (action: "start" | "stop" | "restart") => {
    setBusyState(true);
    try {
      const response =
        action === "start"
          ? await desktopIpcClient.proxyStart()
          : action === "stop"
            ? await desktopIpcClient.proxyStop()
            : await desktopIpcClient.proxyRestart();

      if (!response.ok) {
        setBanner(mapError(response.error));
        return;
      }

      setStatus(response.data);
      setBanner(null);
    } finally {
      setBusyState(false);
    }
  }, [setBusyState]);

  const saveToken = useCallback(async (token: string) => {
    setBusyState(true);
    try {
      const response = await desktopIpcClient.tokenSave(token);
      if (!response.ok) {
        setBanner(mapError(response.error));
        return false;
      }

      setTokenMasked(true);
      setStatus((previous) => ({ ...previous, token_masked: true }));
      setTokenSavedToast(true);
      setBanner(null);
      if (toastTimerRef.current !== undefined) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setTokenSavedToast(false);
        toastTimerRef.current = undefined;
      }, 2000);
      return true;
    } finally {
      setBusyState(false);
    }
  }, [setBusyState]);

  const clearToken = useCallback(async () => {
    setBusyState(true);
    try {
      const response = await desktopIpcClient.tokenClear();
      if (!response.ok) {
        setBanner(mapError(response.error));
        return false;
      }

      setTokenMasked(false);
      setStatus((previous) => ({ ...previous, token_masked: false }));
      setBanner(null);
      return true;
    } finally {
      setBusyState(false);
    }
  }, [setBusyState]);

  const streamUnsupportedBanner = useMemo<UiBanner>(
    () => ({
      level: "warning",
      code: "streaming_not_supported",
      message: "stream=true is not supported in MVP. Use non-streaming requests.",
    }),
    [],
  );

  return {
    status,
    logs,
    busy,
    banner,
    tokenMasked,
    tokenSavedToast,
    streamUnsupportedBanner,
    setBanner,
    invokeLifecycle,
    saveToken,
    clearToken,
    refreshStatus,
    refreshLogs,
  };
}
