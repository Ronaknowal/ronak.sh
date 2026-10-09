# Complete ordinary no-entry interval/AFT route, separate from the entry core.
# Run: Rscript typed-censored-likelihood-library.R (R and survival 3.8-6).
library(survival)

# NEW finite witness matching typed-censored-likelihood.py:
# exact2, right5, finite(1,3], left<=2. interval2 exact has equal bounds;
# infinite/NA bounds denote censoring. These codes do not become Cox inputs.
observations <- data.frame(lower=c(2,5,1,NA), upper=c(2,NA,3,2))
response <- with(observations, Surv(lower,upper,type='interval2'))
print(response)
fit <- survreg(response ~ 1, data=observations, dist='exponential',
               x=TRUE, y=TRUE, model=TRUE, control=survreg.control(rel.tolerance=1e-10))
# Exponential is Weibull shape1. R intercept is log TIME scale; rate=1/scale.
rate <- exp(-unname(coef(fit)[1]))
print(rate)
print(fit$loglik)
probability_1_to_3 <- exp(-rate) * (-expm1(-2*rate))
print(probability_1_to_3)

# Separate nonparametric interval estimate, not a constant-rate model.
nonparametric <- survfit(response ~ 1)
print(nonparametric)
plot(nonparametric)

# Surv(counting) is not a delayed-entry argument to survreg. The conditional
# entry/intersection likelihood in survival_likelihoods.py has a separate
# observation contract; this no-entry R fit claims no entry parity.
