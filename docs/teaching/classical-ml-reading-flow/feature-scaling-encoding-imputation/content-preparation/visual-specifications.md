# Content drawing and investigation specifications

Complete adopted contracts for this full manuscript, with content-time computed refinements. These are actionable content assets; no rendered/native review is claimed. Read visual-refinements.md for exact successor matrices, fit/output roles, policy domains and bounded comparator qualifications. The original accepted design remains unchanged.

## Common drawing protocol

Place each drawing immediately after its one-sentence lead and before the walkthrough that names its parts. Draw actual cells, coordinate axes, vectors, intervals, basis functions, sparse entries, coefficients and completed datasets. Prose in connected boxes is not a substitute for those objects. A boundary outline is legitimate only when it encloses the actual rows/state it separates. Labels live where their referents occur; formulas and long explanations reflow in HTML. A text/table equivalent supplies exact operands, units, ordering and state for every quantitative drawing.

Data roles: E = exact constructed example with an explicit calculation/source role; H = retained historical ecological/numerical result with the original input/version/date; A = analytic function with stated parameters, not measurement. Every final caption identifies its role. No invented timing/performance or new fitted ecology. Current colour/selection/missingness conventions are in the main design. Missing estimates retain the original absence marker after filling. Do not render missing as an observed zero, an outlier as a clipped in-range point, or an unknown category as a biological fact.

At narrow widths, stack logically separate panels with repeated axes/column headers; do not shrink a complete desktop SVG to unreadable labels. Use equal physical axis scale for distance/circle geometry, common declared scales for comparable panels, full-domain plus zoom for outliers, and visible labelled continuation for a deliberately cropped coordinate view. Full quantitative values remain accessible. Pan/zoom may alter the viewport, never computed values. In labs, edit domains and axes stay synchronized; no hidden clamp. Stable axes during pointer changes; expand on committed changes with an explained domain if necessary. Exact values do not snap to unrelated grids. Native keyboard/pointer, intermediate width, 390/320px, 768px at200% text, label/arrow/point collisions and changed-state completeness all require later inspection.


<a id="d01"></a>
## D01 §1: What is one recorded case?

H: table with row309, four measurement columns with mm/g, recorded sex, separate target column and source-position label. Highlight one row/one column with independent outlines; n×d shape beside the feature block, y n×1 beside species.

Altered missing-mass copy and unchanged sex in D02. Text lists full row and meaning of row index. Narrow layout splits feature and target blocks but repeats row309; never converts it to an anonymous list of boxes.

<a id="d02"></a>
## D02 §1: What changes when representation changes?

H/E: two aligned actual row arrays, one observed and one altered `[51,18.8,203,NA,male]`; numeric/categorical output positions align to labelled coordinate cells. Missing mass cell's hatch persists on its filled4000 result; sex remains observed `male`.

Before teaching fitted arithmetic, outputs can be labelled “prepared coordinate” with example numerical values introduced in §5–6, not unexplained μ/σ. Text distinguishes record, transformation and estimate; mobile shows both rows in sequence.

<a id="d03"></a>
## D03 §2a: Why does B look nearer in raw units?

E: actual bill-mm/mass-g Q,A,B coordinate plot and separate enlarged difference plot centred at Q. Q=(40,4000), A=(41,4100), B=(43,4001); direct IDs/shapes, axis ticks/units, difference arrows and their signed differences.

Raw physical axes may have different numeric units, explicitly shown. Metric panel uses equal transformed units. Text gives all coordinates; mobile stacks the raw and transformed views with full labels.

<a id="d04"></a>
## D04 §2a: What do the divisors do?

E: for each A/B, draw right-triangle difference legs Δbill/a and Δmass/b on equal-aspect coordinates, with true circle through each point; separate squared contribution areas/bars with common zero and sum.

At a=1,b=1 totals10001/10; a=1,b=100 gives2/9.0001; coincident and exact ties stay literal. Do not cap radii at plot edge. Domain covers complete largest radius or uses a second full-extent panel. Numeric table carries contributions and totals.

<a id="d05"></a>
## D05 §2b: Which training observations determine a ruler?

E/H: sorted five-value points on real numeric axes; mean22 with deviation segments/population square reduction, endpoints1/100, quartile2/4 and median3; fitted transformed positions for standard/minmax/robust on separate labelled axes.

All panels show100 and later150 separately; paired zoom shows1…4 without claiming equal axes across different rulers. Robust100→48.5, later150→73.5 visible at full extent. Max-abs baseline0…1 is a fourth small linked panel. Exact table and fit-statistic provenance accompany.

<a id="d06"></a>
## D06 §2b: What does a constant fitted column mean later?

E: training `[7,7,7]`, centred differences all0, scale replacement1, query7→0 and9→2 as actual points on the output axis.

Do not show future9 forced to0. Distinguish “constant at fit” from “always constant.” Include an all-missing column with no median as a separate hatched row and declared reject/keep policy; text/stacked arithmetic.

