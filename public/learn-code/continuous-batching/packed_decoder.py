"""Selective batching through an exact TinyLM and the real shared page pool.

Run: python packed_decoder.py
FP64 CPU inference; no training. Row-wise layers are shared, attention is
segmented by request and uses an explicit offset mask. This is not a fused GPU
operator. The NumPy page pool is converted to Torch only for the finite read.
"""

import json
import math
import numpy as np
import torch
import torch.nn.functional as F
from tiny_causal_lm import TinyLM
from shared_pool import SharedPool


class PackedDecoder:
    def __init__(self, model, pages=32, page_size=3, sdpa=False):
        self.model = model.cpu().double().eval()
        layers = len(model.blocks)
        heads = model.blocks[0].attention.heads
        width = model.token.embedding_dim // heads
        self.pool = SharedPool(pages, page_size, layers, heads, width)
        self.sdpa = sdpa

    @torch.inference_mode()
    def forward(self, chunks):
        """chunks is an insertion-ordered mapping ID -> new token IDs.

        Create or fork IDs explicitly on decoder.pool first. Empty chunks are
        omitted from arithmetic and returned as empty logit matrices.
        """
        identities = list(chunks)
        if any(identity not in self.pool.tables for identity in identities):
            raise KeyError("Create/fork every request before forwarding it.")
        offsets = [0]
        positions = []
        flat = []
        reservation = 0
        for identity, ids in chunks.items():
            old = self.pool.lengths[identity]
            if old + len(ids) > self.model.context:
                raise ValueError("Chunk exceeds learned-position context.")
            if any(
                not isinstance(token, int) or not 0 <= token < self.model.token.num_embeddings
                for token in ids
            ):
                raise ValueError("Invalid vocabulary ID.")
            if ids:
                old_pages = len(self.pool.tables[identity])
                reservation += math.ceil((old + len(ids)) / self.pool.page_size) - old_pages
                if (
                    old % self.pool.page_size
                    and self.pool.refs[self.pool.tables[identity][-1]] > 1
                ):
                    reservation += 1
            positions.extend(range(old, old + len(ids)))
            flat.extend(ids)
            offsets.append(len(flat))
        if reservation > len(self.pool.free):
            raise MemoryError(
                "Conservative whole-batch reservation does not fit; no model or cache mutation."
            )
        if not flat:
            return {
                identity: torch.empty((0, self.model.head.out_features), dtype=torch.float64)
                for identity in identities
            }
        hidden = self.model.token(torch.tensor(flat)) + self.model.position(
            torch.tensor(positions)
        )
        staged = {identity: [[], []] for identity in identities if len(chunks[identity])}
        histories = {identity: self.pool.dense(identity) for identity in staged}
        for layer, block in enumerate(self.model.blocks):
            attention = block.attention
            heads = attention.heads
            width = hidden.shape[-1] // heads
            parts = attention.qkv(block.ln1(hidden)).chunk(3, dim=-1)
            q, k, v = [part.reshape(len(flat), heads, width).transpose(0, 1) for part in parts]
            readouts = []
            for index, identity in enumerate(identities):
                begin, end = offsets[index : index + 2]
                if begin == end:
                    continue
                old = self.pool.lengths[identity]
                new_k, new_v = k[:, begin:end], v[:, begin:end]
                old_k, old_v = histories[identity]
                all_k = torch.cat((torch.from_numpy(old_k[layer]), new_k), dim=1)
                all_v = torch.cat((torch.from_numpy(old_v[layer]), new_v), dim=1)
                permitted = (
                    torch.arange(old + end - begin)[None, :]
                    <= torch.arange(old, old + end - begin)[:, None]
                )
                if self.sdpa:
                    values = F.scaled_dot_product_attention(
                        q[:, begin:end],
                        all_k,
                        all_v,
                        attn_mask=permitted,
                        dropout_p=0.0,
                        is_causal=False,
                    )
                else:
                    scores = q[:, begin:end] @ all_k.transpose(-1, -2) / math.sqrt(width)
                    weights = scores.masked_fill(~permitted, -torch.inf).softmax(-1)
                    values = weights @ all_v
                readouts.append(values.transpose(0, 1).reshape(end - begin, heads * width))
                staged[identity][0].append(new_k.numpy().copy())
                staged[identity][1].append(new_v.numpy().copy())
            hidden = hidden + attention.out(torch.cat(readouts, dim=0))
            hidden = hidden + block.mlp(block.ln2(hidden))
        logits = self.model.head(self.model.norm(hidden))
        for identity, (keys, values) in staged.items():
            self.pool.append(identity, np.stack(keys), np.stack(values))
        self.pool.check_invariants()
        return {
            identity: logits[offsets[index] : offsets[index + 1]].clone()
            for index, identity in enumerate(identities)
        }


