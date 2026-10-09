"""Two constructed group comparisons with explicit endpoint rosters."""

from dataclasses import asdict
import json

from lifelines.statistics import logrank_test

from survival_group_comparison import logrank_two_group


def summary(result):
    return {key: value for key, value in asdict(result).items() if key != "steps"}


def main():
    # Retain the already taught pump endpoints; the group label is newly supplied.
    times1, events1 = (2, 3, 4, 4), (True, False, True, False)
    times0, events0 = (6, 7, 8, 9), (True, False, True, False)
    pump = logrank_two_group(times1, events1, times0, events0)
    print("pump event-time contributions:", json.dumps([asdict(s) for s in pump.steps]))
    print("pump comparison:", json.dumps(summary(pump)))
    ordinary = logrank_test(times1, times0, events1, events0)
    print("lifelines pump:", json.dumps({
        "statistic": ordinary.test_statistic, "asymptotic_p": ordinary.p_value,
    }))

    # A separately declared fixture: early group1 failures, later group0 failures.
    crossed1, flags1 = (1, 1, 3, 3), (True, True, False, False)
    crossed0, flags0 = (2, 2, 2, 3), (True, True, True, False)
    for weighting, p, q in (
        ("logrank", 0, 0),
        ("wilcoxon", 0, 0),
        ("tarone-ware", 0, 0),
        ("fleming-harrington", 0, 1),
    ):
        scratch = logrank_two_group(
            crossed1, flags1, crossed0, flags0, weighting=weighting, p=p, q=q,
        )
        kwargs = {} if weighting == "logrank" else {"weightings": weighting}
        if weighting == "fleming-harrington":
            kwargs.update(p=p, q=q)
        library = logrank_test(crossed1, crossed0, flags1, flags0, **kwargs)
        print("crossing " + weighting + ":", json.dumps({
            **summary(scratch), "weights": [step.weight for step in scratch.steps],
            "library_statistic": library.test_statistic,
            "library_asymptotic_p": library.p_value,
        }))
    no_events = logrank_two_group((1, 2), (False, False), (3, 4), (False, False))
    print("no observed events:", json.dumps(summary(no_events)))


if __name__ == "__main__":
    main()
