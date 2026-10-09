# Rate Distortion — complete drawing and investigation specification

Source: manuscript-complete-r1.md. These are actionable content contracts for later implementation. No rendered or interactive acceptance is claimed. All 46 drawings belong inside the continuous explanation, with the actual source lead and interpretation recorded below. The figures have no card shell, banner, independent heading or duplicated prose inside boxes.

## Shared meaning, colour and access

Use the site’s charcoal canvas with high-contrast text. Source bit/value 0 uses amber #E6AD55 and source bit/value 1 blue #79B8E8 with persistent value labels; the three-level source adds lavender #BCA4E8 for value 3. A bit keeps its value colour through source and reconstruction positions. Reproduction codeword groups additionally use labelled outline shapes (000 circle, 111 diamond; expanded codebooks retain their explicit bitword labels). An index uses a neutral message outline, so it is not mistaken for a reconstructed bit. For many source words, labels and ordered positions carry identity rather than eight barely distinct colours. A selected row or bit has an extra light outline; selection never erases its identity colour.

In probability tables, label the row/source and column/reproduction axes explicitly. Joint masses and conditional probabilities keep the same cell identities; denominator brackets explain the changed normalization. Error positions use a coral tick and the word “changed”, not colour alone. In Gaussian comparisons, source uses amber, reproduction blue and error lavender; directly label that deliberate role encoding. Water-filling components use amber/blue names and matching caps, while a neutral hatch consistently means allowed error. Objective bounds use labelled open endpoints, exact current values a filled mark; finite measured schemes use a different shape from theoretical frontiers. No decorative green/olive or rainbow scale.

Every figure has a short accessible name and a nearby explanatory equivalent. Exact tables supplement nontrivial plots. Use semantic HTML for tables/controls and only hide duplicate decorative marks. Labels and mathematical text follow the Reader text size. Check 390 px ordinary and 768 px with 200% text, including every changed and edge state; stacked geometry must preserve the mathematical operation. No clipped words, overlapping coordinates or unexplained arrows. Avoid unnecessary animation; if used, respect reduced motion and show the final state immediately.

Live output is visible immediately. Native controls have associated names, units, keyboard equivalents and visible focus. Invalid drafts leave the last valid state with an associated explanation; no silent mathematical clamping or epsilon repair. Reset clears drafts/messages and restores the complete shared investigation state. Scrolling does not reset. No learner prediction entry, grading, reveal or confirmation gate. Static worked examples have no imitation controls. Clipboard/download use shared Reader controls and the exact complete source files with visible success/failure feedback.

## Drawing contracts

### D01 — The transmitted object is an index

Placement lead: A sensor reports three bits, `011`. Suppose the receiver has agreed to reconstruct only `000` or `111`. Follow the source positions through the choice and the transmitted message.

Draw: Draw source 011 as three indexed bit positions. Route it through the ordered codebook 000/111, show both Hamming distances 2/1, select index 1, transmit that single index bit, and look up reproduction 111. Mark only the first source/reproduction position as changed. Keep the index glyph inside a message outline and reproduction bits inside their position slots, so the two uses of digit 1 are distinct.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Distance is 1 to selected word; n=3, M=2, fixed index width=1, normalized distortion 1/3.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: These two allowed outputs form a **codebook**. The encoder compares the input with each output: `000` changes two positions, whereas `111` changes one. It sends index `1`, meaning the second entry. The decoder looks up that entry and produces three bits, `111`. The one-bit index and the three reconstructed bits are different objects, even though both contain the character `1`.

### D02 — Reconstruction groups are preimages

Placement lead: The receiver cannot recover the first source bit. That distinction was deliberately lost. Which other inputs become indistinguishable at the receiver?

Draw: Draw all eight labelled three-bit source words, with real edges into the two codeword groups. Each source word keeps its three position slots and mismatch ticks. Assign 000/001/010/100 to 000 and the remaining four words to 111. Group geometry conveys membership; do not imply that screen distance is Hamming distance. L1 first stage lets the learner select a word and compare its candidate distances.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: All eight words occur once; nearest-codeword assignment uses ascending codebook order for a tie; no empty codebook accepted.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: Inputs `000`, `001`, `010` and `100` choose index 0. Inputs `011`, `101`, `110` and `111` choose index 1. Each group is a **preimage** of the selected reconstruction: several originals share the same transmitted description. The grouping diagram is a list of assignments, not a distance-preserving map of binary strings. Bit 0 stays amber and bit 1 stays blue; outlined destination markers identify codebook entries independently of bit values. A white outline selects a row. Error ticks identify changed positions without recolouring every 1 as an error.

### D03 — Expected error weights the source words

Placement lead: Now count mistakes using the probability of each source word.

Draw: Keep the same word identities and attach their Bernoulli source probabilities. For each word align probability, mismatch count/3 and weighted contribution; trace their sum to the expected error. A separate labelled maximum uses only positive-mass source words. L1 adds source prevalence and expected/worst totals here after weighting is taught.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Fair two-word codebook expected error .25; worst positive-mass block error 1/3. At source prevalence 0 or 1, impossible rows do not enter the worst-case maximum.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: For independent fair source bits, all eight words have probability 1/8. Two words have no mistakes and six have one. The expected fraction of wrong source positions is

### D04 — Cardinality and binary width are different

Placement lead: Codebook size determines the width of a fixed binary index.

Draw: Draw three codebook slots addressed by binary 00/01/10 and a crossed, explicitly unused 11 address. Beside the n-symbol block show log₂(3)/n as cardinality rate and 2/n as physical fixed-width index rate. Use M=2 as the agreement case. L1 enables arbitrary nonempty codebook membership only after this distinction, preserving its selected word and prevalence.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: ceil(log₂3)=2; one of four addresses is unused; M=1 needs zero index bits, with the constant codeword still known to the decoder.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: With M allowed reconstructions, a fixed binary index needs ⌈log₂M⌉ bits. Two entries need one bit; three entries need two bits, leaving one of the four binary addresses unused. For a block of n source symbols, the transmitted fixed-width rate is ⌈log₂M⌉/n bits per source symbol. Information-theoretic block-code statements often use log₂M/n as their cardinality rate. These coincide for powers of two; the rounding difference is less than one bit per block.

### D05 — A cost belongs to a source/reproduction pair

Placement lead: The same pair of values can count as a small error under one criterion and a serious error under another. First specify what the reconstruction is supposed to preserve.

Draw: Draw actual source value x and reconstructed value xhat entering one selected cell of a labelled cost matrix. Show three separate declared criteria: Hamming mismatch, squared distance and missed-alarm cost. The matrix entries are costs, while probabilities appear only in the next drawing. Use pair labels and cost units; never encode cost as a probability arrow width.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Hamming agrees at zero; squared error uses the square of the signed residual; asymmetric alarm reverses neither source nor reconstruction axes.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: A **source** X is the random object being represented; X̂, pronounced “X hat,” is its reconstruction. A **distortion function** d(x,x̂) assigns a nonnegative cost to that pair. Binary Hamming distortion gives 0 for a match and 1 for a mismatch. Squared error gives (x−x̂)², so an error of 2 costs four times an error of 1. An alarm criterion can give a missed alarm a much larger cost than a false alarm. Such a cost need not be symmetric or satisfy the triangle inequality. Calling it distortion does not make it a mathematical distance.

### D06 — Weight the cost by the probability of the pair

Placement lead: The probability of a pair determines how much its cost contributes to an average.

