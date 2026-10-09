"""Explicit packing and unequal-microbatch contracts for a reused causal decoder.

Run: python sft_batching.py --output batching-report.json
Requires PyTorch and the complete causal-language-modeling tiny_causal_lm.py.
The downloadable packet keeps that prerequisite beside this program.
"""
import argparse
import copy
import importlib.util
import json
import math
from pathlib import Path

import torch
import torch.nn.functional as F

from sft_data import collate


def load_decoder():
    local = Path(__file__).resolve().parent / 'tiny_causal_lm.py'
    path = local if local.exists() else local.parent.parent / 'causal-language-modeling/tiny_causal_lm.py'
    spec = importlib.util.spec_from_file_location('sft_causal_prerequisite', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.TinyLM


TinyLM = load_decoder()


def attention_edges(segments, valid):
    """Rows are queries, columns keys. Padded queries get a harmless self edge.

    They carry no selected targets. Real queries may see only valid current/past
    tokens of the same record; input token values never identify padding.
    """
    if segments.shape != valid.shape or segments.ndim != 2:
        raise ValueError('Expected segment IDs and validity [B,L]')
    length = segments.shape[1]
    causal = torch.ones(length, length, dtype=torch.bool, device=segments.device).tril()
    same = segments[:, :, None] == segments[:, None, :]
    allowed = same & causal & valid[:, None, :].bool() & valid[:, :, None].bool()
    diagonal = torch.eye(length, dtype=torch.bool, device=segments.device)[None]
    return allowed | (~valid.bool()[:, :, None] & diagonal)


class ExplicitDecoder(TinyLM):
    """Reuse all TinyLM parameters; expose attention edges and position IDs.

    CausalLM teaches the decoder. This extension changes only how its attention
    visibility and position lookup are supplied; it creates no new parameters.
    """
    def forward(self, ids, positions=None, allowed=None, fused=False):
        batch, length = ids.shape
        if positions is None:
            positions = torch.arange(length, device=ids.device)[None].expand(batch, -1)
        if allowed is None:
            allowed = torch.ones(batch, length, length, dtype=torch.bool, device=ids.device).tril()
        if positions.shape != ids.shape or allowed.shape != (batch, length, length):
            raise ValueError('Explicit position/attention shape mismatch')
        if not bool(allowed.any(-1).all()):
            raise ValueError('Every query needs at least one permitted key')
        hidden = self.token(ids) + self.position(positions)
        for block in self.blocks:
            normalized = block.ln1(hidden)
            attention = block.attention
            width = normalized.shape[-1]
            head_width = width // attention.heads
            parts = attention.qkv(normalized).chunk(3, dim=-1)
            q, k, v = [part.reshape(batch, length, attention.heads, head_width).transpose(1, 2)
                       for part in parts]
            if fused:
                values = F.scaled_dot_product_attention(q, k, v, attn_mask=allowed[:, None], dropout_p=0.)
            else:
                scores = (q @ k.transpose(-2, -1)) / math.sqrt(head_width)
                probabilities = scores.masked_fill(~allowed[:, None], float('-inf')).softmax(-1)
                values = probabilities @ v
            returned = values.transpose(1, 2).contiguous().reshape(batch, length, width)
            hidden = hidden + attention.out(returned)
            hidden = hidden + block.mlp(block.ln2(hidden))
        return self.head(self.norm(hidden))


def packed_batch(records):
    """Join records without cross-record attention or a cross-record target.

    A record's first token is context, never a label predicted by the preceding
    record. Position IDs restart at zero; the loss mask is a separate object.
    """
    if not records:
        raise ValueError('At least one record required')
    ids, labels, segments, positions, slices = [], [], [], [], []
    for segment, record in enumerate(records):
        row = collate([record])
        start = len(ids)
        ids.extend(row['input_ids'][0].tolist())
        labels.extend(row['labels'][0].tolist())
        segments.extend([segment] * len(record['ids']))
        positions.extend(range(len(record['ids'])))
        slices.append([start, len(ids)])
    ids = torch.tensor([ids]); segments = torch.tensor([segments])
    valid = torch.ones_like(ids)
    return {'input_ids': ids, 'labels': torch.tensor([labels]), 'positions': torch.tensor([positions]),
            'allowed': attention_edges(segments, valid), 'slices': slices}


def objective(logits, labels, denominator=None):
    """Sum after one causal shift; normalize by the declared selected count."""
    targets = labels[:, 1:]
    count = int((targets != -100).sum())
    if not count or denominator is not None and denominator <= 0:
        raise ValueError('No selected targets or invalid global denominator')
    numerator = F.cross_entropy(logits[:, :-1].reshape(-1, logits.shape[-1]), targets.reshape(-1),
                                ignore_index=-100, reduction='sum')
    return numerator / (count if denominator is None else denominator), count


def gradients(model):
    return {name: value.grad.detach().clone() for name, value in model.named_parameters()}


def maximum_difference(left, right):
    return max(float((left[name] - right[name]).detach().abs().max()) for name in left)


def verify():
    torch.set_num_threads(2)
    torch.manual_seed(37)
    records = [{'ids': [1, 2, 3, 4, 0], 'boundary': 3},
               {'ids': [1, 6, 7, 8, 9, 10, 0], 'boundary': 3}]
    batch = collate(records)
    valid = batch['attention_mask']
    allowed = attention_edges(torch.zeros_like(valid), valid)
    base = ExplicitDecoder(11, context=32, width=8, heads=2, layers=2).double()
    separate = copy.deepcopy(base)
    logits = separate(batch['input_ids'], allowed=allowed)
    loss, total = objective(logits, batch['labels'])
    loss.backward(); reference = gradients(separate)
    packed = packed_batch(records)
    joined = copy.deepcopy(base)
    packed_logits = joined(packed['input_ids'], positions=packed['positions'], allowed=packed['allowed'])
    packed_loss, packed_count = objective(packed_logits, packed['labels'])
    packed_loss.backward(); joined_gradients = gradients(joined)
    assert total == packed_count == 6
    for row, (start, end) in enumerate(packed['slices']):
        torch.testing.assert_close(packed_logits[0, start:end], logits[row, :end-start], rtol=1e-12, atol=1e-12)
    torch.testing.assert_close(loss, packed_loss, rtol=1e-12, atol=1e-12)
    grad_error = maximum_difference(reference, joined_gradients)
    assert grad_error < 1e-12
    torch.optim.SGD(separate.parameters(), lr=.03).step()
    torch.optim.SGD(joined.parameters(), lr=.03).step()
    update_error = maximum_difference(dict(separate.named_parameters()), dict(joined.named_parameters()))
    assert update_error < 1e-12

    # Two independent negative controls: context leakage and wrong positions.
    with torch.no_grad():
        leaked = base(packed['input_ids'], positions=packed['positions'])
        wrong_position = base(packed['input_ids'], allowed=packed['allowed'])
        fused = base(packed['input_ids'], positions=packed['positions'], allowed=packed['allowed'], fused=True)
    leak_error = float((leaked[:, 5:] - packed_logits.detach()[:, 5:]).abs().max())
    position_error = float((wrong_position[:, 5:] - packed_logits.detach()[:, 5:]).abs().max())
    assert leak_error > 1e-5 and position_error > 1e-5
    torch.testing.assert_close(fused, packed_logits.detach(), rtol=1e-12, atol=1e-12)

    accumulated = copy.deepcopy(base)
    wrong_accumulation = copy.deepcopy(base)
    counts = []
    for record in records:
        one = collate([record])
        local_logits = accumulated(one['input_ids'])
        contribution, count = objective(local_logits, one['labels'], denominator=total)
        contribution.backward(); counts.append(count)
        local_mean, _ = objective(wrong_accumulation(one['input_ids']), one['labels'])
        (local_mean / len(records)).backward()
    accumulation_error = maximum_difference(reference, gradients(accumulated))
    naive_error = maximum_difference(reference, gradients(wrong_accumulation))
    assert counts == [2, 4] and accumulation_error < 1e-12 and naive_error > 1e-5
    torch.optim.SGD(accumulated.parameters(), lr=.03).step()
    assert maximum_difference(dict(separate.named_parameters()), dict(accumulated.named_parameters())) < 1e-12

    return {'checks': ['Separate versus packed every valid logit, mean loss, all parameter gradients and SGD update',
                       'Native scaled-dot-product attention parity with explicit block mask',
                       'Ordinary causal packing and nonreset positions fail independently',
                       'Unequal-target weighted accumulation matches all gradients/update; naive mean-of-means fails'],
            'torch': torch.__version__, 'target_counts': counts, 'loss': float(loss.detach()),
            'all_parameter_gradient_error': grad_error, 'update_error': update_error,
            'accumulation_error': accumulation_error, 'naive_accumulation_gradient_error': naive_error,
            'cross_record_logit_error': leak_error, 'nonreset_position_logit_error': position_error,
            'packed_ids': packed['input_ids'].tolist(), 'packed_labels': packed['labels'].tolist(),
            'packed_positions': packed['positions'].tolist(), 'allowed': packed['allowed'].int().tolist()}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    result = verify()
    text = json.dumps(result, indent=2)
    if args.output: args.output.write_text(text + '\n', encoding='utf-8')
    print(text)
