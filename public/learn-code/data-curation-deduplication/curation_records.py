"""Keep source records while deriving comparison keys. Standard library only."""
from collections import defaultdict
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import unicodedata


class ArticleText(HTMLParser):
    """Extract a controlled <article> fixture, not arbitrary web boilerplate."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.skip = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'article':
            self.depth += 1
        if self.depth and tag in {'script', 'style'}:
            self.skip += 1
        if self.depth and tag in {'p', 'br', 'h1', 'h2', 'li'}:
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if self.depth and tag in {'script', 'style'}:
            self.skip = max(0, self.skip - 1)
        if self.depth and tag in {'p', 'h1', 'h2', 'li'}:
            self.parts.append('\n')
        if tag == 'article':
            self.depth = max(0, self.depth - 1)

    def handle_data(self, data):
        if self.depth and not self.skip:
            self.parts.append(data)

    def text(self):
        return '\n'.join(' '.join(line.split()) for line in ''.join(self.parts).splitlines() if line.strip())


def comparison_key(text, *, fold_case=False):
    """NFC and whitespace equivalence are deliberate corpus policy choices."""
    normalized = ' '.join(unicodedata.normalize('NFC', text).split())
    return normalized.casefold() if fold_case else normalized


def exact_groups(records, *, fold_case=False):
    """Hash to find candidates; compare full keys to resolve digest collisions."""
    buckets = defaultdict(list)
    groups = []
    for record in records:
        key = comparison_key(record['text'], fold_case=fold_case)
        digest = sha256(key.encode('utf-8')).hexdigest()
        group = next((g for g in buckets[digest] if g['key'] == key), None)
        if group is None:
            group = {'key': key, 'digest': digest, 'members': []}
            buckets[digest].append(group)
            groups.append(group)
        group['members'].append(record['id'])
    return groups


def representative(ids, records):
    """Prefer declared quality, then stable ID; quality is supplied metadata."""
    by_id = {record['id']: record for record in records}
    return min(ids, key=lambda i: (-by_id[i].get('quality', 0), i))


def load_records(filename=None):
    path = Path(filename) if filename else Path(__file__).with_name('corpus.jsonl')
    records = [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]
    if len({r['id'] for r in records}) != len(records):
        raise ValueError('Record IDs must be unique')
    return records


if __name__ == '__main__':
    parser = ArticleText()
    parser.feed(Path(__file__).with_name('article.html').read_text(encoding='utf-8'))
    records = load_records()
    print(json.dumps({'extracted_text': parser.text(), 'records': len(records),
                      'exact_groups': [g['members'] for g in exact_groups(records)],
                      'case_sensitive': comparison_key('US') != comparison_key('us'),
                      'case_folded': comparison_key('US', fold_case=True) == comparison_key('us', fold_case=True)}, indent=2))
