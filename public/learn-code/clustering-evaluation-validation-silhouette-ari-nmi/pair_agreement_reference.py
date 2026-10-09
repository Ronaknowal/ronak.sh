from collections import Counter
from itertools import combinations
from math import comb
from sklearn.metrics import adjusted_rand_score, rand_score

u = [0, 0, 0, 0, 1, 1, 1, 1]
v = [0, 0, 0, 1, 0, 1, 1, 1]
cells = Counter(zip(u, v))
rows, columns = Counter(u), Counter(v)
pairs = comb(len(u), 2)
together_both = sum(comb(n, 2) for n in cells.values())
together_u = sum(comb(n, 2) for n in rows.values())
together_v = sum(comb(n, 2) for n in columns.values())
expected = together_u * together_v / pairs
upper = (together_u + together_v) / 2
ari = (together_both - expected) / (upper - expected)
agreements = sum((u[i] == u[j]) == (v[i] == v[j])
                 for i, j in combinations(range(len(u)), 2))
print("S A B M:", together_both, together_u, together_v, pairs)
print("RI:", round(agreements / pairs, 6))
print("ARI:", round(ari, 6))
print("library:", round(rand_score(u, v), 6),
      round(adjusted_rand_score(u, v), 6))
renamed = [9 if label == 0 else 4 for label in v]
print("renamed ARI:", round(adjusted_rand_score(u, renamed), 6))