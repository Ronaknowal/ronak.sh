"""Validated request snapshots around the already explained tiny StrokeModel.

Put this beside stroke_models.py and its saved stroke-fits.npz. This file imports
the same fitted model; it never trains or rewrites a scientific artifact. The
adapter is specific to eight normalized PenDigits points and the taught fixed
global-position basis, not a serving implementation for released Jamba models.
"""
from dataclasses import dataclass
import hashlib
import torch
from stroke_models import WIDTH, STATE, load_fit

BASIS = 'pendigits-fixed-xy/global-index-over-7/v1'


def model_identity(model):
    """Bind the architecture and actual parameter bytes, not a friendly name."""
    digest = hashlib.sha256(model.pattern.encode())
    for name, value in model.state_dict().items():
        digest.update(name.encode())
        digest.update(str((tuple(value.shape), value.dtype)).encode())
        digest.update(value.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def clone_cache(cache):
    """Clone both tensors of every nonempty layer; keep no mutable aliases."""
    return tuple(None if entry is None else tuple(value.detach().clone() for value in entry)
                 for entry in cache)


@dataclass(frozen=True)
class Snapshot:
    request_id: str
    model_id: str
    basis: str
    batch: int
    offset: int
    prefix_digest: str
    _cache: tuple

    @property
    def cache(self):
        # A caller may inspect or edit this returned copy, never the snapshot's
        # own tensor storage. Frozen metadata alone would not freeze a tensor.
        return clone_cache(self._cache)


class StrokeRequest:
    """One request's owned prefix, with atomic validation before continuation."""

    def __init__(self, model, request_id, batch=1, basis=BASIS):
        if model.pattern not in {'MMM', 'AAA', 'MAM', 'AMM'} or model.training:
            raise ValueError('Use an evaluated causal model, not the flattened baseline.')
        if not isinstance(request_id, str) or not request_id:
            raise ValueError('Give the request a nonempty identity.')
        if isinstance(batch, bool) or not isinstance(batch, int) or batch < 1:
            raise ValueError('Batch size must be a positive integer.')
        if basis != BASIS:
            raise ValueError('This adapter teaches the fixed eight-point position basis.')
        self.model = model
        self.request_id = request_id
        self.batch = batch
        self.basis = basis
        self.model_id = model_identity(model)
        self._offset = 0
        self._cache = tuple(None for _ in model.layers)
        self._points = None

    @property
    def offset(self):
        return self._offset

    @property
    def cache(self):
        return clone_cache(self._cache)

    def _check_model(self):
        if self.model.training or model_identity(self.model) != self.model_id:
            raise ValueError('The model weights or evaluation state changed during this request.')

    def _validate_cache(self, cache, offset):
        parameter = next(self.model.parameters())
        if not isinstance(cache, tuple) or len(cache) != len(self.model.layers):
            raise ValueError('The cache must have one entry per depth layer.')
        for kind, entry in zip(self.model.pattern, cache):
            if offset == 0:
                if entry is not None:
                    raise ValueError('An empty prefix cannot carry another request\'s tensors.')
                continue
            shapes = ((self.batch, WIDTH, STATE), (self.batch, WIDTH, 2)) if kind == 'M' else (
                (self.batch, offset, WIDTH), (self.batch, offset, WIDTH))
            if not isinstance(entry, tuple) or len(entry) != 2:
                raise ValueError('Every nonempty layer needs exactly two cache tensors.')
            for tensor, shape in zip(entry, shapes):
                if (not isinstance(tensor, torch.Tensor) or tuple(tensor.shape) != shape
                        or tensor.dtype != parameter.dtype or tensor.device != parameter.device
                        or not bool(torch.isfinite(tensor).all())):
                    raise ValueError('A cache tensor has the wrong shape, dtype, device or finite values.')

    def _validate_input(self, points):
        parameter = next(self.model.parameters())
        if (not isinstance(points, torch.Tensor) or points.ndim != 3
                or points.shape[0] != self.batch or points.shape[2] != 2
                or points.dtype != parameter.dtype or points.device != parameter.device
                or not points.is_floating_point() or points.is_complex()
                or not bool(torch.isfinite(points).all())
                or bool((points.abs() > 1).any())
                or self.offset + points.shape[1] > 8):
            raise ValueError('Supply finite normalized B×T×2 points with matching dtype/device and at most eight global positions.')

    def append(self, points):
        """Return this chunk's logits, including B×0×10 for an empty chunk.

        Check identities, shapes and every batch row first. Stream into cloned
        state. Commit only after all produced logits and caches are finite.
        """
        self._check_model()
        self._validate_input(points)
        self._validate_cache(self._cache, self.offset)
        if points.shape[1] == 0:
            return points.new_empty((self.batch, 0, 10))
        with torch.inference_mode():
            logits, cache = self.model.stream(points, list(clone_cache(self._cache)), offset=self.offset)
        new_offset = self.offset + points.shape[1]
        new_cache = clone_cache(cache)
        self._validate_cache(new_cache, new_offset)
        if not bool(torch.isfinite(logits).all()):
            raise ValueError('The model produced non-finite logits; request state was not committed.')
        new_points = points.detach().clone() if self._points is None else torch.cat((self._points, points.detach()), 1)
        self._cache, self._offset, self._points = new_cache, new_offset, new_points
        return logits

    def snapshot(self):
        self._check_model()
        self._validate_cache(self._cache, self.offset)
        digest = hashlib.sha256(b'' if self._points is None else self._points.cpu().contiguous().numpy().tobytes()).hexdigest()
        return Snapshot(self.request_id, self.model_id, self.basis, self.batch, self.offset,
                        digest, clone_cache(self._cache))

    def restore(self, snapshot):
        """Restore this request's genuine prefix; reject a donor before mutation."""
        self._check_model()
        if (not isinstance(snapshot, Snapshot) or snapshot.request_id != self.request_id
                or snapshot.model_id != self.model_id or snapshot.basis != self.basis
                or snapshot.batch != self.batch or isinstance(snapshot.offset, bool)
                or not isinstance(snapshot.offset, int) or not 0 <= snapshot.offset <= self.offset):
            raise ValueError('Snapshot request/model/basis/batch/offset identity does not match.')
        points = None if snapshot.offset == 0 else self._points[:, :snapshot.offset].detach().clone()
        digest = hashlib.sha256(b'' if points is None else points.cpu().contiguous().numpy().tobytes()).hexdigest()
        if digest != snapshot.prefix_digest:
            raise ValueError('The requested snapshot belongs to a different input prefix.')
        self._validate_cache(snapshot._cache, snapshot.offset)
        cache = clone_cache(snapshot._cache)
        self._cache, self._offset, self._points = cache, snapshot.offset, points

    def fork(self, branch_id):
        """The two branches share frozen weights and own distinct tensor storage."""
        self._check_model()
        self._validate_cache(self._cache, self.offset)
        branch = StrokeRequest(self.model, branch_id, self.batch, self.basis)
        if branch_id == self.request_id:
            raise ValueError('A fork needs a distinct branch identity.')
        branch._cache = clone_cache(self._cache)
        branch._offset = self.offset
        branch._points = None if self._points is None else self._points.detach().clone()
        return branch


def main():
    """A real saved model, two request lanes, a branch, and snapshot rewind."""
    torch.set_num_threads(1)
    model = load_fit('MAM-37')
    raw = torch.tensor([[38,100],[100,92],[88,77],[75,62],[50,46],[25,30],[12,15],[0,0]], dtype=torch.float32)
    points = (raw / 50 - 1).unsqueeze(0)
    request = StrokeRequest(model, 'handwriting-R')
    prefix = request.append(points[:, :3])
    saved = request.snapshot()
    branch = request.fork('handwriting-R-alternative')
    suffix = request.append(points[:, 3:])
    branch_suffix = branch.append(points[:, 3:])
    with torch.inference_mode():
        full = model(points, all_positions=True)
    continued = torch.cat((prefix, suffix), 1)
    torch.testing.assert_close(continued, full, atol=2e-5, rtol=2e-5)
    torch.testing.assert_close(branch_suffix, suffix, atol=0, rtol=0)
    request.restore(saved)
    torch.testing.assert_close(request.append(points[:, 3:]), suffix, atol=0, rtol=0)
    assert request.append(points[:, :0]).shape == (1, 0, 10)
    print('Maximum full/continued difference:', float((continued-full).abs().max()))
    print('Same-input branch and snapshot restore agree; empty suffix is safe.')


if __name__ == '__main__':
    main()
