import * as keytar from "keytar";

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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
const KEYCHAIN_SENTINEL = "KEYCHAIN_BACKED";

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

class KeytarTokenSecureStore implements TokenSecureStore {
  private readonly storePath: string;

  constructor(storePath = resolveStorePath()) {
    this.storePath = storePath;
  }

  public getStorePath(): string {
    return this.storePath;
  }

  public async loadToken(): Promise<string> {
    try {
      const token = await keytar.getPassword(resolveTokenService(), resolveTokenAccount());
      if (typeof token === "string" && token.trim() !== "") {
        return token.trim();
      }

      if (existsSync(this.storePath)) {
        rmSync(this.storePath, { force: true });
      }

      return "";
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
      await keytar.setPassword(resolveTokenService(), resolveTokenAccount(), normalized);
      mkdirSync(dirname(this.storePath), { recursive: true });
      writeFileSync(this.storePath, `${KEYCHAIN_SENTINEL}\n`, {
        encoding: "utf-8",
        mode: 0o600,
      });
    } catch (err) {
      throw asSecureStoreError(err, "Unable to save token to secure store");
    }
  }

  public async clearToken(): Promise<void> {
    try {
      await keytar.deletePassword(resolveTokenService(), resolveTokenAccount());
      if (existsSync(this.storePath)) {
        rmSync(this.storePath, { force: true });
      }
    } catch (err) {
      throw asSecureStoreError(err, "Unable to clear token from secure store");
    }
  }
}

export function createTokenSecureStore(storePath?: string): TokenSecureStore {
  return new KeytarTokenSecureStore(storePath);
}
