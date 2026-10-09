# Complete NMF drawing and investigation contracts

Status: proposed design ready for DIFFERENT whole review, not accepted content or runtime. This full successor supersedes the frozen partial visual draft for the proposed revision only. All66 jobs remain. `design-arithmetic.json` resolves the previously open finite states; the original arithmetic and scientific receipts remain distinct.

Every picture is inline and precedes its walkthrough. No cards, banners, diagram headings, prediction gates or generic mode selectors. An investigation has only its stated one to three already-taught quantities directly below its picture, a current result sentence and Reset. Step/Back trace named operations without hiding comparison lanes. Static jobs require no pretend controls. Invalid edits retain the last complete valid picture/readout and show a field-specific accessible error.

Draw actual bars, array cells, rays, support rectangles, products and projections. IDs sit outside feature brackets. C0 blue/C1 rose persist across factors, addends, edits and reset; further component IDs use distinct nominal colours plus labels/patterns. Amber marks active work and white outline selection. Reference observations are neutral; query diamonds are labelled. Magnitude colours have adjacent units and a common scale across comparable images; residuals have a separate symmetric signed scale. Numeric values accompany colour. Row IDs/labels never become fitting features.

At390px and768px/root32, stack complete linked stages; use named, keyboard-focusable local horizontal regions only for indivisible arrays. Keep geometric axes equal aspect, captions outside geometry and complete words intact. Do not shrink the whole SVG, hide controls, truncate labels or permit document overflow. Each job's accessible description names input, fixed state, operation and result; all displayed arrays retain exact data text. Native implementation acceptance will require personally viewed default/changed/null/error panes, not just bounds checks.

## Sections1–3: observations, amounts and errors

**D01. One observation.** Three measured intensity bars F0/F1/F2, R0=[2,1,3], common0–4 axis; row ID outside the bracket. Static strip above the matching row. Introduce measurement units, row and feature before multiplication; geometry/cells must agree exactly.

**D02. Two addends and their sum.** Patterns H0=[[1,0,1],[0,1,1]], amounts[2,1], aligned contributions[2,0,2]/[0,1,1] and sum[2,1,3]. Two amount controls0…3, default2/1, changed1/1→[1,1,2], null0/0→zero. Fixed0–6 bin scale covers all edits. Show amount before coefficient; no probability normalization.

**D03. Shape and one output cell.** X0(3,3), W_exact=[[2,1],[1,3],[0,2]](3,2), H0(2,3), outside R/C/F labels. Trace X[R1,F2]=1×1+3×1=4. Static; stack W/H above X without losing contracting component dimension. Bridge zero-based IDs to mathematical indices.

**D04. An outer product across rows.** W[:,C0]=[2,1,0] column times H[C0]=[1,0,1] row gives[[2,0,2],[1,0,1],[0,0,0]]. Show C1 contribution and X0 simultaneously. Static. A zero amount removes a contribution row; a zero pattern value removes its column. Cell area is layout, not value.

**D05. Amount is not probability.** Persistent[2,1] amounts versus normalized[2/3,1/3], with reconstructions[2,1,3] versus[2/3,1/3,1]. Separate amount/fraction scales and literal total3. Static; normalizing changes reconstruction unless dictionary compensation is included.

**D06. Scaling with compensation.** One s∈[.5,3], default1, changed2, null1. Multiply H[C0] by s and divide W[:,C0] by s; original/rescaled factors and invariant contributions remain visible. At2, R0 amount1/pattern[2,0,2]. Reject s0 as noninvertible. Distinguish factor units from contribution units.

**D07. A different dictionary, same product.** Explicit separate H_s=[[1,1,1],[0,1,1]], w_s=[2,1]. One t∈[0,1], default.5: H_new=[[1,1−t,1−t],[0,1,1]], w_new=[2,1+2t], both[2,3,3]. Null0, endpoint1 valid. Draw changed ray directions and cells together. H0 is not this shear fixture: its zeros would yield negative cells.

**D08. Ranking contributions.** R0 amount bars[2,1] versus contribution totals[4,2], different labelled units. One s∈[.5,3] as D06: default1, changed3 reverses coefficient ranking while contributions stay4/2, null1 restores. Both bar sets stay visible. Total intensity is one invariant summary, not a unique causal attribution.

