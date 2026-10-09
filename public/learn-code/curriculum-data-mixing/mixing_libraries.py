"""Ordinary record-mixture APIs on the same offline inputs.

Requires datasets5.1, PyTorch2.14 and NumPy. Run: python mixing_libraries.py
These libraries sample RECORDS. The output also counts eligible byte targets.
"""
import json
from collections import Counter
from itertools import islice
from pathlib import Path
import datasets
import torch
from datasets import IterableDataset, interleave_datasets
from torch.utils.data import WeightedRandomSampler

ROOT = Path(__file__).resolve().parent


def summarize(records):
    counts, targets = Counter(), Counter()
    for record in records:
        counts[record["domain"]] += 1
        targets[record["domain"]] += record["eligible_targets"]
    return {"records": dict(counts), "targets": dict(targets),
            "record_count": sum(counts.values()), "target_count": sum(targets.values())}


def yield_records(records):
    yield from records


def stream_records(records):
    return IterableDataset.from_generator(yield_records, gen_kwargs={"records": records})


def fixture():
    return [stream_records([{"domain": "A", "id": f"A{i}", "eligible_targets": 2}
                             for i in range(2)]),
            stream_records([{"domain": "B", "id": f"B{i}", "eligible_targets": 8}
                             for i in range(4)])]


def main():
    sources = fixture()
    outputs = {}
    for policy in ("first_exhausted", "all_exhausted", "all_exhausted_without_replacement"):
        mixed = interleave_datasets(sources, probabilities=[.5, .5], seed=17,
                                    stopping_strategy=policy)
        records = list(mixed)
        outputs[policy] = {**summarize(records), "ids": [r["id"] for r in records]}
    all_records = list(sources[0]) + list(sources[1])
    # Each A record receives .5/2; each B record receives .5/4.
    # Domain size therefore does not accidentally multiply the intended share.
    lengths = [len(list(source)) for source in sources]
    weights = [.5 / lengths[0]] * lengths[0] + [.5 / lengths[1]] * lengths[1]
    sampler = WeightedRandomSampler(weights, num_samples=10000, replacement=True,
                                     generator=torch.Generator().manual_seed(17))
    outputs["torch_record_mixture"] = summarize(all_records[i] for i in sampler)
    corpus = json.loads((ROOT / "literary-domains.json").read_text(encoding="utf-8"))
    books = [stream_records([{"domain": d["id"], "id": p["id"],
                                "eligible_targets": max(len(p["text"].encode("utf-8")) - 1, 0)}
                               for p in d["paragraphs"] if p["split"] == "train"])
             for d in corpus["domains"]]
    # Iterable interleave avoids materializing the entire mixed collection.
    stream = interleave_datasets(books,
                                 probabilities=[1 / 3] * 3, seed=17,
                                 stopping_strategy="all_exhausted")
    outputs["real_equal_record_probabilities"] = summarize(islice(stream, 180))
    print(json.dumps({"datasets": datasets.__version__, "torch": torch.__version__,
                      "results": outputs}, indent=2))


if __name__ == "__main__":
    main()
