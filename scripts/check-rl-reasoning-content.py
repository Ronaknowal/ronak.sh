"""Author's content/scientific-output checks. Never fit or generate neural text."""
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public/learn-code/rl-reasoning'
TOPIC=ROOT/'docs/teaching/llm-architecture-training/rl-for-reasoning-deepseek-r1-style'
sys.path.insert(0,str(PUBLIC))
import sequence_policy as tree
from reasoning_checks import check_trace,gsm_reward
from reasoning_evaluate import pass_at_k,budget_prefix
from reasoning_sampling import group_probabilities,no_success_upper_bound,success_probability
conditions=[]
def check(value,name):
    assert value,name
    conditions.append(name)
def close(a,b):return math.isclose(a,b,abs_tol=1e-10,rel_tol=1e-10)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
protocol=json.loads((PUBLIC/'observations/scratch/protocol.json').read_text())
for name,h in protocol['source_sha256'].items():check(sha(PUBLIC/name)==h,'prospective scientific source '+name)
for name in ['alice-train.txt','alice-heldout.txt','alice-provenance.json']:
    check((PUBLIC/name).read_bytes()==(ROOT/'public/learn-code/causal-language-modeling'/name).read_bytes(),'exact prerequisite '+name)
summary=json.loads((PUBLIC/'observations.json').read_text())
for item in summary['sources']:check(sha(PUBLIC/item['path'])==item['sha256'],'original output '+item['path'])
total_attempts=0
for file in sorted((PUBLIC/'observations/scratch').glob('evaluation-*.json')):
    data=json.loads(file.read_text());correct=0;derivation=0
    check(len(data['rows'])==40 and data['draws']==16,'complete fixed evaluation '+file.name)
    for row in data['rows']:
        a,b,c=map(int,row['id'].split('-'))
        check(row['truth']==(a+b)*c,'reference '+file.name+'/'+row['id'])
        for attempt in row['attempts']:
            expected=check_trace(a,b,c,attempt['text'],attempt['terminated'])
            check(all(attempt[key]==value for key,value in expected.items()),'recorded checker fields '+file.name+'/'+row['id'])
            check(attempt['correct']==bool(expected['reward']) and attempt['tokens']==sum(attempt['mask']), 'mask/outcome '+file.name+'/'+row['id'])
            correct+=expected['reward'];derivation+=expected['derivation_correct'];total_attempts+=1
    check(close(data['summary']['mean']['pass1'],correct/640),'literal pass1 '+file.name)
    check(derivation==0,'recorded derivations all invalid '+file.name)
    if '-rl-80.' in file.name or '-warm-0.' in file.name:check(correct==0,'terminal RL/warm zero '+file.name)
    if '-sft-80.' in file.name:check(correct==(0 if '-17-' in file.name else 1),'terminal SFT outcomes '+file.name)
native=json.loads((PUBLIC/'observations/native/report.json').read_text())
for key,text_key in [('train_rewards','completion'),('heldout','text')]:
    for row in native[key]:
        check(row['reward']==gsm_reward(row[text_key],row['reference'])*row['terminated'],'native exact checker '+key+'/'+row['id'])
check(len(native['train_rewards'])==16 and len(native['heldout'])==32,'native denominators')
check(not native['weights_changed'] and native['saved_reload_exact'],'native no-signal persistence')
check(native['before_digest']==native['after_digest'],'tensor identity')
values={'tree_J':tree.exact_gradient(tree.INITIAL)[0],
 'tree_derivation_J':tree.exact_gradient(tree.INITIAL,True)[0],
 'root_gradient':tree.exact_gradient(tree.INITIAL)[1][0],
 'sample_group_sd':math.sqrt(1/3),'group_advantage':.5/(math.sqrt(1/3)+.0001),
 'group':group_probabilities(.1,8),'zero256_bound':no_success_upper_bound(256),
 'nucleus_point5':success_probability(top_p=.5)['success_probability'],
 'reduction_response':2.,'reduction_pooled':14/6,'reduction_sequence':7.,
 'practice1_final':.6*.2+.4*.7,'practice1_process':.4*.7,
 'practice2_J':.3*.9+.7*.2,'practice2_gradient':.3*(.9-(.3*.9+.7*.2)),
 'practice4_KL_derivative':.8*.2*math.log(4),'practice6_failure':.98**16,
 'practice6_bound':no_success_upper_bound(16),'practice9_pass3':pass_at_k(10,3,3),
 'practice10_budget':budget_prefix([{'tokens':4},{'tokens':7},{'tokens':3}],8),
 'curve16_base':1-.8**16,'curve16_changed':((1-.2**16)+(1-.99**16))/2}
check(close(values['tree_J'],.53) and close(values['tree_derivation_J'],.4),'hand tree expected returns')
check(all(close(a,b) for a,b in zip(values['root_gradient'],[-.066,.135,-.069])),'hand exact root derivative')
check(close(values['nucleus_point5'],1),'specified truncation changes support')
text=(TOPIC/'lesson.md').read_text(encoding='utf8')
figures=re.findall(r'<!-- visual:(D\d+) -->',text)
check(figures==[f'D{i:02}' for i in range(1,28)],'all ordered visual placements')
programs=re.findall(r'<!-- program:([^ ]+) -->',text)
check(len(programs)==9 and len(set(programs))==9,'seven owned and two reused complete programs')
for name in programs:compile((PUBLIC/name).read_text(encoding='utf8'),name,'exec');check(True,'compiles '+name)
headings=re.findall(r'^## (\d+)\. ',text,re.M)
check(headings==[str(i) for i in range(1,19)],'continuous manuscript and distinct endings')
practice=text.split('## 14. Independent practice')[1].split('## 15.')[0]
check(len(re.findall(r'^### \d+\.',practice,re.M))==14 and practice.count('**Solution.**')==14,'all independent solved practice')
manifest=json.loads((ROOT/'src/learn/data/lesson-manifest.json').read_text())
scope=json.loads((TOPIC.parent/'pretraining-alignment-scope.json').read_text())
planned={row['id'] for row in scope['topics'] if row['source'] is None}
links=re.findall(r'/learn/path/full-curriculum/([a-z0-9-]+)\?',text)
for target in links:
    check(target in manifest or (target in planned and (ROOT/f'src/learn/data/curriculum/blueprints/{target}.js').exists()),'existing curriculum destination '+target)
versions={name:importlib.metadata.version(name) for name in ['torch','transformers','trl','datasets','accelerate','tokenizers','safetensors','numpy']}
requirements=dict(line.strip().split('==') for line in (PUBLIC/'requirements.txt').read_text().splitlines() if line.strip())
for name,version in requirements.items():check(versions[name].split('+')[0]==version,'actual dependency '+name)
result=dict(status='passed',conditions=len(conditions),fits=0,neural_generation=0,
            independently_recomputed_attempts=total_attempts,values=values,versions=versions,
            manuscript_sha256=sha(TOPIC/'lesson.md'),source_sha256={p.name:sha(p) for p in PUBLIC.glob('*.py')})
(TOPIC/'content-author-checks.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in result.items() if k not in ['values','source_sha256']}))