<a id="d07"></a>
## D07 §2c: What is lost by row normalization?

E: 2D vectors[3,4],[6,8] on the same ray and their shared[.6,.8] on a unit circle, with lengths5/10; zero vector drawn at origin with undefined direction label.

Change vector direction while holding length versus change length while holding direction. Text gives norm and output; mobile two equal-aspect panels, not a stretched circle.

<a id="d08"></a>
## D08 §2c: Why do storage and penalties matter?

E: literal 3×3 sparse matrix with zeros unpainted, nonzero centre subtraction creating visible new entries; coordinate-coefficient pair x,w and scaled x/s,sw yielding same prediction but different w² contribution.

State-centering support is drawn, not a vague memory icon. Penalty example uses x=[1,100], w=[1,.01], s=[1,100], transformed x=[1,1], w'=[1,1]: both dot products2, squared norms1.0001/2. Author arithmetic readback verifies squared norms 1.0001/2; P2 checks matrix support 3/9 and the answer source checks equal dot products. Mobile matrix panels then coefficient rows.

<a id="d09"></a>
## D09 §3: What does a nominal label become?

E: red/green/blue literal 3-coordinate indicator rows, their three labelled coordinate-axis endpoints and pairwise edges√2. Projected 3D picture is explicitly a schematic of three true coordinates; vector table supplies exact geometry.

Labels are category names; nominal palette need not literally paint the name “green” green. Show shape/ID correspondence. No category order implied by projection. Mobile coordinate matrix followed by small geometry.

<a id="d10"></a>
## D10 §3: Why might dropping a column change the task?

E: same three vectors after dropping red become two basis endpoints and origin; draw lengths1,1,√2 on equal-scale plane. Beside it, actual intercept/indicator design columns showing sum of all indicator columns equals intercept.

Separate distance symmetry from full-design rank and regularized estimation. Do not claim dropping required for all solvers. Exact matrices/edges; stack panels on phones.

<a id="d11"></a>
## D11 §3: Which category state is this?

E: fitted frequency table and vocabulary columns for known frequent, grouped rare, reserved missing; new unknown input branches into error/all-zero/infrequent-if-present under explicit policies, showing actual output rows.

Unknown and missing remain separate labels even if a chosen policy maps them together. Grouping learned on training counts only. State whether infrequent bucket exists. Text lists outputs and column names; no sentence-box-only flow.

<a id="d12"></a>
## D12 §3: Does an ordered code specify distance?

E: ordered small/medium/large placed at0/1/2, equal adjacent distances; a second nominal label permutation changes code distances while full one-hot distances stay fixed.

Order is knowledge, equal spacing is an additional modeling choice. Contrast threshold-based native category handling only via actual documented API, without implying arbitrary code magnitudes are universal. Tables plus axis on narrow layouts.

<a id="d13"></a>
## D13 §4a: What does a median fill assert?

E: `[10,20,NA,NA]` table, observed order-statistic average15 and two filled cells marked as estimates; companion input-mask matrix `[0,0,1,1]` and compressed observed-versus-completed scatter.

Show variance/spread change as a constructed consequence, not an inferential estimate of truth. An observed15 and filled15 have same numerical input but different recording histories. Text gives operations and mask.

<a id="d14"></a>
## D14 §4a: What could cause the gaps?

E: actual small table with station and weight plus same missing mask under three specified generators: independent coin, observed-station probability, unobserved-weight probability. Each generator is a separate conditional probability mapping and eligible cells, not an observed diagnosis.

Structural “not applicable” appears as a distinct recorded state. Mask-pattern plot is descriptive; arrows cannot certify MCAR/MAR/MNAR. Text states conditional assumptions and absence of identification from observed cells. Stack three row-pattern panels.

<a id="d15"></a>
## D15 §4b: What can this donor be compared on?

E: actual4×3 matrix Q/D1/D2/D3, vertical coordinate connectors only where query/donor both observed; q=2/1/1 and missing target c shown. Numeric difference cells precede distance.

Changing D2 target does not alter a/b overlap; changing one overlap cell does. Target-c eligibility is independent of distance-defined flag. Text preserves full matrix; on phones one donor trace at a time plus the whole table.

<a id="d16"></a>
## D16 §4b: Why rescale observed differences?

E: per-donor sum squares5,1,4 and multipliers3/2,3/1,3/1 → adjusted squares7.5/3/12; lengths sqrt of these when drawing distance axes, with rank D2,D1,D3.

Do not draw squared distance as a Euclidean length. Undefined overlap gets no plotted zero. Stable source-order tie is declared custom; ordinary-library parity excludes ambiguous tied selections unless aggregate is invariant. Text lists overlap, sum, multiplier and rank.

<a id="d17"></a>
## D17 §4b: Where does the estimate come from?

