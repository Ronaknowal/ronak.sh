import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/clustering-evaluation-reading-flow/clustering-evaluation-reading-flow.css';
import {H2,H3} from '../../components/content/Headings.jsx';
import {Prose} from '../../components/content/Prose.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {CodeBlock} from '../../components/content/Code.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {Mechanism} from '../../components/lesson-labs/clustering-evaluation-reading-flow/EvaluationFigures.jsx';
import {Investigation} from '../../components/lesson-labs/clustering-evaluation-reading-flow/EvaluationInvestigations.jsx';
function Content(){return <div className="lesson-flow ce-lesson"><Prose>{"Two groups can look cleaner while three groups agree better with known categories. Both results can be correct. We will follow one set of flower specimens, open the calculations behind that disagreement, and finish by making a decision for a stated use."}</Prose>

<Prose opening="summary">{"You will learn to explain one point's silhouette from its neighbors, count agreement without treating group names as numbers, distinguish information from chance agreement, and report which observations and fitted choices support a conclusion. The deeper route develops internal indices, information expectation, matching, stability support, reference distributions, hierarchy fidelity and computational alternatives."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" follow the main explanations in "}<a href={"#1-two-groups-look-cleaner-three-groups-match-the-species-better-which-result-should-we-keep"}>{"sections 1–10"}</a>{", then "}<a href={"#12-a-report-you-can-defend-then-try-on-your-own"}>{"section 12"}</a>{". At a heading marked "}<strong>{"Deeper"}</strong>{", you may follow the named return link to the next main section. Try the neighborhood, pair, information and Iris investigations as they appear. Run the two small original distance/pair programs and the information program's "}<code>{"--core"}</code>{" route if you want the computational path. In "}<a href={"#12-a-report-you-can-defend-then-try-on-your-own"}>{"section 12"}</a>{" choose the real-data report or the portable toy/CSV route and solve the museum task. "}<strong>{"Return route:"}</strong>{" revisit "}<a href={"#4-a-score-evaluates-a-geometry-as-well-as-a-partition"}>{"section 4"}</a>{"'s internal indices, "}<a href={"#6-nmi-how-much-does-one-label-tell-us-about-the-other"}>{"section 6"}</a>{"'s expected information, "}<a href={"#7-explain-which-groups-split-or-merge"}>{"section 7"}</a>{"'s matching/VI and "}<a href={"#11-deeper-branch-tendency-relative-selection-and-computation"}>{"section 11"}</a>{"'s reference/computation branches after that first report. Their full explanations and code remain visible; they are not prerequisites for every first-pass action."}</Prose>

<Prose opening="prerequisites">{"Earlier "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#2-let-points-choose-representatives"}>{"K-Means: let points choose representatives"}</a>{" established rows, features, centers and nearest-center assignments. "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#2-rotate-the-ruler-then-keep-its-readings"}>{"PCA: rotate the ruler, then keep its readings"}</a>{" established fitted coordinates and discarded directions. We will recall the specific operations when they matter, rather than assuming a metric name explains them."}</Prose>

<H2>{"1. Two groups look cleaner. Three groups match the species better. Which result should we keep?"}</H2>

<Prose>{"Start with the thing being grouped: a specimen, rather than a plotted dot or a score. This is specimen 0 from the corrected Iris data, with four measurements in centimetres."}</Prose>

<Mechanism id="D01" />

<NeuralTable caption={"1. Two groups look cleaner. Three groups match the species better. Which result should we keep?"} headers={[<>{"ID"}</>,<>{"Sepal length"}</>,<>{"Sepal width"}</>,<>{"Petal length"}</>,<>{"Petal width"}</>,<>{"Candidate raw4 membership"}</>,<>{"Species annotation"}</>]} rows={[[<>{"0"}</>,<>{"5.1 cm"}</>,<>{"3.5 cm"}</>,<>{"1.4 cm"}</>,<>{"0.2 cm"}</>,<>{"bin 0 in both recorded k2 and k3 fits"}</>,<>{"setosa"}</>]]} />

<Prose>{"The four measurements form the fitting row. "}<code>{"row_id"}</code>{" identifies the specimen; species is an annotation we can consult afterward. Neither identifier nor species enters the fitting feature matrix. There are 150 such rows and four feature columns. A candidate membership says which bin contains each row; it is not another physical measurement."}</Prose>

<Prose>{"Now look at two assignments of these same specimens. Both use Euclidean distance in the four raw cm features. The displayed two-principal-component view gives a useful common picture, but it is not the four-dimensional ruler used to score the assignments."}</Prose>

<Mechanism id="D02" />

<NeuralTable caption={"1. Two groups look cleaner. Three groups match the species better. Which result should we keep?"} headers={[<>{"Assignment"}</>,<>{"Occupied bin sizes"}</>,<>{"Question about distances"}</>,<>{"Question about species"}</>]} rows={[[<>{"two bins"}</>,<>{"53,97"}</>,<>{"More separated neighborhoods under this ruler"}</>,<>{"More category mixing"}</>],[<>{"three bins"}</>,<>{"50,62,38"}</>,<>{"Less separated neighborhoods under this ruler"}</>,<>{"Closer to the three annotated categories"}</>]]} />

<Prose>{"We will give those questions precise meanings. "}<strong>{"Silhouette"}</strong>{" compares each specimen's average distance to its own group with its average distance to competing groups. Here its recorded observation mean is .681046 for two groups and .552819 for three. "}<strong>{"Adjusted Rand index"}</strong>{", or ARI, compares same-group relationships between two assignments after subtracting a stated chance baseline. Against species, it is .539922 for two groups and .730238 for three. The arithmetic behind both measures comes shortly. For now, notice that their inputs and questions differ."}</Prose>

<Prose>{"If a museum can maintain only two representative specimens, category recovery need not be the deciding objective. If the goal is to recover species-related morphology, merging categories may matter more than a cleaner Euclidean neighborhood. Evaluation starts by fixing that use."}</Prose>

<Mechanism id="D03" />

<NeuralTable caption={"1. Two groups look cleaner. Three groups match the species better. Which result should we keep?"} headers={[<>{"What you inspect"}</>,<>{"Question it answers"}</>]} rows={[[<>{"distances between members"}</>,<>{"Are these groups compact and separated in the chosen geometry?"}</>],[<>{"annotation/candidate memberships of the same IDs"}</>,<>{"Which reference relationships were recovered, split or merged?"}</>],[<>{"memberships of the same IDs after a named change"}</>,<>{"Would the answer survive this perturbation?"}</>],[<>{"each specimen's residual to a usable representative"}</>,<>{"Does this grouping serve the intended task and budget?"}</>]]} />

<Prose>{"The first is often called "}<strong>{"internal"}</strong>{" evaluation, the second "}<strong>{"external"}</strong>{", and comparing candidates or resolutions is often called "}<strong>{"relative"}</strong>{" evaluation. Repeatability and task usefulness add evidence that those labels alone do not settle. A reference assignment can be recorded categories or another algorithm's result; it need not be unquestionable truth."}</Prose>

<Prose>{"For the rest of this lesson, an evaluation contract consists of the comparison population, representation/ruler, construction procedure and intended use. State these once before comparing numbers. There is no universally useful silhouette threshold or universally true number of groups. A threshold becomes meaningful through its role in a task rule, reference model or empirical comparison."}</Prose>

<Prose>{"The Iris measurements are real licensed data: Fisher's Iris record, UCI DOI "}<a href={"https://doi.org/10.24432/C56C76"}>{"10.24432/C56C76"}</a>{", CC BY 4.0. We use the corrected offline copy bundled with scikit-learn, with row IDs 0–149. Download "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris.csv"}>{"the exact CSV"}</a>{" and retain its "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/data-provenance.md"}>{"data provenance"}</a>{". It is a small historical benchmark, not a claim about a modern field-sampling population."}</Prose>

<H2>{"2. Keep the objects fixed before comparing their groups"}</H2>

<Prose>{"To see every relationship, briefly replace the 150 specimens with eight invented IDs A–H. These are a transparent counting fixture, not a selected Iris subset. Put A–D in one bin and E–H in another."}</Prose>

<Mechanism id="D04" />

<CodeBlock language={"text"}>{"reference U       renamed U       candidate S: exchange D/E\nbin0: A B C D     bin7: A B C D    bin0: A B C E\nbin1: E F G H     bin3: E F G H    bin1: D F G H"}</CodeBlock>

<Prose>{"The first two pictures contain identical groups. Only the bin names changed. In the third picture D and E moved, changing their relationships with other objects. A score about a partition should respond to changed relationships, not the numerical distance between label 0 and label 7."}</Prose>

<Prose>{"A "}<strong>{"hard partition"}</strong>{" assigns every object to exactly one nonempty group. Let "}<code>{"U=00001111"}</code>{" denote the reference memberships in ID order A–H, and "}<code>{"S=00010111"}</code>{" denote the D/E exchange. This shorthand describes eight memberships, not a binary integer. A feature matrix "}<code>{"X"}</code>{" has n rows and d feature columns; each label array has n entries and each ID array has n entries. Our agreement measures compare two hard partitions of the "}<strong>{"same set of IDs"}</strong>{"."}</Prose>

<Prose>{"Equal array length does not establish that set correspondence. Here is a candidate presented in a different row order."}</Prose>

<Mechanism id="D05" />

<NeuralTable caption={"2. Keep the objects fixed before comparing their groups"} headers={[<>{"Reference order"}</>,<>{"Candidate received order"}</>,<>{"Candidate aligned to reference"}</>]} rows={[[<>{"A:0"}</>,<>{"H:1"}</>,<>{"A:0"}</>],[<>{"B:0"}</>,<>{"A:0"}</>,<>{"B:0"}</>],[<>{"C:0"}</>,<>{"E:0"}</>,<>{"C:0"}</>],[<>{"D:0"}</>,<>{"D:1"}</>,<>{"D:1"}</>],[<>{"E:1"}</>,<>{"C:0"}</>,<>{"E:0"}</>],[<>{"F:1"}</>,<>{"B:0"}</>,<>{"F:1"}</>],[<>{"G:1"}</>,<>{"G:1"}</>,<>{"G:1"}</>],[<>{"H:1"}</>,<>{"F:1"}</>,<>{"H:1"}</>]]} />

<Prose>{"Look up each candidate membership by ID before comparing. Jointly reordering both aligned arrays leaves the partition comparison unchanged. Independently reordering only one can compare A with H and create a different answer. Duplicate IDs or missing IDs require a stated resolution or an error; silently zipping the arrays is not alignment."}</Prose>

<Prose>{"The new information program later begins with this exact record-to-map operation. Hashable names are permitted because only equality matters. Soft memberships and overlapping sets change the object being compared; they need their own measures, rather than silently forcing this hard-partition contract."}</Prose>

<H2>{"3. Silhouette: inspect one point’s neighborhood before averaging"}</H2>

<Prose>{"Now magnify a distance operation with six invented objects. Their coordinates are 0,1,2,7,8,9 in abstract length units, with A/B/C in L and D/E/F in R. This fixture is independent of the eight-ID counting example."}</Prose>

<Mechanism id="D06" />

<CodeBlock language={"text"}>{"L: A0 —— B1 —— C2                     R: D7 —— E8 —— F9\nC to own members:    |2−0|=2, |2−1|=1       sum3 / two members =1.5\nC to foreign group:  |2−7|=5, |2−8|=6, |2−9|=7  sum18 / three members =6"}</CodeBlock>

<Prose>{"The first average measures C's neighborhood inside its assigned group. Exclude C itself: a zero self-distance would otherwise inflate the denominator. The second measures C's neighborhood in a competing group. Distances to individual members are the operands; distance to a center is a different operation."}</Prose>

<Prose>{"Name the own average "}<code>{"a(C)=1.5"}</code>{". With more than one foreign group, compute an average to "}<strong>{"each entire group"}</strong>{", then take the smallest of those means. Name that result "}<code>{"b(C)"}</code>{". Here there is one foreign group, so b(C)=6. The silhouette normalizes their signed difference by the larger average:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"s(i)=\\frac{b(i)-a(i)}{\\max\\{a(i),b(i)\\}}."}</MathBlock></div>

<Prose>{"For C, s=(6−1.5)/6=.75. Positive means its own average is smaller; negative means some foreign average is smaller. Equal positive averages give 0. For nonnegative dissimilarities this ratio lies between −1 and 1. It reports relative neighborhoods, not a probability that the membership is correct."}</Prose>

<Prose>{"A near point in a foreign group does not automatically make that group the competitor. Put a focal point at 0, its own members at −1 and −3, foreign group R at 1,9,11, and foreign group S at −4,4."}</Prose>

<Mechanism id="D07" />

<NeuralTable caption={"3. Silhouette: inspect one point’s neighborhood before averaging"} headers={[<>{"Neighborhood"}</>,<>{"Distances"}</>,<>{"Mean"}</>]} rows={[[<>{"own"}</>,<>{"1,3"}</>,<>{"2"}</>],[<>{"foreign R"}</>,<>{"1,9,11"}</>,<>{"7"}</>],[<>{"foreign S"}</>,<>{"4,4"}</>,<>{"4"}</>]]} />

<Prose>{"S wins the competing-group comparison even though R contains the nearest individual point. Taking b=min(7,4)=4 gives s=.5. Negative coordinates are positions; their distance lengths remain nonnegative."}</Prose>

<Prose>{"Return to C at 2. Move C from L to R. It now averages 5,6,7 to its own group, so a=6; its foreign group contains A/B, giving b=1.5. Its silhouette becomes (1.5−6)/6=−.75. Every other point's score also changes because C left one comparison group and entered another. Alternatively leave memberships fixed and move C's coordinate to 3: a=(3+2)/2=2.5 and b=(4+5+6)/3=5, giving .5."}</Prose>

<Prose>{"Does moving C between bins change every neighborhood? Keep the coordinates fixed and follow one selected ID's fan."}</Prose>

<Investigation id="L1a" />

<Prose>{"Select an ID, choose C's bin L/R, or Reset: three controls. Reset restores coordinates0/1/2/7/8/9, LLLRRR and selected C. The live sentence names that ID's own/foreign means, silhouette and all-six mean. Changing only the selected ID leaves the mean fixed. Try C in R, then inspect D's changed fan as well as C's."}</Prose>

<Prose>{"Can a coordinate change a neighborhood without changing membership? The next fan fixes LLLRRR and moves only C's position."}</Prose>

<Investigation id="L1b" />

<Prose>{"Change C's coordinate in [−20,20] or Reset2. At C=3 its own/foreign means2.5/5 give .5; returning2 restores .75. The live sentence reports C's coordinate, means and silhouette with unchanged membership. Invalid/nonfinite coordinates identify C's field and retain the last valid fan."}</Prose>

<Mechanism id="D08" />

<NeuralTable caption={"3. Silhouette: inspect one point’s neighborhood before averaging"} headers={[<>{"ID"}</>,<>{"Default s"}</>,<>{"C moved: interpretation"}</>]} rows={[[<>{"A"}</>,<>{".812500"}</>,<>{"its own group lost C"}</>],[<>{"B"}</>,<>{".857143"}</>,<>{"its own group lost C"}</>],[<>{"C"}</>,<>{".750000"}</>,<>{"−.750000"}</>],[<>{"D"}</>,<>{".750000"}</>,<>{"its own group gained C"}</>],[<>{"E"}</>,<>{".857143"}</>,<>{"its own group gained C"}</>],[<>{"F"}</>,<>{".812500"}</>,<>{"its own group gained C"}</>]]} />

<Prose>{"The default observation mean is .806548; after C moves it is .459394. A silhouette plot keeps the individual signed bars, sorted within their groups, along with group sizes and the mean. It reveals a negative subgroup that one scalar can hide. IDs stay attached to bars even when their display order changes."}</Prose>

<Prose>{"Multiplying every coordinate by a positive constant multiplies a and b by that constant, which cancels in the ratio. A separate local scale figure asks what changes when every coordinate doubles: its only actions are "}<strong>{"Double every coordinate"}</strong>{" and Reset. Coordinates are read-only; the Double action is disabled if any proposed doubled location would leave [−20,20]. From the default it produces0/2/4/14/16/18, with C's a3/b12 and silhouette .75. Its live sentence states the common scale and unchanged ratio. A singleton in an otherwise valid partition has no own neighbors; its score is defined as0 by convention, not because its nonexistent own average was measured0. If both a and b are0 for coincident points, the implementation also returns0."}</Prose>

<Prose>{"The overall partition must have 2≤k<n occupied groups. One group has no competitor; n singleton groups give no supported silhouette partition. D08's read-only exception strips show LLLLLL, six distinct labels U_A,…,U_F, a valid L/R/S state with singleton C in S, and all-coincident locations with valid two-group membership. The six U labels are an explicit added vocabulary; L/R/S cannot express six groups. The first two strips report "}<strong>{"undefined"}</strong>{", the valid singleton reports conventional0 for C, and the coincident case reports0 with both means0. The full code and solved practice retain arbitrary membership/coordinate exploration. These are distinct drawn cases, without a six-field editor or a state-picker wall."}</Prose>

<Prose>{"What survives a common scale change? Keep the same groups and multiply every location together."}</Prose>

<Investigation id="L1c" />

<Prose>{"Use Double or Reset and inspect both means. The live sentence gives the scale, means and unchanged silhouette. When the next doubling would leave [−20,20], its disabled action explains the boundary; Reset returns to the original ruler."}</Prose>

<Prose>{"A precomputed distance matrix must be n×n, aligned to the same IDs, finite, nonnegative and have a zero diagonal within the declared numerical tolerance. For the ordinary symmetric dissimilarity interpretation, also check symmetry. Euclidean features generate this matrix automatically. A centroid proxy, similarity or directed dissimilarity needs its own declared convention."}</Prose>

<H3>{"Program 1: the complete neighborhood calculation"}</H3>

<Prose>{"Save "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_dense_reference.py"}>{"silhouette_dense_reference.py"}</a>{". Install/run instructions are in "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/CLUSTERING-EVALUATION-SETUP.md"}>{"the setup guide"}</a>{". "}<code>{"points[:,None]"}</code>{" and "}<code>{"points[None,:]"}</code>{" form all row-pair differences; for n×d inputs their broadcast subtraction has shape n×n×d. Taking a norm over the last axis gives n×n distances. This is a transparent small-fixture reference, not the memory-efficient route in "}<a href={"#11-deeper-branch-tendency-relative-selection-and-computation"}>{"section 11"}</a>{"."}</Prose>

<Prose>{"For each i the boolean own mask removes i; foreign masks retain all members of each competitor. "}<code>{"mean()"}</code>{" supplies the exact denominators we traced. "}<code>{"min()"}</code>{" chooses a foreign "}<strong>{"mean"}</strong>{". The remaining zero initialization implements the singleton convention. "}<code>{"silhouette_samples"}</code>{" is the ordinary per-ID counterpart; "}<code>{"silhouette_score"}</code>{" returns their mean."}</Prose>

<Prose>{""}<strong>{"Output provenance."}</strong>{" The six original examples show recorded September stdout for their exact preserved sources. New numerical demonstrations use Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1. Two outputs below are explicitly labeled text projections of recorded streams: the Dunn explanation is removed and the report's input label is shortened, while all numerical results stay unchanged. Those edited sources were not rerun. The Gap output is the unchanged recorded run of the preceding full-SVD source; the shape-aware successor has not been run end to end. Small extracted-function probes assess reference geometry only. The R example is source-only. Running a downloaded file creates your own execution."}</Prose>

<RemoteCodeBlock filename="silhouette_dense_reference.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_dense_reference.py" />

<Prose>{"Recorded example output."}</Prose>

<RemoteCodeBlock filename="silhouette_dense_reference.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_dense_reference.py.stdout.txt" />

<Prose>{"The output includes the common-scale check and changed C/mean. Its "}<code>{"matches library: True"}</code>{" establishes this fixture's numerical correspondence, not a threshold for accepting all future groups."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P1 — choose the competing group."}</strong>{" A point has a=2; foreign distances are 1,9,11 to R and 4,4 to S. Which b and s should you report?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Make a mean for each group before taking a minimum."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"R's mean is (1+9+11)/3=7. S's is (4+4)/2=4. Thus b=4 and s=(4−2)/4=.5. Choosing the nearest individual distance 1 would produce a different quantity and even reverse the sign. The whole competitor group's mean is the operation to preserve when adding another group."}</Prose>

</details></section>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P4 — a minority hidden by the average."}</strong>{" Ninety objects have group mean silhouette .8 and ten have −.4. What do the observation and equal-group means say?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write the count that weights each group."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The observation mean is (90×.8+10×−.4)/100=.68. The equally weighted group mean is (.8−.4)/2=.2. The first describes a uniformly chosen observation; the second gives each group equal weight. Report both group sizes and distributions, particularly if the ten-object group matters to the use. Equal group weighting is not automatically better: splitting a group would change how many equal votes it receives."}</Prose>

</details></section>

<Prose>{"We now know what the neighborhood score does. Before comparing candidate values, ask whether its ruler measures the differences the task needs."}</Prose>

<H2>{"4. A score evaluates a geometry as well as a partition"}</H2>

<Prose>{"Hold the same memberships fixed and change one feature's ruler. Multiplying a feature coordinate by sqrt(w) multiplies its squared contribution to Euclidean distance by w."}</Prose>

<Mechanism id="D09" />

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"d_w(x,y)^2=\\sum_j w_j(x_j-y_j)^2,\\qquad w_j\\ge0."}</MathBlock></div>

<Prose>{"With a difference vector (3,4) and weights (1,1), distance is 5. With weights (1,1/4), the second leg is 2 and distance is sqrt(13). This can change own and foreign means by different factors. If every weight is multiplied by 4, every distance doubles and silhouette is unchanged. A zero weight discards a direction; it can make distinct rows have distance 0, so the ruler is then a pseudometric rather than a full metric. "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#3-make-the-geometry-match-the-question"}>{"K-Means: make the geometry match the question"}</a>{" develops the same distinction between feature weights and fitting counts."}</Prose>

<Prose>{"Rescoring fixed labels changes evaluation geometry. Refitting after changing the geometry can also change labels. The two lanes show these as separate operations; a rescoring control does not secretly run the second one."}</Prose>

<Prose>{"PCA supplies another concrete ruler change. Look first at a full orthogonal coordinate frame and then at its missing leg."}</Prose>

<Mechanism id="D10" />

<Prose>{"For an orthogonal matrix V, "}<code>{"(x−y)V"}</code>{" preserves squared length because VVᵀ=I. Common centering cancels from x−y. With all directions retained and no whitening, pair distances and every silhouette are unchanged. If only q directions remain,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"d_{\\rm full}^2=d_{\\rm kept}^2+d_{\\rm lost}^2."}</MathBlock></div>

<Prose>{"Thus (3,4) has full distance 5 and first-coordinate distance 3. The retained distance cannot increase, but own and foreign means need not shrink by the same fraction; silhouette has no monotonicity guarantee. "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#3-why-maximum-spread-and-minimum-loss-give-the-same-answer"}>{"PCA: maximum spread and minimum loss"}</a>{" explains why keeping variance is a reconstruction criterion. It is not a guarantee to retain a category."}</Prose>

<Prose>{"For the equal-frequency rectangle corners (±10,±1), the first variance fraction is 100/101. Keeping only that horizontal direction collapses the upper/lower distinction completely. A small-variance direction can carry a useful category. The diagram's axes use equal physical scale; stretching its vertical plotting axis must not masquerade as a different distance ruler."}</Prose>

<Prose>{"Whitening divides each retained coordinate by sqrt(lambda_j), for positive fitted component variance lambda_j. It is an additional scaling, not another rotation. For component differences (3,4) and variances (9,16), the whitened difference is (1,1), distance sqrt(2). Locally,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"d_{\\rm white}^2=\\sum_{j=1}^q\\frac{[(x-y)V_j]^2}{\\lambda_j}."}</MathBlock></div>

<Prose>{"This gives more relative influence to low-variance retained directions and is undefined for a zero variance unless a separate exclusion/regularization policy is chosen. Decorrelation is not a claim of statistical independence. See "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#10-deeper-branches"}>{"PCA deeper branches, subsection 10.3: whitening and a probabilistic interpretation"}</a>{", and "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#5-scaling-changes-which-differences-matter"}>{"PCA scaling"}</a>{". Fit those transformations on the appropriate fitting data, then apply their frozen state; "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python"}>{"PCA's full fit/project/reconstruct program"}</a>{" makes that state explicit."}</Prose>

<Prose>{"Compact neighborhoods can also conflict with the intended shape. The following 32 constructed points have radii 1/2 and angles 2π(j+.25)/16, j=0,…,15 on each ring."}</Prose>

<Mechanism id="D11" />

<Prose>{"The ring memberships have recorded mean silhouette .074594. Giving the same points memberships by the vertical rule x<0 versus x≥0 gives .320613. No fitted algorithm is claimed to have produced that slice rule. The higher value says the slices better satisfy this compact-neighborhood ruler; it does not refute a task that wants concentric rings. Later DBSCAN develops density connectivity and rejection. The geometry and desired object must meet before declaring a scalar winner."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P12 — rotation, truncation and whitening."}</strong>{" A difference in full PCA coordinates is (3,4). What lengths result from all coordinates, only the first, and whitening with variances 9/16? Can you infer the new mean silhouette ordering?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Keep rotation, coordinate deletion and coordinate scaling separate."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Full distance is sqrt(9+16)=5. Deletion gives 3. Whitening gives sqrt((3/3)²+(4/4)²)=sqrt(2). These are one pair's distances. Silhouette compares many within/foreign averages and their ratios, so these changes alone do not determine its ordering. To assess the transformed partition, recompute the defined neighborhoods using that same declared transform on every relevant row."}</Prose>

</details></section>

<H3>{"Deeper: three other ways to summarize the same geometry"}</H3>

<Prose>{"For a first pass, "}<a href={"#5-ari-count-the-pairs-before-correcting-for-chance"}>{"continue to pair agreement"}</a>{". Return here when you need to compare additional geometric summaries."}</Prose>

<Prose>{"Return to A0,B1,C2/D7,E8,F9. The group means are 1 and 8; the grand mean is 4.5. Inspect the residual rays before naming their sum."}</Prose>

<Mechanism id="D12" />

<Prose>{"Within-group squared scatter is W=(1+0+1)+(1+0+1)=4. Between-group scatter is B=3(1−4.5)²+3(8−4.5)²=73.5. Expanding each row's difference into its group-centered residual plus its center's displacement gives total scatter T=W+B: the cross term vanishes because residuals within each group sum to 0. This needs Euclidean squared lengths and actual group means. "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#4-derive-the-updates-and-choose-the-seeds"}>{"K-Means update derivation"}</a>{" and its normalized pair-SSE interpretation supply the same mean/residual mechanism."}</Prose>

<Prose>{""}<strong>{"Calinski–Harabasz"}</strong>{" divides B by k−1 and W by n−k before taking their ratio:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"CH=\\frac{B/(k-1)}{W/(n-k)}=\\frac{73.5/1}{4/4}=73.5."}</MathBlock></div>

<Prose>{"The degrees-of-freedom-like divisors penalize adding groups; this index is not automatically a calibrated significance test for optimized clusters. Larger indicates greater between-to-within scatter under this convention. W=0 makes the mathematical ratio undefined/infinite rather than an ordinary finite value. The local scratch program returns an explicit unavailable value; a library may use a finite safeguard instead."}</Prose>

<Prose>{""}<strong>{"Davies–Bouldin"}</strong>{" first averages ordinary distances to each group mean. Each radius here is (1+0+1)/3=2/3. Centers are 7 apart. For each group choose its worst competitor ratio "}<code>{"(radius_g+radius_h)/center_distance"}</code>{"; average those worst ratios. With two groups both ratios are (4/3)/7=4/21≈.190476. Smaller means a better radius/separation ratio. This is the ordinary "}<strong>{"mean radius"}</strong>{" convention used by sklearn, not maximum diameter or RMS radius. RMS scatter is a legitimate different convention and gives a different number. Coincident centers make a denominator 0; the local scratch route declares it undefined instead of silently calling the ratio 0."}</Prose>

<Prose>{""}<strong>{"Dunn"}</strong>{", using minimum between-group point distance divided by maximum within-group diameter, is 5/2=2.5. It is sensitive to one close cross pair or one far internal pair. Other Dunn definitions choose different intergroup/scatter functions; name this particular convention when comparing. A zero maximum diameter makes this local ratio undefined. These three indices and silhouette inspect different distances; none is merely a renamed KMeans objective."}</Prose>

<Prose>{""}<code>{"internal_indices.py"}</code>{" exposes group arrays, their means, ordinary member radii, squared residuals and pairwise extremes. "}<code>{"cdist"}</code>{" supplies finite Euclidean length blocks; it does not decide the index. CH/DB then have ordinary sklearn counterparts. There is no sklearn Dunn function promised. Save the "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/internal_indices.py"}>{"complete program"}</a>{" and run "}<code>{"python internal_indices.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="internal_indices.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/internal_indices.py" />

<Prose>{"Projected output: the final explanatory line is deleted from the recorded stream; the computed indices and correspondence status are unchanged."}</Prose>

<RemoteCodeBlock filename="internal_indices.py.projected-output.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/internal_indices.py.projected-output.txt" />

<Prose>{"Read the output's W/B before CH, and mean radii before DB. The checks compare supported finite six-point values with ordinary APIs. Undefined denominators use the mathematical policy described above, which should not be confused with each library's safeguards."}</Prose>

<Prose>{""}<strong>{"First-pass return:"}</strong>{" continue to "}<a href={"#5-ari-count-the-pairs-before-correcting-for-chance"}>{"section 5"}</a>{". We now switch from distances to relationships between the same IDs; no geometric ruler is needed for the next score."}</Prose>

<H2>{"5. ARI: count the pairs before correcting for chance"}</H2>

<Prose>{"Return to A–H, U="}<code>{"00001111"}</code>{" and the D/E exchange S="}<code>{"00010111"}</code>{". Ask whether two IDs are together, rather than whether their label names match. AB is together in both; AD is together in U but apart in S; AE is apart in U but together in S; AF is apart in both."}</Prose>

<Mechanism id="D13" />

<NeuralTable caption={"5. ARI: count the pairs before correcting for chance"} headers={[<>{"First ID"}</>,<>{"Pair decisions to later IDs"}</>]} rows={[[<>{"A"}</>,<>{"AB:TP, AC:TP, AD:FN, AE:FP, AF:TN, AG:TN, AH:TN"}</>],[<>{"B"}</>,<>{"BC:TP, BD:FN, BE:FP, BF:TN, BG:TN, BH:TN"}</>],[<>{"C"}</>,<>{"CD:FN, CE:FP, CF:TN, CG:TN, CH:TN"}</>],[<>{"D"}</>,<>{"DE:TN, DF:FP, DG:FP, DH:FP"}</>],[<>{"E"}</>,<>{"EF:FN, EG:FN, EH:FN"}</>],[<>{"F"}</>,<>{"FG:TP, FH:TP"}</>],[<>{"G"}</>,<>{"GH:TP"}</>]]} />

<Prose>{"There are choose(8,2)=28 unordered pairs. "}<strong>{"TP"}</strong>{" means together in both, "}<strong>{"FN"}</strong>{" a reference-together pair split by the candidate, "}<strong>{"FP"}</strong>{" a reference-apart pair merged by the candidate, and "}<strong>{"TN"}</strong>{" apart in both. These terms describe pair relations, not eight separate classification trials. Here TP 6/FN 6/FP 6/TN 10. The "}<strong>{"Rand index"}</strong>{" is the fraction of pair decisions that agree: RI=(TP+TN)/28=16/28=4/7."}</Prose>

<Prose>{"Instead of visiting every pair, put the actual IDs into cells whose rows are U bins and columns are S bins."}</Prose>

<Mechanism id="D14" />

<NeuralTable caption={"5. ARI: count the pairs before correcting for chance"} headers={[<>{"U\\S"}</>,<>{"S0"}</>,<>{"S1"}</>,<>{"Row size"}</>]} rows={[[<>{"U0"}</>,<>{"A,B,C:3"}</>,<>{"D:1"}</>,<>{"4"}</>],[<>{"U1"}</>,<>{"E:1"}</>,<>{"F,G,H:3"}</>,<>{"4"}</>],[<>{"Column size"}</>,<>{"4"}</>,<>{"4"}</>,<>{"total 8"}</>]]} />

<Prose>{"ABC contains choose(3,2)=3 pairs together in both; FGH contributes another 3. Let S denote this together-in-both "}<strong>{"count"}</strong>{" in the formulas below, distinct from the named swap fixture: S=6. Let A=sum choose(row_size,2)=12 count reference-together pairs, B=sum choose(column_size,2)=12 count candidate-together pairs, and M=choose(n,2)=28. Then TP=S, FN=A−S, FP=B−S, TN=M−A−B+S. The occupied cells compress the board; they do not change its definition."}</Prose>

<Prose>{"Agreement can arise under random memberships. Choose a specific null experiment: keep U fixed and deal exactly four of the eight IDs into candidate bin 0, with every four-ID subset equally likely. The remaining four go to bin 1. There are choose(8,4)=70 assignments; the margins remain 4/4."}</Prose>

<Mechanism id="D15" />

<Prose>{"For a particular reference-together pair, the chance that the candidate also places it together is B/M=12/28. There are A=12 such pairs, so linearity of expectation gives E[S]=AB/M=36/7. No independence between pair decisions is assumed. We measure excess together agreement above this baseline, normalized by the conventional half-sum of the two together counts:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"ARI=\\frac{S-AB/M}{(A+B)/2-AB/M}\n   =\\frac{6-36/7}{12-36/7}=\\frac18."}</MathBlock></div>

<Prose>{"Zero means this fixed-margin null's expected excess, not “no structure in the data.” A negative value means less agreement than that conditional baseline. The expected unadjusted RI here is 25/49; indeed E[TN]=28−24+36/7=64/7, giving E[(S+TN)/28]=(100/7)/28=25/49. The adjustment removes a specific baseline, not all possible meanings of chance."}</Prose>

<Prose>{"Which bin relations make one board tile? Inspect the two relations for a pair while U/S remain fixed."}</Prose>

<Investigation id="L2a" />

<Prose>{"Select AB, AD, AE and AF in turn. The live sentence names each pair's two relations and TP/TN/FP/FN type; board totals stay fixed. Reset returns to AB."}</Prose>

<Prose>{"How does moving identified members change that board? Leave U and six candidate memberships fixed, and vary only D/E's candidate bins."}</Prose>

<Investigation id="L2b" />

<Prose>{"The two bin controls plus Reset to S's D1/E0 are three controls. D0/E1 restores identical U and ARI1; mixed settings change margins and recompute their own expectation. The live sentence gives D/E's bins, candidate sizes, TP, expected TP and ARI. Try returning just D before restoring E and inspect the changed margins."}</Prose>

<Prose>{"Can a name change alter those relations? The next fixed-S board changes only its printed bin names."}</Prose>

<Investigation id="L2c" />

<Prose>{"Rename, then Reset; the live sentence reports unchanged ID sets and ARI1/8. The cross "}<code>{"00110011"}</code>{", constant and arbitrary integer-label comparisons remain separate worked drawings/code cases; refinement "}<code>{"00112233"}</code>{" returns in "}<a href={"#7-explain-which-groups-split-or-merge"}>{"section7"}</a>{". Invalid alignment is a failed comparison, not zero agreement."}</Prose>

<H3>{"Program 2: the board and its shortcut in one file"}</H3>

<Prose>{""}<code>{"Counter(zip(u,v))"}</code>{" builds occupied cell counts after ID alignment. "}<code>{"Counter(u)"}</code>{" and "}<code>{"Counter(v)"}</code>{" build margins. "}<code>{"comb(count,2)"}</code>{" counts unordered within-cell/within-margin pairs. Read those three reductions as S,A,B before dividing by M; the final direct "}<code>{"combinations"}</code>{" loop independently visits the same 28 decisions. The ordinary APIs "}<code>{"rand_score"}</code>{" and "}<code>{"adjusted_rand_score"}</code>{" compare aligned memberships and ignore label renaming. Save "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/pair_agreement_reference.py"}>{"pair_agreement_reference.py"}</a>{", then run "}<code>{"python pair_agreement_reference.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="pair_agreement_reference.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/pair_agreement_reference.py" />

<Prose>{"Recorded example output."}</Prose>

<RemoteCodeBlock filename="pair_agreement_reference.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/pair_agreement_reference.py.stdout.txt" />

<Prose>{"Its recorded RI .571429 is 4/7 and ARI .125 is 1/8. The renamed ARI remains .125 because the relation stayed fixed. For large datasets, contingency reductions avoid O(n²) explicit board enumeration; with hashable labels, count construction is expected O(n), followed by occupied-cell/margin reductions. Encoding or dense matrices can add their own costs."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P11 — an ordered-pair API."}</strong>{" The unordered board has TP 6/TN 10/FN 6/FP 6. What does sklearn's "}<code>{"pair_confusion_matrix"}</code>{" report?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Its ordered pairs count both (i,j) and (j,i)."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Each count doubles. In its TN/FP;FN/TP row layout the matrix is "}<code>{"[[20,12],[12,12]]"}</code>{", total 56 rather than 28. Divide each count by 2 to compare with this board. The normalized RI is unchanged because its numerator and denominator both doubled. Dividing a normalized score by 2 would be wrong."}</Prose>

</details></section>

<H3>{"Deeper: specify the null and the degeneracies"}</H3>

<Prose>{"For a first pass, "}<a href={"#6-nmi-how-much-does-one-label-tell-us-about-the-other"}>{"continue to membership information"}</a>{". Return here to examine alternative chance experiments and boundary conventions."}</Prose>

<Prose>{"Many apart/apart pairs can make RI look reassuring. Consider a "}<strong>{"different"}</strong>{" null in which labels are independently sampled uniformly from five bins in each of two partitions."}</Prose>

<Mechanism id="D16" />

<Prose>{"For a pair, together/together probability is (1/5)²=1/25; apart/apart is (4/5)²=16/25. Expected RI is 17/25=.68. This is an iid label experiment with random margins, not the earlier conditional 4/4 experiment. Its .68 cannot be substituted into the ARI derivation above."}</Prose>

<Prose>{"The conventional upper term (A+B)/2 need not be attainable if the margins differ: exact agreement requires identical same-group relationships and thus compatible sizes. The definition is still the stated normalization; do not manufacture a perfect assignment with incompatible groups to make it attainable. Bounds and properties belong to the particular adjusted measure/null, not every similarly named score."}</Prose>

<Prose>{"Equivalent partitions receive ARI 1, including both one-group partitions or both all-singleton partitions by the usual degenerate convention. They can have no useful resolution. With fewer than two IDs there are no pair decisions; an API's convention must not be interpreted as evidence. The local new comparison programs reject an empty set. These cases are separate from silhouette's 2≤k<n domain."}</Prose>

<Prose>{""}<strong>{"First-pass return:"}</strong>{" continue to "}<a href={"#6-nmi-how-much-does-one-label-tell-us-about-the-other"}>{"section 6"}</a>{". Pair counting sees sameness. We will now ask how knowing a membership reduces uncertainty about another."}</Prose>

<H2>{"6. NMI: how much does one label tell us about the other?"}</H2>

<Prose>{"Choose one of A–H uniformly, but do not reveal its ID. Each has probability 1/8. Ask which reference bin contains it."}</Prose>

<Mechanism id="D17" />

<CodeBlock language={"text"}>{"unknown ID: A B C D E F G H, each1/8\nU membership:   U0 with probability4/8   |   U1 with probability4/8"}</CodeBlock>

<Prose>{"One yes/no membership question distinguishes these equal alternatives. We call that uncertainty 1 "}<strong>{"bit"}</strong>{". For unequal probabilities p, the surprise of an outcome is−log₂(p); rare outcomes are more surprising. The average surprise is "}<strong>{"entropy"}</strong>{", H=−Σp log₂(p). A probability 0 contributes 0 rather than requiring log(0). This expected quantity need not be an integer number of literal binary questions for every outcome."}</Prose>

<Prose>{"Use the four-fragment refinement "}<strong>{"R"}</strong>{": V="}<code>{"00112233"}</code>{", with bins AB/CD/EF/GH. It has four equally likely memberships, requiring 2 bits. Revealing V tells us U exactly: each candidate bin lies within one U bin. Revealing U leaves two possible V bins, or 1 bit, inside either reference branch."}</Prose>

<Mechanism id="D18" />

<CodeBlock language={"text"}>{"reveal V first: V0 AB→U0, V1 CD→U0, V2 EF→U1, V3 GH→U1\nreveal U first: U0→{V0 AB or V1 CD}; U1→{V2 EF or V3 GH}"}</CodeBlock>

<Prose>{"The remaining uncertainties are H(U|V)=0 and H(V|U)=1. "}<strong>{"Mutual information"}</strong>{", I, is the uncertainty removed: H(U)−H(U|V)=1, equally H(V)−H(V|U)=1. This directional reasoning explains why one membership can determine the other without the partitions being identical."}</Prose>

<Prose>{"Let n_ij be the cell size, a_i its row margin, b_j its column margin and n the common ID count. Uniformly sampling IDs gives joint probability n_ij/n and marginal probabilities a_i/n,b_j/n. The exact cell calculation is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"I(U;V)=\\sum_{n_{ij}>0}\\frac{n_{ij}}n\n             \\log_2\\frac{n\\,n_{ij}}{a_i b_j}."}</MathBlock></div>

<Prose>{"For R's four occupied two-ID cells, each contribution is (2/8)log₂((8×2)/(4×2))=1/4 bit, totaling 1. Entropies come from their respective margins; H(U|V)=H(U)−I and H(V|U)=H(V)−I. These are empirical membership probabilities on the fixed ID set, not probabilities inferred for a biological population."}</Prose>

<Prose>{"A "}<strong>{"normalized mutual information"}</strong>{", NMI, divides I by a named scale. Compare those actual scales rather than drawing information as a literal overlap area of entropy circles."}</Prose>

<Mechanism id="D19" />

<NeuralTable caption={"6. NMI: how much does one label tell us about the other?"} headers={[<>{"Normalizer"}</>,<>{"R denominator"}</>,<>{"R NMI"}</>]} rows={[[<>{"arithmetic mean"}</>,<>{"(1+2)/2=1.5"}</>,<>{"2/3"}</>],[<>{"geometric mean"}</>,<>{"sqrt(1×2)"}</>,<>{"1/sqrt(2)"}</>],[<>{"minimum"}</>,<>{"min(1,2)=1"}</>,<>{"1"}</>],[<>{"maximum"}</>,<>{"max(1,2)=2"}</>,<>{"1/2"}</>]]} />

<Prose>{"The arithmetic version is the ordinary default used here; name it explicitly in code. Min-normalized NMI 1 does not prove identical partitions. It can mean one direction retained all information, as R demonstrates. Both constant partitions conventionally yield 1; one constant versus a nonconstant yields 0. Their entropies 0 would otherwise create undefined denominators. Consistent logarithm-base changes cancel in normalized ratios, but sklearn's unnormalized MI is in "}<strong>{"nats"}</strong>{": divide by log(2) to compare with bits."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P9 — NMI 1 under refinement."}</strong>{" Given H(U)=1,H(V)=2,I=1, does NMI 1 establish that no group split?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Name the denominator before interpreting the ratio."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Arithmetic NMI=1/1.5=2/3; geometric=1/sqrt(2); min=1; max=1/2. The min result 1 says the smaller uncertainty is fully explained. V still adds an extra bit of distinctions and splits each U group. Inspection of the actual cells and both conditional uncertainties prevents “normalized” from becoming an unspecified identity test."}</Prose>

</details></section>

<Prose>{"NMI also has chance agreement. Return to the balanced 4/4 candidate allocations, not R's different four-bin margins. Exactly seventy allocations distribute their overlap with U's first group as follows."}</Prose>

<Mechanism id="D20" />

<NeuralTable caption={"6. NMI: how much does one label tell us about the other?"} headers={[<>{"Overlap r"}</>,<>{"Number of assignments"}</>,<>{"Table rows"}</>,<>{"MI in bits"}</>]} rows={[[<>{"0"}</>,<>{"1"}</>,<>{"[0,4]/[4,0]"}</>,<>{"1"}</>],[<>{"1"}</>,<>{"16"}</>,<>{"[1,3]/[3,1]"}</>,<>{".188721876"}</>],[<>{"2"}</>,<>{"36"}</>,<>{"[2,2]/[2,2]"}</>,<>{"0"}</>],[<>{"3"}</>,<>{"16"}</>,<>{"[3,1]/[1,3]"}</>,<>{".188721876"}</>],[<>{"4"}</>,<>{"1"}</>,<>{"[4,0]/[0,4]"}</>,<>{"1"}</>]]} />

<Prose>{"The most common table has empirical independence: every joint probability 1/4 equals its marginal product 1/2×1/2. Its MI is 0. But the average over all seventy valid allocations is positive, about .114844286 bit. "}<strong>{"Adjusted mutual information"}</strong>{", AMI, subtracts the expected information for those margins and rescales the excess:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"AMI=\\frac{I-E[I]}{(H(U)+H(V))/2-E[I]}."}</MathBlock></div>

<Prose>{"For the independent balanced table, AMI = (0 − .114844286) / (1 − .114844286) ≈ −.129744726. Unadjusted independence and adjusted zero are different statements. Exact null averages of adjusted scores are 0 up to numerical rounding; no biological null hypothesis or significance level is implied."}</Prose>

<Prose>{"What does knowing a bin resolve? Keep U/R fixed and follow the conditional tree with the named denominator beside it."}</Prose>

<Investigation id="L3a" />

<Prose>{"Choose known U/V, choose a named normalizer, or Reset to known V/arithmetic. The live sentence reports remaining conditional uncertainty, invariant MI1bit and the named NMI. Change the known membership before changing the denominator to distinguish their effects."}</Prose>

<Prose>{"Which overlap tables are feasible? Keep the eight-ID universe fixed and derive the four cells from the two bin counts and their overlap."}</Prose>

<Investigation id="L3b" />

<Prose>{"These are exactly three controls, with a/b1–7 and r0–8. Feasible r lies between max(0,a+b−8) and min(a,b); derived cell counts are read-only. An infeasible field change retains the valid table with a reason instead of silently clamping r. The live sentence gives feasible bounds, overlap probability/MI and margin-conditioned expected MI. Change r alone to see the null expectation stay fixed, then change a margin to see allocation counts and expectation change. It cannot retain the old seventy-allocation experiment under different margins. Copied-U, cross, singleton and constant cases remain visible worked tables and complete-code/solved routes."}</Prose>

<H3>{"Scratch entropy first, then expected information"}</H3>

<Prose>{"The complete "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/information_scores.py"}>{"information_scores.py"}</a>{" starts with unique "}<code>{"(ID,label)"}</code>{" records and aligns by ID. "}<code>{"Counter"}</code>{" counts occupied cells/margins. Its "}<code>{"entropy"}</code>{" loop divides counts by their total before the logarithm; its "}<code>{"information"}</code>{" loop visits only positive occupied cells. Conditional uncertainty subtracts MI from each entropy. This is the arithmetic we just inspected. For the first pass, run "}<code>{"python information_scores.py --core"}</code>{": it prints actual cells, bits and all four named normalizers and checks ordinary MI/NMI correspondence. The full file is displayed after the following deeper expectation derivation, where its additional algorithm is explained."}</Prose>

<H3>{"Deeper: expected information without enumerating every partition"}</H3>

<Prose>{"For a first pass, you may run the linked information file with "}<code>{"--core"}</code>{", then "}<a href={"#7-explain-which-groups-split-or-merge"}>{"continue to split/merge diagnosis"}</a>{". The complete file below includes the additional expected-information algorithm derived here."}</Prose>

<Prose>{"Focus on one cell whose margins are a=4,b=4,n=8. Under the fixed-margin null, r of the b chosen IDs come from the a-ID row. Count choose(a,r) ways to take those IDs and choose(n−a,b−r) ways to fill the rest. Divide by choose(n,b):"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"P(n_{ij}=r)=\\frac{\\binom{a_i}{r}\\binom{n-a_i}{b_j-r}}\n                         {\\binom{n}{b_j}},\\quad\n\\max(0,a_i+b_j-n)\\le r\\le\\min(a_i,b_j)."}</MathBlock></div>

<Prose>{"For this cell the weights are 1,16,36,16,1 over 70. Its information contribution at r=1 is (1/8)log₂(1/2)=−1/8 bit; at r=3 it is (3/8)log₂(3/2)≈.219360938 bit. A cell contribution can be negative even though total MI is nonnegative. Weighting its feasible contributions gives expected cell information .0287110714904 bit. There are four symmetric cells, so linearity of expectation gives 4×that=.114844285962 bit. The cells are coupled by margins; multiplying four cell probabilities as if independent would be wrong."}</Prose>

<Prose>{"The efficient "}<code>{"expected_information"}</code>{" loops over row/column margins and each feasible overlap. It skips r=0 only because its contribution is 0. "}<code>{"lgamma"}</code>{" computes logarithms of combinations without constructing enormous factorials; exponentiating their difference produces the probability. "}<code>{"fsum"}</code>{" reduces accumulation error, including signed contributions. Cost depends on the sum of feasible overlap counts across row/column pairs, not a universal O(n) bound. This pedagogical implementation stores those contributions; a streaming reduction can reduce that temporary memory."}</Prose>

<Prose>{"Equivalent partitions are recognized by one occupied cell per row and column and return AMI 1, including equivalent constant/all-singleton cases. For nonequivalent partitions whose denominator is numerically near 0, this scratch route reports a domain error using the explicitly scaled 1e−12 tolerance. Ordinary sklearn has its own epsilon convention. That boundary policy is not an unconditional clipping of meaningful negative AMI. Tiny roundoff in nonnegative entropy/MI identities is handled only within a scale-aware tolerance; a material negative quantity raises an error."}</Prose>

<Prose>{"Run the default "}<code>{"python information_scores.py"}</code>{" for the full scratch/ordinary route. R's margins give a different expected MI, .428571428571 bit and AMI .533333333; the cross fixture gives the balanced expectation .114844285962 bit and AMI −.129744726. A baseline belongs to its margins, not to a score name. Ordinary "}<code>{"mutual_info_score"}</code>{", "}<code>{"normalized_mutual_info_score(..., average_method='arithmetic')"}</code>{" and "}<code>{"adjusted_mutual_info_score(..., average_method='arithmetic')"}</code>{" are checked on the same encoded relationships."}</Prose>

<RemoteCodeBlock filename="information_scores.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/information_scores.py" />

<Prose>{"Actual new instructional output in Python 3.12.14 / NumPy 2.3.5 / SciPy 1.18.1 / scikit-learn 1.9.1."}</Prose>

<RemoteCodeBlock filename="information_scores.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/information_scores.py.stdout.txt" />

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P10 — a negative cell and a positive expectation."}</strong>{" For a=b=4,n=8, compare the r=1 and r=3 cell contributions. Can either contribution's sign alone establish the table's MI or chance expectation?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use "}<code>{"(r/8)log₂(r/2)"}</code>{", then distinguish a cell from a complete table."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"r1 gives −.125 bit and r3 gives .219360938 bit. In the balanced off-diagonal 3/1 table, two of each give 2(−.125+.219360938)=.188721876 bit, positive. For one cell's null expectation, r0/r2 contribute 0, r1 and r3 each have probability 16/70, and r4 contributes .5 bit with probability 1/70. The weighted result is .0287110714904 bit; summing four cell expectations gives .114844285962 bit. The table constraints determine which cells coexist. Individual contributions are neither independent scores nor independent random events."}</Prose>

</details></section>

<H3>{"Program 3: independently enumerate the seventy assignments"}</H3>

<Prose>{"After learning the compact expectation, use the original "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/fixed_margin_enumeration.py"}>{"fixed_margin_enumeration.py"}</a>{". One "}<code>{"combinations(range(8),4)"}</code>{" entry lists the IDs given candidate label 0; all other IDs receive 1. Each resulting table feeds the ordinary ARI/NMI/AMI functions with arithmetic normalization. The overlap histogram uses how many of the first four IDs received 0. The finite enumeration is independent of the hypergeometric shortcut; it is a small exact teaching oracle, not a scalable method for unrestricted n."}</Prose>

<RemoteCodeBlock filename="fixed_margin_enumeration.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/fixed_margin_enumeration.py" />

<Prose>{"Recorded example output."}</Prose>

<RemoteCodeBlock filename="fixed_margin_enumeration.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/fixed_margin_enumeration.py.stdout.txt" />

<Prose>{"Its recorded 70 assignments, overlap counts [1,16,36,16,1] and mean NMI .114844 reflect H(U)=H(V)=1, so arithmetic NMI equals MI in bits on these balanced margins. The printed near-zero adjusted means verify the declared conditional experiment. Keep that restricted interpretation when the margin controls change."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P2 — cross rather than recover."}</strong>{" Compare U="}<code>{"00001111"}</code>{" with V="}<code>{"00110011"}</code>{". Find RI, ARI, MI/NMI and explain the adjusted information sign."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Each occupied cell has two IDs. Compute margins and probabilities separately."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The four cells each contribute choose(2,2)=1, so S=4; A=B=12 and M=28. FN=FP=8 and TN=28−12−12+4=8, giving RI=(4+8)/28=3/7. The fixed-margin baseline is 36/7; ARI=(4−36/7)/(12−36/7)=−1/6. Each joint probability 1/4 equals the product 1/2×1/2, so each occupied log ratio is 0 and MI/NMI=0. The null's expected MI is nevertheless .114844285962 bit, giving AMI≈−.129744726. This is a low-agreement relation between these two partitions, not evidence that the coordinates could not support some other useful grouping."}</Prose>

</details></section>

<Prose>{""}<strong>{"First-pass return:"}</strong>{" continue to "}<a href={"#7-explain-which-groups-split-or-merge"}>{"section 7"}</a>{". A global agreement number can still hide which groups were split or mixed."}</Prose>

<H2>{"7. Explain which groups split or merge"}</H2>

<Prose>{"Put actual IDs back into the cells. A reference row spread across columns was split; a candidate column containing several reference rows mixed them. The R refinement and S exchange answer different directional questions."}</Prose>

<Mechanism id="D21" />

<NeuralTable caption={"7. Explain which groups split or merge"} headers={[<>{"U\\R"}</>,<>{"R 0"}</>,<>{"R 1"}</>,<>{"R 2"}</>,<>{"R 3"}</>]} rows={[[<>{"U0"}</>,<>{"AB:2"}</>,<>{"CD:2"}</>,<>{"—"}</>,<>{"—"}</>],[<>{"U1"}</>,<>{"—"}</>,<>{"—"}</>,<>{"EF:2"}</>,<>{"GH:2"}</>]]} />

<Prose>{"R has pure columns, but both reference groups split in two. S instead has the 3/1 and 1/3 columns shown in "}<a href={"#5-ari-count-the-pairs-before-correcting-for-chance"}>{"section 5"}</a>{", so both candidate groups mix reference groups. A small reference group deserves its own row inspection: a group of four contributes choose(4,2)=6 internal pairs; a singleton contributes none, though merging it still creates false together pairs with other IDs. Pair-weighted aggregates cannot automatically give every rare group equal operational importance."}</Prose>

<Prose>{""}<strong>{"Homogeneity"}</strong>{" asks whether each candidate bin explains the reference membership: h=1−H(U|V)/H(U), with 1 when H(U)=0. "}<strong>{"Completeness"}</strong>{" asks whether each reference bin stays together: c=1−H(V|U)/H(V), with 1 when H(V)=0. Their harmonic mean "}<strong>{"V-measure"}</strong>{" is 2hc/(h+c), with 0 when both are 0. For R, H(U|V)=0/H(V|U)=1 and H(U)=1/H(V)=2; thus h=1,c=.5,V=2/3. Perfect h is compatible with fragmentation."}</Prose>

<H3>{"Deeper: purity versus a one-to-one recovery"}</H3>

<Prose>{"For a first pass, "}<a href={"#8-real-data-separate-geometric-selection-from-reference-agreement"}>{"continue to the real-data comparison"}</a>{". Return to these two deeper branches when recovery needs an explicit matching interpretation or directional pair/information diagnostics."}</Prose>

<Prose>{"For each candidate column, count its largest reference contribution. Add those majorities and divide by n to obtain "}<strong>{"purity"}</strong>{". In R every column is pure, so purity=8/8=1. Now refine all the way to eight singleton bins: every column is still pure."}</Prose>

<Mechanism id="D22" />

<Prose>{"If the intended recovery requires one candidate bin per reference bin, choose a "}<strong>{"one-to-one matching"}</strong>{" of rows and columns instead. For R's 2×4 table, a matched row/column pair contributes at most two observations. Two rows can match only two columns, giving matched count 4/8, with four observations in unmatched fragments counted as errors. The unused columns do not disappear from the denominator. Eight singleton columns permit only two matched observations, or 2/8, despite purity 1."}</Prose>

<Prose>{"This is a maximum-weight bipartite assignment: a row and a column can each be used once. A small exact scratch oracle pads the rectangular matrix with zero rows/columns and enumerates permutations, sums one cell per padded row, and retains the largest sum. Padding zeros represent unmatched bins. The factorial enumeration is useful only for at most eight toy bins. The ordinary scalable route "}<code>{"scipy.optimize.linear_sum_assignment(matrix, maximize=True)"}</code>{" solves the same rectangular optimization without enumeration. Label names have no effect on these weights. This recovery criterion is appropriate only if one-to-one correspondence is actually the task."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P3 — singleton purity."}</strong>{" U has the original two four-ID bins. Candidate V="}<code>{"01234567"}</code>{" puts every ID in its own bin. Compute purity, arithmetic NMI, ARI and AMI; does purity establish recovered groups?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The unique candidate ID determines U, but makes more distinctions than U."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Purity is 1 because every singleton column contains one reference label. H(V)=log₂8=3 bits, H(U)=1 bit and I=1 bit because V determines U, so arithmetic NMI=1/((1+3)/2)=.5. Candidate together count B=0 and TP=0; with A=12 the ARI numerator is 0 and its denominator 6, so ARI 0. Every allowed allocation of eight singleton labels still determines U; E[I]=1 bit for these margins, giving AMI=(1−1)/(2−1)=0, up to numerical roundoff. Matched recovery is only 2/8. Fragmentation cannot win a recovery task merely by purity. This .5 is NMI; it is neither R's FM nor proof of symmetric pair errors."}</Prose>

</details></section>

<H3>{"Deeper: the pair and information directions remain different"}</H3>

<Prose>{"The pair precision is TP/(TP+FP), recall is TP/(TP+FN). "}<strong>{"Fowlkes–Mallows"}</strong>{", FM, is their geometric mean. Use the literal fixture before the score:"}</Prose>

<Mechanism id="D23" />

<Prose>{"For "}<strong>{"R"}</strong>{", U="}<code>{"00001111"}</code>{", V="}<code>{"00112233"}</code>{", the occupied two-ID cells give TP 4/FP 0/FN 8/TN 16. Precision = 4 / 4 = 1, recall = 4 / 12 = 1 / 3, hence FM = 1 / sqrt(3) = .5773502691896258. For "}<strong>{"S"}</strong>{", V="}<code>{"00010111"}</code>{", TP 6/FP 6/FN 6/TN 10 gives precision = recall = .5 and FM = .5. Perfect precision under refinement and symmetric swap errors must not share an expected output. When a denominator has no together pairs, a directional fraction is undefined; the ordinary FM convention returns 0. The scratch program makes both the absent fraction and the declared FM convention visible."}</Prose>

<Prose>{"The information counterpart sums the two remaining uncertainties: "}<strong>{"variation of information"}</strong>{", VI=H(U|V)+H(V|U). R gives 0+1=1 bit. The eight-singleton extension gives 0+2=2 bits. VI is a metric on partitions of the same finite object set, identifying partitions that differ only by label names. Symmetry and nonnegativity follow from the two conditional entropies; zero requires both memberships determine one another. For the triangle route, H(U|W)≤H(U|V)+H(V|W): conditioning additionally on V cannot increase remaining uncertainty, while the joint uncertainty of U,V given W decomposes into H(V|W)+H(U|V,W). Apply the analogous inequality in the other direction and add them. This is a statement about that exact VI domain and units, not permission to use 1−NMI or 1−ARI as an arbitrary clustering distance with metric guarantees."}</Prose>

<Prose>{""}<code>{"partition_diagnostics.py"}</code>{" reuses the now-explained visible "}<code>{"information_scores.py"}</code>{" helper, so download both files together. It prints literal U/V, cell names/counts, TP/FP/FN/TN, directional fractions, matching errors and VI. Margin-combination totals reproduce the direct-pair definition. The tiny permutation oracle checks the ordinary assignment result on the toy matrices; ordinary "}<code>{"homogeneity_completeness_v_measure"}</code>{" and "}<code>{"fowlkes_mallows_score"}</code>{" check the named diagnostic conventions. Run "}<code>{"python partition_diagnostics.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="partition_diagnostics.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/partition_diagnostics.py" />

<Prose>{"Actual new instructional output in Python 3.12.14 / NumPy 2.3.5 / SciPy 1.18.1 / scikit-learn 1.9.1."}</Prose>

<RemoteCodeBlock filename="partition_diagnostics.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/partition_diagnostics.py.stdout.txt" />

<Prose>{"The R output shows FM .5773502691896258 beside precision 1 and recall 1/3, purity 1 beside matching .5, and VI 1 bit beside h=1/c=.5. Each value answers a different question about the same cells. The S and singleton output rows are separately named, with no reused R expectation. Renaming R's bins pear/oak/pine/ash leaves its counts and FM unchanged."}</Prose>

<Prose>{""}<strong>{"First-pass return:"}</strong>{" continue to "}<a href={"#8-real-data-separate-geometric-selection-from-reference-agreement"}>{"section 8"}</a>{". We can now interpret the real data's distance and membership results separately and inspect the specimens responsible."}</Prose>

<H2>{"8. Real data: separate geometric selection from reference agreement"}</H2>

<Prose>{"Return to the same 150 Iris IDs. We have learned why a score changes when labels change, and why silhouette can change even when they do not. Keep both forms of correspondence visible as we compare four representations."}</Prose>

<Mechanism id="D24" />

<NeuralTable caption={"8. Real data: separate geometric selection from reference agreement"} headers={[<>{"Representation"}</>,<>{"Row operation"}</>,<>{"Fitting/scoring coordinates"}</>]} rows={[[<>{"raw4"}</>,<>{"the four cm measurements"}</>,<>{"4"}</>],[<>{"scaled4"}</>,<>{"subtract each fitted feature mean, divide by its fitted scale"}</>,<>{"4 standardized coordinates"}</>],[<>{"pca2"}</>,<>{"rotate standardized rows, retain the first two components"}</>,<>{"2 unwhitened coordinates"}</>],[<>{"white2"}</>,<>{"additionally divide the two retained coordinates by their positive variance square roots"}</>,<>{"2 whitened coordinates"}</>]]} />

<Prose>{"These are four "}<strong>{"descriptive analyses"}</strong>{" fitted on all 150 rows. Their whole-set scaler means are "}<code>{"[5.843333333333335,3.057333333333334,3.7580000000000027,1.199333333333334]"}</code>{"; scales are "}<code>{"[.8253012917851409,.43441096773549437,1.7594040657753032,.7596926279021594]"}</code>{". In that state specimen 0's first standardized coordinate is "}<code>{"(5.1−5.843333333333335)/.8253012917851409"}</code>{". This is an operation on a measured value, not a new fitted number. The retained component variances are 2.938085050199996 and .9201649041624888. Whole-set state is suitable for describing these rows; it is a different scope from the fit-only state in "}<a href={"#12-a-report-you-can-defend-then-try-on-your-own"}>{"section 12"}</a>{"."}</Prose>

<Prose>{"Each lane carries its own membership vector, per-ID silhouette vector and species/candidate cells. The common scatter view uses the fixed two-component coordinates to show all assignments on the same axes. The "}<code>{"raw4"}</code>{" scores still use raw four-dimensional distances, and "}<code>{"scaled4"}</code>{" scores still use four standardized dimensions. "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#8-connect-pca-to-clustering-and-prediction"}>{"PCA's connection to clustering"}</a>{" is exactly this distinction between a useful view and the geometry of a task."}</Prose>

<Mechanism id="D25" />

<NeuralTable caption={"8. Real data: separate geometric selection from reference agreement"} headers={[<>{"Space"}</>,<>{"k"}</>,<>{"Mean silhouette"}</>,<>{"Species ARI"}</>,<>{"Species AMI"}</>,<>{"Negative silhouettes"}</>]} rows={[[<>{"raw4"}</>,<>{"2"}</>,<>{".681046"}</>,<>{".539922"}</>,<>{".653838"}</>,<>{"0"}</>],[<>{"raw4"}</>,<>{"3"}</>,<>{".552819"}</>,<>{".730238"}</>,<>{".755119"}</>,<>{"0"}</>],[<>{"scaled4"}</>,<>{"2"}</>,<>{".581750"}</>,<>{".568116"}</>,<>{".731585"}</>,<>{"0"}</>],[<>{"scaled4"}</>,<>{"3"}</>,<>{".459948"}</>,<>{".620135"}</>,<>{".655223"}</>,<>{"2"}</>],[<>{"pca2"}</>,<>{"2"}</>,<>{".614520"}</>,<>{".568116"}</>,<>{".731585"}</>,<>{"0"}</>],[<>{"pca2"}</>,<>{"3"}</>,<>{".509168"}</>,<>{".620135"}</>,<>{".655223"}</>,<>{"0"}</>],[<>{"white2"}</>,<>{"2"}</>,<>{".487163"}</>,<>{".568116"}</>,<>{".731585"}</>,<>{"0"}</>],[<>{"white2"}</>,<>{"3"}</>,<>{".479638"}</>,<>{".580252"}</>,<>{".611417"}</>,<>{"1"}</>]]} />

<Prose>{"Select a specimen ID and track its measured row, plotted point, signed bar and species/candidate cell. A cell contains actual IDs; species rows and candidate columns use separate meanings. Every table sums to 150, including 50 specimens per species. A small negative count can motivate close inspection even when the mean is positive. Changing the display ordering of bars never changes the underlying ID correspondence."}</Prose>

<Prose>{"How does one specimen connect the stored views? The measured row, scatter, signed bar and species cell remain attached to its ID."}</Prose>

<Investigation id="L4a" />

<Prose>{"Choose raw4/scaled4/pca2/white2, k2/3 and ID0–149: exactly three controls, initiallyraw4/k2/0, with no separate mode or Reset. Each combination selects a stored record. Its live sentence names the record, specimen membership/silhouette and all150 mean/species ARI. No model is refitted. Compare the same specimen at k2/3 before changing its representation."}</Prose>

<Prose>{"The scaled4-k3 and pca2-k3 partitions are identical as relations: ARI 1 between them, despite a bin-name permutation. Their species agreement scores therefore agree. Their silhouettes differ, .459948 versus .509168, because one uses four-coordinate distances and the other two. That is an informative contrast, not a scoring inconsistency."}</Prose>

<Prose>{"Now freeze the scaled4-k3 memberships and alter only the petal-width weight. Its recorded rescores isolate evaluation geometry from fitting."}</Prose>

<Mechanism id="D26" />

<NeuralTable caption={"8. Real data: separate geometric selection from reference agreement"} headers={[<>{"Frozen scaled4-k3 ruler"}</>,<>{"Mean silhouette"}</>]} rows={[[<>{"weights [1,1,1,.25]"}</>,<>{".454404648219"}</>],[<>{"weights [1,1,1,1]"}</>,<>{".459948239205"}</>],[<>{"weights [1,1,1,4]"}</>,<>{".471241834929"}</>],[<>{"weights [4,4,4,4]"}</>,<>{".459948239205"}</>]]} />

<Prose>{"The first/third change one squared-coordinate contribution; the last multiplies every distance by 2. Species ARI and AMI remain fixed because their inputs are unchanged memberships. A fitted result for a different ruler would require a separate refit; these rescores provide no such result."}</Prose>

<Prose>{"Can a changed ruler alter neighborhoods without altering membership? Keep scaled4-k3 fixed and stretch only the petal-width contribution."}</Prose>

<Investigation id="L4b" />

<Prose>{"Choose petal-width weight .25–4 step.25, select ID0–149, or Reset to weight1/ID0. Other three weights remain1 and read-only. The live sentence gives that ID's own/foreign means, silhouette, all150 mean and fixed species agreement. Compare .25 and4 for one ID before inspecting another."}</Prose>

<Prose>{"Why does a common multiplier leave silhouette unchanged? Keep the partition fixed and scale all four contributions together."}</Prose>

<Investigation id="L4c" />

<Prose>{"Change common factor .25–4 step.25 or Reset1. All four weights equal that factor; the live sentence reports distance scale sqrt(factor) and unchanged mean. The four-weight operands remain in the worked table and full code without simultaneous individual fields."}</Prose>

<H3>{"Program 4: reproduce the defined descriptive analyses"}</H3>

<Prose>{"Download "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_descriptive_comparison.py"}>{"iris_descriptive_comparison.py"}</a>{" and "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris.csv"}>{"iris.csv"}</a>{" into the same directory. "}<code>{"Path(__file__).with_name('iris.csv')"}</code>{" locates that sibling file offline. The six CSV columns are ID,four features,species; "}<code>{"data[:,1:5]"}</code>{" selects only the features, "}<code>{"data[:,5]"}</code>{" the separate annotation. The raw feature array is 150×4."}</Prose>

<Prose>{""}<code>{"StandardScaler().fit_transform(x)"}</code>{" learns means/scales from these descriptive rows. "}<code>{"PCA(n_components=2,whiten=...)"}</code>{" learns a rotation and retained variances on standardized rows. Each representation then gets its own KMeans fit with k2/3, n_init=20 and random_state=17. Multiple starts help avoid poor local minima; they do not guarantee the global optimum. The ordinary "}<code>{"silhouette_samples"}</code>{" supplies the full vector and mean; ARI/AMI use species only after the fit. "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#8-use-library-fits-without-losing-the-contract"}>{"K-Means ordinary fits and their contract"}</a>{" explains those settings."}</Prose>

<RemoteCodeBlock filename="iris_descriptive_comparison.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_descriptive_comparison.py" />

<Prose>{"Recorded example output."}</Prose>

<RemoteCodeBlock filename="iris_descriptive_comparison.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_descriptive_comparison.py.stdout.txt" />

<Prose>{"Each of the eight output lines names the fitting/scoring representation and k. Compare a bar distribution or actual cells before defending a use from the table. Selecting k or a ruler using these descriptive outcomes is exploration on these specimens; a new-observation claim needs a separate protocol."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P17 — same labels, different silhouette."}</strong>{" Why can scaled4-k3 and pca2-k3 have ARI 1 between them and identical agreement to species, but different silhouettes? Does a two-PC plot establish the score's dimensions?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"List which inputs each measure reads."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The two assignments define the same together/apart relationships after ID alignment, so partition-only comparisons are identical despite renamed bins. Silhouette also reads coordinates; four standardized versus two retained-coordinate distances give different own/foreign means. A plotting view merely chooses where to draw each ID. The score's declared representation, not the display axis labels alone, establishes its dimension. Preserve that distinction when a plot and a score are shown together."}</Prose>

</details></section>

<Prose>{"The real-data comparison kept every specimen. Some clustering methods reject observations. That changes the comparison population as well as the displayed labels."}</Prose>

<H2>{"9. Unassigned observations: a cleaner score can describe fewer cases"}</H2>

<Prose>{"Use the six-point fixture once more, and mark C as rejected. The literal labels are [0,0,−1,1,1,1]. Before scoring, decide whether −1 is a normal bin or an instruction to exclude that ID."}</Prose>

<Mechanism id="D27" />

<NeuralTable caption={"9. Unassigned observations: a cleaner score can describe fewer cases"} headers={[<>{"Policy"}</>,<>{"IDs used to score"}</>,<>{"Membership meaning"}</>,<>{"Mean silhouette"}</>]} rows={[[<>{"ordinary −1 bin"}</>,<>{"A–F, six"}</>,<>{"C is a singleton third group"}</>,<>{".469841"}</>],[<>{"assigned-only"}</>,<>{"A,B,D,E,F, five"}</>,<>{"C excluded from focal and comparison rows"}</>,<>{".838314"}</>],[<>{"original all-assigned baseline"}</>,<>{"A–F, six"}</>,<>{"LLLRRR"}</>,<>{".806548"}</>]]} />

<Prose>{"Partition APIs ordinarily treat −1 like any other label. The ordinary-bin result includes C's singleton convention 0. It also lets C become the nearest competing group for other objects: B's own mean 1 equals distance 1 to C, giving B's s=0. Removing C instead changes both the scored rows and every relevant comparison neighborhood. The five-row assigned-only mean describes only the accepted population; its coverage is 5/6."}</Prose>

<Prose>{"When several observations are rejected, encoding each with a separate singleton label is a third, different policy. For example, with both C and F rejected, ordinary labels "}<code>{"[0,0,−1,1,1,−1]"}</code>{" place C/F together, whereas "}<code>{"[0,0,R_C,1,1,R_F]"}</code>{" keeps two distinct rejected singleton bins. These are label encodings, with the original coordinates fixed; neither is the assigned-only mask A/B/D/E. Those rejected points can still influence foreign means, and their own scores follow singleton conventions. It is not a generic rejection utility. If a filtered set has one group, all singleton groups or too few objects, its silhouette is undefined. Report that reason and retain coverage; do not convert it to a zero-quality result. A policy switch follows these taught interpretations, with the retained-ID set and label count displayed before the score."}</Prose>

<Mechanism id="D28" />

<Prose>{"For a constructed comparison, method A assigns IDs 1–100 and has conditional silhouette .45. Method B assigns IDs 1–60 and has .70. A common-ID comparison can score both on 1–60, but that is another population; it does not make the forty unassigned IDs disappear from the task. Their rejection cost or coverage requirement must enter the decision separately."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P5 — a higher conditional score."}</strong>{" A assigns 100 rows with mean .45; B assigns 60 with mean .70. Which result should be selected?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Name both populations, coverage and the task's rejection cost."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The supplied numbers do not establish a scalar winner. Report 100% versus 60% coverage and their conditional scores. If the IDs overlap as in the drawing, compare both assignments on their common 60 as a separately named diagnostic while retaining the forty rejected observations in the report. Fix a minimum acceptable coverage or rejection penalty before selecting. A system that rejects every difficult case can have excellent accepted-case neighborhoods while failing the intended service."}</Prose>

</details></section>

<Prose>{"The next "}<a href={"/learn/path/full-curriculum/dbscan-density-based-clustering?module=classical-ml"}>{"DBSCAN lesson"}</a>{" develops why density connectivity can yield nonconvex groups and a noise marker. Carry this ID/policy contract forward. Even without rejection, repeated fits require a common observation domain before their assignments can be compared."}</Prose>

<H2>{"10. Stability: would this grouping survive the change we care about?"}</H2>

<Prose>{"Name the change first. Repeating optimizer initializations tests one kind of algorithmic sensitivity. Resampling fitting observations changes their empirical influence. Measurement noise, a changed feature representation or a new cohort answers yet another question. They do not estimate the same uncertainty merely because each produces several partitions."}</Prose>

<Prose>{"Inspect resampling influence without optimizer randomness on six fixed development probes 0,1,4,5,8,9. Treat bootstrap multiplicities as positive fitting weights. The weighted mean of a group is Σw_i x_i/Σw_i: a repeated observation pulls the center without becoming a new distinct probe."}</Prose>

<Mechanism id="D29" />

<NeuralTable caption={"10. Stability: would this grouping survive the change we care about?"} headers={[<>{"Run"}</>,<>{"Counts for A–F"}</>,<>{"Optimal group centers"}</>,<>{"Midpoint"}</>,<>{"Labels on fixed A–F probes"}</>]} rows={[[<>{"left emphasis"}</>,<>{"3,3,1,1,1,1"}</>,<>{".5,6.5"}</>,<>{"3.5"}</>,<>{"001111"}</>],[<>{"right emphasis"}</>,<>{"1,1,1,1,3,3"}</>,<>{"2.5,8.5"}</>,<>{"5.5"}</>,<>{"000011"}</>]]} />

<Prose>{"For the left run, A/B have weighted mean (3×0+3×1)/6=.5; C/D/E/F have mean (4+5+8+9)/4=6.5. Nearest-center assignment on the "}<strong>{"same six probes"}</strong>{" produces the shown labels. The right run mirrors the influence at the other end. Compare those aligned assignments with ARI; the recorded result is−1/14≈−.071429. A center changed because training counts changed, then a common probe received a changed label. This is not a comparison between unrelated bootstrap positions."}</Prose>

<Mechanism id="D30" />

<CodeBlock language={"text"}>{"training run1 positions: A,A,A,B,B,B,C,D,E,F  → fitted centers1\ntraining run2 positions: A,B,C,D,E,E,E,F,F,F  → fitted centers2\ncommon probes:          A,B,C,D,E,F          → aligned assignments1/2"}</CodeBlock>

<Prose>{"An alternative compares unique original IDs present in both resamples, with an explicit duplicate-resolution and population policy. A hierarchy has no automatic nearest-center "}<code>{"predict"}</code>{"; compare common IDs under a defined induced clustering or teach a justified extension before producing a stability score. The probe set here is development data, not the untouched final report. "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#9-choose-a-resolution-and-evaluate-the-result"}>{"K-Means resolution and evaluation"}</a>{" connects these perturbation and common-domain decisions."}</Prose>

<Prose>{"Can repeated training copies change a fit on the same probe IDs? Keep locations, k2 and all counts except run1's A fixed."}</Prose>

<Investigation id="L5a" />

<Prose>{"Change A's count1–5, initially3, or Reset3. Other eleven counts are read-only. The live sentence gives A's multiplicity, run1 centers and common-probe ARI. Centers may change while assignments stay fixed; inspect that null effect before expecting every changed count to cross a boundary."}</Prose>

<Prose>{"Can a trivial grouping be perfectly stable? Use the original two emphasis runs and change only the requested resolution."}</Prose>

<Investigation id="L5b" />

<Prose>{"At k1 both fits give the same trivial assignment and ARI1. The live sentence states k and common-probe ARI, with the single-group reason. Return to2 to compare the original boundaries. Stability alone cannot select useful resolution; a uniquely optimal but too-coarse solution may also be stable."}</Prose>

<Prose>{"What if C's measured location changes while IDs/counts stay fixed? B1 and D5 remain its neighboring locations on the ruler."}</Prose>

<Investigation id="L5c" />

<Prose>{"Change C's finite location1<x_C<5 or Reset4. The general six-location vocabulary is strictly increasing within [−40,40]; invalid/nonfinite/duplicate proposals identify C's field and preserve the valid fit. The live sentence reports C, two fixed-ID label sequences and ARI. Move C toward each neighbor and inspect when its assignment changes."}</Prose>

<Prose>{"What survives common scaling? Keep the original probes/counts/k2 and triple every location together."}</Prose>

<Investigation id="L5d" />

<Prose>{"Coordinates are read-only, and every proposed value must remain strictly increasing within [−40,40]. First tripling gives0/3/12/15/24/27; centers scale by3, costs by9 and membership/ARI stay fixed. A subsequent tripling is disabled because81 exits the range. The live sentence gives scale, center/cost factors and invariant ARI. Reset restores the original ruler. Original uniform/emphasis arrays, all twelve count operands and broader geometry cases remain drawings, full code and independent practice."}</Prose>

<H3>{"Program 5: a small exact one-dimensional reference"}</H3>

<Prose>{"In one-dimensional squared Euclidean clustering an optimum can be represented by contiguous sorted groups. For fixed ordered centers, nearest-center decision boundaries are midpoints, so assignments can be intervals; positive weights change means but do not make a crossing assignment optimal. Each nonempty group's weighted mean minimizes its within-group SSE. Therefore enumerate all k−1 cut positions among n−1 gaps, compute those means and costs, and choose the smallest candidate. This is a global small-domain reference, not a globally exact multidimensional KMeans replacement."}</Prose>

<Prose>{"The complete original "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/weighted_probe_stability.py"}>{"weighted_probe_stability.py"}</a>{" implements that enumeration. "}<code>{"np.split"}</code>{" creates the blocks; "}<code>{"np.average(..., weights=...)"}</code>{" computes each mean; weighted squared residuals give the candidate cost. A "}<code>{"(cost,ordered_centers)"}</code>{" tuple orders equal-cost candidates lexicographically. The probe "}<code>{"argmin"}</code>{" assigns each coordinate to its nearest ordered center, with the earlier center chosen on a literal tie. Save and run "}<code>{"python weighted_probe_stability.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="weighted_probe_stability.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/weighted_probe_stability.py" />

<Prose>{"Recorded example output."}</Prose>

<RemoteCodeBlock filename="weighted_probe_stability.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/weighted_probe_stability.py.stdout.txt" />

<Prose>{"Its two recorded center/label lines and negative ARI show the whole mechanism. In this reference there are choose(n−1,k−1) cuts; naive computation costs about O(n×choose(n−1,k−1)). Prefix sums of w,wx,wx² give an interval cost "}<code>{"Σwx²−(Σwx)²/Σw"}</code>{"; dynamic programming over endpoints can use those costs for larger one-dimensional problems. The finite reference remains easiest to inspect on six probes."}</Prose>

<Prose>{"The interactive successor uses the same declared finite-candidate order: computed costs ascending, then ordered centers only for literal cost ties; nearest-center literal ties go left. Near-equal costs may be labeled as such using a tolerance, but that diagnostic must not reorder costs or turn unequal distances into exact ties. This separates a numerical proximity report from the mathematical decision rule."}</Prose>

<Prose>{"For an ordinary iterative route, KMeans accepts sample weights and assigns shared probes through "}<code>{"predict"}</code>{". The complete small calling example is:"}</Prose>

<CodeBlock language={"python"}>{"import numpy as np\nfrom sklearn.cluster import KMeans\n\nprobes = np.array([0, 1, 4, 5, 8, 9.0])[:, None]\ncounts = np.array([3, 3, 1, 1, 1, 1])\nmodel = KMeans(n_clusters=2, n_init=20, random_state=17)\nmodel.fit(probes, sample_weight=counts)\nassigned_probe_labels = model.predict(probes)\nprint(model.cluster_centers_.ravel().tolist())\nprint(assigned_probe_labels.tolist())"}</CodeBlock>

<Prose>{"This ordinary call represents fitting multiplicities and a common prediction domain; it is not promised to find the exact enumerated optimum or reproduce the original program byte-for-byte. Its calling example has no freshly recorded result here. Do not mistake a larger n_init for independently sampled observations."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P6 — bootstrap positions."}</strong>{" Two bootstrap arrays each contain 100 rows. May you compute ARI between their labels by position?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Which original ID occupies position 17 in each sample?"}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Equal lengths do not establish common objects. Sample position 17 can refer to different IDs, and duplicates make positions even less meaningful. Fit each run and assign a fixed development probe set using a stated prediction rule, or compare unique common original IDs with declared duplicate resolution. Keep support/population counts for the common-ID route. A resulting agreement then refers to the named perturbation and population, not every source of uncertainty."}</Prose>

</details></section>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P7 — change the probe geometry."}</strong>{" With locations 0,1,2,8,9,10, equal weights and k2, find the best contiguous cut, then multiply all locations by 3."}</Prose>

<details><summary>Hint</summary>

<Prose>{"There are five possible gaps; compute each side's mean and residual sum."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The middle 3/3 cut gives means 1 and 9 with cost (1+0+1)+(1+0+1)=4. The two 1/5 cuts each give cost 70; the two 2/4 cuts give 39.25. Thus the middle cut wins. After scaling, centers become 3 and 27 and squared residual cost is 9×4=36. Membership relations and ARI are unchanged, and common positive distance scaling leaves silhouette unchanged. This changed input checks the operation rather than memorizing the original .5/6.5 centers."}</Prose>

</details></section>

<H3>{"Support is part of a stability fraction"}</H3>

<Prose>{"If not every run contains every ID, some pairs were not observed. For pair A/B, inspect four runs explicitly."}</Prose>

<Mechanism id="D31" />

<NeuralTable caption={"Support is part of a stability fraction"} headers={[<>{"Run"}</>,<>{"A observed?"}</>,<>{"B observed?"}</>,<>{"Together decision"}</>]} rows={[[<>{"1"}</>,<>{"yes"}</>,<>{"yes"}</>,<>{"yes"}</>],[<>{"2"}</>,<>{"yes"}</>,<>{"yes"}</>,<>{"no"}</>],[<>{"3"}</>,<>{"yes"}</>,<>{"no"}</>,<>{"unavailable"}</>],[<>{"4"}</>,<>{"yes"}</>,<>{"yes"}</>,<>{"yes"}</>]]} />

<Prose>{"The numerator is 2 and joint-observation support is 3, giving 2/3. Absence is not an apart decision. A coassignment matrix stores both those counts for every pair; unsupported entries remain unavailable rather than 0. Its diagonal is 1 when an ID appeared, with support equal to its number of observed runs. Any mean over supported pairs needs a declared weighting/target; this fraction has no universal confidence guarantee."}</Prose>

<Prose>{"The complete "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/coassignment_support.py"}>{"coassignment_support.py"}</a>{" accepts runs as unique-ID maps. "}<code>{"unique_run"}</code>{" rejects duplicate assignment records before construction; a bootstrap training multiplicity must be resolved into one comparable assignment per original/probe ID, not silently overwritten in a dictionary. "}<code>{"combinations(run,2)"}</code>{" visits only jointly observed pairs; updates are symmetric. At the end divide numerator by support only where support>0. Run "}<code>{"python coassignment_support.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="coassignment_support.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/coassignment_support.py" />

<Prose>{"Actual new instructional output in Python 3.12.14 / NumPy 2.3.5 / SciPy 1.18.1 / scikit-learn 1.9.1."}</Prose>

<RemoteCodeBlock filename="coassignment_support.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/coassignment_support.py.stdout.txt" />

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P13 — missing B."}</strong>{" Runs say together/apart/A-only/together. What should the A/B entry contain?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count runs that can answer the pair question."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Two of three jointly observed runs say together, so store numerator 2, support 3 and fraction 2/3. Treating the A-only run as apart would use denominator 4 and incorrectly give 1/2. Keep support when comparing entries: two pairs with the same fraction but support 3 versus 30 are not supported by the same observations."}</Prose>

</details></section>

<Prose>{""}<strong>{"First-pass return:"}</strong>{" continue directly to "}<a href={"#12-a-report-you-can-defend-then-try-on-your-own"}>{"section 12"}</a>{" to write the task decision and frozen report. The following deeper section asks additional reference, hierarchy and computation questions. Return to it when you need those tools; it does not turn stability into an automatic true-k selector."}</Prose>

<H2>{"11. Deeper branch: tendency, relative selection and computation"}</H2>

<Prose>{"This return route addresses three different needs: deciding what a coordinate reference means, evaluating a whole hierarchy's distance fidelity, and choosing a computational target that fits available memory. Each changes a different object from the pair/information nulls already taught."}</Prose>

<H3>{"A method can partition a cloud without meaningful group tendency"}</H3>

<Prose>{"A compactness optimizer will divide even a smooth coordinate cloud. Randomizing memberships of its fixed optimized coordinates asks a different question from whether that cloud contains more clustering tendency than a plausible reference cloud."}</Prose>

<Mechanism id="D32" />

<CodeBlock language={"text"}>{"partition-agreement null:  fixed IDs/coordinates + shuffled memberships with fixed margins\ncoordinate-reference null: newly generated coordinates under stated support + same fitting rule"}</CodeBlock>

<Prose>{"The first supports the fixed-margin agreement adjustment. The second can compare optimized compactness against a declared geometric reference. Neither automatically represents the domain's actual data-generating process. Tendency tools such as Hopkins also make sampling/distance/support choices; a complete calibration study belongs to its own treatment. Here we develop the gap reference explicitly rather than attaching an unexplained tendency scalar."}</Prose>

<H3>{"Build a coordinate reference before comparing costs"}</H3>

<Prose>{"Where would points lie if the declared reference had no preferred clusters? First draw the support and the path back to the measured coordinates."}</Prose>

<Mechanism id="D33" />

<Prose>{"The original-axis rectangle spans each observed feature's minimum and maximum. Each new coordinate is uniform and independent within its interval. The other lane first subtracts the observed mean, rotates the cloud into a complete orthogonal principal frame, and finds a rectangle there. A sampled row follows the inverse rotation and receives the mean again. The two rectangles generally describe different reference supports. This choice is conditional on the observed cloud; neither rectangle is automatically its domain's data-generating process."}</Prose>

<Prose>{"Let the centered n-row, d-feature table be X_c and the complete d×d right factor be A. Rows of A are the orthogonal axes; the drawn forward coordinates are Z=X_c Aᵀ and the inverse is X_c=ZA. Every direction remains present. This is a rotation, with no truncation or whitening. An exactly zero-width interval stays constant; a tiny floating-point extent is not silently rounded away. Original-axis boxes generally change when the data rotate. Uniquely determined principal directions follow the cloud up to sign; repeated singular values allow multiple bases, so that reference needs a declared basis when direction choice is ambiguous. This differs from the earlier prediction-oriented PCA preprocessing."}</Prose>

<Prose>{"Why not request every SVD factor in its full size? The drawing's tall table needs d right axes but has no use for n left axes. For n≥d, reduced SVD returns U with shape n×d and A with shape d×d. For n<d, full SVD returns U with shape n×n and the required A with shape d×d; reduced SVD would omit d−n right axes. Therefore choose "}<code>{"full_matrices=(n < d)"}</code>{" from "}<strong>{"shape"}</strong>{", never numerical rank. Square, rank-deficient and wide tables retain every right direction, including null directions. This is the same shape decision in KMeans's corrected "}<code>{"clustering_diagnostics.py"}</code>{"; our local callback keeps its own n_init=20/seed17 rather than adopting that program's different fitter settings."}</Prose>

<Prose>{"Returned factor storage is O(nd+d²), excluding solver workspace and fitter buffers. The familiar O(nd min(n,d)) estimate describes dense economy-factor or singular-value work; it does not bound this complete-factor call for every shape. For wide n<d tables, completing and materializing the full d×d right basis adds work: writing its d² entries alone requires Ω(d²), even with n fixed at2. Numerical rank deficiency does not remove those requested axes. No universal exact solver-work or workspace bound is asserted here. Each full-basis projection or inverse map still costs O(nd²). At n=100,000 and d=4, a discarded full float64 U alone would contain 100,000² entries ×8 bytes =80 GB (decimal). That is shape arithmetic, not an allocation or benchmark. The "}<a href={"https://numpy.org/doc/stable/reference/generated/numpy.linalg.svd.html"}>{"official NumPy SVD reference"}</a>{" supplies the full/reduced shapes; its inspected online banner is 2.5 and the local small-factor probes use 2.3.5. No constant-memory or solver-workspace bound follows."}</Prose>

<H3>{"Reduce positive dispersion from the fitted groups"}</H3>

<Prose>{"How can the reference and observed fits be compared in the same units? Look at the pair edges and the residuals they summarize."}</Prose>

<Mechanism id="D40" />

<Prose>{"The three unordered squared edges sum to 6. Dividing by the group size 3 gives 2, exactly the squared residual sum 1+0+1 to mean 1. Counting ordered edges includes both directions and gives 12, so divide by 2×3 instead. These are squared costs; silhouette's ordinary mean-distance fans remain a different operation."}</Prose>

<Prose>{"For group g with n_g rows, let D_g sum "}<strong>{"ordered"}</strong>{" squared member distances. With group mean μ_g, expanding the differences cancels the centered cross term:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"D_g=\\sum_{i,j\\in g}\\|x_i-x_j\\|^2\n=2n_g\\sum_{i\\in g}\\|x_i-\\mu_g\\|^2,\\qquad\nW_k=\\sum_g\\frac{D_g}{2n_g}."}</MathBlock></div>

<Prose>{"W_k is the total SSE from the declared fit at k. Fit every reference dataset with those same candidate settings to obtain W*_{kb}, where b names its replicate. Only positive finite costs enter the log comparison. W=0 has no finite logarithm; a collapsed reference must be diagnosed rather than patched with an unexplained tiny constant. The later "}<code>{"within_sse"}</code>{" helper implements the residual lane directly."}</Prose>

<H3>{"Compare the observed cost with typical reference log costs"}</H3>

<Prose>{"Does the observed fit cost less than the declared reference usually does? Draw both streams before reducing them."}</Prose>

<Mechanism id="D34" />

<Prose>{"One observed cost becomes log W_k. The B reference costs each become log W*_{kb}; only then are they averaged. Subtract the observed log from that reference mean. Natural logs turn a common positive cost multiplier into an additive shift on both sides, which cancels. Averaging logs is not taking the log of the arithmetic mean cost."}</Prose>

<Prose>{"For an explicitly constructed arithmetic illustration, observed logW=0 and two reference logs .5/1.5 give reference mean 1 and Gap 1. These log inputs are not fitted Iris measurements. In symbols,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"\\bar\\ell_k=\\frac1B\\sum_{b=1}^B\\log W^*_{kb},\\qquad\nGap(k)=\\bar\\ell_k-\\log W_k."}</MathBlock></div>

<Prose>{"Larger excess means the observed optimized cost is smaller than the reference's typical log cost. It is conditional on the support, fitting procedure and replicate design; it is not a universal true number of groups."}</Prose>

<H3>{"Show replicate spread before using it in a decision"}</H3>

<Prose>{"How variable is that reference comparison? Put the same two reference log marks around their mean."}</Prose>

<Mechanism id="D41" />

<Prose>{"The deviations from 1 are −.5 and +.5. Square them, average the two .25 contributions with divisor B=2, and take the square root to get .5. The original paper multiplies this log-cost spread by sqrt(1+1/B), yielding s=.5sqrt(1.5)=.612372436. These invented operands illustrate the reduction, not an observed confidence interval."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"s_k=\\sqrt{1+1/B}\\sqrt{\\frac1B\\sum_{b=1}^B\n(\\log W^*_{kb}-\\bar\\ell_k)^2}."}</MathBlock></div>

<Prose>{"Keep the divisor explicit. The R route below uses sample SD with divisor B−1, which changes the finite spread; the multiplier alone does not remove that difference."}</Prose>

<H3>{"Read the earliest neighboring comparison"}</H3>

<Prose>{"Which resolution is already competitive with the next one? Draw the next candidate's lower edge beside the current Gap."}</Prose>

<Mechanism id="D42" />

<Prose>{"At k1 the next lower edge is .42−.08=.34, above the current .10, so continue. At k2 the next edge is .46−.06=.40, below the current .42, so stop at 2. The next candidate's spread enters, not the current one's. The rule asks for the "}<strong>{"smallest"}</strong>{" k satisfying"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression; scroll locally when needed"><MathBlock>{"Gap(k)\\ge Gap(k+1)-s_{k+1}."}</MathBlock></div>

<NeuralTable caption={"Read the earliest neighboring comparison"} headers={[<>{"k"}</>,<>{"Illustrative Gap"}</>,<>{"s"}</>,<>{"Next-k lower edge"}</>,<>{"Earliest-rule decision"}</>]} rows={[[<>{"1"}</>,<>{".10"}</>,<>{".03"}</>,<>{".42−.08=.34"}</>,<>{"fail"}</>],[<>{"2"}</>,<>{".42"}</>,<>{".08"}</>,<>{".46−.06=.40"}</>,<>{"pass: choose 2"}</>],[<>{"3"}</>,<>{".46"}</>,<>{".06"}</>,<>{".44−.07=.37"}</>,<>{"not needed after earliest pass"}</>],[<>{"4"}</>,<>{".44"}</>,<>{".07"}</>,<>{"next k unavailable"}</>,<>{"no new terminal comparison"}</>]]} />

<Prose>{"This table is a constructed teaching example. The maximum displayed Gap is at 3, while the declared rule chooses 2. If no candidate with a next neighbor passes, the original next-k decision is unresolved at the upper boundary. Supply the next candidate or declare a different boundary policy; an implicit fallback changes the procedure."}</Prose>

<Prose>{"The complete "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/gap_reference.py"}>{"gap_reference.py"}</a>{" follows those drawings. "}<code>{"reference_box"}</code>{" chooses full/reduced factors from shape while retaining the complete right basis, records all bounds and returns the inverse frame. "}<code>{"within_sse"}</code>{" reduces actual residuals to group means and rejects nonpositive W. The ordinary callback fits KMeans with n_init=20/seed17; the null stream uses seed23/B8. "}<code>{"gap_curve"}</code>{" refits each candidate on the observed table and on each reference, stores K observed logs and B×K reference logs, then applies the paper spread and separate next-k rule. Its twelve constructed two-coordinate rows are an instructional fixture, not Iris or a measured benchmark. Run "}<code>{"python gap_reference.py"}</code>{" to create your own execution."}</Prose>

<Prose>{"One B-loop iteration creates one n×d reference array, shared across all k in that iteration. The program also keeps the first reference for inspection; it does not retain B full arrays. Array storage outside solver/fitter workspace includes O(nd+d²+BK+K), with a constant number of n×d arrays. Each k still requires B+1 fits; silhouette chunking does not remove those fits or full-basis projection work. No speed benchmark is asserted."}</Prose>

<RemoteCodeBlock filename="gap_reference.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/gap_reference.py" />

<Prose>{"Recorded output of the preserved predecessor full-SVD source; this shape-aware source was not run end to end."}</Prose>

<RemoteCodeBlock filename="gap_reference.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/gap_reference.py.stdout.txt" />

<Prose>{"That recorded predecessor toy execution chooses "}<strong>{"k=1"}</strong>{": Gap 1≈−.710672486 already exceeds Gap 2−s2≈−1.143203142. The highest displayed toy Gap is at 3, but the earliest rule stops at 1. Retain that result rather than tuning the reference or table to obtain a desired answer. This small-B outcome demonstrates how the null, replicate variability and rule jointly determine the result; it does not establish reliable recovery of the visually apparent toy neighborhoods. The separate illustrative table still chooses 2 under its own stated inputs."}</Prose>

<H3>{"Ordinary R route: name the finite implementation"}</H3>

<Prose>{"R's maintained "}<code>{"cluster::clusGap"}</code>{" supports original or scaledPCA spaces, but its defaults are not this exact paper convention. Set "}<code>{"d.power=2"}</code>{", "}<code>{"spaceH0='scaledPCA'"}</code>{" (or explicitly "}<code>{"'original'"}</code>{") and use "}<code>{"maxSE(..., method='Tibs2001SEmax')"}</code>{" when that rule is intended. Its default rule is "}<code>{"firstSEmax"}</code>{"; its default distance power is 1. The inspected implementation uses sample SD with divisor B−1 and returns terminal K under Tibs2001SEmax when no earlier inequality holds. The displayed scratch uses divisor B and an unresolved boundary instead."}</Prose>

<Prose>{"Under d.power 2, the inspected R condensed-pair normalization gives "}<strong>{"half ordinary SSE"}</strong>{": unordered square sum 6 for 0,1,2 becomes 6/(2×3)=1 rather than SSE 2. Multiplying every observed/reference cost by the same positive constant shifts both log costs equally and cancels from Gap. It does not eliminate the SD-divisor or terminal-rule difference, nor different random streams/fits. The following complete "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/gap_reference_R.R"}>{"R example"}</a>{" is a source/API route; no R execution or exact Python parity is claimed."}</Prose>

<RemoteCodeBlock filename="gap_reference_R.R" language="r" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/gap_reference_R.R" />

<Prose>{"This complete R calling example is source-only here; no R output is asserted."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P15 — earliest versus largest."}</strong>{" For the illustrative Gap .10,.42,.46,.44 and s .03,.08,.06,.07, choose k. What if only k1/2 are available and k1 fails?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the next candidate's lower edge, not the current candidate's uncertainty."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"At 1, .10<.42−.08=.34, so continue. At 2, .42≥.46−.06=.40, so choose 2 even though 3 has the maximum Gap. With only 1/2 and a failed 1 comparison, candidate 2 lacks its next neighbor; the original rule does not determine a result. Record an unresolved upper boundary or explicitly adopt a different rule. It is not honest to silently report argmax or a terminal fallback as that same procedure."}</Prose>

</details></section>

<Prose>{"Likelihood criteria such as GMM BIC, graph modularity/normalized cut and density-validity criteria require their own probability, graph or connectivity objects. Their full derivations belong to those lessons. The local bridge is the same: declare the object and reference meaning before adopting a selection criterion."}</Prose>

<H3>{"A hierarchy's distances before a useful cut"}</H3>

<Prose>{"Recall "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#6-build-a-hierarchy-one-merge-at-a-time"}>{"K-Means/hierarchy: build one merge at a time"}</a>{" and "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#7-calculate-ward-cost-and-read-the-height-correctly"}>{"Ward cost and height conventions"}</a>{". A merge height means what the chosen linkage says; it is not automatically every original pair's distance."}</Prose>

<Prose>{"Take A0,B1,C3. Original condensed pair distances in AB/AC/BC order are [1,3,2]. Single linkage first joins A/B at 1, then C to that branch at 2. A pair's "}<strong>{"cophenetic distance"}</strong>{" is its first common join height."}</Prose>

<Mechanism id="D35" />

<NeuralTable caption={"A hierarchy's distances before a useful cut"} headers={[<>{"Pair"}</>,<>{"Original distance"}</>,<>{"First common join"}</>]} rows={[[<>{"AB"}</>,<>{"1"}</>,<>{"1"}</>],[<>{"AC"}</>,<>{"3"}</>,<>{"2"}</>],[<>{"BC"}</>,<>{"2"}</>,<>{"2"}</>]]} />

<Prose>{"The joined vector is [1,2,2]. The tree compresses the original AC/BC difference into the same height. Pearson correlation compares the pattern after mean centering: original mean 2 gives [−1,1,0]; joined mean 5/3 gives [−2/3,1/3,1/3]. Their crosssum is 1, norms sqrt(2) and sqrt(2/3), so correlation is sqrt(3)/2≈.866025. It evaluates whole-tree distance fidelity, not reference recovery or the usefulness of a chosen k. A constant vector has zero norm and an undefined correlation. These overlapping pair quantities are not independent observations for an automatic correlation inference."}</Prose>

<Prose>{""}<code>{"cophenetic_fidelity.py"}</code>{" consumes a valid sequence of joins. Active sets hold the descendant IDs of each unmerged node. A merge assigns its height to every newly cross-joined pair, removes both consumed nodes, and creates their combined set. It validates node/count/height structure. The scratch Pearson routine states its zero-norm policy. Ordinary "}<code>{"pdist"}</code>{", "}<code>{"linkage(..., method='single')"}</code>{" and "}<code>{"cophenet(z,original)"}</code>{" use the same condensed order and compare the resulting vector/correlation. Run "}<code>{"python cophenetic_fidelity.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="cophenetic_fidelity.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/cophenetic_fidelity.py" />

<Prose>{"Actual new instructional output in Python 3.12.14 / NumPy 2.3.5 / SciPy 1.18.1 / scikit-learn 1.9.1."}</Prose>

<RemoteCodeBlock filename="cophenetic_fidelity.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/cophenetic_fidelity.py.stdout.txt" />

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P16 — a fidelity correlation."}</strong>{" Original distances [1,3,2] and joined [1,2,2] are aligned. Derive the correlation; what changes if either vector is constant?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Center each vector by its own mean before multiplying."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Means are 2 and 5/3; centered vectors are [−1,1,0] and [−2/3,1/3,1/3]. The crosssum is 2/3+1/3=1. Squared norms are 2 and 2/3, yielding 1/sqrt(4/3)=sqrt(3)/2. Dividing covariance and variances by a common sample factor would cancel, so no extra n−1 factor belongs in the final ratio. A constant vector has norm 0 and no Pearson correlation. High fidelity still does not establish a useful cut or task label agreement."}</Prose>

</details></section>

<H3>{"Memory can change without changing exact silhouette"}</H3>

<Prose>{"Open the distance table rather than treating an exact score call as a black box. Each focal row must compare against every row in every group, excluding itself from its own denominator."}</Prose>

<Mechanism id="D37" />

<Prose>{"For n rows and d coordinates, direct Euclidean work is O(n²d). A full float64 n×n distance matrix alone uses 8n² bytes. At n=100,000 that is 80,000,000,000 bytes, or 80 GB decimal/about 74.5 GiB. Exact silhouette need not store all of it. Compute q focal rows against all n comparators, reduce each row into k group sums, then release the distance block and advance."}</Prose>

<Prose>{"The "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_chunked.py"}>{"silhouette_chunked.py"}</a>{" routine uses "}<code>{"cdist(x[current],x)"}</code>{" to materialize q×n distances, rather than the q×n×d broadcast differences from Program 1. "}<code>{"group_sums"}</code>{" reduces each group's columns; the selected own group's divisor is its size−1, foreign groups keep their full sizes. Self-distance is explicitly removed. The singleton and both-zero conventions are unchanged. Extra working distances/reductions are O(qn+qk), plus input/label storage; total full-score distance work is still O(n²d). This memory claim is not a measured timing improvement. Run "}<code>{"python silhouette_chunked.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="silhouette_chunked.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_chunked.py" />

<Prose>{"Actual new instructional output in Python 3.12.14 / NumPy 2.3.5 / SciPy 1.18.1 / scikit-learn 1.9.1."}</Prose>

<RemoteCodeBlock filename="silhouette_chunked.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_chunked.py.stdout.txt" />

<Prose>{"All six scores and mean .806548 agree with ordinary "}<code>{"silhouette_samples"}</code>{" on the same fixed partition. A centroid-only approximation would reduce comparisons but change the definition: distance to a mean is generally not mean distance to members. Name it as a proxy and evaluate its purpose rather than labeling it exact silhouette."}</Prose>

<H3>{"Sampling can change the target as well as the cost"}</H3>

<Prose>{"Select B,C,D,E as a subset of our six points. C now has only B in its own group and D/E as its competitors."}</Prose>

<Mechanism id="D38" />

<Prose>{"Full C has a1.5/b6/s.75. Inside the subset, a=|2−1|=1 and b=(|2−7|+|2−8|)/2=5.5, giving s=4.5/5.5=9/11. This is "}<strong>{"subset silhouette"}</strong>{", the kind of quantity returned by "}<code>{"silhouette_score(sample_size=m)"}</code>{": both focal and comparison rows change. Rare groups can vanish or become singletons; verify the sampled group-count domain anew. There is no general unbiased-full-mean claim."}</Prose>

<Prose>{"Instead select focal C and E but keep every comparison row and membership."}</Prose>

<Mechanism id="D39" />

<Prose>{"C retains its exact full score .75. Under simple random sampling without replacement of m focal IDs, the mean of their fixed full scores is unbiased for the finite full observation mean. It requires O(mnd) work and holds the partition/comparison universe fixed. For m>1, the standard error estimate is sqrt((1−m/n)s_sample²/m), where s_sample² uses m−1. One focal ID cannot estimate that variance; all n focal IDs remove sampling error. This quantifies only that conditional focal sampling, not future-cohort or refitting uncertainty."}</Prose>

<Prose>{"A stratified sample can keep small groups represented. Weight each sampled group mean by its "}<strong>{"original"}</strong>{" population proportion if the target remains the observation mean. Equal group weights instead target the different group-average summary in "}<a href={"#3-silhouette-inspect-one-point-s-neighborhood-before-averaging"}>{"section 3"}</a>{". The complete "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_focal_sample.py"}>{"silhouette_focal_sample.py"}</a>{" imports the visible chunk helper, chooses reproducible focal IDs, prints exact full-comparator scores and their SRS estimate, then separately prints an ordinary random "}<strong>{"subset"}</strong>{" score with a validity check. Download both files together and run "}<code>{"python silhouette_focal_sample.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="silhouette_focal_sample.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_focal_sample.py" />

<Prose>{"Actual new instructional output in Python 3.12.14 / NumPy 2.3.5 / SciPy 1.18.1 / scikit-learn 1.9.1."}</Prose>

<RemoteCodeBlock filename="silhouette_focal_sample.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_focal_sample.py.stdout.txt" />

<Prose>{"The actual focal sample IDs [2,0,3] give scores [.75,.8125,.75], mean .7708333333 and estimated conditional SE .0147313913. The separate subset result uses different sampled IDs and a different target. The explicit C contrast .75 versus .8181818182 demonstrates the change without relying on those random sample means."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P14 — preserve the comparator universe."}</strong>{" C is 2 in full L0/1/2 and R 7/8/9. What changes under subset 1/2/7/8, and what happens if only focal C is selected but comparisons remain full?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count the own and foreign members separately in each operation."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Full a=(2+1)/2=1.5,b=(5+6+7)/3=6,s=.75. Subset a=1,b=(5+6)/2=5.5,s=9/11. A focal-only selection keeps the full denominators and returns .75. Thus a subset score is a statistic of the restricted partition, while a focal sample estimates the mean of the original fixed point scores. Neither operation is a new cluster fit."}</Prose>

</details></section>

<Prose>{"ARI/unadjusted MI also gain efficiency through sparse cell/margin reductions rather than all-pair lists. A dense r×c table can cost O(rc); sorting-based label encoding can add O(n log n). Expected MI additionally sums feasible overlaps, so AMI does not share a universal linear-time bound. Choose an implementation and sampling target deliberately before making a performance claim."}</Prose>

<Prose>{""}<strong>{"Return to the report:"}</strong>{" "}<a href={"#12-a-report-you-can-defend-then-try-on-your-own"}>{"section 12"}</a>{" ties these tools to a declared use and to which data may choose the answer."}</Prose>

<H2>{"12. A report you can defend, then try on your own"}</H2>

<Prose>{"Return to the opening use. A useful descriptive report could say:"}</Prose>

<Prose>{"> I used four cm measurements and KMeans with 20 initializations, seed 17, on these 150 specimens. Two groups had higher silhouette in that raw geometry; three agreed more closely with species. For describing species-related morphology, I would inspect the three-group cells and remaining category errors. For a two-representative compression constraint, I would retain two groups and evaluate their distortion. These are descriptive choices on this dataset."}</Prose>

<Prose>{"That statement names what the evidence supports. A use involving new specimens needs a protocol that separates fitting, selection and final reporting. Review "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#14-complete-a-reproducible-clustering-report"}>{"K-Means' reproducible clustering report"}</a>{" for how preprocessing and learned assignments travel together."}</Prose>

<H3>{"Three disjoint ID roles and one frozen decision"}</H3>

<Prose>{"Before fitting, a seed 23 permutation gives 90 fit IDs, 30 selection IDs and 30 final report IDs. Their roles matter more than whether another paper calls a set “validation” or “test.” The fit rows learn the scaler and candidate centers; the selection rows choose between the declared candidates; the report rows only evaluate the frozen choice."}</Prose>

<Mechanism id="D36" />

<NeuralTable caption={"Three disjoint ID roles and one frozen decision"} headers={[<>{"Role"}</>,<>{"First actual ID/row"}</>,<>{"What it may change"}</>]} rows={[[<>{"fit 90"}</>,<>{"ID 96: [5.7,2.9,4.2,1.3] cm"}</>,<>{"four scaler means/scales and candidate centers"}</>],[<>{"selection 30"}</>,<>{"ID 80: [5.5,2.4,3.8,1.1] cm"}</>,<>{"choose k2/3/4 by the fixed eligibility/score rule"}</>],[<>{"report 30"}</>,<>{"ID 3: [4.6,3.1,1.5,.2] cm"}</>,<>{"final outcomes only"}</>]]} />

<Prose>{"The row trace is a four-coordinate operation: "}<code>{"x_3 → (x_3−mu_fit)/sigma_fit → distances to the selected two-by-four center array → nearest squared residual"}</code>{". Species for ID 3 travels to an agreement calculation separately, bypassing scaler fitting and candidate selection. The scaler state has two four-element arrays; selected centers have shape 2×4. Those particular numerical parameter arrays were "}<strong>{"not retained numerically"}</strong>{" with the recorded report, so this trace names their components symbolically rather than assigning invented values. The actual IDs, candidate scores and outcomes below are retained; the separately taught toy template displays its own actual numerical state."}</Prose>

<Prose>{"The fixed operational rule is standardized four-feature geometry, k2/3/4, at least 10 fit specimens in every training group, and highest valid selection silhouette. A selection partition must also satisfy 2≤occupied_groups<30. If scores tie exactly, smaller k wins. The minimum size 10 is a stated task choice, not a universal statistical law. These three candidates are eligible:"}</Prose>

<NeuralTable caption={"Three disjoint ID roles and one frozen decision"} headers={[<>{"k"}</>,<>{"Fit-group sizes"}</>,<>{"Selection silhouette"}</>]} rows={[[<>{"2"}</>,<>{"65,25"}</>,<>{".556801643894"}</>],[<>{"3"}</>,<>{"30,25,35"}</>,<>{".491474781598"}</>],[<>{"4"}</>,<>{"24,24,14,28"}</>,<>{".491576075027"}</>]]} />

<Prose>{"The rule selects k2. Freeze its scaler, center arrays, candidate rule, representation and interpretation before opening the report. A held-out silhouette would compare report members to report members within their predicted groups; it is "}<strong>{"not"}</strong>{" the same as distance to training centers. Here the task outcome is mean squared distance to the selected training centers, compared against a one-center baseline fitted on the same fit rows in the same standardized geometry. Species ARI is a separate report outcome."}</Prose>

<H3>{"Program 6: preserve the fit/choose/report boundary"}</H3>

<Prose>{"Download "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_heldout_report.py"}>{"iris_heldout_report.py"}</a>{" beside "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris.csv"}>{"iris.csv"}</a>{". "}<code>{"default_rng(23).permutation"}</code>{" splits the ID positions before preprocessing. Each candidate "}<code>{"Pipeline(StandardScaler,KMeans)"}</code>{" fits only "}<code>{"x[fit_ids]"}</code>{"; prediction/transform on selection data reuses that state. "}<code>{"bincount"}</code>{" checks training sizes including any empty requested bin. The selection tuple "}<code>{"(score,-k,model)"}</code>{" chooses the score then smaller k. “No eligible candidate” stops the procedure instead of letting report information repair the rule."}</Prose>

<Prose>{"After freezing, "}<code>{"model.predict"}</code>{" assigns report rows. "}<code>{"model.transform"}</code>{" produces distances to training centers through the fitted preprocessing pipeline; its row minimum squared and averaged is the distortion. The one-center pipeline is fitted on the same 90 rows, with equivalent scaler geometry. Reference ARI compares the report species annotations with report assignments only after selection. Run "}<code>{"python iris_heldout_report.py"}</code>{" to reproduce this original fixture."}</Prose>

<RemoteCodeBlock filename="iris_heldout_report.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_heldout_report.py" />

<Prose>{"Recorded example output."}</Prose>

<RemoteCodeBlock filename="iris_heldout_report.py.stdout.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_heldout_report.py.stdout.txt" />

<Prose>{"The recorded report distortion is 1.375135 versus 4.673251 for one center, while species ARI is .628523. Distortion describes representative accuracy in the declared geometry; annotation agreement describes recovered reference relations. These are conditional results of this split/rule, not a confidence interval or a guarantee about all future specimens. All learned preprocessing belongs to the fit set. Using the report to choose scaling, PCA dimensions, k or interpretation would turn it into development data even though the fit itself is unsupervised."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P18 — a disappointing report."}</strong>{" May you inspect the report, change the ruler and report again as if it remained untouched?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Which information now chose the representation?"}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The report influenced a choice and is now development information. Either label the revised analysis exploratory on that dataset, or freeze a new plan and use genuinely fresh reserved data for a final claim. Repeatedly tuning transformations on the same report and retaining its original untouched attribution hides selection. Changing the name of the set cannot restore independence from the choice."}</Prose>

</details></section>

<H3>{"A portable report on your own IDs"}</H3>

<Prose>{"The new "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/clustering_report_template.py"}>{"clustering_report_template.py"}</a>{" applies the same boundary to an explicitly named learner CSV. It requires unique nonempty IDs, declared finite numeric feature columns, optional complete reference annotations and at least ten rows. Missing measurements need a policy before use; ID/reference columns are excluded from fitting. A seeded 60/20/20 split establishes disjoint roles. The default uses forty constructed rows with two coordinate neighborhoods, so you can inspect every state without treating a new synthetic example as measured evidence."}</Prose>

<Prose>{"For this new toy run, fit 24/selection 8/report 8 IDs are printed. Actual fitted means are [-.41622807017543856, −.3084649122807018], scales [3.9741262437615466, 4.0031275974326075]. The selected standardized centers are [1.0776545546160816, 1.0862788290734366] and [−.9118615462136077, −.9191590092159851]; the one-center baseline is approximately [0, 0], with printed floating roundoff. These belong to the forty-row toy, never to the old Iris report."}</Prose>

<Prose>{"The workflow is scratch code around ordinary tools: CSV validation, ID split, candidate eligibility, deterministic score/tie selection, frozen-state ownership, nearest-center residual reduction and report assembly are explicit. The scaler/KMeans fits use ordinary implementations already taught in the prerequisite. "}<code>{"center_distortion"}</code>{" forms row×center×coordinate differences, sums coordinate squares, takes each row's minimum and averages. The example checks that result against the ordinary "}<code>{"transform"}</code>{" route. This full small-file array needs O(nkd) temporary values; chunk the report rows if that allocation is too large. All rows are assigned, so coverage 1 is reported; a rejecting method would need the policy from "}<a href={"#9-unassigned-observations-a-cleaner-score-can-describe-fewer-cases"}>{"section 9"}</a>{"."}</Prose>

<Prose>{"Run "}<code>{"python clustering_report_template.py"}</code>{" for the default toy. Its exact source/output below includes the newly exposed fitted arrays and the scratch/ordinary residual comparison. The selected toy k2 has selection silhouette .9151137546, report distortion .0212313413 versus baseline 2.1336709814, reference ARI 1 and coverage 1. The toy construction makes its two neighborhoods easy; those values are instructional results, not evidence that the rule is optimal for arbitrary CSVs."}</Prose>

<RemoteCodeBlock filename="clustering_report_template.py" language="python" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/clustering_report_template.py" />

<Prose>{"Projected output: only the input-label line is replaced; the report dictionary is retained byte-for-byte from the recorded forty-row demonstration."}</Prose>

<RemoteCodeBlock filename="clustering_report_template.py.projected-output.txt" language="output" source="/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/clustering_report_template.py.projected-output.txt" />

<Prose>{"For a CSV with headers "}<code>{"object_id,length,width,category"}</code>{", run:"}</Prose>

<CodeBlock language={"text"}>{"python clustering_report_template.py --csv measurements.csv --id-column object_id --features length width --reference-column category --candidates 2 3 --minimum-fit-size 2"}</CodeBlock>

<Prose>{"Omit "}<code>{"--reference-column"}</code>{" if there is no appropriate annotation. Freeze the feature/rule/coverage choices before reviewing final outcomes. A no-eligible error is useful information about that rule/data, not an invitation to consult the report set. The template is a portable method, not another reproduction of the preserved Iris experiment."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><Prose>{""}<strong>{"Practice P8 — twenty museum objects."}</strong>{" A museum can handle only twenty representatives. It also cares about recovering a rare material category. Design the evaluation rather than selecting a metric by name."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate a representative budget from a category-recovery question, and choose data roles before outcomes."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"For representative handling, justify a ruler built from relevant size/material/fragility measurements, including which categorical differences are meaningful and how physical units are scaled. Fix the 20-item budget, an acceptable coverage/rejection cost and a development selection rule. Compare untouched representation error and rare-object coverage against a simple fixed-budget sampling or representative baseline; a one-representative baseline can show a scale of difficulty but does not match the 20-item operational budget by itself. Name which measurements fit preprocessing and which objects remain reserved for reporting."}</Prose>

<Prose>{"For category recovery, reserve suitable annotations from fitting/selection unless supervised information is explicitly part of the intended method. Inspect reference/candidate cells, ARI/AMI and rare-category split/merge outcomes, not just average compactness. The rare group might deserve a separate task requirement because pair influence is quadratic in size. A high purity fragmentation or a stable single bin does not satisfy recovery. Keep stable object IDs and an explicit rejection policy; any common-ID restricted comparison retains original coverage. Develop the representation and assignment/matching interpretation before the final report. The resulting choice depends on the museum's declared use; the two goals need not select the same partition."}</Prose>

</details></section>

<Prose>{"You are ready to make an independent report when you can name the objects/ruler/fit scope, explain a changed point score from its neighbors, derive an agreement result from cells or conditional questions, and defend how coverage, perturbation and data roles enter the task. Keep one changed-case calculation in the report so the metric's meaning can be checked, rather than only listing API names."}</Prose>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Files and a useful next step"}</H3>

<Prose>{"Start with "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/CLUSTERING-EVALUATION-SETUP.md"}>{"the setup guide"}</a>{". Each full source above is downloadable beside its explanation. "}<code>{"partition_diagnostics.py"}</code>{" needs "}<code>{"information_scores.py"}</code>{"; "}<code>{"silhouette_focal_sample.py"}</code>{" needs "}<code>{"silhouette_chunked.py"}</code>{"; the two original Iris files need the exact sibling CSV. Keep those named groups together. Output labels distinguish recorded streams from the two literal text projections."}</Prose>

<NeuralTable caption={"Files and a useful next step"} headers={[<>{"Mechanism"}</>,<>{"Complete files"}</>]} rows={[[<>{"exact neighborhoods"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_dense_reference.py"}>{"dense reference"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_dense_reference.py.stdout.txt"}>{"recorded output"}</a>{""}</>],[<>{"pair/null agreement"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/pair_agreement_reference.py"}>{"pair reference"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/pair_agreement_reference.py.stdout.txt"}>{"recorded output"}</a>{""}</>],[<>{"exact balanced allocations"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/fixed_margin_enumeration.py"}>{"enumeration"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/fixed_margin_enumeration.py.stdout.txt"}>{"recorded output"}</a>{""}</>],[<>{"descriptive Iris"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_descriptive_comparison.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_descriptive_comparison.py.stdout.txt"}>{"recorded output"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris.csv"}>{"CSV"}</a>{""}</>],[<>{"weighted fixed probes"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/weighted_probe_stability.py"}>{"reference"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/weighted_probe_stability.py.stdout.txt"}>{"recorded output"}</a>{""}</>],[<>{"frozen Iris report"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_heldout_report.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris_heldout_report.py.stdout.txt"}>{"recorded output"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/iris.csv"}>{"CSV"}</a>{""}</>],[<>{"information scratch"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/information_scores.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/information_scores.py.stdout.txt"}>{"new output"}</a>{""}</>],[<>{"internal indices"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/internal_indices.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/internal_indices.py.projected-output.txt"}>{"projected output"}</a>{""}</>],[<>{"split/merge/matching"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/partition_diagnostics.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/information_scores.py"}>{"helper"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/partition_diagnostics.py.stdout.txt"}>{"new output"}</a>{""}</>],[<>{"missing support"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/coassignment_support.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/coassignment_support.py.stdout.txt"}>{"new output"}</a>{""}</>],[<>{"exact blocks"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_chunked.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_chunked.py.stdout.txt"}>{"new output"}</a>{""}</>],[<>{"focal/subset targets"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_focal_sample.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_chunked.py"}>{"helper"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/silhouette_focal_sample.py.stdout.txt"}>{"new output"}</a>{""}</>],[<>{"Gap reference/rule"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/gap_reference.py"}>{"Python"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/gap_reference.py.stdout.txt"}>{"predecessor recorded toy output"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/gap_reference_R.R"}>{"R route"}</a>{""}</>],[<>{"tree fidelity"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/cophenetic_fidelity.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/cophenetic_fidelity.py.stdout.txt"}>{"new output"}</a>{""}</>],[<>{"portable report"}</>,<>{""}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/clustering_report_template.py"}>{"program"}</a>{", "}<a href={"/learn-code/clustering-evaluation-validation-silhouette-ari-nmi/clustering_report_template.py.projected-output.txt"}>{"projected output"}</a>{""}</>]]} />

<Prose>{"Continue with "}<a href={"/learn/path/full-curriculum/dbscan-density-based-clustering?module=classical-ml"}>{"DBSCAN and density-based clustering"}</a>{" to see where connectivity and rejection require different geometry/coverage choices. The skills here remain useful: align the same IDs, identify what a score reads, and keep task selection distinct from final reporting."}</Prose></section>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources" data-lesson-resource-list=""><H3>{"Research and alternative learning routes"}</H3>

<ul><li>{""}<a href={"https://www.cse.msu.edu/~cse802/Papers/DataClustering50yearsBeyondKmeans.pdf"}>{"Jain, *Data Clustering: 50 Years Beyond K-Means*"}</a>{" is a canonical field survey. Its representation and validity discussion in sections 3.3–3.5 helps explain why distance, purpose and validation evidence cannot be collapsed into one best-k rule."}</li><li>{""}<a href={"https://www.cs.rpi.edu/~zaki/DMML/slides/pdf/ychap17.pdf"}>{"Zaki & Meira's author Chapter 17 slides"}</a>{", accompanying "}<a href={"https://dataminingbook.info/toc/"}>{"*Data Mining and Machine Learning*"}</a>{", provide the second canonical route through external, internal and relative measures. Use their actual contingency/pair/entropy operations as a comparison. These are slides, not a substitute claim of access to the printed chapter; some scatter conventions differ, notably RMS versus ordinary mean DB radius."}</li><li>{""}<a href={"https://doi.org/10.1016/0377-0427(87)90125-7"}>{"Rousseeuw's original silhouette paper"}</a>{" motivates the own/foreign member fans and sorted silhouette display. Sections 1–2 and the printed 55/57 illustrations make the averaging and group distribution visible. Its geometric idea does not supply a universal modern acceptance threshold."}</li><li>{""}<a href={"https://doi.org/10.1007/BF01908075"}>{"Hubert & Arabie, *Comparing Partitions*"}</a>{" is the original ARI attribution. The finite derivation in "}<a href={"#5-ari-count-the-pairs-before-correcting-for-chance"}>{"section 5"}</a>{" remains usable without publisher access; its conditional margins must remain attached to the adjusted formula."}</li><li>{""}<a href={"https://jmlr.org/papers/volume11/vinh10a/vinh10a.pdf"}>{"Vinh, Epps & Bailey, *Information Theoretic Measures for Clusterings Comparison*"}</a>{" explains normalization, information properties and expected-MI adjustment. Read the named variant carefully: one variant's identity or metric property cannot be transferred to every “NMI.”"}</li><li>{""}<a href={"https://arxiv.org/html/2103.01281v2"}>{"Ullmann, Hennig & Boulesteix's validation-data framework"}</a>{" separates discovery/validation uses, common observations, stability, nulls and visualization. It is a useful route after the portable report, especially when the scientific use extends beyond compactness."}</li><li>{""}<a href={"https://arxiv.org/pdf/1007.1075"}>{"von Luxburg's stability overview"}</a>{" distinguishes idealized clustering stability from algorithmic and finite-sample effects. Its definitions/common-domain discussion explains why unique or coarse stable answers do not by themselves identify useful groups."}</li><li>{""}<a href={"https://hastie.su.domains/Papers/gap.pdf"}>{"Tibshirani, Walther & Hastie's original Gap paper"}</a>{" develops dispersion, reference boxes, replicate uncertainty and the earliest next-k criterion; printed 412–415 are a useful starting anatomy. Compare its finite conventions with "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/cluster/html/clusGap.html"}>{"the maintained clusGap manual"}</a>{" and "}<a href={"https://svn.r-project.org/R-packages/trunk/cluster/R/clusGap.R"}>{"official R source"}</a>{" before trying to match implementations."}</li><li>{"The "}<a href={"https://scikit-learn.org/stable/modules/clustering.html#clustering-performance-evaluation"}>{"sklearn clustering-evaluation guide"}</a>{" gives ordinary API routes. Specific references for "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.metrics.silhouette_score.html"}>{"silhouette"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.metrics.adjusted_rand_score.html"}>{"ARI"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.metrics.normalized_mutual_info_score.html"}>{"NMI"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.metrics.adjusted_mutual_info_score.html"}>{"AMI"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.metrics.fowlkes_mallows_score.html"}>{"FM"}</a>{" explain domains and conventions. The code names normalization explicitly rather than inheriting defaults silently."}</li><li>{"SciPy's "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linear_sum_assignment.html"}>{"rectangular assignment API"}</a>{" supports the maximum-weight route; "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.distance.cdist.html"}>{"cdist"}</a>{" defines focal-by-comparator output shape; "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.cophenet.html"}>{"cophenet"}</a>{" documents first-common-join condensed distances. Their online manual banner may differ from the exact installed version recorded in the setup guide."}</li><li>{""}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"UCI's Iris record"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_iris.html"}>{"sklearn's corrected loader documentation"}</a>{" establish origin/copy conventions. Retain the downloaded CSV's hash and IDs when reproducing the recorded lesson rather than substituting a different legacy copy."}</li><li>{""}<a href={"https://ds100.org/sp21/lecture/lec24/"}>{"Berkeley Data 100's archived lecture 24 listing"}</a>{" and "}<a href={"https://ds100.org/sp21/resources/assets/lectures/lec23/lec23.html"}>{"companion notebook"}</a>{" offer an alternate visual route to elbow and sorted silhouette displays. They are archived 2021 teaching material; use the current official APIs for execution."}</li></ul></section></div>;}
export default {title:'Clustering Evaluation & Validation (Silhouette, ARI, NMI)',readTime:'~50 min first pass · ~80 min complete read + 60–100 min code and practice',content:Content};
