import React from 'react';
import {H2,H3} from '../../components/content/Headings.jsx';
import {Prose} from '../../components/content/Prose.jsx';
import {CodeBlock} from '../../components/content/Code.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {NeuralTable} from '../../components/lesson-labs/NeuralLessonElements.jsx';
import {Math as InlineMath,MathBlock} from '../../components/content/Math.jsx';
import {IcaState} from '../../components/lesson-labs/ica-reading-flow/IcaDrawingElements.jsx';
import IcaDrawing from '../../components/lesson-labs/ica-reading-flow/IcaDrawings.jsx';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/ica-reading-flow/ica-reader.css';
function Content(){return <IcaState><div className="lesson-flow ica-lesson"><Prose>{"Two microphones can record different mixtures of the same speakers. Two electrodes can record different mixtures of several electrical processes. A useful hidden coordinate should explain how one changing signal contributes to every observed channel. Independent component analysis (ICA) asks for coordinates whose joint distribution separates into marginal distributions, under an explicit mixing model. It does not assign a physical name merely by finding those coordinates."}</Prose>

<Prose opening="route">{"We will follow four source states through mixing, probability, whitening, fixed-point updates, a fitted operator, and reconstruction. Then we will distinguish a newly constructed experiment from preserved evidence in a real recording, and examine what changes when time, noise, delays or nonlinear mixing matter. Read sections 1–10 for the main working route; sections 11–12 remain visible and give derivations and changed-model branches to return to. Their conclusions explain when the main route stops applying."}</Prose>

<Prose opening="prerequisites">{"You need multiplication of a matrix by a vector, dot products, averages and basic probability. "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#2-rotate-the-ruler-then-keep-its-readings"}>{"Principal component analysis (PCA)'s ruler and fitted-transform explanation"}</a>{" supplies the geometric prerequisite; "}<a href={"/learn/path/full-curriculum/probability-distributions-bayes-theorem?module=math-foundations#1-decide-what-can-happen"}>{"events and probability"}</a>{" supplies the probability prerequisite. Each is reintroduced with the actual operands used here."}</Prose>

<Prose opening="exploration">{"By the end, you should be able to compute a mixture and a compensated ambiguity; test independence beyond covariance; build population whitening from a training-only PCA fit; explain and implement guarded deflation and parallel FastICA; align estimates using calibration data; read a held-out diagnostic without overstating it; reconstruct or remove a whole channel contribution; distinguish likelihood and curvature from identification; and state which assumptions must change for temporal, noisy, delayed or nonlinear separation."}</Prose>

<Prose>{"The new executable examples use Python 3.12.14, NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1. Install the three packages in an isolated environment, keep all sibling program files together, and run a named program from that folder. The original two programs and their preserved output are historical examples. The optional MNE 1.13.2 route is complete source but was not executed here: MNE and Picard are absent in the author environment. New constructed results below come from their own recorded executions, not from rerunning the historical recording. The library, retained-record reader and objective programs below have revised output presentation. Their earlier captured streams remain labelled by version; projected displays are not new executions."}</Prose>

<CodeBlock language="bash" filename="install-and-run-ica.sh">{"python -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1\npython mixing_and_ambiguity.py"}</CodeBlock>

<H2>{"1. Follow two signals into two channels"}</H2>

<IcaDrawing id="D01" />

<Prose>{"Read the two source traces before the observed traces. At the highlighted instant, source 1 is 1 and source 2 is −1. The first observed channel is also 1, but that coincidence does not make it source 1: it is a weighted sum. The four illustrated instants visit A, C, B, D. That chosen order makes the waveforms legible; it is not a claim about independence across time."}</Prose>

<IcaDrawing id="D02" />

<Prose>{"The first channel receives twice source 1 plus once source 2: 2(1)+1(−1)=1. The second receives once source 1 plus twice source 2: 1(1)+2(−1)=−1. The signed branches terminate at actual additions. A negative source amplitude subtracts a contribution even when the corresponding mixing weight is positive. Change the selected instant, then change source 1's amplitude. Follow the source, both weighted branches and both sums together; reset restores instant C and amplitude 1."}</Prose>

<IcaDrawing id="D03" />

<Prose>{"Write the instantaneous source as the column s=(s₁,s₂)ᵀ and the observation as x=(x₁,x₂)ᵀ. The mixing matrix A has one column per source and one row per channel:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 1; scroll horizontally when needed"><MathBlock>{"A=\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix},\\qquad x=As."}</MathBlock></div>

<Prose>{"Column a₁=(2,1)ᵀ is the channel pattern of source 1; multiplying it by s₁ gives that source's whole contribution to both channels. With observations stored in rows, the same operation is X=SAᵀ, not SA. The letters A–D on points and table rows are sample IDs, distinct from operator names A and B. Our exact probability example enumerates source rows A=(−1,−1), B=(−1,1), C=(1,−1), D=(1,1), each with mass 1/4. It gives channel rows (−3,−3), (−1,1), (1,−1), (3,3). Sample shapes keep these row identities visible through every later coordinate change."}</Prose>

<IcaDrawing id="D04" />

<Prose>{"If A is known and invertible, this is a linear solve. Its inverse is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 2; scroll horizontally when needed"><MathBlock>{"B=A^{-1}=\\frac13\\begin{bmatrix}2&-1\\\\-1&2\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The first source reading is (2x₁−x₂)/3. For x=(1,−1), it is (2+1)/3=1; the second is (−1−2)/3=−1. The inverse rows are signed rulers in channel space. They include a gain as well as a direction: the first unit ruler (2,−1)/√5 reads 3/√5, then gain √5/3 gives the source reading 1. A row need not have unit length to define a linear reading. Blind separation begins when we observe X but do not know A or S. A known inverse demonstrates what recovery would mean; it does not solve that unknown factorization."}</Prose>

<Prose>{""}<code>{"mix"}</code>{" accepts a row table, a channel-by-source operator and an optional channel offset; it checks dimensions and finiteness before returning S@A.T+mean. "}<code>{"known_inverse"}</code>{" instead solves A against centered observations and transposes the result back to rows. The nonsymmetric witness A=[[2,3],[1,4]], s=(1,−1) gives x=(−1,−3); using S@A would incorrectly give (1,−1). This witness prevents a symmetric example from concealing a transpose error."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/mixing_and_ambiguity.py"}>{"mixing_and_ambiguity.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="mixing_and_ambiguity.py" source="/learn-code/independent-component-analysis-ica/mixing_and_ambiguity.py" language="python" />

<CodeBlock kind="output" language="output" filename="mixing_and_ambiguity.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/mixing_and_ambiguity.stdout.txt">{"source_rows [[-1.0, -1.0], [-1.0, 1.0], [1.0, -1.0], [1.0, 1.0]] channel_rows [[-3.0, -3.0], [-1.0, 1.0], [1.0, -1.0], [3.0, 3.0]]\nknown_roundtrip True\nedited_source [[8. 3.]] edited_columns [[-0.5  3. ]\n [-0.5  1. ]] same_channels [[ 5. -1.]]\nfamily 0.0 det 4.0 condition 1.0\nfamily 1.0 det 2.9999999999999996 condition 2.999999999999999\nfamily 1.99 det 0.03989999999999983 condition 399.00000000000404\nfamily 2.0 det 0.0 condition inf\nnonsymmetric_rows [[-1. -3.]]\nrefused singular Singular operator: source coordinates are not unique\nrefused zero_scale A zero or nonfinite scale cannot be compensated"}</CodeBlock>

<Prose>{"The program's later edits are the compensated ambiguities we inspect next. Its singular and zero-scale messages are explicit refusals, not fabricated source estimates."}</Prose>

<H2>{"2. Separate what can be identified from how it is named"}</H2>

<IcaDrawing id="D05" />

<Prose>{"A change of source sign can be canceled by changing the sign of its mixing column. A nonzero source scale d can be canceled by dividing that column by d. Swapping source coordinates can be canceled by swapping columns. Thus even a successful blind recovery ordinarily determines source coordinates only up to permutation and nonzero scaling, including sign."}</Prose>

<Prose>{"At canonical sample C, multiplying source 1 by −2 changes scores (1,−1) to (−2,−1); dividing its column (2,1) by −2 gives (−1,−.5). The contributions remain (2,1)+(−1,−2)=(1,−1). Swapping these adjusted scores and columns leaves the same channels. The repeated traces above use exactly this compensation at every illustrated instant."}</Prose>

<Prose>{"For row storage, let P be a permutation matrix and D a diagonal matrix of nonzero scales. Then S′=SPᵀD and A′=APᵀD⁻¹ give S′A′ᵀ=SAᵀ. In a separate numerical example, with s=(3,−4) and A=[[3,1],[1,1]], swapping first and then scaling the first new coordinate by −2 gives s′=(8,3). The first new column becomes (−1/2,−1/2), the second becomes (3,1). Their contributions (−4,−4)+(9,3) still give (5,−1). At scale zero no compensating inverse exists. The later calibration investigation exposes that loss together with undefined matching; a valid previously fitted operator remains available."}</Prose>

<Prose>{"Unaligned estimates are named C1 and C2 and drawn neutrally. Amber and blue identify known source 1 and source 2, or a separately declared calibration alignment. Color must not decide an assignment before the mathematics does."}</Prose>

<IcaDrawing id="D06" />

<Prose>{"For A(a)=[[2,a],[a,2]], the columns are (2,a) and (a,2). The determinant is 4−a². At a=2 they coincide, and source direction (1,−1) maps to zero. The observation retains the sum but loses the contrast; no inverse can recover the missing coordinate. Singular values describe stretch along orthogonal input directions. Before that endpoint, they are 2+a and 2−a, so the 2-norm condition number is (2+a)/(2−a). At a=1.99 it is 399. A measurement error of .01 in the unit contrast direction becomes a source error of 1 because division uses the small singular value .01. High sensitivity and exact nonuniqueness are different failure states. The live column drawing exposes both rather than forcing a recovered arrow at the singular endpoint."}</Prose>

<Prose>{"These ambiguities are properties of the model, not defects to repair by sorting columns. Physical identification requires additional measurements, assumptions or validation."}</Prose>

<H2>{"3. Independence is a statement about every joint event"}</H2>

<IcaDrawing id="D07" />

<Prose>{"Flip two independent fair coins. Each complete branch has probability (1/2)(1/2)=1/4. In the full two-by-two table, every joint cell equals the corresponding product of row and column marginal probabilities. This is independence. It includes all cells, not only the average relationship between numerical labels."}</Prose>

<Prose>{"For discrete coordinates U and V, independence means p(U=u,V=v)=p(U=u)p(V=v) for all supported values. Conditioning on an event of positive probability then leaves the other coordinate's distribution unchanged. Conditioning on a zero-probability event is undefined in this elementary finite-table calculation; do not display an all-zero conditional distribution as an answer."}</Prose>

<IcaDrawing id="D08" />

<Prose>{"Now choose U uniformly from −1,0,1 and set V=U². The only joint masses are p(−1,1)=p(0,0)=p(1,1)=1/3. Expectation E is the probability-weighted average. Here E[U]=0, E[V]=2/3 and E[UV]=(−1+0+1)/3=0. Covariance E[UV]−E[U]E[V] is therefore zero. Nevertheless p(U=0,V=0)=1/3 while p(U=0)p(V=0)=1/9. Knowing U=0 makes V=0 certain, whereas its marginal probability is 1/3."}</Prose>

<Prose>{"The investigation mixes this dependent table with its own marginal product: p_q=(1−q)p_Up_V+q p_dependent. Both marginals and covariance remain fixed. The central cell is 1/9+2q/9: at q=.5 it is 2/9, twice the product cell. Only q=0 makes every cell factor. This makes the information discarded by covariance directly visible."}</Prose>

<IcaDrawing id="D09" />

<Prose>{"The next section removes covariance stretch, an operation called whitening. Applied to our four-state channel mixture, it will produce a diamond with points (−√2,0),(0,−√2),(0,√2),(√2,0). Each coordinate has mean zero and variance one and their covariance is zero. Yet their zero events are dependent: each has marginal zero probability 1/2, but their joint zero probability is 0, not 1/4. When the first coordinate is zero the second is never zero. Decorrelated coordinates can still reveal each other."}</Prose>

<Prose>{"Mutual information summarizes the full finite-table departure:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 3; scroll horizontally when needed"><MathBlock>{"I(U;V)=\\sum_{p_{uv}>0}p_{uv}\\log\\frac{p_{uv}}{p_up_v}."}</MathBlock></div>

<Prose>{"Logs are natural, so the unit is nats. Zero joint cells contribute zero by the limiting convention; positive cells have positive marginal products. Mutual information is zero exactly at the product law. "}<code>{"summarize"}</code>{" computes marginal vectors, "}<code>{"np.outer"}</code>{" forms their product, and a positive-cell mask avoids taking log(0). The complete source subtracts log marginal terms instead of first dividing by their product, so tiny positive marginals do not underflow that ratio. It also refuses nonfinite moment results after finite-input validation. Its numerical independence flag tests all-cell agreement to absolute tolerance 10⁻¹²; the mathematical law criterion remains exact, so this flag is not a proof that an arbitrarily tiny dependence is zero. "}<code>{"law"}</code>{" refuses negative, nonfinite, empty or unnormalized input; it does not quietly change probabilities. "}<code>{"conditional_row"}</code>{" returns "}<code>{"None"}</code>{" when its row mass is zero, preserving the distinction between unavailable and zero."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/joint_probability.py"}>{"joint_probability.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="joint_probability.py" source="/learn-code/independent-component-analysis-ica/joint_probability.py" language="python" />

<CodeBlock kind="output" language="output" filename="joint_probability.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/joint_probability.stdout.txt">{"q 0.0 joint [[0.1111111111111111, 0.2222222222222222], [0.1111111111111111, 0.2222222222222222], [0.1111111111111111, 0.2222222222222222]] product [[0.1111111111111111, 0.2222222222222222], [0.1111111111111111, 0.2222222222222222], [0.1111111111111111, 0.2222222222222222]] mean [0.0, 0.6666666666666666] cov 0.0 MI_nats 0.0 independent True\nq 0.5 joint [[0.05555555555555555, 0.2777777777777778], [0.2222222222222222, 0.1111111111111111], [0.05555555555555555, 0.2777777777777778]] product [[0.11111111111111113, 0.22222222222222227], [0.11111111111111112, 0.22222222222222224], [0.11111111111111113, 0.22222222222222227]] mean [0.0, 0.6666666666666667] cov 0.0 MI_nats 0.12396864 independent False\nq 1.0 joint [[0.0, 0.3333333333333333], [0.3333333333333333, 0.0], [0.0, 0.3333333333333333]] product [[0.1111111111111111, 0.2222222222222222], [0.1111111111111111, 0.2222222222222222], [0.1111111111111111, 0.2222222222222222]] mean [0.0, 0.6666666666666666] cov 0.0 MI_nats 0.636514168 independent False\ndiamond {'joint': array([[0.  , 0.25, 0.  ],\n       [0.25, 0.  , 0.25],\n       [0.  , 0.25, 0.  ]]), 'product': array([[0.0625, 0.125 , 0.0625],\n       [0.125 , 0.25  , 0.125 ],\n       [0.0625, 0.125 , 0.0625]]), 'means': array([0., 0.]), 'covariance': 0.0, 'mi_nats': 0.6931471805599453, 'independent': False}\nzero_mass_condition None\nrefused Probabilities must already sum to one; no silent renormalization"}</CodeBlock>

<Prose>{""}<strong>{"Current function check: normal law, tiny positive probability and overflow refusal"}</strong>{""}</Prose>

<CodeBlock language={"json"}>{"{\n  \"role\": \"Actual bounded changed-function execution, no instructional main replay\",\n  \"regular_means\": [\n    0.0,\n    0.6666666666666666\n  ],\n  \"regular_covariance\": 0.0,\n  \"regular_mi_nats\": 0.6365141682948129,\n  \"tiny_positive_mi_nats\": 6.907755278982137e-298,\n  \"overflow_refusal\": \"Probability moments overflowed; rescale the value labels\",\n  \"passed\": 3\n}"}</CodeBlock>

<Prose>{"The dependent U,U² table has mutual information about .636514168 nats despite zero covariance. The whitened diamond has about .693147181 nats. These are exact finite laws; empirical mutual-information estimation on continuous noisy data is a separate problem."}</Prose>

<H2>{"4. Whiten the covariance, then inspect the remaining freedom"}</H2>

<IcaDrawing id="D10" />

<Prose>{"Centering subtracts a training mean. Adding offset (10,−3) to every channel row makes that the four-state training mean. A later query (11,−4) must subtract this stored vector to obtain (1,−1). Replacing it with the mean of the query batch changes the fitted coordinate system and can erase a lone query entirely."}</Prose>

<IcaDrawing id="D11" />

<Prose>{"Write the centered row table as X_c=X−μ. Its channel covariance, using population denominator n=4, is C=X_cᵀX_c/4=[[5,4],[4,5]]. Its diagonal rulers are v₊=(1,1)/√2 and v₋=(1,−1)/√2, with eigenvalues 9 and 1. Each ruler measures a signed projection; the covariance ellipse has standard-deviation radii 3 and 1 along them."}</Prose>

<IcaDrawing id="D12" />

<Prose>{"Divide the first reading by 3 and the second by 1. The resulting population whitener is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 4; scroll horizontally when needed"><MathBlock>{"K=\\begin{bmatrix}(1,1)/(3\\sqrt2)\\\\(1,-1)/\\sqrt2\\end{bmatrix},\n\\quad z=K(x-\\mu),\\quad Z=(X-\\mu)K^\\mathsf T."}</MathBlock></div>

<Prose>{"The four row identities become the diamond described in section 3, and E[zzᵀ]=I. PCA found covariance rulers; whitening also rescaled their readings. Neither operation by itself used the joint probability cells that distinguish a diamond from an independent square."}</Prose>

<IcaDrawing id="D13" />

<Prose>{"The maintained "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#10-deeper-branches"}>{"PCA whitening adapter"}</a>{" uses sample variance with denominator n−1. Here its eigenvalues are 12 and 4/3. Sample-whitened readings have population variance (n−1)/n=3/4, so ICA's population convention multiplies them by √(n/(n−1))=√(4/3). This conversion uses the training n forever; a one-row query does not create a new denominator."}</Prose>

<Prose>{""}<code>{"CenteredPCA.fit"}</code>{" stores the mean, retained directions, singular values, numerical rank and sample variances from a thin singular-value decomposition. "}<code>{"WhitenedPCA.from_fitted"}</code>{" refuses retained variances that are numerically zero. Those exact dependencies follow; their original "}<code>{"main"}</code>{" demonstrations were not rerun for this lesson."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/centered_pca.py"}>{"centered_pca.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="centered_pca.py" source="/learn-code/independent-component-analysis-ica/centered_pca.py" language="python" />

<RemoteCodeBlock filename="pca_whitening.py" source="/learn-code/independent-component-analysis-ica/pca_whitening.py" language="python" />

<Prose>{""}<code>{"PopulationWhitening.fit"}</code>{" adds the positive-count/rank policy needed here. If V contains retained PCA rows and f contains their sample standard deviations, it stores K=c V/f and decoder=Vᵀ f/c, where c=√(n/(n−1)). Its arrays are read-only copies. Transform uses the stored mean and K; inverse uses the stored decoder and mean. Finite-input checks are not sufficient alone: centering, variance, projection and reconstruction can overflow, so each resulting quantity is checked as well."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/population_whitening.py"}>{"population_whitening.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="population_whitening.py" source="/learn-code/independent-component-analysis-ica/population_whitening.py" language="python" />

<CodeBlock kind="output" language="output" filename="population_whitening.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/population_whitening.stdout.txt">{"training_mean [10. -3.] K [[ 0.23570226  0.23570226]\n [-0.70710678  0.70710678]] decoder [[ 2.12132034 -0.70710678]\n [ 2.12132034  0.70710678]]\npopulation_covariance [[1.0000000e+00 2.7476618e-16]\n [2.7476618e-16 1.0000000e+00]]\nsample_adapter_population_variance [0.75 0.75]\nquery_white [[ 5.55111512e-17 -1.41421356e+00]] query_roundtrip [[11. -4.]]\nplane_query_retained [[ 1. -1.  0.]]\nrefused rank Retained count exceeds positive numerical rank\nrefused zero_count ICA requires a positive integer retained count\nrefused constant Retained count exceeds positive numerical rank"}</CodeBlock>

<Prose>{"The numerical SVD may orient the second ruler with the opposite sign to the canonical diagram. That is a valid whitening frame; inverse composition compensates it. The program's covariance and round trip test the claimed operations, rather than demanding a particular eigenvector sign."}</Prose>

<IcaDrawing id="D14" />

<Prose>{"If Z is white and Q is orthogonal, ZQᵀ is also white because QIQᵀ=I. Orthogonal means rows and columns have unit norm and are mutually perpendicular. It permits reflections as well as rotations. In the canonical frame,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 5; scroll horizontally when needed"><MathBlock>{"Q=\\frac1{\\sqrt2}\\begin{bmatrix}1&1\\\\1&-1\\end{bmatrix},\\qquad S=ZQ^\\mathsf T."}</MathBlock></div>

<Prose>{"Q has determinant −1, so this exact square recovery includes a reflection. The angle investigation rotates the white rulers and shows that covariance stays I, while joint event structure changes. At white angle 45° the two projection lines are the source lines; their order and signs still need a naming convention."}</Prose>

<IcaDrawing id="D15" />

<Prose>{"Rank means the number of numerically independent directions in the centered table. Add a third channel that is identically zero to the two source columns: the cloud lies in a two-dimensional plane in three-dimensional channel space. Whitening only its positive directions produces a two-coordinate representation; asking for three divides by zero variance and must fail. A query (1,−1,1) projects to (1,−1,0); its residual (0,0,1) was outside the retained training plane. The inverse is a reconstruction in that plane, not a promise of a full three-dimensional inverse. The numerical-rank threshold is eps·max(n,d)·largest singular value; record it rather than calling every tiny value exactly zero."}</Prose>

<H2>{"5. Read the shape that covariance cannot describe"}</H2>

<Prose>{"The white rulers can rotate without changing covariance. To see what a distribution adds, return to the known source coordinates and inspect their projection shapes."}</Prose>

<IcaDrawing id="D16" />

<Prose>{" Project independent ±1 sources onto a unit direction w=(a,b), a²+b²=1. The projected variance is a²+b²=1. Expanding the fourth power and using independence gives E[y⁴]=a⁴+b⁴+6a²b². The excess kurtosis κ=E[y⁴]/E[y²]²−3 reduces to −2(a⁴+b⁴). Along a source axis it is −2; halfway between axes it is −1. The unit circle, actual projected support masses and contrast curve explain why a source projection differs from a mixture even though both have variance one. For these negative binary values, selecting the largest signed kurtosis would prefer the mixture −1 over a source −2. A largest-absolute or squared-kurtosis criterion instead prefers the source axes. This is the source frame; its 45° angle is a mixture, unlike the white frame's 45° separating lines."}</Prose>

<IcaDrawing id="D17" />

<Prose>{"For independent unit-variance Laplace sources, the density is e^(−√2|s|)/√2 and each source has excess kurtosis 3. The projection has κ=3(a⁴+b⁴): 3 on an axis and 1.5 at 45°. Its sharp center and tails are a different kind of non-Gaussian shape from the bounded binary law. The Laplace density drawing is analytic, not a histogram from four binary states."}</Prose>

<IcaDrawing id="D18" />

<Prose>{"Non-Gaussian does not mean nonzero kurtosis. Give −√3 and √3 probability 1/6 each and zero probability 2/3. Then E[y²]=1, E[y⁴]=3, κ=0 and E[y⁶]=9. A unit Gaussian has sixth moment 15. A fourth-moment contrast misses this three-point distribution's non-Gaussianity. A failed contrast is not a proof that the source is Gaussian."}</Prose>

<IcaDrawing id="D19" />

<Prose>{"Two independent standard Gaussian sources have circular joint density proportional to e^(−(s₁²+s₂²)/2). Every orthogonal coordinate pair has the same joint density and independent Gaussian marginals. Rotating its analytic contours by 30° or any other angle gives no preferred source frame. The classical marginal identification route assumes a constant noiseless instantaneous linear mixing with full column rank in its square or overdetermined signal subspace, nondegenerate mutually independent sources, and at most one Gaussian source. Our whitening derivation additionally requires finite positive variances, and fourth-moment illustrations require finite fourth moments. Source sign, scale and order still remain. Finite Gaussian samples have accidental kurtosis fluctuations; those fluctuations do not identify a preferred population frame."}</Prose>

<Prose>{""}<code>{"moments"}</code>{" centers a finite weighted law and reports second, fourth and sixth central moments, refusing zero variance. "}<code>{"nonlinearities"}</code>{" provides cubic g(y)=y³, bounded logcosh derivative g(y)=tanh(αy), and g(y)=y exp(−y²/2), together with their derivatives. Logcosh restricts α to [1,2]. The magnitudes of different contrast functions are not one interchangeable loss; their curvature and robustness behavior differ."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/projection_contrasts.py"}>{"projection_contrasts.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="projection_contrasts.py" source="/learn-code/independent-component-analysis-ica/projection_contrasts.py" language="python" />

<CodeBlock kind="output" language="output" filename="projection_contrasts.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/projection_contrasts.stdout.txt">{"source_frame_degrees 0.0 binary {'variance': 1.0, 'fourth': 1.0, 'sixth': 1.0, 'kurtosis': -2.0} analytic_Laplace_kurtosis 3.0 analytic_Gaussian_kurtosis 0.0\nsource_frame_degrees 30.0 binary {'variance': 1.0, 'fourth': 1.7499999999999998, 'sixth': 3.249999999999999, 'kurtosis': -1.2500000000000002} analytic_Laplace_kurtosis 1.8750000000000004 analytic_Gaussian_kurtosis 0.0\nsource_frame_degrees 45.0 binary {'variance': 1.0000000000000002, 'fourth': 2.0000000000000004, 'sixth': 4.000000000000002, 'kurtosis': -1.0000000000000004} analytic_Laplace_kurtosis 1.5000000000000004 analytic_Gaussian_kurtosis 0.0\nsource_frame_degrees 90.0 binary {'variance': 0.9999999999999999, 'fourth': 0.9999999999999998, 'sixth': 0.9999999999999997, 'kurtosis': -2.0} analytic_Laplace_kurtosis 3.0 analytic_Gaussian_kurtosis 0.0\nzero_kurtosis_nonGaussian {'variance': 0.9999999999999998, 'fourth': 2.999999999999999, 'sixth': 8.999999999999996, 'kurtosis': 4.440892098500626e-16}\ng_and_derivative cubic ([-0.5120000000000001, 0.0, 0.5120000000000001], [1.9200000000000004, 0.0, 1.9200000000000004])\ng_and_derivative logcosh ([-0.664036770267849, 0.0, 0.664036770267849], [0.559055167732244, 1.0, 0.559055167732244])\ng_and_derivative exp ([-0.5809192296589527, 0.0, 0.5809192296589527], [0.2614136533465286, 1.0, 0.2614136533465286])\nrefused Standardized contrast needs finite positive variance"}</CodeBlock>

<H2>{"6. Work through one FastICA direction"}</H2>

<IcaDrawing id="D20" />

<Prose>{"Use the white diamond again and start with unit direction w=(.8,.6). The four projections are −.8√2,−.6√2,.6√2,.8√2. For a cubic update, cube each projection and multiply it by its corresponding white vector. Averaging the four resulting vectors gives E[z y³]=(1.024,.432). The ordered row table shows each signed intermediate; the vector drawing uses those actual coordinates."}</Prose>

<IcaDrawing id="D21" />

<Prose>{"The one-unit fixed-point update is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 6; scroll horizontally when needed"><MathBlock>{"r=E[z g(w^\\mathsf Tz)]-E[g'(w^\\mathsf Tz)]w,\n\\qquad w_{new}=r/\\|r\\|."}</MathBlock></div>

<Prose>{"Because E[y²]=1 here and g′(y)=3y², the second term is 3w=(2.4,1.8). Subtraction gives r=(−1.376,−1.368). Its normalized vector is approximately (−.709165,−.705042). Reversing its sign names the same projection line. The sign-aligned line has direction (.709165,.705042), while the raw subtraction arrow points in the opposite direction. This update approaches the white diagonal, not a raw-channel diagonal picked from covariance alone."}</Prose>

<Prose>{"The derivative g′ describes how g changes with its projection input; for y³ it is 3y². Keeping w on the unit circle constrains the allowed direction changes. A stationary contrast has no first-order improvement along those allowed changes. FastICA can be derived from this constrained stationarity equation under whitening, using an approximate curvature simplification to obtain the fixed-point form. A Newton-style update uses local derivative and curvature information to approach a stationary point; section 11 draws that curvature step explicitly. A fixed point need not identify a source: for this cubic diamond, a white axis gives r=−w and line movement zero but projects a dependent mixture with κ=−1. White diagonal source lines give κ=−2. Initialization, contrast and stationary-point diagnostics therefore belong to the fit contract."}</Prose>

<IcaDrawing id="D22" />

<Prose>{"Measure line movement as 1−|w_newᵀw_old|, clamped to [0,1] against rounding. If the vector flips sign, its line has not moved: this measure is zero although Euclidean distance is 2. With linear g(y)=y, whitening makes E[z y]=w and E[g′]=1, so r=0. Normalizing it would divide by zero. The zero result is at the origin and has no normalized direction; a unit arrow would invent an update."}</Prose>

<Prose>{"The local Step/Reset investigation begins at angle atan2(.6,.8)=36.86989764584402°. It stores at most 20 visible steps, clears history when the initial angle changes, and stops on a refused or small-movement update with its actual reason. A plotting budget of 20 is not a convergence guarantee or a source-identification certificate."}</Prose>

<H2>{"7. Keep multiple recovered directions from repeating each other"}</H2>

<IcaDrawing id="D23" />

<Prose>{"Deflation fits directions one after another. For an already retained unit row p=(.6,.8) and candidate r=(1,0), the overlap is (rᵀp)p=.6(.6,.8)=(.36,.48). Subtract it to get (.64,−.48), whose norm is .8, then normalize to (.8,−.6). Apply this orthogonal subtraction inside every fixed-point iteration; otherwise the next update can return to a previous component. If the candidate equals p exactly, subtraction gives zero and the fit refuses it. The keyboard-accessible parallel detent represents p itself, not rounded angle coordinates that leave an artificial tiny residual."}</Prose>

<IcaDrawing id="D24" />

<Prose>{"Parallel FastICA updates all rows and then restores their mutual orthogonality together. For W=[[1,0],[1,1]], the row Gram matrix WWᵀ=[[1,1],[1,2]] has eigenvalues (3±√5)/2. Its inverse square root produces"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 7; scroll horizontally when needed"><MathBlock>{"W_{orth}=(WW^\\mathsf T)^{-1/2}W=\\frac1{\\sqrt5}\\begin{bmatrix}2&-1\\\\1&2\\end{bmatrix}."}</MathBlock></div>

<Prose>{"Here the positive square root of the Gram matrix is [[2,1],[1,3]]/√5; its square returns [[1,1],[1,2]]. Its inverse [[3,−1],[−1,2]]/√5 applied to W gives the displayed orthogonal rows. This is symmetric decorrelation, also called the row polar factor. It changes both rows rather than preserving the first as deflation does. With duplicate rows the Gram matrix has a zero eigenvalue; an inverse square root is undefined. Adding a ridge would change the operation and would not silently become this exact polar normalization."}</Prose>

<Prose>{"The complete implementation below reuses maintained dense SVD and symmetric-eigenvalue kernels. It implements the ICA-specific iteration, state and component operations explicitly. "}<code>{"fit"}</code>{" validates the algorithm, contrast, nonnegative seed, positive count and budget, tolerance, and square finite initialization. It fits one population whitener on training rows and stores Z once. "}<code>{"unit"}</code>{" refuses unresolved directions; "}<code>{"polar"}</code>{" uses a relative positive-Gram-spectrum check. Arrays stored in a returned fit are immutable copies."}</Prose>

<Prose>{"In deflation, each y=Z@w has one projection per training row; "}<code>{"Z.T@g/n"}</code>{" reduces sample contributions to one vector. Previous-row projections are removed before each normalization. In parallel, Y=ZWᵀ is n-by-k; R=g(Y)ᵀZ/n−mean(g′(Y),axis=0)[:,None]W updates all rows without constructing an n-by-k-by-k tensor. Row-wise absolute dot products measure stopping movement. The maximum parallel movement must be below tolerance; deflation records each row's history and count. Reaching the budget raises "}<code>{"FitRefused"}</code>{" with candidate metadata and yields no usable fitted object."}</Prose>

<Prose>{"The returned raw-channel operator is B=WK. Its decoder is K_decoder Wᵀ, equal to the pseudoinverse of B on the retained subspace. "}<code>{"transform"}</code>{" applies the stored training mean; "}<code>{"inverse_transform"}</code>{" decodes source rows and adds it back. "}<code>{"contributions"}</code>{" intentionally allocates q-by-d-by-k only when individual pieces are requested. "}<code>{"remove"}</code>{" instead zeros selected score columns and decodes with q-by-k workspace. It rejects duplicate or out-of-range component indices rather than interpreting them as physiological labels."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/constructed_sources.py"}>{"constructed_sources.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="constructed_sources.py" source="/learn-code/independent-component-analysis-ica/constructed_sources.py" language="python" />

<Prose>{"This helper declares a new 4,000-row experiment: independent generators with seeds 17 and 23 draw unit-population-variance Laplace and uniform sources, then A_new=[[1,.5],[−.25,2]] and offset (3,−2) mix them. Finite sample means, variances and correlations are not the exact ideal moments. Training is [0,2400), calibration [2400,3200), test [3200,4000). The immutable helper arrays ensure all compared routes see the same observations. The known sources are used for evaluation after fitting, not supplied to the ICA fit."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/fastica_scratch.py"}>{"fastica_scratch.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="fastica_scratch.py" source="/learn-code/independent-component-analysis-ica/fastica_scratch.py" language="python" />

<CodeBlock kind="output" language="output" filename="fastica_scratch.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/fastica_scratch.stdout.txt">{"fit deflation iterations (4, 1) final_movements [1.0621153567758057e-07, 0.0]\northogonality 1.1102230246251565e-16 roundtrip_max 8.881784197001252e-16\nfit parallel iterations (4,) final_movements [1.0104581948944258e-08]\northogonality 9.992007221626409e-16 roundtrip_max 4.440892098500626e-15\ncandidate_refused False retained_previous True\nrefused linear_zero Zero, numerically unresolved, or nonfinite direction\nrefused duplicate_rows Rows are numerically dependent; polar inverse square root is undefined\nrefused parallel_deflation Zero, numerically unresolved, or nonfinite direction"}</CodeBlock>

<Prose>{"In the recorded constructed execution, deflation used counts (4,1) and parallel used four iterations. Their maximum reconstruction errors were about 8.88×10⁻¹⁶ and 4.44×10⁻¹⁵. These demonstrate algebraic round trips for this full-rank fitted object, not exact source recovery. A separately attempted one-step candidate was refused; the previous fit remained the same object. Zero update, duplicate rows and an exactly parallel deflation candidate also refused normalization."}</Prose>

<Prose>{"With n rows, d channels and retained k directions, a dense thin SVD costs O(nd·min(n,d)) and may temporarily hold n-by-min(n,d) left singular vectors even though we discard them. Retained Z uses O(nk), operators O(dk+k²). A complete deflation sweep and a parallel iteration have O(nk²+k³) work at this dense scale, although their sequencing and constants differ. A symmetric eigensolve is a numerical primitive, not an invented faster scientific optimizer; repeated global component matching is deliberately outside the iteration."}</Prose>

<H2>{"8. Treat a fit as an operator bundle and compare ordinary tools"}</H2>

<IcaDrawing id="D25" />

<Prose>{"A fitted model contains a training mean μ, whitener K, white-space rows W, raw operator B=WK and decoder. The canonical offset query makes their order concrete: (11,−4)−(10,−3)=(1,−1); K gives (0,√2); Q gives source (1,−1); A decodes (1,−1); adding μ restores (11,−4). Omitting the mean on either side is an error. A failed candidate belongs beside this intact previous bundle, with a refusal reason, rather than partially overwriting its fields."}</Prose>

<IcaDrawing id="D26" />

<Prose>{"The ordinary "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.FastICA.html"}>{"scikit-learn FastICA API"}</a>{" has two useful routes. Direct fitting with "}<code>{"whiten='unit-variance'"}</code>{" centers and whitens internally; "}<code>{"components_"}</code>{" is the raw-channel operator, "}<code>{"mixing_"}</code>{" its pseudoinverse and "}<code>{"mean_"}</code>{" the fitted channel mean. Its unit-variance scaling concerns recovered training sources. External whitening gives FastICA already-white Z and uses "}<code>{"whiten=False"}</code>{", "}<code>{"n_components=None"}</code>{". Its "}<code>{"components_"}</code>{" then acts on white coordinates and it does not store "}<code>{"mean_"}</code>{" or "}<code>{"whitening_"}</code>{". Compose the raw operator with K yourself and retain the external mean and decoder."}</Prose>

<Prose>{"The installed 1.9.1 implementation confirms this distinction: the no-whitening branch applies its rows directly; transform only subtracts a mean in the whitening branch; inverse only adds that mean in the same branch. SVD is selected explicitly in the direct route. "}<code>{"ConvergenceWarning"}</code>{" is captured and displayed. A returned library estimator with that warning is not automatically accepted as a converged candidate by this example. If either candidate fails this policy, "}<code>{"evaluation_available False"}</code>{" reports the refusal and the function returns without evaluating it. The retained successful execution below contains no refusal event."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/fastica_library.py"}>{"fastica_library.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="fastica_library.py" source="/learn-code/independent-component-analysis-ica/fastica_library.py" language="python" />

<CodeBlock kind="output" language="output" filename="fastica_library.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/fastica_library.stdout.txt">{"direct_converged True warnings [] iterations 2\nexternal_converged True warnings [] iterations 2\ndirect_attributes mean [ 3.00192026 -1.97456701] components [[ 0.11057152  0.47755436]\n [ 0.92323385 -0.232592  ]] mixing [[ 0.49846939  1.02344978]\n [ 1.97858833 -0.23696653]]\nexternal_W [[ 0.99990895 -0.01349418]\n [ 0.01349418  0.99990895]] composed_raw_B [[ 0.11057152  0.47755436]\n [ 0.92323385 -0.232592  ]] has_mean False has_whitening False\ndirect_roundtrip_max 8.881784197001252e-16\nexternal_roundtrip_max 8.881784197001252e-16\nraw_composition_equal True\nretained_projectors_equal True\ndirect calibration_columns (1, 0) unique True test {'signed_correlation': [0.9999930832478476, 0.9999643146130363], 'mse_source_units_squared': [1.2073175820902235e-05, 6.569536854710803e-05]}\nexternal calibration_columns (1, 0) unique True test {'signed_correlation': [0.9999930832478476, 0.9999643146130361], 'mse_source_units_squared': [1.2073175820900752e-05, 6.569536854711285e-05]}"}</CodeBlock>

<Prose>{"In the retained execution, both ordinary routes converged in two iterations without warnings. Their composed raw operators agree numerically and their retained projectors and round trips agree. That agreement is specific evidence for these operands and settings; scratch/library columns, scales, signs or iteration counts need not agree in general. Comparing raw column numbers before accounting for these ambiguities can misdiagnose a correct result."}</Prose>

<IcaDrawing id="D27" />

<Prose>{"Calibration resolves a declared comparison, not blind physical identity. Build signed Pearson correlations C_ij between known calibration source i and estimated component j. For C=[[.9,.8],[.85,.1]], taking each row's largest value would reuse the first estimate. The global one-to-one assignment chooses the swap, whose total absolute correlation is .8+.85=1.65, instead of the diagonal's 1.0. "}<code>{"linear_sum_assignment"}</code>{" minimizes −|C|. Zero variance makes correlation undefined; ties mean the assignment is nonunique, not a reason to invent jitter or a universal column order."}</Prose>

<Prose>{"The local signed-scale and Swap investigation uses a separate exact synthetic example based on the four source rows, with default first-coordinate scale −1. Nonzero scaling and a matching reciprocal decoder-column change preserve the observation; swapping preserves score/column pairs. Inspect its signed correlations before and after the declared alignment. At scale zero that estimate has zero variance, its matching correlation is undefined, and no reciprocal decoder exists. Show the lost-coordinate candidate separately from the retained valid operator; do not claim compensated reconstruction at zero. This synthetic investigation does not edit the fixed .9/.8/.85/.1 assignment witness."}</Prose>

<Prose>{"After assignment, fit a least-squares signed scale for each calibration pair, using stored calibration means. A negative scale includes the sign correction. Apply exactly those stored columns, means and scales to held-out estimates; never choose new ones using test truth. The optional uniqueness diagnostic forbids each selected edge and tests whether another matching has the same objective. It adds k assignment solves and is an evaluation diagnostic, not part of FastICA's inner loop."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/align_and_evaluate.py"}>{"align_and_evaluate.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="align_and_evaluate.py" source="/learn-code/independent-component-analysis-ica/align_and_evaluate.py" language="python" />

<CodeBlock kind="output" language="output" filename="align_and_evaluate.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/align_and_evaluate.stdout.txt">{"assignment_counterexample (array([1, 0]), True, 1.65)\ntie_assignment (array([0, 1]), False, 1.0)\ncolumns (1, 0) calibration_scales [ 2.  -0.5] unchanged_test_mapping [[ 2.  3.]\n [-4.  1.]] test {'signed_correlation': [1.0, 0.9999999999999998], 'mse_source_units_squared': [0.0, 0.0]}\nrefused Correlation is undefined for zero/nonfinite variance"}</CodeBlock>

<Prose>{"For the new constructed ordinary fits, calibration selected columns (1,0), uniquely. Held-out signed correlations were approximately .999993 and .999964, and mean squared errors (MSE) about 1.2073×10⁻⁵ and 6.5695×10⁻⁵ in source units squared. These numbers describe this new finite experiment; they do not change the historical recording result."}</Prose>

<IcaDrawing id="D28" />

<Prose>{"The stationary white axis in section 6 has movement zero and mixture kurtosis −1. The neighboring step trace has a finite display budget, while the calibration table has a known-truth assignment. These objects answer different questions. Keep three questions separate. Small iteration movement says the algorithm met its numerical stopping rule. Stability across seeds, samples and windows asks whether an estimated subspace or aligned component repeats. A downstream diagnostic asks whether that representation helps a specified task on unseen data. None supplies the other two automatically. A perfectly reconstructing full-rank B can still represent mixtures, and a stable mixture can still be useless for the intended task."}</Prose>

<H2>{"9. Read the recording's retained evidence without inventing a new run"}</H2>

<IcaDrawing id="D29" />

<Prose>{"The retained "}<a href={"https://physionet.org/content/adfecgdb/1.0.0/"}>{"PhysioNet r01 extract"}</a>{" has 20,000 synchronous samples at 1,000 Hz from five channels: a direct reference and four abdominal channels. Only the four abdominal channels enter PCA or ICA. The direct reference is excluded from their fitting inputs and used afterward for a waveform correlation diagnostic. The analog-to-digital converter (ADC) records integer counts, which need the header calibration before they have physical voltage units. At sample 0 the five ADC counts are (287,−89,133,220,325); at sample 16000 they are (−257,77,−272,41,−55). Row identity is shared across channels: shuffling one channel independently would destroy the mixture observation."}</Prose>

<IcaDrawing id="D30" />

<Prose>{"Training covers seconds [0,12), development [12,16), and later evaluation [16,20). Convert each ADC count using the recorded header endpoints: (count+32768)·6553.6/65535−3276.8 microvolts. Fit centering, scaling and representations only on training. Choose a candidate and display polarity from development; use later data once for the resulting comparison. This ordering is retained evidence. The fitted numeric mean, scaler, K, B and decoder arrays were not saved, so the fit diagram labels their actual dimensions symbolically and says their numeric values are unavailable. Refitting now would create different evidence, not recover those missing saved arrays."}</Prose>

<IcaDrawing id="D31" />

<Prose>{"All four development correlations are retained for each representation. Raw channels have (.043935,.101807,.201203,.079348), PCA coordinates (−.034740,.127795,.010770,.184580), and ICA coordinates (.079635,.169804,−.043955,−.116516). Selecting the largest absolute correlation gives raw channel 3, PCA coordinate 4 and ICA coordinate 2. All selected development signs are positive. The corresponding later absolute correlations are .119806, .450178 and .343966. PCA is ahead of ICA by .106212 on this diagnostic; ICA is ahead of the selected raw channel by .224160. The ICA fit used 14 iterations. Neither the name ICA nor its iteration count entitles it to win."}</Prose>

<Prose>{"The local candidate controls inspect all retained development coordinates. If you change away from a historical chosen coordinate, its later score is unavailable because it was not retained. The control must say so rather than refit, interpolate or pretend the selected coordinate's later score belongs to the new choice. Reset restores each historical selection and the unchanged historical comparison."}</Prose>

<IcaDrawing id="D32" />

<Prose>{"The displayed 16–18 second traces are four retained min/max envelopes with 500 bins, four samples per bin. Each displayed signal is standardized within that shown interval and polarity is aligned from development. The vertical quantity is therefore an interval display z-score, not raw microvolts or the fitted model's source normalization. Do not place the separate twenty exact rows on that normalized axis. Their table spans samples 16000–16019, seconds 16.000–16.019; reference and selected raw channel are in microvolts, PCA and ICA coordinates in arbitrary fitted units. Its first row is reference −25.650, channel 4.150, PCA 1.751, ICA −2.001. Rounded retained values are the available evidence, not newly reconstructed original scores."}</Prose>

<Prose>{"The full original programs follow, with their preserved streams. The short by-hand implementation is useful for tracing an exact designed distribution; it lacks the general guard/state contract of the new scratch class. The recording program documents its historical fit and split. Their streams are retained historical output, and these mains were not executed again here."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/ica_by_hand.py"}>{"ica_by_hand.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="ica_by_hand.py" source="/learn-code/independent-component-analysis-ica/ica_by_hand.py" language="python" />

<CodeBlock kind="output" language="output" filename="ica_by_hand.historical.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/ica_by_hand.historical.stdout.txt">{"[[1. 0.]\n [0. 1.]]\n[1. 1.]\nTrue"}</CodeBlock>

<RemoteCodeBlock filename="ica_recording.py" source="/learn-code/independent-component-analysis-ica/ica_recording.py" language="python" />

<CodeBlock kind="output" language="output" filename="ica_recording.historical.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/ica_recording.historical.stdout.txt">{"channel 3 0.201203 0.119806\nPCA 4 0.184580 0.450178\nICA 2 0.169804 0.343966\nICA iterations 14"}</CodeBlock>

<Prose>{"The reader route needs only Python's standard library. It loads the literal retained JSON, verifies the CSV SHA, parses every CSV row and all retained numerical values for finiteness, checks min≤max in all envelope bins, prints the twenty-row window and preserves the provenance. It deliberately imports no model and has no fitting call. The sibling CSV, provenance and JSON are part of the usable bundle. The reader’s "}<code>{"None"}</code>{" fields mark unavailable later-coordinate scores and fitted operator arrays; they are not zeros. The scale labels name interval display z-scores and development-aligned polarity. The limit count refers to the four qualifications below, which remain fully recorded in the JSON."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/read_retained_recording.py"}>{"read_retained_recording.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="read_retained_recording.py" source="/learn-code/independent-component-analysis-ica/read_retained_recording.py" language="python" />

<Prose>{""}<a href={"/learn-code/independent-component-analysis-ica/outputs/read_retained_recording.stdout.txt"}>{"Original executed stream"}</a>{" remains the historical evidence. Only the declared output-presentation substitutions have been applied. "}</Prose>

<CodeBlock kind="output" language="output" filename="read_retained_recording.projected.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/read_retained_recording.projected.stdout.txt">{"headers ['direct_adc', 'abdomen1_adc', 'abdomen2_adc', 'abdomen3_adc', 'abdomen4_adc'] rows 20000 sampling_Hz 1000 split {'train': [0, 12000], 'development': [12000, 16000], 'test': [16000, 20000]}\nsample 0 five_counts [287.0, -89.0, 133.0, 220.0, 325.0] microvolts [28.750439, -8.850135, 13.350204, 22.050336, 32.550497]\nsample 16000 five_counts [-257.0, 77.0, -272.0, 41.0, -55.0] microvolts [-25.650391, 7.750118, -27.150414, 4.150063, -5.450083]\nretained channel all_development_signed [0.043935, 0.101807, 0.201203, 0.079348] chosen_one_based 3 test_signed 0.119806\nother_later_coordinates None\nretained PCA all_development_signed [-0.03474, 0.127795, 0.01077, 0.18458] chosen_one_based 4 test_signed 0.450178\nother_later_coordinates None\nretained ICA all_development_signed [0.079635, 0.169804, -0.043955, -0.116516] chosen_one_based 2 test_signed 0.343966\nother_later_coordinates None\ntrace channel columns 500 first_min_max [0.4116, 0.7433]\ntrace PCA columns 500 first_min_max [0.2753, 0.7022]\ntrace ICA columns 500 first_min_max [-1.08, -0.8028]\ntrace reference columns 500 first_min_max [-1.3508, -1.0672]\nexact_window [{'sample': 16000, 'second': 16.0, 'reference': -25.65, 'channel': 4.15, 'PCA': 1.751, 'ICA': -2.001}, {'sample': 16001, 'second': 16.001, 'reference': -28.25, 'channel': 3.25, 'PCA': 1.188, 'ICA': -2.233}, {'sample': 16002, 'second': 16.002, 'reference': -32.65, 'channel': 2.55, 'PCA': 0.607, 'ICA': -2.459}, {'sample': 16003, 'second': 16.003, 'reference': -36.251, 'channel': 2.15, 'PCA': -0.002, 'ICA': -2.706}, {'sample': 16004, 'second': 16.004, 'reference': -36.951, 'channel': 2.25, 'PCA': -0.326, 'ICA': -2.843}, {'sample': 16005, 'second': 16.005, 'reference': -34.451, 'channel': 2.75, 'PCA': -0.322, 'ICA': -2.847}, {'sample': 16006, 'second': 16.006, 'reference': -30.45, 'channel': 3.25, 'PCA': -0.317, 'ICA': -2.852}, {'sample': 16007, 'second': 16.007, 'reference': -27.35, 'channel': 3.65, 'PCA': -0.375, 'ICA': -2.876}, {'sample': 16008, 'second': 16.008, 'reference': -26.85, 'channel': 3.65, 'PCA': -0.628, 'ICA': -2.977}, {'sample': 16009, 'second': 16.009, 'reference': -29.15, 'channel': 3.25, 'PCA': -1.092, 'ICA': -3.163}, {'sample': 16010, 'second': 16.01, 'reference': -32.75, 'channel': 2.65, 'PCA': -1.653, 'ICA': -3.391}, {'sample': 16011, 'second': 16.011, 'reference': -35.751, 'channel': 2.15, 'PCA': -1.96, 'ICA': -3.504}, {'sample': 16012, 'second': 16.012, 'reference': -36.951, 'channel': 1.95, 'PCA': -1.946, 'ICA': -3.488}, {'sample': 16013, 'second': 16.013, 'reference': -36.251, 'channel': 2.05, 'PCA': -1.673, 'ICA': -3.354}, {'sample': 16014, 'second': 16.014, 'reference': -34.551, 'channel': 2.35, 'PCA': -1.16, 'ICA': -3.135}, {'sample': 16015, 'second': 16.015, 'reference': -32.75, 'channel': 2.65, 'PCA': -0.55, 'ICA': -2.881}, {'sample': 16016, 'second': 16.016, 'reference': -31.25, 'channel': 2.75, 'PCA': 0.014, 'ICA': -2.664}, {'sample': 16017, 'second': 16.017, 'reference': -30.25, 'channel': 2.45, 'PCA': 0.321, 'ICA': -2.558}, {'sample': 16018, 'second': 16.018, 'reference': -29.35, 'channel': 1.95, 'PCA': 0.51, 'ICA': -2.511}, {'sample': 16019, 'second': 16.019, 'reference': -28.65, 'channel': 1.25, 'PCA': 0.504, 'ICA': -2.563}]\nenvelope_scale interval_z_score polarity development_aligned\nfitted_operator_arrays None\nretained_limit_count 4"}</CodeBlock>

<Prose>{"This is absolute Pearson correlation to a directly recorded waveform over one four-second later interval from one recording. It is not a fetal-beat detector, clinical accuracy, a count of independent physiological sources, or validation on a new person. The provider filtered the recording offline, so this extract cannot establish a real-time pipeline. Autocorrelated time samples do not become 20,000 independent subjects. Preserve the ODC-By attribution and the recorded source/extract identities when reusing the data."}</Prose>

<H2>{"10. Remove a contribution, not a label"}</H2>

<IcaDrawing id="D33" />

<Prose>{"An unmixing row b_jᵀ reads component j from channels. A decoder column a_j spreads that component back across channels. They are different shapes and different operations. For query source table S_hat, the contribution of j is S_hat[:,j] a_jᵀ, a query-by-channel table. Sum all pieces and add the fitted mean once to reconstruct. Removing j sets its source score to zero and subtracts its whole channel pattern, not one observed channel."}</Prose>

<IcaDrawing id="D34" />

<Prose>{"For A=[[3,1],[1,1]] and s=(3,−4), the pieces are 3(3,1)=(9,3) and −4(1,1)=(−4,−4). Their sum is x=(5,−1). Removing the first leaves (−4,−4). Scaling that source by −2 and dividing its column by −2 preserves both its contribution and the removed result. Because pieces can cancel, squared contribution norms are not additive percentages of instantaneous observation energy: ||c₁+c₂||² includes 2c₁ᵀc₂. A decomposition of variance across uncorrelated random coordinates needs its own averaging and normalization contract; it is not supplied by this single sample."}</Prose>

<IcaDrawing id="D35" />

<Prose>{"Suppose a putative nuisance score is b′=b+εq, where q is a desired signal. Removing b′ with column (2,−1) also removes (2εq,−εq). The cleaned observation has error (−2εq,+εq) relative to removing only b. At the control's default ε=.2, q=2 and b=−3, the extra removed vector is (.8,−.4), and the cleaned error is (−.8,.4). At ε=0 the desired-signal loss disappears while the nuisance-only subtraction still occurs. The leakage control changes this constructed error and its arrows continuously; it is not an estimate of known physiological leakage in r01. Before calling a component an artifact, inspect its waveform, channel pattern, temporal context and the loss imposed on the desired task."}</Prose>

<IcaDrawing id="D36" />

<Prose>{"Retained-rank reconstruction has a residual policy. If two retained directions describe the first two axes of a three-channel query (1,2,3), a plain two-coordinate inverse reconstructs (1,2,0). An interface may instead restore the omitted residual (0,0,3), giving (1,2,3) before exclusion. Those are different declared operations. In "}<a href={"https://mne.tools/stable/generated/mne.preprocessing.ICA.html"}>{"MNE's ICA apply interface"}</a>{", ICA count and PCA reconstruction count are separate; the default reconstruction can restore PCA components not passed to ICA. A reduced count changes that policy. The drawing shows both paths and what an excluded ICA coordinate actually removes."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/component_contributions.py"}>{"component_contributions.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="component_contributions.py" source="/learn-code/independent-component-analysis-ica/component_contributions.py" language="python" />

<CodeBlock kind="output" language="output" filename="component_contributions.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/component_contributions.stdout.txt">{"manual_contributions [[ 9. -4.]\n [ 3. -4.]] sum [ 5. -1.] remove_first [-4. -4.]\ncompensated_first [9. 3.]\nunwanted_removed [ 0.8 -0.4] clean_error [-0.8  0.4] mixed_component -2.6\nlearned_shape_q_d_k (3, 2, 2) sum_plus_mean_equal_inverse True\nlibrary_converged True warnings []\nordinary_same_fit_inverse True\nremove_first [[ 4.51000622 -2.32367127]\n [ 3.85777167 -2.1726866 ]\n [ 2.32854246 -1.81868792]]\nretained_projection [[1. 2. 0.]] residual [[-4.4408921e-16  0.0000000e+00  3.0000000e+00]] restore_residual_policy [[1. 2. 3.]]\nrefused Removal indices must be unique valid component integers"}</CodeBlock>

<Prose>{"The new program verifies each learned fit's own contribution sum against its own inverse; it does not compare unaligned scratch/library component labels. Removal uses the same stored mean/operator. Its reduced-rank witness explicitly prints the omitted residual and the alternative restoration policy."}</Prose>

<Prose>{"The optional MNE route constructs three electroencephalography (EEG) channels in volts from 7,13,19 Hz sinusoids with amplitudes 10,20,5 microvolts. "}<code>{"RawArray"}</code>{" uses channel-by-time storage, unlike our row tables. Its standard montage maps the channel names to sensor positions, and its 1 Hz high-pass filter attenuates slow changes in a copied fitting signal. It fits two ICA coordinates, obtains sources and opens waveform/property views for inspection. Excluding coordinate zero is a declared constructed operation, not a claimed blink diagnosis. Separate copies compare default residual restoration and reconstruction using only two PCA coordinates. The current 1.13.2 API accepts "}<code>{"rng=7"}</code>{"; it differs from a legacy random-state stream. MNE first scales by channel type when no noise covariance is supplied, then fits PCA and passes the chosen count to ICA. A supplied noise covariance changes that prewhitening policy; it is not simply scikit-learn's "}<code>{"whitening_"}</code>{" attribute. High-pass filtering here is explicitly a copied fitting operation: application uses the original copied raw signal. This continuous Raw example has no epoch baseline correction. For epoched workflows, baseline correction subtracts a channel average over a declared reference interval. Decide and document its timing with the current MNE guidance because ICA application can change that baseline. These choices do not certify real-world artifact labels. This route has no claimed author stdout or paint because its optional environment was unavailable."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/mne_contribution_route.py"}>{"mne_contribution_route.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="mne_contribution_route.py" source="/learn-code/independent-component-analysis-ica/mne_contribution_route.py" language="python" />

<H2>{"11. Connect independence, density and curvature without confusing them"}</H2>

<Prose>{""}<strong>{"Deeper branch."}</strong>{" Return here after the fitted-operator route to connect its contrasts with information, density and optimization."}</Prose>

<IcaDrawing id="D37" />

<Prose>{"For an event of probability p, −log p measures surprise in nats. Its probability-weighted average H=−Σp log p is entropy. For a finite joint law, I(V)=Σ_j H(V_j)−H(V) compares the sum of marginal uncertainty with joint uncertainty. Our dependent tables lose uncertainty when the other coordinate is known, so this difference is positive. The joint object is still the whole vector V; summing only pairwise dependencies does not characterize every higher-dimensional joint law."}</Prose>

<Prose>{"Continuous density requires a different entropy definition h(V)=−∫p(v)log p(v)dv. When the relevant integrals are finite, the corresponding mutual-information identity uses differential entropies. Differential entropy can be negative and changes under coordinate scaling; it is not the finite-table entropy just relabeled. A singular distribution on a lower-dimensional plane does not automatically have an ordinary full-dimensional density or finite h in the ambient space."}</Prose>

<Prose>{"Negentropy compares a continuous coordinate with a Gaussian having the same variance: J(V_j)=h(Gaussian_j)−h(V_j). Under the needed finite entropy and variance conditions, the Gaussian maximizes entropy at that variance, so J is nonnegative. In a white orthogonal frame every scalar variance is one and the joint entropy is unchanged because |det Q|=1. Thus minimizing total correlation Σ_j h(V_j)−h(V) is equivalent to maximizing the sum of scalar negentropies: the Gaussian terms and joint entropy are constants. Practical fourth-order or chosen nonlinear contrasts approximate aspects of this non-Gaussian shape; they are not exact mutual-information estimates and can have the blind spots in section 5. Our discrete four-state law uses finite-table entropy, not an ordinary continuous differential entropy."}</Prose>

<Prose>{"Entropy has introduced probability and density as different objects. Now follow a small area through a linear map: preserving its probability mass explains the density factor in a likelihood."}</Prose>

<IcaDrawing id="D38" />

<Prose>{" In a source-to-observation demonstration, A_demo=diag(2,1) doubles a unit-square area to 2, so a uniform source density 1 becomes observation density 1/2. In a separate observation-to-source demonstration, B_demo=diag(2,1) maps an observation rectangle of area 1/2 into that unit square. The observation density must then be 2. These are distinct map directions; using the same name for both would invert the density factor."}</Prose>

<Prose>{"For centered observations x and a square nonsingular unmixing B, independent chosen source densities f_j yield"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 8; scroll horizontally when needed"><MathBlock>{"p_X(x)=|\\det B|\\prod_j f_j((Bx)_j)."}</MathBlock></div>

<Prose>{"For n independent observation rows, the joint likelihood multiplies all row densities. Its log is n log|det B|+Σ_iΣ_j log f_j((Bx_i)_j). The negative average is −log|det B|−(1/n)Σ_iΣ_j log f_j. Averaging only the source-density term but keeping n logdet is a different and incorrect normalization. Independent source coordinates at one time and independent rows over time are different assumptions; autocorrelated recording rows do not justify the iid likelihood automatically. A rectangular raw retained operator has no determinant of this kind; density must instead be formulated in its retained coordinates with the relevant measure."}</Prose>

<Prose>{"The demonstration chooses a unit-variance logistic source model, with scale a=√3/π and log density −log a−log(1+e^(y/a))−log(1+e^(−y/a)). "}<code>{"logaddexp"}</code>{" computes these logs stably. This is one chosen model, not a universal ICA density or a claim that the binary source law has a logistic density. Maximizing a likelihood and identifying the physical generator require compatible model assumptions."}</Prose>

<Prose>{"Infomax gives a related view of this same chosen-density mechanism. After y=Bx, apply each model cumulative distribution F_j(y)=P(source_j≤y) to form u_j=F_j(y_j), with derivative F′_j(y_j)=f_j(y_j). The full transform Jacobian has absolute determinant |det B| times the product of these derivatives. For an invertible smooth continuous transformation with finite entropies, output entropy equals input entropy plus the expected log absolute Jacobian. Maximizing that output entropy therefore uses the same logdet and log-density terms, while input entropy is fixed. If the model fits, independent uniform outputs fill the unit cube; choosing arbitrary nonlinearities does not guarantee that match. The logistic cumulative function is the concrete sigmoid F(y)=1/(1+exp(−y/a)); its derivative is the chosen logistic density. This relates objectives without claiming a complete Infomax optimizer in N10."}</Prose>

<IcaDrawing id="D39" />

<Prose>{"A gradient collects directional first derivatives and points toward fastest local increase under the chosen Euclidean norm. A Hessian collects second derivatives and describes local curvature. Curvature changes an optimization step. For F(v)=vᵀHv/2, H=[[2,1],[1,3]], v=(1,−1), gradient Hv=(1,−2). The raw negative gradient is (−1,2); solving H d=−gradient gives d=(−1,1). F starts at 1.5, becomes .375 at v+.5d and zero at v+d. The ellipse and both arrows display these actual vectors, not an abstract speed icon."}</Prose>

<Prose>{"If approximate curvature is H=[[.5,1],[1,.5]], its minimum eigenvalue is −.5. To require floor .1, add .6I; the new eigenvalues are .1 and 2.1. For gradient (1,−1), the direction is (−10,10). A positive curvature approximation makes a descent direction locally; a line search must still choose a suitable step length for the actual objective."}</Prose>

<Prose>{"Picard describes a small relative operator change as B_new=(I+E)B. It changes the current source coordinates directly. Define ψ_i(y)=−d log f_i(y)/dy for the chosen source density. For the unit-variance logistic example, ψ(y)=tanh(y/(2a))/a. The relative negative-likelihood gradient is G_ij=mean[ψ_i(y_i)y_j]−δ_ij, where δ_ij is 1 on the diagonal and 0 elsewhere. For coupled off-diagonal entries E_ij,E_ji with i≠j, one inexpensive curvature approximation retains a block [[h_ij,1],[1,h_ji]], with h_ij=mean[ψ′_i(y_i)y_j²]. A further approximation replaces this by mean[ψ′_i(y_i)]mean[y_j²]. These factorizations are justified asymptotically near independent coordinates, not exact on arbitrary dependent finite data. The supplied .5/.5 block above illustrates the same positive-spectrum shift, without claiming those entries were fitted."}</Prose>

<Prose>{"Picard uses the regularized blocks as preconditioners and adds limited-memory Broyden–Fletcher–Goldfarb–Shanno (L-BFGS) corrections from recent displacements and gradient changes, then selects a step by line search. These mechanisms improve optimization of the chosen likelihood; they do not replace identification assumptions. In an ordinary optional MNE route, changing the constructor to "}<code>{"ICA(n_components=2, method=\"picard\", max_iter=1000, rng=7)"}</code>{" selects its external Picard backend and additionally requires the separate "}<code>{"python-picard"}</code>{" dependency. Preserve the rest of the declared fitting, inspection and reconstruction pipeline and reconcile the installed backend/API before running; no optional output is supplied here."}</Prose>

<Prose>{"The solver cycle estimates the relative gradient and inexpensive local curvature blocks from the current transformed samples; regularizes those blocks to positive curvature; uses their inverse as the initial scaling in the limited-memory quasi-Newton direction; tests a step against the actual chosen likelihood by line search; then updates the retained correction history from the accepted displacement and gradient change. Memory corrections improve the approximate local curvature model without replacing the likelihood or the line search. The small quadratic here teaches preconditioning and shifting only. It does not implement the full Picard solver, reproduce a benchmark or claim measured speed superiority."}</Prose>

<IcaDrawing id="D40" />

<Prose>{"Robustness belongs to the whole pipeline. Add row (100,0) to the four channel states. The mean becomes (20,0), centered outer products sum to [[8020,16],[16,20]], and population covariance is [[1604,3.2],[3.2,4]]. That large covariance distortion occurs before a later bounded tanh nonlinearity. Even bounded g leaves z g(wᵀz) multiplied by z. An influence bound for one stage under specified distributions is not an automatic robust-whitening or whole-estimator guarantee. High moments require their own existence assumptions; cubic updates can be particularly sensitive to large projections."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/objective_mechanisms.py"}>{"objective_mechanisms.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="objective_mechanisms.py" source="/learn-code/independent-component-analysis-ica/objective_mechanisms.py" language="python" />

<Prose>{"The main streams retain the original instructional source bundle; a later probability-function numerical guard is checked separately in section 3. Its stable log differences can change the final floating-point digit of the objective example's mutual-information value, so that example retains its original dependency attribution."}</Prose>

<Prose>{""}<a href={"/learn-code/independent-component-analysis-ica/outputs/objective_mechanisms.stdout.txt"}>{"Original executed stream"}</a>{" remains the historical evidence. Its mutual-information value retains the original dependency/final-digit attribution; the stable-log N2 successor is checked in section 3. "}</Prose>

<CodeBlock kind="output" language="output" filename="objective_mechanisms.projected.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/objective_mechanisms.projected.stdout.txt">{"dependent_finite_MI_nats 0.6365141682948128\nJacobian_density_demo A_source_to_observation source_area 1.0 source_density 1.0 observation_area 2.0 observation_density 0.5 mass 1.0\nJacobian_density_demo B_observation_to_source source_area 1.0 source_density 1.0 observation_area 0.5 observation_density 2.0 mass 1.0\nchosen_logistic_likelihood {'log_absolute_determinant': 0.6931471805599453, 'row_log_density': array([-1.09052644, -5.47613409]), 'dataset_log_likelihood': -6.5666605341408495, 'negative_row_average': 3.2833302670704247}\nquadratic_gradient [ 1. -2.] raw_negative_gradient [-1.  2.] preconditioned [-1.  1.] F_start 1.5 F_half 0.375 F_full 0.0\nindefinite_shift (array([-10.,  10.]), np.float64(0.6), array([0.1, 2.1]))\noutlier_mean [20.  0.] sum_outer [[8020.   16.]\n [  16.   20.]] population_covariance [[1604.     3.2]\n [   3.2    4. ]]\nrefused The Jacobian route needs a square unmixing operator"}</CodeBlock>

<Prose>{"The program keeps the finite mutual information, square logistic likelihood, quadratic preconditioner and exact corrected outlier moments separate. Its two Jacobian rows calculate observation area, density and preserved mass from the unit source square and the determinant in each map direction. Its rectangular-likelihood refusal prevents attaching a nonexistent determinant to a reduced raw-channel map."}</Prose>

<H2>{"12. Change the information or the mixing model deliberately"}</H2>

<Prose>{""}<strong>{"Deeper branch."}</strong>{" Keep the linear instantaneous model in view while changing one source of information or one mixing assumption at a time."}</Prose>

<Prose>{"The instantaneous Gaussian picture had no preferred axes. A process also relates one instant to another; unequal lag covariances can supply information that the same-time amplitudes lacked."}</Prose>

<IcaDrawing id="D41" />

<Prose>{" Two independent stationary Gaussian AR(1) processes can have lag-one source covariances diag(.8,.2) and lag-two diag(.64,.04) even though both instantaneous variances are one. Here AR(1) means s_t=a s_(t−1)+ε_t, with independent Gaussian innovations of variance 1−a². Mixing their already-white coordinates by 45° gives lag matrices [[.5,.3],[.3,.5]] and [[.34,.30],[.30,.34]]. Their eigenvectors recover the temporal axes. Equal lag-one values .4,.4 give .4I and no preferred axis from that lag. If another lag also ties, adding it does not create information."}</Prose>

<Prose>{"The local lag control holds the first source's lag-one covariance at .8 and varies the second between 0 and .8. At the equality endpoint it shows an unresolved eigenspace, not source-colored arbitrary eigenvectors. The static two-lag AR example remains its separately declared .8/.2 process. The single-lag separation method called AMUSE uses whitening followed by an eigendecomposition of the symmetrized lag covariance. Second-order blind identification (SOBI) combines several lag matrices to seek joint diagonalization. For our analytic two-source case, the visible equal-weight objective Σ_lΣ_(i≠j)[R(θ)ᵀC_lR(θ)]_ij² is .36 at 0°, .09 at 30° and zero at 45°. That angle curve is a mechanism illustration, not a claimed general SOBI optimizer."}</Prose>

<IcaDrawing id="D42" />

<Prose>{"Apply the same linear temporal filter F to all channels, with the same time alignment. Since A is constant, F(As)=A F(s). The two-point filter F(s)_t=(s_t+s_(t−1))/2 commutes with mixing when every stream trims the same first sample. Identical preprocessing can therefore preserve this instantaneous mixing equation; the filtered source distributions and temporal properties may still change."}</Prose>

<Prose>{"Now let x₁[t]=s₁[t]+.5s₂[t−δ] and x₂[t]=s₂[t]−.25s₁[t−2]. These branches use delays, so one instant is generally not x[t]=A s[t]. With s₁ impulse at 0 and s₂ impulse at 1, δ=1 gives x₁ mass 1 at 0 and .5 at 2, and x₂ mass 1 at 1 and −.25 at 2. Changing δ to zero makes the first cross-branch instantaneous, but the second channel's two-step delay persists. The single delay control changes only its labeled branch. Audio separation methods that model convolution or learned context own a broader model than this instantaneous FastICA lesson."}</Prose>

<IcaDrawing id="D43" />

<Prose>{"Three further failures change different assumptions. Measurement noise e=(.2,−.1) added to canonical x=(1,−1) gives (1.2,−1.1); the known inverse propagates error to (1/6,−2/15), not to zero. With two channels and three sources A=[[1,0,1],[0,1,1]], sources (1,1,0) and (0,0,1) both give (1,1); the null vector (−1,−1,1) explains this underdetermination. Finally, changing the symmetric cross-weight from 1 to 1.5 changes A while the source remains (1,−1); the old inverse returns (1/2,−1/2), not the current source. Denoising assumptions, additional constraints for underdetermination, and adaptation to changing operators are separate remedies, not one selector labeled “advanced ICA.”"}</Prose>

<IcaDrawing id="D44" />

<Prose>{"Nonlinear invertibility alone is insufficient. For independent uniform coordinates on a torus, v₁=u₁, v₂=(u₂+u₁) mod 1 maps (.2,.3) to (.2,.5). The map is invertible almost everywhere and preserves a uniform independent joint law, yet mixes coordinates. Its wrap is discontinuous in the Euclidean unit-square representation; it is not a smooth global Euclidean counterexample proof. It nevertheless shows why an unconstrained invertible decoder is not automatically a unique source coordinate system."}</Prose>

<Prose>{"Auxiliary information can change the question. Let a record environment or time segment, and suppose sources are conditionally independent given a with Gaussian means and variances depending on it. A conditional Gaussian's natural coefficients for statistics (s,s²) are (μ/v,−1/(2v)). For two sources concatenate four coefficients. Baseline a₀ has both means 0 and variances 1: (0,−.5,0,−.5). Four environments respectively set mean 1 of source 1, mean 1 of source 2, variance .5 of source 1, and variance .5 of source 2. Their difference rows are (1,0,0,0),(0,0,1,0),(0,−.5,0,0),(0,0,0,−.5), a rank-four matrix. The diagram shows which conditional distribution supplies each changed coefficient."}</Prose>

<Prose>{"Such sufficient variation is part of identifiable nonlinear-ICA results, together with the specified conditional exponential-family model, regularity, representation/objective and theorem-specific equivalence class. It does not prove that any auxiliary label or arbitrary neural encoder recovers exact physical sources. Read the actual theorem's conditions before transferring the result. We have inspected selected model/theorem material, not its entire supplemental proof."}</Prose>

<Prose>{"The complete temporal program distinguishes analytic population matrices from a new empirical single-lag route. Seeds 31 and 37 generate two AR sequences with 1,000 burn-in rows and 4,000 retained rows. Whitening and lag covariance use only the first 2,400 observations; lag products divide by the number of paired training rows and use one training mean. A separated spectrum permits an eigenspace estimate; a relative near-tie reports unresolved. Calibration alignment uses the next 800 known source rows and held-out evaluation the final 800. It also prints exact common-filter and impulse-delay witnesses and the rank-four auxiliary coefficient table."}</Prose>

<Prose>{""}<strong>{"Complete program: "}<a href={"/learn-code/independent-component-analysis-ica/temporal_mixing.py"}>{"temporal_mixing.py"}</a>{""}</strong>{""}</Prose>

<RemoteCodeBlock filename="temporal_mixing.py" source="/learn-code/independent-component-analysis-ica/temporal_mixing.py" language="python" />

<CodeBlock kind="output" language="output" filename="temporal_mixing.stdout.txt" downloadUrl="/learn-code/independent-component-analysis-ica/outputs/temporal_mixing.stdout.txt">{"analytic_mixed_lags [array([[0.5, 0.3],\n       [0.3, 0.5]]), array([[0.34, 0.3 ],\n       [0.3 , 0.34]])] tie [[0.4 0. ]\n [0.  0.4]]\ntwo_lag_equal_weight_objective [(0.0, 0.3599999999999999), (30.0, 0.09000000000000008), (45.0, 6.431156501279712e-34), (60.0, 0.08999999999999993), (90.0, 0.3599999999999999)]\nempirical_training_lag [[1.90249435e-01 4.83248993e-04]\n [4.83248993e-04 8.08176484e-01]] eigenvalues [0.19024906 0.80817686] gap 0.6179278045385984\nsingle_lag_calibration_columns (1, 0) test {'signed_correlation': [0.9999739710780673, 0.9999992926724759], 'mse_source_units_squared': [5.3298754013026174e-05, 1.4613004126279084e-06]}\ncommon_filter_commutes True\ndelay_x1_only 1 x1 [1.  0.  0.5 0.  0.  0. ] x2_persistent_delay_two [ 0.    1.   -0.25  0.    0.    0.  ]\ndelay_x1_only 0 x1 [1.  0.5 0.  0.  0.  0. ] x2_persistent_delay_two [ 0.    1.   -0.25  0.    0.    0.  ]\ndelay_x1_only 2 x1 [1.  0.  0.  0.5 0.  0. ] x2_persistent_delay_two [ 0.    1.   -0.25  0.    0.    0.  ]\nunderdetermined_equal_observations [1. 1.] [1. 1.]\nauxiliary_natural_parameter_differences [[ 1.   0.   0.   0. ]\n [ 0.   0.   1.   0. ]\n [ 0.  -0.5  0.   0. ]\n [ 0.   0.   0.  -0.5]] rank 4"}</CodeBlock>

<Prose>{"The empirical lag eigenvalues were approximately .190249 and .808177, not exactly .2 and .8. Its held-out signed correlations were about .999974 and .999999 after the unchanged calibration mapping. Those actual finite outcomes belong to this declared new temporal example. They do not override the Gaussian instantaneous nonidentification result, because lag information is additional information."}</Prose>

<H2>{"13. Transfer the mechanism, solve it, and choose what to learn next"}</H2>

<IcaDrawing id="D45" />

<Prose>{"Follow the object once more: simultaneous source amplitudes → signed mixing columns → observed rows → stored mean → positive-rank whitening → still-unidentified white frame → contrast updates and orthogonal rows → raw unmixing and decoder → calibration-only naming → held-out task evidence → whole contribution removal. Every arrow has an operation and a domain. A zero direction, rank loss, tied assignment or missing saved score interrupts the affected claim; it does not disappear behind a plausible picture."}</Prose>

<Prose>{"Nonnegative matrix factorization (NMF), the "}<a href={"/learn/path/full-curriculum/non-negative-matrix-factorization-nmf?module=classical-ml"}>{"next lesson"}</a>{", instead constrains activations and components to be nonnegative. For X=[[2,1,3],[1,2,3],[3,3,6]], both W₁=[[2,1],[1,2],[3,3]], H₁=[[1,0,1],[0,1,1]] and W₂=[[1.5,.5],[.5,1.5],[2,2]], H₂=[[1.25,.25,1.5],[.25,1.25,1.5]] multiply to X. H₂ rows mix H₁ rows beyond sign, scale or permutation. Nonnegative addition is guaranteed by that constraint; recognizable parts, independence, uniqueness and physical identity are not automatic. This bridge contrasts model meanings; it does not teach a complete NMF optimizer here."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Solve the mechanism"}</H3>

<Prose>{"Try each problem before opening its solution. Each solution includes the intermediate operation, not only a final number. A useful answer states the frame, units and validity conditions as well as the result."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Solve and compensate a known mixture"}</H3>

<Prose>{"For A=[[3,1],[1,1]] and x=(5,−1), recover the sources. Double source 1 and compensate its mixing column. What remains if its contribution is removed?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Subtract the second channel equation from the first before solving for source 2."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"The equations are 3s₁+s₂=5 and s₁+s₂=−1, so 2s₁=6, s₁=3 and s₂=−4. Source 1's contribution is 3(3,1)=(9,3); source 2's is −4(1,1)=(−4,−4). Their sum is (5,−1). Doubling the first score to 6 requires halving its column to (1.5,.5), preserving (9,3). Removing the first contribution leaves (−4,−4)."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Zeroing channel 1 is not component removal. Your answer succeeds if it exhibits both contributions and changes score and column together."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Evaluate a Laplace projection"}</H3>

<Prose>{"Two independent unit-variance Laplace sources are projected along w=(√3/2,1/2). Find its variance and excess kurtosis, then compare with a source-axis projection."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use a²+b²=1 and κ=3(a⁴+b⁴), with the frame explicitly identified as source coordinates."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Variance is 3/4+1/4=1. The fourth-power sum is 9/16+1/16=10/16, so κ=30/16=1.875. A source axis has κ=3. Equal variance does not make the projected shapes equal; the mixture's kurtosis is lower. Both are positive because this is the Laplace example, not the negative-kurtosis binary example."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Comparing unsigned kurtosis without the source law can obscure the objective. State the distribution, frame, unit-variance constraint and fourth-power calculation."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Diagnose a zero update"}</H3>

<Prose>{"For white Z, use g(y)=y in the one-unit update. What is r? Why must deflation occur inside each update rather than only at initialization?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Substitute E[zzᵀ]=I and g′=1."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"E[z(wᵀz)]=E[zzᵀ]w=w, so r=w−w=0. Its normalization is undefined; report refusal and preserve valid state. Initial deflation only makes the starting vector orthogonal. A subsequent nonlinear update need not preserve that property, so subtract projections onto all previously retained rows on every step before normalization. The linear zero remains zero after that subtraction."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Returning the old vector as a supposed successful update conceals the failed mechanism. Derive r=0, name the invalid denominator and state the repeated orthogonality operation."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Freeze a development selection"}</H3>

<Prose>{"Three candidate development correlations are (−.6,.45,.2); their later signed correlations are (.15,−.8,.3). Which candidate and polarity should be chosen from development? What is its later diagnostic?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Maximize development absolute correlation only, then retain the resulting index and sign."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Choose candidate 1 because .6 is largest and choose display sign −1. Its later raw signed correlation is .15; applying the frozen display sign gives −.15. Its later absolute diagnostic is .15. Choosing candidate 2 using its later −.8 would leak evaluation data into selection, changing the experiment rather than improving this result."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" A polarity chosen anew on later truth is another form of leakage. Give the chosen index, frozen sign, raw later value, sign-aligned later value and absolute value separately."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Quantify unintended removal"}</H3>

<Prose>{"A removed coordinate is b′=b+.2q and its decoder column is (2,−1). Compute the undesired removed contribution and cleaned error relative to removing only b."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Expand b′ times the entire column before subtraction."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"The removed channel vector is b(2,−1)+.2q(2,−1). The extra removal is (.4q,−.2q). Therefore cleaned−ideal-cleaned=−(.4q,−.2q)=(−.4q,.2q). For q=2 the undesired removal is (.8,−.4) and the clean error (−.8,.4). An apparently strong nuisance score can remove a desired signal mixed into it."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Reporting only .2q ignores its channel pattern and sign. Show both coordinates and distinguish removal from remaining error."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Design a valid follow-up study"}</H3>

<Prose>{"The r01 extract has 20,000 time samples from one recording. Design a follow-up claim about generalization to new people. Where do fitting, candidate selection and reference evaluation occur?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The sampling unit for a new-person claim is a person, not one millisecond."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Partition by people or sessions according to the intended claim; keep each evaluation person's observations out of training and development. Learn means, scalers, rank decisions and ICA operators on training data only. Use development people/intervals for hyperparameters and any candidate/reference alignment. Freeze these before evaluating untouched people. Report subject-level variation, task metrics and failure counts, respecting temporal dependence and preprocessing. The direct reference is a diagnostic target, not an input channel to the blind fit. The existing one-record later correlation cannot establish new-person generalization."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Randomly splitting milliseconds can let one recording's dependence cross partitions. State the unit of generalization and the ownership of every learned/selected quantity."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Catch a hidden transpose error"}</H3>

<Prose>{"For A=[[2,3],[1,4]] and source row (1,−1), compute correct channel-row mixing and the erroneous result from multiplying the source row directly by A."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Columns of A are source contribution patterns; row storage needs Aᵀ."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Column-vector mixing gives (2−3,1−4)=(−1,−3). In row form, (1,−1)Aᵀ gives the same row. Direct (1,−1)A gives (2−1,3−4)=(1,−1), which is wrong. Symmetric A in the canonical example would conceal this difference, so the nonsymmetric witness matters."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" A matrix's display orientation is not a storage convention. Name row/column storage and show both products with channel/source indices."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Swap, scale and preserve the observation"}</H3>

<Prose>{"Use task 1's source and A. Swap coordinates, then multiply the first new score by −2. Compute the new scores, new columns and observation."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The first swapped score is −4; its corresponding original column is (1,1)."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Swapped scores are (−4,3). The scale gives (8,3), and the first new column becomes (−.5,−.5). The second column is (3,1). Contributions are 8(−.5,−.5)=(−4,−4) and 3(3,1)=(9,3), summing to (5,−1). In row-matrix form this is S′=SPᵀD, A′=APᵀD⁻¹."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Changing the scale before the declared permutation can attach compensation to the wrong column. State the operation order and verify the unchanged product."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Distinguish singularity from sensitivity"}</H3>

<Prose>{"For A(a)=[[2,a],[a,2]], describe a=2 and a=1.99. How does .01 channel error along the unit contrast direction propagate at 1.99?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use sum/contrast eigenvalues 2+a and 2−a."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"At 2 the contrast eigenvalue is zero, determinant zero and columns coincide. Adding any multiple of (1,−1) to a source leaves the observation unchanged. At 1.99 the eigenvalues are 3.99 and .01, so condition number is 399 and the matrix is invertible but sensitive. Inverting a .01 measurement error along the normalized contrast eigenvector divides by .01, giving source-error magnitude 1 along that same unit direction."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" “Almost singular” is not the exact null state. Give the small denominator, its direction, the condition number and the propagated units."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Show dependence with a cell"}</H3>

<Prose>{"U is uniform on −1,0,1 and V=U². Compute E[U], E[V], covariance, p(U=0,V=0), the marginal product and p(V=0|U=0)."}</Prose>

<details><summary>Hint</summary>

<Prose>{"List the three supported joint pairs first."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"They are (−1,1),(0,0),(1,1), each mass 1/3. E[U]=0, E[V]=2/3 and E[UV]=0, so covariance is zero. The joint zero cell is 1/3, while its marginal product is (1/3)(1/3)=1/9. Conditional V=0 given U=0 is 1, unlike marginal 1/3. The cell violates factorization despite covariance zero."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Zero covariance tests only one moment. Include a joint-versus-product witness or conditional distribution to establish dependence."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Change dependence while preserving moments"}</H3>

<Prose>{"Use p_q=(1−q)p_Up_V+q p_dependent from task 10. For q=.5, find the central joint cell, its product cell, both marginal means and covariance."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Both constituent laws have identical marginals and zero covariance."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"The cell is .5(1/9)+.5(1/3)=2/9. Its product remains 1/9. The means remain 0 and 2/3. E[UV] remains zero, so covariance remains zero. Thus varying q changes joint information without changing these marginals or the covariance. At q=0 all cells factor; at positive q the central cell does not."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Recomputing a marginal from only the central cell loses other mass. Explain why the whole convex table preserves marginals, then show the dependence witness."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Convert the whitening denominator"}</H3>

<Prose>{"Four training rows are sample-whitened using denominator n−1. What population variance do the white readings have? What factor converts them to population-white readings, and does a one-row query change it?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Write sum of squared centered white readings from their sample variance one."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Their squared sum per coordinate is n−1=3. Dividing by n=4 gives population variance 3/4. Multiply readings by √(4/3) so variance multiplies by 4/3 and becomes one. A later query uses the already fitted factor and training mean, independent of its own row count. Its sample variance may be undefined, but its fitted transform is well-defined."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Substituting query n creates a different operator and fails for n=1. State which training quantity remains stored."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"13. Respect a retained subspace"}</H3>

<Prose>{"A centered three-channel training cloud lies in the first two coordinate axes. Can you whiten three positive directions? What is reconstructed from query (1,−1,1) using two retained directions?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Inspect the zero third variance before dividing by standard deviation."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Numerical rank is two. Three-direction positive whitening refuses the zero third eigenvalue. The two-direction transform and inverse reconstruct (1,−1,0), with residual (0,0,1). That residual is not an ICA component found in training. A separate residual-restoration policy can add it back; the plain retained inverse does not."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" An exact reconstruction claim outside the retained plane is false. Name the rank, invalid denominator, projected query and residual."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Find a non-Gaussian law with zero kurtosis"}</H3>

<Prose>{"The values −√3,0,√3 have masses 1/6,2/3,1/6. Compute the second, fourth and sixth moments and compare with a unit Gaussian."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The odd moments vanish by symmetry and the nonzero total mass is 1/3."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"E[y²]=(1/3)3=1, E[y⁴]=(1/3)9=3 and E[y⁶]=(1/3)27=9. Excess kurtosis is 3−3=0. A unit Gaussian has the same second and fourth moments but sixth moment 15 and a continuous density, unlike this discrete law. A fourth-order contrast alone cannot distinguish them."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" κ=0 does not establish Gaussianity. Show a different moment or support structure that distinguishes the laws."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"15. Explain a Gaussian temporal exception"}</H3>

<Prose>{"Why can two independent standard Gaussian amplitudes be instantaneously nonidentifiable, yet two Gaussian processes with unequal lag covariance be temporally separable?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask whether the extra covariance is at the same time or a nonzero lag."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"The instantaneous standard-Gaussian joint density is rotationally invariant; every orthogonal pair has identical independent marginals, so it contains no preferred source axes. Processes can additionally have lag matrices with unequal diagonal source entries. Whitening leaves an orthogonal mixture, and an unequal lag spectrum supplies axes absent from the instantaneous density. Equal source lag entries would retain ambiguity at that lag. The temporal claim adds information and assumptions, so it does not contradict the marginal Gaussian limitation."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" “Gaussian ICA never works” omits temporal models. Identify the additional measured object and its unequal-spectrum condition."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"16. Separate line convergence from source identification"}</H3>

<Prose>{"Compute line movement if w_new=−w_old. For the white binary diamond, compare a white axis and a white 45° line with source-frame 45°."}</Prose>

<details><summary>Hint</summary>

<Prose>{"A projection line has two unit-vector representatives. Keep the two coordinate frames distinct."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"|(−w)ᵀw|=1, so movement 1−1=0, although Euclidean vector distance is 2. A white axis is stationary for the cubic update r=−w but has mixture kurtosis −1. A white diagonal corresponds to a source line with kurtosis −2. In source coordinates, by contrast, a 45° projection is a mixture with kurtosis −1. Small movement alone therefore cannot certify source recovery."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Reusing an angle across frames changes its physical direction. State the frame, contrast and diagnostic for each line."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"17. Deflate a candidate"}</H3>

<Prose>{"Given retained p=(.6,.8) and candidate r=(1,0), find its projection onto p, orthogonal residual, norm and normalized direction. Then use r=p."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The projection is (rᵀp)p."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"rᵀp=.6, projection (.36,.48), residual (.64,−.48), norm √(.4096+.2304)=.8, normalized (.8,−.6). Its dot with p is .48−.48=0. With r=p, projection is p and residual zero. Normalization must refuse that exact parallel case; rounding a near-zero residual into a confident unit direction invents information."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Perpendicularity before normalization is not enough when norm is zero. Show the norm and the explicit zero branch."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"18. Normalize two rows together"}</H3>

<Prose>{"For W=[[1,0],[1,1]], compute WWᵀ and verify the given polar factor [[2,−1],[1,2]]/√5. What changes if the rows are duplicates?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Verify the factor's row inner products and recall the Gram eigenvalues."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"WWᵀ=[[1,1],[1,2]], eigenvalues (3±√5)/2, both positive. The proposed factor has row squared norms (4+1)/5=1 and cross product (2−2)/5=0. The positive square root of the Gram matrix is [[2,1],[1,3]]/√5: squaring it gives [[1,1],[1,2]]. Its inverse is [[3,−1],[−1,2]]/√5. Multiplying that inverse by W gives [[2,−1],[1,2]]/√5, so this is the actual symmetric polar factor, not merely some orthonormal rows. Duplicate rows give a zero Gram eigenvalue, so the inverse square root is undefined. A ridge changes the operation and is not the stated exact polar factor."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Rowwise unit normalization alone leaves overlap. Include cross-product zero and the positive-spectrum requirement."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"19. Compose an externally white fitted model"}</H3>

<Prose>{"For μ=(10,−3), canonical K and W=Q, transform query (11,−4), then reconstruct it. Where does external "}<code>{"FastICA(whiten=False)"}</code>{" act?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Center first, white second, source third; reverse these operations with stored decoders."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Centered query is (1,−1). K gives (0,√2), and Q gives (1,−1). A gives centered channels (1,−1), then μ restores (11,−4). External FastICA's "}<code>{"components_"}</code>{" is W on white coordinates; raw operator is B=WK. Its own inverse returns white readings, so the external decoder and mean must also be applied. It has no internally fitted channel mean in this route."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Applying W directly to raw channels changes dimensions and meaning. Show every intermediate and the single stored mean addition."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"20. Make a one-to-one assignment"}</H3>

<Prose>{"For signed correlation matrix [[.9,.8],[.85,.1]], compare diagonal and swapped assignments. May held-out truth choose sign or scale?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Sum absolute correlations over complete permutations, not rowwise winners."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Diagonal total is .9+.1=1.0; swapped total is .8+.85=1.65, so the global assignment swaps. Independent row maxima would assign the first estimate twice and fail the one-to-one contract. Polarity, least-squares scale and means must be learned from calibration truth and applied unchanged to held-out estimates. Ties need a nonunique flag; no calibration rule can manufacture unique evidence from equal costs."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Test-based alignment can inflate evaluation. Give the valid permutation and specify where each mapping parameter is fitted."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"21. Read the historical comparison honestly"}</H3>

<Prose>{"Later retained absolute correlations are raw .119806, PCA .450178, ICA .343966. Compute PCA−ICA and ICA−raw, and state what these differences establish."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Keep the single-record interval diagnostic's units and selection protocol."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"PCA−ICA=.106212 and ICA−raw=.224160. PCA leads the selected ICA coordinate on this absolute waveform-correlation diagnostic, and ICA leads the selected raw channel. Correlation is dimensionless. These comparisons followed development selection and refer to one four-second later interval. They establish neither clinical accuracy nor universal PCA/ICA superiority, and cannot fill the unretained later scores of other candidates."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Rewriting the outcome to fit the lesson title destroys evidence. Preserve the ordering and scope."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"22. Avoid false energy percentages"}</H3>

<Prose>{"Using contributions c₁=(9,3), c₂=(−4,−4), compute their squared norms, cross term and the observation squared norm. Is ||c₁||²/||x||² a fraction of explained instantaneous energy?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Expand ||c₁+c₂||²."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"||c₁||²=90, ||c₂||²=32, c₁ᵀc₂=−48, so the cross term is −96. Observation x=(5,−1) has squared norm 26=90+32−96. The ratio 90/26 exceeds one, demonstrating cancellation rather than an additive percentage partition. Removing c₁ subtracts its entire (9,3), preserving c₂. Averaged variance attribution requires separately stated uncorrelatedness, denominator and residual assumptions."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" A norm ratio is a number but not automatically a probability-like share. Exhibit the cross term and whole-vector removal."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"23. Put density on the correct side of the map"}</H3>

<Prose>{"Let B=diag(2,1) map an observation rectangle [0,.5]×[0,1] to a uniform unit source square. Find observation area, density, integral and the logdet contribution for n rows."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Probability mass remains one while area changes."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Observation area is .5 and density must be 2 so the integral is 2·.5=1. |det B|=2 is the observation-to-source Jacobian in p_X(x)=|det B|p_S(Bx). Each row contributes log 2, so n independent rows contribute n log 2. In a fully averaged negative log likelihood that becomes −log 2, together with the source-density sum divided by n. A rectangular retained B has no such square determinant."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Confusing B with its inverse swaps 2 and .5. State the map direction and normalize both the density and row objective."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"24. Regularize local curvature deliberately"}</H3>

<Prose>{"For H=[[.5,1],[1,.5]], gradient g=(1,−1) and positive floor .1, find the shift, new eigenvalues and solve direction. Does this identify sources?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The minimum eigenvalue is −.5 and g lies along its contrast eigenvector."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Shift max(0,.1−(−.5))=.6 adds .6I. New eigenvalues are .1 and 2.1. Along g the shifted curvature multiplies by .1, so solving H_shift d=−g gives d=(−10,10). It is a local descent direction; the actual objective and line search determine a usable step. Curvature regularization addresses optimization, not the generative model's identifiability or a component's physical name."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Taking this large direction with arbitrary step can overshoot. Separate curvature, step selection and scientific identification."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"25. Diagnose a tied lag spectrum"}</H3>

<Prose>{"The whitened lag matrix is .4I. What source axes can its eigenvectors identify? When could adding another lag help?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Every orthogonal basis diagonalizes a scalar multiple of I."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"Both eigenvalues are .4, so the eigenspace is the whole plane and that lag supplies no preferred axes. An eigensolver may return axes, but their source naming is unresolved. Another lag helps if its source covariance contains unequal values that discriminate axes under the model; if every useful lag remains a scalar multiple of I, no joint diagonalization identifies a preferred source basis from them."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Arbitrary numerical eigenvectors are not recovered sources. State the tie, the absent information and a concrete unequal-spectrum condition."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"26. Decide which filtering equation still holds"}</H3>

<Prose>{"Show why the identical two-tap filter F(s)_t=(s_t+s_(t−1))/2 commutes with fixed instantaneous mixing. Then delay only channel 1 of the canonical A=[[2,1],[1,2]] mixture by one sample. Finally compare x₁[t]=s₁[t]+.5s₂[t−δ], x₂[t]=s₂[t]−.25s₁[t−2] at δ=0."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Distribute a constant A across the two time-aligned terms; inspect every delayed branch in the second model."}</Prose>

</details>

<details><summary>Worked solution and success criterion</summary>

<Prose>{"F(As)_t=(As_t+As_(t−1))/2=A(s_t+s_(t−1))/2=A F(s)_t. Use the same omitted-first-sample support on all streams. Delaying only canonical channel 1 gives x₁_new[t]=2s₁[t−1]+s₂[t−1], while x₂[t]=s₁[t]+2s₂[t] remains current. There is no single same-time A on the original source pair. With δ=0 in the separate cross-delay example, x₁ has an instantaneous cross-branch, but x₂ still depends on s₁[t−2]. Thus the complete system is still convolutive, not a single same-time A. Different per-channel filters or trims also need their own operator treatment. Neither a separated lag axis nor this algebra establishes causal source identity. Provider offline filtering and an ICA fitting choice also do not establish an online causal pipeline."}</Prose>

<Prose>{""}<strong>{"Trap and success criterion."}</strong>{" Fixing one delay does not fix all branches. Show the commutation with common support and name the remaining delayed dependency."}</Prose>

</details>

</section></section><section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Independent project: evaluate separation without changing the question"}</H3>

<Prose>{"Use the new constructed helper as the reproducible starting point. Declare the split, train-only transforms, retained count, contrast, initialization and iteration budget before inspecting held-out truth. Fit the scratch deflation, scratch parallel, ordinary direct and ordinary external-whitening routes to the same training observations. Keep warnings and refusals; do not select a favorable run and discard unsuccessful seeds. Fit assignment, polarity, calibration means and scales using only calibration truth. Apply each mapping unchanged to the test rows and report signed correlation and MSE with units, round-trip error, convergence movement, fit time measured under the same environment, and failure counts separately."}</Prose>

<Prose>{"Repeat a predeclared finite set of seeds and inspect aligned stability. Change source shape to the zero-kurtosis three-point law, make two Gaussian instantaneous sources, increase mixing condition, add declared noise and reduce retained rank. Predict which assumption or numerical operation each change challenges before running it. A failure is informative: a Gaussian rotation can remain unrecoverable despite perfect round trip; a cubic contrast can miss a non-Gaussian law; a reduced inverse can intentionally omit residuals. Do not present this proposed study as an already executed benchmark."}</Prose>

<Prose>{"For removal, define which desired signal must remain and a task-specific loss. Compare the cleaned reconstruction with known constructed desired contributions and vary the declared leakage. Report desired loss and nuisance attenuation separately. If you extend to recordings, choose development candidates without later-reference leakage, respect provider preprocessing and person/session grouping, and evaluate on new recordings or people for that claim. The retained r01 later scores support only their stated one-record interval diagnostic. A clinical or real-time claim requires different data and validation."}</Prose>

<Prose>{"A worked planning answer uses the exact helper splits and all two observed channels, with retained budget k=2 for each representation. Keep seeds 0–9 for a declared stability study, log every outcome, and compare raw coordinates, PCA and ICA on the same training/development/test rows. The constructed true source is calibration/test truth only. For a single-reference question, select coordinate and polarity solely from development; for a two-known-source recovery question, fit the whole one-to-one mapping solely from calibration. These are different evaluation protocols and must be labeled. Freeze normalization, IDs and chosen rules before test, and report representation reconstruction separately from source correlation/MSE. Failed candidates leave the prior fit intact but are counted as failed study outcomes, never as successes of that older model."}</Prose>

<Prose>{"For a real-record extension, choose a licensed synchronized record and a specific reference endpoint, preserve train/development/evaluation row and person IDs, and keep the reference diagnostic-only. Record the equal-data and representation-budget choices for raw, PCA and ICA. Use separate later recordings or people for those generalization claims. Interpret the retained r01 result as an existing worked example; any future learner execution of its recipe is a new experiment with its own source/version/output record. Delayed, noisy and changing mixtures are explicitly changed assumptions. Before subtraction, predeclare the desired-signal loss test as well as the nuisance diagnostic. This planning answer asserts no unrun empirical result."}</Prose>

<Prose>{"You are ready to continue when you can derive SAᵀ; exhibit sign/scale/permutation compensation; produce a zero-covariance dependent table; convert sample to population whitening without a query refit; compute the first cubic step and a zero refusal; explain polar versus deflation normalization; preserve an old fit after candidate failure; compose the raw operator for an externally white estimator; freeze calibration alignment; distinguish retained evidence from missing arrays; and subtract a whole decoder-column contribution with its residual policy."}</Prose>

</section><section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H3>{"Further learning"}</H3>

<Prose>{"Start with "}<a href={"https://www.cs.helsinki.fi/u/ahyvarin/papers/NN00new.pdf"}>{"Hyvärinen and Oja's 2000 tutorial"}</a>{", especially the model, ambiguities, non-Gaussianity, preprocessing and FastICA development. Its substantive sections 1–8 were read for this lesson; original figure pixels were not inspected. Pair it with "}<a href={"https://cs229.stanford.edu/notes2021fall/cs229-notes11.pdf"}>{"Stanford CS229's short ICA notes"}</a>{" for the density/Jacobian route; the complete short extracted text was read. Work the supplied finite examples rather than treating either as code documentation."}</Prose>

<Prose>{""}<a href={"https://www.cs.helsinki.fi/u/ahyvarin/papers/bookfinal_ICA.pdf"}>{"Hyvärinen, Karhunen and Oja's ICA book"}</a>{" supports the selected whitened model, contrast and fixed-point material and temporal branch. The inspected scope was selected passages 7.4–7.5,8.2.1,8.3.5,8.4,18.1; this is not a claim to have read all 503 pages. "}<a href={"https://www.cs.helsinki.fi/u/ahyvarin/papers/TNN99new.pdf"}>{"Hyvärinen's 1999 FastICA paper"}</a>{" develops contrasts and fixed-point variants; selected accessible contrast, robustness and Newton passages were used, not an unqualified whole-proof claim."}</Prose>

</section><section className="lesson-ending lesson-ending--resources" data-lesson-ending="references"><H3>{"Technical references"}</H3>

<Prose>{"For curvature, read "}<a href={"https://arxiv.org/abs/1706.08171"}>{"Ablin, Cardoso and Gramfort's Picard paper"}</a>{" with the relative-gradient/Hessian blocks and regularization beside D39. Selected objective/curvature/L-BFGS material was inspected; the benchmark experiment and full solver recursion were not reproduced. For the nonlinear branch, "}<a href={"https://proceedings.mlr.press/v89/hyvarinen19a.html"}>{"Hyvärinen, Sasaki and Turner's auxiliary-variable nonlinear ICA paper"}</a>{" states the conditional model and variability conditions behind its identifiability result. Selected model and theorem material was read; the supplementary proof was not fully read."}</Prose>

<Prose>{""}<a href={"https://doi.org/10.1016/0165-1684(94)90029-9"}>{"Comon's 1994 formulation"}</a>{" is a historical reference for the ICA concept. Its whole proof was not accessible in this reading; no inaccessible argument is presented as independently inspected. Bell and Sejnowski's Infomax work and the 1997 fixed-point paper belong to the historical development, but their retrieved extraction was garbled here. The lesson's detailed claims therefore rely on the accessible inspected sources above rather than claiming those whole papers or their figures were read."}</Prose>

<Prose>{"Use the current "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.FastICA.html"}>{"FastICA API"}</a>{" for parameter/attribute semantics, "}<a href={"https://mne.tools/stable/generated/mne.preprocessing.ICA.html"}>{"MNE ICA API"}</a>{" for its reconstruction policy and current "}<code>{"rng"}</code>{" interface, and "}<a href={"https://physionet.org/content/adfecgdb/1.0.0/"}>{"PhysioNet dataset page"}</a>{" with the bundled provenance for recording identity and license. Official documentation does not certify the source labels in your own data. Video resources found only by metadata were not substantively viewed and are not used as proof of a mechanism or recommended as a substitute for these worked readings."}</Prose>

</section><section className="lesson-ending lesson-ending--resources" data-lesson-ending="references"><H3>{"Program and data provenance"}</H3>

<NeuralTable caption={"Program and data provenance"} headers={[<>{"ID"}</>,<>{"Sibling file"}</>,<>{"Taught at"}</>,<>{"Dependencies"}</>,<>{"Evidence/status"}</>]} rows={[[<>{"N1"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/mixing_and_ambiguity.py"}>{"mixing_and_ambiguity.py"}</a>{""}</>,<>{"§1–2"}</>,<>{"NumPy; centered_pca.real_table"}</>,<>{"Executed once; constructed arithmetic"}</>],[<>{"N2"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/joint_probability.py"}>{"joint_probability.py"}</a>{""}</>,<>{"§3"}</>,<>{"NumPy"}</>,<>{"Original main once; current stable-log/output-guard successor checked by three function calls"}</>],[<>{"N3"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/population_whitening.py"}>{"population_whitening.py"}</a>{""}</>,<>{"§4"}</>,<>{"centered_pca.py; pca_whitening.py; NumPy"}</>,<>{"Executed once; new adapter"}</>],[<>{"N4"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/projection_contrasts.py"}>{"projection_contrasts.py"}</a>{""}</>,<>{"§5"}</>,<>{"NumPy"}</>,<>{"Executed once; finite/analytic contrasts"}</>],[<>{"helper"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/constructed_sources.py"}>{"constructed_sources.py"}</a>{""}</>,<>{"§7"}</>,<>{"NumPy"}</>,<>{"Imported by new routes; no standalone main"}</>],[<>{"N5"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/fastica_scratch.py"}>{"fastica_scratch.py"}</a>{""}</>,<>{"§6–8"}</>,<>{"population_whitening.py; projection_contrasts.py; constructed_sources.py"}</>,<>{"Executed once; new fits only"}</>],[<>{"N6"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/fastica_library.py"}>{"fastica_library.py"}</a>{""}</>,<>{"§8"}</>,<>{"scikit-learn; population_whitening.py; constructed_sources.py; align_and_evaluate.py"}</>,<>{"Presentation successor; original successful stream retained; refusal status checked separately, no fit/main replay"}</>],[<>{"N7"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/align_and_evaluate.py"}>{"align_and_evaluate.py"}</a>{""}</>,<>{"§8"}</>,<>{"NumPy; SciPy; centered_pca.py; population_whitening.py"}</>,<>{"Executed once; calibration mapping"}</>],[<>{"N8"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/read_retained_recording.py"}>{"read_retained_recording.py"}</a>{""}</>,<>{"§9"}</>,<>{"Python standard library; JSON; CSV; provenance"}</>,<>{"Presentation successor; projected display from original reader stream, no reader main/recording replay"}</>],[<>{"N9"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/component_contributions.py"}>{"component_contributions.py"}</a>{""}</>,<>{"§10"}</>,<>{"constructed_sources.py; fastica_scratch.py; fastica_library.py; scikit-learn"}</>,<>{"Executed once; new same-fit contributions"}</>],[<>{"N10"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/objective_mechanisms.py"}>{"objective_mechanisms.py"}</a>{""}</>,<>{"§11"}</>,<>{"NumPy; centered_pca.py; joint_probability.py"}</>,<>{"Presentation successor; projected display retains original N2 dependency/final digit; direct area arithmetic only, no main replay"}</>],[<>{"N11"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/temporal_mixing.py"}>{"temporal_mixing.py"}</a>{""}</>,<>{"§12"}</>,<>{"NumPy; population_whitening.py; align_and_evaluate.py"}</>,<>{"Executed once; new empirical AR route plus analytic witnesses"}</>],[<>{"N12"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/mne_contribution_route.py"}>{"mne_contribution_route.py"}</a>{""}</>,<>{"§10"}</>,<>{"Optional MNE1.13.2 plus reconciled dependencies; NumPy"}</>,<>{"Source-only: optional environment absent"}</>],[<>{"dependency"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/centered_pca.py"}>{"centered_pca.py"}</a>{""}</>,<>{"§4"}</>,<>{"NumPy; original main also uses scikit-learn"}</>,<>{"Exact dependency copy; old main not executed"}</>],[<>{"dependency"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/pca_whitening.py"}>{"pca_whitening.py"}</a>{""}</>,<>{"§4"}</>,<>{"NumPy; centered_pca.py"}</>,<>{"Exact dependency copy; old main not executed"}</>],[<>{"O1"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/ica_by_hand.py"}>{"ica_by_hand.py"}</a>{""}</>,<>{"§9"}</>,<>{"NumPy"}</>,<>{"Exact original copy; historical stream; not executed"}</>],[<>{"O2"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/ica_recording.py"}>{"ica_recording.py"}</a>{""}</>,<>{"§9"}</>,<>{"NumPy; scikit-learn; sibling CSV"}</>,<>{"Exact original copy; historical stream; not executed"}</>],[<>{"data"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/ica_retained_record.json"}>{"ica_retained_record.json"}</a>{""}</>,<>{"§9"}</>,<>{"Literal ICA_RECORDING JSON plus one LF"}</>,<>{"Source export; all numbers parsed, no fitting"}</>],[<>{"data"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/r01-first20s.csv"}>{"r01-first20s.csv"}</a>{""}</>,<>{"§9"}</>,<>{"read_retained_recording.py"}</>,<>{"Exact original CSV; 20,000 synchronous rows"}</>],[<>{"data"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/data-provenance.md"}>{"data-provenance.md"}</a>{""}</>,<>{"§9"}</>,<>{"CSV and original provider record"}</>,<>{"Exact original attribution/provenance"}</>],[<>{"stream"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/ica_by_hand.historical.stdout.txt"}>{"ica_by_hand.historical.stdout.txt"}</a>{""}</>,<>{"§9"}</>,<>{"Original icaExamples.handSeparation.expected"}</>,<>{"Exact expected string without added LF"}</>],[<>{"stream"}</>,<>{""}<a href={"/learn-code/independent-component-analysis-ica/ica_recording.historical.stdout.txt"}>{"ica_recording.historical.stdout.txt"}</a>{""}</>,<>{"§9"}</>,<>{"Original icaExamples recording expected string"}</>,<>{"Exact expected string without added LF"}</>]]} />

<Prose>{"The next lesson asks what nonnegativity changes about additive factors. Carry forward the distinction between an algebraic factorization, a model's identification conditions and the evidence needed to interpret a recovered component."}</Prose>
</section></div></IcaState>;}
export default {title:'Independent Component Analysis (ICA)',readTime:'~110 min read + 180 min practice',content:Content};
