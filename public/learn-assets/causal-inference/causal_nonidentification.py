from fractions import Fraction as F

# U is equally likely zero/one and X=U. Y=1[V < risk(U,X)] with independent V~Uniform(0,1).
# Both models agree whenever X=U, the cells that observation can reveal.
models = {
    'A': [[F(1, 5), F(9, 10)], [F(1, 10), F(4, 5)]],
    'B': [[F(1, 5), F(1, 10)], [F(9, 10), F(4, 5)]],
}
observed_tables = []
for name, risk in models.items():
    observed = {(x, y): F(1, 2) * (risk[x][x] if y else 1-risk[x][x])
                for x in [0, 1] for y in [0, 1]}
    observed_tables.append(observed)
    do_risks = [sum(risk[u][x] for u in [0, 1]) / 2 for x in [0, 1]]
    print(name, 'observed:', {key: str(value) for key, value in observed.items()})
    print(name, 'do risks:', list(map(str, do_risks)), 'ATE:', do_risks[1]-do_risks[0])
assert observed_tables[0] == observed_tables[1]
assert all(value > 0 for value in observed_tables[0].values())
