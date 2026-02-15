import json
import pathlib
import subprocess
import time


def main() -> int:
    cfg_path = pathlib.Path(".opencode/oh-my-opencode.json")
    project_dir = pathlib.Path.cwd()

    config = json.loads(cfg_path.read_text(encoding="utf-8"))
    lsp = config.get("lsp", {})

    results: list[dict] = []

    for name, spec in lsp.items():
        cmd = spec.get("command", [])
        rec = {"name": name, "status": "unknown", "detail": "", "command": cmd}

        try:
            proc = subprocess.Popen(
                cmd,
                cwd=str(project_dir),
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
        except Exception as exc:
            rec["status"] = "spawn_failed"
            rec["detail"] = str(exc)
            results.append(rec)
            continue

        time.sleep(2.5)
        code = proc.poll()

        if code is None:
            rec["status"] = "startup_ok"
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except Exception:
                proc.kill()
                proc.wait(timeout=3)
        else:
            out, err = proc.communicate(timeout=2)
            rec["status"] = "exited"
            rec["exit_code"] = code
            rec["detail"] = (err or out or "").strip().replace("\n", " | ")

        results.append(rec)

    print("SMOKE_RESULTS_BEGIN")
    ok = 0
    for r in results:
        line = f"{r['name']}: {r['status']}"
        if "exit_code" in r:
            line += f" (code={r['exit_code']})"
        if r.get("detail"):
            line += f" :: {r['detail'][:300]}"
        print(line)
        if r["status"] == "startup_ok":
            ok += 1
    print("SMOKE_RESULTS_END")
    print(f"total={len(results)}, ok={ok}")

    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
