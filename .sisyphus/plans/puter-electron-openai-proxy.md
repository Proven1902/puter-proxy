# Electron UI + Local OpenAI-Compatible Proxy for Puter (Windows MVP)

## TL;DR

> **Quick Summary**: Build a Windows-first desktop app (Electron + React + TypeScript) that manages a local FastAPI/uvicorn proxy exposing OpenAI-compatible endpoints backed by Puter.
>
> **Deliverables**:
> - Electron desktop control plane (start/stop/restart/status/logs)
> - Local FastAPI proxy with `/healthz`, `/v1/models`, `/v1/chat/completions` (non-streaming)
> - Secure token storage and structured redacted logging
> - Automated tests (tests-after) + agent-executed QA scenarios
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 6 → Task 5 → Task 7 → Task 8

---

## Context

### Original Request
Create an app with TypeScript UI that controls a local OpenAI-compatible proxy (FastAPI/uvicorn) for Puter, starting from an existing Python sample.

### Interview Summary
**Key Discussions**:
- User selected **Electron** (after comparing with Tauri and Oracle recommendation)
- Platform target is **Windows-first**
- MVP API scope is **`/v1/chat/completions` + `/v1/models`**
- Auth mode is **manual Puter token input**
- Test strategy is **tests-after** (not TDD), with mandatory agent-executed QA
- UI baseline for implementation selected from user designs: **`puter-designs/react-app7.js`**

**Research Findings**:
- Sample (`https://pastebin.com/raw/yt9NEzah`) is a CLI client, not a proxy server.
- Puter model IDs may require alias normalization (`listModels` aliases/cost metadata).
- Puter supports streaming on `chat`, but MVP can safely defer streaming.
- User-pays model implies careful per-user token handling and safe local boundaries.

### Metis Review
**Identified Gaps (addressed here):**
- Python runtime packaging ambiguity → defaulted in this plan (see Defaults Applied).
- `stream=true` behavior was undefined → explicitly 501 in MVP.
- Logging/redaction/token persistence guardrails were missing → now explicit.
- Acceptance checks needed to be command-executable → now included per task.

### UI Baseline Decision (Design Selection)
- **Chosen baseline design**: `puter-designs/react-app7.js`
- **Why chosen**: best desktop-first information architecture and strongest alignment with operator workflow
  (proxy lifecycle + token/security + models + test request + live logs).

**Adopt 1:1 from baseline**:
- Sidebar + top header layout
- Dashboard card composition
- Operational panel grouping (status/security/models/test/logs)

**Required adjustments during implementation**:
- Add explicit inline error/warn banners for:
  - invalid token
  - proxy unavailable
  - `stream=true` unsupported in MVP
- Increase contrast for small muted metadata text and logs for long-session readability.
- Add dedicated `Proxy Control` page with restart policy/diagnostics details (while keeping dashboard quick controls).
- Keep all operational actions discoverable via stable `data-testid` selectors.

---

## Work Objectives

### Core Objective
Deliver a reliable local bridge so OpenAI-compatible clients can call Puter through a desktop-managed localhost proxy with strong operational safety.

### Concrete Deliverables
- `desktop/` Electron + React + TypeScript app
- `proxy/` FastAPI service exposing:
  - `GET /healthz`
  - `GET /v1/models`
  - `POST /v1/chat/completions` (non-streaming only)
- Secure token persistence in OS keychain (or encrypted store abstraction)
- Structured logs with redaction and UI log tail viewer
- Windows packaging scripts + runbook

### Definition of Done
- [ ] Desktop app can start/stop/restart local proxy from UI (`task-3` and `task-4` lifecycle scenarios pass).
- [ ] `GET /v1/models` and `POST /v1/chat/completions` return OpenAI-compatible JSON contracts (contract checks pass in Task 2 + Task 7).
- [ ] `stream=true` returns explicit structured `501` JSON error with `streaming_not_supported: true`.
- [ ] Secret redaction gate passes (0 leaked token matches across logs/evidence outputs).
- [ ] Final verification contract passes (`test` + `lint` + `build` + evidence checks) and artifacts exist in `.sisyphus/evidence/`.

### Must Have
- Local bind only (`127.0.0.1`), no LAN exposure.
- Strict IPC allowlist between renderer and Electron main.
- Stable structured error model for API failures.
- Entire MVP codebase, CI, docs, and release artifacts must live in **one canonical repository**: `https://github.com/Proven1902/puter-proxy`.

### Must NOT Have (Guardrails)
- No extra OpenAI routes in MVP (`embeddings/images/audio/files/responses` out of scope).
- No OAuth/device-flow auth in MVP (manual token only).
- No manual human verification steps in acceptance criteria.
- No request body/token persistence in plaintext logs.

### Scope Boundaries (IN / OUT)

**IN SCOPE (MVP)**
- Electron desktop control app (Windows-first) with renderer + preload + main process split.
- Local FastAPI proxy sidecar bound to `127.0.0.1` only.
- Endpoints: `GET /healthz`, `GET /v1/models`, `POST /v1/chat/completions` (`stream:false` only).
- Deterministic structured rejection for `stream:true` (`501`, canonical error payload).
- Secure token persistence and redacted logs.
- Agent-executed QA evidence in `.sisyphus/evidence/`.

**OUT OF SCOPE (MVP)**
- Any additional OpenAI-compatible routes (embeddings/images/audio/files/responses).
- Streaming/SSE implementation.
- OAuth/device-flow/multi-profile auth UX.
- Cross-platform packaging beyond Windows.
- Billing dashboards, auto-update, remote deployment.

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> All verification must be agent-executed via commands/tools. No manual testing.

### Test Decision
- **Infrastructure exists**: NO (new project)
- **Automated tests**: YES (Tests-after)
- **Framework**:
  - Proxy: `pytest` + `httpx`
  - Desktop/UI logic: `vitest`
  - End-to-end desktop/browser validation: Playwright-driven UI checks

### Agent-Executed QA Scenarios (applies to all tasks)
- UI flows: Playwright (via desktop/web shell where applicable)
- API flows: `curl`/`httpie` + JSON assertions
- Process/lifecycle: CLI commands + status/log assertions

### Deterministic Verification Contract (Global Release Gate)

All checks below must pass (`exit code 0`) before Task 8 is considered complete.

| Check | Command (expected to exist by end of implementation) | Expected Result |
|---|---|---|
| Desktop build | `npm --prefix desktop run build` | Exit `0`; build artifacts generated |
| Windows package build | `npm --prefix desktop run dist:win` | Exit `0`; `.exe` artifact generated in `desktop/dist/` |
| Desktop lint | `npm --prefix desktop run lint` | Exit `0`; no lint violations |
| Desktop tests | `npm --prefix desktop run test` | Exit `0`; failures `= 0` |
| Proxy tests | `python -m pytest proxy/tests -q` | Exit `0`; failures `= 0` |
| Health contract | `curl -sS -f http://127.0.0.1:11435/healthz` | JSON includes `status: "ok"` |
| Models contract | `curl -sS -f http://127.0.0.1:11435/v1/models` | JSON has non-empty `data[]` and each item has `id` |
| Chat non-stream contract | `curl -sS -f -X POST http://127.0.0.1:11435/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"gpt-5-nano","messages":[{"role":"user","content":"ping"}],"stream":false}'` | JSON includes `id/object/model/choices[0].message.role/content` |
| Stream rejection contract | `curl -sS -o .sisyphus/evidence/verify-stream-reject.json -w "%{http_code}" -X POST http://127.0.0.1:11435/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"gpt-5-nano","messages":[{"role":"user","content":"ping"}],"stream":true}'` | HTTP `501`; response has `error.code=streaming_not_supported` and `streaming_not_supported=true` |
| Unsupported route rejection | `curl -sS -o .sisyphus/evidence/verify-unsupported-route.json -w "%{http_code}" -X POST http://127.0.0.1:11435/v1/embeddings -H "Content-Type: application/json" -d '{"input":"ping","model":"text-embedding-3-small"}'` | HTTP `404` with structured error object |
| Redaction gate | `python -m pytest proxy/tests -q -k redaction` | Exit `0`; no secret leakage assertions |
| Evidence manifest | `python -c "import json;json.load(open('.sisyphus/evidence/manifest.json','r',encoding='utf-8'));print('ok')"` | Prints `ok`; manifest is valid JSON and includes all required artifacts |
| Packaged runtime smoke | `npm --prefix desktop run smoke:packaged` | Exit `0`; packaged app can start proxy and serve `/healthz` |

Failure of any single check is a release blocker.

---

## Execution Strategy

### Parallel Execution Waves

