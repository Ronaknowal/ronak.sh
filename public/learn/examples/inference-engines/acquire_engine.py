"""Explicitly acquire one pinned CPU engine and its matching converter source.

No model is downloaded. This command never runs a downloaded executable.
The new output directory retains partial downloads if any check fails.
"""
import argparse
import hashlib
import json
from pathlib import Path
import stat
import time
from urllib.request import urlopen
from zipfile import ZipFile


COMMIT = "d81235049384534c167caea52b85a694f6103d14"
TAG = "b11429"
ASSET = "llama-b11429-bin-win-cpu-x64.zip"
ASSET_SHA256 = "1283323272b04cd07905816a597a0da810918102de958f4ff6f7bbaa70ed2efe"
ASSET_BYTES = 19398918


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for part in iter(lambda: stream.read(2**20), b""):
            digest.update(part)
    return digest.hexdigest()


def download(url, path, limit):
    total = 0
    started = time.monotonic()
    with urlopen(url, timeout=30) as response, path.open("xb") as output:
        while chunk := response.read(2**18):
            total += len(chunk)
            if total > limit or time.monotonic() - started > 300:
                raise ValueError("download size/time envelope exceeded")
            output.write(chunk)
    return {"url": url, "bytes": total, "sha256": sha256(path)}


def extract_checked(archive, destination):
    destination.mkdir(exist_ok=False)
    resolved = destination.resolve()
    with ZipFile(archive) as zipped:
        for entry in zipped.infolist():
            target = (resolved / entry.filename).resolve()
            if not target.is_relative_to(resolved) or stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError("unsafe archive member")
        if sum(entry.file_size for entry in zipped.infolist()) > 800 * 2**20:
            raise ValueError("unpacked archive exceeds envelope")
        zipped.extractall(resolved)


def acquire(directory):
    root = Path(directory).resolve()
    root.mkdir(parents=True, exist_ok=False)
    report = {"release": TAG, "commit": COMMIT, "status": "started", "downloads": {}}
    try:
        binary_zip = root / ASSET
        binary = download(f"https://github.com/ggml-org/llama.cpp/releases/download/{TAG}/{ASSET}", binary_zip, 25 * 2**20)
        report["downloads"]["binary"] = binary
        if binary["sha256"] != ASSET_SHA256 or binary["bytes"] != ASSET_BYTES:
            raise ValueError("binary archive differs from pinned publisher identity")
        extract_checked(binary_zip, root / "binary")
        source_zip = root / "source.zip"
        report["downloads"]["source"] = download(f"https://codeload.github.com/ggml-org/llama.cpp/zip/{COMMIT}", source_zip, 150 * 2**20)
        extract_checked(source_zip, root / "source")
        source_root = root / "source" / f"llama.cpp-{COMMIT}"
        if not (source_root / "convert_hf_to_gguf.py").is_file():
            raise ValueError("matching converter entrypoint missing")
        executables = list((root / "binary").rglob("llama-server.exe"))
        if len(executables) != 1:
            raise ValueError("expected exactly one native server executable")
        report["server"] = str(executables[0])
        report["source_root"] = str(source_root)
        report["binary_files"] = [{"path": str(file.relative_to(root)), "bytes": file.stat().st_size,
                                   "sha256": sha256(file)}
                                  for file in sorted((root / "binary").rglob("*")) if file.is_file()]
        report["converter_files"] = [{"path": str(file.relative_to(source_root)), "bytes": file.stat().st_size,
                                      "sha256": sha256(file)}
                                     for file in sorted(source_root.rglob("*.py"))
                                     if file.parts[len(source_root.parts)] in ("conversion", "gguf-py")
                                     or file.name == "convert_hf_to_gguf.py"]
        report["status"] = "passed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = {"type": type(error).__name__, "message": str(error)}
        raise
    finally:
        (root / "acquisition.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()
    print(json.dumps(acquire(arguments.output), indent=2))
