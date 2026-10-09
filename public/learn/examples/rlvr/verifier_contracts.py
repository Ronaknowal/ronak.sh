"""Three finite verification contracts: number, arithmetic AST and formal proof.

python -B verifier_contracts.py --output verifier-results.json
Standard library only. The arithmetic interpreter never calls eval or exec.
"""

import argparse
import ast
from decimal import Decimal, InvalidOperation
from fractions import Fraction
import operator
import re

from rlvr_data import emit


def numeric_object(text):
    """Signed decimal or integer fraction, without units or arbitrary expressions."""
    text = text.strip()
    if re.fullmatch(r"[+-]?\d+/[+-]?\d+", text):
        numerator, denominator = map(int, text.split("/"))
        if denominator == 0:
            raise ValueError("zero denominator")
        return Fraction(numerator, denominator)
    if re.fullmatch(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)", text):
        try:
            return Fraction(Decimal(text))
        except InvalidOperation as exc:
            raise ValueError("invalid decimal") from exc
    raise ValueError("outside the declared numeric grammar")


def extract_final(text):
    """The final #### marker owns the entire remaining non-whitespace string."""
    _, marker, suffix = text.rpartition("####")
    if not marker:
        return {"span": None, "parsed": None, "reason": "missing final marker"}
    start = text.rfind("####") + 4
    left = len(suffix) - len(suffix.lstrip())
    right = len(suffix.rstrip())
    span = [start + left, start + right]
    try:
        value = numeric_object(suffix)
    except ValueError as exc:
        return {"span": span, "parsed": None, "reason": str(exc)}
    return {"span": span, "parsed": str(value), "reason": "parsed numeric object"}


def extract_boxed_numeric(text):
    """Balanced braces, then the same narrow grammar or an integer TeX fraction."""
    start = text.rfind(r"\boxed{")
    if start < 0:
        return {"span": None, "parsed": None, "reason": "missing boxed expression"}
    begin = start + len(r"\boxed{")
    depth, end = 1, begin
    while end < len(text) and depth:
        depth += (text[end] == "{") - (text[end] == "}")
        end += 1
    if depth:
        return {
            "span": [begin, len(text)],
            "parsed": None,
            "reason": "unbalanced braces",
        }
    value = text[begin : end - 1].strip()
    fraction = re.fullmatch(r"\\frac\{([+-]?\d+)\}\{([+-]?\d+)\}", value)
    if fraction:
        value = fraction.group(1) + "/" + fraction.group(2)
    try:
        parsed = str(numeric_object(value))
        return {
            "span": [begin, end - 1],
            "parsed": parsed,
            "reason": "parsed narrow boxed number",
        }
    except ValueError as exc:
        return {"span": [begin, end - 1], "parsed": None, "reason": str(exc)}


def final_verdict(text, gold):
    parsed = extract_final(text)
    if gold is None:
        return {
            **parsed,
            "accepted": None,
            "reward": None,
            "reason": "gold unavailable",
        }
    try:
        expected = numeric_object(str(gold))
    except ValueError:
        return {
            **parsed,
            "accepted": None,
            "reward": None,
            "reason": "gold outside contract",
        }
    accepted = parsed["parsed"] is not None and Fraction(parsed["parsed"]) == expected
    return {
        **parsed,
        "gold_parsed": str(expected),
        "accepted": accepted,
        "reward": int(accepted),
        "reason": (
            parsed["reason"]
            if parsed["parsed"] is None
            else ("exact numeric match" if accepted else "numeric mismatch")
        ),
    }


def arithmetic_expression(source, x, y):
    """Interpret only integer constants, x/y, and +, −, ×. No Python execution."""
    if len(source) > 256:
        raise ValueError("expression too large for this teaching contract")
    tree = ast.parse(source, mode="eval")
    if sum(1 for _ in ast.walk(tree)) > 64:
        raise ValueError("expression has too many AST nodes")
    operations = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul}
    values = {"x": x, "y": y}

    def visit(node):
        if isinstance(node, ast.Constant) and type(node.value) is int:
            return node.value
        if isinstance(node, ast.Name) and node.id in values:
            return values[node.id]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return -visit(node.operand)
        if isinstance(node, ast.BinOp) and type(node.op) in operations:
            return operations[type(node.op)](visit(node.left), visit(node.right))
        raise ValueError("unsupported arithmetic AST node: " + type(node).__name__)

    return visit(tree.body)


