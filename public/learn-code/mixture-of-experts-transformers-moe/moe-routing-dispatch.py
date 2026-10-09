"""Portable MoE selection, allocation and grouped return; prints, never writes.

Run with Python and CPU PyTorch. Learned expert maps use output-by-input rows.
The grouped route owns the algorithm; bmm is an ordinary tool bridge, and the
dense route is a bounded correctness oracle. No checkpoint download or fitting.
"""
import math
import torch
import torch.nn.functional as F


def finite(name, value, dimensions=None):
    if not isinstance(value, torch.Tensor) or not value.is_floating_point():
        raise ValueError(f"{name} must be a real floating tensor")
    if dimensions is not None and value.ndim != dimensions:
        raise ValueError(f"{name} must have {dimensions} dimensions")
    if not torch.isfinite(value).all():
        raise ValueError(f"{name} must be finite")


def select_gates(logits, k, selected_normalization=True):
    """Lower expert ID wins an exact tie; this is a declared teaching policy."""
    finite("logits", logits, 2)
    if isinstance(k, bool) or not isinstance(k, int) or not 1 <= k <= logits.shape[1]:
        raise ValueError("k must be an integer from 1 to the expert count")
    ids = logits.argsort(dim=-1, descending=True, stable=True)[:, :k]
    full = logits.softmax(-1)
    weights = logits.gather(1, ids).softmax(-1) if selected_normalization else full.gather(1, ids)
    return ids, weights, full


def allocate(ids, expert_count, capacity=None, order=None):
    """Allocate in token priority and slot order, before sorting by expert.

    Acceptance counts assignments, including a zero-weight assignment. None
    means dropless. A dropped assignment cannot reach an expert computation.
    """
    if isinstance(expert_count, bool) or not isinstance(expert_count, int) or expert_count <= 0:
        raise ValueError("expert_count must be a strictly positive integer")
    if not isinstance(ids, torch.Tensor) or ids.ndim != 2 or ids.dtype != torch.long or ids.shape[1] == 0:
        raise ValueError("ids must be a token-by-slot integer tensor")
    if (ids < 0).any() or (ids >= expert_count).any():
        raise ValueError("every expert ID must exist")
    if any(len(set(row)) != len(row) for row in ids.tolist()):
        raise ValueError("a token must have distinct selected experts")
    if capacity is not None and (isinstance(capacity, bool) or not isinstance(capacity, int) or capacity < 0):
        raise ValueError("capacity must be a nonnegative integer or None")
    tokens, slots = ids.shape
    order = list(range(tokens)) if order is None else list(order)
    if any(isinstance(v, bool) or not isinstance(v, int) for v in order) or sorted(order) != list(range(tokens)):
        raise ValueError("order must be a permutation of all tokens")
    kept = torch.zeros_like(ids, dtype=torch.bool)
    used = [0] * expert_count
    for token in order:
        for slot in range(slots):
            expert = int(ids[token, slot])
            if capacity is None or used[expert] < capacity:
                kept[token, slot] = True
                used[expert] += 1
    return kept, used


def validate_experts(x, gate_map, up_map, down_map, ids, weights, kept):
    finite("x", x, 2)
    finite("gate map", gate_map, 3)
    finite("up map", up_map, 3)
    finite("down map", down_map, 3)
    finite("weights", weights, 2)
    experts, hidden, width = gate_map.shape
    if min(experts, hidden, width) <= 0:
        raise ValueError("expert count and both widths must be positive")
    if not isinstance(ids, torch.Tensor) or not isinstance(kept, torch.Tensor) or ids.ndim != 2 or ids.shape[1] == 0:
        raise ValueError("selected IDs and acceptance must be nonempty-slot tensor matrices")
    if up_map.shape != gate_map.shape or down_map.shape != (experts, width, hidden):
        raise ValueError("expert maps must be [E,m,d], [E,m,d], [E,d,m]")
    if x.shape[1] != width or ids.shape != weights.shape or kept.shape != ids.shape:
        raise ValueError("input, selected IDs, weights and acceptance shapes disagree")
    if x.shape[0] != ids.shape[0] or ids.dtype != torch.long or kept.dtype != torch.bool:
        raise ValueError("selection metadata must match every input row")
    if (ids < 0).any() or (ids >= experts).any() or (weights < 0).any():
        raise ValueError("selected IDs must exist and weights must be nonnegative")
    if any(len(set(row)) != len(row) for row in ids.tolist()):
        raise ValueError("each token must select distinct expert IDs")
    if any(v.dtype != x.dtype or v.device != x.device for v in (gate_map, up_map, down_map, weights)):
        raise ValueError("all numerical operands must share input dtype and device")
    if ids.device != x.device or kept.device != x.device:
        raise ValueError("selection metadata must share the input device")


