"""Finite extensions and observed marginal transport; keep all companion files nearby.
Dependencies: numpy==2.3.5, scipy==1.18.1, POT==0.9.7.
Dataset: R datasets sleep; paired observations, GPL-2, see sleep-provenance.json.
"""
import csv
from pathlib import Path
import numpy as np
import ot
from scipy.spatial.distance import cdist
from scipy.stats import wasserstein_distance
from unbalanced_log_scaling import solve, objective_terms
from intrinsic_three_points import SOURCE, TARGET, distances, coupling, gw


def marginal_error(plan, a, b):
    return max(float(np.max(abs(plan.sum(axis=1) - a))),
               float(np.max(abs(plan.sum(axis=0) - b))))


def barycentre_demo():
    print("versions numpy/POT", np.__version__, ot.__version__)
    grid = np.arange(5, dtype=float)
    cost = (grid[:, None] - grid[None, :]) ** 2
    histograms = np.array([[.5, 0], [0, 0], [.5, .5], [0, 0], [0, .5]])
    mean, log = ot.bregman.barycenter(histograms, cost, .5, weights=np.array([.5, .5]),
                                    method="sinkhorn_log", numItermax=10000,
                                    stopThr=1e-12, log=True, warn=True)
    print("barycentre", np.round(mean, 9).tolist(), "total", f"{mean.sum():.9f}")
    print("barycentre log keys", sorted(log), "last error", f"{log['err'][-1]:.3e}")
    for j in range(2):
        # The log-barycentre implementation floors zero bins at1e-16.
        target = histograms[:, j] + 1e-16
        target /= target.sum()
        plan = ot.sinkhorn(mean / mean.sum(), target, cost, .5, method="sinkhorn_log",
                           numItermax=10000, stopThr=1e-12)
        print("barycentre coupling", j, np.round(plan, 9).tolist())
        print("marginal residual", f"{marginal_error(plan, mean / mean.sum(), target):.3e}")


def soft_demo():
    a, b, c = np.array([.2, .8]), np.array([.7, .3]), np.array([[0., 1.], [2., 0.]])
    reference, status = solve(a, b, c, .5, 2)
    plan, log = ot.unbalanced.sinkhorn_unbalanced(a, b, c, .5, 2,
                    method="sinkhorn_stabilized", reg_type="entropy", numItermax=10000,
                    stopThr=1e-12, log=True)
    terms = objective_terms(plan, a, b, c, .5, 2)
    print("soft POT plan", np.round(plan, 9).tolist())
    print("soft scratch difference", f"{np.max(abs(plan - reference)):.3e}")
    print("soft objective terms", np.round(terms, 9).tolist())
    reconciled = log["total_cost"] - (.5 + 2 * 2) * plan.sum() + 2 * (a.sum() + b.sum())
    print("soft full/reconciled log", f"{terms.sum():.9f}", f"{reconciled:.9f}")
    stationarity = (c + .5 * np.log(plan) + 2 * np.log(plan.sum(axis=1) / a)[:, None]
                    + 2 * np.log(plan.sum(axis=0) / b)[None, :])
    print("soft stationarity", f"{np.max(abs(stationarity)):.3e}")


def intrinsic_demo():
    left, right = np.array(distances(SOURCE)), np.array(distances(TARGET))
    weights = np.ones(3) / 3
    product = np.ones((3, 3)) / 9
    for name, initial in [("product", product), ("near witness", np.array(coupling((1, 2, 0), .1)))]:
        plan, log = ot.gromov.entropic_gromov_wasserstein(left, right, weights, weights,
                    loss_fun="square_loss", epsilon=.05, symmetric=True, solver="PGD",
                    G0=initial, max_iter=1000, tol=1e-10, numItermax=10000,
                    stopThr=1e-12, log=True, verbose=False)
        print("GW initial", name, "plan", np.round(plan, 9).tolist())
        print("GW recomputed/log", f"{gw(plan, left, right):.9f}", f"{log['gw_dist']:.9f}")
        print("GW marginal residual/last update", f"{marginal_error(plan, weights, weights):.3e}",
              f"{log['err'][-1]:.3e}")


def observed_demo():
    with Path(__file__).with_name("sleep-pairs.csv").open(newline="", encoding="utf-8") as stream:
        records = list(csv.DictReader(stream))
    x = np.array([float(row["drug1_extra_hours"]) for row in records])
    y = np.array([float(row["drug2_extra_hours"]) for row in records])
    print("sleep ID/drug1/drug2", [[int(row["id"]), float(row["drug1_extra_hours"]),
                                     float(row["drug2_extra_hours"])] for row in records])
    weights = np.ones(len(x)) / len(x)
    ground = cdist(x[:, None], y[:, None], metric="sqeuclidean")
    plan = ot.emd(weights, weights, ground)
    sorted_x, sorted_y = np.sort(x), np.sort(y)
    w1 = float(np.mean(abs(sorted_x - sorted_y)))
    squared = float(np.mean((sorted_x - sorted_y) ** 2))
    print("sleep sorted drug1/drug2", sorted_x.tolist(), sorted_y.tolist())
    print("sleep W1 scratch/SciPy", f"{w1:.9f}", f"{wasserstein_distance(x, y):.9f}")
    print("sleep W2 squared scratch/POT", f"{squared:.9f}", f"{np.sum(plan * ground):.9f}")
    print("sleep actual paired squared displacement", f"{np.mean((y - x) ** 2):.9f}")
    print("sleep marginal residual", f"{marginal_error(plan, weights, weights):.3e}")


def main():
    barycentre_demo()
    soft_demo()
    intrinsic_demo()
    observed_demo()


if __name__ == "__main__":
    main()
