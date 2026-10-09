"""Normal–inverse-gamma updates using only Python's standard library.

The proper prior is v ~ IG(alpha,beta), with density proportional to
v**(-alpha-1)*exp(-beta/v), and mu|v ~ Normal(mean,v/kappa).
The two-pass summary takes O(n) work and O(n) temporary tuple storage.
Updating or merging an existing summary takes O(1) work/storage; only three
summary values and four posterior parameters are retained. Input values
must be finite and their summary arithmetic must
remain finite. This code does not establish the normal/exchangeable model.
Student-t scale below is the horizontal scale, not its standard deviation.
"""
from dataclasses import dataclass
from math import fsum, isfinite, lgamma, log, pi, sqrt


@dataclass(frozen=True)
class Summary:
    n: int
    mean: float
    sse: float

    def __post_init__(self):
        if isinstance(self.n, bool) or not isinstance(self.n, int) or self.n < 0:
            raise ValueError('summary count must be a nonnegative integer')
        if not isfinite(self.mean) or not isfinite(self.sse) or self.sse < 0:
            raise ValueError('summary needs finite mean and nonnegative SSE')
        if self.n == 0 and (self.mean != 0 or self.sse != 0):
            raise ValueError('empty summary must have zero mean and SSE')

    @classmethod
    def from_values(cls, values):
        values = tuple(values)
        if any(not isfinite(x) for x in values):
            raise ValueError('observations must be finite')
        if not values:
            return cls(0, 0.0, 0.0)
        mean = fsum(values) / len(values)
        sse = fsum((x - mean) ** 2 for x in values)
        if not isfinite(mean) or not isfinite(sse):
            raise ValueError('summary exceeds finite arithmetic')
        return cls(len(values), mean, sse)

    def merge(self, other):
        if self.n == 0:
            return other
        if other.n == 0:
            return self
        n = self.n + other.n
        difference = other.mean - self.mean
        mean = self.mean + difference * other.n / n
        sse = fsum([self.sse, other.sse, difference**2 * self.n * other.n / n])
        if not isfinite(mean) or not isfinite(sse):
            raise ValueError('merged summary exceeds finite arithmetic')
        return Summary(n, mean, sse)


@dataclass(frozen=True)
class NormalInverseGamma:
    mean: float
    kappa: float
    alpha: float
    beta: float

    def __post_init__(self):
        parameters = (self.mean, self.kappa, self.alpha, self.beta)
        if not all(isfinite(p) for p in parameters) or min(parameters[1:]) <= 0:
            raise ValueError('finite location and positive proper-prior parameters required')

    def update(self, summary):
        n, average, sse = summary.n, summary.mean, summary.sse
        if n == 0:
            return self
        kappa = self.kappa + n
        mean = self.mean + n * (average - self.mean) / kappa
        between = self.kappa * n * (average - self.mean) ** 2 / kappa
        return NormalInverseGamma(mean, kappa, self.alpha + n / 2,
                                  self.beta + (sse + between) / 2)

    def student_parameters(self, future=False):
        variance_scale = self.beta / (self.alpha * self.kappa)
        if future:
            variance_scale *= self.kappa + 1
        return 2 * self.alpha, self.mean, sqrt(variance_scale)

    def expected_variance(self):
        if self.alpha <= 1:
            raise ValueError('expected variance exists only when alpha > 1')
        return self.beta / (self.alpha - 1)

    def log_evidence(self, summary):
        posterior = self.update(summary)
        return (lgamma(posterior.alpha) - lgamma(self.alpha)
                + self.alpha * log(self.beta) - posterior.alpha * log(posterior.beta)
                + (log(self.kappa) - log(posterior.kappa)) / 2
                - summary.n * log(2 * pi) / 2)


if __name__ == '__main__':
    values = [2.0, 3.0, 4.0, 7.0]
    summary = Summary.from_values(values)
    prior = NormalInverseGamma(0.0, 1.0, 2.0, 2.0)
    posterior = prior.update(summary)
    combined = Summary.from_values(values[:2]).merge(Summary.from_values(values[2:]))
    print(f'n={summary.n} mean={summary.mean:.6f} SSE={summary.sse:.6f}')
    print(f'posterior m={posterior.mean:.6f} kappa={posterior.kappa:.6f} alpha={posterior.alpha:.6f} beta={posterior.beta:.6f}')
    for future, label in [(False, 'mean'), (True, 'future')]:
        df, location, scale = posterior.student_parameters(future)
        print(f'{label} df={df:.6f} location={location:.6f} scale={scale:.6f}')
    print(f'expected variance={posterior.expected_variance():.6f} log sequence density={prior.log_evidence(summary):.6f}')
    print(f'merged mean={combined.mean:.6f} SSE={combined.sse:.6f}')
