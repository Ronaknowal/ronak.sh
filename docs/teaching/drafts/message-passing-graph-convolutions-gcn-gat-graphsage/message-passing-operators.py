"""Sparse message passing with explicit projections, reductions and attention.

Inputs: float node table (nodes, channels), unique unweighted (source, target)
edges of shape (2, edges), no input self-loops. Tensor autograd is reused.
No graph-convolution or attention layer is called by the scratch mechanisms.
Run directly for the constructed three-paper example; no fitting or downloads.
"""

import json

import torch
from torch import nn
from torch.nn import functional as F


def message_edges(edge_index, node_count, add_self_loops):
    """Add exactly one self read per node to this no-input-loop contract."""
    if not add_self_loops:
        return edge_index
    nodes = torch.arange(node_count, device=edge_index.device)
    return torch.cat((edge_index, torch.stack((nodes, nodes))), dim=1)


def incoming_sum(messages, target, node_count):
    result = messages.new_zeros((node_count, *messages.shape[1:]))
    return result.index_add_(0, target, messages)


def receiving_degree(target, node_count, like):
    return incoming_sum(like.new_ones(target.numel()), target, node_count)


def segment_softmax(scores, target, node_count):
    """Normalize each head over the incoming edges of each receiver."""
    if scores.shape[0] == 0:
        return scores
    locations = target[:, None].expand_as(scores)
    maxima = scores.new_full((node_count, scores.shape[1]), -torch.inf)
    maxima.scatter_reduce_(0, locations, scores.detach(), reduce='amax')
    masses = (scores - maxima[target]).exp()
    totals = incoming_sum(masses, target, node_count)
    return masses / totals[target]


class SparseGcn(nn.Module):
    def __init__(self, input_channels, output_channels, add_self_loops=True):
        super().__init__()
        self.projection = nn.Linear(input_channels, output_channels, bias=False)
        self.bias = nn.Parameter(torch.zeros(output_channels))
        self.add_self_loops = add_self_loops

    def forward(self, features, edge_index):
        source, target = message_edges(
            edge_index, len(features), self.add_self_loops)
        degree = receiving_degree(target, len(features), features)
        inverse = degree.rsqrt().masked_fill(degree == 0, 0)
        coefficient = inverse[source] * inverse[target]
        projected = self.projection(features)
        messages = coefficient[:, None] * projected[source]
        return incoming_sum(messages, target, len(features)) + self.bias


class SparseMeanSage(nn.Module):
    def __init__(self, input_channels, output_channels):
        super().__init__()
        self.neighbor_projection = nn.Linear(input_channels, output_channels)
        self.own_projection = nn.Linear(input_channels, output_channels, bias=False)

    def forward(self, features, edge_index):
        source, target = edge_index
        degree = receiving_degree(target, len(features), features)
        # An empty incoming list has the declared zero summary.
        mean = incoming_sum(features[source], target, len(features))
        mean = mean / degree.clamp_min(1)[:, None]
        return self.neighbor_projection(mean) + self.own_projection(features)


class SparseGraphAttention(nn.Module):
    def __init__(self, input_channels, output_channels, heads=1, concat=True,
                 kind='gat', add_self_loops=True, negative_slope=0.2):
        super().__init__()
        if kind not in ('gat', 'gatv2'):
            raise ValueError('kind must be gat or gatv2')
        self.kind = kind
        self.heads = heads
        self.output_channels = output_channels
        self.concat = concat
        self.add_self_loops = add_self_loops
        self.negative_slope = negative_slope
        width = heads * output_channels
        self.source_projection = nn.Linear(
            input_channels, width, bias=kind == 'gatv2')
        if kind == 'gat':
            self.sender_score = nn.Parameter(torch.empty(heads, output_channels))
            self.receiver_score = nn.Parameter(torch.empty(heads, output_channels))
            nn.init.xavier_uniform_(self.sender_score)
            nn.init.xavier_uniform_(self.receiver_score)
        else:
            self.receiver_projection = nn.Linear(input_channels, width)
            self.pair_score = nn.Parameter(torch.empty(heads, output_channels))
            nn.init.xavier_uniform_(self.pair_score)
        self.bias = nn.Parameter(torch.zeros(width if concat else output_channels))

    def forward(self, features, edge_index, return_attention=False):
        edges = message_edges(edge_index, len(features), self.add_self_loops)
        source, target = edges
        values = self.source_projection(features).reshape(
            len(features), self.heads, self.output_channels)
        if self.kind == 'gat':
            sender = (values * self.sender_score).sum(dim=-1)
            receiver = (values * self.receiver_score).sum(dim=-1)
            scores = F.leaky_relu(sender[source] + receiver[target],
                                  self.negative_slope)
        else:
            queries = self.receiver_projection(features).reshape_as(values)
            pair = F.leaky_relu(values[source] + queries[target],
                                self.negative_slope)
            scores = (pair * self.pair_score).sum(dim=-1)
        coefficient = segment_softmax(scores, target, len(features))
        messages = coefficient[..., None] * values[source]
        gathered = incoming_sum(messages, target, len(features))
        output = (gathered.reshape(len(features), -1) if self.concat
                  else gathered.mean(dim=1)) + self.bias
        if return_attention:
            return output, (edges, coefficient)
        return output


