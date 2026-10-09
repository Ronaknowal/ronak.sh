"""A matched NumPy/PyTorch classifier. Run with an offline Wine CSV.

python pytorch_workflow.py --data wine.csv --checkpoint wine-model.pt
Requires numpy and torch. CPU float64 makes the comparison easy to inspect.
"""
import argparse
import copy
import json
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset


def stratified_split(labels, seed=17):
    """Partition each class once; reserve validation/test before fitting anything."""
    rng = np.random.default_rng(seed)
    train, validation, test = [], [], []
    for label in np.unique(labels):
        rows = rng.permutation(np.flatnonzero(labels == label))
        a, b = int(0.6 * len(rows)), int(0.8 * len(rows))
        train.extend(rows[:a])
        validation.extend(rows[a:b])
        test.extend(rows[b:])
    return tuple(np.asarray(rows) for rows in (train, validation, test))


def initialize(features, hidden, classes, seed=23):
    rng = np.random.default_rng(seed)
    return {
        "w1": rng.normal(0, np.sqrt(2 / features), (features, hidden)),
        "b1": np.zeros(hidden),
        "w2": rng.normal(0, np.sqrt(1 / hidden), (hidden, classes)),
        "b2": np.zeros(classes),
    }


def manual_loss_and_gradients(x, y, parameters):
    """Mean softmax cross-entropy and vectorized reverse pass, no autodiff."""
    preactivation = x @ parameters["w1"] + parameters["b1"]
    hidden = np.maximum(preactivation, 0)
    logits = hidden @ parameters["w2"] + parameters["b2"]
    shifted = logits - logits.max(axis=1, keepdims=True)
    normalizer = np.exp(shifted).sum(axis=1, keepdims=True)
    log_probabilities = shifted - np.log(normalizer)
    loss = -log_probabilities[np.arange(len(y)), y].mean()
    delta = np.exp(log_probabilities)
    delta[np.arange(len(y)), y] -= 1
    delta /= len(y)
    hidden_delta = (delta @ parameters["w2"].T) * (preactivation > 0)
    gradients = {
        "w1": x.T @ hidden_delta,
        "b1": hidden_delta.sum(axis=0),
        "w2": hidden.T @ delta,
        "b2": delta.sum(axis=0),
    }
    return float(loss), gradients, logits


class WineClassifier(nn.Module):
    def __init__(self, features=13, hidden=12, classes=3):
        super().__init__()
        self.register_buffer("center", torch.zeros(features, dtype=torch.float64))
        self.register_buffer("scale", torch.ones(features, dtype=torch.float64))
        self.hidden = nn.Linear(features, hidden, dtype=torch.float64)
        self.output = nn.Linear(hidden, classes, dtype=torch.float64)

    def forward(self, raw_features):
        standardized = (raw_features - self.center) / self.scale
        return self.output(torch.relu(self.hidden(standardized)))


def install_state(model, parameters, center, scale):
    # nn.Linear stores [out, in], whereas the NumPy path multiplies [in, out].
    with torch.no_grad():
        model.center.copy_(torch.from_numpy(center))
        model.scale.copy_(torch.from_numpy(scale))
        model.hidden.weight.copy_(torch.from_numpy(parameters["w1"].T))
        model.hidden.bias.copy_(torch.from_numpy(parameters["b1"]))
        model.output.weight.copy_(torch.from_numpy(parameters["w2"].T))
        model.output.bias.copy_(torch.from_numpy(parameters["b2"]))


def matching_gradients(model):
    return {
        "w1": model.hidden.weight.grad.detach().numpy().T,
        "b1": model.hidden.bias.grad.detach().numpy(),
        "w2": model.output.weight.grad.detach().numpy().T,
        "b2": model.output.bias.grad.detach().numpy(),
    }


def manual_sgd_step(parameters, gradients, learning_rate):
    """In-place plain SGD; no momentum, decay, clipping or hidden state."""
    for name in parameters:
        parameters[name] -= learning_rate * gradients[name]


@torch.no_grad()
def evaluate(model, x, y):
    model.eval()
    logits = model(x)
    return {
        "cross_entropy": nn.functional.cross_entropy(logits, y).item(),
        "accuracy": (logits.argmax(dim=1) == y).double().mean().item(),
    }


