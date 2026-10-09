"""Offline recorded covariance, Python 3 + NumPy 2.3.5.
Download Eigenvalues & Eigenvectors' canonical iris-corrected.csv beside
this file; keep covariance_attention_scratch.py and its explicit contraction
dependency beside it. Species is recorded but excluded from calculations.
UCI corrected bezdekIris.data, DOI10.24432/C56C76, CC BY4.0. Four measured
flower features are centimetres, so covariance entries are cm squared.
This is an empirical diagnostic, not an iid or causal population claim.
"""
import csv
from pathlib import Path
import numpy as np
from covariance_attention_scratch import sample_covariance


if __name__ == '__main__':
    with Path(__file__).with_name('iris-corrected.csv').open(newline='', encoding='utf8') as stream:
        records = list(csv.reader(stream))
    x = np.array([[float(value) for value in row[:4]] for row in records[1:]])
    mean = x.mean(axis=0)
    z = x - mean
    covariance = np.einsum('ni,nj->ij', z, z) / (len(x) - 1)
    _, _, scratch = sample_covariance(x.tolist())
    print('observations/features', x.shape)
    print('mean cm', np.round(mean, 6).tolist())
    print('covariance cm squared', np.round(covariance, 6).tolist())
    print('scratch agreement', np.allclose(covariance, scratch, atol=1e-12))
    print('numpy cov agreement', np.allclose(covariance, np.cov(x, rowvar=False, ddof=1)))
    shifted = x + [4, 2, -1, 3]
    zs = shifted - shifted.mean(axis=0)
    shifted_cov = np.einsum('ni,nj->ij', zs, zs) / (len(x) - 1)
    print('translated covariance agreement', np.allclose(covariance, shifted_cov, atol=1e-12))
    scaled = z * [1, 1, 10, 1]
    scaled_cov = np.einsum('ni,nj->ij', scaled, scaled) / (len(x) - 1)
    print('petal length tenfold variance factor', round(float(scaled_cov[2, 2] / covariance[2, 2]), 6))
    print('petal length-width cross factor', round(float(scaled_cov[2, 3] / covariance[2, 3]), 6))
