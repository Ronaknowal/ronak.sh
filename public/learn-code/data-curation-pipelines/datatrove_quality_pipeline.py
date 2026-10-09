"""Complete local DataTrove policy with exclusion writers and ID accounting.

Install datatrove orjson numpy. Run with UTF-8 and a NEW output directory:
python -B -X utf8 datatrove_quality_pipeline.py --output ./quality-run
Optional --model ./curator-run/model.json uses the fitted linear curator.
Otherwise the four explicitly supplied scores illustrate policy plumbing only.
The separate canonical datatrove_pipeline.py owns four-stage MinHash deduplication.
"""
import argparse
import gzip
import importlib.metadata
import json
import locale
from pathlib import Path
from datatrove.executor.local import LocalPipelineExecutor
from datatrove.pipeline.filters.base_filter import BaseFilter
from datatrove.pipeline.readers import JsonlReader
from datatrove.pipeline.writers import JsonlWriter
from curation_signals import signals, pipeline

RECORDS = [
    {'id': 'A', 'text': 'A pendulum exchanges potential and kinetic energy.\nThe period increases with its length.', 'score': .85},
    {'id': 'B', 'text': 'Catalogue\nBrass pendulum\nLength 30 cm', 'score': .35},
    {'id': 'C', 'text': 'Home contact subscribe\nHome contact subscribe\nHome contact subscribe', 'score': .9},
    {'id': 'D', 'text': 'Conjugate gradients use A-orthogonal search directions.\nA must be symmetric positive definite.', 'score': .7},
]


class RepetitionFilter(BaseFilter):
    name = 'Declared repeated-character policy'

    def __init__(self, maximum, **kwargs):
        super().__init__(**kwargs)
        self.maximum = maximum

    def filter(self, doc):
        measured = signals(doc.text)
        doc.metadata['signals'] = measured
        share = measured['duplicate_character_share']
        return (share is not None and share <= self.maximum), 'repetition_or_empty'


class ScoreFilter(BaseFilter):
    name = 'Declared scalar-score threshold'

    def __init__(self, threshold, **kwargs):
        super().__init__(**kwargs)
        self.threshold = threshold

    def filter(self, doc):
        return doc.metadata['score'] >= self.threshold, 'curator_score'


def read_ids(directory):
    rows = []
    for filename in sorted(directory.glob('**/*.jsonl*')):
        opener = gzip.open if filename.suffix == '.gz' else open
        with opener(filename, 'rt', encoding='utf-8') as stream:
            rows.extend(json.loads(line) for line in stream if line.strip())
    return rows


def run(output, model_file=None, threshold=.5):
    if locale.getpreferredencoding(False).lower().replace('-', '') != 'utf8':
        raise RuntimeError('Use python -X utf8 for the library reader')
    output = output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    records = [dict(row) for row in RECORDS]
    score_source = 'Explicitly supplied plumbing example; not learned quality'
    if model_file:
        from linear_curator import load_model, sigmoid
        features, weights, bias = load_model(model_file)
        scores = sigmoid(features.transform([r['text'] for r in records]) @ weights + bias)
        for row, score in zip(records, scores):
            row['score'] = float(score)
        score_source = f'Loaded linear curator: {model_file.name}'
    # The ordinary JSONL reader drops empty text; explicitly quarantine it before
    # this reader instead of pretending its filter will observe missing rows.
    quarantine = [r for r in records if not r['text'].strip()]
    eligible = [r for r in records if r['text'].strip()]
    source = output / 'input'
    source.mkdir()
    # File-level partition: two real shards, not two workers replaying one list.
    for shard in range(2):
        (source / f'{shard}.jsonl').write_text(''.join(json.dumps(r) + '\n' for r in eligible[shard::2]), encoding='utf-8')
    maximum = .5
    LocalPipelineExecutor(pipeline=[
        JsonlReader(str(source), glob_pattern='*.jsonl'),
        RepetitionFilter(maximum, exclusion_writer=JsonlWriter(str(output / 'removed-repetition'))),
        ScoreFilter(threshold, exclusion_writer=JsonlWriter(str(output / 'removed-score'))),
        JsonlWriter(str(output / 'kept')),
    ], tasks=2, workers=1, logging_dir=str(output / 'logs'), skip_completed=False, start_method='spawn').run()
    kept = read_ids(output / 'kept')
    removed = read_ids(output / 'removed-repetition') + read_ids(output / 'removed-score')
    observed_ids = [r['id'] for r in kept + removed + quarantine]
    if sorted(observed_ids) != sorted(r['id'] for r in records):
        raise RuntimeError('Missing or duplicated IDs across kept/removed/quarantined outputs')
    predicates = [('repetition', lambda r: signals(r['text'])['duplicate_character_share'] <= maximum),
                  ('score', lambda r: r['score'] >= threshold)]
    audit = pipeline(eligible, predicates)
    if sorted(r['id'] for r in audit if r['kept']) != sorted(r['id'] for r in kept):
        raise RuntimeError('Standalone/library retention differs')
    result = {'versions': {p: importlib.metadata.version(p) for p in ['datatrove', 'orjson']},
              'score_source': score_source, 'records': records, 'threshold': threshold,
              'kept': sorted(r['id'] for r in kept), 'removed': sorted(r['id'] for r in removed),
              'quarantined': [r['id'] for r in quarantine], 'inclusive_audit': audit,
              'scope': 'Actual local two-shard pipeline, one worker; no throughput claim'}
    (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--model', type=Path)
    parser.add_argument('--threshold', type=float, default=.5)
    args = parser.parse_args()
    print(json.dumps(run(args.output, args.model, args.threshold), indent=2))
