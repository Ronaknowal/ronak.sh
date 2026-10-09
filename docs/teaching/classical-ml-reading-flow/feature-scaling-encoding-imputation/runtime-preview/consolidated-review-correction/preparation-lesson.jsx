import React from 'react';
import { H2, H3 } from '../../../../../../src/learn/components/content/Headings.jsx';
import { Prose } from '../../../../../../src/learn/components/content/Prose.jsx';
import { CodeBlock } from '../../../../../../src/learn/components/content/Code.jsx';
import RemoteCodeBlock from '../../../../../../src/learn/components/content/RemoteCodeBlock.jsx';
import { Math as InlineMath, MathBlock } from '../../../../../../src/learn/components/content/Math.jsx';
import { Table as ValuesTable } from './Drawing.jsx';
import { PreparationFigure } from './PreparationFigures.jsx';
import { PreparationInvestigation } from './PreparationInvestigations.jsx';
import './lesson.css';
// The prepared renderer supplies the current heading as table context. Keep it
// as an accessible label rather than repeating every section title as a caption.
function NeuralTable({ caption, ...props }) {
  return <ValuesTable {...props} label={caption} />;
}
function PreparationLesson() {
  return <div className="lesson-flow prep-reader">
<Prose>{"A model reads coordinates. A field notebook records measurements, categories and gaps. Turning one into the other is part of the modeling decision: a ruler changes which penguin looks nearest, a category representation changes which differences count, and a fill supplies a number we did not observe."}</Prose>

<Prose opening="summary">{"We will follow one practical question: can a penguin's measurements help distinguish its species? The real observations anchor the question; small, explicitly constructed tables make each mechanism possible to calculate. We will build preparation functions, recognize their stored state in ordinary library objects, and inspect one preserved real experiment. No method is a universal winner."}</Prose>

<Prose opening="route">{"Start with sections 1–6, then core practice in section 10 and readiness in section 11. Sections 7–9 are visible deeper branches: nonlinear coordinates and bases; high-cardinality categories; conditional completion and uncertainty. They use the same step-by-step approach and can be read in a second sitting. You need rows and columns, Python arrays, averages and the idea of predicting a label. We introduce new notation where it enters. Complete files, exact outputs and setup are supplied; code is part of the explanation, available without a disclosure. Hints and solutions alone use disclosures."}</Prose>

<H2>{"1. Three different questions hiding inside “preprocessing”"}</H2>

<Prose>{"The first held-out case in the retained experiment is zero-based source row 309. “309” means its position in this file, not a biological identifier and not a feature used by our model. Look across its measurement cells, then across to the separate answer column."}</Prose>

<PreparationFigure id="D01" />

<NeuralTable caption={"1. Three different questions hiding inside “preprocessing”"} headers={[<>{"Source position"}</>,<>{"Bill length"}</>,<>{"Bill depth"}</>,<>{"Flipper length"}</>,<>{"Body mass"}</>,<>{"Recorded sex"}</>,<>{"Target species"}</>]} rows={[[<>{"309"}</>,<>{"51.0 mm"}</>,<>{"18.8 mm"}</>,<>{"203.0 mm"}</>,<>{"4100 g"}</>,<>{"male"}</>,<>{"Chinstrap"}</>]]} />

<Prose>{"An observation is one row. A feature is a selected input available when a prediction must be made. The target is the answer used for training or later assessment, species here. Availability matters as much as numerical format: a field recorded after species identification might reveal the answer rather than help predict it. Our experiment excludes source position, island, year and species from its input."}</Prose>

<Prose>{"Write the feature table as X with n rows and d columns. Thus X has shape n×d; a row xᵢ holds one case's inputs, and column j follows one feature across cases. The target vector y has n entries and stays separate. Before encoding, X can contain different kinds of values. A numerical estimator ultimately needs the representation its interface promises; being stored in a table does not make every column a quantitative measurement."}</Prose>

<Prose>{"Now make an independent copy of row 309 and erase only its mass. Follow the same row positions into the prepared coordinates."}</Prose>

<PreparationFigure id="D02" />

<Prose>{"The altered copy is "}<code>{"[51,18.8,203,NA,male]"}</code>{". Sex is still observed. For numeric cells define Mᵢⱼ=1 when the "}<strong>{"input is missing"}</strong>{", and 0 when observed. This convention is the opposite of an observation indicator R used in many statistical texts: R=1−M. We will keep the original M after filling. A filled mass coordinate is an estimate carrying a missing marker, not an observed 4000 g. Unknown sex, when a present string was absent from the fitted vocabulary, is a separate input-policy case; it is not another biological state we found in the file."}</Prose>

<Prose>{"Scaling asks which numeric differences should have comparable influence. Encoding asks which relationships a category should express. Imputation asks which usable input to supply for an absent measurement. Converting grams to kilograms, making an indicator for "}<code>{"male"}</code>{", and replacing a missing mass are three different operations. Combining them does not remove their separate assumptions."}</Prose>

<Prose>{"The preceding "}<a href={"/learn/path/full-curriculum/non-negative-matrix-factorization-nmf?module=classical-ml"}>{"NMF lesson"}</a>{" uses rows as observations and requires nonnegative X for its additive reconstruction. Centering can create negative coordinates, so a useful preparation for a distance model can violate that domain. Begin with the downstream operation's meaning and input contract, rather than choosing a familiar preprocessing recipe."}</Prose>

<H2>{"2. Scaling changes the meaning of “nearby”"}</H2>

<H3>{"Make the ruler explicit"}</H3>

<Prose>{"Switch now to three "}<strong>{"constructed"}</strong>{" two-feature cases: Q=(40,4000), A=(41,4100), B=(43,4001), in millimeters and grams. These are arithmetic fixtures, not additional penguin observations. The KNN prerequisite's "}<a href={"/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#2-make-nearness-an-explicit-choice"}>{"actual distance section"}</a>{" derives Euclidean, Manhattan and maximum-coordinate distances; its complete "}<code>{"units-cosine"}</code>{" example shows why units and directions matter. Here we change the coordinate map before using that distance."}</Prose>

<Prose>{"Look first at the differences from Q, which are much easier to compare than absolute masses."}</Prose>

<PreparationFigure id="D03" />

<Prose>{"A differs by (1,100); B by (3,1). Raw squared Euclidean distance gives 1²+100²=10001 for A and 3²+1²=10 for B. The rule chooses B. The arithmetic silently gave a 100 g difference much more numerical influence than a few millimeters."}</Prose>

<Prose>{"Decide instead that 1 mm and 100 g should each count as one comparison unit. Draw each divided difference as a triangle leg and its squared contribution beside it."}</Prose>

<PreparationFigure id="D04" />

<Prose>{"With divisors a=1, b=100, A has squared distance 1²+1²=2, while B has 3²+.01²=9.0001. A is now nearest. Nothing about the physical measurements changed. Dividing feature j by sⱼ gives"}</Prose>

<div className="neural-equation"><MathBlock>{"d_s^2(x,z)=\\sum_j((x_j-z_j)/s_j)^2\n           =\\sum_j (x_j-z_j)^2/s_j^2,\\qquad s_j>0."}</MathBlock></div>

<Prose>{"The squared-distance weight is 1/sⱼ². A shared center cancels: "}<code>{"(x−c)−(z−c)=x−z"}</code>{". Doubling "}<strong>{"both"}</strong>{" divisors divides both sums by four, giving .5 and 2.250025; ranking is unchanged. Changing just one divisor changes relative influence. L1 and maximum-coordinate distance use their own contribution rules; dividing coordinates still changes their geometry, but the L2 circles here are not pictures of L1 diamonds."}</Prose>

<PreparationInvestigation id="L1" />

<Prose>{"Begin with A nearer at 2 versus 9.0001. Change the mass divisor toward 1 and watch the mass leg and squared contribution grow until B is nearer. The immediately visible result explains which contribution changed. Common rescaling is a useful null for the ranking. Choose a divisor because of feature meaning or development evidence, rather than because standardization is fashionable."}</Prose>

<PreparationInvestigation id="L2" />

<Prose>{"Keep divisors 1 and 100, then change A's mass to 4400. Its difference becomes (1,400), giving 1+16=17; B stays at 9.0001 and wins. Coincide A with Q and its distance becomes zero. Editing Q must update both candidates. Geometry and arithmetic remain the same state; an axis viewport cannot clamp a computed length or circle radius. Keep the complete uncapped-radius geometry visible throughout the declared input domain."}</Prose>

<H3>{"Fit a ruler on training observations"}</H3>

<Prose>{"If domain knowledge does not supply divisors, summarize typical training variation. For a numerical column, fit mean μ=(Σxᵢ)/n and population standard deviation s=√[Σ(xᵢ−μ)²/n], then transform a later x into z=(x−μ)/s. Dividing by n matches the transformation convention in StandardScaler; this is not an unbiased sample-variance calculation. A nonconstant training column gets mean zero and variance one. Its ordering and distribution shape are otherwise unchanged: a skewed distribution remains skewed, and no regression-error assumption has been proved."}</Prose>

<Prose>{"See which observations determine three different rulers on the constructed training column "}<code>{"[1,2,3,4,100]"}</code>{"."}</Prose>

<PreparationFigure id="D05" />

<Prose>{"The mean is 22, the population scale is about 39.012818, the minimum/range are 1/99, and the median/IQR are 3/2 under linear percentiles (Q25=2, Q75=4). Standard scaling uses "}<code>{"(x−22)/39.012818"}</code>{"; min–max uses "}<code>{"(x−1)/99"}</code>{"; robust uses "}<code>{"(x−3)/2"}</code>{". Max-absolute scaling uses x/100 and preserves measured zeros."}</Prose>

<NeuralTable caption={"Fit a ruler on training observations"} headers={[<>{"Value"}</>,<>{"Standard"}</>,<>{"Min–max"}</>,<>{"Robust"}</>,<>{"Max-absolute"}</>]} rows={[[<>{"1"}</>,<>{"−.5383"}</>,<>{"0"}</>,<>{"−1"}</>,<>{".01"}</>],[<>{"2"}</>,<>{"−.5127"}</>,<>{".0101"}</>,<>{"−.5"}</>,<>{".02"}</>],[<>{"3"}</>,<>{"−.4870"}</>,<>{".0202"}</>,<>{"0"}</>,<>{".03"}</>],[<>{"4"}</>,<>{"−.4614"}</>,<>{".0303"}</>,<>{".5"}</>,<>{".04"}</>],[<>{"100"}</>,<>{"1.9993"}</>,<>{"1"}</>,<>{"48.5"}</>,<>{"1"}</>],[<>{"Later 150"}</>,<>{"3.2810"}</>,<>{"1.5051"}</>,<>{"73.5"}</>,<>{"1.5"}</>]]} />

<Prose>{"The full extent keeps 100 and later 150 visible; the magnified view makes the separation among 1–4 perceptible. Robust scaling has not deleted or clipped the outlier. It uses central spread, making 100 a large coordinate. Min–max places "}<strong>{"training"}</strong>{" endpoints at 0 and 1. Later values can exceed them. Clipping would be another operation that discards how far beyond the fitted range a value lies."}</Prose>

<PreparationInvestigation id="L3" />

<Prose>{"Change the last training value from 100 to 1000. Mean, standard deviation and range change. The central quartiles here remain 2 and 4, so robust scaling's saved center/scale remain 3/2. Change only the query and none of these fitted summaries should move. “Robust” refers to this rule's resistance to particular changes in the fit, not proof that outliers never matter downstream."}</Prose>

<Prose>{"What if training variation is zero? Trace the replacement divisor separately from the later coordinate."}</Prose>

<PreparationFigure id="D06" />

<Prose>{"For "}<code>{"[7,7,7]"}</code>{", center=7 and measured spread=0. Our explicit policy stores divisor 1 with a zero-spread flag. Training values and later 7 become zero; later 9 becomes 2. “Constant during fit” does not mean “force every future input to zero.” An all-missing training column is different: there is no center or spread supported by observations. Refuse it or choose a declared keep/drop policy; do not infer a median of zero."}</Prose>

<H3>{"Preserve direction only when size is dispensable"}</H3>

<Prose>{"Column scaling learns one ruler per feature. Row normalization uses each case's own size. Look at two vectors on one ray and the single point they become on the unit circle."}</Prose>

<PreparationFigure id="D07" />

<Prose>{"The lengths of [3,4] and [6,8] are 5 and 10. Both become [.6,.8] after L2 normalization. Direction survives; amplitude disappears. This can suit document composition or a spectral shape comparison. It can harm a task in which total count, energy or body size is informative. For nonzero vectors, expanding their normalized squared Euclidean difference gives "}<code>{"2−2 cosine_similarity"}</code>{"; that is why the prerequisite compares direction this way. The zero vector has no direction; our policy leaves it zero and does not call that a meaningful angle. L1 divides by the sum of absolute coordinates; max normalization divides by the largest absolute coordinate. These are row operations, not column standardization."}</Prose>

<Prose>{"Storage and penalties introduce further reasons to inspect the map. Watch actual zeros change when a sparse matrix is centered, then compare two coefficient vectors making the same prediction."}</Prose>

<PreparationFigure id="D08" />

<Prose>{"The matrix "}<code>{"[[0,0,3],[1,0,0],[0,2,0]]"}</code>{" has three nonzero cells. Subtracting column means [1/3,2/3,1] makes all nine cells nonzero. A sparse container cannot make those new values free. Scale-only StandardScaler(with_mean=False) and MaxAbsScaler can preserve zero support; they serve a different centering contract."}</Prose>

<Prose>{"For x=[1,100], w=[1,.01], the prediction x·w=2. Divide the second coordinate by 100 and multiply its coefficient by 100: x′=[1,1], w′=[1,1] still predict 2. But squared coefficient penalties are 1.0001 and 2. Equal predictions do not give equal regularized objectives. Feature units therefore determine which coefficient changes a fixed penalty discourages. We derive this two-coordinate example here; the later regularization lesson owns systematic selection and optimization."}</Prose>

<Prose>{"Ideal threshold trees depend on order: a strictly increasing map with a corresponding threshold preserves a split's membership. This explains their lesser sensitivity to unit scaling. Finite precision, histogram boundaries, clipping and merged values qualify implementation behavior. Polynomial construction or row normalization changes more than one column's strictly increasing coordinate map, so this observation does not establish invariance to arbitrary preparation."}</Prose>

<Prose>{"The complete program below owns fitted summaries, schema checks, transformation and inverses, plus stateless row normalization. Read "}<code>{"Ruler"}</code>{" as saved state. Frozen arrays prevent accidental edits; transformation validates both feature names and width. NaNs are skipped during fit and preserved at transform so a separate imputation policy can handle them. Infinity is refused. Our exact-zero spread policy is intentionally simpler than sklearn's numerical near-constant heuristics."}</Prose>

<Prose>{""}<strong>{"fitted_rulers.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_rulers.py"}>fitted_rulers.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_rulers.py"} filename={"fitted_rulers.py"} language="python" title={"fitted_rulers.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_rulers.stdout.txt"}>fitted_rulers.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_rulers.stdout.txt"} filename={"fitted_rulers.stdout.txt"} language="output" title={"Recorded stdout · fitted_rulers.stdout.txt"} />

