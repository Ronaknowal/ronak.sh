"""Record observed browser evidence and compose the bounded D30 written addition."""
import copy
import datetime
import hashlib
import json
from pathlib import Path

OWNER = Path(__file__).resolve().parent
ROOT = Path.cwd().resolve()
TOPIC = 't-sne-umap-manifold-learning'
LEDGER = ROOT / 'docs/teaching/lesson-delivery-progress.json'

def identity(path):
    data = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}

def exact(row):
    actual = identity(ROOT / row['path'])
    assert actual['sha256'] == row['sha256'], row['path']
    return actual

built = json.loads((OWNER / 'built-source-http.json').read_text(encoding='utf-8'))
for row in built['moduleSourceBindings'] + built['productBindings']:
    exact(row)
assert identity(OWNER / 'independent-review/source-closure.md')['sha256'] == '44b49e5168e027f1da858d3cd56c3109b0a538753c387eca92be4997e941b302'
original = LEDGER.read_bytes()
ledger = json.loads(original)
selected = ledger['topics'][TOPIC]
previous = copy.deepcopy(selected)
assert selected['revision'] == 5 and selected['content']['status'] == 'complete'
assert selected['implementation']['status'] == 'in-progress'
for rel, digest in selected['content']['files'].items():
    assert identity(ROOT / rel)['sha256'] == digest, rel

download = Path('C:/Users/ronak/Downloads/reference_map_routes.py')
download_bytes = download.read_bytes()
assert len(download_bytes) == 3842
assert hashlib.sha256(download_bytes).hexdigest() == '96d065b7c9cf119002e89d3cf508f788a4918bcec38d4fa993839f570aef7ac9'
screens = [identity(path) for path in sorted(OWNER.glob('*.png'))]
assert len(screens) == 17, len(screens)
output = OWNER / 'root-native-continuation.json'
assert not output.exists(), 'Preserve frozen evidence.'
receipt = {
    'schema': 'root-manifold-d30-actual-wiring-and-native-continuation/v1',
    'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'observer': '/root',
    'status': 'D30_DEPENDENCY_FINDING_CLOSED_CURRENT_PRIVATE_SOURCE_AND_AFFECTED_NATIVE_NORMAL_INTEGRATION_PENDING',
    'builtSourceHTTP': identity(OWNER / 'built-source-http.json'),
    'independentReportReadCompletely': identity(OWNER / 'independent-review/source-closure.md'),
    'priorNativeCheckpoint': identity(OWNER.parent / 'root-native-reading-checkpoint.json'),
    'priorWrittenAmendment': identity(ROOT / selected['content']['amendmentRecord']),
    'currentWrittenPresentation': [identity(OWNER / 'NativeReadingObjects.jsx'), identity(OWNER / 'wiring.css')],
    'acceptedWrittenAddition': 'D30 now begins with actual split/reducer/classifier dependency drawings and their two immediate walks. Existing array details remain; generic reading-order arrows are removed. This changes the visual explanation, not retained fitting programmes, state values, result totals or scientific execution claims.',
    'browser': {'tab': '5', 'port': 5203, 'livePreviewSession': 64108},
    'actualNativeObservations': [
        'Desktop1280: personally read reducer train-fit/state-reuse/held-bypass and classifier train-label inputs/held prediction paths.',
        'Desktop classifier keyboard ArrowRight focuses the local region with amber2px outline and moves scrollLeft27.3333; document width1265 stays inside1280.',
        'Phone390: reducer region309px, graph832px, document375px. Native ArrowRight traversed training→held lane to522.6667 of523px; both observed screenshots read.',
        '768x1024 actual root32px via private Preview text size control: graph1664x1000 from832x500 viewBox; text scales geometrically2x. Region580px/document753px; no page spill.',
        'Native keyboard reached both horizontal ends at enlarged size; observed trained-state formula, held transform, training-label input, stored classifier reuse and held-label evaluation in separate native windows.',
        'Tablet768/root16 D33: personally read weighted T0return vector and returned sum on the same±1.5/multiplier160 ruler; no unrelated-coordinate jitter.',
        'Tablet768/root16 D39: first component-constant signal retains A/B/D/E identities and1/1/0/0 values with zero present-edge differences.',
        'Tablet768/root16 D41: separate opposite arrows show A→B1,B→A.5,B→C.5,C→B1; attached labels read against transition table.',
        'Tablet768/root16 D44: hollow initial/filled retained final coordinates, per-ID numeric values and dashed difference joins distinguish endpoints from an invented intermediate trajectory.',
        'Phone390 D28 saved t-SNE map: actual dense marks remain dense, membership shapes and legend persist; individual close marks require the linked ranked-image IDs.',
        'Phone code Copy reference_map_routes.py: actual button shows checkmark and Copied. Browser clipboard readText/read returned empty, so payload-copy success is NOT certified.',
        'Native program download event returned C:/Users/ronak/Downloads/reference_map_routes.py; actual3842bytes/hash exactly match the current full programme.',
    ],
    'screenshotsReadPersonally': screens,
    'interactionQualifications': [
        'Read-only getScreenCTM inspection was unsupported; no geometry claim uses that failed call. Observed SVG width1664/viewBox832 establishes the stated2x scale.',
        'Browser download action took1028.216seconds despite requested12000ms timeout. It returned an actual file; the delayed observation is not performance evidence or a reason to restart the live server.',
        'Enlarged graphs deliberately scroll locally; individual native windows show portions, with complementary endpoint windows rather than a claim of simultaneous whole-graph visibility.',
    ],
    'remaining': [
        'Normal canonical/public/Reader integration and its current-source/loading verification.',
        'Complete remaining affected-control/default/reset and delivery/recovery checks by composing prior exact evidence with changed dependencies.',
        'Copy payload remains unverified in this browser session despite observed success feedback; retain that boundary.',
        'During normal composition, add word spacing to the new labels Fit one5-NN and compare with75; preserve original frozen review/paint evidence and verify the two exact presentation changes.',
    ],
    'phaseStatusChanges': 'none', 'previousSelectedRow': previous,
    'retainedContentBindings': len(previous['content']['files']),
    'limits': ['Partial complementary native evidence, not a fresh entire-topic native campaign',
               'No old science or instructional-main replay', 'No universal diagram or beginner-mastery certification'],
}
for name in ['NativeReadingObjects.jsx', 'wiring.css']:
    row = identity(OWNER / name)
    selected['content']['files'][row['path']] = row['sha256']
