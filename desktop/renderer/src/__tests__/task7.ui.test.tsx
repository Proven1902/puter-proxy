import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("Task 7 UI/state tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockApi.proxyStatus.mockResolvedValue({
      ok: true,
      request_id: "req_status",
      data: { status: "stopped", token_masked: false },
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

  afterEach(() => {
    Reflect.deleteProperty(window, "puterDesktopApi");
  });

  it("renders unauthorized banner from proxy status error", async () => {
    mockApi.proxyStatus.mockResolvedValueOnce({
      ok: false,
      request_id: "req_status_err",
      error: {
        code: "token_missing",
        message: "missing token",
      },
    });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    const banner = await screen.findByTestId("api-error");
    expect(banner).toHaveTextContent("Token invalid or missing");
  });

  it("applies lifecycle transition calls from proxy control page", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("nav-proxy-control"));
    await user.click(screen.getByTestId("start-proxy"));
    await user.click(screen.getByTestId("restart-proxy"));
    await user.click(screen.getByTestId("stop-proxy"));

    expect(mockApi.proxyStart).toHaveBeenCalledTimes(1);
    expect(mockApi.proxyRestart).toHaveBeenCalledTimes(1);
    expect(mockApi.proxyStop).toHaveBeenCalledTimes(1);
  });
});
