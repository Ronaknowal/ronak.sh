"""Offline evidence retrieval. Python 3.12+. Authored summaries of linked Python docs."""
from collections import Counter, defaultdict
import heapq
import json
import math
import re

DOCUMENTS = [
    {'id': 'with', 'text': 'A with statement closes a file when its block finishes even if an exception occurs. Open text files with an explicit encoding.', 'url': 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files'},
    {'id': 'close', 'text': 'Calling close releases a file resource. Reading or writing after the file is closed fails. Use a context manager to manage its lifetime.', 'url': 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files'},
    {'id': 'finally', 'text': 'A finally clause runs during normal exit and exception propagation. It is useful for cleanup. Returning inside finally can override an earlier return.', 'url': 'https://docs.python.org/3/tutorial/errors.html#defining-clean-up-actions'},
    {'id': 'dictionary', 'text': 'A dictionary maps unique keys to values. Assigning a value for an existing key replaces the old value. Membership checks whether a key exists.', 'url': 'https://docs.python.org/3/tutorial/datastructures.html#dictionaries'},
]


def tokens(text):
    return re.findall(r'\b\w+\b', text.lower())


class EvidenceIndex:
    """Positive-IDF BM25: Haystack BM25L with delta=0, k1=1.5, b=.75."""
    def __init__(self, documents):
        self.docs = {doc['id']: dict(doc) for doc in documents}
        if not self.docs or len(self.docs) != len(documents):
            raise ValueError('Use a nonempty corpus with unique IDs')
        self.postings = defaultdict(dict)
        self.lengths = {}
        for key, doc in self.docs.items():
            counts = Counter(tokens(doc['text']))
            self.lengths[key] = sum(counts.values())
            for term, frequency in counts.items():
                self.postings[term][key] = frequency
        self.average = sum(self.lengths.values()) / len(self.docs)
        if not self.average:
            raise ValueError('The corpus must contain searchable words')

    def search(self, query, top_k=3, allowed=None):
        if type(top_k) is not int or top_k < 1:
            raise ValueError('top_k must be a positive integer')
        allowed = self.docs.keys() if allowed is None else set(allowed)
        scores = defaultdict(float)
        for term in sorted(set(tokens(query))):
            posting = self.postings.get(term, {})
            if not posting:
                continue
            idf = math.log((len(self.docs) + 1) / (len(posting) + .5))
            for key, frequency in posting.items():
                if key not in allowed:
                    continue
                norm = 1 - .75 + .75 * self.lengths[key] / self.average
                scores[key] += idf * frequency * 2.5 / (frequency + 1.5 * norm)
        best = heapq.nsmallest(top_k, scores, key=lambda key: (-scores[key], key))
        return [{**self.docs[key], 'score': scores[key]} for key in best]


def pack_evidence(ranked, word_budget):
    """Whole chunks, greedy rank order. Units are lexical words, NOT model tokens."""
    if type(word_budget) is not int or word_budget < 0:
        raise ValueError('word_budget must be a nonnegative integer')
    admitted, skipped, used = [], [], 0
    for doc in ranked:
        cost = len(tokens(doc['text']))
        if used + cost <= word_budget:
            admitted.append(doc)
            used += cost
        else:
            skipped.append(doc['id'])
    return {'documents': admitted, 'skipped': skipped, 'used_words': used}


def evidence_response(packet):
    # An honest extractive viewer. No synthetic text is passed off as an LLM answer.
    return {'status': 'evidence' if packet['documents'] else 'no_evidence',
            'excerpts': [{'id': d['id'], 'text': d['text'], 'url': d['url']}
                         for d in packet['documents']]}


def main():
    index = EvidenceIndex(DOCUMENTS)
    ranked = index.search('file exception', top_k=3)
    result = evidence_response(pack_evidence(ranked, 30))
    assert result['excerpts'][0]['id'] == 'with'
    assert index.search('quantum banana') == []
    assert index.search('file', allowed={'dictionary'}) == []
    assert pack_evidence(ranked, 0)['documents'] == []
    print(json.dumps({'ranked': [(d['id'], d['score']) for d in ranked], 'result': result}, indent=2))


if __name__ == '__main__':
    main()
