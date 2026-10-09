"""Exact cut/bin conservation and weighted empirical CDF, not a sketch engine."""
import numpy as np


def histogram(values, g, h, cuts):
    values=np.asarray(values,dtype=float); g=np.asarray(g,dtype=float); h=np.asarray(h,dtype=float)
    cuts=np.asarray(cuts,dtype=float)
    if values.ndim!=1 or not len(values) or g.shape!=values.shape or h.shape!=values.shape or np.isinf(values).any() or not np.isfinite(g).all() or not np.isfinite(h).all() or (h<0).any():
        raise ValueError('matching finite derivative rows; NaN values mark missing')
    if cuts.ndim!=1 or not np.isfinite(cuts).all() or (np.diff(cuts)<=0).any():
        raise ValueError('strictly increasing finite cuts required')
    known=~np.isnan(values)
    # Equality belongs to the <= side; missing has a separate mass.
    bins=np.searchsorted(cuts,values[known],side='left')
    size=len(cuts)+1
    return {'cuts':cuts,'counts':np.bincount(bins,minlength=size),
        'G':np.bincount(bins,weights=g[known],minlength=size),
        'H':np.bincount(bins,weights=h[known],minlength=size),
        'missing':(int((~known).sum()),float(g[~known].sum()),float(h[~known].sum()))}


def candidates(hist, l2=0., minimum_leaf=1):
    if not np.isfinite(l2) or l2<0 or not isinstance(minimum_leaf,int) or minimum_leaf<1:
        raise ValueError('nonnegative finite L2 and positive integer minimum leaf required')
    G,H=hist['G'],hist['H']; counts=hist['counts']; nm,gm,hm=hist['missing']
    totalG,totalH=G.sum()+gm,H.sum()+hm
    parent=.5*totalG**2/(totalH+l2)
    prefixG,prefixH,prefixN=np.cumsum(G),np.cumsum(H),np.cumsum(counts)
    answer=[]
    for j,cut in enumerate(hist['cuts']):
        for missing_left in [True,False]:
            GL=float(prefixG[j])+(gm if missing_left else 0.)
            HL=float(prefixH[j])+(hm if missing_left else 0.)
            nL=int(prefixN[j])+(nm if missing_left else 0)
            GR,HR,nR=totalG-GL,totalH-HL,int(counts.sum()+nm-nL)
            if min(nL,nR)<minimum_leaf or min(HL+l2,HR+l2)<=1e-10: continue
            gain=.5*(GL**2/(HL+l2)+GR**2/(HR+l2))-parent
            answer.append({'cut':float(cut),'missing_left':missing_left,
                'left':(nL,GL,HL),'right':(nR,float(GR),float(HR)),'gain':float(gain)})
    return answer


def weighted_cdf(values, mass):
    values=np.asarray(values,dtype=float); mass=np.asarray(mass,dtype=float)
    if values.ndim!=1 or mass.shape!=values.shape or not len(values) or not np.isfinite(values).all() or not np.isfinite(mass).all() or (mass<0).any() or mass.sum()<=0:
        raise ValueError('finite values and nonnegative mass with positive total required')
    order=np.argsort(values,kind='stable'); sorted_values=values[order]
    starts=np.r_[0,np.flatnonzero(np.diff(sorted_values)>0)+1]
    unique=sorted_values[starts]; grouped=np.add.reduceat(mass[order],starts)
    return unique,grouped,np.cumsum(grouped)/grouped.sum()


def sibling(parent_G,parent_H,child_G,child_H):
    PG,PH,CG,CH=[np.asarray(a,dtype=float) for a in [parent_G,parent_H,child_G,child_H]]
    if PG.ndim!=1 or PG.shape!=PH.shape or CG.shape!=PG.shape or CH.shape!=PG.shape or not all(np.isfinite(a).all() for a in [PG,PH,CG,CH]):
        raise ValueError('matching finite bin arrays required')
    if (PH<0).any() or (CH<0).any() or (CH>PH+1e-10).any():
        raise ValueError('child curvature must be a subset of parent curvature')
    # A tolerance handles only tiny cancellation below zero, not invalid mass.
    return PG-CG,np.maximum(PH-CH,0.)


def main():
    x=np.array([1,2,3,4,5,6,np.nan],dtype=float)
    for missing_target in [8.,2.]:
        y=np.array([1,1,1,9,9,9,missing_target],dtype=float); g=y.mean()-y; h=np.ones(7)
        for cuts in [[1.5,2.5,3.5,4.5,5.5],[2.5,4.5]]:
            hist=histogram(x,g,h,cuts); best=max(candidates(hist),key=lambda row:row['gain'])
            print('missing target / allowed cuts:',missing_target,cuts)
            print('bin count / G / H:',hist['counts'].tolist(),np.round(hist['G'],6).tolist(),hist['H'].tolist())
            print('best cut / missing-left / gain:',best['cut'],best['missing_left'],round(best['gain'],6))
    unique,mass,cdf=weighted_cdf([0,1,2,3],[1,1,6,2])
    print('weighted values / grouped mass / CDF:',unique.tolist(),mass.tolist(),cdf.tolist())
    sg,sh=sibling([3,-1,4],[2,1,3],[1,0,2],[1,0,1])
    print('sibling G / H:',sg.tolist(),sh.tolist())


if __name__=='__main__': main()
