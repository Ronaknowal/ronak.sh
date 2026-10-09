# Optional ordinary R route; source authored, execution NOT claimed.
# Install once: install.packages('mice'); run: Rscript multiple_imputation_mice.R
library(mice)

# A small constructed regression task. These are not penguin observations.
example <- data.frame(
  outcome = c(3, 5, 7, 9, 11, 13, 15, 17),
  amount = c(1, 2, NA, 4, 5, NA, 7, 8),
  station = factor(c('a', 'b', 'a', 'b', 'a', 'b', 'a', 'b'))
)
# Conditional normal imputation is chosen explicitly for the continuous amount.
# This tiny exact-looking fixture is instructional, not a coverage experiment.
methods <- make.method(example)
methods[] <- ''
methods['amount'] <- 'norm'
predictors <- make.predictorMatrix(example)
predictors[,] <- 0
predictors['amount', c('outcome', 'station')] <- 1
completed <- mice(example, m = 5, maxit = 5, method = methods,
                  predictorMatrix = predictors, seed = 20, printFlag = FALSE)
analyses <- with(completed, lm(outcome ~ amount + station))
pooled <- pool(analyses)
print(summary(pooled))
print(pool.scalar(Q = c(9, 10, 11), U = c(4, 4, 4), n = 100, k = 1))
# Inspect completed$loggedEvents and trace plots in a real analysis. Model
# compatibility, ignorability, degrees of freedom and small-sample instability
# require judgment; pool() does not certify them. Outcome use here belongs to a
# scientific imputation/analysis model. It is not permission to give deployment
# targets to a predictive preprocessing pipeline.
