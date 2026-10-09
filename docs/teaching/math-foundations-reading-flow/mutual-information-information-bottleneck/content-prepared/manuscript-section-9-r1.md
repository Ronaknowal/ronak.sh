## 9. Check what a sample can support

Until now we knew a complete probability law. With observed data, a simple **plug-in estimator** counts paired values, divides by the sample size, and computes MI of that empirical table. The drawing distinguishes a declared population law from the particular rows it generated.

[[M44]]

An independent population has MI zero. Its finite sample need not contain exactly the proportions that factor into independent row and column marginals. The empirical MI can therefore be positive. An8×8 table has many more cells to estimate than a2×2 table at the same sample size, making sparse counts consequential. This independence example does not prove a universal sign for estimation error under every dependent law. An individual estimate can also move in either direction when more observations are added.

The simulation exposes its sample count, alphabet, law and seed. Within one setting, increasing the count uses a coherent prefix of the same seeded stream. The browser's xorshift generator and Python's `random.Random` are different declared generators; a matching seed number would not make their streams identical. The plotted quantity is always the MI of the current empirical table, with the known population value as a separate reference.

Now keep the actual observed X and Y values, but permute the donor rows supplying Y. Follow one permutation before inspecting a collection of shuffled scores.

[[M45]]

Every original Y appears exactly once in the new paired rows, so its marginal count is unchanged; X's marginal is unchanged because its rows stayed in place. The joint pairing changes. A particular shuffled table is not guaranteed to factor exactly or have MI zero. Twenty shuffled values illustrate the variability of this diagnostic under the observed marginals; they are not a confidence interval or a calibrated significance test. A formal permutation test needs an exchangeability argument, a statistic and a stated decision rule. Temporal, grouped or repeated observations may not permit unrestricted shuffling.

{{PROGRAM:estimation}}

The programme constructs a count table from a specified independent generator and evaluates its empirical law. Its seeded examples expose how a small alphabet and a larger sample can change the apparent dependence; they do not assert monotonicity for every realized sequence. Direct counting costs O(N+AB) for N records and an A-by-B table; making twenty complete permutations adds O(20N) work. Exact table probabilities, sample estimates and shuffled diagnostics remain separate objects.

The final programme example assigns every observed row a unique ID. Draw its singleton groups next to an ID that was never observed.

[[M46]]

Each training ID determines its one recorded label, so the empirical conditional entropy is zero and the empirical MI equals the one-bit label entropy. No rule for a new ID follows. Finer measurement bins can create a similar sparse-table effect. Storage as an integer does not make a continuous measurement a categorical variable. Choose an estimator according to the variable's meaning and sampling assumptions, not its array dtype.

Fit feature selection, binning and estimator tuning inside the training portion of each evaluation fold. For deployment to new participants, keep whole participants out of training. Splitting only after choosing features using all labels leaks evaluation information. [Feature Selection & Importance](/learn/topic/feature-selection-importance-shap-permutation-mutual-info) owns the full train-only selection and held-out workflow; the information statistic by itself is not that validation procedure.

### Use the same counts in the ordinary API

The next comparison carries one integer contingency table into both a manual sum and library calls. The row/column labels and units remain explicit.

[[M47]]

The table [[30,10],[10,30]] has80 observations. Its agreement fraction is .75, deliberately different from section1's .8 law. Its MI is .130812036 nats, or .188721876 bits. `mutual_info_score(contingency=counts)` takes actual counts rather than a normalized probability table. `mutual_info_classif` on the expanded80 rows uses `discrete_features=True` because these values are categories. Both return nats, so divide by ln2 for bits.

{{PROGRAM:bridge}}

The bridge validates nonnegative integer counts and masks empty cells before taking logs. Duplicating all counts or consistently relabelling categories preserves the plug-in MI. The replacement table [[2,4],[3,6]] factors into its marginals and gives zero up to roundoff. Adding an all-zero category changes no occupied contribution. The unique-ID example again gives empirical one-bit information without establishing population usefulness; that interpretation belongs to the text rather than a printed pseudo-measurement.

The dense table route needs O(rc) time and storage for r-by-c categories. Expanding N rows here makes the feature-estimator API visible; a large sparse contingency table should remain sparse. Continuous nearest-neighbour estimators use different assumptions and tuning. The discrete-feature flag changes the statistical treatment, not just storage. Some estimated MI outputs are clipped at zero by the API; a returned zero does not certify population independence. An MI feature score is also not an information-bottleneck optimizer: the latter requires the encoder, relevance objective and iterative construction from section6.

### Inspect an observed law and a deliberate coarsening

