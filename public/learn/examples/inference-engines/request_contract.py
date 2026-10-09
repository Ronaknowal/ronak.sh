"""Validate the small engine's positive-output, pretokenized request contract."""
from dataclasses import dataclass
import math


def integer(value, name, minimum=0):
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum:
        raise ValueError(f"{name} must be an integer >= {minimum}")
    return value


def clock(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be a finite nonnegative time")
    if not math.isfinite(value) or value < 0:
        raise ValueError(f"{name} must be a finite nonnegative time")
    return float(value)


@dataclass(frozen=True)
class Request:
    request_id: str
    prompt: tuple[int, ...]
    cap: int
    arrival: float = 0.0
    deadline: float | None = None

    def __post_init__(self):
        if not isinstance(self.request_id, str) or not self.request_id.strip():
            raise ValueError("request_id must be a nonempty string")
        if not isinstance(self.prompt, tuple) or not self.prompt:
            raise ValueError("prompt must be a nonempty immutable tuple of IDs")
        for token in self.prompt:
            integer(token, "token ID")
        integer(self.cap, "cap", 1)
        clock(self.arrival, "arrival")
        if self.deadline is not None:
            clock(self.deadline, "deadline")
            if self.deadline < self.arrival:
                raise ValueError("deadline cannot precede arrival")


def requests_by_id(requests):
    result = {}
    for request in requests:
        if not isinstance(request, Request):
            raise TypeError("expected Request")
        if request.request_id in result:
            raise ValueError(f"duplicate request ID: {request.request_id}")
        result[request.request_id] = request
    return result


if __name__ == "__main__":
    a = Request("A", (11, 12, 13), 3)
    print(a)
    try:
        Request("zero", (11,), 0)
    except ValueError as error:
        print(type(error).__name__ + ": " + str(error))
