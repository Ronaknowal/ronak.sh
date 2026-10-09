import math

joint = [0.08, 0.20, 0.12]
evidence = sum(joint)
posterior = [weight / evidence for weight in joint]

def inspect(q):
    elbo = sum(prob * (math.log(weight) - math.log(prob))
               for prob, weight in zip(q, joint) if prob > 0)
    kl = sum(prob * math.log(prob / target)
             for prob, target in zip(q, posterior) if prob > 0)
    return elbo, kl

# Under qB=qC, differentiate the one-variable KL and solve for qA.
scale = posterior[0] + 2 * math.sqrt(posterior[1] * posterior[2])
first = posterior[0] / scale
restricted = [first, (1 - first) / 2, (1 - first) / 2]
print("posterior", [round(p, 6) for p in posterior])
for label, q in [("uniform", [1/3] * 3),
                 ("restricted", restricted), ("exact", posterior)]:
    elbo, kl = inspect(q)
    print(label, [round(p, 6) for p in q],
          round(elbo, 6), round(kl, 6))
    assert math.isclose(elbo + kl, math.log(evidence), abs_tol=1e-12)
