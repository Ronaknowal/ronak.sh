"""An explicit causal visual-prefix decoder and a frozen-gradient experiment.

Run: python visual_prefix.py
Requires PyTorch. Random receiver weights teach derivative/target contracts only.
"""
import json
import math
import torch
from torch import nn
import torch.nn.functional as F


class TinyDecoder(nn.Module):
    def __init__(self, width=12, vocabulary=9, max_positions=20):
        super().__init__()
        self.embedding = nn.Embedding(vocabulary, width)
        self.position = nn.Embedding(max_positions, width)
        self.q = nn.Linear(width, width, bias=False)
        self.k = nn.Linear(width, width, bias=False)
        self.v = nn.Linear(width, width, bias=False)
        self.o = nn.Linear(width, width, bias=False)
        self.norm1 = nn.LayerNorm(width)
        self.up = nn.Linear(width, 2 * width)
        self.down = nn.Linear(2 * width, width)
        self.norm2 = nn.LayerNorm(width)
        self.head = nn.Linear(width, vocabulary, bias=False)

    def forward(self, embedded):
        length = embedded.shape[1]
        h = embedded + self.position(torch.arange(length))[None]
        scores = self.q(h) @ self.k(h).transpose(-1, -2) / math.sqrt(h.shape[-1])
        permitted = torch.ones(length, length, dtype=torch.bool).tril()
        attention = scores.masked_fill(~permitted, -torch.inf).softmax(-1)
        h = self.norm1(h + self.o(attention @ self.v(h)))
        h = self.norm2(h + self.down(F.gelu(self.up(h))))
        return self.head(h)


def answer_loss(logits, labels):
    """Input position t predicts the target stored at position t+1."""
    shifted_targets = labels[:, 1:]
    selected = shifted_targets != -100
    if not bool(selected.any()):
        return None  # Undefined mean: caller skips the optimizer step.
    return F.cross_entropy(logits[:, :-1][selected], shifted_targets[selected])


def assemble(decoder, projector, visual_features, prompt_ids, answer_ids):
    visual = projector(visual_features)
    text_ids = torch.cat([prompt_ids, answer_ids], dim=1)
    embedded = torch.cat([visual, decoder.embedding(text_ids)], dim=1)
    prefix_length = visual.shape[1] + prompt_ids.shape[1]
    labels = torch.full((1, embedded.shape[1]), -100, dtype=torch.long)
    labels[:, prefix_length:] = answer_ids
    return embedded, labels


@torch.no_grad()
def generate(decoder, projector, features, prompt_ids, max_new=4, eos=2):
    embedded = torch.cat([projector(features), decoder.embedding(prompt_ids)], 1)
    output = []
    for _ in range(max_new):
        next_id = int(decoder(embedded)[0, -1].argmax())
        output.append(next_id)
        if next_id == eos:
            break
        embedded = torch.cat([embedded, decoder.embedding(torch.tensor([[next_id]]))], 1)
    return output


def main():
    torch.set_num_threads(1)
    torch.manual_seed(17)
    decoder = TinyDecoder()
    decoder.requires_grad_(False)
    projector = nn.Sequential(nn.Linear(4,12), nn.GELU(), nn.Linear(12,12))
    # Two stipulated visual feature rows; this file does not train a vision tower.
    features = torch.tensor([[[1.,0.,.5,-.5], [0.,1.,-.5,.5]]])
    prompt = torch.tensor([[3,4]])
    answer = torch.tensor([[5,2]])  # A content ID followed by EOS.
    frozen_before = {k:v.clone() for k,v in decoder.state_dict().items()}
    bridge_before = projector[0].weight.detach().clone()
    optimizer = torch.optim.SGD(projector.parameters(), lr=.1)
    embedded, labels = assemble(decoder, projector, features, prompt, answer)
    logits = decoder(embedded)
    loss = answer_loss(logits, labels)
    optimizer.zero_grad()
    loss.backward()
    gradient_norm = float(projector[0].weight.grad.norm())
    optimizer.step()
    new_embedded, _ = assemble(decoder, projector, features, prompt, answer)
    next_loss = answer_loss(decoder(new_embedded), labels)
    # Freezing weights permits input derivatives; no_grad removes this route.
    with torch.no_grad():
        detached_logits = decoder(new_embedded)
    broken_loss = answer_loss(detached_logits, labels)
    print(json.dumps({
        "input_positions":["visual0","visual1","prompt0","prompt1","answer0","EOS"],
        "labels":labels.tolist(), "first_answer_predicted_at_logit_position":3,
        "loss_before":float(loss.detach()), "loss_after":float(next_loss.detach()),
        "projector_gradient_norm":gradient_norm,
        "projector_weight_change":float((projector[0].weight.detach() - bridge_before).abs().max()),
        "frozen_weights_identical":all(torch.equal(v, frozen_before[k]) for k,v in decoder.state_dict().items()),
        "no_grad_loss_requires_grad":broken_loss.requires_grad,
        "generated_ids":generate(decoder, projector, features, prompt),
    }, indent=2))


if __name__ == "__main__":
    main()