```text
Wave 1 (Start Immediately)
└── Task 1: Scaffold project + runtime contracts

Wave 2 (After Wave 1)
├── Task 3: Proxy process manager skeleton in Electron main
└── Task 2: FastAPI OpenAI-compatible endpoints (non-streaming)

Wave 3 (After Wave 2)
├── Task 4: React control UI for lifecycle/logs/token input
└── Task 6: Logging/redaction/error-shape hardening

Wave 4 (After Wave 3)
└── Task 5: Secure token persistence + config plumbing

Wave 5 (After Wave 4)
└── Task 7: Tests-after implementation

Wave 6 (Final)
└── Task 8: Packaging + final QA bundle

Critical Path: 1 → 2 → 3 → 4 → 6 → 5 → 7 → 8
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|----------------------|
| 1 | None | 2,3,4,5 | None |
| 2 | 1 | 5,6,7,8 | 3 |
| 3 | 1 | 4,5,8 | 2 |
| 4 | 1,2,3 | 7,8 | 6 |
| 5 | 2,3,6 | 7,8 | None |
| 6 | 2 | 5,7,8 | 4 |
| 7 | 2,4,5,6 | 8 | None |
| 8 | 3,4,5,6,7 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|--------------------|
| 1 | 1 | `task(category="unspecified-high")` |
| 2 | 2, 3 | Backend/API + process-control split |
| 3 | 4, 6 | UI + API hardening split |
| 4 | 5 | Security/token plumbing |
| 5 | 7 | Automated tests and contract validation |
| 6 | 8 | Packaging/final QA |

### Execution Locks (must pass before next wave)

- **Gate G1 (after Wave 1)**: project scaffold + IPC contract skeleton exists and dev boot commands are defined.
- **Gate G2 (after Wave 2)**: ProxyManager lifecycle and core API routes (`/healthz`, `/v1/models`, `/v1/chat/completions`) are operational.
- **Gate G3 (after Wave 3)**: structured error schema + localhost guardrail + UI lifecycle surfaces are verifiably wired.
- **Gate G4 (after Wave 4)**: secure token path is green and redaction checks pass.
- **Gate G5 (after Wave 5)**: automated tests and contract checks are green.
- **Gate G6 (final)**: packaged build, evidence manifest, and all deterministic verification checks pass.

No wave may begin until prior gate is fully green.

---

## TODOs

### File & Module Ownership Map (Deterministic)

Use this as the authoritative file layout and ownership guide to prevent drift.

```text
CONFIG.md                        # Task 1 owner (single config contract source)
desktop/
  package.json                   # Task 1/8 owner (scripts: dev/build/dist/smoke)
  electron-builder.yml           # Task 8 owner (Windows packaging config)
  main/
    config.ts                    # Task 1 owner (runtime config + PROXY_FEATURE_ENABLED toggle)
    proxy-manager.ts            # Task 3 owner
    ipc.ts                      # Task 3 owner (strict allowlist)
    security-store.ts           # Task 5 owner
    log-bridge.ts               # Task 6 owner
  preload/
    api.ts                      # Task 1 owner (typed bridge contract)
  renderer/src/
    pages/
      Overview.tsx              # Task 4 owner
      ProxyControl.tsx          # Task 4 owner
      Models.tsx                # Task 4 owner
      Logs.tsx                  # Task 4 owner
      Settings.tsx              # Task 4 owner
    lib/ipc-client.ts           # Task 4 owner (typed IPC usage)
proxy/
  app/
    main.py                     # Task 1 owner
    routes/
      healthz.py                # Task 2 owner
      models.py                 # Task 2 owner
      chat_completions.py       # Task 2 owner
    schemas/
      openai.py                 # Task 2 owner
      error.py                  # Task 6 owner (canonical error contract)
    adapters/
      puter_client.py           # Task 2 owner
    services/
      auth.py                   # Task 5 owner
      redaction.py              # Task 6 owner
    config.py                   # Task 1 owner
  logs/
    latest.log                  # Task 5/6 owner (redaction scan target)
desktop/tests/
  e2e/                          # Task 7 owner (Playwright)
