"""N10: bounded sparse dictionary descent and fixed-penalty robust PCP ADMM."""

import numpy as np


def finite_matrix(values):
    matrix = np.asarray(values, dtype=float)
    if matrix.ndim != 2 or min(matrix.shape) < 1 or not np.isfinite(matrix).all():
        raise ValueError("Use a finite nonempty matrix")
    return matrix


def soft_threshold(values, threshold):
    if not np.isfinite(threshold) or threshold < 0:
        raise ValueError("Threshold must be finite and nonnegative")
    matrix = np.asarray(values, dtype=float)
    return np.sign(matrix) * np.maximum(np.abs(matrix) - threshold, 0.0)


def singular_threshold(values, threshold):
    matrix = finite_matrix(values)
    if not np.isfinite(threshold) or threshold < 0:
        raise ValueError("Threshold must be finite and nonnegative")
    u, singular_values, vh = np.linalg.svd(matrix, full_matrices=False)
    return (u * np.maximum(singular_values - threshold, 0.0)) @ vh


def project_columns(scores):
    norms = np.linalg.norm(scores, axis=0)
    return scores / np.maximum(1.0, norms)


def dictionary_objective(a, scores, atoms, alpha):
    return 0.5 * np.sum((a - scores @ atoms) ** 2) + alpha * np.abs(atoms).sum()


def sparse_dictionary(values, k, alpha=0.1, max_iterations=2000, tolerance=1e-7):
    a = finite_matrix(values)
    if (
        isinstance(k, bool)
        or not isinstance(k, (int, np.integer))
        or not 1 <= k <= min(a.shape)
    ):
        raise ValueError("Use integer 1<=k<=min(n,d)")
    if not np.isfinite(alpha) or alpha < 0 or max_iterations < 1 or tolerance <= 0:
        raise ValueError("Use nonnegative alpha, positive iterations and tolerance")
    u, singular_values, vh = np.linalg.svd(a, full_matrices=False)
    scores = u[:, :k].copy()
    atoms = singular_values[:k, None] * vh[:k]
    objective = float(dictionary_objective(a, scores, atoms, alpha))
    history = []
    status = "max_iterations"
    for iteration in range(1, max_iterations + 1):
        old_objective = objective
        curvature = float(np.linalg.norm(atoms @ atoms.T, 2))
        if curvature == 0:
            scores = np.zeros_like(scores)
        else:
            gradient = (scores @ atoms - a) @ atoms.T
            step = 1 / curvature
            for _ in range(60):
                trial = project_columns(scores - step * gradient)
                if dictionary_objective(
                    a, trial, atoms, alpha
                ) <= old_objective + 1e-14 * max(1.0, old_objective):
                    scores = trial
                    break
                step *= 0.5
            else:
                raise ArithmeticError("Score-step backtracking failed")
        intermediate_objective = float(dictionary_objective(a, scores, atoms, alpha))
        curvature = float(np.linalg.norm(scores.T @ scores, 2))
        if curvature == 0:
            atoms = np.zeros_like(atoms)
        else:
            gradient = scores.T @ (scores @ atoms - a)
            step = 1 / curvature
            for _ in range(60):
                trial = soft_threshold(atoms - step * gradient, step * alpha)
                if dictionary_objective(
                    a, scores, trial, alpha
                ) <= intermediate_objective + 1e-14 * max(1.0, intermediate_objective):
                    atoms = trial
                    break
                step *= 0.5
            else:
                raise ArithmeticError("Atom-step backtracking failed")
        objective = float(dictionary_objective(a, scores, atoms, alpha))
        residual = scores @ atoms - a
        score_mapping = scores - project_columns(scores - residual @ atoms.T)
        atom_mapping = atoms - soft_threshold(atoms - scores.T @ residual, alpha)
        stationarity = float(
            np.hypot(np.linalg.norm(score_mapping), np.linalg.norm(atom_mapping))
        )
        history.append((iteration, objective, stationarity))
        relative_change = abs(old_objective - objective) / max(1.0, abs(old_objective))
        if relative_change <= tolerance and stationarity <= tolerance * max(
            1.0, np.linalg.norm(a)
        ):
            status = "stationary"
            break
    return {
        "scores": scores,
        "atoms": atoms,
        "objective": objective,
        "history": history,
        "status": status,
    }


def score_atoms(values, atoms, ridge=0.0):
    rows = finite_matrix(values)
    d = finite_matrix(atoms)
    if rows.shape[1] != d.shape[1] or not np.isfinite(ridge) or ridge < 0:
        raise ValueError("Use matching features and nonnegative finite ridge")
    if ridge == 0:
        # Minimum-norm coefficients even when the atoms are dependent.
        return np.linalg.lstsq(d.T, rows.T, rcond=None)[0].T
    gram = d @ d.T + ridge * np.eye(d.shape[0])
    cholesky = np.linalg.cholesky(gram)
    return np.linalg.solve(cholesky.T, np.linalg.solve(cholesky, d @ rows.T)).T


