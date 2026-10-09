"""Compose the bounded R1-R3 successor from the exact frozen submission.

No lesson execution. The predecessor stays at its existing semantic owner.
"""
from pathlib import Path
import hashlib
import re

here = Path(__file__).resolve().parent
prior = here.parent

def load(name, expected=None):
    raw = (prior / name).read_bytes()
    if expected:
        assert hashlib.sha256(raw).hexdigest() == expected, name
    return raw.decode("utf-8").replace("\r\n", "\n")

def replace_once(text, old, new):
    assert text.count(old) == 1, old
    return text.replace(old, new)

def save(name, text):
    path = here / name
    assert not path.exists(), path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")

source = load("programs/gaussian_rows.py", "7a9290f1d0583a94c7e32bb75d7b4eb0b45d26bc81fcf6329b52937f380e6955")
source = replace_once(source, "    d = np.asarray(distances, dtype=float)\n    row_at_beta(d, 0)",
                      "    if not isinstance(max_iter, (int, np.integer)) or max_iter <= 0:\n        raise ValueError(\"max_iter must be a positive integer\")\n    d = np.asarray(distances, dtype=float)\n    row_at_beta(d, 0)")
source = replace_once(source, "    for _ in range(max_iter):\n        p, entropy = row_at_beta(d, beta)",
                      "    for _ in range(max_iter):\n        evaluated_beta = beta\n        p, entropy = row_at_beta(d, evaluated_beta)")
source = replace_once(source, '    return p, beta, "iteration-limit"', '    return p, evaluated_beta, "iteration-limit"')
save("programs/gaussian_rows.py", source)

manuscript = load("reading-flow-manuscript.md", "d11d369ff19d23db2780356e15e172cb34dcbf5e69fcf3bf97133a283e530e56")
manuscript = replace_once(manuscript, "/learn/machine-learning/clustering-evaluation-validation-silhouette-ari-nmi",
                          "/learn/path/full-curriculum/clustering-evaluation-validation-silhouette-ari-nmi?module=classical-ml#4-a-score-evaluates-a-geometry-as-well-as-a-partition")
manuscript = replace_once(manuscript, "/learn/machine-learning/independent-component-analysis-ica",
                          "/learn/path/full-curriculum/independent-component-analysis-ica?module=classical-ml")
manuscript = replace_once(manuscript,
    "A parametric UMAP encoder learns a function from input rows to coordinates; encoder training belongs to the linked [deep learning module](/learn/deep-learning), rather than being implied by ordinary graph-based transform.",
    "A parametric UMAP encoder learns a function from input rows to coordinates. The [Deep Learning Fundamentals module](/learn/track/deep-learning-fundamentals) develops neural functions, backpropagation and training objectives needed to train an encoder; ordinary graph-based transform does not imply that an encoder was trained.")
manuscript = replace_once(manuscript,
    "`solve_row` brackets beta, bisects once an upper bound exists and reports a status after a bounded number of iterations.",
    "`solve_row` brackets beta, bisects once an upper bound exists and reports a status after a positive integer iteration budget. At `iteration-limit`, the returned probabilities and beta describe the last evaluated row, even though its entropy has not met the tolerance. For example, distances[1,2,3], target perplexity2 and one iteration return the row at beta1, not the proposed next beta.5. A nonpositive budget is rejected before any boundary return.")
marker = "<!-- whole-code gaussian_rows.py -->\n```python\n"
match = re.search(re.escape(marker) + r"(.*?)^```", manuscript, re.M | re.S)
assert match and match.group(1) == load("programs/gaussian_rows.py")
manuscript = manuscript[:match.start(1)] + source + manuscript[match.end(1):]
manuscript = replace_once(manuscript,
    "The new deterministic stream includes all four rows and the entire joint matrix:",
    "The recorded deterministic stream below belongs to the preceding solver version; all four searches returned `converged`. The current source keeps that path and corrects the `iteration-limit` tuple. The stream includes all four rows and the entire joint matrix:")
manuscript = replace_once(manuscript,
    "The four-point step investigation keeps the input $P$ fixed. Select an ID, edit its current coordinate and choose a learning rate; Step updates every row from the same old state and then subtracts the new centroid. Reset returns the original four coordinates. Learning rate 0 leaves all coordinates unchanged.",
    "The four-point step investigation keeps the input $P$ fixed. Select an ID, edit only its current coordinate and choose a learning rate. A positive-rate Step updates every row from the same old state and then subtracts the new centroid; it reports that common shift. The current-coordinate editor starts with bounds−4 to4. After a Step, its labelled bounds expand symmetrically to contain every computed coordinate, and remain fixed while you edit or select another ID. The editor, point and live value always use that ID's same current coordinate. Reset returns the original four coordinates, selected A, rate.5 and bounds−4 to4. Learning rate 0 leaves all current coordinates unchanged, including after an edit.")
