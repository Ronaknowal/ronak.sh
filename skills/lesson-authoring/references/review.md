# Review

Part of [$lesson-authoring](../SKILL.md). Repository paths below are relative to the selected application checkout; see [the repository adapter](portfolio-adapter.md). Load only the sections needed for the selected mode.

- [10. Accessibility and visual quality](#10-accessibility-and-visual-quality)
- [11. Validation and definition of ready for review](#11-validation-and-definition-of-ready-for-review)
- [Learning-experience checklist](#learning-experience-checklist)
- [Keep verification bounded and reusable](#keep-verification-bounded-and-reusable)
- [Source-bound evidence and review handoff](#source-bound-evidence-and-review-handoff)

## 10. Accessibility and visual quality

Preserve keyboard access, visible focus, readable labels, meaningful heading order, and clear table semantics. Do not communicate a distinction by color alone: add text, values, shapes, or line patterns. Give diagrams an explanatory text equivalent and accessible exact data where needed.

Validate mobile layouts and zoom: the controls, relevant input, visual consequence, and explanation should stay understandable together. Recompose or sequence a complex visual instead of merely shrinking its text. Avoid hover-only instructions. Use reduced-motion support and manual stepping when motion carries teaching information.

Visual polish serves comprehension: highlight the current relationship, minimize competing emphasis, keep explanations near the referenced element, and avoid a repeated wall of equally weighted boxes. Do not mistake a consistent component style for a consistent teaching experience.

Review colour as an explanatory encoding using [colour carries conceptual meaning](visuals-and-labs.md#colour-carries-conceptual-meaning). Confirm that the entities being contrasted are visibly distinguishable and retain their mapping across connected views and meaningful edits. Check actual painted marks/text, separate identity from selection or state, and verify labelled scales when hue or intensity encodes quantity. A neutral theme is not a reason to erase useful colour correspondence.

## 11. Validation and definition of ready for review

This section defines complete implemented-lesson readiness in phase two. At a content-only boundary, apply the research, reasoning and manuscript-completeness requirements above and explicitly defer the implementation checks; do not claim this section has passed.

Assess each revised lesson on separate axes. Do not infer one from another:

| Review | Evidence to collect |
| --- | --- |
| Coverage/pedagogy | Updated scope/title and coverage map; saved discoveries considered; prerequisite continuity; plain explanation; complete example; meaningful visual support; interpreted result; independent practice; useful feedback; justified applications/connections where useful; next-step route. |
| Accuracy | Claim/source checks; assumptions/conventions; numerical and code outputs; relevant counterexamples and boundary cases. |
| Interaction | Controls change the intended model; diagrams and numbers agree; reset/back and invalid states work; the investigation teaches its stated question. |
| Browser/accessibility | Desktop and narrow-screen inspection; keyboard/focus; text alternatives; readable labels; valid anchors; no blocking overflow or rendering errors. |
| Learner experience | An actual beginner walkthrough when available: observe the learner changing an input, explaining its consequence, diagnosing a case and transferring the decision. Otherwise label the review as an author's heuristic assessment, and run the learning-experience checklist below in full. |
| Voice and reading load | Hedging density, a stated first-pass route, connections made explicit, displayed code that shows its mechanism and prints no disclaimers. |

### Learning-experience checklist

Correctness review and learning-experience review are different activities and are recorded separately. A lesson can pass every numerical oracle and still teach poorly. The author runs this checklist before handing off and the independent reviewer runs it again; both record concrete findings, not a pass mark.

1. **Route.** Is the shared opening directly below the title, with the complete actual section index and a clear first-pass route? Are prerequisite and exploration instructions grouped there without a second custom TOC or duplicate numbering? Are deeper branches labeled where they begin?
2. **Cautions.** Is each important caution stated once in a clear home and referred back to, rather than repeated after every result? Does any code print a cautionary sentence?
3. **Real question.** Does the lesson open with a concrete situation a reader can care about, and return to it with a result the reader can judge? For data methods, is there real data?
4. **Labs as live investigations.** Does each lab show its current result immediately, with no prediction feature? Do meaningful edits update the mechanism, diagram, numbers and explanation together? Can the learner compare changes and connect them to a decision? Does at least one control act on entities beyond named presets? Was the fixture run under the offered alternatives, including the null case?
5. **Figures.** First check [foundational visual coverage](visuals-and-labs.md#foundational-visual-coverage): can a novice point to the object's parts, distinguish inputs/parameters/computed values, follow one operation and locate the object in the larger system? Compare the actual views with the canonical teaching reference, recording concrete missing jobs or adequate alternatives. A behavior plot or table does not automatically cover anatomy or wiring. Then, for each quantitative figure: is the claimed feature visible at rendered size on desktop and phone? Is the baseline present? Does the caption ever apologize for the figure?
6. **Connections.** Where the same result appears by two routes, is the link stated? Are the canonical reference's headline facts present or deliberately routed? Does each major section follow from an understandable question, with explicit bridges when examples, assumptions or notation change? Are earlier implementations linked precisely, the local new contribution explained, and downstream discoveries saved with their actual disposition?
7. **Code.** In each displayed program, does the mechanism occupy most of the lines? Is validation separated and minimal?
8. **Practice.** Do the exercises change the numbers and the context, and does at least one give the learner exact values to reproduce after an independent variation?
9. **Screenshots.** Were informative states captured and looked at, including meaningful edited inputs, the fixture that shows the contrast, boundary/null results, and the figure at full desktop width?
10. **Buildup throughout.** At every new conceptual transition—including middle sections, substeps, variants, code choices and deeper branches—can the reader say what question is being answered, what the entities mean, how the operation proceeds and why its result follows? Use the topic's concept map to locate actual explanations, worked intermediates and appropriate visual support. Follow complete examples in reading order without having to discover a later lab state. Record concept-level gaps and their closure, or why existing support suffices. An opening intuition section, lab counts and extra prose are not evidence that the rest of the lesson is understandable.
11. **Reading flow and presentation.** Does each figure come before (or with) the prose that walks through it, rather than after paragraphs describing it? Do figures and labs sit on the page without card frames, banners or separate headings, so the page reads continuously? Can every part, colour and arrow be read from labels where it appears? Does each lab offer only the controls its stated question needs, placed directly under its visual? Is every section bridged from the previous one, with no term, symbol or control used before it is taught and with explicit references back to earlier material? Check against the module's visual vocabulary. Is each core figure a drawing of the objects (tensors, kernels on cells, widths, branches, matrices) rather than sentences in boxes, and is the real object and the field's canonical picture drawn at least once? Compare the figures side by side with a reference lesson at the same scale. Follow [figures and labs belong to the reading flow](visuals-and-labs.md#figures-and-labs-belong-to-the-reading-flow) and [keep the reading continuous](teaching.md#keep-the-reading-continuous).
12. **Comprehension check.** Using only the page in reading order and the stated prerequisites, answer one explain, one apply-to-a-changed-case and one diagnose question for each major mechanism. Record where the page fails to support an answer. This approximates a novice; it does not replace observing a real learner.
13. **Specialist depth.** Compare the lesson with its canonical treatments and coverage map. Is any standard result, derivation, assumption, failure mode, common misconception or current practice that belongs here missing, misstated or covered only in a compressed summary? Is each concept's ladder complete, from intuition through mechanism and formal statement to why it works and where it fails? Is every deeper rung still explained to the lesson's standard? See [go deep on every topic](teaching.md#go-deep-on-every-topic-and-keep-every-layer-easy).
14. **Colour correspondence.** Can the reader follow the same piece, object, channel, class, process or series through the related representations? Are important alternatives distinguishable, selection cues separate, and numeric colour scales declared? Does the distinction survive reordering, edited inputs, reset and narrow layouts where applicable? If the encoding changes, is the change explained locally? Record a concrete trace and any lost cue; merely listing palette values is not evidence.

For a revision of an existing lesson, also compare its technical claims with the previous version: list claims that were removed, weakened or newly stated, and verify each. Rewrites have repeatedly introduced false statements by dropping a necessary condition. Every check an author's record claims must point to an artifact (screenshot, receipt or command output); unsupported claims are removed from the record, not left as assertions. Browser checks include 768 px with 200% root text by default.

Include an explicit inline-visual reading pass in coverage/pedagogy review: inspect introduction of structures, alternative cases and intermediate transformations, separately from checking that lab controls work. Record concrete omissions and improvements rather than reporting only a lab count. The policy above governs when an inline figure is needed; it does not create a diagram-per-section quota.

In that pass, temporarily disregard the topic's test results and your own subject
knowledge. Read only in page order: at each new noun, symbol, diagram or control,
identify the preceding explanation that lets a novice interpret it. Follow the
first successful example without looking ahead. Report where that breaks—even
when an expert can infer the missing bridge. Repeat at the major middle and
advanced transitions. When comparing revisions, explicitly retain the old
version's useful visual/narrative scaffolding and identify any clarity lost while
correcting its technical claims. This is a heuristic reading review unless an
actual learner was observed; passing it does not establish universal usability.

For a material break in that reading, record the exact first-use location, what
the explanation assumes, where that knowledge is actually taught (or that it is
missing), and the consequence for the worked example. Close it by tracing the
revised example from its inputs through the intermediate operation to the result;
check the connection to notation, code and a changed case where applicable.
Putting a definition somewhere on the page does not close an ordering failure.
If such breaks recur across sections, revisit the learning sequence rather than
approving an introduction-only patch. Unresolved material teaching gaps block
readiness even when the build, numerical tests and controls all pass.

Check the fit of each representation as well: can a beginner identify the topic's actual entities, perform or follow its operation, and explain the visible consequence? Revise a generic layout when it hides that mechanism, and retain a repeated format when it remains the clearest fit. Confirm that quantitative figures and their adjacent conclusions match the recorded evidence category and scope.

Run checks appropriate to the actual change. For implemented code/numerical models, test meaningful behavior and compare results against an independent reference or real runtime, not merely the same fixture on both sides of an assertion. Run the relevant project build and browser checks after lesson/component changes. Documentation-only updates do not need a new application build.

### Keep verification bounded and reusable

Plan the checks needed for the topic's actual claims, models and interactions, run them, resolve material findings, and record the reviewed source version. A passing recorded check remains evidence for that unchanged version; resuming a session does not make it stale. Read its result and unresolved findings instead of automatically running it again. Do not reopen completed modules or launch historical integration scripts merely because their artifacts still exist.

After a fix, rerun the affected behavior and any dependencies it can change. A CSS label repair needs focused visual/keyboard checks; it does not require regenerating unchanged Python examples. A numerical model repair needs relevant numerical and displayed-result checks; it does not reopen unrelated topics. Broaden testing when a concrete failure, shared change, source-version mismatch, environment change or unresolved concern justifies it. Perform the required final build and integration once the authorized increment is ready, rather than after every documentation or ledger edit.

An independent reviewer should assess complementary correctness and teaching risks, report a bounded set of actionable findings, and close them with targeted evidence. Do not duplicate the author's entire run by default, repeatedly manufacture new review stages, or pursue inputs outside a declared supported model without a specific reason. Retain sufficient depth and accuracy; avoid turning evidence production into a separate expanding project.

Choose complementary checks for specific failure risks: an independently derived small case, a counterexample to an assumption, a change of units, a permutation/relabeling invariant, a limiting case or a comparison with an independent implementation. State why the expected relationship holds. Two views or programs calling the same helper establish agreement, not independent correctness. These examples are options, not a checklist to apply to every lesson. Scope edge cases to the lesson's claims and supported inputs; extra exotic cases need an identified risk.

Keep current phase status in the delivery ledger and a concise next action in its linked record. Detailed passed results belong in the linked evidence record. Content-first drafts awaiting implementation are required handoff inputs, not disposable scratch. Other temporary drafts, patch scripts and superseded captures are not instructions; follow the scratch retention policy (repository path: `docs/engineering/LEARNING-CODE-STANDARD.md#temporary-work-and-evidence-retention`) and remove disposable working material when its job is done.

Check agreement between every linked representation at intermediate steps, not only the final answer: if fault handling updates a mapping, its table must update with the diagram; if copying retains old storage, show which representation still holds the authoritative sequence. Inspect actual screenshots as well as bounds checks—labels can remain inside an SVG yet spill outside their node or intersect an arrow. Fix those teaching ambiguities and repeat the affected checks.

Historical reports identify older verification scripts and their dated scope. Consult those only when changing the covered behavior; they are not an automatic test queue for new lessons. Current checks must reflect the topic's actual investigations rather than assume one lab per page.

Do not mark a lesson ready if the core example is incomplete, a material claim is unverified, a required mechanism remains unexplained, or learners have no way to assess their practice. Record remaining concerns explicitly. Passing a build, meeting a word count, registering a route, and clicking completion are not teaching-quality certificates.

### Source-bound evidence and review handoff

Preserve the original lesson baseline and its useful coverage once, using the existing increment record. Attach each completed review to the exact relevant source version, using commit/file hashes as appropriate. A hash proves identity, not correctness. Reuse a passing result only while its relevant code, data, assumptions and environment remain applicable; a byte-identical model cannot validate a newly added claim or changed surrounding interpretation.

Give the reviewer a compact summary in the existing topic record: scope/design link, current source paths and versions, checks actually passed with relevant environment/commands, open findings and retained evidence links. Report a finding with its location, learner or correctness consequence, supporting example and closure check. The reviewer still reads the complete lesson and relevant implementation; the summary replaces rediscovery of history, not substantive review.

Finalize source changes and selected-evidence retention before handing the version to final integration. Keep recorded executions faithful to the version actually run. For a later correction, record the changed files, reason, affected dependencies and checks rerun or reused; do not rewrite an old result to imply a new execution. Preserve an exact prior source or a reproducible difference when needed to establish conservation, without copying the whole lesson and every attachment after each edit. One increment owner coordinates shared integration after its topic versions are ready.

Efficiency must preserve the scoped explanations, independent practice, accuracy and actual visual review. Use the code standard's context and coordination rules (repository path: `docs/engineering/LEARNING-CODE-STANDARD.md#efficient-context-tools-and-coordination`) to reduce repeated reading/output and unnecessary work. If reporting efficiency, use available actual usage or coarse process counts already recorded (for example, full native reruns and late corrections); mark unavailable token usage as unknown. Do not invent a savings percentage or build a separate measurement campaign unless requested.
