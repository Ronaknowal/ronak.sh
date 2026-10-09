"""Fixed HMC for ten observed paired contrasts; NumPy 2.3.5.
Install: python -m pip install numpy==2.3.5
Run: python sleep_hmc.py
Identity momentum covariance; fixed epsilon .08 and 16 leapfrog steps.
No adaptation: 2000 initial transitions discarded, 8000 retained per chain.
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


def potential_gradient(q):
    mu, tau = q
    if not np.isfinite(q).all() or abs(tau)>350:
        return float('inf'), np.array([float('nan'),float('nan')])
    inv_v = exp(-2*tau)
    a = B0 + .5*np.sum((DIFFERENCES-mu)**2) + .5*K0*(mu-M0)**2
    coefficient = N + 2*A0 + 1
    potential = coefficient*tau + a*inv_v
    gradient = np.array([(N*(mu-DBAR)+K0*(mu-M0))*inv_v,
                         coefficient-2*a*inv_v])
    return potential, gradient


def leapfrog(q, momentum, epsilon, steps):
    q, r = q.copy(), momentum.copy()
    _, gradient = potential_gradient(q)
    r -= .5*epsilon*gradient
    for step in range(steps):
        q += epsilon*r
        _, gradient = potential_gradient(q)
        if not np.isfinite(gradient).all():
            return q, r
        r -= (.5 if step==steps-1 else 1)*epsilon*gradient
    return q, -r  # momentum flip makes the proposal an involution


def chain(start, seed, discarded=2000, retained=8000, epsilon=.08, steps=16):
    rng = np.random.default_rng(seed)
    q = np.array(start,dtype=float)
    samples = np.empty((retained,2))
    accepted = invalid = 0
    for i in range(discarded+retained):
        r = rng.normal(size=2)
        proposal, final_r = leapfrog(q,r,epsilon,steps)
        initial_u,_ = potential_gradient(q)
        proposed_u,_ = potential_gradient(proposal)
        delta = proposed_u + .5*final_r@final_r - initial_u - .5*r@r
        uniform = rng.random()
        finite = np.isfinite(delta) and np.isfinite(proposal).all()
        accept = finite and log(max(uniform,np.finfo(float).tiny)) < min(0.,-delta)
        if accept:
            q = proposal
        if i>=discarded:
            accepted += bool(accept)
            invalid += not finite
            samples[i-discarded] = q  # retain every transition, including rejection
    return samples, accepted, invalid


def main():
    describe_input()
    starts=[(-1,.7),(0,-.5),(2,0),(4,.5)]
    records=[]
    for start,seed in zip(starts,range(214,218)):
        samples,accepted,invalid=chain(start,seed)
        records.append(samples)
        print(f'start_mu_tau={start}; seed={seed}; retained={len(samples)}; '
              f'accepted={accepted}; invalid={invalid}; acceptance={accepted/len(samples):.6f}')
    draws=np.stack(records)
    independent_chain_batch_report(draws[:,:,0],'mu',MN)
    independent_chain_batch_report((draws[:,:,0]>2).astype(float),'P(mu>2)',.06953901318684069)
    independent_chain_batch_report(np.exp(2*draws[:,:,1]),'variance',BN/(AN-1))
    print(f'numpy={np.__version__}; epsilon={.08}; steps={16}; discarded={2000}; retained={8000}')


if __name__=='__main__':
    main()
