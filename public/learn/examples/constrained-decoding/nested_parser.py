"""Persistent incremental recognizer for value := digit | '[' value (',' value)* ']'.

python nested_parser.py
Nonempty arrays, single ASCII digits, no whitespace. A full JSON parser accepts
more. Immutable frames share parent continuations between forked requests.
"""

from dataclasses import dataclass
import json


@dataclass(frozen=True)
class Frame:
    phase: str
    parent: object = None
    depth: int = 1


class NestedMatcher:
    def __init__(self, max_depth=128):
        if not isinstance(max_depth, int) or max_depth < 0:
            raise ValueError("Nonnegative integer depth limit required")
        self.max_depth = max_depth
        self.top = None
        self.complete = False
        self.terminated = False
        self.history = []

    def fork(self):
        other = NestedMatcher(self.max_depth)
        other.top, other.complete, other.terminated = (
            self.top,
            self.complete,
            self.terminated,
        )
        other.history = self.history.copy()
        return other

    def snapshot(self):
        return self.top, self.complete, self.terminated

    def _value_finished(self):
        if self.top is None:
            self.complete = True
        else:
            self.top = Frame("after", self.top.parent, self.top.depth)

    def _byte(self, byte):
        if self.terminated or self.complete:
            return False
        expecting = self.top is None or self.top.phase == "need"
        if expecting:
            if 48 <= byte <= 57:
                self._value_finished()
                return True
            if byte == 91:
                depth = 1 if self.top is None else self.top.depth + 1
                if depth > self.max_depth:
                    return False
                self.top = Frame("need", self.top, depth)
                return True
            return False
        if byte == 44:
            self.top = Frame("need", self.top.parent, self.top.depth)
            return True
        if byte == 93:
            self.top = self.top.parent
            self._value_finished()
            return True
        return False

    def accept(self, token):
        """Commit a whole raw-byte token or EOS(None), atomically."""
        if self.terminated:
            return False
        if token is None:
            if not self.complete:
                return False
            self.history.append(self.snapshot())
            self.terminated = True
            return True
        if not isinstance(token, bytes) or not token:
            return False
        trial = self.fork()
        for byte in token:
            if not trial._byte(byte):
                return False
        self.history.append(self.snapshot())
        self.top, self.complete, self.terminated = trial.snapshot()
        return True

    def allowed(self, vocabulary):
        return [i for i, token in enumerate(vocabulary) if self.fork().accept(token)]

    def rollback(self, steps=1):
        if type(steps) is not int or not 0 <= steps <= len(self.history):
            raise ValueError("Rollback exceeds retained token history")
        if steps:
            self.top, self.complete, self.terminated = self.history[-steps]
            del self.history[-steps:]

    def reset(self):
        self.top, self.complete, self.terminated = None, False, False
        self.history.clear()

    def frames(self):
        result = []
        frame = self.top
        while frame is not None:
            result.append({"phase": frame.phase, "depth": frame.depth})
            frame = frame.parent
        return result


def recursive_accept(data):
    """Independent complete-string reference, deliberately not incremental."""

    def value(position):
        if position >= len(data):
            raise ValueError("Missing value")
        if 48 <= data[position] <= 57:
            return position + 1
        if data[position] != 91:
            raise ValueError("Missing opening bracket")
        position = value(position + 1)
        while position < len(data) and data[position] == 44:
            position = value(position + 1)
        if position >= len(data) or data[position] != 93:
            raise ValueError("Missing closing bracket")
        return position + 1

    try:
        return value(0) == len(data)
    except (ValueError, RecursionError):
        return False


def main():
    matcher = NestedMatcher()
    trace = []
    for byte in b"[2,[3,4]]":
        assert matcher.accept(bytes([byte]))
        trace.append(
            {
                "byte": chr(byte),
                "frames": matcher.frames(),
                "complete": matcher.complete,
            }
        )
    assert recursive_accept(b"[2,[3,4]]") and matcher.complete
    assert matcher.accept(None) and matcher.terminated
    print(json.dumps(trace, indent=2))


if __name__ == "__main__":
    main()
