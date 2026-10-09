// Entire accepted manuscript in private staging; root owns publication.
import { Prose, H2, H3, CodeBlock } from "../../components/content/index.js";
import { MathBlock, Math as InlineMath } from "../../components/content/Math.jsx";
import { NeuralTable } from "../../components/lesson-labs/NeuralLessonElements.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import { PcaReadingFlowFigure } from "../../components/lesson-labs/PcaReadingFlow.jsx";
import { PcaSupportingFiles } from "../../components/lesson-labs/PcaReadingFlowFiles.jsx";

export function PcaReadingFlowLesson() {
  return <div className="lesson-flow pca-reading-flow">
<Prose opening="summary">{"Can we replace a record's many measurements with a few coordinates, while keeping enough information for our purpose? Principal component analysis, or PCA, gives a precise answer for one purpose: retain as much squared variation as possible, or equivalently lose as little squared reconstruction distance as possible, under a chosen measurement scale. We will first build that answer with four records, then use real Wine measurements to decide what to scale, retain and diagnose."}</Prose>

<Prose opening="prerequisites">{"You need arrays, addition, multiplication and a squared distance. We refresh the geometry before using matrix notation. "}<a href={"/learn/path/full-curriculum/eigenvalues-eigenvectors?module=math-foundations#5-find-a-direction-that-retains-variation"}>{"Eigenvalues & Eigenvectors, section 5"}</a>{" and "}<a href={"/learn/path/full-curriculum/matrix-decompositions-svd-qr-cholesky-lu?module=math-foundations#5-svd-follow-independent-stretches"}>{"Matrix Decompositions, section 5"}</a>{" offer a second route to the direction calculations. The local explanation supplies the observation-to-coordinate-to-reconstruction workflow."}</Prose>

<H2>{"1. Can we keep fewer numbers without losing the pattern?"}</H2>

<Prose>{"Begin with one instrument record: which measurements must remain paired when we turn records into coordinates?"}</Prose>

<PcaReadingFlowFigure job="D01" />

<Prose>{"Each instrument record has two measurements. Record A contains "}<code>{"(1,1)"}</code>{", B "}<code>{"(2,0)"}</code>{", C "}<code>{"(4,4)"}</code>{" and D "}<code>{"(5,3)"}</code>{". The row labels connect each physical record to one row of the table; the column labels connect the first and second measurements to their corresponding entries. A "}<strong>{"feature"}</strong>{" is one measured attribute. An "}<strong>{"observation"}</strong>{" is a record with values for those features. Here there are four observations and two features: "}<code>{"n=4"}</code>{", "}<code>{"d=2"}</code>{". Reducing the number of features does not reduce the number of observations."}</Prose>

<PcaReadingFlowFigure job="D02" />

<Prose>{"A's first measurement puts it at the horizontal tick 1; its second measurement puts it at vertical tick 1. The other three rows become points in exactly the same way. The paired values matter: sorting each column independently would destroy which measurements belonged together. These are constructed measurements for tracing the method, rather than evidence of an empirical cluster."}</Prose>

<Prose>{"Two stored numbers locate a point exactly. Imagine laying one ruler through the cloud and storing just a reading along that ruler for each record. This could save space, but points beside the ruler would need an approximation when we recover them."}</Prose>

<PcaReadingFlowFigure job="D03" />

<Prose>{"The four reading slots are empty because we have not yet calculated the readings. Someone receiving those slots would also need the shared ruler's direction and its reference location. The recovered scatter beside them is a storage preview, not a calculated result. Keeping only one reading cannot retain every original coordinate. Which ruler and reference should we choose? We first put the reference in the middle, then calculate what each ruler would retain."}</Prose>

<H2>{"2. Rotate the ruler, then keep its readings"}</H2>

<Prose>{"The storage preview needs a shared reference; placing it at the four-record mean lets the ruler describe spread rather than the cloud's location."}</Prose>

<PcaReadingFlowFigure job="D04" />

<Prose>{"The average first measurement is "}<code>{"(1+2+4+5)/4=3"}</code>{"; the average second is "}<code>{"(1+0+4+3)/4=2"}</code>{". The marked reference location is therefore "}<code>{"(3,2)"}</code>{", the "}<strong>{"mean"}</strong>{". We denote this vector by "}<code>{"μ"}</code>{". A's displacement from it is "}<code>{"(1−3,1−2)=(−2,−1)"}</code>{". Applying the same subtraction to each record gives:"}</Prose>

<NeuralTable caption={"2. Rotate the ruler, then keep its readings"} headers={[<>{"Record"}</>,<>{"Original measurements"}</>,<>{"Centered displacement"}</>]} rows={[[<>{"A"}</>,<>{"(1,1)"}</>,<>{"(−2,−1)"}</>],[<>{"B"}</>,<>{"(2,0)"}</>,<>{"(−1,−2)"}</>],[<>{"C"}</>,<>{"(4,4)"}</>,<>{"(1,2)"}</>],[<>{"D"}</>,<>{"(5,3)"}</>,<>{"(2,1)"}</>]]} />

<Prose>{"The centered columns each sum to zero. Moving the origin removes the common location while preserving distances between records. A line constrained to the original origin would answer a different question: it could spend its direction explaining where the whole cloud sits, rather than its variation around the middle."}</Prose>

<PcaReadingFlowFigure job="D05" />

<Prose>{"Use a ruler tilted 45° toward the upper right. Its unit direction has coefficients "}<code>{"(1/√2,1/√2)"}</code>{"; call it "}<code>{"v₁"}</code>{". A unit direction has squared length 1, so a reading along it uses the same distance scale as the measurement axes. Multiply A's horizontal displacement by the first coefficient and its vertical displacement by the second, then add:"}</Prose>

<div className="neural-equation"><MathBlock>{"z_A=(-2)(1/\\sqrt2)+(-1)(1/\\sqrt2)=-3/\\sqrt2."}</MathBlock></div>

<Prose>{"This multiply-and-add is a "}<strong>{"dot product"}</strong>{". The negative sign says A lies behind the reference along this oriented ruler. Its reading, or "}<strong>{"score"}</strong>{", is one scalar. It is different from the two-coordinate point where A meets the ruler. Changing the ruler's orientation to its opposite would reverse the score's sign too."}</Prose>

<PcaReadingFlowFigure job="D06" />

<Prose>{"To return from a score, move "}<code>{"z_A"}</code>{" units along the unit direction. The centered recovered vector is "}<code>{"z_Av₁=(−1.5,−1.5)"}</code>{". Restore the mean to get "}<code>{"(1.5,.5)"}</code>{". The remaining displacement from that recovered point to the original A is "}<code>{"(−.5,.5)"}</code>{". This "}<strong>{"residual"}</strong>{" is perpendicular to the ruler: its dot product with the direction is "}<code>{"−.5/√2+.5/√2=0"}</code>{". That cancellation distinguishes an orthogonal projection from an arbitrary guess on a line."}</Prose>

<Prose>{"The same operations fill the preview's four reading slots and recovered rows:"}</Prose>

<NeuralTable caption={"2. Rotate the ruler, then keep its readings"} headers={[<>{"Record"}</>,<>{"Score on v₁"}</>,<>{"Recovered measurements"}</>,<>{"Residual"}</>]} rows={[[<>{"A"}</>,<>{"−3/√2"}</>,<>{"(1.5,.5)"}</>,<>{"(−.5,.5)"}</>],[<>{"B"}</>,<>{"−3/√2"}</>,<>{"(1.5,.5)"}</>,<>{"(.5,−.5)"}</>],[<>{"C"}</>,<>{"3/√2"}</>,<>{"(4.5,3.5)"}</>,<>{"(−.5,.5)"}</>],[<>{"D"}</>,<>{"3/√2"}</>,<>{"(4.5,3.5)"}</>,<>{"(.5,−.5)"}</>]]} />

<Prose>{"A and B share the same score despite having different original measurements. The stored coordinate cannot tell which of those two points produced it. The approximation makes that lost distinction concrete."}</Prose>

<Prose>{"For a centered point "}<code>{"a=x−μ"}</code>{" and a unit direction "}<code>{"v"}</code>{", the two operations are now familiar:"}</Prose>

<div className="neural-equation"><MathBlock>{"z=a\\cdot v,\\qquad \\hat x=\\mu+zv,\\qquad r=x-\\hat x."}</MathBlock></div>

<PcaReadingFlowFigure job="D07" />

<Prose>{"Rotate the ruler while keeping these four records fixed. At 45° the squared readings sum to 18 and the squared residuals sum to 2. A horizontal ruler keeps 10 and loses 10; the perpendicular 135° ruler keeps 2 and loses 18. Every angle divides the same centered total 20. The live angle changes all readings and perpendicular feet together; Reset returns 45°. The useful direction is the one that retains the largest sum of squared readings. We will explain why that also minimizes loss in the next section."}</Prose>

<PcaReadingFlowFigure job="D08" />

<Prose>{"Now ask a different question: what if a measurement changes? Select a record and edit its two measurements. Its label and hue stay attached to its row and marker as the miniature four-record mean and leading ruler are recalculated. This investigation refits only this constructed fixture; it is separate from rotating a fixed ruler. If every row becomes identical, all centered values are zero: there is no nonzero spread or preferred direction, and a variance fraction has no denominator. Reset restores the original rows and selection."}</Prose>

<PcaReadingFlowFigure job="D09" />

<Prose>{"The perpendicular direction "}<code>{"v₂=(1,−1)/√2"}</code>{" supplies a second reading. Together these two orthonormal directions form a rotated coordinate system. Keeping both readings recovers every point; keeping just the first discards the second; keeping none returns the shared mean. The kept count is "}<code>{"k"}</code>{". The dropped coordinate track remains visible so we can see exactly which multiplication is omitted. Storage needs both per-record readings and the shared retained directions and mean."}</Prose>

<H2>{"3. Why maximum spread and minimum loss give the same answer"}</H2>

<Prose>{"The ruler retained 18 and lost 2; the perpendicular foot lets us account for both pieces of the same squared distance."}</Prose>

<PcaReadingFlowFigure job="D10" />

<Prose>{"A's centered displacement has squared length "}<code>{"(-2)²+(-1)²=5"}</code>{". Its projection has squared length "}<code>{"(-1.5)²+(-1.5)²=4.5"}</code>{"; its residual has squared length "}<code>{"(-.5)²+.5²=.5"}</code>{". The perpendicular triangle and its area squares show "}<code>{"5=4.5+.5"}</code>{". The numbers label square "}<strong>{"areas"}</strong>{": the residual square's side is "}<code>{"√.5"}</code>{", rather than "}<code>{".5"}</code>{". Repeating the calculation for the four records gives "}<code>{"20=18+2"}</code>{"."}</Prose>

<Prose>{"The same right-triangle identity holds for every fixed unit ruler. If "}<code>{"a=zv+r"}</code>{", with "}<code>{"v·r=0"}</code>{", expanding the square gives"}</Prose>

<div className="neural-equation"><MathBlock>{"\\|a\\|^2=z^2\\|v\\|^2+2z(v\\cdot r)+\\|r\\|^2=z^2+\\|r\\|^2."}</MathBlock></div>

<Prose>{"Summing over a fixed centered table makes the left side constant. Increasing retained squared length must decrease residual squared length by exactly the same amount. This equivalence assumes the same rows and the same feature weighting on both sides. Changing the measurement scale changes the total and the optimization question."}</Prose>

<PcaReadingFlowFigure job="D11" />

<Prose>{"The first scores have mean 0 and squared sum 18. Dividing by "}<code>{"n−1=3"}</code>{" gives sample variance 6. The second scores have squared sum 2 and sample variance "}<code>{"2/3"}</code>{". A population-style denominator "}<code>{"n=4"}</code>{" instead gives 4.5 and .5. Both conventions produce the same directions and the same variance fractions "}<code>{"18/20=.9"}</code>{" and "}<code>{"2/20=.1"}</code>{"; their variance units differ by the common factor."}</Prose>

<Prose>{"Reconstruction errors have another set of denominators. The sum of squared residuals, "}<strong>{"SSE"}</strong>{", is 2; average squared distance per observation is "}<code>{"2/4=.5"}</code>{"; mean squared error per measurement entry is "}<code>{"2/(4·2)=.25"}</code>{". Always name the denominator. A plot labelled only “error” conceals which quantity it shows."}</Prose>

<PcaReadingFlowFigure job="D12" />

<Prose>{"We can organize the feature cross-products in a "}<strong>{"covariance matrix"}</strong>{". A's centered x and y contribute "}<code>{"(-2)(-1)=2"}</code>{"; B contributes 2, C contributes 2 and D contributes 2, giving the sum "}<code>{"2+2+2+2=8"}</code>{". Each diagonal sum of feature squares is 10. Divide each sum by 3:"}</Prose>

<div className="neural-equation"><MathBlock>{"C=\\frac1{n-1}A^TA=\\frac13\\begin{bmatrix}10&8\\\\8&10\\end{bmatrix}."}</MathBlock></div>

<Prose>{"Here "}<code>{"A"}</code>{" names the centered row table; "}<code>{"T"}</code>{" turns rows into columns for multiplication. "}<code>{"C"}</code>{" is a 2×2 relation between features, rather than a 4×4 relation between records. Its off-diagonal entry arises from matching the same record across the two columns."}</Prose>

<PcaReadingFlowFigure job="D13" />

<Prose>{"Multiplying "}<code>{"C"}</code>{" by the diagonal unit ruler gives two outputs "}<code>{"(10+8)/(3√2)=6/√2"}</code>{". Thus "}<code>{"Cv₁=6v₁"}</code>{": the action stretches this direction by 6. A direction preserved by the matrix action is an "}<strong>{"eigenvector"}</strong>{"; the stretch is its "}<strong>{"eigenvalue"}</strong>{". Taking another dot product gives "}<code>{"v₁ᵀCv₁=6"}</code>{", exactly the sample variance of the scores. The horizontal candidate gives "}<code>{"10/3"}</code>{", so finding an eigenvector is useful only if we choose the largest appropriate eigenvalue. The full optimum proof follows in section 10.1."}</Prose>

<PcaReadingFlowFigure job="D14" />

<Prose>{"The diagonal covariance entries sum to "}<code>{"20/3"}</code>{". This sum, called the "}<strong>{"trace"}</strong>{", is total sample variance. Keeping 6 leaves "}<code>{"20/3−6=2/3"}</code>{"; multiplying by 3 restores discarded SSE 2. The geometric triangles, the score square sums and covariance bookkeeping are three descriptions of the same retained-versus-lost quantity. None measures all information relevant to every task."}</Prose>

<H2>{"4. Fit once, project, and reconstruct in Python"}</H2>

<Prose>{"The dot-product and return operations now define a reusable fitted object: which values may a later query read, and which must it leave fixed?"}</Prose>

<PcaReadingFlowFigure job="D15" />

<Prose>{"Training calculates the mean and directions. A later query uses those already-fitted values; it does not move the mean or become another training row. Store direction vectors as the rows of a "}<code>{"k×d"}</code>{" array "}<code>{"D"}</code>{". With observations in rows, the fitted operations are"}</Prose>

<div className="neural-equation"><MathBlock>{"A=X-\\mu,\\quad Z=AD^T,\\quad \\hat X=ZD+\\mu."}</MathBlock></div>

<Prose>{"For one query with two measurements and one retained direction, the ports are "}<code>{"1×2 → 1×1 → 1×2"}</code>{". The transpose puts the direction's two coefficients into the column that the query row multiplies. "}<code>{"Z"}</code>{" stores scores, while "}<code>{"D"}</code>{" stores the shared decoder; they have different meanings despite both being numerical arrays."}</Prose>

<PcaReadingFlowFigure job="D16" />

<Prose>{"The later measurement "}<code>{"(6,4)"}</code>{" becomes "}<code>{"(3,2)"}</code>{" after subtracting the fitted mean. Its reading is "}<code>{"3/√2+2/√2=5/√2"}</code>{". Return along the same ruler to "}<code>{"(2.5,2.5)"}</code>{", then restore the mean to "}<code>{"(5.5,4.5)"}</code>{". The residual is "}<code>{"(.5,−.5)"}</code>{", squared length .5. Editing the query changes that arithmetic but leaves the fitted mean and direction fixed. A query at the mean has reading 0; a query outside the training range is projected without silently clipping it."}</Prose>

<PcaReadingFlowFigure job="D17" />

<Prose>{"We have calculated what a direction does. "}<strong>{"Singular value decomposition"}</strong>{", SVD, is a maintained numerical primitive that finds orthogonal directions and their dataset energy without first forming covariance. It writes the centered table as "}<code>{"A=U S Vᵀ"}</code>{". "}<code>{"V"}</code>{" contains feature directions in columns, so the Python return "}<code>{"Vh=Vᵀ"}</code>{" contains them in rows. "}<code>{"S"}</code>{" contains nonnegative singular values; "}<code>{"U"}</code>{" contains normalized observation patterns. In this fixture "}<code>{"s₁=√18"}</code>{", "}<code>{"u₁=(-.5,-.5,.5,.5)"}</code>{", and multiplying "}<code>{"s₁u₁"}</code>{" recovers the four first scores. The second singular value is "}<code>{"√2"}</code>{"."}</Prose>

<Prose>{"The concise original example below centers, decomposes, selects the first direction and decodes. It is followed by a reusable version that exposes fitted state and query operations. Its output is retained from the original execution; it is not a newly measured Wine or Gaussian result."}</Prose>

<Prose>{""}<code>{"svd.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/svd.py"} filename={"svd.py"} title="Complete program" />

<Prose>{"Retained historical output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"svd.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/svd.stdout.txt"} title={"Retained historical output"}>{"[6.     0.6667]\n[0.9 0.1]\n[[1.5 0.5]\n [1.5 0.5]\n [4.5 3.5]\n [4.5 3.5]]\n0.25"}</CodeBlock>

<Prose>{""}<code>{"centered=X−mean"}</code>{" establishes the same displacements we traced. "}<code>{"Vh[:k]"}</code>{" keeps direction rows; "}<code>{"centered @ directions.T"}</code>{" makes scores; "}<code>{"scores @ directions + mean"}</code>{" restores points. The printed variances 6 and "}<code>{"2/3"}</code>{" use "}<code>{"n−1"}</code>{"; the entryMSE is .25. An SVD routine supplies factorization, rather than hiding the PCA assembly inside a fitted PCA estimator."}</Prose>

<Prose>{"The complete reusable program below copies the input, stores the mean/directions/variances, reports a numerical rank and exposes transform/inverse methods. Direction rows contain only the retained "}<code>{"k"}</code>{" axes; its singular-value, variance and fraction diagnostics describe the whole computed thin spectrum. The numerical floor "}<code>{"eps·max(n,d)·smax"}</code>{" is a floating-point rank diagnostic, not a scientific signal threshold. Its scores use the original projected-distance metric throughout; section 10.3 adds a separate complete adapter after explaining how and why that metric changes. Constant centered energy reports an undefined variance-share value rather than dividing by zero; "}<code>{"k=0"}</code>{" returns the mean."}</Prose>

<Prose>{""}<code>{"centered_pca.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/centered_pca.py"} filename={"centered_pca.py"} title="Complete program" />

<Prose>{"Selected recorded reference output; same operations as the recorded calculation:"}</Prose>

<CodeBlock language="text" kind="output" filename={"centered_pca.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/centered_pca.stdout.txt"} title={"Selected recorded reference output; same operations as the recorded calculation"}>{"mean [3. 2.]\ndirections [[0.707107 0.707107]]\nvariances [6.       0.666667]\nvariance_ratios [0.9 0.1]\nscores [[-2.12132]\n [-2.12132]\n [ 2.12132]\n [ 2.12132]]\nreconstructed [[1.5 0.5]\n [1.5 0.5]\n [4.5 3.5]\n [4.5 3.5]]\nentry_mse 0.25\nqueries_reconstructed [[5.5 4.5]\n [6.5 5.5]\n [3.  2. ]]\nlibrary_reconstruction_equal True\nk2_roundtrip True\nk0_scores_shape (4, 0)\nk0_reconstructed [[3. 2.]\n [3. 2.]\n [3. 2.]\n [3. 2.]]\nconstant_rank_and_ratios 0 None"}</CodeBlock>

<Prose>{"The new constructed main uses our four rows and fixed later queries. It prints .25 for entryMSE, "}<code>{"(5.5,4.5)"}</code>{" for the first query, and a full two-coordinate round trip. Its library comparison fixes "}<code>{"PCA(n_components=1, svd_solver=\"full\")"}</code>{" on the same constructed rows, then compares recovered values. Signed vectors can differ without changing the recovered table, because reversing a direction also reverses its score. At a tied boundary even the kept projector can differ; compare the applicable invariant rather than raw factor entries."}</Prose>

<Prose>{"The original library continuation is preserved separately. It expects "}<code>{"np"}</code>{" and "}<code>{"X"}</code>{" from the original "}<code>{"svd.py"}</code>{", so run that exact predecessor in the same namespace before the continuation, for example "}<code>{"exec(Path(\"svd.py\").read_text(), namespace)"}</code>{" followed by the same operation for "}<code>{"library.py"}</code>{", after importing "}<code>{"Path"}</code>{" from "}<code>{"pathlib"}</code>{" and creating "}<code>{"namespace={}"}</code>{". This complete continuation recipe is for the four constructed rows. The reusable new program above is independently runnable without this historical namespace."}</Prose>

<Prose>{""}<code>{"library.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/library.py"} filename={"library.py"} title="Complete program" />

<Prose>{"Retained historical output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"library.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/library.stdout.txt"} title={"Retained historical output"}>{"(1, 2) (4, 1)\n[[5.5 4.5]]"}</CodeBlock>

<Prose>{"The ordinary estimator's "}<code>{"mean_"}</code>{" matches "}<code>{"mean"}</code>{"; "}<code>{"components_"}</code>{" matches direction rows; "}<code>{"transform"}</code>{" subtracts the fitted mean and makes scores; "}<code>{"inverse_transform"}</code>{" returns along those rows and restores the mean. It centers but does not standardize the features. Fit this dense route costs roughly "}<code>{"O(nd·min(n,d))"}</code>{"; fitted state needs the "}<code>{"kd"}</code>{" directions and "}<code>{"d"}</code>{" mean entries plus diagnostic values. Projecting or decoding "}<code>{"q"}</code>{" queries costs "}<code>{"O(qdk)"}</code>{". Choosing a faster approximate or batch method will change the computational contract, which we examine later. First we must decide which measurement differences deserve equal weight."}</Prose>

<H2>{"5. Scaling changes which differences matter"}</H2>

<Prose>{"The fitted direction depends on squared distances. The same physical measurement expressed in a different unit changes its numerical difference, and squaring magnifies that change."}</Prose>

<PcaReadingFlowFigure job="D18" />

<Prose>{"Take four rectangle corners "}<code>{"(−2,−1),(−2,1),(2,−1),(2,1)"}</code>{", centered at 0. Their x-coordinate squares sum to 16; their y-coordinate squares sum to 4. If we express y in units giving readings "}<code>{"m·y"}</code>{", the second sum becomes "}<code>{"4m²"}</code>{". The underlying four records have not acquired a new physical relationship; we have changed how expensive their errors are in the numerical metric. A positive feature weight "}<code>{"w"}</code>{" can be implemented by multiplying its coordinate by "}<code>{"√w"}</code>{", since "}<code>{"(√w·r)²=w·r²"}</code>{"."}</Prose>

<PcaReadingFlowFigure job="D19" />

<Prose>{"Both lanes show the same records at the current unit multiplier. At "}<code>{"m=1"}</code>{", raw PCA chooses the horizontal axis and retains "}<code>{"16/(16+4)=.8"}</code>{". At "}<code>{"m=2"}</code>{" both sums are 16: any unit ruler is an equally good first direction. At "}<code>{"m=10"}</code>{", the vertical axis retains "}<code>{"400/416=25/26"}</code>{". In the standardized lane, dividing by the fitted population-style scales "}<code>{"2"}</code>{" and "}<code>{"m"}</code>{" always produces the square "}<code>{"(±1,±1)"}</code>{". Its two coordinate energies are 4 and 4 for every positive multiplier, so there is no unique first direction and every one-coordinate optimum retains half the energy. Neither lane hides this tie behind a preferred diagonal arrow."}</Prose>

<Prose>{"The live multiplier changes both lanes immediately; Reset returns 1. Exact equality at 2 is a mathematical tie. The numerical adapter reports a tie when its eigenvalue gap is at most "}<code>{"1e−12"}</code>{" times the larger absolute eigenvalue. This declared finite-arithmetic decision is different from asserting that two physical variances are exactly equal. Standardization changes the objective; it does not reveal a uniquely correct metric for every purpose."}</Prose>

<PcaReadingFlowFigure job="D20" />

<Prose>{"Fit a mean and scale to each training column. Subtract its mean, square the centered values, average with denominator "}<code>{"n"}</code>{", and take the square root. The standardized value is "}<code>{"(x−μ)/s"}</code>{". To restore an approximate measurement, multiply by the same stored scale and add the same stored mean. A constant training feature has zero centered spread; this route stores effective scale 1 so its training standardized values remain 0. A later query can differ from that constant: scale 1 preserves its difference rather than silently deleting the feature."}</Prose>

<Prose>{""}<code>{"PopulationScaler"}</code>{" below follows those operations. It rejects missing values in its scratch route; the separately complete ordinary pipeline imputes training means, then fits scaler/PCA on that same training table. Its future query uses those stored imputation/scaling values. Mean imputation encodes a missingness decision; it does not establish that missingness is harmless. Constant or nearly constant column policies can differ in a library's numerical safeguards, so the matched ordinary comparisons here use the stated finite moderate-scale fixtures. Zero metric weights would delete a feature and prevent this inverse scaling; negative weights do not define the squared-distance metric."}</Prose>

<Prose>{""}<code>{"pca_metrics.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/pca_metrics.py"} filename={"pca_metrics.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"pca_metrics.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/pca_metrics.stdout.txt"} title={"Recorded new instructional output"}>{"multiplier 1.0\nraw_energy_axis_share [16.  4.] horizontal 0.8\nstandardized_energy_axis_share [4. 4.] tied 0.5\nscaler_library_equal True\ntied_optimal_losses 4.0 4.0\nmultiplier 2.0\nraw_energy_axis_share [16. 16.] tied 0.5\nstandardized_energy_axis_share [4. 4.] tied 0.5\nscaler_library_equal True\ntied_optimal_losses 4.0 4.0\nmultiplier 10.0\nraw_energy_axis_share [ 16. 400.] vertical 0.9615384615384616\nstandardized_energy_axis_share [4. 4.] tied 0.5\nscaler_library_equal True\ntied_optimal_losses 4.0 4.0\npopulation_sample_variance [4. 1.] [5.333333 1.333333]\nconstant_scale_and_mask [2. 1.] [False  True]\nquery_scaled_and_restored [[1.5 2. ]] [[3. 9.]]\nweighted_loss_two_routes 12.499999999999998 12.5\nimputer_training_statistics [3.       5.333333]\nmissing_query_score [[-0.]]"}</CodeBlock>

<Prose>{"The main prints both raw and standardized representations for "}<code>{"m=1,2,10"}</code>{", rather than making the learner select which one to see. Its equal-loss comparison in the standardized square is deliberate: library and scratch may choose different equally good one-dimensional rulers. Scaling costs "}<code>{"O(nd)"}</code>{" to fit,"}<code>{"O(qd)"}</code>{" per query table and "}<code>{"O(d)"}</code>{" stored state. Computing variance from centered sums avoids the cancellation in "}<code>{"E[X²]−E[X]²"}</code>{", though enormous squared values can still overflow and need rescaling."}</Prose>

<PcaReadingFlowFigure job="D21" />

<Prose>{"Real measurements bring a consequential scale choice. The supplied Wine table contains 178 wines,13 chemical features and three cultivar codes. A row is one wine; the first includes alcohol 14.23, malic acid 1.71 and proline 1065. Cultivar is a separate category annotation, with counts 59,71 and 48; it is not a fourteenth numerical PCA feature. The offline CSV is the scikit-learn mirror of UCI Wine, DOI 10.24432/C5PC7J, licensed CC BY 4.0. Its CSV and saved labels use codes 1–3; the ordinary "}<code>{"load_wine"}</code>{" API uses 0–2. The supplied feature order is fixed. Do not infer missing measurement units or treat cultivar codes as distances."}</Prose>

<PcaReadingFlowFigure job="D22" />

<Prose>{"The two saved descriptive fits use all 178 observations. Raw PC1 retains "}<code>{".9980912304918974"}</code>{" of raw squared variation, largely reflecting the scale of proline. After fitted standardization, the first three fractions are "}<code>{".36198848099926323"}</code>{","}<code>{".1920749025700898"}</code>{" and "}<code>{".11123630536249964"}</code>{". Both thirteen-bar spectra stay visible on the same 0–1 fraction scale, but each fraction divides its own metric's total. Subtracting the first fractions would not measure destroyed information. This is a description of the supplied collection, rather than a prediction-performance evaluation."}</Prose>

<Prose>{"The complete original ordinary calculation and its measured output are retained below. The interactive views and the later saved-state reader reuse its state instead of executing this scientific fit again."}</Prose>

<Prose>{""}<code>{"wineScaling.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/wineScaling.py"} filename={"wineScaling.py"} title="Complete program" />

<Prose>{"Retained historical output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"wineScaling.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/wineScaling.stdout.txt"} title={"Retained historical output"}>{"(178, 13) [59 71 48]\n[0.9981 0.0017]\n[0.362  0.1921 0.1112]\n0.5541"}</CodeBlock>

<PcaReadingFlowFigure job="D23" />

<Prose>{"The coordinate map derives scores by applying the saved full-collection mean, scales and basis. Changing the displayed component pair or selected record changes which stored-direction products we inspect; it never retrains. Cultivar shapes annotate the resulting coordinates without entering their calculation. A visibly separated cultivar could be interesting, but this unsupervised picture alone establishes neither a classifier's generalization nor a causal chemical explanation."}</Prose>

<H2>{"6. Choose the number of components for a stated purpose"}</H2>

<Prose>{"Scaling defines what variation costs. The kept count defines how much of that particular cost we accept. A visualization, a storage budget and prediction are distinct purposes; a single percentage cannot settle all three."}</Prose>

<PcaReadingFlowFigure job="D24" />

<Prose>{"For the descriptive standardized collection, adding the first two fractions gives "}<code>{".554063383569353"}</code>{"; adding through eight gives about "}<code>{".9201754432"}</code>{", and through ten about "}<code>{".9616971684"}</code>{". Individual bars show each increment; the cumulative curve shows their running sum. They are summaries of the same full-collection fit. An elbow can invite inspection, but it does not supply an objective or an independent test."}</Prose>

<PcaReadingFlowFigure job="D25" />

<Prose>{"For measurement compression, the preserved experiment used 133 training rows and 45 validation rows from a stratified seed 42 split. Only training measurements fit the scaler and PCA basis. Cultivar categories helped form the split, then their lane ends; they do not enter the PCA table. Both portions use the training transform. Validation errors help choose a count, so these 45 rows are development evidence rather than an untouched final test. Even unsupervised preprocessing can leak later-data information if its mean or directions are fitted on validation values."}</Prose>

<PcaReadingFlowFigure job="D26" />

<Prose>{"The declared budget is: keep the fewest coordinates whose validation standardized squared error is at most 10% of always returning the training mean. The saved baseline entryMSE is "}<code>{"1.0962540507211542"}</code>{". Seven coordinates leave ratio "}<code>{".12651211126461792"}</code>{", failing the budget; eight leave "}<code>{".095954618483061"}</code>{", passing it. The first qualifying count is therefore 8. Moving the budget to 6% makes nine fail at "}<code>{".0723539212176816"}</code>{" and ten pass at "}<code>{".052066326095135236"}</code>{"."}</Prose>

<Prose>{"The ratio curve uses exact saved aggregate values, including its tiny positive "}<code>{"k=13"}</code>{" value "}<code>{"1.7244521487195374e−30"}</code>{". It may round visually to 0, but budget 0 has no qualifying count when compared with these actual values. The default chosen count and an independently selected inspection count are labelled separately. Each additional orthogonal component removes a nonnegative residual term for every row, so simply minimizing reconstruction error would keep every dimension. Compression needs the stated constraint, penalty or storage purpose."}</Prose>

<Prose>{"The complete original budget program below records the scientific preparation and all fourteen measured loss ratios. Its original output remains unchanged. Use the saved-state reader for a changed query or budget without repeating the fit."}</Prose>

<Prose>{""}<code>{"budget.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/budget.py"} filename={"budget.py"} title="Complete program" />

<Prose>{"Retained historical output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"budget.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/budget.stdout.txt"} title={"Retained historical output"}>{"133 45\n1.0963\n0 1.0\n2 0.4281\n7 0.1265\n8 0.096\n10 0.0521\n13 0.0\n8"}</CodeBlock>

<PcaReadingFlowFigure job="D27" />

<Prose>{"Average loss can conceal an important per-feature error. Validation position 0 corresponds to original row index 35. The live row/count/feature controls trace its training-standardized values through the retained basis and show original, reconstructed and residual columns. These are newly derived algebraic values under the saved projection convention, not a replacement measured loss curve. The stored model uses mathematical zero for the PCA mean after standardization; the original estimator's tiny floating-point internal mean was not saved. This distinction matters when comparing nearly zero residuals."}</Prose>

<PcaReadingFlowFigure job="D28" />

<Prose>{"For alcohol in row 35 at "}<code>{"k=8"}</code>{", the original 13.48 becomes standardized "}<code>{".6405566571722935"}</code>{". The fixed-basis reconstruction is "}<code>{".6465902044864659"}</code>{"; multiply by training scale "}<code>{".7988822184243305"}</code>{", then add training mean "}<code>{"12.968270676691725"}</code>{", giving "}<code>{"13.484820093663314"}</code>{". The raw residual is about "}<code>{"−.00482009366331404"}</code>{", equal to the standardized residual times the feature scale. A squared alcohol error cannot be directly compared numerically with a squared proline error in different units."}</Prose>

<Prose>{"The preserved "}<code>{"originalUnits.py"}</code>{" continues "}<code>{"budget.py"}</code>{" and needs its "}<code>{"pca"}</code>{", validation standardized table "}<code>{"B"}</code>{" and "}<code>{"scaler"}</code>{". Running the two in the same explicit namespace supplies that state; this is the historical scientific recipe, not required for using the saved query reader. Its recorded stdout prints shape "}<code>{"(45,13)"}</code>{" only. The detailed row values above are separately derived and are not attributed to that stdout."}</Prose>

<Prose>{""}<code>{"originalUnits.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/originalUnits.py"} filename={"originalUnits.py"} title="Complete program" />

<Prose>{"Retained historical output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"originalUnits.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/originalUnits.stdout.txt"} title={"Retained historical output"}>{"(45, 13)"}</CodeBlock>

<Prose>{"The complete saved reader requires its sibling "}<code>{"pca_saved_state.json"}</code>{" and "}<code>{"wine.csv"}</code>{"; supply both with the program. It checks that CSV rows/labels match the saved state, selects a fitted branch explicitly, multiplies queries by its immutable directions, and reverses scaling. No estimator or fitting operation occurs. Its default full-collection query is row 0; the changed query adds .5 to alcohol and subtracts 100 from proline. Its validation example instead uses the training 133 branch. Those branch names stay in the output so their fitting boundaries cannot silently merge."}</Prose>

<Prose>{""}<code>{"saved_pca_queries.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/saved_pca_queries.py"} filename={"saved_pca_queries.py"} title="Complete program" />

<Prose>{"Selected recorded reference output; same operations as the recorded calculation:"}</Prose>

<CodeBlock language="text" kind="output" filename={"saved_pca_queries.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/saved_pca_queries.stdout.txt"} title={"Selected recorded reference output; same operations as the recorded calculation"}>{"default_full_collection_scores [[3.316751 1.443463]]\ndefault_full_collection_reconstruction [[  13.953318    1.792106    2.489469   16.80066   112.608967    3.170633\n     3.421664    0.244127    2.21661     6.147184    1.08989     3.326907\n  1210.957378]]\ndefault_standardized_query_loss 2.9189372153670763\nchanged_full_collection_scores [[3.314577 1.625978]]\nchanged_full_collection_reconstruction [[  14.024526    1.838433    2.505252   16.795955  113.383454    3.177506\n     3.420138    0.24486     2.220315    6.371252    1.078127    3.305072\n  1231.675671]]\nchanged_standardized_query_loss 4.086713755758694\nvalidation_position0_row_index 35\ntraining_state_k8_reconstruction [[ 13.48482    1.85121    2.457132  19.969206  98.387224   2.793185\n    2.91351    0.241893   1.910278   4.873775   1.063056   3.239362\n  896.526702]]\nsaved_budget_crossing 0.1 8\nsaved_budget_crossing 0.06 10\nsaved_budget_crossing 0.0 None\nsaved_validation_loss 0 1.0 1.0962540507211542\nsaved_validation_loss 1 0.6083063923199177 0.6668583466602813\nsaved_validation_loss 2 0.4280959138928524 0.4693018797022139\nsaved_validation_loss 3 0.3126930492121252 0.34279102183114146\nsaved_validation_loss 4 0.25895662726305274 0.2838822515982096\nsaved_validation_loss 5 0.20900686392835918 0.22912462120998886\nsaved_validation_loss 6 0.1704853751896662 0.18689528314038734\nsaved_validation_loss 7 0.12651211126461792 0.13868941443912275\nsaved_validation_loss 8 0.095954618483061 0.10519063919745855\nsaved_validation_loss 9 0.0723539212176816 0.07931827922044271\nsaved_validation_loss 10 0.052066326095135236 0.057077920887960536\nsaved_validation_loss 11 0.028298544018290513 0.031022393509561864\nsaved_validation_loss 12 0.012782898637789558 0.014013304411634727\nsaved_validation_loss 13 1.7244521487195374e-30 1.890437653308591e-30"}</CodeBlock>

<Prose>{""}<code>{"project_query"}</code>{" returns standardized values and scores; "}<code>{"decode"}</code>{" reconstructs standardized measurements; "}<code>{"inverse_scale"}</code>{" restores the original columns. "}<code>{"budget_crossing"}</code>{" scans the recorded curve rather than computing a fresh evaluation. Query arithmetic costs "}<code>{"O(qdk)"}</code>{". The measured arrays are evidence; these matrix products are derived uses of that evidence."}</Prose>

<PcaReadingFlowFigure job="D29" />

<Prose>{"Storage includes the decoder. With "}<code>{"n=100,d=20,k=10"}</code>{", the original table holds 2000 scalars. Scores require 1000, directions 200 and the mean 20: "}<code>{"1000+200+20=1220"}</code>{" scalars in total, or 61% stored. Scaling would add 20 more scales. Metadata, dtype, format and quantization remain separate costs. A new count can reduce coordinate work without saving stored bytes when the shared decoder dominates; at "}<code>{"k=d"}</code>{" this format is larger than the original table. The live integer controls count those actual objects without suggesting that any "}<code>{"n,d,k"}</code>{" triple is a permissible scientific fit."}</Prose>

<H2>{"7. Read components, scores and plots without mixing them up"}</H2>

<Prose>{"The stored basis and a wine's coordinates live in different arrays; distinguish their owners before reading a component plot."}</Prose>

<PcaReadingFlowFigure job="D30" />

<Prose>{"A component "}<strong>{"coefficient"}</strong>{" belongs to a feature-direction pair: the first ruler's x coefficient is "}<code>{"1/√2"}</code>{". A "}<strong>{"score"}</strong>{" belongs to a record-direction pair: A's score is "}<code>{"−3/√2"}</code>{", because it combines both of A's centered measurements with their respective coefficients. Thirteen feature bars in a Wine direction describe that axis; they are not thirteen wines' coordinates. Feature identities and colours stay attached to their names when bars are reordered."}</Prose>

<PcaReadingFlowFigure job="D31" />

<Prose>{"Correlation introduces a different normalization. Use the centered fitting-sample feature x and its score z. Let "}<code>{"d_x"}</code>{" be that feature's direction coefficient, "}<code>{"λ"}</code>{" the score's sample variance, and "}<code>{"s_x"}</code>{" the feature's sample standard deviation. On this fitted eigenaxis, "}<code>{"Cov(x,z)=d_x·λ"}</code>{". Divide by the two standard deviations to obtain"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{Corr}(x,z)=\\frac{d_x\\sqrt\\lambda}{s_x}."}</MathBlock></div>

<Prose>{"In the four-row example "}<code>{"d_x=1/√2"}</code>{", "}<code>{"λ=6"}</code>{", and "}<code>{"s_x=√(10/3)"}</code>{", giving "}<code>{"√.9≈.948683"}</code>{". This differs from the direction coefficient "}<code>{".707107"}</code>{". Both occupy a signed [-1,1] range but answer different questions. A constant feature or zero-variance score has undefined correlation. Texts sometimes call either quantity a “loading”; use the explicit coefficient or correlation label and inspect the convention."}</Prose>

<Prose>{"The complete correlation reader below centers the derived fitting scores and features, forms their cross-products and divides by their lengths. It marks zero denominators unavailable. Its Wine PC1 alcohol coefficient is about "}<code>{".144329"}</code>{", while the derived fitting-collection correlation is about "}<code>{".313093"}</code>{". These are properties of this representation and collection, not causal effects. Download "}<code>{"saved_pca_correlations.py"}</code>{" together with "}<code>{"saved_pca_queries.py"}</code>{", "}<code>{"pca_saved_state.json"}</code>{" and "}<code>{"wine.csv"}</code>{"; importing the query helpers does not run their demonstration. The numerator is a feature–score cross-product, and the denominator is the product of their centered lengths, exactly the normalization just traced."}</Prose>

<Prose>{""}<code>{"saved_pca_correlations.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/saved_pca_correlations.py"} filename={"saved_pca_correlations.py"} title="Complete program" />

<Prose>{"Selected recorded reference output; same operations as the recorded calculation:"}</Prose>

<CodeBlock language="text" kind="output" filename={"saved_pca_correlations.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/saved_pca_correlations.stdout.txt"} title={"Selected recorded reference output; same operations as the recorded calculation"}>{"pc1_coefficients [ 0.144329 -0.245188 -0.002051 -0.23932   0.141992  0.394661  0.422934\n -0.298533  0.313429 -0.088617  0.296715  0.376167  0.286752]\npc1_derived_fitting_correlations [ 0.313093 -0.531885 -0.004449 -0.519157  0.308023  0.856137  0.91747\n -0.647607  0.679922 -0.192236  0.643662  0.816019  0.622051]"}</CodeBlock>

<Prose>{"The complete main reports the coefficient and derived fitting correlation for every feature in the same fixed order. Its values are the corresponding lines retained from the earlier saved-state calculation, separated here to follow their explanation; they are not a new Wine fit."}</Prose>

<PcaReadingFlowFigure job="D32" />

<Prose>{"A biplot overlays observation coordinates and feature vectors using a declared split of singular-value scaling. Here use both modes of our fixed four-record table: the observation factors have four rows, the feature factors two rows, and each has two component columns. This full two-mode example reconstructs the centered table exactly; its omitted-mode residual is zero. If "}<code>{"A≈U_k S_k V_kᵀ"}</code>{", the two factors "}<code>{"U_k S_k^γ"}</code>{" and "}<code>{"V_k S_k^(1−γ)"}</code>{" still multiply to that approximation. At "}<code>{"γ=1"}</code>{", the observation coordinates are ordinary scores; at 0 or .5 their scale changes. An arrow is not automatically a correlation or in the same units as every nearby score coordinate. Reversing a component must reverse both corresponding factors; the reconstructed table and squared loss remain unchanged. Nearby points can still differ strongly in discarded coordinates, so a low-dimensional visual distance needs its omission qualification."}</Prose>

<H2>{"8. Connect PCA to clustering and prediction"}</H2>

<Prose>{"A high retained fraction measures reconstruction under our chosen scale; test what happens when the dropped coordinate supplies a prediction's label."}</Prose>

<PcaReadingFlowFigure job="D33" />

<Prose>{"Consider points "}<code>{"(±10,±1)"}</code>{" with their label determined by y's sign. The horizontal first axis retains "}<code>{"100/101≈99.01%"}</code>{" of squared variation, yet at each horizontal reading the two opposite labels collide. No deterministic classifier using that one score can distinguish the two records. The small-variance vertical coordinate supplies the label distinction. When horizontal spread becomes 1 the spectrum ties: the variance criterion does not prefer either single axis. Predictive usefulness must be evaluated on the task, rather than inferred from a retained percentage."}</Prose>

<PcaReadingFlowFigure job="D34" />

<Prose>{"An orthogonal change of "}<strong>{"all"}</strong>{" coordinates preserves squared distances. The coordinate difference A−B is "}<code>{"(−1,1)"}</code>{" and has squared length 2. The first coordinate difference is 0; the second is "}<code>{"−√2"}</code>{", contributing 2. Keeping both preserves the original 2, while discarding the second collapses the pair. More generally the full sum of squared rotated coordinates equals the original squared length; truncating removes nonnegative contributions. A fixed full rotation also preserves k-means within-cluster squared error, whereas truncation can change its objective. Reducing feature count can reduce work per distance, but a stored dense pairwise-distance array still has "}<code>{"n²"}</code>{" entries."}</Prose>

<PcaReadingFlowFigure job="D35" />

<Prose>{"The preserved prediction comparison used five stratified shuffle 42 folds. Each fold fits scaler, optional PCA and logistic regression on its training portion, then evaluates its held-out portion. The no-PCA baseline uses the same folds. Saved means are approximately "}<code>{".9833"}</code>{" for no PCA,"}<code>{".9552"}</code>{" for two components and "}<code>{".9776"}</code>{" for eight. The complete code/output below retains all five outcomes for each setting, including the worse two-component result. These development folds are not independent replicate samples or an untouched final test; no confidence interval is invented."}</Prose>

<Prose>{""}<code>{"pipeline.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/pipeline.py"} filename={"pipeline.py"} title="Complete program" />

<Prose>{"Retained historical output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"pipeline.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/pipeline.stdout.txt"} title={"Retained historical output"}>{"None [0.9722 0.9722 0.9722 1.     1.    ] 0.9833\n2 [0.9444 0.9722 0.9167 0.9714 0.9714] 0.9552\n8 [0.9722 0.9722 0.9722 0.9714 1.    ] 0.9776"}</CodeBlock>

<Prose>{"The pipeline supplies an unfitted sequence to cross-validation, so preprocessing learns anew within the permitted fold. Computing one whole-data scaler or PCA before the split would violate this boundary even without labels. The recorded output is a reference for interpreting a matched comparison. The later "}<code>{"saved_pca_outcomes.py"}</code>{" reader in section 10.4 reports it alongside the finite-sample spectrum after both mechanisms have been explained, without running cross-validation. For your own modeling change, the complete pipeline above is runnable; keep preprocessing inside each fold and follow the new-experiment recipe in "}<code>{"PCA-SETUP.md"}</code>{". A justified new predictive claim would need its own forward protocol and evidence. For the present study, PCA is a method to assess, not a method that must be made to win."}</Prose>

<H2>{"9. Practice: calculate, diagnose and transfer"}</H2>

<Prose>{"Try a changed calculation before its hint or solution. Original1–Original6 follow the core route; Original7 follows section 10.1 and Original8 follows section 10.4. The numbered new tasks are additional variants."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Original1. Change the data, keep the method"}</H3>

<Prose>{"Use (1,0), (3,2), (5,4). Calculate the mean, a first principal direction, all three scores, the sample variance of those scores and the one-component reconstruction SSE. Then add (8,4) as a new observation, using the original fitted transform. What is its reconstruction and squared error?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The original three points are exactly on a line of slope one. The new point is not on that line. Keep the original mean when transforming it."}</Prose>

</details>

<details><summary>Retained solution</summary>

<Prose>{"The mean is (3, 2). Choose v₁ = (1, 1)/√2. Centered rows are (−2, −2), (0, 0), (2, 2) and scores are −2√2, 0, 2√2. Sample variance is (8 + 0 + 8)/2 = 8. Their one-component reconstruction SSE is zero."}</Prose>

<Prose>{"      The new centered point is (5, 2). Its score is 7/√2; reconstructing gives (3, 2) + (3.5, 3.5) = (6.5, 5.5). Residual (1.5, −1.5) has squared length 4.5. Exact training reconstruction did not imply exact reconstruction of every possible new point."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Original2. Change the direction instead of memorizing a percentage"}</H3>

<Prose>{"In the four-point example from section 2, keep the second direction (1, −1)/√2 instead of the first. Find A's score and reconstruction. What are the total SSE, per-entry MSE and retained variance fraction?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The two components divide total centered squared length 20 into 18 and 2. Swapping which is retained swaps the loss."}</Prose>

</details>

<details><summary>Retained solution</summary>

<Prose>{"A’s score is −1/√2. Its reconstruction is (3, 2) + (−0.5, 0.5) = (2.5, 2.5). The total SSE is 18; per-entry MSE is 18/8 = 2.25; retained variance is 10%. A’s individual squared error is 4.5. This checks whether you can trace the inverse mapping, not just recite “keep the largest component.”"}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Original3. Repair a misleading scaling conclusion"}</H3>

<Prose>{"A report says: “The raw Wine first component retains 99.8%; the standardized first component retains only 36.2%. Standardization destroyed 63.6% of the information.” Explain the error and write a better one-sentence conclusion."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Ask what squared error each percentage uses as its denominator."}</Prose>

</details>

<details><summary>Retained solution</summary>

<Prose>{"The representations use different feature weightings, so their percentages do not measure the same error objective. Neither percentage measures all useful information. One acceptable conclusion is: “Raw PCA is dominated by large-magnitude measurements, whereas standardized PCA spreads retained relative variation across more components; choose the weighting from the intended task.” A strong answer also identifies which original feature dominates, proline, rather than merely saying “scaling matters.”"}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Original4. Run a new compression budget"}</H3>

<Prose>{"Use section 6's "}<code>{"saved_pca_queries.py"}</code>{" to inspect the recorded reference curve at budget .06. To carry out a new compression experiment, run a copy of "}<code>{"budget.py"}</code>{" with its final threshold changed to .06; keep seed42, the stratified 75%/25% split and training-only scaler/basis for the first comparison. Record your own ratios and result. Changing the split seed is a separate experiment; declare that seed before fitting and report its new count rather than replacing the reference result."}</Prose>

<Prose>{"Run a copy of "}<code>{"budget.py"}</code>{" from section 6 in your experiment directory. Change the allowed validation error fraction from 0.10 to 0.06. Predict the smallest acceptable count before reading the result. Report the count, the two errors bracketing the budget, the coordinate system and whether you have measured final test performance."}</Prose>

<details><summary>Hint</summary>

<Prose>{"You need both the last count that fails and the first count that passes. Reuse the training transform; do not fit a fresh validation PCA."}</Prose>

</details>

<details><summary>Retained solution</summary>

<Prose>{"Nine components leave about 0.072354 of the training-mean baseline error; ten leave about 0.052066. The smallest acceptable count is "}<strong>{"10"}</strong>{". Errors use training-standardized measurements on the 45 validation rows. These are model-selection results, not an untouched final test result. A different split can give a different count. The budget lab above reproduces these two ratios exactly when you set 0.06."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Original5. Diagnose a pipeline leak"}</H3>

<Prose>{"A colleague computes StandardScaler().fit_transform(X) on the entire dataset, applies PCA once, and then uses cross-validation to select a classifier. Explain what must move inside the folds. Separately, why is the descriptive full-collection analysis in section 5 not claiming that kind of generalization evidence?"}</Prose>

<details><summary>New hint</summary>

<Prose>{"Separate which rows supply fitted state from which rows evaluate it."}</Prose>

</details>

<details><summary>Retained solution</summary>

<Prose>{"Both the fitted scaler and fitted PCA must be learned using each fold’s training portion, along with the classifier. Pass the complete unfitted pipeline into cross-validation. Section 5 describes the observations supplied to the transform; it does not estimate predictive performance on unseen observations. The use of the data and the claim made about the output determine the evaluation obligation."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Original6. Audit a storage promise"}</H3>

<Prose>{"You have n = 100 rows and d = 20 features. You keep k = 10 PCA scores per row. Count stored scalar values if you retain the score matrix, component directions and mean, with no feature scaling and the same scalar precision throughout. Does this halve storage? At what number of rows does this choice first save storage?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The decoder also takes space. Compare nk + dk + d with nd."}</Prose>

</details>

<details><summary>Retained solution</summary>

<Prose>{"Original: 100 × 20 = 2000 scalars. Compressed representation plus decoder: 100 × 10 + 20 × 10 + 20 = 1220, or 61% of the original, so 39% saved, not 50%. Savings require 10n + 220 < 20n, hence n > 22; the first integer is 23. For 22 rows the counts tie. Metadata, storage format and quantization are outside this scalar-count calculation."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Original7. Separate uncorrelated from independent"}</H3>

<Prose>{"Read section 10.1's dependence example first."}</Prose>

<Prose>{"Give U the values −1, 0, 1 with equal probability and define W = U². Show that U and W have zero covariance but are not independent. Why does this matter when describing PCA scores?"}</Prose>

<details><summary>New hint</summary>

<Prose>{"Compare the conditional probability at W=0 with its marginal."}</Prose>

</details>

<details><summary>Retained solution</summary>

<Prose>{"E[U] = 0 and E[UW] = E[U³] = 0, so their covariance is zero. But W = 0 tells us U = 0, while W = 1 tells us |U| = 1; they are dependent. PCA diagonalizes the fitted sample covariance of its scores. It does not generally produce statistically independent variables. The later ICA topic studies a different objective."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Original8. Why does a noise-only scree plot have a leading component?"}</H3>

<Prose>{"Read section 10.4 first. Its recorded seed23 spectrum is a reference result. For this task, run your own 40×20 independent-standard-normal sample, then change the seed to24 with shape and method fixed. Save both spectra and first-two fractions. Compare them with the fixed population share .10; the sample-dependent leading directions are fitted separately for each draw."}</Prose>

<Prose>{"Run the short "}<code>{"gaussian.py"}</code>{" example in section 10.4. Before executing it, decide whether the first two sample components must retain exactly 10% of variation. Explain the result without inventing a hidden two-dimensional cause. Change the seed and repeat; state what you would need before giving an empirical component a scientific name."}</Prose>

<details><summary>New hint</summary>

<Prose>{"The fitted directions can capitalize on sample variation; the population reference is a different object."}</Prose>

</details>

<details><summary>Retained solution</summary>

<Prose>{"The population covariance is the 20-dimensional identity, so every fixed two-dimensional orthonormal projection captures 10% of population variance. PCA chooses its directions after inspecting a finite sample. The chosen directions capitalize on that sample’s uneven spread. For seed 23 the first two retain about 24.59% of the sample variation. Another seed changes the number."}</Prose>

<Prose>{"      A good interpretation distinguishes the fitted sample result from population structure, and proposes evidence tied to the intended claim: repeated data, stability of the retained subspace, a suitable null or noise model, known measurement factors or held-out task performance. Naming the tallest component is not that evidence."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"Independent mini-project"}</H3>

<Prose>{"Using the supplied Wine data, write a short analysis that answers "}<strong>{"one"}</strong>{" purpose: exploratory visualization, measurement compression, or prediction. State the unit of observation, which rows fit the transform, the scale choice, the baseline and the success criterion before reporting results. Include one changed setting and an observation-level diagnosis, not only a global score."}</Prose>

<Prose>{"    For compression, a complete submission contains the reproducible split, selected count, error against the mean baseline, a per-feature or per-row residual inspection, retained decoder information and a statement about what the validation result supports. The 6% variation above provides an exact numerical checkpoint; explaining why it leads to ten components is part of the task."}</Prose>

<Prose>{"    For prediction, use "}<code>{"pipeline.py"}</code>{" in section 8 as a starting point, then change one justified modeling choice. Report the fold results for both PCA and the no-PCA baseline, not just whichever mean is higher. The point is to make and evaluate a decision, not to force PCA to win."}</Prose>

<Prose>{"Begin with the supplied reference results and one changed query, then carry out one new experiment appropriate to your chosen purpose. For visualization, fit a new full-collection representation after declaring raw or standardized measurements; keep cultivar separate from PCA and avoid unseen-performance claims. For compression, use the seed42 training/validation recipe and declare the .06 budget before selecting a count; inspect a residual in original units. For prediction, keep the five seed42 stratified folds and accuracy metric, compare no-PCA/k2/k8 on matched folds, and declare one additional setting such as logistic "}<code>{"C=.5"}</code>{" before computing any outcomes. Fit every scaler, PCA and classifier inside each training fold. Report all per-fold values and means, including worse results; these folds are development evidence, not a final untouched test. Record package versions, input source and setting. Your new run is separate from the published reference. Section 10.10 connects these decisions and "}<code>{"PCA-SETUP.md"}</code>{" supplies the runnable recipes."}</Prose></section>

<H3>{"Changed tasks: calculate and diagnose"}</H3>

<Prose>{"These are additional tasks, with changed values or assumptions. The deeper tasks state which later branch to read first. Keep the hint and solution separate from the prompt so you can attempt an independent calculation."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P1. Another three-row table"}</H3>

<Prose>{"For "}<code>{"(0,0),(2,2),(4,4)"}</code>{", identify "}<code>{"n,d"}</code>{", calculate the mean, choose a first direction, calculate all scores and recover the rows from one coordinate."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Average each column. Subtract that same average from every row before using the diagonal unit direction."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"There are three observations and two features. The mean is "}<code>{"(2,2)"}</code>{". Centered rows are "}<code>{"(−2,−2),(0,0),(2,2)"}</code>{". Choose "}<code>{"v=(1,1)/√2"}</code>{"; scores are "}<code>{"−2√2,0,2√2"}</code>{". Multiplying each score by v and restoring the mean gives the three original rows, so trainSSE 0. This exact reconstruction depends on these collinear training rows; it does not assert that every future row lies on their line."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P2. Follow a centered query"}</H3>

<Prose>{"Project centered query "}<code>{"(2,−1)"}</code>{" on "}<code>{"(1,1)/√2"}</code>{". Calculate its score, foot, residual and squared loss; verify perpendicularity."}</Prose>

<details><summary>Hint</summary>

<Prose>{"First sum the two coordinate products, then multiply that scalar by the two direction coefficients."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The score is "}<code>{"(2−1)/√2=1/√2"}</code>{". The foot is "}<code>{"(.5,.5)"}</code>{", leaving residual "}<code>{"(1.5,−1.5)"}</code>{". Its squared length is "}<code>{"2·1.5²=4.5"}</code>{"; its dot product with the direction is 0. The query's total squared length 5 divides into retained .5 and lost 4.5. No mean needs restoring because the supplied query was already centered."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P3. Reverse an axis carefully"}</H3>

<Prose>{"Reverse a direction and all its scores. Does the decoded table change? What if you reverse only the direction?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Inspect the product "}<code>{"zv"}</code>{", rather than the two signs independently."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{""}<code>{"(−z)(−v)=zv"}</code>{", so paired reversal leaves every reconstruction and loss unchanged. Reversing v alone gives "}<code>{"−zv"}</code>{", reversing the retained displacement relative to the mean. Sign conventions help consistent display; changing just one side changes the decoder's operation."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P4. Name the denominator"}</H3>

<Prose>{"A centered table with "}<code>{"n=5,d=3"}</code>{" has total energy 30 and retained energy 24. Find SSE, average squared error per row, entryMSE and discarded sample variance."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Find the lost energy first. Divide by n, nd or n−1 only after naming the quantity."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Lost SSE is "}<code>{"30−24=6"}</code>{". Per-row error is "}<code>{"6/5=1.2"}</code>{"; entryMSE is "}<code>{"6/15=.4"}</code>{"; discarded sample variance is "}<code>{"6/4=1.5"}</code>{". The retained energy fraction is "}<code>{".8"}</code>{", which describes this fixed squared-error objective rather than all useful information."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P5. Use the original fit for a new raw query"}</H3>

<Prose>{"With the four-record fitted mean "}<code>{"(3,2)"}</code>{" and first direction "}<code>{"(1,1)/√2"}</code>{", reconstruct raw query "}<code>{"(7,1)"}</code>{" and calculate its squared error."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The query is not a fifth training row. Subtract the stored mean and keep its direction fixed."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Centered query is "}<code>{"(4,−1)"}</code>{", giving score "}<code>{"3/√2"}</code>{". Its centered foot is "}<code>{"(1.5,1.5)"}</code>{", so recovered raw point is "}<code>{"(4.5,3.5)"}</code>{". Residual "}<code>{"(2.5,−2.5)"}</code>{" has squared length 12.5. Refitting the mean with this query would answer a different question."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P6. A different unit-change tie"}</H3>

<Prose>{"Use rectangle corners "}<code>{"(±3,±1)"}</code>{" and multiply y by 3. What is the raw one-coordinate direction status? What does fitted standardization produce?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Compare the two raw energy sums before looking for an eigenvector."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Raw energies are "}<code>{"4·3²=36"}</code>{" and "}<code>{"4·3²=36"}</code>{", so the raw optimum ties: every unit one-dimensional ruler retains half the energy. Standardization divides both columns by 3, producing "}<code>{"(±1,±1)"}</code>{" with equal energies 4. Its one-coordinate optimum also ties. Neither calculation identifies one scientifically preferred diagonal; its weighting must come from the intended task."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P7. A constant feature — rank detail after section 10.2"}</H3>

<Prose>{"A table has one varying feature and one feature that is 7 in every training row. Trace centering and scaling of the constant feature. What happens to total-energy fractions if both features are constant?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Distinguish a zero centered column from a missing value or a later query value."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Its mean is 7 and centered training entries are 0. Population variance is 0, so the effective scaler stores 1 and keeps those standardized entries 0. The centered table has rank 1 if the other feature genuinely varies. If all features are constant, total centered energy is 0 and a retained-energy fraction is undefined. Mean-only training reconstruction can be exact despite there being no identified nonzero signal axis. A later constant-feature query differing from 7 has a nonzero standardized difference; it does not retrain the scale."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P8. Read the actual saved budget"}</H3>

<Prose>{"Without fitting, choose the fewest retained coordinates for a 6% validation loss budget and give the bracketing saved values."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Scan the saved ratios from "}<code>{"k=0"}</code>{"; use actual values rather than rounded labels."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"At "}<code>{"k=9"}</code>{" the ratio "}<code>{".0723539212176816"}</code>{" exceeds .06; at "}<code>{"k=10"}</code>{" "}<code>{".052066326095135236"}</code>{" is below it. The first passing count is 10. These are validation standardized reconstruction errors divided by the training-mean baseline error. This selection does not establish performance on an untouched final test."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P9. Restore the original units"}</H3>

<Prose>{"A feature's saved mean is 100 and scale 20. Its reconstructed standardized value is 1.5, while the original query measurement is 140. Find the raw reconstructed value and both raw and standardized squared residuals."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Undo division, then undo subtraction. Standardize the original with the same fitted values."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The reconstructed raw value is "}<code>{"1.5·20+100=130"}</code>{". Raw residual is 10 and raw squared error 100. The original standardized value is 2, giving residual .5 and squared error .25. Their units and weighting differ; the two errors should not be placed in one unlabelled numeric comparison."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P10. Storage with a scale vector"}</H3>

<Prose>{"For "}<code>{"n=20,d=10,k=2"}</code>{", count original and represented float64 values including scores, directions, mean and scales. Exclude format metadata but state that exclusion. This changes the original storage exercise's assumptions."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Count each shared decoder object once, not once per observation."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Original count is "}<code>{"nd=200"}</code>{", or 1600 bytes. Scores 40, directions 20, mean 10 and scales 10 total 80, or 640 bytes. This saves 60% under the declared scalar format. It excludes record IDs, headers and other serialization metadata; a practical stored file can differ."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P11. Coefficient versus correlation"}</H3>

<Prose>{"A direction coefficient is .5, its score sample variance is 4 and the feature sample variance is 9. Calculate the fitting-sample correlation. What if the feature is constant?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The correlation includes both variance normalizations; it is not the coefficient itself."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Correlation is "}<code>{".5·√4/√9=1/3"}</code>{". The coefficient .5 remains the direction's coordinate. For a constant feature the correlation denominator is 0, so correlation is undefined rather than 0 or 1. This formula uses the eigenaxis covariance relation on the fitting sample."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P12. Keep the label, keep the boundary"}</H3>

<Prose>{"For "}<code>{"(±10,±1)"}</code>{" with labels from y's sign, explain what PC1 discards and propose a proper no-PCA/PCA predictive comparison. Where should a scaler be fitted?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Find the two records sharing each retained horizontal score. Distinguish fitting from evaluation."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"PC1 retains "}<code>{"100/101"}</code>{" but maps opposite-label rows to each same horizontal coordinate. No classifier on that coordinate alone can recover both labels. Compare pipelines on a predeclared predictive metric using matched splits; scaler, PCA and classifier all fit inside each training fold. A no-PCA baseline must be retained. Existing development outcomes do not establish that one representation wins universally or provide an untouched test result."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P13. Cut through a tied spectrum — after sections 10.1–10.2"}</H3>

<Prose>{"Centered scatter has eigenvalues "}<code>{"9,4,4,0"}</code>{". Give singular values, rank, discarded SSE at "}<code>{"k=2"}</code>{" and "}<code>{"k=3"}</code>{", and which retained projector is uniquely identified."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Inspect the gap at the retained boundary, rather than the signs of individual eigenvectors."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Singular values are "}<code>{"3,2,2,0"}</code>{"; exact rank 3. At "}<code>{"k=2"}</code>{" the discarded SSE is 4, but one chosen dimension inside the tied 4/4 space is not uniquely preferred. At "}<code>{"k=3"}</code>{" discarded SSE 0 and the full positive-spectrum projector is unique because the boundary gap is 4 versus 0. Individual axes inside the tied two-dimensional space still need not be unique."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P14. Whiten and return — after section 10.3"}</H3>

<Prose>{"For a fitted score with sample variance 4 and "}<code>{"n=5"}</code>{", whiten score 2, restore it, and state the fitting whitened sample and population variances."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the same retained √variance in both directions; the denominator changes only the reported variance convention."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Whitened coordinate is "}<code>{"2/√4=1"}</code>{"; inverse whitening gives 2. Fitting sample variance becomes 1, while population-style variance is "}<code>{"(5−1)/5=.8"}</code>{". A numerically zero retained singular direction cannot be whitened in our local contract. This scaling does not generally produce independent coordinates."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P15. Posterior versus orthogonal foot — after sections 10.3–10.4"}</H3>

<Prose>{"For PPCA loading magnitude 2, isotropic noise variance .5 and query coordinate "}<code>{"z=3"}</code>{" along the signal axis, compute M, latent posterior mean, its variance and the decoded coordinate. Contrast the saved Gaussian first-two share with its population reference."}</Prose>

<details><summary>Hint</summary>

<Prose>{"The latent coordinate is obtained by a solve, not the orthogonal dot product alone."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{""}<code>{"M=4+.5=4.5"}</code>{"; RHS is "}<code>{"2·3=6"}</code>{". Latent posterior mean is "}<code>{"6/4.5=4/3"}</code>{", variance "}<code>{".5/4.5=1/9"}</code>{", and decoded coordinate is "}<code>{"2·4/3=8/3"}</code>{", compared with the orthogonal PCA foot 3. Shrink factor is 8/9. The stored 40×20 isotropic Gaussian sample has fitted first-two share "}<code>{".24591458952369985"}</code>{"; its population fixed-two-dimensional reference is .10. Finite fitted spread is not proof of a true two-factor population, and the task requires no new draw."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P16. Two zero-spread batches — after section 10.6"}</H3>

<Prose>{"Two two-row batches are constant at −2 and +2 on one feature. Calculate their merged mean and scatter, including the correction row. What approximation can lose history?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"The batches have no within-batch spread, but their means differ."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Combined mean is 0. The correction row is "}<code>{"√(2·2/4)(−2−2)=−4"}</code>{"; its square contributes 16 while both within-batch scatters contribute 0. Combined sample variance is "}<code>{"16/3"}</code>{". Separately centering the batches and omitting the correction would falsely give 0. Retaining only k modes between updates can discard past directions; future batches cannot generally recover that missing scatter, so order can matter."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P17. Center a future kernel row — after section 10.7"}</H3>

<Prose>{"For training inputs "}<code>{"−1,0,1"}</code>{" with square kernel, derive query 2's score. Which means are stored, and why do query −2 and 2 collide?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use query row "}<code>{"[4,0,4]"}</code>{", its own row mean 8/3, training column means "}<code>{"[2/3,0,2/3]"}</code>{" and training grand mean 4/9."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The centered kernel row is "}<code>{"[10/9,−20/9,10/9]"}</code>{". The normalized eigenvector is "}<code>{"(1,−2,1)/√6"}</code>{" and eigenvalue 2/3, so dividing by √eigenvalue makes the coefficient column "}<code>{"(1,−2,1)/2"}</code>{". Its dot product with that row is "}<code>{"10/3"}</code>{", equal to "}<code>{"2²−2/3"}</code>{". Query−2 has the same squared feature and score. No exact original-input inverse can distinguish them; replacing stored training means with query-batch means would change the fitted transform."}</Prose>

</details></section>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H3>{"P18. Changed objectives need changed operators — after sections 10.8–10.9"}</H3>

<Prose>{"For atoms "}<code>{"(1,0)"}</code>{" and "}<code>{"(1,1)/√2"}</code>{", serve query "}<code>{"(1,1)"}</code>{" at ridge 0. Explain why a one-pixel E11 matrix can defeat unique low-rank/sparse separation. On grid weights "}<code>{"(.5,1.5,1)"}</code>{", compute weighted error for residual "}<code>{"(1,0,1)"}</code>{"."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Solve using the atom Gram matrix; classify E11 by both rank and support; apply the weights before summing squares."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The atom Gram is "}<code>{"[[1,1/√2],[1/√2,1]]"}</code>{" and RHS is "}<code>{"(1,√2)"}</code>{". Solving gives coefficients "}<code>{"(0,√2)"}</code>{", which decode exactly to "}<code>{"(1,1)"}</code>{". Naive independent dot products "}<code>{"(1,√2)"}</code>{" decode to "}<code>{"(2,1)"}</code>{" because the atoms are not orthogonal. E11 is both rank 1 and one-entry sparse, so the decomposition alone is not identifiable without additional assumptions. The weighted squared error is "}<code>{".5·1²+1.5·0²+1·1²=1.5"}</code>{", compared with unweighted 2. These are three different mathematical questions; the PCA dot-product decoder is not a universal solver for them."}</Prose>

</details></section>

<H2>{"10. Deeper branches"}</H2>

<Prose>{"The core route has given us an encoder, decoder and a purpose. These branches answer the next limitations: why that subspace is optimal, what degeneracies mean, how a probabilistic interpretation differs, and how to change the computation or objective deliberately. Keep the concrete four-record calculation in view as the notation expands."}</Prose>

<H3>{"10.1 Where the optimum comes from"}</H3>

<Prose>{"The diagonal ruler won on four records; express another ruler in the same orthogonal axes to see why its variance cannot exceed that winner."}</Prose>

<PcaReadingFlowFigure job="D36" />

<Prose>{"The covariance ellipse has axes "}<code>{"v₁,v₂"}</code>{" with sample variances 6 and "}<code>{"2/3"}</code>{". Write an arbitrary unit ruler as "}<code>{"v=a₁v₁+a₂v₂"}</code>{". Orthogonality gives "}<code>{"a₁²+a₂²=1"}</code>{"; its score variance is "}<code>{"6a₁²+(2/3)a₂²"}</code>{". This weighted average cannot exceed 6. It reaches 6 by putting all weight on the first axis. The general symmetric PSD covariance has orthonormal eigenvectors "}<code>{"u_j"}</code>{" and nonnegative eigenvalues "}<code>{"λ_j"}</code>{"; substituting "}<code>{"v=Σa_ju_j"}</code>{" gives "}<code>{"vᵀCv=Σλ_ja_j²"}</code>{" under "}<code>{"Σa_j²=1"}</code>{". The largest eigenvalue is therefore the maximum. A constrained derivative of "}<code>{"vᵀCv−η(vᵀv−1)"}</code>{" gives "}<code>{"Cv=ηv"}</code>{", but stationary eigenvectors also include minima; sorting their eigenvalues is essential."}</Prose>

<PcaReadingFlowFigure job="D37" />

<Prose>{"SVD expresses "}<code>{"A=Σ_j s_ju_jv_jᵀ"}</code>{" as a sum of rank-one outer-product tables. For the four records, the first table contains all decoded centered rows; the second contains their remaining residuals. Their squared Frobenius lengths are 18 and 2. Keeping the first drops the second, so SSE 2. The "}<strong>{"squared Frobenius norm"}</strong>{" sums squared entries; a different "}<strong>{"spectral norm"}</strong>{" asks for the largest length amplification of a unit vector. The same retained factorization has spectral residual "}<code>{"√2"}</code>{", not 2."}</Prose>

<Prose>{"To connect covariance and SVD, substitute "}<code>{"A=USVᵀ"}</code>{" into "}<code>{"AᵀA/(n−1)"}</code>{". Since "}<code>{"UᵀU=I"}</code>{","}</Prose>

<div className="neural-equation"><MathBlock>{"C=V\\frac{S^2}{n-1}V^T,\\qquad Z=AV_k=U_kS_k."}</MathBlock></div>

<Prose>{"Thus eigenvalues are "}<code>{"s_j²/(n−1)"}</code>{" and directions are feature columns of V. For an orthogonal rank-k projector P, retained scatter is "}<code>{"tr(PAᵀA)"}</code>{". In its eigenbasis, the weights "}<code>{"v_jᵀPv_j"}</code>{" lie in [0,1] and sum to k. The maximum puts that weight on the k largest squared singular values, leaving "}<code>{"Σ_{j>k}s_j²"}</code>{". This establishes the best centered k-subspace for the stated squared reconstruction loss. Allowing a general rank-k approximation does not improve on this SVD tail: its row subspace has dimension at most k, and projecting A into that subspace is already the least-squares choice for it. For spectral loss, any rank-k candidate has a null vector in the span of the first k+1 right singular directions, giving residual at least "}<code>{"s_{k+1}"}</code>{"; truncation attains that bound."}</Prose>

<Prose>{"The original covariance calculation below continues the original "}<code>{"svd.py"}</code>{" namespace, requiring "}<code>{"np"}</code>{", "}<code>{"X"}</code>{", "}<code>{"centered"}</code>{", "}<code>{"mean"}</code>{", "}<code>{"singular_values"}</code>{" and "}<code>{"reconstructed"}</code>{". Execute the exact predecessor first when using this four-row continuation. It is a useful algebraic comparison, while the general reusable PCA program delegates direct SVD to a maintained primitive."}</Prose>

<Prose>{""}<code>{"eigen.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/eigen.py"} filename={"eigen.py"} title="Complete program" />

<Prose>{"Retained historical output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"eigen.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/eigen.stdout.txt"} title={"Retained historical output"}>{"[6.     0.6667]\nTrue\n2.0"}</CodeBlock>

<PcaReadingFlowFigure job="D37a" />

<Prose>{"Orthogonality also makes the fitting scores uncorrelated: their column means are 0, and "}<code>{"ZᵀZ/(n−1)=diag(λ_j)"}</code>{". The four-record cross-products of the first and second scores are "}<code>{"(+3/2,−3/2,−3/2,+3/2)"}</code>{", which sum 0. The diagonal square sums 18 and 2 give the corresponding sample variances. This is a statement about the fitted sample covariance, not every future sample or statistical independence."}</Prose>

<Prose>{"For a separate equally weighted distribution, let "}<code>{"U"}</code>{" be −1,0,1 and "}<code>{"W=U²"}</code>{". Its three joint records are "}<code>{"(−1,1),(0,0),(1,1)"}</code>{", each mass 1/3. We get "}<code>{"E[U]=0"}</code>{", "}<code>{"E[W]=2/3"}</code>{", "}<code>{"E[UW]=0"}</code>{", hence covariance 0. But "}<code>{"P(U=0|W=0)=1"}</code>{", whereas "}<code>{"P(U=0)=1/3"}</code>{". Equivalently the joint middle mass 1/3 differs from the product "}<code>{"(1/3)(1/3)=1/9"}</code>{". The two coordinates are dependent despite diagonal covariance. Additional assumptions, such as joint Gaussianity, can make zero covariance imply independence; PCA alone does not provide them. Original 7 tests this distinction; ICA later asks a different question."}</Prose>

<H3>{"10.2 Rank, ties and stable computation"}</H3>

<Prose>{"That optimum can identify a subspace without identifying every axis: compare collinear, constant and tied tables before trusting a direction label."}</Prose>

<PcaReadingFlowFigure job="D38" />

<Prose>{"Compare the four fixed cases before changing a control. The original table has singular values "}<code>{"√18,√2"}</code>{" and rank 2. Its leading projector is uniquely "}<code>{"[[.5,.5],[.5,.5]]"}</code>{" because 18 exceeds 2. Collinear rows "}<code>{"(−2,−2),(−1,−1),(1,1),(2,2)"}</code>{" have spectrum "}<code>{"√20,0"}</code>{", rank 1 and exact one-coordinate training reconstruction. Their future query "}<code>{"(1,−1)"}</code>{" still has squared projection loss 2. Constant rows all "}<code>{"(3,2)"}</code>{" have centered rank 0 and exact mean-only training reconstruction, but no preferred nonzero axis or variance-share denominator. Finally the square "}<code>{"(±1,±1)"}</code>{" has singular values 2,2: every one-dimensional ruler loses 4, but different rulers reconstruct different points."}</Prose>

<Prose>{"Centered rows sum to zero, so they are linearly dependent and rank cannot exceed "}<code>{"min(n−1,d)"}</code>{". Rank counts nonzero independent directions, not a scientifically important feature count. Exact zero in these fixtures is distinct from a reported floating-point numerical threshold. At a boundary tie, a chosen k-subspace need not be unique. Retaining the whole tied space gives a unique projector even though its individual basis axes can rotate. In the constant case the identifiable range is the zero space; an arbitrary completed positive-dimensional axis can affect future queries without representing fitted signal."}</Prose>

<PcaReadingFlowFigure job="D38a" />

<Prose>{"Use only the fixed square for the angle/kept-count investigation. At "}<code>{"k=0"}</code>{", every angle gives projector 0 and loss 8; at "}<code>{"k=1"}</code>{", the projector "}<code>{"vvᵀ"}</code>{" and feet change while loss stays 4; at "}<code>{"k=2"}</code>{", every rotated orthonormal basis gives projector I and loss 0. The angle remains operable for all counts: what becomes invariant is the retained operator, not the basis description. Reset restores 0° and "}<code>{"k=1"}</code>{". Distinguish a deterministic software basis convention from an identified preferred direction."}</Prose>

<PcaReadingFlowFigure job="D39" />

<Prose>{"If A has singular values 1 and "}<code>{"10⁻⁸"}</code>{", its covariance-scale squared values include "}<code>{"10⁻¹⁶"}</code>{". Forming "}<code>{"AᵀA"}</code>{" squares the nonzero condition number and can make small directions harder to resolve numerically. This example does not assert that every such value disappears on every machine. Direct SVD avoids deliberately squaring the problem; a relative rank floor reports its numerical decision separately from physical importance."}</Prose>

<Prose>{"The exact two-column prerequisite uses Jacobi rotations. Its working column squares are "}<code>{"α=Σb₀²"}</code>{", "}<code>{"β=Σb₁²"}</code>{", with cross-product "}<code>{"γ=Σb₀b₁"}</code>{". It stops when "}<code>{"|γ|≤tolerance·√α·√β"}</code>{", which bounds the normalized column dot product. This is an "}<strong>{"orthogonality tolerance"}</strong>{", not a singular-value cutoff. Columns "}<code>{"(1,0)"}</code>{" and "}<code>{"(10⁻¹³,0)"}</code>{" have normalized dot 1 and are not orthogonal at tolerance "}<code>{"10⁻¹²"}</code>{"; columns "}<code>{"(1,0)"}</code>{" and "}<code>{"(0,10⁻¹³)"}</code>{" have dot 0 regardless of the second column's tiny length. Numerical rank has its own comparison against "}<code>{"eps·max(n,2)·smax"}</code>{". A covariance eigenvalue tie uses a third relative eigenvalue-gap policy."}</Prose>

<Prose>{"The helper returns four values: U columns, two singular values, V columns and rotation count. The local adapter centers, checks finite moderate-scale intermediates and transposes V columns into direction rows. It preserves the prerequisite's finite rotation budget and exhausted-budget error. The helper completes exactly zero columns by its literal-zero rules; a different minimum-norm solve in that file has an absolute singular cutoff and is not called by this PCA adapter. Keep these policies separate when reusing a full dependency file."}</Prose>

<Prose>{""}<code>{"pca_two_columns.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/pca_two_columns.py"} filename={"pca_two_columns.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"pca_two_columns.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/pca_two_columns.stdout.txt"} title={"Recorded new instructional output"}>{"original status unique_leading_axis singular [4.242641 1.414214] rank 2\noriginal factor_residual 4.965068306494546e-16\noriginal leading_projector_equal True\ncollinear status unique_leading_axis singular [4.472136 0.      ] rank 1\ncollinear factor_residual 9.930136612989092e-16\ncollinear leading_projector_equal True\nconstant status zero_energy singular [0. 0.] rank 0\nconstant factor_residual 0.0\nsquare status tied singular [2. 2.] rank 2\nsquare factor_residual 0.0\nsquare 0 0 loss 8.0 projector [[0. 0.]\n [0. 0.]]\nsquare 0 1 loss 4.0 projector [[1. 0.]\n [0. 0.]]\nsquare 0 2 loss 0.0 projector [[1. 0.]\n [0. 1.]]\nsquare 45 0 loss 8.0 projector [[0. 0.]\n [0. 0.]]\nsquare 45 1 loss 4.0 projector [[0.5 0.5]\n [0.5 0.5]]\nsquare 45 2 loss 0.0 projector [[1. 0.]\n [0. 1.]]\nsquare 90 0 loss 8.0 projector [[0. 0.]\n [0. 0.]]\nsquare 90 1 loss 4.0 projector [[0. 0.]\n [0. 1.]]\nsquare 90 2 loss 0.0 projector [[1. 0.]\n [0. 1.]]\ndependence_EU_EW_cov_cond_marg_product (0.0, 0.6666666666666666, 0.0, 1.0, 0.3333333333333333, 0.1111111111111111)"}</CodeBlock>

<Prose>{"This program prints the four fixed rank cases before its separate square-angle/count results. It uses scalar centered sums and a 2×2 leading-axis formula for hand tracing, plus the actual sibling "}<code>{"matrix_decomposition_scratch.py"}</code>{" import. Download both files together and run "}<code>{"python pca_two_columns.py"}</code>{"; the dependency's guarded demonstration main is not invoked by the import. This moderate-scale O(n) route exposes directions and ties; the maintained general SVD route remains appropriate for arbitrary feature counts."}</Prose>

<Prose>{"Small perturbations also matter when a leading eigengap is small. The symmetric matrix "}<code>{"[[1+g,.01],[.01,1]]"}</code>{" has leading-axis rotation "}<code>{".5·atan2(.02,g)"}</code>{": about "}<code>{".5729°"}</code>{" at "}<code>{"g=1"}</code>{" versus "}<code>{"43.5688°"}</code>{" at "}<code>{"g=.001"}</code>{". The adjoining fixed ellipses show that sensitivity relative to the zero-off-diagonal case. They are exact finite covariance comparisons, not an estimated uncertainty band."}</Prose>

<H3>{"10.3 Whitening and a probabilistic interpretation"}</H3>

<Prose>{"Keeping a subspace fixed still leaves a choice of score units; compare the same retained coordinates before and after dividing by their fitted spread."}</Prose>

<PcaReadingFlowFigure job="D40" />

<Prose>{"Keep unwhitened and whitened score lanes visible together. Our first four scores have magnitude "}<code>{"3/√2"}</code>{" and sample variance 6. Dividing by "}<code>{"√6"}</code>{" gives magnitude "}<code>{"√.75"}</code>{"; their sample variance becomes 1 and population-style variance .75. At "}<code>{"k=2"}</code>{", divide each coordinate by its own fitted square-root variance. Smaller-variance coordinates receive larger relative scaling. Inverse whitening multiplies by those same factors before decoding, so the retained raw reconstruction stays unchanged."}</Prose>

<Prose>{"This is standardizing the retained coordinate metric, not producing independent variables. Our scratch route rejects whitening a numerically zero retained direction, while current sklearn applies its own near-zero safeguard. Positive-rank comparisons match the declared domain; degenerate behavior is not silently claimed identical. P14 traces both inverse scaling and denominator conventions. The adapter below retains the already-fitted "}<code>{"CenteredPCA"}</code>{" from section 4 and stores one positive square-root variance per kept direction. "}<code>{"from_fitted"}</code>{" checks the established numerical-rank floor before taking those reciprocals; "}<code>{"transform"}</code>{" divides each score, and "}<code>{"inverse_transform"}</code>{" multiplies it back before using the core decoder. The ordinary equivalent is "}<code>{"PCA(n_components=2, whiten=True, svd_solver=\"full\")"}</code>{" on the same four rows; its positive-rank sample-variance convention matches these two reported lanes. Its near-zero safeguard remains a different contract. Supply sibling "}<code>{"centered_pca.py"}</code>{" when running this complete program."}</Prose>

<Prose>{""}<code>{"pca_whitening.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/pca_whitening.py"} filename={"pca_whitening.py"} title="Complete program" />

<Prose>{"Selected recorded reference output; same operations as the recorded calculation:"}</Prose>

<CodeBlock language="text" kind="output" filename={"pca_whitening.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/pca_whitening.stdout.txt"} title={"Selected recorded reference output; same operations as the recorded calculation"}>{"whitened_sample_variance [1. 1.]\nwhitened_population_variance [0.75 0.75]"}</CodeBlock>

<Prose>{"The two printed variance lines come from the recorded four-row calculation with these same factors and denominators. With no kept coordinates, the adapter returns an empty score table and decodes the mean; a zero-variance kept direction instead cannot supply a reciprocal scale. The adapter stores "}<code>{"O(k)"}</code>{" additional factors and adds "}<code>{"O(qk)"}</code>{" divisions or multiplications for q query rows, on top of the core encoder/decoder cost."}</Prose>

<PcaReadingFlowFigure job="D41" />

<Prose>{"A probabilistic model asks another question: what observed vector could be produced by a latent coordinate plus noise? Let latent "}<code>{"t∼N(0,1)"}</code>{" feed loading "}<code>{"W=2v₁"}</code>{", add the mean, and then add isotropic Gaussian noise with variance .5 on every observed coordinate. The covariance is"}</Prose>

<div className="neural-equation"><MathBlock>{"WW^T+.5I=\\begin{bmatrix}2.5&2\\\\2&2.5\\end{bmatrix},"}</MathBlock></div>

<Prose>{"with eigenvalues 4.5 and .5. The latent coordinate, a particular noise vector and an observed point are different objects. The ellipse shows the model's covariance; no random sample is needed to understand it."}</Prose>

<Prose>{"For an n-row fit, Gaussian maximum likelihood uses covariance "}<code>{"AᵀA/n"}</code>{", not the sample denominator "}<code>{"n−1"}</code>{". For k<d, the spectral ML solution keeps the leading eigenvectors, averages the discarded "}<strong>{"d−k"}</strong>{" eigenvalues to estimate "}<code>{"σ²"}</code>{", and uses loading columns "}<code>{"v_j√(λ_j−σ²)"}</code>{". Pad missing spectral zeros when n<d; averaging only the thin stored spectrum would use the wrong discarded count. An orthogonal rotation of latent columns describes the same observed covariance; the local implementation fixes that convention. This nonsingular route requires positive noise variance and positive retained signal above noise. A zero-noise state needs a different singular-distribution treatment rather than evaluating an ordinary density."}</Prose>

<PcaReadingFlowFigure job="D42" />

<Prose>{"Conditioning on a query does not return the orthogonal PCA score directly. Combine the latent prior squared norm with the observed residual squared norm:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\|t\\|^2+\\|a-Wt\\|^2/\\sigma^2."}</MathBlock></div>

<Prose>{"Completing the square gives "}<code>{"M=WᵀW+σ²I"}</code>{", posterior mean solving "}<code>{"Mm=Wᵀa"}</code>{", and posterior covariance "}<code>{"σ²M⁻¹"}</code>{". Here "}<code>{"M=4.5"}</code>{" and RHS "}<code>{"2z"}</code>{", so the decoded posterior mean is "}<code>{"(8/9)zv₁"}</code>{", closer to the fitted mean than the orthogonal foot "}<code>{"zv₁"}</code>{". For query "}<code>{"(6,4)"}</code>{", "}<code>{"z=5/√2"}</code>{" gives latent mean about 1.571348 and raw posterior decode "}<code>{"(5.222222,4.222222)"}</code>{", versus PCA's "}<code>{"(5.5,4.5)"}</code>{". Posterior variance is 1/9; it is not reconstruction error."}</Prose>

<Prose>{"The complete program uses Cholesky solves, rather than an explicit matrix inverse. Posterior covariance depends only on fitted W and noise, so it is computed once and stored with that fitted state; each later query solves only for its own mean. Its log density evaluates the stable quadratic "}<code>{"||a−Wm||²/σ²+||m||²"}</code>{"; its determinant is obtained from the small factored M. A full observed-covariance Cholesky on the tiny fixture independently matches the density. Ordinary PCA's sample eigenvalues are multiplied by "}<code>{"(n−1)/n"}</code>{" before the ML spectral comparison. Ordinary FactorAnalysis is also shown, but its diagonal noise model is more general than PPCA's isotropic one, so its iterative estimate is not declared an identical optimizer."}</Prose>

<Prose>{""}<code>{"probabilistic_pca.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/probabilistic_pca.py"} filename={"probabilistic_pca.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"probabilistic_pca.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/probabilistic_pca.stdout.txt"} title={"Recorded new instructional output"}>{"ml_eigenvalues [4.5 0.5]\nordinary_sample_to_ml_eigenvalues [4.5 0.5]\nnoise_variance 0.5000000000000001\nweights_covariance [[2. 2.]\n [2. 2.]]\nlatent_posterior_means [[1.571348]\n [0.      ]]\nlatent_posterior_covariance [[0.111111]]\nposterior_decoded [[5.222222 4.222222]\n [3.       2.      ]]\nquery_log_density [-4.132231 -2.243342]\nfull_covariance_log_density_equal True\nfactor_analysis_diagonal_noise [0.500061 0.500061]\nfactor_analysis_covariance [[2.500031 1.999969]\n [1.999969 2.500031]]\nn_less_than_d_zero_padded_ml_spectrum [1. 0. 0. 0.] 0.25000000000000006"}</CodeBlock>

<Prose>{"The main's fitted ML spectrum is 4.5/.5 and posterior density checks use two fixed queries. Its FactorAnalysis noise is approximately "}<code>{".500061"}</code>{" on this constructed symmetric example; its small convergence error is not relabelled exact. Density/solve cost after fitting is "}<code>{"O(dk+k²)"}</code>{" per query when the small factorization is reused. P15 changes the retained query coordinate to 3 to test whether you can distinguish latent posterior mean, decoded coordinate and orthogonal foot."}</Prose>

<H3>{"10.4 Samples, stability and denoising"}</H3>

<Prose>{"A model covariance and a fitted sample spectrum are different objects; an isotropic noise sample tests whether tall empirical bars alone identify structure."}</Prose>

<PcaReadingFlowFigure job="D43" />

<Prose>{"The saved Gaussian experiment used 40 observations and 20 independent standard-normal features, seed 23. Its fitted first two directions retain "}<code>{".24591458952369985"}</code>{" of sample variation; an isotropic population's fixed two-dimensional orthonormal projection retains "}<code>{"2/20=.10"}</code>{". The 20 saved bars and uniform population reference are different objects. PCA selected its axes after seeing finite sample variation, so the tallest fitted bars are not themselves proof of two underlying scientific factors."}</Prose>

<Prose>{"The original full Gaussian code/output below gives a recorded reference example. Its original raw sample array was not retained; the saved spectrum supplies the reference comparison without implying that raw rows are available. Original8 asks you to generate a new seed23 sample, then a separate seed24 sample, with shape40×20 and standard-normal distribution fixed. Your new fitted spectra are new results; neither must match the reference decimals across environments. Naming a component still needs evidence appropriate to the claim: stability/repeated data, a suitable null/noise model, known measurement relationships or held-out task performance."}</Prose>

<Prose>{""}<code>{"gaussian.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/gaussian.py"} filename={"gaussian.py"} title="Complete program" />

<Prose>{"Retained historical output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"gaussian.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/gaussian.stdout.txt"} title={"Retained historical output"}>{"0.2459"}</CodeBlock>

<Prose>{"The complete read-only companion below supplies the already-recorded sample fraction and all earlier predictive fold outcomes. It imports only the checked state loader from the section6 compression reader. Both its sample-versus-population distinction and its fold/no-PCA comparison have now been taught; it prints stored values without sampling, fitting or evaluating new records. Download it with "}<code>{"saved_pca_queries.py"}</code>{", "}<code>{"pca_saved_state.json"}</code>{" and "}<code>{"wine.csv"}</code>{"."}</Prose>

<Prose>{""}<code>{"saved_pca_outcomes.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/saved_pca_outcomes.py"} filename={"saved_pca_outcomes.py"} title="Complete program" />

<Prose>{"Selected recorded reference output; same operations as the recorded calculation:"}</Prose>

<CodeBlock language="text" kind="output" filename={"saved_pca_outcomes.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/saved_pca_outcomes.stdout.txt"} title={"Selected recorded reference output; same operations as the recorded calculation"}>{"gaussian_saved_first_two_population_share 0.24591458952369985 0.1\nsaved_prediction None [0.9722222222222222, 0.9722222222222222, 0.9722222222222222, 1.0, 1.0]\nsaved_prediction 2 [0.9444444444444444, 0.9722222222222222, 0.9166666666666666, 0.9714285714285714, 0.9714285714285714]\nsaved_prediction 8 [0.9722222222222222, 0.9722222222222222, 0.9722222222222222, 0.9714285714285714, 1.0]"}</CodeBlock>

<Prose>{"The displayed lines are retained unchanged from the corresponding earlier saved-state report. They describe the published reference calculations. They are separate from the new learner draws requested in Original8."}</Prose>

<Prose>{"The separate live noise calculation uses clean point "}<code>{"(2,2)"}</code>{" and the fixed diagonal ruler, with both noise orientations always visible. Perpendicular noise "}<code>{"(a,−a)"}</code>{" is discarded: the decoded point remains "}<code>{"(2,2)"}</code>{", clean-target squared error 0, while residual to the noisy input is "}<code>{"2a²"}</code>{". Parallel noise "}<code>{"(a,a)"}</code>{" survives: decode equals the noisy point, clean-target error "}<code>{"2a²"}</code>{" and input residual 0. At "}<code>{"a=0"}</code>{" both lanes coincide and both errors are 0. Thus an attractive low reconstruction loss against the noisy input need not mean better recovery of a clean target. This algebra describes the fixed projector; it is separate from the saved Gaussian fit and supplies no operational denoising guarantee."}</Prose>

<H3>{"10.5 Pixels, alarms and time"}</H3>

<Prose>{"Coordinates need not be chemical measurements: map the same encoder and decoder to named pixel locations before using reconstruction as an application."}</Prose>

<PcaReadingFlowFigure job="D44" />

<Prose>{"A small image is a record whose features are pixel intensities. The three 3×3 grids show a mean image of .5 everywhere, a unit pattern with first-row entries "}<code>{"(1,−1,0)/√2"}</code>{", and another with that pattern in the last row. Flattening uses row-major order, preserving each pixel's named location. The two patterns are orthonormal. Adding weights a and b produces "}<code>{"mean+aB₁+bB₂"}</code>{"; keeping only the first drops the last-row pattern. At "}<code>{"a=.3,b=−.2"}</code>{" and "}<code>{"k=1"}</code>{" its omitted squared pixel energy is "}<code>{".04"}</code>{". The controls' [-.5,.5] bounds keep every intensity in [0,1], so no hidden clipping changes the arithmetic."}</Prose>

<PcaReadingFlowFigure job="D45" />

<Prose>{"The same projection supplies two diagnostic quantities. Point P "}<code>{"(3,3)"}</code>{" has retained score squared 18 and essentially zero perpendicular residual; Q "}<code>{"(3,−3)"}</code>{" has score 0 and residual squared 18. A residual-only rule can miss an unusual position along a retained axis; a coordinate-size rule asks a different question. The drawing exposes both triangles and metrics. No fitted alert threshold or sensor-calibration claim accompanies this constructed example."}</Prose>

<PcaReadingFlowFigure job="D46" />

<Prose>{"PCA also forgets row order. Chronological records "}<code>{"(0,0),(1,1),(2,−1),(3,0)"}</code>{" and the permutation 0,2,1,3 have identical centered covariance. Their connecting time paths differ: the sum of squared successive steps is 9 versus 15. Observation identities follow the records through the permutation, while time positions change. A covariance representation cannot recover the missing time sequence; a temporal model needs that additional structure."}</Prose>

<Prose>{""}<code>{"pca_applications.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/pca_applications.py"} filename={"pca_applications.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"pca_applications.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/pca_applications.stdout.txt"} title={"Recorded new instructional output"}>{"pixel_target [[0.712132 0.287868 0.5     ]\n [0.5      0.5      0.5     ]\n [0.358579 0.641421 0.5     ]]\npixel_retained_and_loss [[0.712132 0.287868 0.5     ]\n [0.5      0.5      0.5     ]\n [0.5      0.5      0.5     ]] 0.03999999999999998\npixel_ordinary_decoder_equal True\npixel_full_kept_loss 0.0\nalarm_score2_residual2_foot P (17.999999999999996, 3.944304526105059e-31, array([3., 3.]))\nalarm_score2_residual2_foot Q (0.0, 18.0, array([0., 0.]))\nnoise_perpendicular_noisy_decoded_cleanloss_inputloss True (array([3., 1.]), array([2., 2.]), 3.944304526105059e-31, 2.0)\nnoise_perpendicular_noisy_decoded_cleanloss_inputloss False (array([3., 3.]), array([3., 3.]), 1.9999999999999982, 3.944304526105059e-31)\nchronological_and_permuted_rows [[ 0.  0.]\n [ 1.  1.]\n [ 2. -1.]\n [ 3.  0.]] [[ 0.  0.]\n [ 2. -1.]\n [ 1.  1.]\n [ 3.  0.]]\ncovariance_permutation_equal True\npath_squared_steps 9.0 15.0\nsaved_gaussian_first_two_and_population 0.24591458952369985 0.1"}</CodeBlock>

<Prose>{"The main gives the complete pixel decoder, both anomaly quantities, both noise-target errors, time-permutation check and read-only saved Gaussian reference. Its ordinary PCA comparison fits only the explicitly constructed four small image arrays; it neither downloads faces nor measures a real sensor task. The computed tiny residuals near "}<code>{"10⁻³¹"}</code>{" are floating-point roundoff around exact geometric zero. Changing an application purpose requires its own diagnostic and evidence rather than transplanting the same unlabelled score."}</Prose>

<H3>{"10.6 Randomized and incremental computation"}</H3>

<Prose>{"The direct-SVD route stores a dense centered table; a small sampled range can reduce factorization work when only a few directions are needed."}</Prose>

<PcaReadingFlowFigure job="D47" />

<Prose>{"A dense million-row,5000-feature float64 table occupies 40GB decimal before factorization workspace. This is an arithmetic storage estimate, not a measured runtime. If we want only a few directions, a range finder first compresses the large row dimension. For "}<code>{"n=1000,d=100,k=10"}</code>{" and oversampling "}<code>{"p=5"}</code>{", draw a 100×15 probe Ω, multiply "}<code>{"Y=AΩ"}</code>{", and take reduced QR to obtain orthonormal Q with 1000 rows and 15 columns. The smaller table "}<code>{"B=QᵀA"}</code>{" is 15×100. Its SVD supplies feature directions, while multiplying Q by B's left singular vectors produces approximate left patterns in the original 1000-row space."}</Prose>

<Prose>{"This approximation succeeds when Q captures the important range of A. Oversampling adds directions beyond the requested k. Neither an arbitrary short probe nor the same requested count guarantees exact parity with full SVD. Measure reconstruction residual and orthogonality on the actual inputs instead of inventing a speedup."}</Prose>

<PcaReadingFlowFigure job="D48" />

<Prose>{"Power iteration emphasizes large singular directions but can also destroy small numerical components. The live miniature fixes the centered table and probe, then shows QR after "}<code>{"AΩ"}</code>{", QR after "}<code>{"AᵀQ"}</code>{", and QR after multiplying back by A for each repetition. Changing q changes these actual stages; changing oversampling changes their port widths. Forming "}<code>{"(AAᵀ)^qAΩ"}</code>{" without normalization is a different numerical procedure. A zero-table inset has no positive signal direction, rather than dividing a zero range by its norm."}</Prose>

<Prose>{""}<code>{"randomized_pca.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/randomized_pca.py"} filename={"randomized_pca.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"randomized_pca.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/randomized_pca.stdout.txt"} title={"Recorded new instructional output"}>{"powers_passes_effective_k 0 2 1\nresidual_orthogonality 0.484348696621605 2.220446049250313e-16\nfull_range_exact_projector_equal True\nordinary_randomized_projector_equal True\npowers_passes_effective_k 2 6 1\nresidual_orthogonality 0.484348696621605 4.440892098500626e-16\nfull_range_exact_projector_equal True\nordinary_randomized_projector_equal True\nlimited_range_relative_residual 0.5130432638260607\nexact_relative_residual 0.484348696621605\ncollinear_requested_effective 2 1\nconstant_effective_and_query 0 [[1. 1.]]\nk0_score_shape (5, 0)"}</CodeBlock>

<Prose>{"The complete main separately uses a disclosed seeded constructed probe. With all three feature directions captured, its one-coordinate projector matches exact PCA, residual about "}<code>{".484349"}</code>{"; a restricted one-column probe at "}<code>{"q=0"}</code>{" leaves about "}<code>{".513043"}</code>{". These are tiny fixture diagnostics, not large-data performance measurements. The implementation returns an effective kept rank when a requested component has no numerical energy, stores the fitted mean, and exposes query/decoder operations. Its QR stages cost passes through A: roughly "}<code>{"O((2q+2)ndℓ+(q+1)(n+d)ℓ²+dℓ²)"}</code>{" with range-factor workspace "}<code>{"O((n+d)ℓ)"}</code>{" beyond the centered table, where "}<code>{"ℓ=min(k+p,min(n,d))"}</code>{". Oversampling and power iterations are useful choices with real costs. The complete teaching function additionally materializes the centered table and its reconstruction/residual diagnostic, using "}<code>{"O(nd)"}</code>{" extra storage. Its fitted transform computes exact dot products with the approximate retained directions; "}<code>{"Q"}</code>{" times the small left factors is an approximate factorization, not a replacement for those query dot products. The ordinary "}<code>{"randomized_svd"}</code>{" route fixes the normalizer to QR; its random signs are compared through projectors and residuals, not raw direction labels."}</Prose>

<PcaReadingFlowFigure job="D49" />

<Prose>{"Row batches introduce a different obstacle: separately centering each batch erases shifts between their means. Two rows at "}<code>{"(−1,0)"}</code>{" and two at "}<code>{"(1,0)"}</code>{" each have zero within-batch scatter, yet their merged scatter is "}<code>{"diag(4,0)"}</code>{". The missing term is the outer product of the difference between means, multiplied by "}<code>{"nb/(n+b)"}</code>{". It can be represented as one extra row "}<code>{"√(nb/(n+b))(μ−ν)"}</code>{", here "}<code>{"(−2,0)"}</code>{"."}</Prose>

<Prose>{"For an old n-row state and new b-row batch B with mean ν, stack the old factor "}<code>{"diag(s)D"}</code>{", the new centered rows "}<code>{"B−ν"}</code>{", and that correction row. The cross-product of the stack is the sum of the two represented within-group scatters plus the between-mean correction. Take its SVD, keep k directions, and update the combined mean by "}<code>{"μ+b/(n+b)(ν−μ)"}</code>{". Accumulate each original feature's centered scatter independently so the variance-share denominator does not omit previously discarded energy."}</Prose>

<Prose>{""}<code>{"incremental_pca.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/incremental_pca.py"} filename={"incremental_pca.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"incremental_pca.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/incremental_pca.stdout.txt"} title={"Recorded new instructional output"}>{"opposite_means_mean_singular_variance [0.] [4.] [5.333333]\nsmaller_tail_rows 1\nfull_history_variance_equal True\nordinary_mean_variance_equal True True\nfull_history_roundtrip True\nhorizontal_first_projector [[1. 0.]\n [0. 0.]]\nhorizontal_first_retained_total_energy [12.] 28.0\nhorizontal_first_global_loss 16.0\nhorizontal_first_ordinary_projector_equal True\nvertical_first_projector [[0. 0.]\n [0. 1.]]\nvertical_first_retained_total_energy [16.] 28.0\nvertical_first_global_loss 11.999999999999998\nvertical_first_ordinary_projector_equal True"}</CodeBlock>

<Prose>{"The first batch needs enough rows for its retained factors; this route requires at least "}<code>{"max(2,k)"}</code>{". Later dense batches can contain fewer than k rows, as the actual ordinary comparison's one-row tail shows. Full retained scatter agrees with exact batch covariance, but truncating after an update loses history. In the main, horizontal scatter 12 arriving before two vertical scatter 8 batches keeps the horizontal axis and leaves global loss 16. The reverse order accumulates vertical scatter 16, retains that axis and leaves loss 12. Both inspect the same total 28. This is a constructed order counterexample, not a failure of the correction identity."}</Prose>

<Prose>{"The local implementation has no forgetting factor and uses a fixed feature metric. If scaling is needed, compute it in a permitted first pass and freeze it before the PCA pass; changing online scales changes historical coordinates and requires another algorithm. One update factors about "}<code>{"b+k+1"}</code>{" working rows, costing "}<code>{"O((b+k+1)d·min(b+k+1,d))"}</code>{"; memory is bounded by those working rows and state, rather than all past records. Ordinary "}<code>{"IncrementalPCA.partial_fit"}</code>{" follows this dense-batch route; its separate "}<code>{"fit"}</code>{" batching and sparse densification behavior must not be confused with manual sparse partial fitting."}</Prose>

<H3>{"10.7 Kernel PCA"}</H3>

<Prose>{"Batch and random-range methods keep the linear feature space; a kernel instead changes the features whose centered variation is optimized."}</Prose>

<PcaReadingFlowFigure job="D50" />

<Prose>{"The one-dimensional inputs "}<code>{"−1,0,1"}</code>{" become squared features "}<code>{"1,0,1"}</code>{". Subtract their mean 2/3 to obtain "}<code>{"(1/3,−2/3,1/3)"}</code>{". In this feature space the end inputs coincide. Their dot-product table, the "}<strong>{"kernel"}</strong>{", is "}<code>{"K_ij=x_i²x_j²"}</code>{". Training row/column means are "}<code>{"(2/3,0,2/3)"}</code>{", grand mean 4/9. Centering selected corner cell gives "}<code>{"1−2/3−2/3+4/9=1/9"}</code>{". Double centering produces "}<code>{"HKH=aaᵀ"}</code>{", where "}<code>{"H=I−11ᵀ/n"}</code>{". The nonzero eigenvalue is 2/3 with eigenvector "}<code>{"(1,−2,1)/√6"}</code>{"; fitted scores are "}<code>{"Q√κ=(1,−2,1)/3"}</code>{", up to an orientation sign."}</Prose>

<Prose>{"The kernel supplies feature dot products without explicitly constructing every feature coordinate. Its Gram matrix must be symmetric positive semidefinite. A materially negative eigenvalue signals a different or invalid kernel contract; only justified small negative roundoff is clipped/ignored. Positive eigendirections are normalized by "}<code>{"√κ"}</code>{", rather than mistaken for the feature-space PCA variance itself. Local numerical rank uses its stated relative spectral floor."}</Prose>

<PcaReadingFlowFigure job="D51" />

<Prose>{"A later query 2 supplies kernel row "}<code>{"[4,0,4]"}</code>{" and query mean 8/3. Subtract the stored training column means and its own row mean, then add training grand mean 4/9. The result is "}<code>{"[10/9,−20/9,10/9]"}</code>{". Multiplying by "}<code>{"Q/√κ=(1,−2,1)/2"}</code>{" gives "}<code>{"10/3"}</code>{". In general this fixture's score is "}<code>{"x²−2/3"}</code>{". Query−2 has the same score: the original input cannot be uniquely recovered from it. A second query must still use the same training means; centering the query batch as if it were a new fit changes the transform."}</Prose>

<Prose>{""}<code>{"kernel_pca.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/kernel_pca.py"} filename={"kernel_pca.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"kernel_pca.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/kernel_pca.stdout.txt"} title={"Recorded new instructional output"}>{"square_lift_training_scores [[ 0.333333]\n [-0.666667]\n [ 0.333333]]\nstored_column_and_grand_means [0.666667 0.       0.666667] 0.4444444444444444\nsquare_lift_query_scores [[ 3.333333]\n [-0.666667]\n [ 0.333333]\n [ 3.333333]]\nordinary_training_score_gram_equal True\nordinary_query_equal_up_to_same_sign True\nlinear_kernel_pca_score_gram_equal True\nrepeated_input_score_shapes (3, 0) (2, 0)\nprecomputed_external_query [[3.333333]]"}</CodeBlock>

<Prose>{"The complete scratch route stores kernel parameters, training rows and their means, then exposes forward query scores. Precomputed training input is n×n; future input is q×n, with each column corresponding to the original training row. Repeated training inputs produce no positive centered eigenspace and empty scores. The RBF route accumulates squared feature differences into a two-dimensional distance table, avoiding an n×n×d temporary. Dense fit costs "}<code>{"O(n²d+n³)"}</code>{" and memory "}<code>{"O(n²+nd)"}</code>{"; queries cost "}<code>{"O(qnd+qnk)"}</code>{" for a retained k basis."}</Prose>

<Prose>{"Ordinary "}<code>{"KernelPCA"}</code>{" uses the dense eigensolver and removes zero eigendirections on these fixtures. Forward scores are compared with the same sign convention; linear-kernel score Gram matrices match ordinary centered PCA. "}<code>{"fit_inverse_transform=False"}</code>{" is explicit: a separately fitted ridge preimage can supply an approximate input reconstruction, but it is another model with regularization and error, not PCA's exact original-space decoder. This lesson's complete computational outcome is the forward train/query transform and its limits; it does not claim to provide that optional preimage fitter."}</Prose>

<H3>{"10.8 Sparse, robust and finite-grid variants"}</H3>

<Prose>{"Orthogonal dense directions are convenient for decoding, but a purpose may call for a small set of contributing features or resistance to corrupted entries. Those changes require a new objective and sometimes a new serving operator."}</Prose>

<PcaReadingFlowFigure job="D52" />

<Prose>{"The atoms "}<code>{"(1,0)"}</code>{" and "}<code>{"(1,1)/√2"}</code>{" are not orthogonal: their dot product is "}<code>{"1/√2"}</code>{". For query "}<code>{"(1,1)"}</code>{", naive dot products "}<code>{"(1,√2)"}</code>{" decode to "}<code>{"(2,1)"}</code>{". The correct ridge 0 coefficients solve the atom Gram system and give "}<code>{"(0,√2)"}</code>{", decoding to the query. With serving ridge "}<code>{"ρ>0"}</code>{" the Gram adds "}<code>{"ρI"}</code>{"; dependent atoms at "}<code>{"ρ=0"}</code>{" instead need a minimum-norm solve because multiple coefficient vectors can decode identically. The fitted sparsity penalty and serving ridge are different controls and meanings."}</Prose>

<Prose>{"Our complete modest-dimensional sparse dictionary route starts with centered A and solves"}</Prose>

<div className="neural-equation"><MathBlock>{"\\min_{Z,D}\\ \\tfrac12\\|A-ZD\\|_F^2+\\alpha\\|D\\|_1,\n\\quad\\text{subject to }\\|Z_{:j}\\|_2\\le1."}</MathBlock></div>

<Prose>{"The constraint prevents unboundedly growing scores while shrinking atom coefficients to evade their penalty. A projected gradient step updates Z and projects each score column onto its unit ball. An entrywise soft-threshold step updates D. Their respective gradient Lipschitz values are "}<code>{"||DDᵀ||₂"}</code>{" and "}<code>{"||ZᵀZ||₂"}</code>{"; the code uses bounded backtracking on the actual objective and explicit zero-curvature cases."}</Prose>

<Prose>{"The drawn one-step inset uses "}<code>{"A=[[1,1],[-1,-1]]"}</code>{", score column "}<code>{"(1,−1)/√2"}</code>{", atom "}<code>{"(1/√2,0)"}</code>{" and "}<code>{"α=.1"}</code>{". Its unit-gradient atom trial is "}<code>{"(√2,√2)"}</code>{", then thresholding gives "}<code>{"(√2−.1,√2−.1)"}</code>{". The objective falls from about 1.320710678 to .272842712. This is a trace of one update, not an assertion that it has fitted the global optimum. The complete iterative program reports both objective change and a projected/proximal stationarity diagnostic, or a maximum-iteration status. This objective is nonconvex in both factors jointly; a stationary solution is not necessarily globally best."}</Prose>

<Prose>{"Ordinary sklearn "}<code>{"SparsePCA"}</code>{" uses a related dictionary formulation and normalizes returned atoms. Its ridge transform therefore uses a distinct scale/state from our constrained Z/D factors; compare sparse supports, decode behavior and objective conventions rather than declaring identical signed axes. Zou–Hastie–Tibshirani's regression SPCA is another formulation involving a PCA-guided elastic-net regression criterion, not a synonym for this dictionary objective."}</Prose>

<PcaReadingFlowFigure job="D53" />

<Prose>{"Robust "}<strong>{"principal component pursuit"}</strong>{", PCP, instead decomposes an observed matrix "}<code>{"M=L+S"}</code>{", seeking a low-rank part and a sparse-entry part. The drawn 3×3 example has L all ones and one sparse entry 3 at its top-left, so M's top-left is 4. Its convex objective is "}<code>{"||L||_*+λ||S||₁"}</code>{", where nuclear norm sums singular values and entrywise L1 sums absolute entries. A single-pixel E11 matrix is both rank 1 and sparse; decomposition is not generally identifiable merely because the penalties can be computed. Recovery results need conditions such as incoherent low-rank factors and suitably distributed sparse support, not just an “outlier” label."}</Prose>

<Prose>{"Both threshold lanes use the same fixed illustrative operand "}<code>{"B=[[2,1],[1,2]]"}</code>{". Entrywise soft threshold "}<code>{"sign(b)max(|b|−τ,0)"}</code>{" at "}<code>{"τ=1"}</code>{" gives I. Singular-value threshold first identifies eigen/singular values 3,1 with vectors "}<code>{"(1,1)/√2,(1,−1)/√2"}</code>{", shrinks them to 2,0 and rebuilds a matrix of ones. One rebuilt corner is "}<code>{"2·(1/√2)²+0·(1/√2)²=1"}</code>{". At "}<code>{"τ=2"}</code>{" the entrywise output is 0 while the singular output is .5 everywhere; at 0 both return B and at 3 both return 0. The common threshold is the live control, with both outputs permanently visible."}</Prose>

<Prose>{"The full solver uses distinct updated operands. With scaled dual U and positive fixed ADMM penalty μ,"}</Prose>

<div className="neural-equation"><MathBlock>{"L_{new}=\\operatorname{SVT}_{1/\\mu}(M-S+U),\\quad\nS_{new}=\\operatorname{soft}_{\\lambda/\\mu}(M-L_{new}+U),\\quad\nU_{new}=U+M-L_{new}-S_{new}."}</MathBlock></div>

<Prose>{"The second threshold consumes the "}<strong>{"new"}</strong>{" L. Its sparse threshold need not equal the singular threshold, and neither operand is necessarily the illustrative B. Primal residual measures "}<code>{"M−L−S"}</code>{"; dual residual measures scaled change in the sparse block. The program checks separate absolute-plus-relative stopping limits, reports nonconvergence if exhausted and returns exact zeros for a zero matrix."}</Prose>

<Prose>{""}<code>{"pca_structured_variants.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/pca_structured_variants.py"} filename={"pca_structured_variants.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"pca_structured_variants.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/pca_structured_variants.stdout.txt"} title={"Recorded new instructional output"}>{"shared_operand_threshold 0 entrywise [[2. 1.]\n [1. 2.]] singular [[2. 1.]\n [1. 2.]]\nshared_operand_threshold 1 entrywise [[1. 0.]\n [0. 1.]] singular [[1. 1.]\n [1. 1.]]\nshared_operand_threshold 2 entrywise [[0. 0.]\n [0. 0.]] singular [[0.5 0.5]\n [0.5 0.5]]\nshared_operand_threshold 3 entrywise [[0. 0.]\n [0. 0.]] singular [[0. 0.]\n [0. 0.]]\nnonorthogonal_atom_scores 0.0 [[-0.        1.414214]]\nnonorthogonal_atom_scores 0.1 [[0.140845 1.19511 ]]\ndictionary_status_objective_iterations stationary 1.2502195841050028 107\ndictionary_atoms [[-2.960041 -1.201734 -0.      ]\n [ 0.       -0.313033  1.21219 ]]\ndictionary_score_column_norms [1. 1.]\nordinary_sparse_atoms [[ 0.926553  0.376164  0.      ]\n [ 0.       -0.250112  0.968217]]\nordinary_ridge_query_scores [ 1.277839 -0.128603]\npcp_status_objective_iterations converged 4.732050737962252 38\npcp_low [[0.999996 0.999998 0.999998]\n [0.999998 1.000001 1.000001]\n [0.999998 1.000001 1.000001]]\npcp_sparse [[3.000004 0.       0.      ]\n [0.       0.       0.      ]\n [0.       0.       0.      ]]\npcp_last_primal_dual_limits (38, 3.4487213449447624e-06, 3.048083341283814e-07, np.float64(5.198979485566356e-06), np.float64(1.3648827778794971e-06))\nE11_nuclear_l1 1.0 1.0\nzero_pcp_status zero_matrix\noptional_convex_status_objective optimal 4.732114031813975"}</CodeBlock>

<Prose>{"The constructed PCP run reports converged in 38 iterations, objective about 4.732050738, with both stopping bounds met; its factors approximate the declared ones/spike state within the displayed tolerances. Optional CVXPY solves the same convex objective and reports its solver status, rather than standing in for the from-scratch loop. It was available for the recorded tiny comparison, with objective about 4.732114032. A future environment without it can still run the NumPy scratch route. This tiny consistency check is neither universal identifiability nor a large-video benchmark. Each dense SVT dominates an iteration at roughly "}<code>{"O(nd·min(n,d))"}</code>{"; massive datasets need a different scale-appropriate implementation."}</Prose>

<PcaReadingFlowFigure job="D54" />

<Prose>{"For functions sampled on an unequal grid, the numerical metric should reflect its question. At times "}<code>{"(0,1,3)"}</code>{", trapezoidal quadrature weights are "}<code>{"(.5,1.5,1)"}</code>{". Residual "}<code>{"(1,0,1)"}</code>{" has weighted squared error 1.5 versus unweighted 2. Multiplying each sampled coordinate by "}<code>{"√w"}</code>{" lets ordinary centered PCA optimize this finite weighted metric; inverse scaling restores sampled values. A zero weight deletes a coordinate and prevents recovering it by division, so our invertible route requires positive weights. These are finite-grid functions, not a complete estimator for irregular sparse functional observations or biological timing."}</Prose>

<H3>{"10.9 Choose a representation, not a favourite name"}</H3>

<Prose>{"The sparse and robust branches changed the objective; compare other representation choices by what they preserve rather than by their names."}</Prose>

<PcaReadingFlowFigure job="D55" />

<Prose>{"The alternatives change what the representation preserves. Feature selection keeps a named original column. Random projection uses a sampled linear map for a distance-approximation question rather than fitted maximum variance. Uncentered TruncatedSVD on "}<code>{"(10,−1),(10,1)"}</code>{" chooses the large x offset; centered PCA chooses the varying y axis. Centering sparse data generally densifies it, so sparse uncentered SVD is a computationally useful different objective, rather than a transparent substitute."}</Prose>

<Prose>{"The original four-row centered fixture also distinguishes PCA from response regression. PCA's diagonal line has slope 1 and perpendicular SSE 2. Ordinary least squares designates y as response and minimizes vertical errors: slope "}<code>{"8/10=.8"}</code>{", vertical SSE 3.6. These totals measure different error geometries and cannot be ranked as if they were the same loss. A circle-to-one-coordinate projection has collisions, illustrating why a nonlinear manifold picture may need a different representation."}</Prose>

<Prose>{""}<code>{"pca_representation_choices.py"}</code>{" — complete program."}</Prose>

<RemoteCodeBlock source={"/learn-code/pca-dimensionality-reduction/pca_representation_choices.py"} filename={"pca_representation_choices.py"} title="Complete program" />

<Prose>{"Recorded new instructional output:"}</Prose>

<CodeBlock language="text" kind="output" filename={"pca_representation_choices.stdout.txt"} downloadUrl={"/learn-code/pca-dimensionality-reduction/pca_representation_choices.stdout.txt"} title={"Recorded new instructional output"}>{"grid_and_weights [0. 1. 3.] [0.5 1.5 1. ]\nweighted_library_decoder_equal True\nweighted_reconstruction_loss 2.368359067995901\nunweighted_weighted_changed_error 2.0 1.5\npca_ols_line_slopes 0.9999999999999999 0.8\npca_perpendicular_loss 2.0\nols_vertical_loss 3.6000000000000005\ncentered_uncentered_axes [[0. 1.]] [[1. 0.]]\nuncentered_mean_was_not_removed [10.  0.]\nrandom_projection_same_draw_equal True\noriginal_projected_pair_distances 1.4142135623730951 1.6220776484531783\nselected_original_feature [1. 0. 0.]"}</CodeBlock>

<Prose>{"This complete program supplies the weighted-grid scratch/library decoder, PCA/OLS comparison, explicit sparse uncentered route and a matched sampled random-projection matrix. For the latter it uses the same declared seed and normal draw as "}<code>{"GaussianRandomProjection"}</code>{", then prints one original and projected pair distance. The single pair is a diagnostic of that finite map, not a universal Johnson–Lindenstrauss guarantee. A distance guarantee needs its dimension/probability assumptions and a specified finite set."}</Prose>

<NeuralTable caption={"10.9 Choose a representation, not a favourite name"} headers={[<>{"Purpose"}</>,<>{"Mechanism and useful output"}</>,<>{"Limit and next route"}</>]} rows={[[<>{"Keep interpretable original attributes"}</>,<>{"Select named feature columns"}</>,<>{"May discard interactions; justify the chosen attributes using the task"}</>],[<>{"Approximate distances cheaply"}</>,<>{"Random linear coordinates"}</>,<>{"Stochastic finite-set guarantees have assumptions; not maximum variance or an exact decoder"}</>],[<>{"Minimize centered reconstruction loss"}</>,<>{"PCA with a stated metric"}</>,<>{"Linear and unsupervised; inspect omitted task information"}</>],[<>{"Preserve sparse input without centering"}</>,<>{"TruncatedSVD"}</>,<>{"Retains offsets; different objective from centered PCA"}</>],[<>{"Explore nonlinear neighbourhoods"}</>,<>{"t-SNE/UMAP neighbourhood procedures"}</>,<>{"Not PCA variance fractions, causal clusters or exact inverse; "}<a href={"/learn/path/full-curriculum/t-sne-umap-manifold-learning?module=classical-ml"}>{"Manifold Learning"}</a>{" develops these objectives"}</>],[<>{"Seek independent latent coordinates"}</>,<>{"ICA with extra distribution assumptions"}</>,<>{"Decorrelation alone was disproved by D37a; "}<a href={"/learn/path/full-curriculum/independent-component-analysis-ica?module=classical-ml"}>{"ICA"}</a>{" owns its optimizer"}</>],[<>{"Express nonnegative additive parts"}</>,<>{"NMF constrained factors"}</>,<>{"Different nonnegative domain/objective; "}<a href={"/learn/path/full-curriculum/non-negative-matrix-factorization-nmf?module=classical-ml"}>{"NMF"}</a>{" owns the full route"}</>],[<>{"Learn nonlinear reconstruction"}</>,<>{"Encoder/decoder parameters"}</>,<>{"Optimization, data and generalization assumptions differ; the full autoencoder fitting route is a separate extension, not an existing local prerequisite or computational promise of this lesson"}</>]]} />

<Prose>{"UMAP can transform later observations through its trained procedure; that operation is not the same fixed linear multiplication as PCA. A nonlinear map also does not automatically make visual clusters causal or preserve a global quantitative distance. The full optimizers in these other lessons are separate computational outcomes, not hidden missing components of the PCA pipeline."}</Prose>

<H3>{"10.10 A complete reproducible decision"}</H3>

<Prose>{"Return to Wine and name the observation unit: one wine with 13 chemical measurements. State the purpose before choosing the representation. For a descriptive collection map, use the full 178-row state and report its metric and external cultivar annotation without an unseen-performance claim. For compression, use the saved 133-row training state, retained mean/scales/basis and the 45-row validation curve. At budget .10 choose 8; at .06 choose 10. Inspect row 35's reconstruction and a legal changed query, identifying which errors are standardized and which are restored physical measurements. Record storage including the decoder, and distinguish selection evidence from final evaluation."}</Prose>

<Prose>{"For prediction, report every saved no-PCA/"}<code>{"k=2"}</code>{"/"}<code>{"k=8"}</code>{" fold outcome and the exact pipeline boundary, rather than selecting only the highest-looking result. A new modeling choice needs a forward protocol: permitted training/validation/test roles, preprocessing learned within those roles, candidate budget and decision rule before outcomes, retained state and honest failures. Declare those choices before your new run, then compute and label its outcomes separately from the existing folds. The supplied saved-state readers support offline reference inspection, while the complete ordinary recipes let you carry out the independent mini-project; its new outcome does not overwrite the reference study. The independent mini-project asks you to communicate this whole decision, not merely print a component count."}</Prose>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"11. What you should now be able to do"}</H2>

<Prose>{"Explain what belongs to a record, feature, direction, score and decoder; trace one signed score and recovered point; connect perpendicular error with retained variance under a fixed metric. Apply a training-only centered transform and its ordinary library counterpart, project a future row, reverse scaling, choose a stated budget and inspect the omitted error. Diagnose an undefined zero-energy fraction, a tied axis, a misleading loading label, a label-discarding high-variance coordinate and a pipeline leak."}</Prose>

<Prose>{"For deeper work, justify the direct-SVD numerical choice, a normalized approximate range, a batch mean correction, training-owned kernel centering or PPCA posterior solve. State why sparse atoms need a Gram solve and why low-rank/sparse penalties cannot identify every decomposition. Choose the objective and evidence before choosing a method name."}</Prose>

<Prose>{"Continue to "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml"}>{"K-Means & Hierarchical Clustering"}</a>{" for distance-based grouping or "}<a href={"/learn/path/full-curriculum/t-sne-umap-manifold-learning?module=classical-ml"}>{"Manifold Learning"}</a>{" for nonlinear neighbourhood questions. The "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.FactorAnalysis.html"}>{"ordinary FactorAnalysis documentation"}</a>{" extends the local latent-model comparison to feature-specific noise; there is no separately published local Factor Analysis lesson in the current catalogue. These routes answer different limitations; a complete PCA calculation is useful preparation rather than a claim of mastery over them."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H2>{"Further learning"}</H2>

<ul><li>{""}<a href={"https://arxiv.org/abs/1404.1100"}>{"Shlens, A Tutorial on Principal Component Analysis"}</a>{" builds the geometric and SVD views together. Revisit its measurement organization and factorization after tracing this lesson's four records."}</li><li>{""}<a href={"https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/d85e1a9d113142ade8ce5e4f5ef0b4e8_MIT18_650F16_PCA.pdf"}>{"MIT 18.650 PCA lecture notes"}</a>{" give a statistics-oriented explanation of covariance, sample versus population and high-dimensional limits."}</li><li>{""}<a href={"https://doi.org/10.1098/rsta.2015.0202"}>{"Jolliffe & Cadima's PCA review"}</a>{" surveys the method and variants. Use it to connect familiar core geometry with the deeper branches, rather than substituting terminology for their mechanisms."}</li><li>{""}<a href={"https://scikit-learn.org/stable/auto_examples/preprocessing/plot_scaling_importance.html"}>{"The official Wine scaling example"}</a>{" is another applied way to see that feature scaling changes PCA. Its experiment is separate from this lesson's recorded reference results."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H2>{"Technical references"}</H2>

<ul><li>{""}<a href={"https://doi.org/10.1080/14786440109462720"}>{"Pearson 1901"}</a>{" develops best-fitting lines/planes through perpendicular-distance geometry; the local PCA/OLS contrast uses that distinction."}</li><li>{""}<a href={"https://www.aoml.noaa.gov/ftp/pub/phod/thacker/SSAmanifoldPapers/SchoelkopfSmolaMueller1996.pdf"}>{"Schölkopf, Smola & Müller kernel PCA technical report"}</a>{", section 2 and centering appendix, supplies feature-space eigenvector normalization and the kernel route."}</li><li>{""}<a href={"https://www.miketipping.com/papers/met-mppca.pdf"}>{"Tipping & Bishop, Mixtures of Probabilistic Principal Component Analysers"}</a>{", sections 2–3, contains the single-model latent Gaussian derivation used here; the title is not the separate JRSS PPCA paper."}</li><li>{""}<a href={"https://arxiv.org/abs/0909.4061"}>{"Halko, Martinsson & Tropp"}</a>{", algorithms 4.1/4.4/5.1, explains random ranges, normalized power iteration and compressed factorization."}</li><li>{""}<a href={"https://www.cs.toronto.edu/~dross/ivt/RossLimLinYang_ijcv.pdf"}>{"Ross, Lim, Lin & Yang"}</a>{", section 3.1, develops the mean-corrected incremental update; its tracking benchmarks are not this lesson's evidence."}</li><li>{""}<a href={"https://web.stanford.edu/~hastie/Papers/spc_jcgs.pdf"}>{"Zou, Hastie & Tibshirani"}</a>{", section 3, gives regression sparse PCA, whose formulation is distinguished from our dictionary route."}</li><li>{""}<a href={"https://arxiv.org/abs/0912.3599"}>{"Candès, Li, Ma & Wright"}</a>{", identifiability conditions and algorithmic discussion, provides PCP's low-rank/sparse problem and recovery assumptions."}</li><li>{"Official "}<a href={"https://numpy.org/doc/stable/reference/generated/numpy.linalg.svd.html"}>{"NumPy SVD"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html"}>{"PCA"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.IncrementalPCA.html"}>{"IncrementalPCA"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.KernelPCA.html"}>{"KernelPCA"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.SparsePCA.html"}>{"SparsePCA"}</a>{", "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.FactorAnalysis.html"}>{"FactorAnalysis"}</a>{" and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html"}>{"StandardScaler"}</a>{" document the ordinary contracts. New instructional outputs here use NumPy 2.3.5 and scikit-learn 1.9.1; the historical execution keeps its own environment and date."}</li><li>{"The "}<a href={"https://scikit-learn.org/stable/common_pitfalls.html#data-leakage"}>{"data-leakage guide"}</a>{" explains why even unsupervised fitted preprocessing belongs inside training boundaries. "}<a href={"https://archive.ics.uci.edu/dataset/109/wine"}>{"UCI Wine"}</a>{" supplies the dataset provenance and licence."}</li></ul>

<Prose>{"For offline use, "}<code>{"PCA-SETUP.md"}</code>{" lists each complete local import/data group and the historical continuation recipes. The saved-state entry runs with its sibling JSON and Wine CSV; the tiny two-column route needs the complete matrix-decomposition helper. Source files, exact recorded stdout and data remain available together in the common file index. Copy/Download supplies the complete named file, while the visible code here explains its operations."}</Prose></section>
    <PcaSupportingFiles />
  </div>;
}

export default {
  title: 'PCA & Dimensionality Reduction',
  readTime: '~150 min read + 180 min practice',
  content: PcaReadingFlowLesson
};
