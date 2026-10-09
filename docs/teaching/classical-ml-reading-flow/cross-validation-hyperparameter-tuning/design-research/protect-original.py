from pathlib import Path
import hashlib,json,shutil,datetime
root=Path.cwd()
topic=root/'docs/teaching/classical-ml-reading-flow/cross-validation-hyperparameter-tuning'
out=topic/'original'
paths=[
'src/learn/data/topics/cross-validation-hyperparameter-tuning.jsx',
'src/learn/data/validation-examples.js','src/learn/data/validation-models.js','src/learn/data/validation-data.js',
'src/learn/components/lesson-labs/ValidationLabs.jsx','src/learn/components/lesson-labs/ValidationFigures.jsx','src/learn/components/lesson-labs/ValidationShared.jsx','src/learn/components/lesson-labs/validation-labs.css',
'docs/teaching/topic-notes/cross-validation-hyperparameter-tuning.md','docs/teaching/CROSS-VALIDATION-INDEPENDENT-REVIEW.md',
'scripts/verify-validation-browser.cjs','scripts/verify-validation-data.py','scripts/verify-validation-examples.py','scripts/verify-validation-models.mjs',
]
for directory in ['public/learn-assets/cross-validation','docs/teaching/drafts/cross-validation-hyperparameter-tuning']:
    paths += [p.relative_to(root).as_posix() for p in (root/directory).iterdir() if p.is_file()]
paths += [p.relative_to(root).as_posix() for p in (root/'docs/teaching/evidence').glob('validation-*.json')]
rows=[]
for name in paths:
    source=root/name; target=out/name
    data=source.read_bytes()
    if target.exists():
        assert target.read_bytes()==data, f'Existing original mismatch: {name}'
    else:
        target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(data)
    rows.append(dict(path=name,original=target.relative_to(topic).as_posix(),bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
manifest=dict(schema='classical-reading-flow-protected-original/v1',topic='cross-validation-hyperparameter-tuning',at=datetime.datetime.now(datetime.timezone.utc).isoformat(),status='PROTECTED_ORIGINAL_DESIGN_ONLY',sources=rows,policy='Exact bytes before revision; no original program/main/fit replay. Current source/records preserved, including executed streams and historical scopes.')
dest=topic/'original-manifest.json'
assert not dest.exists()
dest.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print(json.dumps(dict(files=len(rows),bytes=sum(x['bytes'] for x in rows),manifest_sha256=hashlib.sha256(dest.read_bytes()).hexdigest())))

