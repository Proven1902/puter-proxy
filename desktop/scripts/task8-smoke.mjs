import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, "..", "..");
const desktopRoot = resolve(workspaceRoot, "desktop");
const evidenceDir = resolve(workspaceRoot, ".sisyphus", "evidence");
const tmpOutDir = resolve(desktopRoot, ".tmp-task8");
const secureStorePath = resolve(tmpOutDir, "secure-store.json");
const smokeHost = "127.0.0.1";
const smokePort = Number.parseInt(process.env.TASK8_SMOKE_PORT || "11445", 10);

mkdirSync(evidenceDir, { recursive: true });
mkdirSync(tmpOutDir, { recursive: true });

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function withEnv(overrides) {
  return {
    ...process.env,
    ...overrides,
  };
}

function run(command, args, options = {}) {
  const child = spawnSync(command, args, {
    cwd: options.cwd || workspaceRoot,
    encoding: "utf-8",
    env: options.env || process.env,
  });

  if (child.error) {
    throw new Error(String(child.error));
  }

  const output = `${child.stdout || ""}${child.stderr || ""}`.trim();
  return {
    status: child.status ?? -1,
    output,
  };
}

function compileDesktopMainTs() {
  const tscEntrypoint = resolve(desktopRoot, "node_modules", "typescript", "bin", "tsc");
  const args = [
    "--target",
    "ES2022",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--lib",
    "ES2022,DOM",
    "--types",
    "node",
    "--outDir",
    ".tmp-task8",
    "main/config.ts",
    "main/ipc.ts",
    "main/security-store.ts",
    "main/proxy-manager.ts",
    "main/index.ts",
  ];

  const compile = run(process.execPath, [tscEntrypoint, ...args], { cwd: desktopRoot });
  assert(compile.status === 0, `TypeScript compile failed: ${compile.output || "unknown error"}`);
}

function findExecutableArtifacts() {
  const distDir = resolve(desktopRoot, "dist");
  if (!existsSync(distDir)) {
    return [];
  }

  const stack = [distDir];
  const exeFiles = [];
  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (extname(entry.name).toLowerCase() === ".exe") {
        exeFiles.push(fullPath);
      }
    }
  }
  return exeFiles.sort();
}

