"""N4: finite weighted moments and analytic contrasts in a declared frame."""
import numpy as np


def moments(values, probabilities):
    y, p = np.asarray(values, float), np.asarray(probabilities, float)
    if y.ndim != 1 or p.shape != y.shape or not np.isfinite(y).all() or not np.isfinite(p).all() or np.any(p < 0) or not np.isclose(p.sum(), 1., atol=1e-12, rtol=0.):
        raise ValueError("Expected finite values and a normalized probability vector")
    centered = y - p @ y
    m2, m4, m6 = [float(p @ centered**power) for power in [2, 4, 6]]
    if not np.isfinite([m2, m4, m6]).all() or m2 <= 0:
        raise ValueError("Standardized contrast needs finite positive variance")
    return {"variance": m2, "fourth": m4, "sixth": m6, "kurtosis": m4 / m2**2 - 3}


def nonlinearities(values, contrast, alpha=1.):
    y = np.asarray(values, dtype=float)
    if not np.isfinite(y).all():
        raise ValueError("Expected finite projections")
    if contrast == "cubic":
        g, gp = y**3, 3*y*y
    elif contrast == "logcosh":
        if not np.isfinite(alpha) or not 1 <= alpha <= 2:
            raise ValueError("logcosh alpha must lie in [1,2]")
        g = np.tanh(alpha*y)
        gp = alpha*(1-g*g)
    elif contrast == "exp":
        e = np.exp(-y*y/2)
        g, gp = y*e, (1-y*y)*e
    else:
        raise ValueError("Unknown contrast")
    if not np.isfinite(g).all() or not np.isfinite(gp).all():
        raise ValueError("Contrast overflowed; rescale the input")
    return g, gp


def main():
    from mixing_and_ambiguity import S
    for angle in [0., 30., 45., 90.]:
        w = np.array([np.cos(np.deg2rad(angle)), np.sin(np.deg2rad(angle))])
        print("source_frame_degrees", angle, "binary", moments(S @ w, [.25]*4),
              "analytic_Laplace_kurtosis", 3*np.sum(w**4), "analytic_Gaussian_kurtosis", 0.)
    print("zero_kurtosis_nonGaussian", moments([-3**.5, 0., 3**.5], [1/6, 2/3, 1/6]))
    for contrast in ["cubic", "logcosh", "exp"]:
        print("g_and_derivative", contrast, tuple(a.tolist() for a in nonlinearities([-.8, 0., .8], contrast)))
    try:
        moments([2., 2.], [.5, .5])
    except ValueError as error:
        print("refused", str(error))


if __name__ == "__main__":
    main()
