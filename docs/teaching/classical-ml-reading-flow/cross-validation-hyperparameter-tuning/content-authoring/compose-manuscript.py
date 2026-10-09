"""Compose literal authored sections and complete source/stream placements."""
from pathlib import Path
import hashlib
import json
import re

OWNER = Path(__file__).resolve().parent
PROGRAMMES = {
    "P01": "cv_tiny.py", "P02": "cv_penguins.py", "P03": "cv_optuna.py",
    "P04": "fold_fitted_pipeline.py", "P05": "split_information_contracts.py",
    "P06": "finite_selection_optimism.py", "P07": "nested_procedure_from_indices.py",
    "P08": "parameter_spaces_and_sampling.py", "P09": "search_results_and_refit.py",
    "P10": "risk_and_covariance_exact.py", "P11": "bootstrap_the_whole_statistic.py",
    "P12": "holdout_mse_identity.py", "P13": "discrete_adaptive_search.py",
    "P14": "resource_tournaments.py", "P15": "ordinary_halving_audit.py",
    "A01": "practice_answers.py",
}


def bind(path):
    data = path.read_bytes()
    return {"path": path.relative_to(OWNER).as_posix(), "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest()}


def programme(match):
    identifier = match.group(1)
    filename = PROGRAMMES[identifier]
    source = OWNER / "programmes" / filename
    output = source.with_name(filename + ".stdout.txt")
    retained = identifier in {"P01", "P02", "P03"}
    role = "Exact retained displayed stdout; historical execution, without retained terminal process newline." if retained else "Complete actual stdout from this new constructed programme's recorded execution."
    block = f"<!-- Programme {identifier}; source programmes/{filename}; role {'retained' if retained else 'new executed'}. -->\n\nSave as `{filename}`.\n\n```python\n" + source.read_bytes().decode("utf8") + "\n```\n\n" + role + "\n\n```text\n" + output.read_bytes().decode("utf8") + "\n```\n"
    stderr = source.with_name(filename + ".stderr.txt")
    if stderr.exists() and stderr.stat().st_size:
        block += "\nComplete actual stderr diagnostics, including the deliberately failed candidate fits:\n\n```text\n" + stderr.read_bytes().decode("utf8") + "\n```\n"
    return block


def main():
    sections = sorted((OWNER / "sections").glob("[0-9][0-9]-*.md"))
    if len(sections) != 11:
        raise ValueError("The entire eleven-section manuscript must exist before composition.")
    opening = (OWNER / "opening.md").read_bytes().decode("utf8")
    text = opening + "\n\n" + "\n\n".join(path.read_bytes().decode("utf8") for path in sections)
    text = text.replace('<!-- Retained practice: exact ten rendered tasks. -->', (OWNER / 'retained-practice.md').read_bytes().decode('utf8'))
    text = re.sub(r'<!-- Programme (P\d\d|A01):.*?-->', programme, text)
    if "insert " in text or "TODO" in text or "TBD" in text:
        raise ValueError("Unresolved authoring text remains in the manuscript.")
    destination = OWNER / "lesson.md"
    destination.write_bytes(text.encode("utf8"))
    record = {"schema": "classical21-whole-manuscript-composition/v1", "status": "assembled; author whole reads and DIFFERENT review still required",
              "sources": [bind(path) for path in [OWNER / "opening.md", *sections]],
              "programme_bindings": [bind(path) for path in (OWNER / "programmes").iterdir() if path.is_file()],
              "lesson": bind(destination), "scope": "Literal full source/stream bodies, preserving raw CRLF streams and retained no-terminal-newline literals by one fence-boundary newline"}
    (OWNER / "composition.json").write_bytes((json.dumps(record, indent=2) + "\n").encode("utf8"))
    print(json.dumps(record["lesson"]))


if __name__ == "__main__":
    main()
