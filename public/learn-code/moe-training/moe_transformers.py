"""Offline Mixtral training mechanics, packed-map parity, and save/reload.

Run: python moe_transformers.py --output mixtral-example
Requires transformers==5.17.0, torch, NumPy, moe_torch.py and its dependency
moe_mechanisms.py beside this file. No pretrained weights are downloaded.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
import transformers
from transformers import MixtralConfig, MixtralForCausalLM
from transformers.models.mixtral.modeling_mixtral import load_balancing_loss_func

from moe_torch import TorchMoE


def configuration():
    return MixtralConfig(
        vocab_size=257,
        hidden_size=16,
        intermediate_size=16,
        num_hidden_layers=2,
        num_attention_heads=4,
        num_key_value_heads=2,
        max_position_embeddings=64,
        num_local_experts=4,
        num_experts_per_tok=2,
        output_router_logits=True,
        router_aux_loss_coef=0.01,
        router_jitter_noise=0.0,
        pad_token_id=256,
        use_cache=False,
    )


def paragraph_batch():
    paragraphs = [b"Alice was beginning to get very tired", b"The rabbit took a watch"]
    length = max(map(len, paragraphs))
    ids = torch.full((len(paragraphs), length), 256, dtype=torch.long)
    for row, paragraph in enumerate(paragraphs):
        ids[row, :len(paragraph)] = torch.tensor(list(paragraph))
    mask = ids.ne(256).long()
    labels = ids.masked_fill(mask.eq(0), -100)
    return ids, mask, labels


def reconstruct_auxiliary(router_logits, mask, experts, k):
    count = torch.zeros(experts)
    probability_sum = torch.zeros(experts)
    valid = mask.flatten().bool()
    routed_rows = 0
    for logits in router_logits:
        probabilities = logits.float().softmax(-1)[valid]
        selected = probabilities.topk(k, dim=-1).indices
        count += torch.bincount(selected.flatten(), minlength=experts)
        probability_sum += probabilities.sum(0)
        routed_rows += len(probabilities)
    # The installed helper uses count / T; the lesson uses count / (T*k).
    helper = experts * ((count / routed_rows) * (probability_sum / routed_rows)).sum()
    return helper, helper / k, routed_rows


def compare_packed_layer(layer):
    """Copy a real library sparse block, then compare all task gradients."""
    layer = layer.float()
    layer.zero_grad(set_to_none=True)
    hidden = layer.experts.intermediate_dim
    arrays = {
        "router": layer.gate.weight.detach().numpy().copy(),
        "gate": layer.experts.gate_up_proj[:, :hidden].detach().numpy().copy(),
        "up": layer.experts.gate_up_proj[:, hidden:].detach().numpy().copy(),
        "down": layer.experts.down_proj.detach().numpy().copy(),
    }
    ordinary = TorchMoE(arrays, k=layer.top_k).float()
    x = torch.randn(2, 3, layer.gate.hidden_dim, requires_grad=True)
    copied_x = x.detach().reshape(-1, x.shape[-1]).clone().requires_grad_(True)
    upstream = torch.randn_like(x)
    actual = layer(x)
    expected, logits, selected = ordinary(copied_x)
    margins = logits.detach().sort(dim=-1, descending=True).values
    margin = (margins[:, layer.top_k - 1] - margins[:, layer.top_k]).min().item()
    if margin <= 1e-7:
        raise ValueError("Choose a strict-margin comparison input")
    (actual * upstream).sum().backward()
    (expected * upstream.reshape_as(expected)).sum().backward()
    pairs = {
        "output": (actual.flatten(), expected.flatten()),
        "input_gradient": (x.grad.flatten(), copied_x.grad.flatten()),
        "router_gradient": (layer.gate.weight.grad, ordinary.maps["router"].grad),
        "gate_gradient": (layer.experts.gate_up_proj.grad[:, :hidden], ordinary.maps["gate"].grad),
        "up_gradient": (layer.experts.gate_up_proj.grad[:, hidden:], ordinary.maps["up"].grad),
        "down_gradient": (layer.experts.down_proj.grad, ordinary.maps["down"].grad),
    }
    errors = {}
    for name, (actual_value, expected_value) in pairs.items():
        torch.testing.assert_close(actual_value, expected_value, atol=2e-7, rtol=2e-5)
        errors[name] = (actual_value - expected_value).abs().max().item()
    return {"minimum_selection_margin": margin, "maximum_errors": errors}


def run(output):
    if transformers.__version__ != "5.17.0":
        raise RuntimeError("This packed-map example requires transformers==5.17.0")
    if output.exists():
        raise FileExistsError("Choose a new output directory")
    torch.set_num_threads(1)
    torch.manual_seed(17)
    model = MixtralForCausalLM(configuration())
    model.train()
    ids, mask, labels = paragraph_batch()
    result = model(input_ids=ids, attention_mask=mask, labels=labels, use_cache=False)
    shifted_logits = result.logits[:, :-1].reshape(-1, model.config.vocab_size)
    shifted_labels = labels[:, 1:].reshape(-1)
    task = F.cross_entropy(shifted_logits, shifted_labels)
    helper, normalized, routed_rows = reconstruct_auxiliary(
        result.router_logits, mask, model.config.num_local_experts,
        model.config.num_experts_per_tok,
    )
    torch.testing.assert_close(result.aux_loss, helper)
    torch.testing.assert_close(result.loss, task + model.config.router_aux_loss_coef * helper)
    optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
    optimizer.zero_grad(set_to_none=True)
    result.loss.backward()
    gradient_norm = model.model.layers[0].mlp.gate.weight.grad.norm().item()
    before = model.model.layers[0].mlp.gate.weight.detach().clone()
    optimizer.step()
    router_update = (model.model.layers[0].mlp.gate.weight.detach() - before).norm().item()

    # No dropout/jitter: an eval-mode save/reload compares identical inference.
    model.eval()
    with torch.no_grad():
        expected_logits = model(input_ids=ids, attention_mask=mask).logits
    output.mkdir(parents=True)
    model.save_pretrained(output / "model")
    restored = MixtralForCausalLM.from_pretrained(output / "model", local_files_only=True)
    restored.eval()
    with torch.no_grad():
        restored_logits = restored(input_ids=ids, attention_mask=mask).logits
    torch.testing.assert_close(restored_logits, expected_logits)

    strict_logits = torch.log(torch.tensor([[.7, .2, .1, .01], [.1, .2, .7, .01]]))
    strict_helper = load_balancing_loss_func((strict_logits,), num_experts=4, top_k=2)
    p = strict_logits.softmax(-1)
    f = torch.bincount(p.topk(2, dim=-1).indices.flatten(), minlength=4) / 4
    strict_normalized = 4 * (f * p.mean(0)).sum()
    torch.testing.assert_close(strict_helper, 2 * strict_normalized)
    report = {
        "transformers": transformers.__version__,
        "torch": torch.__version__,
        "device": "CPU",
        "logits_shape": list(result.logits.shape),
        "router_shapes": [list(value.shape) for value in result.router_logits],
        "target_count": shifted_labels.ne(-100).sum().item(),
        "routing_rows_per_layer": mask.sum().item(),
        "pooled_routing_rows": routed_rows,
        "task_nll": task.item(),
        "helper_aux": helper.item(),
        "lesson_aux": normalized.item(),
        "total_loss": result.loss.item(),
        "first_router_gradient_norm": gradient_norm,
        "router_update_norm": router_update,
        "reload_max_error": (restored_logits - expected_logits).abs().max().item(),
        "packed_layer": compare_packed_layer(restored.model.layers[0].mlp),
    }
    (output / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("mixtral-example"))
    run(parser.parse_args().output)
