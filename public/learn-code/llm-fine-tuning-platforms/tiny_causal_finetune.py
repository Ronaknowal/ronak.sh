"""CPU mechanics experiment: shifted/masked token loss and a PEFT update.

The base is randomly initialized, not a pretrained useful language model.
All token sequences are invented fixtures embedded here; no downloads.
"""
import json

import torch
from peft import LoraConfig, get_peft_model
from transformers import LlamaConfig, LlamaForCausalLM


def masked_causal_loss(logits, labels):
    prediction = logits[:, :-1, :]
    target = labels[:, 1:]
    active = target.ne(-100)
    active_target = target[active]
    if active_target.numel() == 0:
        raise ValueError("No supervised next-token targets remain after shifting and masking")
    if ((active_target < 0) | (active_target >= logits.shape[-1])).any():
        raise ValueError("Active labels must be vocabulary IDs; only -100 is ignored")
    active_prediction = prediction[active]
    chosen = active_prediction.gather(-1, active_target.unsqueeze(-1)).squeeze(-1)
    return (torch.logsumexp(active_prediction, dim=-1) - chosen).mean()


def check_loss_contract(logits, labels):
    # A changed supervision mask must match the ordinary stable loss and gradients.
    changed = labels.clone()
    changed[0, 4] = -100
    manual_logits = logits.detach().clone().requires_grad_()
    library_logits = logits.detach().clone().requires_grad_()
    manual = masked_causal_loss(manual_logits, changed)
    library = torch.nn.functional.cross_entropy(
        library_logits[:, :-1, :].reshape(-1, logits.shape[-1]),
        changed[:, 1:].reshape(-1), ignore_index=-100)
    torch.testing.assert_close(manual, library, rtol=1e-6, atol=1e-6)
    manual_gradient, = torch.autograd.grad(manual, manual_logits)
    library_gradient, = torch.autograd.grad(library, library_logits)
    torch.testing.assert_close(manual_gradient, library_gradient, rtol=1e-6, atol=1e-6)
    rejected = 0
    for invalid in (torch.full_like(labels, -100), -1, logits.shape[-1]):
        malformed = invalid if isinstance(invalid, torch.Tensor) else labels.clone()
        if not isinstance(invalid, torch.Tensor):
            malformed[0, 4] = invalid
        try:
            masked_causal_loss(logits, malformed)
        except ValueError:
            rejected += 1
        else:
            raise AssertionError("Invalid supervision was accepted")
    return {"changed_mask_loss_error": abs(manual.item() - library.item()),
            "changed_mask_gradient_error": (manual_gradient - library_gradient).abs().max().item(),
            "invalid_supervision_cases_rejected": rejected}


def main():
    torch.set_num_threads(1)
    torch.manual_seed(12)
    config = LlamaConfig(vocab_size=12, hidden_size=16, intermediate_size=32,
                         num_hidden_layers=1, num_attention_heads=2,
                         num_key_value_heads=2, max_position_embeddings=32,
                         pad_token_id=0, bos_token_id=1, eos_token_id=2,
                         attention_dropout=0, use_cache=False)
    base = LlamaForCausalLM(config)
    model = get_peft_model(base, LoraConfig(r=2, lora_alpha=4, lora_dropout=0,
                           target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM"))
    # 1=BOS, 2=EOS, 3=user, 4=assistant. Other IDs are invented content.
    tokens = torch.tensor([[1, 3, 5, 4, 6, 2, 0], [1, 3, 7, 4, 8, 9, 2]])
    attention_mask = tokens.ne(0).long()
    labels = tokens.clone()
    labels[:, :4] = -100
    labels[attention_mask == 0] = -100
    optimizer = torch.optim.AdamW((p for p in model.parameters() if p.requires_grad), lr=.02)
    model.train()
    first = model(input_ids=tokens, attention_mask=attention_mask, labels=labels)
    manual = masked_causal_loss(first.logits, labels)
    torch.testing.assert_close(manual, first.loss, rtol=1e-6, atol=1e-6)
    loss_contract = check_loss_contract(first.logits, labels)
    initial = first.loss.item()
    for _ in range(30):
        optimizer.zero_grad(set_to_none=True)
        result = model(input_ids=tokens, attention_mask=attention_mask, labels=labels)
        result.loss.backward()
        optimizer.step()
    model.eval()
    with torch.no_grad():
        final = model(input_ids=tokens, attention_mask=attention_mask, labels=labels).loss.item()
    assert final < initial
    print(json.dumps({"active_shifted_targets": labels[:, 1:].ne(-100).sum().item(),
                      "manual_library_loss_error": abs(manual.item() - initial),
                      "loss_contract": loss_contract,
                      "initial_fixture_loss": initial, "final_fixture_loss": final,
                      "trainable_parameters": sum(p.numel() for p in model.parameters() if p.requires_grad)}, indent=2))


if __name__ == "__main__":
    main()
