"""Run one pinned CPU server and at most four fixed completion requests.

Any failure stops this sequence; nothing retries generation. Each request's
client runs in a separate supervised process with a 60-second wall timeout.
"""
import argparse
import json
import os
from pathlib import Path
import platform
import socket
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import Request as HTTPRequest, urlopen
from acquire_engine import sha256, COMMIT


PROMPTS = [
    ("A", "The capital of France is"),
    ("B", "A list of three colors: red, blue,"),
    ("C", "def add(a, b):\n    return"),
    ("D", "The word café contains"),
]


def json_request(base, route, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf8")
    request = HTTPRequest(base + route, data=data,
                          headers={} if data is None else {"Content-Type": "application/json"})
    with urlopen(request, timeout=2) as response:
        raw = response.read(2**20 + 1)
        if len(raw) > 2**20:
            raise ValueError("probe response too large")
        return json.loads(raw)


def run(acquisition, conversion, output):
    acquisition, conversion, output = map(Path, (acquisition, conversion, output))
    assets = json.loads(acquisition.read_text(encoding="utf8"))
    model = json.loads(conversion.read_text(encoding="utf8"))
    if assets.get("status") != "passed" or assets.get("commit") != COMMIT or model.get("status") != "passed":
        raise ValueError("acquisition and conversion must have passed")
    if model["acquisition_sha256"] != sha256(acquisition):
        raise ValueError("conversion belongs to another acquisition")
    for item in assets["binary_files"]:
        if sha256(acquisition.parent / item["path"]) != item["sha256"]:
            raise ValueError("native binary/DLL changed")
    if sha256(model["gguf"]["path"]) != model["gguf"]["sha256"]:
        raise ValueError("converted model changed")
    output.mkdir(parents=True, exist_ok=False)
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    base = f"http://127.0.0.1:{port}"
    command = [assets["server"], "-m", model["gguf"]["path"], "-ngl", "0",
               "-c", "512", "-np", "1", "-t", "2", "-tb", "2", "--no-warmup",
               "--host", "127.0.0.1", "--port", str(port)]
    environment = {key: value for key, value in os.environ.items() if not key.startswith("LLAMA_ARG_")}
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    report = {"status": "started", "base": base, "command": command,
              "platform": {"system": platform.system(), "release": platform.release(),
                           "machine": platform.machine(), "python": platform.python_version()},
              "acquisition_sha256": sha256(acquisition), "conversion_sha256": sha256(conversion),
              "requests": [], "generation_attempts": 0}
    process = None
    try:
        with (output / "server.stdout.txt").open("xb") as stdout, (output / "server.stderr.txt").open("xb") as stderr:
            process = subprocess.Popen(command, stdout=stdout, stderr=stderr, env=environment, cwd=output.resolve(),
                                       creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
            report["pid"] = process.pid
            deadline = time.monotonic() + 120
            while True:
                if process.poll() is not None:
                    raise RuntimeError("server exited during startup")
                if time.monotonic() > deadline:
                    raise TimeoutError("server startup deadline reached")
                try:
                    health = json_request(base, "/health")
                    if health.get("status") == "ok":
                        report["health"] = health
                        break
                except (URLError, TimeoutError, OSError):
                    pass
                time.sleep(.2)
            report["props"] = json_request(base, "/props")
            report["models"] = json_request(base, "/models")
            prepared = []
            for request_id, text in PROMPTS:
                tokenized = json_request(base, "/tokenize", {"content": text, "add_special": True,
                                          "parse_special": False, "with_pieces": True})
                entries = tokenized["tokens"]
                ids = [entry["id"] for entry in entries]
                if not ids or len(ids) > 64 or len(ids) + 16 > 512:
                    raise ValueError("prompt outside fixed token/context envelope")
                if any(isinstance(token, bool) or not isinstance(token, int) or token < 0 for token in ids):
                    raise ValueError("tokenizer returned invalid IDs")
                # Explicit token input preserves the exact counted special-token policy.
                payload = {"prompt": ids, "n_predict": 16, "temperature": 0,
                           "samplers": ["temperature"], "seed": 0, "cache_prompt": False,
                           "return_tokens": True, "stream": True}
                path = output / f"request-{request_id}.json"
                path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")
                record = {"id": request_id, "text": text, "tokenization": tokenized,
                          "payload": payload, "status": "prepared"}
                report["requests"].append(record)
                prepared.append((record, path))
            for record, request_path in prepared:
                request_id = record["id"]
                destination = output / request_id
                client = [sys.executable, "-B", str(Path(__file__).with_name("stream_client.py")),
                          "--base", base, "--request", str(request_path.resolve()),
                          "--output", str(destination.resolve())]
                report["generation_attempts"] += 1
                record["status"] = "attempted"
                # Persist the attempted boundary before launching the generating request.
                (output / "progress.json").write_text(json.dumps(report, indent=2), encoding="utf8")
                with (output / f"client-{request_id}.stdout.txt").open("xb") as out, (output / f"client-{request_id}.stderr.txt").open("xb") as err:
                    response = subprocess.run(client, stdout=out, stderr=err, env=environment,
                                              timeout=60, check=False,
                                              creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
                record["client_exit_code"] = response.returncode
                result_path = destination / "result.json"
                if result_path.is_file():
                    record["result_sha256"] = sha256(result_path)
                    result = json.loads(result_path.read_text(encoding="utf8"))
                    record["result"] = result
                if response.returncode != 0 or not result_path.is_file() or result.get("status") != "passed":
                    raise RuntimeError(f"request {request_id} failed; no generation retry")
                record["status"] = "passed"
            report["status"] = "passed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = {"type": type(error).__name__, "message": str(error)}
        raise
    finally:
        if process is not None:
            report["server_exit_before_cleanup"] = process.poll()
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
            report["server_final_exit_code"] = process.returncode
            report["owned_process_terminated"] = process.poll() is not None
        (output / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--acquisition", required=True, type=Path)
    parser.add_argument("--conversion", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    result = run(args.acquisition, args.conversion, args.output)
    print(json.dumps({"status": result["status"], "generation_attempts": result["generation_attempts"],
                      "owned_process_terminated": result["owned_process_terminated"]}))
