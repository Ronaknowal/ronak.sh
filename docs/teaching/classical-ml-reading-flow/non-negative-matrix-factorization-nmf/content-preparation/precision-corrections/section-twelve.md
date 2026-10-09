## 12. Inspect an actual digit dictionary and contribution

How do the three-bin calculations look when each observation is a small image? The arithmetic is unchanged; the bins now have positions on a page.

<!-- figure:D42 -->

Read one small square as one measured feature. These handwritten-digit observations have eight rows and eight columns, hence 64 features. Code stores them in row order: feature `j = 8*row + column`, with both coordinates starting at zero. Feature F35 is therefore row 4, column 3. The original measurement is a count from 0 to 16, formed by counting marked pixels in a corresponding block of the original larger binary image. Dividing by the fixed number 16 gives the intensity units used here. This is a known measurement ruler, not a maximum learned from all the images.

The eight maps above are the eight rows of one **recorded dictionary**, H. C1 is the first dictionary row, C8 the eighth; these display names correspond to code indices 0 and 7. The colours preserve component identity. Each cell of a map says how much that feature receives from **one unit of that component's amount**. A bright patch is a numerical pattern, not a verified pen stroke, a class label or a probability. Some patterns look stroke-like, but resemblance alone does not identify a physical cause.

All eight maps use the same 0–4 ruler. They are not independently stretched to look equally bright. The largest dictionary entry is about 1.389324, so a pattern can exceed the measured image's 0–1 range: its units are intensity **per unit amount**, and its amount need not be one. Keeping the shared ruler makes comparisons honest, even when a component looks faint.

This dictionary was fitted earlier with eight components, seed 19, random initialization and coordinate descent. The 180 fitting images determined H. The 60 reserved images shown here were subsequently encoded with that dictionary fixed. We are now reading the recorded arrays, not training a new model. Section 13 explains why this inspection model is different from the model preferred by the recorded validation comparison. For now, ask the local question: what does one saved amount contribute to one image?

### Follow one amount all the way to the image

Which pixels move when one amount changes? Follow a single component through the sum, with every other amount held still.

<!-- figure:D43 -->

Start at **source row 242**, whose observed digit label is 8. The label helps us describe the observation; it is not an input column used to fit the dictionary. Its C1 amount is approximately 0.176453. The first image is the raw C1 pattern H[C1]. Multiplying each of its 64 cells by 0.176453 makes the second image, the **C1 contribution**. The full reconstruction adds that image to seven other component contributions. The final image is the signed residual, observed minus reconstructed, on a separate ruler: a positive residual means the reconstruction is too faint at that cell; a negative residual means it is too bright.

The gain control multiplies only the selected saved amount. At gain 1, it shows the recorded reconstruction. At gain 0, it subtracts precisely the selected contribution. At gain 2, it adds one more copy. It does not refit H, optimize the other amounts or redraw a different observation. Use the source selector to compare row 242 with row 256, while C1 continues to mean the same dictionary pattern.

For source row i, selected component c and gain g, the local change is

\[
 p_{ic}=W_{ic}H_{c,:},\qquad
 \widehat x_i(g)=\widehat x_i(1)+(g-1)p_{ic},\qquad
 r_i(g)=x_i-\widehat x_i(g).
\]

Here p is an entire 64-feature image, not a scalar importance score. Its entries are nonnegative. Increasing g can therefore only increase or preserve each predicted pixel. A residual may move toward zero at one pixel and away from zero at another; inspect both the residual picture and the total error.

There is a useful null case. Select row 242 and C8. Its saved C8 amount is exactly zero, so its contribution is a completely zero image. Moving gain changes nothing. That is an honest absence of this component from this saved encoding, not a broken control. It does not prove the raw C8 pattern is useless for every observation; row 256 uses it substantially.

The 0–4 ruler covers every reconstruction reachable by these two source rows, eight selected components and gains from 0 to 2. Their largest reachable value is about 2.021612. Signed residuals use −4 to 4. Predictions are never clipped to the observed 0–1 range. Clipping would change the model's output and hide overshoots.

### Distinguish a large amount from a large contribution

Which component contributes most to row 256? Compare two different questions with two different units.

<!-- figure:D44 -->

The first row of bars shows the eight raw amounts W[256,c]. C7 is largest, at about 0.688493, followed by C8 at 0.628002. But one unit of C8 spreads more total intensity across its pattern. The second row multiplies each amount by its pattern's sum. C8 now contributes about 6.894594 intensity units, ahead of C7's 6.383307. The first chart answers “how many of this pattern's chosen units?”; the second answers “how much predicted intensity over the whole image?” They are not interchangeable.

