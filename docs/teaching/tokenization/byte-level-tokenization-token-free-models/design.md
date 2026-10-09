# Byte-Level Tokenization & Token-Free Models

Revision 1, 28 September 2026. The stable source remains `src/learn/data/topics/byte-level-tokenization.jsx`. The parent tokenization record and central ledger own scope and phase status.

## Scope and baseline repairs

The old lesson supplied byte remapping, BPE, architecture summaries, scaling claims and exercises. Preserve the useful mechanisms while correcting Llama 3's tokenizer attribution, conditional round-trip claims at merge boundaries, confused byte/scalar/grapheme counts, and unsupported timing or quality rankings. The existing title still fits.

The first pass progresses from visible text to storage, grouping, streaming and model inputs. Architecture comparisons come after those interfaces. Complete architecture reproductions are not promised: this lesson owns UTF-8, byte-to-BPE bridging, byte training contracts and patch aggregation. Existing attention, autodiff and optimization lessons own their reusable machinery.

## Concept and implementation ownership

| Transition | Intuition and representation | Implementation or assessment |
|---|---|---|
| Perceived text → scalar → byte | Café, decomposed accents and scientist emoji in a nested explorer | Runtime Segmenter/TextEncoder; scratch UTF-8; changed Å exercise |
| Integer → UTF-8 payload | é = 233 → 00011 101001 → C3 A9 | Scratch encoder and strict incremental decoder, checked against Python codecs |
| Grouping versus preservation | éé grouped as C3 / A9 C3 / A9 | Rejoining invariance; normalization has a different contract |
| Bytes → ranked BPE | Complete 256-byte alphabet and four fixed café merges | Reuse the preceding `subword_tokenizers.py::apply_bpe`; exact HF vocabulary/rank bridge |
| Chunk → incomplete decoder state | Split the globe emoji inside its four-byte sequence | Persistent decoder versus independent replacement; euro exercise |
| Byte sequence → training targets | é gives inputs [BOS,198,172] and targets [198,172,EOS] | Batching, masks and stable loss; PyTorch value/gradient and ByT5 byte-ID bridges |
| Remove subwords → move computation | Direct bytes, character compression, soft blocks, SSMs and patches | Architecture diagrams and linked prior attention/SSM owners |
| Prefix uncertainty → patch boundary | Constructed binary distributions and strict threshold; [3,3,2] → [3,1,2,2] | Entropy, patch IDs and indexed means; NumPy/PyTorch parity |
| Shorter global sequence → resource accounting | 36 versus 6 causal pairs, Vd tables, bits per byte | Exact shape arithmetic; changed-budget practice |

The four complete programs live in `public/learn-code/byte-level-tokenization-token-free-models/`: `utf8_stream.py`, `byte_bpe_bridge.py`, `byte_model_bridge.py` and `byte_patches.py`. BPE imports the prior program instead of copying its engine. The byte training program reuses previously taught attention/autograd/optimizer machinery; its new ownership is the input/target/mask/loss contract. ByT5's ID 2 is unknown, while this teaching model uses BOS 2. Only ordinary byte IDs are compared, with special tokens excluded.

The pooling program uses constructed feature vectors to isolate aggregation. A mean of additive content and position embeddings still loses permutations; real contextual interaction is explicitly required. The program is an aggregation building block, not a BLT replica.

## Visual and live investigation contracts

1. **UnicodeByteLab, section 1.** Editable text, capped at 48 input scalars; none/NFC/NFD/NFKC normalization; original and transformed bytes update immediately. Grapheme outlines contain scalar labels and byte hex. Defaults to café plus globe; decomposed, scientist and ligature presets; empty/ASCII null cases. Reject unpaired UTF-16 surrogates visibly. Grapheme segmentation follows the browser's Unicode version, with no claim of latest-standard conformance. Tiles reflow on narrow screens.
2. **BytePipelineFigure, section 3.** Read-only éé → C3 A9 C3 A9 → three groups → rejoin → éé. The middle group crosses a scalar boundary. Only grouping changes; no byte disappears. Vertical stages keep labels outside geometry.
3. **StreamingByteLab, section 5.** Editable text, integer split slider, final-byte truncation and reset. Default split 8 emits café plus space with two continuations pending, then the globe. Show each chunk, text emitted now, pending count, accumulated output and final flush. Compare independent replacement decoding. Split zero/end and ASCII are null cases; truncated globe fails on final flush. Arbitrary malformed middle sequences belong to native checks; this lab explores valid text and a truncated tail. No prediction gate.
4. **ByteArchitectureFigure, section 8.** Direct byte positions; character downsampling/upsampling; local bytes → global patches → local byte decoding. Group counts are schematic. Shapes reveal aggregation locations without inventing a performance curve.
5. **BytePatchLab, section 9.** Fixed eight-byte ASCII text `cafe abc`; position selector, probability from .5 to 1 and entropy threshold from 0 to 1. Bars use a fixed 0–1 bit scale and explicit threshold tick. Show boundaries, patch lengths and exact causal pair grids. Defaults [.5,.99,.99,.5,.9,.99,.5,.99] at threshold .5 produce [3,3,2]. Position 4 at p=.5 gives [3,1,2,2]; threshold 1 yields one patch; threshold 0 starts every positive-entropy position; p=1 gives zero entropy. Equality uses strict greater-than. The distributions are constructed, not recorded from a trained predictor. Pair counts exclude local work.

