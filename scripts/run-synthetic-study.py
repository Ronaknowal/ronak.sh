"""Guard the accepted prospective inputs, generate once, freeze, then fit once."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
CODE=ROOT/'public/learn-code/synthetic-data'
FOLDER=ROOT/'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
sys.path.insert(0,str(CODE))
from synthetic_corpus import read_sources,select_candidates,diagnostics
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
protocol_path=FOLDER/'prospective-protocol.json'
assert sha(protocol_path)=='2ec9cf1a18345b3eda65c63defd5d363978281148cd6d959842694fab011e5ef'
protocol=json.loads(protocol_path.read_text(encoding='utf-8'))
def guard():
    for p,h in protocol['bindings'].items():assert sha(ROOT/p)==h,p
guard()
candidates_path=CODE/'candidates.json'
subprocess.run([sys.executable,'-B','-X','utf8',str(CODE/'synthetic_generate.py'),
                '--cache',str(ROOT/'scratch/constitutional-ai/model-cache'),'--local-only',
                '--output',str(candidates_path)],check=True,cwd=ROOT)
guard()
result=json.loads(candidates_path.read_text(encoding='utf-8'))
assert len(result['records'])==34
for actual,expected in zip(result['records'],protocol['prompts']):
    for key in ['id','source_id','style','seed','prompt','full_input_ids']:assert actual[key]==expected[key],(key,actual['id'])
    assert actual['input_ids']==expected['retained_input_ids']
    assert actual['input_truncated']==expected['truncated']
assert result['versions']==protocol['versions']
pool=select_candidates(result['records'],read_sources()['records'])
assert pool['kept'],'No eligible generated data; abort as predeclared'
selected_path=CODE/'selection.json'
with selected_path.open('x',encoding='utf-8') as stream:json.dump(pool,stream,indent=2,ensure_ascii=False);stream.write('\n')
with (FOLDER/'pre-fit-corpus-freeze.json').open('x',encoding='utf-8') as stream:
    json.dump({'at':datetime.now(timezone.utc).isoformat(),'protocol_sha256':sha(protocol_path),
               'candidates_sha256':sha(candidates_path),'selection_sha256':sha(selected_path),
               'diagnostics':diagnostics(pool['kept']),'candidate_count':34,
               'stage':'Complete generated corpus retained and frozen before any student campaign fit'},stream,indent=2)
print(json.dumps({'corpus_frozen':True,'kept':len(pool['kept'])}),flush=True)
subprocess.run([sys.executable,'-B','-X','utf8',str(CODE/'synthetic_student.py'),
               '--candidates',str(candidates_path),'--output',str(FOLDER/'student-study')],check=True,cwd=ROOT)
guard()
print(json.dumps({'generation_and_nine_fits_completed':True}),flush=True)
