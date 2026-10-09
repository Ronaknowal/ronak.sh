## 13. Separate a representation decision from its evaluation

The saved pictures showed what one dictionary does. How do we decide which representation to use without letting the examples used for judging it also choose it? Follow the rows before comparing the errors.

<!-- figure:D46 -->

The CSV has 300 observations, each with a source ID, a descriptive digit label and 64 measured pixel features. Only the 64 features enter a dictionary fit. The fixed divisor 16 converts counts to intensity units before fitting; it is not estimated from the dataset. The original split uses seed 19 twice, preserving label proportions: 180 rows for training, 60 for validation and 60 reserved for the test comparison. Labels influence this stratification and the balanced subset selection; they do not become factorization features.

The arrows show a direction of information. **Training rows** determine the dictionary. **Validation rows** are encoded against that fixed dictionary and help compare candidate settings. **Reserved test rows** assess a declared representation after its intended choice. Encoding a reserved row optimizes that row's amounts with H fixed; it does not send the row back into dictionary fitting. In a later supervised system, learned vocabulary, IDF, dictionary and classifier must all be fitted within the training fold, then frozen for its validation/test rows.

The diagram shows actual source IDs, not just hypothetical buckets. In this protocol source row 242 is the first reserved observation, row 256 the second; row 31 is a training observation and row 286 a validation observation. These are addresses in the original source collection, not local array indices or writer IDs. The full ordered partition is retained with the new controlled study below so a comparison can be traced back to the exact rows.

### Inspect all the candidates before naming a choice

Which of the recorded rank and seed choices reconstructed validation rows best? Look at every recorded point, with a zero-origin error axis.

<!-- figure:D47 -->

Each training/validation pair belongs to one actual fit, not an average with invented uncertainty bars. The lower validation error among these eight recorded candidates is k=16, seed 7, at approximately 0.01354792. The k=8, seed-19 dictionary used in section 12 was chosen as a fixed, inspectable eight-pattern example; its validation error is approximately 0.02631530. It is not the winner of this candidate comparison, and the plot does not justify calling eight an automatically selected elbow.

| Components k | Seed | Training MSE | Validation MSE | Fitting iterations |
|---:|---:|---:|---:|---:|
| 1 | 7 | 0.07214412726956479 | 0.07280297762810437 | 6 |
| 1 | 19 | 0.07214412726956489 | 0.07280297804796376 | 6 |
| 4 | 7 | 0.04040871277824657 | 0.041899149163385656 | 192 |
| 4 | 19 | 0.040408712822337434 | 0.041899935779433586 | 207 |
| 8 | 7 | 0.02475004181007092 | 0.025548017870485402 | 261 |
| 8 | 19 | 0.025147105358696256 | 0.026315303314664616 | 448 |
| 16 | 7 | 0.012295160150866928 | 0.013547922081604519 | 575 |
| 16 | 19 | 0.012729497371186178 | 0.015288655568708278 | 560 |

Different seeds can reach different factors and errors because joint fitting is nonconvex. A larger k expands the set of possible exact products: an earlier solution can be embedded by adding unused components. Thus the globally best training objective cannot worsen merely because k grows. A particular finite optimizer run need not reach that global best, however. The observed downward trend is an outcome of these runs, not a theorem about every call to `fit` or about reserved performance.

Choosing settings from validation is legitimate, but repeated adaptation to the same small validation set can overfit that comparison too. Use a declared search and an appropriate resampling strategy when uncertainty or task stakes demand it. These two seeds are individual runs, not enough by themselves to estimate broad algorithm variability. This lesson retains their individual outcomes and avoids a fabricated confidence interval.

### Compare the declared representations on reserved rows

What does the recorded test comparison actually measure? Compare reconstruction under three different model classes, then look at matched images in a separately declared study.

<!-- figure:D48 -->

