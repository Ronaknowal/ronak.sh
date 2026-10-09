# DIFFERENT entire content review: t-SNE, UMAP & Manifold Learning

Reviewer: `/root/tsne_content_review`. Date: 9 October 2026. The reviewer authored none of this manuscript, its programs, numerical streams or specifications. The original and successor authors are not used as independent content reviewers. This is a review of complete prepared content, not of implemented diagrams, browser behavior, publication or learner performance.

**Decision: WITHHELD_REQUIRED_FINDINGS — consolidate and close R1–R3 below.** Current descriptor/hash validation is explicitly pending. The complete manuscript and specifications are substantially stronger than an outline or an introduction-only rewrite. Their geometry, worked intermediates, scientific qualifications and implementation scope should be preserved. Three bounded corrections remain: broken learner links, an inconsistent iterative solver return, and an underspecified stepped-state/editor domain. No new fit, whole numerical campaign or broad curriculum expansion is needed to close them.

## Reviewed surface and source identity

The complete current manuscript was read in eight contiguous shell reads: lines 1–210, 211–455, 456–705, 706–950, 951–1195, 1196–1440, 1441–1685 and 1686–end. This includes every paragraph in all thirteen sections, all fifteen complete Python bodies, all fifteen complete displayed streams, nineteen solved tasks and the final project, references and next step. No fenced program was skipped in this reading. The entire 45-job visual specification and its twelve investigation rows were read in two contiguous chunks; complete setup, current API/resource dispositions and author handoff were also read. The displayed content map, presentation index and file index were partially read for navigation; full structural/source binding is a separate check and is not inferred from their displayed prefix.

The following identities are author-declared in the submitted packet; they have **not** been freshly independently hashed in this review:

- `content-authoring/author-ready.json`: 6092 bytes, SHA256 `1832c1bc6800da4ee0a8e1cf6008485c85bfd0d7ac59c0219cc17d69470b16a7`.
- `content-authoring/reading-flow-manuscript.md`: 136791 bytes, SHA256 `d11d369ff19d23db2780356e15e172cb34dcbf5e69fcf3bf97133a283e530e56`.
- `content-authoring/visual-and-investigation-specifications.md`: 42262 bytes, SHA256 `b82da5c43df028a20263068707031ec13606d370a5f1ccec8d4729d47437b5e3`.
- Root accepted whole design: `design-accepted-root.json`, SHA256 `a718b0e8d1bb0de830ee9d4254c708211e3826dee91ec7a3f5e485de7fa3e83f`.

These identify the submitted source being reviewed. A fresh complete descriptor/guard receipt must accompany final review freeze; disk-full error112 currently prevents both shell creation and Node REPL kernel startup. The review must not claim those pending fresh checks passed. Source reading succeeded before that failure. No teaching source, public asset, central phase or existing evidence was edited by this reviewer.

Applicable guidance consumed: app AGENTS; relevant current handoff paragraphs; the current lesson-authoring skill operation/decisions/failure modes; complete review, examples/code and practice/resources references; the relevant continuous-reading/depth guidance and visual conventions/foundational coverage/inline flow sections. A combined initial instruction read was truncated; it is not counted as full consumption of every historical handoff paragraph. Historical plans were not treated as current instructions.

## Required consolidated findings

### R1 — Three learner links resolve to missing site routes

Locations in the reviewed manuscript:

1. §7 closing paragraph, line942: `/learn/machine-learning/clustering-evaluation-validation-silhouette-ari-nmi`.
2. §8 encoder paragraph, line992: `/learn/deep-learning`.
3. §13 next-topic paragraph, line1822: `/learn/machine-learning/independent-component-analysis-ica`.

The complete current `src/app/SiteRoutes.jsx` was read. It defines `/learn/path/:pathId/:topicId?`, `/learn/track/:trackId/:topicId?`, `/learn/topic/:topicId`, hub routes and project routes; it has no generic `/learn/:module/:topic` or `/learn/deep-learning` alias. Its catch-all renders MissingPage. The manuscript's earlier full-curriculum PCA/KMeans/SVM/clustering links use actual route syntax; these three do not.

Consequence: the reader loses the practical clustering diagnostic, the claimed encoder continuation and the official next ICA lesson. This contradicts the claimed exact prerequisite/next-route contract even though the lesson body is readable.