Draw: Align source masses p_i, conditional row entries q_ij, joint masses p_i q_ij and costs d_ij. For one selected pair show multiplication into a contribution, then sum all contributions on an expected-cost ruler. Compare always reconstructing zero under rare alarm probability .01 with miss cost 1 versus 100; preserve the same probability grid between panels.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Expected costs .01 and 1 with no change to the zero-message rule. All conditional rows normalize; changing cost does not change source mass.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: Write pᵢ for source probability, qⱼ|ᵢ for the probability of reconstruction j conditional on source i, and dᵢⱼ for their cost. The pair has probability pᵢqⱼ|ᵢ and contributes pᵢqⱼ|ᵢdᵢⱼ to expected distortion. Summing all cells gives D(q). The cost table is not a probability table: its rows need not sum to one.

### D07 — The reconstruction law is a conditional table

Placement lead: To search for a limit, allow every possible reconstruction distribution for each source value.

Draw: Draw source masses .8/.2 entering rows q=(.9,.1),(.1,.9). Row-weighted cell areas give joint (.72,.08;.02,.18); sum columns into output masses .74/.26. Trace the two off-diagonal Hamming cells to D=.1. Explicitly label this symmetric forward channel as a candidate, before any claim of optimality.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Joint totals 1; output marginal .74/.26; mismatch .08+.02=.1. This differs from the backward optimum at the same source and budget.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: This row-normalized table q is a **test channel**. It describes which source distinctions survive; it need not be a physical noisy link. It is also not yet an encoder emitting bytes. For p(X=1)=.2, the symmetric forward-flip rule has rows (.9,.1) and (.1,.9). Multiplying them by source probabilities .8/.2 gives joint rows (.72,.08) and (.02,.18). Column sums are .74/.26 and the off-diagonal distortion is .1. We have constructed one feasible rule, without asserting it is best.

### D08 — A larger budget admits more channels

Placement lead: Hold the source and cost fixed, then admit only channels inside the error budget.

Draw: Place computed candidate channels at their actual (D,I) coordinates, with D horizontal and I in bits vertical. Draw a vertical budget cutoff and outline the admitted points. Compare two cutoffs on the same axes, carrying every candidate identity across them. Use named deterministic constant/copy and declared symmetric channels; compute their plotted MI from their joint tables. Do not draw an invented exact frontier or shade an unproved feasible region.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Every admitted candidate has actual D at most the cutoff; admitted sets are nested and their finite candidate minimum cannot rise. A finite comparison is not the full optimization.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: The **information rate-distortion function** is

### D09 — No message fixes an independent output law

Placement lead: The information minimum becomes an operational coding limit under the assumptions in section 4. First identify the easy endpoints: impossible distortion and reconstruction without a message.

Draw: Draw identical conditional output rows as the zero-information condition. Compare each constant reproduction column and its weighted expected cost; bracket the smallest as D_zero. Separately pick the minimum cell within every source row and sum its weighted cost for D_min. An independent random mixture draws a convex combination of constant-column totals.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: D_min=sum_i p_i min_j d_ij; D_zero=min_j sum_i p_i d_ij. An independent mixture cannot improve on the best constant expected cost.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: Even with complete source knowledge, the least expected cost on the declared reconstruction alphabet is

### D10 — The binary error identifies the missing bit

Placement lead: For a binary source with P(X=1)=p, let H_b(p)=−p log₂p−(1−p)log₂(1−p), using the limit 0 log 0=0. Let E=X xor X̂ identify a mismatch. Knowing the reconstruction and the error bit recovers the source bit.

Draw: Draw Xhat and E=X XOR Xhat feeding an XOR gate that reconstructs X. Show the four possible pairs and the reversible X/E correspondence when Xhat is fixed. Attach conditional entropy terms to the corresponding distributions, then bound them by binary entropy of the actual error.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Use actual error ≤ budget D ≤ min(p,1−p) ≤ .5 before applying monotonicity of binary entropy. No monotonicity claim beyond .5.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: Given X̂, describing X is equivalent to describing E. If the actual mismatch probability is d, then

### D11 — The attaining law is easiest to build backward

Placement lead: Construct the variables in the reverse direction: choose a reconstruction first, add independent binary error, and check that the resulting source has the right probability.

Draw: Draw Xhat~Bernoulli(r) and independent E~Bernoulli(D) as separate branch trees whose four products enter an XOR node to form X. Default p=.2,D=.1,r=.125. Sum paths ending at X=1 to expose p=D+r(1−2D). L2 first stage changes p/budget and shows only this backward construction and joint law; forward error fields arrive after D12.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: For interior budgets r=(p−D)/(1−2D). At or above min(p,1−p), use the best constant with its actual threshold error; handle p=0/1 and p=.5,D=.5 without division by zero.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: Draw X̂∼Bernoulli(r), independently draw E∼Bernoulli(D), and set X=X̂ xor E. Now H(E|X̂)=H(E), making the uncertainty bound tight. To get P(X=1)=p, solve

### D12 — Convert the same joint law to forward errors

Placement lead: Turn the backward branches into a joint table before reading forward errors.

Draw: Carry the four backward products into source-row/reproduction-column joint (.7875,.0125;.0875,.1125). Outline one source row, show its .8 or .2 denominator and divide cells to get the forward channel. Compare forward false-positive .015625 and false-negative .4375 with D07 at the same p=.2 and D=.1. L2 extends its existing state with these row traces; no causal arrow claim.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Rows sum .8/.2, mismatch .1, output .875/.125. Forward errors are asymmetric; a zero-mass source row is unavailable rather than assigned a conditional law.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: With p=.2 and D=.1, r=.125. The joint table, with source rows 0/1 and reconstruction columns 0/1, is

### D13 — The binary frontier has a zero-rate branch

Placement lead: The bound and attaining construction determine the complete binary frontier.

Draw: Plot the exact binary expression H_b(p)−H_b(D) only below min(p,1−p), then zero. Mark the threshold and constant reconstruction identity. At fair p show the actual finite 000/111 codebook point (.25,1/3) separately from the theoretical curve, with its own legend and shape. L3 first mount changes p and budget; no multiplier control yet.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Handle p=0/1 as zero throughout feasible nonnegative budgets. Fixed axes D∈[0,.5], I∈[0,1] bits. Finite point is above fair R(.25), not asserted optimal.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: $$R(D)=\begin{cases}H_b(p)-H_b(D),&0\le D<\min(p,1-p),\\0,&D\ge\min(p,1-p).\end{cases}$$

### D14 — A supporting line prices distortion

Placement lead: An engineer can choose a price λ for distortion instead of choosing a hard budget first. λ has units bits per distortion unit; larger λ makes mistakes more expensive. Geometrically, the objective I+λD fixes a line in the distortion–information plane.

Draw: On the same frontier draw I+lambda D=c with slope −lambda, an objective intercept and the minimizer for that lambda. Keep the learner’s chosen budget marker distinct from the multiplier optimum. L3 adds lambda after the adjacent definition. Show lambda 2 at fair D=.2, and a separate unit-conversion example Dprime=100D with multiplier lambda/100.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: At lambda 0 choose a labelled best-constant representative from the zero-rate family. Supporting intervals replace derivative language at corners. Units of slope are bits per distortion unit.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: A line I+λD=c has slope −λ. Slide it down until it supports the convex frontier. For an interior binary point,

### D15 — The theorem concerns a sequence of block codes

Placement lead: The information minimum describes a limit. To see why its endpoint needs care, consider biased bits with p=.1 and an exact, fixed-width code for ten source bits.

