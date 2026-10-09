## 17. Update as rows arrive

**What if we cannot keep every training row?** Remember the products needed for a dictionary update, rather than pretending an old encoding is a fresh one. [Change application assumptions explicitly](#16-change-application-assumptions-explicitly) kept vocabulary or endmembers fixed while queries arrived. Here new **training** rows may change the dictionary. We return to `H0=[[1,0,1],[0,1,1]]` and three named numerical bands so the memory update can be followed by hand; this is a constructed stream, not an additional digit or physical experiment.

**What information from one row helps update the dictionary?** Its amounts tell us how much of the observed signal to credit to each component.

<!-- figure:D61 -->

The first arriving row is `[2,1,3]`. Holding `H0` fixed gives its exact amount row `[2,1]`. Take the outer product of these amounts with themselves: multiply each amount by each amount to obtain `A=[[4,2],[2,1]]`. Its axes are component by component. Take the outer product of the amount column with the observation row: the first row is twice `[2,1,3]`, the second once, giving `B=[[4,2,6],[2,1,3]]`. Its axes are component by feature. In particular `A01=2*1=2` and `B02=2*3=6`; the columns of `B` remain the same named bands as the dictionary.

The next row `[0,2,2]` has exact amounts `[0,2]` under `H0`. Its added Gram product is `deltaA=[[0,0],[0,4]]` and its added amount-observation product is `deltaB=[[0,0,0],[0,4,4]]`. The first component receives no credit for this row; the second receives twice its measured bands. These are products of **amounts computed at arrival**, not labels of physical sources.

For a batch of `b` arriving rows, write its observation table as `Xb` of shape `b×d` and amounts as `Wb` of shape `b×k`. The two compact products are

\[
\Delta A=W_b^TW_b\quad(k\times k),\qquad
\Delta B=W_b^TX_b\quad(k\times d).
\]

Why are those enough? Expand the sum of half-squared residuals while the historical amounts are held fixed. The term containing the dictionary twice is `0.5 sum_c,l A_cl (h_c·h_l)`; the term containing it once is `-sum_c,j B_cj H_cj`. The remaining `0.5 sum_i ||x_i||²` does not depend on `H` and cannot change its optimum. In matrix notation the retained part is

\[
Q(H)=\tfrac12\operatorname{tr}(H^TAH)-\operatorname{tr}(H^TB),
\qquad \nabla_H Q=AH-B.
\]

The **trace** adds the diagonal cells of a square matrix; here it is compact notation for those ordinary scalar sums, not a new measurement. `A` records component co-activity, `B` records component-observation association, and the original rows are no longer necessary **for this fixed-code quadratic**. A displayed `Q=-7` is possible because we omitted the positive, dictionary-independent constant. It is not a negative squared reconstruction error.

**How much should the past count?** Multiply old statistics before adding this batch's products.

<!-- figure:D62 -->

The old cells remain visible as one contribution and the incoming cells as another. At `rho=1`, every old product is retained. At `rho=0.5`, the first row's influence is halved while the incoming row is fully added, producing `A=[[2,1],[1,4.5]]` and `B=[[2,1,3],[1,4.5,5.5]]`. At `rho=0`, only the incoming products remain: `A=[[0,0],[0,4]]`, `B=[[0,0,0],[0,4,4]]`. The dictionary is not reset by that multiplication; an unused row has no evidence to move it.

The recurrence is

\[
A\leftarrow\rho A+W_b^TW_b,\qquad
B\leftarrow\rho B+W_b^TX_b,\qquad 0\le\rho\le1.
\]

In this implementation `rho` acts **per nonempty batch**, not per observation. An older batch's weight is the product of the later retention factors. With constant `rho<1`, batches several updates ago decay exponentially in the number of nonempty updates. A batch of 100 rows contributes 100 outer products, while a batch of one contributes one; changing batch sizes changes weighting unless you deliberately choose another normalized convention. An empty batch is an actual no-op, even when `rho=0`, so an accidental empty chunk cannot erase accumulated evidence.

Smaller retention can adapt to a changing distribution but loses information about earlier regimes. Keeping all past products gives stable historical weighting but may adapt slowly. Those are decisions about the task and time scale, not automatic improvements. The live figure changes only `rho` for the two named outer products, so its meaning stays visible.

**How does the compact quadratic move one dictionary row?** Reuse the cyclic coordinate reasoning from [Change one coordinate, then reuse the arithmetic](#5-change-one-coordinate-then-reuse-the-arithmetic), now with `A/B` as caches. Hold all other dictionary rows fixed. For feature `j`, the slope is `(AH-B)_cj`, and the curvature for that coordinate is `A_cc`. When this curvature is positive, the nonnegative scalar minimum is

\[
H_{cj}\leftarrow\max\left(0,H_{cj}-\frac{(AH-B)_{cj}}{A_{cc}}\right).
\]

All features in row `c` can move together because the fixed-code squared objective separates over features. Row `c+1` must use the **new** earlier dictionary rows: this is the same fresh-versus-stale distinction we traced for amounts. `A` is positive semidefinite because it is a nonnegative weighted sum of Gram products. Thus the dictionary block is a convex quadratic over nonnegative entries; the joint changing-code problem remains nonconvex. Finite sweeps improve this surrogate but need not finish its optimization.

If `A_cc=0`, generated nonnegative statistics also have that row/column of `A` and row of `B` zero: the component has never received retained amount. The objective is flat in its dictionary row. We explicitly keep that unused row, instead of dividing by zero or erasing its starting pattern. If a supplied/generated cache nevertheless combines zero curvature with a nonzero cross term, the kernel refuses that inconsistent state. The public class only constructs these caches from validated batches; the underscored kernel is not an arbitrary-matrix quadratic-programming interface.

**Is this the same as refitting every previous row?** No: old amounts are useful memory, but they become stale when the dictionary moves.

<!-- figure:D63 -->

The two observations remain `[2,1,3]` and `[0,2,2]`, and their stored amounts remain `[2,1]` and `[0,2]`. Initially the dictionary is `H0`. Move just its first-band entry in component 0 from `h=1` to `h=2`, keeping `H=[[h,0,1],[0,1,1]]`. The stored first amount row now predicts `[2h,1,3]`; at `h=2`, this is `[4,1,3]` and its half-loss is 2. The second row remains exact with `[0,2]`.

Fresh fixed-dictionary encoding is a different calculation. For the first row, the two normal equations are `(h²+1)w0+w1=2h+3` and `w0+2w1=4`. Solving them gives

\[
w_0=\frac{4h+2}{2h^2+1},\qquad
w_1=\frac{4h^2-2h+1}{2h^2+1}.
\]

Both amounts are positive throughout this figure's `h∈[1,2]`, so this unconstrained stationary solution is also the NNLS optimum there. At `h=2`, it is `[10/9,13/9]`, predicts `[20/9,13/9,23/9]` and has half-loss `2/9`, smaller than the stored-code loss 2. Its new outer products would change `A/B`. The displayed old statistics do not magically become those new products when the control moves.

That is the meaning of a **surrogate** here: an easier remembered objective formed with previously computed codes. For each old row, minimizing over a new code cannot be worse than evaluating its old code, so the fixed-code reconstruction objective is an upper bound on the freshly minimized one for the same weighted observations. A stream algorithm uses that structure without retaining every row to re-encode it. Its finite iterations, retention choice and numerical stopping do not prove an asymptotic theorem. [Mairal and colleagues' original online formulation](https://jmlr.org/papers/volume11/mairal10a/mairal10a.pdf) develops accumulated statistics, dictionary updates and nonnegative variants under stated assumptions; our bounded code is not their full sparse-coding algorithm or a transfer of its convergence guarantee.

**What does a reliable streaming interface retain?** One coherent dictionary/statistic snapshot and enough diagnostics to know what happened. `OnlineNMF` starts from an explicitly supplied dictionary and zero statistics. A nonempty `partial_fit` first encodes the incoming batch with that held dictionary, computes local candidate `A/B`, makes a writable candidate dictionary, performs the configured sweeps, checks finite objectives/gradients, and only then publishes all of them together. Invalid features, retention, shapes or arithmetic preserve the old snapshot. It returns the amounts **used at arrival**; these are not promised to be optimal under the updated dictionary. `transform` solves new amounts with the current dictionary without changing state; `inverse_transform` uses the fitted rank and feature dimension. Returned public arrays are copies.

The snapshot contains only `H` (`k×d`), `A` (`k×k`), `B` (`k×d`), feature order, fixed encoding/sweep settings and the latest scalar diagnostic. Its `rows_seen` is a count, not a retained observation table or an effective sample-weight sum. History is not hidden in a diagnostics list. The latest report separates incoming-encoding status/iterations/projected gradient from dictionary sweeps, before/after surrogate and dictionary projected gradient. An encoding cap is reported rather than called exact; its returned finite approximate amounts define the products that were actually accumulated. An application requiring tighter encoding can increase the cap or reject cap-status arrivals before using this interface.

**What does this save, and what work remains?** Fixed-H batch encoding constructs `HH.T` in `O(dk²)`, `XbH.T` in `O(bdk)`, then uses `q` coordinate sweeps in `O(qbk²)`. Building `Wb.TWb` and `Wb.TXb` costs `O(bk²+bdk)`. Each dictionary sweep and its gradient diagnostic cost `O(dk²)`. These products operate on contracted axes; no `b×d×k` contribution tensor is allocated. Retained memory is `O(k²+kd)` regardless of the number of past rows. Batch input/amounts/cross work require `O(bd+bk)` plus the `k²/kd` caches and deliberate snapshot copies. Increasing rank raises both Gram memory and quadratic-coordinate work; streaming is not free merely because historical rows are discarded.

**How is ordinary MiniBatchNMF used?** The complete new program below includes both routes on the same two newly declared arrivals. The public estimator is configured explicitly with two components, custom initial factors, Frobenius loss, no penalties, batch size 1, retention parameter `forget_factor=1`, fresh code solves capped at 1,000, transform cap 1,000 and tolerance `1e-8`. The first `partial_fit` receives the initial `W/H`; the second updates from its fitted `components_`. `n_steps_` counts the two calls, and `n_components_` records fitted rank. A final `transform` and `inverse_transform` encode/reconstruct a new query without changing the dictionary. The [public MiniBatchNMF API](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.MiniBatchNMF.html) documents that incremental lifecycle.

The library uses its own multiplicative accumulators and update rules. Its `forget_factor` is **not algebraically equated** with this class's `rho` per batch, and its batch-size scaling/fresh-restart work differ. Its whole-data `fit` can stop using parameter change and smoothed-cost controls; two explicit `partial_fit` calls are not a claim that those whole-fit criteria were satisfied. We set parameters rather than inheriting defaults, retain warnings, and compare coherent state/use of the interface rather than arbitrary identical trajectories.

Here is the complete `nmf_online.py`, using the already taught N1 validation/reductions and N2 fixed-H encoder. Its underscored cache kernels are used only behind that validating class. Put it beside those supplied siblings and `centered_pca.py`.


```python
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
```


This is the full output of the new two-arrival demonstration. The hand figures use exact amounts; the numerical encoder stops at a tolerance and consequently produces tiny nonzero cells instead of exact symbolic zeros. Both are labelled roles, not contradictory fits. The first scratch arrival used 17 encoding iterations, and the second used 17; the two final dictionary sweeps were a configured cap, not a declaration of whole joint stationarity. The ordinary route recorded two incremental steps and no warnings. Its final query prediction is approximately `[1.000260,2.000260,2.999740]`, whereas the scratch prediction is `[1.000000,2.000000,3.000000]` to six decimals; this tiny constructed stream does not establish a general ranking of optimizers.


```json
{
  "scope": "New two-arrival streaming demonstration, no historical campaign replay",
  "scratch": {
    "steps": [
      {
        "arrival_amounts": [
          [
            2.0000000001164153,
            0.9999999999417923
          ]
        ],
        "dictionary": [
          [
            0.9999999999417923,
            2.9103830453345572e-11,
            0.9999999999708962
          ],
          [
            0.0,
            1.0,
            1.0
          ]
        ],
        "A": [
          [
            4.000000000465661,
            2.0
          ],
          [
            2.0,
            0.9999999998835847
          ]
        ],
        "B": [
          [
            4.000000000232831,
            2.0000000001164153,
            6.000000000349246
          ],
          [
            1.9999999998835847,
            0.9999999999417923,
            2.999999999825377
          ]
        ],
        "diagnostic": {
          "batches": 1,
          "rows_seen": 1,
          "batch_rows": 1,
          "rho": 1.0,
          "encoding_status": "stationary-tolerance",
          "encoding_iterations": 17,
          "encoding_projected_gradient": 1.7462298274040222e-10,
          "dictionary_sweeps": 2,
          "surrogate_before_without_constant": -7.0,
          "surrogate_after_without_constant": -7.0,
          "dictionary_projected_gradient": 0.0
        }
      },
      {
        "arrival_amounts": [
          [
            2.3283086571880334e-10,
            1.9999999998835845
          ]
        ],
        "dictionary": [
          [
            0.9999999999417923,
            5.820677272827155e-12,
            0.9999999999941793
          ],
          [
            0.0,
            1.0000000000558795,
            0.9999999999441208
          ]
        ],
        "A": [
          [
            4.000000000465661,
            2.0000000004656617
          ],
          [
            2.0000000004656617,
            4.9999999994179225
          ]
        ],
        "B": [
          [
            4.000000000232831,
            2.000000000582077,
            6.000000000814908
          ],
          [
            1.9999999998835847,
            4.999999999708962,
            6.999999999592546
          ]
        ],
        "diagnostic": {
          "batches": 2,
          "rows_seen": 2,
          "batch_rows": 1,
          "rho": 1.0,
          "encoding_status": "stationary-tolerance",
          "encoding_iterations": 17,
          "encoding_projected_gradient": 3.4924596548080444e-10,
          "dictionary_sweeps": 2,
          "surrogate_before_without_constant": -11.0,
          "surrogate_after_without_constant": -11.0,
          "dictionary_projected_gradient": 2.6341441196183177e-11
        }
      }
    ],
    "query_amounts": [
      [
        1.0000000003500222,
        1.9999999998249884
      ]
    ],
    "query_diagnostic": {
      "status": "stationary-tolerance",
      "iterations": 17,
      "projected_gradient": 3.492464095700143e-10
    },
    "query_prediction": [
      [
        1.0000000002918146,
        1.9999999999425682,
        3.0000000000574314
      ]
    ]
  },
  "ordinary_distinct_route": {
    "steps": [
      {
        "steps": 1,
        "dictionary": [
          [
            1.0000000105350535,
            0.0,
            0.9999999981187406
          ],
          [
            0.0,
            0.9999999835389796,
            0.9999999983538981
          ]
        ]
      },
      {
        "steps": 2,
        "dictionary": [
          [
            0.9999996537996108,
            0.0,
            0.9999998708866715
          ],
          [
            0.0,
            1.0002228271420335,
            0.9998332747200691
          ]
        ]
      }
    ],
    "n_components": 2,
    "query_amounts": [
      [
        1.0002600177849574,
        1.9998138986743619
      ]
    ],
    "query_prediction": [
      [
        1.00025967149455,
        2.000259511490002,
        2.999740367780353
      ]
    ],
    "warnings": []
  }
}
```


The practical decision is now precise: use fresh queries against a current dictionary, and know whether training memory stores old codes, old rows or something else. [Practice U](#practice-u-old-statistics-versus-new-encoding) asks you to distinguish those objectives with the changed `h=2` row. The next section changes the **number of data axes**, which exposes a different boundary: a compact nonnegative array may still omit essential structure.
