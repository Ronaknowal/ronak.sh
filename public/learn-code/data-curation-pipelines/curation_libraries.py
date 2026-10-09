"""The same TF-IDF/logistic objective using scikit-learn's sparse tools.

Install numpy scipy scikit-learn==1.9.1.
Run: python -B curation_libraries.py
The complete real-data driver calls fit_library below; this main compares an
authored four-record fit and audits a saved/reloaded ordinary pipeline.
"""
import json
import pickle
import tempfile
from pathlib import Path
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from linear_curator import Features, fit, sigmoid, words, objective_gradient
from curation_signals import metrics


def fit_library(texts, labels, features, l2=.01):
    if l2 <= 0:
        raise ValueError('Positive L2 required for this C conversion')
    vectorizer = TfidfVectorizer(tokenizer=words, token_pattern=None, lowercase=False,
                                vocabulary={word: i for i, word in enumerate(features.vocabulary)},
                                smooth_idf=True, norm='l2', sublinear_tf=False, dtype=np.float64)
    # sklearn 1.9.1 lbfgs internally uses 1/(C * sum(sample_weight)); weights
    # default to one. This matches mean BCE + l2/2 ||w||², no bias penalty.
    classifier = LogisticRegression(C=1 / (len(texts) * l2), solver='lbfgs',
                                    tol=1e-10, max_iter=6000, fit_intercept=True)
    pipeline = Pipeline([('features', vectorizer), ('classifier', classifier)])
    pipeline.fit(texts, labels)
    return pipeline


if __name__ == '__main__':
    texts = ['energy energy pendulum', 'pendulum motion explained',
             'home sale home', 'buy sale buy']
    labels = np.array([1, 1, 0, 0])
    features = Features.fit(texts)
    matrix = features.transform(texts)
    scratch = fit(matrix, labels)
    ordinary = fit_library(texts, labels, features)
    probability = ordinary.predict_proba(texts)[:, 1]
    scratch_probability = sigmoid(matrix @ scratch['weights'] + scratch['bias'])
    with tempfile.TemporaryDirectory() as directory:
        target = Path(directory) / 'curator.pkl'
        target.write_bytes(pickle.dumps(ordinary))
        # Only load a pickle you created or otherwise trust: it can execute code.
        restored = pickle.loads(target.read_bytes())
        np.testing.assert_array_equal(restored.predict_proba(texts)[:, 1], probability)
    classifier = ordinary['classifier']
    loss, _, _ = objective_gradient(matrix, labels, classifier.coef_[0], classifier.intercept_[0])
    print(json.dumps({'feature_max_error': float(np.max(np.abs(ordinary['features'].transform(texts).toarray() - matrix))),
                      'probability_max_error': float(np.max(np.abs(probability - scratch_probability))),
                      'library_objective': loss, 'scratch_objective': scratch['history'][-1]['objective'],
                      'audit': metrics(labels, probability)}, indent=2))