Draw: For Bernoulli(.1) and block length 10, draw a labelled partition/count schematic with 2^10=1024 positive-probability words requiring 1024 distinct zero-error reconstructions. Do not scatter a few decorative dots as if all words had been enumerated. Beside it draw successive block lengths and explicitly permitted exceptional probability, distinguishing asymptotic average distortion from exact finite zero error.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Every finite binary word has positive probability for .1 source prevalence; fixed exact zero-error block width is 10 bits. Low probability is not zero probability.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: All 2¹⁰=1024 strings have positive probability, even though most ones are rare. Exact zero Hamming error requires a distinct reconstruction for each string, so a finite fixed-width description still needs at least ten bits. Yet H_b(.1)<1. There is no contradiction: the limiting boundary R(0)=H_b(.1) can be approached by fixed-rate codes whose permitted error tends to zero as block length grows. It is not the finite exact-zero-error requirement. Variable-length lossless coding instead approaches entropy in expected length by using longer descriptions for rare strings. Rate convention, error criterion and order of limits all matter.

### D16 — The converse follows the actual message

Placement lead: For a general finite block code, trace every route by which source information can reach the receiver.

Draw: Draw X^n to encoder message J to the deterministic decoder and Xhat^n. Message slots are labelled 1 through M schematically. Under the chain align log₂M ≥ H(J) ≥ I(X^n;Xhat^n) ≥ sum_i I(X_i;Xhat_i) ≥ sum_i R(D_i) ≥ nR(Dbar), with a short condition at each inequality. Pair each coordinate cost with its own D_i before averaging.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Name finite fixed codebook, deterministic decoder, iid source entropy step, per-coordinate feasibility and convexity/Jensen. Do not infer equality or a causal conclusion.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: An encoder maps Xⁿ to an index J among M possibilities; a deterministic decoder maps J to X̂ⁿ. Data processing and index entropy give

### D17 — Time sharing and channel mixing are distinct

Placement lead: Mixing channels and time-sharing block codes are related operations with different equalities.

Draw: Use two labelled source-block batches for operational time sharing; retain a visible fraction and each batch’s own code. Beside that, mix each row of two binary channels to create one stochastic channel, keeping source mass fixed. Trace linear distortion and compare the mixed channel’s computed MI with the weighted original MIs. Use the practice .1/.3 flip-channel example with equal weights.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Practice mixed-channel MI .278071905 versus weighted mean .324856754. Operational concatenated rate is the weighted rate; channel MI is bounded above by that average and need not equal it.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: With a fixed source, mutual information is convex in the conditional table. One proof writes it as KL(P_Xq || P_Xr_q); joint convexity of KL applies because both the joint and product-reference arrays mix linearly when q mixes. A rowwise mixture q=αq₁+(1−α)q₂ therefore has exactly the weighted average distortion and at most the weighted average information. Minimizing gives convexity of R(D).

### D18 — A random codebook covers likely words

Placement lead: A converse rules out impossible compression. **Achievability** must also show that codes can approach the remaining boundary. Draw many candidate reconstruction blocks from the marginal law of a good test channel, then let the encoder find one compatible with the source block.

Draw: Draw a schematic typical-input set, one selected x^n and candidate reproduction compatibility regions. State that shapes represent typicality sets, not metric balls or exact volumes. Draw independent candidate trials with hit probability a_n and the event that all M miss. Keep a_n tied to the chosen typical x^n and its asymptotic bound.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Miss probability (1−a_n)^M ≤ exp(−Ma_n). Independence belongs to random codebook generation; no literal geometric volume or finite numerical coding guarantee is invented.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep the schematic set and selected event visible, then stack probability calculations below. All regions are named in text; the shape is explicitly conceptual and is not used to imply measured volumes.

Following interpretation: For finite iid alphabets, a typical source block and an independently generated reconstruction are jointly typical with a probability whose exponential scale is 2⁻ⁿᴵ. Joint typicality means their empirical pair frequencies are close to the chosen joint law; it controls average distortion as well as frequency. The drawn covering regions are conceptual sets, not Euclidean balls with measured volumes.

### D19 — Exceptional events still contribute to average cost

Placement lead: Rare source blocks and failed searches still contribute to expected error.

Draw: Partition total probability into covered typical and exceptional mass. Attach distortion ≤d_max to the exceptional part and show its contribution ≤epsilon d_max. Below, draw an empirical joint count grid with structural zero-support cells visibly empty; distinguish a zero count caused by support from an observed finite-sample zero.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Finite alphabet and bounded cost justify the exceptional bound. Unbounded costs need additional tail control. Strong typicality does not assign positive counts to impossible pairs.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: For finite alphabets with bounded distortion d_max, exceptional probability ε contributes at most εd_max. On typical covered blocks, empirical pair frequencies make the mean cost close to the chosen test-channel cost. In **strong typicality**, zero-probability joint cells must remain empty; allowing arbitrary rare counts in those cells would contradict the specified support. These two controls complete the intuition behind the finite-alphabet achievability proof.

### D20 — Identify what is fixed in the finite optimization

Placement lead: The binary answer had a closed form. Most source and distortion choices do not. Start instead with a finite list of source values, a finite reconstruction list, their pair costs and a nonnegative distortion price λ.

Draw: Draw p as an A-entry source vector, d as an A-by-B cost matrix, variable row-stochastic q with the same axes, and induced output r with B entries. Trace q to I_bits+lambda D. Use the same named source/reproduction values throughout. Contrast the fixed distortion matrix here with the task-dependent predictive distortion in Information Bottleneck.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Row stochastic constraints and finite fixed alphabets are explicit. The channel objective is convex; no IB global guarantee is imported.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: The source vector p and cost array d are fixed. We choose each probability row of q; its induced output vector is r_q=pq. The objective is J(q)=I_bits(q)+λD(q). With the source, costs and alphabets fixed, this is convex in the full conditional table q. A neural parameterization need not preserve that convex optimization structure. The general information-bottleneck problem also differs: its predictive distortion depends on other changing distributions, rather than this one fixed cost matrix.

### D21 — Build one Gibbs row

Placement lead: A useful iteration begins from an output guess r. A reconstruction should receive more probability when it is already common and when its distortion for the current source value is low. Trace those two factors before normalizing.

Draw: Draw r=(.5,.5), cost row (0,1), lambda 2, factors (1,1/4), unnormalized weights (.5,.125), denominator .625 and row (.8,.2). Draw the symmetric second row beside it. L4 first stage exposes the current old marginal and row operation; next/back trace controls arrive once old/new timing is taught in D22.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Each q row sums 1. Natural exponential uses s=lambda ln2; base-2 weights use 2^(−lambda d). Do not put a bit-valued lambda directly into exp without conversion.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: For fair bits, Hamming costs and λ=2, start with r=(.5,.5). On source row 0, the unnormalized weights are (.5×2⁰,.5×2⁻²)=(.5,.125). Their sum is .625, giving row (.8,.2). Source row 1 gives (.2,.8). In general,

### D22 — Rebuild the output from the new channel

Placement lead: Each row is a distribution over reconstructions, not a distribution over source values. The source weights enter the second operation: rebuild the output marginal from all rows.

