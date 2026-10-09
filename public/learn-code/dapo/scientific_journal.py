"""Durable append-only observations and one coherent latest private checkpoint.

The log never replaces an observed event. The latest checkpoint is a rolling
state file for a separately reviewed continuation; it does not replay a stage.
"""
import hashlib
import json
import math
import os
from pathlib import Path
import random
import traceback


def fresh_run_paths(output, workdir):
    """Refuse old scientific destinations before constructing a language model."""
    output, workdir = Path(output), Path(workdir)
    if output.exists() or workdir.exists():
        raise FileExistsError("Preserve the existing output/work directory and choose fresh destinations")
    return output, workdir


def serializable(value):
    if hasattr(value, "detach"):
        return serializable(value.detach().cpu().tolist())
    if isinstance(value, dict):
        return {str(key): serializable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [serializable(item) for item in value]
    if isinstance(value, float) and not math.isfinite(value):
        return {"nonfinite": str(value)}
    return value


def rng_states(generator=None):
    import numpy as np
    import torch
    return {"python": random.getstate(), "numpy": np.random.get_state(),
            "torch": torch.get_rng_state(),
            "local_generator": None if generator is None else generator.get_state()}


class ScientificJournal:
    def __init__(self, workdir):
        self.workdir = Path(workdir)
        self.workdir.mkdir(parents=True, exist_ok=False)
        self.log = self.workdir / "events.jsonl"
        self.sequence = 0
        self.location = "run-opened"
        self.append("run-opened", {"status": "in-progress"})

    def append(self, kind, observation):
        self.location = kind
        self.sequence += 1
        event = {"sequence": self.sequence, "kind": kind, "observation": serializable(observation)}
        line = json.dumps(event, ensure_ascii=False, allow_nan=False) + "\n"
        with self.log.open("a", encoding="utf-8") as stream:
            stream.write(line)
            stream.flush()
            os.fsync(stream.fileno())
        return event

    def checkpoint(self, state, boundary):
        """Atomic latest state; append its identity only after the write completes."""
        import torch
        temporary = self.workdir / "latest-state.tmp"
        destination = self.workdir / "latest-state.pt"
        torch.save({"boundary": boundary, "event_sequence": self.sequence, "state": state}, temporary)
        # Windows requires a writable descriptor for fsync of the saved file.
        with temporary.open("rb+") as stream:
            os.fsync(stream.fileno())
        os.replace(temporary, destination)
        digest = hashlib.sha256(destination.read_bytes()).hexdigest()
        self.append("coherent-checkpoint", {"boundary": boundary, "file": destination.name, "sha256": digest})
        self.location = boundary

    def failure(self, location, exception):
        checkpoint = self.workdir / "latest-state.pt"
        self.append("stage-failed", {"location": location, "exception": type(exception).__name__,
                                     "message": str(exception), "last_event_sequence": self.sequence,
                                     "traceback": traceback.format_exception(exception),
                                     "latest_checkpoint_sha256": None if not checkpoint.exists() else
                                     hashlib.sha256(checkpoint.read_bytes()).hexdigest()})


def training_state(model, optimizer=None, generator=None, reference=None, **context):
    """Read complete state without drawing new samples or changing any parameter."""
    return {"model": model.state_dict(),
            "gradients": {name: None if parameter.grad is None else parameter.grad.detach().clone()
                          for name, parameter in model.named_parameters()},
            "model_training": model.training,
            "optimizer": None if optimizer is None else optimizer.state_dict(),
            "reference": None if reference is None else reference.state_dict(),
            "rng": rng_states(generator), "context": context}
