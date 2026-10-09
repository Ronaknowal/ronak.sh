"""Two ordinary APIs, with the observation/aggregation contract held explicit.
Run: python visualization_library_views.py --data wine.csv --output figures
Requires pandas, seaborn, matplotlib, plotly. Does not upload data.
"""
import argparse
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import plotly.express as px


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('figures'))
    args = parser.parse_args()
    table = pd.read_csv(args.data)
    table['cultivar'] = table['target'].map({0: '0', 1: '1', 2: '2'})
    args.output.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(7, 4), layout='constrained')
    sns.histplot(
        data=table, x='alcohol', hue='cultivar',
        bins=[10.5 + i * .5 for i in range(11)],
        stat='density', common_norm=False, element='step', fill=False,
        palette=['#a46b00', '#555555', '#a0a0a0'], ax=ax,
    )
    ax.set(title='Each cultivar normalized separately', xlabel='Alcohol (recorded units)')
    fig.savefig(args.output / 'wine-seaborn.svg')
    plt.close(fig)
    interactive = px.scatter(
        table, x='alcohol', y='color_intensity', color='cultivar', symbol='cultivar',
        hover_data=['row_id'], color_discrete_sequence=['#e4b752', '#bdbdbd', '#eeeeee'],
        labels={'alcohol': 'Alcohol (recorded units)',
                'color_intensity': 'Color intensity (recorded units)'},
        title='178 observed wines: association, not a fitted causal effect',
        template='plotly_dark',
    )
    interactive.update_layout(paper_bgcolor='#111', plot_bgcolor='#111')
    # A self-contained HTML file is larger; it works without a CDN connection.
    interactive.write_html(args.output / 'wine-interactive.html', include_plotlyjs=True, full_html=True)
    assert sum(len(trace.x) for trace in interactive.data) == len(table) == 178
    print(json.dumps({'rows': len(table), 'traces': len(interactive.data),
                      'seaborn': sns.__version__,
                      'html_bytes': (args.output / 'wine-interactive.html').stat().st_size}))


if __name__ == '__main__':
    main()
