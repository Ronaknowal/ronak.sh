"""Train a small character decoder on the supplied public-domain Alice split.
Run: python tiny_causal_lm.py --steps 300 --output study.json
Requires PyTorch; CPU, dropout=0, no downloaded model or dataset.
"""
import argparse
import json
import math
from pathlib import Path
import torch
from torch import nn
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parent


class CausalAttention(nn.Module):
    def __init__(self, width, heads):
        super().__init__()
        self.heads = heads
        self.qkv = nn.Linear(width, 3 * width, bias=False)
        self.out = nn.Linear(width, width, bias=False)

    def forward(self, x, fused=False):
        batch, length, width = x.shape
        head_width = width // self.heads
        parts = self.qkv(x).chunk(3, dim=-1)
        q, k, v = [part.reshape(batch, length, self.heads, head_width).transpose(1, 2) for part in parts]
        if fused:
            values = F.scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=0.0)
        else:
            scores = q @ k.transpose(-2, -1) / math.sqrt(head_width)
            allowed = torch.ones(length, length, dtype=torch.bool, device=x.device).tril()
            weights = scores.masked_fill(~allowed, float("-inf")).softmax(dim=-1)
            values = weights @ v
        return self.out(values.transpose(1, 2).contiguous().reshape(batch, length, width))


class Block(nn.Module):
    def __init__(self, width, heads):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(width), nn.LayerNorm(width)
        self.attention = CausalAttention(width, heads)
        self.mlp = nn.Sequential(nn.Linear(width, 4 * width), nn.GELU(), nn.Linear(4 * width, width))

    def forward(self, x):
        x = x + self.attention(self.ln1(x))
        return x + self.mlp(self.ln2(x))


class TinyLM(nn.Module):
    def __init__(self, vocabulary, context=48, width=32, heads=2, layers=2):
        super().__init__()
        self.context = context
        self.token = nn.Embedding(vocabulary, width)
        self.position = nn.Embedding(context, width)
        self.blocks = nn.Sequential(*[Block(width, heads) for _ in range(layers)])
        self.norm = nn.LayerNorm(width)
        self.head = nn.Linear(width, vocabulary, bias=False)

    def forward(self, ids):
        positions = torch.arange(ids.shape[1], device=ids.device)
        hidden = self.token(ids) + self.position(positions)
        return self.head(self.norm(self.blocks(hidden)))


@torch.no_grad()
def score(model, ids, batch_size=32):
    """Every target after the first appears once; each has at most context inputs."""
    model.eval()
    if len(ids) < 2:
        return {"nll_sum": 0.0, "targets": 0, "mean_nats": None, "perplexity": None}
    total, count = 0.0, 0
    for length in range(1, min(model.context, len(ids) - 1) + 1):
        # Early prefixes have different lengths. The full-size group is batched below.
        if length == model.context:
            break
        logits = model(ids[:length][None, :])[:, -1, :]
        total += F.cross_entropy(logits, ids[length:length + 1], reduction="sum").item()
        count += 1
    starts = list(range(model.context, len(ids)))
    for begin in range(0, len(starts), batch_size):
        targets = starts[begin:begin + batch_size]
        batch = torch.stack([ids[t - model.context:t] for t in targets])
        logits = model(batch)[:, -1, :]
        total += F.cross_entropy(logits, ids[targets], reduction="sum").item()
        count += len(targets)
    return {"nll_sum": total, "targets": count, "mean_nats": total / count, "perplexity": math.exp(total / count)}


@torch.no_grad()
def generate(model, prompt, steps, temperature=1.0, greedy=False, eos=None):
    if prompt.ndim != 2 or prompt.shape[0] != 1 or prompt.shape[1] == 0:
        raise ValueError("Generation expects one nonempty prompt with shape (1,T)")
    if not greedy and temperature <= 0:
        raise ValueError("Sampling temperature must be positive")
    model.eval()
    ids = prompt.clone()
    for _ in range(steps):
        logits = model(ids[:, -model.context:])[:, -1, :]
        next_id = logits.argmax(dim=-1, keepdim=True) if greedy else torch.multinomial((logits / temperature).softmax(-1), 1)
        ids = torch.cat([ids, next_id], dim=1)
        if eos is not None and bool((next_id == eos).all()):
            break
    return ids


def bigram_score(train, heldout, vocabulary, alpha=0.5):
    if len(heldout) < 2:
        return {"nll_sum": 0.0, "targets": 0, "mean_nats": None, "perplexity": None}
    counts = torch.full((vocabulary, vocabulary), alpha, dtype=torch.float64)
    flat = train[:-1] * vocabulary + train[1:]
    counts += torch.bincount(flat, minlength=vocabulary * vocabulary).reshape(vocabulary, vocabulary)
    logs = counts.log() - counts.sum(dim=-1, keepdim=True).log()
    total = -logs[heldout[:-1], heldout[1:]].sum().item()
    return {"nll_sum": total, "targets": len(heldout) - 1, "mean_nats": total / (len(heldout) - 1), "perplexity": math.exp(total / (len(heldout) - 1))}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=300)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    torch.set_num_threads(2)
    torch.manual_seed(17)
    train_text = (ROOT / "alice-train.txt").read_text(encoding="utf-8")
    heldout_text = (ROOT / "alice-heldout.txt").read_text(encoding="utf-8")
    characters = ["<unk>"] + sorted(set(train_text))
    lookup = {character: index for index, character in enumerate(characters)}
    encode = lambda text: torch.tensor([lookup.get(character, 0) for character in text], dtype=torch.long)
    train, heldout = encode(train_text), encode(heldout_text)
    model = TinyLM(len(characters))
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.003, weight_decay=0.01)
    history = [{"step": 0, "train": score(model, train), "heldout": score(model, heldout)}]
    for step in range(1, args.steps + 1):
        model.train()
        starts = torch.randint(len(train) - model.context, (16,))
        inputs = torch.stack([train[i:i + model.context] for i in starts])
        targets = torch.stack([train[i + 1:i + model.context + 1] for i in starts])
        logits = model(inputs)
        loss = F.cross_entropy(logits.reshape(-1, len(characters)), targets.reshape(-1))
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        if step % 100 == 0 or step == args.steps:
            history.append({"step": step, "train": score(model, train), "heldout": score(model, heldout)})
    prompt = encode("Alice")[None, :]
    decode = lambda ids: "".join(characters[index] for index in ids[0].tolist())
    torch.manual_seed(29)
    result = {"seed": 17, "steps": args.steps, "torch": torch.__version__, "vocabulary": len(characters),
              "train_characters": len(train), "heldout_characters": len(heldout), "heldout_unknown": int((heldout == 0).sum()),
              "context": model.context, "parameters": sum(p.numel() for p in model.parameters()), "history": history,
              "bigram": bigram_score(train, heldout, len(characters)), "uniform_ppl": len(characters),
              "greedy": decode(generate(model, prompt, 100, greedy=True)),
              "sample_temperature_1": decode(generate(model, prompt, 100))}
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
