# Ordinary Aalen-Johansen route on NEW declared observed transition histories.
# Run: Rscript repaired-pump-occupancy-library.R (R plus survival 3.8-6).
library(survival)

# Ten pumps start working. Day1: four fail, one becomes terminal, five work.
# Day2: one of five working fails; of four failed, two repair, one terminal,
# one remains failed. Rows ending without a transition use first factor level.
history <- data.frame(
 id=rep(1:10,each=2), start=rep(c(0,1),10), stop=rep(c(1,2),10),
 state=factor(c('failed','working','failed','working','failed','terminal',
                'failed','none','terminal','none','none','failed',
                'none','none','none','none','none','none','none','none'),
              levels=c('none','working','failed','terminal')),
 from=factor(c('working','failed','working','failed','working','failed',
               'working','failed','working','terminal','working','working',
               'working','working','working','working','working','working',
               'working','working'), levels=c('working','failed','terminal')))
# Remove follow-up after the absorbing terminal event at day1 (ID5).
history <- subset(history, !(id==5 & start==1))
curve <- survfit(Surv(start,stop,state) ~ 1, data=history, id=id,
                 istate=from, se.fit=FALSE)
print(curve$states)
print(curve$pstate)
print(curve$transitions)
# States may be ordered by factor levels: inspect names before mapping columns.
# pstate is CURRENT occupancy, not cumulative probability of ever failing.
