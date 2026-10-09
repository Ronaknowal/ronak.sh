"""Strict UTF-8 and byte-token plumbing. Python 3.10+, standard library only."""
from __future__ import annotations

import codecs
import json
import unicodedata


def encode_utf8(text: str) -> bytes:
    output = bytearray()
    for char in text:
        value = ord(char)
        if 0xD800 <= value <= 0xDFFF:
            raise ValueError("A surrogate is not a Unicode scalar value")
        if value < 0x80:
            output.append(value)
        elif value < 0x800:
            output.extend((0xC0 | (value >> 6), 0x80 | (value & 63)))
        elif value < 0x10000:
            output.extend((0xE0 | (value >> 12),
                           0x80 | ((value >> 6) & 63), 0x80 | (value & 63)))
        else:
            output.extend((0xF0 | (value >> 18), 0x80 | ((value >> 12) & 63),
                           0x80 | ((value >> 6) & 63), 0x80 | (value & 63)))
    return bytes(output)


class UTF8Stream:
    """One pass, constant decoder state; discard this instance after an error."""

    def __init__(self):
        self.remaining = 0
        self.value = 0
        self.minimum = 0

    def feed(self, chunk: bytes, *, final: bool = False) -> str:
        characters = []
        for byte in chunk:
            if self.remaining:
                if not 0x80 <= byte <= 0xBF:
                    raise ValueError("Expected a UTF-8 continuation byte")
                self.value = (self.value << 6) | (byte & 63)
                self.remaining -= 1
                if self.remaining == 0:
                    value = self.value
                    if (value < self.minimum or value > 0x10FFFF
                            or 0xD800 <= value <= 0xDFFF):
                        raise ValueError("Non-scalar or non-shortest UTF-8 encoding")
                    characters.append(chr(value))
            elif byte < 0x80:
                characters.append(chr(byte))
            elif 0xC2 <= byte <= 0xDF:
                self.value, self.remaining, self.minimum = byte & 31, 1, 0x80
            elif 0xE0 <= byte <= 0xEF:
                self.value, self.remaining, self.minimum = byte & 15, 2, 0x800
            elif 0xF0 <= byte <= 0xF4:
                self.value, self.remaining, self.minimum = byte & 7, 3, 0x10000
            else:
                raise ValueError("Invalid UTF-8 leading byte")
        if final and self.remaining:
            raise ValueError("Incomplete UTF-8 sequence at end of stream")
        return "".join(characters)


def byte_alphabet() -> tuple[str, ...]:
    """The GPT-2 printable byte bijection, indexed by the original byte."""
    visible = list(range(33, 127)) + list(range(161, 173)) + list(range(174, 256))
    mapping = {byte: chr(byte) for byte in visible}
    next_value = 256
    for byte in range(256):
        if byte not in mapping:
            mapping[byte] = chr(next_value)
            next_value += 1
    return tuple(mapping[byte] for byte in range(256))


def mapped_bytes(text: str) -> list[str]:
    alphabet = byte_alphabet()
    return [alphabet[byte] for byte in encode_utf8(text)]


def unmap_tokens(tokens: list[str]) -> bytes:
    inverse = {character: byte for byte, character in enumerate(byte_alphabet())}
    return bytes(inverse[character] for token in tokens for character in token)


def main():
    text = "café 🌍"
    encoded = encode_utf8(text)
    chunks = [encoded[:4], encoded[4:8], encoded[8:]]
    own = UTF8Stream()
    standard = codecs.getincrementaldecoder("utf-8")("strict")
    trace = []
    for index, chunk in enumerate(chunks):
        final = index == len(chunks) - 1
        emitted = own.feed(chunk, final=final)
        assert emitted == standard.decode(chunk, final=final)
        trace.append({"bytes": chunk.hex(" "), "emitted": emitted,
                      "continuations_needed": own.remaining})
    assert encoded == text.encode("utf-8")
    assert unmap_tokens(mapped_bytes(text)) == encoded
    print(json.dumps({"text": text, "bytes": encoded.hex(" "), "trace": trace,
                      "NFD_bytes": encode_utf8(unicodedata.normalize("NFD", text)).hex(" ")},
                     ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
