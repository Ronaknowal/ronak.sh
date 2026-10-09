import pandas as pd
from lifelines import KaplanMeierFitter

entry = [0, 1, 2, 0]
exit_time = [3, 4, 5, 6]
event = [True, False, True, False]
fit = KaplanMeierFitter().fit(exit_time, event, entry=entry)
print("delayed-entry S(3), S(5):", [round(float(fit.predict(t)), 6) for t in [3, 5]])
histories = pd.DataFrame(
    [
        {"id": "A", "start": 0.0, "stop": 3.0, "maintained": 0, "event": 0},
        {"id": "A", "start": 3.0, "stop": 5.0, "maintained": 1, "event": 1},
        {"id": "B", "start": 1.0, "stop": 6.0, "maintained": 0, "event": 0},
    ]
)
print(histories.to_string(index=False))
for subject, rows in histories.groupby("id", sort=False):
    rows = rows.sort_values("start")
    assert (rows.start < rows.stop).all()
    assert all(rows.start.iloc[k] >= rows.stop.iloc[k - 1] for k in range(1, len(rows)))
    assert rows.event.iloc[:-1].sum() == 0
for time in [3.0, 5.0]:
    risk = histories[(histories.start < time) & (time <= histories.stop)]
    print("risk set at", time, risk[["id", "maintained", "event"]].to_dict("records"))
print(
    "All rows from A stay in one split. A future 'ever maintained' flag is not a baseline feature."
)