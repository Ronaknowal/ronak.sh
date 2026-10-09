import math

def pareto_indices(points):
    points = [tuple(point) for point in points]
    if not points:
        return []
    width = len(points[0])
    if width == 0 or any(len(p) != width for p in points):
        raise ValueError("Objective dimensions must match and be positive")
    if any(not math.isfinite(v) for point in points for v in point):
        raise ValueError("Objectives must be finite")
    def dominates(a, b):
        return all(x <= y for x, y in zip(a, b)) and any(
            x < y for x, y in zip(a, b))
    return [i for i, p in enumerate(points)
            if not any(dominates(q, p) for q in points)]

names = ["S", "C", "M", "L", "G", "M-copy"]
points = [(12, 8), (11, 15), (8, 18), (7, 70), (13, 22), (8, 18)]
print("Nondominated:", [names[i] for i in pareto_indices(points)])
print("Empty input:", pareto_indices([]))