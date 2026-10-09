"""Finite reference fixtures for later runtime review, without model/science replay.

Only Python standard-library arithmetic is used. Frozen scientific results are
neither loaded nor regenerated. This does not certify an unfinished runtime.
"""
from fractions import Fraction
import hashlib
import itertools
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
OUT = TOPIC / 'runtime-independent-preparation'
OUT.mkdir(exist_ok=True)
checks = []

def check(name, condition):
    assert condition, name
    checks.append(name)

def near(a, b, tolerance=1e-10):
    return math.isclose(a, b, abs_tol=tolerance, rel_tol=tolerance)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def moments(rows, field):
    mean = sum(row['weight'] * row[field] for row in rows)
    second = sum(row['weight'] * row[field] ** 2 for row in rows)
    return {'mean': float(mean), 'second_moment': float(second),
            'variance': float(second - mean ** 2)}

def group_fixture(p, size, epsilon):
    rows = []
    for binary in itertools.product([0, 1], repeat=size):
        rewards = [Fraction(x) for x in binary]
        average = sum(rewards) / size
        scores = [r-p for r in rewards]
        centered = [r-average for r in rewards]
        weight = p ** sum(binary) * (1-p) ** (size-sum(binary))
        pop_std = math.sqrt(float(sum(x*x for x in centered) / size))
        sample_std = pop_std * math.sqrt(size/(size-1))
        raw = sum(r*s for r,s in zip(rewards,scores)) / size
        same = sum(a*s for a,s in zip(centered,scores)) / size
        loo = sum((rewards[i] - (sum(rewards)-rewards[i])/(size-1))*scores[i]
                  for i in range(size)) / size
        pop = float(same) / (pop_std+epsilon) if pop_std else 0.
        sample = float(same) / (sample_std+epsilon) if sample_std else 0.
        rows.append({'outcomes':binary,'weight':weight,'raw':raw,'same_group':same,
                     'leave_one_out':loo,'population_scaled':pop,'sample_scaled':sample})
    measured = {name:moments(rows,name) for name in
                ['raw','same_group','leave_one_out','population_scaled','sample_scaled']}
    check(f'probability mass {p}/{size}/{epsilon}', sum(r['weight'] for r in rows)==1)
    check(f'exact raw expectation {p}/{size}',near(measured['raw']['mean'],float(p*(1-p))))
    check(f'exact centered expectation {p}/{size}',near(measured['same_group']['mean'],float((1-Fraction(1,size))*p*(1-p))))
    check(f'exact LOO expectation {p}/{size}',near(measured['leave_one_out']['mean'],float(p*(1-p))))
    check(f'LOO variance scale {p}/{size}',near(measured['leave_one_out']['variance'],measured['same_group']['variance']*(size/(size-1))**2))
    return {'p':float(p),'G':size,'epsilon':epsilon,'convention':'All homogeneous normalized groups have coefficient zero; estimator is mean(A_i*(Y_i-p)).',
            'moments':measured,'rows':[{k:(float(v) if isinstance(v,Fraction) else v) for k,v in r.items()} for r in rows]}

groups = [group_fixture(p,g,eps) for p,g,eps in
          [(Fraction(1,2),2,0.),(Fraction(1,5),3,0.),(Fraction(3,5),4,0.),(Fraction(3,5),4,.0001)]]
check('LOO can increase variance versus raw reward score',groups[0]['moments']['leave_one_out']['variance']>groups[0]['moments']['raw']['variance'])

