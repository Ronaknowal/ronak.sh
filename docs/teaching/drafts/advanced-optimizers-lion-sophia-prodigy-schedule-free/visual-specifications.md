# Advanced optimizers: current reading-flow specifications

This revision supersedes the earlier prepared visual instructions. The earlier
packet is preserved in `../../deep-learning-beginner/original/optimizers-before-reading-flow/`.
The whole manuscript is [lesson.md](lesson.md). The independently accepted design,
full deep-research coverage and exact preservation inventory live in
`../../deep-learning-beginner/advanced-optimizers-lion-sophia-prodigy-schedule-free/`.
These are source-bound implementation contracts, not a claim that every current
view has passed its final browser or independent review.

## Reading and placement

Each `OPT_FLOW` anchor replaces one paragraph at its precise manuscript location.
The manuscript establishes a question and one-line viewing instruction before
the picture; the labelled walk-through, formula/code and changed case follow.
All13 sections, nine exercises/solutions, specialist branches, four original
learner programs, two licensed pinned implementations and one new HVP program
remain visible. There is no reading-length cap. One running classifier motivates
the rules; scalar/bowl/matrix/real-image switches are announced with their purpose.

Drawings are actual circuits, matrices, coordinate rulers, contours, byte
allocations, image grids or measured histories, never sentences in cards. Follow
the DL module visual vocabulary. Supplied values cyan; weights amber; computed
values violet; operations grey; derivatives orange with dashed differentiation
routes. Consuming a stored derivative in arithmetic uses a solid forward route.
Colours are labelled adjacent to their entities and backed by text/shape.

## Shared state and controls

Root uses AdvancedOptimizerFlowProvider, SophiaFlowProvider (three separated
cases), OptimizerAdaptationFlowProvider, OptimizerAveragingFlowProvider,
OptimizerMemoryFlowProvider, AdvancedOptimizerStudyFlowProvider and
OptimizerHistoryFlowProvider. Every view of one case reads that same state.
One-to-three controls per just-taught question sit directly beneath its picture,
with a complete current live sentence. No prediction/reveal gate, preset wall,
unexplained mode selector or duplicate slider/number input. Exact arbitrary
values use a single labelled numeric text editor, valid bounded pixel/index/rate
controls use the shared slider. Invalid/nonfinite/out-of-domain text stays local,
retains the last valid result and reports the problem; reset clears invalid drafts.
Pin stores full immutable case inputs/results, not a moving baseline.

## Numerical provenance and implementation boundary

The41 scientific dependencies and71 original rollback sources are checked by
SHA256. Do not rerun fits, change original outputs or invoke historical generator
writers. The guarded pure renderer supports --preview, --check and explicit
--write-reading-flow; preview writes only its disposable authored JSX. The new
HVP program is independently executed, not an extension to the retained fit.
All fitted models/histories/data records below are immutable actual artifacts.
Constructed examples and resource counts are labelled as such; no time or
quality extrapolation is invented. Formula/prose values need direct numerical
checks in addition to the helper tests.

## View-by-view contracts

Each row's control bounds, default state and numerical meaning are intentional.
The implementation mapping is explicit and exhaustive; the renderer refuses
unknown, repeated or missing placements.

### 1. What lies between an input and the next learned prediction?

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `scores` · `OptimizerScoresDrawing/` | Two supplied features [1,2], four learned weights [[.4,-.2],[.1,.3]], four products, two actual sums, scores [.6,.4]. Trace every feature/weight contribution to its class score. Static foundational picture. |
| `probabilities` · `OptimizerProbabilityDrawing/` | Two scores become exp(.6),exp(.4), join the shared denominator, then each numerator divides by that same sum. Bars share 0–1; class0=.549833997312478. Explicit numerator forks attach to the division operators. Static. |
| `objective` · `OptimizerObjectiveDrawing/` | One-hot supplied target [1,0], -log p0=.598138869381592, score residual p-y, feature multiplications and all four returning weight derivatives. Orange derivative routes match visible computed values; no optimizer control yet. |
| `update` · `OptimizerOpeningFlowLab/` | One shared rate slider [0,1] changes the actual four weights by -ηg. At .1 new p0=.65704787; zero rate is exactly unchanged. The picture labels old θ, stored g, η and next θ; using g is grey forward arithmetic. |