| Component | Saved amount | Total contribution over 64 pixels |
|---|---:|---:|
| C1 | 0.2321911099210713 | 2.1512220831262505 |
| C2 | 0.011934602685408047 | 0.09375622389611028 |
| C3 | 0.3424206826975729 | 3.8695912467273876 |
| C4 | 0 | 0 |
| C5 | 0.12081544616148039 | 1.2914123266438298 |
| C6 | 0 | 0 |
| C7 | 0.6884925427238711 | 6.383307297328288 |
| C8 | 0.628002130601251 | 6.8945940980317655 |

Formally, let s_c = sum_j H_cj be a pattern's total mass. Its total contribution to row i is W_ic s_c. This total is unchanged by the compensating rescaling in **Amount is not probability or identity**, section 2: multiplying H_c by a positive number and dividing W_ic by the same number leaves both the contribution image and its sum unchanged. A raw amount has no such invariance. In these 60 saved encodings, largest amount and largest total contribution disagree on 16 rows. That describes this saved inspection, not a universal frequency or a claim about which digit is recognized.

Total contribution still is not an all-purpose definition of importance. It sums intensity, so a broad diffuse pattern can contribute a large total without uniquely explaining a distinctive feature. Error increase under a specific edit, downstream task performance and external meaning answer different questions. Name the question before choosing the score.

### Remove one contribution without pretending to refit

What happens when we remove C8 from row 256? This time keep the source and component fixed so the only moving idea is the removal fraction.

<!-- figure:D45 -->

At fraction 0, the current reconstruction is the saved sum. At fraction 1, the full C8 contribution has been removed; every other component retains its saved amount. The observed image never changes. The removed-addend image shows exactly what has been subtracted, and the residual shows where that subtraction helps or hurts. Mean squared error rises from about 0.02758816 to 0.07326254. This is a controlled numerical edit of a representation. It is not evidence that a real-world intervention could remove a biological or physical source in the same way.

Why can some pixels improve while the total gets worse? Let p be the C8 contribution, e = x − x̂ the original residual, and r the removal fraction. The edited prediction is x̂ − rp; its residual is e + rp. Expanding the square gives

\[
 \operatorname{MSE}(r)-\operatorname{MSE}(0)
 =\frac{2r\langle e,p\rangle+r^2\|p\|^2}{64}.
\]

Individual terms can have either sign because e is signed. Their sum is the relevant quantity for squared-error fitting. If the original amounts were an **exact fixed-dictionary NNLS optimum**, removal is another feasible nonnegative amount vector and cannot lower total loss. For a positive coordinate at an exact optimum, its gradient is zero, giving ⟨e,p⟩ = 0; removing that nonzero contribution then adds r²||p||²/64. A zero amount has p = 0 and changes nothing. A finite-tolerance saved fit need not satisfy these equalities exactly; the reported numerical change is what this recorded example actually does. Do not turn a solver tolerance into an exact theorem about every saved row.

### Implement contributions, normalization and correspondence

How can we inspect factors without manufacturing a huge array of every row–component–pixel contribution? Calculate only the output needed for the question.

The complete source below imports the validation and matrix multiplication helpers already explained in **Fit both factors and decide when to stop**, section 6. `row_contribution` makes only one feature vector. `contribution_totals` uses the dictionary row sums and makes an n×k table, not an n×k×d tensor. `change_component_gain` copies one amount row, edits one entry and reconstructs it.

`normalize_patterns` makes each positive pattern sum to one and multiplies the corresponding amount column by its old sum. The product is preserved. An all-zero pattern has no direction or positive mass to normalize; the function labels it unusable and returns zero normalized pattern and zero compensated amount. This changes an arbitrary coefficient of an unused pattern without changing a single reconstructed pixel.

When comparing two fits, normalize positive pattern rows before matching their shapes. `align_patterns` computes pairwise squared distances, then asks the public SciPy `linear_sum_assignment` routine for a minimum-total-cost one-to-one assignment. Rectangular dictionaries leave some usable patterns unmatched. Unused zero patterns are reported separately. This is a display correspondence, not a proof that the fits are identical or that either recovered a true source.

There can be multiple best matchings even without duplicate patterns. To detect that global ambiguity in a small display, the optional audit forbids each chosen edge in turn and solves again. Any distinct matching must omit at least one chosen edge, so this covers alternatives within the declared numerical tolerance. The report says **no alternative within tolerance**, not “mathematically unique.” Above the explicit size limit it says **not audited** rather than pretending the ambiguity check ran.

For similarly sized k-component dictionaries, cost construction takes O(k²d) arithmetic and O(k²) retained costs, plus the normalized factors. One dense assignment has a conventional O(k³) bound. The optional global audit can make k further assignments, raising the conservative bound to O(k⁴); it is deliberately capped for small displays. The implementation builds one row of costs at a time, avoiding a k×k×d difference tensor. For already validated factors, reconstructing one row takes O(kd), while multiplying one selected amount by its length-d pattern takes O(d) arithmetic and O(d) output. The delivered row_contribution wrapper first validates the whole k×d dictionary and the k-entry amount row through nonnegative_table and real_table: that copies/scans O(kd+k) input cells. Its end-to-end time is therefore O(kd+k), with O(kd+k+d) temporary/output storage, rather than O(d). This safety cost avoids trusting caller state; an internal validated kernel can reuse validated factors without those copies. Requested all-row reconstruction takes O(nkd) arithmetic, and its n×d output is itself a storage cost. These are operation bounds for this route, not a claim of universal fastest execution.

