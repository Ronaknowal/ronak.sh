"""Source and supplied-return checks only; no Torch import or neural operation."""

import ast
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import time
import traceback

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
FIX = TOPIC / 'program-correction'
PUBLIC = ROOT / 'public/learn-code/speculative-decoding'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_new(path, data):
    with path.open('x', encoding='utf8') as stream:
        json.dump(data, stream, indent=2)
        stream.write('\n')


old_packet = json.loads((FIX / 'program-inputs.json').read_text())
recoveries = []
for row in old_packet['files']:
    current = ROOT / row['path']
    recovered = current if digest(current) == row['sha256'] else FIX / current.name
    assert digest(recovered) == row['sha256'], recovered
    recoveries.append({'original': row['path'], 'recovered': recovered.relative_to(ROOT).as_posix(),
                       'sha256': row['sha256']})

for path in PUBLIC.glob('*.py'):
    ast.parse(path.read_text(encoding='utf8'))

tree = ast.parse((PUBLIC / 'native_speculation.py').read_text())
function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'generate_one')
function.decorator_list = []


class Tensor:
    def __init__(self, values):
        self.values = values

    def __getitem__(self, key):
        row, span = key
        return Tensor(self.values[row][span])

    def tolist(self):
        return self.values


class FakeTorch:
    long = 'long'

    def tensor(self, values, **kwargs):
        return Tensor(values)

    def manual_seed(self, seed):
        pass

    def ones_like(self, value):
        return value


class Config:
    eos_token_id = 0

    def to_dict(self):
        return {'supplied_fixture': True}


class Model:
    config = Config()
    generation_config = Config()

    def __init__(self, ids, fail=False):
        self.ids, self.fail = ids, fail

    def generate(self, **kwargs):
        if self.fail:
            raise RuntimeError('supplied failure during generation')
        return Tensor([self.ids])


@contextmanager
def observed(*args):
    yield {'rounds': [{'supplied_completed_round': 1}], 'target_calls': 1}


scope = {'torch': FakeTorch(), 'config': lambda *args: Config(), 'observe_calls': observed,
         'time': time, 'traceback': traceback}
exec(compile(ast.Module(body=[function], type_ignores=[]), 'supplied-return', 'exec'), scope)
cases = []
for ids, fail, expected in [([5, 0, 1], False, 'Output continued after EOS.'),
                             ([5], False, 'Invalid output count.'),
                             ([5, 1], True, 'supplied failure during generation'),
                             ([5, 1], False, None)]:
    events = []
    failure = None
    try:
        scope['generate_one'](Model(ids, fail), Model(ids), [5], 'greedy', 3, 401,
                              cap=8, rich=True, observer=lambda value: events.append(json.loads(json.dumps(value))))
    except (AssertionError, RuntimeError) as error:
        failure = str(error)
    assert failure == expected
    assert events[0]['event'] == 'native-call-start'
    if fail:
        assert events[-1]['event'] == 'native-call-exception'
        assert events[-1]['work']['rounds'][0]['supplied_completed_round'] == 1
    else:
        assert events[-1]['event'] == 'native-call-return'
        assert events[-1]['ids'] == ids[1:]
        assert events[-1]['elapsed_ns'] >= 0
    cases.append({'supplied_ids': ids, 'during_call_failure': fail, 'exception': failure, 'events': events})

# Check ordering at the source boundary without running any neural functions.
source_order = []
for name, first, second in [
    ('speculative_cache.py', "'next-logit-comparison'", 'torch.testing.assert_close(actual,expected'),
    ('speculative_cache.py', "'rollback-comparison'", 'torch.testing.assert_close(actual,reference'),
    ('speculative_cache.py', "'greedy-comparison'", 'assert result["ids"]'),
    ('tree_verification.py', "'tree-path-comparison'", 'torch.testing.assert_close(actual,full'),
    ('proposal_heads.py', "'head-loss'", 'torch.testing.assert_close(loss,'),
    ('proposal_heads.py', "'head-gradients'", 'assert all(parameter.grad'),
    ('proposal_heads.py', "'head-mode-after'", 'changed ='),
    ('native_speculation.py', "'native-call-return'", 'if eos in emitted')]:
    text = (PUBLIC / name).read_text()
    assert text.index(first) < text.index(second)
    source_order.append({'file': name, 'event': first, 'before': second})

old_protocol = json.loads((FIX / 'program-protocol.json').read_text())
new_protocol = json.loads(json.dumps(old_protocol))
for row in new_protocol['files']:
    row['sha256'] = digest(PUBLIC / row['name'])
assert {k: v for k, v in old_protocol.items() if k != 'files'} == {k: v for k, v in new_protocol.items() if k != 'files'}
with (TOPIC / 'program-protocol.json').open('w', encoding='utf8') as stream:
    json.dump(new_protocol, stream, indent=2)
    stream.write('\n')

report = {'passed': True, 'scope': 'Static source and supplied-return observations only; no Torch/model/forward/optimizer/scientific generation.',
          'original_recoveries': recoveries, 'supplied_cases': cases, 'source_order': source_order,
          'all_non_source_protocol_fields_unchanged': True,
          'protocol_sha256': digest(TOPIC / 'program-protocol.json')}
write_new(FIX / 'author-checks-r2.json', report)

paths = {ROOT / row['path'] for row in old_packet['files']}
paths.update(FIX.iterdir())
paths.update([Path(__file__), TOPIC / 'program-review.md', TOPIC / 'program-review-inputs.json',
              TOPIC / 'program-review-checks.json'])
packet = {'topicId': 'speculative-decoding', 'purpose': 'R1 observation retention successor; science still unstarted',
          'original_packet_sha256': digest(FIX / 'program-inputs.json'),
          'files': [{'path': path.relative_to(ROOT).as_posix(), 'sha256': digest(path), 'bytes': path.stat().st_size}
                    for path in sorted(paths) if path.is_file()]}
write_new(FIX / 'inputs-r2.json', packet)
print(json.dumps({'bindings': len(packet['files']), 'successor_sha256': digest(FIX / 'inputs-r2.json'),
                  'protocol_sha256': report['protocol_sha256'], 'science_executed': False}))
