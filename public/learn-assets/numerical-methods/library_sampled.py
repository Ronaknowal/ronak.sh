"""Offline UTC discharge observations; chosen linear interpolation."""
import argparse
import csv
from datetime import datetime, timezone
import math
from pathlib import Path
import numpy as np
from scipy.integrate import trapezoid, simpson


def utc(text):
    stamp = datetime.fromisoformat(text.replace("Z", "+00:00"))
    if stamp.tzinfo is None:
        raise ValueError("Timestamp must include a UTC offset")
    return stamp.astimezone(timezone.utc)


def panels(rows):
    result = []
    for (t0, q0), (t1, q1) in zip(rows, rows[1:]):
        width = (t1-t0).total_seconds()
        if width <= 0:
            raise ValueError("Observation times must strictly increase")
        result.append((width, (q0+q1)*width/2))
    return result


def describe(label, rows):
    parts = panels(rows)
    elapsed = [(t-rows[0][0]).total_seconds() for t, q in rows]
    total = math.fsum(area for width, area in parts)
    library = trapezoid([q for t, q in rows], x=elapsed)
    print(f"{label}: rows={len(rows)} scratch={total:.0f} scipy={library:.0f} ft^3")
    for i, (width, area) in enumerate(parts):
        print(f"  panel {i}: seconds={width:.0f} volume={area:.0f} ft^3")
    return total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, default=Path(__file__).with_name("usgs-discharge.csv"))
    parser.add_argument("--omit-time")
    parser.add_argument("--minutes-as-seconds", action="store_true")
    args = parser.parse_args()
    with args.csv.open(newline="", encoding="utf-8") as stream:
        rows = [(utc(r["time_utc"]), float(r["discharge_ft3_per_s"])) for r in csv.DictReader(stream)]
    if len(rows) < 2 or not all(math.isfinite(q) for t, q in rows):
        raise ValueError("Need at least two finite observations")
    full = describe("full", rows)
    if args.omit_time:
        target = utc(args.omit_time)
        if sum(t == target for t, q in rows) != 1:
            raise ValueError("Requested timestamp must occur exactly once")
        reduced = [r for r in rows if r[0] != target]
        if len(reduced) < 2:
            raise ValueError("At least two observations must remain")
        changed = describe("reduced", reduced)
        print(f"reduced minus full={changed-full:.0f} ft^3")
    if args.minutes_as_seconds:
        print(f"minute-width sum={full/60:.0f}; seconds-per-minute=60")
    x = np.linspace(0., 1., 5)
    print(f"constructed x^2: trapezoid={trapezoid(x*x, x=x):.9f} Simpson={simpson(x*x, x=x):.9f} exact={1/3:.9f}")


if __name__ == "__main__":
    main()
