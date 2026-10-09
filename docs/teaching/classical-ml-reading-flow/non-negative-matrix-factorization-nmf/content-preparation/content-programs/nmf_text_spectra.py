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
