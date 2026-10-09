"""Independent finite supplied-state/source checks; no scientific imports or fits."""
from pathlib import Path
from fractions import Fraction as F
import csv, hashlib, json, math, re, sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
OWNER = HERE.parent
DESIGN = OWNER / 'design-completion'
OUT = HERE / 'finite-checks.json'
if OUT.exists():
    raise RuntimeError('Preserve independent once-execution receipt')
checks = []
def bind(p):
    p = Path(p)
    if not p.is_absolute(): p = ROOT / p
    raw = p.read_bytes()
    return {'path': p.relative_to(ROOT).as_posix(), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
def check(name, ok, evidence):
    checks.append({'name': name, 'pass': bool(ok), 'evidence': evidence})
def guard(item):
    got = bind(item['path'])
    check('source ' + item['path'], all(got[k] == item[k] for k in ('bytes','sha256')), {'expected':item,'actual':got})
def load(p): return json.loads(p.read_text(encoding='utf-8'))
author = load(DESIGN/'author-ready.json')
check('exact assigned author packet', bind(DESIGN/'author-ready.json')['sha256'] == 'b37eb34b446c2b567f1c6a57d4ce121ecc6d3b7629ea206a4a77eb90601e87b6', bind(DESIGN/'author-ready.json'))
identity = load(DESIGN/'source-identity.json')
for item in identity['bindings']: guard(item)
check('118 selected bindings', len(identity['bindings'])==118, len(identity['bindings']))
for item in author['fullContracts']: guard(item)
conservation = load(OWNER/'source-conservation.json')
check('28 original copy pairs', len(conservation['preserved'])==28, len(conservation['preserved']))
for pair in conservation['preserved']:
    a,b=bind(pair['original']['path']),bind(pair['copy']['path'])
    check('conserved pair '+a['path'], a['sha256']==b['sha256']==pair['original']['sha256']==pair['copy']['sha256'] and a['bytes']==b['bytes']==pair['original']['bytes']==pair['copy']['bytes'], {'original':a,'copy':b})
first,resumed = load(OWNER/'partial-checkpoint.json'),load(OWNER/'resumed-partial-checkpoint.json')
for item in first['bindings']+resumed['additive']: guard(item)
for name,sha in [('partial-checkpoint.json','6d404276fd9a19ca63f7f24313ec84061b326c7f5e97257d4eae43b46d004ffe'),('resumed-partial-checkpoint.json','33e4eb0e165015912088bc722ea61bf8294359956f3aaa677c6a99cda2771c72')]:
    check('immutable '+name,bind(OWNER/name)['sha256']==sha,bind(OWNER/name))
delta=load(DESIGN/'design-composition-deltas.json')
body=(DESIGN/'reading-flow-design.md').read_text(encoding='utf-8')
reverse=body[:body.index('## Effective complete design composition')]
for row in reversed(delta['replacements']): reverse=reverse.replace(row['after'],row['before'])
reverse += delta['removedPartialBoundary']
check('exact predecessor inverse',hashlib.sha256(reverse.encode()).hexdigest()==delta['predecessor']['sha256'],hashlib.sha256(reverse.encode()).hexdigest())
vis=(DESIGN/'visual-and-investigation-contracts.md').read_text(encoding='utf-8')
programmes=(DESIGN/'programs-and-practice.md').read_text(encoding='utf-8')
check('66 actual job identities', [int(x) for x in re.findall(r'^\*\*D(\d\d)\.',vis,re.M)]==list(range(1,67)), 'D01-D66')
check('12 complete route identities', [int(x) for x in re.findall(r'^\*\*N(\d+) —',programmes,re.M)]==list(range(1,13)), 'N1-N12')
check('24 solved identities', re.findall(r'^\*\*([A-X]) —',programmes,re.M)==[chr(65+i) for i in range(24)], 'A-X')
def pred(w,h): return [sum(w[c]*h[c][j] for c in range(len(w))) for j in range(len(h[0]))]
def half(x,y): return sum((a-b)**2 for a,b in zip(x,y))/2
h=[[F(1),F(0),F(1)],[F(0),F(1),F(1)]]
w=[[F(2),F(1)],[F(1),F(3)],[F(0),F(2)]]
x=[[F(2),F(1),F(3)],[F(1),F(3),F(4)],[F(0),F(2),F(2)]]
check('canonical row component feature product', [pred(row,h) for row in w]==x, {'H':h,'W':w,'X':x})
g=[[sum(a*b for a,b in zip(left,right)) for right in h] for left in h]
p=[[sum(a*b for a,b in zip(row,pattern)) for pattern in h] for row in x]
check('cached CD gram cross identity',g==[[2,1],[1,2]] and p==[[5,4],[5,7],[2,4]],{'G':g,'P':p})
cd=[]
for cross in p:
    row=[F(1),F(1)]
    for c in range(2): row[c]=max(F(0),row[c]-(sum(row[t]*g[t][c] for t in range(2))-cross[c])/g[c][c])
    cd.append(row)
check('fresh cyclic coordinates',cd==[[2,1],[2,F(5,2)],[F(1,2),F(7,4)]],cd)
check('sweep differs from simultaneous row optimum',half(x[1],pred(cd[1],h))==F(3,4) and half(x[1],pred(w[1],h))==0,{'sweep':F(3,4),'optimum':0})
hc=[[F(1),F(0)],[F(1),F(1)]]
check('clipping LS is not NNLS',half([0,1],pred([0,1],hc))==F(1,2) and half([0,1],pred([0,F(1,2)],hc))==F(1,4),{'clippedHalfLoss':F(1,2),'NNLSHalfLoss':F(1,4)})
for a in [F(1,2),F(1),F(2)]:
    z=5*a/(2*a+1)
    f=(z-2)**2
    q=(a-2)**2+(2*a-4)*(z-a)+(2+1/a)*(z-a)**2/2
    check('touching scalar MM a='+str(a),q-f==(z-a)**2/(2*a) and f<=q<=(a-2)**2,{'z':z,'f':f,'q':q,'gap':q-f})
check('l2 slope and curvature scalar', max(F(0),F(1)-((1-2)+1+1)/(1+1))==F(1,2),{'optimum':F(1,2),'objective':F(7,4)})
for s,target in [(F(1),F(51,10)),(F(2),F(117,20)),(F(1,2),F(27,5))]:
    penalty=F(9,10)/s+F(6,5)*s+3
    check('dimension scaled penalty '+str(s),penalty==target,penalty)
check('NNDSVD negative-pair selection',F(16,25)>F(9,25) and 5*F(16,25)==F(16,5),{'positive':F(9,25),'negative':F(16,25),'scaled':F(16,5)})
support=load(OWNER/'design-foundation-arithmetic.json')['supportFixture']['matrix']
det=lambda a: a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0])
check('actual diagonal support witness and rank three',all(support[i][i]==1 for i in range(4)) and all(support[i][j]*support[j][i]==0 for i in range(4) for j in range(i+1,4)) and det([row[:3] for row in support[:3]])==1 and all(support[0][j]-support[1][j]+support[2][j]-support[3][j]==0 for j in range(4)),support)
for gain,target in [(F(1,2),F(3,16)),(F(1),F(3)),(F(2),F(19))]:
    t=min(F(1),max(F(0),(gain+1)/2))
    check('simplex gain '+str(gain),half([gain*v for v in [2,1,3]],pred([t,1-t],h))==target,{'t':t,'halfLoss':target})
