"""A guarded frozen-reference cache; policy updates do not invalidate it.

python -B reference_cache.py --output reference-cache-results.json
Requires torch and the local scratch/scoring helpers. This is a no-fit experiment.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import torch
from causal_backbone import TinyLM
from scratch_dpo import TOKENS, comparison_batch, digest_model, fixture, frozen_copy, model_scores
from response_scores import pair_loss


def digest_json(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def cache_key(reference, batch, pair_ids, tokenizer_identity, template_identity):
    if reference.training or any(parameter.requires_grad for parameter in reference.parameters()):
        raise ValueError("Cache only an evaluation-mode reference with disabled gradients")
    if len(pair_ids) * 2 != len(batch["input_ids"]) or len(set(pair_ids)) != len(pair_ids):
        raise ValueError("Unique pair identities must match chosen-first/rejected-second rows")
    return {"reference_weights": digest_model(reference), "pair_order": pair_ids,
            "tokenizer_identity": tokenizer_identity, "template_identity": template_identity,
            "batch_sha256": digest_json({key: value.tolist() for key, value in batch.items()}),
            "scoring": "causal shift once; genuine response sum; chosen rows then rejected rows"}


def build_cache(reference, batch, pair_ids, tokenizer_identity, template_identity):
    key = cache_key(reference, batch, pair_ids, tokenizer_identity, template_identity)
    with torch.no_grad():
        scores = model_scores(reference, batch)["sums"].tolist()
    return {"key": key, "scores": scores, "scores_sha256": digest_json(scores)}


def read_cache(cache, reference, batch, pair_ids, tokenizer_identity, template_identity, dtype):
    expected = cache_key(reference, batch, pair_ids, tokenizer_identity, template_identity)
    if expected != cache["key"] or digest_json(cache["scores"]) != cache["scores_sha256"]:
        raise ValueError("Reference cache inputs or stored scores changed; recompute explicitly")
    if len(cache["scores"]) != len(batch["input_ids"]):
        raise ValueError("Cached score count differs from the batch")
    return torch.tensor(cache["scores"], dtype=dtype, device=batch["input_ids"].device)


def run():
    torch.set_num_threads(2)
    torch.manual_seed(47)
    _, _, comparisons = fixture()
    batch = comparison_batch(comparisons)
    model = TinyLM(len(TOKENS), context=16, width=32, heads=2, layers=2)
    reference = frozen_copy(model)
    identities = {"pair_ids": list(range(len(comparisons))),
                  "tokenizer_identity": digest_json(TOKENS),
                  "template_identity": "constructed explicit IDs; BOS instruction country"}
    cache = build_cache(reference, batch, **identities)
    checks = []

    def parity(policy):
        twin = copy.deepcopy(policy)
        left = model_scores(policy, batch)["sums"]
        right = model_scores(twin, batch)["sums"]
        with torch.no_grad():
            uncached = model_scores(reference, batch)["sums"]
        cached = read_cache(cache, reference, batch, **identities, dtype=left.dtype)
        cached_loss, _, _ = pair_loss(left, cached, len(comparisons))
        direct_loss, _, _ = pair_loss(right, uncached, len(comparisons))
        cached_loss.backward()
        direct_loss.backward()
        differences = [(a.grad - b.grad).abs().max().item()
                       for a, b in zip(policy.parameters(), twin.parameters())]
        assert torch.equal(cached, uncached)
        assert cached_loss.item() == direct_loss.item()
        assert max(differences) == 0
        policy.zero_grad(set_to_none=True)
        return {"cached_loss": cached_loss.item(), "uncached_loss": direct_loss.item(),
                "max_gradient_difference": max(differences)}

    initial = parity(model)
    checks.append("same-state cached and direct loss/gradient agree")
    with torch.no_grad():
        model.head.weight[7, 0] += .1
    changed_policy = parity(model)
    checks.append("changed policy retains a valid frozen-reference cache")
    cases = []
    changed_reference = frozen_copy(reference)
    with torch.no_grad():
        changed_reference.head.weight[7, 0] += .1
    cases.append((cache, changed_reference, batch, identities, "reference weights"))
    for field in ("tokenizer_identity", "template_identity"):
        modified = {**identities, field: identities[field] + " changed"}
        cases.append((cache, reference, batch, modified, field))
    modified = {**identities, "pair_ids": identities["pair_ids"][::-1]}
    cases.append((cache, reference, batch, modified, "pair order"))
    for field in ("input_ids", "completion_mask", "attention_mask"):
        changed_batch = {key: value.clone() for key, value in batch.items()}
        if field == "input_ids":
            changed_batch[field][0, 1] = 4
        else:
            changed_batch[field][0, -1] = ~changed_batch[field][0, -1]
        cases.append((cache, reference, changed_batch, identities, field))
    broken_scores = copy.deepcopy(cache)
    broken_scores["scores"][0] += .1
    cases.append((broken_scores, reference, batch, identities, "score bytes"))
    for stored, ref, rows, identity, description in cases:
        try:
            read_cache(stored, ref, rows, **identity, dtype=torch.float32)
        except ValueError:
            checks.append("invalidated by " + description)
        else:
            raise AssertionError("Stale cache accepted: " + description)
    assert all(parameter.grad is None for parameter in reference.parameters())
    return {"kind": "local exact reference cache; no fitting; no claim about an external cache implementation",
            "cache": cache, "initial": initial, "changed_policy": changed_policy, "checks": checks}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("reference-cache-results.json"))
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checks": len(result["checks"]), "initial": result["initial"],
                      "changed_policy": result["changed_policy"]}, indent=2))


if __name__ == "__main__":
    main()