def matched_library(layer):
    """Create the ordinary PyG layer with exactly mapped settings/parameters."""
    from torch_geometric.nn import GATConv, GATv2Conv, GCNConv, SAGEConv
    placement = dict(device=next(layer.parameters()).device,
                     dtype=next(layer.parameters()).dtype)

    if isinstance(layer, SparseGcn):
        other = GCNConv(layer.projection.in_features, layer.projection.out_features,
                        add_self_loops=layer.add_self_loops, cached=False,
                        normalize=True, improved=False).to(**placement)
        pairs = [(layer.projection.weight, other.lin.weight),
                 (layer.bias, other.bias)]
    elif isinstance(layer, SparseMeanSage):
        other = SAGEConv(layer.own_projection.in_features,
                         layer.own_projection.out_features, aggr='mean',
                         normalize=False, project=False, root_weight=True).to(**placement)
        pairs = [(layer.neighbor_projection.weight, other.lin_l.weight),
                 (layer.neighbor_projection.bias, other.lin_l.bias),
                 (layer.own_projection.weight, other.lin_r.weight)]
    else:
        constructor = GATConv if layer.kind == 'gat' else GATv2Conv
        settings = dict(heads=layer.heads, concat=layer.concat,
                        negative_slope=layer.negative_slope, dropout=0.,
                        add_self_loops=layer.add_self_loops, residual=False)
        if layer.kind == 'gatv2':
            settings['share_weights'] = False
        other = constructor(layer.source_projection.in_features,
                            layer.output_channels, **settings).to(**placement)
        if layer.kind == 'gat':
            pairs = [(layer.source_projection.weight, other.lin.weight),
                     (layer.sender_score, other.att_src),
                     (layer.receiver_score, other.att_dst)]
        else:
            pairs = [(layer.source_projection.weight, other.lin_l.weight),
                     (layer.source_projection.bias, other.lin_l.bias),
                     (layer.receiver_projection.weight, other.lin_r.weight),
                     (layer.receiver_projection.bias, other.lin_r.bias),
                     (layer.pair_score, other.att)]
        pairs.append((layer.bias, other.bias))
    with torch.no_grad():
        for ours, theirs in pairs:
            theirs.copy_(ours.reshape_as(theirs))
    return other, pairs


def main():
    features = torch.tensor([[1.], [2.], [4.]], dtype=torch.float64)
    edges = torch.tensor([[0, 1, 1, 2], [1, 0, 2, 1]], dtype=torch.long)
    layer = SparseGcn(1, 1).double()
    with torch.no_grad():
        layer.projection.weight.fill_(1.)
        layer.bias.zero_()
    mixed = layer(features, edges)
    weight = torch.tensor(.5, dtype=features.dtype, requires_grad=True)
    prediction = mixed[0, 0].detach() * weight
    loss = .5 * (prediction - 1.).square()
    derivative, = torch.autograd.grad(loss, weight)
    changed_weight = weight.detach() - .1 * derivative
    print(json.dumps({
        'symmetric_path': mixed.detach().flatten().tolist(),
        'node_0_prediction': float(prediction.detach()),
        'half_square_loss': float(loss.detach()),
        'weight_derivative': float(derivative),
        'weight_after_step': float(changed_weight),
        'prediction_after_step': float(mixed[0, 0].detach() * changed_weight)
    }, indent=2))


if __name__ == '__main__':
    main()
