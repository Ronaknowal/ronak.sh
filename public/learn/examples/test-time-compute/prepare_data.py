"""Retrieve and verify the fixed GSM8K lesson subset before generation.

python prepare_data.py --output data
Requires a network connection once; the supplied data directory works offline.
"""
from pathlib import Path
import argparse
import hashlib
import json
import urllib.request

REVISION = "3101c7d5072418e28b9008a6636bde82a006892c"
FILES = {"test.jsonl": ("grade_school_math/data/test.jsonl", "3730d312f6e3440559ace48831e51066acaca737f6eabec99bccb9e4b3c39d14"),
         "GSM8K-LICENSE": ("LICENSE", "86bbb73e855821d7c401912fd4bf82e34313e6e3b6fd6f909f2b6cc9e209a53b")}


def prepare(output):
    output.mkdir(parents=True, exist_ok=False)
    provenance = []
    records = None
    for name, (remote, expected) in FILES.items():
        url = f"https://raw.githubusercontent.com/openai/grade-school-math/{REVISION}/{remote}"
        with urllib.request.urlopen(url, timeout=60) as response:
            raw = response.read()
        digest = hashlib.sha256(raw).hexdigest()
        if digest != expected:
            raise ValueError(f"Unexpected upstream bytes: {name}")
        provenance.append({"file": name, "url": url, "sha256": digest, "bytes": len(raw)})
        if name == "test.jsonl":
            records = [{"id": f"gsm8k-test-{i}", "source_row": i, **json.loads(line)}
                       for i, line in enumerate(raw.decode("utf8").splitlines()[:12])]
        else:
            (output / name).write_bytes(raw)
    text = json.dumps(records, ensure_ascii=False, indent=2) + "\n"
    (output / "selected.json").write_text(text, encoding="utf8", newline="\n")
    (output / "source.json").write_text(json.dumps({"sources": provenance,
        "selection": "first12 source rows, no result-dependent selection",
        "selected_sha256": hashlib.sha256(text.encode("utf8")).hexdigest()}, indent=2), encoding="utf8")
    return len(records)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("data"))
    args = parser.parse_args()
    print({"records": prepare(args.output), "output": str(args.output)})
