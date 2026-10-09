"""Run one prospectively specified teacher-agreement study, retaining all results.

python -B -X utf8 run_curator_study.py --data ./annotations --output ./curator-run
Requires the complete companion files, NumPy and scikit-learn 1.9.1.
The output directory must be new. Source pages remain only in the local data
directory. Derived predictions do not include their source text or URLs.
"""
import argparse
from collections import Counter
from hashlib import sha256
import importlib.metadata
import json
from pathlib import Path
import platform
import numpy as np
from linear_curator import Features, fit, sigmoid, save_model, load_model, objective_gradient
from curation_libraries import fit_library
from curation_signals import metrics

PROTOCOL = {'version': 1, 'features': 'train only; NFC/casefold words; raw tf; smoothed IDF; L2 row norm',
            'maximum_words': 1024, 'l2': .01, 'initialization': 'zero weights and intercept',
            'scratch_stopping': 'training augmented gradient L2 norm <= 1e-8 or 6000 steps',
            'step': 'reciprocal of 0.25*(mean squared row norm + 1)+l2',
            'library': 'lbfgs, tol 1e-10, max_iter 6000, C=1/(n_train*l2)',
            'threshold_grid': [i / 20 for i in range(2, 19)],
            'selection': 'largest tune F1; ties choose higher threshold; undefined F1 ranks below defined',
            'baseline': 'constant training positive fraction, same tune selection procedure',
            'final_evaluation': 'one fixed selection; entire grid descriptive only, no selection on final',
            'scope': 'agreement with released teacher labels; no downstream LM training or human gold set'}


def file_digest(path):
    return sha256(path.read_bytes()).hexdigest()


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, allow_nan=False) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    # This immutable prospective record is written before feature fitting.
    source = Path(__file__).parent
    frozen = {**PROTOCOL, 'python': platform.python_version(),
              'versions': {p: importlib.metadata.version(p) for p in ['numpy', 'scipy', 'scikit-learn']},
              'data': {name: file_digest(args.data / name) for name in ['protocol.json', 'collection.json', 'records.jsonl']},
              'programs': {name: file_digest(source / name) for name in ['run_curator_study.py', 'prepare_annotations.py',
                          'linear_curator.py', 'curation_libraries.py', 'curation_signals.py']}}
    write_json(args.output / 'protocol.json', frozen)
    rows = [json.loads(line) for line in (args.data / 'records.jsonl').read_text(encoding='utf-8').splitlines()]
    splits = {name: [r for r in rows if r['split'] == name] for name in ['train', 'tune', 'final']}
    for first in splits:
        if {r['label'] for r in splits[first]} != {0, 1}:
            raise ValueError('Both classes required in every prospective partition')
        for second in splits:
            if first != second and {r['group'] for r in splits[first]} & {r['group'] for r in splits[second]}:
                raise ValueError('Group leakage')
    texts = {s: [r['text'] for r in subset] for s, subset in splits.items()}
    labels = {s: np.array([r['label'] for r in subset]) for s, subset in splits.items()}
    features = Features.fit(texts['train'], maximum=1024)
    matrices = {s: features.transform(value) for s, value in texts.items()}
    model = fit(matrices['train'], labels['train'])
    save_model(args.output / 'model.json', features, model)
    ordinary = fit_library(texts['train'], labels['train'], features)
    predictions = {
        'scratch': {s: sigmoid(x @ model['weights'] + model['bias']) for s, x in matrices.items()},
        'library': {s: ordinary.predict_proba(value)[:, 1] for s, value in texts.items()},
        'constant': {s: np.full(len(value), labels['train'].mean()) for s, value in texts.items()},
    }
    recovered_features, recovered_weights, recovered_bias = load_model(args.output / 'model.json')
    np.testing.assert_array_equal(sigmoid(recovered_features.transform(texts['final']) @ recovered_weights + recovered_bias),
                                  predictions['scratch']['final'])
    score_tables, selections = {}, {}
    for name, by_split in predictions.items():
        score_tables[name] = {}
        for split in ['tune', 'final']:
            score_tables[name][split] = [
                {'threshold': t, **metrics(labels[split], by_split[split], t,
                                          [r['prefix_bytes'] for r in splits[split]])}
                for t in PROTOCOL['threshold_grid']]
        selected = max(score_tables[name]['tune'], key=lambda item: (
            item['f1'] if item['f1'] is not None else -1, item['threshold']))
        selections[name] = {'threshold': selected['threshold'], 'tune': selected,
                            'final': next(item for item in score_tables[name]['final'] if item['threshold'] == selected['threshold'])}
    classifier = ordinary['classifier']
    library_loss, library_dw, library_db = objective_gradient(matrices['train'], labels['train'], classifier.coef_[0], classifier.intercept_[0])
    derived_rows = []
    for split, subset in splits.items():
        for i, row in enumerate(subset):
            derived_rows.append({key: row[key] for key in ['id', 'source_row', 'text_sha256', 'teacher_score', 'label', 'prefix_bytes', 'group', 'split']}
                                | {name: float(values[split][i]) for name, values in predictions.items()})
    report = {
        'protocol_sha256': file_digest(args.output / 'protocol.json'), 'class_counts': {
            s: {str(k): int(v) for k, v in Counter(y.tolist()).items()} for s, y in labels.items()},
        'vocabulary_size': len(features.vocabulary), 'fit': {k: v for k, v in model.items() if k != 'weights'},
        'comparisons': {'library_objective': library_loss,
                        'library_gradient_norm': float(np.sqrt(library_dw @ library_dw + library_db ** 2)),
                        'feature_max_error': max(float(np.max(np.abs(ordinary['features'].transform(texts[s]).toarray() - matrices[s]))) for s in splits),
                        'probability_max_error': max(float(np.max(np.abs(predictions['scratch'][s] - predictions['library'][s]))) for s in splits)},
        'selected': selections, 'grid': score_tables, 'predictions': derived_rows,
        'interpretation': PROTOCOL['scope'],
    }
    write_json(args.output / 'study.json', report)
    print(json.dumps({'converged': model['converged'], 'iterations': model['iterations'], 'comparisons': report['comparisons'],
                      'selected': {name: {'threshold': result['threshold'], 'final': {k: result['final'][k] for k in ['precision', 'recall', 'f1', 'retained_records', 'brier']}} for name, result in selections.items()}}, indent=2))


if __name__ == '__main__':
    main()
