"""Count observed-together support; absent objects are never apart decisions."""
from itertools import combinations


def unique_run(records):
    result = {}
    for identity, label in records:
        if identity in result:
            raise ValueError("Resolve repeated training IDs before constructing one assignment per ID.")
        hash(label)
        result[identity] = label
    return result


def coassignment(runs):
    ids = list(dict.fromkeys(identity for run in runs for identity in run))
    lookup = {identity: i for i, identity in enumerate(ids)}
    size = len(ids)
    numerator = [[0] * size for _ in ids]
    support = [[0] * size for _ in ids]
    for run in runs:
        for identity in run:
            i = lookup[identity]
            numerator[i][i] += 1
            support[i][i] += 1
        for first, second in combinations(run, 2):
            i, j = lookup[first], lookup[second]
            for a, b in ((i, j), (j, i)):
                support[a][b] += 1
                numerator[a][b] += int(run[first] == run[second])
    fractions = [[numerator[i][j] / support[i][j] if support[i][j] else None
                  for j in range(size)] for i in range(size)]
    return {"ids": ids, "numerator": numerator, "support": support, "fraction": fractions}


if __name__ == "__main__":
    runs = [unique_run([("A", 0), ("B", 0)]), unique_run([("A", 4), ("B", 9)]),
            unique_run([("A", "alone")]), unique_run([("A", "same"), ("B", "same")])]
    print(coassignment(runs))
    absent = coassignment([unique_run([("A", 0)]), unique_run([("B", 0)])])
    print("Never jointly observed:", absent["fraction"][0][1], "support", absent["support"][0][1])
