"""Read-only source/retained-state guards for original unreached stages."""
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
WORK = ROOT / 'scratch/dapo-research/study'
packet_path = DOC/'unreached-continuation-inputs.json'
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
checks = []
def check(condition, label):
    assert condition, label
    checks.append(label)
check(sha(packet_path) == 'b02fd7090a996cdfa59dc6f9f92927cd947a26d6e206ce7ca5753e1d2204a76d', 'exact continuation proposal')
packet = json.loads(packet_path.read_text())
for relative, expected in packet['files'].items():
    check(sha(ROOT/relative) == expected, 'frozen current input '+relative)
original = json.loads((DOC/'program-r1-inputs.json').read_text())
for relative, expected in {**original['files'],**original['installed_sources']}.items():
    check(packet['files'][relative] == expected, 'entire accepted prospective source conserved '+relative)
for seed in [73,89,101]:
    check(json.loads((WORK/f'response-baseline-{seed}.status.json').read_text())['status'] == 'passed', 'completed baseline retained '+str(seed))
check(json.loads((WORK/'dapo-components-73.status.json').read_text())['status'] == 'failed', 'failed original73 retained')
for name in ['dapo-components-89','dapo-components-101','native']:
    check(not any((WORK/(name+suffix)).exists() for suffix in ['', '.status.json','.stdout.txt','.stderr.txt']), 'original stage not attempted '+name)
source = ROOT/'scripts/continue-dapo-unreached.py'
parsed = ast.parse(source.read_text())
assign = next(node for node in ast.walk(parsed) if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id == 'names' for target in node.targets))
check(ast.literal_eval(assign.value) == ['dapo-components-89','dapo-components-101','native'], 'only three prescribed original stages')
check(not any(isinstance(node,ast.While) for node in ast.walk(parsed)), 'no retry loop')
text = source.read_text()
for value,label in [("acceptance['proposal_sha256'] != sha(packet_path)",'approval bound to proposal'),
                    (".open('x'",'exclusive logs'), ("train_dapo.run(model, data, 'dapo-components'",'same original combined run'),
                    ("trl_dapo.run(model, data, WORK / name)",'same original native run'),
                    ("outcomes[name] = {'status': 'failed'",'per-stage failure retained'),
                    ("original_dapo_components_73_status",'original failure explicit terminal')]:
    check(value in text,label)
result = {'accepted':True,'proposal_sha256':sha(packet_path),'conditions':len(checks),'checks':checks,
          'reviewer':'multimodal_reviewer; same complete-program reviewer',
          'language_models':0,'model_forwards':0,'generation':0,'optimizer_steps':0,
          'scope':'Only original unreached combined89/101 and native once, unchanged scientific sources/settings/guards; failed73 and baselines immutable',
          'helper_sha256':sha(source),'review_script_sha256':sha(Path(__file__))}
destination = DOC/'unreached-continuation-review.json'
with destination.open('x',encoding='utf-8') as stream:
    json.dump(result,stream,indent=2);stream.write('\n')
print({'accepted':True,'conditions':len(checks),'review_sha256':sha(destination)})
