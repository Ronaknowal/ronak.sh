"""Evaluate saved extraction outputs independently of the generation backend.

python evaluate.py --data data.json --records study --output evaluation.json
Requires jsonschema. Reads completed rows only; makes no model calls.
"""

import argparse
import json
from pathlib import Path
from jsonschema import Draft202012Validator


def strict_json(text):
    def pairs(entries):
        result = {}
        for key, value in entries:
            if key in result:
                raise ValueError("Duplicate object key")
            result[key] = value
        return result

    def constant(value):
        raise ValueError(f"Non-JSON numeric constant: {value}")

    return json.loads(text, object_pairs_hook=pairs, parse_constant=constant)


def assess(text, schema, gold):
    try:
        value = strict_json(text)
    except (ValueError, TypeError) as exc:
        return {"parse": False, "schema": False, "exact": False, "reason": str(exc)}
    errors = list(Draft202012Validator(schema).iter_errors(value))
    return {
        "parse": True,
        "schema": not errors,
        "exact": not errors and value == gold,
        "reason": (
            errors[0].message
            if errors
            else (
                "Fields equal source"
                if value == gold
                else "Valid structure; values differ from source"
            )
        ),
    }


def evaluate(data, records):
    gold = {r["index"]: r["gold"] for r in data["rows"]}
    rows = []
    for record in records:
        row = {
            k: record.get(k)
            for k in [
                "index",
                "arm",
                "status",
                "generated_ids",
                "text",
                "seconds",
                "error",
                "completed",
                "terminated",
            ]
        }
        row.update(
            assess(record.get("text", ""), data["schema"], gold[record["index"]])
        )
        rows.append(row)
    summary = []
    for arm in dict.fromkeys(r["arm"] for r in rows):
        subset = [r for r in rows if r["arm"] == arm]
        summary.append(
            {
                "arm": arm,
                "n": len(subset),
                **{
                    key: sum(bool(r[key]) for r in subset)
                    for key in ["parse", "schema", "exact"]
                },
                "errors": sum(r["status"] == "error" for r in subset),
                "capped": sum(r["status"] == "cap" for r in subset),
            }
        )
    return {
        "rows": rows,
        "summary": summary,
        "policy": "Strict JSON syntax, duplicate keys rejected, full selected schema, then exact copied fields. Errors remain in denominators.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument("--records", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    data = json.loads(Path(args.data).read_text(encoding="utf-8"))
    records = [
        json.loads(p.read_text(encoding="utf-8"))
        for p in sorted(Path(args.records).glob("row-*.json"))
        if ".started." not in p.name
    ]
    result = evaluate(data, records)
    with Path(args.output).open("x", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(json.dumps(result["summary"], indent=2))


if __name__ == "__main__":
    main()
