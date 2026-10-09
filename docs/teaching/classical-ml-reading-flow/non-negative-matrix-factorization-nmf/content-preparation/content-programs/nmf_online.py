"""Bounded dense online nonnegative surrogate; never stores historical rows."""
from dataclasses import dataclass,asdict
import json,warnings
import numpy as np
from sklearn.decomposition import MiniBatchNMF
from nmf_arrays import (nonnegative_table,feature_ids,nonnegative_scalar,positive_integer,
                        require_finite,read_only,projected_gradient,stable_norm,reconstruction)
from nmf_coordinate import encode_coordinates


def _surrogate(h,a,b):
    """Historical-code quadratic, omitting its dictionary-independent constant."""
    with np.errstate(over='ignore',invalid='ignore'):
        value=float(np.sum(h*(a@h))/2-np.sum(b*h))
    return float(require_finite(value,'Online surrogate reduction'))


def _dictionary_coordinates(h,a,b,sweeps):
    """Internal generated-cache kernel: a=W.T@W, b=W.T@X, accumulated alike."""
    for _ in range(sweeps):
        for c in range(h.shape[0]):
            curvature=float(a[c,c])
            if curvature==0:
                if np.any(a[c]!=0) or np.any(a[:,c]!=0) or np.any(b[c]!=0):
                    raise ValueError('Flat dictionary coordinate has inconsistent statistics')
                continue  # Keep the unused dictionary row; every value is equally good.
            with np.errstate(over='ignore',invalid='ignore',divide='ignore'):
                slope=a[c]@h-b[c]
                proposal=h[c]-slope/curvature
            require_finite(slope,'Online dictionary slope')
            require_finite(proposal,'Online dictionary update')
            h[c]=np.maximum(0.,proposal)
    return h


@dataclass(frozen=True)
class OnlineDiagnostic:
    batches: int
    rows_seen: int
    batch_rows: int
    rho: float
    encoding_status: str
    encoding_iterations: int
    encoding_projected_gradient: float
    dictionary_sweeps: int
    surrogate_before_without_constant: float
    surrogate_after_without_constant: float
    dictionary_projected_gradient: float


@dataclass(frozen=True)
class OnlineState:
    h: np.ndarray
    a: np.ndarray
    b: np.ndarray
    features: tuple
    encoding_max_iter: int
    encoding_tol: float
    dictionary_sweeps: int
    diagnostic: OnlineDiagnostic | None


class OnlineNMF:
    def __init__(self,initial_h,*,features=None,encoding_max_iter=1000,
                 encoding_tol=1e-8,dictionary_sweeps=1):
        h=nonnegative_table(initial_h,require_rows=True)
        k,d=h.shape
        cap=positive_integer(encoding_max_iter,'encoding_max_iter')
        tol=nonnegative_scalar(encoding_tol,'encoding_tol')
        sweeps=positive_integer(dictionary_sweeps,'dictionary_sweeps')
        names=feature_ids(features,d)
        self._state=OnlineState(read_only(h),read_only(np.zeros((k,k))),read_only(np.zeros((k,d))),
                                names,cap,tol,sweeps,None)

    @property
    def components_(self):return self._state.h.copy()

    @property
    def statistics_(self):return self._state.a.copy(),self._state.b.copy()

    @property
    def diagnostic_(self):return self._state.diagnostic

    @property
    def feature_names_(self):return self._state.features

    def _query(self,values,features,state):
        if features is not None and feature_ids(features,state.h.shape[1])!=state.features:
            raise ValueError('Feature IDs/order differ from the online dictionary')
        return nonnegative_table(values,state.h.shape[1])

    def partial_fit(self,values,*,rho=1.0,features=None):
        state=self._state
        rho=nonnegative_scalar(rho,'rho')
        if rho>1:raise ValueError('rho must lie in [0,1]')
        x=self._query(values,features,state)
        if len(x)==0:
            return np.zeros((0,state.h.shape[0])),{'status':'empty-batch-no-op'}
        w,encoded=encode_coordinates(x,state.h,max_iter=state.encoding_max_iter,tol=state.encoding_tol)
        with np.errstate(over='ignore',invalid='ignore'):
            delta_a=w.T@w
            delta_b=w.T@x
            a=rho*state.a+delta_a
            b=rho*state.b+delta_b
        for matrix,name in [(delta_a,'Batch Gram'),(delta_b,'Batch cross'),(a,'Accumulated Gram'),(b,'Accumulated cross')]:
            require_finite(matrix,name)
        if np.any((np.diag(delta_a)==0)&np.any(w!=0,axis=0)):
            raise ValueError('Nonzero amounts lost their squared mass; rescale')
        h=state.h.copy()
        before=_surrogate(h,a,b)
        _dictionary_coordinates(h,a,b,state.dictionary_sweeps)
        after=_surrogate(h,a,b)
        with np.errstate(over='ignore',invalid='ignore'):
            gradient=a@h-b
        stationary=stable_norm(projected_gradient(h,gradient))
        old=state.diagnostic
        diagnostic=OnlineDiagnostic(1 if old is None else old.batches+1,
            len(x) if old is None else old.rows_seen+len(x),len(x),rho,
            encoded['status'],encoded['iterations'],encoded['projected_gradient'],
            state.dictionary_sweeps,before,after,stationary)
        candidate=OnlineState(read_only(h),read_only(a),read_only(b),state.features,
            state.encoding_max_iter,state.encoding_tol,state.dictionary_sweeps,diagnostic)
        self._state=candidate  # Sole publication point: every failure above conserves the old state.
        return w.copy(),asdict(diagnostic)

    def transform(self,values,*,features=None):
        state=self._state
        x=self._query(values,features,state)
        return encode_coordinates(x,state.h,max_iter=state.encoding_max_iter,tol=state.encoding_tol)

    def inverse_transform(self,amounts):
        state=self._state
        return reconstruction(nonnegative_table(amounts,state.h.shape[0]),state.h)


