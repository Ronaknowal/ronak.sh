"""Execute one newly authored small programme and retain every attempt verbatim."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess
import sys
import ast
import platform
from importlib.metadata import version

OWNER = Path(__file__).resolve().parent
ALLOWED = {
    "fold_fitted_pipeline.py", "split_information_contracts.py", "finite_selection_optimism.py",
    "nested_procedure_from_indices.py", "parameter_spaces_and_sampling.py", "search_results_and_refit.py",
    "risk_and_covariance_exact.py", "bootstrap_the_whole_statistic.py", "holdout_mse_identity.py",
    "discrete_adaptive_search.py", "resource_tournaments.py", "ordinary_halving_audit.py",
    "practice_answers.py",
}


def bind(path):
    data = path.read_bytes()
    return {"file": path.name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def main():
    filename = sys.argv[1]
    if filename not in ALLOWED:
        raise ValueError("Only this content phase's new programmes may be executed.")
    path = OWNER / "programmes" / filename
    receipt_dir = OWNER / "checks/programme-attempts"
    receipt_dir.mkdir(parents=True, exist_ok=True)
    prior = sorted(receipt_dir.glob(filename + ".*.json"))
    identity = bind(path)
    dependencies = []
    for node in ast.walk(ast.parse(path.read_text(encoding="utf8"))):
        if isinstance(node, ast.ImportFrom) and node.module:
            local = path.with_name(node.module + ".py")
            if local.exists():
                dependencies.append(bind(local))
    for receipt in prior:
        record = json.loads(receipt.read_text())
        if record["source"]["sha256"] == identity["sha256"] and record.get("dependencies", []) == dependencies and record["returncode"] == 0:
            raise ValueError("This exact successful source already ran; reuse its retained evidence.")
    attempt = len(prior) + 1
    env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1", "PYTHONUTF8": "1",
           "OMP_NUM_THREADS": "1", "OPENBLAS_NUM_THREADS": "1", "MKL_NUM_THREADS": "1"}
    result = subprocess.run([sys.executable, str(path)], cwd=path.parent,
                            capture_output=True, env=env, timeout=90)
    prefix = receipt_dir / f"{filename}.{attempt}"
    stdout = prefix.with_name(prefix.name + ".stdout.txt")
    stderr = prefix.with_name(prefix.name + ".stderr.txt")
    stdout.write_bytes(result.stdout)
    stderr.write_bytes(result.stderr)
    record = {"schema": "classical21-new-programme-execution/v1",
              "at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "source": identity, "python": sys.executable, "command": [sys.executable, str(path)],
              "dependencies": dependencies,
              "versions": {"python": platform.python_version(), **{name: version(name) for name in ["numpy", "scipy", "pandas", "scikit-learn"]}},
              "returncode": result.returncode, "stdout": bind(stdout), "stderr": bind(stderr),
              "scope": "One new constructed educational programme; no retained science or checker execution"}
    prefix.with_name(prefix.name + ".json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf8")
    if result.returncode == 0:
        (path.with_name(filename + ".stdout.txt")).write_bytes(result.stdout)
        (path.with_name(filename + ".stderr.txt")).write_bytes(result.stderr)
    print(json.dumps(record))
    print(result.stdout.decode("utf8"))
    print(result.stderr.decode("utf8"))
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
