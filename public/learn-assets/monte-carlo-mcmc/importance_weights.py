from fractions import Fraction as F

target = [F(1, 5), F(1, 2), F(3, 10)]
proposal = [F(1, 3)] * 3
h = [0, 1, 4]
weights = [p / q for p, q in zip(target, proposal)]
truth = sum(p * value for p, value in zip(target, h))
weighted_mean = sum(q * w * value for q, w, value in zip(proposal, weights, h))
weighted_variance = sum(q * (w * value - truth)**2 for q, w, value in zip(proposal, weights, h))
print("weights", [str(w) for w in weights])
print("E_target[h]", truth, "E_proposal[w*h]", weighted_mean)
print("variance of one weighted contribution", weighted_variance)
# Self-normalization is a random ratio when the normalizer is unknown.
# With ONE draw its weighted numerator/denominator equals h(draw).
one_draw_ratio_mean = sum(q * value for q, value in zip(proposal, h))
print("one-draw self-normalized expectation", one_draw_ratio_mean)