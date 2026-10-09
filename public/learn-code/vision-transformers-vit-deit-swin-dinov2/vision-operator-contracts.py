"""Small vision operators, exact derivatives and ordinary-library comparisons.

Run: python vision-operator-contracts.py
Dependencies: NumPy and PyTorch. CPU float64; no fits, downloads or file writes.
These local operators complement vision-mechanisms.py and vision-study.py.
They are not a complete DINOv2/DINOv3/SwinV2 trainer.
"""
from __future__ import annotations

import math
import numpy as np
import torch
from torch.nn import functional as F


def real_array(values, name):
    raw = np.asarray(values)
    if np.iscomplexobj(raw) or (raw.dtype == object and any(
        np.iscomplexobj(value) for value in raw.flat
    )):
        raise ValueError(f"{name} must contain real coordinates, not complex values")
    try:
        return np.asarray(raw, dtype=np.float64)
    except (ValueError, TypeError) as error:
        raise ValueError(f"{name} must contain real numeric coordinates") from error


def finite_matrix(values, name):
    values = real_array(values, name)
    if values.ndim != 2 or not all(values.shape) or not np.isfinite(values).all():
        raise ValueError(f"{name} must be a nonempty finite two-dimensional array")
    return values


def unit_rows(values):
    values = finite_matrix(values, "features")
    # hypot reduction avoids the unnecessary overflow of squaring large inputs.
    lengths = np.hypot.reduce(values, axis=1, keepdims=True)
    if (lengths <= 0).any() or not np.isfinite(lengths).all():
        raise ValueError("each feature must have a nonzero finite length")
    return values / lengths, lengths


def normalized_gram_loss(student, teacher):
    """Aligned patch rows; mean over all ordered patch pairs, including diagonal.

    Teacher is fixed. Return loss and gradient w.r.t. raw student features.
    No N×N×d intermediate is needed: matrix products compute both Gram and VJP.
    Cost O(N²d), storage O(N²+Nd); chunk large pair objectives separately.
    """
    student = finite_matrix(student, "student")
    teacher = finite_matrix(teacher, "teacher")
    if student.shape != teacher.shape:
        raise ValueError("teacher and student must have identical aligned shapes")
    us, lengths = unit_rows(student)
    ut, _ = unit_rows(teacher)
    difference = us @ us.T - ut @ ut.T
    count = len(us)
    loss = np.square(difference).sum() / count**2
    unit_credit = 4 * (difference @ us) / count**2
    radial_credit = (unit_credit * us).sum(axis=1, keepdims=True)
    raw_credit = (unit_credit - us * radial_credit) / lengths
    if not np.isfinite(raw_credit).all():
        raise ValueError("the raw-feature derivative exceeds float64's finite range")
    return float(loss), raw_credit


def balanced_targets(positive_mass, iterations=3):
    """Alternating sample/prototype balancing of explicitly positive masses.

    This is the local, single-process arithmetic. A distributed implementation
    uses global reductions and the global batch size. Finite iterations leave
    one constraint approximate; never label them an exact doubly-balanced matrix.
    """
    mass = finite_matrix(positive_mass, "positive mass").copy()
    if (mass <= 0).any() or not isinstance(iterations, int) or iterations < 1:
        raise ValueError("strictly positive masses and positive iterations required")
    total = mass.sum()
    if not np.isfinite(total):
        raise ValueError("total mass must be finite")
    mass /= total
    if not (mass > 0).all():
        raise ValueError("the positive mass dynamic range underflows after scaling")
    samples, prototypes = mass.shape
    history = [mass.copy()]
    for _ in range(iterations):
        mass /= mass.sum(axis=0, keepdims=True) * prototypes
        history.append(mass.copy())
        mass /= mass.sum(axis=1, keepdims=True) * samples
        if not np.isfinite(mass).all() or not (mass > 0).all():
            raise ValueError("the balancing dynamic range exceeds float64")
        history.append(mass.copy())
    return mass * samples, history


def dino_logit_loss(teacher, center, student, teacher_temperature=.2,
                    student_temperature=.5):
    teacher, center, student = [real_array(row, name) for row, name in
                                zip((teacher, center, student), ("teacher", "center", "student"))]
    if teacher.ndim != 1 or not len(teacher) or not (
        teacher.shape == center.shape == student.shape
    ) or not all(np.isfinite(row).all() for row in (teacher, center, student)):
        raise ValueError("three finite equal-width logit/center vectors required")
    if not (math.isfinite(teacher_temperature) and teacher_temperature > 0
            and math.isfinite(student_temperature) and student_temperature > 0):
        raise ValueError("both temperatures must be positive and finite")
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        target_scores = (teacher-center)/teacher_temperature
        student_scores = student/student_temperature
    if not (np.isfinite(target_scores).all() and np.isfinite(student_scores).all()):
        raise ValueError("scaled logits must remain finite")
    with np.errstate(over="ignore", invalid="ignore"):
        target_shifted = target_scores-target_scores.max()
        shifted = student_scores-student_scores.max()
    if not (np.isfinite(target_shifted).all() and np.isfinite(shifted).all()):
        raise ValueError("shifted scores exceed float64's finite range")
    target_mass = np.exp(target_shifted)
    target = target_mass/target_mass.sum()
    log_probability = shifted-np.log(np.exp(shifted).sum())
    probability = np.exp(log_probability)
    loss = -target @ log_probability
    credit = (probability-target)/student_temperature
    if not (math.isfinite(loss) and np.isfinite(log_probability).all()
            and np.isfinite(credit).all()):
        raise ValueError("loss or logit credit exceeds float64's finite range")
    return float(loss), target, probability, credit


