"""Exact-scale review sheets from retained browser pixels, not new observations."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib, sys

base = Path('docs/teaching/llm-architecture-training/inference-engines-serving')
mode=sys.argv[1] if len(sys.argv)>1 else 'desktop'
out = base / 'runtime-review-root' / (mode+'-sheets')
out.mkdir(parents=True, exist_ok=True)
files = []
for folder in ['runtime-native-paint', 'runtime-lifecycle/paint-r2', 'runtime-memory/browser']:
    for p in sorted((base / folder).glob('desktop-*-default*.png')):
        # The complete parent shows the initial local scroll position already.
        if '-local' in p.name and '-x0.png' in p.name:
            continue
        if '-pan-' in p.name:
            continue
        files.append(p)
if mode=='closure':
    files=[]
    def add(folder,pattern):
        files.extend(sorted((base/folder).glob(pattern)))
    for pattern in ['desktop-*-default.png','desktop-*-local*-x[1-9]*.png']:
        add('runtime-native-presentation-correction/paint-r2',pattern)
    for pattern in ['desktop-D03-B.png','desktop-D18-D.png','desktop-D21-adapter.png','desktop-D23-zero.png','phone-D19-default.png','enlarged-D03-B.png']:
        add('runtime-native-paint-r2',pattern)
    for stem in ['D04-cap-one','D05-cancel-terminal','D05-error-terminal','D06-commit-2','D07-reverse','D12-invalid','D12-merged-read','D14-evicted']:
        add('runtime-lifecycle/paint-r2','desktop-'+stem+'*.png')
    for stem in ['D08-five-pages','D29-default','D29-queue-limit-one']:
        add('runtime-lifecycle/paint-final-timelines','desktop-'+stem+'*.png')
    for pattern in ['desktop-D09-default.png','desktop-D09-changed.png','desktop-D15-default.png','desktop-D27-default.png','desktop-D27-region*.png','phone-D09-region*.png','enlarged-D15-region*.png']:
        add('runtime-memory/browser-closure',pattern)
    for id in ['D10','D16','D20','D24','D25','D26','D28','D30','D31']:
        add('runtime-memory/browser','desktop-'+id+'-changed*.png')
    files=list(dict.fromkeys(files))
tiles=[]
for p in files:
    im=Image.open(p).convert('RGB')
    for y in range(0,im.height,900):
        for x in range(0,im.width,900):
            tiles.append((p, (x,y,min(x+900,im.width),min(y+900,im.height)),im.crop((x,y,min(x+900,im.width),min(y+900,im.height)))))
manifest=[]
for start in range(0,len(tiles),4):
    sheet=Image.new('RGB',(1840,1920),'#333333'); draw=ImageDraw.Draw(sheet); entries=[]
    for j,(p,box,im) in enumerate(tiles[start:start+4]):
        x=10+(j%2)*920;y=10+(j//2)*960
        draw.text((x,y),p.parent.name+'/'+p.name+' '+str(box),fill='white')
        sheet.paste(im,(x,y+40))
        entries.append({'path':p.as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'crop':box})
    target=out/f'sheet-{start//4+1:03}.png';sheet.save(target)
    manifest.append({'path':target.as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'entries':entries})
(out/'manifest.json').write_text(json.dumps({'purpose':'Root whole default actual-paint reading, exact pixels; no claim of new browser acquisition','files':len(files),'tiles':len(tiles),'sheets':manifest},indent=2)+'\n')
print(json.dumps({'files':len(files),'tiles':len(tiles),'sheets':len(manifest)}))
