"""Explicit projections and stable masked attention versus ordinary PyTorch.

An empty support row has valid=False; its zero buffer is not a probability.
"""
import copy
import math
import torch
from torch import nn
from torch.nn import functional as F


class StructuralRead(nn.Module):
    def __init__(self,channels=3,width=2):
        super().__init__()
        self.query=nn.Linear(channels,width)
        self.key=nn.Linear(channels,width)
        self.value=nn.Linear(channels,width)

    def forward(self,features,bias,allowed,library=False):
        if library:
            q,k,v=self.query(features),self.key(features),self.value(features)
        else:
            q=features@self.query.weight.T+self.query.bias
            k=features@self.key.weight.T+self.key.bias
            v=features@self.value.weight.T+self.value.bias
        valid=allowed.any(-1)
        if library:
            # The API receives a safe row for undefined cases. Its result is
            # replaced by a zero storage buffer and accompanied by valid=False.
            safe=allowed.clone()
            safe[~valid,0]=True
            mask=torch.where(safe,bias,-torch.inf)
            output=F.scaled_dot_product_attention(q[None,None],k[None,None],
                       v[None,None],attn_mask=mask,dropout_p=0.)[0,0]
            output=torch.where(valid[:,None],output,0.)
            return output,valid
        scores=q@k.T/math.sqrt(q.shape[-1])+bias
        masked=torch.where(allowed,scores,-torch.inf)
        maximum=masked.max(-1,keepdim=True).values
        maximum=torch.where(valid[:,None],maximum,0.)
        masses=torch.where(allowed,torch.exp(scores-maximum),0.)
        weights=masses/masses.sum(-1,keepdim=True).clamp_min(1)
        return weights@v,valid


def main():
    torch.manual_seed(23)
    torch.set_num_threads(1)
    features=torch.tensor([[1.,.2,-.3],[-.4,.7,.1],[.8,-.6,.4]],dtype=torch.float64)
    bias=torch.tensor([[0.,-.7,-1.4],[-.7,0.,-.7],[-1.4,-.7,0.]],dtype=torch.float64)
    allowed=torch.tensor([[True,True,False],[True,True,True],[False,True,True]])
    scratch=StructuralRead().double()
    library=copy.deepcopy(scratch)
    left=[v.clone().requires_grad_() for v in (features,bias)]
    right=[v.clone().requires_grad_() for v in (features,bias)]
    actual,valid=scratch(*left,allowed)
    expected,other_valid=library(*right,allowed,library=True)
    torch.testing.assert_close(actual,expected,atol=1e-12,rtol=1e-12)
    assert torch.equal(valid,other_valid)
    actual.square().sum().backward()
    expected.square().sum().backward()
    maximum=0.
    for a,b in zip(left+list(scratch.parameters()),right+list(library.parameters()),strict=True):
        maximum=max(maximum,float((a.grad-b.grad).abs().max()))
        torch.testing.assert_close(a.grad,b.grad,atol=1e-11,rtol=1e-11)
    torch.optim.SGD(scratch.parameters(),lr=.03).step()
    torch.optim.SGD(library.parameters(),lr=.03).step()
    for a,b in zip(scratch.parameters(),library.parameters(),strict=True):
        torch.testing.assert_close(a,b,atol=1e-12,rtol=1e-12)
    print('explicit nonzero-content output:',actual.detach().tolist())
    print('all input/bias/parameter gradients maximum error:',maximum)
    print('one SGD step: matched')
    empty=allowed.clone();empty[1]=False
    output,defined=scratch(features,bias,empty)
    print('empty receiver status:',defined.tolist(),'storage row:',output[1].tolist())


if __name__=='__main__':
    main()
