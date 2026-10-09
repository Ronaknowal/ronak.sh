"""An offline Transformers contract check, not a pretrained language experiment.
Run: python causal_library.py  (PyTorch and transformers)
"""
import json
import torch
import torch.nn.functional as F
import transformers
from transformers import GPT2Config, GPT2LMHeadModel


def main():
    torch.set_num_threads(2)
    torch.manual_seed(17)
    # EOS and PAD deliberately share ID 7; their positions have different roles.
    ids = torch.tensor([[1, 2, 3, 7, 7], [1, 4, 7, 7, 7]])
    attention = torch.tensor([[1, 1, 1, 1, 0], [1, 1, 1, 0, 0]])
    labels = ids.clone()
    labels[attention == 0] = -100
    config = GPT2Config(vocab_size=8, n_positions=16, n_embd=16, n_layer=1, n_head=2,
                        resid_pdrop=0, embd_pdrop=0, attn_pdrop=0,
                        bos_token_id=1, eos_token_id=7, pad_token_id=7)
    model = GPT2LMHeadModel(config)
    model.eval()
    output = model(input_ids=ids, attention_mask=attention, labels=labels, use_cache=False)
    shifted_targets = labels[:, 1:]
    explicit = F.cross_entropy(output.logits[:, :-1].reshape(-1, 8), shifted_targets.reshape(-1), ignore_index=-100)
    torch.testing.assert_close(output.loss, explicit)
    valid = int((shifted_targets != -100).sum())
    output.loss.backward()
    print(json.dumps({"transformers": transformers.__version__, "torch": torch.__version__,
                      "labels": labels.tolist(), "valid_shifted_targets": valid,
                      "library_mean_nats": output.loss.item(), "explicit_mean_nats": explicit.item(),
                      "eos_targets_retained": int((shifted_targets == 7).sum()),
                      "embedding_gradient_norm": model.transformer.wte.weight.grad.norm().item()}, indent=2))


if __name__ == "__main__":
    main()
