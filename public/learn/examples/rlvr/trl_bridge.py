"""One actual native GRPO step; explicit loss/gradient bridge and own-step audit.

Cross-implementation update equality is reported with its original threshold.
Own-step analytical consistency is a distinct condition; no equality is implied.

python -B trl_bridge.py --output observations/trl.json --workdir native-work
Uses offline records and a small local GPT-2. No pretrained model is downloaded.
"""

import argparse
import copy
from dataclasses import asdict
import importlib.metadata
from pathlib import Path

import torch
from datasets import Dataset
from transformers import GPT2Config, GPT2LMHeadModel, TrainerCallback
from trl import GRPOConfig, GRPOTrainer

from rlvr_data import (
    BOS,
    EOS,
    INSTRUCTION,
    PAD,
    SEP,
    byte_tokenizer,
    decode,
    emit,
    load_protocol,
    load_records,
    model_digest,
    prompt_ids,
    tensor_json,
)
from tiny_causal_rlvr import warm_model
from verifier_contracts import final_verdict
from scientific_journal import ScientificJournal, fresh_run_paths, training_state
from adamw_step_audit import audit_pair, exact_row_mapping


def explicit_loss(model, batch, settings):
    """Open the full causal gather, token ratio, signed clip and plain k3."""
    ids = torch.cat([batch["prompt_ids"], batch["completion_ids"]], dim=1)
    attention = torch.cat([batch["prompt_mask"], batch["completion_mask"]], dim=1)
    count = batch["completion_ids"].shape[1]
    logits = model(input_ids=ids, attention_mask=attention, use_cache=False).logits[
        :, :-1, :
    ]
    logits = logits[:, -count:] / settings["temperature"]
    logps = (
        logits.log_softmax(-1)
        .gather(-1, batch["completion_ids"][..., None])
        .squeeze(-1)
    )
    old = batch.get("old_per_token_logps", logps.detach())
    ratio = (logps - old).exp()
    advantage = batch["advantages"][:, None]
    terms = torch.minimum(ratio * advantage, ratio.clamp(0.8, 1.2) * advantage)
    delta = batch["ref_per_token_logps"] - logps
    k3 = delta.exp() - delta - 1
    mask = batch["completion_mask"]
    token_loss = -terms + settings["beta"] * k3
    loss = ((token_loss * mask).sum(-1) / mask.sum(-1).clamp(min=1.0)).mean()
    return loss, {
        "current_logps": logps,
        "token_ratios": ratio,
        "token_k3": k3,
        "response_losses": (token_loss * mask).sum(-1) / mask.sum(-1).clamp(min=1.0),
    }


def gradient_difference(
    native_loss, model, explicit, twin, journal=None, location=None
):
    native_grad = torch.autograd.grad(
        native_loss, tuple(model.parameters()), allow_unused=True, retain_graph=True
    )
    explicit_grad = torch.autograd.grad(
        explicit, tuple(twin.parameters()), allow_unused=True, retain_graph=True
    )
    differences = []
    for index, (left, right) in enumerate(zip(native_grad, explicit_grad)):
        if journal:
            journal.append(
                "gradient-presence-check",
                {
                    "location": location,
                    "parameter_index": index,
                    "native_absent": left is None,
                    "explicit_absent": right is None,
                },
            )
        assert (left is None) == (right is None)
        if left is not None:
            differences.append(float((left - right).abs().max()))
    return max(differences, default=0.0)


