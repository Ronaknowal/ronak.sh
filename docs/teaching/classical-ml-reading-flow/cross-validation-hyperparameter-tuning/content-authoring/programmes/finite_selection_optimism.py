"""Exact criterion learning with four fair labels; no model fitting."""
from itertools import product
from fractions import Fraction


def selected_score(labels, candidates):
    labels = tuple(labels)
    if not labels or any(value not in (0, 1) for value in labels) or not candidates:
        raise ValueError("Need nonempty binary labels and candidate predictions.")
    if any(len(row) != len(labels) or any(value not in (0, 1) for value in row) for row in candidates):
        raise ValueError("Each candidate must predict one binary label per case.")
    scores = [Fraction(sum(a == b for a, b in zip(labels, row)), len(labels)) for row in candidates]
    selected = max(range(len(scores)), key=lambda i: scores[i])
    return selected, scores[selected], scores


def exact_mean(candidates, n=4):
    return sum((selected_score(labels, candidates)[1] for labels in product([0, 1], repeat=n)), Fraction(0)) / 2**n


def fresh_accuracy(prediction):
    n = len(prediction)
    return sum((Fraction(sum(a == b for a, b in zip(prediction, fresh)), n)
                for fresh in product([0, 1], repeat=n)), Fraction(0)) / 2**n


def main():
    candidates = [(0,) * 4, (1,) * 4]
    for labels in product([0, 1], repeat=4):
        winner, score, scores = selected_score(labels, candidates)
        print("labels", labels, "scores", [str(s) for s in scores], "winner", winner,
              "selected", str(score), "fresh", str(fresh_accuracy(candidates[winner])))
    print("constant rules mean", str(exact_mean(candidates)))
    print("duplicate rule mean", str(exact_mean(candidates + [candidates[0]])))
    print("all patterns mean", str(exact_mean(list(product([0, 1], repeat=4)))))
    print("changed pattern", selected_score((0, 1, 0, 1), candidates + [(0, 1, 0, 1)])[:2])


if __name__ == "__main__":
    main()
