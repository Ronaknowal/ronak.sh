"""Save consulted primary documents and selected figure pages for author review."""
from pathlib import Path
import urllib.request
import pypdfium2 as pdfium

root = Path(__file__).resolve().parents[1]
out = root / 'scratch/curriculum-mixing-research'
out.mkdir(exist_ok=True)
sources = {
    'doremi': ('https://papers.neurips.cc/paper_files/paper/2023/file/dcba6be91359358c2355cd920da3fcbd-Paper-Conference.pdf', [1, 3]),
    'curriculum-survey': ('https://arxiv.org/pdf/2010.13166', [1, 4, 5]),
    'mixing-survey': ('https://aclanthology.org/2026.findings-eacl.15.pdf', [0, 1, 2]),
    'bengio': ('https://ronan.collobert.com/pub/matos/2009_curriculum_icml.pdf', [1, 2]),
}
for name, (url, pages) in sources.items():
    file = out / f'{name}.pdf'
    if not file.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=45) as response:
            file.write_bytes(response.read())
    document = pdfium.PdfDocument(file)
    text = []
    for page_number in range(len(document)):
        page = document[page_number]
        text.append(f'\nPAGE {page_number+1}\n' + page.get_textpage().get_text_range())
        if page_number in pages:
            page.render(scale=1.4).to_pil().save(out / f'{name}-{page_number+1}.png')
    (out / f'{name}.txt').write_text('\n'.join(text), encoding='utf8')
    print(name, len(document), flush=True)
