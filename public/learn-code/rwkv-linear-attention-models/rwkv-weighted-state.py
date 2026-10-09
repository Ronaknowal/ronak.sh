"""Stable, differentiable RWKV-4 weighted state, vectorized over N and D.

keys/values [N,T,D], log_decay/bonus [D]. State (a,b,p) [N,D].
The present bonus affects READ only. STORE decays history then writes the key.
Empty state has a=b=0,p=-inf. Padding emits zero and carries all three arrays;
reset clears them only at a valid position, before that position reads/writes.
"""
import torch


def weighted(keys, values, log_decay, bonus, state=None, valid=None, reset=None):
    if keys.ndim != 3 or values.shape != keys.shape or keys.shape[-1:] != log_decay.shape or bonus.shape != log_decay.shape:
        raise ValueError("Expected k/v [N,T,D], decay/bonus [D].")
    if min(keys.shape) < 1 or not keys.is_floating_point():
        raise ValueError("Nonempty floating inputs are required.")
    for x in (values, log_decay, bonus):
        if x.dtype != keys.dtype or x.device != keys.device or not torch.isfinite(x).all():
            raise ValueError("Finite inputs must share dtype/device.")
    if not torch.isfinite(keys).all() or (log_decay > 0).any():
        raise ValueError("Keys must be finite and log decay nonpositive.")
    n, t, d = keys.shape
    if state is None:
        state = (keys.new_zeros(n, d), keys.new_zeros(n, d), keys.new_full((n, d), -torch.inf))
    a, b, p = state
    if any(x.shape != (n, d) or x.dtype != keys.dtype or x.device != keys.device for x in state):
        raise ValueError("Incorrect state shape/dtype/device.")
    if not torch.isfinite(a).all() or not torch.isfinite(b).all() or (b < 0).any():
        raise ValueError("Signed numerator and nonnegative denominator must be finite.")
    empty = b == 0
    if ((~empty) & ~torch.isfinite(p)).any() or (empty & ((a != 0) | ~torch.isneginf(p))).any():
        raise ValueError("Empty state is exactly (0,0,-inf); nonempty scale must be finite.")
    masks = []
    for mask, default in ((valid, True), (reset, False)):
        if mask is None:
            mask = torch.full((n, t), default, dtype=torch.bool, device=keys.device)
        if mask.shape != (n, t) or mask.dtype != torch.bool or mask.device != keys.device:
            raise ValueError("Masks must be Boolean [N,T] on the input device.")
        masks.append(mask)
    valid, reset = masks
    outputs = []
    for i in range(t):
        active = valid[:, i, None]
        clear = (reset[:, i] & valid[:, i])[:, None]
        a = torch.where(clear, torch.zeros_like(a), a)
        b = torch.where(clear, torch.zeros_like(b), b)
        p = torch.where(clear, torch.full_like(p, -torch.inf), p)
        # A safe representative avoids evaluating invalid -inf - -inf branches.
        has_history = b > 0
        old_scale = torch.where(has_history, p, keys[:, i] + bonus)
        read_scale = torch.maximum(old_scale, keys[:, i] + bonus)
        old = torch.where(has_history, torch.exp(old_scale - read_scale), torch.zeros_like(a))
        current = torch.exp(keys[:, i] + bonus - read_scale)
        answer = (old * a + current * values[:, i]) / (old * b + current)
        store_old = torch.where(has_history, p + log_decay, keys[:, i])
        next_scale = torch.maximum(store_old, keys[:, i])
        retained = torch.where(has_history, torch.exp(store_old - next_scale), torch.zeros_like(a))
        fresh = torch.exp(keys[:, i] - next_scale)
        next_a = retained * a + fresh * values[:, i]
        next_b = retained * b + fresh
        if not all(torch.isfinite(x).all().item() for x in (answer, next_a, next_b, next_scale)):
            raise FloatingPointError("Weighted arithmetic overflowed; change scaling or precision.")
        a, b, p = (torch.where(active, new, old) for new, old in ((next_a, a), (next_b, b), (next_scale, p)))
        outputs.append(torch.where(active, answer, torch.zeros_like(answer)))
    return torch.stack(outputs, 1), (a, b, p)


def direct_oracle(keys, values, log_decay, bonus, state=None, valid=None, reset=None):
    """Explicit log-weight history; small independent O(T²D) reference.

    An incoming cache is represented as one aggregate signed value a/b with
    log mass p+log(b), preserving its complete weighted information.
    """
    n, t, d = keys.shape
    if valid is None:
        valid = torch.ones(n, t, dtype=torch.bool, device=keys.device)
    if reset is None:
        reset = torch.zeros_like(valid)
    output = []
    for batch in range(n):
        histories = []
        if state is not None:
            a, b, p = (x[batch] for x in state)
            safe_b = torch.where(b > 0, b, torch.ones_like(b))
            histories.append((torch.where(b > 0, p + safe_b.log(), torch.full_like(p, -torch.inf)), a / safe_b))
        answers = []
        for position in range(t):
            if not valid[batch, position]:
                answers.append(torch.zeros_like(values[batch, position]))
                continue
            if reset[batch, position]:
                histories = []
            logits = [item[0] for item in histories] + [keys[batch, position] + bonus]
            donors = [item[1] for item in histories] + [values[batch, position]]
            weight = torch.stack(logits).softmax(0)
            answers.append((weight * torch.stack(donors)).sum(0))
            histories = [(log_weight + log_decay, value) for log_weight, value in histories]
            histories.append((keys[batch, position], values[batch, position]))
        output.append(torch.stack(answers))
    return torch.stack(output)


if __name__ == "__main__":
    k = torch.tensor([0., 2., 0., 4.], dtype=torch.float64)
    k[1:] = torch.tensor([2., 1., 4.], dtype=torch.float64).log()
    k = k[None, :, None]
    v = torch.tensor([2., 8., -1., 5.], dtype=torch.float64)[None, :, None]
    decay = torch.tensor([.5], dtype=torch.float64).log()
    bonus = torch.tensor([2.], dtype=torch.float64).log()
    y, state = weighted(k, v, decay, bonus)
    torch.testing.assert_close(y, direct_oracle(k, v, decay, bonus))
    for offset in (-1000., 1000.):
        shifted, _ = weighted(k + offset, v, decay, bonus)
        torch.testing.assert_close(shifted, y)
    print("outputs", y.flatten().tolist(), "scaled final", [x.flatten().tolist() for x in state])
