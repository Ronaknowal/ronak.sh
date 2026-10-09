"""Complete small causal RLVR and verified-sample SFT study on offline GSM8K.

python -B tiny_causal_rlvr.py --output observations/tiny-study.json --workdir checkpoints
The immutable protocol.json fixes all budgets. No model or dataset is downloaded.
"""

import argparse
import copy
import hashlib
import importlib.metadata
import math
from pathlib import Path

import torch
import torch.nn.functional as F

from causal_backbone import TinyLM
from rlvr_data import (
    EOS,
    PAD,
    decode,
    emit,
    load_protocol,
    load_records,
    model_digest,
    pack,
    prompt_ids,
    score_targets,
    target_ids,
)
from verifier_contracts import final_verdict
from scientific_journal import ScientificJournal, fresh_run_paths, training_state


def keyed_seed(seed, *parts):
    key = ":".join(map(str, [seed, *parts]))
    return int(hashlib.sha256(key.encode("utf-8")).hexdigest()[:8], 16)


def warm_model(
    model, records, seed, steps, batch_size, learning_rate, native=False, journal=None
):
    """The target is only #### gold + EOS; question positions remain context."""
    generator = torch.Generator().manual_seed(keyed_seed(seed, "warm"))
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=learning_rate, weight_decay=0.0
    )
    history = []
    model.train()
    if journal:
        journal.checkpoint(
            training_state(model, optimizer, generator, seed=seed, warm_step=0),
            "warm-start",
        )
    for step in range(steps):
        indexes = torch.randint(
            len(records), (batch_size,), generator=generator
        ).tolist()
        rows = [records[index] for index in indexes]
        batch = pack(
            [prompt_ids(row) for row in rows], [target_ids(row) for row in rows]
        )
        logps, mask = score_targets(model, batch, native=native)
        loss = -logps[mask].mean()
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()
        history.append(
            {
                "step": step + 1,
                "ids": [row["id"] for row in rows],
                "targets": int(mask.sum()),
                "response_token_nll_nats": float(loss.detach()),
            }
        )
        if journal:
            journal.append("warm-update-completed", {"seed": seed, **history[-1]})
            journal.checkpoint(
                training_state(
                    model, optimizer, generator, seed=seed, warm_step=step + 1
                ),
                "warm-update-completed",
            )
    model.eval()
    return history


@torch.no_grad()
def sample_group(model, row, group_size, generator, maximum, temperature=1.0):
    """Generate genuine model samples. No answer, grammar filter or forced EOS."""
    prefix = prompt_ids(row)
    sequences = torch.tensor(prefix)[None].repeat(group_size, 1)
    ended = torch.zeros(group_size, dtype=torch.bool)
    responses, logs = [[] for _ in range(group_size)], [[] for _ in range(group_size)]
    for _ in range(maximum):
        distribution = (model(sequences)[:, -1] / temperature).log_softmax(-1)
        sampled = torch.multinomial(distribution.exp(), 1, generator=generator).squeeze(
            1
        )
        for index in range(group_size):
            if not ended[index]:
                token = int(sampled[index])
                responses[index].append(token)
                logs[index].append(float(distribution[index, token]))
        sampled = sampled.masked_fill(ended, PAD)
        ended = ended | (sampled == EOS)
        sequences = torch.cat([sequences, sampled[:, None]], dim=1)
        if bool(ended.all()):
            break
    return [
        {
            "record_id": row["id"],
            "sample": index,
            "prefix_ids": prefix,
            "response_ids": response,
            "response": decode(response),
            "generated_logps": logs[index],
            "ended_with_EOS": response[-1] == EOS,
            "truncated": response[-1] != EOS,
            "length": len(response),
            "verdict": final_verdict(decode(response), row["gold"]),
        }
        for index, response in enumerate(responses)
    ]


def group_coefficients(samples, group_size, scaled):
    rewards = torch.tensor(
        [sample["verdict"]["reward"] for sample in samples], dtype=torch.float32
    )
    groups = rewards.reshape(-1, group_size)
    means = groups.mean(-1, keepdim=True)
    standard_deviations = groups.std(-1, correction=0, keepdim=True)
    advantages = groups - means
    if scaled:
        advantages = advantages / (standard_deviations + 1e-4)
    for group in range(len(groups)):
        for index in range(group_size):
            sample = samples[group * group_size + index]
            sample.update(
                {
                    "group": group,
                    "group_mean": float(means[group, 0]),
                    "population_std": float(standard_deviations[group, 0]),
                    "advantage": float(advantages[group, index]),
                }
            )
    return advantages.flatten(), means.flatten(), standard_deviations.flatten()


