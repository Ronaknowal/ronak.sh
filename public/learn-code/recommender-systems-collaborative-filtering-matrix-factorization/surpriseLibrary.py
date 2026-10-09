import numpy as np

ratings = np.array(
    [
        [5, 3, np.nan, 1, np.nan, 4, np.nan],
        [4, np.nan, 4, 1, 2, np.nan, 3],
        [np.nan, 3, np.nan, np.nan, 4, 3, np.nan],
        [1, np.nan, np.nan, 5, 4, np.nan, 2],
        [np.nan, 1, 5, 4, np.nan, np.nan, 3],
    ],
    dtype=float,
)
observed = np.isfinite(ratings)

import pandas as pd
import surprise
from surprise import Dataset, Reader, SVD

records = [
    (str(user), str(item), float(ratings[user, item]))
    for user, item in zip(*np.where(observed))
]
frame = pd.DataFrame(records, columns=["user", "item", "rating"])
train = Dataset.load_from_df(frame, Reader(rating_scale=(1, 5))).build_full_trainset()
model = SVD(n_factors=2, n_epochs=160, lr_all=0.02, reg_all=0.1, random_state=7)
model.fit(train)
print("Surprise version:", surprise.__version__)
for item in (2, 4, 6):
    prediction = model.predict("0", str(item), clip=False)
    print(f"user 0, item {item}: {prediction.est:.6f}")
print(f"unknown user, known item 0: {model.predict('new', '0', clip=False).est:.6f}")
print(f"both unknown: {model.predict('new', 'new', clip=False).est:.6f}")
assert np.isclose(model.predict("new", "new", clip=False).est, train.global_mean)
print("This fits the full toy matrix for API inspection; it is not a test evaluation.")