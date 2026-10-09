"""New revision-four programs only; never execute a historical writer or fit."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.tree import DecisionTreeRegressor

root = Path(__file__).resolve().parents[1]
assets = root / 'public/learn-assets/decision-trees'
owner = root / 'docs/teaching/classical-ml-reading-flow/decision-trees-random-forests'
sys.path.insert(0, str(assets))
checks = []


def check(condition, name):
    if not bool(condition):
        raise AssertionError(name)
    checks.append(name)


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, assets / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


reg = load('regression_flow', 'regression-tree.py')
prune = load('pruning_flow', 'cost-complexity-pruning.py')
criteria = load('criteria_flow', 'tree-criteria.py')
weights = load('weight_flow', 'forest-weight-contracts.py')

# Independently centered residuals test every candidate prefix/suffix SSE.
for values in [[1,1.5,2,4,4.5,5], [1e12+v for v in [0,.125,.5,.875,1]], [3,3,3], [7]]:
    centered = np.asarray(values)-values[0]
    means, squares = reg.moments(centered)
    for end in range(1,len(values)+1):
        actual = np.asarray(values[:end])-values[0]
        oracle = np.sum((actual-actual.mean())**2)
        check(np.isclose(squares[end-1],oracle,rtol=1e-12,atol=1e-14),f'prefix SSE {values[0]}/{end}')
        suffix = centered[-end:]
        _, reversed_squares=reg.moments(centered[::-1])
        check(np.isclose(reversed_squares[end-1],np.sum((suffix-suffix.mean())**2)),f'suffix SSE {values[0]}/{end}')
X=np.arange(6.).reshape(-1,1); y=np.array([1,1.5,2,4,4.5,5])
tree=reg.RegressionTree(max_depth=1).fit(X,y)
query=np.array([[-10],[2.5],[4],[20]])
check(np.array_equal(tree.predict(query),[1.5,1.5,4.5,4.5]),'mean/equality/extrapolation')
native=DecisionTreeRegressor(max_depth=1,random_state=0).fit(X,y)
check(np.array_equal(tree.predict(query),native.predict(query)),'native fixed non-tied depth-one bridge')
check(tree.root.sse==14.5 and tree.root.left.sse+tree.root.right.sse==1,'parent and both child SSE')
for minimum in [1,2,3]:
    model=reg.RegressionTree(max_depth=None,minimum_leaf=minimum).fit(X,y)
    def leaves(node):return leaves(node.left)+leaves(node.right) if node.left else [node]
    check(all(leaf.count>=minimum for leaf in leaves(model.root)),f'both minimum children {minimum}')
constant=reg.RegressionTree().fit(np.ones((3,2)),[1,2,3])
check(constant.root.left is None and constant.root.mean==2,'constant feature has one leaf')
pure=reg.RegressionTree().fit(X,[8]*6)
check(pure.root.left is None and pure.predict([[100]])[0]==8,'pure numeric targets')
one=reg.RegressionTree().fit([[3]],[7])
check(one.predict([[4]])[0]==7,'singleton')
check(tree.predict(np.empty((0,1))).shape==(0,),'empty query shape')
tree.fit([[1],[2]],[10,20]);check(tree.root.count==2 and tree.predict([[1]])[0]==10,'refit replaces saved tree')
for bad_X,bad_y in [([[1]],[]),([[float('nan')]],[1]),([[1]],[float('inf')]),([],[]),([[1],[2]],[1e308,-1e308])]:
    try:reg.RegressionTree().fit(bad_X,bad_y)
    except (ValueError,FloatingPointError):checks.append('reject invalid schema/nonfinite/overflow')
    else:raise AssertionError('invalid training accepted')
try:one.predict([[1,2]])
except ValueError:checks.append('query schema rejection')
else:raise AssertionError('wrong query schema accepted')
forest=reg.RegressionForest(members=5,seed=4,max_depth=2).fit(X,y)
prediction=forest.predict(query)
check(np.all((prediction>=min(y))&(prediction<=max(y))),'nonnegative forest range')
check(all(len(draw)==6 for draw in forest.draws),'replacement draw count')
forest.fit(X,y);check(len(forest.trees)==5,'forest refit reset')

# Tiny exhaustive oracle is independent of the postorder weakest-link algorithm.
from decision_tree_core import BinaryTree
case_X=np.array([[1,1],[2,1],[1,3],[2,3],[4,1],[5,1],[4,3],[5,3]])
case_y=np.array([0,0,1,1,1,1,0,1])
full=BinaryTree(max_depth=None).fit(case_X,case_y).root
def enumerate_subtrees(node):
    leaf={key:value for key,value in node.items() if key not in ['left','right','feature','threshold','gain']}
    if 'left' not in node:return [leaf]
    return [leaf]+[dict(node,left=left,right=right) for left in enumerate_subtrees(node['left']) for right in enumerate_subtrees(node['right'])]
def objective(node,alpha,n):
    if 'left' not in node:
        p=node['probability'];return node['count']/n*2*p*(1-p)+alpha,1
    L,a=objective(node['left'],alpha,n);R,b=objective(node['right'],alpha,n);return L+R,a+b
subtrees=enumerate_subtrees(full);path=prune.pruning_path(full)
check(len(subtrees)==6,'six exhaustive subtree candidates')
check([(p['alpha'],p['risk'],p['leaves']) for p in path]==[(0.,0.,5),(15/128,15/32,1)],'exact weakest-link path')
for alpha in [0,.04,.1,15/128,.12,.3]:
    expected=min((objective(node,alpha,8) for node in subtrees),key=lambda pair:(round(pair[0],14),pair[1]))
    chosen=max((p for p in path if p['alpha']<=alpha),key=lambda p:p['alpha'])
    actual=objective(chosen['tree'],alpha,8)
    check(np.isclose(actual[0],expected[0]) and actual[1]==expected[1],f'pruning oracle interval/tie {alpha}')
pure_root=BinaryTree().fit([[0],[1]],[1,1]).root
check(len(prune.pruning_path(pure_root))==1,'pure pruning path')
for labels in [[0,0,1,1],[0,1,1,0],[0,1,0,1]]:
    node=BinaryTree(max_depth=None).fit(np.arange(4).reshape(-1,1),labels).root
    oracle=enumerate_subtrees(node);stages=prune.pruning_path(node)
    for stage in stages:
        best=min((objective(t,stage['alpha'],4) for t in oracle),key=lambda pair:(round(pair[0],14),pair[1]))
        actual=objective(stage['tree'],stage['alpha'],4)
        check(np.isclose(actual[0],best[0]) and actual[1]==best[1],'descendant/simultaneous weakest links')
check(np.isclose(criteria.entropy([.75,.25]),.8112781244591328),'entropy bits')
check(np.isclose(criteria.entropy([.75,.25],math.e),.5623351446188083),'entropy nats')
rare=criteria.gain_and_ratio([[0,1],[10,9]]);balanced=criteria.gain_and_ratio([[7,3],[3,7]])
check(rare[1]>balanced[1] and rare[0]<(rare[0]+balanced[0])/2<balanced[0],'gain-ratio eligibility contrast')
check(criteria.poisson_deviance([0],2)==4,'zero-count Poisson contribution')
for membership,expected,answer in [([[0,1],[1,2]],[.25,.5,.25],2.5),([[0,0,1],[2]],[1/3,1/6,.5],19/6)]:
    result=weights.query_weights(membership,3)
    check(np.allclose(result,expected) and np.isclose(result.sum(),1),'nonnegative normalized occurrence weights')
    check(np.isclose(result@np.array([1,2,5]),answer),'exact member-mean/weighted-target equivalence')
gram=weights.proximity([[1,2],[1,3],[4,3]])
check(np.all(np.linalg.eigvalsh(gram)>=-1e-12),'Gram PSD')
duplicate_gram=weights.proximity([[1,2],[1,2]])
check(np.linalg.matrix_rank(duplicate_gram)==1 and duplicate_gram[0,1]==1,'PSD need not strict; distinct input zero encoded distance')

# WDBC is inspected from the one executed export; no new fit/export here.
data=json.loads((assets/'decision-tree-wdbc-models.json').read_text())
loader=load_breast_cancer()
check(np.array_equal(data['X'],loader.data) and np.array_equal(data['y'],(loader.target==0).astype(int)),'all WDBC coordinates/positive remapping')
sets=[set(data['splits'][name]) for name in ['train','validation','test']]
check([len(s) for s in sets]==[341,114,114] and set.union(*sets)==set(range(569)),'all split IDs/counts/coverage')
check(not any(sets[i]&sets[j] for i in range(3) for j in range(i+1,3)),'split disjointness')
from sklearn.model_selection import train_test_split
development,test=train_test_split(np.arange(569),test_size=114,stratify=data['y'],random_state=42)
train,validation=train_test_split(development,test_size=114,stratify=np.asarray(data['y'])[development],random_state=43)
check(np.array_equal(train,data['splits']['train']) and np.array_equal(validation,data['splits']['validation']) and np.array_equal(test,data['splits']['test']),'exact stratified seeds, no refit')
def forward(tree,row):
    node=0
    while tree['children_left'][node]!=-1:
        node=tree['children_left'][node] if float(np.float32(row[tree['feature'][node]]))<=tree['threshold'][node] else tree['children_right'][node]
    values=tree['value'][node][0];return np.array(values)/sum(values)
def predict(model,ids):
    return np.array([sum((forward(tree,data['X'][i]) for tree in model['trees']))/len(model['trees']) for i in ids])
def loss(ids,probability):
    p=np.clip(probability,np.finfo(np.float64).eps,1-np.finfo(np.float64).eps)
    return float(-np.mean(np.log(p[np.arange(len(ids)),np.asarray(data['y'])[ids]])))
for i,model in enumerate(data['models']):
    probability=predict(model,data['splits']['validation'])
    check(np.allclose(probability,model['validationProbabilities'],rtol=1e-13,atol=1e-14),f'all validation paths/float32/leaf means model{i}')
    check(np.isclose(loss(data['splits']['validation'],probability),data['reports'][i]['validationLogLoss'],atol=1e-14),f'validation report{i}')
check(data['selected']==min(range(4),key=lambda i:data['reports'][i]['validationLogLoss'])==2,'validation selects predeclared leaf-two forest')
test_ids=data['splits']['test'];probability=predict(data['models'][2],test_ids)
check(np.allclose(probability,data['testProbabilities'],rtol=1e-13,atol=1e-14),'all selected test paths/mean probabilities')
predicted=np.argmax(probability,axis=1);truth=np.asarray(data['y'])[test_ids]
confusion=[[int(np.sum((truth==a)&(predicted==b))) for b in [0,1]] for a in [0,1]]
report=data['testReport']
check(confusion==report['confusion']==[[71,1],[3,39]],'confusion/class order/denominator')
check(np.isclose(np.mean(truth==predicted),report['accuracy']) and np.isclose(loss(test_ids,probability),report['logLoss']),'selected test metrics')
prior=float(np.asarray(data['y'])[data['splits']['train']].mean())
check(prior==data['prior'],'train-only positive prior')
check(np.isclose(loss(test_ids,np.tile([1-prior,prior],(114,1))),report['baselineLogLoss']),'baseline log loss')
check(np.mean(truth==int(prior>.5))==report['baselineAccuracy'],'baseline hard decision')

files=sorted(assets.glob('*.py'))+[assets/'decision-tree-wdbc-models.json']
receipt={'checks':checks,'count':len(checks),'sourceHashes':{str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
    'environment':data['environment'],'wdbc':{'newStudyExecutions':1,'selected':data['reports'][2],'test':report},
    'limits':'Author evidence. New small fits and numerical oracles; WDBC export inspected without fitting. Historical ten programs and writers never executed.'}
path=owner/'reading-flow-native-author.json';path.write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(checks),'receipt':str(path.relative_to(root))}))
