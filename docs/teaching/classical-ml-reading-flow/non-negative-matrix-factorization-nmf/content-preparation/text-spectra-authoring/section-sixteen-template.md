## 16. Change application assumptions explicitly

**Can the same additive machinery explain words or light?** The shape of the calculation survives; the meaning of its inputs needs a new argument. [When anchors help recover the dictionary](#15-when-anchors-help-recover-the-dictionary) gave conditions under which observed pure rows can identify patterns. A short document or a measured spectrum does not automatically satisfy those conditions. We will first replace pixel bins with word bins, then deliberately switch to a constructed spectrum to see how a physical constraint changes the answer.

**How does a sentence become one nonnegative row?** Count each retained word in its own named column.

<!-- figure:D57 -->

The five documents in the picture are `orbit rocket orbit`, `rocket orbit rocket`, `goal team goal`, `team goal team`, and `orbit rocket goal team`. The ordered vocabulary is `[goal, orbit, rocket, team]`. Follow both copies of `orbit` in the first sentence into its `orbit` cell: that cell is 2, not two new columns. Its complete row is `[0,2,1,0]`. The next three rows are `[0,1,2,0]`, `[2,0,0,1]`, and `[1,0,0,2]`; the last is `[1,1,1,1]`. A zero says the retained word did not occur in that document. It is an observed count, not a missing measurement.

With documents as rows and vocabulary entries as features, `X ≈ WH` has exactly the orientation we have used throughout. A dictionary row now distributes a component over words. A document's amount multiplies that whole word pattern. In the preserved count experiment, the printed, rounded, unit-row-sum patterns are `[0.5,0,0,0.5]` and `[0,0.5,0.5,0]`. Their component order is the order of that saved run. The mixed document uses amounts `[2,2]`: its two contributions are `[1,0,0,1]` and `[0,1,1,0]`, adding to `[1,1,1,1]`. These are rounded recorded values, not a newly inferred full-precision dictionary.

Normalizing a dictionary row to sum to one is the compensated convention from [Amount is not probability or identity](#2-amount-is-not-probability-or-identity). Its document amounts need not sum to one. Those two amounts sum to four because this representation has four token occurrences. The product is an approximation to counts; it is not a posterior distribution over topics. A label such as “space” can be a useful human interpretation of the `orbit/rocket` pattern, but it is not a theorem that the program discovered a semantic theme or an independent source. Two documents with the same retained counts but different word order are indistinguishable here.

The count program below uses the generalized-KL route taught in [Explain the multiplicative route](#7-explain-the-multiplicative-route). Count nonnegativity makes this loss admissible, including observed zero counts, but a Poisson likelihood interpretation additionally assumes a suitable count-generating model. Word occurrences can be correlated and document length can matter; a useful approximation is not a proof of that generative assumption. A new `rocket team` query is counted in the same four columns and encoded against the existing dictionary. The saved rounded reconstruction `[0.5,0.5,0.5,0.5]` shows that encoding may predict nonzero `goal/orbit` counts even when the query did not contain them: a least-divergence combination of whole patterns cannot independently edit every word.

This is the original complete `nmf_words.py` and its preserved output. The lowercase default tokenizer, vectorizer fit, public KL/MU configuration, dictionary normalization and compensated amounts are all visible. This code was executed for the earlier lesson; its recorded output is reused here, not regenerated for the new example.

<!-- original-source:wordPatterns -->

<!-- original-output:wordPatterns -->

**Should every occurrence count equally?** We can learn a fixed word-weighting rule from training documents before encoding a query.

<!-- figure:D58 -->

Here we change to three explicitly named training documents so the weighting arithmetic fits on the page: `orbit orbit rocket`, `rocket team`, and `team team`. The new ordered vocabulary is `[orbit, rocket, team]`; do not carry the previous four-column dictionary into this three-column problem. The count rows are `[2,1,0]`, `[0,1,1]`, and `[0,0,2]`. Document frequency counts **documents containing the word**, rather than occurrences: `orbit` appears in one document, `rocket` in two and `team` in two, even though the last document says `team` twice.

The picture gives each column a fixed multiplier. A rarer training word receives a larger multiplier. With three training documents and the smoothed convention used here, the three multipliers are `1 + log(2)`, `1 + log(4/3)`, and `1 + log(4/3)`, approximately `1.693147`, `1.287682`, and `1.287682`. These are called **inverse document frequency**, or IDF, weights. “Inverse” describes their decreasing dependence on document frequency; it does not mean we simply divide by frequency.

Let `n` be the number of training documents, `df_j` the number containing vocabulary word `j`, and `count_ij` its occurrences in document `i`. Our representation is

\[
\operatorname{idf}_j=1+\log\frac{1+n}{1+\operatorname{df}_j},
\qquad X_{ij}=\operatorname{count}_{ij}\operatorname{idf}_j.
\]

The logarithm is natural. The added ones keep the rule defined for an absent column and avoid erasing a word present in every training document. This is one precise TF-IDF convention: **term frequency** is the raw occurrence count here, and **inverse document frequency** is the learned column multiplier. Other conventions use logarithmic term frequency or normalize rows. We use `norm=None`, so the first training row is `[3.386294361119891,1.2876820724517808,0]`. Its entries are word weights, no longer literal token counts. [TfidfTransformer's weighting contract](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfTransformer.html) specifies the smoothing and normalization choices.

Move the orbit-count control from 2 to 0. The query's count row changes from `[2,1,0]` to `[0,1,0]`; the weighted row changes from `[2*idf_orbit,idf_rocket,0]` to `[0,idf_rocket,0]`. The IDF weights do not move. The query is not a new training corpus. Likewise, `rocket planet` becomes `[0,1,0]`: the unseen word `planet` is ignored under this fixed vocabulary. An all-`planet` document becomes a zero row and receives zero amounts. That null says “nothing retained by this representation,” not “a document with no meaning.” OOV means **out of vocabulary**, and is a practical reason to monitor coverage or deliberately retrain a representation on a new training corpus.

The small separate unit-length example in the picture illustrates an additional decision. Dividing a nonzero weighted row by its Euclidean length makes its direction carry the information and removes its overall magnitude. That can be useful when document length is a nuisance, but it changes the matrix and therefore the squared-error fitting problem. Our live row remains unnormalized; the inset is not an extra hidden transformation. A zero row must remain zero instead of being divided by zero.

**What does the whole training-and-query program do?** It fixes the vocabulary and IDF, fits a dictionary on the weighted training rows, and only then solves for new amounts. `count_rows` implements the lowercase, word-character tokens of length at least two used in this bounded comparison. This is not a language-aware tokenizer: punctuation separates words, one-character tokens are omitted, and no stemming, subword segmentation or phrase model is inferred. [CountVectorizer's token contract](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html) is the ordinary interface being matched.

The new `nmf_text_spectra.py` below supplies that scratch adapter, IDF calculation, and calls to the already explained `CoordinateNMF` and `encode_nnls`. Both the scratch and ordinary NMF routes use **Frobenius** loss on exactly the same weighted matrix, the same two-component custom start, zero penalties, a cap of 4,000 and tolerance `1e-8`. We use the [ordinary lifecycle from §10](#10-use-the-ordinary-tools-deliberately), rather than reimplementing the optimizer. The ordinary text route calls `fit_transform` on training rows, reads `components_`, calls `transform` on query rows, and reconstructs with `inverse_transform`. Only the vectorizer and IDF transformer are fit on raw training text; their query calls are `transform`. Labels play no role.

The vectorizer's sparse arrays store only nonzero counts or weights. The scratch optimizer in this lesson is deliberately dense; the program checks the new demonstration is 3×3 before converting it. More generally, its explicit dense adapter bounds the result to 10,000 cells. If a real vocabulary produces a large sparse document matrix, retain the sparse format and use an appropriate public solver; do not convert a corpus to dense merely to reuse these teaching loops. Tokenization itself takes work proportional to the inspected text; vocabulary sorting costs `O(v log v)` for `v` retained distinct tokens, counting takes `O(tokens + nv)` with the dense allocation, and multiplying IDF takes `O(nv)` dense work or `O(nnz)` when a sparse implementation touches only stored entries. After that, the NMF dimensions/costs are the ones already derived for `n` documents, `v` features and `k` components.

The executed new study reached scratch projected-stationarity tolerance after 12 alternating updates, with half-loss `0.5710663094424072`; the ordinary route used 13 iterations and half-loss `0.5710663094424069`, with no recorded warnings. Their stopping measurements differ, as §10 explained; this is not evidence that one extra library iteration is extra useful learning. For `rocket planet`, the scratch reconstruction is approximately `[0.437238,0.223229,0.215498]`: some error is inevitable because no combination of its two nonnegative patterns isolates the `rocket` column. Its all-OOV query has exact zero amounts and zero reconstruction. Independent fixed-dictionary NNLS objectives support these finite query results. We compare losses and reconstructions, not an obligation for arbitrary factor entries to match.

**Why not attach the count likelihood automatically?** TF-IDF entries are real-valued weights determined by the corpus. A count model for word occurrences does not automatically become a count model for weighted entries. Here Frobenius loss states exactly the numerical disagreement we fit. Generalized KL can also be defined for admissible nonnegative weighted values, but its probability-model interpretation would need a separate argument. Model selection must assess the intended task—retrieval, compression, exploration or a downstream prediction—under a train-only preprocessing rule, not merely the pleasant names given to components.

**Do nonnegative spectral amounts represent physical fractions?** Only an additional sum-to-one constraint makes them fractions of a fixed total.

<!-- figure:D59 -->

We now deliberately leave documents and return to the familiar two patterns `[1,0,1]` and `[0,1,1]`. In this **constructed** application, the three features are spectral bands and a pattern is called an **endmember**: a candidate pure-material response. They are numerical examples, not instrument measurements or certified substances. The query is `x = g[2,1,3]`, with the gain control initially `g=1`. Gain multiplies every band together.

The open cone contains every nonnegative combination of both patterns. At gain 1, NNLS amounts `[2,1]` reconstruct `[2,1,3]` exactly. At gain 2, `[4,2]` reconstruct `[4,2,6]`. The sum of amounts changes with signal strength. The line segment joins the two endmembers and contains only their sum-one combinations: `[t,1-t]` for `0 ≤ t ≤ 1`. In geometry, those amounts belong to a **simplex**; for two components the simplex is just an interval. Both constraints are nonnegative, but the feasible sets are different. Every point on this segment has third band 1, so it cannot exactly represent our third band 3 at gain 1.

To compute the segment optimum, name the first and second pattern rows `h0` and `h1`. A sum-one reconstruction is `h1 + t(h0-h1)`. Define the direction `v=h0-h1`. Minimizing the half-square error along its whole line gives slope `v·(h1+tv-x)` and zero-slope coordinate `(x-h1)·v/(v·v)`. Constraining the coordinate to `[0,1]` clips that scalar optimum to the segment, because the scalar quadratic is convex:

\[
t^*=\operatorname{clip}\!\left(\frac{(x-h_1)\cdot(h_0-h_1)}{\|h_0-h_1\|_2^2},0,1\right),
\qquad w^*=[t^*,1-t^*].
\]

For our `h0-h1=[1,-1,0]` the denominator is 2 and numerator is `g+1`. Thus `t*=clip((g+1)/2,0,1)`. At `g=0.5`, the optimum is `[0.75,0.25]`, predicts `[0.75,0.25,1]` and has half-loss `3/16=0.1875`. At gain 1 it reaches the first endpoint `[1,0]`, predicts `[1,0,1]` and has half-loss 3. At gain 2 the same endpoint has half-loss 19. The open-cone answer remains exact throughout this control's domain, apart from floating-point NNLS residuals near `1e-16` in the executed reference.

If instead we normalize the exact unconstrained amounts `[2,1]` to `[2/3,1/3]`, the gain-1 prediction is `[2/3,1/3,1]` and half-loss is `28/9 ≈ 3.111111`, worse than the true segment optimum 3. Normalizing **after** optimizing changes the prediction without solving the newly constrained objective. This is different from the compensated dictionary-row normalization in §2, which preserves the product.

`simplex_two` implements the closed-form two-pattern projection in `O(d)` time and workspace for `d` bands. Its arrays are read-only results. If both patterns are identical, every sum-one amount has the same prediction: it returns `[0,1]` by a declared convention and marks amounts nonunique. If distinct patterns lose their squared separation to underflow, or the products/loss exceed finite arithmetic, it refuses and requests a better numerical scale rather than pretending it found a unique answer. With more than two patterns, the simplex has several coordinates and this clipping formula is no longer a general solution. Use a suitable constrained least-squares/quadratic optimizer and check feasibility and stationarity.

The public diagnostic route here independently minimizes the same one-coordinate objective with SciPy SLSQP, an analytic gradient and `[0,1]` bounds. It checks solver success and finite feasible output. All three constructed gains converged to the same amounts and losses in this new execution; a numerical success flag is not a proof that every future call will work. See the [SLSQP objective and stopping interface](https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html).

Here is the complete new file. Its first application uses the fixed training representation described above; its second uses the fixed constructed spectral dictionary. They are separated functions because their features, fitted state and assumptions are different. Place it beside the supplied `nmf_arrays.py`, `nmf_coordinate.py`, `nmf_nnls.py` and unchanged `centered_pca.py` siblings.

<!-- source:nmf_text_spectra.py -->

The full output of the new bounded demonstration follows. It includes actual dictionaries and amounts, the null query, convergence diagnostics and all three constrained comparisons. These data belong to this new three-document/Frobenius example, not the preceding historical five-document/KL run.

<!-- output:nmf_text_spectra.stdout.txt -->

**What would justify a material interpretation?** Calibration and independent evidence must connect a numerical component to the world.

<!-- figure:D60 -->

The measured/modelled/residual lanes now reuse our separate positive-shear example, explicitly switching from `H0` to patterns `[1,1,1]` and `[0,1,1]`, with amounts `[2,1]`. Their modelled response is `[2,3,3]`. A different dictionary `[1,0.5,0.5]`, `[0,1,1]` with amounts `[2,2]` gives the same response. The numerical residual in either lane is zero. Equal fit cannot choose which explanation names the physical materials.

An instrument's band response, units, baseline, noise, saturation and calibration establish what the observed vector means. Independent endmember measurements or credible mixing laws establish whether the candidate dictionary represents pure responses. An abundance sum-one constraint might describe fractions under a particular linear mixture model; brightness, illumination, path length, nonlinear scattering or additional materials can violate that simple model. These are questions for the experiment and the application, not facts inferred from `WH` alone. Even an identifiable algebraic dictionary under §15's assumptions is not automatically a calibrated substance catalogue.

That distinction explains both the promise and the restraint of additive models: a nonnegative table lets us reuse the computation, while each domain must defend its representation, noise/loss and interpretation. A useful changed task is to hold the vocabulary fixed for a new text query, or hold the endmembers fixed while changing gain, and explain which inference remains justified. [Practice T](#practice-t-query-with-fixed-idf) and the physical-interpretation task revisit those decisions. Next, we keep the data representation fixed but change **when** rows arrive, so the model must decide what to remember.
