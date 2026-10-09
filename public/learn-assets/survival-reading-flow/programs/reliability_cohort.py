"""Read only the licensed cohort's observed time/death fields, without fitting."""

import csv
from dataclasses import dataclass
from hashlib import sha256
from io import StringIO
from math import isfinite


@dataclass(frozen=True)
class FollowupRow:
    row_id: int
    days: float
    death_observed: bool


def read_followup(path, *, expected_sha256):
    """Verify unaltered offline bytes, then make explicit right-censored rows.

    Row IDs are local CSV row numbers, not original clinical identifiers.
    Other columns stay in the raw file but are not used as predictors. O(n)
    rows/retained state; file reading and UTF-8 decoding cost O(bytes).
    """
    raw = path.read_bytes()
    if sha256(raw).hexdigest() != expected_sha256:
        raise ValueError('Offline raw cohort identity differs from its provenance receipt.')
    reader = csv.DictReader(StringIO(raw.decode('utf-8-sig')))
    names = reader.fieldnames
    if names is None or len(set(names)) != len(names) or not {'time','DEATH_EVENT'} <= set(names):
        raise ValueError('Require unique columns including time and DEATH_EVENT.')
    result=[]
    for number,row in enumerate(reader,1):
        if None in row or any(v is None for v in row.values()):
            raise ValueError('Malformed CSV row width.')
        days=float(row['time'])
        code=row['DEATH_EVENT'].strip()
        if not isfinite(days) or days < 0 or code not in ('0','1'):
            raise ValueError('Use finite nonnegative days and literal 0/1 death coding.')
        result.append(FollowupRow(number,days,code=='1'))
    if not result:
        raise ValueError('The cohort must contain observed rows.')
    return tuple(result)


def pre_event_count(curve, day):
    """Use the prepared groups: Y>=day before endpoint removals, O(log g)."""
    from bisect import bisect_left
    curve.value(day)  # Public lookup validates the same recorded support.
    position=bisect_left(curve.times,day)
    return curve.points[position].group.at_risk
