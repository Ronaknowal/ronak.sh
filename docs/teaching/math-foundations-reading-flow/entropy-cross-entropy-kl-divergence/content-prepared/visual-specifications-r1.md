# Entropy content visual and interaction specifications

Source: manuscript-complete-r1.md. These are actionable content contracts for private implementation after independent content release; no drawing, controls or native geometry is certified here. All46 markers are ordered in the manuscript, with an introductory sentence before each and the interpretation after it. Drawing labels belong to the actual objects, while extended explanation remains ordinary prose.

## Shared reader and colour contract

Neutral charcoal canvas; outcome A/B/C/D identities amber #E6AD55, blue #79B8E8, lavender #BAA4E8, coral #E79584, each additionally a letter and stable row position. P/source solid and Q/model dashed retain those identities. H/CE/KL are named quantities on common scales, not new outcome hues. Selected object uses outline/underline; keyboard focus is separate. Observed species: Adelie amber/circle, Chinstrap blue/square, Gentoo lavender/triangle. New examples explicitly name their encoding; no green/olive decoration.

Every plotted finite quantity uses a true zero and declared units. Do not assign a minimum positive height to a zero or tiny value. Infinity uses an unbounded continuation and text, not a fabricated finite bar. An inaccessible zero-mass conditional is labelled unavailable. Small objects keep their magnitude; leaders place text outside them.

Implement ordinary width plus390px and768px at200%actual text enlargement. Font sizes inherit the reader; no fixed typography that defeats enlargement. At these states preserve complete object labels, no clipping/collision, and no horizontal page overflow. Prefer stacking views and rotating the computational arrangement to shrinking text. Short math remains inline or normal display; only genuinely long code/table surfaces may scroll within their own named region.

Figures are unframed within reading flow. Give every SVG an accessible title and descriptive text containing the operation and important values. Interactive output is also available as ordinary DOM text or a compact table; focusable controls have explicit labels and associated validation text. Do not rely on hover, colour, animation or pointer precision alone. Reduced motion uses immediate state changes. Use actual button/range/number/select controls only where specified, after the first visible output; no prediction/reveal gate.

The selected source models contain tested numerical contracts. Reuse those functions when unchanged; targeted extensions require source-bound complementary checks and declared fixtures. No old full main replay is needed for layout changes. Figures that use a source/model preset must derive every displayed value from that active state so labels cannot silently diverge from geometry.

## Per-placement drawing contracts

### E01 — A complete source before an observed string

Placement lead: Our device can send A, B, C or D. The source describes how frequently each would occur over repeated draws.

Draw: Eight equal area cells in one unit strip; A occupies4, B2, C1, D1. Braces label probabilities1/2,1/4,1/8,1/8. Below it draw the actual eight positions of AAAABBCD, each with a separate index, so law and deliberately constructed observation are distinct objects.

Encoding: Area means probability only in the upper strip; lower cells are sequence positions. Keep A–D colour and letter identities in both.

Required mathematical checks: Counts4+2+1+1=8 and total probability1; observation is not a random-sample claim.

Narrow/enlarged arrangement: At narrow widths use two complete labelled rows for law and sequence, never wrap one probability strip into a different area scale. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: A occupies half the probability strip, B a quarter, and C and D an eighth each. Together the masses sum to one. A **distribution** assigns such probabilities to the possible outcomes. We write P(x) for the mass of outcome x under source P. The letters name categories; A is not numerically closer to B than to D. The strip describes the law, not a promise that every eight-symbol message will contain exactly four As.

### E02 — Read probability through binary choices

Placement lead: Each time we halve a probability, we need one more equally weighted binary choice to identify that outcome.

Draw: A probability ruler at1,1/2,1/4,1/8 aligns with a binary-depth ruler0,1,2,3. Draw three successive halves of an eight-cell set, with the selected nested subset visible.

Encoding: Ruler spacing is log-probability spacing, explicitly named; nested cells expose why three halvings isolate one of eight.

Required mathematical checks: Each halving adds one bit; select probability1/8 and trace to3.

Narrow/enlarged arrangement: Stack the two rulers with vertical leaders; retain all four tick labels outside cell geometry. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Probability1/2 corresponds to one such choice,1/4 to two and1/8 to three. A logarithm reverses the power: because2⁻³=1/8, −log₂(1/8)=3. We call −log₂P(x) the outcome's **surprisal**, measured in **bits**. At this point “bit” names an information unit; it does not yet guarantee an integer number of transmitted digits.

### E03 — Multiply conditional factors, add log prices

Placement lead: Why should information use a logarithm? Follow two choices along one path.

Draw: Draw a rooted two-stage probability tree. First choose a fair bit; each child branches into a second fair bit, leaf mass1/4. Highlight path01 with factors1/2×1/2 and costs1+1. Beside it draw copied-bit channel: after first0 only second0 is possible, conditional mass1.

Encoding: First-stage identity is preserved into both trees; edge labels are conditional probabilities, leaf labels joint probabilities. Impossible copy edges are absent or explicitly zero dashed, never equal live branches.

Required mathematical checks: Independent pair01 has surprise2; copied pair00 has joint probability1/2 and surprise1.

Narrow/enlarged arrangement: Stack independent and copied trees vertically; use actual shared parents and distinct child edges, not two prose columns. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: An independent first event has probability1/2 and the second1/4. Their joint probability is1/8; their information adds as1+2=3bits. The product rule and logarithm rule agree:

### E04 — Convert units and approach a support boundary

Placement lead: Information has a unit because we choose the logarithm's base.

Draw: Align bit marks0,1,2,3 with nat marks0,ln2,2ln2,3ln2 on corresponding rulers. An adjoining p→0 positive sequence1/2,1/4,1/8,… has a rising surprise ray with an open continuation, not a finite infinity tick.

Encoding: The shared selected event is a labelled point; units are in axis titles. Source probability0 has no finite surprise endpoint.

Required mathematical checks: I_nat=ln2×I_bit; p1 gives0; no log0 numeric evaluation.

Narrow/enlarged arrangement: Use two horizontal rulers and a separate short limiting sequence below; write infinity in text outside any finite bar. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Base2 gives bits. The natural logarithm, ln with base e, gives **nats**. One bit equals ln2≈.693147nats; divide nats by ln2 to express the same amount in bits. The two rulers identify the same probability with different numerical units. Keep the base consistent within a sum or comparison.

### E05 — Compute expectation by area and sum

Placement lead: One rare outcome can be very surprising while making only a small contribution to an average. Weight its price by how often it occurs.

Draw: Four aligned rows show width p_i, height I_i and a rectangle with area p_i I_i. A/B/C/D widths.5/.25/.125/.125 and heights1/2/3/3. Their area-labelled contributions .5,.5,.375,.375 join into a1.75-bit ruler; show the2.25 unweighted mean as a separately labelled wrong comparison.

Encoding: One common horizontal probability scale and vertical price scale; identity fills stay consistent. Leaders from areas to total segments identify the summands.

Required mathematical checks: Weighted total1.75; unweighted(1+2+3+3)/4=2.25.

