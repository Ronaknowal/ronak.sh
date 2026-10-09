import numpy as np

times = np.array([2, 3, 4, 4, 6, 7, 8, 9], dtype=float)
events = np.array([1, 0, 1, 0, 1, 0, 1, 0], dtype=bool)

names = list("ABCDEFGH")
for name, observed, failed in zip(names, times, events):
    statement = f"T = {observed:g}" if failed else f"T > {observed:g}"
    print(name, f"Y={observed:g}", f"event={int(failed)}", statement)
print("observed-time mean:", times.mean())
print("completed-only mean:", times[events].mean())
print("Neither is an ordinary estimate of unrestricted mean lifetime here.")
cutoff = 5.0
print("administrative cutoff 5:", np.minimum(times, cutoff).tolist())
print(
    "events after cutoff are now censored:",
    (events & (times <= cutoff)).astype(int).tolist(),
)