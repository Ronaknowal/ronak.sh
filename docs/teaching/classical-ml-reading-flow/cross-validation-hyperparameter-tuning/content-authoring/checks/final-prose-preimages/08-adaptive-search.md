<a id="8-deeper-branch-adaptive-search-and-spending-resources"></a>
<a id="adaptive-search"></a>
## 8. Can earlier trials guide the next one?

Grid and independent random proposals do not use previous scores to choose the next setting. Sequential model-based optimization does: collect setting/score observations, fit a model of useful regions, choose another setting, evaluate it under the declared selection protocol, and update the history. This adaptation takes place **inside selection**. Reusing its best selection score as independent assessment would repeat the same problem from §4.

### Expected improvement values a useful tail

Suppose lower loss is better and the best observed loss is c=0.20. 

<!-- Drawing D36: visual-specifications.md#d36. -->

At a proposed setting x, a supplied predictive distribution assigns probabilities to possible losses Y. Its improvement is \((c-Y)_+=\max(c-Y,0)\); expected improvement is

\[
\operatorname{EI}(x)=\mathbb E[(c-Y)_+\mid x,\text{history}].
\]

Read the loss ruler with the incumbent at 0.20. Candidate A puts all mass at 0.18, giving mean 0.18 and improvement 0.02. Candidate B puts half its mass at 0.05 and half at 0.45, giving mean 0.25 but EI=(0.15+0)/2=0.075. EI prefers B even though its predicted mean is worse. It values the chance of a much better outcome and ignores the magnitude of already-worse outcomes. Moving B's bad branch from 0.45 to 0.90 raises its mean to 0.475 without changing EI. That is a property of this utility, not proof that bad outcomes have no practical cost.

The local investigation edits the incumbent and actual loss/mass cells, shades only positive improvement lengths and multiplies them by their masses. If all supported losses are at or above c, EI is zero. Probabilities must be finite, nonnegative and sum to one. These distributions are supplied beliefs for exact arithmetic; no Gaussian-process fit or uncertainty calibration has been demonstrated. Other acquisition rules balance exploration, constraints and costs differently.

### Reverse the conditioning to model useful settings

<!-- Drawing D37: visual-specifications.md#d37. -->

A conventional surrogate might model loss conditional on setting, p(y|x). The Tree-structured Parzen Estimator paper instead models settings conditional on whether their loss lies below a threshold y*: l(x)=p(x|y<y*) and g(x)=p(x|y≥y*). Let γ be the probability of the better region. The marginal setting density is p(x)=γl(x)+(1−γ)g(x). Under the paper's thresholded density factorization, the EI integral has an x-independent positive factor times

\[
\frac{l(x)}{\gamma l(x)+(1-\gamma)g(x)}
=\left[\gamma+(1-\gamma)\frac{g(x)}{l(x)}\right]^{-1},
\]

