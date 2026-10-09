# Section 12: exact D42–D45 implementation contracts

Content phase only. Use literal saved `nmf_saved_state.json` and selected source IDs, not regenerated fits. Follow existing lesson-flow neutral observation/result, persistent nominal C1–C8 colours, amber attention and white outlined selection. Labels and IDs survive without colour. No card frames, banners or separate lab headings. Every marker precedes its walkthrough. Images use fixed 8×8 geometry with row/column orientation; no smoothing, autoscaling or clipped values. Keep all intermediate states visible, stack complete panels at narrow widths, retain readable labels/axis legends at 390px and 768px/200% text. SVG text must not carry the whole accessible alternative: supply adjacent current-state sentence and a labelled numeric table/details for pixels.

## D42: literal dictionary anatomy

Eight true saved dictionary rows, each reshaped 8×8 in row-major order and named C1…C8. Shared sequential intensity ruler 0–4 **per unit amount**; scale ticks 0/1/2/3/4 and actual max 1.389323550924926 remain visible. Component identity is a thin ID/key or outline, not an inconsistent magnitude palette. First show whole8×8 pattern; an inset traces row4/col3→F35, with row/column axes0…7. Static magnification of C1 repeats exactly its values. No probability/recognized-digit/verified-source label. All maps stack as intact units on narrow screens; their scale must not silently change.

## D43: amount → weighted pattern → sum → signed residual

Only three directly local controls, in this order below the pictures: source select242/256, component selectC1…C8, gain range0…2 step.05 default1. Reset returns242/C1/gain1. Persist source observation, selected rawH, saved W amount and edited gW amount, selected edited addend, all-component sum and signed residual. Explicit arrows say multiply gW×H then add to **other seven contributions**. Image ruler0–4 shared, residual ruler−4…4 separately labelled observed−reconstructed. Label source242 digit8/source256 digit0 outside feature cells. Dictionary component identity must survive source switches. Show exact current MSE and live sentence “Only C… amount changed from … to …; H and the other amounts stayed fixed.” Default242/C1 is nonzero; reachable242/C8 is zero and sentence explains no change. Label selection separate from identity. Bounds are justified by all reachable selectedgain2 maxima2.021612378341206; no output clipping. Independent scalar pixel equations agree with every panel.

## D44: two units, same eight IDs

Static row256 amounts and total contributions. Two separate zero-origin axes with explicit units; no common axis implying equal measurement. Use exact arrays in manuscript/reader output, sameC1…C8 identities in same order. Label maximaC7 amount.6884925427238711 andC8 total6.8945940980317655. Explain16/60 saved-row ranking disagreement as descriptive count, not majority or benchmark. Full eight-pair table stays available; do not substitute a ranking mode selector.

## D45: controlled removal

Fix source256 and C8. One range removal fractionr0…1 step.02 default0; Reset0. Observation, removed amount rW_C8H_C8, current prediction base−raddend, and current signed residual remain visible. Show MSE0=.02758816154887481 and r1=.0732625383196997, current MSE computed from unrounded64vectors. Shared0–4 ruler/signed−4…4. Caption explicitly states no refit/other amounts fixed. Nullr0 equals saved prediction; r1 differs by exact64addend. The nearby derivation explains exact NNLS optimality/tolerance, never calls this real causal intervention. Use no fabricated generalized monotone curve or r-dependent optimizer run.

## Deliberate bounded N8 cost amendment

Accepted N8 core builds costs O(k²d), one assignment O(k³). A global ambiguity status cannot be certified just by detecting duplicated patterns. Current code adds a small-display, optional edge-exclusion audit, at mostk further assignment solves, conservative O(k⁴) total, capped by `audit_limit=64`; above it status explicitly not audited. This improves correct ambiguity reporting, preserves core routes/output domains and avoids claiming global uniqueness. No model fit was added. Author's 70 checks include brute-force small independent assignments and a tied optimum with distinct patterns. This amendment needs Root's whole-content disposition; it is stated here rather than silently retaining the old cost claim.
