"""Threshold-only calculation on preserved saved scores; no estimator imports."""
from pathlib import Path
import csv
import json
import math
from datetime import datetime
from score_policy import higher_quantile


BASE = Path(__file__).resolve().parent/'originals'
METHODS = ('baseline', 'isolation', 'one_class_svm', 'lof')


def read_saved():
    with (BASE/'nab-derived-scores.csv').open(newline='', encoding='utf-8') as file:
        rows = list(csv.DictReader(file))
    windows = json.loads((BASE/'nab-event-windows.json').read_text(encoding='utf-8'))[
        'realKnownCause/machine_temperature_system_failure.csv']
    windows = [(datetime.fromisoformat(a), datetime.fromisoformat(b)) for a, b in windows]
    return rows, windows


def evaluate(rows, windows, method, q=.975, threshold=None):
    if method not in METHODS:
        raise ValueError('Choose a saved score column.')
    calibration = [float(row[method]) for row in rows if row['period'] == 'calibration']
    used = higher_quantile(calibration, q) if threshold is None else float(threshold)
    if not math.isfinite(used):
        raise ValueError('Threshold must be finite.')
    selected = [(row['timestamp'], float(row[method])) for row in rows
                if row['period'] == 'test' and float(row[method]) > used]
    times = [datetime.fromisoformat(time) for time, _ in selected]
    inside = sum(any(a <= time <= b for a, b in windows) for time in times)
    hits = sum(any(a <= time <= b for time in times) for a, b in windows)
    return {'method': method, 'threshold': used, 'alerts': len(times), 'inside': inside,
            'outside': len(times)-inside, 'windows': hits, 'selected': selected}


def main():
    rows, windows = read_saved()
    print('saved feature rows:', len(rows))
    for method in METHODS:
        result = evaluate(rows, windows, method)
        print(method, 'q=.975', {key: value for key, value in result.items() if key != 'selected'})


if __name__ == '__main__':
    main()
