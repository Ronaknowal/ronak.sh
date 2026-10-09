# Titans complete reading-flow visual and runtime specification

This is the additive implementation specification for the independently accepted amended design. The protected original lesson/specification and all54 sources remain byte-identical. The complete authored manuscript is `reading-flow-lesson.md`; the explicit renderer emits only the topic-owned review preview. Central revision4, integration and publication remain root-owned.

## Objects, palette and geometry

`TitansDrawings.jsx` owns actual SVG cells, weighted wires, scalar multiplication/sum nodes, vector reductions, parameter banks, convolution channel products, masks, state tuples and plots. `Cells`, `Wire`, `Route`, `Operator` and `WeightedTermsDrawing` are small drawing primitives; they do not stand in for an unspecified model. Each model view supplies actual operands from the new pure model or unchanged original model. The explanatory figures precede numerical history tables.

Cyan identifies supplied data, violet computed quantities, amber learned parameters and orange gradients. Forward wires are neutral solid arrows; reverse credit is orange dashed. Operations are neutral labelled rounded rectangles. Jacobians, transition matrices and fitted mean/standard deviation are computed quantities, not learned parameters. Plot curves use labelled series colours and line patterns. The light theme uses darker versions of those same roles. Every SVG glyph is 16 view-box units at a one-to-one 16px baseline; physical SVG width/height use rem so 200% root text paints 32px glyphs. Storage and opening read/write circuits use complete 330-unit vertical scenes; large parameter/credit scenes retain local scrolling. A ResizeObserver shows a visible instruction only when overflow exists and associates it with the focusable region through aria-describedby. Controls and exact current results remain HTML. Each local control row has at most 3 controls, including reset; all inputs/buttons/selects are at least 44px high. Numeric controls use the shared `NeuralNumber` with one exact editor and `range=false`.

## Complete placement map and linked cases

The 42 semantic manuscript placements resolve through `scripts/lib/titans-reading-flow-renderer.mjs`; the corrected default preview paints 87 SVGs, including separately connected forward and reverse scenes. Marker names are the renderer keys below. Every marker is required exactly once. Repeated explanatory views share their group’s case rather than independently preset states.