Draw: Multiply q^(t+1) by each source mass p_i, then sum by output column into r^(t+1). Keep r^t used in the Gibbs calculation visible separately and carry t/t+1 labels onto every row. Compute current MI using the marginal induced by this exact q. L4 adds cached step navigation and next-state comparison here.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Default fair example r^0=r^1=(.5,.5), q^1=(.8,.2;.2,.8), D=.2 and I=.278071905. Agreement of old/new marginals in this example must not erase their distinct roles.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: Multiply row i by pᵢ and sum each column. For the fair example, r¹=(.5,.5) again. Label the timing explicitly: old rᵗ generated qᵗ⁺¹, while new rᵗ⁺¹ is the marginal induced by that q. The current mutual information must use the new induced marginal. Using the old guess in its denominator adds an extra KL term and changes the reported objective.

### D23 — Each alternating step minimizes one block

Placement lead: An auxiliary distribution r separates the coupled channel problem into operations that each have an exact minimizer.

Draw: Draw the auxiliary objective as actual channel objective I_nat+sD plus mismatch KL(p_q||r). Trace a row minimization at fixed r into the Gibbs channel, then a marginal minimization at fixed q into r=p_q. The second step visibly removes the mismatch term. Align the normalizing Lagrange multiplier derivation with the row operation.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Use the same q,r,p,d in every term. Block descent does not justify measuring current MI against old r. Keep exact support assumptions visible.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: Use natural logarithms inside the calculation, with s=λ ln 2. Define

### D24 — A missing column cannot revive itself

Placement lead: An exact zero in the output guess removes an entire reconstruction from every row.

Draw: Place positive r=(.5,.5) beside exact-zero r=(1,0). Draw the second column as structurally absent, then show multiplication by its zero reference mass keeps every q_i1 zero. Carry both states to their actual objectives at fair source and lambda 2. Selection has an extra outline, so absence is not just a colour change.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Zero-support J=1; positive-support optimum J≈.678072. A deliberate positive restart is distinct from silently adding epsilon.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: If rⱼ=0, the numerator stays zero and marginal rebuilding cannot revive that column. For fair bits and λ=2, a start r=(1,0) gives a constant output: D=.5, I=0 and J=1. The positive start gives D=.2, I≈.278072 and J≈.678072. The zero-supported state is perfectly still and still worse. Use a positive start when all reconstructions are meant to participate. An explicit restart can change support; silently inserting an epsilon changes the experiment.

### D25 — A common log shift preserves probabilities

Placement lead: Finite positive weights can also become numerically tiny. Compute normalization through logarithms so that small scale does not turn all weights into zero.

Draw: For one actual row show log r−s d on a labelled log-weight ruler, select its maximum, subtract that common offset and exponentiate the shifted values. Sum the shifted weights and restore the offset only in log Z. Represent exact absent columns as −infinity with an absence label; distinguish them from a very small positive supported value.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Normalized ratios are invariant to a finite common additive shift. Valid finite positive support must not produce all-zero row weights. Missing support is a mathematical case, not an underflow correction.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: The row logits are ℓⱼ=ln rⱼ−sdᵢⱼ. If m=maxⱼℓⱼ, then log Σexp ℓ = m+log Σexp(ℓ−m). Subtracting m keeps at least one exponent equal to 1 while preserving ratios. Subtract the log normalizer to get log q, and rebuild marginals using another log-sum-exp. Keep exact absent columns at −∞. A stored log probability and an underflowed display probability can represent different numerical information; calculations should not unnecessarily turn the latter back into a log.

### D26 — The certificate tests every output column

Placement lead: To assess optimality on the whole declared alphabet, examine every reconstruction column, including absent ones.

Draw: Draw g_j=sum_i p_i exp(−s d_ij)/Z_i for every reproduction value, retaining even a zero-marginal column. Use a common horizontal reference line at g=1; active columns use filled labelled marks and inactive columns open marks. Highlight any inactive score above 1 as an improving direction. L4 exposes these fields only at this stage.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: At optimum active g=1 and inactive g≤1. Do not certify a locked-support solution by omitting its missing column.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: Substituting the minimizing q rows into the auxiliary objective gives f(r)=−Σᵢpᵢln Zᵢ. Its derivative with respect to rⱼ is −gⱼ, where

### D27 — The bracket belongs to the objective

Placement lead: The same scores produce a bound on how far the current objective can lie above the best possible objective.

Draw: Place lower=(f−ln(max g))/ln2 and upper=actual I_bits+lambda D on one labelled objective ruler; show unknown optimum as a bracketed interval, not an invented measured dot. Define f=−sum_i p_i ln Z_i next to its row contributions. Show the Jensen/max-g comparison against an alternative output marginal in adjacent algebra. L4 adds the gap here.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Lower≤optimum≤upper under the stated finite model. The interval is for the objective, not separate error bars on I and D. Floating evaluation is not rigorous interval arithmetic.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: For any other output law u, Jensen's inequality for the convex function −ln gives

### D28 — Array axes implement the same sums

Placement lead: Now express the same operations as array reductions. The axis is part of the mathematics.

Draw: Label A source rows and B reproduction columns. Show p[:,None]*q preserving A-by-B shape, axis-0 reduction producing r, axis-1 logsumexp producing row normalizers and total reduction producing expected cost. Connect each array operation to its scalar loop, then compare the complete same-fixture scratch and NumPy outputs. Show SLSQP termination separately.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Use actual programme fixture p=(.7,.2,.1), values 0/1/3 and lambda 1. The retained new run gives D=.225056645858, I=.437214546306 and bracket [.662271192075,.662271192164]; SLSQP success is a reported solver outcome, not a universal guarantee.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: In the library programme, p has shape (A,), costs and q have shape (A,B), and r has shape (B,). `p[:, None] * q` forms the joint table; summing axis 0 produces the output marginal. `logsumexp(..., axis=1)` normalizes each source row over reconstructions. The independent constrained-solver objective uses H(r)−ΣᵢpᵢH(qᵢ), with `xlogy` preserving the limit 0 log 0=0.

### D29 — Gaussian spreads use standard deviation

Placement lead: Now change the source: X is a Gaussian numerical measurement with mean μ and variance v. Variance is an average squared deviation; the visible width of a normal density scales with its standard deviation √v. Begin with v=9, squared-error budget D=2.25 and mean 0.

Draw: Keep D29 static at mean 0, v=9, D=2.25. Draw normalized Gaussian densities on actual value coordinates for source variance 9, error variance 2.25 and reproduction variance 6.75. Horizontal standard deviations are 3, 1.5 and sqrt(6.75); use their true density heights. A backward addition node combines independent reproduction and error. Labels distinguish variances from spread.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Variances add to 9; horizontal widths do not add. No live rate, shrink or selected-x control here. This is a fixed worked example, separate from L5 later.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack density panels with the same value scale and explicit density units. Preserve actual standard-deviation geometry; use outside labels and a separate conditional panel instead of overlapping long equations on curves.

Following interpretation: The backward construction has independent X̂∼N(0,6.75) and E∼N(0,2.25), then X=X̂+E. Their variances add to 9; their horizontal density widths do not add. The plotted source, reproduction and error have standard deviations 3, √6.75 and 1.5 respectively, and each density has total area one. This is a new numerical source, not the preceding three-level example.

### D30 — Bound Gaussian information through the error

Placement lead: Why does this construction give the best information rate? First bound the uncertainty that remains after reconstruction.

Draw: Trace E=X−Xhat from one paired point. Show a conditional error density and a Gaussian with the same allowed second moment as the maximum-entropy comparison. Align h(X)−h(X|Xhat)≥h(X)−h(E)≥.5log₂(v/D), naming the finite entropy/moment conditions. Draw D=0 and v=0 as point-mass branches rather than zero-width fake densities.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: For 0<D<v use the positive formula; D≥v permits constant mean and rate 0. For v>0,D=0 rate is infinite; for v=0 a constant reconstructs exactly with rate 0.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack density panels with the same value scale and explicit density units. Preserve actual standard-deviation geometry; use outside labels and a separate conditional panel instead of overlapping long equations on curves.

