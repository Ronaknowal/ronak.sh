import math

# True Bernoulli probability P(x=1)=0.7; model believes Q(x=1)=0.9.
p, q = 0.7, 0.9
entropy = -(p * math.log(p) + (1 - p) * math.log(1 - p))
cross_entropy = -(p * math.log(q) + (1 - p) * math.log(1 - q))
kl = cross_entropy - entropy

print(round(entropy, 3), round(cross_entropy, 3), round(kl, 3))