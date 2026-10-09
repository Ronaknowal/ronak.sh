"""Ordinary Torch layer, matched manual gradients, and objective-scope checks.

Run: python moe_torch.py
Requires torch and NumPy, with moe_mechanisms.py in the same directory.
"""
import json

import numpy as np
import torch
import torch.nn.functional as F
from torch import nn

from moe_mechanisms import backward, forward, initial_parameters


class TorchMoE(nn.Module):
    def __init__(self, parameters, k=2, kind="softmax"):
        super().__init__()
        self.maps = nn.ParameterDict({
            key: nn.Parameter(torch.tensor(value, dtype=torch.float64))
            for key, value in parameters.items()
        })
        self.k, self.kind = k, kind

    def forward(self, x, capacity=None, valid=None, bias=None, batched=False):
        logits = F.linear(x, self.maps["router"])
        scores = logits.sigmoid() if self.kind == "sigmoid" else logits.softmax(-1)
        selected = (scores if bias is None else scores + bias).topk(self.k, dim=-1).indices
        weights = scores.gather(1, selected)
        if self.kind != "full":
            weights = weights / weights.sum(-1, keepdim=True)
        valid = torch.ones(len(x), dtype=torch.bool, device=x.device) if valid is None else valid
        token = torch.arange(len(x), device=x.device).repeat_interleave(self.k)
        slot = torch.arange(self.k, device=x.device).repeat(len(x))
        expert = selected.flatten()
        order = expert.argsort(stable=True)
        order = order[valid[token[order]]]
        expert_ids, sizes = torch.unique_consecutive(expert[order], return_counts=True)
        groups, offset = [], 0
        for expert_id, size in zip(expert_ids.tolist(), sizes.tolist()):
            positions = order[offset:offset + size]
            positions = positions if capacity is None else positions[:capacity]
            groups.append((expert_id, positions))
            offset += size
        y = torch.zeros_like(x)
        if batched:
            positions = torch.cat([positions for _, positions in groups]) if groups else order
            t, s, e = token[positions], slot[positions], expert[positions]
            rows = x[t, :, None]
            a = torch.bmm(self.maps["gate"][e], rows).squeeze(-1)
            b = torch.bmm(self.maps["up"][e], rows).squeeze(-1)
            returned = torch.bmm(self.maps["down"][e], (F.silu(a) * b)[..., None]).squeeze(-1)
            y.index_add_(0, t, weights[t, s, None] * returned)
        else:
            for e, positions in groups:
                t, s = token[positions], slot[positions]
                a = F.linear(x[t], self.maps["gate"][e])
                b = F.linear(x[t], self.maps["up"][e])
                returned = F.linear(F.silu(a) * b, self.maps["down"][e])
                y.index_add_(0, t, weights[t, s, None] * returned)
        return y, logits, selected


def auxiliary(logits, selected, kind="softmax", valid=None, fixed_counts=None):
    valid = torch.ones(len(logits), dtype=torch.bool, device=logits.device) if valid is None else valid
    scores = logits.sigmoid() if kind == "sigmoid" else logits.softmax(-1)
    p = scores / scores.sum(-1, keepdim=True)
    if not valid.any():
        return logits.sum() * 0, logits.sum() * 0
    count = torch.bincount(selected[valid].flatten(), minlength=logits.shape[1]).to(logits)
    f = count / count.sum() if fixed_counts is None else fixed_counts / fixed_counts.sum()
    balance = logits.shape[1] * (f.detach() * p[valid].mean(0)).sum()
    z = logits[valid].logsumexp(-1).square().mean()
    return balance, z


