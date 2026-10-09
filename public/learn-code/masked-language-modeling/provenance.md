# Offline real-text provenance

- Work: Lewis Carroll, *Alice's Adventures in Wonderland* (1865).
- Source: Project Gutenberg eBook #11, Millennium Fulcrum Edition 3.0.
- Catalogue: https://www.gutenberg.org/ebooks/11
- Retrieved 7 October 2026 from https://www.gutenberg.org/cache/epub/11/pg11.txt
- The source identifies its latest update as 26 June 2025 and credits Arthur
  DiBianca and David Widger. The underlying work is public domain in the USA;
  local copyright rules may differ. Gutenberg's terms are at
  https://www.gutenberg.org/policy/license.html .
- Excerpt: narrative from “Alice was beginning” through the end of Chapter III,
  stopping before Chapter IV. The original literary wording and punctuation are
  preserved. Only line endings are normalized to LF and outer whitespace trimmed.
- SHA-256 of `alice_excerpt.txt`:
  `d4d1e63f00060bfc541d917618dd62dbaa7b8cfda7cb8ebb4d6ca4d2eb48d42f`.
- Dataset purpose here: a real sequence whose masked-token reconstruction can be
  measured, in contrast to the tiny constructed examples used for arithmetic.
  It was written as literature, not collected as an NLP benchmark.

The programs extract lowercase `[a-z]+` sequences, including chapter headings
within the excerpt, giving 6,118 word tokens. The first 80% (4,894 tokens) supplies
training; the final 1,224 supplies held-out text. Vocabulary is learned only from
the training portion. Each part is independently chunked into at most 24 words
with CLS/SEP and padding. No chunk crosses the split. This single work shares
style and characters across the split, so held-out performance is a limited
within-work diagnostic. It is not evidence of general English competence.

All displayed study numbers come from the supplied programs, bound to these bytes
and the recorded seed/settings. The loss uses fixed held-out corruption and counts
only eligible known-word targets. Unseen words are reported, not silently treated
as successfully reconstructed text.
