# Naive Bayes: drawing and live investigation specifications

This file accompanies the complete `lesson.md`. It implements the accepted
eleven-section, 41-job design and the import/file-set amendment. It is written
content; no rendered or browser evidence is claimed. Preserve the original H2
names/fragments, scientific programs/outputs, helper domains and arbitrary
input capability. The canonical packet is
`../../classical-ml-reading-flow/naive-bayes-probabilistic-classifiers/`.
Accepted closure: `fea6459f06f19eb00d39dc54fc28cd58d329186ff584a1e4f2e08239419986a1`.

## Placement and rendering contract

Each `<!-- DRAWING Dnn -->` in the manuscript is an insertion point: question
and short lead → drawing → immediate walkthrough → equation/code → changed
case. D08 appears first as a static trace and then as a live investigation
after smoothing is taught. D35 appears as a realized square and later as an
expected-loss curve. These are two appearances of each job, not extra jobs.

Use no figure heading, banner, border, filled panel or card around the drawing.
Show the actual objects, edges, areas and coordinates specified below; a
sentence in a rectangle is not its geometry. Labs are those drawings with
computed consequences and a compact control row immediately underneath.
Long explanations, formulas, numerical results and outputs reflow in HTML.
Keep teaching visible and use the shared opening, section index and common
file index. Complete programs may load near the viewport with visible loading
and error states. Copy and Download must return the canonical bytes, including
complete companion sets. Do not display author specifications as learner prose.

Inspect every distinct job and informative edited/null/error/right-pan state
at desktop 1440 px, phones 320 and 390 px, intermediate 768 px with 200% text,
and phone with 200% text. Short SVG labels must paint at least 16 px at 100%
and 32 px at 200%; do not shrink an entire viewBox onto a phone. Put long
labels in adjacent HTML, or use an intrinsic-width locally pannable viewport
with a visible pan affordance. Labels must not collide with arrows, bars,
curves, ticks or one another. Preserve equal physical coordinate scales and
the declared numeric meanings of area/length. Avoid document overflow,
hidden teaching and broken-word labels. Verify painted marks, not only bounds.

## Stable local colour and symbol meanings

The page and controls retain neutral black/charcoal with amber interaction.
Data marks distinguish the entities being followed:

- Five-word example: free violet `#b79cff`, money cyan `#78d3ea`, win coral
  `#f49c91`, meeting blue `#93b5f5`, agenda gold `#e7c37d`. Hue follows the
  literal word through positions, columns, pools, presence slots and signed
  evidence. Reordering moves label and hue together. Selection is a white
  outline or underline, never a replacement identity fill.
- Ham/class 0 is a labelled blue circle; spam/class 1 a labelled amber
  triangle. Retain this correspondence in observations, regions, probability
  columns and results. Introduce narrow/wide and normal/fault explicitly as
  local names for these class indices. D24–25 use a violet square for the
  third routing class, labelled 2. A word hue does not imply a class identity.
- D40's A/B categories use labelled violet/cyan marks in the composition
  axis, parameter table and future branches. The shared uncertain parameter
  is an outlined ellipse labelled `θ` with its local description.
- The new three-column count fixture names A/B/C and uses violet/cyan/coral
  through D13, D24–25 and D27. These are locally supplied identities, not
  renamed entries of the five-word corpus. Direct A/B/C labels remain visible.
- D41 uses status violet, binary alarm cyan, continuous reading coral and
  the **one** prior gold. Family cues persist through masks, addition and
  normalization. Missing is dashed/hollow and labelled “not measured; factor
  1”; it does not replace the family hue. Final probabilities use class marks.
- Probability/density magnitude uses proportional geometry or a labelled
  sequential neutral-light scale. Word/class hues are not distance scales.
  Compared views share limits. Signed contribution length represents natural
  log units around zero; hue follows the word. White boundary and selection
  marks have locally named roles and differing line/outline patterns.

