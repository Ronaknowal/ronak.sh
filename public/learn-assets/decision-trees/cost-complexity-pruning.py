"""Postorder weakest-link path; place decision_tree_core.py beside this file."""
from copy import deepcopy
import numpy as np
from decision_tree_core import BinaryTree


def gini(node):
    p = node['probability']
    return 2 * p * (1 - p)


def subtree_summary(node, root_count, choices):
    collapsed_risk = node['count'] / root_count * gini(node)
    if 'left' not in node:
        return collapsed_risk, 1
    left_risk, left_leaves = subtree_summary(node['left'], root_count, choices)
    right_risk, right_leaves = subtree_summary(node['right'], root_count, choices)
    risk, leaves = left_risk + right_risk, left_leaves + right_leaves
    effective = (collapsed_risk - risk) / (leaves - 1)
    choices.append((effective, node))
    return risk, leaves


def collapse(node):
    for key in ('left', 'right', 'feature', 'threshold', 'gain'):
        node.pop(key, None)


def pruning_path(root):
    tree = deepcopy(root); result = []
    alpha = 0.0
    while True:
        choices = []
        risk, leaves = subtree_summary(tree, tree['count'], choices)
        result.append({'alpha': alpha, 'risk': risk, 'leaves': leaves, 'tree': deepcopy(tree)})
        if not choices:
            return result
        alpha = min(value for value, _ in choices)
        # Simultaneous weakest links include ancestor ties: the ancestor wins.
        for value, node in choices:
            if np.isclose(value, alpha, rtol=1e-12, atol=1e-14):
                collapse(node)


if __name__ == '__main__':
    from sklearn.tree import DecisionTreeClassifier
    X = np.array([[1,1],[2,1],[1,3],[2,3],[4,1],[5,1],[4,3],[5,3]])
    y = np.array([0,0,1,1,1,1,0,1])
    root = BinaryTree(max_depth=None).fit(X, y).root
    print('scratch path:', [(row['alpha'], row['risk'], row['leaves']) for row in pruning_path(root)])
    path = DecisionTreeClassifier(random_state=0).cost_complexity_pruning_path(X, y)
    print('library alpha:', path.ccp_alphas.tolist())
    print('library risk:', path.impurities.tolist())
