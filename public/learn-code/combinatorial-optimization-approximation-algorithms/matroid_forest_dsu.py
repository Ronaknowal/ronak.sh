"""Weighted graphic-matroid greedy with incremental disjoint-set state.

Only finite integer weights/distinct in-range endpoints. Unrestricted
independent-set optimization skips nonpositive weights. A maximum-weight
spanning forest uses every joining edge, including necessary negative ones;
it connects each original component, not two disconnected components.
Sort costs O(m log m); iterative union-by-size/path compression gives
amortized inverse-Ackermann work per union/find. The small exact subset
oracle below verifies the fixture and is not part of that complexity.
"""
from itertools import combinations


class Components:
    def __init__(self, n):
        self.parent=list(range(n))
        self.size=[1]*n

    def root(self, v):
        while self.parent[v]!=v:
            self.parent[v]=self.parent[self.parent[v]]
            v=self.parent[v]
        return v

    def join(self, a, b):
        a,b=self.root(a),self.root(b)
        if a==b:
            return False
        if self.size[a]<self.size[b]:
            a,b=b,a
        self.parent[b]=a
        self.size[a]+=self.size[b]
        return True


def weighted_forest(n, edges, spanning=False):
    if type(n)is not int or n<0:
        raise ValueError('nonnegative integer vertex count required')
    if any(len(edge)!=3 or any(type(v)is not int for v in edge)
           or not 0<=edge[0]<n or not 0<=edge[1]<n or edge[0]==edge[1]
           for edge in edges):
        raise ValueError('integer weights and distinct valid endpoints required')
    state=Components(n)
    selected=[]
    trace=[]
    order=sorted(enumerate(edges),key=lambda pair:(-pair[1][2],pair[0]))
    for original,(a,b,w) in order:
        if not spanning and w<=0:
            reason='nonpositive; optional cardinality'
        elif state.join(a,b):
            selected.append(original)
            reason='join components'
        else:
            reason='cycle rejected'
        trace.append((original,reason,[state.root(v) for v in range(n)]))
    return selected,trace


if __name__=='__main__':
    edges=[(0,1,6),(1,2,5),(0,2,4),(2,3,3),(1,3,2),(0,3,1)]
    chosen,trace=weighted_forest(4,edges)
    for original,reason,components in trace:
        print('edge',original,edges[original],reason,'component roots',components)
    best=max(sum(edges[i][2] for i in subset)
             for size in range(len(edges)+1)
             for subset in combinations(range(len(edges)),size)
             if len(weighted_forest(4,[edges[i] for i in subset],True)[0])==size)
    print('chosen original indices:',chosen,'value:',sum(edges[i][2] for i in chosen),'tiny exact:',best)
    print('optional negative edge:',weighted_forest(2,[(0,1,-3)])[0])
    print('spanning negative edge:',weighted_forest(2,[(0,1,-3)],True)[0])