Probabilistic variable nodes are circles/ellipses. Their arrows declare a
conditional factorization, never an established causal relation. Computational
pool/add/normalize/copy operations are rectangles with labelled ports carrying
actual scalar or array state. Copy edges differ from independent branches.
Matrices have row/column labels and literal values. Density axes name inverse
units; residual squares name squared units. No green/olive decoration. Labels,
shapes, direct series names and patterns keep meaning without hue recognition.

## Common live-state behavior

Every lab shows input, intermediate mechanism and useful output on first
paint. Valid edits update them together. No answer entry, correctness score,
commitment or reveal gate is part of a lab. Optional stepping traces a process
while the full result remains visible. Each focused question uses 1–3 semantic
controls; do not combine unrelated concepts into a wall of controls. Presets
supplement meaningful arbitrary text/numeric edits, with actual values shown.

Invalid drafts retain the last valid result and label that fact beside the
editor. Reset clears drafts/errors even if the active model already equals
defaults. Provide keyboard equivalents, visible focus and touch targets.
Rapid edits cannot publish obsolete results. A saved-study selector inspects
recorded outcomes and never implies live training. Arithmetic/native/model
checks cover the fixture contrasts below; existing source-bound executions
are preserved rather than replayed. Browser and paint checks remain deferred.

## D01 — word positions to feature counts, §1

Draw positions `free, free, money` above columns `free, money, win, meeting,
agenda`. Two leaders converge on free; money's leader reaches money. Counts
are `[2,1,0,0,0]`, presence `[1,1,0,0,0]`. Put class identity outside the
feature grid; no probability axis. Static. On a phone, stack positions above a
locally pannable grid while retaining leader endpoints. Text equivalent lists
positions and both vectors. Check token total 3 and correspondence after
column reordering.

## D02 — boundary and class-generating route, §1

Left: illustrative two-dimensional count plane with named axes, labelled class
points and a white line labelled `score=0`. Right: two class roots feed small
word-composition rows, query-observation ports and Bayes normalization. Label
learned state versus supplied query. Claim no fitted SVM coefficients or
benchmark from illustrative points. Static. Phone stacks the two routes with
the same query identity and no formula over arrows. Check that the objective
labels distinguish joint generative learning, conditional logistic loss and
the published SVM margin objective.

## D03 — rows, fitted state and a new query, §1

Draw row stacks carrying message identity, features and annotation column.
Only training features/labels feed fit ports. Fitted vocabulary/table is a
named indexed grid. Validation/test stacks feed prediction/evaluation ports.
A feature-only query has an explicitly empty label slot. Distinguish fitting
and inference with line patterns. Static. Phone lanes retain port direction.
Check no validation/test/query fit edge and no label entering inference; text
lists each role's permitted operation.

## D04 — conditional graph anatomy, §1

A class ellipse fans to free-present, money-present and win-present circles.
Show supplied rates `[.2,.2,.2]` in class 0 and `[.8,.8,.8]` in class 1,
with equal priors. Trace observation `[1,0,1]`: factors `.2×.8×.2` and
`.8×.2×.8` give class-1 posterior `.8`. Use the class-0 factor trace initially;
the numerical trace is a separate supplied law from D10's learned corpus.
Label the fan “given class, joint likelihood factors.” Do not represent token
count columns as independent nodes. Static. A vertical phone fan retains
separated endpoints and direct labels. Check the displayed product of three
Bernoulli factors; distinguish factorization from causation.

## D05 — pooled dependence as probability area, §1

Draw two equal-area class partitions. Within each, horizontal/vertical
boundaries are `.2` or `.8`; intersection areas are `.04` and `.64`.
Class weighting gives pooled `.5×.04+.5×.64=.34`. Beside this show pooled
marginal strips `.5,.5` and reference independent intersection `.25`.
Use a common probability-area unit with external labels/leaders for tiny
areas. Static. Phone stacks class squares then pooled comparison. Check exact
fractions, total mass and both pooled marginals independently.

