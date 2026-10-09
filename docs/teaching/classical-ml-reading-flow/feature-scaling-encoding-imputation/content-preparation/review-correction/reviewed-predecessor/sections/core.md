# Feature Scaling, Encoding & Imputation

A model reads coordinates. A field notebook records measurements, categories and gaps. Turning one into the other is part of the modeling decision: a ruler changes which penguin looks nearest, a category representation changes which differences count, and a fill supplies a number we did not observe.

We will follow one practical question: can a penguin's measurements help distinguish its species? The real observations anchor the question; small, explicitly constructed tables make each mechanism possible to calculate. We will build preparation functions, recognize their stored state in ordinary library objects, and inspect one preserved real experiment. No method is a universal winner.

Start with sections 1–6, then core practice in section 10 and readiness in section 11. Sections 7–9 are visible deeper branches: nonlinear coordinates and bases; high-cardinality categories; conditional completion and uncertainty. They use the same step-by-step approach and can be read in a second sitting. You need rows and columns, Python arrays, averages and the idea of predicting a label. We introduce new notation where it enters. Complete files, exact outputs and setup are supplied; code is part of the explanation, available without a disclosure. Hints and solutions alone use disclosures.

## 1. Three different questions hiding inside “preprocessing”

The first held-out case in the retained experiment is zero-based source row 309. “309” means its position in this file, not a biological identifier and not a feature used by our model. Look across its measurement cells, then across to the separate answer column.

[[D01]]

| Source position | Bill length | Bill depth | Flipper length | Body mass | Recorded sex | Target species |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 309 | 51.0 mm | 18.8 mm | 203.0 mm | 4100 g | male | Chinstrap |

An observation is one row. A feature is a selected input available when a prediction must be made. The target is the answer used for training or later assessment, species here. Availability matters as much as numerical format: a field recorded after species identification might reveal the answer rather than help predict it. Our experiment excludes source position, island, year and species from its input.

Write the feature table as X with n rows and d columns. Thus X has shape n×d; a row xᵢ holds one case's inputs, and column j follows one feature across cases. The target vector y has n entries and stays separate. Before encoding, X can contain different kinds of values. A numerical estimator ultimately needs the representation its interface promises; being stored in a table does not make every column a quantitative measurement.

Now make an independent copy of row 309 and erase only its mass. Follow the same row positions into the prepared coordinates.

[[D02]]

The altered copy is `[51,18.8,203,NA,male]`. Sex is still observed. For numeric cells define Mᵢⱼ=1 when the **input is missing**, and 0 when observed. This convention is the opposite of an observation indicator R used in many statistical texts: R=1−M. We will keep the original M after filling. A filled mass coordinate is an estimate carrying a missing marker, not an observed 4000 g. Unknown sex, when a present string was absent from the fitted vocabulary, is a separate input-policy case; it is not another biological state we found in the file.

Scaling asks which numeric differences should have comparable influence. Encoding asks which relationships a category should express. Imputation asks which usable input to supply for an absent measurement. Converting grams to kilograms, making an indicator for `male`, and replacing a missing mass are three different operations. Combining them does not remove their separate assumptions.

The preceding [NMF lesson](/learn/path/full-curriculum/non-negative-matrix-factorization-nmf?module=classical-ml) uses rows as observations and requires nonnegative X for its additive reconstruction. Centering can create negative coordinates, so a useful preparation for a distance model can violate that domain. Begin with the downstream operation's meaning and input contract, rather than choosing a familiar preprocessing recipe.

## 2. Scaling changes the meaning of “nearby”

### Make the ruler explicit

Switch now to three **constructed** two-feature cases: Q=(40,4000), A=(41,4100), B=(43,4001), in millimeters and grams. These are arithmetic fixtures, not additional penguin observations. The KNN prerequisite's [actual distance section](/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#2-make-nearness-an-explicit-choice) derives Euclidean, Manhattan and maximum-coordinate distances; its complete `units-cosine` example shows why units and directions matter. Here we change the coordinate map before using that distance.

Look first at the differences from Q, which are much easier to compare than absolute masses.

[[D03]]

A differs by (1,100); B by (3,1). Raw squared Euclidean distance gives 1²+100²=10001 for A and 3²+1²=10 for B. The rule chooses B. The arithmetic silently gave a 100 g difference much more numerical influence than a few millimeters.