### 2. AdamW: smooth direction and magnitude separately

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `adam-histories` · `AdamHistoriesDrawing/` | Declared three incoming gradients and two exponentially weighted histories: signed m versus squared v. All intermediates are computed by the retained rule. Distinguish history from input and correction. |
| `adam-correction` · `AdamCorrectionDrawing/` | At the third update, draw missing initialization mass and the 1-β^t divisors. The corrected moments are not newly observed gradients. Static computed reference. |
| `adam-update` · `AdamUpdateDrawing/` | Same signed rulers show old [ .5,-.7 ], decayed values and next [.4685,-.6679] for η=.03,λ=.1,g=[2,-4]. All points share actual scale and labels. |
| `adam-impulse` · `AdamImpulseDrawing/` | 999 zero gradients then a unit impulse at step1000: corrected normalized update about2.5145667. Show the delayed first/second history effect; no universal one-coordinate-step bound. |

### 3. Lion: keep a directional memory, then take its sign

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `lion-worked` · `LionWorkedFlowFigure/` | Original θ=.5,m=.2,g=-1,β1=.9,β2=.99,η=.01,λ=.2 gives blend .08,new θ .489,new m .188. Both β branches receive the old memory; saved m does not replace the direction before the step. |
| `lion-evidence` · `LionFlowLab view="evidence"/` | Fresh complete sequence context θ0=-.4,m0=-.3,g=[2,2,2]. Three controls selected update, its gradient[-10,10] and initial momentum[-10,10] change the signed blend; the separate memory question exposes β1/β2. θ/g/m signs labelled; g4 reverses the initial blend. |
| `lion-update` · `LionFlowLab view="update"/` | Same case and selected step; η [0,.2],λ [0,1],initial θ[-10,10] control shrinkage and step. Shared ruler shows before/decay/after, including overlapping concentric marks. η0 changes no parameter. |
| `lion-memory` · `LionFlowLab view="memory"/` | Same case and selected update; two controls β1/β2[0,.999] keep present direction and future memory separate. Show current and next m with exact chronology. |
| `lion-sequence` · `LionFlowLab view="sequence"/` | One to twelve editable gradient entries [-10,10] with selected-entry control and append/remove buttons. All sequence rows stay available; never fit/train a browser model. |
| `lion-actions` · `LionFlowActions/` | Pin full θ/m/gradient sequence/all hyperparameters and result; reset full fresh case. Comparison preserves the pinned case as current controls change. |

