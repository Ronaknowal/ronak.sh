"""Independent bounded source closure; no scientific imports or execution."""
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
PUBLIC = ROOT / 'public/learn-code/dapo'
OLD = DOC / 'program-r1-predecessor'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def tree(path):
    return ast.parse(path.read_text(encoding='utf-8'))

checks = []
def check(condition, label):
    assert condition, label
    checks.append(label)

packet_path = DOC / 'program-r1-inputs.json'
check(sha(packet_path) == '6305a6982f87e7d8bd169bc81ee771e7efd70dbeda34582934f1696468864b06', 'exact successor packet')
packet = json.loads(packet_path.read_text())
for relative, expected in {**packet['files'], **packet['installed_sources']}.items():
    check(sha(ROOT / relative) == expected, 'current binding ' + relative)
original = json.loads((OLD / 'program-inputs.json').read_text())
for relative, expected in original['files'].items():
    check(sha(OLD / relative) == expected, 'preserved original ' + relative)
for name in ['dapo_math.py', 'dapo_collect.py', 'dapo_checks.py', 'practice_answers.py', 'report_dapo.py']:
    check(ast.dump(tree(PUBLIC / name)) == ast.dump(tree(OLD / 'public/learn-code/dapo' / name)), 'complete format-only AST ' + name)
for name in ['group_losses.py', 'online_preferences.py', 'sft_data.py', 'sft_evaluate.py']:
    check(sha(PUBLIC / name) == sha(OLD / 'public/learn-code/dapo' / name), 'byte-exact helper ' + name)
check(sha(PUBLIC / 'scientific_journal.py') == sha(ROOT / 'public/learn/examples/rlvr/scientific_journal.py'), 'exact accepted journal reuse')

def selected_calls(path, names):
    return sorted(ast.dump(node) for node in ast.walk(tree(path)) if isinstance(node, ast.Call) and
                  ((isinstance(node.func, ast.Name) and node.func.id in names) or
                   (isinstance(node.func, ast.Attribute) and node.func.attr in names)))
for filename, names in [('train_dapo.py', {'SGD', 'objective', 'advantages', 'collect', 'sample_responses', 'rollout_batch', 'length_penalty'}),
                        ('trl_dapo.py', {'GRPOConfig', 'objective', 'get_soft_overlong_punishment'})]:
    check(selected_calls(PUBLIC / filename, names) == selected_calls(OLD / 'public/learn-code/dapo' / filename, names), 'scientific calls conserved ' + filename)
for filename in ['train_dapo.py', 'trl_dapo.py']:
    text = (PUBLIC / filename).read_text()
    check('except BaseException as exception:' in text and 'journal.failure(journal.location, exception)' in text, 'failure wrapper ' + filename)
    check(text.index('journal = ScientificJournal(output)') < text.index('result = _run('), 'fresh destination before entry ' + filename)
retention = json.loads((DOC / 'program-r1-retention-checks.json').read_text())
check(retention['passed'] and retention['conditions'] == 80, 'read supplied-state author receipt 80')
for key in ['language_models', 'model_forwards', 'generation', 'optimizer_steps']:
    check(retention[key] == 0, 'author retention scope zero ' + key)
for relative, expected in retention['inputs'].items():
    check(sha(ROOT / relative) == expected, 'retention receipt current ' + relative)
orchestrator = ROOT / 'scripts/run-dapo-study.py'
ast.parse(orchestrator.read_text())
check("work.mkdir(parents=True, exist_ok=False)" in orchestrator.read_text(), 'orchestrator refuses previous study')
check("for seed in [73,89,101]" in orchestrator.read_text(), 'orchestrator prescribed seeds')
check("for arm in ['response-baseline','dapo-components']" in orchestrator.read_text(), 'orchestrator prescribed two arms')
result = {'accepted': True, 'scope': 'Same reviewer R1 closure composed with retained whole 262-condition review; no model/forward/generation/update execution',
          'conditions': len(checks), 'checks': checks, 'successor_packet_sha256': sha(packet_path),
          'files': {str(path.relative_to(ROOT)).replace('\\','/'): sha(path) for path in [packet_path, DOC/'program-review.md', DOC/'program-review-inputs.json', DOC/'program-r1-author-closure.md', DOC/'program-r1-retention-checks.json', orchestrator, Path(__file__)]},
          'language_models': 0, 'model_forwards': 0, 'generation': 0, 'optimizer_steps': 0}
destination = DOC / 'program-review-r1-checks.json'
with destination.open('x', encoding='utf-8') as stream:
    json.dump(result, stream, indent=2)
    stream.write('\n')
print({'accepted': True, 'conditions': len(checks), 'sha256': sha(destination)})
