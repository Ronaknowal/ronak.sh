"""Prepare twelve fixed extraction prompts from the original UCI Iris archive.

python prepare_data.py --zip iris.zip --output data.json
Download: https://archive.ics.uci.edu/static/public/53/iris.zip
Iris, UCI Machine Learning Repository, DOI10.24432/C56C76, CC BY4.0.
This is an extraction adaptation, not the original classification benchmark.
"""

import argparse
import csv
from decimal import Decimal
import hashlib
import io
import json
from pathlib import Path
import zipfile

ZIP_SHA256 = "d11fe30213d36434a0879aab7cb00ce3c812eb7ba2495874438abff7b7b762e9"
INDICES = tuple(range(4)) + tuple(range(50, 54)) + tuple(range(100, 104))


def selected_rows(path):
    content = Path(path).read_bytes()
    if hashlib.sha256(content).hexdigest() != ZIP_SHA256:
        raise ValueError("Source archive differs from the recorded UCI bytes")
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        raw = archive.read("iris.data").decode("ascii")
    rows = [row for row in csv.reader(io.StringIO(raw)) if row]
    if len(rows) != 150 or any(len(row) != 5 for row in rows):
        raise ValueError("Expected 150 four-measurement/class rows")
    result = []
    for index in INDICES:
        row = rows[index]
        species = row[4].removeprefix("Iris-")
        measurement = Decimal(row[0])
        if species not in ("setosa", "versicolor", "virginica") or not Decimal(
            "4"
        ) <= measurement <= Decimal("8"):
            raise ValueError("Selected input outside the predeclared domain")
        prompt = (
            "Extract the stated species and sepal length into a JSON object with exactly "
            "the fields species and sepal_cm. Copy the values from the input.\n"
            f"Input: species={species}; sepal length={row[0]} cm.\nJSON:"
        )
        result.append(
            {
                "index": index,
                "source_values": row,
                "prompt": prompt,
                "gold": {"species": species, "sepal_cm": float(measurement)},
            }
        )
    return result


def study_schema():
    # Declared domain, not a per-row answer injected into a grammar.
    return {
        "type": "object",
        "properties": {
            "species": {
                "type": "string",
                "enum": ["setosa", "versicolor", "virginica"],
            },
            "sepal_cm": {"type": "number", "enum": [i / 10 for i in range(40, 81)]},
        },
        "required": ["species", "sepal_cm"],
        "additionalProperties": False,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True)
    parser.add_argument("--output", default="data.json")
    args = parser.parse_args()
    target = Path(args.output)
    with target.open("x", encoding="utf-8") as stream:
        json.dump(
            {
                "source": {
                    "url": "https://archive.ics.uci.edu/static/public/53/iris.zip",
                    "sha256": ZIP_SHA256,
                    "license": "CC BY 4.0",
                    "doi": "10.24432/C56C76",
                },
                "rows": selected_rows(args.zip),
                "schema": study_schema(),
            },
            stream,
            indent=2,
        )
        stream.write("\n")
    print(target)


if __name__ == "__main__":
    main()
