"""Current written draft identity/conservation, not runtime/paint certification."""
from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parents[1]
owner=root/'docs/teaching/deep-learning-beginner/neural-training-diagnostics-reproducible-experiments'
path=owner/'reading-flow-manuscript.md'
text=path.read_text(encoding='utf8')
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(dict(name=name,passed=True))
check('Eleven exact numbered headings preserved',re.findall(r'^## \d+\. .+$',text,re.M)==re.findall(r'^## \d+\. .+$',(root/'docs/teaching/drafts/neural-training-diagnostics-reproducible-experiments/lesson.md').read_text(encoding='utf8'),re.M))
check('All33 accepted drawing placements',re.findall(r'<!-- Drawing D(\d+):',text)==[f'{i:02}' for i in range(1,34)])
check('Original Cases A-D and synthesis',all(x in text for x in ['Case A: the silent training run','Case B: a convincing training curve','Case C: validation changes the future','Case D: a changed restart calculation','Practical synthesis: write a reproducible diagnosis']))
check('New independently changed tasks',all(x in text for x in ['c₁=−3','c₂=13','.2+.9/9=.3','stationary point or rate','sample standard deviation is 0.04']))
check('Local process-state overview precedes full new source',text.index('<!-- Drawing D33:') < text.index('### Complete measurement and ordinary-library sources'))
assets=root/'public/learn-assets/neural-training-diagnostics-reproducible-experiments'
receipt=json.loads((owner/'reading-flow-native-code-checkpoint.json').read_text())
for name in ['diagnostic-measurements.py','diagnostic-library-bridge.py']:
    source=assets/name
    check('Complete exact embedded source '+name,source.read_text(encoding='utf8') in text)
    check('Unchanged native-checked source '+name,hashlib.sha256(source.read_bytes()).hexdigest()==receipt['sources'][source.relative_to(root).as_posix()])
check('Further learning and precise technical sources separated','## Further learning' in text and '## Technical references' in text)
check('Explicit equal grouping versus reordered cancellation','first two groupings agree' in text and 'cancellation-first' in text)
check('No copied length budget','Allow roughly 45 minutes' not in text)
check('No code/program reveal gate','Show code only when requested' not in text)
check('Taylor cancellation is explicit', 'O(h^5)' in text and 'even terms' in text and 'h²L‴(w)/6' in text)
check('Process inventory follows its consumers',text.index('<!-- Drawing D33:') < text.index('For a real run, list every state'))
check('All complete old sources have visible placements',all('Complete visible source: '+name in text for name in ['calculations.py','wine_diagnostics.py','checkpoint_replay.py']))
check('Scientific notation not split',not re.search(r'\de\s+[−\d]',text))
baseline=json.loads((root/'docs/teaching/deep-learning-beginner/original/diagnostics-before-reading-flow/sources.json').read_text())
for name,row in baseline['files'].items():
    check('Original current '+name,hashlib.sha256((root/name).read_bytes()).hexdigest()==row['sha256'])
    check('Protected copy '+name,hashlib.sha256((root/row['copy']).read_bytes()).hexdigest()==row['sha256'])
sources=[path,Path(__file__),owner/'reading-flow-native-code-checkpoint.json']
result=dict(topic='neural-training-diagnostics-reproducible-experiments',result='PASS',count=len(checks),checks=checks,scope='Written-draft structure/source agreement and116 conserved original/copy bindings only; first author reading corrections are incorporated; actual runtime/browser/paint and independent whole-source closure remain pending',sources={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
target=owner/'reading-flow-written-content-checkpoint.json'
assert not target.exists(),'Preserve earlier receipt'
target.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(result='PASS',count=len(checks),manuscriptHash=result['sources'][path.relative_to(root).as_posix()],receiptHash=hashlib.sha256(target.read_bytes()).hexdigest())))
