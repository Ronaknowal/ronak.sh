"""Compile a small regular-expression AST into a byte DFA.

python automata.py
Standard library only. This is a compiler for explicit constructors, not a
parser for arbitrary regex syntax. DFA states remember epsilon-closed NFA sets.
"""

from collections import defaultdict, deque
from dataclasses import dataclass
import json


def literal(value):
    return (
        "literal",
        value.encode("utf-8") if isinstance(value, str) else bytes(value),
    )


def charset(values):
    values = frozenset(values)
    if any(type(v) is not int or not 0 <= v <= 255 for v in values):
        raise ValueError("Character classes contain byte integers 0..255")
    return ("class", values)


def sequence(*parts):
    return ("sequence", parts)


def choice(*parts):
    return ("choice", parts)


def star(part):
    return ("star", part)


def plus(part):
    return sequence(part, star(part))


def optional(part):
    return choice(literal(b""), part)


class NFA:
    """Each edge consumes one byte; None-labelled edges consume no input."""

    def __init__(self, limit=4096):
        self.edges = defaultdict(lambda: defaultdict(set))
        self.count, self.limit = 0, limit

    def state(self):
        if self.count >= self.limit:
            raise ValueError("NFA state budget exceeded")
        result = self.count
        self.count += 1
        return result

    def edge(self, source, symbol, destination):
        self.edges[source][symbol].add(destination)

    def build(self, ast, depth=0):
        if depth > 64:
            raise ValueError("AST depth budget exceeded")
        kind, value = ast
        start, end = self.state(), self.state()
        if kind == "literal":
            current = start
            for byte in value:
                after = self.state()
                self.edge(current, byte, after)
                current = after
            self.edge(current, None, end)
        elif kind == "class":
            for byte in value:
                self.edge(start, byte, end)
        elif kind == "sequence":
            current = start
            for part in value:
                first, last = self.build(part, depth + 1)
                self.edge(current, None, first)
                current = last
            self.edge(current, None, end)
        elif kind == "choice":
            for part in value:
                first, last = self.build(part, depth + 1)
                self.edge(start, None, first)
                self.edge(last, None, end)
        elif kind == "star":
            first, last = self.build(value, depth + 1)
            self.edge(start, None, end)
            self.edge(start, None, first)
            self.edge(last, None, first)
            self.edge(last, None, end)
        else:
            raise ValueError(f"Unknown AST operator: {kind}")
        return start, end

    def closure(self, states):
        found = set(states)
        pending = list(found)
        while pending:
            for following in self.edges[pending.pop()][None]:
                if following not in found:
                    found.add(following)
                    pending.append(following)
        return frozenset(found)


@dataclass
class DFA:
    transitions: list
    accepting: frozenset
    live: frozenset
    subsets: tuple
    start: int = 0

    def advance(self, state, data):
        """Return -1 when the complete token has no accepting continuation."""
        if state not in self.live:
            return -1
        for byte in data:
            state = self.transitions[state].get(byte, -1)
            if state == -1:
                break
        return state

    def accepts(self, data):
        return self.advance(self.start, data) in self.accepting


def compile_regular(ast, max_states=2048):
    nfa = NFA()
    first, last = nfa.build(ast)
    initial = nfa.closure([first])
    subsets, index, rows = [initial], {initial: 0}, []
    accepting = set()
    cursor = 0
    while cursor < len(subsets):
        current = subsets[cursor]
        if last in current:
            accepting.add(cursor)
        moves = defaultdict(set)
        for state in current:
            for byte, destinations in nfa.edges[state].items():
                if byte is not None:
                    moves[byte].update(destinations)
        row = {}
        for byte, destinations in sorted(moves.items()):
            reached = nfa.closure(destinations)
            if reached not in index:
                if len(subsets) >= max_states:
                    raise ValueError("DFA state budget exceeded")
                index[reached] = len(subsets)
                subsets.append(reached)
            row[byte] = index[reached]
        rows.append(row)
        cursor += 1
    # A reachable state is viable only if some path can reach acceptance.
    reverse = defaultdict(set)
    for source, row in enumerate(rows):
        for destination in row.values():
            reverse[destination].add(source)
    live, pending = set(accepting), deque(accepting)
    while pending:
        for source in reverse[pending.popleft()]:
            if source not in live:
                live.add(source)
                pending.append(source)
    rows = [{byte: end for byte, end in row.items() if end in live} for row in rows]
    return DFA(rows, frozenset(accepting), frozenset(live), tuple(subsets))


def decimal_dfa():
    digit = charset(range(ord("0"), ord("9") + 1))
    return compile_regular(
        sequence(plus(digit), optional(sequence(literal("."), plus(digit))))
    )


def main():
    dfa = compile_regular(sequence(choice(literal("a"), literal("b")), literal("c")))
    print(
        json.dumps(
            {
                "subsets": [sorted(s) for s in dfa.subsets],
                "accepting": sorted(dfa.accepting),
                "transitions": [
                    {chr(b): t for b, t in row.items()} for row in dfa.transitions
                ],
                "complete": {
                    s: dfa.accepts(s.encode()) for s in ["", "a", "ac", "bc", "abc"]
                },
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
