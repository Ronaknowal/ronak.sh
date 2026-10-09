import React from 'react';
import {H2,H3} from "../../components/content/Headings.jsx";
import {Prose} from "../../components/content/Prose.jsx";
import {NeuralTable} from "../../components/lesson-labs/NeuralLessonElements.jsx";
import {CodeBlock} from "../../components/content/Code.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import {Math as InlineMath,MathBlock} from "../../components/content/Math.jsx";
import "../../components/lesson-labs/lesson-flow.css";
import "../../components/lesson-labs/gaussian-mixture-reading-flow/gaussian-mixture-reading-flow.css";
import {GaussianObservedPlant,GaussianObservationRoles} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianObservationFigures.jsx";
import {GaussianCentreSpread,GaussianDensityCircuit,GaussianIntervalArea,GaussianUnitRulers} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianScalarFigures.jsx";
import {GaussianCovarianceObject,GaussianResidualOuterProduct,GaussianEigenaxisGeometry,GaussianDirectionalCosts,GaussianCorrelationComparison,GaussianRegionMass,GaussianTriangularSolve} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianCovarianceFigures.jsx";
import {GaussianMixtureGenerator,GaussianWeightedCurveSum,GaussianChooseVersusAverage,GaussianMixtureWeightLab} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianMixtureFigures.jsx";
import {GaussianCommonDenominator,GaussianAllocationRows,GaussianRareMembershipLab,GaussianSpreadShareLab} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianAllocationFigures.jsx";
import {GaussianBoundaryLab,GaussianStationaryAllocations,GaussianEffectiveCounts,GaussianWeightedCentres,GaussianNewCentreScatter,GaussianWeightedOuterScatter,GaussianAllocationTimestamps,GaussianEmHalfSteps,GaussianSingleEntityEm,GaussianStationaryEm} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianEmFigures.jsx";
import {GaussianRepeatedRowFloorLab,GaussianRecordedObjectiveTrace,GaussianObjectiveTraceLab,GaussianFlatObjectiveReference} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianObjectiveFigures.jsx";
import {GaussianCollapseContextLab,GaussianCollapseLikelihood,GaussianVarianceConstraintLab,GaussianSpectralFloorComparison} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianConstraintFigures.jsx";
import {GaussianComponentPermutation,GaussianCovarianceFamilies,GaussianScatterRestrictions,GaussianParameterCounts,GaussianDiagonalDependence,GaussianTwoPassBuffers} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianCovarianceFamilyFigures.jsx";
import {GaussianInformationCriteria,GaussianDensityUnits,GaussianSavedTrainingTransform,GaussianSavedModelGrid,GaussianNarrowFittedComponent,GaussianReservedTestResult} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianModelSelectionFigures.jsx";
import {GaussianSavedPartition,GaussianSavedQueryLab,GaussianOperationRoles} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianInferenceFigures.jsx";
import {GaussianTrialBoundLab,GaussianTouchingBoundLadder,GaussianJensenGeometry} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianBoundFigures.jsx";
import {GaussianDistanceMembershipLab,GaussianHardSoftCentreComparison} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianDistanceFigures.jsx";
import {GaussianCoordinateSlice,GaussianConditionalSolves,GaussianConditionalSpread} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianConditionalFigures.jsx";
import {GaussianBayesianParameterPlate,GaussianDirichletEvidence,GaussianNormalWishartUpdate,GaussianVariationalAssignmentBound,GaussianFiniteStickWeights,GaussianPredictiveIntegration,GaussianRepresentationOperations} from "../../components/lesson-labs/gaussian-mixture-reading-flow/GaussianBayesianFigures.jsx";
function Content(){return <div className="lesson-flow gmm-lesson"><Prose opening="summary">{"Can several overlapping Gaussian descriptions predict unseen flower measurements better than one Gaussian? We will build the descriptions, learn how an observation divides its contribution between them, and inspect a complete reserved-data comparison. A more flexible model is useful only when the question and evidence support it."}</Prose>

<Prose opening="prerequisites">{"You need arithmetic, logarithms and basic arrays. We refresh probability density, weighted averages and covariance before using them. "}<a href={"/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu?module=math-foundations"}>{"Matrix Decompositions"}</a>{" supplies the Cholesky factor in its covariance section; "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml"}>{"PCA"}</a>{" supplies eigenaxis geometry; "}<a href={"/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml"}>{"Clustering Evaluation"}</a>{" supplies the pair-based interpretation of ARI. Each use is also traced here."}</Prose>

<Prose opening="route">{"The first route is sections 1–11 followed by the core practice in section 16. Sections 12–15 are visible deeper branches: why EM improves its objective, its relation to hard clustering, conditioning on part of a measurement, and uncertainty in parameters. Each has its own worked examples and implementation. The Learning compass at the start links to all sixteen study sections, further learning, technical references and the complete program files."}</Prose>

<H2>{"1. Which measurements need more than one description?"}</H2>

<Prose>{"Overlapping measurements invite several descriptions, but an unseen-data comparison must decide whether the extra flexibility helps."}</Prose>

<GaussianObservedPlant />

<Prose>{"The two entries beside observation "}<strong>{"ID 34"}</strong>{" are sepal length "}<strong>{"5.5 cm"}</strong>{" and sepal width "}<strong>{"4.2 cm"}</strong>{". Follow each ruler guide to their intersection. The point is one recorded plant; its ID tells us which row supplied it. The ID is not a third fitting coordinate. ID 35 is a different plant at 4.9 cm by 3.1 cm. Looking up an array position instead of its row ID would silently exchange the two."}</Prose>

<Prose>{"The collection has 150 observations, with two chosen features per observation. A feature is a measured coordinate; a model is a rule assigning density to possible coordinate pairs. We will allow several Gaussian components in that rule. A component is a possible generating description, not a species label."}</Prose>

<GaussianObservationRoles />

<Prose>{"The three strips show exclusive roles. The 90 training IDs supply the fitted parameters and the mean/scales of preprocessing. The 30 validation IDs select among declared candidates. The remaining 30 test IDs answer the reserved comparison after that choice. ID 34 belongs to test, whereas ID 35 belongs to training. Moving a point between roles changes what information was available when the model was chosen."}</Prose>

<Prose>{"A fixed, label-blind permutation with seed 16 supplied these roles. Species annotations do not enter fitting, scaling or selection. They will later help ask a different question about the selected component partition. For now, no fitted contours, component shares or reserved outcomes are needed: first we must understand one Gaussian description."}</Prose>

<H2>{"2. One Gaussian has a centre, spread and area"}</H2>

<Prose>{"Before combining descriptions, draw one whose height and width we can interpret. We temporarily switch from the flower's two measurements to a constructed one-dimensional ruler in arbitrary coordinate units. A centre of zero and a width of one make the arithmetic easy to follow; these are not the flower's raw centimetres or an unannounced preprocessing of Iris. We will return to the real measurements after building the mechanism."}</Prose>

<GaussianCentreSpread />

<Prose>{"The bell has centre 0 and standard deviation 1. The query at 1 is one standard deviation to its right. The displacement arrow runs from the mean to the query; the marked interval extends one standard deviation on either side of the mean. Changing the mean moves the centre. Changing the standard deviation stretches the horizontal scale and changes the height needed to keep total area one. Variance is the square of that length, so a variance of .25 means a standard deviation of .5."}</Prose>

<GaussianDensityCircuit />

<Prose>{"At the marked query, subtract the mean: (1-0=1). Square the displacement, divide by variance 1, and multiply by (-1/2). Exponentiation produces "}<InlineMath>{"e^{-1/2}"}</InlineMath>{"; multiplying by "}<InlineMath>{"1/\\sqrt{2\\pi}"}</InlineMath>{" gives height .241970725. At query 2, the squared standardized distance is 4 and the height becomes .053990967. The same normalizing factor supplies both rows."}</Prose>

<Prose>{"For mean "}<InlineMath>{"\\mu"}</InlineMath>{", variance "}<InlineMath>{"v>0"}</InlineMath>{", and standard deviation "}<InlineMath>{"\\sigma=\\sqrt v"}</InlineMath>{", the normal density is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 1; scroll horizontally when needed"><MathBlock>{"p(x)=\\frac{1}{\\sqrt{2\\pi v}}\\exp\\!\\left[-\\frac{(x-\\mu)^2}{2v}\\right]."}</MathBlock></div>

<Prose>{"The exponent has no units: squared displacement and variance have the same units. The height has reciprocal measurement units. It is a density, not the probability of that exact point."}</Prose>

<GaussianIntervalArea />

<Prose>{"The shaded area between -1 and 1 is .682689492. Moving either endpoint changes that area; coincident endpoints give zero. Height at zero is .398942280, a different quantity. A narrow Gaussian with standard deviation .25 has peak 1.595769122 and still has total area one. A continuous variable has zero probability at one exact point; positive probability comes from integrating height across an interval. Density exceeding one is therefore legitimate."}</Prose>

<Prose>{"If "}<InlineMath>{"\\Phi"}</InlineMath>{" denotes the standard-normal cumulative area, then"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 2; scroll horizontally when needed"><MathBlock>{"P(a\\le X\\le b)=\\Phi((b-\\mu)/\\sigma)-\\Phi((a-\\mu)/\\sigma)."}</MathBlock></div>

<GaussianUnitRulers />

<Prose>{"Changing centimetres to millimetres multiplies each coordinate and standard deviation by 10 and variance by 100. The same physical query at 1 cm becomes 10 mm. Its density becomes .0241970725 per mm, one tenth of the per-cm height. The interval width becomes ten times larger, cancelling that height change in the integral. The interval probability stays .682689492. A different numerical density after a unit conversion need not mean a different physical model."}</Prose>

<Prose>{""}<code>{"gaussian_scalar.py"}</code>{" implements the subtraction, standardized square and logarithmic normalizer directly. "}<code>{"log_normal"}</code>{" retains the log height before exponentiation can underflow. "}<code>{"interval_probability"}</code>{" uses maintained "}<code>{"erf"}</code>{"/"}<code>{"erfc"}</code>{" primitives, choosing a same-tail difference rather than subtracting two CDF values almost equal to one. The scale is computed as sqrt(variance) times sqrt(2), avoiding an unnecessary overflow in twice the variance. It rejects reversed endpoints, finite-domain failures and nonpositive variance. The work is constant per query, hence O(q) for q queries. SciPy's "}<code>{"norm.pdf"}</code>{", "}<code>{"norm.logpdf"}</code>{" and "}<code>{"norm.cdf"}</code>{" provide the ordinary route: "}<code>{"scale"}</code>{" means standard deviation, not variance. The complete file compares their outputs and the changed units."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="gaussian_scalar.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_scalar.py" />

<CodeBlock kind="output" filename="gaussian_scalar.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_scalar.stdout">{"default log-density -1.4189385332046727\ndefault density 0.24197072451914337\ninterval probability 0.6826894921370857\nzero interval 0.0\nnarrow peak 1.5957691216057308\nmillimetre density 0.024197072451914332\nSciPy density 0.24197072451914337\nSciPy interval 0.6826894921370859"}</CodeBlock>

<Prose>{"A single feature has one width. Paired measurements require directions as well as widths."}</Prose>

<H2>{"3. Draw one two-dimensional Gaussian before reading its matrix"}</H2>

<Prose>{"The single ruler explained one width. Two paired measurements need one geometric shape, rather than two unrelated bells. Continue with constructed coordinates, now two arbitrary-unit axes centred at zero, so we can see how their spreads connect before fitting the flower measurements."}</Prose>

<GaussianCovarianceObject />

<Prose>{"The mean is the cross at (0,0). The point at (1,1) has a displacement arrow from that cross. The tilted ellipse and its adjacent covariance cells describe the same Gaussian: diagonal entries 1 give each marginal variance, while the equal off-diagonal entries .75 couple the coordinates. The drawing keeps equal physical axis scales. Tilt is a property of the whole matrix, not a separate angle stored in one cell."}</Prose>

<GaussianResidualOuterProduct />

<Prose>{"A residual (2,-1) becomes a column and its matching row. Their four products are"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 3; scroll horizontally when needed"><MathBlock>{"dd^T=\\begin{bmatrix}4&-2\\\\-2&1\\end{bmatrix}."}</MathBlock></div>

<Prose>{"Both negative cross entries matter. This one rank-one contribution is not by itself a positive-definite covariance. At zero residual all four entries become zero; for (1,2), they become 1,2,2,4. Later the M-step will add fractionally weighted contributions like these."}</Prose>

<Prose>{"The residual products record spread. To compare a displacement with that spread, divide its coordinates along the ellipse's wide and narrow axes by the corresponding standard deviations, square them and add. Call the result squared covariance distance, "}<InlineMath>{"D^2"}</InlineMath>{". The contour labelled "}<InlineMath>{"D^2=1"}</InlineMath>{" joins points whose standardized squared displacements add to one. The next picture shows the two axes that make this calculation possible."}</Prose>

<GaussianEigenaxisGeometry />

<Prose>{"For "}<InlineMath>{"\\Sigma=[[1,.75],[.75,1]]"}</InlineMath>{", the orthogonal directions "}<InlineMath>{"u_+=(1,1)/\\sqrt2"}</InlineMath>{" and "}<InlineMath>{"u_-=(1,-1)/\\sqrt2"}</InlineMath>{" have variances 1.75 and .25. The "}<InlineMath>{"D^2=1"}</InlineMath>{" ellipse has semiaxes "}<InlineMath>{"\\sqrt{1.75}"}</InlineMath>{" and .5 along those directions. Multiplying the covariance by either direction returns its variance times that direction. Reversing an eigenvector's sign changes no ellipse. If both variances are equal, as with identity covariance, the circle has no uniquely preferred eigenaxes."}</Prose>

<GaussianDirectionalCosts />

<Prose>{"P=(1,1) and Q=(1,-1) are equally far from the mean in ordinary squared Euclidean distance: both give 2. Their directional projections differ. P gives ("}<InlineMath>{"\\sqrt2"}</InlineMath>{",0), so its squared distance in covariance units is "}<InlineMath>{"2/1.75=8/7"}</InlineMath>{". Q gives (0,"}<InlineMath>{"\\sqrt2"}</InlineMath>{"), so its corresponding value is "}<InlineMath>{"2/.25=8"}</InlineMath>{". The same determinant normalization multiplies both densities. P's density is .135882281 and Q's is .004407103. We have not normalized across P and Q; these are two possible locations under one model."}</Prose>

<Prose>{"For positive-definite covariance, "}<InlineMath>{"D^2=(x-\\mu)^T\\Sigma^{-1}(x-\\mu)"}</InlineMath>{". In eigenaxis coordinates it is the sum of squared projections divided by directional variances. This explains why a long axis makes a fixed displacement less surprising."}</Prose>

<Prose>{"The cross entries have another useful interpretation: "}<strong>{"correlation"}</strong>{", written "}<InlineMath>{"\\rho"}</InlineMath>{", is covariance divided by the product of the two marginal standard deviations. Here each marginal variance is one, so each standard deviation is one and "}<InlineMath>{"\\rho"}</InlineMath>{" equals the matrix's cross entry. Changing it changes how the same fixed measurements travel together; it does not move their coordinates."}</Prose>

<GaussianCorrelationComparison />

<Prose>{"The zero-correlation panel remains beside the changed panel. With correlation zero, P and Q both have squared covariance distance 2 and density .058549832. Negative correlation tilts the wide direction toward Q and reverses the default ordering. The local editor changes only correlation and P's two coordinates; Q stays at its explicitly fixed coordinates. It does not regenerate a scatter cloud or introduce an extra hidden selector."}</Prose>

<GaussianRegionMass />

<Prose>{"Increasing radius R scales each ellipse semiaxis by R. In two dimensions, the enclosed mass is "}<InlineMath>{"1-e^{-R^2/2}"}</InlineMath>{": R=1 encloses .393469340 and R=2 encloses .864664717. This differs from the one-dimensional "}<InlineMath>{"[-1,1]"}</InlineMath>{" interval's .682689492. At R=0 the region has zero area and zero probability. A density contour is not a confidence interval for the estimated mean; its region probability also depends on dimension."}</Prose>

<Prose>{"Now give the matrix its computational meaning. A covariance must be symmetric positive definite for an ordinary nonsingular Gaussian density. Its determinant scales volume; its inverse is called precision. The logarithm of its determinant can be negative without invalidity: a determinant between zero and one has a negative log. A determinant's sign alone cannot certify positive definiteness."}</Prose>

<GaussianTriangularSolve />

<Prose>{"The lower Cholesky factor of this covariance is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 4; scroll horizontally when needed"><MathBlock>{"L=\\begin{bmatrix}1&0\\\\.75&\\sqrt7/4\\end{bmatrix},\\qquad \\Sigma=LL^T."}</MathBlock></div>

<Prose>{"Solve "}<InlineMath>{"Ly=x-\\mu"}</InlineMath>{", first "}<InlineMath>{"y_1=d_1"}</InlineMath>{", then "}<InlineMath>{"y_2=(d_2-.75y_1)/(\\sqrt7/4)"}</InlineMath>{". At P the coordinates are "}<InlineMath>{"(1,1/\\sqrt7)"}</InlineMath>{"; their squared norm is "}<InlineMath>{"8/7"}</InlineMath>{". The log determinant is twice the sum of logs of the positive diagonal factors. We never need to form the full covariance inverse for a query."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 5; scroll horizontally when needed"><MathBlock>{"\\log p(x)=-\\tfrac12[d\\log(2\\pi)+2\\sum_j\\log L_{jj}+\\|L^{-1}(x-\\mu)\\|^2]."}</MathBlock></div>

<Prose>{""}<code>{"GaussianFactor"}</code>{" prepares the factor once, then solves for a whole q-by-d query batch. Its factor costs O(d³), storage O(d²), and queries O(qd²). "}<code>{"symmetric_spd"}</code>{" separately checks symmetry and permits averaging paired entries only within the declared relative roundoff tolerance "}<InlineMath>{"10^{-12}\\max(1,\\max_{i,j}|\\Sigma_{ij}|)"}</InlineMath>{". It rejects genuinely asymmetric, singular and nonfinite state. This small symmetry policy also admits negligible paired-entry discrepancies in retained state. The "}<code>{"symmetric_part"}</code>{" helper averages the paired entries: it keeps the ordinary sum-then-half calculation when finite, and halves the two entries first only where their sum overflows. This preserves very small entries while avoiding an infinite average of two large finite entries; it does not add regularization. It is not a general repair for invalid covariance."}</Prose>

<Prose>{"SciPy's "}<code>{"multivariate_normal.logpdf(..., allow_singular=False)"}</code>{" is the ordinary supplied-state comparison. Validate symmetry before calling it: this API uses the lower triangular entries and does not check whether paired entries agree. "}<code>{"allow_singular=False"}</code>{" therefore does not replace the separate symmetry check. Cholesky and triangular solves are reused maintained linear algebra primitives; the mechanism here is their complete assembly into Gaussian log density, traced after the prerequisite's covariance/factor anatomy."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="gaussian_log_density.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_log_density.py" />

<CodeBlock kind="output" filename="gaussian_log_density.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_log_density.stdout">{"lower factor [[1.0, 0.0], [0.75, 0.6614378277661477]]\nwhitened coordinates [[1.0, 0.3779644730092272], [1.0, -2.6457513110645903], [0.0, 0.0]]\nlog determinant -0.8266785731844678\nscratch log densities [-1.995966351245683, -5.42453777981711, -1.4245377798171115]\nSciPy log densities [-1.9959663512456824, -5.42453777981711, -1.4245377798171113]\nsingular rejected\nasymmetric rejected"}</CodeBlock>

<Prose>{"We can now combine complete Gaussian descriptions without changing what each one means."}</Prose>

<H2>{"4. A mixture chooses a component, then a measurement"}</H2>

<Prose>{"Two Gaussians form one mixture when one hidden choice selects which generates each observation."}</Prose>

<GaussianMixtureGenerator />

<Prose>{"First choose Left or Right with probabilities .5 and .5. Then draw from that chosen Gaussian: Left has mean -2, Right has mean 2, and both have variance 1. The observed x is filled; its hidden selector z is outlined. The weights, means and covariances lie outside the repeated-observation bracket. Only z and x repeat for each row. Arrows show generation, not a fitted label obtained from x."}</Prose>

<Prose>{"For K components, "}<InlineMath>{"P(z=k)=\\pi_k"}</InlineMath>{", "}<InlineMath>{"x\\mid z=k\\sim N(\\mu_k,\\Sigma_k)"}</InlineMath>{", and "}<InlineMath>{"\\sum_k\\pi_k=1"}</InlineMath>{". Marginalizing the unobserved selector gives"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 6; scroll horizontally when needed"><MathBlock>{"p(x)=\\sum_{k=0}^{K-1}\\pi_kN(x;\\mu_k,\\Sigma_k)."}</MathBlock></div>

<GaussianWeightedCurveSum />

<Prose>{"At x=2, Left contributes .00006691511288 and Right contributes .199471140201. The stems share the same query coordinate, and their sum is .199538055314. Each weighted curve has full-line area .5. The plot's finite window does not capture exactly all that area. A tiny stem has an exact numerical label rather than an artificially inflated height."}</Prose>

<GaussianChooseVersusAverage />

<Prose>{"Choosing one source is different from averaging independent draws from both. The mixture has mean 0 and variance "}<InlineMath>{"1+4=5"}</InlineMath>{": within-component variance 1 plus variance 4 from the separated source means. Averaging two independent draws with equal coefficients gives variance "}<InlineMath>{".25+.25=.5"}</InlineMath>{". It creates a narrow Gaussian centred at zero, not the same mixture."}</Prose>

<Prose>{"The general mean and covariance are"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 7; scroll horizontally when needed"><MathBlock>{"\\bar\\mu=\\sum_k\\pi_k\\mu_k,\\qquad\n\\operatorname{Cov}(X)=\\sum_k\\pi_k[\\Sigma_k+(\\mu_k-\\bar\\mu)(\\mu_k-\\bar\\mu)^T]."}</MathBlock></div>

<Prose>{"The second term measures variation between sources. "}<code>{"GaussianMixtureState.moments"}</code>{" computes these actual matrices. "}<code>{"sample"}</code>{" first draws categorical IDs with the weights, then one Gaussian draw for each ID, using a maintained random-number generator. It returns both the generated rows and their generated component IDs. Those are new simulated values with a declared seed, not measurements or biological classes. This generator's RNG grouping is not promised byte-identical to another package's sampling routine."}</Prose>

<Prose>{"This method excerpt belongs to the complete "}<code>{"gaussian_mixture.py"}</code>{" in section 5."}</Prose>

<CodeBlock language={"python"}>{"    def moments(self):\n        mean = self.weights @ self.means\n        covariance = np.zeros((self.dimension, self.dimension))\n        for k, weight in enumerate(self.weights):\n            offset = self.means[k] - mean\n            covariance += weight * (self.covariance_matrix(k) + np.outer(offset, offset))\n        return mean, covariance"}</CodeBlock>

<Prose>{"This method excerpt belongs to the complete "}<code>{"gaussian_mixture.py"}</code>{" in section 5."}</Prose>

<CodeBlock language={"python"}>{"    def sample(self, count, seed=16):\n        if not isinstance(count, int) or count < 0:\n            raise ValueError(\"nonnegative integer sample count required\")\n        rng = np.random.default_rng(seed)\n        ids = rng.choice(self.components, size=count, p=self.weights)\n        rows = np.empty((count, self.dimension))\n        for k in range(self.components):\n            selected = ids == k\n            lower = np.linalg.cholesky(self.covariance_matrix(k))\n            rows[selected] = self.means[k] + rng.standard_normal((selected.sum(), self.dimension)) @ lower.T\n        return rows, ids"}</CodeBlock>

<GaussianMixtureWeightLab />

<Prose>{"Changing Left's weight changes its area, the opposing weight and the sum at the same query. The .5/.5 model stays visible as a baseline. A zero Left weight removes its contribution and gives responsibility zero; its ID can remain on the diagram. These endpoints are useful inference degenerations. An active fitting start will require positive weights. No permitted weight vector is all zero."}</Prose>

<Prose>{"Once x is observed, we can reverse the generative question: how much of its density came from each source?"}</Prose>

<H2>{"5. Given one measurement, divide its component contributions"}</H2>

<Prose>{"Observing x reverses the question while keeping the same model and the same component identities."}</Prose>

<GaussianCommonDenominator />

<Prose>{"Both contribution wires feed one sum. That identical denominator then enters both divisions. At x=2, the unit allocation is (.000335350,.999664650). Density units cancel in each ratio. The resulting conditional component shares are called responsibilities:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 8; scroll horizontally when needed"><MathBlock>{"r_k(x)=P(z=k\\mid x,\\theta)=\\frac{\\pi_kN(x;\\mu_k,\\Sigma_k)}{\\sum_j\\pi_jN(x;\\mu_j,\\Sigma_j)}."}</MathBlock></div>

<Prose>{"The symbol "}<InlineMath>{"\\theta"}</InlineMath>{" names the whole fixed parameter state. Each numerator and denominator uses that same state and observation. Dividing by a separate component's integrated area would answer a different question."}</Prose>

<Prose>{"One query gave us two shares. To learn new centres and spreads, we now need shares for several observations. Use a new four-row hand example at -2, -1, 1 and 2, with initial means -1 and +1 instead of the earlier -2 and +2. Those closer centres deliberately create overlap, so we can watch fractional contributions move a centre without moving any observation; this is a separately declared starting model."}</Prose>

<GaussianAllocationRows />

<Prose>{"For rows A–D at -2,-1,1,2 under means -1/+1, each row has two shares summing to one. Left's column is [.982013790,.880797078,.119202922,.017986210]; Right is its complement. The columns are component identities, while A–D identify observations. Reordering observations moves the ID, measurement and both cells together. A column sum is not another per-row probability; it will soon become an effective count."}</Prose>

<GaussianRareMembershipLab />

<Prose>{"The fixed comparison at x=8 and the query at x=2 strongly favour the same Right component. Yet their total log densities are approximately -19.612086 and -1.611750. The former lies far into both tails. A responsibility near one means “this source dominates the others under this state”; it does not imply that the measurement is common, that a biological class is certain, or that fitted parameters have no uncertainty."}</Prose>

<Prose>{"For stable computation, form "}<InlineMath>{"a_k=\\log\\pi_k+\\log N_k(x)"}</InlineMath>{". Let "}<InlineMath>{"m=\\max a_k"}</InlineMath>{". Then"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 9; scroll horizontally when needed"><MathBlock>{"\\log p(x)=m+\\log\\sum_k e^{a_k-m},\\qquad\nr_k=e^{a_k-\\log p(x)}."}</MathBlock></div>

<Prose>{"The maximum shift prevents unnecessarily huge/small intermediate exponentials. A zero weight has log weight "}<InlineMath>{"-\\infty"}</InlineMath>{" and contributes exactly zero. An all-negative-infinite row signals a representability failure, not an excuse to return uniform shares. The final display may round a share to 1 while retaining a small complement internally; log density remains independently meaningful."}</Prose>

<GaussianSpreadShareLab />

<Prose>{"At x=0, broadening only Left's variance to 4 gives Left share .691438454, compared with the equal-variance baseline's .5. The normalizing height as well as the distance penalty changes. In the separately named identical-component example, both densities are the same and shares are exactly the mixing priors .2/.8 at every query. The parameter values remain visible; a model change cannot leave an old comparison labelled current."}</Prose>

<GaussianBoundaryLab />

<Prose>{"Equal variances can give one crossing; unequal variances can give two, none, or a tangent. Identical components with equal priors tie everywhere; identical components with unequal priors never cross. The plotted roots mark equality of "}<strong>{"weighted"}</strong>{" heights before we name its equation. The main query window remains usable even if another root lies far outside it: its coordinate appears in the supplementary root extent and table."}</Prose>

<Prose>{"Taking the difference of log weighted heights gives a quadratic "}<InlineMath>{"ax^2+bx+c=0"}</InlineMath>{", with"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 10; scroll horizontally when needed"><MathBlock>{"a=\\tfrac12(1/v_R-1/v_L),\\quad b=\\mu_L/v_L-\\mu_R/v_R,"}</MathBlock></div>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 11; scroll horizontally when needed"><MathBlock>{"c=\\log\\pi_L-\\log\\pi_R-\\tfrac12(\\log v_L-\\log v_R)-\\mu_L^2/(2v_L)+\\mu_R^2/(2v_R)."}</MathBlock></div>

<Prose>{"For a true linear case a=0, solve -c/b. For two quadratic roots, "}<code>{"mixture_crossings.py"}</code>{" uses "}<InlineMath>{"q=-[b+\\operatorname{sign}(b)\\sqrt{b^2-4ac}]/2"}</InlineMath>{", then q/a and c/q, avoiding a cancellation-prone subtraction in one root. Exact zero coefficients/discriminant determine the literal branches; near-zero diagnostics are separately labelled. A mathematically tangent example can produce a tiny nonzero coefficient through floating-point logarithms: the last recorded example reports a near-degenerate no-crossing branch. Its diagnostic is not a proof that the real-valued curves fail to touch; an analytically specified tangent and a floating-coefficient root status are labelled separately. Root residuals are evaluated in the original log-height difference. Positive variances and positive weights are needed for this equation; a zero-weight inference branch has no finite equal-contribution root."}</Prose>

<Prose>{"The complete source can decode four ways of storing an already declared covariance. A "}<strong>{"full"}</strong>{" state stores K separate d-by-d matrices like the one in section 3. A "}<strong>{"tied"}</strong>{" state stores one such matrix shared by every component. A "}<strong>{"diagonal"}</strong>{" state stores each matrix's d positive diagonal cells, with both cross cells zero in two dimensions; "}<strong>{"spherical"}</strong>{" stores one positive variance multiplying the identity for each component. For example, the two-dimensional diagonal vector (2,1) represents [[2,0],[0,1]], while spherical variance 2 represents [[2,0],[0,2]]. These are input shapes for the inference decoder, not four fitting results. Section 9 will draw and compare their geometric freedoms and learning updates before the general fitter uses them."}</Prose>

<Prose>{""}<code>{"GaussianMixtureState"}</code>{" now supplies the complete mixture route: means K-by-d, weights K, covariance shapes determined by the named family, weighted log terms, row normalization, moments and generation. Full and tied state use prepared factors; diagonal/spherical queries dispatch directly through their coordinate/scalar variances. "}<code>{"predict_proba"}</code>{" returns conditional component shares, "}<code>{"predict"}</code>{" chooses the largest supported weighted log term, and "}<code>{"score_samples"}</code>{" returns log density. The hard and soft routes both refuse an unsupported all-negative-infinite row. "}<code>{"score"}</code>{" averages the row log densities. It keeps the ordinary mean when finite; if the intermediate sum overflows, it divides the scores by their largest absolute value, averages these bounded numbers, then restores the scale. This changes the arithmetic route, not the quantity being averaged. SciPy densities plus the same sum/division give an ordinary supplied-state route; section 9 will expose the full learned-estimator workflow after all covariance families are taught."}</Prose>

<Prose>{""}<code>{"argmax"}</code>{" chooses the first "}<strong>{"array position"}</strong>{" at an exact tie. Permuting all component parameters preserves density and reorders share columns, but positional tie decisions may change the hard partition. We examine the untied guarantee and its exact-tie exception in section 8; tolerance labels never alter the literal decision."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="gaussian_mixture.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_mixture.py" />

<CodeBlock kind="output" filename="gaussian_mixture.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_mixture.stdout">{"query log densities [-2.9189385332046727, -1.6117503073917223, -19.612085713764603]\nquery responsibilities [[0.49999999999999994, 0.49999999999999994], [0.00033535013046647805, 0.9996646498695335], [1.2664165549093996e-14, 0.9999999999999858]]\nquery component IDs [0, 1, 1]\nmixture moments [0.0] [[5.0]]\nindependent-average variance 0.5\nchanged posterior at zero [[0.0, 1.0]]\nchanged posterior at zero [[0.4275731745392747, 0.5724268254607253]]\ngenerated component IDs [1, 0, 0, 0]\ngenerated rows [[1.6337783181427634], [-0.18215390127105668], [-2.3851893808502385], [-1.4558228112473197]]"}</CodeBlock>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="mixture_crossings.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/mixture_crossings.py" />

<CodeBlock kind="output" filename="mixture_crossings.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/mixture_crossings.stdout">{"crossing one linear crossing [0.4506938556659452] near-degenerate True\nroot residuals [0.0]\ncrossing two crossings [-6.085279777485982, -0.5813868891806845] near-degenerate False\nroot residuals [1.4210854715202004e-14, -1.7763568394002505e-15]\ncrossing no crossing [] near-degenerate True\nroot residuals []\ncrossing equal everywhere [] near-degenerate True\nroot residuals []\ncrossing two crossings [3.7500003121513915e-10, 7999999334.077086] near-degenerate False\nroot residuals [0.0, 0.0]\ncrossing no crossing [] near-degenerate True\nroot residuals []"}</CodeBlock>

<Prose>{"Each share can now become a fractional contribution to a new parameter estimate."}</Prose>

<H2>{"6. Fractional observations move centres and spreads"}</H2>

<Prose>{"Responsibilities let each fixed observation contribute a fraction to several descriptions."}</Prose>

<GaussianStationaryAllocations />

<Prose>{"The observations stay at -2,-1,1,2. Each unit-height bar divides into Left and Right mass under the old means -1/+1. Its fractions travel into component lanes; the measurement itself neither moves nor becomes two new measurements. This retains each observation ID across the picture."}</Prose>

<GaussianEffectiveCounts />

<Prose>{"Add the Left cells: .982013790+.880797078+.119202922+.017986210=2. Right also totals 2, and both totals sum to the four observed rows. These are effective counts, not counts of hard labels. Dividing each by four gives new mixing weights .5/.5. In general, "}<InlineMath>{"N_k=\\sum_n r_{nk}"}</InlineMath>{" and "}<InlineMath>{"\\pi_k'=N_k/n"}</InlineMath>{"."}</Prose>

<Prose>{"Why this weight? With allocations fixed, the weight-dependent log objective is "}<InlineMath>{"\\sum_kN_k\\log\\pi_k"}</InlineMath>{". A sum-to-one multiplier gives "}<InlineMath>{"N_k/\\pi_k=\\lambda"}</InlineMath>{". Summing "}<InlineMath>{"\\pi_k=N_k/\\lambda"}</InlineMath>{" yields "}<InlineMath>{"\\lambda=n"}</InlineMath>{", since all row shares sum to one."}</Prose>

<GaussianWeightedCentres />

<Prose>{"Multiply each Left share by its signed observation: approximately -1.964027580, -.880797078, .119202922 and .035972420. Their sum is -2.689649316. Divide by Left's count 2 to place its new centre at -1.344824658. The old centre -1 is open; the new centre is filled. Both use the same physical ruler. The opposing component gets the mirrored centre. A mean moved; no raw observation did."}</Prose>

<Prose>{"The weighted residual must balance: "}<InlineMath>{"\\sum_n r_{nk}(x_n-\\mu_k')=0"}</InlineMath>{". Rearranging gives"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 12; scroll horizontally when needed"><MathBlock>{"\\mu_k'=\\frac{\\sum_n r_{nk}x_n}{N_k}."}</MathBlock></div>

<Prose>{"This is also the stationary condition obtained by differentiating the fixed-allocation Gaussian objective with respect to its centre. The derivative encodes the balancing operation already visible on the ruler."}</Prose>

<GaussianNewCentreScatter />

<Prose>{"Now measure every residual from the "}<strong>{"new"}</strong>{" mean, square its length, weight by the same used share, add, and divide by 2. Left's raw variance is .691446639, so its standard deviation is .831532705. Before and after use identical ruler scales. Variance is not drawn as a length. Using the old centre would add "}<InlineMath>{"(\\mu_k'-\\mu_k)^2"}</InlineMath>{" to the scatter; it does not maximize the centre-and-spread update we just constructed."}</Prose>

<GaussianWeightedOuterScatter />

<Prose>{"The same arithmetic works on paired rows (0,0),(2,0),(0,2) with Left shares .8,.4,.1. The count is 1.3, and its centre is (8/13,2/13). Each residual contributes a full four-cell outer product, multiplied by its share. The divided accumulator is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 13; scroll horizontally when needed"><MathBlock>{"\\Sigma_L'=\\begin{bmatrix}144/169&-16/169\\\\-16/169&48/169\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The negative cross cells record opposing coordinate residuals. Removing them would silently switch to a restricted covariance family. This is one supplied-allocation update, not a new fitted experiment."}</Prose>

<Prose>{"For a full covariance the maximum-likelihood update is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 14; scroll horizontally when needed"><MathBlock>{"\\Sigma_k'=\\frac1{N_k}\\sum_n r_{nk}(x_n-\\mu_k')(x_n-\\mu_k')^T."}</MathBlock></div>

<Prose>{"The denominator is "}<InlineMath>{"N_k"}</InlineMath>{", not "}<InlineMath>{"N_k-1"}</InlineMath>{": this is a maximum-likelihood covariance under fixed allocations, rather than an unbiased sample-covariance correction. Centre the residuals before summing their products. Subtracting huge raw second moments can lose significant digits even when its symbolic formula is equivalent."}</Prose>

<GaussianAllocationTimestamps />

<Prose>{"The old parameters produced the "}<strong>{"used"}</strong>{" responsibility matrix. The new parameters are a separate object; computing new shares is the next allocation evaluation. Section 7 will name it the E-step and explain why it alternates with this parameter update. A's used Left share .982013790 becomes a fresh .999582068 only after that new evaluation. Keeping these timestamps prevents a table that uses one parameter state while its caption describes another."}</Prose>

<Prose>{""}<code>{"fractional_gaussian_update.py"}</code>{" computes counts, local-origin weighted centres and centered scatter. "}<code>{"scalar_step"}</code>{" exposes both raw variance and an optional lower bound, returning "}<code>{"max(raw,floor)"}</code>{" separately. A floor is a constraint that keeps variance from shrinking below a named positive value; its proof and difference from adding a value arrive in section 8. Zero effective mass gives an explicitly unidentified component ID, not division by zero or an arbitrary invented mean. The full update uses array products with a loop over components, O(nKd²), and never allocates an n-by-K-by-d residual tensor. Direct scalar sums and the exact two-dimensional fractions provide independent checks. The ordinary learned-estimator bridge follows section 9's covariance choices; this file owns the fractional operation it delegates."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="fractional_gaussian_update.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/fractional_gaussian_update.py" />

<CodeBlock kind="output" filename="fractional_gaussian_update.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/fractional_gaussian_update.stdout">{"used responsibilities [[0.9820137900379083, 0.017986209962091562], [0.8807970779778823, 0.11920292202211753], [0.11920292202211753, 0.8807970779778823], [0.017986209962091562, 0.9820137900379083]]\ncounts [1.9999999999999998, 1.9999999999999996]\nnew scalar state [0.49999999999999994, 0.4999999999999999] [-1.3448246580536993, 1.3448246580537] [0.6914466390907508, 0.6914466390907508]\ntwo-dimensional means [[0.6153846153846153, 0.15384615384615383], [0.7058823529411765, 1.0588235294117647]]\ntwo-dimensional covariance [[[0.8520710059171595, -0.09467455621301774], [-0.09467455621301772, 0.2840236686390532]], [[0.9134948096885812, -0.7474048442906576], [-0.7474048442906575, 0.9965397923875433]]]\nchanged scalar mean/raw/floored [0.9999999999999998, 3.3529411764705883] [2.1538461538461533, 3.4048442906574397] [3.0, 3.4048442906574397]"}</CodeBlock>

<Prose>{"Allocation and parameter update can repeat, provided their different times remain identifiable."}</Prose>

<H2>{"7. Alternate allocations and parameters without mixing times"}</H2>

<Prose>{"EM repeats two operations while holding a different object fixed in each."}</Prose>

<GaussianEmHalfSteps />

<Prose>{"Follow the four fixed rows A=-2, B=-1, C=1 and D=2 into the objective ports before alternating steps. Under the initial weights .5/.5, means -1/+1 and variances 1, each row first receives a mixture density: add its two weighted component heights. Call that value "}<InlineMath>{"p_\\theta(x_i)"}</InlineMath>{". We hold the observed rows fixed and ask how plausible their joint measurements are under different parameter states "}<InlineMath>{"\\theta=(\\pi,\\mu,\\Sigma)"}</InlineMath>{"."}</Prose>

<Prose>{"The fitted model assumes observations are independently sampled from this same mixture conditional on those shared parameters. Under that assumption the "}<strong>{"likelihood"}</strong>{", regarded as a function of the parameters, multiplies the per-row densities:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 15; scroll horizontally when needed"><MathBlock>{"L(\\theta;X)=\\prod_{i=1}^{n}p_\\theta(x_i)\n=\\prod_{i=1}^{n}\\left[\\sum_{k=1}^{K}\\pi_k\\,\\mathcal N(x_i\\mid\\mu_k,\\Sigma_k)\\right]."}</MathBlock></div>

<Prose>{"The inner sum still adds possible sources for ONE row; the outer product combines DIFFERENT observed rows. Neither operation multiplies responsibilities. These are densities with the declared measurement units, not probabilities of exact continuous points. The independence assumption would need reconsideration for dependent repeated or time-ordered measurements."}</Prose>

<Prose>{"Natural logs turn that product into a sum and preserve its ordering because log is increasing:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 16; scroll horizontally when needed"><MathBlock>{"\\ell(\\theta;X)=\\log L(\\theta;X)\n=\\sum_{i=1}^{n}\\log\\left[\\sum_{k=1}^{K}\\pi_k\\,\\mathcal N(x_i\\mid\\mu_k,\\Sigma_k)\\right],\n\\qquad \\bar\\ell=\\ell/n."}</MathBlock></div>

<Prose>{"Each row's component sum remains INSIDE its log. It cannot be replaced by a sum of component logs: the hidden alternatives couple the parameters. For these fixed rows, the ports contain:"}</Prose>

<NeuralTable caption={"7. Alternate allocations and parameters without mixing times"} headers={[<>{"Observed ID"}</>,<>{"x"}</>,<>{"Mixture density under initial parameters"}</>,<>{"Natural log of that density"}</>]} rows={[[<>{"A"}</>,<>{"-2"}</>,<>{".123201286466"}</>,<>{"-2.093935785847"}</>],[<>{"B"}</>,<>{"-1"}</>,<>{".226466623457"}</>,<>{"-1.485157702722"}</>],[<>{"C"}</>,<>{"1"}</>,<>{".226466623457"}</>,<>{"-1.485157702722"}</>],[<>{"D"}</>,<>{"2"}</>,<>{".123201286466"}</>,<>{"-2.093935785847"}</>]]} />

<Prose>{"Multiply the four densities to obtain approximately .000778464649, or add the four logs to obtain total -7.158186977. A and D have equal densities but remain two observed rows, so both contribute. Dividing by four gives mean -1.789546744 nats per row. These displayed operands are rounded; reductions use their full values. In "}<code>{"em_1d.py"}</code>{", "}<code>{"log_density"}</code>{" holds these four per-row logs and "}<code>{"log_density.sum()"}</code>{" is precisely the outer reduction. "}<code>{"GaussianMixtureState.score_samples"}</code>{" supplies row logs, while its "}<code>{"score"}</code>{" takes their mean. D33 will retain both reductions beside the trace. Logs also avoid multiplying many tiny floating-point densities; the earlier stable inner log-sum-exp computes each row's mixture log before this outer sum."}</Prose>

<Prose>{"In the E-step, old parameters stay fixed while every row gets its conditional allocation. In the M-step, those used allocations stay fixed while the parameters change. A fresh E-step then evaluates the new parameters. After the first parameter update the same rows have total log likelihood -6.461856301. An E-step alone changes no fitted parameter and therefore no model likelihood."}</Prose>

<Prose>{"The name "}<strong>{"expectation–maximization"}</strong>{", or EM, describes this alternating calculation. The expectation step averages a complete-data log expression over the unobserved source labels; the maximization step improves it with those conditional shares fixed. For now, the visible operation is enough. Section 12 will construct the full common bound that explains its improvement."}</Prose>

<GaussianSingleEntityEm />

<Prose>{"The two local editors ask different questions. One chooses an observation ID and edits that observation's x. The other chooses a component ID and edits its starting mean. Editing either restarts the coherent state at step zero. E, M, Back and Reset show actual changes; no answer is hidden. Reset clears invalid drafts even if the last valid value already equals its default, and restores the selected IDs and history."}</Prose>

<Prose>{"Change D from 2 to 3 while keeping the other setup fixed. The first Right count becomes 2.015513587, its mean 1.844792261 and its variance 1.582910448. The changed row carries its ID through all products. Choosing another observation loads its own value; it must not inherit D's draft."}</Prose>

<GaussianStationaryEm />

<Prose>{"At zero separation with both means 0 and variances 2.5, all shares are .5. The M-step returns means 0 and variances 2.5. Its total log likelihood is ℓ = -7.508335597, unchanged through the cycle. A plateau can be an exactly stationary symmetric description, not proof that a strict local or global maximum was found. The ordinary separated variance-1 example stays a separately named reference because it changes more than separation."}</Prose>

<GaussianRepeatedRowFloorLab />

<Prose>{"Repeated rows -2,-2,2,2 with means -2/+2 produce a tiny raw first scatter, about .0053638. With variance floor .25, the used variance is .25 and its drawn standard deviation is .5. The floor replaces only a scatter below its constraint; it does not add .25 to every result."}</Prose>

<GaussianRecordedObjectiveTrace /><GaussianObjectiveTraceLab /><GaussianFlatObjectiveReference />

<Prose>{"The objective trace marks parameter states, total log likelihood ℓ, mean log likelihood ℓ/n and signed log-likelihood gain. Divide the total log likelihood by the number of observations n to obtain the mean, in nats per row. Negative values of log likelihood need an ordinary linear vertical scale, not a logarithmic axis applied to negative numbers. Tick decimation affects only labels; all stored states remain available. A flat trace has a disclosed narrow range rather than fabricated wiggles."}</Prose>

<Prose>{"Here is the complete preserved scalar NumPy program and its six recorded log-likelihood states. Its "}<code>{"expectation"}</code>{" function uses weighted log terms and row normalization. The loop then computes the new weighted centre and scatter with its explicit .05 floor, and calls "}<code>{"expectation"}</code>{" again on the new state. It prints the objective under each updated state, rather than mixing an old score with new means. It needs NumPy and no sibling data file. These are the original source and full original output; the general multidimensional implementation will appear after section 9's family and memory anatomy."}</Prose>

<Prose>{"Complete original source and its retained historical full stdout."}</Prose>

<RemoteCodeBlock filename="em_1d.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/em_1d.py" />

<CodeBlock kind="output" filename="em_1d.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/em_1d.stdout">{"initial log-likelihood -7.158187\n1 -6.461856\n2 -5.724278\n3 -5.675743\n4 -5.675742\n5 -5.675742\nmeans [-1.499994  1.499994]\nvariances [0.250018 0.250018]\nrow sums [1. 1. 1. 1.]"}</CodeBlock>

<Prose>{"Stopping after a small likelihood change is a numerical rule, not a guarantee about global optimization. A fixed iteration budget and explicit finite-domain checks make the route reproducible. Multiple starts explore different initial descriptions but remain a finite search. The next question is why an objective can improve for an undesirable reason."}</Prose>

<H2>{"8. What permits a curve to collapse?"}</H2>

<Prose>{"Likelihood can rise when a component shrinks onto one recorded observation."}</Prose>

<GaussianCollapseContextLab />

<Prose>{"Left is centred at -2 while Right keeps a broad variance 4. As Left's standard deviation shrinks, its half-unit area stays fixed and its peak grows as "}<InlineMath>{".5/(\\sigma\\sqrt{2\\pi})"}</InlineMath>{". The common physical ruler shows the shrinking width; the separately labelled magnification makes the narrow spike readable without broadening the fitted curve. Exact peak text supplements finite plotting resolution."}</Prose>

<GaussianCollapseLikelihood />

<Prose>{"At standard deviations 1,.1,.01,.001, the preserved total log-likelihood values are -8.122121377,-6.945323529,-4.669586147,-2.369725898. The horizontal ticks are logarithmic SD values; the vertical axis shows total log likelihood on an ordinary linear scale. These four computations illustrate the limit. Analytically, the density at the centred observation diverges as its width goes to zero, while the broad component keeps positive density at the other observations. Thus an unconstrained mixture likelihood can have no finite maximizing state."}</Prose>

<GaussianVarianceConstraintLab /><GaussianSpectralFloorComparison />

<Prose>{"The raw scalar scatter is s=.02 and the feasible variance must satisfy "}<InlineMath>{"v\\ge\\varepsilon=.05"}</InlineMath>{". The fixed-allocation variance objective, ignoring constants independent of v, is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 17; scroll horizontally when needed"><MathBlock>{"Q(v)=-\\frac{N_k}{2}[\\log v+s/v],\\qquad\nQ'(v)=\\frac{N_k(s-v)}{2v^2}."}</MathBlock></div>

<Prose>{"The derivative is positive below s and negative above it. If s is feasible, its maximum is s; if s is below the boundary, the objective decreases throughout the feasible region and its maximum is the boundary. The exact constrained update is therefore "}<InlineMath>{"\\max(s,\\varepsilon)"}</InlineMath>{", here .05. Adding the same value gives .07, a different operation and a smaller Q for this case. With zero raw scatter and positive floor, the boundary still gives a finite valid variance."}</Prose>

<Prose>{"The static matrix extension clips eigenvalues of diag(.02,.2) to diag(.05,.2). Adding .05 to the diagonal instead gives diag(.07,.25). The two scatter cells make the difference concrete. The general ordinary-parity implementation below uses "}<strong>{"addition"}</strong>{"; it does not borrow the exact scalar clipping theorem or claim to be a full spectral-floor trainer."}</Prose>

<Prose>{"Exact E/M improves or preserves the "}<strong>{"same"}</strong>{" objective when both steps optimize it under the same domain. A fixed positive scalar floor bounds density and the exact constrained M-step supports the analogous constrained monotonic argument. Additive regularization, reseeding, approximate steps or changed domains need their own qualification. Bounded objective values alone do not prove parameter convergence or a maximum; the stationary example already shows why strict improvement is not guaranteed."}</Prose>

<GaussianComponentPermutation />

<Prose>{"Permuting all component weights, means, covariances and share columns preserves density. On the untied batch [-3,-1,1,3] under means -2/+2, unit variances and equal weights, labels [0,0,1,1] become [1,1,0,0]: the partition is purely renamed. On [-3,0,3], first-array-position argmax instead gives [0,0,1] before and [1,0,0] after, rather than the pure rename [1,1,0]. The tied middle row joins a different physical group. Density and column invariance still hold; hard-partition invariance is not guaranteed under positional ties."}</Prose>

<Prose>{"Swapping means alone is not generally a harmless rename because weights and covariances may differ. Equal weights and identical covariances are an exception: their means-only swap still gives the same density. The supplied unequal-weight example [.25,.75] changes query .25's density from .0726429020788005 to .045374068583378446. Coincident components give another nonunique description: redistributing their weights preserves the density. These identity issues and multiple starts explain why “the learned component names are unique” is an inappropriate claim."}</Prose>

<Prose>{""}<code>{"gaussian_failure_modes.py"}</code>{" supplies the collapse values, exact scalar Q comparison, stationary update and empty-component status. It evaluates fixed states, not a new real-data fit. Numerical underflow and mathematical singularity differ: log-sum-exp fixes avoidable normalization underflow, whereas an invalid covariance requires a declared modelling constraint or rejection. A guard must not silently fabricate a supported density."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="gaussian_failure_modes.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_failure_modes.py" />

<CodeBlock kind="output" filename="gaussian_failure_modes.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_failure_modes.stdout">{"collapse SD/total likelihood 1 -8.122121376997402\ncollapse SD/total likelihood 0.1 -6.945323529427528\ncollapse SD/total likelihood 0.01 -4.669586146668674\ncollapse SD/total likelihood 0.001 -2.3697258984019505\nvariance policy exact floor variance 0.05 Q 2.595732273553991\nvariance policy additive variance 0.07 Q 2.3735457512184923\nstationary responsibilities [[0.49999999999999994, 0.49999999999999994], [0.49999999999999994, 0.49999999999999994], [0.49999999999999994, 0.49999999999999994], [0.49999999999999994, 0.49999999999999994]]\nstationary new state [0.49999999999999994, 0.49999999999999994] [0.0, 0.0] [2.5, 2.5]\nstationary total likelihood -7.508335596567\nempty status unidentified empty component IDs [1]\nzero raw scatter floor [0.05]"}</CodeBlock>

<Prose>{"Constraints can stabilize a fit. Restricting geometric freedoms can also make its complexity more appropriate."}</Prose>

<H2>{"9. Covariance families remove different geometric freedoms"}</H2>

<Prose>{"A stable model can still have more shape parameters than its evidence supports."}</Prose>

<GaussianCovarianceFamilies />

<Prose>{"Each matrix is paired with the ellipse it actually produces, under common equal-scale axes. "}<strong>{"Full"}</strong>{" gives each component its own symmetric covariance. "}<strong>{"Tied"}</strong>{" shares one complete matrix, so both ellipses have the same shape and orientation. "}<strong>{"Diagonal"}</strong>{" removes cross cells in the original feature coordinates, while retaining separate coordinate widths. "}<strong>{"Spherical"}</strong>{" uses one variance per component and a circular contour; the two circles can have different radii. Tied does not mean diagonal, and spherical does not mean one fixed common variance."}</Prose>

<GaussianScatterRestrictions />

<Prose>{"Keep the supplied rows, shares and new means fixed. Full keeps each weighted centered scatter. Diagonal retains its diagonal. Spherical averages its coordinate variances using trace/d. Tied sums every component's centered scatter numerator and divides by n, not by K. An unweighted average of per-component covariance would be wrong when effective counts differ. The named .05 addition occurs after the selected restriction. These are four updates of one supplied allocation, not four newly fitted rankings."}</Prose>

<GaussianParameterCounts />

<Prose>{"Count independently adjustable values. There are Kd mean coordinates and K-1 free weights. Full covariance adds "}<InlineMath>{"Kd(d+1)/2"}</InlineMath>{" cells; tied adds "}<InlineMath>{"d(d+1)/2"}</InlineMath>{"; diagonal adds Kd; spherical adds K. For K=3,d=2 the totals are 17,11,14,11. Mirrored cross cells count once; K=1 has no free mixture weight. Equal counts for two families do not make their allowed geometries identical."}</Prose>

<GaussianDiagonalDependence />

<Prose>{"Two diagonal identity components centred at (-2,-2)/(2,2) have within covariance I, but their mixture has between covariance [[4,4],[4,4]], hence total [[5,4],[4,5]]. Its cross covariance is 4. Coordinate independence inside each component does not imply independence after selecting a shared hidden source. The aggregate moment-matching Gaussian ellipse is labelled separately; it is not an exact isodensity contour of the mixture. PCA's zero-covariance dependence example explains why the converse implication also fails in general."}</Prose>

<GaussianTwoPassBuffers />

<Prose>{"The data array has n rows and d columns, while a working block has B rows. Freeze the old fitted state. In pass one, each B-by-K responsibility block adds effective counts and stable weighted centres. Once all new centres are known, pass two recomputes responsibilities from that "}<strong>{"same old state"}</strong>{" and accumulates scatter around the new centres. Only after pass two do all weights, means and covariances update together. Inserting new parameters midway would define a different online algorithm."}</Prose>

<Prose>{"To merge an existing count c/centre m with a block count b/centre u, use "}<InlineMath>{"m\\leftarrow m+\\frac b{c+b}(u-m)"}</InlineMath>{". The block centre is computed relative to a nearby row origin. Both choices reduce large raw-coordinate products and cancellation. Zero-mass blocks contribute nothing. An effective count below the declared numerical threshold "}<InlineMath>{"10^{-12}n"}</InlineMath>{" rejects that restart with its component ID; no unrecorded reseed or pseudo-count is inserted."}</Prose>

<Prose>{"Full-covariance work per cycle is O(nKd²+Kd³), with working storage O(B(d+K)+Kd²+Kd+K), excluding input and requested output. It does not construct a giant n-by-K-by-d residual array. Diagonal and spherical operations dispatch through coordinate/scalar variances and use O(nKd+Kd) arithmetic. Tied density evaluation can whiten each block once, O(nd²+nKd+d³); the transparent centered tied M-step still accumulates O(nKd²). This reference chooses stability and inspectability; these are algorithmic costs, not measured speed claims or a distributed-training promise."}</Prose>

<Prose>{"Now introduce the new six-row toy: (-2,-1),(-2,1),(-1,0),(1,0),(2,-1),(2,1), starting means (-1,0)/(1,0), identity covariances and equal weights. "}<code>{"gaussian_em.py"}</code>{" implements the complete prepared-state inference, two-pass updates, trace, stopping and empty-mass policy. It adds .05 regularization, uses a block of 2, a budget of 50 cycles and an absolute/relative mean-score tolerance of "}<InlineMath>{"10^{-8}"}</InlineMath>{". It keeps initial and post-update objectives distinct and retains signed decreases as diagnostics. Its recorded full-family toy stops after 5 updates at mean score -2.5871652954984796. That convergence flag means its declared numerical rule."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="gaussian_em.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_em.py" />

<CodeBlock kind="output" filename="gaussian_em.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_em.stdout">{"one-cycle family full means [[-1.5392348254196775, 0.0], [1.5392348254196773, 0.0]] covariances [[[0.6807561522152552, -1.791723662810622e-18], [-1.791723662810622e-18, 0.7166666666666668]], [[0.6807561522152549, 1.4438250903008936e-19], [1.4438250903008936e-19, 0.7166666666666667]]]\none-cycle family tied means [[-1.5392348254196775, 0.0], [1.5392348254196773, 0.0]] covariances [[0.680756152215255, -8.236705768902662e-19], [-8.236705768902662e-19, 0.7166666666666667]]\none-cycle family diag means [[-1.5392348254196775, 0.0], [1.5392348254196773, 0.0]] covariances [[0.6807561522152552, 0.7166666666666668], [0.6807561522152549, 0.7166666666666667]]\none-cycle family spherical means [[-1.5392348254196775, 0.0], [1.5392348254196773, 0.0]] covariances [0.698711409440961, 0.6987114094409608]\nfull toy convergence True iterations 5\nfull toy weights [0.5000000000000001, 0.5000000000000001]\nfull toy means [[-1.6666634586047961, 0.0], [1.6666634586047961, 0.0]]\nfull toy covariance [[[0.27223291575149905, 4.477065615568833e-20], [4.477065615568833e-20, 0.7166666666666668]], [[0.27223291575149905, -4.477065615568833e-20], [-4.477065615568833e-20, 0.7166666666666668]]]\nfull toy current mean score -2.5871652954984796\nfull toy trace [{'iteration': 0, 'mean_log_likelihood': -3.1432816246764266, 'total_log_likelihood': -18.85968974805856, 'signed_gain': 0, 'decrease': False}, {'iteration': 1, 'mean_log_likelihood': -2.80875591911072, 'total_log_likelihood': -16.85253551466432, 'signed_gain': 0.3345257055657065, 'decrease': False}, {'iteration': 2, 'mean_log_likelihood': -2.5968010920167974, 'total_log_likelihood': -15.580806552100785, 'signed_gain': 0.21195482709392266, 'decrease': False}, {'iteration': 3, 'mean_log_likelihood': -2.5871722616629147, 'total_log_likelihood': -15.523033569977489, 'signed_gain': 0.009628830353882734, 'decrease': False}, {'iteration': 4, 'mean_log_likelihood': -2.5871652990124008, 'total_log_likelihood': -15.522991794074404, 'signed_gain': 6.962650513919755e-06, 'decrease': False}, {'iteration': 5, 'mean_log_likelihood': -2.5871652954984796, 'total_log_likelihood': -15.522991772990878, 'signed_gain': 3.5139211540524684e-09, 'decrease': False}]"}</CodeBlock>

<Prose>{"The ordinary route is "}<code>{"GaussianMixture"}</code>{". "}<code>{"n_components"}</code>{" and "}<code>{"covariance_type"}</code>{" define the represented family. "}<code>{"weights_init"}</code>{", "}<code>{"means_init"}</code>{" and "}<code>{"precisions_init"}</code>{" declare the same starting state; precisions are inverse covariances, not Cholesky factors. "}<code>{"n_init=1"}</code>{", seed 16, "}<code>{"reg_covar=.05"}</code>{", "}<code>{"tol=1e-8"}</code>{" and the iteration budget are explicit. The complete one-cycle comparison records maximum mean/covariance discrepancies approximately "}<InlineMath>{"1.55\\times10^{-15}"}</InlineMath>{" and "}<InlineMath>{"6.66\\times10^{-16}"}</InlineMath>{". Both current scores are -2.80875591911072."}</Prose>

<Prose>{"At this one-update budget, the ordinary estimator correctly reports not converged. Its stored "}<code>{"lower_bound_"}</code>{" is -3.1432816246764266, the pre-update evaluation; calling "}<code>{"score"}</code>{" evaluates its current state. The deliberate separate full toy continuation takes 6 iterations under the package's timing/criterion and reaches -2.587165295496707. Close scores do not imply identical stopping semantics. Ordinary "}<code>{"reg_covar"}</code>{" adds to diagonals and its near-empty count arithmetic differs from our explicit rejection policy."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="ordinary_gaussian_em.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/ordinary_gaussian_em.py" />

<CodeBlock kind="output" filename="ordinary_gaussian_em.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/ordinary_gaussian_em.stdout">{"one-cycle convergence False\none-cycle convergence-warning count 1\none-cycle mean max error 1.5543122344752192e-15\none-cycle covariance max error 6.661338147750939e-16\none-cycle current score -2.80875591911072\none-cycle recorded lower bound -3.1432816246764266\none-cycle posterior max error 3.8163916471489756e-17\nordinary full toy convergence True iterations 6\nordinary full toy means [[-1.6666634586063709, 0.0], [1.6666634586063716, 0.0]]\nordinary full toy covariance [[[0.2722329157462432, 0.0], [-6.077901645627439e-18, 0.7166666666666661]], [[0.2722329157462432, 0.0], [6.077901652396769e-18, 0.7166666666666661]]]\nordinary full toy current score -2.587165295496707\nordinary query scores [-6.122576971273187, -4.211600208433882, -5.676771377695335]\nordinary query responsibilities [[0.5000000000000009, 0.49999999999999906], [0.002188830425428424, 0.9978111695745718], [1.1142497223277572e-16, 1.0]]"}</CodeBlock>

<Prose>{"The complete general sources now connect each family branch to its geometry and output. We can now choose a density model without confusing parameter count, training score and the reserved question."}</Prose>

<H2>{"10. Choose a density model with an explicit evidence boundary"}</H2>

<Prose>{"Added flexibility needs comparison on the same rows, units and declared decision rule."}</Prose>

<GaussianInformationCriteria />

<Prose>{"Two constructed candidates have total training log likelihoods -150/-143 and independent parameter counts 5/11 on n=100 rows. The more flexible one improves the training likelihood. AIC adds twice the parameter count to negative twice the log likelihood: 310 versus 308, favouring the second. BIC instead adds log(n) times the count: 323.025851 versus 336.656872, favouring the first. The smaller-preferred marker is distinct from component identity."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 18; scroll horizontally when needed"><MathBlock>{"\\mathrm{AIC}=2p-2\\ell,\\qquad \\mathrm{BIC}=p\\log n-2\\ell."}</MathBlock></div>

<Prose>{"These criteria trade fit and complexity under their assumptions; they are not model probabilities or guarantees of the true number of sources. Mixtures can be singular and nonidentifiable, so classical regular asymptotic arguments need care. We will use one explicit validation rule for the real comparison, while retaining training BIC as a separate diagnostic."}</Prose>

<GaussianDensityUnits />

<Prose>{"Convert both coordinates from centimetres to millimetres. The Jacobian determinant is 100, so the same model's log density changes by "}<InlineMath>{"-\\log100"}</InlineMath>{" per row. Total log likelihood ℓ changes by "}<InlineMath>{"-n\\log100"}</InlineMath>{". Equivalently, the likelihood product L is multiplied by "}<InlineMath>{"100^{-n}"}</InlineMath>{"; this multiplicative change becomes an additive shift after taking its logarithm. A common conversion preserves relative ordering between models on the same observations; comparing uncorrected scores across different representations changes the question. The train-owned standardization below is another coordinate transform. Its reported scores are explicitly in standardized coordinates."}</Prose>

<GaussianSavedTrainingTransform />

<Prose>{"Return to observed ID 34: (5.5 cm,4.2 cm), test. The training means and scales place it at approximately (-.328032669,2.660974021) in standardized coordinates. The fixed 90/30/30 ID lists remain beside the rows. Neither this observation nor a selected query refits the scaler. A covariance transforms with its coordinates: if raw coordinates equal a diagonal scale D times standardized coordinates plus a mean, then "}<InlineMath>{"\\Sigma_{raw}=D\\Sigma_{standardized}D^T"}</InlineMath>{"."}</Prose>

<NeuralTable caption={"10. Choose a density model with an explicit evidence boundary"} headers={[<>{"Role"}</>,<>{"All original row IDs"}</>]} rows={[[<>{"train"}</>,<>{"71, 132, 135, 149, 110, 69, 30, 4, 112, 68, 101, 79, 56, 41, 97, 36, 6, 24, 89, 127, 60, 81, 118, 7, 75, 85, 5, 103, 124, 12, 17, 26, 128, 138, 15, 113, 55, 108, 28, 46, 23, 141, 53, 133, 9, 76, 25, 40, 87, 48, 77, 145, 92, 27, 65, 143, 21, 1, 8, 140, 136, 73, 61, 91, 20, 2, 72, 122, 114, 47, 42, 35, 95, 80, 31, 39, 19, 45, 121, 54, 78, 82, 125, 18, 94, 100, 37, 144, 105, 52"}</>],[<>{"validation"}</>,<>{"137, 11, 107, 32, 44, 147, 131, 62, 50, 49, 57, 98, 83, 142, 64, 117, 93, 43, 58, 16, 70, 66, 63, 116, 14, 115, 33, 22, 51, 134"}</>],[<>{"test"}</>,<>{"34, 148, 123, 74, 126, 104, 119, 130, 29, 59, 90, 3, 10, 13, 86, 88, 38, 102, 129, 120, 109, 84, 139, 99, 96, 106, 146, 111, 150, 67"}</>]]} />

<GaussianSavedModelGrid />

<Prose>{"The complete saved grid has four covariance families and K=1,2,3,4, sixteen candidates. Each used five initializations, seed 16, added regularization "}<InlineMath>{"10^{-4}"}</InlineMath>{", tolerance "}<InlineMath>{"10^{-6}"}</InlineMath>{", and a 500-iteration budget on the 90 training rows. Mean validation log density selected full covariance with K=2 at -2.668799817608869. Full K=3 is close at -2.671121581431881; the exact table prevents a visual claim of a decisive gap. Every K=1 baseline and every outcome stays visible."}</Prose>

<Prose>{"Training BIC selects full K=4 at 461.59516764543383, a different rule from validation density. It remains a diagnostic, not a second opportunity to choose after seeing the test set. Convergence and iteration counts are recorded for every candidate. Species labels were not used in any choice."}</Prose>

<NeuralTable caption={"10. Choose a density model with an explicit evidence boundary"} headers={[<>{"Family"}</>,<>{"K"}</>,<>{"Train mean log density"}</>,<>{"Validation mean log density"}</>,<>{"Train AIC"}</>,<>{"Train BIC"}</>,<>{"Converged"}</>,<>{"Iterations"}</>]} rows={[[<>{"full"}</>,<>{"1"}</>,<>{"-2.8374392739288776"}</>,<>{"-2.9348813779345044"}</>,<>{"520.739069307198"}</>,<>{"533.2381176588493"}</>,<>{"True"}</>,<>{"2"}</>],[<>{"full"}</>,<>{"2"}</>,<>{"-2.45141736683905"}</>,<>{"-2.668799817608869"}</>,<>{"463.255126031029"}</>,<>{"490.75303240466195"}</>,<>{"True"}</>,<>{"16"}</>],[<>{"full"}</>,<>{"3"}</>,<>{"-2.3351934494132025"}</>,<>{"-2.671121581431881"}</>,<>{"454.33482089437643"}</>,<>{"496.8315852899909"}</>,<>{"True"}</>,<>{"7"}</>],[<>{"full"}</>,<>{"4"}</>,<>{"-1.9894419179324319"}</>,<>{"-3.2567488104878586"}</>,<>{"404.0995452278377"}</>,<>{"461.59516764543383"}</>,<>{"True"}</>,<>{"198"}</>],[<>{"tied"}</>,<>{"1"}</>,<>{"-2.8374392739288776"}</>,<>{"-2.9348813779345044"}</>,<>{"520.739069307198"}</>,<>{"533.2381176588493"}</>,<>{"True"}</>,<>{"2"}</>],[<>{"tied"}</>,<>{"2"}</>,<>{"-2.578660526953492"}</>,<>{"-2.7297286031377186"}</>,<>{"480.1588948516286"}</>,<>{"500.1573722142707"}</>,<>{"True"}</>,<>{"4"}</>],[<>{"tied"}</>,<>{"3"}</>,<>{"-2.483945952736711"}</>,<>{"-2.741335717952299"}</>,<>{"469.11027149260804"}</>,<>{"496.60817786624096"}</>,<>{"True"}</>,<>{"13"}</>],[<>{"tied"}</>,<>{"4"}</>,<>{"-2.4261654956281946"}</>,<>{"-2.787304712288306"}</>,<>{"464.70978921307506"}</>,<>{"499.7071245976988"}</>,<>{"True"}</>,<>{"31"}</>],[<>{"diag"}</>,<>{"1"}</>,<>{"-2.837877071408679"}</>,<>{"-2.9396602159528853"}</>,<>{"518.8178728535622"}</>,<>{"528.8171115348833"}</>,<>{"True"}</>,<>{"2"}</>],[<>{"diag"}</>,<>{"2"}</>,<>{"-2.713786310370273"}</>,<>{"-2.9636114626055714"}</>,<>{"506.4815358666491"}</>,<>{"528.9798228996215"}</>,<>{"True"}</>,<>{"25"}</>],[<>{"diag"}</>,<>{"3"}</>,<>{"-2.6352380435622584"}</>,<>{"-3.2537749616508695"}</>,<>{"502.3428478412065"}</>,<>{"537.3401832258302"}</>,<>{"True"}</>,<>{"22"}</>],[<>{"diag"}</>,<>{"4"}</>,<>{"-2.532802268351415"}</>,<>{"-2.820248255687074"}</>,<>{"493.90440830325474"}</>,<>{"541.4007920395297"}</>,<>{"True"}</>,<>{"20"}</>],[<>{"spherical"}</>,<>{"1"}</>,<>{"-2.837877071408679"}</>,<>{"-2.9396602159528853"}</>,<>{"516.8178728535622"}</>,<>{"524.3173018645531"}</>,<>{"True"}</>,<>{"2"}</>],[<>{"spherical"}</>,<>{"2"}</>,<>{"-2.753109233310528"}</>,<>{"-2.922017643949057"}</>,<>{"509.55966199589506"}</>,<>{"527.0583296882069"}</>,<>{"True"}</>,<>{"70"}</>],[<>{"spherical"}</>,<>{"3"}</>,<>{"-2.654197021883031"}</>,<>{"-2.9687638211874097"}</>,<>{"499.7554639389456"}</>,<>{"527.2533703125785"}</>,<>{"True"}</>,<>{"43"}</>],[<>{"spherical"}</>,<>{"4"}</>,<>{"-2.582306920332409"}</>,<>{"-2.925479969633843"}</>,<>{"494.81524565983364"}</>,<>{"532.3123907147876"}</>,<>{"True"}</>,<>{"97"}</>]]} />

<GaussianNarrowFittedComponent />

<Prose>{"Inspect the full K=4 diagnostic's retained component 0. Its weight is .148476513 and its standardized covariance is approximately diag(1.313807522156,.0001). After converting back, its raw width mean is 3 cm and width SD is .004208985 cm, much smaller than the .1 cm recording resolution. A full-context ellipse and a labelled magnification both show that actual width. The drawing never widens its covariance for visibility."}</Prose>

<Prose>{"Training observations recorded with width exactly 3 cm are measurement facts. The historical analysis also reports fourteen training assignments to this component, but that ID list was not retained. We can preserve the attributed aggregate without pretending the missing per-ID membership is saved state. Quantization and narrow fit geometry help explain why a high training density may not transfer well."}</Prose>

<GaussianReservedTestResult />

<Prose>{"Now open the reserved answer. The selected full K=2 model's test mean log density is "}<strong>{"-3.0112234685906634"}</strong>{". The regularized full K=1 baseline gives "}<strong>{"-2.8872488178783784"}</strong>{". Higher is better, so the selected mixture is worse by .123974650712285 nats per row. Keep the validation choice after seeing this answer; changing it retroactively would destroy the reserved comparison. This collection and split do not support a universal conclusion that mixtures are worse, but they do refute a story that added flexibility necessarily helped here."}</Prose>

<GaussianSavedPartition />

<Prose>{"The thirty saved component IDs form a partition, while species annotations form a different partition with counts 6,9,15. Their complete contingency cells support the retained adjusted Rand index .4334462099505079. ARI compares agreements among observation pairs with chance adjustment; it is not a density or species posterior. A pure renaming of "}<strong>{"already saved"}</strong>{" component IDs preserves the partition and ARI. Recomputing positional argmax after a parameter permutation can have the exact-tie exception from section 8, so those two operations are not conflated."}</Prose>

<NeuralTable caption={"10. Choose a density model with an explicit evidence boundary"} headers={[<>{"Observed ID"}</>,<>{"Species annotation"}</>,<>{"Saved component ID"}</>,<>{"Saved standardized log density"}</>,<>{"Saved responsibilities, component order"}</>]} rows={[[<>{"34"}</>,<>{"setosa"}</>,<>{"0"}</>,<>{"-4.861127656094386"}</>,<>{"[0.9999999640076982, 3.599230175087111e-08]"}</>],[<>{"148"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-1.6762987141540497"}</>,<>{"[4.683585173019182e-14, 0.9999999999999531]"}</>],[<>{"123"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-7.09187787320219"}</>,<>{"[5.808392740499048e-39, 1.0]"}</>],[<>{"74"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-1.623133763191841"}</>,<>{"[2.5377714093999767e-11, 0.9999999999746223]"}</>],[<>{"126"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-2.6160837769634826"}</>,<>{"[2.625377880170956e-22, 1.0]"}</>],[<>{"104"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-1.6025821472697688"}</>,<>{"[1.2583325568686903e-12, 0.9999999999987417]"}</>],[<>{"119"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-9.44145997432594"}</>,<>{"[1.1340660471594801e-42, 1.0]"}</>],[<>{"130"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-3.095713504753416"}</>,<>{"[1.9801976094510884e-25, 1.0]"}</>],[<>{"29"}</>,<>{"setosa"}</>,<>{"0"}</>,<>{"-1.633627370131325"}</>,<>{"[0.9993359006143201, 0.0006640993856799408]"}</>],[<>{"59"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-1.8783346112961252"}</>,<>{"[6.934852370045681e-17, 1.0]"}</>],[<>{"90"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-2.250397670786697"}</>,<>{"[3.724466075671096e-08, 0.9999999627553391]"}</>],[<>{"3"}</>,<>{"setosa"}</>,<>{"0"}</>,<>{"-1.6516444680533833"}</>,<>{"[0.9997726572379464, 0.0002273427620535542]"}</>],[<>{"10"}</>,<>{"setosa"}</>,<>{"0"}</>,<>{"-1.9736595085487412"}</>,<>{"[0.99501827936098, 0.004981720639019914]"}</>],[<>{"13"}</>,<>{"setosa"}</>,<>{"0"}</>,<>{"-2.325810798849463"}</>,<>{"[0.9895481830668081, 0.010451816933192092]"}</>],[<>{"86"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-4.441724731446318"}</>,<>{"[0.0023727823230005676, 0.9976272176769992]"}</>],[<>{"88"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-4.6642938043106685"}</>,<>{"[7.049342647967378e-21, 1.0]"}</>],[<>{"38"}</>,<>{"setosa"}</>,<>{"0"}</>,<>{"-1.9864664360034878"}</>,<>{"[0.9999974136126923, 2.5863873075097594e-06]"}</>],[<>{"102"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-1.782869335257327"}</>,<>{"[5.180618268127463e-09, 0.9999999948193816]"}</>],[<>{"129"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-1.8209545883988603"}</>,<>{"[2.5072586146616247e-15, 0.9999999999999976]"}</>],[<>{"120"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-4.604256761694943"}</>,<>{"[7.100591371841683e-18, 1.0]"}</>],[<>{"109"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-4.398230037702578"}</>,<>{"[2.1470157038732916e-24, 1.0]"}</>],[<>{"84"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-1.7354772038016044"}</>,<>{"[2.4793749978588448e-11, 0.9999999999752063]"}</>],[<>{"139"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-1.9356135186794088"}</>,<>{"[9.6273799680274e-08, 0.9999999037262004]"}</>],[<>{"99"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-2.8924023008693234"}</>,<>{"[0.00011273984407850083, 0.9998872601559216]"}</>],[<>{"96"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-2.6003642368907953"}</>,<>{"[0.00011135568940513764, 0.9998886443105951]"}</>],[<>{"106"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-4.840474916948212"}</>,<>{"[2.9450640263636172e-33, 1.0]"}</>],[<>{"146"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-1.869648695787464"}</>,<>{"[5.281757836875666e-17, 1.0]"}</>],[<>{"111"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-2.021291772887461"}</>,<>{"[1.930065931486285e-11, 0.9999999999806994]"}</>],[<>{"150"}</>,<>{"virginica"}</>,<>{"1"}</>,<>{"-2.1147936945882226"}</>,<>{"[1.1613611444172678e-06, 0.9999988386388556]"}</>],[<>{"67"}</>,<>{"versicolor"}</>,<>{"1"}</>,<>{"-2.906090184832405"}</>,<>{"[0.0008845243596339308, 0.9991154756403662]"}</>]]} />

<Prose>{"The cells below count the already saved IDs; they do not rerun fitting or score the reserved rows again."}</Prose>

<NeuralTable caption={"10. Choose a density model with an explicit evidence boundary"} headers={[<>{"Species annotation"}</>,<>{"Component 0"}</>,<>{"Component 1"}</>]} rows={[[<>{"setosa"}</>,<>{"6"}</>,<>{"0"}</>],[<>{"versicolor"}</>,<>{"0"}</>,<>{"9"}</>],[<>{"virginica"}</>,<>{"0"}</>,<>{"15"}</>]]} />

<Prose>{"The complete ordinary "}<code>{"iris_density.py"}</code>{" gives the actual original recipe: load the corrected CSV, form sepal columns, permute without labels, fit the training scaler, fit the declared sixteen candidates, select only by validation score, then report the selected and baseline test scores and ARI. Its complete original output follows. If you run that recipe independently, record your environment and result separately rather than assuming the saved numbers must be identical on every software version."}</Prose>

<Prose>{"Complete original source and its retained historical full stdout."}</Prose>

<RemoteCodeBlock filename="iris_density.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/iris_density.py" />

<CodeBlock kind="output" filename="iris_density.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/iris_density.stdout">{"covariance K validation_log_density training_BIC\nfull 1 -2.934881 533.238\nfull 2 -2.668800 490.753\nfull 3 -2.671122 496.832\nfull 4 -3.256749 461.595\ntied 1 -2.934881 533.238\ntied 2 -2.729729 500.157\ntied 3 -2.741336 496.608\ntied 4 -2.787305 499.707\ndiag 1 -2.939660 528.817\ndiag 2 -2.963611 528.980\ndiag 3 -3.253775 537.340\ndiag 4 -2.820248 541.401\nspherical 1 -2.939660 524.317\nspherical 2 -2.922018 527.058\nspherical 3 -2.968764 527.253\nspherical 4 -2.925480 532.312\nselected full 2\ntest log-density -3.011223\nbaseline test log-density -2.887249\ntest ARI 0.433446\nfirst test ID 34\nresponsibilities [1. 0.]\nlog-density -4.861128"}</CodeBlock>

<Prose>{"For inspecting the existing result, "}<code>{"saved_iris_mixture.py"}</code>{" and "}<code>{"gmm_saved_iris.json"}</code>{" provide a portable alternative that loads the full-precision state and original reported outcomes. "}<code>{"--report"}</code>{" prints the saved grid and comparison; it does not fit or recompute test aggregates. The JSON includes every candidate's parameter arrays and all retained per-row test outcomes. The original browser's nine-decimal representation is a separately rounded serialization, with a separately named tolerance. It does not replace the surviving full-precision Python state. All file dependencies and data attribution accompany the download."}</Prose>

<Prose>{"Complete saved-outcome reader; full output for --report --query 5.5 4.2. The last query is a separate unlabelled forward evaluation."}</Prose>

<RemoteCodeBlock filename="saved_iris_mixture.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/saved_iris_mixture.py" />

<CodeBlock kind="output" filename="saved_iris_mixture.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/saved_iris_mixture.stdout">{"saved candidate full 1 train -2.8374392739288776 validation -2.9348813779345044 AIC 520.739069307198 BIC 533.2381176588493 converged True iterations 2\nsaved candidate full 2 train -2.45141736683905 validation -2.668799817608869 AIC 463.255126031029 BIC 490.75303240466195 converged True iterations 16\nsaved candidate full 3 train -2.3351934494132025 validation -2.671121581431881 AIC 454.33482089437643 BIC 496.8315852899909 converged True iterations 7\nsaved candidate full 4 train -1.9894419179324319 validation -3.2567488104878586 AIC 404.0995452278377 BIC 461.59516764543383 converged True iterations 198\nsaved candidate tied 1 train -2.8374392739288776 validation -2.9348813779345044 AIC 520.739069307198 BIC 533.2381176588493 converged True iterations 2\nsaved candidate tied 2 train -2.578660526953492 validation -2.7297286031377186 AIC 480.1588948516286 BIC 500.1573722142707 converged True iterations 4\nsaved candidate tied 3 train -2.483945952736711 validation -2.741335717952299 AIC 469.11027149260804 BIC 496.60817786624096 converged True iterations 13\nsaved candidate tied 4 train -2.4261654956281946 validation -2.787304712288306 AIC 464.70978921307506 BIC 499.7071245976988 converged True iterations 31\nsaved candidate diag 1 train -2.837877071408679 validation -2.9396602159528853 AIC 518.8178728535622 BIC 528.8171115348833 converged True iterations 2\nsaved candidate diag 2 train -2.713786310370273 validation -2.9636114626055714 AIC 506.4815358666491 BIC 528.9798228996215 converged True iterations 25\nsaved candidate diag 3 train -2.6352380435622584 validation -3.2537749616508695 AIC 502.3428478412065 BIC 537.3401832258302 converged True iterations 22\nsaved candidate diag 4 train -2.532802268351415 validation -2.820248255687074 AIC 493.90440830325474 BIC 541.4007920395297 converged True iterations 20\nsaved candidate spherical 1 train -2.837877071408679 validation -2.9396602159528853 AIC 516.8178728535622 BIC 524.3173018645531 converged True iterations 2\nsaved candidate spherical 2 train -2.753109233310528 validation -2.922017643949057 AIC 509.55966199589506 BIC 527.0583296882069 converged True iterations 70\nsaved candidate spherical 3 train -2.654197021883031 validation -2.9687638211874097 AIC 499.7554639389456 BIC 527.2533703125785 converged True iterations 43\nsaved candidate spherical 4 train -2.582306920332409 validation -2.925479969633843 AIC 494.81524565983364 BIC 532.3123907147876 converged True iterations 97\nsaved selected ['full', 2]\nsaved selected test -3.0112234685906634\nsaved baseline test -2.8872488178783784\nsaved test difference -0.12397465071228497\nsaved test ARI 0.4334462099505079\nsaved Bayesian sensitivity [{'concentration': 0.01, 'weights': [0.011766109554147355, 0.37484691453806224, 0.6132801979520509, 0.00010572085086849469, 1.0467410977083283e-06, 1.0363773244639192e-08], 'active_above_point01': 3, 'converged': True}, {'concentration': 1, 'weights': [0.011654658058646229, 0.37127737953073353, 0.6074948486339005, 0.005493675813647216, 0.0027228124159074663, 0.0013566255471650901], 'active_above_point01': 3, 'converged': True}, {'concentration': 10, 'weights': [0.011429709465857772, 0.3642662349577417, 0.5969498285922453, 0.01005173101065236, 0.009086231719607287, 0.008216264253895496], 'active_above_point01': 4, 'converged': True}]\nunlabelled query {\"component_id\": 0, \"log_density_standardized\": -4.861127656094387, \"negative_log_density\": 4.861127656094387, \"raw_cm\": [5.5, 4.2], \"responsibilities\": [0.9999999640076982, 3.599230175087111e-08], \"standardized\": [-0.32803266881677073, 2.660974020840593]}"}</CodeBlock>

<Prose>{"A fixed selected state can answer new questions, but each output has a different meaning."}</Prose>

<H2>{"11. Use the result for a question, then recognize its limits"}</H2>

<Prose>{"Density, component membership and generation are different operations on one fitted model."}</Prose>

<GaussianSavedQueryLab />

<Prose>{"The default diamond copies ID 34's 5.5/4.2 cm coordinates into a separate "}<strong>{"unlabelled hypothetical query"}</strong>{". It is not a newly measured test observation or a known species. Apply the saved training transform, compute both weighted log terms, take their log-sum-exp, then normalize them. The executed query gives standardized log density -4.861127656094387, NLL 4.861127656094387, and shares approximately (.9999999640076982,.00000003599230175). A high conditional share and a relatively low density can coexist."}</Prose>

<Prose>{"Changing either raw query coordinate gives a new inference under the same state. "}<code>{"python saved_iris_mixture.py --query 5.5 4.2"}</code>{" supplies this route outside the repository. NLL threshold 10 is a separately declared illustrative action rule. It was not calibrated by this collection and cannot establish a biological anomaly probability. If an application needs an action threshold, decide its cost/validation protocol separately."}</Prose>

<GaussianOperationRoles />

<Prose>{"The five branches identify actual array roles. "}<code>{"score_samples"}</code>{" maps q-by-d rows to q log densities; "}<code>{"score"}</code>{" reduces their mean to one scalar. "}<code>{"predict_proba"}</code>{" maps to q-by-K conditional component shares; "}<code>{"predict"}</code>{" returns q argmax IDs. "}<code>{"sample"}</code>{" first selects a source and then returns q-by-d generated rows with their source IDs. It does not return an average of every component mean. "}<code>{"GaussianMixture"}</code>{" has no ordinary "}<code>{"partial_fit"}</code>{" route; changing data is not automatically an online update."}</Prose>

<Prose>{"The supplied three-component responsibility row "}<strong>{"(.40,.35,.25)"}</strong>{" makes one distinction visible. No entry exceeds .5, yet component 0 is the largest and wins argmax. Compare each segment's "}<strong>{"individual value"}</strong>{", not its cumulative position in the unit bar, with a .5 threshold. That threshold is a different rule that could abstain. Changing the row to (.35,.40,.25) selects component 1, still with no entry above .5. These are constructed responsibility rows, not invented three-component Iris predictions. A share threshold also differs from D50's NLL threshold."}</Prose>

<Prose>{"Membership is conditional on one parameter state. It does not quantify uncertainty about that state. Component IDs are exchangeable model labels rather than biological classes. Density depends on coordinate units; fitted preprocessing belongs to training. The unfavorable reserved result remains part of the answer to our opening question."}</Prose>

<Prose>{"The next visible deeper branches ask why the alternating update works, how it relates to hard clustering, what changes when only part of x is observed, and how uncertainty in parameters changes inference. Each begins with its own concrete operation."}</Prose>

<H2>{"12. Deeper: one touching bound explains the two steps"}</H2>

<Prose>{"The two operations can improve a common bound while keeping different objects fixed."}</Prose>

<GaussianTrialBoundLab />

<Prose>{"One observation has joint component contributions (.3,.1), so its density is .4 and log density is "}<InlineMath>{"\\log.4"}</InlineMath>{". Give it trial shares q=(.5,.5). Multiply those shares by the corresponding log joint contributions: their sum is "}<InlineMath>{"Q=\\sum_kq_k\\log p(x,z=k)"}</InlineMath>{". Separately add "}<InlineMath>{"-q_k\\log q_k"}</InlineMath>{" to obtain entropy H. Adding Q+H gives F, a lower value than log .4. Trial shares (.75,.25) match the conditional posterior and close the gap. Trial q is an auxiliary distribution, not the original mixing weight "}<InlineMath>{"\\pi"}</InlineMath>{"."}</Prose>

<Prose>{"For many rows,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 19; scroll horizontally when needed"><MathBlock>{"F(q,\\theta)=\\sum_{n,k}q_{nk}\\log p(x_n,z_n=k\\mid\\theta)-\\sum_{n,k}q_{nk}\\log q_{nk}."}</MathBlock></div>

<Prose>{"The second term is entropy with its correct sign. F is not Q alone or “negative entropy.” Terms with q=0 use the limit "}<InlineMath>{"0\\log0=0"}</InlineMath>{". If q assigns positive mass to a zero-joint term, F is negative infinity; it does not become a finite uniform fallback."}</Prose>

<Prose>{"Subtract F from the marginal log likelihood. Since "}<InlineMath>{"\\log p(x,z)=\\log p(z\\mid x)+\\log p(x)"}</InlineMath>{", the result is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 20; scroll horizontally when needed"><MathBlock>{"\\ell(\\theta)-F(q,\\theta)=\\sum_{n,k}q_{nk}\\log\\frac{q_{nk}}{p(z_n=k\\mid x_n,\\theta)}=\\mathrm{KL}(q\\|p(z\\mid x,\\theta))\\ge0."}</MathBlock></div>

<Prose>{"Equality holds when q is the posterior on the supported terms. The E-step sets that touching distribution without moving "}<InlineMath>{"\\theta"}</InlineMath>{"; the M-step holds q fixed and maximizes F through Q, since H depends only on q."}</Prose>

<GaussianTouchingBoundLadder />

<Prose>{"For our four-row cycle, old Q=-8.069044223 and H=.910857246 sum to old F=ℓ=-7.158186977. After M with old q fixed, Q becomes -7.710404260 while H is unchanged, giving F=-6.799547014. The new log likelihood is -6.461856301, above the bound by .337690713. Bound gain .358639963 differs from log-likelihood gain .696330676. The next E touches the new log likelihood without changing parameters."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 21; scroll horizontally when needed"><MathBlock>{"\\ell(\\theta')\\ge F(q,\\theta')\\ge F(q,\\theta)=\\ell(\\theta)."}</MathBlock></div>

<Prose>{"The touching equality at the old state is essential. A generalized EM step need only increase the same bound; an arbitrary different bound without touching equality does not imply likelihood improvement. MAP adds a parameter log-prior to the objective. A variational evidence bound also integrates parameter uncertainty; it is not the same finite-state ML optimization renamed."}</Prose>

<GaussianJensenGeometry />

<Prose>{"For q=(.5,.5), the positive ratios joint/q are .6/.2. Their weighted coordinate is .4; concavity of log puts log .4 above the average of log .6 and log .2. This is Jensen's inequality behind the same bound. Posterior q makes supported ratios equal, hence equality. A q=0 term is a limiting case and not a finite plotted ratio. The concavity of log here does not make the full mixture likelihood globally concave in every parameter."}</Prose>

<Prose>{"Keep section 7's notation: "}<InlineMath>{"L"}</InlineMath>{" is the product likelihood and "}<InlineMath>{"\\ell=\\log L"}</InlineMath>{" is log likelihood. Every value on this bound's vertical axis is in log units. "}<code>{"mixture_lower_bound.py"}</code>{" retains the dictionary key "}<code>{"\"L\""}</code>{" for log likelihood, so that "}<strong>{"code key corresponds to "}<InlineMath>{"\\ell"}</InlineMath>{""}</strong>{", not to the likelihood product. It computes Q,H,F,ℓ and KL from actual log joint rows and q, then traces the whole supplied four-row cycle using the already taught fractional update. Its positive-q/zero-joint output is an explicit support status. Given joint values, decomposition costs O(nK). Independent scalar sums and the KL identity check it directly from the fixed parameters without iterative fitting. Log-sum-exp is the ordinary stable reduction for ℓ; no special optimizer is needed for this fixed-state calculation."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="mixture_lower_bound.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/mixture_lower_bound.py" />

<CodeBlock kind="output" filename="mixture_lower_bound.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/mixture_lower_bound.stdout">{"one-row decomposition {'Q': -1.753278948659991, 'H': 0.6931471805599453, 'F': -1.0601317681000455, 'L': -0.9162907318741551, 'KL': 0.1438410362258904, 'status': 'finite'}\none-row decomposition {'Q': -1.4786258764929636, 'H': 0.5623351446188083, 'F': -0.9162907318741553, 'L': -0.9162907318741551, 'KL': 2.7755575615628914e-17, 'status': 'finite'}\none-row decomposition {'Q': -2.3025850929940455, 'H': -0.0, 'F': -2.3025850929940455, 'L': -0.9162907318741551, 'KL': 1.3862943611198904, 'status': 'finite'}\nsupport mismatch {'Q': -inf, 'H': 0.6931471805599453, 'F': -inf, 'L': -1.2039728043259361, 'KL': inf, 'status': 'unsupported q term'}\nold touching bound {'Q': -8.069044222843674, 'H': 0.9108572457067675, 'F': -7.158186977136906, 'L': -7.158186977136907, 'KL': 1.9318537261681668e-16, 'status': 'finite'}\nnew bound with old q {'Q': -7.710404259554863, 'H': 0.9108572457067675, 'F': -6.799547013848096, 'L': -6.461856301295124, 'KL': 0.3376907125529724, 'status': 'finite'}\nnew touching bound {'Q': -6.6655685357010235, 'H': 0.20371223440590058, 'F': -6.461856301295123, 'L': -6.461856301295124, 'KL': 1.6171236544473686e-16, 'status': 'finite'}"}</CodeBlock>

<Prose>{"The bound explains the soft alternating update. Small variance explains when soft decisions approach a hard nearest-centre rule."}</Prose>

<H2>{"13. Deeper: soft component assignment and k-means ask related questions"}</H2>

<Prose>{"A small fixed shared variance makes a unique nearest centre dominate."}</Prose>

<GaussianDistanceMembershipLab />

<Prose>{"This example deliberately changes centres to 0 and 3. Query 1 has squared distances 1 and 4. With equal weights and shared variance v, its first-component shares are .592666600 at v=4, .817574476 at v=1 and .997527377 at v=.25. The difference of distance penalties, not a new fitted result, creates this sharpening."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 22; scroll horizontally when needed"><MathBlock>{"r_k(x)=\\frac{\\pi_k\\exp[-\\|x-\\mu_k\\|^2/(2v)]}{\\sum_j\\pi_j\\exp[-\\|x-\\mu_j\\|^2/(2v)]}."}</MathBlock></div>

<Prose>{"As v approaches zero with fixed centres and fixed positive weights, a unique distance gap overwhelms any finite log-weight difference. At the midpoint 1.5, equal distances remain tied; soft shares equal the prior ratio even as v decreases. Unequal positive priors therefore do not disappear at that exact tie. If the centres, weights or covariance family also change with v, this specific limit no longer describes the same setup. Variance zero itself is not a supported Gaussian density."}</Prose>

<GaussianHardSoftCentreComparison />

<Prose>{"Hard assignments on -2,-1,1,2 with centres -1/+1 allocate the first two rows wholly Left and the last two Right, giving new means -1.5/+1.5. Finite-soft shares at variance 1 instead give -1.344824658/+1.344824658. A hard positional tie chooses one component; equal-prior soft membership at that tie is .5/.5. The observations and initial centres are held fixed across the comparison."}</Prose>

<Prose>{""}<code>{"GaussianMixture(covariance_type='spherical')"}</code>{" learns one variance per component and weights. It is not the hard Lloyd trainer, nor a fixed common-variance limit. The complete hard clustering workflow belongs to "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml"}>{"K-Means"}</a>{"; the local "}<code>{"soft_assignment_limit.py"}</code>{" implements distance softmax and one explicit hard update, including empty-hard-component status and the changed query .5. Its cost is O(qKd) for q queries and O(nKd) for one assignment/update. It uses a per-component distance block rather than a giant residual tensor."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="soft_assignment_limit.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/soft_assignment_limit.py" />

<CodeBlock kind="output" filename="soft_assignment_limit.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/soft_assignment_limit.stdout">{"finite first share 1 4 0.5926665999540698\nfinite first share 1 1 0.8175744761936437\nfinite first share 1 0.25 0.9975273768433651\nfinite first share 0.5 1 0.9525741268224334\nfinite first share 0.5 0.25 0.9999938558253978\nfinite first share 1.5 1 0.49999999999999994\nfinite first share 1.5 0.05 0.5000000000000009\nweighted exact tie [[0.20000000000000015, 0.8000000000000007]]\nhard labels/new means [0, 0, 1, 1] [[-1.5], [1.5]]\nsoft new means [[-1.3448246580536996], [1.3448246580536996]]"}</CodeBlock>

<Prose>{"The selector also changes when the observation reveals only some coordinates."}</Prose>

<H2>{"14. Deeper: condition on one coordinate, then mix the remaining ones"}</H2>

<Prose>{"Observing part of a row changes both each Gaussian and its source weight."}</Prose>

<GaussianCoordinateSlice />

<Prose>{"Start with one Gaussian of mean(0,0), covariance [[1,.5],[.5,1]]. Let u be observed and v remain unknown. The fixed u=1 slice of the joint ellipse becomes a v bell only after normalization by u's marginal density. Its mean is .5 and variance .75. The covariance cells partition into uu,uv,vu,vv; slice height and conditional height have different density units."}</Prose>

<Prose>{"For one component,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 23; scroll horizontally when needed"><MathBlock>{"\\mu_{v\\mid u}=\\mu_v+\\Sigma_{vu}\\Sigma_{uu}^{-1}(u-\\mu_u),\\qquad\n\\Sigma_{v\\mid u}=\\Sigma_{vv}-\\Sigma_{vu}\\Sigma_{uu}^{-1}\\Sigma_{uv}."}</MathBlock></div>

<Prose>{"These equations identify the operation; implementation solves the observed block with its Cholesky factor rather than forming an inverse per query. The subtracted term is the reduction in remaining uncertainty from observing u."}</Prose>

<GaussianConditionalSolves />

<Prose>{"Now use two components with means(0,0)/(2,4), the same covariance and initial weights .5/.5. At u=1, the conditional means are .5/3.5, both variances .75. Each marginal-u density is equal, so the updated source weights stay .5/.5. At u=0, the means become 0/3, but Right's updated weight is .119202922 because u=0 favours Left's marginal. Keeping the original weights would condition the component shapes but miss the change in source plausibility."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 24; scroll horizontally when needed"><MathBlock>{"\\widetilde\\pi_k(u)=\\frac{\\pi_kN(u;\\mu_{uk},\\Sigma_{uu,k})}{\\sum_j\\pi_jN(u;\\mu_{uj},\\Sigma_{uu,j})}."}</MathBlock></div>

<GaussianConditionalSpread />

<Prose>{"At u=1 the conditional mixture mean is 2 and its variance is "}<InlineMath>{".75+2.25=3"}</InlineMath>{". The within variance and between-component offset both contribute. At u=0 its mean is .357608766 and its total variance is recomputed from both terms. The mean is a conditional average, not an observed draw. A mean±SD interval is not automatically a credible interval or a specified probability region."}</Prose>

<Prose>{""}<code>{"ConditionalPlan"}</code>{" validates that unique coordinate indices partition the full row, prepares observed factors and Schur complements once, and supplies "}<code>{"condition"}</code>{" for one observed vector. Empty observed coordinates return the original mixture. Empty remaining coordinates mean the single empty vector has unit mass and log density zero; no Gaussian with an invented zero-dimensional covariance is factored. The complete source tests both conventions and matches conditional log density with joint minus marginal log density."}</Prose>

<Prose>{"For a fixed partition, state/factor preparation costs O(Kd³) and O(Kd²) storage. Let a coordinates be observed and b remain. Per observed query, marginal scoring costs O(Ka²), conditional means O(Kab), and copying their new values costs O(Kb). The Schur-complement covariance factors are prepared once and reused while means and weights change; no unchanged covariance is factored per query. Scoring q remaining points then costs O(qKb²). "}<code>{"with_mean"}</code>{" and "}<code>{"recenter_full"}</code>{" keep those cached factors with their new centres; the prepared state is treated as immutable. SciPy's block solves and the independently evaluated joint-minus-marginal identity provide the ordinary route. No regression training is claimed: all this inference follows a declared joint model."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example. The prepared conditional factors are reused across queries."}</Prose>

<RemoteCodeBlock filename="conditional_gaussian_mixture.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/conditional_gaussian_mixture.py" />

<CodeBlock kind="output" filename="conditional_gaussian_mixture.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/conditional_gaussian_mixture.stdout">{"conditional 1 weights [0.49999999999999994, 0.49999999999999994] means [[0.5], [3.5]] covariance [[[0.75]], [[0.75]]]\nconditional total moments [1.9999999999999998] [[3.0]]\nconditional/direct log density -2.2750974969787823 -2.275097496978782\nconditional 0 weights [0.8807970779778823, 0.11920292202211753] means [[0.0], [3.0]] covariance [[[0.75]], [[0.75]]]\nconditional total moments [0.3576087660663526] [[1.6949422686315585]]\nconditional/direct log density -2.8755449941284765 -2.875544994128477\nchanged conditional mean/variance [[1.0]] [[[1.0]]]\nempty observed identity True\nempty remaining log density [0.0]"}</CodeBlock>

<Prose>{"So far all membership is conditional on one fixed fitted parameter state. The last deeper branch puts distributions on those parameters themselves."}</Prose>

<H2>{"15. Deeper: parameters can have distributions too"}</H2>

<Prose>{"Uncertainty about component parameters is different from membership under one fitted state."}</Prose>

<GaussianBayesianParameterPlate />

<Prose>{"The graph still has a hidden selector z for each observed x. Now the weight vector, component mean and component precision are random objects outside the observation plate. A prior supplies their distributions; evidence changes their posterior. The simplex constrains weights to nonnegative values summing to one. Mean coordinates can move, and precision matrices must remain positive definite. A responsibility bar for one x cannot replace any of these parameter distributions."}</Prose>

<Prose>{"Exact posterior inference couples the unknown assignments and parameters. A finite variational mixture approximates it by a product"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 25; scroll horizontally when needed"><MathBlock>{"q(\\pi)\\prod_k q(\\mu_k,\\Lambda_k)\\prod_nq(z_n),"}</MathBlock></div>

<Prose>{"where "}<InlineMath>{"\\Lambda_k"}</InlineMath>{" is precision. The mean and precision of one component remain a joint factor; the approximation separates that factor from other components and assignments. Coordinate ascent improves an evidence lower bound within this chosen family. It need not recover the exact posterior, guarantee the true K or remove initialization sensitivity and model misspecification."}</Prose>

<GaussianDirichletEvidence />

<Prose>{"A finite Dirichlet prior puts positive concentration "}<InlineMath>{"\\alpha_0"}</InlineMath>{" on each weight. Fractional counts enter the evidence lane. With K=2, "}<InlineMath>{"\\alpha_0=1"}</InlineMath>{", the count pair (N₁,N₂)=(2,2) gives posterior concentrations (α₁,α₂)=(3,3) and mean weights (Eπ₁,Eπ₂)=(.5,.5). Changing the count pair to (1,3) gives concentrations (2,4), whose total 6 gives mean weights (1/3,2/3). Do not add the counts a second time after forming posterior concentration."}</Prose>

<Prose>{"The Dirichlet density is proportional to "}<InlineMath>{"\\prod_k\\pi_k^{\\alpha_k-1}"}</InlineMath>{" on the simplex. Combining its exponent with the assignment counts gives "}<InlineMath>{"\\alpha_k=\\alpha_0+N_k"}</InlineMath>{". Its normalized mean is "}<InlineMath>{"\\alpha_k/\\sum_j\\alpha_j"}</InlineMath>{", while the expectation needed in a log assignment is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 26; scroll horizontally when needed"><MathBlock>{"E\\log\\pi_k=\\psi(\\alpha_k)-\\psi(\\sum_j\\alpha_j)."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"\\Gamma"}</InlineMath>{" generalizes the factorial, and "}<InlineMath>{"\\psi(t)=\\frac{d}{dt}\\log\\Gamma(t)"}</InlineMath>{" is the digamma function. Differentiating the Dirichlet normalizer gives that expected log. It is not "}<InlineMath>{"\\log E\\pi_k"}</InlineMath>{". For the concentration pair (α₁,α₂)=(3,3), the expected log is "}<InlineMath>{"\\psi3-\\psi6=-.783333333"}</InlineMath>{", different from "}<InlineMath>{"\\log.5"}</InlineMath>{". The recurrence "}<InlineMath>{"\\psi(t+1)=\\psi(t)+1/t"}</InlineMath>{" lets us hand-check differences before using the maintained special function."}</Prose>

<GaussianNormalWishartUpdate />

<Prose>{"Follow the prior centre at 0 and the evidence centre at (1,0). The prior mean strength is called "}<InlineMath>{"\\beta_0"}</InlineMath>{", and the fractional evidence count is "}<InlineMath>{"N_k"}</InlineMath>{". Here they are 1 and 2. Take fractional count 2, evidence centre (1,0), scatter diag(.5,.25), prior centre 0, "}<InlineMath>{"\\beta_0=1"}</InlineMath>{", "}<InlineMath>{"\\nu_0=3"}</InlineMath>{", and "}<InlineMath>{"W_0=I"}</InlineMath>{". Prior and evidence centres combine with relative weights 1 and 2, giving "}<InlineMath>{"\\beta=3"}</InlineMath>{", m=(2/3,0) and "}<InlineMath>{"\\nu=5"}</InlineMath>{". The inverse-scale matrix has three contributions: I, the within scatter 2×diag(.5,.25), and the prior/evidence centre offset "}<InlineMath>{"(2/3)\\operatorname{diag}(1,0)"}</InlineMath>{". Their sum is diag(8/3,3/2), so W=diag(3/8,2/3)."}</Prose>

<Prose>{"The normal-Wishart prior describes a mean conditional on precision and a distribution over the precision itself:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 27; scroll horizontally when needed"><MathBlock>{"\\Lambda_k\\sim \\mathcal W(W_0,\\nu_0),\\quad\n\\mu_k\\mid\\Lambda_k\\sim N(m_0,(\\beta_0\\Lambda_k)^{-1})."}</MathBlock></div>

<Prose>{"W is a "}<strong>{"precision scale"}</strong>{", not a covariance. The Wishart mean precision is "}<InlineMath>{"\\nu W"}</InlineMath>{"; "}<InlineMath>{"\\beta"}</InlineMath>{" controls the conditional concentration of the mean around m. Proper priors require positive "}<InlineMath>{"\\beta_0"}</InlineMath>{", positive-definite "}<InlineMath>{"W_0"}</InlineMath>{", and "}<InlineMath>{"\\nu_0>d-1"}</InlineMath>{". A degrees-of-freedom parameter regulates the precision distribution; it is not a count of observed rows rounded to an integer."}</Prose>

<Prose>{"Writing the general update after those cells are visible,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 28; scroll horizontally when needed"><MathBlock>{"\\beta_k=\\beta_0+N_k,\\quad \\nu_k=\\nu_0+N_k,\\quad\nm_k=\\frac{\\beta_0m_0+N_k\\bar x_k}{\\beta_k},"}</MathBlock></div>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 29; scroll horizontally when needed"><MathBlock>{"W_k^{-1}=W_0^{-1}+N_kS_k+\n\\frac{\\beta_0N_k}{\\beta_k}(\\bar x_k-m_0)(\\bar x_k-m_0)^T."}</MathBlock></div>

<Prose>{"The last term records disagreement between prior and evidence centres. A zero effective count returns the prior parameters without forming a zero-count sample mean. "}<code>{"fractional_statistics"}</code>{" uses the same centered geometry as the M-step; "}<code>{"factor_update"}</code>{" computes these actual factors. Cholesky solves convert the inverse scale to W because W itself is required by the variational expectations; an inverse is not formed repeatedly for each query."}</Prose>

<Prose>{"The prior centre must be a one-dimensional coordinate vector. Each fractional scatter must be symmetric positive semidefinite: its quadratic form is a sum of nonnegative weighted squared displacements. Zero scatter is valid; a genuinely negative direction is not. The implementation rejects nonfinite state and checks paired entries and eigenvalues with the declared relative roundoff tolerance "}<InlineMath>{"10^{-12}\\max(1,\\max_{i,j}|S_{ij}|)"}</InlineMath>{". This admits numerical roundoff, rather than silently turning an invalid statistic into evidence."}</Prose>

<GaussianVariationalAssignmentBound />

<Prose>{"Now use the separately declared six-row toy from section 9, with initial hard shares on its first three versus last three rows, "}<InlineMath>{"\\alpha_0=\\beta_0=1"}</InlineMath>{", "}<InlineMath>{"m_0=0"}</InlineMath>{", "}<InlineMath>{"\\nu_0=3"}</InlineMath>{", "}<InlineMath>{"W_0=I"}</InlineMath>{". Each count is 3, its centre is (±5/3, 0), and its scatter is diag(2/9, 2/3). The resulting concentrations are 4, mean-factor strengths "}<InlineMath>{"\\beta"}</InlineMath>{" are 4, means are (±1.25, 0), degrees are 6 and inverse scales are diag(15/4, 3). These are shown before the expected-log assignment. The scalar "}<InlineMath>{"\\beta"}</InlineMath>{" multiplies the conditional precision of the mean; it is distinct from the random precision matrix and its Wishart mean "}<InlineMath>{"\\nu W"}</InlineMath>{". This is not the different one-factor D62 state or a retained Iris fit."}</Prose>

<Prose>{"Each component's log assignment is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 30; scroll horizontally when needed"><MathBlock>{"\\log\\rho_{nk}=E\\log\\pi_k+\\tfrac12E\\log|\\Lambda_k|\n-\\tfrac d2\\log(2\\pi)-\\tfrac12\\{d/\\beta_k+\\nu_k(x_n-m_k)^TW_k(x_n-m_k)\\}."}</MathBlock></div>

<Prose>{"The expected log determinant is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 31; scroll horizontally when needed"><MathBlock>{"E\\log|\\Lambda_k|=\\sum_{i=1}^d\\psi((\\nu_k+1-i)/2)+d\\log2+\\log|W_k|."}</MathBlock></div>

<Prose>{"The term d/β remains even at x=m because the mean itself is uncertain. For this toy it is .5. Normalize logρ using the same row log-sum-exp. At query (0,0) the shares are equal; at (.5,0), Right's log odds are 2 and its share is .880797078. A mean uncertainty penalty is not a secretly added covariance diagonal."}</Prose>

<Prose>{"The complete evidence lower bound has seven factor terms:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 32; scroll horizontally when needed"><MathBlock>{"\\mathcal L=E\\log p(X\\mid Z,\\mu,\\Lambda)+E\\log p(Z\\mid\\pi)\n+E\\log p(\\pi)+E\\log p(\\mu,\\Lambda)\n-E\\log q(Z)-E\\log q(\\pi)-E\\log q(\\mu,\\Lambda)."}</MathBlock></div>

<Prose>{"The first term weights each expected Gaussian log likelihood by r. The second weights expected log mixture weights by the counts. The next two score prior weight and parameter factors. The last three subtract the corresponding variational log factors, adding their entropy. The ownership lanes identify each object rather than displaying an unexplained seven-number total."}</Prose>

<Prose>{"For a Dirichlet factor, its log normalizer is "}<InlineMath>{"\\log\\Gamma(\\sum\\alpha)-\\sum\\log\\Gamma(\\alpha_k)"}</InlineMath>{". For the precision factor,"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 33; scroll horizontally when needed"><MathBlock>{"\\log B(W,\\nu)=-\\tfrac\\nu2\\log|W|-\\tfrac{\\nu d}2\\log2-\\log\\Gamma_d(\\nu/2),"}</MathBlock></div>

<Prose>{"and "}<InlineMath>{"\\log p(\\Lambda)=\\log B+(\\nu-d-1)\\log|\\Lambda|/2-\\operatorname{tr}(W^{-1}\\Lambda)/2"}</InlineMath>{". "}<InlineMath>{"\\Gamma_d"}</InlineMath>{" is the multivariate gamma normalizer, evaluated by a maintained special function. Under the posterior factor, "}<InlineMath>{"E\\Lambda=\\nu W"}</InlineMath>{"; its own trace term is "}<InlineMath>{"\\nu d"}</InlineMath>{". For the conditional mean factor, the expected squared distance from prior m0 is "}<InlineMath>{"d/\\beta_k+\\nu_k(m_k-m_0)^TW_k(m_k-m_0)"}</InlineMath>{"; for its own m it is d/β. These identities compute the prior and q terms without dropping constants or sampling a Wishart matrix."}</Prose>

<Prose>{""}<code>{"finite_variational_gmm.py"}</code>{" implements all statistics, factors, expected logs, assignments, seven normalised terms, coordinate ascent and integrated prediction. Its dense arithmetic remains "}<InlineMath>{"O(nKd^2+Kd^3)"}</InlineMath>{" per coordinate-ascent cycle. Its factor state is "}<InlineMath>{"O(Kd^2)"}</InlineMath>{", including both scale matrices, means and scalar parameters; retaining the final n-by-K assignment array brings retained model/assignment state to "}<InlineMath>{"O(nK+Kd^2)"}</InlineMath>{". That is not the peak working-space bound. In "}<code>{"fractional_statistics"}</code>{", "}<code>{"rows-origin"}</code>{", the residual and its weighted product are n-by-d temporaries for one component at a time. In "}<code>{"expected_log_density"}</code>{", the centred rows and transformed coordinates also need n-by-d workspace. The n-by-K component terms and assignments remain present as well. Thus the current dense route needs "}<InlineMath>{"O(nd+nK+Kd^2)"}</InlineMath>{" peak working storage, apart from the separately supplied X, returned query arrays and requested trace. It avoids an n-by-K-by-d tensor but does not avoid n-by-d arrays. A float64 shape illustration with n=100000, d=100 and K=2 makes ONE n-by-d temporary 80000000 bytes, whereas "}<InlineMath>{"(nK+Kd^2)\\times8"}</InlineMath>{" is only 1760000 bytes; these are symbolic counts, not measured allocation or timing, and simultaneous arrays add constants. The stored trace has one fixed-size seven-term record per iteration, "}<InlineMath>{"O(T)"}</InlineMath>{" for T retained steps. A requested q-row component result adds "}<InlineMath>{"O(qK)"}</InlineMath>{" output and evaluation may use "}<InlineMath>{"O(qd)"}</InlineMath>{" workspace. Input, persistent factors/assignments, transient workspace, output and trace therefore have distinct owners; this file does not implement blocked VI. SciPy supplies digamma/log-gamma/multivariate log-gamma primitives; the updates and bound are locally implemented. The recorded new toy starts at ELBO -26.907594654511843 and ends at -26.86698662386796 after 4 updates under its stated relative tolerance. All seven terms and gains are retained. A bound with constants dropped cannot be compared numerically with this one across K."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="finite_variational_gmm.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/finite_variational_gmm.py" />

<CodeBlock kind="output" filename="finite_variational_gmm.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/finite_variational_gmm.stdout">{"hand beta/mean/degrees [3.0] [[0.6666666666666666, 0.0]] [5.0]\nhand inverse scale/scale [[[2.6666666666666665, 0.0], [0.0, 1.5]]] [[[0.37499999999999994, 0.0], [0.0, 0.6666666666666669]]]\nhand predictive moments [[0.6666666666666666, 0.0], [[1.7777777777777777, 0.0], [0.0, 1.0]]]\ntoy first factors [4.0, 4.0] [4.0, 4.0] [[-1.25, 0.0], [1.25, 0.0]] [6.0, 6.0] [[[3.75, 0.0], [0.0, 3.0]], [[3.7499999999999996, 0.0], [0.0, 3.0]]]\ntoy first assignments [[0.5000000000000002, 0.4999999999999997], [0.11920292202211764, 0.8807970779778823]]\ntoy VI convergence True iterations 4\ntoy VI trace [{'iteration': 0, 'ELBO': -26.907594654511843, 'terms': {'expected_log_p_X': -16.65166077381656, 'expected_log_p_Z': -4.557142857142857, 'expected_log_p_pi': 0.0, 'expected_log_p_mu_precision': -14.7459354185441, 'negative_expected_log_q_Z': -0.0, 'negative_expected_log_q_pi': -0.3844995654664478, 'negative_expected_log_q_mu_precision': 9.43164396045812}}, {'iteration': 1, 'ELBO': -26.867411748328518, 'gain': 0.04018290618332543, 'terms': {'expected_log_p_X': -16.867857577174853, 'expected_log_p_Z': -4.557142857142857, 'expected_log_p_pi': 0.0, 'expected_log_p_mu_precision': -14.631124921196164, 'negative_expected_log_q_Z': 0.1922623651988633, 'negative_expected_log_q_pi': -0.3844995654664487, 'negative_expected_log_q_mu_precision': 9.38095080745294}}, {'iteration': 2, 'ELBO': -26.866996302428262, 'gain': 0.0004154459002556621, 'terms': {'expected_log_p_X': -16.89884952423315, 'expected_log_p_Z': -4.557142857142861, 'expected_log_p_pi': 0.0, 'expected_log_p_mu_precision': -14.614803991805147, 'negative_expected_log_q_Z': 0.21468433760003963, 'negative_expected_log_q_pi': -0.38449956546644604, 'negative_expected_log_q_mu_precision': 9.373615298619303}}, {'iteration': 3, 'ELBO': -26.86698685216296, 'gain': 9.450265302746175e-06, 'terms': {'expected_log_p_X': -16.90363106295113, 'expected_log_p_Z': -4.557142857142857, 'expected_log_p_pi': 0.0, 'expected_log_p_mu_precision': -14.612289038149726, 'negative_expected_log_q_Z': 0.2180936654591833, 'negative_expected_log_q_pi': -0.3844995654664487, 'negative_expected_log_q_mu_precision': 9.372482006088019}}, {'iteration': 4, 'ELBO': -26.86698662386796, 'gain': 2.282950006815554e-07, 'terms': {'expected_log_p_X': -16.904376715463236, 'expected_log_p_Z': -4.557142857142861, 'expected_log_p_pi': 0.0, 'expected_log_p_mu_precision': -14.611896920705252, 'negative_expected_log_q_Z': 0.2186241963556294, 'negative_expected_log_q_pi': -0.38449956546644604, 'negative_expected_log_q_mu_precision': 9.372305238554206}}]\ntoy VI final means [[-1.2386558181526914, 1.6653345369377348e-16], [1.2386558181526914, 0.0]]\nexpected-log scores [-3.064687679317315, -2.8537240715471555, -5.97560515104276]\nintegrated predictive scores [-2.642320569000245, -2.509114208356757, -4.598937009298979]"}</CodeBlock>

<Prose>{"The ordinary finite-prior route is "}<code>{"BayesianGaussianMixture"}</code>{" with "}<code>{"weight_concentration_prior_type='dirichlet_distribution'"}</code>{", explicit concentration 1, mean precision 1, prior mean 0, degrees 3, covariance prior "}<InlineMath>{"I"}</InlineMath>{", full covariance, "}<code>{"reg_covar=0"}</code>{", one k-means start with seed 16, budget 50 and tolerance 1e-8. Its stored "}<code>{"covariances_"}</code>{" equals the inverse-scale update divided by posterior ν. To compare sufficient-state factors with W, multiply that covariance by ν to recover inverse scale, then solve for W. A fixed-responsibility comparison also verifies this conversion at one identical sufficient state; that diagnostic does not replace the public estimator route. The public toy file uses the ordinary estimator's public fit/query methods; it does not teach private initialization methods as a stable application API."}</Prose>

<Prose>{"The package takes 5 iterations here, with final means approximately ±1.238650436 rather than the scratch criterion's ±1.238655818. Close results are a deliberate comparison under different stopping details, not a false claim of identical trajectories. Its expected-log query score near 0 is -3.064667777; the scratch corresponding score is -3.064687679. That is a third numerical operation beside an integrated predictive density and a plug-in Gaussian."}</Prose>

<GaussianFiniteStickWeights />

<Prose>{"A finite Dirichlet distributes one unit across K weights. A stick construction instead emits a fraction of the remaining mass at each ordered break. Six supplied breaks .5 emit [32,16,8,4,2,1]/64 with leftover 1/64. A final-residual convention fixes the sixth break to 1 and emits [16,8,4,2,1,1]/32 with no leftover. The inspected ordinary package uses six Beta factors and normalizes the emitted mean masses; its supplied .5 example becomes [32,16,8,4,2,1]/63. These are different finite-cap conventions, shown separately."}</Prose>

<Prose>{"For its truncated stick prior, posterior break factors use "}<InlineMath>{"a_k=1+N_k"}</InlineMath>{", "}<InlineMath>{"b_k=\\gamma+\\sum_{j>k}N_j"}</InlineMath>{". Expected log weights add digamma expectations of the current break and preceding remainders. They are not logs of the normalized mean weights. Order and finite cap change the represented approximation; the cap does not affect only cost."}</Prose>

<Prose>{"The original six-component Iris appendix tried concentrations .01,1,10. Its three complete saved weight vectors and convergence statuses remain visible. Counting weights strictly above .01 gives 3,3,4; strictly above .05 gives 2 for every setting. The threshold and recorded setting can change a count, but it is not proof of true K. No unretained Bayesian means/covariances are inferred from these weight vectors."}</Prose>

<NeuralTable caption={"15. Deeper: parameters can have distributions too"} headers={[<>{"Concentration"}</>,<>{"All six saved mean weights, in stored order"}</>,<>{"Saved count > .01"}</>,<>{"Count > .05 from these weights"}</>,<>{"Saved convergence"}</>]} rows={[[<>{"0.01"}</>,<>{"[0.011766109554147355, 0.37484691453806224, 0.6132801979520509, 0.00010572085086849469, 1.0467410977083283e-06, 1.0363773244639192e-08]"}</>,<>{"3"}</>,<>{"2"}</>,<>{"True"}</>],[<>{"1"}</>,<>{"[0.011654658058646229, 0.37127737953073353, 0.6074948486339005, 0.005493675813647216, 0.0027228124159074663, 0.0013566255471650901]"}</>,<>{"3"}</>,<>{"2"}</>,<>{"True"}</>],[<>{"10"}</>,<>{"[0.011429709465857772, 0.3642662349577417, 0.5969498285922453, 0.01005173101065236, 0.009086231719607287, 0.008216264253895496]"}</>,<>{"4"}</>,<>{"2"}</>,<>{"True"}</>]]} />

<GaussianPredictiveIntegration />

<Prose>{"Integrating the approximate normal-Wishart factor gives a multivariate Student-t component with degrees "}<InlineMath>{"f=\\nu+1-d"}</InlineMath>{", centre m and precision"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Equation 34; scroll horizontally when needed"><MathBlock>{"P=\\frac{f\\beta}{1+\\beta}W."}</MathBlock></div>

<Prose>{"Mix these components with posterior mean weights "}<InlineMath>{"\\alpha_k/\\sum\\alpha"}</InlineMath>{". For D62, f=4 and P=diag(9/8,2). The predictive covariance is "}<InlineMath>{"f/(f-2)P^{-1}=\\operatorname{diag}(16/9,1)"}</InlineMath>{". It has heavier tails than the separately named plug-in Gaussian covariance "}<InlineMath>{"W^{-1}/\\nu=\\operatorname{diag}(8/15,3/10)"}</InlineMath>{". A Student-t location exists for every positive f, but its mean requires f>1 and its covariance requires f>2. The code reports unsupported moment requests rather than inventing a finite variance."}</Prose>

<Prose>{""}<code>{"predictive_log_terms"}</code>{" uses the full Student-t normalizer, Cholesky squared coordinates and "}<code>{"log1p"}</code>{" for its tail term, then mixes using log-sum-exp. Ordinary Bayesian mixture "}<code>{"score_samples"}</code>{" and "}<code>{"predict_proba"}</code>{" instead normalize expected-log component terms; they are not this integrated predictive. Its "}<code>{"sample"}</code>{" uses its plug-in Gaussian arrays. A generated sample from that route cannot certify posterior predictive calibration."}</Prose>

<Prose>{"The complete "}<code>{"ordinary_variational_gmm.py"}</code>{" supplies the public finite toy, expected-log outputs, plug-in samples and explicit stick helper. The ordinary estimator remains useful when its approximation and outputs match the intended question; priors do not remove the need for held-out checking."}</Prose>

<Prose>{"Complete source and full recorded output from the declared small example."}</Prose>

<RemoteCodeBlock filename="ordinary_variational_gmm.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/ordinary_variational_gmm.py" />

<CodeBlock kind="output" filename="ordinary_variational_gmm.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/ordinary_variational_gmm.stdout">{"ordinary finite convergence True iterations 5\nordinary finite concentrations [4.000000000000002, 4.000000000000002]\nordinary finite mean precision [4.000000000000002, 4.000000000000002]\nordinary finite means [[-1.2386504360184099, 0.0], [1.23865043601841, 0.0]]\nordinary finite degrees [6.000000000000002, 6.000000000000002]\nordinary covariance representation [[[0.6438300649009328, 0.0], [-2.5235040747281427e-18, 0.4999999999999997]], [[0.643830064900933, 0.0], [2.525429313918054e-18, 0.4999999999999997]]]\nordinary expected-log scores [-3.0646677773853614, -2.8537144998285693, -5.97559351293064]\nordinary assignments [[0.49999999999999994, 0.49999999999999994], [0.12742975332294929, 0.8725702466770505], [9.701043245229247e-06, 0.9999902989567546]]\nordinary plug-in sample IDs [0, 1, 1, 1]\nordinary plug-in samples [[-3.400665552319597, 0.870440067163949], [1.3445821903716684, -0.30457958589272466], [0.6669635509005025, -0.7392278893133127], [1.1607998016027634, 0.4751145695097418]]\nstick final-residual False emitted [0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625] leftover 0.015625 normalized [0.5079365079365079, 0.25396825396825395, 0.12698412698412698, 0.06349206349206349, 0.031746031746031744, 0.015873015873015872]\nstick final-residual True emitted [0.5, 0.25, 0.125, 0.0625, 0.03125, 0.03125] leftover 0.0 normalized [0.5, 0.25, 0.125, 0.0625, 0.03125, 0.03125]"}</CodeBlock>

<Prose>{"The complete original "}<code>{"bayesian_weights.py"}</code>{" is a "}<strong>{"continuation"}</strong>{" of "}<code>{"iris_density.py"}</code>{": it needs the earlier namespace's "}<code>{"np"}</code>{", standardized Z and training indices. It is preserved with its full original stream. Run the two complete texts in one namespace when independently reproducing that recipe:"}</Prose>

<CodeBlock language={"python"}>{"from pathlib import Path\nnamespace = {\"__name__\": \"__main__\"}\nexec(Path(\"iris_density.py\").read_text(encoding=\"utf-8\"), namespace)\nexec(Path(\"bayesian_weights.py\").read_text(encoding=\"utf-8\"), namespace)"}</CodeBlock>

<Prose>{"This recipe retains the first program's output prefix and then the appendix. The exact CSV and ordinary dependencies accompany both. "}<code>{"bayesian_weights.py"}</code>{" alone does not define its data state; it requires the first program's complete state. The complete retained outcomes are attributed to their original execution, independently of the new finite toy."}</Prose>

<Prose>{"Complete original source and its retained historical full stdout."}</Prose>

<RemoteCodeBlock filename="bayesian_weights.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/bayesian_weights.py" />

<CodeBlock kind="output" filename="bayesian_weights.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/bayesian_weights.stdout">{"0.01 [1.180e-02 3.748e-01 6.133e-01 1.000e-04 0.000e+00 0.000e+00] 3 2 True\n1.0 [0.0117 0.3713 0.6075 0.0055 0.0027 0.0014] 3 2 True\n10.0 [0.0114 0.3643 0.5969 0.0101 0.0091 0.0082] 4 2 True"}</CodeBlock>

<Prose>{"A full infinite-mixture sampler, stochastic/distributed VI, variational autoencoder or mixture of probabilistic principal component analysis (PPCA) models is a further implementation topic. "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#10-deeper-branches"}>{"PCA’s probabilistic interpretation"}</a>{" builds one PPCA model: scaled Gaussian latent coordinates are added through loading columns, with observation noise. A mixture would choose one such model before drawing its latent coordinates and observation. The finite mixture here is complete within its declared factor family; those extensions change the model or inference route and require new contracts."}</Prose>

<H2>{"16. What can you now explain, change and diagnose?"}</H2>

<Prose>{"Return to the reserved answer, then test the mechanism on changed values."}</Prose>

<GaussianRepresentationOperations />

<Prose>{"In the final drawing, the same query feeds a density curve and a unit membership row, while the generator selects one source and then draws a measurement from it. Those operations answer different questions. The additive construction instead sums scaled columns; each linked factor model imposes its own assumptions on those contributions. A manifold method studies neighbourhood geometry. Choose the representation for the question you need to answer, rather than the visual similarity of a cloud plot."}</Prose>

<Prose>{"For the original Iris question, the selected mixture lost to the K=1 baseline on the reserved split. Explain this together with the held-out rule and narrow-component diagnostic; do not erase the unfavorable outcome. You can reconstruct a share, hand-update a centre and covariance, trace a stable EM step, choose an ordinary estimator deliberately, and distinguish a density from a component decision and a parameter posterior."}</Prose>

<Prose>{"The following independent tasks change operands or assumptions. Hints and solutions are separate from the visible teaching, so you can attempt each transfer first. Deeper tasks name the branch they require."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Unequal source weights and a tie"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Two components have means 0 and 2, variance 1 each, and weights .25/.75. At x=1, compute density and both responsibilities, then find their equal-contribution query. Use section 5's same-denominator rule. These operands differ from the ±2 live model; the complete supplied-state program can represent them directly."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The distances at 1 are equal. For the crossing, subtract log weighted heights before exponentiating."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Each unweighted height at 1 is .241970725. The weights sum to 1, so total density is the same .241970725. The weighted heights are one-quarter and three-quarters of it, giving r=(.25,.75). Equality requires "}<InlineMath>{"\\log(.25/.75)-[x^2-(x-2)^2]/2=0"}</InlineMath>{", or "}<InlineMath>{"-\\log3-2x+2=0"}</InlineMath>{". Thus "}<InlineMath>{"x=1-\\log3/2=.450693856"}</InlineMath>{". Unequal priors move the crossing toward the smaller component's centre."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Changed fractional M-step"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Use observations 0,2,5 with Left shares .8,.4,.1. Compute its count, mixture weight, new mean and raw variance, then impose variance floor 3. Trace products rather than editing the wrong fixture in section 6."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count is fractional. Measure scatter about the new mean."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{""}<InlineMath>{"N_L=.8+.4+.1=1.3=13/10"}</InlineMath>{", and "}<InlineMath>{"\\pi_L=N_L/3=13/30"}</InlineMath>{". Signed products are 0,.8,.5, so their sum 1.3 divided by 1.3 gives mean 1. Squared residual contributions are .8×1=.8, .4×1=.4, .1×16=1.6; sum 2.8 divided by 1.3 gives variance 28/13. Equivalently, raw second moment(1.6+2.5)/1.3=41/13 minus the squared mean "}<InlineMath>{"1^2"}</InlineMath>{" gives 28/13. The used floor variance is max(28/13,3)=3, with SD√3. The other column's shares are the complements; total effective mass still equals 3."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Diagnose numerical and model failures"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" A program exponentiates very negative joint logs, divides by an epsilon-clipped sum, and reports an all-zero responsibility row. Another accepts a singular covariance. A third rejects every negative log determinant. Diagnose each independently using sections 3,5 and 8."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Mathematical support, floating-point representation and determinant logs are different questions."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Avoidable underflow should be repaired at the representation level: subtract the largest joint log, compute log-sum-exp and exponentiate normalized differences. Clipping the denominator cannot normalize a row whose numerator terms already became zero; uniform replacement would fabricate a supported allocation. A singular covariance cannot define the nonsingular Gaussian density taught here, so require positive-definite state or a separately taught degenerate-distribution model. Negative "}<strong>{"log"}</strong>{" determinant is legitimate for an SPD matrix with determinant between 0 and 1. Test symmetry and positive-definite factorization, not the sign of that log."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Changed points and correlation"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Under covariance[[1,ρ],[ρ,1]], compare P=(2,1) and Q=(2,-1) at ρ=.5, then at-.5 and 0. Give squared covariance distances and ordering. The P-only editor does not make Q editable; use this supplied comparison or "}<code>{"GaussianFactor"}</code>{"."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Divide squared eigenaxis projections by 1+ρ and 1-ρ."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"At+.5, P's contributions are(9/2)/1.5=3 and(1/2)/.5=1, summing 4. Q's are(1/2)/1.5=1/3 and(9/2)/.5=9, summing 28/3. Both Euclidean squared distances are 5. With determinant .75 shared, P has larger density. Negativeρ interchanges the two directional variances and reverses the ordering. Atρ=0 both squared covariance distances are 5. The coordinates did not change; the cost of displacement in each direction did."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Independently restrict the real-data choice"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Inspect only K=1/2 within the four original saved covariance families. Select by their mean validation log density, then report the reserved comparison. If independently running the complete ordinary recipe, label your new outcomes with your environment and keep the split/selection protocol fixed."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Choose before reading the test column. Do not use training BIC as an unannounced substitute."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The saved restricted grid still selects full K=2 at validation -2.668799817608869. Its saved reserved mean score is -3.0112234685906634, below the full K=1 baseline -2.8872488178783784. The difference is -.123974650712285 nats/row. The restricted question produces the same saved choice here; it does not license choosing after seeing the unfavorable answer. A new independently executed recipe is a separate outcome, not a replacement for this reference."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Repair a faulty bound guarantee"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" A proposed argument has F(θ0)=0≤ℓ(θ0)=10 and F(θ1)=1≤ℓ(θ1)=2, and claims likelihood improved because F rose. Find the missing condition and write the valid section 12 chain."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Where must the bound touch?"}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"These exact values are a counterexample: F rose 0→1 while ℓ fell 10→2. To conclude improvement, old q must be the posterior so F(q,θ0)=ℓ(θ0). Then an M/GEM step increasing the same bound gives "}<InlineMath>{"\\ell(θ1)\\ge F(q,θ1)\\ge F(q,θ0)=\\ell(θ0)"}</InlineMath>{". F includes Q+H with valid support, not Q alone. A newly chosen unrelated bound would also break the argument."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Changed small-variance query"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Under section 13's means 0/3, equal weights and fixed shared variances 1/.25, change query 1 to .5. Compute the "}<strong>{"first"}</strong>{" share, then compare the exact midpoint 1.5."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The squared distances are .25 and 6.25, so first log odds are 3/v."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The first share is "}<InlineMath>{"1/(1+e^{-3/v})"}</InlineMath>{", giving .952574127 at v=1 and .999993856 at v=.25. At midpoint 1.5, distances are equal and shares stay .5/.5. A unique nearer centre dominates as v→0 with fixed positive priors; an exact tie does not choose a unique source in soft inference. Hard first-position tie-breaking is a different operation. Do not evaluate a Gaussian density at v=0."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Changed conditional query"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" In section 14's joint mixture, change observed u=1 to 0. Find the conditional component means, variances, weights, mixture mean and total variance."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Condition each component and then use marginal-u evidence to update source weights."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The common correlation .5 gives conditional means 0 and 3, and variance .75 for each. Right's marginal likelihood relative to Left is exp(-2), so its weight is "}<InlineMath>{"1/(1+e^2)=.119202922"}</InlineMath>{"; Left is its complement. The mixture mean is 3 times that weight, .357608766. Total variance is "}<InlineMath>{".75+9w(1-w)"}</InlineMath>{", approximately 1.694942269. Keeping weights .5/.5 would incorrectly give mean 1.5; retaining only within variance would miss the between-source uncertainty."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Units change density, not area"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" A Gaussian has mean 2 cm, SD .5 cm, query 2 cm and interval[1.5,2.5]cm. Convert to millimetres and interpret both peak and area."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Coordinate widths grow by 10, so density height divides by 10."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Mean 20 mm, SD 5 mm, variance 25mm² and endpoints 15/25 mm describe the same physical distribution. The peak changes from .797884561/cm to .079788456/mm. Both intervals span one SD on either side and have area .682689492. In the integral, density scaling 1/10 and width scaling 10 cancel."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"10. A different triangular factor"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" For covariance[[4,2],[2,2]] and displacement(2,2), trace the factor, whitened coordinates, squared distance and log density. Also explain why an asymmetric matrix must be rejected."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Solve the first lower row before the second."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{""}<InlineMath>{"L=[[2,0],[1,1]]"}</InlineMath>{", so y1=2/2=1 and y2=(2-1×1)/1=1. D²=2 and logdet=2log2=log 4. In two dimensions, log density is "}<InlineMath>{"-[2\\log(2π)+\\log4+2]/2"}</InlineMath>{". Covariance symmetry represents the same paired cross moment in both cells; a genuinely asymmetric array is not that covariance. The factor domain check precedes returning a density."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Independent components, dependent mixture"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Two Gaussians have means(-1,-2)/(1,2), identity covariances and weights .5/.5. Compute total mean/covariance and diagnose independence."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Add within covariance and each mean offset's outer product."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Mean 0. Each offset outer product is[[1,2],[2,4]], so total covariance is I plus that matrix, [[2,2],[2,5]]. Cross covariance 2 establishes marginal dependence even though coordinates are independent conditional on each component. The common hidden selector couples them."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Permutation, ties and an output decision"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" (a) Fix means[-2,2], equal weights and unit variances. Use queries[-3,-1,1,3] and reference partition[0,0,1,1]. Swap all component state arrays and compare density, responsibilities, hard partition and ARI. Then inspect the separate exact-tie batch[-3,0,3] and a means-only swap with unequal weights. (b) Choose the argmax of(.40,.35,.25), then(.35,.40,.25), and compare each individual share with .5."}</Prose>

<details><summary>Hint</summary>

<Prose>{"An array position is not a persistent source identity. Argmax asks for the largest value, not a value above .5."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"(a) The untied labels are[0,0,1,1] before and[1,1,0,0] after. Density is unchanged and columns reverse; every same-group pair is preserved, so both partitions have ARI 1 relative to the declared reference. With the exact middle tie, first-position labels instead become[0,0,1]→[1,0,0], while pure renaming would give[1,1,0]. That middle observation changes groups, so unchanged ARI is not guaranteed for recomputed tied predictions. Density and column invariance remain true. Means-only swapping is not generally harmless, but equal weights and identical covariances are an exception. At query .25 with weights .25/.75, the supplied density changes .0726429020788005→.045374068583378446. (b) Winners are 0 then 1 even though no individual share exceeds .5. A separate threshold rule could abstain; it is not argmax or an NLL rule. These two rows are supplied responsibility examples, not fitted Iris outcomes."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"13. Two passes and block size"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" On the six-row toy in section 9, compare one full-covariance update using block sizes 1 and 3 at regularization .05. Explain parameter, responsibility and centre timestamps, then give a memory argument."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Both passes must use the old state; the second uses newly computed centres."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Pass 1 sums the same old responsibilities and merges their weighted centres. Pass 2 recomputes those same shares and sums residual products about the resulting new means. Both sizes give means approximately±1.539234825 with zero second coordinate and covariance diagonal(.680756152,.716666667); tiny cross entries reflect floating summation. The exact algebra is independent of partitioning the sum. A tolerance comparison, e.g1e-12 on this moderate fixture, admits roundoff without claiming bitwise equality. Reusing new parameters for a later block would change its shares and algorithm. Working storage keeps only B(d+K) row state plus Kd² parameter/scatter objects, not nKd residuals; X and requested output are separately accounted for."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Same count, different freedoms"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Count parameters for "}<InlineMath>{"K=2,d=3"}</InlineMath>{" in all four covariance families and show why tied and diagonal are not interchangeable despite equal totals."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count symmetric cells once."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Weights 1 plus means 6 plus covariance 12/6/6/2 gives full 19,tied 13,diagonal 13,spherical 9. A shared matrix[[1,.5,0],[.5,1,0],[0,0,1]] is allowed by tied but its cross cells violate diagonal. Separate diagonal matrices diag(1,2,3) and diag(3,2,1) are allowed by diagonal but violate tied's shared-shape constraint. Both examples are positive definite. Equal dimension of a parameter space does not identify its members."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"15. Exact floor versus addition"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" At count 2, raw scatter .02 and floor .05, compare Q for the exact scalar floor and additive result. Explain the guarantee you may claim."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the derivative and feasible boundary from section 8."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"The feasible maximum is v=.05; addition gives .07. Their Q values are "}<InlineMath>{"-[\\log.05+.02/.05]"}</InlineMath>{" and "}<InlineMath>{"-[\\log.07+.02/.07]"}</InlineMath>{"; the first is larger. The derivative is negative throughout v≥.05 because scatter lies below that boundary. Thus clipping maximizes this constrained scalar fixed-allocation objective. It does not prove that an additive routine maximizes the unconstrained likelihood, nor a global optimum for either full training algorithm."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"16. Read the unfavorable answer correctly"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Name the saved validation winner and training-BIC winner, then compute selected-minus-baseline reserved score. What may be diagnosed after seeing it?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"A less negative mean log density is better; retain the sign."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Validation chooses full K=2; training BIC chooses full K=4. The reserved difference is -3.0112234685906634 minus(-2.8872488178783784)=-.123974650712285. The mixture lost to the baseline on these reserved rows. Recording resolution and the narrow component are useful diagnostics. They do not permit reselecting after test or converting an attributed historical aggregate into an absent saved membership list."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"17. A new conditional block"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" One joint Gaussian has mean 0 and covariance[[4,2],[2,2]]. Observe u=2 and predict v. Explain empty-observed and repeated-index cases."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Solve with the observed variance 4."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Gain 2/4=.5, so conditional mean 1. Conditional variance 2-(2×2/4)=1. Observing no coordinates returns the original joint model. Repeated coordinate indices do not form a unique partition and are rejected. The new conditional remains a declared-model inference, not a newly trained regression."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"18. A finite prior's expected log"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Prior concentration .5 each and fractional counts 1/3 give what posterior concentrations, mean weights and expected-log difference?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the digamma recurrence rather than logging a mean."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"Concentrations are 1.5/3.5, mean weights .3/.7. The common ψ(sumα) cancels from the difference. "}<InlineMath>{"\\psi(1.5)-\\psi(3.5)=-1/1.5-1/2.5=-16/15"}</InlineMath>{", different from log(.3/.7). Counts have already been included once in α."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"19. A stronger mean prior"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Change D62's prior mean strength "}<InlineMath>{"\\beta_0"}</InlineMath>{" from 1 to 2, keeping count 2, centre(1,0), scatter diag(.5,.25), prior mean 0, degrees 3 and W0=I. Compute the posterior factors and the mean-uncertainty term at its centre."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Separate weighted centre and between-centre matrix contributions."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"β=4, m=(.5,0), ν=5. The inverse scale is I+diag(1,.5)+(2×2/4)diag(1,0)=diag(3,1.5), hence W=diag(1/3,2/3). At x=m the displacement term is 0, but d/β=2/4=.5 remains. A query at the posterior centre does not remove uncertainty in the mean parameter."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"20. A valid predictive with undefined variance"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" A factor has ν=3,d2,β=1,W=I. Give its Student-t degrees and precision, then assess mean and covariance. Does ordinary BGM score or sample implement that integration?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Distribution validity and moment existence have different conditions."}</Prose>

</details>

<details><summary>Worked solution</summary>

<Prose>{"f=ν+1-d=2 and precision fβ/(1+β)W=I. The density is valid. Its mean exists because f>1, but covariance is not finite because f is not greater than 2. Ordinary expected-log scoring and plug-in Gaussian sampling are different computations, so neither can be called this integrated predictive without changing its implementation."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"Independent mini-project: a new density question"}</H3>

<Prose>{""}<strong>{"Task."}</strong>{" Choose a new low-dimensional collection, feature units, baseline, train/validation/test roles, preprocessing, candidate budget and selection rule before fitting. Report every outcome and failure, one changed unlabelled query, and a diagnosed limitation. Use the complete scratch or ordinary route; external partition annotations are optional and have a separate purpose."}</Prose>

<Prose>{""}<strong>{"Hint."}</strong>{" Keep the training transform and reserved boundary fixed. A prospective recipe without results is not yet an experiment."}</Prose>

<Prose>{""}<strong>{"Worked answer."}</strong>{" The complete answer file uses a deliberately "}<strong>{"constructed shifted stress fixture"}</strong>{", not a random sample or a real deployment: training values[-3,-2.5,-2,-1.5,1.5,2,2.5,3], validation[-2.25,-1.75,1.75,2.25], and a reserved central stress set[-.5,0,.5,1], in one declared arbitrary unit. No preprocessing changes these raw units. The two candidates are full scalar K=1 and K=2, one explicit start each, variance addition .05, seed 16,tolerance 1e-8,budget 50. Mean validation score selects K before stress evaluation. The reserved shift intentionally probes failure to transfer from separated groups into the centre; it is not an exchangeable generalization estimate."}</Prose>

<Prose>{"K=1 records train/validation scores -2.2598391879870587/-2.1388714460515748 and 3 iterations. K=2 records -1.535754797399725/-1.2771341251319084 and 4 iterations; both converged by their ordinary numerical rule. Validation selects K=2. On the already declared shifted stress set it scores -5.32697716966358, versus baseline -1.799009694899501, difference -3.5279674747640795. A new query .25 has log density -6.578045695518035 and positional component ID 1. That ID is not proof that the central query is common. The diagnosed limitation is the changed sampling region, visible through density rather than concealed by a confident component choice. All choices and all outcomes are preserved below."}</Prose>

<Prose>{"Complete worked-answer source and full recorded output for the separately declared shifted stress fixture."}</Prose>

<RemoteCodeBlock filename="gmm_mini_project.py" language="python" source="/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gmm_mini_project.py" />

<CodeBlock kind="output" filename="gmm_mini_project.stdout" language="output" downloadUrl="/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gmm_mini_project.stdout">{"new constructed candidate {'K': 1, 'train_score': -2.2598391879870587, 'validation_score': -2.1388714460515748, 'converged': True, 'iterations': 3}\nnew constructed candidate {'K': 2, 'train_score': -1.535754797399725, 'validation_score': -1.2771341251319084, 'converged': True, 'iterations': 4}\nvalidation-selected K 2\nreserved shifted stress score -5.32697716966358\nbaseline shifted stress score -1.799009694899501\nshifted stress difference -3.5279674747640795\nnew query density/ID [-6.578045695518035] [1]"}</CodeBlock>

<section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources" data-lesson-resource-list=""></section><H2>{"Further learning"}</H2>

<ul><li>{""}<strong>{"Andrew Ng, "}<a href={"https://cs229.stanford.edu/notes_archive/cs229-notes7b.pdf"}>{"Mixtures of Gaussians and the EM algorithm"}</a>{""}</strong>{" — four-page lecture notes. Read after section 7 for a compact second derivation of the hidden selector and fractional counts. Basic probability and matrix notation help; this lesson supplies the geometry and intermediate arithmetic that the notes compress."}</li><li>{""}<strong>{"Andrew Ng, "}<a href={"https://cs229.stanford.edu/notes-spring2019/cs229-notes8.pdf"}>{"The EM Algorithm"}</a>{""}</strong>{" — fourteen-page mathematical notes. Use after section 12 to connect the touching bound to other latent-variable problems. The later variational extension goes beyond the Gaussian fit; it is an extension route, not a prerequisite for the core walkthrough."}</li><li>{""}<strong>{"Christopher Bishop, "}<a href={"https://www.microsoft.com/en-us/research/wp-content/uploads/2006/01/Bishop-Pattern-Recognition-and-Machine-Learning-2006.pdf"}>{"Pattern Recognition and Machine Learning, chapters 9 and 10.2"}</a>{""}</strong>{" — freely accessible textbook PDF. Chapter 9 supplies Gaussian-mixture pictures, EM and its limitations; section 10.2 develops the finite variational model after our section 15. Chapter 2.3 is a useful Gaussian-geometry refresher. Pay attention to each book's covariance and Wishart-scale convention when comparing formulas."}</li><li>{""}<strong>{"Andrew Ng, "}<a href={"https://see.stanford.edu/Course/CS229/43"}>{"Stanford SEE Lecture 12: The Concept of Unsupervised Learning"}</a>{""}</strong>{" — optional video with companion notes. The creator's chapter listing covers mixtures, Jensen's inequality and EM; it is a spoken alternate route after sections 7 and 12. Its probability and linear-algebra prerequisites are stronger than this lesson's opening. Historical code/defaults should be checked against current documentation; the companion notes above provide a text route."}</li><li>{""}<strong>{"scikit-learn maintainers, "}<a href={"https://scikit-learn.org/stable/modules/mixture.html"}>{"Gaussian mixture models guide"}</a>{""}</strong>{" — practical illustrated documentation. After sections 9 and 15, compare covariance restrictions and finite versus stick-prior behavior. Read the accompanying API controls deliberately: a convergence flag, component cap or nonzero weight alone does not establish global optimality or a discovered true number of populations."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H2>{"Technical references"}</H2>

<ul><li>{""}<strong>{"Dempster, Laird and Rubin (1977), "}<a href={"https://web.mit.edu/6.435/www/Dempster77.pdf"}>{"Maximum Likelihood from Incomplete Data via the EM Algorithm"}</a>{""}</strong>{", "}<a href={"https://doi.org/10.1111/j.2517-6161.1977.tb01600.x"}>{"publisher record"}</a>{". The original general EM/GEM paper supports the same-objective improvement identity in section 12. Objective improvement alone does not imply convergent parameters, a maximum or a global optimum; the stronger statements require additional hypotheses."}</li><li>{""}<strong>{"Wu (1983), "}<a href={"https://doi.org/10.1214/aos/1176346060"}>{"On the Convergence Properties of the EM Algorithm"}</a>{""}</strong>{". A primary convergence reference for the distinction between stationary limits and stronger optimization claims. Consult the actual theorem hypotheses before applying it to a singular mixture; this lesson does not rely on an unqualified convergence theorem."}</li><li>{""}<strong>{"Bishop (2006), "}<a href={"https://www.microsoft.com/en-us/research/wp-content/uploads/2006/01/Bishop-Pattern-Recognition-and-Machine-Learning-2006.pdf"}>{"PRML"}</a>{""}</strong>{", Gaussian sections 2.3, mixtures/EM chapter 9 and variational mixtures 10.2. These are the formula homes for conditional Gaussian blocks, fractional scatter, the bound, and Normal-Wishart/Dirichlet factors. Our posterior mean weight is alpha divided by the sum of alpha, with no second addition of the count."}</li><li>{""}<strong>{"scikit-learn, "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.mixture.GaussianMixture.html"}>{"GaussianMixture API"}</a>{""}</strong>{" and "}<strong>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.mixture.BayesianGaussianMixture.html"}>{"BayesianGaussianMixture API"}</a>{""}</strong>{". Exact parameter/fitted-array shapes, initialization, regularization and inference conventions for the ordinary routes. The accompanying source links resolve fit-loop timestamps and expected-log Bayesian scoring. The demonstrated environment uses scikit-learn 1.9.1; future releases can change defaults or internals."}</li><li>{""}<strong>{"SciPy, "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.multivariate_normal.html"}>{"multivariate_normal"}</a>{""}</strong>{" and "}<strong>{""}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.multivariate_t.html"}>{"multivariate_t"}</a>{""}</strong>{". Log-density comparisons in the scratch routes use explicit positive-definite Gaussian covariance and Student-t shape/degree conventions; Student-t shape is not its covariance."}</li><li>{""}<strong>{"Fisher's Iris data, "}<a href={"https://archive.ics.uci.edu/dataset/53/iris"}>{"UCI dataset record"}</a>{""}</strong>{". Dataset identity, corrected measurements and attribution. The downloadable CSV and provenance file travel together. Species is an external annotation for the saved partition diagnostic, never an input to the selected density fit."}</li></ul>

<Prose>{"The common file index gives each complete file, dependency, exact data/state and attributed output once. Semantic excerpts identify the same canonical source. The next syllabus topic is "}<a href={"/learn/path/full-curriculum/t-sne-umap-manifold-learning?module=classical-ml"}>{"t-SNE & UMAP"}</a>{", where preserving local neighbourhoods replaces fitting a mixture density. "}<a href={"/learn/path/full-curriculum/independent-component-analysis-ica?module=classical-ml"}>{"ICA"}</a>{" and "}<a href={"/learn/path/full-curriculum/non-negative-matrix-factorization-nmf?module=classical-ml"}>{"NMF"}</a>{" are different additive-factor questions, not prerequisites for this mixture."}</Prose></section>

<H2>{"Complete programs and supporting files"}</H2>

<Prose>{"Keep the relative subfolders when using these files together. The common file index collects their downloads."}</Prose>

<ul><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/bayesian_weights.py"}>{"programs/bayesian_weights.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/conditional_gaussian_mixture.py"}>{"programs/conditional_gaussian_mixture.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/data-provenance.md"}>{"programs/data-provenance.md"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/em_1d.py"}>{"programs/em_1d.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/finite_variational_gmm.py"}>{"programs/finite_variational_gmm.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/fractional_gaussian_update.py"}>{"programs/fractional_gaussian_update.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_em.py"}>{"programs/gaussian_em.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_failure_modes.py"}>{"programs/gaussian_failure_modes.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_log_density.py"}>{"programs/gaussian_log_density.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_mixture.py"}>{"programs/gaussian_mixture.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gaussian_scalar.py"}>{"programs/gaussian_scalar.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gmm_mini_project.py"}>{"programs/gmm_mini_project.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/gmm_saved_iris.json"}>{"programs/gmm_saved_iris.json"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/iris.csv"}>{"programs/iris.csv"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/iris_density.py"}>{"programs/iris_density.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/mixture_crossings.py"}>{"programs/mixture_crossings.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/mixture_lower_bound.py"}>{"programs/mixture_lower_bound.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/ordinary_gaussian_em.py"}>{"programs/ordinary_gaussian_em.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/ordinary_variational_gmm.py"}>{"programs/ordinary_variational_gmm.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/saved_iris_mixture.py"}>{"programs/saved_iris_mixture.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/programs/soft_assignment_limit.py"}>{"programs/soft_assignment_limit.py"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/setup-guide.md"}>{"setup-guide.md"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/bayesian_weights.stdout"}>{"outputs/bayesian_weights.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/conditional_gaussian_mixture.stdout"}>{"outputs/conditional_gaussian_mixture.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/em_1d.stdout"}>{"outputs/em_1d.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/finite_variational_gmm.stdout"}>{"outputs/finite_variational_gmm.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/fractional_gaussian_update.stdout"}>{"outputs/fractional_gaussian_update.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_em.stdout"}>{"outputs/gaussian_em.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_failure_modes.stdout"}>{"outputs/gaussian_failure_modes.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_log_density.stdout"}>{"outputs/gaussian_log_density.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_mixture.stdout"}>{"outputs/gaussian_mixture.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gaussian_scalar.stdout"}>{"outputs/gaussian_scalar.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/gmm_mini_project.stdout"}>{"outputs/gmm_mini_project.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/iris_density.stdout"}>{"outputs/iris_density.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/mixture_crossings.stdout"}>{"outputs/mixture_crossings.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/mixture_lower_bound.stdout"}>{"outputs/mixture_lower_bound.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/ordinary_gaussian_em.stdout"}>{"outputs/ordinary_gaussian_em.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/ordinary_variational_gmm.stdout"}>{"outputs/ordinary_variational_gmm.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/saved_iris_mixture.stdout"}>{"outputs/saved_iris_mixture.stdout"}</a>{""}</li><li>{""}<a href={"/learn-code/gaussian-mixture-models-gmm-em-algorithm/outputs/soft_assignment_limit.stdout"}>{"outputs/soft_assignment_limit.stdout"}</a>{""}</li></ul></div>;}
export default {title:'Gaussian Mixture Models & EM',readTime:'~90 min first pass · ~180 min complete read + 3–5 h code and practice',content:Content};
