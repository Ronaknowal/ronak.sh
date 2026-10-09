# t-SNE, UMAP & Manifold Learning: build a map, then ask what it preserved

You have 300 small pictures of handwritten digits. A person can compare two pictures; a computer can compare their 64 recorded cells. We want a two-coordinate map that helps us inspect this collection. A useful map keeps some relationships visible. Understanding which relationships it tries to keep is the difference between using it to explore and reading a story into an attractive scatterplot.

The names describe two constructions: t-SNE is t-distributed stochastic neighbor embedding, and UMAP is uniform manifold approximation and projection. We will build their neighborhood objects before using the names to interpret a map.

By the end, you can trace a neighbor graph, calculate t-SNE affinities and one force step, build UMAP's local memberships, explain its sampled updates, audit actual saved digit maps, and choose a route for future observations. The deeper sections implement distance, reconstruction, graph and tangent alternatives, then connect their objectives to research on sampling.

Read [principal component analysis (PCA): rotate the ruler, then keep its readings](/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#4-fit-once-project-and-reconstruct-in-python) first for centering, coordinates and fitting a reusable projection. We refresh each new probability and graph operation here. [Clustering evaluation](/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#4-a-score-evaluates-a-geometry-as-well-as-a-partition) helps when the later question becomes whether a proposed grouping is stable or useful; a map by itself supplies no group assignments.

On a first pass, follow the pictures and worked operations in §§1–8, attempt a few tasks in §11, and finish with §13. The complete code is beside the mechanism it implements; you can inspect its inputs and output before reading every loop. Return to the visible deeper sections 9–10 for distance reconstruction, local recipes, spectral methods, tangent patches and the force derivation. These sections answer different preservation questions rather than introducing a single winning method. [Setup and complete files](setup-and-files.md) distinguish the deterministic examples from optional library fits; all measurements and saved maps are supplied for offline inspection.

## 1. Follow one picture from recorded cells to a map

<!-- figure D01 -->

The picture at source row 30 is a zero. Its eight rows and eight columns contain block counts from 0 to 16. These are downsampled optical measurements, not 64 categorical symbols. Count across the top row: cell 0 is 0, cell 2 is 10 and cell 3 is 14. Flattening puts cell 2 in feature column 2; it does not move the original source identity. Dividing every count by 16 gives feature values0, .625 and .875 respectively. The record now has 64 comparable numbers, while its ID stays30.

Stacking 300 records makes $X\in\mathbb R^{300\times64}$. A two-dimensional embedding makes $Y\in\mathbb R^{300\times2}$. Row $i$ means the same observation in both arrays. Feature index $a$ and map coordinate index $b$ mean different things: the two map axes are not two selected image cells. We use $n$ for observations, $D$ for input features and $q$ for map coordinates. Here $n=300,D=64,q=2$.

The data come from the UCI optical digit recognition collection, distributed in scikit-learn's `load_digits`. Our offline CSV takes the first 30 original rows of each digit class and retains their original IDs. Thus source306 can be in this 300-row subset; ID306 does not mean array position306. Class labels select this balanced inspection collection and can colour the finished plot. They are not fitted inputs to the unsupervised maps below. The [dataset description](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html) and supplied `data-provenance.md` describe the measurements and selection.

<!-- figure D02 -->

The two strips follow source30. The first contains its ten nearest images under Euclidean distance in all 64 normalized features. The second contains the ten nearest images in the saved PCA map. The printed IDs, not resemblance of the colours, join these two strips. Their common records are 0,79,166,229,266 and276: six of ten. Four original neighbors disappear, and four replacements arrive. A scatterplot can look coherent while changing this local answer.

Input distance is $d_{ij}=\sqrt{\sum_{a=1}^D(X_{ia}-X_{ja})^2}$; map distance is $r_{ij}=\sqrt{\sum_{b=1}^q(Y_{ib}-Y_{jb})^2}$. Dividing every feature by the same16 scales all $d_{ij}$ equally and leaves their ordering unchanged. Per-feature standardization, or PCA whitening, can change the ordering: those choices change what “similar” means. We keep the stated pixel metric throughout this comparison.

<!-- figure D03 -->

PCA uses fixed perpendicular rulers through the centered cloud. A point's score is its projection on a ruler, and the projection foot shows what was discarded. Keeping two rulers is a linear operation: the same matrix acts on every row. A nonlinear neighbor map instead chooses coordinates jointly so that selected relationships remain easy to see. It need not have a single ruler, an interpretable axis, or an inverse that reconstructs an image. This is the reason to inspect the relationships directly.

The [PCA scaling section](/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#5-scaling-changes-which-differences-matter) and [KMeans geometry section](/learn/path/full-curriculum/k-means-hierarchical-clustering?module=classical-ml#2-make-the-geometry-explicit) explain why a ruler belongs to the question. In [PCA's whitening branch](/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml#10-deeper-branches), retained score coordinate $z_a$ is divided by $\sqrt{\lambda_a}$, its positive standard-deviation scale. Consequently squared distance becomes $\sum_a(\Delta z_a)^2/\lambda_a$: low-variance directions receive more weight. With eigenvalues(9,1), differences(2,0) and(0,1) have ordinary lengths 2 and1, but whitened lengths 2/3 and1. The nearest choice switches. Discard a zero-eigenvalue direction or declare a regularization rule before dividing; do not silently divide by zero. Our saved maps keep the original stated pixel ruler.

Download `digits-300.csv` and `calculated-inputs.json` together. The JSON holds ten full-precision maps, source IDs, software context and the CSV hash. `load_saved` below checks that hash and joins every coordinate by source ID. It refuses a mismatched collection rather than pairing unrelated rows. We will open its distance/rank work in §3; the same complete file also powers the later saved-map investigation.

## 2. A short route can be long on the surface

<!-- figure D04 -->

Imagine measurements on a rolled sheet. The surface has two directions locally, although it sits in three-dimensional space. A small tangent patch is nearly flat. Two points on separate turns may be close through empty air and far along the sheet. A manifold model assumes local neighborhoods are sampled densely enough to reveal those surface relationships. It does not establish that every high-dimensional dataset has a smooth low-dimensional surface. Noise, branches, boundaries and undersampling can defeat that assumption.

<!-- figure D05 -->

We can trace this problem without a three-dimensional optimizer. Put seven vertices on a U: A(0,0), B(0,1), C(0,2), D(1,2), E(2,2), F(2,1), G(2,0). At radius 1, join points whose input distance is at most1 and label each edge with that distance. A to G is 2 through the air, but the graph route A–B–C–D–E–F–G has six unit edges.

The frontier begins at A with distance 0; all other tentative distances are infinity. Relaxing A–B replaces B's infinity by 1. Processing B similarly gives C2, then D3, E4, F5 and G6. Relaxation means replacing a known distance by a shorter candidate: $s_j\leftarrow\min(s_j,s_i+d_{ij})$. With nonnegative edge lengths, Dijkstra can settle the smallest unsettled distance. The all-pairs implementation below uses the same principle with each vertex as a possible intermediate.

<!-- figure D06 -->

Changing the radius changes the graph before any embedding happens. At .75, no unit edges exist, so A and G have no path. At1, their route is 6. At1.5, diagonal shortcuts A–B–D–F–G give $1+\sqrt2+\sqrt2+1=2+2\sqrt2\approx4.828427$. At2, the direct A–G edge gives 2. The short route is mathematically correct for that graph and a poor description of traveling around the intended U. A separate noisy-bridge drawing shows why an accidental close pair can create the same problem in data.

Change the radius in the first investigation and watch the new edges and route together. The next investigation moves D while keeping radius 1 fixed; a disconnected vertex is shown as disconnected, not mapped to a convenient replacement coordinate. The endpoint investigation traces a route between two selected IDs. Reset restores the exact seven vertices, endpoints A/G and radius 1. These are graph edits, not animation of an unseen fit.

In code, radius graphs contain finite edge weights and infinity for absent edges. A k-neighbor graph instead selects $k$ nearest nonself records per row. A union graph keeps an edge if either endpoint selected it; a mutual graph requires both. That difference can join or disconnect components. Duplicate observations can have a genuine zero-length nonself edge, so zero cannot mean “absent.”

`graph` computes one row of distances at a time and uses distance/row-ID ordering for the constructed fixtures. `floyd_warshall` permits each vertex `via` in turn and compares the direct route with the two-leg route through it. For small graphs, its dense $O(n^3)$ work is easy to inspect. A large sparse graph normally uses sparse adjacency and repeated Dijkstra; the resulting all-pairs distance matrix is still $O(n^2)$. In §9 we will turn a finite route matrix into coordinates. The ordinary `Isomap` call uses a k-neighbor union graph; its handling of disconnected components may repair them, whereas `finite_embedding` refuses them. These calls therefore agree only after matching graph semantics and connectivity.

<!-- whole-code isomap_routes.py -->
```python
"""Radius/k-neighbor graph, shortest paths and finite classical embedding.

Run: python isomap_routes.py (NumPy, SciPy). Small dense graph storage O(n²).
"""
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import shortest_path, connected_components
from classical_geometry import classical_mds


def graph(x, *, radius=None, k=None, mutual=False):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or len(x) < 2 or not np.isfinite(x).all():
        raise ValueError("Use at least two finite rows")
    if (radius is None) == (k is None):
        raise ValueError("Choose radius or k")
    if radius is not None and (not np.isfinite(radius) or radius < 0):
        raise ValueError("Radius must be finite and nonnegative")
    if k is not None and not 1 <= k < len(x):
        raise ValueError("k excludes self and must lie in 1..n-1")
    n = len(x)
    weights = np.full((n, n), np.inf)
    for i in range(n):
        d = np.linalg.norm(x - x[i], axis=1)
        d[i] = np.inf
        chosen = np.flatnonzero(d <= radius) if radius is not None else np.lexsort((np.arange(n), d))[:k]
        weights[i, chosen] = d[chosen]
    weights = np.maximum(weights, weights.T) if mutual else np.minimum(weights, weights.T)
    np.fill_diagonal(weights, 0)
    return weights


def floyd_warshall(weights):
    result = np.array(weights, dtype=float, copy=True)
    for via in range(len(result)):
        result = np.minimum(result, result[:, via, None] + result[None, via, :])
    return result


def finite_embedding(weights, q=1):
    routed = floyd_warshall(weights)
    if not np.isfinite(routed).all():
        raise ValueError("Disconnected graph: choose a component or change graph semantics")
    return classical_mds(routed, q)[0], routed


def ordinary_paths(weights):
    # Explicit stored zeros preserve duplicate-point edges in SciPy sparse input.
    row, col = np.where(np.isfinite(weights) & ~np.eye(len(weights), dtype=bool))
    sparse = csr_matrix((weights[row, col], (row, col)), shape=weights.shape)
    return shortest_path(sparse, directed=False, method="D"), connected_components(sparse, directed=False)


def ordinary_isomap(x, neighbors=2):
    from sklearn.manifold import Isomap
    return Isomap(n_neighbors=neighbors, n_components=1, eigen_solver="dense",
                  path_method="D", neighbors_algorithm="brute", n_jobs=1).fit_transform(x)


if __name__ == "__main__":
    u = np.array([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]], float)
    for radius in (0.75, 1, 1.5, 2):
        weights = graph(u, radius=radius)
        routed = floyd_warshall(weights)
        print("radius,A-to-G", radius, float(routed[0, -1]))
    y, d = finite_embedding(graph(u, radius=1))
    print("route matrix", d.tolist())
    print("map distances from A", np.abs(y[:, 0] - y[0, 0]).tolist())
```

The new deterministic stream is:

<!-- whole-output isomap_routes -->
```text
radius,A-to-G 0.75 inf
radius,A-to-G 1 6.0
radius,A-to-G 1.5 4.82842712474619
radius,A-to-G 2 2.0
route matrix [[0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0], [1.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0], [2.0, 1.0, 0.0, 1.0, 2.0, 3.0, 4.0], [3.0, 2.0, 1.0, 0.0, 1.0, 2.0, 3.0], [4.0, 3.0, 2.0, 1.0, 0.0, 1.0, 2.0], [5.0, 4.0, 3.0, 2.0, 1.0, 0.0, 1.0], [6.0, 5.0, 4.0, 3.0, 2.0, 1.0, 0.0]]
map distances from A [0.0, 1.0000000000000013, 2.000000000000001, 3.0000000000000004, 4.0, 5.0, 6.0]
```

Read the first infinity as a missing path. The other three lengths expose the precise neighborhood tradeoff. The final map distances from A are 0 through6 because this radius 1 graph is a path. Its straight-line map is an unfolding of graph routes, not a claim that the original U's chord distances were preserved.

## 3. Name the relationship before scoring the picture

<!-- figure D07 -->

Different methods carry different objects into the map. PCA carries projections and reconstruction error. Multidimensional scaling (MDS) carries a table of dissimilarities; isometric mapping (Isomap) first measures graph-route lengths. Locally linear embedding (LLE) carries local affine recipes: one point is reconstructed from its neighbors. Graph spectral methods carry weighted edges and smoothness. t-SNE carries normalized pair probabilities. UMAP carries local fuzzy memberships and an edge-sampling procedure. The diagrams follow the same observation IDs through these six objects; they are six questions, rather than six grades on one universal contest.

For the digit map our first question is concrete: did the same nearby records stay nearby? Define $N_X^k(i)$ and $N_Y^k(i)$ as the $k$ nearest nonself neighbors of observation $i$ in input and map space. Its retained fraction is $|N_X^k(i)\cap N_Y^k(i)|/k$, and the collection average is


\[
R_k=\frac1n\sum_i\frac{|N_X^k(i)\cap N_Y^k(i)|}{k}.
\]

<!-- figure D08 -->

Take four input positions A0, B1, C3, D7 and proposed map positions A0, B5, C1, D11. With $k=1$, input arrows are A→B, B→A, C→B, D→C. Map arrows are A→C, B→C, C→A, D→B. None agrees, so $R_1=0$. But replacing a nearest neighbor by the second-nearest is less severe than replacing it by the last. Input ranks of the four intruders are 2,2,2,2. Each contributes rank minus $k=1$, giving total penalty4. Trustworthiness applies a normalization:

\[
T_k=1-\frac{2}{nk(2n-3k-1)}\sum_i\sum_{j\in N_Y^k(i)\setminus N_X^k(i)}(r_X(i,j)-k).
\]

Here the coefficient is $2/(4\cdot1\cdot4)=1/8$, so $T_1=1-4/8=.5$. Trustworthiness penalizes neighbors introduced by the map. Continuity reverses the spaces and penalizes original neighbors omitted from it; the ranks then come from the map. Neither is the same as the retained fraction. Even a high average can coexist with a poor local query.

For continuity, replace introduced IDs by omitted IDs and price them with their map ranks: $C_k=1-\frac{2}{nk(2n-3k-1)}\sum_i\sum_{j\in N_X^k(i)\setminus N_Y^k(i)}(r_Y(i,j)-k)$. In this four-point example the omitted neighbors also have map rank2, so $C_1=.5$. That equality belongs to this fixture; the two penalties need not agree on another map.

<!-- figure D09 -->

The ranking ladder removes the record itself, orders by distance and breaks exact ties by original ID. Rank1 is the closest remaining record. Duplicates retain different IDs and can occupy tied ranks. For the normalization used here, require $1\le k<n/2$, matching the ordinary trustworthiness API's domain. Our audit values $k=5,10,20$ are questions asked of a map; they are separate from UMAP's graph neighbor count or t-SNE's perplexity.

The complete audit file reads one input-distance row and one map-distance row at a time. `input_rank` and `map_rank` invert the neighbor permutations so a set difference can be priced by rank. This avoids an $n\times n\times D$ offset tensor. Exact full ranking still costs $O(n^2D+n^2\log n)$, plus map-distance work; working storage beyond the data and coordinates is $O(n)$. Nearest-neighbor search suffices for $R_k$, but the intrusion and omission penalties need the relevant full ranks.

<!-- whole-code audit_saved_neighbors.py -->
```python
"""Audit immutable saved maps; never fit an embedding.

Run with --assets pointing to the supplied manifold-learning data directory.
NumPy/SciPy; optional ordinary comparison uses scikit-learn.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.spatial.distance import cdist


def load_saved(directory):
    directory = Path(directory)
    raw = (directory / "digits-300.csv").read_bytes()
    saved = json.loads((directory / "calculated-inputs.json").read_text())
    if hashlib.sha256(raw).hexdigest() != saved["datasetSha256"]:
        raise ValueError("CSV does not match the saved-map dataset")
    data = np.loadtxt(directory / "digits-300.csv", delimiter=",", skiprows=1)
    ids = data[:, 0].astype(int)
    if not np.array_equal(ids, data[:, 0]) or len(set(ids)) != len(ids):
        raise ValueError("Source IDs must be unique integers")
    saved_ids = np.asarray(saved["rows"], dtype=int)
    if set(ids) != set(saved_ids):
        raise ValueError("Saved maps and CSV need the same source IDs")
    position = {int(identity): i for i, identity in enumerate(saved_ids)}
    join = [position[int(identity)] for identity in ids]
    maps = {name: np.asarray(record["coordinates"], float)[join]
            for name, record in saved["layouts"].items()}
    if any(y.shape != (len(ids), 2) or not np.isfinite(y).all() for y in maps.values()):
        raise ValueError("Each saved map needs two finite coordinates per source ID")
    return ids, data[:, 1].astype(int), data[:, 2:] / 16.0, maps


def ordered_neighbors(points, ids, row):
    distances = cdist(points[row:row + 1], points, metric="sqeuclidean")[0]
    if not np.isfinite(distances).all():
        raise ValueError("Rescale coordinates before squared-distance overflow")
    order = np.lexsort((ids, distances))
    return order[order != row]


def audit(x, y, ids, k):
    x, y, ids = np.asarray(x, float), np.asarray(y, float), np.asarray(ids)
    n = len(ids)
    if (x.ndim != 2 or y.ndim != 2 or len(x) != n or len(y) != n
            or not np.isfinite(x).all() or not np.isfinite(y).all()
            or len(set(ids.tolist())) != n or not 1 <= k < n / 2):
        raise ValueError("Use matched finite rows, unique IDs and 1 <= k < n/2")
    retained, intrusion, omission = [], 0, 0
    for i in range(n):
        input_order = ordered_neighbors(x, ids, i)
        map_order = ordered_neighbors(y, ids, i)
        input_rank, map_rank = np.empty(n, int), np.empty(n, int)
        input_rank[input_order] = np.arange(1, n)
        map_rank[map_order] = np.arange(1, n)
        original, mapped = set(input_order[:k]), set(map_order[:k])
        retained.append(len(original & mapped) / k)
        intrusion += sum(input_rank[j] - k for j in mapped - original)
        omission += sum(map_rank[j] - k for j in original - mapped)
    normalizer = 2 / (n * k * (2 * n - 3 * k - 1))
    return dict(retention=float(np.mean(retained)),
                trustworthiness=float(1 - normalizer * intrusion),
                continuity=float(1 - normalizer * omission), rows=retained)


def query_lists(x, y, ids, source_id, k):
    row = np.flatnonzero(ids == source_id)
    if len(row) != 1:
        raise ValueError("Choose an existing source ID")
    i = int(row[0])
    first = ids[ordered_neighbors(x, ids, i)[:k]].tolist()
    second = ids[ordered_neighbors(y, ids, i)[:k]].tolist()
    return dict(input=first, mapped=second, common=sorted(set(first) & set(second)),
                missing=sorted(set(first) - set(second)), new=sorted(set(second) - set(first)))


def ordinary_audit(x, y, k):
    from sklearn.manifold import trustworthiness
    from sklearn.neighbors import NearestNeighbors
    model = NearestNeighbors(n_neighbors=k + 1, metric="euclidean", algorithm="brute").fit(x)
    neighbors = model.kneighbors(x, return_distance=False)
    # Exclude self explicitly; duplicate ties may place self outside the first k.
    input_lists = [row[row != i][:k].tolist() for i, row in enumerate(neighbors)]
    return input_lists, trustworthiness(x, y, n_neighbors=k, metric="euclidean")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", type=Path, required=True)
    args = parser.parse_args()
    ids, labels, x, maps = load_saved(args.assets)
    for name in ("pca", "tsne-p30-s7", "umap-n15-d01-s7"):
        result = audit(x, maps[name], ids, 10)
        print(name, {key: value for key, value in result.items() if key != "rows"})
        print("source30", query_lists(x, maps[name], ids, 30, 10))
```

Run it with the supplied data directory:

```sh
python audit_saved_neighbors.py --assets ./manifold-learning
```

Its newly computed saved-array stream is:

<!-- whole-output audit_saved_neighbors -->
```text
pca {'retention': 0.37633333333333335, 'trustworthiness': 0.8675910954891622, 'continuity': 0.9492290568248389}
source30 {'input': [0, 166, 229, 160, 36, 276, 140, 266, 178, 79], 'mapped': [78, 229, 79, 306, 276, 0, 130, 266, 132, 166], 'common': [0, 79, 166, 229, 266, 276], 'missing': [36, 140, 160, 178], 'new': [78, 130, 132, 306]}
tsne-p30-s7 {'retention': 0.7703333333333334, 'trustworthiness': 0.9901394258933802, 'continuity': 0.9864487404803749}
source30 {'input': [0, 166, 229, 160, 36, 276, 140, 266, 178, 79], 'mapped': [0, 276, 266, 286, 256, 130, 48, 166, 229, 10], 'common': [0, 166, 229, 266, 276], 'missing': [36, 79, 140, 160, 178], 'new': [10, 48, 130, 256, 286]}
umap-n15-d01-s7 {'retention': 0.7143333333333334, 'trustworthiness': 0.9889771528998242, 'continuity': 0.9832841241944933}
source30 {'input': [0, 166, 229, 160, 36, 276, 140, 266, 178, 79], 'mapped': [160, 36, 166, 140, 0, 256, 10, 276, 286, 48], 'common': [0, 36, 140, 160, 166, 276], 'missing': [79, 178, 229, 266], 'new': [10, 48, 256, 286]}
```

This audit uses row-wise SciPy squared distances and an explicit source-ID tie rule. The historical digit programs used scikit-learn distance/rank routines. Their rounded and full-precision $T_k/C_k$ values remain separately identified later; tiny differences arise from tied distances and numerical ordering, while these $R_{10}$ values and source30 lists agree. That is why a comparison should disclose its convention instead of silently changing a metric column. No new embedding was fitted to produce this stream.

`ordinary_audit` exposes `NearestNeighbors` and `trustworthiness` on the same rows. It removes self explicitly, including when duplicate ties place self unexpectedly. It does not promise the library will choose our source-ID tie order. A rigid translation or rotation preserves exact Euclidean distances, whereas rounding coordinates or changing the input metric can change tied rankings. We now have a way to judge a map; next we build the objects it tries to preserve.

## 4. t-SNE turns each distance row into an effective neighborhood

<!-- figure D10 -->

Stand at one selected input record and draw arrows to three candidates at distances 1,2,3. A Gaussian gives nearby candidates more weight. With width $\sigma=1$, the unnormalized weights are $e^{-1/2},e^{-2},e^{-9/2}$. Dividing by their sum gives approximately .805512, .179734 and .014753. The widest arrow ends at the nearest candidate. These are probabilities of selecting a neighbor conditioned on standing at this record, not probabilities of a digit class.

\[
p_{j\mid i}=\frac{e^{-d_{ij}^2/(2\sigma_i^2)}}{\sum_{l\ne i}e^{-d_{il}^2/(2\sigma_i^2)}},\qquad p_{i\mid i}=0.
\]

Each row totals 1; different rows can have different widths. This adapts the neighborhood to local distance scale instead of forcing one width on both sparse and crowded regions.

The [SVM kernel section](/learn/path/full-curriculum/support-vector-machines-svm?module=classical-ml#5-change-similarity-with-a-valid-kernel) introduced a Gaussian shape $e^{-\gamma d^2}$; here $\gamma=1/(2\sigma^2)$. We now remove self and normalize separately in each row. That changes the object: these conditional affinities need not be symmetric or be a positive-semidefinite kernel Gram. The later symmetric $P$ is a joint probability table, not kernel PCA's inner-product matrix.

<!-- figure D11 -->

At width .5 the nearest candidate almost monopolizes the row. At width 2 the three arrows are more even. To measure the row's effective number of candidates, first calculate entropy $H_i=-\sum_jp_{j\mid i}\log_2p_{j\mid i}$, then perplexity $2^{H_i}$. Equivalently, natural-log entropy $h_i$ gives $e^{h_i}$. Our three widths yield perplexities 1.017464,1.724422 and2.786447. A uniform row over $m$ candidates has entropy $\log_2m$ and perplexity $m$; a concentrated row has smaller effective count.

A chosen perplexity is a target for each row's width search, not exactly a selected number of neighbors. If two candidates tie for the nearest distance, shrinking the width cannot select one of them: the limiting distribution gives each1/2. That row's lower perplexity limit is 2. Its upper limit is the candidate count. Target1.5 is then infeasible, even if it satisfies the estimator's global `perplexity < n` check. Our local solver returns explicit uniform and nearest-tie limits, and refuses targets outside the feasible interval.

The first investigation varies only width. The distance-edit investigation lets you select one candidate and alter its distance as well as width; the probabilities and entropy change immediately. The code's target search reports achieved entropy and boundary/convergence status. Do not infer that a finite search has found a mathematically exact root merely because it stopped.

<!-- figure D12 -->

Conditioning is directional. An illustrative pair with $p_{B\mid A}=.8$ and $p_{A\mid B}=.6$, in a four-record collection, becomes $P_{AB}=(.8+.6)/(2\cdot4)=.175$. The arrows merge into one symmetric pair weight. This pair is a simple normalization example; it is not the next fixture's fitted pair.

<!-- figure D13 -->

Now use all four actual input positions0,1,3,7 and perplexity 2. The full conditional matrix places zero on its diagonal. Add it to its transpose and divide by $2n=8$:

\[
P_{ij}=\frac{p_{j\mid i}+p_{i\mid j}}{2n}.
\]

Every $P_{ij}=P_{ji}$, and the total over ordered nonself pairs is 1. A→B's conditional value .655887 and B→A's .604118 produce $P_{AB}\approx.157500626$. Each unordered pair appears twice in that total; its combined mass is $2P_{AB}$. Keeping this convention now prevents a factor-of-two mistake in the later gradient.

The code calls $\beta=1/(2\sigma^2)$. Increasing beta narrows the row and lowers entropy. `row_at_beta` subtracts the smallest squared distance before exponentiating; this common shift cancels in normalization and stops all weights from underflowing together. `solve_row` brackets beta, bisects once an upper bound exists and reports a status after a bounded number of iterations. It ignores zero-probability terms when evaluating $p\log p$, whose limiting value is 0. Uniform input scaling by $c>0$ divides beta by $c^2$ at the same target and preserves the row.

<!-- whole-code gaussian_rows.py -->
```python
"""Gaussian conditional rows and symmetric t-SNE P; no embedding fit.

Run: python gaussian_rows.py (NumPy). Distances exclude the row itself.
"""
import numpy as np


def row_at_beta(distances, beta):
    d = np.asarray(distances, dtype=float)
    if d.ndim != 1 or not len(d) or not np.isfinite(d).all() or np.any(d < 0):
        raise ValueError("Use a nonempty finite nonnegative distance row")
    if not np.isfinite(beta) or beta < 0:
        raise ValueError("beta must be finite and nonnegative")
    # Subtract the nearest squared distance before scaling, not after exp.
    with np.errstate(over="raise", invalid="raise"):
        offsets = d * d - np.min(d * d)
        logits = -beta * offsets
    weights = np.exp(logits)
    p = weights / weights.sum()
    positive = p > 0
    entropy_nats = -float(p[positive] @ np.log(p[positive]))
    return p, entropy_nats


def solve_row(distances, perplexity, tolerance=1e-10, max_iter=100):
    d = np.asarray(distances, dtype=float)
    row_at_beta(d, 0)  # Validate even when the answer lies at a boundary.
    minimum_count = int(np.count_nonzero(d == d.min()))
    if not minimum_count <= perplexity <= len(d):
        raise ValueError("Target lies outside the nearest-tie/count interval")
    if perplexity == len(d):
        return np.full(len(d), 1 / len(d)), 0.0, "uniform-limit"
    if perplexity == minimum_count:
        p = (d == d.min()).astype(float) / minimum_count
        return p, np.inf, "nearest-tie-limit"
    target, low, high, beta = np.log(perplexity), 0.0, np.inf, 1.0
    for _ in range(max_iter):
        p, entropy = row_at_beta(d, beta)
        if abs(entropy - target) <= tolerance:
            return p, beta, "converged"
        if entropy > target:
            low = beta
        else:
            high = beta
        beta = 2 * beta if np.isinf(high) else (low + high) / 2
    return p, beta, "iteration-limit"


def conditional_and_joint(x, perplexity):
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or len(x) < 2 or not np.isfinite(x).all():
        raise ValueError("Use at least two finite observation rows")
    n = len(x)
    conditional = np.zeros((n, n))
    states = []
    for i in range(n):
        others = np.arange(n) != i
        distances = np.linalg.norm(x[others] - x[i], axis=1)
        p, beta, status = solve_row(distances, perplexity)
        conditional[i, others] = p
        states.append((beta, status))
    return conditional, (conditional + conditional.T) / (2 * n), states


if __name__ == "__main__":
    for sigma in (0.5, 1.0, 2.0):
        p, h = row_at_beta([1, 2, 3], 1 / (2 * sigma * sigma))
        print("sigma,row,perplexity", sigma, p.tolist(), float(np.exp(h)))
    rows, joint, states = conditional_and_joint(np.array([[0.], [1.], [3.], [7.]]), 2)
    print("conditional", rows.tolist())
    print("P", joint.tolist())
    print("states", states)
```

The new deterministic stream includes all four rows and the entire joint matrix:

<!-- whole-output gaussian_rows -->
```text
sigma,row,perplexity 0.5 [0.9975272648640293, 0.002472622879065752, 1.122569050386982e-07] 1.0174640751969017
sigma,row,perplexity 1.0 [0.8055124120405226, 0.1797341135001498, 0.014753474459327466] 1.724421678547294
sigma,row,perplexity 2.0 [0.48657805575120283, 0.33441988101275766, 0.17900206323603943] 2.786447439687662
conditional [[0.0, 0.6558872697854092, 0.33289945467725446, 0.011213275537336309], [0.6041177401751883, 0.0, 0.3919950082893136, 0.003887251535498156], [0.22268886762085754, 0.7355032697248046, 0.0, 0.04180786265433779], [0.06655801696317193, 0.17369191820343724, 0.7597500648333908, 0.0]]
P [[0.0, 0.1575006262450747, 0.069448540287264, 0.00972141156256353], [0.1575006262450747, 0.0, 0.14093728475176479, 0.022197396217366924], [0.069448540287264, 0.14093728475176479, 0.0, 0.10019474093596607], [0.00972141156256353, 0.022197396217366924, 0.10019474093596607, 0.0]]
states [(0.08476855285698548, 'converged'), (0.14417333574965596, 'converged'), (0.23895588016603142, 'converged'), (0.07378531861468218, 'converged')]
```

`conditional_and_joint` retains the $n\times n$ joint object because the exact small t-SNE objective needs it; row work avoids a larger feature-offset tensor. This route costs $O(n^2D+I n^2)$ for at most $I$ search steps per row and uses $O(n^2+nD)$ storage. Large implementations restrict or approximate affinity work. The ordinary `TSNE` route in §7 accepts the complete feature matrix and the perplexity; it does not expose a stable public “fit this row's bandwidth” method. The inspected local function is our teaching implementation, not a private package API.

The Gaussian construction and symmetric normalization follow the [original t-SNE paper](https://jmlr.org/papers/volume9/vandermaaten08a/vandermaaten08a.pdf). We have established what the input wants. Next we need a probability model in the map that can compete with it.

## 5. Give distant points room, then follow one force

<!-- figure D14 -->

A patch in a high-dimensional neighborhood can have many moderately distant neighbors surrounding a point. Putting them all in a plane asks that plane to provide enough room at similar radii. The shell drawing contrasts this geometric shortage with a two-dimensional ring. This is the crowding problem: preserving every moderate separation can force points toward the center or distort other separations. In the constructed picture, eight cube corners $(\pm1,\pm1,\pm1)$ are all $\sqrt3$ from the center, and their smallest mutual separation is 2. Put the same eight IDs evenly on a planar circle of radius $\sqrt3$: adjacent IDs are only $2\sqrt3\sin(\pi/8)<2$ apart. Keeping each center-to-neighbor radius has compressed some neighbor-to-neighbor separations. Several overlapping neighborhoods compete for the same coordinates. This concrete conflict motivates the higher-dimensional shell picture; it is not measured digit density or a proof that a heavy tail preserves every requested distance.

<!-- figure D15 -->

t-SNE uses a heavier-tailed map kernel. At distance 3, the Student kernel is $1/(1+3^2)=.1$, while a Gaussian of width 1 gives $e^{-9/2}\approx.011109$. A distant pair can therefore carry meaningful map weight without being compressed as close as a Gaussian map would demand. The heavy tail changes the map's competition; it does not make every global distance correct.

For map coordinates $y_i\in\mathbb R^q$, define

\[
t_{ij}=(1+\|y_i-y_j\|^2)^{-1},\quad
Z=\sum_{a\ne b}t_{ab},\quad Q_{ij}=t_{ij}/Z,\quad Q_{ii}=0.
\]

Like $P$, $Q$ is a symmetric probability distribution over ordered nonself pairs. The normalization joins all pairs, including ones whose endpoints did not move.

<!-- figure D16 -->

Three points illustrate the effect. Change Y=(0,1,3) to Y=(0,1,2). A and B stay fixed, so their unnormalized kernel remains1/2. Initially the three unordered kernels are 1/2,1/10,1/5, giving ordered total $Z=2(.5+.1+.2)=1.6$. After moving C, they are 1/2,1/5,1/2, giving $Z=2.4$. Thus $Q_{AB}$ changes from 5/16 to 5/24 even though distance AB is unchanged. Move C in the investigation and read the pair numerator alongside the complete denominator.

To match the input distribution, t-SNE minimizes

\[
C(Y)=\operatorname{KL}(P\|Q)=\sum_{i\ne j}P_{ij}\log\frac{P_{ij}}{Q_{ij}}.
\]

A large input probability with a tiny map probability makes a large contribution. This direction of KL emphasizes keeping highly weighted input neighbors represented; reversing KL would pose a different problem. The objective is nonconvex: different starts can reach different configurations, and an individual step need not decrease the cost if its learning rate is too large.

<!-- figure D17 -->

For the four-point input from §4, start the map at(−1.5,−.5,.5,1.5). Select A. Each pair supplies a negative-gradient arrow $-4(P_{Aj}-Q_{Aj})t_{Aj}(y_A-y_j)$. When $P>Q$, negative gradient points toward that neighbor; when $P<Q$, it points away. The arrows sum before any endpoint is updated. The total negative gradient for A is approximately+.0777846, so a learning rate .5 moves it right by+.0388923 before centering.

At this start the ordered denominator is $Z=4$. For A→B, $(P,Q,t,\Delta)=(.157500626,.125,.5,-1)$ gives a rightward contribution .065001252. A→C gives .031117664; A→D gives −.018334306, a leftward repulsion. Adding the three signed contributions gives .077784611. Updating all four from that same old state at rate .5 gives approximately[−1.461108,−.538805,.443699,1.556214] after centering. The arrows share one signed coordinate ruler; a negative contribution is not a negative probability.

The gradient, under our ordered-pair convention, is

\[
\nabla_{y_i}C=4\sum_{j\ne i}(P_{ij}-Q_{ij})t_{ij}(y_i-y_j).
\]

The four-point step investigation keeps the input $P$ fixed. Select an ID, edit its current coordinate and choose a learning rate; Step updates every row from the same old state and then subtracts the new centroid. Reset returns the original four coordinates. Learning rate 0 leaves all coordinates unchanged. Centroid removal chooses a plotting origin, since translating all coordinates leaves every distance and the cost unchanged. An exactly coincident symmetric start can have zero forces; that stationary state does not establish a good minimum.

<!-- figure D18 -->

Practical t-SNE uses a separate early phase: multiplying attractive input weights by an exaggeration factor $\alpha$. The drawing keeps $Q$'s total 1 beside $\alpha P$'s total $\alpha$. Those attractive weights are not a newly normalized probability distribution. Renormalizing them would undo exaggeration. Momentum adds part of an earlier displacement; learning-rate schedules, initialization and stopping criteria also change the trajectory. Our full small optimizer in §10 has no momentum or exaggeration, so it cannot claim byte-for-byte agreement with a package's final digit map.

The ordinary scikit-learn route specifies `early_exaggeration=12` through the default used in the retained snapshot and `learning_rate='auto'`. That auto rule depends on sample count and exaggeration; different packages can use differently scaled learning-rate conventions. Treat a numeric rate as belonging to a particular update equation. In the four-point lab, .5 is the scalar multiplying the gradient just displayed. A large failed step remains a visible result, followed by Reset or a smaller step, rather than a hidden correction.

An explicit oversized step makes the limitation concrete. From the same four-point start and fixed $P$, a single rate 100 update gives approximately[6.278461,−8.261085,−10.760275,12.742899], and KL rises from .053522403 to 1.360383966. This is one constructed update, not another saved optimizer trajectory. A smaller step or a line-search rule addresses step size; it does not make the nonconvex objective globally solved.

## 6. UMAP builds local memberships and samples their edges

The t-SNE row is normalized as a probability distribution. UMAP begins with a different object: how strongly a local neighborhood connects to each candidate. Its graph construction and ordinary sampled optimizer are distinct stages. We will trace each before comparing their behavior.

<!-- figure D19 -->

Use six scalar observations0,.7,1.9,4.2,8.6,11.3. Each exact neighbor row includes self first and then the nearest three others, so the array width is $k_{graph}=4$. The self entry has distance 0 and is excluded from the membership sum. A selected row shows neighbor IDs and their distances separately: an absent neighbor is represented by ID−1 and infinite distance, not a phantom vertex at distance 0.

UMAP gives each row a nearest-positive-distance offset $\rho_i$ and a scale $\sigma_i>0$. For this taught `local_connectivity=1` route,

\[
v_{i\to j}=\exp\!\left[-\frac{\max(0,d_{ij}-\rho_i)}{\sigma_i}\right],
\quad \sum_{j\ne i\text{ in row}}v_{i\to j}\approx\log_2(k_{graph}).
\]

Distances up to the offset get membership1. Memberships in a row need not total 1, and they do not describe class probabilities. The logarithmic target calibrates local scales; it is not the perplexity entropy equation from t-SNE.

<!-- figure D20 -->

For a separate calibration row, use distances[0,1,1+ln2,1+ln2]. With $\rho=1,\sigma=1$, the three nonself memberships are 1,1/2,1/2 and total 2=log₂4. This row makes the arithmetic transparent. It is not the six-observation dataset's first row. In that dataset, the retained first scale is approximately3.0883 and its memberships to the next three records are 1,.678,.322.

<!-- figure D21 -->

Repeated zero distances, clamping by rho and missing neighbors alter the scale search. If enough memberships are pinned to 1, the target can be a boundary rather than an attainable finite root. The package also applies a small distance-scale floor to sigma. The complete teaching graph source retains that floor and its fixed64-step search. Read its result as an approximate package-style calibration, not a proof that every row reaches the target exactly. For explicit constructed nonself-distance examples, compare the self-first rows [0,1,2,3], [0,0,1,2] and [0,1,2,∞], all with array width 4. In the duplicate row, rho is 1 and both nonself distances 0 and 1 are pinned to membership 1, already reaching the target 2 before the third positive term. No positive finite scale makes that total exactly 2. In the removed-neighbor row, the absent slot has ID −1 and contributes no membership; target 2 is only its large-scale limit. The finite search still returns its bounded result. In this retained teaching source, the floor is .001 times the finite row mean when rho is positive, and .001 times the global finite-distance mean otherwise; the final scale is the larger of the search result and that floor. A floor does not establish root attainment.

<!-- figure D22 -->

Local membership is directional because the two rows have different offsets and scales. At physical distance 2, two rows with rho1 and sigma 1/ln2 or1/ln4 give strengths.5 and.25. Their fuzzy union is

\[
w_{ij}=v_{i\to j}+v_{j\to i}-v_{i\to j}v_{j\to i}=.625.
\]

It behaves like “at least one connection” under an algebraic independence analogy; it is not an empirical probability that two records belong to the same class. The arithmetic mean would be.375, a different graph. Directly edit the two strengths in the investigation and see both union and mean. Those controls describe the combination rule, while the preceding rows explain how memberships arise from distances.

The retained graph program finds exact neighbors without a feature-broadcast tensor, solves scales, stores directed memberships in compressed sparse row (CSR) form and combines the sparse matrix with its transpose. CSR stores each row's nonzero column indices and values, with an offset array locating the start of each row; missing entries need no stored value. Its `main` also compares the graph with `fuzzy_simplicial_set`, then fits a small ordinary UMAP model. The stream below belongs to that earlier full run; it has not been executed again here. The source deliberately uses package internals for a version-bound mechanism comparison, while ordinary application uses the public `UMAP` API in §7.

<!-- whole-code umap-mechanism.py -->
```python
"""Exact small-neighborhood UMAP graph; explicit, bounded layout mechanisms.

Python 3.12; numpy 2.3.5, scipy 1.18.1, umap-learn 0.5.12.
The full-pair step is a declared teaching objective, not UMAP's sampled trainer.
"""
import numpy as np
from scipy.sparse import csr_matrix


def exact_neighbors(x, k):
    """Self first; distance ties by row ID. O(n^2 d + nk log k), O(nd + nk)."""
    x = np.asarray(x, dtype=float)
    if x.ndim != 2 or not np.isfinite(x).all() or not 2 <= k <= len(x):
        raise ValueError("Use finite rows and 2 <= k <= n")
    ids = np.empty((len(x), k), dtype=int)
    distances = np.empty((len(x), k), dtype=np.float32)
    try:
        with np.errstate(over="raise", under="raise", invalid="raise"):
            for row in range(len(x)):
                squared = np.sum((x - x[row]) ** 2, axis=1)
                squared[row] = np.inf
                boundary = np.partition(squared, k - 2)[k - 2]
                nearer = np.flatnonzero(squared < boundary)
                tied = np.flatnonzero(squared == boundary)[:k - 1 - len(nearer)]
                chosen = np.concatenate((nearer, tied))
                chosen = chosen[np.lexsort((chosen, squared[chosen]))]
                ids[row] = np.r_[row, chosen]
                distances[row] = np.r_[0.0, np.sqrt(squared[chosen])]
    except FloatingPointError as error:
        raise ValueError("Rescale coordinates: squared or float32 distances underflow or overflow") from error
    return ids, distances


def local_scales(distances, tolerance=1e-5):
    """local_connectivity=1, bandwidth=1, self counted in k; 64 search steps."""
    distances = np.asarray(distances, dtype=float)
    target = np.log2(distances.shape[1])
    sigma, rho = np.empty(len(distances)), np.zeros(len(distances))
    finite = distances[np.isfinite(distances)]
    global_mean = finite.mean() if finite.size else 0.0
    for row, values in enumerate(distances):
        finite_row = values[np.isfinite(values)]
        positive = finite_row[finite_row > 0]
        rho[row] = positive.min() if positive.size else 0.0
        offsets = np.maximum(values[1:] - rho[row], 0)
        low, high, scale = 0.0, np.inf, 1.0
        for _ in range(64):
            mass = np.exp(-offsets / scale).sum()
            if abs(mass - target) < tolerance:
                break
            if mass > target:
                high = scale
            else:
                low = scale
            scale = 2 * scale if np.isinf(high) else (low + high) / 2
        mean = finite_row.mean() if rho[row] > 0 else global_mean
        sigma[row] = max(scale, 1e-3 * mean)
    return sigma, rho


def fuzzy_graph(ids, distances):
    """Use -1/inf for removed neighbors; keep storage proportional to nk."""
    sigma, rho = local_scales(distances)
    rows = np.repeat(np.arange(len(ids)), ids.shape[1])
    columns = ids.ravel()
    valid = (columns >= 0) & (rows != columns) & np.isfinite(distances.ravel())
    rows, columns = rows[valid], columns[valid]
    offset = np.maximum(distances.ravel()[valid] - rho[rows], 0)
    strengths = np.exp(-offset / sigma[rows])
    directed = csr_matrix((strengths, (rows, columns)), shape=(len(ids), len(ids)))
    graph = directed + directed.T - directed.multiply(directed.T)
    graph.eliminate_zeros()
    return graph.tocsr(), directed, sigma, rho


def full_pair_loss_gradient(y, graph):
    """Ideal Bernoulli pair cost with a=b=1, each unordered pair once.

    O(n^2 q) work, O(nq + graph.nnz) storage; small distinct coordinates only.
    """
    gradient = np.zeros_like(y, dtype=float)
    loss = 0.0
    for first in range(len(y) - 1):
        delta = y[first] - y[first + 1:]
        squared = np.sum(delta * delta, axis=1)
        if np.any(squared <= 1e-12):
            raise ValueError("This smooth pair calculation needs separated coordinates")
        weights = graph.getrow(first).toarray()[0, first + 1:]
        loss += np.sum(weights * np.log1p(squared)
                       + (1 - weights) * np.log1p(1 / squared))
        pair_gradient = 2 * (weights - (1 - weights) / squared)[:, None] * delta / (1 + squared[:, None])
        gradient[first] += pair_gradient.sum(axis=0)
        gradient[first + 1:] -= pair_gradient
    return float(loss), gradient


def sampled_edge_step(y, head, tail, negatives, rate):
    """One explicit UMAP-style a=b=gamma=1 update; caller supplies schedule.

    Positive endpoints both move; each negative moves the head only. The 0.001
    repulsion stabilizer and per-coordinate clipping follow the package's rule.
    """
    updated = np.array(y, dtype=float, copy=True)
    delta = updated[head] - updated[tail]
    squared = delta @ delta
    attraction = np.clip(-2 * delta / (1 + squared), -4, 4)
    updated[head] += rate * attraction
    updated[tail] -= rate * attraction
    for other in negatives:
        if other == head:
            continue
        delta = updated[head] - updated[other]
        squared = delta @ delta
        if squared > 0:
            repulsion = np.clip(2 * delta / ((0.001 + squared) * (1 + squared)), -4, 4)
            updated[head] += rate * repulsion
    return updated


def main():
    from umap import UMAP
    from umap.umap_ import fuzzy_simplicial_set
    x = np.array([[0.0], [0.7], [1.9], [4.2], [8.6], [11.3]])
    ids, distances = exact_neighbors(x, 4)
    graph, directed, sigma, rho = fuzzy_graph(ids, distances)
    library, library_sigma, library_rho = fuzzy_simplicial_set(
        x, 4, np.random.RandomState(7), "euclidean",
        knn_indices=ids, knn_dists=distances,
        local_connectivity=1.0, set_op_mix_ratio=1.0)
    np.testing.assert_allclose(rho, library_rho, atol=2e-6)
    np.testing.assert_allclose(sigma, library_sigma, rtol=5e-5, atol=2e-6)
    np.testing.assert_allclose(graph.toarray(), library.toarray(), atol=3e-6)
    reducer = UMAP(n_neighbors=4, local_connectivity=1.0,
                   set_op_mix_ratio=1.0, init="random", n_epochs=100,
                   random_state=7, n_jobs=1).fit(x)
    np.testing.assert_allclose(graph.toarray(), reducer.graph_.toarray(), atol=3e-6)
    print("rho", np.round(rho, 4).tolist())
    print("sigma", np.round(sigma, 4).tolist())
    print("directed_row_0", np.round(directed.toarray()[0], 4).tolist())
    print("fuzzy_graph_max_error", f"{np.max(np.abs(graph.toarray() - library.toarray())):.2e}")
    y = np.array([[-1., 0.2], [-0.4, -0.3], [0.2, 0.1], [0.9, -0.2], [1.5, 0.4], [2.1, -0.1]])
    loss, gradient = full_pair_loss_gradient(y, graph)
    after, _ = full_pair_loss_gradient(y - 0.01 * gradient, graph)
    print("ideal_pair_loss_before_after", round(loss, 6), round(after, 6))
    print("sampled_head_after", np.round(sampled_edge_step(y, 0, 1, [4, 5], 0.01)[0], 6).tolist())


if __name__ == "__main__":
    main()
```

<!-- whole-output umapMechanism -->
```text
rho [0.7, 0.7, 1.2, 2.3, 2.7, 2.7]
sigma [3.0883, 1.9081, 1.2759, 2.1961, 3.8687, 7.8865]
directed_row_0 [0.0, 1.0, 0.678, 0.322, 0.0, 0.0]
fuzzy_graph_max_error 3.34e-08
ideal_pair_loss_before_after 7.991337 7.883388
sampled_head_after [-0.994246, 0.193755]
```

The maximum graph discrepancy3.34e−08 is for this six-row fixture under the recorded package version. It is evidence about the graph, not about every optimized coordinate. The ideal pair loss and sampled-head line refer to the separate layout calculations that we now open.

<!-- figure D23 -->

In the map, UMAP uses a curve $\nu(r)=1/(1+a r^{2b})$. The ordinary package fits $a,b$ from `min_dist` and `spread`; it does not simply substitute `min_dist` into an edge-length constraint. Small map distances have high membership. The fit uses a target curve that stays at 1 up to `min_dist`, then decays as $\exp[-(r-\mathrm{min\_dist})/\mathrm{spread}]$. It approximates this target with the two-parameter map curve; it does not forbid a pair from falling below `min_dist`. The transparent teaching curve fixes $a=b=1$, so $\nu=1/(1+r^2)$. It is marked as that curve, rather than advertised as the ordinary default fit.

<!-- figure D24 -->

For one unordered pair with graph membership $w=.625$, the ideal Bernoulli pair cost is

\[
\mathrm{CE}(w,\nu)=-w\log\nu-(1-w)\log(1-\nu).
\]

At $r=1,\nu=.5$, the cost isln2. At $r=2,\nu=.2$, it is approximately1.0895775. Differentiate with respect to the membership: the minimum has $\nu=w$. With $a=b=1$, that would require $r=\sqrt{(1-w)/w}=\sqrt{.6}$. This is the isolated pair's optimum; other edges share its endpoints and prevent every pair from choosing its own radius. Subtracting the constant Bernoulli entropy $H(w)$ turns this cross-entropy into KL between Bernoulli distributions, without changing its coordinate gradient.

The two contributions show the tradeoff: at radius 1 they are .433216988 attractive and .259930193 repulsive; at radius 2 they are 1.005898695 and .083678832. The sum at radius 2 is 1.089577527. For graph weight0, the absent-pair term prefers arbitrarily large separation; for weight1, the present-pair term prefers radius 0. For $0<w<1$, exact radius 0 has infinite absent-pair cost. Interpret endpoints by their limits instead of evaluating $0\log0$ directly.

Vary only this pair's radius in the investigation. Keep the attraction and repulsion terms visible together. The complete `full_pair_loss_gradient` in the retained graph source sums each unordered pair once, including pairs with zero graph membership. It uses row-wise offsets and $O(n^2q)$ work, without retaining a full coordinate-offset tensor. It refuses near-coincident pairs for this smooth reference calculation. Its7.991337→7.883388 stream is one exact full-pair gradient step on six declared coordinates, not an ordinary UMAP epoch.

<!-- figure D25 -->

The ordinary optimizer does not evaluate all absent pairs each epoch. It schedules positive graph edges and samples negative vertices. In the retained sampled function, a positive edge moves both endpoints; a negative event moves only its head. An event with the head as its own negative is skipped, a coincident negative contributes no displacement in this taught branch, repulsion uses a .001 stabilizer and each coordinate update is clipped. Later negative events see the head after its preceding updates. These operations matter as much as a name for the loss.

Consider a constructed edge occurring once per four elementary schedule slots. If a positive event displaces endpoints by $\delta$, its expected displacement is $\delta/4$. Multiplying the event by its weight .25 again gives $\delta/16$: double weighting. The finite enumeration below supplies a noise distribution explicitly. In this experiment one independent negative event happens per elementary slot; the ordinary UMAP negative schedule is tied to positive events, so their frequencies must be matched before comparing an expected field.

<!-- whole-code sampled_pair_events.py -->
```python
"""Finite event enumeration; not a stochastic UMAP fit or complete scheduler.

Run: python sampled_pair_events.py (NumPy). Supplied noise is explicit.
"""
import numpy as np


def positive_event(y, head, tail, rate):
    result = np.asarray(y, float).copy()
    delta = result[head] - result[tail]
    attraction = np.clip(-2 * delta / (1 + delta @ delta), -4, 4)
    result[head] += rate * attraction
    result[tail] -= rate * attraction
    return result


def negative_event(y, head, other, rate):
    result = np.asarray(y, float).copy()
    if head == other:
        return result
    delta = result[head] - result[other]
    squared = delta @ delta
    if squared > 0:
        result[head] += rate * np.clip(2 * delta / ((0.001 + squared) * (1 + squared)), -4, 4)
    return result


def expected_vector(y, head, tail, edge_frequency, noise_probability, rate):
    y, noise_probability = np.asarray(y, float), np.asarray(noise_probability, float)
    if (y.ndim != 2 or not np.isfinite(y).all() or noise_probability.shape != (len(y),)
            or np.any(noise_probability < 0) or not np.isclose(noise_probability.sum(), 1)
            or not 0 <= edge_frequency <= 1 or not np.isfinite(rate) or rate < 0):
        raise ValueError("Finite coordinates, valid event frequency/noise distribution/rate required")
    if not 0 <= head < len(y) or not 0 <= tail < len(y) or head == tail:
        raise ValueError("Choose distinct valid positive endpoints")
    positive = positive_event(y, head, tail, rate) - y
    negative = sum(probability * (negative_event(y, head, other, rate) - y)
                   for other, probability in enumerate(noise_probability))
    # One independent noise event per elementary slot in this experiment.
    # UMAP's actual negative schedule is conditional on positive events instead.
    return edge_frequency * positive + negative, positive, negative


def pair_score(y, first, second):
    delta = y[first] - y[second]
    return 1 / (1 + delta @ delta)


if __name__ == "__main__":
    y = np.array([[0.], [1.], [3.]])
    noise = np.array([0.25, 0.25, 0.5])
    expected, positive, negative = expected_vector(y, 0, 1, 0.25, noise, 0.1)
    print("positive", positive.tolist())
    print("expected negative", negative.tolist())
    print("expected vector", expected.tolist())
    print("positive frequency once versus twice", (0.25 * positive).tolist(), (0.25 ** 2 * positive).tolist())
    print("pair score", pair_score(y, 0, 1))
```

<!-- whole-output sampled_pair_events -->
```text
positive [[0.1], [-0.09999999999999998], [0.0]]
expected negative [[-0.028307987979135633], [0.0], [0.0]]
expected vector [[-0.003307987979135632], [-0.024999999999999994], [0.0]]
positive frequency once versus twice [[0.025], [-0.024999999999999994], [0.0]] [[0.00625], [-0.006249999999999999], [0.0]]
pair score 0.5
```

`positive_event` conserves the pair's total coordinate. `negative_event` does not move the sampled negative endpoint, so its field can move the centroid. The displayed expected vector averages events from one fixed starting state; a realized sequence updates that state between events. The `rate=0` case is exactly unchanged. A directed, asymmetric expected field need not be the gradient of one scalar objective. That is why the [True Loss analysis](https://arxiv.org/abs/2103.14608) studies the actual sampling procedure instead of treating the full-pair idealization as the complete implementation.

<!-- figure D26 -->

Local scale also helps explain what an ordinary UMAP map may fail to show. Compute a graph-weighted squared radius using two neighbors at distances 1 and3 with weights1 and.5. The weighted products are 1 and4.5; dividing their sum by 1.5 gives 11/3. Doubling both distances with weights fixed gives 44/3 and changes the log squared radius byln4, apart from a declared epsilon. This local graph-weighted scale is not a calibrated global probability density.

The densMAP extension attempts to retain local density information alongside neighborhood structure. The following scratch file exposes the radius calculation and supplies the complete ordinary densMAP call, including density weight, active fraction, variance shift and output radii. Its fitting function is source-only here; no new density map or stream is claimed.

<!-- whole-code local_density_radius.py -->
```python
"""Graph-weighted squared radius and complete source-only densMAP route.

Run scratch example: python local_density_radius.py (NumPy).
The densmap_route function requires the supplied CSV and umap-learn; no fit
is run by this main. Its returned radii follow the package convention.
"""
from pathlib import Path
import numpy as np


def radius(distances, weights, epsilon=1e-8):
    distances, weights = np.asarray(distances, float), np.asarray(weights, float)
    if (distances.ndim != 1 or weights.shape != distances.shape
            or not np.isfinite(distances).all() or not np.isfinite(weights).all()
            or np.any(distances < 0) or np.any(weights < 0)
            or weights.sum() <= 0 or not np.isfinite(epsilon) or epsilon <= 0):
        raise ValueError("Finite nonnegative distances/weights, positive total and epsilon required")
    products = weights * distances ** 2
    mean_squared = float(products.sum() / weights.sum())
    return dict(products=products, weight_sum=float(weights.sum()),
                mean_squared=mean_squared, log_radius_squared=float(np.log(epsilon + mean_squared)))


def densmap_route(csv_path):
    from umap import UMAP
    data = np.loadtxt(Path(csv_path), delimiter=",", skiprows=1)
    x = data[:, 2:] / 16.0
    model = UMAP(n_neighbors=15, n_components=2, min_dist=0.1, spread=1.0,
                 metric="euclidean", init="spectral", random_state=7,
                 transform_seed=7, n_jobs=1, densmap=True, dens_lambda=2.0,
                 dens_frac=0.3, dens_var_shift=0.1, output_dens=True)
    coordinates, input_log_radius, map_log_radius = model.fit_transform(x)
    return model, coordinates, input_log_radius, map_log_radius


if __name__ == "__main__":
    original = radius([1, 3], [1, 0.5])
    enlarged = radius([2, 6], [1, 0.5])
    print("original", {key: value.tolist() if isinstance(value, np.ndarray) else value for key, value in original.items()})
    print("enlarged", {key: value.tolist() if isinstance(value, np.ndarray) else value for key, value in enlarged.items()})
    print("log shift", enlarged["log_radius_squared"] - original["log_radius_squared"])
```

<!-- whole-output local_density_radius -->
```text
original {'products': [1.0, 4.5], 'weight_sum': 1.5, 'mean_squared': 3.6666666666666665, 'log_radius_squared': 1.2992829868575335}
enlarged {'products': [4.0, 18.0], 'weight_sum': 1.5, 'mean_squared': 14.666666666666666, 'log_radius_squared': 2.6855773459319696}
log shift 1.386294359074436
```

The scratch stream calculates only two local radius cases. `densmap_route` would return a model, an $n\times2$ coordinate array and two length-$n$ log-radius arrays. Package code also uses graph orientation, neighbor distances and epsilon, so the simple two-neighbor calculation teaches the quantity rather than claiming every stored package value is identical. `dens_lambda` changes the density term's weight, `dens_frac` its active optimization fraction and `dens_var_shift` its variance stabilizer. A larger `min_dist` changes the map curve and appearance; it does not alone guarantee faithful density.

The inspected [UMAP source](https://umap-learn.readthedocs.io/en/latest/_modules/umap/umap_.html) returns cached results when the input matches its training data before reaching the densMAP new-input refusal. Thus `transform(training_rows)` can succeed while `transform(new_rows)` is unsupported. This is an API boundary, not a contradiction. The density radius/API explanation is supported by implementation and creator descriptions; the full densMAP paper's inaccessible derivation and biomedical conclusions are outside this lesson's established proof scope.

## 7. Compare real maps through the same records

The constructed rows exposed each method's operations. Return now to the optical digits: do those operations keep useful relationships in a measured collection?

<!-- figure D27 -->

The paired plots show all 300 source IDs in input-informed inspection and in saved PCA, t-SNE and UMAP maps. Coordinate axes keep equal aspect ratio within each map. Map scale and orientation can differ between methods; the plots do not use inter-map distances as a statistic. A label overlay identifies the recorded digits only after fitting. Local styles can mix or separate without proving a clustering, classification or density result.

The first ordinary program loads all 64 features, divides by 16, excludes self in its neighbor lists and computes mean retention. PCA fits two components using a full singular value decomposition (SVD). Each t-SNE call uses PCA initialization, automatic learning rate,1000 iterations, Barnes–Hut forces, angle.5 and seed 7. The returned coordinate CSV keeps ID and label columns next to the map coordinates. `n_jobs=1` governs the neighbor operation; the retained execution also records its BLAS/OpenMP thread context. A seed alone does not standardize every floating-point implementation.

<!-- whole-code inspect_digits.py -->
```python
import numpy as np
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE, trustworthiness
from sklearn.metrics import pairwise_distances

data = np.loadtxt("digits-300.csv", delimiter=",", skiprows=1)
source_row, labels = data[:, 0].astype(int), data[:, 1].astype(int)
X = data[:, 2:] / 16.0

def neighbors(points, k):
    distances = pairwise_distances(points)
    np.fill_diagonal(distances, np.inf)
    return np.argsort(distances, axis=1, kind="stable")[:, :k]

def retention(X, Y, k):
    return np.mean([len(set(a) & set(b)) / k
                    for a, b in zip(neighbors(X, k), neighbors(Y, k))])

layouts = {"PCA": PCA(n_components=2, svd_solver="full").fit_transform(X)}
for perplexity in (5, 30, 80):
    layouts[f"t-SNE p={perplexity}"] = TSNE(
        perplexity=perplexity, init="pca", learning_rate="auto",
        max_iter=1000, random_state=7, method="barnes_hut",
        angle=0.5, n_jobs=1).fit_transform(X)

for name, Y in layouts.items():
    print(name, f"R10={retention(X, Y, 10):.4f}",
          f"T10={trustworthiness(X, Y, n_neighbors=10):.4f}")
    np.savetxt(name.replace(" ", "_") + ".csv",
               np.column_stack((source_row, labels, Y)), delimiter=",")
```

<!-- whole-output digitsAudit -->
```text
PCA R10=0.3763 T10=0.8676
t-SNE p=5 R10=0.7103 T10=0.9874
t-SNE p=30 R10=0.7703 T10=0.9901
t-SNE p=80 R10=0.7623 T10=0.9894
```

These are retained results for these exact data and settings: PCA $R_{10}=.376333$, t-SNE perplexity 5 .710333,30 .770333 and80 .762333. They establish a comparison within this audit, rather than a universal preferred perplexity. The library trustworthiness values in the stream use its own ranking convention. The new source-ID audit in §3 preserves retention but reports tiny rank differences separately.

The ordinary UMAP program constructs a15-neighbor graph with `min_dist=.1`, `spread=1`, Euclidean metric, spectral initialization, seed 7 and transform seed 7. It returns300×2 coordinates. Its fit remains unsupervised: labels do not appear in the call.

<!-- whole-code inspect_umap.py -->
```python
import numpy as np
import umap
from sklearn.manifold import trustworthiness
from sklearn.metrics import pairwise_distances

data = np.loadtxt("digits-300.csv", delimiter=",", skiprows=1)
X = data[:, 2:] / 16.0
reducer = umap.UMAP(n_neighbors=15, min_dist=0.1, spread=1.0,
                    n_components=2, metric="euclidean", init="spectral",
                    random_state=7, transform_seed=7, n_jobs=1)
Y = reducer.fit_transform(X)
distances = pairwise_distances(X)
np.fill_diagonal(distances, np.inf)
input_neighbors = np.argsort(distances, axis=1, kind="stable")[:, :10]
map_distances = pairwise_distances(Y)
np.fill_diagonal(map_distances, np.inf)
map_neighbors = np.argsort(map_distances, axis=1, kind="stable")[:, :10]
R10 = np.mean([len(set(a) & set(b)) / 10
               for a, b in zip(input_neighbors, map_neighbors)])
print(umap.__version__, Y.shape)
print(f"R10={R10:.4f} T10={trustworthiness(X, Y, n_neighbors=10):.4f}")
np.savetxt("umap-digits.csv", np.column_stack((data[:, :2], Y)), delimiter=",")
```

<!-- whole-output umapFit -->
```text
0.5.12 (300, 2)
R10=0.7143 T10=0.9890
```

Its retained $R_{10}=.714333$ falls between the PCA and t-SNE30 values, but the average is only the beginning of an inspection.

<!-- figure D28 -->

Source30 demonstrates why. Its input list is[0,166,229,160,36,276,140,266,178,79]. PCA's map list is[78,229,79,306,276,0,130,266,132,166]; six records agree. The t-SNE30 map list is[0,276,266,286,256,130,48,166,229,10]; five agree. For this query, PCA's .6 exceeds t-SNE's .5 despite the reverse collection averages. Read the missing and newly introduced IDs beside their images, then inspect whether the pixel metric itself fits your question about handwriting.

The saved-map investigation offers a map selector, an existing source ID and audit $k$. It displays the current map, input/map image strips, common/missing/new edges, local fraction and collection scores simultaneously. It loads the saved full-precision arrays and recomputes the chosen audit; it does not fit a new map when a control changes. Reset returns source30, $k=10$ and the stated initial pair. Invalid source IDs leave the last valid view visible with a precise message. No rounded scatter coordinates enter the ranking.

<!-- figure D29 -->

Sensitivity deserves an actual changed case. For this dataset, PCA-initialized t-SNE seed 7 and19 produced identical saved coordinates at each of perplexities 5,30,80. That is a null seed comparison, not a general invariance theorem. The retained random-initialized perplexity 30 maps differ: their $R_{10}$ values are .772000 and.769667. Show the identical and changed pairs side by side. Translating, rotating or reflecting one map leaves its Euclidean neighbor relationships unchanged, even though its coordinate table changes. Changing initialization can alter those relationships.

Practical inspection therefore starts with a stated input metric and several scales, examines individual records, repeats justified settings and compares with a linear baseline. Cluster area, separation and placement on a t-SNE/UMAP plot are consequences of its construction and sampling as well as the input. Use original-space evidence and the [clustering evaluation lesson](/learn/machine-learning/clustering-evaluation-validation-silhouette-ari-nmi) when the question is whether named groups are supported. The [Distill guide](https://distill.pub/2016/misread-tsne/) provides additional visual examples of parameter sensitivity and misleading area/gap interpretations.

## 8. Decide whether the next observation needs a fixed map

<!-- figure D30 -->

A map of one collection answers an inspection question. Prediction on future rows adds a state question: which fitted transformation will those rows use? Split the300 digit records into225 training and75 validation observations before fitting a representation. Fit a reducer on training features, transform validation features using that reducer, train a classifier in the training coordinate system and evaluate it in the same system. The diagram keeps training and validation IDs distinct through the entire route.

The retained programme compares raw normalized pixels, ten PCA coordinates and ten UMAP coordinates, each followed by five-neighbor classification. The reduction to ten coordinates is for this prediction experiment; it is separate from the two-dimensional inspection map.

<!-- whole-code compare_transforms.py -->
```python
import numpy as np
import umap
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier

data = np.loadtxt("digits-300.csv", delimiter=",", skiprows=1)
X, labels = data[:, 2:] / 16.0, data[:, 1].astype(int)
X_train, X_valid, y_train, y_valid = train_test_split(
    X, labels, test_size=0.25, stratify=labels, random_state=7)
representations = {"pixels": (X_train, X_valid)}
for name, reducer in {
    "PCA-10": PCA(n_components=10, svd_solver="full"),
    "UMAP-10": umap.UMAP(n_components=10, n_neighbors=15,
                         min_dist=0.1, random_state=7,
                         transform_seed=7, n_jobs=1)
}.items():
    train_coordinates = reducer.fit_transform(X_train)
    valid_coordinates = reducer.transform(X_valid)
    representations[name] = (train_coordinates, valid_coordinates)
for name, (train, valid) in representations.items():
    model = KNeighborsClassifier(n_neighbors=5).fit(train, y_train)
    print(name, f"accuracy={model.score(valid, y_valid):.4f}")
```

<!-- whole-output heldoutTransform -->
```text
pixels accuracy=0.9733
PCA-10 accuracy=0.9733
UMAP-10 accuracy=0.9467
```

The denominators matter: .9733 represents 73 correct of 75 for pixels and PCA, while .9467 represents 71 of 75 for UMAP. This validation result does not support a claim that the nonlinear representation improves classification here. If validation chooses settings, keep an untouched final test for the final generalization claim. If scaling estimates per-feature means or variances, fit that scaler on training rows too; the common division by 16 is a fixed measurement conversion.

<!-- figure D31 -->

PCA has a fitted mean and component matrix: new coordinates are $(x-\mu)V_q$. Ordinary UMAP instead searches the fixed reference's input neighbors, constructs query-to-reference memberships, initializes query coordinates near reference coordinates and optimizes their placement relative to that reference. It need not train a neural function. The scratch interpolation below makes the initialization idea visible: input query1 between references0 and3 gets inverse-distance weights2/3 and1/3, so reference map coordinates 0 and6 give initial coordinate2. This interpolation is not the complete UMAP transform algorithm.

scikit-learn's `TSNE` produces coordinates for the supplied collection and has no general `.transform` method. The optional openTSNE route fits a reference embedding and places future observations against it; this extension has its own affinity and optimization choices and is not the same API as fitting all rows together. The shown optional call is source-only and needs openTSNE installed. A supervised UMAP call supplies training labels to alter the graph, making it a different construction. A parametric UMAP encoder learns a function from input rows to coordinates; encoder training belongs to the linked [deep learning module](/learn/deep-learning), rather than being implied by ordinary graph-based transform.

<!-- whole-code reference_map_routes.py -->
```python
"""Train-only representation routes and explicit reference interpolation.

Source-only fitting functions: NumPy, sklearn 1.9.1, umap-learn 0.5.12.
The optional openTSNE route needs that additional package; no result claimed.
Run scratch interpolation only: python reference_map_routes.py.
"""
from pathlib import Path
import numpy as np


def reference_interpolation(query, references, coordinates, k=2):
    references, coordinates, query = np.asarray(references, float), np.asarray(coordinates, float), np.asarray(query, float)
    if (references.ndim != 2 or coordinates.ndim != 2 or len(references) != len(coordinates)
            or query.shape != (references.shape[1],) or not 1 <= k <= len(references)
            or not all(np.isfinite(z).all() for z in (references, coordinates, query))):
        raise ValueError("Matched finite references/coordinates, one query and valid k required")
    distances = np.linalg.norm(references - query, axis=1)
    chosen = np.lexsort((np.arange(len(distances)), distances))[:k]
    zeros = distances[chosen] == 0
    if zeros.any():
        weights = zeros.astype(float) / zeros.sum()
    else:
        inverse = 1 / distances[chosen]
        weights = inverse / inverse.sum()
    return weights @ coordinates[chosen], chosen, weights


def data_split(csv_path):
    from sklearn.model_selection import train_test_split
    data = np.loadtxt(Path(csv_path), delimiter=",", skiprows=1)
    ids, labels, x = data[:, 0].astype(int), data[:, 1].astype(int), data[:, 2:] / 16.0
    train, valid = train_test_split(np.arange(len(x)), test_size=0.25,
                                  stratify=labels, random_state=7)
    return ids, labels, x, train, valid


def ordinary_pipeline(csv_path):
    from sklearn.decomposition import PCA
    from sklearn.neighbors import KNeighborsClassifier
    from umap import UMAP
    ids, labels, x, train, valid = data_split(csv_path)
    representations = {"pixels": (x[train], x[valid])}
    reducers = {"PCA-10": PCA(n_components=10, svd_solver="full"),
                "UMAP-10": UMAP(n_components=10, n_neighbors=15, min_dist=0.1,
                                random_state=7, transform_seed=7, n_jobs=1)}
    for name, reducer in reducers.items():
        train_coordinates = reducer.fit_transform(x[train])
        valid_coordinates = reducer.transform(x[valid])
        representations[name] = (train_coordinates, valid_coordinates)
    results = {}
    for name, (training, validation) in representations.items():
        classifier = KNeighborsClassifier(n_neighbors=5).fit(training, labels[train])
        predicted = classifier.predict(validation)
        results[name] = dict(correct=int(np.count_nonzero(predicted == labels[valid])),
                             denominator=len(valid), predictions=predicted)
    return ids[train], ids[valid], reducers, results


def optional_opentsne(csv_path):
    from openTSNE import TSNE
    _, _, x, train, valid = data_split(csv_path)
    reference = TSNE(n_components=2, perplexity=30, initialization="pca",
                     random_state=7, n_jobs=1).fit(x[train])
    placed = reference.transform(x[valid], perplexity=5, initialization="median")
    return reference, placed


def supervised_umap(csv_path):
    from umap import UMAP
    _, labels, x, train, valid = data_split(csv_path)
    reducer = UMAP(n_components=2, n_neighbors=15, target_metric="categorical",
                   target_weight=0.5, random_state=7, transform_seed=7, n_jobs=1)
    training = reducer.fit_transform(x[train], y=labels[train])
    future = reducer.transform(x[valid])
    return reducer, training, future


if __name__ == "__main__":
    mapped, selected, weights = reference_interpolation([1.], [[0.], [3.]], [[0.], [6.]])
    print("neighbors,weights,placed", selected.tolist(), weights.tolist(), mapped.tolist())
```

<!-- whole-output reference_map_routes -->
```text
neighbors,weights,placed [0, 1] [0.6666666666666666, 0.3333333333333333] [2.0]
```

`data_split` splits row indices so IDs, labels and features remain joined. `ordinary_pipeline` stores fitted reducers and predictions with an integer correct count and denominator. Its fitting functions are complete source-only routes; the stream here runs only scratch interpolation. Rebuilding an independent validation map does not preserve a shared coordinate system, even with the same seed. Save and reuse preprocessing and reducer state when that is the task.

In the optional [openTSNE1.0.0 API](https://opentsne.readthedocs.io/en/stable/api/index.html), `fit` returns a reference embedding and its `transform` supports the shown perplexity 5 and median initialization. Each new point is optimized against that reference, independently of the other new points. Initialization's neighbor count and optimization perplexity have different roles. This source-only route does not establish matched installed dependencies, returned coordinates or predictive quality.

<!-- figure D32 -->

The scale diagram opens actual allocations. A dense float64 $n\times n$ matrix occupies $8n^2$ bytes:800 MB at 10,000 observations,80 GB at 100,000 and2 TB at 500,000, all decimal units and before additional matrices. An $n\times n\times D$ offset tensor multiplies that burden by feature count. A sparse graph with $k$ edges per row can keep adjacency proportional to $nk$; later dense shortest-path or eigen matrices can still dominate. The row-wise audit in §3 trades time for $O(n)$ distance workspace.

<!-- figure D33 -->

Three approximations act on different objects. Approximate nearest-neighbor search proposes input neighbors for graph or affinity construction. Barnes–Hut groups distant map points in a tree to approximate repulsive forces. Fast Fourier transform (FFT) based t-SNE interpolates force-related quantities onto a grid and accelerates their convolution. Neither a tree nor a grid replaces the definition of the input metric. A schematic box is labelled as a spatial cell, with contained point IDs and its summary; it is not presented as a measured runtime benchmark. Choose approximation accuracy against the relationship you need to retain, and disclose settings. No universal timing or accuracy advantage follows from naming one method.

We now know the practical boundaries of the two nonlinear maps. The next section opens the alternative objects introduced in §3, so you can recognize when a different preservation question is a better fit.

## 9. Deeper branch: distances, recipes, smoothness and tangent patches

### Recover coordinates from distances

<!-- figure D34 -->

Put A0, B2 and C5 on a line. Their distance table is symmetric, has zero diagonal and contains AB2, BC3, AC5. We can recover centered coordinates without being given the original line: square the distances, subtract row and column means, add the grand mean and multiply by −1/2. The diagram follows one table entry through these operations into a centered inner-product table.

Why does this work? Squared Euclidean distance satisfies $d_{ij}^2=\|x_i\|^2+\|x_j\|^2-2x_i^Tx_j$. Multiplying on both sides by the centering matrix $J=I-\mathbf1\mathbf1^T/n$ removes terms that are constant across a row or column. The remaining matrix is

\[
B=-\tfrac12 J D^{\circ2}J=X_cX_c^T
=\frac19\begin{bmatrix}49&7&-56\\7&1&-8\\-56&-8&64\end{bmatrix}.
\]

Here $D^{\circ2}$ means entrywise squared dissimilarities, while feature count $D$ earlier was a scalar; the table's superscript and surrounding context distinguish them. An eigenfactorization $B=U\Lambda U^T$ gives coordinates $Y=U_q\Lambda_q^{1/2}$ from the positive eigenvalues. The three centered line coordinates are[−7/3,−1/3,8/3] up to a common reflection, and the one positive eigenvalue is 38/3. Comparing signed coordinates would falsely reject a reflected but equivalent answer; compare pair distances or $YY^T$.

For a concrete double-centering entry, the squared-distance row means are 29/3,13/3,34/3 and the grand mean is 76/9. Entry AB becomes $-\frac12(4-29/3-13/3+76/9)=7/9$. The centered coordinate product $(−7/3)(−1/3)=7/9$ agrees. This links one measured length to one inner product before the eigensolver is called.

The connection to PCA is exact for Euclidean input distances. If centered features have singular value decomposition $X_c=U\Sigma V^T$, then $B=X_cX_c^T=U\Sigma^2U^T$. Classical MDS coordinates $U_q\Sigma_q$ are therefore the PCA scores $X_cV_q$, up to choices of signs and bases within tied modes. A non-Euclidean dissimilarity table need not have that feature-matrix interpretation.

<!-- figure D35 -->

Not every symmetric nonnegative table is Euclidean. Distances AB1, BC1, AC3 violate the triangle inequality. Their centered Gram has eigenvalues4.5,0,−5/6; no exact real Euclidean factor can keep the negative mode. Keeping only positive modes gives an approximation. Even a Euclidean table may need more than the requested $q$ positive directions. Classical MDS minimizes a Gram-matrix approximation, commonly called strain; it is not the same criterion as raw distance stress.

Metric MDS instead adjusts coordinates to reduce raw stress $\sigma(Y)=\sum_{i<j}(\|y_i-y_j\|-d_{ij})^2$. Each unordered pair appears once. The small SMACOF route computes current distances, forms off-diagonal coefficients $B_{ij}(Y)=-d_{ij}/\|y_i-y_j\|$, balances each diagonal to make row sums zero, then updates $Y\leftarrow B(Y)Y/n$ for equal complete-pair weights. This majorization step bounds the objective by a simpler function whose minimum can be computed; descending that bound does not increase the original stress under the standard complete metric setting. Zero current distances get ratio0 in this reference, keeping it finite but potentially trapping a coincident start. Start with separated coordinates when positive targets need separation.

Stress squares a residual of **lengths**: first compute $r_{ij}=\|y_i-y_j\|$, subtract the supplied length $d_{ij}$, then square $r_{ij}-d_{ij}$. It is not $(r_{ij}^2-d_{ij}^2)^2$. Classical strain instead compares the centered Gram entries through $\|B-YY^T\|_F^2$. Stress-1 further divides the length-residual sum by a declared squared-map-length sum before taking a square root; these are three separately named quantities.

Nonmetric MDS has another unknown: monotone fitted disparities in place of the numeric dissimilarities. For ordered dissimilarities1,2,5, fitted disparities may preserve their order without preserving those exact gaps. For example1,3,4 preserves the ordering while changing relative spacings. An ordinary nonmetric optimizer alternates monotone regression with coordinate updates under its normalization. It is useful when only ordering is defensible; it does not make an arbitrary triangle table Euclidean or prove a good two-dimensional solution.

We provide full classical and metric scratch implementations. The ordinary branch uses current scikit-learn1.9.1: `ClassicalMDS(metric='precomputed')` does double-centering, while `MDS(metric_mds=True, metric='precomputed')` runs metric stress optimization. Pass exactly the same[[-1],[0],[1]] starting array to scratch and to `fit_transform(..., init=initial)` before comparing stress. The array overrides the constructor's random start and reduces the comparison to one trajectory. Library stopping tolerances differ from our relative raw-stress stopping rule, so compare attained distances/stress and status, not identical iteration counts.

<!-- whole-code classical_geometry.py -->
```python
"""Double-centering and metric SMACOF for small dense dissimilarities.

Run: python classical_geometry.py. NumPy; ordinary route needs sklearn 1.9.1.
The ordinary route is callable, never run implicitly by the scratch example.
"""
import numpy as np


def dissimilarities(d):
    d = np.asarray(d, dtype=float)
    if (d.ndim != 2 or d.shape[0] != d.shape[1] or len(d) < 2
            or not np.isfinite(d).all() or np.any(d < 0)
            or not np.allclose(d, d.T, rtol=0, atol=1e-12)
            or not np.allclose(np.diag(d), 0, rtol=0, atol=1e-12)):
        raise ValueError("Need finite symmetric nonnegative distances, zero diagonal")
    return d


def classical_mds(d, q=2):
    d = dissimilarities(d)
    if not 1 <= q < len(d):
        raise ValueError("q must be between 1 and n-1")
    squared = d * d
    b = -0.5 * (squared - squared.mean(axis=0)[None, :]
                - squared.mean(axis=1)[:, None] + squared.mean())
    values, vectors = np.linalg.eigh(b)
    order = np.argsort(values)[::-1]
    values, vectors = values[order], vectors[:, order]
    cutoff = np.finfo(float).eps * len(d) * max(1.0, np.max(np.abs(values)))
    chosen = np.flatnonzero(values > cutoff)[:q]
    y = vectors[:, chosen] * np.sqrt(values[chosen])
    return y, values, b


def distances(y):
    # Dense output is required here; avoid an n x n x q offset tensor.
    squared = (y * y).sum(axis=1)
    return np.sqrt(np.maximum(squared[:, None] + squared[None, :] - 2 * y @ y.T, 0))


def stress(d, y):
    mapped = distances(y)
    upper = np.triu_indices(len(d), 1)
    raw = float(np.sum((mapped[upper] - d[upper]) ** 2))
    denom = float(np.sum(mapped[upper] ** 2))
    return raw, np.sqrt(raw / denom) if denom > 0 else np.nan


def metric_smacof(d, initial, max_iter=300, tolerance=1e-9):
    d, y = dissimilarities(d), np.asarray(initial, dtype=float).copy()
    if y.ndim != 2 or len(y) != len(d) or not np.isfinite(y).all():
        raise ValueError("Initial coordinates need one finite row per distance row")
    y -= y.mean(axis=0)
    previous, _ = stress(d, y)
    history = [previous]
    for _ in range(max_iter):
        mapped = distances(y)
        # The zero rule keeps this majorization step finite; it is not a
        # promise that a coincident start can separate every positive target.
        ratios = np.divide(d, mapped, out=np.zeros_like(d), where=mapped > 0)
        b = -ratios
        np.fill_diagonal(b, 0)
        np.fill_diagonal(b, -b.sum(axis=1))
        candidate = b @ y / len(d)
        candidate -= candidate.mean(axis=0)
        value, _ = stress(d, candidate)
        history.append(value)
        y = candidate
        if abs(previous - value) <= tolerance * max(1.0, previous):
            return y, np.array(history), "converged"
        previous = value
    return y, np.array(history), "iteration-limit"


def ordinary(d, initial):
    from sklearn.manifold import ClassicalMDS, MDS
    d = dissimilarities(d)
    classical = ClassicalMDS(n_components=1, metric="precomputed").fit_transform(d)
    reducer = MDS(n_components=1, metric_mds=True, metric="precomputed",
                  init="random", n_init=1, random_state=7, max_iter=300,
                  eps=1e-6, normalized_stress=False, n_jobs=1)
    metric = reducer.fit_transform(d, init=np.asarray(initial, dtype=float))
    nonmetric = MDS(n_components=1, metric_mds=False, metric="precomputed",
                   init="random", n_init=1, random_state=7, max_iter=300,
                   eps=1e-6, normalized_stress=True, n_jobs=1)
    nonmetric_coordinates = nonmetric.fit_transform(d, init=np.asarray(initial, dtype=float))
    return classical, metric, reducer.stress_, nonmetric_coordinates, nonmetric.stress_


if __name__ == "__main__":
    x = np.array([[0.], [2.], [5.]])
    d = distances(x)
    y, eigenvalues, b = classical_mds(d, 1)
    fitted, history, status = metric_smacof(d, [[-1.], [0.], [1.]])
    print("B", b.tolist())
    print("eigenvalues", eigenvalues.tolist())
    print("classical distances", distances(y).tolist())
    print("metric stress,status", stress(d, fitted), status)
```

<!-- whole-output classical_geometry -->
```text
B [[5.444444444444444, 0.7777777777777777, -6.222222222222222], [0.7777777777777777, 0.11111111111111072, -0.8888888888888888], [-6.222222222222222, -0.8888888888888888, 7.111111111111112]]
eigenvalues [12.666666666666668, 9.346811506443043e-16, -9.346811506443043e-16]
classical distances [[0.0, 1.9999999999999993, 5.0], [1.9999999999999993, 0.0, 3.0000000000000013], [5.0, 3.0000000000000013, 0.0]]
metric stress,status (0.0, np.float64(0.0)) converged
```

The newly executed scratch example attains raw stress0 for the0,2,5 line. The ordinary functions in this file are source-only, not an executed parity claim. In this complete-table convention, Stress-1 is $\sqrt{\sigma/\sum_{i<j}\|y_i-y_j\|^2}$ when its denominator is positive; the package reports raw stress with `normalized_stress=False` and normalized stress with `True`. Nonmetric normalization is tied to fitted disparities and its implementation. Do not compare raw stress and Stress-1 as if they shared units.

Duplicate A0, B0, C2 are a revealing boundary: zero AB is an observed distance for classical or metric MDS. In the ordinary nonmetric route, zero dissimilarities are treated as missing. The same table therefore means something different. Current `metric_mds` chooses metric/nonmetric behavior; `metric` describes input distance handling. Older boolean `metric` and `dissimilarity` spellings remain deprecated compatibility paths in 1.9, with removal planned for 1.10. Their existence does not establish a historical failure. The optional `init='classical_mds'` deliberately chooses a different starting policy. See the [current MDS documentation](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.MDS.html).

Double-centering stores $O(n^2)$ entries, and a dense full eigendecomposition takes $O(n^3)$ work. Our function returns all eigenvalues so approximation and unresolved rank are inspectable; it may return fewer than $q$ columns when fewer positive modes exist. The full dense eigenroute belongs to these small fixtures. Large solvers select modes iteratively and still need a justified distance representation.

<!-- figure D36 -->

Isomap feeds graph-route distances to that coordinate recovery. The radius 1 U graph's route table has $d_{ij}=|i-j|$. Its one-dimensional centered coordinates are −3,−2,−1,0,1,2,3 up to reflection. This is why the U unfolds into a line. The complete `isomap_routes.py` in §2 performs this composition only when every route is finite. Infinity is neither an ordinary distance nor a zero edge. A repaired disconnected ordinary graph answers a modified question; inspect its components and repair before interpreting its output. Dense all-pairs routes and dense MDS remain costs even when the initial graph is sparse.

### Keep a local recipe instead of every distance

<!-- figure D37 -->

LLE starts with a recipe. Put a query at 1 between neighbors0 and3. If weights sum1 and reconstruct the query, $0w_L+3w_R=1$, so $w_L=2/3,w_R=1/3$. Move those neighbors to map positions0 and6; the same recipe places the query at 2. In the investigation, change only its map coordinate and see the squared reconstruction error;2 is its minimum. The adjacent static extrapolation case changes the input query to 4 and shows how the recipe itself changes; it is separate from the live map-coordinate control.

An affine recipe permits negative weights. Query4 with neighbors0 and3 has weights−1/3 and4/3. It lies beyond its neighbors; clipping those weights would replace the optimization with a different rule. Sum1 is essential: adding the same translation to every coordinate then preserves the recipe. Unlike fuzzy memberships or conditional probabilities, these weights are not constrained to[0,1].

<!-- figure D38 -->

For one general query $x_i$, make rows $z_j=x_j-x_i$ for its $k$ neighbors and form the small local Gram $C=ZZ^T\in\mathbb R^{k\times k}$. Minimizing reconstruction error under $\sum_jw_j=1$ gives $Cu=\mathbf1$, then $w=u/(\mathbf1^Tu)$. A trace-relative diagonal ridge stabilizes a singular or nearly singular Gram. Our explicit zero-trace policy gives equal weights to coincident neighbors; it is a stated fallback, not an inverse of a zero matrix.

Store all rows of recipes in sparse $W\in\mathbb R^{n\times n}$. A proposed map has total reconstruction error

\[
\sum_i\|y_i-\sum_jW_{ij}y_j\|^2
=\operatorname{tr}(Y^T M Y),\qquad M=(I-W)^T(I-W).
\]

Without constraints every $y_i=0$ wins. LLE excludes that collapse by requiring zero mean and $Y^TY/n=I_q$. The implementation first projects out the constant direction, then chooses the lowest remaining eigenmodes in that centered subspace. If extra zero modes remain because the recipes separate components, they carry component ambiguity; do not label them a unique global reconstruction.

<!-- whole-code lle_recipes.py -->
```python
"""Local affine recipes and a small centered LLE eigenproblem.

Run: python lle_recipes.py (NumPy, SciPy). Full eigenproblem is small/dense.
"""
import numpy as np
from scipy.sparse import csr_matrix


def recipe(query, neighbors, reg=1e-3):
    z = np.asarray(neighbors, float) - np.asarray(query, float)
    if z.ndim != 2 or not len(z) or not np.isfinite(z).all() or reg < 0:
        raise ValueError("Use a finite nonempty neighbor matrix and reg >= 0")
    gram = z @ z.T
    trace = float(np.trace(gram))
    if trace == 0:
        return np.full(len(z), 1 / len(z)), 0.0, "duplicate-uniform"
    regularized = gram + reg * trace * np.eye(len(z))
    u = np.linalg.solve(regularized, np.ones(len(z)))
    if abs(u.sum()) < np.finfo(float).eps * np.linalg.norm(u):
        raise ValueError("Cannot normalize this local recipe")
    weights = u / u.sum()
    return weights, float(np.linalg.norm(weights @ z) ** 2), "regularized" if reg else "unregularized"


def affine_line(query, left, right):
    if left == right:
        raise ValueError("Distinct line neighbors required")
    right_weight = (query - left) / (right - left)
    return np.array([1 - right_weight, right_weight])


def lle(x, k, q=1, reg=1e-3):
    x = np.asarray(x, float)
    n = len(x)
    if x.ndim != 2 or not np.isfinite(x).all() or not q < k < n or q < 1:
        raise ValueError("Need finite rows and 1 <= q < k < n")
    columns, values = [], []
    residuals = []
    for i in range(n):
        squared = np.sum((x - x[i]) ** 2, axis=1)
        order = np.lexsort((np.arange(n), squared))
        neighbors = order[order != i][:k]
        weights, residual, _ = recipe(x[i], x[neighbors], reg)
        columns.extend(neighbors)
        values.extend(weights)
        residuals.append(residual)
    w = csr_matrix((values, (np.repeat(np.arange(n), k), columns)), shape=(n, n))
    difference = np.eye(n) - w.toarray()
    m = difference.T @ difference
    # Project out the constant direction before selecting q modes.
    centering = np.eye(n) - np.ones((n, n)) / n
    # QR of a nonredundant centered basis avoids guessing which eigenvector
    # among repeated zeros is the constant vector.
    basis, _ = np.linalg.qr(centering[:, :-1], mode="reduced")
    eigenvalues, eigenvectors = np.linalg.eigh(basis.T @ m @ basis)
    y = np.sqrt(n) * basis @ eigenvectors[:, :q]
    return y, w, eigenvalues, np.array(residuals)


def ordinary(x, k=3, q=1, reg=1e-3):
    from sklearn.manifold import LocallyLinearEmbedding
    return LocallyLinearEmbedding(n_neighbors=k, n_components=q, reg=reg,
                                 method="standard", eigen_solver="dense",
                                 neighbors_algorithm="brute", n_jobs=1).fit_transform(x)


if __name__ == "__main__":
    print("interior", affine_line(1, 0, 3).tolist())
    print("extrapolated", affine_line(4, 0, 3).tolist())
    x = np.array([[0, 0], [1, 0.1], [2, 0.5], [3, 1.2], [4, 2.2]], float)
    y, w, values, residuals = lle(x, 3)
    print("row sums", np.asarray(w.sum(axis=1)).ravel().tolist())
    print("eigenvalues", values.tolist())
    print("centroid,covariance", y.mean(axis=0).tolist(), (y.T @ y / len(y)).tolist())
    print("local residuals", residuals.tolist())
```

<!-- whole-output lle_recipes -->
```text
interior [0.6666666666666667, 0.3333333333333333]
extrapolated [-0.33333333333333326, 1.3333333333333333]
row sums [1.0, 1.0, 1.0, 1.0, 1.0]
eigenvalues [1.6572796653923138e-05, 0.23870247224547986, 5.800203883605054, 11.552462892075402]
centroid,covariance [-1.3322676295501878e-16] [[1.0]]
local residuals [0.06555387410885571, 0.0006348757002949425, 0.0006083013309923255, 0.0010841969727884105, 0.08167080991100277]
```

The printed row sums, centroid and covariance check three distinct constraints. The curved five-point fixture's local residuals are not all zero; the ridge and finite neighborhoods change exact reconstruction. The ordinary `LocallyLinearEmbedding(method='standard', reg=..., eigen_solver='dense')` uses the same general local-recipe/global-eigen strategy, but neighbor ties, ridge details and eigen normalizations must match before comparing numerical answers. Repeated eigenvalues permit different basis vectors for the same subspace; compare projection matrices or reconstruction objectives instead of signed columns. `affine_line` gives the exact unregularized two-neighbor line example separately from the ridge solver.

Local Gram formation costs $O(nDk^2)$, local solves $O(nk^3)$, plus neighbor search. Storing $W$ costs $O(nk)$, while this small dense global solve costs $O(n^2)$ storage and $O(n^3)$ work. Sparse low-mode solvers are the scaling continuation; the method's name does not remove the eigenproblem. The [creator's LLE introduction](https://cs.nyu.edu/~roweis/lle/papers/lleintro.pdf) explains the local reconstruction and constrained eigen formulation.

### Make graph coordinates smooth

<!-- figure D39 -->

A different graph question asks connected records to have similar coordinates. For the unit chain A–B–C, set map coordinate $y=(0,1,3)$. The two unordered edges contribute $(0-1)^2+(1-3)^2=5$. Let $A$ be the symmetric weighted adjacency, $D_g$ its diagonal degree matrix and $L=D_g-A$. Expanding the quadratic gives

\[
y^TLy=\tfrac12\sum_{i,j}A_{ij}(y_i-y_j)^2
=\sum_{i<j}A_{ij}(y_i-y_j)^2.
\]

The ordered sum is 10; the quadratic energy is 5. Change only the middle coordinate in the live chain and watch both edge contributions and their sum. A constant coordinate has zero energy. Disconnected components each admit their own constant, so the number of zero modes equals the number of connected components. Removing just one constant mode is insufficient when there are several components.

Normalization poses another question. The unnormalized eigenproblem is $Lf=\lambda f$. A degree-weighted formulation is $Lf=\lambda D_gf$. The symmetric-normalized matrix is $D_g^{-1/2}LD_g^{-1/2}$; its eigenvectors become generalized vectors after multiplying by $D_g^{-1/2}$. Degree-zero vertices must be separated before that division. Our ordinary spectral call uses the package's normalized convention, rather than claiming equality to the unnormalized chain coordinates.

<!-- whole-code graph_spectrum.py -->
```python
"""Graph energies, three Laplacian conventions and diffusion coordinates.

Run: python graph_spectrum.py (NumPy, SciPy); no embedding estimator fit.
"""
import numpy as np
from scipy.linalg import eigh


def spectrum(adjacency):
    a = np.asarray(adjacency, float)
    if (a.ndim != 2 or a.shape[0] != a.shape[1] or not np.isfinite(a).all()
            or np.any(a < 0) or not np.allclose(a, a.T) or np.any(np.diag(a) != 0)):
        raise ValueError("Need finite symmetric nonnegative loop-free weights")
    degree = a.sum(axis=1)
    if np.any(degree == 0):
        raise ValueError("Separate isolated vertices before normalized division")
    d = np.diag(degree)
    l = d - a
    invroot = np.diag(1 / np.sqrt(degree))
    symmetric = invroot @ l @ invroot
    plain_values, plain_vectors = np.linalg.eigh(l)
    norm_values, norm_vectors = np.linalg.eigh(symmetric)
    generalized_values, generalized_vectors = eigh(l, d)
    return dict(A=a, degree=degree, L=l, plain=(plain_values, plain_vectors),
                symmetric=(norm_values, norm_vectors),
                generalized=(generalized_values, generalized_vectors), P=a / degree[:, None])


def diffusion_coordinates(adjacency, time=1, q=1):
    if not isinstance(time, int) or time < 0:
        raise ValueError("Use a nonnegative integer time")
    result = spectrum(adjacency)
    values, vectors = result["symmetric"]
    walk_values = 1 - values
    # For this teaching route remove all stationary modes; disconnected
    # components need separate interpretation rather than one global map.
    candidates = np.flatnonzero(np.abs(walk_values - 1) > 1e-10)
    selected = candidates[np.argsort(-np.abs(walk_values[candidates]), kind="stable")[:q]]
    right_vectors = vectors[:, selected] / np.sqrt(result["degree"])[:, None]
    return right_vectors * walk_values[selected] ** time, walk_values


def ordinary_spectral(adjacency, q=1):
    from sklearn.manifold import SpectralEmbedding
    return SpectralEmbedding(n_components=q, affinity="precomputed",
                             eigen_solver="arpack", random_state=7).fit_transform(adjacency)


if __name__ == "__main__":
    a = np.array([[0., 1., 0.], [1., 0., 1.], [0., 1., 0.]])
    result = spectrum(a)
    y = np.array([0., 1., 3.])
    start = np.array([1., 0., 0.])
    print("energy", float(y @ result["L"] @ y))
    print("one step", (start @ result["P"]).tolist())
    print("two steps", (start @ result["P"] @ result["P"]).tolist())
    print("plain eigenvalues", result["plain"][0].tolist())
    print("walk eigenvalues", diffusion_coordinates(a)[1].tolist())
```

<!-- whole-output graph_spectrum -->
```text
energy 5.0
one step [0.0, 1.0, 0.0]
two steps [0.5, 0.0, 0.5]
plain eigenvalues [9.996582244115599e-17, 1.0, 3.0]
walk eigenvalues [1.0, 0.0, -0.9999999999999998]
```

The complete file exposes adjacency construction, degrees, each matrix, its eigenproblem and the random-walk transition below. SciPy's `eigh(L,D_g)` supplies a numerical primitive; it does not build the graph for us. `SpectralEmbedding(affinity='precomputed')` accepts that declared adjacency and uses its documented normalized route. These ordinary calls are source-only here. Choosing graph support, weights, components and normalization is part of the method, not incidental plotting configuration.

### Estimate a local plane and align its neighbors

<!-- figure D40 -->

Return to the curved sheet's small patch. Subtract its mean from a neighborhood matrix $Z\in\mathbb R^{m\times D}$ and compute a thin SVD $Z=U\Sigma V^T$. Its first $q$ right singular vectors are tangent directions in input feature space; $ZV_q\in\mathbb R^{m\times q}$ gives local tangent coordinates. A planar patch has near-zero residual after reconstruction; a curved patch has nonzero normal residual. This is a local approximation, not proof of a globally flat manifold.

Our five-point surface is $(u,v,.1(u^2+v^2))$. Four corners have height.2 and the center has height0. The mean height is .16, so the two-axis tangent reconstruction leaves corner residual.04 and center residual.16. Its singular values are 2,2,.178885. Because the two leading values tie, any orthonormal basis of that tangent plane is equally valid. Compare the plane's projector, not one axis sign or rotation.

`patch` requests `full_matrices=False`, preserving only economy factors. If $m<D$, a full-right-factor request would materialize a $D\times D$ completion even though only a few tangent columns are useful. Economy SVD work depends on shape, approximately $O(mD\min(m,D))$; the full-right completion adds at least $\Omega(D^2)$ writes. Projection on $q$ chosen axes costs $O(mDq)$, not $O(mD^2)$ unless projecting onto a full feature basis. This distinction matters for wide data.

<!-- whole-code local_tangent_patch.py -->
```python
"""Thin local SVD, patch overlap and a second-order curvature stencil.

Run: python local_tangent_patch.py (NumPy). Ordinary variants are source-only.
"""
import numpy as np


def patch(points, q):
    points = np.asarray(points, float)
    if points.ndim != 2 or not np.isfinite(points).all() or not 1 <= q < min(points.shape):
        raise ValueError("Need a finite patch with 1 <= q < min(rows, columns)")
    center = points.mean(axis=0)
    centered = points - center
    _, singular, right = np.linalg.svd(centered, full_matrices=False)
    threshold = np.finfo(float).eps * max(centered.shape) * singular[0]
    if singular[q - 1] <= threshold:
        raise ValueError("Patch has fewer than q resolved tangent directions")
    axes = right[:q].T
    coordinates = centered @ axes
    reconstruction = coordinates @ axes.T + center
    return dict(center=center, axes=axes, singular=singular,
                coordinates=coordinates, residuals=np.linalg.norm(points - reconstruction, axis=1))


def overlap(first_coordinates, second_coordinates, first_ids, second_ids):
    shared = sorted(set(first_ids) & set(second_ids))
    if not shared:
        raise ValueError("Patches need shared source IDs")
    first = np.array([first_coordinates[list(first_ids).index(i)] for i in shared])
    second = np.array([second_coordinates[list(second_ids).index(i)] for i in shared])
    first -= first.mean(axis=0)
    second -= second.mean(axis=0)
    u, singular, vt = np.linalg.svd(first.T @ second, full_matrices=False)
    rotation = u @ vt
    return shared, rotation, np.linalg.norm(first @ rotation - second), singular


def second_difference(values, spacing):
    if spacing <= 0:
        raise ValueError("Spacing must be positive")
    left, center, right = np.asarray(values, float)
    return (left - 2 * center + right) / spacing ** 2


def ordinary_variant(points, method="ltsa", q=2, neighbors=8):
    from sklearn.manifold import LocallyLinearEmbedding
    if method not in {"ltsa", "hessian", "modified"}:
        raise ValueError("Choose a taught local variant")
    minimum = q * (q + 3) / 2 if method == "hessian" else q
    if not minimum < neighbors < len(points):
        raise ValueError("Neighborhood is too small for the requested local basis")
    return LocallyLinearEmbedding(n_neighbors=neighbors, n_components=q,
                                 method=method, eigen_solver="dense",
                                 random_state=7, n_jobs=1).fit_transform(points)


if __name__ == "__main__":
    # Coordinates span two axes; height is a declared curved surface.
    uv = np.array([[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]], float)
    points = np.column_stack((uv, 0.1 * np.sum(uv * uv, axis=1)))
    result = patch(points, 2)
    print("center", result["center"].tolist())
    print("singular", result["singular"].tolist())
    print("residuals", result["residuals"].tolist())
    print("quadratic second derivative", second_difference([0.1, 0, 0.1], 1))
```

<!-- whole-output local_tangent_patch -->
```text
center [0.0, 0.0, 0.16]
singular [2.0, 2.0, 0.17888543819998318]
residuals [0.04000000000000001, 0.04000000000000001, 0.16, 0.04000000000000001, 0.04000000000000001]
quadratic second derivative 0.2
```

`overlap` joins two patch coordinates by common source IDs, centers the shared records and finds an orthogonal alignment using the cross-product SVD. If overlap lacks independent directions, the alignment is underdetermined; singular values expose that boundary. Local tangent space alignment (LTSA) uses local tangent coordinates and globally aligns overlapping neighborhoods, rather than performing one isolated alignment. Hessian eigenmaps use second-order local structure; the stencil $(h(-1)-2h(0)+h(1))/1^2=.2$ shows what curvature contributes for our quadratic height. Modified LLE uses multiple local weights to address particular local reconstruction degeneracies. These are related local alternatives with different global constructions, not aliases for standard LLE.

For a runnable ordinary variant, supply the full300×64 feature matrix from the data loader and choose eight neighbors for requested dimension2. Hessian's necessary bound is $k>q(q+3)/2=5$, while8 also exceeds2 for LTSA/modified routes. The five-point patch above is the scratch tangent example and is deliberately too small for that eight-neighbor ordinary call. No variant fit is executed to produce its patch stream.

The ordinary `LocallyLinearEmbedding` variant call supplies method, neighborhood size, requested dimension and eigen solver. Hessian mode requires $k>q(q+3)/2$ for its local polynomial basis; LTSA and modified routes also need enough neighbors and rank. These necessary conditions do not guarantee a well-conditioned sampled manifold. The full local patch mechanism is taught here; complete scratch clones of every variant's global optimizer are not claimed. Their original-paper proof coverage is distinguished in the references below.

### Follow a walk, or preserve a hole

<!-- figure D41 -->

A graph route finds the shortest way to one destination. A random walk distributes probability across possible next steps. On the three-node unit chain, the transition matrix $P_{walk}=D_g^{-1}A$ sends A to B with probability 1, B to A/C with probability 1/2 each and C to B with probability 1. Starting at A, one step gives(0,1,0), then(.5,0,.5). No shortest-path distance table alone is this distribution.

Diffusion coordinates weight walk eigenmodes by $\lambda_l^t$ at a chosen time $t$. For an undirected positive-degree graph, the symmetric-normalized operator provides real modes that can be converted to right eigenvectors of the walk. The complete `diffusion_coordinates` function above removes stationary modes and ranks other modes by absolute eigenvalue. The chain has a−1 mode: without self loops the walk is periodic. A lazy transition $(I+P_{walk})/2$ would remove that particular alternation, but it is a changed walk and must be named. There is no scikit-learn `DiffusionMap` call invented here; the exact tiny walk and numerical eigensolver are the computational route.

<!-- figure D42 -->

Distances can also define a topological question. Put four distinct IDs at the corners of a unit square. A Vietoris–Rips complex at threshold $\epsilon$ includes edges for all pairs at distance at most $\epsilon$, and fills a simplex whenever all its pairwise edges are present. At1≤ε<√2 the four sides form an unfilled loop. At√2 the diagonals appear, the triangles and tetrahedron are filled, and that loop is gone. The drawing shows the faces, not just a cyclic wireframe.

Project onto the first coordinate. Two pairs of distinct IDs now coincide and the corresponding square loop is lost. This is a constructed linear projection counterexample, not a measured t-SNE or UMAP result. Neighborhood retention, graph connectivity, geodesic distances, density and topology are different preservation questions. A single attractive map or scalar neighbor score does not answer them all. Persistent-homology software and full proofs belong to a topology treatment; this finite complex establishes the limitation without implying that we ran one.

## 10. Deeper branch: derive the force and distinguish sampled objectives

<!-- figure D43 -->

Open the t-SNE objective's dependency graph. Input $P$ stays fixed. Coordinates determine squared separations, Student kernels $t_{ij}$, their ordered total $Z$, then $Q_{ij}=t_{ij}/Z$. Substituting into KL separates terms:

\[
C=\underbrace{\sum P_{ij}\log P_{ij}}_{\text{constant}}
-\sum P_{ij}\log t_{ij}+\log Z,
\]

because the ordered $P$ total is 1. For one endpoint, differentiating both orientations of a pair doubles its contribution. Also $\partial\log t_{ij}/\partial y_i=-2t_{ij}(y_i-y_j)$. The attractive term becomes $4\sum_jP_{ij}t_{ij}(y_i-y_j)$. Differentiating $\log Z$ gives the repulsive $−4\sum_jQ_{ij}t_{ij}(y_i-y_j)$. Adding them yields the gradient in §5. The factor4 therefore comes from the squared-distance derivative and the two ordered orientations; it is not a tunable learning rate.

Every pair's force on its two endpoints sums to zero, so the complete gradient has zero total over rows. Translating coordinates gives a null direction. A finite-difference probe of a coordinate should evaluate both perturbed costs with the same fixed $P$, and compare against this gradient at the original state. Testing only a lower final loss would not isolate the derivative's sign or normalization. The derivative tests one local operation; the final cost answers a separate question about a complete trajectory.

<!-- figure D44 -->

The complete small optimizer follows the four-point example to 200 updates. It searches each input row's beta for perplexity 2, symmetrizes the conditional matrix, computes all Student probabilities and KL, takes a gradient step of .5 and recenters. Its exact small scope makes each matrix inspectable. It allocates an $n\times n\times q$ map-offset tensor, so it is a tiny fixture implementation; the larger graph/audit routes above show how row-wise and sparse representations avoid analogous feature-sized allocations. Do not apply this full pair programme to a100,000-row collection.

<!-- whole-code tiny_tsne.py -->
```python
import numpy as np

X = np.array([0., 1., 3., 7.])[:, None]
n, perplexity = len(X), 2.0
conditional = np.zeros((n, n))
for i in range(n):
    others = np.arange(n) != i
    distances = np.sum((X[others] - X[i])**2, axis=1)
    lower, upper, beta = 0.0, np.inf, 1.0
    for _ in range(80):
        weights = np.exp(-beta * (distances - distances.min()))
        p = weights / weights.sum()
        positive = p > 0
        entropy = -np.sum(p[positive] * np.log(p[positive]))
        if abs(entropy - np.log(perplexity)) < 1e-10:
            break
        if entropy > np.log(perplexity):
            lower = beta
            beta = 2 * beta if np.isinf(upper) else (lower + upper) / 2
        else:
            upper = beta
            beta = (lower + upper) / 2
    conditional[i, others] = p
P = (conditional + conditional.T) / (2 * n)

def cost_and_gradient(Y):
    offsets = Y[:, None, :] - Y[None, :, :]
    kernel = 1 / (1 + np.sum(offsets**2, axis=2))
    np.fill_diagonal(kernel, 0)
    Q = kernel / kernel.sum()
    mask = P > 0
    cost = np.sum(P[mask] * np.log(P[mask] / Q[mask]))
    gradient = 4 * np.sum(((P - Q) * kernel)[:, :, None] * offsets, axis=1)
    return cost, gradient

Y = np.array([-1.5, -0.5, 0.5, 1.5])[:, None]
print(f"initial KL={cost_and_gradient(Y)[0]:.6f}")
for _ in range(200):
    _, gradient = cost_and_gradient(Y)
    Y -= 0.5 * gradient
    Y -= Y.mean(axis=0)
print(f"final KL={cost_and_gradient(Y)[0]:.6f}")
print(np.round(Y.ravel(), 6))
```

<!-- whole-output tinyTsne -->
```text
initial KL=0.053522
final KL=0.018227
[-1.775811 -0.759392  0.42237   2.112833]
```

The retained initial KL .053522 becomes.018227 after 200 steps, with coordinates[−1.775811,−.759392,.422370,2.112833]. Cost decreased for that run; it is not a certificate of the global minimum. Its row solver has a bounded80-step tolerance search, while the new row file in §4 reports tie and limit status more explicitly. Keep the original source and its output paired. A modified solver, momentum term or initialization is a new experiment with its own result, not a replacement provenance for the old stream.

<!-- figure D45 -->

There is a useful connection to contrastive learning. An edge-sampling experiment can ask a classifier to distinguish selected neighbor pairs from pairs drawn from a noise distribution. With a declared positive/negative ratio, noise law and score normalization, its optimum and expected updates can be derived. Noise-contrastive and normalized contrastive formulations make different choices about which pairs share a denominator. The drawing keeps positive pairs, sampled negative pairs, a score and the normalization set as distinct objects.

One declared calculation separates these choices. Query A at 0 has candidates B1 and C3, with Student scores .5 and .1. Normalizing over these two candidates gives B probability $5/6$ and negative log score $\log(6/5)\approx.182322$; adding a candidate changes that denominator. For a separate binary neighbor-versus-noise experiment, declare positive probabilities(A,B,C)=(0,5/6,1/6), noise probabilities(.25,.25,.5) and equal prior chances of a positive or noise event. Observing pair A/B then gives positive-class posterior $(5/6)/(5/6+.25)=10/13$ and loss $\log(13/10)\approx.262364$. Noise-contrastive estimation fits a model against an explicit noise law; normalized contrastive objectives such as InfoNCE compare a selected positive against a stated candidate set. The two computations need their own normalizer/noise law; neither number is asserted to be the ordinary UMAP trainer's loss.

The finite `sampled_pair_events.py` example from §6 exposes why the convention matters: the expected positive displacement is frequency-weighted, and head-only negatives are asymmetric. Research can derive a scalar surrogate under a specified symmetric convention; that does not make every asymmetric implementation field an exact gradient of that surrogate. The [attraction–repulsion analysis](https://arxiv.org/abs/2007.08902) compares regimes of neighbor embeddings, while [contrastive neighbor embeddings](https://arxiv.org/abs/2206.01816) studies objectives with explicit normalization choices. These links help explain implementation behavior. They do not establish an unconditional identity “UMAP equals t-SNE,” or transfer a performance claim to our digit collection without an experiment.

## 11. Practice: calculate, diagnose and transfer

Try a changed case before reading its hint and solution. Every answer states the relationship being preserved; a visually pleasing layout is not the success criterion.

### 1. A sparsely sampled sensor corridor

Points are(0,0),(0,2),(1,2),(2,2),(2,0). Build radius graphs at 1,2 and√5. What is the endpoint route, and does increasing radius recover the intended corridor?

Hint: inspect the direct endpoint chord before tracing the top of the corridor.

Solution: at 1 the two endpoints are isolated from the top, so no endpoint route exists. At2 the endpoints are connected directly with length 2; that edge remains at√5. No route can be shorter than the Euclidean endpoint distance 2, so2 is the shortest length at both larger radii. Sparse sampling failed to encode the intended corridor; increasing radius supplied a shortcut rather than proof of the physical route. Success means drawing the actual edges and distinguishing their graph from the intended surface.

### 2. Merge two events before measuring effective count

Compute perplexity for probabilities(1/2,1/4,1/8,1/8), then merge the last two events.

Hint: add the probabilities before computing the merged event's logarithm.

Solution: entropy is $1/2+1/2+3/8+3/8=1.75$ bits and perplexity $2^{1.75}\approx3.363586$. Merging gives(1/2,1/4,1/4), entropy 1.5 bits and perplexity√8≈2.828427. An effective count belongs to an actual event space; it is not preserved by merging distinct events.

### 3. Repair a misleading map report

A report says “six of eight neighbors survived, so trustworthiness is 99%.” Correct the statement and say what is missing.

Hint: retained fraction and intrusion rank penalty use different information.

Solution: six of eight gives a local retained fraction.75. It does not calculate $T_k$. To calculate trustworthiness you need $n,k$, each introduced neighbor's input rank and the stated tie convention, then the normalization. A collection average also leaves the distribution of local failures open. Show a poor local query alongside the average before making a practical claim.

### 4. Change a fuzzy edge

Two directed memberships are .2 and.6. Compute their union and the isolated $a=b=1$ pair optimum. Repeat after changing.6 to .9.

Hint: first combine memberships, then solve $1/(1+r^2)=w$.

Solution: unions are .2+.6−.12=.68 and.2+.9−.18=.92. Radii are√(8/17)≈.685994 and√(2/23)≈.294884. Stronger membership prefers a shorter isolated pair. These are ideal isolated optima, not coordinates from the ordinary sampled optimizer, where endpoints participate in many pairs.

### 5. Compare global distances with a local recipe

Input line positions are 0,3,7. Recover centered MDS coordinates. Find the middle point's affine weights and place it when the two neighbors move to −2 and12.

Hint: the middle coordinate is determined by sum1 and the input reconstruction.

Solution: the mean is 10/3, giving centered[−10/3,−1/3,11/3] up to reflection. Weights are 4/7 and3/7 because $7(3/7)=3$. The mapped middle is $−2(4/7)+12(3/7)=4$. On this exact line the descriptions agree; globally preserving all distances and preserving local recipes remain different objectives.

### 6. Repair future-data evaluation

A pipeline fits one scaler and UMAP on training rows, another scaler and UMAP on validation rows, then sends validation coordinates to the training classifier. Repair it.

Hint: identify which fitted state defines the classifier's coordinate system.

Solution: fit preprocessing and reducer on training rows only. Apply those fitted objects to validation rows, then evaluate the classifier fitted on the training representation. Two independent maps are not aligned merely by using the same seed. Compare raw-feature and PCA baselines. Choose settings on validation and reserve a final untouched test if a final generalization claim is needed.

### 7. Inspect an actual local reversal

For source30 and $k=10$, compare the printed input list with PCA and t-SNE30 lists. Calculate common, missing and introduced IDs, then repeat on another style of digit as an independent project.

Hint: use source-ID set differences, not class-label overlap.

Solution: PCA common{0,79,166,229,266,276}; missing{36,140,160,178}; new{78,130,132,306}. t-SNE common{0,166,229,266,276}; missing{36,79,140,160,178}; new{10,48,130,256,286}. Fractions are .6 and.5, reversing the global .376333/.770333 ranking. For the independent continuation, choose another existing source ID, two saved settings and $k\in\{5,10,20\}$, print both sets and inspect actual images. Success means an ID-joined explanation of changed neighbors under the unchanged pixel metric, including a local case that agrees with or contradicts the global order. A label-coloured plot alone is insufficient.

### 8. Modify the UMAP graph reference

In the six-point graph source, change $k=4$ to 3, then restore4. Predict which quantities must be recalculated. Separately multiply every input coordinate by 5. What stays unchanged, and what does learning rate 0 do?

Hint: separate support/target changes from common distance-scale changes.

Solution: changing $k$ changes selected support and target $\log_2k$, so rerun neighbor selection and scale calibration; a previously printed k4 graph is not a numeric answer for k3. Common scaling by 5 multiplies distances, rho, sigma and the distance-scale floor by 5, preserving memberships/union within search and floating-point tolerance when the same neighbors/ties remain. Given the same graph, map coordinates and negative IDs, the sampled update is unchanged; rate 0 preserves every coordinate. Verify with a newly modified programme when practising, retaining its own output rather than replacing the k4 stream.

### 9. Whitening can switch a neighbor

Query is the origin; PCA score vectors B=(2,0), C=(0,1), with retained eigenvalues(9,1). Which is closer before and after whitening?

Hint: squared whitened distance is $\sum_a\Delta z_a^2/\lambda_a$.

Solution: ordinary distances 2 and1 choose C. Whitened distances 2/3 and1 choose B. Whitening is feature-dependent scaling, unlike common division by 16. Positive retained eigenvalues are required; dividing by a zero mode is not meaningful.

### 10. Diagnose a bandwidth target

Distances are(1,1,3) and target perplexity 1.5. Is a positive finite width available?

Hint: take the narrow-width limit while preserving the tie.

Solution: the two nearest candidates share mass1/2 each, so the lower limiting perplexity is 2. The upper limit is 3. Target1.5 is infeasible. Return a domain message while preserving a last valid view; do not label an iteration limit a converged bandwidth.

### 11. An unmoved pair has a changed probability

Change map(0,1,3) to(0,1,2). Calculate the AB kernel, ordered total and probability in each state.

Hint: include AC/CA and BC/CB in the denominator.

Solution: AB kernel remains.5. Ordered totals are 1.6 and2.4, so probabilities are 5/16 and5/24. Normalization creates competition through all pairs, not just the selected pair.

### 12. Catch a double-weighted event

An edge of weight.25 occurs once per four elementary slots. Its per-event displacement is $\delta$. What expectation results from multiplying each event by .25 again?

Hint: frequency already supplies one factor.25.

Solution: correct positive expectation is $\delta/4$; extra event weighting makes $\delta/16$. The finite schedule is declared, not a universal ordinary UMAP frequency. To transfer the fix, locate whether an edge weight controls event timing, event magnitude or both in the actual implementation before changing it.

### 13. Test whether a distance table is Euclidean

AB1, BC1, AC3 define a symmetric zero-diagonal table. Can classical MDS realize it exactly?

Hint: inspect a triangle inequality before an eigensolver.

Solution:3>1+1, so no Euclidean realization exists. The centered Gram spectrum4.5,0,−5/6 confirms a negative direction. Clipping it gives approximate coordinates with changed distances; it is not a repair that makes the original table exact.

### 14. Use a negative recipe deliberately

Query4 has neighbors0 and3. Move those neighbors to −2 and7. Find weights and the query's new coordinate.

Hint: do not clip an affine coefficient just because it is negative.

Solution: weights−1/3 and4/3 sum1 and reconstruct4. The map coordinate is $−2(−1/3)+7(4/3)=10$. It extrapolates beyond7. Clipping and renormalizing would place it somewhere else and change the objective; common translation preserves the original recipe.

### 15. Count energy and null directions

For the unit chain and coordinates(0,1,3), compute unordered and ordered edge energy. Add a separate two-node component: how many constant null modes remain?

Hint: the quadratic includes a half of the ordered sum.

Solution: unordered energy1+4=5=yᵀLy; ordered sum10. Two components give two linearly independent component-constant null modes. Removing only one zero eigenvector leaves an arbitrary relative component direction.

### 16. Follow two diffusion steps

Start at A on the unit chain A–B–C with no self loops. Compute one-step and two-step probability distributions.

Hint: B splits its outgoing probability equally.

Solution: one step(0,1,0), two steps(.5,0,.5). The walk alternates parity and is periodic. Shortest paths do not directly give this distribution; adding a lazy self-loop changes the transition and should be stated.

### 17. Explain a density radius and an API boundary

Weights(1,.5) connect neighbors at distances(1,3). Calculate weighted squared radius, then double the distances. Does densMAP returning training coordinates establish new-row transform support?

Hint: separate a log-scale calculation from cached fitted state.

Solution: radius squared is(1+4.5)/1.5=11/3; doubled distances give44/3. The log change isln4 apart from the epsilon. It describes graph-weighted local scale, not a calibrated global density. Returning cached training coordinates is a different branch from placing a new row; the inspected implementation refuses the latter for densMAP.

### 18. Preserve faces, not just a wireframe

Draw the unit square's Rips complex below1, from 1 to√2 and at√2. Then project all vertices onto their first coordinate.

Hint: when all triangle edges appear, include the filled triangle.

Solution: below1 there are isolated corners; for 1≤ε<√2 the sides give one unfilled loop; at√2 filled triangles and the tetrahedron eliminate it. The projection creates duplicate coordinate pairs and loses that square loop. Preserve the distinct IDs in the drawing. This is a constructed projection example, not an empirical t-SNE result.

### 19. Price the next allocation

How much storage does one100,000×100,000 float64 matrix need? Does a sparse neighbor graph eliminate that cost from every later method?

Hint: count entries before looking at an algorithm's name.

Solution: $10^{10}\cdot8=80\times10^9$ bytes, or80 GB decimal, before additional arrays. Sparse adjacency costs roughly $O(nk)$, but an all-pairs route matrix or dense global eigen matrix can still be $O(n^2)$. A row-wise exact audit uses $O(n)$ working distances while keeping the input/output records. Choose the representation at each operation.

## 12. Further learning and technical references

Use these resources for specific next questions. The lesson's implemented finite mechanisms, retained runs and source-only API branches have different evidence roles; a link to a paper is not a claim that all of its proofs or figures were consumed.

For intuition, [How to Use t-SNE Effectively](https://distill.pub/2016/misread-tsne/) walks through changed perplexities and interpretations of area, gaps and cluster sizes. Recreate its questions with the saved digit maps before generalizing the pictures. The [scikit-learn manifold guide](https://scikit-learn.org/stable/modules/manifold.html) compares the global-distance, local-reconstruction and graph routes and explains estimator parameters. Its currently inspected1.9.1 API differs from older tutorials, especially for MDS.

For the t-SNE derivation, [van der Maaten and Hinton,2008](https://jmlr.org/papers/volume9/vandermaaten08a/vandermaaten08a.pdf) supplies Gaussian affinities, crowding, symmetrization and the gradient; those selected parts and AppendixA support §§4–5/10. The [van der Maaten, Postma and van den Herik comparison](https://lvdmaaten.github.io/publications/papers/TR_Dimensionality_Reduction_Review_2009.pdf) provides a broad canonical treatment of PCA, MDS, Isomap, LLE and local variants; the selected algorithm sections support the object comparison and alternatives here. It is not a license to compare unreported benchmark results as if they were ours.

For UMAP, [McInnes, Healy and Melville](https://arxiv.org/abs/1802.03426) introduces the finite neighborhood construction and layout procedure. The selected finite-graph and algorithm sections support the mechanism taught here; the full categorical and topological proofs are not reconstructed. The [creator's basic-use guide](https://umap-learn.readthedocs.io/en/latest/basic_usage.html) and [transform guide](https://umap-learn.readthedocs.io/en/latest/transform.html) explain ordinary workflows. Their documentation header is 0.5.8, while the retained teaching runs use0.5.12; match installed source when reproducing an internal comparison.

For sampling, [Damrich and Hamprecht,2021](https://arxiv.org/abs/2103.14608) distinguishes UMAP's implemented expected updates from a literal all-pair reading of its advertised loss. [Böhm, Berens and Kobak](https://arxiv.org/abs/2007.08902) studies an attraction–repulsion spectrum; [Damrich and colleagues](https://arxiv.org/abs/2206.01816) develops contrastive neighbor objectives with explicit normalization. The selected sections motivate our finite event reasoning, not universal algorithm equivalence or new empirical claims.

For local alternatives, [Saul and Roweis's LLE introduction](https://cs.nyu.edu/~roweis/lle/papers/lleintro.pdf) explains local recipes and the constrained eigenproblem. Some extracted mathematical glyphs in the retrieved document were garbled; equations here are verified through the finite construction and canonical treatment rather than copied from malformed text. Isomap's original Science article and several original Laplacian/Hessian/LTSA proofs were identified but not fully accessed in this source scope. Their mechanisms here rely on the actually read canonical comparison and official APIs, without claiming original-proof consumption.

For extensions, the [densMAP creator project](https://github.com/hhcho/densmap) identifies the density-preserving aim. Complete original-paper access failed in the retained research scope; this lesson confines its supported teaching to local radii, implementation/API branches and labelled extension intent. It makes no biological validation claim. The [openTSNE reference-placement guide](https://opentsne.readthedocs.io/en/stable/examples/02_advanced_usage/02_advanced_usage.html) explains a fixed-reference extension distinct from scikit-learn's `TSNE`; the optional source route needs a matching package before an execution claim. [Parametric UMAP](https://arxiv.org/abs/2009.12981) motivates the encoder distinction, with neural training routed to the deep learning module.

For books, the official [Elements of Statistical Learning page](https://hastie.su.domains/ElemStatLearn/) offers a broader statistical context and the publisher's [Pattern Recognition and Machine Learning page](https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/) identifies Bishop's text. Book PDF access was not established here, so these are annotated further-learning recommendations rather than sources for unread page-specific claims. No video is required for this route. Previously discovered video metadata is retained in the research history; it is not promoted here as a technically checked explanation or a viewing claim.

## 13. What you can now do, and what question comes next

You can follow one observation through an image vector and a coordinate map, explain why its neighbors changed, calculate effective Gaussian neighborhoods and symmetric $P$, derive the Student force and trace a bounded update. You can also construct UMAP's local graph, distinguish memberships from probabilities and affine weights, and explain why scheduling and asymmetric negative events matter. Use the saved-array audit to replace a general impression with an ID-joined local and collection comparison.

For implementation practice, run the deterministic files, alter a declared small fixture and inspect the intermediate object before interpreting the final coordinates. The five original full programmes retain their recorded outputs; the ten new files have separate deterministic streams. Ordinary fitting/extension functions added in the new files are complete source-only routes until you run them in a matching environment. New results belong to the modified source and settings. The common file index lists every programme, data file and its role; Copy and Download must deliver the entire displayed source, not an excerpt.

The next topic, [Independent Component Analysis](/learn/machine-learning/independent-component-analysis-ica), asks another reduction question: can observed mixtures be separated into statistically independent sources? A map that preserves neighbors does not answer it. Bring centering, linear transformations and the habit of naming the target relationship; ICA will add its own assumptions and objective.
