"""Freeze the author runtime handoff; no scientific execution or phase mutation."""
from pathlib import Path
import hashlib
import json
import difflib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/prefix-caching-prompt-caching'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path):
    return path.resolve().relative_to(ROOT).as_posix()


def save(name, value):
    path = TOPIC / name
    assert not path.exists(), f'Refusing to overwrite {path}'
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


release = json.loads((TOPIC / 'content-release-root.json').read_text())
for name, expected in release['files'].items():
    assert sha(ROOT / name) == expected, name
assert len(release['files']) == 141
assert sha(TOPIC / 'lesson.md') == '82ea16117019e1d4068ed127bae25b56d866580c4b5d739cd1980354f03f9790'

owners = [ROOT / 'src/learn/data/prefix-caching-models.js']
owners += [ROOT / 'src/learn/components/lesson-labs' / f'PrefixCaching{x}.jsx'
           for x in ['Shared', 'Foundations', 'Storage', 'Native', 'Policy']]
owners += [ROOT / 'src/learn/components/lesson-labs/prefix-caching-flow.css',
           TOPIC / 'lesson.jsx', ROOT / 'public/learn-assets/prefix-caching-prompt-caching/observations.json']

model_receipt = json.loads((TOPIC / 'runtime-model-checks-1791498890760.json').read_text())
formatting = json.loads((TOPIC / 'runtime-formatting-1791499337436.json').read_text())
format_rows = {row['file']: row for row in formatting['rows']}
model_guard_routes = {}
for name, expected in model_receipt['inputs'].items():
    current = sha(ROOT / name)
    if current != expected:
        row = format_rows[name]
        assert row['before'] == expected and row['after'] == current, name
        assert row['semanticAST'] == 'equal excluding inert JSX whitespace and parser metadata'
        model_guard_routes[name] = {'before': expected, 'current': current, 'via': 'runtime-formatting-1791499337436.json'}
    else:
        model_guard_routes[name] = {'exact': current}
assert len(model_receipt['checks']) == 1347

public = ROOT / 'public/learn-code/prefix-caching'
with zipfile.ZipFile(public / 'prefix-caching.zip') as archive:
    names = archive.namelist()
    assert len(names) == 35
    for name in names:
        assert archive.read(name) == (public / name).read_bytes(), name
assert len(list(public.glob('*.py'))) == 18
compat = json.loads((TOPIC / 'runtime-compatibility.json').read_text())
assert len(compat['figures']) == 29 and len(compat['programs']) == 12
assert (TOPIC / 'lesson.jsx').read_text().count('<details') == 32

storage = ROOT / 'src/learn/components/lesson-labs/PrefixCachingStorage.jsx'
prior = TOPIC / 'runtime-author-final-correction/PrefixCachingStorage.before-label-offset.jsx'
old, new = prior.read_text(), storage.read_text()
diff = list(difflib.unified_diff(old.splitlines(), new.splitlines(), fromfile=rel(prior), tofile=rel(storage)))
assert len([x for x in diff if x.startswith('-') and not x.startswith('---')]) == 2
assert len([x for x in diff if x.startswith('+') and not x.startswith('+++')]) == 2
save('runtime-author-final-correction/label-offset-closure.json', {
    'scope': 'D14 branch-label horizontal positions only; no scientific/model/manuscript changes',
    'predecessor': {rel(prior): sha(prior)}, 'current': {rel(storage): sha(storage)},
    'diff': diff, 'paint': 'browser-campaign-1791525182942',
    'actualReading': 'All six native-size two-tile sheets personally read, including all three profiles and pans; labels clear of both branch connectors.'
})

reading = {
    'browser-campaign-1791498962829': list(range(1, 30)),
    'browser-campaign-1791499359276': list(range(1, 201)),
    'browser-campaign-1791499545691': list(range(1, 13)),
    'browser-campaign-1791500449466': [2, 3, 8, 9, 11, 15, 18, 21, 30, 38, 44, 51],
    'browser-campaign-1791525182942': list(range(1, 7)),
    'browser-changed-pans-1791500633708': [5, 11, 17, 19, 22, 29, 37, 40, 44, 46, 47, 51, 54, 55, 58, 61, 62, 65, 68, 71],
    'browser-delivery-1791499638118': list(range(1, 14)) + [21, 22, 23, 28, 33, 45, 47, 48, 49, 50, 51, 52, 53, 62, 63],
    'browser-boundaries-1791500865437': [1, 5, 6, 7, 12, 39],
    'browser-code-layout-1791525370788': list(range(1, 12)),
}
campaigns = {}
for name, read_numbers in reading.items():
    folder = TOPIC / name
    sheets = json.loads((folder / 'native-sheets/index.json').read_text())
    report = json.loads((folder / 'report.json').read_text())
    selected = []
    for number in sorted(set(read_numbers)):
        row = sheets[number - 1]
        image = ROOT / row['file']
        selected.append({'sheet': rel(image), 'sha256': sha(image),
                         'tiles': [{ 'path': rel(Path(tile)), 'sha256': sha(Path(tile)) }
                                   for tile in row['tiles']], 'names': row['names']})
    campaigns[name] = {
        'report': rel(folder / 'report.json'), 'reportSha256': sha(folder / 'report.json'),
        'captureObjects': len(report.get('captures', [])),
        'capturedSheets': len(sheets), 'capturedTiles': sum(len(row['tiles']) for row in sheets),
        'personallyReadSheets': selected,
        'readingLimit': 'Only listed sheets are claimed personally read; every retained tile is bound for independent inspection.'
    }