def effective_weights(weights, kept, renormalize_survivors=False):
    effective = weights * kept
    if renormalize_survivors:
        mass = effective.sum(-1, keepdim=True)
        # Zero support means a zero expert update, not a probability distribution.
        divisor = torch.where(mass > 0, mass, torch.ones_like(mass))
        effective = effective / divisor
    return effective


def grouped_experts(x, gate_map, up_map, down_map, ids, weights, kept,
                    renormalize_survivors=False):
    """Sort accepted assignments once, then process contiguous active groups."""
    validate_experts(x, gate_map, up_map, down_map, ids, weights, kept)
    effective = effective_weights(weights, kept, renormalize_survivors)
    flat = kept.reshape(-1).nonzero().flatten()
    if not len(flat):
        return x * 0
    expert_ids = ids.reshape(-1)[flat]
    permutation = expert_ids.argsort(stable=True)
    flat, expert_ids = flat[permutation], expert_ids[permutation]
    token_ids = flat // ids.shape[1]
    group_ids, sizes = torch.unique_consecutive(expert_ids, return_counts=True)
    output = torch.zeros_like(x)
    offset = 0
    for expert, size in zip(group_ids.tolist(), sizes.tolist()):
        destination = token_ids[offset:offset + size]
        rows = x.index_select(0, destination)
        gate = F.silu(F.linear(rows, gate_map[expert]))
        up = F.linear(rows, up_map[expert])
        answer = F.linear(gate * up, down_map[expert])
        answer = answer * effective.reshape(-1)[flat[offset:offset + size], None]
        output.index_add_(0, destination, answer)
        offset += size
    finite("grouped return", output)
    return output


def batched_tool_experts(x, gate_map, up_map, down_map, ids, weights, kept,
                         renormalize_survivors=False):
    """Ordinary bmm bridge; selected map copies cost O(T*k*d*m) memory."""
    validate_experts(x, gate_map, up_map, down_map, ids, weights, kept)
    flat = kept.reshape(-1).nonzero().flatten()
    if not len(flat):
        return x * 0
    expert_ids = ids.reshape(-1)[flat]
    token_ids = flat // ids.shape[1]
    rows = x[token_ids, None, :]
    gate = F.silu(torch.bmm(rows, gate_map[expert_ids].transpose(1, 2)))
    up = torch.bmm(rows, up_map[expert_ids].transpose(1, 2))
    answer = torch.bmm(gate * up, down_map[expert_ids].transpose(1, 2)).squeeze(1)
    effective = effective_weights(weights, kept, renormalize_survivors)
    answer = answer * effective.reshape(-1)[flat, None]
    output = torch.zeros_like(x).index_add(0, token_ids, answer)
    finite("batched return", output)
    return output


def dense_oracle(x, gate_map, up_map, down_map, ids, weights, kept,
                 renormalize_survivors=False):
    """Compute all experts only for a small correctness comparison."""
    validate_experts(x, gate_map, up_map, down_map, ids, weights, kept)
    answers = torch.stack([F.linear(F.silu(F.linear(x, g)) * F.linear(x, u), d)
                           for g, u, d in zip(gate_map, up_map, down_map)], dim=1)
    selected = answers.gather(1, ids[..., None].expand(-1, -1, x.shape[1]))
    output = (selected * effective_weights(weights, kept, renormalize_survivors)[..., None]).sum(1)
    finite("dense oracle return", output)
    return output


def noisy_crossing(clean, sigma, threshold):
    """Conditional on all other sampled noisy scores, whose kth score is fixed."""
    if not all(math.isfinite(v) for v in (clean, sigma, threshold)) or sigma <= 0:
        raise ValueError("finite clean/threshold and strictly positive sigma are required")
    return .5 * math.erfc((threshold - clean) / (sigma * math.sqrt(2)))


def soft_slots(x, phi, expert_maps):
    """One slot per expert; whole-sequence toy, not causal decoder attention."""
    finite("slot input", x, 2)
    finite("slot projection", phi, 2)
    finite("slot expert maps", expert_maps, 3)
    tokens, width = x.shape
    experts = phi.shape[1]
    if tokens == 0 or width == 0 or experts == 0 or phi.shape[0] != width or expert_maps.shape != (experts, width, width):
        raise ValueError("X [T,d], Phi [d,E], maps [E,d,d] require positive sizes")
    if any(v.dtype != x.dtype or v.device != x.device for v in (phi, expert_maps)):
        raise ValueError("slot operands must share dtype and device")
    scores = x @ phi
    finite("slot scores", scores)
    dispatch = scores.softmax(0)
    combine = scores.softmax(1)
    slots = dispatch.T @ x
    answers = torch.einsum("ed,ejd->ej", slots, expert_maps)
    output = combine @ answers
    finite("slot output", output)
    return output, dispatch, combine, slots