<Prose>{"Each estimator is fitted to the same column before its query is transformed. The comparisons check state-dependent coordinates and inverse consistency, not every possible floating-point input. The row routine divides first by the largest magnitude to avoid squaring enormous raw values. It changes no fitting state. Reductions/transformation take O(nd) work; percentile fitting may sort, costing O(dn log n). Dense output occupies its actual row×column width. Sparse scaling retains sparse storage; our dense scratch functions do not promise sparse centering."}</Prose>

<H2>{"3. Encoding categories means choosing relationships"}</H2>

<H3>{"Membership is different from order"}</H3>

<Prose>{"A label is not necessarily a quantity. Use the constructed category vocabulary "}<code>{"red"}</code>{", "}<code>{"green"}</code>{", "}<code>{"blue"}</code>{". Giving them codes 0,1,2 lets a distance model treat the middle code as between the others. A name alone does not justify that relation. Look at their membership coordinates instead."}</Prose>

<PreparationFigure id="D09" />

<Prose>{"The full one-hot rows are red=[1,0,0], green=[0,1,0], blue=[0,0,1]. Each has exactly one active category coordinate. Any two distinct categories differ in two cells and have distance √2. The three-coordinate geometry is symmetric; a two-dimensional schematic is only a projection, and the literal vectors establish the true distances. Different one-hot blocks and numeric features still need relative weighting. Encoding does not discover their importance."}</Prose>

<Prose>{"Now remove the red coordinate and examine both distances and the intercept relation."}</Prose>

<PreparationFigure id="D10" />

<Prose>{"Red becomes [0,0], green [1,0], blue [0,1]. Red is distance 1 from either, while green and blue remain √2 apart. Dropping a reference is useful for some parameterizations, but it changes a distance model's geometry. For a full linear design with an intercept, the three indicator columns sum to the all-ones intercept column. Coefficients are therefore not uniquely identified without a constraint. A suitable least-squares solver can still fit predictions; “all solvers require dropping one column” is false. A penalty also depends on the parameterization, just as units affected the previous coefficient example."}</Prose>

<H3>{"Unknown, missing and rare need explicit policies"}</H3>

<Prose>{"A missing category was not recorded. An unknown category is present now but absent from the fitted vocabulary. A rare category is known with little training support. See how the fitted frequency table, not the query batch, determines the output positions."}</Prose>

<PreparationFigure id="D11" />

<Prose>{"In the constructed policy program, train on a×4, b×1 and one missing label. With threshold 2, b enters a fitted "}<code>{"@rare"}</code>{" bucket, missing keeps its own "}<code>{"@missing"}</code>{" coordinate, and a remains frequent. These "}<code>{"@"}</code>{" names are reserved internal markers: real labels starting with "}<code>{"@"}</code>{" are refused so no measured category silently collides with absence. A present "}<code>{"new"}</code>{" label either errors, becomes all zeros, or uses the rare bucket "}<strong>{"if one exists"}</strong>{", according to the selected unknown policy. Missing is not automatically unknown if it had a fitted coordinate."}</Prose>

<PreparationInvestigation id="L4" />

<Prose>{"Inspect the full output vector and column names while editing the query label, unknown policy and rare threshold. A threshold can remove the rare bucket; "}<code>{"infrequent_if_exist"}</code>{" then has no fitted bucket to use and falls back to all zeros in this custom contract. An unchanged frequent a is a null case. Raising a threshold refits the training policy; changing only the query does not."}</Prose>

<Prose>{"OneHotEncoder exposes categories_, output names, drop and unknown/rare policy. Its native frequency grouping can put a missing marker into the infrequent bucket. That differs from our policy keeping missing separate. The program first compares an explicitly pregrouped, same-column library route, then prints the native route's distinct names. This qualification is more useful than asserting universal parity because two examples happen to have the same width. Sparse output stores active coordinates without allocating a dense n×v matrix."}</Prose>

<Prose>{"Order can be real without equal gaps being real. Put small, medium and large on their supplied code axis."}</Prose>

<PreparationFigure id="D12" />

<Prose>{"Codes 0,1,2 express an order and, for linear/distance arithmetic, equal adjacent gaps. Clinical grades or sizes may justify the order without equal spacing. An ordinal threshold can split contiguous parts of the order; arbitrary nominal subsets need another representation or estimator. Renaming nominal codes can alter distance while renaming full one-hot columns preserves its geometry."}</Prose>

<Prose>{"The complete program fits deterministic counts/vocabulary, creates dense or sparse membership rows, and separately maps a supplied ordinal order. It returns output names alongside the matrix. Unknown and missing ordinal codes are distinct negative values outside the ordered range; a model still needs to interpret them appropriately. Native categorical estimators can offer another route—check the actual estimator's category and missing interfaces rather than feeding arbitrary codes to every tree implementation."}</Prose>

<Prose>{""}<strong>{"category_policies.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/category_policies.py"}>category_policies.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/category_policies.py"} filename={"category_policies.py"} language="python" title={"category_policies.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/category_policies.stdout.txt"}>category_policies.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/category_policies.stdout.txt"} filename={"category_policies.stdout.txt"} language="output" title={"Recorded stdout · category_policies.stdout.txt"} />

<Prose>{"Counting costs O(n), with O(v log v) sorting for reproducible vocabulary order. One sparse one-hot field needs at most one active entry per row; dense output still has n×v cells. Rare grouping discards individual identities deliberately. Unknown all-zero encoding is not neutral: it is distance 1 from a full known one-hot row, closer than the √2 between two known categories. With a dropped reference it can coincide with the reference. Monitoring unseen valid labels remains an application decision even when transformation does not raise."}</Prose>

<H2>{"4. A missing value is a question, not a zero"}</H2>

<H3>{"A transparent fill preserves its recording history"}</H3>

<Prose>{"Switch to the constructed measurements "}<code>{"[10,20,NA,NA]"}</code>{". Draw the observed order statistics, filled cells and original missing mask side by side."}</Prose>

<PreparationFigure id="D13" />

<Prose>{"The median of the observed 10 and 20 is 15. Replacing the two missing cells gives [10,20,15,15], with M=[0,0,1,1]. It is a usable numerical input, but its spread is reduced: population squared deviations from 15 average to 12.5, versus 25 among the two observed values. Neither figure estimates the true full-data variance without assumptions. Both [10,20,10,20] and [10,20,50,60] agree with the observations; their full means are 15 and 35. Filling did not decide which unseen world occurred."}</Prose>

<Prose>{"An actual measured 15 and a filled 15 have the same numeric coordinate. Appending M lets a predictor distinguish their recording histories. This can help when measurement is selective. If collection policy changes, the indicator relationship can change too. A measured zero remains observed; we represent absence with NaN, not every zero."}</Prose>

<H3>{"What caused the gap?"}</H3>

<Prose>{"Now compare three "}<strong>{"specified generators"}</strong>{" for missing mass while holding a small station/weight table visible. Their probability rules are assumptions about the recording process, not diagnoses inferred from the mask."}</Prose>

<PreparationFigure id="D14" />

<Prose>{"MCAR means missingness is independent of the data values under the stated model. An independent coin erasing mass with probability .2 is an example. MAR permits dependence on observed information: station a erases with probability .1 and station b with probability .6, with no remaining weight dependence within a station. Rates can be unequal and still satisfy that conditional assumption. MNAR permits remaining dependence on the unseen value, such as a scale failing above an unrecorded weight threshold even after conditioning on other observed information. Remember M=1 means missing here; statistical texts often state these conditions using R=1 observed instead."}</Prose>

<Prose>{"The same observed pattern may be compatible with different mechanisms. Observed cells generally cannot rule out all MNAR alternatives. MAR alone is also not a universal inferential validity certificate: the imputation/analysis model and relevant ignorability conditions matter. A descriptive co-missingness plot shows which gaps occur together, not why. Structural “not applicable” may need a distinct state rather than an estimated measurement. Complete-case deletion can alter which population is represented and reduce precision; there is no universal percentage below which deletion is safe. Indicators can improve prediction without identifying unseen values or fixing MNAR."}</Prose>

<Prose>{"The simple-fill program saves observed counts and a median, mean or declared constant for each named feature. Transform returns both completed values and the original mask. All-missing training columns are rejected by default; an explicit constant policy retains width. "}<code>{"SimpleImputer(keep_empty_features=True)"}</code>{" is an ordinary route with its own empty-column semantics. We compare supported observed-column median behavior, rather than pretending every constant policy is identical."}</Prose>

<Prose>{""}<strong>{"masked_simple_imputation.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/masked_simple_imputation.py"}>masked_simple_imputation.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/masked_simple_imputation.py"} filename={"masked_simple_imputation.py"} language="python" title={"masked_simple_imputation.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/masked_simple_imputation.stdout.txt"}>masked_simple_imputation.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/masked_simple_imputation.stdout.txt"} filename={"masked_simple_imputation.stdout.txt"} language="output" title={"Recorded stdout · masked_simple_imputation.stdout.txt"} />

<Prose>{""}<code>{"fit_mixed"}</code>{" is also the complete supported successor for the indicator/robust modification introduced later with the retained P1. It does not import or run P1's top-level example. Its three stages fit fills, fit a standard or robust numeric ruler on the filled training matrix, then save category order. "}<code>{"mixed_transform"}</code>{" appends the original mask "}<strong>{"after"}</strong>{" the numeric and category coordinates. MissingIndicator(features='all', error_on_new=False) supplies the same fixed-width indicator branch. SimpleImputer(add_indicator=True) instead includes only columns missing during fitting; a newly missing column can therefore lack its own indicator. The printed widths make that difference concrete."}</Prose>

<H3>{"Borrow only from rows that can donate this target"}</H3>

<Prose>{"For local conditional information, compare the constructed query Q=[2,12,NA] with three donors. Look first at which coordinates can be compared."}</Prose>

<PreparationFigure id="D15" />

<NeuralTable caption={"Borrow only from rows that can donate this target"} headers={[<>{"Row"}</>,<>{"a"}</>,<>{"b"}</>,<>{"c"}</>]} rows={[[<>{"Q"}</>,<>{"2"}</>,<>{"12"}</>,<>{"NA"}</>],[<>{"D1"}</>,<>{"1"}</>,<>{"10"}</>,<>{"100"}</>],[<>{"D2"}</>,<>{"3"}</>,<>{"NA"}</>,<>{"300"}</>],[<>{"D3"}</>,<>{"NA"}</>,<>{"14"}</>,<>{"500"}</>]]} />

<Prose>{"Q and D1 overlap on a,b; Q and D2 only a; Q and D3 only b. The target c is missing in Q, so none of the donors' c values enter a Q-to-donor distance. Having a defined distance and observing the requested target are separate requirements."}</Prose>

<Prose>{"Draw the overlap counts and adjusted squared differences before ranking lengths."}</Prose>

<PreparationFigure id="D16" />

<Prose>{"For total width d and q jointly observed coordinates, the nan-aware squared distance is "}<code>{"(d/q) Σshared Δ²"}</code>{". Here d=3. D1 gives (3/2)(1+4)=7.5; D2 gives 3(1)=3; D3 gives 3(4)=12. The distances are their square roots, not 7.5,3,12 drawn as Euclidean lengths. D1, D2 and D3 keep separate labelled lanes on the same distance scale; ties align horizontally without merging identities. Amber rings mark selected target donors, while an absent target remains a separate eligibility flag. No overlap means an undefined distance, not zero. The factor extrapolates the average squared discrepancy across the full width; weak or selective overlap can make this a poor similarity estimate."}</Prose>

<Prose>{"Now connect only the selected target cells to the estimate."}</Prose>

<PreparationFigure id="D17" />

<Prose>{"With k=2 and uniform weights, D2 and D1 supply (300+100)/2=200. Remove D2's c and it cannot donate c even though its observed a still permits a comparison; D1 and D3 now give 300. Separately, change D1's c to 140 with all original cells otherwise restored: selection stays D2,D1 and the answer becomes 220. Changing unused D3 c can be a null. If no target-eligible donor has any overlap, the fallback uses the training target's observed mean, 300 here. If the entire training target column is absent, no donor evidence supports an estimate; our default refuses it, while an explicit constant policy remains a modeling choice."}</Prose>

<PreparationInvestigation id="L5" />

<Prose>{"Select and edit one actual Q/donor input cell, including marking it absent, and vary k. Eligibility, overlap, distances, selected c cells and result update together. Start at 200; inspect the 300 and 220 contrasts and the no-overlap fallback. Stable source-index ties are our custom policy. sklearn need not select the same tied subset; compare untied cases or aggregates invariant to the tie."}</Prose>

<Prose>{"For multiple missing query features, compute distances from the "}<strong>{"original"}</strong>{" query once. Filling c must not silently make c available when selecting donors for another target. This differs from iterative conditional completion, which deliberately uses current filled predictors and will receive its own algorithm. Read the full target-specific selection loop below."}</Prose>

<Prose>{""}<strong>{"nan_aware_donors.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/nan_aware_donors.py"}>nan_aware_donors.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/nan_aware_donors.py"} filename={"nan_aware_donors.py"} language="python" title={"nan_aware_donors.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/nan_aware_donors.stdout.txt"}>nan_aware_donors.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/nan_aware_donors.stdout.txt"} filename={"nan_aware_donors.stdout.txt"} language="output" title={"Recorded stdout · nan_aware_donors.stdout.txt"} />

<Prose>{"The state keeps copies of training donors, observed means and counts. For each query, the shared mask creates one distance vector. For each missing target, it filters eligible target-observed rows, stably orders them and chooses up to k defined distances. Uniform means and normalized inverse-distance weights are separate choices; when exact-zero donors occur, distance weighting shares mass among exact matches, avoiding division by zero. Observed query cells remain unchanged. Distance work is O(qnd) for q query rows; full donor sorting costs O(n log n) per missing target in this transparent reference. Reusing the distance vector saves repeated coordinate arithmetic, but does not make a wide incomplete table free."}</Prose>

<Prose>{"Iterative completion can use broader feature relationships. For a first conceptual turn, if complete cases follow mass=100×length, observed length 3 can suggest missing mass 300. That is a fitted conditional estimate, not a measurement. When another row lacks length, a later model may use currently filled mass. Section 9 builds and saves this sequence rather than leaving the mechanism inside an unexplained estimator."}</Prose>

<H2>{"5. Learn the preparation rule without looking ahead"}</H2>

<H3>{"Fit and transform have different information"}</H3>

<Prose>{"Fit learns state: medians, centers, scales, vocabulary or parameters. Transform applies that state to new inputs. A query must not redefine its own ruler. If training endpoints are 1 and 100, later 150 maps to 149/99; fitting again on the later batch changes the question."}</Prose>

<Prose>{"Switch to P1's "}<strong>{"four-row constructed example with three numeric features"}</strong>{", not the penguin experiment's four. Follow each training column into its saved arrays."}</Prose>

<PreparationFigure id="D18" />

<Prose>{"The training numeric rows are [10,100,7], [20,NA,7], [30,300,7], [NA,500,7]. Medians are [20,300,7]. After filling, means are [20,300,7] and population scales [√50,√20000,1], with 1 replacing the third column's zero spread. Categories b,a,missing,a give sorted columns a,b,not_recorded. These arrays, not the later batch, determine subsequent coordinates."}</Prose>

<Prose>{"Join the actual numeric and categorical cells in their invariant order."}</Prose>

<PreparationFigure id="D19" />

