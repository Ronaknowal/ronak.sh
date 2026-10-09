from fractions import Fraction as F

for overlap in [F(0), F(1, 8), F(1, 4)]:
    # Keys are the paired outcomes (Y(0),Y(1)), not independently redrawn outcomes.
    types = {(0, 0): overlap, (0, 1): F(3, 4)-overlap,
             (1, 0): F(1, 4)-overlap, (1, 1): overlap}
    marginals = [sum(pair[x]*mass for pair, mass in types.items()) for x in [0, 1]]
    # X was randomized. Evidence X=1,Y=1 therefore selects types with Y(1)=1.
    compatible = {pair: mass for pair, mass in types.items() if pair[1] == 1}
    evidence = sum(compatible.values())
    posterior = {pair: mass/evidence for pair, mass in compatible.items()}
    failure_without = sum(mass for pair, mass in posterior.items() if pair[0] == 0)
    print('overlap', overlap, '| do risks', list(map(str, marginals)),
          '| would fail without', failure_without)
    assert marginals == [F(1, 4), F(3, 4)]
    assert sum(posterior.values()) == 1
