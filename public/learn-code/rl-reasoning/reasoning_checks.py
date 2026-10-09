"""Inspectable finite-grammar arithmetic checks; no expression execution.
Run: python reasoning_checks.py
"""
import json
import re
from fractions import Fraction


TRACE = re.compile(r"\s*sum\s*=\s*(-?\d+)\s*;\s*answer\s*=\s*(-?\d+)\s*\Z")
DIRECT = re.compile(r"\s*answer\s*=\s*(-?\d+)\s*\Z")
TERMINAL_NUMBER = re.compile(r"####\s*(-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*\Z")


def check_trace(a, b, c, text, terminated=True):
    trace = TRACE.fullmatch(text)
    direct = DIRECT.fullmatch(text)
    answer = int(trace.group(2)) if trace else int(direct.group(1)) if direct else None
    intermediate = int(trace.group(1)) if trace else None
    answer_correct = answer == (a + b) * c if answer is not None else False
    sum_correct = intermediate == a + b if intermediate is not None else None
    product_consistent = answer == intermediate * c if intermediate is not None else None
    return {"text": text, "format_valid": bool(trace or direct), "terminated": bool(terminated),
            "sum": intermediate, "answer": answer, "sum_correct": sum_correct,
            "product_consistent": product_consistent, "answer_correct": answer_correct,
            "derivation_correct": bool(trace and sum_correct and product_consistent),
            "reward": int(answer_correct and terminated)}


def terminal_number(text):
    """Require one terminal answer marker; compare exact decimal values."""
    if text.count("####") != 1:
        return None
    match = TERMINAL_NUMBER.search(text)
    return Fraction(match.group(1).replace(",", "")) if match else None


def gsm_reward(text, reference):
    expected, actual = terminal_number(reference), terminal_number(text)
    if expected is None:
        raise ValueError("Reference needs one numeric terminal #### answer")
    return float(actual is not None and actual == expected)


def main():
    cases = [("sum = 5; answer = 15", True), ("sum = 6; answer = 15", True),
             ("answer = 15", True), ("sum = 5; answer =", False),
             ("sum = 5; answer = 15", False), ("sum = 5; answer = 16", True)]
    print(json.dumps([check_trace(2, 3, 3, text, eos) for text, eos in cases], indent=2))


if __name__ == "__main__":
    main()
