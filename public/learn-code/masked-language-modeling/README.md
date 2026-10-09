# Masked language modeling examples

Keep `corruption_loss.py`, `tiny_mlm.py`, `library_mlm.py` and `alice_excerpt.txt`
in the same directory. Install NumPy, PyTorch and Transformers in your Python
environment. The checked Transformers snapshot is 5.17.0; the native evidence
records the exact other package versions. All three programs run offline after
dependency installation. No weights are downloaded and no Hub upload occurs.

```sh
python corruption_loss.py
python tiny_mlm.py --steps 240 --output experiment.json
python library_mlm.py --steps 120 --output library-experiment.json
```

The first program compares an array-derived selected loss/gradient with PyTorch.
The second builds the attention and encoder computation with tensor operations,
then trains a small model on real text. The third uses the ordinary BERT model
and dynamic collator. The two trainers have different initial weights and
implementations: their held-out losses are individual diagnostics, not a paired
architecture benchmark. Both use the same training-only word vocabulary, original
padding masks, contiguous text split and frozen evaluation corruption.

The custom corpus tokenizer extracts lowercase ASCII letter sequences. It is
deliberately a whole-word diagnostic vocabulary, not BERT's released WordPiece
vocabulary. The library program supplies its own already-tokenized IDs and uses
`BertTokenizer` for special-token/collation metadata. Unseen held-out words become
`[UNK]` and are excluded as targets; their count is reported.

`rate=0` is a no-target experiment. Such a batch has no defined selected mean;
trainers skip its update and evaluators report null metrics. Numeric zero in the
small loss helper is only a no-op sentinel accompanied by a zero target count.

These CPU examples expose the objective and implementation. They do not reproduce
large-scale BERT pretraining or establish downstream, retrieval or generation
quality. Consult `provenance.md` for the real text and the saved study's scope.
