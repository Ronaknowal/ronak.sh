"""Acquire an immutable small GSM8K slice for the authorized lesson."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/learn-code/rl-reasoning/data'
OUT.mkdir(parents=True, exist_ok=True)

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Portfolio-lesson-research'})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()

revision = json.loads(fetch('https://api.github.com/repos/openai/grade-school-math/commits/master'))['sha']
base = f'https://raw.githubusercontent.com/openai/grade-school-math/{revision}/'
records, inputs = [], []
for split, count in [('train', 16), ('test', 8)]:
    name = f'grade_school_math/data/{split}.jsonl'
    raw = fetch(base + name)
    source = [json.loads(line) for line in raw.splitlines()]
    inputs.append({'url': base + name, 'sha256': hashlib.sha256(raw).hexdigest(),
                   'bytes': len(raw), 'source_rows': len(source), 'selected_indices': list(range(count))})
    for index, item in enumerate(source[:count]):
        records.append({'id': f'gsm8k-{split}-{index}', 'split': split, 'source_row': index, **item})
license_bytes = fetch(base + 'LICENSE')
for name, data in [('gsm8k-slice.json', (json.dumps(records, ensure_ascii=False, indent=2)+'\n').encode()),
                   ('GSM8K-LICENSE.txt', license_bytes),
                   ('source.json', (json.dumps({'repository': 'openai/grade-school-math', 'revision': revision,
                     'retrieved_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                     'selection': 'First16train and first8test by published row order; no outcome filtering',
                     'inputs': inputs}, indent=2)+'\n').encode())]:
    destination = OUT / name
    with destination.open('xb') as handle:
        handle.write(data)
print(json.dumps({'revision': revision, 'rows': len(records), 'inputs': inputs}))
