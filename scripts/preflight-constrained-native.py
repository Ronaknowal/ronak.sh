"""Technical lifecycle preflight only; random tiny weights, no Iris/model study."""
import hashlib
import importlib.metadata as metadata
import json
from pathlib import Path
import traceback

BASE = Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar')
TARGET = BASE / 'research/native-preflight.json'
assert not TARGET.exists(), 'Preserve an existing attempt; use an explicit successor'
report = {'purpose': __doc__, 'checks': [], 'passed': False,
          'programSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
def check(name, condition, actual=None):
    report['checks'].append({'name': name, 'passed': bool(condition), 'actual': actual})
    TARGET.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    assert condition, name

try:
    import torch
    import xgrammar as xgr
    import outlines
    from tokenizers import Tokenizer, models, pre_tokenizers, decoders
    from transformers import PreTrainedTokenizerFast, GPT2Config, GPT2LMHeadModel, GenerationConfig
    from xgrammar.contrib.hf import LogitsProcessor
    report['versions'] = {p: metadata.version(p) for p in ['torch','transformers','xgrammar','outlines','outlines_core','tokenizers']}
    vocabulary = [b'abc',b'42',b'7',b'3x',b'<EOS>']
    info=xgr.TokenizerInfo(vocabulary, stop_token_ids=[4], vocab_size=8)
    compiler=xgr.GrammarCompiler(info, max_threads=1)
    compiled=compiler.compile_regex(r'[0-9]+(\.[0-9]+)?')
    matcher=xgr.GrammarMatcher(compiled)
    def allowed(m):
        mask=xgr.allocate_token_bitmask(1,8)
        m.fill_next_token_bitmask(mask)
        logits=torch.zeros((1,8), dtype=torch.float32)
        xgr.apply_token_bitmask_inplace(logits,mask)
        return torch.isfinite(logits[0]).nonzero().flatten().tolist()
    check('initial mask excludes partial-invalid and padding',allowed(matcher)==[1,2],allowed(matcher))
    check('accept whole number token',matcher.accept_token(1))
    check('complete is not terminated',matcher.is_completed() and not matcher.is_terminated())
    sibling=matcher.fork()
    before=allowed(matcher)
    check('accept EOS in fork',sibling.accept_token(4))
    check('fork isolation',sibling.is_terminated() and not matcher.is_terminated() and allowed(matcher)==before)
    matcher.rollback()
    check('rollback restores initial',allowed(matcher)==[1,2])
    check('invalid token rejected atomically',not matcher.accept_token(3) and allowed(matcher)==[1,2])
    matcher.reset()
    check('reset initial',allowed(matcher)==[1,2])

    # Exact character tokenizer and small random model isolate the API lifecycle.
    chars=[chr(i) for i in range(32,127)]+['<EOS>']
    vocab={c:i for i,c in enumerate(chars)}
    backend=Tokenizer(models.WordLevel(vocab,unk_token='<EOS>'))
    backend.pre_tokenizer=pre_tokenizers.Split('',behavior='isolated')
    backend.decoder=decoders.Fuse()
    tok=PreTrainedTokenizerFast(tokenizer_object=backend,eos_token='<EOS>',pad_token='<EOS>')
    torch.manual_seed(183)
    torch.set_num_threads(2)
    model=GPT2LMHeadModel(GPT2Config(vocab_size=len(chars),n_layer=1,n_head=2,n_embd=16,n_positions=64,bos_token_id=95,eos_token_id=95,pad_token_id=95)).eval()
    cfg=GenerationConfig(max_new_tokens=8,do_sample=False,num_beams=1,eos_token_id=95,pad_token_id=95,use_cache=True)
    compiled=xgr.GrammarCompiler(xgr.TokenizerInfo.from_huggingface(tok,vocab_size=model.config.vocab_size),max_threads=1).compile_json_schema({'type':'string','enum':['ok']},any_whitespace=False)
    processor=LogitsProcessor(compiled)
    inputs=tok('x',return_tensors='pt')
    with torch.inference_mode():
        out=model.generate(**inputs,generation_config=cfg,logits_processor=[processor])
    ids=out[0,inputs['input_ids'].shape[1]:].tolist()
    text=tok.decode(ids,skip_special_tokens=True)
    check('HF processor full ordinary route',text=='"ok"' and ids[-1]==95,{'ids':ids,'text':text})
    check('HF processor last emitted EOS is not yet accepted',processor.matchers[0].is_completed() and not processor.matchers[0].is_terminated())
    native=outlines.from_transformers(model,tok)
    generator=outlines.Generator(native,outlines.types.JsonSchema({'type':'string','enum':['ok']}),backend='outlines_core')
    with torch.inference_mode():
        text=generator('x',generation_config=cfg)
    check('Outlines returns complete text',isinstance(text,str) and json.loads(text)=='ok',text)
    with torch.inference_mode():
        second=generator('y',generation_config=cfg)
    check('Outlines resets between calls',json.loads(second)=='ok',second)
    report['passed']=True
except BaseException as exc:
    report['failure']=repr(exc)
    report['traceback']=traceback.format_exc()
    raise
finally:
    TARGET.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'target':str(TARGET),'passed':report['passed'],'checks':len(report['checks']),'failure':report.get('failure')}))
