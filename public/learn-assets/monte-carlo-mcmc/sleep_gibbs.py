"""NIG Gibbs and iid ancestral posterior draws for the same sleep contrasts.
Install: python -m pip install numpy==2.3.5
Run: python sleep_gibbs.py
One sweep samples mu given the old variance, then variance given the new mu.
"""
from math import exp, log, sqrt
import numpy as np

# Original R datasets sleep, paired by person ID; drug2 minus drug1, hours.
# Source CSV SHA256 3b27360f282bc31de8368de72f339561f70d324ffaf7aa69c9326467ea4b4fe6.
# Derived numbers and upstream source are supplied under R's GPL v2 terms.
# Keep sleep.R, sleep.Rd, R-datasets-DESCRIPTION.in and R-COPYING with the data.
PAIRS = np.array([[.7,1.9],[-1.6,.8],[-.2,1.1],[-1.2,.1],[-.1,-.1],
                  [3.4,4.4],[3.7,5.5],[.8,1.6],[0,4.6],[2,3.4]])
PERSON_IDS = np.arange(1,11)
DIFFERENCES = PAIRS[:,1] - PAIRS[:,0]
M0, K0, A0, B0 = 0., 1., 2., 2.
N = DIFFERENCES.size
DBAR = DIFFERENCES.mean()
SSE = np.sum((DIFFERENCES-DBAR)**2)
KN = K0 + N
MN = (K0*M0 + N*DBAR) / KN
AN = A0 + N/2
BN = B0 + SSE/2 + K0*N*(DBAR-M0)**2 / (2*KN)


def describe_input():
    print('person_ids=', PERSON_IDS.tolist())
    print('paired_measurements_hours=', PAIRS.tolist())
    print('differences_drug2_minus_drug1=', DIFFERENCES.tolist())
    print(f'n={N}; mean={DBAR:.9f}; SSE={SSE:.9f}')
    print(f'posterior_m={MN:.9f}; kappa={KN:.1f}; alpha={AN:.1f}; beta={BN:.9f}')
    print(f'exact_mu_mean={MN:.9f}; exact_variance_mean={BN/(AN-1):.9f}; '
          f'exact_mu_Student_df={2*AN:.1f}; exact_mu_Student_scale={sqrt(BN/(AN*KN)):.9f}; '
          f'exact_predictive_Student_scale={sqrt(BN*(KN+1)/(AN*KN)):.9f}')


def independent_chain_batch_report(draws, name, exact):
    values = np.asarray(draws, dtype=float)
    if values.ndim != 2 or not np.isfinite(values).all():
        raise ValueError('expected finite chain-by-draw values')
    print(f'{name}: chain_shape={values.shape}; estimate={values.mean():.9f}; '
          f'exact_reference={exact:.9f}; signed_error={values.mean()-exact:.9f}; '
          f'pooled_draw_SD={values.std(ddof=1):.9f}')
    for size in [50,100,200]:
        if values.shape[1] % size:
            raise ValueError('batch size must divide retained length')
        batches = values.reshape(values.shape[0],-1,size).mean(axis=2)
        chain_mean_variances = batches.var(axis=1, ddof=1) / batches.shape[1]
        combined = sqrt(chain_mean_variances.sum()) / values.shape[0]
        print(f'  block={size}; blocks_per_chain={batches.shape[1]}; '
              f'chain_means={values.mean(axis=1).tolist()}; '
              f'chain_MCSE={np.sqrt(chain_mean_variances).tolist()}; '
              f'combined_MCSE={combined:.9f}; error_over_MCSE={abs(values.mean()-exact)/combined:.3f}')


def conditional_chain(start,seed,discarded=2000,retained=8000):
    rng=np.random.default_rng(seed)
    mu,v=start
    if v<=0 or not np.isfinite(start).all():
        raise ValueError('initial variance must be positive and state finite')
    draws=np.empty((retained,2))
    for i in range(discarded+retained):
        mu=rng.normal(MN,sqrt(v/KN))
        rate=BN+.5*KN*(mu-MN)**2
        v=1/rng.gamma(shape=AN+.5,scale=1/rate)
        if i>=discarded:
            draws[i-discarded]=[mu,v]
    return draws


def ancestral(seed=414,count=32000):
    rng=np.random.default_rng(seed)
    variance=1/rng.gamma(shape=AN,scale=1/BN,size=count)
    mu=rng.normal(MN,np.sqrt(variance/KN))
    return np.column_stack((mu,variance))


def main():
    describe_input()
    starts=[(-1,.25),(0,1),(2,4),(4,9)]
    records=[]
    for start,seed in zip(starts,range(314,318)):
        draws=conditional_chain(start,seed)
        records.append(draws)
        print(f'start_mu_variance={start}; seed={seed}; discarded={2000}; retained={len(draws)}')
    chains=np.stack(records)
    independent_chain_batch_report(chains[:,:,0],'Gibbs mu',MN)
    independent_chain_batch_report((chains[:,:,0]>2).astype(float),'Gibbs P(mu>2)',.06953901318684069)
    independent_chain_batch_report(chains[:,:,1],'Gibbs variance',BN/(AN-1))
    iid=ancestral()
    for name,values,exact in [('iid mu',iid[:,0],MN),
                              ('iid P(mu>2)',(iid[:,0]>2).astype(float),.06953901318684069),
                              ('iid variance',iid[:,1],BN/(AN-1))]:
        mcse=values.std(ddof=1)/sqrt(values.size)
        print(f'{name}: units={values.size}; estimate={values.mean():.9f}; '
              f'exact={exact:.9f}; iid_MCSE={mcse:.9f}')
    print(f'numpy={np.__version__}; Gibbs_conditional_shape={AN+.5}; ancestral_marginal_shape={AN}')


if __name__=='__main__':
    main()