def ordinary_stream(batches,initial_h):
    """Public MiniBatchNMF is a distinct optimizer, not the same A/B recurrence."""
    model=MiniBatchNMF(n_components=2,init='custom',batch_size=1,beta_loss='frobenius',
        alpha_W=0,alpha_H=0,l1_ratio=0,forget_factor=1.,fresh_restarts=True,
        fresh_restarts_max_iter=1000,transform_max_iter=1000,tol=1e-8,
        max_no_improvement=None,max_iter=1000,random_state=23)
    records=[]
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        for index,batch in enumerate(batches):
            if index==0:model.partial_fit(batch,W=np.ones((len(batch),2)),H=initial_h.copy())
            else:model.partial_fit(batch)
            records.append({'steps':int(model.n_steps_),'dictionary':model.components_.tolist()})
        before=model.components_.copy()
        amounts=model.transform([[1.,2.,3.]])
        prediction=model.inverse_transform(amounts)
        if not np.array_equal(before,model.components_):raise RuntimeError('Query changed the ordinary dictionary')
    return {'steps':records,'n_components':int(model.n_components_),'query_amounts':amounts.tolist(),
            'query_prediction':prediction.tolist(),'warnings':[str(item.message) for item in caught]}


def main():
    initial_h=np.array([[1.,0.,1.],[0.,1.,1.]])
    batches=[np.array([[2.,1.,3.]]),np.array([[0.,2.,2.]])]
    scratch=OnlineNMF(initial_h,features=('band0','band1','band2'),encoding_max_iter=3000,encoding_tol=1e-10,dictionary_sweeps=2)
    records=[]
    for batch in batches:
        amounts,diagnostic=scratch.partial_fit(batch,features=('band0','band1','band2'))
        a,b=scratch.statistics_
        records.append({'arrival_amounts':amounts.tolist(),'dictionary':scratch.components_.tolist(),
                        'A':a.tolist(),'B':b.tolist(),'diagnostic':diagnostic})
    query,status=scratch.transform([[1.,2.,3.]],features=('band0','band1','band2'))
    print(json.dumps({'scope':'New two-arrival streaming demonstration, no historical campaign replay',
        'scratch':{'steps':records,'query_amounts':query.tolist(),'query_diagnostic':status,
                   'query_prediction':scratch.inverse_transform(query).tolist()},
        'ordinary_distinct_route':ordinary_stream(batches,initial_h)},indent=2,allow_nan=False))


if __name__=='__main__':main()
