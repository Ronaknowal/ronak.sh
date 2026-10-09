"""Bind the reviewed KV runtime and compose existing paint, without executing science."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/kv-cache-memory-management'


def read(path):
    return json.loads(path.read_text(encoding='utf8'))


def binding(path):
    data = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(),
            'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}


def save(path, data):
    path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf8')


content = read(TOPIC / 'content-review-successor/inputs.json')['files']
for row in content:
    assert binding(ROOT / row['path'])['sha256'] == row['sha256'], row['path']

# Ordered successors replace only identically named painted objects.
campaigns = [
    'browser-campaign-1791477319788', 'browser-campaign-1791477543491',
    'browser-campaign-1791478064865', 'browser-campaign-1791478330899',
    'browser-campaign-1791478500901', 'browser-campaign-1791478579925',
    'browser-campaign-1791479270447',
]
selected = {}
for folder in campaigns:
    report_path = TOPIC / folder / 'report.json'
    for capture in read(report_path)['captures']:
        selected[capture['name']] = {**capture, 'report': binding(report_path)}
for folder in ['browser-delivery-1791478720815', 'browser-reader-1791479536613',
               'browser-vector-labels-1791479675758', 'browser-compass-1791480145685']:
    report_path = TOPIC / folder / 'report.json'
    for capture in read(report_path)['captures']:
        if 'delivery' in folder and '-practice-' not in capture['name']:
            continue
        selected[capture['name']] = {**capture, 'report': binding(report_path)}

for profile in ['desktop', 'phone', 'enlarged']:
    for index in range(1, 27):
        assert f'{profile}-D{index:02}-default' in selected
    for index in range(1, 14):
        assert f'{profile}-practice-{index}' in selected

for capture in selected.values():
    capture['tiles'] = [binding(Path(path)) for path in capture['tiles']]
    capture['file'] = Path(capture['file']).relative_to(ROOT).as_posix()
save(TOPIC / 'runtime-paint-index.json', {
    'scope': 'Latest object-name successors; all continuation tiles are required. Final vector legend captures supplement otherwise conserved full figures. Compass successor replaces opening only.',
    'defaults': 78, 'practice_views': 39, 'objects': len(selected),
    'tile_count': sum(len(x['tiles']) for x in selected.values()),
    'captures': list(selected.values()),
    'personal_reading': binding(TOPIC / 'runtime-author-paint-progress.json'),
})

paths = {ROOT / row['path'] for row in content}
paths.update(TOPIC / name for name in [
    'content-review-successor/inputs.json', 'content-release-root.json', 'lesson.jsx',
    'runtime-author-review.md', 'runtime-paint-index.json', 'runtime-author-paint-progress.json',
    'runtime-model-checks.json', 'runtime-data-preparation.json', 'runtime-compatibility.json'])
sources = [TOPIC / 'lesson.jsx', ROOT / 'src/learn/data/kv-cache-models.js']
sources += [ROOT / f'src/learn/components/lesson-labs/KvCache{name}.jsx'
            for name in ['Shared', 'Foundations', 'Memory', 'Storage']]
sources += [ROOT / 'src/learn/components/lesson-labs/kv-cache-flow.css']
paths.update(sources)
paths.update(ROOT / row['path'] for row in read(TOPIC / 'runtime-data-preparation.json')['files'])
paths.update((ROOT / 'public/learn-assets/kv-cache-memory-management').glob('*'))
paths.update((TOPIC / 'runtime-author-corrections').glob('*'))
paths.update(ROOT / 'scripts' / name for name in [
    'freeze-kv-cache-runtime.py', 'prepare-kv-cache-runtime.py', 'render-kv-cache-lesson.mjs',
    'verify-kv-cache-models.mjs', 'verify-kv-cache-browser.cjs', 'verify-kv-cache-delivery.cjs',
    'verify-kv-cache-reader.cjs', 'verify-kv-cache-vector-labels.cjs', 'verify-kv-cache-compass.cjs',
    'prepare-kv-cache-paint.py', 'lib/kv-cache-browser-capture.cjs'])
for folder in TOPIC.glob('browser-*'):
    if (folder / 'report.json').exists():
        paths.add(folder / 'report.json')
for capture in selected.values():
    paths.add(ROOT / capture['report']['path'])
    paths.update(ROOT / row['path'] for row in capture['tiles'])
    sidecar = ROOT / (capture['file'] + '.tiles.json')
    if sidecar.exists():
        paths.add(sidecar)
for folder in read(TOPIC / 'runtime-author-paint-progress.json')['read_atlases']:
    paths.add(TOPIC / folder / 'paint-atlases/index.json')
files = [binding(path) for path in sorted(paths) if path.is_file()]
save(TOPIC / 'runtime-inputs.json', {
    'status': 'author-ready for different whole runtime review; root owns acceptance',
    'scope': 'Frozen effective content61, final seven runtime sources, copied assets, executed finite/browser receipts and selected actual paint; no scientific replay.',
    'content_files': len(content), 'files': files,
})
save(TOPIC / 'runtime-author-ready.json', {
    'packet': binding(TOPIC / 'runtime-inputs.json'), 'source_files': [binding(p) for p in sources],
    'author_review': binding(TOPIC / 'runtime-author-review.md'),
    'paint_index': binding(TOPIC / 'runtime-paint-index.json'),
    'limitations': ['Native ZIP canceled; exact HTTP bytes/MIME and11individual native downloads passed.',
                    'Whole figure evidence composes unchanged regions with bounded successors; historical reports retain their original hashes.',
                    'Root production build and different acceptance pending.'],
})
print(json.dumps({'packet': binding(TOPIC / 'runtime-inputs.json'),
                  'files': len(files), 'objects': len(selected),
                  'tiles': sum(len(x['tiles']) for x in selected.values())}))
