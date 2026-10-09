"""Derive inspectable pair evidence without replacing the preserved corpus audit."""
import hashlib
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
root = Path(__file__).resolve().parents[1]
public = root / 'public/learn-code/data-curation-deduplication'
sys.path.insert(0, str(public))
from curation_records import load_records, exact_groups, representative
from lexical_dedup import shingles, signature, candidate_pairs, jaccard

records = load_records(public / 'corpus.jsonl')
by_id = {r['id']: r for r in records}
saved = json.loads((public / 'audit-results.json').read_text(encoding='utf8'))
groups = exact_groups(records)
exact_rep = {i: representative(g['members'], records) for g in groups for i in g['members']}
sets = {i: shingles(by_id[i]['text']) for i in set(exact_rep.values())}
candidates = candidate_pairs({i: signature(s) for i, s in sets.items()})
cluster_rep = {i: representative(group, records) for group in saved['clusters'] for i in group}
assert len(candidates) == saved['candidate_pairs']
assert set(cluster_rep.values()) == set(saved['kept_ids'])

def record(i):
    retained = cluster_rep[exact_rep[i]]
    return {**by_id[i], 'exact_representative': exact_rep[i], 'retained_representative': retained,
            'disposition': 'kept' if i == retained else 'exact duplicate removed' if i != exact_rep[i] else 'verified-cluster member removed'}

pairs = []
def add(a, b):
    sa, sb = shingles(by_id[a]['text']), shingles(by_id[b]['text'])
    same = exact_rep[a] == exact_rep[b]
    candidate = not same and tuple(sorted((exact_rep[a], exact_rep[b]))) in candidates
    pairs.append({'id': a + ' / ' + b, 'a': record(a), 'b': record(b),
                  'shingles_a': len(sa), 'shingles_b': len(sb), 'intersection': len(sa & sb),
                  'union': len(sa | sb), 'jaccard': jaccard(sa, sb),
                  'containment_a_in_b': len(sa & sb)/len(sa) if sa else None,
                  'containment_b_in_a': len(sa & sb)/len(sb) if sb else None,
                  'collapsed_exact': same, 'candidate': candidate,
                  'verified': candidate and jaccard(sa, sb) is not None and jaccard(sa, sb) >= saved['threshold']})

for family in sorted({r['family'] for r in records}):
    original = family + '-original'
    if original not in by_id:
        continue
    for suffix in ['local-edit', 'excerpt', 'spacing', 'exact']:
        variant = family + '-' + suffix
        if variant in by_id:
            add(original, variant)
add('meaning-positive', 'meaning-negative')
add('train-17-original', 'heldout-01-original')
result = {'corpus_sha256': saved['corpus_sha256'], 'threshold': saved['threshold'], 'pairs': pairs,
          'source_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in [public/'corpus.jsonl', public/'audit-results.json', public/'curation_records.py', public/'lexical_dedup.py']}}
assert result['source_sha256']['corpus.jsonl'] == saved['corpus_sha256']
(public/'audit-inspector.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
print(json.dumps({'pairs':len(pairs),'candidates':len(candidates),'retained':len(set(cluster_rep.values()))}))