| Reading question and marker | Actual operations | Immediately following controls |
| --- | --- | --- |
| `places`: where does earlier information live? | Vertically stacked last-two rows, fast 2×2 grid, matching S and shared prefix; no unsupported downstream arrow | None |
| `association-first`: how does a write change the read? | Complete vertical two-product read, residual, and each coordinate's residual/key → gradient → rate → weight. General recurrence deferred to §3 | Displayed association's target, global rate, restore that association's target/rate |
| `association-second`: which old answer moves? | Current replayed matrix into a proposed second-key write | Second key x/y, restore key |
| `association-query`: where does that change appear? | Equal-axis key/query arrows, current and proposed weighted reads | Query x/y, restore query |
| `association-keys`: change the actual keys | Editor selection, complete proposed coordinate gradient | Association to edit, x/y |
| `association-targets`: change both targets | Replayed current parameter bank and read | Target1/2, reset entire shared case |
| `zero-key`, `sensitivity`: does error imply gradient? | Zero-key residual−10, gradient products0; Jacobian/routing case diag(1,0) | None |
| `signed-update`: where did the increment come from? | Actual signed carried/fresh/shrinkage/net segments on one scale | None |
| `association-update`: apply carry and shrinkage to the real history | Actual current residual, gradient, S′ and W′; common signed scale | Global rate, η, α |
| `association-history`: which arrivals have been applied? | Next preview before the complete0–12-card-ID history | Next card, Write, Back |
| `reset`: does decay clear a request? | Side-by-side real weight/momentum/recent tuples | None |
| `fixed-factors`, `stability`: when does repeated fitting grow? | Four signed residual curves with declared extents; live signed trace | Rate, steps, restore stability |
| `nonlinear`: how does each parameter participate? | Exact W₁/b₁/W₂/b₂ grids, every2→3→1 weighted connection, SiLU, read, reverse credit and updated tuple | Target, rate, restore nonlinear case |
| `xor`: why add nonlinear features? | Four actual signed corners and affine contradiction | None |
| `projection`: what operands reach memory? | Three actual projection matrices/time-row histories, independent time×channel kernel grids, per-channel products/sums, q/k norm divisions, unnormalized v | None |
| `junctions`: how do architectures compose? | MAC P/R/X rows and mask, MAG parallel lanes and coordinate products, MAL serial route | None |
| `causal`: can a retrieval prefix contain future queries? | Actual future-query retrieval rows, scores and earlier-output counterexample | None |
| `gated-token`: which products create this output? | Actual scores/softmax, both weighted-value circuits, both2-coordinate memory-read circuits and separate gate operands | Position, token coordinate1/2 |
| `gated-flags`: separate prefix from writes | Same edited stream, parameter/read/gate route | Prefix, writes, reset whole gated case |
| `gated-extent`: inspect later positions and a future edit | Same4–8-token stream and all outputs | Append, Remove last, Reverse final |
| `gated-continuity`: what crosses a boundary? | Actual W/S/recent tuple, selected prefix/suffix record, whole-call comparison and independently owned request B | Split, carry/fresh, restore continuation |
| `outer-scalar`: how can task loss teach the rate? | Fast write→query→outer loss and reverse dependency; actual slow step | θ, graph contract, restore scalar |
| `outer-nonlinear`: does the graph match the function? | Retained seed3 parameter fixture, updated read and outer derivative | θ, graph contract, restore nonlinear fixture |
| `rental-seed`: what are the actual input units? | Dated raw counts→2011 standardization→weekday concat→whole9-vector norm→saved network→inverse scaling | Saved seed, reset entire rental case |
| `rental-network`: expose the complete saved network | Actual8×9 W₁, nine input coordinates, matrix product, b₁; nine scalar products for hidden row1; all eight bias/SiLU results; eight actual output products and b₂ | None |
| `rental-timeline`: when may the target enter? | Seven already arrived inputs, saved forecast, arrival, target standardization/write, next-day state | None |
| `rental-arrival`: change one available observation | Common-domain original/current/frozen/observed curves and signed causal difference | Date, arrived count, restore source observation |
| `rental-inspect`: which current state creates this forecast? | Same curves, actual inspected-date preprocessing and causal pre-write parameter state | Inspect index, next day |
| `rental-metrics`: judge the saved results | All three seeds and both baseline MAEs on0–2000 axis; full retained MAE/RMSE table | None |
| `score-timing`: what was scored? | Pre-target forecast versus post-target fitted read | None |
| `chunk-core`, `chunk-inputs`, `chunk-schedule`: where is each gradient evaluated? | Both complete two-arrival routes and their gradient-source operands from one shared1×1 initial matrix | Respectively: target2/rate/reset; start/target1/target2; rate/length/highlight |
| `scan`: what can be composed? | Actual scalar affine operands and coupled2×2 weight/momentum multiply | None |
| `budget`: what bytes belong to each request? | Named matrix slabs, S copies, layer/request replication, local-K/V axes; common partial-term bars | None |
| `objective`: change the residual derivative | Same scalar read/key/target into half-square versus Huber gradient/update | Target, restore objective |
| `window-objective`: fit one target or a permitted set? | Two residual products→mean gradient→step, latest-only and duplicate-target null | None |
| `frequencies`: which bank receives each update? | Two parameter banks and four arrival clocks | None |
| `distillation`: where can an auxiliary target come from? | Teacher rows1–4/student rows3–4 at the same position, fixed teacher target, student gradient/write | None |
| `vision`: know an auxiliary target while withholding the main one | Actual asymmetric L glyph/rotation, feature update, separate rotation/class heads | None |

## Model, loading and reproduction contracts

