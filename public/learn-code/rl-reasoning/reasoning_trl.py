"""Ordinary pretrained TRL GRPO: inspect the task signal and exact native loss.

python reasoning_trl.py --model pythia-14m --output native-reasoning
CPU, TRL1.14.2, Transformers5.19.0, Torch2.14.0. The supplied GSM8K slice
is a deterministic interface example, not a benchmark-quality experiment.
No reward or hyperparameter changes are made after seeing its outputs.
"""
import argparse
import hashlib
import json
from pathlib import Path
import torch
import trl
import transformers
from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import GRPOConfig, GRPOTrainer
from reasoning_checks import gsm_reward

ROOT = Path(__file__).resolve().parent
MODEL_SHA = '116a02532db461f91386a5b20f942ff2c8d4de7341e21b55caafc3d7b25f49a1'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tensor_digest(model):
    result = hashlib.sha256()
    for name, value in sorted(model.state_dict().items()):
        result.update(name.encode())
        result.update(value.detach().cpu().contiguous().view(torch.uint8).numpy().tobytes())
    return result.hexdigest()


def save(path, value):
    with path.open('x', encoding='utf-8') as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write('\n')


def prompt(question):
    return 'Solve the arithmetic word problem. End with #### followed by the numeric answer.\nQuestion: ' + question + '\nAnswer:'


class InspectedGRPO(GRPOTrainer):
    """Keep native generated training tensors; do not replace native training."""
    def __init__(self, *args, **kwargs):
        self.observed_batches = []
        self.last_logps = None
        super().__init__(*args, **kwargs)

    def _get_per_token_logps_and_entropies(self, *args, **kwargs):
        output = super()._get_per_token_logps_and_entropies(*args, **kwargs)
        self.last_logps = output[0]
        return output

    def _generate_and_score_completions(self, inputs):
        result = super()._generate_and_score_completions(inputs)
        self.observed_batches.append({name: result[name].detach().cpu().tolist() for name in
                                     ('prompt_ids', 'prompt_mask', 'completion_ids', 'completion_mask', 'advantages')})
        return result


def loss_parity(trainer):
    """A declared nonzero constructed batch, separate from GSM8K success."""
    model = trainer.model
    model.eval()
    prompts = torch.tensor([[2, 3], [2, 3], [2, 3], [2, 3]])
    completions = torch.tensor([[4, 0, 0], [5, 6, 0], [7, 0, 0], [8, 9, 0]])
    mask = torch.tensor([[1, 1, 0], [1, 1, 1], [1, 1, 0], [1, 1, 1]])
    rewards = torch.tensor([1., 0., 0., 1.])
    # Current TRL uses sample standard deviation (Bessel correction), plus1e-4.
    advantage = (rewards - rewards.mean()) / (rewards.std(correction=1) + 1e-4)
    ids = torch.cat([prompts, completions], dim=1)
    valid = torch.cat([torch.ones_like(prompts), mask], dim=1)
    with torch.no_grad():
        old, _, _ = trainer._get_per_token_logps_and_entropies(model, ids, valid, 3)
    observations = []
    for ratio_shift in (0., .4, -.4):
        inputs = {'prompt_ids': prompts, 'prompt_mask': torch.ones_like(prompts),
                  'completion_ids': completions, 'completion_mask': mask,
                  'advantages': advantage, 'old_per_token_logps': old - ratio_shift,
                  'num_items_in_batch': mask.sum()}
        native = trainer._compute_loss(model, inputs)
        live = trainer.last_logps
        native_gradient = torch.autograd.grad(native, live)[0]
        independent = live.detach().clone().requires_grad_(True)
        ratio = (independent - inputs['old_per_token_logps']).exp()
        terms = -torch.minimum(ratio * advantage[:, None], ratio.clamp(.8, 1.2) * advantage[:, None])
        manual = ((terms * mask).sum(1) / mask.sum(1)).mean()
        gradient = torch.autograd.grad(manual, independent)[0]
        torch.testing.assert_close(native, manual, atol=2e-7, rtol=2e-6)
        torch.testing.assert_close(native_gradient, gradient, atol=2e-7, rtol=2e-6)
        assert torch.count_nonzero(native_gradient) > 0
        observations.append({'log_ratio_shift': ratio_shift, 'native_loss': float(native.detach()),
                             'manual_loss': float(manual.detach()), 'gradient': gradient.tolist()})
    return {'kind': 'constructed nonzero mechanism; not sampled task rewards',
            'rewards': rewards.tolist(), 'advantages': advantage.tolist(),
            'completion_mask': mask.tolist(), 'cases': observations}


