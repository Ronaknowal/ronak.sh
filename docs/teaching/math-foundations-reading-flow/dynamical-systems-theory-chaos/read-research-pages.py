from pathlib import Path
import sys,pymupdf
sys.stdout.reconfigure(encoding='utf8')
base=Path(__file__).resolve().parent/'research'
doc=pymupdf.open(base/sys.argv[1])
for label in sys.argv[2:]:
    limits=label.split('-');start=int(limits[0]);end=int(limits[-1])
    for page in range(start,end+1):
        print('\nPDF PAGE '+str(page)+'\n'+doc[page-1].get_text())
