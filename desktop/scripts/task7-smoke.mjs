import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, "..", "..");
const desktopRoot = resolve(workspaceRoot, "desktop");
const tmpOutDir = resolve(desktopRoot, ".tmp-task7");
const evidenceDir = resolve(workspaceRoot, ".sisyphus", "evidence");
const secureStorePath = resolve(tmpOutDir, "secure-store.json");

mkdirSync(evidenceDir, { recursive: true });

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run(command, args, env = process.env) {
  const child = spawnSync(command, args, {
    cwd: workspaceRoot,
    encoding: "utf-8",
    env,
  });

  if (child.error) {
    throw new Error(String(child.error));
  }

  if (child.status !== 0) {
    throw new Error(child.stderr || child.stdout || `${command} failed`);
  }

  return child.stdout.trim();
}

function withEnv(overrides) {
  return {
    ...process.env,
    ...overrides,
  };
}

function applyScopedEnv(overrides) {
  const previous = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined || value === null) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }

  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

function runNpm(args) {
  const npmExecPath = process.env.npm_execpath;
  if (!npmExecPath) {
    throw new Error("npm_execpath is not available in environment");
  }

  return run(process.execPath, [npmExecPath, ...args]);
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
    ".tmp-task7",
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

async function runProxyTests() {
  const code = [
    "import proxy.tests.task7_proxy_tests as t",
    "t.test_healthz_ok()",
    "t.test_models_without_token_returns_structured_error()",
    "t.test_chat_stream_true_rejected()",
    "t.test_embeddings_contract_rejected()",
    "print('proxy_tests_ok=true')",
  ].join("; ");

  run("python", ["-c", code], withEnv({
      PUTER_TOKEN: "pt_task7_token",
      HOST: "127.0.0.1",
      PORT: "11435",
      LOG_LEVEL: "INFO",
      PROXY_FEATURE_ENABLED: "1",
    }));
}

async function runUiTests() {
  runNpm(["--prefix", "desktop", "run", "test"]);
}

async function runIntegrationAndContracts() {
  const restoreEnv = applyScopedEnv({
    NODE_ENV: "production",
    PUTER_TOKEN: "",
    PUTER_DESKTOP_SECURE_STORE_PATH: secureStorePath,
  });

  let dispatchIpcCommand;
  let stopSucceeded = true;

  try {
    compileDesktopMainTs();

    const mainIndexPath = pathToFileURL(resolve(tmpOutDir, "index.js")).href;
    ({ dispatchIpcCommand } = await import(mainIndexPath));

    const clear = await dispatchIpcCommand("token.clear", {});
    assert(clear && clear.ok === true, "token.clear must succeed before integration test");

    const start = await dispatchIpcCommand("proxy.start", {});
    assert(start && start.ok === true, "proxy.start must succeed for integration test");

    let running = false;
    for (let i = 0; i < 50; i += 1) {
      const status = await dispatchIpcCommand("proxy.status", {});
      assert(status && status.ok === true, "proxy.status must return ok envelope");
      if (status.data.status === "running") {
        running = true;
        break;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    }

    assert(running, "proxy must reach running state for integration validation");

    const chat = await fetch("http://127.0.0.1:11435/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [{ role: "user", content: "ping" }],
        stream: false,
      }),
    });
    const chatBody = await chat.json();
    assert(chat.status === 401, "chat integration flow should return 401 without token");
    assert(chatBody?.error?.code === "token_missing", "chat integration should return token_missing code");

    const emb = await fetch("http://127.0.0.1:11435/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: "ping" }),
    });
    const embBody = await emb.json();
    assert(emb.status === 404, "embeddings contract must return 404");
    assert(embBody?.error?.code === "invalid_request", "embeddings contract code must be invalid_request");

    const streamReject = await fetch("http://127.0.0.1:11435/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [{ role: "user", content: "ping" }],
        stream: true,
      }),
    });
    const streamBody = await streamReject.json();
    assert(streamReject.status === 501, "stream=true contract must return 501");
    assert(
      streamBody?.error?.code === "streaming_not_supported",
      "stream=true contract code must be streaming_not_supported",
    );

    writeFileSync(
      resolve(evidenceDir, "task-7-tests.txt"),
      [
        "proxy_tests=pass",
        "ui_tests=pass",
        "integration_chat_flow=pass",
        `chat_status=${chat.status}`,
        `chat_code=${chatBody?.error?.code || "unknown"}`,
      ].join("\n") + "\n",
      "utf-8",
    );

    writeFileSync(
      resolve(evidenceDir, "task-7-stream-test.txt"),
      `${JSON.stringify({ status: streamReject.status, code: streamBody?.error?.code || null }, null, 2)}\n`,
      "utf-8",
    );

  } finally {
    if (typeof dispatchIpcCommand === "function") {
      const stop = await dispatchIpcCommand("proxy.stop", {});
      if (!(stop && stop.ok === true)) {
        stopSucceeded = false;
      }
    }

    restoreEnv();
  }

  assert(stopSucceeded, "proxy.stop must succeed after integration validation");
}

async function main() {
  await runProxyTests();
  await runUiTests();
  await runIntegrationAndContracts();
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  writeFileSync(resolve(evidenceDir, "task-7-smoke-error.txt"), `${message}\n`, "utf-8");
  throw error;
});