**D09. Signed residual.** Target R0, H0, second amount1. One first amount a∈[0,3], default1→prediction[1,1,2]/residual[1,0,1], changed3→[3,1,4]/[−1,0,−1], null2 exact. Pair bins then signed residual on−3…3 scale. Negative residual is not a negative factor.

**D10. Squared cells.** R1=[1,3,4] versus[1,1,2]: residual[0,2,2], squared areas[0,4,4], half-loss4. Static segment→square→sum. Whole X0 initial half-loss6; MSE divides twice that loss by9. Label side length2 versus area4 and squared units.

**D11. Zero versus missing.** H=[1,1], persistent measured-zero and omitted-second-bin views. One first value x∈[0,4], default2 gives w1/L1 versus w2/includedL0; changed4 gives w2/L4 versus w4/L0; null0 chosenw0. Hatched omitted cell is no information, not numeric0 or evidence of accurate prediction.

**D12. Loss domains and different costs.** Persistent scalar curves f=½(x−y)², KL=x log(x/y)−x+y, IS=x/y−log(x/y)−1, reconstruction-axis y∈[.5,4]. One observed x∈[.5,4], default2, changed1; y=x marks zero in every curve. At x2/y1 values .5/.3862943611/.3068528194; at y3 .5/.1890697838/.0721317748. `D12` supplies all comparison values. Static boundary inset: KL(0,y)=y; positive x/y0 is infinite; IS live domain excludes zeros. Introduce count/noise assumptions after actual costs, not from unlabelled curve height.

## Sections4–6: encoding and coordinates

**D13. Attainable cone.** Separate two-feature H_c=[[1,0],[1,1]], equal-aspect0–2 plane. Two query coordinates0…2, default[1,.5]→amounts[.5,.5], changed[0,1]→[0,.5]/prediction[.5,.5], nullzero→zero. Show rays, query diamond, constrained projection and residual immediately. Interior solution[y,x−y] in C1/C0 order is carefully converted to stored amounts[x−y,y]; outside y>x gives[0,(x+y)/2].

**D14. Clipping is not NNLS.** Static outside query[0,1]: unconstrained[−1,1], clipped[0,1] predicts[1,1]/half-loss.5; constrained[0,.5] predicts[.5,.5]/.25. Show feasible parameter quadrant and three result points persistently. Free-coordinate slope1 after clipping versus0 at optimum explains why reoptimization is necessary.

**D15. Frozen dictionary, new amounts.** H_c and feature orderF0/F1 remain stored. Two query coordinates0…2, defaultoutside[0,1], changedinside[1,.5], nullzero. Trace query→amounts→reconstruction with unchanged pattern rows; malformed shape is an explicit refused example beside code. No query arrow refits H.

**D16. One changing coordinate.** R1/H0, second amount1; one first amount a∈[0,3], default1, changed3, null2. Residual bins and exact L(a)=a²−4a+7 curve, minimuma2/L3. Current/changedloss4, slope0 at2. Hold the other amount visibly fixed before introducing the formula.

**D17. Cached products.** Actual G=H0H0.T=[[2,1],[1,2]], P=X0H0.T=[[5,4],[5,7],[2,4]]. Static aligned contractions trace G01=1 and P_R1,C1=7. Component-by-component versus row-by-component axes distinguish the caches. G stays fixed within the block, not through a changed H.

**D18. Cyclic versus stale operands.** R1/start[1,1], persistent branches. Step/Back/Reset traces first slope−2→w0=2, then cyclic slope−3→w1=2.5 versus stalew0→w1=3. Correctprediction[2,2.5,4.5]/loss3/4. Known exact[1,3] appears after trace as reference, not as its output. Only process controls.

**D19. Boundary KKT.** H_c/query[0,1], w0=0; one w1∈[0,1], default.5 gives gradient[.5,0], changed1 gives[1,1], endpoint0 gives[0,−1]. Draw feasible arrows and gradient cells. Positive outward slope at zero is compatible; negative inward slope is not. Projected gradient suppresses only positive boundary slopes.