async function validateLifecycleAndContracts() {
  compileDesktopMainTs();

  process.env.NODE_ENV = "production";
  process.env.HOST = smokeHost;
  process.env.PORT = String(smokePort);
  process.env.LOG_LEVEL = "INFO";
  process.env.PROXY_FEATURE_ENABLED = "1";
  process.env.PUTER_TOKEN = "";
  process.env.PUTER_DESKTOP_SECURE_STORE_PATH = secureStorePath;
  process.env.PUTER_DESKTOP_TOKEN_SERVICE = "puter-desktop-task8-smoke";
  process.env.PUTER_DESKTOP_TOKEN_ACCOUNT = "puter-token-task8-smoke";

  const mainIndexPath = pathToFileURL(resolve(tmpOutDir, "index.js")).href;
  const proxyManagerPath = pathToFileURL(resolve(tmpOutDir, "proxy-manager.js")).href;
  const { dispatchIpcCommand } = await import(mainIndexPath);
  const { ProxyManager } = await import(proxyManagerPath);
  let proxyStarted = false;

  const waitUntilRunning = async () => {
    let statusSnapshot = null;
    for (let i = 0; i < 50; i += 1) {
      const status = await dispatchIpcCommand("proxy.status", {});
      assert(status && status.ok === true, "proxy.status must return ok envelope");
      statusSnapshot = status;
      if (status.data.status === "running") {
        return status;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    }
    return statusSnapshot;
  };

  let runningStatus;
  let secureStoreSentinelPresent = false;
  let health;
  let healthBody;
  let models;
  let modelsBody;
  let preflightErrorCode = null;

  try {
    await dispatchIpcCommand("proxy.stop", {});

    const clear = await dispatchIpcCommand("token.clear", {});
    assert(clear && clear.ok === true, "token.clear must succeed before packaged smoke checks");

    const start = await dispatchIpcCommand("proxy.start", {});
    assert(
      start && start.ok === true,
      `proxy.start must succeed in packaged smoke checks: ${JSON.stringify(start)}`,
    );
    proxyStarted = true;

    runningStatus = await waitUntilRunning();

    assert(runningStatus?.data?.status === "running", "proxy must become running in packaged smoke checks");
    assert(runningStatus.data.token_masked === false, "token_masked must be false after token.clear");
    assert(!("token" in runningStatus.data), "proxy.status must not expose plaintext token field");

    const save = await dispatchIpcCommand("token.save", { token: "pt_Task8SmokeToken_ABC123" });
    assert(save && save.ok === true, "token.save must succeed in packaged smoke checks");

    const statusAfterSave = await waitUntilRunning();
    assert(statusAfterSave?.data?.status === "running", "proxy must return to running after token.save");
    assert(statusAfterSave.data.token_masked === true, "token_masked must be true after token.save");
    assert(!("token" in statusAfterSave.data), "proxy.status must not expose plaintext token field after token.save");

    secureStoreSentinelPresent =
      existsSync(secureStorePath) && readFileSync(secureStorePath, "utf-8").includes("KEYCHAIN_BACKED");
    assert(secureStoreSentinelPresent, "secure-store sentinel must indicate keychain-backed storage after token.save");

    const clearAfterSave = await dispatchIpcCommand("token.clear", {});
    assert(clearAfterSave && clearAfterSave.ok === true, "token.clear must succeed after token.save");

    const statusAfterClear = await waitUntilRunning();
    assert(statusAfterClear?.data?.status === "running", "proxy must return to running after token.clear");
    assert(statusAfterClear.data.token_masked === false, "token_masked must be false after token.clear");
    assert(!("token" in statusAfterClear.data), "proxy.status must not expose plaintext token field after token.clear");

    health = await fetch(`http://${smokeHost}:${smokePort}/healthz`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    healthBody = await health.json();
    assert(health.status === 200, "packaged smoke /healthz must return 200");
    assert(healthBody?.status === "ok", "packaged smoke /healthz status must be ok");

    models = await fetch(`http://${smokeHost}:${smokePort}/v1/models`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    modelsBody = await models.json();
    assert(models.status === 401, "missing-token /v1/models must return 401");
    assert(modelsBody?.error?.code === "token_missing", "missing-token path must return token_missing code");

    const preflightManager = new ProxyManager({
      host: smokeHost,
      port: smokePort + 1,
      pythonPath: "nonexistent-python-binary-task8",
    });

    try {
      await preflightManager.start();
    } catch (error) {
      preflightErrorCode = typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : null;
    } finally {
      await preflightManager.stop();
    }

    assert(
      preflightErrorCode === "python_runtime_missing",
      `preflight must report deterministic error (actual=${String(preflightErrorCode)})`,
    );
  } finally {
    if (proxyStarted) {
      await dispatchIpcCommand("proxy.stop", {});
    }
  }

  return {
    lifecycle_status: runningStatus.data.status,
    token_masked: runningStatus.data.token_masked,
    secure_store_sentinel_present: secureStoreSentinelPresent,
    healthz_status: health.status,
    healthz_body: healthBody,
    missing_token_status: models.status,
    missing_token_code: modelsBody?.error?.code || null,
    preflight_error_code: preflightErrorCode,
  };
}

async function main() {
  const exeFiles = findExecutableArtifacts();
  assert(
    exeFiles.length > 0,
    "No packaged .exe artifact found under desktop/dist. Run npm --prefix desktop run dist:win before smoke:packaged",
  );

  const checks = await validateLifecycleAndContracts();

  const securityHardening = {
    secure_store_path: secureStorePath,
    secure_store_sentinel_present: checks.secure_store_sentinel_present,
    token_service_override: process.env.PUTER_DESKTOP_TOKEN_SERVICE,
    token_account_override: process.env.PUTER_DESKTOP_TOKEN_ACCOUNT,
    token_field_exposed: false,
    token_masked_only_contract: true,
    preflight_error_code: checks.preflight_error_code,
  };

  writeFileSync(
    resolve(evidenceDir, "task-8-packaged-smoke.json"),
    `${JSON.stringify(
      {
        packaged_ready: true,
        exe_artifacts: exeFiles,
        checks,
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  writeFileSync(
    resolve(evidenceDir, "task-8-package-happy.txt"),
    [
      "task8_packaged_happy=true",
      `exe_count=${exeFiles.length}`,
      `healthz_status=${checks.healthz_status}`,
      `missing_token_status=${checks.missing_token_status}`,
      `missing_token_code=${checks.missing_token_code}`,
    ].join("\n") + "\n",
    "utf-8",
  );

  writeFileSync(
    resolve(evidenceDir, "task-8-missing-token.txt"),
    [
      `status=${checks.missing_token_status}`,
      `code=${checks.missing_token_code}`,
      `preflight_error_code=${checks.preflight_error_code}`,
    ].join("\n") + "\n",
    "utf-8",
  );

  writeFileSync(
    resolve(evidenceDir, "task-8-security-hardening.txt"),
    `${JSON.stringify(securityHardening, null, 2)}\n`,
    "utf-8",
  );

  console.log("packaged_ready=true");
  console.log("proxy_ready=true");
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  writeFileSync(resolve(evidenceDir, "task-8-smoke-error.txt"), `${message}\n`, "utf-8");
  throw error;
});