def check_tests(expression, tests):
    rows = []
    for x, y, expected in tests:
        try:
            actual = arithmetic_expression(expression, x, y)
            rows.append(
                {
                    "x": x,
                    "y": y,
                    "expected": expected,
                    "actual": actual,
                    "passed": actual == expected,
                }
            )
        except (ValueError, SyntaxError) as exc:
            rows.append(
                {
                    "x": x,
                    "y": y,
                    "expected": expected,
                    "actual": None,
                    "passed": False,
                    "reason": str(exc),
                }
            )
    return {
        "expression": expression,
        "tests": rows,
        "accepted": bool(rows) and all(row["passed"] for row in rows),
    }


def derive(proof, context=None):
    """Reconstruct a proposition in a small natural-deduction kernel."""
    context = {} if context is None else dict(context)
    rule = proof[0]
    if rule == "assume":
        if proof[1] not in context:
            raise ValueError("assumption out of scope: " + proof[1])
        return context[proof[1]]
    if rule in ["and-left", "and-right"]:
        proposition = derive(proof[1], context)
        if not isinstance(proposition, tuple) or proposition[0] != "and":
            raise ValueError("conjunction elimination needs a conjunction")
        return proposition[1 if rule == "and-left" else 2]
    if rule == "and-intro":
        return ("and", derive(proof[1], context), derive(proof[2], context))
    if rule == "imp-intro":
        name, premise, body = proof[1:]
        if name in context:
            raise ValueError("fresh assumption name required")
        context[name] = premise
        return ("implies", premise, derive(body, context))
    raise ValueError("unsupported proof rule: " + rule)


def proof_verdict(proof, goal):
    try:
        proposition = derive(proof)
        return {
            "accepted": proposition == goal,
            "derived": proposition,
            "goal": goal,
            "reason": (
                "goal matches"
                if proposition == goal
                else "different derived proposition"
            ),
        }
    except ValueError as exc:
        return {"accepted": False, "derived": None, "goal": goal, "reason": str(exc)}


def run():
    cases = [
        ("valid calculation", "48 + 24 = 72.\n#### 72", "72"),
        ("wrong reasoning, accepted answer", "48/2 = 20, 48+20 = 68.\n#### 72", "72"),
        ("wrong number", "#### 24", "72"),
        ("no marker", "The answer is 72", "72"),
        ("decimal equivalence", "#### 72.0", "72"),
        ("fraction equivalence", "#### 1/2", ".5"),
        ("last marker", "#### 24\n#### 72", "72"),
        ("trailing units", "#### 72 clips", "72"),
        ("percentage syntax", "#### 50%", ".5"),
        ("missing gold", "#### 72", None),
        ("zero denominator", "#### 1/0", "1"),
    ]
    numeric = [
        {
            "name": name,
            "prediction": prediction,
            "gold": gold,
            **final_verdict(prediction, gold),
        }
        for name, prediction, gold in cases
    ]
    weak = [(2, 0, 2), (-1, 0, -1)]
    strong = weak + [(2, 3, 5)]
    tests = [
        check_tests(expression, suite)
        for expression in ["x", "x+y", "x-y", "__import__('os')"]
        for suite in [weak, strong]
    ]
    conjunction = ("and", "P", "Q")
    goal = ("implies", conjunction, ("and", "Q", "P"))
    assumption = ("assume", "h")
    body = ("and-intro", ("and-right", assumption), ("and-left", assumption))
    valid = ("imp-intro", "h", conjunction, body)
    wrong = (
        "imp-intro",
        "h",
        conjunction,
        ("and-intro", ("and-left", assumption), ("and-left", assumption)),
    )
    proofs = [
        {"proof": proof, **proof_verdict(proof, goal)} for proof in [valid, wrong, body]
    ]
    boxed = [
        {"response": text, **extract_boxed_numeric(text)}
        for text in [
            r"Answer: \boxed{72}",
            r"\boxed{\frac{1}{2}}",
            r"\boxed{\frac{1}{0}}",
            r"\boxed{\frac{1}{2}",
            r"\boxed{\frac{1+1}{4}}",
        ]
    ]
    return {
        "numeric": numeric,
        "boxed_numeric": boxed,
        "finite_tests": tests,
        "formal_proofs": proofs,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="verifier-results.json")
    args = parser.parse_args()
    result = run()
    emit(args.output, result)
    print(
        {
            "numeric_cases": len(result["numeric"]),
            "test_suites": len(result["finite_tests"]),
            "proof_cases": len(result["formal_proofs"]),
        }
    )


if __name__ == "__main__":
    main()