def kl_fixture(p,q,old):
    probs=[p,1-p]; refs=[q,1-q]; olds=[old,1-old]; scores=[1-p,-p]
    k3=[r/x-math.log(r/x)-1 for x,r in zip(probs,refs)]
    exact=sum(x*math.log(x/r) for x,r in zip(probs,refs))
    exact_gradient=sum(x*s*(math.log(x/r)+1) for x,r,s in zip(probs,refs,scores))
    detached_gradient=sum(o*(1-r/x)*s for o,r,x,s in zip(olds,refs,probs,scores))
    weighted_gradient=sum(o*(x/o)*(k+(1-r/x))*s for o,x,r,k,s in zip(olds,probs,refs,k3,scores))
    theta=math.log(p/(1-p))
    def route(t,weighted):
        x=1/(1+math.exp(-t)); pp=[x,1-x]
        return sum(o*(a/o if weighted else 1)*(r/a-math.log(r/a)-1) for o,a,r in zip(olds,pp,refs))
    fd=lambda weighted:(route(theta+1e-5,weighted)-route(theta-1e-5,weighted))/2e-5
    check(f'plain detached derivative {p}/{q}/{old}',near(fd(False),detached_gradient,1e-8))
    check(f'ratio-weighted derivative {p}/{q}/{old}',near(fd(True),weighted_gradient,1e-8))
    check(f'weighted restores finite exact gradient {p}/{q}/{old}',near(weighted_gradient,exact_gradient))
    check(f'weighted restores current expectation {p}/{q}/{old}',near(route(theta,True),exact))
    return {'current':probs,'reference':refs,'old_sampling_weights':olds,'k3_per_action':k3,
            'exact_current_KL':exact,'old_sample_plain_k3':route(theta,False),
            'old_sample_ratio_weighted_k3':route(theta,True),'exact_gradient':exact_gradient,
            'plain_fixed_sample_gradient':detached_gradient,'ratio_weighted_gradient':weighted_gradient,
            'conditions':'Binary sigmoid coordinate; interior support; old and reference frozen; ratio p/old differentiates only on weighted path.'}

kls=[kl_fixture(p,q,old) for p,q,old in [(.7,.4,.7),(.7,.4,.25),(.25,.8,.6),(.4,.4,.4)]]

def normalize(rewards,epsilon):
    mean=sum(rewards)/len(rewards)
    sigma=math.sqrt(sum((r-mean)**2 for r in rewards)/len(rewards))
    return {'mean':mean,'population_std':sigma,
            'coefficients':[(r-mean)/(sigma+epsilon) if sigma+epsilon else 0 for r in rewards]}

clean=[[1,1,0],[0,1,0],[1,0,1],[0,0,1]]
masks={'one_cell':[[1,0,0],[0,0,0],[0,0,0],[0,0,0]],
       'one_row':[[1,1,1],[0,0,0],[0,0,0],[0,0,0]],
       'one_column':[[0,1,0]]*4,'whole_group':[[1,1,1]]*4}
correlations=[]
original=normalize([sum(row)/3 for row in clean],.0001)
for name,mask in masks.items():
    observed=[[int(cell!=flip) for cell,flip in zip(row,flips)] for row,flips in zip(clean,mask)]
    summary=normalize([sum(row)/3 for row in observed],.0001)
    correlations.append({'pattern':name,'clean':clean,'flip_mask':mask,'observed':observed,**summary})
check('whole-group complement negates normalized coefficients at fixed epsilon',all(near(a,-b) for a,b in zip(original['coefficients'],correlations[-1]['coefficients'])))
raw=[1,0,0,1,0];scale=1/.65;corrected=[(r-.2)/.65 for r in raw]
epsilon_cases=[]
for eps in [0.,.0001]:
    a=normalize(raw,eps);b=normalize(corrected,eps);c=normalize(corrected,eps*scale)
    check(f'scaled epsilon restores coefficient {eps}',all(near(x,y) for x,y in zip(a['coefficients'],c['coefficients'])))
    if eps:
        check('fixed epsilon magnitudes really differ',not near(a['coefficients'][0],b['coefficients'][0],1e-12))
    epsilon_cases.append({'raw':raw,'corrected':corrected,'epsilon':eps,'raw_statistics':a,'fixed_epsilon_statistics':b,'proportionate_epsilon_statistics':c})
zero=normalize([1,1,1],.0001)
check('homogeneous normalized null',zero['coefficients']==[0,0,0])

