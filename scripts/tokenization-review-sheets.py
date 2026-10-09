"""Readable, lossless-crop contact sheets for expert paint review (not approval)."""
from pathlib import Path
from PIL import Image, ImageDraw
import json

root = Path('docs/teaching/tokenization/reading-flow-evidence')
folder = root / 'screenshots'
output = root / 'review-sheets'
output.mkdir(exist_ok=True)
records = []
for state in ('phone', 'desktop', 'enlarged'):
    tiles = []
    for file in sorted(folder.glob(f'*-{state}.png')):
        picture = Image.open(file).convert('RGB')
        scale = min(1, 390 / picture.width)
        picture = picture.resize((round(picture.width * scale), round(picture.height * scale)))
        for start in range(0, picture.height, 740):
            crop = picture.crop((0, start, picture.width, min(start + 740, picture.height)))
            tile = Image.new('RGB', (410, 780), '#111111')
            label = file.name.split('-')
            topic = 'subword' if file.name.startswith('byte-pair') else 'bytes' if file.name.startswith('byte-level') else 'vocabulary'
            ImageDraw.Draw(tile).text((10, 8), f'{topic} {label[-2]} / {state} / y={start}', fill='white')
            tile.paste(crop, (10, 32))
            tiles.append((tile, str(file), start))
    for offset in range(0, len(tiles), 4):
        sheet = Image.new('RGB', (1640, 780), '#111111')
        group = tiles[offset:offset + 4]
        for index, (tile, _, _) in enumerate(group):
            sheet.paste(tile, (index * 410, 0))
        destination = output / f'{state}-{offset // 4:02}.png'
        sheet.save(destination)
        records.append({'sheet': str(destination), 'tiles': [{'file': file, 'y': y} for _, file, y in group]})
(output / 'index.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf8')
print(json.dumps({'sheets': len(records), 'sourceImages': len(list(folder.glob('*.png')))}))
