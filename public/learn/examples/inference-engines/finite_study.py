"""One bounded deterministic study; no model/server/network or timing benchmark."""
import argparse
import copy
from dataclasses import asdict
import json
import math
from pathlib import Path
import traceback

from request_contract import Request, requests_by_id
from capacity_accounting import reservation, device_budget
from engine_lifecycle import Engine, ScriptedRunner
from packed_requests import pack, numpy_reference, scatter_last
from sse_records import parse_chunks, native_record
from request_metrics import RequestTrace, SLO, request_metrics, cohort_metrics
from engine_requirements import select_candidates, validate_manifest
from compare_traces import compare_runs


def refused(operation):
    try:
        operation()
    except (ValueError, TypeError, UnicodeError) as error:
        return {"refused": True, "type": type(error).__name__, "message": str(error)}
    return {"refused": False}


def lifecycle(jobs, pages=6, cancel=None, failure=None):
    engine = Engine(jobs, ScriptedRunner({"A": [21, 22, 0], "B": [31, 0]}, failure), pages)
    try:
        engine.run(cancel)
        error = None
    except Exception as caught:
        error = {"type": type(caught).__name__, "message": str(caught)}
    return {"events": engine.events, "free_pages": engine.free_pages, "error": error,
            "states": {key: {"phase": state.phase, "outputs": state.outputs,
                              "pages": state.pages, "cached_rows": state.cache_rows}
                       for key, state in engine.states.items()}}


def emits(result, name):
    return [(row["time"], row["token"]) for row in result["events"]
            if row["request"] == name and row["event"] == "emit"]


def terminal_count(result, name):
    return sum(row["request"] == name and row["event"] == "terminal" for row in result["events"])


def comparison_fixture():
    import hashlib
    prompt = "supplied fixture"
    workload = [{"request_id": key, "prompt": prompt,
                 "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
                 "prompt_ids": [11, 12], "cap": 2, "arrival_offset_s": 0.0} for key in ["A", "B"]]
    common = {"model_sha256": "0" * 64, "tokenizer_sha256": "1" * 64,
              "precision": "synthetic; no model", "sampler": "supplied",
              "cache_policy": "cold", "load_policy": "fixed simultaneous arrivals",
              "quality_rule": "supplied true", "metric_semantics": "local elapsed content and terminal",
              "stop_policy": "supplied", "workload": workload}
    return {"manifest": common, "treatment": {"name": "left", "runtime_sha256": "2" * 64, "configuration": {}},
            "window": {"start": 0, "end": 2, "cutoff": 2},
            "slo": {"first_output_s": .5, "terminal_s": 1},
            "traces": [asdict(RequestTrace("A", "fixture", 0, 0, 0, (.2, .4), None, .5, "completed", True)),
                       asdict(RequestTrace("B", "fixture", 0, terminal=0, outcome="rejected"))]}