where the ratio form requires l(x)>0. This is why favouring settings relatively common among better trials can guide proposals. The density model and threshold assumptions do the work; it is not a universal identity for arbitrary fitted surrogates. [Original TPE paper, §4](https://papers.nips.cc/paper_files/paper/2011/file/86e8f7ab32cfd12577bc2619bc635690-Paper.pdf).

In the static three-setting worked table, **supplied** l masses are (0.4,0.2,0.4), g masses (0.1,0.4,0.5), and γ=1/4. Mixture masses are (7/40,7/20,19/40); l/p values are (16/7,4/7,16/19), so A wins. Each density and the mixture sums to one. The acquisition values need not sum to one and can exceed one: they are relative proposal utilities, not probabilities. This table is separate from the history-fitting investigation that follows. Its masses must never be described as fitted to that investigation's default trials.

### Build a finite adaptive search with every policy visible

Our complete scratch reference uses support A,B,C and a deterministic constructed evaluator with losses 1/10,1/5,2/5. Repeating a setting adds a trial to this history, but cannot create new independent noise evidence from that deterministic evaluator. This reference exposes reverse conditioning; it is not the original continuous Parzen-tree estimator or modern Optuna's full sampler.

Every history row carries a unique immutable nonnegative integer trial ID, supported setting and finite nonnegative loss. Editing a loss keeps its trial ID. Before four trials, use the explicit startup sequence A,B,C,C and show uniform prior masses rather than pretending to have fitted a better/other partition. The ordinary reset state contains those four evaluated rows: 0:A/0.1, 1:B/0.2, 2:C/0.4, 3:C/0.4.

After startup, if all observed losses are equal, keep an uninformative uniform prior: l=g=p=(1/3,1/3,1/3), acquisition=(1,1,1), first-support proposal A. Do not assign arbitrary “better” labels to tied equal evidence. Otherwise sort by (loss,trial ID), set

\[
m=\max(1,\min(n-1,\lfloor\gamma n\rfloor)),\qquad \pi=m/n,
\]

and take the first m rows as better, the rest as other. We intentionally use a fixed count and do not expand tied boundaries. Requested γ and realized π are distinct on a finite history. With positive smoothing α, setting j receives

\[
l_j=\frac{c_{Lj}+\alpha}{m+3\alpha},\quad
g_j=\frac{c_{Gj}+\alpha}{n-m+3\alpha},\quad
p_j=\pi l_j+(1-\pi)g_j,\quad a_j=l_j/p_j.
\]

Smoothing makes every supported mass positive. At γ=1/2,α=1, the default better IDs are 0,1 and other IDs 2,3. Their counts are (1,1,0) and (0,0,2), producing l=(2/5,2/5,1/5), g=(1/5,1/5,3/5), p=(3/10,3/10,2/5), acquisition=(4/3,4/3,1/2). First-support tie chooses A. The already-visible proposal can be accepted with Step: append trial 4:A/0.1, then recompute the whole history model. No answer entry or reveal gate is involved.

At n=5, m=2 and π=2/5. Better IDs are now 0,4; counts (2,0,0) and (0,1,2). The new l=(3/5,1/5,1/5), g=(1/6,1/3,1/2), mixture=(17/50,7/25,19/50), acquisition=(30/17,5/7,10/19). A wins again. A deterministic greedy proposal rule has no exploration guarantee; this outcome is part of its limitations.

An informative edit changes original trial 0's A loss to 1/2. Better IDs become 1,2, with 3,0 in other. Then l=(1/5,2/5,2/5), g=(2/5,1/5,2/5), mixture=(3/10,3/10,2/5), acquisition=(2/3,4/3,1). Proposal B is accepted with the evaluator's fixed 1/5 loss. Changing original B loss from 1/5 to 1/4 instead leaves the default partition, fitted masses and proposal unchanged. It is a genuine null edit for this thresholded reference, even though the numeric history changed.

At the original history with γ=1/4, m=1 and π=1/4: l=(1/2,1/4,1/4), g=(1/6,1/3,1/2), mixture=(1/4,5/16,7/16), acquisition=(2,4/5,4/7). The investigation edits history cells, γ in [0.1,0.9] and α in [0.25,2], shows the membership/count/mass chain and resets the exact four-row history. Invalid settings, duplicate IDs, nonfinite or negative history loss, and parameters outside those domains refuse with no appended trial. The program has the same explicit policies.

<!-- Programme P13: insert discrete_adaptive_search.py and actual full stdout here. -->

`proposal` validates history, handles startup/equality, sorts once, counts categories and evaluates all three support utilities. `accept` copies the current rows and appends the declared evaluator result at the next ID. The exact rational tables avoid hiding tie or rounding choices. Its cost is O(n log n+q) for n history rows and q enumerated settings, with O(n+q) state; a real continuous density model has different costs and approximation choices. `expected_improvement` separately computes the supplied finite-loss example; it is not a fitted model for this categorical evaluator.

### Read the ordinary adaptive route without inventing its history

The retained `cv_optuna.py` imports the displayed `load_data` and `make_model` functions from `cv_penguins.py`. It searches odd k from 1 through 21, distance power p=1 or 2, and uniform or distance voting, with StandardScaler fixed. It maximizes the same three-fold selection accuracy, using a seeded TPESampler with ten startup trials and twenty total trials. Its startup is the library's random proposal policy, separate from our finite A/B/C reference's prescribed sequence.

<!-- Drawing D38: visual-specifications.md#d38. -->

Read the two retained lines literally: that historical sequence selected k=1,p=1,uniform at 0.9884057971. The earlier complete six-card search evaluated k=3,p=2,uniform with StandardScaler at 0.9913043478 under the same full-development inner folds; it lies within this Optuna space. Twenty trials therefore did not guarantee finding the best known in-space setting. The complete twenty-trial history and INFO stderr were not retained in these displayed strings, so we cannot reconstruct which trials occurred or attribute a particular proposal to fitted densities. Our new A/B/C traces cannot fill that historical absence. This is one execution, not a sampler ranking study.

The exact original script runs a study at top level; importing it executes the old experiment. Do not import it merely to inspect helpers. Its dependency `cv_penguins.py` has a guarded main and supplies the reusable functions. The saved original environment used Optuna 5.0.0. A seed in sequential execution helps reproduce a protocol; parallel completion order and changing library versions can change adaptive histories. [TPESampler documentation](https://optuna.readthedocs.io/en/stable/reference/samplers/generated/optuna.samplers.TPESampler.html).

<!-- Programme P03: insert cv_optuna.py and exact retained displayed stdout here. -->

### Spend a little resource before paying for every full fit

Adaptive proposals decide **where** to try. Successive halving decides **how much** resource to spend on each candidate before elimination. Resource might mean training rows, epochs or trees, but its relation to loss must be understood. More resource does not ensure that candidates preserve their ranking.

<!-- Drawing D39: visual-specifications.md#d39. -->

Start nine named candidates at resource 10. Pay for all nine loss observations, retain the best three by the declared tie order, pay for those at 30, retain one, then pay for it at 90. The actual paid cells in the supplied trajectory table are 9/3/1. Fresh fitting costs 9×10+3×30+1×90=270 nominal resource units; fitting all nine at 90 would cost 810. Eliminated future cells remain **unobserved**, not loss zero.

The two-candidate slow-starter example makes the risk visible. At resource 10, A/B losses are 0.30/0.40, so a factor-two elimination keeps A. A's later losses are 0.25 and 0.24; B's supplied later losses would be 0.20 and 0.10. Both improve, but B's ranking reverses too late. Those B cells belong to a separately labeled hindsight diagnostic and were unavailable to the actual elimination decision. The local investigation edits candidate-by-resource loss cells and recomputes only decisions supported by paid observations; a separate allocation view changes schedule quantities after the mechanism is understood.

If a real training state can resume exactly, the same nine/three/one schedule might pay 90+3×(30−10)+1×(90−30)=210 incremental resource units. A checkbox or a curve cannot establish that saved state exists. Our source includes an actual extendable running-mean object with saved sum/count, consuming 1, then 2, then 6 new observations to reach resources 1,3,9. It agrees with the fresh means. This demonstrates a sufficient-state continuation operation, not a claim that the supplied loss trajectories came from resumed optimizer fits. Fresh fitting is the default ledger for those trajectories. Nominal resource counts are not elapsed-time measurements.

### Hyperband runs several allocation tradeoffs

A single halving tournament commits to one initial population and resource. Hyperband starts several brackets, trading breadth against initial depth. 

<!-- Drawing D40: visual-specifications.md#d40. -->

For maximum resource R and factor η>1, the original schedule uses

\[
s_{\max}=\lfloor\log_\eta R\rfloor,\quad B=(s_{\max}+1)R,
\quad n_s=\left\lceil\frac{B}{R}\frac{\eta^s}{s+1}\right\rceil,
\quad r_s=R\eta^{-s}.
\]

Within bracket s, round i uses nominal count \(n_i=\lfloor n_s\eta^{-i}\rfloor\) and resource \(r_i=r_s\eta^i\), applying the paper's survivor rounding. These integer rules matter; do not replace them with an arbitrary ceiling scheduler and call it the identical algorithm.

For R=9,η=3, smax=2 and B=27. Bracket s=2 starts nine at one and uses (9,1),(3,3),(1,9), fresh cost 27. Bracket s=1 starts five at three and uses (5,3),(1,9), fresh cost 24. Bracket s=0 starts three at nine, cost 27. Total 78 differs from the nominal three-by-27=81 because of rounding. Conditional genuine-continuation costs would be 21,21,27, total 69. At R=27,η=3, starts are (27,1),(12,3),(6,9),(4,27); the complete code prints each round and totals 423 fresh versus 357 conditional continuation. The bracket budget is approximate after rounding. [Hyperband Algorithm 1](https://jmlr.org/papers/volume18/16-558/16-558.pdf).

<!-- Programme P14: insert resource_tournaments.py and actual full stdout here. -->

`tournament` owns paid loss lookups, rank ties, survivor identities and both cost interpretations; `hyperband_brackets` owns the separate original bracket arithmetic. The running-mean state owns a real extension operation. Invalid factors, nonincreasing resources or missing required paid cells refuse. An initial candidate-to-ordinal dictionary gives constant-time tie-key lookup; sorting each round costs O(n_i log n_i), after the initial O(n) identity map. Real evaluator training usually dominates. The finite schedule does not implement asynchronous halving, an infinite-horizon optimizer or a general-purpose Hyperband library.

### Audit an ordinary halving execution

`ordinary_halving_audit.py` supplies a newly constructed 90-row, four-feature binary classification task with balanced classes and fixed generation/fold/estimator seeds. It searches nine random-forest depth/leaf recipes with `n_estimators` as resource. That resource is absent from the searched grid. The experimental import enables `HalvingGridSearchCV`; the script prints all result rows rather than assuming the schedule matched a hand picture.

<!-- Programme P15: insert ordinary_halving_audit.py and actual full stdout here. -->

The observed schedule has candidate counts 9,3,1 at tree resources 1,3,9. Its selected depth-3/min-leaf-4 recipe reaches nine trees; its selection accuracy is 0.9222222222. That is selection evidence on this constructed task, without an outer generalization assessment. The 13 candidate-resource rows each have three folds: 39 fits plus final refit. Fresh tree accounting is 3×(9×1+3×3+1×9)+9=90 tree units, with `warm_start=False`. The code does not claim previous fitted forests were resumed. Other legal settings can stop below a requested maximum resource; inspect actual attributes rather than assuming the maximum was reached. [HalvingGridSearchCV documentation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.HalvingGridSearchCV.html).

Search distribution, adaptive history, resource schedule, stopping and refit are all parts of a procedure. The final section before practice turns that procedure into a reproducible record with an explicit computation budget and an honest scope.
