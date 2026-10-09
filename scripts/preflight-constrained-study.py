"""Bounded technical preflight of the exact study schema/adapters on random tiny weights."""
import os
os.environ['TORCHDYNAMO_DISABLE']='1'
import hashlib
import json
from pathlib import Path
import sys
import traceback
from unittest.mock import patch

base=Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar')
sys.path.insert(0,str((base/'programs').resolve()))
target=base/'research/study-adapter-preflight.json'
assert not target.exists()
report={'purpose':__doc__,'checks':[],'outputs':{},'passed':False}
def check(name,condition):
    report['checks'].append({'name':name,'passed':bool(condition)})
    assert condition,name
try:
    import torch
    import outlines
    import xgrammar as xgr
    from tokenizers import Tokenizer,models,pre_tokenizers,decoders
    from transformers import PreTrainedTokenizerFast,GPT2Config,GPT2LMHeadModel,GenerationConfig
    from xgrammar.contrib.hf import LogitsProcessor
    from generate_native import manual_decode
    from prepare_data import study_schema
    from evaluate import assess
    torch.set_num_threads(1)
    torch.manual_seed(392)
    chars=[chr(i) for i in range(32,127)]+['<EOS>']
    backend=Tokenizer(models.WordLevel({c:i for i,c in enumerate(chars)},unk_token='<EOS>'))
    backend.pre_tokenizer=pre_tokenizers.Split('',behavior='isolated')
    backend.decoder=decoders.Fuse()
    tok=PreTrainedTokenizerFast(tokenizer_object=backend,eos_token='<EOS>',pad_token='<EOS>')
    model=GPT2LMHeadModel(GPT2Config(vocab_size=96,n_layer=1,n_head=2,n_embd=16,n_positions=256,bos_token_id=95,eos_token_id=95,pad_token_id=95)).eval()
    cfg=GenerationConfig(max_new_tokens=48,do_sample=False,num_beams=1,eos_token_id=95,pad_token_id=95,use_cache=True)
    compiler=xgr.GrammarCompiler(xgr.TokenizerInfo.from_huggingface(tok,vocab_size=96),max_threads=1)
    schema=study_schema()
    compiled=compiler.compile_json_schema(schema,any_whitespace=False,separators=(',',':'),any_order=False)
    inputs=tok('Return JSON:',return_tensors='pt')
    manual=manual_decode(model,inputs,compiled,95,48)
    text=tok.decode(manual['generated_ids'],skip_special_tokens=True,clean_up_tokenization_spaces=False)
    report['outputs']['manual']={**manual,'text':text}
    check('Manual cache lifecycle emits complete schema and EOS',manual['status']=='eos' and assess(text,schema,{})['schema'])
    check('Forced choices reach model state',len(manual['trace'])==len(manual['generated_ids']) and any(r['support']==1 for r in manual['trace']))
    generic=compiler.compile_builtin_json_grammar()
    with torch.inference_mode():
        output=model.generate(**inputs,generation_config=cfg,logits_processor=[LogitsProcessor(generic)])
    ids=output[0,inputs['input_ids'].shape[1]:].tolist()
    report['outputs']['generic']={'ids':ids,'text':tok.decode(ids,skip_special_tokens=True),'cap':len(ids)==48}
    check('Generic JSON processor executes with explicit cap',0<len(ids)<=48)
    generator=outlines.Generator(outlines.from_transformers(model,tok),outlines.types.JsonSchema(schema,whitespace_pattern=''),backend='outlines_core')
    captured=[]
    original=model.generate
    def capture(*a,**kw):
        output=original(*a,**kw)
        captured.append(output.detach().cpu())
        return output
    with torch.inference_mode(),patch.object(model,'generate',side_effect=capture):
        returned=generator('Return JSON:',generation_config=cfg)
    ids=captured[0][0,inputs['input_ids'].shape[1]:].tolist()
    text=tok.decode(ids,skip_special_tokens=True,clean_up_tokenization_spaces=False)
    report['outputs']['outlines']={'ids':ids,'text':text,'returned':returned}
    check('Outlines ordinary call intercepted exactly once',len(captured)==1)
    check('Outlines exact returned text matches token decoding',returned==text)
    check('Outlines full finite numeric schema',assess(text,schema,{})['schema'] and ids[-1]==95)
    report['passed']=True
except BaseException as exc:
    report.update({'error':repr(exc),'traceback':traceback.format_exc()})
    raise
finally:
    files=[Path(__file__),base/'programs/generate_native.py',base/'programs/prepare_data.py',base/'programs/evaluate.py']
    report['files']={str(p).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    with target.open('x',encoding='utf-8') as stream:
        json.dump(report,stream,indent=2);stream.write('\n')
    print(json.dumps({'passed':report['passed'],'checks':len(report['checks']),'error':report.get('error')}))
