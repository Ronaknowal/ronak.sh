"""Bounded scratch DAPO-component updates around the exact SFT causal LM.

python train_dapo.py --model PATH --data ./data --arm dapo-components \
    --seed 73 --output ./runs/dapo-73
Sampling, grouping, loss and SGD are local; architecture/autograd are delegated.
"""

import argparse
import copy
import json
import random
import time
from pathlib import Path
import torch

from dapo_math import advantages, length_penalty, objective
from dapo_collect import collect
from group_losses import response_logps
from online_preferences import (
    load_policy,
    sample_responses,
    rollout_batch,
    parameter_change,
    sha256,
)
from sft_data import load_source, encode_record
from sft_evaluate import evaluate
from scientific_journal import ScientificJournal, training_state


def serial(value):
    if torch.is_tensor(value):
        return value.detach().cpu().tolist()
    if isinstance(value, dict):
        return {key: serial(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [serial(item) for item in value]
    return value


def save(path, value):
    Path(path).write_text(json.dumps(serial(value), indent=2) + "\n", encoding="utf-8")


def checkpoint(path, model, optimizer, position, journal=None, **context):
    """A coherent resumable boundary; automatic replay/resume is not implemented."""
    state = training_state(model, optimizer, position=position, **context)
    if journal is not None:
        journal.checkpoint(state, position.get("boundary", "completed-update"))
        return
    path = Path(path)
    temporary = path.with_suffix(".tmp")
    torch.save(state, temporary)
    temporary.replace(path)


def prompt_plan(rows, seed):
    order = list(range(len(rows)))
    random.Random(seed).shuffle(order)
    # Two disjoint three-batch blocks, each with two candidate prompts.
    if len(order) < 12:
        raise ValueError("This fixed study needs at least twelve prompt records.")
    return [
        [[rows[order[slot * 6 + batch * 2 + i]] for i in range(2)] for batch in range(3)]
        for slot in range(2)
    ]


def run(model_path, data_path, arm, seed, output, initial_evaluation=None):
    journal = ScientificJournal(output)
    try:
        result = _run(model_path, data_path, arm, seed, output, initial_evaluation, journal)
        journal.append("run-completed", {"report": "report.json"})
        return result
    except BaseException as exception:
        journal.failure(journal.location, exception)
        raise


def _run(model_path, data_path, arm, seed, output, initial_evaluation, journal):
    if arm not in ("response-baseline", "dapo-components") or seed not in (73, 89, 101):
        raise ValueError("Use a prespecified arm and seed73/89/101.")
    output = Path(output)
    start = time.perf_counter()
    torch.set_num_threads(2)
    torch.manual_seed(seed)
    model, tokenizer = load_policy(model_path)
    initial = copy.deepcopy(model).requires_grad_(False)
    source = load_source(data_path)
    train = sorted(source["train"], key=lambda row: row["id"])[:16]
    test = sorted(source["test"], key=lambda row: row["id"])[:32]
    encoded = [encode_record(row, tokenizer) for row in train]
    plan = prompt_plan(encoded, seed)
    optimizer = torch.optim.SGD(model.parameters(), lr=1e-4)
    config = {
        "seed": seed,
        "arm": arm,
        "group_size": 4,
        "target_groups": 2,
        "max_candidate_batches": 3 if arm == "dapo-components" else 1,
        "generation_cap": 8,
        "soft_buffer": 4,
        "slots": 2,
        "updates_per_filled_slot": 2,
        "beta": 0.0,
        "dual_clip": None,
        "mask_truncated": False,
        "epsilon": 1e-6,
        "clip_low": 0.2,
        "clip_high": 0.28 if arm == "dapo-components" else 0.2,
        "reduction": "token" if arm == "dapo-components" else "response",
        "optimizer": "SGD",
        "learning_rate": 1e-4,
        "temperature": 1.0,
        "top_p": 1.0,
        "top_k": 0,
        "dropout": 0.0,
        "threads": 2,
        "dtype": "float32",
        "initial_weights": sha256(Path(model_path) / "model.safetensors"),
        "train_ids": [r["id"] for r in train],
        "test_ids": [r["id"] for r in test],
        "prompt_plan": [[[r["id"] for r in batch] for batch in slot] for slot in plan],
    }
    save(output / "configuration.json", config)
    journal.append("configuration", config)
    checkpoint(
        output / "latest-state.pt",
        model,
        optimizer,
        {"boundary": "initial", "updates": 0},
        journal,
        configuration=config,
        prompt_plan=plan,
    )
    if initial_evaluation is None:
        before = evaluate(model, tokenizer, test)
    else:
        previous = json.loads(Path(initial_evaluation).read_text(encoding="utf-8"))
        if (
            previous["configuration"]["initial_weights"] != config["initial_weights"]
            or previous["configuration"]["test_ids"] != config["test_ids"]
        ):
            raise ValueError("Initial evidence does not match the exact checkpoint/cohort.")
        before = previous["before"]
    save(output / "initial.json", {"configuration": config, "before": before})
    journal.append("initial-evaluation-completed", before)
    slots = []
    updates = 0
    training_start = time.perf_counter()
    for slot_index in range(2):

        def generate(batch_index):
            torch.manual_seed(seed * 10000 + slot_index * 100 + batch_index)
            rows = sample_responses(
                model, tokenizer, plan[slot_index][batch_index], group_size=4, cap=8
            )
            for index, row in enumerate(rows):
                group = f"{seed}:{slot_index}:{batch_index}:{index//4}"
                row.update(group_uid=group, uid=f"{group}:{index%4}", correct=bool(row["reward"]))
                row["base_reward"] = 1.0 if row["correct"] else -1.0
                row["length_penalty"] = (
                    length_penalty(len(row["completion_ids"])) if arm == "dapo-components" else 0.0
                )
                row["shaped_reward"] = row["base_reward"] + row["length_penalty"]
            save(output / f"slot-{slot_index+1}-candidate-{batch_index+1}.json", rows)
            journal.append(
                "candidate-generated",
                {"slot": slot_index + 1, "batch": batch_index + 1, "rows": rows},
            )
            return rows

        collected = collect(
            generate, max_batches=config["max_candidate_batches"], dynamic=arm == "dapo-components"
        )
        record = {"slot": slot_index + 1, **collected, "updates": []}
        record["generated_tokens"] = sum(
            len(r["completion_ids"]) for batch in collected["candidates"] for r in batch
        )
        record["selected_tokens"] = sum(len(r["completion_ids"]) for r in collected["selected"])
        if collected["status"] == "filled":
            rows = collected["selected"]
            batch = rollout_batch(rows, tokenizer.eos_token_id)
            rewards = torch.tensor([r["shaped_reward"] for r in rows])
            advantage, statistics = advantages(rewards)
            with torch.no_grad():
                old, mask = response_logps(model, **batch)
            record.update(
                rewards=rewards,
                advantages=advantage,
                statistics=statistics,
                old_logps=old,
                mask=mask,
            )
            journal.append(
                "old-rescore-operands", {"slot": slot_index + 1, "record": record, "batch": batch}
            )
            checkpoint(
                output / "latest-state.pt",
                model,
                optimizer,
                {"boundary": "rollout-before-update", "slot": slot_index + 1, "updates": updates},
                journal,
                record=record,
                batch=batch,
                configuration=config,
                prompt_plan=plan,
            )
            errors = []
            for i, row in enumerate(rows):
                sampled = torch.tensor(row["sampled_logps"])
                actual = old[i][mask[i]]
                errors.append(float((actual - sampled).abs().max()))
                journal.append(
                    "old-score-comparison",
                    {
                        "slot": slot_index + 1,
                        "row": i,
                        "sampled": sampled,
                        "rescored": actual,
                        "maximum_error": errors[-1],
                    },
                )
                torch.testing.assert_close(actual, sampled, atol=2e-5, rtol=2e-5)
            record.update(
                rewards=rewards,
                advantages=advantage,
                statistics=statistics,
                old_logps=old,
                mask=mask,
                sampling_logp_max_error=errors,
            )
            for iteration in range(2):
                optimizer.zero_grad(set_to_none=True)
                current, current_mask = response_logps(model, **batch)
                journal.append(
                    "current-mask-comparison",
                    {
                        "slot": slot_index + 1,
                        "iteration": iteration + 1,
                        "expected": mask,
                        "actual": current_mask,
                        "current_logps": current.detach(),
                    },
                )
                assert torch.equal(current_mask, mask)
                loss, detail = objective(
                    current,
                    old,
                    mask,
                    advantage,
                    high=config["clip_high"],
                    reduction=config["reduction"],
                )
                loss.backward()
                norm = (
                    sum(
                        float(p.grad.detach().double().square().sum())
                        for p in model.parameters()
                        if p.grad is not None
                    )
                    ** 0.5
                )
                journal.append(
                    "gradient-before-update",
                    {
                        "slot": slot_index + 1,
                        "iteration": iteration + 1,
                        "loss": loss.detach(),
                        "gradient_l2": norm,
                        "details": detail,
                    },
                )
                if not all(
                    torch.isfinite(p.grad).all() for p in model.parameters() if p.grad is not None
                ):
                    raise FloatingPointError("Nonfinite gradient; optimizer not called.")
                optimizer.step()
                updates += 1
                record["updates"].append(
                    {
                        "iteration": iteration + 1,
                        "loss": loss.detach(),
                        "gradient_l2": norm,
                        "current_logps": current.detach(),
                        **detail,
                    }
                )
                save(output / f"slot-{slot_index+1}.json", record)
                journal.append(
                    "optimizer-update-completed",
                    {
                        "slot": slot_index + 1,
                        "iteration": iteration + 1,
                        "updates": updates,
                        "record": record,
                    },
                )
                checkpoint(
                    output / "latest-state.pt",
                    model,
                    optimizer,
                    {
                        "boundary": "optimizer-update-completed",
                        "slot": slot_index + 1,
                        "iteration": iteration + 1,
                        "updates": updates,
                    },
                    journal,
                    record=record,
                    batch=batch,
                    configuration=config,
                    prompt_plan=plan,
                )
        slots.append(serial(record))
        save(output / f"slot-{slot_index+1}.json", record)
        journal.append("slot-completed", record)
        checkpoint(
            output / "latest-state.pt",
            model,
            optimizer,
            {"boundary": "slot-completed", "slot": slot_index + 1, "updates": updates},
            journal,
            record=record,
            configuration=config,
            prompt_plan=plan,
            completed_slots=slots,
        )
    training_seconds = time.perf_counter() - training_start
    after = evaluate(model, tokenizer, test)
    save(output / "terminal-evaluation.json", after)
    journal.append("terminal-evaluation-completed", after)
    saved = output / "selected"
    model.save_pretrained(saved)
    tokenizer.save_pretrained(saved)
    restored, _ = load_policy(saved)
    for index, (actual, expected) in enumerate(
        zip(restored.parameters(), model.parameters(), strict=True)
    ):
        journal.append(
            "reload-parameter-comparison",
            {
                "parameter_index": index,
                "maximum_error": float((actual - expected).detach().abs().max()),
            },
        )
        torch.testing.assert_close(actual, expected, atol=0, rtol=0)
    report = {
        "configuration": config,
        "before": before,
        "after": after,
        "slots": slots,
        "optimizer_updates": updates,
        "parameter_change": parameter_change(model, initial),
        "reload_exact": True,
        "timing": {
            "training_and_collection_seconds": training_seconds,
            "total_seconds": time.perf_counter() - start,
        },
        "model_configuration": model.config.to_dict(),
        "parameter_count": sum(p.numel() for p in model.parameters()),
        "boundary": "Short-label mechanism demonstration; no long-reasoning or component-causal-effect claim.",
    }
    save(output / "report.json", report)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ["model", "data", "output"]:
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--arm", choices=["response-baseline", "dapo-components"], required=True)
    parser.add_argument("--seed", type=int, choices=[73, 89, 101], required=True)
    parser.add_argument("--initial-evaluation", type=Path)
    args = parser.parse_args()
    result = run(args.model, args.data, args.arm, args.seed, args.output, args.initial_evaluation)
    print(
        json.dumps(
            {
                "updates": result["optimizer_updates"],
                "reload_exact": result["reload_exact"],
                "parameter_change": result["parameter_change"],
            }
        )
    )
