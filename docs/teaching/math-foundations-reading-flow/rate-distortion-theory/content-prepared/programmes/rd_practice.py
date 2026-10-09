"""Complete small implementations for the independent rate-distortion tasks."""
import itertools
import math
import struct

import numpy as np
from scipy.special import logsumexp

from rd_scalar_helpers import allocate
from penguins_quantization import encode as encode_measurements
from penguins_quantization import decode as decode_measurements
from penguins_quantization import load_measurements

CODEBOOK = ('000', '001', '110', '111')


def binary_entropy(p):
    return -sum(v*math.log2(v) for v in (p,1-p) if v > 0)


def binary_rate(p, budget):
    if not math.isfinite(p) or not 0 <= p <= 1:
        raise ValueError('source probability must be in [0,1]')
    if not math.isfinite(budget) or budget < 0:
        raise ValueError('budget must be finite and nonnegative')
    if budget >= min(p,1-p):
        return 0.
    return binary_entropy(p)-binary_entropy(budget)


def nearest_index(word, codebook=CODEBOOK):
    if len(word) != 3 or any(bit not in '01' for bit in word):
        raise ValueError('one complete three-bit word required')
    return min(range(len(codebook)),
               key=lambda j:sum(a!=b for a,b in zip(word,codebook[j])))


def compress_four(source):
    if any(bit not in '01' for bit in source) or len(source) >= 2**32:
        raise ValueError('binary source fitting the four-byte length required')
    padded = source+'0'*((-len(source))%3)
    indices = [nearest_index(padded[i:i+3]) for i in range(0,len(padded),3)]
    bits = ''.join(f'{j:02b}' for j in indices)
    packed = bits+'0'*((-len(bits))%8)
    payload = bytes(int(packed[i:i+8],2) for i in range(0,len(packed),8))
    return struct.pack('>I',len(source))+payload


def decompress_four(message):
    if len(message)<4:
        raise ValueError('missing source-length header')
    count, = struct.unpack('>I',message[:4])
    blocks = (count+2)//3
    used = 2*blocks
    if len(message)!=4+(used+7)//8:
        raise ValueError('payload length disagrees with header')
    bits = ''.join(f'{byte:08b}' for byte in message[4:])
    if '1' in bits[used:]:
        raise ValueError('nonzero unused payload bits')
    indices = [int(bits[i:i+2],2) for i in range(0,used,2)]
    return ''.join(CODEBOOK[j] for j in indices)[:count]


def one_ba_scalar(p, costs, weight, initial):
    # This task uses positive finite p and r and finite nonnegative costs.
    s = weight*math.log(2)
    logits = [[math.log(r)-s*d for r,d in zip(initial,row)] for row in costs]
    normalizers=[]
    q=[]
    for row in logits:
        largest=max(row)
        log_z=largest+math.log(sum(math.exp(v-largest) for v in row))
        normalizers.append(log_z)
        q.append([math.exp(v-log_z) for v in row])
    marginal=[sum(p[i]*q[i][j] for i in range(len(p))) for j in range(len(initial))]
    information=sum(p[i]*q[i][j]*(math.log(q[i][j])-math.log(marginal[j]))/math.log(2)
                    for i in range(len(p)) for j in range(len(initial)))
    distortion=sum(p[i]*q[i][j]*costs[i][j] for i in range(len(p)) for j in range(len(initial)))
    g=[sum(p[i]*math.exp(-s*costs[i][j]-normalizers[i]) for i in range(len(p)))
       for j in range(len(initial))]
    f=-sum(pi*z for pi,z in zip(p,normalizers))
    lower=(f-math.log(max(g)))/math.log(2)
    upper=information+weight*distortion
    return q,marginal,[distortion,information,lower,upper,upper-lower],g


def one_ba_array(p, costs, weight, initial):
    p,d,r=map(lambda v:np.asarray(v,dtype=np.float64),(p,costs,initial))
    scaled=weight*math.log(2)*d
    log_z=logsumexp(np.log(r)[None,:]-scaled,axis=1)
    log_q=np.log(r)[None,:]-scaled-log_z[:,None]
    q=np.exp(log_q)
    induced=p@q
    joint=p[:,None]*q
    information=float((joint*(log_q-np.log(induced)[None,:])).sum()/math.log(2))
    distortion=float((joint*d).sum())
    log_g=logsumexp(np.log(p)[:,None]-scaled-log_z[:,None],axis=0)
    lower=float((-p@log_z-log_g.max())/math.log(2))
    upper=information+weight*distortion
    return q,induced,[distortion,information,lower,upper,upper-lower],np.exp(log_g)


def rotated_error(covariance,budget):
    covariance=np.asarray(covariance,dtype=np.float64)
    if covariance.ndim!=2 or covariance.shape[0]!=covariance.shape[1]:
        raise ValueError('square covariance required')
    if not np.all(np.isfinite(covariance)) or not np.allclose(covariance,covariance.T,atol=1e-12,rtol=0):
        raise ValueError('finite symmetric covariance required')
    values,basis=np.linalg.eigh(covariance)
    if np.any(values<0):
        raise ValueError('nonnegative eigenvalues required')
    errors,rates=allocate(values.tolist(),budget)
    return values,errors,basis@np.diag(errors)@basis.T,sum(rates)


