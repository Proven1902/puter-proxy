import type { ProxyStatusPayload } from "../lib/ipc-client";

interface OverviewProps {
  status: ProxyStatusPayload;
  logsCount: number;
}

export function Overview({ status, logsCount }: OverviewProps) {
  return (
    <section className="page" data-testid="page-overview">
      <h2>Overview</h2>
      <div className="grid">
        <article className="card">
          <h3>Proxy status</h3>
          <p>Current: {status.status}</p>
          <p>PID: {status.pid ?? "n/a"}</p>
          <p>Retries in window: {status.retries_in_window ?? 0}</p>
        </article>
        <article className="card">
          <h3>Recent logs</h3>
          <p>Total buffered lines: {logsCount}</p>
          <p>Use Logs page for detailed tail view.</p>
        </article>
      </div>
    </section>
  );
}
