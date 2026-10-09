"""Complete offline causal-byte study using the manual MoE gradients.

Run: python moe_language_study.py --output moe-results
Requires NumPy and moe_mechanisms.py, alice-train.txt, alice-heldout.txt and
alice-provenance.json beside this file. Main writes results and one saved model.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
import numpy as np

from moe_mechanisms import backward, forward, initial_parameters, logsumexp, sigmoid, softmax, update_bias


PROTOCOL = {
    "seeds": [17, 29, 43], "steps": 400, "batch_size": 64,
    "context": 4, "embedding_width": 8, "experts": 4, "hidden": 16, "k": 2,
    "learning_rate": .003, "adam_beta1": .9, "adam_beta2": .999, "adam_epsilon": 1e-8,
    "auxiliary_coefficient": .05, "bias_speed": .01, "z_coefficient": 0.0,
    "checkpoints": [0, 100, 200, 300, 400],
    "policies": ["none", "auxiliary", "bias", "dense"],
    "selection": "sigmoid affinities, original selected-score normalization, no drops",
    "evaluation": "every byte once within its own paragraph; no held-out checkpoint selection",
}


def examples(path, context=4):
    rows, targets, locations = [], [], []
    for paragraph, text in enumerate(Path(path).read_text(encoding="utf8").splitlines()):
        data = list(text.encode("utf8"))
        padded = [256] * context + data
        for position, target in enumerate(data):
            rows.append(padded[position:position + context])
            targets.append(target)
            locations.append([paragraph, position])
    return np.array(rows, dtype=np.int64), np.array(targets, dtype=np.int64), locations


def initialize(seed, dense=False):
    rng = np.random.default_rng(seed)
    width = PROTOCOL["context"] * PROTOCOL["embedding_width"]
    # Shared maps are drawn first, so all policies begin with identical ones.
    parameters = {
        "embedding": rng.normal(0, .2, (257, PROTOCOL["embedding_width"])),
        "head": rng.normal(0, 1 / np.sqrt(width), (256, width)),
        "head_bias": np.zeros(256),
    }
    expert_parameters = initial_parameters(
        rng, experts=1 if dense else PROTOCOL["experts"], width=width,
        hidden=PROTOCOL["k"] * PROTOCOL["hidden"] if dense else PROTOCOL["hidden"],
    )
    if dense:
        # A single normalized branch is exactly an ordinary dense SwiGLU FFN.
        # The zero router buffer is neither optimized nor counted as a learned map.
        expert_parameters["router"][:] = 0
    parameters.update({"moe_" + key: value for key, value in expert_parameters.items()})
    return parameters


def predict(parameters, contexts, bias, dense=False):
    x = parameters["embedding"][contexts].reshape(len(contexts), -1)
    maps = {key[4:]: value for key, value in parameters.items() if key.startswith("moe_")}
    update, cache = forward(x, maps, 1 if dense else PROTOCOL["k"], "sigmoid", bias)
    hidden = x + update
    logits = hidden @ parameters["head"].T + parameters["head_bias"]
    return logits, hidden, cache, maps


def train_gradient(parameters, contexts, targets, bias, alpha, dense=False):
    logits, hidden, cache, maps = predict(parameters, contexts, bias, dense)
    probabilities = softmax(logits)
    task = np.mean(logsumexp(logits) - logits[np.arange(len(targets)), targets])
    probabilities[np.arange(len(targets)), targets] -= 1
    probabilities /= len(targets)
    gradients = {
        "head": probabilities.T @ hidden,
        "head_bias": probabilities.sum(axis=0),
        "embedding": np.zeros_like(parameters["embedding"]),
    }
    upstream = probabilities @ parameters["head"]
    through_moe, expert_gradients, terms = backward(upstream, maps, cache, alpha=alpha)
    dx = upstream + through_moe
    np.add.at(gradients["embedding"], contexts.reshape(-1), dx.reshape(-1, PROTOCOL["embedding_width"]))
    gradients.update({"moe_" + key: value for key, value in expert_gradients.items()})
    counts = np.bincount(cache["ids"].reshape(-1), minlength=len(bias))
    return float(task), gradients, counts, terms


class Adam:
    def __init__(self, parameters):
        self.first = {key: np.zeros_like(value) for key, value in parameters.items()}
        self.second = {key: np.zeros_like(value) for key, value in parameters.items()}
        self.step = 0

    def update(self, parameters, gradients, dense=False):
        self.step += 1
        b1, b2 = PROTOCOL["adam_beta1"], PROTOCOL["adam_beta2"]
        for key, value in parameters.items():
            if dense and key == "moe_router":
                continue
            gradient = gradients[key]
            self.first[key] = b1 * self.first[key] + (1 - b1) * gradient
            self.second[key] = b2 * self.second[key] + (1 - b2) * gradient * gradient
            mean = self.first[key] / (1 - b1 ** self.step)
            square = self.second[key] / (1 - b2 ** self.step)
            value -= PROTOCOL["learning_rate"] * mean / (np.sqrt(square) + PROTOCOL["adam_epsilon"])


def evaluate(parameters, contexts, targets, bias, dense=False):
    counts, gate_mass = np.zeros(len(bias)), np.zeros(len(bias))
    score_mass = np.zeros(len(bias))
    nll = 0.0
    for start in range(0, len(targets), 256):
        x, y = contexts[start:start + 256], targets[start:start + 256]
        logits, _, cache, _ = predict(parameters, x, bias, dense)
        nll += np.sum(logsumexp(logits) - logits[np.arange(len(y)), y])
        counts += np.bincount(cache["ids"].reshape(-1), minlength=len(bias))
        np.add.at(gate_mass, cache["ids"].reshape(-1), cache["gates"].reshape(-1))
        affinities = sigmoid(cache["logits"])
        score_mass += (affinities / affinities.sum(axis=1, keepdims=True)).sum(axis=0)
    f, p = counts / counts.sum(), score_mass / len(targets)
    return {
        "targets": len(targets), "nll_sum": float(nll), "nll": float(nll / len(targets)),
        "counts": counts.astype(int).tolist(), "gate_mass": gate_mass.tolist(),
        "balance": float(len(bias) * f @ p),
        "max_over_mean": float(len(bias) * f.max()),
        "cv_squared": float(len(bias) * f @ f - 1),
    }


def run_study(directory, output):
    train_x, train_y, _ = examples(directory / "alice-train.txt")
    test_x, test_y, test_locations = examples(directory / "alice-heldout.txt")
    results, saved_model = [], None
    for seed in PROTOCOL["seeds"]:
        schedule = np.random.default_rng(seed + 1000).integers(
            0, len(train_y), (PROTOCOL["steps"], PROTOCOL["batch_size"])
        )
        for policy in PROTOCOL["policies"]:
            dense = policy == "dense"
            parameters = initialize(seed, dense)
            bias = np.zeros(1 if dense else PROTOCOL["experts"])
            optimizer = Adam(parameters)
            alpha = PROTOCOL["auxiliary_coefficient"] if policy == "auxiliary" else 0.0
            history = [{"step": 0, "heldout": evaluate(parameters, test_x, test_y, bias, dense), "bias": bias.tolist()}]
            training_trace = []
            for step, indices in enumerate(schedule, 1):
                task, gradients, counts, terms = train_gradient(
                    parameters, train_x[indices], train_y[indices], bias, alpha, dense
                )
                optimizer.update(parameters, gradients, dense)
                if policy == "bias":
                    bias = update_bias(bias, counts, PROTOCOL["bias_speed"])
                if step == 1 or step % 20 == 0:
                    training_trace.append({
                        "step": step, "pre_update_task_nll": task,
                        "pre_update_balance": terms["balance"], "counts": counts.tolist(),
                        "router_gradient_norm": float(np.linalg.norm(gradients["moe_router"])),
                        "post_update_bias": bias.tolist(),
                    })
                if step in PROTOCOL["checkpoints"]:
                    history.append({"step": step, "heldout": evaluate(parameters, test_x, test_y, bias, dense), "bias": bias.tolist()})
            learned_parameters = sum(value.size for key, value in parameters.items() if not (dense and key == "moe_router"))
            result = {
                "seed": seed, "policy": policy, "learned_parameters": learned_parameters,
                "training_target_presentations": int(schedule.size),
                "schedule_sha256": hashlib.sha256(schedule.astype("<i8").tobytes()).hexdigest(),
                "history": history, "training_trace": training_trace,
                "final_train": evaluate(parameters, train_x, train_y, bias, dense),
            }
            if policy == "auxiliary" and seed == 17:
                ablations = []
                for expert in range(PROTOCOL["experts"]):
                    changed = {key: value.copy() for key, value in parameters.items()}
                    changed["moe_down"][expert] = 0
                    ablations.append({"expert": expert, "heldout": evaluate(changed, test_x, test_y, bias)})
                result["return_zero_ablations"] = ablations
                saved_model = {
                    "policy": policy, "seed": seed, "step": PROTOCOL["steps"],
                    "parameters": {key: value.tolist() for key, value in parameters.items()},
                    "bias": bias.tolist(), "protocol": PROTOCOL,
                    "heldout_contexts": test_x.tolist(), "heldout_targets": test_y.tolist(),
                    "heldout_locations": test_locations,
                    "reference": history[-1]["heldout"],
                }
            results.append(result)
            print(json.dumps({"seed": seed, "policy": policy, "heldout_nll": history[-1]["heldout"]["nll"]}), flush=True)
    files = ["moe_mechanisms.py", "moe_language_study.py", "alice-train.txt", "alice-heldout.txt", "alice-provenance.json"]
    report = {
        "protocol": PROTOCOL, "numpy": np.__version__, "device": "CPU",
        "sources": {name: hashlib.sha256((directory / name).read_bytes()).hexdigest() for name in files},
        "train_targets": len(train_y), "heldout_targets": len(test_y), "runs": results,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "study.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    (output / "model.json").write_text(json.dumps(saved_model, separators=(",", ":")) + "\n", encoding="utf8")
    # Reloaded arrays must reproduce the saved model's held-out likelihood.
    reloaded = json.loads((output / "model.json").read_text(encoding="utf8"))
    parameters = {key: np.array(value) for key, value in reloaded["parameters"].items()}
    measured = evaluate(parameters, test_x, test_y, np.array(reloaded["bias"]))
    np.testing.assert_allclose(measured["nll"], reloaded["reference"]["nll"], atol=1e-12)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("moe-results"))
    arguments = parser.parse_args()
    run_study(Path(__file__).resolve().parent, arguments.output)