Save the source as `nmf_factor_alignment.py` beside the earlier `nmf_arrays.py` helper.


```python
"""Invariant contributions, unit-mass patterns and explicit alignment ambiguity."""
from dataclasses import dataclass
import numpy as np
from scipy.optimize import linear_sum_assignment

from nmf_arrays import nonnegative_scalar, nonnegative_table, reconstruction, require_finite


def matching_factors(amounts, dictionary):
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table(amounts, h.shape[0])
    return w, h


def component_index(value, count):
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, (int, np.integer)):
        raise ValueError("Component index must be an integer")
    value = int(value)
    if value < 0 or value >= count:
        raise ValueError("Component index is outside this dictionary")
    return value


def normalize_patterns(amounts, dictionary):
    """Compensate W columns while normalizing positive H row sums; zero is unused."""
    w, h = matching_factors(amounts, dictionary)
    with np.errstate(over='ignore', invalid='ignore'):
        masses = h.sum(axis=1)
    require_finite(masses, "Pattern masses")
    usable = masses > 0
    normalized = np.zeros_like(h)
    normalized[usable] = h[usable] / masses[usable, None]
    with np.errstate(over='ignore', invalid='ignore'):
        compensated = w * masses
    require_finite(compensated, "Compensated amounts")
    return compensated, normalized, masses, usable


def contribution_totals(amounts, dictionary):
    w, h = matching_factors(amounts, dictionary)
    with np.errstate(over='ignore', invalid='ignore'):
        result = w * h.sum(axis=1)
    return require_finite(result, "Component contribution totals")


def row_contribution(amount_row, dictionary, component):
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table([amount_row], h.shape[0])
    c = component_index(component, h.shape[0])
    with np.errstate(over='ignore', invalid='ignore'):
        result = w[0, c] * h[c]
    return require_finite(result, "Selected contribution")


def change_component_gain(amount_row, dictionary, component, gain):
    """Change only one saved amount; no fit or re-encoding occurs."""
    h = nonnegative_table(dictionary, require_rows=True)
    w = nonnegative_table([amount_row], h.shape[0])
    c = component_index(component, h.shape[0])
    gain = nonnegative_scalar(gain, "gain")
    with np.errstate(over='ignore', invalid='ignore'):
        w[0, c] *= gain
    require_finite(w, "Edited amounts")
    return reconstruction(w, h)[0]


@dataclass(frozen=True)
class Alignment:
    pairs: tuple
    cost: float
    unmatched_left: tuple
    unmatched_right: tuple
    unused_left: tuple
    unused_right: tuple
    ambiguity: str
    alternative_pairs: tuple


def align_patterns(left, right, *, audit_ambiguity=True, tolerance=1e-12, audit_limit=64):
    """Display correspondence of positive unit-mass rows, not source recovery.

    Core matching is one assignment. Optional bounded global-tie audit adds at
    most min(k_left,k_right) assignments by forbidding each selected edge.
    """
    a = nonnegative_table(left, require_rows=True)
    b = nonnegative_table(right, a.shape[1], require_rows=True)
    tolerance = nonnegative_scalar(tolerance, "tolerance")
    if not isinstance(audit_ambiguity, (bool, np.bool_)):
        raise ValueError("audit_ambiguity must be boolean")
    if isinstance(audit_limit, (bool, np.bool_)) or not isinstance(audit_limit, (int, np.integer)) or audit_limit < 1:
        raise ValueError("audit_limit must be a positive integer")
    with np.errstate(over='ignore', invalid='ignore'):
        ma, mb = a.sum(axis=1), b.sum(axis=1)
    require_finite(ma, "Left pattern masses")
    require_finite(mb, "Right pattern masses")
    ia, ib = np.flatnonzero(ma > 0), np.flatnonzero(mb > 0)
    unused_a, unused_b = tuple(np.flatnonzero(ma == 0).tolist()), tuple(np.flatnonzero(mb == 0).tolist())
    if len(ia) == 0 or len(ib) == 0:
        return Alignment((), 0.0, tuple(ia.tolist()), tuple(ib.tolist()), unused_a, unused_b,
                         'no-usable-pair', ())
    aa, bb = a[ia] / ma[ia, None], b[ib] / mb[ib, None]
    costs = np.empty((len(ia), len(ib)))
    for i, row in enumerate(aa):
        # Avoid a k_left*k_right*d difference tensor.
        costs[i] = np.sum((bb - row) ** 2, axis=1)
    require_finite(costs, "Alignment costs")
    rows, columns = linear_sum_assignment(costs)
    total = float(costs[rows, columns].sum())
    threshold = tolerance * max(1.0, abs(total))
    require_finite(threshold, "Alignment tolerance")
    pairs = tuple((int(ia[r]), int(ib[c])) for r, c in zip(rows, columns))
    status, alternative = 'not-audited', ()
    if audit_ambiguity and max(costs.shape) <= audit_limit:
        status = 'no-alternative-within-tolerance'
        for row, column in zip(rows, columns):
            forbidden = costs.copy()
            forbidden[row, column] = np.inf
            try:
                other_rows, other_columns = linear_sum_assignment(forbidden)
            except ValueError:  # This forbidden edge made a full-size matching infeasible.
                continue
            other_total = float(costs[other_rows, other_columns].sum())
            if other_total <= total + threshold:
                status = 'alternative-within-tolerance'
                alternative = tuple((int(ia[r]), int(ib[c])) for r, c in zip(other_rows, other_columns))
                break
    elif audit_ambiguity:
        status = 'not-audited-over-limit'
    return Alignment(pairs, total, tuple(sorted(set(ia.tolist()) - set(ia[rows].tolist()))),
                     tuple(sorted(set(ib.tolist()) - set(ib[columns].tolist()))),
                     unused_a, unused_b, status, alternative)


def main():
    h = np.array([[1.,0.,1.], [0.,1.,1.], [0.,0.,0.]])
    w = np.array([[2.,1.,7.], [1.,3.,2.]])
    compensated, normalized, masses, usable = normalize_patterns(w,h)
    print('masses',masses.tolist(),'usable',usable.tolist())
    print('normalized',normalized.tolist(),'compensated',compensated.tolist())
    print('reconstruction_preserved',np.allclose(reconstruction(w,h),reconstruction(compensated,normalized)))
    right = np.array([[0.,3.,3.], [2.,0.,2.], [0.,0.,0.]])
    print('permuted_rescaled_alignment',align_patterns(h,right))
    duplicate = np.array([[1.,0.], [1.,0.]])
    print('duplicate_ambiguity',align_patterns(duplicate,duplicate))
    print('contributions',contribution_totals(w,h).tolist())
    print('C0_removed',change_component_gain(w[0],h,0,0).tolist())


if __name__ == '__main__':
    main()
```


