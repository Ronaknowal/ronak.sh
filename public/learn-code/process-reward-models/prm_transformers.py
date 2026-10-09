"""Offline causal boundary-classification contracts using Transformers.

python prm_transformers.py --work temporary-model --output transformers.json
Requires PyTorch, Transformers and its ordinary dependencies. The default model
is small and randomly initialized: its probabilities do not verify mathematics.

Optional pretrained inference (not executed for this lesson):
python prm_transformers.py --pretrained --revision FULL_COMMIT_SHA --device cuda
This separate route downloads the Qwen model and executes its pinned custom code.
Consult its separate Qwen license and memory requirements before that route.
"""

import argparse
import json
from pathlib import Path
import re

import torch
import torch.nn.functional as F
import transformers
from transformers import GPT2Config, GPT2ForTokenClassification

SEP, EOS, PAD = 256, 257, 258


def encode_question_steps(question, steps):
    """Byte IDs make this tiny contract explicit; these are not Qwen's tokens."""
    ids = list(question.encode("utf8"))
    positions = []
    for step in steps:
        ids.extend(step.encode("utf8"))
        ids.append(SEP)
        positions.append(len(ids) - 1)
    ids.append(EOS)
    return ids, positions


def verify(work):
    torch.set_num_threads(2)
    torch.manual_seed(37)
    work = Path(work)
    if work.exists():
        raise FileExistsError("Use a new work directory; preserve earlier evidence")
    config = GPT2Config(vocab_size=259, n_positions=32, n_embd=24, n_layer=1,
                        n_head=3, num_labels=3, resid_pdrop=0, embd_pdrop=0,
                        attn_pdrop=0, bos_token_id=None, eos_token_id=EOS, pad_token_id=PAD,
                        id2label={0: "invalid", 1: "neutral", 2: "progress"})
    model = GPT2ForTokenClassification(config).eval()
    ids, boundaries = encode_question_steps("Q", ["a", "b"])
    input_ids = torch.tensor([ids + [PAD], [ord("Q"), ord("c"), SEP, EOS, PAD, PAD, PAD]])
    attention = torch.tensor([[1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 0, 0, 0]])
    labels = torch.full_like(input_ids, -100)
    labels[0, boundaries] = torch.tensor([2, 0])
    labels[1, 2] = 1
    outputs = model(input_ids=input_ids, attention_mask=attention, labels=labels)
    eligible = labels != -100
    manual = F.cross_entropy(outputs.logits[eligible], labels[eligible])
    checks = []

    def close(name, actual, expected, **kwargs):
        torch.testing.assert_close(actual, expected, **kwargs)
        checks.append({"name": name, "passed": True})

    close("same-position library CE", outputs.loss, manual)
    assert boundaries == [2, 4] and int(eligible.sum()) == 3
    checks.append({"name": "literal current boundary labels", "passed": True})
    changed = input_ids.clone()
    changed[0, 3] = ord("z")
    changed_outputs = model(input_ids=changed, attention_mask=attention)
    close("future edit cannot change earlier boundary", changed_outputs.logits[0, 2], outputs.logits[0, 2], atol=0, rtol=0)
    assert not torch.equal(changed_outputs.logits[0, 4], outputs.logits[0, 4])
    checks.append({"name": "later boundary responds to visible edit", "passed": True})
    padded_change = input_ids.clone()
    padded_change[attention == 0] = 17
    padded_outputs = model(input_ids=padded_change, attention_mask=attention)
    close("masked padding cannot change eligible logits", padded_outputs.logits[eligible], outputs.logits[eligible], atol=0, rtol=0)
    assert int(((input_ids == EOS) & (attention == 1)).sum()) == 2
    assert int(((input_ids == PAD) & (attention == 0)).sum()) == 4
    checks.append({"name": "EOS visible and PAD excluded by position", "passed": True})

    model.zero_grad()
    # A single later classifier target sends gradient into earlier contextual
    # embeddings. It is not necessary to supervise every token directly.
    one_label = torch.full_like(labels, -100)
    one_label[0, 4] = 0
    model(input_ids=input_ids, attention_mask=attention, labels=one_label).loss.backward()
    embedding_gradient = float(model.transformer.wte.weight.grad[ord("Q")].norm())
    assert embedding_gradient > 0
    checks.append({"name": "earlier question embedding receives contextual gradient", "passed": True})
    optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
    before = {name: value.detach().clone() for name, value in model.named_parameters()}
    all_ignored = torch.full_like(labels, -100)
    if (all_ignored != -100).any():
        optimizer.zero_grad()
        model(input_ids=input_ids, attention_mask=attention, labels=all_ignored).loss.backward()
        optimizer.step()
    for name, value in model.named_parameters():
        close(f"null batch preserves {name}", value.detach(), before[name], atol=0, rtol=0)
    model.save_pretrained(work)
    restored = GPT2ForTokenClassification.from_pretrained(work).eval()
    close("save/reload exact logits", restored(input_ids=input_ids, attention_mask=attention).logits,
          outputs.logits, atol=0, rtol=0)
    return {"checks": checks, "passed": len(checks), "torch": torch.__version__,
            "transformers": transformers.__version__, "seed": 37,
            "parameters": sum(p.numel() for p in model.parameters()),
            "input_ids": input_ids.tolist(), "attention_mask": attention.tolist(),
            "same_position_labels": labels.tolist(), "eligible_targets": int(eligible.sum()),
            "library_mean_ce": float(outputs.loss.detach()), "manual_mean_ce": float(manual.detach()),
            "earlier_embedding_gradient_norm": embedding_gradient,
            "boundary_probabilities": outputs.logits.softmax(-1)[eligible].detach().tolist(),
            "scientific_fits": 0, "pretrained_inference_executed": False,
            "scope": "Random small architecture/API contract; no mathematical competence"}


