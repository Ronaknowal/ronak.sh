"""Transparent Shaw/T5 attention and ordinary PyTorch composition.

Run: python relative-position-operators.py
Requires NumPy and PyTorch. The fixture is float64, dropout-free, one head.
Rows are sequence positions; relation offset is key ID minus query ID.
These small operators teach relative lookup and both gradient routes. They are
not optimized kernels: Shaw explicitly materializes Lq x Lk x d relations.
"""
import math
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


def validate_rows(q, k, v, q_ids, k_ids, allowed):
    q, k, v = (np.asarray(a, dtype=np.float64) for a in (q, k, v))
    q_ids, k_ids = (np.asarray(a) for a in (q_ids, k_ids))
    if not all(np.issubdtype(a.dtype, np.integer) for a in (q_ids, k_ids)):
        raise ValueError('Logical relation IDs must be integers in this discrete fixture.')
    allowed = np.asarray(allowed, dtype=bool)
    if (q.ndim != 2 or k.ndim != 2 or v.ndim != 2
            or not len(q) or not len(k) or not q.shape[1] or not v.shape[1]
            or q.shape[1] != k.shape[1] or k.shape[0] != v.shape[0]
            or q_ids.shape != (q.shape[0],) or k_ids.shape != (k.shape[0],)
            or allowed.shape != (q.shape[0], k.shape[0])
            or not allowed.any(axis=-1).all()
            or not all(np.isfinite(a).all() for a in (q, k, v))):
        raise ValueError('Finite compatible rows, IDs and one legal key per query required.')
    return q, k, v, q_ids, k_ids, allowed


def stable_weights(scores, allowed):
    masked = np.where(allowed, scores, -np.inf)
    exponent = np.exp(masked - masked.max(axis=-1, keepdims=True))
    return exponent / exponent.sum(axis=-1, keepdims=True)


def shaw_attention(q, k, v, q_ids, k_ids, allowed, key_table, value_table):
    q, k, v, q_ids, k_ids, allowed = validate_rows(q, k, v, q_ids, k_ids, allowed)
    key_table, value_table = map(np.asarray, (key_table, value_table))
    if (key_table.ndim != 2 or key_table.shape[0] % 2 != 1
            or value_table.shape != (key_table.shape[0], v.shape[1])
            or key_table.shape[1] != q.shape[1]
            or not np.isfinite(key_table).all() or not np.isfinite(value_table).all()):
        raise ValueError('Use matching finite odd-row key/value relation tables.')
    radius = (key_table.shape[0] - 1) // 2
    offsets = k_ids[None, :] - q_ids[:, None]
    indices = np.clip(offsets, -radius, radius) + radius
    relation_keys, relation_values = key_table[indices], value_table[indices]
    scores = (q @ k.T + np.einsum('id,ijd->ij', q, relation_keys)) / math.sqrt(q.shape[1])
    weights = stable_weights(scores, allowed)
    output = weights @ v + np.einsum('ij,ijv->iv', weights, relation_values)
    return output, weights, indices


def t5_buckets(offsets, bidirectional=True, buckets=32, max_distance=128):
    offsets = np.asarray(offsets)
    if not np.issubdtype(offsets.dtype, np.integer):
        raise ValueError('T5 bucket offsets must be integers.')
    if buckets < 4 or buckets % 2 or max_distance <= buckets // 2:
        raise ValueError('Even bucket count and a larger saturation distance required.')
    per_direction = buckets // 2 if bidirectional else buckets
    direction = (offsets > 0).astype(np.int64) * per_direction if bidirectional else 0
    distance = np.abs(offsets) if bidirectional else np.maximum(-offsets, 0)
    exact = per_direction // 2
    # Clamp only the logarithm input: near distances still use their exact bins.
    large = exact + np.floor(np.log(np.maximum(distance, exact) / exact)
                             / math.log(max_distance / exact)
                             * (per_direction - exact)).astype(np.int64)
    return direction + np.where(distance < exact, distance, np.minimum(large, per_direction - 1))


def t5_attention(q, k, v, q_ids, k_ids, allowed, bias_table, bidirectional=True):
    q, k, v, q_ids, k_ids, allowed = validate_rows(q, k, v, q_ids, k_ids, allowed)
    bias_table = np.asarray(bias_table, dtype=np.float64)
    if bias_table.shape != (32,) or not np.isfinite(bias_table).all():
        raise ValueError('This fixture uses a finite 32-entry scalar bias table.')
    indices = t5_buckets(k_ids[None, :] - q_ids[:, None], bidirectional)
    # Native T5's score scale is 1; it does not divide by sqrt(d).
    weights = stable_weights(q @ k.T + bias_table[indices], allowed)
    return weights @ v, weights, indices


