"""N8: standard-library reader of retained evidence; never refits the recording."""
import csv
import hashlib
import json
import math
from pathlib import Path


def finite_tree(value):
    if isinstance(value, dict):
        return all(finite_tree(v) for v in value.values())
    if isinstance(value, list):
        return all(finite_tree(v) for v in value)
    return not isinstance(value, (int, float)) or math.isfinite(value)


def calibrate(count):
    return (count + 32768) * 6553.6 / 65535 - 3276.8


def main():
    here = Path(__file__).resolve().parent
    retained = json.loads((here / "ica_retained_record.json").read_text(encoding="utf-8"))
    if not finite_tree(retained):
        raise ValueError("Retained numerical evidence must be finite")
    payload = (here / "r01-first20s.csv").read_bytes()
    if hashlib.sha256(payload).hexdigest() != retained["sha256"]:
        raise ValueError("CSV identity differs from the retained source")
    with (here / "r01-first20s.csv").open(encoding="utf-8", newline="") as stream:
        reader = csv.DictReader(stream)
        headers = reader.fieldnames
        rows = list(reader)
    if len(rows) != retained["samples"]:
        raise ValueError("Unexpected retained row count")
    for row in rows:
        if not all(math.isfinite(float(v)) for v in row.values()):
            raise ValueError("CSV contains nonfinite values")
    print("headers", headers, "rows", len(rows), "sampling_Hz", retained["samplingHz"], "split", retained["split"])
    for index in [0, 16000]:
        counts = [float(rows[index][name]) for name in retained["channels"]]
        print("sample", index, "five_counts", counts, "microvolts", [round(calibrate(v), 6) for v in counts])
    for result in retained["results"]:
        print("retained", result["method"], "all_development_signed", result["development"],
              "chosen_one_based", result["chosen"], "test_signed", result["testSigned"])
        print("other_later_coordinates", None)
    trace = retained["trace"]
    for name, envelope in trace["series"].items():
        if len(envelope) != trace["columns"] or any(len(pair) != 2 or pair[0] > pair[1] for pair in envelope):
            raise ValueError("Invalid min/max envelope")
        print("trace", name, "columns", len(envelope), "first_min_max", envelope[0])
    if len(retained["window"]) != 20:
        raise ValueError("Expected the separate twenty-row exact window")
    print("exact_window", retained["window"])
    print("envelope_scale", "interval_z_score", "polarity", "development_aligned")
    print("fitted_operator_arrays", None)
    print("retained_limit_count", len(retained["limits"]))


if __name__ == "__main__":
    main()
