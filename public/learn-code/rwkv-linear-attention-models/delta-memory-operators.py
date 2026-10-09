"""Batched differentiable associative memories in VALUE-by-KEY orientation.

All time inputs [N,T,H,*], initial matrix [N,H,p,d]. Ordinary Torch primitives,
vectorized N/H/p/d and an explicit time loop. No fused-speed claim.
Padding carries state/emits zero. Valid resets clear BEFORE update/read.
"""
import torch


def memory(q, k, v, *, rule="delta", rate=None, retention=None, removal=None,
           state=None, valid=None, reset=None, dense_transition=False):
    if rule not in ("additive", "delta", "gated", "goose"):
        raise ValueError("Unknown memory rule.")
    if q.ndim != 4 or k.ndim != 4 or v.ndim != 4 or q.shape != k.shape or v.shape[:3] != q.shape[:3] or min(q.shape) < 1 or v.shape[-1] < 1:
        raise ValueError("q/k [N,T,H,d] and v [N,T,H,p] are required.")
    n, t, h, d = q.shape
    p = v.shape[-1]
    if not q.is_floating_point():
        raise ValueError("Floating inputs are required.")
    if rate is None:
        rate = q.new_ones(n, t, h, 1)
    if retention is None:
        retention = q.new_ones(n, t, h, d)
    if removal is None:
        removal = k
    if rate.shape not in ((n, t, h, 1), (n, t, h, d)) or retention.shape != k.shape or removal.shape != k.shape:
        raise ValueError("rate [N,T,H,1 or d], retention/removal [N,T,H,d].")
    for x in (q, k, v, rate, retention, removal):
        if x.dtype != q.dtype or x.device != q.device or not torch.isfinite(x).all():
            raise ValueError("Finite operands must share dtype/device.")
    if (rate < 0).any() or (retention < 0).any() or (retention > 1).any():
        raise ValueError("Nonnegative rate, retention in [0,1].")
    if rule == "delta" and rate.shape[-1] != 1:
        raise ValueError("The ordinary delta rate is scalar per head.")
    if state is None:
        state = q.new_zeros(n, h, p, d)
    if state.shape != (n, h, p, d) or state.dtype != q.dtype or state.device != q.device or not torch.isfinite(state).all():
        raise ValueError("Invalid initial matrix.")
    masks = []
    for mask, default in ((valid, True), (reset, False)):
        if mask is None:
            mask = torch.full((n, t), default, dtype=torch.bool, device=q.device)
        if mask.shape != (n, t) or mask.dtype != torch.bool or mask.device != q.device:
            raise ValueError("Boolean masks [N,T] on the input device required.")
        masks.append(mask)
    valid, reset = masks
    outputs = []
    for i in range(t):
        active = valid[:, i, None, None, None]
        clear = (reset[:, i] & valid[:, i])[:, None, None, None]
        state = torch.where(clear, torch.zeros_like(state), state)
        key = torch.where(valid[:, i, None, None], k[:, i], torch.zeros_like(k[:, i]))
        value = torch.where(valid[:, i, None, None], v[:, i], torch.zeros_like(v[:, i]))
        written = value[..., :, None] * key[..., None, :]
        if rule == "additive":
            candidate = state + written
        elif rule == "delta":
            before = torch.einsum("nhpd,nhd->nhp", state, key)
            candidate = state + rate[:, i, ..., None] * (value - before)[..., :, None] * key[..., None, :]
        elif rule == "gated":
            candidate = state * retention[:, i, ..., None, :] + written
        else:
            erase = torch.where(valid[:, i, None, None], removal[:, i], torch.zeros_like(removal[:, i]))
            factor = rate[:, i] * erase
            if dense_transition:
                transition = torch.diag_embed(retention[:, i]) - erase[..., :, None] * factor[..., None, :]
                candidate = state @ transition + written
            else:
                read = torch.einsum("nhpd,nhd->nhp", state, erase)
                candidate = state * retention[:, i, ..., None, :] - read[..., :, None] * factor[..., None, :] + written
        if not torch.isfinite(candidate).all():
            raise FloatingPointError("Memory update overflowed; change scaling or precision.")
        state = torch.where(active, candidate, state)
        query = torch.where(valid[:, i, None, None], q[:, i], torch.zeros_like(q[:, i]))
        answer = torch.einsum("nhpd,nhd->nhp", state, query)
        if not torch.isfinite(answer).all():
            raise FloatingPointError("Memory read overflowed; change scaling or precision.")
        outputs.append(torch.where(valid[:, i, None, None], answer, torch.zeros_like(answer)))
    return torch.stack(outputs, 1), state


if __name__ == "__main__":
    k = torch.tensor([[1., 0.], [0., 1.], [1., 0.]], dtype=torch.float64)[None, :, None]
    v = torch.tensor([2., 7., 5.], dtype=torch.float64)[None, :, None, None]
    for rule in ("additive", "delta"):
        y, state = memory(k, k, v, rule=rule)
        print(rule, "outputs", y.flatten().tolist(), "memory", state.flatten().tolist())
    m = torch.tensor([[2., 7.], [-1., 3.]], dtype=torch.float64)[None, None]
    q = torch.tensor([1., 0.], dtype=torch.float64)[None, None, None]
    v = torch.tensor([5., 2.], dtype=torch.float64)[None, None, None]
    arguments = dict(rule="goose", state=m, retention=q.new_tensor([.8, .9]).reshape(1, 1, 1, 2),
                     rate=q.new_tensor([.6, .2]).reshape(1, 1, 1, 2),
                     removal=q.new_tensor([.6, .8]).reshape(1, 1, 1, 2))
    y, matrix = memory(q, q, v, **arguments)
    expected, dense = memory(q, q, v, dense_transition=True, **arguments)
    torch.testing.assert_close(matrix, dense)
    torch.testing.assert_close(y, expected)
    print("Goose", matrix.flatten().tolist())
