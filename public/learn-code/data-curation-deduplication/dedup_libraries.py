"""Ordinary MinHashLSH and BloomFilter APIs, with exact confirmation.

Install: python -m pip install datasketch pybloom-live
Run beside corpus.jsonl, lexical_dedup.py and curation_records.py.
"""
import json
from itertools import combinations
from datasketch import MinHash, MinHashLSH
from pybloom_live import BloomFilter
from curation_records import load_records, comparison_key
from lexical_dedup import shingles, jaccard


def indexed_candidates(records, *, count=128, bands=32, rows=4, seed=17):
    if count != bands * rows:
        raise ValueError('Signature count must equal bands times rows')
    sets = {r['id']: shingles(r['text']) for r in records}
    index = MinHashLSH(num_perm=count, params=(bands, rows))
    signatures = {}
    for key, items in sets.items():
        if not items:
            continue
        mh = MinHash(num_perm=count, seed=seed)
        for item in sorted(items):
            mh.update(json.dumps(item, ensure_ascii=False).encode('utf-8'))
        signatures[key] = mh
        index.insert(key, mh)
    pairs = set()
    for key, mh in signatures.items():
        for other in index.query(mh):
            if key != other:
                pairs.add(tuple(sorted((key, other))))
    return sets, signatures, pairs


def confirmed_stream(records):
    bloom = BloomFilter(capacity=max(1, len(records)), error_rate=.01)
    exact = set()
    kept, removed = [], []
    for record in records:
        key = comparison_key(record['text'])
        seen = key in bloom and key in exact
        (removed if seen else kept).append(record['id'])
        if not seen:
            bloom.add(key)
            exact.add(key)
    return kept, removed


if __name__ == '__main__':
    records = load_records()
    sets, signatures, candidates = indexed_candidates(records)
    verified = [pair for pair in sorted(candidates) if jaccard(sets[pair[0]], sets[pair[1]]) >= .8]
    kept, removed = confirmed_stream(records)
    first = next(iter(signatures))
    print(json.dumps({'records': len(records), 'candidate_pairs': len(candidates),
                      'verified_pairs_at_point8': len(verified), 'exact_kept': len(kept),
                      'exact_removed': len(removed), 'self_estimate': signatures[first].jaccard(signatures[first])}, indent=2))
