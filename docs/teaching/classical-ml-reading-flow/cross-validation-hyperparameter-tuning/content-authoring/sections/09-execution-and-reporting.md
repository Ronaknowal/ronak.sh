<a id="9-run-a-useful-comparison-within-an-honest-budget"></a>
<a id="execution-and-reporting"></a>
## 9. How do we execute and report the whole procedure?

A reproducible result contains more than a winner and a seed. Another reader must be able to recover the information boundary, the candidate and decision rules, the fitted-object lifetimes, and the exact meaning of each reported number. Begin with a job ledger whose leaves are actual fits.

<!-- Drawing D41: visual-specifications.md#d41. -->

For O outer folds, M candidates and I inner folds, ordinary nested tuning uses O×(MI+1) complete pipeline fits: MI comparisons and one selected refit per outer fold. Separate final selection/refit adds MI+1. If a majority baseline is fitted in each outer operation, add O baseline fits. Our original O=3,M=6,I=3 gives 57+19+3=79. A changed M=8,I=4,O=5 gives 165+33+5=203, before any early-stopping subset, failed retries or additional search. This expression assumes every candidate is evaluated in every inner fold; halving needs its actual rung ledger instead.

The local fit-count investigation changes M,I,O and displays every term immediately. Training sizes remain separate labels; a final all-data refit is not the same amount of work as one smaller inner fit. Empty candidate sets and invalid fold counts refuse. Failed candidate fits consume work even when their scores are unusable, as the new P09 diagnostics showed. The count does not measure elapsed time.

### Parallelism spends memory as well as cores

Independent candidate/fold jobs can run concurrently, but concurrency does not alter which observations they may use. For a concrete **declared planning model**, suppose six independent ready jobs each require two memory units, one coordinator requires one, and capacity is seven. At most floor((7−1)/2)=3 jobs fit concurrently even if six workers are requested. With one worker there are six waves, with two there are three, with three there are two. These are waves of equal-duration hypothetical jobs, not measured wall-clock speedups; unequal job durations, copying, scoring, communication and memory overhead alter an actual schedule. The adjacent schedule investigation changes worker count while this job/memory model stays fixed and labels blocked jobs explicitly.

Choose one level of parallelism intentionally. Outer workers that each launch many inner workers can oversubscribe cores and multiply data copies. `n_jobs`, `pre_dispatch` and numerical-library thread limits control different sources of concurrency. Our new examples use serial estimator jobs and bounded thread settings so their pedagogical execution is easy to attribute. These settings are not an optimum for every machine. For a large job, measure actual memory and time under a representative workload before setting capacity.

Caching can reuse a deterministic transformation only when its inputs, training rows, parameters and fit-relevant metadata are identical and legally available. Two candidate recipes sharing preprocessing on the **same inner training partition** may benefit. A scaler fitted on all rows cannot be called a cache for a smaller fold; its state used forbidden observations. Caching also has serialization/storage costs. Preserve the statistical dependency before optimizing the job graph.

### Read each result column by its role

An ordinary search's `split0_test_accuracy` is accuracy on the first **inner selection-held** split. The API's word `test` does not turn it into a protected outer assessment. `mean_test_accuracy` averages those split scores under the tool's convention; it is not automatically pooled row accuracy or a deployment guarantee. `rank_test_accuracy` ranks that declared metric. A separate balanced-accuracy column does not become the objective unless the rule says so. Timing columns, if actually captured, measure particular fit/score operations; our retained fit-count ledgers do not invent them.

P09 demonstrates callable refit and a failed candidate. Read the selected row's named accuracy cells because callable refit has no `best_score_`. Its cost numbers are a supplied eligibility model, not measured times. P15 prints candidate counts and resources at every iteration because ordinary halving's actual schedule can differ from a hand schedule. Never merge the constructed tasks' observed scores with the original Penguins record or use one experiment's evidence to certify another's implementation.

### A compact report that can be reconstructed

For the retained Penguins experiment, an acceptable report reads:

> We assess species classification for the declared shuffled, stratified row-sampling task on 344 offline Palmer Penguins records. Inputs are bill length/depth, flipper length, body mass and sex. Missing measurements remain and are imputed inside each training-only pipeline. Outer StratifiedKFold uses three folds, shuffle and seed 41; inner selection uses three folds, shuffle and seed 73. The six candidates combine k=3/5/11 with standard/robust numeric scaling, using Euclidean uniform KNN and first-enumerated score ties. Three outer assessment results are 114/115,114/115,112/114, pooled 340/344=0.9883720930 and equal-fold mean 0.9883549453. Training-majority baselines get 51/115,51/115,50/114. Separate final all-development selection ties 3/Standard and 3/Robust at 0.9913043478, selects 3/Standard by enumeration and refits on all 344. The final selection score is not fresh assessment. The recorded workload is 76 pipeline fits plus three baselines; time was not measured. Exact source, data, source-ID arrays, displayed streams and historical environment are supplied. This protocol does not establish new-island or future-season performance.

For a fresh study, also state acquisition and exclusion rules, the independent sampling unit, metric units/aggregation, all adaptive choices, seed/RNG roles, feature schema, target definitions, library versions, failure handling, stopping/resource rules, baseline definitions and protected-data policy. Retain enough split IDs and aligned predictions to reconstruct the reported count. A seed cannot reconstruct a changed dataset order or a different library algorithm by itself.

The [setup and file index](setup-and-files.md) distinguishes exact historical strings from new raw process streams, current CRLF data from historical normalized data, and teaching sources from optional answer assets. This distinction is useful to a learner trying to run a file: an unretained trial history cannot be downloaded, and an answer source should not be mistaken for a required helper.

An experiment is ready for interpretation when those ingredients identify one procedure and the evidence matches its scope. Practice now changes the inputs and asks you to rebuild the reasoning, rather than recalling which method produced the largest familiar number.