### 4. Sophia: distinguish a large slope from rapidly changing slope

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `curvature-bowls` · `CurvatureBowlsDrawing/` | Actual contours in a two-coordinate plane: diagonal curvature versus coupled rotated curvature. Label θ1/θ2, contour levels and off-diagonal effect before Hessian notation. No claim a diagonal recovers every eigen-direction. |
| `sophia-coordinates` · `SophiaClipFlowLab view="coordinates"/` | Three actual m=[.2,-.3,0],h=[5,.1,0] lanes,ρ=.5, ε=1e-12. Coordinate index/m[-3,3]/h[-6,6] are three local controls; max floor and clip produce [.08,-1,0]. Negative estimates permitted and visibly floored. |
| `sophia-step-scale` · `SophiaClipFlowLab view="scale"/` | Shared Sophia context old θ=[1,2,3];ρ[.01,2],η[0,.4],λ[0,1] change distinct operations. Default next [.972,2.06,2.94], full three-coordinate readout. Zero rate is null. |
| `sophia-actions` · `SophiaClipFlowActions/` | Pin all three m/h coordinates and scale/rate/decay plus next θ; reset defaults and invalid editor drafts. No stale value paired with changed input. |
| `hessian-probe-worked` · `HessianProbeDrawing/` | Static H=[[2,3],[3,1]],u=[1,1]: Hu=[5,4],u⊙Hu=[5,4]. Show all matrix products and sign multiplication; average over independent sign probes targets the actual diagonal. |
| `hessian-probe-matrix` · `HessianProbeFlowLab view="matrix"/` | Symmetric H default[[4,-2],[-2,1]]. Three arbitrary entries [-6,6] control both off-diagonal occurrences together. Recompute eigenvalues, diagonal and all probes; default PSD eigenvalues0/5 does not force every sampled coordinate nonnegative. |
| `hessian-probe-choice` · `HessianProbeFlowLab view="probe"/` | Shared edited H, one sign-probe selection among all four outcomes. Full enumeration table and actual mean always visible. Default same-sign estimate[2,-1] versus opposite-sign[6,3]. |
| `hessian-probe-actions` · `HessianProbeFlowActions/` | Pin full H/probe/eigenvalues/mean then reset all case and draft fields. Probe comparison concerns the same retained matrix. |
| `hessian-autograd` · `HessianAutogradDrawing/` | Draw scalar loss→g→g·u→Hu, with two separate differentiations and fixed probe. Explain create_graph/recomputed graph as appropriate; complete nonlinear library check in the companion HVP program. |
| `sampled-label-worked` · `SampledLabelDrawing/` | Binary x=2,p=.8,true target1: real g²=.16; model-drawn label branches probability .8/.2 give expected g²=.64. Every branch probability and derivative labelled. Changing this example is announced. |
| `sampled-batch-worked` · `SampledBatchDrawing/` | Two examples x=[2,1],p=[.8,.3],true labels[1,0]; all four independent sampled-label leaves. Their batch-mean derivatives squared and multiplied by N=2 have expectation .425. |
| `sampled-example` · `SampledCurvatureFlowLab view="example"/` | Fresh x=[3,1],p=[.25,.6],labels[1,0]. Three controls example index/input[-5,5]/p[.01,.99] update all four leaves and analytic mean curvature. Initial expectation .96375. |
| `sampled-target` · `SampledCurvatureFlowLab view="target"/` | Same two current examples; example index plus true-label control. Real-label squared mean .680625 initially, while model-sampled expectation stays unchanged when only true targets change. |
| `sampled-enumeration` · `SampledCurvatureFlowLab view="enumeration"/` | Every current sampled pair, its probability, mean ĝ,Nĝ² and weighted contribution shown as an exact live table. Missing N yields half the correct expectation. No Monte Carlo claim. |
| `sampled-actions` · `SampledCurvatureFlowActions/` | Pin all features/probabilities/labels and enumeration; reset fresh fixture and field drafts. True and sampled quantities remain separate. |
| `ggn-chain` · `GGNChainDrawing/` | Two logits from one θ, Jacobian J, actual 2×2 softmax curvature C, JᵀCJ operator and separate residual-weighted logit Hessians join at plus. Grey multiplication consumes already computed derivatives; dashed orange means differentiation only. Label linear-logit residual route zero. |
| `ggn-counterexample` · `GGNScalarDrawing/` | Constructed f1=θ²,f0=0,θ1,y1=1: G=.7864477329659274,logit-curvature term=-.5378828427399902,full H=.2485648902259372. Two routes are shown before the formal chain rule. |
| `sophia-refresh` · `SophiaRefreshDrawing/` | Same θ forks into true-label and model-sampled mean losses. Separate gradient buffers; save true g,clear and obtain ĝ, multiply N once,refresh h,then finally update θ. No new optimizer write between refresh and training gradient. |

### 5. Prodigy: use observed movement to adapt a shared scale

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `prodigy-displacement` · `ProdigyDisplacementDrawing/` | Original scalar θ0=0,target3,d0=.01,γ1,update3: initial/current/next/target positions share a ruler. Only observed θ0-θ and current gradient feed the statistic. |
| `prodigy-global` · `ProdigyFlowLab view="global"/` | Two signed gradient/displacement contributions feed one dot product. Three controls index/g[-5,5]/displacement[-5,5]. Default[-1,2]·[-.5,-.25]=0; abs-first yields1. Cancellation stays visible. |
| `prodigy-state` · `ProdigyStateDrawing/` | Original paper Algorithm4 current d splits into m(dg),v(d²g²) and r/s accumulation; current d drives this update, next max scale is retained separately. All numerical state is from the retained recurrence. |
| `prodigy-worked` · `ProdigyWorkedFlowFigure/` | Full twelve-state original scalar trace, including step7θ7.11008 overshoot. No monotone-convergence assertion. Distinguish this worked example from the fresh live case. |
| `prodigy-objective` · `ProdigyFlowLab view="objective"/` | Fresh θ0=1,target-2,d0=.01,γ=.3,12 steps. Two initial/target[-5,5] controls change quadratic gradient and complete finite trajectory. The target is never an oracle input to d adaptation. |
| `prodigy-scale` · `ProdigyFlowLab view="scale"/` | Same live case; d0[1e-6,.1],γ[.1,1] controls current/next scale and selected full state. γ0 excluded by declared experiment; stationary target case tests null. |
| `prodigy-chronology` · `ProdigyFlowLab view="chronology"/` | Two controls selected state and integer count[1,24], full nine-column table every completed finite update. Identify first scale increase; if nonfinite, report exact stopped step and last valid state. |
| `prodigy-actions` · `ProdigyFlowActions/` | Pin complete scalar and two-coordinate global case, settings and recurrence; reset all. Changing current case never overwrites pinned chronology. |

