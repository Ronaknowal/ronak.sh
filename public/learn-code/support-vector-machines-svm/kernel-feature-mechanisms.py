"""Spectrum counts, random Fourier coordinates and rank-aware landmarks."""
from itertools import product
import json
import numpy as np
import sklearn
from sklearn.kernel_approximation import RBFSampler, Nystroem


def spectrum(sequence, k=2):
    if not isinstance(sequence, str) or len(sequence) > 12 or set(sequence) - set('AC'):
        raise ValueError('Use an A/C string of length 0..12.')
    if not isinstance(k, int) or not 1 <= k <= 3:
        raise ValueError('Use k in {1,2,3}.')
    words = [''.join(row) for row in product('AC', repeat=k)]
    addresses = {word: j for j, word in enumerate(words)}
    counts = np.zeros(len(words), dtype=float)
    for start in range(max(0, len(sequence) - k + 1)):
        counts[addresses[sequence[start:start + k]]] += 1
    return words, counts


def matrix(x):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or not (1 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
        raise ValueError('Use 1..100 finite rows and 1..20 features.')
    if not np.isfinite(x).all() or np.max(np.abs(x)) > 1000:
        raise ValueError('Feature magnitudes must be finite and at most 1000.')
    return x


def rbf(left, right, gamma):
    left, right = matrix(left), matrix(right)
    if left.shape[1] != right.shape[1] or not np.isfinite(gamma) or not 1e-4 <= gamma <= 10:
        raise ValueError('Match features and use gamma in [1e-4,10].')
    output = np.empty((len(left), len(right)))
    for start in range(0, len(left), 16):
        differences = left[start:start + 16, None, :] - right[None, :, :]
        output[start:start + 16] = np.exp(-gamma * np.einsum('bnd,bnd->bn', differences, differences))
    return output


def rff_state(n_features, components=12, gamma=.45, seed=17):
    if not isinstance(n_features, int) or not 1 <= n_features <= 20:
        raise ValueError('Use 1..20 features.')
    if not isinstance(components, int) or not 1 <= components <= 100:
        raise ValueError('Use 1..100 components.')
    if not np.isfinite(gamma) or not 1e-4 <= gamma <= 10:
        raise ValueError('Gamma must be in [1e-4,10].')
    # RandomState/order deliberately match the inspected sklearn implementation.
    rng = np.random.RandomState(seed)
    omega = np.sqrt(2 * gamma) * rng.normal(size=(n_features, components))
    phase = rng.uniform(0., 2 * np.pi, size=components)
    return {'omega': omega, 'phase': phase, 'gamma': gamma, 'seed': seed}


def rff_transform(x, state):
    x = matrix(x)
    omega, phase = state['omega'], state['phase']
    if x.shape[1] != omega.shape[0] or phase.shape != (omega.shape[1],):
        raise ValueError('Projection state must match the input channels/components.')
    return np.sqrt(2 / omega.shape[1]) * np.cos(x @ omega + phase)


def nystrom_state(training, landmark_indices, gamma=.45, relative_cutoff=1e-12):
    training = matrix(training)
    indices = np.asarray(landmark_indices)
    if indices.ndim != 1 or not 1 <= len(indices) <= len(training) or indices.dtype.kind not in 'iu':
        raise ValueError('Supply 1..n valid integer training landmark indices.')
    if len(set(indices.tolist())) != len(indices) or np.min(indices) < 0 or np.max(indices) >= len(training):
        raise ValueError('Landmark indices must be unique training addresses.')
    if not np.isfinite(relative_cutoff) or not 0 < relative_cutoff < 1:
        raise ValueError('Use a finite relative cutoff in (0,1).')
    landmarks = training[indices].copy()
    w = rbf(landmarks, landmarks, gamma)
    eigenvalues, eigenvectors = np.linalg.eigh(w)
    cutoff = relative_cutoff * max(1., float(np.max(eigenvalues)))
    if np.min(eigenvalues) < -cutoff:
        raise ArithmeticError('Materially negative landmark eigenvalue.')
    keep = eigenvalues > cutoff
    return {'landmarks': landmarks, 'indices': indices.copy(), 'gamma': gamma,
            'basis': eigenvectors[:, keep].copy(), 'eigenvalues': eigenvalues[keep].copy(),
            'cutoff': cutoff, 'all_eigenvalues': eigenvalues.copy()}


def nystrom_transform(x, state):
    b = rbf(x, state['landmarks'], state['gamma'])
    return (b @ state['basis']) / np.sqrt(state['eigenvalues'])


def main():
    strings = ['CAACAC', 'ACCAAA', '']
    coordinates = [spectrum(text, 2)[1] for text in strings]
    x = np.array([[-.9, .4], [.2, -.6], [.8, .5], [-.3, 1.1], [1.2, -.2]])
    queries = np.array([[.15, .35], [-.6, -.1], [1.4, .8]])
    state = rff_state(2)
    z = rff_transform(x, state)
    ordinary_rff = RBFSampler(gamma=.45, n_components=12, random_state=17).fit(x)
    np.testing.assert_allclose(z, ordinary_rff.transform(x), atol=1e-12, rtol=1e-12)
    np.testing.assert_allclose(rff_transform(queries, state), ordinary_rff.transform(queries), atol=1e-12, rtol=1e-12)
    ordinary_landmarks = Nystroem(kernel='rbf', gamma=.45, n_components=3, random_state=23).fit(x)
    landmarks = nystrom_state(x, ordinary_landmarks.component_indices_)
    features = nystrom_transform(x, landmarks)
    library_features = ordinary_landmarks.transform(x)
    # Eigenvector signs/rotations can differ; compare the realized dot matrix.
    np.testing.assert_allclose(features @ features.T, library_features @ library_features.T,
                               atol=1e-10, rtol=1e-10)
    query_features = nystrom_transform(queries, landmarks)
    np.testing.assert_allclose(query_features @ features.T,
                               ordinary_landmarks.transform(queries) @ library_features.T,
                               atol=1e-10, rtol=1e-10)
    duplicate_training = np.array([[.6, -.4], [.6, -.4], [-.7, .2]])
    singular = nystrom_state(duplicate_training, [0, 1])
    singular_features = nystrom_transform(duplicate_training, singular)
    assert len(singular['eigenvalues']) == 1
    finite_eigenvalues = np.linalg.eigvalsh(z @ z.T)
    assert np.min(finite_eigenvalues) > -1e-10
    report = {'versions': {'numpy': np.__version__, 'sklearn': sklearn.__version__},
              'spectrum': {'strings': strings, 'words': spectrum('', 2)[0],
                           'counts': [row.tolist() for row in coordinates],
                           'gram': (np.stack(coordinates) @ np.stack(coordinates).T).tolist()},
              'inputs': {'x': x.tolist(), 'queries': queries.tolist(), 'gamma': .45},
              'rff': {'seed': 17, 'omega': state['omega'].tolist(), 'phase': state['phase'].tolist(),
                      'features': z.tolist(), 'queries': rff_transform(queries, state).tolist(),
                      'finite_gram_eigenvalues': finite_eigenvalues.tolist(),
                      'max_exact_kernel_difference': float(np.max(np.abs(z @ z.T - rbf(x, x, .45))))},
              'nystrom': {'indices': landmarks['indices'].tolist(), 'rank': len(landmarks['eigenvalues']),
                           'cutoff': landmarks['cutoff'], 'features': features.tolist()},
              'duplicate_landmarks': {'rank': len(singular['eigenvalues']),
                                      'all_eigenvalues': singular['all_eigenvalues'].tolist(),
                                      'cutoff': singular['cutoff'], 'features': singular_features.tolist()}}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