**D20. Two complete blocks.** Static factor anatomy followed by Step/Back/Reset through W-first then H using newW. X0/W_start/H0→W1=[[2,1],[2,5/2],[1/2,7/4]]→H1=[[8/11,3/22,19/22],[0,641/605,569/605]]. Half-losses6→15/16→11733/26620. `D20` supplies every intermediate prediction. Show fixed/new operand at each port; newH is not computed from oldW. Null Reset restores complete start. Historical MU order is explicitly different.

**D21. Joint nonconvexity.** Scalar x1, feasible factor points(1,1)/(2,.5), loss0; midpoint(1.5,.75) product9/8/loss1/128. Static factor plane/hyperbola and a separate fixed-H convex slice. Averaging factors differs from averaging products. Neither slice proves unique/global joint recovery.

**D22. Loss change versus stationarity.** Exact scalar L(w)=½(1−w)². One w∈[0,1], default0: loss.5/projected-gradient1 despite zero-locked unchanged state; changed.5→.125/.5; null1→0/0. Persistent actual coordinate and diagnostic cells, fixed explained tolerance. No fabricated fit history or cap-as-convergence claim.

**D23. Storage and work.** Static n3/d3/k2 input9cells, returnedW6, fittedH6, Gram4, cross6 and one-row diagnostic block. Lifetime brackets distinguish retained H/metadata from returned trainingW and workspace/BLAS allocations. Display costs beside real contracting operations, including cache rebuild after factor change and diagnostics; no invented benchmark timings.

## Sections7–9: MU, majorization and initialization

**D24. Ratio multiplication.** X0/W_start/H0; selected H[C0,F2]old1, numerator9, denominator6, new3/2. Actual numerator rows[3,6,9], denominator rows[3,3,6], newH=[[1,0,1.5],[0,2,1.5]]. Static trace of literal products and updated bins. Selected denominator is positive; H0's other zeros are acknowledged. Division is elementwise, not matrix inverse.

**D25. Historical H-first then new-H W.** Explicit original X_old=[[2,1,3],[1,2,3],[3,3,6]], W_old=[[1,.5],[.5,1],[1,1]], H_old=[[1,.2,.8],[.2,1,.8]]. Step/Back/Reset through initial→Hnew→Wnew. Hnew=[[110/53,20/49,42/17],[20/49,110/53,42/17]] travels into W's actual Gram/cross ports; `D25` supplies all Wnew cells and predictions. New direct one-step calculation agrees with rounded original17.06→.03944744; it is not a rerun of the preserved40-sweep main/output. No arrays are inferred from stdout alone.

**D26. Reachable zero lock.** Fixed other contribution1, scalar target2. One amount w∈[0,1], default0: MU0×2=0/loss.5/gradient−1 versus coordinate1/loss0. Changed.25 gives MU.4 versus1; null1 both1. Both outcomes visible. Denominatorw+1 never vanishes, so this genuinely isolates zero locking.

**D27. Count allocations.** Two fixed positive contributions1/1, predicted rate2. One integer observed count0…6, default4→allocated2/2, changed2→1/1/no ratio change, endpoint0→0/0 allocations with KL2. Fractional ownership½ is an explanatory allocation, not a class posterior. Persistent bins show count, rate, fractions and allocated counts. Prediction remains2; an update of one component is not silently an update of both. `D27` retains finite KL and the zero-count convention.

**D28. A touching upper curve.** R0/H0 and fixed second amount1 give f(z)=(z−2)². One current a∈[.25,2], default1; q(z|a)=(a−2)²+(2a−4)(z−a)+½(2+1/a)(z−a)². Both curves and touching point remain visible; bound minimumz=5a/(2a+1). Defaultz5/3: f1/9,q1/3; changeda.5→z5/4:f9/16,q9/8; nulla2 fixed point. Differenceq−f=(z−a)²/(2a)≥0. This is an exact restricted coordinate slice of the positive-interior diagonal auxiliary, not an invented training curve or universal-beta proof.

**D29. Why the block difference is PSD.** G=[[2,1],[1,2]], current[1,1], diagonal bound3I; difference[[1,−1],[−1,1]]. Two increment controls−1…1, default[1,0] gives quadratic1, changed[1,1] gives0. Draw square with side|Δ0−Δ1| and labelled area, actual Gram/difference cells. Boundary assumptions and factor½ in the auxiliary are named after the picture.

