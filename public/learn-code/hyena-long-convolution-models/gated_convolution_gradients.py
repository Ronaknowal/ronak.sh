"""Real causal gate/filter/gate: batched FFT forward and complete analytic VJP.

Run: python gated_convolution_gradients.py
Dependencies: numpy, torch. Reference execution is float64 CPU.
Batch-first shapes, sequence axis1: v, k, q, dy=(N,L,D), h=(K,D), skip=(D,).
The kernel is shared across examples, not across channels. No dense L×L matrix
is formed by the implementation. The slow direct reference is only a check.
"""
from dataclasses import dataclass
import numpy as np


def _real_array(value, name):
    array = np.asarray(value)
    if np.iscomplexobj(array):
        raise ValueError(f"{name} must be real")
    array = np.asarray(array, dtype=np.float64)
    if not np.all(np.isfinite(array)):
        raise ValueError(f"{name} must be finite")
    return array


def _full_fft(a, b):
    """Convolve along axis1; batch and channel axes broadcast normally."""
    length = a.shape[1] + b.shape[1] - 1
    size = 1 << (length - 1).bit_length()
    product = np.fft.rfft(a, n=size, axis=1) * np.fft.rfft(b, n=size, axis=1)
    return np.fft.irfft(product, n=size, axis=1)[:, :length, :]


@dataclass(frozen=True)
class GateCache:
    value: np.ndarray
    sender: np.ndarray
    receiver: np.ndarray
    kernel: np.ndarray
    skip: np.ndarray
    transmitted: np.ndarray
    mixed: np.ndarray


def gated_forward(value, sender, receiver, kernel, skip=None):
    """Return output and an owned forward snapshot for a later VJP.

    y = q * (causal_convolution(k*v,h) + skip*(k*v)).
    Copies protect the derivative from caller edits after forward. Float64 is
    deliberate here; production dtype and memory policies need their own tests.
    """
    v, k, q, h = [_real_array(a, name) for a, name in
                  [(value, "value"), (sender, "sender"),
                   (receiver, "receiver"), (kernel, "kernel")]]
    if v.ndim != 3 or any(d < 1 for d in v.shape):
        raise ValueError("value must have nonempty shape (N,L,D)")
    if k.shape != v.shape or q.shape != v.shape:
        raise ValueError("gates must match value shape exactly")
    if h.ndim != 2 or h.shape[0] < 1 or h.shape[1] != v.shape[2]:
        raise ValueError("kernel must have nonempty shape (K,D)")
    b = np.zeros(v.shape[2]) if skip is None else _real_array(skip, "skip")
    if b.shape != (v.shape[2],):
        raise ValueError("skip must have shape (D,)")
    v, k, q, h, b = [a.copy() for a in [v, k, q, h, b]]
    z = k * v
    mixed = _full_fft(z, h[None, :, :])[:, :v.shape[1], :] + b * z
    return q * mixed, GateCache(v, k, q, h, b, z, mixed)


def gated_vjp(dy, cache):
    """All five reverse branches; kernel/skip derivatives sum over examples."""
    dy = _real_array(dy, "dy")
    if dy.shape != cache.value.shape:
        raise ValueError("dy must match the forward output shape")
    length, taps = cache.value.shape[1], cache.kernel.shape[0]
    g = dy * cache.receiver
    # Reverse-time convolution aligns the correlation at lag K−1.
    dz = _full_fft(g, cache.kernel[None, ::-1, :])[:, taps-1:taps-1+length, :]
    dz += g * cache.skip
    # h[r] only reaches observed positions t>=r. For K>L, unobserved taps
    # have zero gradient rather than being removed from the parameter shape.
    correlation = _full_fft(g, cache.transmitted[:, ::-1, :])
    dh = np.zeros_like(cache.kernel)
    observed = min(taps, length)
    dh[:observed] = correlation[:, length-1:length-1+observed, :].sum(axis=0)
    return {"value": dz * cache.sender,
            "sender": dz * cache.value,
            "receiver": dy * cache.mixed,
            "kernel": dh,
            "skip": (g * cache.transmitted).sum(axis=(0, 1))}


def direct_forward(v, k, q, h, skip):
    z = v * k
    result = np.zeros_like(z)
    for t in range(v.shape[1]):
        for r in range(min(t+1, len(h))):
            result[:, t] += z[:, t-r] * h[r]
    return q * (result + skip * z)


def direct_vjp(dy, v, k, q, h, skip):
    z = v*k
    mixed = np.zeros_like(z)
    dz = np.zeros_like(z)
    dh = np.zeros_like(h)
    g = dy*q
    for t in range(v.shape[1]):
        for r in range(min(t+1, len(h))):
            mixed[:, t] += z[:, t-r]*h[r]
            dz[:, t-r] += g[:, t]*h[r]
            dh[r] += (g[:, t]*z[:, t-r]).sum(axis=0)
    mixed += skip*z
    dz += g*skip
    return {"value":dz*k, "sender":dz*v, "receiver":dy*mixed,
            "kernel":dh, "skip":(g*z).sum(axis=(0,1))}


