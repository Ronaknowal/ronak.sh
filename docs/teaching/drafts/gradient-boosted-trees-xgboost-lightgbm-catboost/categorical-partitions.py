"""Admissible squared categorical partitions and reversible exclusive bundles.

The sorted prefix result applies to positive weighted squared-error category
means with no leaf penalty. It is not a universal theorem for all objectives.
"""
import numpy as np


def category_statistics(labels, g, h):
    labels=np.asarray(labels); g=np.asarray(g,dtype=float); h=np.asarray(h,dtype=float)
    if labels.ndim!=1 or not len(labels) or g.shape!=labels.shape or h.shape!=labels.shape or not np.isfinite(g).all() or not np.isfinite(h).all() or (h<=0).any():
        raise ValueError('matching category rows with finite derivatives and positive squared-loss weights required')
    categories,ids=np.unique(labels,return_inverse=True)
    G=np.bincount(ids,weights=g); H=np.bincount(ids,weights=h)
    return categories,G,H


def unpenalized_gain(G,H,left):
    GL,HL=G[left].sum(),H[left].sum(); GR,HR=G.sum()-GL,H.sum()-HL
    return float(.5*(GL**2/HL+GR**2/HR-G.sum()**2/H.sum()))


def sorted_partition(categories,G,H):
    if len(categories)<2 or (H<=0).any():
        raise ValueError('at least two positive-mass categories required')
    order=np.argsort(-G/H,kind='stable')
    pg,ph=np.cumsum(G[order]),np.cumsum(H[order])
    gains=.5*(pg[:-1]**2/ph[:-1]+(pg[-1]-pg[:-1])**2/(ph[-1]-ph[:-1])-pg[-1]**2/ph[-1])
    end=int(np.argmax(gains))+1
    return categories[order[:end]].tolist(),float(gains[end-1]),order


def exhaustive_partition(categories,G,H):
    # Small oracle: force category0 left to avoid complementary duplicates.
    k=len(categories)
    if not 2<=k<=16:
        raise ValueError('the exhaustive oracle is limited to 2..16 categories')
    best_gain=-np.inf; best=None
    for bits in range(2**(k-1)-1):
        left=np.array([True]+[bool(bits&(1<<j)) for j in range(k-1)])
        gain=unpenalized_gain(G,H,left)
        if gain>best_gain: best_gain,best=gain,categories[left].tolist()
    return best,float(best_gain)


def conflict_graph(rows):
    rows=np.asarray(rows)
    if rows.ndim!=2 or not len(rows) or not rows.shape[1] or not np.isfinite(rows).all() or (rows<0).any() or not np.equal(rows,np.floor(rows)).all():
        raise ValueError('nonnegative integer bin matrix required; zero is absent')
    active=(rows>0).astype(np.int64)
    graph=active.T@active>0; np.fill_diagonal(graph,False)
    return graph


def greedy_groups(rows):
    graph=conflict_graph(rows); groups=[]
    order=sorted(range(graph.shape[0]),key=lambda j:(-int(graph[j].sum()),j))
    for feature in order:
        for group in groups:
            if not graph[feature,group].any():
                group.append(feature); break
        else: groups.append([feature])
    return groups,graph


def encode_group(rows, features, maxima):
    rows=np.asarray(rows); block=rows[:,features]; maxima=np.asarray(maxima,dtype=int)
    if block.shape[1]!=len(maxima) or (maxima<1).any() or not np.isfinite(block).all() or (block<0).any() or not np.equal(block,np.floor(block)).all() or (block>maxima).any():
        raise ValueError('integer bins must fit the declared positive feature ranges')
    if ((block>0).sum(axis=1)>1).any():
        raise ValueError('one bundle cannot reversibly encode co-active features')
    offsets=np.r_[0,np.cumsum(maxima)[:-1]]
    codes=np.where(block>0,block+offsets,0).sum(axis=1).astype(int)
    return codes,offsets


def decode_group(codes, maxima):
    maxima=np.asarray(maxima,dtype=int); codes=np.asarray(codes)
    if codes.ndim!=1 or not np.isfinite(codes).all() or not np.equal(codes,np.floor(codes)).all() or (codes<0).any() or (codes>maxima.sum()).any() or (maxima<1).any():
        raise ValueError('integer bundle codes must fit the declared ranges')
    offsets=np.r_[0,np.cumsum(maxima)[:-1]]
    shifted=codes[:,None]-offsets
    return np.where((shifted>0)&(shifted<=maxima),shifted,0).astype(int)


def main():
    from sklearn.tree import DecisionTreeRegressor
    labels=np.array(['A','B','C','A','D','B','C','D'])
    y=np.array([0.,5.,1.,.5,6.,4.,1.5,7.]); g=y.mean()-y; h=np.ones(len(y))
    categories,G,H=category_statistics(labels,g,h)
    subset,gain,order=sorted_partition(categories,G,H)
    exhaustive,oracle=exhaustive_partition(categories,G,H)
    ranks={category:i for i,category in enumerate(categories[order])}
    X=np.array([[ranks[label]] for label in labels])
    native=DecisionTreeRegressor(max_depth=1,random_state=73).fit(X,y)
    print('category / G / H:',categories.tolist(),G.tolist(),H.tolist())
    print('sorted subset / gain:',subset,gain)
    print('exhaustive subset / gain:',exhaustive,oracle)
    print('ordinary tree on admissible response-sorted ranks:',np.round(native.predict(X),6).tolist())
    rows=np.array([[0,0,0],[2,0,0],[0,1,0],[0,0,2]])
    groups,graph=greedy_groups(rows); codes,offsets=encode_group(rows,[0,1,2],[2,2,2])
    print('groups / conflict graph:',groups,graph.astype(int).tolist())
    print('offsets / codes:',offsets.tolist(),codes.tolist())
    print('decoded rows:',decode_group(codes,[2,2,2]).tolist())
    collision=np.vstack([rows,[1,1,0]])
    print('changed conflict groups:',greedy_groups(collision)[0])


if __name__=='__main__': main()