Correction: use the actual stable topic/path route and module query for clustering evaluation and ICA; select an actual DL module or exact encoder prerequisite destination for the encoder link, explaining the destination's role. Do not add route aliases merely to preserve an accidental invented URL. Confirm the intended target topic/module from current navigation. Keep the correct KMeans `2-make-the-geometry-explicit` anchor and other valid anchors unchanged.

Closure: read the changed paragraphs and check every local learner route in the complete current manuscript against actual routing/navigation and current target heading IDs. Runtime navigation remains phase-two work; a source route check is the content boundary.

### R2 — `solve_row` returns probabilities and beta from different iterations at its limit

Location: `programs/gaussian_rows.py`, `solve_row`; identical complete displayed source in §4, manuscript lines363–387. The loop evaluates `p, entropy = row_at_beta(d, beta)`, then advances beta. If the loop exhausts, `return p, beta, 'iteration-limit'` pairs the last evaluated probabilities with the next, unevaluated beta.

Complementary bounded arithmetic, not a replay of a historical main: distances `[1,2,3]`, target perplexity2 and `max_iter=1` evaluate beta1. Its entropy is below log2, so the update sets beta.5 before exit. Returned probabilities are approximately `[.952269826124,.047410722938,.000319450938]`, whereas beta.5 produces `[.805512412041,.179734113500,.014753474459]`. The maximum probability mismatch is `.146757414083`. These two rows were independently calculated using elementary exponentials in the in-memory JavaScript isolate after shell creation became unavailable; no Python module, fit or prior campaign was executed.

Consequence: the learner inspecting the explicit iteration-limit status cannot reconstruct its returned row from its returned width. A later lab using returned beta and returned p can display incompatible states. This is directly within the advertised bounded-search/status behavior, not an exotic overflow case.

Correction: return the last **evaluated** beta with the row, or evaluate a final row at the returned beta. State what the iteration-limit tuple means. Reject or otherwise explicitly settle nonpositive `max_iter` rather than leaving p unbound. Keep the exact previously executed source/streams as predecessors; do not silently assign old numerical evidence to a changed body.

Closure: run a new narrowly scoped callable test at one and two iterations and assert that returned p/entropy equals the row at returned beta and status is iteration-limit when appropriate. Retain a converged and uniform/nearest-tie boundary check only insofar as needed to show the small source successor did not change those contracts. Do not replay all41 checks or old embedding fits. Synchronize displayed/downloaded source and its file/map descriptors; preserve originals and historical evidence.

### R3 — L7's stepped coordinates can leave its declared current-coordinate editor range

Location: specifications, L7 row; D17/D18; manuscript §5. L7 specifies selected A, a current-x editor/range of −4…4 and learning rate0…100. The explicitly taught rate100 step yields A≈6.278461, B≈−8.261085, C≈−10.760275, D≈12.742899, while selected A remains selected and the failed step stays visible.

Consequence: an ordinary native range with fixed min−4/max4 clamps its thumb while the current point/text reports A6.278461; the contract would invite the same slider/state inconsistency the user asked to eliminate. There is no implemented lab here, so this is a specification inconsistency, not an observed browser defect.

Correction: settle one coherent domain policy now. For example, expand the current-coordinate editor's labelled bounds after a legitimate step to contain every current coordinate, preserving exact-entry access and the actual values; or explicitly separate a bounded proposed edit from the current stepped coordinate and teach that distinction. Do not clamp a computed coordinate, hide a failed step, silently recenter without reporting it, or show a thumb that claims a different active value. Specify reset, selection change and subsequent Step behavior with the chosen policy.

Closure: the corrected content contract must trace rate100 → selected A6.278461 → actual editor value/bounds → selection of another endpoint → a further valid edit → Reset, with no disagreement between input, drawing and live sentence. Actual native checks follow during phase two, and must include this taught oversized state.

## Whole beginner/continuity reading

This is a heuristic reading by an independent reviewer, not observed beginner comprehension. For each section, I followed the introduced entities into an operation, formal statement/code and changed or failed case. I temporarily disregarded the author's check counts while judging whether the page itself supplies those connections.