E: target c cells300/100 from selectedD2/D1 connect with equal1/2 weights into200; D3=500 visible unselected. Removed-target contrast selectsD1/D3→300; no-overlap fallback uses all observed target values→300.

All-target-missing state keeps blank output and clear no-evidence status; library keep-empty constant is a separate policy. No measured-truth label. Mobile selected values above calculation, full donor companion table.

<a id="d18"></a>
## D18 §5: What is the fitted state?

E: P1's4×3 training matrix and category column, actual fitted medians[20,300,7], means[20,300,7], scales[√50,√20000,1] and vocabulary[a,b,not_recorded]. Reduction correspondence from contributing training cells into each stored array.

Queries do not have return arrows into arrays. Text gives fit operands/array shape; phone shows one column reduction and complete state table. All values checked against retained P1 literal/stream, not assumed from this plan.

<a id="d19"></a>
## D19 §5: How do two branches make one row?

E/H: literal numeric input3 coordinates → fill → centre/divide3, categorical input1 → vocabulary lookup3, horizontal concatenation to6 coordinates for P1. Then explicitly switch to penguin4+3=7, showing changed shapes.

Do not silently use P1's3 numeric columns with real-data4. Branch arrows join actual cells, labels show widths and output names. Mobile parallel branches stack then join in invariant output order.

<a id="d20"></a>
## D20 §5: Which observations are allowed to affect the map?

E: training rows inside fitting boundary, fitted arrays outside as saved state, new rows transform through them; a forbidden new-row→fit arrow crossed out. Actual all-feature indicator block appended in implementation extension.

Minimal two-fold schematic labels held rows and fresh training state; it is not a full CV tutorial. Text lists dependencies and no-refit invariant. New missing value in previously complete column demonstrates missing-only versus all-feature indicators.

<a id="d21"></a>
## D21 §6: What did this one experiment observe?

H: exact258/86 row-strip partition, five bars correct out of86 (38,67,84,85,85), zero baseline/common axis, explicit raw/scaled/preparation labels. Show actual confusion/prediction detail as companion tables.

No smooth benchmark curve, superiority badge or uncertainty invented from one split. Counts trace retained outputs and split IDs. Mobile bars label numerator/denominator directly.

<a id="d22"></a>
## D22 §6: What happens to source row309?

H: actual4 numeric values, frozen medians/means/scales, subtraction/division operands, seven labelled output cells `[1.3091,.8773,.1645,-.1128,0,1,0]`; separate altered missing mass→4000→about−.2368.

Keep full precision in data/accessible table; display rounding only. Changing bill coordinate never changes mass fit; unknown sex allzero, missing fitted not_recorded. Mobile per-coordinate trace then complete ordered row.

<a id="d23"></a>
## D23 §6: What is observed and what is merely inspected?

H: source row positions align to split order, true species and retained predictions in a literal table; the version/input provenance chain names historical LF execution and current CRLF download without drawing them as different ecological observations.

An altered copy has no newly trained prediction unless actually computed by an accepted algorithm; preserve existing fit inspection role. Text includes exact hashes via file metadata, row index meaning and one-split limits.

<a id="d24"></a>
## D24 §7a: Why use a log?

A/E: labelled1,10,100 points on original axis and their0,ln10,ln100 coordinates, equal-ratio intervals becoming equal differences; graph with origin/domain clearly excluded where log undefined.

Zero/negative input is an explicit domain failure; log1p is a different map with its own domain. No normality guarantee. Text lists actual values; full axes plus details, no invented histogram.

<a id="d25"></a>
## D25 §7a: Which power branch applies?

A: graph of Box–Cox positive branch and Yeo–Johnson positive/negative branches; current x and λ mark the correct expression, with λ=0 positive log and λ=2 negative log highlighted.

Near-zero/near-two stable expm1 formulas checked; λ=1 YJ identity, Box–Cox x−1. Domains/signed axes visible. Mobile branch panels retain repeated labels rather than tiny piecewise text.

<a id="d26"></a>
## D26 §7a: What is learned in a power map?

A/E: finite constructed positive training points, transformed population variance at candidate λ and Jacobian term, profile-likelihood curve with candidate/selected value and search bound/status; saved λ then transforms held value.

Curve is computed from the taught likelihood, not an illustrative parabola. Search cap/boundary/degenerate variance is labelled. sklearn convention versus book normalization named. Text gives objective and state; no performance axis.

<a id="d27"></a>
## D27 §7b: Where does an unseen value land?

E: training value landmarks and reference probabilities as two rows joined by interpolation segments; duplicate landmarks are shown twice with tie convention, x=3 between2/4 has its actual interpolated u; endpoint/new beyond range visible.

Uniform versus normal output adds inverse-CDF graph, finite endpoint policy. Fitting new data and transforming it are different actions. Text lists actual landmarks, u and z; mobile before→probability→output stacked.

