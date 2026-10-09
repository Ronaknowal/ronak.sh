"""Unmodified causal model classes from the prerequisite TinyLM.

Source: public/learn-code/causal-language-modeling/tiny_causal_lm.py.
See backbone-provenance.json for the complete source identity.
This local copy makes the SimPO download self-contained.
"""
import math
import torch
from torch import nn
import torch.nn.functional as F


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


