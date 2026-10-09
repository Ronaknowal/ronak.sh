"""Full softmax curvature and its null direction; no full multiclass engine."""
import numpy as np


def softmax(scores):
    scores=np.asarray(scores,dtype=float)
    if scores.ndim!=1 or len(scores)<2 or not np.isfinite(scores).all():
        raise ValueError('at least two finite class scores required')
    scaled=np.exp(scores-scores.max())
    return scaled/scaled.sum()


def derivatives(scores, target):
    p=softmax(scores)
    if not isinstance(target,int) or not 0<=target<len(p):
        raise ValueError('target must be a class index')
    g=p.copy(); g[target]-=1
    return p,g,np.diag(p)-np.outer(p,p)


def cross_entropy(scores,target):
    scores=np.asarray(scores,dtype=float); maximum=scores.max()
    return float(maximum+np.log(np.exp(scores-maximum).sum())-scores[target])


def finite_hessian(scores,target,step=1e-5):
    scores=np.asarray(scores,dtype=float)
    return np.column_stack([(derivatives(scores+step*e,target)[1]-derivatives(scores-step*e,target)[1])/(2*step)
        for e in np.eye(len(scores))])


def main():
    for scores,target in [(np.zeros(3),1),(np.array([-.7,.3,1.2]),2)]:
        p,g,H=derivatives(scores,target)
        print('scores / target:',scores.tolist(),target)
        print('p / g:',np.round(p,8).tolist(),np.round(g,8).tolist())
        print('full H:',np.round(H,8).tolist())
        print('finite-difference max error:',float(np.max(np.abs(H-finite_hessian(scores,target)))))
        print('common-shift probability difference:',float(np.max(np.abs(p-softmax(scores+7.3)))))
        print('H times ones:',np.round(H@np.ones(3),12).tolist())


if __name__=='__main__': main()