check('normalizing cone is not simplex optimum',half([2,1,3],pred([F(2,3),F(1,3)],h))==F(28,9),F(28,9))
check('fresh online encoding differs from history',half([2,1,3],pred([F(10,9),F(13,9)],[[2,0,1],h[1]]))==F(2,9),{'freshHalfLoss':F(2,9),'oldHalfLoss':2})
raw=(ROOT/'src/learn/data/nmf-data.js').read_text(encoding='utf-8')
data,end=json.JSONDecoder().raw_decode(raw.split('export const NMF_DIGITS = ',1)[1])
rows=list(csv.DictReader((ROOT/'public/learn-assets/nmf/digits-300.csv').open(encoding='utf-8',newline='')))
check('complete JSON export and 300 raw rows',len(rows)==300 and len(data['test'])==60 and len(data['dictionary'])==8 and len(data['activations'])==60,{'keys':list(data),'CSVColumns':list(rows[0]),'dictionaryShape':[len(data['dictionary']),len(data['dictionary'][0])],'activationShape':[len(data['activations']),len(data['activations'][0])]})
check('fixed /16 row feature dimensions',data['scale']==16 and all(len(v)==64 for v in data['dictionary']) and all(len(v)==8 for v in data['activations']) and all(len(v['pixels'])==64 for v in data['test']),data['splitSizes'])
selected=[]
max_gain=0
disagreements=0
for i,row in enumerate(data['test']):
    weights=data['activations'][i]; patterns=data['dictionary']; reconstruction=pred(weights,patterns)
    max_gain=max(max_gain,max(reconstruction[j]+weights[c]*patterns[c][j] for c in range(8) for j in range(64)))
    coefficient=max(range(8),key=lambda c:weights[c])
    mass=max(range(8),key=lambda c:weights[c]*sum(patterns[c]))
    disagreements += coefficient!=mass
    if row['sourceRow'] in (242,256):
        observed=[v/16 for v in row['pixels']]
        removed=[reconstruction[j]-weights[7]*patterns[7][j] for j in range(64)]
        selected.append({'sourceRow':row['sourceRow'],'rawF35':row['pixels'][35],'reconstructedF35':reconstruction[35],'maximumFeature':max(range(64),key=reconstruction.__getitem__),'maximum':max(reconstruction),'C8Amount':weights[7],'beforeMSE':2*half(observed,reconstruction)/64,'afterMSE':2*half(observed,removed)/64,'coefficientMax':coefficient+1,'contributionMax':mass+1})
