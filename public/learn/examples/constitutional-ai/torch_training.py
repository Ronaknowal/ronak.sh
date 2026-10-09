"""Match reward/policy gradients, then train a tiny causal completion model.

Install: python -m pip install torch transformers==5.19.0
Run: python torch_training.py --checkpoint tiny_cai_checkpoint
No pretrained checkpoint is downloaded. The random tiny model has no asserted
language capability. Its purpose is to expose labels, shift, loss and parameters.
"""
import argparse
import importlib.metadata
import json
from pathlib import Path
import torch
import torch.nn.functional as F
from transformers import GPT2Config, GPT2LMHeadModel


def scalar_head_match():
    weights = torch.tensor([1.0], dtype=torch.float64, requires_grad=True)
    difference = torch.tensor([[1.0]], dtype=torch.float64)
    target = torch.tensor([.75], dtype=torch.float64)
    logits = difference @ weights
    loss = F.binary_cross_entropy_with_logits(logits, target, reduction="mean")
    loss.backward()
    analytic_gradient = torch.sigmoid(logits.detach()) - target
    before = weights.detach().clone()
    with torch.no_grad():
        weights -= .2 * weights.grad
    return {"loss": float(loss.detach()), "gradient": weights.grad.tolist(),
            "analytic_gradient": analytic_gradient.tolist(), "weights_before": before.tolist(),
            "weights_after": weights.detach().tolist(),
            "max_gradient_difference": float((weights.grad - analytic_gradient).abs().max())}


def policy_match():
    reference = torch.tensor([.6, .2, .2], dtype=torch.float64)
    logits = reference.log().clone().requires_grad_()
    probabilities = logits.softmax(0)
    rewards = torch.tensor([0.0, 0.0, 1.0], dtype=torch.float64)
    log_ratios = logits.log_softmax(0) - reference.log()
    objective = (probabilities * (rewards - log_ratios)).sum()
    gradient, = torch.autograd.grad(objective, logits, retain_graph=True)
    analytic_gradient = probabilities.detach() * (rewards - log_ratios.detach() - objective.detach())
    margin = .5 * (log_ratios[2] - log_ratios[0])
    dpo = F.softplus(-margin)
    dpo_gradient, = torch.autograd.grad(dpo, logits)
    expected_dpo_gradient = torch.tensor([.25, 0, -.25], dtype=torch.float64)
    return {"objective": float(objective.detach()), "gradient": gradient.tolist(),
            "analytic_gradient": analytic_gradient.tolist(),
            "gradient_max_difference": float((gradient - analytic_gradient).abs().max()),
            "dpo_loss": float(dpo.detach()), "dpo_gradient": dpo_gradient.tolist(),
            "dpo_gradient_max_difference": float((dpo_gradient - expected_dpo_gradient).abs().max())}


def train_completion(checkpoint):
    torch.manual_seed(23)
    config = GPT2Config(vocab_size=16, n_positions=16, n_embd=16, n_layer=1, n_head=2,
                        resid_pdrop=0.0, embd_pdrop=0.0, attn_pdrop=0.0,
                        bos_token_id=1, eos_token_id=2, pad_token_id=0)
    model = GPT2LMHeadModel(config)
    model.train()
    # Positions 0..2 are prompt; 3..5 are response including EOS; 6..7 pad.
    input_ids = torch.tensor([[1, 3, 4, 5, 6, 2, 0, 0]])
    attention_mask = torch.tensor([[1, 1, 1, 1, 1, 1, 0, 0]])
    labels = input_ids.clone()
    labels[:, :3] = -100
    labels[attention_mask == 0] = -100
    # GPT2 expects labels at their original positions and shifts internally once.
    output = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
    shift_logits = output.logits[:, :-1, :].contiguous()
    shift_labels = labels[:, 1:].contiguous()
    manual_loss = F.cross_entropy(shift_logits.view(-1, config.vocab_size),
                                  shift_labels.view(-1), ignore_index=-100)
    before = model.transformer.wte.weight.detach().clone()
    optimizer = torch.optim.SGD(model.parameters(), lr=.01)
    optimizer.zero_grad()
    output.loss.backward()
    gradient_norm = float(model.transformer.wte.weight.grad.norm())
    optimizer.step()
    model.eval()
    with torch.inference_mode():
        after = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
    checkpoint = Path(checkpoint)
    checkpoint.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(checkpoint)
    restored = GPT2LMHeadModel.from_pretrained(checkpoint)
    restored.eval()
    with torch.inference_mode():
        reload_logits = restored(input_ids=input_ids, attention_mask=attention_mask).logits
    return {"origin": "random tiny GPT2 model; supplied integer token fixture",
            "input_ids": input_ids.tolist(), "attention_mask": attention_mask.tolist(),
            "same_position_labels": labels.tolist(), "shifted_labels": shift_labels.tolist(),
            "contributing_targets": int((shift_labels != -100).sum()),
            "parameters": sum(p.numel() for p in model.parameters()),
            "loss_before": float(output.loss.detach()), "manual_loss": float(manual_loss.detach()),
            "loss_difference": float((output.loss.detach() - manual_loss.detach()).abs()),
            "embedding_gradient_norm": gradient_norm,
            "embedding_max_change": float((model.transformer.wte.weight.detach() - before).abs().max()),
            "loss_after_one_step": float(after.loss),
            "reload_logits_max_difference": float((after.logits - reload_logits).abs().max()),
            "all_targets_masked": "undefined mean loss; skipped rather than treated as zero"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", default="tiny_cai_checkpoint")
    arguments = parser.parse_args()
    torch.set_num_threads(2)
    result = {"versions": {name: importlib.metadata.version(name) for name in ("torch", "transformers")},
              "scalar_head": scalar_head_match(), "finite_policy": policy_match(),
              "causal_completion": train_completion(arguments.checkpoint)}
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
