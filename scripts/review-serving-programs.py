"""Source-only prospective review guards: no lesson program is imported."""
import ast
import hashlib
import json
import math
from pathlib import Path

folder=Path('docs/teaching/llm-architecture-training/inference-engines-serving')
out=folder/'independent-program-alignment'
out.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
write=lambda p,x:Path(p).write_text(json.dumps(x,indent=2)+'\n',encoding='utf-8')
training=json.loads((folder/'program-author-training-inputs.json').read_text())
for p,digest in training['files'].items():assert sha(p)==digest,p
modules=[]
for p in sorted((folder/'programs').glob('*.py')):
    tree=ast.parse(p.read_text(encoding='utf-8'),filename=str(p))
    modules.append({'path':str(p).replace('\\','/'),'sha256':sha(p),'lines':len(p.read_text().splitlines()),'top_level_functions':[n.name for n in tree.body if isinstance(n,(ast.FunctionDef,ast.ClassDef))]})
assert len(modules)==13
checks=[]
def check(name,actual,expected):
    assert actual==expected,(name,actual,expected)
    checks.append({'name':name,'actual':actual,'expected':expected})
check('Anchor A cached rows',3+3-1,5)
check('Anchor B cached rows',4+2-1,5)
check('Anchor A/B pages',math.ceil(5/2)*2,6)
check('Pool five cannot reserve both',6>5,True)
check('Pool six reserves both',6<=6,True)
check('P5 cap4 EOS at second output rows',5+2-1,6)
check('Changed maximum rows and page slack',(8+6,math.ceil(8/4)+math.ceil(6/4),16-14),(14,4,2))
check('Packed prompt offsets',[0,3,3+4],[0,3,7])
check('Packed final logit rows',[3-1,3+4-1],[2,6])
check('Seven-row allowed causal cells',3*4//2+4*5//2,16)
check('Native rotary dimension',int((128//4)*.25),8)
check('Native QKV row count',4*3*32,384)
check('Finite bytes per page',2*2*2*4*4*4,512)
check('Finite page budget',(8192-2048-1024-1024)//512,8)
check('All-offered fraction',1/4,.25)
check('Arrival cohort goodput',1/2,.5)
check('Changed task cohort',(3/3,3/6,3/4),(1,.5,.75))
check('Separate work saving combined latency',20*.5+80*.5,50)
checks.append({'name':'Clock differences','actual':[.3-0,(.7-.3)/2,.8-0], 'expected':[.3,.2,.8], 'passed':all(math.isclose(a,b) for a,b in zip([.3,(.7-.3)/2,.8],[.3,.2,.8]))})
assert checks[-1]['passed']
files=set()
for p in (folder/'programs').iterdir():
    if p.is_file():files.add(p)
for name in ['design.md','assessment.md','research.md','design-release-root.json','native-protocol.md','program-protocol.md','program-author-root.md','program-author-training.md','program-author-training-inputs.json']:
    files.add(folder/name)
for p in (folder/'research-sources').iterdir():
    if p.is_file():files.add(p)
packet={'status':'prospective-source-frozen-before-any-topic39-execution','authors':{'root':'Ten Python modules, driver, native acquisition/conversion/supervision and protocol','training_author':'request_metrics.py, engine_requirements.py, compare_traces.py, evidence manifest and recipes'},'reviewer':'/root/alignment_author','files':{str(p).replace('\\','/'):sha(p) for p in sorted(files)}}
write(folder/'program-inputs.json',packet)
write(out/'source-checks.json',{'passed':True,'method':'AST parsing and independent scalar/manual-contract recomputation only; none of the 13 program modules imported or executed.','training_bindings':len(training['files']),'modules':modules,'independent_conditions':checks,'program_packet_sha256':sha(folder/'program-inputs.json')})
print(json.dumps({'modules':len(modules),'conditions':len(checks),'bindings':len(packet['files']),'program_packet_sha256':sha(folder/'program-inputs.json')}))
