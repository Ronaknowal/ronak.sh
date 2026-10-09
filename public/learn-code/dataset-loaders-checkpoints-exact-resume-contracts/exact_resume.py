"""Restart a small stochastic CPU training run at a completed-update boundary.

Install torch. Run python exact_resume.py. No dataset/model downloads. All data
are constructed to test state continuation, not predictive generalization.
"""
import copy
import hashlib
import json
import os
import tempfile
from pathlib import Path

import torch


class ResumableBatcher:
    """A finite shuffled epoch with explicit next-unconsumed cursor and RNG."""
    def __init__(self, size, batch_size=2, seed=17):
        if not isinstance(size, int) or not isinstance(batch_size, int) or size < 1 or batch_size < 1:
            raise ValueError("positive integer size and batch size required")
        self.size, self.batch_size = size, batch_size
        self.generator = torch.Generator().manual_seed(seed)
        self.order = torch.randperm(size, generator=self.generator)
        self.cursor, self.epoch = 0, 0

    def next_ids(self):
        if self.cursor == self.size:
            self.order = torch.randperm(self.size, generator=self.generator)
            self.cursor = 0
            self.epoch += 1
        stop = min(self.cursor + self.batch_size, self.size)
        result = self.order[self.cursor:stop].clone()
        self.cursor = stop
        return result

    def state_dict(self):
        return {"size": self.size, "batch_size": self.batch_size, "order": self.order.clone(),
                "cursor": self.cursor, "epoch": self.epoch, "generator": self.generator.get_state()}

    def load_state_dict(self, state):
        if (state["size"], state["batch_size"]) != (self.size, self.batch_size):
            raise ValueError("loader size/batch contract changed")
        if not 0 <= state["cursor"] <= self.size or not torch.equal(state["order"].sort().values, torch.arange(self.size)):
            raise ValueError("invalid loader cursor or permutation")
        self.order = state["order"].clone()
        self.cursor, self.epoch = state["cursor"], state["epoch"]
        self.generator.set_state(state["generator"])


X = torch.arange(16, dtype=torch.float64).reshape(8, 2) / 16
Y = (2 * X[:, :1] - X[:, 1:] + .25)
DATA_HASH = hashlib.sha256(X.numpy().tobytes() + Y.numpy().tobytes()).hexdigest()
CONFIG = {"width": 8, "dropout": .25, "batch_size": 2, "dtype": "float64", "device": "cpu"}


def initialize():
    torch.manual_seed(101)
    model = torch.nn.Sequential(torch.nn.Linear(2, 8), torch.nn.Tanh(), torch.nn.Dropout(.25), torch.nn.Linear(8, 1)).double()
    optimizer = torch.optim.SGD(model.parameters(), lr=.05, momentum=.8)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=.5)
    return model, optimizer, scheduler, ResumableBatcher(len(X))


def updates(parts, count):
    model, optimizer, scheduler, loader = parts
    model.train()
    trace = []
    for _ in range(count):
        ids = loader.next_ids()
        optimizer.zero_grad(set_to_none=True)
        learning_rate = optimizer.param_groups[0]["lr"]
        loss = torch.nn.functional.mse_loss(model(X[ids]), Y[ids])
        loss.backward()
        optimizer.step()
        scheduler.step()
        optimizer.zero_grad(set_to_none=True)
        # This is the boundary where our checkpoint is valid.
        trace.append({"ids": ids.tolist(), "loss": loss.item(), "learning_rate": learning_rate,
                      "parameters": torch.cat([p.detach().flatten() for p in model.parameters()]).tolist()})
    return trace


def snapshot(parts, completed_updates):
    model, optimizer, scheduler, loader = parts
    if any(p.grad is not None for p in model.parameters()):
        raise ValueError("checkpoint only after the completed update and gradient clear")
    return copy.deepcopy({
        "schema": 1, "data_hash": DATA_HASH, "config": CONFIG,
        "completed_updates": completed_updates,
        "model": model.state_dict(), "optimizer": optimizer.state_dict(),
        "scheduler": scheduler.state_dict(), "loader": loader.state_dict(),
        "torch_rng": torch.get_rng_state(),
    })