defaults = {}
for profile in ['desktop', 'phone', 'enlarged']:
    for number in range(1, 30):
        d = f'D{number:02d}'
        campaign = 'browser-campaign-1791498962829' if profile == 'desktop' else 'browser-campaign-1791499359276'
        if profile == 'desktop' and number in [1, 2, 10, 13, 16, 24, 26, 28, 29]:
            campaign = 'browser-campaign-1791499545691'
        if number in [1, 14, 21, 23, 24]:
            campaign = 'browser-campaign-1791500449466'
        if number == 14:
            campaign = 'browser-campaign-1791525182942'
        sidecar = TOPIC / campaign / f'{profile}-{d}-default.png.tiles.json'
        assert sidecar.exists(), sidecar
        defaults[f'{profile}-{d}'] = rel(sidecar)

save('runtime-author-paint-index.json', {
    'author': '/root/training_author',
    'profiles': {'desktop': [1366, 1000, 16], 'phone': [390, 1000, 16], 'enlarged': [768, 1000, 32]},
    'source': {rel(p): sha(p) for p in owners},
    'effectiveDefaultSidecars': defaults,
    'composition': [
        'All initial desktop and responsive sheets personally read. Retain those readings for unchanged regions.',
        'First correction replaces D01/D02/D10/D13/D16/D24/D26/D28/D29 desktop evidence; responsive campaign includes that earlier correction.',
        'Second correction changes D01 connector, D14 labels, D21 caption, D23 spacing, D24 caption only; actual selected closure sheets compose prior whole-object reading.',
        'Final D14 horizontal label offsets supersede all previous D14 paint. All six sheets read.',
        'Changed-pans supplements the already-read changed default/left states, with selected right-edge risks personally read.',
        'Boundary campaign adds controls and null/extreme states without any model/scientific replay. Six individual helper downloads supplement twelve inline downloads.',
        'Code-layout covers three distinct full-program start/end/right-scroll risks in all profiles. Byte-level delivery establishes all twelve full source texts.',
        'At compact states some fixed-size drawing right-edge captures are blank canvas; they are geometry evidence, not additional data.'
    ],
    'campaigns': campaigns,
    'limitations': ['Not every supplementary boundary/pan/delivery tile was personally read.',
                    'Native ZIP download canceled; exact HTTP/MIME/archive bytes and all eighteen individual Python native downloads passed.',
                    'Shared code and inline-math widgets retain their established font behavior at enlarged root text; no shared reader/CSS modified.',
                    'Author self-review only; independent review and Root production integration remain required.']
})
save('runtime-final-checks.json', {
    'status': 'PASS', 'contentBindingsGuarded': len(release['files']),
    'manuscriptSha256': sha(TOPIC / 'lesson.md'), 'conservedModelReceiptConditions': 1347,
    'modelReceiptGuardRoutes': model_guard_routes,
    'archiveExactMembers': len(names), 'publicPythonFiles': 18,
    'figurePlacements': 29, 'wholeProgramPlacements': 12, 'practiceDisclosurePairs': 16,
    'owners': {rel(p): sha(p) for p in owners},
    'scope': 'Source identities, static composition and archive parity only; no scientific or browser rerun.'
})

files = dict(release['files'])
for path in TOPIC.rglob('*'):
    if path.is_file() and (path.name.startswith('runtime-') or any(part.startswith(('browser-', 'runtime-author-')) for part in path.relative_to(TOPIC).parts)):
        if path.name not in ['runtime-inputs.json', 'runtime-author-ready.json']:
            files[rel(path)] = sha(path)
for path in owners + [TOPIC / 'content-release-root.json', TOPIC / 'runtime-author-review.md']:
    files[rel(path)] = sha(path)
for path in (ROOT / 'scripts').glob('*prefix-caching*'):
    if path.is_file():
        files[rel(path)] = sha(path)
for path in [ROOT / 'scripts/lib/kv-cache-browser-capture.cjs', ROOT / 'scripts/lib/llm-inference-preview.mjs']:
    files[rel(path)] = sha(path)
save('runtime-inputs.json', {'topicId': 'prefix-caching-prompt-caching',
                           'status': 'Author ready for DIFFERENT whole runtime review; no phase or publication transition',
                           'files': dict(sorted(files.items()))})
save('runtime-author-ready.json', {
    'topicId': 'prefix-caching-prompt-caching', 'author': '/root/training_author',
    'packet': {'path': rel(TOPIC / 'runtime-inputs.json'), 'sha256': sha(TOPIC / 'runtime-inputs.json'), 'bindings': len(files)},
    'source': {rel(p): sha(p) for p in owners},
    'authorReviewSha256': sha(TOPIC / 'runtime-author-review.md'),
    'paintIndexSha256': sha(TOPIC / 'runtime-author-paint-index.json'),
    'preview': 'http://127.0.0.1:4261/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models',
    'remaining': 'Different whole runtime/source/paint review, any SAME closure, then Root-only production integration.'
})
print(json.dumps({'bindings': len(files), 'runtimeInputs': sha(TOPIC / 'runtime-inputs.json'),
                  'authorReady': sha(TOPIC / 'runtime-author-ready.json'),
                  'paintIndex': sha(TOPIC / 'runtime-author-paint-index.json')}))