def ordinary_shaw(q, k, v, q_ids, k_ids, allowed, key_embedding, value_embedding):
    radius = (key_embedding.num_embeddings - 1) // 2
    index = (k_ids[None, :] - q_ids[:, None]).clamp(-radius, radius) + radius
    a_key, a_value = key_embedding(index), value_embedding(index)
    scale = 1 / math.sqrt(q.shape[-1])
    scores = (q @ k.T + torch.einsum('id,ijd->ij', q, a_key)) * scale
    weights = scores.masked_fill(~allowed, -torch.inf).softmax(-1)
    # SDPA handles the ordinary V mixture. Its float mask is already a logit bias,
    # so the relative dot must be scaled once before being placed in the mask.
    bias = (torch.einsum('id,ijd->ij', q, a_key) * scale).masked_fill(~allowed, -torch.inf)
    content_output = F.scaled_dot_product_attention(q, k, v, attn_mask=bias,
                                                   dropout_p=0.0, scale=scale)
    return content_output + torch.einsum('ij,ijv->iv', weights, a_value), weights, index


def ordinary_t5(q, k, v, q_ids, k_ids, allowed, bias_embedding):
    indices = torch.as_tensor(t5_buckets((k_ids[None, :] - q_ids[:, None]).numpy()))
    bias = bias_embedding(indices).squeeze(-1).masked_fill(~allowed, -torch.inf)
    return F.scaled_dot_product_attention(q, k, v, attn_mask=bias, dropout_p=0.0, scale=1.0)


def central_gradient(fn, array, step=1e-5):
    result = np.zeros_like(array)
    for index in np.ndindex(array.shape):
        original = array[index]
        array[index] = original + step
        positive = fn()
        array[index] = original - step
        negative = fn()
        array[index] = original
        result[index] = (positive - negative) / (2 * step)
    return result


def main():
    torch.set_num_threads(1)
    q = np.array([[2., 0.], [0., 2.]])
    k = np.array([[1., .5], [-.5, 1.], [.25, -.5]])
    v = np.array([[2., 0.], [0., 3.], [1., -1.]])
    q_ids, k_ids = np.array([1, 2]), np.array([0, 1, 3])
    allowed = k_ids[None, :] <= q_ids[:, None]
    a_key = np.array([[-.2, .1], [.5, 1.], [0., 0.], [.25, -.5], [.1, .2]])
    a_value = np.array([[.1, 0.], [0., .2], [0., 0.], [-.1, .3], [.2, -.1]])
    probe = np.array([[.3, -.7], [1., .2]])
    tq, tk, tv = [torch.tensor(a, dtype=torch.float64, requires_grad=True) for a in (q, k, v)]
    key_embedding, value_embedding = [nn.Embedding(5, 2, dtype=torch.float64) for _ in range(2)]
    with torch.no_grad():
        key_embedding.weight.copy_(torch.from_numpy(a_key))
        value_embedding.weight.copy_(torch.from_numpy(a_value))
    torch_ids = [torch.from_numpy(a) for a in (q_ids, k_ids, allowed)]
    output, weights, indices = ordinary_shaw(tq, tk, tv, *torch_ids, key_embedding, value_embedding)
    scratch, scratch_weights, _ = shaw_attention(q, k, v, q_ids, k_ids, allowed, a_key, a_value)
    np.testing.assert_allclose(output.detach().numpy(), scratch, atol=1e-12, rtol=1e-12)
    np.testing.assert_allclose(weights.detach().numpy(), scratch_weights, atol=1e-12, rtol=1e-12)
    (output * torch.from_numpy(probe)).sum().backward()
    objective = lambda: float((shaw_attention(q, k, v, q_ids, k_ids, allowed, a_key, a_value)[0] * probe).sum())
    errors = [np.max(np.abs(central_gradient(objective, array) - gradient.detach().numpy()))
              for array, gradient in ((q, tq.grad), (k, tk.grad), (v, tv.grad),
                                      (a_key, key_embedding.weight.grad),
                                      (a_value, value_embedding.weight.grad))]
    assert max(errors) < 1e-8
    # Offset -1 repeats: the shared relation row receives both uses' gradients.
    assert (indices == 1).sum().item() == 2
    bias = np.linspace(-.4, .4, 32)
    bias_embedding = nn.Embedding(32, 1, dtype=torch.float64)
    with torch.no_grad():
        bias_embedding.weight.copy_(torch.from_numpy(bias[:, None]))
    for tensor in (tq, tk, tv):
        tensor.grad = None
    ordinary = ordinary_t5(tq, tk, tv, *torch_ids, bias_embedding)
    transparent = t5_attention(q, k, v, q_ids, k_ids, allowed, bias)[0]
    np.testing.assert_allclose(ordinary.detach().numpy(), transparent, atol=1e-12, rtol=1e-12)
    (ordinary * torch.from_numpy(probe)).sum().backward()
    objective = lambda: float((t5_attention(q, k, v, q_ids, k_ids, allowed, bias)[0] * probe).sum())
    t5_errors = [np.max(np.abs(central_gradient(objective, array) - gradient.detach().numpy()))
                 for array, gradient in ((q, tq.grad), (k, tk.grad), (v, tv.grad),
                                         (bias, bias_embedding.weight.grad[:, 0]))]
    assert max(t5_errors) < 1e-8
    np.set_printoptions(precision=6)
    print('Shaw outputs:', scratch)
    print('T5 outputs:', transparent)
    print('Maximum Shaw input/table gradient difference:', max(errors))
    print('Maximum T5 input/table gradient difference:', max(t5_errors))
    print('Causal future buckets do not replace the independent permission mask.')


if __name__ == '__main__':
    main()
