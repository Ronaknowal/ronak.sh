"""Bounded R1/R2 content closure. Never imports a model or download API."""
import ast
import hashlib
import json
from pathlib import Path
import re
import zipfile

ROOT=Path(__file__).resolve().parents[1]
TOPIC=ROOT/'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
SUCCESSOR=TOPIC/'content-review-successor'
PROGRAMS=ROOT/'public/learn/examples/rlvr'
checks=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def check(name, value):
    assert value,name
    checks.append(name)
packet=SUCCESSOR/'inputs.json'
check('successor identity',sha(packet)=='87350bc5cc8151c5a712a77d6f8cb1d501199c380e577bf077887c2ba488334b')
current=json.loads(packet.read_text(encoding='utf8'))
for name,h in current['files'].items():
    check('current '+name,sha(ROOT/name)==h)
previous=json.loads((TOPIC/'content-review-inputs.json').read_text(encoding='utf8'))
changed=[]
for name,h in previous['files'].items():
    if sha(ROOT/name)!=h:
        changed.append(name)
        check('exact preserved predecessor '+name,sha(SUCCESSOR/'predecessor'/name)==h)
    else:
        check('unchanged reviewed '+name,True)
expected=[(TOPIC/'lesson.md').relative_to(ROOT).as_posix()]+['public/learn/examples/rlvr/'+n for n in ['README.md','rlvr-programs.zip','download-manifest.json']]
check('exactly four declared changed files',set(changed)==set(expected))
text=(TOPIC/'lesson.md').read_text(encoding='utf8')
old=(SUCCESSOR/'predecessor'/expected[0]).read_text(encoding='utf8')
for pattern,label in [(r'^## .*$','main headings'),(r'<!-- D\d+.*?-->','visual contracts'),(r'<!-- CODE .*?-->','full program placements'),(r'\$\$.*?\$\$','display mathematics')]:
    flags=re.M if label=='main headings' else re.S
    check('conserved '+label,re.findall(pattern,text,flags)==re.findall(pattern,old,flags))
check('all practice and endings exact',text[text.index('## 16.'):]==old[old.index('## 16.'):])
check('route precedes teaching','For a first pass, follow sections 1–9, then 12–14' in text[:text.index('## 1.')])
check('necessary sampler definitions before implementation',text.index('**First-pass sampler settings.')<text.index('**Support**')<text.index('## 12.'))
check('necessary selected targets before implementation',text.index('**First-pass verified selection.')<text.index('If no response passes')<text.index('## 12.'))
for label in ['group-availability probabilities','entropy and correctness','prompt scheduling','noisy acceptance','reasoning proxies','evaluation and public protocols']:
    check('local deeper label '+label,'**Deeper: '+label+'.**' in text)
readme=(PROGRAMS/'README.md').read_text(encoding='utf8')
payloads=[]
for name,value in [('manuscript',text),('README',readme)]:
    payload=re.search(r'python -c "([^"]*snapshot_download[^\n"]*)"',value).group(1)
    syntax=ast.parse(payload)
    call=syntax.body[-1].value
    args={k.arg:ast.literal_eval(k.value) for k in call.keywords}
    check(name+' exact acquisition arguments',args=={'repo_id':'google/flan-t5-small','revision':'0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab','cache_dir':'model-cache'})
    check(name+' matching offline cache root','python -B hf_eval_math.py --cache model-cache --output observations/flan.json' in value)
    payloads.append(payload)
check('identical acquisition snippets',payloads[0]==payloads[1])
api=ast.parse((SUCCESSOR/'snapshot-download-source.py').read_text(encoding='utf8'))
definition=[node for node in api.body if isinstance(node,ast.FunctionDef) and node.name=='snapshot_download'][-1]
fields={a.arg for a in definition.args.args+definition.args.kwonlyargs}
check('actual API keyword compatibility',set(args)<=fields)
manifest=json.loads((PROGRAMS/'download-manifest.json').read_text(encoding='utf8'))
with zipfile.ZipFile(PROGRAMS/'rlvr-programs.zip') as new, zipfile.ZipFile(SUCCESSOR/'predecessor/public/learn/examples/rlvr/rlvr-programs.zip') as oldzip:
    check('archive member inventory conserved',new.namelist()==oldzip.namelist())
    check('only README and dependent embedded manifest changed',[n for n in new.namelist() if new.read(n)!=oldzip.read(n)]==['MANIFEST.json','README.md'])
    internal=json.loads(new.read('MANIFEST.json'))
    prior_internal=json.loads(oldzip.read('MANIFEST.json'))
    check('embedded manifest only README hash changed',[n for n in internal if internal[n]!=prior_internal[n]]==['README.md'])
    check('embedded and external manifests agree',internal==manifest['programs']['entries'])
    for name in new.namelist():
        if name=='MANIFEST.json':
            continue
        check('archive exact current '+name,new.read(name)==(PROGRAMS/name).read_bytes())
        check('archive manifest '+name,hashlib.sha256(new.read(name)).hexdigest()==manifest['programs']['entries'][name])
check('archive overall manifest identity',sha(PROGRAMS/'rlvr-programs.zip')==manifest['programs']['sha256'])
oldmanifest=json.loads((SUCCESSOR/'predecessor/public/learn/examples/rlvr/download-manifest.json').read_text(encoding='utf8'))
check('recorded observations manifest unchanged',oldmanifest['recorded_outputs']==manifest['recorded_outputs'])
out=TOPIC/'content-review-closure-checks.json'
assert not out.exists()
out.write_text(json.dumps({'passed':True,'conditions':len(checks),'checks':checks,'changed_files':changed,'unchanged_predecessor_files':len(previous['files'])-len(changed),'scientific_operations':0,'scope':'Source identity, changed route and setup, API AST, archive bytes only. No network/API invocation/model or scientific replay.','script_sha256':sha(Path(__file__))},indent=2)+'\n',encoding='utf8')
print(json.dumps({'passed':True,'conditions':len(checks),'sha256':sha(out)}))