## D06 — normalize the same two weights, §2

Prior strips have widths `1/3` ham and `2/3` spam. Selected likelihood portions
are `1/7` and `4/11`; weighted pieces are `1/21` and `8/33`. They meet one
addition port, then aligned posterior strips `11/67,56/67` sharing unit total.
Name prior, likelihood, joint weight and posterior separately. Static initial
view; any later prior editor follows its definition and holds tables fixed.
Phone stacks multiplication rows, normalizer and outputs. Verify exact fractions
and sum one. Never label an unnormalized weight as posterior.

## D07 — shift, exponentiate and divide, §2

On a log-score axis, points `−1001,−1000` translate to `−1,0`; label subtraction
of the common maximum. Bars `.367879,1` feed sum `1.367879` then division,
giving `.268941,.731059`. Ports show numeric operands. The companion has one
score-vector editor accepting 1–20 finite values or `−∞`. Check shift
invariance, partial support, all-`−∞` undefined conditioning, NaN/`+∞`, and
overflow in differences of finite scores. Retain the last valid result on
error. Phone splits stages or pans intrinsic arithmetic without tiny labels.

## D08 — signed token evidence, §§2–3

First appearance: static `α=1`, prior `log 2` and free `log(28/11)` extend
right; total is `1.627456`. Meeting contributes leftward `log(7/22)`. Word
hues follow D01, length is natural log odds, zero is a tie and the endpoint
names the posterior. After smoothing is taught, reuse this geometry for a
message/α investigation; use a separate prior-focused view. Preserve arbitrary
strings up to 300 characters and 30 ASCII word tokens, the existing lowercase/
punctuation tokenizer, α=0 or `[1e−8,10]`, and prior `[.01,.99]`. Default is
free, α=1, spam prior `2/3`. Empty/OOV are valid; distinguish zero support.
Step/Back traces known-token prefixes with the result already visible. Check
free meeting, repeated free, opposing words, intermediate α/prior and mixed
known words at α=0. Phone preserves zero and directions; infinite contributions
use honest support labels rather than fabricated finite bar lengths.

## D09 — zero support and no column, §§2–3

At α=0, known free and meeting branches select class-table entries with one
zero probability each. Both complete query products end at zero and an
undefined-conditioning marker. OOV zephyronic ends at “no column”; its empty
row reaches priors. Keep these endpoints distinct, with no uniform fallback.
Positive α changes support within the fixed table, never vocabulary. Static
contrast or synchronized D08 state. Phone stacks routes and endpoints. Check
supported, wholly unsupported and all-OOV null cases with exact arithmetic.

## D10 — document and token pools, §3

Rows are spam free free money, spam free money win, and ham meeting agenda.
Route each row to a document counter and its tokens to named column pools.
Spam has 2 documents and `[3,2,1,0,0]` tokens, total 6; ham has 1 document
and `[0,0,0,1,1]`, total 2. Different port labels distinguish the units.
Static. Phone may pan token rows/grid while class totals reflow. Check every
leader endpoint and count conservation. Introduce smoothing later in D12,
without silently adding pseudo-counts to these raw counters.

## D11 — ordered sequences and count events, §3

AB and BA position lanes each have probability `4/25`; both converge on
count `[1,1]` and a sum bracket `8/25`. A/B probability bars are `4/5,1/5`.
Label conditional independence of positions, not count columns. A companion
count-vector editor supports 2–5 categories, integers 0–10 and total at most
10, with matching supplied probabilities visible: default two-category table
is `[4/5,1/5]`; a dimension change explicitly supplies uniform `1/V` entries
and labels this changed model. Display coefficient and
sequence multiplicity; zero length has one order and mass one. Check exact
enumeration, all-A and balanced cases. Phone stacks lanes. When many orders
exist, state the simplification and show their exact count instead of drawing
an unreadable list of every sequence.

## D12 — smoothing enters every column, §3