| Section | Concrete reading result |
|---|---|
|1|A real source30 tile precedes flattening, normalization, dimensions and its PCA-neighbor reversal. Original ID versus subset position and two coordinates versus selected pixels are explicit. PCA and whitening get a concrete changed-neighbor example instead of an unexplained metric warning.|
|2|The rolled surface leads to a seven-point U, admitted edges, cumulative distances, relaxation, disconnected radius and diagonal shortcuts. The code reuses later double centering explicitly; the learner is told which operation is postponed. Union/mutual and real zero edges are distinguished.|
|3|The six preservation questions precede the retained fraction; a complete four-point counterexample exposes what retention misses before trustworthiness and continuity. Input/map ranks are locally defined. Historical versus source-ID ranking remains a real convention boundary, not silently mixed numbers.|
|4|Raw Gaussian weights precede normalization, entropy/effective count, tied lower limits and the full symmetric ordered P. The illustrative .8/.6 pair is explicitly separated from the actual four-point fitted matrix. R2 is the remaining source consistency failure.|
|5|The cube/ring conflict supplies crowding intuition before heavy tails. Complete denominators explain an unchanged pair's changed Q; signed force contributions are substituted before the gradient. Exaggeration's nonnormalized mass and a genuinely failed large step are separate. R3 concerns the future control contract, not this arithmetic.|
|6|Self-first support, rho/sigma, duplicate/missing rows, reciprocal union and curve fitting are traced before cost and sampling. The manuscript distinguishes finite full-pair BCE from actual scheduled, clipped, head-only negative updates and from its independently scheduled finite experiment. Radius arithmetic precedes densMAP/API context.|
|7|The narrative announces return from constructed examples to the real300-row collection. Same-ID images, all saved settings, the local/global reversal and null versus random-init seed comparison prevent a decorative scatterplot reading. R1 breaks the outgoing evaluation route.|
|8|The new prediction question explicitly changes to ten-dimensional representations with train-only state and the unfavorable73/75 versus71/75 result. Reference interpolation is not called a full transform. Encoder, supervised and optional openTSNE roles remain different; resource/source-only limitations are explicit. R1 breaks one continuation link.|
|9|The deeper route keeps its examples small: one AB entry is double-centered, length residuals and strain are distinguished, the U's route table unfolds, affine signs are explained, collapse is excluded, Laplacian energy/normalization are separated, tangent residuals and a periodic walk are calculated, and filled faces explain the topological counterexample. Global variant clones/proofs are not falsely promised.|
|10|The fixed-P dependency chain derives the factor4 through squared-distance derivatives and ordered orientations, then relates it to the original whole optimizer. The explicit candidate/noise probabilities show why normalized and binary contrastive losses differ; UMAP equivalence is not asserted.|
|11|All19 tasks have prompts, hints, reasoned complete answers and changed contexts. The actual-ID project has observable acceptance criteria. They assess geometry, probabilities, event weighting, fixed state, storage and topology rather than only recalling names.|
|12|Alternate explanations and technical references have distinct described roles, although additional formatting separation is a useful advisory. Access, video and optional API limits remain honest; books are not represented as read pages.|
|13|Capabilities return to the original neighbor-map question and distinguish it from ICA's independence question. The next link needs R1. The final Copy/Download directive is an implementer sentence better kept in the specification (A1).|

No introduction-only patch is requested. The main learning sequence, worked intermediate values and advanced breadth are useful and should remain. The independent comprehension exercise was to explain each operation using its preceding text, apply it to one offered changed fixture and diagnose its stated failure; the table records the actual support and identified breaks, rather than claiming a learner passed a test.

## Complete visual-contract reading

All45 are source/content specifications; none was certified as a painted diagram. Their foundational anatomy and operation are concrete rather than paragraph-summary boxes:

