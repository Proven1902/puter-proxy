import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { homedir, hostname, userInfo } from "node:os";

export class TokenSecureStoreError extends Error {
  public readonly code = "secure_store_unavailable";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TokenSecureStoreError";
  }
}

interface PersistedTokenEnvelope {
  version: 1;
  iv: string;
  tag: string;
  cipher: string;
}

export interface TokenSecureStore {
  loadToken(): string;
  saveToken(token: string): void;
  clearToken(): void;
  getStorePath(): string;
}

const CIPHER_ALGO = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KDF_ITERATIONS = 120_000;
const KDF_SALT = "puter-desktop-secure-store-v1";

function resolveStorePath(): string {
  const override = process.env.PUTER_DESKTOP_SECURE_STORE_PATH?.trim();
  if (override) {
    return resolve(override);
  }

  return resolve(homedir(), ".puter-desktop", "secure-store.json");
}

function deriveKey(): Buffer {
  const user = userInfo();
  const machineSeed = [process.platform, process.arch, hostname(), user.username].join("|");
  return pbkdf2Sync(machineSeed, KDF_SALT, KDF_ITERATIONS, KEY_LENGTH, "sha256");
}

function encryptToken(token: string): PersistedTokenEnvelope {
  const normalized = token.trim();
  if (!normalized) {
    throw new Error("Token must be non-empty");
  }

  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(CIPHER_ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(normalized, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    cipher: encrypted.toString("base64"),
  };
}

function decryptToken(payload: PersistedTokenEnvelope): string {
  if (payload.version !== 1) {
    throw new Error("Unsupported secure store payload version");
  }

  const key = deriveKey();
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const encrypted = Buffer.from(payload.cipher, "base64");

  const decipher = createDecipheriv(CIPHER_ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf-8").trim();

  return plain;
}

function parsePayload(raw: string): PersistedTokenEnvelope {
  const parsed = JSON.parse(raw) as Partial<PersistedTokenEnvelope>;

  if (
    parsed.version !== 1 ||
    typeof parsed.iv !== "string" ||
    typeof parsed.tag !== "string" ||
    typeof parsed.cipher !== "string"
  ) {
    throw new Error("Secure store payload is malformed");
  }

  return {
    version: 1,
    iv: parsed.iv,
    tag: parsed.tag,
    cipher: parsed.cipher,
  };
}

function asSecureStoreError(err: unknown, fallbackMessage: string): TokenSecureStoreError {
  if (err instanceof TokenSecureStoreError) {
    return err;
  }

  const message = err instanceof Error ? err.message : fallbackMessage;
  return new TokenSecureStoreError(message, { cause: err });
}

class FileTokenSecureStore implements TokenSecureStore {
  private readonly storePath: string;

  constructor(storePath = resolveStorePath()) {
    this.storePath = storePath;
  }

  public getStorePath(): string {
    return this.storePath;
  }

  public loadToken(): string {
    if (!existsSync(this.storePath)) {
      return "";
    }

    try {
      const raw = readFileSync(this.storePath, "utf-8");
      const payload = parsePayload(raw);
      return decryptToken(payload);
    } catch (err) {
      throw asSecureStoreError(err, "Unable to load token from secure store");
    }
  }

  public saveToken(token: string): void {
    const normalized = token.trim();
    if (!normalized) {
      throw new Error("Token must be non-empty");
    }

    try {
      const payload = encryptToken(normalized);
      mkdirSync(dirname(this.storePath), { recursive: true });
      writeFileSync(this.storePath, `${JSON.stringify(payload, null, 2)}\n`, {
        encoding: "utf-8",
        mode: 0o600,
      });
    } catch (err) {
      throw asSecureStoreError(err, "Unable to save token to secure store");
    }
  }

  public clearToken(): void {
    if (!existsSync(this.storePath)) {
      return;
    }

    try {
      rmSync(this.storePath, { force: true });
    } catch (err) {
      throw asSecureStoreError(err, "Unable to clear token from secure store");
    }
  }
}

export function createTokenSecureStore(storePath?: string): TokenSecureStore {
  return new FileTokenSecureStore(storePath);
}
