"""Different-reviewer complementary algebra and exact content conservation; no fits."""
import hashlib
import json
import math
from pathlib import Path
import sys
import torch

ROOT=Path(__file__).resolve().parents[1]
TOPIC=ROOT/'docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods'
PUBLIC=ROOT/'public/learn/examples/rlaif-methods'
sys.path.insert(0,str(PUBLIC))
from preference_losses import ipo_loss, log_odds, orpo_loss
from feedback_learning import soft_preference_loss
from finite_preferences import identity_tilt
checks=[]
def check(value,label):
    assert value,label
    checks.append(label)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def close(a,b,label,tol=1e-9): check(abs(float(a)-float(b))<=tol,label)
packet=TOPIC/'content-inputs.json'
check(sha(packet)=='1a55ef2ba622ffd7c8a25ef9db4649c4803522d2305ee52a72bfc36d124ff240','original exact content packet')
inputs=json.loads(packet.read_text())['inputs']
for p,r in inputs.items(): check(sha(ROOT/p)==r['sha256'],'content binding: '+p)
dtype=torch.float64
# Coordinate changes with unequal response lengths: common log-score offsets
# cancel only after converting their sequence sums to their own means.
for tau in [.17,.61,1.3]:
    p=torch.tensor([-2.1,-7.4,-6.8,-4.3],dtype=dtype,requires_grad=True)
    r=torch.tensor([-3.,-6.,-5.,-5.],dtype=dtype,requires_grad=True)
    n=torch.tensor([2.,5.,7.,3.],dtype=dtype)
    loss,m,parts=ipo_loss(p,r,n,2,tau)
    g=torch.autograd.grad(loss,(p,r),allow_unused=True)
    expected=torch.cat((m-1/(2*tau),-(m-1/(2*tau))))/n
    check(torch.allclose(g[0],expected,atol=1e-12,rtol=0),'unequal-length IPO chain rule')
    check(g[1] is None,'reference detached')
    shift=torch.tensor([.7,-.3,.7,-.3],dtype=dtype)*n
    loss2,m2,_=ipo_loss(p+shift,r,n,2,tau)
    check(torch.allclose(m,m2,atol=1e-12,rtol=0),'common per-pair mean gain shifts cancel')
    close(loss,loss2,'IPO shifted objective')
    # Swap the two entire pairs, preserving chosen-first collator convention.
    order=[1,0,3,2]
    perm,_,_=ipo_loss(p[order],r[order],n[order],2,tau)
    close(loss,perm,'IPO pair-order invariance')
for q in [.07,.36,.82]:
    for gap in [-3.4,.24,2.7]:
        g=torch.tensor(gap,dtype=dtype,requires_grad=True)
        a=soft_preference_loss(g/2,-g/2,q)
        b=soft_preference_loss(-g/2,g/2,1-q)
        close(a,b,'soft-label response-identity exchange')
        d=torch.autograd.grad(a,g,create_graph=True)[0]
        dd=torch.autograd.grad(d,g)[0]
        probability=1/(1+math.exp(-gap))
        close(d,probability-q,'soft BCE first derivative')
        close(dd,probability*(1-probability),'soft BCE strictly positive curvature')
for a,b in [(-3.7,-.014),(-.007,-2.8),(-1e-9,-.7)]:
    z=torch.tensor([a,b],dtype=dtype,requires_grad=True)
    loss,m,penalty=orpo_loss(z[0],z[1],.23)
    gradient=torch.autograd.grad(loss,z)[0]
    s=1/(1+math.exp(float(m)))
    expected=[-1-.23*s/(-math.expm1(a)),.23*s/(-math.expm1(b))]
    for actual,target in zip(gradient,expected):
        close(actual,target,'ORPO near-boundary analytic gradient',1e-6)
    reverse=log_odds(z[1])-log_odds(z[0])
    close(m,-reverse,'ORPO identity reversal negates contrast coordinate')
# A nonuniform behavior and zero-reference support test the full finite tilt,
# beyond the author's uniform published-matrix fixture.
matrix=torch.tensor([[.5,.8,.2],[.2,.5,.65],[.8,.35,.5]],dtype=dtype)
behavior=torch.tensor([.2,.5,.3],dtype=dtype)
ref=torch.tensor([.4,0.,.6],dtype=dtype)
scores,pi=identity_tilt(matrix,behavior,ref,.37)
check(pi[1]==0,'reference-zero action excluded')
close(pi.sum(),1,'supported tilt normalization')
supported=[0,2]
u=scores[supported]-.37*(pi[supported]/ref[supported]).log()
close(u[0],u[1],'supported first-order multiplier is constant')
order=[2,0,1]
s2,p2=identity_tilt(matrix[order][:,order],behavior[order],ref[order],.37)
check(torch.allclose(p2,pi[order],atol=1e-12,rtol=0),'finite tilt respects action identity permutation')
# Recompute native mask denominators directly from saved actual trainer batches.
native=json.loads((PUBLIC/'observations/native-results.json').read_text())
for row in native['results']:
    check(row['optimizer_updates']==1,'retained native single update')
    check(row['start_state_sha256']==native['reference_state_sha256'],'native common initial state')
    if row['method']=='ORPO':
        b=row['native_batch']; att=b['chosen_attention_mask']; labels=b['chosen_labels']
        count=sum(sum(bool(x) and bool(y) for x,y in zip(mask[:-1],mask[1:])) for mask in att)
        completion=sum(sum(x!=-100 for x in lab[1:]) for lab in labels)
        check(count==row['details']['full_prompt_target_count']==137,'actual prompt-inclusive denominator')
        check(completion==row['details']['response_target_count']==74,'actual completion denominator')
result={'status':'passed','reviewer':'root','author':'multimodal_reviewer','conditions':len(checks),
        'checks':checks,'fits':0,'optimizer_updates':0,'neural_generations':0,
        'inputs':{str(packet.relative_to(ROOT)).replace('\\','/'):sha(packet),
                  str(Path(__file__).relative_to(ROOT)).replace('\\','/'):sha(Path(__file__))}}
output=TOPIC/'content-root-checks.json'
with output.open('x',encoding='utf8') as f: json.dump(result,f,indent=2);f.write('\n')
print(json.dumps({'conditions':len(checks),'fits':0,'updates':0,'generations':0}))