### 6. Schedule-Free: take a gradient here, update there, evaluate the average

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `averaging-points` · `ScheduleFreePointsDrawing/` | Same ruler before/after labels x average,z fast,y interpolated. Follow x/z→βmix→g(y)→new z→postupdate average x→next y; gradient at y,gradient-driven step at z,evaluation x. |
| `averaging-worked` · `ScheduleFreeWorkedFlowFigure/` | Original start2,target0,β.9,η.2,noise[1,-1,.5,-.5],four computed states including final x1.119624. All table values and points refer to same one-based update. |
| `averaging-history` · `ScheduleFreeHistoryDrawing/` | Rates[.1,.2,.3]: squared[.01,.04,.09],final normalized[1,4,9]/14 versus insertion1,4/5,9/14. The two coefficient meanings are not conflated. |
| `averaging-objective` · `ScheduleFreeFlowLab view="objective"/` | Fresh start-1,target1,noise[-.5,.5,1,-1],β.9,η.2; two initial/target controls[-5,5]. Three-point shared context and full actual trace result. |
| `averaging-mixing` · `ScheduleFreeFlowLab view="mixing"/` | Same case; β[0,1],η[0,.4]. Endpoint β0/1 valid for literal recurrence; compare final x-.208/-.193 with -.19456 at .9. η0 preserves state. |
| `averaging-perturbation` · `ScheduleFreeFlowLab view="perturbation"/` | Same case; selected perturbation and arbitrary noise[-2,2]. Recompute every following state, not just current arrow. No invented randomness; perturbations are explicitly constructed. |
| `averaging-length` · `ScheduleFreeFlowLab view="length"/` | Selected update is shared with the preceding perturbation question; bounded append/remove buttons allow1–12 steps. All x/y/z chronology accessible, no hidden reset or mode wall. |
| `averaging-actions` · `ScheduleFreeFlowActions/` | Pin every objective/β/η/noise state and squared-rate example; reset whole fixture and field drafts. Compare current/pinned final x honestly. |
| `averaging-adam-route` · `ScheduleFreeAdamDrawing/` | Constructed first Schedule-Free Adam step at x=y=z2,target0,η.1,β2.999: g2,v.004,vhat4,new z1.9,new x1.9. Show second moment route, no ordinary first-moment EMA. |
| `averaging-weights` · `ScheduleFreeFlowLab view="weights"/` | Two controls selected rate and value[0,1], same three-rate history. All-zero rates explicitly have no normalized new-point weight; do not silently create a fictitious average. |
| `averaging-storage` · `ScheduleFreeStorageDrawing/` | Draw literal three additional arrays versus compact z/v plus one changing main buffer. Train/eval operation and model mode are different. Memory inventory names actual representations. |
| `averaging-theorem` · `ScheduleFreeConvexDrawing/` | Constructed convex parabola f(θ)=θ²/2,points±1,mean0. Loss of mean0≤mean endpoint loss. Teach theorem assumptions separately; no neural nonconvex guarantee. |