subsets=[]
for n,c,k in [(7,2,3),(9,1,4),(6,5,2),(6,0,4)]:
    combinations=list(itertools.combinations(range(n),k))
    numerator=sum(any(i<c for i in subset) for subset in combinations)
    exact=Fraction(numerator,len(combinations))
    formula=1-Fraction(math.comb(n-c,k),math.comb(n,k)) if n-c>=k else Fraction(1)
    check(f'exact subset event {n}/{c}/{k}',exact==formula)
    subsets.append({'n':n,'c':c,'k':k,'successful_subsets':numerator,'all_subsets':len(combinations),'exact':str(exact),'value':float(exact),'plug_in_IID':1-(1-c/n)**k})

# These rows are explicit contract expectations, not inferred truths about text.
# They deliberately include missing gold with otherwise valid/invalid predictions.
parser_rows=[
 {'prediction':'#### +.50','gold':'1/2','parsed':'1/2','accepted':True},
 {'prediction':'#### -0.0','gold':'0','parsed':'0','accepted':True},
 {'prediction':'#### 2\n#### 3/6','gold':'.5','parsed':'1/2','accepted':True},
 {'prediction':'#####6','gold':'19','parsed':'6','accepted':False},
 {'prediction':'#### 1/0','gold':'1','parsed':None,'accepted':False},
 {'prediction':'#### 50%','gold':'.5','parsed':None,'accepted':False},
 {'prediction':'#### 3/4 kg','gold':'3/4','parsed':None,'accepted':False},
 {'prediction':'The answer is 72','gold':'72','parsed':None,'accepted':False},
 {'prediction':'#### 72\n####','gold':'72','parsed':None,'accepted':False},
 {'prediction':'#### 72','gold':None,'parsed':'72','accepted':None},
 {'prediction':'no result','gold':None,'parsed':None,'accepted':None},
 {'prediction':'#### 72','gold':'72 clips','parsed':'72','accepted':None},
]
unknown={'all_missing_group':{'available':0,'mean':None,'std':None,'advantages':[0,0,0]},
         'one_available_sample_sd':{'rewards':[1,None,None],'available':1,'mean':1,'std':None,'advantages':[0,0,0]},
         'invalid_passk':[{'n':3,'c':1,'k':4,'expected':None},{'n':0,'c':0,'k':1,'expected':None}],
         'no_answer_passes_conditional_reasoning_fraction':None,
         'no_accepted_mass_precision':None}
acceptance=TOPIC/'content-review-acceptance.json'
check('accepted content packet identity',digest(acceptance)=='b3957dd66a6d8d7098257aea544101acfe82506e2f1e9d69e80e7a919b6b1905')
bound=json.loads(acceptance.read_text(encoding='utf8'))['files']
inputs={}
for name in ['lesson.md','content-review.md','content-review-checks.json']:
    path=TOPIC/name;rel=path.relative_to(ROOT).as_posix()
    check('unchanged teaching input '+name,digest(path)==bound[rel]);inputs[rel]=digest(path)
inputs[acceptance.relative_to(ROOT).as_posix()]=digest(acceptance)
inputs[Path(__file__).relative_to(ROOT).as_posix()]=digest(Path(__file__))
result={'status':'preliminary independent arithmetic fixtures; no runtime reviewed or accepted',
        'scope':'New finite reference expectations only. Reuses prior complete content review; zero scientific runs, model loads, inference, fits, optimizer steps or generated model samples.',
        'conditions':len(checks),'checks':checks,'estimator_moments':groups,'KL_routes':kls,
        'correlated_tests':{'baseline':original,'patterns':correlations},'epsilon_scaling':epsilon_cases,
        'subset_events':subsets,'parser_contract':parser_rows,'unknown_contract':unknown,'inputs':inputs}
output=OUT/'fixtures.json'
assert not output.exists(),output
output.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf8')
print(json.dumps({'conditions':len(checks),'sha256':digest(output),'file':str(output)}))