def ko_leo_direction_loss(features, epsilon=0.0):
    """Mean −log(nearest nonself Euclidean distance + epsilon) on unit rows.

    This specified scalar-epsilon objective differs slightly from a library's
    coordinate-wise pairwise_distance epsilon. Coincident rows/tied neighbours
    have separate differentiability issues; this forward function names them.
    """
    unit, _ = unit_rows(features)
    if len(unit) < 2 or not math.isfinite(epsilon) or epsilon < 0:
        raise ValueError("at least two rows and a nonnegative finite epsilon required")
    # Direct coordinate differences preserve very close distances, unlike
    # subtracting nearly equal 2−2*cosine values. A row at a time avoids N×N×d
    # storage. Large training batches should use a matched, chunked GPU operator.
    nearest = np.empty(len(unit), dtype=np.int64)
    distances = np.empty(len(unit), dtype=np.float64)
    for index, row in enumerate(unit):
        candidate_distances = np.hypot.reduce(unit-row, axis=1)
        candidate_distances[index] = np.inf
        nearest[index] = candidate_distances.argmin()
        distances[index] = candidate_distances[nearest[index]]
    if (distances+epsilon <= 0).any():
        raise ValueError("coincident neighbours have undefined log distance")
    return float(-np.log(distances+epsilon).mean()), nearest, distances


def rotate_pairs(features, angles):
    """Adjacent [even,odd] convention; each pair keeps its Euclidean length.

    features (...,2m), angles broadcastable to (...,m). Actual released rotary
    code may use another paired-coordinate ordering; align maps before reuse.
    """
    features = real_array(features, "features")
    angles = real_array(angles, "angles")
    if not features.ndim or features.shape[-1] % 2 or not features.shape[-1]:
        raise ValueError("a nonempty even coordinate width is required")
    if not (np.isfinite(features).all() and np.isfinite(angles).all()):
        raise ValueError("coordinates and angles must be finite")
    paired = features.reshape(*features.shape[:-1], -1, 2)
    cosine, sine = np.cos(angles), np.sin(angles)
    first = paired[..., 0]*cosine-paired[..., 1]*sine
    second = paired[..., 0]*sine+paired[..., 1]*cosine
    return np.stack((first, second), axis=-1).reshape(features.shape)


def cosine_score(query, key, log_scale, epsilon=1e-12):
    """SwinV2-style normalized match and capped exponentiated scale.

    The zero vector maps to zero via max(length,epsilon), matching F.normalize's
    convention. It does not become a unit direction. This is one score, not an
    attention operator: relative bias/masks/softmax/value routes follow separately.
    """
    query, key = [real_array(row, name) for row, name in zip((query, key), ("query", "key"))]
    if query.ndim != 1 or not len(query) or query.shape != key.shape or not (
        np.isfinite(query).all() and np.isfinite(key).all()
        and math.isfinite(log_scale) and math.isfinite(epsilon) and epsilon > 0
    ):
        raise ValueError("equal finite vectors, finite scale and positive epsilon required")
    query_length, key_length = float(np.hypot.reduce(query)), float(np.hypot.reduce(key))
    if not (math.isfinite(query_length) and math.isfinite(key_length)):
        raise ValueError("vector lengths must remain finite")
    query = query/max(query_length, epsilon)
    key = key/max(key_length, epsilon)
    return float(query @ key * math.exp(min(log_scale, math.log(100))))


def continuous_offset(offset, window_side):
    offset = real_array(offset, "offset")
    if offset.shape[-1:] != (2,) or not np.isfinite(offset).all() or not (
        isinstance(window_side, (int, np.integer)) and not isinstance(window_side, bool)
        and window_side >= 2
    ):
        raise ValueError("finite two-axis offsets and window side at least two required")
    with np.errstate(over="ignore", invalid="ignore"):
        scaled = offset/(window_side-1)*8
        transformed = np.sign(scaled)*np.log2(np.abs(scaled)+1)/3
    if not np.isfinite(transformed).all():
        raise ValueError("the continuous-coordinate transform exceeds float64")
    return transformed


