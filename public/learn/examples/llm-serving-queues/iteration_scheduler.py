"""Inspect a toy token scheduler with explicit fictional execution costs.

Run: python iteration_scheduler.py --budget 4 --sequences 3 --blocks 8
All times are simulated seconds, NOT measured GPU latencies. Each completed
prefill emits the first output token; each subsequent decode consumes the last
generated token and emits one new token. Thus target O needs O-1 decode inputs.
The toy reserves known peak blocks up front; real output lengths are uncertain.
There is no prefix sharing, swapping, preemption, transport or model execution.
"""
from __future__ import annotations

import argparse
import json
import math
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class TokenRequest:
    id: str
    arrival: float
    prompt_tokens: int
    output_target: int


@dataclass(frozen=True)
class Cost:
    overhead: float = .02
    per_prefill_token: float = .005
    per_decode_request: float = .01
    per_decode_context_token: float = .0001


DEFAULT_REQUESTS = [TokenRequest("A", 0, 9, 3),
                    TokenRequest("B", .01, 4, 2),
                    TokenRequest("C", .04, 3, 1)]


def simulate(requests: list[TokenRequest], budget: int = 4, sequences: int = 3,
             blocks: int = 8, block_size: int = 4, chunked: bool = True,
             cost: Cost = Cost()) -> dict:
    if any(isinstance(value, bool) or not isinstance(value, int) or value < 1
           for value in (budget, sequences, blocks, block_size)):
        raise ValueError("Token budget, sequence limit, blocks and block size are positive integers.")
    if not all(math.isfinite(value) and value >= 0 for value in asdict(cost).values()) or cost.overhead <= 0:
        raise ValueError("Costs are finite nonnegative; positive overhead guarantees time progress.")
    previous, identities = -math.inf, set()
    rows = []
    for request in requests:
        if not request.id or request.id in identities:
            raise ValueError("Unique nonempty request ids required.")
        identities.add(request.id)
        if not math.isfinite(request.arrival) or request.arrival < 0 or request.arrival < previous:
            raise ValueError("Finite nonnegative chronological arrivals required; ties keep input order.")
        if any(isinstance(value, bool) or not isinstance(value, int) for value in
               (request.prompt_tokens, request.output_target)) or request.prompt_tokens < 1 or request.output_target < 0:
            raise ValueError("Prompt length is a positive integer; output target is a nonnegative integer.")
        previous = request.arrival
        # No next input exists after the final emitted token, so O-1 decode inputs.
        peak_tokens = request.prompt_tokens+max(0, request.output_target-1)
        rows.append({**asdict(request), "status": "not-arrived", "admitted": None,
                     "processed_prompt": 0, "generated": 0, "decode_inputs": 0,
                     "reserved_blocks": math.ceil(peak_tokens/block_size),
                     "committed_blocks": 0, "outputs": [], "finish": None})
    active, waiting, iterations, events = [], [], [], []
    index, time = 0, 0.0

    def offer_arrivals() -> None:
        nonlocal index
        while index < len(rows) and rows[index]["arrival"] <= time:
            row = rows[index]
            if row["output_target"] == 0:
                row.update(status="zero-output-canceled", finish=row["arrival"])
                events.append({"time": row["arrival"], "id": row["id"], "event": "zero-output-cancel"})
            elif row["reserved_blocks"] > blocks:
                row["status"] = "rejected-unfit-peak"
                events.append({"time": row["arrival"], "id": row["id"], "event": "reject-unfit-peak"})
            elif not chunked and row["prompt_tokens"] > budget:
                row["status"] = "rejected-unfit-full-prefill-budget"
                events.append({"time": row["arrival"], "id": row["id"], "event": "reject-unfit-full-prefill-budget"})
            else:
                row["status"] = "waiting"
                waiting.append(index)
                events.append({"time": row["arrival"], "id": row["id"], "event": "offer"})
            index += 1

    def admit_waiting() -> None:
        # Strict FIFO admission: do not skip a blocked head to admit a smaller tail.
        while waiting and len(active) < sequences:
            needed = rows[waiting[0]]["reserved_blocks"]
            reserved = sum(rows[job]["reserved_blocks"] for job in active)
            if reserved+needed > blocks:
                break
            job = waiting.pop(0)
            rows[job].update(status="active", admitted=time)
            active.append(job)
            events.append({"time": time, "id": rows[job]["id"], "event": "admit"})

    while index < len(rows) or active or waiting:
        if not active and not waiting and index < len(rows):
            time = max(time, rows[index]["arrival"])
        offer_arrivals()
        admit_waiting()
        if not active:
            if waiting:
                raise AssertionError("No active work can free memory for an otherwise fitting FIFO head.")
            continue
        remaining_budget = budget
        operations = []
        # Existing decode work first. More active requests than budget can wait.
        for job in active:
            row = rows[job]
            if row["processed_prompt"] == row["prompt_tokens"] and remaining_budget > 0:
                context = row["prompt_tokens"]+row["decode_inputs"]+1
                operations.append({"job": job, "id": row["id"], "phase": "decode",
                                   "input_tokens": 1, "decode_context": context})
                remaining_budget -= 1
        for job in active:
            row = rows[job]
            unfinished = row["prompt_tokens"]-row["processed_prompt"]
            if unfinished <= 0 or remaining_budget <= 0:
                continue
            amount = min(unfinished, remaining_budget) if chunked else unfinished
            if amount > remaining_budget:
                continue
            operations.append({"job": job, "id": row["id"], "phase": "prefill",
                               "input_tokens": amount, "decode_context": 0})
            remaining_budget -= amount
        if not operations:
            raise AssertionError("An admitted request has no schedulable work.")
        prefill_tokens = sum(op["input_tokens"] for op in operations if op["phase"] == "prefill")
        decode_count = sum(op["phase"] == "decode" for op in operations)
        decode_context = sum(op["decode_context"] for op in operations)
        duration = (cost.overhead+cost.per_prefill_token*prefill_tokens
                    +cost.per_decode_request*decode_count
                    +cost.per_decode_context_token*decode_context)
        start, end = time, time+duration
        reserved_before = {rows[job]["id"]: rows[job]["reserved_blocks"] for job in active}
        committed_before = {rows[job]["id"]: rows[job]["committed_blocks"] for job in active}
        emitted = []
        for operation in operations:
            row = rows[operation["job"]]
            if operation["phase"] == "prefill":
                row["processed_prompt"] += operation["input_tokens"]
                if row["processed_prompt"] == row["prompt_tokens"]:
                    row["generated"] += 1
                    row["outputs"].append(end)
                    emitted.append(row["id"])
            else:
                row["decode_inputs"] += 1
                row["generated"] += 1
                row["outputs"].append(end)
                emitted.append(row["id"])
            row["committed_blocks"] = math.ceil((row["processed_prompt"]+row["decode_inputs"])/block_size)
        committed_after_work = {rows[job]["id"]: rows[job]["committed_blocks"] for job in active}
        finished = [job for job in active if rows[job]["generated"] == rows[job]["output_target"]]
        for job in finished:
            rows[job].update(status="completed", finish=end)
            active.remove(job)
            events.append({"time": end, "id": rows[job]["id"], "event": "release-blocks"})
        iterations.append({"index": len(iterations), "start": start, "end": end,
                           "duration": duration, "operations": operations,
                           "prefill_tokens": prefill_tokens, "decode_requests": decode_count,
                           "decode_context_tokens": decode_context,
                           "token_budget": budget, "unused_token_budget": remaining_budget,
                           "reserved_before": reserved_before, "committed_before": committed_before,
                           "committed_after_work_before_release": committed_after_work,
                           "emitted_first_or_next_output": emitted,
                           "released": [rows[job]["id"] for job in finished]})
        time = end
    for row in rows:
        outputs = row["outputs"]
        gaps = [b-a for a, b in zip(outputs, outputs[1:])]
        row.update(ttft=outputs[0]-row["arrival"] if outputs else None,
                   inter_token_gaps=gaps,
                   tpot=sum(gaps)/len(gaps) if gaps else None,
                   e2e=row["finish"]-row["arrival"] if row["status"] == "completed" else None)
        if row["status"] == "completed" and (row["processed_prompt"] != row["prompt_tokens"]
                                              or row["decode_inputs"] != row["output_target"]-1):
            raise AssertionError("Prompt work or subsequent decode count is inconsistent.")
    return {"scope": "Toy simulation; fictional costs, known output lengths, conservative peak reservation.",
            "cost_seconds": asdict(cost), "budget": budget, "sequence_limit": sequences,
            "blocks": blocks, "block_size_tokens": block_size, "chunked": chunked,
            "records": rows, "iterations": iterations, "events": events,
            "committed_note": "Generated final output is not a subsequently processed KV input; blocks released on completion."}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--budget", type=int, default=4)
    parser.add_argument("--sequences", type=int, default=3)
    parser.add_argument("--blocks", type=int, default=8)
    parser.add_argument("--full-prefill", action="store_true")
    args = parser.parse_args()
    report = simulate(DEFAULT_REQUESTS, args.budget, args.sequences, args.blocks,
                      chunked=not args.full_prefill)
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
