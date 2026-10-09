"""AST/source/config-only prospective packet; no language-model construction."""
from pathlib import Path
import ast,hashlib,json,sys,importlib.metadata
root=Path(__file__).resolve().parents[1]
folder=root/'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
public=root/'public/learn-code/dapo'
sys.path.insert(0,str(public))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
from sft_data import load_source
for p in public.glob('*.py'):ast.parse(p.read_text(encoding='utf-8'))
copies={}
for name in ['online_preferences.py','group_losses.py','sft_data.py','sft_evaluate.py']:
    source=root/'public/learn-code/grpo-rloo-kto'/name
    assert source.read_bytes()==(public/name).read_bytes()
    copies[name]={'source':source.relative_to(root).as_posix(),'sha256':sha(source)}
rows=load_source(public/'data')
train=sorted(rows['train'],key=lambda r:r['id'])[:16]
test=sorted(rows['test'],key=lambda r:r['id'])[:32]
from trl import GRPOConfig
# Extract the actual complete configuration call, with only its Path argument
# bound locally. This evaluates no author trainer/model/run function.
tree=ast.parse((public/'trl_dapo.py').read_text())
call=next(n for n in ast.walk(tree) if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='GRPOConfig')
config=eval(compile(ast.Expression(call),'trl_dapo.py:GRPOConfig','eval'),{'GRPOConfig':GRPOConfig,'output':root/'scratch/dapo-research/api-probe'})
assert config.loss_type=='dapo' and config.beta==0 and config.epsilon_high==.28
assert config.generation_batch_size==4 and config.steps_per_generation==1
assert config.entropy_coef==0 and not config.mask_truncated_completions
model=root/'scratch/sft-research/study/response-17/selected'
assert sha(model/'model.safetensors')=='8ffe40fc676d22d608b58b35af11bf467c36981dbb3ccfe373a7d574bd8251cd'
versions={n:importlib.metadata.version(n) for n in ['torch','transformers','trl','numpy','datasets','accelerate']}
provenance={'data':{'repository':'https://github.com/google-research-datasets/poem-sentiment','revision':'612e9a1f86799126c68f0c5d9c3f1fc28f88068f','license':'CC-BY-4.0','credit':'Emily Sheng and David Uthus (2020)'},
    'model':{'base':'EleutherAI/pythia-14m','base_revision':'cf967c0a9a04383db6f7b1108d86b2962634b4ac','license':'Apache-2.0','sft_weights_sha256':sha(model/'model.safetensors'),'bundled':False},'exact_reused_sources':copies}
(public/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
files={p.relative_to(root).as_posix():sha(p) for p in public.rglob('*') if p.is_file()}
for p in model.iterdir():
    if p.is_file():files[p.relative_to(root).as_posix()]=sha(p)
for name in ['design.md','design-review.md','design-review-closure.md','design-review-acceptance.json','program-protocol.md']:
    p=folder/name;files[p.relative_to(root).as_posix()]=sha(p)
files[Path(__file__).relative_to(root).as_posix()]=sha(Path(__file__))
installed={'trl':['trl/trainer/grpo_trainer.py','trl/trainer/grpo_config.py','trl/rewards/other_rewards.py'],
           'transformers':['transformers/models/gpt_neox/modeling_gpt_neox.py','transformers/generation/utils.py'],
           'torch':['torch/optim/sgd.py']}
package_sources={}
for distribution,paths in installed.items():
    dist=importlib.metadata.distribution(distribution)
    for relative in paths:
        path=Path(dist.locate_file(relative));package_sources[str(path)]=sha(path)
packet={'status':'complete prospective programs awaiting different whole review; no model/forward/generation/fit',
    'files':files,'installed_sources':package_sources,'versions':versions,'native_config':config.to_dict(),
    'model_path':model.relative_to(root).as_posix(),'data_path':public.relative_to(root).as_posix()+'/data',
    'train_ids':[r['id'] for r in train],'test_ids':[r['id'] for r in test],
    'budget':{'scratch_seeds':[73,89,101],'scratch_arms':['response-baseline','dapo-components'],'scratch_max_updates':24,'scratch_max_new_training_tokens':1536,'native_updates':2,'native_max_new_training_tokens':64,'constructed_native_cases':6},
    'preparation':{'AST_parsed':11,'exact_helpers':4,'config_only':True,'models':0,'forwards':0,'finite_stage_runs':0}}
out=folder/'program-inputs.json';out.write_text(json.dumps(packet,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'packet':sha(out),'bindings':len(files),'installed_sources':len(package_sources),'models':0,'config':'passed'}))