def compare_layer(kind, k, capacity, batched):
    rng = np.random.default_rng(29)
    parameters = initial_parameters(rng, experts=4, width=5, hidden=3)
    x = rng.normal(size=(6, 5))
    upstream = rng.normal(size=x.shape)
    valid = np.array([True, True, True, True, True, False])
    alpha, beta = .05, .003
    y, cache = forward(x, parameters, k, kind, capacity=capacity, valid=valid)
    dx, gradients, terms = backward(upstream, parameters, cache, alpha, beta)
    model = TorchMoE(parameters, k, kind)
    tx = torch.tensor(x, dtype=torch.float64, requires_grad=True)
    ty, logits, ids = model(tx, capacity, torch.tensor(valid), batched=batched)
    aux, z = auxiliary(logits, ids, kind, torch.tensor(valid))
    loss = (ty * torch.tensor(upstream)).sum() + alpha * aux + beta * z
    loss.backward()
    errors = {"output": float(np.max(np.abs(y - ty.detach().numpy())))}
    errors["input_gradient"] = float(np.max(np.abs(dx - tx.grad.numpy())))
    for name, expected in gradients.items():
        actual = model.maps[name].grad
        actual = np.zeros_like(expected) if actual is None else actual.numpy()
        errors[name + "_gradient"] = float(np.max(np.abs(actual - expected)))
        np.testing.assert_allclose(actual, expected, rtol=1e-8, atol=2e-11)
    np.testing.assert_allclose(y, ty.detach().numpy(), rtol=1e-8, atol=2e-11)
    np.testing.assert_allclose(dx, tx.grad.numpy(), rtol=1e-8, atol=2e-11)
    rate = .01
    with torch.no_grad():
        for name, parameter in model.maps.items():
            if parameter.grad is not None:
                parameter -= rate * parameter.grad
            np.testing.assert_allclose(parameter.numpy(), parameters[name] - rate * gradients[name], atol=2e-11)
    return {"kind": kind, "k": k, "capacity": capacity, "batched": batched, "max_error": max(errors.values())}


def scope_comparison():
    """Unequal groups and explicit replica averaging, all in one CPU process."""
    values = np.log(np.array([[.9, .1], [.8, .2], [.1, .9]]))
    groups = [slice(0, 2), slice(2, 3)]

    def objective(mode):
        z = torch.tensor(values, dtype=torch.float64, requires_grad=True)
        p = z.softmax(-1)
        ids = p.topk(1, dim=-1).indices
        total_count = torch.bincount(ids.flatten(), minlength=2).to(z)
        losses, running = [], torch.zeros(2, dtype=z.dtype)
        for group in groups:
            rows = z[group]
            running += torch.bincount(ids[group].flatten(), minlength=2)
            fixed = total_count if mode == "global" else running if mode == "prefix" else None
            value, _ = auxiliary(rows, ids[group], fixed_counts=fixed)
            losses.append(len(rows) / len(z) * value)
        loss = sum(losses)
        loss.backward()
        return float(loss.detach()), z.grad.numpy()

    global_loss, global_gradient = objective("global")
    local_loss, local_gradient = objective("local")
    prefix_loss, prefix_gradient = objective("prefix")
    z = torch.tensor(values, dtype=torch.float64, requires_grad=True)
    ids = z.topk(1, dim=-1).indices
    full, _ = auxiliary(z, ids)
    full.backward()
    np.testing.assert_allclose(z.grad.numpy(), global_gradient, atol=1e-13)
    assert abs(float(full.detach()) - global_loss) < 1e-13

    # Replicated scalar router parameter: DDP averages the two local gradients.
    # Scale each local loss by W*T_local/T_global before that average.
    w = torch.tensor(1.0, dtype=torch.float64, requires_grad=True)
    all_logits = w * torch.tensor(values)
    counts = torch.bincount(all_logits.detach().topk(1, dim=-1).indices.flatten(), minlength=2).double()
    reference, _ = auxiliary(all_logits, all_logits.detach().topk(1, dim=-1).indices)
    reference.backward()
    reference_gradient = w.grad.item()
    replica_gradients = []
    for group in groups:
        local_w = torch.tensor(1.0, dtype=torch.float64, requires_grad=True)
        local = local_w * torch.tensor(values[group])
        loss, _ = auxiliary(local, local.detach().topk(1, dim=-1).indices, fixed_counts=counts)
        (len(groups) * len(local) / len(values) * loss).backward()
        replica_gradients.append(local_w.grad.item())
    assert abs(np.mean(replica_gradients) - reference_gradient) < 1e-13
    return {
        "local_loss": local_loss, "exact_global_loss": global_loss,
        "prefix_approximation_loss": prefix_loss,
        "local_global_max_gradient_difference": float(np.max(np.abs(local_gradient - global_gradient))),
        "prefix_global_max_gradient_difference": float(np.max(np.abs(prefix_gradient - global_gradient))),
        "full_shared_parameter_gradient": reference_gradient,
        "averaged_scaled_replica_gradient": float(np.mean(replica_gradients)),
    }


def main():
    torch.set_num_threads(1)
    results = [compare_layer(kind, k, capacity, batched)
               for kind in ["softmax", "full", "sigmoid"]
               for k in [1, 2, 4]
               for capacity in [None, 1, 0]
               for batched in [False, True]]
    print(json.dumps({"torch": torch.__version__, "cases": results, "scope": scope_comparison()}, indent=2))


if __name__ == "__main__":
    main()