def grpo_update(
    model,
    reference,
    samples,
    optimizer,
    settings,
    scaled,
    journal=None,
    context=None,
    generator=None,
):
    batch = pack(
        [sample["prefix_ids"] for sample in samples],
        [sample["response_ids"] for sample in samples],
    )
    advantages, means, stds = group_coefficients(
        samples, settings["group_size"], scaled
    )
    with torch.no_grad():
        old, mask = score_targets(model, batch)
        ref, _ = score_targets(reference, batch)
    # Check the stored generation addresses against the same pre-update model.
    discrepancy = 0.0
    for index, sample in enumerate(samples):
        discrepancy = max(
            discrepancy,
            float(
                (old[index][mask[index]] - torch.tensor(sample["generated_logps"]))
                .abs()
                .max()
            ),
        )
    if journal:
        journal.append(
            "old-reference-rescore",
            {
                "context": context,
                "old": old,
                "reference": ref,
                "mask": mask,
                "advantages": advantages,
                "generated_old_max_difference": discrepancy,
            },
        )
    if discrepancy > 8e-6:
        raise RuntimeError("Generation and old rescore disagree: " + str(discrepancy))
    epochs = []
    for epoch in range(settings["grpo_epochs_per_rollout"]):
        before = [parameter.detach().clone() for parameter in model.parameters()]
        current, current_mask = score_targets(model, batch)
        if journal:
            journal.append(
                "epoch-mask-check",
                {
                    "context": context,
                    "epoch": epoch + 1,
                    "expected": mask,
                    "actual": current_mask,
                },
            )
        assert torch.equal(mask, current_mask)
        ratio = (current - old).exp()
        coefficients = advantages[:, None]
        terms = torch.minimum(
            ratio * coefficients,
            ratio.clamp(1 - settings["epsilon"], 1 + settings["epsilon"])
            * coefficients,
        )
        delta = ref - current
        k3 = delta.exp() - delta - 1
        token_loss = -terms + settings["beta"] * k3
        counts = mask.sum(-1)
        losses = (token_loss * mask).sum(-1) / counts
        loss = losses.mean()
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        gradient_norm = math.sqrt(
            sum(
                float(parameter.grad.square().sum())
                for parameter in model.parameters()
                if parameter.grad is not None
            )
        )
        optimizer.step()
        parameter_delta = math.sqrt(
            sum(
                float((parameter.detach() - previous).square().sum())
                for parameter, previous in zip(model.parameters(), before)
            )
        )
        epochs.append(
            {
                "epoch": epoch + 1,
                "loss": float(loss.detach()),
                "response_losses": losses.detach().tolist(),
                "token_logps": [
                    current[index][mask[index]].detach().tolist()
                    for index in range(len(samples))
                ],
                "token_ratios": [
                    ratio[index][mask[index]].detach().tolist()
                    for index in range(len(samples))
                ],
                "token_k3": [
                    k3[index][mask[index]].detach().tolist()
                    for index in range(len(samples))
                ],
                "sampled_k3_response_mean": float(
                    ((k3 * mask).sum(-1) / counts).mean().detach()
                ),
                "gradient_l2": gradient_norm,
                "parameter_delta_l2": parameter_delta,
                "state_sha256": model_digest(model),
            }
        )
        if journal:
            journal.append("grpo-epoch-completed", {"context": context, **epochs[-1]})
            journal.checkpoint(
                training_state(
                    model,
                    optimizer,
                    generator,
                    reference,
                    context=context,
                    completed_epoch=epoch + 1,
                    samples=samples,
                    old=old,
                    reference_logps=ref,
                    mask=mask,
                    advantages=advantages,
                ),
                "grpo-epoch-completed",
            )
    return {
        "epochs": epochs,
        "updates": len(epochs),
        "old_state_logps": [
            old[index][mask[index]].tolist() for index in range(len(samples))
        ],
        "reference_logps": [
            ref[index][mask[index]].tolist() for index in range(len(samples))
        ],
        "generated_old_max_difference": discrepancy,
        "group_means": means.tolist(),
        "group_population_stds": stds.tolist(),
        "mixed_groups": int((stds > 0).sum()),
        "target_counts": mask.sum(-1).tolist(),
    }