Align raw bars with separately patterned α segments in all five columns.
Total mass gains `5α`; at α=1 show spam `[4,3,2,1,1]/11` and ham
`[1,1,1,2,2]/7`. Observed and pseudo-count mass have different labels.
One α editor accepts 0 or `[1e−8,10]`. At zero show unsupported entries; at
10 show movement toward uniform. Check denominators and row sums. Small
segments use external leaders; large α uses a declared common comparison
scale and exact values. Phone pans columns locally; totals reflow below.

## D13 — likelihood on the simplex, §3 deeper

An equilateral probability triangle has three named vertices and a selected
point projecting to three bars summing one. Fixed counts `[2,1,1]` have optimum
`[.5,.25,.25]`; draw calculated log-likelihood contours. Two coordinate
editors `[0,1]` determine the third remainder; reject a negative remainder.
At a positive-count zero probability show `−∞`, not a finite contour height.
Show full objective/gradient in HTML. Check derivative and boundary conventions
against exact counts/N3. Optional optimizer trace is read-only and retains
BFGS precision-loss status beside its accurate-looking table. Distinguish mean
and MAP objectives locally. Phone preserves intrinsic triangle and 16/32 px
labels, with equal physical scales.

## D14 — counts and completely observed presence, §4

Five aligned word columns show count row, binary row, selected class factors
and probability results. Default `[1,0,0,0,0]`; compare free twice and once,
then all zero. Every binary zero has its `(1−φ)` factor. Preserve individual
UI counts 0–5 and full helper vectors with integers 0–20 per column. Use a
word selector/count editor pair; a separate whole-vector focus retains arbitrary
vectors without ten plus/minus controls. Both transforms share the same input.
Check unchanged Bernoulli repetition and all-zero MNB prior versus all-absent
approximately 51.64% spam. Phone stacks paths while preserving word labels.

## D15 — observed off and genuinely unmeasured, §4

Class roots have priors `.8` normal and `.2` fault; on/off branches are
`.4/.6` and `.8/.2`. Observed off selects off leaves, weights `.48,.04` and
fault posterior `1/13`. Unmeasured sums both leaves to factor one, retaining
prior `.2`. One state selector: on/off/not measured. State the ignorable
observation-process assumption in surrounding prose. Check exact branch sums
and posterior fractions. Phone stacks trees above results; selection outlines
retain class identity hues.

## D16 — category support and lookup, §4

Status leaves idle/busy/offline/other sit beside link wired/radio. Selecting
a field indexes one entry in each class table. Show different denominators
`D+4α` and `D+2α`. Reserved other is a real fitted entry; code 4 follows a
rejection endpoint. Two field editors choose named categories. A separate
support-inspection view may relabel codes/table columns together and retain
the posterior. Distinguish zero support from outside support. Check table
sums, code permutation and rejection. Phone stacks tables with their actual
different category counts; do not force both into an invented common width.

## D17 — density height and interval area, §5

Draw normal curves with mean 0 and variances 1/4 over `[−6,6]` mV on one
density axis in mV⁻¹. Direct leaders name narrow/wide. Default reading 0 and
interval width .4 shade the same physical interval under both curves. Two
controls: reading `[−5,5]` step .1, width `[.1,1]` step .1. Label each computed
area and point posterior `2/3`; crossings are `±1.359556`. Width edits leave
point posterior unchanged; tail readings favor wide. Check CDF/quadrature,
crossings and coordinate conversion. Phone retains intrinsic axes/curve labels
through local pan; do not conceal clipping or replace labels with a tiny legend.

## D18 — deviations and square areas, §5

Readings 1,2,3 mV sit around mean 2. Residual arrows `−1,0,1` lead to square
tiles with areas `1,0,1` mV²; bracket total 2 feeds divide-by-3 and variance
`2/3`. One list editor accepts 1–100 finite readings within ±1e6. Count,
mean and squared sum remain visible. Extreme cases may use an explicitly
declared drawing scale while retaining exact units. Constant/singleton cases
have raw variance zero, leading to D19. Check centered sum zero and ddof=0.
Phone stacks axis and squares; enlarged labels determine actual stage height.

