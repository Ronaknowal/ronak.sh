"""Tile browser screenshots without resizing for an actual visual reading pass."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

topic = Path('docs/teaching/llm-architecture-training/knowledge-distillation-for-llms-deepseek-r1-distill-cot-distillation')
report_path = topic/'browser-evidence'/sys.argv[1]
report = json.loads(report_path.read_text())
out = topic/('paint-' + report_path.stem)
out.mkdir(exist_ok=False)
tiles = []
for name in report['captures']:
    source = topic/'browser-evidence'/name
    im = Image.open(source).convert('RGB')
    for top in range(0, im.height, 950):
        piece = im.crop((0, top, im.width, min(top + 950, im.height)))
        tile = Image.new('RGB', (max(780, piece.width), piece.height + 30), '#161b23')
        ImageDraw.Draw(tile).text((8,8), name + ' y=' + str(top), fill='white')
        tile.paste(piece, (0,30))
        tiles.append((tile, {'source':source.as_posix(),'top':top,'height':piece.height}))
atlases = []
for index in range(0, len(tiles), 4):
    group = tiles[index:index+4]
    width = max(tile.width for tile,_ in group)
    height = max(tile.height for tile,_ in group)
    image = Image.new('RGB', (2*width, height*((len(group)+1)//2)), '#161b23')
    for j,(tile,_) in enumerate(group):
        image.paste(tile, ((j%2)*width,(j//2)*height))
    path = out/f'atlas-{index//4:03}.png'
    image.save(path)
    atlases.append({'path':path.as_posix(),'tiles':[meta for _,meta in group]})
index = {'source_report':report_path.as_posix(),'source_report_sha256':hashlib.sha256(report_path.read_bytes()).hexdigest(),
         'atlases':atlases,'note':'Pixel-preserving preparation only. Actual reading is recorded separately.'}
(out/'index.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'captures':len(report['captures']),'tiles':len(tiles),'atlases':len(atlases),'directory':out.as_posix()}))
