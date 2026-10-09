"""A preallocated compact MLA inference cache, plus independent reference checks.

Inputs C are already projected/normalized; R keys and query R are already rotated.
Maps use nn.Linear orientation: output coordinate, then input coordinate.
Persistent storage holds C once, R once, logical IDs and validity. Read workspaces
are separate. This NumPy reference is not a fused GPU kernel or training cache.

Run with Python 3.12+, NumPy 2.x; PyTorch is optional for the ordinary API checks.
"""
from __future__ import annotations

import json
import math
import platform
import numpy as np


def positive_count(value, name):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, (int, np.integer)):
        raise TypeError(f"{name} must be an integer")
    if value < 1:
        raise ValueError(f"{name} must be positive")
    return int(value)


def float_array(value, shape, dtype, name):
    array = np.asarray(value)
    if array.shape != tuple(shape):
        raise ValueError(f"{name} shape must be {tuple(shape)}, got {array.shape}")
    if array.dtype != dtype:
        raise TypeError(f"{name} dtype must be {dtype}, got {array.dtype}")
    if not np.isfinite(array).all():
        raise ValueError(f"{name} contains a non-finite coordinate")
    return array


def logical_ids(value, shape, name):
    array = np.asarray(value)
    if array.shape != tuple(shape):
        raise ValueError(f"{name} shape must be {tuple(shape)}")
    if array.dtype.kind not in "iu":
        raise TypeError(f"{name} must contain integers, not booleans/floats")
    if (array < 0).any() or (array > np.iinfo(np.int64).max).any():
        raise ValueError(f"{name} must fit a nonnegative int64")
    return array.astype(np.int64, copy=False)