def run(data, checkpoint, epochs=120, batch_size=24, learning_rate=0.04):
    torch.set_num_threads(1)
    torch.manual_seed(23)
    table = np.loadtxt(data, delimiter=",", skiprows=1)
    raw, labels = table[:, 2:], table[:, 1].astype(np.int64)
    train, validation, test = stratified_split(labels)
    center = raw[train].mean(axis=0)
    scale = raw[train].std(axis=0)
    scale = np.where(scale == 0, 1, scale)
    standardized = (raw - center) / scale
    x, y = torch.from_numpy(raw), torch.from_numpy(labels)
    parameters = initialize(raw.shape[1], 12, 3)
    model = WineClassifier(raw.shape[1])
    install_state(model, parameters, center, scale)

    # Match the same batch before either path updates its weights.
    rows = train[:batch_size]
    manual_loss, manual_grad, _ = manual_loss_and_gradients(
        standardized[rows], labels[rows], parameters)
    torch_loss = nn.functional.cross_entropy(model(x[rows]), y[rows])
    torch_loss.backward()
    gradient_error = max(np.max(np.abs(manual_grad[k] - value))
                         for k, value in matching_gradients(model).items())
    loss_error = abs(manual_loss - torch_loss.item())
    # Compare the operation an optimizer performs, then restore the starting point.
    updated = {name: value.copy() for name, value in parameters.items()}
    manual_sgd_step(updated, manual_grad, learning_rate)
    torch.optim.SGD(model.parameters(), lr=learning_rate).step()
    actual = {"w1": model.hidden.weight.detach().numpy().T,
              "b1": model.hidden.bias.detach().numpy(),
              "w2": model.output.weight.detach().numpy().T,
              "b2": model.output.bias.detach().numpy()}
    update_error = max(np.max(np.abs(updated[k] - value))
                       for k, value in actual.items())
    install_state(model, parameters, center, scale)
    model.zero_grad(set_to_none=True)

    dataset = TensorDataset(x[train], y[train])
    generator = torch.Generator().manual_seed(31)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True,
                        generator=generator, num_workers=0)
    optimizer = torch.optim.SGD(model.parameters(), lr=learning_rate)
    best_loss, best_epoch, best_state = float("inf"), None, None
    history = []
    for epoch in range(epochs):
        model.train()
        total_loss, total_rows = 0.0, 0
        for batch_x, batch_y in loader:
            optimizer.zero_grad(set_to_none=True)
            loss = nn.functional.cross_entropy(model(batch_x), batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(batch_y)
            total_rows += len(batch_y)
        validation_metrics = evaluate(model, x[validation], y[validation])
        history.append({"epoch": epoch + 1, "train_loss": total_loss / total_rows,
                        "validation_loss": validation_metrics["cross_entropy"]})
        if validation_metrics["cross_entropy"] < best_loss:
            best_loss = validation_metrics["cross_entropy"]
            best_epoch = epoch + 1
            best_state = copy.deepcopy(model.state_dict())

    model.load_state_dict(best_state)
    test_metrics = evaluate(model, x[test], y[test])
    checkpoint = Path(checkpoint)
    checkpoint.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"model": best_state, "features": raw.shape[1], "hidden": 12,
                "classes": 3, "selected_epoch": best_epoch}, checkpoint)
    saved = torch.load(checkpoint, map_location="cpu", weights_only=True)
    restored = WineClassifier(saved["features"], saved["hidden"], saved["classes"])
    restored.load_state_dict(saved["model"])
    restored.eval()
    with torch.no_grad():
        reload_error = (model(x[test]) - restored(x[test])).abs().max().item()
    return {
        "versions": {"numpy": np.__version__, "torch": torch.__version__},
        "split_rows": {"train": len(train), "validation": len(validation), "test": len(test)},
        "first_batch_loss_error": loss_error,
        "first_batch_max_gradient_error": float(gradient_error),
        "first_batch_max_update_error": float(update_error),
        "selected_epoch": best_epoch,
        "test": test_metrics,
        "reload_max_logit_error": reload_error,
        "history": history,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, default=Path("wine-model.pt"))
    args = parser.parse_args()
    result = run(args.data, args.checkpoint)
    print(json.dumps({k: v for k, v in result.items() if k != "history"}, indent=2))
