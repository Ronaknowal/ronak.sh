"""Lossless offsets, strict span alignment, and a saved spaCy rule pipeline.
Run: python text_pipeline.py
Dependencies: spacy; no trained weights or corpus download is required.
"""
from dataclasses import dataclass
from tempfile import TemporaryDirectory


@dataclass(frozen=True)
class Token:
    text: str
    start: int
    end: int


def tokenize(text):
    """Unicode code-point offsets. Group alphanumerics; separate punctuation.

    This transparent teaching policy is not a language-specific word segmenter.
    Original text remains authoritative, including skipped whitespace.
    """
    tokens, cursor = [], 0
    while cursor < len(text):
        if text[cursor].isspace():
            cursor += 1
            continue
        start = cursor
        cursor += 1
        if text[start].isalnum():
            while cursor < len(text) and text[cursor].isalnum():
                cursor += 1
        tokens.append(Token(text[start:cursor], start, cursor))
    return tokens


def bio_tags(tokens, spans):
    """Convert sorted non-overlapping character spans to BIO tags in one scan."""
    tags = ["O"] * len(tokens)
    cursor, previous_end = 0, 0
    for start, end, label in sorted(spans):
        if not 0 <= start < end or start < previous_end:
            raise ValueError("Spans must be nonempty and non-overlapping")
        while cursor < len(tokens) and tokens[cursor].end <= start:
            cursor += 1
        if cursor == len(tokens) or tokens[cursor].start != start:
            raise ValueError("Span start is not a token boundary")
        first = cursor
        while cursor < len(tokens) and tokens[cursor].end <= end:
            tags[cursor] = ("B-" if cursor == first else "I-") + label
            cursor += 1
        if cursor == first or tokens[cursor - 1].end != end:
            raise ValueError("Span end is not a token boundary")
        previous_end = end
    return tags


def exact_span_scores(gold, predicted):
    """One document; include document IDs in tuples when scoring many documents."""
    gold, predicted = set(gold), set(predicted)
    true_positive = len(gold & predicted)
    precision = true_positive / len(predicted) if predicted else 0.0
    recall = true_positive / len(gold) if gold else 0.0
    f1 = 2 * true_positive / (len(gold) + len(predicted)) if gold or predicted else 0.0
    return precision, recall, f1


def main():
    import spacy
    text = "Asha moved to New York."
    gold = [(0, 4, "PERSON"), (14, 22, "PLACE")]
    tokens = tokenize(text)
    print("scratch:", [(t.text, t.start, t.end) for t in tokens])
    print("BIO:", bio_tags(tokens, gold))
    nlp = spacy.blank("en")
    nlp.add_pipe("sentencizer")
    ruler = nlp.add_pipe("entity_ruler", config={"validate": True})
    ruler.add_patterns([{"label": "PERSON", "pattern": "Asha"},
                        {"label": "PLACE", "pattern": "New York"}])
    doc = nlp(text)
    predicted = [(e.start_char, e.end_char, e.label_) for e in doc.ents]
    assert doc.text == text
    assert predicted == gold
    assert doc.char_span(15, 22, alignment_mode="strict") is None
    print("spaCy:", [(e.text, e.label_) for e in doc.ents])
    print("exact span P/R/F1:", exact_span_scores(gold, predicted))
    with TemporaryDirectory() as directory:
        nlp.to_disk(directory)
        restored = spacy.load(directory)
        assert [(e.start_char, e.end_char, e.label_) for e in restored(text).ents] == gold
    for item in nlp.pipe([text, "Asha moved to York."], batch_size=2):
        print("batch:", item.text, [(e.text, e.label_) for e in item.ents])


if __name__ == "__main__":
    main()
