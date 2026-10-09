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

<!-- source:nmf_factor_alignment.py -->

The following output comes from this program's small constructed example. Its zero third pattern is deliberately included to show the unused-pattern rule; it is separate from the eight-component digit inspection.

<!-- output:nmf_factor_alignment.stdout.txt -->

Read `pairs=((0,1),(1,0))` as original pattern 0 matching the other dictionary's pattern 1 and vice versa. The cost is zero because only scale and order changed. The duplicated two-pattern example has a genuine alternative correspondence. Neither matching changes the reconstruction or supplies a physical identity.

### Read the recorded images reproducibly

How do we preserve the exact dictionary behind the pictures? Read a complete saved state and its attributed measurement file, and refuse a mismatched or missing input.

The next program needs four local siblings: `nmf_arrays.py`, `nmf_factor_alignment.py`, the complete `nmf_saved_state.json`, and `digits-300.csv`. Keep `digits-data-provenance.md` with them for source, license, selection and units. The shared file index contains each of these. With NumPy and SciPy available, run `python nmf_saved_digits.py`. This reader needs no scikit-learn import, network request or new fit. The saved model was produced using the separately recorded environment and fitting program; reading it in a new environment does not create a new training result.

`verified_bytes` binds the two inputs to the exact example. `load_saved_digits` checks the fixed scale, model, feature order and shapes, then matches every reserved observation by its source ID, label and 64 raw measurements. Source ID is an address, not an array position. The saved H, W and observed arrays are read-only and the source-ID lookup cannot be edited through its mapping interface. The metadata dictionary is descriptive ordinary Python data; it is not advertised as recursively immutable.

`describe_saved_row` uses the same contribution functions as the pictures. It returns the observation, selected addend, reconstruction, signed residual, controlled changed reconstruction and both MSEs. The original saved amounts are not overwritten. Missing files raise a clear file error, and a changed hash raises an identity error. There is deliberately no fallback that silently trains a different model while displaying these recorded claims.

Save the source as `nmf_saved_digits.py` beside those inputs.

<!-- source:nmf_saved_digits.py -->

The full output is included so the image panels can be checked cell by cell. Each bracketed row is one image row; corresponding addresses line up across observed, addend, reconstruction and residual. Printed decimals are rounded for display, while the saved arrays and computations retain their floating precision.

<!-- output:nmf_saved_digits.stdout.txt -->

For row 242, the C1 removal increases MSE from about 0.02150364 to 0.02468635. For row 256, C8 removal gives the larger change studied above. The final `True` is the separate row-242/C8 null case. An MSE is an average over 64 squared feature residuals, not a percentage of wrongly classified digits.

The source-ID and file checks protect correspondence; they do not validate the model statistically. We have learned to read **what this saved representation does**. The next section asks a different question: **how was a representation chosen, and what does its independent comparison actually support?**
