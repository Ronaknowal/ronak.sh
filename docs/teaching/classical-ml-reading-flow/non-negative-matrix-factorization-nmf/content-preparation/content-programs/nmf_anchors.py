"""Bounded normalized separable-row selection, with IDs and signed residuals."""
from dataclasses import dataclass
import numpy as np

from nmf_arrays import nonnegative_table, nonnegative_scalar, positive_integer, read_only, require_finite
from nmf_nnls import encode_nnls


def normalized_rows(values):
    x = nonnegative_table(values, require_rows=True)
    with np.errstate(over='ignore', invalid='ignore'):
        mass = x.sum(axis=1)
    require_finite(mass, 'Observation row masses')
    positive = mass > 0
    z = np.zeros_like(x)
    z[positive] = x[positive] / mass[positive, None]
    return x, z, mass, positive


def global_ids(values, count):
    ids = tuple(values)
    if len(ids) != count or any(isinstance(x, (bool, np.bool_)) or not isinstance(x, (int, np.integer)) or x < 0 for x in ids):
        raise ValueError('Supply one nonnegative integer global ID per observation')
    ids = tuple(int(x) for x in ids)
    if len(set(ids)) != count:
        raise ValueError('Global observation IDs must be unique')
    return ids


@dataclass(frozen=True)
class AnchorSelection:
    selected_ids: tuple
    selected_positions: tuple
    excluded_zero_ids: tuple
    dictionary: np.ndarray
    normalized_observations: np.ndarray
    residual: np.ndarray
    directions: np.ndarray
    selected_squared_norms: tuple
    relative_tolerance: float


def select_anchors(values, ids, components, *, tolerance=1e-12):
    """Normalize positive rows, select residual norm maxima, project, retain IDs.

    Recovery needs exact separability/full row rank; this routine does not
    certify those assumptions. Ties compare ORIGINAL NORMALIZED row norms,
    then global ID. Near ties are not merged by the rank tolerance.
    """
    x, z, masses, positive = normalized_rows(values)
    ids = global_ids(ids, len(x))
    components = positive_integer(components, 'components')
    tolerance = nonnegative_scalar(tolerance, 'tolerance')
    if tolerance >= 1:
        raise ValueError('Use a relative tolerance smaller than one')
    if components > x.shape[1] or components > int(positive.sum()):
        raise ValueError('Requested rank exceeds feature or positive-row support')
    residual = z.copy()
    original_squared = np.sum(z*z, axis=1)
    threshold = tolerance * np.sqrt(float(original_squared.max()))
    selected, squared_at_selection, directions = [], [], []
    chosen = np.zeros(len(x), dtype=bool)
    for _ in range(components):
        squared = np.sum(residual*residual, axis=1)
        require_finite(squared, 'Residual squared norms')
        candidates = np.flatnonzero(positive & ~chosen).tolist()
        at = min(candidates, key=lambda i: (-float(squared[i]), -float(original_squared[i]), ids[i]))
        norm = np.sqrt(float(squared[at]))
        if norm <= threshold:
            raise ValueError('Fewer independent positive directions than requested at this tolerance')
        direction = residual[at].copy()/norm
        # Modified Gram-Schmidt projection of every row; residuals may be signed.
        coefficients = residual @ direction
        residual -= coefficients[:, None] * direction
        residual[at] = 0.0  # The selected row's exact mathematical residual is zero.
        require_finite(residual, 'Projected residuals')
        selected.append(at)
        chosen[at] = True
        squared_at_selection.append(float(squared[at]))
        directions.append(direction)
    return AnchorSelection(tuple(ids[i] for i in selected), tuple(selected),
                           tuple(ids[i] for i in range(len(x)) if not positive[i]),
                           read_only(z[selected]), read_only(z), read_only(residual),
                           read_only(directions), tuple(squared_at_selection), tolerance)


def qr_residual(selection):
    """Ordinary reduced QR independently checks the selected original span."""
    q, r = np.linalg.qr(selection.dictionary.T, mode='reduced')
    require_finite(q, 'QR basis')
    require_finite(r, 'QR triangular factor')
    z = selection.normalized_observations
    result = z - (z @ q) @ q.T
    return require_finite(result, 'QR residual')


def encode_selected(values, selection, *, max_iter=1000):
    # Dictionary rows have unit mass; amounts retain the original observation units.
    return encode_nnls(values, selection.dictionary, max_iter=max_iter)


def main():
    x = np.array([[1.,0.], [0.,1.], [.75,.25], [.25,.75], [0.,0.]])
    result = select_anchors(x, [0,1,2,3,4], 2)
    amounts, norms = encode_selected(x, result)
    first = select_anchors(x, [0,1,2,3,4], 1)
    print('selected_ids',result.selected_ids,'excluded_zero_ids',result.excluded_zero_ids)
    print('selection_squared_norms',result.selected_squared_norms)
    print('first_projection_residuals',first.residual.tolist())
    print('dictionary',result.dictionary.tolist(),'amounts',amounts.tolist(),'residual_norms',norms.tolist())
    print('QR_residual_agrees',np.allclose(result.residual,qr_residual(result),atol=1e-14))
    duplicate = np.array([[1.,0.],[0.,1.],[.75,.25],[0.,1.],[0.,0.]])
    print('duplicate_source_IDs',select_anchors(duplicate,[42,7,99,10,6],2).selected_ids)
    signed = select_anchors([[.8,.2],[.2,.8],[.5,.5]],[0,1,2],1)
    print('signed_projection',signed.residual.tolist())


if __name__ == '__main__':
    main()
