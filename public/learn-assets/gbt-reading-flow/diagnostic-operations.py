"""Same saved predictor, different questions: counts, gain, shuffle and PDP.

The two constructed trees are supplied, not newly learned from held-out rows.
The correlated twin feature makes unsupported PDP substitutions visible.
"""
import numpy as np
from sklearn.base import BaseEstimator,RegressorMixin
from sklearn.inspection import permutation_importance,partial_dependence


class SavedPredictor(RegressorMixin,BaseEstimator):
    def __init__(self):
        self.n_features_in_=2
        self.intercept=5.; self.rate=.5
        self.trees=[{'feature':0,'cut':3.5,'left':-8/3,'right':8/3,'gain':64/3},
                    {'feature':1,'cut':3.5,'left':-4/3,'right':4/3,'gain':16/3}]

    def fit(self,X,y):
        raise ValueError('this example supplies a saved predictor; fitting is not its task')

    def predict(self,X):
        X=np.asarray(X,dtype=float)
        if X.ndim!=2 or X.shape[1]!=2 or not np.isfinite(X).all():
            raise ValueError('prediction needs two finite feature columns')
        score=np.full(len(X),self.intercept)
        for tree in self.trees:
            response=np.where(X[:,tree['feature']]<=tree['cut'],tree['left'],tree['right'])
            score+=self.rate*response
        return score


def split_statistics(model):
    counts=np.zeros(model.n_features_in_,dtype=int); gains=np.zeros(model.n_features_in_)
    for tree in model.trees:
        counts[tree['feature']]+=1; gains[tree['feature']]+=tree['gain']
    return counts,gains


def mse(y,prediction): return float(np.mean((np.asarray(y)-prediction)**2))


def shuffle_effect(model,X,y,feature,order):
    changed=np.asarray(X,dtype=float).copy()
    changed[:,feature]=changed[np.asarray(order),feature]
    before=model.predict(X); after=model.predict(changed)
    return changed,after,mse(y,after)-mse(y,before)


def pdp(model,X,feature,grid):
    # One reusable background copy, not an n-background x n-grid tensor.
    changed=np.asarray(X,dtype=float).copy(); averages=[]; ice=[]
    for value in grid:
        changed[:,feature]=value
        prediction=model.predict(changed)
        averages.append(float(prediction.mean())); ice.append(prediction)
    return np.asarray(averages),np.column_stack(ice)


def weighted_probability(p,positive_weight):
    if not np.isfinite([p,positive_weight]).all() or not 0<=p<=1 or positive_weight<=0:
        raise ValueError('a probability and finite positive class weight required')
    return positive_weight*p/(positive_weight*p+1-p)


def main():
    model=SavedPredictor(); x=np.arange(1.,7.); X=np.column_stack([x,x]); y=np.array([2.,2.,3.,7.,8.,8.])
    counts,gains=split_statistics(model)
    print('split counts / gains:',counts.tolist(),gains.tolist())
    print('saved predictions / baseline MSE:',model.predict(X).tolist(),mse(y,model.predict(X)))
    # Match sklearn1.9.1's declared one-repeat random-state convention.
    seed=np.random.RandomState(73).randint(np.iinfo(np.int32).max+1)
    order=np.arange(len(X)); np.random.RandomState(seed).shuffle(order)
    effects=[]
    for feature in range(2):
        changed,after,effect=shuffle_effect(model,X,y,feature,order); effects.append(effect)
        print('feature / shuffled row IDs / changed predictions / MSE increase:',feature,order.tolist(),after.tolist(),effect)
    ordinary=permutation_importance(model,X,y,scoring='neg_mean_squared_error',n_repeats=1,random_state=73,n_jobs=1)
    print('ordinary one-repeat effects:',ordinary.importances_mean.tolist())
    print('shuffle comparison max difference:',float(np.max(np.abs(effects-ordinary.importances_mean))))
    grid=np.array([2.,3.5,4.5,7.]); averages,ice=pdp(model,X,0,grid)
    native=partial_dependence(model,X,[0],method='brute',custom_values={0:grid})
    print('PDP grid / averages:',grid.tolist(),averages.tolist())
    print('ICE rows:',ice.tolist())
    print('ordinary PDP max difference:',float(np.max(np.abs(averages-native.average[0]))))
    print('weighted p=.1 with a=9 / a=1:',weighted_probability(.1,9.),weighted_probability(.1,1.))


if __name__=='__main__': main()
