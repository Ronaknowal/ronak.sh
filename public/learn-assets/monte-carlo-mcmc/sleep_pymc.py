"""Maintained NUTS for the same NIG prior and paired Normal likelihood.
Install: python -m pip install pymc==6.3.2 arviz==1.3.0 arviz-stats==1.3.2 scipy==1.18.1
Run: python sleep_pymc.py
Four sequential CPU chains; 1000 tuning and 2000 retained draws each.
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

import pymc as pm
import arviz
import arviz_stats as azs
from scipy.stats import t
from importlib.metadata import version


def main():
    describe_input()
    with pm.Model():
        variance=pm.InverseGamma('variance',alpha=A0,beta=B0)
        mu=pm.Normal('mu',mu=M0,sigma=pm.math.sqrt(variance/K0))
        pm.Normal('differences',mu=mu,sigma=pm.math.sqrt(variance),observed=DIFFERENCES)
        trace=pm.sample(draws=2000,tune=1000,chains=4,cores=1,random_seed=214,
                        nuts_sampler='pymc',nuts={'target_accept':.9},progressbar=False,
                        compute_convergence_checks=True,return_inferencedata=True)
    mu_draws=np.asarray(trace.posterior['mu'])
    v_draws=np.asarray(trace.posterior['variance'])
    if mu_draws.shape!=(4,2000) or v_draws.shape!=(4,2000):
        raise ValueError('unexpected posterior chain/draw shape')
    print('sample_stat_names=',sorted(trace.sample_stats.data_vars))
    print(f'divergences={int(np.asarray(trace.sample_stats["diverging"]).sum())}')
    for name in ['tree_depth','n_steps','reached_max_treedepth']:
        if name in trace.sample_stats:
            values=np.asarray(trace.sample_stats[name])
            print(f'{name}: shape={values.shape}; sum={values.sum()}; max={values.max()}')
    exact_tail=t.sf(2,df=2*AN,loc=MN,scale=sqrt(BN/(AN*KN)))
    for name,values,exact in [('mu',mu_draws,MN),
                              ('P(mu>2)',(mu_draws>2).astype(float),exact_tail),
                              ('variance',v_draws,BN/(AN-1))]:
        # The first axis contains chains. Preserve it for split/rank diagnostics.
        rank=float(azs.rhat(values,chain_axis=0,draw_axis=1,method='rank'))
        folded=float(azs.rhat(values,chain_axis=0,draw_axis=1,method='folded'))
        bulk=float(azs.ess(values,chain_axis=0,draw_axis=1,method='bulk'))
        tail=float(azs.ess(values,chain_axis=0,draw_axis=1,method='tail',prob=(.05,.95)))
        mcse=float(azs.mcse(values,chain_axis=0,draw_axis=1,method='mean'))
        print(f'{name}: shape={values.shape}; estimate={values.mean():.9f}; '
              f'exact={exact:.9f}; posterior_SD={values.std(ddof=1):.9f}; '
              f'mean_MCSE={mcse:.9f}; signed_error={values.mean()-exact:.9f}; '
              f'error_over_MCSE={abs(values.mean()-exact)/mcse:.3f}; '
              f'rank_Rhat={rank:.6f}; folded_Rhat={folded:.6f}; '
              f'bulk_ESS={bulk:.1f}; tail_ESS={tail:.1f}')
    for package in ['numpy','pymc','arviz','arviz-stats','scipy']:
        print(f'{package}={version(package)}')


if __name__=='__main__':
    main()