Narrow/enlarged arrangement: At390 use four full-width rows followed by the total; preserve scale and do not shrink labels into small rectangles. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Each rectangle has width P(x), height −log₂P(x), and area equal to their product. A contributes.5×1=.5bit per draw; B contributes.25×2=.5; C and D each contribute.125×3=.375. The four areas sum to **1.75bits per symbol**. Giving every category equal weight would incorrectly produce(1+2+3+3)/4=2.25.

### E06 — Rare observation versus typical mean

Placement lead: A biased coin makes the distinction particularly clear.

Draw: Draw the two coin probability rectangles, their log prices and weighted areas, followed by H(p) over0…1. Current p marker connects to the computed H ordinate; rare-event price is a separate scale, not confused with entropy. Controls sit below the linked drawing.

Encoding: Heads amber/circle and tails blue/square remain constant when probabilities swap. Selection ring does not recolour identity.

Required mathematical checks: Defaultp.9: H.468995594, rare price3.321928095; swap.1 sameH; .5 H1;0/1 mean0 with excluded price∞.

Narrow/enlarged arrangement: Stack contributions over curve at narrow widths; endpoint labels external and explicit, no perplexity readout here. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: At heads probability.9, a rare tail has about3.322bits of surprise but occurs only.1 of the time. Its weighted contribution is about.3322. Heads contributes about.1368, giving entropy.468996bits. Change the heads probability in the investigation: the picture separates each outcome's price from its contribution, then locates their total on the entropy curve. Swapping.9 and.1 changes which outcome is rare but leaves the total unchanged. A fair coin has one bit.

### E07 — Concavity concerns mixing distributions

Placement lead: Compare two certain but different outcomes with a random choice between their laws.

Draw: Left draw g(p)=−p ln p with open analytic continuation to g(0)=0; right H2(p) and the chord joining p.1/.9, plus midpointp.5. Dashed chord sits below H.

Encoding: Axes distinguish a single nats summand from full binary bits entropy. No common unnamed vertical scale.

Required mathematical checks: g tends0 at0; H(.1)=H(.9)≈.468996 while H(.5)=1. Averaging laws differs from averaging outcomes.

Narrow/enlarged arrangement: Two separate stacked plots with full titles/axes at narrow width; do not reuse a curve with silently changed quantity. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Each certain law has entropy0, but an equal mixture of them is a fair bit with entropy1. The curve lies above the chord joining the component entropies. More generally entropy is **concave** in a finite probability vector. The summand g(p)=−p ln p has second derivative−1/p for p>0; summing these concave terms preserves concavity, and the continuous endpoint limit handles zero masses. Mixing laws and averaging their separate uncertainty are different operations.

### E08 — Prefix tree anatomy

Placement lead: We now need an actual message the receiver can decode. Assign a binary string to each status symbol.

Draw: Actual rooted binary tree with edges0/1 and leaves A0,B10,C110,D111 at depths1/2/3/3. Show internal nodes without output labels and one highlighted path toC. Place each outcome beside its leaf rather than floating in a legend only.

Encoding: A–D colours and letters as E01; edge bit labels neutral. Leaf depths count transmitted bits; no visual edge-length claim beyond level spacing.

Required mathematical checks: No leaf lies on another leaf path; attempted A0/B01 would require continuing through a leaf and is shown as a small crossed collision atA.

Narrow/enlarged arrangement: Use a top-down tree at all widths, with longer vertical spacing under enlarged text and leaf labels below nodes. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The root is the start of a word. A0-edge or1-edge chooses a branch. The leaves name A=0, B=10, C=110 and D=111. A **codeword** is the complete bit string from root to its leaf. This code is **prefix-free**: no complete word is the beginning of another complete word. An internal node therefore cannot also be a symbol leaf. The receiver must know this same codebook.

### E09 — Trace actual decoding

Placement lead: Follow a full stream and see where the receiver can emit a symbol.

Draw: Draw the complete bit stream for AAAABBCD and the same tree. Current bit position is underlined; consumed path edges highlighted; emitted symbols occupy a separate output strip. Reset-to-root arcs are local and appear only at completed leaves. Initial state exposes full encoded stream and output expectation without requiring a click.

Encoding: Bit groups follow actual codeword completions; whitespace is a display aid, not a transmitted delimiter. Preserve letter/colour identities.

Required mathematical checks: Encoded length14; empty message0; D path111; new message clamps current step. Incomplete externally supplied11 is diagnosed in practice.

Narrow/enlarged arrangement: At390 put full stream in naturally wrapped codeword groups, tree beneath; tree step remains visible and output text wraps at symbol boundaries. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: After each leaf, decoding returns to the root. The boundaries in the displayed stream are obtained by this rule; separators are not transmitted. The constructed message `AAAABBCD` contains the source proportions exactly. Its stream `00001010110111` uses14bits for8symbols, or1.75bits per symbol. Fixed two-bit words would use16bits.

### E10 — Expected length differs from one message length

Placement lead: Compare code assignments using the same source probabilities.

Draw: Draw three compact actual trees for matched, reversed and fixed mappings, each beside a table of source probability and leaf depth. Below, a separate common bit-length ruler compares source-weighted means and realized string lengths.

Encoding: Outcome identity is stable even when depth changes. Realized total is explicitly divided by message length to give per-symbol cost.

Required mathematical checks: Matched mean1.75; fixed2; reversed mapping uses actual retained model/code and source weights, not guessed depths. For repeatedD matched3 versus fixed2 bits/symbol.

Narrow/enlarged arrangement: Stack trees and their tables; keep per-symbol comparison on one shared numeric axis after all three. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The matched leaf depths1,2,3,3 give expected length.5×1+.25×2+.125×3+.125×3=1.75. This equals entropy because each probability is exactly2 to a negative integer. Reassigning long words to common symbols raises the expectation. A specific message can still favour another assignment: a single D uses3bits under the matched code and2 under a fixed-width code. Expected cost is not a guarantee for every realized string.

### E11 — Round ideal lengths to integer depths

Placement lead: Ideal information lengths are usually not integers.

Draw: For each supported source outcome show ideal −log2p on a horizontal bit ruler with integer gridlines and an arrow to ceil(−log2p). Show Bernoulli(.9,.1) as the nondyadic contrast; separate optimal single-symbol binary code lengths1,1.

Encoding: Solid point is ideal price; open square is ceiling length; labels state construction versus optimal code.

Required mathematical checks: Dyadic four-symbol law has zero rounding overhead. Bernoulli ceiling lengths1,4 need not equal optimal1,1.

Narrow/enlarged arrangement: Rows remain separate; axis minimum0 and tick grid retained; long explanation follows drawing, never inside rounding arrows. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For probability.9 the ideal price is about.152bits. A nontrivial two-symbol binary prefix code nevertheless needs at least one digit per individual symbol. For a finite alphabet, an optimal expected prefix-code length L* obeys

### E12 — A block shares one bit of overhead

Placement lead: Group n independent source symbols and give the entire block one codeword.

