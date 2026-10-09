"""Complete local four-stage DataTrove pipeline with a declared offline tokenizer.

Install: python -m pip install datatrove tokenizers orjson
Run: python -X utf8 datatrove_pipeline.py --output ./curation-run
Use a NEW output directory each run. This library route clusters band collisions
without the exact-Jaccard confirmation used in lexical_dedup.py.
"""
import argparse
import gzip
import json
import locale
from pathlib import Path
import re
import shutil
from datatrove.executor.local import LocalPipelineExecutor
from datatrove.pipeline.readers import JsonlReader
from datatrove.pipeline.writers import JsonlWriter
from datatrove.pipeline.dedup.minhash import (MinhashConfig, MinhashDedupSignature,
    MinhashDedupBuckets, MinhashDedupCluster, MinhashDedupFilter)
from datatrove.utils.hashing import HashConfig
from datatrove.utils.word_tokenizers import WordTokenizer


class OfflineWords(WordTokenizer):
    """A documented custom-tokenizer extension; not DataTrove's English default."""
    def word_tokenize(self, text):
        return re.findall(r"[^\W_]+(?:['’][^\W_]+)*", text)

    def sent_tokenize(self, text):
        return [text] if text else []

    def span_tokenize(self, text):
        return [(0, len(text))] if text else []


def run(output):
    if locale.getpreferredencoding(False).lower().replace('-', '') != 'utf8':
        raise RuntimeError('Run with python -X utf8: this DataTrove reader uses the process text encoding')
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=False)
    source = output / 'input'
    source.mkdir()
    shutil.copyfile(Path(__file__).with_name('corpus.jsonl'), source / 'corpus.jsonl')
    config = MinhashConfig(n_grams=5, num_buckets=14, hashes_per_bucket=8,
                           seed=17, hash_config=HashConfig(precision=64, hash_fc='sha1'))
    # Stages 1 and 4 must replay this exact reader order and task partition.
    reader = lambda: JsonlReader(str(source), glob_pattern='*.jsonl')
    def execute(name, steps, tasks):
        LocalPipelineExecutor(pipeline=steps, tasks=tasks, workers=1,
            logging_dir=str(output/name/'logs'), skip_completed=False,
            start_method='spawn').run()
    signatures, buckets, clusters = [str(output/name/'data') for name in ('signatures', 'buckets', 'clusters')]
    execute('signatures', [reader(), MinhashDedupSignature(signatures, config=config, language=OfflineWords())], 1)
    execute('buckets', [MinhashDedupBuckets(signatures, buckets, config=config)], config.num_buckets)
    execute('clusters', [MinhashDedupCluster(buckets, clusters, config=config)], 1)
    execute('filter', [reader(), MinhashDedupFilter(clusters,
        exclusion_writer=JsonlWriter(str(output/'removed'))), JsonlWriter(str(output/'kept'))], 1)
    def ids(folder):
        result = []
        for path in sorted(folder.glob('*.jsonl*')):
            opener = gzip.open if path.suffix == '.gz' else open
            with opener(path, 'rt', encoding='utf-8') as stream:
                result.extend(json.loads(line)['id'] for line in stream if line.strip())
        return sorted(result)
    kept, removed = ids(output/'kept'), ids(output/'removed')
    expected = [json.loads(line)['id'] for line in (source/'corpus.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()]
    if sorted(kept + removed) != sorted(expected):
        raise RuntimeError('Pipeline did not account for every input record exactly once; inspect reader/filter logs')
    report = {'kept': kept, 'removed': removed,
              'policy': 'Connected components of matching MinHash bands; no exact similarity recheck.',
              'configuration': {'ngrams': 5, 'bands': 14, 'rows': 8, 'seed': 17, 'precision': 64, 'hash': 'sha1',
                                'tokenizer': 'Explicit OfflineWords; DataTrove normalization remains enabled.'}}
    (output/'result.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(run(args.output), indent=2))