<Prose>{"P1 outputs three numeric plus three one-hot coordinates: width "}<strong>{"6"}</strong>{". The later real penguin pipeline has four numeric plus three one-hot coordinates: width "}<strong>{"7"}</strong>{". This switch is explicit. The target remains separate in both. In a Pipeline, steps in one branch run sequentially; ColumnTransformer runs designated column branches and concatenates their outputs in the declared order. Output names are part of the schema, not decoration."}</Prose>

<Prose>{"The retained complete P1 below constructs the state with NumPy, then fits SimpleImputer, StandardScaler and OneHotEncoder on the same inputs to compare supported behavior. Its exact source and recorded stdout are preserved from the historical execution; this content revision did not replay its main. The scratch policy rejects all-missing training numeric columns and reserves "}<code>{"not_recorded"}</code>{" for absence. That is a bounded teaching policy, not general equivalence to every library configuration."}</Prose>

<Prose>{""}<strong>{"fitted_preparation.py — historical retained native receipt."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_preparation.py"}>fitted_preparation.py — exact retained whole historical programme; no replay</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_preparation.py"} filename={"fitted_preparation.py"} language="python" title={"fitted_preparation.py"} />

<Prose>{"Whole recorded stdout (exact historical stdout literal):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_preparation.stdout.txt"}>fitted_preparation.stdout.txt — exact historical stdout literal</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_preparation.stdout.txt"} filename={"fitted_preparation.stdout.txt"} language="output" title={"Recorded stdout · fitted_preparation.stdout.txt"} />

<Prose>{""}<code>{"inputs"}</code>{" checks row/column form and one category per row. "}<code>{"np.where"}</code>{" fills only NaNs, broadcasting the three saved medians across rows. Means/scales broadcast the same way at transform. Comparing each category against vocabulary positions creates one-hot membership; "}<code>{"column_stack"}</code>{" places the numeric block before it. The first query [25,NA,9],unknown becomes approximately [.707107,0,2,0,0,0]. Missing numeric feature two is filled with its fitted median and becomes zero here. Constant-training feature three later 9 becomes 2. The unknown category gets zeros; a missing category instead uses not_recorded. The second query's edited measurement 1000 changes its coordinate to about 4.949747 while state and the other row stay fixed."}</Prose>

<Prose>{"Keep a boundary around the rows allowed to fit those arrays; the query has no backward path."}</Prose>

<PreparationFigure id="D20" />

<Prose>{"Split before learning preparation. Unsupervised summaries can leak held-out feature distribution even without labels. Fit the preprocessing and predictor using training rows; transform the held-out inputs and compare predictions with held-out outcomes afterward. In a validation fold, that boundary is repeated with a fresh fitting state for the fold's training rows. This local explanation needs only a held-out subset; the next lesson owns complete selection, inner/outer assessment and refit procedures."}</Prose>

<PreparationInvestigation id="L6" />

<Prose>{"Edit one numeric query cell with the P1 state pinned. Its output coordinate changes or uses the stored median; every fitted array remains unchanged. Change third-feature 7 to 9 and see 2. Reset restores the query, selection and current output together. A no-refit invariant is something to inspect, not a badge automatically earned by using a Pipeline."}</Prose>

<Prose>{"The complete P4 preparation combines numeric coordinates, category coordinates and the original missing-value mask, with standard or robust scaling. For [15,500,NA],b, standard numeric coordinates are [−1/√2,√2,0], category block [0,1,0], original mask [0,0,1]. Its nine-coordinate result is approximately [−.707107,1.414214,0,0,1,0,0,0,1]. Robust state uses the filled training medians and linear IQR, with constant spread replaced by 1. The source and ordinary comparisons are already fully shown in section 4; practice changes its input rather than asking you to invent hidden helpers."}</Prose>

<Prose>{"Pipeline packages the boundary but does not repair a target-revealing feature, related subjects split on both sides, or a transformer manually fitted on all rows beforehand. TargetEncoder also has a deliberate training exception: fit_transform creates cross-fitted codes, whereas fit then transform creates full-fit codes. Section 8 teaches why the two representations differ."}</Prose>

<H2>{"6. A complete experiment on real penguin measurements"}</H2>

<Prose>{"Return now to the real Palmer Penguins file. It contains 344 observations; the supplied four measurements each have two missing rows, and recorded sex has eleven. Bill length/depth and flipper length are millimeters, mass grams. We select these four measurements plus sex and predict Adelie, Chinstrap or Gentoo. The data were collected for ecological research; this classification exercise does not establish performance for every future population or collection protocol."}</Prose>

<Prose>{"Inspect the preserved partition and correct counts on a common zero-based axis."}</Prose>

<PreparationFigure id="D21" />

<Prose>{"The retained stratified seed-20 split has 258 training and 86 assessment rows. Each classifier uses five neighbors, identical categorical preparation and the same indices. The only comparison choice is the numerical ruler after median fill. The training majority baseline gets 38/86 correct. Raw numeric coordinates get 67, standard 84, min–max 85, robust 85. An extra correct case does not identify a generally superior scaler. Repeatedly choosing from this held-out result makes it development evidence rather than fresh assessment; the next lesson formalizes a better selection protocol."}</Prose>

<Prose>{"This exact full program and stdout are retained from the September 21 native receipt (NumPy 2.3.5, pandas 3.0.1, scikit-learn 1.9.1, Python 3.12 route). They have "}<strong>{"not"}</strong>{" been rerun for this content revision. Keep "}<a href={"/learn-assets/feature-preparation-private/penguins.csv"}>{"the complete CC0 penguins.csv data"}</a>{" beside the file. "}<a href={"/learn-assets/feature-preparation-private/calculated-inputs.json"}>{"Saved split, fitted arrays, predictions and transformed rows"}</a>{" let you inspect the retained result; "}<a href={"/learn-assets/feature-preparation-private/scaling-native.json"}>{"the historical source/stdout receipt"}</a>{" records its original execution. The exact historical LF execution-input identity and current CRLF download identity are both explained below."}</Prose>

<Prose>{""}<strong>{"penguins_prepare.py — historical retained native receipt."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/penguins_prepare.py"}>penguins_prepare.py — exact retained whole historical programme; no replay</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/penguins_prepare.py"} filename={"penguins_prepare.py"} language="python" title={"penguins_prepare.py"} />

<Prose>{"Whole recorded stdout (exact historical stdout literal):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/penguins_prepare.stdout.txt"}>penguins_prepare.stdout.txt — exact historical stdout literal</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/penguins_prepare.stdout.txt"} filename={"penguins_prepare.stdout.txt"} language="output" title={"Recorded stdout · penguins_prepare.stdout.txt"} />

<Prose>{""}<code>{"train_test_split"}</code>{" returns source positions, stratifying by species. Numeric and categorical names select X; y is separate. "}<code>{"make_model"}</code>{" constructs new fitted objects for each comparison. Numeric Pipeline fills and then scales; categorical Pipeline inserts a reserved marker and then one-hot encodes. ColumnTransformer joins their outputs. The outer Pipeline applies fitted preparation before KNeighborsClassifier. "}<code>{"fit(X.iloc[train], y.iloc[train])"}</code>{" is the only fitting route. "}<code>{"predict(X.iloc[test])"}</code>{" applies saved state. “passthrough” leaves numeric units unchanged but retains median fill. DummyClassifier learns the training majority; it does not read the held-out class counts to choose its answer."}</Prose>

<Prose>{"Follow the actual source row 309 through frozen statistics into all seven coordinates."}</Prose>

<PreparationFigure id="D22" />

<Prose>{"The numeric medians are [45,17.3,197,4000]. Training means after fill are approximately [43.9306,17.0992,200.6589,4190.9884]; scales [5.4000,1.9387,14.2307,806.6876]. Row 309's observed [51,18.8,203,4100] becomes approximately [1.3091,.8773,.1645,−.1128]. The ordered categorical block is female,male,not_recorded, giving [0,1,0]. A negative mass coordinate means below the training mean, not negative physical mass."}</Prose>

<PreparationInvestigation id="L7" />

<Prose>{"Inspect a retained row or alter an independent copy, with fitted state fixed. Erasing row 309's mass supplies median 4000 and computes "}<code>{"(4000−4190.988372093023)/806.6875829303058≈−.2368"}</code>{"; other coordinates stay unchanged. Editing sex affects the category block. A present unknown string maps all-zero under the saved policy; missing uses not_recorded. These are input inspection operations, not newly trained predictions or updated accuracy. All 86 retained transformed rows and predictions remain available in the data attachment."}</Prose>

<Prose>{"Now align source positions, split order and retained outcomes before interpreting the result's provenance."}</Prose>

<PreparationFigure id="D23" />

<Prose>{"There are two exact byte identities for one parsed observation table. The actual current downloadable file has CRLF line endings and 15586 bytes. The historical execution input has LF line endings and 15241 bytes. Replacing every CRLF with LF in the current bytes gives the exact historical SHA-256, not merely a similar-looking table. The setup/source-role index prints both full hashes. Generated predecessor provenance still advertises the LF identity; that literal is historical metadata and does not describe the current download's raw bytes. None of this asserts a new fit against the current byte file. The 344 parsed rows preserve order/values/missing cells, and the 86 transformed rows equal the retained calculated JSON without numerical replay."}</Prose>

<Prose>{"Standard scaling misclassified two rows and raw coordinates nineteen on this split. Examine actual errors, feature availability and geometry before inventing a species story. The recording process and population matter more than a tidy score. This is a controlled application showing that representation changes an estimator's evidence; it is not a leaderboard or proof that prediction-oriented fills recover scientific truth."}</Prose>

<H2>{"7. Deeper branch: change the shape, not only the ruler"}</H2>

<H3>{"Equal ratios, power families and fitted parameters"}</H3>

<Prose>{"An affine map "}<code>{"(x−a)/b"}</code>{" changes every gap by the same factor. Sometimes equal ratios should have equal influence instead. On the constructed values 1,10,100, follow equal tenfold steps into equal log differences."}</Prose>

<PreparationFigure id="D24" />

<Prose>{"Natural logs give 0, ln10 and ln100=2ln10. Each tenfold change adds ln10≈2.302585. This is useful when a multiplicative concentration change is the meaningful comparison. It does not justify logging an arbitrary signed measurement. log x requires x>0; log1p x means log(1+x), with a different domain x>−1 and a different offset."}</Prose>

<Prose>{"Box–Cox supplies a family: for x>0, "}<code>{"gλ(x)=(x^λ−1)/λ"}</code>{" when λ≠0 and log x when λ=0. Why this log limit? Write x^λ=exp(λlog x); "}<code>{"(exp(t)−1)/t→1"}</code>{" as t→0. Multiplying by log x gives the result. At λ=1, Box–Cox gives x−1, an identity "}<strong>{"up to an offset"}</strong>{", whereas the signed Yeo–Johnson family gives exactly x. The book's geometric-mean-normalized Box–Cox convention is another stated scaling; our ordinary sklearn route uses the unnormalized formula here."}</Prose>

<Prose>{"For Yeo–Johnson, see the positive and negative pieces and the active branch before doing arithmetic."}</Prose>

<PreparationFigure id="D25" />

<Prose>{"For x≥0, let v=1+x. Use "}<code>{"(v^λ−1)/λ"}</code>{", or log v at λ=0. For x<0, let u=1−x>1. Use "}<code>{"−(u^(2−λ)−1)/(2−λ)"}</code>{", or −log u at λ=2. The reflected negative branch joins at zero and uses exponent 2−λ. Thus x=−3 gives −7.5 at λ=0, −3 at λ=1, and −ln4≈−1.386294 at λ=2. Positive 3 at λ=1 gives 3 as well. “Negative inputs use a square root” misses the parameter dependence entirely."}</Prose>

<PreparationInvestigation id="L8" />

<Prose>{"Begin at Yeo–Johnson x=−3, λ=2 with the logarithmic negative branch visible. Change x and λ to see the expression and coordinate move together. Box–Cox nonpositive x is a domain refusal, not a point to clamp into the plot. Near λ=0 or 2, "}<code>{"expm1"}</code>{" computes exp(t)−1 accurately without subtracting nearly equal floating-point numbers. "}<code>{"log1p"}</code>{" similarly computes log(1+t). Manually selecting λ is an exploration; it must not be labeled a learned parameter."}</Prose>

<Prose>{"Fitting λ is a separate operation. Suppose a transformed scalar feature is approximated by a normal distribution with its mean and variance estimated at each λ. The normal log density, maximized over mean/variance, contributes "}<code>{"−n log(vλ)/2"}</code>{" up to constants, where vλ is the transformed "}<strong>{"population"}</strong>{" variance. But transformed densities must be measured in the original x units. The derivative g′ supplies a change-of-variables Jacobian; summing log|g′(xᵢ)| adds another term. Without it, shrinking all transformed numbers can falsely look like a better fit just by changing units."}</Prose>

<Prose>{"Inspect both terms over a finite constructed training column and mark the selected λ on the computed curve."}</Prose>

<PreparationFigure id="D26" />

<Prose>{"For positive Box–Cox data,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\ell(\\lambda)=-\\frac n2\\log v_\\lambda+(\\lambda-1)\\sum_i\\log x_i."}</MathBlock></div>

<Prose>{"For Yeo–Johnson, replace the sum of logs by "}<code>{"Σ sign(xᵢ) log(1+|xᵢ|)"}</code>{" in the Jacobian term. Positive branch derivative is (1+x)^(λ−1); negative branch derivative is (1−x)^(1−λ), giving that sign. Zero variance is degenerate: it is not an infinitely successful normalizing fit. Fit only on training observations, save λ, then optionally fit a separate affine standardization on those transformed training values."}</Prose>

<Prose>{"The complete program implements forward/inverse families, objective terms and a bounded scalar search. SciPy's optimizer is a declared numerical primitive; it does not implement the owned transform or likelihood for us. Candidate endpoints are explicitly compared. State records name, bounds, selected λ, objective, evaluation count and whether the selection is interior, boundary or capped. A bounded local search is not a universal global optimum theorem. A boundary result is information that the specified search range mattered."}</Prose>

<Prose>{""}<strong>{"fitted_power_maps.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_power_maps.py"}>fitted_power_maps.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_power_maps.py"} filename={"fitted_power_maps.py"} language="python" title={"fitted_power_maps.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_power_maps.stdout.txt"}>fitted_power_maps.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_power_maps.stdout.txt"} filename={"fitted_power_maps.stdout.txt"} language="output" title={"Recorded stdout · fitted_power_maps.stdout.txt"} />

<Prose>{"Read the inverse algebra alongside the code. For a nonzero exponent p, y=(v^p−1)/p implies "}<code>{"log v=log1p(py)/p"}</code>{", requiring 1+py>0. This holds for either sign of p. In the zero-power limit log v=y. Undo the Yeo–Johnson sign/shift after recovering v or u. Box–Cox uses exp rather than expm1 because its original variable is v itself; Yeo–Johnson removes the added 1. The saved center/scale are undone before the family inverse."}</Prose>

