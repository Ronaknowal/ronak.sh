"""Native image inspection: crop, paste and label only; no resampling."""
from pathlib import Path
import hashlib,json,sys
from PIL import Image,ImageDraw
b=Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar')/sys.argv[1]
out=b/'native-sheets';out.mkdir(exist_ok=True)
parts=[]
for p in sorted((b/'screenshots').glob('*.png')):
    im=Image.open(p).convert('RGB')
    for top in range(0,im.height,880):
        tile=im.crop((0,top,im.width,min(im.height,top+900)))
        parts.append((p,top,tile))
index=[]
for start in range(0,len(parts),4):
    group=parts[start:start+4];w=max(t[2].width for t in group);h=max(t[2].height for t in group)
    canvas=Image.new('RGB',(w*2,(h+30)*2),'#202020');draw=ImageDraw.Draw(canvas)
    sources=[]
    for i,(p,top,tile) in enumerate(group):
        x=i%2*w;y=i//2*(h+30);draw.text((x+5,y+8),f'{p.name} y={top}',fill='white');canvas.paste(tile,(x,y+30));sources.append({'path':p.as_posix(),'top':top,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    file=out/f'sheet-{start//4+1:03}.png';canvas.save(file);index.append({'path':file.as_posix(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sources':sources})
(out/'index.json').write_text(json.dumps(index,indent=2)+'\n')
print(json.dumps({'nativeTiles':len(parts),'sheets':len(index),'operation':'Cropped/pasted original pixels without resampling; labels outside pixels'}))
