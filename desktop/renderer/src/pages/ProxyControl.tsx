import type { ProxyStatusPayload } from "../lib/ipc-client";

interface ProxyControlProps {
  status: ProxyStatusPayload;
  busy: boolean;
  onStart(): Promise<void>;
  onStop(): Promise<void>;
  onRestart(): Promise<void>;
}

export function ProxyControl({ status, busy, onStart, onStop, onRestart }: ProxyControlProps) {
  return (
    <section className="page" data-testid="page-proxy-control">
      <h2>Proxy Control</h2>
      <div className="card">
        <p>Lifecycle controls for local proxy process.</p>
        <p data-testid="proxy-status-detail">Status: {status.status}</p>
        <div className="actions">
          <button type="button" data-testid="start-proxy" disabled={busy} onClick={() => void onStart()}>
            Start Proxy
          </button>
          <button type="button" data-testid="stop-proxy" disabled={busy} onClick={() => void onStop()}>
            Stop Proxy
          </button>
          <button type="button" data-testid="restart-proxy" disabled={busy} onClick={() => void onRestart()}>
            Restart Proxy
          </button>
        </div>
      </div>
    </section>
  );
}
