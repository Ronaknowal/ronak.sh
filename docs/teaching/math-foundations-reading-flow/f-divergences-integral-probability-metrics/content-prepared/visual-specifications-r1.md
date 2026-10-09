# f-Divergences & IPMs — complete visual and investigation specifications

This specification accompanies the complete manuscript. Each numbered drawing has its actual learner introduction and interpretation at its manuscript slot, plus a unique geometric/model contract below. It specifies implementation work; no revised rendering or browser behavior is claimed.

## Shared composition and identity contract

Every D-record below is a real diagram/quantitative picture placed immediately before the paragraph that walks through it, then the corresponding formula/code. There are no card frames, badges or extra lab headings. An ordinary figure caption may explain its scope. Controls sit immediately beneath the picture they affect; results are visible before any action. Each record gives the precise misconception, default objects/formula, encoding, interpretation, responsive composition and check. Full manuscript specifications will instantiate these decisions, not invent missing teaching.

P = amber `#E6AD55` circle; Q = cyan `#79B8E8` square. A–D are categories identified by letters and aligned position. Do not assign arbitrary competing category colours. Difference or score curves are neutral/violet, with sign and baseline direction; negative contributions may have hatch. Selection adds a white outline and text focus, never replaces identity. Pair-matrix cells use labeled group blocks and a single sequential luminance scale for similarity [0,1]; sign of accumulation is a separate +/− label/hatch, not confused with raw negative similarities for linear kernels. Permutation colour intentionally tracks current assigned group while fixed sample IDs track observation identity; explain this before D40. In Iris, colour encodes sample role: initially P=setosa and Q=versicolor. The explicit self-comparison changes Q to the same setosa rows and labels both sample roles beside the drawing; colour never purports to encode species independently of that declared role. No green success decoration.

Coordinates, bar lengths, matrix entries and node masses use the stated actual quantities. Arrows that only express membership have constant width and say so; quantitative mass width is used only with a common explicit scale. All quoted values are computed by retained code, direct mathematical derivation or the named bounded fixture; new numbers must acquire a source-bound arithmetic check during content preparation. No invented benchmark/training evidence.

Responsive pattern R (aligned rows): preserve fixed entity order and shared quantitative scale; stack stages by container width, retaining local labels. Pattern P (coordinate plane): a readable plot plus reflowing HTML labels/caption; equal-unit geometry where distance is claimed, selected numeric coordinates outside the plot; do not shrink sentences in SVG. Pattern M (matrix): keep compact labeled diagram of blocks plus a keyboard-focusable scrollable exact-cell region if necessary; adjacent selected-cell arithmetic remains visible without scrolling. Pattern T (trace): stack actual operations with repeated entity IDs and connector continuity; do not draw paragraph boxes as substitute geometry. Inspect normal reader at1366/16,390/16,768/root32,320/16,390/root32 and restore16; these are planned checks, not current observations. The normal sidebar's available width controls reflow. Each accessible description states the default operation/result and updates with live state. Long explanatory labels reflow outside marks; axes need padding and an explicit zero/domain boundary.


All instructional figures, derivations and programme sources stay visible. Optional native disclosures belong only to practice hints/solutions. Use the actual shared Reader and its content width, not viewport-only breakpoints. No mechanism is replaced by a sentence in a box. Preserve the ten section fragments and the divergences-code-route anchor at the section 7 ordinary-tool route.

D03 is the static first weighted-penalty explanation. The live ratio editor mounts at D07 only after the six formulas and support rules. D18 begins the event stage of L2; D20 adds a linear slope and D21 adds adjacent slopes. D28 pair controls precede sample edits at D29, norm output at D31 and query control at D32. The later D38 estimator is independent. Drawings without a listed investigation are explanatory static figures, not dormant controls.

## Individual complete contracts

### D01. common law anatomy

**Reading placement.** Before the matching `[[D01]]` interpretation in the manuscript. The learner sees: A simulator emits named events A, B, C and D. The reference law P and simulator law Q assign probabilities to the same event labels. Start by locating their disagreement.

**Objects, operation, baseline, result and responsive contract.** Question: are P/Q different labels or different probabilities of the same labels? Draw A–D in four aligned positions; paired 0–1 vertical bars with P circles/Q squares at the tops, totals1. Use exact (.7,.2,.1,0)/(.4,.5,.1,0). Zero D remains a labeled baseline mark. Read A's .7 versus .4; no unnamed metrics. R; stacked same-scale law panels at narrow widths. Check totals, identical A–D correspondence and zero visibility.

**Walk-through after the drawing.** The amber circles represent P=(.7,.2,.1,0); cyan squares represent Q=(.4,.5,.1,0). A is too rare under Q and B is too common. C agrees. D is impossible under both laws and remains visible at zero so that support changes can be investigated later. Each law sums to one. The colours identify laws, while the fixed letters identify outcomes.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** common law anatomy: The amber circles represent P=(.7,.2,.1,0); cyan squares represent Q=(.4,.5,.1,0). A is too rare under Q and B is too common. C agrees. D is impossible under both laws and remains visible at zero so that support changes can be investigated later. Each law sums to one. The colours identify laws, while the fixed letters identify outcomes.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D02. one expectation

**Reading placement.** Before the matching `[[D02]]` interpretation in the manuscript. The learner sees: One way to make the discrepancy consequential is to score an observation: give A a score of one and everything else zero.

**Objects, operation, baseline, result and responsive contract.** Question: how does a probability law score an observation rule? Show g=(1,0,0,0) on the same A–D ruler, each mass multiplied by its visible score, then two signed-free sum bars E_Pg=.7/E_Qg=.4 and gap.3. A chosen event is introduced here as a concrete score; maximization waits §3. R/T, arithmetic under each mass. Check full multiplication, not only final totals. Accessible text reads the event and both probabilities.

**Walk-through after the drawing.** The average score under P is .7×1+.2×0+.1×0+0×0=.7. Under Q it is .4. Their difference is .3. An **expectation** is this probability-weighted average; the rule g=(1,0,0,0) is an event indicator. We have found one question the simulator answers differently: “Did A occur?” We have not yet searched for the most revealing question.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** one expectation: The average score under P is .7×1+.2×0+.1×0+0×0=.7. Under Q it is .4. Their difference is .3. An expectation is this probability-weighted average; the rule g=(1,0,0,0) is an event indicator. We have found one question the simulator answers differently: “Did A occur?” We have not yet searched for the most revealing question.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D03. one weighted penalty

**Reading placement.** Before the matching `[[D03]]` interpretation in the manuscript. The learner sees: For a first example, use f(t)=t ln t−t+1. It is zero at t=1 and rises as a positive ratio moves away from one. Follow both the penalty and the probability that weights it.

**Objects, operation, baseline, result and responsive contract.** After naming the ratio and centered KL generator, show A: q=.4, t=.7/.4=1.75, curve f(t)=t ln t−t+1, shaded height f(1.75), weighted area/bar .4f(1.75). Link the selected curve point to the A row. q is probability, t dimensionless, penalty nats. P plus short R trace; exact value computed rather than rounded before summation. Misconception: f(t) itself is the row cost.

**Walk-through after the drawing.** At A, f(1.75)≈.22932763. Multiplication by q_A=.4 gives contribution .09173105 nats. The height f(t) alone is not the row's cost: Q determines how strongly that height is weighted. The total is

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** one weighted penalty: At A, f(1.75)≈.22932763. Multiplication by q_A=.4 gives contribution .09173105 nats. The height f(t) alone is not the row's cost: Q determines how strongly that height is weighted. The total is

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D04. convex averaging

**Reading placement.** Before the matching `[[D04]]` interpretation in the manuscript. The learner sees: The function f is a **convex generator**: its graph lies below each chord joining two of its points. Convexity controls what happens when different ratios are averaged. To see why the total cannot be negative, first use the positive A–C coordinates.

**Objects, operation, baseline, result and responsive contract.** Positive three-coordinate P/Q (D removed) produces t=(1.75,.4,1), weights(.4,.5,.1), weighted mean1. Mark these points on the same convex f and draw two sequential weighted chords yielding height E_Qf≥f(E_Qt)=f(1)=0. A separate marker distinguishes the weighted curve-height from f at the weighted input. P/T; use reflowing arithmetic. Check weights sum1 and weighted ratios sum1; not an unweighted average.

**Walk-through after the drawing.** The Q weights (.4,.5,.1) average ratios (1.75,.4,1) to .4×1.75+.5×.4+.1×1=1. Averaging the curve heights produces at least the height at the averaged input. This is Jensen's inequality:

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** convex averaging: The Q weights (.4,.5,.1) average ratios (1.75,.4,1) to .4×1.75+.5×.4+.1×1=1. Averaging the curve heights produces at least the height at the averaged input. This is Jensen's inequality:

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D05. affine cancellation

**Reading placement.** Before the matching `[[D05]]` interpretation in the manuscript. The learner sees: The earlier entropy lesson used signed KL terms p ln(p/q). Our centered generator adds −p+q to each row.

**Objects, operation, baseline, result and responsive contract.** Three-category raw KL contributions p ln(p/q) on a signed common baseline, beside corrections −p+q, beside centered contributions. Keep A/B/C correspondence and total equality .208473… nats. B's raw term is negative; centered term is nonnegative. R; two panels stack with same scale. Check each local equality and sum corrections0. Explain that a nonnegative total need not have nonnegative raw summands.

**Walk-through after the drawing.** At A the raw term is positive; at B it is negative because ln(.2/.5)<0. The corrections −p+q sum to zero over probability laws. Thus the centered terms are all nonnegative, yet their total remains KL(P∥Q)≈.208473 nats. A negative raw summand is compatible with a nonnegative total. More generally, replacing f(t) by f(t)+c(t−1) changes the sum by cΣ(p−q)=0. This affine freedom will matter again when we choose a conjugate in section 8.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** affine cancellation: At A the raw term is positive; at B it is negative because ln(.2/.5)<0. The corrections −p+q sum to zero over probability laws. Thus the centered terms are all nonnegative, yet their total remains KL(P∥Q)≈.208473 nats. A negative raw summand is compatible with a nonnegative total. More generally, replacing f(t) by f(t)+c(t−1) changes the sum by cΣ(p−q)=0. This affine freedom will matter again when we choose a conjugate in section 8.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D06. six generator shapes

**Reading placement.** Before the matching `[[D06]]` interpretation in the manuscript. The learner sees: Now inspect their shapes using their own labelled vertical scales.

