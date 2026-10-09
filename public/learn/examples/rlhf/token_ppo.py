"""Complete tiny autoregressive RLHF: SFT, pair reward, sampling, GAE, PPO.

python token_ppo.py --output token-ppo-results.json
Requires torch and the supplied causal_backbone.py/token_credit.py helpers.
All comparisons here are constructed; real human data has a separate program.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import torch
from torch import nn
import torch.nn.functional as F
from causal_backbone import TinyLM
from preference_records import ROOT
from token_credit import action_mask, gae, normalize_valid, ppo_losses, shape_rewards, shifted_scores

TOKENS = ["PAD", "BOS", "EOS", "one", "sentence", "France", "Italy", "Paris", "Rome", "is", "capital", "of", "."]
PAD, BOS, EOS = 0, 1, 2
INDEX = {word: index for index, word in enumerate(TOKENS)}


def hidden_stream(model, ids):
    """Expose exactly TinyLM's normalized hidden stream; no backbone changes."""
    position = torch.arange(ids.shape[1], device=ids.device)
    return model.norm(model.blocks(model.token(ids) + model.position(position)))


class ActorCritic(nn.Module):
    def __init__(self):
        super().__init__()
        self.decoder = TinyLM(len(TOKENS), context=16, width=32, heads=2, layers=2)
        self.value = nn.Linear(32, 1)

    def forward(self, ids):
        hidden = hidden_stream(self.decoder, ids)
        return self.decoder.head(hidden), self.value(hidden).squeeze(-1)


class RewardModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.decoder = TinyLM(len(TOKENS), context=16, width=32, heads=2, layers=2)
        self.score = nn.Linear(32, 1)

    def forward(self, ids, lengths):
        hidden = hidden_stream(self.decoder, ids)
        last = hidden[torch.arange(len(ids)), lengths - 1]
        return self.score(last).squeeze(-1)


def fixture():
    prompts, demonstrations, comparisons = [], [], []
    for instruction in ("one", "sentence"):
        for country, capital, wrong in (("France", "Paris", "Rome"), ("Italy", "Rome", "Paris")):
            prompt = [BOS, INDEX[instruction], INDEX[country]]
            short = [INDEX[capital], EOS]
            long = [INDEX[capital], INDEX["is"], INDEX["capital"], INDEX["of"], INDEX[country], INDEX["."], EOS]
            good = short if instruction == "one" else long
            other = long if instruction == "one" else short
            swapped = [INDEX[wrong], *good[1:]]
            prompts.append(prompt)
            demonstrations.extend([prompt + short, prompt + long])
            comparisons.extend([(prompt + good, prompt + other), (prompt + good, prompt + swapped)])
    return prompts, demonstrations, comparisons


def padded(sequences):
    lengths = torch.tensor([len(row) for row in sequences])
    ids = torch.full((len(sequences), int(lengths.max())), PAD, dtype=torch.long)
    for b, row in enumerate(sequences):
        ids[b, :len(row)] = torch.tensor(row)
    return ids, lengths


def digest_model(model):
    digest = hashlib.sha256()
    for name, tensor in model.state_dict().items():
        digest.update(name.encode())
        digest.update(tensor.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def freeze(model):
    model.eval()
    for parameter in model.parameters():
        parameter.requires_grad_(False)
    return model


def fit_sft(actor, sequences):
    ids, lengths = padded(sequences)
    valid = action_mask(torch.full_like(lengths, 3), lengths, ids.shape[1])
    optimizer = torch.optim.AdamW(actor.parameters(), lr=.003, weight_decay=0)
    history = []
    for step in range(121):
        logits, _ = actor(ids)
        loss = -shifted_scores(logits, ids)[valid].mean()
        if step % 30 == 0:
            history.append({"step": step, "response_token_nll": loss.item(), "targets": int(valid.sum())})
        if step < 120:
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            nn.utils.clip_grad_norm_(actor.parameters(), 1.)
            optimizer.step()
    return history


def fit_reward(comparisons):
    torch.manual_seed(37)
    model = RewardModel()
    chosen, chosen_lengths = padded([a for a, _ in comparisons])
    rejected, rejected_lengths = padded([b for _, b in comparisons])
    optimizer = torch.optim.AdamW(model.parameters(), lr=.002, weight_decay=.01)
    history = []
    for step in range(121):
        a, b = model(chosen, chosen_lengths), model(rejected, rejected_lengths)
        loss = F.softplus(-(a - b)).mean()
        if step % 30 == 0:
            history.append({"step": step, "pair_bce": loss.item(), "accuracy": ((a > b).float().mean()).item()})
        if step < 120:
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.)
            optimizer.step()
    with torch.no_grad():
        a, b = model(chosen, chosen_lengths), model(rejected, rejected_lengths)
        center = torch.cat((a, b)).mean().item()
    return freeze(model), center, {"history": history, "center": center, "chosen": a.tolist(), "rejected": b.tolist()}


