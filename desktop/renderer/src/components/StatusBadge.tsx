import type { ProxyStatusPayload } from "../lib/ipc-client";

interface StatusBadgeProps {
  status: ProxyStatusPayload;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone =
    status.status === "running"
      ? "status-badge status-running"
      : status.status === "starting"
        ? "status-badge status-starting"
        : status.status === "error"
          ? "status-badge status-error"
          : "status-badge status-stopped";

  return (
    <span className={tone} data-testid="proxy-status">
      {status.status}
    </span>
  );
}