**Objects, operation, baseline, result and responsive contract.** Six separate labeled small plots over t∈[0,4] show centered forward/reverse KL, half-normalized JS/Hellinger/TV, and Pearson χ². Define every formula in prose before its selector. Each plot has its own clearly labeled y scale (no cross-curve height ranking); mark t=1,f=0, TV cusp and reverse-KL t=0 asymptote. Singular values are boundary markers, never clamped finite curves. P in a single column when narrow; check formulas at1, domain limits and agreement with weighted-law implementation. All are calculated curves, not data fits.

**Walk-through after the drawing.** Every generator vanishes at one. TV has a corner there; Pearson's penalty is quadratic. Reverse KL grows without bound as t approaches zero. The midpoint M in JS gives both laws a reference covering their supports. Some sources omit the half in JS or H², so a familiar name does not ensure matching numbers. Comparing the vertical heights of plots with different scales would not rank their usefulness.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** six generator shapes: Every generator vanishes at one. TV has a corner there; Pearson's penalty is quadratic. Reverse KL grows without bound as t approaches zero. The midpoint M in JS gives both laws a reference covering their supports. Some sources omit the half in JS or H², so a familiar name does not ensure matching numbers. Comparing the vertical heights of plots with different scales would not rank their usefulness.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D07. support limits

**Reading placement.** Before the matching `[[D07]]` interpretation in the manuscript. The learner sees: A ratio calculation must decide what a zero mass means before dividing. The four support cases make this explicit.

**Objects, operation, baseline, result and responsive contract.** Draw four mass-column cases p=q>0, p=0<q, q=0<p, p=q=0, paired with one column each of six contribution rules. Infinity is a symbol/limiting ray, not a finite bar. Show centered KL p=0 contribution q (raw KL0), reverse at p=0 infinity, JS missing-side half mass ln2, H² half mass, TV half mass, χ² q if p=0 and infinity if q=0<p; common zero contributes0. R/M; case rows remain together with short text. Check every boundary against actual model, avoid evaluating0/0. L1 first mounts after this boundary explanation.

**Walk-through after the drawing.** If p=q=0, that outcome contributes zero, although p/q is undefined. If p=0<q, use q f(0), a limit from positive ratios. If q=0<p, use p f∞, where f∞=limₜ→∞f(t)/t. In symbols,

**State ownership.** L1. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** support limits: If p=q=0, that outcome contributes zero, although p/q is undefined. If p=0<q, use q f(0), a limit from positive ratios. If q=0<p, use p f∞, where f∞=limₜ→∞f(t)/t. In symbols,

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D08. common measure

**Reading placement.** Before the matching `[[D08]]` interpretation in the manuscript. The learner sees: The definition need not assume an ordinary density with respect to length. Choose a common dominating measure μ, such as P+Q, and express each law relative to it.

**Objects, operation, baseline, result and responsive contract.** Deeper: three actual atoms with P=(.7,.2,.1),Q=(.4,.5,.1); μ=P+Q masses(1.1,.7,.2), density fractions p=dP/dμ and q=dQ/dμ whose sum is1 per atom. Draw μ-columns split into P/Q portions and an explicit integration sum μ_i q_i f(p_i/q_i). This equals the probability-mass calculation; densities themselves need not sum1. R; distinguish capital P law masses from density symbols with local labels. A second singular atom shows f∞P(q=0). Check representation invariance and finite/infinite conventions; not a requirement for Lebesgue densities.

**Walk-through after the drawing.** For A–C, μ has masses (1.1,.7,.2). At A the two density values are .7/1.1 and .4/1.1; their sum is one. These density values do not themselves have to sum to one across atoms. The integral weights them by μ: μ_A q_A f(p_A/q_A)=.4 f(.7/.4), recovering the original row. Rescaling the common reference changes the density values and integration weights together, leaving the divergence unchanged.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** common measure: For A–C, μ has masses (1.1,.7,.2). At A the two density values are .7/1.1 and .4/1.1; their sum is one. These density values do not themselves have to sum to one across atoms. The integral weights them by μ: μ_A q_A f(p_A/q_A)=.4 f(.7/.4), recovering the original row. Rescaling the common reference changes the density values and integration weights together, leaving the divergence unchanged.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D09. conditional ratios

**Reading placement.** Before the matching `[[D09]]` interpretation in the manuscript. The learner sees: Imagine a sensor merging A and B. To calculate its output ratio, first average their original ratios using the conditional Q weights within that merged group.

**Objects, operation, baseline, result and responsive contract.** Shared merge A/B: q weights4/9,5/9 average input ratios1.75,.4 to1. Mark that barycenter on f with the chord giving the averaged penalty. C/D output ratio1 separately. P/T; same pair colour as D03 but conditional weights labeled Q(x|z). Check processed ratio .9/.9, conditional weights sum1 and Jensen direction. The zero output-mass case is omitted with explicit zero contribution, not an undefined average.

**Walk-through after the drawing.** Given the merged output under Q, the weights are .4/.9=4/9 and .5/.9=5/9. Their average ratio is (4/9)×1.75+(5/9)×.4=1. Convexity makes the penalty at that average no larger than the weighted original penalties. This is the local reason information can disappear under processing.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** conditional ratios: Given the merged output under Q, the weights are .4/.9=4/9 and .5/.9=5/9. Their average ratio is (4/9)×1.75+(5/9)×.4=1. Convexity makes the penalty at that average no larger than the weighted original penalties. This is the local reason information can disappear under processing.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D10. shared channel

**Reading placement.** Before the matching `[[D10]]` interpretation in the manuscript. The learner sees: The same sensor must be applied to both laws.

**Objects, operation, baseline, result and responsive contract.** A–D source mass bars flow through displayed K=[[1,0],[1,0],[0,1],[0,1]] to two output bars(.9,.1) for both laws. Two same-geometry P/Q panels use same labeled K, edges show membership only. Beside it give the exact general operation (PK)_z=Σ_x p_x K_xz. T/M; sources and outputs stay vertically aligned when stacked. Check row sums1, output totals1, same K on both sides; no separate transforms.

**Walk-through after the drawing.** Its table K has rows (1,0),(1,0),(0,1),(0,1). Each row gives output probabilities for one input label and sums to one. Both processed laws are (.9,.1). More generally,

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** shared channel: Its table K has rows (1,0),(1,0),(0,1),(0,1). Each row gives output probabilities for one input label and sums to one. Both processed laws are (.9,.1). More generally,

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D11. contraction and equality

**Reading placement.** Before the matching `[[D11]]` interpretation in the manuscript. The learner sees: Processing need not decrease every comparison strictly.

**Objects, operation, baseline, result and responsive contract.** Reuse D10 input/output with three small comparison tracks: merging A/B loses all discrepancy, merging B/C/D keeps TV.3 but lowers KL to.1837869…, invertible relabeling keeps both. Display actual before/after dots on common per-metric axes, not all metrics on one scale. R; all values from retained events/model or a small exact derivation. Explain equality can hold and a channel is not automatically a strict contraction. No new interactive channel selector is necessary.

**Walk-through after the drawing.** Merging A/B erases the discrepancy. Keeping A separate while merging B/C/D retains TV=.3, although KL falls to about .183787 nats. Invertible relabelling preserves both: apply data processing in each direction to get equality. Agreement after reduction concerns the reduced observation, not all original distinctions.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** contraction and equality: Merging A/B erases the discrepancy. Keeping A separate while merging B/C/D retains TV=.3, although KL falls to about .183787 nats. Invertible relabelling preserves both: apply data processing in each direction to get equality. Agreement after reduction concerns the reduced observation, not all original distinctions.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D12. joint mixture

**Reading placement.** Before the matching `[[D12]]` interpretation in the manuscript. The learner sees: Another form of information loss is forgetting which experiment supplied an observation.

**Objects, operation, baseline, result and responsive contract.** Deeper: two source pairs P0=δA,Q0=δB and P1=δB,Q1=δA with shared latent weight1/2. Draw labeled mixture-index branches, then erase the index; Pbar=Qbar=(.5,.5). For finite JS, each input pair is ln2 and output0≤ln2. A second row states joint convexity Σα Df(Pj||Qj)≥Df(ΣαPj||ΣαQj), derived by retaining/forgetting J or the perspective inequality. T; equal branch weights and common J visible. Check explicit normalization and values; not averaging P and Q independently with unrelated mixing weights.

**Walk-through after the drawing.** Write δ_A for a law placing all its mass on A, and similarly for B. With probability one half choose pair 0, P₀=δ_A and Q₀=δ_B; otherwise choose pair 1, P₁=δ_B and Q₁=δ_A. Each pair has JS=ln 2. If the pair index J is retained, its two branches remain distinguishable. Forget J and both mixtures become (.5,.5), giving JS=0. The same mixing weights are used on both sides.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** joint mixture: Write δ_A for a law placing all its mass on A, and similarly for B. With probability one half choose pair 0, P₀=δ_A and Q₀=δ_B; otherwise choose pair 1, P₁=δ_B and Q₁=δ_A. Each pair has JS=ln 2. If the pair index J is retained, its two branches remain distinguishable. Forget J and both mixtures become (.5,.5), giving JS=0. The same mixing weights are used on both sides.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D13. signed mass/event

**Reading placement.** Before the matching `[[D13]]` interpretation in the manuscript. The learner sees: Our first score selected A. We can now determine the largest event difference by inspecting signed mass changes.

**Objects, operation, baseline, result and responsive contract.** Aligned bars p−q=(.3,−.3,0,0), baseline and selected A. Bracket total positive mass.3 and negative magnitude.3; their sum of absolute values.6 requires half. R. Compare empty/full event0 and complementary event−.3. All are static named cases; L2 later allows edits. Check signed sum0 and max positive-event gapTV.

**Walk-through after the drawing.** The vector Δ=p−q is (.3,−.3,0,0). Positive differences sum to .3; negative differences have the same magnitude because ΣΔ=0. Include every positive difference in an event and none of the negative differences to maximize P(E)−Q(E). Thus

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** signed mass/event: The vector Δ=p−q is (.3,−.3,0,0). Positive differences sum to .3; negative differences have the same magnitude because ΣΔ=0. Include every positive difference in an event and none of the negative differences to maximize P(E)−Q(E). Thus

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D14. fair classification

**Reading placement.** Before the matching `[[D14]]` interpretation in the manuscript. The learner sees: A fair hidden coin chooses P or Q, then draws one event. The goal is to guess the chosen law with equal error costs.

**Objects, operation, baseline, result and responsive contract.** A source tree starts P/Q with prior1/2, follows four labeled outcomes with joint masses p_i/2,q_i/2, and marks chooseP when p_i≥q_i. The correct leaves total.5Σmax(p,q)=.65. T with actual probability widths or equal-width labeled branches; tieC/D decision arbitrary. Phone stacks one outcome's two source contributions per row. Check total joint mass1 and accuracy; equal-prior assumption adjacent.

