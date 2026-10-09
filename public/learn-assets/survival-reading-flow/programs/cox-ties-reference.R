# Ordinary survival-package routes with coefficients held at log(2).
# This is a supplied-coefficient comparison, not an optimized coefficient fit.
library(survival)

day2 <- data.frame(time=c(2, 2, 3, 3, 3),
                   event=c(TRUE, TRUE, FALSE, FALSE, FALSE),
                   x=c(0, 1, -1, 0, 1))
fixed <- coxph(Surv(time, event) ~ x, data=day2, ties="exact",
               init=log(2), control=coxph.control(iter.max=0),
               x=TRUE, y=TRUE, model=TRUE)
stopifnot(isTRUE(all.equal(unname(coef(fixed)), log(2), tolerance=1e-10)))
stopifnot(fixed$iter == 0)
stopifnot(isTRUE(all.equal(unname(tail(fixed$loglik, 1)), log(1/8), tolerance=1e-10)))
cat("fixed exact day2 factor:", exp(tail(fixed$loglik, 1)), "\n")

cohort <- data.frame(time=c(1, 2, 2, 3, 4, 5),
                     event=c(TRUE, TRUE, TRUE, FALSE, TRUE, FALSE),
                     x=c(-1, 0, 1, -1, 0, 1))
fixed_cohort <- coxph(Surv(time, event) ~ x, data=cohort, ties="efron",
                      init=log(2), control=coxph.control(iter.max=0),
                      x=TRUE, y=TRUE, model=TRUE)
profiles <- data.frame(x=c(-1, 0, 1))
# ctype=1 deliberately selects uncorrected/Breslow cumulative-hazard increments,
# while the coefficient object declares Efron tied-event likelihood terms.
curves <- survfit(fixed_cohort, newdata=profiles, stype=2, ctype=1,
                  se.fit=FALSE, conf.int=FALSE)
at4 <- summary(curves, times=4)
expected_hazard <- 214/273 * exp(log(2) * profiles$x)
stopifnot(isTRUE(all.equal(as.numeric(at4$cumhaz), expected_hazard, tolerance=1e-10)))
stopifnot(isTRUE(all.equal(as.numeric(at4$surv), exp(-expected_hazard), tolerance=1e-10)))
cat("fixed-beta Breslow S(4), x=-1,0,1:", as.numeric(at4$surv), "\n")

# To fit coefficients in a NEW learner experiment, omit init and the zero-
# iteration control. Keep the selected ties option and explicit newdata/ctype.
# Do not confuse the fixed-beta object above with a converged fitted model.
