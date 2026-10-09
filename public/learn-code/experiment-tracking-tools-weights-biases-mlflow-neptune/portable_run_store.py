"""A local single-writer run store. Run demo: python portable_run_store.py OUTPUT_DIR"""
import argparse
import hashlib
import json
import math
import shutil
import sqlite3
import tempfile
import uuid
from pathlib import Path


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(path):
    with Path(path).open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


class RunStore:
    def __init__(self, root):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.objects = self.root / "objects"
        self.objects.mkdir(exist_ok=True)
        self.db = sqlite3.connect(self.root / "runs.sqlite")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS runs(
                id TEXT PRIMARY KEY, config TEXT NOT NULL, status TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS metrics(
                run_id TEXT REFERENCES runs(id), name TEXT, step INTEGER, value REAL,
                PRIMARY KEY(run_id, name, step));
            CREATE TABLE IF NOT EXISTS artifacts(
                run_id TEXT REFERENCES runs(id), name TEXT, sha256 TEXT,
                PRIMARY KEY(run_id, name));
        """)

    def begin(self, config, run_id=None):
        run_id = run_id or uuid.uuid4().hex
        encoded = canonical(config)
        with self.db:
            existing = self.db.execute("SELECT config,status FROM runs WHERE id=?", (run_id,)).fetchone()
            if existing and existing != (encoded, "RUNNING"):
                raise ValueError("Run config differs or run is already terminal")
            self.db.execute("INSERT OR IGNORE INTO runs VALUES(?,?,?)", (run_id, encoded, "RUNNING"))
        return run_id

    def require_running(self, run_id):
        row = self.db.execute("SELECT status FROM runs WHERE id=?", (run_id,)).fetchone()
        if row != ("RUNNING",):
            raise ValueError("Expected an existing running run")

    def metric(self, run_id, name, step, value):
        if not name or not isinstance(step, int) or step < 0 or not math.isfinite(value):
            raise ValueError("A metric needs a name, nonnegative integer step and finite value")
        with self.db:
            self.require_running(run_id)
            previous = self.db.execute("SELECT value FROM metrics WHERE run_id=? AND name=? AND step=?",
                                       (run_id, name, step)).fetchone()
            if previous is not None and previous[0] != value:
                raise ValueError("Conflicting retry for the same metric coordinate")
            self.db.execute("INSERT OR IGNORE INTO metrics VALUES(?,?,?,?)", (run_id, name, step, value))

    def artifact(self, run_id, name, source):
        self.require_running(run_id)
        # Copy first, then hash the exact captured bytes; source may be overwritten later.
        with tempfile.NamedTemporaryFile(dir=self.objects, delete=False) as handle:
            temporary = Path(handle.name)
        try:
            shutil.copyfile(source, temporary)
            identity = digest(temporary)
            destination = self.objects / identity
            if destination.exists():
                if digest(destination) != identity:
                    raise ValueError("Existing content-addressed object is corrupt")
                temporary.unlink()
            else:
                temporary.replace(destination)
            with self.db:
                previous = self.db.execute("SELECT sha256 FROM artifacts WHERE run_id=? AND name=?",
                                           (run_id, name)).fetchone()
                if previous and previous[0] != identity:
                    raise ValueError("Artifact name already identifies different bytes")
                self.db.execute("INSERT OR IGNORE INTO artifacts VALUES(?,?,?)", (run_id, name, identity))
            return identity
        finally:
            temporary.unlink(missing_ok=True)

    def finish(self, run_id, status="FINISHED"):
        if status not in {"FINISHED", "FAILED"}:
            raise ValueError("Unknown terminal status")
        with self.db:
            self.require_running(run_id)
            self.db.execute("UPDATE runs SET status=? WHERE id=?", (status, run_id))

    def history(self, run_id, name):
        return self.db.execute("SELECT step,value FROM metrics WHERE run_id=? AND name=? ORDER BY step",
                               (run_id, name)).fetchall()

    def export(self, run_id, destination):
        config, status = self.db.execute("SELECT config,status FROM runs WHERE id=?", (run_id,)).fetchone()
        metrics = self.db.execute("SELECT name,step,value FROM metrics WHERE run_id=? ORDER BY name,step",
                                  (run_id,)).fetchall()
        artifacts = dict(self.db.execute("SELECT name,sha256 FROM artifacts WHERE run_id=?", (run_id,)))
        for identity in artifacts.values():
            if digest(self.objects / identity) != identity:
                raise ValueError("Artifact digest mismatch")
        payload = {"schema": 1, "run_id": run_id, "config": json.loads(config), "status": status,
                   "metrics": [{"name": name, "step": step, "value": value} for name, step, value in metrics],
                   "artifacts": artifacts}
        Path(destination).write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return payload

    def close(self):
        self.db.close()


def demo(root):
    root = Path(root)
    store = RunStore(root)
    run_id = store.begin({"objective": "half_mse", "step_unit": "optimizer_update", "rate": .1})
    store.metric(run_id, "train/loss", 0, 5.5)
    store.metric(run_id, "train/loss", 1, 3.2175)
    store.metric(run_id, "train/loss", 1, 3.2175)  # Exact retry: no duplicate row.
    checkpoint = root / f"{run_id}-checkpoint.json"
    checkpoint.write_text(canonical({"w": .5, "b": .1, "step": 1}), encoding="utf-8")
    identity = store.artifact(run_id, "checkpoint/step-1", checkpoint)
    store.finish(run_id)
    payload = store.export(run_id, root / f"{run_id}-manifest.json")
    store.close()
    print(json.dumps({"run_id": run_id, "history": payload["metrics"], "checkpoint_sha256": identity}, indent=2))
    return payload


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    demo(parser.parse_args().output)
