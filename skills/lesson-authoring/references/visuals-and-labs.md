# Visuals And Labs

Part of [$lesson-authoring](../SKILL.md). Repository paths below are relative to the selected application checkout; see [the repository adapter](portfolio-adapter.md). Load only the sections needed for the selected mode.

- [5. Visuals and labs: no fixed count](#5-visuals-and-labs-no-fixed-count)
- [Let the concept determine the visual form](#let-the-concept-determine-the-visual-form)
- [Colour carries conceptual meaning](#colour-carries-conceptual-meaning)
- [Inline diagrams are part of the explanation](#inline-diagrams-are-part-of-the-explanation)
- [Foundational visual coverage](#foundational-visual-coverage)
- [Choose the representation for the hurdle](#choose-the-representation-for-the-hurdle)
- [Graphs and simulations need traceable evidence](#graphs-and-simulations-need-traceable-evidence)
- [Visual layout is a separate completion check](#visual-layout-is-a-separate-completion-check)

## 5. Visuals and labs: no fixed count

**There is no requirement for exactly one lab, at least one lab, or a maximum number of labs per lesson.** Support every major conceptual hurdle using the representation that teaches it best. Several small labs and diagrams are appropriate when a topic contains several distinct mechanisms. A clear static diagram may fully explain a relationship without interaction.

### Let the concept determine the visual form

Keep the learning philosophy, accessibility, navigation and control behavior dependable across the site. Choose the illustration's geometry, visual vocabulary, terminology and interactions for the specific concept and learner question, including different choices within one lesson. Consistency does not require every topic to use the same lab arrangement, text panel, slider or stepper. Variation has no quota either: reuse a familiar representation when it still exposes the mechanism well.

Before choosing a component, identify the actual objects, relationships and operations the learner needs to understand, and what is hard to see in prose or code. Choose the form that makes those features inspectable. Use the subject's useful conventional representations and terms, introducing their plain meaning and visual legend first. For example, token boundaries and pair merges suggest symbol strips; reference sharing suggests names, objects and arrows; concurrent execution suggests separate lanes and synchronization points. Changing a panel's title or colors does not adapt it to a different mechanism. An existing table or text trace remains appropriate when the task is best understood that way.

For an interactive lab, let the learner act on meaningful entities or parameters and see the corresponding transformation. A tokenization trainer can connect an editable corpus, the selected pair, its frequency, changed word segmentations and merge history. A guided trace and an open investigation can serve different purposes in the same lesson. This is a reference for designing around a topic's operations, not a required layout or an endorsement of every detail in the existing BPE implementation.

Keep connected views consistent with the same model state. Make it clear when edited input is applied; labels, counts, highlights and outputs must describe the active state. Use controls named for the action when helpful, such as merging a pair or advancing one instruction. Do not require unrestricted editing, animation or a full simulator when a smaller investigation teaches the question. Share useful controls and rendering primitives, but adapt or build a representation when the available generic panel obscures the concept. Record the learning reason for that choice in the brief; novelty alone is not a reason.

### Colour carries conceptual meaning

Use colour to reveal the relationships a learner needs to follow. Preserve useful colour correspondence when simplifying a diagram; cleaner composition does not mean monochrome marks or uniformly muted hues. Keep the project's surfaces and controls consistent, and use its permitted semantic colours on the actual data marks. Neutral surrounding structure helps those distinctions remain visible.

Choose what colour means before choosing hues: **identity, group membership, role, state or magnitude**. When the question is correspondence, the same entity keeps its hue as it moves between input, intermediate and output views. A broad input/learned/computed palette is useful when those roles are the question; it obscures the mechanism when the learner must distinguish several pieces, channels, classes or branches within one role. Labels and grouping can explain roles while hue follows identity. A new merged entity may receive a new hue; show its labelled inputs so the change has an understandable cause.

Adapt the encoding to the concept. These are useful patterns, not required layouts or one universal palette:

| Topic or visual task | What colour helps the learner follow |
| --- | --- |
| Tokens, text and byte sequences | Repeated pieces through segmentation, dictionary lookup and ID rows; a glyph group through its scalars and bytes. Keep boundaries and literal labels visible. Explain when hues follow byte values instead of glyph groups. |
| Data structures, graphs and references | The same item or object across array, list, tree and reference views; aliases point to the same coloured object. Use a separate outline or arrow style for the active operation or traversal state. |
| Neural networks, tensors and attention | Corresponding channels, heads, branches or slices across grids and transformations. Preserve labelled contributions through concatenation or combination. If cell fill encodes attention weight or activation magnitude, show identity with labels, borders or aligned axes instead. |
| Mathematics and linear algebra | A vector, operand or contribution across an expression, geometric picture and matching matrix row/column. Distinguish the contributions being compared; use a declared quantitative scale when colour instead represents sign or magnitude. |
| Statistics and machine learning | Class or category identity across samples, decision regions and result labels; method or dataset identity across comparable plots. Probabilities, densities and uncertainty need their own labelled scales rather than arbitrary category hues. |
| Systems, programming and concurrency | A process, resource, message or object across lanes, events and state transitions. Mark blocked/running/error state separately when the reader still needs to track its identity. |
| Grouping, allocation and comparisons | A source group, corpus, language or series through membership, counts, shares and outcomes. Keep the reference clearly identified; a neutral baseline can reduce competition with the coloured comparison. |

- **Make the important distinctions visible.** Use a small readable set of hues, with enough contrast between the entities the worked example actually contrasts. Choose those key mappings deliberately; a hash or palette index is not a substitute for inspecting them. Dense views may colour groups or a few traced items instead of assigning every cell a different hue. Repeated palette colours do not imply identical IDs, similarity, rank or quality; literal labels remain authoritative.
- **Keep correspondence stable.** Bind hues to the represented identity or category rather than its current array position. Reordering, filtering, stepping and reset should preserve that mapping where the identity is unchanged. When a transformation changes identities or groups, show and explain the new correspondence. Follow the module's declared meanings across connected views; introduce a different encoding explicitly when the question changes.
- **Separate identity from interaction and state.** An active pair, selected row or current edge can use an outline, underline, line weight or pattern without replacing its identity hue. Keep keyboard focus identifiable. Missing, disabled and error states need explicit labels and appropriate shapes or patterns; colour alone cannot communicate them.
- **Treat quantities as quantities.** Use a labelled sequential scale for ordered magnitudes, or a diverging scale around a meaningful reference such as zero. Keep comparable views on the same declared scale and retain values where exact inspection matters. Category hues do not encode numeric distance, and an attractive colour ramp supplies no evidence for the values.
- **Explain and inspect the encoding.** Label marks at first use; add a compact legend or nearby explanation when the mapping cannot be labelled directly. Check actual painted HTML/SVG marks and text, not just palette declarations: inherited styles can break correspondence. Inspect desktop, phone and relevant edited/selected/null states, including whether the diagram remains understandable without distinguishing hues. Repair demonstrated mapping or legibility failures rather than starting an unrelated redesign.

### Inline diagrams are part of the explanation

Plan visual support throughout the reading flow, including compact, immediately visible diagrams between paragraphs. Do not treat completing the interactive labs as completing visual teaching. An inline diagram helps the learner see a structure, correspondence, contrast or transformation while reading; an interactive investigation helps them explore how it changes. Use either or both when their teaching jobs warrant it.

The user's tokenization comparison is a useful presentation reference: the same input is shown as character units, an unknown-word result and subword units in three labelled rows. Boundaries and contrasting representations are visible without operating a control. Reference this visual pattern, not the surrounding page as a blanket accuracy endorsement or a compulsory token-chip style for every subject.

For a new concept, ask whether the reader currently has to assemble its relationships mentally from prose or code. When a picture would make those relationships materially clearer, place it at that point in the explanation. Useful forms include aligned before/after states, labelled values or cells, reference arrows, nested ownership, branching control flow, data transformations, miniature timelines and same-input comparisons. Introduce the objects and labels before asking the learner to manipulate them. Connect the picture to the exact example and explain what to notice in a short caption or nearby sentence.

A static diagram's design contract is its learner question, concrete example/state, meaningful visual encoding, placement, interpretation and limits. Verify its labels, values, arrows and correspondences against the example. Controls, step/reset behavior and simulated state are additional requirements only when the diagram is interactive. Prefer the representation the concept needs; there is no requirement for SVG, animation, a full lab panel or a particular renderer. The existing React/HTML/CSS/SVG approach supports these figures.

Review the lesson in ordinary reading order without operating every lab. Check that important structures and contrasts are visible where introduced, and that their meaning does not depend on reconstructing several code blocks or discovering a later lab state. A useful, already visible lab illustration can satisfy this need; do not duplicate it automatically. Record any substantive visual gap and its proposed placement. Counts of labs, code examples, tables or colored boxes are not evidence that this reading pass succeeds. Keep tables when they explain a comparison well, and omit diagrams that merely decorate or restate a clear sentence.

Use consistent labels and purposeful colour to track identity or correspondence, with text/position/shape cues as well as colour. Restraint applies to competing emphasis and decoration, not to removing useful distinctions. Preserve readable labels, correct grouping and logical order on narrow screens. A row of boxes containing paragraph summaries is not a mechanism diagram unless its arrangement actually reveals the relationship being taught.

### Foundational visual coverage

Before selecting sophisticated plots or labs, identify the basic object the learner
must be able to picture. Inspect the canonical teaching reference's actual figures,
not only its section list. Which views establish its parts, connections, operation
and composition? Compare those teaching jobs with the current lesson; adopt or
improve the useful representation in original wording and graphics. Do not copy a
source's errors or dated recommendations. A familiar view may be the clearest one.

For a structural or computational object, make these correspondences visible at
the relevant first use:

- **Anatomy:** label the actual parts, inputs, parameters, intermediate values and
  outputs. A plot of behavior does not show where those parts are.
- **Operation:** trace a small complete case through the connections. Map the
  labels and numbers to the equation and later to code; explain arrow direction,
  grouping and what is computed versus learned or supplied.
- **Composition:** show how the object connects to other objects when the lesson
  first builds the larger system. Reuse labels and expose where an operation sits;
  do not require the learner to infer the structure from a matrix or API call.
- **Contrast:** when a component's purpose is unclear, hold the surrounding system
  fixed and show what changes when it is removed, replaced or adjusted. Include a
  case that actually reveals its effect, and explain cases with no change.

These are learning questions, not four compulsory diagrams. One well-designed
view may answer several; a topic without a composite object needs a different
representation. Document each applicable job's actual figure/section or why an
existing alternative is equally legible. In content-only mode, write the concrete
labels, example values, layout, placement and interpretation into the visual spec.
Do not defer discovery of the basic representation to phase two.

For example, a neuron introduction needs the incoming inputs, weighted connections,
bias, sum, activation and output explicitly mapped to `z = Σwᵢxᵢ + b`, `a = φ(z)`;
then the same unit inside a network, showing hidden versus output roles. Activation
curves, pixel templates and tables add valuable views but do not by themselves
supply that anatomy or network wiring. A normalization lesson may instead need
tensor groups and its insertion in a computation; a heap needs parent/child
structure and its array correspondence. Choose the subject's form, not a generic
series of prose cards.

At review, ask the reader to point to each named part and trace one example using
only what is already visible in reading order. Check the same at later structural
transitions. Missing basic anatomy/composition is a material teaching gap even if
the lesson has many working labs and passes every numerical test. Place the repair
beside the concept, not in an appendix or behind a disclosure.

### Figures and labs belong to the reading flow

A figure or lab is a paragraph of the explanation drawn as a picture, not an insert
the reader has to visit and come back from. The user found that boxed figures with
their own titles, eyebrow banners and control panels made revised lessons feel like a
sequence of separate cards. Present every teaching visual so the page reads as one
continuous explanation:

- **Picture first, then the walk-through.** Within a section the usual order is: the
  question in one or two sentences → a one-line lead naming what to look at → the
  figure → prose that walks through its labelled parts in the order the eye follows
  them → the name, equation or rule → code → a changed case. Do not describe a
  structure in several paragraphs and show it afterwards. A figure may come later
  only when the reader must first meet a value it displays.
- **No card chrome.** Draw figures on the page background at reading width, without
  a border, filled panel, separate heading or "figure" banner. Replace a bold figure
  title with the lead sentence before it; put interpretation in ordinary prose after
  it. Keep visible framing only for code blocks, practice (exercises, hints,
  solutions) and the shared opening/ending components. A short in-body check
  question is a plain sentence plus its answer disclosure, not a styled card.
- **A figure is a drawing, not formatted text.** Show the objects in space: tensors
  as grids or stacked slabs whose sizes are drawn to scale, a kernel placed on the
  cells it reads, widths that visibly grow and shrink, branches side by side,
  connections as drawn lines, matrices as cell grids or heat maps, spectra as bars.
  A column of sentences in bordered boxes joined by "↓" arrows is prose with
  decoration; it does not count as the figure for a concept, however well it is
  labelled. Use 1D strips to make arithmetic readable, but also draw the real
  object (for images, channels × height × width) at least once so the reader sees
  what the strips abbreviate. When the field has a canonical picture of the idea
  (the figure every textbook or the original paper draws), draw your own version
  of it unless there is a recorded reason not to.
- **Self-explaining drawings.** Label every part, value, arrow and colour where it
  appears, at its first use, so the reader never has to decode a symbol from a
  legend or remember it from an earlier section. Use a legend only when labels
  genuinely cannot fit. Show one idea per figure; build a complex structure in
  successive figures that each add one part, reusing the same layout so the new
  part is the only change. Keep shapes, colours, arrow styles and positions
  consistent with the module's visual vocabulary.
- **Labs are figures that respond.** Put the controls directly under the visual they
  change, as one compact row, and state the lab's question in the prose just before
  it. Offer only the controls that answer that question: usually one to three, each
  acting on something the prose has just taught. Drop decorative presets, duplicate
  numeric and slider inputs, mode selectors for ideas taught later, and tables that
  repeat what the drawing already shows. Report the result as one live sentence or a
  small labelled readout beside the visual, and say what to try next in the
  following prose. Split a crowded lab into separate small figures placed where each
  question arises. No banner, eyebrow or panel styling distinguishes a lab from the
  surrounding text.
- **Consistency across the module.** One drawing of the same object (a neuron, a
  layer, a block) recurs everywhere it is used, with the same labels and colours, so
  a returning reader recognises it. Each module keeps a short visual vocabulary
  (colour meanings, node shapes, arrow styles for forward and backward, notation)
  in its repository record; authors follow it and reviewers check against it.
  That vocabulary records stable meanings and how local encodings are introduced;
  it does not require all channels, classes or pieces to share one role hue.

### Choose the representation for the hurdle

| What the learner needs to understand | Useful representation |
| --- | --- |
| Identity, containment, shared references | Labeled objects and connecting arrows; distinguish a name from the object it refers to. |
| A changing process or hidden state | Stepped execution with the current instruction, before/after state, and changed items highlighted. |
| A parameter's effect | A focused experiment with a labeled control, comparable outputs, and an explanation of the change. |
| Distributions and uncertainty | Meaningful axes, reference lines, correctly shaded probability areas, and repeated samples where relevant. |
| Shapes, broadcasting, reductions | Aligned dimensions, labeled row/column/cell correspondence, and an explicit resulting shape. |
| Joins and grouping | Trace source rows into result rows; show unmatched records, multiplicity, and aggregation. |
| Data or control movement | Directed flows with labeled inputs, outputs, order, and failure paths. |
| Competing methods | Same-input comparisons with assumptions, outcome differences, and when to choose each. |
| Exact values or accessible inspection | Tables alongside the conceptual representation. Tables are sometimes the primary representation, especially for tabular data. |

For every lab, specify a short teaching contract:

- **Question:** what particular uncertainty should this resolve for the learner?
- **Starting point:** what entities and initial state are shown, and what must the learner already know?
- **Live starting result:** what useful output and intermediate state are visible before any interaction?
- **Control:** what changes and what is deliberately held fixed?
- **Visible consequence:** which states, correspondences, or quantities change and why?
- **Check:** what observation or follow-up task would show understanding?
- **Boundary:** what is simulated, simplified, fixed, unsupported, or outside the model?
- **Fixture check:** which alternative settings were run to confirm that the chosen data actually exhibit the contrast the surrounding prose promises, and which null case shows the contrast is absent when it should be?

Implement the interaction as **manipulate → observe live → explain the mechanism → compare → decide → transfer**. Start with a useful preset and its complete current result. Use sliders, keyboard-accessible direct manipulation, cell edits, switches or other controls appropriate to the topic. Prefer changing one meaningful factor at a time, with visible intermediate effects and synchronized final outputs. Offer before/after comparison or a pinned baseline when that clarifies a tradeoff, plus meaningful reset/back controls. Explain unchanged results as well as changed ones. If a simulation has randomness, keep the seed fixed during parameter comparisons and make drawing fresh data a separate explicit action.

**Do not include a prediction feature in a lab, even optionally.** No predicted-answer field, prediction choices, commitment step, correctness score, answer masking or “Check prediction” reveal. Remove those states and misleading instructions when updating older work; merely making the old gate optional is insufficient. Independent practice with hints and worked solutions may remain separate from exploration. Model predictions, attention gates and train/test masking are subject matter and are unaffected by this interaction rule.

Step, play/pause and bounded run controls remain useful for a process whose intermediate states matter. They advance the actual algorithm or simulation, not permission to view an answer. Keep the current state and its output visible throughout, and expose instantaneous parameter effects where meaningful. If a costly calculation needs an explicit run, show which input configuration produced the current result, label pending edits honestly and cancel obsolete work; never substitute grading for a computational boundary. Inspect a prerecorded experiment with clearly labeled record selectors; do not imply a new model was trained live.

**Make the affordance honest, including inline figures.** A thumb on a track, draggable point or editable-looking cell must work as advertised. When manipulating it helps reveal the mechanism, implement real pointer/touch and keyboard interaction with visible current values and synchronized consequences. Keep the coordinate scale stable during a drag; changing an error must change its encoded length/area, not disappear into automatic rescaling. Otherwise draw a clearly read-only annotation (for example a tick rather than a slider thumb), identify the actual control and explain what stays fixed. Do not call a preset-only illustration a freely editable lab. A static diagram may remain static when that serves its explanatory purpose.

Review controls throughout the article, not just inside the main lab wrapper. Check enabled, selected, focused and disabled styling against the site's dark/amber theme; native gray buttons or unstyled selects are defects. Exercise real dragging and keyboard changes, inspect the resulting numbers/plots/captions, and review desktop and narrow layouts. Automated control-value changes alone do not establish that a drag target, touch target or visible explanation works.

For every exposed range, test intermediate values as well as presets, and test both endpoints through the actual native control. A validator that accepts only old presets must not sit behind a continuous slider. Paired slider/number editors must show the same exact model value; do not introduce an arbitrary snapping grid that silently changes defaults or typed values. Bind each field to its own accessible label, particularly when a label also contains an output readout. Preserve the learner's inspection position when recomputing a trace where that position remains valid. At an initial state that cannot change, explain the invariant and offer a clearly identified full replay/preview or meaningful inspection step; do not make a control look ineffective by resetting to an unchanged starting frame. Previews must identify which later states are computed, observed or hypothetical.

Three requirements turn a guided trace into an investigation and are checked at review:

1. **The consequence is available immediately.** Opening the lab shows a useful current result. Valid edits update the linked mechanism, diagram, numbers and explanation together without an answer submission. The learner can trace input → operation → intermediate state → output → practical decision. Check continuous changes, boundary/null cases, reset, and quick repeated edits; no prediction UI or correctness feedback may remain.
2. **The learner acts on the topic's entities.** At least one control changes something the prose has not already resolved: choosing which items start a process, placing or selecting a threshold, changing an input rather than picking among two or three labeled presets whose outcomes are described beside them. Presets remain useful as suggested starting points.
3. **Every fixture demonstrates what it is placed beside.** Before accepting a dataset or example for a lab, run the alternatives the lab offers and confirm they differ in the way the adjacent explanation claims. A table that promises four rules behave differently is contradicted by a fixture on which all four agree. When the natural running example cannot show the contrast, add a second fixture built to show it, and check that its critical values are exactly representable so a promised tie is a real tie.

Connect representations directly: selecting an edge may highlight its matrix entries; stepping a line may move a reference arrow; choosing a result cell may reveal its input operands. Use stable labels and color meaning. Explain whether layout position, line thickness, area, or color encodes a quantity or only organizes the drawing.

Do not treat a changing table, a “Next” button, decorative animation, or a screenshot of code as proof that the mechanism is intuitive. Ask whether a first-time learner can explain what changed without reconstructing everything mentally. Retain exact tables as inspection/accessible companions when adding spatial explanations.

Give each additional lab a distinct job. Put it beside the concept it teaches. Split crowded controls or unrelated questions into focused activities; offer an optional integrated investigation after the parts are understood. Share UI components where useful, without forcing every concept into the same visualization.

### Graphs and simulations need traceable evidence

Code-rendered charts can teach relationships clearly; rendering code does not establish the truth of their values or interpretation. Identify what each quantitative figure represents: an exact calculation, an analytic model, a simulation, measured data, externally sourced data or an illustrative sketch. Put the relevant assumptions and status next to the figure, and retain its equation, generator, measurement record or source locator in the authoring evidence.

- Check values independently where appropriate, along with units, scales, log transforms, ranges, normalization, rounding and correspondence to the text. Distinguish probability from density, observed samples from interpolation, and supported ranges from extrapolation. Show variability or uncertainty when the claim depends on it.
- Real performance comparisons need applicable sourced measurements or a reproducible benchmark: record the task, corpus/input sizes, algorithm settings, software versions, hardware, parallelism, timing boundaries and variability. The caption and prose must not generalize beyond those conditions.
- An illustrative sketch can explain a hypothetical relationship, but invented points must not imply measured seconds, real-product rankings or established scaling laws. Use explicit model assumptions and generic series for a hypothetical example, or replace it with verified data. The word “illustrative” does not justify nearby unsupported empirical claims.
- **The claimed feature must be perceptible in the rendered figure.** If the prose says a curve bends, flattens, peaks or separates, a reader must be able to see that at the size the figure renders, on desktop and on a phone. Check the range of the plotted values against the axis: when one value dwarfs the rest, a linear axis turns the interesting region into a flat line, and a logarithmic axis, a second panel or a relative measure is needed. Include the natural baseline point (the one-component, zero-change or untreated case) when it anchors the comparison. Show repeated runs as individual marks when their disagreement is part of the message. A caption admitting that the numbers are easier to read in the table is a sign the figure has failed.
- Full-width SVG figures scale their text with their width. Inspect each figure at desktop width as well as phone width, and constrain the figure's maximum width or text size so labels stay in proportion at both.

### Visual layout is a separate completion check

A numerically correct figure can still teach incorrectly when a heading crosses another component's bar, a label is clipped, or several stages collapse into one crowded image. Passing model tests, counting figures and checking document overflow do not establish that the visual itself works. The GMM allocation figure reported by the user on 14 September 2026 is a concrete example: all marks were inside one SVG, but a component heading intersected the preceding component's update.

- For a new or rewritten lesson, inspect **every distinct inline figure**, plus the informative states of its investigations, with the actual fonts at desktop and narrow widths. For a targeted repair, inspect every affected figure/representation and reuse unchanged evidence. Identify reviewed figures/states explicitly; selected screenshots must not be reported as a complete visual pass. At responsive breakpoints, also inspect the composition between the endpoints. Include increased text size when the visual contains substantial annotation.
- Keep explanations, section headings, legends and multi-line numeric readouts in reflowing HTML when their position does not encode data. Reserve SVG coordinates for geometry, short labels and scale-bound marks. Separate stages or stack panels when necessary; do not force all steps into a fixed-height drawing or shrink text until it fits.
- Check the interior, not just the outside bounds: text against text, labels against bars/arrows/points, labels within their intended nodes, and clear separation between successive stages. Use computed glyph bounds and targeted regression checks to catch known failures, then inspect the rendered result. Geometry flags need interpretation; an intentional node label or background grid intersection is not automatically an error.
- Include built-in presets that materially change the geometry: coincident components/points, repeated measurements, a zero or boundary value, and a completed trace where relevant. Labels that are distinct in the opening state may coincide after an update. Record the specific preset/state tested; a default-state scan is not coverage of those teaching cases.
- Preserve the mathematical meaning while changing layout: comparable panels retain the same scale and units; circles/angles require equal physical axis scale; bar lengths/areas still encode the declared quantity. Never stretch axes, clamp quantitative positions or hide explanatory content merely to remove a layout warning.

Follow the engineering layout contract (repository path: `docs/engineering/LEARNING-CODE-STANDARD.md#diagram-layout-and-svg-legibility`). A repeatable triage tool supports this pass but cannot certify all interactive states, typography or teaching quality. Fix confirmed findings and repeat affected checks; reuse unrelated passing evidence.

Validate guided traces, trainer outputs and their prose against the stated algorithm/conventions as well. A convincing visual is a design reference until its model and claims have been checked; an attractive lab does not establish the accuracy of its entire lesson.
