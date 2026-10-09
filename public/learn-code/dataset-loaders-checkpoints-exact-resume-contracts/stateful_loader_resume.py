"""Restore the next ordered batches with TorchData's ordinary stateful loader.

Install torch torchdata. Run python stateful_loader_resume.py --workers 0
and optionally --workers 2. The dataset is deterministic; this program tests
ordered ID replay, not random transform state or distributed ranks.
"""
import argparse
import copy
import json

import torch
from torchdata.stateful_dataloader import StatefulDataLoader


def make_loader(workers):
    return StatefulDataLoader(torch.arange(17), batch_size=3, shuffle=True,
                              generator=torch.Generator().manual_seed(73),
                              num_workers=workers, snapshot_every_n_steps=1)


def run(workers):
    reference = [batch.tolist() for batch in make_loader(workers)]
    loader = make_loader(workers)
    iterator = iter(loader)
    prefix = [next(iterator).tolist() for _ in range(2)]
    state = copy.deepcopy(loader.state_dict())
    expected_tail = [batch.tolist() for batch in iterator]
    restored = make_loader(workers)
    restored.load_state_dict(state)
    actual_tail = [batch.tolist() for batch in restored]
    assert prefix + expected_tail == reference
    assert actual_tail == expected_tail
    assert sorted(item for batch in prefix + actual_tail for item in batch) == list(range(17))
    return {"workers": workers, "prefix": prefix, "restored_tail": actual_tail,
            "identical_ordered_tail": True, "unique_epoch_ids": 17,
            "scope": "Same loader configuration, CPU, deterministic map-style data; no cross-rank or random-transform claim"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, choices=[0, 2], default=0)
    print(json.dumps(run(parser.parse_args().workers), indent=2))
