# Ordinary residual/test route on the already taught untied fixture.
# Source-only R route, without recorded output.
library(survival)
data <- data.frame(time=c(1, 2, 2.5, 3, 4, 5),
                   event=c(1, 1, 1, 0, 1, 0),
                   x=c(-1, 0, 1, -1, 0, 1))
# This full learner route fits its own null model before diagnosing it.
fit <- coxph(Surv(time, event) ~ x, data=data, ties="efron", x=TRUE,
             control=coxph.control(eps=1e-10))
print(coef(fit))
print(residuals(fit, type="schoenfeld"))
diagnostic <- cox.zph(fit, transform="identity", terms=FALSE, global=FALSE)
print(diagnostic$table)
plot(diagnostic)
abline(h=coef(fit)[["x"]], lty=2)
