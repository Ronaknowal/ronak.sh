"""Inspectable sampler, streaming shuffle, collation and PyTorch bridges.

Keep iris.csv beside this file. Run: python data_pipeline.py --workers 0
Use --workers 2 to exercise process-worker partitioning on your machine.
"""
import argparse
import csv
import json
import random
from pathlib import Path

import torch
from torch.utils.data import DataLoader, Dataset, IterableDataset, get_worker_info


def batches(indices, batch_size, drop_last=False):
    for start in range(0, len(indices), batch_size):
        batch = indices[start:start + batch_size]
        if len(batch) == batch_size or not drop_last:
            yield batch


def shuffle_buffer(source, size, seed):
    """Bounded-memory shuffle; uniform global permutation only if all items fit."""
    if size < 1:
        raise ValueError("buffer size must be positive")
    rng = random.Random(seed)
    buffer = []
    for item in source:
        if len(buffer) < size:
            buffer.append(item)
        else:
            slot = rng.randrange(len(buffer))
            yield buffer[slot]
            buffer[slot] = item
    rng.shuffle(buffer)
    yield from buffer


def pad_sequences(sequences, padding=0):
    if not sequences or any(len(sequence) == 0 for sequence in sequences):
        raise ValueError("provide a nonempty batch of nonempty sequences")
    width = max(map(len, sequences))
    values = torch.full((len(sequences), width), padding, dtype=torch.long)
    mask = torch.zeros_like(values, dtype=torch.bool)
    for row, sequence in enumerate(sequences):
        values[row, :len(sequence)] = torch.tensor(sequence)
        mask[row, :len(sequence)] = True
    return values, mask


class FlowerRows(Dataset):
    def __init__(self, features, targets, ids):
        self.features, self.targets, self.ids = features, targets, ids

    def __len__(self):
        return len(self.ids)

    def __getitem__(self, index):
        return self.features[index], self.targets[index], self.ids[index]


class RowStream(IterableDataset):
    def __init__(self, count, rank=0, world_size=1):
        self.count, self.rank, self.world_size = count, rank, world_size

    def __iter__(self):
        worker = get_worker_info()
        workers = worker.num_workers if worker else 1
        worker_id = worker.id if worker else 0
        owner = self.rank * workers + worker_id
        total = self.world_size * workers
        for row_id in range(self.count):
            if row_id % total == owner:
                yield row_id


def main(workers):
    torch.set_num_threads(1)
    with Path(__file__).with_name("iris.csv").open(newline="", encoding="utf8") as handle:
        reader = csv.reader(handle)
        next(reader)
        records = [[float(value) for value in row] for row in reader]
    values = torch.tensor(records, dtype=torch.float64)
    ids, targets, features = values[:, 0].long(), values[:, -1].long(), values[:, 1:5]
    train = ids.remainder(5).ne(0)
    mean, scale = features[train].mean(0), features[train].std(0, correction=0)
    transformed = (features - mean) / scale
    dataset = FlowerRows(transformed[train], targets[train], ids[train])
    order = torch.randperm(len(dataset), generator=torch.Generator().manual_seed(7)).tolist()
    expected = [torch.stack([dataset[index][2] for index in batch]).tolist()
                for batch in batches(order, 17)]
    loader = DataLoader(dataset, batch_sampler=list(batches(order, 17)), num_workers=workers)
    actual = [row_ids.tolist() for _, _, row_ids in loader]
    assert actual == expected
    assert len({row_id for batch in actual for row_id in batch}) == 120
    stream = list(DataLoader(RowStream(13), batch_size=None, num_workers=workers))
    assert sorted(stream) == list(range(13))
    source = list(range(13))
    shuffled = list(shuffle_buffer(iter(source), size=4, seed=5))
    assert sorted(shuffled) == source and shuffled == list(shuffle_buffer(iter(source), 4, 5))
    sequences = [[5, 6], [7, 8, 9, 2], [4]]
    padded, mask = pad_sequences(sequences)
    reference = torch.nn.utils.rnn.pad_sequence([torch.tensor(row) for row in sequences], batch_first=True)
    torch.testing.assert_close(padded, reference)
    assert mask.sum().item() == 7 and padded.numel() == 12
    print(json.dumps({"training_rows": len(dataset), "validation_rows": int((~train).sum()),
                      "batch_sizes": [len(batch) for batch in actual], "first_batch_ids": actual[0],
                      "train_mean_after_scaling": transformed[train].mean(0).tolist(),
                      "stream_unique_rows": len(stream), "padding_cells": 5,
                      "buffer_shuffle": shuffled, "workers": workers}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, choices=[0, 1, 2, 4], default=0)
    main(parser.parse_args().workers)
