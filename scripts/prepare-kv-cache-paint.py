"""Place actual screenshot tiles side by side, without resizing their pixels."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument('report', type=Path)
parser.add_argument('--exclude', default='')
parser.add_argument('--profile', default='')
args = parser.parse_args()
report = json.loads(args.report.read_text(encoding='utf8'))
target = args.report.parent / 'paint-atlases'
target.mkdir(exist_ok=True)
excluded = set(args.exclude.split(','))
tiles = []
for capture in report['captures']:
    if capture['name'].split('-')[1] in excluded:
        continue
    if args.profile and not capture['name'].startswith(args.profile + '-'):
        continue
    for index, file in enumerate(capture['tiles']):
        tiles.append({'name':capture['name'], 'tile':index+1, 'path':file})
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 16)
atlases = []
for begin in range(0, len(tiles), 2):
    group = tiles[begin:begin+2]
    images = [Image.open(row['path']).convert('RGB') for row in group]
    width = sum(image.width for image in images) + 16 * (len(images)-1)
    height = max(image.height for image in images) + 38
    canvas = Image.new('RGB', (width,height), '#22242b')
    draw = ImageDraw.Draw(canvas)
    x = 0
    for row,image in zip(group,images):
        draw.text((x+4,8), f"{row['name']} / tile {row['tile']}", font=font, fill='white')
        canvas.paste(image, (x,38))
        x += image.width + 16
    file = target / f'atlas-{begin//2+1:03}.png'
    canvas.save(file)
    atlases.append({'path':str(file.resolve()),'tiles':group,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
out = {'scope':'Actual rendered pixels, no resizing. Labels identify base capture and continuation.',
       'report':str(args.report.resolve()),'excluded_figures':sorted(excluded),'profile':args.profile,'atlases':atlases}
(target/'index.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8')
print(json.dumps({'atlases':len(atlases),'tiles':len(tiles),'index':str((target/'index.json').resolve())}))