check('raw dictionary common ruler',math.isclose(max(v for r in data['dictionary'] for v in r),1.389323550924926) and max_gain<4,{'dictionaryMaximum':max(v for r in data['dictionary'] for v in r),'allAllowedGain2Maximum':max_gain})
check('coefficient contribution rankings differ 16 of 60',disagreements==16,disagreements)
check('selected exact source addresses',len(selected)==2 and selected[0]['sourceRow']==242 and selected[0]['rawF35']==16 and selected[0]['maximumFeature']==35 and selected[0]['C8Amount']==0 and selected[1]['sourceRow']==256 and selected[1]['maximumFeature']==26 and selected[1]['coefficientMax']==7 and selected[1]['contributionMax']==8,selected)
check('changed C8 removal source sums',math.isclose(selected[1]['beforeMSE'],.02758816154887481) and math.isclose(selected[1]['afterMSE'],.0732625383196997),selected[1])
# Direct scale witness clarifies the sole review finding, not a solver experiment.
residual=[3,4]
L=half(residual,[0,0]); norm=math.sqrt(sum(v*v for v in residual)); mse=2*L/2
check('explicit metric conversion witness',L==12.5 and norm==5 and mse==12.5 and math.sqrt(2*L)==norm,{'residual':residual,'halfLoss':L,'FrobeniusNorm':norm,'MSE':mse,'sqrtHalfLoss':math.sqrt(L),'RMSE':math.sqrt(mse)})
result={'status':'PASS' if all(c['pass'] for c in checks) else 'FAIL_RETAINED','scope':'Independent standard-library byte/JSON/CSV and exact supplied finite arithmetic only; no fits, original mains, scientific checkers, or imported scientific dependencies','source':bind(Path(__file__)),'python':sys.version,'checks':checks,'selectedSavedRows':selected,'executedOnce':True}
def enc(value):
    if isinstance(value,F): return {'fraction':str(value),'decimal':float(value)}
    raise TypeError(type(value).__name__)
OUT.write_text(json.dumps(result,indent=2,default=enc)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'checks':len(checks),'passed':sum(c['pass'] for c in checks),'failed':[c['name'] for c in checks if not c['pass']],'output':str(OUT),'resultSha256':bind(OUT)['sha256']}))
