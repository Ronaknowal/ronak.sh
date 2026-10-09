from math import isfinite


def finite_queue(arrival, service, capacity):
    if type(capacity) is not int or not 1 <= capacity <= 20:
        raise ValueError("Capacity includes service; use one to twenty slots")
    if not all(isfinite(x) and 1e-6 <= x <= 1e6 for x in [arrival, service]):
        raise ValueError("Rates must lie in the supported positive range")
    rho = arrival / service
    weights = [rho**n for n in range(capacity + 1)]
    probabilities = [w / sum(weights) for w in weights]
    admitted = arrival * sum(probabilities[:-1])
    mean_number = sum(n * p for n, p in enumerate(probabilities))
    mean_queue = sum(max(0, n - 1) * p for n, p in enumerate(probabilities))
    return (
        probabilities,
        admitted,
        mean_number,
        mean_number / admitted,
        mean_queue / admitted,
    )


for arrival in [8, 10, 12]:
    probabilities, admitted, count, total, wait = finite_queue(arrival, 10, 3)
    print("offered", arrival, "probabilities", [round(x, 6) for x in probabilities])
    print("drop / admitted rate:", round(probabilities[-1], 6), round(admitted, 6))
    print("L / W / Wq:", round(count, 6), round(total, 6), round(wait, 6))
print("one-slot queue wait:", finite_queue(12, 10, 1)[-1])