**Walk-through after the drawing.** At A, choosing P contributes .7/2=.35 to correct guesses, whereas choosing Q would contribute .4/2=.2. Choose the larger contribution at each event. Ties may be resolved either way. The correct leaves sum to

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** fair classification: At A, choosing P contributes .7/2=.35 to correct guesses, whereas choosing Q would contribute .4/2=.2. Choose the larger contribution at each event. Ties may be resolved either way. The correct leaves sum to

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D15. Pinsker mechanism

**Reading placement.** Before the matching `[[D15]]` interpretation in the manuscript. The learner sees: Collapse each observation to “A” or “not A,” then examine how binary KL curves away from equality.

**Objects, operation, baseline, result and responsive contract.** Collapse to A versus notA, P(A)=.7,Q(A)=.4. Plot binary KL d(a||.4) as a varies, with tangent at.4 and quadratic lower curve2(a−.4)², mark a=.7. Second small curvature plot1/[a(1−a)]≥4 on a∈(0,1). P; boundaries are limits, no singular endpoint evaluation. Explain chain: processing, binary divergence, twice squared probability gap. Check d(.7||.4)≤originalKL and≥.18; nats coefficient cannot be reused unchanged in bits.

**Walk-through after the drawing.** For fixed b=.4, binary KL d(a∥b) is zero with zero first derivative at a=b. Its second derivative in a is 1/[a(1−a)]≥4. Integrating this curvature twice gives d(a∥b)≥2(a−b)². At a=.7, the quadratic lower value is .18 nats. Processing to the maximizing event cannot increase KL, so in general

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** Pinsker mechanism: For fixed b=.4, binary KL d(a∥b) is zero with zero first derivative at a=b. Its second derivative in a is 1/[a(1−a)]≥4. Integrating this curvature twice gives d(a∥b)≥2(a−b)². At a=.7, the quadratic lower value is .18 nats. Processing to the maximizing event cannot increase KL, so in general

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D16. roots and triangles

**Reading placement.** Before the matching `[[D16]]` interpretation in the manuscript. The learner sees: A finite metric is nonnegative, symmetric, zero only for equal objects, and obeys d(P,R)≤d(P,Q)+d(Q,R). KL is directional. Even symmetric discrepancies can fail the triangle inequality.

**Objects, operation, baseline, result and responsive contract.** Three laws δ0,balanced mixture,δ1 form a schematic three-node comparison, not a Euclidean embedding. JS directln2 exceeds two legs.431523…; √JS direct.832555…≤two legs.929003…. Add H² direct1 versus two legs2(1−1/√2), and H direct1 versus twice√(1−1/√2). R/T; use four separate labeled comparisons, not incompatible line lengths. This is a counterexample for unrooted forms and an example, not a proof, for metric roots. Check all values/inequalities.

**Walk-through after the drawing.** Use three laws: δ₀, the balanced mixture, and δ₁. Direct JS is ln 2≈.693147, while the two mixture legs sum to .431523; unrooted JS fails the triangle inequality. The square-root values obey .832555≤.929003 in this example. Similarly, direct H² is one while its two legs sum to 2(1−1/√2)<1. This single example disproves metric status for the unrooted forms; it is not itself a proof of the rooted forms' general triangle inequalities.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** roots and triangles: Use three laws: δ₀, the balanced mixture, and δ₁. Direct JS is ln 2≈.693147, while the two mixture legs sum to .431523; unrooted JS fails the triangle inequality. The square-root values obey .832555≤.929003 in this example. Similarly, direct H² is one while its two legs sum to 2(1−1/√2)<1. This single example disproves metric status for the unrooted forms; it is not itself a proof of the rooted forms' general triangle inequalities.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D17. Hellinger coordinates

**Reading placement.** Before the matching `[[D17]]` interpretation in the manuscript. The learner sees: Hellinger's root has an exact geometric interpretation.

**Objects, operation, baseline, result and responsive contract.** Map binary P→(√p1,√p2) on positive unit-circle quadrant. Use δ0,δ1,balanced mixture, true equal-unit plane, chord lengths and H=Euclidean chord/√2. P; root mass axes and factor labeled outside geometry. Check H²=1−Σ√pq and direct/leg values; square-root-vector geometry is exact here. Original/support/event programmes follow their complete concepts; support programme's triangle part belongs here with its full body preserved.

**Walk-through after the drawing.** Map a binary law to its square-root coordinates (√p₁,√p₂) on the positive unit-circle quadrant. The Euclidean chord between two such points, divided by √2, is H. For general laws use square-root densities in a common L² space. The norm's triangle inequality supplies H's triangle inequality, and

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** Hellinger coordinates: Map a binary law to its square-root coordinates (√p₁,√p₂) on the positive unit-circle quadrant. The Euclidean chord between two such points, divided by √2, is H. For general laws use square-root densities in a common L² space. The norm's triangle inequality supplies H's triangle inequality, and

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D18. score operation

**Reading placement.** Before the matching `[[D18]]` interpretation in the manuscript. The learner sees: TV searched over events. We can search over other observation rules, provided their size is constrained. Change to physical positions (−3,−1,1,3): P puts masses (.4,.1,.1,.4) on those positions and Q puts (.1,.4,.4,.1). The first law places more mass in the tails; the second places more in the middle.

**Objects, operation, baseline, result and responsive contract.** Positions(−3,−1,1,3), broad P(.4,.1,.1,.4),narrow Q(.1,.4,.4,.1). Draw law stems, g at the same x, and vertical products (p−q)g with their signed sum. Initial g=(1,0,0,1) attains.6. R/P; probability, score and contribution are separate labeled axes. Check each product and total; colour never changes when a score is negative.

**Walk-through after the drawing.** A score g=(1,0,0,1) selects both tails. Multiply each difference pᵢ−qᵢ by its score and add: .3×1−.3×0−.3×0+.3×1=.6. This is a **witness** to unequal laws: a rule whose expectation differs. Its signed attained gap belongs to this particular rule. An IPM searches for the largest absolute gap over a class of permitted rules:

**State ownership.** L2. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** score operation: A score g=(1,0,0,1) selects both tails. Multiply each difference pᵢ−qᵢ by its score and add: .3×1−.3×0−.3×0+.3×1=.6. This is a witness to unequal laws: a rule whose expectation differs. Its signed attained gap belongs to this particular rule. An IPM searches for the largest absolute gap over a class of permitted rules:

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D19. legal function classes

**Reading placement.** Before the matching `[[D19]]` interpretation in the manuscript. The learner sees: Without a size constraint, multiplying a useful score by a large constant makes its gap unbounded. If the class contains only constants, every gap is zero. The choice of class therefore specifies the question.

**Objects, operation, baseline, result and responsive contract.** Show actual allowable geometry: four independent g_i∈[0,1] intervals; linear familyg=ax,|a|≤1 through origin; adjacent slope strips|Δg|≤Δx for a1-Lipschitz graph. Not nested classes without qualification: the domains/ranges differ. P/T. L2 begins with the event after this introduction, adds linear/slope mounts only after their definitions. Check legal bounds under all controls and attained≤corresponding supremum.

**Walk-through after the drawing.** The bounded class permits each score to lie in [0,1]. The linear class allows g(x)=ax with |a|≤1. The 1-Lipschitz class permits scores to bend, but no pair's score difference may exceed its physical distance: |g(x)−g(y)|≤|x−y|. These are different constraints, not a chain of nested classes with the same score range.

**State ownership.** L2. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** legal function classes: The bounded class permits each score to lie in [0,1]. The linear class allows g(x)=ax with |a|≤1. The 1-Lipschitz class permits scores to bend, but no pair's score difference may exceed its physical distance: |g(x)−g(y)|≤|x−y|. These are different constraints, not a chain of nested classes with the same score range.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D20. mean blind spot

**Reading placement.** Before the matching `[[D20]]` interpretation in the manuscript. The learner sees: Next allow a single slope a and ask whether changing it can reveal the same difference.

**Objects, operation, baseline, result and responsive contract.** Same P/Q means0 on a common position ruler, while their second moments differ. Show weighted lever-arm contributions cancel on each side; compare the event that selects tails. R/P; no undefined variance switch. A shifted point pair at−1,+1 provides linear gap2 to demonstrate a non-null linear case. Check both fixtures; explain a zero score can mean observer blindness.

**Walk-through after the drawing.** Both laws have mean zero: the negative and positive lever arms cancel separately. Therefore E_P[aX]−E_Q[aX]=a×0 for every permitted a. The event score still gives .6. A linear rule can distinguish other laws: point masses at −1 and +1 have absolute mean gap two, attained with slope −1 for the P-minus-Q sign convention. A zero result can mean that the observer is blind to the particular change.

**State ownership.** L2. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** mean blind spot: Both laws have mean zero: the negative and positive lever arms cancel separately. Therefore E_P[aX]−E_Q[aX]=a×0 for every permitted a. The event score still gives .6. A linear rule can distinguish other laws: point masses at −1 and +1 have absolute mean gap two, attained with slope −1 for the P-minus-Q sign convention. A zero result can mean that the observer is blind to the particular change.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D21. cumulative imbalance

**Reading placement.** Before the matching `[[D21]]` interpretation in the manuscript. The learner sees: Flexible slopes can score both tails above the middle. Accumulate the mass imbalance from left to right.

**Objects, operation, baseline, result and responsive contract.** On the same x ruler draw S=(.3,0,−.3) on the three intervals and an integrated critic g=(0,−2,−2,0). Mark adjacent slopes−1,0,+1, interval widths2 and transport areaΣ|S|Δx=1.2. P/T, actual horizontal lengths. L2 editable slopes update graph and contributions while the optimal reference stays visible. Check first anchor0 and best finiteW1, including zero slopes attaining0.

**Walk-through after the drawing.** At the three intervals, the cumulative differences are S=(.3,0,−.3). Each interval has length two. Anchor g at zero on the first position and choose adjacent slopes −1,0,+1, giving scores (0,−2,−2,0). They change by at most the distance between positions. Their attained gap is .6+0+.6=1.2 location units. A zero slope vector gives zero and is legal; it simply is not optimal.

**State ownership.** L2. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** cumulative imbalance: At the three intervals, the cumulative differences are S=(.3,0,−.3). Each interval has length two. Anchor g at zero on the first position and choose adjacent slopes −1,0,+1, giving scores (0,−2,−2,0). They change by at most the distance between positions. Their attained gap is .6+0+.6=1.2 location units. A zero slope vector gives zero and is legal; it simply is not optimal.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D22. summation by parts

**Reading placement.** Before the matching `[[D22]]` interpretation in the manuscript. The learner sees: The sum of interval imbalance times interval width is also the exact one-dimensional W₁ distance. Here is why the constructed score attains it.

