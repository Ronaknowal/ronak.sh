"""One predeclared train/validation/test Wine study; all outcomes are retained."""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import warnings

import numpy as np
import sklearn
from sklearn.datasets import load_wine
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC


def metrics(target, prediction):
    return {'balanced_accuracy': float(balanced_accuracy_score(target, prediction)),
            'accuracy': float(accuracy_score(target, prediction)),
            'recall_by_class': recall_score(target, prediction, labels=[0, 1, 2],
                                           average=None, zero_division=0).tolist(),
            'confusion_true_rows_predicted_columns': confusion_matrix(
                target, prediction, labels=[0, 1, 2]).tolist()}


def frozen_state(pipeline, train_ids, feature_names):
    scaler, model = pipeline.steps[0][1], pipeline.steps[1][1]
    return {'feature_names': list(feature_names), 'classes': model.classes_.tolist(),
            'train_ids': train_ids.tolist(), 'scaler_mean': scaler.mean_.tolist(),
            'scaler_scale': scaler.scale_.tolist(), 'scaler_variance': scaler.var_.tolist(),
            'kernel': model.kernel, 'C': float(model.C), 'gamma_parameter': model.gamma,
            'effective_gamma': float(model._gamma),
            'support_train_addresses': model.support_.tolist(),
            'support_original_row_ids': train_ids[model.support_].tolist(),
            'support_vectors_standardized': model.support_vectors_.tolist(),
            'n_support_by_class': model.n_support_.tolist(),
            'packed_signed_dual_coefficients': model.dual_coef_.tolist(),
            'pair_intercepts': model.intercept_.tolist(),
            'class_pairs': [[0, 1], [0, 2], [1, 2]],
            'coefficient_layout': 'SVC packed multiclass OVO; not one binary coefficient vector',
            'browser_route': 'observed outcomes only; no edited packed-multiclass forward claimed'}