**D30. Beta-MM power.** Fixed positive ratio4/oldcoordinate1, persistent heuristic and MM outputs. One continuous beta0…3, default0: gamma½→2 versus4; changed2 both4; endpoint3 gamma½→2. Gamma=1/(2−beta) below1,1 on[1,2],1/(beta−1) above2. Null algorithm difference on[1,2], not no-update. Ratio is deliberately fixed to isolate the exponent, not recalculated from an unshown full NMF state.

**D31. Centering is a different input.** X0 means[1,2,3], centred rows[[1,−1,0],[0,1,1],[−1,0,−1]]. Static signed cells and sample arrows beside nonnegative original. Name PCA mean/restoration but keep NMF initializer uncentred. No performance claim or minmax-as-centering substitution.

**D32. Signed rank-one positive part.** Known nonnegative X_t=[[8.2,2.4],[2.4,6.8]] has singular pairs sigma10/u=v=[.8,.6] and sigma5/u=v=[.6,−.8]. Static second term5[[.36,−.48],[−.48,.64]], whose positive part has two disjoint diagonal rectangles. Signs/zero off-diagonals/norm products are explicit. This is a constructed known factorization, not an SVD executed on X0.

**D33. Select paired signs.** Hold v=[.6,−.8], sigma5; one u-positive entrya∈[0,1], negativeentry−sqrt(1−a²). Default.6 gives paired norm products.36/.64 and selected term scale sigma×product=16/5; changed1 chooses positive; reachabletie.8 gives.48/.48. Both candidates visible; deterministic positive-pair tie with declared numerical tolerance if needed. Zero-norm endpoints skip division. Changing u produces a supplied triplet illustration, not a claim every edited triplet remains X_t's SVD.

**D34. Filled zeros and zero locks.** Exact initializer for X_t: W=[[.8√10,0],[.6√10,4/√5]], H=W.T. One fillδ0…2 affects only original zeros in both factors; default0/null0, changed.1, endpoint2. Show filled/unfilled factors, initial and one H-first/new-H W result persistently. Initial losses7.38/8.2527001034/38.1530020672; one-step losses3.2875310469/3.6527134241/12.2792891054. Original zeros stay0 atδ0; at.1 updated H[1,0]=.0535559043/W[0,1]=.0672734430. Values from `D34`; fill is not guaranteed improvement. Static nndsvda note uses this matrix's mean4.95, outside the live fill range; no false claim thatδ2 is this matrix's mean.

## Sections10–11: ordinary state and changed objectives

**D35. Public fitted anatomy.** X0(3,3)→fit_transform amounts(3,2)/components_(2,3), then new query(1,3)→transform(1,2)→inverse(1,3). Static arrays and fitted boundary, feature order explicit. Use H0/W_exact only as named supplied shape state; ordinary estimator factors await actual content execution and are never invented from it. Negative query and incompatible order are refused examples, not extra controls.

**D36. Compare the same fixed block.** R1/H0, one initial first amount a∈[.5,2], second1; persistent cyclic-CD and simultaneous-MU single-W-block lanes. Defaulta1: CD[2,2.5]/loss3/4/PG²9/4, MU[5/3,7/3]/loss4/9/PG²8/9. Changeda.5: MU[5/4,14/5]/loss21/400; endpointa2 MU[2,7/4]/loss21/16; CD remains[2,2.5]. `D36` includes predictions/gradients. This models published operations, not a browser sklearn fit or claim CD always wins; default reset is the unchanged-input null. The full ordinary fit is separate code.

**D37. Whole fitted state.** Static old H0/features[F0,F1,F2]/fittedk2 snapshot queried coherently. Rejected candidate with negative/nonfinite input or wrong shape returns no published fields; valid candidate publishes factors/order/k/diagnostics together. Actual array slots travel, not sentence cards. Next-fit k mutation does not resize old transform. Future code must test old-query preservation after rejection.

**D38. Penalty coordinate.** Scalar target2/pattern1, one lambda0…3: default0 optimum2, changed1 optimum1, endpoint3 optimum0/outward slope1. Persistently draw data and data+lambda*w curves with separate summands. Static l2 coefficient1 curve has optimum1. Explain boundary before max(0,2−lambda); no probabilistic credibility inference.

