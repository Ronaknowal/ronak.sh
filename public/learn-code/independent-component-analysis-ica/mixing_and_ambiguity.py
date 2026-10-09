"""N1: row storage, known inversion, and compensating blind ambiguities."""
import numpy as np
from centered_pca import real_table

S = np.array([[-1., -1.], [-1., 1.], [1., -1.], [1., 1.]])
A = np.array([[2., 1.], [1., 2.]])


def mix(sources, operator, mean=None):
    s = real_table(sources)
    a = real_table(operator, s.shape[1])
    offset = np.zeros(a.shape[0]) if mean is None else np.asarray(mean, dtype=float)
    if offset.shape != (a.shape[0],) or not np.isfinite(offset).all():
        raise ValueError("Expected a finite channel offset")
    x = s @ a.T + offset
    if not np.isfinite(x).all():
        raise ValueError("Mixing overflowed")
    return x


def known_inverse(observations, operator, mean=None):
    a = real_table(operator)
    if a.shape[0] != a.shape[1]:
        raise ValueError("This known inverse requires a square operator")
    x = real_table(observations, a.shape[0])
    offset = np.zeros(a.shape[0]) if mean is None else np.asarray(mean, dtype=float)
    if offset.shape != (a.shape[0],) or not np.isfinite(offset).all():
        raise ValueError("Expected a finite offset")
    if np.linalg.matrix_rank(a) < a.shape[0]:
        raise ValueError("Singular operator: source coordinates are not unique")
    recovered = np.linalg.solve(a, (x - offset).T).T
    if not np.isfinite(recovered).all():
        raise ValueError("Inversion overflowed")
    return recovered


def compensated(sources, operator, permutation, scales):
    s, a = real_table(sources), real_table(operator)
    k = s.shape[1]
    p = real_table(permutation, k)
    d = np.asarray(scales, dtype=float)
    if a.shape[1] != k or p.shape != (k, k) or d.shape != (k,):
        raise ValueError("Inconsistent source/permutation/scale dimensions")
    if not np.isin(p, [0., 1.]).all() or not np.all(p.sum(0) == 1) or not np.all(p.sum(1) == 1):
        raise ValueError("Expected a permutation matrix")
    if not np.isfinite(d).all() or np.any(d == 0):
        raise ValueError("A zero or nonfinite scale cannot be compensated")
    edited_s = (s @ p.T) * d
    edited_a = (a @ p.T) / d
    if not np.isfinite(edited_s).all() or not np.isfinite(edited_a).all():
        raise ValueError("Compensation overflowed")
    return edited_s, edited_a


def main():
    np.set_printoptions(precision=6, suppress=True)
    x = mix(S, A)
    print("source_rows", S.tolist(), "channel_rows", x.tolist())
    print("known_roundtrip", np.allclose(known_inverse(x + [10, -3], A, [10, -3]), S))
    sp, ap = compensated([[3., -4.]], [[3., 1.], [1., 1.]], [[0., 1.], [1., 0.]], [-2., 1.])
    print("edited_source", sp, "edited_columns", ap, "same_channels", mix(sp, ap))
    for a in [0., 1., 1.99, 2.]:
        matrix = np.array([[2., a], [a, 2.]])
        print("family", a, "det", np.linalg.det(matrix), "condition", np.linalg.cond(matrix))
    print("nonsymmetric_rows", mix([[1., -1.]], [[2., 3.], [1., 4.]]))
    for label, operation in [("singular", lambda: known_inverse([[1., 1.]], [[2., 2.], [2., 2.]])),
                             ("zero_scale", lambda: compensated(S, A, np.eye(2), [0., 1.]))]:
        try:
            operation()
        except ValueError as error:
            print("refused", label, str(error))


if __name__ == "__main__":
    main()
