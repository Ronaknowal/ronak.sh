"""Native evidence for the Vocabulary Design lesson; invoke with its library runtime."""
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/learn-code/vocabulary-design-multilingual-tokenization'
BPE = ROOT / 'public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram'
sys.path[:0] = [str(ASSETS), str(BPE)]
from vocabulary_audit import apportion, audit_documents, parallel_premium, sampling_distribution, weighted_word_counts
from multilingual_sentencepiece import experiment
from vocabulary_migration import extend_library_model, extend_rows
from subword_tokenizers import train_bpe
import numpy as np

def main():
    checks = []
    shares = sampling_distribution({'a': 9, 'b': 1}, .5)
    assert np.allclose(list(shares.values()), [.75, .25])
    assert apportion(shares, 12) == {'a': 9, 'b': 3}
    assert sampling_distribution({'a': 9, 'b': 0}, 0) == {'a': 1, 'b': 0}
    assert np.isclose(sum(sampling_distribution({'a': 1e300, 'b': 1e-300}, .5).values()), 1)
    for alpha in np.linspace(0, 1, 11):
        distribution = sampling_distribution({'a': 80, 'b': 15, 'c': 5}, float(alpha))
        assert np.isclose(sum(distribution.values()), 1)
        for total in [0, 1, 12, 30, 101]:
            counts = apportion(distribution, total)
            assert sum(counts.values()) == total
            assert all(abs(counts[key] - total * distribution[key]) < 1 + 1e-12 for key in counts)
    checks.append('Sampling null/support/log-range cases, independent 9:1 square-root derivation and 55 integer allocations')
    assert parallel_premium([18], [12]) == 1.5
    assert parallel_premium([5, 10], [1, 9]) == 1.5
    empty = audit_documents([''], list)
    assert empty['tokens_per_whitespace_unit'] is None and empty['bytes_per_token'] is None
    audit = audit_documents(['猫猫'], lambda text: list(text.encode('utf8')))
    assert audit['tokens'] == 6 and audit['codepoints'] == 2 and audit['utf8_bytes'] == 6
    checks.append('Metric denominator counterexample, ratio-of-sums, empty inputs and actual UTF-8 byte count')
    counts = weighted_word_counts({'a': ['solar panel solar'], 'b': ['solar cell cell']}, shares)
    assert np.allclose([counts['solar'], counts['panel'], counts['cell']], [7/12, 1/4, 1/6])
    model = train_bpe(counts, 6)
    assert model.decode(model.encode_word('solar')) == 'solar'
    excluded_shares = sampling_distribution({'a': 1, 'b': 0}, .5)
    excluded_counts = weighted_word_counts({'a': ['cat'], 'b': ['dog']}, excluded_shares)
    assert dict(excluded_counts) == {'cat': 1}
    excluded_model = train_bpe(excluded_counts, 2)
    assert excluded_model.decode(excluded_model.encode_word('cat')) == 'cat'
    assert 'd' not in excluded_model.alphabet
    try:
        weighted_word_counts({'a': ['']}, {'a': 1})
    except ValueError:
        pass
    else:
        raise AssertionError('A missing positive-share corpus must not silently lose mass')
    checks.append('Exact reused BPE composition, aggregate shared-word mass, zero-share exclusion, empty active corpus guard and reversible word encoding')
    original = np.array([[1., 0.], [0., 1.]])
    assert np.array_equal(extend_rows(original, 1), [[1, 0], [0, 1], [.5, .5]])
    migration = extend_library_model()
    assert migration['max_error'] < 1e-8 and migration['preserved_ids'] == [1, 2]
    assert migration['new_ids'] == [4] and migration['tied']
    checks.append('Scratch/library exact row extension, old-ID preservation, actual tied storage and changed softmax denominator')
    native = experiment()
    expected = [[1730, 2387, 1446], [1399, 1895, 1436], [1781, 2195, 1446], [1440, 1708, 1423]]
    records = json.loads((ASSETS / 'flores_tokenizer_sample.json').read_text(encoding='utf8'))
    sample_hash = hashlib.sha256((ASSETS / 'flores_tokenizer_sample.json').read_bytes()).hexdigest()
    assert sample_hash in (ASSETS / 'flores_sample_provenance.md').read_text(encoding='utf8')
    for row, token_counts in zip(native['experiments'], expected):
        assert row['actual_vocabulary'] == row['requested_vocabulary']
        for language, count in zip(['eng_Latn', 'hin_Deva', 'zho_Hans'], token_counts):
            audit = row['audit'][language]
            assert audit['tokens'] == count == sum(audit['lengths'])
            assert audit['unknown_tokens'] == 0 and audit['round_trip']
            assert audit['documents'] == 20
            assert audit['parallel_token_premium'] == count / token_counts[0]
            texts = [r['text'] for r in records if r['language'] == language and r['split'] == 'heldout']
            assert audit['utf8_bytes'] == sum(len(text.encode('utf8')) for text in texts)
    checks.append('Four native SentencePiece fits; held-out raw token totals, parallel ratios, byte counts, exact round trips and displayed results')
    files = [p for p in ASSETS.iterdir() if p.is_file()] + [BPE / 'subword_tokenizers.py', Path(__file__)]
    receipt = {'topic': 'vocabulary-design-multilingual-tokenization', 'checked_at': datetime.now(timezone.utc).isoformat(),
               'python': sys.version, 'versions': {name: importlib.metadata.version(name) for name in ['sentencepiece','numpy','torch','transformers','tokenizers']},
               'checks': checks, 'migration': migration, 'sentencepiece': native,
               'limits': 'CPU intrinsic tokenizer/row-migration experiments; no pretrained model quality, training benchmark, GPU or deployment timing claim.',
               'sources': {str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    output = ROOT / 'docs/teaching/tokenization/vocabulary-design-multilingual-tokenization/native-evidence.json'
    output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'checks': len(checks), 'native_designs': 4, 'receipt': str(output.relative_to(ROOT))}))

if __name__ == '__main__':
    main()