@torch.no_grad()
def collect(actor, reference, reward, center, prompts, seed, maximum=8, beta=.1):
    actor.eval()
    generator = torch.Generator().manual_seed(seed)
    sequences, action_lengths = [], []
    for prompt in prompts:
        sequence = list(prompt)
        for _ in range(maximum):
            logits, _ = actor(torch.tensor([sequence]))
            token = int(torch.multinomial(logits[0, -1].softmax(-1), 1, generator=generator))
            sequence.append(token)
            if token == EOS:
                break
        sequences.append(sequence)
        action_lengths.append(len(sequence) - len(prompt))
    ids, lengths = padded(sequences)
    prompt_lengths = torch.tensor([len(prompt) for prompt in prompts])
    logits, all_values = actor(ids)
    reference_logits, _ = reference(ids)
    full_old = shifted_scores(logits, ids)
    full_reference = shifted_scores(reference_logits, ids)
    width = max(action_lengths)
    valid = torch.arange(width)[None, :] < torch.tensor(action_lengths)[:, None]
    old, ref, values = [torch.zeros((len(prompts), width)) for _ in range(3)]
    for b, (start, n) in enumerate(zip(prompt_lengths.tolist(), action_lengths)):
        old[b, :n] = full_old[b, start - 1:start - 1 + n]
        ref[b, :n] = full_reference[b, start - 1:start - 1 + n]
        values[b, :n] = all_values[b, start - 1:start - 1 + n]
    scores = reward(ids, lengths) - center
    rewards = shape_rewards(old, ref, valid, scores, beta)
    advantages, targets = gae(rewards, values, valid, gamma=1., lam=.95)
    return {"ids": ids, "lengths": lengths, "prompt_lengths": prompt_lengths,
            "action_lengths": torch.tensor(action_lengths), "valid": valid,
            "old_logp": old, "reference_logp": ref, "old_values": values,
            "reward_score": scores, "rewards": rewards, "advantages": advantages,
            "normalized_advantages": normalize_valid(advantages, valid), "targets": targets}


def current_action_outputs(actor, batch, indexes):
    ids = batch["ids"][indexes]
    logits, values = actor(ids)
    scores = shifted_scores(logits, ids)
    width = batch["valid"].shape[1]
    positions = batch["prompt_lengths"][indexes, None] - 1 + torch.arange(width)[None, :]
    # PAD action columns are never reduced; clamp keeps gather inside its tensor.
    positions = positions.clamp(max=scores.shape[1] - 1)
    return scores.gather(1, positions), values.gather(1, positions)


def update(actor, optimizer, batch, round_index):
    old_copy = batch["old_logp"].clone()
    all_indexes = torch.arange(len(batch["ids"]))
    initial_logp, _ = current_action_outputs(actor, batch, all_indexes)
    assert torch.allclose(initial_logp[batch["valid"]], old_copy[batch["valid"]], atol=1e-6)
    generator = torch.Generator().manual_seed(501 + round_index)
    updates = []
    for epoch in range(4):
        permutation = torch.randperm(len(all_indexes), generator=generator)
        for indexes in permutation.split(4):
            current, values = current_action_outputs(actor, batch, indexes)
            valid = batch["valid"][indexes]
            policy, value, ratio = ppo_losses(current, batch["old_logp"][indexes], values,
                                             batch["targets"][indexes], batch["normalized_advantages"][indexes], valid)
            loss = policy + .5 * value
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            norm = nn.utils.clip_grad_norm_(actor.parameters(), 1.)
            optimizer.step()
            updates.append({"epoch": epoch, "valid_tokens": int(valid.sum()),
                            "policy_loss": policy.item(), "value_mse": value.item(),
                            "gradient_norm_before_clip": float(norm),
                            "ratio_min": ratio[valid].min().item(), "ratio_max": ratio[valid].max().item()})
    assert torch.equal(batch["old_logp"], old_copy)
    return updates