The following output comes from this program's small constructed example. Its zero third pattern is deliberately included to show the unused-pattern rule; it is separate from the eight-component digit inspection.


```text
masses [2.0, 2.0, 0.0] usable [True, True, False]
normalized [[0.5, 0.0, 0.5], [0.0, 0.5, 0.5], [0.0, 0.0, 0.0]] compensated [[4.0, 2.0, 0.0], [2.0, 6.0, 0.0]]
reconstruction_preserved True
permuted_rescaled_alignment Alignment(pairs=((0, 1), (1, 0)), cost=0.0, unmatched_left=(), unmatched_right=(), unused_left=(2,), unused_right=(2,), ambiguity='no-alternative-within-tolerance', alternative_pairs=())
duplicate_ambiguity Alignment(pairs=((0, 0), (1, 1)), cost=0.0, unmatched_left=(), unmatched_right=(), unused_left=(), unused_right=(), ambiguity='alternative-within-tolerance', alternative_pairs=((0, 1), (1, 0)))
contributions [[4.0, 2.0, 0.0], [2.0, 6.0, 0.0]]
C0_removed [0.0, 1.0, 1.0]
```


Read `pairs=((0,1),(1,0))` as original pattern 0 matching the other dictionary's pattern 1 and vice versa. The cost is zero because only scale and order changed. The duplicated two-pattern example has a genuine alternative correspondence. Neither matching changes the reconstruction or supplies a physical identity.

### Read the recorded images reproducibly

How do we preserve the exact dictionary behind the pictures? Read a complete saved state and its attributed measurement file, and refuse a mismatched or missing input.

The next program needs four local siblings: `nmf_arrays.py`, `nmf_factor_alignment.py`, the complete `nmf_saved_state.json`, and `digits-300.csv`. Keep `digits-data-provenance.md` with them for source, license, selection and units. The shared file index contains each of these. With NumPy and SciPy available, run `python nmf_saved_digits.py`. This reader needs no scikit-learn import, network request or new fit. The saved model was produced using the separately recorded environment and fitting program; reading it in a new environment does not create a new training result.

`verified_bytes` binds the two inputs to the exact example. `load_saved_digits` checks the fixed scale, model, feature order and shapes, then matches every reserved observation by its source ID, label and 64 raw measurements. Source ID is an address, not an array position. The saved H, W and observed arrays are read-only and the source-ID lookup cannot be edited through its mapping interface. The metadata dictionary is descriptive ordinary Python data; it is not advertised as recursively immutable.