<a id="d28"></a>
## D28 §7c: What do fitted bins throw away?

E: actual training dots, uniform/quantile interval boundaries, new-value membership and one-hot row; repeated quantile edges merge visibly and effective bin count is displayed.

Half-open intervals/interior-edge direction and outside-range policy taught. Equal counts may fail under ties. Midpoint threshold example changes membership but not order labels. Text gives edges and outputs.

<a id="d29"></a>
## D29 §7c: How does a simple model gain interactions?

E: actual `(a,b)=(2,3)` row → multi-index columns1,a,b,a²,ab,b² → `[1,2,3,4,6,9]`; second row links product to a two-dimensional saddle/contour for ab while coefficient combination remains linear in coefficients.

Interaction-only excludes squares; feature-count combinatorics and duplicate intercept are explicit. Values are not sklearn's separate sample from docs. Text lists exponents/products. Mobile exponent matrix and each row followed by response contour.

<a id="d30"></a>
## D30 §7c: How can a curve change locally?

E/A: actual ordered knot axis, degree0 support intervals, recurrence to degree1/2 basis curves, vertical selected-x intersections into literal nonnegative banded design row; weights times basis add into response curve.

Draw all active overlapping basis functions, not one unlabeled line; knots/degree/output width match. New point beyond fitted boundary follows selected constant/error/linear policy visibly. Natural-cubic distinction in prose. Text gives knot vector, row and sum; stack curve/matrix panels.

<a id="d31"></a>
## D31 §7d: Where does the end meet the beginning?

A/E: equal-axis unit circle, labelled350°/10° points, both cosine/sine projections, chord about.3473; signed coordinate ticks, origin and direction arrows.

1/359 seam,180 opposite, sine-only30/150 collision; duration does not wrap without domain reason. Text gives period/coordinates/chord; circle stays circular on phone.

<a id="d32"></a>
## D32 §8a: What does smoothing average?

E: actual category target cells produce sum/count; compare singleton positive and100 positives with same prior. Weighted scalar segments between category mean and μ, lengths n/(n+α) and α/(n+α), actual operands beside segment.

At α0 matched category mean, αlarge prior; n0 declared prior. Does not visually imply exclusion of own target. Text lists n,sum,μ,α,weights,result.

<a id="d33"></a>
## D33 §8a: Which targets can reach this row?

E/H: complete six-row A/A/B/B/C/C table with target[1,1,0,0,1,0], folds0/1; selected row0, donor rows1/3/5, all three directed prior edges and same-category row1 numerator edge into actual `(1+2/3)/3=5/9`.

Own-target change leaves its encoding unchanged, other-fold rows may change via prior. Do not omit same-category donors from prior edges. Fixed table identity, labels/arrowheads, category palette independent of fold. Mobile table then operand graph.

<a id="d34"></a>
## D34 §8a: Why is inference different from training?

E: OOF row encodings shown in one literal matrix, separate full-training sum/count/prior arrays for a genuinely new row; group/time version draws actual row IDs/times and admissible donor sets.

CV1.9 validation-coverage condition shown as row coverage vector; expanding time warm-up has explicit uncovered rows, never invented fitted codes. Text states manual/drop-warmup contract and downstream aligned targets.

<a id="d35"></a>
## D35 §8b: What does a signed hash add?

E: sparse bag apple3,pear1,banana2 and explicit constructed bucket/sign map; actual signed contributions3,−1,2 into buckets0/1 →[2,2]. Sparse matrix projection has one signed nonzero per input column.

Changing sign does not change declared bucket; actual FeatureHasher map shown separately if derived. No reconstructed original vocabulary claim. Text gives map/counts/sums; phone retains all collisions as rows.

<a id="d36"></a>
## D36 §8b: Can two different inputs become identical?

E: bags{apple3,pear1,banana2} and{apple2,banana2} through the same map both[2,2]; draw correspondence/collision and optional dot-product difference before/after.

No claim opposite signs always disambiguate, or one example proves expectation over hashes. Text includes both inputs and outputs.

<a id="d37"></a>
## D37 §9a: What can an iterative fit change?

E: literal incomplete two-column table with original mask alongside initialized filled copy; observed-target rows highlighted for selected column, only originally missing target cells editable by completion.

Observed values are immutable through every sweep. Some predictor cells are current estimates and visibly marked. Text gives each matrix/state and fitting row set; mobile mask and table stack with repeated IDs.

<a id="d38"></a>
## D38 §9a: Where does one conditional estimate come from?

E: selected column's actual regression design matrix/intercept, target vector on observed rows, fitted coefficient values and query row product into missing cell; sequential second-column update uses newly filled first column.

P14 source and actual stream publish exact coefficients/linear solve, not an unexplained box “regressor.” Ridge penalty and intercept convention explicit. Table/text works alongside drawn coefficient lengths and residuals.

<a id="d39"></a>
## D39 §9a: What is saved for a later row?

