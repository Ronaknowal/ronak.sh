"""Response-masked SFT and on-policy terminal-return updates of a tiny decoder.
The backbone is the exact TinyLM from Causal Language Modeling, supplied beside
this file. Training concerns this finite integer-token arithmetic language.
Run the frozen experiment with reasoning_study.py, not by editing test results.
"""
import copy
import random
import torch
import torch.nn.functional as F
from tiny_causal_lm import TinyLM
from reasoning_checks import check_trace

SUM, ANSWER, LEFT, PLUS, RIGHT, TIMES, EQUAL, EOS = range(91, 99)
VOCABULARY, PREFIX_LENGTH = 99, 8


def make_splits(seed=41):
    families = [(a, b) for a in range(10) for b in range(a, 10)]
    random.Random(seed).shuffle(families)
    splits = {}
    for name, selected in [('train', families[:39]), ('development', families[39:47]), ('test', families[47:])]:
        splits[name] = [{'id': f'{a}-{b}-{c}', 'family': f'{a}-{b}', 'a': a, 'b': b, 'c': c}
                        for a, b in selected for c in range(1, 6)]
    return splits


def tensors(records):
    prompts = torch.tensor([[LEFT, r['a'], PLUS, r['b'], RIGHT, TIMES, r['c'], EQUAL] for r in records])
    targets = torch.tensor([[SUM, r['a'] + r['b'], ANSWER, (r['a'] + r['b']) * r['c'], EOS] for r in records])
    return prompts, targets


def create_policy():
    return TinyLM(VOCABULARY, context=16, width=48, heads=3, layers=2)


def completion_logits(model, prompts, tokens):
    inputs = torch.cat([prompts, tokens[:, :-1]], dim=1)
    return model(inputs)[:, PREFIX_LENGTH - 1:]


def supervised_loss(model, prompts, targets):
    logits = completion_logits(model, prompts, targets)
    # The first target is SUM predicted from the whole question; EOS is a target.
    return F.cross_entropy(logits.reshape(-1, VOCABULARY), targets.reshape(-1))


@torch.no_grad()
def rollout(model, prompts, generator, greedy=False, limit=5):
    """Temperature1, no truncation of vocabulary support; mask includes first EOS."""
    model.eval()
    history, active = prompts.clone(), torch.ones(len(prompts), dtype=torch.bool)
    tokens, masks = [], []
    for _ in range(limit):
        logits = model(history)[:, -1]
        proposed = logits.argmax(-1) if greedy else torch.multinomial(logits.softmax(-1), 1, generator=generator).squeeze(1)
        chosen = torch.where(active, proposed, EOS)
        masks.append(active.clone())
        tokens.append(chosen)
        active = active & (chosen != EOS)
        history = torch.cat([history, chosen[:, None]], dim=1)
    return torch.stack(tokens, dim=1), torch.stack(masks, dim=1)


def decode(tokens):
    values = list(tokens)
    terminated = EOS in values
    if terminated:
        values = values[:values.index(EOS)]
    if len(values) == 4 and values[0] == SUM and values[2] == ANSWER and 0 <= values[1] <= 90 and 0 <= values[3] <= 90:
        text = f'sum = {values[1]}; answer = {values[3]}'
    elif len(values) == 2 and values[0] == ANSWER and 0 <= values[1] <= 90:
        text = f'answer = {values[1]}'
    else:
        names = {SUM: 'sum', ANSWER: 'answer', LEFT: '(', PLUS: '+', RIGHT: ')', TIMES: '*', EQUAL: '='}
        text = ' '.join(names.get(value, str(value)) for value in values)
    return text, terminated


def inspect_outputs(records, tokens, mask):
    inspected = []
    for record, ids, selected in zip(records, tokens.tolist(), mask.tolist()):
        text, terminated = decode(ids)
        result = check_trace(record['a'], record['b'], record['c'], text, terminated)
        inspected.append({'id': record['id'], 'ids': ids, 'mask': selected,
                          'tokens': sum(selected), **result})
    return inspected


