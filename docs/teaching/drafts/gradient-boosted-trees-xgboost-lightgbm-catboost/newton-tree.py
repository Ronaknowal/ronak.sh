"""Greedy exact-candidate Newton trees, not a reimplementation of XGBoost.

Rows carry first derivatives g and nonnegative second derivatives h. Leaves
minimize the regularized quadratic surrogate. NaN is a learned missing route;
infinity is rejected. Distinct sorted values supply legal numerical boundaries.
"""
from dataclasses import dataclass
import numpy as np
from scipy.special import expit


CURVATURE_GUARD = 1e-10


def soft(value, alpha):
    return float(np.sign(value) * max(abs(value)-alpha, 0.))


def leaf_terms(G, H, l2=1., l1=0.):
    denominator = H+l2
    if not np.isfinite([G, H, denominator]).all() or denominator <= CURVATURE_GUARD:
        raise ValueError('H + lambda must exceed the numerical curvature guard 1e-10')
    softened = soft(G, l1)
    return -softened/denominator, .5*softened**2/denominator


@dataclass
class Node:
    weight: float
    rows: int
    G: float
    H: float
    feature: int | None = None
    threshold: float | None = None
    missing_left: bool = True
    gain: float = 0.
    left: object = None
    right: object = None


class NewtonTree:
    def __init__(self, depth=2, minimum_leaf=1, minimum_hessian=0.,
                 l2=1., l1=0., gamma=0.):
        if not isinstance(depth, int) or depth < 0 or not isinstance(minimum_leaf, int) or minimum_leaf < 1:
            raise ValueError('depth and minimum_leaf must be valid integer bounds')
        if not np.isfinite([minimum_hessian,l2,l1,gamma]).all() or min(minimum_hessian,l2,l1,gamma)<0:
            raise ValueError('curvature bound and penalties must be finite and nonnegative')
        self.depth, self.minimum_leaf = depth, minimum_leaf
        self.minimum_hessian, self.l2, self.l1, self.gamma = minimum_hessian,l2,l1,gamma

    def fit(self, X, g, h):
        X=np.asarray(X,dtype=float); g=np.asarray(g,dtype=float); h=np.asarray(h,dtype=float)
        if X.ndim!=2 or not len(X) or not X.shape[1] or np.isinf(X).any():
            raise ValueError('X must be a nonempty matrix with finite values or NaN')
        if g.shape!=(len(X),) or h.shape!=g.shape or not np.isfinite(g).all() or not np.isfinite(h).all() or (h<0).any():
            raise ValueError('g and nonnegative h must be finite matching row vectors')
        def grow(ids, depth):
            G,H=float(g[ids].sum()),float(h[ids].sum())
            weight,parent_score=leaf_terms(G,H,self.l2,self.l1)
            node=Node(weight,len(ids),G,H)
            if depth==self.depth or len(ids)<2*self.minimum_leaf:
                return node
            best=None; best_gain=0.
            for feature in range(X.shape[1]):
                values=X[ids,feature]; missing=np.isnan(values)
                ordered=ids[~missing][np.argsort(values[~missing],kind='stable')]
                if len(ordered)<2:
                    continue
                ordered_values=X[ordered,feature]
                prefix_g=np.cumsum(g[ordered]); prefix_h=np.cumsum(h[ordered])
                missing_ids=ids[missing]
                missing_G=float(g[missing_ids].sum()); missing_H=float(h[missing_ids].sum())
                for position in np.flatnonzero(ordered_values[:-1]<ordered_values[1:]):
                    lower,upper=ordered_values[position:position+2]
                    threshold=lower/2+upper/2
                    if not lower<=threshold<upper:
                        threshold=lower
                    for missing_left in [True,False]:
                        nleft=int(position+1)+(len(missing_ids) if missing_left else 0)
                        nright=len(ids)-nleft
                        GL=float(prefix_g[position])+(missing_G if missing_left else 0.)
                        HL=float(prefix_h[position])+(missing_H if missing_left else 0.)
                        GR,HR=G-GL,H-HL
                        if min(nleft,nright)<self.minimum_leaf or min(HL,HR)<self.minimum_hessian:
                            continue
                        if min(HL+self.l2,HR+self.l2)<=CURVATURE_GUARD:
                            continue
                        _,left_score=leaf_terms(GL,HL,self.l2,self.l1)
                        _,right_score=leaf_terms(GR,HR,self.l2,self.l1)
                        gain=left_score+right_score-parent_score-self.gamma
                        # Feature order, boundary order, then missing-left break exact ties.
                        if gain>best_gain:
                            best_gain=gain; best=(feature,float(threshold),missing_left)
            if best is not None:
                feature,threshold,missing_left=best
                values=X[ids,feature]
                goes_left=(values<=threshold)|(np.isnan(values)&missing_left)
                node.feature,node.threshold,node.missing_left,node.gain=feature,threshold,missing_left,best_gain
                node.left=grow(ids[goes_left],depth+1)
                node.right=grow(ids[~goes_left],depth+1)
            return node
        root=grow(np.arange(len(X)),0)
        self.root,self.features=root,X.shape[1]
        return self

    def predict(self, X):
        if not hasattr(self,'root'):
            raise ValueError('fit before prediction')
        X=np.asarray(X,dtype=float)
        if X.ndim!=2 or X.shape[1]!=self.features or np.isinf(X).any():
            raise ValueError('prediction columns must match the fitted schema')
        answer=np.empty(len(X))
        for i,row in enumerate(X):
            node=self.root
            while node.feature is not None:
                value=row[node.feature]
                left=node.missing_left if np.isnan(value) else value<=node.threshold
                node=node.left if left else node.right
            answer[i]=node.weight
        return answer


