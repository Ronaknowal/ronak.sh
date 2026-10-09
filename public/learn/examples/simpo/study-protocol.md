# Prospective SimPO study protocol

8 October 2026. The different-reviewed lesson design is
`07d1fd57de98a8aad26e08427d6513727ed8c7a6cd82b7362230c47a13bcd820`.
This protocol and all seven completed program sources, exact records, prepared
selection, dependency versions and native source identities are frozen before
the first optimizer update. Preparation and gradient checks are not fitting.
No outcomes are promised. Keep failed runs and all declared outputs; no trial
may be repeated to obtain a more appealing result. Semantic corrections require
an explicit preserved predecessor and prospective continuation.

## Mathematical and implementation questions

Compute causal response sums and genuine target counts, then means. The pair
objective is `softplus(gamma - beta * (chosen_mean - rejected_mean))`, averaged
over pairs. Plain SimPO uses beta 2 and absolute gamma .4. Mean is over genuine
response targets, including EOS; prompt context stays visible but its targets
are unselected. Padding is positional, even when its ID equals EOS. Reject empty
targets, unstable prompt/response boundaries and whole pairs exceeding context.
Check the finite complete tree, all probability-one terminating edges, stable
extremes, score derivatives, opposite labels versus fixed-orientation smoothing,
and a true normalized three-action shared-parameter drift witness. Finite supplied
path log-score changes in fitted models must never be labelled full-policy KL.

## Constructed controlled study

Use the inherited complete causal Transformer classes with 13 vocabulary items
in order: PAD, BOS, EOS, one, sentence, France, Italy, Paris, Rome, is, capital,
of, period. Width 32, two heads, two pre-normalized layers, context 16, no dropout,
CPU float32 and two Torch threads. Initialization seed is 47. Four prompts cross
one-word/sentence requests with France/Italy. Short responses contain the correct
capital and EOS; long responses contain capital, is, capital, of, country,
period, EOS. Both lengths for every prompt are the eight SFT demonstrations.
Each prompt supplies two comparisons: its correct-format response beats the
other format, and beats the same format with the wrong capital. These eight
labels are constructed task rules, not human judgments.

Run 120 full-batch response-token-mean SFT AdamW updates at learning rate .003,
weight decay 0, betas (.9,.999), epsilon 1e-8 and clipping norm 1. Save the actual
shared SFT state. Record SFT NLL at 0/30/60/90/120. Make four independent copies
with fresh optimizer states: mean/.4 margin, mean/zero margin, sum/.4 margin,
and mean/.4 margin plus .1 chosen-token-mean NLL. Each runs 40 full-pair updates
with beta 2, AdamW learning rate .001, otherwise the same optimizer settings.
The sum variant is a reference-free normalization ablation, not DPO. The NLL
term is normalized across all chosen targets, not across response means.

At updates 0/10/20/30/40 save every comparison's chosen/rejected sum, mean,
length, common mean gap, own objective loss and absolute sum change from the
initial snapshot. Save each final weight state. At every checkpoint sample eight
outputs per prompt (32 total), with fresh generator seed 947, temperature 1,
full vocabulary, EOS or eight new actions. PAD/BOS actions remain literal and
malformed. Success is exact equality to the stipulated instruction-appropriate
capital response, including EOS. Retain all 640 sampled outputs across the four
conditions and five checkpoints, including shared initial samples. Report exact
criterion counts, EOS/horizon/malformed counts and actual emitted lengths. These
are training prompts; one seed and matched update counts do not establish general
superiority or identical compute/optimization geometry.

## Released comparisons and current native library

Reuse the exact offline records from the DPO/RLHF lineage:
`records.json` SHA256
`2a22244d319774ff000ee2fa755a139a1d4a4a72d637e21c5ca6c232d1a748d8`.
The official Anthropic HH helpful-base source gzip SHA256 is
`518a5bf288456fc9f3b7c980c54116fba0c52f274d3f4d344675d83e4058f6f4`.
Source: https://huggingface.co/datasets/Anthropic/hh-rlhf ; retain its MIT license.
The inherited selection keeps exact text/labels, normalized first-human families,
seed-31 family split and at most two rows per selected family. Select first 128
train and 64 held-out rows by original row ID; no new outcome-based selection.
Fit the same WordLevel vocabulary to this selected train text only: four special
tokens followed by at most 1024 frequency-ranked words, ties alphabetical. The
held-out text cannot fit vocabulary. The original 192 rows are prospective inputs;
the prepared manifest records actual retained rows and exclusions.

Native CPO adds BOS to the prompt and EOS to the suffix. Independently derive
these exact IDs; require stable string tokenization boundaries and reject any
whole chosen/rejected sequence longer than 192 before creating the trainer.
Validate every retained native response row and the full first collated batch,
including -100 prompt/padding labels. Avoid native truncation entirely. Native
loss and every parameter gradient must match independent sum/count means within
absolute tolerances 2e-6 for loss and 2e-5 for gradients before either study fits.
Save the actual batch, selected token log probabilities, masks/counts and source
hashes. This preflight makes zero optimizer updates.

Create GPT2LMHeadModel from configuration: vocabulary from the frozen tokenizer,
context 256, width 32, one layer, two heads, all dropout probabilities zero,
CPU float32, two threads, seed 53. Forty response-only SFT updates use chosen
rows, successive complete repeated passes grouped into eight, AdamW .001,
weight decay 0, default betas/epsilon and clipping 1. Evaluate full training NLL
at 0/10/20/30/40. Save the exact SFT model and tokenizer.

Then use current TRL 1.14.2 `trl.experimental.cpo.CPOTrainer` with ordinary text
datasets and CPOConfig: loss_type="simpo", beta=2, simpo_gamma=.4, cpo_alpha=0,
alpha=0, label_smoothing=0, disable_dropout=True, max_length=192. Set CPU true,
bf16/fp16 false, gradient_checkpointing false, constant learning rate .001,
weight decay 0, batch eight, accumulation one, max_steps 40, clipping 1,
seed/data_seed 53, worker count zero, no checkpoint scheduling or external
reporting. Use the native trainer's shuffled train sampler. Native reward
accuracy uses strict positive unshifted mean gap; separately report the own
evaluation convention giving ties half credit. No auxiliary NLL is implicit.

Before/after evaluate every retained held-out pair: mean gap, plain surrogate,
strict and half-tie agreement, desired gap >=.2, genuine chosen/rejected lengths,
absolute sums/means and their changes. Sample two responses from each of the
first four held-out prompts, seed 953 reset per checkpoint, temperature 1,
full vocabulary, EOS or 24 actions. Keep all 16 strings/IDs, stop reasons,
special actions and emitted lengths. Save final model and verify reloaded
weights plus every held-out score exactly. This randomly initialized tiny model
is an API/mechanism study, not a helpful assistant, human win-rate benchmark or
controlled comparison to the separately initialized prior DPO experiment.

## Execution and conservation

Run native prepare-only and preflight-only first. The study runner's `--freeze`
binds all transitive program/data/protocol inputs and installed versions. Each
stage has one receipt, timestamp, complete command, log and output hash. Existing
successful results are conserved only when every bound input and result matches.
Failed outputs cannot be silently retried in place. Preserve failure logs and
source snapshots before a bounded implementation continuation. Rendering and
wording changes reuse unchanged scientific evidence.