<Prose>{"The bounded Box–Cox fixture [1,2,4,10,30] selects about −.146859; the signed fixture [−3,−1,0,2,8] selects about .596210. These are small constructed fits, not ecology experiments. Same-λ comparison against the ordinary family and PowerTransformer verifies formulas, while attained likelihood and actual learned λ expose differences between bounded and library search. Do not assume every dataset's optima match. PowerTransformer standardizes by default; this code requests standardize=False for a clear family comparison. Work is O(n) per scalar objective evaluation, plus the search's evaluations. Domains, overflows and unsupported constant fits are refused. Better marginal shape does not guarantee jointly Gaussian features, correct regression residuals or better prediction."}</Prose>

<H3>{"A fitted quantile map is not a new-batch rank"}</H3>

<Prose>{"An illustrative rank map for sorted [1,2,3,4,100] uses "}<code>{"(rank−1)/4"}</code>{", giving 0,.25,.5,.75,1. It forgets the large final numerical gap. That old illustration explains rank; it is not the exact fitted QuantileTransformer algorithm, particularly with ties and unseen values."}</Prose>

<Prose>{"Switch to fitted value landmarks [1,2,2,4,100] and probabilities [0,.25,.5,.75,1]. Follow interpolation from a later value to its probability and, optionally, to a normal quantile."}</Prose>

<PreparationFigure id="D27" />

<Prose>{"At a repeated landmark 2, ascending interpolation picks one edge of the tie interval and descending interpolation the other. Averaging gives (.25+.5)/2=.375. At 3, the interval from the last 2 at .5 to 4 at .75 gives .625. Below the fitted extent maps to 0, above to 1. Changing a later batch cannot recompute these landmarks; 3 alone and 3 beside 10000 must get the same coordinate."}</Prose>

<Prose>{"Uniform output uses u directly. Normal output uses Φ⁻¹(u), the number below which a standard normal distribution places probability u. At u=.375 and .625, coordinates are about −.318639 and .318639. Since Φ⁻¹(0/1) is infinite, our explicitly declared finite clipping epsilon is 10⁻⁷; endpoints are about ±5.199338. This is a coordinate convention, not evidence for a normal scientific data-generating process."}</Prose>

<PreparationInvestigation id="L9" />

<Prose>{"Change only the query, keeping landmarks visible. A query 1000 saturates at the upper endpoint. Many large values therefore merge. A duplicate 2 always receives the same tie result. Query edits never refit. Normal output changes numerical spacing again but preserves the declared ordering away from merged points."}</Prose>

<Prose>{"The complete program saves column names, reference probabilities and fitted landmarks, skips NaNs during fit and preserves them in transformation. It implements both interpolation directions and the inverse's limited return to fitted value space. Exact inversion is impossible after saturation or merged ties. Its custom constant-column convention is 0 below c, .5 at c, 1 above c. Actual sklearn 1.9.1 maps the constant c itself to 0 in the checked uniform case, so the two policies are printed separately. Its normal endpoint source also uses 10⁻⁷ minus spacing(1) and a boundary tolerance; we compare supported interior values, not claim bit-level endpoint identity."}</Prose>

<Prose>{""}<strong>{"fitted_quantile_maps.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_quantile_maps.py"}>fitted_quantile_maps.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_quantile_maps.py"} filename={"fitted_quantile_maps.py"} language="python" title={"fitted_quantile_maps.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_quantile_maps.stdout.txt"}>fitted_quantile_maps.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_quantile_maps.stdout.txt"} filename={"fitted_quantile_maps.stdout.txt"} language="output" title={"Recorded stdout · fitted_quantile_maps.stdout.txt"} />

<Prose>{"QuantileTransformer(n_quantiles=5, subsample=None, random_state=20) makes the ordinary landmark choice explicit. Subsampling can change fitted landmarks, so it must be part of a reproducibility statement. Sorting costs O(dn log n), and interpolation about O(qd log k) for q queries and k landmarks. This nonlinear marginal map can alter correlations and remove useful magnitude. A pleasant histogram is not a sufficient selection criterion."}</Prose>

<H3>{"Add boundaries and interactions deliberately"}</H3>

<Prose>{"Bins replace a measurement by an interval. Look at actual training points and the fitted edges before inspecting the one-hot interval coordinate."}</Prose>

<PreparationFigure id="D28" />

<Prose>{"Uniform four-bin edges for [1,2,2,4,100] are [1,25.75,50.5,75.25,100]. Linear-quantile requested edges are [1,2,2,4,100]; merging duplicate edges leaves [1,2,4,100], only three effective bins. Equal requested counts do not guarantee equal populations when ties cannot be split by a value boundary. Our membership uses right insertion at an interior edge: x=2 enters the interval beginning at 2. Outside the fitted range stays in the first/last bin. A coordinate for a bin is not a continuous value within it; distinctions are intentionally lost."}</Prose>

<Prose>{"K-means bins add a fitted-center mechanism. Assign each value to its nearest supplied center, update each nonempty cluster to its mean, repeat to a cap/tolerance, sort distinct final centers and form midpoint boundaries. The full local one-dimensional Lloyd loop declares earlier-center ties and retains an empty center. Invalid outer partitions from exceptional retained empty centers are refused. With [0,1,2,8,9,10] and initial centers [0,10], the first update gives [1,9], the next is unchanged, and the midpoint edge is 5. KMeans with an explicit (k,1) center array, n_init=1 and algorithm='lloyd' is the controlled comparator. KBinsDiscretizer(strategy='kmeans') is a separate route; it accepts neither init nor n_init and owns its own initialization. Stopping and empty-cluster rules can differ, so this supported match is not universal parity."}</Prose>

<Prose>{"Polynomial features retain numbers and add products. Trace each exponent column from the constructed row (a,b)=(2,3)."}</Prose>

<PreparationFigure id="D29" />

<Prose>{"Degree two with bias gives [1,a,b,a²,ab,b²]=[1,2,3,4,6,9]. The exponent rows are (0,0),(1,0),(0,1),(2,0),(1,1),(0,2). A coefficient multiplying ab makes one variable's influence depend on the other. A model is still linear "}<strong>{"in its coefficients"}</strong>{", though nonlinear in original measurements. Interaction-only omits a²/b² and keeps [1,2,3,6]. Adding a bias feature beside a model intercept duplicates a constant column. With d variables, total-degree-p features including bias number C(d+p,p); width and conditioning can grow quickly. The complete implementation bounds degree/width before allocation and refuses overflowing products."}</Prose>

<Prose>{"The following program separately owns fitted bins, Lloyd updates, monomial generation and the stateless cycle function used shortly. Keeping functions separate makes their different state contracts visible. Ordinary KBinsDiscretizer specifies quantile_method='linear' and subsample=None, avoiding the version 1.9 default percentile change. PolynomialFeatures exposes powers_ so output order is checked directly."}</Prose>

<Prose>{""}<strong>{"bins_polynomials_cycles.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/bins_polynomials_cycles.py"}>bins_polynomials_cycles.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/bins_polynomials_cycles.py"} filename={"bins_polynomials_cycles.py"} language="python" title={"bins_polynomials_cycles.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/bins_polynomials_cycles.stdout.txt"}>bins_polynomials_cycles.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/bins_polynomials_cycles.stdout.txt"} filename={"bins_polynomials_cycles.stdout.txt"} language="output" title={"Recorded stdout · bins_polynomials_cycles.stdout.txt"} />

<Prose>{"Separate actual stderr diagnostic:"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/bins_polynomials_cycles.stderr.txt"}>bins_polynomials_cycles.stderr.txt — exact actual diagnostic, separate from stdout</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/bins_polynomials_cycles.stderr.txt"} filename={"bins_polynomials_cycles.stderr.txt"} language="output" title={"Recorded stderr · bins_polynomials_cycles.stderr.txt"} />

<Prose>{"Inspect the retained warning about quantile bins too narrow to keep; it is the ordinary route documenting the merged-edge condition, not a failed calculation. Bin fitting uses O(n) reductions or sorting for quantiles; membership searches edges. Each Lloyd iteration compares n×k distances then reduces clusters, bounded by the recorded cap. Monomial evaluation costs proportional to output cells and exponent work; its combinatorial width is a modeling and storage choice. Capacity settings need training-only selection, not after-the-fact tuning on assessment outcomes."}</Prose>

<H3>{"Draw the local basis before fitting a curve"}</H3>

<Prose>{"A spline basis supplies local overlapping functions. Coefficients combine them into a curve; choosing the basis does not itself estimate those coefficients. Start with degree-zero interval indicators, then watch adjacent pieces combine at degree one."}</Prose>

<PreparationFigure id="D30" />

<Prose>{"For full nondecreasing knots t₀,…,tₖ, define Bᵢ,0(x)=1 on [tᵢ,tᵢ₊₁), 0 otherwise. A higher-degree basis is"}</Prose>

<div className="neural-equation"><MathBlock>{"B_{i,p}(x)=\\frac{x-t_i}{t_{i+p}-t_i}B_{i,p-1}(x)\n +\\frac{t_{i+p+1}-x}{t_{i+p+1}-t_{i+1}}B_{i+1,p-1}(x)."}</MathBlock></div>

<Prose>{"A zero-width denominator contributes zero. This recurrence blends neighboring supported pieces; outside a piece's knot support its contribution is zero. Degree one makes triangles, degree two smoother pieces. For degree one and extended knots [−1,0,1,2,3], the supported base interval is [0,2]. At x=.5, the row is [.5,.5,0]; at x=2, [0,0,1]. Given coefficients [2,4,1], the first prediction is .5×2+.5×4=3 and the endpoint prediction 1. Nonnegative basis rows sum to one inside the supported interval, so a constant coefficient vector produces a constant function. Only nearby bases are active: this gives the design matrix its banded pattern and lets a coefficient change affect a local part of the curve."}</Prose>

<Prose>{"The base knots [0,1,2] differ from the extended full knot vector. Our saved state extends each end by degree times the adjacent spacing, matching the inspected ordinary nonperiodic convention. A right endpoint uses its interior limiting value; the linear extrapolation derivative there is the "}<strong>{"left"}</strong>{" derivative. For degree one, using the outside derivative would choose the wrong piece at a knot. Constant extrapolation uses the nearest boundary basis row; error policy refuses outside values; linear policy continues with that interior derivative. Beyond the fitted interval, linearly extrapolated basis entries can be negative, so interior nonnegativity should not be advertised there."}</Prose>

<Prose>{""}<strong>{"local_spline_basis.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/local_spline_basis.py"}>local_spline_basis.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/local_spline_basis.py"} filename={"local_spline_basis.py"} language="python" title={"local_spline_basis.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/local_spline_basis.stdout.txt"}>local_spline_basis.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/local_spline_basis.stdout.txt"} filename={"local_spline_basis.stdout.txt"} language="output" title={"Recorded stdout · local_spline_basis.stdout.txt"} />

<Prose>{"The program implements the complete recurrence, knot fitting/extension, basis design, derivative and saved extrapolation policy. NumPy provides arrays; SciPy BSpline independently compares supported rows; SplineTransformer supplies the ordinary preprocessing route with explicit knots, include_bias=True and handle_missing='error'. sklearn 1.9.1 raised a shape error for degree-zero constant extrapolation outside its interval in the first author check. The final comparison therefore checks degree-zero "}<strong>{"interior"}</strong>{" values, custom constant outside values separately, and degree-one/two outside policies. The failed source/streams remain in author evidence. A later repair fixed the custom right-boundary derivative before the final checked source. These are scoped findings, not a reason to assert all library splines are unreliable."}</Prose>

<Prose>{"Natural cubic splines impose a different boundary constraint; they are not the same as this B-spline feature API. Full basis rows already sum to one, so another intercept can create rank dependence. Dropping a basis column is a parameterization choice. The transparent recurrence uses O(qpK) work and O(qK) workspace for q values, degree p and K intermediate bases; optimized routines exploit local support. It intentionally delegates no owned recurrence to the ordinary estimator. Missing input is refused rather than equated with the all-zero feature vector."}</Prose>

<H3>{"Close a genuine cycle's seam"}</H3>

<Prose>{"A direction wraps after a full turn; elapsed duration does not. Draw both coordinates of the unit circle so the seam has a geometric meaning."}</Prose>

<PreparationFigure id="D31" />

<Prose>{"For period P, encode t as [cos(2πt/P),sin(2πt/P)]. NumPy expects radians; P=360 converts degrees. Angles 350° and 10° become approximately [.984808,−.173648] and [.984808,.173648], chord distance 2sin10°≈.347296. The raw 340-degree difference was a coordinate seam. Zero and 360 coincide by design. Sine alone merges 30° and 150° at .5; cosine distinguishes +.866025 from −.866025. P10 provides the full function and FunctionTransformer comparison."}</Prose>

<PreparationInvestigation id="L10" />

<Prose>{"Move either angle and inspect both projections and chord. Try 1/359, opposite points, and the sine-only collision. Equal physical axis scales keep a circle circular. The map deliberately forgets completed cycles: that suits time of day or direction if the task is periodic, but it is wrong for elapsed hours when days of duration matter. Preserve a noncyclic magnitude coordinate when it carries required information."}</Prose>

<H2>{"8. Deeper branch: high-cardinality categories and target information"}</H2>

<H3>{"Shrink noisy category estimates"}</H3>

<Prose>{"One-hot width may grow large for many products or devices. A target encoding replaces a category by an estimate of its target behavior. For category c with n_c permitted donor targets and sum s_c, prior mean μ and smoothing α≥0, use "}<code>{"t_c=(s_c+αμ)/(n_c+α)"}</code>{" when n_c>0. For no donors use μ, including α=0; this explicit fallback avoids 0/0."}</Prose>

<Prose>{"Draw the actual target cells contributing to the category average, then their weights on a scalar segment toward the prior."}</Prose>

<PreparationFigure id="D32" />

<Prose>{"For one positive target, μ=.5 and α=2, t=(1+1)/3=2/3. Write it as "}<code>{"(n/(n+α)) category_mean + (α/(n+α)) μ"}</code>{". The singleton receives weight 1/3; a category with 100 positives receives 100/102 and a result 101/102≈.990196. More support reduces the pull to the prior. At α=0 a supported category uses its own donor mean; large α approaches μ."}</Prose>

<PreparationInvestigation id="L11a" />

<Prose>{"Change α while inspecting a singleton or the 100-row support fixture. Start at 2/3. The target counts and both weights remain visible. An absent category uses the prior. Shrinkage addresses unstable estimates, but it does "}<strong>{"not"}</strong>{" prevent a training row's answer from entering its own feature. These are different problems."}</Prose>

<H3>{"Remove the row's fold from every target path"}</H3>

<Prose>{"Without separation, an unsmoothed singleton encodes its own target exactly. Even with smoothing, its answer enters the numerator and often the prior. A downstream model can then learn an answer-containing input it will not have for a genuinely new row."}</Prose>

<Prose>{"Switch to the retained constructed six rows. Follow all target-to-prior edges, not only the matching-category edge."}</Prose>

<PreparationFigure id="D33" />

<NeuralTable caption={"Remove the row's fold from every target path"} headers={[<>{"Row"}</>,<>{"Category"}</>,<>{"Target"}</>,<>{"Fold"}</>,<>{"OOF value, α=2"}</>]} rows={[[<>{"0"}</>,<>{"A"}</>,<>{"1"}</>,<>{"0"}</>,<>{"5/9"}</>],[<>{"1"}</>,<>{"A"}</>,<>{"1"}</>,<>{"1"}</>,<>{"7/9"}</>],[<>{"2"}</>,<>{"B"}</>,<>{"0"}</>,<>{"0"}</>,<>{"2/9"}</>],[<>{"3"}</>,<>{"B"}</>,<>{"0"}</>,<>{"1"}</>,<>{"4/9"}</>],[<>{"4"}</>,<>{"C"}</>,<>{"1"}</>,<>{"0"}</>,<>{"2/9"}</>],[<>{"5"}</>,<>{"C"}</>,<>{"0"}</>,<>{"1"}</>,<>{"7/9"}</>]]} />