- D01 actual8×8 tile→64-entry row→300×64/300×2 objects; D02 full paired actual-ID image neighborhoods; D03 perpendicular projection/whitening; D04 rolled surface/tangent patch; D05 measured U/relaxation; D06 disconnected/shortcut graphs.
- D07 six actual carried objects; D08 complete input/map directed neighbors; D09 input/map ranking ladders; D10 raw→normalized Gaussian branches; D11 entropy, ties and limits; D12 complete opposite conditional rows; D13 all16 conditional and joint cells.
- D14 cube/ring capacity conflict; D15 pair and two kernel tails on one scale; D16 all kernels and ordered denominator; D17 all three signed force contributions and simultaneous update; D18 exaggeration mass and unclipped failed step.
- D19 self-first six-record support; D20 a separate exact scale-calibration row; D21 pinned/duplicate/missing membership boundaries; D22 directed rows→union; D23 target/teaching/fitted curve roles; D24 both pair-cost terms; D25 actual endpoints/event order; D26 weighted radius products/API branch.
- D27 actual ten maps/all90 historical scores; D28 unfavorable local reversal; D29 real equal and changed starts; D30 train-only state with symbolic missing fit arrays; D31 projection/reference/encoder distinctions; D32 counted dense/sparse/buffer allocations; D33 genuine quadtree/grid operations rather than generic approximation boxes.
- D34 actual double-centering entry; D35 eigen stretches and separately named strain/length stress/Stress-1; D36 route-matrix unfolding; D37 affine cancellation/extrapolation; D38 local solve/sparse recipes/excluded collapse; D39 measured edge energy/three normalizations; D40 tangent reconstruction and residuals; D41 walk masses/periodic modes; D42 filled simplices and projected duplicate IDs.
- D43 ordered derivative objects; D44 honest beginning/end without invented trajectory; D45 separate score denominator, noise law and contrastive posterior.

Each contract includes source/example state, labelled interpretation, suitable geometry and narrow/enlarged requirements. Stable IDs and semantic color, explicit normalization domains, equal coordinate aspect and local complete-table scrolling are specified. Important conflicts are preserved: intrinsic/ambient distance, graph support versus geodesic intention, local/global scores, ordered/unordered sums, fuzzy/probability/affine weights, metric/nonmetric zero meaning, periodic versus lazy walk and finite source-only versus executed results. A future runtime must still construct and personally inspect the actual full objects, edited/null/refusal states and readable text at390px and768px/root32px. The prepared document cannot establish that its diagrams are best possible or presently readable in a browser.

All12 investigations were read: three separate graph edits, Gaussian width and row-distance investigations, global Q normalization, complete t-SNE step, reciprocal union, pair CE, real saved-ID audit, affine reconstruction and graph energy. Controls are immediately playable, use one to three taught quantities and do not include learner-prediction gates. L7 needs R3. The default/changed/null/refusal/reset contracts of the other eleven are adequate for private implementation, with normal finite-model/version qualifications retained.

## Technical and code assessment

I read all complete sources in context: `isomap_routes.py`, `audit_saved_neighbors.py`, `gaussian_rows.py`, `umap-mechanism.py`, `sampled_pair_events.py`, `local_density_radius.py`, `inspect_digits.py`, `inspect_umap.py`, `compare_transforms.py`, `reference_map_routes.py`, `classical_geometry.py`, `lle_recipes.py`, `graph_spectrum.py`, `local_tangent_patch.py`, `tiny_tsne.py`; and all15 complete streams immediately beside them.

The core mechanisms are actually implemented. Row-wise saved audits avoid a feature-sized all-pair offset tensor; radius graphs preserve real zero edges; Gaussian searches expose feasible ties/statuses (R2 excepted); exact tiny t-SNE opens P/Q/gradient/update; UMAP opens sparse local calibration/union plus separate full-pair and sampled updates; MDS exposes double centering and metric majorization; LLE exposes local ridge and a centered eigenproblem; spectral/tangent/walk routes open their actual numerical primitives. The declared tiny dense costs, ordinary library differences and sparse scaling continuation are part of the explanation. The topology construction and local variant overview are explicitly bounded, not advertised complete package clones.

The central mathematical distinctions are sound in the read source: ordered P/Q mass1 and factor4; positive attraction versus repulsion sign; target perplexity versus neighbor count; graph k including self versus audit k excluding it; ideal UMAP BCE versus asymmetric sampled field; raw squared **length-residual** stress versus Gram strain and Stress-1; classical PCA/MDS sign/subspace ambiguity; affine negative weights; degree-normalized graph modes; economy-SVD dimensions; diffusion's periodic−1 mode; complete Rips faces. The exact original scientific outputs should remain attributed to their checked sources.

The accepted current1.9.1 MDS amendment and inspected optional APIs are reused as qualified source evidence, not freshly executed estimator parity. No old fit/main, ten-main campaign or41-check campaign was replayed. The original41 JSON's inherited Infinity remains an original-format limitation; it must not be silently reserialized to fit strict Node JSON. A changed solver source must get a bounded new receipt and exact predecessor.

## Practice, resources, prior scaffolding and advisory improvements