Draw: Group n successive independent binary symbols into one bracketed block, then one prefix-codeword leaf. Show two aligned rulers labelled bits/block and bits/source-symbol with an explicit divide-by-n operation. A compact n=2 block tree enumerates00,01,10,11.

Encoding: Block identity is its bit tuple; word boundary differs from source-symbol boundary. No simulated monotonic curve.

Required mathematical checks: Independent block entropy nH; ceiling bound H≤L/n<H+1/n; retained Fraction programme controls actual n1…8 values. Practice n2 p1=.25 gives lengths1,3,3,4 and31/32 bits/symbol.

Narrow/enlarged arrangement: Stack the two unit rulers and enumerate four leaves vertically if needed; never place four long codewords inside tiny leaves. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The ideal information of an independent block adds to nH(P). Applying the same prefix bound gives nH≤L_n<nH+1, hence H≤L_n/n<H+1/n. The less-than-one-bit overhead belongs to the entire block; dividing by n spreads it across the symbols. This can approach entropy without assigning a fraction of a physical digit to one isolated symbol.

### E13 — Source weights and model prices are different roles

Placement lead: Keep the device's source P, but let a model Q believe the statuses occur in almost the opposite pattern.

Draw: Four outcome rows align P mass with Q mass, then Q→−log2Q and multiplication by the original P. Use connecting leaders that stay within each named outcome. Accumulate resulting costs1.5,.75,.25,.125 into2.625.

Encoding: P solid outline and Q dashed outline; same outcome hue both sides. Width is mass; price is a labelled separate ruler.

Required mathematical checks: P(.5,.25,.125,.125),Q(.125,.125,.25,.5); row CE contributions1.5,.75,.25,.125 sum2.625.

Narrow/enlarged arrangement: At narrow size each outcome is a two-line mini calculation retaining actual bars, then one total ruler; no horizontal page overflow. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The category identities and order remain A,B,C,D. Source weights are P=(.5,.25,.125,.125); model probabilities are Q=(.125,.125,.25,.5). Each P width now pays the corresponding −log₂Q price. A becomes expensive because Q wrongly calls it rare. These prices3,3,2,1 produce total.5×3+.25×3+.125×2+.125×1=**2.625bits per symbol**.

### E14 — The KL gap can contain negative row terms

Placement lead: Place that2.625-bit cost beside P's own1.75-bit entropy.

Draw: Draw accumulated H1.75 and CE2.625 on one fixed scale and a bracket of width.875. Beneath, four signed p log2(p/q) bars extend from zero:1,.25,−.125,−.25. Live weights change both models and the linked costs.

Encoding: Positive/negative uses direction and signed labels, while A–D keep their identity hues. No probability interpretation for signed bars.

Required mathematical checks: Q=P makes every term0; default sum.875; reversing direction changes weights; infinity is never a finite bar.

Narrow/enlarged arrangement: Use horizontally aligned same-scale totals above vertically stacked signed rows; external labels at zero and overflow states. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The difference is.875bits. We call it **Kullback–Leibler divergence**, or KL:

### E15 — Expose the absent model support

Placement lead: Now consider an outcome that the model excludes.

Draw: Draw P outcomesA/B each positive and Q slotA1/B0. B source mass connects to a visibly empty model slot, then an unbounded price ray annotated∞. P-zero outcomes remain explicitly zero rows. Show the original and intentionally smoothedQ side by side after alpha edit.

Encoding: Missing support is an empty labelled slot/cross, not a red warning card alone. Source/model line style and outcome identity remain independent.

Required mathematical checks: P(.5,.5,0,0),Q(1,0,0,0) has CE/KL∞; positiveQ_B makes finite; P_B0 removes requirement; alpha changes the whole normalizedQ.

Narrow/enlarged arrangement: Stack original and smoothed laws; put infinity text outside geometry; zero-height marks retain readable labels. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: At P=(.5,.5,0,0),Q=(1,0,0,0), positive source mass on B has no model probability. Cross-entropy and KL are infinite. The picture leaves an unbounded cost rather than drawing a finite-height bar labelled infinity. If the source mass on B becomes zero, that requirement disappears. A small positive Q(B) gives a large finite price instead; zero and very small positive probability are different mathematical cases.

### E16 — Keep draft input separate from the active law

Placement lead: Inputs have their own contract.

Draw: A numeric trace shows entered weights(2,1), sum3 and normalized active probabilities(2/3,1/3), with arithmetic beneath each actual cell. Alongside show strict probability-input rejection of sum3. On invalid live draft underline the offending editor while the last valid plotted law retains its label.

Encoding: Arrows indicate normalization only for the weights interface. Strict API is a distinct labelled lane, not implied automatic repair.

Required mathematical checks: SciPy intentional weights entropy.918295834; strict wrapper rejects. Positive1e−9999 is rejected as unrepresentable nonzero input, not converted to intended zero.

Narrow/enlarged arrangement: Two stacked lanes with real values; no framed state-machine paragraph boxes. Error associates directly with its editor. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The browser accepts explicit weights, normalizes them and shows the active probabilities. A malformed draft leaves its last valid experiment in place. The Python helper below instead requires normalized distributions. It rejects malformed input rather than silently changing its meaning.

### E17 — The logarithm stays below its tangent

Placement lead: The negative contributions in section4 can reduce the total, but they cannot make it negative. Start with one ordinary logarithm inequality.

Draw: Plot y=ln t and y=t−1 for positive t, with tangent contact(1,0), a vertical difference at a declared t such as2, and asymptotic continuation near0. Follow the selected point into −ln(Q/P)≥1−Q/P.

Encoding: Curve styles and direct names disambiguate; t is a ratio not a source probability. Natural units explicit.

Required mathematical checks: At2 gap1−ln2 positive; contact onlyt1. Domain excludes0; no negative logarithm argument.

Narrow/enlarged arrangement: Plot first, substituted inequality below in normal math flow. Axes/labels reflow without making the equation a scroll card. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For t>0, ln t≤t−1, with equality only at1. The difference t−1−ln t has derivative1−1/t: it decreases up to1, increases afterwards and equals zero there. The straight tangent touches the log curve at1 and stays above it.

### E18 — Sum the inequality over source support

Placement lead: Apply that inequality to each supported source outcome.

Draw: Draw the set S of positive-P outcomes as named occupied columns; Q mass is partitioned into insideS and outsideS. Connect each supported weighted inequality to the sum D≥1−Q(S), then show omitted Q mass as a remainder segment.

Encoding: P support is a boundary, not a new random distribution. Q outsideS may be positive even when P is0.

Required mathematical checks: Equality requires Q=P onS and zeroQ outsideS; missingQ onS yields∞ before log proof.

Narrow/enlarged arrangement: Place support rows vertically, then a single unit Q partition; external labels name zero and omitted cells. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Let S be P's support and assume Q>0 on S; otherwise KL is already infinite. Substitute t=Q(x)/P(x), multiply by P(x), and sum over S. In nats,

### E19 — Truth minimizes an expected score

Placement lead: Hold the source fixed and let the reporting model move.

