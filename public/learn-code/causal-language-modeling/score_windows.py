"""Inspect an exact-once sliding-context score using a tiny random decoder.
Run: python score_windows.py  (PyTorch; keep tiny_causal_lm.py beside this file)
"""
import json
import math
import torch
import torch.nn.functional as F
from tiny_causal_lm import TinyLM, score


@torch.no_grad()
def score_each_target(model, ids):
    records = []
    for target in range(1, len(ids)):
        start = max(0, target - model.context)
        context = ids[start:target]
        logits = model(context[None, :])[0, -1]
        nll = F.cross_entropy(logits[None, :], ids[target:target + 1]).item()
        records.append({"target_position": target, "input_positions": list(range(start, target)), "nll": nll})
    total = sum(record["nll"] for record in records)
    return {"records": records, "sum": total, "count": len(records), "perplexity": math.exp(total / len(records)) if records else None}


def main():
    torch.set_num_threads(2)
    torch.manual_seed(5)
    model = TinyLM(8, context=4, width=8, heads=2, layers=1).eval()
    ids = torch.tensor([1, 2, 3, 4, 5, 6, 7])
    result = score_each_target(model, ids)
    batched = score(model, ids)
    torch.testing.assert_close(torch.tensor(result["sum"]), torch.tensor(batched["nll_sum"]))
    # For length <= context+1, all predictions also fit one parallel forward pass.
    short = ids[:5]
    logits = model(short[:-1][None, :])
    direct = F.cross_entropy(logits.reshape(-1, 8), short[1:], reduction="sum").item()
    sequential = score_each_target(model, short)["sum"]
    torch.testing.assert_close(torch.tensor(direct), torch.tensor(sequential))
    result["parallel_short_sum"] = direct
    result["sequential_short_sum"] = sequential
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