def verified_sft_update(
    model,
    samples,
    optimizer,
    journal=None,
    context=None,
    generator=None,
    reference=None,
):
    accepted = [sample for sample in samples if sample["verdict"]["accepted"]]
    if not accepted:
        result = {
            "updates": 0,
            "accepted_ids": [],
            "loss": None,
            "skip": "no accepted response",
        }
        if journal:
            journal.append("verified-sft-skipped", {"context": context, **result})
            journal.checkpoint(
                training_state(
                    model,
                    optimizer,
                    generator,
                    reference,
                    context=context,
                    samples=samples,
                    update=result,
                ),
                "verified-sft-skipped",
            )
        return result
    batch = pack(
        [sample["prefix_ids"] for sample in accepted],
        [sample["response_ids"] for sample in accepted],
    )
    logps, mask = score_targets(model, batch)
    # Same response-equal reduction; the selected response includes its genuine EOS, if sampled.
    loss = -((logps * mask).sum(-1) / mask.sum(-1)).mean()
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    optimizer.step()
    result = {
        "updates": 1,
        "accepted_ids": [
            {"record_id": sample["record_id"], "sample": sample["sample"]}
            for sample in accepted
        ],
        "loss": float(loss.detach()),
        "target_counts": mask.sum(-1).tolist(),
        "skip": None,
    }
    if journal:
        journal.append("verified-sft-update-completed", {"context": context, **result})
        journal.checkpoint(
            training_state(
                model,
                optimizer,
                generator,
                reference,
                context=context,
                samples=samples,
                update=result,
            ),
            "verified-sft-update-completed",
        )
    return result


@torch.no_grad()
def evaluate(
    model,
    records,
    seed,
    arm,
    step,
    settings,
    journal=None,
    optimizer=None,
    reference=None,
):
    generator = torch.Generator().manual_seed(keyed_seed(seed, arm, "evaluation", step))
    observations = []
    for row in records:
        observation = {
            "record_id": row["id"],
            "samples": sample_group(
                model,
                row,
                settings["evaluation_samples_per_prompt"],
                generator,
                settings["max_new_tokens"],
                settings["temperature"],
            ),
        }
        observations.append(observation)
        if journal:
            journal.append(
                "evaluation-record-completed",
                {"seed": seed, "arm": arm, "step": step, **observation},
            )
            journal.checkpoint(
                training_state(
                    model,
                    optimizer,
                    generator,
                    reference,
                    seed=seed,
                    arm=arm,
                    step=step,
                    evaluation_records_completed=len(observations),
                ),
                "evaluation-record-completed",
            )
    result = {
        "step": step,
        "state_sha256": model_digest(model),
        "records": observations,
    }
    if journal:
        journal.append("evaluation-completed", {"seed": seed, "arm": arm, **result})
    return result


