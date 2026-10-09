"""Compute an original or edited image with the retained cross/seed11 state.

Run beside cross-11-state.json and observed-reads.json:
  python -B saved_cross_image.py --source 127 --question 1 --pixel 9 --value 16
Dependencies: NumPy and CPU PyTorch. This performs inference only: no fitting,
download, historical writer, checkpoint export or other recorded model run.
Raw image counts are 0..16. Questions: 0=digit, 1=even/odd. Outputs: 12 classes.
"""
import argparse
import json
import math
from pathlib import Path
import numpy as np
import torch
from torch import nn


class SavedCrossClassifier(nn.Module):
    """Exact cross branch of the supplied classroom classifier."""
    def __init__(self):
        super().__init__()
        self.query=nn.Embedding(2,24)
        self.patch=nn.Linear(4,24)
        self.position=nn.Parameter(torch.zeros(1,16,24))
        self.read=nn.MultiheadAttention(24,3,dropout=0,batch_first=True)
        self.feed=nn.Sequential(nn.LayerNorm(24),nn.Linear(24,48),nn.GELU(),nn.Linear(48,24))
        self.head=nn.Linear(24,12)

    def forward(self,images,questions):
        patches=images.reshape(-1,4,2,4,2).permute(0,1,3,2,4).reshape(-1,16,4)
        memory=self.patch(patches)+self.position
        query=self.query(questions)[:,None,:]
        update,weights=self.read(query,memory,memory,need_weights=True,average_attn_weights=False)
        hidden=query+update
        final=hidden+self.feed(hidden)
        return self.head(final[:,0]),weights


def validate(pixels,question):
    image=np.asarray(pixels,dtype=np.float64)
    if image.size != 64 or not np.isfinite(image).all() or (image<0).any() or (image>16).any():
        raise ValueError('Supply 64 finite block counts in 0..16')
    if question not in (0,1):
        raise ValueError('Question must be 0=digit or 1=even/odd')
    return image.reshape(8,8)


def stable_softmax(values):
    mass=np.exp(values-values.max(axis=-1,keepdims=True))
    return mass/mass.sum(axis=-1,keepdims=True)


def forward(pixels,question,state):
    """Explicit float64 forward; returns all intermediates used by the drawings.

    No autograd engine is needed for this inference computation. Parameters
    were learned earlier; these arrays are read without modification.
    """
    image=validate(pixels,question)
    s={k:np.asarray(v,dtype=np.float64) for k,v in state.items()}
    lin=lambda x,n:x@s[n+'.weight'].T+s[n+'.bias']
    # Pair within each patch; preserve row-block then column-block addresses.
    patches=(image/16).reshape(4,2,4,2).transpose(0,2,1,3).reshape(16,4)
    memory=lin(patches,'patch')+s['position'][0]
    query=s['query.weight'][question]
    iw,ib=s['read.in_proj_weight'],s['read.in_proj_bias']
    q=(query@iw[:24].T+ib[:24]).reshape(3,8)
    k=(memory@iw[24:48].T+ib[24:48]).reshape(16,3,8).transpose(1,0,2)
    v=(memory@iw[48:].T+ib[48:]).reshape(16,3,8).transpose(1,0,2)
    scores=np.einsum('hd,hsd->hs',q,k)/math.sqrt(8)
    shares=stable_softmax(scores)
    read=np.einsum('hs,hsd->hd',shares,v)
    joined=read.reshape(24)
    update=lin(joined,'read.out_proj')
    hidden=query+update
    mean=hidden.mean();variance=np.mean((hidden-mean)**2)
    normalized=(hidden-mean)/math.sqrt(variance+1e-5)
    normalized=normalized*s['feed.0.weight']+s['feed.0.bias']
    pre=lin(normalized,'feed.1')
    activated=.5*pre*(1+np.array([math.erf(z/math.sqrt(2)) for z in pre]))
    dense=lin(activated,'feed.3')
    final=hidden+dense
    logits=lin(final,'head');probabilities=stable_softmax(logits)
    return dict(patches=patches,memory=memory,query=query,q=q,k=k,v=v,
                scores=scores,shares=shares,read=read,joined=joined,update=update,
                hidden=hidden,mean=mean,variance=variance,normalized=normalized,
                pre=pre,activated=activated,dense=dense,final=final,
                logits=logits,probabilities=probabilities,prediction=int(probabilities.argmax()))


def load_state(path):
    state=json.loads(Path(path).read_text(encoding='utf8'))
    model=SavedCrossClassifier()
    model.load_state_dict({k:torch.tensor(v,dtype=torch.float32) for k,v in state.items()},strict=True)
    model.eval()
    if sum(p.numel() for p in model.parameters()) != 5676:
        raise ValueError('Expected the complete 5,676-parameter cross/seed11 model')
    return state,model


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    here=Path(__file__).resolve().parent
    parser.add_argument('--state',type=Path,default=here/'cross-11-state.json')
    parser.add_argument('--observations',type=Path,default=here/'observed-reads.json')
    parser.add_argument('--source',type=int,default=127)
    parser.add_argument('--question',type=int,choices=(0,1),default=0)
    parser.add_argument('--pixel',type=int,default=None)
    parser.add_argument('--value',type=float,default=16.)
    args=parser.parse_args()
    data=json.loads(args.observations.read_text(encoding='utf8'))
    image=next((r for r in data['images'] if r['source_id']==args.source),None)
    if image is None: raise ValueError('Select an existing retained source ID')
    raw=np.array(image['pixels'],dtype=np.float64).reshape(64).copy()
    if args.pixel is not None:
        if args.pixel not in range(64): raise ValueError('Pixel index must be 0..63')
        raw[args.pixel]=args.value
    validate(raw,args.question)
    torch.set_num_threads(1)
    state,model=load_state(args.state)
    result=forward(raw,args.question,state)
    with torch.no_grad():
        logits,weights=model(torch.tensor(raw.reshape(1,8,8)/16,dtype=torch.float32),torch.tensor([args.question]))
    native=logits.softmax(-1)[0].numpy()
    np.testing.assert_allclose(result['probabilities'],native,rtol=1e-5,atol=1e-5)
    np.testing.assert_allclose(result['shares'],weights[0,:,0].numpy(),rtol=1e-5,atol=1e-5)
    target=image['digit'] if args.question==0 else 10+image['digit']%2
    print(json.dumps(dict(category='computed from retained cross/seed11 state',
                         source_id=args.source,edited=args.pixel is not None,question=args.question,
                         original_source_target=target,prediction=result['prediction'],
                         probabilities=result['probabilities'].tolist(),
                         maximum_native_probability_gap=float(abs(result['probabilities']-native).max()),
                         patch=args.pixel//16*4+(args.pixel%8)//2 if args.pixel is not None else None),indent=2))
    # The source label is only provenance once pixels change, not a new ground truth.


if __name__=='__main__':
    main()