**D39. Invariant product, changing penalties.** W_exact/H0, same first-component scales∈[.5,3], alpha_W=.1/alpha_H=.2/l1_ratio1, n=d=3. W mass3/s+6, H mass2s+2; total .9/s+1.2s+3. Default1→5.1, changed2→5.85, endpoint.5→5.4, Reset1. Persistent factor bars and separate dimension-scaled costs, zero residual throughout. Static all-zero-alpha inset has no penalty-preferred scale; no extra live quantity.

**D40. Mask-specific Gram.** R0/H0; one F2 mask weightm0…1, default1, changed0, Reset1. G=[[1+m,m],[m,1+m]], P=[2+3m,1+3m]. Trace included/hatched feature contributions. Fractional m is a weighted objective, not binary observed status. Different masks need different row caches; keep both full/unweighted reference and current Gram visible.

**D41. No observations, no quality evidence.** Static masks[0,0,0] and[1,1,1]; all-missing row chooses amounts0 by convention, with prediction quality undefined. An entirely unsupported feature column remains unidentifiable. Clearly separate literal observed zeros, empty objective and information absence. No hidden mode or fourth mask control.

## Sections12–13: actual saved digits

**D42. Dictionary pixels.** Eight literal saved k8/seed19 H rows as8×8 maps, IDs C1…C8, pixel/flattened-feature address inset and magnified selected static component. Common0…4 per-unit pattern scale covers actual rawH maximum1.389323550924926, verified by `saved-scale-arithmetic.json`. No per-component autoscale, probability or verified physical-part label. Full maps stack on narrow screens.

**D43. Amount, addend and sum.** Three controls only: source row242/256, componentC1…C8, selected gain0…2(default1). RawH, W amount, weighted addend, all-component reconstruction and signed residual stay visible together. Gain0 removes that component; Reset restores saved amounts without fitting. Common0…4 image scale covers rawH and maximum allowed edited reconstruction2.0216123784; residual−4…4 separate. Source changes never change dictionary/component identity. First default row242/C1 has a nonzero contribution; row242/C8 is a separately taught reachable exact-zero null.

**D44. Two rankings.** Static saved row256 eight W amounts versus eight W_c*sumH_c totals, exact full-precision arrays from retained saved-contribution receipt. Largest coefficientC7; total contributionC8; actual16/60 disagreement. Separate units, componentIDs/colours persist. No generic ranking selector and no “most rows” claim.

**D45. Removal without refit.** Fix row256/C8; one removal fractionr0…1, default0/null0, changed1. Original image, removed addend, current sum and residual visible. MSE .0275881615489→.0732625383197; source input /16, full saved factors. Current difference equals r times the actual addend elementwise. Under exact row NNLS optimum total error cannot improve by feasible removal; numerical-fit tolerance remains qualified, while individual pixels can improve. `savedDescriptive` supplies the changed witness; other amounts remain fixed.

**D46. Row roles.** Actual180train/60validation/60test pipeline, source IDs/digit labels outside64 features, fixed/16 ruler. Static arrays and fit/frozen-transform arrows; no reserved/label arrow into dictionary fitting. Predeclared k8seed19 inspection differs from lowest-validation k16seed7 selection. Use exact saved IDs/protocol rather than inventing writer-level splits.

**D47. Every candidate.** Static eight actual k1/4/8/16×seed7/19 training/validation MSE pairs, zero-origin axes, seed shapes/labels and full table. Saved lowest validationk16seed7=.013548 and inspectionk8seed19=.026315 retain distinct purposes. No interpolated uncertainty, new replications or elbow-selects-eight claim.

**D48. Reserved comparison.** Static same-ruler bars mean.069995/PCA8.019678/NMF8.025381,0….08 scale, exact recorded table and matching reconstructed images. PCA's lower retained error is visible. Signed PCA versus nonnegative NMF constraints stated locally. This is reconstruction, not recognition or writer generalization.

**D49. Source address and ruler.** Source row242/label outside raw64 bins; trace pixel(row4,col3)/F35 raw16→1 after/16→saved reconstructed value1.0176746162. Row256 maximum1.227710461 appears as separate actual example. Static source/pixel/units anatomy. Measured range0…1 does not clip predictions; author hash history belongs in technical provenance.

## Sections14–15: identifiability and anchors