class CompactMLACache:
    """One fixed inference identity; append is atomic on validation failure.

    The caller owns the model/basis/prefix/position identity of already-computed
    fields. Changing that identity requires reset and recomputing those fields.
    IDs need not be sorted or unique: permission uses IDs, not storage indices.
    Capacity reserves memory; size counts occupied slots. Inspection views are
    read-only but share storage, so copy them before later append/reset/reuse.
    """

    def __init__(self, *, batch, capacity, key_up, value_up, output_map,
                 rotary_width, dtype=np.float64):
        self.batch = positive_count(batch, "batch")
        self.capacity = positive_count(capacity, "capacity")
        self.rotary_width = positive_count(rotary_width, "rotary_width")
        if self.rotary_width % 2:
            raise ValueError("rotary_width must be even")
        self.dtype = np.dtype(dtype)
        if self.dtype not in (np.dtype(np.float32), np.dtype(np.float64)):
            raise TypeError("this reference supports float32 or float64")
        k, v, o = map(np.asarray, (key_up, value_up, output_map))
        if k.ndim != 3 or v.ndim != 3 or o.ndim != 2:
            raise ValueError("maps need K[H,dk,dc], V[H,dv,dc], O[D,H*dv]")
        self.heads, self.content_width, self.latent_width = k.shape
        if min(k.shape) < 1 or min(v.shape) < 1 or min(o.shape) < 1:
            raise ValueError("map extents must be positive")
        self.value_width = v.shape[1]
        if v.shape[0] != self.heads or v.shape[2] != self.latent_width:
            raise ValueError("key and value maps must agree on H and dc")
        if o.shape[1] != self.heads * self.value_width:
            raise ValueError("output map input width must be H*dv")
        self.key_up = float_array(k, k.shape, self.dtype, "key_up").copy()
        self.value_up = float_array(v, v.shape, self.dtype, "value_up").copy()
        self.output_map = float_array(o, o.shape, self.dtype, "output_map").copy()
        for array in (self.key_up, self.value_up, self.output_map):
            array.flags.writeable = False
        self._c = np.empty((self.batch, self.capacity, self.latent_width), self.dtype)
        self._r = np.empty((self.batch, self.capacity, self.rotary_width), self.dtype)
        self._ids = np.zeros((self.batch, self.capacity), np.int64)
        self._valid = np.zeros((self.batch, self.capacity), bool)
        self.size = 0

    @property
    def scale(self):
        # The original score width, not the absorbed dot-product width dc+dr.
        return 1 / math.sqrt(self.content_width + self.rotary_width)

    def append(self, latent, rotated_key, ids, valid=None):
        c = np.asarray(latent)
        if c.ndim != 3:
            raise ValueError("latent append needs [B,new_records,dc]")
        count = positive_count(c.shape[1], "new_records")
        if self.size + count > self.capacity:
            raise ValueError("append exceeds reserved capacity")
        # Validate ALL rows and fields before the first assignment/count change.
        c = float_array(c, (self.batch, count, self.latent_width), self.dtype, "latent")
        r = float_array(rotated_key, (self.batch, count, self.rotary_width), self.dtype, "rotated_key")
        positions = logical_ids(ids, (self.batch, count), "ids")
        validity = np.ones((self.batch, count), bool) if valid is None else np.asarray(valid)
        if validity.shape != (self.batch, count) or validity.dtype != np.dtype(bool):
            raise TypeError("valid must be a bool array [B,new_records]")
        start, stop = self.size, self.size + count
        self._c[:, start:stop] = c
        self._r[:, start:stop] = r
        self._ids[:, start:stop] = positions
        self._valid[:, start:stop] = validity
        self.size = stop

    def contents(self, *, copy=False):
        fields = {"latent": self._c[:, :self.size], "rotated_key": self._r[:, :self.size],
                  "ids": self._ids[:, :self.size], "valid": self._valid[:, :self.size]}
        if copy:
            return {name: array.copy() for name, array in fields.items()}
        result = {}
        for name, array in fields.items():
            view = array.view()
            view.flags.writeable = False
            result[name] = view
        return result

    def reset(self):
        # Old payload bytes need not be cleared: no slot is legal/occupied now.
        self.size = 0
        self._valid.fill(False)
        self._ids.fill(0)

    def read(self, query, rotated_query, query_ids, *, allowed=None, expanded=False):
        q = np.asarray(query)
        if q.ndim != 4:
            raise ValueError("query needs [B,H,new_queries,dk]")
        count = positive_count(q.shape[2], "new_queries")
        q = float_array(q, (self.batch, self.heads, count, self.content_width), self.dtype, "query")
        qr = float_array(rotated_query, (self.batch, self.heads, count, self.rotary_width), self.dtype, "rotated_query")
        ids = logical_ids(query_ids, (self.batch, count), "query_ids")
        if self.size == 0:
            raise ValueError("empty cache: no normalized read exists")
        fields = self.contents()
        legal = fields["valid"][:, None, None, :] & (fields["ids"][:, None, None, :] <= ids[:, None, :, None])
        legal = np.broadcast_to(legal, (self.batch, self.heads, count, self.size))
        if allowed is not None:
            extra = np.asarray(allowed)
            if extra.dtype != np.dtype(bool):
                raise TypeError("allowed must be bool; True permits a record")
            legal = legal & np.broadcast_to(extra, legal.shape)
        if not legal.any(axis=-1).all():
            bad = np.argwhere(~legal.any(axis=-1)).tolist()
            raise ValueError(f"undefined all-masked read at [batch,head,query] {bad}")
        c, r = fields["latent"], fields["rotated_key"]
        with np.errstate(over="ignore", invalid="ignore"):
            if expanded:
                # Reference only: reconstruct all temporary head keys/values.
                keys = c[:, None] @ self.key_up.swapaxes(-1, -2)
                content = q @ keys.swapaxes(-1, -2)
            else:
                # Broadcasted matrix products use C without a per-head copy.
                effective = q @ self.key_up
                content = effective @ c[:, None].swapaxes(-1, -2)
            scores = (content + qr @ r[:, None].swapaxes(-1, -2)) * self.scale
        if not np.isfinite(scores[legal]).all():
            raise FloatingPointError("non-finite legal scores: check magnitude/precision")
        masked = np.where(legal, scores, -np.inf)
        exponentials = np.exp(masked - masked.max(axis=-1, keepdims=True))
        weights = exponentials / exponentials.sum(axis=-1, keepdims=True)
        with np.errstate(over="ignore", invalid="ignore"):
            mixture = weights @ c[:, None]
            if expanded:
                values = c[:, None] @ self.value_up.swapaxes(-1, -2)
                head_output = weights @ values
            else:
                head_output = mixture @ self.value_up.swapaxes(-1, -2)
            joined = head_output.transpose(0, 2, 1, 3).reshape(self.batch, count, -1)
            output = joined @ self.output_map.T
        if not np.isfinite(head_output).all() or not np.isfinite(output).all():
            raise FloatingPointError("non-finite write: check magnitude/precision")
        return {"output": output, "weights": weights,
                "head_output": head_output, "mixture": mixture, "scores": scores, "legal": legal}