## D19 — collapsed spread and the floor, §5

Show constant readings at one mean, raw variance zero, and a separately
labelled regularized positive-width density. One absolute squared-unit floor
editor accepts `[1e−12,1e12]`. A logarithmic variance axis must label its
transformation and exclude zero from finite coordinates. Explain the missing
positive-variance MLE rather than forcing a singular density onto a finite
height scale. Distinguish absolute floor and relative epsilon. Check the
constant-data limit and deriving variance afresh without adding to raw M2.
Phone separates raw/regularized views while retaining the same mean.

## D20 — diagonal and full covariance, §5

Pair 2×2 matrices with corresponding equal-scale contours:
`Σdiag=[[1,0],[0,1]]`, `Σfull=[[1,ρ],[ρ,1]]`, initially ρ=.6. One control
ρ in `[−.8,.8]` affects only the full comparator. Diagonals remain 1;
off-diagonal ρ and determinant `1−ρ²` agree with the contours. These are
calculated laws, not the original 200-row fit. At zero both shapes agree.
Verify determinant, inverse quadratic contour and physical axis equality.
Phone stacks comparisons on matching scales, with matrix magnitude separate
from class identity.

## D21 — analytic boundary and query score, §5

Known means are `(−2,−2),(2,2)` and priors `.5,.5`. Equal mode uses common
variance .5 on both axes; unequal mode uses class variances .5 and 2 on both
axes. Controls are mode, x and y, coordinates `[−8,6]` step .25. Default is
unequal at `(0,0)`. Draw contours, cell-center computed regions, exact white
circle center `(−10/3,−10/3)`/radius `4.008817` or line `x+y=0`, and query
cross. HTML names prior/spread/distance terms and score difference. Check
boundary residual, corners and means independently. Phone pans an equal-axis
plane; labels near the means/query use leaders rather than overlap.

## D22 — copied observation and independent observations, §6

Actual law: one alarm circle feeds a copy rectangle and 1–5 equal recorded
slots. Hypothetical law: separate conditionally independent alarm nodes.
Draw all five copy endpoints legibly and label the different edge semantics.
Initial state is three positive copies, fault prior .2. Controls are copies,
sign and optionally prior `[.05,.5]` after its teaching. Show actual/product
likelihoods and `1/3` versus `2/3` fault posteriors. Risk uses actual joint
masses; two positives gives the exact .5 tie choosing normal. Check signs,
endpoints, tie and changed prevalence. Phone stacks graphs then aligns result
bars; probability magnitude never changes class identity hue.

## D23 — XOR interaction, §6

Four equal-mass corners on binary A/B axes have labels 00/11→0 and 01/10→1.
Adjacent class marginals each split into halves, leaving NB posterior .5
everywhere. An optional point selector traces one corner's marginal lookup.
A separate `A≠B` relation marks the available pair information. No training
slider or fabricated NB separation. Check enumeration and tie policy. Phone
retains an equal-scale square with readable corner labels and table below.

## D24 — complement pooling, §7

Draw class count rows `[8,2,0],[1,7,2],[0,2,8]` with circle/triangle/square
class marks. Selecting target 0 removes only its pooling edge, keeping identity
visible. Other rows add into `[1,9,10]`, then `[2,10,11]/23` after smoothing.
One target-class selector; every column's arithmetic is visible. Check global
minus target pool and row reordering, never sum label values. Phone stacks
source rows, complement and denominator with port leaders. These are matrices
and count bundles, not definition boxes.

## D25 — query products and row normalization, §7

