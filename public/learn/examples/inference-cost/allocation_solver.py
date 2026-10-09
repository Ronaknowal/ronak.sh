"""Expose a finite integer lattice, then solve the same problem with SciPy."""
import itertools
import json


def enumerate_allocations(costs, capacities, demand, max_slots):
    rows = []
    for decision in itertools.product(range(max_slots + 1), repeat=len(costs)):
        supply = sum(count * capacity for count, capacity in zip(decision, capacities))
        feasible = sum(decision) <= max_slots and supply >= demand
        rows.append({"decision": decision, "supply": supply, "feasible": feasible,
                     "cost": sum(count * cost for count, cost in zip(decision, costs))})
    valid = [row for row in rows if row["feasible"]]
    optimum = min(valid, key=lambda row: (row["cost"], row["decision"])) if valid else None
    return {"cells": rows, "optimum": optimum}


def solve_allocations(costs, capacities, demand, max_slots, integer=True):
    import numpy as np
    from scipy.optimize import Bounds, LinearConstraint, milp
    variables = len(costs)
    matrix = np.array([capacities, [1] * variables], dtype=float)
    constraints = LinearConstraint(matrix, [demand, -np.inf], [np.inf, max_slots])
    result = milp(c=np.asarray(costs, dtype=float),
                  integrality=np.ones(variables) if integer else np.zeros(variables),
                  bounds=Bounds(np.zeros(variables), np.full(variables, max_slots)),
                  constraints=constraints,
                  options={"time_limit": 5.0, "mip_rel_gap": 0.0})
    row = {"status": int(result.status), "message": result.message, "integer": integer,
           "decision": None, "cost": None,
           "mip_gap": float(result.mip_gap) if getattr(result, "mip_gap", None) is not None else None}
    if result.status != 0:
        return row
    decision = result.x
    residuals = matrix @ decision
    if residuals[0] < demand - 1e-8 or residuals[1] > max_slots + 1e-8:
        raise AssertionError("Returned solution violates the supplied constraints")
    if integer and np.max(np.abs(decision - np.rint(decision))) > 1e-8:
        raise AssertionError("Returned solution is not integral")
    row.update(decision=decision.tolist(), cost=float(np.dot(costs, decision)),
               capacity=float(residuals[0]), used_slots=float(residuals[1]))
    return row


def main():
    for demand in (7, 13):
        scratch = enumerate_allocations([7, 4], [4, 2], demand, 3)
        ordinary = solve_allocations([7, 4], [4, 2], demand, 3)
        if scratch["optimum"] is None:
            assert ordinary["status"] == 2
        else:
            assert ordinary["status"] == 0
            assert ordinary["cost"] == scratch["optimum"]["cost"]
        print(json.dumps({"demand": demand, "scratch": scratch, "scipy": ordinary}))
    print(json.dumps(solve_allocations([7, 4], [4, 2], 7, 3, integer=False)))


if __name__ == "__main__":
    main()