### 7. Train the same real classifier with different update rules

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `study-image` · `OptimizerWorkedStudyFlow view="image"/` | Actual source2778×8 digits,all64raw pixel numbers0…16,zero-based axes and selected pixel18. Actual provenance, no generic cartoon substitutes. |
| `study-model` · `OptimizerWorkedStudyFlow view="model"/` | Deferred near-view saved AdamW11 model with full65×10 actual learned matrix,65inputs including appended1bias,all10score/probability values. Complete650 parameters retained; opacity uses actual values, label numerical convention. |
| `study-gradient` · `OptimizerWorkedStudyFlow view="gradient"/` | Same full source277 model and objective target0; all10p-y residuals,selected normalizedpixel18 multiplications,and separate bias gradients. Draw returned derivatives for all10destinations. |
| `study-roles` · `OptimizerDataRolesDrawing/` | Actual400 selected records split240fitting/80validation/80assessment; candidate choice uses two paired seeds and validation only. Draw boundaries and forbidden assessment feedback to selection. |
| `study-curves` · `OptimizerHistoryFlow/` | Near-view immutable histories24candidates,22points perrun; candidate selector and linear/log axis plus selected-method paired-seed selector. Same loss axes for comparisons; no invented benchmark timings or smoothed extra measurements. |
| `study-state-curves` · `OptimizerHistoryFlow view="state"/` | Same currently selected candidate: actual retained Prodigy d,Sophia clipped fraction[0,1],all recorded x/y report losses. Histories are frozen measurements, not outputs of browser edits. |
| `study-edit` · `OptimizerDigitFlowLab view="image"/` | Fresh actualsource312 image with explicitly declared pixel28raw16 edit (recorded raw value0); reset restores this edited starting case. Two controls selectedpixel0…63/intensity0…16; separate saved-model question has method/seed controls that remain mounted through loading/failure. All12saved snapshots and complete copied optimizer state used, one diagnostic update from fixed step400. |
| `study-target` · `OptimizerDigitFlowLab view="target"/` | One diagnostic target0…9, source truth remains0. Preupdate probability unchanged at fixedimage/model; gradients change. Target is not edited groundtruth for frozenfit reports. |
| `study-coordinate` · `OptimizerDigitFlowLab view="coordinate"/` | Any zero-based feature0…64 including bias,full10gradient/weightchanges plus actual retained statearrays/scalars. All650 parameters participate, not a selectedpixel-only model. |
| `study-representation` · `OptimizerDigitFlowLab view="representation"/` | Only Schedule-Free exposes explained x/evaluation or y/training representation. Gradient always at current trainingy, ordinary evaluation atx; displayed selection changes reported before/afterprobabilities explicitly. |
| `study-probabilities` · `OptimizerDigitFlowLab view="probabilities"/` | Full10before/after probabilities[0,1] and deltas; separate enlarged delta axes explicitlyscaled. No assertion chosen target always rises. Savedcosinenextstep401eta0 is exact parameter/probability null. |
| `study-actions` · `OptimizerStudyFlowActions/` | Pin completeimage,target,method,seed,representation,result and reset. Edits made before delayed loading survive. Oldrequest completion cannot overwrite newer method/seed. Retry uses latest case; finitefailures show status. |
| `rules-program` · `OptimizerFlowProgram file="optimizer_rules.py" title="Complete runnable optimizer_rules.py"/` | Exact complete optimizer_rules.py from draft/public; readable Copy/Copied/error/Download shared reader near viewport, no dropdown. All four optimizers and classifier scratch rules conserved. |
| `study-program` · `OptimizerFlowProgram file="optimizer_study.py" title="Complete runnable optimizer_study.py"/` | Exact complete optimizer_study.py retained24fits/12models/dataroles; sharedreader and codeexplanation visible. Reading/downloading does not rerun fits. |
| `calculations-program` · `OptimizerFlowProgram file="optimizer_calculations.py" title="Complete runnable optimizer_calculations.py"/` | Exact complete optimizer_calculations.py constructs declared handcases/resource arithmetic; no fabricated timing evidence. Sharedreader visible. |
| `curvature-program` · `OptimizerFlowProgram file="optimizer-curvature-instruments.py" title="Complete runnable optimizer-curvature-instruments.py"/` | New complete optimizer-curvature-instruments.py exact author/reviewer verified SHA3e1be3b4…; quadratic/nonlinear HVP fixedprobes/FD/GGN residual counterexample. Publiccopycreated only by explicit guarded implementation. |
| `library-program` · `OptimizerFlowProgram file="optimizer_library_bridge.py" title="Complete runnable optimizer_library_bridge.py"/OptimizerFlowProgram file="lion_pytorch.py" title="Complete pinned Lion library implementation"/OptimizerFlowProgram file="sophia.py" title="Complete pinned Sophia library implementation"/` | Exact optimizer_library_bridge.py plus licensed pinned lion_pytorch.py/sophia.py all visible sharedreaders. EightactualCPUupdates/checkpointresume; declared packageversions and source/license context retained. No claimed samepaper/packagefit. |

