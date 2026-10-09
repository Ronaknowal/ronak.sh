"""An exact two-choice autoregressive policy and its reward gradient.
Run: python sequence_policy.py
The finite vocabulary is sum={4,5,6}, then answer={12,15,18}, then fixed EOS.
"""
import json
import math
import random


SUMS, ANSWERS = (4, 5, 6), (12, 15, 18)
INITIAL = [[math.log(p) for p in row] for row in
           ((.2, .5, .3), (.7, .2, .1), (.1, .8, .1), (.2, .3, .5))]


def softmax(logits):
    peak = max(logits)
    weights = [math.exp(value - peak) for value in logits]
    total = math.fsum(weights)
    return [weight / total for weight in weights]


def trajectories(logits, require_derivation=False):
    probabilities = [softmax(row) for row in logits]
    return [{"sum": s, "answer": a, "choices": [i, j],
             "probability": probabilities[0][i] * probabilities[i + 1][j],
             "reward": int(a == 15 and (not require_derivation or s == 5))}
            for i, s in enumerate(SUMS) for j, a in enumerate(ANSWERS)]


def exact_gradient(logits, require_derivation=False):
    """Reverse expected values through the tree; no numerical differentiation."""
    p = [softmax(row) for row in logits]
    rewards = [[int(a == 15 and (not require_derivation or s == 5))
                for a in ANSWERS] for s in SUMS]
    child_values = [math.fsum(q * r for q, r in zip(row, reward))
                    for row, reward in zip(p[1:], rewards)]
    value = math.fsum(q * v for q, v in zip(p[0], child_values))
    gradient = [[q * (v - value) for q, v in zip(p[0], child_values)]]
    for reach, conditional, reward, mean in zip(p[0], p[1:], rewards, child_values):
        gradient.append([reach * q * (r - mean) for q, r in zip(conditional, reward)])
    return value, gradient


def sample(logits, generator):
    p = [softmax(row) for row in logits]
    i = generator.choices(range(3), weights=p[0])[0]
    j = generator.choices(range(3), weights=p[i + 1])[0]
    return i, j


def score_gradient(logits, choices):
    """Derivative of log p(sum) + log p(answer | sum)."""
    i, j = choices
    result = [[0.] * 3 for _ in logits]
    for node, chosen in ((0, i), (i + 1, j)):
        result[node] = [int(k == chosen) - q for k, q in enumerate(softmax(logits[node]))]
    return result


def sampled_gradient(logits, count=10000, seed=17, baseline=.5, require_derivation=False):
    generator = random.Random(seed)
    result = [[0.] * 3 for _ in logits]
    for _ in range(count):
        i, j = sample(logits, generator)
        reward = int(ANSWERS[j] == 15 and (not require_derivation or SUMS[i] == 5))
        score = score_gradient(logits, (i, j))
        for row in range(4):
            for col in range(3):
                result[row][col] += (reward - baseline) * score[row][col] / count
    return result


def update(logits, gradient, rate=.1):
    return [[z + rate * g for z, g in zip(row, change)] for row, change in zip(logits, gradient)]


def verify():
    """Compare the complete12-coordinate manual derivative with Torch and differences."""
    import torch
    errors = []
    for strict in (False, True):
        value, derivative = exact_gradient(INITIAL, strict)
        parameters = torch.tensor(INITIAL, dtype=torch.float64, requires_grad=True)
        p = parameters.softmax(-1)
        rewards = torch.tensor([[int(a == 15 and (not strict or s == 5)) for a in ANSWERS]
                                for s in SUMS], dtype=torch.float64)
        expected = (p[0, :, None] * p[1:] * rewards).sum()
        expected.backward()
        torch.testing.assert_close(parameters.grad, torch.tensor(derivative, dtype=torch.float64), atol=1e-14, rtol=1e-14)
        assert abs(float(expected.detach()) - value) < 1e-14
        for row in range(4):
            for column in range(3):
                plus, minus = [v[:] for v in INITIAL], [v[:] for v in INITIAL]
                plus[row][column] += 1e-5
                minus[row][column] -= 1e-5
                finite = (exact_gradient(plus, strict)[0] - exact_gradient(minus, strict)[0]) / 2e-5
                errors.append(abs(finite - derivative[row][column]))
        assert max(errors) < 1e-10
    return {'manual_autograd_finite_difference_coordinates': len(errors), 'maximum_error': max(errors)}


def main():
    value, gradient = exact_gradient(INITIAL)
    changed = update(INITIAL, gradient)
    print(json.dumps({"trajectories": trajectories(INITIAL), "expected_reward": value,
                      "gradient": gradient, "updated_expected_reward": exact_gradient(changed)[0],
                      "derivation_reward": exact_gradient(INITIAL, True)[0],
                      "sampled_gradient": sampled_gradient(INITIAL), 'checks': verify()}, indent=2))


if __name__ == "__main__":
    main()
