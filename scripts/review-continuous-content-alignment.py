"""Different content review: finite/saved-data checks only, no neural execution."""
from pathlib import Path
import ast
import hashlib
import itertools
import json
import math
import sys
import zipfile
from fractions import Fraction

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/teaching/llm-architecture-training/continuous-batching-pagedattention'
sys.path.insert(0, str(BASE / 'programs'))
import numpy as np
from iteration_scheduler import Job, schedule
from shared_pool import SharedPool
from paged_attention import online_reduce

checks = []
def check(value, name):
    assert value, name
    checks.append(name)
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def read(path):
    return json.loads((BASE / path).read_text(encoding='utf8'))

packet = read('content-inputs.json')
for row in packet['files']:
    check(digest(ROOT / row['path']) == row['sha256'], 'binding ' + row['path'])
for row in read('research/formatting-correspondence.json')['files']:
    before, after = ROOT / row['predecessor'], ROOT / row['path']
    check(digest(before) == row['before'] and digest(after) == row['after'], 'format identities ' + after.name)
    check(ast.dump(ast.parse(before.read_text()), include_attributes=False) == ast.dump(ast.parse(after.read_text()), include_attributes=False), 'AST preservation ' + after.name)

# Independent closed-form finish times when all finite jobs arrive together.
for lengths in [(1, 4, 2, 3, 5), (0, 3, 0, 2), (3,), ()]:
    jobs = [Job(str(i), 0, n) for i, n in enumerate(lengths)]
    for slots in [1, 2, 3]:
        for policy in ['continuous', 'static']:
            result = schedule(jobs, slots, policy)
            positive = [(str(i), n) for i, n in enumerate(lengths) if n]
            finish = {}
            if policy == 'static':
                start = 0
                for k in range(0, len(positive), slots):
                    group = positive[k:k+slots]
                    finish.update({i: start+n for i,n in group})
                    start += max(n for _,n in group)
            else:
                available = [0] * slots
                for identity, n in positive:
                    slot = min(range(slots), key=lambda i: (available[i], i))
                    available[slot] += n
                    finish[identity] = available[slot]
            check(all(result['requests'][i]['finish'] == time for i,time in finish.items()), f'closed-form schedule {lengths}/{slots}/{policy}')
            check(result['useful_work'] == sum(lengths), f'work conservation {lengths}/{slots}/{policy}')

# Three-owner partial COW, a zero-length fork, and atomic failure.
for prefix in [0, 1, 3, 4, 6]:
    pool = SharedPool(8, 3, layers=1, heads=1, width=1)
    pool.create('P')
    original = np.arange(6, dtype=float).reshape(1,1,6,1)
    pool.append('P', original, -original)
    pool.fork('P', 'C', prefix)
    pool.fork('P', 'D', prefix)
    added = np.array([17.,18.]).reshape(1,1,2,1)
    pool.append('C', added, -added)
    check(np.array_equal(pool.dense('P')[0], original), f'parent unchanged {prefix}')
    check(np.array_equal(pool.dense('D')[0], original[:,:,:prefix]), f'other child unchanged {prefix}')
    check(np.array_equal(pool.dense('C')[0], np.concatenate([original[:,:,:prefix], added],axis=2)), f'child own history {prefix}')
    pool.check_invariants()
    for identity in ['D','P','C']:
        pool.release(identity)
        pool.check_invariants()
    check(len(pool.free) == 8, f'all ownership returned {prefix}')
pool = SharedPool(2, 3, 1, 1, 1)
pool.create('P')
values = np.arange(5.).reshape(1,1,5,1)
pool.append('P', values, values)
pool.fork('P','C',4)
before = pool.snapshot()
try:
    pool.append('C', np.ones((1,1,2,1)), np.ones((1,1,2,1)))
    raise AssertionError('Expected refusal')
except MemoryError:
    check(pool.snapshot() == before, 'whole-state atomic refusal under shared tail')

