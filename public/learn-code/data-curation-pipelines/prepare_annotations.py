"""Collect a bounded, auditable teacher-labelled corpus before fitting anything.

Run with Python 3.12+: python -B -X utf8 prepare_annotations.py --output ./annotations
Download lexical_dedup.py and curation_records.py from the preceding deduplication
lesson into this directory, or pass their directory with --dedup-directory.
Raw text stays in the caller's local output; do not publish it as lesson assets.
"""
import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import importlib
import json
from pathlib import Path
import sys
import time
import urllib.parse
import urllib.request

DATASET = 'HuggingFaceFW/fineweb-edu-llama3-annotations'
REVISION = '72df4c92fb1b48beceb16016e8f695ec40a6c3a5'
ROWS = 467424
OFFSETS = [i * (ROWS - 100) // 19 for i in range(20)]
PROTOCOL = {
    'dataset': DATASET, 'expected_revision': REVISION, 'offsets': OFFSETS,
    'window': 100, 'prefix_characters': 1000, 'positive_integer_score_at_least': 3,
    'group_edges': ['same nonempty lowercase hostname without leading www.',
                    'exact NFC/casefold/whitespace normalized prefix',
                    'exact Jaccard >= 0.8 over normalized 3-word shingles'],
    'near_duplicate_search': 'all pairs with length-ratio upper bound; no missed LSH candidates',
    'group_identity': 'SHA256 of newline-joined sorted zero-padded source row IDs',
    'split': 'first 8 digest bytes as big-endian integer modulo 10: 0..5 train,6..7 tune,8..9 final',
    'sample_kind': '20 deterministic coverage windows; not IID web sampling',
    'missing_host': 'no host edge; exact and near-duplicate edges still apply',
    'normalization_owner': 'preceding lesson curation_records.py and lexical_dedup.py',
}


def digest(value):
    return sha256(value).hexdigest()


def fetch_json(url, target):
    if target.exists():
        raw = target.read_bytes()
    else:
        for attempt in range(4):
            try:
                with urllib.request.urlopen(url, timeout=60) as response:
                    raw = response.read()
                target.write_bytes(raw)
                break
            except (OSError, TimeoutError):
                if attempt == 3:
                    raise
                time.sleep(2 ** attempt)
    return json.loads(raw), {'url': url, 'sha256': digest(raw), 'cache_file': target.name}


def collect(output):
    cache = output / 'responses'
    cache.mkdir(exist_ok=True)
    meta_url = f'https://huggingface.co/api/datasets/{DATASET}'
    before, first_receipt = fetch_json(meta_url, cache / 'revision-before.json')
    if before['sha'] != REVISION:
        raise ValueError('Dataset revision changed; revise the prospective protocol before fitting')

    def window(offset, length=100):
        url = 'https://datasets-server.huggingface.co/rows?' + urllib.parse.urlencode({
            'dataset': DATASET, 'config': 'default', 'split': 'train',
            'offset': offset, 'length': length,
        })
        data, receipt = fetch_json(url, cache / f'rows-{offset}-{length}.json')
        if len(data['rows']) != length or data['num_rows_total'] != ROWS:
            raise ValueError('Unexpected API row count')
        records, receipts = [], [receipt]
        for expected, item in enumerate(data['rows'], offset):
            if item['row_idx'] != expected:
                raise ValueError('Source row ordering changed')
            row = item['row']
            prefix = row['text'][:1000]
            truncated = item.get('truncated_cells', [])
            # The API can truncate long cells. A complete teacher prefix and its
            # occurrence in the supplied prompt are necessary; full pages are not.
            inadequate = ('text' in truncated and len(prefix) < 1000) or prefix not in row['prompt']
            if inadequate and length > 1:
                more_records, more_receipts = window(expected, 1)
                records.extend(more_records)
                receipts.extend(more_receipts)
                continue
            if inadequate or not prefix or not isinstance(row['score'], int) or not 0 <= row['score'] <= 5:
                raise ValueError(f'Incomplete or invalid teacher input at row {expected}')
            url_value = row['metadata']['url']
            host = (urllib.parse.urlsplit(url_value).hostname or '').lower()
            if host.startswith('www.'):
                host = host[4:]
            records.append({
                'id': f'{expected:06d}', 'source_row': expected, 'text': prefix,
                'text_sha256': digest(prefix.encode('utf-8')), 'url': url_value,
                'host': host, 'teacher_score': row['score'], 'label': int(row['score'] >= 3),
                'prefix_bytes': len(prefix.encode('utf-8')),
            })
        return records, receipts

    with ThreadPoolExecutor(max_workers=3) as executor:
        batches = list(executor.map(window, OFFSETS))
    # Fetch a fresh current metadata observation. The rows API does not provide a
    # revision pin, so retain before/after observations and every response digest.
    with urllib.request.urlopen(meta_url, timeout=60) as response:
        after_bytes = response.read()
    (cache / 'revision-after.json').write_bytes(after_bytes)
    if json.loads(after_bytes)['sha'] != REVISION:
        raise ValueError('Revision changed during collection')
    return [r for rows, _ in batches for r in rows], [first_receipt, *[
        receipt for _, receipts in batches for receipt in receipts
    ], {'url': meta_url, 'sha256': digest(after_bytes), 'cache_file': 'revision-after.json'}]


def split_records(records, helper_directory):
    sys.path.insert(0, str(helper_directory.resolve()))
    lexical = importlib.import_module('lexical_dedup')
    canonical = importlib.import_module('curation_records')
    ids = [r['id'] for r in records]
    if len(set(ids)) != len(ids):
        raise ValueError('Duplicate source IDs')
    edges = []
    buckets = defaultdict(list)
    for row in records:
        if row['host']:
            buckets[('host', row['host'])].append(row['id'])
        buckets[('exact', canonical.comparison_key(row['text'], fold_case=True))].append(row['id'])
    for members in buckets.values():
        edges.extend((members[0], other) for other in members[1:])
    sets = {row['id']: lexical.shingles(row['text'], width=3) for row in records}
    near = []
    for i, left in enumerate(ids):
        a = sets[left]
        if not a:
            continue
        for right in ids[i + 1:]:
            b = sets[right]
            if not b or min(len(a), len(b)) / max(len(a), len(b)) < .8:
                continue
            score = lexical.jaccard(a, b)
            if score >= .8:
                near.append((left, right, score))
    edges.extend(near)
    groups = lexical.components(ids, edges)
    assignments = {}
    for members in groups:
        identity = digest('\n'.join(sorted(members)).encode('utf-8'))
        bucket = int(identity[:16], 16) % 10
        split = 'train' if bucket < 6 else 'tune' if bucket < 8 else 'final'
        for identifier in members:
            assignments[identifier] = {'group': identity, 'split': split}
    result = [{**row, **assignments[row['id']]} for row in records]
    counts = Counter((r['split'], r['label']) for r in result)
    if any(counts[split, label] == 0 for split in ['train', 'tune', 'final'] for label in [0, 1]):
        raise ValueError(f'Degenerate prospective split, do not fit: {counts}')
    return result, {'groups': len(groups), 'largest_group': max(map(len, groups)),
                    'verified_near_pairs': near, 'split_class_counts': {f'{s}:{y}': n for (s, y), n in sorted(counts.items())},
                    'helper_sha256': {name: digest((helper_directory / name).read_bytes())
                                      for name in ['lexical_dedup.py', 'curation_records.py']}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--dedup-directory', type=Path, default=Path(__file__).parent)
    parser.add_argument('--local-jsonl', type=Path, help='Already collected record schema; no network')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    protocol_file = args.output / 'protocol.json'
    encoded = json.dumps(PROTOCOL, indent=2) + '\n'
    if protocol_file.exists() and protocol_file.read_text(encoding='utf-8') != encoded:
        raise ValueError('Output belongs to another protocol; use a new directory')
    protocol_file.write_text(encoded, encoding='utf-8')
    if args.local_jsonl:
        records = [json.loads(line) for line in args.local_jsonl.read_text(encoding='utf-8').splitlines() if line.strip()]
        receipts = [{'local': str(args.local_jsonl), 'sha256': digest(args.local_jsonl.read_bytes())}]
    else:
        records, receipts = collect(args.output)
    rows, audit = split_records(records, args.dedup_directory)
    (args.output / 'records.jsonl').write_text(''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in rows), encoding='utf-8')
    report = {'protocol_sha256': digest(encoded.encode()), 'records': len(rows), 'requests': receipts, **audit}
    (args.output / 'collection.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: report[k] for k in ['records', 'groups', 'largest_group', 'split_class_counts']}))


if __name__ == '__main__':
    main()
