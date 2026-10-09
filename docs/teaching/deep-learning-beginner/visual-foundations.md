# Foundational visual follow-up — first five DL lessons

29 September 2026. The user's reading exposed a gap after revision 5: a neuron
lesson contained templates, curves and labs but no explicit neuron anatomy or
connected-neuron schematic. This repair covers the same five lessons, throughout
their relevant conceptual transitions. It does not certify the rest of the site.

## What changed and why

| Lesson | Missing teaching job | Repair and retained depth |
| --- | --- | --- |
| Perceptrons, Neurons & Activation Functions | Locate inputs, connection weights, bias, sum and activation inside one neuron; then recognize that same object inside a network. | `#neuron-anatomy` maps the two-input equation to actual wires and operations, with live input/bias/activation controls. `#neuron-network-wiring` shows the exact two-hidden-neuron XOR construction, all weights/biases, live inputs, and ReLU versus identity with all four binary cases. Pixel investigation follows the anatomy; contribution bars, ramps, hidden-space geometry, activation curves, programs and deeper sections stay. |
| Backpropagation & Automatic Differentiation | The first example's equation had no literal operator wiring; local reverse rules lacked a matching operation view. | `neuron-computation` traces x/w/b through multiplication, addition and ReLU to the separate target/loss. `multiply-pullback` locates incoming sensitivity and its two local products. Existing network, branching, matrix, numerical and advanced diagrams remain. |
| Loss Functions | Locate the target branch, loss and backward/update path around the predictor. | `loss-training-loop` now connects forward prediction, target subtraction, penalty, reverse derivatives and the parameter update. Its curve and all objective-specific labs remain. The opening no longer requires every loss to be smooth. |
| Normalization | Locate shared statistics and normalization in the network instead of meeting them only as calculations. | `normalization-in-network` follows the same four labelled examples from weighted sums through shared statistics and tanh to the next layer. Prose connects the later learned scale/shift. Existing tensor-group, geometry, gradient-route and residual-path views remain. |
| Transfer Learning | Distinguish copying parameters from forward flow; see frozen-layer backward routing and the branch/rejoin structure of adaptation. | Four views show backbone/head boundaries, frozen-weight backward flow, LoRA's parallel base/correction paths and the adapter's nonlinear detour/bypass/addition. Narrow screens reflow the parallel routes with explicit shared-input labels. All code, experiments and live strategy labs remain. |

The neuron audit also corrected a §6 claim: its XOR construction already has
different hidden biases, so differing outgoing weights are not its only source of
asymmetry. The replacement distinguishes identical paths under matched optimizer
state from paths whose different downstream roles can give different updates.

## Teaching research and review

- [Stanford CS231n: neural networks](https://cs231n.github.io/neural-networks-1/)
  was consulted for the neuron-to-network visual correspondence and the affine
  composition argument. Historical activation recommendations were not copied.
- [3Blue1Brown's creator-hosted neural-network lesson](https://www.3blue1brown.com/lessons/neural-networks/)
  was consulted as a visual teaching reference. No new claim of watching its video
  is made. Original diagrams use this lesson's own worked examples and conventions.
- Each topic author read its complete lesson, then changed only the representations
  and explanations that lacked a basic structural reference. Existing per-topic
  `beginner-review.md` files contain the scoped author follow-ups, distinct from the
  earlier independent reviews.
- A separate agent reviewed the neuron additions' arithmetic, first-use ordering,
  threshold convention and parameter counts. The root reviewed the other authors'
  changed computations/diagrams and inspected their rendered views. This is expert
  heuristic review, not observed beginner testing.
- Review caught compact bias/wire intersections, an inaccurate “dashed arrows”
  legend, and cramped parallel routes. The final versions separate bias input,
  describe dashed-outline stages accurately and reflow narrow diagrams.

The skill now requires a concrete foundational coverage decision in the concept
map: anatomy, one traced operation, composition and a revealing comparison when
applicable. It requires examining useful canonical figures, mapping them to the
lesson's teaching jobs, and checking the rendered parts-to-equation correspondence.
A lab count is not evidence of those foundations. This applies to content-only
visual specifications as well as implementation and review; it does not prescribe
neuron diagrams or four figures for every subject.

## Evidence and boundaries

[Selected final views](screenshots/visual-foundations/) retain representative
desktop and mobile evidence. Temporary capture overlays are not part of the lesson;
the retained neuron close-ups show only the actual circuit drawing.

[visual-foundations-checks.json](visual-foundations-checks.json) is the current
source-bound follow-up receipt. The revision-5 `integration-checks.json` and
`author-checks.json` files are preserved executions, not rewritten as new runs.
The ledger keeps revision 5 in each topic's history and tracks this revision's two
phases separately. Scientific code and measurements are reused only where their
hashes match; newly added arithmetic and changed claims receive their own checks.

The follow-up checks cover all ten changed representations at 1366, 768, 390 and
320 pixels, increased text at 768, current neuron controls, browser errors, scoped
loading, production build, repository trackability and skill validity. The existing
Backpropagation page-title overflow at 200% text remains outside this diagram
repair; the new diagrams themselves do not overflow. No CUDA or fresh environment
installation was needed for these additions.

No new lesson queue is opened. Preserve the protected original copies, prepared
unimplemented content and useful prior evidence. Disposable follow-up captures and
working scripts can be removed after the receipt and selected final images are
retained.
