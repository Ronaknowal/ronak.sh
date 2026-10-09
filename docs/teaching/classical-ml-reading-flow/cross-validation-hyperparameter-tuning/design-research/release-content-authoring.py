"""Root accepts the reviewed design composition and opens content revision four.

Identity checks reuse, rather than replay, the original scientific evidence.
"""
import copy
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
OWNER = Path(__file__).resolve().parent
TOPIC = 'cross-validation-hyperparameter-tuning'
LEDGER = ROOT / 'docs/teaching/lesson-delivery-progress.json'
RECEIPT = OWNER / 'root-design-acceptance-and-writing-release.json'

def load(path):
    return json.loads(path.read_text(encoding='utf-8'))

def identity(path):
    data = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}

def verify(row):
    actual = identity(ROOT / row['path'])
    assert actual['sha256'] == row['sha256'], row['path']
    if 'bytes' in row:
        assert actual['bytes'] == row['bytes'], row['path']
    return actual

assert not RECEIPT.exists(), 'A release already exists; inspect it instead of overwriting.'
proposal_path = OWNER / 'author-ready-design.json'
proposal = load(proposal_path)
assert identity(proposal_path)['sha256'] == '0b36c78f55dd683938b73bd1fd695254a5c5e0424b7a646f9e14924d57068809'
base = [verify(row) for row in proposal['files']]
assert len(base) == 60
closure_path = OWNER / 'consolidated-review-correction/independent-review/policy-closure-handoff.json'
closure = load(closure_path)
assert identity(closure_path)['sha256'] == '544c59fb3a6b6c91c2c4259d1731b7be7ea7f6a20fcbee116cd95267e4534b1c'
assert closure['status'] == 'F1_F2_DESIGN_CONTRACT_CLOSED_NO_ADDITIONAL_REQUIRED_FINDING'
reviewed = [verify(closure[key]) for key in ['originalProposal', 'originalWholeReview', 'amendment', 'report', 'check', 'checker']]
reviewed.extend(verify(row) for row in closure['complementaryArithmetic'])
ledger = load(LEDGER)
before = copy.deepcopy(ledger)
old = copy.deepcopy(ledger['topics'][TOPIC])
assert old['revision'] == 3 and old['content']['status'] == 'complete'
history = copy.deepcopy(old.get('previousRevisions', []))
history.append({key: value for key, value in old.items() if key != 'previousRevisions'})
timestamp = datetime.now(timezone.utc).isoformat()
record = 'docs/teaching/classical-ml-reading-flow/cross-validation-hyperparameter-tuning/reading-flow-revision.md'
ledger['topics'][TOPIC] = {
    'revision': 4, 'deliveryMode': 'full', 'record': record,
    'content': {'status': 'in-progress', 'startedAt': timestamp,
                'designRelease': RECEIPT.relative_to(ROOT).as_posix()},
    'implementation': {'status': 'not-started'},
    'previousRevisions': history,
    'nextAction': 'Write the complete eleven-section lesson, precise visual/lab specifications, all explained scratch/library programmes and solved practice from the accepted base design plus its F1/F2 amendment. Obtain author and DIFFERENT whole-content review before Root runtime release.'
}
foreign = [key for key in before['topics'] if key != TOPIC]
assert all(before['topics'][key] == ledger['topics'][key] for key in foreign)
receipt = {
    'schema': 'classical21-root-design-acceptance-writing-release/v1', 'at': timestamp,
    'topicId': TOPIC, 'revision': 4, 'status': 'DESIGN_ACCEPTED_COMPLETE_CONTENT_AUTHORING_RELEASED',
    'baseInputs': base, 'reviewedComposition': reviewed,
    'closureHandoff': identity(closure_path), 'releaseScript': identity(Path(__file__)),
    'retainedPreviousRow': old, 'foreignRowsConserved': len(foreign),
    'effectiveDesign': 'Original complete design plus design-policy-correction.md replacing only P11/D34/L10/N11 and P13/L12 policies; retain D37 static fixture separately.',
    'readingAttribution': 'Root previously read the entire original proposal and DIFFERENT review; Root read the complete amendment, complementary arithmetic report and SAME closure. Independent arithmetic is attributed to /root/nmf_content_recovery; no replay.',
    'scope': proposal['scope'],
    'requiredContent': ['complete continuous beginner-to-specialist manuscript', '41 actual-object visual contracts and all 14 investigation ownership groups', '15 complete explained programmes: three conserved and twelve new, with real outputs', 'all ten conserved and thirteen new solved tasks', 'author beginner/specialist reading and DIFFERENT entire content review'],
    'limits': ['No content completion claim', 'No runtime release or canonical/public changes', 'No new science, fits, builds, HTTP or native checks', 'Original scientific and access qualifications remain'],
}
RECEIPT.write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
ledger['updatedOn'] = timestamp[:10]
LEDGER.write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({'release': identity(RECEIPT), 'baseInputs': len(base), 'reviewedComposition': len(reviewed), 'foreignRowsConserved': len(foreign), 'content': 'in-progress', 'implementation': 'not-started'}))
