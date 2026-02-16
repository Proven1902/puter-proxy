import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, "..", "..");
const desktopRoot = resolve(workspaceRoot, "desktop");
const tmpOutDir = resolve(desktopRoot, ".tmp-task5");
const evidenceDir = resolve(workspaceRoot, ".sisyphus", "evidence");
const secureStorePath = resolve(tmpOutDir, "secure-store.json");

mkdirSync(evidenceDir, { recursive: true });

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function compileDesktopMainTs() {
  rmSync(tmpOutDir, { recursive: true, force: true });

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
    ".tmp-task5",
    "main/config.ts",
    "main/ipc.ts",
    "main/security-store.ts",
    "main/proxy-manager.ts",
    "main/index.ts",
  ];

  const compile = spawnSync(process.execPath, [tscEntrypoint, ...args], {
    cwd: desktopRoot,
    encoding: "utf-8",
  });

  if (compile.error) {
    throw new Error(`TypeScript compile failed: ${String(compile.error)}`);
  }

  if (compile.status !== 0) {
    throw new Error(`TypeScript compile failed: ${compile.stderr || compile.stdout || "unknown error"}`);
  }
}

function queryTokenMaskedInFreshProcess(mainIndexFileUrl) {
  const script = [
    "const mainIndexUrl = process.argv[1];",
    "(async () => {",
    "  const mod = await import(mainIndexUrl);",
    "  const response = await mod.dispatchIpcCommand('proxy.status', {});",
    "  process.stdout.write(JSON.stringify(response));",
    "})().catch((error) => {",
    "  process.stderr.write(String(error));",
    "  process.exit(1);",
    "});",
  ].join(" ");

  const child = spawnSync(process.execPath, ["-e", script, mainIndexFileUrl], {
    cwd: workspaceRoot,
    encoding: "utf-8",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PUTER_TOKEN: "",
      PUTER_DESKTOP_SECURE_STORE_PATH: secureStorePath,
    },
  });

  if (child.status !== 0) {
    throw new Error(`fresh-process status query failed: ${child.stderr || child.stdout || "unknown error"}`);
  }

  return JSON.parse(child.stdout);
}

function countTokenLeaks() {
  const logPath = resolve(workspaceRoot, "proxy", "logs", "latest.log");
  if (!existsSync(logPath)) {
    return 0;
  }

  const raw = readFileSync(logPath, "utf-8");
  const matches = raw.match(/pt_[A-Za-z0-9_-]+/g);
  return matches ? matches.length : 0;
}

async function main() {
  process.env.NODE_ENV = "production";
  process.env.PUTER_TOKEN = "";
  process.env.PUTER_DESKTOP_SECURE_STORE_PATH = secureStorePath;

  compileDesktopMainTs();

  const mainIndexPath = pathToFileURL(resolve(tmpOutDir, "index.js")).href;
  const { dispatchIpcCommand } = await import(mainIndexPath);

  const token = "pt_Task5SmokeToken_ABC123";

  const saveResponse = await dispatchIpcCommand("token.save", { token });
  assert(saveResponse && saveResponse.ok === true, "token.save should return ok envelope");

  const statusAfterSave = await dispatchIpcCommand("proxy.status", {});
  assert(statusAfterSave && statusAfterSave.ok === true, "proxy.status after save should return ok envelope");
  assert(statusAfterSave.data.token_masked === true, "proxy.status should surface token_masked=true after save");

  assert(existsSync(secureStorePath), "secure store file should exist after token.save");
  const storeRaw = readFileSync(secureStorePath, "utf-8");
  assert(!storeRaw.includes(token), "secure store content must not contain plaintext token");

  const freshStatusAfterSave = queryTokenMaskedInFreshProcess(mainIndexPath);
  assert(
    freshStatusAfterSave && freshStatusAfterSave.ok === true,
    "fresh process proxy.status after save should return ok envelope",
  );
  assert(
    freshStatusAfterSave.data.token_masked === true,
    "token should persist across restart with masked status",
  );

  const clearResponse = await dispatchIpcCommand("token.clear", {});
  assert(clearResponse && clearResponse.ok === true, "token.clear should return ok envelope");

  const statusAfterClear = await dispatchIpcCommand("proxy.status", {});
  assert(statusAfterClear && statusAfterClear.ok === true, "proxy.status after clear should return ok envelope");
  assert(statusAfterClear.data.token_masked === false, "proxy.status should surface token_masked=false after clear");

  const freshStatusAfterClear = queryTokenMaskedInFreshProcess(mainIndexPath);
  assert(
    freshStatusAfterClear && freshStatusAfterClear.ok === true,
    "fresh process proxy.status after clear should return ok envelope",
  );
  assert(
    freshStatusAfterClear.data.token_masked === false,
    "cleared token should not persist across restart",
  );

  const leakCount = countTokenLeaks();
  assert(leakCount === 0, "proxy logs should not contain token-like secrets");

  writeFileSync(
    resolve(evidenceDir, "task-5-persist-restart.txt"),
    [
      "task5_persist_restart_ok=true",
      "token_masked_after_save=true",
      "token_masked_after_clear=false",
      `secure_store_path=${secureStorePath}`,
    ].join("\n") + "\n",
    "utf-8",
  );

  writeFileSync(
    resolve(evidenceDir, "task-5-redaction-check.txt"),
    `${leakCount}\n`,
    "utf-8",
  );
}

main().catch((error) => {
  writeFileSync(resolve(evidenceDir, "task-5-smoke-error.txt"), `${String(error)}\n`, "utf-8");
  throw error;
});
