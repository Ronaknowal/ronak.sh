"""Verify the retained checkpoint and convert once with the matching converter.

Set up the converter's documented dependencies before invoking this command.
This uses its native F16 conversion, not a claim of numerical bit identity.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
from acquire_engine import sha256, COMMIT


def convert(acquisition, checkpoint, identity, output):
    acquisition, checkpoint, identity, output = map(Path, (acquisition, checkpoint, identity, output))
    acquired = json.loads(acquisition.read_text(encoding="utf8"))
    if acquired.get("status") != "passed" or acquired.get("commit") != COMMIT:
        raise ValueError("expected the accepted exact acquisition")
    model = json.loads(identity.read_text(encoding="utf8"))
    if model.get("model") != "EleutherAI/pythia-14m" or model.get("revision") != "cf967c0a9a04383db6f7b1108d86b2962634b4ac":
        raise ValueError("unexpected model identity")
    source_root = Path(acquired["source_root"])
    for item in acquired["converter_files"]:
        if sha256(source_root / item["path"]) != item["sha256"]:
            raise ValueError("converter changed since acquisition")
    for item in model["files"]:
        source = checkpoint / item["name"]
        if source.stat().st_size != item["bytes"] or sha256(source) != item["sha256"]:
            raise ValueError(f"model file mismatch: {item['name']}")
    output.mkdir(parents=True, exist_ok=False)
    gguf = output.resolve() / "pythia-14m-f16.gguf"
    command = [sys.executable, "-B", str(source_root / "convert_hf_to_gguf.py"),
               str(checkpoint.resolve()), "--outfile", str(gguf), "--outtype", "f16"]
    report = {"status": "started", "command": command, "model": model,
              "converter_commit": COMMIT, "acquisition_sha256": sha256(acquisition)}
    try:
        environment = dict(os.environ)
        environment["PYTHONDONTWRITEBYTECODE"] = "1"
        environment["HF_HUB_OFFLINE"] = "1"
        environment["TRANSFORMERS_OFFLINE"] = "1"
        with (output / "stdout.txt").open("xb") as stdout, (output / "stderr.txt").open("xb") as stderr:
            run = subprocess.run(command, stdout=stdout, stderr=stderr, env=environment, cwd=output.resolve(),
                                 timeout=180, check=False,
                                 creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        report["exit_code"] = run.returncode
        if run.returncode != 0 or not gguf.is_file():
            raise RuntimeError("conversion failed; inspect retained stdout/stderr")
        report["gguf"] = {"path": str(gguf), "bytes": gguf.stat().st_size, "sha256": sha256(gguf)}
        report["status"] = "passed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = {"type": type(error).__name__, "message": str(error)}
        raise
    finally:
        (output / "conversion.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--acquisition", required=True, type=Path)
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--identity", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(convert(args.acquisition, args.checkpoint, args.identity, args.output), indent=2))