Draw: Hold binary P=(.8,.2) fixed. Plot CE(P,Q) versus q=P_Q(first outcome) on(0,1), show H(P) horizontal line and vertical KL gap atq.5. Mark minimum atq.8.

Encoding: Reference P written beside the fixed line; q is model parameter, not source edit. Infinite endpoints indicated by rays.

Required mathematical checks: Atq.8 CE=H≈.721928bits; q.5 CE1, gap.278072. This is expected proper scoring, not every realized observation.

Narrow/enlarged arrangement: Use one compact plot with labels outside tails; equal-scale axes, no auto-rescaling to hide model change. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The expected logarithmic loss reaches its unique minimum at Q=P. This is the **strictly proper scoring** property: truthful probabilities minimize the population expectation over all possible reports. It does not promise that the truthful model wins on every finite sample, or that a restricted fitted family can represent P.

### E20 — Uniform entropy is a finite-alphabet ceiling

Placement lead: The same gap proves the entropy maximum on a fixed alphabet.

Draw: Draw the same K named outcome slots with currentP and uniform1/K below. A common cost ruler shows log2K split into H(P) plus KL(P||U).

Encoding: Keep numberK visibly fixed. Uniform comparison does not recolour categories.

Required mathematical checks: For four-status P, log2K2=H1.75+gap.25. Changing alphabet changes the ceiling.

Narrow/enlarged arrangement: Stack aligned slot strips and keep total ruler beneath, outside tiny cells. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For uniform U on m labels, every event costs log_b m. Hence H(P,U)=log_b m and

### E21 — Leaf words occupy binary capacity

Placement lead: A prefix code uses disjoint portions of a binary tree's capacity.

Draw: Draw unit interval[0,1) recursively halved using actual edge bits. Leaves0,10,110,111 occupy1/2,1/4,1/8,1/8 with their outcome colours. A second feasible code example leaves visibly unused interval space.

Encoding: Intervals represent binary prefixes; disjoint leaf regions explain Kraft sum≤1. Adjacent labelled edges show shared ancestors.

Required mathematical checks: Default K=1; incomplete prefix capacity may giveK<1. A codeword at a parent would overlap its descendants and violate prefix-free.

Narrow/enlarged arrangement: Use an interval tree across stacked levels, labels on separate rows; narrow layout increases vertical spacing instead of shrinking type. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: At a common depth d, a word of length ℓ occupies2^(d−ℓ) descendant slots. Distinct prefix-free words cannot overlap those slots. Dividing their total by2ᵈ gives the **Kraft inequality**, K=Σ2⁻ˡ≤1. Choose d at least as large as every finite word length.

### E22 — Separate two coding overheads

Placement lead: Normalize those capacities to another distribution R(x)=2⁻ˡˣ/K. Its price is −log₂R(x)=ℓ_x+log₂K. Average using the actual source P, then subtract its entropy.

Draw: For declared code lengths draw raw capacities2^−l_i, totalK and normalized code lawR_i=2^−l_i/K. A bit ruler splits L−H into KL(P||R) and −log2K, both labelled nonnegative.

Encoding: Source lawP and normalized code lawR have names/line styles; neither is a fabricated actual compressor output.

Required mathematical checks: Identity L−H=D(P||R)−log2K; matched complete dyadic code makes both0. Upper ceiling construction and Huffman optimum remain different claims.

Narrow/enlarged arrangement: Stack normalization above gap ruler; exact formula follows in prose so labels stay short. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: $$L-H_2(P)=D_{\rm KL}(P\Vert R)-\log_2K\ge0.$$

### E23 — Changing direction changes the averaging law

Placement lead: Exchange the law supplying the expectation.

Draw: Use P=(1,0),Q=(.5,.5) on the same two outcomes. Left direction draws samples fromP then Q prices: one occupied path, cost1. Right direction samplesQ then P prices: one branch meets absentP support and goes to∞.

Encoding: Arrow direction and source label are redundant cues; keep outcomes identical across both directions.

Required mathematical checks: D(P||Q)=1bit,D(Q||P)=∞. Different supports alone do not imply both infinite.

Narrow/enlarged arrangement: Stack two actual source→price diagrams with each direction title, not two numerical badges. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: KL(P∥Q) averages P's prices; KL(Q∥P) averages Q's. If P=(1,0) and Q=(.5,.5), the forward direction is1bit because Q covers P's one possible outcome. The reverse is infinite because Q draws an outcome P excludes. Different supports alone do not tell us both directions; support inclusion has a direction.

### E24 — A directed discrepancy need not be a metric

Placement lead: Nor is KL an ordinary metric.

Draw: Draw three Bernoulli parameter locations .1,.5,.9 on a probability ruler, with directed curved connectors labelled actual KL(.1||.5),KL(.5||.9),KL(.1||.9). Connector length is explicitly not divergence scale; a separate numeric sum comparison proves failure.

Encoding: Points are distributions; arrows retain orientation; nats/bits consistent with manuscript retained values.

Required mathematical checks: Compute each value from full probabilities and show direct cost exceeds sum via middle. Jensen–Shannon uses mixture, not category distance; do not infer a triangle proof from geometry.

Narrow/enlarged arrangement: Place direct connector above and two-step below; label connectors outside curves and move arithmetic beneath at390. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For Bernoulli probabilities.1,.5,.9, in nats, D(.1∥.9)≈1.757780 while D(.1∥.5)+D(.5∥.9)≈.878890. The triangle inequality fails. Labels on the connecting arrows give computed directed costs; drawn segment lengths do not encode those costs. Relabelling categories preserves KL; moving mass between numerically near or far labels has no built-in transport distance. [Optimal Transport](/learn/path/full-curriculum/optimal-transport-wasserstein-distance-sinkhorn?module=math-foundations) supplies a geometry-aware comparison.

### E25 — Finite mass can have infinite entropy

Placement lead: Finite probability mass can be spread over infinitely many outcomes in a way that has infinite entropy.

Draw: Draw tail terms for symbolic p_k=c/[k(ln k)^2],k≥2. Show the probability-tail area converges while the entropy-tail comparison is proportional to1/(k ln k), whose integral diverges. A separate exact self-ratio strip writes p_k/p_k=1 for everyk.

Encoding: Any finite plotted tail is labelled illustrative; shaded tail continuation and analytic comparison carry the theorem.

Required mathematical checks: H(P)=∞ while D(P||P)=0 directly; never plot∞−∞ as a difference.

Narrow/enlarged arrangement: Use two separate labelled axes and self-ratio row below; no fabricated finite numerical normalization claimed to prove infinity. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Normalize p_k proportional to1/[k(ln k)²], k≥2. The probability series converges by the integral test, while its entropy diverges like Σ1/(k ln k). Partial sums in a drawing only illustrate the different tails; they are not a numerical proof of convergence or divergence.

### E26 — One-hot targets select a price

Placement lead: A classifier sees features X before predicting a label Y. Its report Q(y|x) is a distribution over labels for that context. Begin with one observed label.

Draw: Four class log-price bars align with target weights(0,0,1,0); onlyC connects to its chosen cost. Beneath, a valid soft target distributes weights across the same price vector.

