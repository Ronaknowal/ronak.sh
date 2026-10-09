"""Hugging Face Dataset transform, using the same local measurements."""
import json
from pathlib import Path

from datasets import load_dataset


def main():
    dataset = load_dataset("csv", data_files=str(Path(__file__).with_name("iris.csv")), split="train")
    train = dataset.filter(lambda row: row["row_id"] % 5 != 0)
    valid = dataset.filter(lambda row: row["row_id"] % 5 == 0)
    transformed = train.map(lambda row: {"sepal_area_cm2": row["sepal_length_cm"] * row["sepal_width_cm"]})
    assert len(transformed) == 120 and len(valid) == 30
    assert set(train["row_id"]).isdisjoint(valid["row_id"])
    print(json.dumps({"train_rows": len(transformed), "validation_rows": len(valid),
                      "first_row_id": transformed[0]["row_id"],
                      "first_sepal_area_cm2": transformed[0]["sepal_area_cm2"]}, indent=2))


if __name__ == "__main__":
    main()
