import type { IpcLogEntry } from "../lib/ipc-client";

interface LogsProps {
  logs: IpcLogEntry[];
}

export function Logs({ logs }: LogsProps) {
  return (
    <section className="page" data-testid="page-logs">
      <h2>Logs</h2>
      <div className="card">
        <p>Live proxy tail (redacted) from main-process log buffer.</p>
        <ul className="log-list" data-testid="logs-panel">
          {logs.length === 0 ? <li>No logs yet</li> : null}
          {logs.map((entry, idx) => (
            <li key={`${entry.ts}-${idx}`}>
              <code>{entry.ts}</code> [{entry.level}] {entry.event} — {entry.message}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
