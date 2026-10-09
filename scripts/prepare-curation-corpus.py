"""Build the openly distributed lesson corpus from preserved real-text paragraphs."""
from pathlib import Path
import hashlib
import html
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram'
OUT = ROOT / 'public/learn-code/data-curation-deduplication'
records = []
for split in ('train', 'heldout'):
    paragraphs = (SOURCE / f'alice-{split}.txt').read_text(encoding='utf-8').splitlines()
    for index, paragraph in enumerate(paragraphs):
        if not paragraph.strip():
            continue
        family = f'{split}-{index:02d}'
        variants = [('original', paragraph, 3), ('exact', paragraph, 2),
                    ('spacing', paragraph.replace(' ', '  '), 1)]
        words = paragraph.split()
        if len(words) >= 20:
            variants.extend([('local-edit', ' '.join(words[:10] + ['curious'] + words[11:]), 2),
                             ('excerpt', ' '.join(words[:max(10, len(words)//3)]), 1)])
        for variant, text, quality in variants:
            records.append({'id': f'{family}-{variant}', 'text': text, 'family': family,
                            'variant': variant, 'split': split, 'quality': quality,
                            'source': 'https://www.gutenberg.org/ebooks/11'})
records.extend([{'id': 'meaning-positive', 'text': 'The medicine is safe for children when used as directed.',
                 'family': 'meaning-positive', 'variant': 'constructed', 'split': 'audit', 'quality': 1},
                {'id': 'meaning-negative', 'text': 'The medicine is not safe for children when used as directed.',
                 'family': 'meaning-negative', 'variant': 'constructed', 'split': 'audit', 'quality': 1},
                {'id': 'short', 'text': 'Rabbit!', 'family': 'short', 'variant': 'constructed', 'split': 'audit', 'quality': 1}])
OUT.mkdir(parents=True, exist_ok=True)
corpus = ''.join(json.dumps(record, ensure_ascii=False) + '\n' for record in records)
(OUT / 'corpus.jsonl').write_text(corpus, encoding='utf-8', newline='\n')
article = '<!doctype html><html><head><title>Alice excerpt</title></head><body><nav>Home Subscribe</nav><article><h1>Alice excerpt</h1>'
article += ''.join('<p>' + html.escape(r['text']) + '</p>' for r in records if r['variant'] == 'original')
article += '<script>tracking()</script></article><footer>Cookie settings</footer></body></html>\n'
(OUT / 'article.html').write_text(article, encoding='utf-8', newline='\n')
provenance = {'source': json.loads((SOURCE / 'alice-provenance.json').read_text(encoding='utf-8')),
              'purpose': 'Controlled deduplication audit on real prose; variants and quality ranks are constructed, not human relevance labels.',
              'record_count': len(records), 'split_policy': 'All descendants keep the original paragraph family and split.',
              'transformations': 'Exact copy, doubled spaces, replace word 11 with curious, first third excerpt. Two constructed negation sentences and one short record.',
              'sha256': {name: hashlib.sha256((OUT / name).read_bytes()).hexdigest() for name in ('corpus.jsonl', 'article.html')}}
(OUT / 'corpus-provenance.json').write_text(json.dumps(provenance, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({'records': len(records), 'sha256': provenance['sha256']}))
