"""Select complete prompt groups without losing row identity.

The callback generates exactly one candidate batch. All candidates are retained
in the returned history, including homogeneous groups and a final overfull batch.
"""

from collections import OrderedDict


def complete_groups(rows, group_size):
    if group_size < 2:
        raise ValueError("Groups need at least two responses.")
    groups, seen = OrderedDict(), set()
    for row in rows:
        if row["uid"] in seen:
            raise ValueError("Duplicate response UID.")
        seen.add(row["uid"])
        groups.setdefault(row["group_uid"], []).append(row)
    for uid, group in groups.items():
        if len(group) != group_size or len({row["id"] for row in group}) != 1:
            raise ValueError(f"Incomplete or misaligned prompt group: {uid}")
        if len({tuple(row["prompt_ids"]) for row in group}) != 1:
            raise ValueError(f"Prompt tokens differ within group: {uid}")
        if any(row["correct"] not in (True, False) for row in group):
            raise ValueError("The selection metric is binary correctness.")
    return groups


def collect(generate, target_groups=2, group_size=4, max_batches=3, dynamic=True):
    if target_groups < 1 or max_batches < 1:
        raise ValueError("Positive target and bounded generation budget required.")
    selected, candidates, decisions, seen_groups, seen_rows = [], [], [], set(), set()
    for batch_index in range(max_batches):
        rows = generate(batch_index)
        groups = complete_groups(rows, group_size)
        if set(groups) & seen_groups or {r["uid"] for r in rows} & seen_rows:
            raise ValueError("Candidate UIDs must remain unique across batches.")
        seen_groups.update(groups)
        seen_rows.update(r["uid"] for r in rows)
        candidates.append(rows)
        for uid, group in groups.items():
            mixed = len({row["correct"] for row in group}) > 1
            eligible = mixed or not dynamic
            room = len(selected) // group_size < target_groups
            keep = eligible and room
            decisions.append(
                {
                    "group_uid": uid,
                    "mixed_correctness": mixed,
                    "kept": keep,
                    "reason": "kept" if keep else "quota" if eligible else "homogeneous",
                }
            )
            if keep:
                # Retain each entire original record, not a separately indexed tensor.
                selected.extend(group)
        if len(selected) // group_size == target_groups:
            return {
                "status": "filled",
                "selected": selected,
                "candidates": candidates,
                "decisions": decisions,
            }
    return {
        "status": "exhausted",
        "selected": selected,
        "candidates": candidates,
        "decisions": decisions,
    }