The first three bars retain the **original fixed-eight-component comparison**. The mean baseline predicts the same training-mean image for every reserved row. PCA8 stores a training mean and eight signed orthogonal directions; a query is centered, projected and reconstructed with the mean added back. NMF8 uses the previously inspected eight nonnegative patterns and nonnegative query amounts. Their recorded mean squared errors over the same 60×64 measured cells are:

| Original reserved comparison | MSE |
|---|---:|
| Training-mean image | 0.06999462363160687 |
| PCA8 | 0.019678463136677867 |
| NMF8, fixed k=8/seed19 inspection | 0.02538089143047506 |

PCA8 has the lower recorded error. Nonnegative addition may be useful for a desired representation, but it does not automatically minimize reconstruction error across these different model classes. PCA is an affine model that stores a mean in addition to its directions; NMF is a cone model with nonnegative amounts. Equal coordinate counts do not make their constraints or parameter counts identical. Neither reconstruction metric measures digit-recognition accuracy.

The matched images below the bars belong to a **new, separately declared six-coordinate comparison**, not to missing historical PCA8 factors. Both dictionaries/bases were fitted only on the same 180 training rows. The declared settings were PCA6 with full SVD and no whitening, and NMF6 with NNDSVD-average initialization, coordinate descent, seed 23, Frobenius loss, zero penalties, tolerance 10⁻⁶ and a 3,000-iteration cap. Source rows 242 and 256 were specified for inspection before these new reconstructions were produced. We did not choose six or these examples by minimizing their reserved errors.

For the new comparison, read the observation, training-mean prediction, PCA6 prediction and NMF6 prediction at the **same pixel addresses and intensity ruler**. This ruler extends from −0.25 to 1.25 because signed PCA can predict negative cells and both methods can overshoot 1. A zero tick separates negative intensity predictions from positive ones; values are not clipped or independently autoscaled. The earlier dictionary maps used 0–4 per unit amount, a different displayed object. Here we compare actual reconstructed intensity.

| New predeclared six-coordinate comparison | MSE over all 60 reserved rows | Row 242 MSE | Row 256 MSE |
|---|---:|---:|---:|
| Training mean | 0.06999462363160687 | 0.04595146273389275 | 0.06796480908805942 |
| PCA6 | 0.02416372023704315 | 0.021948620787064027 | 0.024197862895577522 |
| NMF6 | 0.030231907695106697 | 0.026957889373735507 | 0.03327840298161405 |

The new NMF fit took 229 fitting iterations, below its cap, and emitted no captured convergence warnings. That is useful solver information, not a proof of a global optimum or of negligible statistical uncertainty. The mean baseline agrees with the original comparison because its training rows and rule are unchanged. The PCA/NMF numbers differ because the new study has different coordinate counts and NMF initialization/settings. Keep these roles separate rather than silently using new images as evidence for the old eight-coordinate numbers.

The full reserved prediction ranges in this new study are mean `[0,0.7381944444]`, PCA6 `[-0.2351021065,1.2007030976]` and NMF6 `[0,1.1729489320]`. A negative PCA cell is an allowed affine-model prediction, not a negative observed count. If an application requires output clipping, that defines another prediction rule and its metrics must be evaluated explicitly. It cannot be introduced just to make pictures look plausible.

### Preserve the measurement ruler and address

Which number does a plotted cell actually represent? Trace one measured bin into the earlier saved eight-component reconstruction.

<!-- figure:D49 -->

For source row 242, pixel row 4, column 3 is flattened feature F35 because `8*4+3=35`. Its raw count is 16; division by the fixed measurement ruler gives 1. The original saved NMF8 reconstruction at that same address is approximately 1.0176746162. The original row-256 reconstruction reaches approximately 1.227710461 at F26. These are the eight-component results from section 12, not the new six-component images just compared.

The difference between raw counts, scaled measurements, per-unit dictionary patterns, amount-weighted contributions and reconstructed intensities is part of the model. State which one an axis or colour legend shows. Hashes and source addresses maintain correspondence, while a model's validation comes from a properly designed comparison; neither replaces the other.

