"""Same-reviewer R1/R2 closure, source and route checks only."""
from pathlib import Path
import difflib, hashlib, json, re
root=Path.cwd()
base=root/'docs/teaching/llm-architecture-training/dpo-direct-preference-optimization'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
packet=base/'content-successor/final-inputs.json'
assert sha(packet)=='efdbd96f005347b7f9c47c14797c9e1aff9965f83bd32600da6572842c94ad9b'
data=json.loads(packet.read_text())
for row in data['files']:assert sha(root/row['path'])==row['sha256'],row['path']
old=(base/'content-successor/manuscript.before.jsx').read_text(encoding='utf-8')
new=(base/'manuscript.jsx').read_text(encoding='utf-8')
assert sha(base/'content-successor/manuscript.before.jsx')==data['original_manuscript_sha256']
paragraph=re.search(r'      <Prose>\n        To run this first program,[\s\S]*?      </Prose>\n',new).group()
assert new.index(paragraph)<new.index('file="response_scores.py"')
assert 'dpo-programs.zip' in paragraph and 'requirements.txt' in paragraph and 'python -B response_scores.py --output my-response-scores.json' in paragraph
rest=new.replace(paragraph,'').replace('policy-gradient','policy- gradient').replace('/causal-language-modeling-next-token-prediction?','/causal-language-modeling?')
assert rest==old,'Additional unreviewed body change'
manifest=json.loads((root/'src/learn/data/lesson-manifest.json').read_text())
destination='causal-language-modeling-next-token-prediction'
assert manifest[destination]=='./topics/causal-language-modeling.jsx'
assert f'"{destination}": () => import("../topics/causal-language-modeling.jsx")' in (root/'src/learn/data/generated/lesson-imports.js').read_text()
target=(root/'src/learn/data/topics/causal-language-modeling.jsx').read_text(encoding='utf-8')
assert '7. Build the complete causal decoder' in target
assert f'/{destination}?module=large-language-models#7-build-the-complete-causal-decoder' in new
original=json.loads((base/'content-inputs.json').read_text())
unchanged=[r for r in original['files'] if not r['path'].endswith('/manuscript.jsx')]
for row in unchanged:assert sha(root/row['path'])==row['sha256']
report={'reviewer':'root','accepted':True,'findings_closed':['R1 first-program setup','R2 actual prerequisite reader route'],
 'guarded_successor_files':len(data['files']),'conserved_original_files':len(unchanged),'fits':0,'generations':0,
 'reading':'Complete inserted paragraph and neighboring section4 flow, corrected section7 link, exact changed-body conservation, author continuation and qualification; composed with prior entire review.',
 'bindings':{p.relative_to(root).as_posix():sha(p) for p in [packet,base/'content-review.md',base/'content-review-checks.json',Path(__file__),base/'manuscript.jsx']}}
(base/'content-review-closure.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'accepted':True,'guards':len(data['files']),'conserved':len(unchanged)}))