**D50. Alternative cones.** Reuse the explicitly separate H_s/w_s shear from D07, one t0…1(default.5,changed1,null0). Equal-axis rays, unchanged observed[2,3,3], complete products/factors. Direction changes show ambiguity beyond scale/permutation. Do not apply this positive shear to H0's forbidden-zero fixture.

**D51. Rectangular positive support.** Exact four-cycle4×4 binary matrix, positive/zero cells and four outlined diagonal positives. One selected diagonal index0…3 changes its row×column rectangle; other witnesses remain visible. A forbidden crosszero prevents one nonnegative rank-one rectangle covering two chosen positives. Expand a literal column×row outer product before lower-bound reasoning.

**D52. Rank3 versus nonnegative rank4.** Static same matrix, first3×3 minor determinant1, alternating row dependence, four required rectangles and identity4×matrix upper bound. Exact rank claims only for this support matrix. Separate positive-epsilon inset removes the forbidden-zero premise and labels rank inference unresolved; no fabricated numerical-rank slider.

**D53. Cone to sum-one slice.** Separate P0=[1,0], P1=[0,1], mixture[2,1]. One first amounta0…3, second1, default2→[2/3,1/3], changed0→P1, Reset2. Draw division by actual row mass; reweight amounts if pattern masses differ. All-zero row is an explicit excluded inset, not a silently reachable extra input. Algebraic fractions are not class probabilities.

**D54. Observed anchors and mixtures.** Equal-aspect unit-sum line, observed A0=[1,0],A1=[0,1],M0=[.75,.25],M1=[.25,.75]. One new mixture t0…1(default.25) gives[t,1−t]; endpoints coincide with anchors/null new direction. Fixed anchor observations remain visible. State exact separability/full-row-rank assumptions before extending this finite example to a recovery theorem.

**D55. Residual selection.** Step/Back/Reset over D54's four observed rows: norm²1/1/.625/.625 selects A0 by original-norm then source-ID tie; project onto its orthogonal complement, residual norms0/1/.25/.75 select A1. Draw projection feet and every residual vector, including potentially signed residuals in general. No prediction gate. DuplicateA0 is a separate static source-ID tie; zero rows are excluded with retained mappings. Algorithm/general assumptions and ordinary QR comparison are in the programme contract.

**D56. Nearly parallel anchors.** P0=[1,0],P1=[1−epsilon,epsilon]; one epsilon0…1(default.1,changed.01,null0). Draw separation√2*epsilon and angleatan2(epsilon,1−epsilon), actual mixture rows; magnified inset labels its own ruler. Null0 collapses rank; noise is a separately labelled static perturbation, not another mode. No invented recovery-error curve or universal noise threshold.

## Sections16–18: application changes and streaming

**D57. Words as bins.** Preserved documents['orbit rocket orbit','rocket orbit rocket','goal team goal','team goal team','orbit rocket goal team'], vocabulary[goal,orbit,rocket,team], count rows[[0,2,1,0],[0,1,2,0],[2,0,0,1],[1,0,0,2],[1,1,1,1]]. Saved normalized component ordering[[.5,0,0,.5],[0,.5,.5,0]], mixed amounts[2,2]. Static token→cell→addend trace. These component numbers are rounded original stdout, not invented full-precision learned factors; original complete code is available. Saved source/output remains historical; learned patterns are not LDA posterior probabilities or certified themes.

**D58. Fixed training IDF.** Explicit new train counts[[2,1,0],[0,1,1],[0,0,2]], vocabulary[orbit,rocket,team], df[1,2,2], smooth IDF=[1+log2,1+log(4/3),1+log(4/3)]. One integer query orbit counta0…4(default2), rocket1 held fixed. Persistent count[a,1,0] and unnormalizedTFIDF[a*idf0,idf1,0] tables. Changed0 removes orbit; all-OOV planet is a separate zero-row inset. Static L2-normalized vector shows different ruler/objective; `norm=None` remains the live route. Training vocabulary/IDF never refit on the query.

**D59. Cone versus simplex abundances.** H0 now explicitly constructed three-band endmembers; one query gain g∈[.5,2], default1, x=g[2,1,3]. Persistent coneNNLS[2g,g]/zero error and simplex[t,1−t], t=clip((g+1)/2,0,1). At1 simplex[1,0]/prediction[1,0,1]/half-loss3; at.5 [.75,.25]/loss3/16; at2 [1,0]/loss19. NormalizedNNLS[2/3,1/3] has loss28/9 at1, so it is not the constrained optimum. Reset1 is unchanged null; exact reconstructed queryzero is outside this declared live gain domain. No physical instrument claim.

