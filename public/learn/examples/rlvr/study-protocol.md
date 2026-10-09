# Prospective RLVR execution protocol

This document and protocol.json are fixed before model construction or scientific
execution. There is no outcome-based selection, extra seed, early stop or budget
change. A failed implementation receives only a justified API/contract repair
with exact predecessor evidence; it is not an invitation to tune toward success.

## Custom causal study

Three seeds 17, 29, 43, CPU float32, one thread. Each seed initializes one width 24,
two-head, one-block causal model with context 320 and vocabulary 260. There is no
pretrained knowledge. All selected prompts/targets fit the declared context.

Warm once per seed for 192 AdamW updates, batch 6 sampled with replacement from the
24 training records, learning rate .002, weight decay 0. Only response targets
`#### gold` and genuine EOS are supervised. The warm loss is a pooled mean over
those targets. The same exact state is copied into group-scaled GRPO,
unscaled-centred GRPO and verified-sample SFT. Each GRPO reference is that warm
checkpoint and stays frozen. AdamW state starts fresh for each arm.

Each arm has 48 scheduled batches, two distinct training prompts per batch and
four independent autoregressive samples per prompt. Each response has at most 12
new tokens; genuine EOS stops it and remains an included target. Full softmax
support, temperature 1, no top-k/top-p deletion or forced-answer grammar. RNG keys
include seed/arm/purpose/step. Arms share initialization and budgets, not future
samples. Gold does not appear in the generation prompt.

The strict numeric verifier compares the entire suffix after the final ####
marker with the gold numeric object. A malformed prediction scores 0; missing or
invalid gold is unknown. Every selected gold is valid and present. Acceptance
checks the number, not the accuracy of any reasoning text.

GRPO uses raw group centering, optionally divided by population standard
deviation + .0001. Both GRPO arms use epsilon .2, beta .02, two rescoring epochs per
detached rollout, token importance ratios and mean per-response included-token
loss. The plain sampled k3 penalty has no differentiable current/old ratio
multiplier. AdamW learning rate .0005, weight decay 0, default betas/epsilon and no
gradient clipping. KL can move a homogeneous group after its policy leaves the
reference. A zero or tiny gradient is still an actual scheduled optimizer update.

Verified-sample SFT has one response-equal likelihood update when at least one
sample passes; empty sets skip the update. Count unequal actual optimizer work
explicitly. Do not describe this as equal compute or isolate an estimator effect
from the different objective, sample selection and update count.

Evaluation checkpoints are 0, 16, 32, 48, all 12 untouched test records, eight fresh
samples per record at the same temperature/cap. No test-selected checkpoint or
hyperparameter. All checkpoint/response/verifier addresses remain in the output.
Fresh samples have the same record addresses but are not paired identical draws.

Prospective fixed maximum counts: 576 warm batches/updates and 3,456 drawn warm
rows (3×192×6), 432 scheduled arm
rollouts, 864 training prompt groups, 3,456 training responses, at most 41,472 training
new tokens, 3,456 evaluation responses and at most 41,472 evaluation new tokens.
The two GRPO arms across three seeds have 576 actual updates. Verified-sample SFT
has 0–144; total arm updates 576–720. Warm-up/native/pretrained work is separate.

## Ordinary native/tool probes

Native GPT-2 uses seed 19, the same fixed byte addresses and dimensions but a
different architecture with tied input/output embeddings. Warm 64 updates with
the same teacher-forced response-target contract, then save/reload its exact
local checkpoint. TRL v1.14.2 loads a non-PEFT reference by model path; the reference
hash must equal this warm state. The one native AdamW update has no clipping,
weight decay or scheduler decay. Explicit code compares the actual sampled
batch's forward loss, all parameter gradients and one update, preserving sample
standard deviation + .0001 as this native implementation's group convention.

All critical settings are explicitly supplied: loss_type="grpo", group scaling,
beta=.02, token ratios, one iteration, plain k3 branch, dropout disabled,
no truncation masking, four generations, temperature 1, top_p=1, top_k=0, cap 12,
CPU float32 and no reporting/push. The constructed signed fixture is a second
loss/gradient comparison, not another optimizer step or an observed sample result.

Flan-T5-small uses the exact cached revision 0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab,
the 12 untouched questions, greedy decoding and at most 64 new decoder tokens.
No model download or fit. Maximum 12 responses/768 new tokens. Decoder start
positions are retained but excluded from the new-token count.

Math-Verify 0.9.0 and TRL accuracy_reward process eleven finite raw cases under
their recorded parse/normalization settings. Direct timeouts are disabled;
accuracy_reward uses its supported non-main-thread no-alarm branch. This handles
a finite local fixture and is not a universal parser or execution sandbox.

## Retention

Every status, stdout/stderr, raw response byte IDs, mask, score, parameter/checkpoint
identity and evaluation row is retained. run_all.py only reuses source-matched
successful stages and their exact transitive dependencies. The frozen pre-run
packet is separate from the later execution receipt. No generated caches or
private weights are deployed with the lesson.