class NewtonEnsemble:
    def __init__(self, rounds=3, rate=.3, loss='square', **tree_options):
        if not isinstance(rounds,int) or rounds<0 or not np.isfinite(rate) or rate<0 or loss not in ['square','binary']:
            raise ValueError('valid rounds, nonnegative rate, and square/binary loss required')
        self.rounds,self.rate,self.loss,self.tree_options=rounds,rate,loss,tree_options

    def fit(self, X, y, sample_weight=None):
        X=np.asarray(X,dtype=float); y=np.asarray(y,dtype=float)
        if X.ndim!=2 or not len(X) or not X.shape[1] or np.isinf(X).any() or y.shape!=(len(X),) or not np.isfinite(y).all():
            raise ValueError('matching nonempty X and finite y required')
        weights=np.ones(len(y)) if sample_weight is None else np.asarray(sample_weight,dtype=float)
        if weights.shape!=y.shape or not np.isfinite(weights).all() or (weights<0).any() or weights.sum()<=0:
            raise ValueError('finite nonnegative weights with positive mass required')
        mean=float(np.average(y,weights=weights))
        if self.loss=='binary':
            if not np.isin(y,[0.,1.]).all():
                raise ValueError('binary targets must be 0 or 1')
            # Finite initialization for single-class data is an explicit convention.
            p=float(np.clip(mean,1e-6,1-1e-6)); intercept=float(np.log(p)-np.log1p(-p))
        else:
            intercept=mean
        score=np.full(len(y),intercept); trees=[]; history=[]
        def objective():
            losses=.5*(score-y)**2 if self.loss=='square' else np.logaddexp(0.,score)-y*score
            return float(np.average(losses,weights=weights))
        history.append(objective())
        for _ in range(self.rounds):
            if self.loss=='square':
                g,h=score-y,np.ones(len(y))
            else:
                p=expit(score); g,h=p-y,p*(1-p)
            tree=NewtonTree(**self.tree_options).fit(X,weights*g,weights*h)
            score+=self.rate*tree.predict(X); trees.append(tree); history.append(objective())
        self.intercept,self.trees,self.history,self.features=intercept,trees,history,X.shape[1]
        return self

    def predict_raw(self, X, prefix=None):
        if not hasattr(self,'trees'):
            raise ValueError('fit before prediction')
        X=np.asarray(X,dtype=float)
        if X.ndim!=2 or X.shape[1]!=self.features or np.isinf(X).any():
            raise ValueError('matching finite-or-NaN prediction matrix required')
        prefix=len(self.trees) if prefix is None else prefix
        if not isinstance(prefix,int) or not 0<=prefix<=len(self.trees):
            raise ValueError('prefix must be an integer between 0 and the saved tree count')
        score=np.full(len(X),self.intercept)
        for tree in self.trees[:prefix]:
            score+=self.rate*tree.predict(X)
        return score

    def predict_probability(self, X, prefix=None):
        if self.loss!='binary':
            raise ValueError('probabilities require binary loss')
        return expit(self.predict_raw(X,prefix))


def main():
    import xgboost as xgb
    X=np.arange(1.,7.).reshape(-1,1); y=np.array([2.,2.,3.,7.,8.,8.])
    scratch=NewtonEnsemble(rounds=1,rate=.3,depth=1,l2=1.).fit(X,y)
    native=xgb.XGBRegressor(n_estimators=1,learning_rate=.3,max_depth=1,
        objective='reg:squarederror',base_score=5.,reg_lambda=1.,reg_alpha=0.,
        gamma=0.,min_child_weight=0.,tree_method='exact',subsample=1.,
        colsample_bytree=1.,n_jobs=1,random_state=73).fit(X,y)
    print('scratch raw-margin predictions:',np.round(scratch.predict_raw(X),6).tolist())
    print('native raw-margin predictions:',np.round(native.predict(X,output_margin=True),6).tolist())
    print('maximum native difference:',float(np.max(np.abs(scratch.predict_raw(X)-native.predict(X,output_margin=True)))))
    root=scratch.trees[0].root
    print('cut / left G,H,w / right G,H,w / net gain:',root.threshold,
        (root.left.G,root.left.H,root.left.weight),(root.right.G,root.right.H,root.right.weight),root.gain)
    binary=NewtonEnsemble(rounds=3,rate=.3,loss='binary',depth=1,l2=1.).fit(X,[0,0,0,1,1,1])
    print('binary mean losses at prefixes:',np.round(binary.history,6).tolist())
    print('binary probabilities:',np.round(binary.predict_probability(X),6).tolist())


if __name__=='__main__':
    main()
