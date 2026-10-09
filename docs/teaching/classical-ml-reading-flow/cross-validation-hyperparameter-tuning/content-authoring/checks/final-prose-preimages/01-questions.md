<a id="1-what-exactly-are-we-trying-to-estimate"></a>
## 1. What exactly are we trying to estimate?

The preceding [Feature Scaling, Encoding & Imputation lesson](/learn/path/full-curriculum/feature-scaling-encoding-imputation?module=classical-ml) asks how to turn measurements, categories and gaps into usable coordinates. We now ask how to choose a complete recipe using evidence, and how to assess that choice. A recipe includes preparation as well as prediction. We will refresh the fitted-state boundary locally, so you can follow this lesson without needing an unpublished implementation of that preceding revision.

Start with one actual Palmer Penguins row. Its recorded answer is useful for checking a prediction; the corresponding answer on a future case is what we would be trying to discover.

<!-- Drawing D01: visual-specifications.md#d01. -->

| Source position | Bill length | Bill depth | Flipper length | Body mass | Recorded sex | Recorded target |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 0 | 39.1 mm | 18.7 mm | 181 mm | 3750 g | male | Adelie |

The first five substantive columns are the selected inputs. The target species stays in a separate lane. Source position 0 is metadata for tracing this file, never a sixth feature. The future row’s target remains unknown until an outcome is available. We exclude island and year from these input coordinates too; that exclusion does not establish performance on a new island or future season. The real experiment later retains all 344 rows, including missing inputs.

How does a neighbour count enter that prediction? A supplied count changes which training labels can vote. A data-driven comparison adds another operation: it learns which count to use.

<!-- Drawing D02: visual-specifications.md#d02. -->

Follow the training-row bundle into fitted preparation: medians fill missing measurements; means and scales set the ruler; a saved categorical vocabulary supplies indicator columns. The prepared training rows and their species labels form the neighbour reference set. A configuration such as `k=3` tells this fitted object how many neighbours vote. Validation inputs enter through the frozen preparation, yielding predictions; validation targets meet those predictions only at the correct-count operation. That score returns to the configuration choice. After choosing, a **fresh refit** uses all permitted development rows. Assessment inputs then travel through that refitted object, and assessment targets meet its predictions at a separate score. There is no arrow from those protected targets back to preparation, neighbour count or the choice rule.

A **parameter** is learned inside a stated fit, such as a regression coefficient. A **hyperparameter** specifies how fitting or prediction operates: neighbour count, penalty strength, depth, preparation choice. This distinction belongs to the procedure, rather than to a number forever. The programmer can supply k; a search can instead learn k from validation outcomes. The resulting selection is learning too, even though it happens outside the estimator's `fit` method.

Which of these learned objects do we mean by “the model” when quoting a score? Keep three questions visible before introducing probability notation.

<!-- Drawing D03: visual-specifications.md#d03. -->

The first panel fixes one saved fitted state and asks about fresh observations. The second redraws a training table of a stated size, applies the same fixed recipe to each table, and then predicts fresh observations. The third redraws a training table, **reruns the comparison and refit**, and predicts fresh observations. A cloud of possible tables in the last two panels is illustrative, not a measured confidence band. The differences are what we hold fixed and what we repeat.

1. **Fitted-object error:** how does this particular fitted predictor work on the intended fresh cases?
2. **Recipe error at a training size:** how does a fixed learning recipe usually work when a new training sample of that size is supplied?
3. **Select-and-refit procedure error:** how does the complete comparison, choice and refit usually work?

Section 7 gives precise expectations for these questions. For now, a score needs a sentence naming its data and its use. “This inner mean chose the neighbour count” and “these protected outer rows assessed the whole choice” remain different sentences even when their digits happen to coincide.

For classification, **accuracy** is correct predictions divided by assessed observations. For regression, **mean squared error** averages squared residuals, `(target − prediction)²`; it has squared target units and lower is better. A residual is the difference between an observed answer and its prediction. Accuracy can conceal rare consequential failures; the later [metrics](/learn/path/full-curriculum/evaluation-metrics-precision-recall-f1-auc-roc-ap-r-mae?module=classical-ml) and [imbalanced-learning](/learn/path/full-curriculum/imbalanced-learning-smote-cost-sensitive-learning?module=classical-ml) lessons develop other objectives. We will define the small F1 calculation we need before using it here.

| Data role in this operation | Permitted influence |
| --- | --- |
| Training | Fit preparation and estimator state |
| Validation | Compare recipes, choose settings or stop fitting |
| Test / outer assessment | Score a complete procedure whose choices were made elsewhere |

Roles describe use at a particular stage. A row can train one fold and be held out in another. Within the operation that makes a prediction for it, its target must stay outside that operation's fitting and selection. A score used to choose is a **selection score**; a score from appropriately protected rows is an **assessment** under the stated protocol. They are reported separately. Calling a used validation set “test” later cannot undo its influence.

One protected split gives a concrete boundary. Can we give every development row a held-out turn while preserving that boundary? The next section builds the actual index lists, fitted states and predictions that answer this question.
