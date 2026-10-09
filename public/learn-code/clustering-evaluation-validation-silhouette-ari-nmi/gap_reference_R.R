# Ordinary R route: source contract, not a byte-identical Python reproduction.
library(cluster)
x <- rbind(c(0,0), c(.2,.1), c(-.2,-.1), c(.1,-.2),
           c(4,4), c(4.1,4.2), c(3.8,3.9), c(4.2,3.8),
           c(8,0), c(8.2,.1), c(7.8,-.1), c(8.1,-.2))
fit <- function(x, k) list(cluster=kmeans(x, centers=k, nstart=20)$cluster)
set.seed(23)
result <- clusGap(x, FUNcluster=fit, K.max=4, B=8,
                 d.power=2, spaceH0="scaledPCA")
print(result$Tab)
chosen <- maxSE(result$Tab[,"gap"], result$Tab[,"SE.sim"],
                method="Tibs2001SEmax")
cat("R chosen k:", chosen, "\n")
# R's d.power=2 cost is half ordinary SSE. Constant scaling cancels in Gap.
# Python's displayed scratch uses ddof=0 and an unresolved terminal boundary.
