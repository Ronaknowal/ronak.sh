"""Changed finite batching/storage exercise; no pretrained model or training.

Run: python serving_capstone.py
"""

import json
import numpy as np
import torch
from tiny_causal_lm import TinyLM
from packed_decoder import PackedDecoder
from serving_simulation import Request, simulate


@torch.inference_mode()
def verify():
    torch.set_num_threads(1)
    torch.manual_seed(211)
    model = TinyLM(29, context=20, width=16, heads=4, layers=2).double().eval()
    decoder = PackedDecoder(model, pages=16, page_size=4, sdpa=True)
    histories = {identity: [] for identity in ["A", "B", "C"]}
    for identity in histories:
        decoder.pool.create(identity)
    chunks = [
        {"C": [3, 8, 13], "A": [1, 6], "B": [2, 7]},
        {"B": [12, 17], "C": [18], "A": [11]},
        {"A": [16], "C": [], "B": [22]},
    ]
    errors = []
    for iteration in chunks:
        outputs = decoder.forward(iteration)
        for identity, tokens in iteration.items():
            start = len(histories[identity])
            histories[identity].extend(tokens)
            if not tokens:
                assert outputs[identity].shape == (0, 29)
                continue
            expected = model(torch.tensor([histories[identity]]))[0, start:]
            torch.testing.assert_close(outputs[identity], expected, atol=1e-12, rtol=1e-12)
            errors.append(float((outputs[identity] - expected).abs().max()))

    # B has five computed positions; fork three, then write in the shared tail.
    decoder.pool.fork("B", "child", 3)
    before_parent = decoder.pool.dense("B")
    actual = decoder.forward({"child": [9]})["child"]
    expected = model(torch.tensor([[2, 7, 12, 9]]))[0, -1:]
    torch.testing.assert_close(actual, expected, atol=1e-12, rtol=1e-12)
    for after, before in zip(decoder.pool.dense("B"), before_parent):
        np.testing.assert_array_equal(after, before)

    # A separate one-page decoder cannot append a fifth computed position.
    small = PackedDecoder(model, pages=1, page_size=4)
    small.pool.create("full")
    small.forward({"full": [1, 2, 3, 4]})
    before = small.pool.snapshot()
    try:
        small.forward({"full": [5]})
        raise AssertionError("Expected whole-batch allocation refusal.")
    except MemoryError:
        assert small.pool.snapshot() == before

    schedule = simulate(
        [Request("X", 0, 5, 4), Request("Y", 0.3, 2, 3), Request("Z", 0.5, 7, 2)],
        pages=6,
        page_size=3,
        budget=5,
        chunk=3,
        slots=2,
    )
    impossible = simulate([Request("large", 0, 7, 2)], pages=2, page_size=3)
    assert impossible["requests"]["large"]["status"] == "infeasible-next-row"
    for iteration in schedule["iterations"]:
        assert sum(work["rows"] for work in iteration["work"]) <= 5
        assert iteration["resident_pages"] <= 6
    for result in schedule["requests"].values():
        assert result["status"] == "finished"
        assert result["generated"] == result["cap"]
        assert result["useful_rows"] == result["prompt"] + result["cap"] - 1
    return {
        "max_absolute_logit_error": max(errors),
        "partial_fork_error": float((actual - expected).abs().max()),
        "empty_segment_shape": [0, 29],
        "atomic_refusal": True,
        "schedule": schedule,
        "infeasible": impossible,
    }


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
