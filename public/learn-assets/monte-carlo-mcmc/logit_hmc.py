import math
import random
import statistics

def sigmoid(eta):
    if eta >= 0:
        return 1/(1+math.exp(-eta))
    e = math.exp(eta)
    return e/(1+e)

def softplus(x):
    return max(x,0) + math.log1p(math.exp(-abs(x)))

def potential(eta):
    # Minus log transformed Beta(10,4), including dtheta/deta.
    return 10*softplus(-eta) + 4*softplus(eta)

def gradient(eta):
    return 14*sigmoid(eta) - 10

def leapfrog(eta, momentum, epsilon):
    momentum -= epsilon*gradient(eta)/2
    eta += epsilon*momentum
    momentum -= epsilon*gradient(eta)/2
    return eta, momentum

rng = random.Random(7)
eta, samples, accepted = 0.0, [], 0
for iteration in range(14000):
    r = rng.gauss(0,1)
    old_energy = potential(eta)+r*r/2
    proposal, momentum = eta, r
    for _ in range(12):
        proposal, momentum = leapfrog(proposal,momentum,.3)
    momentum = -momentum
    new_energy = potential(proposal)+momentum*momentum/2
    if math.isfinite(new_energy) and math.log(rng.random()) < min(0,old_energy-new_energy):
        eta = proposal
        accepted += 1
    if iteration >= 2000:
        samples.append(sigmoid(eta))  # transform each retained draw back

print("draws",len(samples),"acceptance",f"{accepted/14000:.3f}")
print("mean theta",f"{statistics.mean(samples):.4f}")
print("P(theta > .70)",f"{statistics.mean(x>.7 for x in samples):.4f}")