counts, hours = [3, 1, 8], [1.0, 0.5, 2.0]
prior_shape, prior_rate = 2.0, 1.0

def update(shape, rate, counts, exposures):
    if len(counts) != len(exposures):
        raise ValueError('Each count needs one exposure.')
    if any(type(value) is not int or value < 0 for value in counts):
        raise ValueError('Counts must be nonnegative integers.')
    if any(value <= 0 for value in exposures):
        raise ValueError('This example requires positive exposures.')
    return shape + sum(counts), rate + sum(exposures)

shape, rate = update(prior_shape, prior_rate, counts, hours)
print('events, hours:', sum(counts), sum(hours))
print('posterior shape, rate:', shape, rate)
print('mean events per hour:', round(shape / rate, 6))
first_shape, first_rate = update(prior_shape, prior_rate, counts[:2], hours[:2])
sequential = update(first_shape, first_rate, counts[2:], hours[2:])
print('sequential equals combined:', sequential == (shape, rate))