selected['content']['amendmentRecord'] = output.relative_to(ROOT).as_posix()
selected['nextAction'] = 'Compose the accepted ffba1af1 whole reader and D30 actual-wiring successor with original reviews/science; finish affected native/control/delivery qualifications, then integrate canonical/public and verify the normal Reader. D30 source+affected native is closed; no implementation completion yet.'
foreign = {key: value for key, value in ledger['topics'].items() if key != TOPIC}
assert foreign == {key: value for key, value in json.loads(original)['topics'].items() if key != TOPIC}
assert selected['content']['status'] == previous['content']['status']
assert selected['content']['completedAt'] == previous['content']['completedAt']
assert selected['implementation'] == previous['implementation']
receipt['foreignRowsConserved'] = len(foreign)
receipt['currentContentBindings'] = len(selected['content']['files'])
receipt['ledgerBeforeSha256'] = hashlib.sha256(original).hexdigest()
updated = (json.dumps(ledger, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
receipt['ledgerAfterSha256'] = hashlib.sha256(updated).hexdigest()
assert LEDGER.read_bytes() == original, 'A concurrent ledger owner changed it; do not overwrite.'
output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
LEDGER.write_bytes(updated)
print(json.dumps({'receipt': identity(output), 'contentBindings': len(selected['content']['files']),
                  'foreignRowsConserved': len(foreign), 'screenshots': len(screens), 'phaseChanges': 0}))
