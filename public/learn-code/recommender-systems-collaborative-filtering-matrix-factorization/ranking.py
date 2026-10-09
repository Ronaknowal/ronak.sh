import math


def metrics(order, grades, cutoff, eligible=None):
    eligible = set(range(len(grades))) if eligible is None else set(eligible)
    if cutoff < 1 or len(set(order)) != len(order) or not set(order) <= eligible:
        raise ValueError("Use a positive cutoff and unique eligible items.")
    relevant = {item for item in eligible if grades[item] > 0}
    selected = order[:cutoff]
    hits, precision_sum, reciprocal = 0, 0.0, 0.0
    dcg = 0.0
    for rank, item in enumerate(selected, 1):
        dcg += (2 ** grades[item] - 1) / math.log2(rank + 1)
        if item in relevant:
            hits += 1
            precision_sum += hits / rank
            reciprocal = reciprocal or 1 / rank
    ideal = sum(
        (2**grade - 1) / math.log2(rank + 1)
        for rank, grade in enumerate(
            sorted((grades[item] for item in eligible), reverse=True)[:cutoff], 1
        )
    )
    return dict(
        precision=hits / cutoff,
        recall=hits / len(relevant) if relevant else None,
        ndcg=dcg / ideal if ideal else None,
        reciprocal_rank=reciprocal if relevant else None,
        average_precision=(
            precision_sum / min(cutoff, len(relevant)) if relevant else None
        ),
        fill_rate=len(selected) / cutoff,
        candidate_recall_ceiling=(
            min(cutoff, len(set(order) & relevant)) / len(relevant)
            if relevant
            else None
        ),
    )


for order, grades, cutoff in [
    ([2, 0, 4, 1, 3], [1, 1, 0, 0, 0], 3),
    ([2, 0, 4], [1, 1, 0, 0, 0], 3),
    ([0, 1], [0, 0, 0], 3),
    ([2, 0, 1], [2, 1, 3], 2),
]:
    result = metrics(order, grades, cutoff)
    print(
        "order",
        order,
        "K",
        cutoff,
        {
            key: round(value, 6) if value is not None else None
            for key, value in result.items()
        },
    )