Decide instead that 1 mm and 100 g should each count as one comparison unit. Draw each divided difference as a triangle leg and its squared contribution beside it.

[[D04]]

With divisors a=1, b=100, A has squared distance 1²+1²=2, while B has 3²+.01²=9.0001. A is now nearest. Nothing about the physical measurements changed. Dividing feature j by sⱼ gives

\[
d_s^2(x,z)=\sum_j((x_j-z_j)/s_j)^2
           =\sum_j (x_j-z_j)^2/s_j^2,\qquad s_j>0.
\]

The squared-distance weight is 1/sⱼ². A shared center cancels: `(x−c)−(z−c)=x−z`. Doubling **both** divisors divides both sums by four, giving .5 and 2.250025; ranking is unchanged. Changing just one divisor changes relative influence. L1 and maximum-coordinate distance use their own contribution rules; dividing coordinates still changes their geometry, but the L2 circles here are not pictures of L1 diamonds.

[[L1]]

Begin with A nearer at 2 versus 9.0001. Change the mass divisor toward 1 and watch the mass leg and squared contribution grow until B is nearer. The immediately visible result explains which contribution changed. Common rescaling is a useful null for the ranking. Choose a divisor because of feature meaning or development evidence, rather than because standardization is fashionable.

[[L2]]

Keep divisors 1 and 100, then change A's mass to 4400. Its difference becomes (1,400), giving 1+16=17; B stays at 9.0001 and wins. Coincide A with Q and its distance becomes zero. Editing Q must update both candidates. Geometry and arithmetic remain the same state; an axis viewport cannot clamp a computed length or circle radius. The predecessor finite two-dimensional radius formula did not establish a reachable clipping defect: its bound is √2/1.35×104≈108.95 pixels, below the 124-pixel cap. The successor specification nevertheless guarantees complete uncapped-radius geometry over its declared domain.

### Fit a ruler on training observations

If domain knowledge does not supply divisors, summarize typical training variation. For a numerical column, fit mean μ=(Σxᵢ)/n and population standard deviation s=√[Σ(xᵢ−μ)²/n], then transform a later x into z=(x−μ)/s. Dividing by n matches the transformation convention in StandardScaler; this is not an unbiased sample-variance calculation. A nonconstant training column gets mean zero and variance one. Its ordering and distribution shape are otherwise unchanged: a skewed distribution remains skewed, and no regression-error assumption has been proved.

See which observations determine three different rulers on the constructed training column `[1,2,3,4,100]`.

[[D05]]

The mean is 22, the population scale is about 39.012818, the minimum/range are 1/99, and the median/IQR are 3/2 under linear percentiles (Q25=2, Q75=4). Standard scaling uses `(x−22)/39.012818`; min–max uses `(x−1)/99`; robust uses `(x−3)/2`. Max-absolute scaling uses x/100 and preserves measured zeros.

| Value | Standard | Min–max | Robust | Max-absolute |
| --- | ---: | ---: | ---: | ---: |
| 1 | −.5383 | 0 | −1 | .01 |
| 2 | −.5127 | .0101 | −.5 | .02 |
| 3 | −.4870 | .0202 | 0 | .03 |
| 4 | −.4614 | .0303 | .5 | .04 |
| 100 | 1.9993 | 1 | 48.5 | 1 |
| Later 150 | 3.2810 | 1.5051 | 73.5 | 1.5 |

The full extent keeps 100 and later 150 visible; the magnified view makes the separation among 1–4 perceptible. Robust scaling has not deleted or clipped the outlier. It uses central spread, making 100 a large coordinate. Min–max places **training** endpoints at 0 and 1. Later values can exceed them. Clipping would be another operation that discards how far beyond the fitted range a value lies.

[[L3]]

Change the last training value from 100 to 1000. Mean, standard deviation and range change. The central quartiles here remain 2 and 4, so robust scaling's saved center/scale remain 3/2. Change only the query and none of these fitted summaries should move. “Robust” refers to this rule's resistance to particular changes in the fit, not proof that outliers never matter downstream.

What if training variation is zero? Trace the replacement divisor separately from the later coordinate.

[[D06]]