**D60. External physical assumptions.** Static same three-band result under two positive dictionary explanations, measured/modelled/residual lanes with actual vectors from D07. Name calibration, endmember evidence and physical sum-one separately from algebra. No substance identity, efficacy or algorithm benchmark from an exact toy product. Further hyperspectral validation is a documented extension destination, not taught by this array alone.

**D61. Statistics from encodings.** Saved-at-arrival w=[2,1],x=[2,1,3] givesA=[[4,2],[2,1]],B=[[4,2,6],[2,1,3]]. Incomingw=[0,2],x=[0,2,2] gives deltaA=[[0,0],[0,4]],deltaB=[[0,0,0],[0,4,4]]. Static actual outer-product cells/contracted axes. Only A/B/H retained, not every old row; saved encodings are not silently current forever.

**D62. Forgetting.** One rho0…1(default1): A=[[4rho,2rho],[2rho,rho+4]],B=[[4rho,2rho,6rho],[2rho,rho+4,3rho+4]]. Changed.5 givesA[[2,1],[1,4.5]],B[[2,1,3],[1,4.5,5.5]]; null0 retains only incoming statistics. Old/new contributions have labelled roles in each cell; rho0 does not itself reset H. Empty new batch is a separate no-op rule, not a live mode.

**D63. Historical encodings are a surrogate.** D61's two rows and storedA/B fixed. One H[C0,F0]=h∈[1,2](default1,changed2,null1); otherH cells fixed. Persistent old encoding[2,1]/[0,2] and freshly optimal amounts[(4h+2)/(2h²+1),(4h²−2h+1)/(2h²+1)]/[0,2]. At2 old half-loss2, fresh2/9, fresh firstrow[10/9,13/9]. `D63` supplies all predictions and changed statistics; displayed storedA/B do not become the fresh ones. Closed-form supported fixture, not full-history refit or a MiniBatch parity claim.

**D64. Three axes and one term.** Actual2×2×2 T0=a⊗b⊗c with a=[1,2],b=[1,0],c=[1,3], slices[[1,0],[2,0]]/[[3,0],[6,0]]. Static address(1,0,1)→6. Axesobservation/feature/time and magnitude scale0…6. An entire zero factor gives zero tensor; a zero entry gives a zero fiber. No full optimizer promised.

**D65. Unfolding and core anatomy.** T0 becomes row-by-(feature,time) matrix[[1,3,0,0],[2,6,0,0]] in declared j-major/t-minor order. Persistent CP rank1 factors and Tucker(1,1,1)core1 reconstruct this T0. A separately labelled structural Tucker inset has2×2×2 core/factorsI2, solecore[0,1,0]=2: different tensor, demonstrating latent mixing rather than claiming another fit to T0. Tensor Algebra section4 supplies unfolding/outer-product foundations; general nonnegative CP/Tucker optimizers are external specialist resources, not an existing local owner falsely claimed complete.

**D66. Magnitude loses phase.** Explicit two-sample DFT coefficient lists[0,1] and[0,−1], identical magnitudes[0,1], second-bin phase0/pi. Draw phasors, magnitude bars and inverse1/2 sums yielding[.5,−.5] versus[−.5,.5]. Static. This finite Fourier convention precedes the STFT magnitude/phase boundary. Exact phasor/DFT prerequisite and optional maintained librosa sources are routed in dependency contracts; no audio inversion experiment or perceptual-quality claim.

## Implementation and source obligations

These are complete proposed contracts, not implemented diagrams. Future topic-local providers separate additive geometry, coordinate/MU/MM, initialization/penalties, saved-data interpretation, rank/anchors and extensions. A topic-local pure model file owns hand calculations; Python source routes own the general algorithms. Runtime ports must agree at intermediate states without pretending to execute sklearn in-browser. Default, meaningful changed, explicit null/unsupported and reset/error states follow this finite specification. Fixed drawn curves are analytical; recorded scientific points retain their original identities. All66 jobs remain independently reviewable before manuscript/runtime release.
