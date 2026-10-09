"""Read-only scientific driver and real-model objective checks before fits."""
import ast
import hashlib
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(root/'scratch/masked-language-runtime'), str(root/'public/learn-code/supervised-fine-tuning')]
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer
import sft_study as study
from sft_data import collate, encode_record, load_source

torch.set_num_threads(2)
folder = root/'docs/teaching/llm-architecture-training/supervised-fine-tuning-sft'
model_path = root/'scratch/sft-research/pythia-14m'
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
records = [encode_record(row, tokenizer) for row in load_source(folder/'research')['train'][:8]]
model = study.load_model(model_path).eval()
before = {name: value.detach().clone() for name, value in model.named_parameters()}
checks = []
for policy in study.POLICIES:
    batch = collate(records, policy)
    model.zero_grad(set_to_none=True)
    result = model(**batch, use_cache=False)
    explicit = F.cross_entropy(result.logits[:, :-1].reshape(-1, result.logits.shape[-1]),
                               batch['labels'][:, 1:].reshape(-1), ignore_index=-100)
    torch.testing.assert_close(explicit, result.loss, atol=1e-6, rtol=1e-6)
    explicit.backward()
    assert all(p.grad is not None and torch.isfinite(p.grad).all() for p in model.parameters())
    checks.append({'policy': policy, 'native_loss': float(result.loss.detach()),
                   'explicit_loss': float(explicit.detach()), 'targets': int((batch['labels'][:, 1:] != -100).sum()),
                   'all_parameter_gradients_finite': True})
for name, value in model.named_parameters():
    torch.testing.assert_close(value, before[name], rtol=0, atol=0)
plans = {}
for seed in study.SEEDS:
    plan = study.batch_plan(seed)
    assert len(plan) == 200 and len(plan[105]) == 3
    assert sorted(i for batch in plan[:106] for i in batch) == list(range(843))
    assert sum(map(len, plan)) == 1595 and plan == study.batch_plan(seed)
    plans[seed] = {'steps': len(plan), 'presentations': sum(map(len, plan)), 'last_full_epoch_batch': len(plan[105])}
for name in study.PROGRAMS: ast.parse((root/'public/learn-code/supervised-fine-tuning'/name).read_text())
files = [root/'public/learn-code/supervised-fine-tuning'/name for name in study.PROGRAMS]
files.append(Path(__file__))
report = {'checks': checks, 'plans': plans, 'optimizer_steps': 0, 'weights_unchanged': True,
          'bindings': {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
(folder/'research/study-program-preflight.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'checks': checks, 'plans': plans, 'optimizer_steps': 0}))
