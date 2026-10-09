# Complementary constructed-policy arithmetic review

**Pass: no arithmetic error found.** I read the complete 14,564-byte `design-policy-correction.md`, SHA-256 `8fa0ea99010c807162677b833080b9777e6dde79dec7477d026499642970ed49`, then wrote and ran the independent standard-library checker `check-hand-policies.py`. Its 106 conditions pass; `hand-policy-check.json` records exact rational operands, fold predictions, fitted moments, neighbour identities, densities, mixtures, acquisitions and refusals. The policy remained byte-identical throughout.

This is complementary arithmetic evidence for `/root/ml_successor_independent_review`, **not SAME whole-design closure**. No old programme/checker, Penguins data or library estimator was loaded/run. There was no manuscript, runtime, phase or frozen proposal change. Only this directory's three assigned new files were written.

## F1: selection is separate from the final query statistic

| Resample | Held source groups | k1 pooled accuracy | k2 pooled accuracy | Selected k | Final population mean / variance | T at x=1.5 |
| --- | --- | --- | --- | --- | --- | --- |
| `[0,0,2,2]` | fold0: both0; fold1: both2 | 0 | 0 | 1 by order | 1 / 1 | 1 |
| `[0,1,2,3]` | fold0:0,2; fold1:1,3 | 3/4 | 1/2 | 1 | 3/2 / 5/4 | 0 |
| `[0,0,0,2]` | fold0: three0; fold1: one2 | 0 | ineligible: training counts1,3 | 1 | 1/2 / 3/4 | 1 |
| `[0,0,0,0]` | only one original source group | undefined | undefined | none | not refitted | undefined |

Default held correctness is 0/2 in both folds for both candidates. Their training populations are constant at2 and0, respectively: each median/mean is its constant, measured variance0 and stored squared divisor1. Final refit counts every occurrence, yielding median/mean1 and variance1. The query coordinate is1/2 and its nearest source is2, copy ordinal0, squared standardized distance1/4. Its T=1 differs from internal score0; final resubstitution accuracy1 remains a separate diagnostic.

Changed k1 correctness is1/2 then2/2; k2 is1/2 then1/2. The two fold-training means are2 and1, both population variances1. In the final state the query is centered0; sources1/2 tie at squared standardized distance1/5, so original source1 wins and T=0. Every k2 binary vote tie chooses class0. All six distinct permutations of the default multiset preserve fitted moments, grouped assignments, scores and T. Source/copy metadata determine distance ties rather than entering feature arithmetic.

Enumerating the 256 ordered four-draw samples gives exactly `[i,i,i,i]` for i=0,1,2,3 as undefined: mass4/256=1/64. All other252 have two nonempty source-grouped folds and eligible k1. Conditioning on defined draws therefore changes the denominator to252 and must be stated. The deliberately wrong occurrence-position split of the default gives k1 accuracy1 versus grouped accuracy0, confirming the counterexample. Unknown/noninteger IDs, empty samples, negative/noninteger/wrong-width counts, target mismatches and duplicate occurrence positions refuse explicitly.

## F2: requested gamma and effective mixture weight differ

Vectors below follow A,B,C. Every table normalizes l,g,p exactly and has strictly positive masses.

| State | m / effective pi | l | g | p | acquisition l/p | Proposal |
| --- | --- | --- | --- | --- | --- | --- |
| Default n4, gamma1/2, alpha1 | 2 / 1/2 | 2/5,2/5,1/5 | 1/5,1/5,3/5 | 3/10,3/10,2/5 | 4/3,4/3,1/2 | A by tie order |
| Accept default A once, n5 | 2 / 2/5 | 3/5,1/5,1/5 | 1/6,1/3,1/2 | 17/50,7/25,19/50 | 30/17,5/7,10/19 | A |
| Original A loss changed to1/2 | 2 / 1/2 | 1/5,2/5,2/5 | 2/5,1/5,2/5 | 3/10,3/10,2/5 | 2/3,4/3,1 | B |
| Original history gamma1/4 | 1 / 1/4 | 1/2,1/4,1/4 | 1/6,1/3,1/2 | 1/4,5/16,7/16 | 2,4/5,4/7 | A |

Accept appends immutable trial4,A,1/10 and leaves original rows unchanged. At n5, requested gamma remains1/2 while effective pi is2/5. The changed-A history puts B and earlier C trial2 into better, later C trial3 and A into other; the next newly evaluated B still receives the fixed evaluator loss1/5. Editing original B loss1/5→1/4 is an exact membership/density/acquisition/proposal null.

Empty through three-row histories propose A,B,C,C with uniform priors and no fitted group membership; four accepts recreate the exact default history. All-equal losses likewise retain uniform l/g/p=1/3 and acquisition1, with no better/other membership; supported gamma/alpha changes are null. A separately balanced six-row history gives equal fitted densities and acquisition1. Gamma endpoints1/10,9/10 at n4 give m1,3, not empty/full groups. All combinations of the stated gamma probes and alpha endpoints1/4,2 plus alpha1 preserve positive normalized masses. Unsupported settings, duplicate IDs, nonfinite/negative losses, zero/out-of-range smoothing, invalid gamma and unknown edit IDs refuse without appending or mutating the original history.

The separate unchanged D37 mass table also gives16/7,4/7,16/19. It is not confused with the history-fit gamma1/4 row above. These checks establish the declared tiny finite arithmetic, not bootstrap coverage, new-person generalization, exploration/global optimization, continuous TPE behavior or native interaction.
