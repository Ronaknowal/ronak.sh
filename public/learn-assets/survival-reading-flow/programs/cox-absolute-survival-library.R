# Supplied-coefficient Cox curve with explicit profiles and baseline method.
library(survival)

cohort <- data.frame(time=c(1, 2, 2, 3, 4, 5),
                     event=c(TRUE, TRUE, TRUE, FALSE, TRUE, FALSE),
                     x=c(-1, 0, 1, -1, 0, 1))
fixed_cohort <- coxph(Surv(time, event) ~ x, data=cohort, ties="efron",
                      init=log(2), control=coxph.control(iter.max=0),
                      x=TRUE, y=TRUE, model=TRUE)
profiles <- data.frame(x=c(-1, 0, 1))
curves <- survfit(fixed_cohort, newdata=profiles, stype=2, ctype=1,
                  se.fit=FALSE, conf.int=FALSE)
at4 <- summary(curves, times=4)
expected_hazard <- 214/273 * exp(log(2) * profiles$x)
stopifnot(isTRUE(all.equal(as.numeric(at4$cumhaz), expected_hazard, tolerance=1e-10)))
stopifnot(isTRUE(all.equal(as.numeric(at4$surv), exp(-expected_hazard), tolerance=1e-10)))
cat("fixed-beta Breslow S(4), x=-1,0,1:", as.numeric(at4$surv), "\n")

# Coefficient ties="efron" describes its likelihood. Baseline ctype=1
# deliberately chooses the Breslow increment; ctype=2 is the changed
# tie-corrected cumulative-hazard calculation. Use explicit newdata.
