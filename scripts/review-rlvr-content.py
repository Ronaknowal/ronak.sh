"""Different-reviewer saved-data and scalar checks; no model or scientific replay."""
import ast
import hashlib
import importlib.util
import itertools
import json
import math
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
PROGRAMS = ROOT / 'public/learn/examples/rlvr'
PACKET = TOPIC / 'content-notation-successor/inputs.json'
EXPECTED = 'f6cae4ec1e28d0aa3565e5f651ac631dbee330137890fa5a36da6943f979203a'
checks = []

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def check(name, value):
    if not value:
        raise AssertionError(name)
    checks.append(name)

def close(left, right, tolerance=1e-10):
    return math.isclose(left, right, rel_tol=tolerance, abs_tol=tolerance)

def read(name):
    return json.loads((TOPIC / name).read_text(encoding='utf8'))

check('effective packet identity', digest(PACKET) == EXPECTED)
packet = json.loads(PACKET.read_text(encoding='utf8'))
for name, expected in packet['files'].items():
    check('bound source ' + name, digest(ROOT / name) == expected)
for path in sorted(PROGRAMS.glob('*.py')):
    ast.parse(path.read_text(encoding='utf8'))
    check('complete Python parse ' + path.name, True)
sys.path.insert(0, str(PROGRAMS))
import verifier_contracts as verifier
import evaluate_rollouts as evaluation
# Both modules' top levels are standard-library definitions. No main/run called.
for response, gold, accepted in [('#### .750','3/4',True), ('#### 3/4 kg','3/4',False), ('#### .750',None,None), ('#####6','19',False), ('#### 2\n#### 1/2','.5',True)]:
    check('changed extraction ' + repr((response,gold)), verifier.final_verdict(response,gold)['accepted'] is accepted)
proof=('imp-intro','h',('and','P',('and','Q','R')),('and-intro',('and-right',('and-right',('assume','h'))),('and-left',('assume','h'))))
check('nested proof changed goal', verifier.derive(proof)==('implies',('and','P',('and','Q','R')),('and','R','P')))
check('changed finite test separates product', verifier.arithmetic_expression('x*y',1,2)==2 and verifier.arithmetic_expression('x+y',1,2)==3)
check('response mean target probability',close((math.log(.25)+math.log(.5))/2,-1.0397207708399179))
for p,g in [(.4,5),(.17,3),(.7,6)]:
    mean=loo=0
    for xs in itertools.product([0,1], repeat=g):
        weight=p**sum(xs)*(1-p)**(g-sum(xs)); baseline=sum(xs)/g
        mean += weight*sum((x-baseline)*(x-p) for x in xs)/g
        loo += weight*sum((x-(sum(xs)-x)/(g-1))*(x-p) for x in xs)/g
    check(f'independent group enumeration G{g}',close(mean,(1-1/g)*p*(1-p)) and close(loo,p*(1-p)))
for rho,a,expected,derivative in [(.7,2,1.4,2),(1.3,-2,-2.6,-2),(1.3,2,2.4,0),(.7,-2,-1.6,0)]:
    f=lambda r:min(r*a,min(max(r,.8),1.2)*a)
    check('changed signed clipping '+str((rho,a)),close(f(rho),expected) and close((f(rho+1e-6)-f(rho-1e-6))/2e-6,derivative,1e-8))
for p,q in [(.6,.3),(.8,.5),(.23,.74)]:
    theta=math.log(p/(1-p))
    def f(t):
        r=1/(1+math.exp(-t)); return r*math.log(r/q)+(1-r)*math.log((1-r)/(1-q))
    derivative=p*(1-p)*math.log(p*(1-q)/(q*(1-p)))
    check('changed exact KL '+str((p,q)),close((f(theta+1e-5)-f(theta-1e-5))/2e-5,derivative,1e-8))
check('practice KL numbers',close(.6*math.log(2)+.4*math.log(4/7),.19204199316179815) and close(.3*math.log(.5)+.7*math.log(1.75),.18378689738681217))
check('changed mixed event',close(1-.2**5-.8**5,.672))
check('changed noisy acceptance/precision',close(.3*.9+.7*.2,.41) and close(.27/.41,27/41))
check('changed oracle conditional means',close(.2*8/7+.8*(-2/7),0) and close(.9*8/7+.1*(-2/7),1))
for n,c,k in [(10,3,3),(8,2,4),(6,1,2),(5,0,3),(5,5,3)]:
    sets=list(itertools.combinations(range(n),k))
    expected=sum(any(x<c for x in subset) for subset in sets)/len(sets)
    check('subset enumeration '+str((n,c,k)),close(evaluation.pass_at_k(n,c,k),expected))
