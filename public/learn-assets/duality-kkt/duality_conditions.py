def scalar_kkt(center, point, multiplier):
    constraint = -point
    stationarity = 2 * (point - center) - multiplier
    product = multiplier * constraint
    return (constraint <= 0, multiplier >= 0, stationarity == 0, product == 0)

# Order: primal feasibility, dual sign, stationarity, complementarity.
for center, point, multiplier in [(-1, 0, 2), (0, 0, 0), (1, 1, 0),
                                  (-1, 0, 0), (-1, 1, 4), (-1, -1, 0)]:
    print((center, point, multiplier), scalar_kkt(center, point, multiplier))

# Duplicate constraints -x <= 0 and -2x <= 0 at the unique optimum x=0.
# Stationarity for f=(x+1)^2 requires lambda1+2*lambda2=2.
for first, second in [(2, 0), (1, 0.5), (0, 1)]:
    print("duplicate prices", (first, second),
          "same certificate", 2 - first - 2 * second == 0)