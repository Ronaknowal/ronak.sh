from math import isfinite


def erlang_c(arrival, service, servers):
    if type(servers) is not int or not 1 <= servers <= 12:
        raise ValueError("Use one to twelve identical servers")
    if not all(isfinite(x) and 1e-6 <= x <= 1e6 for x in [arrival, service]):
        raise ValueError("Rates must lie in the supported positive range")
    gap = servers * service - arrival
    if gap <= 0:
        raise ValueError("Arrival rate must be below total capacity")
    offered_load = arrival / service
    weights = [1.0]
    for n in range(1, servers + 1):
        weights.append(weights[-1] * offered_load / n)
    tail_weight = weights[-1] * servers * service / gap
    normalizer = sum(weights[:-1]) + tail_weight
    chance_wait = tail_weight / normalizer
    return chance_wait, chance_wait / gap, chance_wait / gap + 1 / service


arrival, service, servers = 8, 5, 2
chance, wait, total = erlang_c(arrival, service, servers)
print("pooled probability of waiting:", round(chance, 6))
print("pooled mean wait / total:", round(wait, 6), round(total, 6))
print(
    "uniform independent split, mean total:",
    round(1 / (service - arrival / servers), 6),
)
print(
    "one server twice as fast, mean total:", round(1 / (servers * service - arrival), 6)
)
print("one-server check:", tuple(round(x, 6) for x in erlang_c(8, 10, 1)))