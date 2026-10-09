"""RoFormer's rotated-numerator / unrotated-denominator linear read.

Requires NumPy and PyTorch. No training or downloaded model.
Run: python rotary-linear-read.py
Inputs are ALREADY nonnegative feature-map outputs, not raw Q/K.
This operator does not compute softmax attention or probability weights.
"""
import numpy as np
import torch


def turn(rows, ids, theta):
    paired = rows.reshape(len(rows), -1, 2)
    a = ids[:, None] * theta[None, :]
    c, s = np.cos(a), np.sin(a)
    x, y = paired[..., 0], paired[..., 1]
    return np.stack((x*c-y*s, x*s+y*c), -1).reshape(rows.shape)


def linear_rotary_read(query_features, key_features, values, query_ids, key_ids, theta):
    q, k, v, m, n, frequency = [np.asarray(a, dtype=np.float64) for a in
                               (query_features, key_features, values, query_ids, key_ids, theta)]
    if q.ndim != 2 or k.ndim != 2 or v.ndim != 2 or q.shape[1] != k.shape[1]:
        raise ValueError('Q/K must be row arrays with the same positive even width; V is a row array.')
    width = q.shape[1]
    if not len(q) or not len(k) or width < 2 or width % 2 or not v.shape[1]:
        raise ValueError('Nonempty rows, values and positive even feature width required.')
    if len(k) != len(v) or m.shape != (len(q),) or n.shape != (len(k),) or frequency.shape != (width//2,):
        raise ValueError('Query/key IDs and rotary frequencies must match their arrays.')
    if not all(np.isfinite(a).all() for a in (q,k,v,m,n,frequency)) or (q<0).any() or (k<0).any():
        raise ValueError('Finite inputs and nonnegative feature-map outputs required.')
    rq, rk = turn(q,m,frequency), turn(k,n,frequency)
    # Key/value summary is width x value-width, rather than query-count x key-count.
    summary = rk.T @ v
    key_mass = k.sum(axis=0)
    denominator = q @ key_mass
    if (denominator <= 0).any():
        raise ValueError('Each query needs a strictly positive unrotated normalization mass.')
    return (rq @ summary) / denominator[:,None]


def ordinary_read(q,k,v,m,n,theta):
    def rotation(x,ids):
        pair=x.reshape(len(x),-1,2)
        a=ids[:,None]*theta[None,:]
        c,s=a.cos(),a.sin()
        return torch.stack((pair[...,0]*c-pair[...,1]*s,
                            pair[...,0]*s+pair[...,1]*c),-1).reshape_as(x)
    # Ordinary differentiable tensor operations retain the same reassociation.
    summary=rotation(k,n).transpose(0,1) @ v
    numerator=rotation(q,m) @ summary
    denominator=q @ k.sum(dim=0)
    return numerator/denominator[:,None]


def main():
    q=np.array([[1.,1.]])
    k=np.array([[1.,1.],[1.,1.]])
    v=np.array([[2.],[6.]])
    m=np.array([0.]); n=np.array([0.,np.pi]); theta=np.array([1.])
    output=linear_rotary_read(q,k,v,m,n,theta)
    np.testing.assert_allclose(output,[[-2.]],atol=1e-12)
    explicit=(turn(q,m,theta) @ turn(k,n,theta).T) @ v/(q @ k.T).sum(axis=1,keepdims=True)
    np.testing.assert_allclose(output,explicit,atol=1e-12)
    args=[torch.tensor(a,dtype=torch.float64,requires_grad=i<3) for i,a in enumerate((q,k,v,m,n,theta))]
    native=ordinary_read(*args)
    np.testing.assert_allclose(native.detach().numpy(),output,atol=1e-12)
    native.sum().backward()
    largest=0.
    for index in range(3):
        for cell in np.ndindex(args[index].shape):
            plus=[a.copy() for a in (q,k,v,m,n,theta)]
            minus=[a.copy() for a in (q,k,v,m,n,theta)]
            plus[index][cell]+=1e-5; minus[index][cell]-=1e-5
            difference=(linear_rotary_read(*plus).sum()-linear_rotary_read(*minus).sum())/2e-5
            error=abs(difference-args[index].grad[cell].item())
            largest=max(largest,error)
            assert error<1e-9
    # Shift all coordinates together: both numerator rotations cancel their common turn.
    np.testing.assert_allclose(linear_rotary_read(q,k,v,m+20,n+20,theta),output,atol=1e-12)
    try:
        linear_rotary_read(np.zeros_like(q),k,v,m,n,theta)
    except ValueError:
        pass
    else:
        raise AssertionError('A zero denominator must be rejected.')
    print('Signed coefficients [0.5, -0.5]; result:',output.ravel().tolist())
    print('Explicit pairs, ordinary tensor route, common shift and zero-mass boundary passed.')
    print('All Q/K-feature/V gradients: max central-difference error',largest)


if __name__=='__main__':
    main()
