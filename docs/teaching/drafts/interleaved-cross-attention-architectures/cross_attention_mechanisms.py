"""Rectangular attention, complete local pullback and ordinary torch bridges.

Run: python -B cross_attention_mechanisms.py
Dependencies: NumPy and CPU PyTorch. No download, fitting or evidence writer.
Rows contain features; every learned weight is out-by-in, as in nn.Linear.
The pullback covers deterministic attention and its four linear maps. Residual,
normalization, dropout and an enclosing loss are explicit additional operations.
"""
import math
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


def array(value, name, rank):
    result = np.asarray(value, dtype=np.float64)
    if result.ndim != rank or not np.isfinite(result).all():
        raise ValueError(f"{name} must be a finite rank-{rank} array")
    return result


def head(query, key, value, allowed=None):
    """Already projected 2-D arrays. True means permitted; empty rows reject."""
    q, k, v = [array(x, n, 2) for x, n in
               ((query, 'query'), (key, 'key'), (value, 'value'))]
    if not q.shape[0] or not k.shape[0] or not q.shape[1] or not v.shape[1]:
        raise ValueError("Rows and feature widths must be positive")
    if q.shape[1] != k.shape[1] or k.shape[0] != v.shape[0]:
        raise ValueError("Matching widths and donor rows must agree")
    permission = np.ones((len(q), len(k)), dtype=bool) if allowed is None else np.asarray(allowed)
    if permission.dtype != np.bool_ or permission.shape != (len(q), len(k)):
        raise ValueError("allowed must be a Boolean query-by-memory grid")
    if not permission.any(axis=-1).all():
        raise ValueError("Every query needs at least one permitted donor")
    scale = math.sqrt(q.shape[1])
    scores = q @ k.T / scale
    legal = np.where(permission, scores, -np.inf)
    masses = np.exp(legal - legal.max(axis=-1, keepdims=True))
    weights = masses / masses.sum(axis=-1, keepdims=True)
    output = weights @ v
    tape = dict(q=q, k=k, v=v, allowed=permission, weights=weights, scale=scale)
    return output, dict(scores=scores, legal=legal, masses=masses,
                        weights=weights, products=weights[..., None]*v[None], tape=tape)


def head_pullback(tape, output_credit):
    """Credit means a derivative of the enclosing scalar loss at this output."""
    q, k, v, a = (tape[n] for n in ('q', 'k', 'v', 'weights'))
    g = array(output_credit, 'output credit', 2)
    if g.shape != (len(q), v.shape[1]):
        raise ValueError("Output credit must have the output's shape")
    dv = a.T @ g
    da = g @ v.T
    # Each softmax row subtracts its weighted mean credit before multiplying.
    ds = a * (da - (a*da).sum(axis=-1, keepdims=True))
    ds = np.where(tape['allowed'], ds, 0.)
    dq, dk = ds @ k / tape['scale'], ds.T @ q / tape['scale']
    return dict(query=dq, key=dk, value=dv, shares=da, scores=ds)


def linear(x, weight, bias):
    return x @ weight.T + bias


def cross_block(readers, memory, state, heads, allowed=None):
    """Different raw source widths; independent matching and carried widths.

    No residual or normalization is silently applied. Returns mapped update.
    State: q/k/v/o weights and biases, all out-by-in. Heads split coordinates.
    """
    x, m = array(readers, 'readers', 2), array(memory, 'memory', 2)
    if not isinstance(heads, int) or heads < 1:
        raise ValueError("heads must be a positive integer")
    s = {name: array(state[name], name, 2 if name.endswith('weight') else 1)
         for name in ('q_weight','q_bias','k_weight','k_bias',
                      'v_weight','v_bias','o_weight','o_bias')}
    for prefix, width in [('q', x.shape[1]), ('k', m.shape[1]), ('v', m.shape[1])]:
        w, b = s[prefix+'_weight'], s[prefix+'_bias']
        if w.shape[1] != width or b.shape != (w.shape[0],) or w.shape[0] % heads:
            raise ValueError(f"Invalid {prefix} projection dimensions")
    if s['q_weight'].shape[0] != s['k_weight'].shape[0]:
        raise ValueError("Projected query/key widths must agree")
    if s['o_weight'].shape != (x.shape[1], s['v_weight'].shape[0]) or s['o_bias'].shape != (x.shape[1],):
        raise ValueError("Output map must join carried coordinates to reader width")
    q, k, v = (linear(z, s[p+'_weight'], s[p+'_bias'])
               for p,z in [('q',x),('k',m),('v',m)])
    split = lambda z: np.split(z, heads, axis=-1)
    reads = [head(qh,kh,vh,allowed) for qh,kh,vh in zip(split(q),split(k),split(v))]
    joined = np.concatenate([r[0] for r in reads], axis=-1)
    output = linear(joined,s['o_weight'],s['o_bias'])
    return output, dict(x=x,m=m,state=s,q=q,k=k,v=v,reads=reads,joined=joined,output=output)