The previous retained material supplies five useful whole programs, real data, source30's reversal, seed-null evidence and an unfavorable held-out result. The successor preserves these while adding actual intermediate mechanics, specific alternatives, all45 drawing jobs and19 changed-case solutions. No useful scaffold needs deletion to close R1–R3. Whole previous-proof/claim conservation still requires the pending exact source/guard receipt; this narrative reading does not substitute for it.

**A1 — Learner voice/endings.** Move production directives such as §13's “Copy and Download must deliver the entire displayed source” and setup's “The common Reader file index should expose…” into the implementation specification; learner prose can say where the complete files are and how to use them. Replace “There is no scikit-learn DiffusionMap call invented here” with a normal factual API statement. The lesson sometimes repeats source-only/not-rerun/process qualification after successive results. Consolidate repeated provenance in setup/resource roles where doing so preserves a local distinction the learner actually needs. Keep genuine contrasts, domain limits and unfavorable results. This is an editorial improvement, not permission to weaken science or add boilerplate warnings.

**A2 — Current GMM state.** No learner paragraph depends on a GMM public route, so newly accepted GMM publication does not justify inventing a new required prerequisite. The API/handoff note describing its private-only publication status is now historical. Update that current-state sentence if preparing a current successor record, while leaving immutable accepted design/research/history intact and binding Root's actual normal acceptance if cited.

**A3 — Resource structure.** §12 annotations are useful and technically honest. During Reader integration use distinct further-learning and technical-reference roles, matching the shared ending components; do not merge them into a single undifferentiated link dump. The absence of an endorsed video is correctly qualified because only metadata was inspected, and no format quota requires inventing a viewing claim.

## Evidence and closure boundary

This review has real whole-content reading and a complementary bounded arithmetic counterexample. It has no browser screenshots, native keyboard observations, actual implemented diagrams, new paper pixels, observed beginner study, new source-only optional fit or current application build. Failed shell/Node startup under disk-full112 is an environment limitation, not a lesson failure. Pending fresh descriptor validation must be labelled pending, not passed.

Correct R1–R3 together in one bounded successor. Preserve the existing manuscript as a reproducible predecessor/delta, all118 accepted design inputs,40 original pairs,272 author guards, original41 witnesses/ten main streams and five original programs/fits. Reuse passing unchanged scientific evidence. Return the changed content and exact affected receipts for SAME closure against this complete review. Root alone accepts content and opens private runtime; this report changes no phase.

## Additive source-validation completion after storage recovery

Root restored sufficient space through its separately authorized scoped cleanup. This reviewer then ran only `independent-whole-content-review/check-current-source.py`, using Python's standard library; it exited0. The source-bound receipt is `source-binding-check.json`, 229904 bytes, SHA256 `1215133e6867101ed6dee69ec8ab4f2cf275dbe8bdd31bdd3bebbdb47cf9b4c3`. Its623 fresh descriptor checks include the exact submitted manuscript/specifications/author packet, all118 accepted inputs, all40 original/copy pairs, all272 saved author descriptor guards, complete source inventory, complete file descriptors and all30 displayed source/stream bindings. The full source delta reverses exactly to the preserved original draft; all manuscript fences remain unchanged. Fifteen whole source bodies parse as Python ASTs, all35 learner payloads match, and the full map parses with13 sections/45 drawings/12 investigations/19 solved tasks.

The original41 numerical witnesses and ten streams were inspected by identity and retained, not executed again. Each saved stream remains bound to its exact source (the classical numerical stream to its checked predecessor); the current ordinary-only classical function successor retains the exact non-ordinary AST. The inherited Infinity JSON token was accepted for read-only stdlib inspection and its original bytes remain unchanged. No lesson module was imported, no callable/main/fit or old checker was executed, and no application build, browser campaign or large acquisition was started.

The current actual routing source was independently bound and still confirms the three R1 URLs are absent; all three remain present in the reviewed manuscript. R2's saved elementary arithmetic receipt is also bound. A preceding index-inspection command hit a default-cp1252 decoding error before mutation; the successful checker uses explicit UTF-8. This addendum closes the earlier pending **source identity/conservation** check only; it does not erase the disk/tool history, change the whole human-reading findings, or turn guards into correctness evidence.

**Final review decision remains WITHHELD_REQUIRED_FINDINGS, R1–R3.** A separate author should make one consolidated bounded correction, preserve the submitted predecessor and scientific evidence, and return it for this reviewer's SAME closure. Root remains the only content-acceptance/runtime-release owner.
