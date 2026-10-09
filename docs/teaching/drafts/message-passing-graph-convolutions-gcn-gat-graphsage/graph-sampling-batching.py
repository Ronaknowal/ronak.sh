"""Occurrence paths, sampled layer blocks, independent batches and typed edges.

Requires torch; ordinary comparisons also require torch_geometric. Keep the
supplied message-passing-operators.py beside this file. Incoming edge occurrences
are sampled uniformly, not the cyclic illustration's deterministic ordering.
No dataset, historical fit or graph-sampling extension is installed by this file.
"""
from dataclasses import dataclass
import importlib.util
from itertools import combinations
import json
from pathlib import Path
import random

import torch
from torch.nn import functional as F


def operator_module():
    path = Path(__file__).with_name('message-passing-operators.py')
    spec = importlib.util.spec_from_file_location('reused_graph_operators', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def occurrence_tree(fanouts, replacement=False):
    """Exact old cyclic four-ID illustration; expansion arrows are dependencies."""
    if not 1 <= len(fanouts) <= 3 or any(not 0 <= f <= 8 for f in fanouts):
        raise ValueError('Use one to three integer fanouts in [0, 8].')
    levels = [[{'id': 0, 'parent': None, 'path': '0'}]]
    product, bound = 1, 1
    for fanout in fanouts:
        product *= fanout
        bound += product
        current = []
        for parent in levels[-1]:
            donors = [node for node in range(4) if node != parent['id']]
            count = fanout if replacement else min(fanout, len(donors))
            for slot in range(count):
                current.append({'id': donors[slot % 3],
                                'parent': parent['path'],
                                'path': f"{parent['path']}.{slot}"})
        levels.append(current)
    ids = [node['id'] for level in levels for node in level]
    return {'levels': levels, 'occurrences': len(ids), 'distinct': len(set(ids)),
            'unlimited_bound': bound}


@dataclass(frozen=True)
class SampledBlock:
    """Local source rows and target rows have separate index domains."""
    source_ids: tuple
    target_ids: tuple
    edge_index: torch.Tensor


def incoming_index(edge_index, node_count):
    """One O(N+E) CPU preprocessing pass; duplicates remain occurrences."""
    incoming = [[] for _ in range(node_count)]
    for source, target in edge_index.detach().cpu().t().tolist():
        incoming[target].append(source)
    return incoming


def sample_blocks(incoming, seeds, layer_fanouts, seed=0, replacement=False):
    """Fanouts are in forward-layer order; construct dependencies backwards.

    Coalesce storage for equal global IDs but retain every sampled edge slot.
    Each target's own previous-layer row is included even at zero fanout.
    Input seeds must be unique valid IDs. A -1 fanout reads every incoming edge.
    """
    targets = tuple(seeds)
    if not targets or len(set(targets)) != len(targets):
        raise ValueError('Provide a nonempty sequence of unique seed IDs.')
    if any(node < 0 or node >= len(incoming) for node in targets):
        raise ValueError('A seed is outside the global node table.')
    if not layer_fanouts or any(f < -1 for f in layer_fanouts):
        raise ValueError('Use nonnegative integer fanouts, or -1 for all.')
    rng = random.Random(seed)
    backwards = []
    for fanout in reversed(layer_fanouts):
        source_ids = list(targets)
        source_position = {node: row for row, node in enumerate(source_ids)}
        edge_source, edge_target = [], []
        for receiver_row, receiver_id in enumerate(targets):
            candidates = incoming[receiver_id]
            if fanout == -1:
                chosen = candidates
            elif replacement and candidates:
                chosen = rng.choices(candidates, k=fanout)
            else:
                chosen = rng.sample(candidates, min(fanout, len(candidates)))
            for donor in chosen:
                if donor not in source_position:
                    source_position[donor] = len(source_ids)
                    source_ids.append(donor)
                edge_source.append(source_position[donor])
                edge_target.append(receiver_row)
        edges = torch.tensor([edge_source, edge_target], dtype=torch.long)
        backwards.append(SampledBlock(tuple(source_ids), targets, edges))
        targets = tuple(source_ids)
    return list(reversed(backwards))


def block_mean_sage(layer, source_features, block):
    """Use the exact earlier layer's parameters with explicit bipartite reduction."""
    edges = block.edge_index.to(source_features.device)
    donor, receiver = edges
    count = len(block.target_ids)
    total = source_features.new_zeros((count, source_features.shape[1]))
    total.index_add_(0, receiver, source_features[donor])
    degree = source_features.new_zeros(count)
    degree.index_add_(0, receiver, source_features.new_ones(len(receiver)))
    mean = total / degree.clamp_min(1)[:, None]
    own = source_features[:count]
    return layer.neighbor_projection(mean) + layer.own_projection(own)


def run_sampled_sage(features, blocks, layers, library=False):
    """Return only final seed rows; all intermediate sampled rows supply context."""
    if len(blocks) != len(layers) or not blocks:
        raise ValueError('One block is required per layer.')
    indices = torch.tensor(blocks[0].source_ids, device=features.device)
    state = features[indices]
    for index, (block, layer) in enumerate(zip(blocks, layers)):
        if index and blocks[index - 1].target_ids != block.source_ids:
            raise ValueError('Adjacent block row identities do not align.')
        if library:
            edges = block.edge_index.to(state.device)
            state = layer((state, state[:len(block.target_ids)]), edges,
                          size=(len(block.source_ids), len(block.target_ids)))
        else:
            state = block_mean_sage(layer, state, block)
        if index + 1 < len(layers):
            state = state.relu()
    return state


def pair_sample_statistics(values):
    """Enumerate equally likely size-two samples without replacement exactly."""
    rows = [{'ids': (first, second), 'mean': (values[first] + values[second]) / 2}
            for first, second in combinations(range(len(values)), 2)]
    if not rows:
        raise ValueError('At least two donors are needed.')
    full_mean = sum(values) / len(values)
    expected_mean = sum(row['mean'] for row in rows) / len(rows)
    expected_square = sum(row['mean'] ** 2 for row in rows) / len(rows)
    variance = sum((row['mean'] - expected_mean) ** 2 for row in rows) / len(rows)
    return {'rows': rows, 'full_mean': full_mean, 'expected_mean': expected_mean,
            'expected_square': expected_square, 'square_full_mean': full_mean ** 2,
            'sample_mean_variance': variance}


@dataclass(frozen=True)
class IndependentBatch:
    features: torch.Tensor
    edge_index: torch.Tensor
    graph_id: torch.Tensor
    ptr: torch.Tensor


def batch_independent_graphs(graphs):
    """Concatenate once, offset both endpoints once; no dense padding required.

    All graph tensors share feature width, dtype and device. Empty graphs retain
    a slot in ptr/readout; graphs are a nonempty sequence of (features, edges).
    """
    features, edges, membership, ptr = [], [], [], [0]
    for graph_id, (x, edge_index) in enumerate(graphs):
        features.append(x)
        edges.append(edge_index + ptr[-1])
        membership.append(torch.full((len(x),), graph_id, dtype=torch.long,
                                     device=x.device))
        ptr.append(ptr[-1] + len(x))
    return IndependentBatch(torch.cat(features), torch.cat(edges, dim=1),
                            torch.cat(membership),
                            torch.tensor(ptr, device=features[0].device))


def graph_sum_readout(states, graph_id, graph_count):
    output = states.new_zeros((graph_count, states.shape[1]))
    return output.index_add_(0, graph_id, states)


def typed_message_sum(features, edge_index, relation_ids, relation_maps):
    """Pair each donor with its own edge's relation matrix before reduction.

    Maps have shape (relations, output_channels, input_channels); gather memory
    is O(E*d_out*d_in). Larger models can group edges by relation instead.
    """
    donor, receiver = edge_index
    maps = relation_maps[relation_ids]
    messages = torch.bmm(maps, features[donor].unsqueeze(-1)).squeeze(-1)
    output = features.new_zeros((len(features), relation_maps.shape[1]))
    return output.index_add_(0, receiver, messages)


def ordinary_typed_layer(relation_maps):
    """Map these finite relation matrices into ordinary edge-conditioned NNConv."""
    from torch import nn
    from torch_geometric.nn import NNConv
    relations, output_channels, input_channels = relation_maps.shape
    mapper = nn.Linear(relations, input_channels * output_channels, bias=False)
    layer = NNConv(input_channels, output_channels, mapper, aggr='add',
                   root_weight=False, bias=False).to(device=relation_maps.device,
                                                    dtype=relation_maps.dtype)
    # NNConv stores each generated map as (input, output), unlike our (output, input).
    # Its constructor resets the supplied edge network: assign AFTER construction.
    with torch.no_grad():
        layer.nn.weight.copy_(relation_maps.permute(2, 1, 0).reshape(
            input_channels * output_channels, relations))
    return layer


def execute_four_assignments(a, b):
    """A specified arithmetic interpreter; graph transport alone is not this."""
    c = a + b
    d = 2 * c
    return a, b, c, d


def transport_four_assignments(a, b):
    """Two specified graph rounds for these additions/scalings, not arbitrary code."""
    initial = torch.stack((a, b, a.new_zeros(()), a.new_zeros(())))[:, None]
    edges = torch.tensor([[0, 1, 2], [2, 2, 3]], device=a.device)
    relations = torch.tensor([0, 0, 1], device=a.device)
    maps = a.new_tensor([[[1.]], [[2.]]])
    state = initial
    for _ in range(2):
        computed = typed_message_sum(state, edges, relations, maps)
        state = torch.cat((initial[:2], computed[2:]))
    return state[:, 0]


def traffic_rule(history, incoming_source=0, receiver=1):
    """Rows are sensors; columns are legal t0/t1, in vehicles per minute."""
    return 0.5 * history[receiver, 1] + 0.5 * history[incoming_source, 0]


def ordinary_neighbor_loader(data, input_nodes, outward_fanouts, seed=0):
    """Actual ordinary loader; propagate missing-backend errors to the caller.

    Unlike sample_blocks' forward-layer list, this list follows outward hops.
    Its union subgraph is not claimed to be our per-layer block realization.
    Seeded sampling is reproducible only under a matched backend/environment.
    """
    from torch_geometric.loader import NeighborLoader
    torch.manual_seed(seed)
    return NeighborLoader(data, input_nodes=input_nodes,
                          num_neighbors=list(outward_fanouts),
                          batch_size=len(input_nodes), shuffle=False, replace=False,
                          subgraph_type='directional', num_workers=0)


def main():
    dtype = torch.float64
    operators = operator_module()
    x = torch.tensor([[1.], [3.], [5.], [9.]], dtype=dtype)
    edges = torch.tensor([[0, 1, 2, 3, 1, 2], [1, 2, 1, 2, 0, 3]])
    blocks = sample_blocks(incoming_index(edges, len(x)), [1], [2, 1], seed=7)
    layers = [operators.SparseMeanSage(1, 2).to(dtype=dtype),
              operators.SparseMeanSage(2, 1).to(dtype=dtype)]
    with torch.no_grad():
        for layer in layers:
            layer.own_projection.weight.fill_(0.5)
            layer.neighbor_projection.weight.fill_(0.25)
            layer.neighbor_projection.bias.zero_()
    logits = run_sampled_sage(x, blocks, layers)
    seed_targets = torch.tensor([[1.]], dtype=dtype)
    seed_loss = F.binary_cross_entropy_with_logits(logits, seed_targets)
    seed_loss.backward()
    print(json.dumps({'cyclic_4_3': {key: value for key, value in
                                  occurrence_tree([4, 3], True).items()
                                  if key != 'levels'},
                      'pair_samples': pair_sample_statistics([1, 3, 5, 9]),
                      'forward_blocks': [{'sources': block.source_ids,
                                          'targets': block.target_ids,
                                          'edges': block.edge_index.tolist()}
                                         for block in blocks],
                      'seed_logit': logits.item(), 'seed_loss': seed_loss.item()},
                     indent=2))
    from torch_geometric.data import Data, Batch
    first = (x[:3], torch.tensor([[0, 1, 1, 2], [1, 0, 2, 1]]))
    second = (torch.tensor([[8.], [2.]], dtype=dtype),
              torch.tensor([[0, 1], [1, 0]]))
    custom = batch_independent_graphs([first, second])
    ordinary = Batch.from_data_list([Data(x=g[0], edge_index=g[1])
                                     for g in [first, second]])
    batch_layer = operators.SparseMeanSage(1, 1).to(dtype=dtype)
    with torch.no_grad():
        batch_layer.own_projection.weight.fill_(1.)
        batch_layer.neighbor_projection.weight.fill_(1.)
        batch_layer.neighbor_projection.bias.zero_()
    node_states = batch_layer(custom.features, custom.edge_index)
    graph_sums = graph_sum_readout(node_states, custom.graph_id, 2)
    print(json.dumps({'batch_edges': custom.edge_index.tolist(),
                      'graph_id': custom.graph_id.tolist(),
                      'node_outputs': node_states.detach().flatten().tolist(),
                      'graph_sum_readout': graph_sums.detach().flatten().tolist(),
                      'ordinary_edges_match': torch.equal(custom.edge_index,
                                                           ordinary.edge_index)}))
    loader = ordinary_neighbor_loader(Data(x=x, edge_index=edges),
                                      torch.tensor([1]), [1, 2], seed=7)
    try:
        sampled = next(iter(loader))
    except ImportError as error:
        print(json.dumps({'ordinary_sampling': 'backend unavailable',
                          'error': str(error)}))
    else:
        print(json.dumps({'ordinary_sampling': 'executed',
                          'n_id': sampled.n_id.tolist(),
                          'batch_size': sampled.batch_size,
                          'edges': sampled.edge_index.tolist()}))


if __name__ == '__main__':
    main()
