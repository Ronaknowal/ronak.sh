# DAPO: complete local mechanisms and real model updates

Use Python3.12 in a virtual environment, activate it in your shell, then install
`python -m pip install -r requirements.txt` from this extracted directory.
The finite programs need PyTorch and the ordinary TRL length-reward helper;
they do not construct a language model.

```sh
python dapo_checks.py --output finite.json
python practice_answers.py --output practice.json
```

`dapo_math.py` contains the differentiable objective, group statistics, optional
dual clipping and positional mask. `dapo_collect.py` retains whole immutable
row records through a bounded collector. The checks cover gradients, signed
clipping, empty masks, ragged denominators, whole-group identity, finite budgets,
native length penalties and a narrow final-answer parser. The parser takes the
last literal `\boxed{` marker even if nested and accepts only integer contents;
it does not parse general LaTeX or certify a proof.

The exact copied GRPO prerequisites are `online_preferences.py`, `group_losses.py`,
`sft_data.py` and `sft_evaluate.py`. The scratch DAPO route reuses only their
backbone loading, full-support sampler, token gathering, task formatting,
evaluation and parameter comparison. Its collector and objective are local.
Transformers implements the causal decoder; PyTorch implements autograd.

The three unchanged TSVs come from Google Research's Poem Sentiment release at
revision `612e9a1f86799126c68f0c5d9c3f1fc28f88068f`. Credit: Emily Sheng and David
Uthus(2020), *Investigating Societal Biases in a Poetry Composition System*.
Data licence: [CC BY4.0](https://creativecommons.org/licenses/by/4.0/).
[Original data](https://github.com/google-research-datasets/poem-sentiment/tree/612e9a1f86799126c68f0c5d9c3f1fc28f88068f).
The helpers omit mixed labels. This study takes the first16 training and32 test
records by original ID, exactly the demonstration cohort used in the GRPO lesson.
Repeated use means it is not a fresh benchmark cohort.

The recorded initial model is the SFT lesson's response-only seed17 selected
checkpoint, derived from Apache2.0
[Pythia14m](https://huggingface.co/EleutherAI/pythia-14m/tree/cf967c0a9a04383db6f7b1108d86b2962634b4ac).
Its `model.safetensors` hash is
`8ffe40fc676d22d608b58b35af11bf467c36981dbb3ccfe373a7d574bd8251cd`.
Adapted weights are not bundled. Reuse the SFT `response-17/selected` directory,
including its tokenizer. The SFT lesson provides acquisition and complete
training instructions. A newly trained checkpoint is a separate observation,
even if the same commands were used. These commands accept your local model;
they do not imply that it equals the recorded checkpoint.

```sh
python train_dapo.py --model response-17/selected --data data --arm response-baseline --seed 73 --output runs/response-baseline-73
python train_dapo.py --model response-17/selected --data data --arm dapo-components --seed 73 --output runs/dapo-components-73
```

Repeat these two commands with seeds89 and101 and distinct matching output
directory names to realize the complete prespecified six-run comparison. Each
run has two rollout slots and two SGD updates per filled slot. The baseline
keeps its first two prompt groups. The combined DAPO arm generates at most
three batches of two candidate prompts, each with four responses, to fill two
mixed-correctness groups. An exhausted slot is retained and receives no update.
Never increase the budget or search seeds until a desired outcome appears.

All generated responses use the full output vocabulary at temperature1 and a
maximum of8new tokens, with genuine EOS stopping. The DAPO arm uses +1/-1
correctness, soft length penalty with cap8/buffer4, sample-SD+1e-6 advantages,
.2/.28 clipping and pooled selected-token loss. The baseline omits the length
penalty/refill, uses symmetric.2clipping and response-equal loss. Both have beta0,
no hard-overlong masking and no dual clip. They differ in several components;
their comparison is not a causal ablation. Short sentiment labels do not test
long-chain mathematical reasoning.

The ordinary library route is separate:

```sh
python trl_dapo.py --model response-17/selected --data data --output runs/native
python report_dapo.py --runs runs --output observations.json
```

The native program uses actual TRL1.14.2 `GRPOTrainer` with `loss_type='dapo'`,
asymmetric clipping, the ordinary soft-overlong reward and beta0. It performs
two updates, **without dynamic refill**. Its group epsilon is1e-4. A finite
FP64 loss/all-gradient/shadow-SGD preflight runs first, then restores every
original FP32 parameter exactly. Preflight masks include one declared truncated
row; the real native campaign disables hard truncation masking. Actual batches
and their gradients are checked separately. No matched-sample claim connects
the native route to the scratch route.

Every scientific command refuses an existing run directory. Raw candidates,
selected IDs, old/current scores, losses and gradient checks are persisted;
`latest-state.pt` contains a coherent model/optimizer/RNG boundary for a deliberately
reviewed continuation. Automatic replay/resume is not implemented. Preserve
failures and create a separate continuation destination instead of overwriting
them. Private checkpoints remain outside the downloadable evidence bundle.
The exact reused `scientific_journal.py` helper writes flushed, fsynced events
and atomically replaces the latest checkpoint. Comparison values are retained
before assertions; failed gradient/shadow comparisons additionally save their
actual tensor operands privately. Scratch state includes the fixed old scores,
batch and advantages needed for another iteration. Native state includes the
actual scheduler and Trainer progress. Terminal evaluations are saved before
reload checks. The event history is append-only; the rolling state preserves
the most recent coherent boundary, not every earlier model checkpoint. A
forcible process termination cannot guarantee a final exception event.
The report accounts for all six prescribed scratch runs and the native result,
including exhausted/zero-update outcomes and durable scientific failures.
In the recorded study, combined seed73 stopped at its second-slot score check
after two completed updates. It has no terminal evaluation. Seeds89/101 and
the native route were then attempted once with their original settings; no
failed or completed seed was retried. A failed run is read from its initial
record and append-only events; an unattempted or unfinished run is rejected.
Before/after evaluation, parameter
movement and exact reload are distinct from a claim of quality improvement.

No script starts external tracking, uploads a model or launches a distributed
cluster. The official large-model recipe is a source comparison in the lesson;
the local commands are a bounded instructional study.
