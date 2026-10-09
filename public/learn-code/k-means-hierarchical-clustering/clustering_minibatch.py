"""Persistent weighted batch history, cached assignments and complete JSON state."""
import json
import numpy as np
from sklearn.cluster import MiniBatchKMeans
from clustering_core import assign_chunked, points_array, weights_array, mean_squared_error


class BatchMeans:
    def __init__(self, centers, masses=None):
        self.centers = points_array(centers).copy()
        self.masses = np.zeros(len(self.centers)) if masses is None else np.asarray(masses, dtype=float).copy()
        if self.masses.shape != (len(self.centers),) or not np.isfinite(self.masses).all() or (self.masses < 0).any():
            raise ValueError("Supply one finite nonnegative remembered mass per center.")

    def update(self, batch, weights=None):
        batch = points_array(batch)
        weights = weights_array(weights, len(batch))
        if batch.shape[1] != self.centers.shape[1]:
            raise ValueError("Batch feature dimension differs from stored centers.")
        # These labels refer to incoming centers, before any group is moved.
        labels, _ = assign_chunked(batch, self.centers)
        before = self.centers.copy()
        future_centers = before.copy()
        future_masses = self.masses.copy()
        for group in range(len(self.centers)):
            members = (labels == group) & (weights > 0)
            added = weights[members].sum()
            if added == 0:
                continue
            total = self.masses[group] + added
            if not np.isfinite(total):
                raise ValueError("Remembered mass exceeds float64 range.")
            with np.errstate(over="ignore", invalid="ignore"):
                change = np.sum((weights[members] / total)[:, None]
                                * (batch[members] - before[group]), axis=0)
                future_centers[group] = before[group] + change
            future_masses[group] = total
        if not np.isfinite(future_centers).all():
            raise ValueError("Updated center is not representable; rescale input.")
        self.centers = future_centers
        self.masses = future_masses
        return labels

    def update_online(self, batch, weights=None):
        # A different policy: each next arrival sees the already moved centers.
        batch = points_array(batch)
        weights = weights_array(weights, len(batch))
        labels = []
        for row, mass in zip(batch, weights):
            if mass > 0:
                labels.append(int(self.update(row[None, :], [mass])[0]))
            else:
                labels.append(int(assign_chunked(row[None, :], self.centers)[0][0]))
        return np.array(labels)

    def forget(self, factor):
        if not np.isfinite(factor) or not 0 <= factor <= 1:
            raise ValueError("Forgetting factor must be in [0,1].")
        self.masses *= factor

    def to_json(self):
        return json.dumps({"schema": 1, "dimension": self.centers.shape[1],
                           "centers": self.centers.tolist(), "masses": self.masses.tolist()})

    @classmethod
    def from_json(cls, source):
        state = json.loads(source)
        if state.get("schema") != 1:
            raise ValueError("Unknown BatchMeans state schema.")
        restored = cls(state["centers"], state["masses"])
        if restored.centers.shape[1] != state["dimension"]:
            raise ValueError("Stored dimension disagrees with center rows.")
        return restored


def main():
    history = BatchMeans([[0.0]])
    for arrival in [0.0, 6.0, 9.0]:
        history.update([[arrival]])
        print("arrival / remembered mass / center:", arrival,
              history.masses.tolist(), history.centers.ravel().tolist())
    batch = np.array([[0.0], [6.0], [9.0], [20.0]])
    weights = np.array([1.0, 1.0, 2.0, 1.0])
    initial = np.array([[0.0], [20.0]])
    scratch = BatchMeans(initial)
    print("cached labels:", scratch.update(batch, weights).tolist())
    ordinary = MiniBatchKMeans(n_clusters=2, init=initial, n_init=1,
                              reassignment_ratio=0, random_state=7, batch_size=4)
    ordinary.partial_fit(batch, sample_weight=weights)
    print("scratch / ordinary centers:", scratch.centers.tolist(), ordinary.cluster_centers_.tolist())
    saved = scratch.to_json()
    reloaded = BatchMeans.from_json(saved)
    print("complete JSON state:", saved)
    print("reload masses / centers:", reloaded.masses.tolist(), reloaded.centers.tolist())
    print("exact retained-batch mean squared error:", mean_squared_error(batch, scratch.centers, weights))
    reversed_state = BatchMeans(initial)
    reversed_state.update(batch[::-1], weights[::-1])
    print("reversed cached batch centers:", reversed_state.centers.tolist())


if __name__ == "__main__":
    main()
