"""Run the grouped core on the declared eight-pump worked example."""

from survival_estimators import kaplan_meier


def main():
    times = [2, 3, 4, 4, 6, 7, 8, 9]
    events = [True, False, True, False, True, False, True, False]
    estimate = kaplan_meier(times, events)
    print("day risk failures censored survival Greenwood")
    for point in estimate.points:
        group = point.group
        print(f"{group.time:g} {group.at_risk} {group.failures} {group.censored} {point.survival:.9f} {point.greenwood:.9f}")
    interval = estimate.log_log_interval(4)
    print(f"pointwise95 at4: {interval.lower:.6f} {interval.upper:.6f}")
    print(f"S(5): {estimate.value(5):.9f}")
    print(f"median: {estimate.median():g}")
    print(f"supported RMST9: {estimate.restricted_mean(9):.9f}")


if __name__ == "__main__":
    main()