Following interpretation: Let E=X−X̂. Given X̂, translating X by that known amount preserves conditional differential entropy, so h(X|X̂)=h(E|X̂)≤h(E). Among densities with fixed mean and positive variance, the Gaussian maximizes entropy. To check that step, compare an error density with the Gaussian sharing its mean and variance. The Gaussian's negative log density is a constant plus a squared deviation, so its cross-entropy depends only on those moments and equals the Gaussian's entropy. Nonnegative KL then bounds the error density's entropy by that value. Finally Var(E)≤E[E²]≤D.

### D31 — The forward attaining channel shrinks the source

Placement lead: A decoder acts forward from source information, so convert the attaining backward joint law into a forward conditional law.

Draw: At D31 first mount L5. On an x/xhat coordinate plot draw conditional mean mu+(1−D/v)(x−mu), a selected x=3 and its mean 2.25 for v=9,D=2.25. The conditional density has variance 1.6875 and standard deviation sqrt(1.6875). Link this to the backward independent-error construction, keeping axes and units explicit.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Rate 1 bit, shrink .75. Naive independent noise added to X is not the attaining forward law. D=v uses constant mean; D=0 identity; zero variance is separate.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack density panels with the same value scale and explicit density units. Preserve actual standard-deviation geometry; use outside labels and a separate conditional panel instead of overlapping long equations on curves.

Following interpretation: The covariance of X̂ and X is v−D. Gaussian conditioning therefore gives

### D32 — A finite one-bit quantizer differs from the limit

Placement lead: A simple scalar compressor need not attain the Gaussian limit. Try sending only the sign of a centred measurement.

Draw: Draw a zero threshold under N(0,9), with two regions and actual representatives ±3sqrt(2/pi). Trace representative selection and squared residual, then compare its expected MSE with asymptotic one-bit D=2.25 on a labelled cost ruler.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Finite MSE 9(1−2/pi)≈3.270422048; one fixed index bit. Do not identify this Gaussian model with the empirical Palmer dataset.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack density panels with the same value scale and explicit density units. Preserve actual standard-deviation geometry; use outside labels and a separate conditional panel instead of overlapping long equations on curves.

Following interpretation: For X∼N(0,v), the best two reconstruction levels for sign groups are their conditional means ±√v√(2/π). The positive conditional mean follows by integrating x times the positive half of the Gaussian density and dividing by probability 1/2. With those levels the remaining MSE is v(1−2/π). At v=9 it is approximately 3.2704, whereas the one-bit Gaussian limit is D=v/4=2.25. The former is an actual scalar rule; the latter is a long-block information limit.

### D33 — Move each representative to its assigned mean

Placement lead: For a finite sample, a related scalar quantizer alternates assignments and means.

Draw: Draw points 0,1,4,5 at their actual positions, initial centres 0/4 and boundary 2. Label assigned members, move centres to means .5/4.5 and then move the boundary to 2.5. Keep old positions as thin labelled outlines. Place the exact K-Means Lloyd/palette prerequisite link beside this reused mechanism.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Assignment ties use the stated order. The mean minimizes squared error within a fixed group; another cost may require another representative.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: For points 0,1,4,5 and centres 0,4, the initial midpoint is 2. Nearest-centre groups are {0,1} and {4,5}; their means are .5 and 4.5. Updating those representatives moves the boundary to 2.5. This is the one-dimensional Lloyd operation already implemented in [K-Means and Hierarchical Clustering](/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml), including its complete `clustering_lloyd.py` and palette/index example `clustering_quantization.py`. The method decreases its sample squared-error objective but can stop at a local optimum. Its centroids and payload indices do not establish the Shannon frontier.

### D34 — Reverse water filling allocates error

Placement lead: Suppose one source sample is a vector of independent Gaussian components with variances 9 and 1. We can spend total squared error 3 across both. Visualize the variance of each component as its maximum useful error allowance.

Draw: Draw two variance caps at 9 and 1 on the same vertical squared-unit scale. A horizontal level theta=2 allocates min(v_i,theta), so the first allowed-error region is 2 and the second is capped at 1. Hatch allowed error and leave retained variance unfilled; label both meanings. L6 first mount changes the two variances and total budget.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Total error 3, component errors 2/1 and rate 1.084962501 bits. Level has distortion units, not standard-deviation units. The fill means discarded/allowed error.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: Once a component's allowed error reaches its variance, reconstructing its mean already uses zero rate. Further error buys no reduction. An unconstrained equal split 1.5/1.5 would waste .5 on the second component. Instead use D₁=2,D₂=1, leaving rate .5 log₂(9/2)≈1.084963 bits per vector.

### D35 — An active component has a common marginal benefit

Placement lead: The common level follows from equal marginal rate savings among uncapped components.

Draw: Draw marginal rate reduction .5/(ln2 D_i) against positive allocated error; align its uncapped equality with the common water level. Carry component identities through budgets .5,2,3,10, showing allocations (.25,.25),(1,1),(2,1),(9,1). Add an explicit zero-variance component branch and unused budget after all caps saturate.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Common positive allocation on active components, caps at their variances. Zero total budget with a positive variance gives infinite rate; total above sum variances gives zero rate and unused budget.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: Minimize Σᵢ(.5 log₂(vᵢ/Dᵢ)) over positive-rate components, subject to the sum constraint. The derivative is −1/(2 ln 2 Dᵢ). A multiplier for total error therefore makes all uncapped Dᵢ equal. Low-variance components hit their caps first. Zero-variance components are already known and require no bits. At zero total error, any positive-variance continuous component has infinite rate.

### D36 — Rotate a jointly Gaussian source into its axes

Placement lead: Independence was useful for adding component rates. A jointly Gaussian vector can have correlated original coordinates; an orthogonal covariance eigenbasis gives independent transformed Gaussian coordinates.

Draw: Draw the covariance ellipse for [[5,4],[4,5]], with orthogonal ±45-degree directions labelled by variances 9 and 1. Trace x through Q transpose into component coordinates, allocate total error 3 as 2/1 and rotate back by Q. Draw equal Euclidean norm circles before/after as the cost-preservation cue.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Independent components follow joint Gaussianity, not merely zero covariance. Eigenvector sign choices may flip an axis, but variance/error pairing remains correct. No anisotropic weighted cost is silently rotated as Euclidean cost.

Responsive geometry: At 390 px and at 768 px with 32 px root text, retain a square coordinate region and equal geometric axis scale for Euclidean geometry. Put matrix, eigenpair and reconstruction calculations below it. Labels remain outside ellipses with leaders, not inside squeezed marks.

Following interpretation: For covariance Σ=[[5,4],[4,5]], the directions (1,1)/√2 and (1,−1)/√2 have variances 9 and 1. Write Σ=Q diag(v)Qᵀ and transform a centred sample to Qᵀx. Orthogonal Q preserves summed squared error, so the total budget is unchanged. Apply scalar allocation in those coordinates, then rotate the reconstruction back. A sign reversal of an eigenvector changes coordinate orientation but not the covariance or rate.

### D37 — Rotate the error covariance back too

Placement lead: Track the error covariance through the same rotation.

