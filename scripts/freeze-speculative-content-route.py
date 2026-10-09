"""Freeze a copy-only first-pass/practice return-route correction."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT/'docs/teaching/llm-architecture-training/speculative-decoding'
FIX = TOPIC/'content-route-correction'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


old = (FIX/'lesson.md').read_text(encoding='utf8')
new = (TOPIC/'lesson.md').read_text(encoding='utf8')
edits = [
('For a first pass, follow sections 1–10 and 13–18. Sections 11–12 extend the mechanism to trees and learned proposers; their explanations remain visible.',
 'For a first pass, follow sections 1–10 and 13–18, doing practice tasks 1–12 and 17–18. Sections 11–12 extend the mechanism to trees and learned proposers; return to them before practice tasks 13–16. Their explanations remain visible.'),
('Use the changed inputs below before opening each solution. The [complete answer program]',
 'Use the changed inputs below before opening each solution. On a first pass, do tasks 1–12 and 17–18; tasks 13–16 return to the deeper tree and learned-proposer sections as linked below. The [complete answer program]'),
('### 13. Write a tree mask\n',
 "### 13. Write a tree mask\n\nThis begins the deeper practice branch. Tasks 13–14 use [section 11's tree masks and sequential residual correction](#11-a-tree-needs-both-a-valid-mask-and-a-valid-verifier); tasks 15–16 use [section 12's learned heads and EAGLE dependencies](#12-learn-better-proposals-from-a-shared-state). Read those sections before attempting the corresponding tasks. First-pass readers can continue with task 17 and return here afterward.\n")]
expected = old
for before,after in edits:
    assert expected.count(before)==1
    expected = expected.replace(before,after)
assert expected==new
packet = json.loads((FIX/'content-inputs.json').read_text())
for row in packet['files']:
    source = ROOT/row['path']
    if source==TOPIC/'lesson.md':
        source = FIX/'lesson.md'
    assert sha(source)==row['sha256'],str(source)
paths = {ROOT/row['path'] for row in packet['files']}
paths.update([FIX/'lesson.md',FIX/'content-inputs.json',TOPIC/'content-inputs.json',Path(__file__),
              TOPIC/'independent-content-multimodal/review.md'])
data = {'scope':'Exactly three first-pass/practice route prose edits; all exercise operands/programs/science unchanged.',
        'predecessor_bindings':len(packet['files']), 'edits':edits,
        'files':[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for p in sorted(paths)]}
with (FIX/'inputs.json').open('x',encoding='utf8') as stream:
    json.dump(data,stream,indent=2)
    stream.write('\n')
print(json.dumps({'bindings':len(data['files']),'packet_sha256':sha(FIX/'inputs.json'),'manuscript_sha256':sha(TOPIC/'lesson.md')}))
