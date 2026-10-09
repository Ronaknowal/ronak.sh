import numpy as np

counts = np.array(
    [
        [10, 3, 0, 1, 0, 15, 0],
        [8, 0, 5, 1, 2, 0, 4],
        [0, 6, 0, 0, 9, 12, 0],
        [1, 0, 0, 20, 7, 0, 3],
        [0, 1, 14, 8, 0, 0, 6],
    ],
    dtype=float,
)

import implicit
from scipy.sparse import csr_matrix
from implicit.cpu.als import AlternatingLeastSquares

alpha, penalty = 2.0, 0.2
confidence = csr_matrix(np.where(counts > 0, 1.0 + alpha * counts, 0.0))
model = AlternatingLeastSquares(
    factors=3,
    regularization=penalty,
    alpha=1.0,
    dtype=np.float64,
    use_cg=False,
    iterations=12,
    num_threads=1,
    random_state=11,
)
model.fit(confidence, show_progress=False)
print("implicit version:", implicit.__version__)
print("user factors, item factors:", model.user_factors.shape, model.item_factors.shape)
# The last item sweep changes Q. Recalculate this user against that final Q.
user = model.recalculate_user(0, confidence[0])
q = model.item_factors
c = 1.0 + alpha * counts[0]
target = (counts[0] > 0).astype(float)
direct = np.linalg.solve(
    q.T @ (c[:, None] * q) + penalty * np.eye(3), q.T @ (c * target)
)
assert np.allclose(user, direct, atol=1e-8)
ids, scores = model.recommend(
    0, confidence[0], N=3, recalculate_user=True, filter_already_liked_items=True
)
print(
    "unseen recommendations:",
    [(int(item), round(float(value), 6)) for item, value in zip(ids, scores)],
)
print(
    "recalculated user matches the declared dense confidence objective:",
    bool(np.allclose(user, direct, atol=1e-8)),
)