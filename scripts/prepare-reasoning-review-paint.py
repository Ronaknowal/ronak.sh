"""Prepare selected complete source-bound figures for root's independent reading."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

topic=Path('docs/teaching/llm-architecture-training/rl-for-reasoning-deepseek-r1-style')
out=topic/'root-review-paint'
out.mkdir(exist_ok=True)
sources=[]
def source(name):
    final=topic/'browser-layout/screenshots'/name
    return final if final.exists() else topic/'browser-v2/screenshots'/name
for viewport in ['desktop','phone']:
    for i in range(1,28): sources.append(source(f'{viewport}-D{i:02}-default.png'))
for i in [3,4,8,10,17,18,20,21,22,23,26]: sources.append(source(f'enlarged-D{i:02}-default.png'))
for i in [5,7,9,10,11,12,13,16,18,21,24,25,27]: sources.append(source(f'desktop-D{i:02}-changed.png'))
for i in range(1,15): sources.append(source(f'desktop-practice-{i:02}.png'))
tiles=[]
for p in sources:
    im=Image.open(p).convert('RGB')
    for top in range(0,im.height,920):
        piece=im.crop((0,top,im.width,min(im.height,top+920)))
        tile=Image.new('RGB',(max(780,piece.width),piece.height+30),'#141820')
        ImageDraw.Draw(tile).text((8,8),f'{p.parent.parent.name}/{p.name} y={top}',fill='white')
        tile.paste(piece,(0,30))
        tiles.append((tile,{'source':p.as_posix(),'top':top,'height':piece.height}))
atlases=[]
for i in range(0,len(tiles),4):
    group=tiles[i:i+4];width=max(t.width for t,_ in group);height=max(t.height for t,_ in group)
    canvas=Image.new('RGB',(2*width,height*((len(group)+1)//2)),'#141820')
    for j,(tile,_) in enumerate(group):canvas.paste(tile,((j%2)*width,(j//2)*height))
    path=out/f'atlas-{i//4:03}.png'
    assert not path.exists()
    canvas.save(path)
    atlases.append({'path':path.as_posix(),'tiles':[m for _,m in group]})
(out/'index.json').write_text(json.dumps({'sources':{p.as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},'atlases':atlases,'note':'Creation is not personal visual inspection.'},indent=2)+'\n',encoding='utf8')
print(json.dumps({'sources':len(sources),'tiles':len(tiles),'atlases':len(atlases)}))