Encoding: Class identity remains A–D; target is a selection marker not a changedQ. All zero target rows visibly contribute0.

Required mathematical checks: One-hot CE=−logQ_C; soft target CE is its weighted sum and must be a normalized law.

Narrow/enlarged arrangement: Stack target markers above each class row when narrow; preserve correspondence before any matrix abstraction. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The **one-hot target** puts probability1 on the observed correct class and0 on the others. Multiplying model log prices by those target weights selects just one price, −log Q(y|x). A soft target instead distributes its weights across classes; its loss is the weighted sum of those same prices. Neither target vector is a second set of logits.

### E27 — Condition first, then weight actual contexts

Placement lead: To ask about expected prediction cost, we must also account for how frequently each context occurs.

Draw: Draw a2×2 joint rectangle with row mass and normalized conditional strip per row. In symmetric preset fairX/flip.1/trust.8, retain true and model conditional probabilities and four joint-weighted costs. In asymmetric preset use (.675,.075;.125,.125), normalize to(.9,.1),(.5,.5), multiply row costs by.75/.25 and join the resulting segments.

Encoding: Y0 amber/circle,Y1 blue/square persist across contexts; rowX labels and boundaries identify context. True/model line styles separate roles.

Required mathematical checks: Asymmetric truthful weighted .6017466951919609 versus incorrect uniform .7344977967946407; atcontext.5 totals agree; atzeroX1 row unavailable and total .4689955935892812. Symmetric row costs equal: context-frequency edits intentionally leave total unchanged.

Narrow/enlarged arrangement: Stack two row-normalization traces, then the common total. Small/zero cells get external labels and leaders; comparison clearly says incorrect uniform. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The initial joint table uses a fair context bit X. The label agrees with X with probability.9, while the model reports agreement probability.8. Select either row: divide its joint masses by its context mass. Price the resulting label probabilities using that row's model, then multiply its row cost by the context mass before adding the rows.

### E28 — A particular observation can raise uncertainty

Placement lead: Conditioning helps on average, but one observed context can make the remaining uncertainty larger.

Draw: Draw the four equal-probability input pairs for fair independentA/B and deterministicY=A OR B. Group them byA, then draw conditionalY bars: A0 splits0/1 equally, A1 iscertain1. Join context-weighted entropies.

Encoding: Y identity persists; observed context highlights a group without changing underlying joint law.

Required mathematical checks: MarginalY1=.75,H(Y)=.811278; H(Y|A0)=1,H(Y|A1)=0; mean.5. A0 raises uncertainty but mean reduces it.

Narrow/enlarged arrangement: Four inputs in a2×2 grid followed by two conditional rows; do not create an entropy Venn diagram that hides weights. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Let independent fair bits A and B produce Y=A OR B. Before seeing A, Y=1 has probability.75 and H(Y)≈.811278bits. If A=0, Y=B is a fair bit with entropy1; if A=1, Y is certain with entropy0. The contexts occur equally often, giving average.5. The increase in the first slice does not contradict the average reduction. [Mutual Information & Information Bottleneck](/learn/path/full-curriculum/mutual-information-information-bottleneck?module=math-foundations) develops that reduction as a measure of dependence.

### E29 — A chain factors without independence

Placement lead: For observed data, connect these prices to the probability assigned to the whole record.

Draw: Draw token positionsx1,x2,x3 with visible preceding-prefix edges into each conditional distribution. The observed next token selects one probability from each row; product likelihood connects to sum of negative log prices.

Encoding: Time order and actual prefix labels identify dependencies. Do not connect only adjacent tokens if the written conditional uses all past.

Required mathematical checks: P(x1,x2,x3)=P(x1)P(x2|x1)P(x3|x1,x2); iid factorization is an extra assumption, not needed for chain rule.

Narrow/enlarged arrangement: Stack conditional rows vertically with prefix text directly beside each, then one total loss. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: If observations are modeled as conditionally independent given their inputs and shared parameters θ, their conditional likelihood is ∏ᵢQ_θ(yᵢ|xᵢ). Negative log turns that product into a sum. Dividing by fixed positive n changes the scale but not the minimizing parameter:

### E30 — Compute stable log probabilities class by class

Placement lead: A neural classifier often supplies one real-valued score per class. These **logits** must become probabilities, but computing enormous exponentials is unnecessary.

Draw: Aligned three-class columns show z=(1000,998,996), m=1000, shifted(0,−2,−4), exponentials, summed normalizer and log probabilities. Branch from the chosen target to its negative log probability; common-shift edit updates logits but leaves shifted computation.

Encoding: Class identity stays in each column throughout. Intermediate normalizer is one shared node with incoming contributions from all classes.

Required mathematical checks: logsumexp=1000.1429316285; target2 loss4.1429316285; common shift changes no probability or loss.

Narrow/enlarged arrangement: At390 transpose into class rows plus one shared sum beneath; no arrows crossing labels. Controls follow all currently visible computation. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For z=(1000,998,996), subtract the largest score1000 from every entry, producing(0,−2,−4). Exponentiate those shifted scores and add them. The sum is1+e⁻²+e⁻⁴; its logarithm is about.142932. Each log probability is its shifted score minus that common log sum. The last class therefore has log probability−4.142932 and loss4.142932nats.

### E31 — Floating probability can underflow while log loss remains finite

Placement lead: Even a stable probability can underflow when converted out of log space.

Draw: Start from direct log probabilities for(0,−1000,−2000). Branch once: exp of target log probability rounds to0, while direct negation produces finite2000. Show the naive log-of-rounded-zero route to∞ as the numerical failure.

Encoding: Two computational paths share the same declared finite logits; rounded float0 explicitly differs from a model-imposed mathematical probability0.

Required mathematical checks: Target2 loss2000, shift invariance retained; finite extreme differences beyond float range have a separate input contract.

Narrow/enlarged arrangement: Vertical branch diagram with numerical values at endpoints; no finite-height infinity bars. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For logits(0,−1000,−2000), the last probability rounds to zero in floating arithmetic. Its log probability can still be represented as−2000, and its loss is2000nats. Taking log of the separately rounded zero would incorrectly turn this finite-logit result into infinity.

### E32 — Map class and batch axes to the API

Placement lead: The framework interface must describe the same arrays.

Draw: Draw2×3 logits matrix, row indexN and column classC, target index vector(0,2), and alternate2×3 valid target matrix. Selecting target positions yields two row losses then mean.

Encoding: Class colours follow columns; row identities use numeric row labels, never category hues. No softmax layer before CrossEntropyLoss.

Required mathematical checks: Retained float64 example yields losses.142932,2000 and mean1000.071466 for unweighted/unignored case. Probability target rows sum1; dtype/shape explicit.

Narrow/enlarged arrangement: Matrix on its own row with wide enough cells; targets beneath and connecting leaders; show shapes even if arrows simplify. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For N examples and C classes, PyTorch `cross_entropy` receives raw logits of shape(N,C). Class-index targets have shape(N,) and dtype`torch.long`. Soft targets are valid probability rows of shape(N,C) with floating dtype. The library does not completely validate their normalization and nonnegativity, so the caller must supply a meaningful target. Applying softmax first feeds probabilities into an API that expects logits and changes the resulting model loss.

