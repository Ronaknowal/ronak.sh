"""Train ordinary ByteLevel BPE and SentencePiece Unigram on the retained corpus.

Install: python -m pip install tokenizers==0.22.2 sentencepiece==0.2.1
Run: python -X utf8 tokenizer_library_study.py --data wikitext_excerpt.json
This measures this fixture/configuration; it does not compare trained LM quality.
"""

import argparse
import json
from pathlib import Path
import tempfile

import sentencepiece as spm
import tokenizers
from tokenizers import Tokenizer, decoders, models, pre_tokenizers, trainers


def measure(texts, encode, decode):
    encoded = [encode(text) for text in texts]
    assert all(decode(ids) == text for ids, text in zip(encoded, texts))
    byte_count = sum(len(text.encode("utf-8")) for text in texts)
    count = sum(map(len, encoded))
    return {"utf8_bytes": byte_count, "tokens": count, "bytes_per_token": byte_count / count}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path(__file__).with_name("wikitext_excerpt.json"))
    parser.add_argument("--vocab-size", type=int, default=512)
    arguments = parser.parse_args()
    data = json.loads(arguments.data.read_text(encoding="utf-8"))
    train = [row["text"] for row in data["train"]]
    test = [row["text"] for row in data["test"]]
    bpe = Tokenizer(models.BPE())
    bpe.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False, use_regex=True)
    bpe.decoder = decoders.ByteLevel()
    bpe.train_from_iterator(train, trainer=trainers.BpeTrainer(
        vocab_size=arguments.vocab_size, initial_alphabet=pre_tokenizers.ByteLevel.alphabet(),
        special_tokens=[], show_progress=False))
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        text_path = root / "training.txt"
        text_path.write_text("\n".join(train) + "\n", encoding="utf-8")
        # Identity normalization and no dummy prefix preserve the retained text.
        # Byte fallback plus required observed characters may need >256 rows.
        spm.SentencePieceTrainer.train(
            input=str(text_path), model_prefix=str(root / "unigram"), model_type="unigram",
            vocab_size=arguments.vocab_size, character_coverage=1., byte_fallback=True,
            normalization_rule_name="identity", add_dummy_prefix=False,
            remove_extra_whitespaces=False, hard_vocab_limit=False,
            bos_id=-1, eos_id=-1, pad_id=-1, unk_id=0, num_threads=1,
            shuffle_input_sentence=False, minloglevel=2)
        unigram = spm.SentencePieceProcessor(model_file=str(root / "unigram.model"))
        # Installed 0.2.1 uses out_type. Sampling is posterior/temperature based,
        # not uniform over every segmentation and not deterministic Viterbi.
        spm.set_random_generator_seed(13)
        example = train[0]
        samples = [unigram.encode(example, out_type=str, enable_sampling=True,
                                  alpha=.5, nbest_size=-1) for _ in range(3)]
        for sample in samples:
            assert unigram.decode(sample) == example
        report = {
            "versions": {"tokenizers": tokenizers.__version__, "sentencepiece": spm.__version__},
            "budget": arguments.vocab_size,
            "bytelevel_bpe": {"vocab_size": bpe.get_vocab_size(),
                              "test": measure(test, lambda text: bpe.encode(text).ids, bpe.decode),
                              "example_pieces": bpe.encode(example).tokens},
            "sentencepiece_unigram": {"vocab_size": unigram.get_piece_size(),
                                      "test": measure(test, unigram.encode, unigram.decode),
                                      "example_pieces": unigram.encode(example, out_type=str),
                                      "sampled_pieces": samples},
            "configuration": {"sp_normalization": "identity", "sp_dummy_prefix": False,
                              "sp_byte_fallback": True, "hf_bytelevel_regex": True,
                              "test_selected_settings": False},
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