Use the offline Palmer penguins records from the preceding Entropy example. This time the question is descriptive association, not held-out prediction cost. Species, island and year are present in all344 records; missing body measurements do not remove rows from this calculation. The actual table and a specified grouping make the change visible.

[[M48]]

With species rows Adelie,Chinstrap,Gentoo and island columns Biscoe,Dream,Torgersen, the observed counts are [[44,56,52],[0,68,0],[124,0,0]]. Computing MI of this empirical law gives .750428171 bits. Merge Dream and Torgersen into “other,” retaining Biscoe separately. The new table is [[44,108],[0,68],[124,0]], with MI .616057102 bits. The .134371069-bit loss is a deterministic coarsening under the same empirical law, so it obeys data processing exactly. This does not establish that island causes species or that the study is a random census of all Antarctic penguins.

Year selection asks a different question: it changes which observations define the law. There are110 records from2007,114 from2008 and120 from2009. Conditional information I(species;island|year) weights the within-year MI values by these actual frequencies. It is .744684498 bits; the unweighted average .745617934 is different. Switching years is not an encoder operation on one fixed source law. The live view labels the year and denominator beside every table; grouping within that selected table then compares like with like.

{{PROGRAM:penguins_information.py}}

The CSV reader validates the selected categorical fields and checks the declared file hash. The scalar sum uses integer counts and log differences; scikit-learn receives the same contingency. Assertions compare their units, verify coarsening does not increase empirical MI, and check that merging every island into one group gives zero. Counting costs O(N); the tiny fixed tables cost O(rc). There is no fitted predictive model or train/test estimate in this descriptive experiment. Keep the file's CC0 provenance with it: [Palmer penguins documentation](https://allisonhorst.github.io/palmerpenguins/) describes the dataset, and [Gorman, Williams and Fraser](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081) describes the field study.

### Distinguish a critic objective from exact information

An information-based training objective can avoid an explicit density estimate while still depending on a precise sampling law. InfoNCE asks which candidate belongs with a context. Draw how the candidate set is made before interpreting a score.

[[M49]]

For context X, one candidate Y⁺ comes from the conditional law p(y|X). The other K−1 candidates come independently from the target marginal p(y). A fixed positive critic f(x,y) scores all candidates, and the selected positive receives normalized score f(X,Y⁺)/Σ_jf(X,Y_j). Its negative log is a classification loss. Averaging over this population sampling experiment gives L_K. Negatives drawn from a different law, dependent selection rules or an adaptive critic require rechecking the argument.

The population bound and one finite observed score are distinct quantities. The next scale shows the bound's own ceiling without turning that ceiling into a claim about true MI.

[[M50]]

Under the stated sampling setup, I(X;Y)≥log K−L_K in the same log units. Since L_K≥0, this displayed lower bound cannot exceed log K. True MI can be larger. An observed minibatch loss is a random estimate of the population expectation; optimizing a critic on those same observations creates an additional selection issue. A good classification loss is therefore not automatically a trustworthy measurement of true MI.

Another variational route uses a real-valued critic T and the population functional E_joint[T]−log E_product[exp(T)], under conditions making these expectations meaningful. Its value is at most joint-versus-product KL. The exponential term is sensitive to events that a finite sample can miss.

[[M51]]

The product-law picture contains a rare region with large critic score. If a sample misses it, its empirical mean of exp(T) can underestimate the population denominator, making the empirical functional look too large. This explains a risk; it is not by itself a proof of every estimator's finite-sample error. MINE parameterizes a critic and optimizes such variational objectives, with its own gradient and estimation choices. Distribution-free high-confidence lower bounds from finite data have formal limitations of order log(sample size). That statement has a particular distribution-free confidence setting; it does not impose one universal ceiling on exact known-law calculations or every estimator using additional structural assumptions.

The contrastive-learning destination develops augmentation, negative sampling and full training. Here the owned outcome is to identify the population sampling law, distinguish the bound from a batch score, and state what a reported number measures. Original papers provide deeper derivations: [Poole and colleagues](https://proceedings.mlr.press/v97/poole19a/poole19a.pdf) compare variational bounds, [MINE](https://proceedings.mlr.press/v80/belghazi18a/belghazi18a.pdf) develops the neural critic route, and [McAllester and Stratos](https://proceedings.mlr.press/v108/mcallester20a/mcallester20a.pdf) state the distribution-free limitation precisely.

Before trusting an information claim, identify the variables and population, whether the number is exact information or a bound or an empirical estimate, its log units and measurement resolution, the assumed factorization and support, and how fitting was separated from evaluation. These are different parts of the experiment, not interchangeable caveats.
