"""Audit retrieval against exhaustive lexical truth, separately from policy labels.

Run: python audit_corpus.py --output audit-results.json
Quadratic exhaustive reference is deliberate on this small corpus only.
"""
import argparse
from collections import Counter
from hashlib import sha256
from itertools import combinations
import json
from pathlib import Path
from curation_records import load_records, exact_groups, representative
from lexical_dedup import shingles, signature, candidate_pairs, verified_edges, components, jaccard


def run(records, threshold=.8):
    groups = exact_groups(records)
    representatives = [representative(g['members'], records) for g in groups]
    by_id = {r['id']: r for r in records}
    sets = {key: shingles(by_id[key]['text']) for key in representatives}
    signatures = {key: signature(items) for key, items in sets.items()}
    candidates = candidate_pairs(signatures)
    edges = verified_edges(candidates, sets, threshold)
    truth = {tuple(sorted((a, b))) for a, b in combinations(sets, 2)
             if jaccard(sets[a], sets[b]) is not None and jaccard(sets[a], sets[b]) >= threshold}
    hits = candidates & truth
    clusters = components(sets, edges)
    kept = [representative(cluster, records) for cluster in clusters]
    families_before = Counter(r['family'] for r in records)
    families_after = Counter(by_id[key]['family'] for key in kept)
    cross_split_exact = [g['members'] for g in groups if len({by_id[i]['split'] for i in g['members']}) > 1]
    return {'record_count': len(records), 'exact_representatives': len(representatives),
            'candidate_pairs': len(candidates), 'exhaustive_positive_pairs': len(truth),
            'verified_pairs': len(edges), 'candidate_precision': len(hits)/len(candidates) if candidates else None,
            'candidate_recall': len(hits)/len(truth) if truth else None,
            'missed_pairs': sorted(truth - candidates), 'threshold': threshold,
            'kept_ids': kept, 'clusters': clusters,
            'short_ids': [key for key, items in sets.items() if not items],
            'families_before': dict(families_before), 'families_after': dict(families_after),
            'retained_split_counts': dict(Counter(by_id[key]['split'] for key in kept)),
            'cross_split_exact_groups': cross_split_exact,
            'interpretation': 'Precision and recall refer only to exact word-shingle Jaccard >= threshold. Family labels are construction provenance, not semantic duplicate truth.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    result = run(load_records())
    result['corpus_sha256'] = sha256(Path(__file__).with_name('corpus.jsonl').read_bytes()).hexdigest()
    output = json.dumps(result, indent=2) + '\n'
    if args.output:
        args.output.write_text(output, encoding='utf-8')
    print(output)
