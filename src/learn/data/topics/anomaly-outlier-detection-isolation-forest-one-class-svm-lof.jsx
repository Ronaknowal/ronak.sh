import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/anomaly-reading-flow/anomaly-reading-flow.css';
import React from 'react';
import {H2,H3} from '../../components/content/Headings.jsx';
import {Prose} from '../../components/content/Prose.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {CodeBlock} from '../../components/content/Code.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {Mechanism,AnomalyContext} from '../../components/lesson-labs/anomaly-reading-flow/figures.jsx';
function Content(){return <AnomalyContext><div className="lesson-flow an-lesson"><Prose opening="summary">{"A machine can keep producing measurements while something worth investigating changes. Which readings deserve attention? A detector compares observations with a reference. It cannot tell us what a fault is simply by finding an unusual number."}</Prose>

<Prose>{"Our first examples are constructed, unitless measurements that we can calculate by hand. Later we inspect a real recorded temperature stream with a fixed reference, saved scores and supplied event windows. We will follow random cuts, local neighbourhoods and a kernel support boundary, then decide what their scores can justify."}</Prose>

<Prose opening="prerequisites">{"Distances, means and the idea of a reference set are enough to begin. The preceding "}<a href={"/learn/path/full-curriculum/dbscan-density-based-clustering?module=classical-ml"}>{"DBSCAN lesson"}</a>{" explains connected density regions; we will distinguish its noise label from an anomaly decision. "}<a href={"/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml"}>{"KNN"}</a>{" provides exact neighbour retrieval, and "}<a href={"/learn/path/full-curriculum/support-vector-machines-svm?module=classical-ml"}>{"SVM"}</a>{" provides kernels and pair updates. We recall each operation when it enters. Begin with the pictures and hand calculations in each section. Read the three implementation routes and the recorded experiment, then try the changed tasks. The visible "}<strong>{"Deeper"}</strong>{" passages explain assumptions, computation and limits."}</Prose>

<Prose opening="route">{"First pass: read §§1–4 to define the observation, reference and score policy, then §§5–8 for isolation, §§9–12 for neighbor reach and §§13–15 for kernel support. Change one input in each mechanism before reading its equation. Continue through §§16–19 for mechanism choice, the recorded stream and the next model; try Tasks A–J along the way. Return to the visible Deeper derivations, complete scratch/library programs and Tasks K–X for implementation and diagnosis."}</Prose>

<H2>{"1. What is one observation worth reviewing?"}</H2>

<Prose>{"What information does the detector actually receive? Follow one reading from a sensor into a row."}</Prose>

<Mechanism id="D01" />

<Prose>{"The machine is the thing being observed. The sensor produces a measurement at a time. R0 identifies the record; it is not a coordinate. A feature is a value chosen for comparison. Here the level is the only feature. A missing reading leaves a gap; it does not become a level of zero. A row can be valid and unusual, or ordinary-looking and wrong. The response we care about—inspection, repair or discarding a corrupt record—is a separate decision."}</Prose>

<Prose>{"Why does one position stand apart from the others?"}</Prose>

<Mechanism id="D02" />

<Prose>{"Most reference positions occupy a short interval. P4 has a large empty gap on its left. Moving P4 from 12 to 4 removes that gap. No hidden fault label has changed: we changed only its represented position. If two IDs have the same coordinate, draw both labels; geometry cannot erase their distinct identities."}</Prose>

<Prose>{"Sometimes the missing difference is context rather than distance."}</Prose>

<Mechanism id="D03" />

<Prose>{"A level of 90 might be expected under load and surprising while idle. If we retain only the level, these two records have identical coordinates. Adding operating context can make the relevant difference visible. The bands here are supplied examples, not a fitted classifier. Unknown load means the contextual question is unresolved. It must not silently default to idle."}</Prose>

<Prose>{"Can a sequence matter even when its individual values look ordinary?"}</Prose>

<Mechanism id="D04" />

<Prose>{"Both sequences stay around 40. One varies; the other has been exactly flat for three hours. A single level cannot express that distinction. A trailing variability or duration feature can. Its window ends at the current observation so it does not use future values. Flatness can also be legitimate while a machine is idle. A sequence feature supplies evidence for a question, not automatic cause identification."}</Prose>

<Prose>{"The standard names help organize these questions. A "}<strong>{"point anomaly"}</strong>{" concerns one observation's values. A "}<strong>{"contextual anomaly"}</strong>{" concerns those values given context. A "}<strong>{"collective anomaly"}</strong>{" concerns a group or sequence whose joint pattern matters. These are task descriptions; a dataset may require more than one. Data types matter too: distances suitable for continuous sensor readings need not make sense for a category code, a text document or a network relation."}</Prose>

<Prose>{"Does DBSCAN noise answer the same question?"}</Prose>

<Mechanism id="D05" />

<Prose>{"DBSCAN marks points that do not join its declared density-connected clusters. A rare legitimate operating state can therefore be noise. Repeated erroneous readings can form a dense cluster and avoid that label. Density connectivity and “worth reviewing” use different evidence. Before choosing an algorithm, write what an observation is, which features are available, what the reference means and what action an alert initiates. Practice A changes the same reading's context; practice J diagnoses a hidden sequence difference."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task A — the missing context (§1)"}</H3>

<Prose>{"Two machines both report 90. One is under heavy load, the other idle; the feature row contains only level. Can a detector using those identical rows distinguish their contexts? Propose an available feature and one legitimate counterexample to “unusual means unwanted.”"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Draw the two query points on the level axis before adding load."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Both rows occupy the same represented position, so none of the three geometric mechanisms can recover the omitted context. Add measured load/mode, or a residual from a properly fitted context model, if available at decision time. Keep device/time separation in the validation protocol. A scheduled shutdown can be rare and correctly unusual yet require no repair. A valid response names its observation, information availability and intended review action; several context features can be reasonable."}</Prose>

</details>

</section><H2>{"2. Fit a comparison, score an observation, choose an action"}</H2>

<Prose>{"Which observations form the comparison itself?"}</Prose>

<Mechanism id="D06" />

<Prose>{"In "}<strong>{"training outlier detection"}</strong>{", the task is to identify unusual members of a mixed collection. The candidate being scored may have helped form the comparison. In "}<strong>{"novelty detection"}</strong>{", we fit a reference intended to describe acceptable operation and then score distinct later observations. “Intended” matters: without verified labels, a clean reference is an assumption. A query does not enter the frozen reference merely because it arrived later."}</Prose>

<Prose>{"These tasks can give different answers at the same coordinate. We will see the difference explicitly for LOF. Batch inclusion may also let a repeated unusual group help define its own support. A frozen reference cannot adapt to a new legitimate regime automatically. Neither task is universally preferable; the intended data availability determines the question."}</Prose>

<Prose>{"What does fitting leave behind?"}</Prose>

<Mechanism id="D07" />

<Prose>{"A forest retains cuts and terminal populations. LOF retains reference neighbourhood statistics. One-Class SVM retains a kernel support function. "}<strong>{"Fitting"}</strong>{" constructs those objects from the reference. "}<strong>{"Scoring"}</strong>{" uses them on a row. "}<strong>{"Thresholding"}</strong>{" compares the score with an attention rule. An edited threshold need not refit or change the score."}</Prose>

<Prose>{"Which direction means more unusual?"}</Prose>

<Mechanism id="D08" />

<Prose>{"Library APIs often return a larger value for a more compatible observation. We use a common orientation "}<code>{"A=-u"}</code>{", so a larger A deserves more attention under a high-score rule. In scikit-learn, "}<code>{"score_samples"}</code>{" supplies the raw normality score for Isolation Forest, One-Class SVM and novelty LOF. LOF's training values instead come from "}<code>{"negative_outlier_factor_"}</code>{"; the distinction is part of the task, not a cosmetic accessor change."}</Prose>

<Prose>{"A library "}<strong>{"decision function"}</strong>{" commonly subtracts an offset: "}<code>{"u-b"}</code>{". With u=-.6 and b=-.5, the result is-.1. Moving only the offset to-.7 makes it+.1 while A remains .6. The learned geometric comparison and the zero-based library label are different quantities. A score is not a calibrated fault probability. Its numerical range is method-specific: the isolation score has a particular path-based normalization, LOF is a relative factor, and a kernel decision is a signed support value."}</Prose>

<H2>{"3. Make the needed difference visible"}</H2>

<Prose>{"Our early positions were unitless so we could inspect geometry. Real sensors have units, timestamps, missingness and availability. Which earlier value produces a causal change feature?"}</Prose>

<Mechanism id="D09" />

<Prose>{"The change at time t is "}<code>{"level(t)-level(t-1 hour)"}</code>{". It is an exact timestamp lookup, not “twelve rows earlier” unless the recorded stream actually guarantees twelve equally spaced rows. Remove 00:05 and the 01:05 lag is missing. We exclude that feature row here; we do not invent a future value or silently interpolate. If two readings at 00:00 are 40 and 44 and both are available when the timestamp closes, their declared mean is 42, making the 01:00 change zero. A late-arriving duplicate would require a separate availability policy."}</Prose>

<Prose>{"Which observations determine preprocessing constants?"}</Prose>

<Mechanism id="D10" />

<Prose>{"Standardizing a feature subtracts its fitted mean and divides by its fitted scale. For 40 and 42 the mean is 41 and population standard deviation is 1. A later 50 becomes 9. Including 50 while calculating those constants changes the reference geometry using the very later observation we meant to assess. Fit the preprocessor on reference rows, retain feature order and apply it unchanged to calibration and later queries. "}<code>{"StandardScaler"}</code>{" uses population variance and gives a constant feature scale of 1; that prevents division by zero without making the feature informative."}</Prose>

<H2>{"Run the complete examples"}</H2>

<Prose>{"Use Python 3.12 with NumPy, SciPy and scikit-learn for the small examples. The recorded environment is Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1; the historical temperature program also uses pandas 2.3.3. Install the supplied requirements in an isolated environment:"}</Prose>

<CodeBlock language={"powershell"}>{"python -m venv .venv\n.\\.venv\\Scripts\\Activate.ps1\npython -m pip install -r programs/requirements.txt\npython -B programs/causal_features.py"}</CodeBlock>

<Prose>{"Download the program folder with its relative subfolders intact and run these commands from its parent directory. On macOS/Linux, activate with "}<code>{"source .venv/bin/activate"}</code>{". The file index names each runnable program and imported helper. Keep "}<code>{"programs/prerequisites/"}</code>{" as a package and keep the originals beside their CSV/JSON inputs."}</Prose>

<Prose>{"The displayed streams are saved earlier executions. They distinguish the source and environment used for each example; they are not fresh executions of every downloadable successor. Running an example creates your own result. Package versions, initialization details and floating-point rounding can change printed values, and a fixed seed does not make different algorithms draw the same random choices. The displayed decimals are rounded; calculations retain full precision."}</Prose>

<Prose>{"Most examples use small constructed inputs. "}<code>{"saved_temperature_thresholds.py"}</code>{" reads saved scores and event windows to calculate a policy without fitting a model. "}<code>{"originals/temperature_monitor.py"}</code>{" instead fits a model to the supplied real temperature measurements if you run it. Its displayed stream is the saved original run. The offline data, event annotations and license travel with these programs; their physical and normalized-newline identities are explained in the supplied provenance files. The browser's local investigations use their taught bounded inputs and do not run uploaded Python."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"causal_features.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="causal_features.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/causal_features.py" />

<CodeBlock kind="output" language="output" filename="causal_features.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/causal_features.stdout.txt">{"exact lag rows: [('01:00', 42.0, 2.0), ('01:05', 45.0, 4.0)]\nduplicate current-time means: [('01:00', 42.0, 0.0), ('01:05', 45.0, 4.0)]\nmissing lag retained times: ['01:00']\nreference mean/scale/later coordinate: [41.0] [1.0] [[9.0]]\nflat trailing population standard deviation: 0.0"}</CodeBlock>

<Prose>{""}<code>{"aggregate_and_lag"}</code>{" first groups values at each timestamp, then looks up the exact lag. The lookup dictionary describes the offline calculation; it is not a claim that all duplicates were available in an online system. "}<code>{"trailing_variation"}</code>{" retains values in the past open-left, closed-right window and uses population standard deviation. The flat example returns zero, a useful geometric null. The scaler is fitted only on the two supplied reference levels. No real temperature model is refitted by this program."}</Prose>

<H3>{"Deeper: geometry is a representation choice"}</H3>

<Prose>{"If one feature is measured in thousands and another in fractions, Euclidean distances can be dominated by the former. A positive common rescaling cancels some ratios but not every detector's fit or numerical stabilizer. Standardization is a choice about which differences matter. It is not automatically justified merely because an API accepts a matrix. A contextual residual, a categorical mode, a duration or a subspace representation answers a changed question. The "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml"}>{"PCA lesson"}</a>{" explains projection and reconstruction; the "}<a href={"/learn/path/full-curriculum/time-series-validation-forecasting-baselines?module=classical-ml"}>{"time-series lesson"}</a>{" explains issue-time information and rolling validation. Use those when the desired anomaly is hidden by the current row representation. A new feature requires a new locked evaluation before claiming improved detection. Practice K tests exact-lag availability rather than copying a row shift."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task J — the stuck trace (§3/18)"}</H3>

<Prose>{"Healthy and stuck sensors both have level 40 for part of a day; the stuck trace stays exactly flat for 3 hours. Propose a causal feature and a legitimate null case. What evidence is needed before claiming improved detection?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Draw only the trailing observations available at the current timestamp."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A trailing variation/range or duration-since-change can expose persistence that a single level hides. Declare sampling resolution, missing values, operating mode and time-window availability. An idle process genuinely stable at 40 is a counterexample: zero variation alone is not a fault label. A new feature needs a locked reference/calibration/future assessment and reviewed labels/event policy. It cannot retroactively acquire performance from the old level/change run."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task K — the exact-hour operand (§3)"}</H3>

<Prose>{"Given 00:00=40,00:05=41,01:00=42,01:05=45, compute exact-hour changes. Remove 00:05. Then add a second 00:00 reading 44, assumed available when 00:00 closes."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The preceding operand is found by timestamp, not by a fixed row count."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"01:00 uses 42−40=2;01:05 uses 45−41=4. Removing 00:05 makes the latter undefined/excluded, not a difference from 00:00 or a future interpolation. Averaging same-time 40/44 gives 42, so 01:00 change becomes 0. If 44 arrives after the decision, that aggregation would violate issue-time availability and requires a different policy. The new causal helper prints these separate states."}</Prose>

</details>

</section><H2>{"4. Put a threshold beside the score"}</H2>

<Prose>{"Which observations does the rule actually select?"}</Prose>

<Mechanism id="D11" />

<Prose>{"We use the strict rule "}<code>{"A>τ"}</code>{". At τ=2, D and E are reviewed; C lies on the threshold and is not. At τ=4 nobody is reviewed. No observation's identity or score changed. An empty selection is a legitimate result, not an unfinished lab."}</Prose>

<Prose>{"Can one threshold select exactly one of the tied rows?"}</Prose>

<Mechanism id="D12" />

<Prose>{"The higher empirical quantile picks the ordered score at zero-based index "}<code>{"ceil(q(n-1))"}</code>{". It is a threshold derived from this finite calibration collection. It is not a guarantee about a later period. With a tie at 4, a strict score threshold chooses both tied rows or neither; it cannot choose exactly one. A "}<strong>{"top-B policy"}</strong>{" can select one, but it needs a declared deterministic tie order. Here ID order chooses D before E. It has introduced a row budget, not discovered which tied row is faulty."}</Prose>

<Prose>{"The library's "}<code>{"contamination"}</code>{" parameter typically sets an offset using training scores. It does not inject verified fault labels or make a later alert fraction equal to that number. Changing contamination in Isolation Forest or LOF's offset policy can leave the raw scores fixed. One-Class SVM's "}<code>{"nu"}</code>{" participates in fitting, so it is not another name for this external threshold. We will derive its precise role in section 14."}</Prose>

<Prose>{"Later, "}<code>{"score_policy.py"}</code>{" will implement these rules with the workload and cost calculation. For now the complete hand procedure is: check score direction, sort the calibration scores, choose the higher-quantile index, compare each later score strictly with its threshold, retain the selected original IDs. We will keep that sequence when using saved real scores. Practice T changes a tied threshold into a budget and calculates the consequence with supplied truth."}</Prose>

<H2>{"5. Follow cuts through an isolation tree"}</H2>

<Prose>{"How can we find a distant observation without estimating a density? Return to the "}<strong>{"constructed, unitless"}</strong>{" positions P0…P4 at 0,1,2,3,12. An isolation tree repeatedly chooses a feature and a cut in the current reference range, sending each reference row to one child. It remembers those cuts. A query later follows the comparisons; it does not grow a new tree."}</Prose>

<Mechanism id="D13" />

<Prose>{""}<strong>{"cut locations are lengths."}</strong>{""}</Prose>

<Prose>{"A uniform first cut between 0 and 12 isolates P4 whenever it falls between 3 and 12. That interval has length 9, so its probability is 9/12=3/4. P0 has only the interval 0…1, probability 1/12. This is the mechanism: empty space makes some observations easier to separate. Move P4 to 4 and its interval has length 1 out of span 4. The two main controls change P4 and the cut; P0–P3 stay at 0,1,2,3, so they cannot make all five rows equal. A separately labelled static comparison puts P0…P4 all at 7, with distinct ID labels, zero span and no possible uniform split. This changes the whole reference explicitly; it is not a hidden state reached by editing P4. Nothing here proves that P4 is a broken machine. Coincident endpoints of intervals have probability zero under the continuous cut model; stored software comparisons still need a declared "}<code>{"<"}</code>{" or "}<code>{"<="}</code>{" rule."}</Prose>

<Mechanism id="D14" />

<Prose>{""}<strong>{"a feature chooses the direction of a cut."}</strong>{" Explicitly switch to five constructed "}<strong>{"two-feature"}</strong>{" rows A(0,0), B(1,0), C(2,1), D(3,1), E(12,2). A level cut at 6 is a vertical line: A–D left, E right. A second-feature cut at .5 is horizontal: A/B below, C/D/E above. Both axes vary in the main fixture. The separate static constant-axis comparison is A(0,2), B(1,2), C(2,2), D(3,2), E(12,2): all second coordinates equal 2 while level coordinates stay as drawn. There is no second-axis split in that comparison; selecting an axis in the main fixture cannot create it. A feature which is constant within a node cannot separate its rows. The scratch route below chooses uniformly from currently varying features; the ordinary implementation has a different tree-construction route. Neither construction is invariant to arbitrary rotations."}</Prose>

<Mechanism id="D15" />

<Prose>{""}<strong>{"the same partitions are actual tree nodes."}</strong>{" Switch briefly to four positions 0,1,2,3 and a distinct query Q=2. Use depth cap 2."}</Prose>

<Prose>{"Q follows right/right: two "}<strong>{"edges"}</strong>{", not three nodes. Q=0 follows left and reaches a singleton after one edge. A later query at 20 still follows right/right; the fitted tree has no knowledge of its distance beyond the final cut. Step and Back in the drawing should highlight the corresponding interval and edge together."}</Prose>

<Mechanism id="D16" />

<Prose>{""}<strong>{"stopping does not always isolate one row."}</strong>{" Draw the terminal interval with its remaining reference dots. A singleton stops; an all-constant node stops; a depth cap stops even when multiple rows remain. The depth-cap inspection uses fixed reachable cuts .5, then right-child 1.5, then right-child 2.5 if growth continues. At cap 1, it leaves [1,2,3] together; at cap 2 it leaves [2,3]; at cap 3 or higher query 2 reaches singleton [2] after three edges. Its depth/query controls cannot turn those four references into the separate static five-row comparison P0…P4 all at 7. That comparison has one root with population 5, zero observed edges and no cut. Cut editing and local cut-interval errors belong to D15's selected-node cut editor; D16 has no cut field. Its own invalid inputs are an invalid cap or nonfinite query. A query outside the range is valid: stored comparisons still define its path."}</Prose>

<Prose>{"Try task B's changed endpoint gap, then C's reachable capped leaf. The next question is how to compare a path that stops with two rows to one which truly reached a singleton."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task B — endpoint cuts (§5)"}</H3>

<Prose>{"Use positions 0,2,3,4,10. Draw the uniform first-cut span and the intervals isolating 10 or 0. Which is more easily isolated in this first step?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count lengths of empty intervals, not numbers of rows."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The full span is 10. Cuts in(4,10) isolate 10, length 6/probability .6. Cuts in(0,2) isolate 0, length 2/probability .2. Interior cuts can isolate neither endpoint. Measure-zero endpoints do not change the continuous probabilities. The claim is about one random cut, not a fault label or a complete forest score."}</Prose>

</details>

</section><H2>{"6. Count what remains at a terminal node"}</H2>

<Mechanism id="D17" />

<Prose>{""}<strong>{"a terminal population needs a continuation allowance."}</strong>{" Draw m remaining dots at the terminal, and a dashed unbuilt continuation beyond it. The dashed edges are an expected continuation, not extra edges that were actually traversed. For m≤1 there is no remaining separation to account for. For m=2 the correction is 1. For larger m the Isolation Forest correction is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"c(m)=2H_{m-1}-\\frac{2(m-1)}m,\n\\qquad H_r=1+\\frac12+\\cdots+\\frac1r."}</MathBlock></div>

<Prose>{"The small cases are c(0)=c(1)=0, c(2)=1, c(4)=13/6, and c(5)=77/30. For five, H4=25/12, so 2·25/12−8/5=77/30. This unsuccessful-search-depth correction comes from the average-path normalization used in the original Isolation Forest paper. It is a convention for an unfinished leaf; it is not a derivation that arbitrary coordinate-cut trees have the same distribution as random search trees. The exact harmonic sum is inexpensive when cached once. The ordinary library uses "}<code>{"log(m−1)+EulerConstant"}</code>{" for m>2, so a small-leaf comparison must name its convention."}</Prose>

<Mechanism id="D18" />

<Prose>{""}<strong>{"observed edges plus expected continuation."}</strong>{" For the actual right/right terminal in D15, d=2 and m=2. Place an edge-count bar of length 2 beside a correction bar of length 1. The corrected path is h=d+c(m)=3. A singleton at d=1 gives h=1. The terminal population belongs to fitted reference rows, never to the number of later queries."}</Prose>

<Mechanism id="D19" />

<Prose>{""}<strong>{"normalize by the sample actually used."}</strong>{" Five available rows with a requested maximum of 256 still give ψ=min(5,256)=5; the normalizer is c(5)=77/30. With requested maximum 4 it is c(4)=13/6. The scratch score requires ψ≥2, because c(1)=0. It does not silently divide by zero or substitute requested 256. The ordinary ψ=1 implementation has its own fallback; it is outside our hand-score parity claim."}</Prose>

<Mechanism id="D20" />

<Prose>{""}<strong>{"transform a path into an isolation score."}</strong>{" Connect the corrected-path ruler to a score ruler through"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"s(x)=2^{-h(x)/c(\\psi)}."}</MathBlock></div>

<Prose>{"h=c(ψ) gives .5; h=0 gives 1; a longer path lowers the score. The exponent is dimensionless. This score expresses relative ease of isolation under the declared construction, not a probability of failure. A .5 mark is a normalization reference, not a universally correct action threshold."}</Prose>

<H3>{"Deeper: average over cut locations without drawing infinitely many trees"}</H3>

<Mechanism id="D21" />

<Prose>{""}<strong>{"each gap carries a probability weight."}</strong>{" The strip between adjacent sorted coordinates has width "}<code>{"next−previous"}</code>{". All cuts in that gap make the same partition. Its probability is its width divided by the current span. Draw those weighted partitions and recursively their child contributions; then sum the corrected paths with those weights. Zero-width gaps contribute zero, and identical coordinates remain separate identities."}</Prose>

<Prose>{"For the original five positions at depth cap 3, the exact expected corrected paths are 31/12,73/22,17/5,17/6,841/660. Their score-of-expected-path values are approximately .497755,.408159,.399239,.465258,.708845. The distant P4 has the shortest expectation. Move P4 to 4 and the paths become 25/12,17/6,3,17/6,25/12; the two endpoints tie. A separate labelled static comparison changes all P0…P4 positions to 7. The main P-ID/P4/cap controls keep P0–P3 fixed and cannot reach this comparison. In the all-at-7 reference the root cannot split: every corrected path is c(5)=77/30 and every score is .5, with actual ψ=5. Its exact result is included in the preserved helper output below."}</Prose>

<Prose>{"The complete helper below keeps fractions for cut probabilities and paths, then converts only the final exponent to a floating-point score. A cached state is a contiguous sorted index range and depth. It supports only two to six rational positions and depth caps one to five: it is an inspectable expectation tool, not a scalable forest implementation. At most O(n²L) cached interval/depth states exist; each may consider O(n) splits and O(n) path entries, giving a conservative O(n⁴L) arithmetic bound, plus rational numerator/denominator costs. Small-state exact arithmetic is deliberate here."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"isolation_expectation.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="isolation_expectation.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/isolation_expectation.py" />

<Prose>{"Actual new supplied-fixture output:"}</Prose>

<Prose>{""}<strong>{"Recorded example output (reused): "}<code>{"isolation_expectation"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="isolation_expectation.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/isolation_expectation.stdout.txt">{"positions [0, 1, 2, 3, 12]\nexact paths ['31/12', '73/22', '17/5', '17/6', '841/660']\nscores [0.497754579, 0.408158636, 0.399239031, 0.465258333, 0.708844908]\npositions [0, 1, 2, 3, 4]\nexact paths ['25/12', '17/6', '3', '17/6', '25/12']\nscores [0.56971476, 0.465258333, 0.444781544, 0.465258333, 0.56971476]\npositions [7, 7, 7, 7, 7]\nexact paths ['77/30', '77/30', '77/30', '77/30', '77/30']\nscores [0.5, 0.5, 0.5, 0.5, 0.5]"}</CodeBlock>

<Mechanism id="D22" />

<Prose>{""}<strong>{"one realized path and the expectation are different objects."}</strong>{" Fix query identity P4 in the unchanged five-row reference. One first cut at 6 isolates it immediately, h=1. A first cut at 2.5 keeps [P3,P4] together, followed by cut 6, giving h=2. A first cut at .5, then 1.5, then 2.5 leaves [P3,P4] at depth 3, giving h=4. These are reachable paths for the "}<strong>{"same"}</strong>{" P4 and reference; the exact expectation 841/660 stays unchanged. Edit up to three cut coordinates only. An unvisited branch's cut is a meaningful null: its change cannot affect this query's path. Reset restores the default cuts. Other query identities belong to D21's separate investigation. D22 never borrows the four-row witness in the next section."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task C — a capped leaf (§6)"}</H3>

<Prose>{"Draw four references 0,1,2,3, first cut .5 and right-child cut 1.5, cap 2. Trace distinct query 2. Compute its corrected path and score using the "}<strong>{"actual"}</strong>{" sample size, even if 256 was requested."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count edges and the terminal population separately."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Right/right reaches[2,3] after 2 edges. c(2)=1, so h=3. Actualψ4 has c4=13/6, giving 2^(−3/(13/6))=2^(−18/13)≈.3829915893. Using c256 would answer a different sample question. Query 0 instead reaches[0] at depth 1 and has no continuation correction. Both paths are reachable in the drawn tree."}</Prose>

</details>

</section><H2>{"7. Average trees and change which rows they see"}</H2>

<Prose>{"How do many trees turn construction randomness into one comparison? "}<strong>{"Explicitly switch"}</strong>{" to four reference rows F0…F3 at 0,1,2,10, a distinct query Q=10, ψ=4, and depth cap 2."}</Prose>

<Mechanism id="D23" />

<Prose>{""}<strong>{"two reachable paths enter one average."}</strong>{""}</Prose>

<Prose>{"The forest averages "}<strong>{"corrected paths before applying the exponent"}</strong>{":"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"s(x)=2^{-\\frac{1}{Tc(\\psi)}\\sum_{t=1}^T h_t(x)}."}</MathBlock></div>

<Prose>{"The different operation "}<code>{"(2^(-6/13)+2^(-18/13))/2"}</code>{" is .554601508696. Averaging individual scores is not the paper/library forest operator. One included tree is an informative null: both operators coincide. This local control changes only how many of the two already drawn trees participate; it does not change their sample or cuts. More trees can stabilize construction averages, but do not establish fault truth or repair missing features."}</Prose>

<Mechanism id="D24" />

<Prose>{""}<strong>{"a sample has identities."}</strong>{" Draw ten population tokens, two belonging to a rare but acceptable operating regime, and the three actual IDs selected for one tree. If sampling is uniform without replacement, the probability of missing both rare rows is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\frac{\\binom{8}{3}}{\\binom{10}{3}}=\\frac{56}{120}=\\frac7{15}."}</MathBlock></div>

<Prose>{"The sample may omit a legitimate regime entirely. Small subsamples can reduce "}<strong>{"masking"}</strong>{", where an unusual group supports itself enough to look ordinary, but can also cause "}<strong>{"swamping"}</strong>{", where acceptable observations are treated as unusual. These describe failure mechanisms, not a promise that smaller ψ improves every dataset. This rare-group count is hypothetical and has no connection to real fault prevalence."}</Prose>

<Mechanism id="D25" />

<Prose>{""}<strong>{"geometry changes the cut distribution."}</strong>{" Transform one coordinate and every stored cut/query by "}<code>{"x→10x+3"}</code>{". The inequalities and interval-width ratios stay the same. Rotate a two-dimensional plane: axis-aligned cuts now see different spans and partitions, so that invariance is lost. Adding a noisy feature gives a varying-feature selector another possible direction; a constant feature is ignored by our scratch selector. Declaring the selector matters when comparing algorithms."}</Prose>

<Prose>{"Try task L to reproduce the two-tree operation and task N to price rare-mode omission. Next we need a forest whose implementation does not repeatedly copy the entire reference matrix."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task L — two reachable trees (§7)"}</H3>

<Prose>{"Use F0…F3 at 0,1,2,10, distinct Q10,ψ4/c4=13/6,cap 2. Draw treeA cut 5 and treeB cut .5 then right cut 1.5. Compare score-of-mean-path with mean-of-scores. Include only treeA as a null case."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The second tree leaves two reference rows at its cap."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A reaches[10] at depth 1,h1. B reaches[2,10] at depth 2,h2+c2=3. Mean h2 gives 2^(−12/13)=.527383038241. Separately transforming h1/h3 then averaging gives .554601508696. With onlyA both operations coincide at 2^(−6/13). These are actual cut paths with actualψ4, not two arbitrary h values normalized by an unrelated c. Changing aggregation does not alter the reference or query."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task N — rare-mode omission and work (§7/8)"}</H3>

<Prose>{"A legitimate rare regime occupies 2 of 10 population rows. A tree samples 3 without replacement. Compute the probability of omitting that regime. Name work outside traversing tree nodes."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Choose all three rows from the other eight."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Probability C(8,3)/C(10,3)=56/120=7/15. Omitting the regime can make its later rows look unsupported. Small samples may unmask unusual groups but cannot guarantee better fault detection. Finite validation reads nd entries; sparse sampling uses expected O(ψ) work/state per tree; feature-range scans and ID partitions cost additional work before queries traverse nodes. Input reading is not free."}</Prose>

</details>

</section><H2>{"8. Build an efficient scratch forest and inspect the library"}</H2>

<Mechanism id="D26" />

<Prose>{""}<strong>{"a tree partitions row IDs and stores node arrays."}</strong>{" The reference matrix remains shared during growth. An index array might hold "}<code>{"[0,1,2,3]"}</code>{"; a split partitions an active range of that array. A stack frame is "}<code>{"(start,stop,depth,parent,side)"}</code>{". Node arrays hold feature, cut, left child, right child and terminal population. Following the right/right path in D15 highlights the same row range and node links; there is no separate unexplained tree picture."}</Prose>

<Prose>{"Read "}<code>{"sample_ids"}</code>{" first. It uses a sparse partial Fisher–Yates shuffle: choose one index from the remaining conceptual range, record only swaps that were touched, and return ψ unique row IDs. It uses O(ψ) state and expected O(ψ) sampling work rather than allocating a length-n permutation for every tree. Finite input validation still reads n·d entries once."}</Prose>

<Prose>{""}<code>{"grow_indexed"}</code>{" scans the current rows' feature ranges, chooses among varying features, draws an interior cut and partitions IDs. The "}<code>{"nextafter"}</code>{" guard protects a representable cut next to an endpoint; it does not make a constant node splittable. "}<code>{"corrected_paths"}</code>{" counts traversed edges and looks up the cached correction by leaf population. "}<code>{"score"}</code>{" processes query blocks and averages those paths before exponentiation. Nonfinite inputs, mismatched feature columns/order and ψ<2 are refused. A correctly shaped empty query returns an empty score array."}</Prose>

<Prose>{"The fitted forest is one complete state: feature order, column count, actual sample size, correction table, depth limit and node arrays. "}<code>{"fit"}</code>{" prepares all of them locally and publishes them only after every tree is ready. If a refit is rejected, the previous complete forest still answers its original queries; the rejected feature representation is not accepted. For example, a two-row, one-cut forest for the single feature "}<code>{"level"}</code>{" gives .5 for either terminal row. Refusing an attempted two-column refit keeps that one-column forest and its .5 scores; a two-column query remains a mismatch. Changing the requested next-fit tree count also leaves current scores unchanged: their path mean divides by the number of stored fitted trees. These are sequential API guarantees; concurrent mutation would require a separate synchronization design."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"isolation_core.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="isolation_core.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/isolation_core.py" />

<H3>{"Compare an operator, then compare declared implementations"}</H3>

<Mechanism id="D27" />

<Prose>{""}<strong>{"reconstruction of an actual library tree."}</strong>{" A library tree's traversed edges and terminal row count form the same operands d and m. Reconstruct its path using the library correction, then the whole forest score; compare that to "}<code>{"-score_samples"}</code>{". This tests the operator on the "}<strong>{"same fitted library trees"}</strong>{". It does not require our different random tree generator to reproduce them."}</Prose>

<Prose>{"The driver below first checks the fixed D23 witness, then runs eight trees on a new tiny dense two-feature fixture. It uses an ordinary "}<code>{"IsolationForest"}</code>{" with the same declared tree count/sample request/seed, separately reconstructs the ordinary trees, and checks their scores. Its four score values need not equal the scratch scores: varying-feature choice, ExtraTrees construction, float32 input conversion, RNG consumption and harmonic/log correction can all differ. "}<code>{"max_samples_"}</code>{" is the actual sample size. With "}<code>{"contamination='auto'"}</code>{", the ordinary offset is −.5; "}<code>{"decision_function=score_samples−offset_"}</code>{". A numeric contamination changes that offset without turning it into a probability."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"isolation_mechanisms.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="isolation_mechanisms.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/isolation_mechanisms.py" />

<Prose>{""}<strong>{"Recorded example output (reused): "}<code>{"isolation_mechanisms"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="isolation_mechanisms.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/isolation_mechanisms.stdout.txt">{"reachable psi4 paths/normalizer: [1.0, 3.0] 2.166666666667\nscore mean path / mean scores: 0.527383038241 0.554601508696\nindexed nodes: [5, 5, 5, 5, 7, 5, 5, 5]\nscratch isolation scores: [0.449425487, 0.398617492, 0.467761865, 0.697743764]\nordinary tree reconstructed scores: [0.430734691, 0.325296808, 0.374321546, 0.65630381]\nnative actual sample/offset: 4 -0.5\nconstant-reference scores: [0.5, 0.5]\nsparse sample IDs: [9, 6, 7] rare-pair omission: 0.4666666666666667"}</CodeBlock>

<Prose>{"The constant five-row/two-feature case scores .5 even for a later query with different coordinates: a fitted root with no varying feature contains no cuts. That is a support limitation, not evidence that the later observation is acceptable. Ordinary library support for sparse or missing-value inputs is a separate documented route; the finite dense scratch code deliberately refuses them."}</Prose>

<H3>{"Deeper: conserved one-dimensional route and real costs"}</H3>

<Prose>{"The following earlier one-dimensional program and output remain complete. Its 200-tree/seed choices and five-position sample are its own run. Its "}<code>{"anomaly_scores"}</code>{" averages corrected paths before the exponential. The recorded output is historical, not refreshed by running it here. A separate earlier hand calculation using a generic normalizer c=2 gave .5 versus .530330085890 for the two operators; that scalar illustration is not a sample-normalized forest result. D23 supplies the reachable sample-normalized counterpart."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"originals/isolation_example.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="originals/isolation_example.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/isolation_example.py" />

<Prose>{""}<strong>{"Preserved recorded output: "}<code>{"isolation_example"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="isolation_example.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/isolation_example.stdout.txt">{"Fitted sample size: 5\nMost easily isolated position: 12.0\nScores: [0.4996 0.4135 0.3998 0.4613 0.7097]\nDuplicate-only scores: [0.5 0.5]"}</CodeBlock>

<Prose>{"Let L=ceil(log₂ψ). Each level can scan at most ψ rows across d features; with T trees a conservative growth bound is O(TdψL), plus O(nd) validation and O(Tψ) sampling. Query traversal is O(qTL). The fitted node arrays occupy O(Tψ), with a shared input matrix O(nd) and per-tree index/stack workspace during fitting. These are operation/storage bounds, not measured latency. The depth cap bounds path length, but does not remove validation, sampling, range scans or the cost of reading the input. Tasks M/N separate those costs from an empty-query or constant-node null."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task M — an unsplittable forest (§8)"}</H3>

<Prose>{"Fit the scratch forest to five identical two-feature rows. What path and score does any query receive, even a query outside their coordinate? State invalid and empty-query cases."}</Prose>

<details><summary>Hint</summary>

<Prose>{"There is no varying feature at the root."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The root remains terminal with population 5 and no observed edges. h=c5, so score .5 for every query. This fit cannot represent extrapolation because it stores no cuts; it does not establish query acceptability. Nonfinite or mismatched columns/order are refused. An empty "}<code>{"(0,2)"}</code>{" array returns empty scores; a one-dimensional empty array lacks the required feature shape."}</Prose>

</details>

</section><H2>{"9. Measure each neighbour's usual spacing"}</H2>

<Prose>{"An isolation path asks how easily cuts separate a row. A local comparison asks a different question: does this query have support comparable to its neighbours' support? Explicitly switch to "}<strong>{"six constructed reference rows"}</strong>{", at positions 0,1,2,20,24,28. Call their identities P0…P5 in that order. They represent two acceptable regions with different spacing, not six real temperatures."}</Prose>

<Mechanism id="D28" />

<Prose>{""}<strong>{"neighbours are other identities."}</strong>{""}</Prose>

<Prose>{"For k=2, choose the two closest eligible reference IDs in Euclidean distance. A reference row's own ID is excluded when computing its training neighbours. A distinct later query may select the reference at exactly its coordinate. Equal-distance cutoff ties in our scratch route use increasing original row ID; the ordinary backend need not make that same ID choice. Distance itself is recalled from "}<a href={"/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml"}>{"KNN"}</a>{": one coordinate uses absolute difference, several use the square root of summed squared differences. IDs never become features."}</Prose>

<Mechanism id="D29" />

<Prose>{""}<strong>{"the radius belongs to the reference row."}</strong>{" Draw P1=1 with arrows to P0=0 and P2=2. Its kth distance is 1. Draw P2=2 with arrows to P1=1 and P0=0: radius 2. Draw P4=24 with arrows to 20 and 28: radius 4. The reference radius "}<code>{"r_k(o)"}</code>{" is the distance from o to its kth selected neighbour, after the identity rule. Across the six rows the radii are "}<code>{"[2,1,2,8,4,8]"}</code>{"."}</Prose>

<Mechanism id="D30" />

<Prose>{""}<strong>{"a global distance and a local ratio ask different questions."}</strong>{" The 20/24/28 group has four-unit spacing, while 0/1/2 has one-unit spacing. A query can be farther from its nearest point in the loose group and still have comparable support relative to that group. This motivates a ratio; it does not prove that every global score penalizes the loose group. Task E will compare two actual queries, not merely two distance bars."}</Prose>

<H2>{"10. Build directed reach, local density and a relative factor"}</H2>

<Mechanism id="D31" />

<Prose>{""}<strong>{"compare distance with the neighbour's radius."}</strong>{" Q=4 selects P2=2 and P1=1. Draw Q→P2, length 2, alongside "}<strong>{"P2's"}</strong>{" radius 2. Then Q→P1, length 3, alongside "}<strong>{"P1's"}</strong>{" radius 1. The directed reach is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{reach}_k(Q,o)=\\max\\{d(Q,o),r_k(o)\\}."}</MathBlock></div>

<Prose>{"For these arrows the reaches are 2 and 3. A query at 1.5 aimed at P2 has distance .5, but reach remains 2: the radius provides a floor for very close queries. Q=6 aimed at P2 has distance 4, so the distance wins. Reversing the arrow changes whose radius is used; reach is generally asymmetric even though distance is symmetric."}</Prose>

<Mechanism id="D32" />

<Prose>{""}<strong>{"mean length, then reciprocal."}</strong>{" Place the two reaches 2 and 3 end to end, halve their total to obtain mean length 2.5, then take its reciprocal. This "}<strong>{"local reachability density"}</strong>{", abbreviated lrd, is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{lrd}_k(Q)=\\left(\\frac1k\\sum_{o\\in N_k(Q)}\\operatorname{reach}_k(Q,o)\\right)^{-1}=.4."}</MathBlock></div>

<Prose>{"It has inverse-distance units. It is not a probability density with a normalized integral, and it is not the mean of reciprocal reaches. In the main six distinct references, every supported k from 1 through 5 has positive reference radii, so every query reach is positive; editing Q or k cannot make its mean zero. A separately labelled static support-boundary comparison instead has four reference IDs U0…U3 all at 0, k=2 and a distinct query Q=0. There all radii/reaches are zero, so the unstabilized reciprocal is undefined. Draw a zero mean bar and the word “undefined”, never infinite height. This explicitly different reference connects to D38's all-identical comparison, where the library stabilizer is taught; it is not another D32 parameter or a fabricated undefined main result."}</Prose>

<Mechanism id="D33" />

<Prose>{""}<strong>{"the selected neighbours have their own neighbourhoods."}</strong>{" Draw the six reference neighbourhoods under the same number line, with their mean reaches and reciprocals:"}</Prose>

<NeuralTable caption={"10. Build directed reach, local density and a relative factor"} headers={[<>{"Reference coordinate"}</>,<>{"Own radius"}</>,<>{"Mean reach"}</>,<>{"lrd"}</>]} rows={[[<>{"0"}</>,<>{"2"}</>,<>{"3/2"}</>,<>{"2/3"}</>],[<>{"1"}</>,<>{"1"}</>,<>{"2"}</>,<>{"1/2"}</>],[<>{"2"}</>,<>{"2"}</>,<>{"3/2"}</>,<>{"2/3"}</>],[<>{"20"}</>,<>{"8"}</>,<>{"6"}</>,<>{"1/6"}</>],[<>{"24"}</>,<>{"4"}</>,<>{"8"}</>,<>{"1/8"}</>],[<>{"28"}</>,<>{"8"}</>,<>{"6"}</>,<>{"1/6"}</>]]} />

<Prose>{"For example, P0's arrows to P1/P2 have distances 1/2 and neighbour radii 1/2, so its mean reach is 1.5. P1's two neighbour radii are 2/2, so both reaches are 2. This is why its lrd is .5 despite its radius being 1. A radius and a mean reach are different statistics."}</Prose>

<Mechanism id="D34" />

<Prose>{""}<strong>{"compare neighbour support with query support."}</strong>{" The "}<strong>{"Local Outlier Factor"}</strong>{" is the average of the selected neighbours' density ratios:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{LOF}_k(Q)=\\frac1k\\sum_{o\\in N_k(Q)}\\frac{\\operatorname{lrd}_k(o)}{\\operatorname{lrd}_k(Q)}."}</MathBlock></div>

<Prose>{"The common query denominator lets us divide mean neighbour lrd by query lrd. Q4 has mean neighbour lrd "}<code>{"(2/3+1/2)/2=7/12"}</code>{"; dividing by 2/5 gives 35/24≈1.45833. Q17 selects P3=20 and P4=24. Their distances 3/7 and radii 8/4 yield reaches 8/7, mean 7.5, query lrd 2/15. Mean neighbour lrd "}<code>{"(1/6+1/8)/2=7/48"}</code>{"; factor 35/32≈1.09375. Although Q17 is farther from its closest neighbour, it is less unusual "}<strong>{"relative to this local spacing"}</strong>{". Q6 instead gives reaches 4/5, lrd 2/9, factor 21/8=2.625. The six training factors are 7/8,4/3,7/8,7/8,4/3,7/8: even this regular two-region fixture need not produce exactly 1 at every acceptable row. A factor near 1 means comparable local support, not a verified acceptable operating state; a high factor is not a fault probability."}</Prose>

<Mechanism id="D35" />

<Prose>{""}<strong>{"changing k changes all the reference statistics."}</strong>{" At k=3, the neighbourhoods cross the large gap. Recompute the reference radii, reaches and lrd before scoring Q4/Q17. Both factors become exactly 1 in this finite fixture. Merely adding a third query neighbour while keeping k=2 reference radii would be a different, inconsistent computation. This null is useful evidence of parameter sensitivity, not a recommendation to choose the k which makes a favourite query ordinary."}</Prose>

<H3>{"Deeper: why local regularity produces a factor near one"}</H3>

<Prose>{"Suppose every reach used in the query's mean "}<strong>{"and in each selected neighbour's own mean"}</strong>{" lies between positive a and b. Every corresponding lrd lies in[1/b,1/a], so each ratio lies in[a/b,b/a], and so does their average. With a=2,b=3 the factor lies in[2/3,3/2]. The drawing must include two hops: query neighbours and their neighbours. Bounds on only the query's outgoing reaches cannot bound the neighbours' lrd. The original LOF analysis uses more detailed local reach bounds; this small derivation explains the shared positive-interval case without silently dropping its neighbourhood-closure assumption. Task O breaks that assumption deliberately."}</Prose>

<Prose>{"Multiplying all distances by a>0 multiplies all radii/reaches by a and divides all lrd by a; exact LOF ratios cancel. This assumes the representation and neighbourhood order are transformed consistently. It does not mean independently rescaling one feature preserves a multifeature Euclidean geometry."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task D — reach, reciprocal, ratio (§10)"}</H3>

<Prose>{"A query's three selected distances are .4,.6,1; their reference-owned radii are .3,.8,.5 and their lrd values 1,2,1.5. Compute reaches, query lrd and factor. Then multiply every geometric length by 10 consistently."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Take three maxima, one mean, one reciprocal, then a density ratio."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Reaches are .4,.8,1, mean 2.2/3=11/15, lrd 15/11. Mean reference lrd is 1.5, so factor 1.5/(15/11)=1.1. After consistent scaling, query and reference lrd both divide by 10 and factor stays 1.1. Averaging reciprocals first would produce another statistic. A fixed epsilon comparable to the lengths would break exact cancellation; the positive unstabilized calculation does not claim that extreme library case."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task E — a farther local query (§10)"}</H3>

<Prose>{"With references 0,1,2,20,24,28 and k2, inspect query 6. Draw its two arrows, label neighbour radii, and compute its factor. Why can k3 not be implemented by merely extending those two arrows?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The selected references remain 2 and 1."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Distances 4/5 dominate radii 2/1. Mean reach 4.5 gives lrd 2/9. Mean neighbour density 7/12 gives factor(7/12)/(2/9)=21/8=2.625. k3 changes every reference radius and lrd as well as query selection; the complete recomputation makes queries 4/17 both factor 1 in the supplied fixture. Retaining k2 reference statistics is inconsistent."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task O — the missing second hop (§10)"}</H3>

<Prose>{"A query's outgoing reaches all lie in[2,3], but one neighbour's own neighbourhood contains reaches far outside this range. May you assert LOF∈[2/3,3/2]? Repair the premise."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The numerator uses neighbours' lrd, which come from other arrows."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"No. Query lrd is bounded, but neighbour lrd need not be. Require every reach used in both the query's and selected neighbours' means to lie in[2,3]. Then each lrd is in[1/3,1/2], each ratio in[2/3,3/2], and the mean obeys the same interval. Draw the two-hop closure to show which extra operations the repaired premise covers."}</Prose>

</details>

</section><H2>{"11. Keep training identity and later queries separate"}</H2>

<Mechanism id="D36" />

<Prose>{""}<strong>{"the coordinate is the same, the allowed identities differ."}</strong>{" For training P1 at 1, self P1 is crossed out, leaving neighbours P0/P2. Its lrd .5 and mean neighbour lrd 2/3 give training factor 4/3. A distinct query Q=1 can select P1 at distance 0 and then P0 at distance 1 under the stable-ID tie rule. Their radii 1/2 give reaches 1/2, query lrd 2/3 and mean neighbour lrd 7/12, hence factor 7/8. Keep both labeled strips visible together. One selected reference ID places the matching distinct query at the same coordinate; it changes the focus in both strips, never hides one task."}</Prose>

<Mechanism id="D37" />

<Prose>{""}<strong>{"equal numerical results do not imply equal tasks."}</strong>{" At coordinate 0, training P0 uses P1/P2, while a distinct Q0 uses P0/P1. Both factors happen to be7/8 in this fixture. Their sets still differ. Equality here is a numerical null, not permission to query the fitted training array and call those results its training factors."}</Prose>

<Prose>{"For the ordinary API, mixed-batch outlier detection uses "}<code>{"LocalOutlierFactor(novelty=False)"}</code>{" and its fitted "}<code>{"negative_outlier_factor_"}</code>{" (or "}<code>{"fit_predict"}</code>{"). A novelty fit uses "}<code>{"novelty=True"}</code>{"; score later queries with "}<code>{"score_samples"}</code>{". Do not use novelty query scores on training rows as a substitute for training factors. Query rows never join each other's or the references' neighbourhoods. Adding a second query must leave the first result unchanged."}</Prose>

<Mechanism id="D38" />

<Prose>{""}<strong>{"ties and duplicates are separate issues."}</strong>{" The original paper's k-distance neighbourhood includes all neighbours tied at the boundary; it may contain more than k rows. Our scratch contract retains exactly k, with stable original IDs for ties. If three other rows are all at the kth distance, these contracts can choose three versus two. Keep the inclusive boundary bracket and exactly-k stable-ID bracket visible together, then show the duplicate and all-identical examples as separate consecutive drawings. Such cases do not establish scratch/library parity. Distinct zero-distance IDs remain eligible: dropping every zero distance would remove legitimate other rows."}</Prose>

<Prose>{"Two duplicate coordinates among "}<code>{"[0,0,2,3]"}</code>{" do not automatically make lrd undefined: a k=2 neighbour can include a nonzero radius and give a positive mean reach. Four identical rows with k=2 do produce zero reaches. The hand definition is then undefined; the ordinary library adds 1e−10 to the mean before taking the reciprocal, yielding finite densities and factor 1 for identical rows. A defined number still contains no information that separates identical observations."}</Prose>

<Mechanism id="D39" />

<Prose>{""}<strong>{"a fixed numerical epsilon has units."}</strong>{" With ordinary stabilization "}<code>{"lrd=1/(meanReach+1e−10)"}</code>{", common scaling need not cancel when reaches are comparable to epsilon. For ordinary-sized positive lengths its influence may be negligible; for zero or tiny lengths it dominates. Compare epsilon 0 and compatibility epsilon 1e−10 in two labeled, simultaneously visible columns as one common scale factor changes. Task P distinguishes a duplicate case from an all-identical case."}</Prose>

<Prose>{"The complete earlier arithmetic and mode demonstrations below retain their recorded outputs. Their conventions and fixtures belong to those programs; they are not refreshed to imitate the new route."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"originals/lof_arithmetic.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="originals/lof_arithmetic.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/lof_arithmetic.py" />

<Prose>{""}<strong>{"Preserved recorded output: "}<code>{"lof_arithmetic"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="lof_arithmetic.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/lof_arithmetic.stdout.txt">{"Reference radii: [2. 1. 2. 8. 4. 8.]\nReference lrd: [0.666667 0.5      0.666667 0.166667 0.125    0.166667]\nReference LOF: [0.875    1.333333 0.875    0.875    1.333333 0.875   ]\nQuery LOF: [1.458333 2.625    1.09375 ]"}</CodeBlock>

<Prose>{""}<strong>{"File: "}<code>{"originals/lof_modes.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="originals/lof_modes.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/lof_modes.py" />

<Prose>{""}<strong>{"Preserved recorded output: "}<code>{"lof_modes"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="lof_modes.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/lof_modes.stdout.txt">{"Training LOF: [0.875    1.333333 0.875    0.875    1.333333 0.875   ]\nNew-query LOF: [2.625   1.09375]\nWrong training comparison: [0.875 0.875 0.875 0.875 0.875 0.875]"}</CodeBlock>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task F — same coordinate, different identity (§11)"}</H3>

<Prose>{"For the six-row fixture, compare training P1 at 1 with a distinct Q at 1 under stable-ID k2. Explain 4/3 versus 7/8 using selected IDs and reaches. Does equality at coordinate 0 disprove this distinction?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Cross out only the training row's own ID."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Training P1 selects P0/P2, both reaches 2, so lrd .5 and mean neighbour lrd 2/3 give 4/3. Q1 selects P1/P0 with reaches 1/2, lrd 2/3 and mean neighbour lrd 7/12, giving 7/8. At0, training P0 selects P1/P2 but Q0 selects P0/P1. Both factors happen to be7/8; their sets are still different. Mode is a membership contract, not an assertion that every resulting scalar differs."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task P — duplicate support (§11)"}</H3>

<Prose>{"Use references 0,0,2,3 with k2, then four identical rows. Is every duplicate case undefined? What does epsilon 1e−10 change?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"A neighbour's radius can floor a zero query distance."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"In0,0,2,3, each duplicate's two selected neighbours include another 0 and 2. Those neighbours have positive kth radii, so its mean reach is positive; duplicates alone do not imply undefined lrd. For all identical rows every radius/distance/reach is 0. Epsilon 0 refuses the reciprocal; epsilon 1e−10 yields finite lrd 10¹⁰ and factors 1. Do not drop the other zero-distance IDs or interpret factor 1 as recovered identity information."}</Prose>

</details>

</section><H2>{"12. Build a bounded-memory LOF route"}</H2>

<Mechanism id="D40" />

<Prose>{""}<strong>{"retrieve one outer block, then remove one global ID."}</strong>{" Recall the earlier KNN primitive: its temporary distance grid has b query rows and n reference columns. It accumulates Euclidean distance feature by feature, partitions the kth boundary, and orders only the selected candidates, using IDs to resolve cutoff ties. Its complete source is reused unchanged here. Read "}<code>{"batched_top_k"}</code>{" as the operative import; its "}<code>{"main"}</code>{" remains an earlier demonstration and is not executed by the new imports."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"prerequisites/batched_top_k.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="prerequisites/batched_top_k.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/prerequisites/batched_top_k.py" />

<Prose>{"For a training block starting at global row "}<code>{"start"}</code>{", request k+1 candidates. In block row "}<code>{"local"}</code>{", remove "}<strong>{"only"}</strong>{" identity "}<code>{"start+local"}</code>{" if present, then keep the first k. Using "}<code>{"local"}</code>{" alone would exclude the wrong reference after block 0. If a duplicate tie pushes own ID outside the prefix, keep its first k: own ID is absent, and the prefix already contains enough other rows. For k=n−1 request n, then retain all n−1 other identities. Later queries request k directly and exclude no reference identity. These operations adapt the unchanged helper instead of assuming an exclusion parameter it does not have."}</Prose>

<Mechanism id="D41" />

<Prose>{""}<strong>{"frozen radii and lrd feed every query."}</strong>{" Store the reference matrix, selected neighbour IDs/distances, radii, reaches, lrd and training factors. A new query block retrieves its own selected references, looks up their stored radii/lrd, and computes reach→mean→reciprocal→ratio. Fitting first computes the entire candidate locally: reference/order, neighbours/distances, radii/reaches, lrd/factors and the fitted k/epsilon/batch metadata. It publishes them only after the finite-positive density and factor checks succeed. A rejected fit publishes no new bundle. If a complete previous bundle exists it remains unchanged, and the error explicitly names that retained previous reference; later queries use its fitted parameters. With no prior valid bundle, queries are refused. A reference attribute alone never signals readiness. These guarantees apply at the method return/exception boundary, not as a promise of concurrent fitting. An empty query yields shaped empty arrays. Feature names must match the published reference in order."}</Prose>

<Prose>{"Finite distances need a numerically safe reduction too. For two reaches 1e308 and 1e308, adding first overflows even though their mean is the representable 1e308. "}<code>{"nonnegative_mean"}</code>{" keeps the ordinary reduction when it is finite. Otherwise it takes the largest operand r, averages the ratios reach/r (each at most 1), and multiplies by r afterward. This changes the order of floating-point operations, not the definition of mean reach. The reciprocal must be finite and strictly positive; a positive length near 1e−320 has an unrepresentable reciprocal and is refused. Adding a declared epsilon can also overflow, so the stabilized denominator is checked."}</Prose>

<Prose>{"For LOF, the usual mean of neighbor/query-density ratios stays unchanged when those ratios are finite. If an individual ratio overflows, average the neighbor densities first and divide that average by the query density. Only a finite positive final factor is supported. A valid reference plus Q=1e308 selects P0/P1 under the stable-ID tie rule, has reaches 1e308/1e308, lrd about 1e−308 and factor about 5.833333333333333e307. A mathematically positive factor outside float64's range is reported as unavailable, not returned as silent infinity or zero. These reductions use O(k) work per row and preserve the route's O(nk)/O(qk) array bounds. Requested batch size and epsilon are validated again before a new fit; they never replace the previous fitted choices on rejection."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"lof_core.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="lof_core.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/lof_core.py" />

<Mechanism id="D42" />

<Prose>{""}<strong>{"compare actual intermediate arrays before scores."}</strong>{" Keep scratch and ordinary-library results visible in named parallel columns: training factors in one aligned row, later-query factors in another. A block-size control changes scratch workspace without selecting a display mode. The driver prints the complete six-row hand state and changed queries. For the ordinary comparison it explicitly switches to an untied fixture "}<code>{"[0,.7,2.3,8.1,12.8,20.2]"}</code>{", uses brute Euclidean search/k=2 and epsilon 1e−10, and compares both training factors and later scores. "}<code>{"NearestNeighbors"}</code>{" checks the later selected IDs. The duplicate fixture is a separate adapter check, not a claim about backend tie order."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"lof_mechanisms.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="lof_mechanisms.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/lof_mechanisms.py" />

<Prose>{""}<strong>{"Recorded example output (reused): "}<code>{"lof_mechanisms"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="lof_mechanisms.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/lof_mechanisms.stdout.txt">{"radii: [2.0, 1.0, 2.0, 8.0, 4.0, 8.0]\nreference lrd: [0.666666667, 0.5, 0.666666667, 0.166666667, 0.125, 0.166666667]\nqueries4/17/6/1 neighbors: [[2, 1], [3, 4], [2, 1], [1, 0]]\nquery reach: [[2.0, 3.0], [8.0, 7.0], [4.0, 5.0], [1.0, 2.0]]\nquery factors: [1.458333333, 1.09375, 2.625, 0.875]\ntraining row1 factor: 1.333333333\nk3 factors: [1.0, 1.0]\nordinary later factors: [1.137123746, 1.044692737]\nduplicate row3 other IDs: [0, 1] distances: [0.0, 0.0]\nidentical stabilized factors: [1.0, 1.0, 1.0, 1.0]"}</CodeBlock>

<Prose>{"This valid-case stream is the preserved earlier driver output. Its finite ordinary reductions remain the same; the added range guards and overflow fallback are not presented as another execution of this fitting driver. The following new small program supplies the already hand-computed complete six-row bundle directly, then exercises only rejected zero-reference candidates and queries. It does not claim a successful fit occurred when supplying that bundle."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"lof_rejected_fit.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="lof_rejected_fit.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/lof_rejected_fit.py" />

<Prose>{""}<strong>{"Actual rejected-state witness output: "}<code>{"lof_rejected_fit"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="lof_rejected_fit.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/lof_rejected_fit.stdout.txt">{"fresh rejected: Zero mean reach is undefined without a declared stabilizer. No fitted reference is available.\nfresh query: Fit a complete valid reference first.\nexisting rejected: Zero mean reach is undefined without a declared stabilizer. Previous fitted reference retained.\nretained reference: [0.0, 1.0, 2.0, 20.0, 24.0, 28.0]\nquery1 before/after: 0.875 0.875\nrequested k/fitted k: 3 2\npartial query: Fit a complete valid reference first."}</CodeBlock>

<Prose>{"A fresh rejected object refuses queries. A previously complete reference remains exactly the same bundle: query 1 stays at 7/8 before and after rejection, rather than returning the hybrid 7/12. Changes to choices for a next fit do not alter the published fitted k/epsilon. An incomplete object containing only a reference array is also refused."}</Prose>

<H3>{"Deeper: memory savings do not remove quadratic distance work"}</H3>

<Prose>{"For dense brute search, training work is O(n²d+n²+nk log k) with partial selection and sorting of k retained candidates. Later q queries cost O(qnd+qn+qk log k). Retained reference state includes O(nd+nk); all inspected query outputs add O(qk). The distance workspace is O(bn), and training candidates use O(b(k+1)). Thus a conservative retained-plus-working bound is O(nd+nk+bn+b(k+1)+qk). There is no b×n×d full difference tensor in this reused primitive. Increasing b changes workspace, not the exact neighbour result under the declared tie rule."}</Prose>

<Prose>{"For n=10000,b=16,k=20,d=4, one float64 distance grid uses 160000×8=1.28MB, versus 800MB for a retained n² grid. The 200000 neighbour IDs and 200000 distances require their own storage, about 1.6MB each for 8-byte entries; radii/lrd/input are additional. These decimal MB are arithmetic examples, not measured process memory. Tree-based neighbour indexes can prune in favourable geometry; high-dimensional data can remove that advantage. Approximate neighbours can change radii and all downstream factors, so they require score validation, not merely a faster search timing. Visit KNN's search section for that owner’s full index treatment."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task Q — price blocked retrieval (§12)"}</H3>

<Prose>{"For n10000,b16,k20,d4, compute float64 distance-workspace bytes and compare a full retained n² grid. Account for selected IDs/distances separately. What remains quadratic?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"One stored double takes 8 bytes; IDs also occupy storage."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"bn=160000 doubles use 1280000 bytes=1.28 decimalMB. n²=100000000 doubles use 800MB. nk=200000 distances use 1.6MB and 8-byte IDs another 1.6MB, plus reference/radii/lrd/query outputs. Training candidate arrays b(k+1) also exist. Blocking avoids retaining n² distances, but brute arithmetic still examines n² pairs across d features. Approximate search needs downstream score validation; smaller workspace alone proves no detection equivalence."}</Prose>

</details>

</section><H2>{"13. Draw a support boundary from kernel similarities"}</H2>

<Prose>{"Local density is not the only way to describe a reference. What if we find a boundary containing much of its represented support? Recall from "}<a href={"/learn/path/full-curriculum/support-vector-machines-svm?module=classical-ml"}>{"SVM"}</a>{" that a feature vector can be projected onto a normal vector w. Classification separated two labeled groups; "}<strong>{"one-class support estimation has no negative training class"}</strong>{"."}</Prose>

<Mechanism id="D43" />

<Prose>{""}<strong>{"a separator in an actual feature plane."}</strong>{" Label the horizontal feature coordinate φ1 and vertical feature coordinate φ2. These are the two entries of the mapped vector φ(x), not two extra raw measurements. Draw the feature origin (0,0), reference vectors (1,0)/(0,1), w=(.5,.5), and the line "}<code>{".5φ1+.5φ2=.5"}</code>{". The line separates those reference projections from the feature origin. Its distance from the origin is ρ/‖w‖=.5/√.5. A query feature vector (.2,.2) has raw projection .2, so its signed residual is .2−.5=−.3; (1,1) gives 1−.5=.5. The origin is a feature-space anchor, "}<strong>{"not"}</strong>{" a known bad raw observation with level 0. This finite linear-feature picture introduces the parts before a nonlinear kernel. It is not a drawing of two coordinates of an infinite-dimensional RBF feature space."}</Prose>

<Mechanism id="D44" />

<Prose>{""}<strong>{"a kernel entry is a similarity between two rows."}</strong>{" Explicitly switch to raw one-dimensional anchors −1 and+1. The radial basis function (RBF) kernel is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"K(x,z)=\\exp(-\\gamma\\lVert x-z\\rVert^2),\\qquad \\gamma>0."}</MathBlock></div>

<Prose>{"Draw Q=0's distance 1 to each anchor, squared distance 1, then an "}<code>{"exp(−γ)"}</code>{" similarity bar. At γ=1 both entries are e−1. At an anchor its similarity to itself is 1. A rectangular query Gram matrix has queries as rows and references as columns; its entry compares matching feature order. γ has inverse-square-coordinate units; in the alternate kernel form exp(−distance²/(2σ²)), γ=1/(2σ²), notσ. The ordinary "}<code>{"gamma='scale'"}</code>{" computes γ from fitted data variance; it does not standardize each feature. We choose γ explicitly here so every operand is visible. A kernel expresses an inner product in a feature space; it is not a probability that two machines share a fault."}</Prose>

<Mechanism id="D45" />

<Prose>{""}<strong>{"add weighted similarities, then subtract an offset."}</strong>{" Two equal anchors have normalized coefficients α1=α2=.5. Draw each similarity multiplied by .5, their sum, and the horizontal offset level"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\rho=\\frac{1+e^{-4\\gamma}}2,\n\\qquad g(x)=\\tfrac12 K(x,-1)+\\tfrac12 K(x,1)-\\rho."}</MathBlock></div>

<Prose>{"At γ=1, Q0 has raw sum e−1 and g(0)=−.141278378. At γ=.1 the midpoint residual is+.069677395. Exactly at either anchor, raw=ρ and the analytic residual is 0. Positive g lies on the represented-support side; negative g lies outside this fitted boundary. For the same input/task, A=−g is a higher-unusual ordering. An external threshold can differ from the library's built-in zero decision boundary."}</Prose>

<Mechanism id="D46" />

<Prose>{""}<strong>{"a feature hyperplane can make disconnected input pieces."}</strong>{" Plot the weighted kernel sum and the offset only after their contributions have been built. Project the zero crossings down onto the raw input line. At γ=1, positive support pieces lie approximately between −1 and−.914541906, and between .914541906 and 1. The midpoint is outside even though it sits between the anchors. At γ=.1 the midpoint is inside. A narrow positive piece cannot be declared absent merely because a coarse pixel scan missed it: use analytic bounds/root refinement or label the scan unresolved. These two-anchor coefficients are an analytic symmetric solution; editing general reference arrays requires the actual fitting procedure in §§14–15."}</Prose>

<Mechanism id="D47" />

<Prose>{""}<strong>{"scale all operands together."}</strong>{" Anchors ±2 with γ=.25, and query 2Q, have the same kernel exponents as anchors ±1 with γ=1 and query Q. At the midpoint the residual remains−.141278378. Scaling just the anchors while keeping a nonzero query unscaled does not preserve those distances. Task G asks for both the arithmetic and the units."}</Prose>

<Prose>{"For this fit, raw normality is the weighted sum, while g subtractsρ. Thus "}<code>{"A_raw=−raw"}</code>{" and "}<code>{"A_decision=−g=A_raw+ρ"}</code>{" have the same ordering but shifted threshold values. The real saved study uses negative "}<strong>{"raw "}<code>{"score_samples"}</code>{""}</strong>{", not negative decision; its thresholds must stay on that raw scale. LIBSVM's additional νn scaling in §14 also matters when transferring a threshold. The complete earlier analytic program and recorded output follow. They evaluate the symmetric formula, rather than invoking a general optimizer; their exact-anchor zero is an informative null."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"originals/kernel_boundary.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="originals/kernel_boundary.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/kernel_boundary.py" />

<Prose>{""}<strong>{"Preserved recorded output: "}<code>{"kernel_boundary"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="kernel_boundary.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/kernel_boundary.stdout.txt">{"gamma=0.1: midpoint=+0.069677, reference=+0.000000\ngamma=1.0: midpoint=-0.141278, reference=+0.000000"}</CodeBlock>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task G — scale a kernel (§13)"}</H3>

<Prose>{"Anchors are±2, γ=.25, α=.5/.5. Computeρ and g(0), then explain when this boundary agrees with anchors±1/γ1."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compare the squared anchor-to-anchor and query-to-anchor distances."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Anchor-to-anchor squared distance 16 timesγ.25 is 4, soρ=(1+e−4)/2. Each midpoint similarity is e−1, givingg(0)=e−1−ρ≈−.141278378. The whole decision function agrees under x→2x only if queries are also scaled by 2. γ rescales by 1/2². Scaling anchors alone while leaving a general nonzero query fixed is not the same geometry."}</Prose>

</details>

</section><H2>{"14. Explain the one-class objective and nu bounds"}</H2>

<Prose>{"How do the coefficients and offset get chosen for general references? "}</Prose>

<Mechanism id="D48" />

<Prose>{""}<strong>{"projection shortfall is slack."}</strong>{" Draw each training projection "}<code>{"raw_i=w·φ(x_i)"}</code>{" on a ruler, an offsetρ, and an upward shortfall ξi=max(0,ρ−raw_i). Raisingρ pushes a boundary away from the origin, but can create shortfalls. A large w also costs squared norm. The normalized primal balances these terms:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\min_{w,\\rho,\\xi}\\ \\frac12\\lVert w\\rVert^2+C\\sum_i\\xi_i-\\rho,\n\\quad w\\cdot\\phi(x_i)\\ge\\rho-\\xi_i,\\quad\\xi_i\\ge0,\n\\quad C=\\frac1{\\nu n},\\quad0<\\nu\\le1."}</MathBlock></div>

<Prose>{"n is the number of training references. ν adjusts the admissible mass per reference and the shortfall tradeoff; it changes the fit, unlike an external threshold applied afterward. The score is a support decision, not a normalized density or fault probability."}</Prose>

<H3>{"Deeper: derive the normalized dual instead of borrowing a classifier fit"}</H3>

<Prose>{"Introduce αi≥0 for the projection constraints and μi≥0 for ξi≥0. Stationarity gives w=Σαiφ(xi), Σαi=1 (differentiateρ), and C−αi−μi=0 (differentiateξi). Thus 0≤αi≤C. Substituting eliminates w,ρ,ξ and yields"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\min_\\alpha Q(\\alpha)=\\tfrac12\\alpha^\\top K\\alpha,\n\\qquad \\sum_i\\alpha_i=1,\\quad0\\le\\alpha_i\\le C."}</MathBlock></div>

<Prose>{"A positive-semidefinite Gram matrix makes this a convex quadratic. The earlier classifier's labels, objective and equality are different; its "}<code>{"fit"}</code>{" cannot be used with invented labels to solve this problem. We reuse its kernel operation only. Nonunique coefficients can define the same score function and objective."}</Prose>

<Mechanism id="D49" />

<Prose>{""}<strong>{"one unit of mass must fit below the caps."}</strong>{" Here n is a positive integer, while ν is a finite real scalar in (0,1]. For the native illustration n ranges from 2 through 16; the formal bound does not require ν to be an integer. For n=8,ν=.5, C=.25. Draw eight coefficient columns and a total-mass bracket 1, with feasible weights (.25,.25,.25,.25,0,0,0,0). When changing n or ν, construct a feasible mass by filling each successive column up to C from the remaining total 1; do not expose unrelated weight sliders that break the constraint. At n=8,ν=.25 two weights .5 suffice; at ν=1 all eight are fixed at 1/8. Three positive columns can hold at most .75, so at least four supports are required. In general the number s of nonzero α satisfies 1=Σα≤sC, hence s≥νn (rounded up for an integer count)."}</Prose>

<Prose>{"Complementary slackness says a "}<strong>{"strict"}</strong>{" training shortfall ("}<code>{"raw_i<ρ"}</code>{") has αi=C. If v such rows exist, vC≤Σα=1, so v≤νn (rounded down). These are training statements at an exact optimum under the stated formulation. They do not bound tomorrow's alert fraction, fault rate or misclassification rate. Numerical near-zero signs and nonzero/offset assumptions in the original support-estimation theorem matter; a rounded negative boundary residual is not automatically a strict theoretical violator. The paper's asymptotic equality additionally assumes independently generated non-discrete data and an analytic nonconstant kernel. A finite sensor stream with temporal dependence does not inherit that conclusion. Task H uses only the finite training bound."}</Prose>

<Mechanism id="D50" />

<Prose>{""}<strong>{"zero, free and capped coefficients locateρ differently."}</strong>{" At an optimum, α=0 has raw≥ρ;0<α<C has raw=ρ;α=C has raw≤ρ. If free entries exist, use their common raw value (a mean under a declared numeric tolerance). If none exist, the admissible interval is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\max_{\\alpha_i=C} raw_i\\ \\le\\rho\\le\\ \\min_{\\alpha_i=0} raw_i."}</MathBlock></div>

<Prose>{"With ν=1 every α is forced to 1/n=C. There are no zero/free entries, so choose finiteρ=max(raw); do not take a mean of an empty array. Keep the free-entry, no-free-interval and ν=1 drawings in sequence, with their coefficient cases and offset rule visible in each; a selected row can highlight operands without replacing a case. An inconsistent interval is a failed offset/KKT certificate. Our small implementation raises a diagnostic instead of patching an invalid interval into a claimed optimum. Feasible intermediate all-bound states may also lack this optimum interval; such a failure stops this teaching solver and is a declared support boundary, not proof the convex problem is infeasible."}</Prose>

<Mechanism id="D51" />

<Prose>{""}<strong>{"ordinary coefficients use another scale."}</strong>{" For unit weights, LIBSVM uses coefficients β with cap 1 and sumνn. Normalize α=β/(νn),ρ=offset_/(νn), and its decision function by the same scale. At n=2,ν=.5 the scale is 1; atν1 it is 2. Equal allocation is not required on a nonunique solution: compare feasibility, objective and score function. Sample weights change the coefficient contract and are outside this bridge. At an exact ordinary decision 0, the library predicts −1; our strict external A>τ leaves an exact threshold tie unflagged. Record both conventions rather than calling their labels identical."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task H — what ν bounds (§14)"}</H3>

<Prose>{"At an exact normalized fit with n80,ν.15, derive the coefficient cap, minimum support count and maximum strict training-shortfall count. What can be said about tomorrow's80 readings?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"One unit of mass must fit below the caps."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"C=1/(.15·80)=1/12. At least 12 positive coefficients are needed to sum 1. Every strict violator has coefficientC, so at most 12 strict training violators can exist under the optimum/KKT assumptions. These do not bound tomorrow's scores or fault labels. Near-zero numeric residuals, offset assumptions and temporal dependence cannot be ignored when applying the theoretical statement."}</Prose>

</details>

</section><H2>{"15. Move a coefficient pair and check the fitted result"}</H2>

<Mechanism id="D52" />

<Prose>{""}<strong>{"transfer mass between two columns."}</strong>{" A pair move αi←αi+δ, αj←αj−δ preserves the sum. The caps require"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\max(-\\alpha_i,\\alpha_j-C)\\le\\delta\\le\\min(C-\\alpha_i,\\alpha_j)."}</MathBlock></div>

<Prose>{"For α=(.2,.3,.5),C=.6,pair 0/2, the interval is[−.1,.4]. δ=.1 gives(.3,.3,.4). Moving just one column would break sum 1. The live pair selector and δ operate on this already taught feasible segment; they do not become a many-field reference editor."}</Prose>

<Mechanism id="D53" />

<Prose>{""}<strong>{"the Gram cells determine the quadratic along that segment."}</strong>{" Let raw=Kα and η=Kii+Kjj −2Kij. Along the pair direction,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"Q(\\delta)=Q(0)+\\delta(raw_i-raw_j)+\\tfrac12\\eta\\delta^2."}</MathBlock></div>

<Prose>{"For the supplied Gram "}<code>{"[[1,.5,.1],[.5,1,.2],[.1,.2,1]]"}</code>{", raw=(.4,.5,.58),η=1.8. The unconstrained minimizer is(.58−.4)/1.8=.1, already feasible. Q decreases from .26 to .251. Update the gradient by "}<code>{"raw←raw+δ(K[:,i]−K[:,j])"}</code>{", giving(.49,.53,.49). One improving pair is not a whole optimum. If η=0, use the linear descent endpoint or 0 instead of dividing by zero. For RBF, η=−2·expm1(−γ‖xi−xj‖²) avoids subtracting two nearly equal numbers for close pairs. The geometry is fixed, so our implementation caches these curvatures once; it does not repeat O(d) curvature work for every scanned pair at every step."}</Prose>

<Prose>{"The complete earlier SVM core is below. It is copied unchanged. The only operation called here is "}<code>{"PairSVM(...).matrix"}</code>{"; classification fitting remains unused. Its finite coordinate/gamma guards and feature ordering are real support limits, not invisible implementation details."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"prerequisites/svm_core.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="prerequisites/svm_core.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/prerequisites/svm_core.py" />

<Mechanism id="D54" />

<Prose>{""}<strong>{"a trace needs a certificate and a status."}</strong>{" After each feasible state, recoverρ, compute ξ=max(0,ρ−raw), Q=.5α·raw, primal P=Q+CΣξ−ρ and dual D=−Q. The primal-dual gap P−D=P+Q is nonnegative for valid feasible primal/dual states. Accept only when "}<code>{"gap≤tolerance·max(1,|P|)"}</code>{". Keep the actual status and current trace if a step limit or improvement floor stops earlier. A tiny objective change alone is not the declared convergence criterion. The code validates mass/caps, rejects a materially negative/nonfinite gap, and clamps only a tiny rounding-negative gap to 0. Fitting constructs reference/order, coefficients, raw projections, offset/certificate, supports, trace/status and the fitted kernel choices locally. Only a complete candidate is published. If constructing or certifying it raises, a previous complete bundle remains available with its old feature labels and kernel; a fresh object remains unavailable. Step-limit and stalled candidates that have a valid certificate can still return with those explicit unconverged statuses. That is different from an exception that publishes nothing. Changing gamma, nu or a public kernel for the next fit cannot rescore old supports under a new kernel. Scoring uses a separate fitted kernel and the published feature order. These are method-boundary guarantees, not a concurrency protocol."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"one_class_core.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="one_class_core.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/one_class_core.py" />

<Prose>{"This dense teaching solver supports 2…100 reference rows,1…20 columns, finite coordinate magnitudes≤1000 and the reused kernel's γ range. It scans all pairs deterministically, maintains the gradient, keeps all strictly positive coefficients, and records its final state. Its bound classification uses a small absolute tolerance capped relative toC. An inconsistent no-free interval raises a certificate error; other unconverged states remain labeled and must not be presented as optimal fits. It is an inspectable small solver, not a production substitute for LIBSVM or a claim of uniform convergence within 10000 steps."}</Prose>

<Prose>{"The driver below uses three new tiny supplied references, ordinary "}<code>{"OneClassSVM(nu=.5,gamma=1,tol=1e−9,max_iter=10000,cache_size=32)"}</code>{", and normalized objective/query comparisons. It also checksν1, coincident rows and a zero-step limit. There is no real-stream refit."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"one_class_mechanisms.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="one_class_mechanisms.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/one_class_mechanisms.py" />

<Prose>{""}<strong>{"Recorded example output (reused): "}<code>{"one_class_mechanisms"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="one_class_mechanisms.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/one_class_mechanisms.stdout.txt">{"rows 2 status gap passed steps 0 gap 0\nalpha: [0.5, 0.5] rho: 0.509157819 native fit_status: 0\nnormalized query decisions: [0.0, 0.0, -0.141278378]\nrows 3 status stalled before gap criterion steps 14 gap 2.58e-08\nalpha: [0.37124523, 0.257509595, 0.371245176] rho: 0.4334262 native fit_status: 0\nnormalized query decisions: [3.6e-08, -1.8e-08, -1.8e-08, 0.002852796]\nrows 4 status gap passed steps 18 gap 4.53e-09\nalpha: [0.286767303, 0.205344426, 0.216458578, 0.291429693] rho: 0.336868668 native fit_status: 0\nnormalized query decisions: [8e-09, -2e-09, -3e-09, -3e-09, -0.027101522]\nnu1 alpha/rho/gap: [0.5, 0.5] 0.509157819 0.0\ncoincident nu1 decision: [0.0, -0.9816843611112658]\nzero-step status/gap: step limit 0.034633577"}</CodeBlock>

<Prose>{"The displayed driver stream is an earlier recorded run; the atomic publication change is not claimed as a new solver or library execution. The three-row scratch fit "}<strong>{"stalled before its gap criterion"}</strong>{", at gap≈2.58e−8. Its objective/function still agree with the ordinary fit within the explicitly tested 2e−8/2e−7 absolute tolerances. Those comparisons do not upgrade its status to converged. The two-row and four-row states passed their gap criterion. "}<code>{"fit_status_=0"}</code>{" is the ordinary solver's recorded status. The zero-step case retains a positive gap≈.034633577. At coincidentν1 rows, normalized g is 0 at the reference and about−.981684361 at query 2; this boundary result does not distinguish identical reference identities. Correctly shaped empty queries produce an empty output."}</Prose>

<H3>{"Deeper: price the actual tensors, then choose an approximate route honestly"}</H3>

<Mechanism id="D55" />

<Prose>{""}<strong>{"two successive local cost drawings."}</strong>{" First draw training Gram n×n and a block of RBF coordinate differences "}<code>{"min(n,block_rows)×n×d"}</code>{". During queries, the outer adapter calls the unchanged matrix on at most b query rows and s fitted supports. Each call "}<strong>{"returns b×s"}</strong>{", and its inner difference temporary is "}<code>{"min(b,block_rows)×s×d"}</code>{", with squared/exp arrays "}<code>{"min(b,block_rows)×s"}</code>{". A single full-q call would still return q×s despite inner blocking; it is not this bounded adapter. A float64 returned block uses 8bs bytes; the difference tensor uses 8min(b,block_rows)sd bytes. Draw the outer call arrows and b-length result explicitly."}</Prose>

<Prose>{"Dense fitting builds Gram and curvature in O(n²d), retaining O(n²) fitting workspaces; an all-pair scan is O(n²), and one maintained-gradient update O(n). The fixed inner block bound 16 still contributes up to 16nd temporary differences during Gram construction. Scoring costs O(qsd), with query workspace O(min(b,block_rows)sd+bs+b), input O(qd), output O(q), and fitted supports/coefficients O(sd+s). "}<strong>{"This inspectable class additionally retains the full reference copy, α, raw and certificate arrays"}</strong>{", O(nd+n), and a per-step trace O(steps). Those audit objects do not disappear from its actual memory price. Gram/curvature are local fitting arrays released after "}<code>{"fit"}</code>{"; a library kernel cache can reduce repeated work, not abolish worst-case kernel costs."}</Prose>

<Prose>{"Now draw a separate finite feature map n×m and its learned one-class linear weights. The ordinary Nystroem and random Fourier routes reuse the "}<a href={"/learn/path/full-curriculum/support-vector-machines-svm?module=classical-ml"}>{"SVM finite-map treatment"}</a>{". A Nystroem map chooses m landmarks and normalizes kernel features, with dense O(nmd+nm²+m³) work and O(nm+m²+nd) storage. RFF mapping costs O(ndm), with O(dm+nm) map storage; each SGD pass costs O(nm). The map is fitted on references only. Rank, seed and finite optimization change the model, so these approximate decisions do not establish equality or comparable detection quality to exact RBF LIBSVM."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"one_class_features.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="one_class_features.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/one_class_features.py" />

<Prose>{""}<strong>{"Recorded example output (reused): "}<code>{"one_class_features"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="one_class_features.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/one_class_features.stdout.txt">{"Nystroem reference map shape: (6, 4) iterations: 27\napproximate decisions: [0.044861761, -0.468197837]\nRFF reference map shape: (6, 8) iterations: 18\napproximate decisions: [0.035088285, -0.204079393]"}</CodeBlock>

<Prose>{"The fixed six-row illustration has map shapes 6×4 and 6×8 and recorded iteration counts 27/18. Positive/negative outputs are approximate support decisions for its two supplied queries. They are not accuracy scores, timing claims or evidence for a universal dataset-size cutoff. D55's dense drawing has only n/b controls; the following finite-map drawing has m only. Tasks R/S reconstruct the pair step and no-free boundary before selecting a computational route."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task R — one pair update (§15)"}</H3>

<Prose>{"Use α(.2,.3,.5),C.6 and Gram "}<code>{"[[1,.5,.1],[.5,1,.2],[.1,.2,1]]"}</code>{". For pair 0/2 derive the feasible interval, optimal δ, new coefficients/raw and objective decrease. Is this a whole fitted solution?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compute Kα first, then the scalar quadratic along the mass-transfer direction."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"raw=(.4,.5,.58). The diagonal operands are 1 and 1, and the cross entry .1, soη=1+1−2·.1=1.8. Bounds max(−.2,.5−.6)=−.1 and min(.6−.2,.5)=.4. δ=(.58−.4)/1.8=.1 givesα(.3,.3,.4). The column update gives raw(.49,.53,.49). Q initially .5(.08+.15+.29)=.26; ΔQ=.1(−.18)+.5·1.8·.01=−.009, hence .251. Sum 1 and caps remain valid. Other pairs/certificate still need checking; one exact pair step does not certify the whole optimum."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task S — no free coefficient (§14/15)"}</H3>

<Prose>{"For two RBF anchors±1,γ1,ν1, findα,C,ρ,slack/gap and the ordinary scaling. Explain why “average free values” fails here."}</Prose>

<details><summary>Hint</summary>

<Prose>{"With cap 1/2 and sum 1 both coefficients are forced to their cap."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"α=(.5,.5),C=.5. Both raw values are(1+e−4)/2; chooseρ equal to that finite maximum. ξ0 and primal-dual gap 0. There are no free entries, so their mean is undefined. LIBSVM β sumνn=2;β=(1,1), and its decision is 2g. For generalν1 raw values need not all match; choosing max(raw) gives finite primal slack and gap 0 because the uniform capped dual is the only feasible state. Coincident rows need the same mass reasoning, not division by zero curvature."}</Prose>

</details>

</section><H2>{"16. Match a mechanism to the observation and the review budget"}</H2>

<Prose>{"Which comparison can notice the difference that matters? "}</Prose>

<Mechanism id="D56" />

<Prose>{""}<strong>{"three mechanisms face actual failure geometries."}</strong>{" Draw a compact unusual group beside a broad acceptable group, a rare legitimate regime absent from a reviewed reference, a rotated elongated reference cloud, and a noisy extra coordinate. Keep these four named geometries in consecutive inline drawings, so each assumption and its affected operation remain visible without a scenario selector. Connect each to the operation it affects: cut lengths, neighbour radii/ratios, or kernel similarities. Isolation can mask a group that supplies its own partitions; local support can call a dense group ordinary; an RBF boundary can reject a legitimate unseen regime. A represented causal change or context may be necessary before any of them can detect the intended difference. The choice should follow the observation and reference assumptions, not a three-method winner table."}</Prose>

<Prose>{"What happens when an apparently good operating point meets a rare target? "}</Prose>

<Mechanism id="D57" />

<Prose>{""}<strong>{"the alert denominator joins two population pieces."}</strong>{" Use a "}<strong>{"hypothetical labeled population"}</strong>{", not NAB. For N=100000, prevalence p=.001 gives 100 target cases and 99900 others. Sensitivity t=.8 flags 80 targets; false-alert rate f=.01 flags 999 others. The alert queue contains 1079 records, so precision is 80/1079≈7.41%. With prevalence .01 and the same rates, it contains 800+990=1790, precision≈44.69%. The shapes must show the two different denominators and the joined alert bracket before the formula:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\operatorname{precision}=\\frac{pt}{pt+(1-p)f},\\quad\n\\operatorname{expected\\ alerts}=N[pt+(1-p)f]."}</MathBlock></div>

<Prose>{"If nobody is flagged, precision is undefined, not 0 or 1. Rates are supplied assumptions about a labeled task, not properties estimated by an unsupervised score. "}<a href={"/learn/path/full-curriculum/evaluation-metrics-precision-recall-f1-auc-roc-ap-r-mae?module=classical-ml"}>{"Evaluation metrics"}</a>{" develops the full confusion counts and ranking metrics. Revisit its precision/recall treatment when collecting verified labels; annotation-window membership alone cannot supply this denominator."}</Prose>

<Mechanism id="D58" />

<Prose>{""}<strong>{"a finite queue and a cost attach to selected IDs."}</strong>{" Return to A…E with scores 1,1,2,4,4. A strict τ2 selects D/E. τ4 selects nobody. A top-B1 policy chooses D under stable-ID tie order. Now supply "}<strong>{"known truth only for this tiny fixture"}</strong>{", positive IDs C/D, review cost 2 per selected record and miss cost 10 per unreviewed positive. Keep the strict-threshold queue and top-B queue visible together. Their controls are τ, integer budget B and review cost; miss cost stays fixed at 10. Each queue has its own selected-ID and cost result. Draw review-cost tokens along selected IDs and miss-cost tokens along C/D when missed:"}</Prose>

<NeuralTable caption={"16. Match a mechanism to the observation and the review budget"} headers={[<>{"Policy"}</>,<>{"Reviewed"}</>,<>{"Missed positives"}</>,<>{"Cost"}</>]} rows={[[<>{"Strict score>2"}</>,<>{"D,E"}</>,<>{"C"}</>,<>{"2·2+10=14"}</>],[<>{"Strict score>4"}</>,<>{"none"}</>,<>{"C,D"}</>,<>{"0+2·10=20"}</>],[<>{"Top1"}</>,<>{"D"}</>,<>{"C"}</>,<>{"2+10=12"}</>]]} />

<Prose>{"This is a decision contract, not an estimate of optimal NAB costs. An external budget can constrain attention without verified truth; it cannot tell us the number of missed faults. Top-B changes the selected operating point, so the sensitivity/false-alert rates of another threshold cannot be copied onto it. Task I compares expected workload with B=200."}</Prose>

<Prose>{"The complete pure policy program implements strict thresholds, the higher sample quantile, deterministic top-B, the hypothetical denominator, and the supplied-truth cost. Empty top-B0 and no-alert precision are coherent cases; an empty calibration quantile is refused. The quantile index is "}<code>{"ceil(q(n−1))"}</code>{" in sorted zero-based order. A "}<code>{".8"}</code>{" quantile of 1,1,2,4,4 is 4, giving zero strict alerts. Contamination uses a library offset policy; ν changes one-class fitting. Neither is an unlabeled promise of future false-alert control."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"score_policy.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="score_policy.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/score_policy.py" />

<Prose>{""}<strong>{"Recorded example output (reused): "}<code>{"score_policy"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="score_policy.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/score_policy.stdout.txt">{"threshold2 ['D', 'E'] cost: 14.0\nthreshold4 [] cost: 20.0\ntop1 ['D'] cost: 12.0\nhigher q=.8 threshold: 4.0\npopulation true/false/total/precision: 90.0 249.5 339.5 0.265095729"}</CodeBlock>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task I — a budget meets base rates (§16)"}</H3>

<Prose>{"Suppose N50000,prevalence .002,sensitivity .9,false-alert rate .005 and review budget 200. Compute expected true alerts, false alerts, total, precision and whether the budget suffices. May top 200 retain 90% sensitivity automatically?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"False alerts come from the 49900 non-target cases."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Targets 100 produce 90 true alerts;49900 others produce 249.5 expected false alerts. Total 339.5 exceeds 200. Precision 90/339.5≈.265095729, or 26.5096%. Fractional counts are expectations. Top 200 changes selection and thus the operating point; its sensitivity cannot be assumed from another threshold's rates. Those rates would need labeled assessment for the new policy."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task T — threshold ties and supplied costs (§4/16)"}</H3>

<Prose>{"IDsA…E have scores 1,1,2,4,4 and known positives C/D. Can a strict score threshold choose exactly one ofD/E? Compareτ2,τ4 and stable-ID top 1 at review cost 2/miss cost 10."}</Prose>

<details><summary>Hint</summary>

<Prose>{"A scalar threshold sees equal scores as equal."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"No scalar strict threshold separatesD/E. τ2 selects both and missesC:cost 4+10=14. τ4 selectsnone and missesC/D:cost 20. Top 1 choosesD by declared ID tie, cost 2+10=12. That tie order is deterministic, not learned truth. The q.8 higher calibration quantile is 4 and selectsnone. Costs are justified only by the supplied tiny truth/cost contract, not by NAB windows."}</Prose>

</details>

</section><H2>{"17. Read the real recorded stream without leaking the future"}</H2>

<Prose>{"We now leave constructed unitless coordinates and inspect the recorded "}<strong>{"Numenta Anomaly Benchmark"}</strong>{" machine-temperature stream. These are measurements with timestamps and supplied annotation windows. The original data description does not state the temperature unit or timezone; our plots must not invent degrees Celsius or UTC."}</Prose>

<Mechanism id="D59" />

<Prose>{""}<strong>{"source rows flow into a chronological protocol."}</strong>{" Draw actual raw row fragments, same-time duplicates merging, exact-lag feature rows, and the reference/calibration/later intervals:"}</Prose>

<Prose>{"Twelve duplicate excess rows were averaged. Twelve times lack the required exact-hour predecessor and are excluded. Grouping assumes all same-time values are available when that timestamp is closed; late-arriving values require a separate issue-time policy. Annotation windows do not enter fitting or threshold selection. They join only the later descriptive report. The dates are declared chronological partitions, not a hindsight search for the best split."}</Prose>

<Prose>{"The source and MIT license are pinned at commit "}<code>{"ea702d75cc2258d9d7dd35ca8e5e2539d71f3140"}</code>{". The complete raw CSV, annotation JSON, source description, provenance and license accompany the programs. This pin matters: a different historical NAB revision can have different license terms. The data-description prose lists behaviours; it does not establish a one-to-one causal meaning for the four selected annotation windows."}</Prose>

<Mechanism id="D60" />

<Prose>{""}<strong>{"an actual feature has two actual timestamp operands."}</strong>{" At "}<code>{"2013-12-02 22:15:00"}</code>{", the raw level is 79.30203285. Exactly one hour earlier at 21:15:00 it is 73.96732207. Their difference is 5.33471078, forming the feature row "}<code>{"[79.30203285,5.33471078]"}</code>{". The saved binary-float CSV retains additional digits, e.g.5.3347107800000089. Displayed rounding is for reading; calculation and threshold counts use the saved full precision. A row selection highlights both timestamps and the subtraction. Twelve previous rows happen to be an hour only when all five-minute samples exist; the code uses timestamp alignment rather than a row shift."}</Prose>

<Mechanism id="D61" />

<Prose>{""}<strong>{"fit constants only on the reference."}</strong>{" Keep the level-only baseline and standardized level/change representation visible side by side. Selecting a recorded row highlights that same row in both. The level-only baseline is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"A_{base}(t)=|level(t)-median_{ref}|/MAD_{ref},\\quad\nMAD_{ref}=median_{ref}|level-median_{ref}|."}</MathBlock></div>

<Prose>{"Its median is 81.86204397 and raw MAD 4.424260250000003. No Gaussian 1.4826 multiplier is applied. A zero MAD would be unsupported in this baseline. The three learned detectors share two features, level and exact-hour change, standardized using reference means "}<code>{"[79.29349952159322,−.009933270847457576]"}</code>{" and population scales "}<code>{"[9.184081096769313,4.424124796247272]"}</code>{". A later row contributes to neither these constants nor the fit. A constant-feature "}<code>{"StandardScaler"}</code>{" uses scale 1; it does not manufacture variance. The baseline's different representation prevents a clean algorithm-only superiority comparison."}</Prose>

<Mechanism id="D62" />

<Prose>{""}<strong>{"the whole original experiment and output."}</strong>{" The complete original main follows. It fits Isolation Forest 100 trees/request 256/seed 17, RBF One-Class SVMγ.5/ν.05, and novelty LOF 20 using the shared reference. Calibration chooses the higher q=.95/.99 score quantile; later selection is strict score>threshold. The full nine-line recorded stdout is shown immediately afterward. It is the preserved original run, not a new execution under today's environment."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"originals/temperature_monitor.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="originals/temperature_monitor.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/temperature_monitor.py" />

<Prose>{""}<strong>{"Preserved recorded output: "}<code>{"temperature_monitor"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="temperature_monitor.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/temperature_monitor.stdout.txt">{"fit/cal/test: 885 1152 20634\nBaseline         q=0.95 alerts= 4416 inside=1379 outside=3037 windows=4/4\nBaseline         q=0.99 alerts= 1461 inside=1016 outside= 445 windows=4/4\nIsolation Forest q=0.95 alerts=10530 inside=1722 outside=8808 windows=4/4\nIsolation Forest q=0.99 alerts= 1548 inside= 971 outside= 577 windows=4/4\nOne-Class SVM    q=0.95 alerts= 9719 inside=1347 outside=8372 windows=4/4\nOne-Class SVM    q=0.99 alerts= 9232 inside=1319 outside=7913 windows=4/4\nLOF novelty      q=0.95 alerts= 8771 inside=1275 outside=7496 windows=4/4\nLOF novelty      q=0.99 alerts= 7837 inside=1138 outside=6699 windows=4/4"}</CodeBlock>

<Prose>{"All eight rows hit all four annotation windows; that shared 4/4 result hides very different workload. Raising q from .95 to .99 reduces baseline alerts 4416→1461, IF 10530→1548, OCSV 9719→9232 and LOF 8771→7837. At q.99, outside-window counts are 445,577,7913,6699. OCSV has 7913/445≈17.782 times the baseline's outside-window review count. That is an observed saved-protocol workload ratio, not a false-positive-rate or performance ratio. Inside-window alerts 1016/971/1319/1138 are selected rows, not verified true faults. There are 2268 inside rows and 18366 outside rows in the 20634-row later period. “Any alert in a window” also discards timing and multiplicity."}</Prose>

<Mechanism id="D63" />

<Prose>{""}<strong>{"location matters, not just totals."}</strong>{" Draw the full recorded level trace with period bands and hatched annotation windows; under it place four named method-score and alert lanes, each on its own oriented scale. An overview may summarize a bin by level extrema and maximum score, but a marked maximum means "}<strong>{"at least one"}</strong>{" selected row, not that every row in the bin is faulty. Zoom/detail uses actual saved rows with full accessible pagination. One local time-window control updates the trace, each method's threshold label and its selected counts together; essential totals sit outside any wide detail table. The original 480-bin overview and saved detail are drawing summaries, not computational inputs for arbitrary thresholds."}</Prose>

<Mechanism id="D64" />

<Prose>{""}<strong>{"change a policy without refitting a model."}</strong>{" Keep all four named method threshold/count rows visible as one common calibration quantile changes. Use the saved "}<code>{"nab-derived-scores.csv"}</code>{" calibration/test columns at full parsed float precision. With q=.975, the new threshold-only calculation reports baseline 2170/IF 5632/OCSV 9661/LOF 8191 alerts, outside 1036/4263/8318/7002, all 4 windows hit. The IF threshold is .5555652392489324; the OCSV threshold is −6.415545934270259 because its oriented A is negative raw normality, not necessarily a positive number. Higher still means more unusual within its own scale. Scores across families are not directly comparable magnitudes."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"saved_temperature_thresholds.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="saved_temperature_thresholds.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/saved_temperature_thresholds.py" />

<Prose>{""}<strong>{"Recorded example output (reused): "}<code>{"saved_temperature_thresholds"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="saved_temperature_thresholds.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/saved_temperature_thresholds.stdout.txt">{"saved feature rows: 22671\nbaseline q=.975 {'method': 'baseline', 'threshold': 4.566579723695049, 'alerts': 2170, 'inside': 1134, 'outside': 1036, 'windows': 4}\nisolation q=.975 {'method': 'isolation', 'threshold': 0.5555652392489324, 'alerts': 5632, 'inside': 1369, 'outside': 4263, 'windows': 4}\none_class_svm q=.975 {'method': 'one_class_svm', 'threshold': -6.415545934270259, 'alerts': 9661, 'inside': 1343, 'outside': 8318, 'windows': 4}\nlof q=.975 {'method': 'lof', 'threshold': 1.4936764075602469, 'alerts': 8191, 'inside': 1189, 'outside': 7002, 'windows': 4}"}</CodeBlock>

<Prose>{"This new program imports no estimator and calls no fit. It reads the original derived bytes, chooses a calibration quantile or finite typed threshold, returns all selected timestamp/score pairs, and counts inclusive-window membership. Its default main calculates q=.975 once for all four saved columns. The old finite threshold ladder/direct-value investigation remains a separate saved display contract: when it snaps a requested threshold, it must expose the used value. A later exact evaluator may offer typed thresholds only from these exact saved scores. It cannot pretend the rounded overview module supports every value. If a higher threshold loses a window hit, display that actual changed result; stable 4/4 at .95/.99 does not guarantee stability for every threshold."}</Prose>

<Mechanism id="D65" />

<Prose>{""}<strong>{"an annotation is a finite inclusive interval."}</strong>{" The first selected window is "}<code>{"2013-12-10 06:25:00"}</code>{" through "}<code>{"2013-12-12 05:35:00"}</code>{"; both endpoints count as inside. Show its actual rows plus neighbouring outside rows. A window can be hit by one selected timestamp even when many of its rows are unselected. This start boundary is not a verified physical onset, so a nearby alert cannot automatically be called an early warning. Filtering only alerts must retain the method/threshold/window label; every row remains reachable when the filter is off."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task U — report the original protocol (§17)"}</H3>

<Prose>{"Using the complete q.99 output, write five sentences comparing workload, shared window hits, representation and limits. Include the OCSV-to-baseline outside count ratio and one locked next experiment."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Outside-window is a location label; do not replace it with “false positive.”"}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A valid response states the chronological reference/calibration/later protocol and higher-quantile strict rule; all methods hit 4/4 windows; outside counts 445/577/7913/6699; OCSV/baseline ratio 7913/445≈17.7820; baselinelevel-only versus learnedlevel/change prevents algorithm-only attribution. It says these are descriptive workload/window results, not verified fault accuracy, significance or prospective early warning. A suitable next experiment locks a matched representation, reviewed label protocol, budget/event matching and future period before comparing. Multiple five-sentence phrasings work when they preserve those claims and limits."}</Prose>

</details>

</section><H2>{"18. Count episodes, assess drift and write the report"}</H2>

<Mechanism id="D66" />

<Prose>{""}<strong>{"repeated rows may form one review episode."}</strong>{" Switch explicitly to a tiny constructed five-minute stream, rows 0…12. Method A alerts at 3,4,5,9,10,11; B at 3,9,12. Group consecutive alert timestamps when their gap is at most 5 minutes. A has two episodes; B has three because 9→12 spans 15 minutes. With a15-minute gap, B has two. The alert rows and scores have not changed; only the grouping policy has."}</Prose>

<Mechanism id="D67" />

<Prose>{""}<strong>{"matching is another declared operation."}</strong>{" Keep both A/B alert rows and their episode brackets visible, together with row-overlap window hits and first-overlap episode matches. One gap control changes both episode groupings; it never selects row versus episode reporting. Place inclusive windows 3…5 and 9…11 on that same axis. Both methods hit two windows by the row rule. A has six alert rows, none outside; B has three, one outside. Our episode rule assigns an episode to the first window containing one of its alert timestamps. It is not the same as treating the whole span between distant alerts as continuously alerted, and it never paints an entire hit window as correct point predictions. Window-hit count remains row-overlap based; "}<code>{"episode_matches"}</code>{" reports the separate first-overlap allocation. Empty alerts produce zero rows/episodes/hits."}</Prose>

<Prose>{""}<strong>{"File: "}<code>{"event_policy.py"}</code>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="event_policy.py" language="python" source="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/event_policy.py" />

<Prose>{""}<strong>{"Recorded example output (reused): "}<code>{"event_policy"}</code>{""}</strong>{""}</Prose>

<CodeBlock kind="output" language="output" filename="event_policy.stdout.txt" downloadUrl="/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/recorded-output/event_policy.stdout.txt">{"A gap 5 {'rows': 6, 'outside_rows': 0, 'episodes': 2, 'hit_windows': 2, 'episode_matches': [0, 1]}\nA gap 15 {'rows': 6, 'outside_rows': 0, 'episodes': 2, 'hit_windows': 2, 'episode_matches': [0, 1]}\nB gap 5 {'rows': 3, 'outside_rows': 1, 'episodes': 3, 'hit_windows': 2, 'episode_matches': [0, 1, None]}\nB gap 15 {'rows': 3, 'outside_rows': 1, 'episodes': 2, 'hit_windows': 2, 'episode_matches': [0, 1]}\nempty alerts: {'rows': 0, 'outside_rows': 0, 'episodes': 0, 'hit_windows': 0, 'episode_matches': []}"}</CodeBlock>

<Prose>{"Different applications may want detection latency, duration-weighted cost or one review per device/day. Declare the unit, matching, boundary and repeated-alert policy before evaluating. The present report is not the official NAB scoring function. Fault precision/recall would require a justified fault-label protocol; the annotations alone do not provide it. Precision–recall curves and their sampling assumptions belong to the earlier evaluation lesson; point adjustment would alter the question and cannot be silently introduced."}</Prose>

<Mechanism id="D68" />

<Prose>{""}<strong>{"a changing reference can absorb the change."}</strong>{" Keep two aligned copies of the constructed level trend 40→50 visible: one against the frozen reference and one against a reviewed rolling reference beginning on a declared date. A reviewed-update date control changes the second bundle while the frozen comparison stays visible; it never hides either policy. A frozen model can increase workload when an acceptable regime changes. A rolling model/scaler/threshold can absorb a fault trend and make it look ordinary. Neither is automatically right. An update is one versioned bundle: feature policy, reviewed reference period, scaler, model and calibration threshold. Only records available before the update may feed it. Select a future locked evaluation interval before inspecting its outcomes; do not retrospectively call the most convenient interval clean. "}<a href={"/learn/path/full-curriculum/time-series-validation-forecasting-baselines?module=classical-ml"}>{"Time-series validation"}</a>{" develops issue-time, rolling-origin and residual models. A new causal feature or update rule here would need that new protocol, not a fresh interpretation of the old fit."}</Prose>

<Mechanism id="D69" />

<Prose>{""}<strong>{"denominators support different sentences."}</strong>{" Keep the four reported method rows visible beside their denominators as q changes. Put 18366 outside-row tokens/2268 inside-row tokens beside four window tokens. At q.99, IF selects 1548/20634≈7.50% later rows and OCSV 9232/20634≈44.74%, while the recorded IF calibration rule selects 11/1152≈.955% calibration rows. Those fractions describe score distribution shift and workload. They are not false-alert rates. The same calibration quantile need not produce the same later fraction under a shifted or dependent stream. A percentile alone gives no distribution-free prospective coverage; "}<a href={"/learn/path/full-curriculum/calibration-conformal-prediction?module=classical-ml"}>{"calibration and conformal prediction"}</a>{" owns those additional exchangeability/protocol assumptions."}</Prose>

<Prose>{"A defensible five-sentence report could read: “We compared the later recorded rows with an early frozen reference using the declared features and higher calibration-score quantile. At q.99 all four methods selected at least one row in each of the four supplied windows. Outside-window review counts ranged from 445 to 7913, with different baseline versus learned representations. These are descriptive row/window counts, not verified fault accuracy or prospective early-warning evidence. We would next lock a matched-representation, reviewed-label and future-period protocol before comparing operational usefulness.” Task U asks you to write the account yourself; task X changes only the saved-score policy."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task V — rows, episodes, windows (§18)"}</H3>

<Prose>{"On the five-minute axis with inclusive windows 3…5/9…11, compare Aalerts 3,4,5,9,10,11 and B3,9,12. Count rows/outside rows/hits and episodes at maximum gaps 5 versus 15 minutes."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Rows 9 and 12 are 15 minutes apart; a hit counts a window once."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A:6 rows,0 outside,2 hits,2 episodes under both gaps. B:3 rows,1 outside,2 hits,3 episodes at 5minutes,2 at 15minutes. A's repeated inside alerts do not produce six detected physical incidents. B's joined episode at 15minutes contains an outside row; grouping does not rewrite its location. The first-overlap episode allocation and row-based window hit count are separately reported. No point fault precision follows."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task W — frozen versus rolling (§18)"}</H3>

<Prose>{"A level drifts 40→50. Compare a frozen reference with a rolling reference/scaler/threshold bundle. Propose a valid update and a failure it can still have."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask which records were reviewed and available at each update date."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"A frozen bundle can create workload after a legitimate regime change. A rolling bundle can absorb a genuine failure trend. A valid plan states a reviewed past reference, an availability cutoff, a versioned feature/scaler/model/calibration bundle and a locked future evaluation period with assessment units. It cannot retrospectively select the cleanest interval or update on unreviewed abnormal records while calling the reference acceptable. Either policy can fail; compare against a declared operational objective rather than claiming adaptation is automatically correct."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Task X — a saved-score policy report (§17/18)"}</H3>

<Prose>{"Use the threshold-only helper at q.975 without estimator fitting. Report each method's threshold, strict selection, total/inside/outside/window counts, source/feature versions and one qualification. Explain which work would change if you changed the features instead."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The saved helper has no estimator import; all policy operands come from existing score columns."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The printed exact thresholds and counts are the reproducible report:baseline 2170/1134/1036,IF 5632/1369/4263,OCSV 9661/1343/8318,LOF 8191/1189/7002,each 4hits. The source is the pinned derived CSV with reference/calibration/test period and full parsed float score precision; selection is strict>. OCSV's negative oriented threshold is valid. State the original level-only versus scaledlevel/change representations and inclusive-window rule. This recalculates an action policy, not model quality or a new fit. Changing features invalidates the saved scores and requires a new locked fitting/assessment protocol, not a threshold adjustment."}</Prose>

</details>

</section><H2>{"19. Carry the right question into the next model"}</H2>

<Prose>{"What would a probability density add? "}</Prose>

<Mechanism id="D70" />

<Prose>{""}<strong>{"total density and relative component share."}</strong>{" Switch explicitly to two constructed Gaussian density curves, with means −1/+1, standard deviation 1 each, and weights .5/.5. A Gaussian curve has height "}<code>{"f_c(x)=exp(−(x−mean_c)²/2)/sqrt(2π)"}</code>{" here; its area is 1, and a height is density per coordinate unit, not a point probability. Draw the weighted curves "}<code>{".5f_0"}</code>{" and "}<code>{".5f_1"}</code>{", distinguish their labels/line patterns, then add their heights at a plum query diamond Q=5 to form total density. The contributions are about 3.037941425e−9 and 6.691511288e−5, total 6.691815082e−5. Divide each contribution by that total: the relative component shares, called responsibilities, are about .000045398 and .999954602. The distant query strongly prefers the +1 component "}<strong>{"and still has very low total density"}</strong>{". At Q=0 the two contributions are equal: responsibilities .5/.5, while total density is about .241970725. A responsibility is a relative share, not an anomaly probability. LOF's inverse-reach proxy and the one-class residual are not normalized probability densities. These fixed curves are a handoff illustration, not a fitted mixture or a density-based threshold. The next "}<a href={"/learn/path/full-curriculum/gaussian-mixture-models-gmm-em-algorithm?module=classical-ml"}>{"GMM lesson"}</a>{" owns mixture likelihood, responsibilities and EM fitting."}</Prose>

<Prose>{"The recurring question is now explicit: what is the observation, what belongs in the reference, which represented difference should be noticeable, and what response can the evidence support? Random isolation cuts, neighbour-owned reachability and kernel support boundaries answer different geometric parts of that question. All require an action policy and an assessment unit."}</Prose>

<Prose>{"For a spectral or hidden-coordinate failure, revisit "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml"}>{"PCA"}</a>{" for projection/reconstruction before proposing an anomaly score from residuals. For contextual or sequential departures, use the time-series validation route and declare what was available at issue time. A supervised fault classifier requires reviewed fault labels and supervised evaluation; neural reconstruction, graph and information-theoretic detectors introduce new representation/model assumptions and deserve their own worked treatment. These are concrete next investigations, not untaught fourth algorithms in this lesson."}</Prose>

<Prose>{"Before moving on, retrieve without the formulas: why does a leaf with two rows need a correction? Whose radius sets directed reach? Why does a new query at a training coordinate keep that reference ID? What does a pair transfer conserve? Which rows define the scaler and threshold? Which quantity remains unknown when every annotation window is hit? Use the changed practices below to test those operations. You are ready to continue when you can trace one example of each mechanism, identify an unsupported/null case, price its actual working state, and write a report without converting unusualness into fault truth."}</Prose>

<H2>{"Practice index"}</H2>

<Prose>{"Attempt the changed tasks in their section before opening feedback."}</Prose>

<ul><li>{"A: §1 — the missing context (§1)"}</li><li>{"B: §5 — endpoint cuts (§5)"}</li><li>{"C: §6 — a capped leaf (§6)"}</li><li>{"D: §10 — reach, reciprocal, ratio (§10)"}</li><li>{"E: §10 — a farther local query (§10)"}</li><li>{"F: §11 — same coordinate, different identity (§11)"}</li><li>{"G: §13 — scale a kernel (§13)"}</li><li>{"H: §14 — what ν bounds (§14)"}</li><li>{"I: §16 — a budget meets base rates (§16)"}</li><li>{"J: §3 — the stuck trace (§3/18)"}</li><li>{"K: §3 — the exact-hour operand (§3)"}</li><li>{"L: §7 — two reachable trees (§7)"}</li><li>{"M: §8 — an unsplittable forest (§8)"}</li><li>{"N: §7 — rare-mode omission and work (§7/8)"}</li><li>{"O: §10 — the missing second hop (§10)"}</li><li>{"P: §11 — duplicate support (§11)"}</li><li>{"Q: §12 — price blocked retrieval (§12)"}</li><li>{"R: §15 — one pair update (§15)"}</li><li>{"S: §15 — no free coefficient (§14/15)"}</li><li>{"T: §16 — threshold ties and supplied costs (§4/16)"}</li><li>{"U: §17 — report the original protocol (§17)"}</li><li>{"V: §18 — rows, episodes, windows (§18)"}</li><li>{"W: §18 — frozen versus rolling (§18)"}</li><li>{"X: §18 — a saved-score policy report (§17/18)"}</li></ul>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning" data-lesson-resource-list=""><H2>{"Further learning"}</H2>

<ul><li>{""}<strong>{"Charu Aggarwal, Outlier Analysis, Chapter1"}</strong>{" — "}<a href={"https://www.charuaggarwal.net/outlierbook.pdf"}>{"author-hosted sample"}</a>{", a book introduction for a reader after §§1–4. It broadens the observation/task distinction, noise versus interesting departures, data types and high-dimensional difficulty. The complete introductory chapter, printed pages1–34, and preface/chapter map were inspected; this is not an endorsement based on reading the entire book. Later specialist chapters may require linear algebra/probability beyond this core."}</li><li>{""}<strong>{"Nicolas Goix, Anomaly Detection Algorithms in scikit-learn"}</strong>{" — "}<a href={"https://ngoix.github.io/nicolas_goix_osi_presentation.pdf"}>{"fifteen-slide companion"}</a>{" and "}<a href={"https://webcast.in2p3.fr/video/anomaly_detection_algorithms_in_scikitlearn"}>{"recording page"}</a>{", after the isolation implementation. The slides provide an alternate fit/query/isolation explanation. The companion was substantively read; the full video was not watched, so no timestamps are claimed. Its2015 API/defaults must not replace the present explicit contracts."}</li><li>{""}<strong>{"scikit-learn, Novelty detection with Local Outlier Factor"}</strong>{" — "}<a href={"https://scikit-learn.org/stable/auto_examples/neighbors/plot_lof_novelty_detection.html"}>{"official example"}</a>{", executable code and a plot after §11. Follow its separate reference/query arrays and mode setting. It is a library activity, not a derivation of directed reach or our additional chronological calibration policy. Its code and interpretation were inspected."}</li></ul></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="references" data-lesson-resource-list=""><H2>{"Technical references"}</H2>

<ul><li>{""}<strong>{"Chandola, Banerjee and Kumar, Anomaly Detection: A Survey (2009)"}</strong>{" — "}<a href={"https://arindam.cs.illinois.edu/papers/09/anomaly.pdf"}>{"complete author-hosted survey"}</a>{". Its substantive §§1–12 support observation/task/output taxonomy and the family/ownership map; bibliographic pages were inspected rather than every entry read word for word. Use it for broader canonical context after the mechanisms."}</li><li>{""}<strong>{"Liu, Ting and Zhou, Isolation Forest (ICDM2008)"}</strong>{" — "}<a href={"https://cs.nju.edu.cn/zhouzh/zhouzh.files/publication/icdm08b.pdf"}>{"original paper"}</a>{", §§2–4 and Algorithms1–3 for cuts, path correction, score and subsample/cost reasoning. Experiment settings such as256/100 are historical empirical choices, not universal optima. The partition/path figures were inspected."}</li><li>{""}<strong>{"Breunig, Kriegel, Ng and Sander, LOF (SIGMOD2000)"}</strong>{" — "}<a href={"https://sigmodrecord.org/publications/sigmodRecord/0006/pdfs/LOF_%20Identifying%20Density-Based%20Local%20Outliers.pdf"}>{"original paper"}</a>{", definitions and local bounds in §§3–5. Its tie-inclusive neighbourhood differs from the exact-k ID rule declared here. Figure2's directed radius floor motivates D31; the drawn figures in this lesson are original."}</li><li>{""}<strong>{"Schölkopf and colleagues, Estimating the Support of a High-Dimensional Distribution"}</strong>{" — "}<a href={"https://www.math.univ-toulouse.fr/~agarivie/Telecom/apprentissage/articles/OneClasslong.pdf"}>{"author report"}</a>{", formulation/pair optimization §§3–4 and Proposition4's assumptions for ν bounds. The report's equations and proof were inspected. Constant-diagonal translation-invariant kernels permit a related sphere formulation; arbitrary kernels do not make every one-class/sphere objective interchangeable."}</li><li>{""}<strong>{"scikit-learn1.9.1 implementation and API contracts"}</strong>{" — "}<a href={"https://scikit-learn.org/stable/modules/outlier_detection.html"}>{"outlier/novelty guide"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html"}>{"IsolationForest API"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.LocalOutlierFactor.html"}>{"LOF API"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.svm.OneClassSVM.html"}>{"OneClassSVM API"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.SGDOneClassSVM.html"}>{"SGDOneClassSVM API"}</a>{". Stable documentation can change. The inspected snapshot's "}<a href={"https://raw.githubusercontent.com/scikit-learn/scikit-learn/1.9.1/sklearn/ensemble/_iforest.py"}>{"IF source"}</a>{" resolves the mean-before-exponential, log correction and offset; "}<a href={"https://raw.githubusercontent.com/scikit-learn/scikit-learn/1.9.1/sklearn/svm/src/libsvm/svm.cpp"}>{"LIBSVM source"}</a>{" resolves unit-weight coefficient scaling and boundary ties. Exact source/version and the local LOF implementation inspection support the stated differences."}</li><li>{""}<strong>{"Numenta Anomaly Benchmark"}</strong>{" — "}<a href={"https://github.com/numenta/NAB/blob/ea702d75cc2258d9d7dd35ca8e5e2539d71f3140/data/README.md"}>{"pinned data description"}</a>{", accompanying raw CSV/combined-window JSON and MIT license. Dataset bytes were retrieved11September2026, recorded in "}<code>{"dataset-source.json"}</code>{"; the preserved study/saved scores are separate derived evidence. Units/timezone remain unspecified. This lesson uses descriptive inclusive-window counts, not official NAB scoring."}</li></ul></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"Readiness and next steps"}</H2>

<Prose>{"Draw one cut path with a capped leaf, compute one directed LOF ratio, and perform one feasible coefficient pair update. Explain an empty/constant/duplicate boundary without turning an undefined quantity into a number. Then reproduce a saved-score policy report with its feature/reference/calibration/time/window identities and truthful limits. Use the GMM link at the end of §19 when you can distinguish unusualness, total density and relative component share."}</Prose></section>

<H2>{"Complete program and supporting files"}</H2>

<Prose>{"Keep the relative subfolders when placing these files in "}<code>{"programs/"}</code>{". The shared code and supporting-files index collects their downloads."}</Prose>

<ul><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/causal_features.py"}>{"causal_features.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/causal_features.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/event_policy.py"}>{"event_policy.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/event_policy.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/isolation_core.py"}>{"isolation_core.py"}</a>{" — New complete core imported by its driver. Use: "}<code>{"Imported by the corresponding mechanism driver"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/isolation_expectation.py"}>{"isolation_expectation.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/isolation_expectation.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/isolation_mechanisms.py"}>{"isolation_mechanisms.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/isolation_mechanisms.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/lof_core.py"}>{"lof_core.py"}</a>{" — New complete core imported by its driver. Use: "}<code>{"Imported by the corresponding mechanism driver"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/lof_mechanisms.py"}>{"lof_mechanisms.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/lof_mechanisms.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/lof_rejected_fit.py"}>{"lof_rejected_fit.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/lof_rejected_fit.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/newline-role-disposition.json"}>{"newline-role-disposition.json"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/one_class_core.py"}>{"one_class_core.py"}</a>{" — New complete core imported by its driver. Use: "}<code>{"Imported by the corresponding mechanism driver"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/one_class_features.py"}>{"one_class_features.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/one_class_features.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/one_class_mechanisms.py"}>{"one_class_mechanisms.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/one_class_mechanisms.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/dataset-provenance.md"}>{"originals/dataset-provenance.md"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/dataset-source.json"}>{"originals/dataset-source.json"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/isolation_example.py"}>{"originals/isolation_example.py"}</a>{" — Complete historical program; preserved output. Use: "}<code>{"python -B programs/originals/isolation_example.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/isolation_example.stdout.txt"}>{"originals/isolation_example.stdout.txt"}</a>{" — Preserved earlier recorded output. Use: "}<code>{"Read, not executable"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/kernel_boundary.py"}>{"originals/kernel_boundary.py"}</a>{" — Complete historical program; preserved output. Use: "}<code>{"python -B programs/originals/kernel_boundary.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/kernel_boundary.stdout.txt"}>{"originals/kernel_boundary.stdout.txt"}</a>{" — Preserved earlier recorded output. Use: "}<code>{"Read, not executable"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/lof_arithmetic.py"}>{"originals/lof_arithmetic.py"}</a>{" — Complete historical program; preserved output. Use: "}<code>{"python -B programs/originals/lof_arithmetic.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/lof_arithmetic.stdout.txt"}>{"originals/lof_arithmetic.stdout.txt"}</a>{" — Preserved earlier recorded output. Use: "}<code>{"Read, not executable"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/lof_modes.py"}>{"originals/lof_modes.py"}</a>{" — Complete historical program; preserved output. Use: "}<code>{"python -B programs/originals/lof_modes.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/lof_modes.stdout.txt"}>{"originals/lof_modes.stdout.txt"}</a>{" — Preserved earlier recorded output. Use: "}<code>{"Read, not executable"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/machine_temperature_system_failure.csv"}>{"originals/machine_temperature_system_failure.csv"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/nab-derived-scores.csv"}>{"originals/nab-derived-scores.csv"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/nab-event-windows.json"}>{"originals/nab-event-windows.json"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/NAB-LICENSE.txt"}>{"originals/NAB-LICENSE.txt"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/nab-source-readme.md"}>{"originals/nab-source-readme.md"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/temperature_monitor.py"}>{"originals/temperature_monitor.py"}</a>{" — Complete historical program; preserved output. Use: "}<code>{"python -B programs/originals/temperature_monitor.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/originals/temperature_monitor.stdout.txt"}>{"originals/temperature_monitor.stdout.txt"}</a>{" — Preserved earlier recorded output. Use: "}<code>{"Read, not executable"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/prerequisites/__init__.py"}>{"prerequisites/__init__.py"}</a>{" — Empty package marker. Use: "}<code>{"Imported by the corresponding core; __init__ is empty package marker"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/prerequisites/batched_top_k.py"}>{"prerequisites/batched_top_k.py"}</a>{" — Unchanged prerequisite import. Use: "}<code>{"Imported, not run as a new main"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/prerequisites/batched_top_k.stdout.txt"}>{"prerequisites/batched_top_k.stdout.txt"}</a>{" — Preserved earlier recorded output. Use: "}<code>{"Read, not executable"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/prerequisites/svm_core.py"}>{"prerequisites/svm_core.py"}</a>{" — Unchanged prerequisite import. Use: "}<code>{"Imported, not run as a new main"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/requirements.txt"}>{"requirements.txt"}</a>{" — Dependency/data/license/provenance supplied offline. Use: "}<code>{"Read/install as described in setup"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/saved_temperature_thresholds.py"}>{"saved_temperature_thresholds.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/saved_temperature_thresholds.py"}</code>{"."}</li><li>{""}<a href={"/learn-code/anomaly-outlier-detection-isolation-forest-one-class-svm-lof/score_policy.py"}>{"score_policy.py"}</a>{" — Runnable small demonstration or saved-policy calculation; output recorded. Use: "}<code>{"python -B programs/score_policy.py"}</code>{"."}</li></ul></div></AnomalyContext>;}
export default {title:'Anomaly & Outlier Detection (Isolation Forest, One-Class SVM, LOF)',readTime:'~90 min first pass · ~180 min complete read + 2–4 h code and practice',content:Content};
