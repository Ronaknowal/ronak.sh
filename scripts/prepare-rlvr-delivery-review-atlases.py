"""Copy current viewport screenshot pixels into compact review atlases."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
topic = root / 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
source = topic / 'browser-delivery-accepted/screenshots'
out = topic / 'runtime-independent-preparation/paint-delivery-final'
out.mkdir(exist_ok=True)
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
guards, atlases = [], []
for profile, count in [('phone', 4), ('code', 2), ('observation', 2)]:
    tiles = []
    for sidecar in sorted(source.glob(profile + '-*.png.tiles.json')):
        guards.append({'path': sidecar.relative_to(root).as_posix(), 'sha256': digest(sidecar)})
        for tile in json.loads(sidecar.read_text(encoding='utf-8'))['tiles']:
            path = root / tile['path']
            assert digest(path) == tile['sha256']
            guards.append({'path': tile['path'], 'sha256': tile['sha256']})
            tiles.append(path)
    for start in range(0, len(tiles), count):
        group = tiles[start:start + count]
        images = [Image.open(path).convert('RGB') for path in group]
        width = sum(im.width for im in images) + 12 * (len(images) - 1)
        height = max(im.height for im in images) + 26
        assert max(width, height) <= 2048
        atlas = Image.new('RGB', (width, height), '#292929')
        drawing, x, records = ImageDraw.Draw(atlas), 0, []
        for path, im in zip(group, images):
            drawing.text((x + 3, 4), path.name, fill='white')
            atlas.paste(im, (x, 26))
            records.append({'source': path.relative_to(root).as_posix(), 'sha256': digest(path), 'rectangle': [x, 26, x + im.width, 26 + im.height]})
            x += im.width + 12
        path = out / f'{profile}-{start // count + 1:02}.png'
        assert not path.exists()
        atlas.save(path)
        atlases.append({'path': path.relative_to(root).as_posix(), 'sha256': digest(path), 'tiles': records})
(out / 'atlas-inputs.json').write_text(json.dumps({'scope': 'pixel-preserving, no scaling', 'guards': guards, 'atlases': atlases}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'atlases': len(atlases), 'tiles': sum(len(a['tiles']) for a in atlases), 'files': [Path(a['path']).name for a in atlases]}))