**Objects, operation, baseline, result and responsive contract.** Expand Σ_i g_i d_i with d_i=S_i−S_{i−1}; connect matching internal S terms to show Σ_i S_i(g_i−g_{i+1}). Use actual three interval contributions(.6,0,.6). T/R; repeated symbols align rather than tiny derivation text in SVG. Check last total mass0 removes boundary term and sign choice attains positive supremum. General proof in visible text.

**Walk-through after the drawing.** For ordered x₁<⋯<xₙ, define Δᵢ=pᵢ−qᵢ and Sᵢ=Σ_{j≤i}Δⱼ. Since Sₙ=0, writing Δᵢ=Sᵢ−Sᵢ₋₁ makes adjacent terms cancel:

**State ownership.** L2. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** summation by parts: For ordered x₁<⋯<xₙ, define Δᵢ=pᵢ−qᵢ and Sᵢ=Σ_{j≤i}Δⱼ. Since Sₙ=0, writing Δᵢ=Sᵢ−Sᵢ₋₁ makes adjacent terms cancel:

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D23. pseudometric blindness

**Reading placement.** Before the matching `[[D23]]` interpretation in the manuscript. The learner sees: We can see the observer's blind spot by plotting the information it retains.

**Objects, operation, baseline, result and responsive contract.** In the exact finite (mean,second-moment) plane plot broad/narrow as separate points with equal mean; projection onto the mean axis coalesces them. Add P=(±1 fair) and Q=(−√2,0,√2 weights.25,.5,.25) with same point(0,1) even for two features. P; a collision marker lists both laws rather than fake displacement. Explain equality of all chosen observable means forms an equivalence class; suitable separating classes are needed for a metric. Check moments analytically. T5 returns here.

**Walk-through after the drawing.** Plot a law at (mean, second moment). The broad and narrow laws have equal first coordinate but different second coordinates; projection onto the mean axis merges them. Even two moments can collide: P puts equal mass at ±1, while Q puts (.25,.5,.25) at (−√2,0,√2). Both map to (0,1). A collision marker means distinct laws have the same retained features, not that their source outcomes moved to new coordinates.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** pseudometric blindness: Plot a law at (mean, second moment). The broad and narrow laws have equal first coordinate but different second coordinates; projection onto the mean axis merges them. Even two moments can collide: P puts equal mass at ±1, while Q puts (.25,.5,.25) at (−√2,0,√2). Both map to (0,1). A collision marker means distinct laws have the same retained features, not that their source outcomes moved to new coordinates.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D24. moving atoms

**Reading placement.** Before the matching `[[D24]]` interpretation in the manuscript. The learner sees: The score class can change even the meaning of “approaches.” Let δₓ mean that all probability sits at x. Compare P=δ₀ and Q=δₕ.

**Objects, operation, baseline, result and responsive contract.** P=δ0,Q=δh at h=.5 on two aligned position lanes[0,3], equal unit mass stems and common baseline scale. Coincidence h=0 uses aligned lanes, not a fake positional offset. A second coordinate graph shows W1=h,TV=1forh>0/0at0,JS=ln2forh>0/0at0; KL is a separate extended-value row∞/0. Open/closed endpoint markers show discontinuity. L3a controls h only. P; metrics have separately labeled vertical units. Check exact0,smallh,.5,3; no early MMD/H control.

**Walk-through after the drawing.** Both stems have unit mass. At h=.5 they occupy different locations, so an exact-location event identifies their source perfectly. For every h>0, TV=1, JS=ln 2, H²=1 and both KL directions are infinite. At h=0 the laws are equal and all these discrepancies are zero. W₁=h decreases continuously to zero as the displacement shrinks.

**State ownership.** L3a. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** moving atoms: Both stems have unit mass. At h=.5 they occupy different locations, so an exact-location event identifies their source perfectly. For every h>0, TV=1, JS=ln 2, H²=1 and both KL directions are infinite. At h=0 the laws are equal and all these discrepancies are zero. W₁=h decreases continuously to zero as the displacement shrinks.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D25. same finite-resolution observation

**Reading placement.** Before the matching `[[D25]]` interpretation in the manuscript. The learner sees: A real sensor may observe less than an exact coordinate. Model that observation with an explicit common map.

**Objects, operation, baseline, result and responsive contract.** Static h=.4 and h=1.2 with shared floor mapb(x)=⌊x⌋ and bins [0,1), [1,2), [2,3); the endpoint3 belongs to the next bin. Mark both inputs and their observed integer bins on a second ruler. For.4 both becomeδ0, TV0; for1.2 bins differ,TV1. A boundaryh=1 belongs next bin. P/T; draw bins as intervals with explicit endpoint conventions. Distinguish geometric closeness of originals from exact equality of measured laws. Check same map and stated boundary.

**Walk-through after the drawing.** Use b(x)=⌊x⌋ with bins [0,1),[1,2),[2,3), and so on. When h=.4, both laws produce observed bin zero and their observed TV is zero. When h=1.2, the bins differ and TV is one. The boundary h=1 belongs to the next bin. This compares equality of measured laws with closeness of the original locations; finite precision is an observation model, not a permission to replace distinct mathematical points by identical ones without explanation.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** same finite-resolution observation: Use b(x)=⌊x⌋ with bins [0,1),[1,2),[2,3), and so on. When h=.4, both laws produce observed bin zero and their observed TV is zero. When h=1.2, the bins differ and TV is one. The boundary h=1 belongs to the next bin. This compares equality of measured laws with closeness of the original locations; finite precision is an observation model, not a permission to replace distinct mathematical points by identical ones without explanation.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D26. a point and its feature image

**Reading placement.** Before the matching `[[D26]]` interpretation in the manuscript. The learner sees: Linear scores missed changes that leave the raw mean fixed. Change what is averaged. A **feature map** φ sends each observation to a vector of properties. Begin with φ(x)=(x,x²), P equally supported at −1,+1 and Q concentrated at zero.

**Objects, operation, baseline, result and responsive contract.** P=±1fair,Q=0. Actual number line points map to φ(x)=(x,x²), a true2D plane with labels(−1,1),(1,1),(0,0). P mean diamond(0,1),Q mean outlined square(0,0), weighted line segment between P points. P/T, equal-unit axes; dashed connectors indicate mapping, not mass flow. Check vectors and means; do not conflate a point with a distribution.

**Walk-through after the drawing.** The two P points map to (−1,1) and (1,1); their mean is (0,1). Q maps to (0,0). A point feature and a distribution's feature mean are distinct objects. The line segment between P's mapped points shows their averaging operation in this two-dimensional feature space. Write these feature averages as μ_P=E_Pφ(X) and μ_Q=E_Qφ(X).

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** a point and its feature image: The two P points map to (−1,1) and (1,1); their mean is (0,1). Q maps to (0,0). A point feature and a distribution's feature mean are distinct objects. The line segment between P's mapped points shows their averaging operation in this two-dimensional feature space. Write these feature averages as μ_P=E_Pφ(X) and μ_Q=E_Qφ(X).

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D27. best unit critic

**Reading placement.** Before the matching `[[D27]]` interpretation in the manuscript. The learner sees: Now score each feature vector using a coefficient vector v, with norm at most one.

**Objects, operation, baseline, result and responsive contract.** Difference vectorΔ=(0,1) and unit circle of coefficientsv=(v1,v2). Plot linear functionalv·Δ as projection; v*=(0,1) attains1, horizontalv=(1,0)attains0. P; coefficient plane distinct from feature plane with clear labels. Cauchy–Schwarz explained after picture. Check norm and dot products; zeroΔ case any unitv yields0.

**Walk-through after the drawing.** The function g_v(x)=v·φ(x) has expectation gap v·Δ, where Δ=μ_P−μ_Q=(0,1). Cauchy–Schwarz bounds that gap by ‖v‖‖Δ‖≤‖Δ‖. Choosing v along Δ attains it. A horizontal coefficient is blind to this vertical difference; v=(0,1) attains one. Generally,

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** best unit critic: The function g_v(x)=v·φ(x) has expectation gap v·Δ, where Δ=μ_P−μ_Q=(0,1). Cauchy–Schwarz bounds that gap by ‖v‖‖Δ‖≤‖Δ‖. Choosing v along Δ attains it. A horizontal coefficient is blind to this vertical difference; v=(0,1) attains one. Generally,

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D28. Gaussian pair

**Reading placement.** Before the matching `[[D28]]` interpretation in the manuscript. The learner sees: For the interactive pair calculation, change to indexed equal-weight lists X=(−2,−2,2,2), Y=(−1,−1,1,1). Repeated values remain separate observations. Start with X₀=−2 and Y₀=−1.

**Objects, operation, baseline, result and responsive contract.** Reuse first L4 pair X0=−2,Y0=−1,σ1: number line distance1; squared scaled distance1; similaritye^(−1/2). Draw radial kernel profile aroundX0 and evaluationatY0. L4 pair selection starts after this formula; the witness query control waits until D32. P/R; distance units matchσ, similaritydimensionless[0,1]. Check pair symmetry,self1,far approaches0; linear/two-feature choices only after their formulas have been taught.

**Walk-through after the drawing.** Their distance is one. With σ=1, scaled squared distance is one and similarity is exp(−½)≈.606531. A Gaussian point has self-similarity one, while far pairs have similarity close to zero. Select a different pair or change σ to see the same operation. Kernel choices appear after their formulas; bandwidth is relevant only for Gaussian similarity.

**State ownership.** L4a. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** Gaussian pair: Their distance is one. With σ=1, scaled squared distance is one and similarity is exp(−½)≈.606531. A Gaussian point has self-similarity one, while far pairs have similarity close to zero. Select a different pair or change σ to see the same operation. Kernel choices appear after their formulas; bandwidth is relevant only for Gaussian similarity.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D29. indexed Gram anatomy

**Reading placement.** Before the matching `[[D29]]` interpretation in the manuscript. The learner sees: Compute every pair with fixed row and column identities.

**Objects, operation, baseline, result and responsive contract.** DefaultX=(−2,−2,2,2),Y=(−1,−1,1,1), each observation a separate indexed marker.8×8 matrix shows XX,XY,YX,YY and selected pair linked to exact positions. Repeated values remain distinct IDs/rows. M; small block diagram visible, exact cells scrollable. Kernel similarity shading is nonnegative forRBF, separate signed-contribution readout. Check symmetry, all eight diagonal1, repeat rows and selected cell.

