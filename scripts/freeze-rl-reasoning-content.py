"""Assemble the source-bound complete content packet and self-contained archive."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public/learn-code/rl-reasoning'
TOPIC=ROOT/'docs/teaching/llm-architecture-training/rl-for-reasoning-deepseek-r1-style'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
packet=TOPIC/'content-inputs.json'
assert not packet.exists(),'Frozen content exists; prepare a reviewed successor instead.'
checks=json.loads((TOPIC/'content-author-checks.json').read_text())
assert checks['status']=='passed' and checks['manuscript_sha256']==sha(TOPIC/'lesson.md')
example=PUBLIC/'finite-examples.json'
if not example.exists():
    results={}
    for name in ['sequence_policy.py','reasoning_checks.py','reasoning_sampling.py','reasoning_evaluate.py']:
        proc=subprocess.run([sys.executable,'-B','-X','utf8',str(PUBLIC/name)],cwd=PUBLIC,text=True,capture_output=True,check=True)
        results[name]=dict(program_sha256=sha(PUBLIC/name),exit_code=proc.returncode,output=json.loads(proc.stdout),stderr=proc.stderr)
    example.write_text(json.dumps(dict(fits=0,neural_generation=0,programs=results),indent=2)+'\n',encoding='utf8')
manifest=PUBLIC/'download-manifest.json';archive=PUBLIC/'rl-reasoning.zip'
assert not manifest.exists() and not archive.exists()
files={p.relative_to(PUBLIC).as_posix():dict(sha256=sha(p),bytes=p.stat().st_size) for p in sorted(PUBLIC.rglob('*')) if p.is_file()}
assert not any('__pycache__' in p or p.endswith(('.pyc','.pt')) for p in files)
manifest.write_text(json.dumps(files,indent=2)+'\n',encoding='utf8')
with zipfile.ZipFile(archive,'x',compression=zipfile.ZIP_DEFLATED) as z:
    for name in [*files,manifest.name]:z.write(PUBLIC/name,arcname=name)
with zipfile.ZipFile(archive) as z:
    for name in z.namelist():assert z.read(name)==(PUBLIC/name).read_bytes(),name
inputs={p.relative_to(ROOT).as_posix():sha(p) for p in sorted(PUBLIC.rglob('*')) if p.is_file()}
for p in sorted(TOPIC.rglob('*')):
    if p.is_file():inputs[p.relative_to(ROOT).as_posix()]=sha(p)
for name in ['check-rl-reasoning-content.py','check-rl-reasoning-programs.py','package-rl-reasoning-evidence.py','prepare-rl-reasoning-data.py','freeze-rl-reasoning-content.py']:
    p=ROOT/'scripts'/name;inputs[p.relative_to(ROOT).as_posix()]=sha(p)
packet.write_text(json.dumps(dict(status='author-whole-content-ready-for-different-review',author='root',
    topic='rl-for-reasoning-deepseek-r1-style',sections=18,visuals=27,owned_programs=7,reused_programs=2,practice=14,
    runtime_started=False,scientific_runs='terminal, prospectively frozen; no task-success claim',
    source_files=len(inputs),archive_members=len(files)+1,inputs=inputs),indent=2)+'\n',encoding='utf8')
print(json.dumps(dict(packet_sha256=sha(packet),manuscript_sha256=sha(TOPIC/'lesson.md'),files=len(inputs),archive_members=len(files)+1,archive_bytes=archive.stat().st_size)))