def pretrained(revision, device):
    if not revision or re.fullmatch(r"[0-9a-f]{40}", revision) is None:
        raise ValueError("A full immutable upstream commit SHA is required")
    from transformers import AutoModel, AutoTokenizer
    name = "Qwen/Qwen2.5-Math-PRM-7B"
    tokenizer = AutoTokenizer.from_pretrained(name, revision=revision, trust_remote_code=True)
    boundary_ids = tokenizer.encode("<extra_0>", add_special_tokens=False)
    if len(boundary_ids) != 1:
        raise ValueError("Expected one atomic step-boundary token")
    steps = ["Expand to 2x+2=8.", "Subtract 2: 2x=6.", "Divide by 2: x=3."]
    messages = [{"role": "system", "content": "Reason step by step."},
                {"role": "user", "content": "Solve 2(x+1)=8."},
                {"role": "assistant", "content": "<extra_0>".join(steps) + "<extra_0>"}]
    conversation = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
    ids = tokenizer(conversation, add_special_tokens=False, return_tensors="pt")["input_ids"]
    dtype = torch.bfloat16 if device.startswith("cuda") else torch.float32
    model = AutoModel.from_pretrained(name, revision=revision, trust_remote_code=True,
                                      torch_dtype=dtype).to(device).eval()
    ids = ids.to(device)
    with torch.no_grad():
        logits = model(input_ids=ids)[0]
        if logits.shape[-1] != 2:
            raise ValueError("Expected a two-class Qwen PRM head")
        mask = ids == boundary_ids[0]
        if int(mask.sum()) != len(steps):
            raise ValueError("Serialized step count differs from boundary count")
        rewards = logits.softmax(-1)[mask][:, 1].float().cpu().tolist()
    return {"model": name, "revision": revision, "steps": steps,
            "boundary_token_id": boundary_ids[0], "serialized_chat": conversation,
            "positive_step_probabilities": rewards, "pretrained_inference_executed": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--work", type=Path, default=Path("prm-random-model"))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--pretrained", action="store_true")
    parser.add_argument("--revision")
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()
    report = pretrained(args.revision, args.device) if args.pretrained else verify(args.work)
    text = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf8")
    print(text)


if __name__ == "__main__":
    main()