check('unavailable passK',evaluation.pass_at_k(3,1,4) is None)
study=read('scientific-evidence/observations/tiny-study.json')
metrics=read('scientific-evidence/observations/metrics.json')
check('all original seed arms',[(r['seed'],r['arm']) for r in study['runs']]==[(s,a) for s in [17,29,43] for a in ['group-scaled-grpo','unscaled-centred-grpo','verified-sample-sft']])
totals={'tokens':0,'responses':0,'updates':0,'skipped':0,'eval_responses':0}
results=[]
for run,saved in zip(study['runs'],metrics['runs']):
    key=f"{run['seed']} {run['arm']}"
    warm=next(w for w in study['warm_runs'] if w['seed']==run['seed'])
    check(key+' shared start/reference',run['start_sha256']==run['reference_sha256']==warm['warm_sha256'])
    check(key+' schedule',len(run['steps'])==48 and [v['step'] for v in run['evaluations']]==[0,16,32,48])
    tokens=sum(len(s['response_ids']) for step in run['steps'] for s in step['samples'])
    updates=sum(step['update']['updates'] for step in run['steps'])
    skipped=sum(step['update']['updates']==0 for step in run['steps'])
    mixed=sum(0<sum(s['verdict']['accepted'] for s in step['samples'][begin:begin+4])<4 for step in run['steps'] for begin in [0,4])
    check(key+' saved work',tokens==saved['work']['training_generated_tokens'] and updates==run['optimizer_updates']==saved['work']['optimizer_updates'])
    check(key+' saved mixed groups',mixed==sum(x['mixed_groups'] for x in saved['history']))
    counts=[]
    for point,recorded in zip(run['evaluations'],saved['evaluations']):
        samples=[s for row in point['records'] for s in row['samples']]
        passes=sum(s['verdict']['accepted'] for s in samples)
        check(key+f" checkpoint {point['step']} counts",len(samples)==96 and passes==recorded['pass_count'])
        counts.append(passes); totals['eval_responses']+=len(samples)
    results.append({'seed':run['seed'],'arm':run['arm'],'heldout_counts':counts,'mixed_groups':mixed,'updates':updates})
    totals['tokens']+=tokens; totals['updates']+=updates; totals['skipped']+=skipped
    totals['responses']+=sum(len(step['samples']) for step in run['steps'])
check('all measured aggregate claims',totals=={'tokens':28537,'responses':3456,'updates':670,'skipped':50,'eval_responses':3456})
check('all terminal negative outcomes',[r['heldout_counts'][-1] for r in results]==[1,0,0,0,0,0,0,0,1])
check('no initial passes',all(r['heldout_counts'][0]==0 for r in results))
check('unscaled midpoint not final winner',results[1]['heldout_counts'][2:]==[2,0])
check('warm total targets',sum(step['targets'] for run in study['warm_runs'] for step in run['history'])==26770)
sft=study['runs'][2]; first=sft['steps'][0]
check('actual practice12 skip',first['update']=={'updates':0,'accepted_ids':[],'loss':None,'skip':'no accepted response'} and first['optimizer_updates_total']==0)
martha=next(s for s in first['samples'] if s['record_id']=='gsm8k-train-70')
check('actual practice14 exact response',martha['response']=='#####6' and martha['response_ids']==[35,35,35,35,35,54,257] and martha['ended_with_EOS'] and martha['length']==7 and martha['verdict']['parsed']=='6' and martha['verdict']['reason']=='numeric mismatch')
flan=read('scientific-evidence/observations/flan.json')
check('all pretrained outcomes retained',len(flan['records'])==12 and flan['accepted']==0 and all(r['verdict']['reason']=='missing final marker' and r['prediction']!=r['gold'] for r in flan['records']))
continuation=read('scientific-evidence/native-continuation.json')
check('original failed native status retained',read('scientific-evidence/observations/trl.status.json')['status']=='failed' and continuation['original_native_status']=='failed' and continuation['original_update_equality_passed'] is False)
check('continuation has no added training/generation',all(continuation[k]==0 for k in ['continuation_optimizer_updates','continuation_generated_responses','continuation_warm_updates']))
check('continuation native and reference conserved',continuation['native_parameters_unchanged'] and continuation['reference_parameters_unchanged'] and continuation['reference_gradients_absent'])
check('separate own step acceptance',continuation['own_step_analytical_audit']['consistent'] and not continuation['own_step_analytical_audit']['cross_implementation_equality_passed'])
for archive in ['rlvr-programs.zip','rlvr-observations.zip']:
    with zipfile.ZipFile(PROGRAMS/archive) as z:
        check(archive+' CRC',z.testzip() is None)
        if archive=='rlvr-programs.zip':
            for name in z.namelist():
                if name.endswith('.py'):
                    check('archive canonical '+name,z.read(name)==(PROGRAMS/Path(name).name).read_bytes())
report={'passed':True,'conditions':len(checks),'checks':checks,'scope':'Independent scalar derivations and saved-data aggregate/identity/archive reading only; no model, inference, optimizer, fit, generation or scientific-stage replay. Imported only standard-library verifier and metric definitions.', 'packet_sha256':EXPECTED,'manuscript_sha256':digest(TOPIC/'lesson.md'),'results':results,'totals':totals,'script_sha256':digest(Path(__file__))}
out=TOPIC/'content-review-checks.json'
if out.exists():
    raise FileExistsError(out)
out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({'passed':True,'conditions':len(checks),'report':str(out),'sha256':digest(out)}))
