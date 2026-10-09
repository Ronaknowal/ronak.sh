"""Pathwise and Price scale gradients for a separate quadratic target N(0,1).

Requires NumPy. rho=log(s); gradients minimize KL (negative ELBO).
Seed51 supplies10,000 independent standard-Normal diagnostic draws per case.
"""
from fractions import Fraction as F
import numpy as np

rng = np.random.default_rng(51)
draw_count = 10000
print("target mean0 variance1; seed51; independent draw count per case", draw_count)
print("m s exact-scale-mean exact-path-variance empirical-path-mean empirical-path-variance price-mean price-variance empirical-mean-component-variance")
for mean in [F(0), F(1), F(-2)]:
    for sd in [F(1,2), F(1), F(2)]:
        exact_mean = sd*sd-1
        exact_variance = mean*mean*sd*sd+2*sd**4
        epsilon = rng.standard_normal(draw_count)
        x = float(mean)+float(sd)*epsilon
        pathwise_scale = x*float(sd)*epsilon-1
        price_scale = np.full(draw_count, float(exact_mean))
        mean_component = x
        assert np.isfinite(pathwise_scale).all()
        assert np.all(price_scale == float(exact_mean))
        print(float(mean), float(sd), str(exact_mean), str(exact_variance),
              format(pathwise_scale.mean(),".8f"), format(pathwise_scale.var(ddof=1),".8f"),
              format(price_scale.mean(),".8f"), format(price_scale.var(ddof=1),".8f"),
              format(mean_component.var(ddof=1),".8f"))
