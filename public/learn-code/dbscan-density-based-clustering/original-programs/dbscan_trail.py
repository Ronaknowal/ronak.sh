from math import dist


def dbscan(points, eps, minimum):
    neighbors = [
        [j for j, other in enumerate(points) if dist(point, other) <= eps]
        for point in points
    ]
    core = [len(row) >= minimum for row in neighbors]
    labels = [-1] * len(points)
    cluster = 0

    for seed in range(len(points)):
        if not core[seed] or labels[seed] != -1:
            continue
        labels[seed] = cluster
        pending = [seed]
        while pending:
            current = pending.pop()
            for other in neighbors[current]:
                if labels[other] != -1:
                    continue
                labels[other] = cluster
                if core[other]:
                    pending.append(other)
        cluster += 1

    types = [
        "core" if core[i] else "border" if labels[i] != -1 else "noise"
        for i in range(len(points))
    ]
    return labels, types


positions = [-1.75, -1.5, -1.25, -1, 1, 1.25, 1.5, 1.75, 0, 4]
points = [(x, 0) for x in positions]
labels, types = dbscan(points, eps=1, minimum=4)
for name, label, kind in zip("ABCDEFGHIJ", labels, types):
    print(name, label, kind)