def expected_load(clean, scale, thresholds):
    """Sum conditional crossing probabilities over token rows, for each expert.

    Each threshold is the kth score of the OTHER fixed sampled experts for that
    token. Averaging over those other samples is separate from this conditional
    calculation. This routine does not call a single sample an expectation.
    """
    finite("clean scores", clean, 2)
    finite("noise scales", scale, 2)
    finite("other-score thresholds", thresholds, 2)
    if clean.shape != scale.shape or clean.shape != thresholds.shape or clean.numel() == 0 or (scale <= 0).any():
        raise ValueError("matching nonempty shapes and strictly positive noise scales are required")
    z = (thresholds - clean) / (scale * math.sqrt(2))
    probabilities = .5 * torch.erfc(z)
    return probabilities.sum(0), probabilities


def cv_squared(load):
    """Population variance / squared mean; undefined when total load is zero."""
    finite("load", load, 1)
    if load.numel() == 0 or (load < 0).any() or not load.mean() > 0:
        raise ValueError("a nonempty nonnegative load with positive mean is required")
    return load.var(unbiased=False) / load.mean().square()


def comparison_fixture(seed=19, tokens=5, experts=4, width=3, hidden=5):
    generator = torch.Generator().manual_seed(seed)
    shapes = [(tokens, width), (experts, width), (experts, hidden, width),
              (experts, hidden, width), (experts, width, hidden)]
    return [torch.randn(shape, generator=generator, dtype=torch.float64) * .35 for shape in shapes]


def forward_with_credit(function, fixture, k=2, normalize=True, capacity=None, order=None):
    operands = [value.detach().clone().requires_grad_() for value in fixture]
    x, router, gate, up, down = operands
    logits = F.linear(x, router)
    ids, weights, _ = select_gates(logits, k, normalize)
    kept, used = allocate(ids, gate.shape[0], capacity, order)
    output = function(x, gate, up, down, ids, weights, kept)
    direction = torch.linspace(.4, 1.1, output.numel(), dtype=x.dtype).reshape_as(output)
    loss = (output * direction).sum() + .07 * output.square().sum()
    raw_gradients = torch.autograd.grad(loss, operands, allow_unused=True)
    # Equality of numerical derivatives is separate from optimizer None handling.
    gradients = [torch.zeros_like(v) if g is None else g for v, g in zip(operands, raw_gradients)]
    return output.detach(), gradients, used


def main():
    fixture = comparison_fixture()
    reference, gradients, _ = forward_with_credit(dense_oracle, fixture)
    for function in (grouped_experts, batched_tool_experts):
        output, credit, _ = forward_with_credit(function, fixture)
        torch.testing.assert_close(output, reference, rtol=1e-12, atol=1e-12)
        for actual, expected in zip(credit, gradients):
            torch.testing.assert_close(actual, expected, rtol=1e-11, atol=1e-12)
        # One same-state update; no training loop or saved experiment is changed.
        updated = [v - .03 * g for v, g in zip(fixture, credit)]
        updated_reference = [v - .03 * g for v, g in zip(fixture, gradients)]
        for a, b in zip(updated, updated_reference):
            torch.testing.assert_close(a, b, rtol=1e-12, atol=1e-12)
    modes = [(1, True, None), (1, False, None), (2, True, 1), (4, False, None), (2, True, 0)]
    for k, normalized, capacity in modes:
        expected, expected_gradients, _ = forward_with_credit(dense_oracle, fixture, k, normalized, capacity)
        for function in (grouped_experts, batched_tool_experts):
            output, actual_gradients, used = forward_with_credit(function, fixture, k, normalized, capacity)
            torch.testing.assert_close(output, expected, rtol=1e-12, atol=1e-12)
            for actual, target in zip(actual_gradients, expected_gradients):
                torch.testing.assert_close(actual, target, rtol=1e-11, atol=1e-12)
    x = torch.eye(2, dtype=torch.float64)
    phi = torch.tensor([[math.log(3), 0], [0, math.log(3)]], dtype=x.dtype)
    maps = torch.stack([x, 2 * x])
    output, _, _, _ = soft_slots(x, phi, maps)
    torch.testing.assert_close(output, torch.tensor([[.6875, .5625], [.5625, 1.1875]], dtype=x.dtype))
    load, probabilities = expected_load(torch.zeros((2, 2), dtype=x.dtype),
        torch.full((2, 2), .5, dtype=x.dtype), torch.tensor([[.5, 0], [.5, 0]], dtype=x.dtype))
    torch.testing.assert_close(load, torch.tensor([2 * noisy_crossing(0, .5, .5), 1], dtype=x.dtype))
    print("expected load and CV squared:", load.tolist(), float(cv_squared(load)))
    print("grouped/bmm/dense output and all operand gradients: equal")
    print("one same-state update: equal")
    print("conditional noisy load:", noisy_crossing(0, .5, .5))
    print("Soft MoE outputs:", output.tolist())
    print("finite reference output:", reference.tolist())


if __name__ == "__main__":
    main()