<Prose>{"For held fold 0, donors are rows 1,3,5 with targets [1,0,0], giving μ=1/3. Row 0's A numerator uses target 1 from row 1 and 2μ=2/3; divide by 1+2 to get 5/9. For fold 1, donors 0,2,4 give μ=2/3, hence row 1 gets 7/9. All donor targets enter the prior, even categories that do not match. Computing a global μ before splitting would leave a leakage path around the category exclusion."}</Prose>

<Prose>{"Change row 0's own target 1→0. Fold-0 encodings stay unchanged. Fold-1 values become [2/9,2/9,5/9]; B changed even though no B target changed, through μ. The exact retained historical program below computes this default α=2 example and its recorded stdout. It remains unchanged and was not replayed here. Its minimal callable is not a robust arbitrary-input API: α=0 with no matching-category donors can divide by zero, and empty donor sets are not validated. The new P9 below is the separately named supported successor."}</Prose>

<Prose>{""}<strong>{"cross_fit.py — historical retained native receipt."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/cross_fit.py"}>cross_fit.py — exact retained whole historical programme; no replay</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/cross_fit.py"} filename={"cross_fit.py"} language="python" title={"cross_fit.py"} />

<Prose>{"Whole recorded stdout (exact historical stdout literal):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/cross_fit.stdout.txt"}>cross_fit.stdout.txt — exact historical stdout literal</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/cross_fit.stdout.txt"} filename={"cross_fit.stdout.txt"} language="output" title={"Recorded stdout · cross_fit.stdout.txt"} />

<Prose>{""}<code>{"donors = folds != held_fold"}</code>{" creates the permitted set. The prior is recomputed inside that loop; the inner category mask narrows those same donors. Reusing a target mean from all rows would change the dependency, even if many values looked similar on a small example. The printed null for row 0 tests exclusion, not absence of all statistical dependence between training features and other rows' targets."}</Prose>

<PreparationInvestigation id="L11b" />

<Prose>{"Edit one category/target/fold cell and choose an inspected row with α fixed at 2. Begin at row 0=5/9. Flip row 3's target: row 0 becomes 7/9 via the prior while row 3's own encoding remains 4/9. Flip the inspected row's own target and inspect its null. The dependency arrows, donor IDs, numerator, prior and full output array must stay synchronized. Emptying a donor fold is an error, not a displayed NaN mislabeled as a valid encoding."}</Prose>

<H3>{"Training and inference are intentionally different"}</H3>

<Prose>{"OOF means out-of-fold: each training row's feature uses a permitted other-row fit. For a later external row, use a map fitted on the "}<strong>{"whole outer training set"}</strong>{", because those targets are then available. Draw the two states and their row coverage side by side."}</Prose>

<PreparationFigure id="D34" />

<Prose>{"The six training targets reduce to sum 3/count 6, giving prior .5. Category A stores sum 2/count 2, B sum 0/count 2 and C sum 1/count 2. A genuinely external A row reads (2+2×.5)/(2+2)=.75; an unseen category reads the saved prior .5. Neither later row supplies a target or changes the map. With α=2 and the whole six-row training prior .5, full-fit A codes are .75, B .25, C .5; without smoothing (α=0), A=1, B=0, C=.5. These are different from the OOF values by design. The downstream model trains on OOF features, then sees full-fit encodings for later inference. The outer assessment targets enter neither state. TargetEncoder.fit_transform implements internal cross-fitting; fit(...).transform(...) does not produce those training OOF values. Explicit target_type='continuous' prevents integer-valued regression targets being inferred as multiclass; actual multiclass encoding expands columns for classes and is a separate shape contract."}</Prose>

<Prose>{"The robust successor accepts explicit index pairs, validates nonempty disjoint donors, forbids repeated validation coverage and reports row coverage. It rebuilds sums "}<strong>{"and priors"}</strong>{" within every split. Group validation checks no group ID appears on both sides. In P9 the supplied group IDs are [0,0,1,1,2,2]. Ordinary fold0 holds rows 0,2,4 but admits rows 1,3,5, splitting every group and failing that contract. Holding all of group0 instead keeps rows 0,1 out and admits only rows 2,3,4,5. Their target sum 1/count 4 gives prior .25; A has no donor support, so its held rows read .25. These group IDs describe related observations and are not inferred from category names. Past-only validation requires max donor time < min held time. This is a local information contract; it does not select a scientifically appropriate outer split automatically."}</Prose>

<Prose>{""}<strong>{"fitted_target_encoding.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_target_encoding.py"}>fitted_target_encoding.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_target_encoding.py"} filename={"fitted_target_encoding.py"} language="python" title={"fitted_target_encoding.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/fitted_target_encoding.stdout.txt"}>fitted_target_encoding.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/fitted_target_encoding.stdout.txt"} filename={"fitted_target_encoding.stdout.txt"} language="output" title={"Recorded stdout · fitted_target_encoding.stdout.txt"} />

<Prose>{"The ordinary same-fold comparison uses TargetEncoder(smooth=2, target_type='continuous', cv=splits). sklearn 1.9.1 requires every training row in validation exactly once for that internal cv API. Ordinary expanding TimeSeriesSplit leaves the earliest warm-up observations unvalidated; passing it as though it were a full-coverage drop-in is invalid. The chronological path here instead fits an ordinary encoder manually in each past-only window, transforms that window's future rows, and returns only the aligned retained row indices, features "}<strong>{"and targets"}</strong>{". For this six-row example, rows [2,3,4,5] remain, targets [0,0,1,0], codes [1,1,.5,.5]; coverage [0,0,1,1,1,1] exposes the warm-up gap. There is no encoded placeholder trained on future targets."}</Prose>

<Prose>{"Groups and time answer different dependence questions. Group-disjoint random folds can use later times; past-only windows can include repeated subjects. If the application needs both restrictions, each permitted donor pair must satisfy both, possibly reducing support substantially. A time/group rule cannot be inferred from a category string alone. This transparent reference scans a donor column for each distinct category: aggregation takes O(nv) for n donor rows and v categories, plus category sorting, repeated across K splits. A dictionary accumulation can reduce aggregation to O(n) per split; an optimized subtraction implementation must still preserve every donor restriction, including priors. Full-fit inference state is immutable. Reserved string markers remain validated, missing is one category, and unseen values use the fitted prior even at α=0."}</Prose>

<H3>{"A fixed-width sparse map trades state for collisions"}</H3>

<Prose>{"Hashing avoids fitting a vocabulary: a deterministic map assigns a token to a bucket and optionally a sign, then sums signed counts. Inspect every contribution for a deliberately constructed map, separate from the ordinary library's mapping."}</Prose>

<PreparationFigure id="D35" />

<Prose>{"Let apple→(bucket0,+1), pear→(bucket0,−1), banana→(bucket1,+1). Counts apple3,pear1,banana2 give bucket0=3−1=2 and bucket1=2. This is sparse linear accumulation, not merely setting a binary membership flag. Opposite signs can cancel."}</Prose>

<Prose>{"Now pass two different bags through that same map."}</Prose>

<PreparationFigure id="D36" />

<Prose>{"Bag {apple:3,pear:1,banana:2} and bag {apple:2,banana:2} both give [2,2]. The original vocabulary/counts cannot be recovered from this representation alone. Increasing width changes collision pressure and model size; it does not remove the need to inspect what information the task can tolerate losing. Random signed maps have inner-product expectation results under their stated assumptions. A single small map does not prove that theorem, and signs do not eliminate every collision."}</Prose>

<PreparationInvestigation id="L12" />

<Prose>{"Edit one token count or its constructed bucket/sign, keeping signed contributions and sparse bucket sums visible. Begin with the [2,2] collision; give apple and pear equal counts to see cancellation. Editing a zero-count token's map has no effect. A supplied-map unknown token is an explicit missing mapping error. The ordinary FeatureHasher panel uses separately observed mappings; it must not pretend this hand-designed apple/pear map is MurmurHash3."}</Prose>

<Prose>{""}<strong>{"signed_feature_hashing.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/signed_feature_hashing.py"}>signed_feature_hashing.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/signed_feature_hashing.py"} filename={"signed_feature_hashing.py"} language="python" title={"signed_feature_hashing.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/signed_feature_hashing.stdout.txt"}>signed_feature_hashing.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/signed_feature_hashing.stdout.txt"} filename={"signed_feature_hashing.stdout.txt"} language="output" title={"Recorded stdout · signed_feature_hashing.stdout.txt"} />

<Prose>{"The scratch accumulator stores only touched nonzero buckets and refuses nonfinite counts, invalid signs or out-of-range buckets. Its arbitrary-string adapter explicitly uses SHA-256 bytes; the ordinary FeatureHasher uses its own mapping, whose actual single-token sparse vectors are printed. There is no fitted target information or learned vocabulary in either hashing operation. Work is O(number of input nonzeros), with sorting of touched buckets for deterministic output ordering in this reference. Output width still determines the downstream parameter/storage requirement. No speed benchmark is inferred from sparse code."}</Prose>

<H2>{"9. Deeper branch: completing data versus representing uncertainty"}</H2>

<H3>{"Fit conditional relationships one column at a time"}</H3>

<Prose>{"The earlier length-to-mass example described one turn. Now build the complete cycle on a constructed incomplete two-column table. Keep the original mask beside its initialized copy."}</Prose>

<PreparationFigure id="D37" />

<Prose>{"Use rows [1,2], [2,4], [3,NA], [NA,8], [5,10]. The observed a values [1,2,3,5] have median 2.5; observed b values [2,4,8,10] have median 6. These fill row 2 as [3,6] and row 3 as [2.5,8], giving the initialized matrix [[1,2],[2,4],[3,6],[2.5,8],[5,10]]. Observed cells remain measurements; initialized cells retain their missing marker. Select column a as the first conditional target. Only rows 0,1,2,4 observed a; their b predictors include the current estimated 6 in row 2. A row may fit this conditional regression only if its target a was originally observed; its predictors may contain current estimates."}</Prose>

<Prose>{"Draw the actual design, target, coefficients and product for this turn before advancing to b."}</Prose>

<PreparationFigure id="D38" />

<Prose>{"For a from b, the first predictor column is [2,4,6,10], targets [1,2,3,5]. Fit "}<code>{"Σ(y−intercept−Aβ)²+α||β||²"}</code>{" with α=1 and an unpenalized intercept. Center A and y, append √α times the identity below centered A and zeros below centered y, then solve least squares. This augmented system minimizes the same ridge objective without explicitly forming an inverse. Restore intercept=ymean−Amean·β. The coefficient is about .4861111111 and intercept .0763888889, so missing row-3 a at b=8 becomes 3.9652777778."}</Prose>

<Prose>{"Now fit b using its observed-target rows 0,1,3,4. Their a predictor values are [1,2,3.9652777778,5], including the "}<strong>{"newly updated"}</strong>{" a. The coefficient is about 1.8232290981 and intercept .5461393472, so missing row-2 b at a=3 becomes 6.0158266415. Feeding stale initialized a=2.5 into this second regression would fit a different model. Conditional cycling deliberately reuses current estimates, unlike P5's original-query distance rule."}</Prose>

<Prose>{"After a sweep, repeat the ordered column loop. Stop at a declared tolerance or cap. Our tolerance compares the maximum row sum of absolute changes with tol times the largest absolute observed input, matching the configured ordinary criterion. A cap is not convergence. The three-sweep fixture ends at a cap with last change about .00013875; the ordinary warning is printed rather than suppressed as success."}</Prose>

<Prose>{"Draw the ordered fitted models that a new row will actually use."}</Prose>

<PreparationFigure id="D39" />

<Prose>{"Save each conditional model's target index, other-feature indices, coefficient and intercept "}<strong>{"in order for every turn"}</strong>{". A later row starts from the training medians, keeps its own original missing mask, then applies that saved sequence only to its missing cells. It does not fit regressions on the query. Observed values are preserved even if a conditional predictor would suggest another number. Repeated deterministic transformation gives the same result. A row with all inputs missing is numerically transformable under the saved model but supported only by its assumptions and initial training summaries; do not call it rich new evidence."}</Prose>

<PreparationInvestigation id="L13" />

<Prose>{"Inspect the initialized state and the first turn immediately. Change one missing input cell and step through the recomputed bounded trace. Keep observed-target row sets, current predictors and updated cells visible. The sweep inspector changes the viewed algorithm state, not permission to reveal an answer. The adjacent new-row panel uses this same current fitted trace: all six ordered models and the fixed queries [3,NA], [NA,6] and [NA,NA] update together after a valid initialization edit. Query observations stay fixed and never refit a model. Try initializing row 2 b to −10 to change the first fit and the later all-missing query; reset restores training and inference together. An invalid draft clears both dependent views. Unsupported all-missing training columns refuse a conditional fit."}</Prose>

<Prose>{""}<strong>{"conditional_iterative_completion.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/conditional_iterative_completion.py"}>conditional_iterative_completion.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/conditional_iterative_completion.py"} filename={"conditional_iterative_completion.py"} language="python" title={"conditional_iterative_completion.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/conditional_iterative_completion.stdout.txt"}>conditional_iterative_completion.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/conditional_iterative_completion.stdout.txt"} filename={"conditional_iterative_completion.stdout.txt"} language="output" title={"Recorded stdout · conditional_iterative_completion.stdout.txt"} />

<Prose>{"This program uses NumPy's least-squares primitive for the linear solve, while owning mask, observed-target selection, ridge design, ordered updates, saved sequence and inference. The ordinary route explicitly enables experimental IterativeImputer, selects Ridge(alpha=1, solver='svd'), roman column order, median initialization, skip_complete=False and no posterior sampling. Supported fixture values and later rows match within stated tolerance. Full source/stream retains every turn's matrices and coefficients. General estimator heuristics or order choices can produce different sequences; there is no claim to clone every IterativeImputer configuration."}</Prose>

<Prose>{"For S sweeps, d targets and n rows, work is S times the sum of conditional regression costs; with dense least squares on d−1 predictors this can be substantial. State stores every fitted model used at inference. Shared numerical primitives avoid teaching an unneeded matrix inversion engine. Misspecified relationships, poor conditioning, unconverged cycles or collection shifts can give poor fills. Deterministic iteration gives a single completed table, not proper multiple imputation."}</Prose>

<H3>{"Several completions must become several analyses"}</H3>

<Prose>{"Prediction preparation asks for usable inputs. Scientific inference asks how unknown values affect an estimate and its uncertainty. Treating a single completed table as observed can hide uncertainty from missing data. Multiple imputation creates several plausible completions under an explicit model, analyzes each, then pools "}<strong>{"analysis estimates"}</strong>{", not raw table cells."}</Prose>

<Prose>{"Look at actual completed matrices sharing observed cells and carrying different hatched missing entries. Follow each table into its own estimate Qₗ and estimated variance Uₗ."}</Prose>