E: ordered list of fitted per-column coefficient arrays and neighbour-feature indices, with actual new-row working vector progressing through saved sequence. Training updates and inference application have separate arrows.

No refit on query; maxiter/tolerance status attached to training trace; repeated transform reproducible in deterministic route. Text lists ordered operands and changed missing cells.

<a id="d40"></a>
## D40 §9b: Why analyse every completion?

E: three complete matrices share observed cells but differ at hatched missing cells; each produces its own actual analysis Q_l,U_l before pooling. Separate small square-example inputs0/2 → analyses0/4 →mean2, versus meaninput1→square1.

Do not replace matrices with sentences “dataset1/2/3.” Exact table construction/source role listed; the first three actual P16 model-based draws have their own Q/U; validity is conditional on that explicit model. Mobile completed tables/analyses stack before pooled row.

<a id="d41"></a>
## D41 §9b: Where does uncertainty or sensitivity enter?

E/A: Q_l=9,10,11 and U_l=4 each plotted on common estimate axis with separately labelled uncertainty depiction; variance contributions4,1,1/3 sum16/3. Second panel plots actually computed estimand against assumed missing-value shiftδ.

Variance bar units are squared estimate units, SE≈2.3094 is a different length. δ curve is a sensitivity assumption, not identified truth/CI. Text gives formulas, components and all curve inputs.

## Investigation behavior shared by all sixteen

Controls appear directly below the picture they change. Each opens with the complete current output, linked intermediate values and interpretation. Reset always restores values, draft editors, selection/inspection and text together; repeated valid edits work without commit/reveal. An invalid finite/domain input keeps its visible draft plus a local error, and either labels the last valid output with its actual configuration or clears affected results; it never silently displays old output as current. Blank means missing only where the local contract says so. No learner prediction, answer-choice commitment, correctness/verdict, check-to-reveal or optional ungraded bypass. Reset and a meaningful algorithm-step control are navigation, not answer gates.


<a id="l1"></a>
## L1 §2a: Which unit weight changes the nearest case?

D04 starts with Q/A/B and divisors1/100, live A2 versus B9.0001; two numeric/slider divisors, continuously positive declared domain, shared exact value each.

Change b toward1 reverses winner; common-rescaling preset changes sums without ranking; coincident and exact-tie fixtures. Check continuous values/endpoints, typed precision, keyboard, reset, full-circle extent and no clamped computed value. Decide which feature difference should count before treating it as evidence.

<a id="l2"></a>
## L2 §2a: What if one actual case changes?

D03/D04 with divisors fixed1/100, selectedA; point selectorQ/A/B plus bill coordinate editor and mass coordinate editor (three controls). All points remain visible; query coordinate changes all differences.

A mass4400 gives17 and B wins; coinciding A withQ gives0; repeated edits/select/reset preserve actual values. Translation preset moves all points within declared bounds or reports refused action, never clamps one point. Fixed during drag, full domain after committed changes.

<a id="l3"></a>
## L3 §2b: How do outliers change fitted rulers?

D05 starts `[1,2,3,4,100]` and query150; editable last training value, scaler choice, later-value editor (three). Current fitted statistics, full/zoom positions and query result visible.

Changing training100→1000 changes standard/minmax; robust central quantiles unchanged here. Changing query alone must not refit. Constant/null fixture and zero-IQR policy explicit; range extremes stay visible. Distinguish outlier resistance from deleting extremes.

<a id="l4"></a>
## L4 §3: What does the policy do with this label?

D11 fixed explicit training counts with rare and reserved missing entries; query-category text, unknown-policy choice, rare-count threshold (three). Vocabulary/output names/current full vector shown.

Known/rare/missing/unseen contrast; threshold that creates no infrequent bucket tests fallback; unchanged frequent label is null. Reserved marker collision is error. Future code parity only under declared matching policy. Controls change meaning, not a gallery of pre-labelled answers.

<a id="l5"></a>
## L5 §4b: Which donor loses its right to donate?

D15–D17 live baseline200; one selected input cell menu covering Q a/b and every D1–D3 cell, numeric-or-blank value editor, k selector1…3 (three). Target c stays missing/fixed in this focused investigation.

RemoveD2c→300; D1c140→220; unusedD3c900 null; no-overlap fallback300; all-target missing no-evidence; tie fixture with stated custom source order. Multi-target completion is P5/practice, avoiding a fourth simultaneous control. Input drafts and eligibility/distance/output synchronized.

<a id="l6"></a>
## L6 §5: Can a new measurement change the fitted map?

D18–D20 retained P1 state/query; selected numeric query cell, numeric-or-blank editor (two), optional baseline-pin comparison action. All arrays and full output row visible.

Change one query value moves that coordinate only; constant fitted7 later9→2; emptyquerycell uses fitted median. Invalid width is code practice. State snapshot exactly unchanged after edits; reset updates draft even if selected cell remains same.

