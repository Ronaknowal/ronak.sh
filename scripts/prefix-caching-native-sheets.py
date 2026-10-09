"""Arrange existing browser pixels without scaling; preserve every tile path."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

directory = Path(sys.argv[1])
report = json.loads((directory / 'report.json').read_text(encoding='utf8'))
tiles = [(item['name'], Path(tile)) for item in report['captures'] for tile in item['tiles']]
output = directory / 'native-sheets'
output.mkdir(exist_ok=True)
index = []
for start in range(0, len(tiles), 2):
    pair = tiles[start:start + 2]
    images = [Image.open(path).convert('RGB') for _, path in pair]
    canvas = Image.new('RGB', (sum(im.width for im in images) + 24, max(im.height for im in images) + 40), '#20232d')
    draw = ImageDraw.Draw(canvas)
    x = 8
    for (name, path), im in zip(pair, images):
        draw.text((x, 8), name + ' / ' + path.name, fill='white')
        canvas.paste(im, (x, 32))
        x += im.width + 8
    file = output / f'sheet-{start // 2 + 1:03}.png'
    canvas.save(file)
    index.append({'file': str(file), 'tiles': [str(p) for _, p in pair], 'names': [n for n, _ in pair], 'scale': 1})
(output / 'index.json').write_text(json.dumps(index, indent=2) + '\n', encoding='utf8')
print(json.dumps({'directory': str(output), 'sheets': len(index), 'tiles': len(tiles)}))
