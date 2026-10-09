"""Audit exact matched manifests before comparing saved request cohorts.

The common manifest describes controls held equal. Runtime/configuration under
comparison belongs in treatment and remains visible. Every offered request must
have a receipt, including explicit pending/error/rejected/canceled outcomes.
Missing receipts block aggregate comparison instead of disappearing from counts.
"""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import re
from statistics import mean

from request_metrics import SLO, cohort_metrics, from_dict


REQUIRED = {
    'model_sha256', 'tokenizer_sha256', 'precision', 'sampler', 'cache_policy',
    'load_policy', 'quality_rule', 'metric_semantics', 'stop_policy', 'workload',
}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode('utf8')).hexdigest()


def identity_hash(value, name):
    if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{64}', value):
        raise ValueError(f'{name} must be a SHA256 hex digest')


def validate_run(run):
    if not isinstance(run, dict):
        raise ValueError('run must be an object')
    manifest = run.get('manifest')
    if not isinstance(manifest, dict) or not REQUIRED <= manifest.keys():
        raise ValueError('common manifest is missing required controlled identities')
    canonical(manifest)  # Reject NaN/Infinity rather than normalize them away.
    for name in ['model_sha256', 'tokenizer_sha256']:
        identity_hash(manifest[name], name)
    for name in REQUIRED-{'model_sha256','tokenizer_sha256','workload'}:
        value = manifest[name]
        if not isinstance(value, (str,dict)) or not value:
            raise ValueError(f'{name} must explicitly state the held policy')
    workload = manifest['workload']
    if not isinstance(workload, list) or not workload:
        raise ValueError('declare the complete nonempty offered workload')
    ids = set()
    for row in workload:
        if not isinstance(row, dict):
            raise ValueError('workload row must be an object')
        rid = row.get('request_id')
        if not isinstance(rid, str) or not rid.strip() or rid in ids:
            raise ValueError('workload IDs must be nonempty and unique')
        ids.add(rid)
        prompt = row.get('prompt')
        if not isinstance(prompt, str):
            raise ValueError('literal prompt string required')
        expected = hashlib.sha256(prompt.encode('utf8')).hexdigest()
        if row.get('prompt_sha256') != expected:
            raise ValueError('prompt UTF-8 hash does not match literal prompt')
        tokens = row.get('prompt_ids')
        if not isinstance(tokens, list) or not tokens or any(type(t) is not int or t < 0 for t in tokens):
            raise ValueError('exact nonempty prompt IDs required')
        cap = row.get('cap')
        if type(cap) is not int or cap < 1:
            raise ValueError('comparison fixture requires a positive output cap')
        arrival = row.get('arrival_offset_s')
        if isinstance(arrival, bool) or not isinstance(arrival, (int,float)) or not math.isfinite(arrival) or arrival < 0:
            raise ValueError('declare finite offered arrival offset')
    treatment = run.get('treatment')
    if not isinstance(treatment, dict) or not isinstance(treatment.get('name'), str) or not treatment['name']:
        raise ValueError('explicit treatment name required')
    identity_hash(treatment.get('runtime_sha256'), 'treatment runtime_sha256')
    if not isinstance(treatment.get('configuration'), dict):
        raise ValueError('retain the complete treatment configuration object')
    canonical(treatment)
    records = run.get('traces')
    if not isinstance(records, list):
        raise ValueError('traces must be an array')
    traces = [from_dict(row) for row in records]
    got = [row.request_id for row in traces]
    if len(got) != len(set(got)) or set(got)-ids:
        raise ValueError('duplicate or undeclared request receipt')
    window = run.get('window')
    if not isinstance(window, dict) or set(window) != {'start','end','cutoff'}:
        raise ValueError('window needs exactly start, end and cutoff')
    slo = SLO(**run.get('slo', {}))
    # Callers use elapsed arrival offsets, avoiding cross-run wall-clock origins.
    expected_arrivals = {row['request_id']:row['arrival_offset_s'] for row in workload}
    for trace in traces:
        if trace.arrival != expected_arrivals[trace.request_id]:
            raise ValueError('actual offered arrival differs from controlled workload')
        if not window['start'] <= trace.arrival < window['end']:
            raise ValueError('all declared offered requests must be in the cohort window')
    # Validate clock/window semantics even when receipts are missing.
    summary = cohort_metrics(traces, window['start'], window['end'], window['cutoff'], slo)
    missing = sorted(ids-set(got))
    return traces, summary, missing