### E33 — Same accuracy, different log score

Placement lead: Give two models exactly the same ten binary test cases.

Draw: Ten actual examples: eight correct, two incorrect for both models. Each row has the correctness mark and its true-label probability, A.6/.4 versusB.99/.01, then loss on a common axis.

Encoding: Correctness uses check/cross and text; probability bars have zero baseline and no artificial minimum lengths. Models use line styles, not outcome recolouring.

Required mathematical checks: Both accuracy.8; mean nats A.591918645,B.929074306; sum actual ten losses before division.

Narrow/enlarged arrangement: Stack row pairs or one aligned list; fixed loss scale accommodates confident failures and visible tiny successes without fake positive floor. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Model A assigns correct-label probability.6 on cases1–8 and.4 on9–10. Model B gives.99 on1–8 and.01 on9–10. With threshold.5 and no ties, both get8/10 correct. Their log prices differ sharply: B saves a little on eight already-correct cases and pays about4.605nats on each confidently wrong one.

### E34 — Perplexity is reciprocal geometric mean

Placement lead: Turn the average log price back into a probability-like scale.

Draw: Reuse actual true-label probability rows; show product root1/N as geometric mean, then reciprocal, alongside exp(mean negative logs). A separate unequal-length two-sequence trace weights losses by token counts before exponentiation.

Encoding: Units label nats→exp or bits→2^; no mixture of bases. Tokenizer and evaluated positions fixed in a comparison.

Required mathematical checks: For N1loss0/N9loss9 aggregate mean.9 givesexp(.9), not(1+e)/2. UniformK yieldsK.

Narrow/enlarged arrangement: Keep numerical operations in one vertical chain at narrow widths with aligned repeated values; do not hide denominators in a caption. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: **Perplexity** is b raised to the average base-b log loss. For natural logs,

### E35 — Separate training counts from later scoring rows

Placement lead: We can use actual field records to inspect context-aware prediction costs. The Palmer penguin data describe penguins observed in a study of body size, sex and foraging-related ecological differences. The collectors' scientific question was not our classification exercise; this small example asks only how island information affects species prediction on a declared year split.

Draw: Draw year axis2007/2008→training and2009→test; two species×island count tables with exact supplied counts. Add alpha1 count markers only to training rows, then connect fitted probabilities to untouched test rows.

Encoding: SpeciesAdelie amber/circle,Chinstrap blue/square,Gentoo lavender/triangle; islands named groups. Year split is temporal, not a randomized causal assignment.

Required mathematical checks: Train224 counts100/44/80; test120 counts52/24/44. Train island rows28,0,80;36,44,0;36,0,0. Test16,0,44;20,24,0;16,0,0.

Narrow/enlarged arrangement: Stack train/test tables, retain all species labels and counts; no unrelated missing measurement fields introduced. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The supplied `penguins.csv` contains344rows. We use species, island and year, which are complete in these records. Missing body measurements do not justify dropping rows for this question. Use2007–2008 for training,224rows, and2009 for the held-out comparison,120rows. The fixed three species are Adelie, Chinstrap and Gentoo; islands are Biscoe, Dream and Torgersen.

### E36 — Every held-out record contributes to one denominator

Placement lead: Select the predicted probability for each held-out record, then sum its loss.

Draw: Trace one Adelie/Biscoe test row into training probability29/111 and its selected bit loss. Aggregate test group counts60/44/16 into subtotal losses and divide overall sum by120. Aligned same-unit bars compare global/island CE and empirical conditionalH+KL.

Encoding: Model probabilities retain species identities; entropy/KL brackets distinguish quantities using labels/line style. Test histogram is a descriptive comparison, not fitted training model.

Required mathematical checks: GlobalCE1.518341224, islandCE.805893591; weightedH.782798115+KL.023095476. Row-count weights60/120,44/120,16/120.

Narrow/enlarged arrangement: One traced row first, then stacked island totals and a final common ruler; narrow labels never inserted inside tiny KL bracket. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The test island counts are Biscoe(16,0,44), Dream(20,24,0), Torgersen(16,0,0):60,44and16rows. The global model's mean loss is1.518341224bits, accuracy.433333333 and perplexity2.864614937. The island model's mean loss is.805893591bits, accuracy.7 and perplexity1.748228292. These are results for these records and this specified split, not universal rankings of methods or a random census of Antarctic penguins.

### E37 — Realized evidence need not rise each step

Placement lead: Follow the actual signed model-price differences along a sequence.

Draw: Use an explicitly constructed four-status sequence, e.g.D,A,D,A, under earlierP/Q. Plot cumulative log2(P/Q) with per-step increments−2,2,−2,2, giving−2,0,−2,0; separately draw expected slope n×.875 for repeated independent draws fromP.

Encoding: Solid actual constructed path and dashed expected line labelled directly. Same source/model conventions as§4.

Required mathematical checks: Expectation atn4 is3.5bits, realized total0; first incrementnegative. Constructed path is not random sampling or confidence band.

Narrow/enlarged arrangement: Label each discrete step; move increment values into aligned table below if enlarged text would collide. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For specified models P and Q, the log likelihood ratio is Σ_tlog[P(event_t|past)/Q(event_t|past)]. In an independent finite source P, its expectation after n draws is nKL(P∥Q). The expected price gap therefore accumulates between those models. A realized sequence can include negative increments or have a negative total; an expectation is not a guarantee of a monotone trace. Dependence must be represented in the conditional factors rather than ignored.

### E38 — Density height changes with coordinate units

Placement lead: For a numerical measurement, a density describes probability per unit coordinate. It is not the probability assigned to one exact value.

Draw: Draw uniform density rectangles on metre and centimetre coordinate axes: width.25/25,height4/.04. Highlight the same middle-half physical event and its probability area. A scale correspondence links endpoints.

Encoding: Both axes have actual numeric units. To make areas perceptible, panels may use different labelled coordinate scales; do not imply equal raw pixel widths prove equality.

Required mathematical checks: Probability.5 in both; hbits−2 vs4.643856; density above1 is valid. Width edits change physical law; unit edits do not.

Narrow/enlarged arrangement: Stack unit panels with explicit axes and matching highlighted interval; no cropped tall density rectangle. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Take X uniform over[0,.25]metres. Its density is4per metre, and the middle-half interval has width.125metres, giving probability4×.125=.5. A density can exceed1 while every event probability remains valid. Under a continuous density law, a singleton has zero probability even where the density is positive.

### E39 — Quantization changes the recorded alphabet

Placement lead: Now change what is recorded, rather than just its numerical unit.

Draw: Partition the same physical support into N equal bins and label bin widthΔ=w/N. Under density, show each bin area; below, draw theN-bin discrete probability strip and Hbin. Shared unit conversion preserves bin boundaries physically.

Encoding: Bin identity index preserved through unit changes; a changeN creates a different recording alphabet and is labelled.