### 8. Count the resources you actually need

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `memory-global` · `OptimizerMemoryDrawing global ranks={1} allocations={[{name:'weights',total:140e9},{name:'gradients',total:280e9},{name:'optimizer buffers',total:560e9}]}/` | Static initial global BF16weights140GB/FP32gradients280GB/twoFP32moments560GB;segmentroles and exactglobalpayloads taught before byte/control/sharding terminology. |
| `memory-payload` · `OptimizerMemoryFlowLab view="payload"/` | After bytes/table taught, three controls Pbillions[.001,1000]/buffercount1…4/entrybytes2,4,8 change globalweights/gradients/statecounts. Diagram global only; neverperrank/shardingbeforeitssection. |
| `memory-ownership` · `OptimizerMemoryFlowLab view="ownership"/` | Same globalcase; rankcountinteger1…128 plus arraysshardednone/moments/all. Only declaredshardsdivide; default8ranks moments490GB,all122.5,none980. Report GBandGiB,notactualpeakmemory. |
| `memory-factor-values` · `OptimizerFactorDrawing/` | Declared2×2V[[1,3],[5,7]],rowmeans[2,6],colmeans[3,5],global4;reconstruction[[1.5,2.5],[4.5,7.5]] preservesmarginalsnotcells. Means/sumsnormalizersandallzerolimitexplained. |
| `memory-factor-shape` · `OptimizerMemoryFlowLab view="shape"/` | Two exactintegern/mcontrols1…16384; actualshapeimage labels fullnmcountvsn+m;separatorsschematicatlargeshapes. FP32dense4nm vsfactors4(n+m),includingonerowcornercase. |
| `memory-actions` · `OptimizerMemoryFlowActions/` | Pin fullparameter/buffer/dtype/rank/shard/matrixshape settings and counts then reset; pinnedownershipdoesnotfollowcurrentrankchanges. |
| `resource-work` · `OptimizerWorkDrawing/` | Constructed600updates×1.1=660timeunits versus1000×1=1000,samezeroaxis,totalratio1.515. ExplicitlynotactualGPUtiming;teachupdatecostversustotalwork. |

### 9. Choose a method by a question you can test

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `muon-polar` · `MuonPolarDrawing/` | ActualM[[2,1],[1,2]],idealpolarI versusentrysignallones;bothacton[1,1]/[1,-1] onsharedaxes. Zerooutputvisibleconcentricmark. ExactSVDintuitionnotclaimedfiniteNewtonSchulzimplementation. |

### 11. Reproduce the calculations

| Placement / actual component | Meaning, inputs, controls and required observations |
| --- | --- |
| `file-index` · `OptimizerFlowSupportingFiles/` | Contextual supporting-data/provenance/license links; the shared TopicContent automatic Code & supporting files index owns the complete programme catalogue. All seven inline readers retain Copy/Download. No second identical code index or duplicated undefined-path anchor. |

## Loading, layout and final verification

Model JSON and histories load only when their relevant views approach the
viewport. Cache one promise per immutable file; share the worked/fresh AdamW11
request. Retain edits through deferred loading, expose current loading/error and
retry status, reject wrong snapshot identity/shape, and cancel stale request
effects. Switching method/seed never attaches an old output to new input labels.
RemoteCodeBlock loads visible complete source near viewport, with Copy/Copied/
error and Download; instructional programs are not disclosures. Do not add large
fits/raw data to the initial JavaScript bundle. All12 selected states are separate
assets; no browser fitting campaign is involved.

Own SVGs have titles/descriptions, local labels, adequate labelled endpoints and
attached operand routes. CSS is scoped to `.advanced-optimizer-flow`; never
resize KaTeX SVGs. Controls/buttons are at least44CSSpx and retain keyboard/focus
and amber-theme styling. Inspect actual painted diagrams at1366,390,320 and
768 with200% text; check labels/wires/axes and overlapped zero marks, not merely
page bounding boxes. Matrices and long tables may use honest labelled horizontal
scroll; no page-wide leak. The650map needs a readable selected-row enlargement
and complete textual numeric values, not650microscopic unexplained cells.

Verify all defaults, positive/negative/zero signs, arbitrary non-preset edits,
valid extremes, invalid inputs, full reset/pins, every retained state and shared
view agreement. Cover delayed/error/retry/stale method loading and edits made
while pending. Check zero-rate/cosine401, target-only/preupdate invariance,
Schedule-Free x/y gradients/evaluation, all650parameter gradients and full
optimizer-state copying. Check all24histories/all12snapshot outputs against
independent reference calculations; no retraining is needed. Preserve exact old
program copies and new HVP parity, common opening/index, nine practice solutions,
separate end purposes, file index, Copy feedback and all annotated references.
Final independent whole-source review and current production/loading/browser
receipts precede completion; earlier bounded opening evidence is not whole-page
acceptance. Record source identities and unresolved issues per topic.