Query `[2,0,1]` multiplies three negative-log weights per class, summing
`5.622293,2.814809,3.702700` under norm=False. A focused query-vector editor
accepts three integer counts 0–20. A separate normalization focus offers α and
norm with query fixed; retain α=0 or `[1e−8,10]` where the old helper permits
it, with unsupported states explicit. norm=True divides the complete weight
row, not query counts. State the one-word zero-weight convention. Compare
retained output and matched new library driver. Label scores/softmax as such,
not as a literal class-generative posterior. Phone uses reflowed per-class
products with the same word identities and full precision text.

## D26 — four distinct rarity interventions, §7

Successive focused views show a prevalence strip `.02→.5`, an evidence-count
pool, a likelihood table and action-cost lines. Use geometric quantities,
not four sentence rectangles. Prior/LR=9 gives `9/58` versus `.9` posterior;
costs 1:20 give threshold `1/21`. An intervention selector plus one/two
taught inputs keeps each view at most three controls. Copying rows does not
increase the displayed independent evidence volume. Check fractions, costs
and held-fixed quantities. Phone stacks views without changing their roles.

## D27 — CSR anatomy and a sparse dot product, §8

Use the six-row N1 matrix: data `[2,1,1,1,2,1,1,1,2]`, indices
`[0,2,1,0,1,2,0,1,2]`, indptr `[0,2,3,4,6,8,9]`. Default row 0 highlights
pointer interval `0:2`, whose values 2/1 reach parameter columns A/C.
Compute selected log products and prior per class. One row selector; an empty
row companion has a zero-length interval and prior-only MNB. Canonicalize
duplicate indices before explanation. Check dense reconstruction and sparse/
dense scores independently. Phone pans labelled arrays with readout below;
do not imply allocating every dense query row.

## D28 — preprocessing inside folds, §8

Use retained raw-text row IDs: fourteen training/six test. Three internal
fold lanes each contain their own fitted vocabulary/NB table. Only fold
training rows enter fit ports. Validation returns metrics; selection picks
α=.5; final fitting uses fourteen training rows before the six test predictions.
Static or one fold-inspection selector. Read role indices/schemas from the
original source; replay no old fit. Check memberships and absent held-out fit
edges. Phone vertical lanes preserve containment within the parent training role.

## D29 — contingency and ranked columns, §8 deeper

One text feature has a literal 2×2 class-by-absent/present table, margins and
expected cells. Alarm's table `[[4,0],[2,2]]` gives MI `.2157615543` and
Pearson `8/3`, versus sklearn count chi2=3. Default alarm; controls feature
and method. A null feature has both class rows `[3,1]` and zero dependence.
Selected indices `[0,5,6]` map to alarm/routine/urgent inside the training fit
lane. Check zero-observed/expected conventions, document/token units and the
distinct statistics. Phone retains all table margins with formulas in HTML.

## D30 — raw counters and the remainder, §8

Packets 4/4/4/2 with row IDs feed two class counters and named feature
counters. Smoothed parameters derive at a separate downstream port. One chunk
size control 1–14 overlays alternative boundaries on the same fourteen rows
without executing historical fits. Show final state initially; optional
last-packet inspection exposes both remainder rows. No α enters raw state per
packet. Check integer conservation and the faulty twelve-row loop. Phone
stacks packets above the fixed counter grid; optional animation honors reduced
motion and is never needed to access results.

## D31 — centered-M2 merge, §8

On a common reading axis, group `[1,2]` has mass 2, mean 1.5, M2=.5; `[3]`
has mass 1, mean 3, M2=0. Group-mean offsets and square contributions feed
merged mean 2. Between-group correction area 1.5 yields M2=2 and variance
`2/3`. Two reading-list editors allow at most 100 total finite values within
±1e6; optional chunk inspection is the third control. Keep raw variance and
derived floor distinct. Check direct weighted centered sums and empty-group
identity. Display recorded library epsilon separately: batch `4.666…e−9`,
chunks `[2.5e−10,1.555…e−9,0]`; claim no smoothed-variance equality. Phone
stacks input clusters/merge axis with consistent units and geometric scale.