<a id="l7"></a>
## L7 §6: Follow one real row and an altered copy

D22 starts source309; recorded-row selector, selected-feature selector, numeric/categorical-or-missing value editor (three, editor type follows selection). Full original and altered copies, fixed state and all7 outputs visible.

Missing mass→4000→−.236756…; change sex only moves category block; unknown allzero versus missing fitted marker. Other selected rows use actual retained values. Caption identifies altered copy immediately. No new live fitting/classification or accuracy change. Full row/state table stays accessible.

<a id="l8"></a>
## L8 §7a: Which power branch is active?

D25 starts YJ x=−3,λ=2 →−ln4; method choice(BoxCox/YJ), x editor, λ slider/editor (three). Current branch, exact operands/function plot and output visible.

x3,λ0→ln4; YJλ1 identity; BCλ0→lnx; BCnonpositive error; near0/2 cancellation checks, noNaN display masked by clipping. Separate fixed training-fit panel shows learnedλ/status rather than letting a manually chosenλ masquerade as learned.

<a id="l9"></a>
## L9 §7b: Where does the fitted map place a later value?

D27 fixed `[1,2,2,4,100]` landmark fit and new3; query editor, uniform/normal output choice (two). Interpolation operands, duplicate handling, saved landmarks and result visible.

Tied2 has same output for all duplicates; later1000 endpoint saturates; two values in different intervals vary spacing; query edit never refits. Constant-fit policy and finite normal-bound rule explicit. No refitting every query to recompute its rank.

<a id="l10"></a>
## L10 §7d: Is this quantity really cyclic?

D31 period360 fixed, one angle slider/editor plus comparison angle editor (two), both projected coordinates and chord live.

350/10,1/359,1/181,30/150 sine-only collision, exact0/360 equality. Reset/keyboard/intermediate values; circle equal-aspect at all widths. Elapsed duration shown separately as a static counterexample, not another ambiguous control.

<a id="l11a"></a>
## L11a §8a: How much should one category borrow?

D32 starts n=1,sum=1,μ=.5,α=2 →2/3; category-support choice(singleton/100-row fixtures), α editor (two). All actual target-cell counts and weights visible.

α0 matchedmean; largeα→prior; absent-category fixture uses prior. Fixture list is support navigation while α is a genuine unresolved parameter. No leakage-prevention claim from smoothing alone.

<a id="l11b"></a>
## L11b §8a: Whose target can reach this encoding?

D33 full six-row table/current arrays and row0 5/9; selected table cell (category/target/fold), valid cell-value editor, inspected row selector (three). α fixed2, with separate zero-smoothing fixture named explicitly.

Row0 target flip null forrow0, changesrow1 andotherfold via prior; row3 flip movesrow0→7/9 while its own4/9 remains; emptied fold error; zerofallbackfixture; category and fold edits valid. Dependency arrows and row results redraw together; no compressed chip/sentence-box replacement.

<a id="l12"></a>
## L12 §8b: Can a collision change the feature vector?

D35–D36 explicit constructed hash map; selected word, count editor, bucket/sign combined mapping selector (three). Sparse input/count contributions and current bucket sums visible.

Apple3/pear1/banana2→[2,2], separatebagcollision; editing zero-count word null; opposite-sign cancellation; invalid bucket/count error. Actual FeatureHasher panel is a separately saved mapping, not silently driven by this constructed selector.

<a id="l13"></a>
## L13 §9a: What changes in one conditional turn?

D37–D39 bounded small deterministic trace, initial fill and current one-column estimate visible before stepping. Selected missing input cell, numeric-or-blank editor, bounded sweep/turn inspection control (three); complete recomputed trace for actual current input labelled.

Observed cells invariant; order/new-value use, completedcycle, max-cap status and unsupported-column fixture; a new-row panel applies saved sequence. Regenerate only this tiny declared model after valid edit, no hidden penguin science. Retain valid inspection index or explicitly clamp only the index to trace length, never numeric estimates.

<a id="l14a"></a>
## L14a §9b: Which part of pooling changes?

D40–D41 Q=[9,10,11],U=[4,4,4], currentmean10,T16/3; selected estimate/variance cell and value editor (two). Complete supplied analyses and Ubar/B/Bm/T/SE visible; the D40 simulated matrices retain their separate P16 Q/U.

ChangeoneQ altersbetweenvariance; changeoneU alterswithinvariance; identicalQ givesB0; m1 fixture refuses pooling, negativeU error. The editable Q/U are given scalar analyses, separate from P16's model-based completion matrices. No “confidence interval” from SEalone.

<a id="l14b"></a>
## L14b §9b: Which conclusion depends on an unobserved assumption?

D41 bounded P16 completedtable and mean-versusδcurve, δ slider/editor only. Missing cells shift byδ, observed cells unchanged, estimand/result curve/current assumption live.

