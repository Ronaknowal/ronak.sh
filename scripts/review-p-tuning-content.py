"""Different-review complementary checks; no fitting or model generation."""
from pathlib import Path
import hashlib
import json
import re
import sys
import zipfile

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/p-tuning-soft-prompt-methods'
PUBLIC = ROOT / 'public/learn-code/p-tuning'
sys.path.insert(0, str(PUBLIC))
import soft_attention as attention
from soft_decoder import SoftDecoder
from tiny_causal_lm import TinyLM
from soft_encoders import PromptLSTM, explicit_lstm

checks = []
def check(value, description):
    assert value, description
    checks.append(description)
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

packet = TOPIC / 'content-inputs.json'
check(sha(packet) == 'c68da5364f422be187c65fd95df12a84b408c88d38fa39e0420c795058a196ef', 'exact original author packet')
bindings = read(packet)['inputs']
for name, digest in bindings.items():
    check(sha(ROOT / name) == digest, 'original binding ' + name)
text = (TOPIC / 'lesson.md').read_text(encoding='utf-8')
check(len(re.findall(r'<!-- P\d\d:', text)) == 26, 'all26 visual teaching placements')
check(len(re.findall(r'<!-- PROGRAM ', text)) == 11, 'eleven complete visible-source contracts')
check(len(re.findall(r'\*\*Solution:', text)) == 12, 'twelve actual solved practices')

# Changed values and prompt lengths test derivatives beyond the author's fixture.
random = np.random.default_rng(231)
for length in (0, 1, 3):
    for target in (0, 1):
        prompt = random.normal(0, .4, size=(length, 2))
        result = attention.input_prompt(prompt, target)
        check(abs(result['attention'].sum() - 1) < 1e-14, f'attention normalization m{length} target{target}')
        for index in np.ndindex(prompt.shape):
            plus, minus = prompt.copy(), prompt.copy()
            plus[index] += 2e-6
            minus[index] -= 2e-6
            derivative = (attention.input_prompt(plus, target)['loss'] - attention.input_prompt(minus, target)['loss']) / 4e-6
            check(abs(derivative - result['d_prompt'][index]) < 1e-9, f'changed input derivative {length}/{target}/{index}')
        check(np.allclose(result['d_prompt'], result['d_prompt_key_path'] + result['d_prompt_value_path']), 'key plus value derivative paths')
fixture = attention.input_prompt(attention.PROMPT, 0)
for value in (fixture['loss'], *fixture['scores'], *fixture['attention'], *fixture['output'], *fixture['probabilities']):
    check(f'{value:.6f}'.replace('-', '−') in text or f'{value:.6f}' in text, 'actual six-decimal manuscript fixture ' + str(value))

# Exact CPU forward/backward checks, no optimizer or output sampling.
torch.set_num_threads(2)
torch.manual_seed(231)
base = TinyLM(13, context=20, width=12, heads=3, layers=2).double()
ids = torch.tensor([[2, 3, 4, 5, 6]])
for route in ('input', 'kv'):
    plain = SoftDecoder(base, 0, route).double()
    check(torch.equal(plain(ids), base(ids)), 'zero virtual recovers complete base ' + route)
    model = SoftDecoder(base, 3, route).double()
    loss = model(ids)[0, 2].log_softmax(-1)[7]
    loss.backward()
    parameter = model.prompt if route == 'input' else model.prefix
    check(bool(torch.isfinite(parameter.grad).all() and parameter.grad.abs().sum() > 0), 'live derivative through frozen complete base ' + route)
    check(all(p.grad is None for p in base.parameters()), 'no frozen-base gradients ' + route)
    changed = ids.clone(); changed[0, 3:] = torch.tensor([10, 11])
    check(torch.equal(model(ids)[:, :3], model(changed)[:, :3]), 'changed future remains causally hidden ' + route)
after = SoftDecoder(base, 3, 'input', insertion=3).double()
after(ids)[0, 2, 7].backward()
check(torch.count_nonzero(after.prompt.grad) == 0, 'infix after predictor cannot receive its derivative')
encoder = PromptLSTM(count=4, width=5, hidden=2).double()
source = encoder.embedding.weight[None]
native, _ = encoder.recurrent(source)
explicit, traces = explicit_lstm(source, encoder.recurrent)
check(torch.allclose(native, explicit, atol=1e-13, rtol=1e-13), 'changed-shape two-layer bidirectional recurrence')
check([t['steps'][0]['position'] for t in traces] == [0, 3, 0, 3], 'backward direction retains original-position association')

# Recompute every displayed outcome from conserved records, never rerun fitting.
summary = read(PUBLIC / 'results/study-summary.json')
evaluation = read(PUBLIC / 'results/study-evaluation.json')
check(len(summary) == 9, 'all nine scientific outcomes retained')
for row in summary:
    name = f"{row['method']}-{row['seed']}"
    complete = read(PUBLIC / f'results/{name}-complete.json')
    outcome = evaluation['results'][name]
    best = min(complete['history'], key=lambda item: (item['dev']['nll'], item['step']))
    check(best['step'] == row['selected_step'], 'dev-only selection ' + name)
    check(len(complete['curve']) == 200 and complete['terminal_step'] == 200, 'full terminal budget ' + name)
    check(sum(map(lambda step: len(step['source_ids']), complete['curve'])) == 1595, 'preserved short batch ' + name)
    check(f"{row['test_nll']:.6f}" in text, 'displayed test NLL ' + name)
    check(outcome['generation']['confusion'] == [[0,19,0,0],[0,69,0,0],[0,16,0,0]], 'actual negative outcome ' + name)
    check(abs(row['macro_f1'] - 138/173/3) < 1e-14, 'macro-F1 independent arithmetic ' + name)
    pooled = sum(item['nll_sum'] for item in outcome['response']['rows']) / sum(item['targets'] for item in outcome['response']['rows'])
    check(abs(pooled - row['test_nll']) < 1e-14, 'pooled genuine targets ' + name)
    check(all(item['ids'] == [642,3486,0] and item['eos_stopped'] for item in outcome['generation']['rows']), 'every actual emitted sequence ' + name)
    for item in outcome['constrained']['rows']:
        choice = max(range(3), key=lambda i: item['candidate_logp'][i])
        check(choice == 1 and item['prediction'] == 'no impact', 'actual candidate decision ' + name + '/' + str(item['id']))
with zipfile.ZipFile(PUBLIC / 'p-tuning.zip') as archive:
    check(len(archive.namelist()) == 83, 'all83 packet members')
    for name in archive.namelist():
        check(archive.read(name) == (PUBLIC / name).read_bytes(), 'exact learner packet ' + name)
for name, digest in bindings.items():
    check(sha(ROOT / name) == digest, 'unchanged after review ' + name)
report = {'passed': True, 'reviewer': 'root', 'fits': 0, 'generation': 0, 'conditions': len(checks), 'checks': checks,
          'scope': 'Changed-value derivatives, full frozen-decoder dependencies, changed-shape recurrence, every actual scientific result and exact packet. Prior native diagnostics reused; no science rerun.'}
(TOPIC / 'content-review-checks.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'passed': True, 'conditions': len(checks), 'fits': 0}))
