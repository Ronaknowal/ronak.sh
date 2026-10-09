"""Record a loopback POST completion stream, retaining bytes before parsing.

The caller may supervise this process with a hard wall timeout. Socket timeout
is a per-read limit; content receive times are client clocks, not kernel clocks.
"""
import argparse
import base64
import json
from pathlib import Path
import time
from urllib.parse import urlsplit
from urllib.error import HTTPError
from urllib.request import Request as HTTPRequest, urlopen
from sse_records import SSEDataParser, native_record


def local_base(url):
    parsed = urlsplit(url)
    if (parsed.scheme != "http" or parsed.hostname != "127.0.0.1" or
            parsed.username or parsed.password or parsed.path not in ("", "/") or
            parsed.query or parsed.fragment or parsed.port is None):
        raise ValueError("expected a plain http://127.0.0.1:PORT base URL")
    return url.rstrip("/")


def record_completion(base, payload, directory, wall_seconds=55.0, max_bytes=2**21):
    base = local_base(base)
    if not (0 < wall_seconds <= 55) or max_bytes <= 0:
        raise ValueError("invalid client safety bounds")
    destination = Path(directory)
    destination.mkdir(parents=True, exist_ok=False)
    (destination / "request.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")
    start = time.perf_counter()
    parser = SSEDataParser()
    records, contents, nonterminal_ids = [], [], []
    terminal = None
    byte_count = 0
    report = {"base": base, "clock": "client perf_counter elapsed seconds",
              "read_size_bytes": 1, "status": "incomplete", "events": records,
              "first_content_seconds": None, "terminal_seconds": None}
    response = None
    try:
        request = HTTPRequest(base + "/completion", data=json.dumps(payload).encode("utf8"),
                              headers={"Content-Type": "application/json", "Accept": "text/event-stream"}, method="POST")
        response = urlopen(request, timeout=5)
        if response.headers.get_content_type() != "text/event-stream":
            raise ValueError("response is not an SSE event stream")
        with (destination / "raw.bin").open("xb") as raw, (destination / "receive.jsonl").open("x", encoding="utf8") as log:
            while True:
                if time.perf_counter() - start > wall_seconds:
                    raise TimeoutError("client elapsed-time limit reached")
                chunk = response.read(1)
                elapsed = time.perf_counter() - start
                if not chunk:
                    break
                byte_count += len(chunk)
                raw.write(chunk)
                raw.flush()
                log.write(json.dumps({"receive_seconds": elapsed, "bytes_b64": base64.b64encode(chunk).decode("ascii")}) + "\n")
                log.flush()
                if byte_count > max_bytes:
                    raise ValueError("response byte envelope exceeded")
                for data in parser.feed(chunk):
                    item = native_record(data)
                    if terminal is not None:
                        raise ValueError("native data event received after terminal event")
                    records.append({"receive_seconds": elapsed, "data": item})
                    content = item.get("content", "")
                    if content:
                        if report["first_content_seconds"] is None:
                            report["first_content_seconds"] = elapsed
                        contents.append(content)
                    if item.get("stop") is True:
                        terminal = item
                        report["terminal_seconds"] = elapsed
                    else:
                        nonterminal_ids.extend(item.get("tokens", []))
            parser.finish()
        if parser.discarded_partial_event:
            raise ValueError("EOF discarded an unfinished event")
        if terminal is None:
            raise ValueError("EOF without native stop:true terminal event")
        report["status"] = "passed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = {"type": type(error).__name__, "message": str(error)}
        if isinstance(error, HTTPError):
            report["http_status"] = error.code
            try:
                body = error.read(max_bytes + 1)
                with (destination / "http-error.bin").open("xb") as failed_body:
                    failed_body.write(body)
                report["http_error_body_exceeded_limit"] = len(body) > max_bytes
            except Exception as read_error:
                report["http_error_read_failure"] = type(read_error).__name__ + ": " + str(read_error)
            finally:
                error.close()
    finally:
        if response is not None:
            response.close()
        report.update({"connection_end_seconds": time.perf_counter() - start,
                       "raw_bytes": byte_count, "assembled_content": "".join(contents),
                       "nonterminal_token_ids": nonterminal_ids,
                       "terminal": terminal,
                       "terminal_token_ids": [] if terminal is None else terminal.get("tokens", []),
                       "token_accounting": "Nonterminal and terminal arrays retained separately; do not double-count a terminal cumulative array.",
                       "partial_event": parser.discarded_partial_event})
        (destination / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    return report


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--base", required=True)
    cli.add_argument("--request", required=True, type=Path)
    cli.add_argument("--output", required=True, type=Path)
    args = cli.parse_args()
    result = record_completion(args.base, json.loads(args.request.read_text(encoding="utf8")), args.output)
    print(json.dumps({"status": result["status"], "raw_bytes": result["raw_bytes"],
                      "event_count": len(result["events"])}))
    raise SystemExit(0 if result["status"] == "passed" else 1)
