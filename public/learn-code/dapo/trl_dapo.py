"""Ordinary TRL DAPO-style objective: two updates, without dynamic refill.

python trl_dapo.py --model PATH --data ./data --output ./runs/native
Constructed FP64 parity precedes the two FP32 sampled updates. No tuning loop.
"""

import argparse
import copy
from dataclasses import asdict
import json
import time
from pathlib import Path
import torch
from datasets import Dataset
from trl import GRPOConfig, GRPOTrainer
from trl.rewards import get_soft_overlong_punishment
from transformers import TrainerCallback

from dapo_math import objective
from group_losses import response_logps
from online_preferences import load_policy, classify_ids, parameter_change, sha256
from sft_data import load_source, prompt
from sft_evaluate import evaluate
from train_dapo import save, serial, checkpoint
from scientific_journal import ScientificJournal


def compare(native, manual, parameters, shadow=False, journal=None, case=None):
    parameters = tuple(parameters)
    left = torch.autograd.grad(native, parameters, retain_graph=True, allow_unused=True)
    right = torch.autograd.grad(manual, parameters, allow_unused=True)
    precise = native.dtype == torch.float64
    if journal:
        journal.append(
            "native-loss-comparison",
            {
                "case": case,
                "native": native.detach(),
                "manual": manual.detach(),
                "absolute_error": float((native - manual).detach().abs()),
            },
        )
    torch.testing.assert_close(
        native, manual, atol=1e-11 if precise else 3e-6, rtol=1e-10 if precise else 2e-5
    )
    maximum = 0.0
    elements = 0
    for index, (a, b) in enumerate(zip(left, right, strict=True)):
        if journal:
            journal.append(
                "native-gradient-comparison",
                {
                    "case": case,
                    "parameter_index": index,
                    "native_absent": a is None,
                    "manual_absent": b is None,
                    "maximum_error": None if a is None or b is None else float((a - b).abs().max()),
                },
            )
        if a is None or b is None:
            assert a is None and b is None
            continue
        try:
            torch.testing.assert_close(
                a, b, atol=1e-10 if precise else 2e-5, rtol=1e-9 if precise else 5e-4
            )
        except AssertionError:
            if journal:
                torch.save(
                    {"native": a.detach(), "manual": b.detach()},
                    journal.workdir / f"failed-gradient-{case}-{index}.pt",
                )
            raise
        maximum = max(maximum, float((a - b).abs().max()))
        elements += a.numel()
    step_error = None
    if shadow:
        first = [torch.nn.Parameter(p.detach().clone()) for p in parameters]
        second = [torch.nn.Parameter(p.detach().clone()) for p in parameters]
        for p, g in zip(first, left):
            p.grad = None if g is None else g.detach().clone()
        for p, g in zip(second, right):
            p.grad = None if g is None else g.detach().clone()
        torch.optim.SGD(first, lr=1e-4).step()
        torch.optim.SGD(second, lr=1e-4).step()
        step_error = max(float((a - b).abs().max().detach()) for a, b in zip(first, second))
        if journal:
            journal.append("shadow-update-comparison", {"case": case, "maximum_error": step_error})
        for index, (a, b) in enumerate(zip(first, second)):
            try:
                torch.testing.assert_close(
                    a, b, atol=2e-12 if precise else 2e-6, rtol=2e-11 if precise else 2e-5
                )
            except AssertionError:
                if journal:
                    torch.save(
                        {"native": a.detach(), "manual": b.detach()},
                        journal.workdir / f"failed-shadow-{case}-{index}.pt",
                    )
                raise
    return {
        "native_loss": float(native.detach()),
        "scratch_loss": float(manual.detach()),
        "dtype": str(native.dtype),
        "gradient_elements": elements,
        "maximum_gradient_error": maximum,
        "shadow_sgd_maximum_error": step_error,
    }