**Walk-through after the drawing.** The eight-by-eight Gram matrix consists of XX, XY, YX and YY blocks. A selected cell connects to its two actual indexed points. Repeated values create repeated rows but do not delete observations or diagonal entries. The Gaussian matrix is symmetric with diagonal ones. Its shading means similarity on [0,1]; later minus signs in an accumulation are separate from this nonnegative similarity scale. The exact-cell table remains accessible when a narrow screen cannot display every label at once.

**State ownership.** L4a. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** indexed Gram anatomy: The eight-by-eight Gram matrix consists of XX, XY, YX and YY blocks. A selected cell connects to its two actual indexed points. Repeated values create repeated rows but do not delete observations or diagonal entries. The Gaussian matrix is symmetric with diagonal ones. Its shading means similarity on [0,1]; later minus signs in an accumulation are separate from this nonnegative similarity scale. The exact-cell table remains accessible when a narrow screen cannot display every label at once.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D30. reproducing operation

**Reading placement.** Before the matching `[[D30]]` interpretation in the manuscript. The learner sees: First use the finite feature model, where all vectors can be drawn exactly.

**Objects, operation, baseline, result and responsive contract.** Begin in exact finite feature space: g_v(x)=v·φ(x); k(x,·)has coefficientφ(x), so inner productg with k(x,·)evaluatesg(x). Draw coefficient arrow and projection for v=(0,1),x=−1 gives1. Then show the same operation symbolically inH without a fake finite geometric rendering. T/P. State PSD kernel/existence conditionE√k(X,X)<∞ and characteristic injectivity as separate ideas. Check finite identity; full Hilbert/Riesz proofs linked to their exact owner.

**Walk-through after the drawing.** The function g_v has coefficient vector v. The function k(x,·) has coefficient vector φ(x). Their coefficient inner product is v·φ(x)=g_v(x): taking an inner product with the feature of x evaluates the function at x. With v=(0,1) and x=−1 this gives one.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** reproducing operation: The function g_v has coefficient vector v. The function k(x,·) has coefficient vector φ(x). Their coefficient inner product is v·φ(x)=g_v(x): taking an inner product with the feature of x evaluates the function at x. With v=(0,1) and x=−1 this gives one.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D31. norm expansion

**Reading placement.** Before the matching `[[D31]]` interpretation in the manuscript. The learner sees: Treat each current list as a finite law assigning equal mass to every listed entry. We can calculate its feature-mean difference without explicitly constructing Gaussian features.

**Objects, operation, baseline, result and responsive contract.** Two empirical feature averages expand ||meanX−meanY||² into XX/n²+YY/m²−2XY/(nm). Use D29 blocks, include cross blocks once with2or both once, neverdoublecount. Draw three arithmetic bars with actual default pair averages andB=.450196…forσ1. M/R; each denominator readable. At this point B is exactly the squared norm between the two finite laws that assign equal mass to the listed points; name these empirical laws here, and defer sampling bias until §7. Check expansion and nonnegative-with-roundoff contract.

**Walk-through after the drawing.** Expanding the square produces within-X, within-Y and cross terms:

**State ownership.** L4a. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** norm expansion: Expanding the square produces within-X, within-Y and cross terms:

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D32. witness query

**Reading placement.** Before the matching `[[D32]]` interpretation in the manuscript. The learner sees: The feature-mean difference is also a function that can be evaluated at a query t. Trace its separate similarity contributions.

**Objects, operation, baseline, result and responsive contract.** At currentt=.0, show four kernel contributions fromX and four fromY, two averages and signed differencew(t). Link t on actual witness curve sampled on[−3,3]; sample markers retain actual x and only stack vertically for multiplicity. Querycontrol updates every contribution. Explain w(t)=〈meanX−meanY,k(t,·)〉and E_Xw−E_Yw=B; normalizedw/√Battains√BwhenB>0. P/R. Check default symmetricqueryvalue, selectedquery, identitygap, nullavoiddivision. Curve is not a density.

**Walk-through after the drawing.** For the empirical laws,

**State ownership.** L4a. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** witness query: For the empirical laws,

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D33. moment collision

**Reading placement.** Before the matching `[[D33]]` interpretation in the manuscript. The learner sees: Return to the matched-moment pair from section 4.

**Objects, operation, baseline, result and responsive contract.** Revisit D23 laws(±1fair) versus(−√2,0,√2 weights.25,.5,.25). Show first/second moment coordinates coincide but Gaussian witness/kernel sums distinguish them. Exact empirical listsX=(−1,−1,1,1),Y=(−√2,0,0,√2) retain weights. P/R; numerical root approximation stated in editable text. Check finitefeatureB0 and GaussianB>0. This shows characteristic population distinction, not guaranteed finite-sample test power.

**Walk-through after the drawing.** P places equal mass at ±1; Q places (.25,.5,.25) at (−√2,0,√2). Both have feature mean (0,1), so the two-feature norm is zero. Their Gaussian feature means differ. The duplicate lists (−1,−1,1,1) and (−√2,0,0,√2) encode the exact intended weights; entering decimal approximations to √2 introduces only the stated coordinate approximation.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** moment collision: P places equal mass at ±1; Q places (.25,.5,.25) at (−√2,0,√2). Both have feature mean (0,1), so the two-feature norm is zero. Their Gaussian feature means differ. The duplicate lists (−1,−1,1,1) and (−√2,0,0,√2) encode the exact intended weights; entering decimal approximations to √2 introduces only the stated coordinate approximation.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D34. locality

**Reading placement.** Before the matching `[[D34]]` interpretation in the manuscript. The learner sees: Bandwidth selects the locality of the same kind of observer.

**Objects, operation, baseline, result and responsive contract.** Three kernel profilesσ=.5,1,3 on same distance x-axis, plus defaultlaw empiricalB values.864832…,.450196…,.053435…. Mark fixed pair distance1 with exact similarities. P/R; profileheightalways1,σcontrolswidthnotamplitude. L4 changesσunder its picture. Check finite values from retained output; no universal rankingclaim or claim largeσalwaysgood.

**Walk-through after the drawing.** All three Gaussian profiles have height one at distance zero. Their widths change with σ. On the default outer-versus-inner lists, σ=.5,1,3 gives B≈.864832,.450196,.053435. Those values describe this particular pair under those kernels. A broad kernel may make a change small, and a very narrow kernel may treat almost every distinct pair as unrelated. Multiplying a kernel by c>0 multiplies MMD by √c, so raw magnitude is not a universal effect-size scale. Coordinate units and bandwidth must be reported together.

**State ownership.** L4a. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** locality: All three Gaussian profiles have height one at distance zero. Their widths change with σ. On the default outer-versus-inner lists, σ=.5,1,3 gives B≈.864832,.450196,.053435. Those values describe this particular pair under those kernels. A broad kernel may make a change small, and a very narrow kernel may treat almost every distinct pair as unrelated. Multiplying a kernel by c>0 multiplies MMD by √c, so raw magnitude is not a universal effect-size scale. Coordinate units and bandwidth must be reported together.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D35. delayed atom kernel

**Reading placement.** Before the matching `[[D35]]` interpretation in the manuscript. The learner sees: Now return to moving atoms with kernels fully defined. This later experiment has its own h and σ state and reset, independently of section 5.

**Objects, operation, baseline, result and responsive contract.** L3b is an independent experiment initialized at h=.5, σ=1, explicitly not synchronized with §5. Show the same equal-height lanes and two cross/self pairs: MMD²=2[1−exp(−h²/(2σ²))], with norm its square root. Compute stably using −2expm1(−h²/(2σ²)). P/R. Both h and σ are now taught and editable. Check the exact-zero null, continuity for small h, a bandwidth change and invariance when h and σ scale together.

**Walk-through after the drawing.** Each self pair contributes one, and both cross terms use exp(−h²/(2σ²)). Thus

**State ownership.** L3b. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** delayed atom kernel: Each self pair contributes one, and both cross terms use exp(−h²/(2σ²)). Thus

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D36. empirical distribution

**Reading placement.** Before the matching `[[D36]]` interpretation in the manuscript. The learner sees: The finite-law norm is exact for the listed observations. If those observations are random samples, we must also ask how the statistic relates to the unknown populations.

**Objects, operation, baseline, result and responsive contract.** Four indexed X observations with repeats map to masses 1/2 at −2,+2; independently, Y maps to masses 1/2 at −1,+1. Each sample contributes 1/4. R/T. Equal coordinates can still identify different experimental units; the empirical law merges their masses. Check counts, masses and the link to §6's exact finite-law B.

**Walk-through after the drawing.** Four X observations at (−2,−2,2,2) assign mass one quarter to each indexed observation, yielding empirical mass one half at each distinct location. Y does the same at −1,+1. Equal coordinates may belong to different experimental units. Merging their empirical masses does not erase the indices used in a sample calculation.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** empirical distribution: Four X observations at (−2,−2,2,2) assign mass one quarter to each indexed observation, yielding empirical mass one half at each distinct location. Y does the same at −1,+1. Equal coordinates may belong to different experimental units. Merging their empirical masses does not erase the indices used in a sample calculation.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D37. biased pair anatomy

**Reading placement.** Before the matching `[[D37]]` interpretation in the manuscript. The learner sees: Suppose X₁,…,Xₙ are iid from P and Y₁,…,Yₘ are iid from Q, independently of X. The empirical squared norm B from section 6 is a **biased estimator** of population MMD². The source of bias is visible in the pair matrix.

**Objects, operation, baseline, result and responsive contract.** Mark the included i=j diagonal in XX/YY; keep all cross pairs, including equal numerical coordinates. Draw a reused sample index for one diagonal. M. Explain n² ordered pairs, including both (i,j) and (j,i). Check variable group sizes 2–6, denominators and self-similarity.

**Walk-through after the drawing.** There are n² ordered within-X pairs. The n diagonal terms use the same draw twice, φ(Xᵢ)·φ(Xᵢ), whereas independent population pairs require distinct draws. Both (i,j) and (j,i) are included. All nm cross pairs use independent groups, including pairs that happen to have equal coordinate values. Bias concerns reused random variables, not numerical equality of their values.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** biased pair anatomy: There are n² ordered within-X pairs. The n diagonal terms use the same draw twice, φ(Xᵢ)·φ(Xᵢ), whereas independent population pairs require distinct draws. Both (i,j) and (j,i) are included. All nm cross pairs use independent groups, including pairs that happen to have equal coordinate values. Bias concerns reused random variables, not numerical equality of their values.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D38. U-statistic removal

**Reading placement.** Before the matching `[[D38]]` interpretation in the manuscript. The learner sees: To remove this bias, exclude only the within-group diagonals and change their denominators to count the remaining ordered pairs.