def cross_pullback(tape, output_credit):
    """All raw-source, weight and bias gradients for the exact local block."""
    g = array(output_credit,'output credit',2)
    if g.shape != tape['output'].shape:
        raise ValueError("Output credit shape differs from mapped output")
    s, x, m = tape['state'],tape['x'],tape['m']
    gradients={'o_weight':g.T@tape['joined'],'o_bias':g.sum(axis=0)}
    joined_credit=g@s['o_weight']
    credits=[head_pullback(r[1]['tape'],gh) for r,gh in
             zip(tape['reads'],np.split(joined_credit,len(tape['reads']),axis=-1))]
    dq,dk,dv=(np.concatenate([c[n] for c in credits],axis=-1)
              for n in ('query','key','value'))
    for p,z,d in [('q',x,dq),('k',m,dk),('v',m,dv)]:
        gradients[p+'_weight']=d.T@z
        gradients[p+'_bias']=d.sum(axis=0)
    return dict(readers=dq@s['q_weight'],memory=dk@s['k_weight']+dv@s['v_weight'],
                parameters=gradients,heads=credits)


class CrossBlock(nn.Module):
    """Explicit torch split/read/join with arbitrary positive d_k and d_v."""
    def __init__(self, reader_width, memory_width, heads, key_width, value_width):
        super().__init__()
        if any(not isinstance(v,int) or v < 1 for v in
               (reader_width,memory_width,heads,key_width,value_width)):
            raise ValueError("All dimensions must be positive integers")
        self.heads,self.dk,self.dv=heads,key_width,value_width
        self.q=nn.Linear(reader_width,heads*key_width)
        self.k=nn.Linear(memory_width,heads*key_width)
        self.v=nn.Linear(memory_width,heads*value_width)
        self.o=nn.Linear(heads*value_width,reader_width)

    def forward(self, readers, memory, allowed=None, library=False):
        if readers.ndim != 3 or memory.ndim != 3 or readers.shape[0] != memory.shape[0]:
            raise ValueError("Use matching batches of N×T×d_r and N×S×d_m")
        n,t,_=readers.shape;s=memory.shape[1]
        split=lambda z,d:z.reshape(n,-1,self.heads,d).transpose(1,2)
        q,k,v=split(self.q(readers),self.dk),split(self.k(memory),self.dk),split(self.v(memory),self.dv)
        if allowed is None: allowed=torch.ones((t,s),dtype=torch.bool,device=q.device)
        if allowed.dtype != torch.bool or allowed.shape != (t,s) or not allowed.any(-1).all():
            raise ValueError("Use a nonempty Boolean T×S allowed grid")
        scores=(q@k.transpose(-2,-1)/math.sqrt(self.dk)).masked_fill(~allowed,-torch.inf)
        shares=scores.softmax(-1)
        read=F.scaled_dot_product_attention(q,k,v,attn_mask=allowed,dropout_p=0.) if library else shares@v
        joined=read.transpose(1,2).reshape(n,t,self.heads*self.dv)
        return self.o(joined),shares


