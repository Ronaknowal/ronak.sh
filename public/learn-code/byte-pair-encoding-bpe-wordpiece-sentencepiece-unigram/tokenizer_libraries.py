"""Matched scratch/native inference and a held-out real-text tokenizer workflow.

Keep this file beside subword_tokenizers.py, unigram_model.py, alice-train.txt
and alice-heldout.txt. Install tokenizers and sentencepiece, then run this file.
Only local text and temporary model files are used; no pretrained downloads.
"""

from collections import Counter
from importlib.metadata import version
import io
import json
from math import log
from pathlib import Path
from tempfile import TemporaryDirectory

from tokenizers import Tokenizer, models, pre_tokenizers, trainers
import sentencepiece as spm

from subword_tokenizers import train_bpe, WordPiece
from unigram_model import Unigram


def matched_inference():
    counts = {"low": 5, "lower": 2, "newest": 6, "widest": 3}
    scratch = train_bpe(counts, 10, end_marker=None)
    vocabulary = {t: i for i, t in enumerate(sorted(scratch.vocabulary | {"[UNK]"}))}
    native = models.BPE(vocab=vocabulary, merges=scratch.merges, unk_token="[UNK]")
    bpe_results = {}
    for word in ["low", "lower", "lowest", "slowest", "newest", "widest"]:
        expected = scratch.encode_word(word)
        actual = [token.value for token in native.tokenize(word)]
        assert expected == actual
        bpe_results[word] = actual

    wp_vocab = {t: i for i, t in enumerate(["[UNK]", "a", "ab", "##b", "##bc", "##c"])}
    wp_scratch = WordPiece(wp_vocab)
    wp_native = models.WordPiece(vocab=wp_vocab, unk_token="[UNK]", max_input_chars_per_word=100)
    wordpiece_results = {}
    for word in ["abc", "abz", "a", "ab", "a" * 101]:
        actual = [token.value for token in wp_native.tokenize(word)]
        assert wp_scratch.encode_word(word) == actual
        wordpiece_results[word if len(word) < 10 else "101 characters"] = actual

    probabilities = {"a": 0.2, "b": 0.2, "ab": 0.6}
    unigram_scratch = Unigram(probabilities)
    unigram_native = models.Unigram([(t, log(p)) for t, p in probabilities.items()])
    unigram_results = {}
    for word in ["ab", "abab", "aab", "ba"]:
        actual = [token.value for token in unigram_native.tokenize(word)]
        assert unigram_scratch.encode_word(word) == actual
        unigram_results[word] = actual
    return {"bpe": bpe_results, "wordpiece": wordpiece_results, "unigram": unigram_results}


def corpus_experiment():
    root = Path(__file__).resolve().parent
    training = (root / "alice-train.txt").read_text(encoding="utf-8").splitlines()
    heldout = (root / "alice-heldout.txt").read_text(encoding="utf-8").splitlines()
    sample = " ".join(heldout)
    rows = []
    with TemporaryDirectory() as directory:
        for name, model, trainer in [
            ("HF BPE", models.BPE(unk_token="[UNK]"), trainers.BpeTrainer(vocab_size=160, special_tokens=["[UNK]"], show_progress=False)),
            ("HF WordPiece", models.WordPiece(unk_token="[UNK]"), trainers.WordPieceTrainer(vocab_size=160, special_tokens=["[UNK]"], show_progress=False)),
            ("HF Unigram", models.Unigram(), trainers.UnigramTrainer(vocab_size=160, special_tokens=["[UNK]"], unk_token="[UNK]", show_progress=False)),
        ]:
            tokenizer = Tokenizer(model)
            tokenizer.pre_tokenizer = pre_tokenizers.WhitespaceSplit()
            tokenizer.train_from_iterator(training, trainer=trainer)
            saved = Path(directory) / f"{name.replace(' ', '_')}.json"
            tokenizer.save(str(saved))
            restored = Tokenizer.from_file(str(saved))
            encoded = restored.encode(sample)
            assert encoded.ids == tokenizer.encode(sample).ids
            unknown_id = restored.token_to_id("[UNK]")
            rows.append({"system": name, "vocabulary": restored.get_vocab_size(),
                         "heldout_tokens": len(encoded.ids),
                         "unknown_tokens": sum(i == unknown_id for i in encoded.ids),
                         "unknown_spans": [sample[start:end] for token_id, (start, end) in zip(encoded.ids, encoded.offsets) if token_id == unknown_id],
                         "example": restored.encode("Alice was curious.").tokens})
        for kind in ["bpe", "unigram"]:
            writer = io.BytesIO()
            spm.SentencePieceTrainer.train(
                sentence_iterator=iter(training), model_writer=writer,
                model_type=kind, vocab_size=160, character_coverage=1.0,
                normalization_rule_name="identity", remove_extra_whitespaces=False,
                add_dummy_prefix=False, hard_vocab_limit=False,
                bos_id=-1, eos_id=-1, pad_id=-1, num_threads=1,
                shuffle_input_sentence=False, minloglevel=2,
            )
            processor = spm.SentencePieceProcessor(model_proto=writer.getvalue())
            ids = processor.encode(sample)
            pieces = processor.encode(sample, out_type=str)
            rows.append({"system": "SentencePiece " + kind, "vocabulary": processor.vocab_size(),
                         "heldout_tokens": len(ids), "unknown_tokens": ids.count(processor.unk_id()),
                         "unknown_spans": [piece for token_id, piece in zip(ids, pieces) if token_id == processor.unk_id()],
                         "example": processor.encode("Alice was curious.", out_type=str),
                         "whitespace_round_trip": processor.decode(processor.encode("Alice  was curious.")) == "Alice  was curious."})
    return {"training_paragraphs": len(training), "heldout_paragraphs": len(heldout),
            "heldout_characters": len(sample), "heldout_words": len(sample.split()), "results": rows}


if __name__ == "__main__":
    print(json.dumps({"versions": {p: version(p) for p in ["tokenizers", "sentencepiece"]},
                      "matched_inference": matched_inference(), "real_text": corpus_experiment()}, indent=2, ensure_ascii=False))
