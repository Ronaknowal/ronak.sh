"""Freeze the reviewed runtime and its exact composed evidence; no model execution."""
import hashlib
import json
from pathlib import Path

topic = Path('docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems')
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
accepted = json.loads((topic/'content-review-acceptance.json').read_text())
files = dict(accepted['files'])
for p, expected in files.items():
    assert sha(p) == expected, p
paths = [topic/'content-review-acceptance.json', topic/'lesson.jsx', topic/'runtime-author-review.md',
         Path('src/learn/data/typed-decision-models.js'), Path('src/learn/components/lesson-labs/typed-decision-flow.css'),
         Path('public/learn-assets/typed-decision-systems/observations.json')]
paths += list(Path('src/learn/components/lesson-labs').glob('TypedDecision*.jsx'))
paths += [Path('scripts')/name for name in ['prepare-typed-decision-runtime.py', 'render-typed-decision-lesson.mjs',
    'verify-typed-decision-models.mjs', 'verify-typed-decision-source-closure.mjs',
    'verify-typed-decision-browser.cjs', 'verify-typed-decision-reading.cjs', 'prepare-typed-decision-paint.py',
    'correct-typed-decision-author.py', 'verify-typed-decision-author-closure.cjs',
    'verify-typed-decision-final-reading.cjs', 'verify-typed-decision-presentation-conservation.mjs',
    'freeze-typed-decision-runtime.py']]
paths += list((topic/'runtime-author-predecessor').rglob('*'))
paths += [topic/name for name in ['runtime-observation-inputs.json','runtime-model-checks.json',
    'runtime-source-closure.json','runtime-presentation-conservation.json','runtime-compatibility.json']]
receipts = ['report-1791437452730','reading-1791437797732','reading-1791439967192',
            'closure-1791440291278','final-reading-1791440829815']
coverage = []
for name in receipts:
    report_path = topic/'browser-evidence'/(name+'.json')
    report = json.loads(report_path.read_text())
    paths.append(report_path)
    paths += [topic/'browser-evidence'/capture for capture in report['captures']]
    directory = topic/('paint-'+name)
    if directory.exists():
        paths += list(directory.rglob('*'))
        index = json.loads((directory/'index.json').read_text())
        coverage.append({'receipt':report_path.as_posix(),'captures':len(report['captures']),
                         'atlas_index':(directory/'index.json').as_posix(),
                         'personally_read_atlases':len(index['atlases']),
                         'tiles':sum(len(a['tiles']) for a in index['atlases'])})
    else:
        coverage.append({'receipt':report_path.as_posix(),'captures':len(report['captures']),
                         'personally_read_original_images':len(report['captures'])})
for p in paths:
    if p.is_file(): files[p.as_posix()] = sha(p)
packet = {'status':'author ready for different whole runtime review',
          'scope':'36 diagrams, 18 concept sections, 18 complete practices, 10 full program readers; no scientific execution',
          'accepted_content_files':len(accepted['files']), 'paint_coverage':coverage,
          'limitations':['No native ZIP save claim; exact HTTP/MIME and individual native Python downloads passed.',
                         'Historical captures compose through preserved UI snapshots and bounded successors.',
                         'Root owns independent review, production checks and publication.'],
          'files':dict(sorted(files.items()))}
out = topic/'runtime-inputs.json'
assert not out.exists(), 'Do not overwrite a frozen runtime packet.'
out.write_text(json.dumps(packet,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'path':out.as_posix(),'sha256':sha(out),'files':len(files),'coverage':coverage}))
