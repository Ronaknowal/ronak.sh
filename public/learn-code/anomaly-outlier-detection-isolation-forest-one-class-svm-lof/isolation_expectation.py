"""Exact cut-length expectation for a small rational one-dimensional fixture."""
from fractions import Fraction
from functools import lru_cache


def correction(m):
    if m <= 1:
        return Fraction(0)
    return 2*sum((Fraction(1, j) for j in range(1, m)), Fraction(0))-Fraction(2*(m-1), m)


def expectations(values, depth_cap=3):
    if not 2 <= len(values) <= 6 or type(depth_cap) is not int or not 1 <= depth_cap <= 5:
        raise ValueError('Use two to six rational positions and depth cap one to five.')
    ordered = sorted((Fraction(str(value)), identity) for identity, value in enumerate(values))
    positions = [value for value, _ in ordered]

    @lru_cache(None)
    def solve(start, stop, depth):
        size = stop-start
        span = positions[stop-1]-positions[start]
        if size <= 1 or depth == depth_cap or span == 0:
            return (Fraction(depth)+correction(size),)*size
        result = [Fraction(0)]*size
        for split in range(start+1, stop):
            width = positions[split]-positions[split-1]
            if width == 0:
                continue
            children = solve(start, split, depth+1)+solve(split, stop, depth+1)
            for index, path in enumerate(children):
                result[index] += width/span*path
        return tuple(result)

    normalizer = correction(len(values))
    result = [None]*len(values)
    for (_, identity), path in zip(ordered, solve(0, len(values), 0)):
        result[identity] = {'mean_path': path, 'score': 2**(-float(path/normalizer))}
    return result


if __name__ == '__main__':
    for values in ([0, 1, 2, 3, 12], [0, 1, 2, 3, 4], [7, 7, 7, 7, 7]):
        rows = expectations(values)
        print('positions', values)
        print('exact paths', [str(row['mean_path']) for row in rows])
        print('scores', [round(row['score'], 9) for row in rows])
