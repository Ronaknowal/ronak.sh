"""Join actual horizontal pan captures without rescaling their pixels."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

folder = Path('docs/teaching/llm-architecture-training/inference-engines-serving') / (sys.argv[1] if len(sys.argv)>1 else 'runtime-native-paint')
report = json.loads((folder / 'report.json').read_text())
groups = {}
for item in report['images']:
    if 'local' in item:
        groups.setdefault((item['profile'], item['id'], item['local'], item.get('state')), []).append(item)
output = folder / 'atlases'
output.mkdir(exist_ok=True)
index = []
for key, items in groups.items():
    items.sort(key=lambda item: item['offset'])
    opened = [(item, Image.open(item['path']).convert('RGB')) for item in items]
    width = items[0]['total']
    height = max(image.height for _, image in opened)
    canvas = Image.new('RGB', (width, height), '#080808')
    for item, image in opened:
        canvas.paste(image.crop((0, 0, min(image.width, width-item['offset']), image.height)), (item['offset'], 0))
    suffix = f'-{key[3]}' if key[3] else ''
    destination = output / f'{key[0]}-{key[1]}-local{key[2]}{suffix}.png'
    canvas.save(destination)
    index.append({'profile': key[0], 'id': key[1], 'local': key[2], 'state': key[3], 'svg': items[0].get('svg', True), 'path': str(destination).replace('\\', '/'), 'width': width, 'height': height, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'sources': items})
(output / 'index.json').write_text(json.dumps(index, indent=2)+'\n')
print(json.dumps({'atlases': len(index), 'rule': 'Actual pan pixels placed at observed scroll offsets; no scaling or synthetic reconstruction.'}))
