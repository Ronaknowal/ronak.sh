import numpy as np


def checked_scores(ids, scores):
    values = np.asarray(scores, dtype=float)
    if values.ndim != 1 or len(ids) != len(values) or len(set(ids)) != len(ids) or not np.isfinite(values).all():
        raise ValueError('Unique IDs and one finite score per ID are required.')
    return values


def above_threshold(ids, scores, threshold):
    values = checked_scores(ids, scores)
    if not np.isfinite(threshold):
        raise ValueError('Threshold must be finite.')
    return [key for key, value in zip(ids, values) if value > threshold]


def top_budget(ids, scores, budget):
    values = checked_scores(ids, scores)
    if type(budget) is not int or not 0 <= budget <= len(ids):
        raise ValueError('Budget must be an integer in0..number of rows.')
    # ID strings define the declared deterministic tie order, not unseen truth.
    order = sorted(range(len(ids)), key=lambda i: (-values[i], ids[i]))
    return [ids[i] for i in order[:budget]]


def higher_quantile(values, q):
    values = np.asarray(values, dtype=float)
    if values.ndim != 1 or not len(values) or not np.isfinite(values).all() or not np.isfinite(q) or not 0 <= q <= 1:
        raise ValueError('Nonempty finite scores and q in[0,1] required.')
    index = int(np.ceil(q*(len(values)-1)))
    return float(np.partition(values, index)[index])


def population(n, prevalence, sensitivity, false_alert_rate):
    if n < 0 or not np.isfinite([n, prevalence, sensitivity, false_alert_rate]).all() or any(not 0 <= p <= 1 for p in (prevalence, sensitivity, false_alert_rate)):
        raise ValueError('Finite population and rates in[0,1] required.')
    true = n*prevalence*sensitivity
    false = n*(1-prevalence)*false_alert_rate
    return true, false, None if true+false == 0 else true/(true+false)


def decision_cost(selected, verified_positives, review_cost, miss_cost):
    if not np.isfinite([review_cost, miss_cost]).all() or min(review_cost, miss_cost) < 0:
        raise ValueError('Costs must be finite and nonnegative.')
    return review_cost*len(set(selected))+miss_cost*len(set(verified_positives)-set(selected))


def main():
    ids, scores = list('ABCDE'), [1., 1., 2., 4., 4.]
    truth = {'C', 'D'}
    for name, selected in [('threshold2', above_threshold(ids, scores, 2.)),
                           ('threshold4', above_threshold(ids, scores, 4.)),
                           ('top1', top_budget(ids, scores, 1))]:
        print(name, selected, 'cost:', decision_cost(selected, truth, 2., 10.))
    print('higher q=.8 threshold:', higher_quantile(scores, .8))
    true, false, precision = population(50000, .002, .9, .005)
    print('population true/false/total/precision:', true, false, true+false, round(precision, 9))
    assert population(10, .1, 0., 0.)[2] is None


if __name__ == '__main__':
    main()
