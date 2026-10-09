"""Correct the journal initializer without running scientific programs."""
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
FIX = TOPIC / 'program-correction'
PUBLIC = ROOT / 'public/learn-code/speculative-decoding'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save(path, data):
    with path.open('x', encoding='utf8') as stream:
        json.dump(data, stream, indent=2)
        stream.write('\n')

old = (FIX / 'speculation_study.before-jsonl.py').read_text()
new = (PUBLIC / 'speculation_study.py').read_text()
expected = old.replace("    write_new(journal,{'begin':True,'stage':stage})",
                       "    with journal.open('x',encoding='utf8') as stream:\n        stream.write(json.dumps({'begin':True,'stage':stage})+'\\n')")
assert new == expected
ast.parse(new)
protocol = json.loads((TOPIC / 'program-protocol.json').read_text())
previous = json.loads((FIX / 'protocol-before-jsonl.json').read_text())
for row in protocol['files']:
    row['sha256'] = sha(PUBLIC / row['name'])
assert {k:v for k,v in protocol.items() if k!='files'} == {k:v for k,v in previous.items() if k!='files'}
with (TOPIC / 'program-protocol.json').open('w', encoding='utf8') as stream:
    json.dump(protocol, stream, indent=2)
    stream.write('\n')
sample = json.dumps({'begin':True,'stage':'fixture'})+'\n'+json.dumps({'event':'supplied'})+'\n'
assert [json.loads(line) for line in sample.splitlines()] == [{'begin':True,'stage':'fixture'},{'event':'supplied'}]
prior = json.loads((FIX / 'inputs-r2.json').read_text())
relocated = []
paths = {ROOT / row['path'] for row in prior['files']}
for row in prior['files']:
    path = ROOT / row['path']
    if sha(path) != row['sha256']:
        replacement = FIX / ('speculation_study.before-jsonl.py' if path.name=='speculation_study.py' else 'protocol-before-jsonl.json')
        assert sha(replacement) == row['sha256']
        relocated.append({'original':row['path'],'preserved':replacement.relative_to(ROOT).as_posix(),'sha256':row['sha256']})
        paths.add(replacement)
report = {'passed':True,'reason':'JSONL initializer was pretty-printed JSON before line-wise appended events. Corrected only initializer serialization.',
          'r2_relocations':relocated,'non_source_protocol_fields_unchanged':True,
          'scope':'Exact string/AST and supplied JSON serialization checks only; no science.',
          'protocol_sha256':sha(TOPIC/'program-protocol.json')}
save(FIX/'jsonl-checks.json',report)
paths.update([Path(__file__),FIX/'jsonl-checks.json',FIX/'inputs-r2.json'])
save(FIX/'inputs-r3.json',{'topicId':'speculative-decoding','purpose':'R1 final observation successor plus single-line JSONL initializer',
                         'files':[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(paths)]})
print(json.dumps({'packet_sha256':sha(FIX/'inputs-r3.json'),'bindings':len(paths),'protocol_sha256':report['protocol_sha256']}))