proxy/tests/                    # Task 7 owner (pytest)
.sisyphus/evidence/             # Task 8 owner (manifest + artifacts)
```

#### Ownership Rules
- Task owners may modify only their listed modules unless a dependency task explicitly permits joint edits.
- Shared contracts (`proxy/app/schemas/error.py`, `desktop/main/ipc.ts`) require corresponding acceptance criteria updates in affected tasks.
- Renderer must never directly spawn processes or read secure storage (main-process only).

#### Cross-Process Contract (v1)
- Allowed renderer→main channels (strict allowlist): `proxy.start`, `proxy.stop`, `proxy.restart`, `proxy.status`, `token.save`, `token.clear`, `logs.subscribe`.
- All other channels must be rejected deterministically.
- IPC response envelope must be exactly one of:
  - `{ "ok": true, "data": { ... }, "request_id": "..." }`
  - `{ "ok": false, "error": { "code": "...", "message": "...", "details": { ... }, "request_id": "..." } }`

- [ ] 1. Scaffold workspace and baseline contracts

  **What to do**:
  - Create project layout (`desktop/`, `proxy/`, shared `schemas/` or contracts doc).
  - Define environment/config contract (`PORT`, `PUTER_TOKEN`, log level, host).
  - Add run scripts for desktop dev and proxy dev.
  - Add deterministic smoke scripts in `desktop/package.json`: `smoke:dev` and `smoke:packaged`.

  **Must NOT do**:
  - Do not include non-MVP endpoints.
  - Do not default proxy bind to `0.0.0.0`.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: multi-component foundational setup.
  - **Skills**: `frontend-ui-ux`, `dev-browser`
    - `frontend-ui-ux`: for desktop UI shell structure decisions.
    - `dev-browser`: for fast UI smoke validation setup.
  - **Skills Evaluated but Omitted**:
    - `playwright`: deferred to QA-focused tasks.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (standalone)
  - **Blocks**: 2, 3, 4, 5
  - **Blocked By**: None

  **References**:
  - `https://pastebin.com/raw/yt9NEzah` - Existing request envelope and model usage context.
  - `https://docs.puter.com/AI/chat/` - Upstream chat parameter and streaming semantics.
  - `https://docs.puter.com/AI/listModels/` - Upstream model catalog structure and aliases.

  **Acceptance Criteria**:
  - [ ] `CONFIG.md` exists and defines `HOST`, `PORT`, `PUTER_TOKEN`, `LOG_LEVEL`, `PROXY_FEATURE_ENABLED` (verified by: `python -c "from pathlib import Path; t=Path('CONFIG.md').read_text(encoding='utf-8'); keys=['HOST','PORT','PUTER_TOKEN','LOG_LEVEL','PROXY_FEATURE_ENABLED']; print('ok' if all(k in t for k in keys) else 'missing_keys')"` → `ok`).
  - [ ] File/module map from "File & Module Ownership Map" exists on disk (verified by: `python -c "from pathlib import Path; req=['desktop/main/config.ts','desktop/main/ipc.ts','desktop/preload/api.ts','proxy/app/main.py','proxy/app/config.py']; missing=[p for p in req if not Path(p).exists()]; print('ok' if not missing else missing)"` → `ok`).
  - [ ] IPC allowlist channels are declared in one canonical module and consumed by preload/main (verified by: `python -c "from pathlib import Path; t=Path('desktop/main/ipc.ts').read_text(encoding='utf-8'); ch=['proxy.start','proxy.stop','proxy.restart','proxy.status','token.save','token.clear','logs.subscribe']; print('ok' if all(c in t for c in ch) else 'missing_channels')"` → `ok`).
  - [ ] `npm --prefix desktop run smoke:dev` exists and exits `0` without interactive prompts.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Workspace starts dev services
    Tool: Bash
    Preconditions: Dependencies installed
    Steps:
      1. Run `npm --prefix desktop run smoke:dev > .sisyphus/evidence/task-1-dev-startup.txt 2>&1`
      2. Assert command exit code is `0`
      3. Assert output contains both markers: `desktop_ready=true` and `proxy_ready=true`
    Expected Result: Both services boot without config errors
    Failure Indicators: Missing env/config key errors or startup crash
    Evidence: .sisyphus/evidence/task-1-dev-startup.txt

  Scenario: Invalid config fails fast
    Tool: Bash
    Preconditions: Remove required env var (e.g., PORT)
    Steps:
      1. Run `python -c "import os,subprocess,sys; env=dict(os.environ); env.pop('PORT', None); sys.exit(subprocess.call([sys.executable,'-m','uvicorn','proxy.app.main:app','--host','127.0.0.1','--port','11435'], env=env))" > .sisyphus/evidence/task-1-invalid-config.txt 2>&1`
      2. Assert process exits non-zero
      3. Assert stderr includes `error.code=invalid_request` or explicit missing-config message
    Expected Result: Startup aborted with clear actionable message
    Evidence: .sisyphus/evidence/task-1-invalid-config.txt
  ```

- [ ] 2. Build FastAPI OpenAI-compatible MVP endpoints

  **What to do**:
  - Implement `GET /healthz`, `GET /v1/models`, `POST /v1/chat/completions`.
  - Translate OpenAI request schema → Puter `drivers/call` payload.
  - Normalize response to OpenAI-compatible `chat.completion` JSON.
  - Implement explicit `stream=true` rejection with structured `501` JSON.

  **Must NOT do**:
  - No SSE streaming implementation in MVP.
  - No embeddings/audio/files endpoints.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `quick`
    - `quick`: endpoint-focused implementation work.
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: not needed for backend API shaping.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: 5, 7, 8
  - **Blocked By**: 1

  **References**:
  - `https://docs.puter.com/AI/chat/` - Message formats, tools, stream semantics.
  - `https://docs.puter.com/AI/listModels/` - Model listing source of truth.
  - `https://docs.puter.com/user-pays-model/` - Auth/billing context for token handling expectations.

  **Acceptance Criteria**:
  - [ ] `GET /healthz` returns 200 with `{ "status": "ok" }`.
  - [ ] `GET /v1/models` returns OpenAI-style JSON object with keys `object="list"` and `data[]`; each item has non-empty `id`.
  - [ ] `POST /v1/chat/completions` with `stream:false` returns 200 JSON including `id`, `object="chat.completion"`, `model`, `choices[0].message.role`, and `choices[0].message.content`.
  - [ ] `stream:true` returns 501 JSON error with `error.code="streaming_not_supported"`, `error.request_id`, and `streaming_not_supported: true`.
  - [ ] Unsupported route probe (`POST /v1/embeddings`) returns 404 structured JSON error.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Chat completion happy path
    Tool: Bash (curl)
    Preconditions: Proxy running on localhost:11435, valid Puter token configured
    Steps:
      1. POST /v1/chat/completions with model + user message + stream:false
      2. Assert HTTP status 200
      3. Assert response.choices[0].message.content is non-empty string
      4. Save response body
    Expected Result: Valid OpenAI-compatible completion payload
    Evidence: .sisyphus/evidence/task-2-chat-success.json

  Scenario: Health and models contracts
    Tool: Bash (curl)
    Preconditions: Proxy running on localhost:11435
    Steps:
      1. Run `curl -sS -f http://127.0.0.1:11435/healthz > .sisyphus/evidence/task-2-health.json`
      2. Assert JSON contains `"status":"ok"`
      3. Run `curl -sS -f http://127.0.0.1:11435/v1/models > .sisyphus/evidence/task-2-models.json`
      4. Assert `.data` exists and each item contains non-empty `id`
    Expected Result: Base API contracts are valid and saved as evidence
    Evidence: .sisyphus/evidence/task-2-health.json, .sisyphus/evidence/task-2-models.json

  Scenario: Streaming explicitly rejected
    Tool: Bash (curl)
    Preconditions: Proxy running
    Steps:
      1. POST /v1/chat/completions with stream:true
      2. Assert HTTP status 501
      3. Assert JSON error key streaming_not_supported=true
    Expected Result: Deterministic non-streaming guardrail
    Evidence: .sisyphus/evidence/task-2-stream-reject.json
  ```

- [ ] 3. Implement Electron main-process ProxyManager

  **What to do**:
  - Implement start/stop/restart/status API in main process.
  - Spawn uvicorn child process with lifecycle state machine (`stopped/starting/running/error`).
  - Implement health polling and bounded restart backoff.

  **Must NOT do**:
  - No generic command execution IPC.
  - No direct renderer process spawning.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `dev-browser`
    - `dev-browser`: useful for validating desktop interaction loops.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: 4, 8
  - **Blocked By**: 1

  **References**:
  - Oracle architecture consultation (session `ses_39f7d880cffeTVFXiZOpcAUH3l`) - process control and security guardrails.
  - `https://docs.puter.com/security/` - user auth/security principles informing local safety defaults.

  **Acceptance Criteria**:
  - [ ] Start/stop/restart/status IPC endpoints work with strict allowlist; non-allowlisted channels are rejected.
  - [ ] Crash loop handling enters error state after bounded retries (max 3 attempts within 60 seconds).
  - [ ] Port collision (`127.0.0.1:11435` already in use) fails deterministically with `port_in_use` error code.
  - [ ] Missing Python runtime fails deterministically with `python_runtime_missing` error code.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Start-stop lifecycle from UI command path
    Tool: Playwright
    Preconditions: Desktop app running in dev mode
    Steps:
      1. Click button[data-testid="start-proxy"]
      2. Wait for badge[data-testid="proxy-status"] text "running"
      3. Click button[data-testid="stop-proxy"]
      4. Assert status badge returns "stopped"
      5. Screenshot evidence
    Expected Result: Deterministic lifecycle transitions
    Evidence: .sisyphus/evidence/task-3-lifecycle.png

  Scenario: Restart backoff on forced failure
    Tool: Bash + Playwright
    Preconditions: Inject bad proxy command path
    Steps:
      1. Trigger start
      2. Assert UI status becomes "error" after retry budget exhausted
      3. Assert logs include bounded retry count
    Expected Result: No infinite restart loop
    Evidence: .sisyphus/evidence/task-3-retry-failure.txt

  Scenario: Port collision returns deterministic error code
    Tool: Bash
    Preconditions: `127.0.0.1:11435` is occupied by a holder process
    Steps:
      1. Start holder: `python -m http.server 11435 > .sisyphus/evidence/task-3-port-holder.txt 2>&1`
      2. Trigger proxy start through manager command path
      3. Assert resulting error payload contains `error.code=port_in_use`
      4. Save error output to `.sisyphus/evidence/task-3-port-in-use.json`
    Expected Result: Collision is handled deterministically with canonical error code
    Evidence: .sisyphus/evidence/task-3-port-in-use.json

  Scenario: Missing Python runtime returns deterministic error code
    Tool: Bash
    Preconditions: Set invalid runtime path for manager process
    Steps:
      1. Run manager with `PYTHON_PATH=nonexistent-python-binary`
      2. Trigger proxy start
      3. Assert resulting error payload contains `error.code=python_runtime_missing`
      4. Save output to `.sisyphus/evidence/task-3-python-missing.json`
    Expected Result: Missing runtime is surfaced deterministically
    Evidence: .sisyphus/evidence/task-3-python-missing.json
  ```

- [ ] 4. Build React desktop control UI

  **What to do**:
  - Implement controls: token input/save, start/stop/restart, status indicator, log tail panel.
  - Add validation and inline error banners for invalid token/proxy unavailable states.

  **Must NOT do**:
  - No direct token display once saved (mask in UI).
  - No implicit background start without user action.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`, `playwright`
    - `frontend-ui-ux`: clear operational UI states.
    - `playwright`: interaction validation.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: 8
  - **Blocked By**: 1,2,3

  **References**:
  - `https://docs.puter.com/AI/listModels/` - model metadata for UI list rendering.
  - `https://docs.puter.com/user-pays-model/` - user-facing billing/auth explanation text.
  - `puter-designs/react-app7.js` - selected baseline visual structure to implement.
  - `puter-designs/react-app3.js` - optional inspiration for dense logs/action affordances.

  **Acceptance Criteria**:
  - [ ] Token field validates non-empty format and stores via secure action.
  - [ ] Status, error and loading states are visually distinct and deterministic (all mapped selectors present from Design QA Matrix).
  - [ ] UI parity with `react-app7.js` is proven by passing all relevant Design QA Matrix rows and evidence files (`ui-overview-initial.png`, `ui-navigation-routes.png`, `ui-proxy-running.png`, `ui-proxy-stopped.png`, `ui-proxy-error.png`).
  - [ ] Error/warn banners exist for invalid token, proxy-down, and stream-unsupported cases.
  - [ ] UI never directly accesses process spawn or secure store APIs (IPC-only).

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Save token then start proxy
    Tool: Playwright
    Preconditions: Desktop app running
    Steps:
      1. Fill input[data-testid="token-input"] with "pt_ValidTokenExample"
      2. Click button[data-testid="save-token"]
      3. Assert toast[data-testid="token-saved"] visible
      4. Click start proxy
      5. Assert status text "running"
    Expected Result: Token save + lifecycle flow succeeds
    Evidence: .sisyphus/evidence/task-4-token-start.png

  Scenario: Invalid token shows actionable error
    Tool: Playwright
    Preconditions: Proxy running with deliberately invalid token
    Steps:
      1. Trigger test chat request from UI
      2. Wait for alert[data-testid="api-error"]
      3. Assert alert contains "Unauthorized" and remediation hint
    Expected Result: Error surfaced without crash
    Evidence: .sisyphus/evidence/task-4-invalid-token.png
  ```

- [ ] 5. Add secure token persistence and request authorization plumbing

  **What to do**:
  - Store Puter token in Windows secure store abstraction (e.g., keytar-backed).
  - Ensure proxy requests use stored token at runtime only.
  - Mask/omit tokens from UI, logs, and process output.

  **Must NOT do**:
  - No plaintext token in config files.
  - No token echo in debug logs.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential)
  - **Blocks**: 7, 8
  - **Blocked By**: 2,3,6

  **References**:
  - `https://docs.puter.com/Objects/signinresult/` - token field semantics context.
  - `https://docs.puter.com/security/` - secure handling expectations.

  **Acceptance Criteria**:
  - [ ] Saved token is retrievable by app restart but never shown in plaintext.
  - [ ] API requests succeed using secure-store token retrieval path.
  - [ ] Logs contain no full token strings (verified against `proxy/logs/latest.log`).
  - [ ] In packaged MVP, secure store is the only persistent token source (env token allowed in dev mode only).

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Token persists across restart securely
    Tool: Playwright + Bash
    Preconditions: Token saved once
    Steps:
      1. Restart desktop app process
      2. Assert token input displays masked placeholder only
      3. Trigger chat request and assert success
    Expected Result: Secure persistence works without plaintext display
    Evidence: .sisyphus/evidence/task-5-persist-restart.txt

  Scenario: Redaction check on logs
    Tool: Bash
    Preconditions: Known token value used in test
    Steps:
      1. Execute request that would normally log headers
      2. Run `python -c "import pathlib,re; t=pathlib.Path('proxy/logs/latest.log').read_text(encoding='utf-8'); print(len(re.findall(r'pt_[A-Za-z0-9_-]+', t)))" > .sisyphus/evidence/task-5-redaction-check.txt`
      3. Assert output equals `0`
    Expected Result: No token leakage
    Evidence: .sisyphus/evidence/task-5-redaction-check.txt
  ```

- [ ] 6. Implement structured errors, logging, and guardrails

  **What to do**:
  - Define API error schema (code/message/details/request_id).
  - Add metadata-only structured logs (route,status,latency,model,request_id).
  - Enforce localhost bind guardrail at startup.

  **Must NOT do**:
  - No HTML/plaintext unstructured server errors.
  - No prompt/response body dump by default.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with 4)
  - **Blocks**: 7,8
  - **Blocked By**: 2

  **References**:
  - Metis guidance session `ses_39f778cacffe0VW3zK7HwJxqD8` - acceptance and guardrail requirements.

  **Acceptance Criteria**:
  - [ ] All error paths return stable JSON schema `{ error: { code, message, details?, request_id } }`.
  - [ ] Startup fails if host != `127.0.0.1` (no overrides allowed in MVP).
  - [ ] Error code set includes: `invalid_request`, `unauthorized`, `token_missing`, `model_not_found`, `streaming_not_supported`, `upstream_timeout`, `upstream_error`, `proxy_unavailable`, `port_in_use`, `python_runtime_missing`, `internal_error`.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Structured unauthorized error
    Tool: Bash (curl)
    Preconditions: Missing/invalid auth context
    Steps:
      1. Call /v1/models without required auth context
      2. Assert HTTP 401
      3. Assert JSON keys: code, message, request_id
    Expected Result: Stable machine-parseable error payload
    Evidence: .sisyphus/evidence/task-6-unauthorized.json

  Scenario: Localhost guardrail enforcement
    Tool: Bash
    Preconditions: Start proxy with HOST=0.0.0.0 in MVP mode
    Steps:
      1. Run startup command
      2. Assert startup exits non-zero
      3. Assert error message references localhost-only policy
    Expected Result: Unsafe bind prevented
    Evidence: .sisyphus/evidence/task-6-bind-guardrail.txt
  ```

