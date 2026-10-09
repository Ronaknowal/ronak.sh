"""Compare the previous lesson's ranked BPE with the same Hugging Face model.

Put subword_tokenizers.py and utf8_stream.py beside this program.
Install: python -m pip install tokenizers
Run: python byte_bpe_bridge.py
"""
import json
import tokenizers
from tokenizers import Tokenizer, models, pre_tokenizers, decoders
from subword_tokenizers import apply_bpe
from utf8_stream import byte_alphabet, mapped_bytes, unmap_tokens


def main():
    alphabet = byte_alphabet()
    e0, e1 = mapped_bytes("é")
    merges = [("c", "a"), ("ca", "f"), (e0, e1), ("caf", e0 + e1)]
    vocabulary = {symbol: byte for byte, symbol in enumerate(alphabet)}
    for left, right in merges:
        vocabulary[left + right] = len(vocabulary)
    tokenizer = Tokenizer(models.BPE(vocab=vocabulary, merges=merges))
    tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False, use_regex=False)
    tokenizer.decoder = decoders.ByteLevel()
    records = []
    for text in ["café 🌍", " cafe\u0301\n", "中", "", "<|endoftext|>"]:
        own_tokens = apply_bpe(mapped_bytes(text), merges)
        reference = tokenizer.encode(text)
        assert own_tokens == reference.tokens
        recovered = unmap_tokens(own_tokens)
        assert recovered == text.encode("utf-8")
        assert tokenizer.decode(reference.ids) == text
        records.append({"text": text, "ids": reference.ids,
                        "token_hex": [unmap_tokens([token]).hex(" ") for token in own_tokens]})
    print(json.dumps({"tokenizers": tokenizers.__version__, "vocab_size": len(vocabulary),
                      "records": records}, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
