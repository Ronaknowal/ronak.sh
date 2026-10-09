# Subword tokenization: research, design and delivery

Revision 1, full implementation, 28 September 2026. Owner: subword-tokenization author.
Stable ID/title and source mapping `src/learn/data/topics/tokenization.jsx` retained.
Content source is the complete JSX manuscript plus the three canonical programs
under `public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/`.
Current action: close independent review and final responsive browser integration.
Root owns ledger, registration, shared integration and browser closure.

## Scope and continuity

The reader constructs and modifies BPE training/encoding, WordPiece vocabulary
construction (explicit reconstruction) and inference, and exact Unigram inference,
EM, bounded pruning and posterior sampling. They use maintained Tokenizers and
SentencePiece APIs with controlled same-artifact comparisons and a real held-out
text experiment. Python containers are presumed; tries, heaps and dynamic
programming are explained locally at their useful abstraction boundary.

Keep the established token chips, visible boundary rows and merge-process
investigation that the user liked. Replace static hand-authored traces with the
same deterministic computation as editable training. Existing algorithm sections
were substantial but contained unsupported timing and multilingual rankings,
made-up token outputs, a hard-assignment routine described as exact EM, a wrong
WordPiece identity claim, incorrect whitespace-round-trip claims and erroneous
token/attention-cost percentages. Remove these assertions, retain useful depth,
teach each replacement with a counterexample and explain the actual convention.

Title unchanged: it accurately names the mechanisms and toolkit, now distinguished
explicitly. Next owners are Byte-Level Tokenization & Token-Free Models (byte
coverage, Unicode/stream decoding, direct byte models) and Vocabulary Design &
Multilingual Tokenization (sampling/allocation/domain evaluation). No new topic is needed.
They reuse `subword_tokenizers.py` rather than recopy the BPE core.

Canonical coverage check: Jurafsky/Martin Words and Tokens chapter, Sennrich section
3.2, Kudo sections 3.2–3.3, SentencePiece paper/options and BERT WordpieceTokenizer
source were read. Core covers open-vocabulary conditionality, word frequencies,
merge ranks, tie handling, overlap, pipeline normalization and boundaries, longest
match versus full paths, marginal versus best likelihood, EM, pruning and sampling.
Byte alphabets, Unicode/graphemes and token-free architectures belong next; corpus
balancing and vocabulary budget selection belong third. No unsupported universal
model-family or language ranking retained.

## Concept-by-concept teaching map

| Hurdle | Buildup and example | Representation and independent evidence |
| --- | --- | --- |
| Unseen words versus unseen symbols | lowest from low/newest, dictionary versus six characters versus two pieces | Static same-spelling token strips; exercise overlap and later unseen-character error |
| Pipeline versus model | Normalization, split regions, pieces, IDs, embeddings | Static concrete pipeline with whitespace transformation and explicit illustrative IDs |
| Weighted adjacent pairs | Four classic word types with counts 5/2/6/3; first three suffix merges | Editable corpus, pair ranking, token rows and total-symbol change share one state |
| Overlap | aaaa twice has 6 pair occurrences and 4 replacements | Changed fixture and independent exercise; no silent count=length-savings assumption |
| Training versus inference | Ranks persist; lowest is encoded without refitting | Lab query changes independently; exact scratch/native merge-state bridge |
| Tie convention | Sixth merge e+w under code-point lexicographic order | Shared explicit Python/JS ordering, including accented/astral counterexample |
| Efficient mechanism | Update affected words, lazy priority entries, linked neighbors | Explained canonical program; brute recount/list encoder as separate verifier oracle |
| WordPiece greedy commitment | abc selects ab then ##c; deleting ##c fails despite a|##bc | Editable word/vocabulary; visible attempted choices and full-word UNK |
| WordPiece training uncertainty | Count-ratio objective versus actual inference contract | Labeled proxy trainer; native inference matches saved vocabulary, no claimed trainer equivalence |
| Best versus marginal paths | p(a)=p(b)=.2,p(ab)=.6 gives .6+.04=.64 | Position lattice + complete path probability bars + threshold and no-ab case |
| Exact EM | Fractional path credit .9375/.0625 versus hard winner | Same live readouts, worked expected counts and update; forward/backward derivation |
| Stable computation | Many products become sums/log-sum-exp | Complete log-space expected-count code; exhaustive finite-path oracle |
| Vocabulary selection | Larger seed, protected characters, lost-path-mass pruning, refit | Bounded reference defines its scoring objective and cost; native practical trainer separate |
| Sampling | Conditional edge p(t)B(j)/B(i), seeded choices | Runnable sample method, expectation checked independently; regularization distinguished from required encoding |
| Library and real text | Exact artifact imported first, then train/evaluate local Alice text | Native execution, persistence, actual tokens/unknowns; no timing or quality leaderboard |
| Costs and decisions | Vd, tied versus untied, T versus T², corrected 420-character arithmetic | Worked algebra with explicit accounting category; vocabulary budget practice |

