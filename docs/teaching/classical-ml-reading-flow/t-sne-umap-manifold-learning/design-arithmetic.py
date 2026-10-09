"""New design arithmetic only: no scientific imports, fitting or historical main."""
import math,json
from pathlib import Path
close=lambda a,b: math.isclose(a,b,rel_tol=1e-12,abs_tol=1e-12)
def gaussian(sigma):
    weights=[math.exp(-d*d/(2*sigma*sigma)) for d in (1,2,3)]
    p=[w/sum(weights) for w in weights]
    return dict(sigma=sigma,probabilities=p,perplexity=math.exp(-sum(v*math.log(v) for v in p)))
rows=[gaussian(s) for s in (.5,1,2)]
def pair_z(y):
    return sum(1/(1+(a-b)**2) for i,a in enumerate(y) for j,b in enumerate(y) if i!=j)
z0,z1=pair_z([0,1,3]),pair_z([0,1,2])
assert close(z0,1.6) and close(z1,2.4)
assert close(.5/z0,5/16) and close(.5/z1,5/24)
u0,u1=.2+.6-.2*.6,.2+.9-.2*.9
assert close(u0,.68) and close(u1,.92)
radius=(1+0.5*9)/1.5
assert close(radius,11/3) and close(math.log(4*radius)-math.log(radius),math.log(4))
d2=[[0,1,9],[1,0,1],[9,1,0]]
means=[sum(r)/3 for r in d2];grand=sum(means)/3
b=[[-.5*(d2[i][j]-means[i]-means[j]+grand) for j in range(3)] for i in range(3)]
for vector,value in [([1,0,-1],4.5),([1,-2,1],-5/6),([1,1,1],0)]:
    assert all(close(sum(b[i][j]*vector[j] for j in range(3)),value*vector[i]) for i in range(3))
assert close((4/7)*(-2)+(3/7)*12,4)
assert close((-1/3)*(-2)+(4/3)*7,10)
assert close((1-0)**2+(3-1)**2,5)
assert 8*100000**2==80000000000
result={"scope":"new elementary design arithmetic; no original fit/main/checker replay", "gaussianRows":rows,
        "normalization":{"orderedZ":[z0,z1],"qAB":[.5/z0,.5/z1]},
        "fuzzyChanged":{"union":[u0,u1],"pairOptima":[math.sqrt(1/u0-1),math.sqrt(1/u1-1)]},
        "densityRadiusSquared":radius,"doubledDistanceLogShift":math.log(4),
        "nonEuclideanTriangle":{"gram":b,"eigenvalues":[4.5,-5/6,0]},
        "newOutputsAreNot":"learned coordinates, a stochastic experiment, current-page/native certification or a new output of an old program"}
with (Path(__file__).parent/'design-arithmetic.json').open('x',encoding='utf-8',newline='\n') as f:
    f.write(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
