"""Portable offline analysis with train-only geometry and a frozen protocol.

Default main uses a newly constructed eight-row example, never refits old Iris.
Optional CSV input is an explicit new analysis, not a retained-study replay.
"""
import argparse
import csv
from dataclasses import dataclass
import json
import math
from pathlib import Path
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from density_neighbourhoods import Neighbourhoods, positive_count, radius
from density_geometry import ScaleState, fit_standardizer, transform
from dbscan_on_demand import dbscan, core_components, DensityPartition
from density_metrics import Universe, aligned_pair_report, silhouette_report, label_map
from density_query_extensions import frozen_core_query
from density_validity import density_validity


@dataclass(frozen=True)
class Candidate:
    eps: float
    labels: tuple
    core: tuple
    groups: int
    coverage: float
    next_assigned_ari: object
    next_common_coverage: float


@dataclass(frozen=True)
class FrozenRun:
    universe: Universe
    feature_names: tuple
    scaler: ScaleState
    provider: Neighbourhoods
    partition: DensityPartition
    eps: float
    minimum: int
    candidates: tuple
    minimum_retention: float
    minimum_agreement: float


def load_feature_csv(filename, id_column, feature_names, annotation_column=None):
    feature_names = tuple(feature_names)
    if not feature_names or len(set(feature_names)) != len(feature_names):
        raise ValueError("declare ordered distinct feature columns")
    if id_column in feature_names or annotation_column in feature_names:
        raise ValueError("IDs and external annotations must not become features")
    ids, rows, annotations = [], [], {}
    with Path(filename).open(encoding="utf8", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {id_column, *feature_names}
        if annotation_column is not None:
            required.add(annotation_column)
        if not required <= set(reader.fieldnames or ()):
            raise ValueError("CSV is missing a declared ID/feature/annotation column")
        for row in reader:
            identifier = row[id_column]
            if not identifier:
                raise ValueError("CSV observation IDs must be nonempty")
            ids.append(identifier)
            rows.append(tuple(float(row[feature]) for feature in feature_names))
            if annotation_column is not None:
                annotations[identifier] = row[annotation_column]
    return Universe(tuple(ids), tuple(rows)), annotations


def develop_run(universe, feature_names, eps_values, minimum=3,
                minimum_retention=.8, minimum_agreement=1.0):
    feature_names = tuple(feature_names)
    if (not universe.rows or len(feature_names) != len(universe.rows[0])
            or any(type(name) is not str or not name for name in feature_names)
            or len(set(feature_names)) != len(feature_names)):
        raise ValueError("declare one distinct name per feature in a nonempty universe")
    minimum = positive_count(minimum)
    eps_values = tuple(radius(value) for value in eps_values)
    if len(eps_values) < 2 or list(eps_values) != sorted(set(eps_values)):
        raise ValueError("declare at least two increasing distinct positive candidate radii")
    if not 0 < minimum_retention <= 1 or not 0 <= minimum_agreement <= 1:
        raise ValueError("coverage/agreement criteria are outside their declared ranges")
    state = fit_standardizer(universe.rows)  # Only this fit/development universe supplies moments.
    geometry = transform(universe.rows, state)
    provider = Neighbourhoods(tuple(map(tuple, geometry)), universe.ids)
    partitions = tuple(dbscan(provider, eps, minimum) for eps in eps_values)
    maps = tuple(dict(zip(universe.ids, result.labels)) for result in partitions)
    candidates = []
    for position, (eps, result) in enumerate(zip(eps_values, partitions)):
        coverage = sum(label != -1 for label in result.labels) / len(universe.ids)
        groups = len({label for label in result.labels if label != -1})
        comparison = (aligned_pair_report(universe, maps[position], maps[position + 1], "assigned_common")
                      if position + 1 < len(maps) else None)
        candidates.append(Candidate(eps, result.labels, result.core, groups, coverage,
            comparison["ari"] if comparison else None, comparison["coverage"] if comparison else 0.0))
    chosen = next((i for i, candidate in enumerate(candidates)
                   if candidate.groups >= 2 and candidate.coverage >= minimum_retention
                   and candidate.next_common_coverage >= minimum_retention
                   and candidate.next_assigned_ari is not None
                   and candidate.next_assigned_ari >= minimum_agreement), None)
    if chosen is None:
        raise ValueError("NO_CANDIDATE_MEETS_DECLARED_DEVELOPMENT_PROTOCOL")
    return FrozenRun(universe, feature_names, state, provider, partitions[chosen], eps_values[chosen],
                     minimum, tuple(candidates), minimum_retention, minimum_agreement)


def frozen_report(run, external_annotations=None):
    mapping = dict(zip(run.universe.ids, run.partition.labels))
    standardized = Universe(run.provider.ids, run.provider.rows)
    silhouette = silhouette_report(standardized, mapping, "assigned_only")
    validity = density_validity(run.provider, run.partition.labels)
    report = {"ids": run.universe.ids, "features": run.feature_names, "metric": "standardized Euclidean",
              "eps": run.eps, "minimum_including_self": run.minimum,
              "coverage": sum(label != -1 for label in run.partition.labels) / len(run.universe.ids),
              "labels": run.partition.labels, "core": run.partition.core,
              "mean": run.scaler.mean, "scale": run.scaler.scale,
              "assigned_silhouette": silhouette, "dbcv_status": validity.status,
              "dbcv_global": validity.score}
    if external_annotations is not None:
        annotations = label_map(run.universe, external_annotations)
        report["external_all_common"] = aligned_pair_report(run.universe, mapping, annotations, "noise_as_group")
        report["external_assigned_common"] = aligned_pair_report(run.universe, mapping, annotations, "assigned_common")
    return report


def ordinary_pipeline(run):
    model = Pipeline([("geometry", StandardScaler()),
                      ("density", DBSCAN(eps=run.eps, min_samples=run.minimum, algorithm="brute"))])
    model.fit(np.asarray(run.universe.rows))  # Complete ordinary new-analysis route.
    scaled = model.named_steps["geometry"].transform(np.asarray(run.universe.rows))
    np.testing.assert_allclose(scaled, run.provider.rows, rtol=1e-13, atol=1e-13)
    density = model.named_steps["density"]
    flags = [False] * len(run.universe.ids)
    for position in density.core_sample_indices_:
        flags[int(position)] = True
    ordinary = DensityPartition(run.universe.ids, tuple(map(int, density.labels_)), tuple(flags), (), ())
    assert core_components(ordinary) == core_components(run.partition)
    # The default example has no shared-border ambiguity; other inputs compare eligibility explicitly.
    return model, ordinary


def query_run(run, rows):
    values = transform(rows, run.scaler)
    return tuple(frozen_core_query(run.provider, run.partition, row, run.eps) for row in values)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv")
    parser.add_argument("--id-column", default="row_id")
    parser.add_argument("--features", nargs="+")
    parser.add_argument("--annotation")
    parser.add_argument("--eps", nargs="+", type=float, default=[.04, .08, .12])
    parser.add_argument("--minimum", type=int, default=3)
    args = parser.parse_args()
    if args.csv:
        if not args.features:
            parser.error("CSV input requires an explicit ordered --features list")
        names = tuple(args.features)
        universe, annotations = load_feature_csv(args.csv, args.id_column, names, args.annotation)
    else:
        names = ("sensor_x", "sensor_y")
        universe = Universe(tuple("ABCDEFGH"),
            ((0, 0), (0, .2), (.2, 0), (.2, .2), (5, 5), (5, 5.2), (5.2, 5), (5.2, 5.2)))
        annotations = dict(zip(universe.ids, ("left",) * 4 + ("right",) * 4))
    run = develop_run(universe, names, args.eps, args.minimum)
    model, ordinary = ordinary_pipeline(run)
    print("development candidates", [(c.eps, c.groups, c.coverage, c.next_assigned_ari,
                                      c.next_common_coverage) for c in run.candidates])
    print("selected radius", run.eps, "IDs", list(run.universe.ids))
    print("fitted mean", list(run.scaler.mean), "scale", list(run.scaler.scale))
    report = frozen_report(run, annotations if annotations else None)
    print("frozen report", json.dumps(report, sort_keys=True))
    if not args.csv:
        np.testing.assert_array_equal(run.partition.labels, ordinary.labels)
        before = run
        outcomes = query_run(run, ((.1, .1), (2.6, 2.6), (9, 9)))
        print("held-out frozen queries", list(outcomes))
        assert before == run
        # Ordinary DBSCAN has no predict method; only its scaler transforms new rows.
        np.testing.assert_allclose(transform(((.1, .1),), run.scaler),
                                   model.named_steps["geometry"].transform([[.1, .1]]))


if __name__ == "__main__":
    main()
