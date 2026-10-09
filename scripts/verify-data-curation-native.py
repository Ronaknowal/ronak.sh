"""Independent references and actual library/program execution for this lesson."""
import hashlib
import importlib.metadata
import itertools
import json
import math
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT/'public/learn-code/data-curation-deduplication'
OUT = ROOT/'docs/teaching/llm-architecture-training/data-curation-deduplication-minhash-bloom-filters/native'
OUT.mkdir(exist_ok=True)
sys.path.insert(0, str(PUBLIC))
import curation_records as records
import lexical_dedup as lexical
import bloom_filter as bloom
import semantic_candidates as semantic
import audit_corpus as audit
import dedup_libraries as libraries
import numpy as np

checks = []
def check(condition, label):
    assert condition, label
    checks.append(label)

universe = tuple(range(4))
subsets = [set(c) for n in range(1,5) for c in itertools.combinations(universe,n)]
for a in subsets:
    for b in subsets:
        orderings = list(itertools.permutations(a | b))
        hits = sum(next(x for x in p if x in a) == next(x for x in p if x in b) for p in orderings)
        assert math.isclose(hits/len(orderings), len(a&b)/len(a|b), abs_tol=1e-15)
check(True, 'Every nonempty pair on a four-item universe: permutation agreement equals Jaccard')
check(lexical.jaccard(set(),set()) is None and lexical.signature(set()) is None, 'Empty sets are not an ordinary shared signature')
check(lexical.shingles('the cat sat down',2)&lexical.shingles('the dog sat down',2)=={('sat','down')}, 'Literal edited bigram intersection')
check(math.isclose(lexical.match_probability(.5,2,2),.4375), 'Band AND/OR probability from independent enumeration')
check(math.isclose(lexical.match_probability(lexical.half_probability(2,2),2,2),.5), 'Exact half crossing, distinct from heuristic knee')
check(lexical.candidate_pairs({'A':(1,2,3,4),'B':(3,4,1,2)},2,2)==set(), 'Equal tuples in different bands never collide')
try:
    lexical.candidate_pairs({'A':(1,),'B':(1,)},1,1,1)
except ValueError:
    check(True,'Oversized bucket explicitly rejects instead of silently dropping pairs')
else:
    raise AssertionError('Bucket guard missing')
chain={'A':{1,2},'B':{1,2,3},'C':{2,3}}
edges=lexical.verified_edges(itertools.combinations(chain,2),chain,.6)
check(len(edges)==2 and lexical.components(chain,edges)==[['A','B','C']] and lexical.jaccard(chain['A'],chain['C'])<.6,'Connected chain is not a similarity clique')
check(records.comparison_key('US') != records.comparison_key('us') and records.comparison_key('US',fold_case=True)==records.comparison_key('us',fold_case=True),'Case policy changes equality')
check(records.comparison_key('e\u0301')==records.comparison_key('é'),'NFC canonical equivalence')
m,k=bloom.size_filter(1000,.01)
check((m,k)==(9586,7) and (m+7)//8==1199,'Bit budget and integer hash choice')
left,right=bloom.BloomFilter(64,3),bloom.BloomFilter(64,3)
left.add('oak');right.add('elm');left.merge(right)
check('oak' in left and 'elm' in left,'Compatible OR keeps both inserted sets')
try:
    left.merge(bloom.BloomFilter(64,3,seed=18))
except ValueError:
    check(True,'Incompatible seed union rejects')
else:
    raise AssertionError('Merge config guard missing')
check(bloom.false_positive_rate(100,3,0)==0,'Empty Bloom population')
tiny=bloom.BloomFilter(16,3)
for key in ['oak','elm','ash']: tiny.add(key)
check('query-49' in tiny and not bloom.confirmed_seen('query-49',tiny,{'oak','elm','ash'}),'Actual deterministic false positive is rejected by authority')
tiny.bits[1//8] &= ~(1<<(1%8))
check('elm' not in tiny,'Clearing a shared bit causes a false negative')
data=records.load_records()
result=audit.run(data)
check((len(data),result['exact_representatives'],result['candidate_pairs'],result['verified_pairs'],len(result['kept_ids']))==(115,66,27,19,47),'Actual full corpus derived counts')
check(result['candidate_recall']==1 and len(result['cross_split_exact_groups'])>0,'Measured lexical recall and detected cross-split exact group')
sets,signatures,candidates=libraries.indexed_candidates(data)
truth={tuple(sorted((a,b))) for a,b in itertools.combinations(sets,2) if lexical.jaccard(sets[a],sets[b]) is not None and lexical.jaccard(sets[a],sets[b])>=.8}
check(all(lexical.jaccard(sets[a],sets[b])>=.8 for a,b in candidates&truth),'Library candidate exact confirmation uses original sets')
kept,removed=libraries.confirmed_stream(data)
check(len(kept)==66 and len(kept)+len(removed)==115,'Actual pybloom confirmed stream equals exact group count')
rows=[[math.cos(math.radians(a)),math.sin(math.radians(a))] for a in [0,20,40,110]]
blocks=[block for _,block in semantic.blocked_cosine(rows,2)]
check(np.allclose(np.concatenate(blocks),np.array(rows)@np.array(rows).T),'Blocked ordinary NumPy cosine equals direct product')
dt=json.loads((ROOT/'scratch/curation-datatrove-sha1/result.json').read_text())
check(sorted(dt['kept']+dt['removed'])==sorted(r['id'] for r in data),'Executed DataTrove four stages account for every input exactly once')
program_outputs={}
for name in ['curation_records.py','extraction_library.py','lexical_dedup.py','bloom_filter.py','dedup_libraries.py','semantic_candidates.py','audit_corpus.py']:
    command=[sys.executable,'-X','utf8','-B',str(PUBLIC/name)]
    if name=='audit_corpus.py': command+=['--output',str(PUBLIC/'audit-results.json')]
    process=subprocess.run(command,capture_output=True,text=True,encoding='utf-8',check=True)
    parsed=json.loads(process.stdout)
    destination=OUT/(Path(name).stem+'.json')
    destination.write_text(json.dumps(parsed,indent=2)+'\n',encoding='utf-8')
    program_outputs[name]=destination.relative_to(ROOT).as_posix()
(PUBLIC/'datatrove-results.json').write_text(json.dumps(dt,indent=2)+'\n',encoding='utf-8')
versions={name:importlib.metadata.version(name) for name in ['numpy','datasketch','pybloom-live','trafilatura','datatrove','tokenizers','orjson']}
report={'checks':checks,'versions':versions,'program_outputs':program_outputs,'datatrove':{'kept':len(dt['kept']),'removed':len(dt['removed']),'saved_run':'scratch/curation-datatrove-sha1/result.json'},'files':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in PUBLIC.iterdir() if p.is_file()}}
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'checks':len(checks),'executed_programs':len(program_outputs),'datatrove':report['datatrove']}))
