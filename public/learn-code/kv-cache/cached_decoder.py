"""Complete cached inference adapter for the unchanged prerequisite TinyLM.

Run: python cached_decoder.py
The adapter reuses every learned parameter. Its cache contains per-layer,
projected K/V; it never calls TinyLM's training entry point.
"""
import json
import math
import time
import torch
from tiny_causal_lm import TinyLM


class CachedDecoder:
    """Equal-length, unpadded batches within the learned position capacity.

    Create a fresh adapter or reset after changing weights or any prefix token.
    This is inference state, not a differentiable training cache. Do not mutate
    the referenced model's device, dtype or weights while a prefix is active.
    """

    def __init__(self, model, batch=1, capacity=None):
        if batch < 1:
            raise ValueError("batch must be positive")
        self.model = model.eval()
        self.batch = batch
        self.capacity = model.context if capacity is None else capacity
        if not 1 <= self.capacity <= model.context:
            raise ValueError("capacity must fit the learned position table")
        self.length = 0
        reference = model.token.weight
        width = reference.shape[1]
        self.layers = []
        for block in model.blocks:
            heads = block.attention.heads
            shape = (batch, heads, self.capacity, width // heads)
            self.layers.append((reference.new_empty(shape), reference.new_empty(shape)))

    @property
    def reserved_payload_bytes(self):
        return sum(a.numel() * a.element_size() for pair in self.layers for a in pair)

    @property
    def occupied_payload_bytes(self):
        return self.reserved_payload_bytes * self.length // self.capacity

    def reset(self):
        # Stale backing bytes need not be cleared: reads stop at self.length.
        self.length = 0

    @torch.inference_mode()
    def __call__(self, ids):
        if ids.ndim != 2 or ids.shape[0] != self.batch or ids.shape[1] == 0:
            raise ValueError("ids must be a nonempty (batch, chunk) tensor")
        if ids.dtype != torch.long or ids.device != self.model.token.weight.device:
            raise ValueError("ids must be int64 on the model device")
        if bool(((ids < 0) | (ids >= self.model.token.num_embeddings)).any()):
            raise ValueError("token ID is outside the vocabulary")
        begin, end = self.length, self.length + ids.shape[1]
        # Reject before writing any layer. No partial append on capacity error.
        if end > self.capacity:
            raise ValueError("append exceeds cache capacity; reset or use a larger context")
        positions = torch.arange(begin, end, device=ids.device)
        hidden = self.model.token(ids) + self.model.position(positions)
        allowed = torch.arange(end, device=ids.device)[None, :] <= positions[:, None]
        for block, (key_store, value_store) in zip(self.model.blocks, self.layers):
            batch, length, width = hidden.shape
            heads = block.attention.heads
            head_width = width // heads
            projected = block.attention.qkv(block.ln1(hidden)).chunk(3, dim=-1)
            q, k, v = [a.reshape(batch, length, heads, head_width).transpose(1, 2)
                       for a in projected]
            key_store[:, :, begin:end] = k
            value_store[:, :, begin:end] = v
            scores = q @ key_store[:, :, :end].transpose(-2, -1) / math.sqrt(head_width)
            weights = scores.masked_fill(~allowed, float("-inf")).softmax(dim=-1)
            attended = weights @ value_store[:, :, :end]
            merged = attended.transpose(1, 2).contiguous().reshape(batch, length, width)
            hidden = hidden + block.attention.out(merged)
            hidden = hidden + block.mlp(block.ln2(hidden))
        logits = self.model.head(self.model.norm(hidden))
        self.length = end
        return logits


@torch.inference_mode()
def generate_cached(model, prompt, chunks, steps):
    """Greedy continuation after a chosen prefill chunk schedule; fixed step count.

    The last selected ID is not fed. This small CPU timer includes allocation,
    prefill and decode; use cache_study.py for the controlled pretrained study.
    """
    if steps < 1 or not chunks or min(chunks) < 1 or sum(chunks) != prompt.shape[1]:
        raise ValueError("Use positive steps and chunks covering the prompt exactly")
    if prompt.shape[1] + steps - 1 > model.context:
        raise ValueError("Processed IDs would exceed the learned position context")
    started = time.perf_counter_ns()
    decoder = CachedDecoder(model, batch=prompt.shape[0])
    begin = 0
    for length in chunks:
        logits = decoder(prompt[:, begin:begin+length])
        begin += length
    history = prompt.clone()
    for step in range(steps):
        next_id = logits[:, -1].argmax(-1, keepdim=True)
        history = torch.cat([history, next_id], dim=1)
        if step + 1 < steps:
            logits = decoder(next_id)
    elapsed = time.perf_counter_ns() - started
    return history, {"processed_length": decoder.length,
                     "occupied_bytes": decoder.occupied_payload_bytes,
                     "reserved_bytes": decoder.reserved_payload_bytes,
                     "elapsed_ns": elapsed}


def verify():
    torch.set_num_threads(2)
    torch.manual_seed(71)
    model = TinyLM(17, context=12, width=16, heads=4, layers=3).double().eval()
    ids = torch.tensor([[1, 4, 7, 2, 9, 3, 8, 5], [2, 2, 6, 1, 8, 4, 9, 0]])
    with torch.inference_mode():
        reference = model(ids)
    cases = []
    for chunks in ([8], [1] * 8, [3, 2, 3], [2, 5, 1]):
        decoder = CachedDecoder(model, batch=2, capacity=10)
        # Poison every unused location. Correct reads use the occupied prefix.
        for keys, values in decoder.layers:
            keys.fill_(123)
            values.fill_(-77)
        begin, pieces = 0, []
        for length in chunks:
            pieces.append(decoder(ids[:, begin:begin + length]))
            begin += length
        actual = torch.cat(pieces, dim=1)
        torch.testing.assert_close(actual, reference, atol=1e-12, rtol=1e-12)
        before = [(k.clone(), v.clone()) for k, v in decoder.layers]
        try:
            decoder(ids[:, :3])
        except ValueError:
            pass
        else:
            raise AssertionError("capacity error was not raised")
        assert decoder.length == 8
        for old, current in zip(before, decoder.layers):
            for a, b in zip(old, current):
                assert torch.equal(a, b)
        decoder.reset()
        edited = ids.clone()
        edited[:, 1] = 11
        with torch.inference_mode():
            edited_reference = model(edited)
        torch.testing.assert_close(decoder(edited), edited_reference, atol=1e-12, rtol=1e-12)
        cases.append({"chunks": chunks, "max_absolute_error": float((actual-reference).abs().max()),
                      "occupied_bytes": decoder.occupied_payload_bytes,
                      "reserved_bytes": decoder.reserved_payload_bytes})
    generated_cases = []
    expected = ids[:, :4].clone()
    with torch.inference_mode():
        for _ in range(5):
            next_id = model(expected)[:, -1].argmax(-1, keepdim=True)
            expected = torch.cat([expected, next_id], dim=1)
    for schedule in ([4], [1, 1, 1, 1], [1, 3]):
        generated, state = generate_cached(model, ids[:, :4], schedule, 5)
        assert torch.equal(generated, expected) and state["processed_length"] == 8
        generated_cases.append({"chunks": schedule, "ids": generated.tolist(), **state})
    return {"scope": "same random weights, no training", "cases": cases, "greedy_cases": generated_cases,
            "capacity_failure_atomic": True, "reset_after_edit_passed": True}


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