<PreparationFigure id="D40" />

<Prose>{"The order matters even without probability theory. If one unseen value could be completed as 0 or 2 and analysis squares it, analyzing first gives 0 and 4, average 2. Averaging the input first gives 1, whose square is 1. Pooling tables erased a nonlinear effect and all disagreement. The completion matrices in this drawing are the first three actual simulated tables from the bounded normal model developed below, paired with their own computed Q/U. They introduce the analysis sequence; their validity depends on that model's assumptions. The separate supplied Q=[9,10,11], U=[4,4,4] example next is arithmetic practice and is not attributed to these matrices. Arbitrary plausible-looking tables are not thereby proper stochastic imputations."}</Prose>

<Prose>{"First compare the three supplied estimates 9,10,11 and their variances 4,4,4. Each segment extends one standard error, √4=2, on either side of its estimate. The separate bars show within-analysis, between-analysis and finite-completion variance on a squared-unit scale."}</Prose>

<PreparationFigure id="D41" />

<Prose>{"For m≥2 scalar analyses, define Qbar=mean(Qₗ), Ubar=mean(Uₗ), B=Σ(Qₗ−Qbar)²/(m−1). The total variance rule is"}</Prose>

<div className="neural-equation"><MathBlock>{"T=\\bar U+(1+1/m)B=\\bar U+B+B/m,\n\\qquad SE=\\sqrt T."}</MathBlock></div>

<Prose>{"Uₗ is a "}<strong>{"variance"}</strong>{", in squared estimate units, not a standard error. B uses sample denominator m−1 because the finite set of completions estimates between-completion variability. The B/m term reflects finite-m simulation variation. Show these contributions on a squared-unit scale, keeping the standard-error length separate."}</Prose>

<Prose>{"For Q=[9,10,11] and U=[4,4,4], Qbar=10, Ubar=4, B=(1+0+1)/2=1, simulation=1/3 and T=16/3. SE≈2.309401, larger than √4=2. Identical Q gives B=0 while within-analysis uncertainty can remain. More completions reduce the finite-m term but cannot fix an inappropriate model."}</Prose>

<PreparationInvestigation id="L14a" />

<Prose>{"Edit one estimate or variance and see all components immediately. Changing a Q affects the mean and between component; changing a U affects within variance. Negative variance and m=1 are refusals. The given tables/analyses are instructional objects, not evidence that an arbitrary completion sampler satisfies inferential assumptions. A standard error alone does not specify a universally valid confidence interval: degrees of freedom and the complete-data/imputation model matter."}</Prose>

<Prose>{""}<strong>{"pool_scalar_analyses.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/pool_scalar_analyses.py"}>pool_scalar_analyses.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/pool_scalar_analyses.py"} filename={"pool_scalar_analyses.py"} language="python" title={"pool_scalar_analyses.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/pool_scalar_analyses.stdout.txt"}>pool_scalar_analyses.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/pool_scalar_analyses.stdout.txt"} filename={"pool_scalar_analyses.stdout.txt"} language="output" title={"Recorded stdout · pool_scalar_analyses.stdout.txt"} />

<Prose>{"The full O(m) scalar routine checks paired finite vectors and nonnegative U, computes every labeled term, and refuses invalid inputs. It does not silently use 1.96 for all intervals. Proper imputations and valid compatible complete-data analysis are conditions for using pooling inferentially, not consequences of applying this arithmetic. A predictive accuracy improvement supplies no evidence for those conditions."}</Prose>

<H3>{"A bounded stochastic model with declared assumptions"}</H3>

<Prose>{"To see what “stochastic completion” actually samples, use one scalar column [8,10,NA,12,NA]. This is constructed data under a marginal normal model with an ignorability/MCAR teaching assumption. There are no unimplemented MAR covariates. Let unknown mean μ and variance σ² have a proper normal–inverse-gamma prior: σ²∼inverse-gamma(α₀, scale β₀), and μ|σ²∼Normal(μ₀,σ²/κ₀), with positive κ₀,α₀,β₀."}</Prose>

<Prose>{"Conditioning on n observed values updates"}</Prose>

<div className="neural-equation"><MathBlock>{"\\kappa_n=\\kappa_0+n,\\quad\n\\mu_n=(\\kappa_0\\mu_0+n\\bar x)/\\kappa_n,\\quad\n\\alpha_n=\\alpha_0+n/2,"}</MathBlock></div>

<div className="neural-equation"><MathBlock>{"\\beta_n=\\beta_0+\\tfrac12\\sum(x_i-\\bar x)^2\n +\\frac{\\kappa_0n(\\bar x-\\mu_0)^2}{2\\kappa_n}."}</MathBlock></div>

<Prose>{"These terms follow by completing the square in the normal likelihood times prior. Observed variation contributes the squared-deviation term; disagreement between the prior mean and observed mean adds the last term. Mean precision combines κ₀ with n. Given μ₀=0,κ₀=1,α₀=2,β₀=2 and observed [8,10,12], n=3, xbar=10, squared deviations sum 8. Thus κn=4, μn=7.5, αn=3.5, βn=2+4+37.5=43.5. The visibly influential prior is intentional and should be examined, not hidden behind “proper.”"}</Prose>

<Prose>{"For each completion, draw σ² from the posterior inverse gamma, draw μ conditionally using σ²/κn, then draw each missing value conditionally using σ². Draws of μ/σ² represent parameter uncertainty; conditional missing draws represent remaining value uncertainty. Keep all observed cells exactly fixed. Analyze each completed mean Q and complete-data variance-of-mean U=s²/N before pooling. The normal sample variance uses N−1; N is total completed row count, distinct from the n observed values used for the posterior."}</Prose>

<Prose>{""}<strong>{"normal_completion_and_sensitivity.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/normal_completion_and_sensitivity.py"}>normal_completion_and_sensitivity.py — complete new constructed teaching programme</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/normal_completion_and_sensitivity.py"} filename={"normal_completion_and_sensitivity.py"} language="python" title={"normal_completion_and_sensitivity.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/normal_completion_and_sensitivity.stdout.txt"}>normal_completion_and_sensitivity.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/normal_completion_and_sensitivity.stdout.txt"} filename={"normal_completion_and_sensitivity.stdout.txt"} language="output" title={"Recorded stdout · normal_completion_and_sensitivity.stdout.txt"} />

<Prose>{"The program publishes posterior parameters, all five seed-20 completed tables, per-completion Q/U and pooled components. Different seed/m values show a changed realization without a large simulation campaign. The ordinary SciPy normal_inverse_gamma route receives (μn,κn,αn,βn); identical posterior parameters and conditional identities are the relevant bridge. Its actual draws happen to agree for this environment/seed, but cross-generator random sample equality is not the contract. A no-observation case needs explicit prior-only opt-in, and at least two total rows are needed for the stated complete-data variance calculation."}</Prose>

<Prose>{"A proper prior makes this model a defined posterior; it does not prove frequentist coverage of every pooled interval or justify the model for real penguin gaps. Unbounded normal draws can be unsuitable for physical nonnegative quantities. Choose a scientific model respecting the estimand and support, inspect diagnostics and assess sensitivity rather than patching negative draws into false observations."}</Prose>

<Prose>{"Now assume the missing values differ by an additive δ from this baseline completion model. Change δ while all random baseline draws and observed cells stay fixed. With two of five values missing, each completed mean moves by (2/5)δ. Seed-20 pooled means are about 7.886461,8.686461,9.486461 for δ=−2,0,2. If no values are missing, δ has no effect. This sensitivity parameter is "}<strong>{"assumed"}</strong>{", not identified from observed data; the curve shows which conclusion depends on that assumption. It does not diagnose actual MNAR."}</Prose>

<PreparationFigure id="D41b" />

<PreparationInvestigation id="L14b" />

<Prose>{"The ordinary R route below demonstrates a complete mice→with→pool workflow and scalar pooling call. It is a separately optional tool example, with source authored but R execution "}<strong>{"not claimed"}</strong>{" in this Python environment. The tiny constructed regression is instructional, not a coverage experiment; actual analysis must inspect logged events, trace behavior, model compatibility, degrees of freedom and support. Including an outcome in a scientific imputation model differs from giving unavailable deployment targets to a predictive pipeline."}</Prose>

<Prose>{""}<strong>{"multiple_imputation_mice.R — not executed."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/multiple_imputation_mice.R"}>multiple_imputation_mice.R — complete optional ordinary R source; unexecuted</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/multiple_imputation_mice.R"} filename={"multiple_imputation_mice.R"} language="r" title={"multiple_imputation_mice.R"} />

<Prose>{"R output is not supplied because execution is not claimed."}</Prose>

<Prose>{"The Python completion work is O(mN), plus each analysis, for m completions and N total rows. Saving all tables costs O(mN); streaming analyses can reduce storage if preserving complete tables is unnecessary for the teaching or audit. More sophisticated conditional/multilevel models, survey weights and a full causal identification theory belong to later specialist work. The local lesson remains: unknown values require explicit assumptions, analysis comes before pooling, and uncertainty/sensitivity are different from deterministic input preparation."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"10. Practice: explain the representation before choosing the function"}</H2>

