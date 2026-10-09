"""Complete finite worked answers for the18 DAPO transfer questions.

python practice_answers.py --output practice.json
All operands are declared teaching examples, not model measurements.
"""

import argparse
import json
import math
from pathlib import Path


def run():
    mean = 0.5
    sd = 1.0
    p = 0.2
    rows = [
        {
            "number": 1,
            "question": "A four-token answer is correct. Which tokens are proven correct?",
            "answer": "The final-answer checker proves none of the local reasoning claims. The scalar outcome is broadcast as a training coefficient, not token-level truth.",
        },
        {
            "number": 2,
            "old": 0.12,
            "current": 0.09,
            "ratio": 0.09 / 0.12,
            "answer": "The ratio is.75. Both old and reference scores are detached, so their difference alone has zero parameter derivative.",
        },
        {
            "number": 3,
            "rewards": [-1, 1, 1, 1],
            "mean": mean,
            "sample_sd": sd,
            "advantages": [(r - mean) / (sd + 1e-6) for r in [-1, 1, 1, 1]],
            "answer": "Sample variance is(2.25+3×.25)/3=1. Scaling all rewards by c>0 preserves normalized coefficients exactly only when epsilon also scales by c or is zero.",
        },
        {
            "number": 4,
            "ratio": 1.24,
            "positive_symmetric_surrogate": 2.4,
            "positive_asymmetric_surrogate": 2.48,
            "negative_symmetric_surrogate": -2.48,
            "negative_asymmetric_surrogate": -2.48,
            "answer": "A positive reward has a wider rising branch with Clip-Higher; a negative advantage still penalizes this high ratio. The optimizer is not a projection onto probability bounds.",
        },
        {
            "number": 5,
            "probability_before": p,
            "probability_after": 0.3,
            "entropy_before": -sum(x * math.log(x) for x in [p, 1 - p]),
            "entropy_after": -sum(x * math.log(x) for x in [0.3, 0.7]),
            "dual_clip_A_minus_half_ratio8_loss": 3.0,
            "answer": "Increasing the initially rarer outcome from.2 to.3 increases entropy. For A=-.5,c=6, the extra loss cap is3; this cap is a separate reproduction option.",
        },
        {
            "number": 6,
            "lengths": [3, 9],
            "mean_terms": [2.0, -1.0],
            "response_mean": 0.5,
            "token_mean": -0.25,
            "answer": "Response mean=(2-1)/2; pooled mean=(3×2-9)/12. Duplicating a token changes counts and relative influence.",
        },
        {
            "number": 7,
            "batches": [["all-pass", "mixed"], ["all-fail", "mixed"], ["mixed", "mixed"]],
            "target_groups": 3,
            "selected": [[0, 1], [1, 1], [2, 0]],
            "discarded_eligible": [2, 1],
            "answer": "Keep complete mixed groups in arrival order. The last candidate group is generated but excluded by the target quota; it still counts as work.",
        },
        {
            "number": 8,
            "G": 3,
            "p": 0.25,
            "mixed_probability": 0.5625,
            "ideal_candidates_for4": 64 / 9,
            "answer": "All-pass and all-fail probabilities are.25**3 and.75**3; mixed probability is.5625. Target/acceptance is an unlimited IID expectation, not a finite guarantee.",
        },
        {
            "number": 9,
            "cap": 120,
            "buffer": 40,
            "length": 90,
            "penalty": -0.25,
            "zero_reward_group": [0, 2, 2, 2],
            "zero_reward_centered": -1.5,
            "answer": "The buffer begins at80, so(80-90)/40=-.25. Zero reward can have negative advantage; a zero loss mask instead removes the token terms.",
        },
        {
            "number": 10,
            "microbatch_tokens": [3, 5],
            "microbatch_loss_sums": [6.0, 20.0],
            "global_token_mean": 3.25,
            "mean_of_microbatch_means": 3.0,
            "answer": "Accumulate numerator6+20 and denominator3+5, or sum each numerator divided by8. Averaging2 and4 changes the objective.",
        },
        {
            "number": 11,
            "prompt_ids": ["A", "B", "C", "D"],
            "selected_indices": [3, 0],
            "correct_join": ["D", "A"],
            "answer": "Apply the same UID selection to prompt, completion, mask, reward and old-score fields; do not pair retained responses with the prefix rows[A,B].",
        },
        {
            "number": 12,
            "rewards": [1, 1, 1, 1],
            "advantages": [0, 0, 0, 0],
            "answer": "At beta0 and no auxiliary objectives, the group-relative policy gradient is zero. The group is all correct on sampled outputs, but it supplies no within-group comparison.",
        },
        {
            "number": 13,
            "answer": "A pre-generation collator has prompts and labels but no sampled completions or observed rewards. Dynamic sampling must run after generation and gather complete eligible groups with a finite budget.",
        },
        {
            "number": 14,
            "answer": "A probability can rise without changing argmax labels, reducing NLL with unchanged accuracy. The combined arm changes selection, clipping, normalization and shaping, so its difference does not isolate a component.",
        },
        {
            "number": 15,
            "first_coefficients": [7, 3, 2],
            "second_coefficients": [7, 2, 3],
            "first_answer": 7 - 3 * math.sqrt(2),
            "second_answer": 7 - 2 * math.sqrt(3),
            "mapped_integer": 12,
            "answer": "Distinct real answers map to the same integer12. A correct mapped answer does not validate the original real answer or the reasoning.",
        },
        {
            "number": 16,
            "binary_components": 4,
            "full_factorial_conditions": 16,
            "answer": "A full four-factor binary experiment has16 configurations, with comparable budgets and seeds. A six-row cumulative table gives conditional increments along one path, not all main effects/interactions.",
        },
        {
            "number": 17,
            "run_A": {"generated_groups": 20, "kept_groups": 10},
            "run_B": {"generated_groups": 50, "kept_groups": 10},
            "answer": "Equal accepted-step rewards can hide different candidate work. Record acceptance rates.5 versus.2, generated tokens, masks and elapsed workload before interpreting efficiency.",
        },
        {
            "number": 18,
            "rewards": [-1.0, 1.0],
            "lengths": [3, 2],
            "sample_sd": math.sqrt(2),
            "advantages": [-1 / (math.sqrt(2) + 1e-6), 1 / (math.sqrt(2) + 1e-6)],
            "ratios": [[0.7, 1.0, 1.1], [1.1, 1.4]],
            "answer": "One mixed group is retained. At bounds.8/1.28, negative terms are .8a,1a,1.1a; positive surrogates are1.1a,1.28a with a=1/(sqrt2+epsilon). Divide negative total surrogate by5, freeze old scores, and sum selected-action softmax gradients. This finite trace establishes no language-model reasoning result.",
        },
    ]
    a = rows[-1]["advantages"][1]
    rows[-1]["token_loss"] = [[0.8 * a, a, 1.1 * a], [-1.1 * a, -1.28 * a]]
    rows[-1]["loss"] = sum(sum(x) for x in rows[-1]["token_loss"]) / 5
    rows[-1]["logp_derivatives"] = [[0.0, a / 5, 1.1 * a / 5], [-1.1 * a / 5, 0.0]]
    assert len(rows) == 18 and rows[4]["entropy_after"] > rows[4]["entropy_before"]
    assert abs(rows[17]["loss"] - 0.52 * a / 5) < 1e-12
    return {
        "boundary": "Constructed transfer calculations; no model or corpus execution.",
        "answers": rows,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    with args.output.open("x", encoding="utf-8") as handle:
        json.dump(run(), handle, indent=2)
        handle.write("\n")
    print({"answers": 18})
