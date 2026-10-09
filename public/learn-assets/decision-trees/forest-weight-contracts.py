"""Leaf-occurrence weights, proximity and a separate honesty/monotonicity case."""
import numpy as np
from sklearn.tree import DecisionTreeClassifier


def query_weights(member_leaf_occurrences, n):
    weights = np.zeros(n)
    for occurrences in member_leaf_occurrences:
        if not occurrences:
            raise ValueError('empty query leaf needs an explicit estimation policy')
        weights += np.bincount(occurrences, minlength=n) / len(occurrences)
    return weights / len(member_leaf_occurrences)


def proximity(leaf_codes):
    codes = np.asarray(leaf_codes)
    return np.mean(codes[:,None,:] == codes[None,:,:], axis=2)


def main():
    targets = np.array([1,2,5])
    for members in [[[0,1],[1,2]], [[0,0,1],[2]]]:
        weights = query_weights(members, 3)
        print('weights:', weights.tolist(), 'answer:', float(weights @ targets))
    gram = proximity([[1,2],[1,3],[4,3]])
    print('proximity:', gram.tolist())
    print('eigenvalues:', np.linalg.eigvalsh(gram).tolist())
    split_X = np.arange(4).reshape(-1,1); split_y = [0,0,1,1]
    structure = DecisionTreeClassifier(max_depth=1, random_state=0).fit(split_X, split_y)
    estimate_X = np.array([[.5],[2.5]]); estimate_y = np.array([0,1])
    leaf_ids = structure.apply(estimate_X)
    query = np.array([[.2],[1.5],[2.9]])
    # Estimation labels enter only saved leaf tallies, never structure fitting.
    answers = []
    for leaf in structure.apply(query):
        in_leaf = estimate_y[leaf_ids == leaf]
        answers.append(float(in_leaf.mean()) if len(in_leaf) else None)
    print('honest fixed-structure probabilities:', answers)
    X = np.arange(5).reshape(-1,1); y = [0,1,0,1,1]
    for constraint in [None, [1]]:
        model = DecisionTreeClassifier(random_state=0, monotonic_cst=constraint).fit(X, y)
        print('monotonic' if constraint else 'unconstrained', model.predict_proba(X)[:,1].tolist())


if __name__ == '__main__':
    main()
