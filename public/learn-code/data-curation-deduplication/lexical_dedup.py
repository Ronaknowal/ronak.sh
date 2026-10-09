"""Stable shingles, MinHash candidates, exact rechecks and components."""
from collections import defaultdict
from hashlib import blake2b
from itertools import combinations
import json
import math
import re
from curation_records import comparison_key, load_records


def shingles(text, width=3):
    if not isinstance(width, int) or width < 1:
        raise ValueError('Shingle width must be a positive integer')
    words = re.findall(r"[^\W_]+(?:['’][^\W_]+)*", comparison_key(text, fold_case=True))
    return {tuple(words[i:i + width]) for i in range(len(words) - width + 1)}


def jaccard(a, b):
    union = a | b
    return len(a & b) / len(union) if union else None


def containment(a, b):
    return len(a & b) / len(a) if a else None


def signature(items, count=128, seed=17):
    """Practical seeded 64-bit hashes; empty sets have no signature."""
    if count < 1 or seed < 0:
        raise ValueError('Positive count and nonnegative seed required')
    if not items:
        return None
    encoded = [json.dumps(item, ensure_ascii=False, separators=(',', ':')).encode('utf-8') for item in items]
    result = []
    for index in range(count):
        key = f'{seed}:{index}'.encode('ascii')
        result.append(min(int.from_bytes(blake2b(item, key=key, digest_size=8).digest(), 'big') for item in encoded))
    return tuple(result)


def estimated_jaccard(a, b):
    if a is None or b is None:
        return None
    if not a or len(a) != len(b):
        raise ValueError('Nonempty signatures of equal length required')
    return sum(x == y for x, y in zip(a, b)) / len(a)


def candidate_pairs(signatures, bands=32, rows=4, max_bucket=10000):
    """Full tuple keys preserve equality; band index prevents cross-band hits."""
    if bands < 1 or rows < 1:
        raise ValueError('Positive band and row counts required')
    buckets = defaultdict(list)
    for doc_id, sig in sorted(signatures.items()):
        if sig is None:
            continue
        if len(sig) != bands * rows:
            raise ValueError('Signature length must equal bands times rows')
        for band in range(bands):
            buckets[(band, sig[band * rows:(band + 1) * rows])].append(doc_id)
    pairs = set()
    for members in buckets.values():
        if len(members) > max_bucket:
            raise ValueError('Oversized bucket: repartition or explicitly revise policy; no silent recall loss')
        pairs.update(combinations(members, 2))
    return pairs


def verified_edges(pairs, sets, threshold):
    if not 0 <= threshold <= 1:
        raise ValueError('Threshold must lie in [0,1]')
    return [(a, b, score) for a, b in sorted(pairs)
            if (score := jaccard(sets[a], sets[b])) is not None and score >= threshold]


def components(ids, edges):
    parent = {i: i for i in ids}

    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for a, b, *_ in edges:
        ra, rb = root(a), root(b)
        parent[max(ra, rb)] = min(ra, rb)
    groups = defaultdict(list)
    for i in sorted(ids):
        groups[root(i)].append(i)
    return sorted(groups.values())


def match_probability(similarity, bands, rows):
    if not 0 <= similarity <= 1 or bands < 1 or rows < 1:
        raise ValueError('Similarity in [0,1] and positive bands/rows required')
    return 1 - (1 - similarity ** rows) ** bands


def half_probability(bands, rows):
    return (1 - 2 ** (-1 / bands)) ** (1 / rows)


if __name__ == '__main__':
    records = load_records()
    sets = {r['id']: shingles(r['text']) for r in records}
    signatures = {i: signature(s) for i, s in sets.items()}
    pairs = candidate_pairs(signatures)
    edges = verified_edges(pairs, sets, .7)
    print(json.dumps({'candidate_pairs': sorted(pairs), 'verified_edges': edges,
                      'components': components(sets, edges),
                      'p_match_half_similarity_32x4': match_probability(.5, 32, 4),
                      'half_probability_32x4': half_probability(32, 4),
                      'se_at_j_half_k128': math.sqrt(.25 / 128)}, indent=2))