Draw: Keep D36 component identity and show Q diag(2,1) Q transpose as the error ellipse in original coordinates. Label its matrix [[1.5,.5],[.5,1.5]] and trace 3. In the library route, explicitly pair ascending eigenvalues 1/9 with errors 1/2 before multiplication.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Matrix symmetry and trace 3; sign-flipped paired eigenvectors give the same covariance. All axes use declared abstract source units and squared-error units.

Responsive geometry: At 390 px and at 768 px with 32 px root text, retain a square coordinate region and equal geometric axis scale for Euclidean geometry. Put matrix, eigenpair and reconstruction calculations below it. Labels remain outside ellipses with leaders, not inside squeezed marks.

Following interpretation: In the high-variance/low-variance ordering, error variances 2/1 give

### D38 — The conditional mean minimizes paired MSE

Placement lead: An accurate optimizer cannot repair an inappropriate distortion criterion. To understand why MSE can average away a detail, suppose a message Z leaves the receiver uncertain between source values −1 and +1.

Draw: Merge fair source values −1/+1 into the same zero-message group. Draw reconstruction 0 between them and residuals −1/+1. For a general candidate a, show X−a=(X−mu)+(mu−a), then collect the conditional cross term to zero because E[X−mu|message]=0.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: MSE equals conditional variance plus squared displacement from the conditional mean. A mean can fail to look like a source sample without violating this criterion.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: Given Z, let m=E[X|Z]. Expand X−a=(X−m)+(m−a). The cross-term has conditional expectation zero because E[X−m|Z]=0. Therefore

### D39 — Marginal agreement can destroy pairwise fidelity

Placement lead: A decoder can instead produce plausible-looking values with the correct marginal distribution, while pairing them badly with the actual inputs.

Draw: Draw all four independent fair source/reconstruction sign pairs with masses 1/4, costs 0 on agreements and 4 on disagreements. Place the constant-zero decoder beside it with cost 1 for both inputs; show copy as a distinct input-dependent rule. L7 changes decoder choice and selects a pair, with joint table and marginals visible.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Independent-sign MSE 2, constant-zero MSE 1, both MI 0; copy MSE 0, MI 1. Varying independent output prevalence leaves its MSE 2 under fair source.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: An independent fair-sign reconstruction has four input/output pairs, each with probability 1/4. Two matching pairs cost 0 and two mismatches cost 4, giving MSE 2. Its output histogram exactly matches the source, but its paired error is worse than constant 0. Both schemes have I(X;X̂)=0 because neither uses a source-dependent message. Copying the source gives zero distortion and one bit of information; that is a different communication rule.

### D40 — Rare errors and costly errors are separate choices

Placement lead: Now hold event frequencies fixed and change the consequence assigned to a rare error.

Draw: Draw source values 0/1/3 and masses .7/.2/.1, squared-cost matrix and the edited high-source-row multiplier. Keep source masses fixed when multiplier changes. For selected source value 3 trace conditional row cost, then its population contribution times .1. L8 also shows full channel, induced output law, I, D, objective and all-column gap after its declared fixed update count.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Default multiplier 1, lambda .1, positive uniform initialization and exactly 500 updates. Compare multiplier 10 and lambda 0; all-zero cost is an explicitly different null. Do not label the fixed budget as tolerance convergence.

Responsive geometry: At 390 px and at 768 px with 32 px root text, keep row/column labels attached to their cells. Stack full stages vertically. If a genuine matrix cannot fit, use a labelled local scrolling region plus its exact selected-row equivalent; prose and controls must still wrap without page overflow.

Following interpretation: Use source values 0,1,3 with probabilities .7,.2,.1. The default cost is squared error. Multiplying the entire high-source row by 10 changes its miss consequences while leaving the source law fixed. Inspect both the conditional cost on that row and its probability-weighted contribution to the overall mean: they answer different questions.

### D41 — A payload becomes a file only with framing

Placement lead: So far a codebook index had a declared ideal width. A file also needs enough information for the receiver to parse and reconstruct it. Return to the original `000`/`111` codebook and send all eight three-bit inputs in order.

Draw: Draw the default 24 source bits as eight three-bit blocks, their codeword indices 00010111 and payload byte 0x17. Prepend the four count bytes 00 00 00 18 and show all five bytes as eight bit cells each. Link a selected source block to its index bit and byte position. L9 first mount edits source text and displays reconstruction immediately.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Default payload rate 1/3 bit per source bit, whole-message rate 5/3, raw source length 3 bytes. The index bits themselves are lossless in the file; distortion occurs at reconstruction choice.

Responsive geometry: At 390 px and at 768 px with 32 px root text, wrap at complete byte boundaries, preserving byte offsets and bit positions. Stack header, payload and decoded stages. Do not wrap a bitword into ambiguous fragments; link selected positions by labels as well as colour.

Following interpretation: The 24 source bits become eight one-bit indices: `00010111`, hexadecimal `17`. Our protocol stores the original source-bit count in a four-byte unsigned big-endian header: `00 00 00 18`, since hexadecimal 18 means decimal 24. The complete message is `00 00 00 18 17`, five bytes. Raw packed source bits would occupy three bytes. The payload rate is 8/24=1/3 bit per source bit, while the complete-message rate is 40/24=5/3. This tiny file grows once its declared header is counted.

### D42 — The decoder needs counts and padding rules

Placement lead: Follow the receiver's parsing steps, including an incomplete last source block.

Draw: Trace reading the big-endian 4-byte source count, computing ceil(n/3) indices, verifying payload size and zero byte padding, mapping indices to codewords and truncating to n source bits. Draw source-block padding and final byte padding as distinct labelled regions. L9 adds malformed-message examples only after this protocol explanation.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Empty source has a 4-byte header and undefined per-symbol rate. Reject truncated/extra payload and nonzero padding; nonbinary source drafts retain the last valid result. A changed codebook requires an explicitly different index format.

Responsive geometry: At 390 px and at 768 px with 32 px root text, wrap at complete byte boundaries, preserving byte offsets and bit positions. Stack header, payload and decoded stages. Do not wrap a bitword into ambiguous fragments; link selected positions by labels as well as colour.

Following interpretation: Read the count n, infer ⌈n/3⌉ code indices, check the corresponding payload byte count, then expand each index to its three-bit codeword. Remove reconstruction positions beyond n. The encoder zero-pads a partial source block before choosing its nearest codeword and zero-pads the final payload byte. Those are two different padding operations. The decoder checks unused payload bits and rejects malformed lengths. Empty input has a valid four-byte header but no meaningful per-source-symbol rate.

### D43 — Quantization changes the measurement before coding

Placement lead: First isolate the only lossy step: choosing a reconstruction grid.

Draw: Draw one retained bill measurement in integer tenths of a millimetre, adjacent step-s bin boundaries and the nearest grid representative. Trace u to k=floor((2u+s)/(2s)), then to reconstructed k*s. Mark halfway ties upward. The downstream uint16 index and zlib stage preserve the chosen index.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Nonnegative u and positive integer s; integer arithmetic avoids rounding a decimal tie through binary floating error. Report squared physical residual in mm² after division by 10.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: Parse each decimal measurement into an exact integer u in units of 0.1 mm. For a positive integer step s in those same units, choose index k=⌊(2u+s)/(2s)⌋ and reconstruct ks. For nonnegative values this rounds to the nearest grid point, with exact halfway cases going upward. For example u=5 at step 10 becomes index 1 and reconstruction 10, meaning .5 mm becomes 1.0 mm. Integer arithmetic makes that tie rule explicit; a binary floating-point `round` with a different convention is not interchangeable.

