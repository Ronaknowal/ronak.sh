from math import sqrt

# Independent cases: theta ~ N(0,1); one observation x | theta ~ N(theta,1).
def encoder(x):
    return x / 2, sqrt(0.5)

for observed in [-2, 0, 2]:
    mean, sd = encoder(observed)
    posterior_variance = sd * sd
    # A new measurement of the same latent theta adds unit observation variance.
    predictive_variance = 1 + posterior_variance
    print(observed, mean, round(posterior_variance, 3),
          round(predictive_variance, 3))

# These three observations are separate cases, not three updates of one theta.
# A fixed mean-zero encoder misses the conditional means for +/-2.
print("restricted mean-zero encoder KL for x=2", (0-1)**2 / (2*0.5))
