# Content-time drawing and investigation refinements

These refine the complete adopted D01–D41/L1–L14b contracts in
visual-specifications.md. They are instructions for actual future drawings and
controls, not a claim to have rendered or personally inspected41 visuals. The
continuous manuscript places every picture immediately after its lead and before
the corresponding explanation; the drawing is on the reading background with no
card chrome. Diagram IDs and exact-value companions are part of that placement.

## Source and numerical roles

- D01/D02/D21–D23 and L7 use retained real observations, fixed fit,86 saved
  transformed rows/predictions. source-roles.json and calculated-inputs.json bind
  them. A new query is an altered copy, never a new ecological observation or a
  newly trained prediction. Row309 is a file position, target Chinstrap separate.
- D03–D20 are specified constructed fixtures, with unchanged baseline arithmetic
  inherited where applicable and new complete P2–P5/P4 successor checks. D18/P1
  has3+3=6 output coordinates. D19 explicitly switches to real4+3=7.
- D24–D31 are computed analytic/constructed transformations from P7/P8/P10/P11.
  The power-likelihood curve uses P7's actual objective and finite candidates,
  bounds[-3,3], input Box–Cox[1,2,4,10,30] or YJ[-3,-1,0,2,8]. Show separate
  variance/Jacobian terms at selected λ, actual search status and evaluation cap.
  No invented parabola or normality guarantee.
- D27 landmarks[1,2,2,4,100],references[0,.25,.5,.75,1]. Mark x2→.375 and
  x3→.625; custom constant atc→.5 differs from ordinary atc→0. Normal epsilon
  is1e-7, with approximate±5.199338 endpoints. Clearly label inverse saturation.
- D28 four requested quantile bins merge to three; full actual edges and
  right-insertion membership are shown. P10's supplied-center Lloyd case is
  [0,1,2,8,9,10], initial[0,10], final[1,9], edge5. KMeans owns suppliedinit;
  separate KBins route owns its initialization. No universal algorithm parity.
- D30 degree1 full knots[-1,0,1,2,3],base[0,1,2],x.5 basis[.5,.5,0],weights
  [2,4,1]→3; x2 basis[0,0,1]→1. Degree2 full[-2,-1,0,1,2,3,4],x.5 row
  [.125,.75,.125,0]. Draw all nonzero intersections. Include degree1 linear
  outside2.5→[0,-.5,1.5] and explain negative extrapolated entries. Degree0
  ordinary outside-constant comparison is unsupported in observed sklearn1.9.1;
  show custom policy and retain the actual failed stream in author evidence.
- D32 singletonα2,μ.5→2/3;100positiveα2→101/102. D33 six rows and all donor
  prior paths remain exact. D34 full-fitα2 is[.75,.75,.25,.25,.5,.5];α0 is
  [1,1,0,0,.5,.5]. OOFα0 is[1,1,0,0,0,1]. Distinguish the two smoothing states.
  Group donor rows and chronological coverage[0,0,1,1,1,1] are literal objects.
- D35/D36 constructed mapping and actual FeatureHasher map have separate labels.
  Ordinary actualwidth4:apple→[1,0,0,0],pear→[0,0,0,-1],banana→[0,-1,0,0].
- D37 original table[[1,2],[2,4],[3,NA],[NA,8],[5,10]],mask and initial medians
  [2.5,6], from observed a[1,2,3,5] and b[2,4,8,10]. The initialized matrix is
  [[1,2],[2,4],[3,6],[2.5,8],[5,10]]; row2 a=3 is observed. D38 first a regression uses observedrows0,1,2,4 and b[2,4,6,10],
  coefficient.4861111111/intercept.0763888889; missinga→3.9652777778. Next b
  uses that newly filleda, coefficient1.8232290981/intercept.5461393472;
  missingb→6.0158266415. These values are rounded labels; full operands appear
  in P14's actual stream. D39 saves all six ordered models from3sweeps, capstatus
  and query rows[3,NA],[NA,6],[NA,NA] with actual final approximate outputs
  [3,6.016891],[2.990954,6],[2.992590,6.003378]. Observed cells never change.
- **D40 completion matrices and D41 supplied pooling arithmetic are distinct
  constructed examples.** Draw the first three actual P16 seed20,m5 completions
  of[8,10,NA,12,NA], with actual per-table Q/U from that same stream. Approximate
  matrices are[8,10,13.844877,12,10.417592],
  [8,10,3.469308,12,3.517166],[8,10,9.252957,12,10.045356], associated
  Q[10.852494,7.397295,9.859663],U[.966187,2.940335,.423083]. Preserve hatch
  only on originalmissingcells; labels say rounded simulatednormal-model draws.
  Do not attach U4 to these tables. D41 separately **given**Q[9,10,11],U4
  illustrates within4,between1,finite-m1/3,T16/3,SE√(16/3). The square0/2
  counterexample is separate from both. Full P16 uses five completions, not just
  the three selected for display, and its actual pooledT≈5.156501 is separate.
