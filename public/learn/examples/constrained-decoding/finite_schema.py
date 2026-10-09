"""Compile a declared subset of JSON Schema to one canonical serialization.

python finite_schema.py
All fields are required, additional fields forbidden, and each field has a
finite string/number enum. Other schema keywords raise an error. Valid JSON
with other key order/whitespace/number spellings can lie outside this language.
"""

import json
import math
from automata import literal, sequence, choice, compile_regular


def compile_finite_schema(schema):
    expected = {"type", "properties", "required", "additionalProperties"}
    if (
        set(schema) != expected
        or schema["type"] != "object"
        or schema["additionalProperties"] is not False
    ):
        raise ValueError(
            "Expected exactly a closed object with properties and required"
        )
    properties, required = schema["properties"], schema["required"]
    if not isinstance(properties, dict) or not properties or len(properties) > 12:
        raise ValueError("Use 1..12 fields")
    if (
        not isinstance(required, list)
        or len(set(required)) != len(required)
        or set(required) != set(properties)
    ):
        raise ValueError("Every field must be required exactly once")
    parts = [literal("{")]
    for position, (key, rule) in enumerate(properties.items()):
        if (
            not isinstance(key, str)
            or set(rule) != {"type", "enum"}
            or rule["type"] not in ("string", "number")
        ):
            raise ValueError("Each string-named field needs exactly type and enum")
        values = rule["enum"]
        if not isinstance(values, list) or not 1 <= len(values) <= 100:
            raise ValueError("Each enum needs 1..100 values")
        serialized = []
        for i, value in enumerate(values):
            valid = (
                isinstance(value, str)
                if rule["type"] == "string"
                else type(value) in (int, float) and math.isfinite(value)
            )
            if not valid or any(value == old for old in values[:i]):
                raise ValueError(
                    "Enum type mismatch, nonfinite number or duplicate value"
                )
            serialized.append(
                json.dumps(
                    value, ensure_ascii=False, allow_nan=False, separators=(",", ":")
                )
            )
        if position:
            parts.append(literal(","))
        parts.extend(
            [
                literal(json.dumps(key, ensure_ascii=False) + ":"),
                choice(*(literal(s) for s in serialized)),
            ]
        )
    parts.append(literal("}"))
    # Alternatives rejoin at each field; no Cartesian list of complete records.
    return compile_regular(sequence(*parts))


def example_schema():
    return {
        "type": "object",
        "properties": {
            "species": {
                "type": "string",
                "enum": ["setosa", "versicolor", "virginica"],
            },
            "sepal_cm": {"type": "number", "enum": [4.9, 5.1, 6.3]},
        },
        "required": ["species", "sepal_cm"],
        "additionalProperties": False,
    }


def main():
    dfa = compile_finite_schema(example_schema())
    examples = [
        '{"species":"setosa","sepal_cm":5.1}',
        '{"species":"other","sepal_cm":5.1}',
        '{"sepal_cm":5.1,"species":"setosa"}',
    ]
    print(
        json.dumps(
            {
                "states": len(dfa.subsets),
                "results": [
                    {"text": s, "accepted_serialization": dfa.accepts(s.encode())}
                    for s in examples
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
