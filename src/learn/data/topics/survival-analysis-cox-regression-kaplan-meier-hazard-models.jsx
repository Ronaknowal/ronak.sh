import { H2, H3 } from '../../components/content/Headings.jsx';
import { Prose } from '../../components/content/Prose.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { CodeBlock } from '../../components/content/Code.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { SurvivalLessonState } from '../../components/lesson-labs/survival-reading-flow/SurvivalLessonState.jsx';
import { EventClockFigure, ObservationCutoffFigure, InformationTimeFigure, UnknownTailFigure, RecordingSelectionFigure, EntryVersusCensorFigure } from '../../components/lesson-labs/survival-reading-flow/ObservationFigures.jsx';
import { RiskSetCurveFigure, UncensoredCancellationFigure, ConditionalMassFigure, GreenwoodRiskFigure, SurvivalIntervalFigure, RestrictedAreaFigure, SearchTimeoutFigure } from '../../components/lesson-labs/survival-reading-flow/UnivariateFigures.jsx';
import { ConditionalRateFigure, AccumulatedRateFigure, AgeDependentRateFigure, DiscreteJumpFigure, DensityTailFigure, ExposureLikelihoodFigure, RateScoreFigure } from '../../components/lesson-labs/survival-reading-flow/RateFigures.jsx';
import { FailureAllocationFigure, AccumulatedGroupFigure, CrossingGroupsFigure } from '../../components/lesson-labs/survival-reading-flow/GroupComparisonFigures.jsx';
import { CoxCompetitionFigure, CoxFeatureBalanceFigure, NewtonBacktrackingFigure, SuffixMomentsFigure } from '../../components/lesson-labs/survival-reading-flow/CoxCompetitionFigures.jsx';
import { TiedDenominatorsFigure, SubsetRecurrenceFigure, SubsetFeatureFigure, SubsetMomentMergeFigure, AbsoluteSurvivalFigure, ReferenceChangeFigure } from '../../components/lesson-labs/survival-reading-flow/CoxTiesFigures.jsx';
import { ProportionalRatesFigure, ChangingEffectFigure, SchoenfeldResidualFigure, ScaledResidualFigure, EfficientTimeScoreFigure, SurvivorMixtureFigure, NonproportionalRemediesFigure } from '../../components/lesson-labs/survival-reading-flow/CoxAssumptionFigures.jsx';
import { ConcordancePairsFigure, FenwickConcordanceFigure, HorizonClassificationFigure, CensorWeightedLossFigure, ReverseKmFigure, ObservationSupportFigure, ConditionalObservationFigure, UnoPairWeightFigure, HorizonRocFigure, NearTieBlocksFigure, IntegratedBrierFigure, ProbabilityErrorFigure } from '../../components/lesson-labs/survival-reading-flow/MetricFigures.jsx';
import { AcceleratedTimeFigure, AftObservationFigure, SurvivalTreeFigure, SurvivalSplitFigure, WeightedPrefixTreeFigure, BootstrapForestFigure, ForestAggregationFigure, OutOfBagFigure } from '../../components/lesson-labs/survival-reading-flow/TreeTimeFigures.jsx';
import { ConditionalForkFigure, PersonPeriodObservationFigure, OddsVersusRateFigure, SmallProbabilityFigure, IntervalBlockSolverFigure, NeuralCoxAnatomyFigure, NeuralScoreGradientFigure, CoxGradientScanFigure, NeuralRiskBatchFigure, TimeDependentNeuralScoreFigure } from '../../components/lesson-labs/survival-reading-flow/DiscreteNeuralFigures.jsx';
import { CompetingAnatomyFigure, CompetingCohortFigure, CompetingAllocationFigure, SimultaneousCausesFigure, CompetingTransitionFigure, CompetingRateFigure, NetVersusIncidenceFigure, SubdistributionPopulationFigure, RetainedCompetitorFigure, WeightedSubdistributionFigure, SubdistributionScanFigure, FineGrayExpansionFigure, IncoherentIncidenceFigure } from '../../components/lesson-labs/survival-reading-flow/CompetingFigures.jsx';
import { JointHeadAnatomyFigure, JointAccumulationFigure, JointLiveHeadFigure, JointObservationMaskFigure, JointMaskGradientFigure, JointCauseRankingFigure } from '../../components/lesson-labs/survival-reading-flow/JointHeadFigures.jsx';
import { DelayedEntryFigure, PredictableHistoryFigure, ActiveMomentTreeFigure, HistoryMomentMergeFigure, PrescribedHistoryCurveFigure, ImmortalTimeFigure, LandmarkFigure, ObservationTypeFigure, IntervalWidthFigure, RecurrentEventFigure, MultistateOccupancyFigure } from '../../components/lesson-labs/survival-reading-flow/HistoryFigures.jsx';
import { HeldOutReportFigure, RealCohortCurveFigure, StipulatedDecisionFigure, ComputationOwnershipFigure } from '../../components/lesson-labs/survival-reading-flow/ReportFigures.jsx';

function SurvivalLesson() { return <SurvivalLessonState><div className="lesson-flow survival-reading-flow">
<Prose opening="summary">{"Learn to answer a time-to-event question when observation can end before the event happens. We will follow pumps from commissioning, distinguish physical failure from lost follow-up, build a survival curve, fit and question a model, and turn its supported probabilities into an honest report. The same reasoning applies to server failures, subscription departures and programs that may finish after a timeout."}</Prose>

<Prose opening="prerequisites">{"Before you start, refresh fractions, conditional probability and logs in "}<a href={"/learn/path/full-curriculum/probability-distributions-bayes-theorem?module=math-foundations"}>{"Probability Distributions & Bayes’ Theorem"}</a>{", and features, fitted scores and held-out data in "}<a href={"/learn/path/full-curriculum/linear-logistic-regression?module=classical-ml"}>{"Linear & Logistic Regression"}</a>{". "}<a href={"/learn/path/full-curriculum/hypothesis-testing-confidence-intervals?module=math-foundations"}>{"Hypothesis Testing & Confidence Intervals"}</a>{" supplies the uncertainty and test-null background. Section 6 rebuilds likelihood from an observed event and a censored observation; use "}<a href={"/learn/path/full-curriculum/maximum-likelihood-map-estimation?module=math-foundations"}>{"Maximum Likelihood & MAP Estimation"}</a>{" if you want a separate refresher. No previous survival-analysis knowledge is assumed. Python functions and arrays help with the runnable examples; the neural branches later link their additional prerequisites where needed."}</Prose>

<Prose opening="route">{"For a first pass, read the main explanation in sections 1–7: observation, risk sets, curve, uncertainty, rate, likelihood and group comparison. Move the follow-up cutoff in section 1, inspect the day-four risk set in section 3, and change the supported area horizon in section 4. Run "}<code>{"observation-contract.py"}</code>{", then "}<code>{"kaplan-meier-example.py"}</code>{" beside its complete "}<code>{"survival_estimators.py"}</code>{" module in section 4. Compare that calculation with "}<code>{"kaplan-meier-library.py"}</code>{"; in section 6, "}<code>{"constant-rate-observations.py"}</code>{" beside "}<code>{"exponential_observations.py"}</code>{" connects the counts and exposure to a fitted rate."}</Prose>

<Prose opening="route">{"Continue through sections 8–11 to connect a feature to relative risk, an absolute curve, assumption checks and observable evaluation. Follow the coefficient and risk-share picture in section 8 and the profile-survival control in section 9; then change the observation chance in section 11 to see why support matters. For the code route, "}<code>{"cox-risk-set-example.py"}</code>{" uses the moment and optimizer modules displayed in section 8, "}<code>{"cox-absolute-survival.py"}</code>{" adds the section-9 baseline module, and "}<code>{"censor-aware-metrics.py"}</code>{" composes the section-11 metric modules. Keep their named companion files together. The first reading can follow the inputs, intermediate quantities and outputs before tracing every line of these longer implementations."}</Prose>

<Prose opening="route">{"Then read the model-choice and observation stories in sections 12–14: time stretching, tree routing, interval questions, competing first events, entry and dated information. Explore an interval probability and a competing cause rate, keeping track of which population reaches the next question. Follow the complete report in section 15 and attempt practices A–L in section 16. On a deeper return, trace the exact tied-subset recurrence in section 9, information adjustment in section 10, efficient counting in section 11, tree/bin solvers and neural heads in sections 12–13, and the active-history and interval-likelihood implementations in section 14. Their first paragraphs mark where the branch begins and where to rejoin. Practices M–Q exercise these deeper mechanisms."}</Prose>

<Prose opening="exploration">{"Use each live control to change the named quantity and follow its effect through the drawing and nearby result. Static diagrams keep their observations fixed; worked outputs identify their example and environment. Each complete program appears after the mechanism it implements, with its ordinary-library counterpart and relevant setup. You can read those results first, then run the selected examples with the shared code controls and file index when you are ready to inspect the implementation."}</Prose>

<H2>{"1. Define the event and start the clock"}</H2>

<Prose>{""}<strong>{"What if the number we want to predict has not been observed yet?"}</strong>{" We need to distinguish a pump failing from its logger stopping."}</Prose>

<EventClockFigure />

<Prose>{"Follow pump C along the day ruler. At day zero the workshop commissions it: this starts the clock. At day four its seal fails, and the logger records that failure. We know the first seal failure happened at four days. Now follow pump D. Its recording also ends at day four, but its seal is still working when the logger is removed. We know it got through four days; we do not know when it will fail. The matching endpoint positions do not mean the matching outcomes."}</Prose>

<Prose>{"This is the problem "}<strong>{"survival analysis"}</strong>{" studies: time to a defined event, using both exact event times and observations that only bound that time. Here “surviving” means remaining free of the first seal failure. It does not mean that a pump is immortal, or that a person is necessarily the subject. The same kind of question arises when a server fails, a subscriber leaves, or a search program finishes before a timeout. Each application needs its own event, clock and observation protocol."}</Prose>

<ObservationCutoffFigure />

<Prose>{"Each lane belongs to one newly commissioned pump. A filled endpoint means a recorded failure; an open endpoint means logging ended while the pump was still running. The day ruler is common to all eight lanes. A dashed line beyond an open endpoint means "}<strong>{"not observed"}</strong>{", rather than a known future failure."}</Prose>

<NeuralTable caption={"1. Define the event and start the clock"} headers={[<>{"Pump"}</>,<>{"Last observed day"}</>,<>{"What the record establishes"}</>]} rows={[[<>{"A"}</>,<>{"2"}</>,<>{"First seal failure at day2"}</>],[<>{"B"}</>,<>{"3"}</>,<>{"Still running at day3; later failure unknown"}</>],[<>{"C"}</>,<>{"4"}</>,<>{"First seal failure at day4"}</>],[<>{"D"}</>,<>{"4"}</>,<>{"Still running at day4; later failure unknown"}</>],[<>{"E"}</>,<>{"6"}</>,<>{"First seal failure at day6"}</>],[<>{"F"}</>,<>{"7"}</>,<>{"Still running at day7; later failure unknown"}</>],[<>{"G"}</>,<>{"8"}</>,<>{"First seal failure at day8"}</>],[<>{"H"}</>,<>{"9"}</>,<>{"Still running at day9; later failure unknown"}</>]]} />

<Prose>{"Move the follow-up limit to four days. A and C remain recorded failures; B still has its earlier logging endpoint. D, E, F, G and H are now recorded as running when observation ends at four. In particular, E's known day-six failure is outside this shortened recording. The shortened record must change both its time and its event flag. Otherwise we would falsely create a failure at day four. This control changes what was observed, while preserving the underlying historical record."}</Prose>

<Prose>{"We can now name the two things the logger supplies. Let "}<strong>{"T"}</strong>{" be the actual time to the first failure and "}<strong>{"C"}</strong>{" the potential end of follow-up. Both are measured in days since commissioning. The observed endpoint "}<strong>{"Y"}</strong>{" is whichever comes first, and the event flag "}<strong>{"δ"}</strong>{" is1 for a recorded failure and0 otherwise:"}</Prose>

<div className="neural-equation"><MathBlock>{"Y=\\min(T,C),\\qquad \\delta=I(T\\le C)."}</MathBlock></div>

<Prose>{"The expression "}<code>{"I(condition)"}</code>{" means1 if the condition is true and0 if it is false. For pump C, Y=4 and δ=1 give T=4. For pump D, Y=4 and δ=0 give T>4. An observation of the second kind is called "}<strong>{"right censoring"}</strong>{": the missing part is to the right of the recorded endpoint on the time axis. It is a useful inequality, rather than an empty cell to replace with zero."}</Prose>

<Prose>{"Our endpoint convention gives a recorded failure priority when it occurs exactly at the follow-up limit. C therefore remains an event at a cutoff of four. D, which was known to be running, remains censored. Rounded timestamps or another collection protocol require their own declared convention; row order must not decide which outcome is counted."}</Prose>

<Prose>{"The event flag and endpoint describe one incomplete target. Learning to predict δ alone would ask whether a failure gets recorded, which also depends on how long a pump is followed. Our intended question is about T: for example, how likely a newly commissioned pump is to remain seal-failure-free after five days."}</Prose>

<InformationTimeFigure />

<Prose>{"In the diagram, commissioning measurements travel forward into a prediction. The later failure or logging endpoint travels into the training response and evaluation. A final inspection note must not travel backward into a prediction claimed to have been made at commissioning. This is the same information boundary used in "}<strong>{"Linear & Logistic Regression"}</strong>{": an input must exist when the prediction is made. Survival analysis changes how the response is represented; it does not remove that boundary."}</Prose>

<Prose>{"The following complete program makes the record distinction explicit. "}<code>{"times"}</code>{" stores Y; "}<code>{"events"}</code>{" stores the Boolean version of δ. The loop prints an equality for an event and an inequality for a censored row. The cutoff uses "}<code>{"minimum"}</code>{" to shorten times and a second condition to retain only failures observed by that cutoff. Install NumPy in a separate Python environment to run this example; the numerical snapshot below uses NumPy2.3.5."}</Prose>

<Prose>{"Complete source — "}<code>{"observation-contract.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/observation-contract.py"} filename={"observation-contract.py"} language={"python"} title={"observation-contract.py"} />

<Prose>{"Its recorded output is:"}</Prose>

<CodeBlock language={"output"}>{"A Y=2 event=1 T = 2\nB Y=3 event=0 T > 3\nC Y=4 event=1 T = 4\nD Y=4 event=0 T > 4\nE Y=6 event=1 T = 6\nF Y=7 event=0 T > 7\nG Y=8 event=1 T = 8\nH Y=9 event=0 T > 9\nobserved-time mean: 5.375\ncompleted-only mean: 5.0\nNeither is an ordinary estimate of unrestricted mean lifetime here.\nadministrative cutoff 5: [2.0, 3.0, 4.0, 4.0, 5.0, 5.0, 5.0, 5.0]\nevents after cutoff are now censored: [1, 0, 1, 0, 0, 0, 0, 0]"}</CodeBlock>

<Prose>{"The first mean averages when recording stopped, not when every pump failed. The second averages only completed failures, excluding the still-running pumps. Neither answers the lifetime question. The last two lines also show why shortening times alone is insufficient: E and G no longer carry failure flags. Next we need to ask what these incomplete observations permit us to learn."}</Prose>

<H2>{"2. Decide what incomplete observation permits"}</H2>

<Prose>{""}<strong>{"Can the unrecorded part be filled in just by using a more flexible model?"}</strong>{" Two different lifetime completions can agree with every observed row."}</Prose>

<UnknownTailFigure />

<Prose>{"The left side repeats the observation lanes you just read. The middle completion imagines B, D, F and H failing at days4,5,8 and10 respectively. Each imagined failure is after that pump's actual logging endpoint. The right completion puts those failures at100,100,100 and1000. The four recorded failure times remain 2,4,6 and8 in both pictures. All eight observed rows therefore stay identical. But the completed eight-pump mean would be47/8=5.875 days in the middle picture and1320/8=165 days in the right one. Neither completion is a discovered fact. Their difference exposes how much of the full-cohort lifetime was not recorded."}</Prose>

<Prose>{"This distinction becomes sharper for a population quantity. Suppose a study ends all remaining logging at day nine. Two population lifetime laws can agree through day nine and put their remaining probability at day ten or day1000. They produce the same observation law through the study end, even with unlimited data collected under that limit. The unrestricted mean differs. "}<strong>{"Identification"}</strong>{" asks whether the target is determined by the observation law and assumptions. "}<strong>{"Estimation"}</strong>{" asks how precisely finite data can estimate an identified target. More rows can reduce estimation error; they cannot identify a tail that the observation protocol never reaches."}</Prose>

<Prose>{"The other concern is who remains visible. At each failure time we will use the still-observed running pumps to represent those no longer being followed. That requires a reason the visible group is comparable."}</Prose>

<RecordingSelectionFigure />

<Prose>{"For this separate constructed selection example, half the population has longer lifetimes and half has shorter lifetimes. These labels describe an imagined population; they are not future-lifetime inputs available to a real prediction. Keep the shorter-type logging retention probability fixed at1/2. Initially the longer-type retention probability is also1/2. Of one unit of population,1/4 is both longer-lived and retained, and1/4 is shorter-lived and retained. The retained half still has a50/50 composition."}</Prose>

<Prose>{"Now increase only the longer-type retention probability to1. Its retained mass becomes1/2; the shorter-type retained mass remains1/4. Among the retained3/4, the longer-lived fraction is(1/2)/(3/4)=2/3. The population did not become longer-lived: observation selected a different mixture. A survival estimate that treats the visible pumps as representative can be misleading."}</Prose>

<Prose>{"The usual starting condition is called "}<strong>{"independent censoring"}</strong>{". It says that the time logging could end does not provide additional information about failure time, within the population or measured-feature group for which the estimate is being made. With measured features X, write:"}</Prose>

<div className="neural-equation"><MathBlock>{"T\\ \\perp\\ C\\mid X."}</MathBlock></div>

<Prose>{"The symbol "}<code>{"⊥"}</code>{" means independence and "}<code>{"|X"}</code>{" means within a fixed measured-feature group. If temperature affects both scheduled observation and lifetime, mixing temperatures can induce an association even when the condition holds within each temperature group. An unadjusted population Kaplan–Meier curve needs its corresponding marginal noninformative-censoring condition; conditional independence alone is not permission to ignore X. Collecting extra columns or performing a random train/test split does not establish this condition."}</Prose>

<Prose>{"We also need "}<strong>{"support"}</strong>{" for the requested horizon. If comparable pumps have zero chance of being followed to that horizon, their outcomes cannot be learned from observed outcomes there. This positive-observation requirement is often called "}<strong>{"positivity"}</strong>{". In the selection picture, setting longer-type retention to zero removes that type entirely from the visible group. No division by a zero retention probability can restore what has never been observed."}</Prose>

<EntryVersusCensorFigure />

<Prose>{"Return to our pump clock. A pump followed from commissioning and known to be running at day three contributes the bound T>3. A different pump that failed before recruitment at day three might never enter the study at all. The open entry gate in the diagram marks this second mechanism. "}<strong>{"Delayed entry"}</strong>{", also called "}<strong>{"left truncation"}</strong>{", changes which subjects are sampled; it is not an ordinary censored row to insert into the original denominator. Section14 will draw the corresponding entry-aware risk sets."}</Prose>

<Prose>{"Keep other incomplete records distinct too:"}</Prose>

<NeuralTable caption={"2. Decide what incomplete observation permits"} headers={[<>{"Mechanism"}</>,<>{"Literal information"}</>,<>{"Example"}</>]} rows={[[<>{"Right censoring"}</>,<>{"T exceeds a recorded bound"}</>,<>{"Running when logging ends"}</>],[<>{"Left censoring"}</>,<>{"T is at or below a recorded bound"}</>,<>{"Already failed at first inspection"}</>],[<>{"Interval censoring"}</>,<>{"L<T≤R"}</>,<>{"Running at inspection L, failed at inspection R"}</>],[<>{"Delayed entry / left truncation"}</>,<>{"Only subjects surviving to entry can be sampled"}</>,<>{"Recruiting already-running pumps"}</>],[<>{"Competing first event"}</>,<>{"A different first event occurred"}</>,<>{"Motor failure prevents a later *first* seal failure"}</>]]} />

<Prose>{"For the elementary calculations below, one pump is one independent subject. Shared production batches or repeated failures from one device can introduce dependence. Their uncertainty and likelihood must reflect the actual sampling units; distributing related rows across training and test does not make them independent. We return to changing history and repeated events after the first-event model is established."}</Prose>

<Prose>{"Our next step is deliberately smaller than guessing every lifetime: under the stated censoring and support conditions, count the observed pumps getting through each failure time and combine those conditional fractions."}</Prose>

<H2>{"3. Count your way to a survival curve"}</H2>

<Prose>{""}<strong>{"How many of the pumps still being followed get through the next failure time?"}</strong>{" At day four, count six pumps before removing either same-time endpoint."}</Prose>

<RiskSetCurveFigure />

<Prose>{"In the highlighted day-four group, C, D, E, F, G and H are still observed just before that time. A has already failed and B's logging has already ended. The highlighted group is called the "}<strong>{"risk set"}</strong>{": subjects still under observation and event-free immediately before the time being considered. Its size is six. C then fails. D's logging ends at that same recorded time, but D belongs to the failure denominator under our declared endpoint convention. Five of the six get through the failure count, giving a conditional factor5/6. Only afterward does D leave the observation group."}</Prose>

<Prose>{"To see how this factor becomes a curve, start at commissioning. All eight pumps have not yet failed. At day two, A fails, giving factor7/8. B's censoring at day three does not record a failure, so it makes no downward step. At day four, multiply the already-surviving fraction7/8 by the new conditional fraction5/6. Call the estimated survival at day four "}<strong>{"Ŝ(4)"}</strong>{"; the hat marks an estimate from this observed cohort:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat S(4)=\\frac78\\frac56=\\frac{35}{48}\\approx0.729167."}</MathBlock></div>

<Prose>{"Its population target is "}<strong>{"S(t)=P(T>t)"}</strong>{": the probability of remaining event-free after time t. The product of conditional fractions is called the "}<strong>{"Kaplan–Meier estimator"}</strong>{", also known as the "}<strong>{"product-limit estimator"}</strong>{"."}</Prose>

<Prose>{"Continue along the same tokens. At day six, E, F, G and H remain in the risk set; E fails, giving3/4. F's logging ends at day seven without a survival drop. At day eight, G and H are still observed and G fails, giving1/2. H then leaves logging at day nine. The table keeps censor-only rows to make these removals visible, even though the estimated survival changes only at failures."}</Prose>

<NeuralTable caption={"3. Count your way to a survival curve"} headers={[<>{"Day"}</>,<>{"At risk just before"}</>,<>{"Failures"}</>,<>{"Logging ends without failure"}</>,<>{"Survival after this time"}</>]} rows={[[<>{"2"}</>,<>{"8"}</>,<>{"1"}</>,<>{"0"}</>,<>{"7/8"}</>],[<>{"3"}</>,<>{"7"}</>,<>{"0"}</>,<>{"1"}</>,<>{"7/8"}</>],[<>{"4"}</>,<>{"6"}</>,<>{"1"}</>,<>{"1"}</>,<>{"35/48"}</>],[<>{"6"}</>,<>{"4"}</>,<>{"1"}</>,<>{"0"}</>,<>{"35/64"}</>],[<>{"7"}</>,<>{"3"}</>,<>{"0"}</>,<>{"1"}</>,<>{"35/64"}</>],[<>{"8"}</>,<>{"2"}</>,<>{"1"}</>,<>{"0"}</>,<>{"35/128"}</>],[<>{"9"}</>,<>{"1"}</>,<>{"0"}</>,<>{"1"}</>,<>{"35/128"}</>]]} />

<Prose>{"The staircase records exactly that accounting. Its horizontal axis is days; its vertical axis is estimated still-running fraction. Filled step endpoints indicate the value *after* the failure at that time. A censor mark does not make a jump, but the linked risk-count row shows its effect on later steps. At day five the value is still35/48, because no new failure was observed between four and six. A sloping connector or linear interpolation would describe a different curve from the one we just calculated."}</Prose>

<Prose>{"Now name the pieces used at every distinct event time t_j. Let n_j be the risk count immediately before it and d_j the failures at it. The factor is "}<code>{"(n_j−d_j)/n_j"}</code>{", or "}<code>{"1−d_j/n_j"}</code>{". Getting through all event times up to t gives:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat S(t)=\\prod_{t_j\\le t}\\left(1-\\frac{d_j}{n_j}\\right)."}</MathBlock></div>

<Prose>{"This multiplication is the chain rule for successive conditional survival, not an assumption that surviving different intervals is independent. Under the right-continuous convention S(t)=P(T>t), the step at t is included. Immediately before the step write S(t−). The distinction matters for a discrete probability mass at a time; a continuous lifetime law has no mass at one exact point."}</Prose>

<Prose>{"The shared time control lets you inspect day three's unchanged height, day four's six-member denominator, day five's plateau and day six's four-member denominator. It changes the inspected time, rather than fitting a different cohort. The boundary at day nine marks the end of recorded support. Extending the last plateau visually cannot make later survival an observed quantity."}</Prose>

<H3>{"Why the ordinary surviving fraction is a special case"}</H3>

<Prose>{"We have used censoring to keep the information that was actually observed. As a check, temporarily switch to a separately labelled uncensored eight-pump example. Suppose one pump fails at each of the first two event times."}</Prose>

<UncensoredCancellationFigure />

<Prose>{"After the first failure, seven of eight remain. All seven are still followed, so the second factor is6/7. The7 cancels:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac78\\frac67=\\frac68."}</MathBlock></div>

<Prose>{"The product is exactly the empirical surviving fraction. In our original cohort, B leaves logging between the first two failures, making the second denominator6 rather than7. The cancellation no longer applies. Kaplan–Meier extends the uncensored empirical curve; it does not mean that lost follow-up has become a known lifetime."}</Prose>

<H3>{"Deeper: why these fractions maximize the observed lifetime likelihood"}</H3>

<Prose>{"The counting rule also follows from asking which event-time probability masses best explain the records. We will use a discrete probability representation at the observed event times, plus unresolved probability after follow-up. This describes the estimator's jumps; it does not claim physical failures occur only at the seven logger endpoints."}</Prose>

<ConditionalMassFigure />

<Prose>{"At an event time, consider a trial value q for the probability of failing *at that time*, conditional on getting there. Each of the d observed failures contributes q. Each of the other n−d at-risk subjects contributes1−q for getting through it, including a subject censored at that time under our event-priority convention. A subject whose logging ended earlier does not contribute a guessed later outcome. The part of the observed lifetime likelihood depending on q is therefore:"}</Prose>

<div className="neural-equation"><MathBlock>{"L(q)\\propto q^d(1-q)^{n-d},\\qquad0\\le q\\le1."}</MathBlock></div>

<Prose>{"Here "}<code>{"∝"}</code>{" means “proportional to”: factors that do not change with q are omitted. For0<d<n, taking a logarithm preserves the location of the maximum because the logarithm is strictly increasing. It turns the powers into the sum "}<code>{"log L(q)=d log q+(n−d)log(1−q)+constant"}</code>{". The constant has zero slope; the slopes of log q and log(1−q) are1/q and−1/(1−q). Differentiating gives "}<code>{"d/q−(n−d)/(1−q)=0"}</code>{", whose solution is q=d/n. The second derivative is "}<code>{"−d/q²−(n−d)/(1−q)²<0"}</code>{", so this is the maximum. If d=0, the maximum is at q=0; if d=n, it is at q=1. Multiplying the surviving factors1−q reproduces the product-limit curve. This argument uses the noninformative-censoring condition from section2 to separate the observation mechanism from the lifetime part; informative loss of logging cannot simply be ignored in this likelihood."}</Prose>

<Prose>{"Follow B's bound T>3 through the mass slots. The estimated mass at day four is the curve's drop7/8−35/48=7/48. Since estimated survival at day three is7/8, the conditional share of B's remaining lifetime mass assigned to day four is "}<code>{"(7/48)/(7/8)=1/6"}</code>{". The corresponding shares at days six and eight are5/24 and5/16, and5/16 stays in the unresolved tail. They sum to one. B is not converted into an observed day-four failure; this is the fitted probability allocation consistent with its inequality."}</Prose>

<Prose>{"The unconditional mass slots are1/8 at day two,7/48 at four,35/192 at six, 35/128 at eight and35/128 in the unresolved tail. Their sum is one. The last slot has no observed failure time to attach to it. Keep that slot visibly unresolved rather than placing it at nine or infinity. This connects the curve to both the observed-likelihood and mass-redistribution views without inventing the unobserved tail."}</Prose>

<Prose>{"The complete grouped implementation and its ordinary library mapping follow in section 4 after the uncertainty and area quantities they return are explained. A separate exact-fraction program exposes the products directly; its Greenwood and restricted-mean fields will then have taught meanings. Before those programs, we need to understand why curves supported by six pumps and by two pumps should not inspire equal confidence."}</Prose>

<H2>{"4. Read uncertainty and the supported area"}</H2>

<Prose>{""}<strong>{"How much evidence supports a drop—and how much running time does the curve describe?"}</strong>{" The risk-set counts from section3 answer the first question; the lengths of the curve's horizontal segments answer the second."}</Prose>

<GreenwoodRiskFigure />

<Prose>{"In the first miniature, seven of eight get through the endpoint. In the second, only one of two does. Both estimates use one observed failure, but their denominators are different. The second miniature leaves much more uncertainty about the surviving fraction. Its two tokens cannot be treated as if six unseen subjects were also followed. These are separate miniature risk sets, not a change to the A–H observation table."}</Prose>

<Prose>{"The contribution to "}<strong>{"Greenwood's approximation"}</strong>{" is1/[8(8−1)]=1/56 for the first set and1/[2(2−1)]=1/2 for the second. The second term is28 times the first. These are contributions on the *log-survival variance* scale. They do not mean the second confidence interval is28 times as wide: the estimated survival heights, transformation and earlier contributions also matter."}</Prose>

<Prose>{"At a chosen time t, add these contributions from every observed failure time up to t. Call that sum G(t). Using section3's risk and failure counts:"}</Prose>

<div className="neural-equation"><MathBlock>{"G(t)=\\sum_{t_j\\le t}\\frac{d_j}{n_j(n_j-d_j)},\\qquad\n\\widehat{\\operatorname{Var}}\\{\\widehat S(t)\\}\n\\approx\\widehat S(t)^2G(t)."}</MathBlock></div>

<Prose>{"The variance describes sampling uncertainty under the stated independent-subject and noninformative-censoring model. It cannot detect a selectively disconnected logger or repair that observation bias. The small cohort also makes the large-sample approximation rough; a numerical interval is not a promise of exact small-sample coverage."}</Prose>

<Prose>{"At day four, the failure at two contributes1/56 and the failure at four contributes1/[6·5]=1/30. Thus G(4)=43/840. At day eight, the additional terms are1/[4·3]=1/12 and1/[2·1]=1/2, giving G(8)=533/840. The late curve is supported by fewer pumps. Keep the risk counts visible beside it rather than letting a smooth-looking interval conceal that fact."}</Prose>

<H3>{"Deeper: where the variance term comes from"}</H3>

<Prose>{"The likelihood cells in D10 estimated a conditional failure probability by q̂=d/n. A conditional binomial approximation gives its variance q(1−q)/n: it describes variability in the fraction of n at-risk subjects that fail at that endpoint. The surviving factor is1−q; on the logarithmic scale its local slope with respect to q is−1/(1−q). Multiplying variance by the squared slope gives the first-order approximation "}<code>{"Var{log(1−q̂)}≈q/[n(1−q)]"}</code>{". Substituting the estimated q̂=d/n yields "}<code>{"d/[n(n−d)]"}</code>{"."}</Prose>

<Prose>{"The product-limit large-sample calculation adds the event-time contributions on the log scale. This is not permission to assume the observed risk counts or the survival outcomes at different times are independent; those sets shrink together. Returning from log survival to survival multiplies the variance approximation by Ŝ², the squared local slope of the exponential. This connects the variance formula to the conditional-count mechanism rather than introducing it as an unexplained extra column."}</Prose>

<Prose>{"If every remaining at-risk subject fails, d=n and the factor becomes zero. The interior formula's denominator then vanishes. The curve has reached zero on the sample, but this approximation no longer gives a finite log-survival variance there. Similarly, no recorded failures can leave Ŝ=1 without proving that the population never fails. The implementation gives an explicit boundary status instead of labelling either endpoint as certain population survival."}</Prose>

<H3>{"A probability interval without impossible endpoints"}</H3>

<Prose>{"We now have a survival height and a variance approximation. Simply drawing a symmetric interval around the height can put its ends below zero or above one. We can instead work on a transformed scale, then map the ends back."}</Prose>

<SurvivalIntervalFigure />

<Prose>{"Start with day four's Ŝ=35/48. Taking its logarithm gives a negative value; negating makes it positive, so we can take a second logarithm. The result is the transformed coordinate g=log(−log Ŝ). This coordinate describes the already-calculated survival probability; it is not a new measured pump feature. Greenwood gives its approximate standard error as√G/|log Ŝ|. On that ruler, place the ends g−z·se and g+z·se, where z≈1.959964 is the standard normal multiplier for a95% pointwise interval."}</Prose>

<Prose>{"Now move those endpoints back with "}<code>{"exp(−exp(g))"}</code>{". Larger transformed coordinates become *smaller* survival probabilities, so the upper transformed endpoint supplies the lower probability bound. The complete calculation is:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{se}_g=\\frac{\\sqrt{G}}{|\\log\\widehat S|},\\qquad\n[S_{\\mathrm{lower}},S_{\\mathrm{upper}}]\n=\\left[\n\\exp\\{-\\exp(g+z\\operatorname{se}_g)\\},\n\\exp\\{-\\exp(g-z\\operatorname{se}_g)\\}\n\\right]."}</MathBlock></div>

<Prose>{"At day four the approximate bounds are[.276390,.925353]. Their asymmetry is the result of the back-transformation, not an accidental drawing distortion. The selected-time control follows the same calculation at another supported time. At day zero this interior transform is unavailable because Ŝ=1; an all-failure endpoint with Ŝ=0 is unavailable too. The static endpoint insets show those reasons. A tool may return a plug-in endpoint interval there under its own convention; that convention does not prove absence of population uncertainty."}</Prose>

<Prose>{"“Pointwise95%” concerns a specified time under repeated comparable samples. It does not mean that95% of pumps lie between the bounds, that the population survival probability has been directly observed, or that the whole true curve stays inside all displayed pointwise bounds with95% coverage. A simultaneous band is constructed to address the last question over a declared time range; it requires a different joint calculation. Looking across many pointwise intervals does not turn them into that band."}</Prose>

<H3>{"Measure the time represented by the curve"}</H3>

<Prose>{"Uncertainty asks how well we know a probability. A different question is how many running days a pump accumulates before a fixed horizon. We can answer it from the same curve without inventing the unknown tail."}</Prose>

<RestrictedAreaFigure />

<Prose>{"The first rectangle has width two days and height one: all probability mass gets through the first two-day interval in this fitted curve. It contributes two days. From day two to four the height is7/8, so its width-two rectangle contributes7/4 days. The next rectangles have heights35/48,35/64 and35/128. Their widths through day nine are two, two and one. Adding the areas gives"}</Prose>

<div className="neural-equation"><MathBlock>{"2+2\\frac78+2\\frac{35}{48}+2\\frac{35}{64}+\\frac{35}{128}\n=\\frac{2525}{384}\\approx6.575521\\ \\text{days}."}</MathBlock></div>

<Prose>{"This is the "}<strong>{"restricted mean survival time"}</strong>{", or RMST, through horizon τ=9. The horizon symbol τ simply names the chosen endpoint of the area calculation. For a lifetime T, "}<code>{"min(T,τ)"}</code>{" counts its days before failure or that horizon, whichever comes first. Its expectation is the area under the population survival curve through τ; substituting our fitted staircase estimates it:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{RMST}(\\tau)=E\\{\\min(T,\\tau)\\}\n=\\int_0^\\tau S(t)\\,dt,\\qquad\n\\widehat{\\operatorname{RMST}}(\\tau)\n=\\int_0^\\tau\\widehat S(t)\\,dt."}</MathBlock></div>

<Prose>{"The probability height is dimensionless, so width in days times height produces days. RMST is not the failure rate, the fraction failing by nine, or the mean of the four recorded failure times. It uses the censored information through the survival curve. Nor is6.575521 an estimate of the unrestricted mean lifetime: the unresolved tail from D10 could contribute very different amounts of time beyond nine."}</Prose>

<Prose>{"Move the horizon to four. Only the first two rectangles remain, giving3.75 days. Move it to five: keep those rectangles and add one day at height35/48, giving215/48≈4.479167 days. At horizon zero the area is zero. The live sentence reports both the horizon and accumulated days, and the picture shows which last rectangle was shortened. This estimator accepts horizons only in[0,9]. That support rule prevents a library's last-plateau extension from becoming unlabelled extrapolation; it does not by itself guarantee precise estimation."}</Prose>

<Prose>{"The median answers another question: at which first observed step has estimated survival fallen to one half or less? Our curve remains35/64>.5 at six and falls to35/128<.5 at eight, so its estimated median is eight days. If the curve never crosses, report "}<strong>{"median not reached"}</strong>{". A tool's infinity value for an unreached sample median is an output convention, not evidence of infinite population lifetime. A median time and an RMST through a named horizon cannot be substituted for each other."}</Prose>

<H3>{"Implement the accounting once, then query it efficiently"}</H3>

<Prose>{"We have now taught every quantity returned by the first scratch implementation: group counts, survival, log survival, Greenwood contribution, interval, supported area and median. The calculations follow the diagrams directly."}</Prose>

<Prose>{"Complete source: "}<a href={"/learn-assets/survival-reading-flow/content/programs/survival_estimators.py"}>{"survival_estimators.py"}</a>{". It is an import-safe standard-library implementation of this univariate core. The later reverse-censoring and competing-event extensions will be taught and added at their own homes; they are not assumed by this code."}</Prose>

<Prose>{"Save the complete core and "}<a href={"/learn-assets/survival-reading-flow/content/programs/kaplan-meier-example.py"}>{"kaplan-meier-example.py"}</a>{" together, then run "}<code>{"python kaplan-meier-example.py"}</code>{". The example imports the core, supplies the eight observation rows and prints their calculated risk table, day-four interval, day-five step, median and supported area. Its day-four survival is .729166667, interval bounds are.276390/.925353, and RMST9 is6.575520833. These decimal outputs represent the exact fractions worked above. Keep the core's "}<code>{"followup_end"}</code>{" and interval status when building another application; discarding them would discard part of the estimator's contract."}</Prose>

<Prose>{""}<code>{"prepare_groups"}</code>{" pairs each duration with its failure flag, sorts once and groups all equal endpoints together. "}<code>{"at_risk"}</code>{" begins at the number of subjects. For each group it records the risk count, counts failures/censors, then removes both for the *next* endpoint. The day-four denominator is therefore six even though D is censored at that same time. Sorting by time does not let a row's position choose an endpoint convention."}</Prose>

<Prose>{""}<code>{"RiskGroup"}</code>{" is a named record for those four quantities. "}<code>{"CurvePoint"}</code>{" adds the survival height, its log, G and the rectangle area accumulated *before* this endpoint. Its "}<code>{"frozen=True"}</code>{" dataclass declaration prevents ordinary field assignment; tuples keep the retained points/order fixed. These are storage choices for calculated values, not another estimator. "}<code>{"KaplanMeier"}</code>{" holds those points, sorted endpoint times and the last observed follow-up time."}</Prose>

<Prose>{""}<code>{"kaplan_meier"}</code>{" walks the prepared groups once. It adds the previous segment's area before changing the height, matching D13. It then accumulates "}<code>{"log1p(−d/n)"}</code>{", a numerically careful calculation of "}<code>{"log(1−d/n)"}</code>{" when the fraction is small. When d=n it sets log survival to negative infinity, whose exponential is zero, and marks Greenwood unavailable. Otherwise it adds the already-derived variance contribution. A censor-only group changes later risk counts but not the survival height or G."}</Prose>

<Prose>{""}<code>{"value"}</code>{" uses binary search: "}<code>{"bisect_right"}</code>{" includes the step at the requested time, while "}<code>{"bisect_left"}</code>{" asks for the value immediately before it. The supported area uses the stored prefix and at most one partial rectangle. "}<code>{"median"}</code>{" returns the first crossing or Python "}<code>{"None"}</code>{", meaning not reached. "}<code>{"log_log_interval"}</code>{" returns named lower/upper bounds and an explicit status for boundary transforms. It uses log survival to distinguish a true exhausted-risk zero from floating-point underflow, and does not turn the latter into a claim that the estimated mathematical probability is exactly zero."}</Prose>

<Prose>{"The supported response type is finite nonnegative duration plus a Python Boolean or integer0/1 failure flag, with subjects followed from zero. The general accounting also allows a separately declared zero-time event mass; the positive pump example has none. Delayed entry and interval-censored times require different risk membership and likelihoods, which we will teach later. Input checks enforce this response contract rather than guessing the meaning of another observation type."}</Prose>

<Prose>{"For n records and g distinct endpoints, grouping takes O(n log n) time; the subsequent pass takes O(g), with O(g) retained curve state and O(n) temporary sorting storage. Step and area queries take O(log g); the displayed median scan takes O(g). This avoids rescanning all n records at every endpoint. It is an efficient transparent implementation for the stated contract, rather than a claim that a Python object representation is fastest for every dataset. Packed arrays can reduce overhead without changing these risk-set operations."}</Prose>

<Prose>{"Here is the complete module just explained. Save it as "}<code>{"survival_estimators.py"}</code>{". It performs no calculation on import; the separate example supplies the observations and makes the calls."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_estimators.py"} filename={"survival_estimators.py"} language={"python"} title={"survival_estimators.py"} />

<Prose>{"Save the complete example below as "}<code>{"kaplan-meier-example.py"}</code>{", beside the module, and run "}<code>{"python kaplan-meier-example.py"}</code>{". The input table is the same eight-pump example. The first output columns expose the denominators and removals; the final lines use the interval, query, median and area methods explained above."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/kaplan-meier-example.py"} filename={"kaplan-meier-example.py"} language={"python"} title={"kaplan-meier-example.py"} />

<Prose>{"The complete recorded output shows the same grouped calculation in ordinary decimal notation. Read each risk denominator and removal against the eight-pump observation table."}</Prose>

<CodeBlock language={"output"}>{"day risk failures censored survival Greenwood\n2 8 1 0 0.875000000 0.017857143\n3 7 0 1 0.875000000 0.017857143\n4 6 1 1 0.729166667 0.051190476\n6 4 1 0 0.546875000 0.134523810\n7 3 0 1 0.546875000 0.134523810\n8 2 1 0 0.273437500 0.634523810\n9 1 0 1 0.273437500 0.634523810\npointwise95 at4: 0.276390 0.925353\nS(5): 0.729166667\nmedian: 8\nsupported RMST9: 6.575520833"}</CodeBlock>

<Prose>{"The complete "}<code>{"kaplan-meier-risk-sets.py"}</code>{" program deliberately scans the small cohort at every endpoint and uses "}<code>{"Fraction"}</code>{" to expose exact products. Compare its teaching purpose with the grouped implementation: the small reference makes the fractions inspectable, while grouping avoids repeated scans. Its recorded output includes the full table, pointwise interval, S(5)=35/48, median8 and RMST9=2525/384."}</Prose>

<Prose>{"Complete original source — "}<code>{"kaplan-meier-risk-sets.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/kaplan-meier-risk-sets.py"} filename={"kaplan-meier-risk-sets.py"} language={"python"} title={"kaplan-meier-risk-sets.py"} />

<Prose>{"Recorded output from the original implementation:"}</Prose>

<CodeBlock language={"output"}>{"day risk failures censored survival Greenwood\n2 8 1 0 7/8 1/56\n3 7 0 1 7/8 1/56\n4 6 1 1 35/48 43/840\n6 4 1 0 35/64 113/840\n7 3 0 1 35/64 113/840\n8 2 1 0 35/128 533/840\n9 1 0 1 35/128 533/840\napproximate pointwise 95% limits at 4: [0.27639, 0.925353]\nS(5), held constant after 4: 35/48\nmedian: 8\nRMST through day 9: 2525/384"}</CodeBlock>

<H3>{"Use ordinary tools with the same conventions"}</H3>

<Prose>{"The scratch calculation makes the denominator and area explicit. The ordinary route lets you use maintained survival tools while keeping those decisions visible. Complete source: "}<a href={"/learn-assets/survival-reading-flow/content/programs/kaplan-meier-library.py"}>{"kaplan-meier-library.py"}</a>{"."}</Prose>

<Prose>{""}<code>{"KaplanMeierFitter(alpha=.05).fit(times,event_observed=events)"}</code>{" in lifelines receives actual follow-up durations and Boolean failures. It does not receive the observed endpoints as if all were failures. Its "}<code>{"predict(4)"}</code>{" includes the day-four step; "}<code>{"confidence_interval_.loc[4]"}</code>{" returns the interval at that endpoint. "}<code>{"restricted_mean_survival_time(estimate,t=9)"}</code>{" integrates to the explicit horizon, and the script independently guards that horizon against recorded support before calling it."}</Prose>

<Prose>{"The scikit-survival route passes failure flags first: "}<code>{"kaplan_meier_estimator(events,times,conf_level=.95,conf_type=\"log-log\")"}</code>{". It returns sorted step times, survival values and interval bounds. The script locates the actual day-four row in that returned time array, rather than assuming it has the same positional index as the raw observations. Both routes use the same right-censor response and transformation as our core; other endpoint/support choices need an explicit mapping."}</Prose>

<Prose>{"The ordinary contracts are documented in "}<a href={"https://lifelines.readthedocs.io/en/latest/fitters/univariate/KaplanMeierFitter.html"}>{"lifelines KaplanMeierFitter"}</a>{" and "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.nonparametric.kaplan_meier_estimator.html"}>{"scikit-survival's estimator API"}</a>{". For the likelihood and uncertainty derivation, the "}<a href={"https://web.stanford.edu/~lutian/coursepdf/unit5.pdf"}>{"Stanford product-limit notes"}</a>{" give another treatment of the same counting problem."}</Prose>

<Prose>{"With lifelines0.30.3 and scikit-survival0.28.0, both ordinary routes give S(4)=.7291666667 and the same approximate day-four interval; lifelines gives supported RMST9=6.5755208333 and median8. Their agreement checks the estimator arithmetic and chosen conventions. The censoring assumption remains the observation question from section 2."}</Prose>

<Prose>{"Save this complete ordinary-route example as "}<code>{"kaplan-meier-library.py"}</code>{" and run "}<code>{"python kaplan-meier-library.py"}</code>{" in the separate Python environment with the recorded library versions. It supplies its own observation table; the scratch module is not imported into either library estimator."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/kaplan-meier-library.py"} filename={"kaplan-meier-library.py"} language={"python"} title={"kaplan-meier-library.py"} />

<Prose>{"The complete saved library output below is the recorded comparison just described. The final line includes censor-only endpoint times as well as failure times, so it can be read against the grouped table rather than assuming that every returned row is a survival drop."}</Prose>

<CodeBlock language={"output"}>{"lifelines S(4), S(5): 0.7291666666666667 0.7291666666666667\nlifelines pointwise95 at4: [0.2763902203361229, 0.9253531812572053]\nlifelines median: 8.0\nlifelines supported RMST9: 6.575520833333334\nscikit-survival at4: 0.7291666666666667 [0.27639022033612287, 0.9253531812572053]\nscikit-survival steps: [(2.0, 0.875), (3.0, 0.875), (4.0, 0.7291666666666667), (6.0, 0.546875), (7.0, 0.546875), (8.0, 0.2734375), (9.0, 0.2734375)]"}</CodeBlock>

<H3>{"Use the same area for a different event: solving before timeout"}</H3>

<Prose>{"The pump example made “event” mean failure. To see that the mathematics concerns time to an event rather than whether the event is good or bad, change to a search algorithm. Now the event is "}<strong>{"finding a solution"}</strong>{", time is occupied compute, and a timeout is an unfinished right-censored run."}</Prose>

<SearchTimeoutFigure />

<Prose>{"Method A solves at times one and two; its other two runs are stopped at five. Method B solves at three and four; its other two runs are also stopped at five. Both solve two of four by timeout, so both have estimated success fraction.5. Their compute budgets differ. A's unresolved fraction has heights1 through one,3/4 from one to two and1/2 from two to five, giving "}<code>{"1+(.75)·1+(.5)·3=13/4=3.25"}</code>{" compute-time units. B's area is "}<code>{"3+(.75)·1+(.5)·1=17/4=4.25"}</code>{"."}</Prose>

<Prose>{"The curves here measure remaining *unsolved* probability. Their areas estimate occupied compute through five, not the unrestricted completion time of the unfinished runs. Comparing only success fraction misses that A uses less compute through this fixed horizon in the constructed example. Comparing only the observed successful-run mean would discard the occupied timeout time."}</Prose>

<Prose>{"The complete "}<code>{"restricted-timeouts.py"}</code>{" includes this calculation and, in its second part, an aging-law calculation. We will read the file after section 5 introduces shape, scale and conditional future probability; its success and compute-time outputs above have their meaning here."}</Prose>

<Prose>{"The curve has now described remaining probability, uncertainty and supported time. It still does not tell us the local failure mechanism. Next we connect the newly failing fraction over a short interval to a rate, then accumulate that rate back into a survival probability."}</Prose>

<H2>{"5. Turn a changing rate into a probability"}</H2>

<Prose>{""}<strong>{"Among pumps that are still working, how quickly are failures arriving?"}</strong>{" Measure the departing fraction against the time window, then shrink that window."}</Prose>

<ConditionalRateFigure />

<Prose>{"The top strip is the fraction S(t) still working at the present day t. The bracket selects those survivors: they are the population for the next question. The second strip enlarges that selected group to one whole unit. A shaded piece leaves during the next Δ days; the rest gets through that interval. The arrow connects the same departing pumps between the two strips. Δ, pronounced “delta,” is the width of the time window, not the event flag δ used in our records. Their different shapes and labels keep those meanings separate."}</Prose>

<Prose>{"Dividing departures by the selected surviving group gives a *conditional* failure probability. Dividing that probability by the window's duration gives departures per surviving pump per day. These two divisions answer different questions. The first is a fraction between zero and one; the second has units of inverse time."}</Prose>

<Prose>{"For this illustration we supply a smooth model with an instantaneous rate of .2 per day throughout the future interval; it is not a fit to pumps A–H. Change the window from one day to three. The exact conditional failure probability changes from about.181269 to.451188, while the probability divided by window width changes from.181269/day to.150396/day. The latter is a finite-window quantity. It is not the instantaneous rate. At width.01 day the same ratio is about.199800/day, much closer to.2/day. We will derive these exact probabilities in the next drawing. The shrinking-window comparison is the reason for defining a rate using a limit."}</Prose>

<Prose>{"Now name the local object. The "}<strong>{"hazard h(t)"}</strong>{" is the limiting failure rate among those surviving to t. Our convention S(t)=P(T>t) gives, for a continuous lifetime law with positive S(t),"}</Prose>

<div className="neural-equation"><MathBlock>{"h(t)=\\lim_{\\Delta\\downarrow0}\n\\frac{P(t<T\\le t+\\Delta\\mid T>t)}{\\Delta}."}</MathBlock></div>

<Prose>{"The vertical bar means “given”: count only those already working at t. For a short enough window the conditional probability is approximately h(t)Δ. For a long window that multiplication can exceed one, so it cannot be the exact probability rule. A hazard can legitimately exceed1/day; a probability cannot exceed1. Changing the time unit changes the numerical rate too: .2/day is .2/24 per hour, while the probability over the same physical interval stays unchanged."}</Prose>

<Prose>{"To connect this rate to the survival curve, look at the top strip again. The unconditional departed mass is S(t)−S(t+Δ). Dividing it by Δ and shrinking the window gives the height of the "}<strong>{"failure density f(t)"}</strong>{", or −S'(t), where the prime means slope with respect to time. A density height times a small time width approximates probability mass; the height alone is not probability at an exact instant. Divide by S(t), the surviving mass used as the denominator, to obtain"}</Prose>

<div className="neural-equation"><MathBlock>{"f(t)=-S'(t),\\qquad h(t)=\\frac{f(t)}{S(t)}."}</MathBlock></div>

<Prose>{"These statements require a continuous differentiable law at the time in question. Our finite-cohort Kaplan–Meier staircase has jumps, so it does not have an ordinary density at a jump. We will return to that distinction after understanding the smooth model."}</Prose>

<H3>{"Accumulate the rate instead of adding failure probabilities"}</H3>

<Prose>{""}<strong>{"What survival curve does a supplied rate generate?"}</strong>{" Keep the rate plot and the resulting probability plot on the same day axis."}</Prose>

<AccumulatedRateFigure />

<Prose>{"At the initial setting the upper plot is a horizontal line at.2/day. Three days under that line form a rectangle: width3 days times height.2/day gives area.6. The days cancel. This area is a dimensionless accumulated rate, not a.6 failure probability. The lower plot shows what remains after that accumulation: about.548812 survival, hence.451188 failure by day three. Increasing the rate grows the upper area and lowers the corresponding survival; setting the rate to zero gives area zero and survival one through the displayed horizon. That zero state is a supplied no-failure law on this finite horizon, not a conclusion that an observed pump is immortal."}</Prose>

<Prose>{"Why the curved lower plot? Divide time into short successive windows. In each one, approximately1−h(t)Δ of the then-surviving group gets through. Multiply the factors, as we did for "}<strong>{"Count your way to a survival curve"}</strong>{". Taking logs turns the product into a sum. For a small positive z, log(1−z) is approximately −z; as the windows shrink, the sum becomes minus the area under the rate curve. Call that accumulated rate "}<strong>{"H(t)"}</strong>{", the cumulative hazard for this continuous law:"}</Prose>

<div className="neural-equation"><MathBlock>{"H(t)=\\int_0^t h(u)\\,du,\\qquad\nS(t)=\\exp[-H(t)]\\quad\\text{when }S(0)=1."}</MathBlock></div>

<Prose>{"The letter u is the integration time: move it from zero to t and add the small rate rectangles. The function exp is the exponential, the inverse of the natural logarithm. It turns the accumulated negative log-survival back into a remaining fraction. The condition S(0)=1 says that nobody has already experienced the event at the clock origin. For our smooth pump model we make that condition explicit; a different origin convention needs a starting factor, which we examine below."}</Prose>

<Prose>{"With constant rate r, every rectangle has the same height. Then H(t)=rt, S(t)=exp(−rt), and the failure probability by t is1−exp(−rt). The distribution with this survival law is called "}<strong>{"exponential"}</strong>{". In the three-day example,"}</Prose>

<div className="neural-equation"><MathBlock>{"H(3)=.2\\times3=.6,\\qquad S(3)=e^{-.6}\\approx.548812,\n\\qquad P(T\\le3)=1-e^{-.6}\\approx.451188."}</MathBlock></div>

<Prose>{"The same reasoning starting at a later age t cancels the already accumulated survival. Conditional survival over the next Δ is S(t+Δ)/S(t)=exp[−(H(t+Δ)−H(t))]. For a constant rate the difference is rΔ, so the probability in D15 is exactly1−exp(−.2Δ). That is why multiplying.2 by three gives an accumulated rate of.6 rather than the failure probability. The probability saturates below one as the interval grows."}</Prose>

<Prose>{"In code, evaluate a small failure probability with "}<strong>{"−expm1(−H)"}</strong>{". The math function expm1(x) computes exp(x)−1 accurately near zero. Directly subtracting exp(−H) from1 can lose all significant digits: the width1e−18-day example preserves a probability about2e−19, while that subtraction returns zero in double precision. This is a numerical distinction, not a different probability law. The complete implementation below keeps both the log-survival −H and its exponential so a very small surviving probability does not force us to divide two rounded zeros."}</Prose>

<H3>{"Let present age matter when the rate changes"}</H3>

<Prose>{""}<strong>{"Does working for four days change the next three days' outlook?"}</strong>{" Compare equal future windows after conditioning on the same current age."}</Prose>

<AgeDependentRateFigure />

<Prose>{"The day ruler begins at commissioning. A marker at the present age a selects the pumps still working there. The shaded future window runs from a to a+3, not from zero. The normalized strip below shows what fraction of those selected survivors gets through that future window. The constant-rate reference remains visible alongside the changing-rate model."}</Prose>

<Prose>{"To make a changing rate concrete, choose a "}<strong>{"Weibull"}</strong>{" lifetime law. It has two parameters. The positive "}<strong>{"scale λ"}</strong>{", pronounced “lambda,” sets the time unit of the law; here it is fixed at12 days. The positive "}<strong>{"shape κ"}</strong>{", pronounced “kappa,” determines how the rate varies with age. A shape of1 recovers the constant-rate exponential law. Shape2 produces a rate that increases with age; shape.5 produces a rate that decreases with age. These are possible descriptions of populations, not evidence that every physical pump has one of these mechanisms."}</Prose>

<Prose>{"The shape control changes that age pattern; the age control moves the current-survivor marker while keeping the next-three-day window fixed. At shape1, moving age four to age ten changes nothing in the conditional failure probability: both give about.221199. At shape2, the rate area from four to seven is smaller than the area from ten to thirteen. The corresponding conditional failure probabilities are about.204804 and.380701. Notice that shape2 at age four is *less* risky over this window than shape1 at age four. “Increasing with age” does not mean “greater than every other model at every age.” Compare the actual window areas."}</Prose>

<Prose>{"We can now write the law drawn there:"}</Prose>

<div className="neural-equation"><MathBlock>{"H(t)=\\left(\\frac{t}{\\lambda}\\right)^\\kappa,\\qquad\nS(t)=\\exp\\left[-\\left(\\frac{t}{\\lambda}\\right)^\\kappa\\right],\n\\qquad\nh(t)=\\frac{\\kappa}{\\lambda}\n\\left(\\frac{t}{\\lambda}\\right)^{\\kappa-1}."}</MathBlock></div>

<Prose>{"The ratio t/λ has no units, so raising it to κ is well-defined under a change of time units. Differentiate H with respect to t: the power rule supplies κ, and differentiating t/λ supplies1/λ. This yields the rate shown on the right. At t=λ, H=1 and S=exp(−1): the scale is not the mean lifetime or the time at which all pumps fail."}</Prose>

<Prose>{"For the conditional future window, compute only its additional accumulated rate, ΔH=H(a+3)−H(a). At shape1 it is3/12=1/4 whatever a is. At shape2 and age four,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\Delta H=\\frac{7^2-4^2}{12^2}=\\frac{33}{144}=\\frac{11}{48},\n\\qquad q=1-e^{-11/48}\\approx.204804."}</MathBlock></div>

<Prose>{"At age ten, the numerator becomes13²−10²=69, giving ΔH=23/48 and q≈.380701. The probability q is conditional on still running at the stated age; it is not the unconditional chance of failure by day seven or thirteen. Shape1's age-independent conditional law is called "}<strong>{"memorylessness"}</strong>{". It means the future waiting-time distribution, given survival, has the original form. It does not say that a physical device has forgotten its maintenance history or that censoring is automatically independent."}</Prose>

<Prose>{"There is an instructive boundary in the decreasing-rate model. At age zero with shape below1, the formula for instantaneous rate tends to infinity. The probability of failure in a finite interval is still finite: shape.5 over the first three days gives accumulated rate sqrt(3/12)=.5 and failure probability about.393469. The drawing labels the origin singularity and draws the curve only at positive ages; it does not place an infinite SVG coordinate or replace the origin with a fabricated finite rate. At shape2 the origin rate is zero even though the subsequent three-day failure probability is positive. The rate at a single point is not the whole window."}</Prose>

<Prose>{"For accurate conditional calculations, do not divide two very small survival values. Work with ΔH and then exp(−ΔH). Our scalar code also avoids subtracting two nearly equal powers when the future window is short relative to age: for a>0 it uses"}</Prose>

<div className="neural-equation"><MathBlock>{"\\Delta H=\\left(\\frac a\\lambda\\right)^\\kappa\n\\operatorname{expm1}\\!\\left[\n\\kappa\\operatorname{log1p}\\!\\left(\\frac\\Delta a\\right)\\right]."}</MathBlock></div>

<Prose>{"The function log1p(x) accurately evaluates log(1+x) near zero. This identity factors H(a) out of H(a+Δ)−H(a); the remaining power ratio is an exponential of κ log(1+Δ/a). Age zero has its separate direct-power branch. The code accepts finite nonnegative ages/windows and positive shape/scale with representable scalar powers and rate increments; it reports overflow or unrepresentable positive increments instead of silently clipping a curve. This is a stable, constant-cost scalar model calculation, not an arbitrary-precision implementation or a fit of Weibull parameters."}</Prose>

<Prose>{"The search example from "}<strong>{"Measure the time represented by the curve"}</strong>{" can now be read as one complete program. Its first part reproduces the supported solve fractions and restricted compute13/4 versus17/4. Its second part uses the same age-four/three-more-days law just calculated. The unchanged source uses a direct power difference at those moderate values; the new stable window helper handles short-window cancellation deliberately. Here is the complete earlier file, restricted-timeouts.py:"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/restricted-timeouts.py"} filename={"restricted-timeouts.py"} language={"python"} title={"restricted-timeouts.py"} />

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"}>{"A success by timeout: 1/2 restricted compute: 13/4\nB success by timeout: 1/2 restricted compute: 17/4\nAn unfinished run may finish at 6 or at 600; these observations cannot decide.\nshape 1 failure in next 3 days given running at 4: 0.221199\nshape 2 failure in next 3 days given running at 4: 0.204804"}</CodeBlock>

<Prose>{"The last two probabilities belong to the supplied aging laws, with the shape and age specified in the output."}</Prose>

<H3>{"Deeper: preserve discrete jumps instead of smoothing their meaning away"}</H3>

<Prose>{""}<strong>{"Can we exponentiate the observed conditional failure fractions directly?"}</strong>{" A half-sized probability jump and a half-unit continuous rate area are different."}</Prose>

<DiscreteJumpFigure />

<Prose>{"In the left strip, two event-free members reach a timestamp and one fails there. The conditional failure mass is q=1/2, so exactly1−q=1/2 gets through that jump. In the right strip, a smooth continuous model accumulates rate area.5 across an interval. It leaves exp(−.5)≈.606531, rather than.5. The shared number.5 has different meanings in those pictures. At the discrete timestamp the unconditional event mass is the *pre-jump* surviving mass times q; there is no ordinary finite density height to substitute at that atom."}</Prose>

<Prose>{"To express the exact Kaplan–Meier step on a log-survival scale, its loss is −log(1−q). For q=.5 that loss is log2≈.693147. The "}<strong>{"Nelson–Aalen estimator"}</strong>{" instead adds observed conditional fractions d/n to estimate cumulative hazard:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat H_{\\mathrm{NA}}(t)=\\sum_{t_j\\le t}\\frac{d_j}{n_j},\\qquad\n-\\log\\widehat S_{\\mathrm{KM}}(t)\n=\\sum_{t_j\\le t}-\\log\\left(1-\\frac{d_j}{n_j}\\right)."}</MathBlock></div>

<Prose>{"The subscripts NA and KM distinguish two estimators computed from the same observations. For small q, −log(1−q)=q+q²/2+…; a jump of.001 gives exact log-loss about.0010005003, close to.001. For a large jump the omitted terms matter. The equality S=exp(−H) for our continuous population law does not make these two finite-sample estimators algebraically identical."}</Prose>

<Prose>{"Return to A–H. The event-group fractions through day eight are1/8,1/6,1/4 and1/2. Nelson–Aalen adds them to25/24. Exponentiating minus that sum gives about.352866. Kaplan–Meier multiplies7/8,5/6,3/4 and1/2 to35/128=.2734375. Both calculations use the same actual risk sets, including day-four's same-time censor. Censor-only days contribute zero increments; they still change later denominators. Neither calculation proves that lost logging was noninformative. When all remaining observed subjects fail together, KM becomes zero, whereas a finite NA increment can leave a positive exponential. That boundary makes the distinction impossible to dismiss as mere rounding."}</Prose>

<Prose>{"A cumulative estimator is a staircase. Differentiating that drawing does not produce a useful finite instantaneous failure-rate curve: it is flat between jumps and has atomic changes at them. Estimating a smooth instantaneous rate requires an additional smoothing rule and its bandwidth, or an explicitly specified continuous model. Those choices change the question and bias/variance tradeoff; they are not an unlabeled cosmetic interpolation."}</Prose>

<H3>{"Deeper: distinguish a distribution assumption from an unobserved tail"}</H3>

<Prose>{"The bottom part of D18 revisits the unresolved probability slot from "}<strong>{"Decide what incomplete observation permits"}</strong>{". One *specified* model may assign half the population to a class that never experiences this event and give the other half an exponential rate.2/day. Its survival is S(t)=.5+.5exp(−.2t). The event can happen at arbitrarily late finite times, yet survival tends to.5. Its continuous hazard is .1exp(−.2t)/[.5+.5exp(−.2t)], and its accumulated hazard tends to log2. The finite-event-time density therefore integrates to.5, with the other.5 explicitly assigned to T=∞. This is a complete probability law on an extended time axis, not a claim that a KM plateau has discovered a never-failing class. Conditioning on belonging to the finite-event class produces a different target law. The extended mean time is infinite when this never-event mass is positive, although restricted running-time areas remain finite at finite horizons."}</Prose>

<Prose>{"Another specified law can assign an event mass of.25 at time zero and use S(t)=.75exp(−.2t) thereafter. Its continuous rate for positive times is.2/day, but integrating that rate from zero and starting at1 misses the zero-time event. The correct starting survival is S(0)=.75, followed by the continuous factor exp(−.2t). More generally, a law with jumps needs their surviving factors as well as any continuous-rate contribution. Our earlier S(0)=1 and S=exp(−H) statement described a positive continuous lifetime law; changing that convention requires changing the calculation, not silently reusing it."}</Prose>

<H3>{"Extend the grouped implementation, then control the ordinary route"}</H3>

<Prose>{"The new complete file "}<a href={"/learn-assets/survival-reading-flow/content/programs/survival_rates.py"}>{"survival_rates.py"}</a>{" contains the supplied-law windows and the grouped Nelson–Aalen calculation. It imports KaplanMeier from "}<a href={"/learn-assets/survival-reading-flow/content/programs/survival_estimators.py"}>{"survival_estimators.py"}</a>{", the actual grouped response core taught in "}<strong>{"Implement the accounting once, then query it efficiently"}</strong>{". Keep those files together; the local import reuses the validated risk groups rather than re-sorting raw observations."}</Prose>

<Prose>{"ModelWindow names four related outputs: integrated_rate is ΔH; log_survival is −ΔH; survival is its exponential; failure_probability is the complementary conditional mass. Keeping these fields together prevents confusing a rate area with a probability. The Weibull helper handles zero-width and zero-age branches before its stable positive-age calculation. The instantaneous-rate helper returns mathematical infinity only for the declared shape-below-one origin singularity; finite-domain failures are explicit errors."}</Prose>

<Prose>{"For Nelson–Aalen, each already-prepared group supplies failures and at_risk. Add their quotient once and retain every endpoint, including censor-only groups. The accumulator's correction keeps small rounding errors from preceding additions from being lost; it does not change the d/n statistical rule. With g distinct groups this pass uses O(g) time and stored output; queries use binary search in O(log g), with an explicit pre/post-event side and no unsupported extrapolation. Raw observation sorting remains the earlier O(n log n) preparation. The method assumes its input is the local core's validated right-censored estimate; entry and changing history remain separate mechanisms."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_rates.py"} filename={"survival_rates.py"} language={"python"} title={"survival_rates.py"} />

<Prose>{"The ordinary route in "}<a href={"/learn-assets/survival-reading-flow/content/programs/rates-and-probabilities.py"}>{"rates-and-probabilities.py"}</a>{" uses the same inputs and prints intermediate quantities. SciPy's expon(scale=1/r).logsf(t) supplies the constant-rate log-survival; here r>0 for that library call. The analytical zero-rate state stays in the scratch helper because scale=1/0 is not a finite distribution parameter. For Weibull, weibull_min(c=κ,scale=λ) maps shape to c and time scale to scale. Subtract its two logsf values to check ΔH, rather than subtracting tiny probabilities. The example comparison uses moderate windows where the log difference is representable; our factored helper additionally protects short-window cancellation."}</Prose>

<Prose>{"For the empirical route, lifelines' NelsonAalenFitter is configured with nelson_aalen_smoothing=False to use grouped d/n increments. Its smoothing option changes tied-death arithmetic; it is not interchangeable with our declared rule. The scikit-survival function takes Boolean events first and times second, and returns unique times with cumulative values. The script prints those times rather than assuming their indices match raw records. Their API contracts are documented in "}<a href={"https://lifelines.readthedocs.io/en/latest/fitters/univariate/NelsonAalenFitter.html"}>{"lifelines' Nelson–Aalen reference"}</a>{" and "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.nonparametric.nelson_aalen_estimator.html"}>{"scikit-survival's reference"}</a>{". For another derivation of the continuous rate/survival relation, read "}<a href={"https://grodri.github.io/glms/notes/c7s1"}>{"Rodríguez's survival definitions"}</a>{"."}</Prose>

<Prose>{"The complete runnable main is below. Put it beside the two local support files. The tested environment is Python 3.12.14 with NumPy 2.3.5, SciPy 1.18.1, lifelines 0.30.3 and scikit-survival 0.28.0; these are the execution snapshot, not an assertion about every future release. In an activated Python learning environment, install these dependencies and run the main:"}</Prose>

<CodeBlock language={"bash"}>{"python -m pip install numpy==2.3.5 scipy==1.18.1 lifelines==0.30.3 scikit-survival==0.28.0\npython rates-and-probabilities.py"}</CodeBlock>

<Prose>{"The pump records and supplied lifetime laws are embedded, so this example runs with those three files and the installed packages."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/rates-and-probabilities.py"} filename={"rates-and-probabilities.py"} language={"python"} title={"rates-and-probabilities.py"} />

<Prose>{"Its complete recorded output is:"}</Prose>

<CodeBlock language={"output"}>{"constant three-day model: {\"H\": 0.6000000000000001, \"survival\": 0.5488116360940264, \"failure\": 0.45118836390597356, \"scipy_log_survival\": -0.6}\ntiny interval: {\"stable_failure\": 2.0000000000000002e-19, \"naive_subtraction\": 0.0}\nWeibull window: {\"shape\": 1, \"age\": 4, \"extra\": 3, \"H_increment\": 0.25, \"failure\": 0.22119921692859512, \"scipy_H_increment\": 0.25000000000000006}\nWeibull window: {\"shape\": 1, \"age\": 10, \"extra\": 3, \"H_increment\": 0.24999999999999992, \"failure\": 0.22119921692859507, \"scipy_H_increment\": 0.2499999999999999}\nWeibull window: {\"shape\": 2, \"age\": 4, \"extra\": 3, \"H_increment\": 0.22916666666666666, \"failure\": 0.20480401020487424, \"scipy_H_increment\": 0.22916666666666674}\nWeibull window: {\"shape\": 2, \"age\": 10, \"extra\": 3, \"H_increment\": 0.4791666666666667, \"failure\": 0.38070074045231517, \"scipy_H_increment\": 0.4791666666666664}\nWeibull window: {\"shape\": 0.5, \"age\": 0, \"extra\": 3, \"H_increment\": 0.5, \"failure\": 0.39346934028736663, \"scipy_H_increment\": 0.5}\nshape2 age4 instantaneous rate: 0.05555555555555555\ngrouped pump estimates: [{\"time\": 2.0, \"risk\": 8, \"d\": 1, \"NA_increment\": 0.125, \"NA_total\": 0.125, \"exp_minus_NA\": 0.8824969025845955, \"KM\": 0.875}, {\"time\": 3.0, \"risk\": 7, \"d\": 0, \"NA_increment\": 0.0, \"NA_total\": 0.125, \"exp_minus_NA\": 0.8824969025845955, \"KM\": 0.875}, {\"time\": 4.0, \"risk\": 6, \"d\": 1, \"NA_increment\": 0.16666666666666666, \"NA_total\": 0.29166666666666663, \"exp_minus_NA\": 0.7470175003104326, \"KM\": 0.7291666666666666}, {\"time\": 6.0, \"risk\": 4, \"d\": 1, \"NA_increment\": 0.25, \"NA_total\": 0.5416666666666666, \"exp_minus_NA\": 0.5817778142098083, \"KM\": 0.546875}, {\"time\": 7.0, \"risk\": 3, \"d\": 0, \"NA_increment\": 0.0, \"NA_total\": 0.5416666666666666, \"exp_minus_NA\": 0.5817778142098083, \"KM\": 0.546875}, {\"time\": 8.0, \"risk\": 2, \"d\": 1, \"NA_increment\": 0.5, \"NA_total\": 1.0416666666666665, \"exp_minus_NA\": 0.35286608145884896, \"KM\": 0.27343750000000006}, {\"time\": 9.0, \"risk\": 1, \"d\": 0, \"NA_increment\": 0.0, \"NA_total\": 1.0416666666666665, \"exp_minus_NA\": 0.35286608145884896, \"KM\": 0.27343750000000006}]\nordinary NA: {\"lifelines_at8\": 1.0416666666666665, \"scikit_times\": [2.0, 3.0, 4.0, 6.0, 7.0, 8.0, 9.0], \"scikit_cumulative\": [0.125, 0.125, 0.29166666666666663, 0.5416666666666666, 0.5416666666666666, 1.0416666666666665, 1.0416666666666665]}"}</CodeBlock>

<Prose>{"Small last-digit differences reflect floating-point arithmetic: for example, .2×3 prints.6000000000000001. The day-eight ordinary NA values agree with the exact fraction25/24, while the linked KM result remains35/128. The short-window output demonstrates why expm1 matters. These are deterministic mechanism comparisons; there is no claimed training accuracy or performance benchmark."}</Prose>

<Prose>{"We now know how a supplied rate generates an event-time law. To *learn* a rate from A–H, the next section will score each recorded failure as exact event evidence and each censored row as survival beyond its endpoint. Those are different contributions to one observed-data likelihood."}</Prose>

<H2>{"6. Fit the likelihood of what was observed"}</H2>

<Prose>{""}<strong>{"Which rate best explains both recorded failures and still-running endpoints?"}</strong>{" A failure points to a density height; a logging endpoint points to the surviving tail."}</Prose>

<DensityTailFigure />

<Prose>{"In the last section a supplied rate generated a survival law. Now we will choose a rate from observations. First, hold the previous supplied rate at .2/day so the two kinds of evidence can be compared without changing the law. Pump C has a filled failure mark at day four. Pump D has an open logging-end mark there. Their time locations agree; their evidence does not."}</Prose>

<Prose>{"The density curve represents probability mass spread over time. C's exact event points to its height at four: f(4)=.2exp(−.8)≈.089866 per day. If the measurement instead reported a short interval of width ε around that time, the corresponding event probability would be approximately that height times ε. Here we use the exact-time density contribution. A single exact instant has zero probability under a continuous law; using its density in a likelihood is not claiming otherwise. A rounded or interval-recorded time needs its actual observation likelihood, addressed in "}<strong>{"Respect entry and changing information"}</strong>{" later in this lesson."}</Prose>

<Prose>{"D's event could occur at any later time. Shade the density to the right of four: that entire tail has probability S(4)=exp(−.8)≈.449329, with no per-day unit. Do not put D's contribution at the density height just because its logger also ended at four. The two pictures describe precisely the equality T=4 versus the inequality T>4 established in "}<strong>{"Define the event and start the clock"}</strong>{"."}</Prose>

<Prose>{"For a candidate lifetime law with parameters θ, the "}<strong>{"likelihood"}</strong>{" scores how that law supports the records we have. θ can be a single rate here or a collection of model parameters later. Under the observation assumptions in "}<strong>{"Decide what incomplete observation permits"}</strong>{", an exact event contributes fθ(Y), and a right-censored endpoint contributes Sθ(Y). For independent subjects,"}</Prose>

<div className="neural-equation"><MathBlock>{"L(\\theta)\\propto\\prod_i\nf_\\theta(Y_i)^{\\delta_i}S_\\theta(Y_i)^{1-\\delta_i}\n=\\prod_i h_\\theta(Y_i)^{\\delta_i}S_\\theta(Y_i)."}</MathBlock></div>

<Prose>{"The product runs over subjects i. Our event flag δ is1 for a recorded failure and0 for censoring. When δ=1, the factor is f=hS. When δ=0, its density/hazard factor is absent and the surviving tail remains. We are varying θ with the observations fixed; likelihood is not a probability distribution over θ. Density and tail factors also have different units. Changing duration units changes the event-density factors by a Jacobian; consistent conversion preserves the fitted physical law."}</Prose>

<H3>{"Deeper: why the observation process can sometimes be set aside"}</H3>

<Prose>{"The proportionality sign above omits a justified observation-process factor, not unknown evidence by fiat. For an independent continuous censoring clock C, write its density g and survivor G. An observed event at y requires the pump to fail there *and* logging to last that long, giving fθ(y)G(y). A censor at y requires logging to end there while the pump is still running, giving g(y)Sθ(y). If this censoring law has separate parameters that do not change with θ, its factors can be omitted when maximizing the lifetime likelihood. For a fixed administrative endpoint the observation clock has an atom; the corresponding fixed cutoff factors are handled under that protocol, rather than pretending it has an ordinary continuous density."}</Prose>

<Prose>{"The required independence is the one appropriate to the population or measured-feature group being fitted. If logging is removed because an unmeasured deteriorating seal looks likely to fail, the observation factors cannot generally be separated this way. Dropping g or G from the formula does not make the process ignorable. The selection mechanism from section2 is the concrete reason for stating this assumption before fitting."}</Prose>

<Prose>{"For a positive continuous law starting with S(0)=1, take logs and use log Sθ(Y)=−Hθ(Y) from "}<strong>{"Accumulate the rate instead of adding failure probabilities"}</strong>{". Products become sums:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\ell(\\theta)=\\sum_i\n\\left[\\delta_i\\log h_\\theta(Y_i)-H_\\theta(Y_i)\\right]\n\\quad\\text{up to terms independent of }\\theta."}</MathBlock></div>

<Prose>{"The symbol ℓ is the log-likelihood. Recorded failures contribute a local log-rate term; *every* subject contributes accumulated rate over its actual observed running time. A censored subject therefore supplies information without inventing a failure after logging ends."}</Prose>

<H3>{"Fit one constant rate from the exposure lanes"}</H3>

<Prose>{""}<strong>{"What does the constant-rate law need to remember about A–H?"}</strong>{" Keep the four failure marks and add all eight observed running lengths."}</Prose>

<ExposureLikelihoodFigure />

<Prose>{"The lengths are 2, 3, 4, 4, 6, 7, 8 and 9 days. Stack them end to end in the exposure ruler: they total 43 "}<strong>{"pump-days"}</strong>{". Four filled marks identify the observed failures. B, D, F and H have no failure mark, but their running lengths still add to the denominator. Call total observed failures "}<strong>{"D"}</strong>{" and total observed exposure "}<strong>{"E"}</strong>{". This capital D is a count, distinct from pump D's identity; the count and pump name are labelled separately."}</Prose>

<Prose>{"For a constant rate r, H(Y)=rY. Insert this into the log-likelihood and collect the sums:"}</Prose>

<div className="neural-equation"><MathBlock>{"D=\\sum_i\\delta_i=4,\\qquad E=\\sum_iY_i=43\\ \\text{pump-days},\n\\qquad\\ell(r)=D\\log r-rE."}</MathBlock></div>

<Prose>{"The first term rewards a rate that can account for recorded failures; the second penalizes a rate that accumulates too much expected failure activity over the observed running time. A very small rate struggles to account for four events. A very large rate struggles to account for all that running. The drawing's likelihood curve has a maximum between those extremes."}</Prose>

<Prose>{"Differentiate with respect to the rate. The slope of D log r is D/r; the slope of −rE is −E. Setting their sum to zero gives the maximum:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\ell'(r)=\\frac D r-E=0\n\\quad\\Longrightarrow\\quad\\widehat r=\\frac D E\n=\\frac4{43}\\approx.09302326\\ \\text{per day}."}</MathBlock></div>

<Prose>{"For D>0 and E>0 the second derivative is −D/r²<0, so this stationary point is the unique maximum. This formula is the maximum-likelihood rule for the specified shared constant-rate law; it is not an assumption-free replacement for an age-varying hazard or the nonparametric KM curve."}</Prose>

<Prose>{"Now use D20's one control: imagine extending H's event-free logging by four additional days, keeping the four failures unchanged. Its length becomes13; total exposure becomes47. The fitted rate drops to4/47≈.08510638/day. This is a labelled hypothetical additional observation, not a newly discovered historical failure time for H. More event-free observation supports a lower rate under this model. Counting only completed failures would miss that change."}</Prose>

<Prose>{"The fitted law now gives S(t)=exp(−4t/43). At day ten this is about.394462. Day ten is beyond the original recorded follow-up ending at nine: this prediction is "}<strong>{"parametric extrapolation"}</strong>{" justified by the constant-rate assumption, not a supported KM query. This contrasts with the support refusal in "}<strong>{"Implement the accounting once, then query it efficiently"}</strong>{". The two methods have different assumptions; neither should silently inherit the other's interpretation."}</Prose>

<Prose>{"Changing all times to hours multiplies E by24 and divides r by24, giving 4/1032≈.00387597/hour. Multiplying that rate by240 hours gives the same day-ten accumulated rate as before. If nobody is censored and all n subjects fail, D=n and E is their total lifetime, so D/E is the reciprocal of the ordinary sample mean. With censoring, E/n is mean *observed endpoint*, not mean failure time: the reciprocal-mean shortcut no longer follows."}</Prose>

<Prose>{"The complete "}<code>{"exponential-censored-likelihood.py"}</code>{" connects the closed-form calculation to numerical fitting on the same pump observations:"}</Prose>

<Prose>{"Complete source — "}<code>{"exponential-censored-likelihood.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/exponential-censored-likelihood.py"} filename={"exponential-censored-likelihood.py"} language={"python"} title={"exponential-censored-likelihood.py"} />

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"}>{"events / exposure: 4 43.0\nrate per day: 0.09302326\nnumerical likelihood fit: 0.09302326\nrate with four extra censored running days: 0.08510638\nS(10): 0.394462\nrate per hour: 0.00387597\nNo events: likelihood increases as the positive rate tends to zero."}</CodeBlock>

<Prose>{"Its positive log-rate parameterization permits an interior numerical fit; the bracket pair supplies starting points for a search, not an assurance of a finite solution in every dataset. The core below handles mathematical boundary statuses before requesting an optimizer. The day-ten value uses the stated constant-rate extrapolation; the rate-per-hour value changes units."}</Prose>

<H3>{"Handle the cases with no finite interior optimum"}</H3>

<Prose>{"The four-failure example has an interior maximum. The same formula exposes cases where searching harder cannot produce one:"}</Prose>

<NeuralTable caption={"Handle the cases with no finite interior optimum"} headers={[<>{"Recorded evidence"}</>,<>{"Log-likelihood shape"}</>,<>{"Returned interpretation"}</>]} rows={[[<>{"D>0 and E>0"}</>,<>{"Rises then falls"}</>,<>{"Finite positive maximum D/E"}</>],[<>{"D=0 and E>0"}</>,<>{"−rE decreases as r increases"}</>,<>{"Supremum as positive r approaches0"}</>],[<>{"D>0 and E=0"}</>,<>{"D log r increases without bound"}</>,<>{"No finite maximum"}</>],[<>{"D=0 and E=0"}</>,<>{"Constant0 for every rate"}</>,<>{"No rate identified by these observations"}</>]]} />

<Prose>{"For three subjects censored at1,2 and4, E=7 and D=0. Every positive rate can be improved by reducing it. A positive-rate exponential lifetime family has only a supremum here; if we extend the model to permit a zero-rate never-event law, that boundary can be returned explicitly. It does not prove that the population never fails or justify an uncertainty estimate of zero. Our result names the boundary and leaves log-rate/information unavailable instead of taking log0."}</Prose>

<Prose>{"The zero-exposure rows are separate declared thought experiments. If two exact events are recorded at the origin, the constant-rate density likelihood has no finite maximum. If two subjects are censored immediately at the origin, no observed running interval or event distinguishes one rate from another. Neither case should inherit an apparently converged tiny optimizer step. Origin events may also indicate a clock/measurement model that needs revision; the statuses keep that decision visible."}</Prose>

<H3>{"Deeper: read the score and curvature as count balance"}</H3>

<Prose>{""}<strong>{"Why is the fitted rate where the likelihood stops rising?"}</strong>{" At the maximum, accumulated rate over observed exposure balances the event count."}</Prose>

<RateScoreFigure />

<Prose>{"The left count is the four observed events. The right count-like quantity is rE: rate per day multiplied by pump-days. At the supplied rate.2/day, it is8.6, greater than the observed four. Increasing the rate there makes the likelihood worse. At the fitted4/43 it is exactly4. The two quantities balance. The diagram also names which parameter the slope belongs to, so a rate slope and a log-rate slope are not interchanged."}</Prose>

<Prose>{"For numerical optimization it is convenient to use a log-rate coordinate η, pronounced “eta,” so a finite coordinate always represents a positive rate. Precisely, it is the logarithm of r relative to a chosen reference rate of1/day. In calculations using numerical rates per day, r=exp(η). Changing duration units changes that reference/numerical coordinate consistently, while preserving the physical law."}</Prose>

<Prose>{"Using the chain rule, dr/dη=r. Multiply the rate slope D/r−E by r to obtain the "}<strong>{"score"}</strong>{", or log-likelihood slope, in this coordinate:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\ell(\\eta)=D\\eta-Ee^\\eta,\\qquad\nU_\\eta=\\frac{\\partial\\ell}{\\partial\\eta}=D-rE,\n\\qquad I_\\eta=-\\frac{\\partial^2\\ell}{\\partial\\eta^2}=rE."}</MathBlock></div>

<Prose>{"The "}<strong>{"observed information I"}</strong>{" is negative curvature of the log-likelihood, equivalently minus the *first* derivative of its score. It is not minus the second derivative of the score. For a finite interior fit Iη=D=4. In the original rate coordinate, Ir=D/r², giving1849/4=462.25 at this fit. The different numbers describe curvature in differently scaled coordinates; they are not conflicting evidence about the same model."}</Prose>

<Prose>{"A sharper downward curve means a small parameter change produces a larger loss of likelihood: the data locate the maximum more tightly. To connect that picture to *sampling* uncertainty, suppose the population's true constant rate is an interior value r₀. A new cohort gives a slightly different score U(r₀), and therefore a slightly different fitted rate. Near r₀, approximate the score by a straight line with slope −I(r₀). Since the fitted score is zero,"}</Prose>

<div className="neural-equation"><MathBlock>{"0=U(\\widehat r)\\approx U(r_0)-I(r_0)(\\widehat r-r_0),\n\\qquad\\widehat r-r_0\\approx\\frac{U(r_0)}{I(r_0)}."}</MathBlock></div>

<Prose>{"Under the regular, correctly specified independent-observation likelihood, the score has mean zero and variance equal to the expected information J, where J is the average of observed information over repeated cohorts. Replacing the nearby observed curvature by J gives approximately J/J²=1/J variance for the fitted rate. With enough information, the fitted observed curvature estimates J, yielding the usual "}<strong>{"inverse-information"}</strong>{" approximation. This reasoning needs an interior rate, usable curvature and a valid observation likelihood; it is not the claim that likelihood as a function of rate is itself a probability distribution over rate. The flat and boundary cases violate the local picture that supplied the approximation."}</Prose>

<Prose>{"Thus the approximate rate variance is D/E²=4/1849, and its standard error is sqrt(D)/E=2/43. The log-rate standard error is1/sqrt(D)=.5. These are large-sample/local approximations; four events give little basis for treating a bell-shaped approximation as exact. Boundary and flat cases do not receive these interior formulas. Expected information additionally averages over the sampling/censoring design; it is not obtained by assuming all possible exposure totals are fixed."}</Prose>

<Prose>{"There is a useful computational connection to Poisson regression. The factorial D! multiplies the integers from1 through D, with0!=1; it supplies the count law's normalizing factor. If a Poisson count D has a fixed exposure E and mean rE, its log-likelihood is D log(rE)−rE−log(D!). Terms involving log E and D! do not vary with r, leaving the same D log r−rE expression. That parameter-dependent agreement supports the shared exposure machinery used in piecewise-rate models. It does "}<strong>{"not"}</strong>{" establish that D given the realized stopped survival exposure is Poisson. For one uncensored first-event subject, D=1 whenever its lifetime is observed; conditioning on that realized lifetime does not make D a Poisson variable. The algebraic likelihood bridge and the actual sampling law must remain distinct."}</Prose>

<H3>{"Implement the totals and statuses before the optimizer"}</H3>

<Prose>{"The complete "}<a href={"/learn-assets/survival-reading-flow/content/programs/exponential_observations.py"}>{"exponential_observations.py"}</a>{" file implements the constant-rate right-censor outcome just derived. It does not fit entry or interval-censor responses; those later likelihoods compose different information. The inputs are finite nonnegative durations and equally long Python Boolean/integer0–1 event flags. Their unit is chosen by the caller and held consistent with returned rate units."}</Prose>

<Prose>{"observation_totals makes one pass over paired inputs, increments the event count and supplies durations to math.fsum. The latter retains accurate partial sums without materializing the observation rows. zip_longest detects a length mismatch instead of silently discarding the last subject. Preparation takes O(n) work under ordinary floating-point arithmetic; it keeps count/exposure bookkeeping instead of an n-row design matrix. The post-preparation closed-form fit and each likelihood query take O(1). The total must be representable; invalid durations or overflow are explicit errors rather than silently rescaled observation units."}</Prose>

<Prose>{"fit_exponential handles zero exposure and zero events before division or logarithms. A finite fit returns rate, log-rate, log-likelihood and log-rate information. For other statuses, absent quantities are None, which becomes null in the example's JSON. A downstream predictor should inspect the status instead of treating None as a numerical rate. log_rate_terms evaluates the expected exposure as exp(η+log E), avoiding a separately overflowing exp(η) multiplied by tiny E. Its score and information expose exactly the D−rE and rE quantities in D21. Unrepresentable positive products are reported rather than clipped into successful fits."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/exponential_observations.py"} filename={"exponential_observations.py"} language={"python"} title={"exponential_observations.py"} />

<H3>{"Compare with ordinary density, survival and scalar minimization"}</H3>

<Prose>{"The runnable "}<a href={"/learn-assets/survival-reading-flow/content/programs/constant-rate-observations.py"}>{"constant-rate-observations.py"}</a>{" main uses SciPy's expon(scale=1/r).pdf and sf to check the exact-event density and right-censor tail on the *fitted* law. The earlier D19 illustration held the supplied rate at.2; this program uses the learned4/43. Its day-four values therefore change together to density about.064120/day and tail about.689290. This explicit change of law prevents mistaking the two illustrations for disagreement."}</Prose>

<Prose>{"The ordinary optimizer is demonstrated on a separate, declared four-subject fixture: times1,3,5,6 and failure flags true,false,true,false. It has D=2 and E=15, so the analytical maximum is2/15. The bounded minimizer sees only this new fixture; it minimizes negative log-likelihood in η between the coordinates of rates.01 and1. These bounds deliberately contain2/15 and do not claim to find a global solution for every observation family. The main prints success, message, evaluation count and score as well as the rate. Boundary cases were decided before calling it. The relevant "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.minimize_scalar.html"}>{"SciPy scalar-optimizer reference"}</a>{" documents the distinction between a bracket search and fixed bounds."}</Prose>

<Prose>{"Keep this main beside "}<code>{"exponential_observations.py"}</code>{". In the Python3.12.14 learning environment used for section 5, SciPy1.18.1 is installed; otherwise install "}<code>{"scipy==1.18.1"}</code>{" there. Run "}<code>{"python constant-rate-observations.py"}</code>{". The inputs are included in the complete main:"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/constant-rate-observations.py"} filename={"constant-rate-observations.py"} language={"python"} title={"constant-rate-observations.py"} />

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"}>{"pump closed-form fit: {\"status\": \"finite-interior\", \"rate\": 0.09302325581395349, \"log_rate\": -2.374905754573672, \"log_likelihood\": -13.499623018294688, \"information_log_rate\": 4.0, \"totals\": {\"subjects\": 8, \"failures\": 4, \"exposure\": 43.0}}\npump log-rate terms at fit: {\"log_likelihood\": -13.499623018294688, \"score\": 8.881784197001252e-16, \"information\": 3.999999999999999}\nday4 different contributions: {\"event_density_per_day\": 0.06412001111913346, \"right_censor_tail\": 0.6892901195306848, \"scipy_density\": 0.06412001111913347, \"scipy_tail\": 0.6892901195306848}\nmodel extrapolation at10: {\"survival\": 0.39446196436332454, \"scipy_survival\": 0.39446196436332454}\nfour extra running days: {\"status\": \"finite-interior\", \"rate\": 0.0851063829787234, \"log_rate\": -2.4638532405901676, \"log_likelihood\": -13.85541296236067, \"information_log_rate\": 4.0, \"totals\": {\"subjects\": 8, \"failures\": 4, \"exposure\": 47.0}}\nsame observations in hours: {\"status\": \"finite-interior\", \"rate\": 0.003875968992248062, \"log_rate\": -5.552959584921617, \"log_likelihood\": -26.21183833968647, \"information_log_rate\": 4.0, \"totals\": {\"subjects\": 8, \"failures\": 4, \"exposure\": 1032.0}}\nall censored: {\"status\": \"zero-boundary\", \"rate\": 0.0, \"log_rate\": null, \"log_likelihood\": 0.0, \"information_log_rate\": null, \"totals\": {\"subjects\": 3, \"failures\": 0, \"exposure\": 7.0}}\nzero-time events: {\"status\": \"unbounded-likelihood\", \"rate\": null, \"log_rate\": null, \"log_likelihood\": null, \"information_log_rate\": null, \"totals\": {\"subjects\": 2, \"failures\": 2, \"exposure\": 0.0}}\nzero-time censors: {\"status\": \"flat-likelihood\", \"rate\": null, \"log_rate\": null, \"log_likelihood\": 0.0, \"information_log_rate\": null, \"totals\": {\"subjects\": 2, \"failures\": 0, \"exposure\": 0.0}}\nnew four-subject SciPy witness: {\"expected_rate\": 0.13333333333333333, \"rate\": 0.1333333336161855, \"log_rate\": -2.0149030184208736, \"success\": true, \"message\": \"Solution found.\", \"evaluations\": 12, \"gradient\": -4.242782125629674e-09}"}</CodeBlock>

<Prose>{"The four-row numerical rate agrees with2/15 within optimizer tolerance, and its score is near zero. The displayed likelihoods change by the event-density unit conversion when using hours; the fitted law and log-rate curvature agree after converting units. The output keeps all four fit statuses explicit. Section 14 extends this core after introducing interval and entry observations."}</Prose>

<Prose>{"We have fitted one shared constant rate, using both failures and event-free running. If two groups have different survival patterns, pooling their exposure into one rate hides that comparison. Next we will keep the groups separate and ask how to compare their failures with the right risk-set denominators."}</Prose>

<H2>{"7. Compare groups with the right denominator"}</H2>

<Prose>{""}<strong>{"Did one group fail more often, or did it simply have more pumps left to fail?"}</strong>{" Compare failures with the groups' current opportunities, not their starting sizes."}</Prose>

<FailureAllocationFigure />

<Prose>{"The previous section pooled every pump's exposure to fit one rate. Now suppose we are told that A–D use seal design 1 and E–H use design 0. These are newly supplied group labels for the same eight observations, not evidence that the designs were randomly assigned. At the start there were four pumps of each design. Just before day 4, A has already failed and B's observation has stopped. Only C and D remain in group 1; E, F, G and H remain in group 0. D still participates in this comparison because, as in section 3, its day 4 censor removal comes after the day 4 failure comparison. The current split is "}<strong>{"two versus four"}</strong>{", despite the initial four versus four."}</Prose>

<Prose>{"For the picture's first investigation, temporarily imagine "}<strong>{"two failures among these six competitors"}</strong>{". This is a hypothetical allocation question: the original day 4 record has only one failure. We deliberately change that count to make every possible allocation visible. If the two designs have the same event opportunity at this instant, which two identities might fail?"}</Prose>

<Prose>{"Every pair of distinct identities is a possible selection. There are fifteen: C/D; C/E, C/F, C/G, C/H; D/E, D/F, D/G, D/H; E/F, E/G, E/H, F/G, F/H, G/H. One pair contains both group 1 pumps, eight contain one pump of each group, and six contain no group 1 pump. The two failures are selected without replacement: the same first-failure subject cannot fail twice in this batch."}</Prose>

<NeuralTable caption={"7. Compare groups with the right denominator"} headers={[<>{"Group 1 failures in the hypothetical batch"}</>,<>{"Number of identity pairs"}</>,<>{"Probability under equal opportunity"}</>]} rows={[[<>{"0"}</>,<>{"6"}</>,<>{"6/15"}</>],[<>{"1"}</>,<>{"8"}</>,<>{"8/15"}</>],[<>{"2"}</>,<>{"1"}</>,<>{"1/15"}</>]]} />

<Prose>{"The average group 1 count is (0×6+1×8+2×1)/15=2/3. It is a fractional "}<strong>{"expected count"}</strong>{", not a claim that part of a physical pump fails. Move the group 1-count control through 0,1,2. Each state shows one representative pair, the complete unchanged fifteen-pair law, and the observed count minus 2/3: −2/3,1/3,4/3. More group 1 failures than expected give a positive difference; fewer give a negative one. Reset returns the observed count to 1."}</Prose>

<H3>{"What makes an observed count surprising?"}</H3>

<Prose>{"We need the spread of counts under the same equal-opportunity comparison. The fifteen pairs also tell us how variable the count can be. Square each count's distance from 2/3 and average those squared distances:"}</Prose>

<div className="neural-equation"><MathBlock>{"v=\\frac{6(0-2/3)^2+8(1-2/3)^2+(2-2/3)^2}{15}\n =\\frac{16}{45}."}</MathBlock></div>

<Prose>{"This "}<strong>{"variance"}</strong>{" measures the spread of possible counts, in squared-count units. Its square root is a standard deviation. A difference divided by that standard deviation gives a dimensionless size relative to the comparison's natural fluctuation. A large raw difference is not automatically strong evidence: the number of failures, the group proportions and the remaining population all affect the relevant spread."}</Prose>

<Prose>{"Name the current total n, group 1 count n1 and group 0 count n0, with n=n1+n0. Let d be the number of failures in the batch, and d1 the observed group 1 failures. Under the conditional equal-opportunity allocation, selecting d distinct subjects from n gives a "}<strong>{"hypergeometric"}</strong>{" count: sampling group membership without replacement. Its mean and variance are"}</Prose>

<div className="neural-equation"><MathBlock>{"e_1=d\\frac{n_1}{n},\\qquad\nv_1=d\\frac{n_1}{n}\\frac{n_0}{n}\\frac{n-d}{n-1},\\qquad n>1."}</MathBlock></div>

<Prose>{"Here e1=2×2/6=2/3 and v1=2×(2/6)×(4/6)×(4/5)=16/45, matching the actual enumeration. When only one subject remains, there is no uncertainty about which group it belongs to; use variance zero instead of a 0/0 formula. If every current competitor fails, the group's count is also fixed and variance is zero. Neither situation supplies a between-group contrast."}</Prose>

<Prose>{""}<strong>{"Deeper: why the last factor matters."}</strong>{" If we imagined d independent draws with replacement, each group 1 indicator would have probability p=n1/n and variance p(1−p). We would obtain variance d p(1−p). But these failures refer to distinct subjects. After a group 1 identity is selected, there is one fewer such identity available. For two distinct draws, P(both group 1)=n1(n1−1)/(n(n−1)), so their covariance is −p(1−p)/(n−1). Adding the d individual variances and d(d−1) cross terms gives d p(1−p)[1−(d−1)/(n−1)], which is the formula above. The correction tends to one for a small batch in a large risk set and becomes zero when d=n."}</Prose>

<Prose>{"The finite calculation presumes exchangeable failing identities within this conditional null comparison. It does not randomly assign the seal design or prove that censoring is harmless. Independent subjects and noninformative right censoring within each group are the observation assumptions here; the groups may have different independent censoring distributions. If loggers are removed in response to an unrecorded impending failure, the earlier identification problem remains. Rounding continuous failure times into large tied batches also warrants checking the tie/observation convention rather than declaring this a universally exact sampling model."}</Prose>

<H3>{"How do we combine comparisons through time?"}</H3>

<Prose>{"Return to the actual one-failure-at-day 4 pump record; rebuild each denominator before adding its contribution."}</Prose>

<AccumulatedGroupFigure />

<Prose>{"Follow the day ruler in the upper drawing. Every failure time has a fresh roster immediately before its events. Censoring between failures changes the next roster without creating an event count. The middle rows show observed, expected and difference for group 1. The signed segments below them accumulate the differences; a separate squared-spread accumulator adds the variances. These are different quantities and therefore have separately labelled rulers."}</Prose>

<NeuralTable caption={"How do we combine comparisons through time?"} headers={[<>{"Actual failure day"}</>,<>{"Group 1 at risk"}</>,<>{"Group 0 at risk"}</>,<>{"Total failures"}</>,<>{"Group 1 observed"}</>,<>{"Group 1 expected"}</>,<>{"Observed−expected"}</>,<>{"Variance"}</>]} rows={[[<>{"2"}</>,<>{"4"}</>,<>{"4"}</>,<>{"1"}</>,<>{"1"}</>,<>{"1/2"}</>,<>{"1/2"}</>,<>{"1/4"}</>],[<>{"4"}</>,<>{"2"}</>,<>{"4"}</>,<>{"1"}</>,<>{"1"}</>,<>{"1/3"}</>,<>{"2/3"}</>,<>{"2/9"}</>],[<>{"6"}</>,<>{"0"}</>,<>{"4"}</>,<>{"1"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"8"}</>,<>{"0"}</>,<>{"2"}</>,<>{"1"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0"}</>,<>{"0"}</>]]} />

<Prose>{"At day 2, one of eight competitors fails and four belonged to group 1: its expected count was 1/2. At day 4, B is no longer observed but D still competes, so one failure gives expectation 2/6=1/3, not 1/2. After C's failure and D's logging end, group 1 has no remaining competitors. Group 0's later failures describe its survival, but cannot tell us whether an absent group 1 pump would have failed at the same instant. Their zero contributions prevent that unsupported comparison."}</Prose>

<Prose>{"Add the signed differences to form U=1/2+2/3=7/6. Add their conditional variances to form V=1/4+2/9=17/36. The "}<strong>{"log-rank test"}</strong>{" standardizes this accumulation; j indexes the distinct ordered failure batches:"}</Prose>

<div className="neural-equation"><MathBlock>{"U=\\sum_j(d_{1j}-e_{1j}),\\qquad V=\\sum_jv_{1j},\\qquad\nZ=U/\\sqrt V,\\qquad Q=Z^2."}</MathBlock></div>

<Prose>{"For these pumps, Q=(7/6)²/(17/36)=49/17≈2.882353. Positive U means more observed group 1 failures than expected across the compared event times; squaring loses that direction. Under equal group hazards and the usual large-sample conditions, Z is approximately standard normal and Q has an approximate chi-square distribution with one degree of freedom. Its upper-tail probability is the reported "}<strong>{"p-value"}</strong>{": how often the null comparison would give a statistic at least this large. It is not the probability that the null hypothesis is true. The example's approximate p-value is .089555; eight pumps are a teaching calculation, not assurance that an asymptotic approximation is accurate for an actual small-sample decision."}</Prose>

<Prose>{""}<strong>{"Deeper: why adding variances can work even though the rosters overlap."}</strong>{" The same subject can appear in many risk sets, so it is misleading to claim that the entire roster tables are independent. Under the null, the next observed-minus-expected increment is conditionally centered given the event history and current roster. Earlier centered increments therefore have zero covariance with later ones under the appropriate counting-process conditions. This is the martingale-difference reasoning behind accumulated score variation. It requires the observation assumptions, event information and a valid limiting regime; it does not turn the displayed finite Q into an exact chi-square law."}</Prose>

<Prose>{"If V=0, return an explicitly unavailable test. No events, no overlapping competitors, or deterministic whole-roster failures cannot establish equality. Changing all time units from days to hours preserves event ordering, ties and the test. Changing group names reverses U but preserves Q. Those facts are useful implementation checks: this test depends on ordered risk-set opportunities, not the numerical distance between event times."}</Prose>

<H3>{"What does a larger ordinary workflow look like?"}</H3>

<Prose>{"The hand calculation makes the mechanism visible; a separately saved simulation shows the usual library workflow without pretending that eight pumps are a study."}</Prose>

<Prose>{"We now switch examples explicitly. The following complete original program constructs two simulated groups totaling 200 subjects. A binary label x identifies the group. Its supplied coefficient −.7 multiplies x inside an exponential, scaling the event rate from the baseline. The variable named true_beta is this generator coefficient; no model estimates it in this program. Follow-up is generated independently, durations are the smaller of failure/follow-up, and the event flag distinguishes which clock stopped first. The code then fits separate Kaplan–Meier descriptions and calls the ordinary two-group test. These ingredients have been taught in sections 1–6 and the comparison above; feature-dependent rate estimation itself is the next section's task."}</Prose>

<Prose>{"Complete source — "}<code>{"synthetic-group-comparison.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/synthetic-group-comparison.py"} filename={"synthetic-group-comparison.py"} language={"python"} title={"synthetic-group-comparison.py"} />

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"}>{"subjects / events / censored: 200 113 87\ngroup 0 S(5), S(10): [0.607843, 0.365577]\ngroup 1 S(5), S(10): [0.785714, 0.625616]\nlog-rank chi-square / asymptotic p: 19.744046 8.85371e-06\nThese are simulated group associations under the stated generator."}</CodeBlock>

<Prose>{"Group 1 retains more simulated survival at 5 and 10 in this particular generator; the test statistic 19.744046 has approximate p-value 8.85371×10⁻⁶. The generator's associations are not evidence that a real treatment causes that change, and these point estimates are not interval estimates. Unlike the original eight pumps' short group 1 follow-up, these are separately generated observations with their own support; the output does not justify extending the pump curve to day 10. Keep the RandomState stream in the complete saved source when reproducing this particular example; replacing it with a different generator that happens to use seed 42 does not reproduce its recorded rows."}</Prose>

<H3>{"What if the survival patterns reverse?"}</H3>

<Prose>{"Opposite signed contributions can cancel even when the curves clearly differ."}</Prose>

<CrossingGroupsFigure />

<Prose>{"This inset is another explicitly constructed example, chosen to expose a failure of the test's summary. Each group begins with four subjects. Group 1 has two failures at day 1 and two subjects censored at day 3. Group 0 has three failures at day 2 and one subject censored at day 3. Just after day 1, its Kaplan–Meier survivals are group 1=.5 and group 0=1. Just after day 2, they are group 1=.5 and group 0=.25. The ordering reverses: early outcomes favor group 0, later survival favors group 1. The horizontal event-free pieces and labelled jumps make this crossing visible without fitting a smooth curve between events."}</Prose>

<Prose>{"At day 1, n1=n0=4 and d=2. Group 1's observed 2 versus expected 1 gives U1=+1, with variance 3/7. At day 2, n1=2,n0=4 and d=3. Group 1's observed 0 versus expected 1 gives U2=−1, with variance 2/5. Thus U=0 while V=29/35 remains positive. The ordinary statistic is zero and its asymptotic p-value is 1. This is cancellation of a signed summary, not proof that the curves are equal, that either design is harmless, or that the groups are clinically equivalent."}</Prose>

<Prose>{"Log-rank is especially effective against a sustained proportional-hazards alternative: one group's event rate is consistently a fixed multiple of the other's. Equal hazards is the null used for calibration; a proportional-hazards alternative is a power consideration, not a requirement that every alternative must obey that model. With crossing curves or delayed effects, the accumulated signed contrast can lose power. Inspect the survival patterns and choose an effect question that matters before choosing a test."}</Prose>

<Prose>{"For example, a survival probability at a declared supported time or the restricted-mean difference over a common supported horizon can answer a more specific practical question. Section 4 explains those quantities. Their between-group uncertainty requires its own procedure; a p-value from log-rank does not supply that interval or an equivalence conclusion. Do not search many times or tests and report whichever result looks best without accounting for that selection."}</Prose>

<H3>{"Can we emphasize early or late differences deliberately?"}</H3>

<Prose>{"A time-weighted test changes the question by changing each event-time contribution. For a weight wj chosen from information available before the current failure batch,"}</Prose>

<div className="neural-equation"><MathBlock>{"U_w=\\sum_j w_j(d_{1j}-e_{1j}),\\qquad\nV_w=\\sum_j w_j^2v_{1j},\\qquad Q_w=U_w^2/V_w."}</MathBlock></div>

<Prose>{"The weight must be squared in the variance: multiplying a random quantity by w multiplies its variance by w². Ordinary log-rank uses w=1. The generalized Wilcoxon/Breslow choice uses the current risk count n, emphasizing earlier times with more competitors. Tarone–Ware uses sqrt(n), a milder version of that emphasis. A Fleming–Harrington choice uses the "}<strong>{"pooled survival immediately before"}</strong>{" the time, Sleft, to set w=Sleftᵖ(1−Sleft)ᑫ with nonnegative exponents. Here p and q name weighting exponents, distinct from the test p-value and the group share called p in the earlier variance derivation. Pooling here ignores the group label to estimate the common survivor under the comparison; it does not pool away the group 1-versus-group 0 observed counts."}</Prose>

<Prose>{"With p=0,q=1, early weights are small because few subjects have failed yet. For the crossing fixture, Sleft is 1 at day 1 and .75 at day 2. The weights are therefore 0 and .25, U_w=−.25, V_w=.025 and Q_w=2.5. With Wilcoxon weights 8 and 6, the contributions are+8 and −6 instead: U_w=2,V_w=1464/35 and Q_w=35/366. Weighting changes the contrast rather than guaranteeing a significant result. When an exponent is zero its factor is defined as one, including the initial (1−Sleft)⁰ factor."}</Prose>

<Prose>{"Choose the scientific emphasis before examining group outcomes. A pooled, left-continuous data-based weight can be predictable in the relevant history; an outcome-chosen best weight is a selection procedure that needs additional calibration. The ordinary library also offers Peto weighting, which uses a modified pooled survival estimate; it is not interchangeable with the Fleming–Harrington formula. The scratch implementation below deliberately supports the four choices just derived rather than silently substituting one for Peto. "}<a href={"https://lifelines.readthedocs.io/en/latest/lifelines.statistics.html"}>{"The lifelines API"}</a>{" documents its right-censor interface and weighting conventions."}</Prose>

<Prose>{""}<strong>{"Deeper: several groups and strata."}</strong>{" With several groups, each batch has a vector of observed-minus-expected counts. Now let the column vector p contain all group shares pg in the current roster; this p is a vector, rather than the earlier single group share or weighting exponent. The batch covariance is d(n−d)/(n−1) times [diag(p)−ppᵀ], where diag(p) places the shares on the matrix diagonal and ppᵀ is their outer product. Diagonal entries measure each count's variation; off-diagonal entries are negative because allocating a failure to one group leaves fewer available to the others. All centered counts sum to zero, so the full covariance is singular. Use an independent set of contrasts; do not invert the redundant full matrix. Under suitable regularity and full contrast information, a k-group test has k−1 asymptotic degrees of freedom. Sparse/no-overlap groups can reduce the usable information."}</Prose>

<Prose>{"In the six-subject allocation above, the two-group covariance has diagonal 16/45 and off-diagonal−16/45; its zero-sum direction has variance zero. That is the same physical constraint already visible in selecting exactly two failures. The ordinary multivariate_logrank_test handles multiple group labels. If comparison must respect predefined strata with different baseline hazards, build each risk set "}<strong>{"within"}</strong>{" its stratum, calculate its contributions, and then aggregate independent strata. Pooling across strata changes which subjects are allowed to compete. These extensions do not add causal identification or allow delayed entry to be ignored. The multigroup/matrix view is developed in "}<a href={"https://web.stanford.edu/~lutian/coursepdf/survweek3.pdf"}>{"Tian and Olshen's lecture"}</a>{"."}</Prose>

<H3>{"Implement the risk-set calculation without repeated scans"}</H3>

<Prose>{"Sort endpoints once, merge their groups, and update current membership after each batch."}</Prose>

<Prose>{"Save the following complete module as "}<strong>{"survival_group_comparison.py"}</strong>{", beside the complete "}<strong>{"survival_estimators.py"}</strong>{" module taught in section 4. This is a real dependency: prepare_groups already validates endpoints, sorts them once and distinguishes tied events/censors. We reuse that implementation rather than hiding a second data-cleaning or tie convention in this section."}</Prose>

<Prose>{"The LogrankStep fields retain the actual time, both risk counts, both failure counts, expected group 1 count, variance, pooled survival before the event and weighted contributions. They let a learner trace the calculation or draw the same intermediates. LogrankResult separates an available asymptotic test from a zero-information state. No work, fit or print happens on import."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_group_comparison.py"} filename={"survival_group_comparison.py"} language={"python"} title={"survival_group_comparison.py"} />

<Prose>{"Follow the event loop in order. The two already sorted streams are merged; all endpoints with the same time are collected before a roster changes. The counts risk1/risk0 therefore still include a subject censored at this exact time. At a failure batch, the code calculates the conditional expectation and the factored variance, applies the already taught weight, and stores the complete step. Only then does it remove failures and censors from both groups. Pure censoring times still update membership even though they contribute no score."}</Prose>

<Prose>{"The two fsum calls accurately accumulate the retained contribution lists. The normal-tail identity P(χ²₁≥Q)=erfc(sqrt(Q/2)) supplies the asymptotic p-value with a standard-library complementary error function; it avoids computing 1−CDF, which can lose tiny tails to subtraction. erfc is simply the normal upper-tail integral in this coordinate, not a different survival model."}</Prose>

<Prose>{"With n endpoint rows and g distinct endpoint times, sorting costs O(n log n), merging costs O(n), and retained groups/steps cost O(n) storage. The loop does not re-scan every subject at every failure time. This is an efficient complete implementation for two unweighted independent-subject cohorts starting at zero, with explicit integer event flags and finite durations. Case weights, left truncation, intervals, clustered subjects and time-changing records need different membership or covariance machinery; section 14 teaches entry/history. The validator is separate from the mechanism. There is no arbitrary claim that this implementation replaces every production survival package."}</Prose>

<Prose>{"For an ordinary matched comparison, save the next complete main as "}<strong>{"logrank-group-comparison.py"}</strong>{" in the same directory. Install lifelines 0.30.3 with its ordinary dependency environment, then run:"}</Prose>

<Prose>{"~~~sh python -m pip install lifelines==0.30.3 python logrank-group-comparison.py ~~~"}</Prose>

<Prose>{"The ordinary logrank_test arguments place the two duration lists first and the matching event lists next. Its keyword is weightings, while this scratch module calls its parameter weighting. Fleming–Harrington additionally requires p and q. That naming difference must not become an unintended different test. The same exact finite fixtures go through both routes, so differences can be attributed to implementation conventions rather than different observations."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/logrank-group-comparison.py"} filename={"logrank-group-comparison.py"} language={"python"} title={"logrank-group-comparison.py"} />

<Prose>{"Recorded output (Python3.12.14, lifelines0.30.3 and SciPy1.18.1): the ordinary tool and scratch route compute the same declared tests. Agreement concerns the calculation; the small-cohort approximation is the sampling issue explained above."}</Prose>

<CodeBlock language={"output"}>{"pump event-time contributions: [{\"time\": 2.0, \"risk1\": 4, \"risk0\": 4, \"failures1\": 1, \"failures0\": 0, \"expected1\": 0.5, \"variance1\": 0.25, \"pooled_survival_before\": 1.0, \"weight\": 1.0, \"contribution\": 0.5, \"variance_contribution\": 0.25}, {\"time\": 4.0, \"risk1\": 2, \"risk0\": 4, \"failures1\": 1, \"failures0\": 0, \"expected1\": 0.3333333333333333, \"variance1\": 0.22222222222222224, \"pooled_survival_before\": 0.875, \"weight\": 1.0, \"contribution\": 0.6666666666666667, \"variance_contribution\": 0.22222222222222224}, {\"time\": 6.0, \"risk1\": 0, \"risk0\": 4, \"failures1\": 0, \"failures0\": 1, \"expected1\": 0.0, \"variance1\": 0.0, \"pooled_survival_before\": 0.7291666666666667, \"weight\": 1.0, \"contribution\": 0.0, \"variance_contribution\": 0.0}, {\"time\": 8.0, \"risk1\": 0, \"risk0\": 2, \"failures1\": 0, \"failures0\": 1, \"expected1\": 0.0, \"variance1\": 0.0, \"pooled_survival_before\": 0.546875, \"weight\": 1.0, \"contribution\": 0.0, \"variance_contribution\": 0.0}]\npump comparison: {\"score\": 1.1666666666666667, \"variance\": 0.4722222222222222, \"statistic\": 2.882352941176471, \"asymptotic_p\": 0.08955507441364255, \"status\": \"asymptotic-test\"}\nlifelines pump: {\"statistic\": 2.8823529411764715, \"asymptotic_p\": 0.08955507441364244}\ncrossing logrank: {\"score\": 0.0, \"variance\": 0.8285714285714285, \"statistic\": 0.0, \"asymptotic_p\": 1.0, \"status\": \"asymptotic-test\", \"weights\": [1.0, 1.0], \"library_statistic\": 0.0, \"library_asymptotic_p\": 1.0}\ncrossing wilcoxon: {\"score\": 2.0, \"variance\": 41.82857142857143, \"statistic\": 0.09562841530054646, \"asymptotic_p\": 0.7571401519246744, \"status\": \"asymptotic-test\", \"weights\": [8.0, 6.0], \"library_statistic\": 0.09562841530054648, \"library_asymptotic_p\": 0.7571401519246743}\ncrossing tarone-ware: {\"score\": 0.3789373819630124, \"variance\": 5.828571428571429, \"statistic\": 0.02463614647409004, \"asymptotic_p\": 0.8752771135907096, \"status\": \"asymptotic-test\", \"weights\": [2.8284271247461903, 2.449489742783178], \"library_statistic\": 0.024636146474089987, \"library_asymptotic_p\": 0.8752771135907097}\ncrossing fleming-harrington: {\"score\": -0.25, \"variance\": 0.025, \"statistic\": 2.4999999999999996, \"asymptotic_p\": 0.1138462980066581, \"status\": \"asymptotic-test\", \"weights\": [0.0, 0.25], \"library_statistic\": 2.4999999999999996, \"library_asymptotic_p\": 0.11384629800665765}\nno observed events: {\"score\": 0.0, \"variance\": 0.0, \"statistic\": null, \"asymptotic_p\": null, \"status\": \"no-comparison-information\"}"}</CodeBlock>

<Prose>{"The pump's statistic and upper-tail probability agree to floating-point tolerance. For crossing curves, the ordinary score is exactly zero, while changing the prespecified weights changes both numerator and variance. The no-event scratch output has null statistic/p-value and an explicit no-comparison-information status. It never relabels missing information as proof of equality."}</Prose>

<Prose>{"We can now compare a binary group by adding observed-versus-expected failures within current risk sets. A group label is only one possible predictor. Next, we will let a measured feature change each competitor's relative event weight, derive how an observed failure informs its coefficient, and see why that relative comparison alone does not supply an absolute survival probability."}</Prose>

<H2>{"8. Learn a Cox model from risk-set competition"}</H2>

<Prose>{""}<strong>{"Can we learn which measurements change the failure rate without choosing one rate curve for everyone?"}</strong>{" Let a measurement change each current competitor's relative weight; learn those weights from the identities that actually fail."}</Prose>

<CoxCompetitionFigure />

<Prose>{"Section 7 compared two seal designs by counting how many of their pumps were still available to fail. A seal label is one possible "}<strong>{"feature"}</strong>{": a measurement known before the outcome that may help distinguish subjects. We might instead have measured operating load, temperature or age at commissioning. The next step is to let those measurements change the relative failure rates of the subjects in each current risk set."}</Prose>

<Prose>{"For an inspectable calculation, switch to the following "}<strong>{"constructed six-subject example"}</strong>{", called A–F. These names belong to this new table; they do not refer to the eight pumps A–H from sections 1–7. Here x is a dimensionless load measurement expressed relative to a reference load. Negative x means below that reference, not a negative physical load. All subjects begin observation at day 0."}</Prose>

<NeuralTable caption={"8. Learn a Cox model from risk-set competition"} headers={[<>{"Subject in this new example"}</>,<>{"Observed endpoint, days"}</>,<>{"Endpoint meaning"}</>,<>{"Load feature x"}</>]} rows={[[<>{"A"}</>,<>{"1"}</>,<>{"Failure"}</>,<>{"−1"}</>],[<>{"B"}</>,<>{"2"}</>,<>{"Failure"}</>,<>{"0"}</>],[<>{"C"}</>,<>{"2"}</>,<>{"Failure"}</>,<>{"1"}</>],[<>{"D"}</>,<>{"3"}</>,<>{"Censored"}</>,<>{"−1"}</>],[<>{"E"}</>,<>{"4"}</>,<>{"Failure"}</>,<>{"0"}</>],[<>{"F"}</>,<>{"5"}</>,<>{"Censored"}</>,<>{"1"}</>]]} />

<Prose>{"Follow one row of the picture from left to right. A's measured x=−1 is multiplied by a shared adjustable "}<strong>{"coefficient"}</strong>{" β. That produces a dimensionless number η=βx, called the "}<strong>{"linear score"}</strong>{". Next, exponentiating the score produces a positive "}<strong>{"relative weight"}</strong>{" w=exp(η). The arrow labelled “multiply by β” and the arrow labelled “exponentiate” perform different operations. A score can be negative; its positive weight cannot. The same coefficient is used for every subject, so changing it is one proposed relationship between load and failure, rather than six separately chosen weights."}</Prose>

<Prose>{"Initially β=log(2), the number whose exponential is 2. The three feature values −1,0,1 therefore receive weights 1/2,1,2. A and D receive 1/2 each; B and E receive 1 each; C and F receive 2 each. A load increase of one feature unit multiplies the proposed rate by 2. Setting β to 0 gives every subject weight 1, because exp(0)=1. Making β negative reverses the load ordering. The control changes β, not the observed failure times. Its live sentence names the rate multiplier exp(β), A's current share and the unchanged six identities."}</Prose>

<Prose>{"Why call these relative weights rather than probabilities? Immediately before day 1, all six subjects remain observed and at risk. Their weights sum to 7. Given that one of these subjects fails at that instant, A's proposed share of that failure opportunity is its weight divided by the total: (1/2)/7=1/14. C's share is 2/7. The six shares sum to 1. A weight of 2 is perfectly legal; a probability of 2 is not. Also,1/14 describes "}<strong>{"which current subject fails given a failure"}</strong>{", not the probability that A will fail before day 1."}</Prose>

<H3>{"Where did the common time-dependent rate go?"}</H3>

<Prose>{"The relative weights cancel a shared rate when we compare identities at the same instant."}</Prose>

<Prose>{"Imagine a sufficiently small interval beginning just before an untied event. Give every current subject a common reference failure rate h0(t), measured per day. Let subject i's rate be this reference rate multiplied by its weight wi. Its small-interval failure probability is approximately h0(t)wi times the interval width. Conditional on one failure among the current competitors, divide that subject's probability by the sum over those competitors. The common reference rate and interval width cancel. Taking the continuous-time limit gives the normalized weights above. We are not setting a positive point probability for a continuous failure time; section 6's density-versus-mass distinction still applies."}</Prose>

<Prose>{"Name the set of current observed competitors R(t), the "}<strong>{"risk set"}</strong>{" introduced in section 3. Write h(t|x) for the failure rate at time t among subjects with feature value x who have survived to t. The model is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\eta_i=\\beta x_i,\\quad w_i=e^{\\eta_i},\\qquad\nh(t\\mid x_i)=h_0(t)e^{\\beta x_i},\\qquad\n\\pi_i(t;\\beta)=\\frac{e^{\\beta x_i}}{\\sum_{j\\in R(t)}e^{\\beta x_j}}."}</MathBlock></div>

<Prose>{"Here i identifies the subject whose share we want; j visits each current competitor in the denominator. The weight and share are dimensionless; h0 and h have rate units. The model is called "}<strong>{"Cox proportional hazards"}</strong>{": at the same time, the ratio of two subjects' hazards is exp(β(xi−xj)), which does not change with t while their features and coefficient stay fixed. The common baseline h0(t) may vary with time. This flexibility is why learning relative coefficients need not start by assuming the exponential rate curve from section 6. "}<a href={"https://sachsmc.github.io/surv-theory-course/Cox-1972.pdf"}>{"Cox's original paper"}</a>{" develops this separation of relative regression effects from the unspecified baseline."}</Prose>

<Prose>{"There is no separately identifiable intercept here. Adding the same number c to all scores multiplies every weight by exp(c), which cancels in every share. In the hazard model that multiplier can be absorbed into h0. A constant feature column consequently supplies no coefficient information to these conditional comparisons. Centering a feature by subtracting a reference value similarly changes the baseline reference, while preserving pairwise score differences. We will restore a declared reference baseline and absolute survival in section 9."}</Prose>

<Prose>{"This interpretation depends on the observation model: independent first-event subjects, a common proportional-hazards relationship and censoring that is noninformative conditional on the features used. A missing prognostic variable that also determines logging removal can invalidate the comparison. Coefficients describe modelled associations conditional on the included features; they do not automatically describe an intervention on load. Delayed entry, changing features and repeated events need the additional risk-set contracts in section 14."}</Prose>

<H3>{"What tells the coefficient which way to move?"}</H3>

<Prose>{"Compare the feature of the subject that failed with the weighted feature of its competitors."}</Prose>

<CoxFeatureBalanceFigure />

<Prose>{"At day 1, the picture puts the six shares at their feature positions −1,0,1. The total shares at those positions are 1/7,2/7,4/7 respectively. Their weighted average feature is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mu=\\frac{(-1)(1)+(0)(2)+(1)(4)}7=\\frac37."}</MathBlock></div>

<Prose>{"The numerator's 1,2,4 are the "}<strong>{"total weights at each feature position"}</strong>{", not three new subjects: two subjects contribute at each position. The weighted balance point lies at 3/7. The actual failing subject A lies at −1, far to its left. The proposed positive coefficient has favoured high-load subjects, yet this event occurred at low load. This event therefore pushes β downward. The signed "}<strong>{"observed-minus-weighted feature difference"}</strong>{" is −1−3/7=−10/7. If a high-load subject had failed in the same risk set, the signed difference would have been1−3/7=4/7. Changing the observed identity in that sentence is a hypothetical explanation; the lab does not rewrite A's actual outcome."}</Prose>

<Prose>{"To see why this is the exact direction signal, take the logarithm of A's proposed share. For a single untied failing subject i, its contribution is βxi−log(Σj exp(βxj)). Differentiate with respect to β: the first term gives xi; the second gives the weighted mean μ. Their difference is the derivative of the log contribution, often called its "}<strong>{"score"}</strong>{". This derivative measures how much that log contribution changes for a small coefficient change; it is not the subject's linear score η. The same word is used for two quantities, so we will call them “linear score” and “likelihood score” explicitly."}</Prose>

<Prose>{"For untied failing identities i, the product of their local shares is the "}<strong>{"partial likelihood"}</strong>{" Lp. Its log ℓp turns that product into a sum:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\ell_p(\\beta)=\\sum_{i:\\delta_i=1}\n \\left[\\beta x_i-\\log\\sum_{j\\in R(Y_i)}e^{\\beta x_j}\\right],\n\\qquad\nU(\\beta)=\\frac{d\\ell_p}{d\\beta}\n =\\sum_{i:\\delta_i=1}\\left[x_i-\\mu_i(\\beta)\\right],\n\\quad\n\\mu_i=\\sum_{j\\in R(Y_i)}\\pi_j(Y_i;\\beta)x_j."}</MathBlock></div>

<Prose>{"δi and Yi retain section 1's event indicator and observed endpoint meanings. Only observed failures contribute numerator terms, but censored subjects participate in all denominators while they remain observed and at risk. The risk sets change after endpoints. This is a sequence of conditional event-identity comparisons, not a claim that all event-time comparisons are independent draws or that this product is a joint lifetime density. The nuisance baseline and observation assumptions are what justify partial likelihood inference. "}<a href={"https://web.stanford.edu/~lutian/coursepdf/unit7.pdf"}>{"Lu Tian's Cox notes"}</a>{" give the more formal construction after this local calculation."}</Prose>

<Prose>{""}<strong>{"Deeper: why does spread determine information?"}</strong>{" The three feature positions also have a weighted spread around μ=3/7. Their weighted squared distance is 5/7−(3/7)²=26/49: the weighted average of x² is (1+4)/7=5/7, and subtracting the squared mean gives the spread. To see the derivative directly, differentiating a normalized weight gives dπj/dβ=πj(xj−μ). Each share increases when its feature lies above the current weighted mean and decreases when it lies below. Thus dμ/dβ=Σj xj πj(xj−μ)=Σj πj xj²−μ², exactly this variance. For a vector feature, the same differentiation gives the weighted covariance entry by entry. Therefore the second derivative of A's log contribution is −26/49: the log contribution bends downward. Define the positive "}<strong>{"observed information"}</strong>{" I(β)=−d²ℓp/dβ². For untied events,"}</Prose>

<div className="neural-equation"><MathBlock>{"I(\\beta)=\\sum_{i:\\delta_i=1}\n \\sum_{j\\in R(Y_i)}\\pi_j(Y_i;\\beta)(x_j-\\mu_i)^2."}</MathBlock></div>

<Prose>{"If every current competitor has the same feature, its weighted spread is 0. Changing β then changes every weight by the same factor, which cancels. There is no information about that coefficient even if many failures occur. With several features, x is a vector of p measured values and β is a vector of p coefficients. The dot product βᵀx replaces βx. The weighted covariance matrix replaces variance: its entry(a,b) is the weighted average of (xa−μa)(xb−μb). Summing those covariance matrices gives information. A direction in feature space with no within-risk-set variation is an unidentified coefficient direction. This is why duplicating one feature as twice another can make a dense coefficient solve singular."}</Prose>

<Prose>{"At β=0, all risk shares are equal. For a binary group feature, the likelihood score at an untied event is “observed group 1 failure minus its current group share”, exactly section 7's one-failure log-rank contribution. With tied batches, the chosen Cox denominator and the finite hypergeometric variance need separate care; do not equate every software tie approximation's information with section 7's without-replacement variance. Section 9 will distinguish those constructions."}</Prose>

<H3>{"How do we take a useful parameter step?"}</H3>

<Prose>{"Use the local direction and curvature to propose a change, then check its actual objective."}</Prose>

<NewtonBacktrackingFigure />

<Prose>{"Before discussing a solver, eliminate a distraction deliberately. In this "}<strong>{"new numerical witness only"}</strong>{", change C's day 2 endpoint to day 2.5. Every other row and feature stays as listed above. This makes the four observed failures untied, so the untied equations just taught apply to the entire objective. The original day 2 tie remains unchanged in the original table and will be studied in section 9. To make overshooting visible, start the trial at β=3, rather than the lab's initial log(2). These are declared numerical choices, not an estimated new physical dataset."}</Prose>

<Prose>{"We minimize F(β)=−ℓp(β). Its derivative is −U and its curvature is I. Approximate the derivative near the current coefficient by a straight line. The point where this approximation reaches zero solves IΔ=U. Δ is the "}<strong>{"Newton direction"}</strong>{"; the proposed coefficient is β+Δ. With several features solve the corresponding linear system. Do not form a matrix inverse merely to multiply it by U."}</Prose>

<Prose>{"At β=3 for the new untied witness, the actual values are U≈−3.824145, I≈0.177200 and F≈14.254539. The uncapped direction is Δ≈−21.580978. Curvature is local; carrying that steep proposal all the way to β≈−18.580978 makes F≈56.436081, which is worse. The picture shows the full trial rejected. Half the direction gives β≈−7.790489 and F≈24.066683, also worse. A quarter gives β≈−2.395244 and F≈8.344697, so it is accepted. The arrows carry "}<strong>{"coefficient changes"}</strong>{", not extra observations. The current risk-set data stay fixed throughout these trials."}</Prose>

<Prose>{"This is "}<strong>{"backtracking"}</strong>{": try a positive step fraction s, then halve it until the actual objective has decreased enough along the proposed direction. If g=−U is the derivative of F, then gΔ must be negative for a descent direction. Our sufficient-decrease rule is"}</Prose>

<div className="neural-equation"><MathBlock>{"F(\\beta+s\\Delta)\\le F(\\beta)+10^{-4}s\\,g^T\\Delta."}</MathBlock></div>

<Prose>{"The transpose and dot product are only needed for multiple features; in one dimension this is ordinary multiplication. The small positive constant 10⁻⁴ demands some actual progress, without demanding the local quadratic approximation's full predicted improvement. Reject nonfinite trial evaluations and impose a finite trial budget. Failure to find an accepted trial is a named solver outcome, not a successful fit with an unchanged coefficient."}</Prose>

<Prose>{"Our ordinary safeguarded implementation additionally caps the largest absolute direction component at 2 before backtracking. This cap is a configurable numerical safeguard in feature-coordinate units, not a statistical law. On this witness the default capped fitter accepts its trials without further halving. The picture's uncapped demonstration is separate and explicitly labelled. Both use the same objective, but they need not have identical trajectories. The final fitted candidate is β≈−0.4325741954, matching the ordinary library coefficient on this tiny witness."}</Prose>

<Prose>{""}<strong>{"When can a solver mislead us?"}</strong>{" A small derivative does not alone prove that an unpenalized finite maximum exists. If a feature ordering perfectly favours the observed event ordering, increasing a coefficient can continue improving the partial likelihood toward a limiting value without a finite maximizer. This is a form of "}<strong>{"separation"}</strong>{". A flat or nearly singular information matrix, steadily growing coefficients, a failed descent solve or exhausted budgets require explicit outcomes. A configured coefficient limit is a diagnostic boundary, not proof that separation occurred. A returned "}<code>{"unpenalized_stationary_candidate"}</code>{" means the local score and curvature criteria were met at the reported point; it is not a mathematical certificate of existence or a valid uncertainty calculation."}</Prose>

<Prose>{"A ridge penalty can stabilize weak directions by minimizing Fλ=−ℓp+λ‖β‖²/2, with λ≥0. Here the squared norm sums the squared coefficients. Its derivative is −U+λβ and curvature is I+λIp, where Ip is the p×p identity matrix. The code uses the "}<strong>{"sum"}</strong>{" log likelihood and this explicit penalty normalization. Feature scaling changes the meaning of this penalty and of numerical step limits. Library defaults, average objectives and feature-standardized penalties are not automatically equivalent. Choose transformations and penalty settings using training/validation, then carry the same schema to prediction. Inference for a penalized estimate is not obtained by silently applying an unpenalized covariance formula."}</Prose>

<H3>{"How can the same calculation avoid repeatedly scanning every row?"}</H3>

<Prose>{""}<strong>{"Deeper implementation:"}</strong>{" trace the stable suffix and moment merge when you want to extend the Cox solver. On a first pass, follow the program's inputs and returned terms in the next subsection, then continue to section 9's tied-failure pictures."}</Prose>

<Prose>{"Visit observation endpoints backward, growing one current risk-set pool instead of rebuilding it."}</Prose>

<SuffixMomentsFigure />

<Prose>{"In chronological order, risk sets shrink. For a static table we can instead sort observed endpoints from latest to earliest. Start with F at day 5, then add E at day 4. That pool is exactly the set observed through day 4. Next add censored D at day 3; no event numerator is evaluated there. At day 2 add B and C together. The earlier D/E/F rows in this backward walk are actually "}<strong>{"later-ending subjects"}</strong>{", still at risk at day 2. Finally add A at day 1. Every row is added once. “Later-time pool” always means subjects whose endpoints are later, not subjects who have not yet entered a forward simulation. Subjects all start at zero in this algorithm."}</Prose>

<Prose>{"Before processing failures at a given time, include every censor at that same time, just as in section 3. Keep two positive pools: N contains the later-ending subjects plus current censors; E contains current deaths. A pool with no members is empty and contributes nothing. The merge formula below describes two nonempty positive pools; merging an empty pool just returns the other state. The complete risk set is their merge N+E. For an untied event, E has one row. The function also supports two conventional tied-event denominator rules, which we name here so every code branch has a meaning. "}<strong>{"Breslow"}</strong>{" uses the complete pool once for each of the d current failures. "}<strong>{"Efron"}</strong>{" uses N+(1−l/d)E for substep l=0,…,d−1, reducing the current death pool's weight by an equal fraction between comparisons. This is an approximation for a tied batch, not a fractional physical death. Section 9 will draw its actual denominators against the exact discrete alternative. Neither rule removes same-time censored rows before the event comparison."}</Prose>

<Prose>{"We need more than a weight sum: each pool needs its weighted feature mean and covariance. Storing raw Σwxxᵀ and subtracting μμᵀ can erase small within-pool variation when feature coordinates are large. Instead retain a "}<strong>{"centered covariance"}</strong>{" directly. Suppose two positive pools have masses a,b, means μa,μb and covariances Ca,Cb, expressed at the same exponential scale. Let f=a/(a+b), q=b/(a+b), and v=μb−μa. Their merged state is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mu=\\mu_a+qv,\\qquad\nC=fC_a+qC_b+fq\\,vv^T."}</MathBlock></div>

<Prose>{"The first two terms retain each pool's internal spread. The last is the between-pool spread caused by different mean positions. This is the weighted variance decomposition, not a clipped correction to a negative answer. Within each pool, write a point’s displacement from the merged mean as its displacement from its own mean plus its pool-mean displacement. Expanding the outer product makes the cross terms vanish because the within-pool weighted displacement sums to zero. The remaining terms are the two internal covariances and the between-mean term shown above. For a single row, mean is its feature vector and covariance is zero. Repeated positive merges produce the current risk distribution. For Efron, multiply E's mass by 1−l/d; its own normalized mean and covariance stay the same. Merge that positive pool with N. Avoid subtracting almost equal total and death second moments."}</Prose>

<Prose>{"The weights require a second safeguard. A raw exp(1000) cannot be represented as an ordinary floating-point number. Store a pool's largest linear score m and "}<strong>{"scaled mass"}</strong>{" Σexp(η−m). For two pools, choose their larger m and multiply each old mass by exp(old_m−new_m) before merging. The scaled weights never need positive-exponent exponentials. At a late event, an earlier-ended high-score subject is absent, so it must not set that late risk set's scale. The backward-growing pools choose scales from their actual members. A single global maximum over every subject can underflow all members of a later, low-score risk set."}</Prose>

<Prose>{"The log denominator is m+log(scaled mass). Pair event numerator scores with the same local m so the common shift cancels before adding log contributions. The preparation step also subtracts one common feature origin internally; the preserved origin lets diagnostic means map back to original coordinates. The coefficient still refers to the supplied feature units. These safeguards reduce avoidable overflow and cancellation; they do not provide arbitrary precision. Reject feature differences, linear scores or covariance operations that exceed the numeric range rather than manufacture a finite answer."}</Prose>

<Prose>{"With n subjects, p features and e observed failures, preparing the table costs O(n log n+np). Dense moment updates and event contributions cost O(np²+ep²) per objective evaluation. A dense Newton solve costs O(p³). The ordinary core retains O(np+p²) state: the sorted data and working moments, not n stored p×p matrices. An optional explanatory trace deliberately retains per-event covariance matrices and additionally costs O(ep²) space. Disable it when fitting. Backtracking entails additional evaluations; these costs do not imply a universal speed advantage over specialized sparse, GPU or very-high-dimensional implementations."}</Prose>

<H3>{"Build and inspect the complete implementation"}</H3>

<Prose>{"The code separates prepared observations, risk-set terms and parameter fitting."}</Prose>

<Prose>{"Save the first module as "}<code>{"cox_risk_moments.py"}</code>{". "}<code>{"prepare_cox"}</code>{" validates and copies a finite n×p feature array and one Boolean event and nonnegative endpoint per subject, then makes the sorted arrays read-only. "}<code>{"cox_terms"}</code>{" returns the sum log partial likelihood, likelihood score, positive information and optional trace. It does not fit a hidden model or produce absolute survival. The declared static observation contract is part of the API."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox_risk_moments.py"} filename={"cox_risk_moments.py"} language={"python"} title={"cox_risk_moments.py"} />

<Prose>{"Follow "}<code>{"merge_moments"}</code>{" alongside D27: align log scales, compute positive mass fractions, move the mean and add within/between covariance terms. Then follow "}<code>{"cox_terms"}</code>{": prepare the current nondeath and death pools, merge them before any event calculation, and evaluate each declared tie substep. "}<code>{"trace=False"}</code>{" avoids keeping all diagnostic matrices. Constant columns contribute exactly zero variation; the terms routine leaves that result intact for the fitter to diagnose."}</Prose>

<Prose>{"Save the second module as "}<code>{"cox_regression.py"}</code>{" beside the first. "}<code>{"fit_cox"}</code>{" solves the information system, limits its direction, backtracks on the actual penalized objective and records accepted fractions and rejected-trial counts. It checks curvature before accepting a stationary point. Its infinity norm is the largest absolute component, so its score tolerance and direction limit have explicit meanings. The result distinguishes no-event information, insufficient curvature, coefficient growth, solve/direction failure, line-search exhaustion, iteration exhaustion and a stationary candidate. There is no implicit fitted intercept and no prediction-baseline shortcut."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox_regression.py"} filename={"cox_regression.py"} language={"python"} title={"cox_regression.py"} />

<Prose>{"Save "}<code>{"cox-risk-set-example.py"}</code>{" in the same directory. Its first calculation uses the original A–F table's first event; its fitted calculation explicitly changes only C's endpoint to 2.5. The ordinary route constructs the event/time response with "}<code>{"Surv.from_arrays"}</code>{", then fits "}<code>{"CoxPHSurvivalAnalysis"}</code>{" with an explicit coefficient tie method and tolerance. We use no penalty in this comparison. The public API's "}<code>{"predict"}</code>{" returns linear risk scores, not event times or probabilities; absolute predictions require the baseline methods introduced next. "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.linear_model.CoxPHSurvivalAnalysis.html"}>{"The scikit-survival API"}</a>{" documents these distinct outputs and its solver stopping rule."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-risk-set-example.py"} filename={"cox-risk-set-example.py"} language={"python"} title={"cox-risk-set-example.py"} />

<CodeBlock language={"output"}>{"{\"original_first_event\": {\"coefficient\": 0.6931471805599453, \"information\": 0.5306122448979591, \"probability_A\": 0.07142857142857142, \"score\": -1.4285714285714284, \"total_weight\": 7.0, \"weighted_feature_mean\": 0.4285714285714284, \"weights\": [0.5, 1.0, 2.0, 0.5, 1.0, 2.0]}}\n{\"new_untied_witness\": {\"negative_log_likelihood\": 5.2751259678246605, \"ordinary_beta\": [-0.43257419544250736], \"score_norm\": 3.3306690738754696e-16, \"scratch_beta\": [-0.43257419544250714], \"status\": \"unpenalized_stationary_candidate\", \"time\": [1.0, 2.0, 2.5, 3.0, 4.0, 5.0], \"trace\": [{\"accepted_fraction\": 1.0, \"beta\": [3.0], \"direction\": [-2.0], \"iteration\": 0, \"objective\": 14.254539190122562, \"rejected_trials\": 0, \"score_norm\": 3.8241451601370686}, {\"accepted_fraction\": 1.0, \"beta\": [1.0], \"direction\": [-2.0], \"iteration\": 1, \"objective\": 7.3862838275910665, \"rejected_trials\": 0, \"score_norm\": 2.700638336708373}, {\"accepted_fraction\": 1.0, \"beta\": [-1.0], \"direction\": [0.6559800560984731], \"iteration\": 2, \"objective\": 5.604183290383785, \"rejected_trials\": 0, \"score_norm\": 1.114871744492811}, {\"accepted_fraction\": 1.0, \"beta\": [-0.3440199439015269], \"direction\": [-0.08800791655518132], \"iteration\": 3, \"objective\": 5.2836644995695465, \"rejected_trials\": 0, \"score_norm\": 0.19328005957631478}, {\"accepted_fraction\": 1.0, \"beta\": [-0.4320278604567082], \"direction\": [-0.0005463062250253002], \"iteration\": 4, \"objective\": 5.275126291176233, \"rejected_trials\": 0, \"score_norm\": 0.001183732536318871}, {\"accepted_fraction\": 1.0, \"beta\": [-0.4325741666817335], \"direction\": [-2.876077362528852e-08], \"iteration\": 5, \"objective\": 5.275125967824661, \"rejected_trials\": 0, \"score_norm\": 6.231208105056396e-08}]}}"}</CodeBlock>

<Prose>{"Read the output in those two parts. The original first event reports share 1/14, mean 3/7, likelihood score −10/7 and information 26/49. The separate untied witness reports both coefficients near −0.4325741954. Its trace starts at 3, accepts capped direction −2, then continues to the stationary candidate. Agreement on a tiny fixture checks this declared computation; it does not validate the proportional-hazards assumption or establish finite-MLE existence for every input."}</Prose>

<Prose>{"The uncapped D26 trial is a separate complete script, "}<code>{"cox-newton-backtracking-example.py"}</code>{", which calls the same risk terms and records each objective trial without fitting another model. Keep it beside the two modules. It starts at 3 and stops when the first acceptable fraction is found, so the meaning of the pictured rejection and acceptance is visible in code as well as on the coefficient ruler."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-newton-backtracking-example.py"} filename={"cox-newton-backtracking-example.py"} language={"python"} title={"cox-newton-backtracking-example.py"} />

<CodeBlock language={"output"}>{"{\"information\": 0.17719980857090112, \"initial_beta\": 3.0, \"initial_objective\": 14.254539190122562, \"score\": -3.8241451601370686, \"trials\": [{\"accepted\": false, \"allowed_objective\": 14.24628631088768, \"candidate_beta\": -18.580977942236057, \"candidate_objective\": 56.43608104986264, \"fraction\": 1.0}, {\"accepted\": false, \"allowed_objective\": 14.250412750505122, \"candidate_beta\": -7.7904889711180285, \"candidate_objective\": 24.066682603195037, \"fraction\": 0.5}, {\"accepted\": true, \"allowed_objective\": 14.252475970313842, \"candidate_beta\": -2.3952444855590143, \"candidate_objective\": 8.344696790620716, \"fraction\": 0.25}], \"uncapped_direction\": -21.580977942236057}"}</CodeBlock>

<H3>{"Compare the smaller rescan route"}</H3>

<Prose>{"The same likelihood can be computed by rebuilding each risk set; its costs and numerical scope are different."}</Prose>

<Prose>{"The earlier complete scalar example below is a "}<strong>{"different simulation of 200 subjects"}</strong>{", not the constructed six-row calculation. It uses the original NumPy "}<code>{"RandomState(42)"}</code>{" stream to generate a binary feature, failure times and independent follow-up endpoints, then compares a small scalar rescan solver with the ordinary library. The printed coefficient −0.860871 belongs to those simulated observations. Preserve that distinction when reading the two results: there is no reason these separate datasets should have the same fitted coefficient."}</Prose>

<Prose>{"Complete source — "}<code>{"scalar-cox-hand-fit.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/scalar-cox-hand-fit.py"} filename={"scalar-cox-hand-fit.py"} language={"python"} title={"scalar-cox-hand-fit.py"} />

<CodeBlock language={"output"}>{"beta / HR: -0.860871 0.422794\niterations / status: 4 score tolerance reached\nlog likelihood / score / information: [-524.38770086, -0.0, 25.08133407]\nlibrary beta: -0.860871\nconstant-feature information: 0.0\nA finite score tolerance alone does not rule out separation; inspect information and coefficient growth."}</CodeBlock>

<Prose>{"Its risk masks make the formula easy to inspect for 200 rows, but rebuilding them for every event time can require O(ne) work in one scalar evaluation. Raw second-moment subtraction is less robust than the centered merge. Moreover, the local shift is chosen from current risk members, but the exponential array is formed for all subjects before masking: an extreme out-of-risk score can overflow that unnecessary computation. The grouped module avoids these rescans and uses positive centered moments and local pools. Choose that implementation when extending the calculation to larger cohorts or more extreme scores."}</Prose>

<H3>{"Check the mechanism before relying on the fit"}</H3>

<Prose>{"The equations predict useful invariants and failure cases that a library match alone would miss."}</Prose>

<Prose>{"For a tiny untied or tied table, explicitly enumerate current competitors and form their normalized distributions. Compare log likelihood, score and information at a "}<strong>{"fixed coefficient"}</strong>{", before comparing fitted coefficients. Perturb one coefficient slightly: the log-likelihood difference estimates its score, and the score difference estimates minus its information column. Reverse row order within a tie, translate all feature coordinates by the same constant, and include a censor at the exact failure time. The unpenalized terms should respect those changes and the declared risk set. Check a late low-score risk set after an early huge-score subject has left; that is the case a global shift can conceal."}</Prose>

<Prose>{"Also test all-censored data, a constant feature, collinear features and a separating event order. A clear diagnostic result is more useful than an apparently precise coefficient unsupported by variation or a finite solution. Independent practice at the end of the lesson will change these fixtures and ask you to explain which part of the calculation must change."}</Prose>

<Prose>{"We can now learn relative coefficients from current competitors. The original table still has B and C failing together at day 2. What does a “next failing identity” mean when observation gives us a simultaneous batch? And how do relative weights become an absolute still-running probability for a profile? Section 9 takes those two remaining steps."}</Prose>

<span id="9-handle-ties-and-recover-absolute-survival" aria-hidden="true" />
<H2>{"9. Handle tied failures, then recover an absolute survival curve"}</H2>

<Prose>{"Section 8 learned relative coefficients by asking who fails among the subjects still competing. Our original A–F table has a detail that the one-failure calculation cannot resolve: B and C both have the recorded time"}</Prose>

<ol start={2}><li>{"We know the pair, but not an order within that timestamp. First decide"}</li></ol>

<Prose>{"what that observation means. Then, in a separate step, turn the relative weights into a still-running probability at a stated time."}</Prose>

<H3>{"What changes when two failures share a timestamp?"}</H3>

<Prose>{"The same five competitors can lead to three different denominator constructions."}</Prose>

<TiedDenominatorsFigure />

<Prose>{"Read the top roster first. A has already failed at day 1 and is absent. B, C, D, E and F are still competing immediately before day 2. D is included even though its later record is censored at day 3. At the supplied coefficient β=log 2, their relative weights are 1, 2, 0.5, 1 and 2. The total is 6.5. The two filled failure markers belong to B and C, whose weights sum to 3 and whose product is 2. A weight measures relative competition; it is not a failure probability by itself."}</Prose>

<Prose>{"The first lane, "}<strong>{"Breslow"}</strong>{", reuses the whole 6.5 pool for each of the two failures. Its numerator is the product of the observed weights, 2, and its denominator is 6.5×6.5. This is easy to compute, but it does not reduce the denominator after an unobserved first failure within the batch."}</Prose>

<Prose>{"The second lane, "}<strong>{"Efron"}</strong>{", starts with that same pool. For the second factor it removes half the combined failure weight: 3/2=1.5. That leaves"}</Prose>

<ol start={5}><li>{"It treats the unknown ordering through a fractional depletion, rather"}</li></ol>

<Prose>{"than claiming to know whether B or C failed first. Section 8's positive nondeath/death-pool merge implements precisely this construction."}</Prose>

<Prose>{"The third lane asks a different question: "}<strong>{"which unordered pair is the failing pair, conditional on exactly two failures?"}</strong>{" Its ten branches are the ten two-member subsets of five competitors. Each branch receives the product of its two weights. The observed branch is BC, with weight 2; the sum across all branches is 16. Its normalized probability is 2/16."}</Prose>

<NeuralTable caption={"What changes when two failures share a timestamp?"} headers={[<>{"Possible pair"}</>,<>{"Product weight"}</>,<>{"Sum of the pair's feature values"}</>]} rows={[[<>{"BC"}</>,<>{"2"}</>,<>{"1"}</>],[<>{"BD"}</>,<>{"0.5"}</>,<>{"−1"}</>],[<>{"BE"}</>,<>{"1"}</>,<>{"0"}</>],[<>{"BF"}</>,<>{"2"}</>,<>{"1"}</>],[<>{"CD"}</>,<>{"1"}</>,<>{"0"}</>],[<>{"CE"}</>,<>{"2"}</>,<>{"1"}</>],[<>{"CF"}</>,<>{"4"}</>,<>{"2"}</>],[<>{"DE"}</>,<>{"0.5"}</>,<>{"−1"}</>],[<>{"DF"}</>,<>{"1"}</>,<>{"0"}</>],[<>{"EF"}</>,<>{"2"}</>,<>{"1"}</>]]} />

<Prose>{"For the notation below, R is this current risk set, D is the observed failure subset and d is its size. Each wᵢ is exp(βᵀxᵢ). The symbol A in the sum means a candidate subset, not pump A, which has left this risk set. Writing |A|=d means the subset contains exactly d members."}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\nL_{\\text{Breslow},j}\n &=\\frac{\\prod_{i\\in D}w_i}{(\\sum_{i\\in R}w_i)^d}\n =\\frac{2}{6.5^2}=\\frac8{169},\\\\\nL_{\\text{Efron},j}\n &=\\frac{\\prod_{i\\in D}w_i}\n {\\prod_{l=0}^{d-1}\\left(\\sum_{i\\in R}w_i-\\frac ld\\sum_{i\\in D}w_i\\right)}\n =\\frac{2}{6.5\\times5}=\\frac4{65},\\\\\nL_{\\text{discrete},j}\n &=\\frac{\\prod_{i\\in D}w_i}\n {\\sum_{A\\subset R,\\ |A|=d}\\prod_{i\\in A}w_i}\n =\\frac2{16}=\\frac18.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"Here l counts how many of the d tied failures have been fractionally removed. The j subscript identifies one failure-time group. We multiply the groups, or sum their log contributions, for the whole observed table. The continuous approximations are written in the conventional partial-likelihood form: constants such as a possible d! ordering factor are omitted because they do not change coefficient estimation. Their numbers therefore are not interchangeable normalized probabilities of the ten unordered pairs. Choosing a method because 1/8 is larger than 4/65 would compare different constructions and discarded constants."}</Prose>

<H3>{"Does “exact” mean the true answer for rounded continuous times?"}</H3>

<Prose>{"The exact subset calculation is exact for its conditional discrete model."}</Prose>

<Prose>{"If event opportunities really occur at a few discrete times, a model can give member i conditional odds proportional to exp(βᵀxᵢ), with a common time-specific intercept. Conditional on d failures in that group, the common intercept cancels and the failing subset has the product-weight distribution just drawn. This is the conditional logistic interpretation of the software's "}<strong>{"exact partial likelihood"}</strong>{"."}</Prose>

<Prose>{"If underlying lifetimes are continuous but a logger rounds timestamps, the missing information includes within-interval ordering. Conditioning on an unordered subset is not a general integration over all those continuous orders and event times. Efron is a useful tied-time approximation in that setting; Breslow is another approximation. The timestamp resolution and scientific observation model matter more than the reassuring name of an option. R's "}<a href={"https://www.stat.ethz.ch/R-manual/R-devel/library/survival/html/coxph.html"}>{"Cox documentation"}</a>{" explicitly distinguishes its exact conditional likelihood from the different exact marginal likelihood."}</Prose>

<Prose>{"With d=1, all three denominators reduce to the single risk-weight sum. With equal weights and d=2 in five competitors, the discrete model gives 1/10 to each pair. If all current competitors fail, the conditional subset is forced: its probability is 1 and it supplies no information about which member was selected. These are useful checks on the model, not assurances that another event-count or event-time model is identified."}</Prose>

<Prose>{"Do not invent ordering by adding tiny random offsets to recorded times. That changes the data and the competing sets, while concealing the assumption. Numerical roundoff can also make nearly equal machine times different; a documented time-resolution policy should precede fitting."}</Prose>

<H3>{"How can we sum pairs without listing every pair?"}</H3>

<Prose>{""}<strong>{"Deeper implementation:"}</strong>{" the following recurrence and its derivative state explain efficient exact subset sums. The three denominator meanings above are the first-pass essentials; you can rejoin at “Relative risk is not yet a still-running probability. What is missing?” to build the absolute curve."}</Prose>

<Prose>{"Keep a short row of coefficients, updating it from right to left as each member arrives."}</Prose>

<SubsetRecurrenceFigure />

<Prose>{"The row has three cells: the weight of choosing zero members, one member or two members. Choosing zero has weight 1: there is one empty selection, and the product over no weights is 1. Before any member arrives the row is [1,0,0]. After B, whose weight is 1, it is [1,1,0]."}</Prose>

<Prose>{"Now C arrives with weight 2. Read the rightmost cell first. Existing two-member choices contribute 0; choosing C together with an old one-member choice contributes 2×1=2. Next update the one-member cell: keep the old 1, then add 2×1 for C alone. The row becomes [1,3,2]. The old one-member cell must still mean "}<strong>{"before C"}</strong>{" while we update the two-member cell. Otherwise C can accidentally be selected twice."}</Prose>

<NeuralTable caption={"How can we sum pairs without listing every pair?"} headers={[<>{"Incoming member"}</>,<>{"Weight"}</>,<>{"Zero-member cell"}</>,<>{"One-member cell"}</>,<>{"Two-member cell"}</>]} rows={[[<>{"none"}</>,<>{"—"}</>,<>{"1"}</>,<>{"0"}</>,<>{"0"}</>],[<>{"B"}</>,<>{"1"}</>,<>{"1"}</>,<>{"1"}</>,<>{"0"}</>],[<>{"C"}</>,<>{"2"}</>,<>{"1"}</>,<>{"3"}</>,<>{"2"}</>],[<>{"D"}</>,<>{"0.5"}</>,<>{"1"}</>,<>{"3.5"}</>,<>{"3.5"}</>],[<>{"E"}</>,<>{"1"}</>,<>{"1"}</>,<>{"4.5"}</>,<>{"7"}</>],[<>{"F"}</>,<>{"2"}</>,<>{"1"}</>,<>{"6.5"}</>,<>{"16"}</>]]} />

<Prose>{"The final two-member cell is the required denominator 16. In the live trace, Next and Back move through these actual rows; Reset returns to the empty-selection row. The member roster, arrows and coefficient values change together. No new model parameter is being fitted."}</Prose>

<Prose>{"Call the cell for k members cₖ. If w is the incoming member's weight, each k-member subset either excludes that member or includes it. The included case chooses k−1 old members and multiplies their product by w. These two disjoint cases account for every permitted subset once:"}</Prose>

<div className="neural-equation"><MathBlock>{"c_k^{\\rm new}=c_k^{\\rm old}+w\\,c_{k-1}^{\\rm old},\n\\qquad c_0=1."}</MathBlock></div>

<Prose>{"These cells are "}<strong>{"elementary symmetric sums"}</strong>{": sums of products over distinct-member subsets of a specified size. Equivalently, cₖ is the coefficient of zᵏ in the polynomial "}<InlineMath>{"\\prod_{i\\in R}(1+w_i z)"}</InlineMath>{". Each factor offers either 1, excluding member i, or wᵢz, including it once. That polynomial explains both the recurrence and why reuse of a member is prohibited."}</Prose>

<Prose>{"For r risk members and target size d, the scalar recurrence does O(r d) work and stores O(d) cells. Explicit enumeration stores or visits "}<InlineMath>{"\\binom rd"}</InlineMath>{" possibilities instead. The recurrence avoids that combinatorial listing; it does not make every large exact Cox fit cheap. Many event groups, many features and repeated parameter evaluations still have their own costs."}</Prose>

<H3>{"How do those cells stay useful when weights are extremely large?"}</H3>

<Prose>{"Store logarithms of positive masses, and keep the numerator on the same scale."}</Prose>

<Prose>{"An individual exp(η) may overflow even though its share of a competing pool is well defined. Section 8 removed a common log-weight maximum within each pool. Here choose m=maxᵢηᵢ and replace every log weight by ηᵢ−m. Every size-d subset product changes by the same factor exp(−dm). The observed numerator changes by that factor too, so their ratio does not change."}</Prose>

<Prose>{"For addition, use logaddexp(a,b)=log(exp(a)+exp(b)). It avoids first forming the two potentially enormous masses. An impossible cell has log mass −∞; the empty choice has log mass 0. If qₖ denotes log cₖ, the same right-to-left update becomes:"}</Prose>

<div className="neural-equation"><MathBlock>{"q_k^{\\rm new}\n=\\operatorname{logaddexp}(q_k^{\\rm old},\\eta-m+q_{k-1}^{\\rm old})."}</MathBlock></div>

<Prose>{"The coefficient shift is only a numerical device. It does not alter the statistical model, remove a feature effect or choose an intercept. The code computes the log likelihood from shifted numerator and shifted denominator directly, rather than subtracting two large restored totals. The scalar denominator API restores dm when a caller explicitly asks for its log value. Finite inputs whose differences exceed the machine range raise an explicit numerical error; they are not silently clipped into a successful estimate."}</Prose>

<H3>{"What does the subset score tell us to change?"}</H3>

<Prose>{"Compare the observed pair's feature sum with the weighted feature sum over possible pairs."}</Prose>

<SubsetFeatureFigure />

<Prose>{"The observed pair BC has feature sum 0+1=1. On the other side of the picture, every candidate pair has the sum in the table and normalized weight equal to its product weight divided by 16. The weighted sum of those feature sums is 15/16. Their squared feature sums have weighted mean 25/16. Thus the observed sum is slightly above the model's current expectation. Increasing β slightly increases this group's log likelihood; it is not yet a claim about the optimum for the whole table."}</Prose>

<Prose>{"The random quantity is now the "}<strong>{"sum of features in a candidate failing subset"}</strong>{", rather than the single failing member's feature in section 8. For a candidate subset A, name that sum v_A=Σᵢ∈A xᵢ. Its product weight is exp(βᵀv_A). Let Z be the sum of these weights and π_A their normalized shares. Differentiating one exponential gives its weight times v_A; dividing the derivative of Z by Z gives the weighted mean of v_A. Differentiating the normalized shares gives their covariance, by the same positive-weight reasoning as section 8:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\n\\ell_j(\\beta)&=\\beta^\\top v_D-\\log Z,\\\\\nU_j(\\beta)&=v_D-\\sum_A\\pi_Av_A,\\\\\nI_j(\\beta)&=\\sum_A\\pi_A(v_A-\\bar v)(v_A-\\bar v)^\\top,\n\\qquad \\bar v=\\sum_A\\pi_Av_A.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"U is the score, the log-likelihood gradient. I is its negative Hessian, the information supplied by variation among the candidate subset sums. For the scalar day-2 example:"}</Prose>

<div className="neural-equation"><MathBlock>{"U_j=1-\\frac{15}{16}=\\frac1{16},\n\\qquad\nI_j=\\frac{25}{16}-\\left(\\frac{15}{16}\\right)^2\n=\\frac{175}{256}."}</MathBlock></div>

<Prose>{"The minus sign in “negative Hessian” follows from subtracting log Z in the likelihood. The covariance is nonnegative; a constant feature or a forced subset gives zero information. Neither a tiny scalar denominator nor a finite information entry proves that the whole model has a finite, identifiable maximum. Section 8's separation and solver qualifications remain relevant if you later fit this objective."}</Prose>

<H3>{"Can the same recurrence calculate those derivatives efficiently?"}</H3>

<Prose>{"Each cell carries its subset mass, feature-sum mean and centered covariance."}</Prose>

<SubsetMomentMergeFigure />

<Prose>{"Follow one include arrow in the picture. Adding the incoming member adds its feature vector x to every old (k−1)-member subset sum. All those sums shift by the same x, so their mean shifts by x and their covariance stays unchanged. Their mass multiplies by the incoming weight. The exclude arrow keeps the old k-member state unchanged."}</Prose>

<Prose>{"The two arrows then merge. If their positive masses have normalized shares a and b, means μ₀ and μ₁, and covariances C₀ and C₁, use:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\n\\mu&=a\\mu_0+b\\mu_1,\\qquad a+b=1,\\\\\nC&=aC_0+bC_1+ab(\\mu_1-\\mu_0)(\\mu_1-\\mu_0)^\\top.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"The last term accounts for variation "}<strong>{"between"}</strong>{" the two branch means; the first two account for variation "}<strong>{"within"}</strong>{" their branches. This is section 8's positive centered-moment merge, applied to subset sums. Keeping log mass, mean and covariance is an equivalent normalized form of keeping the coefficient's first and second derivatives: its first derivative is mass×mean and its second derivative is mass×(covariance+mean×meanᵀ). We do not form those large raw moments or subtract nearly equal squares in the implementation."}</Prose>

<Prose>{"For p features, every cell's covariance has p² entries. Dense derivative work is O(r d p²), and DP working state is O(d p²), alongside the copied O(r p) feature input. That is deliberately stated separately from the scalar O(r d)/O(d) calculation. A trace retaining every previous row would need additional storage; the numerical core keeps only the current row."}</Prose>

<Prose>{"Save the following complete module as "}<code>{"discrete_cox_ties.py"}</code>{". The scalar function serves the coefficient trace; "}<code>{"discrete_tied_terms"}</code>{" serves the log likelihood, score and information. Feature rows and Boolean death indicators describe a "}<strong>{"complete current risk set"}</strong>{", including current censors under our event-first convention. The caller is responsible for that membership. The module copies/centers features, validates the local contract, updates right to left and returns read-only result arrays."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/discrete_cox_ties.py"} filename={"discrete_cox_ties.py"} language={"python"} title={"discrete_cox_ties.py"} />

<Prose>{""}<code>{"_merge_subsets"}</code>{" handles an absent exclude branch when there are not yet enough old members to form that subset size. It combines positive branches through logaddexp and centered covariance otherwise. "}<code>{"discrete_tied_terms"}</code>{" starts the zero-member cell at mean 0/covariance 0, adds each row once, then reads the d-member cell. Its observed feature sum and shifted numerator use only the true entries of "}<code>{"deaths"}</code>{". No library routine supplies a hidden likelihood or fit."}</Prose>

<Prose>{"The following complete example calculates our day-2 group at "}<strong>{"supplied"}</strong>{" β=log 2. Put it beside the module as "}<code>{"exact-discrete-cox.py"}</code>{" and run "}<code>{"python exact-discrete-cox.py"}</code>{" in a Python environment with NumPy installed. It does not estimate β."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/exact-discrete-cox.py"} filename={"exact-discrete-cox.py"} language={"python"} title={"exact-discrete-cox.py"} />

<Prose>{"Recorded output from this analytical example:"}</Prose>

<CodeBlock language={"output"}>{"risk members B,C,D,E,F; weights: [1.0, 2.0, 0.5, 1.0, 2.0]\nBreslow factor: 0.047337278107\nEfron factor: 0.061538461538\ndiscrete subset denominator: 16.000000000000\ndiscrete subset factor: 0.125000000000\nlog subset factor: -2.079441541680\nsubset score: 0.062500000000\nsubset information: 0.683593750000"}</CodeBlock>

<H3>{"How does one group become a whole-table objective?"}</H3>

<Prose>{"Reuse the taught current-risk membership, and add each observed group's terms."}</Prose>

<Prose>{""}<code>{"prepare_cox"}</code>{" from section 8 stores rows in descending endpoint order. At a group's endpoint, the prefix ending at that group contains exactly the members whose observed endpoints are at least that time. Its current event rows, not every event in the prefix, form the failing subset. The following complete module uses that correspondence. Copy the already explained "}<code>{"cox_risk_moments.py"}</code>{" beside these files; its role here is preparation and the "}<code>{"CoxData"}</code>{" container, not a Breslow/Efron denominator."}</Prose>

<Prose>{"Complete source — "}<code>{"exact_discrete_cox_model.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/exact_discrete_cox_model.py"} filename={"exact_discrete_cox_model.py"} language={"python"} title={"exact_discrete_cox_model.py"} />

<Prose>{"For each failure group j, the evaluator adds its log likelihood, score and information. It deliberately recomputes a subset recurrence at each group; its dense evaluation cost is Σⱼ O(rⱼdⱼp²), with the stated peak working storage in the module. All-censored data returns zero terms: the conditional objective provides no coefficient information. A Newton optimizer could use this evaluator with the section-8 sign convention, but an optimizer must still handle curvature, separation and failures. This evaluator does not promise an arbitrary exact fitter or an absolute discrete-time curve. Section 12 will model event probabilities within bins directly when that is the desired time model."}</Prose>

<H3>{"How can an ordinary library check the same conditional calculation?"}</H3>

<Prose>{"Hold β fixed so that a likelihood check is not confused with optimization."}</Prose>

<Prose>{"R's "}<code>{"survival"}</code>{" package calls this construction "}<code>{"ties=\"exact\""}</code>{". The complete R file below creates a day-2-only five-member cohort, initializes β at log 2 and permits zero optimization iterations. All later members are censored after that shared event time, leaving one relevant failing subset. It asserts both the unchanged coefficient and log factor log(1/8). It contains only the conditional likelihood operation just taught."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/exact-discrete-cox-library.R"} filename={"exact-discrete-cox-library.R"} language={"r"} title={"exact-discrete-cox-library.R · source only"} />

<Prose>{"Save "}<code>{"exact-discrete-cox-library.R"}</code>{", install R and its "}<code>{"survival"}</code>{" package, then run "}<code>{"Rscript exact-discrete-cox-library.R"}</code>{". This is a source-only R route, without recorded R output. The expected subset factor is the hand-derived 1/8. For coefficient fitting, omit the zero-iteration control and supplied initialization, retain the observation interpretation and inspect convergence. A zero-iteration object evaluates a supplied coefficient; its diagnostics do not establish fitted inference."}</Prose>

<H3>{"Relative risk is not yet a still-running probability. What is missing?"}</H3>

<Prose>{"The failure counts supply a common cumulative-hazard scale after the coefficient is chosen."}</Prose>

<AbsoluteSurvivalFigure />

<Prose>{"Return to the full A–F table and keep β=log 2 "}<strong>{"supplied"}</strong>{", so this baseline calculation has a transparent answer. The reference profile is x=0, with relative weight 1. At day 1 the whole six-member risk weight is 7 and one failure occurs. Give the reference cumulative hazard an increment 1/7. At day 2 the current weight is 6.5 and two failures occur, giving 2/6.5=4/13. At day 4 only E and F remain, with weight 1+2=3 and one failure, giving 1/3. Censoring at days 3 and 5 removes members from later competition but adds no failure increment."}</Prose>

<Prose>{"The baseline here uses "}<strong>{"Breslow cumulative-hazard increments"}</strong>{". This baseline choice is separate from the tied-event likelihood used to obtain coefficients. For instance, lifelines' usual semi-parametric Cox route uses Efron coefficient terms and a Breslow baseline; the original complete fitted example below demonstrates that combination."}</Prose>

<Prose>{"Call the reference feature vector z. Weights in the denominator are exp(βᵀ(xᵢ−z)), so the reference itself has weight 1. At failure time tⱼ there are dⱼ failures; Rⱼ is its taught pre-failure risk set. Accumulate the increments through the requested time, then use the continuous PH model's survival transform from section 5:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\n\\Delta\\widehat H_z(t_j)\n &=\\frac{d_j}{\\sum_{i\\in R_j}\\exp(\\beta^\\top(x_i-z))},\\\\\n\\widehat H_z(t)&=\\sum_{t_j\\le t}\\Delta\\widehat H_z(t_j),\\\\\n\\widehat H(t\\mid x)&=\\widehat H_z(t)\\exp(\\beta^\\top(x-z)),\\\\\n\\widehat S(t\\mid x)&=\\exp[-\\widehat H(t\\mid x)].\n\\end{aligned}"}</MathBlock></div>

<Prose>{"For reference z=0 at day 4, the increments add to 1/7+4/13+1/3=214/273. This is a cumulative hazard, not a probability. Multiply it by exp(βx) for a supplied profile, then exponentiate its negative to get the probability. Moving the profile slider changes only x, the profile's relative weight, cumulative hazard and survival. It does not refit coefficients, alter the observations or claim that changing a pump's recorded feature causally changes its outcome."}</Prose>

<H3>{"Why can a library's “baseline” differ while its predictions agree?"}</H3>

<Prose>{"Changing the reference redistributes the scale; it does not change the physical profile."}</Prose>

<ReferenceChangeFigure />

<Prose>{"The left lane uses reference z=0. The right uses z=1. At β=log 2, the z=1 profile has twice the relative hazard of z=0, so its reference cumulative hazard is twice as large. But for the same physical profile x, the relative multiplier is now exp(β(x−1)), half the previous exp(βx). The two factors compensate exactly."}</Prose>

<Prose>{"More generally, if a is one reference and z is another, H_z=H_a exp(βᵀ(z−a)). Multiplying H_z by exp(βᵀ(x−z)) gives H_a exp(βᵀ(x−a)), the same physical profile hazard. The baseline can be attached to zero, a centering mean or another declared reference. “Baseline” is incomplete unless that reference is named. A curve at the mean feature values is also not generally the "}<strong>{"average"}</strong>{" of all subjects' survival probabilities, because exponentiation is nonlinear."}</Prose>

<Prose>{"The numerical preparation in section 8 used its first input feature row as an internal origin. Our example's first x is −1; that internal origin does not turn the learner's reference x=0 into −1. The code converts between them explicitly. R's "}<a href={"https://www.stat.ethz.ch/R-manual/R-devel/library/survival/html/basehaz.html"}>{"reference-baseline documentation"}</a>{" describes the same profile conversion. Use explicit profiles rather than assuming that a default centered curve is a population-average answer."}</Prose>

<H3>{"How do we implement the baseline without unstable risk-weight subtraction?"}</H3>

<Prose>{"Reuse descending groups, but keep only the scalar masses needed for the baseline."}</Prose>

<Prose>{"Section 8 needed risk means and covariances to learn coefficients. Here the coefficients are already supplied, so carrying p² moments would do unnecessary work. Accumulate the log weight of later members, then add the current nondeath and death members. For Breslow take log d minus the log total weight. Add βᵀ(z−origin) to express the increment at the requested reference, reverse the failure groups into ascending time and accumulate increments with logaddexp."}</Prose>

<Prose>{"For the separately declared "}<strong>{"Efron baseline correction"}</strong>{", accumulate the reciprocals of the progressively depleted denominators, rather than d divided by the unchanged pool. At our day-2 state these increments are 1/6.5+1/5=23/65, compared with the Breslow 4/13. The code merges the positive nondeath pool with each remaining fraction of the death pool, as in section 8. It does not subtract huge nearly equal exponentials. The resulting reference cumulative hazard at day 4 is 1/7+23/65+1/3=1133/1365. This is a deliberate changed estimator, not a rounding discrepancy or an automatic consequence of fitting coefficients with Efron terms."}</Prose>

<Prose>{"Store the coefficient, reference and ordered feature names with the baseline. Prediction checks the feature schema, uses right-continuous step lookup and rejects times beyond the last observed endpoint. Before the first failure the estimated cumulative hazard is zero; the estimated survival is one. All-censored data likewise gives the estimator no observed failure increments; it does not establish that the population never fails. Very tiny positive survival may round to floating zero, which the result flags separately."}</Prose>

<Prose>{"Save this complete module as "}<code>{"cox_baseline.py"}</code>{", beside the already explained "}<code>{"cox_risk_moments.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox_baseline.py"} filename={"cox_baseline.py"} language={"python"} title={"cox_baseline.py"} />

<Prose>{""}<code>{"estimate_cox_baseline"}</code>{" separates positive current-death and nondeath masses while walking the existing groups. "}<code>{"log_increments"}</code>{" and "}<code>{"log_cumulative_hazard"}</code>{" store the reference scale without needlessly forming huge hazard values. "}<code>{"predict_cox_survival"}</code>{" returns profile-by-time matrices, preserving time order supplied by the caller. Its "}<code>{"rounded_to_zero"}</code>{" flag is numerical, not a literal zero-hazard or population-extinction statement. The module supplies point estimates; confidence bands require additional coefficient/baseline uncertainty calculations and assumptions."}</Prose>

<Prose>{"Given prepared data, baseline work is O(np+n+e), where e counts failures. The scalar suffix and event groups require no n×n table. For q query times and a profiles, binary step lookup costs O(q log m) for m failure groups, profile scores cost O(ap), and producing the probability matrix costs O(aq). The returned matrix itself takes that O(aq) space: a huge dense grid is a real output cost."}</Prose>

<Prose>{"Run the following complete example as "}<code>{"cox-absolute-survival.py"}</code>{". It prints the three reference increments, the profile predictions and the reference-change invariance, then the distinct Efron baseline increment. Its β is still supplied, not newly fitted."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-absolute-survival.py"} filename={"cox-absolute-survival.py"} language={"python"} title={"cox-absolute-survival.py"} />

<Prose>{"Recorded analytical output:"}</Prose>

<CodeBlock language={"output"}>{"supplied beta: log(2); reference x=0; baseline: Breslow\nfailure times: [1.0, 2.0, 4.0]\nreference increments: [0.142857142857, 0.307692307692, 0.333333333333]\nreference cumulative hazard at4: 0.783882783883\nS(4), profiles x=-1,0,1: [0.675743716827, 0.456629570832, 0.208510564958]\nreference x=1 cumulative hazard at4: 1.567765567766\nsame physical profiles after reference change: [0.675743716827, 0.456629570832, 0.208510564958]\nEfron baseline day2 increment: 0.353846153846"}</CodeBlock>

<H3>{"What does the normal library route look like?"}</H3>

<Prose>{"Ask for named profiles and state both the coefficient and baseline conventions."}</Prose>

<Prose>{"The next Python example isolates the baseline at the same supplied β, using scikit-survival's "}<strong>{"lower-level"}</strong>{" "}<code>{"BreslowEstimator"}</code>{". Its "}<code>{".fit"}</code>{" computes baseline increments from supplied linear predictors; it does not optimize a Cox coefficient. That distinction makes the comparison to the hand calculation exact. This lower-level class is the inspected scikit-survival 0.28.0 route, not a promise of a stable top-level API across releases. The normal coefficient-fitting route follows afterward."}</Prose>

<Prose>{"Complete source — "}<code>{"cox-fixed-baseline-library.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-fixed-baseline-library.py"} filename={"cox-fixed-baseline-library.py"} language={"python"} title={"cox-fixed-baseline-library.py"} />

<Prose>{"Recorded output with scikit-survival 0.28.0:"}</Prose>

<CodeBlock language={"output"}>{"supplied-beta library reference H(4): 0.783882783883\nsupplied-beta library S(4), x=-1,0,1: [0.675743716827, 0.456629570832, 0.208510564958]"}</CodeBlock>

<Prose>{"For ordinary fitted work, use "}<code>{"CoxPHSurvivalAnalysis(ties=\"efron\")"}</code>{" with the feature matrix and "}<code>{"Surv.from_arrays(event,time)"}</code>{", or lifelines' "}<code>{"CoxPHFitter"}</code>{" with named DataFrame columns. The original complete "}<code>{"cox-ties-and-baseline.py"}</code>{" below uses both, then reads the centered lifelines Breslow baseline and requests explicit x=−1,0,1 profiles. It retains its own fitted β and output; those numbers are not our new supplied β=log 2 calculation. Put it in an environment with NumPy, pandas, lifelines and scikit-survival if you want to reproduce that original example. Neither "}<code>{".fit"}</code>{" call is part of the supplied-beta baseline program above."}</Prose>

<Prose>{"Complete source — "}<code>{"cox-ties-and-baseline.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-ties-and-baseline.py"} filename={"cox-ties-and-baseline.py"} language={"python"} title={"cox-ties-and-baseline.py"} />

<Prose>{"Recorded output:"}</Prose>

<CodeBlock language={"output"}>{"day 2 risk weights: [1.0, 2.0, 0.5, 1.0, 2.0]\nBreslow / Efron contributions: 0.04733728 0.06153846\ndiscrete unordered subset probability: 0.125\nEfron fitted beta, lifelines / sksurv: -0.39443 -0.39443\ncentered baseline cumulative hazard at 4: 1.169632\npredicted S(4) for x=-1,0,1: [0.176366, 0.310481, 0.454568]"}</CodeBlock>

<Prose>{"The fitted β is approximately −0.394430, giving a different relationship from our supplied positive log 2. The retained x=−1 profile has "}<strong>{"lower"}</strong>{" survival than x=1 at day 4. The original table's mean x is zero, so its centered reference happens to match x=0; that coincidence cannot be assumed for another dataset. The reported baseline 1.169632 and the profile probabilities belong to this fitted coefficient and this baseline convention only."}</Prose>

<Prose>{"In R, a separate supplied-coefficient baseline file uses "}<code>{"survfit"}</code>{" with explicit "}<code>{"newdata"}</code>{", "}<code>{"stype=2"}</code>{" for exp(−cumulative hazard), and "}<code>{"ctype=1"}</code>{" for a deliberate Breslow baseline. "}<code>{"ctype=2"}</code>{" requests its tie-corrected cumulative hazard. Omitting "}<code>{"ctype"}</code>{" lets the package choose it from the coefficient tie setting, so explicitly naming it matters when comparing implementations. The "}<a href={"https://www.stat.ethz.ch/R-manual/R-devel/library/survival/html/survfit.coxph.html"}>{"survfit.coxph documentation"}</a>{" also explains why its default pseudo-subject is not an average survival curve. These are source-checked R routes; no R output is attributed to the local Python comparison. Save the complete file below as "}<code>{"cox-absolute-survival-library.R"}</code>{" and run "}<code>{"Rscript cox-absolute-survival-library.R"}</code>{" in the same R environment:"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-absolute-survival-library.R"} filename={"cox-absolute-survival-library.R"} language={"r"} title={"cox-absolute-survival-library.R · source only"} />

<H3>{"Run the two supplied-coefficient R checks together"}</H3>

<Prose>{"The two R routes above separate the questions for learning: first a conditional failing-subset factor, then an absolute survival curve with a declared reference and baseline convention. If you want one file that performs both checks in that order, the complete "}<code>{"cox-ties-reference.R"}</code>{" below combines their operations. It is a convenience script, not another estimator or a replacement for the separate explanations."}</Prose>

<Prose>{"The first part holds β at log 2 and checks the exact day-2 subset likelihood. The second keeps the same supplied coefficient in the full A–F table, declares Efron coefficient terms and explicitly selects a Breslow baseline with "}<code>{"ctype=1"}</code>{". Its named profiles use the already derived reference cumulative hazard 214/273 at day 4. The checks compare these hand-derived quantities; they do not claim that either zero-iteration object is a converged coefficient fit."}</Prose>

<Prose>{"Save the combined source as "}<code>{"cox-ties-reference.R"}</code>{" and run "}<code>{"Rscript cox-ties-reference.R"}</code>{" with R and "}<code>{"survival"}</code>{". It is source-only, like the separate R routes above; there is no recorded R output or parity result."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-ties-reference.R"} filename={"cox-ties-reference.R"} language={"r"} title={"cox-ties-reference.R · source only"} />

<H3>{"What should you check before trusting a curve?"}</H3>

<Prose>{"Verify its observation model, profile schema, time support and estimator choices together."}</Prose>

<Prose>{"A finite coefficient and a neat curve do not establish the PH assumption, informative-censoring assumptions or validity on a new population. The recorded support ends at the last observed endpoint, here day 5; our last failure is day 4. Holding the estimated step constant through day 5 is different from claiming that nothing fails after day 5. Extrapolation requires a stated additional time model and evidence."}</Prose>

<Prose>{"Nor does the exact conditional subset calculation uniquely recover absolute within-bin event probabilities. It conditioned away each group's count/intercept. The Breslow/Efron baseline code here is the declared continuous-PH cumulative-hazard route, not an exact discrete odds-to-survival reconstruction. Section 12's person-period model will teach an explicit conditional event probability in each reached bin."}</Prose>

<Prose>{"For independent practice now, change B's weight from 1 to 3, leaving C,D,E,F at 2,0.5,1,2 and keep BC as the observed pair. Recompute the three factors before using the code. The total risk weight is 8.5, the failure weight is 5, their product is 6, and the subset denominator is 27. The factors are 24/289, 2/17 and 2/9 respectively. Explain why they changed, and why their magnitudes still cannot choose the correct observation model. This changes supplied "}<strong>{"weights"}</strong>{", not the fitted single-feature β: one coefficient cannot independently change only B's weight while preserving all the other original x-based weights."}</Prose>

<Prose>{"Then change the reference from x=0 to x=1 in the supplied-β baseline example and keep the same physical query profile. Its reference hazard doubles and its profile multiplier halves; its survival must stay the same. Change the physical profile instead, keeping the reference fixed, and its survival should change. These two operations answer different questions. Later practice will combine this schema/scale check with changed observations rather than only repeat these numbers."}</Prose>

<Prose>{"We can now explain how observations lead to relative coefficients and a supported absolute survival curve. But the construction keeps each profile's relative weight fixed over time. What if the relative effect changes, or the surviving population changes composition? Section 10 examines that assumption instead of treating optimizer convergence as proof of a suitable model."}</Prose>

<H2>{"10. Check proportionality and changing populations"}</H2>

<Prose>{"Section 9 turned relative Cox weights into an absolute survival curve. That calculation used one coefficient vector at every event time. A successful optimizer tells us that we solved its stated objective; it does not tell us that a fixed relative weight is the right description of the pumps. Now we will inspect that assumption, first with known rates, then with observed failures, and finally with populations whose composition changes as they age."}</Prose>

<H3>{"Does proportional mean that the failure rate never changes?"}</H3>

<Prose>{"The baseline can change with time while the ratio between two fixed profiles stays constant."}</Prose>

<ProportionalRatesFigure />

<Prose>{"Start with the two profile labels above the hazard panel. The reference profile has multiplier 1; the comparison has multiplier 0.5. At every instant, both use the same underlying rate shape. When the reference rate changes, the comparison changes at the same time and remains half as large. The vertical distance between the two rate curves can change. Their ratio remains 0.5."}</Prose>

<Prose>{"The survival panel underneath asks a different question: what fraction of each starting group is still running? Each curve accumulates its own rate history. The gap between these curves need not stay constant, even with a constant hazard ratio. The reference/comparison colours identify the same profiles in both panels; a hazard height has units per day, while a survival height is a probability without units."}</Prose>

<Prose>{"For fixed profiles x₀ and x₁, the Cox construction from section 8 is"}</Prose>

<div className="neural-equation"><MathBlock>{"h(t\\mid x)=h_0(t)\\exp(x^\\top\\beta),\\qquad\n\\frac{h(t\\mid x_1)}{h(t\\mid x_0)}\n=\\exp\\{(x_1-x_0)^\\top\\beta\\}."}</MathBlock></div>

<Prose>{"Here h₀ is the common baseline rate shape. It cancels in the ratio where that ratio is defined. "}<strong>{"Proportional hazards"}</strong>{", or PH, is this time-independent ratio for the stated fixed profiles. It does not require a constant baseline rate, linear-looking survival curves, or equal vertical gaps. If both hazards are zero at an instant, a 0/0 ratio is undefined there; the shared-multiplier model can still be stated without that division."}</Prose>

<Prose>{"Call the constant multiplier a. Integrating the hazard as in section 5 gives H₁(t)=aH₀(t). Therefore the survival relationship from section 9 is"}</Prose>

<div className="neural-equation"><MathBlock>{"S_1(t)=\\exp\\{-aH_0(t)\\}=S_0(t)^a."}</MathBlock></div>

<Prose>{"This also explains why a hazard ratio is not a horizon-specific failure-risk ratio. With a=0.5 and reference survival 0.8, the comparison failure probability is 1−√0.8≈0.105573. The reference failure probability is 0.2, so their risk ratio is approximately 0.527864. At another horizon where reference survival is 0.2, the same calculation gives a risk ratio approximately 0.690983. These are the original lesson's two PH probability conversions. A fixed multiplier does not halve every accumulated failure probability."}</Prose>

<Prose>{"The profiles must really be fixed for that interpretation. A maintenance indicator that changes during follow-up is a history, not a fixed commissioning-time profile. Section 14 will put those changes on their proper time intervals. Here we ask whether the effect attached to a fixed profile itself changes with the event clock."}</Prose>

<H3>{"When does a worsening rate become worse accumulated survival?"}</H3>

<Prose>{"A group can have the worse rate now and still retain the survival advantage it earned earlier."}</Prose>

<ChangingEffectFigure />

<Prose>{"For this constructed law, keep the reference rate at 0.1 per day. The comparison rate is 0.05 per day before day 4 and 0.2 per day from day 4 onward. This is a new known-rate illustration of a changing effect, rather than a new fit to the eight observed pumps. We know the complete rate functions, so we can calculate their population curves directly."}</Prose>

<Prose>{"Read the top panel's marked "}<strong>{"change time"}</strong>{", day 4. Before it, the comparison rate is half the reference rate. After it, the comparison rate is twice the reference rate. A single fixed Cox multiplier cannot represent both periods. The top panel answers “which group is accumulating risk faster now?”"}</Prose>

<Prose>{"Read the middle panel's accumulated areas. By day 4, the reference has accumulated 0.1×4=0.4, while the comparison has accumulated only 0.05×4=0.2. The comparison has a head start. Its larger rate after day 4 must first erase that difference. By day 6, the reference accumulation is 0.1×6=0.6. The comparison accumulation is 0.05×4+0.2×2=0.6 as well."}</Prose>

<Prose>{"The bottom panel applies survival=exp(−accumulation). Its marked "}<strong>{"crossing time"}</strong>{" is day 6, with shared survival exp(−0.6)≈0.548812. Day 4, day 6 and 0.548812 are three different quantities: a rate-change time, a survival-crossing time and a probability. Their axis labels and units make that distinction visible. No discontinuous drop in survival occurs at day 4: changing the rate changes the subsequent slope, not the amount of accumulated risk instantaneously."}</Prose>

<Prose>{"Write c for the change time. For t≥0, the reference accumulation is 0.1t. The comparison accumulates 0.05t until c and then keeps its already accumulated 0.05c while adding 0.2(t−c). Thus"}</Prose>

<div className="neural-equation"><MathBlock>{"H_{\\rm ref}(t)=0.1t,\\qquad\nH_{\\rm cmp}(t)=0.05\\min(t,c)+0.2\\max(t-c,0)."}</MathBlock></div>

<Prose>{"For a later crossing, use the branch t≥c. Because the exponential survival transform is one-to-one, equal survival means equal cumulative hazard:"}</Prose>

<div className="neural-equation"><MathBlock>{"0.1t=0.05c+0.2(t-c)\n\\quad\\Longrightarrow\\quad t=1.5c."}</MathBlock></div>

<Prose>{"For positive c, this answer is after the change time and belongs to the branch we used. Move the one change-time control to day 3: the later crossing becomes day 4.5. Move it to day 6: the crossing becomes day 9. At c=0, the comparison has the larger rate immediately. Both start at survival 1, but there is "}<strong>{"no later crossing"}</strong>{". The initial shared point is not a delayed catch-up event."}</Prose>

<Prose>{"This example proves that PH fails for these known rate functions. An observed pair of estimated curves is a different evidential situation. Sampling noise, covariate imbalance and changing mixtures can affect those curves. Conversely, non-PH hazards need not produce an observed survival crossing. Curve separation alone is neither a proof of PH nor its universal diagnostic."}</Prose>

<H3>{"Which failure tells us that the fixed weighting looks wrong?"}</H3>

<Prose>{"Compare the failing pump's feature with the feature value predicted by its actual competitors."}</Prose>

<SchoenfeldResidualFigure />

<Prose>{"We now return from the known-rate illustration to the six-subject "}<strong>{"untied Cox witness from section 8"}</strong>{". Its observations are at days 1, 2, 2.5, 3, 4 and 5; A, B, C and E fail, while D and F are censored. C's day 2.5 distinguishes this witness from the original day-2 tied table. Its features remain −1, 0, 1, −1, 0 and 1. Use its fitted coefficient β̂=−0.43257419544250714 for the residual calculation."}</Prose>

<Prose>{"In the first-event picture, all six pumps are still competing. A is the observed failure and has feature −1. Each roster member's exp(β̂x) weight is divided by the complete current weight sum, exactly as in section 8. Use these shares to average the roster's feature values. At this recorded coefficient, that weighted mean is approximately −0.279739. The observed feature minus the weighted mean is −1−(−0.279739)≈−0.720261."}</Prose>

<Prose>{"That signed difference is the event's "}<strong>{"Schoenfeld residual"}</strong>{". It is not an observed duration minus a predicted duration. It compares a feature value with the feature value expected among the possible next failures. A positive residual means this event's feature was higher than its risk-weighted mean; a negative one means it was lower. Neither sign says that the pump's event time was predicted too early or too late."}</Prose>

<Prose>{"For an untied event j, let iⱼ be its failing subject and Rⱼ its risk roster. The same normalized shares pᵢⱼ from section 8 produce"}</Prose>

<div className="neural-equation"><MathBlock>{"\\bar x_j(\\beta)=\\sum_{i\\in R_j}p_{ij}(\\beta)x_i,\\qquad\nr_j=x_{i_j}-\\bar x_j(\\hat\\beta)."}</MathBlock></div>

<Prose>{"The residual is a vector when we have several features: one signed difference per feature, attached to the same event. Censored subjects have no observed failure residual, but they still contribute to every roster in which they are eligible. A subject censored at an event time is included immediately before that time under our already declared observation convention."}</Prose>

<Prose>{"The lower picture collects the four event residuals without discarding their roster origins. The values below come from the supplied recorded coefficient and the complete risk sets, not from a smoothed line or a simulated trend:"}</Prose>

<NeuralTable caption={"Which failure tells us that the fixed weighting looks wrong?"} headers={[<>{"Event"}</>,<>{"Day"}</>,<>{"Observed feature"}</>,<>{"Weighted feature mean"}</>,<>{"Residual"}</>]} rows={[[<>{"A"}</>,<>{"1"}</>,<>{"−1"}</>,<>{"−0.279739"}</>,<>{"−0.720261"}</>],[<>{"B"}</>,<>{"2"}</>,<>{"0"}</>,<>{"−0.050331"}</>,<>{"0.050331"}</>],[<>{"C"}</>,<>{"2.5"}</>,<>{"1"}</>,<>{"−0.063442"}</>,<>{"1.063442"}</>],[<>{"E"}</>,<>{"4"}</>,<>{"0"}</>,<>{"0.393512"}</>,<>{"−0.393512"}</>]]} />

<Prose>{"Their unrounded sum is approximately zero because we reused a stationary unpenalized fit. This is also the score identity U(β̂)=∑rⱼ from section 8. It does "}<strong>{"not"}</strong>{" imply that each residual is zero or that no time pattern can remain. Positive and negative contributions can cancel while being arranged systematically along time."}</Prose>

<h4>{"Implement the residual without rescanning every risk set"}</h4>

<Prose>{"The roster picture also explains the efficient implementation. The prepared data are ordered from latest to earliest exit. Add every member of a same-time group to the accumulated eligible pool; only then calculate its event residual. The previously accumulated later-exit members are precisely the subjects who were still eligible at this earlier time."}</Prose>

<Prose>{"We only need positive total weight and a weighted feature mean for raw residuals, rather than the full covariance matrix used by the fitter. If the current log total is L and a new member's log weight is z, the new log total is log(exp L+exp z), computed by "}<code>{"logaddexp"}</code>{". The new member's normalized fraction is q=exp(z−L_new). Move the mean toward its feature by that fraction:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\bar x_{\\rm new}=\\bar x_{\\rm old}+q(x_{\\rm incoming}-\\bar x_{\\rm old})."}</MathBlock></div>

<Prose>{"At an empty pool, L=−∞ gives q=1, so the first member sets the mean. This positive merge avoids exponentiating an entire unshifted risk roster or subtracting large totals. The prepared feature origin is restored for the reported observed values and means; it cancels in their difference. Preparation uses the earlier "}<code>{"prepare_cox"}</code>{" function; after it, extraction costs O(np) for n subjects and p features, with O(n+ep+p) additional state for the n scores and e event outputs. This source deliberately refuses tied failures: section 9 showed why their expected contributions depend on the chosen construction. A tied diagnostic needs that convention, not arbitrary row ordering."}</Prose>

<Prose>{"Save the complete module as "}<code>{"cox_diagnostics.py"}</code>{", beside "}<code>{"cox_risk_moments.py"}</code>{"."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox_diagnostics.py"} filename={"cox_diagnostics.py"} language={"python"} title={"cox_diagnostics.py"} />

<Prose>{"The returned "}<code>{"times"}</code>{", "}<code>{"observed_features"}</code>{", "}<code>{"weighted_means"}</code>{" and "}<code>{"residuals"}</code>{" are aligned event rows, in increasing time order. All are read-only. That alignment is what lets the second picture point from event A's mean to event A's plotted residual without silently sorting the values separately."}</Prose>

<H3>{"Why look for a pattern against time, rather than demand zero residuals?"}</H3>

<Prose>{"Under the correct fixed-weight model, the expected next failure has the risk-weighted feature mean at every event time."}</Prose>

<ScaledResidualFigure />

<Prose>{"Return to one roster in the upper picture. If the model really gives each member the stated chance of being the next failure, averaging over that unknown choice gives E[x_failure | roster]=x̄. Thus the residual's conditional expectation is zero at the true fixed coefficient. Individual events remain noisy; a surprising next failure is entirely possible under a correct model."}</Prose>

<Prose>{"Now look at successive event times in the lower picture. If the feature's effect grows with time while we use a fixed coefficient, later failures can contain systematically more of that feature than their fixed-weight rosters expect. The sign and size pattern motivates a changing-coefficient diagnostic. The picture is a sequence of event contributions, not independent ordinary regression errors with equal variance."}</Prose>

<Prose>{""}<strong>{"Scaling"}</strong>{" means expressing a residual in approximate coefficient-change units. We already met each roster's feature covariance Vⱼ as its information contribution in section 8. A first-order local expansion explains the connection. Suppose the true coefficient near this event differs from β̂ by a small vector δⱼ. Changing the weights changes the expected feature mean by approximately Vⱼδⱼ. The expected residual under those changed weights is therefore roughly Vⱼδⱼ, so a suitable inverse-information operation converts the difference back toward δⱼ. This is a local approximation, not an exact equality for every sample residual or an instruction to invert a rank-deficient roster covariance."}</Prose>

<Prose>{"For the simple unpenalized setting, a common stable approximation uses the average event information I/e rather than a separate inverse for each event. With I=∑Vⱼ, the coefficient-scale residual is approximately eI⁻¹rⱼ. Adding β̂ produces an approximate local coefficient trace. The fixed-PH target is a horizontal coefficient trace, not a zero hazard or a zero failure count."}</Prose>

<Prose>{"Different tools present this trace differently. The inspected lifelines route returns deviations without adding β̂; the R "}<code>{"cox.zph"}</code>{" plot adds the coefficient reference. Label the vertical quantity before comparing plots. Ties, penalties, weights, strata and multi-column terms require the tool's specific information/scaling convention; the tiny untied derivation here does not certify all of those cases."}</Prose>

<Prose>{"The horizontal axis also needs a decision. "}<strong>{"Identity time"}</strong>{" means the recorded event times themselves. A rank transform instead uses ordering on a declared observation-time axis; a KM transform uses a cumulative event-survival scale. These choices emphasize different time patterns. Select the transformation for the scientific question rather than trying many and presenting only the smallest p-value. A log-time transform needs positive times. The next calculation uses identity time, taught first and named explicitly."}</Prose>

<H3>{"What does a proportionality test actually test?"}</H3>

<Prose>{""}<strong>{"Deeper derivation:"}</strong>{" follow this branch to construct the time-interaction score and remove the part explained by constant coefficients. For a first pass, keep the residual-pattern interpretation above, read the ordinary diagnostic example at the end of this branch, then continue to the two-type population."}</Prose>

<Prose>{"It asks whether adding one declared time-dependent coefficient direction would improve the fixed-coefficient model."}</Prose>

<EfficientTimeScoreFigure />

<Prose>{"The constant-coefficient path in the picture changes the feature weight at every time together. The time-interaction path tilts it: earlier and later events get different changes. We must distinguish those directions. Otherwise we could mistake a poorly estimated constant coefficient for evidence of a time-varying one."}</Prose>

<Prose>{"Let gⱼ be event time minus the mean of the event times, and choose a feature column k. Write θ for the strength of a proposed tilt. The candidate model changes that coefficient from βₖ to βₖ+θg(t). At θ=0 we recover the fixed model. All competitors at a given event time use the "}<strong>{"same current event time"}</strong>{" in this function; the model must not insert each competitor's eventual exit time as if it were an available predictor."}</Prose>

<Prose>{"For untied events, differentiating the event likelihood in this new direction gives U_θ=∑gⱼrⱼₖ. A larger positive value says that the residuals align with a positive tilt. But its scale depends on the risk-set feature variation and on how much the constant coefficients can explain. The information blocks make that explicit:"}</Prose>

<div className="neural-equation"><MathBlock>{"I_{\\beta\\beta}=\\sum_jV_j,\\quad\nI_{\\beta\\theta}=\\sum_jg_jV_je_k,\\quad\nI_{\\theta\\theta}=\\sum_jg_j^2(e_k^\\top V_je_k)."}</MathBlock></div>

<Prose>{"Here eₖ is the vector selecting feature column k; it is not an event flag. The off-diagonal block records overlap between a constant shift and a tilt. The constant coefficients are "}<strong>{"nuisance parameters"}</strong>{" for this particular test: they still belong to the model, but θ is the direction we are testing. Accounting for the part the nuisance parameters can explain leaves"}</Prose>

<div className="neural-equation"><MathBlock>{"I_{\\rm eff}=I_{\\theta\\theta}\n-I_{\\theta\\beta}I_{\\beta\\beta}^{-1}I_{\\beta\\theta},\\qquad\nT=U_\\theta^2/I_{\\rm eff}."}</MathBlock></div>

<Prose>{"This expression is the one-direction efficient score statistic at a stationary unpenalized null fit. The subtracted term prevents counting the same explanatory direction twice. Rather than subtract two potentially close floating-point totals, our implementation solves I_{ββ}a=I_{βθ} and sums the equivalent positive quadratic forms (gⱼeₖ−a)ᵀVⱼ(gⱼeₖ−a). It reuses section 8's centered positive covariance core. Singular null information or a constant time direction produces an unavailable statistic, not a silent ridge repair."}</Prose>

<Prose>{"For our recorded four-event witness, event times average to 2.375 days. The centred values are −1.375, −0.375, 0.125 and 1.625. Their weighted residual sum is approximately 0.464958; effective information is approximately 1.720904; the statistic is approximately 0.125624. These are calculated quantities for the tiny witness. Four events are too little to treat its usual large-sample reference as a convincing empirical adequacy assessment."}</Prose>

<Prose>{"With suitable regularity, a prespecified one-direction null test uses a chi-square distribution with one degree of freedom. A small p-value is evidence against that fixed specification in the tested direction; a large one is not proof that every time pattern is absent. Feature functional form, censoring assumptions, event information and multiplicity all affect the interpretation. An omitted nonlinear feature relationship can also appear as a residual time pattern because the risk-set composition changes. Inspect the pattern and substantive model before automatically adding or dropping a predictor."}</Prose>

<Prose>{"Save this deeper module as "}<code>{"cox_time_score.py"}</code>{", beside the residual and positive covariance modules already taught."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox_time_score.py"} filename={"cox_time_score.py"} language={"python"} title={"cox_time_score.py"} />

<Prose>{"This function consumes a stationary coefficient; it does not estimate one. "}<code>{"feature"}</code>{" names the column being tested, and "}<code>{"transform"}</code>{" is the already explained time function. The default is identity time. It checks stationarity, uses the complete competitor sets, adjusts for all constant coefficients, and returns the statistic separately from any asymptotic p-value. Its dense information work and event-trace storage are the section 8 costs, rather than a promise that an arbitrary high-dimensional test costs only O(np)."}</Prose>

<h4>{"Use ordinary diagnostics with their actual conventions"}</h4>

<Prose>{"The R route below fits its own version of the already taught untied table, retains the design matrix, obtains raw residuals, and applies an identity-time test. "}<code>{"x=TRUE"}</code>{" preserves the feature matrix for diagnostics. "}<code>{"terms=FALSE"}</code>{" selects coefficient columns, while "}<code>{"global=FALSE"}</code>{" requests the one-column table here. The horizontal line in the plot is the fitted coefficient because that tool displays the coefficient-scale trace with its coefficient added."}</Prose>

<Prose>{"Save it as "}<code>{"cox-schoenfeld-reference.R"}</code>{"."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-schoenfeld-reference.R"} filename={"cox-schoenfeld-reference.R"} language={"r"} title={"cox-schoenfeld-reference.R · source only"} />

<Prose>{"This is a source-only R route with no recorded output. R's current "}<code>{"cox.zph"}</code>{" uses an actual score test; lifelines documents a related approximation. Matching a time-transform name does not guarantee identical test statistics. The "}<a href={"https://www.stat.ethz.ch/R-manual/R-devel/library/survival/html/cox.zph.html"}>{"R API"}</a>{" and "}<a href={"https://lifelines.readthedocs.io/en/latest/jupyter_notebooks/Proportional%20hazard%20assumption.html"}>{"lifelines diagnostic tutorial"}</a>{" explain their respective contracts."}</Prose>

<Prose>{"For a larger ordinary-library example, we now explicitly switch from pumps to the original "}<strong>{"Rossi rearrest records"}</strong>{". The purpose is to read real adjusted coefficients and diagnostics; it is not to transfer pump rates to people. The record contains week of follow-up, an arrest event indicator, financial-aid assignment "}<code>{"fin"}</code>{", age, a recorded race indicator "}<code>{"race"}</code>{", previous work experience "}<code>{"wexp"}</code>{", marital status "}<code>{"mar"}</code>{", parole status "}<code>{"paro"}</code>{", and prior convictions "}<code>{"prio"}</code>{". These are input column names in the original dataset, not interchangeable causal labels."}</Prose>

<Prose>{"The program fits a Cox model, prints coefficient intervals, computes a named rank-time diagnostic, and extracts a raw residual vector. Its "}<code>{"exp(coef)"}</code>{" column gives the fitted hazard multiplier per feature change, conditional on the other included terms. The diagnostic test statistics and p-values are separate from that multiplier. Read the age and "}<code>{"wexp"}</code>{" rows as evidence of time-pattern problems in this specification, not as automatic decisions about which variables to discard."}</Prose>

<Prose>{"Complete source — "}<code>{"rossi-cox-association.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/rossi-cox-association.py"} filename={"rossi-cox-association.py"} language={"python"} title={"rossi-cox-association.py"} />

<CodeBlock language={"output"}>{"rows / events: 432 114\nKM S(26), median: 0.875 inf\n               coef  exp(coef)  coef lower 95%  coef upper 95%\ncovariate                                                     \nfin       -0.379422   0.684257       -0.754519       -0.004325\nage       -0.057438   0.944181       -0.100556       -0.014320\nrace       0.313900   1.368753       -0.289755        0.917555\nwexp      -0.149796   0.860884       -0.565748        0.266156\nmar       -0.433704   0.648104       -1.182152        0.314744\nparo      -0.084871   0.918631       -0.468547        0.298805\nprio       0.091497   1.095814        0.035347        0.147647\nrank-time PH diagnostic:\n      test_statistic         p\nage        11.453497  0.000714\nfin         0.015056  0.902343\nmar         0.709474  0.399619\nparo        0.134266  0.714049\nprio        0.018834  0.890843\nrace        1.426479  0.232340\nwexp        7.314934  0.006838\nfirst event record's Schoenfeld residual:\n{'fin': -0.414297, 'age': 4.286793, 'race': 0.108004, 'wexp': -0.45595, 'mar': -0.069788, 'paro': 0.399005, 'prio': -0.856093}\ntraining concordance: 0.640329\nHistorical randomized-aid dataset; this fit alone is not a complete causal analysis or held-out prediction assessment."}</CodeBlock>

<Prose>{"The output contains 432 records and 114 observed events. Age's rank-time diagnostic is 11.453497 with p=0.000714; "}<code>{"wexp"}</code>{" has 7.314934 with p=0.006838. The aid coefficient −0.379422 gives a fitted multiplier 0.684257. Aid assignment was randomized, but the other measured covariates were not all randomized; the fitted adjustment and a causal question still need their own estimand and assumptions. Training concordance 0.640329 describes this fit on its training records; section 11 develops held-out evaluation."}</Prose>

<H3>{"Can a changing pooled ratio occur when every type obeys PH?"}</H3>

<Prose>{"Yes: the groups being compared can contain different mixtures of surviving types over time."}</Prose>

<SurvivorMixtureFigure />

<Prose>{"Return to pumps and introduce a new "}<strong>{"known two-type population"}</strong>{". Half the starting pumps are robust, with constant failure rate 0.1 per day. Half are fragile, with constant rate 0.4 per day. Type labels and colours stay attached to the same kinds of pumps across the initial and survivor pictures. “Latent” means that the type exists in the constructed model but is not recorded in our hypothetical pooled data; it is not a type recovered by a clustering algorithm."}</Prose>

<Prose>{"First inspect the reference cohort at day 0. Its marginal, or pooled, hazard is 0.5×0.1+0.5×0.4=0.25 per day. Now inspect the day-5 survivor cohort. The robust pumps survive with probability exp(−0.1×5); the fragile pumps with probability exp(−0.4×5). The initial half-and-half weights must be multiplied by those different survival probabilities before being renormalized among the survivors."}</Prose>

<Prose>{"The reference's day-5 survivor weights are approximately 0.817574 robust and 0.182426 fragile. The pooled rate is now approximately 0.154728 per day. Neither type changed its own rate. The population being conditioned on changed: fragile pumps were more likely to have failed and left it. The population picture explains the falling marginal-rate curve beside it."}</Prose>

<Prose>{"Write πₖ for type k's initial probability and λₖ for its constant rate. The chance of both belonging to type k and surviving to t is πₖexp(−λₖt). Summing those mutually exclusive type possibilities gives pooled survival. Dividing each joint probability by that sum gives the survivor-conditioned type weight aₖ(t):"}</Prose>

<div className="neural-equation"><MathBlock>{"S_{\\rm mix}(t)=\\sum_k\\pi_k\\exp(-\\lambda_kt),\\qquad\na_k(t)=\\frac{\\pi_k\\exp(-\\lambda_kt)}{S_{\\rm mix}(t)},\\qquad\nh_{\\rm mix}(t)=\\sum_ka_k(t)\\lambda_k."}</MathBlock></div>

<Prose>{"The last identity follows by differentiating −log S, as in section 5. It is the hazard of the pooled still-running population, not the initial arithmetic mean of the type rates reused at every time. The denominator is positive for finite t under these finite exponential rates, even if a computer's displayed survival rounds to zero."}</Prose>

<Prose>{"Now compare another cohort with the same initial half-and-half mixture, but a common type-specific rate multiplier 0.5. The robust type has rate 0.05 and the fragile type has rate 0.2. "}<strong>{"Within either type"}</strong>{", the comparison hazard is always half the reference hazard: conditional PH holds exactly."}</Prose>

<Prose>{"At day 5, however, the comparison's survivor weights are approximately 0.679179 robust and 0.320821 fragile. More fragile pumps remain because their rates were reduced too. Its pooled hazard is approximately 0.098123. Divide that by the reference's pooled 0.154728: the marginal ratio is approximately "}<strong>{"0.634167"}</strong>{", not 0.5. The two groups at day 5 contain different survivor mixtures. This is selection through survival, even though they started with the same composition."}</Prose>

<Prose>{"For a common type multiplier b, the comparison survival is S_mix(bt), and its hazard is b h_mix(bt). The pooled ratio is consequently"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathrm{HR}_{\\rm pooled}(t)\n=b\\frac{h_{\\rm mix}(bt)}{h_{\\rm mix}(t)}."}</MathBlock></div>

<Prose>{"At time 0 it is b. With b=0.5 in this two-type law, it rises above 0.5 at intermediate times; as both survivor cohorts become dominated by the positive-probability lowest-rate type, the ratio tends back to 0.5. A different mixture can have different behavior. Do not turn this constructed pattern into a universal direction for every heterogeneous survival model."}</Prose>

<Prose>{"The two controls change the "}<strong>{"initial robust-type proportion"}</strong>{" and the "}<strong>{"common comparison multiplier"}</strong>{". Keep time as the aligned displayed axis, with a labelled day-5 witness, rather than adding another mode or selector. The initial proportions affect both starting cohorts; the comparison multiplier affects both of its type rates. Both survivor compositions, pooled hazards, survival curves and ratio must update together."}</Prose>

<Prose>{"Set the multiplier to 1: the two populations and pooled curves agree at every time. Set the robust proportion to 0 or 1: only one type remains, and the pooled ratio becomes the common multiplier. Equal type rates give the same no-selection case, shown as a static counterexample beside the two-type explanation rather than another control. These null cases reveal the role of heterogeneity instead of hiding it behind a preset wall."}</Prose>

<h4>{"Why does this mixture's pooled hazard decrease?"}</h4>

<Prose>{"The same composition rule gives an exact derivative, not just a suggestive downward plot. Differentiating aₖ(t) gives a′ₖ(t)=aₖ(t){h_mix(t)−λₖ}. Therefore"}</Prose>

<div className="neural-equation"><MathBlock>{"h'_{\\rm mix}(t)\n=h_{\\rm mix}(t)^2-\\sum_ka_k(t)\\lambda_k^2\n=-\\operatorname{Var}_{a(t)}(\\lambda)."}</MathBlock></div>

<Prose>{"The variance is the survivor-weighted variation of the "}<strong>{"constant type rates"}</strong>{". It is nonnegative, so the derivative is nonpositive. It becomes zero when the remaining positive-weight types all have the same rate. This result depends on the particular constant-rate mixture. It is not a theorem that arbitrary mixtures of time-varying hazards must decrease."}</Prose>

<Prose>{"For a hand-checkable changed law, let rates be 1 and 2 per day and initial weights 1/3 and 2/3. At t=log 2 days, the two surviving masses are each 1/6, making total survival 1/3 and survivor weights 1/2 each. The pooled hazard is 1.5 per day and its derivative is −0.25 per day squared. This changed example checks the weighting, probability normalization and variance mechanism without relying on rounded day-5 numbers."}</Prose>

<h4>{"Compute the complete known laws without losing the rare survivors"}</h4>

<Prose>{"For each type and time, work with log mass log πₖ−λₖt. "}<code>{"logaddexp"}</code>{" sums these positive masses in log coordinates. Subtracting total log survival before exponentiating produces normalized survivor weights, even when the unnormalized probabilities are too small to display. A type with initial weight zero uses log weight −∞ and remains absent; do not add an epsilon that invents members."}</Prose>

<Prose>{"The module below includes the already taught changed-rate law and this mixture law. It evaluates q times and k types with O(qk) work and O(qk) output state. It computes the derivative as a centred weighted variance, rather than subtracting nearly equal raw second moments. A rounded-zero survival output is explicitly marked while finite log survival and the survivor weights remain available. Integrated-rate or moment values beyond its finite numeric range are reported as unsupported, not fabricated."}</Prose>

<Prose>{"Save it as "}<code>{"survival_population.py"}</code>{"."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_population.py"} filename={"survival_population.py"} language={"python"} title={"survival_population.py"} />

<Prose>{"The complete fixed example below calls the three already taught modules, uses the exact recorded coefficient, and prints the crossing, residual and mixture states. Save it as "}<code>{"cox-proportionality-example.py"}</code>{" beside them and the earlier "}<code>{"cox_risk_moments.py"}</code>{"."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox-proportionality-example.py"} filename={"cox-proportionality-example.py"} language={"python"} title={"cox-proportionality-example.py"} />

<CodeBlock language={"output"}>{"{\"comparison_cumulative\": [0.0, 0.2, 0.6000000000000001, 1.0], \"comparison_hazard\": [0.05, 0.2, 0.2, 0.2], \"comparison_survival\": [1.0, 0.8187307530779818, 0.5488116360940264, 0.36787944117144233], \"later_crossing_time\": 6.0, \"reference_cumulative\": [0.0, 0.4, 0.6000000000000001, 0.8], \"reference_hazard\": [0.1, 0.1, 0.1, 0.1], \"reference_survival\": [1.0, 0.6703200460356393, 0.5488116360940264, 0.44932896411722156]}\n{\"event_times\": [1.0, 2.0, 2.5, 4.0], \"identity_time_score\": {\"degrees_of_freedom\": 1, \"efficient_information\": 1.7209044597032925, \"score\": 0.4649583382583635, \"statistic\": 0.12562362488923542, \"status\": \"defined\"}, \"observed_features\": [-1.0, 0.0, 1.0, 0.0], \"residual_sum\": -3.3306690738754696e-16, \"residuals\": [-0.7202610353014591, 0.0503310135240328, 1.0634418270652986, -0.39351180528787255], \"weighted_means\": [-0.27973896469854087, -0.0503310135240328, -0.06344182706529855, 0.39351180528787255]}\n{\"comparison_hazard\": [0.125, 0.09812319512369107, 0.05711388097663502], \"comparison_weights\": [[0.5, 0.5], [0.679178699175393, 0.320821300824607], [0.9525741268224333, 0.04742587317756678]], \"marginal_hazard_ratio\": [0.5, 0.6341671355735604, 0.5669333720146131], \"reference_hazard\": [0.25, 0.15472765714190692, 0.10074178694699043], \"reference_weights\": [[0.5, 0.5], [0.8175744761936437, 0.18242552380635635], [0.9975273768433651, 0.002472623156634775]], \"times\": [0, 5, 20]}"}</CodeBlock>

<Prose>{"The first record separates the rate change at4 from the survival crossing at6. The second lists each event's observed feature, weighted mean, signed residual and identity-time score. The third follows type proportions from the starting population to the survivors at days0,5 and20. Each calculation keeps its named inputs, so you can trace which part of the model produced the change."}</Prose>

<H3>{"What should change when this model assumption is inadequate?"}</H3>

<Prose>{"Change the part of the model whose meaning is wrong, rather than choosing a repair from a p-value alone."}</Prose>

<NonproportionalRemediesFigure />

<Prose>{"The first alternative in the picture gives a "}<strong>{"stratum"}</strong>{" its own baseline shape. A stratum is a declared group, such as a known pump construction type; each group has its own hazard clock shape while the included within-stratum coefficients can remain shared. Competitors are compared within their stratum. A stratifying label has no within-stratum variation, so this construction does not estimate its ordinary shared coefficient. Enough event information must remain within the groups."}</Prose>

<Prose>{"The second alternative retains the comparison question but permits a "}<strong>{"time interaction"}</strong>{", such as the βₖ+θg(t) direction we just derived. It allows the effect of a fixed feature to vary with the current event time. That differs from a covariate itself changing because maintenance occurs; section 14 separates the two. The third alternative changes the model's relation to event time: it stretches a subject's event-time clock by a positive factor a, so its survival at time t is the reference survival at t/a. This is the accelerated failure-time construction developed in section"}</Prose>

<ol start={12}><li>{"Each alternative makes a different scientific statement."}</li></ol>

<Prose>{"Also inspect an incorrect feature shape before interpreting every trend as a genuinely changing coefficient. A richer static neural Cox score can repair a nonlinear feature map, but with no time input it still has the same shared-hazard fixed-multiplier structure. It does not repair the known changing-ratio law in D31b just by being a neural network. Unmeasured type heterogeneity, dependent censoring and unsupported future follow-up also require assumptions or new observations; no optimizer option makes those identification problems disappear."}</Prose>

<Prose>{"For independently observed data, use a prespecified diagnostic question, inspect the effect's time pattern, assess functional form and support, and validate the proposed model against the eventual prediction or estimation task. A diagnostic on training events answers a model-checking question; it is not evidence that a revised model forecasts new subjects better. In section 11 we will separate ranking, horizon discrimination and probability error under the observation process before judging a model."}</Prose>

<Prose>{"As a local practice, change the known-rate example to reference 0.2 per day and comparison 0.1 before day 3, then 0.3 afterward. State separately when its rate becomes larger and when its accumulated survival crosses. The rate change is day 3; equating 0.2t with 0.1×3+0.3(t−3) gives the later crossing at day 6. This is the original changed exercise's law. Then explain why a constant nonlinear Cox score cannot express both relative rates for one fixed profile. The final practice will combine this reasoning with changed observations and independently implemented diagnostic inputs rather than ask you only to repeat a familiar figure."}</Prose>

<H2>{"11. Evaluate observable predictions"}</H2>

<Prose>{"Section 10 asked whether a model's description of failure was plausible. Now ask a different question: how well do its predictions work for new pumps? An apparently good ranking can coexist with poor probabilities. A small probability error can also be misleading if missing follow-up was treated as a known outcome. We will separate what a prediction promises from what an observation lets us check."}</Prose>

<H3>{"Can we tell which of two pumps failed first?"}</H3>

<Prose>{"A pair can assess a risk ranking only when its observed endpoints establish the needed order."}</Prose>

<ConcordancePairsFigure />

<Prose>{"For this evaluation question, use a deliberately small four-record fixture, named M1–M4. It is distinct from section 8's six-subject coefficient example: this fixture isolates pair eligibility and score credit. M1 fails at day 1 with risk score 3. M2 is censored at day 2 with score 2. M3 fails at day 2 with score 2. M4 fails at day 4 with score 0. A larger score means the model expects earlier failure risk; it is not a probability."}</Prose>

<Prose>{"Start with M1 and M2. M1's day-1 failure is observed; M2 is still followed past that time. Their order is known even though M2's eventual failure time is not. Score 3 exceeds score 2, giving this pair one unit of correct ordering credit. M2 versus M4 is different: losing M2's log at day 2 does not tell us whether it failed before or after M4's day-4 failure. That pair is not scored."}</Prose>

<Prose>{"The chosen metric convention also compares an observed failure with a censored record at the same recorded time. M3/M2 therefore contributes, with half credit because their scores are equal. Two simultaneous observed failures would not establish an earlier one and would not form such a pair. Recorded-time conventions matter: rounded physical times do not reveal an exact latent order. This is the convention implemented by the current scikit-survival concordance route, rather than a universal rule imposed on every survival paper."}</Prose>

<NeuralTable caption={"Can we tell which of two pumps failed first?"} headers={[<>{"Pair"}</>,<>{"Is the required order observable?"}</>,<>{"Score credit"}</>]} rows={[[<>{"M1/M2"}</>,<>{"M1 fails before M2's log ends"}</>,<>{"1"}</>],[<>{"M1/M3"}</>,<>{"M1 fails before M3"}</>,<>{"1"}</>],[<>{"M1/M4"}</>,<>{"M1 fails before M4"}</>,<>{"1"}</>],[<>{"M2/M3"}</>,<>{"Same-time failure/censor pair under this metric convention"}</>,<>{"0.5"}</>],[<>{"M2/M4"}</>,<>{"M2's earlier censoring leaves failure order unknown"}</>,<>{"Not scored"}</>],[<>{"M3/M4"}</>,<>{"M3 fails before M4"}</>,<>{"1"}</>]]} />

<Prose>{"There are five comparable pairs and 4.5 units of credit, so "}<strong>{"concordance"}</strong>{" is 4.5/5=0.9. Move M2's one risk-score control while its observation remains fixed. At score 1, all five comparable pairs agree with the ranking and concordance becomes 1. At score 3.5, M1/M2 and M3/M2 are wrong and the fraction becomes 3/5=0.6. The censoring records determine eligibility; the changed score determines credit. These are different mechanisms."}</Prose>

<Prose>{"Formally, let a comparable pair (i,j) put the observed earlier failure first. Its credit is 1 when sᵢ>sⱼ, 0 when sᵢ<sⱼ, and 1/2 for a score tie. The concordance estimate is the total credit divided by comparable-pair count. The code declares an absolute score tolerance: differences no larger than "}<code>{"tied_tol"}</code>{" count as ties. It does not modify the observations to create additional comparable pairs. Without any comparable pairs, the fraction is unavailable rather than zero or perfect."}</Prose>

<Prose>{"A strictly increasing score transformation preserves exact ordering, but a fixed numerical tolerance need not be preserved by rescaling the scores. A ranking score is consequently meaningful together with its orientation and tolerance. It says nothing yet about whether a reported 70% survival probability is accurate."}</Prose>

<h4>{"Count comparisons without constructing every pair"}</h4>

<Prose>{""}<strong>{"Deeper implementation:"}</strong>{" this counting tree preserves the pair decisions above while avoiding a quadratic pair list. On a first pass, continue to “Which outcome is known at a particular day?” and return here when implementing concordance."}</Prose>

<Prose>{"The tiny pair table is a useful explanation, but an n-by-n pair array is unnecessary for a large evaluation. We need counts below, near and above an event's score among eligible competitors, not the identities of every pair in the final scalar report."}</Prose>

<FenwickConcordanceFigure />

<Prose>{"Read the time pass from later to earlier. Add M4 first. At day 2, add the censored M2 before querying M3. M3's eligible pool now has M4 at score 0 and M2 at score 2: one lower score and one tie. Only after all failures at this time have been queried do they join the pool for earlier events. At day 1, M1 queries the three records already present. This order includes same-time censors without accidentally comparing same-time failures."}</Prose>

<Prose>{"The score-coordinate strip has unique ordered positions 0, 2 and 3. Each position stores how many eligible records have that score. A prefix count answers “how many are in the first k positions?” Subtracting two prefix counts gives the count within the event's tolerance interval. The count below that interval receives full credit; the count inside it receives half credit. Coordinate compression changes storage positions, not the actual score values or tolerance comparisons."}</Prose>

<Prose>{"The pictured "}<strong>{"Fenwick tree"}</strong>{" stores sums over selected contiguous ranges of those coordinates. In its one-based indexing, a positive index i covers the last "}<code>{"lowbit(i)"}</code>{" positions ending there. "}<code>{"lowbit(i)"}</code>{" is the largest power of two that divides i; for example, index 6 covers two positions, whereas index 4 covers four. The expression "}<code>{"i & -i"}</code>{" computes that quantity. A prefix query adds one covered range and moves to the preceding range by subtracting this quantity. An update moves to the larger ranges containing the changed coordinate by adding it. Each step changes a binary boundary, so at most logarithmically many ranges are visited."}</Prose>

<Prose>{"Sorting time groups and score coordinates costs O(n log n). The insertion and range queries have the same total order of work and O(n) additional state. The complete implementation appears after observation weights are introduced, because its weighted wrapper uses another idea we have not yet taught. The first counting mechanism remains exactly this one."}</Prose>

<H3>{"Which outcome is known at a particular day?"}</H3>

<Prose>{"A survival forecast concerns being event-free at a chosen horizon, not merely the order of observed failures."}</Prose>

<HorizonClassificationFigure />

<Prose>{"Keep M1–M4 and move a horizon line to day 3. M1 and M3 have already failed, so their event-free target is 0. M4 is still followed past day 3, so its target is 1. M2's log ended at day 2 without failure; its day-3 target is unknown. Do not turn that last record into either a failure or a survivor."}</Prose>

<Prose>{"Let Yᵢ be observed endpoint time and δᵢ its failure indicator, as introduced in section 2. For the current library-style horizon score, an observed failure with Yᵢ≤u is a "}<strong>{"case"}</strong>{" and contributes target 0. A record with Yᵢ>u is a "}<strong>{"control"}</strong>{" and contributes target 1. A censored record with Yᵢ≤u is not scored at that horizon. Here case/control describe an evaluation status, not a case-control sampling study."}</Prose>

<Prose>{"At an exact censor/horizon boundary, distinguish observation semantics from this strict scoring convention. Under our earlier closed observation convention δ=0 at C=u entails T>u; that endpoint alone can establish event-free status at u. Nevertheless, the current metric's control mask is Y>u and excludes it. The picture labels that row "}<strong>{"boundary excluded by this score"}</strong>{", rather than falsely saying the observation proves nothing. For continuous times this equality has zero probability; with discretized records its convention must be recorded and kept consistent."}</Prose>

<Prose>{"The horizon control changes the visible masks, not the underlying endpoints. At day 1.5 only M1 is an observed case, while all other records have later follow-up. At day 3, M2 is unscored. At day 4, M4 becomes a case rather than a control. A single horizon changes what we can assess, even when the risk ranking and observations have not changed."}</Prose>

<Prose>{"For a fully known target Zᵢ(u)=1{Tᵢ>u} and forecast Ŝᵢ(u), the squared probability error is {Zᵢ(u)−Ŝᵢ(u)}². A survival forecast of 0.6 has error 0.36 if the pump has failed and 0.16 if it is still running. This is the "}<strong>{"Brier loss"}</strong>{" for this binary horizon target. It consumes survival probabilities, with larger values meaning more likely to remain running. Our earlier risk score had the opposite direction and no probability scale."}</Prose>

<H3>{"How can partial follow-up recover a full-population probability error?"}</H3>

<Prose>{"Weight an observed contribution by how likely it was to be observable, under an explicitly justified censoring law."}</Prose>

<CensorWeightedLossFigure />

<Prose>{"To see the mechanism exactly, switch explicitly to a known probability law, rather than pretending the four observed endpoints reveal every missing lifetime. Lifetime T is day 2 with probability 0.4 and day 8 with probability 0.6. Independently, recording end C is day 3 or day 10 with equal probabilities. We assess event-free survival at day 5 and use the same forecast p=0.6 for every starting pump."}</Prose>

<Prose>{"Follow the tree's four paths. A day-2 lifetime is observed under either recording end: these two paths have mass 0.2 each and target 0. A day-8 lifetime with day-3 recording end is unscored at day 5: its path has mass 0.3. A day-8 lifetime with day-10 recording end has known day-5 target 1, also with mass 0.3. The drawing keeps a hidden lifetime separate from the recorded endpoint, so “not scored” cannot look like a third lifetime."}</Prose>

<Prose>{"The full-law error is 0.4×0.36+0.6×0.16=0.24. Simply average the observed targets instead: their probability mass is 0.7, and their weighted loss is 0.4×0.36+0.3×0.16=0.192. The complete-case average is therefore 0.192/0.7≈0.274286. It describes a selected set with too few long survivors. Calling the unknown path a failure gives 0.7×0.36+0.3×0.16=0.3, another different and biased quantity for this declared law."}</Prose>

<Prose>{"The short-lifetime contribution is always observed, so its observation probability is 1. The day-5 survivor contribution is observed with probability 0.5. Divide the observed long-survivor loss by 0.5: the tree's contribution becomes 0.3×0.16/0.5=0.096. Add the failure contribution 0.144 to get 0.24. No individual missing outcome was imputed. Averaging over the observation process restored the contribution that process sometimes hid."}</Prose>

<Prose>{"The general elementary identity is E[R L/q | target information]=L when R is an observation indicator with conditional chance q>0 and L is the fixed loss for that target information. The expectation of R is q, which cancels its inverse. This is "}<strong>{"inverse probability of censoring weighting"}</strong>{", or IPCW. The estimator divides by the number of starting evaluation subjects, not by the number of known outcomes or the sum of weights."}</Prose>

<Prose>{"Move the one forecast-probability control p. All tree masses and observation chances stay fixed; only the losses change. The full-law and exact known-G IPCW values both follow 0.4p²+0.6(1−p)². At p=0.2 that value is 0.4; at p=0.9 it is 0.33. The two biased alternatives follow their own visibly different formulas. This is a known-law expectation, not a finite-sample promise that two estimated errors will always be identical."}</Prose>

<H3>{"Where do the observation probabilities come from?"}</H3>

<Prose>{"The censoring process has its own survival curve; estimate it with its own endpoint ordering."}</Prose>

<ReverseKmFigure />

<Prose>{"Name G(u) the censor-survival quantity used in the chosen continuous-time metric convention. It describes remaining recording opportunity, not the pump's event-free survival S(u). Known-law weights came from the declared C distribution. For actual observations, a common marginal estimate is a "}<strong>{"reverse Kaplan–Meier"}</strong>{" curve: censoring endings act as its observed endpoints and genuine failures remove records from its observation roster."}</Prose>

<Prose>{"The picture uses a new four-record tie witness: one genuine failure and one censor at day 1, another genuine failure at day 3, and another censor at day 4. All four are at risk immediately before day 1. In the inspected reverse-KM convention, remove the genuine failure first. Three records remain in the censoring denominator; one is censored. The G step factor is 1−1/3=2/3. Merely exchanging the event flags in ordinary KM would use four and give 1−1/4=3/4. It is not the same operation at shared times."}</Prose>

<Prose>{"For a grouped endpoint time, let n be its incoming roster size, d genuine failures and c censors. The reverse step factor is 1−c/(n−d) when c>0. With no censors it contributes no new step. This convention estimates a right-continuous G curve. It is the quantity used by the current library route. Exact discrete laws need their event-observation and horizon-observation endpoint probabilities derived from their own declared inclusion rule; one should not silently replace G(u−), P(C≥u), and G(u)=P(C>u) at atoms. Our four-path horizon example avoids any lifetime/censor equality, so those event-side boundaries do not change its stated arithmetic."}</Prose>

<Prose>{"Save the module below as "}<code>{"survival_censoring.py"}</code>{". It sorts once, applies the grouped removal order, and exposes a right-continuous query within the recorded training follow-up. The query never allocates another training-length probability array. A zero returned G is a support failure for inverse weighting, not a fitted probability error of zero."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_censoring.py"} filename={"survival_censoring.py"} language={"python"} title={"survival_censoring.py"} />

<Prose>{"The common input checks used by the metric modules below are collected in "}<code>{"survival_metric_inputs.py"}</code>{". "}<code>{"observations"}</code>{" establishes the static first-event array contract; "}<code>{"vector"}</code>{" and "}<code>{"tolerance"}</code>{" check values already introduced for ranking. "}<code>{"positive_observation_probability"}</code>{" validates the supplied G object at the exact queried times. It refuses zero support instead of letting division manufacture an apparently valid answer."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_metric_inputs.py"} filename={"survival_metric_inputs.py"} language={"python"} title={"survival_metric_inputs.py"} />

<Prose>{"Estimate the censoring law on the declared training/calibration observations, then apply it to the evaluation set. The ordinary APIs later use a training array for this purpose. Predictions, tuning choices and final evaluation must still obey their own splits. Independent marginal censoring is a statistical assumption; this counting algorithm does not prove it."}</Prose>

<Prose>{"We can now write the two branches from the probability tree as one sample formula. For n starting evaluation subjects, let Ŝᵢ(u) be subject i's event-free forecast at horizon u and Ĝ the supported censoring estimate. The indicator 1{condition} is 1 when its condition holds and 0 otherwise. With the case/control convention already drawn in D35,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat B(u)=\\frac1n\\sum_{i=1}^{n}\n\\left[\n\\frac{1\\{\\delta_i=1,\\,Y_i\\le u\\}\\,\\widehat S_i(u)^2}{\\widehat G(Y_i)}\n+\\frac{1\\{Y_i>u\\}\\,[1-\\widehat S_i(u)]^2}{\\widehat G(u)}\n\\right]."}</MathBlock></div>

<Prose>{"The first term is the observed-failure branch: its target is 0, so its loss is Ŝᵢ(u)², restored by the chance of observing that failure. The second is the followed-beyond-horizon branch: its target is 1, so its loss is [1−Ŝᵢ(u)]², restored by the chance of reaching the horizon. Unscored records activate neither term but remain in n. In code, form the two masks before dividing; the notation does not authorize evaluating an inactive 0/0 expression. Positive support is required for the target contributions being estimated. The exact endpoint choice for G follows the declared observation convention, as the reverse-KM discussion explains."}</Prose>

<H3>{"What happens when the observation chance is tiny or differs by group?"}</H3>

<Prose>{"Rare observable contributions receive large weights, which recover an expectation while increasing uncertainty."}</Prose>

<ObservationSupportFigure />

<Prose>{"Return to the known day-2/day-8 law and p=0.6. This time change the chance r that recording continues to day 10. Recording ends at day 3 with chance 1−r, independently of lifetime. The survivor path that is actually observed has mass 0.6r. Its weighted loss is 0.16/r. Their product stays 0.096 for every positive r. The smaller path and larger contribution are the two parts that the picture changes together."}</Prose>

<Prose>{"The one chance control leaves the lifetime law and forecast fixed. At r=0.5 the observed survivor loss is multiplied by 2; at r=0.1 it is multiplied by 10. The expected total loss remains 0.24, but a finite evaluation set becomes more sensitive to whether rare survivors are actually observed. If Z is the per-starting-subject weighted loss in this tree, E[Z²]=0.4(0.36)²+0.6r(0.16/r)², and therefore"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{Var}(Z)=0.01536/r-0.00576."}</MathBlock></div>

<Prose>{"At r=0.5 this variance is 0.02496; at r=0.1 it is 0.14784. At r=0, no day-5 survivor contribution can be observed. The IPCW calculation is unavailable. We can still calculate the full error from this constructed law because it was explicitly given; observations alone would not recover the missing long-lifetime distribution without additional assumptions. Clipping large weights changes the expectation. It may be a justified bias–variance decision, but it is not an unbiased cure for zero support."}</Prose>

<ConditionalObservationFigure />

<Prose>{"Now inspect a different, explicitly labelled two-group law. Half the starting pumps are in group A and half in group B. In A, day-2 failure has probability 0.2 and day-5 survival probability 0.8; the chance of recording beyond day 5 is 0.2. In B, the respective probabilities are 0.8, 0.2 and 0.8. Lifetime and recording end are independent "}<strong>{"within each group"}</strong>{", but their pooled relationship is dependent because group changes both. Group is recorded at commissioning time."}</Prose>

<Prose>{"With forecast 0.6 for both groups, the full errors are 0.2 in A and 0.32 in B, averaging to 0.26. A pooled censor survival of 0.5 produces expected IPCW error 0.2312. It underweights the long survivors in A and overweights those in B. Separate correct conditional weights recover 0.26. The deeper program checks this exact law through 100 probability- mass occurrences: A has 10 short failures, 32 lost long records and 8 observable long records; B has 40, 2 and 8. These counts encode a finite law's exact proportions, not an invented field study."}</Prose>

<Prose>{"Write G(u|X) for the censor-survival law conditional on the relevant recorded features X. Conditional independent censoring, a suitable conditional estimator, and positive support in the target groups are needed for its interpretation. A marginal API does not acquire this contract just because we call its array “conditional.” The explicit conditional evaluator later takes one G(Yᵢ|Xᵢ) per subject and an n-by-q G(uⱼ|Xᵢ) matrix. It evaluates these supplied probabilities; it does not estimate or validate the censoring model."}</Prose>

<Prose>{"Fit that additional model on permitted training observations, or use out-of-fold nuisance estimates when the evaluation procedure calls for cross-fitting. Cross-fitting means each row receives an estimate from a fit that did not train on that row. It can reduce in-sample nuisance overfitting; it does not make a misspecified G correct or create support. Keep subject/group dependence and time ordering in those splits. For repeated measurements, resample independent subjects or clusters rather than pretending every row is a new independent pump."}</Prose>

<H3>{"Why does a censor-aware concordance use squared observation weights?"}</H3>

<Prose>{"Observing a pair's required order needs two subjects to remain observable up to the earlier failure."}</Prose>

<UnoPairWeightFigure />

<Prose>{"For an underlying ordered pair with Tᵢ<Tⱼ, we need i's failure to be observed and j's record to continue to that time. Under the appropriate independent marginal observation model and continuous-time convention, each opportunity has probability G(Tᵢ), so the pair's inclusion chance is G(Tᵢ)². Squaring compensates for two observation opportunities. It is not a rule to square every IPCW weight in every metric."}</Prose>

<Prose>{""}<strong>{"Uno-style concordance"}</strong>{" weights the earlier observed failure's credit and comparable-pair count by 1/G(Yᵢ)², then takes their ratio. Specify a truncation time τ within supported follow-up. The inspected tool uses the strict eligibility Yᵢ<τ for the earlier failure; the later competitor is not discarded merely because its endpoint is beyond τ. With censor atoms, shared times or conditional G, the pair inclusion law and scoring convention need their stated adaptation. Our implementation follows the declared library pair convention and marginal weights, not a universal conditional weighted-concordance solution."}</Prose>

<Prose>{"For an actual weighted witness, use separate training endpoints [1,1.5,3,4,5] with failure flags [true,false,true,false,true]. Its G is 1 at day 1, 3/4 at day 2 and 3/8 from day 4. Reuse M1–M4 risk scores and choose τ=4. M1's weight is 1 and M3's is (4/3)²=16/9. Their numerator is 3+1.5×16/9=51/9 and denominator 3+2×16/9=59/9, giving 51/59≈0.864407. M4's failure is at the truncation boundary and has no earlier-failure weight; it still acts as a later competitor."}</Prose>

<Prose>{"This fraction differs from unweighted 0.9 because the comparable events have different observation opportunities. A zero-support or empty weighted denominator remains unavailable. In general, a ratio of finite weighted sums is not exactly unbiased merely because its numerator and denominator have observation-corrected expectations; consistency and uncertainty require their assumptions and sufficient information."}</Prose>

<Prose>{"Now save the complete "}<code>{"survival_concordance.py"}</code>{". Its counting pass is the Fenwick construction already drawn; "}<code>{"event_weights"}</code>{" attaches one earlier-event weight to every comparison it generates. The IPCW wrapper queries only eligible earlier events, applies the squared weights and leaves the full later-competitor pool in place."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_concordance.py"} filename={"survival_concordance.py"} language={"python"} title={"survival_concordance.py"} />

<Prose>{"The raw concordant/discordant/tie counts describe all observable comparisons, while the numerator and denominator describe their weighted contribution. They need not sum to the weighted denominator. That distinction also explains the ordinary tool's returned count diagnostics at a finite τ."}</Prose>

<H3>{"Is good ordering over all times the same as useful discrimination by a deadline?"}</H3>

<Prose>{"At a deadline, compare observed cases with subjects known to remain event-free beyond that deadline."}</Prose>

<HorizonRocFigure />

<Prose>{"Return to the horizon masks from D35. "}<strong>{"Cumulative cases"}</strong>{" have an observed failure by u; "}<strong>{"dynamic controls"}</strong>{" have Y>u. Unknown or boundary-excluded records contribute to neither count. A threshold on the risk score calls high-score records positive. Moving it down the sorted score strip adds cases to sensitivity and controls to the false-positive rate."}</Prose>

<Prose>{"Each case's contribution is weighted by 1/G(Yᵢ). Divide cumulative case weight by total case weight to obtain sensitivity. Divide cumulative control count by total controls for the false-positive rate. Under the independent marginal convention, the common control observation factor at the chosen u cancels from the normalized control distribution. With conditional G that factor can differ by subject; this marginal ROC is not automatically the correct conditional estimator."}</Prose>

<Prose>{"The "}<strong>{"ROC curve"}</strong>{" plots sensitivity against false-positive rate across these thresholds. Its area, or AUC, measures this horizon-specific case/control discrimination. Start from (0,0), treat exact score ties as one threshold block, and integrate the segments. A tied case/control pair then receives half ordering credit in this usual area convention. No cases or no controls makes the area unavailable."}</Prose>

<Prose>{"For a visible nonperfect example, change only M4's risk score from 0 to 2.5. We make this change to expose a horizon mistake that the earlier perfect ordering hid. Keep u=2.5 and the training G from the Uno witness. M1 and M3 are cases with weights 1 and 4/3; M4 is the one control. M2 is unscored. The threshold first adds M1, reaching sensitivity 3/7 with false-positive rate 0. It then adds M4, moving false-positive rate to 1 while sensitivity stays 3/7. Finally M3 raises sensitivity to 1. The area is 3/7≈0.428571. At u=1.5, M1 alone is the case and all three other records have later follow-up; its score ranks first, giving area 1. The same risk vector can be useful at one deadline and poor at another."}</Prose>

<h4>{"A near-tie rule can change the threshold object"}</h4>

<NearTieBlocksFigure />

<Prose>{"Concordance's absolute pair comparison and the inspected library ROC's adjacent-score grouping are not identical for chains of near-ties. For scores 0, 0.75 and 1.5 with tolerance 1, adjacent gaps are each 0.75, so the threshold route joins all three into one block. The endpoints are 1.5 apart and would not be a pairwise score tie. Even a middle record with no horizon contribution can connect that sorted block. This is a numerical convention, not evidence that the latent risks are actually equal."}</Prose>

<Prose>{"Our horizon implementation reproduces that inspected adjacent-block construction. With exactly equal scores or well-separated scores the usual weighted pair interpretation is clearer. The changed three-record check has one low-score case, one high-score control and one unscored middle record. Its adjacent-block AUC is 0.5 with tolerance 1, and 0 with exact-only tolerance 0. Do not claim universal pairwise-tolerance parity for a different ROC implementation."}</Prose>

<H3>{"What does an error averaged over time actually average?"}</H3>

<Prose>{"The chosen integration interval and weighting rule are part of the result, not merely plot settings."}</Prose>

<IntegratedBrierFigure />

<Prose>{"A probability-error curve gives a Brier value at each named horizon. To summarize it, integrate over a declared interval and divide by that interval's length. The picture keeps the first grid node fixed while one upper-horizon control chooses the last included node. The average changes because it now covers a different prediction question."}</Prose>

<Prose>{"For an easy hand calculation, take nodes [2,4,8] days and Brier values [0.2,0.4,0.1]. The first trapezoid has width 2 and mean height 0.3, giving area 0.6. The second has width 4 and mean height 0.25, giving area 1. The "}<strong>{"integrated Brier score"}</strong>{", with uniform interval weighting, is (0.6+1)/(8−2)=0.266667. This averages over [2,8], not [0,8]; the first two days were not supplied. With only one grid node there is no positive-length integration interval."}</Prose>

<Prose>{"For nodes u₁<…<u_q and values Bⱼ, the trapezoidal approximation is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mathrm{IBS}_{[u_1,u_q]}=\n\\frac{\\sum_{j=1}^{q-1}(u_{j+1}-u_j)(B_j+B_{j+1})/2}{u_q-u_1}."}</MathBlock></div>

<Prose>{"This is the actual normalization used by the inspected library code. Its documentation's weight-function shorthand must not turn a nonzero- start grid into division by u_q. A sparse grid approximates the integral; choose resolution to resolve relevant changes and report the interval and observation support. It is not an exact continuous-area calculation just because the trapezoid arithmetic is exact."}</Prose>

<Prose>{"The library's mean AUC is a different summary. The inspected route weights supplied AUC values by estimated event-probability increments, using first weight 1−Ŝ(u₁) and later weights Ŝ(uⱼ₋₁)−Ŝ(uⱼ), then divides by 1−Ŝ(u_q). Thus the first weight includes failures before the first supplied node. It is not the uniform time mean above, nor an automatic mean conditional only on events between u₁ and u_q. For AUCs [1,0.4] and survival [0.75,0.5], weights are [0.25,0.25] and the mean is 0.7. A single-node call returns its one AUC. Our separate summary function names this event-mass convention explicitly."}</Prose>

<H3>{"Can a model rank well and still give the wrong probabilities?"}</H3>

<Prose>{"Calibration compares forecast probability with the event-free frequency for the corresponding forecasted group."}</Prose>

<ProbabilityErrorFigure />

<Prose>{"Return to the exact day-2/day-8 law from D36. Its day-5 survival probability is π=0.6. A forecast of 0.6 matches that population frequency; a forecast of 0.9 does not. Neither number becomes calibrated because its subject ranking is good. For a constant forecast p in this law, algebra gives"}</Prose>

<div className="neural-equation"><MathBlock>{"E[(Z-p)^2]=\\pi(1-\\pi)+(p-\\pi)^2\n=0.24+(p-0.6)^2."}</MathBlock></div>

<Prose>{"The first term is the remaining Bernoulli outcome variability when the probability is correct. The second is the error from the wrong constant probability. A correctly calibrated probabilistic forecast need not have zero realized Brier loss. Conversely, Brier is not exclusively a calibration measure: changing which groups receive distinct informative probabilities also changes the prediction problem and its error."}</Prose>

<Prose>{"For actual held-out data, compare mean forecast survival at the chosen horizon with an appropriate estimated survival within supported forecast groups. Simple group KM requires its censoring assumptions within those groups; an overall independent-censoring claim does not automatically justify every forecast-conditioned group. Appropriate conditional weighting or more explicit calibration methods may be needed. Group sizes, supported follow-up and uncertainty belong beside the comparison. Do not construct apparently precise calibration dots from very few events or manufacture a clinical dataset to decorate the plot."}</Prose>

<Prose>{"Use paired subject or cluster resampling when comparing two models on the same independent evaluation units; keep their predictions paired. If the target includes model-training variability, resampling must also repeat the corresponding training and nuisance-estimation procedure in its valid split. A fixed-forecast bootstrap answers a narrower question. Dependence, temporal validation and transport to a different population require their own design, not another scalar metric switch."}</Prose>

<h4>{"Implement the probability and horizon routes with explicit support"}</h4>

<Prose>{"All terms in "}<code>{"survival_probability_metrics.py"}</code>{" now have a taught home. "}<code>{"brier_grid"}</code>{" takes the n-by-q survival forecast matrix and obtains a positive G at contributing failures and each horizon. Event and control masks are disjoint; unknown rows contribute zero but remain part of the n starting subjects. It queries each contributing failure and horizon once, then uses O(nq) score work with O(n+q) additional state, excluding the supplied forecast matrix and the G object's query cost."}</Prose>

<Prose>{""}<code>{"conditional_brier_grid"}</code>{" exposes its different conditional inputs without silently substituting a marginal curve. "}<code>{"horizon_auc"}</code>{" sorts and merges the threshold blocks already drawn, costing O(n log n) per horizon and O(n) additional state; q independent calls cost O(qn log n). "}<code>{"integrated_brier"}</code>{" and "}<code>{"event_mass_auc_summary"}</code>{" compute the two distinct grid summaries. They neither estimate forecasts nor justify censoring assumptions. Save the complete module below."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_probability_metrics.py"} filename={"survival_probability_metrics.py"} language={"python"} title={"survival_probability_metrics.py"} />

<h4>{"Use ordinary libraries with the same named targets"}</h4>

<Prose>{"The complete "}<code>{"censor-aware-metrics.py"}</code>{" example below supplies training observations for censor estimation and separate M1–M4 evaluation observations. It calls both scratch and ordinary routes, without another predictive fit. Its probability forecasts are explicitly declared exponential laws with rates [0.3,0.2,0.2,0.1] per day, evaluated at [1.5,2.5,3.5] days. They are constructed forecasts, not newly validated pump predictions. The changed risk vector used for AUC is named separately."}</Prose>

<Prose>{"The scikit-survival concordance/AUC calls expect high-score earlier-risk orientation. The lifelines "}<code>{"concordance_index"}</code>{" helper expects the opposite time-score orientation, so the example passes negated risk. Its Brier and IBS calls to scikit-survival receive probabilities, not that negated score. The two structured arrays are created by "}<code>{"Surv.from_arrays"}</code>{": first failure flags, then durations. The training argument is not a permission to choose a horizon after seeing which one makes the final test result most attractive."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/censor-aware-metrics.py"} filename={"censor-aware-metrics.py"} language={"python"} title={"censor-aware-metrics.py"} />

<CodeBlock language={"output"}>{"{\"ordinary_concordance\": [0.9, 4.0, 0.0, 1.0, 1.0], \"ordinary_lifelines_negated_risk\": 0.9, \"ordinary_uno_tau4\": [0.8644067796610169, 4.0, 0.0, 1.0, 1.0], \"scratch_concordance\": {\"concordant\": 4, \"denominator\": 5.0, \"discordant\": 0, \"numerator\": 4.5, \"risk_ties\": 1, \"status\": \"defined\", \"time_ties\": 1, \"value\": 0.9}, \"scratch_uno_tau4\": {\"concordant\": 4, \"denominator\": 6.555555555555555, \"discordant\": 0, \"numerator\": 5.666666666666666, \"risk_ties\": 1, \"status\": \"defined\", \"time_ties\": 1, \"value\": 0.8644067796610169}, \"training_censor_probabilities\": [1.0, 0.75, 0.75, 0.375, 0.375], \"training_censor_times\": [1.0, 1.5, 3.0, 4.0, 5.0]}\n{\"horizons\": [1.5, 2.5, 3.5], \"ordinary_brier\": [0.152893300699411, 0.19471871828419612, 0.14188280316177518], \"ordinary_ibs\": 0.17105338510739462, \"scratch_brier\": [0.152893300699411, 0.19471871828419612, 0.14188280316177518], \"scratch_ibs\": 0.17105338510739462, \"survival_forecasts\": [[0.6376281516217733, 0.4723665527410147, 0.3499377491111553], [0.7408182206817179, 0.6065306597126334, 0.49658530379140947], [0.7408182206817179, 0.6065306597126334, 0.49658530379140947], [0.8607079764250578, 0.7788007830714049, 0.7046880897187134]]}\n{\"changed_auc_scores\": [3.0, 2.0, 2.0, 2.5], \"ordinary_auc\": [1.0, 0.4285714285714286, 0.4285714285714286], \"ordinary_event_mass_mean_auc\": 0.7142857142857143, \"scratch_auc\": [{\"case_mass\": 1.0, \"controls\": 3, \"false_positive_rates\": [0.0, 0.0, 0.3333333333333333, 1.0], \"status\": \"defined\", \"thresholds\": [3.0, 2.5, 2.0], \"true_positive_rates\": [0.0, 1.0, 1.0, 1.0], \"value\": 1.0}, {\"case_mass\": 2.333333333333333, \"controls\": 1, \"false_positive_rates\": [0.0, 0.0, 1.0, 1.0], \"status\": \"defined\", \"thresholds\": [3.0, 2.5, 2.0], \"true_positive_rates\": [0.0, 0.4285714285714286, 0.4285714285714286, 1.0], \"value\": 0.4285714285714286}, {\"case_mass\": 2.333333333333333, \"controls\": 1, \"false_positive_rates\": [0.0, 0.0, 1.0, 1.0], \"status\": \"defined\", \"thresholds\": [3.0, 2.5, 2.0], \"true_positive_rates\": [0.0, 0.4285714285714286, 0.4285714285714286, 1.0], \"value\": 0.4285714285714286}], \"scratch_event_mass_mean_auc\": 0.7142857142857143, \"survival_at_grid\": [0.75, 0.5000000000000001, 0.5000000000000001]}"}</CodeBlock>

<Prose>{"Read the first record's comparable counts separately from its weighted numerator and denominator. The second record retains every horizon and every probability, so the integrated interval is reproducible. The third retains ROC coordinates and the event-mass summary rather than only one convenient scalar. Scratch/library agreement on these supported examples checks implementation conventions; it does not prove independent censoring, population calibration or generalization."}</Prose>

<Prose>{"In the inspected library Brier code, zero estimated G can be replaced by infinity before division and yield a zero numerical contribution. Our code explicitly refuses unsupported positive-mass target states. An ordinary scalar returned in that boundary is not evidence that the missing contribution had zero error. The censoring curve also has a declared observation horizon; our query rejects extrapolation even in cases where a library may continue a last zero step."}</Prose>

<Prose>{"The complete pair/tree program follows. It keeps the six-pair table and the known-G probability tree visible. Its final three numbers correspond to the three different estimands taught above."}</Prose>

<Prose>{"Complete source — "}<code>{"known-observation-metric-example.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/known-observation-metric-example.py"} filename={"known-observation-metric-example.py"} language={"python"} title={"known-observation-metric-example.py"} />

<CodeBlock language={"output"}>{"(0, 1) credit: 1.0\n(0, 2) credit: 1.0\n(0, 3) credit: 1.0\n(1, 2) credit: 0.5\n(1, 3) credit: None\n(2, 3) credit: 1.0\nlibrary C, concordant, discordant, risk ties, time ties: (np.float64(0.9), np.int64(4), np.int64(0), np.int64(1), np.int64(1))\nfull / known-G IPCW: 0.24 0.24\ncomplete-case / censor-as-failure: 0.274286 0.3"}</CodeBlock>

<Prose>{"For local transfer, keep the known lifetime law but use forecast p=0.2 and recording continuation chance r=0.25. The full-law error is 0.4. The observed survivor contribution has mass 0.15 and weight 4, restoring its 0.6×0.8²=0.384 contribution; short failures add 0.4×0.2²=0.016. Explain why the complete-case average differs, then change the censor chance by group as in D38b and state which G contract is now required. As a ranking variation, put two failures at the same observed time and explain which comparisons disappear before changing any score."}</Prose>

<Prose>{"These evaluations let us identify which promise needs improvement: ordering, a particular deadline's discrimination, probability accuracy, or the observation/support assumptions. Section 12 will change a specific model construction when the shared fixed-multiplier model cannot make the needed promise, rather than choosing a family only because its training score looks good."}</Prose>

<H2>{"12. Choose a time model, tree or discrete hazard"}</H2>

<Prose>{"Section 11 separated different prediction promises. If a model misses one, change the assumption responsible for that failure. A new method's name is not itself a repair. Begin with a different way to describe a feature's effect: stretching the lifetime clock instead of multiplying its local hazard."}</Prose>

<H3>{"What would it mean to stretch the entire lifetime distribution?"}</H3>

<Prose>{"Keep the Weibull law from section 5 and compare corresponding points on two lifetime rulers."}</Prose>

<AcceleratedTimeFigure />

<Prose>{"The reference law has time scale λ=12 days and shape k=2. The comparison law is made by multiplying every reference lifetime by a positive number a. At a=2, a reference day-6 lifetime corresponds to day12 on the stretched ruler; reference day12 corresponds to day24. We are defining a relationship between distributions, not observing both potential lifetimes of one pump."}</Prose>

<Prose>{"A "}<strong>{"quantile"}</strong>{" is the time by which a named fraction has failed. The reference median is 12√log2≈9.990655 days. Stretching time by2 makes the median 19.981311 days. The quarter and three-quarter failure quantiles also double. The drawing connects those matching fractions, rather than connecting two unrelated pumps just because they occupy the same sorted position."}</Prose>

<Prose>{"The one time-multiplier control changes a, with reference λ and k fixed. At a=1 the distributions coincide. At a=.5 every failure quantile is halved. At a=2 the comparison survival at day12 is exp(−.25)≈.778801, while reference survival there is exp(−1)≈.367879. A bigger median does not mean every pump survives twice as long or that a particular maintenance action causes it."}</Prose>

<Prose>{"To derive the whole curve, denote the reference lifetime by T₀ and write Tₐ=aT₀ for this distributional construction. Then"}</Prose>

<div className="neural-equation"><MathBlock>{"S_a(t)=P(aT_0>t)=P(T_0>t/a)=S_0(t/a)."}</MathBlock></div>

<Prose>{"For a feature vector x and log-time coefficients γ, set a(x)=exp(xᵀγ). Taking logarithms gives logT=xᵀγ+logT₀. This is an "}<strong>{"accelerated failure time"}</strong>{", or AFT, model: features shift log lifetime, equivalently multiplying the original time scale. An intercept can specify baseline log scale. The name includes both acceleration a<1 and deceleration a>1. It is the time multiplier, not a hazard multiplier. We use γ for these coefficients because section 8's β had a different relative-hazard interpretation."}</Prose>

<Prose>{"The general hazard relation is hₐ(t)=h₀(t/a)/a. The shifted argument matters: we compare the reference law at a different age and account for the changed time unit. AFT does not generally make hₐ(t)/h₀(t) constant at the same age."}</Prose>

<Prose>{"For the fixed-shape Weibull law already taught, substituting t/a into H₀(t)=(t/λ)^k gives Hₐ(t)=a^(−k)H₀(t). Differentiation therefore gives the constant same-age hazard ratio a^(−k). At a=2,k=2 it is1/4. The same Weibull distributions can be represented both by time dilation and by proportional hazards, with β=−kγ. This is a parameter conversion, not proof that a physical aging or shock mechanism caused the feature association."}</Prose>

<Prose>{"The constant ratio depends on the shared shape. If the groups have shapes k₀ and k₁, their hazard ratio contains a factor t^(k₁−k₀), so it generally changes with age. The two laws also cease to share one multiplier for every quantile. Modelling shape with features may be useful, but it changes the simple AFT interpretation; naming the software class AFT does not restore it."}</Prose>

<Prose>{"Other log-lifetime noise laws give other AFT families. A normal log lifetime gives a lognormal law; a logistic log lifetime gives a log-logistic law. The former can have a hazard that rises then falls, and the latter has a polynomial tail rather than Weibull's exp(−power) tail. Log-logistic mean lifetime is finite only when its positive shape exceeds1. Choosing a tail law affects extrapolation beyond observed support; a successful optimizer does not establish that choice. A censor-aware held-out comparison and scientific plausibility must address the target horizons from section11."}</Prose>

<H3>{"How do censored records teach a time scale and a shape?"}</H3>

<Prose>{""}<strong>{"Deeper derivation:"}</strong>{" this branch differentiates the AFT likelihood and maps its parameters to ordinary tools. On a first pass, retain the time-stretch interpretation and inspect the fitted library example below before continuing to the tree's feature questions."}</Prose>

<Prose>{"Reuse the density-versus-tail distinction from section 6 before changing its parameters."}</Prose>

<AftObservationFigure />

<Prose>{"Start with the supplied reference λ12,k2, and an observation at day6. An exact failure contributes its density h(6)S(6); a censor contributes S(6). Here H(6)=.25 and h(6)=1/12 per day. Thus the failure's log contribution is log(1/12)−.25≈−2.734907, whereas the censored record contributes −.25. The density height has inverse-day units; the censored tail is dimensionless probability mass. Giving the two observations the same squared-error target would discard their different information."}</Prose>

<Prose>{"For subject i, let zᵢ be a row of the scale design matrix including an intercept when wanted, ηᵢ=zᵢᵀγ its log time scale, and ρ=logk the log shape. Positive k=expρ is therefore represented without a negative-shape proposal. Let bᵢ=k(logYᵢ−ηᵢ)=logHᵢ and Hᵢ=expbᵢ. The observed log likelihood is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\ell(\\gamma,\\rho)=\\sum_i\\left[\n\\delta_i\\{\\rho-\\log Y_i+b_i\\}-H_i\\right]."}</MathBlock></div>

<Prose>{"Each bracket is exactly logh(Yᵢ)−Hᵢ for a failure and −Hᵢ for a censor. This is a full parametric observation likelihood, rather than section8's baseline-cancelling partial competition. It still requires the observation assumptions from section6. The local routine assumes static positive-time first-event records without entry or interval censoring; section14 will change those observation contributions explicitly."}</Prose>

<Prose>{"Differentiate η first. Increasing log scale reduces b by k, so the log-scale score for one record is k(Hᵢ−δᵢ). At the day6 reference state that is−1.5 for the failure and+.5 for the censor. The failure wants a shorter scale at this supplied state; the censored record supports a longer one. Multiply each scalar score by its feature row and sum to obtain the coefficient score. For log shape, differentiating k changes b by b itself. Its record score is δᵢ+bᵢ(δᵢ−Hᵢ). At day6 the failure gives approximately−.039721 and the censor+.346574. Scale and shape respond to different aspects of the same record."}</Prose>

<Prose>{"The coefficient score and fixed-shape information are consequently"}</Prose>

<div className="neural-equation"><MathBlock>{"U_\\gamma=k\\sum_i z_i(H_i-\\delta_i),\\qquad\nI_{\\gamma\\gamma}=k^2\\sum_i H_i z_i z_i^T."}</MathBlock></div>

<Prose>{"The second expression is a sum of positive weighted outer products. With shape fixed, a Newton proposal solves this information system for the scale coefficients. Jointly changing log shape adds cross-information and a shape-information entry; that entire matrix need not be positive definite at an arbitrary supplied state. Reuse section8's lesson about actual-objective acceptance and unresolved curvature, rather than accepting every full step. The complete core below returns these derivatives; returning a score does not claim that parameters have been fitted or that an optimum exists."}</Prose>

<Prose>{"In the code, form logH before exponentiating. This avoids computing a power of a potentially huge time/scale quotient. A proposed state outside its supported float range raises explicitly; it is not clipped into a different scientific likelihood. Its dense information work is O(np²), using weighted outer products without constructing n separate p-by-p matrices. "}<code>{"parameters"}</code>{" contains all scale coefficients followed by one log shape."}</Prose>

<Prose>{"Complete source — "}<code>{"weibull_aft_likelihood.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/weibull_aft_likelihood.py"} filename={"weibull_aft_likelihood.py"} language={"python"} title={"weibull_aft_likelihood.py"} />

<Prose>{"The quantile helper uses "}<strong>{"failure CDF probability"}</strong>{" p, giving Q(p)=λ[−log(1−p)]^(1/k). It retains the log quantile before exponentiation and uses "}<code>{"log1p"}</code>{" for small probabilities. Endpoints p0/p1 give0/infinity as the law's endpoints; those are not observed completion times. Lifelines' "}<code>{"predict_percentile(p=...)"}</code>{" instead uses a survival-probability threshold. At the median both conventions have p=.5; away from it convert them as failure fraction=1−survival fraction before comparing values."}</Prose>

<Prose>{"The next complete example reuses section5's "}<code>{"conditional_weibull"}</code>{" for its actual curves and applies the new quantile/likelihood core. Its final likelihood record uses section10's explicitly untied six-subject A–F fixture and supplied parameters [log12,log2,log2], with design columns intercept and the earlier feature x. No coefficient fit or new dataset is hidden here."}</Prose>

<Prose>{"Complete source — "}<code>{"weibull-aft-geometry.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/weibull-aft-geometry.py"} filename={"weibull-aft-geometry.py"} language={"python"} title={"weibull-aft-geometry.py"} />

<CodeBlock language={"output"}>{"{\"baseline_at_scale\": {\"failure_probability\": 0.6321205588285577, \"integrated_rate\": 1.0, \"log_survival\": -1.0, \"survival\": 0.36787944117144233}, \"hazard_ratio\": 0.25, \"quantiles\": [{\"baseline_day\": 6.436320255631819, \"failure_probability\": 0.25, \"stretched_day\": 12.87264051126364, \"time_ratio\": 2.0000000000000004}, {\"baseline_day\": 9.990655333892374, \"failure_probability\": 0.5, \"stretched_day\": 19.981310667784747, \"time_ratio\": 2.0}, {\"baseline_day\": 14.128920270185697, \"failure_probability\": 0.75, \"stretched_day\": 28.257840540371397, \"time_ratio\": 2.0000000000000004}], \"stretched_at_baseline_scale\": {\"failure_probability\": 0.22119921692859512, \"integrated_rate\": 0.25, \"log_survival\": -0.25, \"survival\": 0.7788007830714049}}\n{\"contributions\": [-2.918149535673942, -3.6112967162338876, -4.757520442706236, -0.25000000000000006, -3.001482869007276, -0.043402777777777755], \"information\": [[1.8836805555555556, -0.8940972222222224, 9.008243755583306], [-0.8940972222222224, 1.328125, -0.07468700135398387], [9.008243755583306, -0.07468700135398387, 15.292253966201892]], \"log_likelihood\": -14.58185234139912, \"parameter_order\": [\"log scale intercept\", \"feature log time multiplier\", \"log shape\"], \"parameters\": [2.4849066497880004, 0.6931471805599453, 0.6931471805599453], \"score\": [-7.058159722222222, -0.4470486111111112, -8.912746634515479]}"}</CodeBlock>

<Prose>{"For ordinary fitted use, the complete Rossi Weibull example follows. Its "}<code>{"lambda_"}</code>{" coefficients are log time-scale coefficients, and its "}<code>{"rho_"}</code>{" intercept is log shape. Exponentiating the "}<code>{"fin"}</code>{" scale coefficient gives a time ratio when shape is shared. Read the training concordance on the same footing as the section-10 training statistic, then use the held-out protocol in section 15."}</Prose>

<Prose>{"Complete source — "}<code>{"weibull-aft-library.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/weibull-aft-library.py"} filename={"weibull-aft-library.py"} language={"python"} title={"weibull-aft-library.py"} />

<CodeBlock language={"output"}>{"S at scale: 0.367879 failed: 0.632121\nbaseline / doubled median: 9.990655 19.981311\nhazard ratio: 0.25\nRossi shape / fin time ratio: 1.403688 1.312813\ntraining concordance: 0.640141\nfirst profile S(26): 0.880386\nIf shape also depends on features, one common time multiplier no longer describes the change."}</CodeBlock>

<Prose>{"The scale λ is the time with survival exp(−1)≈.367879: about63.2% have failed, not37%. The inspected current API contains an incorrect wording of that fraction; use its displayed law and this derivation. In R's Weibull "}<code>{"survreg"}</code>{" parameterization the intercept is logλ but its error scale is1/k, not k. Parameter names alone therefore do not make two fitted outputs comparable."}</Prose>

<Prose>{"For a changed-case check, set the same-shape time multiplier to.5. Each failure quantile halves and the implied hazard ratio becomes4. Then hold λ fixed but change shape: explain why this is no longer a pure clock stretch. Finally give a day6 running-at-end record the failure contribution by mistake; identify the extra log-density factor and say why that changes the likelihood."}</Prose>

<Prose>{"Time dilation changes an entire parametric lifetime law. The next alternative will split records by measured conditions and estimate each resulting leaf's survival from its actual observed endpoints, without prescribing one common Weibull shape across those leaves."}</Prose>

<H3>{"Could a few questions about the features choose an entire survival curve?"}</H3>

<Prose>{"AFT changed the shape of the lifetime model; a survival tree instead groups similar feature profiles and estimates a curve within each group."}</Prose>

<SurvivalTreeFigure />

<Prose>{"We switch from the six-pump likelihood example to eight constructed pumps P1–P8 so that both sides of one feature question have enough observations. The feature is a relative temperature index x, not a literal Celsius reading. The observation pair still means exactly what it did in section1: recorded duration Y in days and whether that endpoint was a failure. These are illustrations of a split, not data establishing a temperature intervention."}</Prose>

<NeuralTable caption={"Could a few questions about the features choose an entire survival curve?"} headers={[<>{"Pump"}</>,<>{"Temperature index x"}</>,<>{"Recorded endpoint Y, days"}</>,<>{"Endpoint"}</>]} rows={[[<>{"P1"}</>,<>{"0"}</>,<>{"8"}</>,<>{"Failure"}</>],[<>{"P2"}</>,<>{"1"}</>,<>{"9"}</>,<>{"Censor"}</>],[<>{"P3"}</>,<>{"2"}</>,<>{"7"}</>,<>{"Failure"}</>],[<>{"P4"}</>,<>{"3"}</>,<>{"6"}</>,<>{"Censor"}</>],[<>{"P5"}</>,<>{"4"}</>,<>{"4"}</>,<>{"Failure"}</>],[<>{"P6"}</>,<>{"5"}</>,<>{"3"}</>,<>{"Failure"}</>],[<>{"P7"}</>,<>{"6"}</>,<>{"2"}</>,<>{"Failure"}</>],[<>{"P8"}</>,<>{"7"}</>,<>{"5"}</>,<>{"Censor"}</>]]} />

<Prose>{"At the question x≤3.5, P1–P4 follow the labelled "}<strong>{"yes/left"}</strong>{" branch and P5–P8 follow "}<strong>{"no/right"}</strong>{". A new profile with x=1 follows left, regardless of its unknown lifetime. A profile with x=6 follows right. A "}<strong>{"leaf"}</strong>{" is the terminal group reached when no more questions are asked. It stores a distribution estimate, not a list of supposed known failure times. This is the saved-question routing taught in "}<a href={"/learn/path/full-curriculum/decision-trees-random-forests?module=classical-ml"}>{"Decision Trees & Random Forests"}</a>{", with a different response and a different split calculation."}</Prose>

<Prose>{"The two little curves repeat section3's "}<strong>{"Kaplan–Meier"}</strong>{" mechanism. In the right leaf, failures at days2,3,4 multiply survival by3/4,2/3,1/2; its curve reaches1/4 at day4 and remains there through the day5 censor. Thus the tree assigns S(4)=S(5)=.25 to the x=6 query. In the left leaf there is no failure before day7, so the x=1 query receives S(4)=S(5)=1. The day6 censor removes one at risk without making a survival drop. At day7 the three remaining become two; at day8 the two become one. S(8) is (2/3)(1/2)=1/3, not1/2. S=1 at day4 is a small sample's estimate, not a promise that this profile is incapable of failure."}</Prose>

<Prose>{"The shared day axis matters. The right leaf has no recorded follow-up after day5, while the left leaf reaches day9. A software tree can carry the right leaf's final step to a later training-grid day. That is a prediction rule; it does not create new observations in that leaf. The scratch result keeps the carried-forward value and an explicit local-support flag alongside it. At day8 the right value is still.25 but its support flag is0. Global queries past the original training cohort's last follow-up are rejected."}</Prose>

<H3>{"Which question should the tree ask first?"}</H3>

<Prose>{"Reuse section7's log-rank comparison on the two proposed groups, rather than treating censor endpoints as failure labels."}</Prose>

<SurvivalSplitFigure />

<Prose>{"The one cut control moves between the five legal gaps1.5,2.5,3.5,4.5,5.5. We require at least two training occurrences in each child, so.5 and6.5 are not offered. At3.5 the first failure is P7 at day2, in the right group. All eight pumps are still at risk. Four are on the left, so under equal hazards the expected number of left failures in this one-failure batch is1×4/8=.5. There are actually0. The left contribution is−.5."}</Prose>

<Prose>{"At day3 the right group has three remaining and left still has four. Expected left failures are4/7 and the contribution is−4/7. At day4 they are4/6, contributing−2/3. The day5 right censor then removes P8; the day6 left censor removes P4. At days7 and8 there is only the left group left at risk. Its failures equal their expected counts, and those times have no between-group comparison information."}</Prose>

<Prose>{"Each roster is taken immediately before failures; tied censors remain in that roster and leave afterwards. This is the event/censor ordering already taught in section3. It matters even when a numeric feature group has ties."}</Prose>

<Prose>{"Write nⱼ for the pooled number at risk at failure time tⱼ, nLⱼ for its left subset, dⱼ for pooled failures and dLⱼ for left failures. The total observed-minus-expected contrast and its conditional tied-batch variance are"}</Prose>

<div className="neural-equation"><MathBlock>{"U=\\sum_j\\left(d_{Lj}-d_j\\frac{n_{Lj}}{n_j}\\right),\\qquad\nV=\\sum_{j:n_j>1}d_j\\frac{n_{Lj}}{n_j}\n       \\left(1-\\frac{n_{Lj}}{n_j}\\right)\\frac{n_j-d_j}{n_j-1}."}</MathBlock></div>

<Prose>{"At 3.5, U=−.5−4/7−2/3=−1.738095; V=.25+12/49+2/9≈.717120. The split statistic U²/V≈4.212648 ignores the sign when comparing cuts: either side having more early failures may provide a useful separation. Its five values are 2.820987, 2.330127, 4.212648, 2.381651, .432270 in ascending cut order. Here 3.5 wins. This is selection on the training rows, not a prespecified hypothesis test: choosing the largest of many scores does not give a valid ordinary one-test p-value. Tune tree complexity on validation subjects and assess the chosen model with section 11's metrics."}</Prose>

<Prose>{"Moving the cut changes which physical observations enter the two rosters, which curve a query receives, and how much follow-up each leaf has. It does not change the observations' durations or failure/censor status. Follow the same P labels as they move, then explain the live sentence below the figure: “At cut…, left contains…occurrences; U=…, V=…, score=…; profile x=6 routes…with S(4)=….” The arithmetic and the drawing update together."}</Prose>

<Prose>{"If there is no legal gap, no observed failure, or zero comparison variance, the node remains a leaf. V=0 means this split cannot be scored with that contrast. It is neither a proof of equal population survival nor a license to divide by a tiny arbitrary substitute. Crossing curves can also make positive and negative log-rank contributions cancel; section7's limitation survives inside a tree. A large feature space creates many opportunities for spurious training separation."}</Prose>

<H3>{"Deeper: how can we search the cuts without rebuilding every roster?"}</H3>

<Prose>{"This deeper implementation makes cut search efficient. If your first goal is interpreting a split, keep the observed-minus-expected comparison above and continue at “How do repeated questions become a fitted survival tree?”; return here to implement the search."}</Prose>

<Prose>{"Moving one row across a sorted feature cut changes a prefix of failure-time risk counts, so keep that prefix's weighted sum."}</Prose>

<WeightedPrefixTreeFigure />

<Prose>{"The ordered event times are2,3,4,7,8. Their pooled at-risk counts are 8,7,6,3,2. P1 stops at day8, so moving it to the left adds one left-at-risk count to all five rosters. P2 stops at day9, so it also reaches all five. A pump censored at day3 would reach only the first two rosters, including the roster at its censor time. Its endpoint does not become an event."}</Prose>

<Prose>{"First separate a row's fixed contribution to U. Every failing row contributes its one observed failure; every row contributes expected fractions for the rosters it reaches. For row i, prepare"}</Prose>

<div className="neural-equation"><MathBlock>{"a_i=\\delta_i-\\sum_{j:t_j\\le Y_i}\\frac{d_j}{n_j}."}</MathBlock></div>

<Prose>{"When that row moves left, add aᵢ to U. This follows by exchanging the row and time sums in the earlier expression: nLⱼ is exactly the count of moved rows that reach tⱼ. Each row is moved once in a stable feature sort. Equal feature values move together before a candidate is evaluated, so the code never invents a threshold that divides indistinguishable feature values."}</Prose>

<Prose>{"For V, prepare cⱼ=dⱼ(nⱼ−dⱼ)/(nⱼ²(nⱼ−1)), with cⱼ=0 if nⱼ≤1. Then V=Σcⱼ nLⱼ(nⱼ−nLⱼ). Increasing one reached nLⱼ from l to l+1 changes its term by cⱼ(nⱼ−1−2l). Therefore the row's whole variance update is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\Delta V=\\sum_{j:t_j\\le Y_i}c_j(n_j-1)\n        -2\\sum_{j:t_j\\le Y_i}c_j n_{Lj}^{\\rm before}."}</MathBlock></div>

<Prose>{"The first prefix is fixed and prepared once. The second is the sum that must change. The drawing's leaves correspond to the five actual rosters. An internal branch stores the sum of its child weights and the weighted left counts. An update covering that whole branch adds its total weight once and records a postponed "}<strong>{"lazy"}</strong>{" count increment. The increment is pushed to its children only when a later operation needs to split that range. The code pads the storage to eight leaves for a regular binary layout; the three extra leaves have weight0 and represent no observations. The picture labels them as empty storage, keeping data and implementation separate."}</Prose>

<Prose>{"One prefix operation visits only the boundary branches, taking O(log e) work for e event times. A new feature starts with all left counts at0; it does not inherit another feature's partitions. "}<code>{"_WeightedPrefix.query_and_increment"}</code>{" returns the old weighted prefix before adding one. Reversing that order would subtract an extra2Σcⱼ in the variance update."}</Prose>

<Prose>{"The endpoint histogram avoids a separate n×e membership matrix. "}<code>{"stop_bin"}</code>{" counts the event-time rosters a row reaches; right-sided lookup includes failure/censor ties. A reverse cumulative histogram supplies the pooled risk counts. The sorted feature sweep keeps only that histogram, the prefix tree and the current score/variance. For m considered features its usual node work is O(n log n+m[n log n+e+n log e]) and extra working state O(n+e). This describes the supplied implementation, not every survival-tree engine."}</Prose>

<Prose>{"Accumulating variance by subtraction can leave roundoff near zero. When the computed V is small relative to the occurrence count, the code recomputes Σcⱼ nLⱼ(nⱼ−nLⱼ) from exact integer roster counts and nonnegative terms. It does not silently clip a materially negative estimate to zero. This fallback costs O(e); pathological repeated fallbacks can restore O(mne) work. Compiled library code and other data structures offer different tradeoffs. The transparent scratch implementation retains the designed faster path without claiming a universal optimum or hiding its numerical fallback."}</Prose>

<Prose>{"Save the complete split core as "}<code>{"survival_tree_splits.py"}</code>{". It imports the earlier "}<code>{"survival_metric_inputs.py"}</code>{" validator. "}<code>{"candidate_splits"}</code>{" yields scores one at a time instead of storing all candidate risk matrices; "}<code>{"best_split"}</code>{" keeps only the current maximum. A float64 midpoint that rounds to the upper endpoint is replaced with the lower distinct value so that the actual "}<code>{"≤threshold"}</code>{" partition remains the promised partition."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_tree_splits.py"} filename={"survival_tree_splits.py"} language={"python"} title={"survival_tree_splits.py"} />

<H3>{"How do repeated questions become a fitted survival tree?"}</H3>

<Prose>{"Apply the same local split rule within each child, then stop and retain its two step-curve estimates."}</Prose>

<Prose>{"The first connected drawing is a depth-one tree. A deeper tree repeats its question-and-route pattern inside each child. Root depth is0. "}<code>{"max_depth=1"}</code>{" allows its first question but no further child questions; "}<code>{"max_depth=0"}</code>{" keeps the full training cohort in one leaf. "}<code>{"min_leaf"}</code>{" counts training occurrences, not observed failures. A leaf with no failures has S=1 and H=0 over its recorded follow-up, so review its event information separately from its row count. "}<code>{"max_features"}</code>{" selects a new subset of possible feature questions at each internal node. A sampled subset with no legal informative cut ends a leaf in this scratch implementation."}</Prose>

<Prose>{"The code stores nodes with child indices and grows them using an explicit stack, avoiding a deep Python call stack. Once a leaf is reached it calls the already taught "}<code>{"kaplan_meier"}</code>{" and "}<code>{"nelson_aalen"}</code>{", retaining their actual endpoint groups and following the shared failure-before-censor convention. The two stored outputs are KM survival and NA cumulative hazard; section5 explained why the finite-sample KM curve is generally not exp(−NA). Querying follows saved feature questions; it does not rebuild groups or retrain a tree for each profile."}</Prose>

<H3>{"What changes when we train a forest of these trees?"}</H3>

<Prose>{"A bootstrap changes the training occurrences, while a sampled feature subset changes the available questions; a forest averages the resulting curves."}</Prose>

<BootstrapForestFigure />

<Prose>{"Keep the same eight observations. A "}<strong>{"bootstrap sample"}</strong>{" draws eight original pump IDs with replacement. In the first new member's bag, the zero-based IDs are[5,7,6,6,5,1,2,6], corresponding to P6,P8,P7,P7,P6,P2,P3,P7. P7 appears three times. These are three training occurrences of the same physical observation, not three independently observed new pumps. Draw the same ID/hue on all three occurrences; give the slots their own small position labels. Their repeated risk counts are part of bootstrap training."}</Prose>

<Prose>{"Train a tree on that bag. At each node choose a feature subset, then choose the best legal cut among those features. Repeating this for different bags and node subsets gives different trees whose errors may be less synchronized. On this one-feature illustration there is no alternative feature to sample; the bootstrap alone supplies variation. Adding trees reduces randomness of the ensemble average but does not repair informative censoring, leaking preprocessing, absent follow-up or a systematically poor feature set."}</Prose>

<Prose>{"For a new query x, tree b routes it to its own leaf and supplies S_b(t|x) and H_b(t|x). Every member is evaluated at the same requested times. Average the survival curves separately from the cumulative-hazard curves:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\bar S(t|x)=\\frac1B\\sum_{b=1}^{B}S_b(t|x),\\qquad\n\\bar H(t|x)=\\frac1B\\sum_{b=1}^{B}H_b(t|x)."}</MathBlock></div>

<H3>{"Why isn't exponentiating the average hazard the same forest prediction?"}</H3>

<Prose>{"Trace two small leaf cohorts before comparing their probability and cumulative-hazard averages."}</Prose>

<ForestAggregationFigure />

<Prose>{"We deliberately switch to two supplied leaf cohorts to isolate aggregation from fitted tree routing. Leaf A contains a failure at day2 and a censor at day4; leaf B contains two day4 censors. At day2 or later, A has KM S_A=.5 and NA H_A=.5; B has S_B=1 and H_B=0. Their mean survival is.75 and mean NA is.25, while exp(−.25)≈.778801. These are calculated states, not fitted forest performance. The two curve types represent the two estimators the code actually stores."}</Prose>

<Prose>{"There are two separate distinctions here. First, a finite KM product and NA sum are different already within one leaf. Second, even when individual curves satisfy S_b=exp(−H_b), a nonlinear exponential does not commute with averaging. To isolate that second distinction, supply exact distributions with S_A=.5,S_B=1 and H_A=log2,H_B=0 at one horizon. Mean S is again.75; exp(−mean H)=√.5≈.707107. The second pair is not relabelled as the first pair's NA estimates. A probability mixture and a transformed mean cumulative hazard answer different aggregation questions."}</Prose>

<Prose>{"In the live figure, set the number r of repeated day2 failure occurrences in A and move the requested day. A retains one day4 censor. For a day at or after2, its at-risk count is r+1, so S_A=1/(r+1), H_A=r/(r+1). At r=0 neither leaf has a failure and both averages remain S=1,H=0. At r=2, mean S=2/3 and mean H=1/3. Before day2 all these curves still have S=1,H=0. Thus the controls change identifiable observations rather than arbitrary drawn curve coefficients. The live sentence names the day, both members and their separate averages. The supplied-state lab does not rerun the later fitted forest or imply its two cohorts were chosen by that fit."}</Prose>

<H3>{"Can a training pump be evaluated by trees that did not see it?"}</H3>

<Prose>{"Use its original identity to find bootstrap bags that omitted every occurrence of that pump."}</Prose>

<OutOfBagFigure />

<Prose>{""}<strong>{"Out-of-bag"}</strong>{", or OOB, means the original subject was absent from a member's entire bootstrap bag. A repeated copy being absent from one slot is not enough: any occurrence in that bag means the member saw the subject. Average that subject's curves using only members that omitted it. The number of eligible members varies by subject and is returned explicitly."}</Prose>

<Prose>{"In the new seven-member example the counts for P1–P8 are5,1,2,3,1,2,1,0. P8 appears in every bag, so its OOB curve is unavailable. The program prints "}<code>{"null"}</code>{" there; it does not fill in S=1, H=0 or an in-bag prediction. The one-subject boundary is even clearer: every bootstrap draw necessarily includes that subject, so no OOB member can exist."}</Prose>

<Prose>{"OOB can help estimate performance without one fixed validation split, but it is not automatically an untouched test set. Repeatedly choosing settings against OOB can overfit that assessment. Row-wise OOB also fails to hold out an entire patient or machine if one physical subject has several dependent rows: split and resample the proper independent unit. Censor-aware scoring still needs the comparison and G-support rules from section11. The supplied core returns OOB curves and counts; it does not secretly compute or select a score from them."}</Prose>

<H3>{"Implement the saved tree, bootstrap forest and curve queries"}</H3>

<Prose>{"Reuse the earlier estimators instead of replacing the censor-aware leaf calculation with a library fit."}</Prose>

<Prose>{"Save "}<code>{"survival_forest_core.py"}</code>{" beside "}<code>{"survival_tree_splits.py"}</code>{", "}<code>{"survival_metric_inputs.py"}</code>{", "}<code>{"survival_estimators.py"}</code>{" and "}<code>{"survival_rates.py"}</code>{". Those files provide the exact mechanisms already taught. The query result holds survival, cumulative hazard, local-support fractions and member counts. For one tree the support fraction is0 or1; for a forest it is the proportion of member leaves whose recorded endpoint reaches that horizon. It describes the contributing leaves, not the population probability of being observed."}</Prose>

<Prose>{"The scratch contract is finite dense float64 features, static independent right-censored observations and seeded integer bootstrap occurrences. It does not implement missing-value routing, entry histories, external sample weights, pruning or every library stopping rule. Its "}<code>{"min_leaf"}</code>{" counts materialized bootstrap occurrences. Ordinary library implementations can represent multiplicities with weights and impose different raw-count child constraints. Its sorted feature tie preference and exact per-node subset also differ from implementations that permute ties or search extra features until a legal partition is found. Consequently identical seeds do not promise identical library forests."}</Prose>

<Prose>{"Fitting costs the sum of actual split-search work over all visited nodes and trees; there is no unconditional O(n log n) bound for an arbitrary forest. Stored leaf curves and occurrence IDs total O(n) per tree, plus its nodes; bags add O(Bn) integers and the forest keeps its O(np) training features for OOB queries. The prediction loop streams members, accumulating O(qh) output arrays for q queries at h horizons rather than stacking a B×q×h tensor. Routing is proportional to visited depth, and each leaf step lookup is binary search. Compilation, batch routing and histogram approximations are engineering alternatives, not fabricated benchmark improvements."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_forest_core.py"} filename={"survival_forest_core.py"} language={"python"} title={"survival_forest_core.py"} />

<Prose>{"The complete main below traces all five legal cuts and their risk steps, queries the fitted depth-one tree, then fits a seven-member scratch forest. Its seed41, depth2 and "}<code>{"min_leaf=2"}</code>{" are fixed before fitting. The returned bags make the subject/occurrence distinction inspectable. "}<code>{"survival_group_comparison.py"}</code>{" prints the explicit roster route next to the efficient split calculation."}</Prose>

<Prose>{"Save this main as "}<code>{"survival-tree-forest.py"}</code>{"; run "}<code>{"python survival-tree-forest.py"}</code>{" in the directory holding the listed files. The recorded output is from Python3.12.14 and NumPy2.3.5, with independent leaf comparisons against scikit-survival0.28.0. These identify the tested snapshot, not a promise about every later release."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival-tree-forest.py"} filename={"survival-tree-forest.py"} language={"python"} title={"survival-tree-forest.py"} />

<CodeBlock language={"output"}>{"{\n  \"legal_cuts\": [\n    {\n      \"threshold\": 1.5,\n      \"left\": 2,\n      \"right\": 6,\n      \"U\": -1.5357142857142856,\n      \"V\": 0.8360260770975056,\n      \"statistic\": 2.820986607899644\n    },\n    {\n      \"threshold\": 2.5,\n      \"left\": 3,\n      \"right\": 5,\n      \"U\": -1.3035714285714284,\n      \"V\": 0.7292729591836734,\n      \"statistic\": 2.330126803672934\n    },\n    {\n      \"threshold\": 3.5,\n      \"left\": 4,\n      \"right\": 4,\n      \"U\": -1.738095238095238,\n      \"V\": 0.7171201814058956,\n      \"statistic\": 4.212648221343872\n    },\n    {\n      \"threshold\": 4.5,\n      \"left\": 5,\n      \"right\": 3,\n      \"U\": -1.1726190476190474,\n      \"V\": 0.5773455215419501,\n      \"statistic\": 2.3816508131328624\n    },\n    {\n      \"threshold\": 5.5,\n      \"left\": 6,\n      \"right\": 2,\n      \"U\": -0.44047619047619024,\n      \"V\": 0.4488378684807256,\n      \"statistic\": 0.4322702873381745\n    }\n  ],\n  \"chosen_threshold\": 3.5,\n  \"logrank_steps\": [\n    {\n      \"day\": 2.0,\n      \"risk_left\": 4,\n      \"risk_right\": 4,\n      \"failures_left\": 0,\n      \"failures_right\": 1,\n      \"expected_left\": 0.5,\n      \"contribution\": -0.5,\n      \"variance\": 0.25\n    },\n    {\n      \"day\": 3.0,\n      \"risk_left\": 4,\n      \"risk_right\": 3,\n      \"failures_left\": 0,\n      \"failures_right\": 1,\n      \"expected_left\": 0.5714285714285714,\n      \"contribution\": -0.5714285714285714,\n      \"variance\": 0.24489795918367346\n    },\n    {\n      \"day\": 4.0,\n      \"risk_left\": 4,\n      \"risk_right\": 2,\n      \"failures_left\": 0,\n      \"failures_right\": 1,\n      \"expected_left\": 0.6666666666666666,\n      \"contribution\": -0.6666666666666666,\n      \"variance\": 0.22222222222222224\n    },\n    {\n      \"day\": 7.0,\n      \"risk_left\": 3,\n      \"risk_right\": 0,\n      \"failures_left\": 1,\n      \"failures_right\": 0,\n      \"expected_left\": 1.0,\n      \"contribution\": 0.0,\n      \"variance\": 0.0\n    },\n    {\n      \"day\": 8.0,\n      \"risk_left\": 2,\n      \"risk_right\": 0,\n      \"failures_left\": 1,\n      \"failures_right\": 0,\n      \"expected_left\": 1.0,\n      \"contribution\": 0.0,\n      \"variance\": 0.0\n    }\n  ],\n  \"query_temperatures\": [\n    1.0,\n    6.0\n  ],\n  \"tree_days\": [\n    4.0,\n    5.0,\n    8.0\n  ],\n  \"tree_survival\": [\n    [\n      1.0,\n      1.0,\n      0.33333333333333337\n    ],\n    [\n      0.25000000000000006,\n      0.25000000000000006,\n      0.25000000000000006\n    ]\n  ],\n  \"tree_cumulative_hazard\": [\n    [\n      0.0,\n      0.0,\n      0.8333333333333333\n    ],\n    [\n      1.0833333333333333,\n      1.0833333333333333,\n      1.0833333333333333\n    ]\n  ],\n  \"tree_local_support_fraction\": [\n    [\n      1.0,\n      1.0,\n      1.0\n    ],\n    [\n      1.0,\n      1.0,\n      0.0\n    ]\n  ],\n  \"supplied_member_S\": [\n    0.5,\n    1.0\n  ],\n  \"supplied_member_H\": [\n    0.5,\n    0.0\n  ],\n  \"mean_member_S\": 0.75,\n  \"exp_negative_mean_member_H\": 0.7788007830714049,\n  \"scratch_forest_members\": 7,\n  \"scratch_forest_days\": [\n    4.0,\n    5.0\n  ],\n  \"scratch_forest_survival\": [\n    [\n      1.0,\n      1.0\n    ],\n    [\n      0.25000000000000006,\n      0.25000000000000006\n    ]\n  ],\n  \"scratch_forest_hazard\": [\n    [\n      0.0,\n      0.0\n    ],\n    [\n      0.8928571428571429,\n      0.8928571428571429\n    ]\n  ],\n  \"scratch_forest_support_fraction\": [\n    [\n      1.0,\n      1.0\n    ],\n    [\n      1.0,\n      0.7142857142857143\n    ]\n  ],\n  \"bootstrap_subject_ids\": [\n    [\n      5,\n      7,\n      6,\n      6,\n      5,\n      1,\n      2,\n      6\n    ],\n    [\n      6,\n      1,\n      2,\n      7,\n      4,\n      6,\n      4,\n      0\n    ],\n    [\n      4,\n      4,\n      7,\n      5,\n      2,\n      6,\n      3,\n      2\n    ],\n    [\n      3,\n      1,\n      4,\n      5,\n      7,\n      4,\n      7,\n      7\n    ],\n    [\n      6,\n      6,\n      5,\n      1,\n      3,\n      2,\n      7,\n      4\n    ],\n    [\n      6,\n      5,\n      1,\n      0,\n      7,\n      4,\n      2,\n      1\n    ],\n    [\n      1,\n      7,\n      6,\n      1,\n      3,\n      1,\n      4,\n      7\n    ]\n  ],\n  \"oob_member_counts_by_original_subject\": [\n    5,\n    1,\n    2,\n    3,\n    1,\n    2,\n    1,\n    0\n  ],\n  \"oob_survival\": [\n    [\n      1.0,\n      1.0\n    ],\n    [\n      1.0,\n      1.0\n    ],\n    [\n      1.0,\n      1.0\n    ],\n    [\n      0.8333333333333334,\n      0.8333333333333334\n    ],\n    [\n      0.0,\n      0.0\n    ],\n    [\n      0.0,\n      0.0\n    ],\n    [\n      0.0,\n      0.0\n    ],\n    [\n      null,\n      null\n    ]\n  ],\n  \"new_predictive_tree_fits\": 8\n}"}</CodeBlock>

<Prose>{"At days4 and5 the new forest's x=1 survival is1 and x=6 survival is.25. That particular agreement with the depth-one tree does not mean every member is identical: its x=6 mean NA is.892857 instead of the single tree's1.083333, and only5/7 leaves still have recorded follow-up through day5. Inspect the actual returned curves/support rather than declaring an improvement from the word forest or from the number of members."}</Prose>

<H3>{"Use the ordinary library with the same response meaning"}</H3>

<Prose>{"The complete library example below uses a separate fit with its own defaults and seed; compare conventions before comparing numbers."}</Prose>

<Prose>{""}<code>{"Surv.from_arrays(event,time)"}</code>{" constructs the Boolean event/duration response. "}<code>{"SurvivalTree"}</code>{" selects censor-aware cuts and returns KM survival functions; "}<code>{"RandomSurvivalForest"}</code>{" fits bootstrap members and returns averaged curves. To inspect a whole curve, request "}<code>{"predict_survival_function"}</code>{" or "}<code>{"predict_cumulative_hazard_function"}</code>{" and evaluate on a declared supported day grid. The ordinary "}<code>{".predict()"}</code>{" is a library risk summary, not S(t). Keep its evaluation horizon and ranking purpose separate from probability calibration. Its scalar can be based on cumulative-hazard values across an event grid and does not have units of one failure probability."}</Prose>

<Prose>{"This current library casts numeric features to float32 and supports certain missing-value routing; the scratch contract does neither. "}<code>{"low_memory=True"}</code>{" does not supply the full curve methods. "}<code>{"max_features"}</code>{", depth, minimum child size, seeds and parallel jobs affect fitting/availability rather than creating a new survival estimand. Control them deliberately; transform/categorically encode using training-only decisions before fitting. For evaluation, keep whole subjects and preprocessing inside the training/validation protocol already drawn in section11."}</Prose>

<Prose>{"The library example uses the same eight observations but seed4 and20 forest members. Its rounded cut scores and depth-one leaf curves agree with the supported deterministic calculation above. Its forest survival values.775 and .5875 belong to this 20-member fit, whereas the scratch example has seven different saved bags. Those forest outputs need not coincide."}</Prose>

<Prose>{"Complete source — "}<code>{"survival-tree-forest-library.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival-tree-forest-library.py"} filename={"survival-tree-forest-library.py"} language={"python"} title={"survival-tree-forest-library.py"} />

<CodeBlock language={"output"}>{"threshold / log-rank chi-square: 2.5 2.330127\nthreshold / log-rank chi-square: 3.5 4.212648\nthreshold / log-rank chi-square: 4.5 2.381651\nchosen threshold: 3.5\nprofile 1.0 S(4), S(5): [1.0, 1.0]\nprofile 6.0 S(4), S(5): [0.25, 0.25]\nforest S(4) for both profiles: [np.float64(0.775), np.float64(0.5875)]\nThis tiny training illustration is not a held-out model comparison."}</CodeBlock>

<Prose>{"The next model changes the observation representation itself: split time into intervals and predict each interval's conditional event probability. Its product survival will look familiar, but a partially observed interval needs care before it can become a binary training row."}</Prose>

<H3>{"What if we ask one event question per interval?"}</H3>

<Prose>{"The forest returned a whole curve. We can build a curve another way: ask about each interval, but only among pumps that have reached its start."}</Prose>

<ConditionalForkFigure />

<Prose>{"Return to the pump lifetime question, now with a deliberately small three-interval model. The intervals end at days 2, 4 and 6. A pump that has not failed by day 0 has a .1 chance of failing in the first interval. Among those that reach day 2, the next interval's chance is .2. Among those that reach day 4, the last chance is .25. These are supplied model probabilities, not estimates from pumps A–H or the tree's eight-record fixture. We use them to see how interval questions become a lifetime distribution."}</Prose>

<Prose>{"Read the first fork. Incoming mass is 1: the whole starting population. The failure branch takes .1; the still-running branch keeps .9. Read the second fork using that remaining .9, rather than restarting with a new population. It contributes .9×.2=.18 to second-interval failures and sends .9×.8=.72 forward. The third contributes .72×.25=.18 to third-interval failures and leaves .72×.75=.54 still running at day 6. The three failure masses and the final surviving mass sum to 1: .1+.18+.18+.54=1."}</Prose>

<Prose>{"An "}<strong>{"interval hazard"}</strong>{", written q_j, is the probability of an event in interval j "}<strong>{"conditional on no earlier event"}</strong>{". Unlike the instantaneous rate h(t) in section 5, q_j is dimensionless and lies between 0 and 1. The incoming arrow is what makes that conditioning visible. If the j-th interval is (τ_{j−1},τ_j], then"}</Prose>

<Prose>{"q_j(x)=P(τ_{j−1}<T≤τ_j | T>τ_{j−1},x)."}</Prose>

<Prose>{"Here τ_j is the j-th upper day boundary and x is the supplied feature profile. Failure exactly on an upper boundary belongs to that interval. Let S_j(x)=P(T>τ_j | x), survival "}<strong>{"after"}</strong>{" interval j, with S_0=1. Multiplying the still-running branches gives"}</Prose>

<Prose>{"S_j(x)=∏_{k=1}^j[1−q_k(x)],"}</Prose>

<Prose>{"and the event mass in interval j is S_{j−1}(x)q_j(x). A source using survival "}<strong>{"before"}</strong>{" a discrete event opportunity may stop its product at j−1 instead. The pictures agree when their boundary conventions agree; do not compare products by subscripts alone."}</Prose>

<Prose>{"Move only the third interval's conditional probability in the figure. Its incoming .72 stays fixed because neither earlier question changed. At q_3=.5, third-interval event mass becomes .36 and S_3 becomes .36; S_1=.9 and S_2=.72 stay the same. At q_3=0 no mass leaves at that fork; at q_3=1 all .72 leaves. Those two boundaries are useful analytical states even though a finite logit or cloglog parameter does not attain exact 0 or 1. There is no predicted time after day 6 here: the remaining .54 is unresolved later mass, not an assertion that these pumps never fail."}</Prose>

<H3>{"Which interval questions did the observation actually answer?"}</H3>

<Prose>{"The probability forks describe a model; the observation lanes determine which of those questions can supply training labels."}</Prose>

<PersonPeriodObservationFigure />

<Prose>{"A pump observed to fail at day 5 supplies “no event” for intervals 1 and 2, then “event” for interval 3. Its labels are (0,0,1), and its model likelihood is .9×.8×.25=.18. This grouped likelihood uses the knowledge that the event belongs to (4,6]; it does not treat day 5 as a continuous density value. Section 6's exact-event density is a different observation likelihood."}</Prose>

<Prose>{"A second pump is still running when observation ends at day 4. It supplies (0,0), and its likelihood is .9×.8=.72. It does not supply a third row labelled 0: we do not know whether it survives through day 6. A third pump loses its logger at day 3. It has completed the first interval, but has answered only part of the second interval's question. The whole-interval representation retains the first row and leaves the partial interval unknown. Calling the partial interval “completed without failure” would claim survival through day 4 that was never observed."}</Prose>

<Prose>{"This is a declared "}<strong>{"grouped-observation"}</strong>{" representation. Under its observation assumptions, an event-ending subject contributes the earlier no-event factors followed by its event factor; a subject censored at a completed interval boundary contributes only its completed no-event factors. Ignorability of the observation mechanism still matters, as in section 2. When converting continuous follow-up to a grid, dropping the partial censor interval discards exposure information and invokes a coarsening convention; it does not prove that the monitoring process is ignorable. If the exact partial exposure is part of the intended likelihood, use a continuous-time or piecewise-rate observation model instead. Midpoint or half-interval credit is another declared approximation, not an observed full-interval zero."}</Prose>

<Prose>{"Give each retained row its subject ID, interval boundaries, event indicator and features available "}<strong>{"before"}</strong>{" the question is asked. For static features measured at commissioning, the same x can be carried into successive rows. A measurement obtained at day 5 cannot be copied backwards into the day-0 question. Time-updated features require interval-start information and a corresponding model; section 14 will draw that history explicitly."}</Prose>

<Prose>{"For the retained rows let d_ij be 1 for an observed event in subject i's interval j and 0 for a completed event-free interval. Conditional multiplication gives"}</Prose>

<Prose>{"L=∏_i ∏_{j in observed rows of i} q_ij^{d_ij}(1−q_ij)^{1−d_ij}."}</Prose>

<Prose>{"The corresponding negative log likelihood is"}</Prose>

<Prose>{"NLL=−Σ_i Σ_j[d_ij log q_ij+(1−d_ij)log(1−q_ij)]."}</Prose>

<Prose>{"These finite-grid probabilities describe the interval model. The likelihood looks like binary cross-entropy because each retained question has two answers; its derivation is a chain of conditional probabilities. Repeated interval rows still belong to one subject. Split subjects into training, validation and test "}<strong>{"before"}</strong>{" expansion, and keep all of a pump's rows together in evaluation, resampling and clustered uncertainty calculations. A binary-response fitting tool can compute this likelihood; expansion does not increase the independent sample size."}</Prose>

<H3>{"What should a feature multiply: interval odds or accumulated rate?"}</H3>

<Prose>{"The row likelihood is now fixed. The next choice is how a feature changes each row's conditional probability."}</Prose>

<OddsVersusRateFigure />

<Prose>{"Use one interval with baseline q_0=.2, so its still-running chance is .8. The first route converts probability to "}<strong>{"odds"}</strong>{", event chance divided by no-event chance. The baseline odds are .2/.8=.25. Doubling odds gives .5; converting back gives .5/(1+.5)=1/3≈.333333. “Twice the odds” did not produce probability .4."}</Prose>

<Prose>{"The logistic route writes η_j(x)=α_j+xᵀβ and"}</Prose>

<Prose>{"q_j(x)=1/[1+exp(−η_j(x))],"}</Prose>

<Prose>{"log[q_j(x)/(1−q_j(x))]=α_j+xᵀβ."}</Prose>

<Prose>{"The vector β contains the feature coefficients, α_j is an interval-specific baseline log odds, and η is their total scalar. Increasing xᵀβ by log2 doubles "}<strong>{"conditional interval odds"}</strong>{". There is one baseline term per interval; adding a separate intercept to all of them would duplicate a column. A shared β imposes the same odds multiplier across intervals. An interaction with interval changes that assumption and uses additional data/parameters."}</Prose>

<Prose>{"For the second route, recall section 5's accumulated rate: survival over an interval is exp(−A), where A is its integrated hazard. To obtain baseline survival .8, its accumulated rate must be A_0=−log(.8)≈.223144. Doubling this quantity gives .446287. The resulting interval failure probability is 1−exp(−.446287)=1−.8²=.36. The two pictures start from the same probability .2; they differ because they multiply different objects."}</Prose>

<Prose>{"If the continuous hazards satisfy h(t|x)=h_0(t)exp(xᵀβ) throughout the interval with this fixed feature profile, integration yields"}</Prose>

<Prose>{"A_j(x)=A_{0j}exp(xᵀβ), where A_{0j}=∫_{τ_{j−1}}^{τ_j}h_0(u)du."}</Prose>

<Prose>{"Substituting this area into the interval survival gives"}</Prose>

<Prose>{"q_j(x)=1−exp[−A_{0j}exp(xᵀβ)]."}</Prose>

<Prose>{"Now take the operations backwards. First 1−q recovers interval survival. Then −log(1−q) recovers its accumulated hazard. Finally taking log turns the multiplicative feature effect into addition:"}</Prose>

<Prose>{"log[−log(1−q_j(x))]=log A_{0j}+xᵀβ=α_j+xᵀβ."}</Prose>

<Prose>{"This is the "}<strong>{"complementary-log-log link"}</strong>{", often called cloglog. Its α_j is a "}<strong>{"log integrated baseline hazard"}</strong>{", not the logistic α_j and not necessarily the log of a constant per-day rate. Baseline hazard may vary inside the interval; the derivation required its integral and PH with the fixed feature effect, not a constant baseline. Features that change inside the interval need their own integrated/history treatment. The grouped model identifies the interval areas, not the unique within-interval hazard shape."}</Prose>

<Prose>{"When a baseline rate λ_j really is constant inside interval j, A_{0j}=λ_jΔ_j, with width Δ_j=τ_j−τ_{j−1}. Thus α_j=logλ_j+logΔ_j. A known log width can be an offset in a constant-rate parameterization. Width alone is not a universal offset for a freely changing baseline: it is the "}<strong>{"area"}</strong>{", not the clock label, that the probability uses. For exact partial exposure and a piecewise-constant rate, section 6's density/tail logic gives event count times log rate minus rate times exposure. That route can retain time spent in a partly observed interval; a whole-bin binary zero cannot."}</Prose>

<Prose>{"The logit and cloglog probabilities get close for rare interval events because q, q/(1−q) and −log(1−q) are close when q is small. They are not the same model at ordinary event probabilities. At q_0=.2 and multiplier 2 their outputs .333333 and .36 visibly differ. Refining a grid can make a rare-event approximation more appropriate, but also creates more baseline parameters and less information in each interval. Choose intervals from the observation protocol and training-only decisions, not by repeatedly inspecting test performance."}</Prose>

<H3>{"How do we calculate the likelihood without losing small probabilities?"}</H3>

<Prose>{"The model gives a probability, but its rounded display is not the value we should feed back into a logarithm."}</Prose>

<SmallProbabilityFigure />

<Prose>{"For logistic rows, softplus(v)=log(1+exp(v)). An observed event has loss softplus(−η), while a completed no-event row has loss softplus(η). "}<code>{"logaddexp(0,v)"}</code>{" evaluates this expression without first constructing a possibly overflowing exp(v). The derivative with respect to η is q−d. For a positive event at large η, calculate that derivative as −sigmoid(−η), preserving a tiny negative value even when q rounds to 1. Curvature is q(1−q), using independently stable complementary sigmoid factors."}</Prose>

<Prose>{"For cloglog, write a=exp(η), the interval's accumulated hazard. A completed no-event row has likelihood exp(−a), loss a, derivative a and curvature a. An event row has probability 1−exp(−a), so its loss is −log[1−exp(−a)]. "}<code>{"-expm1(-a)"}</code>{" evaluates the subtraction accurately when a is small. Differentiating that event loss gives"}</Prose>

<Prose>{"g=−a/[exp(a)−1]."}</Prose>

<Prose>{"Define r=a/[exp(a)−1], so g=−r. Apply the quotient rule to r, then multiply by a because da/dη=a:"}</Prose>

<Prose>{"dr/dη=r(1−a−r), therefore w=d²NLL/dη²=r(a+r−1)."}</Prose>

<Prose>{"For tiny a, subtracting nearly equal terms in a+r−1 is inaccurate. Expanding the expressions instead gives"}</Prose>

<Prose>{"event loss = −η+a/2−a²/24+a⁴/2880+O(a⁶),"}</Prose>

<Prose>{"r=1−a/2+a²/12−a⁴/720+O(a⁶),"}</Prose>

<Prose>{"w=a/2−a²/6+a⁴/180+O(a⁶)."}</Prose>

<Prose>{"The scratch code uses these series for a<10⁻⁴, where the omitted terms are smaller than ordinary float64 rounding for these results. In particular, an event at η=−1000 has finite loss near1000 and derivative near−1 even when exp(η) underflows to0. Plugging a rounded q=0 into log q would incorrectly return infinite loss."}</Prose>

<Prose>{"Both row losses are convex in their scalar predictor. For the cloglog event row, r>0. If a≥1 then a+r−1>0 directly. If 0<a<1, the function (1−a)exp(a) decreases from1 because its derivative is −a exp(a). Thus (1−a)exp(a)<1, which rearranges to a/(exp(a)−1)>1−a. This makes a+r−1 positive in the remaining range as well. Adding positive ridge supplies strict convexity in the stacked parameters, rather than assuming that an arbitrary nonlinear link must have it."}</Prose>

<Prose>{"For large a, use exp(−a) to calculate the event tail rather than overflowing exp(a). A high accumulated hazard makes an observed event unsurprising, so its loss and derivative approach0. The same high hazard makes a completed event-free interval surprising, with loss a. If that no-event contribution cannot be represented, the implementation reports overflow and the fitter shortens its proposal; it does not silently clip the likelihood into a different objective. "}<code>{"survival_from_predictors"}</code>{" accumulates log(1−q), then exponentiates for the displayed S_j. Keeping log survival is useful after an ordinary product underflows."}</Prose>

<H3>{"How can the scratch fit avoid a huge interval dummy matrix?"}</H3>

<Prose>{""}<strong>{"Deeper implementation:"}</strong>{" derive the block-structured Newton step here. The row likelihood and link meanings remain the first-pass core; you can continue at “How does the ordinary library express the same model?” and return for the block algebra."}</Prose>

<Prose>{"The stable row derivatives are enough to reuse section 8's Newton/backtracking idea; the new opportunity is the interval design's sparse structure."}</Prose>

<IntervalBlockSolverFigure />

<Prose>{"Every row selects exactly one α_j and adds xᵀβ. Store its interval index rather than allocating J zeros and one 1. The expander returns arrays of subject indices, interval indices and labels. Original subject IDs stay in the accompanying cohort table, so the indices can recover features without inventing new subjects."}</Prose>

<Prose>{"For m retained rows and p features, scatter each row derivative into its selected baseline coefficient and sum x times that derivative into the feature gradient. The baseline Hessian block D is diagonal: a row cannot select two different interval indicators. Its diagonal is the within-interval curvature sum. The cross block B has one row per interval, summing w times feature vectors; the feature block C sums wxxᵀ."}</Prose>

<Prose>{"Add the declared penalty λ(||α||²+||β||²)/2. It contributes λθ to the gradient and λ to both diagonal blocks. Here θ means the complete stacked parameter vector (α,β), and λ=.5 in the new tiny fitting witness. Penalizing the baseline as well as features is deliberate: it yields a finite strictly convex penalized objective, including intervals with all events or no events. It does not create observation support; the fitter refuses a completely unobserved training bin."}</Prose>

<Prose>{"Let the gradient be (g_α,g_β) and the Newton direction be (v_α,v_β). The two block equations are"}</Prose>

<Prose>{"Dv_α+Bv_β=g_α, and Bᵀv_α+Cv_β=g_β."}</Prose>

<Prose>{"The first gives v_α=D⁻¹(g_α−Bv_β). Put this into the second:"}</Prose>

<Prose>{"(C−BᵀD⁻¹B)v_β=g_β−BᵀD⁻¹g_α."}</Prose>

<Prose>{"Solve this p×p system, then recover v_α by elementwise division through D. The matrix in parentheses is the "}<strong>{"Schur complement"}</strong>{": the feature-only system left after eliminating the interval variables. No matrix inverse is explicitly formed. Backtracking proposes θ−s v and shortens s until the penalized objective decreases enough. Its trial evaluation needs the likelihood, not a freshly constructed Hessian. Without features, only the diagonal division remains."}</Prose>

<Prose>{"Expansion costs O(J+n logJ+m) for n subjects, including validation of J bin boundaries and their binary searches. With gathered row features, a Newton iteration costs O(mp²+Jp²+p³) arithmetic and O(mp+Jp+p²+J) storage, besides the source cohort. It avoids mJ dummy storage and a dense (J+p)³ solve. This is useful when the interval count is large and the feature count moderate; many features may instead call for a sparse or iterative optimizer. Positive ridge does not guarantee that extremely rescaled inputs have good floating-point conditioning. Inspect convergence, scale features using training data, and distinguish a failed solve from a statistically identified unpenalized MLE."}</Prose>

<Prose>{"Save the following core beside its example. The example imports it; its subject table and features are deliberately tiny so the observation and matrix correspondence can be inspected."}</Prose>

<Prose>{"Complete source — "}<code>{"discrete_survival.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/discrete_survival.py"} filename={"discrete_survival.py"} language={"python"} title={"discrete_survival.py"} />

<H3>{"How does the ordinary library express the same model?"}</H3>

<Prose>{"For a small matched witness, materialize the interval dummy columns and append the same row features, then compare supplied parameters before comparing fitted ones."}</Prose>

<Prose>{"The example uses six constructed records on boundaries 0,2,4,6, producing thirteen known binary rows. The third subject is censored at day3 and supplies only interval1. The source prints every "}<code>{"(subject,interval,event)"}</code>{" tuple. Its supplied parameter vector (−2,−1.5,−1,.4) is shared by scratch and library, so their losses and gradients can be compared at exactly the same state."}</Prose>

<Prose>{""}<code>{"statsmodels.GLM"}</code>{" takes the observed binary labels and the design rows. Choose "}<code>{"Binomial(link=Logit())"}</code>{" for interval odds or "}<code>{"Binomial(link=CLogLog())"}</code>{" for grouped PH. The interval columns already provide a baseline; do not add a duplicate intercept. "}<code>{"model.loglike(parameters)"}</code>{" and "}<code>{"model.score(parameters)"}</code>{" evaluate the supplied state. Their score maximizes log likelihood, so compare it with "}<strong>{"minus"}</strong>{" the scratch NLL gradient."}</Prose>

<Prose>{"An ordinary unpenalized fit uses "}<code>{"model.fit()"}</code>{", with IRLS by default; the model's no-event/separation and unsupported-bin limitations still apply. The complete new example instead matches the scratch's all-parameter ridge using "}<code>{"fit_regularized(L1_wt=0, alpha=λ/m)"}</code>{": this API scales the data loss by the number m of rows, whereas our core sums it. Passing λ directly would change the penalty strength. In the inspected statsmodels0.15.0 pure-ridge path, "}<code>{"opt_method='bfgs'"}</code>{" selects the optimizer, and its internal call does not forward the elastic-net "}<code>{"maxiter"}</code>{" option. Do not assume an option controls this path merely because it appears in the broader API signature."}</Prose>

<Prose>{"The actual fixed-state NLLs are6.173994788 for logit and6.029125730 for cloglog; scratch and library agree to the shown digits. Their maximum gradient differences are2.220×10⁻¹⁶ and3.331×10⁻¹⁶. The new scratch fits converge in4 and5 iterations. Library fitted parameters differ by at most2.322×10⁻⁵ and1.705×10⁻⁵ under its optimizer's stopping behavior; these are measured numerical differences, not exact parameter identity or comparative predictive performance."}</Prose>

<Prose>{"Complete source — "}<code>{"discrete-time-observations.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/discrete-time-observations.py"} filename={"discrete-time-observations.py"} language={"python"} title={"discrete-time-observations.py"} />

<CodeBlock language={"output"}>{"constructed subjects / binary rows: 6 13\nrows (subject, interval starting at 1, event): [(0, 1, 0), (0, 2, 0), (0, 3, 1), (1, 1, 0), (1, 2, 0), (2, 1, 0), (3, 1, 1), (4, 1, 0), (4, 2, 0), (4, 3, 1), (5, 1, 0), (5, 2, 0), (5, 3, 0)]\nD44 survival: [0.9, 0.72, 0.54]\nevent in interval3 / censor after interval2: 0.18 0.72\nD45 baseline / logit odds x2 / grouped PH x2: 0.2 0.333333 0.36\nlogit fixed-state scratch/library NLL: 6.173994788 6.173994788\nlogit fixed-state maximum gradient difference: 2.220e-16\nlogit new penalized scratch fit: True iterations 4 parameters [-1.140947, -1.53922, 0.3639, 0.203145]\nlogit matched penalized library parameter difference: 2.322e-05\ncloglog fixed-state scratch/library NLL: 6.02912573 6.02912573\ncloglog fixed-state maximum gradient difference: 3.331e-16\ncloglog new penalized scratch fit: True iterations 5 parameters [-1.321538, -1.69438, 0.030011, 0.26677]\ncloglog matched penalized library parameter difference: 1.705e-05"}</CodeBlock>

<Prose>{"The following complete logistic example instead uses a simulated 500-subject cohort with four discrete opportunities and a subject-ID split. Its full expansion contains1,267 rows; only rows from IDs below400 fit the model. "}<code>{"C=100"}</code>{" supplies weak library regularization. Its illustrative q=(.2,.3,.4) gives event mass.224 and completed-two-interval survival.56; the earlier three-interval illustration used q=(.1,.2,.25). These different inputs explain the different probabilities."}</Prose>

<Prose>{"Complete source — "}<code>{"discrete-person-period.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/discrete-person-period.py"} filename={"discrete-person-period.py"} language={"python"} title={"discrete-person-period.py"} />

<CodeBlock language={"output"}>{"subjects / person-period rows: 500 1267\nfitted interval intercepts and x coefficient: [-2.04201, -1.5721, -0.99493, -0.27399, 0.76369]\nx 0 hazards: [0.11486, 0.17192, 0.26994, 0.43193] survival: [0.88514, 0.73297, 0.53511, 0.30398]\nx 1 hazards: [0.21784, 0.30823, 0.44245, 0.62004] survival: [0.78216, 0.54108, 0.30168, 0.11463]\nevent in interval3 likelihood: 0.224\ncensored after interval2 likelihood: 0.56\nConditional likelihood factorization does not make one subject's rows independent subjects."}</CodeBlock>

<H3>{"Practice: change one conditional question without rewriting history"}</H3>

<Prose>{"For the three-interval illustration, set q_3=.4 and leave q_1=.1 and q_2=.2. Find third-interval event mass, survival at day6 and the likelihood of the pump censored at day4. Then decide whether a pump censored at day3 supplies a second completed zero. Explain which numbers can change and why."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Keep the incoming .72 fixed. The censored records contribute only information their observation lanes contain."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"Third-interval event mass is .72×.4=.288; survival at day6 is .72×.6=.432. The day4 censor likelihood remains .72 because the third question was never answered. Day3 censoring leaves the second interval partial, so it does not supply a known completed zero. Summing all failure masses plus final survival gives .1+.18+.288+.432=1. A tempting mistake is to make the later q_3 edit change the earlier .72, as though conditional probabilities were unconditional event masses."}</Prose>

</details>

<H3>{"Can we change the feature-to-score function without changing the Cox question?"}</H3>

<Prose>{""}<strong>{"Deeper neural branch:"}</strong>{" use this after you can trace a Cox risk denominator and a gradient through a network. It connects the complete reused differentiation engine to a survival head; it is not required for the preceding tree or interval models. The next first-pass section is section 13's physical competing-event picture."}</Prose>

<Prose>{"The interval models changed the event questions; this extension instead lets a small network combine features into one score while keeping the full Cox comparison from section 8."}</Prose>

<NeuralCoxAnatomyFigure />

<Prose>{"Start at the two measurements on the left: a temperature index and a vibration index recorded before follow-up. They are input numbers, not event probabilities. The three middle units each multiply the inputs by their own coefficients, add a bias, and apply a smooth transformation. The rightmost unit combines their three outputs into "}<strong>{"one scalar score"}</strong>{". Its output is neither a lifetime nor a probability. Section 8's exponential turns it into a positive relative-risk weight; the unchanged risk roster supplies the denominator at each observed failure."}</Prose>

<Prose>{"The new flexibility is the intermediate transformation. With only weighted sums and biases, stacking these units would still produce one weighted sum plus bias of the original inputs. Here use tanh, a smooth function that stays between −1 and 1. Its derivative is 1−tanh² of its input. It lets the feature-to-score relationship bend, but may transmit very small derivatives when its input has large magnitude. This is a deliberately small anatomy example, not a claim that three tanh units reproduce a published DeepSurv architecture. The linked lesson's "}<a href={"/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals#1-a-neuron-is-a-weighted-question"}>{"neuron anatomy"}</a>{" and "}<a href={"/learn/path/full-curriculum/perceptrons-neurons-activation-functions?module=deep-learning-fundamentals#3-hidden-neurons-change-what-the-model-can-express"}>{"hidden-layer construction"}</a>{" provide the fuller neural foundation; that later DL study is optional preparation for this deeper branch, not an unannounced prerequisite for the earlier survival core."}</Prose>

<Prose>{"Name the drawn calculation. For an n×p input matrix X, let W₁ have shape p×k, b₁ shape k, W₂ shape k×1 and b₂ shape 1. Here p=2 and k=3. Broadcasting b₁ means adding the same three bias values to every subject's row; it does not create a different bias per subject. The whole feature-to-score calculation is"}</Prose>

<Prose>{"H=tanh(XW₁+b₁), and s=HW₂+b₂."}</Prose>

<Prose>{"H is an n×k matrix of hidden-unit outputs and s an n×1 column of scores. Write the scalar output for profile x as g_θ(x), with θ collecting these network coefficients. The survival model becomes"}</Prose>

<Prose>{"h(t|x)=h₀(t)exp[g_θ(x)]."}</Prose>

<Prose>{"For two fixed profiles x_A and x_B, their hazard ratio is exp[g_θ(x_A)−g_θ(x_B)]. There is still no t in that ratio. "}<strong>{"A nonlinear feature function does not, by itself, remove proportional hazards."}</strong>{" It changes the shape of the dependence on features, not the assumption about how that dependence persists over time. This is the Cox neural extension used by DeepSurv; its original paper supplies a trained architecture and study beyond the small same-state calculation here. "}<a href={"https://pmc.ncbi.nlm.nih.gov/articles/PMC5828433/"}>{"DeepSurv methods"}</a>{"."}</Prose>

<Prose>{"Changing every score by the same constant leaves every risk share unchanged. Consequently the final shared scalar bias cannot be identified by partial likelihood alone: it cancels from numerator and denominator. When recovering a baseline later, its scale must agree with the chosen score convention. This is the same reference issue taught in section 9, not a new probability calibration supplied by the neural network."}</Prose>

<H3>{"What gradient should the Cox head send back to each score?"}</H3>

<Prose>{"The network needs a correction signal; the full risk comparison tells us how much each subject's current score contributed to the event loss."}</Prose>

<NeuralScoreGradientFigure />

<Prose>{"Switch explicitly to three constructed records so one event can be worked by hand. A fails at day 1; B's event-free observation ends at day 2 and C's at day 3. At A's event all three are eligible. Supply their scores as 0, log 2 and log 3, giving risk weights 1, 2 and 3. These are supplied values for the head calculation, not fitted network outputs. The full denominator is 6, so the share assigned to the observed event A is 1/6. Its negative log contribution is −log(1/6)=log 6≈1.791759."}</Prose>

<Prose>{"Read the correction arrows. A's derivative is its current share minus 1: 1/6−1=−5/6. B's is +2/6=+1/3 and C's is +3/6=+1/2. A negative derivative means that increasing A's score would decrease this event's loss. A positive derivative means increasing that competitor's score would increase it. A gradient-descent step therefore raises the event subject's score and lowers competing scores, subject to the way a shared network couples their changes."}</Prose>

<Prose>{"Let D_j be the observed-event subjects at distinct event time t_j, d_j their count, and R_j its full eligible risk set. Use the Breslow convention taught in section 9 when events tie. The summed negative partial log likelihood is"}</Prose>

<Prose>{"ℓ(s)=Σ_j[d_j log Σ_{k∈R_j}exp(s_k)−Σ_{i∈D_j}s_i]."}</Prose>

<Prose>{"For subject k, differentiate every denominator in which it participates and its own event numerator:"}</Prose>

<Prose>{"∂ℓ/∂s_k=Σ_{j:k∈R_j} d_j exp(s_k)/Σ_{r∈R_j}exp(s_r)−δ_k."}</Prose>

<Prose>{"Here δ_k is 1 for an observed event, 0 for censoring. A censored subject has no event numerator but can still influence earlier event denominators. Omitting it would change the learning question. The derivatives sum to zero because, at each event time, the d_j normalized denominator shares sum to d_j and exactly d_j event numerators are subtracted. This independently explains the unidentifiable common score shift."}</Prose>

<Prose>{"The live control changes "}<strong>{"B's score"}</strong>{", leaving the observation times, A's score and C's score fixed. At B's score 0 its weight is 1: the denominator is 5, the event share is 1/5, and the derivatives are (−.8,.2,.6). Raising B's score makes A's event less well explained under the current relative scores. It does not change which records are eligible or turn B's censored record into a known failure. All corrected shares and arrows update together, without asking the learner to predict first."}</Prose>

<Prose>{"For optimization we use the mean over observed events: ℓ divided by Σ_j d_j. Dividing by the number of subjects would instead change the gradient scale as the censoring proportion changes. Either normalization can be declared mathematically, but the scratch/library comparison must use the same one. With no observed events there is no mean event loss to optimize."}</Prose>

<H3>{"How can we calculate the full gradient without drawing every risk-set cell?"}</H3>

<Prose>{"The same records participate in nested comparisons; sorting their fixed stop times lets a scan reuse those comparisons instead of allocating an n×n eligibility matrix."}</Prose>

<CoxGradientScanFigure />

<Prose>{"For the three-record example, sorted stopping times are 1, 2 and 3. A "}<strong>{"suffix"}</strong>{" means the selected row and all later rows. Its risk totals are 6, 5 and 3, but only the first row contains an event. Its event-count-to-risk coefficient is 1/6; the other groups contribute 0. A "}<strong>{"prefix"}</strong>{" means all groups up through a subject's stop. Every subject here accumulates coefficient 1/6. Multiplying by that subject's weight gives (1/6,2/6,3/6), then subtracting its event indicator gives the three correction arrows above."}</Prose>

<Prose>{"Equal stop times require one extra detail: every subject in the group uses the suffix beginning at the "}<strong>{"first"}</strong>{" member of that group. Otherwise sort order would incorrectly remove a same-time censor or tied event from a denominator. The index records the sorted order, each subject's group, each group's starting row, event count and ordered event indicator. These observation arrays are fixed while network scores change, so sort them once."}</Prose>

<Prose>{"Exponentiating arbitrary scores and summing can overflow. Instead subtract a common maximum score, then form suffix sums in log space with "}<code>{"logaddexp.accumulate"}</code>{". At each group set"}</Prose>

<Prose>{"log c_j=log d_j−log risk_j when d_j>0,"}</Prose>

<Prose>{"and use −∞ when d_j=0, the log representation of a zero contribution. A second log-domain scan accumulates the c_j through each subject's group. Its exponentiated sum times the subject's centered risk weight produces the denominator contribution in the gradient. Finally subtract δ_k and restore original subject order. Centering is legitimate because the shared shift cancels; it does not change the scientific model."}</Prose>

<Prose>{"The first preparation costs O(n log n); each subsequent PH score-loss/gradient evaluation costs O(n) arithmetic and O(n) storage, besides the network computation. A deliberately simple explicit-roster reference below costs O(n²) and is used only for four subjects to verify the new head independently. It is not the recommended scalable implementation. The fast scan's assumptions are one event type, no delayed entry, no strata, no observation weights and one fixed score per subject. Section 14 changes eligibility for entry and history; reusing this suffix unchanged would be incorrect."}</Prose>

<Prose>{""}<code>{"cox_score_loss"}</code>{" calculates the statistical objective and its derivative with respect to the score array. "}<code>{"attach_cox_head"}</code>{" makes this calculation one new scalar operation in the existing teaching engine. It records the score tensor as its parent and sends the locally derived n×1 derivative back during the reverse pass. An upstream scalar derivative multiplies it by the chain rule; the engine then propagates through the matrix products and tanh operations already taught in "}<a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals#3-from-individual-numbers-to-tensor-gradients"}>{"Backpropagation's tensor-gradient section"}</a>{". We add the new Cox operation rather than pretending classification cross-entropy is already the right loss."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox_score_head.py"} filename={"cox_score_head.py"} language={"python"} title={"cox_score_head.py"} />

<H3>{"Can the reused scratch network and ordinary library take the same step?"}</H3>

<Prose>{"Match the complete starting state, loss normalization and update before interpreting a comparison as implementation agreement."}</Prose>

<Prose>{"Return to the two-feature/three-hidden-unit network. The executable example deliberately uses four small constructed profiles rather than a predictive dataset: features (0,1),(1,0),(1,1),(0,0), observed times 1,2,3,4 and events (1,0,1,0). A failed record at day 1 compares all four subjects; the day-3 event compares subjects 3 and 4. The purpose is to expose every matrix shape and correction, not to measure real-world predictive performance. Section 15 retains the actual dataset and report workflow."}</Prose>

<Prose>{"Download the "}<a href={"/learn-assets/backpropagation/teaching-autodiff.py"}>{"complete reused teaching engine"}</a>{" from Backpropagation, save "}<code>{"cox_score_head.py"}</code>{" and "}<code>{"neural-cox-bridge.py"}</code>{" beside it, then install NumPy and PyTorch in an isolated Python environment. The tested witness uses float64 on CPU and PyTorch 2.14.0+cpu; these are the recorded environment settings. Run:"}</Prose>

<CodeBlock language={"bash"}>{"python neural-cox-bridge.py --engine teaching-autodiff.py"}</CodeBlock>

<Prose>{"The script supplies every starting parameter; the imported engine provides tensor operations and the reverse pass. Its NumPy first-layer matrix is p×k, while "}<code>{"nn.Linear(p,k)"}</code>{" stores its weight as k×p; transpose at that boundary. The same applies to the last layer. Bias shapes remain k and 1. "}<code>{"nn.Tanh()"}</code>{" gives the same local transformation, and "}<code>{".double()"}</code>{" makes library parameters float64. "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.Linear.html"}>{"PyTorch Linear storage"}</a>{"."}</Prose>

<Prose>{"The PyTorch reference constructs each eligible roster directly with "}<code>{"time >= event_time"}</code>{", applies "}<code>{"torch.logsumexp"}</code>{", subtracts the observed event score and averages the two event terms. This intentionally different calculation lets library autograd derive the correction without calling our scratch head. Call "}<code>{".backward()"}</code>{" in each route. Only after every gradient has been calculated from the same old state, take θ_new=θ_old−.1∇ℓ. "}<code>{"torch.optim.SGD"}</code>{" performs that simultaneous update; it uses no momentum or weight decay in this witness. Updating one weight group and then recomputing another group's gradient would be a different procedure. "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.logsumexp.html"}>{"Log-sum-exp"}</a>{", "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.optim.SGD.html"}>{"SGD settings"}</a>{"."}</Prose>

<Prose>{"The supplied initial scores are approximately (.123731,.203919,.282446,.019934). Both routes give mean event loss .997625208909. The maximum parameter-gradient difference is 2.776×10⁻¹⁷; the recorded updated parameter arrays agree exactly at the compared float64 values. The next scratch mean loss is .988313262071 after "}<strong>{"one"}</strong>{" update. This establishes the declared head/shape/update correspondence for the witness, not trained-model convergence, superiority or a validated survival curve."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/neural-cox-bridge.py"} filename={"neural-cox-bridge.py"} language={"python"} title={"neural-cox-bridge.py"} />

<CodeBlock language={"output"}>{"{\n  \"subjects\": 4,\n  \"observed_events\": 2,\n  \"parameter_shapes\": [\n    [\n      2,\n      3\n    ],\n    [\n      3\n    ],\n    [\n      3,\n      1\n    ],\n    [\n      1\n    ]\n  ],\n  \"initial_scores\": [\n    0.12373119596953643,\n    0.20391882871611366,\n    0.28244635653609135,\n    0.019933598924991164\n  ],\n  \"initial_mean_event_loss\": 0.9976252089085759,\n  \"library_initial_loss\": 0.9976252089085759,\n  \"maximum_parameter_gradient_difference\": 2.7755575615628914e-17,\n  \"learning_rate\": 0.1,\n  \"maximum_updated_parameter_difference\": 0.0,\n  \"updated_mean_event_loss\": 0.9883132620706301,\n  \"simultaneous_updates\": 1\n}"}</CodeBlock>

<Prose>{"For a full ordinary training system, build train/validation/test "}<strong>{"subject"}</strong>{" splits, train-only scaling, an appropriate architecture, regularization, stopping decisions and censor-aware evaluation. PyTorch gives control of parameters and optimization; a survival package adds the time/observation conventions. Those choices are part of the report discipline, not automatically solved by this matched update. A genuine DeepSurv reproduction must additionally match its actual architecture and protocol; a neural layer imported by name is insufficient."}</Prose>

<H3>{"Why is a random neural batch not the full Cox risk set?"}</H3>

<Prose>{"The loss couples subjects through event-time denominators; a batch chosen for computational convenience may omit a competitor that the observation says belongs there."}</Prose>

<NeuralRiskBatchFigure />

<Prose>{"Keep the three-record weights (1,2,3). If a convenient batch includes A and C but leaves out B, it replaces A's denominator 6 with 4. Its event loss becomes log 4≈1.386294 instead of log 6≈1.791759, and its two derivatives become (−.75,.75) instead of the full derivatives for A and C (−5/6,.5). This is not the full likelihood in a smaller memory container: it is a different comparison. Comparing raw losses across different eligible-roster sizes is especially misleading."}</Prose>

<Prose>{"A "}<strong>{"sampled risk-set design"}</strong>{" deliberately selects controls among those eligible at each event and states its resulting objective. The event subject is included. With one sampled control, its loss can be written log[1+exp(s_control−s_event)], which is softplus of their score difference. That method can support scalable training, but it must be named and evaluated as the sampled method; it is not an exact full-risk calculation. Cox-MLP with case-control sampling and Cox-Time develop this route. The original paper distinguishes it from optimizing the full partial likelihood and states the scope of its classical consistency argument. "}<a href={"https://jmlr.csail.mit.edu/papers/volume20/18-424/18-424.pdf"}>{"Kvamme, Borgan and Scheel, method sections 3.2–3.4"}</a>{"."}</Prose>

<Prose>{"Even an unbiased estimate of a denominator does not automatically yield an unbiased log loss or score gradient. To see this without a large simulation, keep event weight 1 and choose B or C uniformly. Weight the sampled control by 2. The estimated denominators are then 1+2×2=5 or 1+2×3=7. Their average is 6, the correct full denominator. But their mean log is [log 5+log 7]/2=log√35≈1.777674, smaller than log 6. Their mean gradient is approximately (−.828571,.4,.428571), different from (−.833333,.333333,.5). The nonlinearity of the logarithm and normalization explains why a denominator guarantee cannot simply be carried into an optimizer guarantee. This constructed importance-weight witness is not a reproduction of the paper's unweighted sampled objective."}</Prose>

<Prose>{"For a static PH head, full-roster scans avoid the dense risk matrix already. They still require all scores for the indexed training cohort per exact loss evaluation. A GPU memory limit may call for carefully recomputed gradients, a declared approximation, a sampled-risk objective or a different observation likelihood. It does not authorize silently changing which subjects compete. Evaluation remains on a declared supported subject population with the censor-aware measures of section 11."}</Prose>

<H3>{"What must change if feature effects also change over time?"}</H3>

<Prose>{"The network above bends the feature relationship; a non-PH extension additionally evaluates that relationship at the event time shared by every competitor."}</Prose>

<TimeDependentNeuralScoreFigure />

<Prose>{"Write h(t|x)=h₀(t)exp[g_θ(t,x)]. At event time t_j, calculate g_θ(t_j,x_k) for "}<strong>{"every"}</strong>{" k in R_j. Giving each competitor its own observed stop time would instead compare scores evaluated at different times. Section 10's local time-score example already demonstrated this distinction with an explicit changing coefficient; the neural extension permits more flexible time-feature interactions, not a different risk-set definition."}</Prose>

<Prose>{"The Breslow-form baseline increment becomes"}</Prose>

<Prose>{"ΔH₀(t_j)=d_j / Σ_{k∈R_j}exp[g_θ(t_j,x_k)]."}</Prose>

<Prose>{"For a new profile, accumulate ΔH₀(t_j)exp[g_θ(t_j,x)] over event times up through t, then exponentiate its negative to obtain survival. One cannot take a final-time score outside the sum unless it is constant across those times. A time-only addition to every competitor score at t_j still cancels from that time's partial-likelihood comparison, so the baseline/reference decomposition remains an identification issue."}</Prose>

<Prose>{"Unlike the static score scan, a general time-score network may require evaluating a different function value for each event-time/competitor pair. A full method can therefore have quadratic pair work; deliberate sampled controls or a declared reduced evaluation grid address particular costs with particular tradeoffs. The new scratch head is intentionally PH and does not claim to implement those changing-time pairs. Section 10 locally implements the changing-effect core; a full neural Cox-Time training reproduction is a separately named advanced project boundary. "}<a href={"https://github.com/havakv/pycox/blob/master/pycox/models/cox_time.py"}>{"Cox-Time's actual time-specific baseline and prediction path"}</a>{"."}</Prose>

<Prose>{"There is another neural output choice: keep the interval questions of D44/D45 and let a network produce their conditional hazards. Or produce a joint distribution over time and event cause, as in DeepHit. These are different statistical heads, with different observation likelihoods. Section 13 draws the competing-event mass before discussing the joint cause/time route. Do not interchange a sigmoid hazard, a normalized time mass, a Cox score and a predicted survival curve merely because all can emerge from a neural model."}</Prose>

<H3>{"Practice: change the competitor, not the observation"}</H3>

<Prose>{"In the A/B/C head witness, change B's weight to 4 while keeping A=1, C=3 and the same event/censor observations. Calculate A's event share, negative log contribution and all three summed-loss score derivatives. Then explain whether inserting a tanh hidden layer can by itself make A's hazard ratio with C depend on time."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Use the full denominator first. The event subject subtracts 1 from its normalized share; eligible censored competitors do not. Look for t in the hazard-ratio expression."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The full denominator is 8. A's share is 1/8, its loss log 8≈2.079442, and the derivatives are (−7/8,1/2,3/8). They sum to zero. The extra hidden layer can change g(x_A)−g(x_C), but if its inputs are only the fixed profiles, that difference remains constant over time. Removing PH needs the correctly evaluated time-dependent mechanism, not simply more nonlinear units."}</Prose>

</details>

<Prose>{"We now have several ways to describe one event time: a shifted time distribution, leaves and forests, conditional interval probabilities, or relative scores with an estimated baseline. The next section changes a different part of the question: a pump can stop for more than one mutually exclusive cause. That requires accounting for probability mass across causes before choosing either ordinary or neural estimators."}</Prose>

<H2>{"13. Keep competing-event probabilities coherent"}</H2>

<H3>{"Which failure are we trying to count?"}</H3>

<Prose>{"Section 12 changed how we model time; now change the outcome question: a pump can stop because its motor fails or because its seal fails, and the first failure removes its opportunity to have the other first failure."}</Prose>

<CompetingAnatomyFigure />

<Prose>{"Follow the working pump on the left. Its motor drives the shaft; its seal keeps fluid around that shaft from leaking. For this first-event question, either component's failure ends the pump's event-free period. The upper branch records "}<strong>{"motor failed first"}</strong>{"; the lower branch records "}<strong>{"seal failed first"}</strong>{". The arrows describe possible first outcomes. They do not claim that the two components act independently, or that the pump can never be repaired. We stop counting this pump after its first failure. A repaired pump with a second episode needs a different state/history question, developed in section 14."}</Prose>

<Prose>{"The open mark beside the logger has a different job. "}<strong>{"Logging ended"}</strong>{" tells us that observation stopped without a recorded first failure. It supplies an endpoint for the observation ruler, not a third failure state. If we drew censoring as another physical fate, we would be assigning an outcome that we do not know."}</Prose>

<Prose>{"Previously the survival question was “has any failure happened yet?” The new question is “has the first failure happened by this time, and was it the motor?” Name the first-event time T as before. Let J name its cause: J=1 means motor first, J=2 means seal first. J belongs to an event; 0 is only the stored code for a censored observation. A censored record does not tell us its eventual J."}</Prose>

<Prose>{"Write F₁(t)=P(T≤t and J=1) and F₂(t)=P(T≤t and J=2). Each is a "}<strong>{"cumulative incidence function"}</strong>{": the probability that its named first event has occurred by t. These probabilities accumulate, while event-free survival S(t)=P(T>t) declines. Because the three possibilities are mutually exclusive and exhaustive at a fixed time,"}</Prose>

<Prose>{"S(t)+F₁(t)+F₂(t)=1."}</Prose>

<Prose>{"This is a conservation statement about probability, not an instruction to divide every observed count by the initial sample size. Missing future outcomes still need the censoring assumptions from section 2. Conditional independence of the component failure mechanisms is not required to define these observed first-event quantities. Independent right censoring is still needed for the unadjusted estimator below; feature-dependent censoring may need a conditional analysis instead."}</Prose>

<H3>{"How does one pool of remaining probability split between causes?"}</H3>

<Prose>{"Keep the pump story, but explicitly switch to a new six-pump constructed cohort so every first-cause allocation can be followed by hand."}</Prose>

<CompetingCohortFigure />

<Prose>{"Read the endpoint of each lifeline. P1 has a seal-first event at day 1; P2 a motor-first event at day 2. P3's logging ends at day 3. P4 has a seal-first event at day 4; P5 a motor-first event at day 5. P6's logging ends at day 6. Their stored statuses are therefore (2,1,0,2,1,0), paired with durations (1,2,3,4,5,6). These are new observations for the competing-event calculation, not reclassified endpoints from the earlier eight-pump cohort."}</Prose>

<Prose>{"Initially the full unit of probability is event-free. At day 1 all six pumps are still observed and event-free immediately before the endpoint. One seal event among six moves 1/6 of that mass into seal-first. Event-free mass becomes 5/6. At day 2 the risk roster has five pumps, with one motor event. The motor receives "}<strong>{"one fifth of the remaining 5/6"}</strong>{", or 1/6 of the original unit. Event-free mass becomes 2/3."}</Prose>

<Prose>{"At day 3 the logger ends for P3. There is no observed failure, so no estimated probability moves into either cause. Yet P3 will not be in the next observation roster. This separates the two things the picture tracks: "}<strong>{"the probability of still being event-free"}</strong>{" and "}<strong>{"which subjects remain observed to estimate the next conditional split"}</strong>{". After day 3 we cannot simply replace the estimated survival 2/3 with the fraction of the original sample still being logged."}</Prose>

<H3>{"Why must simultaneous causes use the same starting mass?"}</H3>

<Prose>{"The risk-set idea from section 3 still supplies each conditional fraction; the new rule is to distribute the same pre-event survivor mass to all the causes before reducing it."}</Prose>

<CompetingAllocationFigure />

<Prose>{"At day 4 the remaining observed risk roster is P4, P5 and P6. The incoming event-free mass is 2/3. One of those three pumps has a seal event, so the seal increment is (2/3)(1/3)=2/9. Adding it to the earlier seal mass gives 1/6+2/9=7/18. The surviving mass is (2/3)(2/3)=4/9. At day 5 the roster has P5 and P6. One motor event takes half of 4/9, or 2/9; motor-first incidence also becomes 7/18. The survivor remainder is 2/9. Day 6 is censor-only and creates no new event mass."}</Prose>

<NeuralTable caption={"Why must simultaneous causes use the same starting mass?"} headers={[<>{"Endpoint day"}</>,<>{"Observed event-free risk count"}</>,<>{"Motor events"}</>,<>{"Seal events"}</>,<>{"Censor endpoints"}</>,<>{"Event-free after"}</>,<>{"Motor-first by then"}</>,<>{"Seal-first by then"}</>]} rows={[[<>{"1"}</>,<>{"6"}</>,<>{"0"}</>,<>{"1"}</>,<>{"0"}</>,<>{"5/6"}</>,<>{"0"}</>,<>{"1/6"}</>],[<>{"2"}</>,<>{"5"}</>,<>{"1"}</>,<>{"0"}</>,<>{"0"}</>,<>{"2/3"}</>,<>{"1/6"}</>,<>{"1/6"}</>],[<>{"3"}</>,<>{"4"}</>,<>{"0"}</>,<>{"0"}</>,<>{"1"}</>,<>{"2/3"}</>,<>{"1/6"}</>,<>{"1/6"}</>],[<>{"4"}</>,<>{"3"}</>,<>{"0"}</>,<>{"1"}</>,<>{"0"}</>,<>{"4/9"}</>,<>{"1/6"}</>,<>{"7/18"}</>],[<>{"5"}</>,<>{"2"}</>,<>{"1"}</>,<>{"0"}</>,<>{"0"}</>,<>{"2/9"}</>,<>{"7/18"}</>,<>{"7/18"}</>],[<>{"6"}</>,<>{"1"}</>,<>{"0"}</>,<>{"0"}</>,<>{"1"}</>,<>{"2/9"}</>,<>{"7/18"}</>,<>{"7/18"}</>]]} />

<Prose>{"Move the endpoint-day control through days 2, 3 and 4. Day 3 changes who can inform the next estimate, while its mass strip stays unchanged. Day 4 moves mass only along the seal branch. The sentence beneath the drawing states the three current amounts and their sum. No future failure is invented for a logger that left."}</Prose>

<Prose>{"Name the operation just traced. At distinct endpoint time tⱼ let rⱼ be the event-free risk count before removals, d₁ⱼ the motor-event count and d₂ⱼ the seal-event count. Let Ŝ(tⱼ−) denote the estimated survival immediately before that endpoint. The left-limit minus sign means “before the jump,” not a negative time. For cause k,"}</Prose>

<Prose>{"ΔF̂ₖ(tⱼ)=Ŝ(tⱼ−) dₖⱼ/rⱼ,"}</Prose>

<Prose>{"F̂ₖ(tⱼ)=F̂ₖ(tⱼ−)+ΔF̂ₖ(tⱼ),"}</Prose>

<Prose>{"Ŝ(tⱼ)=Ŝ(tⱼ−)[1−(d₁ⱼ+d₂ⱼ)/rⱼ]."}</Prose>

<Prose>{"Start with Ŝ=1 and both F̂ values 0. Hats mark estimates from the observed cohort. Censoring does not appear as a failure count in these equations; it reduces the subsequent risk roster. Tied censor endpoints remain in rⱼ for that endpoint's events under the event-first convention already taught. This is the first-event version of the "}<strong>{"Aalen–Johansen estimator"}</strong>{"; the ordinary Kaplan–Meier product is recovered when there is just one absorbing failure cause. "}<a href={"https://cran.r-project.org/web/packages/survival/vignettes/compete.pdf"}>{"R survival’s multistate treatment"}</a>{"."}</Prose>

<SimultaneousCausesFigure />

<Prose>{"Now change the fixture to expose a failure that the untied six-pump cohort cannot show. Five pumps are at risk; at day 1 there is one motor event, one seal event and one censor endpoint. Both causes receive 1/5 of the same incoming mass 1, leaving 3/5. If we first took the motor's 1/5, then took one fifth of the already-reduced 4/5 for the seal, we would assign only 4/25 to the seal. The seal was not measured after the motor in a smaller population; they belong to the same endpoint group. That serial calculation falsely makes the answer depend on which cause the loop visits first. Updating the survivor by the correct total event fraction afterward would also leave a deficit of 1/25 in the total mass."}</Prose>

<Prose>{"The simultaneous rule conserves mass algebraically: the two added amounts total Ŝ(d₁+d₂)/r, exactly the amount removed from Ŝ. It extends to K causes by summing all K failure counts. Each subject still has at most one recorded first-cause label. If the source data reports both component failures at exactly the same timestamp for one pump, an explicit endpoint-definition or adjudication rule is required; counting that pump twice would not describe this first-event model."}</Prose>

<H3>{"How does the state picture become an efficient implementation?"}</H3>

<Prose>{"The branch drawing is a small state-transition calculation; grouping each endpoint once lets the implementation preserve that calculation without rescanning every subject for every event."}</Prose>

<CompetingTransitionFigure />

<Prose>{"Read a row of the matrix as “if I am in this state immediately before the endpoint, what fraction goes to each state afterward?” Its first row has one survivor remainder and two first-event fractions. A pump already counted as motor-first stays in that bookkeeping state; similarly for seal-first. These are absorbing states for the first-event question, not assertions that repairs are impossible. Multiplying the row of current probabilities (Ŝ,F̂₁,F̂₂) by this matrix reproduces the three updates above. Products of these endpoint matrices give the multistate form of Aalen–Johansen; section 14 will explain what changes when a state can be left again."}</Prose>

<Prose>{"The complete "}<code>{"competing_event_mass.py"}</code>{" source implements this first-event contract directly. "}<code>{"observation_rows"}</code>{" validates finite nonnegative elapsed times and integer cause codes, then sorts once. It takes "}<code>{"n_causes"}</code>{" explicitly, so a named cause with no observed event still has a zero output column. The loop counts all same-time causes before reading "}<code>{"before = survival"}</code>{". "}<code>{"increments"}</code>{" multiplies every count by that one value; "}<code>{"incidence"}</code>{" adds those amounts; only then is "}<code>{"survival"}</code>{" reduced by the total failures. Removing failures "}<strong>{"and"}</strong>{" censor endpoints changes "}<code>{"risk"}</code>{" for the next group."}</Prose>

<Prose>{""}<strong>{"Named excerpt: "}<code>{"aalen_johansen"}</code>{" from "}<code>{"competing_event_mass.py"}</code>{"; complete module below."}</strong>{""}</Prose>

<CodeBlock language={"python"}>{"def aalen_johansen(times, status, n_causes):\n    \"\"\"O(n log n + g K) time; O(n + g K) retained state for g endpoints.\"\"\"\n    rows = observation_rows(times, status, n_causes)\n    risk, survival = len(rows), 1.0\n    incidence = [0.0] * n_causes\n    points = []\n    for time, tied in groupby(rows, key=lambda row: row[0]):\n        counts = [0] * n_causes\n        censored = 0\n        for _, cause in tied:\n            if cause == 0:\n                censored += 1\n            else:\n                counts[cause - 1] += 1\n        before = survival\n        increments = tuple(before * count / risk for count in counts)\n        # Every cause receives mass from the SAME pre-event survival value.\n        incidence = [old + added for old, added in zip(incidence, increments)]\n        deaths = sum(counts)\n        survival = before * ((risk - deaths) / risk)\n        points.append(CompetingPoint(\n            time, risk, tuple(counts), censored, before, increments,\n            survival, tuple(incidence),\n        ))\n        risk -= deaths + censored\n    points = tuple(points)\n    return CompetingCurve(points, n_causes, tuple(point.time for point in points))"}</CodeBlock>

<Prose>{"For n observations, g distinct endpoints and K named causes, sorting costs O(n log n). The subsequent scan costs O(n+gK), with O(n+gK) retained data including every displayed cause at every endpoint. We do not allocate an n×g risk-membership matrix. A streaming variant can retain only the latest masses after sorted input; the full curve intentionally keeps the g×K output so earlier endpoints can be queried. "}<code>{"probability(t)"}</code>{" uses binary search, O(log g+K) including returning the K values. It returns the post-event value at an exact endpoint and refuses times after the last observed follow-up. A final censor leaves Ŝ=2/9 here; drawing that level forever would be unsupported extrapolation, as in section 3."}</Prose>

<Prose>{"The ordinary function "}<code>{"cumulative_incidence_competing_risks(status, times)"}</code>{" returns a time axis and a cause-by-time array. "}<strong>{"Its first row is the incidence of any event"}</strong>{", not survival and not motor incidence; its remaining rows correspond to cause codes 1 onward. Compare "}<code>{"library_mass[1:]"}</code>{" to the transposed scratch cause values, and row 0 to their sum. Our fixture has both consecutive cause codes present, as this API requires. The scratch contract additionally supports explicitly named absent causes; do not silently assume every library accepts that case. The complete matched program below combines this calculation with the next analytic comparison. "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.nonparametric.cumulative_incidence_competing_risks.html"}>{"scikit-survival API contract"}</a>{"."}</Prose>

<Prose>{"This example checks point estimates, not confidence intervals. The two cause curves share their input survivor pool and are statistically related. The earlier single-event Greenwood formula is not a complete covariance formula for the two incidences. Ordinary tools offer pointwise uncertainty with declared methods; simultaneous bands, covariate-adjusted observation and general multistate uncertainty need their corresponding derivations and assumptions. A zero observed motor count estimates zero in that column on this sample; it does not establish that the population's motor failure probability is zero."}</Prose>

<H3>{"Why can motor failures become less common without improving the motor?"}</H3>

<Prose>{"The shared pool explains a useful surprise: a stronger competing cause can reduce motor-first incidence even when the motor's own conditional failure rate stays exactly the same."}</Prose>

<CompetingRateFigure />

<Prose>{"Switch from the observed cohort to a "}<strong>{"declared analytic model"}</strong>{". The motor's constant cause-specific hazard is .1 per day; the seal's is .3 per day. These are supplied rates, not estimated from the six pumps. “Cause-specific” means that the rate applies among pumps that are still event-free immediately before that time. Both causes drain the same pool, so its total rate is .4 per day. After 5 days the event-free probability is exp(−.4×5)=exp(−2)≈.135335."}</Prose>

<Prose>{"At elapsed time u, the still-event-free probability is exp(−.4u). The motor's probability flow during a short interval du is that surviving amount times its rate: .1 exp(−.4u)du. Add these small flows from day 0 to day 5. Their sum is the chance of motor being the first event by day 5, not the chance of any motor failure in a hypothetical sequence after repair. The seal receives its own flow from the same curve."}</Prose>

<Prose>{"Name the general calculation. For cause-specific hazards hₖ(u), event-free survival S(u) and a continuous time model,"}</Prose>

<Prose>{"Fₖ(t)=∫₀ᵗ S(u)hₖ(u)du, with S(t)=exp[−∫₀ᵗ Σₖhₖ(u)du]."}</Prose>

<Prose>{"The continuous integral is the counterpart of D48's sum of pre-event survivor mass times each observed conditional event fraction. In a jump model the corresponding expression uses S(u−) times the hazard increment. Neither version replaces the shared S with a separate survivor curve for each cause."}</Prose>

<Prose>{"For constant rates h₁ and h₂, write H=h₁+h₂. If H>0,"}</Prose>

<Prose>{"F₁(t)=(h₁/H)[1−exp(−Ht)], F₂(t)=(h₂/H)[1−exp(−Ht)], and S(t)=exp(−Ht)."}</Prose>

<Prose>{"If H=0 all failure probabilities are zero and S remains 1. At the stated rates and horizon, the motor gets one quarter of the total event mass: F₁(5)≈.216166. The seal gets three quarters: F₂(5)≈.648499. Together with the survivor .135335, the unrounded values sum to 1. The rate ratio tells us the split of event mass in this constant-rate example; it is not a general constant incidence ratio for arbitrary time-varying hazards."}</Prose>

<Prose>{"The other bar holds the motor rate fixed but removes the seal rate mathematically. Its motor “net” value is 1−exp(−.1×5)≈.393469. Move the seal-rate control to 0: actual motor-first incidence meets that bar. Increase it: actual motor-first incidence declines. The motor rate has not improved; fewer pumps remain event-free long enough to have a motor-first event. The derivative with respect to the competitor rate is −h₁∫₀ᵗ u exp[−(h₁+h₂)u]du, strictly negative for h₁>0 and t>0. That sign follows from the decreasing opportunities visible in the drawing."}</Prose>

<Prose>{"Numerically, calculate lost mass with "}<code>{"-expm1(-H*t)"}</code>{" rather than "}<code>{"1-exp(-H*t)"}</code>{". "}<code>{"expm1(v)"}</code>{" returns exp(v)−1 without subtracting nearly equal rounded numbers when v is small. At rates 10⁻²⁰ and 3×10⁻²⁰ over 5 days, the motor mass is approximately 5×10⁻²⁰; subtraction from a rounded survivor near 1 can erase it. Calculate survivor separately with "}<code>{"exp(-H*t)"}</code>{" so a small but representable survivor at large Ht is not lost by subtracting an almost-one event mass. The zero-total branch handles H=0 without dividing by zero. This is stable arithmetic for the stated finite constant-rate model, not a performance benchmark."}</Prose>

<Prose>{""}<strong>{"Complete reusable source: "}<code>{"competing_event_mass.py"}</code>{"."}</strong>{""}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/competing_event_mass.py"} filename={"competing_event_mass.py"} language={"python"} title={"competing_event_mass.py"} />

<Prose>{""}<strong>{"Complete matched example: "}<code>{"competing-incidence.py"}</code>{"."}</strong>{""}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/competing-incidence.py"} filename={"competing-incidence.py"} language={"python"} title={"competing-incidence.py"} />

<Prose>{""}<strong>{"Recorded output of that example."}</strong>{""}</Prose>

<CodeBlock language={"output"}>{"day 1: risk=6; S=0.833333; motor=0.000000; seal=0.166667\nday 2: risk=5; S=0.666667; motor=0.166667; seal=0.166667\nday 3: risk=4; S=0.666667; motor=0.166667; seal=0.166667\nday 4: risk=3; S=0.444444; motor=0.166667; seal=0.388889\nday 5: risk=2; S=0.222222; motor=0.388889; seal=0.388889\nday 6: risk=1; S=0.222222; motor=0.388889; seal=0.388889\nendpoint max difference: 0.0\ncause mass max difference: 0.0\nany-event max difference: 2.220446049250313e-16\nconstant [event-free, motor, seal]: [0.135335 0.216166 0.648499]\nisolated motor net: 0.393469"}</CodeBlock>

<Prose>{"With the two source files in the same directory, run "}<code>{"python -B competing-incidence.py"}</code>{" using NumPy and scikit-survival. The first six output rows give the observed-cohort mass after each endpoint. The three maximum differences compare the endpoint axis, individual causes and any-event incidence with the ordinary estimator. The final two lines are the separate supplied-rate calculation and its isolated net counterpart. They are not another fit to the six-pump data. This same-state comparison was executed with Python 3.12.14, NumPy 2.3.5 and scikit-survival 0.28.0; small roundoff differences should be interpreted at floating-point tolerance, not as evidence that the algorithms fit different observations."}</Prose>

<H3>{"What question does treating the other cause as censored answer?"}</H3>

<Prose>{"The isolated bar shows why a familiar single-event calculation can answer the wrong probability question even while its algebra works as intended."}</Prose>

<NetVersusIncidenceFigure />

<Prose>{"Return explicitly to the observed six-pump cohort. Keep only motor events as failures and code seal events as censored. The motor-only conditional product uses 1−1/5 at day 2 and 1−1/2 at day 5, so its complement is 1−(4/5)(1/2)=3/5=.6. The shared first-event calculation gave motor incidence 7/18≈.388889. These differ because the motor-only product does not use the all-cause survivor probability to allocate motor event mass."}</Prose>

<Prose>{"Removing other causes from the "}<strong>{"physical event-free risk roster"}</strong>{" is nevertheless appropriate when estimating a cause-specific hazard, including a cause-specific Cox model. The error is calling one minus that cause's isolated survivor estimate the actual cumulative incidence. To recover incidence from cause-specific models, combine the cause's hazard with survival under "}<strong>{"all"}</strong>{" the causes."}</Prose>

<Prose>{"The isolated “net” calculation also does not, on its own, identify what a real intervention eliminating seal failures would do. Such an intervention could change the motor process, the population composition or common causes of both failures. Our analytic isolated bar stipulated an unchanged motor rate; it did not learn that intervention assumption from observed first events. Cause-specific hazards can be described without identifying a joint distribution of hypothetical latent component failure times. Inferring those latent times or an intervention's outcome needs additional assumptions that the observed first-event data do not supply."}</Prose>

<H3>{"Can exact fractions and ordinary estimators check the same cohort?"}</H3>

<Prose>{"The compact program below carries the six-pump calculation with exact fractions, then asks ordinary estimators the same questions. Its "}<code>{"first"}</code>{" and "}<code>{"second"}</code>{" amounts are motor-first and seal-first incidence. At every endpoint, the assertion checks that these amounts and event-free survival still total one. The library calls then check the final incidences and the motor-only net calculation; the final analytic rates remain a separate constructed example."}</Prose>

<Prose>{""}<strong>{"Complete library check: "}<code>{"competing-risk-library-check.py"}</code>{"."}</strong>{""}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/competing-risk-library-check.py"} filename={"competing-risk-library-check.py"} language={"python"} title={"competing-risk-library-check.py"} />

<Prose>{""}<strong>{"Recorded output of this program."}</strong>{""}</Prose>

<CodeBlock language={"output"}>{"day / event-free / cause1 / cause2: 1 5/6 0 1/6\nday / event-free / cause1 / cause2: 2 2/3 1/6 1/6\nday / event-free / cause1 / cause2: 3 2/3 1/6 1/6\nday / event-free / cause1 / cause2: 4 4/9 1/6 7/18\nday / event-free / cause1 / cause2: 5 2/9 7/18 7/18\nday / event-free / cause1 / cause2: 6 2/9 7/18 7/18\nlibrary final CIF: [0.388889, 0.388889]\nnaive one-minus-KM cause1: 0.6\nconstant-hazard actual CIF / net quantity: 0.216166 0.393469"}</CodeBlock>

<Prose>{"Save this file in an environment with NumPy, scikit-survival and lifelines. The recorded final library incidences are both .388889, matching the exact 7/18 fractions. The motor-only Kaplan–Meier complement is .6, matching the net calculation just traced. The final two numbers compare the separately supplied constant-rate first-event probability .216166 with its isolated net counterpart .393469. The cohort calculation and the supplied constant-rate law answer the separate questions traced above."}</Prose>

<Prose>{"For independent practice, change the tied five-pump example's day-1 motor count from one to two while keeping one seal event and no censor at that endpoint. Trace both allocations from the same starting mass: motor 2/5, seal 1/5, survivor 2/5. Then explain why swapping the order of cause columns cannot change any probability. This tests the rule itself rather than recalling the final six-pump fractions."}</Prose>

<Prose>{"We now have two distinct questions: the conditional event rate among pumps still event-free, and the probability of a particular first event by a horizon. The next picture will introduce a third, computational denominator used to model incidence directly. It must not be mistaken for the physical risk population."}</Prose>

<H3>{"Can we model motor-first incidence using a different denominator?"}</H3>

<Prose>{"The shared first-event calculation used the physical event-free population; a direct incidence model instead keeps track of everyone who has not had a motor-first event, including those whose first event was a seal failure."}</Prose>

<SubdistributionPopulationFigure />

<Prose>{"Read the two brackets. The first contains pumps with "}<strong>{"no first event yet"}</strong>{". Its rate is the motor's cause-specific hazard from D49. The second contains those same event-free pumps "}<strong>{"plus pumps whose first event was a seal failure"}</strong>{". Both groups have not had a motor-first event. The second group cannot go back in time and acquire a different first event; their inclusion describes a probability denominator, not a population of physically working pumps."}</Prose>

<Prose>{"Why use that denominator? At time t, the fraction not yet motor-first is 1−F₁(t)=S(t)+F₂(t). Motor-first probability increases at rate S(t)h₁(t). Divide that increase by the fraction not motor-first to define the "}<strong>{"subdistribution hazard"}</strong>{", here named γ₁:"}</Prose>

<Prose>{"γ₁(t)=F₁′(t)/[1−F₁(t)]=h₁(t)S(t)/[S(t)+F₂(t)]."}</Prose>

<Prose>{"The prime on F₁ means its derivative with respect to time in this continuous model. The multiplier S/(S+F₂) is the fraction of the enlarged denominator that remains physically event-free. It lies between 0 and 1 where the denominator is positive. With no prior competing events it is 1; as competing events accumulate it can reduce γ₁ even while h₁ is unchanged. This is another way to see D49's opportunity effect. "}<a href={"https://pmc.ncbi.nlm.nih.gov/articles/PMC7216972/"}>{"The cause-specific/subdistribution relation"}</a>{"."}</Prose>

<Prose>{"Write Γ₁(t)=∫₀ᵗγ₁(u)du. Solving d log(1−F₁)/dt=−γ₁ gives F₁(t)=1−exp[−Γ₁(t)]. The "}<strong>{"Fine–Gray model"}</strong>{" places a proportional-hazards assumption on γ₁(t|x)=γ₁₀(t)exp(xᵀβ), instead of on the physical cause-specific hazard. Hence F₁(t|x)=1−exp[−Γ₁₀(t)exp(xᵀβ)]. γ₁₀ is a baseline subdistribution rate; Γ₁₀ its cumulative amount; xᵀβ the feature score already taught in the Cox sections. They do not denote the baseline all-cause survival."}</Prose>

<Prose>{"A coefficient's exponent is a "}<strong>{"subdistribution hazard ratio"}</strong>{", not a constant incidence ratio. For example, doubling a profile's subdistribution hazard gives Fnew=1−(1−Fold)², not 2Fold. The same terminology discipline used for Cox relative hazards is needed here. Nor does proportional cause-specific hazards generally imply proportional subdistribution hazards: the fraction S/(S+F₂) can vary with time and features. At a new prediction landmark, conditioning on a pump still physically event-free also changes the question; a baseline Fine–Gray curve cannot silently supply that conditional forecast."}</Prose>

<H3>{"What should a competing pump contribute after its observation stops?"}</H3>

<Prose>{"The enlarged denominator is straightforward with complete observation, but a competing pump's later logger availability is usually unobserved, so its retained contribution needs an explicit observation model."}</Prose>

<RetainedCompetitorFigure />

<Prose>{"Switch to three constructed records for one transparent denominator. A has a motor-first event at day 2, B a seal-first event at day 1, and C is observed event-free until logging ends at day 3. At A's event the physical roster is {A,C}. The retained seal record B is in the computational lane. A subject with a past motor-first event would already have left both lanes; a past censored subject has no known first outcome and is not simply labelled seal-first."}</Prose>

<Prose>{"Supply a common continuous observation law G(u)=P(C>u)=2⁻ᵘ, with elapsed days measured from commissioning. This "}<strong>{"stipulated censoring law"}</strong>{" is separate from each record's observed status. Here G(1)=.5 and G(2)=.25. The ratio G(2)/G(1)=.5 is the observation-retention chance from day 1 to day 2 under that law. B contributes that fraction to the extended calculation. It is not B's chance of becoming event-free again. A and C are actually observed through day 2 and each contribute 1."}</Prose>

<Prose>{"For observed endpoint Yᵢ and stored cause jᵢ, define the supported continuous-law contribution at a target motor-event clock t as"}</Prose>

<Prose>{"wᵢ(t)=1 if Yᵢ≥t;"}</Prose>

<Prose>{"wᵢ(t)=G(t)/G(Yᵢ) if Yᵢ<t and jᵢ is an observed nonzero competing cause;"}</Prose>

<Prose>{"wᵢ(t)=0 otherwise."}</Prose>

<Prose>{"This combines risk membership and observation weighting in one displayed number. Independent right censoring under the declared common law and positive observation support are required. Covariate-dependent censoring requires its appropriate conditional law; copying a common G would change the assumptions. At an exactly tied endpoint the record is still in the physical pre-event roster, so it is included once with weight 1. A competing event enters the retained lane only at later target clocks."}</Prose>

<Prose>{"For discontinuous estimated G, left limits and event/censor ordering matter. The scratch route below deliberately accepts a "}<strong>{"supplied common continuous positive G"}</strong>{" and does not pretend to implement every estimated-law or delayed-entry convention. Section 11's reverse-KM implementation explains estimating an observation survival curve, but its after-endpoint query convention must not be inserted into a Fine–Gray left-limit formula without the corresponding boundary adjustment. The ordinary R route constructs its own observation-weight intervals. This distinction avoids claiming equivalence between two differently defined censoring processes."}</Prose>

<H3>{"How does the weighted denominator change the score and baseline?"}</H3>

<Prose>{"The Cox competition from section 8 can be reused once each contribution is identified; the new operation is multiplying the positive risk weight by its time-specific observation contribution."}</Prose>

<WeightedSubdistributionFigure />

<Prose>{"Give A, B and C one fixed feature each: 0, 1 and 2. Set the coefficient β to 0 for this calculation, so all positive feature-risk weights exp(βx) are 1. Multiplying by observation contributions gives (1,.5,1), total 2.5. The normalized shares are (.4,.2,.4). The weighted feature mean is .4×0+.2×1+.4×2=1. A's observed feature is 0, so the "}<strong>{"log-likelihood score"}</strong>{" is observed minus weighted expectation: −1. For the negative log likelihood used by gradient descent the sign is reversed."}</Prose>

<Prose>{"The weighted second moment is .4×0²+.2×1²+.4×2²=1.8, and the variance is 1.8−1²=.8. That is the information contribution for this one event. Its negative log-likelihood contribution is log 2.5≈.916291. The baseline subdistribution cumulative-hazard increment at the supplied coefficient is 1/2.5=.4. It is an increment of Γ₁₀, not an incidence jump of .4. In a model that transforms cumulative hazard with the exponential, the incidence is computed afterward; do not equate its finite-sample result with a nonparametric product-limit estimate."}</Prose>

<Prose>{"Name the common calculation for target event group Dⱼ at tⱼ, with dⱼ its size and fixed features xᵢ. The weighted denominator is"}</Prose>

<Prose>{"Mⱼ(β)=Σᵢwᵢ(tⱼ)exp(xᵢᵀβ)."}</Prose>

<Prose>{"Under the explicitly selected Breslow tied-event approximation, the summed weighted partial log likelihood is"}</Prose>

<Prose>{"ℓ(β)=Σⱼ[Σᵢ∈Dⱼxᵢᵀβ−dⱼ log Mⱼ(β)]."}</Prose>

<Prose>{"Normalize each term wᵢexp(xᵢᵀβ) by Mⱼ to obtain its share aᵢⱼ, then μⱼ=Σᵢaᵢⱼxᵢ. The score is Σⱼ[Σᵢ∈Dⱼxᵢ−dⱼμⱼ]; the negative Hessian is ΣⱼdⱼΣᵢaᵢⱼ(xᵢ−μⱼ)(xᵢ−μⱼ)ᵀ. These are section 8's weighted expectation and centered covariance with a different eligible contribution, not a new differentiation rule. The baseline jump is dⱼ/Mⱼ at the fitted coefficient, with the feature reference convention kept consistent."}</Prose>

<Prose>{"The Hessian describes curvature for this fixed supplied observation law. With estimated censor weights, uncertainty also depends on estimating those weights; inverse curvature alone must not be advertised as complete Fine–Gray uncertainty. Subject-clustered robust methods in the ordinary extended-row route account for the way repeated rows represent one subject, under their method's assumptions."}</Prose>

<H3>{"Can we reuse moment scans instead of building every subject-by-event cell?"}</H3>

<Prose>{""}<strong>{"Deeper implementation:"}</strong>{" this branch makes the already explained subdistribution weights efficient with positive prefix and suffix pools. A first pass can inspect the ordinary weighted-library route next, then rejoin at “Do separate valid incidence curves guarantee one valid joint prediction?”"}</Prose>

<Prose>{"The new retained lane has a separable weight: a current-clock factor G(t) times a stored competing-record factor 1/G(Y), so two sorted scans can form the needed weighted moments without a dense membership matrix."}</Prose>

<SubdistributionScanFigure />

<Prose>{"Read the ascending scan first. When B has its competing event at day 1, store its risk contribution divided by G(1). Just before the day-2 target event, that prefix contains B. Multiply the entire prefix's mass by G(2), recovering B's contribution G(2)/G(1). Its weighted feature mean and normalized covariance do not change when every contribution in that prefix receives the same positive factor."}</Prose>

<Prose>{"Read the other scan backward from the latest endpoint. Its suffix contains all records whose observed endpoint is at least the current clock—the physical risk contribution. Merge the physical and retained positive moment pools. Their weights, means and centered covariances use the exact stable "}<code>{"RiskMoments"}</code>{"/"}<code>{"merge_moments"}</code>{" construction already implemented in section 8's "}<code>{"cox_risk_moments.py"}</code>{"; this new module imports that actual local source. It does not rebuild the earlier optimizer, BLAS or a neural network. Scores are centered on the first input feature row as before. Its baseline therefore corresponds to that feature reference; changing the origin must be offset when predicting the same profile."}</Prose>

<Prose>{""}<strong>{"Complete reusable source: "}<code>{"fine_gray_risk.py"}</code>{"."}</strong>{""}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/fine_gray_risk.py"} filename={"fine_gray_risk.py"} language={"python"} title={"fine_gray_risk.py"} />

<Prose>{""}<strong>{"Complete worked example: "}<code>{"weighted-subdistribution.py"}</code>{"."}</strong>{""}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/weighted-subdistribution.py"} filename={"weighted-subdistribution.py"} language={"python"} title={"weighted-subdistribution.py"} />

<Prose>{""}<strong>{"Recorded output of that example."}</strong>{""}</Prose>

<CodeBlock language={"output"}>{"physical [A,B,C]: [ True False  True]\nretained [A,B,C]: [False  True False]\ncontribution weights [A,B,C]: [1.  0.5 1. ]\nweighted denominator: 2.5\nweighted feature mean: [1.]\nlog likelihood: -0.916291\nscore and information: [-1.] [[0.8]]\nbaseline increment: 0.4"}</CodeBlock>

<Prose>{"For n subjects, p fixed features and e distinct target-event clocks, preprocessing costs O(n log n+np). Each coefficient evaluation costs O(np²+ep²) with dense covariances and O(np+ep²) retained state, including the target-clock prefix moments and returned diagnostic steps. Only event-clock prefixes need storage; a full n×e weight matrix is unnecessary. This is an efficient exact implementation of the stated static/common-law weighted terms. High-dimensional sparse or iterative-curvature versions have different costs; the lesson does not claim a hardware benchmark or universal best implementation."}</Prose>

<Prose>{"Run "}<code>{"python -B weighted-subdistribution.py"}</code>{" with "}<code>{"fine_gray_risk.py"}</code>{", section 8's "}<code>{"cox_risk_moments.py"}</code>{" and NumPy available in the same directory. The output identifies the physical and retained masks separately, then weights (1,.5,1), denominator 2.5, score −1, information .8 and baseline increment .4. Change the supplied law to G≡1: B's contribution becomes 1 and the denominator becomes 3. Nothing physically resurrects B. The score evaluator supplies quantities needed by the optimization methods already taught; this example intentionally inspects a supplied coefficient and does not claim a generic new Fine–Gray fitter with arbitrary entry, covariate histories or dependent censoring."}</Prose>

<H3>{"How does the ordinary library turn that bookkeeping into a fit?"}</H3>

<Prose>{"The standard R route expands a competing record into weighted intervals, so a weighted Cox fit can use the same computational idea while keeping subject identity explicit."}</Prose>

<FineGrayExpansionFigure />

<Prose>{""}<code>{"weighted-subdistribution-library.R"}</code>{" returns to the six-pump cohort and adds one fixed supplied feature per pump. Its factor explicitly orders logging-ended first, then motor, then seal. "}<code>{"finegray(..., etype=\"motor\")"}</code>{" names the target; the resulting "}<code>{"fgstart"}</code>{"/"}<code>{"fgstop"}</code>{" mark interval bounds, "}<code>{"fgstatus"}</code>{" marks target events, and "}<code>{"fgwt"}</code>{" supplies the interval contribution weight. Original "}<code>{"id"}</code>{" stays attached to all expanded rows and is not a predictor. The final "}<code>{"coxph"}</code>{" fit uses only x, declares Breslow ties, uses "}<code>{"fgwt"}</code>{", and clusters by original subject id. "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/finegray.html"}>{"R finegray documentation"}</a>{"."}</Prose>

<Prose>{""}<strong>{"Complete ordinary library source: "}<code>{"weighted-subdistribution-library.R"}</code>{" (source-only)."}</strong>{""}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/weighted-subdistribution-library.R"} filename={"weighted-subdistribution-library.R"} language={"r"} title={"weighted-subdistribution-library.R · source only"} />

<Prose>{"This route estimates censoring weights from its data; the scratch illustration supplied continuous G=2⁻ᵗ. They teach the same retained-denominator mechanism but are "}<strong>{"not a matched fit comparison"}</strong>{". The complete R source has no recorded output. When running it, inspect the expanded endpoints, weights and fit before interpreting the coefficient or standard error."}</Prose>

<Prose>{"The R API supports more entry/history handling than this scratch evaluator. Its extended competing records hold later covariates fixed unless a justified predictable-history construction is supplied. Adding future feature values would recreate section 2's information-timing error. The expanded rows are not new independent pumps. "}<code>{"basehaz(..., centered=FALSE)"}</code>{" supplies a cumulative baseline at x=0; the scratch evaluator's centered reference is different unless its first feature row is zero. "}<code>{"survfit"}</code>{" on this subdistribution fit transforms the corresponding cumulative hazard into the complement of target incidence; the script takes one minus that returned curve to obtain the target incidence, not all-cause survival."}</Prose>

<H3>{"Do separate valid incidence curves guarantee one valid joint prediction?"}</H3>

<Prose>{"Each cause's direct model can stay between 0 and 1 while their pair assigns more than one unit of probability, so the joint output still needs its own coherence check."}</Prose>

<IncoherentIncidenceFigure />

<Prose>{"Construct a diagnostic profile, not a reported fitted result: one separate model predicts motor-first probability .7 at a horizon; another predicts seal-first probability .6. Individually they are bounded probabilities. Together they total 1.3 and imply event-free probability −.3. The failure is that no shared constraint made their mutually exclusive first causes coherent. Clipping each probability to [0,1] does nothing; renormalizing the two causes afterward would change the fitted targets and discard the intended survivor mass."}</Prose>

<Prose>{"The shared Aalen–Johansen calculation does not have this defect: every cause takes mass from one common remainder. A jointly parameterized distribution can impose a similar constraint, which motivates the next output-head picture. This is one model-choice question, not a universal claim that a Fine–Gray model for a single scientifically relevant target should never be used. Choose between conditional rates, one target incidence and a coherent joint distribution according to the stated question, observation assumptions and diagnostics."}</Prose>

<H3>{"Can one output reserve probability for every first cause and time?"}</H3>

<Prose>{""}<strong>{"Deeper neural output branch:"}</strong>{" build one joint cause-by-time law after understanding the shared mass accounting above. This develops a different prediction head, with masks and gradients. A first pass through conventional competing-risk reasoning can proceed to section 14's entry and information clocks and return here later."}</Prose>

<Prose>{"The two separate incidence predictions in D50 could overfill one unit of probability; a joint output instead assigns that one unit among mutually exclusive first-cause/time outcomes and a remaining horizon tail."}</Prose>

<JointHeadAnatomyFigure />

<Prose>{"Follow the pump profile into the drawing. A feature function could combine its temperature and vibration measurements as in section 12. Here we inspect only its "}<strong>{"output head"}</strong>{": the final calculation that turns supplied scores into a distribution. The motor branch supplies a score for each time bin; so does the seal branch. Every socket enters the same normalization, together with one socket for remaining event-free beyond the last boundary. As in section 8’s Cox competition, exponentiating each score supplies a positive weight. Add all five weights to one total, labelled Z in the drawing, then divide each weight by that same total. The supplied weights .20, .10, .30, .15 and .25 total Z=1, so the first output leaves those amounts unchanged. No branch gets its own unit of probability. The later score walkthrough names the logits and shows how an edited weight changes this total."}</Prose>

<Prose>{"Switch explicitly to a new constructed forecast for one pump profile. Bin 1 is (0,1] days and bin 2 is (1,2] days. The two named causes are still motor first and seal first. A cell means “this cause is the first event, within this bin.” It does not mean a rate per day or an event probability conditional on having survived earlier bins."}</Prose>

<NeuralTable caption={"Can one output reserve probability for every first cause and time?"} headers={[<>{"First event"}</>,<>{"Bin 1: (0,1] days"}</>,<>{"Bin 2: (1,2] days"}</>]} rows={[[<>{"Motor first"}</>,<>{".20"}</>,<>{".10"}</>],[<>{"Seal first"}</>,<>{".30"}</>,<>{".15"}</>]]} />

<Prose>{"The separate tail is .25: "}<strong>{"no first event through day 2"}</strong>{", with its later time and cause unresolved. All four event cells and the tail sum to 1. It is not a third cause, a censoring probability, or a claim that the pump will never fail. We have chosen a finite prediction grid, so we keep a place for outcomes beyond its last boundary rather than forcing them into an earlier event cell. The original DeepHit formulation assumes an eventual first event inside its finite time horizon; this extra tail is our explicit bounded-horizon adaptation. A closely related PMF treatment includes remaining survival after its final grid time. "}<a href={"https://ojs.aaai.org/index.php/AAAI/article/download/11842/11701"}>{"DeepHit, model and loss sections"}</a>{"; "}<a href={"https://link.springer.com/article/10.1007/s10985-021-09532-6"}>{"Kvamme and Borgan, §2.2"}</a>{"."}</Prose>

<H3>{"How do those cells become incidence and survival?"}</H3>

<Prose>{"Accumulating a cause row answers its horizon question, while the cells still to the right and the tail answer whether any first event has yet occurred."}</Prose>

<JointAccumulationFigure />

<Prose>{"By day 1, motor-first incidence is .20 and seal-first incidence .30. The remaining .50 consists of motor-bin2 .10, seal-bin2 .15 and tail .25. By day 2, motor-first incidence is .20+.10=.30, seal-first incidence is .30+.15=.45, and survival is the tail .25. At day 0 no event-bin mass has accumulated, so the incidences are 0 and survival is 1. Each boundary's three amounts still sum to 1."}</Prose>

<Prose>{"Name the grid after tracing it. Let K be the number of named causes and B the number of event bins. Let pₖᵦ be the probability of first cause k in bin b, and q the tail probability beyond the final boundary τ_B. In this example K=B=2, τ₁=1 day and τ₂=2 days. At a grid boundary τ_r,"}</Prose>

<Prose>{"Fₖ(τ_r)=Σ_{b≤r}pₖᵦ,"}</Prose>

<Prose>{"S(τ_r)=q+ΣₖΣ_{b>r}pₖᵦ,"}</Prose>

<Prose>{"q+ΣₖΣ_{b=1}^B pₖᵦ=1."}</Prose>

<Prose>{"Fₖ is the same first-cause cumulative incidence defined earlier, now obtained from a supplied joint distribution rather than the cohort estimator. Summing permitted remaining cells calculates S directly; subtracting an almost-one total incidence can erase a very small positive remainder in floating-point arithmetic."}</Prose>

<Prose>{"The earlier conditional interval hazards can be recovered at a bin's start: hₖᵦ=pₖᵦ/S(τ_{b−1}) when that denominator is positive. The example has first-bin hazards (.20,.30), then second-bin hazards (.10/.50,.15/.50)=(.20,.30). The two conditional hazards in a bin use one survivor pool; their sum is at most 1. This explains the correspondence with the interval model without treating an unconditional cell as a conditional hazard."}</Prose>

<H3>{"Why does changing one score change all the masses?"}</H3>

<Prose>{"One shared denominator couples every possible first outcome, so increasing a named cell's score reallocates probability rather than adding an extra event on top of the current total."}</Prose>

<JointLiveHeadFigure />

<Prose>{"A "}<strong>{"logit"}</strong>{" is a real-valued score whose exponential supplies a positive weight. Let zₖᵦ be an event-cell logit and z_tail the tail logit. Set their initial values to the logarithms of the table and tail: (log .2, log .1, log .3, log .15, log .25), in cause-row order followed by the tail. Their initial exponential weights already total 1. The shared "}<strong>{"softmax"}</strong>{" divides every weight by their one common total:"}</Prose>

<Prose>{"Z=exp(z_tail)+ΣₖΣᵦexp(zₖᵦ),"}</Prose>

<Prose>{"pₖᵦ=exp(zₖᵦ)/Z, and q=exp(z_tail)/Z."}</Prose>

<Prose>{"Move the sole control for "}<strong>{"motor, bin 2 logit change δ"}</strong>{", holding the other four logits fixed. δ is the amount added to its initial score: z₁₂=log .1+δ, with both δ and the resulting z₁₂ visible. Increase δ from 0 to log 2, taking that cell's score from log .1 to log .2. Its raw weight doubles, and the common total becomes 1.1. The new motor row is (2/11,2/11), the seal row (3/11,3/22), and the tail 5/22. Even the unchanged logits now have smaller probabilities because they share the larger denominator."}</Prose>

<Prose>{"At day 1 the new incidences are approximately (.181818,.272727) and survival .545455. At day 2 they are (.363636,.409091) and survival .227273. Notice the apparently surprising combination: increasing a "}<strong>{"later"}</strong>{" motor cell reduces motor-first incidence at the earlier boundary, while increasing it at the later boundary. The earlier motor cell lost probability to the reweighted later cell. Every boundary still conserves one unit. Reset restores the exact supplied grid, not rounded logits reconstructed from the display."}</Prose>

<Prose>{"Adding a common constant to "}<strong>{"all"}</strong>{" logits is a different change: every weight gets the same multiplier, which cancels from the shared denominator. The distribution is unchanged. Neither operation is a fitted response to a physical intervention; the lab explores the output head's mathematical allocation."}</Prose>

<Prose>{"Two separate cause-row softmax operations would instead give each cause a total of 1, already assigning two units before any tail. Independent sigmoid cells need not total 1 either. DeepHit's shared output normalization is what makes its cause/time outputs one joint distribution. It can represent time-varying feature relationships without imposing the Cox head's proportional-hazards form; that flexibility still needs a justified architecture, censoring assumptions and predictive evaluation."}</Prose>

<H3>{"Which cells are compatible with a censored record?"}</H3>

<Prose>{"An observed first event selects one outcome, while observation ending tells us only which earlier outcomes are excluded."}</Prose>

<JointObservationMaskFigure />

<Prose>{"For an observed motor-first event in bin 2, the likelihood contribution from this head is .10. Its negative log contribution is −log .10≈2.302585. The event tells us both the cause and bin, so its mask selects exactly one cell. It does not also select the tail or every motor cell."}</Prose>

<Prose>{"Now use a different observation: the pump is known event-free "}<strong>{"through boundary 1"}</strong>{", then its logger ends. Both bin-1 causes are excluded. Either bin-2 cause, or a first event beyond day 2, is still possible. The allowed mass is .10+.15+.25=.50; the negative log contribution is −log .50≈.693147. Coding this record as “tail” would wrongly replace its partial information with a known later outcome and use .25 instead of .50."}</Prose>

<Prose>{"At the origin boundary, no event-bin outcome has been excluded: allowed mass is 1 and the contribution is 0. Censoring through the last boundary selects only the tail. The tail's cause remains unknown even though it is a single computational cell."}</Prose>

<Prose>{"Let A be an observation's set of compatible cell indices, including the tail when permitted. Its contribution is"}</Prose>

<Prose>{"L_A=Σ_{j∈A}p_j, and ℓ_A=−log L_A."}</Prose>

<Prose>{"Here j is a flat cell index; the cause-row/time grid still supplies its meaning. For an event, A is a singleton. For censoring after τ_r, A contains every event cell with b>r and the tail. Independent subjects contribute the mean of these negative log terms. "}<strong>{"This normalization is per subject"}</strong>{", unlike section 12's chosen mean per observed Cox event; scratch and Torch use the same declared convention here."}</Prose>

<Prose>{"Ignoring the censoring-distribution factor is justified under conditionally independent right censoring given the supplied predictors, with distinct observation-process parameters. A tail cell does not repair dependent censoring, delayed entry or observation errors. The program supports complete discrete-bin first events and known survival through grid boundaries. An event in a continuous interval may be coarsened into its containing bin; an interior censor time may be reduced to its last completely survived boundary, deliberately discarding the remaining within-bin information. A continuous-time interpolation or a more detailed likelihood must be stated separately. We do not query a cause distribution beyond τ_B or assign an observed later event's exact cause/time to an undifferentiated tail."}</Prose>

<H3>{"What correction does the mask send to the logits?"}</H3>

<Prose>{"The correction compares the head's current distribution with that same distribution restricted and renormalized to the outcomes the observation permits."}</Prose>

<JointMaskGradientFigure />

<Prose>{"For the motor-bin2 event, the permitted conditional distribution has probability 1 on that cell and 0 elsewhere. Subtracting it from the current probabilities yields (.20,−.90,.30,.15,.25). For the boundary-1 censor, renormalize the permitted (.10,.15,.25) by .50, giving conditional weights (.20,.30,.50) on those three cells. The full correction is (.20,−.10,.30,−.15,−.25). Both rows sum to zero: one logit cannot create a second unit of total probability."}</Prose>

<Prose>{"Write a_j=exp(z_j)/Σ_{r∈A}exp(z_r) for j in A, and a_j=0 otherwise. Differentiating the shared normalizer and the allowed normalizer gives"}</Prose>

<Prose>{"∂ℓ_A/∂z_j=p_j−a_j."}</Prose>

<Prose>{"A negative derivative means increasing that logit lowers this observation's loss locally. The censored observation encourages the entire permitted residual set relative to excluded earlier cells; it does not supply a known future cause. A shared upstream network may couple the resulting logit changes, just as section 12's network coupled its scalar score corrections."}</Prose>

<Prose>{"For numerical stability, shift all logits by their maximum and calculate a log-sum-exp over all cells and another over the permitted cells. Their difference is ℓ_A. Recenter the permitted subset on "}<strong>{"its own"}</strong>{" maximum when taking its log-sum-exp. Even if its displayed probability underflows to zero, a very unlikely observed cell can have a finite log loss and a useful conditional-gradient calculation. Taking "}<code>{"log(softmax(...))"}</code>{" after probabilities have underflowed loses that information. The implementation accepts finite logits with representable centered differences; it uses float64 in the matched witness."}</Prose>

<H3>{"Deeper branch: can the head also learn a cause-specific ordering?"}</H3>

<Prose>{"An optional ranking term encourages a profile with an earlier observed first cause to have greater incidence for that cause at the same comparison clock than a profile known to remain event-free longer."}</Prose>

<JointCauseRankingFigure />

<Prose>{"Use three constructed profiles to expose which comparison is legitimate. A has the original grid and a motor-first event in bin 1. B has the edited grid and a seal-first event in bin 2. C has the original grid but observation ends after boundary 1. A and B are comparable for the "}<strong>{"motor"}</strong>{" question at boundary 1: B is known to remain event-free beyond that earlier boundary, even though its later first cause is seal. Compare A's motor incidence .20 with B's motor incidence 2/11≈.181818 at that same boundary. C is not a strictly later observed record and supplies no such pair."}</Prose>

<Prose>{"For observed cause kᵢ>0 and stop-bin bᵢ, admit ordered pair (i,j) only if bᵢ<bⱼ. The later j may have another observed cause or later censoring; it must be known event-free past the comparison boundary. Earlier censoring, equal bins and a censored record as the first-event anchor do not establish this ordering. Coarsened same-bin observations are deliberately not ordered by an invented within-bin clock."}</Prose>

<Prose>{"Define the gap dᵢⱼ=F_{kᵢ}(τ_{bᵢ}|xᵢ)−F_{kᵢ}(τ_{bᵢ}|xⱼ). The original DeepHit ranking form uses exp(−dᵢⱼ/σ). Here choose σ=.5 and use the "}<strong>{"mean over P admitted pairs"}</strong>{", with mean 0 if P=0. Our explicitly declared example objective is"}</Prose>

<Prose>{"L=mean subject NLL + .1 × mean admitted-pair exp(−dᵢⱼ/.5)."}</Prose>

<Prose>{"The likelihood always remains present. This mean/mean convention and coefficient .1 are choices for the small head comparison; they are not the paper's unnormalized sums or a claimed selected hyperparameter. A larger ranking weight changes the tradeoff and can prioritize ordering over the probability fit; coherent probabilities are not automatically calibrated probabilities. Validation should examine the intended censor-aware incidence/survival measures as well as discrimination, with the study discipline already taught."}</Prose>

<Prose>{"For one pair, the derivative with respect to the earlier CIF is −exp(−d/σ)/σ and with respect to the later CIF is its negative. Each CIF is a prefix of the named cause row, so add that derivative to every included cell. For many pairs, deposit it at the end of each prefix, then reverse-scan to collect all prefixes containing each cell. Finally translate probability derivatives u_j back to logits through the shared softmax:"}</Prose>

<Prose>{"∂L_rank/∂z_j=p_j[u_j−Σ_r p_r u_r]."}</Prose>

<Prose>{"The tail has no direct in-grid cause-prefix derivative, but it still participates in the shared-normalizer correction. A ranking calculation that leaves the tail's logit detached would change the head derivative. Our σ contract is at least .01: a gap is between −1 and 1, so the exponent is at most 100 and remains representable in float64. A smaller scale needs a deliberately stabilized/redefined objective, not silent clipping of this exponential loss."}</Prose>

<H3>{"How do the complete scratch and ordinary routes correspond?"}</H3>

<Prose>{"The scratch module implements the head and its manual derivatives; the Torch route independently builds the observation masks and differentiates the same supplied logits and objective."}</Prose>

<Prose>{""}<code>{"joint_survival_outputs.py"}</code>{" stores a flat cause-major row of K×B+1 logits. "}<code>{"joint_output"}</code>{" normalizes once, reshapes event probabilities into K rows, accumulates each row's CIF, and scans remaining columns backward with the tail to calculate S. "}<code>{"allowed_cells"}</code>{" encodes observed first events and boundary censoring. "}<code>{"joint_mask_loss"}</code>{" returns the loss, signed logit derivatives and permitted indices. It does not need a dense network or a subject-by-risk-set matrix: unlike the Cox likelihood, one subject's observation likelihood depends on that subject's supplied distribution."}</Prose>

<Prose>{"This complete head calculation takes O(KB) time and space per subject, including returned cells, curves and gradient. Returning all KB cells already requires that much output work. The optional ranking implementation first sorts observation clocks, skips earlier/equal clocks by binary search, and enumerates only actual later pairs. With N subjects and P returned pairs it costs O(NKB+N log N+P) time and O(NKB+N+P) retained space. P can be quadratic in N; pair sampling would be a different declared ranking approximation. Prefix-end derivative accumulation avoids an extra KB-sized gradient allocation for each pair. These are algorithmic costs for the supplied head, excluding a feature network; no hardware speed result is claimed."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/joint_survival_outputs.py"} filename={"joint_survival_outputs.py"} language={"python"} title={"joint_survival_outputs.py"} />

<Prose>{"For the ordinary route, save "}<code>{"joint-event-mass.py"}</code>{" beside "}<code>{"joint_survival_outputs.py"}</code>{" in a Python environment with PyTorch. Run "}<code>{"python -B joint-event-mass.py"}</code>{". The program supplies all logits and observation codes directly; it does not train a network. The executed witness used PyTorch 2.14.0+cpu with float64."}</Prose>

<Prose>{"The Torch input shape is N×(KB+1). "}<code>{"F.log_softmax(logits, dim=1)"}</code>{" normalizes across all event cells "}<strong>{"and"}</strong>{" the tail per subject. The mask has that same shape. For censoring, its later-bin mask repeats across all causes and permits the tail; for an event it selects exactly the observed cause/bin and rejects the tail. "}<code>{"masked_fill"}</code>{" sets disallowed log probabilities to −∞, the log representation of zero permitted mass. "}<code>{"torch.logsumexp(..., dim=1)"}</code>{" sums only compatible probabilities in log space, then the subject mean produces the same likelihood. "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.log_softmax.html"}>{"Torch log-softmax"}</a>{", "}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.logsumexp.html"}>{"Torch log-sum-exp"}</a>{"."}</Prose>

<Prose>{"The optional Torch reference accumulates cause CIFs, constructs the exact pair comparisons directly, and averages their penalties with the same .1/.5 settings. Its straightforward pair loop is intentionally an independent small-state reference, with O(N²) candidate comparisons; use the scratch pair index or an equivalent indexed tensor construction for a large sparse-comparison workload. "}<code>{".backward()"}</code>{" obtains derivatives with respect to all supplied logits. A real feature network would receive those head gradients by its ordinary chain rule, as taught in section 12. No optimizer step is needed to establish this head correspondence."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/joint-event-mass.py"} filename={"joint-event-mass.py"} language={"python"} title={"joint-event-mass.py"} />

<Prose>{"Recorded output from the supplied float64 comparison:"}</Prose>

<CodeBlock language={"output"}>{"{\n  \"base_masses\": [\n    [\n      0.2,\n      0.10000000000000002\n    ],\n    [\n      0.3,\n      0.15\n    ]\n  ],\n  \"base_tail\": 0.25,\n  \"base_cif\": [\n    [\n      0.0,\n      0.2,\n      0.30000000000000004\n    ],\n    [\n      0.0,\n      0.3,\n      0.44999999999999996\n    ]\n  ],\n  \"base_survival\": [\n    1.0,\n    0.5,\n    0.25\n  ],\n  \"censor_after_bin1\": 0.5,\n  \"edited_masses\": [\n    [\n      0.18181818181818182,\n      0.18181818181818185\n    ],\n    [\n      0.27272727272727265,\n      0.13636363636363635\n    ]\n  ],\n  \"edited_tail\": 0.22727272727272727,\n  \"edited_cif\": [\n    [\n      0.0,\n      0.18181818181818182,\n      0.36363636363636365\n    ],\n    [\n      0.0,\n      0.27272727272727265,\n      0.409090909090909\n    ]\n  ],\n  \"edited_survival\": [\n    0.9999999999999999,\n    0.5454545454545454,\n    0.22727272727272727\n  ],\n  \"mean_nll_plus_point1_ranking\": 1.5281007104578899,\n  \"torch_loss\": 1.5281007104578899,\n  \"max_gradient_difference\": 5.551115123125783e-17,\n  \"scratch_gradient\": [\n    [\n      -0.29752393319353787,\n      0.03719049164919224,\n      0.11157147494757669,\n      0.055785737473788344,\n      0.09297622912298058\n    ],\n    [\n      0.089295667914102,\n      0.05423059231538475,\n      0.08134588847307708,\n      -0.2926603890967948,\n      0.06778824039423093\n    ],\n    [\n      0.06666666666666667,\n      -0.03333333333333335,\n      0.09999999999999999,\n      -0.05000000000000002,\n      -0.08333333333333333\n    ]\n  ],\n  \"torch_version\": \"2.14.0+cpu\"\n}"}</CodeBlock>

<Prose>{"For A/B/C above, both routes give objective "}<strong>{"1.5281007104578899"}</strong>{" and maximum compared logit-gradient difference "}<strong>{"5.551115123125783×10⁻¹⁷"}</strong>{". The output also includes both full mass grids, all boundary CIFs and S, and every manual logit derivative. The values .30000000000000004 and .9999999999999999 are ordinary float64 rounding around .30 and 1, not additional probability outcomes. This is a checked supplied-state implementation comparison. A complete DeepHit training project would additionally require its architecture, grid construction, data/splits, optimization, hyperparameter selection, observation assumptions and evaluation protocol; none of its experiments or predictive-performance claims is reproduced here."}</Prose>

<H3>{"Joint-grid practice"}</H3>

<Prose>{"For cause 1 masses [.2,.1], cause 2 masses [.3,.15] and tail .25, find survival after bins 1 and 2 and the likelihood contribution of observation ending after bin 1. Then explain what is wrong with assigning that observation to the tail, and why two separately normalized cause rows cannot represent this joint distribution."}</Prose>

<details><summary>Hint</summary>

<Prose>{"List every still-permitted first outcome at each boundary. A censored record eliminates earlier cells; it does not tell you which remaining cell will occur."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"After bin 1, both second-bin cells and the tail remain: S=.1+.15+.25=.5. After bin 2 only the tail remains, so S=.25. The bin-1 censored contribution is therefore .5, not .25. The two CIFs at the first boundary are (.2,.3), and at the second (.3,.45), conserving mass with the corresponding survival values. Assigning censoring to the tail invents survival through bin 2. Separate row normalizations assign a unit to each of two mutually exclusive first causes, so they already total 2. A shared normalization across the four first-event cells and tail preserves the required total of 1."}</Prose>

</details>

<Prose>{"For transfer, change only the motor-bin2 logit by log2. Explain why earlier motor incidence decreases while later motor incidence increases, and check the two new survivor values without changing any cause identity."}</Prose>

<Prose>{"For an implementation diagnostic, independently construct the flat five-cell mask for censoring after bin 1 before calling either supplied loss function. Use it to sum the default and edited probabilities. A faulty implementation selects only the tail: which mask entries must be restored, and which likelihoods should your repair reproduce?"}</Prose>

<details><summary>Implementation solution</summary>

<Prose>{"In cause-major order followed by the tail, the correct mask is "}<code>{"[False, True, False, True, True]"}</code>{". On the original grid its selected sum is .50. On the log2-edited grid it is 2/11+3/22+5/22=6/11. Retaining only index 4 would give .25 and 5/22, wrongly declaring survival through the second boundary. Apply this repaired mask to the probabilities for a direct check, and to log probabilities with "}<code>{"masked_fill"}</code>{" and "}<code>{"logsumexp"}</code>{" for the stable loss. Preserve one normalization across all five cells; the repair changes the observation mask, not the head."}</Prose>

</details>

<Prose>{"We have described mutually exclusive "}<strong>{"first"}</strong>{" outcomes, whether through conditional rates, incidence models or one joint mass head. A pump that fails, is repaired and fails again no longer stays in an absorbing first-event state. The next section changes that state/history question rather than reusing these first-outcome cells as repeated episodes."}</Prose>

<H2>{"14. Respect entry and changing information"}</H2>

<Prose>{"The previous section counted mutually exclusive first outcomes. A repaired pump can have another episode, and even a first-event study can begin observing a pump late or record new measurements during follow-up. First keep the first-event question and change who is eligible and what we know. Then change the event/state question itself. Neither operation is achieved by renaming a time column or copying the last recorded feature backward."}</Prose>

<H3>{"When did this pump become observable on the original clock?"}</H3>

<Prose>{"A logger installed after commissioning cannot tell us what happened before installation; the pumps that enter this event-free study have already survived to their entry ages."}</Prose>

<DelayedEntryFigure />

<Prose>{"Read the four lanes on the same "}<strong>{"days since commissioning"}</strong>{" ruler. Name these four records E1–E4 to distinguish them from the earlier A–H cohort. Their entry ages are (0,1,2,0), endpoints (3,4,5,6), and endpoint flags (failure,censor,failure,censor). At day 3 all four have entered and none has left before that day. E1 fails, so the survival factor is 3/4. E2 is then censored at day 4. At day 5 E3 and E4 remain; one fails, multiplying by 1/2. The product at days 3 and 5 is .75 and .375. The compact "}<code>{"history"}</code>{" library example below gives the same .75 and .375."}</Prose>

<Prose>{"Move the one clock control to day 1. E2's open entry mark lies exactly on the line: it has not yet contributed to the pre-event competition at that clock. At day 1.5 it has. An endpoint at the line remains included for events at that endpoint; it leaves afterward. With entry Lᵢ and observed endpoint Yᵢ, the chosen counting-process risk set is"}</Prose>

<div className="neural-equation"><MathBlock>{"R(t)=\\{i:L_i<t\\le Y_i\\}."}</MathBlock></div>

<Prose>{"The strict inequality at entry and non-strict inequality at exit implement an "}<strong>{"open-start, closed-stop"}</strong>{" interval, (Lᵢ,Yᵢ]. The event is attached to the interval's end. This is the "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/Surv.html"}>{"R "}<code>{"Surv"}</code>{" counting-process convention"}</a>{". If entry and event are recorded at the same timestamp for the same subject, a zero-length row is invalid here; resolve observation timing rather than pretend that row supplies positive exposure."}</Prose>

<Prose>{"Now change only E3's entry from day 2 to day 3 in a separate worked case. At E1's day-3 failure E3 is absent. The risk count is 3, giving factor 2/3. E3 enters afterward; day-5 factor remains 1/2, giving survival 1/3. A different convention that includes same-time entrants would give .375. Compare the actual boundary rule before demanding equality between tools. The original saved example has no entry at a failure time, so its .75/.375 does not settle that boundary question."}</Prose>

<Prose>{""}<strong>{"Delayed entry"}</strong>{", or left truncation, means inclusion requires surviving long enough to enter. It differs from a right-censored observation, which stops following an already included pump. Estimating an original-age distribution needs independent entry/truncation and appropriate censoring, possibly conditional on modeled features, together with enough overlapping entry/follow-up support. If entry depends on unrecorded impending failure, changing the risk-count code cannot remove that selection. A product initialized at 1 does not identify an unobserved early-age probability level."}</Prose>

<Prose>{"The small second ruler resets each selected pump's age to zero at entry. That asks about "}<strong>{"remaining life among entrants"}</strong>{", conditional on their entry ages and selection. It changes both clock and population. Moving the labels left is not an innocuous way to estimate the original commissioning-age survival distribution. The conditional remaining-life question follows the same survivor conditioning developed in section 5 and the "}<a href={"https://web.stanford.edu/class/stats305b/notes/Survival_I.html"}>{"Stanford Survival I estimands treatment"}</a>{"."}</Prose>

<H3>{"Which feature value was known immediately before the event?"}</H3>

<Prose>{"An interval row carries a pump's dated information; it does not create another independent pump."}</Prose>

<PredictableHistoryFigure />

<Prose>{"Return to the original "}<strong>{"A/B history fixture"}</strong>{". A has maintained=0 on (0,3], then maintained=1 on (3,5], with its first event at day 5. B is observed on (1,6], maintained=0, ending without an event. The two A bands share one physical ID; the vertical day-3 boundary marks a change in recorded status rather than another pump entering the study."}</Prose>

<Prose>{"At exactly day 3, the active A row is (0,3] and its value is 0. At day 3.5, that row has left and (3,5] supplies value 1. At day 5, A's event compares its current 1 with B's current 0. A never contributes both rows to one denominator. A censor at an event endpoint likewise remains in the pre-event risk pool, then leaves without an event numerator."}</Prose>

<Prose>{"The term "}<strong>{"predictable covariate"}</strong>{" means the value used for an event can be determined from information available immediately before that event. It can depend on past measurements, maintenance and earlier history; it cannot use a later observation to revise an earlier competition. If a measurement is first obtained at day 3, it applies after that boundary under this convention. Interpolating toward a value first measured at day 5 can leak that future measurement into day 4. The "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/doc/timedep.pdf"}>{"survival package's time-dependent treatment, §§2–3"}</a>{" explains the distinction between changes at interval starts and events at interval ends."}</Prose>

<Prose>{"For the first-event PH model let xᵢ(t−) be the feature row known just before the event, and write"}</Prose>

<div className="neural-equation"><MathBlock>{"h_i(t\\mid\\mathcal H_{t-})=h_0(t)\\exp\\{\\beta^\\top x_i(t-)\\}."}</MathBlock></div>

<Prose>{"The history symbol 𝓗 means the information available so far; it is not the cumulative hazard H from section 5. A constant β may multiply a "}<strong>{"changing covariate"}</strong>{". Section 10's time-varying coefficient changed β(t) for a fixed feature instead. The two constructions answer different model questions and can coexist only when stated explicitly."}</Prose>

<Prose>{"Before fitting, sort each subject's rows by start. Require start<stop, no overlapping intervals, and no row after its first event for this contract. A gap means the pump is absent from observation during that gap; it cannot be filled with invented status. Gaps in a proposed prediction path will instead be rejected because its full future hazard cannot be accumulated without a specified path. Store subject IDs and dated source measurements, split physical subjects before expansion, and keep all of A's rows in its one split. More interval rows do not increase the number of independent subjects."}</Prose>

<H3>{"How can the risk pool add and remove records stably?"}</H3>

<Prose>{""}<strong>{"Deeper implementation:"}</strong>{" this active tree maintains the entry-aware, dated membership just explained. A first pass can continue at “What is an absolute prediction along a changing path?”; return to the tree when implementing repeated entry and exit updates."}</Prose>

<Prose>{"The static suffix scan in section 8 worked because all subjects began at zero and their one stop time nested the competitors. Entry and feature updates require an actual active set."}</Prose>

<ActiveMomentTreeFigure />

<Prose>{"Read the leaves as "}<strong>{"currently eligible interval rows"}</strong>{". An inactive leaf has no mass. On entry, add its positive risk weight and feature row. On exit or update, replace the old leaf with no mass, then add any new row only for later event clocks. At the boundary, calculate events first; the row ending there is eligible and the row starting there waits."}</Prose>

<Prose>{"For a supplied coefficient, a leaf has log scale η=βᵀ(x−origin), scaled mass 1, that centered feature as its mean, and zero covariance. Two child nodes merge with the actual "}<code>{"RiskMoments"}</code>{"/"}<code>{"merge_moments"}</code>{" function taught in section 8. If their scales are s₁,s₂ and scaled masses m₁,m₂, set s=max(s₁,s₂), a=m₁exp(s₁−s), b=m₂exp(s₂−s). Total scaled mass is a+b; normalized fractions are f=a/(a+b), q=b/(a+b). Their merged moments are"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mu=\\mu_1+q(\\mu_2-\\mu_1),\\qquad\nC=fC_1+qC_2+fq(\\mu_2-\\mu_1)(\\mu_2-\\mu_1)^\\top."}</MathBlock></div>

<Prose>{"This positive mixture keeps within-child and between-child variation. An absent child contributes nothing. The parent recomputes from remaining children when a leaf is removed; it does not subtract nearly equal huge raw totals. In the changed example, a score-1000 censored record leaves at day 1. At day 2 only scores 0 and 1 remain. Their denominator is logaddexp(0,1), and an event with score 0 has log contribution −logaddexp(0,1)≈−1.313262. A global maximum retained after its owner left could erase both remaining weights. Removing the maximum correctly changes the root's numerical scale to the maximum of the surviving leaves."}</Prose>

<HistoryMomentMergeFigure />

<Prose>{"At an event group, use the current root for the complete risk pool. For Efron ties, temporarily remove the group's death leaves to get a positive "}<strong>{"nondeath"}</strong>{" pool, assemble a positive death pool, and merge it with the remaining death fraction 1−k/d for substep k=0,…,d−1. This is section 9's fractional denominator on the newly correct membership. After that group the death rows leave permanently under the first-event contract. There is no need to restore rows that would immediately exit. Breslow reuses the full root d times. Both choices include current censors."}</Prose>

<Prose>{"For d failures D at t, the numerator sums their current βᵀx. Each denominator subtracts a log risk mass, each score subtracts its weighted feature mean, and each information term adds its centered covariance. Those derivative operations are unchanged from section 8. The code removes the common feature origin and local log scale on both sides of the likelihood, preserving the result without exponentiating enormous scores."}</Prose>

<Prose>{"Preparing n interval rows sorts their boundaries in O(n log n) and copies O(np) features. A binary tree visits O(log n) parent merges per leaf update. With dense p×p covariance, one evaluation costs O(n log n·p²+e p²), where e is the number of first-event rows. Its tree requires O(np²) state, plus the O(np) input. Retained event traces add O(gp²) for g failure clocks. Each Newton solve adds O(p³); every backtracking trial performs another evaluation. This memory tradeoff supports stable deletion; a small explicit-roster rescan can still be simpler or faster for a tiny dataset. No measured speedup is claimed."}</Prose>

<Prose>{"Save the complete "}<code>{"cox_history.py"}</code>{" beside section 8's "}<code>{"cox_risk_moments.py"}</code>{", "}<code>{"cox_regression.py"}</code>{" and section 9's "}<code>{"cox_baseline.py"}</code>{". It imports the real positive merge, fitted/iteration result types and reference-baseline container. It implements the new membership, active tree, likelihood and first-event validator itself. "}<code>{"fit_history_cox"}</code>{" uses the taught damped Newton/backtracking calculation with these new terms; copying the old static "}<code>{"fit_cox"}</code>{" call would evaluate the wrong competitors. Coefficient growth, insufficient curvature, no events, failed descent/line search and exhausted budget are diagnostics. A stationary candidate is still not a proof that an unpenalized finite MLE exists."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/cox_history.py"} filename={"cox_history.py"} language={"python"} title={"cox_history.py"} />

<H3>{"What is an absolute prediction along a changing path?"}</H3>

<Prose>{"A baseline jump must use the same active competitors, and a profile's current feature multiplier belongs inside the event-time accumulation."}</Prose>

<PrescribedHistoryCurveFigure />

<Prose>{"At the supplied β=log2, A's current maintained value 1 gives weight 2 and B's 0 gives weight 1. One event over denominator 3 yields reference Breslow increment 1/3 at reference maintained=0. For a prescribed profile with A's dated path, its event-day multiplier is 2: cumulative hazard through day 5 is 2/3 and survival exp(−2/3)≈.513417. The coefficient likelihood's Efron setting and this "}<strong>{"Breslow baseline"}</strong>{" are separately named, as in section 9. Changing the reference to maintained=1 doubles its baseline and halves the profile multiplier, preserving the physical profile prediction."}</Prose>

<Prose>{"For a reference feature vector z and path x(u−),"}</Prose>

<div className="neural-equation"><MathBlock>{"\\Delta\\widehat H_z(t_j)=\n\\frac{d_j}{\\sum_{i\\in R(t_j)}\\exp\\{\\beta^\\top(x_i(t_j-)-z)\\}},\\qquad\n\\widehat S(t\\mid x\\text{ path})=\n\\exp\\left[-\\sum_{t_j\\le t}\\Delta\\widehat H_z(t_j)\n                  \\exp\\{\\beta^\\top(x(t_j-)-z)\\}\\right]."}</MathBlock></div>

<Prose>{"When the path begins at an entry/landmark a, exclude baseline events at or before a and interpret the result as conditional survival after a. Before its first included event the estimated survival is 1; no observed events supplies no baseline increments, not proof that failure is impossible. Queries remain within the recorded cohort and path support. The source returns log survival and a separate rounded-zero flag when displayed survival underflows. It supplies point predictions, not confidence bands."}</Prose>

<Prose>{"In a changed two-jump calculation, the reference has increments .1 at day 2 and .2 at day 4. The profile has multiplier 1 through day 3 and 2 after it. H(4)=.1×1+.2×2=.5, so S(4)=exp(−.5)≈.606531. Applying the final multiplier 2 to both jumps gives .6 and exp(−.6) ≈.548812: it rewrites the earlier path. The chronological path sweep and logaddexp accumulation implement the correct sum. Computing a baseline through the dense active moment evaluator has that evaluator's cost; path prediction adds O(m+ap+q log m) for m relevant baseline events, a path rows and q queries, with O(m+q) state beyond the supplied path. A scalar-only active baseline tree is a possible later optimization."}</Prose>

<Prose>{"For a future forecast, a "}<strong>{"prescribed path"}</strong>{" is a declared scenario or an external schedule whose future values are known for the question. Feeding the pump's realized future maintenance history into an earlier forecast leaks information. An internal measurement driven by latent health can require a joint model or a separately justified dynamic forecast; specifying an arbitrary path is not itself its identified marginal prognosis. "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/survfit.coxph.html"}>{"R's path-prediction contract"}</a>{" requires the intervals and subject ID, and warns about the interpretation."}</Prose>

<Prose>{"The next bounded module computes observation rosters, landmark counts and transition arithmetic. "}<code>{"entry_kaplan_meier"}</code>{" uses sorted starts/stops: the number of starts strictly before t minus stops strictly before t is the active count. The product is a point estimate without uncertainty; the first-event entry assumptions just stated remain necessary."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/history_observation.py"} filename={"history_observation.py"} language={"python"} title={"history_observation.py"} />

<Prose>{"Save "}<code>{"entry-and-history-cox.py"}</code>{" beside those modules. Run it with NumPy. It supplies β; it does not fit the original A/B table or call an old main. Its JSON records the original entry arithmetic, day-3/3.5/5 rosters, reference increment and prescribed path. The second record is a new five-pump landmark witness developed below. These complete sources were checked with Python3.12.14/NumPy2.3.5; the output retains floating rounding."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/entry-and-history-cox.py"} filename={"entry-and-history-cox.py"} language={"python"} title={"entry-and-history-cox.py"} />

<CodeBlock language={"output"}>{"{\"changed_entry_steps\": [[3.0, 3, 1, 0.6666666666666667], [5.0, 2, 1, 0.33333333333333337]], \"history_information\": [[0.2222222222222222]], \"history_log_likelihood\": -0.4054651081081644, \"history_rosters\": {\"3.0\": [{\"id\": \"A\", \"maintained\": 0.0}, {\"id\": \"B\", \"maintained\": 0.0}], \"3.5\": [{\"id\": \"A\", \"maintained\": 1.0}, {\"id\": \"B\", \"maintained\": 0.0}], \"5.0\": [{\"id\": \"A\", \"maintained\": 1.0}, {\"id\": \"B\", \"maintained\": 0.0}]}, \"history_score\": [0.33333333333333337], \"original_entry_steps\": [[3.0, 4, 1, 0.75], [5.0, 2, 1, 0.375]], \"prescribed_path_S5\": [0.513417119032592], \"reference_breslow_increment\": [0.33333333333333337], \"supplied_beta\": [0.6931471805599453]}\n{\"known_survivors\": [{\"event\": true, \"id\": \"A\", \"maintained_by_landmark\": true, \"remaining_observed\": 2.0}, {\"event\": false, \"id\": \"B\", \"maintained_by_landmark\": false, \"remaining_observed\": 3.0}, {\"event\": false, \"id\": \"D\", \"maintained_by_landmark\": false, \"remaining_observed\": 1.0}, {\"event\": true, \"id\": \"E\", \"maintained_by_landmark\": false, \"remaining_observed\": 5.0}], \"landmark_day\": 3.0}"}</CodeBlock>

<h4>{"Use the ordinary counting-process library with the same clock"}</h4>

<Prose>{"R's "}<code>{"coxph(Surv(start,stop,event)~maintained,...)"}</code>{" fits the interval response. Boolean events avoid ambiguous old 1/2 codes; IDs group one subject's rows. "}<code>{"ties"}</code>{" states the coefficient likelihood. Explicit "}<code>{"survfit(newdata=path,id=pathID,stype=2,ctype=1)"}</code>{" requests a prescribed path, exponential survival transform and Breslow cumulative hazard. The path retains start/stop/dummy event fields so "}<code>{"Surv"}</code>{" recognizes it. "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/coxph.html"}>{"R Cox API"}</a>{"."}</Prose>

<Prose>{"The complete R file first holds β at log2 with zero optimization iterations to evaluate the A/B likelihood and its absolute baseline. Its separate six-subject fitting example adds C,D,E,F with dated rows and both feature/event orders. On that table the Python calculation gives β≈.4491911134 and negative log likelihood≈5.7880032143, also checked with an explicit-roster objective. The R source has no recorded coefficient or baseline result. Distinguish its supplied-coefficient evaluation from the later coefficient-fitting call."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/entry-and-history-cox-library.R"} filename={"entry-and-history-cox-library.R"} language={"r"} title={"entry-and-history-cox-library.R · source only"} />

<H3>{"Why can “ever maintained” invent a survival advantage?"}</H3>

<Prose>{"To belong to a group defined by a later maintenance, the pump must first remain eligible long enough to reach that maintenance."}</Prose>

<ImmortalTimeFigure />

<Prose>{"Follow A, maintained at day 3 and failing at day 5. A flag recorded after follow-up says “ever maintained.” Assigning that flag at commissioning calls its days 0–3 maintained even though the maintenance has not happened. A pump failing at day 2 cannot receive the later maintenance and tends to fall into the other group. The comparison grants the eventual-maintenance group an artificially guaranteed pre-maintenance period. "}<strong>{"Immortal-time bias"}</strong>{" names that mistaken allocation; it does not say maintained pumps are physically immortal. Correct dated rows put A's early time under 0 and later time under 1. This repairs information timing, not confounding or a causal intervention estimate."}</Prose>

<LandmarkFigure />

<Prose>{"A different design declares a "}<strong>{"landmark"}</strong>{" L before assessing the final test. It predicts subsequent outcomes among pumps known event-free through L, using information available by L. In a new five-record fixture, A fails at 5 with maintenance at 3; B is censored at 6, unmaintained; C fails at 2, unmaintained; D is censored at 4, unmaintained; E fails at 8 with maintenance at 5. At L=3, A,B,D,E are known survivors. Their observed remaining durations are 2,3,1,5. Only A is maintained by the landmark. E's later maintenance at day 5 cannot enter its day-3 feature."}</Prose>

<Prose>{"The target is P(T>L+u | T>L, information available by L), for a stated future horizon u≥0, under the observation/model assumptions. At the landmark use features "}<strong>{"known by L"}</strong>{"; a measurement delivered there is available for predictions after L. That differs from the pre-event covariate at an event exactly at L. An event at L has failed by L and is excluded. Under our T>C right-censor convention, a censor exactly at L is known event-free through L, but has zero remaining observed follow-up; it supplies no observed later label. An earlier censor cannot establish landmark survival from these records. Independent/conditionally modeled observation support is still needed for the selected target population."}</Prose>

<Prose>{"Move L to 0: all five remain and no maintenance is yet known. Move L to 5: only B and E remain, with maintenance flags 0 and 1 and remaining observed durations 1 and 3. A's exact day-5 failure is excluded. The count, available-feature marks and future target sentence update together. The slider explores different declared targets; it does not license choosing a landmark after looking for the most flattering held-out result. Changing L changes the population, available information and remaining observation."}</Prose>

<Prose>{"Time-updated association and landmark prediction do not identify what would happen if we intervened on maintenance. Maintenance may be chosen because of prior deterioration; adjusting for its dated value alone does not establish exchangeability or appropriate longitudinal adjustment. The later "}<a href={"/learn/path/full-curriculum/causal-inference-do-calculus?module=classical-ml#4-standardize-the-comparison"}>{"Causal Inference assumptions explanation"}</a>{" defines the treatment, target, consistency, exchangeability and positivity. It develops causal identification and the need for a valid adjustment argument; this small pump example estimates no preventive maintenance effect."}</Prose>

<H3>{"Did inspection reveal a time, a tail, or an interval?"}</H3>

<Prose>{"A pump running at one inspection and failed at the next supplies a region of possible failure times, not the next inspection's exact event time."}</Prose>

<ObservationTypeFigure />

<Prose>{"Read the shaded interval. The pump was running at day 4 and is found failed at day 6, so 4<T≤6. We did not see a failure at exactly 6 or at the midpoint 5. A separate exact-time record would supply a density. A still-running endpoint at 6 supplies a right tail, T>6. A pump first inspected failed by 2, on a positive-lifetime support, supplies a left mass, 0<T≤2. These four observation types carry different information."}</Prose>

<Prose>{"For a continuous model with density f and survivor S, their likelihood contributions are f(t), S(c), 1−S(r) and S(l)−S(r) respectively. The density has inverse-time units; the other three are probability masses. Section 6 already implemented exact/right exponential terms, and section 12 implemented exact/right Weibull AFT terms. Neither module supports finite interval censoring. The new module imports the actual section-6 likelihood and closed-form fit for that existing part, then adds left/interval mass and conditional entry. It does not substitute an interval endpoint into the Weibull exact-event source."}</Prose>

<Prose>{"Suppose entry at age a requires T>a, and entry and inspection are ignorable under the declared conditional observation model. Divide the permitted failure contribution by S(a), "}<strong>{"after intersecting"}</strong>{" its support with T>a. An interval (l,r] becomes (max(l,a),r]. If r≤a it is impossible for an event-free entrant. A left-censored upper bound ≤a is likewise impossible. An exact event at or before a is outside the selected support; a right-censor at a supplies no remaining-lifetime information. Conditional entry normalization is not justified solely by the shape of a row; informative entry or inspection requires its own model."}</Prose>

<Prose>{""}<strong>{"Deeper derivation and implementation:"}</strong>{" the following derivatives, stable formulas and typed solver preserve a narrow interval's likelihood and handle boundary optima. On a first pass, follow the inspection-width picture below and its zero-width distinction, then continue at the ordinary R route or “What changes when repair permits another failure?” Return here to derive and implement the fitting calculation."}</Prose>

<Prose>{"For the exponential rate r>0, define b=max(l,a) and w=R−b>0. Its conditional interval log contribution, rate score and negative rate Hessian are"}</Prose>

<div className="neural-equation"><MathBlock>{"\\ell=-r(b-a)+\\log(1-e^{-rw}),\\quad\nU_r=-(b-a)+\\frac{w}{e^{rw}-1},\\quad\nI_r=\\frac{w^2e^{-rw}}{(1-e^{-rw})^2}."}</MathBlock></div>

<Prose>{"The score is a derivative with respect to "}<strong>{"rate"}</strong>{", unlike section 6's log-rate score. The negative Hessian is nonnegative, so this log likelihood is concave in rate. Exact observations contribute log r−r(t−a), right-censored observations −r(c−a). Exact/right exposure and event totals are the reused sufficient statistics after subtracting entry; finite interval rows also retain their own widths and effective lower offsets. For left mass, set its lower lifetime support to 0, then intersect entry."}</Prose>

<IntervalWidthFigure />

<Prose>{"At supplied rate .1 per day, inspection (4,6] has mass exp(−.4)[1−exp(−.2)]≈.121508 and log mass≈−2.107772. Move width to 1: (4,5] has mass≈.0637894 and log mass≈−2.752168. With conditional entry at day 2, divide those masses by exp(−.2); the width-2 conditional log mass becomes approximately −1.907772. The last-running inspection at 4 remains different from entry at 2."}</Prose>

<Prose>{"Compute log(1−exp(−z)) with log(−expm1(−z)) near zero and log1p(−exp(−z)) in the far tail. For z=rw tiny, use the score series z/(exp z−1)=1−z/2+z²/12−z⁴/720 and information series z²exp(−z)/(1−exp(−z))²=1−z²/12+z⁴/240. For larger z, exp(−z) avoids overflowing exp(z). The module keeps the likelihood in log space and reports unrepresentable positive exposure/derivatives rather than silently clipping a rate."}</Prose>

<Prose>{"As w tends to zero, interval mass tends to f(b)w and its log tends to log f(b)+log w. It goes to negative infinity. A zero-width interval is invalid in this typed API; changing its type to "}<strong>{"exact"}</strong>{" supplies f(b), a different observation likelihood, not the limiting probability mass. For a changed interval (4,4+10⁻⁶] with entry 2 at rate .1, log mass is approximately −16.31809570; an exact day-4 event's conditional log density is log(.1)−.2≈−2.502585. The large difference comes from the tiny interval width, not a software failure."}</Prose>

<Prose>{"Save the complete "}<code>{"survival_likelihoods.py"}</code>{" beside "}<code>{"exponential_observations.py"}</code>{". "}<code>{"prepare_observations"}</code>{" makes the type, support intersection and exposure contract explicit. The existing "}<code>{"log_rate_terms"}</code>{" supplies exact/right log likelihood; chain-rule conversion gives U_r=U_η/r and I_r=(I_η+U_η)/r²=D/r². The code uses D directly for curvature to avoid cancellation at huge exposure. Three streaming "}<code>{"fsum"}</code>{" passes through interval rows retain constant working state beyond O(n) stored input; evaluation remains O(n)."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/survival_likelihoods.py"} filename={"survival_likelihoods.py"} language={"python"} title={"survival_likelihoods.py"} />

<h4>{"Does the positive-rate likelihood have a finite maximum?"}</h4>

<Prose>{"Concavity makes a decreasing score useful, but it does not promise an interior root for every observation type."}</Prose>

<Prose>{"All right-censored records with positive residual exposure decrease with rate: the maximum is at rate zero in the extended no-event law, or a supremum as a strictly positive rate tends to zero. Right-censor records with zero residual exposure contribute 1 at every rate and leave a flat likelihood. Only left/interval rows starting at entry, with no decreasing exposure, can increase toward mass 1 as rate tends to infinity: the supremum is not a fitted finite rate. An impossible support intersection has zero likelihood for every rate. These cases are recognized before starting numerical search."}</Prose>

<Prose>{"For finite event/interval evidence with some decreasing exposure, the positive score near zero crosses a negative score eventually. The scratch solver doubles an upper rate until it brackets that crossing, then takes a Newton proposal current+score/information only when it stays strictly inside the bracket; otherwise it bisects. Positive score raises the lower bound, negative score lowers the upper. It reports a finite interior result only with a small relative bracket and dimensionless rate×score. Numeric range failure, bracket exhaustion and iteration exhaustion have their own statuses. Each iteration is O(n); the number of iterations is a real cost, not hidden inside an unexplained generic optimizer."}</Prose>

<Prose>{"The new finite witness has exact failure 2, right censor 5, interval (1,3] and left censor ≤2. The scratch root is .3062123362022486 per day, with log likelihood −5.195100306885495. "}<code>{"typed-censored-likelihood.py"}</code>{" compares a separate SciPy bounded scalar optimizer on "}<strong>{"the same"}</strong>{" full likelihood in log-rate coordinates. Its declared bounds [−8,4] are adequate for this finite witness, not a universal boundary solver; success and an interior point are checked. Its rate differs by approximately 1.16×10⁻⁹, with likelihood difference below 10⁻¹⁵. This is numerical correspondence, not a predictive comparison or another fit to historical inspection data."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/typed-censored-likelihood.py"} filename={"typed-censored-likelihood.py"} language={"python"} title={"typed-censored-likelihood.py"} />

<CodeBlock language={"output"}>{"{\"same_likelihood_difference\": -8.881784197001252e-16, \"scipy_rate\": 0.3062123373626605, \"scipy_success\": true, \"supplied_rate_point1\": {\"information\": 299.33466455322366, \"log_likelihood\": -6.518128694935086, \"score\": 20.06662226450798, \"status\": \"defined\"}, \"typed_finite_witness\": {\"bracket\": [0.30621233618350513, 0.3062123362022486], \"information\": 31.340193162271426, \"iterations\": 6, \"log_likelihood\": -5.195100306885495, \"rate\": 0.3062123362022486, \"score\": -8.881784197001252e-16, \"status\": \"finite-interior\"}}\n{\"all_right\": {\"log_likelihood\": 0.0, \"rate\": 0.0, \"status\": \"zero-boundary\"}, \"entry_no_residual\": {\"log_likelihood\": 0.0, \"rate\": null, \"status\": \"flat-likelihood\"}, \"impossible_entry\": {\"rate\": null, \"status\": \"impossible-observation\"}, \"left_only\": {\"log_likelihood_supremum\": 0.0, \"rate\": null, \"status\": \"infinite-rate-supremum\"}, \"tiny_interval_conditional_entry\": {\"information\": 99.9999999999999, \"log_likelihood\": -16.318095700818542, \"score\": 7.999999500000008, \"status\": \"defined\"}}"}</CodeBlock>

<Prose>{"In R, "}<code>{"Surv(L,R,type='interval2')"}</code>{" represents exact equal bounds, right infinite/NA upper, left infinite/NA lower, and finite intervals. "}<code>{"survreg(...,dist='exponential')"}</code>{" fits an interval parametric time model; this is not a Cox interval likelihood. Its intercept is log time scale, so the exponential rate is exp(−intercept). The ordinary file matches the "}<strong>{"no-entry"}</strong>{" finite witness and includes all fields and translation. R "}<code>{"survreg"}</code>{" does not gain our conditional-entry contract from a counting "}<code>{"Surv"}</code>{" response; that entry likelihood remains separately taught above. "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/survreg.html"}>{"R parametric model and parameterization"}</a>{"."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/typed-censored-likelihood-library.R"} filename={"typed-censored-likelihood-library.R"} language={"r"} title={"typed-censored-likelihood-library.R · source only"} />

<Prose>{"R's "}<code>{"survfit(Surv(L,R,type='interval2')~1)"}</code>{" supplies a separate ordinary nonparametric interval estimate (Turnbull route), rather than fitting a constant exponential rate. For the complete no-entry witness above, "}<code>{"nonparametric <- survfit(response~1); print(nonparametric); plot(nonparametric)"}</code>{" is the ordinary next call in the same R file. Interval evidence can leave probability unresolved within support intervals; a general optimized Turnbull/ICM implementation and its convergence analysis are outside the local typed exponential outcome. The R route is source-only, without recorded output."}</Prose>

<H3>{"What changes when repair permits another failure?"}</H3>

<Prose>{"A first-failure state was absorbing for the earlier question. A repaired pump can leave a failed state, return to work and be exposed to another failure; the observation rows now describe repeated episodes."}</Prose>

<RecurrentEventFigure />

<Prose>{"Follow one physical pump R: it fails at calendar day 2, returns to work after repair at 3, fails again at 5, returns at 6 and reaches a terminal scrapping event at 8. First failure was at 2; two failures have occurred by 5. The same ID belongs to every episode. A "}<strong>{"calendar-time"}</strong>{" analysis retains days since commissioning. A "}<strong>{"gap-time"}</strong>{" question resets at the start of the specified new episode: from return to work at 3 to failure at 5 is 2 days of that operating episode. The time between the failures, 5−2=3, also includes repair and is a different defined gap. Name the origin before treating either as the time response."}</Prose>

<Prose>{"Specify when the pump is eligible for another failure. Here it is not operating while under repair. Scrapping at 8 prevents future operating failures and is a terminal competing transition, not ordinary loss of the logger. If terminal events depend on the same deteriorating history, silently censoring them as independent can change the recurrent-failure question. Episode number, prior events, state durations or latent pump frailty can matter. A shared latent frailty is a model for dependence, not a term whose name proves that dependence was correctly specified."}</Prose>

<Prose>{"Counting-process rows and subject-clustered uncertainty provide tools, but the first-event validator above deliberately rejects post-event rows. It cannot silently become a recurrent-event fitter. A recurrent intensity, event-order/gap/calendar convention, dependence assumptions and terminal-event treatment must be chosen before fitting. Clustered standard errors address a specified estimator's sampling dependence; they do not repair the wrong time scale, informative terminal events or causal identification. "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/coxph.html"}>{"R Cox counting-process scope"}</a>{"."}</Prose>

<MultistateOccupancyFigure />

<Prose>{"A multistate question instead asks "}<strong>{"which state is the pump in now?"}</strong>{" Use three states: working W, failed/repairing F and terminal D. In a new constructed ten-pump transition witness all start in W. At the first endpoint, 4 move W→F and 1 W→D; 5 remain W. The occupancy row becomes (.5,.4,.1). At the second endpoint, 1 of the 5 working pumps fails; among the 4 failed pumps, 2 return to W, 1 enters D, and 1 remains F. D is absorbing. The two transition matrices are"}</Prose>

<div className="neural-equation"><MathBlock>{"M_1=\\begin{pmatrix}.5&.4&.1\\\\0&1&0\\\\0&0&1\\end{pmatrix},\\qquad\nM_2=\\begin{pmatrix}.8&.2&0\\\\.5&.25&.25\\\\0&0&1\\end{pmatrix}."}</MathBlock></div>

<Prose>{"Rows mean "}<strong>{"from"}</strong>{" and columns "}<strong>{"to"}</strong>{", in W,F,D order. Identity rows for unobserved states in M₁ preserve bookkeeping; they do not estimate those states' future rates. Row-vector multiplication gives p₂=p₀M₁M₂=(.6,.2,.2): currently working .6, currently failed .2, terminal .2. The failed occupancy fell from .4 to .2 because pumps left that state. It cannot be interpreted as a declining cumulative probability that failure has ever occurred. That cumulative first-entry amount here is .4+.5×.2=.5; it remembers repaired pumps as having failed before."}</Prose>

<Prose>{"For a general endpoint, let Y_h be the number in state h immediately before it and d_hk the observed departures h→k. Set off-diagonal ΔA_hk=d_hk/Y_h and diagonal ΔA_hh=−Σ_{k≠h}ΔA_hk. Then M=I+ΔA has nonnegative entries and rows summing to 1 when departures do not exceed their state roster. The Aalen–Johansen product p(t)=p(0)∏M(s) updates probabilities in chronological order, reducing to section 13's absorbing first-event mass when no return arrows exist. The "}<a href={"https://cran.r-project.org/web/packages/survival/vignettes/compete.pdf"}>{"survival multistate treatment, §§1–2"}</a>{" uses this transition/occupancy view."}</Prose>

<Prose>{"This row-stochastic algebra conserves mass for supplied matrices. Using it to estimate transition probabilities requires the appropriate state/history and observation assumptions, including Markov conditions for the intended transition law or a justified extension. Marginal occupancy and arbitrary conditional transition probabilities are not interchangeable when history matters. To obtain “ever entered F” in a longer recurrent path, augment the state with a never/ever-failed flag, or use an estimator for that first-entry question. Reusing the current F occupancy cannot recover that memory after a repair."}</Prose>

<Prose>{""}<code>{"transition_from_counts"}</code>{" implements each endpoint's simultaneous off-diagonal departures and diagonal remainder. Zero-risk rows with departures are rejected. "}<code>{"advance_occupancy"}</code>{" performs the scratch row-by-matrix product and checks all input masses; NumPy "}<code>{"p @ matrix"}</code>{" is the separate ordinary linear-algebra route. Dense work per endpoint is O(K²), with O(K²) matrix input and O(K) returned occupancy; a product for every start state costs O(K³) per dense matrix multiplication instead. The following complete main fits no recurrence model or observational study."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/repaired-pump-occupancy.py"} filename={"repaired-pump-occupancy.py"} language={"python"} title={"repaired-pump-occupancy.py"} />

<CodeBlock language={"output"}>{"{\"after_first\": [0.5, 0.4, 0.1], \"after_second\": [0.6000000000000001, 0.2, 0.2], \"currently_failed_after_second\": 0.2, \"ever_failed_by_second\": 0.5, \"first_transition\": [[0.5, 0.4, 0.1], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]], \"maximum_difference\": 0.0, \"numpy_after_second\": [0.6000000000000001, 0.2, 0.2], \"second_transition\": [[0.8, 0.2, 0.0], [0.5, 0.25, 0.25], [0.0, 0.0, 1.0]], \"states\": [\"working\", \"failed/repairing\", \"terminal\"]}"}</CodeBlock>

<Prose>{"The complete R ordinary estimator route below encodes the ten constructed observed histories with destination-state factors, explicit starting states and repeated IDs, then uses "}<code>{"survfit"}</code>{" to estimate Aalen–Johansen occupancy. Its first factor level means no transition, not a physical logger state. ID5 ends follow-up at its day-1 terminal event. Inspect "}<code>{"states"}</code>{", "}<code>{"pstate"}</code>{" and "}<code>{"transitions"}</code>{" before mapping columns; factor ordering does not authorize guessing the state names. This is a source-only R route with no recorded output. It differs from merely multiplying supplied matrices, although those constructed counts explain its intended point calculation."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/repaired-pump-occupancy-library.R"} filename={"repaired-pump-occupancy-library.R"} language={"r"} title={"repaired-pump-occupancy-library.R · source only"} />

<H3>{"How do the shorter observation examples fit these rules?"}</H3>

<Prose>{"The compact "}<code>{"history"}</code>{" program below combines delayed-entry Kaplan–Meier with the A/B row inspection we just traced. It fits no history Cox coefficients. Its recorded library result uses its own entry convention; keep it separate from the changed same-boundary entry fixture above."}</Prose>

<Prose>{"Complete source — "}<code>{"entry-history-observation.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/entry-history-observation.py"} filename={"entry-history-observation.py"} language={"python"} title={"entry-history-observation.py"} />

<CodeBlock language={"output"}>{"delayed-entry S(3), S(5): [0.75, 0.375]\nid  start  stop  maintained  event\n A    0.0   3.0           0      0\n A    3.0   5.0           1      1\n B    1.0   6.0           0      0\nrisk set at 3.0 [{'id': 'A', 'maintained': 0, 'event': 0}, {'id': 'B', 'maintained': 0, 'event': 0}]\nrisk set at 5.0 [{'id': 'A', 'maintained': 1, 'event': 1}, {'id': 'B', 'maintained': 0, 'event': 0}]\nAll rows from A stay in one split. A future 'ever maintained' flag is not a baseline feature."}</CodeBlock>

<Prose>{"The original "}<code>{"intervalLikelihood"}</code>{" program fits another set of bounds (0,2],(2,5],(3,7],right4,right6. It obtains rate .15688122 and printed interval probability .274302, right-tail .390125. Its "}<code>{"bracket=(-4,-1)"}</code>{" is an initial SciPy bracketing search, not a universal hard rate bound. The new safeguarded typed solver makes the other boundary statuses explicit; these old numbers remain the output of their own original source/observations, not the new exact2/right5/interval1..3/left2 witness."}</Prose>

<Prose>{"Complete source — "}<code>{"exponential-interval-likelihood.py"}</code>{":"}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/exponential-interval-likelihood.py"} filename={"exponential-interval-likelihood.py"} language={"python"} title={"exponential-interval-likelihood.py"} />

<CodeBlock language={"output"}>{"fitted constant rate: 0.15688122\nP(2<T<=5): 0.274302\nright-censored contribution at6: 0.390125\nInterval inspection is not an exact failure timestamp or delayed study entry."}</CodeBlock>

<H3>{"Practice: change the history before changing the answer"}</H3>

<Prose>{"For the changed E3 entry at day 3, explain why E3 is absent from E1's day-3 event roster and present at day 5. Then place a maintenance update at the same day-3 boundary and decide which value an event exactly there uses. What is wrong with adding both adjacent subject rows to that event?"}</Prose>

<details><summary>Hint</summary>

<Prose>{"Apply the two inequalities separately: start<t and t≤stop. A boundary can close one row without yet opening its next row for that event."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"E3's start=3 fails start<3 and so it is absent at day 3; start<5≤stop includes it at day 5. The four-row entry product changes to (2/3)(1/2)=1/3. At an adjacent maintenance update, the row ending at 3 supplies the old value and the row starting at 3 waits until later. Adding both counts one physical subject twice, changing its risk weight, mean and covariance. The temptation is to treat the new feature as already available for an event occurring at the same boundary; the declared predictable convention does not do that."}</Prose>

</details>

<Prose>{"Now diagnose a different implementation: reference jumps .1 at day 2 and .2 at day 4, path multiplier 1 through day 3 and 2 afterward. It returns exp(−.6). Repair its formula and identify whether your answer is a causal maintenance effect."}</Prose>

<details><summary>Solution</summary>

<Prose>{"The code took the final multiplier outside the sum. Keep each event's current value inside: H=.1×1+.2×2=.5, S=exp(−.5). This is a prediction along the declared path under the model; it does not identify a maintenance intervention effect. A path supplied from realized future data also cannot be used as an earlier honest forecast."}</Prose>

</details>

<Prose>{"For independent typed-observation transfer, let a pump be running at 4 and found failed at 4+ε, with entry at 2, and exponential rate r. Write its contribution for ε>0, decide what happens at ε=0, and contrast an exact day-4 event. Then choose whether failed occupancy .2 or ever-failed probability .5 answers “is it under repair now?” in the two-step example."}</Prose>

<details><summary>Hint</summary>

<Prose>{"Intersect support first, divide by survival to entry, and retain the width factor. A repaired pump leaves the current failed state but keeps its history."}</Prose>

</details>

<details><summary>Solution</summary>

<Prose>{"The conditional interval log contribution is −2r+log(−expm1(−rε)). For small positive ε it is approximately log r−2r+log ε. At ε=0 the typed interval is invalid; an explicitly exact day-4 record contributes log r−2r, a density rather than a zero-width mass. The under-repair question uses current occupancy .2. Ever-failed .5 includes pumps that repaired or became terminal after a first failure. Equating the two would erase the return arrow and history memory."}</Prose>

</details>

<Prose>{"We can now name the time origin, eligible population, available history, observation type and state target before choosing a model. The next section uses that discipline in an honest report: its population, observation, split, model and supported prediction must all describe the same question."}</Prose>

<H2>{"15. Complete a held-out reliability report"}</H2>

<Prose>{"The previous section made us name the clock, eligible population, available history, observation type and state target. A report must carry those choices through its split, fitted transformation, probability horizon and evaluation. A good score attached to the wrong question is still the wrong report."}</Prose>

<H3>{"Trace one subject through the complete protocol"}</H3>

<Prose>{"Change explicitly from the eight hand-drawn pumps to the original "}<strong>{"900-pump simulated report"}</strong>{". These are generated records, not measurements from a plant."}</Prose>

<HeldOutReportFigure />

<Prose>{"Follow one pump's two clocks into the minimum. The first and third baseline features are standard normal draws; the second is a 0/1 Bernoulli draw. The original score is s=.6x₁−.7x₂+.5(x₃²−1). Its failure time is T=12[E/exp(s)]^(1/1.5), with E an independent unit-rate exponential draw. The logger endpoint C is drawn independently between days 8 and 25. The record stores Y=min(T,C) and δ=1 if T≤C. The day units and this observation protocol belong to this constructed example. A recorded non-event endpoint is the logger ending, not proof the pump's lifetime equals Y."}</Prose>

<Prose>{"Here the known generator implies S(t|x)=exp[−exp(s)(t/12)^1.5]. That formula lets the saved report compare estimated probabilities with the synthetic oracle. A real deployment normally lacks the true law; its reported oracle error cannot be copied into a field-study claim."}</Prose>

<Prose>{"The physical subjects split once: rows 0..599 train,600..749 validate, 750..899 test. There is one row per subject here. With §14 histories, all intervals belonging to one ID would travel together. Choose the observation protocol and split before looking for a favorable test result; the original seed 73 and row ordering define this one saved generated split. Different populations or deployment dates can require a different sampling design."}</Prose>

<Prose>{"The candidate list is fixed: linear Cox on three features; quadratic Cox with an added x₃² fourth feature; and two 60-tree forests with minimum leaf sizes 10 and 25. Both Cox models use ridge alpha=.1 and Efron coefficient ties; their fitted baselines are Breslow. The forests use all candidate features at a split and one worker with the declared seed. Adding a predeclared square of an already available baseline measurement is not fitting a transformation to test outcomes. The learned means/scales in each Cox "}<code>{"StandardScaler"}</code>{", however, must come from training subjects only."}</Prose>

<Prose>{"Trace the training wires. Each candidate is fitted on uncapped training responses. Training also supplies the common ordinary KM comparison and censor-survival estimate. For validation and test, the administrative cap changes both response fields: Y'=min(Y,12), δ'=δ·1{Y≤12}. An observed failure exactly at 12 remains a failure; a later observed failure becomes a censor at 12. Changing the time alone would falsely label a day 12 event. This is the same observation-contract operation introduced in section 1."}</Prose>

<Prose>{"The five probability queries are fixed at days 2,4,6,8,10. The report checks that training follow-up reaches beyond 12 and estimated censor survival is positive at every required event/endpoint/grid query. Those are support conditions, not proof of independent censoring. Independence is supplied by this simulation law. A dependent logger would require the appropriate conditional observation model, not merely a positive marginal KM curve. The ordinary metrics also require the grid inside their evaluation follow-up domain, and returned model curves have a training-time domain. Capping at 12 does not authorize scoring beyond either supported range. The displayed grid stays inside those supported ranges."}</Prose>

<Prose>{"Validation "}<strong>{"integrated Brier score"}</strong>{", IBS, chooses one of the four candidates. It consumes a validation-subject by five-time "}<strong>{"survival probability matrix"}</strong>{", not the ranking vector returned by "}<code>{"predict"}</code>{". The actual implementation averages trapezoid area over [2,10]; its five-point numerical integration does not measure every continuous-time probability or include [0,2]. This is section 11's supported weighted-error calculation on a declared grid. Equal validation values would retain the first candidate in the listed order."}</Prose>

<Prose>{"Once selected, the model and its transformation freeze before test evaluation. Test data do not choose leaf size, add a feature or move the grid. A new validation strategy can be designed for another study; repeatedly consulting this test split makes it part of selection and removes its held-out role."}</Prose>

<H3>{"Keep probability and ranking outputs on separate wires"}</H3>

<Prose>{"The Cox pipeline's ordinary "}<code>{".predict(matrix)"}</code>{" applies its fitted scaler and returns a linear risk score. The forest's "}<code>{".predict"}</code>{" instead summarizes ensemble cumulative hazard over training event times. Neither vector is a failure probability, and their numerical scales are not interchangeable. Higher score means greater modeled risk for the respective ranking question. "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.linear_model.CoxPHSurvivalAnalysis.html"}>{"Cox output contract"}</a>{"; "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.ensemble.RandomSurvivalForest.html"}>{"forest output contract"}</a>{"."}</Prose>

<Prose>{"The survival-specific pipeline route must preserve that same learned transformation explicitly. "}<code>{"model[:-1].transform(matrix[indices])"}</code>{" supplies the Cox estimator's training-scale feature matrix, then "}<code>{"model[-1].predict_survival_function(transformed)"}</code>{" creates one step function per subject. Evaluate each at the fixed grid to get shape(150,5). Do not feed raw validation measurements straight to the final scaled estimator, or substitute pipeline "}<code>{".predict"}</code>{" for survival curves. For a forest there is no scaler branch; its returned survival curves average leaf KM estimates, as explained in section 12. The complete original helper encodes both paths."}</Prose>

<Prose>{"Save the full program below as "}<code>{"simulated-reliability-report.py"}</code>{". It brings the generated law, subject split, four fixed candidates, training-only transformations and supported evaluation grid into one executable report. The recorded output lets us trace the selected model back to those choices."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/simulated-reliability-report.py"} filename={"simulated-reliability-report.py"} language={"python"} title={"simulated-reliability-report.py"} />

<CodeBlock language={"output"}>{"validation IBS linear Cox 0.15111\nvalidation IBS quadratic Cox 0.127175\nvalidation IBS forest leaf10 0.141301\nvalidation IBS forest leaf25 0.14484\nselected: quadratic Cox\ntest subjects/events: 150 72\nminimum training censor survival through12: 0.762589\ntest IBS model/KM: 0.140159 0.18573\ntest Harrell C / Uno C truncated at10: 0.757735 0.760532\ndynamic AUC at2,4,6,8,10: [0.770483, 0.772953, 0.792436, 0.803636, 0.835642]\nsynthetic oracle probability MSE: 0.000287\nThis is one generated split, not an industrial or clinical benchmark."}</CodeBlock>

<Prose>{"Read the saved results in the same order as the protocol. Quadratic Cox has validation IBS .127175, compared with .151110 for linear Cox and .141301/ .144840 for the leaf 10/leaf 25 forests. Validation selects quadratic Cox. The test set has 150 subjects and 72 observed events after the cap. Training censor survival at 12 is .762589, giving observation weight support through the declared report horizon."}</Prose>

<Prose>{"Selected-model test IBS is .140159; the common training-KM curve gives .185730 on the same capped test responses and grid. This is a .045571 difference for one simulated split. It is neither an uncertainty interval nor evidence that quadratic Cox universally beats forests or predicts industrial reliability. The generator includes x₃², so the predeclared quadratic representation can express its risk shape while the linear candidate cannot. That explains a reason for this comparison; it does not make every saved ranking inevitable."}</Prose>

<Prose>{"Harrell C=.757735 and Uno C=.760532 answer related but differently observed pair-ranking questions. Uno is truncated at 10 with training observation weights and the strict earlier-event eligibility convention from section 11. Dynamic AUC is (.770483,.772953,.792436,.803636,.835642) at the five listed horizons; each value ranks event-by-horizon cases against surviving controls under its observation assumptions. It is not “the percentage of all test subjects predicted correctly.” Neither ranking measure establishes calibrated absolute probability. The synthetic oracle probability MSE=.000287 compares estimated S with known generated S on the same test profiles/grid; it is a different quantity from the observed, weighted Brier score."}</Prose>

<Prose>{"The changed report uses seed91, shape2 and a linear score law. It selects linear Cox: validation IBS.162783 versus.163096 for quadratic Cox, and test IBS.134459 versus KM.149032. This different law and split give a separate comparison; the tiny validation difference does not establish significance. Its complete program, result and explanation are inside practice K in section16."}</Prose>

<H3>{"Apply the observation mechanism to a licensed real cohort"}</H3>

<Prose>{"Now leave simulated pumps. The following example describes "}<strong>{"Heart Failure Clinical Records"}</strong>{", a different clinical cohort. Its probability level, observation process and follow-up support cannot transfer to pump failures."}</Prose>

<RealCohortCurveFigure />

<Prose>{"The original collectors describe 299 subjects at two Faisalabad hospitals during 2015, with follow-up spanning 4–285 days; their reported 96 deaths leave 203 censored records. This is their reported hospital cohort with advanced heart failure, rather than all people with that diagnosis. The UCI copy supplies "}<code>{"time"}</code>{", follow-up days, and "}<code>{"DEATH_EVENT"}</code>{", 1 for an observed death and 0 otherwise. These are the two fields used here. The raw endpoint flag does not identify separate causes, a repair state or a common classification horizon. The file describes follow-up duration; a clinical time-origin/entry/observation protocol would need fuller specification for a new forecast or causal study. "}<a href={"https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0181001"}>{"Original collection, Methods/Detail of data and endpoint Results"}</a>{"; "}<a href={"https://archive.ics.uci.edu/dataset/519/heart+failure+clinical+records"}>{"UCI fields and dataset licence"}</a>{"."}</Prose>

<Prose>{"At a death endpoint, the filled mark contributes an event to its pre-event roster. An open non-death endpoint contributes exposure up to its follow-up end, then leaves. Treating every 0 flag as “survived 180 days” would invent a label for a record censored earlier. Treating "}<code>{"time"}</code>{" as a baseline predictor of the same death flag would use a follow-up outcome as an input. This descriptive program fits no predictor; it only carries the original two fields into the already taught grouped KM calculation."}</Prose>

<Prose>{"Use the offline unaltered CSV named "}<code>{"data/uci-heart-failure-clinical-records.csv"}</code>{" beside the program folder and its "}<code>{"uci-heart-failure-clinical-records-provenance.json"}</code>{" file. The 12,239-byte CSV has SHA256 "}<code>{"9c73cea7468ff5d517801ec050fe9993da5912fce4b56f296f8df3b38dd75912"}</code>{". It was extracted byte-for-byte from the official UCI archive; its local filename is the only change. The provenance file lists original URL, retrieval time, archive/member identity, field mapping, collector citation and licence. No invented or transformed patient rows are substituted."}</Prose>

<Prose>{"Attribution: *Heart Failure Clinical Records* [Dataset] (2020), UCI Machine Learning Repository, DOI "}<a href={"https://doi.org/10.24432/C5Z89R"}>{"10.24432/C5Z89R"}</a>{", CC BY 4.0 "}<a href={"https://creativecommons.org/licenses/by/4.0/"}>{"licence"}</a>{". Original collection: Ahmad T, Munir A, Bhatti SH, Aftab M and Raza MA (2017), *Survival analysis of heart failure patients: A case study*, PLoS ONE 12(7), e0181001. Credit the dataset and collectors when reusing its raw copy or derived illustration. This calculation reproduces no collector regression, nomogram, clinical performance or treatment conclusion."}</Prose>

<Prose>{"The small reader below verifies raw bytes against the provenance file and constructs typed follow-up rows. Its row ID is a local CSV row number, not an authentic patient identifier. Other columns stay unaltered in the raw file but do not enter a model. The existing "}<code>{"survival_estimators.py"}</code>{" provides "}<code>{"kaplan_meier"}</code>{", supported step lookup and "}<code>{"restricted_mean"}</code>{" in section 4; reuse that exact module instead of writing another product-limit loop. "}<code>{"pre_event_count"}</code>{" uses its prepared endpoint groups and binary search to find the roster Y≥t."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/reliability_cohort.py"} filename={"reliability_cohort.py"} language={"python"} title={"reliability_cohort.py"} />

<Prose>{"Save the complete new main below beside that reader and the existing "}<code>{"survival_estimators.py"}</code>{". It declares its questions before calculating: counts/support, KM at days 4/30/90/180/285, RMST through 180 and whether a median was reached. It compares all 148 unique endpoints with the separate ordinary "}<code>{"sksurv.nonparametric.kaplan_meier_estimator(event,time)"}</code>{", whose Boolean true field means observed death. The scratch core requires Python Boolean flags, while the ordinary call accepts the NumPy Boolean vector; the visible conversion respects both actual interfaces. "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.nonparametric.kaplan_meier_estimator.html"}>{"Ordinary KM API"}</a>{"."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/real-cohort-descriptive.py"} filename={"real-cohort-descriptive.py"} language={"python"} title={"real-cohort-descriptive.py"} />

<CodeBlock language={"output"}>{"{\n  \"scope\": \"Descriptive right-censor KM; UCI cohort only, no fitted predictor\",\n  \"raw_csv_sha256\": \"9c73cea7468ff5d517801ec050fe9993da5912fce4b56f296f8df3b38dd75912\",\n  \"subjects\": 299,\n  \"observed_deaths\": 96,\n  \"right_censored\": 203,\n  \"observed_endpoint_range_days\": [\n    4.0,\n    285.0\n  ],\n  \"unique_endpoint_groups\": 148,\n  \"queries\": [\n    {\n      \"day\": 4.0,\n      \"pre_event_at_risk\": 299,\n      \"km_post_event\": 0.9966555183946488\n    },\n    {\n      \"day\": 30.0,\n      \"pre_event_at_risk\": 264,\n      \"km_post_event\": 0.8822799751119835\n    },\n    {\n      \"day\": 90.0,\n      \"pre_event_at_risk\": 189,\n      \"km_post_event\": 0.7626795340593711\n    },\n    {\n      \"day\": 180.0,\n      \"pre_event_at_risk\": 106,\n      \"km_post_event\": 0.6542926751836228\n    },\n    {\n      \"day\": 285.0,\n      \"pre_event_at_risk\": 1,\n      \"km_post_event\": 0.5757047129015671\n    }\n  ],\n  \"rmst_through_180_days\": 142.13835420064956,\n  \"median_days_if_reached\": null,\n  \"ordinary_route\": \"sksurv.nonparametric.kaplan_meier_estimator(event,time)\",\n  \"max_absolute_curve_difference\": 4.440892098500626e-16,\n  \"curve_columns\": [\n    \"day\",\n    \"pre_event_at_risk\",\n    \"deaths\",\n    \"censors\",\n    \"km_post_event\"\n  ],\n  \"curve\": [\n    [\n      4.0,\n      299,\n      1,\n      0,\n      0.9966555183946488\n    ],\n    [\n      6.0,\n      298,\n      1,\n      0,\n      0.9933110367892977\n    ],\n    [\n      7.0,\n      297,\n      2,\n      0,\n      0.9866220735785953\n    ],\n    [\n      8.0,\n      295,\n      2,\n      0,\n      0.979933110367893\n    ],\n    [\n      10.0,\n      293,\n      6,\n      0,\n      0.959866220735786\n    ],\n    [\n      11.0,\n      287,\n      2,\n      0,\n      0.9531772575250836\n    ],\n    [\n      12.0,\n      285,\n      0,\n      1,\n      0.9531772575250836\n    ],\n    [\n      13.0,\n      284,\n      1,\n      0,\n      0.9498209995760516\n    ],\n    [\n      14.0,\n      283,\n      2,\n      0,\n      0.9431084836779876\n    ],\n    [\n      15.0,\n      281,\n      2,\n      0,\n      0.9363959677799237\n    ],\n    [\n      16.0,\n      279,\n      0,\n      1,\n      0.9363959677799237\n    ],\n    [\n      20.0,\n      278,\n      2,\n      0,\n      0.9296593061412192\n    ],\n    [\n      22.0,\n      276,\n      0,\n      1,\n      0.9296593061412192\n    ],\n    [\n      23.0,\n      275,\n      2,\n      0,\n      0.9228981475511012\n    ],\n    [\n      24.0,\n      273,\n      1,\n      0,\n      0.9195175682560423\n    ],\n    [\n      26.0,\n      272,\n      3,\n      0,\n      0.9093758303708653\n    ],\n    [\n      27.0,\n      269,\n      1,\n      0,\n      0.9059952510758064\n    ],\n    [\n      28.0,\n      268,\n      2,\n      0,\n      0.8992340924856884\n    ],\n    [\n      29.0,\n      266,\n      1,\n      1,\n      0.8958535131906294\n    ],\n    [\n      30.0,\n      264,\n      4,\n      1,\n      0.8822799751119835\n    ],\n    [\n      31.0,\n      259,\n      1,\n      0,\n      0.8788734887215898\n    ],\n    [\n      32.0,\n      258,\n      1,\n      0,\n      0.875467002331196\n    ],\n    [\n      33.0,\n      257,\n      2,\n      1,\n      0.8686540295504085\n    ],\n    [\n      35.0,\n      254,\n      1,\n      0,\n      0.865234131796273\n    ],\n    [\n      38.0,\n      253,\n      1,\n      0,\n      0.8618142340421375\n    ],\n    [\n      40.0,\n      252,\n      1,\n      0,\n      0.8583943362880021\n    ],\n    [\n      41.0,\n      251,\n      1,\n      0,\n      0.8549744385338666\n    ],\n    [\n      42.0,\n      250,\n      1,\n      0,\n      0.8515545407797311\n    ],\n    [\n      43.0,\n      249,\n      3,\n      0,\n      0.8412948475173248\n    ],\n    [\n      44.0,\n      246,\n      1,\n      0,\n      0.8378749497631893\n    ],\n    [\n      45.0,\n      245,\n      1,\n      0,\n      0.8344550520090538\n    ],\n    [\n      50.0,\n      244,\n      1,\n      0,\n      0.8310351542549184\n    ],\n    [\n      54.0,\n      243,\n      0,\n      2,\n      0.8310351542549184\n    ],\n    [\n      55.0,\n      241,\n      1,\n      0,\n      0.8275868756065577\n    ],\n    [\n      59.0,\n      240,\n      1,\n      0,\n      0.824138596958197\n    ],\n    [\n      60.0,\n      239,\n      2,\n      1,\n      0.8172420396614757\n    ],\n    [\n      61.0,\n      236,\n      1,\n      0,\n      0.8137791496629101\n    ],\n    [\n      63.0,\n      235,\n      0,\n      1,\n      0.8137791496629101\n    ],\n    [\n      64.0,\n      234,\n      1,\n      0,\n      0.810301460989137\n    ],\n    [\n      65.0,\n      233,\n      2,\n      0,\n      0.8033460836415908\n    ],\n    [\n      66.0,\n      231,\n      1,\n      0,\n      0.7998683949678177\n    ],\n    [\n      67.0,\n      230,\n      1,\n      0,\n      0.7963907062940445\n    ],\n    [\n      68.0,\n      229,\n      0,\n      1,\n      0.7963907062940445\n    ],\n    [\n      71.0,\n      228,\n      0,\n      1,\n      0.7963907062940445\n    ],\n    [\n      72.0,\n      227,\n      1,\n      1,\n      0.7928823771914276\n    ],\n    [\n      73.0,\n      225,\n      2,\n      0,\n      0.7858345338386149\n    ],\n    [\n      74.0,\n      223,\n      0,\n      4,\n      0.7858345338386149\n    ],\n    [\n      75.0,\n      219,\n      0,\n      1,\n      0.7858345338386149\n    ],\n    [\n      76.0,\n      218,\n      0,\n      1,\n      0.7858345338386149\n    ],\n    [\n      77.0,\n      217,\n      1,\n      0,\n      0.7822131765398195\n    ],\n    [\n      78.0,\n      216,\n      1,\n      1,\n      0.778591819241024\n    ],\n    [\n      79.0,\n      214,\n      0,\n      5,\n      0.778591819241024\n    ],\n    [\n      80.0,\n      209,\n      0,\n      2,\n      0.778591819241024\n    ],\n    [\n      82.0,\n      207,\n      1,\n      1,\n      0.7748305061045939\n    ],\n    [\n      83.0,\n      205,\n      0,\n      3,\n      0.7748305061045939\n    ],\n    [\n      85.0,\n      202,\n      0,\n      2,\n      0.7748305061045939\n    ],\n    [\n      86.0,\n      200,\n      0,\n      1,\n      0.7748305061045939\n    ],\n    [\n      87.0,\n      199,\n      0,\n      5,\n      0.7748305061045939\n    ],\n    [\n      88.0,\n      194,\n      1,\n      4,\n      0.7708365344236424\n    ],\n    [\n      90.0,\n      189,\n      2,\n      2,\n      0.7626795340593711\n    ],\n    [\n      91.0,\n      185,\n      0,\n      2,\n      0.7626795340593711\n    ],\n    [\n      94.0,\n      183,\n      0,\n      3,\n      0.7626795340593711\n    ],\n    [\n      95.0,\n      180,\n      1,\n      4,\n      0.7584424255368191\n    ],\n    [\n      96.0,\n      175,\n      1,\n      0,\n      0.7541084688194658\n    ],\n    [\n      97.0,\n      174,\n      0,\n      1,\n      0.7541084688194658\n    ],\n    [\n      100.0,\n      173,\n      1,\n      0,\n      0.7497494603291799\n    ],\n    [\n      104.0,\n      172,\n      0,\n      2,\n      0.7497494603291799\n    ],\n    [\n      105.0,\n      170,\n      0,\n      1,\n      0.7497494603291799\n    ],\n    [\n      106.0,\n      169,\n      0,\n      1,\n      0.7497494603291799\n    ],\n    [\n      107.0,\n      168,\n      0,\n      6,\n      0.7497494603291799\n    ],\n    [\n      108.0,\n      162,\n      0,\n      3,\n      0.7497494603291799\n    ],\n    [\n      109.0,\n      159,\n      1,\n      2,\n      0.7450340549183045\n    ],\n    [\n      110.0,\n      156,\n      0,\n      1,\n      0.7450340549183045\n    ],\n    [\n      111.0,\n      155,\n      1,\n      0,\n      0.740227383596251\n    ],\n    [\n      112.0,\n      154,\n      0,\n      2,\n      0.740227383596251\n    ],\n    [\n      113.0,\n      152,\n      1,\n      1,\n      0.7353574665989072\n    ],\n    [\n      115.0,\n      150,\n      1,\n      1,\n      0.7304550834882478\n    ],\n    [\n      117.0,\n      148,\n      0,\n      1,\n      0.7304550834882478\n    ],\n    [\n      118.0,\n      147,\n      0,\n      1,\n      0.7304550834882478\n    ],\n    [\n      119.0,\n      146,\n      0,\n      1,\n      0.7304550834882478\n    ],\n    [\n      120.0,\n      145,\n      0,\n      4,\n      0.7304550834882478\n    ],\n    [\n      121.0,\n      141,\n      0,\n      4,\n      0.7304550834882478\n    ],\n    [\n      123.0,\n      137,\n      0,\n      1,\n      0.7304550834882478\n    ],\n    [\n      126.0,\n      136,\n      1,\n      0,\n      0.7250840902273048\n    ],\n    [\n      129.0,\n      135,\n      1,\n      0,\n      0.7197130969663618\n    ],\n    [\n      130.0,\n      134,\n      1,\n      0,\n      0.7143421037054187\n    ],\n    [\n      134.0,\n      133,\n      0,\n      1,\n      0.7143421037054187\n    ],\n    [\n      135.0,\n      132,\n      1,\n      0,\n      0.7089304211015899\n    ],\n    [\n      140.0,\n      131,\n      0,\n      1,\n      0.7089304211015899\n    ],\n    [\n      145.0,\n      130,\n      0,\n      2,\n      0.7089304211015899\n    ],\n    [\n      146.0,\n      128,\n      0,\n      5,\n      0.7089304211015899\n    ],\n    [\n      147.0,\n      123,\n      0,\n      4,\n      0.7089304211015899\n    ],\n    [\n      148.0,\n      119,\n      0,\n      1,\n      0.7089304211015899\n    ],\n    [\n      150.0,\n      118,\n      1,\n      0,\n      0.7029225361770002\n    ],\n    [\n      154.0,\n      117,\n      1,\n      0,\n      0.6969146512524104\n    ],\n    [\n      162.0,\n      116,\n      1,\n      0,\n      0.6909067663278207\n    ],\n    [\n      170.0,\n      115,\n      1,\n      0,\n      0.6848988814032309\n    ],\n    [\n      171.0,\n      114,\n      1,\n      0,\n      0.6788909964786412\n    ],\n    [\n      172.0,\n      113,\n      2,\n      1,\n      0.6668752266294616\n    ],\n    [\n      174.0,\n      110,\n      0,\n      3,\n      0.6668752266294616\n    ],\n    [\n      175.0,\n      107,\n      0,\n      1,\n      0.6668752266294616\n    ],\n    [\n      180.0,\n      106,\n      2,\n      1,\n      0.6542926751836228\n    ],\n    [\n      185.0,\n      103,\n      0,\n      1,\n      0.6542926751836228\n    ],\n    [\n      186.0,\n      102,\n      0,\n      6,\n      0.6542926751836228\n    ],\n    [\n      187.0,\n      96,\n      0,\n      7,\n      0.6542926751836228\n    ],\n    [\n      188.0,\n      89,\n      0,\n      1,\n      0.6542926751836228\n    ],\n    [\n      192.0,\n      88,\n      0,\n      2,\n      0.6542926751836228\n    ],\n    [\n      193.0,\n      86,\n      1,\n      0,\n      0.6466846208210225\n    ],\n    [\n      194.0,\n      85,\n      0,\n      1,\n      0.6466846208210225\n    ],\n    [\n      195.0,\n      84,\n      0,\n      1,\n      0.6466846208210225\n    ],\n    [\n      196.0,\n      83,\n      1,\n      1,\n      0.6388932398472752\n    ],\n    [\n      197.0,\n      81,\n      0,\n      2,\n      0.6388932398472752\n    ],\n    [\n      198.0,\n      79,\n      1,\n      0,\n      0.6308059836466768\n    ],\n    [\n      200.0,\n      78,\n      0,\n      1,\n      0.6308059836466768\n    ],\n    [\n      201.0,\n      77,\n      0,\n      2,\n      0.6308059836466768\n    ],\n    [\n      205.0,\n      75,\n      0,\n      3,\n      0.6308059836466768\n    ],\n    [\n      206.0,\n      72,\n      0,\n      1,\n      0.6308059836466768\n    ],\n    [\n      207.0,\n      71,\n      1,\n      2,\n      0.6219213923277095\n    ],\n    [\n      208.0,\n      68,\n      0,\n      1,\n      0.6219213923277095\n    ],\n    [\n      209.0,\n      67,\n      0,\n      5,\n      0.6219213923277095\n    ],\n    [\n      210.0,\n      62,\n      0,\n      2,\n      0.6219213923277095\n    ],\n    [\n      211.0,\n      60,\n      0,\n      1,\n      0.6219213923277095\n    ],\n    [\n      212.0,\n      59,\n      0,\n      3,\n      0.6219213923277095\n    ],\n    [\n      213.0,\n      56,\n      0,\n      3,\n      0.6219213923277095\n    ],\n    [\n      214.0,\n      53,\n      1,\n      4,\n      0.6101870264347339\n    ],\n    [\n      215.0,\n      48,\n      0,\n      4,\n      0.6101870264347339\n    ],\n    [\n      216.0,\n      44,\n      0,\n      1,\n      0.6101870264347339\n    ],\n    [\n      220.0,\n      43,\n      0,\n      1,\n      0.6101870264347339\n    ],\n    [\n      230.0,\n      42,\n      0,\n      2,\n      0.6101870264347339\n    ],\n    [\n      231.0,\n      40,\n      0,\n      1,\n      0.6101870264347339\n    ],\n    [\n      233.0,\n      39,\n      0,\n      2,\n      0.6101870264347339\n    ],\n    [\n      235.0,\n      37,\n      1,\n      0,\n      0.593695485179741\n    ],\n    [\n      237.0,\n      36,\n      0,\n      2,\n      0.593695485179741\n    ],\n    [\n      240.0,\n      34,\n      0,\n      1,\n      0.593695485179741\n    ],\n    [\n      241.0,\n      33,\n      1,\n      0,\n      0.5757047129015671\n    ],\n    [\n      244.0,\n      32,\n      0,\n      5,\n      0.5757047129015671\n    ],\n    [\n      245.0,\n      27,\n      0,\n      5,\n      0.5757047129015671\n    ],\n    [\n      246.0,\n      22,\n      0,\n      3,\n      0.5757047129015671\n    ],\n    [\n      247.0,\n      19,\n      0,\n      1,\n      0.5757047129015671\n    ],\n    [\n      250.0,\n      18,\n      0,\n      7,\n      0.5757047129015671\n    ],\n    [\n      256.0,\n      11,\n      0,\n      2,\n      0.5757047129015671\n    ],\n    [\n      257.0,\n      9,\n      0,\n      1,\n      0.5757047129015671\n    ],\n    [\n      258.0,\n      8,\n      0,\n      2,\n      0.5757047129015671\n    ],\n    [\n      270.0,\n      6,\n      0,\n      2,\n      0.5757047129015671\n    ],\n    [\n      271.0,\n      4,\n      0,\n      1,\n      0.5757047129015671\n    ],\n    [\n      278.0,\n      3,\n      0,\n      1,\n      0.5757047129015671\n    ],\n    [\n      280.0,\n      2,\n      0,\n      1,\n      0.5757047129015671\n    ],\n    [\n      285.0,\n      1,\n      0,\n      1,\n      0.5757047129015671\n    ]\n  ]\n}"}</CodeBlock>

<Prose>{"Recorded output (Python3.12.14, NumPy2.3.5 and scikit-survival0.28.0): 299 rows,96 observed deaths,203 censored endpoints and148 distinct endpoint groups. The scratch/ordinary maximum absolute curve difference is 4.440892098500626×10⁻¹⁶. That agreement checks the curve calculation; the next paragraph separates its computational agreement from its observation assumptions."}</Prose>

<Prose>{"Read the plot and its aligned rosters together. At day 4,299 are at risk just before its event; post-event S is 298/299≈.996656. At day 30 the pre-event count is 264 and the step estimate is ≈.882280; at day 90 they are189 and ≈.762680; at day 180,106 and ≈.654293. At the last endpoint 285, only one record remains in the roster; its final curve level ≈.575705 is not a precise long-term prognosis backed by 299 still-observed subjects. The curve stays above .5, so its median is "}<strong>{"not reached"}</strong>{" on recorded support. The null median result means neither infinite life nor a known median beyond 285. The restricted area through 180 is 142.138354 days, estimating E[min(T,180)] for the declared cohort/origin under the required observation assumptions. It is not the average lifetime among observed deaths."}</Prose>

<Prose>{"Descriptive product-limit interpretation still requires independent censoring or an appropriate conditional observation argument and adequate support. These records do not establish that requirement by containing 0/1 flags. No confidence bands were calculated in this local comparison; a plotted point curve is not uncertainty-free. The early/final roster contrast is more informative than showing a smooth curve with its small tail sample hidden. There is no clinical recommendation, fixed-horizon accuracy or newly selected model in this example. Its job is to transfer the observation/risk-set mechanism to properly sourced records while keeping the changed target visible."}</Prose>

<H3>{"A forecast does not supply its own action rule"}</H3>

<Prose>{"Return explicitly to a "}<strong>{"new stipulated pump decision"}</strong>{", separate from the clinical cohort and the saved 900-pump test scores. A supplied forecast says p=.30 probability of failure by one declared horizon. That probability alone does not say whether an inspection prevents the failure, what it costs, or which consequence should be valued."}</Prose>

<StipulatedDecisionFigure />

<Prose>{"Suppose, deliberately artificially, inspection perfectly prevents this horizon's failure, has no other harm, and costs C in the same units as failure cost 100. Without inspection expected loss is 100p. With inspection it is C. Inspect only when 100p>C; at equality either has the same stipulated expected loss. The probability threshold is C/100. At C=20 it is .2; p=.3 gives losses 30 versus 20, so inspection has 10 lower expected loss under these assumptions."}</Prose>

<Prose>{"Move only the inspection cost to 30: threshold .3 and equal losses 30/30. Move it to 40: threshold .4, losses 30/40 and no inspection minimizes this stipulated loss. The forecast did not change. At cost 0, any positive preventable failure probability supplies a benefit; at cost 120 the threshold is 1.2, so no probability in[0,1] can make this action cheaper in this law. Do not silently clamp that threshold to 1 and conceal the cost boundary."}</Prose>

<Prose>{"For a fixed stipulated prevented-event fraction e∈[0,1], the action loss becomes C+(1−e)p·100. The benefit is ep·100−C, so the threshold for e>0 is C/(100e). At e=.5 and C=20 the supplied p=.3 gives action loss 35, greater than no-action 30. If e=0, an inspection has no prevented-event benefit here; cost 0 is equal loss, positive cost loses. If effectiveness is unknown, the model has not supplied the consequence calculation and the warranted action is unavailable. A Cox coefficient or probability does not fill in a causal prevention effect."}</Prose>

<Prose>{"The complete scratch function implements those explicit losses and statuses, with constant work/state per probability. It has no capacity or hidden optimizer. It supports the displayed modest cost units rather than an arbitrary precision monetary calculation. The ordinary NumPy route below calculates the same two loss arrays for a vector of supplied forecasts, with O(a) work/state. Both routes need the same stipulated effectiveness; a survival-library API cannot choose that missing consequence assumption."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/reliability_decision.py"} filename={"reliability_decision.py"} language={"python"} title={"reliability_decision.py"} />

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/decision_cost_library.py"} filename={"decision_cost_library.py"} language={"python"} title={"decision_cost_library.py"} />

<Prose>{"Save that file as "}<code>{"decision_cost_library.py"}</code>{" beside the scalar module. "}<code>{"from decision_cost_library import expected_losses"}</code>{" followed by "}<code>{"expected_losses([.3],20,effectiveness=1.)"}</code>{" returns arrays containing 30 and 20; compare those losses, rather than thresholding a hazard score. A vector of profiles shares the declared consequence inputs in this ordinary route."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/decision-cost-example.py"} filename={"decision-cost-example.py"} language={"python"} title={"decision-cost-example.py"} />

<CodeBlock language={"output"}>{"{\n  \"probability\": 0.3,\n  \"failure_cost\": 100.0,\n  \"stipulated_effectiveness\": 1.0,\n  \"inspection_costs\": [\n    {\n      \"cost\": 20.0,\n      \"status\": \"stipulated\",\n      \"threshold\": 0.2,\n      \"without_action_loss\": 30.0,\n      \"with_action_loss\": 20.0,\n      \"expected_loss_difference\": 10.0,\n      \"action\": \"inspect\"\n    },\n    {\n      \"cost\": 30.0,\n      \"status\": \"stipulated\",\n      \"threshold\": 0.3,\n      \"without_action_loss\": 30.0,\n      \"with_action_loss\": 30.0,\n      \"expected_loss_difference\": 0.0,\n      \"action\": \"equal-loss\"\n    },\n    {\n      \"cost\": 40.0,\n      \"status\": \"stipulated\",\n      \"threshold\": 0.4,\n      \"without_action_loss\": 30.0,\n      \"with_action_loss\": 40.0,\n      \"expected_loss_difference\": -10.0,\n      \"action\": \"do-not-inspect\"\n    }\n  ],\n  \"missing_effectiveness\": {\n    \"status\": \"consequence-model-missing\",\n    \"action\": null\n  },\n  \"changed_effectiveness_half\": {\n    \"status\": \"stipulated\",\n    \"threshold\": 0.4,\n    \"without_action_loss\": 30.0,\n    \"with_action_loss\": 35.0,\n    \"expected_loss_difference\": -5.0,\n    \"action\": \"do-not-inspect\"\n  }\n}"}</CodeBlock>

<Prose>{"The new main computes the displayed 20/30/40 cases and the separately changed e=.5/missing-e cases; its saved stdout is arithmetic, not a learned policy. The live drawing has one cost control and fixed explicitly stipulated e=1. The separate missing-effectiveness branch and half-effectiveness calculation explain why a consequence assumption matters without adding a fitting switch. Limited inspections would require a named capacity/allocation objective; multiple failure causes can require cause-specific consequences and incidence. Action harms, discounting, uncertainty and distribution shift also change the loss model. None is silently optimized by this small threshold calculation. The existing "}<a href={"/learn/path/full-curriculum/causal-inference-do-calculus?module=classical-ml#4-standardize-the-comparison"}>{"causal identification explanation"}</a>{" explains the additional intervention and adjustment assumptions."}</Prose>

<H3>{"Price the computation that the question actually requests"}</H3>

<Prose>{""}<strong>{"Deeper implementation review:"}</strong>{" the following operation and storage counts help choose a representation for larger data. First establish the report and decision targets above; return here when extending the programs, then use the efficient-code practices in section 16."}</Prose>

<Prose>{"The report's choices determine its work and stored state. Distinguish preparing groups, evaluating/fitting a model and asking a frozen model for predictions."}</Prose>

<ComputationOwnershipFigure />

<Prose>{"Trace the endpoint groups first. In the new cohort, sorting 299 endpoints creates 148 groups; one linear grouped pass updates the KM product. The existing estimator takes O(n log n) preparation and retains O(n+g) sorted row/group state while building O(g) curve state. Supported value or restricted area lookup is O(log g); finding each pre-event roster also uses binary search. The CSV reader retains raw/decoded bytes plus n typed rows, O(bytes+n) storage, then the complete stdout adds O(g) curve rows. Keeping every printed row is a deliberate small descriptive output contract. No n×n pair table is needed."}</Prose>

<Prose>{"For the taught "}<strong>{"static dense Cox"}</strong>{" core, n is the number of subjects, p features, e event rows and g event clocks. Prepared suffix moments make one coefficient likelihood/score/information evaluation O(np²+ep²), retaining O(np+p²) rather than n separate p² outer products. Preparation sorts once in O(n log n). If fitting performs J such evaluations including backtracking trials and I dense linear solves, the work is O(n log n+J(np²+ep²)+Ip³). Actual J/I, rank, separation and diagnostics matter; this formula does not guarantee a finite solution or one universal iteration count. "}<code>{"cox_risk_moments.py"}</code>{" and "}<code>{"cox_regression.py"}</code>{" teach those operations in section 8. The original ordinary report's solvers/settings are its own; this is the inspected scratch contract, not a measured library speed claim."}</Prose>

<Prose>{"For §14's "}<strong>{"history"}</strong>{" core, n instead counts nonoverlapping interval rows. Addition and stable removal need O(log n) tree merges per update, each carrying dense p² covariance. Evaluation is O(n log n·p²+ep²), with O(np²) active-tree state plus input and any retained event traces. More dated rows can therefore increase computation without increasing independent physical sample size. Using the static suffix on these changing competitors would be cheaper only because it computes the wrong likelihood. Use the declared active contract when the history question actually needs it."}</Prose>

<Prose>{"Let a count the requested profiles and q the requested times. Once static coefficients/reference baseline are frozen, §9's "}<code>{"predict_cox_survival"}</code>{" computes a feature score for each profile, looks up q baseline times and fills the a×q output. Its direct-grid work is O(ap+q log g+aq), and the output alone takes O(aq) storage; building its baseline from already prepared data is O(np+n+e), retaining O(n+p) working state plus stored jumps. Let k instead count all stored training endpoint knots in the ordinary API, including censor-only times. The inspected scikit Cox "}<code>{"get_survival_function"}</code>{" instead creates each subject's powered baseline values at all stored training knots before the report queries five times. That route can allocate O(ak) intermediate curve values even when q=5; k need not equal the g failure clocks stored by the local baseline. Chunking subjects reduces peak batch state; it does not remove the requested a×q result if the report keeps it. A direct-grid routine must preserve the same schema/reference/support rather than simply truncate a wrong curve."}</Prose>

<Prose>{"For the taught "}<strong>{"forest"}</strong>{", count actual node sizes and tested features. Section 12's "}<code>{"survival_tree_splits.py"}</code>{" updates the log-rank score and weighted variance tree as equal-feature groups move across a candidate cut. With n_v rows and m_v event groups at node v, one feature costs O(n_v log n_v+n_v log m_v+m_v) on the usual path. The actual implementation checks a numerically near-zero variance using a separate positive O(m_v) sum. If that fallback occurs at every candidate cut, it can add O(n_v m_v) work per feature beyond sorting/sweep, so the fast sweep is not a universal worst-case bound. Sum the actual work over features tested at every nonterminal node and over all trees; there is no justified blanket O(n log n) claim for every depth and bootstrap arrangement. Store saved question nodes and leaf curves, whose total length depends on leaf support. All-censored/no-legal-split/zero-information nodes return leaves rather than using a logarithm of zero event-group count or claiming a useful split. For direct leaf lookup at q times, a profile traverses each tree's depth, performs declared step queries and accumulates the requested probabilities; the work depends on actual path depths, leaf knot counts, tree count and q. The complete local "}<code>{"survival_forest_core.py"}</code>{" in section 12 owns this scope. It holds a leaf's final step through global training follow-up, exposing local-support fractions; that extension is not new observed leaf follow-up. The ordinary report fits two 60-tree candidates with different leaf constraints; the software's representation/defaults need not share every scratch storage tradeoff. No wall-clock ranking follows from these operation counts."}</Prose>

<Prose>{"Finally price "}<strong>{"evaluation"}</strong>{". The taught Fenwick concordance core in "}<code>{"survival_concordance.py"}</code>{" avoids a quadratic pair matrix with O(n log n) work/O(n) state under its exact tied-score contract. The inspected ordinary scikit concordance implementation scans comparable sets and can take O(n²) work; formula agreement does not promise identical algorithmic cost. Weighted Brier on n test subjects and q horizons costs O(nq) plus observation-curve queries, with O(n+q) extra metric state beyond its forecast matrix. IBS then integrates q values in O(q). The taught horizon AUC sorts scores in O(n log n) per horizon; q such calls cost O(qn log n). Empty cases/controls, zero observation support and tie conventions remain the section 11 contracts, not details to erase while making a faster loop."}</Prose>

<Prose>{"The report uses four candidate fits, four validation probability evaluations and one selected-model test evaluation, plus baseline/observation estimates and metrics. Running all four fits is training; asking a stored selected model for 150×5 probabilities is inference. The cost control changes only the constant-size stipulated-loss calculation. These different tasks account for different work."}</Prose>

<Prose>{"An honest report states the population, clock, event, observation protocol, subject split, training-only preprocessing, candidate rule, supported horizon, selected model, absolute probabilities, distinct ranking measures and limits. The next section gives independent problems for explaining and checking those choices."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><H2>{"16. Practise, explain and transfer"}</H2>

<Prose>{"The report is the end of the reading route, but it is the beginning of using these ideas without a worked example beside you. The tasks below change the observation, denominator, model or decision. Start with A–C for the observation and probability foundation, D–J for model interpretation and evaluation, and K–L for a complete report and its action boundary. M–Q revisit the new implementation and history mechanisms."}</Prose>

<Prose>{"Attempt these with the relevant explanation closed. Each changes the data, decision or assumption. An answer should state its event, time unit, denominator and support before giving a number."}</Prose>

<Prose>{"Hints and worked solutions accompany each task."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"A. Repair an observation contract"}</H3>

<Prose>{"A search run times out at 8 seconds. Another run solves at 3 seconds. A colleague labels both times as completion times and uses an eventual 'found solution' flag as an input at launch. Repair both mistakes and state one quantity the data can identify under suitable sampling assumptions."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"Write an equality for the completed run and an inequality for the timed-out one; then fix when the prediction is made."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The observations are(Y=3,δ=1) and(Y=8,δ=0), meaning T=3 and T>8. The eventual flag is unavailable at launch and belongs to the outcome/history, not a launch-time feature. With an appropriate independent observation protocol and input population, completion probability by 8 or restricted compute time to 8 is a meaningful target. Unrestricted completion time after 8 is not identified by these two records alone; runs that may never solve also require an explicit non-event possibility."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"B. Change a tied KM risk set"}</H3>

<Prose>{"Use Y=[1,2,2,4,5] and δ=[1,1,0,1,0]. Calculate every event step, the KM median and RMST through day 5. Explain the censor at 2."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The risk set at 2 still includes the subject censored at 2. Integrate horizontal rectangles, not diagonal segments."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"At1, n=5, d=1 gives S=4/5. At2, n=4, d=1 gives S=(4/5)(3/4)=3/5; the censored subject then leaves. At4, n=2, d=1 gives S=3/10. The median is 4. RMST(5)=1+1(4/5)+2(3/5)+1(3/10)=33/10=3.3 days. The remaining censor at 5 does not lower S, and it does not identify the later tail."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"C. Convert a rate and fit an exposure likelihood"}</H3>

<Prose>{"A constant failure rate is 0.2/day. Find failure probability in the next 3days for a pump still running now, and the same rate per hour. Separately, estimate a constant rate from 3failures in25pump-days. What changes if there are no failures?"}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"A rate has inverse-time units; use 1−exp(−rate×duration). For the likelihood, differentiate dlog r−rE."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The interval probability is 1−exp(−0.6)≈0.451188, independent of current age only under the exponential law. The rate is 0.2/24≈0.00833333 per hour. The MLE from the changed exposure is 3/25=0.12 per day. With no events, the maximum is at zero if admitted or approached as r↓0 if positive rates are required. That boundary estimate does not certify zero future failures."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"D. Follow a Cox score in a changed risk set"}</H3>

<Prose>{"Three subjects have x=[0,1,2]. The x=2 subject supplies one untied event, and beta=log2. Calculate its contribution, score and information for this event. What happens if you add 5 to every x?"}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The weights are 1,2,4. Compute the weighted first and second moments before subtracting their square."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The event contribution is 4/7. Weighted mean x=(0+2+8)/7=10/7, so the score is 2−10/7=4/7. The weighted second moment is (0+2+16)/7=18/7; information is 18/7−(10/7)²=26/49. Adding 5 multiplies all weights by 2⁵ and shifts both the observed and weighted-mean x by 5. The normalized contribution, score and information are unchanged."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"E. Separate a test, a hazard and a probability"}</H3>

<Prose>{"At one event time, n=8,n1=3,d=2 and group 1 has one failure. Find expected group 1 failures and its contribution to U. Then a different PH model gives HR0.5 and reference survival 0.36: find the comparison's failure probability and risk ratio."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The first denominator is a risk-set size. The second calculation raises reference survival to the hazard multiplier."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"Expected failures are 2·3/8=3/4; U receives 1−3/4=1/4. Its conditional variance is 2·3·5·6/(64·7)=45/112, before adding other event times. For the separate PH model, comparison survival is√0.36=0.6, failure probability 0.4 and risk ratio 0.4/0.64=0.625. Neither the single U term nor the HR alone identifies a causal effect or supplies a complete hypothesis test."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"F. Diagnose a changing effect"}</H3>

<Prose>{"Reference hazard is 0.2/day. A comparison has 0.1/day until day 3, then 0.3/day. When does its hazard become worse, and when do its survival curves cross? Would a static neural Cox score remove this failure of PH?"}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"Match cumulative hazards for the crossing; the change in instantaneous rate occurs earlier."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The hazard becomes worse at 3. After 3, comparison cumulative hazard is 0.3+0.3(t−3)=0.3t−0.6. Equating this with 0.2t gives crossing at 6. A static nonlinear score can change the mapping from features to a multiplier but retains a constant hazard ratio for fixed profiles; it cannot represent this time-varying ratio without changing that structure."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"G. Compare pairs without inventing outcomes"}</H3>

<Prose>{"For Y=[1,2,3], δ=[0,1,1] and risk=[9,1,2], calculate C under the declared convention. Why does the huge first risk score not determine the result?"}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The first subject is censored before both other endpoints. Identify the one observable failure ordering."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"Pairs involving the first subject are not comparable because its true event time is unknown after 1. The second subject fails before the third, but receives lower risk 1 rather than 2, so the only comparable pair is discordant and C=0. The high score 9 cannot be scored against latent ordering that was not observed. This also illustrates why C's observed pair population can depend on censoring."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"H. Change the censoring weights"}</H3>

<Prose>{"In the finite horizon lab, let P(T=2)=0.4,P(T=8)=0.6, but only one quarter of follow-up lasts to 10; the rest ends at 3. Predict S(5)=0.5. Calculate full Brier loss, the weighted expectation and the weight on observed day 5 survivors."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The true squared error is 0.25 in either outcome state; only 0.6×0.25 mass is observed surviving past 5."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The full Brier loss is 0.25. All early failures are observed and contribute 0.4·0.25=0.1. Observed late survivors have probability mass 0.6·0.25=0.15 and weight 4, contributing 0.15·4·0.25=0.15. The weighted expectation is 0.25. The unobserved 0.45mass contributes zero to this weighted sum, not a known zero true loss. If no subject can be followed past 5, the required positive observation probability fails."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"I. Preserve competing-event mass"}</H3>

<Prose>{"Four records have endpoints [1, 2, 3, 4] and statuses [cause1, cause2, censored, cause1]. Calculate the final two CIFs and event-free probability. Compare cause1's actual CIF with 1−KM when cause2 is coded as censoring."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"Move each event's mass from the survival just before it. The censor at 3 changes the last denominator without taking mass itself."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"At1, cause 1 receives 1/4 and S=3/4. At2, cause 2 receives(3/4)(1/3)=1/4 and S=1/2. Censoring at 3 leaves one observed subject. Its cause 1 event at 4 receives the remaining 1/2, givingF1=3/4, F2=1/4, S=0. If cause 2 is instead a censor in a one-cause KM, the final cause 1 event exhausts its risk set and 1−KM=1. That is not the actual first-cause probability in the competing system."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"J. Translate a time model and a history"}</H3>

<Prose>{"A common-shape Weibull AFT model has shape 1.5 and a feature time ratio 2. Find its hazard ratio. Separately, a pump enters at 2, receives maintenance just after 4 and fails at 7. Write start–stop rows and explain why 'ever maintained' is not a commissioning-time input."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The hazard multiplier is the time multiplier raised to minus the common shape. Keep entry, update and failure on one clock."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The hazard ratio is 2^(−1.5)≈0.353553. The history rows are(2,4], maintenance 0, event 0 and(4,7], maintenance 1, event 1. There is no observed risk-set membership before 2; the update applies after 4. Knowing that maintenance eventually occurred requires surviving and remaining eligible long enough, so an eventual flag is future information at commissioning. A landmark at 4 would deliberately change the target population to those still eligible then."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"K. Run a changed complete report"}</H3>

<Prose>{"Keep the candidate list, administrative cap, split sizes, validation criterion and metric grid fixed. Change the generator to seed 91, Weibull shape 2 and remove the quadratic feature effect. Predict which candidate will be favored; run the complete accepted program and explain any difference without inspecting test scores to select a model."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The population score is now linear, but finite validation data can still prefer another model. Select on validation first, then compare the chosen test probabilities with KM and the known synthetic law."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The accepted changed run selects linear Cox: validation IBS≈0.162783 versus 0.163096 for quadratic Cox and larger values for the two forests. Its test IBS≈0.134459 versus 0.149032 for training KM, Harrell C≈0.647823 and truncated Uno C≈0.659939. The known-law probability MSE is about 0.000489. The lower C than in the earlier simulation does not by itself mean this procedure failed: the population and sampled event ordering changed. The complete code below executes the specified change, with no hidden dependence on an earlier cell."}</Prose>

<Prose>{"Save the complete program below as "}<code>{"changed-simulated-reliability-report.py"}</code>{". It creates its data internally and has no dependency on a previous cell or the main report file. Use a separate Python3.12 environment with NumPy2.3.5, SciPy1.18.1, pandas2.3.3, scikit-learn1.9.1, lifelines0.30.3 and scikit-survival0.28.0 to reproduce the recorded setup; later versions may produce different fitted values. Keep pandas below3 for this lifelines version."}</Prose>

<Prose>{"Run "}<code>{"python changed-simulated-reliability-report.py"}</code>{" from the directory containing the file. The saved result below describes one declared generated split: four validation values and one selected test result. Use it to trace the unchanged selection protocol, not to infer a general ranking of the model families."}</Prose>

<Prose>{""}<strong>{"Repeat the declared protocol on a different mechanism."}</strong>{" “Before running, predict how removing the quadratic effect and changing the Weibull shape could change selection. Keep the evaluation protocol fixed.” Compare that reasoning with the result and explain which part depends on the changed data mechanism."}</Prose>

<RemoteCodeBlock source={"/learn-assets/survival-reading-flow/programs/changed-simulated-reliability-report.py"} filename={"changed-simulated-reliability-report.py"} language={"python"} title={"changed-simulated-reliability-report.py"} />

<CodeBlock language={"output"}>{"validation IBS linear Cox 0.162783\nvalidation IBS quadratic Cox 0.163096\nvalidation IBS forest leaf10 0.171112\nvalidation IBS forest leaf25 0.168673\nselected: linear Cox\ntest subjects/events: 150 75\nminimum training censor survival through12: 0.75843\ntest IBS model/KM: 0.134459 0.149032\ntest Harrell C / Uno C truncated at10: 0.647823 0.659939\ndynamic AUC at2,4,6,8,10: [0.658342, 0.72712, 0.663594, 0.704974, 0.711102]\nsynthetic oracle probability MSE: 0.000489\nThis is one generated split, not an industrial or clinical benchmark."}</CodeBlock>

<Prose>{"For a further transfer task, choose another seed before running, keep the selection rule fixed and record support and uncertainty. Do not tune seeds until a preferred model wins."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"L. Decide whether a prediction justifies an action"}</H3>

<Prose>{"An inspection costs 30 units and would avert a200-unit failure cost with probability 0.5 conditional on a failure that would otherwise occur by the horizon. Under those stipulated consequences, find the risk threshold. Which part cannot be learned from an ordinary prognostic Cox fit alone?"}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"Expected avoided loss equals event probability times conditional prevention probability times cost. Compare it with the certain inspection cost."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"Expected avoided loss is p·0.5·200=100p, so inspect for p>0.3, with an explicit tie rule at equality. The conditional prevention probability and the relevant counterfactual failure risk are intervention quantities. A fitted association between features and survival does not by itself identify how inspection changes outcomes. Costs, capacity and competing effects may also change the actual decision rule."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"M. Diagnose a tied reverse-KM step"}</H3>

<Prose>{"Four records are still at risk immediately before day 2. One fails at day 2, one is censored at day 2, and the other two leave later. Under this lesson's failure-before-censor-removal convention, calculate the ordinary event-survival factor and the reverse-KM censor-survival factor. A colleague swaps the event flags and calls ordinary KM: explain the differing result. Then specify a useful changed-input check for "}<code>{"estimate_censoring"}</code>{" in "}<a href={"/learn-assets/survival-reading-flow/programs/survival_censoring.py"}>{"survival_censoring.py"}</a>{"."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The ordinary event denominator contains all four subjects. For the reverse step, remove genuine failures before assigning censor probability. Distinguish a step factor from the whole curve: earlier factors would still multiply it."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The ordinary event step is ((4-1)/4=3/4). After that observed failure, three subjects remain eligible for the reverse censor step. One of them is censored, so that factor is ((3-1)/3=2/3). Simply swapping flags and reusing the original denominator gives (3/4), which is a different tied-time estimator."}</Prose>

<Prose>{"In "}<code>{"estimate_censoring"}</code>{", the sorted group yields one genuine failure and one censor. The line computing "}<code>{"censor_risk"}</code>{" subtracts the failure from the remaining training count before the censor factor is applied. A later endpoint leaves the group, but it must not be removed from this earlier denominator. The complete "}<a href={"/learn-assets/survival-reading-flow/programs/censor-aware-metrics.py"}>{"censor-aware metric example"}</a>{" shows how this estimator connects to observable pairs and probability losses; "}<a href={"/learn-assets/survival-reading-flow/programs/survival_metric_inputs.py"}>{"survival_metric_inputs.py"}</a>{" supplies its shared observation contract."}</Prose>

<Prose>{"For an independent implementation check, permute the four records: the grouping and both factors must stay the same. Then separate the failure and censor timestamps and reconstruct both rosters explicitly. Compare only with a library call using the same reverse/tie convention. Keep the event count, censor count and before-step risk count visible so a matching final product cannot conceal a wrong intermediate denominator."}</Prose>

<Prose>{"The correction concerns the chosen observation protocol and estimator. It neither proves that censoring is independent of failure nor licenses a query beyond observed support. Sorting and grouping require "}<InlineMath>{"O(n\\log n)"}</InlineMath>{" time and (O(n)) stored steps; queries use binary search rather than a new scan of all training rows."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"N. Explain an efficient survival-tree split update"}</H3>

<Prose>{"At one event time, let the total risk count be (n=4), the event count (d=1), and the current left-child risk count (n_L=1). Move another still-at-risk subject to the left child while sweeping a feature threshold. Find the change in the log-rank variance contribution."}</Prose>

<Prose>{"Now suppose this subject exits before a later event time. Explain exactly which event-time counts change, what changes in the score (U), and how you would inspect every legal cut without rebuilding a subject-by-event risk matrix. Use "}<a href={"/learn-assets/survival-reading-flow/programs/survival_tree_splits.py"}>{"survival_tree_splits.py"}</a>{" as the complete implementation to inspect after your attempt."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"For this event group, "}<InlineMath>{"c=d(n-d)/(n^2(n-1))"}</InlineMath>{" and "}<InlineMath>{"V=c\\,n_L(n-n_L)"}</InlineMath>{". A subject is present in event-time rosters through its endpoint, including an event tied at that endpoint under the declared convention. Read the old weighted prefix before incrementing it."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"Here (c=1/16). Initially (V=(1/16)(1)(3)=3/16). After the move, (V=(1/16)(2)(2)=4/16), so the change is (1/16)."}</Prose>

<Prose>{"For a general group, with (r) denoting its old left risk count,"}</Prose>

<div className="neural-equation"><MathBlock>{"c[(r+1)(n-r-1)-r(n-r)]=c(n-1)-2cr."}</MathBlock></div>

<Prose>{"This is why the update needs the "}<strong>{"old"}</strong>{" sum of (c_jr_j) over the affected event groups. The subject joins only the event-time prefix whose times are at most its endpoint. Groups after its endpoint do not change. Its score increment is its event indicator minus the sum of (d_j/n_j) over that prefix. A censored subject therefore changes expected failures without introducing an observed failure."}</Prose>

<Prose>{"The implementation sorts each chosen feature once, groups event times, and assigns every row a "}<code>{"stop_bin"}</code>{". "}<code>{"expected_prefix"}</code>{" supplies the score increment. "}<code>{"_WeightedPrefix.query_and_increment"}</code>{" returns the old weighted sum before adding one to the relevant left counts; "}<code>{"variance_prefix"}</code>{" supplies the sum of (c_j(n_j-1)). The iterator yields the score, variance and statistic at each legal distinct-value cut. Inspect those yielded records; a repeated feature value is not a legal cut inside its tied block, and "}<code>{"min_leaf"}</code>{" still applies."}</Prose>

<Prose>{"To test an independent implementation, build a direct, tiny roster calculation for "}<strong>{"every"}</strong>{" legal cut, then compare its (U), (V) and (U^2/V) with the yielded records. Include a censored endpoint tied to an event, repeated feature values, a bootstrap duplicate and a zero-information cut. If (V=0), there is no defined finite statistic from that ratio; do not silently declare a perfect split. The original complete "}<a href={"/learn-assets/survival-reading-flow/programs/survival-tree-forest.py"}>{"tree/forest example"}</a>{" composes this split mechanism with "}<a href={"/learn-assets/survival-reading-flow/programs/survival_forest_core.py"}>{"survival_forest_core.py"}</a>{"."}</Prose>

<Prose>{"For (m) candidate features, (n) row occurrences and (e) distinct event times, the implementation's usual work is "}<InlineMath>{"O(n\\log n+m(n\\log n+e+n\\log e))"}</InlineMath>{", with (O(n+e)) extra state. Near-zero variance uses an explicit nonnegative (O(e)) reconstruction to avoid cancellation; if repeatedly needed, the stated worst case becomes (O(mne)). That qualification matters: a stable fallback is not a universal speed guarantee. The single hand calculation above establishes one transition, not the correctness of the whole optimized sweep."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"O. Keep interval evidence distinct from an exact event"}</H3>

<Prose>{"An exponential lifetime has rate (r>0) per day. A pump was running at day 4 and is found failed at day "}<InlineMath>{"4+\\epsilon"}</InlineMath>{", where "}<InlineMath>{"\\epsilon>0"}</InlineMath>{". Derive a stable log-likelihood contribution. Explain what happens if an input mistakenly sets "}<InlineMath>{"\\epsilon=0"}</InlineMath>{", and how a separately declared exact failure at day 4 differs."}</Prose>

<Prose>{"Finally, suppose the study includes this pump only because it survived independent entry at day 2. Write the conditional contribution, and identify which fields in "}<a href={"/learn-assets/survival-reading-flow/programs/survival_likelihoods.py"}>{"survival_likelihoods.py"}</a>{" must stay distinct."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The observed interval is "}<InlineMath>{"(4,4+\\epsilon]"}</InlineMath>{". Factor (e^{-4r}) out of the survival difference. Conditional entry divides the contribution by (S(2)), not by the survival at the inspection time."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The interval probability is"}</Prose>

<div className="neural-equation"><MathBlock>{"P(4<T\\le4+\\epsilon)=e^{-4r}(1-e^{-r\\epsilon})."}</MathBlock></div>

<Prose>{"so the stable log form is "}<InlineMath>{"-4r+\\log[-\\operatorname{expm1}(-r\\epsilon)]"}</InlineMath>{". "}<code>{"expm1"}</code>{" avoids subtracting two nearly equal floating-point numbers when "}<InlineMath>{"r\\epsilon"}</InlineMath>{" is small. The supplied "}<code>{"interval_terms"}</code>{" and "}<code>{"log_one_minus_exp_negative"}</code>{" routines separate the location, width and stable logarithm; the full typed-data routine assigns the contribution from the observation type."}</Prose>

<Prose>{"Setting "}<InlineMath>{"\\epsilon=0"}</InlineMath>{" gives an empty interval and zero probability. It is an invalid interval record, not an exact event encoded conveniently. A separately declared exact observation uses the density (f(4)=r e^{-4r}), so its log contribution is "}<InlineMath>{"\\log r-4r"}</InlineMath>{". A density has inverse-time units; an interval probability is dimensionless. Changing units or narrowing an interval cannot justify silently switching their observation types."}</Prose>

<Prose>{"Independent entry at day 2 conditions on (T>2). Dividing by (S(2)=e^{-2r}) adds (2r) to the log contribution:"}</Prose>

<div className="neural-equation"><MathBlock>{"-2r+\\log[-\\operatorname{expm1}(-r\\epsilon)]."}</MathBlock></div>

<Prose>{"The entry field and interval lower bound answer different questions. Entry says why the pump is eligible for the sample; the lower bound says when inspection last established it was still running. Keep both in the typed record. Reversed bounds, NaN and an empty interval must not be converted into a plausible finite likelihood."}</Prose>

<Prose>{"Use "}<a href={"/learn-assets/survival-reading-flow/programs/typed-censored-likelihood.py"}>{"typed-censored-likelihood.py"}</a>{" for the complete typed Python route and its supplied scalar-optimizer comparison. The ordinary "}<a href={"/learn-assets/survival-reading-flow/programs/typed-censored-likelihood-library.R"}>{"R route"}</a>{" separately illustrates parametric "}<code>{"survreg"}</code>{" and nonparametric interval estimation; it is source-only here, and its ordinary interval call is not evidence of conditional-entry parity. As a changed implementation task, explain which observation-type branch should reject an empty interval before an optimizer starts, then compare a narrow positive interval against the stable factored expression."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"P. Make one coherent first-event probability law"}</H3>

<Prose>{"A two-cause, two-bin model assigns cause 1 masses ([.2,.1]), cause 2 masses ([.3,.15]), and a beyond-grid tail mass (.25). Find both cumulative incidences through each bin, the two event-free probabilities, and the likelihood contribution of a record censored after bin 1."}</Prose>

<Prose>{"Another implementation predicts CIFs (.7) and (.6) at the same horizon using separate heads. Diagnose the problem. Then explain which cells and gradient a censor-after-bin-1 row should use in "}<a href={"/learn-assets/survival-reading-flow/programs/joint_survival_outputs.py"}>{"joint_survival_outputs.py"}</a>{"."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"The cause-by-time cells and tail belong to one normalization. A censored record permits every later event cell and the tail; it does not select a cause or divide by the number of allowed cells."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"Through bin 1, (F_1=.2), (F_2=.3) and (S=1-.2-.3=.5). Through bin 2, (F_1=.2+.1=.3), (F_2=.3+.15=.45) and (S=.25). The last quantity is exactly the explicit tail mass."}</Prose>

<Prose>{"Censoring after bin 1 permits the later cause-1 cell (.1), later cause-2 cell (.15), and tail (.25). Their "}<strong>{"sum"}</strong>{", (.5), is the likelihood contribution. Its negative log contribution is "}<InlineMath>{"-\\log(.5)"}</InlineMath>{". Averaging these cells would change the observation model."}</Prose>

<Prose>{"The separate CIFs sum to (1.3), exceeding all available probability for mutually exclusive first events. Separate nonnegative outputs are not sufficient: they must share total mass with the event-free state. The complete head uses a single stable normalization over (K B+1) logits, and "}<code>{"joint_output"}</code>{" accumulates each cause across time."}</Prose>

<Prose>{"For an allowed-cell set (A), normalized probabilities (p_i), and "}<InlineMath>{"P_A=\\sum_{i\\in A}p_i"}</InlineMath>{", differentiating the negative log mass gives"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\partial[-\\log P_A]}{\\partial z_i}\n=p_i-\\mathbf{1}_{i\\in A}\\frac{p_i}{P_A}."}</MathBlock></div>

<Prose>{"With cause-major order "}<InlineMath>{"[1{:}1,1{:}2,2{:}1,2{:}2,\\text{tail}]"}</InlineMath>{", the probabilities are ([.2,.1,.3,.15,.25]). The allowed set is the second, fourth and fifth cells. The gradient is therefore ([.2,-.1,.3,-.15,-.25]), which sums to zero as required by invariance to adding one constant to all logits."}</Prose>

<Prose>{"For your implementation check, choose logits equal to the logs of these positive masses, compare "}<code>{"joint_mask_loss"}</code>{" with a directly selected log-sum-exp, and then add the same constant to every logit: the loss and gradient should be unchanged. The complete "}<a href={"/learn-assets/survival-reading-flow/programs/joint-event-mass.py"}>{"joint-event-mass.py"}</a>{" supplies the ordinary float64 PyTorch route and manual-head comparison. Its finite supplied-state check tests the representation, masks and derivatives. It is not a reproduced DeepHit experiment, a trained network or a performance comparison."}</Prose>

</details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"Q. Accumulate a prescribed history, not the final status"}</H3>

<Prose>{"A reference cumulative hazard increases by (.1) at day 2 and (.2) at day 4. A pump begins maintenance just after day 3. Its relative hazard weight is 1 before that change and 2 afterward. Find its survival through day 4."}</Prose>

<Prose>{"A colleague uses its final weight 2 at both event times. Explain the numerical difference and the information mistake. Then state what must be known to use this calculation at commissioning."}</Prose>

<details>

<summary>Get a hint</summary>

<Prose>{"Weight each baseline increment by the feature value in force at that increment. The product of the corresponding survival factors equals the exponential of the negative accumulated hazard."}</Prose>

</details>

<details>

<summary>Show the explained solution</summary>

<Prose>{"The two weighted increments are "}<InlineMath>{".1\\times1=.1"}</InlineMath>{" and "}<InlineMath>{".2\\times2=.4"}</InlineMath>{". Thus (H(4)=.5) and (S(4)=e^{-.5}). Applying weight 2 to both gives (H(4)=.6) and (S(4)=e^{-.6}). That substitutes a different path in which maintenance was already in force at day 2."}</Prose>

<Prose>{""}<a href={"/learn-assets/survival-reading-flow/programs/cox_history.py"}>{"cox_history.py"}</a>{" keeps intervals and their feature vectors separate; "}<code>{"history_path_survival"}</code>{" evaluates each baseline increment against the prescribed path and named feature order. The complete "}<a href={"/learn-assets/survival-reading-flow/programs/entry-and-history-cox.py"}>{"entry-and-history-cox.py"}</a>{" shows the row, baseline and path interfaces together. For a change occurring just after an event timestamp, the old interval's feature value applies to the event under the lesson's ((start,stop]) convention. An update at day 3 affects day 4 but cannot rewrite day 2."}</Prose>

<Prose>{"At commissioning, the future maintenance path must be supplied as a stated scenario or determined by an appropriate prospective policy/model. Substituting the future path that happened to be recorded uses information not available at commissioning. A scenario-specific prognostic curve also does not by itself establish the causal effect of maintenance. To check a changed implementation, use a constant path first and require it to reduce to the static-profile calculation, then move an update across an event timestamp and inspect exactly one affected increment."}</Prose>

</details></div></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Readiness: explain a supported answer"}</H3>

<Prose>{"You are ready to move on when you can reconstruct a changed risk set, identify which outcomes are unknown, distinguish a rate from an event probability and produce a supported report without future leakage."}</Prose>

<Prose>{"As an implementation check, use a fresh small dataset to explain why a scratch routine and an ordinary library call should agree. Match their tie, score, support and baseline conventions before comparing their outputs."}</Prose></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Next in the module"}</H3>

<Prose>{"Continue to "}<a href={"/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml"}>{"K-Means & Hierarchical Clustering"}</a>{". The task changes from predicting labeled event times to finding structure in inputs. Carry forward the habit of defining the observation unit, distance or target, and evaluation question before trusting a visualization."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<Prose>{"Choose a resource for the part you want to see explained another way. The introductory alternatives work after the observation and Kaplan–Meier sections. The derivation and state-history readings become more useful after their corresponding worked examples."}</Prose>

<ul><li>{""}<strong>{"A second introductory textbook route:"}</strong>{" "}<a href={"https://hastie.su.domains/ISLP/ISLP_website.pdf.download.html"}>{"An Introduction to Statistical Learning with Applications in Python, chapter 11"}</a>{". Follow the author's download page to chapter 11, printed pages 469–502. Its progression from censored observations to KM, log-rank comparison and Cox regression is useful if you want a slower second pass with exercises. Bring the explicit endpoint, confidence-level and event-code conventions from this lesson rather than assuming every lab default is identical."}</li><li>{""}<strong>{"A spoken introduction:"}</strong>{" Stanford Online's "}<a href={"https://www.youtube.com/watch?v=7_XK7mGMm1E"}>{"Statistical Learning 11.1: Introduction to Survival Data and Censoring"}</a>{". The creator's title, description and chapter listing identify a censoring illustration around 5:12 and worked KM construction around 10:59. Suggested from the creator's metadata; full playback and transcript have not been assessed. Use it after §§1–3 if narration and a presented example help."}</li><li>{""}<strong>{"A spoken regression continuation:"}</strong>{" Stanford Online's "}<a href={"https://www.youtube.com/watch?v=ujIMPpl2Tr0"}>{"11.3: Estimation of the Cox Model with Examples"}</a>{". Return after the risk-set score and Cox-fitting sections, with the meaning of the event denominator already clear. Suggested from the official title and description; full playback has not been assessed."}</li><li>{""}<strong>{"A concise probability-and-likelihood explanation:"}</strong>{" Germán Rodríguez's "}<a href={"https://grodri.github.io/glms/notes/c7s1"}>{"§7.1 survival and hazard"}</a>{" and "}<a href={"https://grodri.github.io/glms/notes/c7s2"}>{"§7.2 censoring and likelihood"}</a>{", or Stanford's "}<a href={"https://web.stanford.edu/class/stats305b/notes/Survival_I.html"}>{"STATS305B Survival I"}</a>{". These are good follow-ons when the relation among density, hazard, survivor and an observed-data likelihood still feels disconnected. They assume elementary calculus. Translate their endpoint notation to the convention declared here."}</li><li>{""}<strong>{"Deeper statistical derivations:"}</strong>{" Lu Tian's Stanford STAT331 units on "}<a href={"https://web.stanford.edu/~lutian/coursepdf/unit2.pdf"}>{"likelihood"}</a>{", "}<a href={"https://web.stanford.edu/~lutian/coursepdf/unit5.pdf"}>{"Kaplan–Meier"}</a>{" and "}<a href={"https://web.stanford.edu/~lutian/coursepdf/unit7.pdf"}>{"Cox regression I"}</a>{". The "}<a href={"https://web.stanford.edu/~lutian/stat331.HTML"}>{"course index"}</a>{" links the units in sequence. Start with the matching local mechanism, then use these notes to study likelihood reasoning, product-limit uncertainty or score/information in greater mathematical detail."}</li><li>{""}<strong>{"Using and questioning metric APIs:"}</strong>{" "}<a href={"https://scikit-survival.readthedocs.io/en/stable/user_guide/evaluating-survival-models.html"}>{"scikit-survival's evaluation tutorial"}</a>{". After §11, use its Harrell/Uno, cumulative/dynamic AUC and Brier discussions to map your prediction type and horizon to an API. Focus on the metric definitions, interpretation and scorer sections. Check orientation and support rather than copying a reported number."}</li><li>{""}<strong>{"Dated histories and repeated states:"}</strong>{" Therneau, Crowson and Atkinson's "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/doc/timedep.pdf"}>{"time-dependent covariate treatment"}</a>{" and "}<a href={"https://cran.r-project.org/web/packages/survival/vignettes/compete.pdf"}>{"competing risks/multistate vignette"}</a>{". After §§13–14, the first helps explain when a feature is known and why copying future information backward is wrong; start with §§2–3 and the early dated-row example. In the separate competing/multistate text, use the introductory occupancy and transition treatment to compare first-event incidence with returnable states. These are specialist readings, best approached with the small state diagrams already understood."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references"}</H3>

<Prose>{"These sources support definitions, algorithms, conventions and data provenance. They are organized by the question they answer; a documentation page supports an interface contract, while a paper's reported experiment is not automatically an experiment reproduced in this lesson."}</Prose>

<ul><li>{""}<strong>{"Why the survival estimate is a product, and what Cox conditions on:"}</strong>{" "}<a href={"https://web.stanford.edu/~lutian/coursepdf/KMpaper.pdf"}>{"Kaplan and Meier's original paper"}</a>{" and "}<a href={"https://sachsmc.github.io/surv-theory-course/Cox-1972.pdf"}>{"Cox, Regression Models and Life-Tables (1972)"}</a>{". Use the KM method and Cox §§1–11 for the product-limit, risk-set, partial-likelihood and tie reasoning, with endpoint conventions translated explicitly here. "}<a href={"https://web.stanford.edu/~lutian/coursepdf/survweek3.pdf"}>{"Stanford's log-rank notes"}</a>{" develop the group-comparison derivation. The original "}<a href={"https://web.stanford.edu/class/stats305b/slides/Survival-analysis.html"}>{"STATS305B survival slides"}</a>{" remain an additional source for the introductory likelihood/KM/test/Cox treatment; the current "}<a href={"https://web.stanford.edu/class/stats305b/notes/Survival_I.html"}>{"Survival I notes"}</a>{" provide a written alternative."}</li><li>{""}<strong>{"Ordinary KM, cumulative-hazard, Cox and AFT settings:"}</strong>{" the lifelines "}<a href={"https://lifelines.readthedocs.io/en/latest/fitters/univariate/KaplanMeierFitter.html"}>{"KaplanMeierFitter"}</a>{", "}<a href={"https://lifelines.readthedocs.io/en/latest/fitters/univariate/NelsonAalenFitter.html"}>{"NelsonAalenFitter"}</a>{", "}<a href={"https://lifelines.readthedocs.io/en/latest/fitters/regression/CoxPHFitter.html"}>{"CoxPHFitter"}</a>{", "}<a href={"https://lifelines.readthedocs.io/en/latest/fitters/regression/WeibullAFTFitter.html"}>{"WeibullAFTFitter"}</a>{" and "}<a href={"https://lifelines.readthedocs.io/en/latest/jupyter_notebooks/Proportional%20hazard%20assumption.html"}>{"PH-diagnostic notebook"}</a>{". The recorded Python snapshot uses lifelines 0.30.3. Consult the actual coefficient-tie, centered-baseline, shape and confidence settings used by the local example. For the AFT scale, the equation gives "}<InlineMath>{"S(\\lambda)=e^{-1}"}</InlineMath>{"; a conflicting percentage sentence in the documentation does not change that definition. The "}<a href={"https://lifelines.readthedocs.io/en/latest/Survival%20analysis%20with%20lifelines.html"}>{"general lifelines tutorial"}</a>{" helps locate the corresponding worked API examples."}</li><li>{""}<strong>{"Censoring weights, tied pairs and metric integration:"}</strong>{" the "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.metrics.concordance_index_censored.html"}>{"concordance API"}</a>{", "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.metrics.brier_score.html"}>{"Brier API"}</a>{", and scikit-survival 0.28.0's "}<a href={"https://raw.githubusercontent.com/sebp/scikit-survival/v0.28.0/sksurv/nonparametric.py"}>{"nonparametric implementation"}</a>{" and "}<a href={"https://raw.githubusercontent.com/sebp/scikit-survival/v0.28.0/sksurv/metrics.py"}>{"metric implementation"}</a>{". Use the relevant estimator and metric functions to resolve reverse-KM endpoint arithmetic, risk-score ties, Uno truncation, positive observation support and actual IBS normalization."}</li><li>{""}<strong>{"Trees and forests with censored outcomes:"}</strong>{" "}<a href={"https://arxiv.org/pdf/0811.1645"}>{"Ishwaran et al., Random Survival Forests"}</a>{", §§1–5, plus the "}<a href={"https://scikit-survival.readthedocs.io/en/stable/user_guide/random-survival-forest.html"}>{"current RSF tutorial"}</a>{" and "}<a href={"https://scikit-survival.readthedocs.io/en/stable/api/generated/sksurv.tree.SurvivalTree.html"}>{"SurvivalTree API"}</a>{". These support splitting, leaf cumulative hazard, survival and ensemble-output distinctions. Compare the paper's historical event-time tie rule with the metric rule used here before interpreting concordance. Its published performance comparisons are separate from this lesson's worked results."}</li><li>{""}<strong>{"Discrete hazards and neural score/head choices:"}</strong>{" Rodríguez's "}<a href={"https://grodri.github.io/glms/notes/c7s6"}>{"discrete-time treatment"}</a>{" supports the conditional-bin likelihood and complementary log-log connection; its before-atom convention must be translated to the right-continuous convention here. "}<a href={"https://arxiv.org/pdf/1606.00931"}>{"DeepSurv"}</a>{", introduction and §§2–3, supports replacing the linear Cox score while retaining PH for fixed profiles. "}<a href={"https://cdn.aaai.org/ojs/11842/11842-13-15370-1-2-20201228.pdf"}>{"DeepHit"}</a>{", the data/model/loss sections on physical pages 2–3, explains one joint cause-by-time law and a separate ranking term. The explicit beyond-grid tail cell in this lesson is a declared local adaptation; no published neural performance has been reproduced."}</li><li>{""}<strong>{"Full competitors, sampled competitors and scores that vary with time:"}</strong>{" "}<a href={"https://www.jmlr.org/papers/volume20/18-424/18-424.pdf"}>{"Kvamme, Borgan and Scheel, Time-to-Event Prediction with Neural Networks and Cox Regression"}</a>{". Read §§1–3 through prediction to distinguish a declared sampled-risk objective from discarding competitors through arbitrary minibatching. The later metric discussion connects each model's output to an evaluation question; the lesson's small calculations do not reproduce these full neural systems."}</li><li>{""}<strong>{"Entry and changing information:"}</strong>{" "}<a href={"https://lifelines.readthedocs.io/en/latest/Time%20varying%20survival%20regression.html"}>{"lifelines' time-varying regression guide"}</a>{", the "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/doc/timedep.pdf"}>{"time-dependent covariate vignette"}</a>{", and "}<a href={"https://onlinelibrary.wiley.com/doi/full/10.1002/pst.2202"}>{"Sondhi (2022) on conditionally independent left truncation"}</a>{", especially its methods discussion. These support start–stop representation, information timing and the possibility that entry assumptions need conditioning on covariates. They do not turn a prognostic history model into a causal intervention model."}</li><li>{""}<strong>{"R response, fit and prediction contracts:"}</strong>{" "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/Surv.html"}>{"Surv"}</a>{", "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/coxph.html"}>{"coxph"}</a>{", "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/survfit.coxph.html"}>{"survfit.coxph"}</a>{", "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/survreg.html"}>{"survreg"}</a>{" and "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/survfit.formula.html"}>{"survfit.formula"}</a>{". The recorded documentation version is survival 3.8-6. The supplied R programs illustrate counting-process responses, coefficient and baseline tie choices, prescribed-path prediction, parametric intervals and an ordinary Turnbull route. "}<strong>{"R execution remains unverified:"}</strong>{" there is no R coefficient, likelihood, occupancy or native-plot parity result in this lesson's new examples."}</li><li>{""}<strong>{"Competing-event incidence, subdistribution risk and occupancy:"}</strong>{" the "}<a href={"https://cran.r-project.org/web/packages/survival/vignettes/compete.pdf"}>{"competing/multistate vignette"}</a>{", "}<a href={"https://stat.ethz.ch/R-manual/R-devel/library/survival/html/finegray.html"}>{"finegray API"}</a>{" and "}<a href={"https://scikit-survival.readthedocs.io/en/stable/user_guide/competing-risks.html"}>{"scikit-survival CIF tutorial"}</a>{". Use them for the distinctions among actual first-cause incidence, cause-specific rates, a subdistribution denominator and returnable state occupancy. The "}<a href={"https://stat.ethz.ch/CRAN/web/packages/survival/vignettes/compete.pdf"}>{"CRAN-hosted vignette"}</a>{" is an alternative location. The displayed finite probability calculations do not identify hypothetical removal of a competing event."}</li><li>{""}<strong>{"The two real-data contexts:"}</strong>{" the "}<a href={"https://lifelines.readthedocs.io/en/latest/lifelines.datasets.html#lifelines.datasets.load_rossi"}>{"lifelines Rossi dataset entry"}</a>{" supplies the original 432-person cohort context for the historical Cox example. Random assignment of financial aid does not imply that every included feature was randomized, and the fitted conditional associations are not automatically prevention effects. The separate "}<a href={"https://archive.ics.uci.edu/dataset/519/heart+failure+clinical+records"}>{"UCI Heart Failure Clinical Records catalogue"}</a>{", DOI 10.24432/C5Z89R, provides the 299-record supplemental dataset under CC BY 4.0. "}<a href={"https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0181001"}>{"Ahmad et al. (2017)"}</a>{", methods/data and endpoint-results sections, and "}<a href={"https://link.springer.com/article/10.1186/s12911-020-1023-5"}>{"Chicco–Jurman (2020)"}</a>{", dataset and data-availability sections, explain its collection and follow-up limits. The local UCI example is a descriptive risk-set/KM calculation under stated censoring assumptions, not a validated clinical prediction rule."}</li></ul></section>

<H3>{"Code files and reproducible setup"}</H3>

<Prose>{"The lesson's common file index gathers the complete programs and companion modules displayed at their teaching points. The filename beside a code block identifies what that block saves. An excerpt is not a replacement for a complete imported module. Keep related Python files together, then run the named example rather than an import-only module; each example's surrounding explanation identifies its outputs and the corresponding ordinary tool route."}</Prose>

<Prose>{"Start with "}<code>{"kaplan-meier-example.py"}</code>{" beside "}<code>{"survival_estimators.py"}</code>{" for the standard-library route. The library example adds NumPy, lifelines and scikit-survival. The rate, likelihood, Cox, metric, forest, discrete and history examples add only the dependencies named where they are taught. The neural bridge additionally needs NumPy, PyTorch and the earlier "}<a href={"/learn-assets/backpropagation/teaching-autodiff.py"}>{"Backpropagation engine"}</a>{"; save that engine beside the example and supply "}<code>{"--engine teaching-autodiff.py"}</code>{". Its "}<a href={"/learn/path/full-curriculum/backpropagation-automatic-differentiation?module=deep-learning-fundamentals#3-from-individual-numbers-to-tensor-gradients"}>{"Backpropagation explanation"}</a>{" remains the place to learn the reused tensor reverse pass."}</Prose>

<Prose>{"For the real-cohort example, preserve a "}<code>{"programs/"}</code>{" directory beside "}<code>{"data/"}</code>{". Put "}<code>{"real-cohort-descriptive.py"}</code>{", "}<code>{"reliability_cohort.py"}</code>{" and "}<code>{"survival_estimators.py"}</code>{" in "}<code>{"programs/"}</code>{"; put the provided CSV and its attribution/provenance JSON in "}<code>{"data/"}</code>{". The main resolves "}<code>{"../data"}</code>{" from its own file location, so flattening this layout changes what it can find. The CSV is the analysis input; the preserved raw ZIP records the original download and is not extracted during a run."}</Prose>

<Prose>{"The eight "}<code>{".R"}</code>{" files give complete source for the ordinary survival-package interfaces, with commands and limits beside the corresponding Python examples; they have no recorded R output. Each Python result belongs to its named observations, model settings and environment."}</Prose>

<Prose>{"Practice K's changed report has its complete code, result and code controls inside the worked solution. Use the surrounding explanation to distinguish a supplied-state calculation, a changed exercise, a descriptive cohort and a fitted report; they answer different questions."}</Prose>
</div></SurvivalLessonState>; }
export default { title: "Survival Analysis (Cox Regression, Kaplan–Meier, Hazard Models)", readTime: "~4–6 hours read + 4–8 hours practice", hasIntegratedGuide: true, content: SurvivalLesson };