- D41 sensitivity uses the actual P16 seed20,m5 normal model/prior and assumed
  δ∈[-2,2]. Baseline pooledmean8.686461347735442; line=baseline+.4δ because
  twooffivecells shift. Endpoints7.886461/9.486461, not a confidence band or an
  estimated MNAR process. Exact numerical/conditional assumptions stay adjacent.

## Focused control domains and current-result contract

Each editor accepts finite values within its named domain, with a numeric/keyboard
equivalent to a slider or point interaction. Invalid drafts remain visible with a
local error and a labeled last-valid state, never stale output labeled current.
Reset restores values, draft text, selected entity, trace index and result. A
bounded trace shows the active input snapshot and calculation status. Controls
are directly below actual geometry;1–3 changing quantities per investigation.

|Investigation|Control domain and held-fixed state|Current result and distinct contrast/null|
|---|---|---|
|L1|Positive billdivisor.1..10,massdivisor1..500;fixedQ/A/B|Default1/100→2vs9.0001;mass1 reverses,commonrescale rankingnull|
|L2|Q/A/Bselector;bill0..100,mass0..10000;fixeddivisors1/100|DefaultAnear;A mass4400→17andBnear;A=Q→0;translationallpointscommonnull|
|L3|Lasttrainvalue0..1000,rulerchoice,futurequery0..1500|Defaultrobust150→73.5;100→1000leavescentralIQRhereunchanged;queryonlyfitnull;constantfixtureseparate|
|L4|Querystring/None;unknownpolicy3choices;mincountinteger1..8|Vocabulary/fullvectorvisible;new/rare/missingdifferent;no-rarebucketfallback;frequenta/null;@collisionerror|
|L5|ActualQ/donorcellselector;numeric-10000..10000orblank;k1..3|200baseline;D2cblank→300;D1c140→220;unusedD3ctargetnull;nooverlapfallback;alltargetmissingrefusal|
|L6|Numericquerycellselector;finite-10000..10000orblank;fixedP1state|Fullsixcoordinatesandarraysvisible;third9→2;queryeditdoesnotrefit;optionalpincompareswholevalidrow|
|L7|Retainedrecordselector;featureselector;numeric0..1000000orblank/categorystringorNone|Allsevenoriginal/alteredcoordinates;massblank→−.2368;sexonlycategorymoves;noaccuracyrefit;physicallyinvalidnegativerefusal|
|L8|BC/YJmethod;x−10..30;λ−3..3|YJ−3,2→−ln4;near0/2stable;λ1identity;BCnonpositiverefused;fixedlearnedλpaneldistinct|
|L9|Query−10..1000;uniform/normal;fixedfivelandmarks|3→.625or.318639;2tie.375;1000saturates;querybatchfitnull;constantpolicyseparate|
|L10|Twoangles0..360;fixedperiod360|350/10chord.347296;0/360same;30/150same sine/distinctcos;oppositepoints|
|L11a|Supportfixture(singleton/100/absent);α0..100|2/3default;α0matchedmean;largerαpriorpull;n0fallback;nosmoothing-leakageclaim|
|L11b|Category/target/foldcellselector;string/0or1/fold0or1editor;inspectedrow0..5;fixedα2|Row05/9;row3targetflip→7/9,row3own4/9null;row0ownnull;emptydonorfolderror;α0fixtureseparate|
|L12|Tokenselector;count0..10;bucket/signcombinedselector;fixedconstructedwidth2|[2,2]collision;oppositesigncancellation;zerocountmappingnull;actualFeatureHashermappingseparate|
|L13|Originalmissingcellselector;finite−20..20orblank;turnindex0..6;fixedα1,maxsweeps3|Fullinitial/firstturnvisible;currentpredictorupdateandobservedinvariance;capstatus;newrowusessequence;allmissingtrainingrefusal|
|L14a|Q/Ucellselector;Q−100..100orU0..100editor;fixedm3|Qbar10/T16/3initial;QchangesB,Uchangeswithin;identicalQ/B0;m1/negativeUrefusalfixtures|
|L14b|δ−2..2only;fixedP16seed20,m5,draws/prior|Mean8.686461+.4δ;δ0baseline;nomissingnull;assumedshiftlabel|

The ranges are local teaching domains, not recommended deployment thresholds.
The shared no-prediction/no-grading rule applies to all16 activities. Source/model
checks and known fixture calculations do not substitute for later native dragging,
keyboard operation,320/390px,intermediatewidth and200%text inspection. Runtime
must test actual endpoints/intermediates and reset/quick-edits once implemented.
