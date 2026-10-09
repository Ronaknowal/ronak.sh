import numpy as np
from sksurv.tree import SurvivalTree
from sksurv.ensemble import RandomSurvivalForest
from sksurv.util import Surv
from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test

temperature = np.array([0, 1, 2, 3, 4, 5, 6, 7], dtype=float)
time = np.array([8, 9, 7, 6, 4, 3, 2, 5], dtype=float)
event = np.array([1, 0, 1, 0, 1, 1, 1, 0], dtype=bool)
target = Surv.from_arrays(event, time)
for threshold in [2.5, 3.5, 4.5]:
    low = temperature <= threshold
    test = logrank_test(time[low], time[~low], event[low], event[~low])
    print("threshold / log-rank chi-square:", threshold, round(test.test_statistic, 6))
tree = SurvivalTree(max_depth=1, min_samples_leaf=2, random_state=4).fit(
    temperature[:, None], target
)
threshold = tree.tree_.threshold[0]
print("chosen threshold:", threshold)
for profile in [1.0, 6.0]:
    survival = tree.predict_survival_function([[profile]])[0]
    print("profile", profile, "S(4), S(5):", np.round(survival([4, 5]), 6).tolist())
forest = RandomSurvivalForest(
    n_estimators=20, max_depth=2, min_samples_leaf=2, random_state=4, n_jobs=1
).fit(temperature[:, None], target)
print(
    "forest S(4) for both profiles:",
    [round(fn(4), 6) for fn in forest.predict_survival_function([[1.0], [6.0]])],
)
print("This tiny training illustration is not a held-out model comparison.")