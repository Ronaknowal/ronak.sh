"""Bounded numerical/shape edges; never reruns either alignment fit."""
import hashlib
import json
import sys
from pathlib import Path
import torch
from torch import nn
import torch.nn.functional as F

root = Path(__file__).resolve().parents[1]
programs = root / 'public/learn-code/multimodal-pretraining'
sys.path.insert(0, str(programs))
from visual_prefix import TinyDecoder, assemble, answer_loss

torch.set_num_threads(1)
torch.manual_seed(31)
decoder = TinyDecoder().double().requires_grad_(False)
projector = nn.Linear(4, 12).double()
features = torch.tensor([[[.2, -.1, .7, 1.], [.5, .3, -.4, .2]]], dtype=torch.float64)
prompt, answer = torch.tensor([[3, 4]]), torch.tensor([[6, 2]])
embedded, labels = assemble(decoder, projector, features, prompt, answer)
logits = decoder(embedded)
loss = answer_loss(logits, labels)
loss.backward()
conditions = []
def check(value, name):
    assert value, name
    conditions.append(name)

check(labels.tolist() == [[-100, -100, -100, -100, 6, 2]], 'exact shifted-label assembly')
check(torch.allclose(loss, F.cross_entropy(logits[0, 3:5], torch.tensor([6, 2]))), 'first answer scored by final prompt logit')
check(answer_loss(logits, torch.full_like(labels, -100)) is None, 'all-ignored mean undefined sentinel')
check(projector.weight.grad.norm() > 0, 'frozen decoder passes input gradient')
check(all(p.grad is None for p in decoder.parameters()), 'frozen decoder has no parameter gradients')
with torch.no_grad():
    stopped = answer_loss(decoder(embedded), labels)
check(not stopped.requires_grad, 'no_grad severs the backward route')
before = projector.weight.detach().clone()
epsilon = 1e-5
with torch.no_grad():
    projector.weight[0, 0] += epsilon
    plus = answer_loss(decoder(assemble(decoder, projector, features, prompt, answer)[0]), labels)
    projector.weight[0, 0] -= 2 * epsilon
    minus = answer_loss(decoder(assemble(decoder, projector, features, prompt, answer)[0]), labels)
    projector.weight.copy_(before)
estimate = (plus - minus) / (2 * epsilon)
check(abs(float(estimate - projector.weight.grad[0, 0])) < 1e-8, 'projector derivative finite difference')
altered = embedded.detach().clone()
altered[:, 5] += 100
check(torch.equal(decoder(altered)[:, :5], logits.detach()[:, :5]), 'future EOS input cannot change earlier logits')
receipt = {'conditions': conditions, 'finite_difference': float(estimate), 'autograd': float(projector.weight.grad[0, 0]),
           'scope': 'Changed-seed explicit prefix fixture; no optimizer campaign or alignment refit.',
           'files': {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__), programs / 'visual_prefix.py']}}
destination = root / 'docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment/native/prefix-edge-checks.json'
destination.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
print(json.dumps(receipt, indent=2))
