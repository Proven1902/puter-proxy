import { NavLink, Route, Routes } from "react-router-dom";

import { Banner } from "./components/Banner";
import { StatusBadge } from "./components/StatusBadge";
import { TokenForm } from "./components/TokenForm";
import { useProxyController } from "./hooks/useProxyController";
import { Logs } from "./pages/Logs";
import { Models } from "./pages/Models";
import { Overview } from "./pages/Overview";
import { ProxyControl } from "./pages/ProxyControl";
import { Settings } from "./pages/Settings";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/proxy-control", label: "Proxy Control" },
  { to: "/models", label: "Models" },
  { to: "/logs", label: "Logs" },
  { to: "/settings", label: "Settings" },
];

export function App() {
  const {
    status,
    logs,
    banner,
    busy,
    tokenMasked,
    tokenSavedToast,
    streamUnsupportedBanner,
    invokeLifecycle,
    saveToken,
    clearToken,
  } = useProxyController();

  return (
    <div className="layout" data-testid="app-shell">
      <aside className="sidebar">
        <h1>Puter Proxy</h1>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h2>Desktop Control Plane</h2>
            <p>Windows-first local proxy operator UI</p>
          </div>
          <StatusBadge status={status} />
        </header>

        {banner ? <Banner banner={banner} testId="api-error" /> : null}
        <Banner banner={streamUnsupportedBanner} testId="stream-unsupported-banner" />

        {tokenSavedToast ? (
          <div className="toast" data-testid="token-saved">
            Token saved securely
          </div>
        ) : null}

        <TokenForm busy={busy} tokenMasked={tokenMasked} onSave={saveToken} onClear={clearToken} />

        <Routes>
          <Route path="/" element={<Overview status={status} logsCount={logs.length} />} />
          <Route
            path="/proxy-control"
            element={
              <ProxyControl
                status={status}
                busy={busy}
                onStart={() => invokeLifecycle("start")}
                onStop={() => invokeLifecycle("stop")}
                onRestart={() => invokeLifecycle("restart")}
              />
            }
          />
          <Route path="/models" element={<Models status={status} />} />
          <Route path="/logs" element={<Logs logs={logs} />} />
          <Route
            path="/settings"
            element={
              <Settings lifecycleTuningNote="Task 4 includes lifecycle timing tuning under rapid UI-driven transitions." />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
