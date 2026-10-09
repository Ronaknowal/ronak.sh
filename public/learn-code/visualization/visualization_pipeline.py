"""Same observations, explicit statistics, a scratch SVG and Matplotlib output.
Run: python visualization_pipeline.py --data wine.csv --output figures
Dependencies: numpy, matplotlib. The Wine CSV is linked in the lesson.
"""
import argparse
from bisect import bisect_right
import csv
import hashlib
import json
from pathlib import Path
import numpy as np


def histogram(values, edges):
    """Left-closed/right-open bins; the final right endpoint is included.

    O(n log k) time and O(k) extra memory for k arbitrary-width bins.
    Nonfinite observations are rejected; out-of-range values are counted.
    """
    if len(edges) < 2 or not all(np.isfinite(edges)) or any(a >= b for a, b in zip(edges, edges[1:])):
        raise ValueError("Edges must be finite and strictly increasing")
    counts, outside = [0] * (len(edges) - 1), 0
    for value in values:
        if not np.isfinite(value):
            raise ValueError("Declare a missing-value policy before binning")
        if value < edges[0] or value > edges[-1]:
            outside += 1
            continue
        index = min(bisect_right(edges, value) - 1, len(counts) - 1)
        counts[index] += 1
    included = sum(counts)
    density = [count / (included * (hi - lo)) if included else 0.0
               for count, lo, hi in zip(counts, edges, edges[1:])]
    return counts, density, outside


def scale(value, domain, pixels):
    """Map data coordinates to drawing coordinates; reversed ranges are legal."""
    lo, hi = domain
    if hi <= lo:
        raise ValueError("Scale domain must have positive width")
    return pixels[0] + (value - lo) * (pixels[1] - pixels[0]) / (hi - lo)


def histogram_svg(edges, density):
    """A small explicit statistical graphic, not a replacement plotting engine."""
    width, height = 640, 320
    x_domain, y_domain = (edges[0], edges[-1]), (0, max(density) * 1.1 or 1)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" role="img" aria-label="Wine alcohol density histogram">',
             '<rect width="100%" height="100%" fill="#111"/>',
             '<g fill="#ddd" font-family="sans-serif" font-size="14">',
             '<text x="60" y="24">Wine alcohol: explicit bins and density</text>',
             '<text x="250" y="310">alcohol (recorded units)</text>',
             '<text x="60" y="46">density per alcohol unit</text>']
    for lo, hi, value in zip(edges, edges[1:], density):
        x1, x2 = scale(lo, x_domain, (60, 610)), scale(hi, x_domain, (60, 610))
        y = scale(value, y_domain, (260, 60))
        parts.append(f'<rect x="{x1}" y="{y}" width="{x2-x1}" height="{260-y}" fill="#e4b752" stroke="#111"/>')
    for value in [edges[0], (edges[0]+edges[-1])/2, edges[-1]]:
        x = scale(value, x_domain, (60, 610))
        parts.append(f'<text x="{x}" y="282" text-anchor="middle">{value:g}</text>')
    for value in [0, y_domain[1]/2, y_domain[1]]:
        y = scale(value, y_domain, (260,60))
        parts.append(f'<text x="52" y="{y+5}" text-anchor="end">{value:.2f}</text>')
    parts.append('</g></svg>')
    return '\n'.join(parts)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('figures'))
    args = parser.parse_args()
    with args.data.open(newline='', encoding='utf-8') as source:
        rows = list(csv.DictReader(source))
    alcohol = np.array([float(row['alcohol']) for row in rows])
    group = np.array([int(row['target']) for row in rows])
    edges = np.arange(10.5, 15.5 + .25, .5)
    counts, density, outside = histogram(alcohol, edges)
    reference, _ = np.histogram(alcohol, bins=edges, density=True)
    np.testing.assert_allclose(density, reference)
    assert sum(counts) == len(rows) and outside == 0
    assert np.isclose(np.dot(density, np.diff(edges)), 1)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'wine-density-scratch.svg').write_text(histogram_svg(edges, density), encoding='utf-8')
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(1, 2, figsize=(10, 4), layout='constrained')
    palette = ['#a46b00', '#555555', '#a0a0a0']
    summaries = []
    for category, color in enumerate(palette):
        values = alcohol[group == category]
        current, _, _ = histogram(values, edges)
        axes[0].stairs(np.array(current) / (len(values) * np.diff(edges)), edges,
                       label=f'Cultivar {category}, n={len(values)}', color=color)
        mean, sd = float(values.mean()), float(values.std(ddof=1))
        axes[1].errorbar(mean, category, xerr=sd, fmt='o', capsize=5, color=color)
        summaries.append({'cultivar':category, 'n':len(values), 'mean':mean, 'sample_sd':sd,
                          'counts':current, 'density':(np.array(current)/(len(values)*np.diff(edges))).tolist()})
    axes[0].set(xlabel='Alcohol (recorded units)', ylabel='Within-cultivar density', title='Same bins; each group has area 1')
    axes[0].legend(fontsize=8)
    axes[1].set(xlabel='Alcohol (recorded units)', ylabel='Cultivar label', yticks=[0,1,2], title='Mean ± 1 sample SD; spread, not a CI')
    fig.savefig(args.output / 'wine-distributions.svg')
    fig.savefig(args.output / 'wine-distributions.png', dpi=180)
    plt.close(fig)
    result = {'rows':len(rows), 'edges':edges.tolist(), 'counts':counts, 'area':float(np.dot(density,np.diff(edges))),
              'groups':summaries, 'csv_sha256':hashlib.sha256(args.data.read_bytes()).hexdigest(),
              'versions':{'numpy':np.__version__, 'matplotlib':matplotlib.__version__}}
    (args.output / 'figure-data.json').write_text(json.dumps(result,indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