manuscript = replace_once(manuscript,
    "This is one constructed update, not another saved optimizer trajectory. A smaller step or a line-search rule addresses step size; it does not make the nonconvex objective globally solved.",
    "This is one constructed update, not another saved optimizer trajectory. The editor's bounds now read−13 to13, with A still selected at its actual coordinate6.278461…; selecting C loads−10.760275… on the same ruler and in the exact-entry field. Editing C to−10 changes that coordinate and its forces immediately while retaining these bounds. The next positive-rate Step starts from those edited coordinates and expands the bounds again if needed. Reset restores the original state. A smaller step or a line-search rule addresses step size; it does not make the nonconvex objective globally solved.")
manuscript = replace_once(manuscript,
    "There is no scikit-learn `DiffusionMap` call invented here; the exact tiny walk and numerical eigensolver are the computational route.",
    "The computational route here uses the exact tiny walk and a numerical eigensolver, rather than a scikit-learn diffusion-map estimator.")
manuscript = replace_once(manuscript,
    "For implementation practice, run the deterministic files, alter a declared small fixture and inspect the intermediate object before interpreting the final coordinates. The five original full programmes retain their recorded outputs; the ten new files have separate deterministic streams. Ordinary fitting/extension functions added in the new files are complete source-only routes until you run them in a matching environment. New results belong to the modified source and settings. The common file index lists every programme, data file and its role; Copy and Download must deliver the entire displayed source, not an excerpt.",
    "For implementation practice, run a deterministic file, alter a declared small fixture and inspect the intermediate object before interpreting the final coordinates. The common file index lists every complete programme, data file and recorded stream. Use the setup guide to choose the dependencies and distinguish a recorded result from a new fitting experiment; retain the modified source and settings with your new results.")
manuscript = manuscript.replace("A nonpositive budget is rejected before any boundary return. It ignores zero-probability terms", "A nonpositive budget is rejected before any boundary return. Entropy evaluation ignores zero-probability terms")
save("reading-flow-manuscript.md", manuscript)

specs = load("visual-and-investigation-specifications.md", "b82da5c43df028a20263068707031ec13606d370a5f1ccec8d4729d47437b5e3")
specs = replace_once(specs,
    "L7 uses same fixed P with current Y; invalid edit retains state, zero rate is an exact null.",
    "L7 uses same fixed P with current Y and the explicit editor-domain protocol below; invalid edits retain state. A zero-rate Step is an exact no-op, including after a manual edit, and skips recentering. Positive-rate Step reports the common centroid subtraction.")
specs = replace_once(specs,
    "Keep failed result visible with reset; no assertion of global minimization or historical200-step intermediates.",
    "Keep this finite failed result visible with all actual endpoints and the expanded L7 editor domain−13…13; no assertion of global minimization or historical200-step intermediates. Selection changes load the actual stepped coordinate, without clamping or implicit resetting.")
old = "| L7, after D17 | Selected A, current x−1.5, learning rate.5; IDs A–D, x−4–4, rate0–100 | Fixed supplied P; selected edit updates all Q/forces. Step computes all4 displacements from old Y, then recentering; shows before/after/changed KL and complete coordinates. | Rate0 exact null; coincident symmetric state may have zero force without optimality. A failed oversized step remains visible. Edit/Step retains coherent current state; Reset restores all4 initial Y,A,.5. No historical200-step replay. |"
new = "| L7, after D17 | Selected A, current x−1.5, learning rate.5; IDs A–D, initial x bounds−4…4, rate0–100; the same coordinate has range and exact entry | Fixed supplied P; editing moves only the selected point and updates all Q/forces immediately. Positive-rate Step computes all4 displacements from old Y, then recenters with a reported shift. Show complete before/after coordinates and KL; expand shared coordinate bounds by the protocol below. | Rate0 skips update/recentering and is an exact null even after an edit. Keep finite failed oversized steps visible. Selection, edit and Step preserve synchronized current state; Reset restores all4 initial Y,A,.5 and bounds−4…4. No historical200-step replay. |"
specs = replace_once(specs, old, new)
protocol = """### L7 current-coordinate domain and required state trace

Keep a shared symmetric half-bound M in the state, initially4. After each finite positive-rate Step and its reported centroid subtraction, set M←max(M,ceil(max_i|y_i|)). Label the coordinate range and exact entry with the same bounds[−M,M]. Keep the entire computed coordinate at full model precision; step=any and no decimal snapping grid are required for the range. Rounded point labels never become model inputs. The range value, exact-entry value, selected point and live sentence must refer to the same current coordinate. Drawing extents include all current and compared endpoints and disclose a scale extension; they cannot silently crop the failed step. Keep scale and M fixed throughout a drag/edit and on ID changes. A valid finite edit within the displayed bounds changes only the selected y_i; it does not recenter the other points. Reject empty/nonfinite/out-of-bounds drafts with precise feedback while explicitly retaining the last valid state. Rate0 Step is an exact no-op, so a noncentered edited state is not translated by a nominal zero step.

Required finite state trace for phase-two native/keyboard checks: Reset→A−1.5,B−.5,C.5,D1.5, selected A, rate.5, bounds−4…4. Set rate100 and Step: keep the supplied full-precision result whose rounded coordinates are[6.278461,−8.261085,−10.760275,12.742899]; KL rises to1.360383966 and remains visible. M becomes13, and selected A's range/exact entry/point/live sentence all show the same6.278461… value within[−13,13]. Select C: all four views load its same−10.760275… coordinate; neither coordinates nor M change. Enter C=−10: update only C, Q, forces and current KL immediately; M stays13. At rate0, Step leaves this edited state exactly unchanged. At rate.5, Step uses this entire edited state, computes every displacement from it before mutation, recenters with a visible common shift and recomputes M by the same rule. Repeated positive Steps use the current state and may expand M again; they never clamp a computed coordinate or shrink M during selection/edit. Reset returns every original coordinate, selected A, rate.5, M4, baseline KL and clears edit/error/before-after history. A nonfinite computed step must report a computation failure and clearly retain the last finite state, rather than inventing finite coordinates; a finite KL increase is a real accepted failed result, not a reason to reject or hide the step.

"""
specs = replace_once(specs, "## Implementation handoff and required future observations\n", protocol + "## Implementation handoff and required future observations\n")
specs = specs.rstrip() + "\n\nUse the shared Reader file index for every complete mapped payload, and make Copy/Download deliver the complete displayed source with visible success/error feedback. Keep section12's annotated further-learning routes and precise technical references in their separate shared ending roles. Preserve all annotations, optional-package boundaries and access/video qualifications; metadata is not a viewing claim.\n"
save("visual-and-investigation-specifications.md", specs)

