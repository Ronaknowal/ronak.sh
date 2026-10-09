"""Actual Math-Verify extraction/grading and the TRL accuracy reward contract.

python -B math_verify_bridge.py --output math-verify-results.json
Direct parser/grader calls disable POSIX alarm timeouts for this finite fixture.
TRL's own documented worker-thread route disables those timeouts internally.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import importlib.metadata
from math_verify import ExprExtractionConfig, LatexExtractionConfig, parse, verify
from trl.rewards import accuracy_reward

from rlvr_data import emit
from verifier_contracts import final_verdict


def run():
    cases = [
        ("decimal", "72", r"The final answer is $72.0$."),
        ("nested fraction", r"\frac{1}{2}", r"\boxed{\frac{2}{4}}"),
        ("wrong fraction", r"\frac{1}{2}", r"\boxed{\frac{2}{3}}"),
        ("bare numeric", "72", "72"),
        ("GSM marker", "72", "#### 72"),
        ("percentage", ".5", r"\boxed{50\%}"),
        ("units", "72", r"\boxed{72\text{ clips}}"),
        ("multiple boxed", "72", r"\boxed{24} then \boxed{72}"),
        ("malformed", "72", r"\boxed{\frac{72}{}}"),
        ("missing prediction", "72", "No numeric result."),
        ("unparseable gold", "nothing numeric here", r"\boxed{72}"),
    ]
    rows = []
    for name, gold, prediction in cases:
        targets = [LatexExtractionConfig(), ExprExtractionConfig()]
        parsed_gold = parse(gold, extraction_config=targets, parsing_timeout=None)
        parsed_prediction = parse(
            prediction, extraction_config=targets, parsing_timeout=None
        )
        accepted = (
            bool(verify(parsed_gold, parsed_prediction, timeout_seconds=None))
            if parsed_gold
            else None
        )
        rows.append(
            {
                "name": name,
                "gold": gold,
                "prediction": prediction,
                "gold_extracted": [str(value) for value in parsed_gold],
                "prediction_extracted": [str(value) for value in parsed_prediction],
                "direct_accepted": accepted,
                "strict_final_marker": final_verdict(prediction, gold),
            }
        )
    extras = {}

    def collect(name, values):
        extras[name] = values

    completions = [
        [{"role": "assistant", "content": row["prediction"]}] for row in rows
    ]
    # Run the unmodified ordinary reward in its own supported non-main-thread branch.
    with ThreadPoolExecutor(max_workers=1) as executor:
        native = executor.submit(
            accuracy_reward, completions, [row["gold"] for row in rows], collect
        ).result()
    for row, reward in zip(rows, native):
        row["TRL_accuracy_reward"] = reward
    return {
        "versions": {
            name: importlib.metadata.version(name)
            for name in ["math-verify", "trl", "sympy"]
        },
        "settings": {
            "direct_extraction": [
                "LatexExtractionConfig defaults",
                "ExprExtractionConfig defaults",
            ],
            "direct_timeouts": None,
            "native_route": "accuracy_reward in one worker thread",
        },
        "rows": rows,
        "native_extraction_log": extras,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="math-verify-results.json")
    args = parser.parse_args()
    result = run()
    emit(args.output, result)
    print(
        {
            "cases": len(result["rows"]),
            "native_rewards": [row["TRL_accuracy_reward"] for row in result["rows"]],
        }
    )


if __name__ == "__main__":
    main()
