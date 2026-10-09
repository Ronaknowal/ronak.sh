def composite(f, a, b, n, method):
    if not (a < b and n >= 1 and isinstance(n, int)):
        raise ValueError(
            "Use an increasing interval and positive integer n"
        )
    if method not in ("trapezoid", "simpson") or (
        method == "simpson" and n % 2
    ):
        raise ValueError("Classic Simpson needs even n")
    h = (b - a) / n
    if method == "trapezoid":
        return h * (
            f(a) / 2 + sum(f(a + i * h) for i in range(1, n)) + f(b) / 2
        )
    return (
        h
        / 3
        * (
            f(a)
            + f(b)
            + sum(
                (4 if i % 2 else 2) * f(a + i * h) for i in range(1, n)
            )
        )
    )


for n in [2, 4, 8]:
    print(
        n,
        round(composite(lambda x: x * x, 0.0, 1.0, n, "trapezoid"), 6),
        round(composite(lambda x: x * x, 0.0, 1.0, n, "simpson"), 6),
    )
times, rates = [0.0, 0.5, 2.0], [0.0, 2.0, 2.0]
areas = [
    (times[i + 1] - times[i]) * (rates[i] + rates[i + 1]) / 2
    for i in range(len(times) - 1)
]
print("measured areas:", areas, "total:", sum(areas))