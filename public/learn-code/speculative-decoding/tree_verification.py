"""Actual ancestor-masked TinyLM forward and exact ordered proposal correction.

python tree_verification.py
The small packed tree is a correctness fixture, not a full SpecInfer engine.
"""

from collections import defaultdict
from fractions import Fraction as F
import itertools
import json
import math
import torch
from tiny_causal_lm import TinyLM


def tree_layout(prompt, tokens, parents):
    if not prompt or len(tokens)!=len(parents):
        raise ValueError("Use a nonempty prefix and one parent per tree node.")
    paths = []
    for index,parent in enumerate(parents):
        if not isinstance(parent,int) or not -1<=parent<index:
            raise ValueError("Parent is -1 for a root or an earlier node index.")
        paths.append(([] if parent==-1 else paths[parent].copy())+[index])
    count = len(prompt)+len(tokens)
    mask = torch.zeros((count,count),dtype=torch.bool)
    mask[:len(prompt),:len(prompt)] = torch.ones((len(prompt),len(prompt)),dtype=torch.bool).tril()
    positions = list(range(len(prompt)))
    for node,path in enumerate(paths):
        row = len(prompt)+node
        mask[row,:len(prompt)] = True
        mask[row,[len(prompt)+i for i in path]] = True
        positions.append(len(prompt)+len(path)-1)
    return paths,positions,mask


@torch.inference_mode()
def tree_forward(model, prompt, tokens, parents):
    paths,positions,mask = tree_layout(prompt,tokens,parents)
    if max(positions)>=model.context:
        raise ValueError("Tree depth exceeds learned positions.")
    ids = torch.tensor(prompt+tokens)
    hidden = model.token(ids)+model.position(torch.tensor(positions))
    for block in model.blocks:
        attention = block.attention
        heads = attention.heads
        width = hidden.shape[-1]//heads
        parts = attention.qkv(block.ln1(hidden)).chunk(3,-1)
        q,k,v = [part.reshape(len(ids),heads,width).transpose(0,1) for part in parts]
        scores = q@k.transpose(-1,-2)/math.sqrt(width)
        weights = scores.masked_fill(~mask,-torch.inf).softmax(-1)
        mixed = (weights@v).transpose(0,1).reshape(len(ids),-1)
        hidden = hidden+attention.out(mixed)
        hidden = hidden+block.mlp(block.ln2(hidden))
    logits = model.head(model.norm(hidden))
    return logits, {"paths":paths,"positions":positions,"allowed":mask.tolist()}


def greedy_traverse(prefix_argmax, node_argmax, tokens, parents, eos=None):
    """Select target argmax if proposed; otherwise emit it and end the round.

    node_argmax[i] is the target next-ID after the path ending at node i.
    Duplicate sibling token paths choose their first listed node consistently.
    """
    emitted,visited = [],[]
    parent = -1
    next_id = prefix_argmax
    while True:
        emitted.append(next_id)
        children = [i for i,p in enumerate(parents) if p==parent and tokens[i]==next_id]
        if not children or next_id==eos:
            return {"ids":emitted,"visited":visited,"target_only":not children}
        parent = children[0]
        visited.append(parent)
        next_id = node_argmax[parent]


def residual_fraction(p,q):
    deficit = tuple(max(a-b,F(0)) for a,b in zip(p,q))
    total = sum(deficit)
    return None if not total else tuple(x/total for x in deficit)


def two_proposal_law(p,q):
    """Two fresh independent q draws, correcting the active residual in order."""
    output = defaultdict(F)
    def visit(active, remaining, branch_mass):
        if remaining==0:
            for token,probability in enumerate(active):
                output[token] += branch_mass*probability
            return
        for token,probability in enumerate(q):
            if not probability:
                continue
            alpha = min(F(1),active[token]/probability)
            output[token] += branch_mass*probability*alpha
            if alpha<1:
                repair = residual_fraction(active,q)
                assert repair is not None
                visit(repair,remaining-1,branch_mass*probability*(1-alpha))
    visit(p,2,F(1))
    return tuple(output[i] for i in range(len(p)))


def biased_preferred(p,q):
    """Wrong: independently test both against p, prefer smallest accepted ID.

    When neither passes, this wrong construction draws directly from p. It
    deliberately demonstrates why 'some accepted node' is not a law proof.
    """
    result = defaultdict(F)
    for x,y in itertools.product(range(len(q)),repeat=2):
        if not q[x]*q[y]:
            continue
        ax,ay = min(F(1),p[x]/q[x]),min(F(1),p[y]/q[y])
        for accept_x,accept_y in itertools.product([False,True],repeat=2):
            mass = q[x]*q[y]*(ax if accept_x else 1-ax)*(ay if accept_y else 1-ay)
            accepted = ([x] if accept_x else [])+([y] if accept_y else [])
            if accepted:
                result[min(accepted)] += mass
            else:
                for token,probability in enumerate(p):
                    result[token] += mass*probability
    return tuple(result[i] for i in range(len(p)))


@torch.inference_mode()
def verify(observer=None):
    observe = observer or (lambda event: None)
    torch.set_num_threads(2)
    torch.manual_seed(181)
    model = TinyLM(19,context=16,width=16,heads=4,layers=3).double().eval()
    prompt,tokens,parents = [1,4,7],[2,5,8,9],[-1,-1,0,1]
    observe({'event':'packed-tree-start','prompt':prompt,'tokens':tokens,'parents':parents})
    logits,layout = tree_forward(model,prompt,tokens,parents)
    observe({'event':'packed-tree','prompt':prompt,'tokens':tokens,'parents':parents,
             'layout':layout,'logits':logits.tolist()})
    errors = []
    for node,path in enumerate(layout['paths']):
        observe({'event':'tree-reference-start','node':node,'path':path})
        full = model(torch.tensor([prompt+[tokens[i] for i in path]]))[0,-1]
        actual = logits[len(prompt)+node]
        observe({'event':'tree-path-comparison','node':node,'path':path,
                 'actual':actual.tolist(),'reference':full.tolist()})
        torch.testing.assert_close(actual,full,atol=1e-12,rtol=1e-12)
        errors.append(float((actual-full).abs().max()))
    assert not layout['allowed'][len(prompt)+1][len(prompt)]
    laws = []
    for p,q in [((F(7,10),F(3,10)),(F(2,5),F(3,5))),
                ((F(1),F(0)),(F(0),F(1))),
                ((F(1,2),F(1,2)),(F(1,2),F(1,2))),
                ((F(3,10),F(2,10),F(5,10)),(F(0),F(6,10),F(4,10)))]:
        actual = two_proposal_law(p,q)
        observe({'event':'two-proposal-law','p':list(map(str,p)),
                 'q':list(map(str,q)),'actual':list(map(str,actual))})
        assert actual==p
        laws.append({'p':list(map(str,p)),'q':list(map(str,q)),'output':list(map(str,actual))})
    p,q = (F(7,10),F(3,10)),(F(2,5),F(3,5))
    wrong = biased_preferred(p,q)
    observe({'event':'wrong-law','p':list(map(str,p)),'q':list(map(str,q)),
             'actual':list(map(str,wrong))})
    assert wrong!=p and sum(wrong)==1
    assert greedy_traverse(2,[8,3,4,6],tokens,parents)['ids']==[2,8,4]
    return {'passed':True,'layout':layout,'max_errors':errors,'laws':laws,
            'biased_output':list(map(str,wrong)),'scope':'Finite exact laws and random-model tree mechanics.'}


if __name__ == '__main__':
    print(json.dumps(verify(),indent=2))
