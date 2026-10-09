"""Different whole-content complementary checks; no lesson imports or model runs."""
from pathlib import Path
import ast, hashlib, json, math, zipfile
from decimal import Decimal as D

b = Path('docs/teaching/llm-architecture-training/inference-cost-economics-compute-scaling')
p = Path('public/learn/examples/inference-cost')
out = b / 'independent-content-root'
out.mkdir(exist_ok=True)
checks = []
def test(name, actual, expected=True):
    assert actual == expected, (name, actual, expected)
    checks.append({'name': name, 'actual': actual, 'expected': expected})
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
packet = json.loads((b/'content-inputs.json').read_text())
for row in packet['files']:
    test('source ' + row['path'], sha(row['path']), row['sha256'])
for f in p.glob('*.py'):
    ast.parse(f.read_text()); test('complete parse '+f.name, True)
test('eight programs', len(list(p.glob('*.py'))), 8)
with zipfile.ZipFile(p/'inference-cost-programs.zip') as z:
    test('archive members', len(z.namelist()), 19)
    for name in z.namelist():
        test('archive '+name, z.read(name)==(p/name).read_bytes())
native=json.loads((p/'native-observations.json').read_text())
test('native completed calls',native['completed_forwards'],12)
test('native emitted',native['emitted_tokens'],8)
test('weights conserved',native['weights_before'],native['weights_after'])
test('parameter logical',native['parameters']['logical_bytes'],56270848)
test('resident backing',native['resident_tensors']['unique_storage_bytes'],56270880)
for request in native['requests']:
    test('request prompt length '+request['request_id'],len(request['input_ids']),16)
    for step in request['steps']:
        label=request['request_id']+' '+str(step['step'])
        s=step['step']; positions=16+s; q=16 if s==0 else 1
        test(label+'query',step['query_positions'],q)
        test(label+'cache positions',step['cache_positions'],positions)
        test(label+'cache independent count',sum(math.prod(t['shape'])*t['element_bytes'] for t in step['cache']['tensors']),2*6*4*positions*32*4)
        test(label+'cache logical',step['cache']['logical_bytes'],2*6*4*positions*32*4)
        test(label+'logits',step['logits']['logical_bytes'],q*50304*4)
        test(label+'Linear hooks',len(step['linear_operations']),25)
        test(label+'partial count',sum(t['nominal_flops'] for t in step['linear_operations']),q*15237120)
        test(label+'selection boundary',step['selected_output_id'] is None,s==2)
        if s: test(label+'pending input',step['query_ids'],[request['emitted_ids'][s-1]])
test('bill',str((D(1000)*2+D(200)*10)/1000000),'0.004')
test('cache three requests',str((D(900)*D('2.5')+D(100)*2+200*10+2*(D(900)*D('.1')+100*2+200*10))/1000000),'0.00903')
test('KV GQA',2*32*8*4096*128*4*2,2147483648)
test('whole request capacity',(24000000000-14000000000-2000000000)//536870912,14)
test('matrix product',[[sum(a*b for a,b in zip(x,w)) for w in [[1,0,2],[0,1,1],[1,-1,0],[2,2,1]]] for x in [[1,2,3],[2,0,-1]]],[[7,5,-1,9],[0,-1,2,3]])
test('prefill compulsory',2*(16*3+3*4+16*4),248)
for costs,caps,demand,expected in [([7,4],[4,2],7,(14,2,0)),([7,4],[4,2],13,None),([5,3],[3,2],8,(13,2,1))]:
    cells=[(costs[0]*x+costs[1]*y,x,y) for x in range(4) for y in range(4) if x+y<=3 and caps[0]*x+caps[1]*y>=demand]
    test('independent lattice '+str((costs,demand)),list(min(cells)) if cells else None,list(expected) if expected else None)
test('conditional routed quality',str((D(82)*D('.9')+(D(82)*D('.1')+D(18)*D('.8'))*D('.95'))/100),'0.9527')
test('first-pass excludes MILP branch','Sections 7 and 13 are visible deeper branches' in (b/'lesson.md').read_text())
receipt={'scope':'Pure source, ZIP and saved-row/scalar checks; no scientific package imports, SciPy solve, forward, training or timing replay. Whole review is separate prose.', 'passed':True,'packet_sha256':sha(b/'content-inputs.json'),'conditions':len(checks),'checks':checks}
(out/'checks.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'passed':True,'conditions':len(checks),'receipt_sha256':sha(out/'checks.json')}))
