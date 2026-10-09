models = [
    {"name": "Small", "error": 0.12, "latency_ms": 8},
    {"name": "Medium", "error": 0.08, "latency_ms": 18},
    {"name": "Large", "error": 0.07, "latency_ms": 70},
]

def choose(models, latency_limit):
    feasible = [m for m in models if m["latency_ms"] <= latency_limit]
    if not feasible:
        return None
    return min(feasible, key=lambda m: (m["error"], m["latency_ms"]))

print(choose(models, 25))
print("5 ms budget:", choose(models, 5))