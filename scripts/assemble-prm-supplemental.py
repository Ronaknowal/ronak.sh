"""Retain unscaled original screenshots side by side for the author reading pass."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm'
DEST = BASE / 'author-supplemental-paint'
DEST.mkdir(exist_ok=True)
groups = []
for figure in ['D22', 'D23']:
    groups.append(('tree-' + figure, [BASE / 'runtime-tree-closure/screenshots' / (profile + '-' + figure + '.png') for profile in ['desktop', 'phone', 'enlarged']]))
tree_changed = sorted((BASE / 'runtime-tree-closure/screenshots').glob('*.png'))
tree_changed = [file for file in tree_changed if not file.stem.endswith(('D22', 'D23'))]
desktop_changes = sorted((BASE / 'browser-final-interactions/screenshots').glob('D*.png'))
desktop_changes = [file for file in desktop_changes if not file.stem.startswith(('D22', 'D23'))]
practice = sorted((BASE / 'browser-delivery-network/screenshots').glob('phone-practice-*.png'), key=lambda file: int(file.stem.split('-')[-1]))
recovery = sorted((BASE / 'browser-recovery/screenshots').glob('*.png'))
openings = sorted((BASE / 'browser-final/screenshots').glob('*opening*.png'))
for name, files in [('changed', desktop_changes), ('tree-states', tree_changed), ('practice', practice), ('recovery', recovery), ('opening', openings)]:
    for i in range(0, len(files), 3):
        groups.append((name + '-' + str(i // 3 + 1), files[i:i+3]))
records = []
for name, files in groups:
    images = [Image.open(file).convert('RGB') for file in files]
    sheet = Image.new('RGB', (sum(image.width for image in images) + 20 * (len(images)-1), max(image.height for image in images) + 35), '#202637')
    draw = ImageDraw.Draw(sheet)
    x = 0
    for file, image in zip(files, images):
        draw.text((x+5, 10), file.stem, fill='white')
        sheet.paste(image, (x, 35))
        x += image.width + 20
    output = DEST / (name + '.png')
    sheet.save(output)
    records.append({'sheet': str(output.relative_to(ROOT)), 'images': [{'path': str(file.relative_to(ROOT)), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()} for file in files]})
(DEST / 'index.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf8')
print(json.dumps({'sheets': len(records), 'images': sum(len(row['images']) for row in records), 'pixel_scaling': False}))