class InspectDAPO(GRPOTrainer):
    def __init__(self, *args, receipt_dir, journal, **kwargs):
        self.receipt_dir = Path(receipt_dir)
        self.journal = journal
        self.parity = []
        self.batches = []
        self.shadow = False
        super().__init__(*args, **kwargs)

    def _get_per_token_logps_and_entropies(self, *args, **kwargs):
        result = super()._get_per_token_logps_and_entropies(*args, **kwargs)
        self.native_logps = result[0]
        return result

    def _generate_and_score_completions(self, inputs):
        result = super()._generate_and_score_completions(inputs)
        self.batches.append(serial(result))
        save(self.receipt_dir / f"generated-{len(self.batches)}.json", self.batches[-1])
        self.journal.append("native-batch-generated", self.batches[-1])
        checkpoint(
            self.journal.workdir / "latest-state.pt",
            self.model,
            self.optimizer,
            {"boundary": "native-batch-before-update", "native_step": self.state.global_step},
            self.journal,
            batch=result,
            trainer_state=asdict(self.state),
            scheduler=None if self.lr_scheduler is None else self.lr_scheduler.state_dict(),
            configuration=self.args.to_dict(),
        )
        return result

    def _compute_loss(self, model, inputs):
        native = super()._compute_loss(model, inputs)
        if not torch.is_grad_enabled():
            return native
        native_scores = self.native_logps
        mask = inputs["completion_mask"]
        if "tool_mask" in inputs:
            mask = mask * inputs["tool_mask"]
        ids = torch.cat([inputs["prompt_ids"], inputs["completion_ids"]], dim=1)
        attention = torch.cat([inputs["prompt_mask"], inputs["completion_mask"]], dim=1)
        target_mask = torch.cat([torch.zeros_like(inputs["prompt_mask"]), mask], dim=1)
        full, _ = response_logps(model, ids, attention, target_mask)
        current = full[:, -mask.shape[1] :]
        self.journal.append(
            "native-current-score-comparison",
            {
                "case": len(self.parity) + 1,
                "inputs": inputs,
                "current": current.detach(),
                "native": native_scores.detach(),
                "mask": mask,
                "maximum_error": float(
                    (current[mask.bool()] - native_scores[mask.bool()]).detach().abs().max()
                ),
            },
        )
        torch.testing.assert_close(
            current[mask.bool()], native_scores[mask.bool()], atol=2e-5, rtol=2e-5
        )
        old = inputs.get("old_per_token_logps")
        old = current.detach() if old is None else old
        denominator = float(inputs["num_items_in_batch"]) / self.accelerator.num_processes
        if model.training:
            denominator *= self.current_gradient_accumulation_steps / self.args.steps_per_generation
        manual, detail = objective(
            current,
            old,
            mask,
            inputs["advantages"],
            low=self.epsilon_low,
            high=self.epsilon_high,
            normalizer=max(denominator, 1.0),
        )
        save(
            self.receipt_dir / f"parity-input-{len(self.parity)+1}.json",
            {
                "inputs": inputs,
                "manual_details": detail,
                "manual_loss": manual.detach(),
                "native_loss": native.detach(),
                "normalizer": denominator,
            },
        )
        result = compare(
            native,
            manual,
            (p for p in model.parameters() if p.requires_grad),
            self.shadow,
            self.journal,
            f"{self.receipt_dir.name}-{len(self.parity)+1}",
        )
        self.parity.append(result)
        save(self.receipt_dir / f"parity-{len(self.parity)}.json", result)
        return native