Required mathematical checks: N4 gives masses.25,H2; doublingN adds1bit. Exact H=h+log2(1/Δ) is for displayed uniform law.

Narrow/enlarged arrangement: AtN32 use tick groups and selected-bin detail with all counts in accessible table; do not force32 tiny labels into390px. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Split the physical interval into four equal bins. Each bin label has probability.25, so its discrete entropy is2bits. For N equal aligned bins, Δ=w/N and

### E40 — A common Jacobian cancels in the density ratio

Placement lead: KL behaves differently from the two density entropies taken separately.

Draw: Draw P/Q density curves on commonx coordinates, a selected small intervaldx, then transformed coordinatesy=ax with widtha dx and each height dividedbya. Pair corresponding P/Q heights at the selected point; ratio label stays identical.

Encoding: P solid/Q dashed and labels; the unit map is one shared transformation, not two independent rescalings.

Required mathematical checks: P Normal(0,1),Q Normal(1,2),both scaled100: KL.443147nats stays fixed. Differential entropy gainsln100; zeroσ excluded.

Narrow/enlarged arrangement: Stack before/after curves, mark matching physical interval with a leader; formulas beneath in normal flow. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: Compare P and Q using densities f and g relative to the same coordinate measure:

### E41 — Atoms and densities give different point events

Placement lead: Compare a finite empirical dataset with a smooth continuous model.

Draw: Draw a finite set of empirical point masses with labelled mass1/N, then the same point set under a smooth density curve. Circle the finite set as one measurable event; empirical mass1, continuous model mass0.

Encoding: Point stems mean probability mass; smooth curve height means density. Explicit axis labels prevent treating them as comparable heights.

Required mathematical checks: EmpiricalP not absolutely continuous with respect to smoothQ, hence KL∞; evaluating finite density at observed points can still give finite NLL.

Narrow/enlarged arrangement: Stack mass/density panels and label the same event in both; use no artificial bins unless deliberately introduced as a new model. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The empirical distribution puts positive mass on its observed points; together that finite set has empirical probability1. A continuous density model gives the same finite set probability0. Thus KL from the empirical point-mass measure to that continuous law is infinite. Empirical average negative log density can still be a useful likelihood objective, but it is not a finite KL for those two measures.

### E42 — A simplex is a space of probability laws

Placement lead: Suppose a count can be0,1or2. We know its mean but do not know all three probabilities.

Draw: Draw the ternary triangle with vertices certain0,certain1,certain2. Show a pointq with barycentric projection lines to each coordinate scale and one separate three-outcome bar strip carrying those coordinates.

Encoding: Triangle position represents an entire distribution. Colour outcomes by count identity; q bluecircle,p* amberdiamond only when introduced.

Required mathematical checks: Coordinates nonnegative and sum1; vertex means all probability at one count. Triangle is not physical count geometry.

Narrow/enlarged arrangement: Use full-width triangle with exterior vertex labels, projection labels outside and strip beneath; enlarge margins at200%text. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: A point in the triangle represents(q0,q1,q2), three nonnegative coordinates summing to one. The vertex labelled0 is the certain count0 law; the other vertices are certain1and certain2. The interior distributes probability among all three outcomes. The triangle is a map of probability laws, not the physical location of a count.

### E43 — Intersect the mean plane with feasible probabilities

Placement lead: Add the mean constraint E[X]=10/7.

Draw: On the same triangle draw the line q1+2q2=10/7 clipped exactly to its two valid endpoints. Selected q(t) links to masses and computed mean; t=q2 control spans[3/7,5/7].

Encoding: Feasible line solid; outside-simplex continuation faint dashed and explicitly infeasible if shown. t is a coordinate, not Euclidean arclength.

Required mathematical checks: Endpoints(0,4/7,3/7),(2/7,0,5/7); all selected points satisfy both constraints. Baseline t3/7.

Narrow/enlarged arrangement: Triangle then mass/constraint row, with control beneath; endpoint labels in distinct outside quadrants. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The admissible laws lie on a line through the triangle. Let t=q2. Solving q0+q1+q2=1 and q1+2q2=10/7 gives q=(t−3/7,10/7−2t,t). Nonnegativity restricts t to[3/7,5/7]. The constraint leaves a real choice; it does not already determine the distribution.

### E44 — Pair geometric location with an entropy certificate

Placement lead: Compare the same feasible point in probability space and on the entropy curve.

Draw: Linked selectedq/p* on simplex and H(q(t)) curve over feasiblet. Mark p*=(1,2,4)/7 at t4/7 and show vertical deficit from H(p*) to H(q). Beneath, align the identical cross-entropy value for each feasibleq and the nonnegative KL difference.

Encoding: q bluecircle,p* amberdiamond consistent across both views; entropy curve neutral. Numerical plot is illustration, algebra gives proof.

Required mathematical checks: H(p*)1.378783, endpointH.985228/.863121; KL=H(p*)−H(q); nullq=p* gap0.

Narrow/enlarged arrangement: Stack geometry and curve when narrow; preserve labels and independent axis meanings, no converging arrows through text. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: The live parameter t means q2, not Euclidean distance along the line. The linked views locate one law and its entropy. At t=3/7, q=(0,4/7,3/7), entropy.985228bits. At t=5/7, q=(2/7,0,5/7), entropy.863121. The interior candidate p* has1.378783. A sampled plot suggests a maximum, but a proof must cover every feasible law.

### E45 — Boundary means collapse the feasible set

Placement lead: Change the required mean and watch the feasible line move.

Draw: Show four small actual simplex slices for mean0,1,10/7,2 on the same geometry. At endpoints the slice is a vertex; interior slices are segments. Link each to t lower=max(0,m−1), upper=m/2.

Encoding: Same count vertices and orientation across all four. Boundary limits markedη→±∞, never finite fittedη.

Required mathematical checks: Atm0 only(1,0,0);m2 only(0,0,1); m1 t0…1/2. Numeric supported domain is distinct from mathematical theorem.

Narrow/enlarged arrangement: Use2×2 then one-column layout under enlarged text if labels crowd; each simplex has its own fully legible mean. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For any mean m∈[0,2], q=(1−m+t,m−2t,t) with max(0,m−1)≤t≤m/2. The means0and2 leave only their corresponding vertices. Interior means have positive maximizers; endpoint point masses require η→−∞ or+∞, not finite η. On a nonempty finite simplex slice, continuity and compactness give an attained maximum, while strict concavity gives uniqueness. This does not establish existence of a finite optimizer for every unbounded continuous moment problem.

### E46 — Nonuniform base weights change the objective

Placement lead: The base weights in an exponential-family model matter as well.

Draw: Compare three equal outcome slots with baseline multiplicitiesh=(1,2,1): the middle outcome contains two labelled base subslots. Normalize atη0 to(.25,.5,.25), and compare with uniform thirds. Show two aligned objective rows H and H+Elog2h.

Encoding: Outcome identity unchanged when middle baseline has two subslots; subslots are base weight, not new countedX values.

