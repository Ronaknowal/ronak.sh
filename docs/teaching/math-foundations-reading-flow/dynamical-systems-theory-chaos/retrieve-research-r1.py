from pathlib import Path
import requests,hashlib,json,datetime,fitz
base=Path(__file__).resolve().parent/'research'
base.mkdir(exist_ok=True)
urls={
'menon-2020.pdf':'https://www.dam.brown.edu/people/menon/publications/ds-2020-1.pdf',
'romik-2012.pdf':'https://www.math.ucdavis.edu/~romik/teaching-pages/mat119b/lecturenotes-119B.pdf',
'lorenz-1963.pdf':'https://cdanfort.w3.uvm.edu/research/lorenz-1963.pdf',
'feigenbaum-1978.pdf':'https://sites.math.rutgers.edu/~zeilberg/Bio21/MF78.pdf',
'hairer-geometric-week2.pdf':'https://unige.ch/~hairer/poly_geoint/week2.pdf',
}
out=[]
for name,url in urls.items():
    p=base/name
    if p.exists(): data=p.read_bytes()
    else:
        r=requests.get(url,timeout=45);r.raise_for_status();data=r.content
        if not data.startswith(b'%PDF'):raise ValueError(name)
        p.write_bytes(data)
    doc=fitz.open(p)
    out.append({'file':name,'url':url,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'pages':len(doc),'reading':'Downloaded only; actual read sections to be recorded separately.'})
receipt=base/'retrieval-r1.json'
if receipt.exists():raise ValueError('Frozen receipt exists')
receipt.write_text(json.dumps({'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':out},indent=2)+'\n',encoding='utf8')
print(json.dumps(out,indent=2))