## D32 — prior translation and conditional shift, §8

Hold class likelihood curves/table fixed while a prior log-odds bias marker
moves posterior/action crossings. One prior control retains `[.01,.99]`.
A separate explicit conditional-shift fixture changes a likelihood rather
than the intercept, showing why prior-only correction can fail. State fixed
`P(x|c)`, representation and positive priors. Check odds translation, fixed
likelihood ratio and counterexample. Phone aligns old/new odds axes; no
autoscale may disguise the displacement.

## D33 — recorded real study and saved-state inspection, §8

Show percentage numerator/denominator marks for a word/character and illustrative
capital-run lengths/average. Do not reconstruct unknown token denominators
from dataset percentages. Group lanes carry 4,207 feature groups/4,601 rows,
roles 2,811/890/900, and all three conflicting-label groups. Read every actual
validation outcome and prefrozen test record from `spambase-study-results.json`;
model arrays come from `spambase-frozen-state.json`. Every measured series
names family and representation. No live fit or edited evaluation metric.
Use a labelled log-loss axis or separated panels so Gaussian 10.677 and
logistic .220665 remain interpretable; show baseline .664601 and literal values.
Keep candidate 12's failure and original test API failure/state-only recovery.

Case inspection offers either one full 57-entry vector editor or a focused
feature selector/value editor, plus a prefrozen family selector: at most three
semantic controls. First 54 percentages lie `[0,100]`; capital average lies
`[0,1e9]`, longest/total are integers `[0,1e9]`. Capital fields are all zero
or `1≤average≤longest≤total`. Default is make=1, other percentages=0, capital
`[2,4,8]`. Name it an unlabeled statistical vector. Validate lock/data/role/state
identity, all metrics, saved/native parity, schema/units and invalid cases.
Phone reflows tables, locally pans full vectors and shows immediate current
case/results without an invented observed label.

## D34 — cases to reliability bins, §9

Use the exact twelve case IDs/predictions/outcomes from the retained reliability
helper. Probability marks join 2–6 buckets, then mean-p/fraction-positive/count
points. Defaults: four bins, raw mapping. Controls: bins, mapping, active bin.
Compression `.15+.7p` changes predictions; binning does not. Empty bins have
no point; p=1 belongs to the last closed bin. All case values remain visible.
Check exact memberships, means, counts, unchanged losses under bin edits and
rapid-edit/reset behavior. Phone keeps common 0–1 axes/equal diagonal scale
and places long labels in HTML with leaders.

## D35 — realized square and expected optimum, §§6/9

First appearance has p=`2/3`, y=0, displacement `2/3` and square area `4/9`;
y=1 gives displacement `−1/3` and area `1/9`. Teach Brier before code names it.
Later draw expected curve `(p−q)²+q(1−q)`, default q=p=.3 and minimum .21.
Two p/q controls in `[0,1]`; hold q fixed when examining prediction changes.
Link realized displacement/square to the parabola probe; show log loss separately
with correct infinite endpoint semantics. Check the expected-loss identity.
Do not rescale each square and conceal error changes. Phone separates geometry
from the reflowed formula while retaining meaningful zero and minimum.

## D36 — calibration fitting ports, §9

Draw row stacks 800 base/800 calibration/1,200 test under the retained seed-2026
law. Frozen base sends fresh calibration predictions to the mapping fit;
base/mapped outputs then reach the same test records. Calibration/test targets
cannot enter the base; test targets cannot enter mapping fitting. Static recorded
protocol, not fresh training animation. The changed task's 400 calibration rows
are a separate fixture. Phone stacks ports vertically with explicit prediction/
target arrows. Check original roles/outputs without replaying the old main.

## D37 — what the mapping receives, §9

