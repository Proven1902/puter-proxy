# Runtime Environment Contract (Wave 1 / Task 1)

This file defines the **minimum deterministic environment contract** for the Electron desktop and local FastAPI proxy MVP scaffold.

## Localhost-only MVP rule

- The proxy must run on localhost only.
- Allowed `HOST` values: `127.0.0.1` or `localhost`.
- Do **not** bind to `0.0.0.0` in MVP.

## Required variables

| Variable | Required | Type | Default | Scope | Notes |
|---|---|---|---|---|---|
| `HOST` | Yes | string | `127.0.0.1` | proxy + desktop config | Must remain localhost-only in MVP. |
| `PORT` | Yes | integer | `11435` | proxy + desktop config | TCP port for proxy bind and health checks. |
| `PUTER_TOKEN` | Yes | string | _none_ | proxy runtime auth | User-provided token; never log plaintext value. |
| `LOG_LEVEL` | Yes | enum | `INFO` | proxy + desktop | Allowed: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`. |
| `PROXY_FEATURE_ENABLED` | Yes | boolean | `true` | desktop feature toggle | Enables proxy controls in desktop runtime. |

## Boolean parsing convention

`PROXY_FEATURE_ENABLED` is treated as true when value is one of:

- `1`, `true`, `yes`, `on` (case-insensitive)

All other values are treated as false.

## Security notes

- Never print or persist `PUTER_TOKEN` to plaintext logs.
- Keep all MVP traffic and control paths local to machine (`127.0.0.1` / `localhost`).