- [ ] 7. Add tests-after implementation (proxy + desktop logic)

  **What to do**:
  - Add proxy tests for health/models/chat/error/stream rejection.
  - Add UI/state tests for lifecycle transitions and error rendering.
  - Add integration test for end-to-end desktop-managed request.

  **Must NOT do**:
  - No brittle tests requiring manual timing tweaks.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `playwright`, `quick`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (sequential)
  - **Blocks**: 8
  - **Blocked By**: 2,4,5,6

  **References**:
  - Puter API docs used in adapter behavior tests (`chat`, `listModels`).

  **Acceptance Criteria**:
  - [ ] Proxy tests pass.
  - [ ] UI/unit tests pass.
  - [ ] Integration test validates chat flow through desktop-managed proxy.
  - [ ] Contract tests assert unsupported route behavior (`/v1/embeddings` -> 404 structured error).
  - [ ] Contract tests assert `stream:true` rejection semantics (`501` + `streaming_not_supported`).

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Run full automated test suite
    Tool: Bash
    Preconditions: Test frameworks configured
    Steps:
      1. Run proxy test command
      2. Run desktop/ui test command
      3. Run integration test command
      4. Assert all exit code 0
    Expected Result: End-to-end green pipeline
    Evidence: .sisyphus/evidence/task-7-tests.txt

  Scenario: Regression check for stream rejection
    Tool: Bash
    Preconditions: Tests available
    Steps:
      1. Run targeted test for stream=true behavior
      2. Assert expected 501 semantics
    Expected Result: Non-streaming constraint remains enforced
    Evidence: .sisyphus/evidence/task-7-stream-test.txt
  ```

- [ ] 8. Package Windows MVP and run final agent QA pass

  **What to do**:
  - Build Windows distributable for desktop app.
  - Validate packaged app starts proxy and serves OpenAI-compatible routes.
  - Produce release checklist and known limitations note.
  - Ensure `desktop/package.json` defines `dist:win` and `smoke:packaged` scripts.

  **Must NOT do**:
  - No cross-platform packaging in this MVP.
  - No auto-update implementation in V1.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `playwright`, `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final sequential wave
  - **Blocks**: None
  - **Blocked By**: 3,4,5,6,7

  **References**:
  - All previous task outputs + evidence folder.

  **Acceptance Criteria**:
  - [ ] `npm --prefix desktop run dist:win` exits `0` and creates at least one `.exe` under `desktop/dist/`.
  - [ ] Packaged app launches and can control proxy lifecycle.
  - [ ] API smoke checks pass against packaged runtime.
  - [ ] `npm --prefix desktop run smoke:packaged` exits `0` and captures packaged runtime evidence.
  - [ ] Preflight checks detect runtime prerequisites and return deterministic error codes when missing.
  - [ ] Evidence bundle complete under `.sisyphus/evidence/` with a valid `manifest.json` listing required artifacts.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Packaged app happy path
    Tool: Playwright + Bash
    Preconditions: Windows package built
    Steps:
      1. Run `npm --prefix desktop run dist:win > .sisyphus/evidence/task-8-dist.txt 2>&1`
      2. Assert at least one `desktop/dist/*.exe` exists
      3. Launch packaged app
      4. Start proxy via UI
      5. Send chat request via curl to localhost endpoint
      6. Assert valid completion and running status badge
    Expected Result: Packaging does not break runtime behavior
    Evidence: .sisyphus/evidence/task-8-package-happy.txt

  Scenario: Packaged app handles missing token
    Tool: Playwright
    Preconditions: Secure store token removed
    Steps:
      1. Launch packaged app
      2. Attempt start + test request
      3. Assert clear token-required prompt and no crash
    Expected Result: Graceful failure with remediation path
    Evidence: .sisyphus/evidence/task-8-missing-token.png
  ```

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `chore(scaffold): initialize desktop+proxy workspace` | scaffold/config files | startup smoke commands |
| 2-3 | `feat(proxy): add openai-compatible mvp routes and manager` | proxy + main process files | api lifecycle smoke |
| 4-6 | `feat(ui): add controls security and structured errors` | renderer + logging/security files | ui/api QA scenarios |
| 7 | `test(core): add proxy and desktop automated coverage` | test files | full test suite |
| 8 | `build(windows): package mvp app and finalize qa evidence` | packaging/release files | packaged smoke checks |

---

## Git Workflow, Push, and PR Review Policy

### Canonical Repository (Mandatory)
- **Single source of truth**: `https://github.com/Proven1902/puter-proxy`
- All project components from this plan must be committed in that repository:
  - `desktop/`
  - `proxy/`
  - test suites
  - CI/workflows
  - `.sisyphus/evidence/` artifacts required by this plan
- Do not split this MVP across multiple repositories.

### Branching Policy
- `main` is the protected integration branch (no direct development work).
- Create feature branches from `main` for execution waves/tasks:
  - `feat/task-1-scaffold`
  - `feat/task-2-proxy-endpoints`
  - `feat/task-3-proxy-manager`
  - etc.
- Branch names must map clearly to TODO task numbers for auditability.

### Commit Policy (Execution Rules)
- Follow the existing **Commit Strategy** table in this plan.
- Commits must be:
  - atomic (single concern per commit),
  - traceable to task IDs,
  - verified locally before commit (task-specific checks).
- Prefer conventional commit style already defined in this plan (`chore(...)`, `feat(...)`, `test(...)`, `build(...)`).

### Push Policy
- Push every completed commit group to the corresponding remote feature branch.
- Use upstream tracking on first push (`git push -u origin <branch>`).
- Keep remote branch up to date with `main` before opening PR (rebase or merge, team preference).
- **Forbidden**:
  - force-push to `main`
  - bypassing required checks
- If rewrite is necessary on a feature branch, only use `--force-with-lease` and never on `main`.

### PR Review Policy (Mandatory)
- Every change set must go through PR into `main` (no direct push merge to `main`).
- Open PR when a wave or logically complete task group is ready.
- PR description must include:
  1. Scope (IN/OUT)
  2. Linked plan task IDs (e.g., `Task 2`, `Task 3`)
  3. Verification commands executed + outcomes
  4. Evidence artifact paths under `.sisyphus/evidence/`
  5. Known limitations and rollback notes (if applicable)
- Minimum merge gate:
  - all required CI checks green,
  - deterministic verification contract unchanged or improved,
  - at least one review approval (or explicit self-review note if solo-maintainer flow is used).

### PR Template (Copy/Paste)

Use this template for every PR targeting `main` in `https://github.com/Proven1902/puter-proxy`.

```markdown
## Summary
- [What changed and why]
- [Scope of this PR]

## Plan Mapping
- Plan: `.sisyphus/plans/puter-electron-openai-proxy.md`
- Tasks covered: [Task N, Task M]

## Scope Boundaries
- IN:
  - [Included item 1]
  - [Included item 2]
- OUT:
  - [Excluded item 1]
  - [Excluded item 2]

## Verification Executed
- [ ] `npm --prefix desktop run lint`
- [ ] `npm --prefix desktop run test`
- [ ] `npm --prefix desktop run build`
- [ ] `python -m pytest proxy/tests -q`
- [ ] `curl -sS -f http://127.0.0.1:11435/healthz`
- [ ] `curl -sS -f http://127.0.0.1:11435/v1/models`
- [ ] `curl -sS -f -X POST http://127.0.0.1:11435/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"gpt-5-nano","messages":[{"role":"user","content":"ping"}],"stream":false}'`
- [ ] `curl -sS -o .sisyphus/evidence/verify-stream-reject.json -w "%{http_code}" -X POST http://127.0.0.1:11435/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"gpt-5-nano","messages":[{"role":"user","content":"ping"}],"stream":true}'`
- [ ] `curl -sS -o .sisyphus/evidence/verify-unsupported-route.json -w "%{http_code}" -X POST http://127.0.0.1:11435/v1/embeddings -H "Content-Type: application/json" -d '{"input":"ping","model":"text-embedding-3-small"}'`

