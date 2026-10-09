"""New capstone math and saved-evidence consistency; never re-fit the study."""
from pathlib import Path
import ast
import hashlib
import json
import re
import sys
import zipfile
import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT/'docs/teaching/llm-architecture-training/supervised-fine-tuning-sft'
PUBLIC = ROOT/'public/learn-code/supervised-fine-tuning'
sys.path.insert(0, str(PUBLIC))
from sft_objective import context_forward, context_backward, masked_ce

sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
checks = []
ids = np.array([0, 1, 2, 3, 4, 6, 0, 1, 2, 3, 5, 4, 6])
labels = np.array([-100]*4 + [4, 6] + [-100]*4 + [5, 4, 6])
visible = np.zeros((13, 13), bool)
visible[:6, :6] = np.tril(np.ones((6, 6), bool))
visible[6:, 6:] = np.tril(np.ones((7, 7), bool))
embedding = np.eye(7)
head = np.zeros((7, 7))
logits, cache = context_forward(ids, embedding, head, visible)
objective = masked_ce(logits[None], labels[None])
grads = context_backward(objective['gradient'][0], cache, 7)
assert visible.sum() == 49 and objective['targets'] == 5
np.testing.assert_allclose(objective['loss'], np.log(7), atol=1e-14)
np.testing.assert_allclose(grads['head'][2, 4], -5/84, atol=1e-14)
np.testing.assert_allclose(grads['embedding'], 0., atol=1e-14)
new_head = head - .1*grads['head']
np.testing.assert_allclose(new_head[2, 4], 1/168, atol=1e-14)
te = torch.tensor(embedding, requires_grad=True)
tw = torch.tensor(head, requires_grad=True)
mix = torch.tensor(visible/visible.sum(axis=1, keepdims=True))
tz = mix @ te[torch.tensor(ids)] @ tw
loss = torch.nn.functional.cross_entropy(tz[:-1], torch.tensor(labels[1:]), ignore_index=-100)
loss.backward()
np.testing.assert_allclose(tw.grad.numpy(), grads['head'], atol=1e-14)
np.testing.assert_allclose(te.grad.numpy(), grads['embedding'], atol=1e-14)
checks.append('Changed capstone: all 49 graph edges, five targets, whole manual/autograd derivatives and updated head')

evaluation = json.loads((TOPIC/'research/study-evaluation.json').read_text(encoding='utf-8'))
protocol_path = TOPIC/'research/study-protocol.json'
protocol = json.loads(protocol_path.read_text(encoding='utf-8'))
assert evaluation['protocol_sha'] == sha(protocol_path)
for name, expected in protocol['contract']['programs'].items():
    assert sha(PUBLIC/name) == expected
    ast.parse((PUBLIC/name).read_text(encoding='utf-8'))
assert [(r['policy'], r['seed']) for r in evaluation['runs']] == [(p, s) for p in ['response', 'full'] for s in [17, 29, 43]]
for row in evaluation['runs']:
    history = row['history']
    assert row['steps'] == 200 and len(row['updates']) == 200
    selected = min(history, key=lambda h: h['development_response']['nll'])
    assert selected['step'] == row['selected_step']
    assert selected['development_response']['nll'] == row['selected_development_nll']
    assert row['presentations'] == sum(x['records'] for x in row['updates']) == 1595
    test = row['test']
    assert len(test['response']['rows']) == 104 and test['response']['targets'] == 277
    assert abs(sum(x['nll_sum'] for x in test['response']['rows'])/277-test['response']['nll']) < 1e-12
    for mode in ['generation', 'constrained']:
        values = test[mode]
        assert len(values['rows']) == 104
        gold = values['gold_order']; pred = values['prediction_order']
        matrix = [[0]*4 for _ in range(3)]
        for item in values['rows']:
            matrix[gold.index(item['gold'])][pred.index(item['prediction'])] += 1
        assert matrix == values['confusion']
        f1 = []
        for i in range(3):
            tp = matrix[i][i]
            denominator = sum(matrix[i])+sum(x[i] for x in matrix)
            f1.append(2*tp/denominator if denominator else 0.)
        np.testing.assert_allclose(values['class_f1'], f1, atol=1e-14)
        np.testing.assert_allclose(values['macro_f1'], np.mean(f1), atol=1e-14)
    assert all(a['prediction'] == b['prediction'] for a, b in zip(test['generation']['rows'], test['constrained']['rows']))
    assert all(x['eos_stopped'] for x in test['generation']['rows'])
checks.append('All six saved outcomes: original program/protocol identities, development selection, budgets, pooled NLL, every confusion/F1 and rule agreement')

for seed in [17, 29, 43]:
    pair = [r for r in evaluation['runs'] if r['seed'] == seed]
    assert pair[0]['input_positions'] == pair[1]['input_positions']
assert evaluation['training_majority']['label'] == 'no impact'
assert evaluation['training_majority']['accuracy'] == 69/104
checks.append('Matched inputs and training-only majority baseline')

text = (TOPIC/'lesson.md').read_text(encoding='utf-8')
assert re.findall(r'<!-- (S\d+):', text) == [f'S{i:02}' for i in range(1, 22)]
assert len(re.findall(r'<!-- PROGRAM ', text)) == 6
assert len(re.findall(r'^### [A-M]\. ', text, re.M)) == 13
assert text.count('**Worked solution.**') == 13
assert text.count('\\[') == text.count('\\]')
assert text.count('\\(') == text.count('\\)')
assert '\t' not in text and not any(ord(c)<32 and c not in '\n\r' for c in text)
assert '1.87\\times10^{-9}\\)' in text
for link in re.findall(r'\]\((/learn-code/[^)]+)\)', text):
    assert (ROOT/'public'/link.lstrip('/')).exists(), link
checks.append('Whole manuscript structure: 21 contracts, six full-program slots, thirteen complete solutions, math delimiters and actual public targets')

inventory = json.loads((PUBLIC/'FILES.json').read_text(encoding='utf-8'))['files']
with zipfile.ZipFile(PUBLIC/'supervised-fine-tuning.zip') as archive:
    assert set(archive.namelist()) == set(inventory)|{'FILES.json'}
    for name, item in inventory.items():
        assert sha(PUBLIC/name) == item['sha256']
        assert hashlib.sha256(archive.read(name)).hexdigest() == item['sha256']
for split, expected in protocol['contract']['data'].items():
    assert sha(PUBLIC/'data'/f'{split}.tsv') == expected
assert sha(PUBLIC/'tiny_causal_lm.py') == sha(ROOT/'public/learn-code/causal-language-modeling/tiny_causal_lm.py')
checks.append('Complete ZIP bytes, pinned TSVs and unchanged prerequisite helper')

report = {'checks': checks, 'scientific_fits_or_inferences_repeated': 0,
          'capstone': {'loss': objective['loss'], 'edges': int(visible.sum()), 'targets': objective['targets'],
                       'head_gradient_q_yes': float(grads['head'][2, 4]), 'new_head_q_yes': float(new_head[2, 4]),
                       'native_gradient_max_error': float(np.max(np.abs(tw.grad.numpy()-grads['head'])))},
          'sources': {str(p.relative_to(ROOT)).replace('\\', '/'): sha(p) for p in [Path(__file__), TOPIC/'lesson.md',
                      protocol_path, TOPIC/'research/study-evaluation.json', PUBLIC/'FILES.json', PUBLIC/'supervised-fine-tuning.zip']}}
(TOPIC/'content-author-checks.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, indent=2))
