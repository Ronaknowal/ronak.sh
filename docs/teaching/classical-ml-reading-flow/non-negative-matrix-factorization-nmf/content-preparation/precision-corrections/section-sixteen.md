## 16. Change application assumptions explicitly

**Can the same additive machinery explain words or light?** The shape of the calculation survives; the meaning of its inputs needs a new argument. [When anchors help recover the dictionary](#15-when-anchors-help-recover-the-dictionary) gave conditions under which observed pure rows can identify patterns. A short document or a measured spectrum does not automatically satisfy those conditions. We will first replace pixel bins with word bins, then deliberately switch to a constructed spectrum to see how a physical constraint changes the answer.

**How does a sentence become one nonnegative row?** Count each retained word in its own named column.

<!-- figure:D57 -->

The five documents in the picture are `orbit rocket orbit`, `rocket orbit rocket`, `goal team goal`, `team goal team`, and `orbit rocket goal team`. The ordered vocabulary is `[goal, orbit, rocket, team]`. Follow both copies of `orbit` in the first sentence into its `orbit` cell: that cell is 2, not two new columns. Its complete row is `[0,2,1,0]`. The next three rows are `[0,1,2,0]`, `[2,0,0,1]`, and `[1,0,0,2]`; the last is `[1,1,1,1]`. A zero says the retained word did not occur in that document. It is an observed count, not a missing measurement.

With documents as rows and vocabulary entries as features, `X ≈ WH` has exactly the orientation we have used throughout. A dictionary row now distributes a component over words. A document's amount multiplies that whole word pattern. In the preserved count experiment, the printed, rounded, unit-row-sum patterns are `[0.5,0,0,0.5]` and `[0,0.5,0.5,0]`. Their component order is the order of that saved run. The mixed document uses amounts `[2,2]`: its two contributions are `[1,0,0,1]` and `[0,1,1,0]`, adding to `[1,1,1,1]`. These are rounded recorded values, not a newly inferred full-precision dictionary.

Normalizing a dictionary row to sum to one is the compensated convention from [Amount is not probability or identity](#2-amount-is-not-probability-or-identity). Its document amounts need not sum to one. Those two amounts sum to four because this representation has four token occurrences. The product is an approximation to counts; it is not a posterior distribution over topics. A label such as “space” can be a useful human interpretation of the `orbit/rocket` pattern, but it is not a theorem that the program discovered a semantic theme or an independent source. Two documents with the same retained counts but different word order are indistinguishable here.

The count program below uses the generalized-KL route taught in [Explain the multiplicative route](#7-explain-the-multiplicative-route). Count nonnegativity makes this loss admissible, including observed zero counts, but a Poisson likelihood interpretation additionally assumes a suitable count-generating model. Word occurrences can be correlated and document length can matter; a useful approximation is not a proof of that generative assumption. A new `rocket team` query is counted in the same four columns and encoded against the existing dictionary. The saved rounded reconstruction `[0.5,0.5,0.5,0.5]` shows that encoding may predict nonzero `goal/orbit` counts even when the query did not contain them: a least-divergence combination of whole patterns cannot independently edit every word.

This is the original complete `nmf_words.py` and its preserved output. The lowercase default tokenizer, vectorizer fit, public KL/MU configuration, dictionary normalization and compensated amounts are all visible. This code was executed for the earlier lesson; its recorded output is reused here, not regenerated for the new example.


```python
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import NMF

documents = ['orbit rocket orbit', 'rocket orbit rocket',
             'goal team goal', 'team goal team',
             'orbit rocket goal team']
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(documents)
model = NMF(n_components=2, init='nndsvda', solver='mu',
            beta_loss='kullback-leibler', max_iter=1000,
            tol=1e-5, random_state=19)
W = model.fit_transform(X)
H = model.components_
mass = H.sum(axis=1)
normalized_patterns = H / mass[:, None]
amounts = W * mass
print(vectorizer.get_feature_names_out())
print(normalized_patterns.round(3))
print(amounts.round(3))
new = vectorizer.transform(['rocket team'])
print((model.transform(new) @ H).round(3))
```



```text
['goal' 'orbit' 'rocket' 'team']
[[0.5 0.  0.  0.5]
 [0.  0.5 0.5 0. ]]
[[0. 3.]
 [0. 3.]
 [3. 0.]
 [3. 0.]
 [2. 2.]]
[[0.5 0.5 0.5 0.5]]
```


**Should every occurrence count equally?** We can learn a fixed word-weighting rule from training documents before encoding a query.

<!-- figure:D58 -->

Here we change to three explicitly named training documents so the weighting arithmetic fits on the page: `orbit orbit rocket`, `rocket team`, and `team team`. The new ordered vocabulary is `[orbit, rocket, team]`; do not carry the previous four-column dictionary into this three-column problem. The count rows are `[2,1,0]`, `[0,1,1]`, and `[0,0,2]`. Document frequency counts **documents containing the word**, rather than occurrences: `orbit` appears in one document, `rocket` in two and `team` in two, even though the last document says `team` twice.

The picture gives each column a fixed multiplier. A rarer training word receives a larger multiplier. With three training documents and the smoothed convention used here, the three multipliers are `1 + log(2)`, `1 + log(4/3)`, and `1 + log(4/3)`, approximately `1.693147`, `1.287682`, and `1.287682`. These are called **inverse document frequency**, or IDF, weights. “Inverse” describes their decreasing dependence on document frequency; it does not mean we simply divide by frequency.

Let `n` be the number of training documents, `df_j` the number containing vocabulary word `j`, and `count_ij` its occurrences in document `i`. Our representation is

\[
\operatorname{idf}_j=1+\log\frac{1+n}{1+\operatorname{df}_j},
\qquad X_{ij}=\operatorname{count}_{ij}\operatorname{idf}_j.
\]

The logarithm is natural. The added ones keep the rule defined for an absent column and avoid erasing a word present in every training document. This is one precise TF-IDF convention: **term frequency** is the raw occurrence count here, and **inverse document frequency** is the learned column multiplier. Other conventions use logarithmic term frequency or normalize rows. We use `norm=None`, so the first training row is `[3.386294361119891,1.2876820724517808,0]`. Its entries are word weights, no longer literal token counts. [TfidfTransformer's weighting contract](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfTransformer.html) specifies the smoothing and normalization choices.

Move the orbit-count control from 2 to 0. The query's count row changes from `[2,1,0]` to `[0,1,0]`; the weighted row changes from `[2*idf_orbit,idf_rocket,0]` to `[0,idf_rocket,0]`. The IDF weights do not move. The query is not a new training corpus. Likewise, `rocket planet` becomes `[0,1,0]`: the unseen word `planet` is ignored under this fixed vocabulary. An all-`planet` document becomes a zero row and receives zero amounts. That null says “nothing retained by this representation,” not “a document with no meaning.” OOV means **out of vocabulary**, and is a practical reason to monitor coverage or deliberately retrain a representation on a new training corpus.

The small separate unit-length example in the picture illustrates an additional decision. Dividing a nonzero weighted row by its Euclidean length makes its direction carry the information and removes its overall magnitude. That can be useful when document length is a nuisance, but it changes the matrix and therefore the squared-error fitting problem. Our live row remains unnormalized; the inset is not an extra hidden transformation. A zero row must remain zero instead of being divided by zero.

**What does the whole training-and-query program do?** It fixes the vocabulary and IDF, fits a dictionary on the weighted training rows, and only then solves for new amounts. `count_rows` implements the lowercase, word-character tokens of length at least two used in this bounded comparison. This is not a language-aware tokenizer: punctuation separates words, one-character tokens are omitted, and no stemming, subword segmentation or phrase model is inferred. [CountVectorizer's token contract](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html) is the ordinary interface being matched.

The new `nmf_text_spectra.py` below supplies that scratch adapter, IDF calculation, and calls to the already explained `CoordinateNMF` and `encode_nnls`. Both the scratch and ordinary NMF routes use **Frobenius** loss on exactly the same weighted matrix, the same two-component custom start, zero penalties, a cap of 4,000 and tolerance `1e-8`. We use the [ordinary lifecycle from §10](#10-use-the-ordinary-tools-deliberately), rather than reimplementing the optimizer. The ordinary text route calls `fit_transform` on training rows, reads `components_`, calls `transform` on query rows, and reconstructs with `inverse_transform`. Only the vectorizer and IDF transformer are fit on raw training text; their query calls are `transform`. Labels play no role.

The vectorizer's sparse arrays store only nonzero counts or weights. The scratch optimizer in this lesson is deliberately dense; the program checks the new demonstration is 3×3 before converting it. More generally, its explicit dense adapter bounds the result to 10,000 cells. If a real vocabulary produces a large sparse document matrix, retain the sparse format and use an appropriate public solver; do not convert a corpus to dense merely to reuse these teaching loops. Tokenization itself takes work proportional to the inspected text; vocabulary sorting costs `O(v log v)` for `v` retained distinct tokens, counting takes `O(tokens + nv)` with the dense allocation, and multiplying IDF takes `O(nv)` dense work or `O(nnz)` when a sparse implementation touches only stored entries. After that, the NMF dimensions/costs are the ones already derived for `n` documents, `v` features and `k` components.

The executed new study reached scratch projected-stationarity tolerance after 12 alternating updates, with half-loss `0.5710663094424072`; the ordinary route used 13 iterations and half-loss `0.5710663094424069`, with no recorded warnings. Their stopping measurements differ, as §10 explained; this is not evidence that one extra library iteration is extra useful learning. For `rocket planet`, the scratch reconstruction is approximately `[0.437238,0.223229,0.215498]`: some error is inevitable because no combination of its two nonnegative patterns isolates the `rocket` column. Its all-OOV query has exact zero amounts and zero reconstruction. Independent fixed-dictionary NNLS objectives support these finite query results. We compare losses and reconstructions, not an obligation for arbitrary factor entries to match.

**Why not attach the count likelihood automatically?** TF-IDF entries are real-valued weights determined by the corpus. A count model for word occurrences does not automatically become a count model for weighted entries. Here Frobenius loss states exactly the numerical disagreement we fit. Generalized KL can also be defined for admissible nonnegative weighted values, but its probability-model interpretation would need a separate argument. Model selection must assess the intended task—retrieval, compression, exploration or a downstream prediction—under a train-only preprocessing rule, not merely the pleasant names given to components.

**Do nonnegative spectral amounts represent physical fractions?** Only an additional sum-to-one constraint makes them fractions of a fixed total.

<!-- figure:D59 -->

We now deliberately leave documents and return to the familiar two patterns `[1,0,1]` and `[0,1,1]`. In this **constructed** application, the three features are spectral bands and a pattern is called an **endmember**: a candidate pure-material response. They are numerical examples, not instrument measurements or certified substances. The query is `x = g[2,1,3]`, with the gain control initially `g=1`. Gain multiplies every band together.

The nonnegative cone contains every nonnegative combination of both patterns, including its zero and boundary cases. At gain 1, NNLS amounts `[2,1]` reconstruct `[2,1,3]` exactly. At gain 2, `[4,2]` reconstruct `[4,2,6]`. The sum of amounts changes with signal strength. The line segment joins the two endmembers and contains only their sum-one combinations: `[t,1-t]` for `0 ≤ t ≤ 1`. In geometry, those amounts belong to a **simplex**; for two components the simplex is just an interval. Both constraints are nonnegative, but the feasible sets are different. Every point on this segment has third band 1, so it cannot exactly represent our third band 3 at gain 1.

To compute the segment optimum, name the first and second pattern rows `h0` and `h1`. A sum-one reconstruction is `h1 + t(h0-h1)`. Define the direction `v=h0-h1`. Minimizing the half-square error along its whole line gives slope `v·(h1+tv-x)` and zero-slope coordinate `(x-h1)·v/(v·v)`. Constraining the coordinate to `[0,1]` clips that scalar optimum to the segment, because the scalar quadratic is convex:

\[
t^*=\operatorname{clip}\!\left(\frac{(x-h_1)\cdot(h_0-h_1)}{\|h_0-h_1\|_2^2},0,1\right),
\qquad w^*=[t^*,1-t^*].
\]

For our `h0-h1=[1,-1,0]` the denominator is 2 and numerator is `g+1`. Thus `t*=clip((g+1)/2,0,1)`. At `g=0.5`, the optimum is `[0.75,0.25]`, predicts `[0.75,0.25,1]` and has half-loss `3/16=0.1875`. At gain 1 it reaches the first endpoint `[1,0]`, predicts `[1,0,1]` and has half-loss 3. At gain 2 the same endpoint has half-loss 19. The cone-constrained NNLS answer remains exact throughout this control's domain, apart from floating-point NNLS residuals near `1e-16` in the executed reference.

If instead we normalize the exact unconstrained amounts `[2,1]` to `[2/3,1/3]`, the gain-1 prediction is `[2/3,1/3,1]` and half-loss is `28/9 ≈ 3.111111`, worse than the true segment optimum 3. Normalizing **after** optimizing changes the prediction without solving the newly constrained objective. This is different from the compensated dictionary-row normalization in §2, which preserves the product.

`simplex_two` implements the closed-form two-pattern projection in `O(d)` time and workspace for `d` bands. Its arrays are read-only results. If both patterns are identical, every sum-one amount has the same prediction: it returns `[0,1]` by a declared convention and marks amounts nonunique. If distinct patterns lose their squared separation to underflow, or the products/loss exceed finite arithmetic, it refuses and requests a better numerical scale rather than pretending it found a unique answer. With more than two patterns, the simplex has several coordinates and this clipping formula is no longer a general solution. Use a suitable constrained least-squares/quadratic optimizer and check feasibility and stationarity.

The public diagnostic route here independently minimizes the same one-coordinate objective with SciPy SLSQP, an analytic gradient and `[0,1]` bounds. It checks solver success and finite feasible output. All three constructed gains converged to the same amounts and losses in this new execution; a numerical success flag is not a proof that every future call will work. See the [SLSQP objective and stopping interface](https://docs.scipy.org/doc/scipy/reference/optimize.minimize-slsqp.html).

Here is the complete new file. Its first application uses the fixed training representation described above; its second uses the fixed constructed spectral dictionary. They are separated functions because their features, fitted state and assumptions are different. Place it beside the supplied `nmf_arrays.py`, `nmf_coordinate.py`, `nmf_nnls.py` and unchanged `centered_pca.py` siblings.


```python
"""Separate small offline text and constructed three-band transfer routes."""
from dataclasses import dataclass
import json,re,warnings
import numpy as np
from scipy.optimize import minimize
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import CountVectorizer,TfidfTransformer
from nmf_arrays import nonnegative_table,positive_integer,require_finite,frobenius_metrics,read_only
from nmf_coordinate import CoordinateNMF
from nmf_nnls import encode_nnls


TOKEN=re.compile(r'(?u)\b\w\w+\b')


def count_rows(documents, vocabulary=None, *, max_cells=10000):
    """Dense teaching adapter with the default lowercase/two-character word rule."""
    documents=tuple(documents)
    if any(not isinstance(document,str) for document in documents):
        raise ValueError('Documents must be strings')
    tokens=[TOKEN.findall(document.lower()) for document in documents]
    vocabulary=tuple(sorted({word for row in tokens for word in row})) if vocabulary is None else tuple(vocabulary)
    if not vocabulary or len(set(vocabulary))!=len(vocabulary) or any(not isinstance(word,str) or not word for word in vocabulary):
        raise ValueError('Supply a nonempty unique ordered vocabulary')
    max_cells=positive_integer(max_cells,'max_cells')
    if len(documents)*len(vocabulary)>max_cells:
        raise ValueError('This dense teaching route exceeds its declared cell bound')
    positions={word:j for j,word in enumerate(vocabulary)}
    counts=np.zeros((len(documents),len(vocabulary)))
    for i,row in enumerate(tokens):
        for word in row:
            if word in positions:counts[i,positions[word]]+=1
    require_finite(counts,'Token counts')
    return counts,vocabulary


def training_idf(counts):
    x=nonnegative_table(counts,require_rows=True)
    if np.any(x!=np.floor(x)):
        raise ValueError('Document frequency starts from nonnegative integer counts')
    frequency=np.count_nonzero(x>0,axis=0)
    return 1+np.log((1+len(x))/(1+frequency))


def apply_idf(counts, idf):
    x=nonnegative_table(counts)
    weights=np.asarray(idf,dtype=float)
    if weights.shape!=(x.shape[1],) or np.any(weights<0):
        raise ValueError('IDF must match the fixed feature order')
    require_finite(weights,'IDF weights')
    with np.errstate(over='ignore',invalid='ignore'):
        weighted=x*weights
    return require_finite(weighted,'Weighted text')


def text_demo():
    train=('orbit orbit rocket','rocket team','team team')
    queries=('orbit orbit rocket','rocket planet','planet')
    counts,vocabulary=count_rows(train)
    idf=training_idf(counts)
    query_counts,_=count_rows(queries,vocabulary)
    x,query=apply_idf(counts,idf),apply_idf(query_counts,idf)
    vectorizer=CountVectorizer()
    ordinary_counts=vectorizer.fit_transform(train)
    transformer=TfidfTransformer(norm=None,smooth_idf=True,use_idf=True,sublinear_tf=False)
    ordinary_sparse=transformer.fit_transform(ordinary_counts)
    # This tiny comparison is deliberately 3x3, not a recommendation to densify a corpus.
    if ordinary_sparse.shape!=(3,3):raise ValueError('Unexpected tiny demonstration shape')
    ordinary_x=ordinary_sparse.toarray()
    ordinary_query=transformer.transform(vectorizer.transform(queries)).toarray()
    if tuple(vectorizer.get_feature_names_out())!=vocabulary or not np.array_equal(ordinary_x,x):
        raise ValueError('Scratch/public vocabulary or weighting conventions differ')
    initial_w=np.array([[1,.3],[.4,.8],[.2,1.]])
    initial_h=np.array([[1,.3,.2],[.2,.5,1.]])
    scratch=CoordinateNMF(2,max_iter=4000,tol=1e-8,sweeps=1,random_state=0)
    w=scratch.fit_transform(x,features=vocabulary,initial_w=initial_w,initial_h=initial_h)
    public=NMF(n_components=2,init='custom',solver='cd',beta_loss='frobenius',
               alpha_W=0,alpha_H=0,l1_ratio=0,shuffle=False,max_iter=4000,tol=1e-8,random_state=0)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        public_w=public.fit_transform(ordinary_x,W=initial_w.copy(),H=initial_h.copy())
        public_query_w=public.transform(ordinary_query)
    scratch_query_w,status=scratch.transform(query,features=vocabulary,return_diagnostics=True)
    return {'training_documents':train,'query_documents':queries,'vocabulary':vocabulary,
            'counts':counts.tolist(),'document_frequency':np.count_nonzero(counts>0,axis=0).tolist(),
            'idf':idf.tolist(),'tfidf_norm_none':x.tolist(),'query_counts':query_counts.tolist(),'query_tfidf':query.tolist(),
            'scratch':{'dictionary':scratch.components_.tolist(),'training_amounts':w.tolist(),
                       'training_half_loss':frobenius_metrics(x,w,scratch.components_).half_square,
                       'status':scratch.status_,'last_diagnostic':scratch.diagnostics_[-1],
                       'query_amounts':scratch_query_w.tolist(),'query_diagnostic':status,
                       'query_reconstruction':scratch.inverse_transform(scratch_query_w).tolist()},
            'ordinary':{'dictionary':public.components_.tolist(),'training_amounts':public_w.tolist(),
                        'training_half_loss':frobenius_metrics(x,public_w,public.components_).half_square,
                        'iterations':int(public.n_iter_),'warnings':[str(item.message) for item in caught],
                        'query_amounts':public_query_w.tolist(),'query_reconstruction':public.inverse_transform(public_query_w).tolist()},
            'scope':'New tiny TF-IDF/Frobenius study, separate from original five-document count/KL run'}


@dataclass(frozen=True)
class SimplexProjection:
    amounts: np.ndarray
    prediction: np.ndarray
    half_loss: float
    nonunique_amounts: bool


def simplex_two(query, dictionary):
    h=nonnegative_table(dictionary,require_rows=True)
    x=nonnegative_table([query],h.shape[1])[0]
    if h.shape[0]!=2:raise ValueError('This exact line-segment adapter requires two patterns')
    direction=h[0]-h[1]
    with np.errstate(over='ignore',invalid='ignore'):
        denominator=float(direction@direction)
        numerator=float((x-h[1])@direction)
    require_finite([denominator,numerator],'Simplex projection products')
    nonunique=denominator==0
    if nonunique and np.any(direction!=0):
        raise ValueError('Distinct patterns lost their squared distance; rescale the data')
    unbounded=0.0 if nonunique else numerator/denominator
    require_finite(unbounded,'Unconstrained segment coordinate')
    t=float(np.clip(unbounded,0,1))
    amounts=np.array([t,1-t]);prediction=amounts@h
    with np.errstate(over='ignore',invalid='ignore'):
        loss=float(np.sum((x-prediction)**2)/2)
    require_finite([*prediction,loss],'Simplex prediction and loss')
    return SimplexProjection(read_only(amounts),read_only(prediction),loss,nonunique)


def public_simplex_two(query,dictionary):
    h=nonnegative_table(dictionary,require_rows=True)
    x=nonnegative_table([query],h.shape[1])[0]
    if h.shape[0]!=2:raise ValueError('Two patterns required')
    direction=h[0]-h[1]
    def objective(t):
        residual=h[1]+t[0]*direction-x
        with np.errstate(over='ignore',invalid='ignore'):
            value=float(residual@residual/2)
        return float(require_finite(value,'Constrained reference objective'))
    def gradient(t):
        with np.errstate(over='ignore',invalid='ignore'):
            value=np.array([(h[1]+t[0]*direction-x)@direction])
        return require_finite(value,'Constrained reference gradient')
    result=minimize(objective,[.5],jac=gradient,bounds=[(0.,1.)],method='SLSQP',
                    options={'ftol':1e-12,'maxiter':100})
    if not result.success:raise RuntimeError(f'Constrained reference failed: {result.message}')
    require_finite(result.x,'Constrained reference amount')
    if not 0<=result.x[0]<=1:raise RuntimeError('Constrained reference left feasible segment')
    return {'amounts':[float(result.x[0]),float(1-result.x[0])],
            'half_loss':objective(result.x),'iterations':int(result.nit),'success':bool(result.success)}


def spectra_demo():
    h=np.array([[1.,0.,1.],[0.,1.,1.]])
    rows=[]
    for gain in (.5,1.,2.):
        x=gain*np.array([2.,1.,3.])
        cone,norms=encode_nnls(x[None,:],h)
        simplex=simplex_two(x,h)
        normalized=cone[0]/cone[0].sum()
        rows.append({'gain':gain,'query':x.tolist(),'cone_amounts':cone[0].tolist(),'cone_residual_norm':float(norms[0]),
                     'simplex_amounts':simplex.amounts.tolist(),'simplex_prediction':simplex.prediction.tolist(),
                     'simplex_half_loss':simplex.half_loss,'ordinary_constrained':public_simplex_two(x,h),
                     'normalized_NNLS':normalized.tolist(),
                     'normalized_NNLS_half_loss':float(np.sum((x-normalized@h)**2)/2)})
    return {'scope':'Constructed three-band geometry, not measured/calibrated physical endmembers',
            'dictionary':h.tolist(),'rows':rows}


def main():
    print(json.dumps({'text':text_demo(),'spectra':spectra_demo()},indent=2,allow_nan=False))


if __name__=='__main__':
    main()
```


The full output of the new bounded demonstration follows. It includes actual dictionaries and amounts, the null query, convergence diagnostics and all three constrained comparisons. These data belong to this new three-document/Frobenius example, not the preceding historical five-document/KL run.


```json
{
  "text": {
    "training_documents": [
      "orbit orbit rocket",
      "rocket team",
      "team team"
    ],
    "query_documents": [
      "orbit orbit rocket",
      "rocket planet",
      "planet"
    ],
    "vocabulary": [
      "orbit",
      "rocket",
      "team"
    ],
    "counts": [
      [
        2.0,
        1.0,
        0.0
      ],
      [
        0.0,
        1.0,
        1.0
      ],
      [
        0.0,
        0.0,
        2.0
      ]
    ],
    "document_frequency": [
      1,
      2,
      2
    ],
    "idf": [
      1.6931471805599454,
      1.2876820724517808,
      1.2876820724517808
    ],
    "tfidf_norm_none": [
      [
        3.386294361119891,
        1.2876820724517808,
        0.0
      ],
      [
        0.0,
        1.2876820724517808,
        1.2876820724517808
      ],
      [
        0.0,
        0.0,
        2.5753641449035616
      ]
    ],
    "query_counts": [
      [
        2.0,
        1.0,
        0.0
      ],
      [
        0.0,
        1.0,
        0.0
      ],
      [
        0.0,
        0.0,
        0.0
      ]
    ],
    "query_tfidf": [
      [
        3.386294361119891,
        1.2876820724517808,
        0.0
      ],
      [
        0.0,
        1.2876820724517808,
        0.0
      ],
      [
        0.0,
        0.0,
        0.0
      ]
    ],
    "scratch": {
      "dictionary": [
        [
          1.0459433267438019,
          0.4296350876826676,
          0.0
        ],
        [
          0.0,
          0.23742168468324357,
          1.1727448727556171
        ]
      ],
      "training_amounts": [
        [
          3.202844856182045,
          0.0
        ],
        [
          0.33340194362485476,
          1.2445611217207246
        ],
        [
          0.0,
          2.1095522422367297
        ]
      ],
      "training_half_loss": 0.5710663094424072,
      "status": "stationary-tolerance",
      "last_diagnostic": [
        12,
        0.5710663094424072,
        3.306971207123834e-08
      ],
      "query_amounts": [
        [
          3.2028448549071626,
          0.0
        ],
        [
          0.41803245347565,
          0.18375529265332882
        ],
        [
          0.0,
          0.0
        ]
      ],
      "query_diagnostic": {
        "status": "stationary-tolerance",
        "iterations": 4,
        "projected_gradient": 3.4226452783059358e-09
      },
      "query_reconstruction": [
        [
          3.349994202585867,
          1.3760545300720197,
          0.0
        ],
        [
          0.4372382550751949,
          0.22322890095442732,
          0.2154980773008993
        ],
        [
          0.0,
          0.0,
          0.0
        ]
      ]
    },
    "ordinary": {
      "dictionary": [
        [
          1.04594332580967,
          0.4296350900574366,
          0.0
        ],
        [
          0.0,
          0.23742168036641245,
          1.1727448735963044
        ]
      ],
      "training_amounts": [
        [
          3.2028448549071618,
          0.0
        ],
        [
          0.3334019635705866,
          1.2445611085382222
        ],
        [
          0.0,
          2.109552249175553
        ]
      ],
      "training_half_loss": 0.5710663094424069,
      "iterations": 13,
      "warnings": [],
      "query_amounts": [
        [
          3.2028448546082,
          0.0
        ],
        [
          0.41803245364270813,
          0.18375528914574835
        ],
        [
          0.0,
          0.0
        ]
      ],
      "query_reconstruction": [
        [
          3.34999419928129,
          1.3760545375495914,
          0.0
        ],
        [
          0.43723825485943085,
          0.22322890039291568,
          0.215498073341883
        ],
        [
          0.0,
          0.0,
          0.0
        ]
      ]
    },
    "scope": "New tiny TF-IDF/Frobenius study, separate from original five-document count/KL run"
  },
  "spectra": {
    "scope": "Constructed three-band geometry, not measured/calibrated physical endmembers",
    "dictionary": [
      [
        1.0,
        0.0,
        1.0
      ],
      [
        0.0,
        1.0,
        1.0
      ]
    ],
    "rows": [
      {
        "gain": 0.5,
        "query": [
          1.0,
          0.5,
          1.5
        ],
        "cone_amounts": [
          1.0,
          0.4999999999999999
        ],
        "cone_residual_norm": 1.6653345369377348e-16,
        "simplex_amounts": [
          0.75,
          0.25
        ],
        "simplex_prediction": [
          0.75,
          0.25,
          1.0
        ],
        "simplex_half_loss": 0.1875,
        "ordinary_constrained": {
          "amounts": [
            0.75,
            0.25
          ],
          "half_loss": 0.1875,
          "iterations": 2,
          "success": true
        },
        "normalized_NNLS": [
          0.6666666666666666,
          0.33333333333333326
        ],
        "normalized_NNLS_half_loss": 0.19444444444444453
      },
      {
        "gain": 1.0,
        "query": [
          2.0,
          1.0,
          3.0
        ],
        "cone_amounts": [
          2.0,
          0.9999999999999998
        ],
        "cone_residual_norm": 3.3306690738754696e-16,
        "simplex_amounts": [
          1.0,
          0.0
        ],
        "simplex_prediction": [
          1.0,
          0.0,
          1.0
        ],
        "simplex_half_loss": 3.0,
        "ordinary_constrained": {
          "amounts": [
            1.0,
            0.0
          ],
          "half_loss": 3.0,
          "iterations": 2,
          "success": true
        },
        "normalized_NNLS": [
          0.6666666666666666,
          0.33333333333333326
        ],
        "normalized_NNLS_half_loss": 3.1111111111111116
      },
      {
        "gain": 2.0,
        "query": [
          4.0,
          2.0,
          6.0
        ],
        "cone_amounts": [
          4.0,
          1.9999999999999996
        ],
        "cone_residual_norm": 6.661338147750939e-16,
        "simplex_amounts": [
          1.0,
          0.0
        ],
        "simplex_prediction": [
          1.0,
          0.0,
          1.0
        ],
        "simplex_half_loss": 19.0,
        "ordinary_constrained": {
          "amounts": [
            1.0,
            0.0
          ],
          "half_loss": 19.0,
          "iterations": 2,
          "success": true
        },
        "normalized_NNLS": [
          0.6666666666666666,
          0.33333333333333326
        ],
        "normalized_NNLS_half_loss": 19.444444444444446
      }
    ]
  }
}
```


**What would justify a material interpretation?** Calibration and independent evidence must connect a numerical component to the world.

<!-- figure:D60 -->

The measured/modelled/residual lanes now reuse our separate positive-shear example, explicitly switching from `H0` to patterns `[1,1,1]` and `[0,1,1]`, with amounts `[2,1]`. Their modelled response is `[2,3,3]`. A different dictionary `[1,0.5,0.5]`, `[0,1,1]` with amounts `[2,2]` gives the same response. The numerical residual in either lane is zero. Equal fit cannot choose which explanation names the physical materials.

An instrument's band response, units, baseline, noise, saturation and calibration establish what the observed vector means. Independent endmember measurements or credible mixing laws establish whether the candidate dictionary represents pure responses. An abundance sum-one constraint might describe fractions under a particular linear mixture model; brightness, illumination, path length, nonlinear scattering or additional materials can violate that simple model. These are questions for the experiment and the application, not facts inferred from `WH` alone. Even an identifiable algebraic dictionary under §15's assumptions is not automatically a calibrated substance catalogue.

That distinction explains both the promise and the restraint of additive models: a nonnegative table lets us reuse the computation, while each domain must defend its representation, noise/loss and interpretation. A useful changed task is to hold the vocabulary fixed for a new text query, or hold the endmembers fixed while changing gain, and explain which inference remains justified. [Practice T](#practice-t-query-with-fixed-idf) and the physical-interpretation task revisit those decisions. Next, we keep the data representation fixed but change **when** rows arrive, so the model must decide what to remember.
