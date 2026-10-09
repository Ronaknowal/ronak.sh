"""Bind the private runtime and conserved author evidence without executing science."""
import difflib
import hashlib
import json
from pathlib import Path

folder = Path('docs/teaching/llm-architecture-training/speculative-decoding')
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
write = lambda p, obj: Path(p).write_text(json.dumps(obj, indent=2) + '\n', encoding='utf-8')
release = json.loads((folder / 'content-release-root.json').read_text())
for file, digest in release['files'].items():
    assert sha(file) == digest, file
correction = folder / 'author-paint-correction'
changes = []
for name in ['SpeculativeFoundations', 'SpeculativeProposers']:
    before = correction / f'{name}.before.jsx'
    after = Path(f'src/learn/components/lesson-labs/{name}.jsx')
    diff = ''.join(difflib.unified_diff(before.read_text().splitlines(True), after.read_text().splitlines(True), fromfile=str(before), tofile=str(after)))
    target = correction / f'{name}.diff'
    target.write_text(diff, encoding='utf-8')
    changes.append({'before':str(before).replace('\\','/'), 'before_sha256':sha(before), 'after':str(after).replace('\\','/'), 'after_sha256':sha(after), 'diff':str(target).replace('\\','/')})
write(correction / 'final-scope.json', {'scope':'Only five label/marker geometry corrections: D08, D23, D25, D26, D28. No state, numerical, manuscript, scientific program or output changes.', 'changes':changes})
paint = []
for n in range(1,37):
    ident = f'D{n:02d}'
    default = 'browser-correction' if n in [23,25,26,28] else 'browser-paint-closure-r2' if n==8 else 'browser-whole'
    changed = 'browser-interactions-r3' if n<=8 else 'browser-interactions-r4' if n<=28 else 'browser-interactions-r5'
    state = {8:'uniform-zero',23:'node0',25:'accept-first',26:'joint',28:'teacher'}.get(n)
    rows=[]
    for profile in ['desktop','phone','enlarged']:
        filename=f'{profile}-{ident}-default.png' if n==8 else f'{profile}-{ident}.png'
        current = folder / default / filename
        other = folder / ('browser-paint-closure-r2' if state else changed) / (f'{profile}-{ident}-{state}.png' if state else f'{profile}-{ident}-changed.png')
        assert current.exists() and other.exists()
        rows.append({'profile':profile,'default':str(current).replace('\\','/'),'default_sha256':sha(current),'changed':str(other).replace('\\','/'),'changed_sha256':sha(other)})
    paint.append({'id':ident,'profiles':rows,'default_pan_index':str(folder/default/'atlases/index.json').replace('\\','/'),'changed_pan_index':str(folder/'browser-paint-closure-r2/atlases/index.json').replace('\\','/') if state else None})
write(folder / 'runtime-paint-map.json', {'figures':paint,'rule':'Use current successor only for affected five figures; whole predecessor sources recover exactly. Native pixel atlases compose observed pan captures without resizing. See runtime-author-review.md for honest personal-reading boundaries.', 'source_corrections':changes,'practice':'browser-recovery-ending/report.json'})
files=set(Path(p) for p in release['files'])
files.add(folder/'content-release-root.json')
for p in ['lesson.jsx','renderer-receipt.json','runtime-build.json','runtime-model-checks.json','runtime-author-review.md','runtime-paint-map.json','geometry-initial.json']:
    files.add(folder/p)
for name in ['SpeculativeElements','SpeculativeFoundations','SpeculativeCacheCost','SpeculativeProposers','SpeculativeEvidence','SpeculativeDecodingFlow']:
    files.add(Path(f'src/learn/components/lesson-labs/{name}.jsx'))
files.add(Path('src/learn/components/lesson-labs/speculative-decoding-flow.css'))
files.add(Path('src/learn/data/speculative-decoding-models.js'))
for name in ['render-speculative-decoding-lesson.mjs','check-speculative-runtime-models.mjs','build-speculative-private.mjs','inspect-speculative-runtime.cjs','exercise-speculative-runtime.cjs','check-speculative-recovery.cjs','check-speculative-paint-closure.cjs','assemble-speculative-paint.py','freeze-speculative-runtime.py']:
    files.add(Path('scripts')/name)
for name in ['browser-initial','browser-mounted','browser-whole','browser-correction','browser-interactions','browser-interactions-r2','browser-interactions-r3','browser-interactions-r4','browser-interactions-r5','browser-delivery','browser-recovery-ending','browser-paint-closure','browser-paint-closure-r2','author-paint-correction']:
    for p in (folder/name).rglob('*'):
        if p.is_file(): files.add(p)
for p in Path('public/learn-code/speculative-decoding').rglob('*'):
    if p.is_file():files.add(p)
for p in Path('public/learn-assets/speculative-decoding').rglob('*'):
    if p.is_file():files.add(p)
for report in ['browser-whole/report.json','browser-correction/report.json','browser-delivery/report.json','browser-recovery-ending/report.json','browser-paint-closure-r2/report.json']:
    assert json.loads((folder/report).read_text())['passed'],report
bindings=[{'path':str(p).replace('\\','/'),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(files)]
write(folder/'runtime-inputs.json',{'topic_id':'speculative-decoding','status':'ready-for-different-whole-runtime-review','author':'/root/alignment_author','content_release_sha256':sha(folder/'content-release-root.json'),'science':'No replay or alteration; all accepted Root content inputs freshly guarded.','private_preview':'http://127.0.0.1:4262/learn/path/full-curriculum/speculative-decoding?module=large-language-models','files':bindings})
print(json.dumps({'files':len(bindings),'runtime_inputs_sha256':sha(folder/'runtime-inputs.json'),'content_guards':len(release['files'])}))