For `[7,7,7]`, center=7 and measured spread=0. Our explicit policy stores divisor 1 with a zero-spread flag. Training values and later 7 become zero; later 9 becomes 2. “Constant during fit” does not mean “force every future input to zero.” An all-missing training column is different: there is no center or spread supported by observations. Refuse it or choose a declared keep/drop policy; do not infer a median of zero.

### Preserve direction only when size is dispensable

Column scaling learns one ruler per feature. Row normalization uses each case's own size. Look at two vectors on one ray and the single point they become on the unit circle.

[[D07]]

The lengths of [3,4] and [6,8] are 5 and 10. Both become [.6,.8] after L2 normalization. Direction survives; amplitude disappears. This can suit document composition or a spectral shape comparison. It can harm a task in which total count, energy or body size is informative. For nonzero vectors, expanding their normalized squared Euclidean difference gives `2−2 cosine_similarity`; that is why the prerequisite compares direction this way. The zero vector has no direction; our policy leaves it zero and does not call that a meaningful angle. L1 divides by the sum of absolute coordinates; max normalization divides by the largest absolute coordinate. These are row operations, not column standardization.

Storage and penalties introduce further reasons to inspect the map. Watch actual zeros change when a sparse matrix is centered, then compare two coefficient vectors making the same prediction.

[[D08]]

The matrix `[[0,0,3],[1,0,0],[0,2,0]]` has three nonzero cells. Subtracting column means [1/3,2/3,1] makes all nine cells nonzero. A sparse container cannot make those new values free. Scale-only StandardScaler(with_mean=False) and MaxAbsScaler can preserve zero support; they serve a different centering contract.

For x=[1,100], w=[1,.01], the prediction x·w=2. Divide the second coordinate by 100 and multiply its coefficient by 100: x′=[1,1], w′=[1,1] still predict 2. But squared coefficient penalties are 1.0001 and 2. Equal predictions do not give equal regularized objectives. Feature units therefore determine which coefficient changes a fixed penalty discourages. We derive this two-coordinate example here; the later regularization lesson owns systematic selection and optimization.

Ideal threshold trees depend on order: a strictly increasing map with a corresponding threshold preserves a split's membership. This explains their lesser sensitivity to unit scaling. Finite precision, histogram boundaries, clipping and merged values qualify implementation behavior. Polynomial construction or row normalization changes more than one column's strictly increasing coordinate map, so this observation does not establish invariance to arbitrary preparation.

The complete program below owns fitted summaries, schema checks, transformation and inverses, plus stateless row normalization. Read `Ruler` as saved state. Frozen arrays prevent accidental edits; transformation validates both feature names and width. NaNs are skipped during fit and preserved at transform so a separate imputation policy can handle them. Infinity is refused. Our exact-zero spread policy is intentionally simpler than sklearn's numerical near-constant heuristics.

[[PROGRAM:fitted_rulers.py]]

Each estimator is fitted to the same column before its query is transformed. The comparisons check state-dependent coordinates and inverse consistency, not every possible floating-point input. The row routine divides first by the largest magnitude to avoid squaring enormous raw values. It changes no fitting state. Reductions/transformation take O(nd) work; percentile fitting may sort, costing O(dn log n). Dense output occupies its actual row×column width. Sparse scaling retains sparse storage; our dense scratch functions do not promise sparse centering.

## 3. Encoding categories means choosing relationships

### Membership is different from order

A label is not necessarily a quantity. Use a constructed vocabulary `red`, `green`, `blue`; these are category names, not instructions to paint the page green. Giving them codes 0,1,2 lets a distance model treat the middle code as between the others. A name alone does not justify that relation. Look at their membership coordinates instead.

[[D09]]

The full one-hot rows are red=[1,0,0], green=[0,1,0], blue=[0,0,1]. Each has exactly one active category coordinate. Any two distinct categories differ in two cells and have distance √2. The three-coordinate geometry is symmetric; a two-dimensional schematic is only a projection, and the literal vectors establish the true distances. Different one-hot blocks and numeric features still need relative weighting. Encoding does not discover their importance.

Now remove the red coordinate and examine both distances and the intercept relation.

[[D10]]

Red becomes [0,0], green [1,0], blue [0,1]. Red is distance 1 from either, while green and blue remain √2 apart. Dropping a reference is useful for some parameterizations, but it changes a distance model's geometry. For a full linear design with an intercept, the three indicator columns sum to the all-ones intercept column. Coefficients are therefore not uniquely identified without a constraint. A suitable least-squares solver can still fit predictions; “all solvers require dropping one column” is false. A penalty also depends on the parameterization, just as units affected the previous coefficient example.

