"""Apply the bounded F1/F6 runtime composition changes, preserving manuscript/evidence."""
import hashlib
import json
import re
from pathlib import Path

OWNER = Path(__file__).resolve().parent
source = OWNER.parent / 'nmf-lesson.jsx'
before = source.read_text(encoding='utf-8')
assert hashlib.sha256(source.read_bytes()).hexdigest() == '3f9700be75fefe030054777b34f7c1fbcbb3c3925195a07ff85b3d9387812328'
after = before.replace('../../../../../src/', '../../../../../../src/')
after, compass_count = re.subn(r'<nav className="nmf-compass".*?</nav>\n', '', after)
assert compass_count == 1
after = after.replace("import {FileIndex} from './FileIndex.jsx';", "import {FileActions} from './FileIndex.jsx';")
assert after.count('<FileIndex />') == 1
after = after.replace('<FileIndex />\n', '')
old = 'The first image is the raw C1 pattern H[C1]. Multiplying each of its 64 cells by 0.176453 makes the second image, the '
new = 'The image labelled C1 per-unit pattern is the raw pattern H[C1]. Multiplying each of its 64 cells by 0.176453 makes the image labelled C1 weighted addend, the '
assert after.count(old) == 1
after = after.replace(old, new)
lines = after.splitlines()
table_index = next(i for i, line in enumerate(lines) if line.startswith('<NeuralTable caption={"Files for the worked implementations"}'))
table_before = lines[table_index]
filenames = re.findall(r'<code>\{"([^"\n]+\.(?:py|json|csv|md))"\}</code>', table_before)
assert len(filenames) == len(set(filenames)) == 22
table_after = table_before
for name in filenames:
    token = '<code>{'+json.dumps(name)+'}</code>'
    assert table_after.count(token) == 1
    table_after = table_after.replace(token, token+'<FileActions filename={'+json.dumps(name)+'} />')
lines[table_index] = table_after
after = '\n'.join(lines)+'\n'
assert after.count('<H2>') == before.count('<H2>') == 19
assert after.count('<RemoteCodeBlock ') == before.count('<RemoteCodeBlock ')
assert after.count('className="nmf-practice"') == before.count('className="nmf-practice"')
(OWNER / 'nmf-lesson.jsx').write_text(after, encoding='utf-8')
receipt = {'schema':'nmf-runtime-composition-correction/v1',
           'inputSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
           'outputSha256':hashlib.sha256(after.encode()).hexdigest(),
           'changes':['Remove duplicate custom compass; shared guide remains unchanged',
                      'Merge 22 complete-source action groups into the existing unabridged pedagogical file table',
                      'Name C1 pattern/addend labels instead of incorrect positional first/second references',
                      'Adjust imports for the private successor directory'],
           'textAmendment':{'before':old,'after':new},'filenames':filenames,
           'manuscriptChanged':False,'scientificExecutions':0,'phaseChanges':0}
(OWNER/'composition-correction.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'fileActions':len(filenames),'headings':19,'receipt':receipt['outputSha256']}))
