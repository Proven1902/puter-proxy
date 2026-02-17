import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, "..", "..");
const desktopRoot = resolve(workspaceRoot, "desktop");
const tmpOutDir = resolve(desktopRoot, ".tmp-task5");
const evidenceDir = resolve(workspaceRoot, ".sisyphus", "evidence");
const secureStorePath = resolve(tmpOutDir, "secure-store.json");
const keytarShimPath = resolve(tmpOutDir, "keytar-shim.cjs");
const keytarShimDbPath = resolve(tmpOutDir, "keytar-shim-db.json");
const legacySentinel = "KEYCHAIN_BACKED\n";
const requireFromScript = createRequire(import.meta.url);

mkdirSync(evidenceDir, { recursive: true });

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function compileDesktopMainTs() {
  rmSync(tmpOutDir, { recursive: true, force: true });

  mkdirSync(tmpOutDir, { recursive: true });

  const tscEntrypoint = resolve(desktopRoot, "node_modules", "typescript", "bin", "tsc");
  const args = ["-p", "tsconfig.main.json", "--outDir", ".tmp-task5"];

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
      PUTER_DESKTOP_TOKEN_SERVICE: process.env.PUTER_DESKTOP_TOKEN_SERVICE,
      PUTER_DESKTOP_TOKEN_ACCOUNT: process.env.PUTER_DESKTOP_TOKEN_ACCOUNT,
      PUTER_DESKTOP_LEGACY_KEYTAR_MODULE: process.env.PUTER_DESKTOP_LEGACY_KEYTAR_MODULE,
    },
  });

  if (child.status !== 0) {
    throw new Error(`fresh-process status query failed: ${child.stderr || child.stdout || "unknown error"}`);
  }

  return JSON.parse(child.stdout);
}

async function loadCompiledMainModule(mainIndexFileUrl) {
  const bust = Date.now().toString(36);
  return await import(`${mainIndexFileUrl}?cacheBust=${bust}`);
}

