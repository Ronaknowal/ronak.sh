from datetime import datetime, timedelta
from collections import defaultdict
import numpy as np
from sklearn.preprocessing import StandardScaler


def aggregate_and_lag(records, lag=timedelta(hours=1)):
    groups = defaultdict(list)
    for time, value in records:
        if not np.isfinite(value):
            raise ValueError('Measurements must be finite.')
        groups[time].append(float(value))
    level = {time: sum(values)/len(values) for time, values in groups.items()}
    return [(time, level[time], level[time]-level[time-lag])
            for time in sorted(level) if time-lag in level]


def trailing_variation(records, now, duration):
    if duration <= timedelta(0):
        raise ValueError('Duration must be positive.')
    past = [value for time, value in records if now-duration < time <= now]
    if not past:
        return None
    return float(np.std(past, ddof=0))


def main():
    day = datetime(2020, 1, 1)
    records = [(day, 40.), (day+timedelta(minutes=5), 41.),
               (day+timedelta(hours=1), 42.), (day+timedelta(minutes=65), 45.)]
    print('exact lag rows:', [(time.strftime('%H:%M'), level, change)
                             for time, level, change in aggregate_and_lag(records)])
    duplicate = records+[(day, 44.)]
    print('duplicate current-time means:', [(time.strftime('%H:%M'), level, change)
                                         for time, level, change in aggregate_and_lag(duplicate)])
    missing = [row for row in records if row[0] != day+timedelta(minutes=5)]
    print('missing lag retained times:', [time.strftime('%H:%M') for time, _, _ in aggregate_and_lag(missing)])
    scaler = StandardScaler().fit([[40.], [42.]])
    print('reference mean/scale/later coordinate:', scaler.mean_.tolist(), scaler.scale_.tolist(),
          scaler.transform([[50.]]).tolist())
    flat = [(day+timedelta(hours=i), 40.) for i in range(4)]
    print('flat trailing population standard deviation:', trailing_variation(flat, flat[-1][0], timedelta(hours=3)))


if __name__ == '__main__':
    main()