## Verification Results
- Outcome: [PASS/FAIL]
- Notes: [Any deviations or non-blocking observations]

## Evidence Artifacts
- `.sisyphus/evidence/[artifact-1]`
- `.sisyphus/evidence/[artifact-2]`
- `.sisyphus/evidence/manifest.json`

## Security & Guardrails Check
- [ ] Localhost-only bind (`127.0.0.1`) preserved
- [ ] No plaintext token leakage in logs/evidence
- [ ] Strict IPC allowlist preserved
- [ ] Out-of-scope endpoints remain unsupported in MVP

## Risks / Rollback
- Risks introduced: [none / list]
- Rollback plan: [commit/branch/release toggle details]

## Reviewer Checklist
- [ ] Scope aligns with mapped plan tasks
- [ ] Acceptance criteria for mapped tasks are satisfied
- [ ] Required checks are green
- [ ] Evidence artifacts are present and inspectable
- [ ] No guardrail regressions detected
```

### Merge Policy
- Preferred: **Squash merge** into `main` to keep history concise per task/wave.
- PR title should follow commit intent convention (e.g., `feat(proxy): openai-compatible mvp endpoints`).
- After merge:
  - delete feature branch,
  - sync local `main`,
  - start next task branch from updated `main`.

### Commit/Branch Naming Cheat Sheet

Use this quick reference to keep naming deterministic and review-friendly.

**Branch name format**
- `feat/task-{N}-{short-scope}` for feature delivery
- `fix/task-{N}-{short-scope}` for bug fixes within a planned task
- `test/task-{N}-{short-scope}` for test-only changes tied to a task

**Examples**
- `feat/task-2-proxy-endpoints`
- `feat/task-4-desktop-control-ui`
- `fix/task-3-port-in-use-error-code`
- `test/task-7-stream-rejection-contract`

**Commit message format**
- `<type>(<scope>): <imperative summary>`
- Types: `feat`, `fix`, `chore`, `test`, `build`, `docs`, `refactor`

**Examples aligned to this plan**
- `feat(proxy): add /v1/models and /v1/chat/completions mvp routes`
- `fix(main): return port_in_use on localhost collision`
- `feat(ui): add lifecycle controls and token-state banners`
- `test(proxy): cover stream=true 501 rejection contract`
- `build(windows): package electron mvp and attach qa evidence`

**PR title format**
- Prefer same pattern as final squashed commit:
  - `<type>(<scope>): <what + why>`
- Example:
  - `feat(proxy): implement openai-compatible mvp routes for desktop-managed puter bridge`

**Traceability rule**
- Every branch, commit group, and PR must reference plan task IDs in description/body.

### Reviewer Do/Don't Quick Block

Use this as a fast merge decision aid during PR review.

**DO**
- Verify PR scope matches declared task IDs (no hidden scope expansion).
- Require evidence links under `.sisyphus/evidence/` for all claimed scenarios.
- Confirm guardrails are preserved: localhost-only bind, strict IPC allowlist, token redaction.
- Check deterministic error contracts for modified API paths.
- Block merge if any required verification command is missing or failing.

**DON'T**
- Don’t approve PRs that introduce out-of-scope endpoints/features for MVP.
- Don’t accept manual-only verification statements without agent-executed evidence.
- Don’t allow plaintext secrets/tokens in logs, screenshots, fixtures, or PR comments.
- Don’t merge on “works locally” without CI/contract check parity.
- Don’t bypass review gates for convenience, even for small follow-up fixes.

### Definition of Ready for PR (DoR)

A PR is ready to open only when all items below are true.

- [ ] Branch naming follows policy (`feat/task-{N}-...`, `fix/task-{N}-...`, `test/task-{N}-...`).
- [ ] PR scope is limited to mapped task IDs from this plan (no hidden scope expansion).
- [ ] Local verification completed for relevant checks (lint/test/build/contracts as applicable).
- [ ] Required evidence artifacts are generated and stored in `.sisyphus/evidence/`.
- [ ] Security guardrails validated (localhost bind, IPC allowlist, token redaction).
- [ ] Out-of-scope MVP routes/features remain untouched or explicitly rejected.
- [ ] Rollback note prepared (what to revert/disable if issue appears post-merge).
- [ ] PR description is filled using the plan template with command outcomes.

If any checkbox is false, keep the branch in draft and do not request review yet.

### Definition of Done for PR (DoD)

A PR is merge-ready only when all items below are true.

- [ ] Required CI checks are green for the PR branch.
- [ ] All mapped task acceptance criteria are satisfied and reflected in PR summary.
- [ ] Deterministic verification contract checks relevant to the scope are passing.
- [ ] Evidence artifacts are complete, accessible, and listed in `.sisyphus/evidence/manifest.json`.
- [ ] Security guardrails verified with no regressions (localhost bind, IPC allowlist, token redaction).
- [ ] No out-of-scope MVP expansion introduced.
- [ ] Review comments are resolved (or explicitly documented with rationale).
- [ ] Rollback path is documented and feasible for the merged change set.
- [ ] At least one approval is present (or documented solo-maintainer self-review path used).

If any checkbox is false, PR remains open and must not be merged.

---

## Risks, Assumptions, and Rollback

### Assumptions Register (validated during execution)
- Puter-backed adapter mapping can reliably produce OpenAI-compatible JSON envelope for MVP endpoints.
- Windows execution environment includes supported Python runtime (target: CPython 3.11.x) and can launch uvicorn sidecar.
- Port `127.0.0.1:11435` is available in normal conditions; if occupied, deterministic failure is acceptable in MVP.
- Secure storage mechanism is available on target Windows hosts; if unavailable, startup must fail with explicit error.
- `PROXY_FEATURE_ENABLED` is read from `desktop/main/config.ts` and can disable proxy lifecycle actions deterministically.
- Model metadata from Puter may vary; MVP requires stable `id` mapping while optional metadata remains best-effort.

### Top Risks (execution blockers)
1. **Runtime coupling risk**: renderer/main/sidecar state desync causes stale status and flaky lifecycle controls.
   - Mitigation: strict IPC envelope, single owner (main process), deterministic status polling and request IDs.
2. **Packaging/runtime risk**: packaged app cannot locate Python/uvicorn at runtime.
   - Mitigation: startup preflight checks + explicit `python_runtime_missing` code + packaged smoke gate.
3. **Security leakage risk**: token appears in logs or evidence artifacts.
   - Mitigation: redaction tests + denylist scan gate + evidence manifest review.
4. **Secure-store availability risk**: target Windows host lacks usable secure store backend.
   - Mitigation: startup preflight emits deterministic error (`token_missing` or dedicated secure-store error), packaged release blocked until resolved.

### Rollback Plan (must exist before Task 8 release)

#### Rollback Triggers
- Any deterministic verification contract check fails after integration.
- Security redaction gate fails (token/secret leak detected).
- Packaging preflight failures cannot be resolved within release window.

#### Rollback Procedure
1. Revert to last known green commit group from Commit Strategy table.
2. Disable proxy feature path via release toggle (`PROXY_FEATURE_ENABLED=0`) read by `desktop/main/config.ts` for fallback packaging if needed.
3. Re-run minimum regression smoke:
   - `python -c "import os,subprocess,sys; env=dict(os.environ); env['PROXY_FEATURE_ENABLED']='0'; sys.exit(subprocess.call(['npm','--prefix','desktop','run','smoke:dev'], env=env))"` exits `0`
   - Playwright evidence confirms baseline shell renders and no proxy-start action is exposed
   - `curl -sS -f http://127.0.0.1:11435/healthz` fails when feature disabled (proxy not running)
4. Regenerate evidence artifacts marking rollback state in `.sisyphus/evidence/manifest.json`.

#### Rollback Verification
- `python -c "import os,subprocess,sys; env=dict(os.environ); env['PROXY_FEATURE_ENABLED']='0'; sys.exit(subprocess.call(['npm','--prefix','desktop','run','smoke:dev'], env=env))"` exits `0` and evidence exists at `.sisyphus/evidence/rollback-disabled.png`.
- Proxy endpoint check fails as expected while feature is disabled.
- No secret leakage in rollback logs.
- Release notes explicitly document rollback status and disabled capabilities.

---

## Success Criteria

### Verification Commands (Release Exit)

