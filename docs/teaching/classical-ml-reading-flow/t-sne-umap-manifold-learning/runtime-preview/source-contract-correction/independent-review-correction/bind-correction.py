from pathlib import Path
import base64
import difflib
import hashlib
import json

correction = Path(__file__).resolve().parent
owner = correction.parent.parent
app = owner.parents[4]

def read_json(path):
    return json.loads(path.read_text(encoding='utf8'))

def bind(path):
    data = path.read_bytes()
    return {'path': path.relative_to(app).as_posix(), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def write(name, value):
    path = correction / name
    assert not path.exists(), f'Frozen record exists: {path}'
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
    return bind(path)

previous = read_json(correction.parent / 'author-ready-source.json')
predecessors = read_json(correction / 'predecessor-bindings.json')
changes = []
forward, inverse = [], []
for row in predecessors['changed_owner_predecessors']:
    filename = row['path']
    old = (correction / row['predecessor']).read_bytes()
    new = (owner / filename).read_bytes()
    assert hashlib.sha256(old).hexdigest() == row['sha256']
    start = 0
    while start < min(len(old), len(new)) and old[start] == new[start]:
        start += 1
    suffix = 0
    while suffix < min(len(old), len(new)) - start and old[-suffix - 1] == new[-suffix - 1]:
        suffix += 1
    old_end = len(old) - suffix
    new_end = len(new) - suffix
    removed, inserted = old[start:old_end], new[start:new_end]
    assert old[:start] + inserted + old[old_end:] == new
    assert new[:start] + removed + new[new_end:] == old
    changes.append({'path': filename, 'predecessor': row, 'successor': bind(owner / filename),
                    'operation': 'exact-byte-window-replace', 'start': start,
                    'removedBytes': len(removed), 'insertedBytes': len(inserted),
                    'removedBase64': base64.b64encode(removed).decode('ascii'),
                    'insertedBase64': base64.b64encode(inserted).decode('ascii'),
                    'forwardAndInverseVerifiedInMemory': True})
    old_lines = old.decode('utf8').replace('\r\n', '\n').splitlines(keepends=True)
    new_lines = new.decode('utf8').replace('\r\n', '\n').splitlines(keepends=True)
    forward.extend(difflib.unified_diff(old_lines, new_lines, fromfile='predecessors/' + filename, tofile=filename))
    inverse.extend(difflib.unified_diff(new_lines, old_lines, fromfile=filename, tofile='predecessors/' + filename))

for filename in ['ManifoldOperationObjects.jsx', 'vite-review-correction.config.mjs']:
    data = (owner / filename).read_bytes()
    changes.append({'path': filename, 'operation': 'create-known-new-owner', 'successor': bind(owner / filename),
                    'createdBase64': base64.b64encode(data).decode('ascii'),
                    'inverse': 'remove only this exact newly created owner after verifying its successor SHA; no foreign path',
                    'forwardAndInverseVerifiedInMemory': True})
    forward.extend(difflib.unified_diff([], data.decode('utf8').splitlines(keepends=True), fromfile='/dev/null', tofile=filename))
    inverse.extend(difflib.unified_diff(data.decode('utf8').splitlines(keepends=True), [], fromfile=filename, tofile='/dev/null'))

for name, lines in [('source-delta.patch', forward), ('source-inverse.patch', inverse)]:
    assert not (correction / name).exists()
    (correction / name).write_text(''.join(lines), encoding='utf8')

delta = write('exact-source-deltas.json', {'schema': 'manifold-exact-byte-review-correction-deltas/v1',
    'scope': 'six changed product owners, one new operation module, one new isolated config; no old scientific source edits',
    'format': 'Byte-window replacement is authoritative and preserves mixed original newlines; human unified patches normalize CRLF for review only.',
    'changes': changes})

new_sources = ['ManifoldOperationObjects.jsx', 'vite-review-correction.config.mjs',
    'source-contract-correction/independent-review-correction/check-review-corrections.mjs',
    'source-contract-correction/independent-review-correction/bind-correction.py']
bindings = [bind(app / row['path']) for row in previous['currentSourceBindings']]
bindings += [bind(owner / filename) for filename in new_sources]
assert len(bindings) == 29
packet = {
    'schema': 'manifold-independent-review-correction-author-source-handoff/v1',
    'status': 'CORRECTED_SOURCE_AUTHOR_READY_SUCCESSOR_BUILD_NATIVE_AND_SAME_REVIEWER_CLOSURE_PENDING',
    'author': '/root/tsne_consolidated_content_correction',
    'independentReviewClaimed': False, 'runtimeAcceptanceClaimed': False, 'phaseAcceptanceClaimed': False,
    'priorFrozenAuthorPacket': bind(correction.parent / 'author-ready-source.json'),
    'independentReview': [bind(owner / 'independent-whole-runtime-review' / name) for name in ['review.md', 'review-packet.json']],
    'currentSourceBindings': bindings,
    'acceptedContentReferences': previous['acceptedContentReferences'],
    'completeDelivery': previous['completeDelivery'],
    'authorReview': bind(correction / 'author-source-review.md'),
    'contractAmendments': bind(correction / 'contract-amendments.md'),
    'delta': delta, 'forwardPatch': bind(correction / 'source-delta.patch'), 'inversePatch': bind(correction / 'source-inverse.patch'),
    'focusedCheck': bind(correction / 'source-semantic-check.json'),
    'initialFocusedCheckBeforeReadbackImprovements': bind(correction / 'initial-source-semantic-check.json'),
    'actualCheckCommand': bind(correction / 'check-command.json'),
    'wholeReading': 'Fresh full affected-source readback and continuous Reader sections1,3,4,5,8,10 compose with actual unchanged prior complete manuscript/programme/spec/setup reading. Hash checks prove conservation, not fresh reading.',
    'retainedScope': {'sections': 13, 'drawings': 45, 'investigations': 12, 'completePythonSources': 15, 'completeStreams': 15, 'solvedTasks': 19, 'mappedPayloads': 35},
    'oldScientificMainsFitsCampaignsReplayed': False,
    'previousPreview': {'url': 'http://127.0.0.1:5194/learn/path/full-curriculum/t-sne-umap-manifold-learning?module=classical-ml', 'session': 21992, 'role': 'unchanged predecessor build; not corrected-source evidence'},
    'plannedSuccessor': {'config': bind(owner / 'vite-review-correction.config.mjs'), 'outDir': 'build-review-corrected', 'port': 5195, 'publicDir': False, 'buildExecutedAtThisFreeze': False},
    'nativeAuthorEvidence': {'personallyViewedWindows': [], 'role': 'No native assertion from source/SSR; fresh scoped availability may be checked after successor serves.'},
    'remaining': ['One isolated successor build with exact logical source/module/config/artifact bindings and scoped HTTP.', 'Actual native affected drawings and Gaussian controls; Root complement attributed to Root.', 'Same DIFFERENT original reviewer closure against successor and full conserved composition.', 'Root normal integration, routes/fragments/Back and private CSS scoping; no central/public/canonical mutation here.'],
}
ready = write('author-ready-source.json', packet)
print(json.dumps({'status': packet['status'], 'sourceBindings': len(bindings), 'authorReady': ready, 'exactDeltas': delta}, indent=2))
