import math
import random
import statistics as stats

def chain(seed, start, scale=.12, draws=6000, warmup=1000):
    rng = random.Random(seed)
    def logp(x):
        return 9*math.log(x)+3*math.log1p(-x) if 0 < x < 1 else -math.inf
    x, result = start, []
    for i in range(draws):
        y = x + rng.gauss(0, scale)
        if math.log(rng.random()) < min(0, logp(y)-logp(x)):
            x = y
        if i >= warmup:
            result.append(x)  # repeats remain here
    return result

def split_chains(chains):
    n = len(chains[0]) // 2
    if len(chains) < 2 or n < 2 or any(len(c) != len(chains[0]) for c in chains):
        raise ValueError("Use equal-length chains with at least four draws")
    return [half for c in chains for half in (c[:n], c[-n:])]

def rank_normalize(chains):
    n = len(chains[0])
    flat = [x for c in chains for x in c]
    order = sorted(range(len(flat)), key=lambda i: flat[i])
    ranks = [0.0] * len(flat)
    first = 0
    while first < len(order):
        last = first + 1
        while last < len(order) and flat[order[last]] == flat[order[first]]:
            last += 1
        rank = (first + 1 + last) / 2  # average one-based rank for ties
        for j in range(first, last):
            ranks[order[j]] = rank
        first = last
    normal = stats.NormalDist()
    # Corrected paper equation 14: PLUS 1/4 in the denominator.
    z = [normal.inv_cdf((r-3/8)/(len(flat)+1/4)) for r in ranks]
    return [z[i:i+n] for i in range(0, len(z), n)]

def basic_rhat(chains):
    n = len(chains[0])
    within = stats.mean(stats.variance(c) for c in chains)
    between = n*stats.variance([stats.mean(c) for c in chains])
    if within == 0:
        return math.inf if between else math.nan  # no misleading all-constant 1
    return math.sqrt(((n-1)*within/n + between/n) / within)

def rank_folded_rhat(chains):
    split = split_chains(chains)
    median = stats.median(x for c in split for x in c)
    folded = [[abs(x-median) for x in c] for c in split]
    return max(basic_rhat(rank_normalize(split)), basic_rhat(rank_normalize(folded)))

def batch_mcse(chains, function, batch_size=100):
    # Nonoverlapping batch means: an APPROXIMATION requiring batches long
    # relative to dependence, enough batches, and stable chains. No ESS claim.
    variance_of_chain_means = []
    for c in chains:
        if len(c) % batch_size or len(c) // batch_size < 2:
            raise ValueError("Use at least two complete equal-sized batches")
        batches = [stats.mean(function(x) for x in c[i:i+batch_size]) for i in range(0, len(c), batch_size)]
        variance_of_chain_means.append(stats.variance(batches)/len(batches))
    return math.sqrt(sum(variance_of_chain_means)) / len(chains)

chains = [chain(seed, start) for seed, start in zip([11, 22, 33, 44], [.1, .3, .7, .9])]
flat = [x for c in chains for x in c]
print("chains", len(chains), "draws each", len(chains[0]))
print("mean", f"{stats.mean(flat):.4f}", "posterior SD", f"{stats.stdev(flat):.4f}")
print("rank/folded R-hat", f"{rank_folded_rhat(chains):.4f}")
print("batch MCSE mean", f"{batch_mcse(chains, lambda x:x):.4f}")
print("batch MCSE tail", f"{batch_mcse(chains, lambda x:x>.7):.4f}")