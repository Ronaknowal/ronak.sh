"""Pretrained teacher -> three-layer student, with an ordinary TRL route.

Requires torch 2.14, transformers 5.19, trl 1.14.2, datasets 5.1, accelerate 1.15.
Provide the pinned Pythia-14M base, the inspected SFT response-17 teacher and
the exact Poem Sentiment TSV directory. Nothing downloads or selects a teacher.

python distillation_native.py preflight --base BASE --teacher TEACHER --data DATA --work WORK
python distillation_native.py freeze --base BASE --teacher TEACHER --data DATA --work WORK
python distillation_native.py run --base BASE --teacher TEACHER --data DATA --work WORK

Preflight performs no fitting or generation. Freeze must precede either route.
Run preserves terminal stages and resumes incomplete optimizer checkpoints.
The two recipes change both prefix source and target type: no isolated causal
claim follows their comparison. Native temperature scales logits without T^2.
"""
import argparse
import copy
import hashlib
import inspect
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import torch
import torch.nn.functional as F
import transformers
import trl
from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, set_seed
from trl import DistillationConfig, DistillationTrainer

from sft_data import collate, encode_record, load_source, prompt
from sft_evaluate import evaluate, greedy_completions


TEACHER_SHA = '8ffe40fc676d22d608b58b35af11bf467c36981dbb3ccfe373a7d574bd8251cd'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def tensor_sha(model):
    digest = hashlib.sha256()
    for name, tensor in model.state_dict().items():
        digest.update(name.encode())
        digest.update(tensor.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    temporary.replace(path)


def load_models(args):
    if sha(args.teacher / 'model.safetensors') != TEACHER_SHA:
        raise ValueError('Teacher identity differs from the predeclared SFT checkpoint')
    tokenizer = AutoTokenizer.from_pretrained(args.base, local_files_only=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = 'left'
    saved_tokenizer = AutoTokenizer.from_pretrained(args.teacher, local_files_only=True)
    # Transformers save_pretrained can normalize JSON serialization. Bind both
    # original files in the protocol, then check events and actual encodings.
    # A byte mismatch is not permission to silently realign arbitrary vocabularies.
    assert tokenizer.get_vocab() == saved_tokenizer.get_vocab()
    assert tokenizer.eos_token_id == saved_tokenizer.eos_token_id == 0
    for split in load_source(args.data).values():
        for row in split:
            for candidate in ['negative', 'no impact', 'positive']:
                a = encode_record(row, tokenizer, candidate=candidate)
                b = encode_record(row, saved_tokenizer, candidate=candidate)
                assert a['ids'] == b['ids'] and a['prompt_ids'] == b['prompt_ids']
    teacher = AutoModelForCausalLM.from_pretrained(args.teacher, local_files_only=True).float().eval()
    teacher.requires_grad_(False)
    student = AutoModelForCausalLM.from_pretrained(args.base, local_files_only=True).float().eval()
    student.gpt_neox.layers = torch.nn.ModuleList([student.gpt_neox.layers[i] for i in (0, 2, 4)])
    student.config.num_hidden_layers = 3
    # Copying modules preserves their old cache addresses (0, 2, 4). The new
    # three-layer cache needs contiguous addresses; parameter tensors do not move.
    for index, block in enumerate(student.gpt_neox.layers):
        block.attention.layer_idx = index
    assert sum(p.numel() for p in teacher.parameters()) == 14067712
    assert sum(p.numel() for p in student.parameters()) == 13472896
    return tokenizer, teacher, student


def config(output, steps=24):
    return DistillationConfig(
        output_dir=str(output), use_cpu=True, bf16=False, fp16=False,
        gradient_checkpointing=False, report_to='none', max_steps=steps,
        per_device_train_batch_size=4, gradient_accumulation_steps=1,
        learning_rate=1e-4, lr_scheduler_type='constant', warmup_steps=0,
        weight_decay=0., max_grad_norm=1., optim='adamw_torch',
        adam_beta1=.9, adam_beta2=.999, adam_epsilon=1e-8,
        seed=17, data_seed=17, max_completion_length=8,
        temperature=1., beta=0., top_k=0, top_p=1.,
        disable_dropout=True, save_strategy='steps', save_steps=6,
        logging_steps=1, dataloader_num_workers=0,
    )


def full_loss(student, teacher, batch, beta, temperature):
    ids = torch.cat([batch['prompt_ids'], batch['completion_ids']], dim=1)
    mask = torch.cat([batch['prompt_mask'], batch['completion_mask']], dim=1)
    length = batch['completion_ids'].shape[1]
    lp = (student(ids, attention_mask=mask, use_cache=False).logits[:, -length-1:-1].float() /
          temperature).log_softmax(-1)
    with torch.no_grad():
        lq = (teacher(ids, attention_mask=mask, use_cache=False).logits[:, -length-1:-1].float() /
              temperature).log_softmax(-1)
    p, q = lp.exp(), lq.exp()
    if beta == 0:
        terms = F.kl_div(lp, lq, reduction='none', log_target=True)
    elif beta == 1:
        terms = F.kl_div(lq, lp, reduction='none', log_target=True)
    else:
        beta_t = torch.tensor(beta, dtype=lp.dtype, device=lp.device)
        lm = torch.logsumexp(torch.stack([lp + torch.log1p(-beta_t),
                                         lq + torch.log(beta_t)]), dim=0)
        terms = (beta*F.kl_div(lm, lq, reduction='none', log_target=True) +
                 (1-beta)*F.kl_div(lm, lp, reduction='none', log_target=True))
    valid = batch['completion_mask']
    return (terms.sum(-1)*valid).sum() / valid.sum().clamp_min(1)


def preflight(args):
    if (args.work / 'protocol.json').exists():
        raise ValueError('Preflight is a before-freeze operation; reuse its retained report')
    tokenizer, teacher, student = load_models(args)
    teacher_before, student_before = tensor_sha(teacher), tensor_sha(student)
    dataset = Dataset.from_dict({'prompt': ['Literal diagnostic prefix:']})
    trainer = DistillationTrainer(model=student, teacher_model=teacher,
                                  args=config(args.work / 'preflight-trainer', 1),
                                  processing_class=tokenizer, train_dataset=dataset)
    student.eval()
    # Unequal left-padded prompts; completion EOS=0 is a real target, while the
    # other stored 0 is padding. Masks, never token identity, separate them.
    batch = {'prompt_ids': torch.tensor([[0, 11, 22], [11, 22, 33]]),
             'prompt_mask': torch.tensor([[0, 1, 1], [1, 1, 1]]),
             'completion_ids': torch.tensor([[12, 0, 0], [15, 16, 0]]),
             'completion_mask': torch.tensor([[1, 1, 0], [1, 1, 1]])}
    cases = []
    for beta in (0., .5, 1.):
        for temperature in (1., 2.):
            trainer.beta, trainer.temperature = beta, temperature
            student.zero_grad(set_to_none=True)
            native = trainer.compute_loss(student, batch)
            native.backward()
            gradients = {name: p.grad.clone() for name, p in student.named_parameters()}
            student.zero_grad(set_to_none=True)
            manual = full_loss(student, teacher, batch, beta, temperature)
            manual.backward()
            torch.testing.assert_close(native, manual, atol=3e-5, rtol=3e-5)
            errors = []
            squared_error, squared_reference = 0., 0.
            for name, parameter in student.named_parameters():
                difference = gradients[name]-parameter.grad
                assert torch.isfinite(parameter.grad).all() and torch.isfinite(gradients[name]).all()
                errors.append(float(difference.abs().max()))
                squared_error += float(difference.double().square().sum())
                squared_reference += float(parameter.grad.double().square().sum())
            relative_l2 = (squared_error / max(squared_reference, 1e-30))**.5
            # Packed versus full FP32 projection changes reduction order; small
            # near-zero coordinates make elementwise relative error misleading.
            # Guard the entire parameter gradient and retain max absolute error.
            assert relative_l2 < 1e-4, relative_l2
            assert all(p.grad is None for p in teacher.parameters())
            cases.append({'beta': beta, 'temperature': temperature,
                          'native_loss': float(native.detach()), 'full_loss': float(manual.detach()),
                          'parameters_compared': len(gradients), 'max_gradient_error': max(errors),
                          'gradient_relative_l2': relative_l2})
    # Diagnose FP32 projection/reduction sensitivity with the SAME whole-model
    # paths at higher precision. The native library still uses FP32 softmax.
    student.double()
    teacher.double()
    precision_cases = []
    for beta in (0., .5, 1.):
        trainer.beta, trainer.temperature = beta, 1.
        student.zero_grad(set_to_none=True)
        native = trainer.compute_loss(student, batch)
        native.backward()
        gradients = {name: p.grad.clone() for name, p in student.named_parameters()}
        student.zero_grad(set_to_none=True)
        manual = full_loss(student, teacher, batch, beta, 1.)
        manual.backward()
        squared_error = sum(float((gradients[name]-p.grad).square().sum())
                            for name, p in student.named_parameters())
        squared_reference = sum(float(p.grad.square().sum()) for p in student.parameters())
        relative_l2 = (squared_error/max(squared_reference, 1e-30))**.5
        assert relative_l2 < 1e-8, relative_l2
        precision_cases.append({'beta': beta, 'gradient_relative_l2': relative_l2})
    student.float()
    teacher.float()
    student.zero_grad(set_to_none=True)
    empty = {**batch, 'completion_mask': torch.zeros_like(batch['completion_mask'])}
    null = trainer.compute_loss(student, empty)
    null.backward()
    assert float(null.detach()) == 0.
    assert all(p.grad is None or not torch.count_nonzero(p.grad) for p in student.parameters())
    trainer.log({'preflight_only': 1})
    assert tensor_sha(student) == student_before and tensor_sha(teacher) == teacher_before
    student.save_pretrained(args.work / 'preflight-reload', safe_serialization=True)
    restored = AutoModelForCausalLM.from_pretrained(args.work / 'preflight-reload', local_files_only=True).eval()
    assert tensor_sha(restored) == student_before
    with torch.no_grad():
        torch.testing.assert_close(student(batch['prompt_ids'], attention_mask=batch['prompt_mask']).logits,
                                   restored(batch['prompt_ids'], attention_mask=batch['prompt_mask']).logits,
                                   atol=0., rtol=0.)
    splits = load_source(args.data)
    train = sorted(splits['train'], key=lambda row: row['id'])[:64]
    encoded = [encode_record(row, tokenizer) for row in train]
    assert all(len(row['prompt_ids']) + 8 <= 64 for row in encoded)
    write(args.work / 'preflight.json', {
        'scope': 'Zero generation, zero optimizer steps; full model gradients and serialization',
        'cases': cases, 'fp64_projection_fp32_softmax_cases': precision_cases,
        'all_masked_null': True, 'teacher_unchanged': True,
        'student_unchanged': True, 'reload_exact': True, 'train_ids': [r['id'] for r in train],
        'tokenizer_contract': 'Exact vocabulary/EOS and all1052x3 complete candidate and prompt encodings; both file identities retained',
        'batch': {k: v.tolist() for k, v in batch.items()}, 'initial_student_sha256': student_before,
    })


def contract(args):
    source = Path(__file__).parent
    return {'programs': {name: sha(source/name) for name in
                         ['distillation_native.py', 'sft_data.py', 'sft_evaluate.py']},
            'base': {p.name: sha(p) for p in sorted(args.base.iterdir()) if p.is_file()},
            'teacher': {p.name: sha(p) for p in sorted(args.teacher.iterdir()) if p.is_file()},
            'data': {name: sha(args.data/name) for name in ['train.tsv', 'dev.tsv', 'test.tsv']},
            'trl_source': sha(inspect.getfile(DistillationTrainer)),
            'versions': {'torch': torch.__version__, 'transformers': transformers.__version__, 'trl': trl.__version__}}


def freeze(args):
    if (args.work / 'protocol.json').exists():
        raise FileExistsError('Preserve the existing prospective protocol')
    pre = read(args.work / 'preflight.json')
    write(args.work / 'protocol.json', {
        'at': datetime.now(timezone.utc).isoformat(), 'boundary': 'Before scientific generation or update',
        'contract': contract(args), 'preflight_sha256': sha(args.work/'preflight.json'),
        'train_ids': pre['train_ids'], 'initial_student_sha256': pre['initial_student_sha256'],
        'recipes': ['offline teacher greedy response CE', 'on-policy native full-vocabulary forward KL'],
        'steps': 24, 'batch': 4, 'seed': 17, 'lr': 1e-4, 'weight_decay': 0., 'clip': 1.,
        'temperature': 1., 'beta': 0., 'max_completion': 8, 'generation_top_k': 0,
        'evaluation': 'After both terminal routes; initial, teacher and both final students on all105dev/104test; no selection',
        'failures': 'Retain failures; no quality-driven retry; checkpoint resumes conserve source/protocol',
    })


class RecordedTrainer(DistillationTrainer):
    """Use the ordinary trainer while retaining its actual on-policy tokens."""

    def _generate_and_score_completions(self, inputs):
        result = super()._generate_and_score_completions(inputs)
        fields = ['prompt_ids', 'prompt_mask', 'completion_ids', 'completion_mask']
        record = {'step': self.state.global_step,
                  **{key: result[key].detach().cpu().tolist() for key in fields}}
        with (Path(self.args.output_dir) / 'generated.jsonl').open('a', encoding='utf-8') as handle:
            handle.write(json.dumps(record) + '\n')
        return result


def offline(args, tokenizer, teacher, initial, train):
    folder = args.work/'offline'
    folder.mkdir(exist_ok=True)
    if (folder/'terminal.json').exists():
        return read(folder/'terminal.json')
    corpus_file = args.work/'teacher-corpus.json'
    if not corpus_file.exists():
        encoded = [encode_record(row, tokenizer) for row in train]
        outputs = greedy_completions(teacher, tokenizer, encoded, batch_size=4, max_new_tokens=8)
        write(corpus_file, {'teacher_sha256': TEACHER_SHA, 'rows': outputs})
    outputs = read(corpus_file)['rows']
    by_id = {row['id']: row for row in outputs}
    rows = []
    for row in train:
        result = by_id[row['id']]
        if not result['eos_stopped']:
            continue  # Exclude the whole nonterminated sequence; never replace with gold.
        encoded = encode_record(row, tokenizer)
        rows.append({**encoded, 'ids': encoded['prompt_ids'] + result['ids']})
    if not rows:
        terminal = {'status': 'unavailable', 'reason': 'No teacher completion terminated within8tokens', 'steps': 0}
        write(folder/'terminal.json', terminal)
        return terminal
    model = copy.deepcopy(initial).train()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.)
    generator = torch.Generator().manual_seed(17)
    plan = []
    while len(plan) < 24:
        order = torch.randperm(len(rows), generator=generator).tolist()
        plan.extend(order[i:i+4] for i in range(0, len(order), 4))
    plan = plan[:24]
    history, start = [], 0
    checkpoint = folder/'resume.pt'
    if checkpoint.exists():
        state = torch.load(checkpoint, weights_only=False)
        model.load_state_dict(state['model'])
        optimizer.load_state_dict(state['optimizer'])
        torch.set_rng_state(state['rng'])
        history, start = state['history'], state['step']
    else:
        set_seed(17)
    for step in range(start, 24):
        batch = collate([rows[i] for i in plan[step]], policy='response', pad_id=0)
        optimizer.zero_grad(set_to_none=True)
        loss = model(**batch, use_cache=False).loss
        loss.backward()
        assert torch.isfinite(loss) and all(p.grad is None or torch.isfinite(p.grad).all() for p in model.parameters())
        norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.)
        optimizer.step()
        history.append({'step': step+1, 'loss': float(loss.detach()), 'gradient_norm': float(norm),
                        'ids': [rows[i]['id'] for i in plan[step]],
                        'targets': int((batch['labels'][:, 1:] != -100).sum())})
        temporary = folder/'resume.tmp'
        torch.save({'model': model.state_dict(), 'optimizer': optimizer.state_dict(),
                    'rng': torch.get_rng_state(), 'history': history, 'step': step+1}, temporary)
        temporary.replace(checkpoint)
    model.save_pretrained(folder/'final', safe_serialization=True)
    tokenizer.save_pretrained(folder/'final')
    terminal = {'status': 'completed', 'steps': 24, 'retained': len(rows),
                'all_candidates': len(outputs), 'history': history, 'final_sha256': tensor_sha(model)}
    write(folder/'terminal.json', terminal)
    return terminal


