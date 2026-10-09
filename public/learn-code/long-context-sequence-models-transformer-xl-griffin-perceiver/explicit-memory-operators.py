"""Transparent trainable memory operators, with independent loop/library checks.

Run: python explicit-memory-operators.py
Dependencies: torch. No data download, training run or pretrained-model claim.
The relative head is one head over lower-layer hidden rows, not an entire LM.
The recurrence owns gates/reset/state and follows the published RG-LRU equation;
its ordinary route and explicit optional capped-backward route are distinguished.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
import torch
from torch import Tensor, nn
from torch.nn import functional as F


def legal_read(scores: Tensor, values: Tensor, allowed: Tensor) -> tuple[Tensor, Tensor]:
    """Scores [N,Q,S], values [N,S,V], True means participate."""
    if allowed.dtype != torch.bool or allowed.shape != scores.shape:
        raise ValueError('allowed must be a Boolean array matching scores')
    if not bool(allowed.any(dim=-1).all()):
        raise ValueError('every query needs at least one legal source')
    weights = torch.softmax(scores.masked_fill(~allowed, -torch.inf), dim=-1)
    return weights @ values, weights


def sinusoidal_offsets(offset: Tensor, width: int) -> Tensor:
    """Projected relative row before W_r; an explicit even-width convention."""
    if width < 2 or width % 2:
        raise ValueError('relative width must be positive and even')
    rates = 10000.0 ** (-torch.arange(0, width, 2, dtype=offset.dtype,
                                    device=offset.device) / width)
    angles = offset[..., None] * rates
    return torch.stack((angles.sin(), angles.cos()), dim=-1).flatten(-2)


@dataclass
class HiddenMemory:
    hidden: Tensor  # [N,M,C]: LOWER-layer hidden rows, not already-projected K/V
    position: Tensor  # [N,M]: absolute logical positions
    document: Tensor  # [N,M]: document identity; a new document cannot read old rows


class RelativeMemoryAttention(nn.Module):
    def __init__(self, width: int = 4, head_width: int = 4):
        super().__init__()
        if head_width % 2:
            raise ValueError('head width must be even')
        self.head_width = head_width
        self.query = nn.Linear(width, head_width)
        self.key = nn.Linear(width, head_width)
        self.value = nn.Linear(width, head_width)
        self.relative = nn.Linear(head_width, head_width, bias=False)
        self.content_bias = nn.Parameter(torch.zeros(head_width))
        self.position_bias = nn.Parameter(torch.zeros(head_width))

    def forward(self, current: Tensor, position: Tensor, document: Tensor,
                memory: HiddenMemory | None = None, capacity: int = 4,
                route: str = 'explicit') -> tuple[Tensor, HiddenMemory, Tensor]:
        if current.ndim != 3 or position.shape != current.shape[:2] or document.shape != position.shape:
            raise ValueError('current/position/document must be [N,L,C]/[N,L]/[N,L]')
        if capacity < 0 or not isinstance(capacity, int):
            raise ValueError('capacity must be a nonnegative integer')
        if memory is None:
            donors, donor_position, donor_document = current, position, document
        else:
            if memory.hidden.shape[0] != current.shape[0] or memory.hidden.shape[-1] != current.shape[-1]:
                raise ValueError('memory belongs to a matching batch and width')
            donors = torch.cat((memory.hidden.detach(), current), dim=1)
            donor_position = torch.cat((memory.position, position), dim=1)
            donor_document = torch.cat((memory.document, document), dim=1)
        q, k, v = self.query(current), self.key(donors), self.value(donors)
        offsets = position[:, :, None] - donor_position[:, None, :]
        relative = self.relative(sinusoidal_offsets(offsets.to(current.dtype), self.head_width))
        allowed = (offsets >= 0) & (document[:, :, None] == donor_document[:, None, :])
        if not bool(allowed.any(-1).all()):
            raise ValueError('empty legal read: current position must have a legal donor')
        scale = self.head_width ** -.5
        # q.k + q.r + u.k + v.r. Only then apply the common 1/sqrt(d).
        content = (q + self.content_bias) @ k.transpose(-2, -1)
        relative_score = ((q + self.position_bias)[:, :, None, :] * relative).sum(-1)
        scores = (content + relative_score) * scale
        if route == 'explicit':
            output, weights = legal_read(scores, v, allowed)
        elif route == 'sdpa':
            # SDPA scales q.k internally. This additive bias is ALREADY scaled;
            # do not divide it by sqrt(d) a second time.
            bias = ((self.content_bias[None, None, :] @ k.transpose(-2, -1))
                    + relative_score) * scale
            bias = bias.masked_fill(~allowed, -torch.inf)
            output = F.scaled_dot_product_attention(q[:, None], k[:, None], v[:, None],
                                                   attn_mask=bias[:, None], dropout_p=0.0)[:, 0]
            weights = torch.softmax(scores.masked_fill(~allowed, -torch.inf), -1)
        elif route == 'indexed':
            # Independent reference: each scalar four-term score is constructed
            # without the batched score contractions above.
            batch_rows, weight_rows = [], []
            for n in range(len(current)):
                rows, row_weights = [], []
                for i in range(current.shape[1]):
                    scalar = torch.stack([
                        sum(q[n, i, c] * k[n, j, c]
                            + q[n, i, c] * relative[n, i, j, c]
                            + self.content_bias[c] * k[n, j, c]
                            + self.position_bias[c] * relative[n, i, j, c]
                            for c in range(self.head_width)) * scale
                        for j in range(donors.shape[1])])
                    alpha = torch.softmax(scalar.masked_fill(~allowed[n, i], -torch.inf), 0)
                    rows.append(sum(alpha[j] * v[n, j] for j in range(donors.shape[1])))
                    row_weights.append(alpha)
                batch_rows.append(torch.stack(rows)); weight_rows.append(torch.stack(row_weights))
            output, weights = torch.stack(batch_rows), torch.stack(weight_rows)
        else:
            raise ValueError('route must be explicit, sdpa or indexed')
        # :0 is explicit: -0 would incorrectly keep every row.
        tail = slice(-capacity, None) if capacity else slice(0, 0)
        next_memory = HiddenMemory(donors[:, tail].detach(), donor_position[:, tail].detach(),
                                   donor_document[:, tail].detach())
        return output, next_memory, weights


class CappedSqrt(torch.autograd.Function):
    """Same forward sqrt; explicit released-source cap on its backward slope."""
    @staticmethod
    def forward(ctx, value):
        ctx.save_for_backward(value)
        return value.sqrt()

    @staticmethod
    def backward(ctx, gradient):
        (value,) = ctx.saved_tensors
        return gradient / (4 * value).clamp_min(1 / 1000**2).sqrt()


class InputGatedRecurrence(nn.Module):
    """Independent blocks mix input features to gates; state update is diagonal.

    reset [N,T] zeroes incoming state AND makes injection scale one. State is
    accumulated in float32 for half/bfloat input, otherwise the input precision.
    Default autograd uses the mathematical sqrt derivative. Set capped_backward
    to reproduce the released-source slope cap explicitly. The checks do not
    execute the optional native RecurrentGemma package.
    """
    def __init__(self, width: int = 4, blocks: int = 2):
        super().__init__()
        if width % blocks:
            raise ValueError('width must divide into gate blocks')
        self.blocks, self.block_width = blocks, width // blocks
        shape = (blocks, self.block_width, self.block_width)
        self.input_weight = nn.Parameter(torch.randn(shape) * .1)
        self.recurrence_weight = nn.Parameter(torch.randn(shape) * .1)
        self.input_bias = nn.Parameter(torch.zeros(blocks, self.block_width))
        self.recurrence_bias = nn.Parameter(torch.zeros(blocks, self.block_width))
        self.raw_decay = nn.Parameter(torch.full((width,), -3.0))

    def forward(self, x: Tensor, state: Tensor | None = None, reset: Tensor | None = None,
                indexed: bool = False, capped_backward: bool = False) -> tuple[Tensor, Tensor]:
        if x.ndim != 3 or x.shape[-1] != self.blocks * self.block_width:
            raise ValueError('x must be [N,T,width]')
        n, t, width = x.shape
        dtype = torch.float32 if x.dtype in (torch.float16, torch.bfloat16) else x.dtype
        h = torch.zeros(n, width, dtype=dtype, device=x.device) if state is None else state.to(dtype)
        if h.shape != (n, width):
            raise ValueError('initial state must be [N,width]')
        reset = torch.zeros(n, t, dtype=torch.bool, device=x.device) if reset is None else reset
        if reset.shape != (n, t) or reset.dtype != torch.bool:
            raise ValueError('reset must be Boolean [N,T]')
        if not indexed:
            # Gate generators depend only on inputs, so project the full batch
            # once. Only the actual state recurrence remains a sequential scan.
            all_blocks = x.reshape(n, t, self.blocks, self.block_width)
            input_gates = (torch.einsum('nthi,hij->nthj', all_blocks, self.input_weight)
                           + self.input_bias).sigmoid().reshape(n, t, width)
            recurrence_gates = (torch.einsum('nthi,hij->nthj', all_blocks, self.recurrence_weight)
                                + self.recurrence_bias).sigmoid().reshape(n, t, width)
        outputs = []
        for step in range(t):
            block = x[:, step].reshape(n, self.blocks, self.block_width)
            if indexed:
                gate = lambda w, b: torch.stack([
                    torch.stack([torch.stack([sum(block[a, g, c] * w[g, c, j]
                                                  for c in range(self.block_width)) + b[g, j]
                                             for j in range(self.block_width)])
                                 for g in range(self.blocks)]) for a in range(n)])
                i = gate(self.input_weight, self.input_bias).sigmoid().reshape(n, width)
                r = gate(self.recurrence_weight, self.recurrence_bias).sigmoid().reshape(n, width)
            else:
                i, r = input_gates[:, step], recurrence_gates[:, step]
            log_a = -8 * r * F.softplus(self.raw_decay)
            a = log_a.exp().to(dtype)
            square = -torch.expm1(2 * log_a)
            injection = (CappedSqrt.apply(square) if capped_backward else square.sqrt()).to(dtype)
            beginning = reset[:, step, None]
            h = torch.where(beginning, torch.zeros_like(h), h)
            injection = torch.where(beginning, torch.ones_like(injection), injection)
            h = a * h + injection * i.to(dtype) * x[:, step].to(dtype)
            outputs.append(h)
        return torch.stack(outputs, 1) if outputs else x.new_empty(n, 0, width), h


def causal_latent_masks(input_positions: Tensor, anchors: Tensor) -> tuple[Tensor, Tensor]:
    """Anchor i knows input through i and predicts i+1; mask BOTH reads."""
    return input_positions[None, :] <= anchors[:, None], anchors[None, :] <= anchors[:, None]


def output_queries(query: Tensor, latent_keys: Tensor, latent_values: Tensor) -> Tensor:
    scores = query @ latent_keys.transpose(-2, -1) / math.sqrt(query.shape[-1])
    return legal_read(scores, latent_values, torch.ones_like(scores, dtype=torch.bool))[0]


def main() -> dict:
    torch.manual_seed(17)
    torch.set_num_threads(2)
    results, checks = {}, 0
    model = RelativeMemoryAttention().double()
    with torch.no_grad():
        model.content_bias.copy_(torch.tensor([.2, -.1, .3, .05]))
        model.position_bias.copy_(torch.tensor([-.2, .1, .4, -.3]))
    old = torch.randn(2, 2, 4, dtype=torch.float64, requires_grad=True)
    memory = HiddenMemory(old, torch.tensor([[0, 1], [0, 1]]), torch.zeros(2, 2, dtype=torch.long))
    current = torch.randn(2, 3, 4, dtype=torch.float64, requires_grad=True)
    positions = torch.tensor([[2, 3, 4], [2, 3, 4]])
    documents = torch.tensor([[0, 0, 0], [0, 1, 1]])
    parameters = tuple(model.parameters())
    probe = torch.randn(2, 3, 4, dtype=torch.float64)
    reference, _, weights = model(current, positions, documents, memory)
    reference_grad = torch.autograd.grad((reference * probe).sum(), (current,) + parameters, retain_graph=True)
    for route in ('sdpa', 'indexed'):
        output, _, _ = model(current, positions, documents, memory, route=route)
        torch.testing.assert_close(output, reference, atol=2e-12, rtol=2e-12); checks += 1
        gradients = torch.autograd.grad((output * probe).sum(), (current,) + parameters, retain_graph=True)
        for observed, expected in zip(gradients, reference_grad):
            torch.testing.assert_close(observed, expected, atol=3e-11, rtol=3e-11); checks += 1
    assert torch.autograd.grad(reference.sum(), old, allow_unused=True)[0] is None; checks += 1
    for capacity in (0, 1, 4):
        _, new_memory, _ = model(current, positions, documents, memory, capacity)
        assert new_memory.hidden.shape[1] == min(capacity, 5); checks += 1
        assert not new_memory.hidden.requires_grad; checks += 1
    shifted, _, _ = model(current, positions + 100, documents,
                         HiddenMemory(old, memory.position + 100, memory.document))
    torch.testing.assert_close(shifted, reference); checks += 1
    changed = current.detach().clone(); changed[:, -1] += 100
    future, _, _ = model(changed, positions, documents, memory)
    torch.testing.assert_close(future[:, :2], reference[:, :2]); checks += 1
    assert bool((weights[1, 1, :3] == 0).all()); checks += 1
    stream = torch.randn(2, 7, 4, dtype=torch.float64)
    full_pos = torch.arange(7)[None].expand(2, -1)
    full_doc = torch.zeros_like(full_pos)
    whole, _, _ = model(stream, full_pos, full_doc, capacity=7)
    memory, chunks = None, []
    for begin, end in ((0, 3), (3, 6), (6, 7)):
        part, memory, _ = model(stream[:, begin:end], full_pos[:, begin:end], full_doc[:, begin:end], memory, 7)
        chunks.append(part)
    torch.testing.assert_close(torch.cat(chunks, 1), whole, atol=2e-12, rtol=2e-12); checks += 1
    try:
        legal_read(torch.zeros(1, 1, 2), torch.ones(1, 2, 1), torch.zeros(1, 1, 2, dtype=torch.bool))
    except ValueError:
        checks += 1
    else:
        raise AssertionError('empty legal read was not rejected')
    key_index = list(dict(model.named_parameters())).index('key.weight') + 1
    assert reference_grad[key_index].norm().item() > 0; checks += 1
    results['relative_head'] = {'output_checksum': reference.detach().sum().item(),
                                'current_key_gradient_norm': reference_grad[key_index].norm().item()}
    recurrence = InputGatedRecurrence().double()
    with torch.no_grad():
        recurrence.input_bias.add_(.13); recurrence.recurrence_bias.sub_(.21)
    x = torch.randn(2, 7, 4, dtype=torch.float64, requires_grad=True)
    h0 = torch.randn(2, 4, dtype=torch.float64, requires_grad=True)
    reset = torch.zeros(2, 7, dtype=torch.bool); reset[1, 3] = True
    ordinary, final = recurrence(x, h0, reset)
    independent, independent_final = recurrence(x, h0, reset, indexed=True)
    torch.testing.assert_close(ordinary, independent, atol=2e-12, rtol=2e-12); checks += 1
    variables = (x, h0) + tuple(recurrence.parameters())
    a_grad = torch.autograd.grad(ordinary.square().sum() + final.sum(), variables, retain_graph=True)
    b_grad = torch.autograd.grad(independent.square().sum() + independent_final.sum(), variables)
    for a, b in zip(a_grad, b_grad):
        torch.testing.assert_close(a, b, atol=3e-11, rtol=3e-11); checks += 1
    h, pieces = h0, []
    for begin, end in ((0, 3), (3, 6), (6, 7)):
        part, h = recurrence(x[:, begin:end], h, reset[:, begin:end]); pieces.append(part)
    torch.testing.assert_close(torch.cat(pieces, 1), ordinary); checks += 1
    changed = x.detach().clone(); changed[1, :3] += 100
    changed_state = h0.detach().clone(); changed_state[1] -= 100
    after_reset, _ = recurrence(changed, changed_state, reset)
    torch.testing.assert_close(after_reset[1, 3:], ordinary[1, 3:]); checks += 1
    tiny = torch.tensor([0., 1e-12, .01, .04], dtype=torch.float64, requires_grad=True)
    CappedSqrt.apply(tiny).sum().backward()
    torch.testing.assert_close(tiny.grad, torch.tensor([1000., 1000., 5., 2.5], dtype=torch.float64)); checks += 1
    capped, _ = recurrence(x, h0, reset, capped_backward=True)
    torch.testing.assert_close(capped, ordinary); checks += 1
    cross, self_mask = causal_latent_masks(torch.arange(5), torch.tensor([3, 4]))
    assert cross.tolist() == [[True, True, True, True, False], [True] * 5]; checks += 1
    assert self_mask.tolist() == [[True, False], [True, True]]; checks += 1
    io = output_queries(torch.tensor([[[-math.log(2)], [math.log(2)]]]),
                        torch.tensor([[[-1.], [0.], [1.]]]), torch.tensor([[[2.], [6.], [10.]]]))
    torch.testing.assert_close(io.flatten(), torch.tensor([30/7, 54/7])); checks += 1
    results['recurrence'] = {'final_state_checksum': final.detach().sum().item(), 'gradient_tensors': len(variables)}
    results['checks'] = checks
    print(json.dumps(results, indent=2))
    return results


if __name__ == '__main__':
    main()
