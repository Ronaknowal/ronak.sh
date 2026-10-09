import { H2, H3 } from "../../components/content/Headings.jsx";
import { Prose } from "../../components/content/Prose.jsx";
import { NeuralTable } from "../../components/lesson-labs/NeuralLessonElements.jsx";
import { CodeBlock } from "../../components/content/Code.jsx";
import { Math as InlineMath, MathBlock } from "../../components/content/Math.jsx";
import { RecommenderEvidenceProvider } from "../../components/lesson-labs/RecommenderFlowControls.jsx";
import { RequestEvidenceFigure, ObservedMatrixFigure, MaskLossFigure, EventTimelineFigure, BaselineShrinkFigure, ArtifactPermissionFigure, CoRaterFigure, CenteringOperandsFigure, NeighborSupportFigure, NeighborPredictionFigure, UserItemDualFigure, NeighborhoodConventionFigure } from "../../components/lesson-labs/RecommenderFlowEvidence.jsx";
import { RecommenderFactorProvider, FactorScoreFigure, FactorMatrixFigure, AmbiguousCompletionFigure, FactorRotationFigure, FactorRescaleFigure, FactorUpdateFigure, FactorTrajectoryFigure, PenaltyIncidenceFigure, GaussianPriorFigure, FixedFactorBowlFigure, CoordinateMinimizerFigure, ObservedBlockFigure } from "../../components/lesson-labs/RecommenderFlowFactors.jsx";
import { RecommenderImplicitProvider, ImplicitConfidenceFigure, ImplicitGramFigure, ImplicitGeometryFigure, ImplicitCostFigure, ImplicitContributionFigure, SignedConfidenceFigure } from "../../components/lesson-labs/RecommenderFlowImplicit.jsx";
import { RecommenderHistoryProvider, HistoryRepresentationFigure, HistoryGradientFigure } from "../../components/lesson-labs/RecommenderFlowHistory.jsx";
import { EaseReconstructionFigure } from "../../components/lesson-labs/RecommenderFlowEase.jsx";
import { RecommenderRankingProvider, PairGapFigure, PairGradientFigure, PairPopulationFigure, SlateConstructionFigure, RankingMetricsFigure, CandidateCeilingFigure, PairedRequestFigure } from "../../components/lesson-labs/RecommenderFlowRanking.jsx";
import { ExplicitLibraryIdentityFigure, ImplicitLibraryStateFigure } from "../../components/lesson-labs/RecommenderFlowLibrary.jsx";
import { ColdItemProjectionFigure, ServingSlateFigure, RetrievalGeometryFigure, EncoderTimeBoundaryFigure, GraphPropagationBridgeFigure } from "../../components/lesson-labs/RecommenderFlowServing.jsx";
import { RecommenderPolicyProvider, PolicyProbabilityTreeFigure, FinitePolicyLogFigure, ObservationRiskFigure } from "../../components/lesson-labs/RecommenderFlowPolicy.jsx";
import { RecommenderStudyProvider, RecordedSyntheticComparisonFigure, RetailDataAuditFigure, LockedStudyComparisonFigure, SavedRetailQueryFigure, SavedBundleReloadFigure } from "../../components/lesson-labs/RecommenderFlowStudy.jsx";
import { RecCanonicalProgram } from "../../components/lesson-labs/RecommenderFlowPrograms.jsx";
import { RecSupportingFiles } from "../../components/lesson-labs/RecommenderFlowFiles.jsx";
function RecommenderContent() {
  return <RecommenderEvidenceProvider><RecommenderFactorProvider><RecommenderImplicitProvider><RecommenderHistoryProvider><RecommenderRankingProvider><RecommenderPolicyProvider><RecommenderStudyProvider><div className="lesson-pilot recommender-flow-lesson">
<Prose opening="summary">{"A recommendation starts with a request: choose a few useful items for someone, using information available now. Several methods can produce a sortable number, but they do not all predict the same outcome. We will follow evidence through neighbors, shared factors and list decisions, then ask which later observations can assess the resulting rule."}</Prose>

<Prose opening="route">{"The continuous route follows all fourteen sections. Begin with the evidence matrix, one neighborhood calculation, one factor update and the list metrics. Return to the visible deeper passages for counted regularization, exact solves, implicit history, constrained item weights and exposure assumptions. Complete scratch and ordinary programs accompany their mechanisms; the experiments keep the distinction between a computed score and a measured outcome explicit."}</Prose>

<Prose opening="prerequisites">{"Before starting, review the dot product, transpose and matrix axes in "}<a href={"https://ronak.sh/learn/topic/vectors-matrices-tensor-operations"}>{"Vectors, Matrices & Tensor Operations"}</a>{", and residuals, gradients and train/validation/test roles in "}<a href={"https://ronak.sh/learn/topic/linear-logistic-regression"}>{"Linear & Logistic Regression"}</a>{". The worked calculations here refresh those operations as they are used. Gaussian priors and graph propagation are visible deeper branches; the local examples introduce their required objects."}</Prose>

<H2>{"1. Start with a request and the evidence you actually have"}</H2>

<Prose>{"Imagine a catalogue of workshop recordings. A learner visits at time 20, and three suggestions fit on the screen. The site knows some recordings they rated or played. Most learner–recording pairs have no recorded rating. A globally popular list is already a recommender; personalization must earn its extra complexity by helping on a declared assessment, rather than by producing more complicated-looking scores."}</Prose>

<Prose>{"A "}<strong>{"user"}</strong>{" is the entity receiving a suggestion. An "}<strong>{"item"}</strong>{" is something that can be suggested. A "}<strong>{"request"}</strong>{" is one decision at a particular time, and an "}<strong>{"interaction"}</strong>{" is an event such as a rating, play or purchase. An "}<strong>{"impression"}</strong>{" records that an item was actually shown. No play could mean no interest, no opportunity to see the item, or an unavailable item. It does not by itself name a low rating or a dislike."}</Prose>

<RequestEvidenceFigure />

<Prose>{"Trace request U0 at time 20. Its known history enters the scoring route; the candidate item I2 enters a separate item port. A later observed outcome sits on the other side of the request boundary. It can assess the issued suggestion, but cannot enter the earlier score. The request is more specific than “predict the matrix”: it also determines which evidence and items were available."}</Prose>

<Prose>{"Our first constructed catalogue has five users U0–U4 and seven items I0–I6. These IDs are stable labels, not coordinates: I6 is not six units away from I0. The recorded numbers are explicit ratings. A dash below means no rating exists."}</Prose>

<ObservedMatrixFigure />

<NeuralTable caption={"1. Start with a request and the evidence you actually have"} headers={[<>{"User / item"}</>,<>{"I0"}</>,<>{"I1"}</>,<>{"I2"}</>,<>{"I3"}</>,<>{"I4"}</>,<>{"I5"}</>,<>{"I6"}</>]} rows={[[<>{"U0"}</>,<>{"5"}</>,<>{"3"}</>,<>{"—"}</>,<>{"1"}</>,<>{"—"}</>,<>{"4"}</>,<>{"—"}</>],[<>{"U1"}</>,<>{"4"}</>,<>{"—"}</>,<>{"4"}</>,<>{"1"}</>,<>{"2"}</>,<>{"—"}</>,<>{"3"}</>],[<>{"U2"}</>,<>{"—"}</>,<>{"3"}</>,<>{"—"}</>,<>{"—"}</>,<>{"4"}</>,<>{"3"}</>,<>{"—"}</>],[<>{"U3"}</>,<>{"1"}</>,<>{"—"}</>,<>{"—"}</>,<>{"5"}</>,<>{"4"}</>,<>{"—"}</>,<>{"2"}</>],[<>{"U4"}</>,<>{"—"}</>,<>{"1"}</>,<>{"5"}</>,<>{"4"}</>,<>{"—"}</>,<>{"—"}</>,<>{"3"}</>]]} />

<Prose>{"There are 20 observed ratings and 15 missing cells. The observed ratings sum to 62, so their mean is 62/20=3.1. U0 has four ratings, summing to 13; their mean is 3.25. U0 has no rating for I2, I4 or I6. A recommendation may target one of these items, but the missing cells do not tell us what U0 would have rated them."}</Prose>

<Prose>{"An "}<strong>{"observation mask"}</strong>{" stores whether a rating exists separately from the rating's value. Let Ω denote the set of observed user–item pairs. A pair belongs to Ω when its rating is finite and present; it does not belong merely because someone filled a blank with a number. Our original catalogue uses ratings 1–5, but the more general editor permits a legitimate observed zero. For the row [0, missing, 4], the mask is [true, false, true] and the observed mean is 2. A test such as "}<code>{"rating != 0"}</code>{" would discard the observed zero and change that mean to 4."}</Prose>

<MaskLossFigure />

<Prose>{"For an observed pair, subtract the proposed score from its rating, square the residual and add that term. With score 3 and observed rating 0, the residual is −3 and the squared term is 9. A missing rating has no such residual; its mask excludes the term. Avoid computing an undefined missing-value subtraction and hoping that multiplying it by zero will repair it."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"\\operatorname{SSE}_{\\Omega}=\\sum_{(u,i)\\in\\Omega}(r_{ui}-s_{ui})^2,\n\\qquad\n\\operatorname{RMSE}_{\\Omega}=\\sqrt{\\operatorname{SSE}_{\\Omega}/|\\Omega|}."}</MathBlock></div>

<Prose>{"Here r is an observed rating and s is a model score. SSE is a sum of squared errors; RMSE is their root mean square and has the rating's units. Proposing score 3 for every observed cell gives SSE 36 in this catalogue. No missing-cell contribution hides in that total. If no ratings are observed, the empty SSE sum is zero, while RMSE and the observed mean are undefined: there is no denominator or observed outcome to summarize."}</Prose>

<Prose>{"The complete "}<code>{"evidence"}</code>{" program uses NumPy's finite mask, counts observations along each axis, and divides sums only where an observed count exists. Its recorded output gives the same 20/15 counts, mean 3.1 and SSE 36. Read the mask construction before the mean. Numerical zero and lack of evidence have different roles even when a compact sparse storage format ordinarily omits zero-valued entries."}</Prose>

<Prose>{""}<strong>{"Checkpoint."}</strong>{" A learner was never shown I6. Someone fills its missing rating with zero before calculating RMSE. What question changed?"}</Prose>

<Prose>{""}<strong>{"Hint."}</strong>{" Compare the error terms before and after filling."}</Prose>

<Prose>{""}<strong>{"Explained solution."}</strong>{" The calculation now evaluates against an invented zero rating for that pair. The original explicit-rating question concerns observed ratings. An implicit-feedback method can deliberately assign weak zero targets to unobserved pairs, but must declare that different objective and its weights. Filling a blank does not discover a true dislike."}</Prose>

<Prose>{"The mask identifies recorded ratings. It does not establish that those ratings are a representative sample of all preferences. People choose what to inspect and rate, and the previous service chose what to show. The optional policy and observation-risk section later distinguishes these sampling mechanisms. First we will keep the more immediate request-time permissions explicit."}</Prose>

<H3>{"Complete program: Audit the matrix before fitting"}</H3>

<Prose>{""}<code>{"np.isfinite"}</code>{" produces the independent observation mask. Axis counts retain user/item populations, while "}<code>{"R[seen]"}</code>{" forms the observed-only denominator. The zero-inclusive example shows why value zero cannot encode absence. NumPy supplies array operations; no model is fitted."}</Prose>

<RecCanonicalProgram language="python" filename="evidence.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/evidence.py" decodedSHA256="94ab5cc3a31e0cfa88a699d4ec223846bcbf73f9d205ad57f9d889cfbcf84c0b" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/evidence.stdout.txt" download="evidence.stdout.txt">Download the complete recorded output for evidence.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"users, items: (5, 7)\nobserved, missing: 20 15\nobserved mean: 3.1\nuser means: [3.25, 2.8, 3.333, 3.0, 3.25]\nuser 0 unseen: [2, 4, 6]\nzero is observed: [True, False, True]\nzero-inclusive mean: 2.0\nconstant-3 observed SSE: 36.0"}</CodeBlock>

<H2>{"2. Put time, eligibility and baselines before the model"}</H2>

<Prose>{"Before choosing an algorithm, state the task: for this miniature discovery example, suggest an available item the user has not previously rated. Repeat listening or grocery replenishment can require a different repeat-item policy. Removing previously used items by habit would change those tasks."}</Prose>

<Prose>{"Our final synthetic example supplies 31 events in an explicit order: ticks 1–20 fit parameters, ticks 21–25 compare choices, and ticks 26–31 assess the chosen rule. These invented ticks express permissions; they are not timestamps collected from a real service or an estimate of how a deployment behaves."}</Prose>

<EventTimelineFigure />

<Prose>{"At request time 20, the first twenty events lie in the permitted prefix. A recording released at tick 23 lies on the future side of the same axis. Knowing its title does not make it eligible at tick 20. By time 23 its release gate can open, but that does not retroactively put it in a previously issued list."}</Prose>

<Prose>{""}<strong>{"Training"}</strong>{" fits parameters. "}<strong>{"Validation"}</strong>{" compares choices such as rank, neighbor support or regularization. "}<strong>{"Test"}</strong>{" assesses the frozen choice under a declared new-data boundary. Choosing a setting because it looked best on test converts those observations into more validation. The original test can no longer assess that updated choice as untouched evidence."}</Prose>

<Prose>{"Every learned quantity follows the boundary: means, popularity counts, co-rating similarities, factor vectors, metadata transforms and calibration. Calculating popularity from the full event stream before splitting already uses future behavior. Splitting each user's events independently can also introduce other users' future interactions into an earlier model unless the allowed information policy explicitly permits them."}</Prose>

<Prose>{"A baseline is a simple complete rule against which the proposed method can be compared. It also supplies a defined fallback when a personalized method lacks evidence. These baseline outputs answer different questions:"}</Prose>

<NeuralTable caption={"2. Put time, eligibility and baselines before the model"} headers={[<>{"Rule"}</>,<>{"Training-only calculation"}</>,<>{"Meaning and limit"}</>]} rows={[[<>{"Global rating mean"}</>,<>{"Sum observed ratings / observed count"}</>,<>{"A rating fallback without personalization; unavailable without observations or a declared prior"}</>],[<>{"Shrunk item mean"}</>,<>{"(Item rating sum + s × prior mean) / (item count + s)"}</>,<>{"A rating score balancing an item's observations and a chosen pseudo-count"}</>],[<>{"Occurrence popularity"}</>,<>{"Count permitted interactions for each item; order by count and then item ID"}</>,<>{"A list baseline whose counts mix exposure, opportunity and preference"}</>]]} />

<BaselineShrinkFigure />

<Prose>{"Work a separate two-rating shrinkage illustration: ratings 5 and 1 have sum 6 and count 2; the prior mean is 3.1 and its pseudo-count s is 3. The prior contribution is 3×3.1=9.3. Add 6+9.3=15.3 and divide by 2+3=5, giving 3.06. Those three prior tokens are a modeling weight, not three observed ratings. The two-rating illustration resets this operand list; it does not claim that one column of the earlier matrix contains exactly those two observations."}</Prose>

<Prose>{"For n>0 and s≥0, the same expression is the weighted mean of the observed item mean and the prior, with weights n/(n+s) and s/(n+s). It reduces an unsupported one-rating extreme toward the prior. In the original matrix I2 instead has ratings 4 and 5, so its sum is 9 and the same prior/shrinkage gives (9+9.3)/5=3.66. Changing the selected item must change those actual operands. With n=0 and s>0, the answer is the declared prior 3.1; with n=s=0 the quotient is undefined. A separately named global-mean fallback may still apply if training observations exist. A fully empty dataset needs an explicit external prior rather than an invented observed mean. If s is tuned, that choice also needs the permitted validation boundary."}</Prose>

<ArtifactPermissionFigure />

<Prose>{"A fitted artifact is the saved rule available for serving: its parameters, history boundary and any selected settings travel together. Suppose validation ticks 21–25 choose a regularization setting and its corresponding artifact is ready at tick 30. That may be a valid choice for a later request, but neither the choice nor the artifact was available at tick 20. The permission gate must inspect both data/configuration availability and artifact time, rather than showing the later score as if it had been issued earlier."}</Prose>

<Prose>{"A "}<strong>{"warm"}</strong>{" user or item has training history; a "}<strong>{"cold"}</strong>{" one does not. A random interaction split often assesses another event for familiar entities. Holding out whole users or items asks a different question and may require a content or popularity fallback. Report what happens to unknown identities instead of discarding them and describing the remaining users as everyone."}</Prose>

<Prose>{"Explain the proposed baseline's units and permissions before adding a model. A count is not a rating; an eligible item is not necessarily preferred; a future fitted rule cannot answer a past request. Neighborhood methods next reuse permitted patterns across users and items."}</Prose>

<H3>{"Complete files and a local environment"}</H3>

<Prose>{"The common file index below groups complete source by its main teaching home. Keep the named dependency files in the same directory. A code block shows the whole file, with imports, data/configuration and its entry point; it is not a fragment to splice into an unrelated interpreter state. The local arrays and NumPy/SciPy solves open the model algorithm; the array libraries supply the numerical linear algebra kernels."}</Prose>

<Prose>{"Python 3.12.14 with NumPy 2.3.5, SciPy 1.18.1, pandas 3.0.1, scikit-surprise 1.1.5 and implicit 0.7.3 is the declared new-program environment. openpyxl reads the official workbook during the offline data derivation. Historical outputs remain attached to their original execution context; sharing a filename does not imply a new execution with these versions. On a Windows machine with Python 3.12 available, a separate environment can be created as follows:"}</Prose>

<CodeBlock language={"powershell"}>{"py -3.12 -m venv .venv\n.venv/Scripts/python.exe -m pip install numpy==2.3.5 scipy==1.18.1 pandas==3.0.1 scikit-surprise==1.1.5 implicit==0.7.3 openpyxl"}</CodeBlock>

<Prose>{"The fourteen original "}<code>{".py"}</code>{" downloads retain their physical Windows CRLF line endings; displayed and copied code uses the corresponding LF characters. The ten additional files use UTF-8 with LF. The common index supplies complete output files as well as source: short recorded selections on the page do not replace the full JSON state and trace. The Retail bundle includes attributed calendar-role data, the full report, ordered local IDs, typed arrays and both decision locks. It excludes the private original customer-ID map."}</Prose>

<Prose>{"Standard-library-only Fraction calculations need none of the scientific packages. Native packages may require a compatible wheel or compiler for the platform. The data and study files accept explicit paths rather than searching the network or the working directory for an unspecified dataset."}</Prose>

<NeuralTable caption={"Complete files and a local environment"} headers={[<>{"Complete source"}</>,<>{"Main home"}</>,<>{"Computational role"}</>]} rows={[[<>{""}<code>{"evidence.py"}</code>{""}</>,<>{"§1"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"neighbors.py"}</code>{""}</>,<>{"§3"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"recommender-neighborhood-contracts.py"}</code>{""}</>,<>{"§3"}</>,<>{"new complete program"}</>],[<>{""}<code>{"gradient.py"}</code>{""}</>,<>{"§5"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"explicitFit.py"}</code>{""}</>,<>{"§5"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"recommender-factor-structure.py"}</code>{""}</>,<>{"§6"}</>,<>{"new complete program"}</>],[<>{""}<code>{"observedAls.py"}</code>{""}</>,<>{"§6"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"implicitBlock.py"}</code>{""}</>,<>{"§7"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"implicitFit.py"}</code>{""}</>,<>{"§7"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"recommender-history-core.py"}</code>{""}</>,<>{"§7"}</>,<>{"new complete program"}</>],[<>{""}<code>{"recommender-ease-contracts.py"}</code>{""}</>,<>{"§7"}</>,<>{"new complete program"}</>],[<>{""}<code>{"bpr.py"}</code>{""}</>,<>{"§8"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"recommender-bpr-training.py"}</code>{""}</>,<>{"§8"}</>,<>{"new complete program"}</>],[<>{""}<code>{"ranking.py"}</code>{""}</>,<>{"§9"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"surpriseLibrary.py"}</code>{""}</>,<>{"§10"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"recommender-history-library.py"}</code>{""}</>,<>{"§10"}</>,<>{"new complete program"}</>],[<>{""}<code>{"implicitLibrary.py"}</code>{""}</>,<>{"§10"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"coldItem.py"}</code>{""}</>,<>{"§11"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"recommender-forward-boundaries.py"}</code>{""}</>,<>{"§11"}</>,<>{"new complete program"}</>],[<>{""}<code>{"policy.py"}</code>{""}</>,<>{"§12"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"recommender-propensity-risk.py"}</code>{""}</>,<>{"§12"}</>,<>{"new complete program"}</>],[<>{""}<code>{"evaluation.py"}</code>{""}</>,<>{"§13"}</>,<>{"retained complete program"}</>],[<>{""}<code>{"recommender-retail-data.py"}</code>{""}</>,<>{"§13"}</>,<>{"new complete program"}</>],[<>{""}<code>{"recommender-retail-study.py"}</code>{""}</>,<>{"§13"}</>,<>{"new complete program"}</>]]} />

<Prose>{""}<code>{"recommender-history-library.py"}</code>{" loads "}<code>{"recommender-history-core.py"}</code>{" from its own directory. "}<code>{"recommender-retail-study.py"}</code>{" loads "}<code>{"recommender-retail-data.py"}</code>{" there too; its readiness manifest binds all ten new filenames and data inputs. Use the supplied derived-data route to run the complete study locally. Create a directory named "}<code>{"retail-data"}</code>{" beside the ten "}<code>{"recommender-*.py"}</code>{" source files and download these four files from the common file index into it:"}</Prose>

<NeuralTable caption={"Complete files and a local environment"} headers={[<>{"Required file in "}<code>{"retail-data"}</code>{""}</>,<>{"Role"}</>]} rows={[[<>{""}<code>{"retail-manifest.json"}</code>{""}</>,<>{"Attribution, ordered user/item IDs, calendar roles and exact CSV hashes"}</>],[<>{""}<code>{"retail-train.csv"}</code>{""}</>,<>{"December training occurrences, including outside-catalogue items"}</>],[<>{""}<code>{"retail-validation.csv"}</code>{""}</>,<>{"January selection occurrences"}</>],[<>{""}<code>{"retail-test.csv"}</code>{""}</>,<>{"February assessment occurrences"}</>]]} />

<Prose>{"Keep this manifest and these three complete CSVs together; do not rename, truncate or convert their line endings. Their bytes and ID/calendar schema are checked when each role is opened. This route needs no source archive, extracted workbook or private original-ID map. "}<strong>{"Skip the data-derivation command"}</strong>{": the supplied files already contain its complete result. The saved "}<code>{"study-results.json"}</code>{", locks and array files are outputs for inspecting the recorded campaign, not replacements for the four inputs above."}</Prose>

<Prose>{"From the directory containing the ten source files, a learner who intentionally starts a new local campaign can prepare a new readiness file and choose a fresh output directory:"}</Prose>

<CodeBlock language={"powershell"}>{"python recommender-retail-study.py --data retail-data --prepare-readiness retail-ready-local.json\npython recommender-retail-study.py --data retail-data --readiness retail-ready-local.json --output retail-study-local"}</CodeBlock>

<Prose>{"Neither "}<code>{"retail-ready-local.json"}</code>{" nor "}<code>{"retail-study-local"}</code>{" may already exist. Readiness preparation performs no fit and binds the current local sources and installed packages. The second command intentionally performs the declared six fits; reading the saved report requires neither command. The recorded campaign remains its own fixed outcome. The study writes its campaign-start guard before fitting. Its later two immutable locks separate validation selection and prefix predictions from test truth. The complete recipe, confidence/scorer convention and input/output meaning are explained in §13 before the study source."}</Prose>

<RecSupportingFiles />

<H2>{"3. Borrow evidence from people or items with shared history"}</H2>

<Prose>{""}<strong>{"Collaborative filtering"}</strong>{" uses interaction patterns across users and items. It does not require item descriptions. User-based filtering asks which people have behaved similarly on shared items and what they rated the target item. Item-based filtering asks which items have similar co-rater patterns and what the target user rated those items. Neither is a synonym for content similarity."}</Prose>

<CoRaterFigure />

<Prose>{"For two items i and j, first intersect their observed user IDs. Call this set Sᵢⱼ. Each retained user supplies an aligned pair of observations; a private observation of only one item does not enter the other's missing position. The dot product adds matching-coordinate products. Each vector length is the square root of the corresponding squared values, using that same intersection."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"C_{ij}=\\sum_{v\\in S_{ij}}a_{vi}a_{vj},\\quad\nN_i=\\sqrt{\\sum_{v\\in S_{ij}}a_{vi}^2},\\quad\nN_j=\\sqrt{\\sum_{v\\in S_{ij}}a_{vj}^2},\\quad\n\\operatorname{cos}(i,j)=C_{ij}/(N_iN_j)."}</MathBlock></div>

<Prose>{"Raw cosine uses aᵥᵢ=rᵥᵢ. Dividing by lengths removes an overall positive scale: it compares directions on common evidence. These pair-specific lengths can change when the paired item changes. Empty overlap or zero length makes the normalized similarity unavailable, so it cannot become an accepted neighbor. A program may encode an unusable weight as zero, but that encoding does not prove an orthogonal preference pattern."}</Prose>

<CenteringOperandsFigure />

<Prose>{"Take a separately stated two-co-rater example. Item columns (5,3) and (3,1) give products 15 and 3, sum 18, squared-length sums 34 and 10, and raw cosine 18/√340≈.976. The two users' full-training rating means are stated as 4 and 2. Subtract each user's own mean: the first item's residual column is (1,1), the second is (−1,−1). Their dot is −2 and each length is √2, so adjusted cosine is −1. Both users put the first item above their usual rating and the second below."}</Prose>

<Prose>{""}<strong>{"Adjusted cosine"}</strong>{" centers each co-rater using their full observed training row, then computes the pair products and lengths on Sᵢⱼ. "}<strong>{"Pair-centered Pearson"}</strong>{" instead centers each compared column using its mean over this pair's overlap. These are different populations and estimators, even if a special example makes their answers coincide. Equal centered values can have length zero; a centering operation does not guarantee a usable direction."}</Prose>

<NeighborSupportFigure />

<Prose>{"With one co-rater and two positive raw ratings, cosine is exactly 1: ab/(|a||b|)=1. That algebra does not establish item interchangeability. Require at least a declared number of co-raters, then multiply the surviving similarity by n/(n+s), where n is overlap and s≥0 a shrinkage setting. For n=1 and s=2, that factor is 1/3. Support and angle answer different questions; neither this multiplier nor a minimum count supplies a statistical confidence interval."}</Prose>

<Prose>{"After support and sign filtering, choose the k largest absolute weights, breaking exact ties by item ID. A positive-only rule discards negative similarities. A signed rule can keep them and must retain their signs through the numerator. Changing support, s, k or sign policy changes the named rule, rather than merely the way the same answer is displayed."}</Prose>

<NeighborPredictionFigure />

<Prose>{"For a centered item-based prediction, start at the target user's mean b=3. Suppose they rated two accepted neighbors 1 and 5, with weights −.5 and .25. Subtract the baseline: residuals −2 and +2. Multiply: (−.5)(−2)=1 and .25×2=.5. Add 1.5, divide by |−.5|+|.25|=.75 to get correction 2, then add the baseline: the predicted rating is 5. The negative weight reverses a negative residual's contribution; it does not cancel the denominator."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"\\hat r_{ui}=\\bar r_u+\n\\frac{\\sum_{j\\in N_{ui}} w_{ij}(r_{uj}-\\bar r_u)}\n{\\sum_{j\\in N_{ui}}|w_{ij}|}."}</MathBlock></div>

<Prose>{"Nᵤᵢ contains only accepted neighbors the target user actually rated. Without an accepted nonzero weight, fall back to their training mean, then the training global mean, then a declared prior if all training data are empty. Do not divide by an empty denominator or call that fallback a personalized estimate. The raw variant averages ratings without the residual baseline. Positive normalized weights keep that raw average within its contributing rating range; signed residual combinations can leave the declared rating scale. Clipping is an additional prediction rule and must be stated separately."}</Prose>

<Prose>{"In our original 5×7 matrix, U0/I2 has raw neighbors I0, I1 and I3 under minimum support 1, no shrinkage and positive weights. The first two weights are 1 from one co-rater each; I3's two-co-rater raw weight is approximately .909065. Their ratings 5,3,1 produce about 3.062518. The adjusted-cosine default instead needs two co-raters, shrinkage 2 and positive weights; it accepts no neighbor for this target, so returns U0's mean 3.25. A more conservative rule need not produce a more elaborate-looking answer."}</Prose>

<Prose>{"The complete retained "}<code>{"neighbors"}</code>{" program constructs shared masks, computes full-row means for adjusted centering, gates support/sign, sorts by absolute weight and ID, then adds the weighted residual or returns its named fallback. Its three printed configurations expose both successful aggregation and empty accepted sets. The algorithm's inputs are the permitted training matrix and settings, not the unknown target rating."}</Prose>

<UserItemDualFigure />

<Prose>{"User-based filtering has a distinct route. Intersect the target user's observed items with each potential neighbor's observed items, calculate their declared similarity, then inspect the neighbor's rating of the target item. Its prediction subtracts the neighbor's full-training mean and adds the target user's mean. Transposing a display alone does not make this output equal to the item-based one: the centering means, evidence intersection and target-rating source differ."}</Prose>

<Prose>{"Work the separate matrix [[5,1,missing],[4,2,3],[1,5,5]] at U0/I2. Full row means are 3,3,11/3. The U0/U1 shared residual vectors are (2,−2) and (1,−1), giving similarity 1. The U0/U2 vectors are (2,−2) and (−8/3,4/3), giving −3/√10. U1's target residual is 3−3=0; U2's is 5−11/3=4/3. Keeping both signed neighbors gives 3−4/(√10+3)≈2.350889. The positive-only route retains U1 and returns 3. Missing U0/I2 never enters either similarity or residual."}</Prose>

<NeighborhoodConventionFigure />

<Prose>{"The ordinary Surprise 1.1.5 Pearson similarity centers over each pair's overlap. Its KNNWithMeans prediction uses each full training row's mean and keeps positive neighbors. In item mode those rows/means represent items. Insufficient actual neighbor count returns the target row's mean. These semantics cannot be inferred from the label “centered CF”; they differ from our signed user-mean-adjusted item route. The new complete neighborhood program shows both populations and each actual ordinary output under its own rule rather than asserting false numerical parity. "}<a href={"https://surprise.readthedocs.io/en/stable/similarities.html"}>{"Surprise's similarity definitions"}</a>{" and "}<a href={"https://surprise.readthedocs.io/en/stable/knn_inspired.html"}>{"KNN contracts"}</a>{" make those roles explicit."}</Prose>

<Prose>{"Grouping users is another way to change the evidence. A cluster aggregate must retain its member IDs and each item's observed sum/count. For members U0/U1 in the separate matrix, item sums are [9,3,3] and observed counts [2,2,1], giving cluster means [4.5,1.5,3]. The missing U0/I2 is not counted as zero. An item with no observed cluster member remains missing. Similarity between these aggregate rows asks a group-level question and can discard individual variation; it is not the same estimator made faster by a different name. Full clustering engines belong to their own model lessons."}</Prose>

<Prose>{"Computing one item pair directly scans its user evidence. Computing all item pairs can cost O(U I²) before selected-neighbor storage and must be refreshed when its permitted history changes. Precomputed neighborhoods trade storage and refresh work for serving work; no universal speed advantage follows from the formula. The next method shares learned coordinates across many sparse user–item cells instead of caching a complete pair-similarity table."}</Prose>

<H3>{"Complete program: Trace shared evidence into a neighbor score"}</H3>

<Prose>{"The pair mask intersects two item columns before products and norms are formed. Full user means supply adjusted-cosine residuals; support/shrinkage are applied before the stable neighbor selection. The selected signals and absolute-weight denominator expose the signed rule. No accepted neighbor invokes the declared target-user baseline; zero is not fabricated as a rating."}</Prose>

<RecCanonicalProgram language="python" filename="neighbors.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/neighbors.py" decodedSHA256="ef193cabdf0eac37e9454d3753a445f1d96666deb74ce6012e828ea371c8c3e8" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/neighbors.stdout.txt" download="neighbors.stdout.txt">Download the complete recorded output for neighbors.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"centered=False, minimum=1, score=3.062518\n  selected (item, overlap, weight, signal): [(0, 1, 1.0, 5.0), (1, 1, 1.0, 3.0), (3, 2, 0.909065, 1.0)]\ncentered=True, minimum=2, score=3.250000\n  selected (item, overlap, weight, signal): []\ncentered=True, minimum=4, score=3.250000\n  selected (item, overlap, weight, signal): []"}</CodeBlock>

<H3>{"Complete program: Compare declared neighborhood populations"}</H3>

<Prose>{""}<code>{"ratings_matrix"}</code>{" retains a finite-zero/null distinction. "}<code>{"means"}</code>{" forms full-training means; "}<code>{"similarity"}</code>{" first isolates common entities, then applies the named raw, full-mean or pair-mean convention. "}<code>{"predict"}</code>{" keeps signed and positive-only policies separate for user/item orientations. "}<code>{"cluster_aggregate"}</code>{" exposes sums/counts/null columns. Four ordinary KNN fits use the same triplets and print their actual ID/similarity/mean populations; pair-overlap Pearson and full-row prediction means are not silently equated."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-neighborhood-contracts.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-neighborhood-contracts.py" decodedSHA256="0079fa76053fa147f988ac815d601e7e63e42eada0e05098e1c2da1161790570" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-neighborhood-contracts.stdout.txt" download="recommender-neighborhood-contracts.stdout.txt">Download the complete recorded output for recommender-neighborhood-contracts.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"rowMeans\": [\n    3.0,\n    3.0,\n    3.6666666666666665\n  ],\n  \"signedUserCF\": 2.350889359326483,\n  \"positiveUserCF\": 3.0,\n  \"signedItemCF\": 1.0,\n  \"cluster\": {\n    \"memberIDs\": [\n      0,\n      1\n    ],\n    \"sums\": [\n      9.0,\n      3.0,\n      3.0\n    ],\n    \"counts\": [\n      2,\n      2,\n      1\n    ],\n    \"means\": [\n      4.5,\n      1.5,\n      3.0\n    ]\n  },\n  \"ordinaryPredictions\": [\n    {\n      \"algorithm\": \"KNNBasic\",\n      \"userBased\": true,\n      \"estimate\": 3.0,\n      \"details\": {\n        \"actual_k\": 1,\n        \"was_impossible\": false\n      }\n    },\n    {\n      \"algorithm\": \"KNNWithMeans\",\n      \"userBased\": true,\n      \"estimate\": 3.0,\n      \"details\": {\n        \"actual_k\": 1,\n        \"was_impossible\": false\n      }\n    },\n    {\n      \"algorithm\": \"KNNBasic\",\n      \"userBased\": false,\n      \"estimate\": 1.0,\n      \"details\": {\n        \"actual_k\": 1,\n        \"was_impossible\": false\n      }\n    },\n    {\n      \"algorithm\": \"KNNWithMeans\",\n      \"userBased\": false,\n      \"estimate\": 2.3333333333333335,\n      \"details\": {\n        \"actual_k\": 1,\n        \"was_impossible\": false\n      }\n    }\n  ],\n  \"zeroNormAvailable\": false,\n  \"emptyFallback\": 3.0\n}"}</CodeBlock>

<Prose>{"The signed user rule gives about 2.350889; keeping only positive neighbors gives 3. The ordinary item-oriented KNNWithMeans result is 7/3, whereas its user-oriented result is 3. This difference follows the named entity means and accepted positive Pearson neighbors. It is not an approximation error between identical rules. The empty row uses its stated prior, and a zero-length pair remains unavailable."}</Prose>

<H2>{"4. Replace a huge score table with shared factors"}</H2>

<Prose>{"A separate score for every user–item pair requires U×I numbers and cannot by itself share evidence across missing cells. "}<strong>{"Matrix factorization"}</strong>{" gives each user a short vector pᵤ and each item a vector qᵢ of the same dimension d. A coordinate of these vectors is a "}<strong>{"factor"}</strong>{": a learned numerical direction used by many scores, rather than a separately fitted parameter for one pair."}</Prose>

<FactorScoreFigure />

<Prose>{"Return to a declared two-coordinate score fixture. The global rating mean μ is 3, the user bias bᵤ is .1 and the item bias bᵢ is −.1. A bias is an additive offset shared across that entity's scores. The vectors p=(.4,−.2) and q=(.5,.3) give matching products .4×.5=.20 and (−.2)×.3=−.06. Their sum is .14. Add 3+.1−.1+.14 to obtain score 3.14. This is a rating score, not a probability."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"s_{ui}=\\mu+b_u+b_i+p_u^Tq_i."}</MathBlock></div>

<Prose>{"The superscript T means transpose: regard the same-coordinate vectors as a row and column for the product. A lookup of pᵤ or qᵢ selects an entity's saved row; it is not a calculation from the numerical distance between IDs. Each qᵢ affects all users' scores for item i, and each pᵤ affects that user's scores for every item. This shared use lets observed pairs teach parameters used by unobserved pairs, but does not make an unobserved target known."}</Prose>

<FactorMatrixFigure />

<Prose>{"Stack user rows in P, shape U×d, and item rows in Q, shape I×d. Transpose Q to shape d×I. The product P Qᵀ has shape U×I, and cell (u,i) uses exactly the two selected rows' matching products. The factor part has rank at most d: every column is a combination of the d columns of P. Add μ, user biases across rows and item biases down columns separately. A rank bound on the factor product does not say that the full table including these broadcasts has rank d."}</Prose>

<H3>{"Deeper: a completion and its coordinates need not be unique"}</H3>

<AmbiguousCompletionFigure />

<Prose>{"Suppose a 2×2 matrix reveals only its two diagonal entries, both 1. The rank-one completions [[1,.5],[2,1]] and [[1,2],[.5,1]] both fit those observations exactly and disagree on the missing entries. Their second rows are respectively twice and half their first rows, and their determinants are zero. More generally, [[1,a],[1/a,1]] works for every nonzero a. If a=0, the reciprocal construction is unavailable; it is not a valid limiting completion with a silently filled missing cell. Low rank plus observed fit alone does not identify all missing ratings. Validation adds evidence for model choices but cannot prove an intrinsic universal rank from a finite sample."}</Prose>

<FactorRotationFigure />

<Prose>{"The coordinate axes also need not identify genres. Rotate p and every q by the same orthogonal matrix R: the dot remains (Rp)ᵀ(Rq)=pᵀq because RᵀR=I. A 90° rotation sends (x,y) to (−y,x). For p=(.4,−.2), q=(.5,.3), the rotated vectors (.2,.4) and (−.3,.5) still give −.06+.20=.14. Each vector's squared length also stays the same. Anonymous factor axes describe the algebra without inventing an identified genre interpretation. A zero vector has no direction to rotate."}</Prose>

<FactorRescaleFigure />

<Prose>{"An invertible change of coordinates can preserve the dot without preserving its penalty. Treat vectors as columns and set p′=A p, q′=A⁻ᵀq. Then p′ᵀq′=pᵀq. With A=diag(2,1) and p=q=(1,0), the new vectors are (2,0) and (.5,0). The dot stays 1, while their squared-norm sum changes from 2 to 4+.25=17/4. Orthogonal rotations preserve an isotropic L2 penalty; arbitrary invertible scalings generally do not. A singular A cannot supply the inverse action and must be reported as unavailable, not repaired with a hidden epsilon."}</Prose>

<Prose>{"The new factor-structure program checks actual score/matrix dimensions, ambiguous completions, rotations and changed penalties on small states. NumPy owns array operations; the loops and transformations define the mechanism. Fitting these vectors from sparse observations requires an objective and an update rule, which we now open one observed record at a time."}</Prose>

<H2>{"5. Learn factors one observed rating at a time"}</H2>

<Prose>{"For the selected observed pair, rating r=5 and score s=3.14 give error e=r−s=1.86. Increasing the score slightly reduces this positive residual. "}<strong>{"Gradient descent"}</strong>{" changes each parameter in the direction opposite the objective's partial derivative. The learning rate η controls how far it moves; knowing a derivative's sign does not guarantee that any chosen finite step reduces the objective."}</Prose>

<FactorUpdateFigure />

<Prose>{"Start with the local objective"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"\\ell=\\tfrac12 e^2+\n\\tfrac\\lambda2(\\|p\\|^2+\\|q\\|^2+b_u^2+b_i^2),\n\\qquad e=r-\\mu-b_u-b_i-p^Tq."}</MathBlock></div>

<Prose>{"The factor 1/2 makes the square's derivative simpler. The "}<strong>{"L2 penalty"}</strong>{" adds a cost for large squared parameter values; λ≥0 controls its strength. This local example holds μ fixed and penalizes the two entity biases. Chain rule gives ∂ℓ/∂p=−e q+λp and ∂ℓ/∂q=−e p+λq: changing p's coordinate changes the score by the matching q coordinate. The bias derivatives are −e+λbᵤ and −e+λbᵢ."}</Prose>

<Prose>{"Using λ=.1, the two p derivatives are −.89 and −.578; the q derivatives are −.694 and .402; the bias derivatives are −1.85 and −1.87. With η=.05, subtract η times each derivative to obtain p′=(.4445,−.1711), q′=(.5347,.2799), bᵤ′=.1925 and bᵢ′=−.0065. Every derivative reads the same "}<strong>{"old buffer"}</strong>{": q's update reads old p, and p's update reads old q. Updating p first and using that new value in q's derivative performs a different step. Copies in the code are part of the algorithm, not decorative bookkeeping."}</Prose>

<FactorTrajectoryFigure />

<Prose>{"The local objective is initially 1.7578 and becomes about 1.350450 after that step. The retained gradient program independently checks derivatives with central differences, then prints changed-step outcomes. η=.5 gives .330686 in this state, while η=1 gives 5.698610: the larger step increases the loss. A finite-difference calculation is a local derivative check, not a proof that training converges or generalizes. Repeated local steps need their actual current objective plotted on named step/loss axes. If a requested step leaves the supported finite range, report the first unavailable stage and last valid state instead of clipping it and claiming convergence."}</Prose>

<Prose>{""}<strong>{"Stochastic gradient descent"}</strong>{", or SGD, visits records and performs these local updates, often in shuffled order. Seeded nonzero initial factors break a special dead point: with p=q=0, the product's derivatives in both vectors are zero. Biases can still move, and a nonzero history branch later changes this case, but an all-zero pure dot model cannot invent a factor direction through that same first-order product gradient."}</Prose>

<Prose>{"The complete retained "}<code>{"explicitFit"}</code>{" program visits only observed records, uses old buffers for each local step, and recomputes a fixed-state training objective after every epoch. An "}<strong>{"epoch"}</strong>{" is one pass over the record list. Its rolling error uses parameters at different moments during that pass; it is not the error of the single final saved rule. At epoch 160 its recorded rolling RMSE is .191520, fixed-state training RMSE .186150 and objective 2.839368. No held-out score is computed by this mechanism demonstration. We retain that result and its complete program without treating training fit as new-data performance."}</Prose>

<H3>{"Deeper: how often was the penalty counted?"}</H3>

<PenaltyIncidenceFigure />

<Prose>{"Summing the displayed local objective once for each rating record charges pᵤ and bᵤ once for every record involving user u. If that user has nᵤ records, the global sum contains nᵤ λ‖pᵤ‖²/2. Likewise item i's factor and bias penalties are counted nᵢ times. The original complete SGD loop uses this per-record convention. Changing to a once-per-entity penalty changes the objective even if the variable is still called λ."}</Prose>

<Prose>{"To distribute one entity penalty over its nᵤ positive-incidence updates, use λ/nᵤ in each corresponding local update; the summed coefficients then equal λ. The same accounting applies to item parameters with nᵢ. For an entity with no records, there is no local event through which to distribute a prior: a positive once-entity quadratic penalty minimizes its otherwise unused vector at zero, whereas an unpenalized no-record vector is unconstrained. Sum versus mean loss also rescales the relative penalty. Match the complete objective before comparing solvers or a library's setting name."}</Prose>

<GaussianPriorFigure />

<Prose>{"A probabilistic model supplies another reason for that once-entity penalty. Suppose observed ratings are independent Gaussian outcomes around pᵤᵀqᵢ with noise variance σ², and each factor has an independent zero-mean isotropic Gaussian prior of variance τ². Ignoring constants independent of the factors, negative log posterior is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"\\frac{1}{2\\sigma^2}\\sum_{(u,i)\\in\\Omega}(r_{ui}-p_u^Tq_i)^2+\n\\frac{1}{2\\tau^2}(\\|P\\|_F^2+\\|Q\\|_F^2)."}</MathBlock></div>

<Prose>{"Multiplying by the positive σ² gives λ=σ²/τ² for the once-entity objective. The Frobenius norm ‖P‖²_F adds every squared factor entry once. More observation noise relative to the prior increases this ratio. σ² and τ² must be positive for these densities; zero is a degenerate limiting assumption, not an ordinary finite division. Bias/mean priors, when added, need their own declared terms. "}<a href={"https://papers.nips.cc/paper/2007/file/d7322ed717dedf1eb4e6e52a37ea7bcd-Paper.pdf"}>{"Probabilistic Matrix Factorization, §§1–2"}</a>{" derives this likelihood/prior route. Its "}<strong>{"maximum a posteriori (MAP)"}</strong>{" fit is a point estimate; it does not itself provide a posterior uncertainty interval around every missing score. Joint factor fitting remains nonconvex even though each fixed-side subproblem is much simpler."}</Prose>

<H3>{"Complete program: Check one simultaneous update"}</H3>

<Prose>{"The local loss and its finite difference use the same mean, biases, old factors and record penalty. Copying the old parameter vector makes every coordinate derivative describe one common state. Comparing several step sizes illustrates that a gradient direction does not make an arbitrary finite step safe."}</Prose>

<RecCanonicalProgram language="python" filename="gradient.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/gradient.py" decodedSHA256="55174d62f8e215a259eab3eff4041af1b29ed8c1fee367f59f8bd874e813c3e3" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/gradient.stdout.txt" download="gradient.stdout.txt">Download the complete recorded output for gradient.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"gradient: [-0.89, -0.578, -0.694, 0.402, -1.85, -1.87]\nnew state: [0.4445, -0.1711, 0.5347, 0.2799, 0.1925, -0.0065]\nlocal objective: 1.757800 -> 1.350450\nrate=0.05: objective=1.350450\nrate=0.5: objective=0.330686\nrate=1.0: objective=5.698610"}</CodeBlock>

<H3>{"Complete program: Train observed records and then measure one fixed state"}</H3>

<Prose>{"The observed coordinate list excludes missing pairs before the loop. Each record reads old vectors, updates both biases and factors, and contributes its degree-counted regularization. The rolling loss mixes states visited during the epoch; the later fixed training RMSE and complete objective recompute one saved state. Stable unseen-item ordering is a forward result, not held-out performance."}</Prose>

<RecCanonicalProgram language="python" filename="explicitFit.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/explicitFit.py" decodedSHA256="c0c8375c96ffc26b81b6a33daa2cf0a5279cd5674084eb319a157d6839fd422e" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/explicitFit.stdout.txt" download="explicitFit.stdout.txt">Download the complete recorded output for explicitFit.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"epoch=1: rolling=1.359578, fixed training=1.323825, objective=17.554161\nepoch=40: rolling=0.752409, fixed training=0.710386, objective=6.294669\nepoch=80: rolling=0.283893, fixed training=0.275043, objective=3.093511\nepoch=160: rolling=0.191520, fixed training=0.186150, objective=2.839368\nuser 0 unseen, descending: [(2, 4.356817), (6, 3.69603), (4, 2.488535)]\nNo held-out score was computed in this mechanism demonstration."}</CodeBlock>

<H2>{"6. Hold one side fixed and solve the other"}</H2>

<Prose>{""}<strong>{"Alternating least squares"}</strong>{", or ALS, holds the item factors fixed while solving user factors, then holds those users fixed while solving items. The two sides together are nonconvex, but a fixed-side squared-error problem is a quadratic. Its exact block minimum can replace a sequence of small SGD steps. This section first uses a separate biasless fixed-factor fixture; it does not silently reuse the biased local objective from section 5."}</Prose>

<FixedFactorBowlFigure />

<Prose>{"Take a single user coordinate p, fixed item factors 1 and 2, observed ratings 4 and 2, and once-entity penalty 1. The objective is (4−p)²+(2−2p)²+p²=20−16p+6p². Each residual square and the penalty contributes to the pictured bowl. Its derivative is −16+12p, so p=4/3 minimizes it. The three terms then total 64/9+4/9+16/9=28/3. At p=0 the same objective is 20. The numerical axis represents these actual p/loss coordinates."}</Prose>

<CoordinateMinimizerFigure />

<Prose>{"For several user coordinates, hold every coordinate except k fixed. Write the residual without coordinate k as rᵢ−Σ_{l≠k}p_l qᵢl. Expand the squared terms as a quadratic in p_k and set its derivative to zero:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"p_k=\\frac{\\sum_{i\\in\\Omega_u}q_{ik}\n\\left(r_{ui}-\\sum_{l\\ne k}p_lq_{il}\\right)}\n{\\sum_{i\\in\\Omega_u}q_{ik}^2+\\lambda}."}</MathBlock></div>

<Prose>{"The numerator aligns the selected coordinate's item values with residuals left by the others. The denominator supplies that coordinate's curvature plus its penalty. With λ=0 and every selected qᵢk zero, the denominator and numerator are zero: the objective is flat in that coordinate and does not select a unique value. Report nonuniqueness rather than dividing by zero or inserting a hidden regularizer. For a per-record objective, this block's penalty coefficient is λnᵤ instead of λ."}</Prose>

<ObservedBlockFigure />

<Prose>{"Solve all coordinates together by assembling the outer products. Each observed item vector qᵢ adds qᵢqᵢᵀ to a d×d matrix and rᵤᵢqᵢ to a d-vector. Add λI to the matrix, then solve the simultaneous linear equations:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"A=Q_{\\Omega_u}^TQ_{\\Omega_u}+\\lambda I,\\qquad\nb=Q_{\\Omega_u}^Tr_u,\\qquad Ap_u=b."}</MathBlock></div>

<Prose>{"I is the identity matrix: λ enters the diagonal. For a small independent example, q0=(1,0), q1=(1,1), ratings 4 and 2, λ=1 give A=[[3,1],[1,2]] and b=[6,2]. The equations 3p0+p1=6 and p0+2p1=2 yield p=(2,0); substitution gives residual Ap−b=(0,0). This example's objective is (4−2)²+(2−2)²+2²=8."}</Prose>

<Prose>{"For every nonzero vector z and λ>0, zᵀAz=Σᵢ(qᵢᵀz)²+λ‖z‖²>0. This is "}<strong>{"positive definiteness"}</strong>{": the quadratic has positive curvature in every direction and a unique block minimum. With no observations, A=λI and b=0, so p=0. At λ=0, insufficient independent observed directions can make A singular; a direct unique solve is unavailable. A declared pseudoinverse would choose among solutions by another convention."}</Prose>

<Prose>{"Use "}<code>{"solve(A,b)"}</code>{" rather than constructing an inverse to multiply by b. NumPy owns the numerical linear algebra kernel; the scratch implementation writes the observation selection, outer-product assembly, block order and objective accounting. A Cholesky factor expresses positive-definite A as L Lᵀ and solves two triangular systems. Poor conditioning can amplify rounding, so inspect the residual and use a tolerance with a stated scale rather than treating an unqualified approximate equality as exact arithmetic."}</Prose>

<Prose>{"For symmetric A, an "}<strong>{"eigenvector"}</strong>{" is a direction z with Az=κz; κ is its "}<strong>{"eigenvalue"}</strong>{". Along a unit-length such direction, the quadratic increase zᵀAz equals κ. Positive definiteness therefore requires every eigenvalue positive. A very small positive curvature relative to the largest one makes a solve sensitive to rounding. The block helper reports these eigenvalues and compares the smallest with a scale-dependent floating-point tolerance before calling the direct solver. A numerically unavailable result describes that finite-precision solve; it does not add a hidden penalty or assert that every exact positive-λ quadratic is mathematically singular."}</Prose>

<Prose>{"The complete retained "}<code>{"observedAls"}</code>{" program solves every user and then every item under its biasless once-entity objective, saving the full objective after each half-sweep. Its recorded first values are 227.378139, 206.009527, 50.961019 and 38.733608; the final value is 15.752924. Exact block minimization cannot increase that same full objective in exact arithmetic, but monotone training loss proves neither a global joint optimum nor better held-out performance. Initial factors and alternative local minima still matter."}</Prose>

<Prose>{"One observed user block costs roughly O(nᵤd²+d³) for assembly and a dense solve; its temporary matrix has d² entries. Sparse indexing, reusable Gram matrices and iterative solvers can change the workload and accuracy tradeoff. Next we change the objective itself: purchase counts teach a weak all-pair target and confidence, rather than an observed numerical rating."}</Prose>

<H3>{"Complete program: Check factor geometry, a coordinate solve and an exact block"}</H3>

<Prose>{""}<code>{"score"}</code>{" separates broadcast biases from latent products. "}<code>{"local_gradient"}</code>{", "}<code>{"central_difference"}</code>{" and "}<code>{"simultaneous_step"}</code>{" operate on one old state, while "}<code>{"degree_penalties"}</code>{" counts the record population. "}<code>{"quadratic_coordinate"}</code>{" opens the residual-with-one-coordinate-removed quotient. "}<code>{"observed_block"}</code>{" assembles the complete ridge system and reports its condition/residual before interpreting a solution. The construction compares score invariance under rotation/rescaling with norm-penalty invariance, and reports singular or flat cases explicitly rather than hiding them with epsilon."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-factor-structure.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-factor-structure.py" decodedSHA256="ad81d2edad1b93080a228078fd0c0ef04d5a6bb34d96e01f6842cee52a3c018d" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-factor-structure.stdout.txt" download="recommender-factor-structure.stdout.txt">Download the complete recorded output for recommender-factor-structure.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"rankOneCompletion\": [\n    [\n      1.0,\n      3.0\n    ],\n    [\n      0.3333333333333333,\n      1.0\n    ]\n  ],\n  \"determinant\": 0.0,\n  \"orthogonalDot\": 1.0,\n  \"orthogonalNormSum\": 2.0,\n  \"rescaledDot\": 1.0,\n  \"oldNormSum\": 2.0,\n  \"newNormSum\": 4.25,\n  \"changedGradient\": [\n    -0.347,\n    0.7250000000000001,\n    0.198,\n    0.616,\n    1.3,\n    1.31\n  ],\n  \"differenceInfinity\": 1.597296184208119e-10,\n  \"beforeLoss\": 0.8873000000000001,\n  \"afterLoss\": 0.5048380542293618,\n  \"degreeCounts\": {\n    \"userDegree\": [\n      4,\n      0\n    ],\n    \"itemDegree\": [\n      2,\n      2\n    ],\n    \"perRecordUserCoefficients\": [\n      0.8,\n      0.0\n    ],\n    \"onceEntityUserCoefficients\": [\n      0.2,\n      0.2\n    ]\n  },\n  \"MAPLambda\": 0.0625,\n  \"coordinate\": {\n    \"available\": true,\n    \"numerator\": 5.0,\n    \"curvature\": 3.0,\n    \"value\": 1.6666666666666667\n  },\n  \"directBlock\": {\n    \"available\": true,\n    \"A\": [\n      [\n        3.0,\n        1.0\n      ],\n      [\n        1.0,\n        2.0\n      ]\n    ],\n    \"b\": [\n      6.0,\n      2.0\n    ],\n    \"p\": [\n      2.0,\n      0.0\n    ],\n    \"scipyP\": [\n      2.0000000000000004,\n      -2.664535259100376e-16\n    ],\n    \"residualInfinity\": 0.0,\n    \"eigenvalues\": [\n      1.381966011250105,\n      3.618033988749895\n    ],\n    \"tolerance\": 2.5707677684393782e-14\n  },\n  \"unpenalizedEmpty\": {\n    \"available\": false,\n    \"reason\": \"singular or numerically non-SPD block\",\n    \"A\": [\n      [\n        0.0,\n        0.0\n      ],\n      [\n        0.0,\n        0.0\n      ]\n    ],\n    \"b\": [\n      0.0,\n      0.0\n    ],\n    \"eigenvalues\": [\n      0.0,\n      0.0\n    ],\n    \"tolerance\": 7.105427357601002e-15\n  },\n  \"flatCoordinate\": {\n    \"available\": false,\n    \"reason\": \"flat nonunique coordinate\"\n  }\n}"}</CodeBlock>

<Prose>{"The changed rescaling keeps dot 1 while changing the norm sum from 2 to 4.25. The local derivative agrees with a central difference to about 1.6e−10, and its declared step reduces this local loss from .8873 to about .504838. The direct block produces p=(2,0); the coordinate quotient and unavailable flat block retain their separate conditions. These are geometry and local-solve checks, not new held-out accuracy measurements."}</Prose>

<H3>{"Complete program: Alternate complete exact factor blocks"}</H3>

<Prose>{"For a user, select only observed item rows before assembling the normal system and right-hand side. Solve users with Q fixed, then items with the resulting P fixed. The once-entity positive ridge identifies an empty block at zero. The printed objective is evaluated after complete updates. "}<code>{"np.linalg.solve"}</code>{" owns the linear algebra kernel; the loop writes the masked factor algorithm."}</Prose>

<RecCanonicalProgram language="python" filename="observedAls.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/observedAls.py" decodedSHA256="bba58745fe28dccb4f4de3e4a452983151cb9daf12b77a593823286b1d168d86" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/observedAls.stdout.txt" download="observedAls.stdout.txt">Download the complete recorded output for observedAls.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"first four objective values: [227.378139, 206.009527, 50.961019, 38.733608]\nfinal objective: 15.752924\nuser 0 unseen scores: [4.688194, 2.421797, 3.592824]\nsame observations, different completions: [[1.0, 0.5], [2.0, 1.0]] [[1.0, 2.0], [0.5, 1.0]]"}</CodeBlock>

<H2>{"7. Turn implicit events into targets and confidence"}</H2>

<Prose>{"A purchase count describes repeated recorded events, not a numerical rating. One purchase and ten purchases can both indicate positive engagement while providing different amounts of evidence. "}<strong>{"Implicit feedback"}</strong>{" must declare how such records become targets and weights. The objective below deliberately uses weak zero targets for unobserved pairs; it does not claim those absences are known dislikes or impressions of an available item."}</Prose>

<ImplicitConfidenceFigure />

<Prose>{"Use a separate three-item fixture with counts n=[2,0,1], α=2 and item factors q0=(1,0), q1=(0,1), q2=(1,1). The positive indicator gives targets t=[1,0,1]. Multiply each count by α and add baseline 1 to get confidence c=[5,1,3]. Count zero still has confidence 1. Increasing α strengthens the observed events relative to the baseline; setting α=0 gives all confidences 1 while leaving the targets tied to whether a positive event exists."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"t_{ui}=\\mathbf1[n_{ui}>0],\\qquad c_{ui}=1+\\alpha n_{ui},\\qquad\nL=\\sum_{u,i}c_{ui}(t_{ui}-p_u^Tq_i)^2+\n\\lambda(\\|P\\|_F^2+\\|Q\\|_F^2)."}</MathBlock></div>

<Prose>{"Unlike explicit-rating SSE, this sum runs over every user–item pair. The confidence-weighted residual is a modeling construction. It is not a frequency estimate of an event probability, and the fitted dot score is unconstrained: negative values and values greater than 1 are possible."}</Prose>

<ImplicitGramFigure />

<Prose>{"Hold Q fixed and set λ=1. The user normal matrix receives each cᵢqᵢqᵢᵀ and λI; the right side receives cᵢtᵢqᵢ. In our fixture this gives A=[[9,3],[3,5]], b=[8,3]. Its determinant is 36. Solve the two equations to obtain p=(31/36,1/12); the three scores are 31/36,1/12,17/18."}</Prose>

<Prose>{"The same A can be built sparsely. Its "}<strong>{"Gram matrix"}</strong>{" QᵀQ is [[2,1],[1,2]], which already contributes baseline confidence 1 for all three items. Only the positive-count corrections remain: (5−1)q0q0ᵀ and (3−1)q2q2ᵀ. Add λI and recover [[9,3],[3,5]]. The right side is 5q0+3q2=[8,3]. Omitting the unobserved item's baseline curvature instead solves a different objective and gives p=(23/27,1/9). A sparse implementation must preserve that missing-pair term, rather than interpreting “not stored” as “not in the loss.”"}</Prose>

<ImplicitGeometryFigure />

<Prose>{"The fixed-Q objective is a quadratic in p. Its contours show how A couples the coordinates: an off-diagonal entry means changing one coordinate influences the other coordinate's derivative. A point p*+z increases this same objective by zᵀAz relative to the exact minimizer. Label contour levels, coordinates and current minimum on their actual numerical scale; a tilted ellipse is useful only when it belongs to the displayed A and objective. Positive λ ensures a unique fixed-side solution even with no positive history. For an empty history b=0 while QᵀQ+λI remains, so p=0 and every dot score is zero."}</Prose>

<ImplicitCostFigure />

<Prose>{"Compute QᵀQ once for a fixed item state. Each user's sparse positive history adds weighted outer products, then solves a d×d system. The dense Gram costs O(Id²); a user with nᵤ positive item cells needs O(nᵤd²+d³) for corrections and the direct solve. Store Q's Id values, the d² Gram/work matrix and sparse history. This reuses baseline curvature without constructing every confidence matrix as a dense I×I array. A repeated invoice occurrence changes its cell's count; it is not another item row or another independent user."}</Prose>

<Prose>{"The retained "}<code>{"implicitBlock"}</code>{" program compares dense all-pair assembly with these Gram corrections and prints both p and the omitted-missing-pair answer. The complete "}<code>{"implicitFit"}</code>{" program alternates all user and item solves under its once-entity objective. Its recorded full objective moves from 1365.048941 initially to 69.937084 after its first sweep and 25.213882 finally. Its unseen scores include negative values. That is consistent with unconstrained factors, not a failed probability normalizer or a held-out ranking result."}</Prose>

<H3>{"Deeper: an exact score decomposition"}</H3>

<ImplicitContributionFigure />

<Prose>{"For a selected item factor q*, solve A v=q* with the same current user's A. Since A is symmetric, q*ᵀp=q*ᵀA⁻¹b=vᵀb. Substitute the positive-history right side: the score is Σ_{i:nᵢ>0} cᵢ(qᵢᵀv). This is an inverse "}<strong>{"action"}</strong>{" obtained by a solve, not a reason to materialize a full inverse for each query."}</Prose>

<Prose>{"Select I2 in the three-item fixture. Its q*=(1,1) gives v=(1/18,1/6). The I0 history contribution is 5×1/18=5/18; I2 contributes 3×(1/18+1/6)=2/3. Their sum is 17/18, matching the direct dot. Selecting I1 instead gives contributions −5/12 and 1/2, totaling 1/12. Individual contributions can be negative even though all recorded events are positive. They explain this fitted computation under its fixed history and curvature; they do not identify why someone purchased or the causal effect of altering one event. "}<a href={"https://yifanhu.net/PUB/cf.pdf"}>{"Hu, Koren and Volinsky, §§4–5"}</a>{" develop the sparse solve and this decomposition."}</Prose>

<H3>{"The ordinary sparse package has its own signed encoding"}</H3>

<SignedConfidenceFigure />

<Prose>{"In implicit 0.7.3, positive stored CSR values represent confidence for target 1. A negative stored value represents target 0 with its absolute magnitude as confidence. Its "}<code>{"alpha"}</code>{" multiplies supplied data; it does not add the baseline 1. For our count-derived values 1+2n, use package alpha 1 to avoid multiplying confidence a second time. This signed package context is different from negative purchase counts, which the count model does not permit."}</Prose>

<Prose>{"An exact numeric zero in the editor means "}<strong>{"omit the CSR coordinate"}</strong>{". The baseline Gram then retains that pair's qᵢqᵢᵀ term. The normal-equation routine iterates physically stored entries and adds (|cᵢ|−1)qᵢqᵢᵀ. A physically stored zero would subtract that baseline term and change curvature. For q=1, λ=1, an absent entry gives A=2,b=0; a stored zero gives A=1,b=0. Both score zero in this particular state, but their storage and objectives are not equivalent. Stored −4 gives A=5,b=0; stored +4 gives A=5,b=4."}</Prose>

<Prose>{"The complete "}<code>{"signed_confidence_csr"}</code>{" function in the study file in §13 accepts one value per user–item coordinate. It omits zeros when constructing CSR, calls "}<code>{"sum_duplicates"}</code>{" on that representation, eliminates any stored zeros and checks that no zero remains before calling the package. This dense-coordinate input cannot express repeated coordinate records; a record-list encoder would need to reject duplicates unless a target-preserving aggregation were explicitly declared. Adding +4 and −4 without specifying what that cancellation means would silently change targets, so the ordinary one-value-per-item editor does not accept that ambiguity. Retail's later CSR uses only positive-count cells with confidence 1+2n; absent counts remain unstored baseline pairs. "}<a href={"https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/als.py"}>{"The versioned ALS source"}</a>{" defines the package's actual conversion and solve."}</Prose>

<H3>{"Use rated-item history as part of a user representation"}</H3>

<Prose>{"Confidence weighting changes loss terms. "}<strong>{"SVD++"}</strong>{" instead adds learned history vectors to a user's scoring representation. Let N(u) be the unique set of items the user rated in the permitted prefix. Each item has a history vector yⱼ in addition to its output vector qⱼ; the same ID does not make these parameter arrays interchangeable."}</Prose>

<HistoryRepresentationFigure />

<Prose>{"Take p=0, two history items with y0=(1,0), y1=(0,1), output q=(1,0) and μ=3, with zero biases. Add the histories to (1,1), divide by √2 and add p. The dot with q is 1/√2, so the score is 3+1/√2≈3.707107. The general rule is"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"h_u=p_u+|N(u)|^{-1/2}\\sum_{j\\in N(u)}y_j,\n\\qquad s_{ui}=\\mu+b_u+b_i+q_i^Th_u."}</MathBlock></div>

<Prose>{"For N(u) empty, define the history contribution as zero; do not divide by √0. Repeated rating records can repeat losses while a canonical unique history set includes their item only once. Confidence-weighted repeat counts are another rule. Surprise 1.1.5's SVD++ implementation instead iterates its occurrence list "}<code>{"trainset.ur[u]"}</code>{" and divides by the square root of that list's length. Duplicate triplets therefore repeat the history vectors and updates. Its forward agrees with the canonical set interpretation when those pairs are unique. A separate duplicate-only forward comparison makes the distinction visible without pretending that an ordinary duplicate fit was performed."}</Prose>

<HistoryGradientFigure />

<Prose>{"For one observed event, snapshot old h, p, q and every history y. Write e=r−s. The loss derivatives contribute −e q to p, −e h to q and −e q/√|N(u)| to each participating y; the two bias derivatives contribute −e. With target 5 in the worked state, e=2−1/√2. At η=.1 and λ=0, p′=(.1e,0), q′=(1+.1e/√2,.1e/√2), y0′=(1+.1e/√2,0), and y1′=(.1e/√2,1). All four updates use the same old q and h. Using the new q in a history update adds terms that belong to a different, sequential algorithm."}</Prose>

<Prose>{"The new scratch trainer declares a once-entity global penalty. Divide its user penalty by that user's event count nᵤ, its item penalty by nᵢ, and each history yⱼ penalty by tⱼ: the number of event updates whose user's history contains j. These incidence counts are different objects. The sum of distributed penalties then charges each active entity once. A zero-incidence parameter with a positive prior is set to its minimizing zero state; no division by zero is invented. Evaluate the full objective at each saved epoch's complete parameter state, separately from rolling event errors."}</Prose>

<Prose>{"The complete core program exposes history construction, counts, old-buffer gradients, training and query operations. Its library companion uses the declared eight unique rating pairs and reads Surprise's fitted p/q/y/bias arrays to recompute an ordinary forward. Local penalties and initialization differ, so different trained scores are not automatically a parity failure. A direct event update costs O(d|N(u)|); a straightforward epoch costs O(d Σ_events |N(user)|). Faster caching needs correct dependency/update accounting, not an unexplained claim that the history sum is free."}</Prose>

<H3>{"Learn item-to-item weights with a zero self route"}</H3>

<Prose>{""}<strong>{"EASE"}</strong>{" learns a full item-weight matrix B rather than a short factor vector. For binary user–item input X, row x produces score row xB. A zero diagonal prevents the model from reconstructing an observed item merely by copying that same input coordinate to itself."}</Prose>

<EaseReconstructionFigure />

<Prose>{"Take X=[[1,1,0],[0,1,1],[1,0,0]], λ=1, and first reconstruct the I2 target column y=[0,1,0]ᵀ. Prohibit its own input coefficient B₂₂=0 before solving. The remaining input columns form Z=[[1,1],[0,1],[1,0]], in order [I0,I1]. Let θ=(a,b)ᵀ be their two coefficients. Minimize J(θ)=‖y−Zθ‖²+λ‖θ‖². Here the first term sums the three users' squared reconstruction errors; the second penalizes the two allowed weights. Differentiating gives ∇J=2(ZᵀZ+λI)θ−2Zᵀy, so setting the gradient to zero yields [[3,1],[1,3]]θ=[0,1]ᵀ. The first row says 3a+b=0; the second says a+3b=1. Substitute a=−b/3 to get b=3/8 and a=−1/8."}</Prose>

<Prose>{"Insert the missing self coordinate as zero: B[:,2]=[−1/8,3/8,0]ᵀ. For user row [1,1,0], I0 contributes −1/8 and I1 contributes 3/8, so the I2 score is 1/4. The negative coefficient subtracts evidence; it is allowed. Crossing out an output score after an unconstrained fit would not solve this problem: the prohibited self input never entered Z. Repeating this excluded-column ridge solve for every target constructs B."}</Prose>

<Prose>{"We can compute the same constrained columns using one full Gram matrix. Write X_j for target column j of X, B_j for column j of B, and e_j for the item-length vector with a single 1 at position j and zeros elsewhere. Thus X_j=Xe_j and e_jᵀB_j selects the prohibited self coefficient. Set G=XᵀX+λI and solve GP=I; column P_j is the solution to GP_j=e_j. For this example, G=[[3,1,0],[1,3,1],[0,1,2]] and P=(1/13)[[5,−2,1],[−2,6,−3],[1,−3,8]]."}</Prose>

<Prose>{"To see why the shortcut imposes the same constraint, introduce an auxiliary number γ_j that balances the self-coordinate gradient. It is a constraint multiplier, not another parameter to tune. The augmented objective is L(B_j,γ_j)=‖X_j−XB_j‖²+λ‖B_j‖²+2γ_j(e_jᵀB_j). Differentiating with respect to γ_j enforces e_jᵀB_j=0; differentiating with respect to B_j gives 2GB_j−2XᵀX_j+2γ_j e_j=0. The factor 2 in the added term keeps γ_j's convention consistent with the unhalved squared loss. Hence GB_j=XᵀX_j−γ_j e_j=Ge_j−(λ+γ_j)e_j, and B_j=e_j−(λ+γ_j)P_j. Its self coordinate is 0=1−(λ+γ_j)P_jj, so λ+γ_j=1/P_jj. Therefore B_ij=−P_ij/P_jj for i≠j, with B_jj=0."}</Prose>

<Prose>{"Here B=[[0,1/3,−1/8],[2/5,0,3/8],[−1/5,1/2,0]], and [1,1,0]B=[2/5,1/3,1/4]. In the I2 column, P₂₂=8/13 gives −(1/13)/(8/13)=−1/8 and −(−3/13)/(8/13)=3/8, exactly the excluded solve. As a changed two-item case, X=[[1,1],[1,0]], λ=2 gives G=[[4,1],[1,3]], P=(1/11)[[3,−1],[−1,4]] and B=[[0,1/4],[1/3,0]]. Predicting I0 uses the remaining I1 column, whose squared norm is 1, hence coefficient 1/(1+2)=1/3. Predicting I1 uses I0's squared norm 2, hence 1/(2+2)=1/4. The asymmetry already follows from these different ridge denominators."}</Prose>

<Prose>{"P is symmetric, while its column-normalized B need not be. Signed item weights are allowed. With λ>0 and all-zero X, B is zero. At λ=0 a singular Gram cannot provide this unique solve; report that state instead of introducing a hidden ridge epsilon or pseudoinverse. Full B requires dense I² storage and roughly O(UI²+I³) work, so a closed-form solution is not a universal scalability or accuracy advantage. "}<a href={"https://arxiv.org/pdf/1905.03375"}>{"Steck's EASE paper, §§2–3"}</a>{" derives the constrained model. The complete new program checks it against an independent excluded-column ridge solve. Short factors, confidence-weighted targets, unique histories and full item weights share some linear algebra but define different representations and objectives. A pairwise ranking objective next asks a different question again: which of two items should come first?"}</Prose>

<H3>{"Complete program: Compare dense and Gram forms of the same user solve"}</H3>

<Prose>{"The dense route includes every item with its target and confidence. The sparse route starts from QᵀQ, adds only confidence-minus-one outer products and the ridge, and forms b only from positive targets. Augmented least squares is a separate representation of that quadratic. The deliberately omitted-missing route supplies a counterexample, not a second valid implementation of the same objective."}</Prose>

<RecCanonicalProgram language="python" filename="implicitBlock.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/implicitBlock.py" decodedSHA256="d3f9f2ba2b5fc4118ca885a49ae3f18e80e2b0312d76b254e3f1e89a601ec5f3" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/implicitBlock.stdout.txt" download="implicitBlock.stdout.txt">Download the complete recorded output for implicitBlock.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"normal: [[9.0, 3.0], [3.0, 5.0]] right: [8.0, 3.0]\nuser factors: [0.861111, 0.083333]\nall item scores: [0.861111, 0.083333, 0.944444]\nif missing terms are removed: [0.851852, 0.111111]\nempty-user factors: [0.0, 0.0]"}</CodeBlock>

<H3>{"Complete program: Alternate all-pair count-factor solves"}</H3>

<Prose>{"Each fixed-side Gram matrix is computed once and reused across that side’s entity blocks. Nonzero counts add sparse confidence corrections; the baseline includes all unstored pairs. Full objective values include both all-pair residuals and once-entity norms. The final unseen scores can be negative and do not acquire probability units from being sortable."}</Prose>

<RecCanonicalProgram language="python" filename="implicitFit.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/implicitFit.py" decodedSHA256="4c54b202dd8127533f6762c7ec65062ad4e1b8c9e0cd192d60f0836326adaebd" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/implicitFit.stdout.txt" download="implicitFit.stdout.txt">Download the complete recorded output for implicitFit.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"objective initially / after first sweep / finally: [1365.048941, 69.937084, 25.213882]\nunseen scores: [(2, -0.024653), (4, -0.113959), (6, 0.061573)]\nScores are unconstrained factor products, not calibrated probabilities."}</CodeBlock>

<H3>{"Complete program: Build and train a canonical unique-history factor rule"}</H3>

<Prose>{""}<code>{"event_structure"}</code>{" preserves rating occurrences and separately constructs unique history sets. "}<code>{"representation"}</code>{" sums their y rows with inverse-square-root normalization. The gradient differentiates through that actual sum, reading old p/q/y and biases. "}<code>{"event_step"}</code>{" distributes the once-entity penalty using derived participation counts, then "}<code>{"train"}</code>{" measures the full global objective at complete epoch states. The guarded local main checks changed arithmetic; the companion library program owns the declared ten-epoch fit comparison."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-history-core.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-history-core.py" decodedSHA256="52e56793be1648d7bee361482992e2192dea5ba1afc3e5eb38e3e265855a3bdc" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-history-core.stdout.txt" download="recommender-history-core.stdout.txt">Download the complete recorded output for recommender-history-core.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"oldHistoryContribution\": [\n    0.7071067811865475,\n    0.7071067811865475\n  ],\n  \"error\": 1.2928932188134525,\n  \"historyGradients\": [\n    [\n      -0.914213562373095,\n      0.0\n    ],\n    [\n      -0.914213562373095,\n      0.0\n    ]\n  ],\n  \"after\": {\n    \"P\": [\n      [\n        0.12928932188134526,\n        0.0\n      ]\n    ],\n    \"Q\": [\n      [\n        1.0914213562373094,\n        0.09142135623730951\n      ],\n      [\n        0.0,\n        1.0\n      ]\n    ],\n    \"Y\": [\n      [\n        1.0914213562373094,\n        0.0\n      ],\n      [\n        0.09142135623730951,\n        1.0\n      ]\n    ],\n    \"bu\": [\n      0.12928932188134526\n    ],\n    \"bi\": [\n      0.12928932188134526,\n      0.0\n    ]\n  },\n  \"historyFiniteDifferenceInfinity\": 7.561162806979382e-11,\n  \"canonicalUniqueRepresentation\": [\n    0.7071067811865475,\n    0.7071067811865475\n  ],\n  \"occurrenceRepeatedRepresentation\": [\n    1.1547005383792517,\n    0.5773502691896258\n  ]\n}"}</CodeBlock>

<Prose>{"Each old history row receives the same first-coordinate derivative −.914214 in this state. The selected q changes both coordinates because it reads the old combined history. The finite-difference discrepancy is about 7.6e−11. Repeating one item in an occurrence history changes both the sum and its square-root divisor; it is a different representation from a unique set."}</Prose>

<H3>{"Complete program: Solve constrained item columns by two routes"}</H3>

<Prose>{""}<code>{"constrained_item_weights"}</code>{" forms XᵀX+λI, solves for its inverse action and normalizes each off-diagonal column by its own diagonal. "}<code>{"excluded_column_solution"}</code>{" instead removes the target input column and solves ordinary ridge for that target. These routes agree on predictions while making the zero self-route explicit. "}<code>{"score_history"}</code>{" keeps binary history typed. Zero/duplicate columns and a singular λ=0 system are explicit; no hidden pseudoinverse changes the requested rule."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-ease-contracts.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-ease-contracts.py" decodedSHA256="680eda2ef63a9b356897aa9f1368fdf6d9e3bb6ceb0304f1e3fbee6d07ef6a46" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-ease-contracts.stdout.txt" download="recommender-ease-contracts.stdout.txt">Download the complete recorded output for recommender-ease-contracts.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"selectedHistory\": [\n    1.0,\n    1.0,\n    0.0\n  ],\n  \"selectedScores\": [\n    0.4000000000000001,\n    0.3333333333333333,\n    0.25\n  ],\n  \"independentColumnDifferenceInfinity\": 1.1102230246251565e-16,\n  \"asymmetryInfinity\": 0.125,\n  \"zeroPenaltySingular\": {\n    \"available\": false,\n    \"reason\": \"singular or numerically non-SPD full Gram\",\n    \"G\": [\n      [\n        1.0,\n        1.0\n      ],\n      [\n        1.0,\n        1.0\n      ]\n    ],\n    \"eigenvalues\": [\n      0.0,\n      2.0\n    ],\n    \"tolerance\": 1.4210854715202004e-14\n  }\n}"}</CodeBlock>

<Prose>{"The row scores 2/5, 1/3 and 1/4. The excluded-column solve agrees to about 1.1e−16, while B differs from its transpose by .125: a symmetric Gram does not require symmetric column-normalized prediction weights. The singular zero-penalty state supplies no unique inverse action."}</Prose>

<H2>{"8. Learn which of two items should come first"}</H2>

<Prose>{"A rating objective asks for a numerical target; a confidence objective asks for a weighted all-pair fit. "}<strong>{"Bayesian Personalized Ranking"}</strong>{", or BPR, starts with comparisons: for user u, a positively observed item i should score above an unobserved comparison item j. The absence of j is an assumption used to build training comparisons, not a discovered dislike. Its eligibility and the sampling distribution matter as much as the scalar loss."}</Prose>

<PairGapFigure />

<Prose>{"Compute the two scores and subtract. With p=(1,.5), qᵢ=(.5,1), qⱼ=(1,0), both dots are 1, giving gap Δ=0. A sigmoid σ(Δ)=1/(1+exp(−Δ)) supplies the model's pairwise ordering likelihood. Negative log likelihood is −log σ(Δ)=log(1+exp(−Δ)). At gaps −2,0,2 this loss is approximately 2.126928,.693147,.126928. A larger positive gap incurs less loss; the pairwise sigmoid is not a calibrated probability that an item will be purchased."}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"\\Delta=p_u^T(q_i-q_j),\\qquad\n\\ell=\\operatorname{logaddexp}(0,-\\Delta)+\n\\tfrac\\lambda2(\\|p_u\\|^2+\\|q_i\\|^2+\\|q_j\\|^2)."}</MathBlock></div>

<Prose>{""}<code>{"logaddexp"}</code>{" computes the logarithm of a sum of exponentials stably. Equivalently, the first term is max(0,−Δ)+log(1+exp(−|Δ|)), whose exponential never receives a large positive argument. Directly evaluating exp(−Δ) can overflow for a large negative gap even when the loss itself is representable. This local penalty uses the three participating vectors. If the score also has μ and a user bias, those matching addends cancel between i and j. Item biases do not: their difference must remain in the gap if that model includes them."}</Prose>

<PairGradientFigure />

<Prose>{"Let g=σ(−Δ). The loss derivative with respect to the gap is −g. Its three parameter derivatives are −g(qᵢ−qⱼ)+λp, −gp+λqᵢ and +gp+λqⱼ. Thus the positive item's data term moves toward old p, and the negative item's moves away. For the worked Δ=0, g=.5. With λ=.1, η=.1, the simultaneous new vectors are p′=(.965,.545), qᵢ′=(.545,1.015), qⱼ′=(.94,−.025). Their new gap is .185625. Every derivative uses the old three vectors and old gap. A larger step can raise the local regularized loss; zero p/q vectors can again leave the pure dot data gradients stuck."}</Prose>

<Prose>{"The complete retained "}<code>{"bpr"}</code>{" program checks the derivatives and repeats this one selected comparison for six printed states. That is a useful local trace, but it is not a complete recommender trainer over all users and items. A full trainer must define which valid triples exist, how they are sampled, what objective the sampling represents and how later lists will be assessed."}</Prose>

<PairPopulationFigure />

<Prose>{"Take the separate positive-pair matrix [[1,0,1,0],[0,1,0,0],[1,1,0,0]]. U0 has positives I0/I2 and unobserved eligible items I1/I3, giving four triples. U1 has positive I1 and three possible comparisons, giving three triples. U2 has positives I0/I1 and comparisons I2/I3, giving four. There are eleven valid unique triples in all. Uniform sampling from these eleven gives user weights 4/11,3/11,4/11. Uniformly choosing an eligible user first gives weights 1/3 each, then divides their share among their valid comparisons. These optimize differently weighted empirical populations."}</Prose>

<Prose>{"The new complete scratch trainer enumerates admissible triples for this small fixture, seeds its generator, performs the declared 200 updates, and records the actual sampled IDs/counts and fixed-state objective. Its reported full objective is the mean of the local regularized losses over the declared valid triple population. Under uniform-triple sampling its stochastic data and local penalty gradients correspond to that mean. Changing to uniform-user sampling changes the expected population, including how often each participating parameter receives a local penalty; do not relabel it the same once-entity Gaussian-prior objective. Optional repeated positive occurrences define another explicitly weighted source population rather than being silently deduplicated."}</Prose>

<Prose>{"The optional "}<code>{"positive_occurrences"}</code>{" input makes the weighting concrete. Each record has a unique occurrence ID plus user and positive-item IDs; two records may name the same positive pair. The binary matrix still defines the complete positive history, so hiding an observed item through eligibility cannot turn it into an unobserved negative. "}<code>{"eligible_items"}</code>{" declares either a catalogue vector or a per-user mask and applies to both compared items."}</Prose>

<Prose>{"In the eleven-triple fixture, add a second occurrence of U0/I0 with its own ID. It supplies two more routes, to I1 and I3. The population now has thirteen occurrence–negative pairs and uniform-pair user masses 6/13, 3/13 and 4/13. Uniform eligible-user sampling instead keeps each user at 1/3. If I3 is ineligible for everyone, seven of those thirteen occurrence routes remain. The source exposes both the numeric triple and its positive-occurrence ID; the two equal numeric U0/I0 routes are not silently merged. These are population calculations; no extra fitted outcome is attached to this variation."}</Prose>

<Prose>{"A user who observed every eligible item has no admissible j and contributes no valid triple. If none exists anywhere, the trainer is unavailable rather than looping forever to sample an impossible negative. Enumerating all pairs costs O(U I²) in the worst case and suits the small teaching fixture. A larger sampler can choose from valid lists without enumerating every triple, but must expose its conditioning weights and support. Popularity-weighted or hard-negative sampling changes that support and objective; it is not automatically a better approximation to uniform comparisons or to NDCG."}</Prose>

<Prose>{"The ordinary implicit 0.7.3 BPR companion uses the same binary CSR but a different sampler. It draws stored positive indices, so its negative-item distribution is the global frequency [2,2,1,0]/5. I3 has zero negative support even though it is an eligible comparison in the scratch population. A drawn item already known to that user is skipped, without guaranteed replacement. Forty epochs on five nonzeros attempt 200 updates, with fewer accepted updates when such skips occur. The implementation ignores nonzero magnitudes and includes an additional learned item-bias coordinate with the corresponding user coordinate fixed at 1. Its callback's sampled training statistic is not held-out full-catalogue AUC. These contracts explain why equal parameter names or an equal attempted-update count do not promise matching fits. "}<a href={"https://arxiv.org/pdf/1205.2618"}>{"Rendle et al., §§3–4"}</a>{" derive BPR; "}<a href={"https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/bpr.pyx"}>{"the versioned package implementation"}</a>{" defines this ordinary route. Evaluate the resulting list under its actual eligibility boundary, not merely its training gap."}</Prose>

<H3>{"Complete program: Open one sampled pair update"}</H3>

<Prose>{"The stable softplus loss reads the user, positive and sampled item together. Finite differences verify derivative signs; the update keeps old values until all three new vectors are available. Repetition of this one pair demonstrates its local gap/loss change. The next program supplies the missing complete triple population and sampler."}</Prose>

<RecCanonicalProgram language="python" filename="bpr.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/bpr.py" decodedSHA256="fd225043d53b02096a294a57fa79c1f6d2ca456dba0ac87636417e3a42761191" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/bpr.stdout.txt" download="bpr.stdout.txt">Download the complete recorded output for bpr.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"step=0: gap=0.000000, local loss=0.868147\nstep=1: gap=0.185625, local loss=0.776622\nstep=2: gap=0.348631, local loss=0.704560\nstep=3: gap=0.494534, local loss=0.646533\nstep=4: gap=0.626967, local loss=0.598992\nstep=5: gap=0.748388, local loss=0.559519"}</CodeBlock>

<H3>{"Complete program: Train a complete declared pair population"}</H3>

<Prose>{""}<code>{"valid_triples"}</code>{" enumerates the unique-pair default. "}<code>{"occurrence_population"}</code>{" retains repeated positive record IDs and filters both items through the declared eligibility before forming comparisons. "}<code>{"sampler_distribution"}</code>{" distinguishes uniform triples from uniform eligible users or an explicitly counted occurrence population. "}<code>{"old_buffer_step"}</code>{" applies the stable local gradient; "}<code>{"train"}</code>{" uses the seeded samples and evaluates the complete declared objective. The ordinary BPR fit uses a global-frequency negative draw and a learned item-bias coordinate; its accepted/skipped attempt statistics and zero-frequency item support explain why this is a correspondence comparison rather than numerical equality."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-bpr-training.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-bpr-training.py" decodedSHA256="2e30f9a107c138d8924d871d91bfa3d60f5854b23cab2c380a3c3144d6b4a91b" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-bpr-training.stdout.txt" download="recommender-bpr-training.stdout.txt">Download the complete recorded output for recommender-bpr-training.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"triples\": [\n    [\n      0,\n      0,\n      1\n    ],\n    [\n      0,\n      0,\n      3\n    ],\n    [\n      0,\n      2,\n      1\n    ],\n    [\n      0,\n      2,\n      3\n    ],\n    [\n      1,\n      1,\n      0\n    ],\n    [\n      1,\n      1,\n      2\n    ],\n    [\n      1,\n      1,\n      3\n    ],\n    [\n      2,\n      0,\n      2\n    ],\n    [\n      2,\n      0,\n      3\n    ],\n    [\n      2,\n      1,\n      2\n    ],\n    [\n      2,\n      1,\n      3\n    ]\n  ],\n  \"sampleCounts\": [\n    14,\n    14,\n    27,\n    21,\n    12,\n    22,\n    27,\n    18,\n    14,\n    12,\n    19\n  ],\n  \"firstPopulationObjective\": 0.6943267592154573,\n  \"lastPopulationObjective\": 0.6100870819939309,\n  \"finalGaps\": [\n    0.08420989404310025,\n    0.07037677150510291,\n    0.09602739144039685,\n    0.08219426890239954,\n    0.10128167594462627,\n    0.2546769741460056,\n    0.29305090680455376,\n    0.17046676760342588,\n    0.2582913442573955,\n    0.2424793094149493,\n    0.330303886068919\n  ],\n  \"ordinaryNegativeItemProbabilities\": [\n    0.4,\n    0.4,\n    0.2,\n    0.0\n  ],\n  \"ordinaryTotalAttempts\": 200,\n  \"ordinaryTotalAccepted\": 77,\n  \"ordinaryTotalSkipped\": 123,\n  \"stableExtremeLosses\": [\n    1000.0,\n    0.6931471805599453,\n    0.0\n  ]\n}"}</CodeBlock>

<Prose>{"The scratch mean population objective moves from about .694327 to .610087 after 200 updates. All eleven final training gaps are positive in this run; that does not supply held-out list performance. The ordinary trainer accepts 77 of its 200 attempts and skips 123, and I3 has zero negative-draw support. Its extra learned item bias and sampler make its fit a different computation. The extreme losses remain finite even at gaps −1000 and +1000."}</Prose>

<H2>{"9. Evaluate the whole recommendation list"}</H2>

<Prose>{"A score becomes a decision only after eligibility, ranking and a requested number of slots are specified. A ranker cannot recover an item the candidate generator omitted. Define which future positive events or reviewed grades count as truth before selecting settings; an unobserved candidate is not necessarily a verified irrelevant item."}</Prose>

<SlateConstructionFigure />

<Prose>{"Take the ranked unique item list [I2,I0,I4,I1,I3], binary relevant truth {I0,I1}, and requested cutoff K=3. Its issued list is [I2,I0,I4]. Only I0 is a hit, at rank 2. Filter hard ineligibility before top K, retaining item IDs through each operation. A duplicate ID would not be another independent hit or another slot's useful discovery, so reject duplicates and out-of-universe IDs instead of correcting their counts afterward."}</Prose>

<RankingMetricsFigure />

<Prose>{""}<strong>{"Precision@K"}</strong>{" is hits divided by requested slots: 1/3. "}<strong>{"Recall@K"}</strong>{" is hits divided by eligible relevant truth: 1/2. "}<strong>{"Reciprocal rank"}</strong>{" uses the first hit's one-based position: 1/2. "}<strong>{"Average precision@K"}</strong>{" adds precision at each hit position and divides by min(K,R), where R is eligible relevant count. Here the only hit contributes 1/2 and the denominator is 2, giving AP=.25. These are declared cutoff/denominator conventions; some libraries use different AP or no-relevance rules."}</Prose>

<Prose>{"For graded truth gᵢ, "}<strong>{"discounted cumulative gain"}</strong>{" gives an item gain 2^{gᵢ}−1 and divides it by log₂(rank+1). The first slot has divisor 1, the second log₂3. The worked binary list has DCG=1/log₂3. Its ideal eligible list puts both relevant items first, with ideal gain 1+1/log₂3. "}<strong>{"NDCG"}</strong>{" is their ratio, approximately .386853. The ideal belongs to the entire eligible truth, not only the candidates retrieved by a faulty earlier stage."}</Prose>

<Prose>{"If the issued list has fewer than K items, fixed-slot precision still divides by K; "}<strong>{"fill rate"}</strong>{" is issued count/K. With no eligible relevant truth, recall, AP, RR and NDCG are undefined under our convention. Precision and fill still describe the issued slots. Do not convert an undefined relevance metric into a fabricated zero observation. The complete retained "}<code>{"ranking"}</code>{" program handles these cases, a graded example and a candidate subset with explicit unique-ID checks and full expected output."}</Prose>

<CandidateCeilingFigure />

<Prose>{"Now remove I0 before ranking while leaving truth {I0,I1}. Even a perfect remaining ranker can retrieve at most one of the two relevant items. Its recall ceiling is min(K, retrieved relevant count)/R=1/2 for K≥1. That ceiling is a property of the declared candidate set and truth, not a guarantee of achieving it. If no eligible truth exists, the ceiling is undefined. Including all known positives and sampling only a few other candidates creates an easier, different assessment distribution; the missing exposure/relevance of those sampled “negatives” is not repaired by their label in a benchmark script."}</Prose>

<H3>{"Compare requests and uncertainty using the right unit"}</H3>

<PairedRequestFigure />

<Prose>{"Suppose four user requests have paired method-minus-baseline metric differences [.2,−.1,.3,0]. Their mean difference is .1. If a bootstrap sample takes user rows [U0,U0,U2,U3], the resampled mean is (.2+.2+.3+0)/4=.175. Repeat the entire paired row, so both methods remain attached to that user's same truth and request. Treating individual recommended items as independent evidence would change the data unit and usually understate dependence."}</Prose>

<Prose>{"Report metric support and aggregation separately. An average over requests with eligible truth does not cover all requests; a catalogue-coverage count does not become recall; RMSE on observed ratings does not rank a list. Novelty, diversity and cost can matter, but require their own definitions and evidence. The real-data report later uses a declared paired-user bootstrap on fixed saved per-user outcomes, without refitting models. Its intervals remain conditional on that train-selected cohort, period and workflow, and do not erase temporal or intercustomer dependence. With no valid paired rows, no mean difference or interval can be estimated."}</Prose>

<Prose>{"Predict how changing a list, K, truth grade or candidate set changes each denominator before computing. These definitions make ordinary library scores and saved model states meaningful only when their input identities and output conventions match the problem we actually asked."}</Prose>

<H3>{"Complete program: Keep the candidate population and ideal denominator visible"}</H3>

<Prose>{"Validate unique item IDs, filter eligibility and retain the declared truth before taking the first K results. Cumulative hit precision contributes to AP, and logarithmic discounts contribute to DCG. The ideal and candidate ceiling depend on eligible truth, not only the retrieved hits. Zero qualifying truth returns undefined relevance metrics while precision and fill remain defined for positive K."}</Prose>

<RecCanonicalProgram language="python" filename="ranking.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/ranking.py" decodedSHA256="70749e1294269afc1f5b1009aa3149c62fde256fa3984b68da459f8888905dd1" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/ranking.stdout.txt" download="ranking.stdout.txt">Download the complete recorded output for ranking.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"order [2, 0, 4, 1, 3] K 3 {'precision': 0.333333, 'recall': 0.5, 'ndcg': 0.386853, 'reciprocal_rank': 0.5, 'average_precision': 0.25, 'fill_rate': 1.0, 'candidate_recall_ceiling': 1.0}\norder [2, 0, 4] K 3 {'precision': 0.333333, 'recall': 0.5, 'ndcg': 0.386853, 'reciprocal_rank': 0.5, 'average_precision': 0.25, 'fill_rate': 1.0, 'candidate_recall_ceiling': 0.5}\norder [0, 1] K 3 {'precision': 0.0, 'recall': None, 'ndcg': None, 'reciprocal_rank': None, 'average_precision': None, 'fill_rate': 0.666667, 'candidate_recall_ceiling': None}\norder [2, 0, 1] K 2 {'precision': 1.0, 'recall': 0.666667, 'ndcg': 1.0, 'reciprocal_rank': 1.0, 'average_precision': 1.0, 'fill_rate': 1.0, 'candidate_recall_ceiling': 0.666667}"}</CodeBlock>

<H2>{"10. Use current libraries without changing the problem accidentally"}</H2>

<Prose>{"An ordinary tool implements a model, not the meaning of your data. Name raw identities, matrix axes, target units, penalty and query convention before a fit. Retain a complete program's imports and dependencies rather than treating the visible "}<code>{"fit"}</code>{" call as a self-contained algorithm."}</Prose>

<ExplicitLibraryIdentityFigure />

<Prose>{"Surprise accepts explicit-rating triplets (raw user ID, raw item ID, rating), with a declared rating range. Its training set creates internal ID maps. The string \"0\" is a raw identity, not automatically the same object as an internal row index 0. Map the requested identity before selecting the saved p/q/bias rows. For a known biased SVD pair, its raw score is μ+bᵤ+bᵢ+pᵤᵀqᵢ. A default prediction may clip to the declared rating scale; use "}<code>{"clip=False"}</code>{" when inspecting that raw formula, and state clipping when evaluating a clipped rule."}</Prose>

<Prose>{"For an unknown user and known item, the ordinary biased route retains μ and the known item bias but lacks a user bias/factor. Both unknown returns the training mean. This is a fallback convention, not learned personalization for an unseen identity. The retained "}<code>{"surpriseLibrary"}</code>{" program fits the original explicit matrix under Surprise 1.1.5 and prints these actual raw-ID cases, including both-unknown mean 3.1. Its local penalties and initialization are not claimed identical to the earlier scratch trainer, and its full-matrix fitting is API inspection rather than held-out performance."}</Prose>

<Prose>{"The new SVD++ library companion additionally exposes actual fitted p/q/y arrays, biases and identity maps. Its eight-pair fixture has mean 3 and a history contribution; its forward must use that h rather than quietly applying the old pure-SVD formula. Saved states and raw-ID queries belong to their named model and fixture. The older program's recorded outputs remain observations of that older fit, not numbers recomputed from the new history model."}</Prose>

<ImplicitLibraryStateFigure />

<Prose>{"For implicit ALS, the matrix is users×items. A CSR row has an "}<code>{"indptr"}</code>{" slice, item-column "}<code>{"indices"}</code>{" and confidence "}<code>{"data"}</code>{" at those indices. These are storage coordinates, not raw item names. Supply positive data already equal to 1+αcount and package alpha 1 under our declared convention. An accidental transpose swaps entity roles even if a small square fixture hides the shape mistake. Filter already liked items according to the task and request, rather than assuming an API's default filter is appropriate for repeat recommendations."}</Prose>

<Prose>{"The final item update in a user-then-item training sweep changes Q after it solved P. "}<strong>{"Stored training P"}</strong>{" therefore contains users solved against the previous Q. For a current request, "}<strong>{"recalculated user factors"}</strong>{" solve the known history against final Q. They are a separate inference object, not a new training sweep and not a replacement for the stored training record."}</Prose>

<Prose>{"See the difference in a constructed two-coordinate witness. Confidence is [3,1,1], target [1,0,0], λ=1. Old item rows [(1,0),(1,0),(0,1)] give stored p=(.6,0). Final rows [(0,1),(0,1),(1,0)] instead give request p=(0,.6). Using stored p with final Q scores eligible I1/I2 as [0,.6]; solving against final Q scores them [.6,0]. The ordering reverses. Both calculations are well-defined, but they are different rules. A query must preserve the convention used by its validation and later assessment."}</Prose>

<Prose>{"The complete retained "}<code>{"implicitLibrary"}</code>{" program calls "}<code>{"recalculate_user"}</code>{", compares it with the declared dense normal equations and requests filtered recommendations with recalculation enabled. Its recorded unseen scores are I4:1.069473, I6:.255863, I2:.151264—again not probability values. Its shape is five user rows by three factors and seven item rows by three factors. Later Retail state has different identities/shapes and its own measured arrays. The new real-data method consistently uses final-Q fixed-history recalculation for all four validation fits, the chosen prefix refit, ordinary comparison and saved request. The training P/Q/objective records remain separate."}</Prose>

<Prose>{"The ordinary source version fixes these behaviors. "}<a href={"https://surprise.readthedocs.io/en/stable/matrix_factorization.html"}>{"Surprise 1.1.5's matrix-factorization contracts"}</a>{" and "}<a href={"https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/als.py"}>{"implicit 0.7.3's ALS implementation"}</a>{" support the routes explained here; a future package version may change details. Save complete learned state, mappings, source/configuration and package version, not a filename saying “MF” with no way to identify its actual rule."}</Prose>

<H3>{"Complete program: Use the library’s explicit-rating rule deliberately"}</H3>

<Prose>{"Raw triplets enter "}<code>{"Dataset"}</code>{" and become inner user/item IDs in its trainset. The configured SVD model learns a biased rating score using its own initialization and record penalties. "}<code>{"predict(..., clip=False)"}</code>{" exposes the raw model score; default clipping is a separate output rule. Unknown identities invoke the library’s declared fallback rather than a fabricated learned row."}</Prose>

<RecCanonicalProgram language="python" filename="surpriseLibrary.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/surpriseLibrary.py" decodedSHA256="219b7e40674976fb45f1e4de72743f8251dbe78bc0a678e970e80e3961394f50" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/surpriseLibrary.stdout.txt" download="surpriseLibrary.stdout.txt">Download the complete recorded output for surpriseLibrary.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"Surprise version: 1.1.5\nuser 0, item 2: 4.381337\nuser 0, item 4: 2.511042\nuser 0, item 6: 3.705655\nunknown user, known item 0: 3.240102\nboth unknown: 3.100000\nThis fits the full toy matrix for API inspection; it is not a test evaluation."}</CodeBlock>

<H3>{"Complete program: Compare a complete history trainer with SVD++"}</H3>

<Prose>{""}<code>{"load_core"}</code>{" loads the local dependency without running its main. The eight unique rating pairs are passed once through the scratch ten-epoch trainer and once through the configured Surprise SVDpp fit. "}<code>{"ordinary_forward"}</code>{" reconstructs the library’s score from its actual raw-to-inner IDs, biases, pu/qi and occurrence-list yj history. Unknown identities and a duplicate-only forward expose the boundary. Different initialization and penalties mean different fitted scores are expected; equal shapes alone are not parity."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-history-library.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-history-library.py" decodedSHA256="bb152a7ca06f8dc39a81ba9dd12f42305a2144649e97e43b88951fd20bdec343" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-history-library.stdout.txt" download="recommender-history-library.stdout.txt">Download the complete recorded output for recommender-history-library.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"scratchGlobalObjectives\": [\n    6.058689384016131,\n    5.984756750115176,\n    5.918637451961229,\n    5.8602720605903915,\n    5.814226863215741,\n    5.773520135035808,\n    5.738704127743214,\n    5.707150421041626,\n    5.6791152302352925,\n    5.654655874192119,\n    5.630210057105193\n  ],\n  \"scratchU0Scores\": [\n    3.001117459952231,\n    3.217397134690264,\n    2.7844441706070873,\n    3.003550131021897\n  ],\n  \"ordinaryU0Scores\": [\n    2.9903677624800866,\n    3.1806435739628696,\n    2.8146667458180405,\n    2.9889531159451708\n  ],\n  \"maximumOrdinaryForwardDifference\": 0.0,\n  \"unknownForwards\": [\n    {\n      \"rawUser\": \"new-user\",\n      \"rawItem\": \"I0\",\n      \"innerUser\": null,\n      \"innerItem\": 0,\n      \"historyOccurrences\": [],\n      \"historyVector\": [\n        0.0,\n        0.0\n      ],\n      \"manual\": 2.9846011431884887,\n      \"ordinary\": 2.9846011431884887,\n      \"absoluteDifference\": 0.0,\n      \"details\": {\n        \"was_impossible\": false\n      }\n    },\n    {\n      \"rawUser\": \"U0\",\n      \"rawItem\": \"new-item\",\n      \"innerUser\": 0,\n      \"innerItem\": null,\n      \"historyOccurrences\": [\n        0,\n        1,\n        2\n      ],\n      \"historyVector\": [\n        -0.128201911084635,\n        -0.0239171509048234\n      ],\n      \"manual\": 2.994078056952768,\n      \"ordinary\": 2.994078056952768,\n      \"absoluteDifference\": 0.0,\n      \"details\": {\n        \"was_impossible\": false\n      }\n    },\n    {\n      \"rawUser\": \"new-user\",\n      \"rawItem\": \"new-item\",\n      \"innerUser\": null,\n      \"innerItem\": null,\n      \"historyOccurrences\": [],\n      \"historyVector\": [\n        0.0,\n        0.0\n      ],\n      \"manual\": 3.0,\n      \"ordinary\": 3.0,\n      \"absoluteDifference\": 0.0,\n      \"details\": {\n        \"was_impossible\": false\n      }\n    }\n  ],\n  \"duplicateOnlyForward\": {\n    \"history\": [\n      0,\n      1,\n      2\n    ],\n    \"duplicateHistory\": [\n      0,\n      1,\n      2,\n      0\n    ],\n    \"uniqueVector\": [\n      -0.128201911084635,\n      -0.0239171509048234\n    ],\n    \"occurrenceVector\": [\n      -0.136799902503695,\n      -0.08278196578303731\n    ],\n    \"additionalFits\": 0\n  }\n}"}</CodeBlock>

<Prose>{"The scratch full objective is about 6.058689 initially and 5.630210 after ten epochs. The ordinary and scratch score rows differ because their initial states and penalty accounting differ. Every reconstructed ordinary forward agrees exactly with its own package prediction, including unknown-user/item fallbacks. The repeated-history calculation changes the saved history vector without performing an additional fit."}</Prose>

<H3>{"Complete program: Keep CSR confidence, filtering and recalculation separate"}</H3>

<Prose>{"Construct user×item CSR with positive entries already containing confidence, and leave alpha=1 to avoid multiplication twice. Fitting owns a training P/Q; "}<code>{"recalculate_user"}</code>{" solves a fresh user against current Q. Filtering already-liked items is a candidate operation after scores exist. The complete output includes both the stored/recalculated distinction and an unbounded score."}</Prose>

<RecCanonicalProgram language="python" filename="implicitLibrary.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/implicitLibrary.py" decodedSHA256="24419618e82a01e1bc4c660c0c8d4a2fe9b32065972c36553e8b7003f3d3f61e" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/implicitLibrary.stdout.txt" download="implicitLibrary.stdout.txt">Download the complete recorded output for implicitLibrary.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"implicit version: 0.7.3\nuser factors, item factors: (5, 3) (7, 3)\nunseen recommendations: [(4, 1.069473), (6, 0.255863), (2, 0.151264)]\nrecalculated user matches the declared dense confidence objective: True"}</CodeBlock>

<H2>{"11. Handle new items and connect scores to a serving system"}</H2>

<Prose>{"An unseen item lacks a learned q row. An unseen user lacks a learned p row. They are different missing objects. Item metadata can help infer a new q, while a new user's score still needs permitted history, user features or an explicit baseline. Copying an unrelated known user's vector does not solve cold start."}</Prose>

<ColdItemProjectionFigure />

<Prose>{"In a separate synthetic metadata fixture, let X have one row per training item and one column per known feature. The corresponding learned item factors form Q. Ridge regression fits W so XW approximates Q: solve (XᵀX+λI)W=XᵀQ, with shape feature-count×factor-count. A new item's feature row x_new gives q_new=x_new W, then a known user can score pᵤᵀq_new. Every matrix axis and ID mapping matters; a feature column cannot silently switch meaning between training and serving."}</Prose>

<Prose>{"The retained "}<code>{"coldItem"}</code>{" program compares this direct ridge solve with an independent augmented least-squares construction, applies its actual new feature row and checks joint-rotation score invariance. This is a declared four-item/two-feature example, not measured recommendations for real recordings. The new fixed-forward program opens a separate changed metadata construction. Its changed three-item fixture uses feature rows (1,0), (0,1), (1,1) and corresponding factor rows (1,0), (0,1), (2,1), with λ=.5. Multiplying gives A=[[2.5,1],[1,2.5]] and b=XᵀQ=[[3,1],[2,2]]. Solve each column against that same A to obtain W=[[22/21,2/21],[8/21,16/21]]. The new feature row (1,.5) then selects matching products and sums to q_new=(26/21,10/21). A known user p=(1,0) would score it 26/21. These are declared metadata/factor rows, separate from the earlier rating matrix."}</Prose>

<Prose>{"Unknown feature categories, no usable user evidence and singular λ=0 solves need named outcomes. A linear projection is not a complete image/text feature engine, and it cannot recover meaningful unseen attributes merely from an ID."}</Prose>

<ServingSlateFigure />

<Prose>{"Follow actual item tokens through a request. First remove not-yet-released and task-forbidden repeat items. Next choose a candidate subset, compute each remaining named score, order by score with the declared ID tie rule, and fill the requested slots. A category quota may then skip an already represented category and take the next eligible token. That reranking changes a slate, not the factor score or learned parameters. If there are too few eligible items, report unfilled slots; do not manufacture successful recommendations."}</Prose>

<Prose>{"Work the fixed five-item serving fixture at request time 20 with p=(1,0). I0 is excluded by its known purchase at time 5; I2 is excluded by release time 30. The remaining factor rows are I1=(2,0), I3=(1.5,0), I4=(.5,0), so their dots give order I1,I3,I4. I1 and I3 are category A, while I4 is B. Two slots with cap one per category issue I1,I4, skipping I3 for its category. The recorded I4 purchase at time 25 is still future and does not exclude I4 from this time-20 list. The quota changes which IDs are issued; the scores remain 2,1.5,.5 throughout."}</Prose>

<Prose>{"For a maintenance application, available repair guides and equipment histories define legal candidates. A clicked guide is not proof that a repair worked. For a learning catalogue, an unmet prerequisite can exclude a high-scoring item. For retail, discovery excludes prior purchases whereas replenishment may need exactly those repeats. Each application needs its own collected outcome and information boundary before a claim of benefit."}</Prose>

<RetrievalGeometryFigure />

<Prose>{"Retrieval also needs the score's geometry. With user p=(1,0), item A=(2,2) has dot 2 and item B=(1.5,0) has dot 1.5, so the dot rule prefers A. Cosine normalization instead gives A=1/√2 and B=1, preferring B. Replacing a dot index with normalized cosine changes the rule. An item bias can be included in an augmented dot [p,1]ᵀ[q,bᵢ], but normalizing those augmented vectors changes its geometry again. A zero vector has no normalized direction; it cannot receive a spurious directional arrow or finite cosine by division through zero."}</Prose>

<EncoderTimeBoundaryFigure />

<Prose>{"A "}<strong>{"two-tower"}</strong>{" route encodes permitted user history/features and item features separately into compatible vectors, then takes their dot. An item-only vector can be cached under its item/encoder version. A joint ranker that reads user context and item features together cannot generally precompute that same full score as an item-only vector. Actual history tokens after the request cutoff are excluded before the user encoder; a stale item vector from another encoder version is a state fault, not a new valid recommendation."}</Prose>

<Prose>{"The fixed encoder example declares feature rows I0=(1,0), I1=(0,1), I2=(1,1). History has I0 occurrences at times 2 and 4 and an I2 occurrence at 21. At request time 20 only the two I0 tokens enter the mean, giving (1,0). Multiply by history weights [[.5,0],[0,1]] to get (.5,0); add context [1] times [[.2,−.1]] to obtain user vector (.7,−.1). The separate item weights [[1,.5],[0,1]] give cached vectors (1,.5), (0,1), (1,1.5). Their dots with the user are .65,−.1,.55. This encoder-only fixture computes three vectors; release/candidate gates separately decide which items may be issued. Repeated history tokens are retained by this mean rule, unlike the unique SVD++ set, and the future I2 token cannot affect the user vector."}</Prose>

<Prose>{"Other extensions change how scores are built: row reconstruction can be nonlinear, feature-pair models learn interactions, and sequence models use ordered history. Their full training engines belong to their respective lessons. The local program uses declared fixed linear encoder weights and actual array shapes to expose this boundary; it does not claim to train a neural recommender or an approximate-nearest-neighbor service. Approximate retrieval must be assessed against a named exact baseline, candidate recall, workload and hardware, rather than a universal speed claim."}</Prose>

<GraphPropagationBridgeFigure />

<Prose>{"A local "}<strong>{"LightGCN"}</strong>{" bridge instead uses the binary interaction graph. Take edges U0–I0, U0–I1, U1–I1, with degrees [2,1,1,2] in node order [U0,U1,I0,I1]. Initial scalar embeddings are [2,0,1,3]. Each next-layer node adds old neighbor values weighted by 1/√(its degree × neighbor degree). U0's first layer is 1/√2+3/2; U1's is 3/√2; I0's is √2; I1's is 1. All four read the same old layer buffer. Their next U0 value is √2/√2+1/2=3/2, not a sequential update using a just-changed neighbor."}</Prose>

<Prose>{"Mix layers 0 through K equally, then take the selected user/item mixed-vector dot. K=0 preserves the original vectors. An isolated node receives zero at later layers while its layer 0 contribution still remains in the mixture; no self loop is invented to keep it alive. Zero values have no directional heads. This is fixed graph-forward arithmetic, not a new fitted graph experiment or an assertion that arbitrary differently normalized self-loop operators have the same polynomial. "}<a href={"https://arxiv.org/pdf/2002.02126"}>{"LightGCN, §3"}</a>{" defines the aggregation and mixture. "}<a href={"https://ronak.sh/learn/topic/message-passing-graph-convolutions-gcn-gat-graphsage"}>{"Message Passing"}</a>{" is optional further learning for full graph learning. The local calculation remains complete without requiring that lesson first."}</Prose>

<Prose>{"The edge propagation kernel visits E user–item edges at each of K layers, doing O(K E d) coordinate work for width d. An edge-list implementation also needs O(N+E) graph storage and O(Nd) current/next/mixture buffers, where N=U+I; clearing or mixing these dense node buffers adds O(K N d) work. The complete small-graph diagnostic below deliberately does more: it accepts dense U×I input, discovers its edges in O(UI), allocates dense N×N adjacency and normalized operator, and multiplies that operator by every old layer to check the edge result. That verification adds O(N²) storage and O(K N² d) work. It retains every layer, O((K+1)Nd), and every directed edge-product record, O(K E d), then materializes all user–item scores in O(UI d) work and O(UI) storage. Those retained outputs support tracing this tiny example; they are not the storage plan for a large sparse production service. The full recorded numerical trace uses this same arithmetic; its original "}<code>{"costs"}</code>{" field described only the edge kernel, so include the dense diagnostic and returned-state costs when scaling the complete program."}</Prose>

<Prose>{"The deeper candidate/"}<wbr />{"index/"}<wbr />{"cache/"}<wbr />{"version/"}<wbr />{"slate/"}<wbr />{"logging service belongs to Recommendation System Design. Here we can already diagnose a missing item, wrong metric, future token or stale array from the actual local objects. The next optional section asks what a logged outcome can identify about a changed decision policy."}</Prose>

<H3>{"Complete program: Project available metadata into a known factor space"}</H3>

<Prose>{"Form XᵀX+λI and XᵀQ from the declared paired feature/item rows, solve for W, then multiply the new metadata row by W. This maps an item port into the existing latent width; a known user can score it with a dot product. It does not invent evidence for a cold user. NumPy’s solve is compared with an augmented least-squares formulation."}</Prose>

<RecCanonicalProgram language="python" filename="coldItem.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/coldItem.py" decodedSHA256="ff66c9df77be6255af3b962b20e392ecd9601d6376030141cf4d5d04dfe40778" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/coldItem.stdout.txt" download="coldItem.stdout.txt">Download the complete recorded output for coldItem.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"mapping: [[0.758303, 0.046125], [0.132841, 0.738007]]\nnew item factor: [0.824723, 0.415129]\npersonalized dot score: 0.62048\njoint factor rotation preserves the score; factor axes are not unique."}</CodeBlock>

<H3>{"Complete program: Trace fixed metadata, serving and graph forwards"}</H3>

<Prose>{""}<code>{"metadata_projection"}</code>{" solves a declared feature-to-factor ridge map. "}<code>{"serving_slate"}</code>{" applies time, history and quota rules to named IDs. "}<code>{"metric_scores"}</code>{" contrasts dot and cosine, including zero norm; "}<code>{"two_tower_prefix"}</code>{" excludes future tokens before fixed encoding. "}<code>{"graph_forward"}</code>{" computes bipartite degree-adjusted layers and the layer-zero mixture, comparing node-loop and block-array routes. "}<code>{"state_identity"}</code>{" keeps names/version with rows. These are fixed forward and analytical solves, not a trained neural or graph recommender or an ANN service."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-forward-boundaries.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-forward-boundaries.py" decodedSHA256="103bdcc756ddea1543dce4bb34b18ce3b2aeb1e5c2d8bd22f39b6b029a390e5f" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-forward-boundaries.stdout.txt" download="recommender-forward-boundaries.stdout.txt">Download the complete recorded output for recommender-forward-boundaries.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"metadataNewQ\": [\n    1.2380952380952381,\n    0.47619047619047616\n  ],\n  \"metadataSolverDifferenceInfinity\": 5.551115123125783e-16,\n  \"scoreOrder\": [\n    \"I1\",\n    \"I3\",\n    \"I4\"\n  ],\n  \"issued\": [\n    \"I1\",\n    \"I4\"\n  ],\n  \"ignoredFutureOccurrences\": 1,\n  \"dotVersusCosine\": {\n    \"dot\": [\n      2.0,\n      1.5,\n      0.0\n    ],\n    \"cosine\": [\n      0.7071067811865475,\n      1.0,\n      null\n    ],\n    \"biasedDot\": [\n      2.2,\n      1.4,\n      0.0\n    ],\n    \"augmentedDot\": [\n      2.2,\n      1.4,\n      0.0\n    ]\n  },\n  \"twoTower\": {\n    \"available\": true,\n    \"prefix\": [\n      {\n        \"item\": \"I0\",\n        \"time\": 2\n      },\n      {\n        \"item\": \"I0\",\n        \"time\": 4\n      }\n    ],\n    \"pooledFeatures\": [\n      1.0,\n      0.0\n    ],\n    \"userVector\": [\n      0.7,\n      -0.1\n    ],\n    \"cachedItemVectors\": [\n      [\n        1.0,\n        0.5\n      ],\n      [\n        0.0,\n        1.0\n      ],\n      [\n        1.0,\n        1.5\n      ]\n    ],\n    \"scores\": [\n      0.6499999999999999,\n      -0.1,\n      0.5499999999999999\n    ],\n    \"encoderVersion\": \"encoder-v1\",\n    \"shapes\": {\n      \"X\": [\n        3,\n        2\n      ],\n      \"Wi\": [\n        2,\n        2\n      ],\n      \"Wu\": [\n        2,\n        2\n      ],\n      \"Wcontext\": [\n        1,\n        2\n      ]\n    }\n  },\n  \"graphFirstLayer\": [\n    [\n      2.2071067811865475\n    ],\n    [\n      2.1213203435596424\n    ],\n    [\n      1.414213562373095\n    ],\n    [\n      1.0\n    ]\n  ],\n  \"graphDepthTwoMixture\": [\n    [\n      1.9023689270621826\n    ],\n    [\n      0.9428090415820632\n    ],\n    [\n      1.3249579113843053\n    ],\n    [\n      2.201184463531091\n    ]\n  ],\n  \"isolatedDegrees\": [\n    1.0,\n    0.0,\n    1.0,\n    0.0\n  ],\n  \"isolatedMixture\": [\n    [\n      1.6666666666666667\n    ],\n    [\n      2.3333333333333335\n    ],\n    [\n      1.3333333333333333\n    ],\n    [\n      1.0\n    ]\n  ],\n  \"staleState\": {\n    \"available\": false,\n    \"reason\": \"stale item state/encoder version\",\n    \"scores\": null\n  }\n}"}</CodeBlock>

<Prose>{"The quota selects I1 and I4 from the score order I1,I3,I4; it skips a category rather than changing scores. The later event is excluded before encoding. Dot and cosine prefer different nonzero items, and a zero item has undefined cosine. Graph layers use one old buffer, while isolated nodes retain their layer-zero share in the mixture. A stale identity/version invalidates the current result."}</Prose>

<H2>{"12. Optional: distinguish logged rewards from a new policy"}</H2>

<Prose>{"A "}<strong>{"logging policy"}</strong>{" is the rule that chose which action was shown. A "}<strong>{"target policy"}</strong>{" is another rule whose expected reward we want to assess. Observed rewards average under the logging policy's exposures. A reward for an action never shown does not enter that average, and unknown exposure cannot be repaired by calling an unpurchased item a negative label."}</Prose>

<PolicyProbabilityTreeFigure />

<Prose>{"Use a separate fully known two-action construction. Logging chooses A with probability .8 and B with .2. Conditional reward-one probabilities are .4 for A and .8 for B. The four action/reward path masses are .32,.48,.16,.04. Logging's expected reward is .8×.4+.2×.8=.48. A target policy choosing both actions with .5 each instead has value .5×.4+.5×.8=.6."}</Prose>

<Prose>{"An "}<strong>{"inverse-propensity score"}</strong>{", or IPS, multiplies a logged reward by the target/logging action-probability ratio. Here A's ratio is .5/.8=.625; B's is .5/.2=2.5. In expectation the logging probability cancels:"}</Prose>

<div className="neural-equation" role="region" tabIndex={0} aria-label="Mathematical expression: scroll locally when needed"><MathBlock>{"\\mathbb E_{a\\sim\\pi_0,y\\mid a}\n\\left[\\frac{\\pi(a)}{\\pi_0(a)}y\\right]\n=\\sum_a\\pi(a)\\mathbb E[y\\mid a]."}</MathBlock></div>

<Prose>{"This equality assumes the supplied positive logging probabilities correctly describe assignment and the conditional reward relation remains the one being assessed. If target mass is positive where logging mass is zero, the changed policy is not identified from those logs. A branch with both masses zero adds zero rather than an evaluated 0/0. The toy's reward chances were explicitly given; knowing them in the construction is different from having learned an unshown action's outcome from observational data."}</Prose>

<FinitePolicyLogFigure />

<Prose>{"The complete retained "}<code>{"policy"}</code>{" program enumerates all four paths with exact fractions. The weighted second moment is .32×.625²+.16×2.5²=1.125; subtract the squared mean .6² to get one-request variance .765. Under independent requests, the mean's variance is .765/N. Dependence or a different request population changes that interpretation."}</Prose>

<Prose>{"A declared twenty-request realization has sixteen A actions and four B actions, with six A rewards and three B rewards. Its ordinary average is 9/20=.45; its IPS estimate is (.625×6+2.5×3)/20=9/16=.5625. Neither equals the known expectation merely because it is correctly computed. Small propensities can produce large weights and an estimate above the reward's usual range. Clipping weights changes expectation. Self-normalized IPS divides the weighted reward sum by the weight sum instead of N; it is a separate finite-sample estimator with possible bias, not the same unbiased expectation identity."}</Prose>

<H3>{"Deeper: missing entry risk is a different data unit"}</H3>

<ObservationRiskFigure />

<Prose>{"Suppose a 2×2 population of entries has fixed losses [[1,4],[2,3]], and known observation probabilities [[1,.5],[.25,1]]. Let δ mark whether an entry is observed. The target full-entry mean loss is 10/4=2.5. Weight each observed entry loss by δ/observation probability and divide by the full population size 4. Its expectation is 2.5 because each E[δ]/probability cancels to 1. This is an entry-risk calculation, not a request-action reward tree; their denominators and data units must stay named."}</Prose>

<Prose>{"The first and last entries are always observed. The two optional entries give four nonzero-probability masks with masses 3/8,3/8,1/8,1/8. Their naive observed means are respectively 2,8/3,2,5/2, whose expectation is 37/16 rather than 5/2. Their full-population IPS means are 1,3,3,5, whose expectation is 5/2. One realized IPS value 5 exceeds even the largest individual loss 4; forcing it back into that range would change the estimator."}</Prose>

<Prose>{"The new exact-fraction program enumerates all sixteen masks, including the zero-probability ones, and evaluates these expectations and finite normalized alternatives. Positive target weight with zero observation probability is unidentified. In a generic empty observed mask, naive observed mean is undefined even though the full-population weighted sum with positive known propensities can be zero. "}<a href={"https://proceedings.mlr.press/v48/schnabel16.pdf"}>{"Schnabel et al., §§3–4"}</a>{" distinguish the population risk and observation mechanism."}</Prose>

<Prose>{"Neither the earlier missing rating cells nor later Retail invoices supply known action/exposure probabilities. No propensity fit, causal improvement or stock availability is inferred from those absences. Randomized logs or justified identification assumptions would be new evidence and a separately declared task. We return to a more limited, directly observable question: how do complete fixed workflows score their declared future outcomes?"}</Prose>

<H3>{"Complete program: Enumerate a request-action policy exactly"}</H3>

<Prose>{"Each branch combines an action probability with a Bernoulli reward probability. "}<code>{"Fraction"}</code>{" keeps their mass and IPS moments exact. The target-to-logging ratio multiplies observed rewards; the second moment minus the squared expectation gives variance. Positive target mass with zero logging support is an identification failure, not a numerical divide-by-zero fix."}</Prose>

<RecCanonicalProgram language="python" filename="policy.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/policy.py" decodedSHA256="09d361f9dbc501daf0758aad8de8df940a20c543cb5eef670f2a7cde500d16a2" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/policy.stdout.txt" download="policy.stdout.txt">Download the complete recorded output for policy.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"action 0 reward 0 mass 12/25 weighted reward 0\naction 0 reward 1 mass 8/25 weighted reward 5/8\naction 1 reward 0 mass 1/25 weighted reward 0\naction 1 reward 1 mass 4/25 weighted reward 5/2\nlogged mean: 12/25 target mean: 3/5 IPS expectation: 3/5\none-request IPS variance: 153/200\none declared 20-request sample: raw 9/20 IPS 9/16\nIf B has zero logging probability and positive target mass, its mean is not identified from those logs."}</CodeBlock>

<H3>{"Complete program: Enumerate missing-entry risk without conflating data units"}</H3>

<Prose>{""}<code>{"observation_problem"}</code>{" declares losses, observation propensities and fixed target weights. "}<code>{"enumerate_independent_masks"}</code>{" visits all sixteen masks, including zero-probability ones, while "}<code>{"estimates"}</code>{" keeps naive, IPS and self-normalized denominators separate. Exact expectations explain which quantities are unbiased and which have finite-sample normalization bias. "}<code>{"policy_paths"}</code>{" retains the different request-action unit. A zero-supported target is unidentified; the computation does not estimate Retail exposure from absence."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-propensity-risk.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-propensity-risk.py" decodedSHA256="0031a56fdafbc1f2d68d62975c1ece3c39395da9f937b3318a5c50d4128b8511" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-propensity-risk.stdout.txt" download="recommender-propensity-risk.stdout.txt">Download the complete recorded output for recommender-propensity-risk.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"entryRisk\": {\n    \"knownConstructionTarget\": {\n      \"exact\": \"5/2\",\n      \"decimal\": 2.5\n    },\n    \"entries\": 4,\n    \"enumeratedMasks\": 16,\n    \"positiveProbabilityMasks\": 4,\n    \"naiveObservedMean\": {\n      \"definedProbability\": {\n        \"exact\": \"1\",\n        \"decimal\": 1.0\n      },\n      \"unconditionalExpectation\": {\n        \"exact\": \"37/16\",\n        \"decimal\": 2.3125\n      },\n      \"expectationConditionalOnDefined\": {\n        \"exact\": \"37/16\",\n        \"decimal\": 2.3125\n      }\n    },\n    \"IPS\": {\n      \"definedProbability\": {\n        \"exact\": \"1\",\n        \"decimal\": 1.0\n      },\n      \"unconditionalExpectation\": {\n        \"exact\": \"5/2\",\n        \"decimal\": 2.5\n      },\n      \"expectationConditionalOnDefined\": {\n        \"exact\": \"5/2\",\n        \"decimal\": 2.5\n      }\n    },\n    \"SNIPS\": {\n      \"definedProbability\": {\n        \"exact\": \"1\",\n        \"decimal\": 1.0\n      },\n      \"unconditionalExpectation\": {\n        \"exact\": \"39/16\",\n        \"decimal\": 2.4375\n      },\n      \"expectationConditionalOnDefined\": {\n        \"exact\": \"39/16\",\n        \"decimal\": 2.4375\n      }\n    }\n  },\n  \"emptyPossible\": {\n    \"knownConstructionTarget\": {\n      \"exact\": \"5/2\",\n      \"decimal\": 2.5\n    },\n    \"entries\": 2,\n    \"enumeratedMasks\": 4,\n    \"positiveProbabilityMasks\": 4,\n    \"naiveObservedMean\": {\n      \"definedProbability\": {\n        \"exact\": \"5/8\",\n        \"decimal\": 0.625\n      },\n      \"unconditionalExpectation\": null,\n      \"expectationConditionalOnDefined\": {\n        \"exact\": \"19/10\",\n        \"decimal\": 1.9\n      }\n    },\n    \"IPS\": {\n      \"definedProbability\": {\n        \"exact\": \"1\",\n        \"decimal\": 1.0\n      },\n      \"unconditionalExpectation\": {\n        \"exact\": \"5/2\",\n        \"decimal\": 2.5\n      },\n      \"expectationConditionalOnDefined\": {\n        \"exact\": \"5/2\",\n        \"decimal\": 2.5\n      }\n    },\n    \"SNIPS\": {\n      \"definedProbability\": {\n        \"exact\": \"5/8\",\n        \"decimal\": 0.625\n      },\n      \"unconditionalExpectation\": null,\n      \"expectationConditionalOnDefined\": {\n        \"exact\": \"2\",\n        \"decimal\": 2.0\n      }\n    }\n  },\n  \"unsupportedEntry\": {\n    \"knownConstructionTarget\": {\n      \"exact\": \"5/2\",\n      \"decimal\": 2.5\n    },\n    \"entries\": 2,\n    \"enumeratedMasks\": 4,\n    \"positiveProbabilityMasks\": 1,\n    \"naiveObservedMean\": {\n      \"definedProbability\": {\n        \"exact\": \"1\",\n        \"decimal\": 1.0\n      },\n      \"unconditionalExpectation\": {\n        \"exact\": \"1\",\n        \"decimal\": 1.0\n      },\n      \"expectationConditionalOnDefined\": {\n        \"exact\": \"1\",\n        \"decimal\": 1.0\n      }\n    },\n    \"IPS\": {\n      \"definedProbability\": 0,\n      \"unconditionalExpectation\": null,\n      \"expectationConditionalOnDefined\": null\n    },\n    \"SNIPS\": {\n      \"definedProbability\": 0,\n      \"unconditionalExpectation\": null,\n      \"expectationConditionalOnDefined\": null\n    }\n  },\n  \"policyTarget\": {\n    \"exact\": \"3/5\",\n    \"decimal\": 0.6\n  },\n  \"policyLoggedExpectation\": {\n    \"exact\": \"12/25\",\n    \"decimal\": 0.48\n  },\n  \"policyIPSExpectation\": {\n    \"exact\": \"3/5\",\n    \"decimal\": 0.6\n  }\n}"}</CodeBlock>

<Prose>{"Full-entry risk is 5/2. Naive observed averaging has expectation 37/16, IPS has 5/2, and self-normalization has 39/16 in the four-entry construction. In the two-entry case an observed mean exists with probability 5/8; its conditional mean is 19/10 and the conditional self-normalized mean is 2. IPS remains defined on the empty mask and has unconditional mean 5/2. Unsupported positive target mass remains unidentified. The separate policy reward unit has value .6 rather than the logger’s .48."}</Prose>

<H2>{"13. Complete a small experiment with an honest report"}</H2>

<Prose>{"We have opened scores, updates, solves and lists. None of those local calculations answers how a complete chosen method performs on later outcomes. An experiment also needs a target, a permitted information set, a setting-choice rule, a baseline and an assessment that did not choose the settings."}</Prose>

<RecordedSyntheticComparisonFigure />

<Prose>{"The original synthetic comparison turns the twenty observed ratings into events at ticks 1–20, adds five validation ratings at 21–25 and six test ratings at 26–31. All seven items are declared released at tick 0. The final test event belongs to user 5, who has no earlier observations. This construction tests the implemented workflow and its fallbacks; the integer ticks are invented information boundaries, not a real-world collection history."}</Prose>

<Prose>{"The complete "}<code>{"evaluation"}</code>{" program compares ranks 1,2,3 and penalties .05,.2 using validation RMSE. It refits the chosen setting on the twenty-five permitted events, computes the shrunk-item baseline from the same prefix and assesses both on the six test events. It chooses rank 2, penalty .05, validation RMSE 1.337272. Test RMSE is 1.111143 for the item baseline and 1.229386 for MF: the factor method loses."}</Prose>

<NeuralTable caption={"13. Complete a small experiment with an honest report"} headers={[<>{"Test cohort"}</>,<>{"Events"}</>,<>{"Item baseline RMSE"}</>,<>{"MF RMSE"}</>]} rows={[[<>{"All"}</>,<>{"6"}</>,<>{"1.111143"}</>,<>{"1.229386"}</>],[<>{"Warm users"}</>,<>{"5"}</>,<>{"1.176590"}</>,<>{"1.321735"}</>],[<>{"Cold users"}</>,<>{"1"}</>,<>{".697143"}</>,<>{".577423"}</>]]} />

<Prose>{"The isolated cold-user number has one event; it is not robust cold-start evidence. After refitting, user 0's eligible unseen items are 4 and 6. Popularity orders [4,6], while MF orders [6,4]. A rating-error comparison does not by itself grade this unobserved list's relevance. The predeclared changed cutoff 18 keeps the same test period but changes the initial split to 18/7/6. It selects rank 2, penalty .2, validation RMSE 1.180979; MF test RMSE 1.128322 still exceeds baseline 1.111143. Choosing a cutoff because its test result looks better would be another selection using those outcomes, requiring a fresh final assessment."}</Prose>

<H3>{"Ask a narrower question of actual invoice history"}</H3>

<Prose>{"Can known customers' recorded purchases help rank previously unpurchased products for the next month, within a catalogue chosen from December? This is discovery. Replenishment would retain previously purchased products and need a different target. Invoice quantity, price, an explicit rating and a recorded exposure are different observations; we use unique invoice-time occurrences as counts."}</Prose>

<RetailDataAuditFigure />

<Prose>{""}<a href={"https://archive.ics.uci.edu/dataset/352/online+retail"}>{"UCI Online Retail"}</a>{" records invoices from a UK non-store retailer between 1 December 2010 and 9 December 2011. The dataset is attributed to Daqing Chen, DOI 10.24432/C5BW33, under CC BY 4.0. The supplied four-file input bundle in §2 was derived from the original workbook by the complete data program below; it is not an untraceable resample. It is sufficient for the study, so workbook re-derivation is optional. To reproduce the derivation instead, download the complete original ZIP from the UCI dataset page's Download link and save it as "}<code>{"retail-original.zip"}</code>{" beside "}<code>{"recommender-retail-data.py"}</code>{". The required archive SHA256 is "}<code>{"f5385cbb54bbebf7196389109c6b0621faab0c304e3702548165e71c84aede8b"}</code>{"; it contains "}<code>{"Online Retail.xlsx"}</code>{", whose SHA256 is "}<code>{"43465a06f2ccf7c8b5bd2892bc7defb52f97487934fe93b16ae4c3936424676d"}</code>{". The program validates both identities before reading rows; an extracted workbook alone is not its archive input. Use a fresh derivation directory:"}</Prose>

<CodeBlock language={"powershell"}>{"python recommender-retail-data.py --archive retail-original.zip --output retail-data-rederived"}</CodeBlock>

<Prose>{"Then substitute "}<code>{"--data retail-data-rederived"}</code>{" in both §2 commands and choose new readiness/output names. Do not merge it with the supplied input directory. This alternative reconstructs the input bundle; it is not necessary to inspect the recorded study. The source workbook's 541,909 rows pass these sequential, disjoint filters: 135,080 lack a customer ID; 8,905 have cancellation invoice strings; 0 remaining rows have nonpositive quantity; 40 have nonpositive price; 1,838 have a nonproduct stock code. The 396,046 retained rows have five-digit stock codes with an optional letter suffix. Removing cancellation invoices does not prove that a retained purchase was never returned later."}</Prose>

<Prose>{"An occurrence is one distinct (CustomerID, StockCode, InvoiceNo, InvoiceDate). Repeated copies of that same four-field key collapse. A later invoice or timestamp remains a new event and increases confidence. The three months contain 65,248 such filtered occurrences across all customers/products. We preserve the workbook's source-naive calendar times; no time zone was supplied that would justify shifting their boundaries."}</Prose>

<Prose>{"December [2010-12-01,2011-01-01) chooses the 100 products with the largest occurrence counts, ties by original stock-code lexical order. Among the 615 customers with at least three distinct selected products, choose 200 by the SHA256 of their canonical customer-ID strings, ties by ID. This deterministic train-only choice defines the warm cohort. January and February do not choose the products or customers. Local U/I IDs keep the matrices readable; they do not guarantee anonymity."}</Prose>

<NeuralTable caption={"Ask a narrower question of actual invoice history"} headers={[<>{"Role"}</>,<>{"Catalogue occurrences"}</>,<>{"Catalogue pairs"}</>,<>{"Any catalogue purchaser"}</>,<>{"Requests with eligible discovery truth"}</>,<>{"Inside / outside discovery pairs"}</>]} rows={[[<>{"December training"}</>,<>{"1930"}</>,<>{"1725"}</>,<>{"200"}</>,<>{"200"}</>,<>{"1725 / 5181"}</>],[<>{"January validation"}</>,<>{"533"}</>,<>{"497"}</>,<>{"72"}</>,<>{"68"}</>,<>{"317 / 1757"}</>],[<>{"February test"}</>,<>{"410"}</>,<>{"384"}</>,<>{"60"}</>,<>{"48"}</>,<>{"171 / 1185"}</>]]} />

<Prose>{"The first row is training coverage, not evaluation performance. Each of the 200 customers issues one hypothetical request at the month's start. Candidates are the fixed catalogue minus that customer's previously purchased catalogue products. Truth is a future positive product not present in that customer's entire earlier filtered product history. Outside-catalogue discoveries are counted separately. An item omitted by this chosen catalogue cannot be returned by these rules; that observed purchase coverage is different from ANN recall or causal relevance. No actual stock-availability log is present, so call the candidates *declared fixed-catalogue eligibility*."}</Prose>

<Prose>{"Sixty-eight January and forty-eight February requests have nonempty eligible truth. The other requests do not establish that all their candidate items are irrelevant. Their recall, RR, AP and NDCG are undefined and excluded with those counts. Precision and fixed-slot fill retain all 200 requests. This avoids changing the population silently when different denominators happen to favor a model."}</Prose>

<H3>{"Choose on validation; hold one scorer fixed"}</H3>

<LockedStudyComparisonFigure />

<Prose>{"The four factor settings are, in order, (rank 4,λ.1),(rank 4,λ1),(rank 8,λ.1),(rank 8,λ1). All use target 1[count>0], confidence 1+2count and the same once-entity penalty. Initialize training P at zero and Q from "}<code>{"default_rng(19).normal(0,.01,(100,rank))"}</code>{". Each setting receives ten complete user-then-item exact-solve sweeps on December. Every full training objective uses the actual stored P/Q after its recorded sweep. The final user array was solved before the tenth item update; it is retained as training state, separately from the request vectors described in section 10."}</Prose>

<Prose>{"Every validation score instead solves the customer's December history against that setting's own final Q. A=QᵀQ+Σ positive(c−1)qqᵀ+λI, b=Σ positive cq; solve Ap_query=b and score every item qᵀp_query. The absent-pair curvature remains in QᵀQ. This is the same "}<code>{"retail-final-q-fixed-history-v1"}</code>{" request calculation later used for test and saved queries, not an extra training sweep. Eligibility is applied after all 100 scores have been computed; it does not change A."}</Prose>

<Prose>{"The two baselines use exactly the same history and eligible catalogue. Popularity adds occurrence counts over customers. Item cosine uses binary purchased-item columns, their common full column norms and a sum of similarities over this customer's unique purchased products; an empty history falls back to popularity. These are binary implicit conventions, distinct from signed centered explicit rating neighbors. Stable descending score then original stock-code lexical order settles every list tie."}</Prose>

<Prose>{"Select on January macro NDCG@10 over its 68 qualified requests. Lock both the best ALS setting and the overall rule among all four settings and both baselines. An exact metric tie prefers popularity, then item cosine, then lower factor rank and stronger λ. This choice rule is declared before the numbers exist. Save all six validation score arrays, masks, complete eligible orders, per-user metrics, null masks, configurations and their final Q identities with that selection."}</Prose>

<Prose>{"Only the chosen ALS configuration is refitted on December+January, once, with the same initialization and ten sweeps. January adds 533 occurrences; the prefix has 2463 occurrences. Its distinct nonzero count is the actual matrix union, not 1725+497: the same pair can appear in both months. Recompute both baseline states on this prefix without choosing any new settings. Before parsing February events, lock the complete three score arrays/orders/masks, final Q, p_query array, counts, confidences, IDs, selected setting and first lock. These two prospective locks separate model choice and the final fixed predictions from their later truth."}</Prose>

<Prose>{"The ordinary CPU "}<code>{"implicit 0.7.3"}</code>{" comparison is the sixth model fit. Its user×item CSR stores 1+2n only for positive count cells; package alpha=1 avoids multiplying confidence twice. It uses rank/λ from validation, ten iterations, float64 factors, one thread, "}<code>{"use_cg=False"}</code>{", "}<code>{"use_native=False"}</code>{", and supplied exact initial P/Q. The package converts confidence storage to float32; these small integer weights are exactly representable. Its own final Q is scored by the same direct query equations. Compare "}<code>{"recalculate_user"}</code>{" on that Q separately without replacing the library's stored training users. The declared tolerances are absolute 1e−8 and relative 1e−7; any differences or warnings are reported rather than erased by another fit. This is a tool correspondence, not a fourth selected test method."}</Prose>

<Prose>{"The complete "}<code>{"recommender-retail-study.py"}</code>{" makes the boundary visible in code. "}<code>{"fit_scratch"}</code>{" saves each full objective and old/current buffer arrays; "}<code>{"fixed_history_query"}</code>{" returns separate A,b,p_query and all scores; "}<code>{"ranked_orders"}</code>{" retains full eligible ID lists; "}<code>{"metrics"}</code>{" reports each named denominator and null cohort. The main sequence writes the selection lock before its single prefix refit and the prediction lock before its only February event import. It records every matrix in typed NPZ and portable JSON. A new output directory is mandatory, even after failure; another run is a new declared campaign rather than an invisible retry. The companion data program provides the full filtering/cohort/ID recipe and separate month files. Neither imports the original unguarded demonstrations."}</Prose>

<H3>{"Read performance and uncertainty on their declared population"}</H3>

<Prose>{"The test report includes the three prefix rules' precision@10, fill, recall, RR, AP with denominator min(10,R), NDCG, complete per-customer results and all 48 qualified IDs. It preserves the overall validation winner even if the test ordering reverses. It also retains all validation settings, including weak ones; the three unchosen factor settings have no invented/refitted test outcomes."}</Prose>

<H3>{"The recorded comparison"}</H3>

<Prose>{"Here are the complete declared alternatives' recorded values. Recall, RR, AP and NDCG average over the 68 January customers with qualifying discovery truth; precision and fill average over all 200 requests. K is 10. These are fractions, not percentages. Displayed values are rounded to six decimal places; the full report keeps per-customer values, undefined masks and score/order arrays."}</Prose>

<NeuralTable caption={"The recorded comparison"} headers={[<>{"Validation rule"}</>,<>{"NDCG"}</>,<>{"Recall"}</>,<>{"AP"}</>,<>{"RR"}</>,<>{"Precision"}</>,<>{"Fill"}</>]} rows={[[<>{"Popularity"}</>,<>{"0.172752"}</>,<>{"0.212643"}</>,<>{"0.093969"}</>,<>{"0.290412"}</>,<>{"0.029000"}</>,<>{"1.000000"}</>],[<>{"Binary item cosine"}</>,<>{"0.148276"}</>,<>{"0.167517"}</>,<>{"0.089229"}</>,<>{"0.228402"}</>,<>{"0.026500"}</>,<>{"1.000000"}</>],[<>{"ALS rank 4, λ=0.1"}</>,<>{"0.187875"}</>,<>{"0.256901"}</>,<>{"0.105688"}</>,<>{"0.250444"}</>,<>{"0.033000"}</>,<>{"1.000000"}</>],[<>{"ALS rank 4, λ=1"}</>,<>{"0.185113"}</>,<>{"0.244646"}</>,<>{"0.104452"}</>,<>{"0.251062"}</>,<>{"0.033000"}</>,<>{"1.000000"}</>],[<>{"ALS rank 8, λ=0.1"}</>,<>{"0.162610"}</>,<>{"0.207506"}</>,<>{"0.091386"}</>,<>{"0.245577"}</>,<>{"0.028500"}</>,<>{"1.000000"}</>],[<>{"ALS rank 8, λ=1"}</>,<>{"0.162746"}</>,<>{"0.208119"}</>,<>{"0.091817"}</>,<>{"0.242291"}</>,<>{"0.028500"}</>,<>{"1.000000"}</>]]} />

<Prose>{"Rank 4 with λ=.1 has the highest validation NDCG and is both the selected overall rule and the best factor setting. Rank 8 did not improve this declared criterion. The selected rank-4 model alone was refitted on the prefix; none of the other three factor settings acquired test numbers through an extra fit. The actual prefix contains 2,463 occurrences on 2,042 distinct user–item pairs, so adding the two monthly nonzero counts would have overstated its pair count."}</Prose>

<Prose>{"For February, relevance metrics use the 48 qualified customers, while precision and fill still use all 200 requests. All three prefix rules are retained:"}</Prose>

<NeuralTable caption={"The recorded comparison"} headers={[<>{"Test rule"}</>,<>{"NDCG"}</>,<>{"Recall"}</>,<>{"AP"}</>,<>{"RR"}</>,<>{"Precision"}</>,<>{"Fill"}</>]} rows={[[<>{"Popularity"}</>,<>{"0.133250"}</>,<>{"0.151885"}</>,<>{"0.084224"}</>,<>{"0.197330"}</>,<>{"0.013500"}</>,<>{"1.000000"}</>],[<>{"Binary item cosine"}</>,<>{"0.190692"}</>,<>{"0.265749"}</>,<>{"0.113978"}</>,<>{"0.267361"}</>,<>{"0.018000"}</>,<>{"1.000000"}</>],[<>{"ALS rank 4, λ=0.1"}</>,<>{"0.206214"}</>,<>{"0.289096"}</>,<>{"0.124745"}</>,<>{"0.261500"}</>,<>{"0.022000"}</>,<>{"1.000000"}</>]]} />

<Prose>{"The selected rule's NDCG exceeds popularity here by 0.072964. The paired-user 95% percentile interval is [-0.005122, 0.155089], which includes zero. The recall difference is 0.137211, with interval [0.043980, 0.235890]. These intervals condition on this workflow, selected warm cohort and month; they do not cover every source of uncertainty or establish causal conversion lift. Item cosine also overtakes popularity on this test criterion despite lower validation NDCG; that observation does not retroactively change the locked winner."}</Prose>

<Prose>{"Only 171 qualifying test discovery pairs fall in the fixed catalogue, while 1,185 discovered pairs lie outside it. A fill value of 1 means ten slots were issued; it does not mean ten useful items, complete market coverage, or known stock availability. The 152 requests without catalogue discovery truth remain undefined for relevance metrics rather than being assigned false zero labels."}</Prose>

<Prose>{"The easier sampled-candidate diagnostic increases the selected rule's NDCG to 0.446449. It uses the same scores but retains all known positives and at most 20 other eligible items. That different candidate distribution is why it must not be substituted for full-catalogue performance or used to choose a setting."}</Prose>

<Prose>{"The ordinary direct-solve implementation agrees within the predeclared absolute 1e−8/relative 1e−7 tolerances. Maximum differences are about 5.77e−15 for training P, 1.61e−15 for Q, 1.50e−15 for direct query scores and 1.28e−15 for package recalculation on its own final Q. Stored training users remain different from fresh request users. The last item block is stationary to about 1.31e−13, but the user block after that last item update has residual about .606: ten sweeps are the declared budget, not a joint-convergence claim. The recorded OpenBLAS warning reports 12 internal threads even though the model's explicit thread setting is 1; this performance configuration warning was retained."}</Prose>

<Prose>{"For the winner minus popularity and best ALS minus popularity, resample the same qualified customer rows 1000 times with replacement, seed 71. Compute NDCG/recall differences without refitting. The 2.5/97.5 percentiles are conditional intervals for this workflow, warm cohort and month. Shared products, temporal dependence and customer selection limit a broader interpretation. Identical predictions give an exact zero difference distribution; no qualified cohort gives undefined comparison rather than a made-up zero interval."}</Prose>

<Prose>{"A separate diagnostic keeps every known eligible positive plus up to 20 other eligible items per customer, seed 83. It uses the unchanged score arrays. Its easier candidate distribution can change metrics and never chooses a method. Those other items are not known dislikes merely because they were sampled. Exact full-catalogue and diagnostic candidate IDs remain distinct records."}</Prose>

<H3>{"Follow a saved request without retraining"}</H3>

<SavedRetailQueryFigure />

<Prose>{"Select a saved customer and inspect its prefix occurrences. Each selected item contributes a target, a confidence and its fixed final item vector. The picture adds the shared Gram, that history's outer-product corrections and λI, forms b, solves p_query and exposes a selected candidate's coordinate products and sum. The same all-item scores feed its stable eligible top-ten list. With no edits, this route must reproduce the saved prefix prediction array; it is the calculation that was assessed. If a baseline won validation, show that actual baseline forward as the selected rule; the ALS inspector remains a measured comparison method."}</Prose>

<Prose>{"Editing a count produces a hypothetical fixed-factor request, not a newly fitted or measured Retail outcome. Its domain is every finite decimal from 0 to max(20,maximum saved count), preserving every actual occurrence count. Copy the row before editing; Q, λ, item identities and saved data stay fixed. An empty row has b=0 and positive λ makes p_query=0, so all factors tie and original stock-code lexical order becomes visible. Changing the eligible mask changes the list, not the already formed full-catalogue score vector."}</Prose>

<SavedBundleReloadFigure />

<Prose>{"A complete saved bundle connects ordered user/item IDs, source/prefix identity, count conversion, final Q, λ/rank, scorer version, both locks and the arrays' roles. It keeps stored training P separate from request P_query. Swapping I0/I1 labels without their factor rows or count columns can produce a numerically plausible but incorrectly named score. A checksum can bind that wrong bundle too; it does not establish the intended row mapping. Reject a mismatch against the declared reference schema, or intentionally permute every corresponding object together. Invalid factor width, stale prefix or changed scorer cannot leave an earlier result displayed as a valid current forecast."}</Prose>

<Prose>{"One chronological warm-customer comparison cannot establish universal superiority, causal conversion lift, cold-item performance or repeat replenishment. The value of this report is the observable question, actual stronger and weaker outcomes, complete information lineage and visible limits. A larger or different task needs its own labels, workflow and fresh assessment."}</Prose>

<H3>{"Complete program: Read one complete synthetic selection and assessment"}</H3>

<Prose>{"Construct the full timestamped invented data and split before tuning. Fit each declared rank/penalty on the prefix, select using validation, and refit the selected setting on the allowed expanded prefix before later test. The shrunk-item baseline obeys the same time boundary; warm/cold cohorts remain explicit. Both predeclared cutoffs and the factor method’s weaker test outcomes are retained."}</Prose>

<RecCanonicalProgram language="python" filename="evaluation.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/evaluation.py" decodedSHA256="0e6fe4902122fffe0b881bc0b4683ad7218c3abeb5b9a816779144aff3b69ab2" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/evaluation.stdout.txt" download="evaluation.stdout.txt">Download the complete recorded output for evaluation.py</a>. This file contains the original example’s stored output.</Prose>

<Prose>{"Recorded output for this exact original program and its original execution context:"}</Prose>

<CodeBlock language={"text"}>{"split sizes=20/5/6; selected rank=2, penalty=0.05, validation RMSE=1.337272\nall: n=6, shrunk item RMSE=1.111143, MF RMSE=1.229386\nwarm users: n=5, shrunk item RMSE=1.176590, MF RMSE=1.321735\ncold users: n=1, shrunk item RMSE=0.697143, MF RMSE=0.577423\nuser 0 eligible unseen: [4, 6]\npopularity order: [4, 6]\nMF order: [6, 4]\nRelease times are 0 for these seven items; changing that assumption requires request-time eligibility.\nChanged cutoff, same untouched test period:\nsplit sizes=18/7/6; selected rank=2, penalty=0.2, validation RMSE=1.180979\nall: n=6, shrunk item RMSE=1.111143, MF RMSE=1.128322\nwarm users: n=5, shrunk item RMSE=1.176590, MF RMSE=1.198989\ncold users: n=1, shrunk item RMSE=0.697143, MF RMSE=0.671405\nuser 0 eligible unseen: [4, 6]\npopularity order: [4, 6]\nMF order: [6, 4]\nRelease times are 0 for these seven items; changing that assumption requires request-time eligibility."}</CodeBlock>

<H3>{"Complete program: Derive the complete offline invoice subset"}</H3>

<Prose>{""}<code>{"original_occurrences"}</code>{" verifies the official archive/member and applies ordered filters before deduplicating the four-key invoice/time occurrence. "}<code>{"select_cohort"}</code>{" uses December only to select fixed products/customers and lexical tie ranks. "}<code>{"prepare"}</code>{" writes separate calendar roles, the private original-ID map, attribution and digests into a new output directory. "}<code>{"load_period"}</code>{" validates one explicitly requested role at a time. Price/quantity are filters rather than confidence magnitude, and future purchases do not reselect the cohort."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-retail-data.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-retail-data.py" decodedSHA256="daf866b6d3086a7c695837291de84d6c8f634c335ad856d1bf740abb8fa03449" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-retail-data.stdout.txt" download="recommender-retail-data.stdout.txt">Download the complete recorded output for recommender-retail-data.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"schema\": \"retail-offline-occurrences-v1\",\n  \"filters\": {\n    \"allRows\": 541909,\n    \"excludedMissingCustomer\": 135080,\n    \"excludedCancellation\": 8905,\n    \"excludedNonpositiveQuantity\": 0,\n    \"excludedNonpositivePrice\": 40,\n    \"excludedNonproductCode\": 1838,\n    \"retainedProductRowsAllDates\": 396046\n  },\n  \"uniqueThreeMonthSourceOccurrences\": 65248\n}"}</CodeBlock>

<Prose>{"These filter counts belong to the sequential recipe above; each excluded row is counted at its first failing stage. The three-month distinct occurrences are counted before selecting the fixed catalogue/customer cohort. Separate role files and their ordered ID arrays supply the study inputs. The complete manifest records attribution and file digests; the private original-ID map is not a learner download."}</Prose>

<H3>{"Complete program: Run one locked selection/assessment campaign"}</H3>

<Prose>{""}<code>{"fit_scratch"}</code>{" alternates exact user then item systems for ten sweeps and saves full objectives and training buffers. "}<code>{"fixed_history_query"}</code>{" separately solves fresh users against each fit’s own final Q. "}<code>{"baselines"}</code>{", "}<code>{"ranked_orders"}</code>{" and "}<code>{"metrics"}</code>{" preserve populations and the null denominator. "}<code>{"run"}</code>{" writes the validation selection lock before prefix refitting and the prediction lock before February labels, then assesses only the three already fixed rules. The sixth ordinary fit compares its own final-Q direct and library-recalculated forwards; it is not another test-selected candidate. "}<code>{"prepare_readiness"}</code>{" binds all local code/data/package/installed-ALS inputs without fitting, and "}<code>{"validate_readiness"}</code>{" rejects an identity change before the six-fit start guard."}</Prose>

<RecCanonicalProgram language="python" filename="recommender-retail-study.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-retail-study.py" decodedSHA256="6b00e75c39aa91bfbc6b4bd5ac34ae5b9456c89ec4abfc4e977ed6bd0fa4f3ab" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/recommender-retail-study.stdout.txt" download="recommender-retail-study.stdout.txt">Download the complete recorded output for recommender-retail-study.py</a>. This file contains the recorded process output for the example.</Prose>

<Prose>{"Recorded output selection (the complete JSON output is in the common file index):"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"question\": \"Next-month previously unpurchased products inside the fixed December-selected catalogue/cohort\",\n  \"scorerId\": \"retail-final-q-fixed-history-v1\",\n  \"fitsDone\": 6,\n  \"overallWinner\": \"als-r4-l0.1\",\n  \"bestALS\": \"als-r4-l0.1\",\n  \"validationNDCG\": {\n    \"popularity\": 0.17275238361120773,\n    \"item-cosine\": 0.1482762189929301,\n    \"als-r4-l0.1\": 0.18787549523481256,\n    \"als-r4-l1\": 0.18511265151301878,\n    \"als-r8-l0.1\": 0.16260972341202068,\n    \"als-r8-l1\": 0.16274644413638836\n  },\n  \"testNDCG\": {\n    \"popularity\": 0.13325010201834894,\n    \"item-cosine\": 0.19069171750019362,\n    \"als-r4-l0.1\": 0.20621371932293833\n  }\n}"}</CodeBlock>

<Prose>{"These are the selected setting and the complete declared rules, not an extra search over test outcomes. Read them with the population tables and paired intervals above. Full files retain score/order/null arrays, stored training buffers, separate final-Q request vectors and both prospective locks. The stored warning accompanies this execution; it is not removed by another fit."}</Prose>

<H2>{"14. Practice, explain and transfer the decision"}</H2>

<Prose>{"Close the solutions for your first attempt. Before calculating, name the evidence available to the request, the target, the denominator and the objective. A score can be algebraically correct while answering the wrong question. The early missing-versus-zero checkpoint remains useful: in [0, missing, 4], identify the mask and explain why the observed mean is 2 rather than 4."}</Prose>

<H3>{"A. Audit a past request"}</H3>

<Prose>{"At time 20, a learner asks for recommendations. A candidate was released at 23, similarities were computed from events through 30, and a validation setting was chosen using events 21–25. Which parts may serve the time-20 request? Repair the replay without using later information."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"A valid configuration choice and a valid historical information set are separate constraints. Put each availability time on the request's clock."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"The unreleased candidate is ineligible. Similarities through 30 include future interactions. The setting chosen using events 21–25 was also unavailable at 20 unless a separate earlier experiment had already fixed it. Use configuration decisions and fitted artifacts available by 20, and filter releases at or before"}</Prose>

<ol start={20}><li>{"Alternatively move the request after validation, refit that allowed prefix"}</li></ol>

<Prose>{"and assess on later untouched outcomes. That is a different experiment, so its report must name the changed request and information boundary."}</Prose>

</details>

<H3>{"B. Explain a signed neighbor prediction"}</H3>

<Prose>{"A user's baseline is 3. Two usable neighbors have ratings 1 and 5, with signed weights −.5 and .25. Calculate the centered prediction. What happens if both neighbors fail the support rule?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Subtract the declared baseline before weighting; the denominator is the sum of absolute weights, not their signed sum."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"The residuals are −2 and 2. Contributions are (−.5)(−2)=1 and .25×2=.5. Their sum 1.5 divided by |−.5|+|.25|=.75 gives a residual prediction of 2. Add the baseline to obtain 5. If neither neighbor is accepted, the denominator is zero and the declared fallback is 3. A negative similarity reverses a residual's direction; it is neither a negative purchase count nor the library's positive-neighbor policy."}</Prose>

</details>

<H3>{"C. Give a different rank-one completion"}</H3>

<Prose>{"Only the two diagonal entries of a 2×2 matrix are observed, both equal to 1. Construct another completion and prove its rank. Does similar validation performance at ranks 2 and 4 prove an intrinsic population rank of 2?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Choose nonzero off-diagonal entries whose product is 1. Separate an algebraic statement about this completed matrix from a finite experiment's evidence."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"The matrix [[1,3],[1/3,1]] has determinant 1−3×(1/3)=0 and is nonzero, so its rank is one. Its second row is one-third of its first. It fits both observations while choosing different missing values. Similar validation scores only say that the particular trained settings were not distinguished on that evaluation. Noise, sample size, optimization and regularization can obscure differences; they do not identify the rank of an unobserved population matrix."}</Prose>

</details>

<H3>{"D. Recompute a simultaneous gradient step"}</H3>

<Prose>{"Use p=(.2,.4), q=(−.3,.5), user bias .05, item bias .1, rating 2, mean 3, λ=.2 and η=.1 in the local gradient objective. Determine the error's sign and all updated values. Explain which buffers a finite-difference comparison needs."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"The old score is 3.29. Use its single old error for every gradient before recomputing any score."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"The error r−s is −1.29. Loss gradients for (p₁,p₂,q₁,q₂,bᵤ,bᵢ) are (−.347,.725,.198,.616,1.3,1.31). Subtracting η times these gradients gives p′=(.2347,.3275), q′=(−.3198,.4384), bᵤ′=−.08 and bᵢ′=−.031. The new score is about 2.957519; the declared local objective falls from .8873 to .504838. The complete changed loss, including its local penalty, is the finite-difference target. Using p′ inside q's update would instead calculate another operation and would not equal these simultaneous gradients. The retained changed-program output demonstrates that comparison without requiring another historical fit."}</Prose>

</details>

<H3>{"E. Match the penalty to the equation"}</H3>

<Prose>{"One user has four observed records. One objective includes λ‖p‖²/2 inside each record; another includes it once per entity. Which normal-system diagonal matches the first objective? What changes for a user with no records?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Collect all copies of this user's penalty before differentiating."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Four copies contribute 4λ‖p‖²/2, so the normal system adds 4λI rather than λI. With no records, this degree-weighted objective has no term involving p and does not identify it uniquely. Selecting p=0 is then a convention. A positive once-entity penalty still exists for an empty user and uniquely minimizes that block at zero. Therefore matching a parameter named “regularization” is insufficient; match the complete summed objective and its population."}</Prose>

</details>

<H3>{"F. Solve a changed implicit block"}</H3>

<Prose>{"Keep item vectors (1,0), (0,1), (1,1), but use counts (0,3,1), α=1 and λ=2. Form targets, confidence, A and b; solve for p and calculate the block objective. What happens if all counts become zero?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"The first pair still contributes confidence 1 to curvature. Only positive-target pairs enter the right-hand side."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Targets are (0,1,1) and confidence is (1,4,2). The outer products plus 2I give A=[[5,2],[2,8]], while b=(2,6). With determinant 36, solving yields p=(1/9,13/18). Its scores are (1/9,13/18,5/6), approximately (.111111,.722222,.833333). The full weighted squared residual plus penalty is 13/9, including the unobserved first pair. The augmented least-squares route agrees with this normal system. With all counts zero, b=0 and positive λ gives p=0; dropping every unobserved pair would describe a different objective."}</Prose>

</details>

<H3>{"G. Diagnose a reversed pair"}</H3>

<Prose>{"Use p=(1,.5), positive item qᵢ=(.5,1), sampled item qⱼ=(1.5,0), η=.1 and λ=.1. Calculate the old gap and one updated gap. Must one update correct the order or improve full-list NDCG?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Use g=σ(−Δ), and keep all three old vectors until every update is calculated."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Old scores are 1 and 1.5, so Δ=−.5 and g≈.622459. The new vectors are p′≈(.927754,.557246), qᵢ′≈(.557246,1.021123) and qⱼ′≈(1.422754,−.031123). Their new gap is about −.216619. The local loss falls from 1.211577 to 1.034794, yet the pair remains reversed. This is progress on one regularized sampled comparison, not a complete order repair or a guarantee about held-out full-list quality. The sampler and assessment populations still matter."}</Prose>

</details>

<h4 className="rec-practice-transfer-heading">Coding transfer: change the training population</h4>

<Prose>{"Copy the complete BPR source into your local source directory, but do not run its training main. Implement a wrapper "}<code>{"population_summary"}</code>{" that builds the declared occurrence/eligibility population and computes its probability-weighted local loss at fixed factors. Use binary history [[1,0,1,0],[0,1,0,0],[1,1,0,0]], six occurrence records a=(U0,I0), b=(U0,I2), c=(U1,I1), d=(U2,I0), e=(U2,I1) and f=(U0,I0), and eligible items [I0,I1,I2]. Record f is a separate positive occurrence, not a new positive pair. Use p=[[1],[2],[3]], q=[[0],[1],[2],[100]], λ=0; I3's large value must not enter any route. Modify the wrapper to support both uniform routes and uniform eligible users. Do not change the full observed history when filtering items."}</Prose>

<Prose>{"Success means seven routes with occurrence IDs [a,b,c,c,d,e,f], user masses [3/7,2/7,2/7] for uniform routes and [1/3,1/3,1/3] for uniform users, and a weighted loss agreeing with direct scalar softplus on the seven gaps. Deduplicating (U0,I0) is a bug: it silently changes the objective. An empty eligible set must return unavailable, without a division by zero or a fit. The complete solution file "}<code>{"practice-bpr-population.py"}</code>{" is a separate practice download; it does not replace or run the reference trainer."}</Prose>

<details><summary>Get a coding hint</summary>

<Prose>{"Use "}<code>{"occurrence_population"}</code>{" for legal routes, retaining its "}<code>{"records"}</code>{", then "}<code>{"sampler_distribution"}</code>{" for probabilities. Compute the loss from each actual route and its probability, rather than averaging distinct tuple values. For the independent scalar check, the negatives of the seven gaps are [1,−1,−2,2,6,3,1]. Uniform users require a mean within each user's routes, then a mean of the three user means."}</Prose>

</details>

<details><summary>Show coding solution</summary>

<Prose>{"This wrapper changes actual input records and training-objective weights. The reference helpers expose the same objective without invoking a trainer. The assertions use a separate scalar softplus and verify occurrence IDs, negative eligibility, both user masses and the null case. Keep the practice file beside the reference file and run "}<code>{"python practice-bpr-population.py"}</code>{", or pass "}<code>{"--sources"}</code>{" with that directory."}</Prose>

<RecCanonicalProgram language="python" filename="practice-bpr-population.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/practice-bpr-population.py" decodedSHA256="50676f5ed1b326b245e8240a7ed117e5edd4d7c6bb1a47af937b145a2143b0fa" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/practice-bpr-population.py.stdout.txt" download="practice-bpr-population.py.stdout.txt">Download the complete recorded practice output for practice-bpr-population.py</a>.</Prose>

<Prose>{"Recorded output from this changed-input practice, with fixed factors and no training fit:"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"routes\": [\n    [\n      0,\n      0,\n      1\n    ],\n    [\n      0,\n      2,\n      1\n    ],\n    [\n      1,\n      1,\n      0\n    ],\n    [\n      1,\n      1,\n      2\n    ],\n    [\n      2,\n      0,\n      2\n    ],\n    [\n      2,\n      1,\n      2\n    ],\n    [\n      0,\n      0,\n      1\n    ]\n  ],\n  \"uniformTripleUserMass\": {\n    \"0\": 0.42857142857142855,\n    \"1\": 0.2857142857142857,\n    \"2\": 0.2857142857142857\n  },\n  \"uniformUserMass\": {\n    \"0\": 0.3333333333333333,\n    \"1\": 0.3333333333333333,\n    \"2\": 0.3333333333333333\n  },\n  \"uniformTripleLoss\": 2.0349577316217267,\n  \"uniformUserLoss\": 2.2107959611945325,\n  \"emptyAvailable\": false\n}"}</CodeBlock>

<Prose>{"The repeated U0/I0 route retains its own f identity. Under uniform users, each of U0's three routes has weight 1/9; each U1/U2 route has weight 1/6. Changing those weights changes the loss being optimized even before an update. No held-out quality conclusion follows from a population calculation."}</Prose>

</details>

<H3>{"H. Keep the evaluator's denominator fixed"}</H3>

<Prose>{"With relevant items {0,1}, list [4,1,2,0,3] and K=2, calculate precision, recall, reciprocal rank, AP and NDCG. Move item 1 to the first slot. If retrieval entirely omits item 0, can reranking reach recall 1?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Use the lesson's AP denominator min(K,R). The ideal contains both eligible relevant items even if the candidate generator misses one."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Initially one of two returned items is relevant: precision=recall=.5. Its first hit is at rank 2, so RR=.5. AP=(1/2)/2=.25. DCG=1/log₂3 and IDCG=1+1/log₂3, giving NDCG≈.386853. With item 1 first, precision and recall remain .5, RR=1, AP=.5 and NDCG≈.613147. If item 0 is absent from candidates, only one of the two relevant items can be returned, giving a recall ceiling of .5. Reducing R to the retrieved relevant set conceals that candidate failure."}</Prose>

</details>

<H3>{"I. Explain a new item's limits"}</H3>

<Prose>{"A metadata map gives a new item a factor vector. A new user has no history or declared preferences. Can a dot product establish individual personalization? Propose a defensible first list and an assessment."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Cold-item and cold-user problems are different missing inputs. Ask what evidence supports the user port, not only whether the arrays have matching widths."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"The map supplies the item representation, not a justified user representation. An arbitrary p does not establish this person's taste. One possible response is an eligible popular list with subject diversity and optional lightweight onboarding; a contextual baseline is another defensible choice if its inputs are declared. Assess held-out new users and items using metadata available at request time, report fallback coverage, and measure the intended useful outcome. Several policies can be reasonable. Their evidence, permissions and outcome criteria determine whether the proposal is sound."}</Prose>

</details>

<H3>{"J. Change the logging mixture"}</H3>

<Prose>{"Rewards occur with probabilities .4 for action A and .8 for B. Logging chooses each action with probability .5; the target chooses A with .25 and B with .75. Calculate raw and IPS expectations and the one-request IPS variance. Diagnose logging B=0 when the target still gives B positive probability."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Reward weights are .5 for A and 1.5 for B. Enumerate action and reward before subtracting the squared expectation from the second moment."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Raw expectation is .5×.4+.5×.8=.6. The target/IPS expectation is .25×.4+.75×.8=.7. The weighted second moment is .5×.4×.5²+.5×.8×1.5²=.95, so variance=.95−.7²=.46. If B has no logging support, the logs cannot identify its reward distribution under a target that chooses B. Knowing B's toy reward probability from the question does not make that quantity available in an actual A-only dataset."}</Prose>

</details>

<H3>{"K. Interpret the changed experiment report"}</H3>

<Prose>{"The retained complete experiment includes a predeclared cutoff-18 comparison with test_start=26. Read its saved output. Report split sizes, selected settings, baseline and factor errors and cold-user count. Then propose a fresh assessment for a newly released item."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"The comparison is already declared and printed. It is not a search through test results for a favorable cutoff. Distinguish data used to select from data used to assess."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"The split is 18/7/6. Validation selects rank 2 and penalty .2 with RMSE≈1.180979. Test RMSE is about 1.111143 for the shrunk-item baseline and 1.128322 for factors. There are five warm-user events and one cold-user event; the latter factor error is about .671405. This tiny synthetic outcome supports neither population superiority nor robust cold-start performance nor causal benefit. It preserves the weaker factor result instead of disguising it."}</Prose>

<Prose>{"For a new-item assessment, reserve items released after fitting and use only metadata available before each request. Keep their later interactions out of factor fitting and feature construction until the declared boundary permits them. Compare an explicit content/hybrid fallback with an eligible nonpersonalized/content baseline, report new-item coverage and the intended outcome or ranking metric, and retain a later untouched period. Future rating means are not legal initial metadata."}</Prose>

</details>

<H3>{"L. Calculate the user-centered alternative"}</H3>

<Prose>{"Use ratings [[5,1,missing],[4,2,3],[1,5,5]]. Predict U0's missing I2 rating using full-training user means, cosine of user-mean-centered values on common items, minimum common support 2 and all signed eligible neighbors. Compare a positive-neighbor-only policy."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"The first two items form both overlaps. Do not include the missing target in U0's mean. Center similarities with the declared full-row means."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Means are 3, 3 and 11/3. U0's overlap residuals are [2,−2]; U1's are [1,−1], so their similarity is 1. U2's overlap residuals are [−8/3,4/3], giving similarity −3/√10. Their I2 residuals are 0 and 5−11/3=4/3. The prediction is therefore 3+[1×0+(−3/√10)×(4/3)]/[1+3/√10] =3−4/(√10+3)≈2.350889. Positive-only selection retains U1 and gives 3. Centering each pair by its overlap means changes the similarity definition; silently switching to that Pearson convention is not evidence of parity."}</Prose>

</details>

<H3>{"M. Distinguish score invariance from penalty invariance"}</H3>

<Prose>{"Let p=q=(1,0) and A=diag(2,1). Use p′=Ap and q′=A⁻ᵀq. If the dot product stays unchanged, must a positive once-entity L2 objective stay unchanged?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Calculate the two new vectors and their squared norms separately. Compare with an orthogonal rotation."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"p′=(2,0) and q′=(.5,0) still have dot product 1. The squared-norm sum changes from 1+1=2 to 4+.25=17/4. Thus unchanged predictions do not preserve a positive isotropic L2 penalty under every invertible coordinate transformation. An orthogonal rotation preserves both dot products and norms, leaving that objective unchanged. Anonymous factor coordinates therefore lack a unique semantic axis even though regularization limits some rescaling freedoms."}</Prose>

</details>

<H3>{"N. Keep the history step simultaneous"}</H3>

<Prose>{"Take p=(0,0), q=(1,0), two unique history vectors y₀=(1,0), y₁=(0,1), mean 3, rating 5, η=.1 and λ=0. Hold the biases fixed at zero for this factor-only calculation. Compute one simultaneous factor/history update and diagnose using the new q inside y's update. What does a duplicated rating occurrence change?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"h=(1,1)/√2 and e=2−1/√2. Every derivative reads the old h and old q."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"The old score is 3+1/√2. With e=2−1/√2, p′=(.1e,0), q′=(1+.1e/√2,.1e/√2), y₀′=(1+.1e/√2,0) and y₁′=(.1e/√2,1). Using q′ in the two history updates adds artificial terms of order η² and does not implement the gradient of the original old-buffer loss. In the canonical scratch convention a duplicate rating occurrence repeats a loss term but does not duplicate the unique history set or its √2 denominator. Counted HKV confidence is another rule. Surprise's occurrence-list history can instead repeat that item and normalize by the larger list length, so the scratch deduplication must not be generalized to the library."}</Prose>

</details>

<H3>{"O. Solve one constrained item-weight column"}</H3>

<Prose>{"For X=[[1,1,0],[0,1,1],[1,0,0]] and λ=1, predict I2 with learned item weights whose self-weight is zero. Solve the excluded-column ridge system and score the row [1,1,0]. Why is setting only the final predicted value to zero a different operation?"}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"The remaining I0/I1 design has normal system A=[[3,1],[1,3]] and b=[0,1]. The constraint belongs to the coefficient column during fitting."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"The determinant is 8, giving weights −1/8 and 3/8 on I0 and I1 and zero on I2. The row's score is −1/8+3/8=1/4. In the full inverse-Gram route, P₂₂=8/13 and the off-diagonal ratios −P₀₂/P₂₂, −P₁₂/P₂₂ yield the same coefficients. P is symmetric, but division by each column's own diagonal does not generally make B symmetric. The zero self-coefficient prevents direct copying of an observed input item; erasing a final prediction after fitting does not impose that fitting constraint or repair the other coefficients."}</Prose>

</details>

<H3>{"P. Separate entry risk from observed-entry averages"}</H3>

<Prose>{"Use losses [1,4;2,3] and propensities [1,.5;.25,1]. Compute the expected observed-entry mean and the fixed-four-entry IPS risk. Diagnose replacing a positive-target cell's propensity with zero."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Losses 1 and 3 are always observed. Optional-cell states none, only loss 4, only loss 2 and both have probabilities 3/8,3/8,1/8,1/8."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Those four states have observed means 2,8/3,2,5/2. Their expectation is (3/8)2+(3/8)(8/3)+(1/8)2+(1/8)(5/2)=37/16. Using the fixed denominator 4 and inverse propensities instead gives state risks 1,3,3,5, whose expectation is 5/2, the complete-grid mean. An individual IPS value 5 can exceed the range of the original four losses; unbiased expectation does not mean each sample equals truth. Positive target weight with zero observation propensity is unidentified. An absent Retail purchase does not provide a known exposure propensity, and this entry-risk unit is different from the request-action policy tree in J."}</Prose>

</details>

<H3>{"Q. Diagnose a saved item-ID fault"}</H3>

<Prose>{"A saved Q has the expected width, but I0/I1 names are swapped without moving their factor rows. A new checksum is calculated over the resulting bytes. Does that prove the rule retains the intended item meanings? State a valid repair and the empty-history boundary."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Trace one named item's dot product to its fitted row. Hash integrity and the intended schema mapping answer different questions."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Matching dimensions prove only that the multiplication can be formed. A fresh checksum can faithfully identify a wrongly named state. Compare the complete bundle with its expected source, reference IDs, row order and parameters. Restore the original map, or deliberately permute the item IDs, Q rows and all corresponding CSR columns together. A stale name-only permutation is invalid. In the declared positive-λ HKV rule, an empty fixed history gives b=0 and p=0. Biased-rating baselines and SVD++'s separate explicit p describe different empty-history contexts and should not inherit that conclusion indiscriminately."}</Prose>

</details>

<h4 className="rec-practice-transfer-heading">Coding transfer: repair and query a saved bundle</h4>

<Prose>{"Implement "}<code>{"permute_bundle"}</code>{", replacing the faulty repair that changes only the ID list. Use a new fixed analytical bundle: IDs [I0,I1,I2], Q=[[1,0],[0,1],[1,1]], one CSR history row [1,0,2], discovery eligibility [false,true,false], λ=2 and α=2. A separate stored training-P sentinel [[8,9]] must remain untouched; query P is recalculated from the fixed history and final Q. This small fixture is not a fitted Retail state."}</Prose>

<Prose>{"Change the item order to [I2,I0,I1]. Repair Q rows, CSR columns and eligibility columns together, then call the existing "}<code>{"fixed_history_query"}</code>{" without a training sweep. Compare results by item ID, rather than array position. Your success criteria are query A=[[10,5],[5,8]], b=[8,5], query p=[39/55,10/55], and named scores I0=39/55, I1=10/55, I2=49/55 in both valid orderings. Only I1 is discovery-eligible. The name-only repair must fail this named-score invariant; an empty history must produce p=0 under positive λ. Inputs and stored training P must not mutate. Also reject a proposed permutation with duplicate or missing positions."}</Prose>

<details><summary>Get a coding hint</summary>

<Prose>{"Use a complete bijection of item positions. Apply it to Q's row axis but to history/eligibility's column axis. Inference sums q qᵀ terms, so consistent reordering preserves A and b. Do not use stored training P as query P. Here observed confidences are 3 and 5; the unobserved I1 still contributes its confidence-one Gram term. Solve the two scalar equations to check the query before comparing any renamed score."}</Prose>

</details>

<details><summary>Show coding solution</summary>

<Prose>{"The repaired bundle copies every item-owned axis while preserving the distinct user-owned training row. The query helper's guarded study main is never called; this runs only inference on the new fixed arrays. The intermediate equations 10p₀+5p₁=8 and 5p₀+8p₁=5 give p₀=39/55 and p₁=10/55. After permutation, the history is [2,1,0] and the one eligible item still has ID I1. Integrity alone cannot save a name-only reassignment: the numeric scores would be attached to different semantic IDs. Keep the solution beside "}<code>{"recommender-retail-study.py"}</code>{" and run "}<code>{"python practice-saved-item-map.py"}</code>{", or pass "}<code>{"--sources"}</code>{" with that directory."}</Prose>

<RecCanonicalProgram language="python" filename="practice-saved-item-map.py" source="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/practice-saved-item-map.py" decodedSHA256="752aa975561c80d029b5e4c3cb1517468726db2f32e4910ba3a9e83032a71d6d" />
<Prose><a href="/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/practice-saved-item-map.py.stdout.txt" download="practice-saved-item-map.py.stdout.txt">Download the complete recorded practice output for practice-saved-item-map.py</a>.</Prose>

<Prose>{"Recorded output from this changed-input practice, with fixed factors and no training fit:"}</Prose>

<CodeBlock language={"json"}>{"{\n  \"queryA\": [\n    [\n      10.0,\n      5.0\n    ],\n    [\n      5.0,\n      8.0\n    ]\n  ],\n  \"queryB\": [\n    8.0,\n    5.0\n  ],\n  \"queryP\": [\n    0.7090909090909091,\n    0.18181818181818182\n  ],\n  \"namedScores\": {\n    \"I0\": 0.7090909090909091,\n    \"I1\": 0.18181818181818182,\n    \"I2\": 0.8909090909090909\n  },\n  \"nameOnlyFaultScores\": {\n    \"I2\": 0.7090909090909091,\n    \"I0\": 0.18181818181818182,\n    \"I1\": 0.8909090909090909\n  },\n  \"repairedNamedScores\": {\n    \"I2\": 0.8909090909090909,\n    \"I0\": 0.7090909090909091,\n    \"I1\": 0.18181818181818182\n  },\n  \"eligibleOrder\": [\n    \"I1\"\n  ],\n  \"emptyQueryP\": [\n    [\n      0.0,\n      0.0\n    ]\n  ]\n}"}</CodeBlock>

<Prose>{"The assertions exercise named scores, the eligibility order, the CSR column map, zero history and input immutability. A consistent permutation preserves the rule; moving only labels produces a different named rule even if a newly calculated checksum faithfully identifies those bytes."}</Prose>

</details>

<H3>{"R. Report the real task without changing the winner"}</H3>

<Prose>{"Suppose validation selects popularity. Only 48 of 200 test customers have eligible discovery truth in the fixed catalogue, while many purchases lie outside it. What may the report claim, and which rule must the saved consumer serve? Propose one independent extension."}</Prose>

<details><summary>Get a hint</summary>

<Prose>{"Locate both pretruth locks, the qualified-user denominator and the all-user coverage denominator. Unknown exposure is still unknown after scoring."}</Prose>

</details>

<details><summary>Show explained solution</summary>

<Prose>{"Serve the actual selected popularity rule. A best-ALS inspector remains a comparison and must not be relabelled the winner. Report all baseline/factor outcomes, macro metrics over the 48 qualified customers, coverage over all 200, outside-catalogue truth and null metrics for users without qualifying truth. Paired intervals are conditional on the declared task/cohort and do not remedy unobserved exposure or catalogue omissions. Keep both selection locks, warnings and fixed candidate filters; do not select a different cohort or rule after seeing test outcomes. An extension could evaluate replenishment with a newly declared repeat-item target and independent later period, or compare a larger train-selected catalogue. It needs its own prospective protocol rather than retroactive relabelling of this discovery assessment. Reproducible reports and honest limits do not imply a required score improvement or a causal benefit."}</Prose>

</details>

<H3>{"Readiness and the next topic"}</H3>

<Prose>{"Explain how one named rating, count or history occurrence becomes a model term. Calculate a changed update or solve without mixing old and new buffers. Diagnose a wrong denominator, confidence encoding, saved ID map or unavailable historical input. Then choose an assessment that can answer the actual decision question. The solved tasks give concrete checks of these skills; they do not guarantee every future recommendation problem is solved by the same finite method list."}</Prose>

<Prose>{"The next topic is "}<strong>{"Multi-Label & Multi-Output Learning"}</strong>{". It also asks for several outputs for one input, but its reviewed targets, missingness and loss need their own definition: a sortable item score table is not already a joint label probability model. Follow the course's Next control in curriculum order. The optional degree-adjusted graph branch connects to "}<strong>{"Message Passing / Graph Convolutions"}</strong>{", where the full aggregation and graph-learning machinery is taught; the local recommendation forward remains understandable on its own."}</Prose>

<H3>{"Further learning"}</H3>

<Prose>{"These are alternate explanations and activities, rather than required links for completing the core worked examples."}</Prose>

<ul><li>{""}<strong>{"Leskovec, Rajaraman and Ullman — "}<a href={"http://infolab.stanford.edu/~ullman/mmds/ch9.pdf"}>{"Mining of Massive Datasets, chapter 9"}</a>{"."}</strong>{" Freely available book chapter; begin after the evidence and neighborhood sections. Its utility matrices, co-rating/normalization, factor nonuniqueness and exercises offer a longer beginner-to-intermediate route. The historical Netflix setting explains motivations, not current universal performance."}</li><li>{""}<strong>{"Zhang et al. — Dive into Deep Learning, "}<a href={"https://d2l.ai/chapter_recommender-systems/recsys-intro.html"}>{"overview"}</a>{", "}<a href={"https://d2l.ai/chapter_recommender-systems/movielens.html"}>{"data"}</a>{", "}<a href={"https://d2l.ai/chapter_recommender-systems/mf.html"}>{"matrix factors"}</a>{" and "}<a href={"https://d2l.ai/chapter_recommender-systems/ranking.html"}>{"ranking"}</a>{"."}</strong>{" Interactive book and code, intermediate after the local factor/gradient walkthrough. Selected version-1.0.3 sections were read. Its strictly positive rating-scale zero shortcut and data split differ from this lesson's explicit finite-zero mask and global train/choice/test replay; API and dataset-license requirements need separate attention."}</li><li>{""}<strong>{"Google Developers — "}<a href={"https://developers.google.com/machine-learning/recommendation/collaborative/matrix"}>{"matrix-factorization lesson"}</a>{"."}</strong>{" Short introductory visual explanation of shared user/item representations. Compare its weighting discussion with the distinction between observed ratings and all-pair confidence here; it does not establish equality of every library objective."}</li><li>{""}<strong>{"Stanford CS246 — "}<a href={"https://snap.stanford.edu/class/cs246-videos-2019/"}>{"public 2019 lecture archive"}</a>{" and "}<a href={"https://snap.stanford.edu/class/cs246-2025/WWW/slides/07-recsys1.pdf"}>{"recommendation slides"}</a>{"."}</strong>{" Recommender Systems I (January 29) and II (January 31) are a spoken companion for the intermediate neighborhood/factor material. The public listing and selected companion slides' co-rating/centering content were inspected; no full-video viewing is claimed. These are conceptual resources, not current package installation instructions."}</li></ul>

<H3>{"Technical references"}</H3>

<Prose>{"The following sources support the declared equations, assumptions, implementation conventions and data provenance."}</Prose>

<ul><li>{""}<strong>{"Sarwar et al. — "}<a href={"https://grouplens.org/site-content/uploads/Item-Based-WWW-2001.pdf"}>{"Item-Based Collaborative Filtering Recommendation Algorithms"}</a>{", §§3.1–3.3."}</strong>{" Original cosine/Pearson/adjusted-cosine definitions, weighted prediction and precomputation. The selected co-rater formulas were read from rendered pages; signed residual prediction and positive-neighbor aggregation remain different policies."}</li><li>{""}<strong>{"Koren, Bell and Volinsky — "}<a href={"https://gwern.net/doc/ai/tabular/2009-koren.pdf"}>{"Matrix Factorization Techniques for Recommender Systems"}</a>{"."}</strong>{" The original eight-page paper, hosted on a mirror, develops biased factors and implicit history. Its illustrative genre axes do not establish identifiable learned coordinates; its historical comparisons do not declare a universal winner."}</li><li>{""}<strong>{"Salakhutdinov and Mnih — "}<a href={"https://papers.nips.cc/paper/2007/file/d7322ed717dedf1eb4e6e52a37ea7bcd-Paper.pdf"}>{"Probabilistic Matrix Factorization"}</a>{", equations 1–5."}</strong>{" Gaussian masked likelihood and prior yield the variance-ratio once-entity MAP penalty. A MAP vector is a point estimate, not automatically a posterior uncertainty interval."}</li><li>{""}<strong>{"Hu, Koren and Volinsky — "}<a href={"https://yifanhu.net/PUB/cf.pdf"}>{"Collaborative Filtering for Implicit Feedback Datasets"}</a>{", §§3–5."}</strong>{" Confidence-weighted all-pair loss, cached Gram normal equations and inverse-system score contributions. Missing-pair confidence 1 supplies curvature; an exact signed score decomposition is not a causal explanation."}</li><li>{""}<strong>{"Rendle et al. — "}<a href={"https://arxiv.org/pdf/1205.2618"}>{"BPR: Bayesian Personalized Ranking from Implicit Feedback"}</a>{", §§3–4."}</strong>{" Preference triples, posterior objective, bootstrap sampling and factor derivatives. The original publication predates its arXiv upload; sampler populations determine the objective being approximated."}</li><li>{""}<strong>{"Steck — "}<a href={"https://arxiv.org/pdf/1905.03375"}>{"Embarrassingly Shallow Autoencoders for Sparse Data"}</a>{", §§3–3.4."}</strong>{" Constrained ridge, zero diagonal and inverse-Gram column normalization. The dense solve's item² storage and cubic work are material limitations."}</li><li>{""}<strong>{"Schnabel et al. — "}<a href={"https://proceedings.mlr.press/v48/schnabel16.pdf"}>{"Recommendations as Treatments"}</a>{", §§3.1–4.2."}</strong>{" Selection, propensity-weighted entry risk, support and variance. Entry-observation propensities and request-action logging probabilities require different units; this Retail dataset supplies neither exposure mechanism."}</li><li>{""}<strong>{"He et al. — "}<a href={"https://arxiv.org/pdf/2002.02126"}>{"LightGCN"}</a>{", §§3.1–3.3."}</strong>{" Bipartite degree-adjusted aggregation and layer mixtures support the bounded graph forward. The local calculations do not reproduce its complete graph-training experiments or assert present superiority."}</li><li>{""}<strong>{"implicit — "}<a href={"https://benfred.github.io/implicit/api/models/cpu/als.html"}>{"CPU ALS API"}</a>{", "}<a href={"https://benfred.github.io/implicit/api/models/cpu/bpr.html"}>{"CPU BPR API"}</a>{", "}<a href={"https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/als.py"}>{"0.7.3 ALS source"}</a>{", "}<a href={"https://github.com/benfred/implicit/blob/v0.7.3/implicit/cpu/bpr.pyx"}>{"BPR source"}</a>{" and "}<a href={"https://pypi.org/project/implicit/"}>{"release record"}</a>{"."}</strong>{" The versioned source determines positive stored confidence, signed target-zero entries, filtering/recalculation and the BPR sampler/item-bias implementation. API documentation's banner version and the actual executed package version are separate facts."}</li><li>{""}<strong>{"Surprise — "}<a href={"https://surprise.readthedocs.io/en/stable/matrix_factorization.html"}>{"matrix-factorization API"}</a>{", "}<a href={"https://surprise.readthedocs.io/en/stable/knn_inspired.html"}>{"KNN API"}</a>{", "}<a href={"https://surprise.readthedocs.io/en/stable/similarities.html"}>{"similarities"}</a>{", "}<a href={"https://github.com/NicolasHug/Surprise/tree/v1.1.5/surprise"}>{"1.1.5 source"}</a>{" and "}<a href={"https://pypi.org/project/scikit-surprise/"}>{"release record"}</a>{"."}</strong>{" Named raw/inner IDs, pair-overlap Pearson centering, full-row mean prediction, positive neighbors and occurrence-list SVD++ history are the relevant contracts. Its initialization and record penalties need not match the scratch objective."}</li><li>{""}<strong>{"Chen — "}<a href={"https://archive.ics.uci.edu/dataset/352/online+retail"}>{"UCI Online Retail"}</a>{", DOI 10.24432/C5BW33, CC BY 4.0."}</strong>{" Dataset provenance, fields, time range and redistribution license. The prepared subset credits the source and states transformations; invoices do not establish exposure or stock availability."}</li><li>{""}<strong>{"Covington, Adams and Sargin — "}<a href={"https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/"}>{"Deep Neural Networks for YouTube Recommendations"}</a>{"."}</strong>{" The official 2016 abstract supports the historical separation of candidate generation and ranking. It is not a claim about today's entire deployed service."}</li></ul>
  </div></RecommenderStudyProvider></RecommenderPolicyProvider></RecommenderRankingProvider></RecommenderHistoryProvider></RecommenderImplicitProvider></RecommenderFactorProvider></RecommenderEvidenceProvider>;
}
export default {
  title: 'Recommender Systems (Collaborative Filtering, Matrix Factorization)',
  readTime: '~120 min read + 2–3 hours practice',
  content: RecommenderContent
};