def study():
    dataset = load_wine()
    x, y = dataset.data.copy(), dataset.target.copy()
    assert x.shape == (178, 13) and y.shape == (178,) and set(y.tolist()) == {0, 1, 2}
    assert np.isfinite(x).all()
    ids = np.arange(len(y))
    remaining, test_ids = train_test_split(ids, test_size=36, stratify=y, random_state=61)
    train_ids, validation_ids = train_test_split(
        remaining, test_size=36, stratify=y[remaining], random_state=67)
    assert (len(train_ids), len(validation_ids), len(test_ids)) == (106, 36, 36)
    assert len(set(train_ids) | set(validation_ids) | set(test_ids)) == 178
    assert not (set(train_ids) & set(validation_ids) or set(train_ids) & set(test_ids)
                or set(validation_ids) & set(test_ids))
    configurations = [('linear', c, 'scale') for c in (.1, 1., 10.)]
    configurations += [('rbf', c, gamma) for c in (.1, 1., 10.) for gamma in (.01, .1, 1.)]
    report = {
        'protocol': {'dataset': 'UCI Wine bundled in sklearn', 'rows': 178, 'features': 13,
                     'test_split_seed': 61, 'validation_split_seed': 67,
                     'train': 106, 'validation': 36, 'test': 36,
                     'selection': 'validation balanced accuracy, first listed candidate wins exact tie',
                     'scaler_fit': '106 training rows only', 'tol': 1e-7,
                     'cache_size_mb': 200, 'max_iter': 100000,
                     'refit': 'none; selected pipeline retains its training-only fit',
                     'failure': 'retain all candidates; any cap failure aborts test assessment'},
        'versions': {'python': platform.python_version(), 'numpy': np.__version__,
                     'sklearn': sklearn.__version__},
        'provenance': {'source': 'https://archive.ics.uci.edu/dataset/109/wine',
                       'doi': '10.24432/C5PC7J', 'attribution': 'Aeberhard and Forina, UCI Wine',
                       'license': 'CC BY 4.0', 'inspection_date': '2026-10-06',
                       'loader_description': dataset.DESCR,
                       'data_float64_little_endian_sha256': hashlib.sha256(x.astype('<f8').tobytes()).hexdigest(),
                       'target_int64_little_endian_sha256': hashlib.sha256(y.astype('<i8').tobytes()).hexdigest()},
        'dataset': {'feature_names': dataset.feature_names, 'class_names': dataset.target_names.tolist(),
                    'data': x.tolist(), 'targets': y.tolist()},
        'split': {'train_ids': train_ids.tolist(), 'validation_ids': validation_ids.tolist(),
                  'test_ids': test_ids.tolist(),
                  'class_counts': {name: np.bincount(y[rows], minlength=3).tolist()
                                   for name, rows in [('train', train_ids), ('validation', validation_ids), ('test', test_ids)]}},
        'candidates': []}
    pipelines = []
    selected, best = None, -np.inf
    for index, (kernel, c, gamma) in enumerate(configurations):
        pipeline = make_pipeline(StandardScaler(), SVC(
            kernel=kernel, C=c, gamma=gamma, tol=1e-7, cache_size=200, max_iter=100000))
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter('always')
            pipeline.fit(x[train_ids], y[train_ids])
        scaler, model = pipeline.steps[0][1], pipeline.steps[1][1]
        np.testing.assert_allclose(scaler.mean_, x[train_ids].mean(0), atol=1e-12, rtol=1e-12)
        assert int(scaler.n_samples_seen_) == 106
        train_prediction = pipeline.predict(x[train_ids])
        validation_prediction = pipeline.predict(x[validation_ids])
        train_metrics = metrics(y[train_ids], train_prediction)
        validation_metrics = metrics(y[validation_ids], validation_prediction)
        eligible = int(model.fit_status_) == 0
        row = {'index': index, 'kernel': kernel, 'C': c, 'gamma_parameter': gamma,
               'effective_gamma': float(model._gamma), 'eligible': eligible,
               'fit_status': int(model.fit_status_), 'iterations_by_pair': model.n_iter_.tolist(),
               'warnings': [str(item.message) for item in caught],
               'support_total': len(model.support_), 'support_by_class': model.n_support_.tolist(),
               'train': train_metrics, 'validation': validation_metrics,
               'train_predictions': train_prediction.tolist(),
               'validation_predictions': validation_prediction.tolist()}
        report['candidates'].append(row)
        pipelines.append(pipeline)
        if eligible and validation_metrics['balanced_accuracy'] > best:
            selected, best = index, validation_metrics['balanced_accuracy']
    report['provisional_selection_index'] = selected
    if selected is None or any(not row['eligible'] for row in report['candidates']):
        report['status'] = 'protocol failure; no test assessment'
        return report

    # Freeze the training-only choice and numeric state before test assessment.
    selected_pipeline = pipelines[selected]
    state = frozen_state(selected_pipeline, train_ids, dataset.feature_names)
    state_bytes = json.dumps(state, sort_keys=True, separators=(',', ':')).encode()
    report['selected_index'] = selected
    report['selected_state'] = state
    report['selected_state_sha256'] = hashlib.sha256(state_bytes).hexdigest()
    baseline = DummyClassifier(strategy='most_frequent').fit(x[train_ids], y[train_ids])
    test_prediction = selected_pipeline.predict(x[test_ids])
    baseline_prediction = baseline.predict(x[test_ids])
    report['test'] = {'selected': metrics(y[test_ids], test_prediction),
                      'baseline': metrics(y[test_ids], baseline_prediction),
                      'row_ids': test_ids.tolist(), 'targets': y[test_ids].tolist(),
                      'selected_predictions': test_prediction.tolist(),
                      'baseline_predictions': baseline_prediction.tolist()}
    report['status'] = 'completed predeclared protocol'
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, help='Write a new result file; existing files are refused.')
    args = parser.parse_args()
    if args.output is not None and args.output.exists():
        parser.error('Output already exists; preserve it instead of silently repeating this study.')
    result = study()
    text = json.dumps(result, indent=2) + '\n'
    if args.output is None:
        print(text, end='')
    else:
        args.output.write_text(text, encoding='utf-8')
        print(json.dumps({'status': result['status'], 'output': str(args.output),
                          'selected_index': result.get('selected_index'),
                          'sha256': hashlib.sha256(text.encode()).hexdigest()}))


if __name__ == '__main__':
    main()
