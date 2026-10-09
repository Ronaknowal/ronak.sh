"""Independent reviewer image index; preserves every captured pixel."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback'
OUT = BASE / 'independent-runtime'
OUT.mkdir(exist_ok=True)
packet = json.loads((BASE / 'runtime-inputs.json').read_text())
checks = []
def check(label, condition):
    assert condition, label
    checks.append(label)
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
for name, sha in packet['bindings'].items():
    check('frozen:' + name, digest(ROOT / name) == sha)
content = json.loads((BASE / 'content-successor/inputs.json').read_text())
for item in content['files']:
    name, sha = item['path'], item['sha256']
    check('accepted-content:' + name, digest(ROOT / name) == sha)
index = json.loads((BASE / 'runtime-paint-index.json').read_text())
images = index['images']
check('84 defaults', len(images) == 84)
pages = []
for view in ['desktop', 'phone', 'enlarged']:
    selected = [item for item in images if item['view'] == view]
    check(view + ':28 identities', {item['id'] for item in selected} == {f'D{i:02}' for i in range(1,29)})
    for start in range(0, 28, 2):
        pair = selected[start:start+2]
        opened = []
        for item in pair:
            path = ROOT / item['path']
            check('paint:' + item['path'], digest(path) == item['sha256'])
            opened.append(Image.open(path).convert('RGB'))
        sheet = Image.new('RGB', (sum(im.width for im in opened) + 20, max(im.height for im in opened) + 42), 'white')
        draw = ImageDraw.Draw(sheet)
        x = 0
        for item, im in zip(pair, opened):
            draw.text((x+4,4), view + ' ' + item['id'], fill='black')
            sheet.paste(im,(x,32))
            x += im.width + 20
        filename = f'{view}-{start+1:02}-{start+2:02}.png'
        sheet.save(OUT / filename)
        pages.append({'path': filename, 'sources': pair, 'size': list(sheet.size)})
receipt = {'runtime_packet_sha256': digest(BASE / 'runtime-inputs.json'), 'checks': len(checks), 'status':'passed', 'pages':pages, 'scope':'Byte guards and pixel-preserving juxtaposition only; human inspection recorded separately.'}
extra = []
for folder in ['browser-interactions', 'browser-state-closure', 'browser-final-presentation']:
    for path in sorted((BASE / folder / 'screenshots').glob('*.png')):
        if folder == 'browser-interactions' and path.name == 'path-temperature.png':
            continue
        if folder == 'browser-state-closure' and 'path-temperature' in path.name:
            continue
        extra.append(path)
for start in range(0, len(extra), 3):
    paths = extra[start:start+3]
    opened = [Image.open(path).convert('RGB') for path in paths]
    sheet = Image.new('RGB', (sum(im.width for im in opened)+40,max(im.height for im in opened)+42),'white')
    draw=ImageDraw.Draw(sheet)
    x=0
    for path,im in zip(paths,opened):
        draw.text((x+4,4),path.name,fill='black')
        sheet.paste(im,(x,32))
        x+=im.width+20
    filename=f'extra-{start//3+1:02}.png'
    sheet.save(OUT/filename)
    pages.append({'path':filename,'sources':[str(path.relative_to(ROOT)) for path in paths],'size':list(sheet.size)})
receipt['extra_images']=len(extra)
receipt['pages']=pages
(OUT / 'image-index.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({key:value for key,value in receipt.items() if key != 'pages'}))