class SlotResampler(nn.Module):
    """Learned requests change row count; they are not fixed image quadrants."""
    def __init__(self, memory_width=24, slots=4, width=24, heads=3):
        super().__init__()
        self.slots=nn.Parameter(torch.randn(slots,width)*.02)
        self.read=CrossBlock(width,memory_width,heads,width//heads,width//heads)

    def forward(self,memory):
        queries=self.slots.unsqueeze(0).expand(memory.shape[0],-1,-1)
        return self.read(queries,memory)[0]


class GatedResidual(nn.Module):
    def __init__(self, adapter):
        super().__init__();self.adapter=adapter;self.alpha=nn.Parameter(torch.zeros(()))
    def forward(self,readers,memory):
        update,_=self.adapter(readers,memory)
        return readers+self.alpha.tanh()*update


def main():
    torch.set_num_threads(1)
    q=np.eye(2)*math.sqrt(2);k=np.array([[math.log(2),0],[0,math.log(2)],[0,0]])
    v=np.array([[2.,0],[0,4],[2,2]])
    out,t=head(q,k,v);credit=out-np.array([[.5,2.5],[1,2.5]])
    pull=head_pullback(t['tape'],credit)
    np.testing.assert_allclose(out,[[1.5,1.5],[1,2.5]])
    np.testing.assert_allclose(pull['value'],[[.5,-.5],[.25,-.25],[.25,-.25]])
    np.testing.assert_allclose(pull['key'],[[1,0],[-1,0],[0,0]],atol=1e-15)
    # Distinct raw widths and carried width are deliberately different here.
    torch.manual_seed(821)
    model=CrossBlock(5,7,2,3,4).double()
    x=torch.randn(1,3,5,dtype=torch.float64,requires_grad=True)
    memory=torch.randn(1,4,7,dtype=torch.float64,requires_grad=True)
    allowed=torch.tensor([[1,1,0,0],[0,1,1,0],[1,0,1,1]],dtype=torch.bool)
    explicit,weights=model(x,memory,allowed);native,_=model(x,memory,allowed,library=True)
    torch.testing.assert_close(explicit,native,rtol=1e-12,atol=1e-12)
    state={p+'_'+kind:getattr(getattr(model,p),kind).detach().numpy()
           for p in ('q','k','v','o') for kind in ('weight','bias')}
    result,tape=cross_block(x.detach().numpy()[0],memory.detach().numpy()[0],state,2,allowed.numpy())
    g=np.linspace(-.7,.8,result.size).reshape(result.shape)
    expected=cross_pullback(tape,g);(explicit*torch.tensor(g)[None]).sum().backward()
    np.testing.assert_allclose(result,explicit.detach().numpy()[0],atol=1e-12)
    np.testing.assert_allclose(expected['readers'],x.grad[0].numpy(),atol=1e-12)
    np.testing.assert_allclose(expected['memory'],memory.grad[0].numpy(),atol=1e-12)
    for p in ('q','k','v','o'):
        for kind in ('weight','bias'):
            np.testing.assert_allclose(expected['parameters'][p+'_'+kind],getattr(getattr(model,p),kind).grad.numpy(),atol=1e-12)
    # MHA's ordinary route uses one projected width; kdim/vdim are RAW widths.
    mha=nn.MultiheadAttention(8,2,kdim=6,vdim=4,batch_first=True,dropout=0).double()
    reader=torch.randn(1,2,8,dtype=torch.float64);keys=torch.randn(1,3,6,dtype=torch.float64);values=torch.randn(1,3,4,dtype=torch.float64)
    permit=torch.tensor([[1,1,0],[1,0,1]],dtype=torch.bool)
    answer,shares=mha(reader,keys,values,attn_mask=~permit,need_weights=True,average_attn_weights=False)
    split=lambda z:z.reshape(1,-1,2,4).transpose(1,2)
    projected_q=split(F.linear(reader,mha.q_proj_weight,mha.in_proj_bias[:8]))
    projected_k=split(F.linear(keys,mha.k_proj_weight,mha.in_proj_bias[8:16]))
    projected_v=split(F.linear(values,mha.v_proj_weight,mha.in_proj_bias[16:]))
    joined=F.scaled_dot_product_attention(projected_q,projected_k,projected_v,attn_mask=permit,dropout_p=0).transpose(1,2).reshape(1,2,8)
    torch.testing.assert_close(answer,F.linear(joined,mha.out_proj.weight,mha.out_proj.bias),rtol=1e-12,atol=1e-12)
    # Freezing parameter updates does not detach the input's derivative.
    a=torch.tensor(1.,requires_grad=True);frozen=torch.tensor(2.,requires_grad=False)
    loss=.5*(frozen*a-3)**2;loss.backward();torch.testing.assert_close(a.grad,torch.tensor(-2.))
    print('Exact read:',out.tolist())
    print('Third donor key/value credits:',pull['key'][2].tolist(),pull['value'][2].tolist())
    print('Complete projection pullback, manual/SDPA and same-state MHA: passed')
    print('Frozen weight input credit:',float(a.grad))


if __name__=='__main__':
    main()