@torch.inference_mode()
def verify():
    torch.set_num_threads(1)
    torch.manual_seed(127)
    model = TinyLM(23, context=16, width=16, heads=4, layers=3).double().eval()
    reports = []
    histories = {"A": [1, 3, 5, 7, 9, 11], "B": [2, 4, 6, 8, 10]}
    schedules = [
        ({"A": [1, 3], "B": [2]}, {"B": [4, 6], "A": [5]}, {"A": [7, 9, 11], "B": [8, 10]}),
        ({"B": [2, 4, 6, 8, 10], "A": [1, 3, 5, 7, 9, 11]},),
    ]
    for sdpa in [False, True]:
        for schedule in schedules:
            decoder = PackedDecoder(model, sdpa=sdpa)
            for identity in histories:
                decoder.pool.create(identity)
            current = {identity: [] for identity in histories}
            errors = []
            for chunks in schedule:
                outputs = decoder.forward(chunks)
                for identity, ids in chunks.items():
                    start = len(current[identity])
                    current[identity].extend(ids)
                    full = model(torch.tensor([current[identity]]))[0, start:]
                    error = float((outputs[identity] - full).abs().max())
                    torch.testing.assert_close(outputs[identity], full, atol=1e-12, rtol=1e-12)
                    assert torch.equal(outputs[identity].argmax(-1), full.argmax(-1))
                    errors.append(
                        {
                            "id": identity,
                            "begin": start,
                            "rows": len(ids),
                            "max_absolute": error,
                        }
                    )
            reports.append(
                {
                    "sdpa": sdpa,
                    "chunks": schedule,
                    "errors": errors,
                    "cache": decoder.pool.snapshot(),
                }
            )
    # Change every A token: correctly segmented B must be exactly unaffected.
    observed = []
    for first in [[1, 3, 5], [17, 18, 19]]:
        decoder = PackedDecoder(model)
        for identity in ["A", "B"]:
            decoder.pool.create(identity)
        observed.append(decoder.forward({"A": first, "B": [2, 4]})["B"])
    assert torch.equal(*observed)
    # Actual partial-prefix fork, then one private child update.
    decoder = PackedDecoder(model)
    decoder.pool.create("parent")
    decoder.forward({"parent": [1, 2, 3, 4, 5]})
    decoder.pool.fork("parent", "child", 4)
    parent = decoder.pool.dense("parent")
    child = decoder.forward({"child": [7]})["child"]
    expected = model(torch.tensor([[1, 2, 3, 4, 7]]))[0, -1:]
    torch.testing.assert_close(child, expected, atol=1e-12, rtol=1e-12)
    for actual, before in zip(decoder.pool.dense("parent"), parent):
        np.testing.assert_array_equal(actual, before)
    before = decoder.pool.snapshot()
    try:
        decoder.forward({"child": [1] * 20})
        raise AssertionError("Expected context overflow.")
    except ValueError:
        assert decoder.pool.snapshot() == before
    return {
        "comparisons": reports,
        "cross_request_isolation": "exact",
        "partial_fork_max_error": float((child - expected).abs().max()),
        "context_rejection_atomic": True,
        "tolerance": {"atol": 1e-12, "rtol": 1e-12},
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