`describe_saved_row` uses the same contribution functions as the pictures. It returns the observation, selected addend, reconstruction, signed residual, controlled changed reconstruction and both MSEs. The original saved amounts are not overwritten. Missing files raise a clear file error, and a changed hash raises an identity error. There is deliberately no fallback that silently trains a different model while displaying these recorded claims.

Save the source as `nmf_saved_digits.py` beside those inputs.


```python
"""Offline inspection of the recorded digit factors; never fits a missing model."""
from dataclasses import dataclass
from pathlib import Path
import hashlib
import json
from types import MappingProxyType
import numpy as np

from nmf_arrays import nonnegative_table, read_only, reconstruction, require_finite
from nmf_factor_alignment import change_component_gain, contribution_totals, row_contribution

SAVED_SHA256 = '46f3dc0931e3ccddc30cc3e30bbb4d3f330bc35a4dccccef33f74a63472eddd0'
CSV_SHA256 = 'd93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e'


def verified_bytes(path, expected):
    value = Path(path).read_bytes()  # Missing payload is an error, never a fallback fit.
    if hashlib.sha256(value).hexdigest() != expected:
        raise ValueError(f"Recorded input identity differs: {Path(path).name}")
    return value


@dataclass(frozen=True)
class SavedDigits:
    dictionary: np.ndarray
    amounts: np.ndarray
    observations: np.ndarray
    source_rows: tuple
    labels: tuple
    row_lookup: object
    metadata: dict


def load_saved_digits(directory=None):
    directory = Path(__file__).resolve().parent if directory is None else Path(directory)
    saved_bytes = verified_bytes(directory/'nmf_saved_state.json', SAVED_SHA256)
    csv_bytes = verified_bytes(directory/'digits-300.csv', CSV_SHA256)
    saved = json.loads(saved_bytes)
    if saved['scale'] != 16 or saved['side'] != 8 or saved['fit']['k'] != 8 or saved['fit']['seed'] != 19:
        raise ValueError("Expected the recorded eight-component inspection model")
    if saved['datasetSha256'] != CSV_SHA256 or saved['splitSizes'] != {'train':180,'validation':60,'test':60}:
        raise ValueError("Recorded measurement/split identity differs")
    expected_header = ['source_row','digit'] + [f'pixel_{j}' for j in range(64)]
    if csv_bytes.decode('utf-8').splitlines()[0].split(',') != expected_header:
        raise ValueError("Unexpected CSV feature order")
    from io import BytesIO
    raw = np.loadtxt(BytesIO(csv_bytes), delimiter=',', skiprows=1)
    require_finite(raw, "Recorded CSV")
    if raw.shape != (300,66) or np.any(raw != np.floor(raw)):
        raise ValueError("Expected 300 integer-valued source/label/pixel rows")
    source_ids, labels, pixels = raw[:,0].astype(int), raw[:,1].astype(int), raw[:,2:]
    if len(set(source_ids.tolist())) != 300 or np.any(source_ids < 0):
        raise ValueError("Source IDs must be unique nonnegative indices")
    if np.any((labels < 0) | (labels > 9)) or np.any((pixels < 0) | (pixels > 16)):
        raise ValueError("Recorded label or block-count range differs")
    h = nonnegative_table(saved['dictionary'],64,require_rows=True)
    w = nonnegative_table(saved['activations'],8,require_rows=True)
    if h.shape != (8,64) or w.shape != (60,8) or len(saved['test']) != 60:
        raise ValueError("Recorded dictionary/amount/test shapes differ")
    csv_lookup = {int(source):i for i,source in enumerate(source_ids)}
    selected, selected_labels, selected_ids = [], [], []
    for row in saved['test']:
        source, label = row['sourceRow'], row['digit']
        if source not in csv_lookup:
            raise ValueError("Saved observation is absent from the supplied CSV")
        at = csv_lookup[source]
        if label != int(labels[at]) or not np.array_equal(row['pixels'],pixels[at]):
            raise ValueError("Saved source/label/pixel correspondence differs")
        selected.append(pixels[at]/16.0)
        selected_labels.append(label)
        selected_ids.append(source)
    if len(set(selected_ids)) != 60:
        raise ValueError("Saved observations must have distinct source IDs")
    return SavedDigits(read_only(h),read_only(w),read_only(np.array(selected)),
                       tuple(selected_ids),tuple(selected_labels),
                       MappingProxyType({source:i for i,source in enumerate(selected_ids)}),saved)


def describe_saved_row(saved, source_row, *, component=None, gain=1.0):
    if isinstance(source_row,(bool,np.bool_)) or not isinstance(source_row,(int,np.integer)):
        raise ValueError("Source row must be an integer ID")
    if int(source_row) not in saved.row_lookup:
        raise ValueError("Source row is not among the saved reserved observations")
    at = saved.row_lookup[int(source_row)]
    w, h, x = saved.amounts[at], saved.dictionary, saved.observations[at]
    totals = contribution_totals(w[None,:],h)[0]
    c = int(np.argmax(totals)) if component is None else component
    addend = row_contribution(w,h,c)
    base = reconstruction(w[None,:],h)[0]
    changed = change_component_gain(w,h,c,gain)
    residual, changed_residual = x-base,x-changed
    with np.errstate(over='ignore',invalid='ignore'):
        mse, changed_mse = float(np.mean(residual**2)),float(np.mean(changed_residual**2))
    require_finite([mse,changed_mse],"Saved descriptive MSE")
    return {'source_row':int(source_row),'digit':saved.labels[at],'component_index':int(c),
            'amounts':w.copy(),'contribution_totals':totals,'selected_contribution':addend,
            'observed':x.copy(),'reconstruction':base,'residual':residual,
            'changed_reconstruction':changed,'changed_residual':changed_residual,
            'mse':mse,'changed_mse':changed_mse,
            'largest_coefficient_index':int(np.argmax(w)),
            'largest_contribution_index':int(np.argmax(totals))}


def main():
    np.set_printoptions(precision=10,suppress=True,linewidth=120)
    saved = load_saved_digits()
    totals = contribution_totals(saved.amounts,saved.dictionary)
    disagreements = np.count_nonzero(np.argmax(saved.amounts,axis=1)!=np.argmax(totals,axis=1))
    print('recorded_model',saved.metadata['fit'],'rows',len(saved.source_rows))
    print('dictionary_range',float(saved.dictionary.min()),float(saved.dictionary.max()))
    print('coefficient_contribution_disagreements',int(disagreements),'of',len(saved.source_rows))
    for source,component in [(242,0),(256,7)]:
        report = describe_saved_row(saved,source,component=component,gain=0)
        print('source',source,'digit',report['digit'],'selected_component',component+1)
        print('amounts',report['amounts'])
        print('contribution_totals',report['contribution_totals'])
        print('largest_coefficient',report['largest_coefficient_index']+1,
              'largest_total_contribution',report['largest_contribution_index']+1)
        for name in ['observed','selected_contribution','reconstruction','residual','changed_reconstruction']:
            print(name,report[name].reshape(8,8))
        print('mse_before',report['mse'],'mse_after_removal',report['changed_mse'])
        print('prediction_range',float(report['reconstruction'].min()),float(report['reconstruction'].max()))
    null = describe_saved_row(saved,242,component=7,gain=0)
    print('row242_C8_zero_change',np.array_equal(null['reconstruction'],null['changed_reconstruction']))


if __name__ == '__main__':
    main()
```


