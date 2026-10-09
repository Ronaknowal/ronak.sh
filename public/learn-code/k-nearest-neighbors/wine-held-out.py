"""One predeclared Wine experiment. Run with --data PATH --output DIRECTORY.

The directory receives exact split IDs, validation scores and the fixed refitted
model's inspector data. The reserved test never chooses a setting.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, log_loss
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    with args.data.open(newline='', encoding='utf-8-sig') as handle:
        reader = csv.DictReader(handle)
        feature_names = [name for name in reader.fieldnames if name != 'class']
        rows = list(reader)
    X = np.array([[float(row[name]) for name in feature_names] for row in rows])
    y = np.array([int(row['class']) for row in rows])
    assert X.shape == (178, 13) and np.isfinite(X).all()
    assert np.array_equal(np.unique(y), [1, 2, 3])
    ids = np.arange(len(y))
    development, test = train_test_split(ids, test_size=.2, stratify=y, random_state=47)
    train, validation = train_test_split(development, test_size=.25,
                                        stratify=y[development], random_state=47)
    assert not (set(train) & set(validation) or set(train) & set(test)
                or set(validation) & set(test))
    candidates = []
    for scaled in [True, False]:
        for k in [1, 3, 7, 15]:
            for weights in ['uniform', 'distance']:
                neighbor = KNeighborsClassifier(n_neighbors=k, weights=weights,
                                                algorithm='brute', metric='euclidean')
                model = make_pipeline(StandardScaler(), neighbor) if scaled else make_pipeline(neighbor)
                model.fit(X[train], y[train])
                probabilities = model.predict_proba(X[validation])
                candidates.append({'scaled': scaled, 'k': k, 'weights': weights,
                    'validationLogLoss': float(log_loss(y[validation], probabilities, labels=[1, 2, 3])),
                    'validationAccuracy': float(accuracy_score(y[validation], model.predict(X[validation])))})
    # Exact validation objective first; declared tie order thereafter.
    chosen = min(candidates, key=lambda row: (row['validationLogLoss'],
                  not row['scaled'], row['k'], row['weights'] != 'uniform'))
    prior = DummyClassifier(strategy='prior').fit(X[train], y[train])
    baseline_validation = float(log_loss(y[validation], prior.predict_proba(X[validation]), labels=[1, 2, 3]))
    neighbor = KNeighborsClassifier(n_neighbors=chosen['k'], weights=chosen['weights'],
                                    algorithm='brute', metric='euclidean')
    final = make_pipeline(StandardScaler(), neighbor) if chosen['scaled'] else make_pipeline(neighbor)
    final.fit(X[development], y[development])
    prior.fit(X[development], y[development])
    probabilities = final.predict_proba(X[test])
    predicted = final.predict(X[test])
    transformed_reference = final[0].transform(X[development]) if chosen['scaled'] else X[development]
    transformed_test = final[0].transform(X[test]) if chosen['scaled'] else X[test]
    distances, positions = final[-1].kneighbors(transformed_test)
    contributions = []
    for ds, ps in zip(distances, positions):
        if chosen['weights'] == 'uniform':
            masses = np.ones(len(ds))
        elif (ds == 0).any():
            masses = (ds == 0).astype(float)
        else:
            masses = ds.min() / ds
        shares = masses / masses.sum()
        aggregate = np.array([shares[y[development[ps]] == label].sum() for label in [1, 2, 3]])
        contributions.append({'referenceIds': development[ps].tolist(), 'distances': ds.tolist(),
                              'shares': shares.tolist(), 'probabilities': aggregate.tolist()})
    assert np.allclose([row['probabilities'] for row in contributions], probabilities, atol=1e-12)
    result = {'protocol': 'seed47 stratified 60/20/20; validation log loss; scaled/smaller k/uniform tie order',
        'dataSha256': hashlib.sha256(args.data.read_bytes()).hexdigest(), 'featureNames': feature_names,
        'splitIds': {'train': train.tolist(), 'validation': validation.tolist(), 'test': test.tolist()},
        'candidates': candidates, 'chosen': chosen, 'baselineValidationLogLoss': baseline_validation,
        'test': {'accuracy': float(accuracy_score(y[test], predicted)),
                 'logLoss': float(log_loss(y[test], probabilities, labels=[1, 2, 3])),
                 'confusion': confusion_matrix(y[test], predicted, labels=[1, 2, 3]).tolist(),
                 'support': np.bincount(y[test], minlength=4)[1:].tolist(),
                 'baselineLogLoss': float(log_loss(y[test], prior.predict_proba(X[test]), labels=[1, 2, 3]))},
        'refittedScaler': {'mean': final[0].mean_.tolist(), 'scale': final[0].scale_.tolist()} if chosen['scaled'] else None,
        'referenceIds': development.tolist(), 'referenceLabels': y[development].tolist(),
        'transformedReference': transformed_reference.tolist(), 'testRows': X[test].tolist(),
        'testLabels': y[test].tolist(), 'transformedTest': transformed_test.tolist(),
        'testProbabilities': probabilities.tolist(), 'testPredictions': predicted.tolist(),
        'neighborContributions': contributions}
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'wine-result.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('Split counts:', len(train), len(validation), len(test))
    for row in candidates:
        print('scaled=', row['scaled'], 'k=', row['k'], 'weights=', row['weights'],
              'validation log loss=', f"{row['validationLogLoss']:.9f}",
              'accuracy=', f"{row['validationAccuracy']:.9f}")
    print('Chosen:', chosen)
    print('Reserved test:', json.dumps(result['test'], sort_keys=True))
    print('Inspector contribution parity passed; no further test-driven selection.')


if __name__ == '__main__':
    main()