### Unknown, missing and rare need explicit policies

A missing category was not recorded. An unknown category is present now but absent from the fitted vocabulary. A rare category is known with little training support. See how the fitted frequency table, not the query batch, determines the output positions.

[[D11]]

In the constructed policy program, train on a×4, b×1 and one missing label. With threshold 2, b enters a fitted `@rare` bucket, missing keeps its own `@missing` coordinate, and a remains frequent. These `@` names are reserved internal markers: real labels starting with `@` are refused so no measured category silently collides with absence. A present `new` label either errors, becomes all zeros, or uses the rare bucket **if one exists**, according to the selected unknown policy. Missing is not automatically unknown if it had a fitted coordinate.

[[L4]]

Inspect the full output vector and column names while editing the query label, unknown policy and rare threshold. A threshold can remove the rare bucket; `infrequent_if_exist` then has no fitted bucket to use and falls back to all zeros in this custom contract. An unchanged frequent a is a null case. Raising a threshold refits the training policy; changing only the query does not.

OneHotEncoder exposes categories_, output names, drop and unknown/rare policy. Its native frequency grouping can put a missing marker into the infrequent bucket. That differs from our policy keeping missing separate. The program first compares an explicitly pregrouped, same-column library route, then prints the native route's distinct names. This qualification is more useful than asserting universal parity because two examples happen to have the same width. Sparse output stores active coordinates without allocating a dense n×v matrix.

Order can be real without equal gaps being real. Put small, medium and large on their supplied code axis.

[[D12]]

Codes 0,1,2 express an order and, for linear/distance arithmetic, equal adjacent gaps. Clinical grades or sizes may justify the order without equal spacing. An ordinal threshold can split contiguous parts of the order; arbitrary nominal subsets need another representation or estimator. Renaming nominal codes can alter distance while renaming full one-hot columns preserves its geometry.

The complete program fits deterministic counts/vocabulary, creates dense or sparse membership rows, and separately maps a supplied ordinal order. It returns output names alongside the matrix. Unknown and missing ordinal codes are distinct negative values outside the ordered range; a model still needs to interpret them appropriately. Native categorical estimators can offer another route—check the actual estimator's category and missing interfaces rather than feeding arbitrary codes to every tree implementation.

[[PROGRAM:category_policies.py]]

Counting costs O(n), with O(v log v) sorting for reproducible vocabulary order. One sparse one-hot field needs at most one active entry per row; dense output still has n×v cells. Rare grouping discards individual identities deliberately. Unknown all-zero encoding is not neutral: it is distance 1 from a full known one-hot row, closer than the √2 between two known categories. With a dropped reference it can coincide with the reference. Monitoring unseen valid labels remains an application decision even when transformation does not raise.

## 4. A missing value is a question, not a zero

### A transparent fill preserves its recording history

Switch to the constructed measurements `[10,20,NA,NA]`. Draw the observed order statistics, filled cells and original missing mask side by side.

[[D13]]

The median of the observed 10 and 20 is 15. Replacing the two missing cells gives [10,20,15,15], with M=[0,0,1,1]. It is a usable numerical input, but its spread is reduced: population squared deviations from 15 average to 12.5, versus 25 among the two observed values. Neither figure estimates the true full-data variance without assumptions. Both [10,20,10,20] and [10,20,50,60] agree with the observations; their full means are 15 and 35. Filling did not decide which unseen world occurred.

An actual measured 15 and a filled 15 have the same numeric coordinate. Appending M lets a predictor distinguish their recording histories. This can help when measurement is selective. If collection policy changes, the indicator relationship can change too. A measured zero remains observed; we represent absence with NaN, not every zero.

### What caused the gap?

Now compare three **specified generators** for missing mass while holding a small station/weight table visible. Their probability rules are assumptions about the recording process, not diagnoses inferred from the mask.

[[D14]]

MCAR means missingness is independent of the data values under the stated model. An independent coin erasing mass with probability .2 is an example. MAR permits dependence on observed information: station a erases with probability .1 and station b with probability .6, with no remaining weight dependence within a station. Rates can be unequal and still satisfy that conditional assumption. MNAR permits remaining dependence on the unseen value, such as a scale failing above an unrecorded weight threshold even after conditioning on other observed information. Remember M=1 means missing here; statistical texts often state these conditions using R=1 observed instead.

