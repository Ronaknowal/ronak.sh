"""Compare last-response and retained-response selection on a supplied trace.

python revision.py
These are constructed revisions, not calls to a trained revision model.
"""
from dataclasses import asdict
import json
from selection import Candidate, select
from budgeting import hybrid


def inspect_revisions(revisions):
    rows = []
    for index, current in enumerate(revisions):
        seen = revisions[:index + 1]
        rows.append({"step": index, "conditioned_on": [c.identity for c in seen[:-1]],
                     "current": asdict(current), "last": select([current]),
                     "retain_and_rank": select(seen, "best"),
                     "retain_and_vote": select(seen, "vote")})
    return rows


if __name__ == "__main__":
    revisions = [Candidate("R0", "Answer: 11/2", .8),
                 Candidate("R1", "Answer: 15/2", .7),
                 Candidate("R2", "Answer: 7.5", .9)]
    print(json.dumps({"scope": "Constructed revision sequence and imperfect scores",
                      "trace": inspect_revisions(revisions),
                      "hybrid_work": hybrid(2, 3, 10, 20)}, indent=2))
