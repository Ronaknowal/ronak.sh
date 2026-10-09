"""Sparse signed accumulation; constructed and real hash maps kept distinct."""
import hashlib
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.feature_extraction import FeatureHasher


def deterministic_map(token, width):
    # An explicitly named SHA-256 adapter, not sklearn's MurmurHash3.
    raw = hashlib.sha256(token.encode('utf-8')).digest()
    return int.from_bytes(raw[:8], 'big') % width, (1 if raw[8] % 2 == 0 else -1)


def signed_hash(bags, width, supplied=None):
    if not isinstance(width, int) or isinstance(width, bool) or width < 1:
        raise ValueError('positive integer width')
    row_ids, col_ids, values, detail = [], [], [], []
    for i, bag in enumerate(bags):
        sums = {}
        for token, count in bag.items():
            if not isinstance(token, str) or not np.isfinite(count):
                raise ValueError('string names and finite counts')
            if supplied is not None and token not in supplied:
                raise ValueError('supplied map lacks token '+token)
            bucket, sign = supplied[token] if supplied is not None else deterministic_map(token, width)
            if not isinstance(bucket, int) or isinstance(bucket, bool) or not 0 <= bucket < width or sign not in [-1, 1]:
                raise ValueError('integer bucket in range and sign +/-1')
            sums[bucket] = sums.get(bucket, 0.)+sign*count
            detail.append((i, token, bucket, sign, float(count), float(sign*count)))
        for bucket, value in sorted(sums.items()):
            if not np.isfinite(value):
                raise ValueError('bucket accumulation overflow')
            if value != 0:
                row_ids.append(i)
                col_ids.append(bucket)
                values.append(value)
    return csr_matrix((values, (row_ids, col_ids)), shape=(len(bags), width)), detail


if __name__ == '__main__':
    mapping = {'apple': (0, 1), 'pear': (0, -1), 'banana': (1, 1)}
    bags = [{'apple': 3, 'pear': 1, 'banana': 2}, {'apple': 2, 'banana': 2}]
    got, detail = signed_hash(bags, 2, mapping)
    print('constructed contributions:', detail)
    print('constructed collision:', got.toarray().tolist())
    np.testing.assert_array_equal(got.toarray(), [[2., 2.], [2., 2.]])
    print('cancellation nnz:', signed_hash([{'apple': 1, 'pear': 1}], 2, mapping)[0].nnz)
    print('SHA adapter:', signed_hash(bags, 4)[0].toarray().tolist())
    ordinary = FeatureHasher(n_features=4, input_type='dict', alternate_sign=True)
    actual = ordinary.transform(bags)
    print('ordinary FeatureHasher:', actual.toarray().tolist())
    print('ordinary token map:', {token: ordinary.transform([{token: 1}]).toarray().ravel().tolist() for token in mapping})
    np.testing.assert_array_equal(actual.toarray(), ordinary.transform(bags).toarray())
    try:
        signed_hash([{'unknown': 1}], 2, mapping)
    except ValueError as exc:
        print('refused:', exc)
