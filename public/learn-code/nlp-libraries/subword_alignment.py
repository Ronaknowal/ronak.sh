"""Local WordPiece tokenizer, word ownership, and first-piece supervision.
Run: python subword_alignment.py. Requires tokenizers; no network/model files.
"""
from tokenizers import Tokenizer, models, pre_tokenizers, processors


def first_piece_labels(word_ids, word_labels, ignore=-100):
    labels, previous = [], None
    for word in word_ids:
        labels.append(word_labels[word] if word is not None and word != previous else ignore)
        previous = word
    return labels


def main():
    vocab = {word: index for index, word in enumerate(
        ["[UNK]", "[PAD]", "[CLS]", "[SEP]", "New", "York", "play", "##ing"])}
    tokenizer = Tokenizer(models.WordPiece(vocab, unk_token="[UNK]"))
    tokenizer.pre_tokenizer = pre_tokenizers.WhitespaceSplit()
    tokenizer.post_processor = processors.TemplateProcessing(
        single="[CLS] $A [SEP]", special_tokens=[("[CLS]", 2), ("[SEP]", 3)])
    tokenizer.enable_padding(pad_id=1, pad_token="[PAD]")
    encoded = tokenizer.encode_batch([["New", "York"], ["playing"]], is_pretokenized=True)
    for item, labels in zip(encoded, [[1, 2], [0]]):
        aligned = first_piece_labels(item.word_ids, labels)
        print(item.tokens, item.word_ids, item.attention_mask, aligned)
    assert encoded[1].tokens == ["[CLS]", "play", "##ing", "[SEP]"]
    assert first_piece_labels(encoded[1].word_ids, [0]) == [-100, 0, -100, -100]


if __name__ == "__main__":
    main()