def main():
    t, c, s = [.4,.1,-.2], [.1,0,-.1], [.1,.2,-.1]
    loss, target, probability, credit = dino_logit_loss(t,c,s)
    st = torch.tensor(s, dtype=torch.float64, requires_grad=True)
    tt = torch.tensor(target, dtype=torch.float64)
    library_loss = -(tt * F.log_softmax(st/.5, dim=0)).sum()
    library_loss.backward()
    np.testing.assert_allclose(loss, library_loss.item(), rtol=0, atol=1e-14)
    np.testing.assert_allclose(credit, st.grad.numpy(), rtol=0, atol=1e-14)
    shifted = dino_logit_loss(np.asarray(t)+3,c,s)
    np.testing.assert_allclose(target, shifted[1], rtol=0, atol=1e-14)
    assert abs(credit.sum()) < 1e-14

    student = np.array([[1.,.3],[-.4,1.2],[.7,-.8]])
    teacher = np.array([[1.,0],[0,1],[-1.,0]])
    gram_loss, raw_credit = normalized_gram_loss(student,teacher)
    student_t = torch.tensor(student, dtype=torch.float64, requires_grad=True)
    teacher_t = F.normalize(torch.tensor(teacher, dtype=torch.float64), dim=1)
    unit_t = F.normalize(student_t, dim=1)
    gram_t = ((unit_t@unit_t.T-teacher_t@teacher_t.T)**2).mean()
    gram_t.backward()
    np.testing.assert_allclose(gram_loss, gram_t.item(), rtol=0, atol=1e-14)
    np.testing.assert_allclose(raw_credit, student_t.grad.numpy(), rtol=0, atol=1e-14)
    errors = []
    for index in np.ndindex(student.shape):
        left, right = student.copy(), student.copy()
        left[index] += 1e-6
        right[index] -= 1e-6
        finite_difference = (normalized_gram_loss(left,teacher)[0]
                             -normalized_gram_loss(right,teacher)[0])/2e-6
        errors.append(abs(finite_difference-raw_credit[index]))
    assert max(errors) < 1e-8
    try:
        normalized_gram_loss([[0.,0]],[[1.,0]])
        raise AssertionError("zero-feature contract was not enforced")
    except ValueError:
        pass

    targets, history = balanced_targets([[1,2,3],[3,1,1]],3)
    np.testing.assert_allclose(targets.sum(axis=1), [1,1], rtol=0, atol=1e-14)
    np.testing.assert_allclose(targets.sum(axis=0),
        [.6682241582943829,.6661272462064307,.6656485954991865], rtol=0, atol=1e-14)
    local_ko_leo, nearest, distances = ko_leo_direction_loss([[1,0],[0,1],[-1,0]])
    assert abs(local_ko_leo+math.log(math.sqrt(2))) < 1e-14
    np.testing.assert_allclose(distances,np.repeat(math.sqrt(2),3), rtol=0, atol=1e-14)

    q, k = torch.tensor([3.,4.],dtype=torch.float64), torch.tensor([0.,2.],dtype=torch.float64)
    for scale in (math.log(10),math.log(1000)):
        expected = (F.normalize(q,dim=0)@F.normalize(k,dim=0))*math.exp(min(scale,math.log(100)))
        assert abs(cosine_score(q.numpy(),k.numpy(),scale)-expected.item()) < 1e-13
    assert cosine_score([0,0],[0,2],math.log(10)) == 0
    row = np.array([1.,0,0,1])
    rotated = rotate_pairs(row, np.array([math.pi/2,-math.pi/2]))
    np.testing.assert_allclose(rotated,[0,1,1,0], rtol=0, atol=1e-14)
    np.testing.assert_allclose(np.linalg.norm(row),np.linalg.norm(rotated),rtol=0,atol=1e-14)
    rejected = [
        lambda: normalized_gram_loss([[1+1j,0]],[[1,0]]),
        lambda: rotate_pairs(np.array([1+1j,0]),[0]),
        lambda: cosine_score([1+1j,0],[0,2],math.log(10)),
        lambda: continuous_offset([1,0],float("nan")),
        lambda: continuous_offset([1,0],float("inf")),
        lambda: continuous_offset([1e308,0],4),
        lambda: dino_logit_loss([1e308,-1e308],[0,0],[-1e308,1e308],1,1),
    ]
    for operation in rejected:
        try:
            operation()
            raise AssertionError("invalid/unrepresentable input was not rejected")
        except ValueError:
            pass
    print("DINO loss:", loss, "student credit:", credit.tolist())
    print("Mean normalized Gram loss:", gram_loss, "largest finite-difference error:", max(errors))
    print("Balanced prototype totals:", targets.sum(axis=0).tolist())
    print("KoLeo specified loss:", local_ko_leo, "nearest indices:", nearest.tolist())
    print("PASS: exact scratch/library comparisons, gradients and named contracts; no files written.")


if __name__ == "__main__":
    main()
