"""Observed sleep pairs: stdlib summaries matched with SciPy1.18.1.

Keep paired_t_scratch.py and sleep-pairs.csv beside this file, with R source,
help, provenance and license. Measurements are increases in hours of sleep
against control for two drugs on each of10 people. Difference is drug2-drug1.
The recorded data do not establish random drug order or representative sampling.
The t route is model based. Sign enumeration also requires a justified exchange
or symmetry null, not merely a population mean0.
"""
from pathlib import Path
import csv
from decimal import Decimal
import hashlib
from itertools import product
import numpy as np
from scipy import stats
from paired_t_scratch import paired_summary


def read_pairs(filename):
    path=Path(filename)
    expected='3b27360f282bc31de8368de72f339561f70d324ffaf7aa69c9326467ea4b4fe6'
    if hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
        raise ValueError('the unchanged offline paired dataset is required')
    with path.open(newline='',encoding='utf-8') as stream:
        rows=list(csv.DictReader(stream))
    if [int(row['id']) for row in rows]!=list(range(1,11)):
        raise ValueError('preserve all ten unique paired source IDs')
    drug1=np.array([float(row['drug1_extra_hours']) for row in rows])
    drug2=np.array([float(row['drug2_extra_hours']) for row in rows])
    tenths=[int((Decimal(row['drug2_extra_hours'])-Decimal(row['drug1_extra_hours']))*10) for row in rows]
    return drug1,drug2,tenths


if __name__=='__main__':
    drug1,drug2,tenths=read_pairs(Path(__file__).with_name('sleep-pairs.csv'))
    differences=np.array(tenths,dtype=float)/10
    report=paired_summary(differences)
    result=stats.ttest_rel(drug2,drug1,alternative='two-sided',nan_policy='raise')
    interval=result.confidence_interval(confidence_level=.95)
    np.testing.assert_allclose([report['t'],report['two_sided_p'],report['low'],report['high']],
                               [result.statistic,result.pvalue,interval.low,interval.high],rtol=1e-9,atol=1e-10)
    print('paired IDs',list(range(1,11)))
    print('drug2-drug1 hours',differences.tolist())
    print(f"n={report['n']} mean={report['mean']:.6f} SSE={report['sse']:.6f} sd={report['sd']:.6f} se={report['se']:.6f}")
    print(f"df={report['df']} t={report['t']:.6f} two-sided p={report['two_sided_p']:.6f}")
    print(f"CI95 hours=[{report['low']:.6f}, {report['high']:.6f}]")
    print('scratch/library statistic, p and interval agreement',True)
    # Integer tenths make boundary membership exact for1024 labelled assignments.
    totals=[sum(sign*value for sign,value in zip(signs,tenths)) for signs in product([-1,1],repeat=10)]
    extreme=sum(abs(value)>=abs(sum(tenths)) for value in totals)
    permutation=stats.permutation_test((differences,),np.mean,permutation_type='samples',
                                       n_resamples=np.inf,alternative='two-sided',vectorized=True)
    np.testing.assert_allclose(permutation.pvalue,extreme/len(totals),rtol=0,atol=1e-15)
    print(f"sign assignments={len(totals)} extreme={extreme} exact conditional p={extreme/len(totals):.6f}")
    print('zero difference retains both source-label sign assignments',tenths.count(0)==1)
    # A prespecified1hour criterion asks a different question than zero difference.
    shifted=paired_summary(differences,null_mean=1.)
    one_sided=stats.ttest_1samp(differences,popmean=1.,alternative='greater')
    print(f"criterion1hour: t={shifted['t']:.6f} greater p={one_sided.pvalue:.6f}")
    minutes=paired_summary(differences*60)
    np.testing.assert_allclose([minutes['t'],minutes['two_sided_p']],[report['t'],report['two_sided_p']],atol=1e-10)
    print(f"minutes mean={minutes['mean']:.6f} SE={minutes['se']:.6f} CI95=[{minutes['low']:.6f}, {minutes['high']:.6f}]")