**Objects, operation, baseline, result and responsive contract.** Cross out only within-group diagonals and change their denominators to n(n−1),m(m−1), retaining all nm cross pairs. Initial matched X=Y=(−1,1), σ=1 gives B=0 and U=−(1−e^(−2)); a signed bar extends below zero. L4b starts here with its own declared reset state. M/R. Do not square-root, clamp or take the absolute value of U. Check the minimum two observations and the exact negative case; repeated-coordinate off-diagonals remain.

**Walk-through after the drawing.** For n,m≥2,

**State ownership.** L4b. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** U-statistic removal: For n,m≥2,

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D39. expectation bias

**Reading placement.** Before the matching `[[D39]]` interpretation in the manuscript. The learner sees: Separate a reused draw from an independent replica before expanding its expectation.

**Objects, operation, baseline, result and responsive contract.** Draw diagonal φ(X)·φ(X) versus independent-replica φ(X)·φ(X′), with counts n and n(n−1). Derive E B=MMD²+Var_H φ(X)/n+Var_H φ(Y)/m. T/M with counts preceding the visible formula. No fabricated Monte Carlo histogram. Define Hilbert variance and the finite second-moment assumption; the bounded RBF kernel satisfies it. A negative U realization does not imply a negative expectation.

**Walk-through after the drawing.** Among n² X pairs, n have expectation E‖φ(X)‖² and n(n−1) have expectation ‖μ_P‖². Their normalized difference from the population within term is

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** expectation bias: Among n² X pairs, n have expectation E‖φ(X)‖² and n(n−1) have expectation ‖μ_P‖². Their normalized difference from the population within term is

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D40. allocations

**Reading placement.** Before the matching `[[D40]]` interpretation in the manuscript. The learner sees: A positive statistic is not yet a test. Under H₀:P=Q, assume all observations are independent draws from that common law. Conditional on the pooled observations, assigning n of their indices to X is exchangeable: every allocation has the same conditional status under the null. Compute the same statistic for each allocation and compare the observed one with that reference.

**Objects, operation, baseline, result and responsive contract.** Eight fixed IDs 0–7 occupy the pool (−2,−1.5,−1,−.5,.5,1,1.5,2); observed X is IDs 0–3. Draw actual coordinates, current group colours and fixed IDs, with subset/complement pairing across the 70 allocations. Keep the observed assignment separately outlined. L5 begins only after exchangeability and the complete procedure are defined. P/R. Check all 70 unique index subsets, observed/complement inclusion and multiplicity when coordinates repeat. Inspection never redefines observed data.

**Walk-through after the drawing.** The eight fixed IDs 0–7 sit at (−2,−1.5,−1,−.5,.5,1,1.5,2). The observed X group is always IDs 0–3. There are C(8,4)=70 allocations, including the observed group and its complement. Current group colour changes when inspecting another allocation, while each observation's ID and coordinate stay fixed. This deliberate colour role is different from treating colours as immutable sample identities.

**State ownership.** L5. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** allocations: The eight fixed IDs 0–7 sit at (−2,−1.5,−1,−.5,.5,1,1.5,2). The observed X group is always IDs 0–3. There are C(8,4)=70 allocations, including the observed group and its complement. Current group colour changes when inspecting another allocation, while each observation's ID and coordinate stay fixed. This deliberate colour role is different from treating colours as immutable sample identities.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D41. exact upper tail

**Reading placement.** Before the matching `[[D41]]` interpretation in the manuscript. The learner sees: Inspecting an allocation changes the highlighted reference member; it does not redefine which data were observed. Repeated coordinate values keep their distinct IDs and allocation multiplicity. The eight coordinates can be edited directly, but the observed index set stays the first four.

**Objects, operation, baseline, result and responsive contract.** Display all 70 statistics as a sorted dot stack/rank plot with multiplicity, an observed line and the inclusive tail. Default σ=1 has observed 1.311848…, tail2 and p=2/70. P. Provide an accessible count/list and selected-allocation value; histogram bins never determine p. Include numerical ties within 1e−12 conservatively. An all-equal pool gives 70/70=1 and needs a finite fallback axis. Check every statistic recomputes after edits while observed group IDs stay fixed.

**Walk-through after the drawing.** At the initial σ=1, the observed B≈1.311848. Two of the seventy reference statistics are at least as large, so the inclusive right-tail p-value is 2/70≈.028571. The label-swap complement has the same score. Every statistic is represented with its multiplicity, and the exact numerical list determines the count, not histogram bins. The implementation includes values within 10⁻¹² below the observed score as numerical ties. If all coordinates are equal, every statistic is zero and p=70/70=1.

**State ownership.** L5. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** exact upper tail: At the initial σ=1, the observed B≈1.311848. Two of the seventy reference statistics are at least as large, so the inclusive right-tail p-value is 2/70≈.028571. The label-swap complement has the same score. Every statistic is represented with its multiplicity, and the exact numerical list determines the count, not histogram bins. The implementation includes values within 10⁻¹² below the observed score as numerical ties. If all coordinates are equal, every statistic is zero and p=70/70=1.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D42. selection as part of the statistic

**Reading placement.** Before the matching `[[D42]]` interpretation in the manuscript. The learner sees: Choosing bandwidth after seeing labels changes the procedure. If the declared statistic selects the largest score across several bandwidths, repeat that selection for every allocation.

**Objects, operation, baseline, result and responsive contract.** Show three scores per allocation at σ=(.3,1,3), their maximum and its winning bandwidth. Trace this operation for the observed and one other allocation. The tail uses the maximum for EVERY allocation. R/M. L5 adds fixed versus maximum-over-three modes only after this explanation. Switching mode resets the inspected index, preserving data. Verify the retained default and a new changed fixture. Do not offer a post-label minimum-p mode; exploration does not retroactively prespecify a test.

**Walk-through after the drawing.** For each split, compute B at σ=.3,1,3, then take the maximum. Apply this to both the observed allocation and every reference allocation. The interactive fixed-bandwidth and maximum-over-three modes expose this difference. Changing mode or bandwidth preserves the data and resets reference inspection. Neither mode retrospectively makes exploratory data choices prespecified.

**State ownership.** L5. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** selection as part of the statistic: For each split, compute B at σ=.3,1,3, then take the maximum. Apply this to both the observed allocation and every reference allocation. The interactive fixed-bandwidth and maximum-over-three modes expose this difference. Changing mode or bandwidth preserves the data and resets reference inspection. Neither mode retrospectively makes exploratory data choices prespecified.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D43. streaming blocks/API

**Reading placement.** Before the matching `[[D43]]` interpretation in the manuscript. The learner sees: The exact pair formula remains quadratic work, but it need not occupy a full quadratic array. The following complete ordinary-tool route evaluates the same sums in blocks and compares them with full Gram arrays.

**Objects, operation, baseline, result and responsive contract.** Use the existing library fixture x=(0,.2,.4), y=(1.2,1.4,1.6), σ=.5. Draw its 6×6 Gram in 2×2 tiles, visited row-major, feeding within/cross accumulators. Exclude diagonals only in self blocks for U. Label gamma=1/(2σ²)=2 at the kernel operation. M/T. The trace is computational, not elapsed-time evidence. Full bridge code/output follows: B=1.640442909, U=1.545416627, 20 allocations and p=.1. Check array shapes (n,d), agreement with the full Gram oracle, time O((n+m)²d), extra kernel memory O(B²), retained input memory and combinatorial exact-test cost. Keep the existing identical-sample/block-size task here.

**Walk-through after the drawing.** For x=(0,.2,.4), y=(1.2,1.4,1.6), σ=.5, divide pair matrices into tiles with at most two rows and two columns. Visit each tile, calculate squared Euclidean distances and Gaussian similarities, and accumulate its sum. Only self-block diagonal entries are excluded for U. With a general block width b, the extra kernel arrays occupy O(b²) memory in addition to the input samples; all pairs still require O((n+m)²d) arithmetic for d features.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** streaming blocks/API: For x=(0,.2,.4), y=(1.2,1.4,1.6), σ=.5, divide pair matrices into tiles with at most two rows and two columns. Visit each tile, calculate squared Euclidean distances and Gaussian similarities, and accumulate its sum. Only self-block diagonal entries are excluded for U. With a general block width b, the extra kernel arrays occupy O(b²) memory in addition to the input samples; all pairs still require O((n+m)²d) arithmetic for d features.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D44. conjugate line

**Reading placement.** Before the matching `[[D44]]` interpretation in the manuscript. The learner sees: The IPM used the same score linearly under both laws. An f-divergence also permits a critic formulation, but Q supplies a nonlinear penalty. Begin with a line lying below a convex curve.

**Objects, operation, baseline, result and responsive contract.** Plot raw f(u)=u ln u on positive u up to3, with tangent at u*=1.75, slope T*=1+ln1.75 and intercept −f*(T*)=−1.75. Draw the vertical gap between curve and line at another u. P. Allow negative f below1; do not mix centered and uncentered generators. The supporting line motivates the inequality before the supremum defines f*. Check derivative, intercept and the below-curve relation; endpoints use limits.

**Walk-through after the drawing.** Use the **raw** KL generator f(u)=u ln u. At u*=1.75, its tangent slope is T*=1+ln 1.75 and its vertical intercept is −1.75. The line touches the curve there and stays below it elsewhere. Negative curve values for 0<u<1 are legitimate for this raw generator. We changed from the centered generator intentionally; conjugates depend on that choice even when divergence totals agree.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** conjugate line: Use the raw KL generator f(u)=u ln u. At u*=1.75, its tangent slope is T*=1+ln 1.75 and its vertical intercept is −1.75. The line touches the curve there and stays below it elsewhere. Negative curve values for 0<u<1 are legitimate for this raw generator. We changed from the centered generator intentionally; conjugates depend on that choice even when divergence totals agree.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D45. reward/penalty

**Reading placement.** Before the matching `[[D45]]` interpretation in the manuscript. The learner sees: Maximize ut−u ln u over positive u. The derivative is t−ln u−1, so the maximizer is u=exp(t−1). Substitution yields f*(t)=exp(t−1), and the optimal slope is T*=1+ln(p/q). Inspect the row arithmetic for the original positive A–C laws.

**Objects, operation, baseline, result and responsive contract.** With fixed three-coordinate P/Q, use T_i=1+a ln(p_i/q_i)+c, initially a=1,c=0. Draw signed p_iT_i bars and positive q_i exp(T_i−1) bars on one nats axis; subtract per row and sum. L6 follows the derivation. R. Display the dynamic common axis maximum. P colour denotes reward and Q penalty, with independent sign labels. Check every row, true KL .208473… and zero optimum gap.

