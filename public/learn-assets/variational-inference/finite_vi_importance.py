"""Exact finite importance arithmetic, not a sampled importance estimate.

Python3 and NumPy. p and q are normalized; comparisons require q_i>0
wherever p_i>0. Raw-IS variance/n is exact for independent samples;
SN coefficient/n is asymptotic and does not assert finite-n unbiasedness.
"""
from fractions import Fraction as F
import numpy as np

target = [F(1,5), F(1,2), F(3,10)]
proposals = {
    "uniform": [F(1,3)]*3,
    "exact": target.copy(),
    "skewed": [F(1,10), F(4,5), F(1,10)],
    "missingB": [F(2,5), F(0), F(3,5)],
}
functions = {"indicatorA":[F(1),F(0),F(0)],
             "indicatorB":[F(0),F(1),F(0)],
             "state-value":[F(0),F(1),F(2)]}
assert sum(target) == 1
for name, proposal in proposals.items():
    assert sum(proposal) == 1 and all(v >= 0 for v in proposal)
    missing = [state for state,p,q in zip("ABC",target,proposal) if p > 0 and q == 0]
    if missing:
        print(name, "invalid target support", missing)
        continue
    weights = [p/q for p,q in zip(target,proposal)]
    ratio_second = sum(p*p/q for p,q in zip(target,proposal))
    assert sum(q*w for q,w in zip(proposal,weights)) == 1
    print(name, "q", [str(v) for v in proposal], "ratios", [str(v) for v in weights],
          "ratio second moment", str(ratio_second))
    for function_name, values in functions.items():
        I = sum(p*f for p,f in zip(target,values))
        enumeration = sum(q*w*f for q,w,f in zip(proposal,weights,values))
        raw_variance = sum(p*p*f*f/q for p,q,f in zip(target,proposal,values))-I*I
        sn_coefficient = sum(p*p*(f-I)**2/q for p,q,f in zip(target,proposal,values))
        assert enumeration == I and raw_variance >= 0 and sn_coefficient >= 0
        p,q,f = map(lambda a:np.array([float(v) for v in a]),(target,proposal,values))
        assert np.allclose([p@f,np.sum(p*p*f*f/q)-(p@f)**2,np.sum(p*p*(f-p@f)**2/q)],
                           [float(I),float(raw_variance),float(sn_coefficient)])
        print(function_name, "exact I", str(I), "raw-IS single-draw variance", str(raw_variance),
              "SN asymptotic coefficient", str(sn_coefficient))
        if name == "uniform" and function_name == "indicatorB":
            assert (I,ratio_second,raw_variance,sn_coefficient) == (F(1,2),F(57,50),F(1,2),F(57,200))
