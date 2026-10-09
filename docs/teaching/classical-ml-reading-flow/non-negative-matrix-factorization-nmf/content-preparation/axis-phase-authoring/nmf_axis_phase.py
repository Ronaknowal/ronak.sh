"""Exact constructed tensor addresses and finite Fourier phase counterexample."""
import json
import numpy as np


def main():
    a=np.array([1.,2.]);b=np.array([1.,0.]);c=np.array([1.,3.])
    tensor=np.empty((2,2,2))
    for i in range(2):
        for j in range(2):
            for t in range(2):tensor[i,j,t]=a[i]*b[j]*c[t]
    ordinary=np.einsum('i,j,t->ijt',a,b,c)
    unfolded=np.empty((2,4))
    for i in range(2):
        for j in range(2):
            for t in range(2):unfolded[i,2*j+t]=tensor[i,j,t]
    # Tucker(1,1,1) has one core entry; this equals the same rank-one tensor.
    core=np.ones((1,1,1))
    tucker=np.einsum('pqr,ip,jq,tr->ijt',core,a[:,None],b[:,None],c[:,None])
    other_core=np.zeros((2,2,2));other_core[0,1,0]=2
    identity=np.eye(2)
    other=np.einsum('pqr,ip,jq,tr->ijt',other_core,identity,identity,identity)
    waves=[]
    for coefficients in [[0.,1.],[0.,-1.]]:
        coefficients=np.array(coefficients,dtype=complex)
        samples=[]
        for n in range(2):
            samples.append(sum(coefficients[k]*np.exp(2j*np.pi*k*n/2) for k in range(2))/2)
        ordinary_inverse=np.fft.ifft(coefficients)
        waves.append({'coefficients':coefficients.real.tolist(),'magnitude':np.abs(coefficients).tolist(),
                      'second_bin_phase':float(np.angle(coefficients[1])),
                      'direct_inverse_real':np.array(samples).real.tolist(),
                      'direct_roundoff_imaginary':np.array(samples).imag.tolist(),
                      'ordinary_ifft_real':ordinary_inverse.real.tolist()})
    print(json.dumps({'scope':'New exact anatomy only, no tensor optimizer/audio experiment',
        'factors':{'observation':a.tolist(),'feature':b.tolist(),'time':c.tolist()},
        'tensor_ijt':tensor.tolist(),'time_slices':[tensor[:,:,t].tolist() for t in range(2)],
        'address_1_0_1':float(tensor[1,0,1]),'unfolded_j_major_t_minor':unfolded.tolist(),
        'einsum_equal':bool(np.array_equal(tensor,ordinary)),'tucker111_equal':bool(np.array_equal(tensor,tucker)),
        'different_tucker_core':other_core.tolist(),'different_tucker_tensor':other.tolist(),
        'waves':waves},indent=2,allow_nan=False))


if __name__=='__main__':main()
