"""Exact arithmetic checks have a precise, restricted meaning.
Run: python synthetic_verification.py   Standard library only.
"""
import ast
from fractions import Fraction
import json
import random


def arithmetic(text):
    """Integer literals, unary signs and +,-,*,/; never execute input code."""
    tree = ast.parse(text, mode="eval")
    def visit(node):
        if isinstance(node, ast.Constant) and type(node.value) is int:
            return Fraction(node.value)
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = visit(node.operand)
            return value if isinstance(node.op, ast.UAdd) else -value
        if isinstance(node, ast.BinOp):
            left, right = visit(node.left), visit(node.right)
            if isinstance(node.op, ast.Add): return left + right
            if isinstance(node.op, ast.Sub): return left - right
            if isinstance(node.op, ast.Mult): return left * right
            if isinstance(node.op, ast.Div): return left / right
        raise ValueError("Outside the arithmetic grammar")
    return visit(tree.body)


def check_candidate(problem, answer, equalities):
    """Check final answer and each equality separately; no proof linkage claim."""
    def safe_equal(left, right):
        try:
            return arithmetic(left) == arithmetic(right)
        except (SyntaxError, ValueError, ZeroDivisionError, TypeError, RecursionError):
            return False
    steps = []
    for line in equalities:
        sides = line.split("=")
        steps.append(len(sides) == 2 and safe_equal(*sides))
    return {"final_correct": safe_equal(problem, answer), "steps_valid": steps,
            "all_equalities_valid": bool(steps) and all(steps)}


def procedural_tasks(count=5, seed=17):
    rng = random.Random(seed)
    rows = []
    for identity in range(count):
        a, b, c = [rng.randint(1, 9) for _ in range(3)]
        expression = f"({a} + {b}) * {c}"
        rows.append({"id": identity, "expression": expression,
                     "answer": str(arithmetic(expression))})
    return rows


def selection(prevalence=.6, true_positive=.9, false_positive=.2,
              generation_cost=.04, check_cost=.01):
    accepted_correct = prevalence * true_positive
    accepted_wrong = (1 - prevalence) * false_positive
    z = accepted_correct + accepted_wrong
    return {"accepted_correct_mass": accepted_correct,
            "accepted_wrong_mass": accepted_wrong, "acceptance": z,
            "precision": accepted_correct / z if z else None,
            "recall": true_positive if prevalence else None,
            "cost_per_keep": (generation_cost + check_cost) / z if z else None}


def main():
    fixtures = [("(2 + 3) * 4", "20", ["2 + 3 = 6", "6 * 4 = 20"]),
                ("(2 + 3) * 4", "20", ["2 + 3 = 5", "5 * 4 = 20"]),
                ("(2 + 3) * 4", "twenty", ["5 * 4 = 20"])]
    print(json.dumps({"tasks": procedural_tasks(), "candidates": [
        check_candidate(*row) for row in fixtures], "selection": selection()}, indent=2))


if __name__ == "__main__":
    main()
