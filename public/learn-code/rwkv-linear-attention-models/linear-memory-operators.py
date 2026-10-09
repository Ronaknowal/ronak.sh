"""Differentiable positive-feature memory; ordinary PyTorch, no custom kernel.

q,k: [N,T,H,m], v: [N,T,H,p]. Features are already mapped and nonnegative.
State is (S:[N,H,m,p], z:[N,H,m]). An active unsupported read is an error.
Padding emits zero and preserves state. A reset acts only at a valid position,
before that position writes. This policy is separate from the normalized rule.
"""
import torch


def require_finite(*arrays):
    if not all(torch.isfinite(x).all().item() for x in arrays):
        raise FloatingPointError("Memory arithmetic overflowed; change scaling or precision.")


def validate(q, k, v, state=None, valid=None, reset=None):
    if q.ndim != 4 or k.ndim != 4 or v.ndim != 4 or q.shape != k.shape or v.shape[:3] != q.shape[:3]:
        raise ValueError("Expected q/k [N,T,H,m], v [N,T,H,p].")
    if not q.is_floating_point() or any(x.dtype != q.dtype or x.device != q.device for x in (k, v)):
        raise ValueError("Floating inputs must share dtype and device.")
    if not all(torch.isfinite(x).all().item() for x in (q, k, v)) or (q < 0).any() or (k < 0).any():
        raise ValueError("Finite inputs and nonnegative mapped q/k are required.")
    n, t, h, m = q.shape
    p = v.shape[-1]
    if min(n, t, h, m, p) < 1:
        raise ValueError("Every dimension must be positive.")
    if state is None:
        state = (q.new_zeros(n, h, m, p), q.new_zeros(n, h, m))
    if state[0].shape != (n, h, m, p) or state[1].shape != (n, h, m):
        raise ValueError("Wrong initial state shape.")
    if any(x.device != q.device or x.dtype != q.dtype or not torch.isfinite(x).all() for x in state):
        raise ValueError("State must be finite and match input dtype/device.")
    if (state[1] < 0).any():
        raise ValueError("Normalizer state must be nonnegative.")
    masks = []
    for mask, default in ((valid, True), (reset, False)):
        if mask is None:
            mask = torch.full((n, t), default, dtype=torch.bool, device=q.device)
        if mask.shape != (n, t) or mask.dtype != torch.bool or mask.device != q.device:
            raise ValueError("Masks must be Boolean [N,T] on the input device.")
        masks.append(mask)
    return state, *masks


def recurrent(q, k, v, state=None, valid=None, reset=None):
    (s, z), valid, reset = validate(q, k, v, state, valid, reset)
    outputs = []
    for t in range(q.shape[1]):
        active = valid[:, t, None, None]
        clear = (reset[:, t] & valid[:, t])[:, None, None]
        s = torch.where(clear[..., None], torch.zeros_like(s), s)
        z = torch.where(clear, torch.zeros_like(z), z)
        key = torch.where(active, k[:, t], torch.zeros_like(k[:, t]))
        value = torch.where(active, v[:, t], torch.zeros_like(v[:, t]))
        query = torch.where(active, q[:, t], torch.zeros_like(q[:, t]))
        candidate_s = s + key[..., :, None] * value[..., None, :]
        candidate_z = z + key
        require_finite(candidate_s, candidate_z)
        s = torch.where(active[..., None], candidate_s, s)
        z = torch.where(active, candidate_z, z)
        denominator = (query * z).sum(-1)
        if ((denominator <= 0) & valid[:, t, None]).any():
            raise ValueError("An active query has zero kernel support.")
        safe = torch.where(valid[:, t, None], denominator, torch.ones_like(denominator))
        numerator = torch.einsum("nhm,nhmp->nhp", query, s)
        require_finite(numerator, denominator)
        answer = numerator / safe[..., None]
        require_finite(answer)
        outputs.append(torch.where(active, answer, torch.zeros_like(numerator)))
    return torch.stack(outputs, 1), (s, z)


