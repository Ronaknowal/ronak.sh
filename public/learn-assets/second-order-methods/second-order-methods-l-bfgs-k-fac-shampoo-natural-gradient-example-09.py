import numpy as np

p, target, fraction = 0.2, 0.8, 0.25
outcome_probabilities = np.array([1-p, p])
scores = np.array([-1/(1-p), 1/p])
fisher = outcome_probabilities @ scores**2
empirical = np.array([1-target, target]) @ scores**2
gradient = (p-target) / (p*(1-p))
natural_probability_direction = -gradient / fisher
logit = np.log(p/(1-p))
natural_logit_direction = (target-p) / (p*(1-p))
direct_next = p + fraction * natural_probability_direction
logit_next = 1 / (1 + np.exp(-(logit + fraction * natural_logit_direction)))

def kl(next_probability):
    return p*np.log(p/next_probability) + (1-p)*np.log((1-p)/(1-next_probability))

print("Fisher, observed-label outer product:", round(fisher, 6), round(empirical, 6))
print("probability tangent:", round(natural_probability_direction, 6))
print("mapped logit tangent:", round(p*(1-p)*natural_logit_direction, 6))
print("finite endpoints:", round(direct_next, 6), round(logit_next, 6))
print("exact KLs:", round(kl(direct_next), 6), round(kl(logit_next), 6))
print("local probability KL estimate:", round(0.5*fisher*(direct_next-p)**2, 6))
