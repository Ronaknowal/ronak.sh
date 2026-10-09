"""Descriptive Kaplan–Meier calculation on the UCI follow-up records.

Run beside reliability_cohort.py and the reused survival_estimators.py, with
../data/uci-heart-failure-clinical-records.csv and its provenance file.
Requires NumPy and scikit-survival. No download or execution on import.
"""

import json
from pathlib import Path
import numpy as np
from sksurv.nonparametric import kaplan_meier_estimator
from reliability_cohort import read_followup, pre_event_count
from survival_estimators import kaplan_meier


def main():
    data=Path(__file__).resolve().parent.parent/'data'
    receipt=json.loads((data/'uci-heart-failure-clinical-records-provenance.json').read_text(encoding='utf-8'))
    rows=read_followup(data/'uci-heart-failure-clinical-records.csv',expected_sha256=receipt['csv_sha256'])
    time=np.array([r.days for r in rows])
    event=np.array([r.death_observed for r in rows],dtype=bool)
    # Published collection facts are checked, not substituted for the raw rows.
    if len(rows)!=299 or int(event.sum())!=96 or time.min()!=4 or time.max()!=285:
        raise ValueError('Raw collection counts/support differ from the declared source.')
    # The taught scratch validator expects Python bool, not NumPy scalar bool.
    scratch=kaplan_meier(tuple(r.days for r in rows),tuple(r.death_observed for r in rows))
    library_time,library_survival=kaplan_meier_estimator(event,time)
    own_time=np.array(scratch.times)
    own_survival=np.array([p.survival for p in scratch.points])
    if not np.array_equal(own_time,library_time):
        raise AssertionError('Scratch/library endpoint coordinates differ.')
    difference=float(np.max(np.abs(own_survival-library_survival)))
    if difference>1e-12:
        raise AssertionError('Matched ordinary KM curve differs beyond numerical tolerance.')
    queries=[4.,30.,90.,180.,285.]
    output={'scope':'Descriptive right-censor KM; UCI cohort only, no fitted predictor',
            'raw_csv_sha256':receipt['csv_sha256'],'subjects':len(rows),
            'observed_deaths':int(event.sum()),'right_censored':int((~event).sum()),
            'observed_endpoint_range_days':[float(time.min()),float(time.max())],
            'unique_endpoint_groups':len(scratch.points),
            'queries':[{'day':t,'pre_event_at_risk':pre_event_count(scratch,t),'km_post_event':scratch.value(t)} for t in queries],
            'rmst_through_180_days':scratch.restricted_mean(180.),
            'median_days_if_reached':scratch.median(),
            'ordinary_route':'sksurv.nonparametric.kaplan_meier_estimator(event,time)',
            'max_absolute_curve_difference':difference,
            'curve_columns':['day','pre_event_at_risk','deaths','censors','km_post_event'],
            'curve':[[p.group.time,p.group.at_risk,p.group.failures,p.group.censored,p.survival] for p in scratch.points]}
    print(json.dumps(output,indent=2,allow_nan=False))


if __name__=='__main__':
    main()