δ0 baseline; δpositive/negative contrasts; nomissing fixture is null. Quantities come from the taught calculation. Explain that δ is assumed and not estimated from observed cells. No assertion that this diagnoses actual penguin missingness.

## Current refinement and evidence boundary


These refine the complete adopted D01–D41/L1–L14b contracts in
visual-specifications.md. They are instructions for actual future drawings and
controls, not a claim to have rendered or personally inspected41 visuals. The
continuous manuscript places every picture immediately after its lead and before
the corresponding explanation; the drawing is on the reading background with no
card chrome. Diagram IDs and exact-value companions are part of that placement.

## Source and numerical roles

- D01/D02/D21–D23 and L7 use retained real observations, fixed fit,86 saved
  transformed rows/predictions. source-roles.json and calculated-inputs.json bind
  them. A new query is an altered copy, never a new ecological observation or a
  newly trained prediction. Row309 is a file position, target Chinstrap separate.
- D03–D20 are specified constructed fixtures, with unchanged baseline arithmetic
  inherited where applicable and new complete P2–P5/P4 successor checks. D18/P1
  has3+3=6 output coordinates. D19 explicitly switches to real4+3=7.
- D24–D31 are computed analytic/constructed transformations from P7/P8/P10/P11.
  The power-likelihood curve uses P7's actual objective and finite candidates,
  bounds[-3,3], input Box–Cox[1,2,4,10,30] or YJ[-3,-1,0,2,8]. Show separate
  variance/Jacobian terms at selected λ, actual search status and evaluation cap.
  No invented parabola or normality guarantee.
- D27 landmarks[1,2,2,4,100],references[0,.25,.5,.75,1]. Mark x2→.375 and
  x3→.625; custom constant atc→.5 differs from ordinary atc→0. Normal epsilon
  is1e-7, with approximate±5.199338 endpoints. Clearly label inverse saturation.
- D28 four requested quantile bins merge to three; full actual edges and
  right-insertion membership are shown. P10's supplied-center Lloyd case is
  [0,1,2,8,9,10], initial[0,10], final[1,9], edge5. KMeans owns suppliedinit;
  separate KBins route owns its initialization. No universal algorithm parity.
- D30 degree1 full knots[-1,0,1,2,3],base[0,1,2],x.5 basis[.5,.5,0],weights
  [2,4,1]→3; x2 basis[0,0,1]→1. Degree2 full[-2,-1,0,1,2,3,4],x.5 row
  [.125,.75,.125,0]. Draw all nonzero intersections. Include degree1 linear
  outside2.5→[0,-.5,1.5] and explain negative extrapolated entries. Degree0
  ordinary outside-constant comparison is unsupported in observed sklearn1.9.1;
  show custom policy and retain the actual failed stream in author evidence.
- D32 singletonα2,μ.5→2/3;100positiveα2→101/102. D33 six rows and all donor
  prior paths remain exact. D34 full-fitα2 is[.75,.75,.25,.25,.5,.5];α0 is
  [1,1,0,0,.5,.5]. OOFα0 is[1,1,0,0,0,1]. Distinguish the two smoothing states.
  Group donor rows and chronological coverage[0,0,1,1,1,1] are literal objects.
- D35/D36 constructed mapping and actual FeatureHasher map have separate labels.
  Ordinary actualwidth4:apple→[1,0,0,0],pear→[0,0,0,-1],banana→[0,-1,0,0].
- D37 original table[[1,2],[2,4],[3,NA],[NA,8],[5,10]],mask and initial medians
  [2.5,6], from observed a[1,2,3,5] and b[2,4,8,10]. The initialized matrix is
  [[1,2],[2,4],[3,6],[2.5,8],[5,10]]; row2 a=3 is observed. D38 first a regression uses observedrows0,1,2,4 and b[2,4,6,10],
  coefficient.4861111111/intercept.0763888889; missinga→3.9652777778. Next b
  uses that newly filleda, coefficient1.8232290981/intercept.5461393472;
  missingb→6.0158266415. These values are rounded labels; full operands appear
  in P14's actual stream. D39 saves all six ordered models from3sweeps, capstatus
  and query rows[3,NA],[NA,6],[NA,NA] with actual final approximate outputs
  [3,6.016891],[2.990954,6],[2.992590,6.003378]. Observed cells never change.
- **D40 completion matrices and D41 supplied pooling arithmetic are distinct
  constructed examples.** Draw the first three actual P16 seed20,m5 completions
  of[8,10,NA,12,NA], with actual per-table Q/U from that same stream. Approximate
  matrices are[8,10,13.844877,12,10.417592],
  [8,10,3.469308,12,3.517166],[8,10,9.252957,12,10.045356], associated
  Q[10.852494,7.397295,9.859663],U[.966187,2.940335,.423083]. Preserve hatch
  only on originalmissingcells; labels say rounded simulatednormal-model draws.
  Do not attach U4 to these tables. D41 separately **given**Q[9,10,11],U4
  illustrates within4,between1,finite-m1/3,T16/3,SE√(16/3). The square0/2
  counterexample is separate from both. Full P16 uses five completions, not just
  the three selected for display, and its actual pooledT≈5.156501 is separate.