## Complete runtime specifications

### Static figures

1. **SubwordChoiceFigure**, section 1 after lowest story. Three vertically aligned
rows: word dictionary [UNK], six character chips, low|est chips. Plainly labeled
constructed dictionary/illustrative pieces. Meaning: same spelling, distinct
representation contracts. Reflow chip groups, maintain literal token content,
neutral/amber only, no arbitrary pretrained integer outputs.
2. **TokenizerPipelineFigure**, section 1. Concrete `LOW  low` → chosen lowercase
normalization `low  low` → two word regions `low`, `low` → pieces `low`,`low` →
illustrative IDs [7,7] → row7 twice. Show full input with preserved spaces in
monospace; exact whitespace loss happens at split. Caption says IDs illustrative,
the model owns a matching row. Reflow as ordered HTML stages with arrows and
separate explanatory text; no fixed SVG text boxes.

### BpeMergeLab

Current default is the four-word corpus (5/2/6/3), one completed merge visible.
Editable textarea accepts up to 600 code points, up to 24 word types and 32 code
points per word; explain limits. Reject literal reserved marker; last valid state
stays visible with an error. Use JS code-point strings, not UTF16 code units.
Process: training snapshots for at most 20 merges, selected step initially 1,
back/next/reset and integer slider/number select that state. Corpus edits take
effect immediately and preserve selected step capped to available trace. No
prediction question. Display weighted word rows, adjacent next-pair counts,
ordered merge history, vocabulary size, initial/current symbol totals, actual
replacement savings and query encoding under current learned prefix. Query is
independently editable, default lowest; report unseen character instead of fake
unknown IDs. Highlight both symbols of the next selected pair without shifting
positions; changed merged piece accent uses text as well as color. A compact
weighted pair table explains selection; step trace and free training are unified
to avoid two competing states. Fixtures classic, aaaa aaaa, singleton/no pair
after full completion, empty corpus, Unicode ties, unknown query. Result and cause
visible before any control. Chips wrap, tables locally scroll, no animated loop.

### WordPieceLab

Default editable word abc and editable vocabulary a,ab,##b,##bc,##c. Model commits
longest prefix, uses continuation convention after first token and replaces full
word with UNK if stuck. Toggle ##c via a meaningful preset control if convenient,
but arbitrary word/vocabulary editing provides the investigation. Show current
word as code-point positions, each attempted region and candidates/selected piece,
final chips, and comparison between a valid-path search and greedy commitment.
Bound the word to 32 scalars, vocabulary to 24 entries, and each piece to 16 scalars.
Empty input is legitimately empty; invalid vocabulary retains the previous valid
state. Default: two pieces; delete ##c: UNK despite a|##bc; unseen z: UNK;
single a: one piece. Reset restores all fields. Tables and wrapping token rows
work on phones; no fixed-width text labels are placed in an SVG.

### UnigramLatticeLab

Fixed spelling ab; adjustable p(ab) .01–.99 (initial .6), remaining mass split
equally between a and b; removing the whole piece causes p(a)=p(b)=.5, only split
path. Use integer percentage control to make both sides of threshold inspectable.
Lattice positions 0, 1, 2 with an a/b path and separate curved ab edge. Short labels only;
probabilities/results in HTML adjacent. Show two path products, normalized
posteriors, best path, expected counts and one EM update. Bars encode posterior
probability on a shared 0–1 scale, with exact values in text. Initial mass .64 and
whole-piece posterior .9375; p(ab)=.1 makes the split best; removing ab leaves only
the split, expected counts a=b=1 and no ab entry. Controls update immediately;
reset restores p=.6 and includes ab. Tie mathematics is explained in prose; the
control does not claim .17 is an exact tie. Browser review checks line/text
clearance, zoom and desktop/320px. This is a segmentation and EM investigation.

