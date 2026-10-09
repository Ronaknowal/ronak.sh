"""Pre-transform pooling, ordered/gated reuse, norm and sampled context loss.

Reuses the exact recurrent-cells.py from the earlier RNN lesson. Place that file
beside this one when downloading, or run inside the site repository. No recurrent
equations are reimplemented here. Node states are batch rows; graph rounds are
separate from the positions in an ordered neighborhood reader.
"""
import copy
import importlib.util
import json
from pathlib import Path

import torch
from torch import nn
from torch.nn import functional as F


def recurrent_type():
    adjacent = Path(__file__).with_name('recurrent-cells.py')
    if adjacent.is_file():
        path = adjacent
    else:
        repository = next((parent for parent in Path(__file__).resolve().parents
                           if (parent / 'package.json').is_file()), None)
        if repository is None:
            raise FileNotFoundError('Place the supplied recurrent-cells.py beside this program.')
        path = repository / 'public/learn-assets/rnns-lstms-grus/recurrent-cells.py'
    spec = importlib.util.spec_from_file_location('reused_recurrent_cells', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.RecurrentSequence


def max_after_transform(donors, weight, bias):
    """Each donor is transformed before max; an empty list returns zeros."""
    transformed = F.linear(donors, weight, bias).relu()
    if len(donors) == 0:
        return transformed.new_zeros(weight.shape[0])
    return transformed.amax(dim=0)


class NeighborPool(nn.Module):
    def __init__(self, input_channels, pooled_channels):
        super().__init__()
        self.transform = nn.Linear(input_channels, pooled_channels)

    def forward(self, donors):
        return max_after_transform(donors, self.transform.weight,
                                   self.transform.bias)


def mapped_padded_pool(scalar_weight, scalar_bias):
    """Map scalar 1->2 pooling to PyG's input-width-preserving projector."""
    from torch_geometric.nn import SAGEConv
    if scalar_weight.shape != (2, 1):
        raise ValueError('This declared mapping uses scalar donors and two pooled channels.')
    layer = SAGEConv(2, 2, aggr='max', project=True, root_weight=False,
                     bias=False).to(device=scalar_weight.device,
                                    dtype=scalar_weight.dtype)
    with torch.no_grad():
        layer.lin.weight.zero_()
        layer.lin.weight[:, :1].copy_(scalar_weight)
        layer.lin.bias.copy_(scalar_bias)
        layer.lin_l.weight.copy_(torch.eye(2, dtype=scalar_weight.dtype,
                                          device=scalar_weight.device))
    # The post map is fixed; mapped pre-projector parameters remain trainable.
    layer.lin_l.weight.requires_grad_(False)
    return layer


def exact_unit_rows(states):
    """Divide nonzero rows by their norm; keep an exactly zero row at zero."""
    scale = states.abs().amax(dim=-1, keepdim=True)
    safe_scale = torch.where(scale == 0, torch.ones_like(scale), scale)
    scaled = states / safe_scale
    length = torch.linalg.vector_norm(scaled, dim=-1, keepdim=True)
    denominator = torch.where(length == 0, torch.ones_like(length), length)
    return scaled / denominator


def ordered_neighbors(recurrent, neighborhoods):
    """Batch equal true lengths: padding never becomes a neighbor position."""
    if not neighborhoods:
        return next(recurrent.parameters()).new_zeros((0, recurrent.hidden_size))
    result = neighborhoods[0].new_zeros((len(neighborhoods), recurrent.hidden_size))
    lengths = [len(rows) for rows in neighborhoods]
    for length in sorted(set(lengths) - {0}):
        indices = [index for index, size in enumerate(lengths) if size == length]
        inputs = torch.stack([neighborhoods[index] for index in indices])
        _, final = recurrent(inputs, return_sequence=False)
        hidden = final[0] if recurrent.kind == 'lstm' else final
        result[indices] = hidden
    return result


def ordered_example():
    """A declared one-channel fixture, independent of initialization draws."""
    model = recurrent_type()('lstm', 1, 1).double()
    with torch.no_grad():
        model.weight_ih_l0.copy_(model.weight_ih_l0.new_tensor([[.4], [.1], [.6], [.2]]))
        model.weight_hh_l0.copy_(model.weight_hh_l0.new_tensor([[.2], [-.1], [.3], [.15]]))
        model.bias_ih_l0.copy_(model.bias_ih_l0.new_tensor([.1, .2, -.05, 0.]))
        model.bias_hh_l0.copy_(model.bias_hh_l0.new_tensor([-.02, .03, .04, -.01]))
    return model


def graph_gated_round(recurrent, old_states, edge_index):
    """One graph round: old senders -> incoming sum -> one GRU position."""
    source, target = edge_index
    aggregate = old_states.new_zeros(old_states.shape)
    aggregate.index_add_(0, target, old_states[source])
    _, new_states = recurrent(aggregate[:, None, :], old_states,
                              return_sequence=False)
    return new_states


def ordinary_gru_cell(recurrent):
    cell = nn.GRUCell(recurrent.input_size, recurrent.hidden_size).to(
        device=recurrent.weight_ih_l0.device, dtype=recurrent.weight_ih_l0.dtype)
    pairs = []
    with torch.no_grad():
        for name in ('weight_ih', 'weight_hh', 'bias_ih', 'bias_hh'):
            ours = getattr(recurrent, name + '_l0')
            theirs = getattr(cell, name)
            theirs.copy_(ours)
            pairs.append((ours, theirs))
    return cell, pairs


def sampled_context_loss(anchor, positives, negatives):
    """One anchor: sum positive/negative logistic terms over stated samples."""
    positive_scores = positives @ anchor
    negative_scores = negatives @ anchor
    return F.softplus(-positive_scores).sum() + F.softplus(negative_scores).sum()


class SparseGin(nn.Module):
    def __init__(self, transform, epsilon=0., train_epsilon=False):
        super().__init__()
        self.transform = transform
        value = next(transform.parameters()).new_tensor([epsilon])
        if train_epsilon:
            self.epsilon = nn.Parameter(value)
        else:
            self.register_buffer('epsilon', value)

    def forward(self, features, edge_index):
        source, target = edge_index
        neighbors = features.new_zeros(features.shape)
        neighbors.index_add_(0, target, features[source])
        return self.transform((1 + self.epsilon) * features + neighbors)


def ordinary_gin_layer(layer):
    """Match an MLP/epsilon only after GINConv has reset its supplied MLP."""
    from torch_geometric.nn import GINConv
    parameter = next(layer.transform.parameters())
    train_epsilon = isinstance(layer.epsilon, nn.Parameter)
    other = GINConv(copy.deepcopy(layer.transform),
                    eps=float(layer.epsilon.detach()[0]),
                    train_eps=train_epsilon).to(device=parameter.device,
                                                dtype=parameter.dtype)
    other.nn.load_state_dict(layer.transform.state_dict())
    with torch.no_grad():
        other.eps.copy_(layer.epsilon)
    native_parameters = dict(other.nn.named_parameters())
    pairs = [(value, native_parameters[name])
             for name, value in layer.transform.named_parameters()
             if value.requires_grad]
    if train_epsilon:
        pairs.append((layer.epsilon, other.eps))
    return other, pairs


def matched_gin_example(train_epsilon=True):
    """A changed four-node fixture: outputs, derivatives, then equal SGD steps."""
    dtype = torch.float64
    features = torch.tensor([[1., .2], [-.4, 1.1], [.7, -.3], [1.8, .5]],
                            dtype=dtype)
    # Node 3 is isolated; no input edge is a self loop.
    edges = torch.tensor([[0, 1, 2, 1], [1, 0, 1, 2]], dtype=torch.long)
    mlp = nn.Sequential(nn.Linear(2, 3), nn.ReLU(), nn.Linear(3, 2)).double()
    with torch.no_grad():
        mlp[0].weight.copy_(torch.tensor([[.4, -.2], [-.1, .3], [.2, .5]], dtype=dtype))
        mlp[0].bias.copy_(torch.tensor([.2, -.1, .3], dtype=dtype))
        mlp[2].weight.copy_(torch.tensor([[.3, -.4, .2], [-.2, .1, .5]], dtype=dtype))
        mlp[2].bias.copy_(torch.tensor([.05, -.1], dtype=dtype))
    scratch = SparseGin(mlp, epsilon=.17, train_epsilon=train_epsilon).double()
    ordinary, pairs = ordinary_gin_layer(scratch)
    left = features.clone().requires_grad_()
    right = features.clone().requires_grad_()
    actual = scratch(left, edges)
    expected = ordinary(right, edges)
    torch.testing.assert_close(actual, expected, atol=1e-12, rtol=1e-12)
    # A declared scalar objective makes every compared derivative meaningful.
    probe = torch.arange(1, actual.numel() + 1, dtype=dtype).reshape_as(actual) / 7
    (actual * probe).sum().backward()
    (expected * probe).sum().backward()
    torch.testing.assert_close(left.grad, right.grad, atol=1e-12, rtol=1e-12)
    for ours, theirs in pairs:
        torch.testing.assert_close(ours.grad, theirs.grad, atol=1e-12, rtol=1e-12)
    with torch.no_grad():
        for ours, theirs in pairs:
            ours.add_(ours.grad, alpha=-.03)
            theirs.add_(theirs.grad, alpha=-.03)
    updated = scratch(features, edges)
    updated_ordinary = ordinary(features, edges)
    torch.testing.assert_close(updated, updated_ordinary, atol=1e-12, rtol=1e-12)
    return dict(train_epsilon=train_epsilon, before=actual.detach().tolist(),
                after=updated.detach().tolist(),
                input_derivatives=left.grad.tolist(),
                epsilon=float(scratch.epsilon.detach()[0]),
                mapped_trainable_tensors=len(pairs),
                max_updated_output_error=float((updated - updated_ordinary).abs().max().detach()))


def refinement_round(labels, incoming):
    """Synchronous categorical refinement with one shared tuple dictionary."""
    keys = [(labels[v], tuple(sorted(labels[u] for u in incoming[v])))
            for v in range(len(labels))]
    dictionary = {key: index for index, key in enumerate(sorted(set(keys)))}
    return [dictionary[key] for key in keys]


def main():
    donors = torch.tensor([[-2.], [1.], [3.]], dtype=torch.float64)
    weight = torch.tensor([[1.], [-1.]], dtype=torch.float64)
    bias = torch.zeros(2, dtype=torch.float64)
    anchor = torch.tensor([1.], dtype=torch.float64, requires_grad=True)
    loss = sampled_context_loss(anchor, torch.tensor([[2.]], dtype=torch.float64),
                                torch.tensor([[-1.]], dtype=torch.float64))
    derivative, = torch.autograd.grad(loss, anchor)
    reader = ordered_example()
    ordered = torch.tensor([[1.], [3.], [5.]], dtype=torch.float64)
    print(json.dumps({
        'transformed_donors': F.linear(donors, weight, bias).relu().tolist(),
        'pool': max_after_transform(donors, weight, bias).tolist(),
        'unit_rows': exact_unit_rows(torch.tensor([[3., 4.], [0., 0.]],
                                                 dtype=torch.float64)).tolist(),
        'context_loss': float(loss.detach()),
        'anchor_derivative': derivative.tolist(),
        'ordered_summary': ordered_neighbors(reader, [ordered]).detach().tolist(),
        'reversed_summary': ordered_neighbors(reader, [ordered.flip(0)]).detach().tolist(),
        'gin_trainable_epsilon': matched_gin_example(),
        'gin_fixed_epsilon': matched_gin_example(train_epsilon=False)
    }, indent=2))


if __name__ == '__main__':
    main()
