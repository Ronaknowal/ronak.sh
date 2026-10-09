CODE = {"A": "0", "B": "10", "C": "110", "D": "111"}


def decode(bits, code):
    words = list(code.values())
    if len(set(words)) != len(words) or any(
        not word or set(word) - {"0", "1"} for word in words
    ):
        raise ValueError("Codewords must be distinct nonempty binary strings.")
    if any(a != b and b.startswith(a) for a in words for b in words):
        raise ValueError("Codebook is not prefix-free.")
    if set(bits) - {"0", "1"}:
        raise ValueError("The stream must contain only bits.")
    reverse = {word: symbol for symbol, word in code.items()}
    output, prefix = [], ""
    for bit in bits:
        prefix += bit
        if prefix in reverse:
            output.append(reverse[prefix])
            prefix = ""
        elif not any(word.startswith(prefix) for word in words):
            raise ValueError("This bit sequence has no matching word.")
    if prefix:
        raise ValueError("The stream ends inside a codeword.")
    return "".join(output)


message = "AAAABBCD"
bits = "".join(CODE[symbol] for symbol in message)
print(bits)
print(decode(bits, CODE))
print(f"{len(bits)} bits; {len(bits) / len(message):.2f} bits/symbol")
try:
    decode("11", CODE)
except ValueError as error:
    print(error)