def constructed_parity(trainer):
    before = [p.detach().clone() for p in trainer.model.parameters()]
    original_dtype = next(trainer.model.parameters()).dtype
    cases = []
    try:
        trainer.model.double().eval()
        prompts = torch.tensor([[2, 3]] * 4)
        completions = torch.tensor([[4, 0, 0], [5, 6, 0], [7, 0, 0], [8, 9, 0]])
        for truncate in [False, True]:
            # Actual EOS/PAD share0. The third row is declared cap-terminated in
            # this finite fixture, so optional truncation masking removes it.
            mask = torch.tensor([[1, 1, 0], [1, 1, 1], [1, 1, 0], [1, 1, 1]])
            if truncate:
                mask[2] = 0
            trainer.args.mask_truncated_completions = truncate
            all_ids = torch.cat([prompts, completions], dim=1)
            attention = torch.cat([torch.ones_like(prompts), mask], dim=1)
            with torch.no_grad():
                current, _, _ = trainer._get_per_token_logps_and_entropies(
                    trainer.model, all_ids, attention, 3
                )
            for shift in [0.0, 0.4, -0.4]:
                inputs = {
                    "prompt_ids": prompts,
                    "prompt_mask": torch.ones_like(prompts),
                    "completion_ids": completions,
                    "completion_mask": mask,
                    "advantages": torch.tensor([-0.75, 0.75, -1.25, 1.25], dtype=torch.float64),
                    "old_per_token_logps": current - shift,
                    "num_items_in_batch": mask.sum(),
                }
                trainer.shadow = not cases
                trainer._compute_loss(trainer.model, inputs)
                cases.append(
                    {"mask_truncated": truncate, "log_ratio_shift": shift, **trainer.parity[-1]}
                )
    finally:
        trainer.model.to(dtype=original_dtype)
        trainer.args.mask_truncated_completions = False
        trainer.shadow = False
        for actual, expected in zip(trainer.model.parameters(), before, strict=True):
            torch.testing.assert_close(actual, expected, atol=0, rtol=0)
    return {
        "boundary": "Constructed addresses/advantages and optional resulting masks; no generated observations or real optimizer updates.",
        "cases": cases,
        "initial_weights_restored_exactly": True,
    }


def run(model_path, data_path, output):
    journal = ScientificJournal(output)
    try:
        result = _run(model_path, data_path, output, journal)
        journal.append("run-completed", {"report": "report.json"})
        return result
    except BaseException as exception:
        journal.failure(journal.location, exception)
        raise


