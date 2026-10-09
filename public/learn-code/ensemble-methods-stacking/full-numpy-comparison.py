import numpy as np
from collections import Counter

# ── Decision stump helpers ────────────────────────────────────────────────────

def stump_fit(X, y, w):
    """Fit a weighted decision stump; returns (feat, threshold, polarity, error)."""
    best_err, best_feat, best_thresh, best_pol = np.inf, None, None, 1
    for f in range(X.shape[1]):
        for t in np.unique(X[:, f]):
            for polarity in [1, -1]:
                pred = np.where(X[:, f] <= t, polarity, -polarity)
                err = np.sum(w[pred != y])
                if err < best_err:
                    best_err, best_feat, best_thresh, best_pol = err, f, t, polarity
    return best_feat, best_thresh, best_pol, best_err

def stump_predict(X, feat, thresh, polarity):
    return np.where(X[:, feat] <= thresh, polarity, -polarity)


# ── BaggingClassifier ─────────────────────────────────────────────────────────

class BaggingClassifier:
    def __init__(self, n_estimators=50, max_depth=3, random_state=42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state

    def _make_tree(self, X, y):
        def gini(y):
            if len(y) == 0: return 0.0
            p = np.array(list(Counter(y).values())) / len(y)
            return 1 - np.sum(p ** 2)

        def best_split(X, y):
            best_gain, best_f, best_t = -1, None, None
            pg, n = gini(y), len(y)
            for f in range(X.shape[1]):
                for t in np.unique(X[:, f]):
                    lm = X[:, f] <= t
                    if lm.sum() == 0 or (~lm).sum() == 0: continue
                    gain = pg - (lm.sum()/n * gini(y[lm])
                                 + (~lm).sum()/n * gini(y[~lm]))
                    if gain > best_gain:
                        best_gain, best_f, best_t = gain, f, t
            return best_f, best_t, best_gain

        def grow(X, y, depth):
            if depth >= self.max_depth or len(np.unique(y)) == 1:
                return {"leaf": True, "label": Counter(y).most_common(1)[0][0]}
            f, t, gain = best_split(X, y)
            if f is None or gain <= 0:
                return {"leaf": True, "label": Counter(y).most_common(1)[0][0]}
            lm = X[:, f] <= t
            return {"leaf": False, "feat": f, "thresh": t,
                    "left":  grow(X[lm],  y[lm],  depth + 1),
                    "right": grow(X[~lm], y[~lm], depth + 1)}

        return grow(X, y, 0)

    def _predict_one(self, x, node):
        if node["leaf"]: return node["label"]
        child = "left" if x[node["feat"]] <= node["thresh"] else "right"
        return self._predict_one(x, node[child])

    def fit(self, X, y):
        rng = np.random.RandomState(self.random_state)
        n = len(y)
        self.estimators_ = []
        for _ in range(self.n_estimators):
            idx = rng.choice(n, size=n, replace=True)   # bootstrap sample
            self.estimators_.append(self._make_tree(X[idx], y[idx]))
        return self

    def predict(self, X):
        preds = np.stack(
            [[self._predict_one(x, t) for x in X] for t in self.estimators_],
            axis=1)
        return np.array([Counter(row).most_common(1)[0][0] for row in preds])


# ── AdaBoostClassifier ────────────────────────────────────────────────────────

class AdaBoostClassifier:
    """AdaBoost with decision stumps as weak learners. Labels must be {0, 1}."""
    def __init__(self, n_estimators=50, random_state=42):
        self.n_estimators = n_estimators

    def fit(self, X, y):
        y_ = np.where(y == 0, -1, 1)   # recode to {-1, +1} for AdaBoost math
        n = len(y_)
        w = np.full(n, 1.0 / n)
        self.stumps_, self.alphas_ = [], []
        for _ in range(self.n_estimators):
            feat, thresh, pol, err = stump_fit(X, y_, w)
            err = np.clip(err, 1e-10, 1 - 1e-10)
            alpha = 0.5 * np.log((1 - err) / err)      # eq. from Section 3
            preds = stump_predict(X, feat, thresh, pol)
            w = w * np.exp(-alpha * y_ * preds)
            w /= w.sum()
            self.stumps_.append((feat, thresh, pol))
            self.alphas_.append(alpha)
        return self

    def predict(self, X):
        score = sum(a * stump_predict(X, f, t, p)
                    for (f, t, p), a in zip(self.stumps_, self.alphas_))
        return np.where(score >= 0, 1, 0)


# ── Dataset & evaluation ──────────────────────────────────────────────────────

def make_circles_np(n_samples=300, noise=0.12, random_state=42):
    rng = np.random.RandomState(random_state)
    n_each = n_samples // 2
    t = np.linspace(0, 2 * np.pi, n_each)
    X_inner = np.c_[0.5*np.cos(t), 0.5*np.sin(t)] + rng.randn(n_each, 2)*noise
    X_outer = np.c_[np.cos(t), np.sin(t)] + rng.randn(n_each, 2)*noise
    return np.vstack([X_inner, X_outer]), np.array([0]*n_each + [1]*n_each)

def train_test_split_np(X, y, test_size=0.25, random_state=42):
    rng = np.random.RandomState(random_state)
    idx = rng.permutation(len(y))
    n_test = int(len(y) * test_size)
    return X[idx[n_test:]], X[idx[:n_test]], y[idx[n_test:]], y[idx[:n_test]]

X, y = make_circles_np(n_samples=300, noise=0.12, random_state=42)
X_train, X_test, y_train, y_test = train_test_split_np(X, y)

bag = BaggingClassifier(n_estimators=50, max_depth=3, random_state=42)
bag.fit(X_train, y_train)
print(f"BaggingClassifier  (50 trees, depth=3): {np.mean(bag.predict(X_test)==y_test):.4f}")

ada = AdaBoostClassifier(n_estimators=50)
ada.fit(X_train, y_train)
print(f"AdaBoostClassifier (50 rounds, stumps): {np.mean(ada.predict(X_test)==y_test):.4f}")
print(f"  alpha round  1: {ada.alphas_[0]:.4f}")
print(f"  alpha round 10: {ada.alphas_[9]:.4f}")
print(f"  alpha round 50: {ada.alphas_[49]:.4f}")

# Output:
# BaggingClassifier  (50 trees, depth=3): 0.7600
# AdaBoostClassifier (50 rounds, stumps): 0.9333
#   alpha round  1: 0.3667
#   alpha round 10: 0.3576
#   alpha round 50: 0.2598