def on_policy(args, tokenizer, teacher, initial, train):
    folder = args.work/'on-policy'
    folder.mkdir(exist_ok=True)
    if (folder/'terminal.json').exists():
        return read(folder/'terminal.json')
    model = copy.deepcopy(initial)
    set_seed(17)
    dataset = Dataset.from_dict({'prompt': [prompt(row['verse']) for row in train]})
    trainer = RecordedTrainer(model=model, teacher_model=teacher, args=config(folder),
                              processing_class=tokenizer, train_dataset=dataset)
    checkpoints = sorted(folder.glob('checkpoint-*'), key=lambda p: int(p.name.split('-')[-1]))
    result = trainer.train(resume_from_checkpoint=str(checkpoints[-1]) if checkpoints else None)
    assert trainer.state.global_step == 24
    assert all(parameter.grad is None for parameter in teacher.parameters())
    trainer.save_model(str(folder/'final'))
    tokenizer.save_pretrained(folder/'final')
    trainer.save_state()
    terminal = {'status': 'completed', 'steps': 24, 'metrics': result.metrics,
                'log_history': trainer.state.log_history, 'final_sha256': tensor_sha(model)}
    write(folder/'terminal.json', terminal)
    return terminal


def run(args):
    protocol_file = args.work/'protocol-continuation.json'
    if not protocol_file.exists():
        protocol_file = args.work/'protocol.json'
    protocol = read(protocol_file)
    assert protocol['contract'] == contract(args), 'Frozen native source/environment changed'
    if (args.work/'evaluation.json').exists():
        print('Native experiment is terminal; preserved without replay.')
        return
    tokenizer, teacher, initial = load_models(args)
    assert tensor_sha(initial) == protocol['initial_student_sha256']
    teacher_before = tensor_sha(teacher)
    source = load_source(args.data)
    train = sorted(source['train'], key=lambda row: row['id'])[:64]
    assert [r['id'] for r in train] == protocol['train_ids']
    routes = {'offline': offline(args, tokenizer, teacher, initial, train),
              'on-policy': on_policy(args, tokenizer, teacher, initial, train)}
    assert tensor_sha(teacher) == teacher_before
    seal = args.work/'selection-seal.json'
    if not seal.exists():
        write(seal, {'routes': routes, 'rule': 'Terminal24; no checkpoint selection',
                     'protocol_sha256': sha(args.work/'protocol.json')})
    results = {}
    for name in ['teacher', 'initial', 'offline', 'on-policy']:
        if name in routes and routes[name]['status'] != 'completed':
            results[name] = routes[name]
            continue
        model = teacher if name == 'teacher' else initial if name == 'initial' else (
            AutoModelForCausalLM.from_pretrained(args.work/name/'final', local_files_only=True).float().eval())
        results[name] = {}
        for split in ['dev', 'test']:
            target = args.work/f'{name}-{split}.json'
            if not target.exists():
                write(target, evaluate(model, tokenizer, source[split], batch_size=4))
            results[name][split] = read(target)
    for name in ['initial', 'offline', 'on-policy']:
        if name in routes and routes[name]['status'] != 'completed':
            continue
        for split in ['dev', 'test']:
            ref = results['teacher'][split]['generation']['rows']
            current = results[name][split]['generation']['rows']
            results[name][split]['teacher_exact_id_agreement'] = sum(
                a['ids'] == b['ids'] for a, b in zip(ref, current)) / len(ref)
    assert tensor_sha(teacher) == teacher_before
    write(args.work/'evaluation.json', {'protocol_sha256': sha(args.work/'protocol.json'),
                                      'routes': routes, 'results': results,
                                      'teacher_unchanged': True, 'selection': 'None; final24 only'})
    print(json.dumps({'status': 'completed', 'routes': list(routes)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['preflight', 'freeze', 'run'])
    for field in ['base', 'teacher', 'data', 'work']:
        parser.add_argument('--'+field, type=Path, required=True)
    args = parser.parse_args()
    args.work.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(2)
    {'preflight': preflight, 'freeze': freeze, 'run': run}[args.command](args)