def compare_runs(left, right):
    _, left_summary, left_missing = validate_run(left)
    _, right_summary, right_missing = validate_run(right)
    fields = set(left['manifest']) | set(right['manifest'])
    differences = [key for key in sorted(fields)
                   if key not in left['manifest'] or key not in right['manifest']
                   or canonical(left['manifest'][key]) != canonical(right['manifest'][key])]
    for field in ('window', 'slo'):
        if canonical(left[field]) != canonical(right[field]):
            differences.append(field)
    audit = {
        'left_manifest_sha256':digest(left['manifest']),
        'right_manifest_sha256':digest(right['manifest']),
        'held_fields_differ':differences,
        'missing_receipts':{'left':left_missing, 'right':right_missing},
        'treatments':{'left':left['treatment'], 'right':right['treatment']},
    }
    if differences or left_missing or right_missing:
        return {'comparable':False, 'audit':audit,
                'raw_traces':{'left':left['traces'], 'right':right['traces']},
                'comparison':None}
    lrows = {r['request_id']:r for r in left_summary['rows']}
    rrows = {r['request_id']:r for r in right_summary['rows']}
    paired = []
    for rid in lrows:
        a,b = lrows[rid],rrows[rid]
        complete_pair = a['observed_outcome'] == b['observed_outcome'] == 'completed'
        delta = None
        if complete_pair:
            delta = b['terminal_latency_s']-a['terminal_latency_s']
        paired.append({'request_id':rid, 'left':a, 'right':b,
                       'completed_pair':complete_pair,
                       'right_minus_left_terminal_s_completed_pair_only':delta})
    deltas = [p['right_minus_left_terminal_s_completed_pair_only'] for p in paired if p['completed_pair']]
    return {
        'comparable':True, 'audit':audit,
        'left_cohort':left_summary, 'right_cohort':right_summary, 'paired_rows':paired,
        'completed_pair_count':len(deltas),
        'mean_terminal_delta_s_completed_pairs_only':mean(deltas) if deltas else None,
    }


def example():
    """Literal calculation fixture; not acquired native benchmark data."""
    prompt = 'illustrative'
    workload = [{'request_id':rid,'prompt':prompt,
                 'prompt_sha256':hashlib.sha256(prompt.encode()).hexdigest(),
                 'prompt_ids':[11,12], 'cap':2, 'arrival_offset_s':0.0}
                for rid in ['A','B','C']]
    manifest = {'model_sha256':'0'*64, 'tokenizer_sha256':'1'*64,
                'precision':'synthetic:no model', 'sampler':{'name':'supplied'},
                'cache_policy':'cold', 'load_policy':'open simultaneous supplied arrivals',
                'quality_rule':'supplied boolean fixture', 'metric_semantics':'local content receive and terminal elapsed seconds',
                'stop_policy':{'cap':2,'rule':'supplied fixture'}, 'workload':workload}
    traces = [
        {'request_id':'A','clock_domain':'fixture','arrival':0.0,'admitted':0.0,
         'content_event_times':[.2,.4],'terminal':.5,'outcome':'completed','quality_pass':True},
        {'request_id':'B','clock_domain':'fixture','arrival':0.0,'admitted':0.0,
         'content_event_times':[.3,.6],'terminal':.8,'outcome':'completed','quality_pass':True},
        {'request_id':'C','clock_domain':'fixture','arrival':0.0,'terminal':0.0,'outcome':'rejected'},
    ]
    left = {'manifest':manifest, 'treatment':{'name':'supplied-left','runtime_sha256':'2'*64,'configuration':{}},
            'traces':traces, 'window':{'start':0,'end':2,'cutoff':2},
            'slo':{'first_output_s':.25,'terminal_s':1,'first_output_clock':'content_event'}}
    right = copy.deepcopy(left)
    right['treatment']['name'] = 'supplied-right'
    right['traces'][0]['terminal'] = .6
    result = compare_runs(left,right)
    assert result['comparable']
    assert result['left_cohort']['offered'] == 3
    assert result['left_cohort']['good'] == 1
    assert result['completed_pair_count'] == 2
    assert math.isclose(result['mean_terminal_delta_s_completed_pairs_only'], .05)
    confounded = copy.deepcopy(right)
    confounded['manifest']['cache_policy'] = 'warm'
    assert not compare_runs(left,confounded)['comparable']
    missing = copy.deepcopy(right)
    missing['traces'].pop()
    assert compare_runs(left,missing)['audit']['missing_receipts']['right'] == ['C']
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--left', type=Path)
    parser.add_argument('--right', type=Path)
    args = parser.parse_args()
    if (args.left is None) != (args.right is None):
        parser.error('provide both --left and --right, or neither for the finite example')
    result = example() if args.left is None else compare_runs(
        json.loads(args.left.read_text(encoding='utf8')),
        json.loads(args.right.read_text(encoding='utf8')))
    print(json.dumps(result, indent=2, allow_nan=False))
