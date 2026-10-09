# Run with R and survival3.8-6: Rscript weighted-subdistribution-library.R
library(survival)

pumps <- data.frame(
  id = 1:6,
  time = 1:6,
  cause = factor(c(2, 1, 0, 2, 1, 0), levels = 0:2,
                 labels = c("logging ended", "motor", "seal")),
  x = c(1, 0, 0, 1, 1, 0)
)
# Carry subject identity through expansion; id is not a fitted predictor.
expanded <- finegray(Surv(time, cause) ~ x + id, data = pumps,
                     etype = "motor", id = id)
fit <- coxph(Surv(fgstart, fgstop, fgstatus) ~ x, data = expanded,
             weights = fgwt, cluster = id, ties = "breslow",
             x = TRUE, model = TRUE)
print(expanded[, c("id", "x", "fgstart", "fgstop", "fgstatus", "fgwt")])
print(coef(fit))
print(basehaz(fit, centered = FALSE))
profiles <- data.frame(x = c(0, 1))
incidence <- 1 - survfit(fit, newdata = profiles)$surv
print(incidence)