### D44 — Measure decoded error and complete file size

Placement lead: Compare only measured errors and complete message lengths from that declared implementation.

Draw: Draw retained measured/decoded row pairs with original row identifiers and their residuals; label the 344-record input and omission of bill-length-missing rows 4/272, leaving 342 values. Plot only the four recorded steps 1/5/10/20 with exact MSE and whole-message byte counts from the retained output. Connect marks only as an ordered-step guide, not an interpolated theoretical frontier. Provide the exact value/byte table.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: MSE 0/.019269006/.092660819/.335350877 mm²; whole bytes 513/368/296/231. Include 11-byte header and zlib payload. Retained numeric sequence is encoded, not species, row identifiers, missingness or the full CSV.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: There are 344 CSV records; bill length is missing at original data rows 4 and 272, leaving 342 measurements. Each observation has equal weight in this empirical storage calculation. The raw unsigned-16-bit baseline for that sequence is 684 bytes before any extra metadata. Using zlib level 6, `wbits=15`, and zlib build/runtime 1.3.2, the recorded results are:

### D45 — A learned codec separates transformation and coding

Placement lead: An autoencoder with eight latent numbers has eight coordinates, not a declared eight-bit message. Trace the operations that turn one latent coefficient into transmitted bits and a reconstruction.

Draw: Trace a named coefficient through analysis transform y, round to q, probability mass model Q(q), entropy coder to actual bits, entropy decoder, and synthesis to Xhat. Draw a separate training-only branch adding uniform noise to y and taking a differentiable expectation proxy; it reconnects to the objective, not to the actual bitstream.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Distortion changes the reconstruction; entropy coding is lossless for quantized symbols under the declared model. A training noise sample is not a transmitted integer or an observed bit count.

Responsive geometry: At 390 px and at 768 px with 32 px root text, stack complete stages in reading order. Reroute every edge to its actual labelled endpoint. Parallel alternatives remain branches, never a sequential chain. Place labels in reserved gutters and keep identities on both ends.

Following interpretation: An analysis transform maps the source to real-valued latents y. Quantization maps y to discrete indices q. A probability model supplies masses for those indices; a lossless entropy coder converts them to bits. The receiver uses the agreed model and syntax to recover indices, then a synthesis transform produces X̂. Each arrow performs a different job. An entropy model does not itself reconstruct the image, and a synthesis transform does not specify how its inputs were transmitted.

### D46 — Entropy, mismatched price and bytes answer different questions

Placement lead: Several commonly reported “rates” describe different random objects or costs.

Draw: Align a symbol frequency table P and declared coding model Q with H(P), cross entropy H(P)+KL(P||Q), the previous lesson’s variational MI upper bound and complete file bytes in four explicitly named rows. Use the practice prefix code’s actual counts, bitwords, source-count header and padding to connect ideal expectations to a finite message.

Encoding: Preserve source and reproduction identities from the shared contract. Use colour for membership or quantity role, with labels/patterns/shapes as redundant cues. Selection adds a neutral outline without replacing identity. Cost magnitude uses a labelled numeric scale; exact zero, absent support and unavailable conditional rows use distinct words and marks.

Required checks: Deterministic quantized latent gives I=H(q) under its declared law. Continuous-noise training is a different joint law. Prefix payload bit length and total bytes include different overhead; never silently omit model/header costs.

Responsive geometry: At 390 px and at 768 px with 32 px root text, preserve numeric scales and units while stacking comparisons. Put direct labels outside crowded marks with leaders. Never shrink text to fit or silently autoscale a shared comparison; an exact labelled table accompanies closely spaced points.

Following interpretation: For discrete indices with actual law P and coding law Q, expected ideal log price is H(P)+KL(P||Q). Model mismatch adds cost even if the representation itself is unchanged. A complete finite file also includes integer coding overhead, framing, metadata and any model description that is not already shared. For deterministic discrete indices q=f(X), I(X;q)=H(q); a continuous noisy training latent is a different variable.

## Nine investigations and their complete state contracts

### L1 — Change the actual codebook

The question is how reconstruction groups change when the available codewords or source probabilities change. Start with ordered book [000,111], fair independent source bits and selected source word 011. At D02 show source words, assignment edges, candidate distances and selected reconstruction. At D03 add the source prevalence control and correctly weighted expected/worst error. At D04 enable arbitrary codebook membership and show physical width ceil(log₂ M)/3 beside cardinality log₂ M/3. Earlier stages never expose an untaught formula. These are shared stages of one investigation.

Controls: eight labelled membership checkboxes after D04; source prevalence numeric/range value in [0,1] default .5; selected word among the eight words. Codebook order is ascending numeric bitword, and ties choose its first entry. Reject removing the last codeword and retain the prior book. Default results are expected distortion .25, worst positive-mass distortion 1/3 and one index bit per block. All eight words give error 0; one constant at fair source gives .5; [000,001,110,111] gives 1/6. At prevalence 0/1 only positive-mass words affect the maximum. M=3 exposes the unused binary address; M=1 has zero payload width. Reset restores the exact original book, prevalence, selection and messages. No entropy-of-index or Shannon-frontier field appears before those ideas are taught.

### L2 — Build the binary attaining law

The question is why the best forward errors are generally asymmetric. First mount at D11 displays backward independent factors, products, joint cells and checked source marginal. At D12 add forward row normalization and comparison with the symmetric forward channel. Default source prevalence .2, budget .1 and selected joint cell (0,1) give r=.125, joint (.7875,.0125;.0875,.1125), forward errors .015625/.4375 and actual error .1.

Controls are p in [0,1], budget D in [0,.5] and one of four joint cells. The same state updates both mounts. When budget reaches min(p,1−p), show the best constant and its actual error, which may be smaller than budget; a fair tie chooses constant 0 and says either constant works. Zero-mass source rows are unavailable. Check p=.5 symmetry, p=.3 changed asymmetry, D=0 identity, both degenerate p endpoints and p=.5,D=.5 without 0/0. Every comparison states the source and actual distortion. Reset returns .2/.1/cell(0,1), clears drafts and restores both mounts.

### L3 — Compare a budget with a distortion price

At D13 show the piecewise curve and separately labelled finite codebook point. Defaults p=.5, D=.25. Controls p∈[0,1] and D∈[0,.5] update the selected budget result. D14 adds lambda∈[0,8], default 2, and the support-line optimum after its definition. All mounts share state. The manual budget marker and the minimizer for lambda are separate marks: moving lambda does not silently overwrite the chosen budget. Use fixed axes D∈[0,.5], I∈[0,1] bits; a line may clip at the plotting boundary with endpoints clearly indicated.

For fair source and lambda 2, selected optimum is D=.2. For lambda 0, choose the best constant from the zero-rate family and label the nonuniqueness. p=.2 has threshold .2; p=0/1 is degenerate and D=.5 permits zero rate. The finite (.25,1/3) point always remains explicitly the fair-source codebook comparison; hide it with an explanation or recompute its actual source-weighted error when p changes, never imply it retains fair-source coordinates for another law. Reset restores p=.5,D=.25,lambda=2 and all selection/draft state.

### L4 — Follow a finite BA update

The question is how reference mass, conditional rows and induced output mass relate, and why a locked column can defeat an apparent fixed point. Default fair binary source/cost, lambda 2, r⁰=(.5,.5). D21 shows the first proposed q¹=(.8,.2;.2,.8) from r⁰. D22 adds step navigation and distinct old-r/current-q/induced-new-r fields. Step 0 denotes that first computed channel, not an invented initial q. D26 adds all-column scores; D27 adds the objective bracket after each has been taught. The chosen state and reset are shared across the mounts.

