"""Cartesian tensor products, explicit e3nn basis conversion and typed attention.

Requires torch and e3nn. The full tensor product has no learned weights.
"""
import math
import torch
import e3nn
from e3nn import o3
from e3nn.io import CartesianTensor


def decompose(matrix):
    scalar = matrix.diagonal(dim1=-2,dim2=-1).sum(-1)[...,None,None]/3
    scalar = scalar*torch.eye(3,dtype=matrix.dtype,device=matrix.device)
    axial = (matrix-matrix.transpose(-1,-2))/2
    traceless = (matrix+matrix.transpose(-1,-2))/2-scalar
    return scalar, axial, traceless


def cartesian_conversion(tensor_product):
    # Nine Cartesian unit products make the coefficient convention explicit.
    # A row c_ij contains TP(e_i,e_j). Thus vec(M) C = coefficients, and
    # coefficients C^{-1} reconstructs Cartesian row-major entries.
    eye=torch.eye(3,dtype=torch.float64)
    coefficients=torch.stack([tensor_product(a,b) for a in eye for b in eye])
    return torch.linalg.solve(coefficients,torch.eye(9,dtype=torch.float64))


def typed_read(query,keys,vector_values,tensor_values,permitted):
    scores=keys@query
    if not permitted.any():
        return None
    maximum=scores[permitted].max()
    masses=torch.where(permitted,torch.exp(scores-maximum),0.)
    weights=masses/masses.sum()
    vector=(weights[:,None]*vector_values).sum(0)
    tensor=(weights[:,None,None]*tensor_values).sum(0)
    return weights,vector,tensor


def main():
    torch.set_default_dtype(torch.float64)
    torch.set_num_threads(1)
    tp=o3.FullTensorProduct('1o','1o').double()
    conversion=cartesian_conversion(tp)
    v=torch.tensor([1.,2.,0.],requires_grad=True)
    u=torch.tensor([0.,1.,3.],requires_grad=True)
    matrix=v[:,None]*u[None,:]
    reconstructed=(tp(v,u)@conversion).reshape(3,3)
    torch.testing.assert_close(matrix,reconstructed,atol=1e-12,rtol=1e-12)
    scalar,axial,traceless=decompose(matrix)
    torch.testing.assert_close(scalar+axial+traceless,matrix,atol=1e-12,rtol=1e-12)
    probe=torch.tensor([[.2,-.7,.3],[.4,.8,-.2],[.6,.1,-.5]])
    a=torch.autograd.grad((matrix*probe).sum(),(v,u),retain_graph=True)
    b=torch.autograd.grad((reconstructed*probe).sum(),(v,u),retain_graph=True)
    for x,y in zip(a,b,strict=True):
        torch.testing.assert_close(x,y,atol=1e-12,rtol=1e-12)
    symmetric=CartesianTensor('ij=ji')
    symmetric_coefficients=symmetric.from_cartesian(matrix)
    symmetric_return=symmetric.to_cartesian(symmetric_coefficients)
    torch.testing.assert_close(symmetric_return,(matrix+matrix.T)/2,atol=1e-12,rtol=1e-12)
    angle=math.radians(37)
    q=torch.tensor([[math.cos(angle),-math.sin(angle),0.],
                    [math.sin(angle),math.cos(angle),0.],[0.,0.,1.]])
    reflections=[q,q@torch.diag(torch.tensor([-1.,1.,1.]))]
    query=torch.tensor([1.,0.,0.])
    keys=torch.tensor([[1.,0.,0.],[0.,1.,0.]])
    vectors=torch.tensor([[1.,0.,0.],[0.,2.,0.]])
    tensors=torch.stack((torch.diag(torch.tensor([1.,-1.,0.])),
                         torch.diag(torch.tensor([0.,1.,-1.]))))
    allowed=torch.tensor([True,True])
    weights,vector,tensor=typed_read(query,keys,vectors,tensors,allowed)
    for motion in reflections:
        moved=tp(motion@v,motion@u)
        irreps_motion=tp.irreps_out.D_from_matrix(motion)
        torch.testing.assert_close(moved,irreps_motion@tp(v,u),atol=1e-10,rtol=1e-10)
        moved_cartesian=(moved@conversion).reshape(3,3)
        torch.testing.assert_close(moved_cartesian,motion@matrix@motion.T,atol=1e-12,rtol=1e-12)
        moved_read=typed_read(motion@query,keys@motion.T,vectors@motion.T,
                              motion@tensors@motion.T,allowed)
        torch.testing.assert_close(moved_read[0],weights,atol=1e-12,rtol=1e-12)
        torch.testing.assert_close(moved_read[1],motion@vector,atol=1e-12,rtol=1e-12)
        torch.testing.assert_close(moved_read[2],motion@tensor@motion.T,atol=1e-12,rtol=1e-12)
    print('e3nn:',e3nn.__version__,'output:',str(tp.irreps_out),'weights:',tp.weight_numel)
    print('outer product:',matrix.tolist())
    print('scalar/antisymmetric/ST:',[x.tolist() for x in (scalar,axial,traceless)])
    print('symmetric coordinates:',symmetric.dim,'ST coordinates:',5)
    print('conversion matrix:',conversion.tolist())
    print('both input gradients:',[x.tolist() for x in b])
    print('reconstruction and proper/reflected actions: matched')
    print('typed attention weights/vector/tensor:',weights.tolist(),vector.tolist(),tensor.tolist())


if __name__=='__main__':
    main()
