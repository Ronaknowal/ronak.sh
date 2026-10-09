"""Compare controlled article extraction with a real web-text extraction library.

Install: python -m pip install trafilatura
Run beside article.html and curation_records.py; no web request is made.
"""
import json
from pathlib import Path
import trafilatura
from curation_records import ArticleText


def extract_article(path):
    source = Path(path).read_text(encoding='utf-8')
    controlled = ArticleText()
    controlled.feed(source)
    extracted = trafilatura.extract(source, include_comments=False, include_tables=False)
    if not extracted:
        raise ValueError('Extractor returned no usable main text; route to an inspection queue')
    return {'controlled': controlled.text(), 'library': extracted,
            'library_keeps_opening': 'Alice was beginning' in extracted,
            'library_keeps_navigation': 'Home Subscribe' in extracted,
            'library_keeps_script': 'tracking()' in extracted}


if __name__ == '__main__':
    result = extract_article(Path(__file__).with_name('article.html'))
    print(json.dumps({**result, 'controlled': result['controlled'][:300],
                      'library': result['library'][:300]}, indent=2))
