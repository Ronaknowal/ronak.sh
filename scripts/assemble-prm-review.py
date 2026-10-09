"""Juxtapose original reader screenshots for author inspection; no image pixels scaled."""
from pathlib import Path
import json
import hashlib
import sys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
source = DOCS / (sys.argv[1] if len(sys.argv) > 1 else "browser-layout") / "screenshots"
destination = DOCS / (sys.argv[2] if len(sys.argv) > 2 else "author-contact-sheets")
destination.mkdir(exist_ok=True)
records = []
for index in range(1, 30):
    names = [f"{profile}-D{index:02}.png" for profile in ("desktop", "phone", "enlarged")]
    images = [Image.open(source / name).convert("RGB") for name in names]
    width = sum(image.width for image in images) + 20 * (len(images) - 1)
    height = max(image.height for image in images) + 35
    sheet = Image.new("RGB", (width, height), "#202637")
    draw = ImageDraw.Draw(sheet)
    x = 0
    for name, image in zip(names, images):
        draw.text((x + 5, 10), name, fill="white")
        sheet.paste(image, (x, 35))
        x += image.width + 20
    file = destination / f"D{index:02}.png"
    sheet.save(file)
    records.append({"figure": f"D{index:02}", "sheet": str(file.relative_to(ROOT)), "source": [
        {"path": str((source / name).relative_to(ROOT)), "sha256": hashlib.sha256((source / name).read_bytes()).hexdigest()} for name in names]})
(destination / "index.json").write_text(json.dumps(records, indent=2) + "\n", encoding="utf8")
print(json.dumps({"figures": len(records), "actual_source_images": len(records) * 3, "scaled_pixels": False}))
