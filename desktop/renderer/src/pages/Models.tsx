import type { ProxyStatusPayload } from "../lib/ipc-client";

interface ModelsProps {
  status: ProxyStatusPayload;
}

export function Models({ status }: ModelsProps) {
  return (
    <section className="page" data-testid="page-models">
      <h2>Models</h2>
      <div className="card">
        <p>Model listing is served by <code>/v1/models</code> via proxy.</p>
        <p>
          Current proxy state: <strong>{status.status}</strong>
        </p>
        <p>Use this page as the operator surface for model diagnostics in Task 4+.</p>
      </div>
    </section>
  );
}