## Implementation ownership and program contract

| Outcome | Scratch owner | Maintained route and comparison | Control/practice |
| --- | --- | --- | --- |
| BPE train/encode/decode | subword_tokenizers.py indexed pair owners, lazy heap counts, linked-node rank heap | Exact trained no-marker vocabulary/merges imported into tokenizers.models.BPE | Corpus weights, merge budget, unknown and overlap tests; independent oracle exercise |
| WordPiece construction/inference | train_wordpiece_proxy; WordPiece two tries | models.WordPiece same dictionary, whole-word unknown and length limit | Remove continuation, diagnose missing alternate path |
| Unigram forward/backward, Viterbi, EM, pruning, sampling | unigram_model.py log-space expected counts and trie edges | models.Unigram same logp for inference; SentencePiece actual training separately | Changed p=.2 example, EM arithmetic and seed/sampling |
| Corpus experiment/persistence | tokenizer_libraries.py composes canonical local core and data | Three Tokenizers families + two SentencePiece families; reload gives identical IDs | Changed vocabulary budget practice; pipeline whitespace contract independent |

Alice data: original 1865 text, Project Gutenberg ebook 11, public domain in the
USA; the first 18 paragraphs train the tokenizers and the next six are held out.
Exact provenance and file hashes are in alice-provenance.json; supplied files run
offline. native-output.json records actual Tokenizers 0.23.2 and SentencePiece
0.2.2 fits, with unknown spans and persistence checks. Training ties can vary.
String payloads incur concatenation cost beyond heap operations. The exact
Unigram removal score is intentionally bounded and does not claim industrial scaling.

## Research and claim ledger

All retrieved/read 28 September 2026. No complete video viewing claimed.

| Claim/convention | Primary source and locator | Assessment/application |
| --- | --- | --- |
| BPE word counts, boundary symbol and indexed updates | https://aclanthology.org/P16-1162.pdf §3.2/Algorithm 1 | Read the full algorithm and corresponding text; explicit tie convention and verified outputs |
| Marginal EM, pruning and sampling versus hard Viterbi | https://aclanthology.org/P18-1007.pdf §3.2–3.3 | Corrected legacy hard assignment; forward/backward implementation independently checked |
| WordPiece inference | https://github.com/google-research/bert/blob/master/tokenization.py WordpieceTokenizer | Longest match, 100-character default limit, whole-word UNK |
| Reconstructed training caveat | https://huggingface.co/learn/llm-course/en/chapter6/6 training warning and inference | Reviewed the worked tutorial; proxy labeled, no claim to the original Google training algorithm |
| Alternative Unigram teaching | https://huggingface.co/learn/llm-course/en/chapter6/7 | Read probability and dynamic-programming discussion; original small ab example used |
| SentencePiece toolkit/settings | https://aclanthology.org/D18-2012.pdf; https://github.com/google/sentencepiece; https://github.com/google/sentencepiece/blob/master/doc/options.md | Normalization, whitespace and coverage options verified; actual native settings executed |
| Maintained model/trainer API | https://huggingface.co/docs/tokenizers/api/models; https://huggingface.co/docs/tokenizers/api/trainers | Concrete contracts tested with version 0.23.2 |
| Regularization alternative | https://aclanthology.org/2020.acl-main.170/ | Read the paper record; no universal-benefit claim |
| Canonical coverage and alternate pedagogy | https://web.stanford.edu/~jurafsky/slp3/2.pdf | Chapter structure and tokenization material; retained corpus, pipeline and Unicode bridges |
| Video alternative | https://github.com/karpathy/minbpe; https://www.youtube.com/watch?v=zduSFxRajkE | Creator README and exercises inspected, not the full video; annotated accordingly |
| Real text source | https://www.gutenberg.org/ebooks/11 and linked UTF-8 text | License/source record, exact downloaded subset and hashes |
| Cost arithmetic | Derived 420/3.2, 420/4.2 and (3.2/4.2)^2 | Exact accounting, no fabricated benchmark or price claims |