| Area | Command | Expected Result |
|---|---|---|
| Desktop lint | `npm --prefix desktop run lint` | Exit `0` |
| Desktop tests | `npm --prefix desktop run test` | Exit `0` |
| Desktop build | `npm --prefix desktop run build` | Exit `0` |
| Proxy tests | `python -m pytest proxy/tests -q` | Exit `0` |
| Package build | `npm --prefix desktop run dist:win` | Exit `0`; `.exe` exists under `desktop/dist/` |
| Health | `curl -sS -f http://127.0.0.1:11435/healthz` | JSON contains `status=ok` |
| Models | `curl -sS -f http://127.0.0.1:11435/v1/models` | JSON has non-empty `data[]` with `id` |
| Chat non-stream | `curl -sS -f -X POST http://127.0.0.1:11435/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"gpt-5-nano","messages":[{"role":"user","content":"ping"}],"stream":false}'` | JSON contains `choices[0].message.content` |
| Stream reject | `curl -sS -o .sisyphus/evidence/verify-stream-reject.json -w "%{http_code}" -X POST http://127.0.0.1:11435/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"gpt-5-nano","messages":[{"role":"user","content":"ping"}],"stream":true}'` | HTTP `501`; canonical error payload |
| Unsupported route | `curl -sS -o .sisyphus/evidence/verify-unsupported-route.json -w "%{http_code}" -X POST http://127.0.0.1:11435/v1/embeddings -H "Content-Type: application/json" -d '{"input":"ping","model":"text-embedding-3-small"}'` | HTTP `404`; structured error |
| Packaged smoke | `npm --prefix desktop run smoke:packaged` | Exit `0`; packaged lifecycle + `/healthz` smoke pass |

### Final Checklist
- [ ] All must-have behaviors implemented.
- [ ] All guardrails enforced (localhost bind, token redaction, strict IPC allowlist).
- [ ] Out-of-scope routes explicitly rejected.
- [ ] Automated tests pass.
- [ ] Windows packaged smoke passes with deterministic evidence.
- [ ] Agent QA evidence complete and reviewable.

---

## UI Handoff Checklist (for executing agent)

Use this checklist to keep implementation aligned with the selected design baseline (`puter-designs/react-app7.js`).

### Layout & Information Architecture
- [ ] Keep desktop-first shell: left sidebar + top header + main dashboard canvas.
- [ ] Preserve navigation order: Overview, Proxy Control, Models, Logs, Settings.
- [ ] Keep card grouping in Overview: Proxy Status, API Security, Models, Test Request, Live Logs.
- [ ] Do **not** replace desktop IA with mobile patterns (no bottom nav/FAB in MVP).

### Visual Consistency
- [ ] Match spacing rhythm and card hierarchy from `react-app7.js` before adding custom polish.
- [ ] Maintain clear visual separation between control actions (start/stop/restart) and passive metrics.
- [ ] Keep status signaling consistent (running/stopped/error with distinct colors + labels).
- [ ] Increase contrast for small metadata/log text where baseline is too muted.

### Operational UX Requirements
- [ ] Add explicit inline banners for: invalid token, proxy unavailable, stream unsupported.
- [ ] Ensure token remains masked after save; never show plaintext in passive state.
- [ ] Keep lifecycle actions always visible in Overview and detailed controls in Proxy Control page.
- [ ] Ensure logs panel supports quick scan: timestamp, level, message, and filter/search affordance.

### Testability & Automation
- [ ] Add stable `data-testid` selectors for all key controls and states:
  - `start-proxy`, `stop-proxy`, `restart-proxy`, `proxy-status`, `token-input`, `save-token`, `api-error`, `logs-filter`.
- [ ] Ensure every UI state in this checklist is covered by Playwright QA scenarios in Task 4/7.
- [ ] Capture evidence screenshots for running, stopped, and error states in `.sisyphus/evidence/`.

### Scope Guardrails
- [ ] Do not introduce non-MVP features (new endpoint screens, billing dashboard, multi-profile auth).
- [ ] Do not redesign to a different visual concept; implement baseline faithfully first, then iterate.
- [ ] Keep accessibility basics: keyboard focus visibility, readable contrast, non-color-only status cues.

---

## Design QA Matrix (Playwright-oriented)

Use this matrix as the authoritative visual/interaction verification grid for MVP.

| Screen | State | Trigger | Assertions (UI) | Key Selectors | Evidence |
|---|---|---|---|---|---|
| Overview | Initial load | Open app at `/` | Sidebar, header, and 5 core cards are visible in desktop layout | `[data-testid="sidebar"]`, `[data-testid="top-header"]`, `[data-testid="card-proxy-status"]`, `[data-testid="card-api-security"]`, `[data-testid="card-models"]`, `[data-testid="card-test-request"]`, `[data-testid="card-live-logs"]` | `.sisyphus/evidence/ui-overview-initial.png` |
| Overview | Proxy running | Click start action | Status badge shows `running`; stop/restart visible; host:port visible | `[data-testid="start-proxy"]`, `[data-testid="proxy-status"]`, `[data-testid="proxy-endpoint"]`, `[data-testid="stop-proxy"]`, `[data-testid="restart-proxy"]` | `.sisyphus/evidence/ui-proxy-running.png` |
| Overview | Proxy stopped | Click stop action | Status badge shows `stopped`; start action visible; no crash banner | `[data-testid="stop-proxy"]`, `[data-testid="proxy-status"]`, `[data-testid="start-proxy"]`, `[data-testid="banner-error"]` | `.sisyphus/evidence/ui-proxy-stopped.png` |
| Overview | Proxy error | Force bad backend command | Status badge shows `error`; inline actionable banner appears | `[data-testid="proxy-status"]`, `[data-testid="banner-proxy-unavailable"]`, `[data-testid="retry-proxy"]` | `.sisyphus/evidence/ui-proxy-error.png` |
| API Security | Token masked | Save token and reload UI | Token field remains masked (no plaintext), secure indicator visible | `[data-testid="token-input"]`, `[data-testid="save-token"]`, `[data-testid="token-masked"]`, `[data-testid="token-secure-indicator"]` | `.sisyphus/evidence/ui-token-masked.png` |
| API Security | Invalid token warning | Send request with invalid token | Warning banner shown with remediation text; app remains responsive | `[data-testid="send-test-request"]`, `[data-testid="banner-invalid-token"]`, `[data-testid="api-error"]` | `.sisyphus/evidence/ui-invalid-token-warning.png` |
| Models | Model list shown | Navigate to Models | Table/list shows rows with `id`, `provider`, `context` | `[data-testid="models-table"]`, `[data-testid="model-row"]`, `[data-testid="model-id"]`, `[data-testid="model-provider"]` | `.sisyphus/evidence/ui-models-list.png` |
| Models | Search/filter | Enter query | Result count decreases and visible rows match query | `[data-testid="models-search"]`, `[data-testid="model-row"]` | `.sisyphus/evidence/ui-models-filter.png` |
| Test Request | Non-stream success | Submit prompt with `stream=false` | Success response preview shown; no warning banner | `[data-testid="prompt-input"]`, `[data-testid="stream-toggle"]`, `[data-testid="send-test-request"]`, `[data-testid="response-preview"]` | `.sisyphus/evidence/ui-test-request-success.png` |
| Test Request | Stream unsupported | Submit prompt with `stream=true` | Stream unsupported banner appears; response reflects structured 501 behavior | `[data-testid="stream-toggle"]`, `[data-testid="send-test-request"]`, `[data-testid="banner-stream-unsupported"]` | `.sisyphus/evidence/ui-stream-unsupported.png` |
| Logs | Log readability | Open logs panel | Timestamp, level, message columns are visible and readable | `[data-testid="logs-panel"]`, `[data-testid="log-row"]`, `[data-testid="log-time"]`, `[data-testid="log-level"]`, `[data-testid="log-message"]` | `.sisyphus/evidence/ui-logs-readability.png` |
| Logs | Filter behavior | Type filter text | Only matching log rows remain; clear control resets state | `[data-testid="logs-filter"]`, `[data-testid="log-row"]`, `[data-testid="logs-clear"]` | `.sisyphus/evidence/ui-logs-filter.png` |
| Navigation | Route consistency | Click each nav item | Correct page title/section visible for Overview/Proxy Control/Models/Logs/Settings | `[data-testid="nav-overview"]`, `[data-testid="nav-proxy-control"]`, `[data-testid="nav-models"]`, `[data-testid="nav-logs"]`, `[data-testid="nav-settings"]`, `[data-testid="page-title"]` | `.sisyphus/evidence/ui-navigation-routes.png` |
| Accessibility | Focus/contrast sanity | Keyboard tab through controls | Focus ring visible on interactive controls; status not color-only (has text labels) | `[data-testid="start-proxy"]`, `[data-testid="save-token"]`, `[data-testid="send-test-request"]`, `[data-testid="proxy-status"]` | `.sisyphus/evidence/ui-accessibility-focus.png` |

**Execution note**: Failing any matrix row blocks Task 8 completion until evidence is updated and assertions pass.

---

## Playwright Test Skeleton Blueprint (Plan-Only)

Use this as the implementation blueprint for Task 7/8 so the executor can translate the Design QA Matrix directly into automated checks.

### Proposed Test File Structure

```text
desktop/tests/e2e/
  fixtures/
    app.fixture.ts
    selectors.ts
  smoke/
    overview.layout.spec.ts
    navigation.routes.spec.ts
  lifecycle/
    proxy.running-stopped-error.spec.ts
  security/
    token.masking-invalid-token.spec.ts
  models/
    models.list-filter.spec.ts
  request/
    test-request.success-stream-unsupported.spec.ts
  logs/
    logs.readability-filter.spec.ts
  accessibility/
    focus-and-status-labels.spec.ts
```

### Selector Contract (`fixtures/selectors.ts`)

