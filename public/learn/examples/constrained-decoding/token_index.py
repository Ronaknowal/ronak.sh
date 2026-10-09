"""Walk token bytes through a DFA, sharing vocabulary prefixes in a trie.

python token_index.py
Requires the adjacent automata.py. None represents EOS; empty ordinary tokens
are rejected. A separate TokenIndex instance binds one grammar and vocabulary.
"""

import json
from automata import decimal_dfa


class TokenIndex:
    def __init__(self, dfa, vocabulary):
        self.dfa, self.vocabulary = dfa, tuple(vocabulary)
        self.children, self.leaves = [{}], [[]]
        self.eos = []
        self.cache = {}
        for token_id, value in enumerate(self.vocabulary):
            if value is None:
                self.eos.append(token_id)
                continue
            if not isinstance(value, bytes) or not value:
                raise ValueError(
                    "Ordinary vocabulary entries must be nonempty raw bytes"
                )
            node = 0
            for byte in value:
                if byte not in self.children[node]:
                    self.children[node][byte] = len(self.children)
                    self.children.append({})
                    self.leaves.append([])
                node = self.children[node][byte]
            self.leaves[node].append(token_id)

    def scan(self, state):
        destinations = {}
        for token_id, value in enumerate(self.vocabulary):
            if value is None:
                if state in self.dfa.accepting:
                    destinations[token_id] = -2  # terminated; never a DFA state
            else:
                end = self.dfa.advance(state, value)
                if end != -1:
                    destinations[token_id] = end
        return destinations

    def traverse(self, state):
        destinations, visited = {}, 0
        pending = [(0, state)] if state in self.dfa.live else []
        while pending:
            node, current = pending.pop()
            for token_id in self.leaves[node]:
                destinations[token_id] = current
            for byte, child in self.children[node].items():
                visited += 1
                following = self.dfa.transitions[current].get(byte, -1)
                if following != -1:
                    pending.append((child, following))
        if state in self.dfa.accepting:
            destinations.update({token_id: -2 for token_id in self.eos})
        return destinations, visited

    def next_tokens(self, state):
        if state not in self.cache:
            self.cache[state] = self.traverse(state)[0]
        return dict(self.cache[state])


def main():
    index = TokenIndex(decimal_dfa(), [b"abc", b"42", b"7", b"3x", None])
    rows = []
    for prefix in [b"", b"3", b"3.", b"3.2", b"3x"]:
        state = index.dfa.advance(0, prefix)
        row, visits = index.traverse(state)
        assert row == index.scan(state) == index.next_tokens(state)
        rows.append(
            {
                "prefix": prefix.decode(),
                "state": state,
                "accepting": state in index.dfa.accepting,
                "allowed_ids": sorted(row),
                "byte_edges_tested": visits,
            }
        )
    print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()