def run(workdir, journal):
    protocol = load_protocol()
    settings = protocol["native"]
    torch.set_num_threads(protocol["threads"])
    torch.manual_seed(settings["seed"])
    records = load_records()
    tokenizer = byte_tokenizer()
    for row in records["train"] + records["test"]:
        text = "[BOS]" + row["question"] + INSTRUCTION + "[SEP]"
        assert tokenizer.encode(text, add_special_tokens=False) == prompt_ids(row)
    config = GPT2Config(
        vocab_size=260,
        n_positions=320,
        n_ctx=320,
        n_embd=24,
        n_head=2,
        n_layer=1,
        resid_pdrop=0.0,
        embd_pdrop=0.0,
        attn_pdrop=0.0,
        bos_token_id=BOS,
        eos_token_id=EOS,
        pad_token_id=PAD,
    )
    warm = GPT2LMHeadModel(config)
    warm_history = warm_model(
        warm,
        records["train"],
        settings["seed"],
        settings["warm_steps"],
        settings["warm_batch"],
        settings["warm_learning_rate"],
        native=True,
        journal=journal,
    )
    checkpoint = workdir / "warm"
    warm.save_pretrained(checkpoint)
    tokenizer.save_pretrained(checkpoint)
    # Pinned TRL creates its non-PEFT reference by model path; save/reload the exact warm state.
    model = GPT2LMHeadModel.from_pretrained(checkpoint, local_files_only=True).eval()
    twin = copy.deepcopy(model).eval()
    warm_hash = model_digest(model)
    journal.append(
        "native-warm-completed", {"history": warm_history, "warm_sha256": warm_hash}
    )
    captures, losses, reward_calls = [], [], []

    def numeric_reward(completions, gold, completion_ids, record_id, **kwargs):
        rows = [
            {
                "record_id": identity,
                "raw_ids": ids,
                "response": decode(ids),
                "native_decoded_response": text,
                "gold": label,
                "verdict": final_verdict(decode(ids), label),
            }
            for text, ids, label, identity in zip(
                completions, completion_ids, gold, record_id
            )
        ]
        reward_calls.append(rows)
        journal.append("native-rewards-generated", {"rows": rows})
        return [row["verdict"]["reward"] for row in rows]

    class CapturingTrainer(GRPOTrainer):
        def _generate_and_score_completions(self, inputs):
            batch = super()._generate_and_score_completions(inputs)
            captures.append(
                {
                    key: (
                        value.detach().clone()
                        if isinstance(value, torch.Tensor)
                        else value
                    )
                    for key, value in batch.items()
                }
            )
            journal.append("native-batch-captured", {"batch": captures[-1]})
            journal.checkpoint(
                training_state(
                    model,
                    optimizer,
                    reference=self.ref_model,
                    captured_batch=captures[-1],
                    reward_calls=reward_calls,
                    twin=training_state(twin),
                    scheduler=scheduler.state_dict(),
                    native_step=self.state.global_step,
                ),
                "native-batch-before-update",
            )
            return batch

        def _compute_loss(self, current_model, inputs):
            native = super()._compute_loss(current_model, inputs)
            journal.append(
                "native-actual-loss-addresses",
                {
                    "inputs": inputs,
                    "row_identity": exact_row_mapping(captures[-1], inputs),
                    "native_model_training": current_model.training,
                    "explicit_model_training": twin.training,
                },
            )
            manual, details = explicit_loss(twin, inputs, settings)
            journal.append(
                "native-loss-before-gradient-check",
                {
                    "native_loss": float(native.detach()),
                    "explicit_loss": float(manual.detach()),
                    "details": details,
                },
            )
            difference = gradient_difference(
                native, current_model, manual, twin, journal, "sampled-batch"
            )
            observation = {
                "native_loss": float(native.detach()),
                "explicit_loss": float(manual.detach()),
                "max_gradient_difference": difference,
                "details": tensor_json(details),
            }
            journal.append("native-loss-gradient-parity", observation)
            if (
                abs(float(native.detach() - manual.detach())) > 5e-6
                or difference > 5e-5
            ):
                raise RuntimeError("Native versus explicit loss/gradient mismatch")
            losses.append(observation)
            twin.zero_grad(set_to_none=True)
            manual.backward()
            return native

    class CompletedStepJournal(TrainerCallback):
        def on_step_end(self, args, state, control, **kwargs):
            journal.append(
                "native-optimizer-step-completed",
                {"global_step": state.global_step, "state_sha256": model_digest(model)},
            )
            journal.checkpoint(
                training_state(
                    model,
                    optimizer,
                    reference=trainer.ref_model,
                    twin=training_state(twin),
                    scheduler=scheduler.state_dict(),
                    native_step=state.global_step,
                    captured_batches=captures,
                    losses=losses,
                    reward_calls=reward_calls,
                    trainer_state=asdict(state),
                ),
                "native-optimizer-step-completed",
            )
            return control

    args = GRPOConfig(
        output_dir=str(workdir / "trainer"),
        use_cpu=True,
        bf16=False,
        fp16=False,
        max_steps=1,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=1,
        num_generations=4,
        num_iterations=1,
        max_completion_length=12,
        loss_type="grpo",
        scale_rewards="group",
        beta=0.02,
        epsilon=0.2,
        importance_sampling_level="token",
        use_bias_correction_kl=False,
        disable_dropout=True,
        mask_truncated_completions=False,
        temperature=1.0,
        top_p=1.0,
        top_k=0,
        learning_rate=0.0005,
        weight_decay=0.0,
        max_grad_norm=0.0,
        lr_scheduler_type="constant",
        report_to=[],
        push_to_hub=False,
        save_strategy="no",
        disable_tqdm=True,
        seed=19,
        data_seed=19,
        dataloader_num_workers=0,
        use_liger_kernel=False,
        remove_unused_columns=False,
        model_init_kwargs={"local_files_only": True},
    )
    dataset = Dataset.from_list(
        [
            {
                "prompt": "[BOS]" + row["question"] + INSTRUCTION + "[SEP]",
                "gold": row["gold"],
                "record_id": row["id"],
            }
            for row in records["train"]
        ]
    )
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.0005, weight_decay=0.0)
    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lambda step: 1.0)
    trainer = CapturingTrainer(
        model=model,
        args=args,
        reward_funcs=numeric_reward,
        train_dataset=dataset,
        processing_class=tokenizer,
        optimizers=(optimizer, scheduler),
        callbacks=[CompletedStepJournal()],
    )
    journal.append(
        "native-reference-start-check",
        {
            "expected_sha256": warm_hash,
            "actual_sha256": model_digest(trainer.ref_model),
        },
    )
    assert model_digest(trainer.ref_model) == warm_hash
    trainer.current_gradient_accumulation_steps = 1
    trainer.train()
    journal.append(
        "native-train-returned",
        {
            "global_step": trainer.state.global_step,
            "captured_losses": len(losses),
            "log_history": trainer.state.log_history,
        },
    )
    assert trainer.state.global_step == 1 and len(losses) == 1
    twin_optimizer = torch.optim.AdamW(twin.parameters(), lr=0.0005, weight_decay=0.0)
    twin_optimizer.step()
    update_difference = max(
        float((left - right).abs().max())
        for left, right in zip(model.parameters(), twin.parameters())
    )
    journal.append(
        "native-one-update-parity",
        {
            "max_parameter_difference": update_difference,
            "reference_sha256": model_digest(trainer.ref_model),
            "expected_reference_sha256": warm_hash,
            "reference_gradients_absent": all(
                p.grad is None for p in trainer.ref_model.parameters()
            ),
        },
    )
    journal.checkpoint(
        training_state(
            model,
            optimizer,
            reference=trainer.ref_model,
            twin=training_state(twin, twin_optimizer),
            scheduler=scheduler.state_dict(),
            native_step=trainer.state.global_step,
            captured_batches=captures,
            losses=losses,
            reward_calls=reward_calls,
            trainer_state=asdict(trainer.state),
        ),
        "native-one-update-parity",
    )
    # Preserve the original cross-implementation threshold and report its
    # outcome; own-step arithmetic consistency is a separate condition.
    own_step_audit = audit_pair(
        training_state(
            model,
            optimizer,
            reference=trainer.ref_model,
            twin=training_state(twin, twin_optimizer),
        )
    )
    journal.append("native-own-step-analytical-audit", own_step_audit)
    assert own_step_audit["consistent"]
    assert model_digest(trainer.ref_model) == warm_hash
    assert all(parameter.grad is None for parameter in trainer.ref_model.parameters())
    batch = captures[0]
    fixture_result = finish_remaining_fixture(
        trainer, model, settings, batch, reward_calls, journal
    )
    return {
        "settings": settings,
        "config": args.to_dict(),
        "warm_history": warm_history,
        "warm_state_sha256": warm_hash,
        "final_state_sha256": model_digest(model),
        "reference_state_sha256": model_digest(trainer.ref_model),
        "native_reward_calls": reward_calls,
        "captured_batch": tensor_json(batch),
        "losses": losses,
        "optimizer_updates": trainer.state.global_step,
        "max_one_update_parameter_difference": update_difference,
        "one_update_analytical_audit": own_step_audit,
        "mixed_fixture": fixture_result,
        "native_log_history": trainer.state.log_history,
        "versions": {
            name: importlib.metadata.version(name)
            for name in [
                "torch",
                "transformers",
                "trl",
                "datasets",
                "tokenizers",
                "accelerate",
            ]
        },
    }