```ts
// Keep stable and versioned. Any UI refactor must preserve these test IDs.
export const sel = {
  sidebar: '[data-testid="sidebar"]',
  topHeader: '[data-testid="top-header"]',
  cardProxy: '[data-testid="card-proxy-status"]',
  cardSecurity: '[data-testid="card-api-security"]',
  cardModels: '[data-testid="card-models"]',
  cardTestRequest: '[data-testid="card-test-request"]',
  cardLogs: '[data-testid="card-live-logs"]',

  startProxy: '[data-testid="start-proxy"]',
  stopProxy: '[data-testid="stop-proxy"]',
  restartProxy: '[data-testid="restart-proxy"]',
  proxyStatus: '[data-testid="proxy-status"]',
  proxyEndpoint: '[data-testid="proxy-endpoint"]',

  tokenInput: '[data-testid="token-input"]',
  saveToken: '[data-testid="save-token"]',
  tokenMasked: '[data-testid="token-masked"]',
  tokenSecureIndicator: '[data-testid="token-secure-indicator"]',

  promptInput: '[data-testid="prompt-input"]',
  streamToggle: '[data-testid="stream-toggle"]',
  sendTestRequest: '[data-testid="send-test-request"]',
  responsePreview: '[data-testid="response-preview"]',

  bannerProxyUnavailable: '[data-testid="banner-proxy-unavailable"]',
  bannerInvalidToken: '[data-testid="banner-invalid-token"]',
  bannerStreamUnsupported: '[data-testid="banner-stream-unsupported"]',
  apiError: '[data-testid="api-error"]',

  modelsTable: '[data-testid="models-table"]',
  modelRow: '[data-testid="model-row"]',
  modelsSearch: '[data-testid="models-search"]',

  logsPanel: '[data-testid="logs-panel"]',
  logsFilter: '[data-testid="logs-filter"]',
  logsClear: '[data-testid="logs-clear"]',
  logRow: '[data-testid="log-row"]',

  navOverview: '[data-testid="nav-overview"]',
  navProxyControl: '[data-testid="nav-proxy-control"]',
  navModels: '[data-testid="nav-models"]',
  navLogs: '[data-testid="nav-logs"]',
  navSettings: '[data-testid="nav-settings"]',
  pageTitle: '[data-testid="page-title"]'
};
```

### Minimal Fixture Blueprint (`fixtures/app.fixture.ts`)

```ts
// Plan intent: centralize launch, evidence paths, and helper assertions.
// Executor should implement for Electron app context.

export async function launchDesktopApp() {}
export async function ensureProxyRunning() {}
export async function ensureProxyStopped() {}
export async function injectInvalidTokenState() {}
export async function forceProxyErrorState() {}

export async function captureEvidence(page, name) {
  // save to `.sisyphus/evidence/${name}`
}
```

### Spec Mapping to Design QA Matrix

| Spec File | Matrix Rows Covered |
|---|---|
| `smoke/overview.layout.spec.ts` | Overview initial load |
| `lifecycle/proxy.running-stopped-error.spec.ts` | Proxy running/stopped/error |
| `security/token.masking-invalid-token.spec.ts` | Token masked + invalid token warning |
| `models/models.list-filter.spec.ts` | Models list + filter behavior |
| `request/test-request.success-stream-unsupported.spec.ts` | Non-stream success + stream unsupported |
| `logs/logs.readability-filter.spec.ts` | Logs readability + filter behavior |
| `smoke/navigation.routes.spec.ts` | Route consistency |
| `accessibility/focus-and-status-labels.spec.ts` | Focus visibility + non-color-only status |

### Test Case Blueprint Examples

```ts
test('overview layout renders required operator cards', async () => {
  // Launch app
  // Assert sidebar/header/cards visible
  // captureEvidence('ui-overview-initial.png')
});

test('stream=true shows unsupported banner', async () => {
  // Toggle stream on
  // Send request
  // Assert bannerStreamUnsupported visible
  // captureEvidence('ui-stream-unsupported.png')
});

test('token remains masked after restart', async () => {
  // Save token
  // Restart app
  // Assert tokenMasked visible and plaintext absent
  // captureEvidence('ui-token-masked.png')
});
```

### Determinism Rules (Mandatory)

- Use deterministic waits (`toBeVisible`, `toHaveText`) instead of fixed sleeps.
- Avoid external network reliance for UI assertions; mock or controlled local proxy states where possible.
- Keep one assertion intent per step and one evidence artifact per scenario.
- If flaky behavior appears, fix root cause (state sync/selector stability), not by adding long timeouts.

### Evidence Naming Convention

```text
.sisyphus/evidence/
  ui-overview-initial.png
  ui-proxy-running.png
  ui-proxy-stopped.png
  ui-proxy-error.png
  ui-token-masked.png
  ui-invalid-token-warning.png
  ui-models-list.png
  ui-models-filter.png
  ui-test-request-success.png
  ui-stream-unsupported.png
  ui-logs-readability.png
  ui-logs-filter.png
  ui-navigation-routes.png
  ui-accessibility-focus.png
```

### Exit Gate for UI QA

- All matrix rows mapped to at least one automated spec.
- All mapped specs pass on the packaged Windows build.
- All evidence files exist and are referenced in final QA report.

---

## UI Implementation Order (to minimize rework)

Follow this order so UI build-out stays aligned with `react-app7.js` and unblocks Playwright early.

### Phase U1 — Foundation Shell + Selector Contract
1. Implement app shell: sidebar + top header + overview canvas.
2. Add **all core `data-testid` hooks up front** (from selector contract section), even for placeholder elements.
3. Add route skeletons for Overview / Proxy Control / Models / Logs / Settings with `page-title` markers.

**Gate U1**:
- `overview.layout` and `navigation.routes` smoke checks can run (even with partial internals).

### Phase U2 — Proxy Lifecycle Surface (highest operational priority)
4. Build Proxy Status card fully: start/stop/restart controls, endpoint label, running/stopped/error badge.
5. Wire minimal state transitions from Electron main process contract (mock/stub acceptable initially).
6. Add `proxy unavailable` inline banner and retry action.

**Gate U2**:
- `proxy.running-stopped-error` spec passes against mocked/controlled states.

### Phase U3 — Security & Token UX
7. Implement token input/save flow with masked display after save.
8. Add secure indicator and invalid-token warning banner path.

**Gate U3**:
- `token.masking-invalid-token` spec passes; no plaintext token visible in passive UI.

### Phase U4 — Models + Test Request Flow
9. Implement models list/table + search filter behavior.
10. Implement test request panel (prompt, model select, stream toggle, response preview).
11. Add explicit stream-unsupported banner UX for `stream=true` path.

**Gate U4**:
- `models.list-filter` and `test-request.success-stream-unsupported` specs pass.

### Phase U5 — Logs + Accessibility Hardening
12. Implement logs panel with timestamp/level/message columns, filter and clear controls.
13. Improve small-text contrast and ensure keyboard focus visibility on all primary controls.
14. Ensure status indicators are not color-only (text labels always present).

**Gate U5**:
- `logs.readability-filter` and `focus-and-status-labels` specs pass.

### Phase U6 — Visual Parity + Packaging Validation
15. Perform parity sweep against `react-app7.js` (spacing, hierarchy, card composition).
16. Capture all evidence artifacts from Design QA Matrix.
17. Re-run full UI suite on packaged Windows build.

**Final UI Gate**:
- All matrix rows green + all required evidence files present.

---

## UI Risk Log (Top 5 + Mitigation)

Use this log before and during Task 4/7/8 to prevent UI drift, flaky QA, and late-stage rework.

| Risk | Likelihood | Impact | Early Signal | Mitigation | Owner |
|---|---|---|---|---|---|
| UI diverges from selected baseline (`react-app7.js`) | Medium | High | Major layout/styling deltas appear after component refactors | Run parity checks at end of U2/U4/U6; keep baseline screenshots in PR notes; block merge if card hierarchy changes without explicit approval | UI implementer |
| Flaky Playwright due to unstable selectors/state timing | High | High | Intermittent failures in lifecycle and banner tests | Freeze `data-testid` contract early (U1), use deterministic assertions (`toBeVisible`, `toHaveText`), remove arbitrary sleeps, stabilize state transitions | QA implementer |
| Incomplete error-state UX (invalid token/proxy down/stream unsupported) | Medium | High | Happy path passes but warning/error scenarios fail matrix | Treat error banners as first-class deliverables in U2/U3/U4; add dedicated assertions and screenshots per error state | UI + API implementer |
| Poor readability in dense logs/metadata under dark theme | Medium | Medium | User reports eye strain; failed accessibility checks for contrast | Increase contrast tokens for small text, validate on long-session scenarios, include accessibility focus/contrast checks in U5 | UI implementer |
| Route-level inconsistency (navigation works but pages lack operational controls) | Medium | Medium | Pages render but missing expected controls/titles/test IDs | Enforce route checklist in U1 and `navigation.routes` spec; require `page-title` and critical controls present per page | UI implementer |

### Risk Response Playbook

1. **Detect**: If any matrix row fails twice or appears flaky, open a risk item in task notes.
2. **Contain**: Freeze related UI area (no extra styling changes) until failure root cause is identified.
3. **Fix root cause**: Prefer selector/state contract fixes over timeout increases.
4. **Re-verify**: Re-run affected spec + full impacted category suite.
5. **Record evidence**: Update `.sisyphus/evidence/` artifact and note resolution in final QA report.

### No-Go Conditions (UI Release Blockers)