The full output is included so the image panels can be checked cell by cell. Each bracketed row is one image row; corresponding addresses line up across observed, addend, reconstruction and residual. Printed decimals are rounded for display, while the saved arrays and computations retain their floating precision.


```text
recorded_model {'k': 8, 'seed': 19, 'init': 'random', 'solver': 'cd', 'maxIter': 2000, 'tol': 1e-05} rows 60
dictionary_range 0.0 1.389323550924926
coefficient_contribution_disagreements 16 of 60
source 242 digit 8 selected_component 1
amounts [0.1764530626 0.7401606839 0.3550796829 0.0989837029 0.2751947643 0.6129899959 0.1857680493 0.          ]
contribution_totals [1.634815928  5.8145773787 4.0126467304 0.9372984975 2.9415933319 4.7593884933 1.7223346236 0.          ]
largest_coefficient 2 largest_total_contribution 2
observed [[0.     0.     0.125  0.75   0.75   0.     0.     0.    ]
 [0.     0.     0.4375 1.     0.9375 0.5625 0.0625 0.    ]
 [0.     0.     0.375  0.875  0.8125 0.9375 0.1875 0.    ]
 [0.     0.     0.0625 1.     1.     0.25   0.     0.    ]
 [0.     0.     0.4375 1.     0.875  0.     0.     0.    ]
 [0.     0.0625 0.9375 0.5625 1.     0.3125 0.     0.    ]
 [0.     0.125  0.8125 0.8125 1.     0.625  0.     0.    ]
 [0.     0.     0.0625 0.6875 0.75   0.3125 0.     0.    ]]
selected_contribution [[0.           0.           0.           0.0962058733 0.0722623497 0.0005776848 0.0029668758 0.001994617 ]
 [0.           0.           0.1023181683 0.0720161323 0.095477632  0.1317774072 0.0059882351 0.0009973085]
 [0.           0.0009643146 0.0201567046 0.           0.0345205974 0.2107821377 0.0435515093 0.0002630444]
 [0.           0.           0.           0.           0.0464046579 0.2356312938 0.0739440517 0.          ]
 [0.           0.0114531851 0.0101329707 0.           0.           0.1290025701 0.096991284  0.          ]
 [0.           0.0023411596 0.           0.           0.           0.           0.0109735616 0.          ]
 [0.           0.           0.           0.0328981905 0.           0.           0.           0.          ]
 [0.           0.           0.           0.092222411  0.           0.           0.           0.          ]]
reconstruction [[0.           0.022585453  0.1870876302 0.6760734135 0.7601806097 0.3701642678 0.0752956598 0.0083537086]
 [0.           0.0588452909 0.4961978641 0.7815983195 0.8670538405 0.5280479012 0.1445697176 0.0041768543]
 [0.           0.0958645454 0.3826829085 0.743377177  0.9408868169 0.5833206111 0.1163577965 0.0009045056]
 [0.           0.034748176  0.198114788  0.9231404716 0.9704310716 0.4656974688 0.0739440517 0.          ]
 [0.           0.0847283537 0.5269402451 1.0176746162 0.9783068564 0.2974194627 0.096991284  0.          ]
 [0.           0.1204754622 0.7191417693 0.8934560454 0.8058712648 0.2559012637 0.1830766214 0.0006406838]
 [0.           0.04904412   0.544364025  0.8053865493 0.6010478812 0.5122066075 0.289971746  0.0082552983]
 [0.           0.0216594995 0.2005259828 0.6118480305 0.8017602484 0.6996038536 0.1831558448 0.0035004488]]
residual [[ 0.           -0.022585453  -0.0620876302  0.0739265865 -0.0101806097 -0.3701642678 -0.0752956598 -0.0083537086]
 [ 0.           -0.0588452909 -0.0586978641  0.2184016805  0.0704461595  0.0344520988 -0.0820697176 -0.0041768543]
 [ 0.           -0.0958645454 -0.0076829085  0.131622823  -0.1283868169  0.3541793889  0.0711422035 -0.0009045056]
 [ 0.           -0.034748176  -0.135614788   0.0768595284  0.0295689284 -0.2156974688 -0.0739440517  0.          ]
 [ 0.           -0.0847283537 -0.0894402451 -0.0176746162 -0.1033068564 -0.2974194627 -0.096991284   0.          ]
 [ 0.           -0.0579754622  0.2183582307 -0.3309560454  0.1941287352  0.0565987363 -0.1830766214 -0.0006406838]
 [ 0.            0.07595588    0.268135975   0.0071134507  0.3989521188  0.1127933925 -0.289971746  -0.0082552983]
 [ 0.           -0.0216594995 -0.1380259828  0.0756519695 -0.0517602484 -0.3871038536 -0.1831558448 -0.0035004488]]
changed_reconstruction [[0.           0.022585453  0.1870876302 0.5798675402 0.68791826   0.369586583  0.072328784  0.0063590916]
 [0.           0.0588452909 0.3938796958 0.7095821872 0.7715762085 0.396270494  0.1385814825 0.0031795458]
 [0.           0.0949002307 0.3625262039 0.743377177  0.9063662194 0.3725384734 0.0728062872 0.0006414612]
 [0.           0.034748176  0.198114788  0.9231404716 0.9240264137 0.230066175  0.           0.          ]
 [0.           0.0732751685 0.5168072744 1.0176746162 0.9783068564 0.1684168926 0.           0.          ]
 [0.           0.1181343026 0.7191417693 0.8934560454 0.8058712648 0.2559012637 0.1721030598 0.0006406838]
 [0.           0.04904412   0.544364025  0.7724883587 0.6010478812 0.5122066075 0.289971746  0.0082552983]
 [0.           0.0216594995 0.2005259828 0.5196256195 0.8017602484 0.6996038536 0.1831558448 0.0035004488]]
mse_before 0.021503642602943913 mse_after_removal 0.024686350767946813
prediction_range 0.0 1.0176746162346788
source 256 digit 0 selected_component 8
amounts [0.2321911099 0.0119346027 0.3424206827 0.           0.1208154462 0.           0.6884925427 0.6280021306]
contribution_totals [2.1512220831 0.0937562239 3.8695912467 0.           1.2914123266 0.           6.3833072973 6.894594098 ]
largest_coefficient 7 largest_total_contribution 8
observed [[0.     0.     0.25   0.6875 0.9375 0.5    0.     0.    ]
 [0.     0.     0.8125 1.     0.6875 0.8125 0.4375 0.    ]
 [0.     0.1875 1.     0.75   0.     0.25   0.5    0.    ]
 [0.     0.375  1.     0.3125 0.     0.25   0.5    0.    ]
 [0.     0.4375 0.5625 0.     0.     0.5625 0.4375 0.    ]
 [0.     0.25   0.625  0.     0.125  0.9375 0.125  0.    ]
 [0.     0.0625 1.     0.75   0.875  0.625  0.     0.    ]
 [0.     0.     0.25   0.875  0.875  0.0625 0.     0.    ]]
selected_contribution [[0.           0.           0.           0.           0.1777509121 0.           0.           0.          ]
 [0.           0.           0.           0.2428343994 0.2671887916 0.           0.           0.          ]
 [0.           0.00304608   0.4036201918 0.392507132  0.           0.           0.           0.          ]
 [0.           0.2002405751 0.7939019174 0.1584499925 0.           0.1207764965 0.1257413818 0.          ]
 [0.           0.2456569539 0.5797584251 0.           0.0263542947 0.5211370489 0.1599000852 0.          ]
 [0.           0.071171417  0.1681912529 0.           0.1181309355 0.6882943943 0.1984023659 0.0003959304]
 [0.           0.           0.           0.           0.430946372  0.3338516655 0.0126308545 0.          ]
 [0.           0.           0.           0.0488815581 0.404832674  0.           0.           0.          ]]
reconstruction [[0.           0.0632094672 0.4004008288 0.7211268938 0.633156511  0.3971504474 0.0832506895 0.0033096755]
 [0.           0.1775870282 0.8427424949 0.7848613841 0.5268212701 0.5455821363 0.1160034882 0.0016548378]
 [0.           0.2504980524 1.1482597628 0.4483869856 0.0454249743 0.4831078699 0.1021253658 0.0003461349]
 [0.           0.3290240778 1.227710461  0.4058839944 0.1327996739 0.5273718869 0.2230429031 0.          ]
 [0.           0.2619094884 0.6876903267 0.1682255105 0.1226660202 0.7495299599 0.2875290056 0.          ]
 [0.           0.1068000638 0.462880859  0.0986256254 0.3370795841 0.818832078  0.3671252025 0.0008188475]
 [0.           0.0577963967 0.644125368  0.4880684399 0.7861688258 0.7088372402 0.2842154784 0.005888849 ]
 [0.           0.0557406433 0.420215874  0.8033410402 0.8074767377 0.3954786525 0.1334531266 0.0025247366]]
residual [[ 0.           -0.0632094672 -0.1504008288 -0.0336268938  0.304343489   0.1028495526 -0.0832506895 -0.0033096755]
 [ 0.           -0.1775870282 -0.0302424949  0.2151386159  0.1606787299  0.2669178637  0.3214965118 -0.0016548378]
 [ 0.           -0.0629980524 -0.1482597628  0.3016130144 -0.0454249743 -0.2331078699  0.3978746342 -0.0003461349]
 [ 0.            0.0459759222 -0.227710461  -0.0933839944 -0.1327996739 -0.2773718869  0.2769570969  0.          ]
 [ 0.            0.1755905116 -0.1251903267 -0.1682255105 -0.1226660202 -0.1870299599  0.1499709944  0.          ]
 [ 0.            0.1431999362  0.162119141  -0.0986256254 -0.2120795841  0.118667922  -0.2421252025 -0.0008188475]
 [ 0.            0.0047036033  0.355874632   0.2619315601  0.0888311742 -0.0838372402 -0.2842154784 -0.005888849 ]
 [ 0.           -0.0557406433 -0.170215874   0.0716589598  0.0675232623 -0.3329786525 -0.1334531266 -0.0025247366]]
changed_reconstruction [[0.           0.0632094672 0.4004008288 0.7211268938 0.4554055989 0.3971504474 0.0832506895 0.0033096755]
 [0.           0.1775870282 0.8427424949 0.5420269847 0.2596324785 0.5455821363 0.1160034882 0.0016548378]
 [0.           0.2474519724 0.7446395709 0.0558798536 0.0454249743 0.4831078699 0.1021253658 0.0003461349]
 [0.           0.1287835027 0.4338085436 0.2474340019 0.1327996739 0.4065953904 0.0973015213 0.          ]
 [0.           0.0162525345 0.1079319016 0.1682255105 0.0963117255 0.228392911  0.1276289204 0.          ]
 [0.           0.0356286469 0.294689606  0.0986256254 0.2189486486 0.1305376837 0.1687228366 0.0004229171]
 [0.           0.0577963967 0.644125368  0.4880684399 0.3552224538 0.3749855747 0.2715846239 0.005888849 ]
 [0.           0.0557406433 0.420215874  0.7544594822 0.4026440637 0.3954786525 0.1334531266 0.0025247366]]
mse_before 0.02758816154887481 mse_after_removal 0.0732625383196997
prediction_range 0.0 1.227710460954826
row242_C8_zero_change True
```


For row 242, the C1 removal increases MSE from about 0.02150364 to 0.02468635. For row 256, C8 removal gives the larger change studied above. The final `True` is the separate row-242/C8 null case. An MSE is an average over 64 squared feature residuals, not a percentage of wrongly classified digits.

The source-ID and file checks protect correspondence; they do not validate the model statistically. We have learned to read **what this saved representation does**. The next section asks a different question: **how was a representation chosen, and what does its independent comparison actually support?**
