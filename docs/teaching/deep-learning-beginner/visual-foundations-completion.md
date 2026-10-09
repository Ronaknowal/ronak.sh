# Foundational visual completion — first five DL lessons (revision 7)

## Request and frozen scope

29 September 2026. The user asked to verify whether the first five Deep Learning
lessons, repaired in revision 6 by another agent ([record](visual-foundations.md)),
now meet the standard applied to positions 6–10
([record](initialization-to-landmark-cnns.md)). Five independent read-only audits
compared each whole lesson with that standard and with canonical teaching figures.
The user then asked to fix the gaps.

| Lesson | Audit verdict | Audit |
| --- | --- | --- |
| Perceptrons, Neurons & Activation Functions | meets the standard, minor gaps | [audit](perceptrons-neurons-activation-functions/visual-foundations-audit.md) |
| Backpropagation & Automatic Differentiation | 1 material gap | [audit](backpropagation-automatic-differentiation/visual-foundations-audit.md) |
| Loss Functions | 2 material gaps | [audit](loss-functions-ce-mse-focal-contrastive-triplet/visual-foundations-audit.md) |
| Batch/Layer/Group/RMS Normalization | 2 material gaps | [audit](batch-layer-group-rms-normalization/visual-foundations-audit.md) |
| Transfer Learning & Fine-Tuning | meets the standard, minor gaps | [audit](transfer-learning-fine-tuning-strategies/visual-foundations-audit.md) |

Every revision-6 view was confirmed numerically correct. The gaps were missing
foundational views elsewhere in the lessons, plus smaller legibility, consistency and
two correctness slips. This increment closes the material gaps and the worthwhile minor
findings as revision 7 for all five topics. Revision 6 stays in each ledger history.

One audit item is declined: Perceptrons LX-6 treated a collapsed in-body checkpoint
explanation as a forbidden reveal gate. The skill allows authored disclosures for
in-body retrieval questions and practice; the prohibition applies to lab prediction and
answer gates. That finding's other half (no picture for the first 3×3 example) is in
scope.

## Protected rollback copies

Revision-6 topic-owned sources are retained in
[original/revision-6/](original/revision-6/revision-6-sources.json) with SHA-256 hashes.
The pre-revision-5 copies in [original/](original/original-sources.json) also remain.

## Working arrangement

- **Topic authors:** one author per lesson owns only that lesson's files. No file is
  shared between the five lessons.
- **Integration owner:** owns the shared components, the ledger, the handoff and this
  record.
- **Review:** each lesson gets an independent review and a closure confirmation, then
  integration checks at 1366, 768, 768@200%, 390 and 320 px.

## Status

Completed 30 September 2026. All five lessons have revision 7 recorded in the central
ledger with both phases complete; revision 6 is preserved in `previousRevisions`.
Each audit's closure confirmation is appended to that lesson's audit file. User
acceptance is separate.

| Lesson | What revision 7 added | Completion record | Audit closure |
| --- | --- | --- | --- |
| Perceptrons | Per-wire weights and phone layer labels on the network; batch-matrix shapes with each W row as one neuron's wires; a training-loop figure with a parameters box; a picture for the first 3×3 example; the "undefined" slope corrected | [record](perceptrons-neurons-activation-functions/visual-foundations-completion.md) | meets the standard |
| Backpropagation | Backward values on the same neuron circuit and on the worked network's wiring (live Forward/Backward switch); one node-shape rule; local-rule strip; Perceptrons links; the "4 comes from the loss" correction | [record](backpropagation-automatic-differentiation/visual-foundations-completion.md) | meets the standard |
| Loss Functions | Shared-encoder anatomy for embedding losses; SimCLR views → encoder → similarity-matrix pipeline; a legible triplet board with ring, margin band and push/pull arrows; loop joins, softmax exponential column, reductions figure | [record](loss-functions-ce-mse-focal-contrastive-triplet/visual-foundations-completion.md) | meets the standard, minor gaps |
| Normalization | Whole-layer anatomy μ → v → s → x̂ → γx̂ + β, each step tagged supplied, computed or learned; live BatchNorm training/evaluation diagram; BN versus LN pooling on one layer | [record](batch-layer-group-rms-normalization/visual-foundations-completion.md) | meets the standard, minor gaps |
| Transfer Learning | Parallel-route markers on phones; LoRA's actual shapes and starting values; one colour meaning for trained and frozen; probe case and named LoRA case in the frozen-gradient figure; pictures for nearest-mean, Yosinski's setup and BN policy | [record](transfer-learning-fine-tuning-strategies/visual-foundations-completion.md) | meets the standard |

## Integration

[visual-foundations-completion-checks.json](visual-foundations-completion-checks.json)
binds the final lesson sources and records:

- **Verifiers:** all nine current topic verifiers pass.
- **Protected receipts:** the revision-5 receipts were protected and are byte-identical.
- **Build and loading:** the production, site-build and repository checks pass, and the
  load-boundary check shows each lesson loads only its own body and static
  dependencies.
- **Browser:** a pass at 1366, 768, 768 with 200% text, 390 and 320 px against the
  unchanged Capsule Networks lesson found no console errors, KaTeX errors, literal tags,
  prediction gates, missing anchors or duplicate ids.
- **Overflow:** the only overflow is the known Backpropagation title at 200% text.

No shared component was changed. Selected images are in
[screenshots/visual-foundations-completion/](screenshots/visual-foundations-completion/).

## Remaining findings (outside this scope or accepted)

- The shared reader title does not wrap an over-wide single word at 200% text
  (Backpropagation).
- Shared `NeuralTable` text does not grow relative to body text at 200% root text.
- SVG diagram labels do not grow with root text size; every value is repeated in HTML
  traces. The auditors accepted this.
- The Normalization membership lab remains tall at 768 with 200% text (accepted).

## Limits

These are independent agent audits with closure confirmations plus expert heuristic
reading, not observed novice testing. Programs, datasets and measured experiments were
reused by exact byte identity.
