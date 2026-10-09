"""A small real residual-head training diagnostic, not trained Medusa weights.

python proposal_heads.py
Exactly one constructed SGD update in frozen and joint modes, with matched
initial states and fixed inputs. No corpus, generation or accuracy experiment.
"""

import copy
import json
import torch
from torch import nn
import torch.nn.functional as functional


class ResidualHead(nn.Module):
    def __init__(self,width,vocabulary):
        super().__init__()
        self.projection = nn.Linear(width,width)
        self.output = nn.Linear(width,vocabulary,bias=False)

    def forward(self,hidden):
        return self.output(hidden+functional.silu(self.projection(hidden)))


class ToyProposer(nn.Module):
    def __init__(self,vocabulary=7,width=4,horizons=3):
        super().__init__()
        self.embedding = nn.Embedding(vocabulary,width)
        self.backbone = nn.Linear(width,width)
        self.heads = nn.ModuleList([ResidualHead(width,vocabulary) for _ in range(horizons)])

    def hidden(self,ids):
        return self.backbone(self.embedding(ids)).tanh()


def losses(model,ids,frozen=False,observer=None):
    observe = observer or (lambda event: None)
    hidden = model.hidden(ids)
    if frozen:
        hidden = hidden.detach()
    rows,terms = [],[]
    # At state t, head offset j predicts the known sequence token t+j.
    # This constructed convention starts at offset one and is stated explicitly;
    # a production Medusa checkpoint may count extra heads after its base head.
    for offset,head in enumerate(model.heads,start=1):
        logits = head(hidden[:,:-offset])
        labels = ids[:,offset:]
        loss = functional.cross_entropy(logits.reshape(-1,logits.shape[-1]),labels.reshape(-1))
        selected = logits.log_softmax(-1).gather(-1,labels.unsqueeze(-1)).squeeze(-1)
        observe({'event':'head-loss','frozen':frozen,'offset':offset,'labels':labels.tolist(),
                 'logits':logits.detach().tolist(),'native_loss':float(loss.detach()),
                 'reference_loss':float(-selected.mean().detach())})
        torch.testing.assert_close(loss,-selected.mean(),atol=1e-14,rtol=1e-14)
        rows.append({'offset':offset,'positions':labels.numel(),'labels':labels.tolist(),
                     'mean_ce':float(loss.detach())})
        terms.append(loss)
    return sum(terms),rows


def verify(observer=None):
    observe = observer or (lambda event: None)
    torch.set_num_threads(2)
    torch.manual_seed(191)
    original = ToyProposer().double()
    ids = torch.tensor([[0,1,2,3,4],[4,2,6,1,5]])
    outcomes = []
    for frozen in [True,False]:
        model = copy.deepcopy(original)
        before = {name:parameter.detach().clone() for name,parameter in model.named_parameters()}
        observe({'event':'head-mode-before','frozen':frozen,'ids':ids.tolist(),
                 'parameters':{name:value.tolist() for name,value in before.items()}})
        optimizer = torch.optim.SGD(model.parameters(),lr=.01)
        optimizer.zero_grad(set_to_none=True)
        loss,rows = losses(model,ids,frozen,observer)
        loss.backward()
        gradient = {name:None if parameter.grad is None else float(parameter.grad.norm())
                    for name,parameter in model.named_parameters()}
        observe({'event':'head-gradients','frozen':frozen,'loss':float(loss.detach()),
                 'gradients':{name:None if parameter.grad is None else parameter.grad.tolist()
                              for name,parameter in model.named_parameters()}})
        assert all(parameter.grad is None or torch.isfinite(parameter.grad).all()
                   for parameter in model.parameters())
        backbone_names = [name for name in gradient if not name.startswith('heads.')]
        if frozen:
            assert all(gradient[name] is None for name in backbone_names)
        else:
            assert any(gradient[name] and gradient[name]>0 for name in backbone_names)
        try:
            optimizer.step()
        finally:
            observe({'event':'head-mode-after','frozen':frozen,
                     'parameters':{name:parameter.detach().tolist() for name,parameter in model.named_parameters()}})
        changed = {name:not torch.equal(parameter,before[name])
                   for name,parameter in model.named_parameters()}
        if frozen:
            assert not any(changed[name] for name in backbone_names)
        else:
            assert any(changed[name] for name in backbone_names)
        assert any(changed[name] for name in changed if name.startswith('heads.'))
        outcomes.append({'frozen_backbone':frozen,'loss':float(loss.detach()),
                         'heads':rows,'gradient_norms':gradient,'changed':changed})
        observe({'event':'head-mode-complete','result':outcomes[-1]})
    return {'passed':True,'scope':__doc__,'seed':191,'dtype':'float64',
            'updates_per_mode':1,'learning_rate':.01,'outcomes':outcomes}


if __name__ == '__main__':
    print(json.dumps(verify(),indent=2))
