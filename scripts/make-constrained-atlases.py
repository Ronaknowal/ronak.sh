from pathlib import Path
import hashlib,json,sys
from PIL import Image,ImageDraw
b=Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar')/sys.argv[1]
out=b/'atlases';out.mkdir(exist_ok=True)
images=sorted((b/'screenshots').glob('*.png'));index=[]
for group in range(0,len(images),4):
    paths=images[group:group+4]; opened=[Image.open(p).convert('RGB') for p in paths]
    width=max(im.width for im in opened); height=max(im.height for im in opened)
    canvas=Image.new('RGB',(width*2,(height+32)*2),'#202020');draw=ImageDraw.Draw(canvas)
    for i,(p,im) in enumerate(zip(paths,opened)):
        x=(i%2)*width;y=(i//2)*(height+32);draw.text((x+5,y+8),p.name,fill='white');canvas.paste(im,(x,y+32))
    file=out/f'atlas-{group//4+1:03}.png';canvas.save(file)
    index.append({'path':file.as_posix(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sources':[{'path':p.as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths],'operation':'Original native screenshots pasted at exact size; labels outside pixels. Large images can be viewer-resized; use native source for fine text.'})
(out/'index.json').write_text(json.dumps(index,indent=2)+'\n')
print(len(index))
