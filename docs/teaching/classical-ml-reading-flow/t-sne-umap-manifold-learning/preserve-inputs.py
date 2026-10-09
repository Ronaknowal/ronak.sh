"""One scoped byte-preservation intake; no scientific program is imported or run."""
from pathlib import Path
import hashlib, json

ROOT = Path(__file__).resolve().parents[4]
OWNER = Path(__file__).resolve().parent
sha = lambda b: hashlib.sha256(b).hexdigest()
paths = [
    'src/learn/data/topics/t-sne-umap-manifold-learning.jsx',
    'src/learn/data/manifold-models.js', 'src/learn/data/manifold-data.js',
    'src/learn/data/manifold-examples.js', 'src/learn/data/manifold-mechanism-program.js',
    'src/learn/data/curriculum/blueprints/t-sne-umap-manifold-learning.js',
    'src/learn/components/lesson-labs/ManifoldFigures.jsx',
    'src/learn/components/lesson-labs/ManifoldLabs.jsx',
    'src/learn/components/lesson-labs/ManifoldShared.jsx',
    'src/learn/components/lesson-labs/manifold-figures.css',
    'src/learn/components/lesson-labs/manifold-labs.css',
    'src/learn/components/lesson-labs/manifold-lesson.css',
    'docs/teaching/MANIFOLD-LEARNING-LESSON-DESIGN.md',
    'docs/teaching/topic-notes/t-sne-umap-manifold-learning.md',
    'docs/teaching/evidence/manifold-native.json',
    'docs/teaching/evidence/manifold-models.json',
    'docs/teaching/evidence/manifold-data.json',
    'docs/teaching/evidence/manifold-integration.json',
    'docs/teaching/evidence/manifold-independent-technical-review.md',
]
for directory in [
    'docs/teaching/drafts/t-sne-umap-manifold-learning',
    'docs/teaching/concept-intuition/t-sne-umap-manifold-learning',
    'public/learn-assets/manifold-learning',
]:
    paths += [p.relative_to(ROOT).as_posix() for p in (ROOT / directory).iterdir() if p.is_file()]
guards = []
for name in sorted(set(paths)):
    body = (ROOT / name).read_bytes()
    destination = OWNER / 'original' / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('xb') as output:
        output.write(body)
    guards.append(dict(path=name, bytes=len(body), sha256=sha(body),
                       preserved=destination.relative_to(OWNER).as_posix()))
ledger = ROOT / 'docs/teaching/lesson-delivery-progress.json'
ledger_bytes = ledger.read_bytes()
ledger_text = ledger_bytes.decode('utf-8')
key = '"t-sne-umap-manifold-learning":'
start = ledger_text.index(key) + len(key)
while ledger_text[start].isspace(): start += 1
row, length = json.JSONDecoder().raw_decode(ledger_text[start:])
raw_row = ledger_text[start:start + length].encode('utf-8')
with (OWNER / 'original/selected-ledger-row.json').open('xb') as output: output.write(raw_row)
assert json.loads(raw_row) == json.loads(ledger_text)['topics']['t-sne-umap-manifold-learning']
selected = dict(path=ledger.relative_to(ROOT).as_posix(), wholeFileSha256=sha(ledger_bytes),
                selectedRowSha256=sha(raw_row), selectedRowBytes=len(raw_row),
                revision=row['revision'], preserved='original/selected-ledger-row.json')
context = []
for name in ['AGENTS.md','skills/lesson-authoring/SKILL.md',
             'skills/lesson-authoring/references/topic-design.md',
             'skills/lesson-authoring/references/research-updates.md',
             'skills/lesson-authoring/references/visuals-and-labs.md',
             'skills/lesson-authoring/references/examples-and-code.md',
             'skills/lesson-authoring/references/writing-style.md',
             'skills/lesson-authoring/references/review.md',
             'docs/teaching/LESSON-AUTHORING-HANDOFF.md',
             'src/learn/data/lesson-manifest.json',
             'docs/teaching/deep-research-registry.json',
             'src/learn/data/topics/pca-dimensionality-reduction.jsx',
             'src/learn/data/topics/clustering-evaluation-validation-silhouette-ari-nmi.jsx',
             'src/learn/data/topics/support-vector-machines-svm.jsx']:
    source = ROOT / name
    if source.is_file():
        b = source.read_bytes()
        context.append(dict(path=name, bytes=len(b), sha256=sha(b), role='read-only context; not copied or owned'))
record = dict(topicId='t-sne-umap-manifold-learning', modulePosition=17,
              phase='proposed design, independent entire review required',
              sourceGuards=guards, selectedLedger=selected, contextGuards=context,
              conservation='Exact byte copies once. All historical streams and arrays unchanged. No fitting, execution of old programs, browser or build claim.')
with (OWNER / 'source-conservation.json').open('x', encoding='utf-8', newline='\n') as output:
    output.write(json.dumps(record, indent=2) + '\n')
print(json.dumps({'preservedFiles':len(guards), 'selectedRow':selected,
                  'conservationSha256':sha((OWNER/'source-conservation.json').read_bytes())}, indent=2))