- D41 sensitivity uses the actual P16 seed20,m5 normal model/prior and assumed
  δ∈[-2,2]. Baseline pooledmean8.686461347735442; line=baseline+.4δ because
  twooffivecells shift. Endpoints7.886461/9.486461, not a confidence band or an
  estimated MNAR process. Exact numerical/conditional assumptions stay adjacent.

## Focused control domains and current-result contract

Each editor accepts finite values within its named domain, with a numeric/keyboard
equivalent to a slider or point interaction. Invalid drafts remain visible with a
local error and a labeled last-valid state, never stale output labeled current.
Reset restores values, draft text, selected entity, trace index and result. A
bounded trace shows the active input snapshot and calculation status. Controls
are directly below actual geometry;1–3 changing quantities per investigation.

|Investigation|Control domain and held-fixed state|Current result and distinct contrast/null|
|---|---|---|
|L1|Positive billdivisor.1..10,massdivisor1..500;fixedQ/A/B|Default1/100→2vs9.0001;mass1 reverses,commonrescale rankingnull|
|L2|Q/A/Bselector;bill0..100,mass0..10000;fixeddivisors1/100|DefaultAnear;A mass4400→17andBnear;A=Q→0;translationallpointscommonnull|
|L3|Lasttrainvalue0..1000,rulerchoice,futurequery0..1500|Defaultrobust150→73.5;100→1000leavescentralIQRhereunchanged;queryonlyfitnull;constantfixtureseparate|
|L4|Querystring/None;unknownpolicy3choices;mincountinteger1..8|Vocabulary/fullvectorvisible;new/rare/missingdifferent;no-rarebucketfallback;frequenta/null;@collisionerror|
|L5|ActualQ/donorcellselector;numeric-10000..10000orblank;k1..3|200baseline;D2cblank→300;D1c140→220;unusedD3ctargetnull;nooverlapfallback;alltargetmissingrefusal|
|L6|Numericquerycellselector;finite-10000..10000orblank;fixedP1state|Fullsixcoordinatesandarraysvisible;third9→2;queryeditdoesnotrefit;optionalpincompareswholevalidrow|
|L7|Retainedrecordselector;featureselector;numeric0..1000000orblank/categorystringorNone|Allsevenoriginal/alteredcoordinates;massblank→−.2368;sexonlycategorymoves;noaccuracyrefit;physicallyinvalidnegativerefusal|
|L8|BC/YJmethod;x−10..30;λ−3..3|YJ−3,2→−ln4;near0/2stable;λ1identity;BCnonpositiverefused;fixedlearnedλpaneldistinct|
|L9|Query−10..1000;uniform/normal;fixedfivelandmarks|3→.625or.318639;2tie.375;1000saturates;querybatchfitnull;constantpolicyseparate|
|L10|Twoangles0..360;fixedperiod360|350/10chord.347296;0/360same;30/150same sine/distinctcos;oppositepoints|
|L11a|Supportfixture(singleton/100/absent);α0..100|2/3default;α0matchedmean;largerαpriorpull;n0fallback;nosmoothing-leakageclaim|
|L11b|Category/target/foldcellselector;string/0or1/fold0or1editor;inspectedrow0..5;fixedα2|Row05/9;row3targetflip→7/9,row3own4/9null;row0ownnull;emptydonorfolderror;α0fixtureseparate|
|L12|Tokenselector;count0..10;bucket/signcombinedselector;fixedconstructedwidth2|[2,2]collision;oppositesigncancellation;zerocountmappingnull;actualFeatureHashermappingseparate|
|L13|Originalmissingcellselector;finite−20..20orblank;turnindex0..6;fixedα1,maxsweeps3|Fullinitial/firstturnvisible;currentpredictorupdateandobservedinvariance;capstatus;newrowusessequence;allmissingtrainingrefusal|
|L14a|Q/Ucellselector;Q−100..100orU0..100editor;fixedm3|Qbar10/T16/3initial;QchangesB,Uchangeswithin;identicalQ/B0;m1/negativeUrefusalfixtures|
|L14b|δ−2..2only;fixedP16seed20,m5,draws/prior|Mean8.686461+.4δ;δ0baseline;nomissingnull;assumedshiftlabel|

The ranges are local teaching domains, not recommended deployment thresholds.
The shared no-prediction/no-grading rule applies to all16 activities. Source/model
checks and known fixture calculations do not substitute for later native dragging,
keyboard operation,320/390px,intermediatewidth and200%text inspection. Runtime
must test actual endpoints/intermediates and reset/quick-edits once implemented.