Use the shared opening/compass, visible teaching, Copy/Download programs, automatic file index, Sources and separate practice/next endings. Only hints and solutions use disclosure. Neutral charcoal/amber styles are explicitly imported; no green decoration.

## Primary research and canonical coverage

Read on 28 September 2026:

- [RFC 3629](https://www.rfc-editor.org/rfc/rfc3629), sections 3–4 and 7: payloads, valid scalars, overlong/surrogate rejection and independent example vectors. This exposed missing validity and finalization teaching.
- [UAX 15](https://unicode.org/reports/tr15/) and [UAX 29](https://unicode.org/reports/tr29/): canonical/compatibility normalization, grapheme approximation and version boundaries. Original spelling cannot be inferred after a lossy transformation.
- [Python Unicode HOWTO](https://docs.python.org/3/howto/unicode.html) and [incremental codecs](https://docs.python.org/3/library/codecs.html): adopted the text → integer → bytes progression and persistent-state intuition with original examples. Pages read.
- [GPT-2 encoder](https://github.com/openai/gpt-2/blob/master/src/encoder.py) and [HF pre-tokenizers](https://huggingface.co/docs/tokenizers/api/pre-tokenizers): byte bijection and prefix/regex configuration. Exact native comparison replaces unverified trained counts.
- [Meta Llama 3 tokenizer](https://github.com/meta-llama/llama3/blob/main/llama/tokenizer.py): actual tiktoken implementation corrects the legacy family claim.
- [ByT5 paper](https://aclanthology.org/2022.tacl-1.17.pdf), [guide](https://huggingface.co/docs/transformers/model_doc/byt5) and tokenizer source: architecture, corruption, tradeoff and byte offset. Paper/API read. The optional author presentation was not watched and is labeled accordingly.
- [CANINE paper](https://aclanthology.org/2022.tacl-1.5.pdf): multi-hash embeddings and down/up-sampling. [Charformer](https://arxiv.org/abs/2106.12672) and [MambaByte](https://arxiv.org/abs/2401.13660): mechanism summaries without borrowed benchmark numbers.
- [BLT](https://arxiv.org/html/2412.09871v1), sections 2–4, and [author code](https://github.com/facebookresearch/blt): causal entropy, local/global computation and bits per byte. Root separately checked causal patch dependencies. Full BLT training is outside this lesson's executable claim.

Data scope: encoding/protocol and model-interface teaching, not population statistics. Constructed Unicode and probabilities make states traceable; RFC vectors supply independent standard inputs. Tiny byte-model training is a mechanics fixture. The next vocabulary lesson supplies real multilingual corpus comparisons.

## Execution and handoff

Content checkpoint is complete; root recorded it before runtime implementation. Three labs and two figures now implement the specifications. `native-evidence.json` binds all four public programs, the actual reused BPE program and native verifier. `model-evidence.json` binds the pure browser model and its verifier. Those records contain exact versions, results and limits.

Native checks cover strict UTF-8 acceptance/output, all one- and two-byte strings, malformed/random longer cases, scalar boundaries, stream partitions, scratch/library BPE, byte IDs, causal masks, stable loss values/gradients and indexed pooling. Model checks cover normalization/units, surrogate rejection, stream boundaries and patch thresholds. Native training runs on CPU; no pretrained-model quality, GPU timing or full BLT reproduction is claimed.

`author-review.md` records the learner-path review and actual screenshot inspection. Root owns browser integration, independent review completion, shared phase hashes and publication status. Retain source-bound evidence; remove only owned transient caches once checks finish.
