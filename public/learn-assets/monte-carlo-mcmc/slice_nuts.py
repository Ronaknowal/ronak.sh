import math
import random
import statistics

# Original simplified Algorithm 2 (Hoffman and Gelman, 2014), unit mass,
# standard normal target. Keep actual candidate lists for teaching clarity.
def energy(state):
    q, r = state
    return (q*q + r*r) / 2

def leapfrog(state, epsilon):
    q, r = state
    r -= epsilon*q/2
    q += epsilon*r
    r -= epsilon*q/2
    return q, r

def no_turn(left, right):
    displacement = right[0] - left[0]
    return displacement*left[1] >= 0 and displacement*right[1] >= 0

def build_tree(start, direction, depth, epsilon, log_slice):
    if depth == 0:
        state = leapfrog(start, direction*epsilon)
        joint_log = -energy(state)
        valid = math.isfinite(joint_log) and joint_log > log_slice - 1000
        candidates = [state] if valid and log_slice <= joint_log else []
        return state, state, candidates, valid
    left, right, candidates, keep = build_tree(start, direction, depth-1, epsilon, log_slice)
    if not keep:  # The paper permits early exit for a rejected subtree.
        return left, right, candidates, False
    endpoint = left if direction == -1 else right
    new_left, new_right, new_candidates, new_keep = build_tree(endpoint, direction, depth-1, epsilon, log_slice)
    if direction == -1:
        left = new_left
    else:
        right = new_right
    return left, right, candidates + new_candidates, new_keep and no_turn(left, right)

def nuts_step(q, rng, epsilon=.25, max_depth=6):
    if epsilon <= 0 or not 1 <= max_depth <= 10:
        raise ValueError("Use a positive step and depth from 1 to 10")
    initial = (q, rng.gauss(0, 1))
    log_slice = -energy(initial) + math.log(rng.random())
    left = right = initial
    candidates = [initial]
    for depth in range(max_depth):
        direction = -1 if rng.random() < .5 else 1
        start = left if direction == -1 else right
        a, b, new_candidates, keep = build_tree(start, direction, depth, epsilon, log_slice)
        if direction == -1:
            left = a
        else:
            right = b
        if keep:
            candidates.extend(new_candidates)
        # Internally turning new subtrees contribute NO candidates.
        # A whole-tree turn after a valid subtree can retain that subtree.
        if not keep or not no_turn(left, right):
            break
    chosen = candidates[int(rng.random()*len(candidates))]
    return chosen[0], len(candidates)

rng = random.Random(7)
q, samples, pool_sizes = 1.0, [], []
for iteration in range(14000):
    q, size = nuts_step(q, rng)
    if iteration >= 2000:
        samples.append(q)
        pool_sizes.append(size)
print("draws", len(samples))
print("mean", f"{statistics.mean(samples):.3f}", "variance", f"{statistics.variance(samples):.3f}")
print("mean candidate count", f"{statistics.mean(pool_sizes):.2f}")