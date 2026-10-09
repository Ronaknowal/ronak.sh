# Exact conditional subset factor with a supplied, unoptimized coefficient.
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

# For a NEW coefficient-fitting experiment, omit init and the zero-iteration
# control. This file itself checks a fixed coefficient, not convergence.
