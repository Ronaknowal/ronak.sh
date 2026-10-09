# Deep Learning module: visual vocabulary and reading-flow contract

Applies to every Deep Learning Fundamentals & Architectures lesson revised for reading
flow. It turns the conflicts found in earlier revisions (amber meaning three things,
circles meaning different things, colour meanings flipping between figures) into one
rule set. Authors follow it; reviewers check against it. Change it here, deliberately,
not lesson by lesson.

## Reading flow

- Order inside a section: question → one-line lead naming what to look at → figure →
  walk-through of its labelled parts → name / equation → code → changed case.
- Figures and labs carry no card frame, banner or separate heading. Lessons opt into
  the shared style with root class `lesson-flow` and
  `import './lesson-flow.css'` (file `src/learn/components/lesson-labs/lesson-flow.css`).
- Lab controls: one compact `.flow-controls` row directly under the visual, usually one
  to three controls, each acting on something just taught. Live result in a
  `.flow-readout` sentence. No eyebrow, preset wall or mode selector for later ideas.
- Build labs from the shared components in `src/learn/components/lesson-labs/LessonFlow.jsx`:
  `FlowLab`, `FlowControls`, `FlowSlider` (one slider with its value shown, no duplicate
  number box), `FlowChoice` (a small button group), `FlowReadout`, `FlowCheck` (a check
  question as a sentence with an answer disclosure) and `flowNumber` (true minus signs).
  Use `.flow-columns-2` / `.flow-columns-3` for side-by-side panels; they stack by
  container width so 200% text does not overflow.
- Practice, code blocks and the shared opening/ending keep their own framing.
- Lesson CSS that styles or sizes `svg` elements must be scoped to the lesson's own
  figure drawings and must exclude KaTeX (`.katex svg`): a broad `svg` rule hid the
  square-root signs in rendered equations. Reviewers check that every √ in the source
  renders.

## Colour meaning in structure diagrams

| Meaning | Colour and mark |
| --- | --- |
| Supplied data and inputs (pixels, features, incoming activations from a previous layer) | cyan outline and label |
| Learned parameters (weights, biases, kernels, γ/β, adapter and LoRA factors) | amber |
| Computed values (scores z, activations, statistics μ/σ, probabilities, embeddings) | violet |
| Operations (sum, multiply, activation, normalize, softmax, add, concatenate) | neutral white outline, operation written inside |
| Forward flow | neutral grey solid arrow |
| Backward flow and gradients | orange dashed arrow; gradient values in orange |
| Frozen parameters | grey fill or outline, labelled "frozen" |
| Added and trainable parameters in a frozen network | amber with a dashed outline, labelled "trained" |
| Dropped or masked units and paths | dimmed, dashed outline, marked × |
| Currently selected or traced element | thick white outline plus a text marker, never colour alone |

## Colour meaning in value grids (feature maps, matrices, heat maps)

Positive values use a warm amber fill, negative values blue, zero neutral; every cell
shows its number. When a figure shows both structure and a value grid, state once which
rule each part uses.

## Colour meaning in plots

Each curve or series has its own colour and is labelled directly on the plot, next to
the line, rather than in a separate legend. A given function keeps the same colour in
every plot of the lesson (for example, ReLU in every activation plot). Binary class
labels follow the sign rule: +1 amber, −1 blue.

In plots, the series rule takes precedence over the structure-diagram role colours: two
computed curves on one plot (for example two hidden ramps and their total) get distinct,
labelled colours rather than all being violet. A total or result curve may be drawn
thicker than its parts.

Probabilities and other computed shares (softmax outputs, attention weights) are computed
values: violet, not amber.

## Shapes and arrows

- Circles are values (an input, a neuron's output, a node in a computational graph);
  rounded rectangles are operations or layers. State this once in the first lesson and
  keep it.
- A neuron is drawn the same way everywhere it recurs: inputs on the left, weights on
  the wires, Σ + b, then activation, then output on the right
  (Perceptrons `#neuron-anatomy`). A network uses the same drawing at smaller scale
  (`#neuron-network-wiring`).
- Data flows left to right in neuron and graph drawings and top to bottom in
  architecture block diagrams. Each figure says which once, in its lead sentence.
  Exception: a step-by-step computation circuit (such as Backpropagation's one-neuron
  circuit) may run top to bottom when that keeps its labels legible in the reading
  column. Its lead sentence must say so, and prose must never call it "left to right".
- Merges in block diagrams: ⊕ add, ‖ concatenate along channels, ⊗ multiply by a gate.
  In equations, elementwise multiplication is written ⊙ (standard notation); a block
  diagram that draws an elementwise product uses ⊗ and its walk-through says it is the
  ⊙ of the equation.
- Words like "left" and "right" in prose must also be true when figures stack on phones;
  prefer names or labels ("the template panel", "panel B").

## Notation

| Symbol | Meaning |
| --- | --- |
| x | an input vector, or one input value with index xᵢ |
| X | a batch with rows as examples, shape (N, d) |
| N | number of examples in a batch (not B) |
| W, b | a layer's weights, shape (outputs, inputs) as in PyTorch `nn.Linear`, and bias |
| z | a preactivation (score before activation) |
| a, h | an activation; h for a hidden layer's activation vector |
| φ | an activation function |
| p, y | predicted probabilities and the target |
| L | a loss for one example; mean loss over a batch is stated explicitly |
| θ | all learned parameters |
| g, ∂L/∂· | gradients |

Image tensors are (N, C, H, W). A lesson that must use another convention states the
switch where it happens and maps the old symbols to the new ones.
