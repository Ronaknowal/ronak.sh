# Setup and complete lesson files

Use the supplied files to inspect a fixed collection offline, then change a small constructed mechanism deliberately. The real data are300 selected UCI optical-digit observations, each with a source ID, recorded label and64 block-count features. Labels selected the first30 records per class; labels were not fitted inputs to the saved unsupervised maps. Keep the supplied provenance and CSV/JSON pair together.

Download the ten new scripts in `programs/`, the five preserved scripts in `retained-programs/`, and `data/`. Put the scripts together in one working `programs` directory: `isomap_routes.py` imports `classical_geometry.py`. The full source is also visible beside its teaching. The common Reader file index should expose these whole payloads, with Copy and Download producing the same source. An output file records an execution; copying it does not run its program.

```text
manifold-learning/
  programs/             all fifteen .py files
  data/
    digits-300.csv
    calculated-inputs.json
    umap-digits.csv
    data-provenance.md
    runtime-versions.json
  outputs/              ten new deterministic and five retained streams
```

The new deterministic examples were executed under Python3.12.14,NumPy2.3.5,SciPy1.18.1. The retained environment also records scikit-learn1.9.1,umap-learn.5.12,numba.67.0 and related versions. These are attributed snapshots, not a promise of bitwise output on every platform. Use a separate virtual environment for reproduction; the minimum scratch routes need NumPy/SciPy. The MDS ordinary code specifically uses the inspected1.9.1 API. Optional openTSNE source was checked against its1.0.0 documentation; no matched installed openTSNE execution is claimed.

```sh
python -m venv .venv
# Activate .venv using the command appropriate to your shell.
python -m pip install numpy==2.3.5 scipy==1.18.1
python programs/gaussian_rows.py
python programs/classical_geometry.py
python programs/isomap_routes.py
python programs/lle_recipes.py
python programs/graph_spectrum.py
python programs/local_tangent_patch.py
python programs/sampled_pair_events.py
python programs/local_density_radius.py
python programs/reference_map_routes.py
python programs/audit_saved_neighbors.py --assets data
```

These ten main blocks run deterministic constructed/saved-array work. None fits a new t-SNE/UMAP digit map or calls the source-only ordinary fitting functions. `local_density_radius.py` prints two local radii; it does not call densMAP. `reference_map_routes.py` prints one interpolation; it does not fit its ordinary, supervised or openTSNE routes. `classical_geometry.py` executes scratch classical/metric calculations; its callable ordinary function is source-only here.

For an intentional ordinary experiment, install the appropriate declared packages in that environment:

```sh
python -m pip install scikit-learn==1.9.1 umap-learn==0.5.12
# Only for the optional reference-embedding branch:
python -m pip install openTSNE==1.0.0
```

No installation or fit was performed by this content handoff. Read the corresponding function and call it explicitly on your chosen input. For example:

```python
from programs.reference_map_routes import ordinary_pipeline
train_ids, valid_ids, fitted_reducers, results = ordinary_pipeline("data/digits-300.csv")
for name, result in results.items():
    print(name, result["correct"], result["denominator"])
```

This is a new experiment if you run it; its counts may differ from retained streams. It uses the train-only split/state contract and returns actual predictions. The optional openTSNE function returns reference and placed coordinates, while the supervised UMAP function uses training labels explicitly. Neither inherits the retained unsupervised map's outputs. Pinning package names alone does not establish identical threads, numerical libraries or hardware.

The five preserved scripts are full original programs, with the original result streams beside them. `inspect_digits.py` and `inspect_umap.py` fit maps and write coordinate CSVs; `compare_transforms.py` fits the train-only comparison; `tiny_tsne.py` executes200 small updates; `umap-mechanism.py` compares internals and runs a small ordinary fit. If deliberately reproducing or modifying them, copy the measurement CSV into a separate experiment working directory and run there so generated outputs cannot be confused with saved reference data. Do not replace a retained coordinate/stream file with a fresh run that happens to share its filename.

| Complete file | What to inspect or change | Result role |
|---|---|---|
| `audit_saved_neighbors.py` | ID join, row-wise distances, self exclusion, rank penalties, changed source/k | Newly executed saved-array audit; no fit |
| `gaussian_rows.py` | Shifted weights, entropy targets, nearest ties and boundary status | Newly executed four-row probability construction |
| `classical_geometry.py` | Double centering, eigenmodes, metric majorization and shared start | Executed scratch predecessor, unchanged numeric body; completed ordinary nonmetric return is source-only |
| `isomap_routes.py` | Radius/union graph, relaxation, infinity and finite embedding | Newly executed U-chain routes; ordinary estimator source-only |
| `lle_recipes.py` | Offset Gram, ridge, affine weights, centered eigenproblem | Newly executed curved five-point recipe example |
| `graph_spectrum.py` | Degrees, three Laplacians, random walk and diffusion modes | Newly executed chain energy/walk; ordinary spectral call source-only |
| `local_tangent_patch.py` | Thin SVD, shared-ID alignment, curvature stencil | Newly executed five-point patch; global variants source-only |
| `sampled_pair_events.py` | Positive/negative endpoints, explicit frequencies/noise law | Newly executed finite expected-event enumeration |
| `local_density_radius.py` | Weight×distance² products, log radius and densMAP call | Executed radius only; density optimizer source-only |
| `reference_map_routes.py` | Fixed-state interpolation, ID split and future-data routes | Executed interpolation only; all fits/extensions source-only |
| `inspect_digits.py` | Ordinary PCA/t-SNE fixed-collection settings and audits | Preserved full original program/stream; not rerun |
| `inspect_umap.py` | Ordinary graph/layout settings and coordinate export | Preserved full original program/stream; not rerun |
| `compare_transforms.py` |225/75 split, fixed transform and KNN baseline | Preserved73/75 versus71/75 result; not rerun |
| `tiny_tsne.py` | Entire tiny exact optimizer and fixed-P gradient | Preserved200-step trajectory endpoints; not rerun |
| `umap-mechanism.py` | Six-row graph, ideal pair gradient and supplied sampled step | Preserved version-bound internal comparison; not rerun |

`digits-300.csv` contains integer source IDs,labels and raw0–16 cells. `calculated-inputs.json` binds its hash, the same300 IDs, all ten full-precision coordinate arrays and all90 historical R/T/C values. `umap-digits.csv` is the retained coordinate export. `runtime-versions.json` and `data-provenance.md` retain execution/source context. `file-index.json` gives each exact path, byte count, hash and display role, including the fifteen full streams. Historical and new rank conventions remain separate. Never reconstruct distances from a rounded picture.
