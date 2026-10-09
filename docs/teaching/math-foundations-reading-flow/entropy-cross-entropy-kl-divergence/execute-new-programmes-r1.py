import hashlib
import json
import pathlib
import subprocess
import sys
from datetime import datetime, timezone

import numpy
import scipy

folder = pathlib.Path(__file__).resolve().parent
receipt = folder / "content-new-programme-execution-r1.json"
if receipt.exists():
    raise RuntimeError("Preserve the frozen execution receipt.")
results = []
for name in ("information_library.py", "penguins_log_loss.py"):
    source = folder / "content-prepared" / "programmes" / name
    run = subprocess.run([sys.executable, "-B", str(source)], capture_output=True,
                         text=True, encoding="utf-8", timeout=60)
    output = folder / "content-prepared" / "outputs" / (name + ".stdout.txt")
    error = output.with_suffix(".stderr.txt")
    output.write_text(run.stdout, encoding="utf-8", newline="")
    error.write_text(run.stderr, encoding="utf-8", newline="")
    results.append({"file": name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                    "exitCode": run.returncode, "stdout": run.stdout, "stderr": run.stderr,
                    "stdoutSha256": hashlib.sha256(output.read_bytes()).hexdigest()})
data = {"createdAt": datetime.now(timezone.utc).isoformat(), "author": "/root/queue_nonconvex_resume",
        "scope": "Exactly two new content programmes; no preserved old main replay",
        "python": sys.version, "numpy": numpy.__version__, "scipy": scipy.__version__,
        "programmes": results,
        "datasetSha256": hashlib.sha256((folder / "content-prepared/programmes/penguins.csv").read_bytes()).hexdigest()}
receipt.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(json.dumps(data, indent=2))
if any(result["exitCode"] for result in results):
    raise SystemExit(1)
