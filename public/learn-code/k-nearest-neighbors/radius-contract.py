"""Radius prediction with an explicit unavailable result; NumPy/sklearn."""
import numpy as np
from sklearn.neighbors import RadiusNeighborsClassifier


def radius_vote(reference, labels, query, radius):
    reference=np.asarray(reference,dtype=float); labels=np.asarray(labels)
    query=np.asarray(query,dtype=float)
    if (reference.ndim!=2 or not len(reference) or query.shape!=(reference.shape[1],)
            or labels.shape!=(len(reference),) or not np.isfinite(reference).all()
            or not np.isfinite(query).all() or not np.isfinite(radius) or radius<0):
        raise ValueError('matching finite reference/query, one label per row, radius>=0 required')
    with np.errstate(over='raise',invalid='raise'):
        distance=np.hypot.reduce(reference-query,axis=1)
    ids=np.flatnonzero(distance<=radius)
    if not len(ids):
        return ids, None, None
    classes, encoded=np.unique(labels,return_inverse=True)
    share=np.bincount(encoded[ids],minlength=len(classes))/len(ids)
    return ids, classes, share


def main():
    reference=np.array([[3.,3.],[3.2,2.8],[1.,2.]])
    labels=np.array(['C','C','A']); query=np.array([3.1,2.9])
    for radius in (.1,.2):
        ids,classes,share=radius_vote(reference,labels,query,radius)
        print('radius=',radius,'selected=',ids.tolist(),'probabilities=',
              None if share is None else dict(zip(classes,share.tolist())))
        native=RadiusNeighborsClassifier(radius=radius,algorithm='brute').fit(reference,labels)
        try:
            probability=native.predict_proba([query])[0]
        except ValueError as error:
            if len(ids): raise
            print('  sklearn default no-support:',type(error).__name__)
        else:
            np.testing.assert_array_equal(classes,native.classes_)
            np.testing.assert_allclose(share,probability)
    exact=radius_vote([[0.],[0.],[1.]],['A','B','B'],[0.],0)
    np.testing.assert_array_equal(exact[0],[0,1])
    np.testing.assert_allclose(exact[2],[.5,.5])
    boundary=radius_vote([[0.],[1.]],['A','B'],[.5],.5)
    np.testing.assert_array_equal(boundary[0],[0,1])
    print('Zero-radius duplicates and inclusive exact boundary checks passed.')
    print('No-support is unavailable; no fabricated zero probability or majority fallback.')


if __name__=='__main__':
    main()