<Prose>{"Attempt each question before opening its hint or solution. The activity IDs T1–T26 identify tasks across the core and deeper branches. Use the fitted rules, source rows and saved state from the worked examples to reason through changed inputs. Each solution explains the tempting wrong route as well as the calculation."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T1. Follow a missing measurement without erasing another fact"}</H3>

<Prose>{"Take an independent copy of source row 309, set mass to missing and sex to female. List features, target, numeric mask and the information allowed to fill the gap. Does absence in one cell make sex unknown?"}</Prose>

<details><summary>Hint</summary><Prose>{"Keep one mask bit per numeric input, separate from the target and categorical policy."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The features are [51,18.8,203,NA,female], the target remains Chinstrap in the held-out record, and numeric M=[0,0,0,1]. Sex is observed, giving the fitted female coordinate; it is neither missing nor an unseen string. The frozen training median 4000 fills mass before its saved center/scale apply. Held-out species and later input distribution may not refit those statistics. The filled coordinate is an estimate with mask 1. Treating the whole row as “missing” would discard observed information; treating species as an input would reveal the answer."}</Prose></details>

<span id="t2" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. A changed ruler"}</H3>

<Prose>{"Query "}<code>{"[0,0]"}</code>{" has candidates A "}<code>{"[2,60]"}</code>{" and B "}<code>{"[5,10]"}</code>{". Which is nearest under raw squared distance? Which is nearest with divisors "}<code>{"[1,30]"}</code>{"?"}</Prose>

<details><summary>Hint</summary><Prose>{"Calculate one contribution per feature; the divisor belongs inside the square."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Raw distances squared are 3,604 and 125, so B wins. Scaled distances squared are "}<InlineMath>{"4+4=8"}</InlineMath>{" and "}<InlineMath>{"25+1/9=25.111\\ldots"}</InlineMath>{", so A wins. The input observations are unchanged; relative feature weighting changed."}</Prose></details>

<span id="t3" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Fit once, transform later"}</H3>

<Prose>{"A training column is "}<code>{"[2,4,6]"}</code>{". Find its mean, population-style standard deviation, standardized value for a new 8, and min–max value for that 8. Should adding 8 to the later batch change the saved training statistics?"}</Prose>

<details><summary>Hint</summary><Prose>{"The training squared deviations are 4, 0, and 4."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The mean is 4 and standard deviation "}<InlineMath>{"\\sqrt{8/3}"}</InlineMath>{". The standardized new value is "}<InlineMath>{"4/\\sqrt{8/3}=\\sqrt6\\approx2.4495"}</InlineMath>{". Min–max gives "}<InlineMath>{"(8-2)/(6-2)=1.5"}</InlineMath>{". Transformation reuses the fitted statistics; refitting on later inputs would create a different map."}</Prose></details>

<span id="t4" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. What did normalization discard?"}</H3>

<Prose>{"A spectrum "}<code>{"[2,1,2]"}</code>{" and another "}<code>{"[6,3,6]"}</code>{" are L2-normalized. What are the results? Would this be appropriate if total emitted energy is the prediction signal?"}</Prose>

<details><summary>Solution</summary><Prose>{"The lengths are 3 and 9, so both map to "}<code>{"[2/3,1/3,2/3]"}</code>{". Relative shape remains, but the threefold intensity difference disappears. If total energy matters, preserve a magnitude feature or choose another representation rather than discarding it blindly."}</Prose></details>

<span id="t5" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. A category that did not exist during fitting"}</H3>

<Prose>{"A full one-hot vocabulary has "}<code>{"small"}</code>{", "}<code>{"medium"}</code>{", and "}<code>{"large"}</code>{", and an unknown value uses an all-zero block. Compare unknown-to-small distance with small-to-medium distance. What application decision is hidden behind accepting the unknown value?"}</Prose>

<details><summary>Solution</summary><Prose>{"The distances are 1 and "}<InlineMath>{"\\sqrt2"}</InlineMath>{". Ignoring unknown categories creates a representation with a specific geometry; it is not neutral. The application must decide whether a new value is valid, should trigger a review or fallback, or belongs in a deliberately learned other-category group."}</Prose></details>

<span id="t6" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Changed donors"}</H3>

<Prose>{"In the imputation table, change D2's "}<code>{"c"}</code>{" to missing. With two neighbors, what value replaces the query's missing "}<code>{"c"}</code>{"? What if D1's "}<code>{"c"}</code>{" changes from 100 to 140 while the other original cells remain unchanged?"}</Prose>

<details><summary>Hint</summary><Prose>{"First decide who can donate the target feature, then use the distances on the query's observed coordinates."}</Prose></details>

<details><summary>Solution</summary><Prose>{"With D2 ineligible, D1 and D3 supply "}<InlineMath>{"(100+500)/2=300"}</InlineMath>{". In the separate second change, the original selected donors D2 and D1 remain nearest, so the estimate becomes "}<InlineMath>{"(300+140)/2=220"}</InlineMath>{". Changing a value in the query's missing target column does not itself enter these overlap distances."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T7. Keep every original coordinate before adding recording history"}</H3>

<Prose>{"Extend the retained P1 mechanism with one indicator for every numeric input column. Transform [15,500,NaN] with category b, checking the first six coordinates, three indicators and unchanged fitted state. Then implement a "}<strong>{"distinct"}</strong>{" robust-ruler successor keeping the same fill/vocabulary. The full callable implementations are in masked_simple_imputation.py, with the complete changed-input answer function in practice_solutions.py."}</Prose>

<details><summary>Hint</summary><Prose>{"Save np.isnan(input) before filling. Fit the robust ruler on the already-filled training matrix, not on the query."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The filled row is [15,500,7]. Standard numeric coordinates are [(15−20)/√50,(500−300)/√20000,0]=[−1/√2,√2,0]. The retained category order a,b,not_recorded gives [0,1,0]; original missing indicators [0,0,1] are appended. The result has width 9 and approximately [−.707107,1.414214,0,0,1,0,0,0,1]. The filled training first column [10,20,30,20] has median 20 and linear IQR 5; second [100,300,300,500] median 300 and IQR 100; constant third uses divisor 1. Robust query coordinates are [−1,2,0], giving [−1,2,0,0,1,0,0,0,1]. Snapshot fills, centers, scales and vocabulary before transform; exact comparison afterward verifies no mutation. Recovering the mask from completed values is wrong because an observed 7 and filled 7 coincide. Fitting only missing-at-training indicators misses the new third-column absence; all-feature indicators retain its bit."}</Prose></details>

<span id="t8" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Explain a transformed real record"}</H3>

<Prose>{"For the fitted standard penguin pipeline, keep the first held-out record unchanged except set its body mass to missing. Predict that output coordinate. Does this mean the animal's true mass was 4,000 g?"}</Prose>

<details><summary>Hint</summary><Prose>{"First apply the saved median, then the saved mean and scale."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The coordinate becomes "}<InlineMath>{"(4000-4190.9883721)/806.6875829\\approx-0.2368"}</InlineMath>{". This is a numerical estimate passed to the model. It is not a recovered observation. Other coordinate values and the fitted statistics remain unchanged."}</Prose></details>

<span id="t9" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Identity is a useful transform check — deeper"}</H3>

<Prose>{"Use the Yeo–Johnson formula at "}<InlineMath>{"\\lambda=1"}</InlineMath>{" on 3 and −3. Why is a generic claim that “negative inputs use a square root” wrong?"}</Prose>

<details><summary>Solution</summary><Prose>{"For 3, "}<InlineMath>{"((3+1)^1-1)/1=3"}</InlineMath>{". For −3, "}<InlineMath>{"-((1+3)^1-1)/1=-3"}</InlineMath>{". Both branches depend on "}<InlineMath>{"\\lambda"}</InlineMath>{"; the negative exponent is "}<InlineMath>{"2-\\lambda"}</InlineMath>{", with a logarithmic limit at "}<InlineMath>{"\\lambda=2"}</InlineMath>{", not a fixed square root."}</Prose></details>

<Prose>{"For an additional changed branch in T9, evaluate x=−3 at λ=2 and λ=0."}</Prose>

<details><summary>Hint</summary><Prose>{"The negative exponent is 2−λ; identify its zero-power limit before calculating."}</Prose></details>

<details><summary>Solution</summary><Prose>{"At λ=2 the branch is −log(1−x)=−ln4. At λ=0 its exponent is 2, so −(4²−1)/2=−7.5. The λ=1 identity preserved above and these two changed cases show why a generic square-root explanation fails."}</Prose></details>

<span id="t10" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Which part of target encoding changed? — deeper"}</H3>

<Prose>{"In the six-row example, change row 3's target from 0 to 1. Calculate row 0's new encoding. Does row 3's own cross-fitted encoding change?"}</Prose>

<details><summary>Solution</summary><Prose>{"Row 0's donors are rows 1, 3, and 5, now with prior "}<InlineMath>{"2/3"}</InlineMath>{". Its A donor is still positive, so its value becomes "}<InlineMath>{"7/9"}</InlineMath>{". Row 3 belongs to held-out fold 1, whose donor targets are unchanged, so its own value remains "}<InlineMath>{"4/9"}</InlineMath>{". The first change passes through the prior; the null demonstrates excluding one's own target."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T11. Distinguish a byte identity from an experiment"}</H3>

<Prose>{"The current CSV is a 15586-byte CRLF file, while the historical receipt binds a 15241-byte LF input. What checks justify saying they contain the same observations? May we call the old experiment a fresh run against the current download?"}</Prose>

<details><summary>Hint</summary><Prose>{"Check an exact normalization relation and parsed row order; an equal data table is not a new process execution."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Replacing CRLF by LF yields the historical exact SHA-256 and size; parsing both gives all 344 identical rows, columns and NA cells in order. The newline count explains the 345-byte size difference. This establishes a source relation. It does not execute the program, refit models or refresh versions. Bind both raw identities, label the current download separately from the historical executed input, and reuse the retained output with its original date/environment. The setup metadata supplies full hashes rather than relying on abbreviated names."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T12. Equal predictions, different penalties and storage"}</H3>

<Prose>{"Compare x=[1,100], w=[1,.01] with x′=[1,1], w′=[1,1]. Compute predictions and squared coefficient norms. Center "}<code>{"[[0,0,3],[1,0,0],[0,2,0]]"}</code>{" and count nonzeros."}</Prose>

<details><summary>Hint</summary><Prose>{"Multiply coefficients by the same divisor used on each coordinate; sparse zero support is about actual entries."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Both dot products are 2. The coefficient norms squared are 1+.0001=1.0001 and 1+1=2. A fixed ridge penalty therefore changes even with equal predictions. Matrix column means are [1/3,2/3,1]; centered rows [−1/3,−2/3,2], [2/3,−2/3,−1], [−1/3,4/3,−1] all contain three nonzeros, so support grows 3→9. Scale-only sparse transformation can preserve original zeros; representing nonzero centered values as zeros would alter the data, not optimize storage."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T13. Let training counts own the rare policy"}</H3>

<Prose>{"Fit a×4,b×1,missing×1 with rare threshold 2, keeping missing separate. Transform b,new,missing,a under infrequent-if-present. What happens with only a×4 during fit? Try a real label "}<code>{"@missing"}</code>{"."}</Prose>

<details><summary>Hint</summary><Prose>{"Inspect the vocabulary, not just the vector width."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Counts are a×4,b×1,@missing×1. Fitted rare set={b}; columns sorted as @missing,@rare,a. Rows are b=[0,1,0],new=[0,1,0],missing=[1,0,0],a=[0,0,1]. With only a×4 no rare bucket exists; new becomes [0] under the declared fallback. The literal @missing as a measured category is refused by the reserved-prefix rule, preventing a collision with absence. sklearn's native min_frequency may group the missing marker because it is infrequent; use explicitly pregrouped categories for our same-policy comparison. Query labels never change the fitted counts or width."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T14. Expose forbidden query feedback"}</H3>

<Prose>{"For k=1, donors are [0,0,NA], [2,100,100], [3,0,200], query [1,NA,NA]. Fill both missing targets using original-query distances. Then deliberately feed the first fill back into the distance for the second target. Explain the difference and the tie convention."}</Prose>

<details><summary>Hint</summary><Prose>{"For the first target all donors have b, while for c the first donor is ineligible. Original overlap uses only a."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Original squared distances are3,3,12. Custom source-order tie picks donor 0 for b, giving 0. For c, donor 0 lacks c and is excluded; donor 1 is nearest, giving 100. Correct output is [1,0,100]. If completed b=0 is illegally treated as observed before choosing c, donor 1 adjusted squared distance is (3/2)(1+10000)=15001.5, donor 2 is (3/2)(4+0)=6; it gives 200. The wrong algorithm outputs [1,0,200]. P5 and the answer file compute both and assert the contrast. This does not say conditional iteration is wrong: section 9 deliberately specifies current-estimate predictors under another model. It says two algorithms cannot be silently mixed. With an all-target-missing training column our default rejects; no tie convention can invent evidence."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T15. Feature-only leakage is still a fitting dependency"}</H3>

<Prose>{"A held-out row changes the fitted quantile landmarks or determines whether a category passes the rare threshold. No targets were used. Is this safe assessment? Contrast an externally specified schema."}</Prose>

<details><summary>Hint</summary><Prose>{"Ask whether the map uses information available before the assessment row arrives."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The assessment feature distribution influenced a fitted rule. That can make the representation adapted to the examples judging it. Split first and refit landmarks/count thresholds inside each permitted training set. A category schema declared independently beforehand is different from vocabulary estimated from all assessment-inclusive rows. Pipeline helps only when it receives training-only input at fit. It cannot repair subject/time leakage, post-outcome features or manual pre-fitting outside it."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T16. Report the real result without a winner claim"}</H3>

<Prose>{"Write a deployment-facing paragraph interpreting 38,67,84,85,85 correct out of 86 under the retained controls. Name one next decision and one limitation; do not run a new campaign."}</Prose>

<details><summary>Hint</summary><Prose>{"Identify the shared split, k and category policy before differences."}</Prose></details>

<details><summary>Solution</summary><Prose>{"An acceptable report says: “On the preserved seed 20 stratified split of 344 Palmer Penguins rows, five-neighbor models shared 258 training/86 assessment indices and category fill/one-hot policy. Raw numeric inputs got 67 correct, standard 84, min–max 85 and robust 85, against training-majority 38. Scaling changed this model's useful geometry on this collection; one extra correct case does not establish a generally best scaler. We would compare proposed preprocessing inside training-only development splits and reserve separate assessment, matching future population/group/time availability. Deployment also needs schema, unknown-category and new-missingness monitoring.” Omitting the baseline, changing the objective after seeing scores or calling 85 versus 84 proof of superiority fails the report's purpose."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T17. Invert a stable power map, then refuse an invalid input"}</H3>

<Prose>{"Evaluate Box–Cox(4,λ=10⁻⁹), invert log4 at λ=0, and try Box–Cox(0,λ=0). What may a selected bound in a fitted λ search mean?"}</Prose>

<details><summary>Hint</summary><Prose>{"Use expm1(λlog4)/λ and the exact logarithmic branch."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The first value approaches ln4≈1.3862943611, with tiny finite-λ correction, rather than zero from cancellation. Inverting y=ln4 at λ=0 gives exp(y)=4. Zero violates Box–Cox's strictly positive domain, so the program raises ValueError; patching it to epsilon changes the map and dataset. A best tested boundary can indicate the search range restricted the fit; it is reported with bounds/status, not described as a global optimum. The full answer function calls the stable implementation and its inverse; same-λ ordinary comparison tests formulas separately from optimizer choices."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T18. Query landmarks and bin edges without refitting"}</H3>

<Prose>{"For fitted [1,2,2,4,100] landmarks/probabilities, transform later 3 and 1000 uniformly. Fit four requested linear-quantile bins and assign x=2. Can an inverse recover 1000?"}</Prose>

<details><summary>Hint</summary><Prose>{"Distinguish averaging tie endpoints from interpolating after the last duplicate; exact bin edges use right insertion."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The tie 2 maps(.25+.5)/2=.375. Later 3 is halfway from last 2 at.5 to 4 at.75, giving.625. Later 1000 saturates at 1. The inverse of 1 returns fitted endpoint 100, losing the original 1000. Quantile edges [1,2,2,4,100] merge to [1,2,4,100], three effective bins;2 enters bin index 1, beginning at 2. A later batch containing 1000 cannot refit those edges or references. Ties can prevent equal bin populations; preserving the requested count in a label would misdescribe the actual representation."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T19. Inspect a product, a local basis and a cyclic ambiguity"}</H3>

<Prose>{"Construct degree-two features for (2,3), calculate degree-one B-splines at.5 for full knots[−1,0,1,2,3], and compare angle30°/150° using one versus two trigonometric coordinates."}</Prose>

<details><summary>Hint</summary><Prose>{"List exponent pairs; at.5 only two neighboring triangles are active."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Exponent pairs (0,0),(1,0),(0,1),(2,0),(1,1),(0,2) give [1,2,3,4,6,9]. At.5, recurrence weights produce B0=.5,B1=.5,B2=0, row sum 1. Coefficients [2,4,1] give 3. Both angles have sine.5, but cosine is±√3/2, so [cos,sin] distinguishes them. Neither product width nor a period should be chosen from held-out outcomes. A supplied bias plus model intercept needs a parameterization decision; a duration without periodic meaning should not wrap."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T20. Separate unsmoothed full-fit and OOF codes"}</H3>

<Prose>{"Use the six-row A/A/B/B/C/C table, α=0 and the same alternating folds. Compute full-fit/OOF arrays, then encode an absent category from a nonempty donor set. Why did the retained short example need a successor?"}</Prose>

<details><summary>Hint</summary><Prose>{"Each held fold has exactly one donor from each category in this particular fixture; the general no-match case is separate."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Full-fit codes are[1,1,0,0,.5,.5]. OOF codes are[1,1,0,0,0,1]: each C row sees the other C target. An absent category uses the donor prior even with α=0; for fitting only a→1 it returns 1, avoiding0/0. The retained α=2 short calculation is valid for its demonstrated fixture but lacks empty/no-match validation. P9 validates those boundaries and keeps the original source/output unchanged. Smoothing and exclusion are separate: α=0 does not itself decide which targets are permitted."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T21. Keep groups and time constraints explicit"}</H3>

<Prose>{"There are two rows per person and monthly arrivals. An expanding two-window split validates rows 2–3 from donors 0–1, then 4–5 from donors 0–3. Which rows have training features, and can that splitter directly satisfy TargetEncoder 1.9's full OOF cv contract?"}</Prose>

<details><summary>Hint</summary><Prose>{"Write the coverage vector before choosing an API. Then inspect person overlap separately."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Coverage is [0,0,1,1,1,1]; only rows [2,3,4,5] have chronological OOF features, and targets must be selected by exactly those indices. Warm-up rows 0–1 are not filled using future targets. TargetEncoder's internal cv requires each validation index once, so this expanding splitter violates its full-row coverage contract. Fit/transform manually per window and return the aligned subset, as P9 does. Also require max donor time<min held time; if the two rows per person straddle a boundary, exclude that person's donor row too or choose a group/time design matching the question. Random group folds alone need not be chronological. Repeated validation or shared group IDs are refused by the supported checks."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T22. Break one constructed collision without claiming a theorem"}</H3>

<Prose>{"The apple+/pear− bucket0 and banana+ bucket1 map sends bags(3,1,2) and (2,0,2) to [2,2]. Change the second bag's apple count to 3. What changes? Does this show signed hashing is unbiased?"}</Prose>

<details><summary>Hint</summary><Prose>{"Recompute bucket sums; expectation is over a specified random-map family."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The first remains[3−1,2]=[2,2]; the second becomes[3−0,2]=[3,2], separating them. Changing bucket assignment could also separate particular bags but can create another collision elsewhere. This one deterministic map does not establish an expectation theorem or remove irreversibility. The program's actual FeatureHasher token map differs from our constructed map and is printed separately. A sign changes a contribution, not its declared bucket."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T23. Complete one conditional sweep and save its route"}</H3>

<Prose>{"Use the two-column table from section 9, α=1, a-then-b order and one-sweep cap. Work the fitting row sets, coefficients and missing updates. Transform later [3,NA] with the saved sequence. Does the cap certify convergence?"}</Prose>

<details><summary>Hint</summary><Prose>{"Initialize medians [2.5,6]; after fitting a use its updated value in the b design."}</Prose></details>

<details><summary>Solution</summary><Prose>{"For a, observed rows 0,1,2,4 give b=[2,4,6,10],y=[1,2,3,5], β≈.4861111111, intercept≈.0763888889. Missing row 3 a becomes 3.9652777778. For b, observed rows 0,1,3,4 now use a=[1,2,3.9652777778,5],y=[2,4,8,10]; β≈1.8232290981, intercept≈.5461393472. Row 2 b becomes 6.0158266415. Save both ordered models. Later [3,NA] preserves observed 3 and applies the b model to give 6.0158266415; it does not refit. One sweep ends at a cap, not a convergence guarantee. All observed cells must compare exactly unchanged. The answer program prints this complete table and query, with the full mechanism source already visible."}</Prose></details>

<span id="t24" className="prep-preserved-anchor" /></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Pool estimates, not completed tables — deeper"}</H3>

<Prose>{"Four completed-data analyses yield estimates "}<code>{"[8,10,10,12]"}</code>{", each with variance 1. Find the pooled estimate and total variance using the stated rule."}</Prose>

<details><summary>Solution</summary><Prose>{"The average is 10. Squared deviations sum to 8, so "}<InlineMath>{"B=8/3"}</InlineMath>{". Then "}<InlineMath>{"T=1+(1+1/4)(8/3)=13/3\\approx4.3333"}</InlineMath>{". Its standard error is "}<InlineMath>{"\\sqrt{13/3}\\approx2.0817"}</InlineMath>{". Between-completion disagreement contributes substantial uncertainty; validity still depends on how the completions and analyses were constructed."}</Prose></details>

<Prose>{"For T24, also compare “analyze 0/2 by squaring then average” with “average0/2 then square.”"}</Prose>

<details><summary>Hint</summary><Prose>{"Nonlinear analysis and averaging need not commute."}</Prose></details>

<details><summary>Solution</summary><Prose>{"The analysis-first mean is (0²+2²)/2=2, while the square of mean input is 1²=1. This is why the completed-data analyses, and their variance estimates, enter pooling. B=8/3 and T=13/3 from the retained task are variances in squared-estimate units; standard error is √(13/3). Validity still depends on the imputation/analysis models."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T25. Separate stochastic variation from an assumed sensitivity shift"}</H3>

<Prose>{"Use P16's [8,10,NA,12,NA], seed 20,m=5. Compare seed 21,m=3, then δ=−2,0,2 with baseline draws fixed. State exactly which cells may change and what conclusion the sensitivity curve supports."}</Prose>

<details><summary>Hint</summary><Prose>{"Two of five values are missing; posterior parameter draws and δ have different roles."}</Prose></details>

<details><summary>Solution</summary><Prose>{"Observed 8,10,12 stay exact in every table. Changing seed/m changes simulated μ,σ² and missing draws, hence realized Q/U; it is not new sampling evidence about model accuracy. With the same seed/m, δ changes only the two missing entries, moving every completed mean by 2δ/5. The seed 20 pooled mean is about 8.686461; δ=−2 gives 7.886461, δ=2 gives 9.486461. δ=0 recovers baseline exactly, and no missing cells makes every δ a null. This is an explicit assumed departure from the marginal normal/MCAR teaching model, not an identified MNAR estimate. A proper prior or more completions does not prove universal pooled interval coverage. The full answer code prints the actual realizations and the setup records their environment."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"T26. Build a representation for a new sensor task"}</H3>

<Prose>{"The input has amount in declared physical units, direction in degrees, ordered grade low/medium/high, nominal device IDs and deployment gaps. All are available before the target. Use training amounts [10,20,NA,40], angles [350,10,30,150], grades [low,high,medium,low], IDs [a,a,b,missing]. Transform later amounts [30,NA], angles [359,1], grades [medium,new], IDs [c,missing]. Implement and compare one justified pipeline without turning this into a tuning campaign."}</Prose>

<details><summary>Hint</summary><Prose>{"Choose a fit-owned amount fill/ruler, period-owned circle, supplied grade order and fitted rare policy. Keep the target outside the preparation function."}</Prose></details>

<details><summary>Solution</summary><Prose>{"An acceptable complete implementation is sensor_solution() in the answer file. Median amount 20 fills training to [10,20,20,40]; its saved mean/scale standardize later 30 and filled 20. A stateless period 360 circle supplies cosine/sine, preserving the 359/1 seam. Domain-supplied grade order maps medium 1 and unknown −1; monitor that unknown policy rather than pretending it is a valid lower grade. Device threshold 2 yields @missing,@rare,a columns; c maps to the existing rare bucket, missing stays separate. Append one original amount-missing indicator. The output is 2×8 with ordered names amount,cos_direction,sin_direction,grade,@missing,@rare,a,amount_missing. The ordinary ColumnTransformer uses the same explicitly pregrouped device policy, numeric Pipeline, FunctionTransformer and OrdinalEncoder, then appends the mask; a numerical assertion compares rows. Amount magnitude is preserved by an invertible affine map rather than row-normalized away. Direction wraps because its domain is cyclic; elapsed duration would need a separate coordinate. A rubric checks feature availability, units/period, fit/transform state, target separation, schema, unknown/missing distinctions, output comparison and deployment monitoring. Another pipeline can be acceptable if its different information choices are justified and tested."}</Prose></details>

<Prose>{"The entire answer asset below contains the indicator successor check, changed donor counterexample, nonlinear/basis/encoding/pooling examples and complete sensor implementation. It imports the new supported teaching modules in this same downloaded directory; it never imports the three old top-level mains. It is listed separately as a "}<strong>{"solution"}</strong>{" file so an exercise download does not reveal answers inadvertently."}</Prose>

<Prose>{""}<strong>{"practice_solutions.py — actual new checked process."}</strong>{""}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/practice_solutions.py"}>practice_solutions.py — complete changed-task answer asset</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/practice_solutions.py"} filename={"practice_solutions.py"} language="python" title={"practice_solutions.py"} />

<Prose>{"Whole recorded stdout (exact captured new stdout bytes):"}</Prose>

<p className="prep-file-context"><a href={"/learn-assets/feature-preparation-private/practice_solutions.stdout.txt"}>practice_solutions.stdout.txt — exact captured new stdout bytes</a></p>
<RemoteCodeBlock source={"/learn-assets/feature-preparation-private/practice_solutions.stdout.txt"} filename={"practice_solutions.stdout.txt"} language="output" title={"Recorded stdout · practice_solutions.stdout.txt"} /></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"11. Readiness and the next connection"}</H2>

<Prose>{"You are ready for the next core topic when you can take a new row, identify which inputs are observed/missing/unknown, apply a fitted fill/ruler/vocabulary without changing its state, and explain how the chosen representation changes the model's comparisons. Trace row 309 or a genuinely changed practice row through all output names. A count of completed sections or a model score is not a mastery test."}</Prose>

<Prose>{"The deeper route adds different checks: derive a power branch and inverse; interpolate a later value using saved landmarks; build a bin/product/local basis/cyclic pair; exclude a held row's targets from both numerator and prior; distinguish full-fit inference from OOF training; preserve original observations during conditional cycling; and analyze before pooling under explicit assumptions. If one of those remains unclear, return to its actual small table or trace rather than learning another API name."}</Prose>

<Prose>{"Next, "}<a href={"/learn/path/full-curriculum/cross-validation-hyperparameter-tuning?module=classical-ml"}>{"Cross-Validation & Hyperparameter Tuning"}</a>{" asks which observations may select a preparation/model and which may assess the selected procedure. Here we held one experiment fixed to inspect representations. There, each fold fits fresh preparation inside its training boundary, and selection/refit/outer assessment have separate roles. Later regularization develops the units/penalty connection, while feature selection asks which inputs should remain. Neither is a hidden prerequisite for the local mechanisms just taught."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning"><H3>{"Further learning"}</H3>

<Prose>{"These offer another explanation or a broader worked context; the lesson's core remains self-contained. The selected research readings were consumed during the accepted design stage and reused for the same claim scope here. No video was watched and no remote figure pixels were personally reviewed; a book/API link is not a claim of having read every page. The research record distinguishes substantive sections, metadata-only attribution and failed access."}</Prose>

<ul><li>{""}<a href={"https://inria.github.io/scikit-learn-mooc/python_scripts/02_numerical_pipeline_scaling.html"}>{"Inria's scikit-learn course: numerical preprocessing"}</a>{" is a practical notebook-style second account of training summaries, saved state and Pipeline. Use it after section 5 and follow which table is passed to fit. Selected substantive text/code was read; unseen exercises and image pixels were not certified."}</li><li>{"Kuhn and Johnson's "}<a href={"https://feat.engineering/05-Encoding_Categorical_Predictors.html"}>{"categorical predictors"}</a>{", "}<a href={"https://feat.engineering/06-Engineering_Numeric_Predictors.html"}>{"numeric predictors"}</a>{" and "}<a href={"https://feat.engineering/08-Handling_Missing_Data.html"}>{"missing data"}</a>{" chapters add predictive feature-engineering context. The selected chapter5 encoding sections, chapter6 individual/basis sections and chapter8 introduction through the KNN discussion were read. Compare its normalized Box–Cox and natural-cubic conventions with ours; do not import its informal missing-percentage advice as a rule. This is a broader book route after the corresponding local section, not required first-pass homework."}</li><li>{"Van Buuren's "}<a href={"https://stefvanbuuren.name/fimd/sec-nutshell.html"}>{"multiple imputation in a nutshell"}</a>{" and "}<a href={"https://stefvanbuuren.name/fimd/sec-whyandwhen.html"}>{"why and when MI works"}</a>{" deepen section 9's impute→analyze→pool sequence and the conditions behind its variance terms. Selected substantive procedures/conditions were read, not every later chapter. Use this specialist route before treating arbitrary completions as scientifically valid analyses."}</li><li>{"The official "}<a href={"https://scikit-learn.org/stable/auto_examples/preprocessing/plot_target_encoder_cross_val.html"}>{"TargetEncoder cross-fitting example"}</a>{" offers a code-and-results alternative for near-unique-category overfitting. Its selected source/example context is inherited from the baseline research; its experiment is not our new benchmark. Follow where fit_transform differs from transform and how the model receives its training features."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references"><H3>{"Technical references and attribution"}</H3>

<Prose>{"Use a reference to verify a specific contract you can already explain. APIs below are version-sensitive; the checked Python environment is scikit-learn 1.9.1/SciPy 1.18.1, while the accepted research read the official 1.9.1/SciPy 1.18.0 documentation. Content-time local source checks inspected quantile tie/endpoint logic, spline extensions and iterative stopping, and the four official TargetEncoder/QuantileTransformer/SplineTransformer/normal-inverse-gamma pages were freshly read for their relevant parameters."}</Prose>

<ul><li>{""}<a href={"https://scikit-learn.org/stable/modules/preprocessing.html"}>{"Preprocessing guide"}</a>{": primary formulas and ordinary numeric/category/basis alternatives. "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html"}>{"StandardScaler"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OneHotEncoder.html"}>{"OneHotEncoder"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OrdinalEncoder.html"}>{"OrdinalEncoder"}</a>{" own their fitted-state and policy interfaces. Our scratch all-missing/near-constant/marker choices are explicitly bounded."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/impute.html"}>{"Imputation guide"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.impute.KNNImputer.html"}>{"KNNImputer"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.impute.IterativeImputer.html"}>{"IterativeImputer"}</a>{": target-specific donors/fallbacks, indicator/empty-column choices and experimental conditional completion. An API's NaN support is not a universal missingness assumption."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.PowerTransformer.html"}>{"PowerTransformer"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.QuantileTransformer.html"}>{"QuantileTransformer"}</a>{": fitted parameter/landmark state and standardization/endpoint conventions. Box and Cox's "}<a href={"https://doi.org/10.1111/j.2517-6161.1964.tb00553.x"}>{"1964 original paper"}</a>{" and Yeo and Johnson's "}<a href={"https://academic.oup.com/biomet/article-abstract/87/4/954/232908"}>{"2000 paper"}</a>{" receive primary attribution; metadata/abstract access did not establish a full scanned/paywalled-body reading. Accessible official formulas and the compared canonical book support the local teaching."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.KBinsDiscretizer.html"}>{"KBinsDiscretizer"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html"}>{"KMeans"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.PolynomialFeatures.html"}>{"PolynomialFeatures"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.SplineTransformer.html"}>{"SplineTransformer"}</a>{": explicit percentile method, supplied-centers ownership, exponent order and extended knots. KMeans owns supplied init/n_init; KBins does not. B-spline and natural-cubic boundary conditions are distinct."}</li><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.TargetEncoder.html"}>{"TargetEncoder"}</a>{": primary reference for the training/inference distinction, target-type shape, smoothing and exactly-once cv coverage. Past-only warm-up needs a manually aligned subset rather than an invalid full-coverage claim."}</li><li>{""}<a href={"https://arxiv.org/pdf/0902.2206v5"}>{"Weinberger and colleagues' feature-hashing paper"}</a>{": original signed-projection assumptions and inner-product analysis. Selected body sections2–3 and lemma text were read in the inherited research; our constructed collision is not its empirical evaluation or theorem verification."}</li><li>{""}<a href={"https://amices.org/mice/reference/pool.html"}>{"mice analysis/pooling"}</a>{" and "}<a href={"https://amices.org/mice/reference/pool.scalar.html"}>{"pool.scalar"}</a>{": ordinary specialist analysis-estimate extraction, variance and degrees-of-freedom route. The optional R source has no claimed run. "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.normal_inverse_gamma.html"}>{"SciPy normal_inverse_gamma"}</a>{" supplies the ordinary joint distribution primitive, introduced 1.15; the posterior updates are derived locally. Rubin's "}<a href={"https://dash.harvard.edu/entities/publication/73120378-8764-6bd4-e053-0100007fdf3b"}>{"1976 primary abstract/record"}</a>{" supplies historical missing-data attribution without an unseen whole-paper claim."}</li><li>{""}<a href={"https://allisonhorst.github.io/palmerpenguins/reference/penguins.html"}>{"Palmer Penguins project and variables"}</a>{", by Allison Horst, Alison Hill and Kristen Gorman using Palmer Station observations collected by Gorman and colleagues: data context and CC0 availability. Our CSV preserves all observations and NA cells; the predictive task and fixed-split comparison are this lesson's controlled exercise, not a claim about all ecological populations."}</li></ul></section>

<H3>{"Setup and actual files"}</H3>

<Prose>{"Keep the complete files together: "}<a href={"/learn-assets/feature-preparation-private/README.md"}>{"setup and run instructions"}</a>{", "}<a href={"/learn-assets/feature-preparation-private/requirements.txt"}>{"tested Python dependency pins"}</a>{" and "}<a href={"/learn-assets/feature-preparation-private/source-roles.json"}>{"source, recorded-stream and execution roles"}</a>{". The shared Code & supporting files index collects these links and the contextual files below each example. Use Python 3.12 and install requirements once; keep imported helper files together. The optional R route has its separate installation/run instructions and unexecuted status. Every teaching program is shown whole with its actual retained or new output. The answer asset has a separate role. Copy and Download must use the shared controls and the exact shown file contents; a count of files cannot certify that agreement."}</Prose>

<CodeBlock language={"shell"}>{"python -m venv .venv\n# Activate .venv for your platform, then:\npython -m pip install -r requirements.txt\npython fitted_rulers.py"}</CodeBlock>

<Prose>{"Current CSV SHA-256: "}<code>{"79995be0ba7a6df1e9309e399a23438c0854f959d29950885dafb94ab881be68"}</code>{"; historical LF execution-input SHA-256: "}<code>{"f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93"}</code>{". Exact newline normalization relates the two; it is not a new numerical run."}</Prose>

<Prose>{"The source-role record binds exact current-download and historical-executed CSV identities, three retained source/stdout pairs, new successful sources/streams, failed attempts and explicit unexecuted R status. Programs are complete offline assets; fixtures in them are declared constructed examples. Real-data numerical evidence remains historical with its original split, inputs and versions. The diagrams use these retained values; current live edits apply the stated arithmetic and never rerun the historical experiment."}</Prose>
  </div>;
}
export default { title: 'Feature Scaling, Encoding & Imputation', readTime: '~110 min core reading · deeper code and practice in separate sittings', hasIntegratedGuide: true, content: PreparationLesson };