def reinforce_loss(model, prompts, tokens, mask, rewards, group_size):
    """One fresh on-policy batch, no clipping/reuse/KL; iid leave-one-out baseline."""
    if group_size < 2 or len(rewards) % group_size:
        raise ValueError('Need whole groups with at least two independent attempts')
    grouped = rewards.reshape(-1, group_size)
    other_mean = (grouped.sum(1, keepdim=True) - grouped) / (group_size - 1)
    advantages = (grouped - other_mean).reshape(-1).detach()
    logs = completion_logits(model, prompts, tokens).log_softmax(-1)
    chosen = logs.gather(-1, tokens[..., None]).squeeze(-1)
    sequence_logs = (chosen * mask).sum(1)
    return -(sequence_logs * advantages).mean(), advantages, chosen


def optimize(loss, model, optimizer):
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    gradient_norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1., error_if_nonfinite=True)
    optimizer.step()
    return float(gradient_norm)


def fit_warm(records, seed, steps=500):
    torch.manual_seed(seed)
    model = create_policy()
    optimizer = torch.optim.AdamW(model.parameters(), lr=.003, weight_decay=0.)
    generator = torch.Generator().manual_seed(seed + 1000)
    prompts, targets = tensors(records)
    history = []
    for step in range(1, steps + 1):
        chosen = torch.randint(len(records), (32,), generator=generator)
        model.train()
        loss = supervised_loss(model, prompts[chosen], targets[chosen])
        gradient_norm = optimize(loss, model, optimizer)
        if step == 1 or step % 100 == 0 or step == steps:
            history.append({'step': step, 'loss': float(loss.detach()), 'gradient_norm': gradient_norm})
    return model, history


def continue_training(warm, records, seed, arm, steps=80, group_size=8):
    model = copy.deepcopy(warm)
    optimizer = torch.optim.AdamW(model.parameters(), lr=.0003, weight_decay=0.)
    prompts, targets = tensors(records)
    question_rng = torch.Generator().manual_seed(seed + 2000)
    rollout_rng = torch.Generator().manual_seed(seed + 3000)
    history, checkpoints = [], {0: copy.deepcopy(model.state_dict())}
    for step in range(1, steps + 1):
        # Both arms receive the same8 questions repeated8 times, from a common RNG.
        indices = torch.randint(len(records), (8,), generator=question_rng).repeat_interleave(group_size)
        batch_prompts, batch_targets = prompts[indices], targets[indices]
        if arm == 'rl':
            sampled, mask = rollout(model, batch_prompts, rollout_rng)
            observations = inspect_outputs([records[i] for i in indices.tolist()], sampled, mask)
            rewards = torch.tensor([row['reward'] for row in observations], dtype=torch.float32)
            model.train()
            loss, advantages, chosen_logs = reinforce_loss(model, batch_prompts, sampled, mask, rewards, group_size)
            details = {'reward_mean': float(rewards.mean()),
                       'mixed_groups': int(((rewards.reshape(-1, group_size).sum(1) > 0) &
                                             (rewards.reshape(-1, group_size).sum(1) < group_size)).sum()),
                       'targets': int(mask.sum()), 'sample': observations[0],
                       'sample_advantage': float(advantages[0]),
                       'sample_logps': chosen_logs[0].detach().tolist()}
        elif arm == 'sft':
            model.train()
            loss = supervised_loss(model, batch_prompts, batch_targets)
            details = {'targets': batch_targets.numel()}
        else:
            raise ValueError('arm must be rl or sft')
        gradient_norm = optimize(loss, model, optimizer)
        history.append({'step': step, 'loss': float(loss.detach()), 'gradient_norm': gradient_norm, **details})
        if step in (20, 40, 60, 80):
            checkpoints[step] = copy.deepcopy(model.state_dict())
    return model, history, checkpoints