### Keep the original program and evidence

How were the recorded candidate and fixed-eight comparisons produced? The complete original program below preserves that question and its recorded output.

It first fits eight candidate NMF models on training rows and encodes validation rows. It then separately fits the predeclared eight-component inspection model and PCA8 on training rows, and compares their reserved reconstructions to the training mean. That last block does **not** fit the validation winner k=16. A future study of that selected model would need its own declared evaluation; these old test numbers cannot be relabelled as its result.

Save `nmf_digits.py` beside the attributed `digits-300.csv`. NumPy and scikit-learn supply the ordinary numerical tools. This is the original executable route, with its earlier recorded environment/output; the outputs shown are retained evidence, not a claim that every future library environment will reproduce identical final digits. We have already explained the scratch fitting and public NNLS mechanics in sections 4–6; PCA's from-scratch centered projection is taught in [PCA §4](https://ronak.sh/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python). Those owners explain the computational mechanisms rather than hiding the work behind these imports.

<!-- original-source:digitDictionary -->

<!-- original-output:digitDictionary -->

The program prints rounded errors, while the table retains the original full-precision recorded report. Its first reconstructed image is source 242; it is not an average digit and not a PCA reconstruction.

### Run the separate controlled image study deliberately

How can we produce matched comparison images without confusing them with the original experiment? Use a differently named program, explicit settings and saved row identities.

`nmf_digit_comparison.py` reads the verified CSV and saved-state identities supplied in section 12. It reconstructs the exact split and checks every reserved source ID in order **before fitting**. It then runs only the new NMF6/PCA6 study, with training-only mean/dictionaries, frozen query transforms and separate train/validation/test metrics. Warnings and cap status travel with the output. There is no rank search or tuning based on reserved outcomes.

The printed JSON includes the settings, all partition IDs, trained PCA mean/basis, NMF dictionary, complete selected images and row encodings. For PCA, `z=(x−mean)@components.T` and `x_hat=z@components+mean`; for NMF, `x_hat=w@H` with w obtained by fixed-H encoding. The same source IDs let you independently multiply those arrays back into every shown pixel. The reader in section 12 still refuses absent saved files; running this explicitly named new study is never an automatic fallback.

The dense input is deliberately only 300×64. A full PCA SVD has conventional O(nd min(n,d)) arithmetic on the training matrix and O(nd) matrix workspace/output storage; query projection/reconstruction costs O(qkd). NMF's per-sweep and encoding costs are the cached-coordinate costs already derived in sections 5–6, multiplied by their actual iteration work; the cap is not an observed runtime estimate. Keeping only the two requested comparison rows avoids an unnecessary all-row/component/feature contribution tensor. The full dictionaries, split and selected pixels in the JSON are reproducibility outputs, not things a browser must recompute while a learner drags a control.

Save this program beside `nmf_saved_digits.py` and its verified siblings, then run `python nmf_digit_comparison.py`. The shown new result used Python 3.12.14, NumPy 2.3.5 and scikit-learn 1.9.1. Its full JSON is a companion output file; the figure/table above extracts its literal selected arrays and metrics without fitting again.

<!-- source:nmf_digit_comparison.py -->

<!-- output:nmf_digit_comparison.stdout.txt -->

These two studies support reconstruction comparisons within this small, balanced early-index subset. The 300 rows are the first 30 examples per digit from the scikit-learn copy of the UCI collection's test portion, selected before the local split. Writer IDs are not available here, so this is not a held-out-writer study or a claim about handwriting outside this collection. It is not MNIST, the whole UCI corpus or a recognition benchmark.

We can now distinguish an inspected representation, a validation-based setting choice and a reserved comparison. A final question remains even when all three are done carefully: can the observed matrix uniquely determine the patterns? The next section uses exact small examples to examine that issue without mixing it up with testing error.
