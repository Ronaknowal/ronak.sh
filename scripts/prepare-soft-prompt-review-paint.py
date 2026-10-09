"""Pixel-preserving independent-review contact sheets; no browser/science replay."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

topic = Path('docs/teaching/llm-architecture-training/p-tuning-soft-prompt-methods')
out = topic / 'root-review-paint'
out.mkdir(exist_ok=True)
sources = []
for viewport in ['desktop', 'phone']:
    for number in range(1, 27):
        name = f'{viewport}-P{number:02}.png'
        latest = topic / 'browser-evidence' / ('delta-' + name)
        sources.append(latest if number in [3, 7, 15, 16] and latest.exists()
                       else topic / 'browser-evidence' / name)
for number in [3, 7, 8, 11, 15, 18, 20, 21, 24, 25]:
    name = f'zoom-P{number:02}.png'
    latest = topic / 'browser-evidence' / ('delta-' + name)
    sources.append(latest if number in [3, 7, 15, 16] and latest.exists()
                   else topic / 'browser-evidence' / name)
for number in [4, 9, 11, 12, 17, 21, 26]:
    sources.append(topic / 'browser-evidence' / f'desktop-P{number:02}-changed.png')
for number in range(1, 13):
    sources.append(topic / 'reading-evidence' / f'practice-{number:02}.png')
tiles = []
for source in sources:
    im = Image.open(source).convert('RGB')
    for top in range(0, im.height, 950):
        piece = im.crop((0, top, im.width, min(im.height, top + 950)))
        tile = Image.new('RGB', (max(780, piece.width), piece.height + 30), '#141820')
        ImageDraw.Draw(tile).text((8, 8), f'{source.parent.name}/{source.name} y={top}', fill='white')
        tile.paste(piece, (0, 30))
        tiles.append((tile, {'source': source.as_posix(), 'top': top, 'height': piece.height}))
atlases = []
for index in range(0, len(tiles), 4):
    group = tiles[index:index+4]
    width = max(tile.width for tile, _ in group)
    height = max(tile.height for tile, _ in group)
    canvas = Image.new('RGB', (width * 2, height * ((len(group)+1)//2)), '#141820')
    for j, (tile, _) in enumerate(group):
        canvas.paste(tile, ((j % 2)*width, (j//2)*height))
    path = out / f'atlas-{index//4:03}.png'
    assert not path.exists()
    canvas.save(path)
    atlases.append({'path': path.as_posix(), 'tiles': [meta for _, meta in group]})
record = {'sources': {p.as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sources},
          'atlases': atlases, 'note': 'Creation is not personal visual inspection; record actual reading separately.'}
(out / 'index.json').write_text(json.dumps(record, indent=2)+'\n', encoding='utf8')
print(json.dumps({'sources': len(sources), 'tiles': len(tiles), 'atlases': len(atlases)}))
