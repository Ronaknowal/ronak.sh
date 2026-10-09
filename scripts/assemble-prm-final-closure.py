"""Arrange retained closure and narrow changed-state paints without rescaling."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm'
DEST = BASE / 'author-final-closure-paint'
DEST.mkdir(exist_ok=True)
groups = []
for state in ['default', 'invalid', 'neutral', 'progress', 'near-invalid']:
    groups.append(('simplex-' + state, [BASE / 'runtime-simplex-closure/screenshots' / (profile + '-' + state + '.png') for profile in ['desktop', 'phone', 'enlarged']]))
files = sorted((BASE / 'browser-final-interactions/screenshots').glob('*.png'))
narrow = [file for file in files if file.stem.startswith(('phone-', 'enlarged-', 'narrow-')) and '-end' not in file.stem and not any(word in file.stem for word in ['D22', 'D23'])]
for i in range(0, len(narrow), 3):
    groups.append(('narrow-' + str(i // 3 + 1), narrow[i:i + 3]))
records = []
for name, files in groups:
    images = [Image.open(file).convert('RGB') for file in files]
    sheet = Image.new('RGB', (sum(image.width for image in images) + 20 * (len(images) - 1), max(image.height for image in images) + 35), '#202637')
    draw = ImageDraw.Draw(sheet)
    x = 0
    for file, image in zip(files, images):
        draw.text((x + 5, 10), file.stem, fill='white')
        sheet.paste(image, (x, 35))
        x += image.width + 20
    output = DEST / (name + '.png')
    sheet.save(output)
    records.append({'sheet': str(output.relative_to(ROOT)), 'images': [{'path': str(file.relative_to(ROOT)), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()} for file in files]})
(DEST / 'index.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf8')
print(json.dumps({'sheets': len(records), 'images': sum(len(row['images']) for row in records), 'pixel_scaling': False}))
