"""Inspect losses and gain-ratio eligibility. Python 3.12, NumPy, sklearn."""
import math
import numpy as np
from sklearn.tree import DecisionTreeRegressor


def entropy(probabilities, base=2):
    return -sum(p * math.log(p, base) for p in probabilities if p > 0)


def gain_and_ratio(child_counts):
    total = sum(sum(child) for child in child_counts)
    positive = sum(child[1] for child in child_counts)
    parent = entropy([1 - positive / total, positive / total])
    child_entropy = sum(sum(child) / total * entropy([count / sum(child) for count in child]) for child in child_counts)
    gain = parent - child_entropy
    branch_information = entropy([sum(child) / total for child in child_counts])
    return gain, gain / branch_information if branch_information else None


def poisson_deviance(targets, mean):
    targets = np.asarray(targets, dtype=float)
    if np.any(targets < 0) or not np.isfinite(targets).all() or not math.isfinite(mean) or mean <= 0:
        raise ValueError('finite nonnegative counts and positive prediction required')
    terms = [value * math.log(value / mean) - value + mean if value else mean for value in targets]
    return 2 * sum(terms) / len(targets)


def main():
    y = np.array([0,0,0,1]); p = y.mean()
    vectors = np.eye(2)[y]; answer = np.array([1-p, p])
    print('single-coordinate Brier:', np.mean((y-p)**2))
    print('full-vector Brier/Gini:', np.mean(np.sum((vectors-answer)**2, axis=1)))
    print('entropy bits/nats:', entropy(answer), entropy(answer, math.e))
    candidates = {'unique ID': [[1,0],[1,0],[0,1],[0,1]], 'useful binary': [[2,0],[0,2]]}
    print('four-row gain/ratio:', {name: gain_and_ratio(counts) for name, counts in candidates.items()})
    rare = gain_and_ratio([[0,1],[10,9]])
    balanced = gain_and_ratio([[7,3],[3,7]])
    gate = (rare[0] + balanced[0]) / 2
    print('rare/balanced gain/ratio:', rare, balanced, 'mean gain:', gate)
    print('eligible:', [name for name, pair in [('rare',rare),('balanced',balanced)] if pair[0] >= gate])
    targets = np.array([0.,1.,10.]); X = np.zeros((3,1))
    print('mean/median:', targets.mean(), np.median(targets))
    for criterion in ['squared_error', 'absolute_error', 'poisson']:
        model = DecisionTreeRegressor(criterion=criterion, random_state=0).fit(X, targets)
        print(criterion, model.predict([[0]])[0])
    print('count deviance at mean:', poisson_deviance(targets, targets.mean()))


if __name__ == '__main__':
    main()
