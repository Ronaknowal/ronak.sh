"""Finite-grid observation likelihood and matched statsmodels GLM calculations."""

import numpy as np
import statsmodels.api as sm
from discrete_survival import (expand_subjects, row_terms, objective_parts,
                               fit_intervals, survival_from_predictors)


def main():
    edges = np.array([0., 2., 4., 6.])
    time = np.array([5., 4., 3., 2., 6., 6.])
    event = np.array([1, 0, 0, 1, 1, 0])
    features = np.array([[0.], [1.], [0.], [1.], [1.], [0.]])
    rows = expand_subjects(time, event, edges)
    print("constructed subjects / binary rows:", len(time), len(rows.event))
    print("rows (subject, interval starting at 1, event):",
          list(zip(rows.subject.tolist(), (rows.interval + 1).tolist(), rows.event.astype(int).tolist())))
    q = np.array([.1, .2, .25])
    eta = np.log(q) - np.log1p(-q)
    log_s, survival = survival_from_predictors(eta, "logit")
    print("D44 survival:", np.round(survival, 6).tolist())
    print("event in interval3 / censor after interval2:", round(.9 * .8 * .25, 6), round(.9 * .8, 6))
    baseline_q, multiplier = .2, 2.
    print("D45 baseline / logit odds x2 / grouped PH x2:", baseline_q,
          round(2 * baseline_q / (1 + baseline_q), 6), round(-np.expm1(multiplier * np.log1p(-baseline_q)), 6))
    # The ordinary GLM materializes one-hot rows only for this small witness.
    design = np.column_stack([np.eye(rows.n_intervals)[rows.interval], features[rows.subject]])
    fixed = np.array([-2., -1.5, -1., .4])
    for link in ["logit", "cloglog"]:
        family = sm.families.Binomial(link=sm.families.links.Logit() if link == "logit" else sm.families.links.CLogLog())
        model = sm.GLM(rows.event, design, family=family)
        scratch_loss, scratch_gradient, *_ = objective_parts(rows, features, fixed, link)
        print(link, "fixed-state scratch/library NLL:", round(scratch_loss, 9), round(-model.loglike(fixed), 9))
        print(link, "fixed-state maximum gradient difference:", f"{np.max(np.abs(scratch_gradient + model.score(fixed))):.3e}")
        fitted = fit_intervals(rows, features, link, ridge=.5)
        assert fitted["converged"] and np.all(np.diff(fitted["history"]) <= 1e-10)
        print(link, "new penalized scratch fit:", fitted["converged"], "iterations", fitted["iterations"],
              "parameters", np.round(fitted["parameters"], 6).tolist())
        # statsmodels regularizes average NLL, whereas our core sums NLL.
        library = model.fit_regularized(alpha=.5 / len(rows.event), L1_wt=0,
                                        opt_method="bfgs")
        assert np.max(np.abs(fitted["parameters"] - library.params)) < 1e-3
        print(link, "matched penalized library parameter difference:",
              f"{np.max(np.abs(fitted['parameters'] - library.params)):.3e}")


if __name__ == "__main__":
    main()