setup = load("setup-and-files.md", "6fe6a5aba29addc325e049d91befb9b94f9a21d44d868f7cc6613085a75b57d2")
setup = replace_once(setup,
    "Download the ten new scripts in `programs/`, the five preserved scripts in `retained-programs/`, and `data/`. Put the scripts together in one working `programs` directory: `isomap_routes.py` imports `classical_geometry.py`. The full source is also visible beside its teaching. The common Reader file index should expose these whole payloads, with Copy and Download producing the same source.",
    "Download all fifteen scripts and the five supporting data files listed in the file index. Put the scripts together in one working `programs` directory: `isomap_routes.py` imports `classical_geometry.py`. The full source is also visible beside its teaching; use the file index to find each complete payload.")
setup = replace_once(setup,
    "| `gaussian_rows.py` | Shifted weights, entropy targets, nearest ties and boundary status | Newly executed four-row probability construction |",
    "| `gaussian_rows.py` | Shifted weights, entropy targets, nearest ties and consistent last-evaluated iteration-limit status | Corrected callable checks; the recorded main stream belongs to the exact preceding source |")
setup = replace_once(setup,
    "The new deterministic examples were executed under Python3.12.14,NumPy2.3.5,SciPy1.18.1.",
    "The recorded deterministic examples were executed under Python3.12.14,NumPy2.3.5,SciPy1.18.1. The Gaussian solver now returns its last evaluated beta when its iteration budget is exhausted and rejects nonpositive budgets. Its corrected callables have separate bounded checks; the displayed historical main stream remains attached to its preceding source.")
setup = setup.replace("Newly executed", "Recorded").replace("ten new deterministic and five retained streams", "ten deterministic and five retained streams")
save("setup-and-files.md", setup)

notes = load("current-api-and-resource-notes.md", "51a106cce4d3e7404f8397b3ae97eacee9f1c53cad089fde8f3888605bcf7dce")
gmm_path = prior.parent.parent / "gaussian-mixture-models-gmm-em-algorithm/publication/root-normal-integration-acceptance.json"
gmm_sha = hashlib.sha256(gmm_path.read_bytes()).hexdigest()
notes = replace_once(notes,
    "GMM's complete private acceptance is not treated as current normal publication or a required accepted prerequisite in this manuscript.",
    "GMM revision4 now has Root normal integration acceptance at `docs/teaching/classical-ml-reading-flow/gaussian-mixture-models-gmm-em-algorithm/publication/root-normal-integration-acceptance.json` (SHA256 " + gmm_sha + "); it remains an optional neighboring topic, not a new required prerequisite. The preceding private-only sentence remains preserved in the submitted predecessor, accepted design and historical records.")
notes = notes.replace("# Successor source/API and resource dispositions\n", "# Successor source/API and resource dispositions\n\nThe research and source-reading statements below retain the preceding successor author's scope and attribution. This correction author freshly reads the affected complete content, validates current local learner routes and updates only the current GMM status; no new external-source reading, API execution or whole-design reading is claimed.\n")
save("current-api-and-resource-notes.md", notes)
print("Composed bounded corrected manuscript/specifications/solver/setup/API note; predecessors unchanged.")
