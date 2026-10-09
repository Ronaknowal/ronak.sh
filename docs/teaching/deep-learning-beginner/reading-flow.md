# Deep Learning reading-flow revision: positions 1–10

## Request and scope

3 October 2026. After the foundational-visual work, the user reviewed the first ten
Deep Learning lessons and asked for smoother teaching and presentation:

- **Picture first.** Diagrams usually come above the explanation of what is happening.
- **No jumps.** Nothing is assumed before it is taught; each part connects to and
  references what came before.
- **Intuitive diagrams.** Visuals explain every detail of what they show.
- **No separate boxes.** Figures and labs should not sit in distinctive boxes that feel
  apart from the teaching.
- **Simpler labs.** Labs have only the controls they need and feel part of one
  consistent flow.

They asked to update all ten lessons and the skill accordingly, but not to add a
reading-length budget to the skill. Depth is kept; the work removes repetition and
restructures order and presentation.

| Position | Stable ID | Revision before this work |
| --- | --- | --- |
| 1 | `perceptrons-neurons-activation-functions` | 7 |
| 2 | `backpropagation-automatic-differentiation` | 7 |
| 3 | `loss-functions-ce-mse-focal-contrastive-triplet` | 7 |
| 4 | `batch-layer-group-rms-normalization` | 7 |
| 5 | `transfer-learning-fine-tuning-strategies` | 7 |
| 6 | `weight-initialization-xavier-kaiming-p` | 5 |
| 7 | `residual-connections-skip-connections` | 5 |
| 8 | `dropout-droppath-stochastic-depth` | 5 |
| 9 | `convolution-pooling-receptive-fields` | 5 |
| 10 | `landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet` | 5 |

## Shared decisions

- **Skill:** the skill now carries the user's rules:
  - [figures and labs belong to the reading flow](../../../skills/lesson-authoring/references/visuals-and-labs.md#figures-and-labs-belong-to-the-reading-flow);
  - [keep the reading continuous](../../../skills/lesson-authoring/references/teaching.md#keep-the-reading-continuous);
  - checklist items 11–12 in the review reference;
  - a failure-mode list and a design review before implementation in `SKILL.md`;
  - practical tooling notes in the repository adapter.
- **Shared presentation style:** `src/learn/components/lesson-labs/lesson-flow.css` is new
  and opt-in through the lesson root class `lesson-flow`. Lessons that do not opt in are
  unaffected, and no existing shared file changed.
- **Module visual vocabulary:** [visual-vocabulary.md](visual-vocabulary.md) fixes colour
  meanings, shapes, arrows and notation for every lesson in the module.

## Rollback

Every lesson's topic-owned sources before this work are copied with hashes in
[original/before-reading-flow/](original/before-reading-flow/sources.json). Earlier
rollback copies remain.

## Working arrangement

Perceptrons is revised first as a pilot. The integration owner inspects it and
adjusts the shared style and vocabulary before the other nine are revised in parallel.
Each lesson then gets an independent reading-flow review, a closure confirmation and
integration checks. Per-topic records are `<stable-id>/reading-flow-revision.md`.

## Status

The pilot was inspected by the integration owner and approved. Its shared proposals were
applied: `LessonFlow.jsx` (FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout,
FlowCheck, flowNumber), `:where` defaults and column collapse in `lesson-flow.css`, and
plot / class-label rules in the vocabulary.

Completed 4 October 2026. All ten lessons have their reading-flow revision recorded in the central ledger:
revision 8 for positions 1–5 and revision 6 for positions 6–10, with both phases complete and every
earlier revision preserved in `previousRevisions`. Each lesson had an independent reading-flow review and a
confirmed closure; the review and its closure confirmation are in `<stable-id>/reading-flow-review.md`.
User acceptance is separate. The previous session ended twice mid-work; replacement agents resumed from
on-disk state and nothing was lost.

| Lesson | Review verdict before fixes | Closure |
| --- | --- | --- |
| Perceptrons | 1 material (unreachable bias switch), 17 minor | confirmed |
| Backpropagation | 1 moderate (lab before its question), 13 minor; closure found a log-axis label bug, fixed | confirmed |
| Loss Functions | 2 moderate (clipped mask table; loss before margin), 13 minor | confirmed |
| Normalization | 1 moderate (300-line program before its network), 16 minor | confirmed |
| Transfer Learning | 1 material (freeze lab showed a zero gradient while claiming one), 20 minor, record gaps | confirmed |
| Weight Initialization | 1 moderate (μP lab could read as μP failing), 14 minor | confirmed |
| Residual Connections | 4 moderate, 18 minor | confirmed |
| Dropout | 3 moderate, 12 minor | confirmed |
| Convolution | 1 material (false readout at the check question), 10 minor | confirmed |
| Landmark Architectures | 9 minor | confirmed |

## Integration

[reading-flow-checks.json](reading-flow-checks.json) binds the final sources and records:

- **Verifiers:** all twelve topic verifiers pass. Frozen receipts were backed up and byte-compared; the
  one overwritten was restored.
- **Build:** the production, site-build and repository checks pass.
- **Loading:** each lesson still loads only its own body.
- **Browser:** a pass at 1366, 768, 768 with 200% text, 390 and 320 px found no framed figures or labs, no
  banners, every √ visible and no errors. The only overflow is the known shared-title word at 200%. The
  unchanged control lesson still shows its frames, which confirms the check.

Selected images are in [screenshots/reading-flow/](screenshots/reading-flow/).

## Remaining findings (outside this scope)

- **Inline maths:** the shared `Math.jsx` fixes it at 13px, so it does not grow with 200% text. Four
  reviewers raised this.
- **Title wrap:** the shared reader title does not wrap an over-wide single word.
- **Tables:** shared `NeuralTable` text does not scale at 200%.
- **Diagram labels:** SVG labels do not grow with root text size; the values are repeated in HTML.
- **Dropout:** §7's source-299 digit needs a rerun of the measurement program.

Shared changes since the pilot:
- `FlowReadout` passes attributes through.
- `lesson-flow.css` stops nested figures becoming zero-width size containers.
- The vocabulary has new rulings: probabilities are violet; distinct plot-series colours;
  ⊙ in equations and ⊗ in diagrams; prose that survives stacking.
