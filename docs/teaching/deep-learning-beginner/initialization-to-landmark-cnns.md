# Deep Learning beginner revision: Weight Initialization to Landmark CNNs

## Request and frozen scope

29 September 2026. The user asked for an `improve`-mode, end-to-end revision of the
next five already implemented Deep Learning topics. The goal is beginner access to
researcher-level understanding, with missing buildup repaired at every conceptual
transition. Particular attention goes to **foundational visuals**: the basic object's
anatomy, one traced operation, its composition into the larger system, and a
revealing contrast, per the skill's
[foundational visual coverage](../../../skills/lesson-authoring/references/visuals-and-labs.md#foundational-visual-coverage).

"Next 5" follows the first five topics revised in this module ([record](README.md),
[visual follow-up](visual-foundations.md)). These are catalogue positions 6–10
(Core Concepts, then Convolutional Neural Networks) in
`src/learn/data/track-definitions.js`. The preflight
(`node scripts/build-curriculum-inventory.mjs --topic <id> --work full`) reports each
as revision 4, with content and implementation effectively complete and hashes current.
None was stale or prepared-only, so none was excluded.

| Position | Stable ID | Previous record |
| --- | --- | --- |
| 6 | `weight-initialization-xavier-kaiming-p` | [revision 4 review](../concept-intuition/weight-initialization-xavier-kaiming-p/review.md) |
| 7 | `residual-connections-skip-connections` | [revision 4 review](../concept-intuition/residual-connections-skip-connections/review.md) |
| 8 | `dropout-droppath-stochastic-depth` | [revision 4 review](../concept-intuition/dropout-droppath-stochastic-depth/review.md) |
| 9 | `convolution-pooling-receptive-fields` | [revision 4 review](../concept-intuition/convolution-pooling-receptive-fields/review.md) |
| 10 | `landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet` | [revision 4 review](../concept-intuition/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/review.md) |

Positions 11 onward and other modules are not authorized by this request.

## Protected rollback copies

Topic-owned runtime sources for these five, clean at HEAD when copied, are retained in
[original/](original/original-sources-positions-6-10.json) with SHA-256 hashes, beside
the first five's copies. They are rollback copies, not obsolete drafts.

## Working arrangement

- **Topic owners:** one author per topic owns its lesson body and topic-owned figures,
  labs, CSS, data and topic verifier. Published programs, datasets and measurements
  stay byte-identical unless a real defect is found.
- **Integration owner:** owns the shared components (`LessonElements`,
  `NeuralLessonElements`, `MechanismProgram`, content primitives, reader CSS, styles,
  navigation), the manifest, generated files, the central ledger, the handoff,
  topic notes and this record.
- **Review:** each topic gets a separate independent reading and correctness review,
  then a closure confirmation.
- **Records:** per-topic records live in `<stable-id>/beginner-revision.md` and
  `beginner-review.md` in this directory.

## Status

Completed 29 September 2026. All five topics have revision 5 recorded in the central
ledger with both phases complete; revision 4 is preserved in `previousRevisions`.
User acceptance is separate. No further topic is authorized by this increment.

| Topic | Main foundational gap repaired | Author record | Review and closure | Material findings closed |
| --- | --- | --- | --- | --- |
| Weight initialization | The layer itself was never drawn: fan-in/fan-out, drawn weights and one output's sum, then the stacked forward/backward spread | [revision](weight-initialization-xavier-kaiming-p/beginner-revision.md) | [review](weight-initialization-xavier-kaiming-p/beginner-review.md) | 3 (backward pass used before it was explained; unrepresentative sample draws; single-seed claims) |
| Residual connections | No block diagram: input, branch, identity skip, addition, output; stack and skip-removed contrast | [revision](residual-connections-skip-connections/beginner-revision.md) | [review](residual-connections-skip-connections/beginner-review.md) | 2 (stack contrast taught "skips fix vanishing gradients"; missing scaled-shortcut contrast) |
| Dropout | No network drawn: masked units, dead connections, rescaling, evaluation network, gradients; DropPath on the residual block | [revision](dropout-droppath-stochastic-depth/beginner-revision.md) | [review](dropout-droppath-stochastic-depth/beginner-review.md) | 1 (BatchNorm figure and lab followed different chains) |
| Convolution & pooling | The operation was a text table: kernel on window, products, bias, output cell; channels; pooling; receptive field; full pipeline | [revision](convolution-pooling-receptive-fields/beginner-revision.md) | [review](convolution-pooling-receptive-fields/beginner-review.md) | 3 (feature maps never shown on a real image; program before model in §7; padding/stride used before taught) |
| Landmark architectures | No real blocks: each family's block with layers and shapes, plus a diagram key | [revision](landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/beginner-revision.md) | [review](landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/beginner-review.md) | 4 (parallel branches read as a chain; bottleneck bars; activations hidden inconsistently; conventions contradicted Convolution) |

## Integration

[initialization-to-landmark-cnns-checks.json](initialization-to-landmark-cnns-checks.json)
binds the final lesson sources and records five topic verifiers, the production,
site-build and repository checks, the load-boundary check (each lesson loads only its
own body and static dependencies; Convolution's recorded viewer still loads only near
the viewport), and a browser pass at 1366, 768, 768 with 200% text, 390 and 320 px
against the unchanged Capsule Networks lesson. No shared component was changed.
Selected final images are in
[screenshots/initialization-to-landmark-cnns/](screenshots/initialization-to-landmark-cnns/).

Cross-lesson decisions:

- **Diagram conventions.** Convolution keeps its tensor-level drawing (a square is one
  channel, a stack is C × H × W, an arrow is an operation). Landmark zooms out to
  operation boxes and C × H × W chips, bridged explicitly from Convolution's
  `#cnn-pipeline` on the same DigitCNN step. No operation is coloured amber there.
- **Links.** Dropout's DropPath section links Residual's `#residual-block-anatomy` and
  `#residual-stack` and uses the same part names. Weight Initialization reuses the
  Perceptrons neuron anatomy. Convolution explains its switch from Dropout's
  `[B,C,H,W]` to `[N,C,H,W]`.
- **Sequence.** Each lesson's ending names the next lesson's actual starting problem.
  Transfer → Initialization → Residual → Dropout → Convolution → Landmark → Depthwise
  was read at every boundary.
- **Topic notes.** The Weight Initialization note from Random Matrix Theory is marked
  `adapted`, with links to its implemented section and evidence. No new cross-topic
  notes were raised.
- **Generators.** The old Weight Initialization and Landmark generator scripts now refuse
  to overwrite the directly edited revision-5 lessons.

## Remaining findings (outside this scope)

- The shared `NeuralTable` text does not grow relative to body text at 200% root text.
- The shared reader title does not wrap an over-wide single word at 200% text (carried
  from the first-five increment).

Both need their own presentation review, because the files are bound in many other
current checkpoints.

## Retired checks and retention

Revision-4 verifiers for these topics that rewrite frozen receipts (for example
`verify-weight-initialization-models.mjs`, `verify-initialization-independent.mjs`) and
the older per-topic browser scripts describe revision 4 and were not run. The five topic
verifiers above are the current checks. Temporary captures under `scratch/dl-beginner-6-10/`
were observations and have been removed; retained images supersede them.

## Limits

This is expert heuristic reading plus independent agent review and closure
confirmation, not observed novice testing. Programs, datasets and measured experiments
were reused by exact byte identity; no new training run was made. CUDA and
fresh-environment installation were not tested.
