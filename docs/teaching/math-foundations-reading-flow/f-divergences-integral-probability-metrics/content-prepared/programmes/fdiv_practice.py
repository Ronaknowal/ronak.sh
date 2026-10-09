"""Changed implementations and fixtures for the four transfer tasks; no old main runs."""
import math

import numpy as np
from sklearn.metrics.pairwise import rbf_kernel

from fdiv_blockwise import mmd2
from iris_mmd import load_rows, select, scalar_mmd2, ordinary_mmd2


def kl_contribution(p, q, centered=False):
    if any(not math.isfinite(v) or not 0 <= v <= 1 for v in (p,q)):
        raise ValueError("Two finite probabilities in [0,1] required.")
    if p == 0:
        return q if centered else 0.
    if q == 0:
        return math.inf
    delta = (p-q)/q
    if centered and abs(delta) < .01:
        # (1+d)log(1+d)-d = d^2/2-d^3/6+d^4/12-...
        return q*math.fsum((-1)**order*delta**order/(order*(order-1))
                           for order in range(2,15))
    raw = p*(math.log1p(delta) if abs(delta) < .01 else math.log(p)-math.log(q))
    return raw-p+q if centered else raw


def corrected_pair_estimators(x, y, sigma):
    if min(len(x),len(y)) < 2 or not math.isfinite(sigma) or sigma <= 0:
        raise ValueError("Two or more observations per group and positive finite sigma required.")
    if any(not math.isfinite(v) for v in [*x,*y]):
        raise ValueError("Finite coordinates required.")
    kernel = lambda a,b:math.exp(-.5*((a-b)/sigma)**2)
    n,m=len(x),len(y)
    xx=math.fsum(kernel(a,b) for a in x for b in x)
    yy=math.fsum(kernel(a,b) for a in y for b in y)
    xy=math.fsum(kernel(a,b) for a in x for b in y)
    off_x=math.fsum(kernel(a,b) for i,a in enumerate(x) for j,b in enumerate(x) if i!=j)
    off_y=math.fsum(kernel(a,b) for i,a in enumerate(y) for j,b in enumerate(y) if i!=j)
    biased=xx/n**2+yy/m**2-2*xy/(n*m)
    unbiased=off_x/(n*(n-1))+off_y/(m*(m-1))-2*xy/(n*m)
    return biased,unbiased


def mmd_in_cm(x, y, sigma_cm, coordinate_unit="cm"):
    if coordinate_unit not in ("cm","mm"):
        raise ValueError("Declare cm or mm coordinates.")
    x,y=np.asarray(x,float),np.asarray(y,float)
    if (x.ndim!=2 or y.ndim!=2 or x.shape[1]!=y.shape[1] or min(len(x),len(y))<1
            or not np.isfinite(x).all() or not np.isfinite(y).all()
            or not math.isfinite(sigma_cm) or sigma_cm<=0):
        raise ValueError("Finite matching row arrays and positive physical bandwidth required.")
    divisor=10 if coordinate_unit=="mm" else 1
    x,y=x/divisor,y/divisor
    gamma=1/(2*sigma_cm**2)
    return float(rbf_kernel(x,gamma=gamma).mean()+rbf_kernel(y,gamma=gamma).mean()
                 -2*rbf_kernel(x,y,gamma=gamma).mean())


def main():
    p,q=[.6,.4,0],[.3,.5,.2]
    raw=[kl_contribution(a,b) for a,b in zip(p,q)]
    centered=[kl_contribution(a,b,True) for a,b in zip(p,q)]
    assert math.isclose(math.fsum(raw),math.fsum(centered),abs_tol=1e-14)
    assert kl_contribution(0,0,True)==0 and kl_contribution(.2,0)==math.inf
    assert kl_contribution(.3,.3,True)==0
    near=kl_contribution(.5+1e-10,.5,True)
    assert 0 < near < 2e-20
    print("T11 raw / centered rows",[round(v,9) for v in raw],[round(v,9) for v in centered])
    print("T11 totals / near-equality centered",round(math.fsum(raw),9),format(near,".9g"))
    for x,y in (([-1.,1.],[-1.,1.]),([-1.,1.],[-1.,0.,1.])):
        values=corrected_pair_estimators(x,y,1.)
        oracle=[mmd2(np.array(x)[:,None],np.array(y)[:,None],1.,block_size=2,unbiased=u)
                for u in (False,True)]
        assert all(abs(a-b)<1e-14 for a,b in zip(values,oracle))
        print("T12 sizes / B / U",len(x),len(y),[round(v,9) for v in values])
    x,y=np.array([[0.,0.],[1.,0.]]),np.array([[0.,2.],[1.,2.]])
    value=mmd_in_cm(x,y,2.,"cm")
    converted=mmd_in_cm(10*x,10*y,2.,"mm")
    assert abs(value-converted)<1e-14
    wrong_unit=ordinary_mmd2(10*x,10*y,2.)
    wrong_gamma=float(rbf_kernel(x,gamma=2.).mean()+rbf_kernel(y,gamma=2.).mean()
                      -2*rbf_kernel(x,y,gamma=2.).mean())
    print("T13 correct cm / declared mm / wrong unit / gamma=sigma",[round(v,9) for v in (value,converted,wrong_unit,wrong_gamma)])
    rows=load_rows()
    x_ids,x=select(rows,"Iris-versicolor",(2,3))
    y_ids,y=select(rows,"Iris-virginica",(2,3))
    sigma=.75
    values=[scalar_mmd2(x,y,sigma),mmd2(x,y,sigma,block_size=17),ordinary_mmd2(x,y,sigma)]
    assert max(values)-min(values)<1e-12
    print("T14 petal / sigma cm / row spans",sigma,[x_ids[0],x_ids[-1]],[y_ids[0],y_ids[-1]])
    print("T14 scalar / blocked / ordinary",[round(v,10) for v in values])


if __name__ == "__main__":
    main()
