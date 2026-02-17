import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";

export class TokenSecureStoreError extends Error {
  public readonly code = "secure_store_unavailable";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TokenSecureStoreError";
  }
}

export interface TokenSecureStore {
  loadToken(): Promise<string>;
  saveToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
  getStorePath(): string;
}

const TOKEN_SERVICE_FALLBACK = "puter-desktop";
const TOKEN_ACCOUNT_FALLBACK = "puter-token";
const LEGACY_KEYCHAIN_SENTINEL = "KEYCHAIN_BACKED";
const SAFE_STORAGE_SENTINEL = "SAFE_STORAGE_BACKED";
const SAFE_STORAGE_HELPER_SCRIPT = "safe-storage-helper.js";

interface LegacyKeytarLike {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword?(service: string, account: string, password: string): Promise<boolean | void>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

interface SafeStorageLike {
  isEncryptionAvailable(): boolean;
  encryptString(plainText: string): Buffer;
  decryptString(encrypted: Buffer): string;
}

interface ElectronMainLike {
  safeStorage?: SafeStorageLike;
  app?: {
    isReady(): boolean;
  };
}

interface SafeStorageBlob {
  version: 1;
  backend: "electron.safeStorage";
  sentinel: typeof SAFE_STORAGE_SENTINEL;
  encrypted_token_b64: string;
}

function resolveTokenService(): string {
  const value = process.env.PUTER_DESKTOP_TOKEN_SERVICE?.trim();
  return value || TOKEN_SERVICE_FALLBACK;
}

function resolveTokenAccount(): string {
  const value = process.env.PUTER_DESKTOP_TOKEN_ACCOUNT?.trim();
  return value || TOKEN_ACCOUNT_FALLBACK;
}

function resolveStorePath(): string {
  const override = process.env.PUTER_DESKTOP_SECURE_STORE_PATH?.trim();
  if (override) {
    return resolve(override);
  }

  return resolve(homedir(), ".puter-desktop", "secure-store.json");
}

function asSecureStoreError(err: unknown, fallbackMessage: string): TokenSecureStoreError {
  if (err instanceof TokenSecureStoreError) {
    return err;
  }

  const message = err instanceof Error ? err.message : fallbackMessage;
  return new TokenSecureStoreError(message, { cause: err });
}

function isSafeStorageBlob(value: unknown): value is SafeStorageBlob {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const rec = value as Record<string, unknown>;
  return (
    rec.version === 1 &&
    rec.backend === "electron.safeStorage" &&
    rec.sentinel === SAFE_STORAGE_SENTINEL &&
    typeof rec.encrypted_token_b64 === "string" &&
    rec.encrypted_token_b64.trim() !== ""
  );
}

function resolveSafeStorageFromElectronRuntime(): SafeStorageLike | null {
  if (!process.versions.electron) {
    return null;
  }

  try {
    const electronModule = require("electron") as ElectronMainLike;
    if (!electronModule || typeof electronModule !== "object") {
      return null;
    }

    if (electronModule.app && typeof electronModule.app.isReady === "function" && !electronModule.app.isReady()) {
      return null;
    }

    const safeStorage = electronModule.safeStorage;
    if (!safeStorage) {
      return null;
    }

    return safeStorage;
  } catch {
    return null;
  }
}

function resolveElectronBinaryPath(): string {
  if (process.versions.electron && process.execPath) {
    return process.execPath;
  }

  try {
    const electronModule = require("electron") as unknown;
    if (typeof electronModule === "string" && electronModule.trim() !== "") {
      return electronModule;
    }
  } catch {
    // ignored
  }

  throw new TokenSecureStoreError("Electron binary path is unavailable for safeStorage helper");
}

function helperScriptPath(): string {
  const candidates = [
    resolve(__dirname, SAFE_STORAGE_HELPER_SCRIPT),
    resolve(__dirname, "main", SAFE_STORAGE_HELPER_SCRIPT),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

function runSafeStorageHelper(mode: "encrypt" | "decrypt", payloadB64: string): string {
  const helper = helperScriptPath();
  const electronBinary = resolveElectronBinaryPath();
  if (!existsSync(helper)) {
    throw new TokenSecureStoreError(`safeStorage helper is missing: ${helper}`);
  }

  const helperEnv: Record<string, string | undefined> = {
    ...process.env,
  };
  delete helperEnv.ELECTRON_RUN_AS_NODE;

  const child = spawnSync(electronBinary, [helper, mode, payloadB64], {
    encoding: "utf-8",
    windowsHide: true,
    cwd: dirname(electronBinary),
    env: helperEnv,
  });

  if (child.error) {
    throw asSecureStoreError(child.error, "Unable to execute safeStorage helper");
  }

  if (child.status !== 0) {
    const stderr = (child.stderr || child.stdout || "safeStorage helper failed").trim();
    throw new TokenSecureStoreError(stderr);
  }

  const output = (child.stdout || "").trim();
  if (!output) {
    throw new TokenSecureStoreError("safeStorage helper returned empty output");
  }

  return output;
}

function isModuleNotFoundError(err: unknown, moduleName: string): boolean {
  if (typeof err !== "object" || err === null) {
    return false;
  }

  const rec = err as Record<string, unknown>;
  if (rec.code === "MODULE_NOT_FOUND") {
    return true;
  }

  return typeof rec.message === "string" && rec.message.includes(`'${moduleName}'`);
}

async function loadLegacyKeytarModule(): Promise<LegacyKeytarLike | null> {
  const overridePath = process.env.PUTER_DESKTOP_LEGACY_KEYTAR_MODULE?.trim();
  if (overridePath) {
    const imported = require(resolve(overridePath)) as {
      default?: LegacyKeytarLike;
      getPassword?: LegacyKeytarLike["getPassword"];
      deletePassword?: LegacyKeytarLike["deletePassword"];
    };
    const candidate = imported.default ?? imported;
    if (typeof candidate.getPassword !== "function" || typeof candidate.deletePassword !== "function") {
      throw new TokenSecureStoreError("Legacy keytar override module has invalid shape");
    }

    return {
      getPassword: candidate.getPassword,
      deletePassword: candidate.deletePassword,
    };
  }

  const legacyModuleName = ["key", "tar"].join("");
  try {
    const imported = require(legacyModuleName) as {
      default?: LegacyKeytarLike;
      getPassword?: LegacyKeytarLike["getPassword"];
      deletePassword?: LegacyKeytarLike["deletePassword"];
    };

    const candidate = imported.default ?? imported;
    if (typeof candidate.getPassword === "function" && typeof candidate.deletePassword === "function") {
      return {
        getPassword: candidate.getPassword,
        deletePassword: candidate.deletePassword,
      };
    }

    return null;
  } catch (err) {
    if (isModuleNotFoundError(err, legacyModuleName)) {
      return null;
    }
    throw err;
  }
}

class SafeStorageTokenSecureStore implements TokenSecureStore {
  private readonly storePath: string;

  constructor(storePath = resolveStorePath()) {
    this.storePath = storePath;
  }

  public getStorePath(): string {
    return this.storePath;
  }

  public async loadToken(): Promise<string> {
    if (!existsSync(this.storePath)) {
      return "";
    }

    try {
      const raw = readFileSync(this.storePath, "utf-8").trim();
      if (!raw) {
        rmSync(this.storePath, { force: true });
        return "";
      }

      if (raw === LEGACY_KEYCHAIN_SENTINEL) {
        return await this.migrateFromLegacyKeytar();
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        if (raw === SAFE_STORAGE_SENTINEL) {
          rmSync(this.storePath, { force: true });
          return "";
        }

        throw new TokenSecureStoreError("Secure store payload is malformed");
      }

      if (!isSafeStorageBlob(parsed)) {
        throw new TokenSecureStoreError("Secure store payload does not match expected schema");
      }

      const token = this.decryptToken(parsed.encrypted_token_b64).trim();
      if (!token) {
        rmSync(this.storePath, { force: true });
        return "";
      }

      return token;
    } catch (err) {
      throw asSecureStoreError(err, "Unable to load token from secure store");
    }
  }

  public async saveToken(token: string): Promise<void> {
    const normalized = token.trim();
    if (!normalized) {
      throw new Error("Token must be non-empty");
    }

    try {
      this.writeEncryptedBlob(normalized);
    } catch (err) {
      throw asSecureStoreError(err, "Unable to save token to secure store");
    }
  }

  public async clearToken(): Promise<void> {
    try {
      if (existsSync(this.storePath)) {
        rmSync(this.storePath, { force: true });
      }

      await this.clearLegacyKeytarTokenBestEffort();
    } catch (err) {
      throw asSecureStoreError(err, "Unable to clear token from secure store");
    }
  }

  private writeEncryptedBlob(token: string): void {
    const encryptedToken = this.encryptToken(token);
    const payload: SafeStorageBlob = {
      version: 1,
      backend: "electron.safeStorage",
      sentinel: SAFE_STORAGE_SENTINEL,
      encrypted_token_b64: encryptedToken,
    };

    mkdirSync(dirname(this.storePath), { recursive: true });
    writeFileSync(this.storePath, `${JSON.stringify(payload)}\n`, {
      encoding: "utf-8",
      mode: 0o600,
    });
  }

  private encryptToken(token: string): string {
    const safeStorage = resolveSafeStorageFromElectronRuntime();
    if (safeStorage) {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new TokenSecureStoreError("safeStorage encryption is unavailable on this device");
      }

      return safeStorage.encryptString(token).toString("base64");
    }

    const plainB64 = Buffer.from(token, "utf-8").toString("base64");
    return runSafeStorageHelper("encrypt", plainB64);
  }

  private decryptToken(encryptedTokenB64: string): string {
    const safeStorage = resolveSafeStorageFromElectronRuntime();
    if (safeStorage) {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new TokenSecureStoreError("safeStorage decryption is unavailable on this device");
      }

      return safeStorage.decryptString(Buffer.from(encryptedTokenB64, "base64"));
    }

    const decryptedB64 = runSafeStorageHelper("decrypt", encryptedTokenB64);
    return Buffer.from(decryptedB64, "base64").toString("utf-8");
  }

  private async migrateFromLegacyKeytar(): Promise<string> {
    const legacyKeytar = await loadLegacyKeytarModule();
    if (!legacyKeytar) {
      rmSync(this.storePath, { force: true });
      return "";
    }

    const token = await legacyKeytar.getPassword(resolveTokenService(), resolveTokenAccount());
    if (typeof token !== "string" || token.trim() === "") {
      rmSync(this.storePath, { force: true });
      return "";
    }

    const normalized = token.trim();
    this.writeEncryptedBlob(normalized);
    await legacyKeytar.deletePassword(resolveTokenService(), resolveTokenAccount());
    return normalized;
  }

  private async clearLegacyKeytarTokenBestEffort(): Promise<void> {
    const legacyKeytar = await loadLegacyKeytarModule();
    if (!legacyKeytar) {
      return;
    }

    try {
      await legacyKeytar.deletePassword(resolveTokenService(), resolveTokenAccount());
    } catch {
      // best effort cleanup only
    }
  }
}

export function createTokenSecureStore(storePath?: string): TokenSecureStore {
  return new SafeStorageTokenSecureStore(storePath);
}