Controls: source/cost scenario (fair binary, p=(.7,.2,.1) with squared cost on 0/1/3, or the labelled high-row-cost case), lambda in [0,5], positive uniform or explicit locked-first-column initial marginal, and cached step 0 through at most 120. For binary positive support an output-mass control in [.01,.99] sets r⁰=(1−a,a); exact zero support is selected separately. Three-level scenarios use the named uniform or locked-first-column initializations rather than an unexplained free probability editor. Parameter changes recompute one bounded deterministic history and return to step 0. Early convergence may end that history; display its actual length and disable unavailable steps. Next/back only select cached states. Never report 120 completed updates when fewer occurred.

Every selected state shows source/cost law, actual number of applied updates, r used for q, q and its induced marginal; MI uses that induced marginal. Check positive fair optimum J≈.678072 against locked r=(1,0), J=1, lambda 0, levels and weighted-cost scenarios. All-column certificate includes absent columns. No hidden epsilon, automatic positive restart or global claim based solely on iterate movement. Reset restores binary/uniform/lambda 2/step 0/selected row 0 and clears drafts. No old scientific programme is rerun by interaction.

### L5 — Inspect the forward Gaussian law

D29 remains the explicitly fixed static normal-density example. The live view first mounts at D31, after both bound and forward law. Default mean 0, variance 9, distortion budget 2.25 and selected x=3 produce rate 1 bit, shrink .75, conditional mean 2.25 and variance 1.6875. Controls: v∈[0,16], D∈[0,16], x∈[−12,12], with labelled numeric/keyboard inputs; mean stays 0. For a positive interior budget, density width uses the actual conditional standard deviation. Use a selected-x conditional panel rather than making its probability look like a discrete point mass.

For D≥v, show constant mean, rate 0, actual distortion v and unused budget D−v. For positive v,D=0, show identity and infinite rate. For v=0, show the point-mass source and constant exact reproduction. Unsupported or invalid numeric drafts do not alter the previous state. Compare v=4,D=1: relative shrink and rate stay the same, while widths change. Reset v=9,D=2.25,x=3 and all messages/selections. Static D29 does not silently become a second independent live state.

### L6 — Allocate a total distortion budget

At D34 show two component caps v=(9,1), total budget 3, error allocation (2,1), theta 2 and rate 1.084962501 bits. D35 extends the same state with the marginal-benefit comparison after its derivation. Controls: each variance in [0,16] and total budget in [0,32]; numeric inputs permit representable small positive budgets. The UI labels this as a total, not per-coordinate distortion. Do not silently replace a tiny positive budget with zero; retain the existing active-set representability guard and report unsupported numeric precision honestly.

Check budgets .5/2/3/10 with fixed 9/1, and v=(4,1), budget 1.5 giving errors .75/.75 and rate 1.415037499. Above the sum of variances show unused budget and zero rate. Zero variance needs no bits; total zero with a positive variance gives infinite rate, while all-zero source gives rate zero. Fixed-height caps and a shared labelled squared-unit scale preserve the comparison; if the domain changes, keep ticks explicit. Reset variances 9/1, total 3 and drafts/messages. Scalar active-set logic owns the live result; library root solving is the explained ordinary-range comparison in the programme, not a dependency secretly fetched by the lab.

### L7 — Preserve a histogram or preserve the pair

Default fair source signs, independent-sign decoder with output-plus probability .5 and selected pair (−1,+1). Show all source/output joint cells, output marginal and selected squared residual; compare the constant-zero and copying rules on the same source. Controls choose constant/independent/copy and select a possible pair. The independent output prevalence control in [0,1] appears only for that named rule, after its meaning is explained. Source remains fair.

Independent reconstruction has MSE 2 for every prevalence, so changing its histogram is a deliberate null for paired cost. At .5 it matches the source marginal but still has no information. Constant zero has MSE 1/MI 0; copy has MSE 0/MI 1 and an input-dependent message. Zero-mass pair selections are marked impossible and not assigned a conditional observation. Reset independent/.5/pair(−1,+1), preserving source identity colours and clearing messages. Never compare a copied pair as a zero-message algorithm.

### L8 — Price the rare source row

Default source values 0/1/3 with masses (.7,.2,.1), squared-error cost, high-row multiplier 1, lambda .1, uniform positive output initialization, selected source value 3. Draw the channel after exactly 500 marginal updates, its induced output law, row cost, probability-weighted contribution and actual all-column objective gap. Controls: multiplier in [1,10], lambda in [0,5] and source-row selection. A separate explicitly named all-zero-cost preset demonstrates the null; it does not masquerade as multiplier zero.

Every meaningful edit computes one deterministic fixed-length trace from the same uniform initialization; reuse the result for selection-only edits. The current model’s generic solver may stop early on its convergence flag. Therefore the runtime must use a topic-local pure fixed-count path through the same update equations that omits that early-convergence break for this investigation, or retain a separate exact-count option. Passing iterations=500 to the early-stopping path is insufficient. This is a required implementation adaptation; no such runtime change or new 500-step scientific execution is claimed here. Report exactly 500 only after 500 updates were applied and always display the achieved gap, not a fabricated tolerance success.

Compare multiplier 1/10 at lambda .1, lambda 0 and all-zero cost. Preserve p throughout cost edits; a larger conditional rare-row cost is distinct from its smaller source-weighted contribution. No first-principles promise of monotonic unweighted physical error under a changed weighted objective. Reset all defaults, ordinary squared cost, selected source 3, initialization, count, drafts and messages. L4 shares equation timing but has its own smaller browsing history.

### L9 — Follow indices into actual bytes

Default source is the concatenation 000001010011100101110111, fixed ordered codebook [000,111], first selected block. The eight indices are 00010111, payload 0x17, header 00 00 00 18 and complete message five bytes. Source input accepts binary strings of length at most 48; selection links source block, mismatch positions, codeword index and payload bit. Output and decoded source are visible immediately. Nonbinary/overlong drafts retain last valid result and give an associated message.

At D41 show the valid encoder/message. At D42 add decoder steps, source and byte padding and selectable fixed malformed examples (truncated header/payload, extra payload, nonzero unused bits), with rejection attached to the failed rule. Empty source is valid and has a four-byte header but no per-symbol rate. Try source 1 and 001011 to expose partial blocks and whole bytes. Reset the exact 24-bit source, first block, valid-message mode and drafts. The separate four-word two-bit practice protocol is its own complete file; it must not silently alter this one-bit codec.

## Code, data and verification boundary

Implement these contracts only after the complete content packet is independently accepted. Reuse the seven preserved programme pairs and the three once-executed new programmes, plus the complete helper and changed-practice file. Print-only fidelity/bitstream successors retain their original numeric outputs and move explanatory print text into prose; they are not new scientific runs. Copy and download bytes must match the accepted source selected in the file index, including helper imports and dataset basename. The pinned CSV provenance explains the omitted measurements and the numeric sequence that is actually encoded.

Later runtime review must inspect the whole reading path, every changed/null investigation state, code delivery, current loading/recovery behavior, ordinary/narrow/enlarged layouts and effective colour distinctions. Source arithmetic checks cannot certify those rendered conditions. Do not rebuild entire public trees, replay old numerical campaigns or keep redundant capture grids merely to renew timestamps. Keep only source-bound current evidence needed for review.
