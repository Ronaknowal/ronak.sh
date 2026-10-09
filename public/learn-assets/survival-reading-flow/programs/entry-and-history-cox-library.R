# Complete ordinary counting-process route; R source checked, not executed here.
# Run: Rscript entry-and-history-cox-library.R (R plus survival 3.8-6).
library(survival)

# Original observation/history rows. One supplied coefficient, no optimization.
history <- data.frame(id=c('A','A','B'), start=c(0,3,1), stop=c(3,5,6),
                      maintained=c(0,1,0), event=c(FALSE,TRUE,FALSE))
fixed <- coxph(Surv(start,stop,event) ~ maintained, data=history,
               id=id, ties='efron', init=log(2),
               control=coxph.control(iter.max=0), x=TRUE, y=TRUE, model=TRUE)
stopifnot(isTRUE(all.equal(unname(coef(fixed)), log(2), tolerance=1e-10)))
stopifnot(isTRUE(all.equal(tail(fixed$loglik,1), log(2/3), tolerance=1e-10)))
zero_reference <- basehaz(fixed, centered=FALSE)
stopifnot(isTRUE(all.equal(tail(zero_reference$hazard,1), 1/3, tolerance=1e-10)))
path <- data.frame(pathID=c('prescribed','prescribed'), start=c(0,3),
                   stop=c(3,6), event=c(FALSE,FALSE), maintained=c(0,1))
curve <- survfit(fixed, newdata=path, id=pathID, stype=2, ctype=1,
                 se.fit=FALSE, conf.int=FALSE)
stopifnot(isTRUE(all.equal(as.numeric(summary(curve,times=5)$surv), exp(-2/3), tolerance=1e-10)))
print(zero_reference)
print(summary(curve,times=5)$surv)

# NEW finite six-subject fitting witness, distinct from the original two IDs.
cohort <- data.frame(id=c('A','A','B','C','D','E','F'),
                    start=c(0,3,1,0,0,0,0), stop=c(3,5,6,2,4,6,5.5),
                    maintained=c(0,1,0,1,0,1,0),
                    event=c(FALSE,TRUE,FALSE,TRUE,TRUE,FALSE,TRUE))
# Split physical IDs before preparing/expanding a real training dataset.
# This constructed witness uses all six IDs only to demonstrate the fitting API.
fit <- coxph(Surv(start,stop,event) ~ maintained, data=cohort, id=id,
             ties='efron', x=TRUE, y=TRUE, model=TRUE,
             control=coxph.control(eps=1e-10))
print(coef(fit))
fitted_curve <- survfit(fit, newdata=path, id=pathID, stype=2, ctype=1,
                        se.fit=FALSE, conf.int=FALSE)
print(summary(fitted_curve,times=5)$surv)