@torch.no_grad()
def heldout(model, tokenizer, records):
    results = []
    model.eval()
    torch.manual_seed(193)
    for row in records:
        encoded = tokenizer(prompt(row['question']), return_tensors='pt')
        tokens = model.generate(**encoded, do_sample=True, temperature=1., top_p=1., top_k=0,
                                num_return_sequences=4, max_new_tokens=96,
                                pad_token_id=tokenizer.pad_token_id, eos_token_id=tokenizer.eos_token_id)
        for sequence in tokens:
            completion = sequence[encoded['input_ids'].shape[1]:].tolist()
            ended = tokenizer.eos_token_id in completion
            if ended:
                completion = completion[:completion.index(tokenizer.eos_token_id) + 1]
            text = tokenizer.decode(completion, skip_special_tokens=True)
            results.append({'id': row['id'], 'question': row['question'], 'reference': row['answer'],
                            'ids': completion, 'text': text, 'terminated': ended,
                            'answer_reward': gsm_reward(text, row['answer']),
                            'reward': gsm_reward(text, row['answer']) * ended})
    return results


def run(model_path, output, preflight_only=False):
    output.mkdir(parents=True, exist_ok=False)
    torch.set_num_threads(2)
    if digest(model_path / 'model.safetensors') != MODEL_SHA:
        raise ValueError('Use the pinned pretrained Pythia14m source')
    records = json.loads((ROOT / 'data/gsm8k-slice.json').read_text(encoding='utf-8'))
    train = [row for row in records if row['split'] == 'train']
    test = [row for row in records if row['split'] == 'test']
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = 'left'
    model = AutoModelForCausalLM.from_pretrained(model_path, local_files_only=True).float()
    assert max(len(tokenizer.encode(prompt(row['question']))) for row in records) + 96 <= model.config.max_position_embeddings
    reward_records = []
    def verified_reward(prompts, completions, completion_ids, reference, source_id, **kwargs):
        rewards = []
        for question, text, ids, expected, identity in zip(prompts, completions, completion_ids, reference, source_id):
            ended = tokenizer.eos_token_id in ids
            score = gsm_reward(text, expected) * ended
            rewards.append(score)
            reward_records.append({'id': identity, 'prompt': question, 'completion': text,
                                   'ids': ids, 'reference': expected, 'terminated': ended, 'reward': score})
        return rewards
    configuration = GRPOConfig(output_dir=str(output / 'trainer'), use_cpu=True, bf16=False, fp16=False,
        per_device_train_batch_size=8, gradient_accumulation_steps=1, num_generations=4,
        max_steps=2, learning_rate=1e-6, weight_decay=0., lr_scheduler_type='constant',
        max_completion_length=96, temperature=1., top_p=1., top_k=0, beta=0.,
        loss_type='grpo', scale_rewards='group', num_iterations=1, epsilon=.2,
        importance_sampling_level='token', mask_truncated_completions=False,
        disable_dropout=True, gradient_checkpointing=False, report_to='none',
        save_strategy='no', logging_steps=1, seed=173, data_seed=173, max_grad_norm=1.)
    data = Dataset.from_list([{'prompt': prompt(row['question']), 'reference': row['answer'], 'source_id': row['id']} for row in train])
    trainer = InspectedGRPO(model=model, args=configuration, train_dataset=data,
                            reward_funcs=verified_reward, processing_class=tokenizer)
    parity = loss_parity(trainer)
    save(output / 'parity.json', parity)
    if preflight_only:
        save(output / 'preflight.json', {'optimizer_steps': 0, 'generation': 0, 'parity_passed': True})
        return
    before = tensor_digest(model)
    save(output / 'protocol.json', {'kind': 'fixed native interface experiment, not R1 reproduction',
        'model_sha256': MODEL_SHA, 'data_sha256': digest(ROOT / 'data/gsm8k-slice.json'),
        'program_sha256': digest(Path(__file__)), 'configuration': configuration.to_dict(),
        'versions': {'torch': torch.__version__, 'trl': trl.__version__, 'transformers': transformers.__version__},
        'reward': 'one strict terminal #### numeric answer correct AND actual EOS',
        'train_records': 16, 'test_records': 8, 'test_draws': 4, 'selection': 'none; retain zero-signal outcome'})
    result = trainer.train()
    after = tensor_digest(model)
    trainer.save_model(str(output / 'saved-model'))
    reloaded = AutoModelForCausalLM.from_pretrained(output / 'saved-model', local_files_only=True).float().eval()
    assert tensor_digest(reloaded) == after
    test_outputs = heldout(reloaded, tokenizer, test)
    save(output / 'report.json', {'train_metrics': result.metrics, 'train_rewards': reward_records,
        'native_batches': trainer.observed_batches, 'heldout': test_outputs,
        'before_digest': before, 'after_digest': after, 'weights_changed': before != after,
        'saved_reload_exact': True, 'parity': parity,
        'limitation': 'Sixteen train records, two updates and eight test questions demonstrate the interface only; no benchmark or capability claim.'})
    print(json.dumps({'train_completions': len(reward_records), 'train_reward_sum': sum(r['reward'] for r in reward_records),
                      'test_completions': len(test_outputs), 'test_reward_sum': sum(r['reward'] for r in test_outputs),
                      'weights_changed': before != after, 'reload_exact': True}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--preflight-only', action='store_true')
    args = parser.parse_args()
    run(args.model, args.output, args.preflight_only)
