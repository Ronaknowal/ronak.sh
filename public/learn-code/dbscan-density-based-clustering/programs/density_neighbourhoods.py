"""Closed, self-inclusive neighbourhoods with immutable rows and stable IDs.

Run: python density_neighbourhoods.py
The scratch provider stores no all-pairs matrix. Ordinary NearestNeighbors
queries receive an explicit query matrix, so self is present exactly once.
"""
from dataclasses import dataclass
import math


def positive_count(value, name="minimum count"):
    if type(value) is not int or value < 1:
        raise ValueError(f"{name} must be a positive integer")
    return value


def radius(value, allow_infinity=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("radius must be a positive number")
    value = float(value)
    if value <= 0 or math.isnan(value) or (math.isinf(value) and not allow_infinity):
        raise ValueError("radius must be positive and finite")
    return value


def haversine_radians(a, b):
    """Angular length; rows are (latitude, longitude), both in radians."""
    latitude_a, longitude_a = a
    latitude_b, longitude_b = b
    delta_latitude = latitude_b - latitude_a
    delta_longitude = longitude_b - longitude_a
    half_chord_squared = (
        math.sin(delta_latitude / 2) ** 2
        + math.cos(latitude_a) * math.cos(latitude_b)
        * math.sin(delta_longitude / 2) ** 2
    )
    # Roundoff near antipodal/polar endpoints must not escape [0,1].
    return 2 * math.asin(math.sqrt(min(1.0, max(0.0, half_chord_squared))))


@dataclass(frozen=True)
class Neighbourhoods:
    rows: tuple
    ids: tuple
    metric: str = "euclidean"

    def __post_init__(self):
        rows = tuple(tuple(float(x) for x in row) for row in self.rows)
        ids = tuple(self.ids)
        if not rows or not rows[0] or any(len(row) != len(rows[0]) for row in rows):
            raise ValueError("rows must be a nonempty rectangular feature table")
        if any(not math.isfinite(x) for row in rows for x in row):
            raise ValueError("features must be finite")
        if len(ids) != len(rows) or any(type(i) not in (int, str) for i in ids):
            raise ValueError("supply one integer or string ID per row, never bool")
        if len(set(ids)) != len(ids):
            raise ValueError("row IDs must be unique")
        if self.metric not in ("euclidean", "haversine"):
            raise ValueError("metric must be euclidean or haversine")
        if self.metric == "haversine":
            if len(rows[0]) != 2:
                raise ValueError("haversine rows need latitude and longitude")
            if any(abs(lat) > math.pi / 2 or abs(lon) > math.pi for lat, lon in rows):
                raise ValueError("haversine coordinates must be valid radians")
        object.__setattr__(self, "rows", rows)
        object.__setattr__(self, "ids", ids)

    def position(self, i):
        if type(i) is not int or not 0 <= i < len(self.rows):
            raise ValueError("query position is outside the feature table")
        return i

    def distance(self, i, j):
        a, b = self.rows[self.position(i)], self.rows[self.position(j)]
        value = math.dist(a, b) if self.metric == "euclidean" else haversine_radians(a, b)
        if not math.isfinite(value):
            raise ValueError("distance exceeds finite floating-point range")
        return value

    def neighbours(self, i, eps):
        self.position(i)
        eps = radius(eps, allow_infinity=True)
        # Position order is deterministic, including tied/duplicate observations.
        roster = []
        for j in range(len(self.rows)):
            distance = self.distance(i, j)
            if distance <= eps:
                roster.append((j, distance))
        return roster

    def core_radius(self, i, minimum, cap=math.inf):
        self.position(i)
        minimum = positive_count(minimum)
        cap = radius(cap, allow_infinity=True)
        if minimum > len(self.rows):
            return math.inf
        ranked = sorted((self.distance(i, j), j) for j in range(len(self.rows)))
        value = ranked[minimum - 1][0]
        return value if value <= cap else math.inf

    def selected_core_radius(self, i, minimum, cap=math.inf):
        """Ordinary array selection finds a rank; it does not sort a roster."""
        import numpy as np
        self.position(i)
        minimum = positive_count(minimum)
        cap = radius(cap, allow_infinity=True)
        if minimum > len(self.rows):
            return math.inf
        distances = np.fromiter((self.distance(i, j) for j in range(len(self.rows))), float)
        value = float(np.partition(distances, minimum - 1)[minimum - 1])
        return value if value <= cap else math.inf


def library_rosters(provider, eps):
    """Explicit-query exact closed rosters; output remains position ordered."""
    import numpy as np
    from sklearn.neighbors import NearestNeighbors
    eps = radius(eps)
    rows = np.asarray(provider.rows)
    model = NearestNeighbors(radius=eps, metric=provider.metric, algorithm="brute").fit(rows)
    # X=None would exclude self: the explicit rows below deliberately include it.
    distances, positions = model.radius_neighbors(rows, return_distance=True)
    return [sorted(zip(map(int, js), map(float, ds))) for js, ds in zip(positions, distances)]


def main():
    provider = Neighbourhoods(((0, 0), (0.5, 0), (1, 0), (1, 0), (3, 0)),
                             ("A", "B", "C", "D", "E"))
    eps, minimum = 0.5, 3
    rosters = [provider.neighbours(i, eps) for i in range(len(provider.rows))]
    ordinary = library_rosters(provider, eps)
    assert [[j for j, _ in r] for r in rosters] == [[j for j, _ in r] for r in ordinary]
    print("radius", eps, "minimum including self", minimum)
    for i, roster in enumerate(rosters):
        core = provider.core_radius(i, minimum)
        assert core == provider.selected_core_radius(i, minimum)
        print(provider.ids[i], "roster", [provider.ids[j] for j, _ in roster],
              "count", len(roster), "core radius", core)
    earth_km = 6371.0088
    places = Neighbourhoods(((0, math.radians(179)), (0, math.radians(-179))),
                            ("east", "west"), "haversine")
    print("dateline angular radians", places.distance(0, 1))
    print("dateline kilometres", earth_km * places.distance(0, 1))


if __name__ == "__main__":
    main()