**Walk-through after the drawing.** Each row receives P-weighted reward pᵢTᵢ and Q-weighted penalty qᵢexp(Tᵢ−1). Reward may be negative, while the penalty is positive. Subtract row by row and add to obtain a lower bound on the true KL=.208473 nats. The live critic Tᵢ=1+a ln(pᵢ/qᵢ)+c begins at a=1,c=0, where the gap is zero. Changing a or c updates every reward, penalty and total. The constant-critic control gives a=0,c=0, hence T=1 and bound zero. Reset restores the optimum.

**State ownership.** L6. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** reward/penalty: Each row receives P-weighted reward pᵢTᵢ and Q-weighted penalty qᵢexp(Tᵢ−1). Reward may be negative, while the penalty is positive. Subtract row by row and add to obtain a lower bound on the true KL=.208473 nats. The live critic Tᵢ=1+a ln(pᵢ/qᵢ)+c begins at a=1,c=0, where the gap is zero. Changing a or c updates every reward, penalty and total. The constant-critic control gives a=0,c=0, hence T=1 and bound zero. Reset restores the optimum.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D46. shift gap

**Reading placement.** Before the matching `[[D46]]` interpretation in the manuscript. The learner sees: An additive constant cancels from an IPM expectation difference because both laws have mass one. It does not cancel from the exponential penalty.

**Objects, operation, baseline, result and responsive contract.** At a=1 plot c∈[−2,2] against exp(c)−1−c, zero at c=0. Mark c=.5 giving gap .148721… and bound .059752…. Link the current L6 offset to the curve. P. Gap and bound have separate labeled rows/plots. Check c=−.5, stable expm1 and invariant true KL. For a≠1, explicitly say the shift-only curve is not the total gap.

**Walk-through after the drawing.** At a=1, adding c changes the bound to KL+c−exp(c)+1. Its gap is exp(c)−1−c≥0, since exp(c)≥1+c. At c=.5, gap≈.148721 and bound≈.059752. The curve has its minimum at c=0. Numerically, `expm1(c)-c` avoids cancellation for a small shift. For a≠1, this shift-only curve is not the total critic gap; the scale has changed the critic as well.

**State ownership.** L6. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** shift gap: At a=1, adding c changes the bound to KL+c−exp(c)+1. Its gap is exp(c)−1−c≥0, since exp(c)≥1+c. At c=.5, gap≈.148721 and bound≈.059752. The curve has its minimum at c=0. Numerically, `expm1(c)-c` avoids cancellation for a small shift. For a≠1, this shift-only curve is not the total critic gap; the scale has changed the critic as well.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D47. three objectives

**Reading placement.** Before the matching `[[D47]]` interpretation in the manuscript. The learner sees: Separate the unrestricted population divergence, a restricted population critic value, and a critic selected and evaluated on the same finite observations.

**Objects, operation, baseline, result and responsive contract.** A finite critic grid compares constant T=1 and optimal T*, with exact known-law objectives 0 and .208473…. Beside it show a distinct sample-overfit construction: true P=Q=(.5,.5), observed one P=A and one Q=B, T(A)=t,T(B)=1. Its empirical objective is t−1 while the population objective is .5t−.5exp(t−1)≤0. Plot both for t∈[1,4]. P/R. Label population and empirical curves separately from P/Q identity. Check true KL0 and positive sample objectives; this chosen realization is not a frequency claim. A new bounded arithmetic check is required. No fitted model or extra lab.

**Walk-through after the drawing.** For the original known laws, T=1 gives zero while T* attains KL. Now change to a counterexample with true P=Q=(.5,.5). Suppose the observed P sample contains only A and the observed Q sample only B. Choose T(A)=t and T(B)=1. Its empirical objective is t−1, which is positive for t>1. Its population objective is instead

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** three objectives: For the original known laws, T=1 gives zero while T* attains KL. Now change to a counterexample with true P=Q=(.5,.5). Suppose the observed P sample contains only A and the observed Q sample only B. Choose T(A)=t and T(B)=1. Its empirical objective is t−1, which is positive for t>1. Its population objective is instead

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D48. optimal discriminator

**Reading placement.** Before the matching `[[D48]]` interpretation in the manuscript. The learner sees: In the original equal-mixture GAN discrimination problem, D(x) predicts whether an observation came from P rather than Q. The population log objective is E_P ln D+E_Q ln(1−D).

**Objects, operation, baseline, result and responsive contract.** For A/B/C draw P/Q masses and D*=p/(p+q)=(.63636…,.285714…,.5). P's proportion within each combined-mass column represents the equal-prior posterior. Split the log ratios using M=(P+Q)/2 and sum to −ln4+2JS=−1.278448…. R/T. Check D=0/1 support limits and the irrelevant common-zero case in text. Distinguish the non-saturating generator objective; retain the whole variational programme without claiming neural training.

**Walk-through after the drawing.** For each positive-mass outcome, maximizing p ln D+q ln(1−D) gives p/D−q/(1−D)=0, hence D*=p/(p+q). The P fraction within each combined-mass column is the equal-prior posterior. On A–C it is approximately (.636364,.285714,.5). A support boundary gives zero or one under the limiting convention 0 ln 0=0; a common-zero outcome has no effect.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** optimal discriminator: For each positive-mass outcome, maximizing p ln D+q ln(1−D) gives p/D−q/(1−D)=0, hence D*=p/(p+q). The P fraction within each combined-mass column is the equal-prior posterior. On A–C it is approximately (.636364,.285714,.5). A support boundary gives zero or one under the limiting convention 0 ln 0=0; a common-zero outcome has no effect.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D49. importance correction

**Reading placement.** Before the matching `[[D49]]` interpretation in the manuscript. The learner sees: Suppose observations come from proposal Q but the desired expectation is under P. If P≪Q, use the weight w=p/q; then E_Q[wh]=E_P[h] whenever the expectation is well-defined.

**Objects, operation, baseline, result and responsive contract.** P=(.9,.1), Q=(.99,.01), then Q=(.999,.001). Draw proposal probabilities, not invented sampled counts; rare weights rise 10→100, feeding weighted second-moment bars. R. E_Qw=1 while Var_Qw rises .818182…→9.810811…. The integrand h has a separate effect. Check the χ² identity and P≪Q condition; self-normalization has a different contract. The complete weights programme follows the local expansion D50.

**Walk-through after the drawing.** For P=(.9,.1), proposal Q=(.99,.01) gives the rare outcome weight ten. Reducing its proposal probability to .001 raises the weight to one hundred. These are proposal probabilities, not invented sample counts. The mean weight remains one, while its variance rises from about .818182 to 9.810811.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** importance correction: For P=(.9,.1), proposal Q=(.99,.01) gives the rare outcome weight ten. Reducing its proposal probability to .001 raises the weight to one hundred. These are proposal probabilities, not invented sample counts. The mean weight remains one, while its variance rises from about .818182 to 9.810811.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D50. local curvature

**Reading placement.** Before the matching `[[D50]]` interpretation in the manuscript. The learner sees: Fix a positive reference Q=(.5,.3,.2) and move along direction δ=(1,−1,0), writing P=Q+εδ.

**Objects, operation, baseline, result and responsive contract.** Fix Q=(.5,.3,.2), δ=(1,−1,0); compare KL(Q+εδ||Q) to ε²Σδ²/q/2 for ε∈[0,.02]. A separate ratio view uses ε=.02,.01,.001 and retained values 1.009469,1.004587,1.000446. P/R. At ε=0 label the limit1 rather than dividing0/0. Explain fixed positive Q and twice-differentiable f; nonsmooth TV is excluded. Check positivity and local, not global, interpretation.

**Walk-through after the drawing.** The total mass stays one because Σδ=0. For small ε the ratio is 1+εδᵢ/qᵢ. If f is twice differentiable near one, Taylor expansion gives a constant term zero, a linear sum that cancels, and

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** local curvature: The total mass stays one because Σδ=0. For small ε the ratio is 1+εδᵢ/qᵢ. If f is twice differentiable near one, Taylor expansion gives a constant term zero, a linear sum that cancels, and

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D51. rare costly miss

**Reading placement.** Before the matching `[[D51]]` interpretation in the manuscript. The learner sees: Return to named outcomes: P assigns .01 probability to a rare failure and Q assigns zero. Attach a cost to the event before interpreting the discrepancy.

**Objects, operation, baseline, result and responsive contract.** P=(.99,.01), Q=(1,0). Show the rare .01 probability on an exact numeric scale and an explicitly magnified inset. Attach cost100 to that outcome, giving risk1 versus0. Next show the binomial zero-count probability .99^20=.817907…. R/P. Check TV=.01, JS=.003478…, KL=∞ and range×TV=1. Small aggregate discrepancy does not determine cost or guarantee an observed rare event.

**Walk-through after the drawing.** TV=.01 and JS≈.003478 nats, while forward KL is infinite. A failure cost of one hundred produces risk one under P and zero under Q. The exact range-times-TV bound is 100×.01=1. An inset may magnify the small mass for inspection, but its scale must say so; cost is not encoded by secretly enlarging a probability bar.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** rare costly miss: TV=.01 and JS≈.003478 nats, while forward KL is infinite. A failure cost of one hundred produces risk one under P and zero under Q. The exact range-times-TV bound is 100×.01=1. An inset may magnify the small mass for inspection, but its scale must say so; cost is not encoded by secretly enlarging a probability bar.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D52. matched marginal/different pairing

**Reading placement.** Before the matching `[[D52]]` interpretation in the manuscript. The learner sees: The rate–distortion lesson provides a particularly small pairing example. Let X be a fair sign and Y its proposed reconstruction.

**Objects, operation, baseline, result and responsive contract.** Four joint cells for independent fair X,Y∈{−1,+1}, each .25; both marginals match, yet squared-error cells (0,4,4,0) average2. Compare identity coupling with diagonal cells .5/.5 and MSE0, keeping the same marginals. M/R. Reintroduce X/Y as source/reconstruction roles; they are not the previous P/Q sources. Check both joint laws and errors. This is the exact RD bridge, not another solver.

**Walk-through after the drawing.** If Y is an independent fair sign, both marginal laws match exactly. The four joint cells each have mass .25, and their squared errors are (0,4,4,0), averaging two. If Y=X, the joint law instead has diagonal masses .5,.5 and mean squared error zero, with the same two marginals. A marginal comparison cannot select between those couplings. The task must state whether it concerns output frequencies or paired reconstruction fidelity.

**State ownership.** Static; no learner control. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** matched marginal/different pairing: If Y is an independent fair sign, both marginal laws match exactly. The four joint cells each have mass .25, and their squared errors are (0,4,4,0), averaging two. If Y=X, the joint law instead has diagonal masses .5,.5 and mean squared error zero, with the same two marginals. A marginal comparison cannot select between those couplings. The task must state whether it concerns output frequencies or paired reconstruction fidelity.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