One sigmoid view receives labelled GNB probability; another receives SVM
margin with its different domain. Isotonic sorts actual adjacent group blocks
with equal sizes and rates .4/.2, then pools to .3; block width represents
count. Toy mapping parameters are illustrative, never the old measured fit.
At most two focus choices: score type and mapping method. Hold parameters
fixed and show curve/result immediately. Check monotonicity, endpoint behavior
and weighted pooling. Retain the original measured sigmoid's empty high bin
separately. Phone stacks curve/pooling with direct labels and no remote legend.

## D38 — probability and cost action, §9

On axes p in `[0,1]` and cost, draw lines `C_FP(1−p),C_FN p`. Default costs
4/1 and p=.75 give costs 1/.75, preferred allow and crossing .8. Three
controls: p and two positive costs `[.01,100]`. Separate class/action results;
equality chooses negative. Check threshold algebra and equal-cost null at 1:1.
Phone direct line-end labels use leaders around the probe. Do not omit large
costs or silently clamp line heights for composition.

## D39 — linear odds in count coordinates, §10

Free/meeting nonnegative count plane has zero-odds line
`log 2+x log(28/11)+y log(7/22)=0`. Link the query to signed word-contribution
bars. One two-entry integer count-vector editor accepts 0–20. Labels/hues
retain D01 correspondence. Adjacent objective dependency schematics distinguish
joint likelihood, conditional log loss and regularized hinge/margin; claim no
new SVM fit. Check direct score versus affine form and column reordering.
Link D21's quadratic comparison. Phone locally pans the equal-axis plane;
objective formulas reflow below. A decision boundary is not probability mass.

## D40 — one shared uncertain future composition, §10

Draw θ_A on `[0,1]` with calculated Beta(A,B) density, default shapes `[4,1]`
and mean .8. An uncertain-parameter ellipse feeds both future positions.
Beside it a fixed-mean branch gives AA `16/25`; integration factors `4/5,5/6`
give `2/3`. Group AB/BA into a count event with coefficient visible. Two
vector editors support 2–20 positive shapes `[1e−8,100]` and matching integer
counts 0–100. Above two categories show the exact Dirichlet vector/formula;
never call a one-dimensional projection the complete simplex density. Retain
log output when probability underflows. Shape values below one can give infinite
Beta density at an endpoint; label that limiting state and calculate interval
areas rather than inventing a finite peak. Check Fraction/gammaln/SciPy equality,
one-token agreement, AA difference and zero-count mass one. Phone stacks the
shared node/branches; 16/32 px labels and right-pan endpoints remain readable.

## D41 — mixed branches and one prior, §10

Use the exact eight-row fixture and default status 0/alarm on/reading .5 mV.
For each class draw a categorical lookup, binary on/off branch and continuous
density. Each sends one named log likelihood to addition; exactly one shared
prior port joins before normalization. One complete-record editor carries the
three fields. A separate mask focus has one three-Boolean vector editor;
show missing factor one with a dash and retained family hue. Optional prior-bug
comparison uses the separately supplied unequal-prior fixture, not the equal-prior
fit. Check masks/class alignment against N5 parameter extraction, complete/
alarm-missing/all-missing states, unit conversion and category permutation.
Browser readings lie `[−5,5]`, status/alarm are binary. Invalid drafts retain
last valid state; Reset clears errors. Phone stacks family branches before
one prior/sum; masking never erases the branch's identity or arrow entirely.

## Verification and phase boundary

These specifications define geometry, inputs, changes and represented arithmetic.
Existing research/design probes and source-bound program receipts establish
selected analytical/API fixtures. They do not certify every future control
domain or any actual paint. A different whole-content reviewer must read the
entire manuscript and all 41 jobs before runtime. After acceptance, implement
models/drawings and verify preserved arbitrary domains, exact Copy/Downloads,
meaningful edits/nulls/errors/resets, desktop/phone/enlarged/intermediate/right-pan
geometry and accessible controls. Reuse unchanged historical fits and retained
weighted/sparse/reload/new-study evidence. Root owns central phases, shared
publication and production/loading integration.
