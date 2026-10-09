"""Arrange retained browser pixels for author review; no runtime/science edits.

Tall captures are partitioned so no vertical content is omitted. A contact sheet
is a reading aid, not new browser evidence or proof of native font legibility.
The input digest and each pixel partition are retained in index.json.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json
import math

root = Path(__file__).resolve().parents[1]
topic = root / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
destination = topic / "runtime-paint-reading"
destination.mkdir(exist_ok=True)
sets = [
    ("desktop", "browser-presentation-final", "desktop-D*.png"),
    ("enlarged", "browser-presentation-final", "enlarged-*.png"),
    ("states", "browser-states-final", "*.png"),
    ("tables", "runtime-table-closure", "*.png"),
    ("delivery", "browser-delivery-final", "*.png"),
    ("keyboard", "browser-keyboard-final", "*.png"),
]
index = {"scope": "Retained pixel reading aids; tall images completely partitioned. Desktop widths over600 are reduced; native font legibility is reviewed separately.", "sheets": []}
for group, directory, pattern in sets:
    tiles = []
    for file in sorted((topic / directory / "screenshots").glob(pattern)):
        source = Image.open(file).convert("RGB")
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        # Preserve all pixels vertically rather than shrinking a very tall pane.
        for part, y in enumerate(range(0, source.height, 900)):
            tile = source.crop((0, y, source.width, min(y + 900, source.height)))
            if tile.width > 600:
                tile = tile.resize((600, round(tile.height * 600 / tile.width)))
            label = f"{group}/{file.stem} [{y}:{min(y+900,source.height)}]"
            tiles.append((tile, label, {"source": str(file.relative_to(root)).replace("\\", "/"), "sha256": digest, "y": y, "end": min(y + 900, source.height), "source_width": source.width}))
    for batch in range(math.ceil(len(tiles) / 6)):
        selected = tiles[batch * 6:(batch + 1) * 6]
        canvas = Image.new("RGB", (1800, 1870), "#171717")
        draw = ImageDraw.Draw(canvas)
        for i, (tile, label, _) in enumerate(selected):
            x, y = (i % 3) * 600, (i // 3) * 935
            draw.text((x + 4, y + 4), label, fill="#ffffff")
            canvas.paste(tile, (x, y + 30))
        output = destination / f"{group}-{batch + 1:02}.png"
        canvas.save(output)
        index["sheets"].append({"path": str(output.relative_to(root)).replace("\\", "/"), "panels": [p[2] for p in selected]})
(destination / "index.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
print(json.dumps({group: sum(group in Path(s["path"]).name for s in index["sheets"]) for group, _, _ in sets}))