The displayed first association is the first completed card ID, or the selected next card when no write is complete. Its editor and restore act on that same card. At initial zero momentum/decay, early views do not expose S or the general recurrence. If later settings persist when returning, the view names and links the full current rule to §3 and draws the actual general update. No shared control or original domain is removed.

Each nonlinear hidden scene connects both W₁ weights and b₁ into actual products/sum/SiLU; the three output products connect W₂ and b₂. Reverse scenes show residual credit for b₂, r×W₂, SiLU′, both input products for W₁, matching b₁ credit and r×h for W₂, including zero branches. The scalar outer route has actual inner operands, fast weight, query, residual/query/−g contraction and slow-rate update. The nonlinear outer route retains all four initial and changed parameter arrays and all 13 gradient/Jacobian contraction products. Detach retains identical forward values while naming the absent graph path; the displayed mathematical sensitivity is distinguished from that detached graph.

Projection diagrams give X and W separate ports into a product, then projected history and channel-specific kernel separate ports into each timewise product/reduction. The MAC attention operation receives both assembled representations and a separate permission mask. Forecast labels use matching colours, endpoint leaders and solid/dashed/dotted series marks; coincident original/edited adaptive curves state their overlap explicitly. Original benchmark scores retain their unedited meaning.

`TitansFlowProvider` owns one associative, gated and chunk case. Association edits replay the exact retained card-ID order from zero; editor selection does not select the next write. Back removes one ID. Global rate0 replays the full zero-initialized history to zero, rather than retaining an earlier nonzero-rate state. Legal twelve-write growth remains available and exact values use scientific notation instead of shrinking text. Key/query axes stay±2.2 independently of weight magnitude. The shared reset restores the complete original case.

Gated extent is4–8 tokens; every legal selected position and nonfinal split is available. Removing the final token clamps selection/split. Continuation carries W, S and recent rows together; fresh request B never consumes A’s state. Chunk length1 and rate0 remain exact nulls with arbitrary edited initial weights/targets. Highlight changes emphasis only.

`TitansStudyProvider` loads only the selected original saved fit near the first rental view, with abortable fetch, shape validation and immutable cached assets. The snapshot’s seed identity must match the selected seed before display. Retry/seed switching preserve arrival and inspection edits. The arrival count accepts0–20000 integers; it changes later keys and fast writes, not its own recorded forecast. Inspected anatomy rebuilds the causal pre-write parameter state. A nonfinite replay stops its plotted valid trace at the first invalid date and reports that boundary without a fabricated curve. The common rental axis contains the union of plotted original/current values and at least0–10000; signed changes use a common symmetric extent of at least±1000. Original benchmark scores remain unchanged by hypothetical edits.

All five complete instructional programs are written in the manuscript and resolve to shared `RemoteCodeBlock` with automatic near-viewport loading and shared Copy/Download/error feedback. The original tuple, mechanism and rental study programs remain untouched. The two new draft programs are served by the isolated preview middleware; no original public asset is overwritten. The shared file index and a topic resource index include all original programs, packet checker, CSV, description/provenance/protocol and saved result files. No original scientific writer, fit or generator is invoked by the new authoring or checks.

## Current review evidence and boundary

The author’s bounded native check verifies manual derivatives, mean reduction, stable sigmoid, functional-module equivalence, absent detached derivative and the actual slow rate step. The pure-model check verifies retained controls’ arithmetic, all legal carried stream splits4–8, changed chunk inputs/nulls and all three immutable rental fits’ causal replay. The browser check verifies whole-reader compass/index, all retained-capability interactions, selected-seed lazy loading/failure/retry, code failure/retry, Copy success/failure feedback, every default SVG’s text bounds/overlaps/glyph pixels and four responsive/theme/text-size layouts. Source identities, results and actual screenshots belong to the topic record’s READY packet. These are author checks; independent exact complete-source acceptance and root integration/publication remain required.
