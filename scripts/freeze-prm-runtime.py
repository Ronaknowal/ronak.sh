"""Bind the PRM author review, conserved content and composed actual paint."""
from pathlib import Path
import hashlib
import json
import re
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm'
PUBLIC = ROOT / 'public/learn-code/process-reward-models'
hash_file = lambda file: hashlib.sha256(file.read_bytes()).hexdigest()
relative = lambda file: file.relative_to(ROOT).as_posix()
checks = []

def check(name, passed, actual=None):
    checks.append({'name': name, 'passed': bool(passed), 'actual': actual})
    if not passed:
        raise AssertionError(name)

accepted = json.loads((BASE / 'content-acceptance.json').read_text(encoding='utf8'))
for file, expected in accepted['bindings'].items():
    check('Conserved accepted content ' + file, hash_file(ROOT / file) == expected)
successor = json.loads((BASE / 'content-successor/inputs.json').read_text(encoding='utf8'))
for file, expected in successor['files'].items():
    check('Conserved content successor ' + file, hash_file(ROOT / file) == expected)
published = ROOT / 'src/learn/data/topics/prm-vs-orm.jsx'
check('Published original remains protected', hash_file(published) == hash_file(BASE / 'original/prm-vs-orm.jsx'))
with zipfile.ZipFile(PUBLIC / 'prm-programs-data.zip') as archive:
    check('Exact 23 archive files', len(archive.namelist()) == 23, archive.namelist())
    for name in archive.namelist():
        check('Archive exact current bytes ' + name, archive.read(name) == (PUBLIC / name).read_bytes())

lesson = (BASE / 'lesson.jsx').read_text(encoding='utf8')
component = (ROOT / 'src/learn/components/lesson-labs/PRMFlow.jsx').read_text(encoding='utf8')
names = re.findall(r'export function (PRM\w+)\(', component)
names = [name for name in names if name != 'PRMTable']
check('Exactly 29 runtime figure exports', len(names) == 29, names)
for name in names:
    check('Exactly one lesson mount ' + name, len(re.findall(r'<' + name + r'\s*/>', lesson)) == 1)
check('Seven complete visible shared program mounts', len(re.findall(r'<Program file=', lesson)) == 7)
check('Fourteen complete practice mounts', lesson.count('data-lesson-exercise') == 14)
check('Fourteen whole worked solutions', lesson.count('<summary>Worked solution</summary>') == 14)
check('Callable module content contract', 'content: PRMLesson' in lesson)
aliases = ['1-why-it-exists', '2-core-intuition', '3-mathematical-foundation', '4-from-scratch-implementation', '5-production-implementation', '6-visual-walkthrough', '7-decision-matrix', '8-what-scales-and-what-doesn-t', '9-failure-modes-and-gotchas', '10-primary-sources', '11-self-check-exercises', '1-start-with-the-problem', '2-build-the-intuition', '3-make-the-idea-precise']
for alias in aliases:
    check('Preserved fragment ' + alias, alias in lesson)

for receipt in ['runtime-model-checks.json', 'runtime-tree-closure/conservation.json', 'runtime-tree-closure/report.json', 'runtime-simplex-closure/report.json', 'runtime-reference-closure/conservation.json', 'runtime-reference-closure/report.json', 'runtime-reference-closure/viewport/report.json', 'runtime-reference-closure/viewport-phone/report.json', 'browser-final/report.json', 'browser-recovery/report.json', 'browser-opening-closure/report.json']:
    data = json.loads((BASE / receipt).read_text(encoding='utf8'))
    check('Passed retained receipt ' + receipt, data['passed'])
interactions = json.loads((BASE / 'browser-final-interactions/report.json').read_text(encoding='utf8'))
check('Interaction campaign accurately retains native ZIP failure', not interactions['passed'] and 'canceled' in interactions['failure'])
check('Every completed interaction assertion passed', all(item['passed'] for item in interactions['checks']), len(interactions['checks']))