The same observed pattern may be compatible with different mechanisms. Observed cells generally cannot rule out all MNAR alternatives. MAR alone is also not a universal inferential validity certificate: the imputation/analysis model and relevant ignorability conditions matter. A descriptive co-missingness plot shows which gaps occur together, not why. Structural “not applicable” may need a distinct state rather than an estimated measurement. Complete-case deletion can alter which population is represented and reduce precision; there is no universal percentage below which deletion is safe. Indicators can improve prediction without identifying unseen values or fixing MNAR.

The simple-fill program saves observed counts and a median, mean or declared constant for each named feature. Transform returns both completed values and the original mask. All-missing training columns are rejected by default; an explicit constant policy retains width. `SimpleImputer(keep_empty_features=True)` is an ordinary route with its own empty-column semantics. We compare supported observed-column median behavior, rather than pretending every constant policy is identical.

[[PROGRAM:masked_simple_imputation.py]]

`fit_mixed` is also the complete supported successor for the indicator/robust modification introduced later with the retained P1. It does not import or run P1's top-level example. Its three stages fit fills, fit a standard or robust numeric ruler on the filled training matrix, then save category order. `mixed_transform` appends the original mask **after** the numeric and category coordinates. MissingIndicator(features='all', error_on_new=False) supplies the same fixed-width indicator branch. SimpleImputer(add_indicator=True) instead includes only columns missing during fitting; a newly missing column can therefore lack its own indicator. The printed widths make that difference concrete.

### Borrow only from rows that can donate this target

For local conditional information, compare the constructed query Q=[2,12,NA] with three donors. Look first at which coordinates can be compared.

[[D15]]

| Row | a | b | c |
| --- | ---: | ---: | ---: |
| Q | 2 | 12 | NA |
| D1 | 1 | 10 | 100 |
| D2 | 3 | NA | 300 |
| D3 | NA | 14 | 500 |

Q and D1 overlap on a,b; Q and D2 only a; Q and D3 only b. The target c is missing in Q, so none of the donors' c values enter a Q-to-donor distance. Having a defined distance and observing the requested target are separate requirements.

Draw the overlap counts and adjusted squared differences before ranking lengths.

[[D16]]

For total width d and q jointly observed coordinates, the nan-aware squared distance is `(d/q) Σshared Δ²`. Here d=3. D1 gives (3/2)(1+4)=7.5; D2 gives 3(1)=3; D3 gives 3(4)=12. The distances are their square roots, not 7.5,3,12 drawn as Euclidean lengths. No overlap means an undefined distance, not zero. The factor extrapolates the average squared discrepancy across the full width; weak or selective overlap can make this a poor similarity estimate.

Now connect only the selected target cells to the estimate.

[[D17]]

With k=2 and uniform weights, D2 and D1 supply (300+100)/2=200. Remove D2's c and it cannot donate c even though its observed a still permits a comparison; D1 and D3 now give 300. Separately, change D1's c to 140 with all original cells otherwise restored: selection stays D2,D1 and the answer becomes 220. Changing unused D3 c can be a null. If no target-eligible donor has any overlap, the fallback uses the training target's observed mean, 300 here. If the entire training target column is absent, no donor evidence supports an estimate; our default refuses it, while an explicit constant policy remains a modeling choice.

[[L5]]

Select and edit one actual Q/donor input cell, including marking it absent, and vary k. Eligibility, overlap, distances, selected c cells and result update together. Start at 200; inspect the 300 and 220 contrasts and the no-overlap fallback. Stable source-index ties are our custom policy. sklearn need not select the same tied subset; compare untied cases or aggregates invariant to the tie.

For multiple missing query features, compute distances from the **original** query once. Filling c must not silently make c available when selecting donors for another target. This differs from iterative conditional completion, which deliberately uses current filled predictors and will receive its own algorithm. Read the full target-specific selection loop below.

[[PROGRAM:nan_aware_donors.py]]

