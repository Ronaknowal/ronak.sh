import numpy as np

def allocation_at_price(price, budget):
    if not np.isfinite(price) or price < 0 or not np.isfinite(budget) or budget < 0:
        raise ValueError("Use finite nonnegative price and budget")
    allocation = np.maximum(0.0, np.array([3.0, 4.0]) - price / np.array([2.0, 4.0]))
    objective = (allocation[0] - 3)**2 + 2 * (allocation[1] - 4)**2
    violation = float(allocation.sum() - budget)
    dual = float(objective + price * violation)
    # Keep the first allocation if possible; give the second the remaining budget.
    # This is a feasible repair, not the optimal Euclidean projection.
    repaired = np.array([min(allocation[0], budget), 0.0])
    repaired[1] = min(allocation[1], max(0.0, budget - repaired[0]))
    upper = float((repaired[0] - 3)**2 + 2 * (repaired[1] - 4)**2)
    return allocation, violation, dual, repaired, upper

def stable_repair_gap(price, budget, allocation, repaired):
    weights, targets = np.array([1.0, 2.0]), np.array([3.0, 4.0])
    displacement = repaired - allocation
    boundary_gradient = np.where(allocation == 0, np.maximum(0, price - 2 * weights * targets), 0)
    # A priority repair computes the second allocation from this remaining budget.
    slack = (budget - repaired[0]) - repaired[1]
    local_gap = float(np.sum(weights * displacement**2 + boundary_gradient * displacement))
    return local_gap + price * slack

def price_iterations(budget, rate, updates, initial_price=0.0):
    if type(updates) is not int or updates < 0:
        raise ValueError("Use a nonnegative integer number of updates")
    if not np.isfinite(rate) or rate < 0:
        raise ValueError("Use a finite nonnegative rate")
    price = float(initial_price)
    rows = []
    for step in range(updates + 1):
        allocation, violation, dual, repaired, upper = allocation_at_price(price, budget)
        rows.append((price, allocation, violation, dual, repaired, upper))
        if step < updates:
            price = max(0.0, price + rate * violation)
    return rows

for rate in [1.0, 3.0, 4.0]:
    rows = price_iterations(5.0, rate, 8)
    print("rate", rate, "first prices", [round(row[0], 6) for row in rows[:5]])
    price, allocation, violation, lower, repaired, upper = rows[-1]
    print("final allocation", np.round(allocation, 6).tolist(),
          "violation", round(violation, 6))
    print("lower", round(lower, 6), "repaired upper", round(upper, 6),
          "stable gap", format(stable_repair_gap(price, 5.0, allocation, repaired), ".6g"))
    for _, _, _, lower, repaired, upper in rows:
        assert np.all(repaired >= 0) and repaired.sum() <= 5 + 1e-12
        assert lower <= 8/3 + 1e-10 and upper >= 8/3 - 1e-10
print("analytic optimum", [5/3, 10/3], "price", 8/3, "value", 8/3)