def ordinary_sdpa(q, c, uk, uv, qr, rk, output_map, legal):
    """Current tensors retain their gradient graph; not the inference buffers."""
    import torch
    from torch.nn import functional as F
    if legal.dtype != torch.bool:
        raise TypeError("this reference requires allowed=True boolean permission")
    if c.shape[-2] == 0 or not bool(legal.any(dim=-1).all()):
        raise ValueError("undefined all-masked/empty read before SDPA")
    effective = torch.einsum("bhtp,hpc->bhtc", q, uk)
    query = torch.cat((effective, qr), -1)
    key = torch.cat((c, rk), -1)[:, None]
    mixture = F.scaled_dot_product_attention(query, key, c[:, None],
        attn_mask=legal, is_causal=False, dropout_p=0.,
        scale=1 / math.sqrt(q.shape[-1] + qr.shape[-1]), enable_gqa=True)
    heads = torch.einsum("bhtc,hvc->bhtv", mixture, uv)
    joined = heads.transpose(1, 2).flatten(-2)
    return joined @ output_map.T


def main():
    rng = np.random.default_rng(73)
    b, h, t, s, dc, dk, dv, dr, d = 2, 3, 2, 4, 5, 3, 2, 2, 4
    q, c, uk, uv, qr, rk, out = [rng.normal(size=shape) for shape in
        [(b,h,t,dk),(b,s,dc),(h,dk,dc),(h,dv,dc),(b,h,t,dr),(b,s,dr),(d,h*dv)]]
    cache = CompactMLACache(batch=b, capacity=8, key_up=uk, value_up=uv,
                            output_map=out, rotary_width=dr)
    ids = np.tile(np.arange(s), (b,1))
    valid = np.ones((b,s), bool)
    valid[1,1] = False
    cache.append(c[:,:2], rk[:,:2], ids[:,:2], valid[:,:2])
    cache.append(c[:,2:], rk[:,2:], ids[:,2:], valid[:,2:])
    query_ids = np.tile([2,3], (b,1))
    actual = cache.read(q,qr,query_ids)
    reference = cache.read(q,qr,query_ids,expanded=True)
    for name in ("output","weights","head_output","mixture"):
        np.testing.assert_allclose(actual[name],reference[name],atol=1e-12,rtol=1e-12)
    # Invalid later row, malformed R/IDs/validity, wrong dtype and capacity:
    # not a single occupied OR reserved byte/count may change on rejection.
    storage = lambda: (cache.size, *(array.tobytes() for array in (cache._c,cache._r,cache._ids,cache._valid)))
    bad_c = c[:,:1].copy(); bad_c[1,0,0] = np.nan
    bad_r = rk[:,:1].copy(); bad_r[1,0,0] = np.inf
    bad_ids = ids[:,:1].copy(); bad_ids[1,0] = -1
    invalid = [(bad_c,rk[:,:1],ids[:,:1],None),
               (c[:,:1],bad_r,ids[:,:1],None),
               (c[:,:1],rk[:,:1],bad_ids,None),
               (c[:,:1],rk[:,:1],ids[:,:1].astype(float),None),
               (c[:,:1],rk[:,:1],ids[:,:1],np.ones((b,1),int)),
               (c[:,:1].astype(np.float32),rk[:,:1],ids[:,:1],None),
               (np.zeros((b,5,dc)),np.zeros((b,5,dr)),np.zeros((b,5),np.int64),None)]
    for args in invalid:
        before = storage()
        try: cache.append(*args)
        except (ValueError,TypeError): pass
        else: raise AssertionError("invalid append was accepted")
        assert storage() == before
    one_bad_row = actual["legal"].copy()
    one_bad_row[1,2,1] = False
    for mask in [np.zeros_like(actual["legal"]), one_bad_row]:
        try: cache.read(q,qr,query_ids,allowed=mask)
        except ValueError as error: assert "all-masked" in str(error)
        else: raise AssertionError("all-masked read returned a normalized output")
    report = {"python":platform.python_version(),"numpy":np.__version__,
              "expanded_error":float(np.max(np.abs(actual["output"]-reference["output"]))),
              "atomic_invalid_appends":len(invalid),"all_masked_rejected":True,
              "reserved_payload_bytes":cache._c.nbytes+cache._r.nbytes,
              "occupied_payload_bytes":b*s*(dc+dr)*cache.dtype.itemsize}
    try:
        import torch
    except ImportError:
        report["torch"] = "unavailable: API/gradient checks not run"
    else:
        torch.set_num_threads(1)
        tensors = [torch.tensor(array,dtype=torch.float64,requires_grad=True) for array in (q,c,uk,uv,qr,rk,out)]
        allowed = torch.tensor(actual["legal"])
        native = ordinary_sdpa(*tensors,allowed)
        np.testing.assert_allclose(native.detach().numpy(),actual["output"],atol=1e-11,rtol=1e-11)
        qt,ct,kt,vt,qrt,rkt,ot = tensors
        full_keys = torch.einsum("bsc,hpc->bhsp",ct,kt)
        full_values = torch.einsum("bsc,hvc->bhsv",ct,vt)
        scores = (torch.einsum("bhtp,bhsp->bhts",qt,full_keys)+torch.einsum("bhtr,bsr->bhts",qrt,rkt))*cache.scale
        probabilities = scores.masked_fill(~allowed,-torch.inf).softmax(-1)
        head_output = torch.einsum("bhts,bhsv->bhtv",probabilities,full_values)
        expanded = head_output.transpose(1,2).flatten(-2) @ ot.T
        probe = torch.linspace(-.8,1.,native.numel(),dtype=native.dtype).reshape_as(native)
        left = torch.autograd.grad((expanded*probe).sum(),tensors)
        right = torch.autograd.grad((native*probe).sum(),tensors)
        for a,g in zip(left,right,strict=True): torch.testing.assert_close(a,g,atol=1e-10,rtol=1e-10)
        report.update(torch=torch.__version__,native_error=float((native-expanded).abs().max().detach()),
                      seven_factor_gradient_error=max(float((a-g).abs().max()) for a,g in zip(left,right,strict=True)))
    copied = cache.contents(copy=True)
    cache.reset()
    assert cache.size == 0 and not cache._valid.any()
    np.testing.assert_array_equal(copied["latent"],c)
    cache.append(c,rk,ids,valid)
    np.testing.assert_allclose(cache.read(q,qr,query_ids)["output"],actual["output"],atol=0,rtol=0)
    report["reset_and_reuse"] = True
    print(json.dumps(report,indent=2))


if __name__ == "__main__":
    main()