The state keeps copies of training donors, observed means and counts. For each query, the shared mask creates one distance vector. For each missing target, it filters eligible target-observed rows, stably orders them and chooses up to k defined distances. Uniform means and normalized inverse-distance weights are separate choices; when exact-zero donors occur, distance weighting shares mass among exact matches, avoiding division by zero. Observed query cells remain unchanged. Distance work is O(qnd) for q query rows; full donor sorting costs O(n log n) per missing target in this transparent reference. Reusing the distance vector saves repeated coordinate arithmetic, but does not make a wide incomplete table free.

Iterative completion can use broader feature relationships. For a first conceptual turn, if complete cases follow mass=100×length, observed length 3 can suggest missing mass 300. That is a fitted conditional estimate, not a measurement. When another row lacks length, a later model may use currently filled mass. Section 9 builds and saves this sequence rather than leaving the mechanism inside an unexplained estimator.

## 5. Learn the preparation rule without looking ahead

### Fit and transform have different information

Fit learns state: medians, centers, scales, vocabulary or parameters. Transform applies that state to new inputs. A query must not redefine its own ruler. If training endpoints are 1 and 100, later 150 maps to 149/99; fitting again on the later batch changes the question.

Switch to P1's **four-row constructed example with three numeric features**, not the penguin experiment's four. Follow each training column into its saved arrays.

[[D18]]

The training numeric rows are [10,100,7], [20,NA,7], [30,300,7], [NA,500,7]. Medians are [20,300,7]. After filling, means are [20,300,7] and population scales [√50,√20000,1], with 1 replacing the third column's zero spread. Categories b,a,missing,a give sorted columns a,b,not_recorded. These arrays, not the later batch, determine subsequent coordinates.

Join the actual numeric and categorical cells in their invariant order.

[[D19]]

P1 outputs three numeric plus three one-hot coordinates: width **6**. The later real penguin pipeline has four numeric plus three one-hot coordinates: width **7**. This switch is explicit. The target remains separate in both. In a Pipeline, steps in one branch run sequentially; ColumnTransformer runs designated column branches and concatenates their outputs in the declared order. Output names are part of the schema, not decoration.

The retained complete P1 below constructs the state with NumPy, then fits SimpleImputer, StandardScaler and OneHotEncoder on the same inputs to compare supported behavior. Its exact source and recorded stdout are preserved from the historical execution; this content revision did not replay its main. The scratch policy rejects all-missing training numeric columns and reserves `not_recorded` for absence. That is a bounded teaching policy, not general equivalence to every library configuration.

[[PROGRAM:fitted_preparation.py]]

`inputs` checks row/column form and one category per row. `np.where` fills only NaNs, broadcasting the three saved medians across rows. Means/scales broadcast the same way at transform. Comparing each category against vocabulary positions creates one-hot membership; `column_stack` places the numeric block before it. The first query [25,NA,9],unknown becomes approximately [.707107,0,2,0,0,0]. Missing numeric feature two is filled with its fitted median and becomes zero here. Constant-training feature three later 9 becomes 2. The unknown category gets zeros; a missing category instead uses not_recorded. The second query's edited measurement 1000 changes its coordinate to about 4.949747 while state and the other row stay fixed.

Keep a boundary around the rows allowed to fit those arrays; the query has no backward path.

[[D20]]

Split before learning preparation. Unsupervised summaries can leak held-out feature distribution even without labels. Fit the preprocessing and predictor using training rows; transform the held-out inputs and compare predictions with held-out outcomes afterward. In a validation fold, that boundary is repeated with a fresh fitting state for the fold's training rows. This local explanation needs only a held-out subset; the next lesson owns complete selection, inner/outer assessment and refit procedures.

[[L6]]

Edit one numeric query cell with the P1 state pinned. Its output coordinate changes or uses the stored median; every fitted array remains unchanged. Change third-feature 7 to 9 and see 2. Reset restores the query, selection and current output together. A no-refit invariant is something to inspect, not a badge automatically earned by using a Pipeline.

The complete P4 mixed successor supplies the previously requested indicator and robust extension. For [15,500,NA],b, standard numeric coordinates are [−1/√2,√2,0], category block [0,1,0], original mask [0,0,1]. Its nine-coordinate result is approximately [−.707107,1.414214,0,0,1,0,0,0,1]. Robust state uses the filled training medians and linear IQR, with constant spread replaced by 1. The source and ordinary comparisons are already fully shown in section 4; practice changes its input rather than asking you to invent hidden helpers.

