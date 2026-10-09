"""Read-only first-step AdamW arithmetic from retained tensors and moments.

No model, forward, optimizer construction/step or parameter mutation. The
cross-implementation equality threshold remains separate from this arithmetic
audit. A gradient inferred from a first moment is explicitly labelled inferred.
"""

import torch


def maximum(value):
    return float(value.detach().abs().max())


def audit_step(starting, completed, optimizer, gradients):
    """Audit one CPU float32, fresh-moment, zero-decay AdamW step.

    Parameter order is the retained named-parameter gradient dictionary order;
    state_dict aliases such as tied lm_head.weight are not additional parameters.
    The coordinate error allowance is four float32 ULPs at the predicted value,
    plus four machine-epsilon multiples of the analytical displacement. This is
    declared independently of the observed cross-implementation parameter gap.
    """
    names = list(gradients)
    groups = optimizer["param_groups"]
    ids = [identity for group in groups for identity in group["params"]]
    assert ids == list(range(len(names))), "Unexpected retained parameter order"
    rows = []
    for group in groups:
        assert group["weight_decay"] == 0 and not group["amsgrad"]
        assert (
            not group["maximize"]
            and not group["capturable"]
            and not group["differentiable"]
        )
        beta1, beta2 = group["betas"]
        for identity in group["params"]:
            name = names[identity]
            before, actual = starting[name], completed[name]
            assert before.dtype == actual.dtype == torch.float32
            assert before.device.type == actual.device.type == "cpu"
            slot = optimizer["state"].get(identity)
            if slot is None:
                assert gradients[name] is None and torch.equal(before, actual)
                rows.append({"name": name, "unused": True, "absolute_error": 0.0})
                continue
            assert int(slot["step"]) == 1, "This audit accepts fresh first moments only"
            moment, variance = slot["exp_avg"], slot["exp_avg_sq"]
            inferred = moment / (1 - beta1)
            gradient = gradients[name]
            origin = "retained actual gradient"
            if gradient is None:
                gradient = inferred
                origin = "inferred from retained first moment; actual post-zero_grad gradient absent"
            expected_moment = gradient * (1 - beta1)
            expected_variance = gradient.square() * (1 - beta2)
            torch.testing.assert_close(
                moment,
                expected_moment,
                rtol=16 * torch.finfo(torch.float32).eps,
                atol=0,
            )
            torch.testing.assert_close(
                variance,
                expected_variance,
                rtol=32 * torch.finfo(torch.float32).eps,
                atol=0,
            )
            # Independent high-precision equation evaluated from retained actual
            # moments, then rounded to the parameter dtype. No optimizer call.
            denominator = variance.double().sqrt() / ((1 - beta2) ** 0.5) + group["eps"]
            displacement = (group["lr"] / (1 - beta1)) * moment.double() / denominator
            predicted = (before.double() - displacement).to(before.dtype)
            spacing = (
                (
                    torch.nextafter(predicted, torch.full_like(predicted, float("inf")))
                    - predicted
                )
                .abs()
                .double()
            )
            allowance = (
                4 * spacing + 4 * torch.finfo(torch.float32).eps * displacement.abs()
            )
            error = (actual.double() - predicted.double()).abs()
            rows.append(
                {
                    "name": name,
                    "gradient_origin": origin,
                    "maximum_gradient": maximum(gradient),
                    "maximum_absolute_displacement": maximum(displacement),
                    "maximum_absolute_error": maximum(error),
                    "maximum_coordinate_allowance": maximum(allowance),
                    "all_coordinates_within_arithmetic_allowance": bool(
                        (error <= allowance).all()
                    ),
                }
            )
    return {
        "consistent": all(
            row.get("all_coordinates_within_arithmetic_allowance", True) for row in rows
        ),
        "formula": "theta0 - lr/(1-beta1) * m1 / (sqrt(v1)/sqrt(1-beta2) + epsilon)",
        "allowance": "4 float32 ULPs at prediction plus 4 machine-epsilon multiples of analytical displacement",
        "parameters": rows,
    }


def audit_pair(state):
    reference = state["reference"]
    twin = state["context"]["twin"]
    native = audit_step(
        reference, state["model"], state["optimizer"], state["gradients"]
    )
    explicit = audit_step(
        reference, twin["model"], twin["optimizer"], twin["gradients"]
    )
    names = list(state["gradients"])
    gap = max(maximum(state["model"][name] - twin["model"][name]) for name in names)
    return {
        "native": native,
        "explicit": explicit,
        "cross_implementation_parameter_difference": gap,
        "unchanged_cross_implementation_threshold": 5e-5,
        "cross_implementation_equality_passed": gap < 5e-5,
        "consistent": native["consistent"] and explicit["consistent"],
        "scope": "Own-step analytical consistency does not imply cross-implementation update equality",
    }


def exact_row_mapping(captured, loss_inputs):
    """Match exact token/mask rows, consuming duplicates once; no score fitting."""
    fields = ["prompt_ids", "prompt_mask", "completion_ids", "completion_mask"]
    remaining = list(range(len(captured["prompt_ids"])))
    mapping = []
    for row in range(len(loss_inputs["prompt_ids"])):
        matches = [
            candidate
            for candidate in remaining
            if all(
                torch.equal(captured[field][candidate], loss_inputs[field][row])
                for field in fields
            )
        ]
        if not matches:
            raise ValueError("Loss input has no exact retained address/mask row")
        chosen = matches[0]
        remaining.remove(chosen)
        mapping.append(chosen)
    assert not remaining
    return {
        "loss_row_to_captured_row": mapping,
        "method": "Exact token and mask multiset matching; duplicate identical rows consumed once",
        "historical_score_inference": False,
    }
