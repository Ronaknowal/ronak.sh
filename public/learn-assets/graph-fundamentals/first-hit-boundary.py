"""First-hit probabilities from the same weighted neighbor rule; Python 3.

Run: python first-hit-boundary.py
Finite undirected graph, nonnegative rational weights; positive edges define
connectivity. Every component must contain a fixed boundary vertex. A boundary
value is 1 for the target set and 0 for the other absorbing boundary vertices.
Tiny exact dense solve: O(u^3) arithmetic operations, O(u^2+n+m) storage;
Fraction numerators can grow, so this is not the scalable sparse tool route.
"""
from fractions import Fraction


def first_hit_values(n, edges, boundary):
    neighbors = [dict() for _ in range(n)]
    for i,j,weight in edges:
        weight = Fraction(weight)
        if weight < 0:
            raise ValueError('Nonnegative weights required')
        if weight == 0:
            continue
        neighbors[i][j] = neighbors[i].get(j,Fraction(0)) + weight
        if i != j:
            neighbors[j][i] = neighbors[j].get(i,Fraction(0)) + weight
    # This is the same component/anchor contract as harmonic interpolation.
    seen = set()
    for start in range(n):
        if start in seen:
            continue
        component = [start]
        seen.add(start)
        for i in component:
            for j in neighbors[i]:
                if j not in seen:
                    seen.add(j)
                    component.append(j)
        if not any(i in boundary for i in component):
            raise ValueError('Each component needs an absorbing boundary')
    unknown = [i for i in range(n) if i not in boundary]
    rows = []
    for i in unknown:
        degree = sum(neighbors[i].values())
        transition = {j:weight/degree for j,weight in neighbors[i].items()}
        # First step: h_i = sum_unknown P_ij h_j + sum_boundary P_ij b_j.
        rows.append([Fraction(i==j)-transition.get(j,0) for j in unknown]
                    + [sum(transition.get(j,0)*Fraction(value)
                           for j,value in boundary.items())])
    # Reuse the exact elimination mechanism from the harmonic-values program.
    for column in range(len(unknown)):
        pivot = next(i for i in range(column,len(rows)) if rows[i][column])
        rows[column],rows[pivot] = rows[pivot],rows[column]
        divisor = rows[column][column]
        rows[column] = [value/divisor for value in rows[column]]
        for i in range(len(rows)):
            if i != column:
                multiplier = rows[i][column]
                rows[i] = [left-multiplier*right for left,right in zip(rows[i],rows[column])]
    result = {i:Fraction(value) for i,value in boundary.items()}
    result.update({i:rows[k][-1] for k,i in enumerate(unknown)})
    return [result[i] for i in range(n)]


if __name__ == '__main__':
    path = [(0,1,2),(1,2,1)]
    print('hit A before C:',[str(value) for value in first_hit_values(3,path,{0:1,2:0})])
    print('sensor boundary 6 / 0:',[str(6*value) for value in first_hit_values(3,path,{0:1,2:0})])
    changed = [(0,1,1),(1,2,2),(2,3,1)]
    print('hit Z before U:',[str(value) for value in first_hit_values(4,changed,{0:0,3:1})])
    print('boundary levels 0 / 12:',[str(12*value) for value in first_hit_values(4,changed,{0:0,3:1})])
    print('loop leaves hit probabilities unchanged:',first_hit_values(3,path+[(1,1,7)],{0:1,2:0})
          == first_hit_values(3,path,{0:1,2:0}))
