from datetime import datetime, timedelta


def episodes(alert_times, gap):
    if gap < timedelta(0):
        raise ValueError('Episode gap cannot be negative.')
    groups = []
    for time in sorted(set(alert_times)):
        if not groups or time-groups[-1][-1] > gap:
            groups.append([time])
        else:
            groups[-1].append(time)
    return groups


def summary(alert_times, windows, gap):
    times = sorted(set(alert_times))
    grouped = episodes(times, gap)
    inside = lambda t: any(start <= t <= end for start, end in windows)
    hits = [any(start <= t <= end for t in times) for start, end in windows]
    # First overlapping window owns the episode's match. No row labels are imputed.
    matches = [next((i for i, (start, end) in enumerate(windows)
                     if any(start <= t <= end for t in group)), None) for group in grouped]
    return {'rows': len(times), 'outside_rows': sum(not inside(t) for t in times),
            'episodes': len(grouped), 'hit_windows': sum(hits), 'episode_matches': matches}


def main():
    origin = datetime(2020, 1, 1)
    time = lambda row: origin+timedelta(minutes=5*row)
    windows = [(time(3), time(5)), (time(9), time(11))]
    for label, rows in [('A', [3, 4, 5, 9, 10, 11]), ('B', [3, 9, 12])]:
        for minutes in (5, 15):
            result = summary([time(row) for row in rows], windows, timedelta(minutes=minutes))
            print(label, 'gap', minutes, result)
    print('empty alerts:', summary([], windows, timedelta(minutes=5)))


if __name__ == '__main__':
    main()