def torch_forward(v, k, q, h, skip):
    """Ordinary autograd route with the same axis, padding and crop contract."""
    import torch
    length = v.shape[1]
    size = 1 << (length+h.shape[0]-2).bit_length()
    z = k*v
    product = torch.fft.rfft(z, n=size, dim=1)*torch.fft.rfft(h[None], n=size, dim=1)
    return q*(torch.fft.irfft(product, n=size, dim=1)[:, :length]+skip*z)


def check_case(rng, shape, taps, zero=None):
    import torch
    names = ["value", "sender", "receiver", "kernel", "skip"]
    arrays = [rng.normal(size=shape) for _ in range(3)]
    arrays += [rng.normal(size=(taps, shape[2])), rng.normal(size=shape[2])]
    if zero is not None:
        arrays[names.index(zero)].fill(0)
    dy = rng.normal(size=shape)
    output, cache = gated_forward(*arrays)
    np.testing.assert_allclose(output, direct_forward(*arrays), rtol=1e-11, atol=1e-11)
    gradients = gated_vjp(dy, cache)
    reference = direct_vjp(dy, *arrays)
    native = [torch.tensor(a, dtype=torch.float64, requires_grad=True) for a in arrays]
    native_output = torch_forward(*native)
    (native_output*torch.tensor(dy)).sum().backward()
    np.testing.assert_allclose(output, native_output.detach().numpy(), rtol=1e-11, atol=1e-11)
    max_error = 0.
    for name, tensor in zip(names, native):
        np.testing.assert_allclose(gradients[name], reference[name], rtol=1e-10, atol=1e-10)
        np.testing.assert_allclose(gradients[name], tensor.grad.numpy(), rtol=1e-10, atol=1e-10)
        max_error = max(max_error, float(np.max(np.abs(gradients[name]-tensor.grad.numpy()))))
    # Central differences use the direct objective, so they are independent
    # of the FFT implementation and its analytic reverse-time slicing.
    eps = 1e-6
    finite_error = 0.
    for name, array in zip(names, arrays):
        for index in np.ndindex(array.shape):
            old = array[index]
            array[index] = old+eps
            plus = np.sum(direct_forward(*arrays)*dy)
            array[index] = old-eps
            minus = np.sum(direct_forward(*arrays)*dy)
            array[index] = old
            numerical = (plus-minus)/(2*eps)
            finite_error = max(finite_error, abs(numerical-gradients[name][index]))
            np.testing.assert_allclose(numerical, gradients[name][index], rtol=3e-6, atol=3e-7)
    # Caller mutation after forward must not corrupt the saved derivative.
    saved = {name: a.copy() for name,a in gradients.items()}
    arrays[0].fill(111)
    for name, a in gated_vjp(dy, cache).items():
        np.testing.assert_array_equal(a, saved[name])
    return {"shape":shape,"taps":taps,"zero":zero,
            "native_gradient_max_error":max_error,"finite_difference_max_error":finite_error}


def check_input_chain(rng):
    """The conditional value-mixing matrix omits two learned input paths."""
    import torch
    x = rng.normal(size=(1,4,2))
    weights = [rng.normal(size=(2,2)) for _ in range(3)]
    streams = [x@w.T for w in weights]  # q, k, v
    h = rng.normal(size=(3,2))
    dy = rng.normal(size=x.shape)
    _, cache = gated_forward(streams[2],streams[1],streams[0],h)
    grads = gated_vjp(dy,cache)
    dx = grads['receiver']@weights[0] + grads['sender']@weights[1] + grads['value']@weights[2]
    tx = torch.tensor(x, dtype=torch.float64, requires_grad=True)
    tq,tk,tv = [tx@torch.tensor(w.T) for w in weights]
    y = torch_forward(tv,tk,tq,torch.tensor(h),torch.zeros(2,dtype=torch.float64))
    (y*torch.tensor(dy)).sum().backward()
    np.testing.assert_allclose(dx,tx.grad.numpy(),rtol=1e-10,atol=1e-10)
    return float(np.max(np.abs(dx-tx.grad.numpy())))


def main():
    import json, torch
    rng = np.random.default_rng(3504)
    cases = [check_case(rng,shape,taps,zero) for shape,taps,zero in
             [((1,4,1),4,None),((2,5,3),2,None),((2,3,2),6,None),
              ((1,1,2),1,None),((2,4,2),3,'sender'),((1,5,2),4,'kernel')]]
    v=np.array([1.,2.,3.,4.]).reshape(1,4,1)
    k=np.array([1.,0.,-1.,2.]).reshape(1,4,1)
    q=np.array([1.,2.,-1.,.5]).reshape(1,4,1)
    h=np.array([1.,.5,.25,.125]).reshape(4,1)
    y,cache=gated_forward(v,k,q,h)
    target=np.array([0.,0.,0.,2.]).reshape(1,4,1)
    dy=y-target
    grads=gated_vjp(dy,cache)
    altered=v.copy();altered[:,3]+=7
    np.testing.assert_allclose(gated_forward(altered,k,q,h)[0][:,:3],y[:,:3],atol=1e-12)
    report={"numpy":np.__version__,"torch":torch.__version__,"device":"CPU",
            "cases":cases,"input_chain_max_error":check_input_chain(rng),
            "worked_output":y.ravel().tolist(),"worked_half_sum_loss":float(.5*np.sum(dy*dy)),
            "worked_gradients":{name:a.ravel().tolist() for name,a in grads.items()}}
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()