function writeKeytarShimFile() {
  const shim = [
    "const fs = require('node:fs');",
    `const dbPath = ${JSON.stringify(keytarShimDbPath)};`,
    "const loadDb = () => {",
    "  if (!fs.existsSync(dbPath)) return {};",
    "  try { return JSON.parse(fs.readFileSync(dbPath, 'utf-8')); } catch { return {}; }",
    "};",
    "const saveDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db), 'utf-8');",
    "const key = (service, account) => `${service}::${account}`;",
    "module.exports = {",
    "  async getPassword(service, account) {",
    "    const db = loadDb();",
    "    const value = db[key(service, account)];",
    "    return typeof value === 'string' ? value : null;",
    "  },",
    "  async deletePassword(service, account) {",
    "    const db = loadDb();",
    "    const k = key(service, account);",
    "    const existed = Object.prototype.hasOwnProperty.call(db, k);",
    "    if (existed) { delete db[k]; saveDb(db); }",
    "    return existed;",
    "  },",
    "  async setPassword(service, account, value) {",
    "    const db = loadDb();",
    "    db[key(service, account)] = String(value);",
    "    saveDb(db);",
    "    return true;",
    "  },",
    "};",
  ].join("\n");

  writeFileSync(keytarShimPath, `${shim}\n`, "utf-8");
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
  process.env.PUTER_DESKTOP_TOKEN_SERVICE = "puter-desktop-task5-smoke";
  process.env.PUTER_DESKTOP_TOKEN_ACCOUNT = "puter-token-task5-smoke";

  writeKeytarShimFile();

  compileDesktopMainTs();

  writeKeytarShimFile();
  rmSync(keytarShimDbPath, { force: true });
  process.env.PUTER_DESKTOP_LEGACY_KEYTAR_MODULE = keytarShimPath;

  const mainIndexPath = pathToFileURL(resolve(tmpOutDir, "main", "index.js")).href;
  const proxyManagerPath = pathToFileURL(resolve(tmpOutDir, "main", "proxy-manager.js")).href;

  const { dispatchIpcCommand, getTokenState } = await loadCompiledMainModule(mainIndexPath);
  const proxyManagerModule = await import(proxyManagerPath);
  const keytarShim = requireFromScript(keytarShimPath);

  const stateView = getTokenState();
  assert(typeof stateView.masked === "boolean", "getTokenState should expose masked flag");
  assert(!("value" in stateView), "getTokenState must not expose plaintext token value");

  const originalStatus = proxyManagerModule.proxyManager.status.bind(proxyManagerModule.proxyManager);
  const originalRestart = proxyManagerModule.proxyManager.restart.bind(proxyManagerModule.proxyManager);
  let restartCalls = 0;

  proxyManagerModule.proxyManager.status = () => ({ status: "running" });
  proxyManagerModule.proxyManager.restart = async () => {
    restartCalls += 1;
    return { status: "running" };
  };

  const restartOnSaveResponse = await dispatchIpcCommand("token.save", {
    token: "pt_Task5RestartToken_Probe",
  });
  assert(restartOnSaveResponse && restartOnSaveResponse.ok === true, "token.save should succeed for restart probe");
  assert(restartCalls === 1, "token.save must restart running proxy to apply updated token");

  proxyManagerModule.proxyManager.status = originalStatus;
  proxyManagerModule.proxyManager.restart = originalRestart;

  const token = "pt_Task5SmokeToken_ABC123";

  const saveResponse = await dispatchIpcCommand("token.save", { token });
  assert(saveResponse && saveResponse.ok === true, "token.save should return ok envelope");

  const statusAfterSave = await dispatchIpcCommand("proxy.status", {});
  assert(statusAfterSave && statusAfterSave.ok === true, "proxy.status after save should return ok envelope");
  assert(statusAfterSave.data.token_masked === true, "proxy.status should surface token_masked=true after save");

  assert(existsSync(secureStorePath), "secure store file should exist after token.save");
  const storeRaw = readFileSync(secureStorePath, "utf-8");
  assert(!storeRaw.includes(token), "secure store content must not contain plaintext token");
  const parsedStore = JSON.parse(storeRaw);
  assert(parsedStore?.backend === "electron.safeStorage", "secure store backend marker should be electron.safeStorage");
  assert(parsedStore?.sentinel === "SAFE_STORAGE_BACKED", "secure store sentinel should indicate safeStorage backend");
  assert(typeof parsedStore?.encrypted_token_b64 === "string" && parsedStore.encrypted_token_b64.length > 0, "ciphertext should be present");

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

  const legacyToken = "pt_Task5LegacyMigrationToken";
  await keytarShim.setPassword(
    process.env.PUTER_DESKTOP_TOKEN_SERVICE,
    process.env.PUTER_DESKTOP_TOKEN_ACCOUNT,
    legacyToken,
  );
  writeFileSync(secureStorePath, legacySentinel, "utf-8");

  const migratedStatus = queryTokenMaskedInFreshProcess(mainIndexPath);
  assert(migratedStatus && migratedStatus.ok === true, "fresh process status should succeed after legacy migration setup");
  assert(migratedStatus.data.token_masked === true, "legacy keytar token should migrate and surface as masked");

  const storeAfterMigrationRaw = readFileSync(secureStorePath, "utf-8");
  assert(!storeAfterMigrationRaw.includes(legacyToken), "migrated secure store must not contain plaintext token");
  const migratedStore = JSON.parse(storeAfterMigrationRaw);
  assert(migratedStore?.backend === "electron.safeStorage", "migrated store should use safeStorage backend marker");
  assert(migratedStore?.sentinel === "SAFE_STORAGE_BACKED", "migrated store should use safeStorage sentinel marker");

  const removedFromLegacyShim = await keytarShim.getPassword(
    process.env.PUTER_DESKTOP_TOKEN_SERVICE,
    process.env.PUTER_DESKTOP_TOKEN_ACCOUNT,
  );
  assert(!removedFromLegacyShim, "legacy keytar token should be deleted after migration");

  const clearAfterMigration = await dispatchIpcCommand("token.clear", {});
  assert(clearAfterMigration && clearAfterMigration.ok === true, "token.clear should succeed after migration path");

  writeFileSync(
    resolve(evidenceDir, "task-5-persist-restart.txt"),
    [
      "task5_persist_restart_ok=true",
      "token_masked_after_save=true",
      "token_masked_after_clear=false",
      "legacy_keytar_migrated=true",
      `secure_store_path=${secureStorePath}`,
    ].join("\n") + "\n",
    "utf-8",
  );

  writeFileSync(
    resolve(evidenceDir, "task-5-redaction-check.txt"),
    `${leakCount}\n`,
    "utf-8",
  );

  writeFileSync(
    resolve(evidenceDir, "task-9-safe-storage-restart.txt"),
    [
      "task9_safe_storage_restart_ok=true",
      `secure_store_path=${secureStorePath}`,
      `token_masked_after_save=${freshStatusAfterSave.data.token_masked}`,
      `token_masked_after_clear=${freshStatusAfterClear.data.token_masked}`,
    ].join("\n") + "\n",
    "utf-8",
  );

  writeFileSync(
    resolve(evidenceDir, "task-9-migration.txt"),
    [
      "task9_legacy_keytar_migration_ok=true",
      `migrated_status_masked=${migratedStatus.data.token_masked}`,
      `legacy_removed=${removedFromLegacyShim === null}`,
      `store_backend=${migratedStore?.backend || "unknown"}`,
    ].join("\n") + "\n",
    "utf-8",
  );
}

main().catch((error) => {
  writeFileSync(resolve(evidenceDir, "task-5-smoke-error.txt"), `${String(error)}\n`, "utf-8");
  throw error;
});