def run(output, source_root=None):
    directory = Path(output)
    directory.mkdir(parents=True, exist_ok=False)
    results = []
    report = {"status": "started", "scope": "deterministic finite algorithms and supplied records; no native/model calls", "cases": results}
    with (directory / "events.jsonl").open("x", encoding="utf8") as log:
        def journal(value):
            log.write(json.dumps(value, ensure_ascii=False, allow_nan=False) + "\n")
            log.flush()

        def observe(name, inputs, operation, predicate):
            journal({"event": "start", "name": name, "inputs": inputs})
            result = operation()
            journal({"event": "result-before-independent-check", "name": name, "result": result})
            passed = bool(predicate(result))
            results.append({"name": name, "inputs": inputs, "result": result, "passed": passed})
            if not passed:
                raise AssertionError(name)

        try:
            for cap in [0, -1, True, 1.5]:
                observe(f"invalid-cap-{cap}", {"cap": cap}, lambda cap=cap: refused(lambda: Request("A", (1,), cap)), lambda row: row["refused"])
            observe("empty-prompt", {}, lambda: refused(lambda: Request("A", (), 1)), lambda row: row["refused"])
            observe("duplicate-ID", {}, lambda: refused(lambda: requests_by_id([Request("A", (1,), 1)] * 2)), lambda row: row["refused"])
            observe("reservation-anchor", {"P": 3, "G": 3, "page": 2}, lambda: reservation(3, 3, 2), lambda row: row == {"max_cached_rows": 5, "pages": 3, "reserved_rows": 6, "max_length_slack": 1})
            observe("byte-budget", {"total": 8192, "weights": 2048, "workspace": 1024, "reserve": 1024}, lambda: device_budget(8192, 2048, 1024, 1024, 2, 2, 4, 4, 4), lambda row: row["bytes_per_page"] == 512 and row["whole_pages"] == 8)
            jobs = [Request("A", (11, 12, 13), 3), Request("B", (11, 12, 14, 15), 2, 1)]
            for pages, expected in [(5, [(3., 31), (4., 0)]), (6, [(1., 31), (2., 0)])]:
                observe(f"engine-pool-{pages}", {"jobs": [asdict(job) for job in jobs]}, lambda pages=pages: lifecycle(jobs, pages),
                        lambda row, pages=pages, expected=expected: row["error"] is None and row["free_pages"] == pages and emits(row, "A") == [(0., 21), (1., 22), (2., 0)] and emits(row, "B") == expected and terminal_count(row, "A") == terminal_count(row, "B") == 1)
            observe("cancel-at-safe-point", {"A_cancel": 1}, lambda: lifecycle(jobs, 5, {"A": 1}), lambda row: row["states"]["A"]["phase"] == "canceled" and emits(row, "A") == [(0., 21)] and emits(row, "B") == [(1., 31), (2., 0)] and row["free_pages"] == 5)
            observe("late-cancel-idempotence", {"A_cancel": 3}, lambda: lifecycle(jobs, 5, {"A": 3}), lambda row: row["states"]["A"]["phase"] == "eos" and terminal_count(row, "A") == 1 and row["free_pages"] == 5)
            expiring = [jobs[0], Request("B", jobs[1].prompt, 2, 1, 2)]
            observe("queued-deadline", {"B_deadline": 2}, lambda: lifecycle(expiring, 3), lambda row: row["states"]["B"]["phase"] == "deadline" and emits(row, "B") == [] and row["free_pages"] == 3)
            oversized = [Request("huge", tuple(range(10)), 4), Request("B", (11,), 2)]
            observe("oversize-progress", {"required_pages": 7, "available": 6}, lambda: lifecycle(oversized), lambda row: row["states"]["huge"]["phase"] == "rejected" and len(emits(row, "B")) == 2 and row["free_pages"] == 6)
            observe("runner-error-release", {"failure": ["A", 1]}, lambda: lifecycle(jobs, 6, failure=("A", 1)), lambda row: row["states"]["A"]["phase"] == "error" and terminal_count(row, "A") == 1 and row["free_pages"] == 6)
            def packed_case():
                actual = pack(jobs)
                reference = numpy_reference(jobs)
                return {"actual": actual, "reference": reference,
                        "scatter": scatter_last(actual, [[i, -i] for i in range(7)]),
                        "permuted": pack(jobs[::-1])}
            observe("packed-boundaries", {"lengths": [3, 4]}, packed_case, lambda row: row["actual"]["offsets"] == [0, 3, 7] and all(row["actual"][key] == value for key, value in row["reference"].items()) and row["scatter"] == {"A": [2, -2], "B": [6, -6]} and row["permuted"]["last_rows"] == {"B": 3, "A": 6})
            fixtures = [
                (b'\xef\xbb\xbf:comment\r\ndata: {"content":"\xc3\xa9"}\r\n\r\ndata: {"stop":true}\n\n', ['{"content":"é"}', '{"stop":true}']),
                (b'data: first\rdata: second\r\r', ['first\nsecond']),
                (b'data:\n\n:comment\n\ndata: x\n\n', ['', 'x']),
            ]
            for index, (wire, expected) in enumerate(fixtures):
                for split in range(len(wire) + 1):
                    observe(f"SSE-{index}-split-{split}", {"wire_hex": wire.hex(), "split": split}, lambda wire=wire, split=split: parse_chunks([wire[:split], wire[split:]]), lambda row, expected=expected: row == (expected, False))
            observe("SSE-partial-EOF", {}, lambda: parse_chunks([b'data: {"stop":true}']), lambda row: row == ([], True))
            observe("SSE-invalid-UTF8", {}, lambda: refused(lambda: parse_chunks([b'data: \xff\n\n'])), lambda row: row["refused"])
            observe("SSE-incomplete-UTF8", {}, lambda: refused(lambda: parse_chunks([b'data: \xc3'])), lambda row: row["refused"])
            observe("native-malformed-JSON", {}, lambda: refused(lambda: native_record('[DONE]')), lambda row: row["refused"])
            a = RequestTrace("A", "fixture", 0, .05, .1, (.3, .5, .7), (.3, .5, .7), .8, "completed", True)
            b = RequestTrace("B", "fixture", .1, .15, .2, (.9,), None, 1, "completed", True)
            c = RequestTrace("C", "fixture", .2, terminal=.2, outcome="rejected")
            d = RequestTrace("D", "fixture", .3, .31, .35, terminal=.45, outcome="canceled")
            observe("clock-endpoints", asdict(a), lambda: request_metrics(a), lambda row: math.isclose(row["token_ttft_s"], .3) and math.isclose(row["token_tpot_s"], .2) and math.isclose(row["terminal_latency_s"], .8))
            observe("all-offered-denominator", {}, lambda: cohort_metrics([a, b, c, d], 0, 2, 2, SLO(.5, 1)), lambda row: (row["offered"], row["completed"], row["good"]) == (4, 2, 1) and row["offered_success_fraction"] == .25 and row["arrival_cohort_goodput_requests_per_s"] == .5)
            observe("cutoff-censoring", {"cutoff": .4}, lambda: request_metrics(a, .4), lambda row: row["observed_outcome"] == "censored" and row["terminal_latency_s"] is None and row["tokens_observed"] == 1 and row["token_tpot_s"] is None)
            observe("unknown-token-mapping", {}, lambda: request_metrics(b), lambda row: row["token_ttft_s"] is None and row["token_tpot_s"] is None and math.isclose(row["first_content_latency_s"], .8))
            observe("empty-cohort", {}, lambda: cohort_metrics([], 0, 2, 2, SLO(.5, 1)), lambda row: row["offered_success_fraction"] is None and row["arrival_cohort_goodput_requests_per_s"] == 0)
            manifest = json.loads(Path(__file__).with_name("engine-evidence.json").read_text(encoding="utf8"))
            observe("evidence-identity", {}, lambda: validate_manifest(manifest, source_root), lambda row: row["verification"] == ("local bytes checked" if source_root is not None else "pin metadata only"))
            observe("joint-route-unknown", {}, lambda: select_candidates(manifest, {"route.windows_cpu_pythia14m_f16_observed": True}), lambda row: row["eligible"] == [] and len(row["unknown"]) == 6)
            observe("documented-removal", {}, lambda: select_candidates(manifest, {"backend.tensorrt_available": True}), lambda row: "tensorrt-llm" in row["excluded"] and "vllm" in row["unknown"])
            left = comparison_fixture()
            right = copy.deepcopy(left)
            right["treatment"]["name"] = "right"
            right["traces"][0]["terminal"] = .6
            observe("matched-pair", {}, lambda: compare_runs(left, right), lambda row: row["comparable"] and row["left_cohort"]["offered"] == 2 and row["completed_pair_count"] == 1 and math.isclose(row["mean_terminal_delta_s_completed_pairs_only"], .1))
            changed = copy.deepcopy(right)
            changed["manifest"]["cache_policy"] = "warm"
            observe("cache-confound", {}, lambda: compare_runs(left, changed), lambda row: not row["comparable"] and "cache_policy" in row["audit"]["held_fields_differ"])
            missing = copy.deepcopy(right)
            missing["traces"].pop()
            observe("missing-offered-receipt", {}, lambda: compare_runs(left, missing), lambda row: not row["comparable"] and row["audit"]["missing_receipts"]["right"] == ["B"])
            report["status"] = "passed"
        except Exception as error:
            report["status"] = "failed"
            report["error"] = {"type": type(error).__name__, "message": str(error), "traceback": traceback.format_exc()}
            journal({"event": "failure", "error": report["error"]})
        finally:
            (directory / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--source-root", type=Path)
    args = parser.parse_args()
    result = run(args.output, args.source_root)
    print(json.dumps({"status": result["status"], "cases": len(result["cases"])}))
    raise SystemExit(0 if result["status"] == "passed" else 1)