paint = {'scope': 'Composed current defaults: source-bound predecessor for unchanged26 figures; bounded D10 and D22/D23 successor captures. No predecessor image is labelled as a new capture.', 'figures': [], 'openings': [], 'referenceViews': [], 'supplemental': []}
for i in range(1, 30):
    identity = f'D{i:02d}'
    images = []
    for profile in ['desktop', 'phone', 'enlarged']:
        if i == 10:
            image = BASE / 'runtime-simplex-closure/screenshots' / f'{profile}-default.png'
        elif i in [22, 23]:
            image = BASE / 'runtime-tree-closure/screenshots' / f'{profile}-{identity}.png'
        else:
            image = BASE / 'browser-final/screenshots' / f'{profile}-{identity}.png'
        images.append({'profile': profile, 'path': relative(image), 'sha256': hash_file(image)})
    paint['figures'].append({'id': identity, 'export': names[i - 1], 'images': images})
for image in sorted((BASE / 'browser-opening-closure/screenshots').glob('*.png')):
    paint['openings'].append({'path': relative(image), 'sha256': hash_file(image)})
reference_images = [BASE / 'runtime-reference-closure/screenshots/desktop-references.png']
for folder in ['viewport', 'viewport-phone']:
    reference_images.extend(sorted((BASE / 'runtime-reference-closure' / folder).glob('*.png')))
for image in reference_images:
    paint['referenceViews'].append({'path': relative(image), 'sha256': hash_file(image)})
for folder in ['runtime-tree-closure', 'runtime-simplex-closure', 'runtime-reference-closure', 'browser-final-interactions', 'browser-recovery', 'browser-delivery-network']:
    for image in sorted((BASE / folder / 'screenshots').glob('*.png')):
        # Changed D22/D23 predecessor views are superseded by the tree closure.
        if folder == 'browser-final-interactions' and ('D22' in image.stem or 'D23' in image.stem):
            continue
        diagnostic = folder == 'runtime-reference-closure' and image.stem.startswith(('phone-', 'enlarged-'))
        paint['supplemental'].append({'path': relative(image), 'sha256': hash_file(image), 'scope': folder, 'diagnostic': diagnostic})
(BASE / 'runtime-paint-index.json').write_text(json.dumps(paint, indent=2) + '\n', encoding='utf8')

report = {'passed': True, 'at': datetime.now(timezone.utc).isoformat(), 'fits': 0, 'checks': checks, 'archive_native_download': 'Unresolved browser-native cancellation, shared across topics and owned by root. GET/body is exact; seven individual native file downloads passed. No security-cause inference or archive/source change.', 'model': json.loads((BASE / 'runtime-model-checks.json').read_text(encoding='utf8'))['sourceFiles']}
(BASE / 'runtime-readiness-checks.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
files = set()
for folder in [BASE, PUBLIC, ROOT / 'public/learn-data/process-reward-models']:
    for file in folder.rglob('*'):
        if file.is_file() and file.name not in ['runtime-inputs.json', 'runtime-review.md'] and '__pycache__' not in file.parts:
            files.add(file)
for file in (ROOT / 'scripts').glob('*prm*'):
    if file.is_file():
        files.add(file)
files.update(ROOT / file for file in ['src/learn/components/lesson-labs/PRMFlow.jsx', 'src/learn/components/lesson-labs/prm-flow.css', 'src/learn/data/prm-models.js'])
packet = {'author': 'multimodal_reviewer', 'frozen_at': datetime.now(timezone.utc).isoformat(), 'stage': 'Author runtime complete; different whole runtime review required before publication', 'scope': 'PRM only; all29 structures, seven runnable programs and14 practice. Immutable accepted content, prior actual study and bounded current paint closures. Shared ZIP native cancellation remains explicitly unresolved.', 'accepted_content_count': len(accepted['bindings']), 'content_successor_count': len(successor['files']), 'files': {relative(file): hash_file(file) for file in sorted(files)}}
(BASE / 'runtime-inputs.json').write_text(json.dumps(packet, indent=2) + '\n', encoding='utf8')
print(json.dumps({'passed': True, 'checks': len(checks), 'accepted_content': len(accepted['bindings']), 'successor': len(successor['files']), 'bindings': len(files), 'packet_sha256': hash_file(BASE / 'runtime-inputs.json'), 'source': {relative(file): hash_file(file) for file in [BASE / 'lesson.jsx', ROOT / 'src/learn/components/lesson-labs/PRMFlow.jsx', ROOT / 'src/learn/components/lesson-labs/prm-flow.css', ROOT / 'src/learn/data/prm-models.js']}}))
