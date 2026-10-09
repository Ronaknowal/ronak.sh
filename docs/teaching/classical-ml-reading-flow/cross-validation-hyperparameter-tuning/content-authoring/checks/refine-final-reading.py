"""Bounded final-reading corrections; keep exact preimages and inverse text."""
from pathlib import Path
import hashlib
import json
import re

OWNER = Path(__file__).resolve().parents[1]
RECEIPT = OWNER / 'checks/final-reading-placement-correction.json'
PREIMAGES = OWNER / 'checks/final-reading-preimages'


def binding(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def main():
    if RECEIPT.exists():
        raise ValueError('Immutable correction receipt already exists.')
    PREIMAGES.mkdir(exist_ok=True)
    edits = []
    for filename in ['06-real-experiment.md', '07-risk-and-uncertainty.md', '08-adaptive-search.md']:
        path = OWNER / 'sections' / filename
        before = path.read_bytes()
        text = before.decode('utf8')
        changes = []
        # Earlier placement edits inserted LF markers but failed to remove CRLF
        # predecessors. Keep the first drawing position and the last P02/P03
        # programme position, exactly as the pedagogical readback intended.
        for identifier in ['D27', 'D31', 'D32', 'D34', 'D35', 'D36', 'D37', 'D40']:
            hits = list(re.finditer(r'<!-- Drawing ' + identifier + r':[^\r\n]*-->(?:\r?\n){2}', text))
            if len(hits) == 2:
                old = hits[1].group()
                text = text[:hits[1].start()] + text[hits[1].end():]
                changes.append({'operation': 'remove second placement', 'id': identifier, 'old': old, 'new': ''})
            elif len(hits) > 2:
                raise ValueError('Unexpected marker multiplicity: ' + identifier)
        for identifier in ['P02', 'P03']:
            hits = list(re.finditer(r'<!-- Programme ' + identifier + r':[^\r\n]*-->(?:\r?\n){2}', text))
            if len(hits) == 2:
                old = hits[0].group()
                text = text[:hits[0].start()] + text[hits[0].end():]
                changes.append({'operation': 'remove first placement', 'id': identifier, 'old': old, 'new': ''})
        if filename.startswith('06-'):
            hits = list(re.finditer(r'These are the exact retained source and displayed stdout[^\r\n]+(?:\r?\n){2}', text))
            assert len(hits) == 2
            old = hits[0].group()
            text = text[:hits[0].start()] + text[hits[0].end():]
            changes.append({'operation': 'remove duplicated retained-role paragraph', 'old': old, 'new': ''})
        after = text.encode('utf8')
        (PREIMAGES / filename).write_bytes(before)
        path.write_bytes(after)
        edits.append({'path': path.relative_to(OWNER).as_posix(), 'before': binding(before), 'after': binding(after), 'changes': changes})
    path = OWNER / 'visual-specifications.md'
    before = path.read_bytes()
    text = before.decode('utf8')
    replacements = [
        ('horizontal seven-column schema', 'horizontal six-column schema'),
        ('allocates one positive and three negatives to each of three held folds.', 'allocates held masks [0,1,2,3], [4,5,6,7] and [8,9,10,11], one positive and three negatives to each.'),
    ]
    for old, new in replacements:
        assert text.count(old) == 1, old
        text = text.replace(old, new)
    after = text.encode('utf8')
    (PREIMAGES / path.name).write_bytes(before)
    path.write_bytes(after)
    edits.append({'path': path.name, 'before': binding(before), 'after': binding(after), 'changes': [{'old': old, 'new': new} for old, new in replacements]})
    RECEIPT.write_bytes((json.dumps({'schema': 'classical21-final-reading-placement-correction/v1', 'scope': 'Remove duplicate composition directives and one duplicate role paragraph; correct six-feature/target schema count and make declared stratification masks explicit. Programme bytes and streams unchanged.', 'edits': edits}, indent=2) + '\n').encode('utf8'))
    print(json.dumps({'receipt': binding(RECEIPT.read_bytes()), 'changed_files': len(edits)}))


if __name__ == '__main__':
    main()
