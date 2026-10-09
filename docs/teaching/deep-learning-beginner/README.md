# Deep Learning: beginner buildup revision

**Latest follow-up, 29 September 2026:** [foundational visual repairs](visual-foundations.md)
add the missing neuron/network anatomy and analogous system-context views across
these five lessons. Revision 6 supersedes the revision-5 presentation below;
earlier numerical executions and original copies remain preserved. Use the
follow-up's source-bound receipt for the current diagrams and browser checks.
The verifiers listed in the earlier integration record bind revision 5; some
write frozen receipts. Inspect destinations before reuse. The follow-up records
the current affected checks and explicitly reuses unchanged scientific evidence.

## Request and frozen scope

28 September 2026. The user asked for an `improve`-mode revision of all previously
improved, implemented topics, addressing missing beginner intuition and buildup
**throughout** each lesson rather than only its introduction, and said to start with
the first five Deep Learning Fundamentals & Architectures topics. This increment is
limited to those five. Later topics are not authorized by it.

Scope was resolved from the live catalogue order (`src/learn/data/track-definitions.js`,
Core Concepts section) and the topic preflight
(`node scripts/build-curriculum-inventory.mjs --topic <id> --work full`). All five are
published, were improved by the 26 September
[concept-by-concept intuition revision](../concept-intuition/README.md) and carry current
revision-4 content and implementation checkpoints whose recorded hashes match the
checkout. No stale or prepared-only record was found among them, so none was excluded.

| Position | Stable ID | Previous record |
| --- | --- | --- |
| 1 | `perceptrons-neurons-activation-functions` | [revision 4 review](../concept-intuition/perceptrons-neurons-activation-functions/review.md) |
| 2 | `backpropagation-automatic-differentiation` | [revision 4 review](../concept-intuition/backpropagation-automatic-differentiation/review.md) |
| 3 | `loss-functions-ce-mse-focal-contrastive-triplet` | [revision 4 review](../concept-intuition/loss-functions-ce-mse-focal-contrastive-triplet/review.md) |
| 4 | `batch-layer-group-rms-normalization` | [revision 4 review](../concept-intuition/batch-layer-group-rms-normalization/review.md) |
| 5 | `transfer-learning-fine-tuning-strategies` | [revision 4 review](../concept-intuition/transfer-learning-fine-tuning-strategies/review.md) |

## Protected rollback copies

The topic-owned runtime sources as they stood at commit `bb6fed84` (clean in the
working tree when copied) are retained under [original/](original/original-sources.json)
with SHA-256 hashes. They are rollback copies, not obsolete drafts; do not remove them.

## Working arrangement

One author owns each topic's lesson body and topic-owned labs, figures, CSS and data.
Shared components (`LessonElements`, `NeuralLessonElements`, `NeuralProgram`,
`MechanismProgram`, `RunnableExample`, content primitives), the publication manifest,
generated navigation/imports, the central ledger and the handoff are owned by the
integration owner. Each topic receives a separate independent reading review before
integration. Per-topic records live in `<stable-id>/beginner-revision.md` in this
directory.

## Status

Completed 29 September 2026. All five topics have revision 5 recorded in the central
ledger with both phases complete; revision 4 is preserved in `previousRevisions`.
User acceptance is separate. No further topic is authorized by this increment.

| Topic | Author record | Independent review and closure | Material findings closed |
| --- | --- | --- | --- |
| Perceptrons | [revision](perceptrons-neurons-activation-functions/beginner-revision.md) | [review](perceptrons-neurons-activation-functions/beginner-review.md) | 2 (§4 code route order; false §6 symmetry claim) |
| Backpropagation | [revision](backpropagation-automatic-differentiation/beginner-revision.md) | [review](backpropagation-automatic-differentiation/beginner-review.md) | 1 (worked network wiring/parameters hidden) |
| Loss functions | [revision](loss-functions-ce-mse-focal-contrastive-triplet/beginner-revision.md) | [review](loss-functions-ce-mse-focal-contrastive-triplet/beginner-review.md) | 3 (false push comparison; SimCLR masks; CPC bound) |
| Normalization | [revision](batch-layer-group-rms-normalization/beginner-revision.md) | [review](batch-layer-group-rms-normalization/beginner-review.md) | 2 (gradient routes unexplained; γ/β indexing) |
| Transfer learning | [revision](transfer-learning-fine-tuning-strategies/beginner-revision.md) | [review](transfer-learning-fine-tuning-strategies/beginner-review.md) | 3 (lab ahead of concepts; evidence step; overstated cause) |

Each reviewer confirmed closure against the corrected source; small issues raised
during confirmation were fixed and are listed in each author record.

## Integration

[integration-checks.json](integration-checks.json) binds the final lesson sources and
records the checks: five topic verifiers, production and site-build checks, the
load-boundary check (each lesson loads only its own body and static dependencies),
and a browser pass at 1366, 768, 768 with 200% text, 390 and 320 px against an
unchanged control lesson. The integration pass found and closed a KaTeX error in Loss
Functions and figure overflow under 200% text in four lessons. It made one shared
tooling edit: the load-boundary checker now resolves Vite `?url` imports. Selected
final images are in [screenshots/](screenshots/).

One finding remains outside this increment's scope. At 768px with 200% text the
Backpropagation page scrolls 41px sideways because the shared reader title's single
word "Backpropagation" is wider than its box; the title is unchanged from before the
revision. `overflow-wrap: break-word` on `.reader-header h1` in
`src/learn/learning-base.css` removes it without changing titles that fit, but that
file is bound in 76 other current checkpoints, so it needs its own presentation
review. It was tested and reverted.

Cross-lesson continuity was checked at each boundary. Perceptrons ends on Backprop's
opening example; Backprop hands "p − target" to Loss Functions; Loss Functions and
Normalization point forward; Normalization's BatchNorm state/mode material is used
by Transfer Learning. Loss Functions and Normalization now use the existing neutral
lab surfaces instead of the teal-tinted shared default.

## Retired checks

The revision-4 intuition verifiers (`verify-perceptron-intuition.mjs`,
`verify-backprop-intuition.mjs`, `verify-loss-intuition.mjs`,
`verify-normalization-intuition.mjs`, `verify-transfer-intuition.mjs`) rewrite their
frozen revision-4 receipts and must not be run against revision 5. The shared
`verify-loss-normalization-*` and older per-topic browser/model scripts check
revision-4 source bindings and are historical. The five topic verifiers named in
the earlier integration record bind revision 5; the follow-up above owns the
current affected checks and reuse decisions.

## Retention

Author and reviewer records name temporary captures under
`scratch/deep-learning-beginner/`. Those were real observations and have been
removed after the final pass; the retained images here and in
`batch-layer-group-rms-normalization/screenshots/` supersede them for current
rendering. The protected [original/](original/original-sources.json) copies stay.

## Limits

This is expert heuristic reading plus independent agent review, not observed novice
testing. Unchanged programs, datasets and measured experiments were reused by exact
byte identity. The new Transfer Learning feature-inspection program was executed in
the tested CPU environment. CUDA and fresh-environment installation were not tested.
