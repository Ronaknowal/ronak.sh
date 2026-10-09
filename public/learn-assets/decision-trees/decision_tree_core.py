import math
import random
import numpy as np

class BinaryTree:
    """Numeric binary CART teaching implementation; no weights/missing/categorical support."""
    def __init__(self,max_depth=4,min_samples_leaf=1,max_features=None,seed=0,allow_zero=True):
        if max_depth is not None and (not isinstance(max_depth,int) or max_depth<0):
            raise ValueError('max_depth must be None or nonnegative integer')
        if not isinstance(min_samples_leaf,int) or min_samples_leaf<1:
            raise ValueError('minimum leaf size must be positive')
        self.max_depth=max_depth
        self.minimum=min_samples_leaf
        self.max_features=max_features
        self.seed=seed
        self.allow_zero=allow_zero

    def fit(self,X,y):
        X=np.asarray(X,dtype=float); y=np.asarray(y)
        if X.ndim!=2 or not len(X) or X.shape[1]<1 or y.shape!=(len(X),):
            raise ValueError('nonempty matrix and one label per row required')
        if not np.isfinite(X).all() or not np.isin(y,[0,1]).all():
            raise ValueError('finite numeric inputs and binary labels required')
        self.features=X.shape[1]
        count=self.features if self.max_features is None else self.max_features
        if not isinstance(count,int) or not 1<=count<=self.features:
            raise ValueError('max_features must be an integer in 1..d or None')
        rng=random.Random(self.seed)
        def gini(positives,total):
            if not total: return 0.
            p=positives/total
            return 2*p*(1-p)
        def grow(indices,depth):
            positives=int(y[indices].sum()); total=len(indices)
            node={'probability':positives/total,'count':total}
            if positives in [0,total] or total<2*self.minimum or (self.max_depth is not None and depth>=self.max_depth):
                return node
            best=None
            for feature in sorted(rng.sample(range(self.features),count)):
                ordered=sorted(indices,key=lambda index:X[index,feature])
                left_positive=0
                for position in range(total-1):
                    left_positive+=int(y[ordered[position]])
                    left_size=position+1; right_size=total-left_size
                    low=X[ordered[position],feature]; high=X[ordered[position+1],feature]
                    if low==high or min(left_size,right_size)<self.minimum: continue
                    gain=gini(positives,total)-(left_size*gini(left_positive,left_size)+right_size*gini(positives-left_positive,right_size))/total
                    if best is None or gain>best[0]+1e-12:
                        midpoint=float(low/2+high/2)
                        threshold=midpoint if low<=midpoint<high else float(low)
                        best=(gain,feature,threshold,ordered[:left_size],ordered[left_size:])
            if best is None or (not self.allow_zero and best[0]<=1e-12): return node
            gain,feature,threshold,left,right=best
            return dict(node,feature=feature,threshold=threshold,gain=gain,
                left=grow(left,depth+1),right=grow(right,depth+1))
        self.root=grow(list(range(len(X))),0)
        return self

    def predict_proba(self,X):
        X=np.asarray(X,dtype=float)
        if X.ndim!=2 or X.shape[1]!=self.features or not np.isfinite(X).all():
            raise ValueError('prediction matrix must use the fitted finite feature schema')
        probabilities=[]
        for row in X:
            node=self.root
            while 'left' in node:
                node=node['left'] if row[node['feature']]<=node['threshold'] else node['right']
            probabilities.append([1-node['probability'],node['probability']])
        return np.asarray(probabilities).reshape(-1,2)

    def predict(self,X):
        return np.argmax(self.predict_proba(X),axis=1)  # lowest label wins a tie