### D53. observed Iris geometry

**Reading placement.** Before the matching `[[D53]]` interpretation in the manuscript. The learner sees: The corrected UCI Iris dataset contains 150 flowers, fifty from each of three named species, with four measurements in centimetres. Its original classification context differs from this descriptive comparison of finite empirical laws. Use the supplied CSV and retain original row IDs.

**Objects, operation, baseline, result and responsive contract.** L7 plots the actual 100 rows, initially P=setosa circles and Q=versicolor squares, sepal coordinates in cm and σ=1. B=.6622804839…; petal coordinates give1.7166120981…. A selected row pair has a distance connector and similarity readout. All IDs are available through focus/selection; axes and bandwidth ruler convert together to mm. Self-comparison explicitly makes both samples the same setosa rows and gives B=0. P/M. Duplicate coordinates use counts and an accessible row list rather than distance-changing jitter. Check CSV identity, counts, finite coordinates, coordinate-plus-bandwidth scaling invariance and the null. Values are descriptive; a larger B is not a universal method ranking or population test.

**Walk-through after the drawing.** Initially P is the fifty setosa rows and Q the fifty versicolor rows. Plot sepal length and width in centimetres and use Gaussian σ=1 cm. The empirical squared MMD is .6622804839. Changing to petal length and width with the same physical bandwidth gives 1.7166120981. This is a change of measured representation, not a universal ranking of methods. Identical coordinates retain multiplicity through counts and row lists; distance-changing jitter would alter the comparison.

**State ownership.** L7. Follow its exact staged controls and reset below; do not expose quantities before their manuscript introduction.

**Accessible text and correspondence.** observed Iris geometry: Initially P is the fifty setosa rows and Q the fifty versicolor rows. Plot sepal length and width in centimetres and use Gaussian σ=1 cm. The empirical squared MMD is .6622804839. Changing to petal length and width with the same physical bandwidth gives 1.7166120981. This is a change of measured representation, not a universal ranking of methods. Identical coordinates retain multiplicity through counts and row lists; distance-changing jitter would alter the comparison.

Use the shared P amber circle / Q cyan square identity unless this contract explicitly changes the role. Retain labels, fixed IDs, signs, units and baseline. Selection adds a neutral outline; never recolour all selected observations into the same semantic group.

Read actual paint at desktop and normal sidebar content widths, 390 px phone and 768 px/root 32. Check readable object identities, true geometry, connector endpoints, sign/boundary markers and adjacent arithmetic. For live stages also inspect a meaningful edit, null/reset, keyboard access and exact table.

## Complete investigation contracts

1. **L1 ratio (D03/D07 live mount after all six definitions).** Initial P weights [7,2,1,0], Q [4,5,1,0], kind KL. Four numeric fields per law accept finite 0..100, with positive values at least 1e−8; normalize once per law. A temporarily empty or invalid field shows local feedback and keeps the last valid state; a valid completed edit updates all rows and metrics immediately, without an Apply or prediction gate. Show raw weights and normalized masses together. Offer six generators, swap laws, remove Q support at A, and reset. The model retains its 2–8 category domain for code; this UI explicitly uses four. A common-zero ratio is undefined with contribution zero; infinity is never clamped. Reset restores fields, generator, selection and errors. Equal weights yield zero; removing Q support gives infinite forward KL but finite JS; swapping exchanges the KL directions. These are retained model contracts; new input wiring requires runtime checks.
2. **L2 observer (D18–22 staged).** State: default P/Q weights [4,1,1,4]/[1,4,4,1], event mask [1,0,0,1], linear slope 0, Lipschitz adjacent slopes [−1,0,1]. Positions remain −3,−1,1,3. The event mount exposes mask and weights only; linear and slope mounts follow their definitions. Use one shared state owner within this investigation, labeling later mounts as the same current laws. Later controls are absent from earlier mounts. Each stage resets its function; a separate Reset observer experiment restores all shared state. The attained gap Σ(p−q)g is signed, while the class supremum TV, absolute mean gap or W1 is nonnegative. Label an absolute gap separately if shown; never call an arbitrary current gap optimal. Event toggles and numeric/range slopes edit real entities. Weight validation follows L1. The spread fixture gives linear 0, event .6 and optimal Lipschitz 1.2; the zero function gives 0; shifted δ−1/δ+1 with linear slope −1 attains 2. Keep the current function after edits rather than automatically optimizing it. Check every pairwise Lipschitz constraint, the anchor g0=0 and reset.
3. **L3 moving atoms (D24 early; D35 late).** Two explicitly independent experiments. L3a starts h=.5, domain [0,3], step .01, range/numeric input and an exact-zero button. It shows KL, TV, JS and W1 only. L3b has its own h=.5 and σ=1, with σ in [.2,3], step .1 and numeric input. It adds MMD² and its root only after kernel teaching. Reset affects only the current experiment. D25 stays a static coarsening comparison. Invalid/nonfinite values keep the last valid state with feedback. Both unit masses, coincidence and small-h limits remain visible; σ changes the mathematical comparison, not just its display.
4. **L4 kernel/witness (D28–34 early; D38 late).** L4a starts with the four-plus-four lists from D29, RBF, σ=1, query t=0 and pair X0/Y0. Valid lists have 2–6 finite positions in [−3,3]; completed valid edits update immediately, while transient invalid text keeps the last valid sample and shows feedback. Kernel selection appears only after all three formulas. Disable σ for non-RBF kernels with an explanation. Stage controls precisely: D28 permits pair selection and bandwidth, D29 adds sample edits and Gram selection, D31 adds B and its root, and D32 first exposes the query input and witness contributions. Keep one shared L4a state across these mounts, naming it locally; no U labels occur in §6. Zero B shows a zero witness and explains why normalization is undefined. L4b is an explicitly independent estimator experiment after D38, starting with identical two-point samples and σ=1; it shows B, U and diagonal exclusion. Optional presets supplement real edits. Reset restores every local field, selection and error. State the plotted query interval without claiming unseen tails. Reuse unchanged arithmetic evidence; check new selected-query, null and wiring behavior.
5. **L5 exact permutation (D40–42).** Eight editable finite coordinates in [−3,3], with fixed IDs 0–7 and duplicates allowed. Observed X IDs remain 0–3 regardless of inspection. Start with the stated pool, fixed mode, σ=1 and allocation 0. Fixed σ choices are .3, 1 and 3; complete-selection mode takes the maximum over exactly those three values and hides the irrelevant fixed-σ control. Recompute all 70 statistics after any valid data, mode or σ edit. Allocation 0–69, numeric/range and Previous/Next only inspect the reference. Mode/σ changes reset inspection to 0 and preserve the pool; full reset restores pool, mode, σ, index and errors. Enumeration is immediate and bounded, with no random seed. All equal observations yield zero statistics and p=1; the plot needs a finite fallback axis. Keep the 1e−12 inclusive numerical-tie convention and the original allocation. Retained default output is reusable; a changed pool/selection case requires a new bounded oracle. Display the statistic and assumptions with p. Interactive exploration is not retrospective prespecification.
6. **L6 variational (D45–46).** Fixed positive three-coordinate P/Q. Critic scale a∈[0,1.5], step .05; offset c∈[−2,2], step .1; initial a=1,c=0. Numeric/range controls update reward, penalty and gap immediately. Constant critic sets 0/0; optimum/reset sets 1/0. Signed rewards remain signed; the bounded domain keeps exp finite. Show the shift-only gap formula as the total gap only when a=1, explaining the distinction otherwise. Reset errors and selection. True KL remains fixed. Reuse the four old fixture pairs and check the negative-offset practice calculation; no optimizer or fitting campaign.
7. **L7 Iris (D53).** Use the fixed retained 100 rows. Default: sepal coordinates, physical bandwidth 1 cm, display cm, setosa versus versicolor, first row of each group selected. Select sepal/petal coordinates, physical bandwidth .1..3 cm with step .1, display cm/mm, or the explicit same-setosa baseline. Unit display multiplies all coordinates and displayed σ by ten while preserving physical state. Accessible row lists and point focus select an actual pair. Self-comparison clearly names both samples as the same 50 setosa rows and keeps valid row selections. Always show axis and bandwidth units. Wrong-unit diagnosis belongs to T13, not a hidden bug switch. Compute from the exact data or a checksummed coordinate extraction; do not import another lesson's hidden JS. Reset all inputs and IDs. The new complete programme and library oracle establish results; the bounded design fixture currently supports the proposed contrast only. Changing features changes the comparison; coordinated unit changes do not; self-comparison gives B=0. No p-value or extra species selector is needed in the lab.


## Model, numerical and implementation boundaries

The finite old models are preserved evidence, not a promise that existing UI wiring implements these new contracts. Extend topic-owned pure state for arbitrary legal observers, selected witness queries, complete permutation selection, independent state owners and Iris row geometry. Reuse valid arithmetic and retain its stated finite domain. Do not route two visually similar mounts to one state when this specification says independent.

Every number in a plot, exact table, accessible description and result must come from the same current state. Current selected coordinates, sample IDs, normalized weights and source law roles must survive meaningful edits and reset. Repeated observations are indexed units. At coincidence use labels/counts or separate lanes without falsifying numeric coordinates.

Use separate labelled axes for probabilities, generator heights, signed row contributions, similarities, critic scores, norm estimates and p-values. Show infinity as an extended result, not a clipped finite bar. Zero and unavailable conditionals are different states. A sequential similarity scale uses 0–1 only for RBF; linear/quadratic similarities need their actual signed domains.

For sample estimates, include actual diagonal values for non-RBF kernels and retain every cross pair. B may be clamped only for bounded negative roundoff after checking the error threshold; U remains signed. The witness normalization is unavailable at B=0. Query curves have a declared finite plotting interval.

The accepted root/design fixture receipts and original numerical output are reusable for their unchanged inputs. The two new teaching mains and changed-practice main were executed once with exact receipts. Their outputs are literal recorded data. No runtime build, download or clipboard acceptance follows from those Python executions.

## Programme and practice delivery

Render all thirteen teaching/programme pairs (including the retained exact-test practice programme), the complete new practice file/output, and the importable blockwise helper exactly as projected in the manuscript. Copy and Download must return the complete source bytes, with explicit live feedback. Provide the exact offline CSV and attribution; keep helper filenames/imports intact. No whole-public-tree copy is needed.

The ten original final tasks remain intact in meaning; four additional implementation tasks have full solutions and a complete runnable exercise file. The separate block-size task remains in section 7. Only hints and solutions use native disclosures; prompts remain visible. Shared endings distinguish Further learning, Technical references, Files/setup and Readiness. Keep future GAN training instructions intact.