def study(workdir, journal):
    protocol = load_protocol()
    settings = protocol["study"]
    records = load_records()
    torch.set_num_threads(protocol["threads"])
    all_runs, warm_runs = [], []
    for seed in protocol["seeds"]:
        torch.manual_seed(seed)
        warm = TinyLM(**protocol["architecture"])
        initial_hash = model_digest(warm)
        history = warm_model(
            warm,
            records["train"],
            seed,
            protocol["warm"]["steps"],
            protocol["warm"]["batch"],
            protocol["warm"]["learning_rate"],
            journal=journal,
        )
        warm_hash = model_digest(warm)
        torch.save(warm.state_dict(), workdir / f"warm-{seed}.pt")
        warm_runs.append(
            {
                "seed": seed,
                "initial_sha256": initial_hash,
                "warm_sha256": warm_hash,
                "history": history,
            }
        )
        journal.append("warm-fit-completed", warm_runs[-1])
        for arm in settings["arms"]:
            model = copy.deepcopy(warm).eval()
            reference = copy.deepcopy(warm).eval().requires_grad_(False)
            reference_hash = model_digest(reference)
            optimizer = torch.optim.AdamW(
                model.parameters(), lr=settings["learning_rate"], weight_decay=0.0
            )
            evaluations = [
                evaluate(
                    model,
                    records["test"],
                    seed,
                    arm,
                    0,
                    settings,
                    journal,
                    optimizer,
                    reference,
                )
            ]
            steps, total_updates = [], 0
            for step in range(1, settings["scheduled_steps"] + 1):
                generator = torch.Generator().manual_seed(
                    keyed_seed(seed, arm, "rollout", step)
                )
                indexes = torch.randperm(len(records["train"]), generator=generator)[
                    : settings["prompts_per_step"]
                ].tolist()
                rows = [records["train"][index] for index in indexes]
                before_hash = model_digest(model)
                samples = [
                    sample
                    for row in rows
                    for sample in sample_group(
                        model,
                        row,
                        settings["group_size"],
                        generator,
                        settings["max_new_tokens"],
                        settings["temperature"],
                    )
                ]
                context = {
                    "seed": seed,
                    "arm": arm,
                    "step": step,
                    "optimizer_updates_before": total_updates,
                }
                journal.append(
                    "rollout-generated",
                    {
                        "context": context,
                        "generating_state_sha256": before_hash,
                        "samples": samples,
                    },
                )
                journal.checkpoint(
                    training_state(
                        model,
                        optimizer,
                        generator,
                        reference,
                        context=context,
                        samples=samples,
                    ),
                    "rollout-before-update",
                )
                if arm == "verified-sample-sft":
                    result = verified_sft_update(
                        model,
                        samples,
                        optimizer,
                        journal,
                        context,
                        generator,
                        reference,
                    )
                else:
                    result = grpo_update(
                        model,
                        reference,
                        samples,
                        optimizer,
                        settings,
                        arm == "group-scaled-grpo",
                        journal,
                        context,
                        generator,
                    )
                total_updates += result["updates"]
                steps.append(
                    {
                        "step": step,
                        "generating_state_sha256": before_hash,
                        "record_ids": [row["id"] for row in rows],
                        "samples": samples,
                        "generated_tokens": sum(sample["length"] for sample in samples),
                        "accepted_samples": sum(
                            sample["verdict"]["accepted"] for sample in samples
                        ),
                        "update": result,
                        "after_state_sha256": model_digest(model),
                        "optimizer_updates_total": total_updates,
                    }
                )
                journal.append(
                    "scheduled-step-completed", {"seed": seed, "arm": arm, **steps[-1]}
                )
                if step in settings["evaluation_steps"]:
                    evaluations.append(
                        evaluate(
                            model,
                            records["test"],
                            seed,
                            arm,
                            step,
                            settings,
                            journal,
                            optimizer,
                            reference,
                        )
                    )
            journal.append(
                "reference-check",
                {
                    "seed": seed,
                    "arm": arm,
                    "expected_sha256": reference_hash,
                    "actual_sha256": model_digest(reference),
                    "gradients_absent": all(
                        p.grad is None for p in reference.parameters()
                    ),
                },
            )
            assert model_digest(reference) == reference_hash
            assert all(parameter.grad is None for parameter in reference.parameters())
            torch.save(model.state_dict(), workdir / f"final-{seed}-{arm}.pt")
            all_runs.append(
                {
                    "seed": seed,
                    "arm": arm,
                    "start_sha256": warm_hash,
                    "reference_sha256": reference_hash,
                    "final_sha256": model_digest(model),
                    "optimizer_updates": total_updates,
                    "steps": steps,
                    "evaluations": evaluations,
                }
            )
            journal.append("arm-completed", all_runs[-1])
    return {
        "protocol": protocol,
        "versions": {"torch": importlib.metadata.version("torch")},
        "warm_runs": warm_runs,
        "runs": all_runs,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output", type=Path, default=Path("observations/tiny-study.json")
    )
    parser.add_argument("--workdir", type=Path, default=Path("checkpoints"))
    args = parser.parse_args()
    output, workdir = fresh_run_paths(args.output, args.workdir)
    journal = ScientificJournal(workdir)
    try:
        result = study(workdir, journal)
        emit(output, result)
        journal.append("stage-completed", {"output": str(output)})
    except BaseException as exception:
        journal.failure(journal.location, exception)
        raise
    print(
        {
            "warm_fits": len(result["warm_runs"]),
            "arm_fits": len(result["runs"]),
            "scheduled_rollouts": sum(len(run["steps"]) for run in result["runs"]),
            "optimizer_updates": sum(
                run["optimizer_updates"] for run in result["runs"]
            ),
        }
    )


if __name__ == "__main__":
    main()
