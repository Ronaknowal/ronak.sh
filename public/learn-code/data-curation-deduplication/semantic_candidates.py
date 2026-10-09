"""Inspect a cosine-based decision on supplied vectors, independent of an encoder."""
import json
import math
import numpy as np


def normalize(rows):
    result = []
    width = len(rows[0]) if rows else 0
    for row in rows:
        if len(row) != width or not all(math.isfinite(x) for x in row):
            raise ValueError('Finite equal-width vectors required')
        length = math.sqrt(sum(x * x for x in row))
        if length == 0:
            raise ValueError('Cosine is undefined for a zero vector')
        result.append([x / length for x in row])
    return result


def greedy_representatives(ids, vectors, threshold=.9):
    """Keep first by stable ID; each removed item directly matches a kept item."""
    if len(ids) != len(vectors) or len(set(ids)) != len(ids) or not -1 <= threshold <= 1:
        raise ValueError('Unique aligned IDs and cosine threshold in [-1,1] required')
    unit = normalize(vectors)
    keep, removed = [], []
    for i in sorted(range(len(ids)), key=lambda j: ids[j]):
        match = next((j for j in keep if sum(a * b for a, b in zip(unit[i], unit[j])) >= threshold), None)
        if match is None:
            keep.append(i)
        else:
            removed.append({'id': ids[i], 'representative': ids[match],
                            'cosine': sum(a * b for a, b in zip(unit[i], unit[match]))})
    return {'kept': [ids[i] for i in keep], 'removed': removed}


def blocked_cosine(rows, block_size=64):
    """Yield score blocks without allocating an N-by-N matrix."""
    if block_size < 1:
        raise ValueError('Positive block size required')
    unit = np.asarray(normalize(rows), dtype=float)
    for start in range(0, len(unit), block_size):
        yield start, unit[start:start + block_size] @ unit.T


if __name__ == '__main__':
    # Deliberately constructed unit directions; no text model produced these.
    angles = [0, 20, 40, 110]
    vectors = [[math.cos(math.radians(a)), math.sin(math.radians(a))] for a in angles]
    result = greedy_representatives(['A', 'B', 'C', 'D'], vectors, .9)
    result['constructed_angles_degrees'] = angles
    result['numpy_cosines'] = [block.tolist() for _, block in blocked_cosine(vectors, 2)]
    print(json.dumps(result, indent=2))