def decode(sequence):
    return " ".join(TOKENS[token] for token in sequence)


def criterion(prompt, response):
    country = TOKENS[prompt[2]]
    capital = INDEX["Paris" if country == "France" else "Rome"]
    expected = [capital, EOS] if prompt[1] == INDEX["one"] else [capital, INDEX["is"], INDEX["capital"], INDEX["of"], prompt[2], INDEX["."], EOS]
    return int(response == expected)


def summarize(batch):
    outputs = []
    for b, length in enumerate(batch["lengths"].tolist()):
        n = int(batch["prompt_lengths"][b])
        prompt = batch["ids"][b, :n].tolist()
        response = batch["ids"][b, n:length].tolist()
        outputs.append({"prompt": decode(prompt), "response": decode(response),
                        "response_ids": response, "criterion": criterion(prompt, response),
                        "proxy": batch["reward_score"][b].item(), "length": len(response),
                        "eos": response[-1] == EOS, "malformed": any(token in (PAD, BOS) for token in response)})
    valid = batch["valid"]
    ratio_sum = ((batch["old_logp"] - batch["reference_logp"]) * valid).sum(-1)
    return {"proxy_mean": batch["reward_score"].mean().item(),
            "criterion_fraction": sum(row["criterion"] for row in outputs) / len(outputs),
            "sampled_sequence_log_ratio_mean": ratio_sum.mean().item(),
            "mean_length": sum(row["length"] for row in outputs) / len(outputs),
            "eos_count": sum(row["eos"] for row in outputs), "malformed_count": sum(row["malformed"] for row in outputs),
            "outputs": outputs}


def run():
    torch.set_num_threads(2)
    torch.manual_seed(31)
    actor = ActorCritic()
    prompts, demonstrations, comparisons = fixture()
    sft = fit_sft(actor, demonstrations)
    reference = freeze(copy.deepcopy(actor))
    reward, center, reward_report = fit_reward(comparisons)
    reference_hash, reward_hash = digest_model(reference), digest_model(reward)
    actor_before = digest_model(actor)
    value_before = actor.value.weight.detach().clone()
    optimizer = torch.optim.AdamW(actor.parameters(), lr=.001, weight_decay=0)
    evaluations = [{"round": 0, **summarize(collect(actor, reference, reward, center, prompts * 8, 901))}]
    history, first_trace = [], None
    for round_index in range(1, 21):
        batch = collect(actor, reference, reward, center, prompts * 4, 101 + round_index)
        if first_trace is None:
            first_trace = {key: value.tolist() for key, value in batch.items()}
        updates = update(actor, optimizer, batch, round_index)
        history.append({"round": round_index, "collection": summarize(batch), "updates": updates})
        if round_index % 5 == 0:
            evaluations.append({"round": round_index, **summarize(collect(actor, reference, reward, center, prompts * 8, 901))})
    assert reference_hash == digest_model(reference)
    assert reward_hash == digest_model(reward)
    assert actor_before != digest_model(actor)
    assert not torch.equal(value_before, actor.value.weight)
    assert all(parameter.grad is None for parameter in reference.parameters())
    # Reward gradients from its completed fit may remain stored; no new backward
    # reaches it after freeze. requires_grad and bytes establish that boundary.
    assert all(not parameter.requires_grad for parameter in reward.parameters())
    return {"kind": "constructed comparisons; complete autoregressive token PPO",
            "torch": torch.__version__, "tokens": TOKENS, "actor_parameters": sum(p.numel() for p in actor.parameters()),
            "sft": sft, "reward_fit": reward_report, "evaluations": evaluations,
            "history": history, "first_rollout": first_trace,
            "frozen_reference_sha256": reference_hash, "frozen_reward_sha256": reward_hash,
            "invariants": ["actual sampled tokens", "same-policy initial ratio1", "old probabilities stable", "frozen reference/reward", "actor and critic changed"],
            "settings": {"beta": .1, "gamma": 1., "lambda": .95, "clip": .2, "epochs": 4,
                         "rounds": 20, "trajectories": 16, "minibatch": 4, "value_mse_coefficient": .5,
                         "reduction": "mean over valid tokens in each minibatch", "max_actions_terminal": 8}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "token-ppo-results.json")
    args = parser.parse_args()
    result = run()
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"invariants": result["invariants"], "evaluations": [{key: value for key, value in row.items() if key != "outputs"} for row in result["evaluations"]]}, indent=2))


if __name__ == "__main__":
    main()