Required mathematical checks: Base model H1.5,relativeobjective2; uniformHlog2(3)≈1.584963,relative≈1.918296. Both means1, so base tilt is not ordinaryShannonMaxEnt.

Narrow/enlarged arrangement: Stack the two probability laws above two objective comparisons; label both criteria in full, with no colour-only winner cue. Use the common accessibility rules; text alternatives must state this operation rather than merely naming the figure.

The immediately following manuscript paragraph begins: For p_η(x)=h(x)exp(ηT(x)−A(η)) with positive nonuniform h, log p includes log h. With a fixed moment m,

## Focused investigations

These are nine investigations with one meaningful question each. L9 has two connected views at its introduction/certificate placements. Existing pure numerical models are reused where their contracts suffice; do not rerun their old scientific campaign merely to rearrange presentation. Fixture outcomes below are required verification cases, not claims they have already run in this new runtime. All input changes act without prediction gates. Inputs with incomplete/invalid numeric text retain the last valid active experiment and show a specific adjacent message. Reset restores every related control, active state and derived view.

| Lab / job | Initial visible mechanism and controls | Fixed quantities, consequences, null/change/error cases and decision |
| --- | --- | --- |
| L1 coin weighting E06 | p=.9; two masses, two surprises, contributions and H curve; numeric/range p0…1. | Outcome alphabet fixed; units default bits. p=.5 yields1, p=0/1 gives0 mean, rare price unbounded only for excluded outcome. Swap.1/.9 same H; don't introduce perplexity yet. Diagnose rare observation vs average. |
| L2 prefix trace E09 | AAAABBCD and fixed valid matched tree; complete bit stream and currently traced path/output visible. Message editor, next/previous bit and reset; code assignment selector is a secondary comparison after baseline explanation. | Codes matched/reversed/fixed come from existing valid mappings; source P fixed. Message alphabet A–D, length bounded with count shown; empty message valid. Ending inside a word is an explicit separate decode-input example, not produced by a valid encoder. Single D versus AAAA exposes realized/expected difference. Stable step clamp on message changes, no answer gate. |
| L3 finite price mismatch E14 | Initial P=(.5,.25,.125,.125), Q=(.125,.125,.25,.5), finite H/CE/signed KL; source/model weights editable by labelled rows, units switch. | Same alphabet, normalize explicit weights, preserve underflow guards. Q=P null, reverse-Q, skewed P; fixed comparison scale with overflow annotation. Separate source shift from model shift. Support-zero state hands off to L4, not a false finite bar. |
| L4 missing support E15 | P=(.5,.5,0,0), Q=(1,0,0,0): the B source mass has no model slot and CE/KL∞. Direct Q-B mass/weight numeric editor and additive smoothing alpha0…1; original unsmoothed model remains labelled. | Normalize smoothed counts/weights deliberately. P-B→0 removes required-support failure; Q-B small positive stays finite. `1e-9999` rejected as representational underflow. Explain that smoothing is model change and cannot prove its real-world adequacy. |
| L5 conditional pricing E27 | Fair X; trueY agrees withX with.9; model agrees with.8. Joint2×2, two normalized conditionals, four weighted log costs and total. Two named presets: symmetric channel and unequal row costs. Symmetric controls remain context mass, common flip and model trust; asymmetric preset fixes true Y1 rows (.1,.5) and truthful Q, exposing only context mass P(X=1). | Symmetric row costs are identical: changing context frequency changes joint areas but not their weighted conditional average; label this null result. The asymmetric default context masses (.75,.25) gives joint rows (.675,.075) and (.125,.125); normalize rows before scoring. Draw each row cost beside its actual context multiplier, then products .3517466951919609 and .25 joining at .6017466951919609. A separately labelled incorrect uniform comparison gives .7344977967946407. Changing P(X=1) to.5 makes the two totals agree; changing it to0 gives .4689955935892812 with zero-context slice explicitly unavailable. Presets reset dependent values and compare like units. Preserve old symmetric output; impossible Q support remains flagged. Numeric labels remain outside zero-width cells. |
| L6 stable logits E30 | z=(1000,998,996),target class2; current classwise vectors and selected log loss. Three bounded finite logit editors, common-shift control, class-index/valid soft-target mode. | Compute log probabilities directly, use target probabilities only for averaging; common shift0/1000 gives same result. z=(0,-1000,-2000) changed fixture; onehot matches target mode, soft row sums1. Reject NaN/∞/invalid mass; not a training simulator. |
| L7 density units E38 | Uniform width.25m, middle-half event; metre and centimetre coordinate rulers/density heights/probability area shown together. Physical width slider and numeric entry; unit selector or paired view. | Physical interval changes with width; unit conversion changes numbers, not experiment. Rectangles use coherent scale transforms with explicit mapping, not an unchanged unlabelled picture. w=.25/1/2; scale1/100; area.5 always. Differential entropy allowed negative. |
| L8 quantized record E39 | Same uniform interval, four equal bins; probability vector and Hbin2 visible with bin width and h. Numeric/range bin count2…32, physical width/unit controls reused or explicitly paired. | Fixed physical bins under unit-only conversion. Doubling bin count doubles resolution/increases Hby1 for uniform case; h changes with physical width/coordinate. Do not generalize exact uniform identity to arbitrary coarse nonuniform bins. |
| L9 constrained MaxEnt E43/E44 | Mean10/7, q2=t=3/7 baseline endpoint, actual simplex slice and entropy gap to p*. Edit mean within preserved supported domain/exact0,2 and current feasible fraction. | q formulas, all masses and mean update together. Null q=p*, changedmean1, endpoints0/2, two interior range edges. Infeasible means rejected. Maximum button selects computed p* but no prediction entry. Three finite distributions remain code's reference. h change is a separate drawn counterexample, not hidden replacement of objective. |


## Programme and practice delivery

Mount the complete13 Python programmes and their full numerical outputs exactly as in the manuscript. Preserve original11 source/output bytes and historical evidence; new2 have separate execution records. information_library.py uses the documented print-only formatting successor, not a numerical rerun. Its complete source mounts after conditional teaching in section6; section4 gives actual SciPy calls and links forward. The MaxEnt programme mounts after the nonuniform-base explanation so its last two outputs have already been taught. File-index navigation, Copy/Download and copy success/error feedback use the shared reader contract. Supply penguins.csv beside penguins_log_loss.py and retain CC0 attribution. Do not put private research or evidence records under public.

The14 practice prompts are visible; optional hints and full solutions may use the shared disclosures. Python function snippets in solutions are independent repairs with explicit imports and filename-specific copy/download affordances, not separately claimed scientific mains. Preserve the two earlier checkpoint prompts/solutions and all nine original task texts inside the expanded practice. One programme/source file is not a separate lab.

## Whole-content review boundary

Review all46 drawing contracts against their adjacent manuscript operations, all nine live investigations, every programme source/output and every practice solution. Check the actual prerequisite routes/fragments and conserved old depth. Source-level contracts do not certify painted topology, native loading, clipboard, download, screen-reader behaviour or observed learning; those remain implementation review obligations.
