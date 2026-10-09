"""Fit one external temperature per frozen model using calibration labels only.

python calibrate_decisions.py --scratch results/scratch/logits.json \
    --native results/laya/logits.json --output results/calibration.json
The five fits (three scratch seeds, lexical, Laya) use the same fixed cohort.
External full-precision probabilities are distinct from Laya's shipped API.
"""
import argparse
import json
from pathlib import Path
import numpy as np

from decision_math import masked_softmax
from train_decision import digest,save_json


def objective(logits,targets,beta):
    z=np.asarray(logits,dtype=np.float64)
    y=np.asarray(targets,dtype=int)
    if z.ndim!=2 or y.shape!=(len(z),) or not len(z) or not np.isfinite(z).all():
        raise ValueError('Finite N by K logits and N targets required')
    if (y<0).any() or (y>=z.shape[1]).any():
        raise ValueError('Target outside candidates')
    scaled=z*beta
    shift=scaled.max(-1,keepdims=True)
    lse=shift[:,0]+np.log(np.exp(scaled-shift).sum(-1))
    p=masked_softmax(z,temperature=1/beta)
    expectation=(p*z).sum(-1)
    return (float((lse-scaled[np.arange(len(y)),y]).mean()),
            float((expectation-z[np.arange(len(y)),y]).mean()),
            float((p*(z-expectation[:,None])**2).sum(-1).mean()))


def fit_beta(logits,targets):
    low,high=.05,20.
    if objective(logits,targets,low)[1]>=0:
        return low,'lower beta boundary'
    if objective(logits,targets,high)[1]<=0:
        return high,'upper beta boundary'
    for _ in range(90):
        middle=(low+high)/2
        if objective(logits,targets,middle)[1]>0:high=middle
        else:low=middle
    return (low+high)/2,'interior stationary point'


def library_reference(logits,targets):
    import torch
    import torch.nn.functional as F
    z=torch.tensor(logits,dtype=torch.float64)
    y=torch.tensor(targets,dtype=torch.long)
    # Sigmoid keeps beta within the same declared [0.05,20] bounds.
    initial=(1-.05)/(20-.05)
    u=torch.tensor(np.log(initial/(1-initial)),dtype=torch.float64,requires_grad=True)
    optimizer=torch.optim.LBFGS([u],lr=1,max_iter=150,tolerance_grad=1e-11,
                              tolerance_change=1e-14,line_search_fn='strong_wolfe')
    def closure():
        optimizer.zero_grad()
        loss=F.cross_entropy(z*(.05+19.95*u.sigmoid()),y)
        loss.backward()
        return loss
    optimizer.step(closure)
    beta=float((.05+19.95*u.sigmoid()).detach())
    return {'beta':beta,'nll':objective(logits,targets,beta)[0]}


def report(logits,targets,temperature=1.,bins=5):
    p=masked_softmax(logits,temperature=temperature)
    y=np.asarray(targets,dtype=int)
    truth=np.eye(p.shape[1])[y]
    correct=p.argmax(-1)==y
    confidence=p.max(-1)
    assignment=np.minimum((confidence*bins).astype(int),bins-1)
    reliability=[]
    for b in range(bins):
        selected=assignment==b
        reliability.append({'left':b/bins,'right':(b+1)/bins,'n':int(selected.sum()),
            'mean_confidence':float(confidence[selected].mean()) if selected.any() else None,
            'accuracy':float(correct[selected].mean()) if selected.any() else None})
    brier=np.square(p-truth).sum(-1)
    # Stable per-row log likelihood instead of logging possibly underflowed p.
    z=np.asarray(logits,dtype=np.float64)/temperature
    shift=z.max(-1)
    nll=shift+np.log(np.exp(z-shift[:,None]).sum(-1))-z[np.arange(len(y)),y]
    return {'n':len(y),'accuracy':float(correct.mean()),'nll':float(nll.mean()),
            'brier_sum':float(brier.mean()),'reliability':reliability,'probabilities':p.tolist(),
            'per_row':{'correct':correct.astype(int).tolist(),'nll':nll.tolist(),'brier_sum':brier.tolist()}}


def bootstrap_difference(raw,calibrated,indices):
    result={}
    for key in ['correct','nll','brier_sum']:
        difference=np.asarray(calibrated['per_row'][key])-np.asarray(raw['per_row'][key])
        samples=difference[indices].mean(-1)
        result[key]={'change':float(difference.mean()),'percentile_95':np.quantile(samples,[.025,.975]).tolist()}
    return result


def run(scratch,native,output):
    methods=json.loads(scratch.read_text(encoding='utf-8'))
    methods['laya']=json.loads(native.read_text(encoding='utf-8'))
    if set(methods)!={'seed-17','seed-29','seed-43','lexical','laya'}:
        raise ValueError('The predeclared five predictors are required')
    reference=methods['seed-17']
    indices=np.random.default_rng(113).integers(0,120,size=(1000,120))
    result={}
    for name,data in methods.items():
        for split in ['calibration','test']:
            if data[split]['ids']!=reference[split]['ids'] or data[split]['targets']!=reference[split]['targets']:
                raise ValueError('Models must refer to identical ordered events/labels')
        calibration=data['calibration'];test=data['test']
        z,y=calibration['logits'],calibration['targets']
        beta,boundary=fit_beta(z,y)
        native_fit=library_reference(z,y)
        assert abs(native_fit['nll']-objective(z,y,beta)[0])<1e-7
        temperatures=np.unique(np.r_[np.exp(np.linspace(-3,3,121)),1.])
        losses=[objective(z,y,1/t)[0] for t in temperatures]
        grid_index=int(np.argmin(losses))
        raw=report(test['logits'],test['targets'])
        calibrated=report(test['logits'],test['targets'],1/beta)
        assert raw['per_row']['correct']==calibrated['per_row']['correct']
        result[name]={'beta':beta,'temperature':1/beta,'boundary':boundary,
            'calibration_nll':objective(z,y,beta)[0],'derivative':objective(z,y,beta)[1],
            'curvature':objective(z,y,beta)[2],'library_fit':native_fit,
            'project_grid':{'temperature':float(temperatures[grid_index]),'nll':losses[grid_index],
                            'range':'exp(-3) to exp(3); distinct from exact external bounds'},
            'calibration_curve':[{'beta':float(b),'nll':objective(z,y,b)[0]} for b in np.geomspace(.05,20,81)],
            'calibration':report(z,y,1/beta),'test_raw':raw,'test_calibrated':calibrated,
            'paired_bootstrap':bootstrap_difference(raw,calibrated,indices)}
    save_json(output,{'scope':'one scalar external fit per frozen predictor; no weight updates',
        'input_sha256':{'scratch':digest(scratch),'native':digest(native)},'seed':113,'resamples':1000,
        'methods':result,'warning':'N=120 paired percentile intervals describe this cohort, not broad deployment guarantees'})


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ['scratch','native','output']:parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args();run(args.scratch,args.native,args.output)
