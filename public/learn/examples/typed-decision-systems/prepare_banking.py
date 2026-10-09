"""Prepare a source-pinned, four-way BANKING77 subset without model outcomes.

python prepare_banking.py --source-dir raw --output data
Place official train.csv and test.csv in raw first; exact hashes are required.
CC BY 4.0 source: PolyAI-LDN/task-specific-datasets, revision below.
"""
import argparse
import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

REVISION = '57ec275d8078af65b7731c2a98be812d844a6d6b'
SOURCE_HASHES = {
    'train': 'b06e26ac675513959a63135f11b94ea7786ed02da65db93a5650d8838cbc664b',
    'test': 'd12d6e3bc4c3103966ae786dc435913c0c563dfa328f5a3646d0e62cfeeb474d',
}
QUESTION = 'What is the customer asking about?'
OPTIONS = [
    {'id': 'card_arrival', 'description': 'card has not arrived or is missing in the post'},
    {'id': 'card_delivery_estimate', 'description': 'how long delivery of a new card takes'},
    {'id': 'card_linking', 'description': 'link or add an existing card to this account'},
    {'id': 'card_not_working', 'description': 'card does not work when trying to use it'},
    {'id': 'lost_or_stolen_card', 'description': 'a received card was lost or stolen'},
    {'id': 'card_payment_not_recognised', 'description': 'a card payment was not made or recognised by the customer'},
]
SEED = 20261008


def digest(data):
    return hashlib.sha256(data).hexdigest()


def normalized(text):
    return ' '.join(unicodedata.normalize('NFKC', text).casefold().split())


def tokens(text):
    return re.findall('[a-z]+', text.lower())


def sequence_length(state):
    # Exact project encode: CLS question SEP, six OPTION description SEP,
    # then state SEP. External option IDs are not encoded by the scratch model.
    return (2 + len(tokens(QUESTION)) +
            sum(2 + len(tokens(option['description'])) for option in OPTIONS) +
            len(tokens(state)) + 1)


def prepare(source_dir):
    labels = [option['id'] for option in OPTIONS]
    eligible = {'train': {name: [] for name in labels},
                'test': {name: [] for name in labels}}
    counts, removed, seen = Counter(), [], {}
    for split in ['train', 'test']:
        source = source_dir / f'{split}.csv'
        if digest(source.read_bytes()) != SOURCE_HASHES[split]:
            raise ValueError(f'{source}: expected pinned original bytes')
        with source.open(encoding='utf-8', newline='') as stream:
            reader = csv.DictReader(stream)
            if reader.fieldnames != ['text', 'category']:
                raise ValueError('unexpected CSV schema')
            for index, row in enumerate(reader):
                label, state = row['category'], row['text']
                identity = f'{split}:{index}'  # Zero-based data row, header excluded.
                key = normalized(state)
                prior = seen.get(key)
                if prior is None:
                    seen[key] = identity
                if label not in labels:
                    continue
                counts[f'{split}:{label}:raw'] += 1
                reason = ('duplicate' if prior is not None else
                          'no_ascii_word' if not tokens(state) else
                          'non_ascii' if not state.isascii() else
                          'length' if sequence_length(state) > 128 else None)
                if reason:
                    removed.append({'id': identity, 'label': label, 'reason': reason,
                                    'prior_id': prior, 'tokens': sequence_length(state)})
                    continue
                eligible[split][label].append({
                    'id': identity, 'state': state, 'question': QUESTION,
                    'options': OPTIONS, 'target': labels.index(label), 'label': label,
                    'source_split': split, 'source_row': index,
                    'text_sha256': digest(state.encode('utf-8')),
                    'normal_sha256': digest(key.encode('utf-8')),
                    'tokens': sequence_length(state),
                })
                counts[f'{split}:{label}:eligible'] += 1
    result = {role: [] for role in ['train', 'dev', 'calibration', 'test']}
    for label in labels:
        train = sorted(eligible['train'][label], key=lambda r: digest(f'{SEED}:{r["id"]}'.encode()))
        test = sorted(eligible['test'][label], key=lambda r: digest(f'{SEED}:{r["id"]}'.encode()))
        if len(train) < 70 or len(test) < 20:
            raise ValueError(f'insufficient eligible data for {label}: {len(train)}/{len(test)}; '
                             'amend protocol before fitting, never borrow test examples')
        for role, rows in [('train', train[:40]), ('dev', train[40:50]),
                           ('calibration', train[50:70]), ('test', test[:20])]:
            result[role].extend(rows)
    identities = [r['id'] for rows in result.values() for r in rows]
    texts = [r['normal_sha256'] for rows in result.values() for r in rows]
    assert len(identities) == len(set(identities)) == 540
    assert len(set(texts)) == 540
    return result, {'revision': REVISION, 'seed': SEED, 'source_hashes': SOURCE_HASHES,
                    'counts': dict(counts), 'removed': removed,
                    'roles': {k: len(v) for k, v in result.items()},
                    'deduplication': 'NFKC, casefold, whitespace collapse; original train precedence across all77 labels',
                    'limits': 'Six preselected intents; exact text deduplication does not detect paraphrase leakage.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError('Choose a fresh output folder to preserve prepared data.')
    rows, report = prepare(args.source_dir)
    args.output.mkdir(parents=True)
    for name, value in [('banking.json', rows), ('data-report.json', report)]:
        (args.output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report['roles']))


if __name__ == '__main__':
    main()
