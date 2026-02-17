import { app, safeStorage } from "electron";

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  app.exit(1);
  throw new Error(message);
}

async function main(): Promise<void> {
  const mode = process.argv[2];
  const payloadB64 = process.argv[3];

  if ((mode !== "encrypt" && mode !== "decrypt") || !payloadB64) {
    fail("safeStorage helper requires mode(encrypt|decrypt) and payload");
  }

  await app.whenReady();

  if (!safeStorage.isEncryptionAvailable()) {
    fail("safeStorage encryption is unavailable on this device");
  }

  if (mode === "encrypt") {
    const plainText = Buffer.from(payloadB64, "base64").toString("utf-8");
    const encrypted = safeStorage.encryptString(plainText).toString("base64");
    process.stdout.write(encrypted);
    app.exit(0);
    return;
  }

  const decrypted = safeStorage.decryptString(Buffer.from(payloadB64, "base64"));
  process.stdout.write(Buffer.from(decrypted, "utf-8").toString("base64"));
  app.exit(0);
}

void main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  fail(message);
});