# Stable global normalization with page-order and global-offset changes.
scores = np.log([2.,5.,1.])
values = np.array([[1.],[3.],[-2.]])
for shift in [-1000,0,1000]:
    for order in [(0,1),(1,0)]:
        blocks = [(scores[:2]+shift, values[:2]), (scores[2:]+shift,values[2:])]
        result = online_reduce([(np.array([]),np.empty((0,1)))] + [blocks[i] for i in order],1)
        check(abs(result['output'][0]-15/8)<1e-12, f'global denominator shift/order {shift}/{order}')
check(not online_reduce([(np.array([]), np.empty((0,1)))],1)['valid'], 'all invalid has no normalized output')

study = read('research/study-results.json')
protocol = read('research/study-protocol.json')
check(digest(BASE/'research/study-protocol.json') == study['protocol_sha256'], 'historical protocol exact')
for row in protocol['files']:
    path = BASE / ('research/programs-before-format' if row['name'].endswith('.py') else 'programs') / row['name']
    check(digest(path) == row['sha256'], 'executed source recoverable ' + row['name'])
check([len(row['prompt']) for row in protocol['requests']] == [8,12,20,32,48,64], 'actual frozen prefix lengths')
emissions = sum(map(len,study['references'].values()))
for arm in study['arms']:
    check(set(arm['outputs']) == set(study['references']), f'exact result identities {arm["budget"]}')
    for identity, ref in study['references'].items():
        row = arm['outputs'][identity]
        check(row['generated_tokens'] == ref and row['request_id'] == identity and row['status_name']=='FINISHED', f'actual keyed tokens {arm["budget"]}/{identity}')
        check(len(row['timestamps_relative']) == len(ref) and all(a<=b for a,b in zip(row['timestamps_relative'],row['timestamps_relative'][1:])), f'timestamp count/order {arm["budget"]}/{identity}')
        emissions += len(row['generated_tokens'])
    check(arm['thread_stopped'] and arm['processor_cleared'] and not arm['warmup'], f'actual lifetime {arm["budget"]}')
check(emissions == 144, 'all 144 recorded emissions accounted')
lifecycle = read('research/native_lifecycle.json')
check(lifecycle['forward_calls']==2 and set(lifecycle['outputs'])=={'short-A','short-B'}, 'pending cancellation retained separately')
check(lifecycle['post_completion_state']['remaining_result'] is None and not lifecycle['post_completion_state']['active_ids'] and not lifecycle['post_completion_state']['waiting_ids'], 'pending cancellation no fabricated terminal')

# Reconstruct new versus repeated positions independently from saved intervals.
for name, case in read('research/serving-simulation-results.json')['cases'].items():
    visited = {key:set() for key in case['requests']}
    repeated = {key:0 for key in visited}
    for iteration in case['iterations']:
        for work in iteration['work']:
            positions = set(range(work['begin'], work['begin']+work['rows']))
            overlap = len(positions & visited[work['id']])
            check(overlap == work['repeated_rows'], f'independent visited-position accounting {name}/{work["id"]}/{work["begin"]}')
            repeated[work['id']] += overlap
            visited[work['id']].update(positions)
    for identity,row in case['requests'].items():
        check(row['useful_rows']==len(visited[identity]) and row['repeated_rows']==repeated[identity], f'total logical work {name}/{identity}')

with zipfile.ZipFile(BASE/'bundle/continuous-batching-programs.zip') as archive:
    manifest = read('bundle/files.json')['files']
    check(sorted(archive.namelist()) == sorted(row['name'] for row in manifest), 'archive exact membership')
    for row in manifest:
        check(hashlib.sha256(archive.read(row['name'])).hexdigest()==row['sha256'], 'archive bytes '+row['name'])
report = {'passed':True,'scope':'Independent finite scheduler/NumPy storage/normalization and saved-data/source/archive checks. No Torch import, model construction, forward, generation, optimizer, or timing replay.','packet_sha256':digest(BASE/'content-inputs.json'),'packet_guards':len(packet['files']),'count':len(checks),'checks':checks,'script_sha256':digest(Path(__file__))}
(BASE/'content-review-alignment-checks.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:report[k] for k in ['passed','packet_guards','count']}))