def prefix_message(text,codebook):
    # These tasks supply a fixed known prefix-free book, so no model is transmitted.
    if len(text)>=2**32:
        raise ValueError('source count exceeds header')
    bits=''.join(codebook[c] for c in text)
    padded=bits+'0'*((-len(bits))%8)
    payload=bytes(int(padded[i:i+8],2) for i in range(0,len(padded),8))
    return len(bits),struct.pack('>I',len(text))+payload


def main():
    words=[''.join(bits) for bits in itertools.product('01',repeat=3)]
    indices=[nearest_index(w) for w in words]
    errors=[sum(a!=b for a,b in zip(w,CODEBOOK[j])) for w,j in zip(words,indices)]
    assert sum(errors)==4 and max(errors)==1
    print('four-word indices / errors',indices,errors)
    print('binary rate p=.5,D=.9 / p=0,D=0',binary_rate(.5,.9),binary_rate(0,0))
    try:binary_rate(.5,-.1)
    except ValueError:pass
    else:raise AssertionError('negative budget accepted')
    source='001011101111'
    message=compress_four(source)
    assert message.hex()=='0000000c57'
    restored=decompress_four(message)
    assert restored=='001001001111'
    print('changed codec bytes / decoded / wrong positions',message.hex(),restored,
          sum(a!=b for a,b in zip(source,restored)))
    for sample in ('','0','1','01','0111','10101'):
        assert len(decompress_four(compress_four(sample)))==len(sample)
    partial=bytearray(compress_four('1'));partial[-1]|=1
    for malformed in (b'',message[:-1],message+b'\0',bytes(partial)):
        try:decompress_four(malformed)
        except ValueError:pass
        else:raise AssertionError('malformed changed codec accepted')
    mi_mixture=1-binary_entropy(.2)
    average=.5*(1-binary_entropy(.1))+.5*(1-binary_entropy(.3))
    assert mi_mixture<average
    print('channel-mixture MI / time-share mean MI',round(mi_mixture,9),round(average,9))
    p=[.7,.2,.1];values=[0,1,3];initial=[.2,.3,.5]
    costs=[[(x-y)**2*(10 if x==3 else 1) for y in values] for x in values]
    scalar=one_ba_scalar(p,costs,.1,initial)
    array=one_ba_array(p,costs,.1,initial)
    for a,b in zip(scalar,array):np.testing.assert_allclose(a,b,atol=1e-12,rtol=1e-12)
    scaled=one_ba_scalar(p,[[100*d for d in row] for row in costs],.001,initial)
    for i in (0,1,3):np.testing.assert_allclose(scalar[i],scaled[i],atol=1e-12,rtol=1e-12)
    np.testing.assert_allclose(scaled[2][0],100*scalar[2][0],rtol=1e-12)
    np.testing.assert_allclose(scalar[2][1:],scaled[2][1:],atol=1e-12,rtol=1e-12)
    print('weighted one-step channel',np.round(scalar[0],9).tolist())
    print('induced marginal / all-column g',np.round(scalar[1],9).tolist(),np.round(scalar[3],9).tolist())
    print('D / I / lower / upper / gap',np.round(scalar[2],9).tolist())
    values,errors,error_covariance,rate=rotated_error([[2.5,1.5],[1.5,2.5]],1.5)
    np.testing.assert_allclose(error_covariance,.75*np.eye(2),atol=1e-12)
    print('rotated eigenvalues / errors / trace / bits',values.tolist(),errors,
          round(float(np.trace(error_covariance)),9),round(rate,9))
    print('variance4 sign MSE / one-bit limit',round(4*(1-2/math.pi),9),1.)
    total,rows,units,omitted=load_measurements()
    print('changed observed steps retained / omitted',len(units),omitted)
    for step in (7,15):
        message=encode_measurements(units,step)
        recovered,recovered_step=decode_measurements(message)
        assert recovered_step==step
        expected=[((2*u+step)//(2*step))*step for u in units]
        assert recovered==expected
        residual=[a-b for a,b in zip(units,recovered)]
        print('step / MSE mm2 / max mm / complete bytes / bits per value',step,
              round(sum(d*d for d in residual)/(100*len(units)),9),max(map(abs,residual))/10,
              len(message),round(8*len(message)/len(units),9))
    assert decode_measurements(encode_measurements([7,21],14))[0]==[14,28]
    try:decode_measurements(message[:-1])
    except ValueError:pass
    else:raise AssertionError('truncated quantization stream accepted')
    for book in ({'A':'0','B':'10','C':'110','D':'111'},
                 {'A':'110','B':'111','C':'10','D':'0'}):
        count,message=prefix_message('AAAABBCD',book)
        print('prefix payload bits / complete bytes / hex',count,len(message),message.hex())


if __name__=='__main__':
    main()
