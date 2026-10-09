"""Independent design feasibility checks; no generation or optimizer step."""
import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path
from urllib.request import urlopen

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scratch/masked-language-runtime'))
import transformers
from transformers import TemperatureLogitsWarper, TopPLogitsWarper

FOLDER = ROOT / 'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
checks = []
torch.set_num_threads(2)
revision = '0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab'
small_files = {}
for name in ['config.json', 'README.md']:
    url = f'https://huggingface.co/google/flan-t5-small/resolve/{revision}/{name}'
    with urlopen(url, timeout=60) as response:
        data = response.read()
    small_files[name] = {'url': url, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    if name == 'config.json':
        config = json.loads(data)
        assert config['is_encoder_decoder'] and config['decoder_start_token_id'] == 0
        assert config['eos_token_id'] == 1 and config['vocab_size'] == 32128
    else:
        assert 'license: apache-2.0' in data.decode()
checks.append('Exact pinned public model config/card contract; no weights downloaded')

logits = torch.tensor([[2.3, 0.8, -0.4, -2.1]], dtype=torch.float64)
scaled = TemperatureLogitsWarper(.8)(torch.zeros((1, 1), dtype=torch.long), logits)
filtered = TopPLogitsWarper(.85)(torch.zeros((1, 1), dtype=torch.long), scaled)
p = torch.softmax(logits / .8, -1).numpy()[0]
order = np.argsort(-p, kind='stable')
keep = order[:np.searchsorted(np.cumsum(p[order]), .85, side='left') + 1]
expected = np.zeros(4); expected[keep] = p[keep] / p[keep].sum()
np.testing.assert_allclose(filtered.softmax(-1).numpy()[0], expected, atol=1e-14)
checks.append('Installed native temperature/top-p distribution matches strict-gap scratch definition')

q = np.array([.6, .3, .1]); n = 10; total = 0.; mean = np.zeros(3); eh = 0.; eh_accum = 0.
for a in range(n + 1):
    for b in range(n - a + 1):
        counts = np.array([a, b, n-a-b]); prob = math.factorial(n)
        for k, v in zip(counts, q): prob *= v**int(k) / math.factorial(int(k))
        sample = counts / n; total += prob; mean += prob * sample
        eh += prob * (1 - sample @ sample)
        accumulated = (q + sample) / 2
        eh_accum += prob * (1 - accumulated @ accumulated)
np.testing.assert_allclose(mean, q, atol=1e-14)
assert abs(total - 1) < 1e-14 and abs(eh - .486) < 1e-14
assert abs(eh_accum - .54 * (1 - 1/40)) < 1e-14
checks.append('All 66 multinomial outcomes establish conditional mean, replacement H and accumulation H at generation zero')
assert abs(.9**10 - .3486784401) < 1e-14
assert abs(54/62 - 27/31) < 1e-14 and abs(.05/.62 - .08064516129032258) < 1e-14
assert 300 * 16 * 32 == 153600
checks.append('Acceptance/cost, rare disappearance and 153600 selected targets per fit')

source = ROOT / 'public/learn-code/causal-language-modeling/tiny_causal_lm.py'
spec = importlib.util.spec_from_file_location('synthetic_design_prerequisite', source)
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
torch.manual_seed(101)
model = module.TinyLM(256, context=32, width=32, heads=2, layers=2).eval()
ids = torch.arange(32)[None]
with torch.no_grad():
    output = model(ids)
    modified = ids.clone(); modified[0, -1] = 200
    changed = model(modified)
assert output.shape == (1, 32, 256)
torch.testing.assert_close(output[:, :-1], changed[:, :-1], rtol=0, atol=0)
counts = {}
for split, expected_count in [('train', 17), ('heldout', 4)]:
    path = source.parent / f'alice-{split}.txt'
    raw = path.read_text(encoding='utf-8').splitlines()
    excluded = [{'row': i, 'text': p} for i, p in enumerate(raw) if not p.replace('*', '').strip()]
    paragraphs = [p for p in raw if p.replace('*', '').strip()]
    assert len(paragraphs) == expected_count, len(paragraphs)
    counts[split] = {'rawRows': len(raw), 'proseRecords': len(paragraphs), 'excluded': excluded,
                     'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes': [len(p.encode('utf-8')) for p in paragraphs]}
    assert all(len(p.encode('utf-8')) >= 33 for p in paragraphs)
checks.append('Exact prerequisite TinyLM accepts fixed byte vocabulary/context32 and preserves causal prefix; supplied 18/6 line files contain only17/4 prose records after deterministic asterism exclusion')

files = [FOLDER/'design.md', FOLDER/'research-boundary.md', FOLDER/'original-assessment.md', source, Path(__file__)]
report = {'checks': checks, 'versions': {'torch': torch.__version__, 'transformers': transformers.__version__},
          'smallPinnedFiles': small_files, 'counts': counts, 'parameters': sum(p.numel() for p in model.parameters()),
          'bindings': {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
          'scope': 'No learned model generation, fit, optimizer update or model weights acquired; random local one-forward feasibility only.'}
(FOLDER/'design-review-checks.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'checks': checks, 'parameters': report['parameters']}))
