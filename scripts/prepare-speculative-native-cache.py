"""Installed-source/supplied-cache probe and prospective packet; no neural import."""
import ast
import hashlib
import json
from pathlib import Path
from types import SimpleNamespace

ROOT=Path(__file__).resolve().parents[1]
TOPIC=ROOT/'docs/teaching/llm-architecture-training/speculative-decoding'
FIX=TOPIC/'native-cache-correction'
PUBLIC=ROOT/'public/learn-code/speculative-decoding'
PREVIOUS=ROOT/'scratch/speculative-research/study-continuation'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save(path,value):
    with path.open('x',encoding='utf8') as stream:
        json.dump(value,stream,indent=2)
        stream.write('\n')

source=ROOT/'scratch/speculative-research/sources/installed-utils.py'
tree=ast.parse(source.read_text())
function=next(node for node in ast.walk(tree) if isinstance(node,ast.FunctionDef) and node.name=='_prepare_cache_for_generation')
function.decorator_list=[]
function.returns=None
for arg in function.args.args:
    arg.annotation=None

class SuppliedDynamicCache:
    def __init__(self,**kwargs):
        self.arguments=kwargs
        self.recording=False
    def activate_past_recording(self):
        self.recording=True

class SuppliedModel:
    config=SimpleNamespace(is_encoder_decoder=False,get_text_config=lambda **kwargs:{'supplied_config':True})
    def _supports_default_dynamic_cache(self):
        return True

scope={'DynamicCache':SuppliedDynamicCache,'ALL_STATIC_CACHE_IMPLEMENTATIONS':set(),
       'EncoderDecoderCache':type('SuppliedEncoderDecoderCache',(),{})}
exec(compile(ast.Module(body=[function],type_ignores=[]),'installed-cache-body','exec'),scope)
observations=[]
for request in ['dynamic',None]:
    for carried in [False,True]:
        cfg=SimpleNamespace(cache_implementation=request,use_cache=True,is_assistant=True)
        cached=SuppliedDynamicCache()
        kwargs={'past_key_values':cached} if carried else {}
        failure=None
        try:
            scope['_prepare_cache_for_generation'](SuppliedModel(),cfg,kwargs,None,1,30)
        except ValueError as error:
            failure=str(error)
        expected_failure=request is not None and carried
        assert bool(failure)==expected_failure
        if not failure:
            assert isinstance(kwargs['past_key_values'],SuppliedDynamicCache)
            if carried:
                assert kwargs['past_key_values'] is cached and cached._is_user_defined
            else:
                assert kwargs['past_key_values'].recording
        observations.append({'request':request,'carried':carried,'failure':failure,
                             'resolved_type':None if failure else 'DynamicCache supplied stand-in'})

old=(FIX/'native_speculation.py').read_text()
new=(PUBLIC/'native_speculation.py').read_text()
assert new==old.replace("    settings.cache_implementation = 'dynamic'",
    "    # The pinned default creates DynamicCache. Explicit initialization conflicts\n    # with the assistant's carried cache object on its second candidate round.\n    settings.cache_implementation = None")
protocol=json.loads((FIX/'program-protocol.json').read_text())
for row in protocol['files']:
    if row['name']=='native_speculation.py':
        row['sha256']=sha(PUBLIC/row['name'])
    else:
        assert sha(PUBLIC/row['name'])==row['sha256']
with (TOPIC/'program-protocol.json').open('w',encoding='utf8') as stream:
    json.dump(protocol,stream,indent=2)
    stream.write('\n')
events=[json.loads(line) for line in (PREVIOUS/'native-detail.jsonl').read_text().splitlines()]
failure=next(row for row in events if row.get('event')=='native-call-exception')
assert failure['work']['target_calls']==1 and failure['work']['draft_calls']==3
assert failure['work']['rounds'][0]['emitted_ids']==[13]
save(FIX/'diagnosis.json',{'passed':True,'scope':'AST-extracted installed cache method with supplied Python objects only; no Torch, model, generation or new diagnostic attempt.',
    'source':source.relative_to(ROOT).as_posix(),'source_sha256':sha(source),
    'observations':observations,'retained_failed_work':failure['work'],
    'only_config_scalar_and_comments_changed':True,'protocol_sha256':sha(TOPIC/'program-protocol.json')})
plan_paths=[TOPIC/'program-protocol.json',ROOT/'scripts/continue-speculative-native-cache.py']
plan_paths.extend(PREVIOUS/name for name in ['finite.json','cache.json','tree.json','heads.json','native.json','native-detail.json','native-detail.jsonl'])
save(FIX/'plan.json',{'protocol_sha256':sha(TOPIC/'program-protocol.json'),
    'remaining_diagnostic_calls':1,'remaining_study_calls':128,'greedy_retry_permitted':False,
    'files':[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for p in plan_paths]})
prior=json.loads((TOPIC/'finite-witness-correction/inputs.json').read_text())
paths={ROOT/row['path'] for row in prior['files']}
relocations=[]
for row in prior['files']:
    path=ROOT/row['path']
    if sha(path)!=row['sha256']:
        preserved=FIX/path.name
        assert sha(preserved)==row['sha256']
        paths.add(preserved)
        relocations.append({'original':row['path'],'preserved':preserved.relative_to(ROOT).as_posix(),'sha256':row['sha256']})
paths.update(PREVIOUS.iterdir())
paths.update(FIX.iterdir())
paths.update(plan_paths)
paths.update([Path(__file__),TOPIC/'finite-witness-correction/inputs.json',
              TOPIC/'finite-witness-correction/independent-review.md',
              TOPIC/'finite-witness-correction/execution-accepted-root.json'])
save(FIX/'inputs.json',{'topicId':'speculative-decoding','purpose':'Cache ownership correction and only unstarted native work',
    'predecessor_relocations':relocations,
    'files':[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(paths) if p.is_file()]})
print(json.dumps({'bindings':len(paths),'packet_sha256':sha(FIX/'inputs.json'),'protocol_sha256':sha(TOPIC/'program-protocol.json')}))