def _run(model_path, data_path, output, journal):
    output = Path(output)
    started = time.perf_counter()
    torch.set_num_threads(2)
    torch.manual_seed(73)
    model, tokenizer = load_policy(model_path)
    tokenizer.padding_side = "left"
    initial = copy.deepcopy(model).requires_grad_(False)
    source = load_source(data_path)
    train = sorted(source["train"], key=lambda row: row["id"])[:16]
    test = sorted(source["test"], key=lambda row: row["id"])[:32]
    rewards = []

    def accuracy(prompts, completions, completion_ids, gold, source_id, **kwargs):
        values = []
        for text, ids, label, identity in zip(
            completions, completion_ids, gold, source_id, strict=True
        ):
            decoded = classify_ids(tokenizer, ids)
            value = 1.0 if decoded["prediction"] == label else -1.0
            row = {
                "id": identity,
                "gold": label,
                "ids": ids,
                "native_text": text,
                **decoded,
                "base_reward": value,
            }
            rewards.append(row)
            values.append(value)
            with (output / "rewards.jsonl").open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(row) + "\n")
            journal.append("native-reward-generated", row)
        return values

    args = GRPOConfig(
        output_dir=str(output / "trainer"),
        use_cpu=True,
        bf16=False,
        fp16=False,
        report_to="none",
        push_to_hub=False,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=1,
        max_steps=2,
        learning_rate=1e-4,
        optim="sgd",
        weight_decay=0.0,
        lr_scheduler_type="constant",
        max_grad_norm=0.0,
        seed=73,
        data_seed=73,
        save_strategy="no",
        logging_steps=1,
        disable_tqdm=True,
        num_generations=4,
        max_completion_length=8,
        temperature=1.0,
        top_p=1.0,
        top_k=0,
        beta=0.0,
        epsilon=0.2,
        epsilon_high=0.28,
        num_iterations=1,
        steps_per_generation=1,
        mask_truncated_completions=False,
        use_vllm=False,
        disable_dropout=True,
        loss_type="dapo",
        scale_rewards="group",
        importance_sampling_level="token",
        use_bias_correction_kl=False,
        delta=None,
        entropy_coef=0.0,
        off_policy_mask_threshold=None,
        top_entropy_quantile=1.0,
        use_liger_kernel=False,
        multi_objective_aggregation="sum_then_normalize",
        reward_weights=[1.0, 1.0],
        dataloader_num_workers=0,
    )
    data = Dataset.from_list(
        [{"prompt": prompt(r["verse"]), "gold": r["label"], "source_id": r["id"]} for r in train]
    )
    trainer = InspectDAPO(
        model=model,
        args=args,
        train_dataset=data,
        processing_class=tokenizer,
        reward_funcs=[
            accuracy,
            get_soft_overlong_punishment(max_completion_len=8, soft_punish_cache=4),
        ],
        receipt_dir=output,
        journal=journal,
    )
    trainer.current_gradient_accumulation_steps = 1
    checkpoint(
        output / "latest-state.pt",
        model,
        None,
        {"boundary": "native-initial", "native_step": 0},
        journal,
        trainer_state=asdict(trainer.state),
        configuration=args.to_dict(),
    )
    preflight = constructed_parity(trainer)
    save(output / "constructed-parity.json", preflight)
    trainer.parity = []
    # Separate prefix prevents actual records overwriting finite preflight receipts.
    trainer.receipt_dir = output / "actual"
    trainer.receipt_dir.mkdir()

    class SaveBoundary(TrainerCallback):
        def on_step_end(
            self, args, state, control, model=None, optimizer=None, lr_scheduler=None, **kwargs
        ):
            journal.append("native-optimizer-step-completed", {"native_step": state.global_step})
            checkpoint(
                output / "latest-state.pt",
                model,
                optimizer,
                {"boundary": "native-optimizer-step-completed", "native_step": state.global_step},
                journal,
                scheduler=None if lr_scheduler is None else lr_scheduler.state_dict(),
                trainer_state=asdict(state),
                batches=trainer.batches,
                parity=trainer.parity,
                rewards=rewards,
                configuration=args.to_dict(),
            )
            return control

    trainer.add_callback(SaveBoundary())
    before = evaluate(model, tokenizer, test)
    save(output / "initial-evaluation.json", before)
    journal.append("initial-evaluation-completed", before)
    save(output / "configuration.json", args.to_dict())
    training_start = time.perf_counter()
    metrics = trainer.train().metrics
    training_seconds = time.perf_counter() - training_start
    journal.append(
        "native-train-returned",
        {
            "global_step": trainer.state.global_step,
            "batches": len(trainer.batches),
            "parity": len(trainer.parity),
            "metrics": metrics,
        },
    )
    assert trainer.state.global_step == 2 and len(trainer.batches) == 2 and len(trainer.parity) == 2
    after = evaluate(model, tokenizer, test)
    save(output / "terminal-evaluation.json", after)
    journal.append("terminal-evaluation-completed", after)
    selected = output / "selected"
    trainer.save_model(str(selected))
    tokenizer.save_pretrained(selected)
    restored, _ = load_policy(selected)
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
        "configuration": args.to_dict(),
        "initial_weights": sha256(Path(model_path) / "model.safetensors"),
        "train_ids": [r["id"] for r in train],
        "test_ids": [r["id"] for r in test],
        "before": before,
        "after": after,
        "rewards": rewards,
        "native_batches": trainer.batches,
        "actual_parity": trainer.parity,
        "constructed_parity": preflight,
        "metrics": metrics,
        "optimizer_updates": 2,
        "reload_exact": True,
        "parameter_change": parameter_change(model, initial),
        "timing": {
            "native_train_seconds": training_seconds,
            "total_seconds": time.perf_counter() - started,
        },
        "boundary": "Ordinary native objective and soft reward; no dynamic group refill; no reasoning benchmark reproduction.",
    }
    save(output / "report.json", report)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ["model", "data", "output"]:
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    result = run(args.model, args.data, args.output)
    print(
        json.dumps(
            {
                "optimizer_updates": 2,
                "reload_exact": result["reload_exact"],
                "parameter_change": result["parameter_change"],
            }
        )
    )
