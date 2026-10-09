"""Freeze source/program/model/prompt identity before any corpus generation."""
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import inspect
import json
from pathlib import Path
import sys
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, TemperatureLogitsWarper, TopPLogitsWarper

ROOT=Path(__file__).resolve().parents[1]
CODE=ROOT/'public/learn-code/synthetic-data'
FOLDER=ROOT/'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
sys.path.insert(0,str(CODE))
from synthetic_generate import MODEL,REVISION,SETTINGS,prompt_for,INSTRUCTIONS
from synthetic_corpus import read_sources,WindowPool
hash_file=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
relative=lambda p:str(p.relative_to(ROOT)).replace('\\','/')
review=json.loads((FOLDER/'design-review-acceptance.json').read_text())
for p,h in review['bindings'].items():assert hash_file(ROOT/p)==h,p
preflight=json.loads((FOLDER/'programs-preflight.json').read_text(encoding='utf-8'))
for p,h in preflight['bindings'].items():assert hash_file(ROOT/p)==h,p
cache=ROOT/'scratch/constitutional-ai/model-cache'
torch.set_num_threads(2)
tokenizer=AutoTokenizer.from_pretrained(MODEL,revision=REVISION,cache_dir=str(cache),local_files_only=True)
model=AutoModelForSeq2SeqLM.from_pretrained(MODEL,revision=REVISION,cache_dir=str(cache),local_files_only=True).eval()
config=model.generation_config.to_dict(); config.update(SETTINGS)
sources=read_sources()
prompts=[]
for row in sources['records']:
    if row['split']!='train':continue
    for style in INSTRUCTIONS:
        prompt=prompt_for(row['text'],style); ids=tokenizer(prompt)['input_ids']
        prompts.append({'id':f"{row['id']}-{style}",'source_id':row['id'],'style':style,
                        'seed':73+len(prompts),'prompt':prompt,'full_input_ids':ids,
                        'retained_input_ids':ids[:512],'truncated':len(ids)>512})
snapshot=cache/f'models--google--flan-t5-small/snapshots/{REVISION}'
model_files={p.name:hash_file(p) for p in snapshot.iterdir() if p.is_file()}
bindings={relative(p):hash_file(p) for p in CODE.iterdir() if p.is_file()}
for p in [FOLDER/'design.md',FOLDER/'design-review-acceptance.json',FOLDER/'research-continuation.md',FOLDER/'programs-preflight.json',Path(__file__).resolve()]:bindings[relative(p)]=hash_file(p)
result={'at':datetime.now(timezone.utc).isoformat(),'stage':'prospective, before generation and nine scientific fits',
 'bindings':bindings,'source_records':sources,'prompts':prompts,
 'teacher':{'model':MODEL,'revision':REVISION,'parameters':sum(p.numel() for p in model.parameters()),
            'files':model_files,'effective_generation_config':config,'tokenizer':type(tokenizer).__name__,
            'native_tied_weight_warning':'checkpoint shared/output weights differ; native loader does not tie them'},
 'versions':{n:importlib.metadata.version(n) for n in ['torch','numpy','transformers','sentencepiece','tokenizers']},
 'native_source':{cls.__name__:hashlib.sha256(inspect.getsource(cls).encode()).hexdigest() for cls in [TemperatureLogitsWarper,TopPLogitsWarper]},
 'selection':{'minimum_utf8_bytes':33,'normalization':'NFKC then Unicode whitespace collapse',
              'exclude_exact_normalized_parent_copy':True,'dedup':'first normalized candidate globally across output pool',
              'semantic_filter':False,'empty_pool':'abort generated arm; retain all candidates and exclusions'},
 'student':{'seeds':[17,29,43],'arms':['raw','copy','generated'],'steps':300,'batch_windows':16,'context':32,
             'width':32,'heads':2,'layers':2,'vocabulary':256,'dropout':0,'parameters':42624,
             'optimizer':'AdamW','learning_rate':.003,'weight_decay':.01,'clip_norm':1.,'threads':2,
             'targets_per_fit':153600,'raw_windows':WindowPool([r for r in sources['records'] if r['split']=='train']).total,
             'draws':'NumPy default_rng(seed+1000); branch array then window array, each shape300x16',
             'generated_branch':'branch < .5; common uniform maps to eligible-window index',
             'copy_null':'identical raw windows via both branches; independent execution expected exact history/weights',
             'comparison_step':300,'diagnostic_steps':[0,100,200,300],
             'heldout':'every byte after first in each of4 untouched prose records; paragraph reset; total1862',
             'inspector':'seed17 all3 arms; each heldout record positions1,8,32,64, full256 probabilities',
             'saved_weights':'seed17 all3 arms fixed before outcomes'},
 'limits':['same book/adjacent paragraphs','teacher could have memorized source','three paired seeds, no significance claim',
           'CPU timing includes evaluation; no hardware speedup claim','byte perplexity differs from teacher token perplexity']}
with (FOLDER/'prospective-protocol.json').open('x',encoding='utf-8') as stream:json.dump(result,stream,indent=2,ensure_ascii=False);stream.write('\n')
print(json.dumps({'frozen':True,'prompts':len(prompts),'truncated':sum(p['truncated'] for p in prompts),'versions':result['versions'],'sha256':hash_file(FOLDER/'prospective-protocol.json')}))
