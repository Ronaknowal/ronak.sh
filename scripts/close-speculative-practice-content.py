"""Check only the new finite practice case and preserve executed source identity."""
import ast
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT/'docs/teaching/llm-architecture-training/speculative-decoding'
FIX = TOPIC/'practice-content-correction'
PUBLIC = ROOT/'public/learn-code/speculative-decoding'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    with path.open('x', encoding='utf8') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')


source = PUBLIC/'practice_answers.py'
tree = ast.parse(source.read_text())
function = next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='changed_tree_answer')
namespace = {'F': F}
exec(compile(ast.Module(body=[function],type_ignores=[]),str(source),'exec'),namespace)
answer = namespace['changed_tree_answer']()
expected = {'p':['1/2','7/20','3/20'], 'q':['1/5','1/5','3/5'],
            'first_accepted':['1/5','1/5','3/20'], 'first_rejection':'9/20',
            'active_residual':['2/3','1/3','0'], 'second_accepted':['1/5','1/5','0'],
            'second_rejection':'3/5', 'final_repair':['7/9','2/9','0'],
            'final':['1/2','7/20','3/20']}
for name,value in expected.items():
    assert answer[name]==value, name
protocol = json.loads((TOPIC/'program-protocol.json').read_text())
bound = next(row for row in protocol['files'] if row['name']=='practice_answers.py')
assert sha(FIX/'practice_answers.py') == bound['sha256']
for row in protocol['files']:
    if row['name']!='practice_answers.py':
        assert sha(PUBLIC/row['name']) == row['sha256'], row['name']
evidence = PUBLIC/'evidence'
(evidence/'executed-practice-source.txt').write_bytes((FIX/'practice_answers.py').read_bytes())
report = {'passed':True, 'new_answer_14':answer,
          'executed_source_sha256':sha(FIX/'practice_answers.py'),
          'current_source_sha256':sha(source),
          'scope':'Only new changed-input function evaluated with Fraction; no answers() replay or neural imports. Task16 source/prose diagnosis changed. All other scientific program hashes unchanged.',
          'old_archive_sha256':sha(FIX/'speculative-decoding.zip'),
          'old_projection_sha256':sha(TOPIC/'result-projection.json')}
save(evidence/'practice-content-successor.json',report)
files = sorted(p for p in PUBLIC.rglob('*') if p.is_file() and p.suffix!='.zip')
archive = PUBLIC/'speculative-decoding.zip'
assert sha(archive)==sha(FIX/'speculative-decoding.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as bundle:
    for path in files:
        bundle.write(path,path.relative_to(PUBLIC).as_posix())
with zipfile.ZipFile(archive) as bundle:
    for path in files:
        assert bundle.read(path.relative_to(PUBLIC).as_posix())==path.read_bytes()
report.update(archive_sha256=sha(archive), archive_members=len(files),
              script_sha256=sha(Path(__file__)), manuscript_sha256=sha(TOPIC/'lesson.md'))
save(FIX/'closure.json',report)
print(json.dumps(report,indent=2))
