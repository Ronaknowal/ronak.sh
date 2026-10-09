"""Evaluate a frozen cheap/fallback policy on cached, paired rows.

python evaluate_routing.py --calibration results/calibration.json --output results/routing.json
Costs: 10 per wrong final choice, plus 0.5 whenever the fallback is called.
The calibration-set global fallback error is an assumption about each routed
row, not a conditional accuracy guarantee. Test thresholds are diagnostics.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from train_decision import digest,save_json


def evaluate(cheap_correct,fallback_correct,act,indices):
    cheap=np.asarray(cheap_correct,dtype=bool)
    fallback=np.asarray(fallback_correct,dtype=bool)
    act=np.asarray(act,dtype=bool)
    final=np.where(act,cheap,fallback)
    cost=10*(~final)+.5*(~act)
    return {'n':len(act),'cheap_count':int(act.sum()),'fallback_count':int((~act).sum()),
            'coverage':float(act.mean()),'wrong_final':int((~final).sum()),
            'cheap_wrong':int((act&~cheap).sum()),'fallback_wrong':int((~act&~fallback).sum()),
            'selective_risk':float((~cheap[act]).mean()) if act.any() else None,
            'mean_cost':float(cost.mean()),'mean_cost_percentile_95':np.quantile(cost[indices].mean(-1),[.025,.975]).tolist(),
            'per_row':{'act':act.tolist(),'correct':final.tolist(),'cost':cost.tolist()}}


def run(source,output):
    data=json.loads(source.read_text())['methods']
    fallback=data['laya']
    error=1-np.mean(fallback['calibration']['per_row']['correct'])
    expected_fallback_cost=.5+10*error
    indices=np.random.default_rng(113).integers(0,120,size=(1000,120))
    correct_f=fallback['test_calibrated']['per_row']['correct']
    rows={}
    for name in ['seed-17','seed-29','seed-43','lexical']:
        rows[name]={}
        for mode in ['raw','calibrated']:
            report=data[name]['test_'+mode]
            confidence=np.max(report['probabilities'],axis=-1)
            correct=report['per_row']['correct']
            act=10*(1-confidence)<expected_fallback_cost
            rows[name][mode]={
                'primary_rule':evaluate(correct,correct_f,act,indices),
                'all_cheap':evaluate(correct,correct_f,np.ones(120,bool),indices),
                'all_fallback':evaluate(correct,correct_f,np.zeros(120,bool),indices),
                'diagnostic_thresholds':[{ 'threshold':threshold,**evaluate(correct,correct_f,confidence>=threshold,indices)}
                                         for threshold in [0,.5,.7,.8,.9,.95,1]],
            }
    save_json(output,{'calibration_sha256':digest(source),'primary_cheap_model':'seed-17',
            'fallback_error_calibration':float(error),'expected_fallback_cost':float(expected_fallback_cost),
            'rule':'act iff 10*(1-pmax) < 0.5+10*global fallback calibration error; ties fallback',
            'costs':{'wrong':10,'fallback_call':.5},'paired_bootstrap_seed':113,'resamples':1000,'methods':rows})


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--calibration',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();run(args.calibration,args.output)