Pipeline packages the boundary but does not repair a target-revealing feature, related subjects split on both sides, or a transformer manually fitted on all rows beforehand. TargetEncoder also has a deliberate training exception: fit_transform creates cross-fitted codes, whereas fit then transform creates full-fit codes. Section 8 teaches why the two representations differ.

## 6. A complete experiment on real penguin measurements

Return now to the real Palmer Penguins file. It contains 344 observations; the supplied four measurements each have two missing rows, and recorded sex has eleven. Bill length/depth and flipper length are millimeters, mass grams. We select these four measurements plus sex and predict Adelie, Chinstrap or Gentoo. The data were collected for ecological research; this classification exercise does not establish performance for every future population or collection protocol.

Inspect the preserved partition and correct counts on a common zero-based axis.

[[D21]]

The retained stratified seed-20 split has 258 training and 86 assessment rows. Each classifier uses five neighbors, identical categorical preparation and the same indices. The only comparison choice is the numerical ruler after median fill. The training majority baseline gets 38/86 correct. Raw numeric coordinates get 67, standard 84, min–max 85, robust 85. An extra correct case does not identify a generally superior scaler. Repeatedly choosing from this held-out result makes it development evidence rather than fresh assessment; the next lesson formalizes a better selection protocol.

This exact full program and stdout are retained from the September 21 native receipt (NumPy 2.3.5, pandas 3.0.1, scikit-learn 1.9.1, Python 3.12 route). They have **not** been rerun for this content revision. Keep penguins.csv beside the file. The exact historical LF execution-input identity and current CRLF download identity are both explained below.

[[PROGRAM:penguins_prepare.py]]

`train_test_split` returns source positions, stratifying by species. Numeric and categorical names select X; y is separate. `make_model` constructs new fitted objects for each comparison. Numeric Pipeline fills and then scales; categorical Pipeline inserts a reserved marker and then one-hot encodes. ColumnTransformer joins their outputs. The outer Pipeline applies fitted preparation before KNeighborsClassifier. `fit(X.iloc[train], y.iloc[train])` is the only fitting route. `predict(X.iloc[test])` applies saved state. “passthrough” leaves numeric units unchanged but retains median fill. DummyClassifier learns the training majority; it does not read the held-out class counts to choose its answer.

Follow the actual source row 309 through frozen statistics into all seven coordinates.

[[D22]]

The numeric medians are [45,17.3,197,4000]. Training means after fill are approximately [43.9306,17.0992,200.6589,4190.9884]; scales [5.4000,1.9387,14.2307,806.6876]. Row 309's observed [51,18.8,203,4100] becomes approximately [1.3091,.8773,.1645,−.1128]. The ordered categorical block is female,male,not_recorded, giving [0,1,0]. A negative mass coordinate means below the training mean, not negative physical mass.

[[L7]]

Inspect a retained row or alter an independent copy, with fitted state fixed. Erasing row 309's mass supplies median 4000 and computes `(4000−4190.988372093023)/806.6875829303058≈−.2368`; other coordinates stay unchanged. Editing sex affects the category block. A present unknown string maps all-zero under the saved policy; missing uses not_recorded. These are input inspection operations, not newly trained predictions or updated accuracy. All 86 retained transformed rows and predictions remain available in the data attachment.

Now align source positions, split order and retained outcomes before interpreting the result's provenance.

[[D23]]

There are two exact byte identities for one parsed observation table. The actual current downloadable file has CRLF line endings and 15586 bytes. The historical execution input has LF line endings and 15241 bytes. Replacing every CRLF with LF in the current bytes gives the exact historical SHA-256, not merely a similar-looking table. The setup/source-role index prints both full hashes. Generated predecessor provenance still advertises the LF identity; that literal is historical metadata and does not describe the current download's raw bytes. None of this asserts a new fit against the current byte file. The 344 parsed rows preserve order/values/missing cells, and the 86 transformed rows equal the retained calculated JSON without numerical replay.

Standard scaling misclassified two rows and raw coordinates nineteen on this split. Examine actual errors, feature availability and geometry before inventing a species story. The recording process and population matter more than a tidy score. This is a controlled application showing that representation changes an estimator's evidence; it is not a leaderboard or proof that prediction-oriented fills recover scientific truth.
