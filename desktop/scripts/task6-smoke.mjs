import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, "..", "..");
const evidenceDir = resolve(workspaceRoot, ".sisyphus", "evidence");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runPython(code, envOverrides = {}) {
  const child = spawnSync("python", ["-c", code], {
    cwd: workspaceRoot,
    encoding: "utf-8",
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  if (child.error) {
    throw new Error(String(child.error));
  }

  if (child.status !== 0) {
    throw new Error(child.stderr || child.stdout || "python command failed");
  }

  return child.stdout.trim();
}

function main() {
  mkdirSync(evidenceDir, { recursive: true });

  const unauthorizedJson = runPython(
    [
      "import json, importlib, os",
      "os.environ['PUTER_TOKEN']=''",
      "os.environ['HOST']='127.0.0.1'",
      "os.environ['PORT']='11435'",
      "os.environ['LOG_LEVEL']='INFO'",
      "os.environ['PROXY_FEATURE_ENABLED']='1'",
      "mod = importlib.import_module('proxy.app.main')",
      "from fastapi.testclient import TestClient",
      "client = TestClient(mod.app)",
      "res = client.get('/v1/models')",
      "print(json.dumps({'status': res.status_code, 'body': res.json()}, ensure_ascii=False))",
    ].join("; "),
  );

  const unauthorized = JSON.parse(unauthorizedJson);
  assert(unauthorized.status === 401, "Expected unauthorized status 401 for /v1/models without token");
  assert(Boolean(unauthorized.body?.error?.code), "Structured error missing code");
  assert(Boolean(unauthorized.body?.error?.message), "Structured error missing message");
  assert(Boolean(unauthorized.body?.error?.request_id), "Structured error missing request_id");

  writeFileSync(resolve(evidenceDir, "task-6-unauthorized.json"), `${JSON.stringify(unauthorized.body, null, 2)}\n`, "utf-8");

  const guardrailCheck = spawnSync("python", ["-c", "import os, importlib; os.environ['HOST']='0.0.0.0'; importlib.import_module('proxy.app.config')"], {
    cwd: workspaceRoot,
    encoding: "utf-8",
    env: { ...process.env },
  });

  assert(guardrailCheck.status !== 0, "HOST guardrail should fail for 0.0.0.0");
  const guardrailOutput = `${guardrailCheck.stderr || ""}${guardrailCheck.stdout || ""}`;
  assert(
    guardrailOutput.includes("Invalid HOST value") || guardrailOutput.includes("localhost-only"),
    "Guardrail output should mention localhost-only policy",
  );

  writeFileSync(resolve(evidenceDir, "task-6-bind-guardrail.txt"), `${guardrailOutput.trim()}\n`, "utf-8");

  const requiredCodes = [
    "invalid_request",
    "unauthorized",
    "token_missing",
    "model_not_found",
    "streaming_not_supported",
    "upstream_timeout",
    "upstream_error",
    "proxy_unavailable",
    "port_in_use",
    "python_runtime_missing",
    "internal_error",
  ];

  const sourceSnapshots = {
    proxyMain: readFileSync(resolve(workspaceRoot, "proxy", "app", "main.py"), "utf-8"),
    modelsRoute: readFileSync(resolve(workspaceRoot, "proxy", "app", "routes", "models.py"), "utf-8"),
    chatRoute: readFileSync(resolve(workspaceRoot, "proxy", "app", "routes", "chat_completions.py"), "utf-8"),
    puterClient: readFileSync(resolve(workspaceRoot, "proxy", "app", "adapters", "puter_client.py"), "utf-8"),
    proxyManager: readFileSync(resolve(workspaceRoot, "desktop", "main", "proxy-manager.ts"), "utf-8"),
    desktopIndex: readFileSync(resolve(workspaceRoot, "desktop", "main", "index.ts"), "utf-8"),
  };

  const codeEvidence = {};
  for (const code of requiredCodes) {
    codeEvidence[code] = Object.values(sourceSnapshots).some((source) =>
      source.includes(`\"${code}\"`) || source.includes(`'${code}'`) || source.includes(code),
    );
  }

  const missingCodes = Object.entries(codeEvidence)
    .filter(([, found]) => !found)
    .map(([code]) => code);
  assert(missingCodes.length === 0, `Missing required Task 6 codes in source: ${missingCodes.join(", ")}`);

  writeFileSync(
    resolve(evidenceDir, "task-6-error-codes.json"),
    `${JSON.stringify({ required_codes: requiredCodes, discovered: codeEvidence }, null, 2)}\n`,
    "utf-8",
  );

  const logSample = runPython(
    [
      "import io, logging, json",
      "from proxy.app.logging_utils import LOGGER, configure_proxy_logging, emit_request_log",
      "configure_proxy_logging('INFO')",
      "stream = io.StringIO()",
      "handler = logging.StreamHandler(stream)",
      "handler.setFormatter(logging.Formatter('%(message)s'))",
      "LOGGER.handlers.clear()",
      "LOGGER.addHandler(handler)",
      "LOGGER.setLevel(logging.INFO)",
      "emit_request_log(route='/v1/models', status=401, latency_ms=12, model=None, request_id='req_task6', extra={'code': 'token_missing', 'status': 999, 'route': '/override'})",
      "print(stream.getvalue().strip())",
    ].join("; "),
  );

  const parsedLog = JSON.parse(logSample);
  assert(parsedLog.route === "/v1/models", "Structured log missing route");
  assert(typeof parsedLog.status === "number", "Structured log missing status");
  assert(typeof parsedLog.latency_ms === "number", "Structured log missing latency_ms");
  assert(typeof parsedLog.request_id === "string", "Structured log missing request_id");
  assert(parsedLog.status === 401, "Structured log must preserve core status field from arguments");
  assert(parsedLog.route === "/v1/models", "Structured log must preserve core route field from arguments");
  assert(!("prompt" in parsedLog), "Structured log must not include prompt body");
  assert(!("response" in parsedLog), "Structured log must not include response body");

  writeFileSync(resolve(evidenceDir, "task-6-structured-logs.txt"), `${logSample}\n`, "utf-8");
}

main();
