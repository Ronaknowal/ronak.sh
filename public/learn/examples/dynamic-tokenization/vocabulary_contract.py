"""Execute row compaction, masking, ID remapping and prefix-state checks.

Install: python -m pip install torch
Run: python -X utf8 vocabulary_contract.py
Specified matrices isolate the contract; they are not a trained language model.
"""

import json
import math

import torch
from torch import nn


def compact_rows(embedding, output, retained):
    if not retained or len(set(retained)) != len(retained):
        raise ValueError("Retained IDs must be nonempty and distinct")
    indices = torch.tensor(retained, dtype=torch.long)
    new_embedding = nn.Embedding(len(retained), embedding.embedding_dim, dtype=torch.float64)
    new_output = nn.Linear(output.in_features, len(retained), bias=True, dtype=torch.float64)
    if output.weight is embedding.weight:
        # Assign the same Parameter object, rather than two equal-valued copies.
        new_output.weight = new_embedding.weight
    with torch.no_grad():
        new_embedding.weight.copy_(embedding.weight.index_select(0, indices))
        new_output.weight.copy_(output.weight.index_select(0, indices))
        new_output.bias.copy_(output.bias.index_select(0, indices))
    return new_embedding, new_output, {old: new for new, old in enumerate(retained)}


def reusable_prefix(old_ids, new_ids, old_version, new_version):
    if old_version != new_version:
        return 0
    length = 0
    for old, new in zip(old_ids, new_ids):
        if old != new:
            break
        length += 1
    return length


def state_cells(ids, embedding):
    # A concrete position-indexed state analogy, not Transformer attention.
    # Each cell depends on all preceding embedding rows and its position.
    vectors = embedding(torch.tensor(ids, dtype=torch.long))
    position = torch.arange(len(ids), dtype=torch.float64).unsqueeze(1)
    keys = vectors.cumsum(0) + position
    values = vectors.cumsum(0) - position
    return keys, values


def main():
    torch.set_num_threads(1)
    embedding = nn.Embedding(5, 3, dtype=torch.float64)
    output = nn.Linear(3, 5, bias=True, dtype=torch.float64)
    with torch.no_grad():
        embedding.weight.copy_(torch.tensor([[1., 0., 0.], [0., 1., 0.], [0., 0., 1.],
                                            [1., 1., 0.], [1., 0., 1.]], dtype=torch.float64))
        output.weight.copy_(torch.tensor([[.2, .1, .0], [.0, .3, .1], [.1, .0, .4],
                                         [.4, .2, .1], [.1, .3, .2]], dtype=torch.float64))
        output.bias.copy_(torch.tensor([0., .1, -.1, .2, 0.], dtype=torch.float64))
    retained = [0, 2, 4]
    small_embedding, small_output, remap = compact_rows(embedding, output, retained)
    old_input = [4, 0, 2]
    new_input = [remap[index] for index in old_input]
    assert torch.equal(embedding(torch.tensor(old_input)), small_embedding(torch.tensor(new_input)))
    hidden = torch.tensor([.5, 1., -.5], dtype=torch.float64)
    logits = output(hidden)
    compact_logits = small_output(hidden)
    assert torch.equal(compact_logits, logits[retained])
    masked = logits.clone()
    masked[[1, 3]] = -torch.inf
    probabilities = masked.softmax(0)
    assert torch.allclose(probabilities[retained], compact_logits.softmax(0), atol=1e-14)
    assert probabilities[1] == probabilities[3] == 0
    tied_output = nn.Linear(3, 5, bias=True, dtype=torch.float64)
    tied_output.weight = embedding.weight
    with torch.no_grad():
        tied_output.bias.copy_(output.bias)
    small_tied_embedding, small_tied_output, _ = compact_rows(embedding, tied_output, retained)
    assert small_tied_output.weight is small_tied_embedding.weight
    assert torch.equal(small_tied_output(hidden), tied_output(hidden)[retained])
    parameter_count = lambda layers: sum(parameter.numel() for parameter in nn.ModuleList(layers).parameters())
    old_ids, edited_ids = [0, 2, 4], [0, 1, 4]
    old_k, old_v = state_cells(old_ids, embedding)
    new_k, new_v = state_cells(edited_ids, embedding)
    prefix = reusable_prefix(old_ids, edited_ids, "v1", "v1")
    assert prefix == 1 and torch.equal(old_k[:prefix], new_k[:prefix])
    assert torch.equal(old_v[:prefix], new_v[:prefix])
    assert not torch.equal(old_k[prefix:], new_k[prefix:])
    assert reusable_prefix(old_ids, old_ids, "v1", "v2") == 0
    # Equal byte-event NLL; changing only the number of scored targets changes PPL.
    nll, byte_count = 4., 8
    metric_rows = [{"targets": targets, "token_perplexity": math.exp(nll / targets),
                    "bits_per_byte": nll / (byte_count * math.log(2))} for targets in [2, 4]]
    rows_before, rows_after, width = 5, 3, 3
    report = {
        "embedding_rows": embedding.weight.detach().tolist(),
        "output_rows": output.weight.detach().tolist(), "output_bias": output.bias.detach().tolist(),
        "retained_old_ids": retained, "old_to_new": remap,
        "old_input_ids": old_input, "new_input_ids": new_input,
        "hidden": hidden.tolist(), "original_logits": logits.tolist(),
        "retained_logits": compact_logits.tolist(),
        "original_probabilities": logits.softmax(0).tolist(),
        "masked_probabilities": probabilities.tolist(),
        "compacted_probabilities": compact_logits.softmax(0).tolist(),
        "untied_parameters_before_after": [parameter_count([embedding, output]),
                                           parameter_count([small_embedding, small_output])],
        "tied_parameters_before_after": [parameter_count([embedding, tied_output]),
                                         parameter_count([small_tied_embedding, small_tied_output])],
        "tied_compact_weights_share_parameter": small_tied_output.weight is small_tied_embedding.weight,
        "tied_compact_logits": small_tied_output(hidden).tolist(),
        "prefix": {"old_ids": old_ids, "edited_ids": edited_ids, "reusable_positions": prefix,
                   "changed_version_reusable_positions": 0,
                   "old_keys": old_k.detach().tolist(), "edited_keys": new_k.detach().tolist()},
        "equal_nll_metrics": metric_rows,
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
