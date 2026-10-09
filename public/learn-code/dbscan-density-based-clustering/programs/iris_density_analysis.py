"""Read the offline Iris rows and retained fits without refitting them.

Keep iris.csv and recorded_iris_fits.json beside this file. The original full
ordinary-library fit remains in dbscan_iris.py; this route interprets its saved
and supplementary recorded results, retaining each row's population identity.
"""
import csv
import hashlib
import json
import math
from pathlib import Path

FEATURES = ("sepal_length_cm", "sepal_width_cm", "petal_length_cm", "petal_width_cm")
HEADER = ("row_id",) + FEATURES + ("species",)


def load_iris(directory):
    filename = Path(directory) / "iris.csv"
    rows = []
    with filename.open(encoding="utf8", newline="") as handle:
        reader = csv.DictReader(handle)
        if tuple(reader.fieldnames or ()) != HEADER:
            raise ValueError("Iris column names/order must match the supplied file")
        for row in reader:
            row_id, species = int(row["row_id"]), int(row["species"])
            features = tuple(float(row[name]) for name in FEATURES)
            if species not in (0, 1, 2) or any(not math.isfinite(x) for x in features):
                raise ValueError("invalid Iris features or species annotation")
            rows.append((row_id, features, species))
    if [row_id for row_id, _, _ in rows] != list(range(150)):
        raise ValueError("supplied Iris IDs must be 0..149 in retained order")
    return tuple(rows)


def read_recorded_fits(directory, rows):
    directory = Path(directory)
    snapshot = json.loads((directory / "recorded_iris_fits.json").read_text(encoding="utf8"))
    normalized_csv = (directory / "iris.csv").read_bytes().replace(b"\r\n", b"\n")
    if hashlib.sha256(normalized_csv).hexdigest() != snapshot["csv_lf_sha256"]:
        raise ValueError("CSV values/order differ from the retained fitting input")
    ids = tuple(row_id for row_id, _, _ in rows)
    if tuple(snapshot["ids"]) != ids:
        raise ValueError("fit record IDs do not align with observation IDs")
    for fit in snapshot["fits"]:
        labels = fit["labels"]
        if len(labels) != len(ids) or any(type(x) is not int or x < -1 for x in labels):
            raise ValueError("recorded labels must align and use -1 for noise")
        core, border, noise = map(set, (fit["core_ids"], fit["border_ids"], fit["noise_ids"]))
        if any(core & other for other in (border, noise)) or border & noise:
            raise ValueError("recorded roles must be disjoint")
        if core | border | noise != set(ids):
            raise ValueError("recorded roles must cover the complete universe")
        if noise != {ids[i] for i, label in enumerate(labels) if label == -1}:
            raise ValueError("recorded noise IDs disagree with recorded labels")
    return snapshot


def observed_row(rows, fit, row_id):
    if type(row_id) is not int or not 0 <= row_id < len(rows):
        raise ValueError("row ID is outside this fixed offline dataset")
    stored_id, features, species = rows[row_id]
    if stored_id != row_id:
        raise ValueError("dataset order no longer matches its fixed ID contract")
    role = "core" if row_id in fit["core_ids"] else "border" if row_id in fit["border_ids"] else "noise"
    return {"id": row_id, "features_cm": features, "species_annotation": species,
            "recorded_label": fit["labels"][row_id], "recorded_role": role}


def main():
    directory = Path(__file__).resolve().parent
    rows = load_iris(directory)
    snapshot = read_recorded_fits(directory, rows)
    print("Recorded fitting environment", snapshot["versions"])
    print("representation eps minimum groups core border noise coverage silhouette_assigned ARI_all ARI_assigned")
    for fit in snapshot["fits"]:
        print(fit["representation"], fit["eps"], fit["min_samples"], fit["clusters"],
              len(fit["core_ids"]), len(fit["border_ids"]), len(fit["noise_ids"]),
              f'{fit["coverage"]:.6f}', f'{fit["silhouette_assigned"]:.6f}',
              f'{fit["ari_all_rows_noise_is_one_label"]:.6f}', f'{fit["ari_assigned"]:.6f}')
    print("Row0 in recorded standardized eps.5/minimum5 fit", observed_row(rows, snapshot["fits"][2], 0))


if __name__ == "__main__":
    main()