def chunked(q, k, v, size, state=None, valid=None, reset=None):
    """Bounded causal score blocks; at most size² local scores per head.

    A within-block reset changes which donors and incoming state are legal.
    This is a portable differentiable reference, not a fused throughput claim.
    """
    if not isinstance(size, int) or isinstance(size, bool) or size < 1:
        raise ValueError("Chunk size must be a positive integer.")
    (s, z), valid, reset = validate(q, k, v, state, valid, reset)
    outputs = []
    for start in range(0, q.shape[1], size):
        stop = min(start + size, q.shape[1])
        qc, kc, vc = q[:, start:stop], k[:, start:stop], v[:, start:stop]
        active = valid[:, start:stop]
        qc, kc, vc = [torch.where(active[..., None, None], x, torch.zeros_like(x)) for x in (qc, kc, vc)]
        segments = (reset[:, start:stop] & active).long().cumsum(1)
        length = stop - start
        triangle = torch.ones(length, length, dtype=torch.bool, device=q.device).tril()
        legal = triangle[None] & (segments[:, :, None] == segments[:, None, :]) & active[:, None, :]
        weights = torch.einsum("nthm,nshm->nhts", qc, kc) * legal[:, None]
        incoming = (segments == 0)[:, :, None]
        numerator = torch.einsum("nthm,nhmp->nthp", qc, s) * incoming[..., None]
        numerator = numerator + torch.einsum("nhts,nshp->nthp", weights, vc)
        denominator = torch.einsum("nthm,nhm->nth", qc, z) * incoming + weights.sum(-1).transpose(1, 2)
        require_finite(weights, numerator, denominator)
        if ((denominator <= 0) & active[..., None]).any():
            raise ValueError("An active query has zero kernel support.")
        safe = torch.where(active[..., None], denominator, torch.ones_like(denominator))
        answer = numerator / safe[..., None]
        require_finite(answer)
        outputs.append(torch.where(active[..., None, None], answer, torch.zeros_like(numerator)))
        final_segment = segments[:, -1:]
        donor = active & (segments == final_segment)
        keep = (final_segment[:, 0] == 0)[:, None, None]
        s = s * keep[..., None] + torch.einsum("nthm,nthp,nt->nhmp", kc, vc, donor.to(q.dtype))
        z = z * keep + torch.einsum("nthm,nt->nhm", kc, donor.to(q.dtype))
        require_finite(s, z)
    return torch.cat(outputs, 1), (s, z)


def dense_oracle(q, k, v, state=None, valid=None, reset=None):
    """Full T² score table, for small verification fixtures only."""
    (initial_s, initial_z), valid, reset = validate(q, k, v, state, valid, reset)
    q, k, v = [torch.where(valid[..., None, None], x, torch.zeros_like(x)) for x in (q, k, v)]
    scores = torch.einsum("nthm,nshm->nhts", q, k)
    require_finite(scores)
    outputs = []
    final_s, final_z = [], []
    for batch in range(q.shape[0]):
        begin = 0
        use_initial = True
        batch_output = []
        for t in range(q.shape[1]):
            if not valid[batch, t]:
                batch_output.append(torch.zeros_like(v[batch, t]))
                continue
            if reset[batch, t]:
                begin, use_initial = t, False
            weights = scores[batch, :, t, begin:t + 1] * valid[batch, begin:t + 1]
            numerator = torch.einsum("hs,shp->hp", weights, v[batch, begin:t + 1])
            denominator = weights.sum(-1)
            if use_initial:
                numerator = numerator + torch.einsum("hm,hmp->hp", q[batch, t], initial_s[batch])
                denominator = denominator + (q[batch, t] * initial_z[batch]).sum(-1)
            require_finite(numerator, denominator)
            if (denominator <= 0).any():
                raise ValueError("An active query has zero kernel support.")
            answer = numerator / denominator[:, None]
            require_finite(answer)
            batch_output.append(answer)
        donors = valid[batch, begin:].to(q.dtype)
        s = torch.einsum("shm,shp,s->hmp", k[batch, begin:], v[batch, begin:], donors)
        z = torch.einsum("shm,s->hm", k[batch, begin:], donors)
        if use_initial:
            s, z = s + initial_s[batch], z + initial_z[batch]
        require_finite(s, z)
        outputs.append(torch.stack(batch_output))
        final_s.append(s)
        final_z.append(z)
    return torch.stack(outputs), (torch.stack(final_s), torch.stack(final_z))


if __name__ == "__main__":
    q = torch.tensor([[1., 1.], [2., 1.], [1., 2.], [3., 1.]], dtype=torch.float64)[None, :, None]
    k = torch.tensor([[1., 0.], [0., 1.], [1., 1.], [2., 1.]], dtype=torch.float64)[None, :, None]
    v = torch.tensor([2., 8., -1., 5.], dtype=torch.float64)[None, :, None, None]
    reference, final = recurrent(q, k, v)
    for size in (1, 2, 3, 8):
        actual, saved = chunked(q, k, v, size)
        torch.testing.assert_close(actual, reference)
        for a, b in zip(saved, final):
            torch.testing.assert_close(a, b)
    print("outputs", reference.flatten().tolist(), "S", final[0].flatten().tolist(), "z", final[1].flatten().tolist())