def restore(state, omit=None):
    if state["schema"] != 1 or state["data_hash"] != DATA_HASH or state["config"] != CONFIG:
        raise ValueError("checkpoint schema, data or configuration mismatch")
    state = copy.deepcopy(state)  # independent branches must not share optimizer tensors
    parts = initialize()  # constructors can consume RNG: restore randomness LAST.
    model, optimizer, scheduler, loader = parts
    model.load_state_dict(state["model"])
    if omit != "optimizer":
        optimizer.load_state_dict(state["optimizer"])
    if omit != "scheduler":
        scheduler.load_state_dict(state["scheduler"])
    if omit != "loader":
        loader.load_state_dict(state["loader"])
    if omit != "rng":
        torch.set_rng_state(state["torch_rng"])
    return parts


def atomic_save(state, destination):
    # Same-directory replacement prevents exposing a partially written new file.
    # It is not a promise of crash durability on every filesystem/storage service.
    temporary = destination.with_suffix(".tmp")
    torch.save(state, temporary)
    os.replace(temporary, destination)


def scalar_trace(interrupt=3, omit="none", momentum=.8):
    """Browser's constructed scalar experiment, with an explicit small RNG.

    g=(w*x-y)*x for half-squared error; v=mu*v+g; w-=lr*v.
    y=2*x_original; tiny input noise comes from an LCG, not PyTorch dropout.
    """
    initial = {"w": .5, "v": 0., "cursor": 0, "rng": 7, "clock": 0}
    order = [2, 0, 3, 1]

    def step(state):
        row = order[state["cursor"] % 4]
        state["cursor"] += 1
        state["rng"] = (1664525 * state["rng"] + 1013904223) & 0xffffffff
        noise = (state["rng"] / 2**32 - .5) * .2
        x, target = row + 1 + noise, 2 * (row + 1)
        residual = state["w"] * x - target
        loss, gradient = .5 * residual**2, residual * x
        lr = .02 * .5 ** (state["clock"] // 3)
        state["v"] = momentum * state["v"] + gradient
        state["w"] -= lr * state["v"]
        state["clock"] += 1
        return {"row": row, "loss": loss, "w": state["w"], "v": state["v"], "lr": lr, "noise": noise}

    state = initial.copy()
    for _ in range(interrupt):
        step(state)
    checkpoint = state.copy()
    baseline = [step(state) for _ in range(6)]
    restored = checkpoint.copy()
    if omit != "none":
        field = {"momentum": "v", "cursor": "cursor", "rng": "rng", "schedule": "clock"}[omit]
        restored[field] = initial[field]
    resumed = [step(restored) for _ in range(6)]
    return {"checkpoint": checkpoint, "baseline": baseline, "resumed": resumed}


def run():
    torch.set_num_threads(1)
    torch.use_deterministic_algorithms(True)
    uninterrupted = initialize()
    full_trace = updates(uninterrupted, 12)
    interrupted = initialize()
    assert updates(interrupted, 5) == full_trace[:5]
    state = snapshot(interrupted, 5)
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "checkpoint.pt"
        atomic_save(state, path)
        loaded = torch.load(path, map_location="cpu", weights_only=True)
    resumed_trace = updates(restore(loaded), 7)
    assert resumed_trace == full_trace[5:]
    omissions = {}
    for omitted in ("optimizer", "scheduler", "loader", "rng"):
        trace = updates(restore(loaded, omit=omitted), 7)
        divergence = next((i for i, (left, right) in enumerate(zip(trace, full_trace[5:]), start=6) if left != right), None)
        assert divergence is not None
        omissions[omitted] = {"first_different_update": divergence, "final_max_parameter_error": max(abs(a - b) for a, b in zip(trace[-1]["parameters"], full_trace[-1]["parameters"]))}
    changed = copy.deepcopy(loaded)
    changed["data_hash"] = "another dataset"
    try:
        restore(changed)
    except ValueError:
        pass
    else:
        raise AssertionError("changed dataset accepted")
    complete_scalar = scalar_trace()
    assert complete_scalar["baseline"] == complete_scalar["resumed"]
    return {"torch": torch.__version__, "device": "cpu", "dtype": "float64", "interrupt_after_update": 5,
            "compared_next_updates": 7, "complete_resume_max_parameter_error": 0.0,
            "next_ids": resumed_trace[0]["ids"], "next_loss": resumed_trace[0]["loss"],
            "omissions": omissions, "scalar_fixture": complete_scalar}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
