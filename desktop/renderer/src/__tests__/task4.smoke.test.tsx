import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { App } from "../App";

const mockApi = {
  proxyStart: vi.fn(),
  proxyStop: vi.fn(),
  proxyRestart: vi.fn(),
  proxyStatus: vi.fn(),
  tokenSave: vi.fn(),
  tokenClear: vi.fn(),
  logsSubscribe: vi.fn(),
};

describe("Task 4 renderer smoke", () => {
  beforeEach(() => {
    mockApi.proxyStatus.mockResolvedValue({
      ok: true,
      request_id: "req_status",
      data: { status: "stopped" },
    });
    mockApi.logsSubscribe.mockResolvedValue({
      ok: true,
      request_id: "req_logs",
      data: { subscribed: true, channel: "logs", entries: [] },
    });
    mockApi.proxyStart.mockResolvedValue({ ok: true, request_id: "req_start", data: { status: "running" } });
    mockApi.proxyStop.mockResolvedValue({ ok: true, request_id: "req_stop", data: { status: "stopped" } });
    mockApi.proxyRestart.mockResolvedValue({ ok: true, request_id: "req_restart", data: { status: "running" } });
    mockApi.tokenSave.mockResolvedValue({ ok: true, request_id: "req_save", data: { saved: true } });
    mockApi.tokenClear.mockResolvedValue({ ok: true, request_id: "req_clear", data: { cleared: true } });
    window.puterDesktopApi = mockApi;
  });

  it("renders required navigation and test ids", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByTestId("nav-overview")).toBeInTheDocument();
    expect(screen.getByTestId("nav-proxy-control")).toBeInTheDocument();
    expect(screen.getByTestId("nav-models")).toBeInTheDocument();
    expect(screen.getByTestId("nav-logs")).toBeInTheDocument();
    expect(screen.getByTestId("nav-settings")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("proxy-status")).toHaveTextContent("stopped");
    });
  });

  it("supports token save flow and lifecycle controls", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByTestId("token-input"), "pt_valid_token");
    await user.click(screen.getByTestId("save-token"));

    await waitFor(() => {
      expect(screen.getByTestId("token-saved")).toBeInTheDocument();
      expect(mockApi.tokenSave).toHaveBeenCalled();
    });

    await user.click(screen.getByTestId("nav-proxy-control"));
    await user.click(screen.getByTestId("start-proxy"));

    await waitFor(() => {
      expect(mockApi.proxyStart).toHaveBeenCalled();
    });

    await user.click(screen.getByTestId("restart-proxy"));
    await user.click(screen.getByTestId("stop-proxy"));

    await waitFor(() => {
      expect(mockApi.proxyRestart).toHaveBeenCalled();
      expect(mockApi.proxyStop).toHaveBeenCalled();
    });
  });
});
