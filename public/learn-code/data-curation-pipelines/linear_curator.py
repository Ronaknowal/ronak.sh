"""Training-only TF-IDF and a complete dense logistic curator, from NumPy.

Install numpy. Run: python -B linear_curator.py
The dense teaching matrix costs O(NV) memory; use the sparse library companion
for a large corpus. A zero row is legitimate when no known word occurs.
"""
from collections import Counter
from dataclasses import dataclass
import json
from pathlib import Path
import re
import unicodedata
import numpy as np


def words(text):
    return re.findall(r"[^\W_]+(?:['’][^\W_]+)*", unicodedata.normalize('NFC', text).casefold())


@dataclass
class Features:
    vocabulary: list
    idf: np.ndarray

    @classmethod
    def fit(cls, texts, maximum=1024):
        if not texts or maximum < 1:
            raise ValueError('Nonempty training texts and positive vocabulary limit required')
        token_rows = [words(text) for text in texts]
        counts = Counter(token for row in token_rows for token in row)
        vocabulary = sorted(counts, key=lambda token: (-counts[token], token))[:maximum]
        if not vocabulary:
            raise ValueError('Training vocabulary is empty')
        df = Counter(token for row in token_rows for token in set(row))
        idf = np.array([np.log((1 + len(texts)) / (1 + df[token])) + 1 for token in vocabulary])
        return cls(vocabulary, idf)

    def transform(self, texts):
        index = {word: i for i, word in enumerate(self.vocabulary)}
        matrix = np.zeros((len(texts), len(index)), dtype=np.float64)
        for i, text in enumerate(texts):
            for word, count in Counter(words(text)).items():
                if word in index:
                    matrix[i, index[word]] = count
        matrix *= self.idf
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        return np.divide(matrix, norms, out=np.zeros_like(matrix), where=norms > 0)


def sigmoid(logits):
    values = np.asarray(logits, dtype=np.float64)
    return np.exp(-np.logaddexp(0, -values))


def objective_gradient(matrix, labels, weights, bias, l2=.01):
    if matrix.shape[0] == 0 or not np.isfinite(matrix).all() or l2 < 0:
        raise ValueError('Finite nonempty training matrix and nonnegative penalty required')
    labels = np.asarray(labels, dtype=np.float64)
    if labels.shape != (len(matrix),) or not np.isin(labels, [0, 1]).all():
        raise ValueError('One binary label per training row required')
    logits = matrix @ weights + bias
    loss = np.mean(np.logaddexp(0, logits) - labels * logits) + .5 * l2 * (weights @ weights)
    residual = sigmoid(logits) - labels
    return float(loss), matrix.T @ residual / len(matrix) + l2 * weights, float(residual.mean())


def fit(matrix, labels, l2=.01, tolerance=1e-8, max_steps=6000):
    labels = np.asarray(labels, dtype=np.float64)
    if set(labels.tolist()) != {0., 1.}:
        raise ValueError('Both training classes required for a finite unpenalized intercept')
    weights, bias = np.zeros(matrix.shape[1]), 0.
    # sigmoid curvature <= 1/4. The Frobenius norm bounds the augmented
    # design's spectral norm, including the intercept's constant-one column.
    bound = .25 * (np.sum(matrix * matrix) / len(matrix) + 1) + l2
    step = 1 / bound
    history = []
    converged = False
    for iteration in range(max_steps + 1):
        loss, dw, db = objective_gradient(matrix, labels, weights, bias, l2)
        gradient_norm = float(np.sqrt(dw @ dw + db * db))
        if iteration % 100 == 0 or gradient_norm <= tolerance or iteration == max_steps:
            history.append({'step': iteration, 'objective': loss, 'gradient_norm': gradient_norm})
        if gradient_norm <= tolerance:
            converged = True
            break
        if iteration < max_steps:
            weights -= step * dw
            bias -= step * db
    return {'weights': weights, 'bias': bias, 'l2': l2, 'learning_rate': step,
            'converged': converged, 'iterations': iteration, 'history': history}


def save_model(filename, features, model):
    data = {'vocabulary': features.vocabulary, 'idf': features.idf.tolist(),
            'weights': model['weights'].tolist(), 'bias': model['bias'], 'l2': model['l2'],
            'tokenizer': 'NFC/casefold Unicode words, internal straight/curly apostrophes'}
    Path(filename).write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def load_model(filename):
    data = json.loads(Path(filename).read_text(encoding='utf-8'))
    features = Features(data['vocabulary'], np.array(data['idf']))
    return features, np.array(data['weights']), data['bias']


if __name__ == '__main__':
    texts = ['A pendulum converts potential energy to motion.',
             'Energy is conserved in this ideal model.',
             'Buy buy buy sale sale.', 'Click home click subscribe.']
    features = Features.fit(texts)
    matrix = features.transform(texts)
    model = fit(matrix, [1, 1, 0, 0])
    print(json.dumps({'vocabulary': features.vocabulary, 'idf': features.idf.tolist(),
                      'probabilities': sigmoid(matrix @ model['weights'] + model['bias']).tolist(),
                      'converged': model['converged'], 'history': model['history']}, indent=2))