def finish_remaining_fixture(trainer, model, settings, batch, reward_calls, journal):
    observed_rewards = torch.tensor(
        [row["verdict"]["reward"] for row in reward_calls[0]], dtype=torch.float32
    )
    expected = (observed_rewards - observed_rewards.mean()) / (
        observed_rewards.std(correction=1) + 1e-4
    )
    journal.append(
        "native-group-advantage-check",
        {
            "rewards": observed_rewards,
            "expected": expected,
            "actual": batch["advantages"],
        },
    )
    assert torch.allclose(batch["advantages"], expected, atol=2e-6)

    # A declared mixed fixture, separate from the genuinely sampled group's outcomes.
    fixture = {
        key: value.clone() if isinstance(value, torch.Tensor) else value
        for key, value in batch.items()
    }
    fixture["advantages"] = torch.tensor([1.0, -1.0, 1.0, -1.0])
    model.eval()
    twin = copy.deepcopy(model).eval()
    with torch.no_grad():
        _, observed = explicit_loss(model, fixture, settings)
        fixture["old_per_token_logps"] = observed["current_logps"].detach()
    journal.append(
        "constructed-fixture-before-check", {"fixture": fixture, "optimizer_updates": 0}
    )
    # Bypass the training-capture subclass: compare the actual maintained loss directly.
    native_fixture = GRPOTrainer._compute_loss(trainer, model, fixture)
    manual_fixture, fixture_details = explicit_loss(twin, fixture, settings)
    journal.append(
        "constructed-fixture-before-gradient-check",
        {
            "native_loss": float(native_fixture.detach()),
            "explicit_loss": float(manual_fixture.detach()),
            "details": fixture_details,
        },
    )
    fixture_difference = gradient_difference(
        native_fixture, model, manual_fixture, twin, journal, "constructed-fixture"
    )
    journal.append(
        "constructed-fixture-parity",
        {
            "native_loss": float(native_fixture.detach()),
            "explicit_loss": float(manual_fixture.detach()),
            "max_gradient_difference": fixture_difference,
            "details": fixture_details,
        },
    )
    assert (
        abs(float(native_fixture.detach() - manual_fixture.detach())) < 5e-6
        and fixture_difference < 5e-5
    )
    return {
        "origin": "constructed coefficients on the same captured addresses; no optimizer step",
        "advantages": fixture["advantages"].tolist(),
        "native_loss": float(native_fixture.detach()),
        "explicit_loss": float(manual_fixture.detach()),
        "max_gradient_difference": fixture_difference,
        "details": tensor_json(fixture_details),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("observations/trl.json"))
    parser.add_argument("--workdir", type=Path, default=Path("native-work"))
    args = parser.parse_args()
    output, workdir = fresh_run_paths(args.output, args.workdir)
    journal = ScientificJournal(workdir)
    try:
        result = run(workdir, journal)
        emit(output, result)
        journal.append("stage-completed", {"output": str(output)})
    except BaseException as exception:
        journal.failure(journal.location, exception)
        raise
    print(
        {
            "native_updates": result["optimizer_updates"],
            "max_one_update_parameter_difference": result[
                "max_one_update_parameter_difference"
            ],
            "mixed_fixture_gradient_difference": result["mixed_fixture"][
                "max_gradient_difference"
            ],
        }
    )


if __name__ == "__main__":
    main()