def robust_pcp(
    values,
    sparse_penalty=None,
    penalty=1.0,
    max_iterations=3000,
    absolute_tolerance=1e-7,
    relative_tolerance=1e-6,
):
    matrix = finite_matrix(values)
    lam = 1 / np.sqrt(max(matrix.shape)) if sparse_penalty is None else sparse_penalty
    if not np.isfinite(lam) or lam < 0 or not np.isfinite(penalty) or penalty <= 0:
        raise ValueError("Use nonnegative sparse penalty and positive ADMM penalty")
    if max_iterations < 1 or absolute_tolerance <= 0 or relative_tolerance <= 0:
        raise ValueError("Use positive iteration and tolerance settings")
    low = np.zeros_like(matrix)
    sparse = np.zeros_like(matrix)
    dual = np.zeros_like(matrix)
    if not np.any(matrix):
        return {
            "low": low,
            "sparse": sparse,
            "status": "zero_matrix",
            "history": [],
            "objective": 0.0,
        }
    history = []
    status = "max_iterations"
    root_size = np.sqrt(matrix.size)
    for iteration in range(1, max_iterations + 1):
        old_sparse = sparse.copy()
        low = singular_threshold(matrix - sparse + dual, 1 / penalty)
        sparse = soft_threshold(matrix - low + dual, lam / penalty)
        residual = matrix - low - sparse
        dual = dual + residual
        primal_norm = float(np.linalg.norm(residual))
        dual_norm = float(penalty * np.linalg.norm(sparse - old_sparse))
        primal_limit = root_size * absolute_tolerance + relative_tolerance * max(
            np.linalg.norm(low), np.linalg.norm(sparse), np.linalg.norm(matrix)
        )
        dual_limit = (
            root_size * absolute_tolerance
            + relative_tolerance * penalty * np.linalg.norm(dual)
        )
        history.append((iteration, primal_norm, dual_norm, primal_limit, dual_limit))
        if primal_norm <= primal_limit and dual_norm <= dual_limit:
            status = "converged"
            break
    objective = float(
        np.linalg.svd(low, compute_uv=False).sum() + lam * np.abs(sparse).sum()
    )
    return {
        "low": low,
        "sparse": sparse,
        "status": status,
        "history": history,
        "objective": objective,
    }


def optional_convex_pcp(matrix, sparse_penalty):
    try:
        import cvxpy as cp
    except ImportError:
        return {"status": "optional_package_unavailable"}
    low = cp.Variable(matrix.shape)
    sparse = cp.Variable(matrix.shape)
    problem = cp.Problem(
        cp.Minimize(cp.normNuc(low) + sparse_penalty * cp.norm1(sparse)),
        [low + sparse == matrix],
    )
    problem.solve()
    return {
        "status": problem.status,
        "objective": problem.value,
        "low": low.value,
        "sparse": sparse.value,
    }


def main():
    from sklearn.decomposition import SparsePCA

    np.set_printoptions(precision=6, suppress=True)
    operand = np.array([[2, 1], [1, 2]], dtype=float)
    for threshold in (0, 1, 2, 3):
        print(
            "shared_operand_threshold",
            threshold,
            "entrywise",
            soft_threshold(operand, threshold),
            "singular",
            singular_threshold(operand, threshold),
        )
    atoms = np.array([[1, 0], [1 / np.sqrt(2), 1 / np.sqrt(2)]])
    for ridge in (0.0, 0.1):
        print("nonorthogonal_atom_scores", ridge, score_atoms([[1, 1]], atoms, ridge))
    a = np.array([[2, 1, 0], [-2, -1, 0], [1, 0, 1], [-1, 0, -1]], dtype=float)
    fitted = sparse_dictionary(a, 2, alpha=0.2)
    print(
        "dictionary_status_objective_iterations",
        fitted["status"],
        fitted["objective"],
        len(fitted["history"]),
    )
    print("dictionary_atoms", fitted["atoms"])
    print("dictionary_score_column_norms", np.linalg.norm(fitted["scores"], axis=0))
    ordinary = SparsePCA(
        n_components=2,
        alpha=0.2,
        ridge_alpha=0.01,
        method="cd",
        random_state=0,
        max_iter=2000,
        tol=1e-7,
    ).fit(a)
    print("ordinary_sparse_atoms", ordinary.components_)
    print("ordinary_ridge_query_scores", ordinary.transform([[1, 1, 0]]))
    matrix = np.ones((3, 3))
    matrix[0, 0] += 3
    result = robust_pcp(matrix)
    print(
        "pcp_status_objective_iterations",
        result["status"],
        result["objective"],
        len(result["history"]),
    )
    print("pcp_low", result["low"])
    print("pcp_sparse", result["sparse"])
    print("pcp_last_primal_dual_limits", result["history"][-1])
    ambiguous = np.array([[1.0, 0], [0, 0]])
    print(
        "E11_nuclear_l1",
        np.linalg.svd(ambiguous, compute_uv=False).sum(),
        np.abs(ambiguous).sum(),
    )
    print("zero_pcp_status", robust_pcp(np.zeros((2, 2)))["status"])
    optional = optional_convex_pcp(matrix, 1 / np.sqrt(3))
    print(
        "optional_convex_status_objective",
        optional["status"],
        optional.get("objective"),
    )


if __name__ == "__main__":
    main()
