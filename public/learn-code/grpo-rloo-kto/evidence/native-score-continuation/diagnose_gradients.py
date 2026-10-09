"""Constructed-only full-gradient diagnosis; no generation or optimizer steps."""
import json
import sys
from pathlib import Path

import torch

ROOT=Path(__file__).resolve().parents[5]
sys.path.insert(0,str(ROOT/'public/learn-code/grpo-rloo-kto'))
import trl_group_training as native

output=ROOT/'scratch/grpo-research/gradient-diagnosis'
output.mkdir(parents=True,exist_ok=False)
protocol=json.loads((Path(__file__).resolve().parent.parent/'prospective-protocol.json').read_text())
original_loader=native.load_policy
records=[]
precision='float32'


def compare(actual_loss,expected_loss,parameters,check_step=False):
    parameters=tuple(parameters)
    actual=torch.autograd.grad(actual_loss,parameters,retain_graph=True,allow_unused=True)
    expected=torch.autograd.grad(expected_loss,parameters,allow_unused=True)
    rows=[]
    for index,(a,b) in enumerate(zip(actual,expected)):
        if a is None or b is None:
            rows.append({'parameter':index,'both_absent':a is None and b is None})
            continue
        difference=(a-b).double()
        threshold=2e-5+5e-4*b.abs()
        rows.append({'parameter':index,'shape':list(a.shape),'dtype':str(a.dtype),
                     'maximum_absolute':float(difference.abs().max()),
                     'native_l2':float(a.double().norm()),'scratch_l2':float(b.double().norm()),
                     'difference_l2':float(difference.norm()),
                     'maximum_native_magnitude':float(a.abs().max()),
                     'outside_original_tolerance':int((difference.abs()>threshold).sum()),
                     'elements':a.numel()})
    record={'precision':precision,'case':len(records),
            'native_loss':float(actual_loss.detach()),'scratch_loss':float(expected_loss.detach()),
            'loss_dtype':str(actual_loss.dtype),'parameters':rows,
            'maximum_gradient_difference':max(r.get('maximum_absolute',0) for r in rows),
            'outside_original_tolerance':sum(r.get('outside_original_tolerance',0) for r in rows),
            'shadow_sgd_coordinate_error_bound':1e-5*max(r.get('maximum_absolute',0) for r in rows),
            'optimizer_steps':0,'sampling_calls':0}
    records.append(record)
    with (output/f'case-{len(records)}.json').open('x',encoding='utf-8') as stream:
        json.dump(record,stream,indent=2)
    return {k:v for k,v in record.items() if k!='parameters'}


native.compare_gradients=compare
for precision in ['float32','float64']:
    def loader(path):
        model,tokenizer=original_loader(path)
        if precision=='float64':model.double()
        return model,tokenizer
    native.load_policy=loader
    try:
        native.run(protocol['model'],protocol['data'],'grpo',output/precision,preflight_only=True)
    except Exception as error:
        with (output/(precision+'-failure.json')).open('x',encoding='utf-8') as stream:
            json.dump({'precision':precision,'error':repr(error),'optimizer_steps':0},stream,indent=2)
        raise
with (output/'summary.json').open('x',encoding='utf-8') as stream:
    json.dump([{k:v for k,v in r.items() if k!='parameters'} for r in records],stream,indent=2)
print(json.dumps([{k:r[k] for k in ['precision','case','maximum_gradient_difference','outside_original_tolerance']} for r in records]))