## Author review and evidence

Content checkpoint was recorded before runtime implementation. The three canonical
programs, pure browser model, two static figures and three live investigations
are implemented. The author checks are in [author-numerical.json](author-numerical.json),
[native-output.json](native-output.json), and [author-evidence.json](author-evidence.json).
The retained scripts are `scripts/verify-subword-tokenization.py` and
`scripts/verify-subword-tokenization-models.mjs`. Native runs use Python 3.12,
Tokenizers 0.23.2 and SentencePiece 0.2.2 on CPU. All checks run offline after the
recorded public-domain source acquisition and dependency installation.

The independent training oracle recounts every pair; the encoder oracle scans a
plain list; the Unigram oracle enumerates complete segmentations. These check the
optimized mechanisms through distinct implementations. Recorded checks include
45 training cases, 2,790 rank-heap encodings, 201 native WordPiece cases, 744
Unigram cases, 12 exact EM updates, an underflow case, protected-alphabet pruning
and seeded sampling. Python/browser parity covers 48 training fixtures and 141
queries, including accented and astral symbols under explicit code-point ties.
The five real-data fits and reloads passed; their counts are displayed with their
actual differing pipeline contracts, not interpreted as a model-quality ranking.

### Author learning-experience assessment

This is an author's heuristic assessment, not an observed beginner study.

1. **Route:** the shared opening gives the first-pass route through BPE, WordPiece,
   small Unigram and libraries; section 6 labels the deeper exact-training branch.
   Numbering was repaired to keep sections 1–11 consecutive; legacy anchors remain.
2. **Cautions:** WordPiece trainer provenance has one clear home; pipeline loss
   is taught in the opening and connected to decoding. Programs print computed
   results rather than warning paragraphs. Unknown-symbol diagnostics in the
   real-text experiment show the actual failing spans instead of vague caveats.
3. **Real question:** the new spelling `lowest` motivates reusable pieces; it is
   encoded after training without refitting. Real Alice paragraphs carry the
   practical pipeline experiment, with a separate held-out excerpt.
4. **Investigations:** editable corpus/query and editable WordPiece dictionary
   extend beyond presets. Current outputs appear immediately. Empty inputs,
   overlapping pairs, unknown characters, missing continuation pieces, changed
   Unigram probabilities and removal of ab have explicit consequences.
5. **Figures:** static same-spelling strips establish the representational choice;
   the pipeline exposes exactly where case and spaces disappear. The lattice
   makes the two complete paths visible, and its bars share a 0–100% scale.
   Long equations were split into separate explanatory steps; topic-scoped
   horizontal containment prevents remaining math from widening the document.
6. **Connections:** training ranks feed the encoding query and native BPE bridge;
   fractional path counts feed the exact EM implementation. Byte coverage is
   routed to the next topic; weighted corpus allocation reuses this BPE owner in
   Vocabulary Design & Multilingual Tokenization. The historical unsupported
   timing-chart note is resolved by removal and replacement with scoped algebra
   and actual tokenization evidence.
7. **Code:** the displayed programs implement the algorithm, with compact input
   contracts. The maintained-library program imports both canonical scratch
   owners; verification oracles remain in scripts rather than inflating the
   learner's implementation.
8. **Practice:** five solved variations cover overlapping counts, greedy failure,
   changed Unigram probabilities, vocabulary cost and a modified corpus budget.
   The probability exercise supplies exact fractions and updated probabilities.
9. **Rendered states:** the author viewed root's desktop captures of the two
   static figures, all three default labs and the no-ab changed lattice. Labels,
   token boundaries, path probabilities and explanatory tables remain separated.
   Root owns the full edited-state, keyboard, narrow-width and zoom verification.
10. **Buildup throughout:** the map above was walked in reading order. Weighted
    counts precede argmax; overlap precedes savings; persisted ranks precede
    heap encoding; greedy failure precedes the full-path contrast; two numeric
    products precede the lattice equations; expected counts precede EM; protected
    characters precede pruning. The library section distinguishes matched
    inference from separate real-data training before presenting their results.

## Remaining integration action

Independent review is recorded separately by the vocabulary-topic author. Root
owns responsive browser closure, source registration, final production integration
and both ledger phases. User acceptance is not inferred from these checks.