- Any high-impact risk unresolved by Task 8.
- Missing evidence for required error states.
- Failing accessibility/focus visibility checks on primary actions.
- Unapproved deviation from `react-app7.js` layout hierarchy.

---

## Defaults Applied (override if needed)
- **Python runtime strategy (MVP)**: require local Python install for V1, bundle runtime later.
- **Streaming behavior**: return structured `501` in V1.
- **Local auth posture**: localhost-only + secure token storage + no plaintext logs.
- **OS scope**: Windows-only packaging in MVP.

---

## Environment Bootstrap Snapshot (Skills + LSP)

> This section records the working local environment used for this plan so future execution is reproducible.

### Agent Skills (project-level)

**Canonical directory (unified):** `./.agents/skills/`

Installed skills:
- `webapp-testing`
- `fastapi-templates`
- `e2e-testing-patterns`
- `api-design-principles`
- `fastapi-development`
- `systematic-debugging`
- `verification-before-completion`
- `executing-plans`
- `test-driven-development`

Notes:
- `.opencode/skills/` was intentionally removed to avoid duplicate resolution paths.
- Skill discovery sources used for this plan: `skills.sh`, `skillhub.club`, and SkillsMP-discovered repos.

Repro install commands (non-interactive):

```bash
npx skills add anthropics/skills --skill webapp-testing -a opencode -y
npx skills add wshobson/agents --skill fastapi-templates --skill e2e-testing-patterns --skill api-design-principles -a opencode -y
npx skills add aj-geddes/useful-ai-prompts --skill fastapi-development -a opencode -y
npx skills add obra/superpowers --skill systematic-debugging --skill verification-before-completion --skill executing-plans --skill test-driven-development -a opencode -y
```

### LSP configuration (project-level)

**Config file:** `./.opencode/oh-my-opencode.json`

Configured LSP servers:
- `typescript` → `typescript-language-server --stdio`
- `pyright` → `pyright-langserver --stdio`
- `yaml-ls` → `yaml-language-server --stdio`
- `json-ls` → `vscode-json-language-server --stdio`
- `remark-markdown` → `remark-language-server --stdio`
- `bash` → `bash-language-server start`
- `toml` → `taplo lsp stdio` (Cargo build with `lsp` feature)
- `sql` → `sql-language-server up --method stdio`

LSP dependency install commands used:

```bash
npm install --yes typescript typescript-language-server pyright yaml-language-server vscode-langservers-extracted remark-language-server bash-language-server sql-language-server
npm install --yes @taplo/cli
cargo install taplo-cli --locked --features lsp
```

Critical TOML note:
- Taplo LSP is **not** available in default npm Taplo build for `lsp` runtime mode.
- The plan therefore pins TOML LSP to `C:/Users/admin/.cargo/bin/taplo.exe`.

Smoke verification command:

```bash
python scripts/lsp_smoke_check.py
```

Expected result:
- `total=8, ok=8`

---

## Final Review Consolidation (Metis + Momus + Oracle)

> **Priority rule**: This section is authoritative for ambiguities and conflicts discovered during multi-agent preflight review.
> If any statement in earlier sections conflicts with this section, this section wins.

### Canonical Decisions (Resolved Contradictions)

1. **Reviewer contradiction resolution**:
   - Momus verdict `OKAY` is interpreted as **plan structure/reference integrity passed**.
   - Metis/Oracle findings are interpreted as **operational hardening gaps**.
   - Final decision: both are valid; structural readiness passed, risk-hardening updates are mandatory and now incorporated below.

2. **Auth matrix (single source of truth)**:
   - **Upstream Puter auth token source precedence**:
     - Packaged MVP: `secure_store` only.
     - Dev mode: `secure_store` → `env(PUTER_TOKEN)` fallback.
   - **Local client auth to proxy (MVP decision)**:
     - No additional client credential is required beyond localhost bind for MVP.
     - `/healthz` remains unauthenticated for local process liveness checks.
     - **Accepted risk**: localhost-only does not protect against malicious local processes.
   - **Failure mapping**:
     - missing upstream token source → `401` + `error.code=token_missing`
     - invalid upstream token reject → `401` + `error.code=unauthorized`

3. **Localhost guardrail ambiguity removed**:
   - MVP has **no non-MVP host override**. Bind policy is fixed to `127.0.0.1`.
   - Any non-localhost bind request in MVP must fail deterministically.

4. **Runtime policy clarified**:
   - Python is not bundled in MVP.
   - Required runtime: CPython `3.11.x` available at execution time.
   - Discovery order: configured absolute path (if set) → `py -3.11` → `python`.
   - If unresolved/unsupported: startup blocked with `python_runtime_missing`.

5. **Test determinism policy clarified**:
   - Blocking release gates use deterministic local execution.
   - Live upstream Puter smoke is allowed but non-blocking unless explicitly promoted.

### Canonical Error Contract Table (v1)

| error.code | HTTP | Retryable | Trigger |
|---|---:|---|---|
| `invalid_request` | 400 | No | schema/parameter validation fails |
| `unauthorized` | 401 | No | upstream auth reject |
| `token_missing` | 401 | No | no upstream Puter token source resolved |
| `model_not_found` | 404 | No | requested model not available after normalization |
| `streaming_not_supported` | 501 | No | `stream=true` requested in MVP |
| `upstream_timeout` | 504 | Yes | Puter upstream deadline exceeded |
| `upstream_error` | 502 | Maybe | non-timeout upstream failure |
| `proxy_unavailable` | 503 | Yes | proxy not ready/running |
| `port_in_use` | 409 | No | `127.0.0.1:11435` occupied |
| `python_runtime_missing` | 500 | No | required Python runtime cannot be located/validated |
| `internal_error` | 500 | Maybe | unexpected unclassified failure |

### OpenAI Compatibility Profile (MVP Minimum)

#### `/v1/models` minimum object
- Required per item: `id`, `object="model"`
- Optional best-effort: `owned_by`, `provider`, `context_window`, `pricing`
- UI fallback: missing optional values render as `—` (not error)

#### `/v1/chat/completions` minimum success payload
- Required: `id`, `object="chat.completion"`, `created`, `model`, `choices[0].index`, `choices[0].message.role`, `choices[0].message.content`, `choices[0].finish_reason`
- Optional: `usage` (omit if unavailable; do not emit invalid placeholder)

#### Unsupported routes policy
- Any unimplemented `/v1/*` endpoint returns structured `404` error envelope using canonical error schema.

### Deterministic Verification Tiering

- **Tier A (Blocking / release gate)**:
  - local deterministic contract checks
  - packaging/runtime checks
  - redaction and evidence-integrity checks
- **Tier B (Non-blocking by default)**:
  - live Puter upstream smoke (real token/network)
  - may be promoted to blocking only by explicit release decision

### Evidence Governance (Release Integrity)

- Evidence manifest is required to include, per artifact:
  - `name`, `path`, `task_id`, `scenario`, `created_at`, `sha256`, `contains_secrets=false`
- Final gate requires:
  - all required artifacts present
  - manifest JSON valid
  - artifact hash verification pass
  - secret-scan across logs/json/screenshots metadata outputs passes (no token leakage)

---

## Preflight checks

> Run before `/start-work` and before final packaging signoff.

1. **Scope lock**
   - Confirm MVP endpoints are only: `/healthz`, `/v1/models`, `/v1/chat/completions` (non-streaming).
   - Confirm out-of-scope endpoints remain excluded.

2. **Runtime prerequisites**
   - Verify Windows host class and Python `3.11.x` availability using declared discovery order.
   - Verify target port `127.0.0.1:11435` availability.

3. **Security boundary prerequisites**
   - Confirm localhost bind policy is enforced (`127.0.0.1` only).
   - Confirm local-trust threat model is explicitly accepted for MVP (no extra local caller auth).
   - Confirm secure-store path is available for packaged mode.

4. **Contract freeze checks**
   - Freeze IPC allowlist channels and error-code table before Wave 3.
   - Freeze selector contract (`data-testid`) before full Playwright expansion.

5. **Verification readiness**
   - Confirm Tier A (blocking) commands are fully defined and deterministic.
   - Confirm evidence manifest schema and required artifact list are pinned.

6. **Governance readiness**
   - Confirm rollback toggle ownership and rehearsal criteria exist.
   - Confirm release blocker priority order: security/runtime correctness > API compatibility > visual parity.

---

## Abort conditions

> If any condition is met, stop execution wave progression and escalate.

1. **Security aborts (immediate No-Go)**
   - Any token/secret leakage detected in logs, responses, screenshots, or manifest artifacts.
   - Threat model requires defense against malicious local processes, but MVP remains localhost-only without additional client auth.

2. **Runtime aborts**
   - Python runtime cannot be discovered/validated per policy and no approved remediation exists.
   - Repeated proxy crash-loop exceeds defined retry budget and root cause is unknown.

3. **Contract aborts**
   - IPC allowlist drift or unauthorized channel exposure discovered.
   - Error envelope/status mapping deviates from canonical table.
   - `/v1/*` unsupported route policy is inconsistent (non-structured or non-404 behavior).

4. **Verification aborts**
   - Any Tier A blocking check fails after one fix attempt.
   - Evidence manifest invalid, incomplete, or hash mismatch occurs.

5. **Governance aborts**
   - Rollback toggle/procedure is unverified before final packaging wave.
   - Required preflight checklist item is unconfirmed at wave gate.
