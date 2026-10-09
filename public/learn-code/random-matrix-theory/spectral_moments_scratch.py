"""Enumerate a finite sign ensemble and count actual closed-walk products.

Python standard library only. Exact fractions avoid simulation uncertainty.
The four-entry sign model has n=p=2; it is not a Gaussian moment formula.
"""
from fractions import Fraction
from itertools import product
import json


def multiply(a,b):
    if not a or not b or any(len(row) != len(a[0]) for row in a) or any(len(row) != len(b[0]) for row in b) or len(a[0]) != len(b):
        raise ValueError('Use compatible nonempty rectangular matrices.')
    return [[sum(a[i][k]*b[k][j] for k in range(len(b))) for j in range(len(b[0]))] for i in range(len(a))]


def closed_walks(matrix,length):
    n = len(matrix)
    if not 1 <= n <= 4 or any(len(row) != n for row in matrix):
        raise ValueError('Use a square matrix with at most four vertices.')
    if isinstance(length,bool) or not isinstance(length,int) or not 1 <= length <= 6:
        raise ValueError('Use an integer walk length from one to six.')
    terms = []
    for vertices in product(range(n),repeat=length):
        value = Fraction(1)
        for k in range(length):
            value *= matrix[vertices[k]][vertices[(k+1)%length]]
        terms.append((vertices,value))
    return terms


def main():
    seconds = []
    off_diagonals = []
    for signs in product([-1,1],repeat=4):
        x = [[Fraction(signs[0]),Fraction(signs[1])],[Fraction(signs[2]),Fraction(signs[3])]]
        transpose = list(map(list,zip(*x)))
        gram = multiply(transpose,x)
        s = [[v/2 for v in row] for row in gram]
        square = multiply(s,s)
        seconds.append(sum(square[i][i] for i in range(2))/2)
        off_diagonals.append(s[0][1]**2)
    # Symmetric four-cycle: exactly eight oriented length-four walks around
    # the cycle have all four distinct edges; their random-sign expectation
    # vanishes. Backtracking paths repeat edges an even number of times.
    cycle = [[Fraction(int((i-j)%4 in [1,3])) for j in range(4)] for i in range(4)]
    terms = closed_walks(cycle,4)
    nonzero = [(v,t) for v,t in terms if t]
    paired = []
    unpaired = []
    for vertices,value in nonzero:
        counts = {}
        for k in range(4):
            edge = tuple(sorted((vertices[k],vertices[(k+1)%4])))
            counts[edge] = counts.get(edge,0)+1
        (paired if all(count%2 == 0 for count in counts.values()) else unpaired).append(vertices)
    report = {'signMatrices':len(seconds),
              'exactMeanTraceS2OverP':str(sum(seconds)/len(seconds)),
              'finiteSignFormula':str(1+Fraction(2-1,2)),
              'finiteGaussianFormulaForComparison':str(1+Fraction(2+1,2)),
              'exactMeanSquaredOffDiagonal':str(sum(off_diagonals)/len(off_diagonals)),
              'cycleNonzeroClosedLength4Walks':len(nonzero),
              'cycleEvenEdgeWalks':len(paired), 'cycleOddEdgeWalks':len(unpaired),
              'oneEvenWalk':paired[0], 'oneOddWalk':unpaired[0],
              }
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()
