"""Compare supplied wait/service estimates in one time unit; no clock is read."""

import json
from decimal import Decimal


def route(warm_wait, warm_service, cold_wait, cold_service):
    values = [Decimal(str(x)) for x in [warm_wait, warm_service, cold_wait, cold_service]]
    if any(not x.is_finite() or x < 0 for x in values):
        raise ValueError("Use finite nonnegative milliseconds.")
    ww, ws, cw, cs = values
    warm, cold = ww + ws, cw + cs
    return {
        "warm_finish_ms": str(warm),
        "cold_finish_ms": str(cold),
        "warm_wait_tie_ms": str(cold - ws),
        "choice": "tie" if warm == cold else "warm" if warm < cold else "cold",
    }


def verify():
    cases = [route(wait, 4, 2, 10) for wait in [0, 7, 8, 9, 20]]
    assert [x["choice"] for x in cases] == ["warm", "warm", "tie", "cold", "cold"]
    changed = [route(wait, 5, 3, 12) for wait in [7, 10, 13]]
    assert [x["choice"] for x in changed] == ["warm", "tie", "cold"]
    return {"milliseconds": cases, "changed": changed}


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
