"""Persist each completed operation before checking its expected result."""

import hashlib
import json
from pathlib import Path


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class Recorder:
    def __init__(self, directory):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=False)
        self.events = self.directory / "events.jsonl"
        self.count = 0

    def emit(self, name, values, tensors=None):
        row = {"event": self.count, "name": name, **values}
        if tensors is not None:
            import torch

            destination = self.directory / f"{self.count:03d}-{name}.pt"
            torch.save(tensors, destination)
            row["raw_tensors"] = {
                "path": destination.name,
                "sha256": sha256(destination),
                "bytes": destination.stat().st_size,
            }
        with self.events.open("a", encoding="utf8") as stream:
            stream.write(json.dumps(row, allow_nan=False) + "\n")
            stream.flush()
        self.count += 1
        return row

    def result(self, value):
        destination = self.directory / "result.json"
        with destination.open("x", encoding="utf8") as stream:
            json.dump(value, stream, indent=2, allow_nan=False)
            stream.write("\n")


def parameter_digest(model):
    digest = hashlib.sha256()
    for name, tensor in model.state_dict().items():
        digest.update(name.encode("utf8"))
        digest.update(str(tensor.dtype).encode("ascii"))
        digest.update(str(tuple(tensor.shape)).encode("ascii"))
        digest.update(tensor.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()
