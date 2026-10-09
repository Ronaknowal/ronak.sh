# Rendered visual review: vocabulary design

28 September 2026. Reviewed the final production screenshots supplied by root, separately from the frozen content and numerical-source reviews. No runtime files were edited during this review.

## Images actually inspected

Eleven static figures were inspected at desktop and 320-pixel viewport widths: dictionary alternatives (figure 0), byte/character coverage (1), fertility (2), sampling transform (3), embedding rows (5), output/attention work (6), normalization collision (8), train/holdout plan (9), recorded multilingual counts (10), row-address compatibility (11), and softmax expansion (12).

Both live labs were inspected at desktop and 320 pixels, plus their generic changed-control captures. Mechanism-specific captures cover zero corpus weights, excluded language alphabets, and a doubled vocabulary/halved sequence with untied tables. The opening/learning compass and the enlarged-text mixture lab were also viewed. This is 33 images in total. The JSON lists each actually viewed image, its SHA-256, and its durable retained path under ../beginner-screenshots/.

## Observations

- The three dictionary alternatives keep dictionary entries separate from words being encoded. Totals 7, 3 and 4 are prominent. At 320 pixels each alternative becomes a vertical group without losing its word labels or total.
- Repeated pieces retain their colors. The byte/character/whole-string example shows six/two/one pieces with reconstructing text visible. The fertility calculation remains alongside its two actual word groups.
- The sampling transformation reads as three explicit steps on desktop and stacks in the same order on narrow screens. Both exposure bars retain labels; the small original B share is identified in the surrounding arithmetic.
- The embedding table keeps ID, piece and all three values visible at 320 pixels. The selected cat row and 5×3 parameter count remain clear.
- The output-score grids now use equal-sized cells across the two cases. Twenty cyan cells are visible in both, and sixteen versus four violet cells communicate the different attention change. All ten candidate columns fit at 320 pixels.
- The normalization transformation points right on desktop and down in the stacked narrow layout. Both source spellings and their meanings remain visible.
- The experiment flow preserves the distinction between 300 fitting sentences, four settings, and 60 untouched test sentences. Recorded result bars use a common scale and retain all twelve raw totals at both widths.
- Row-address routes retain the original, erroneous and appended cases independently. At narrow widths arrows and row labels wrap within their own case rather than merging cases.
- The softmax comparison retains four equal 25% shares versus five equal 20% shares. At 320 pixels photovoltaic wraps within the fifth cell; the probability and cell ownership remain clear. No clipping or overlap was observed there.
- Live controls, defaults and reset buttons are legible. The default mixture visibly shows the cats/Hindi tradeoff; excluding alphabets produces an explicit cannot-encode explanation, and the all-zero case requests positive training weight without bogus output.
- The budget interaction visibly renders two untied tables and shows output-head ratio 1× with attention-pair ratio .25×. The default matrix bar has its expected amber fill.
- The enlarged-text mixture capture preserves readable control labels, input fields and wrapped token pieces. This screenshot is a check of that lab, not a claim that every figure was visually inspected at enlarged text.

## Initial findings reported to root (closed below)

No diagram overlap, lost content, misleading cell scale or mechanism blocker was found in the inspected images. One minor control readability issue was reported for root to assess: the final digit of candidate vocabulary value 206000 appears partly clipped in the generic changed-budget screenshot, although the calculated row readout below correctly displays 206,000. The default 128000 and specific 64000 captures fit. A wider number field would address this if confirmed.

The earlier mixture's singular token count said “1 pieces”; this was a small copy issue, not an incorrect count or interaction failure. It was reported without editing frozen runtime source.

## Final targeted follow-up

Viewed eight additional production captures after root widened the topic's number column to eight rem and fixed both singular captions: mixture at desktop and 320 pixels; budget at 206000 and 256000 at desktop and 320 pixels; and both labs with 200% root-font sizing. All six digits are now fully visible at both tested vocabulary values. The default mixture displays “1 piece” in both baseline/current captions. The wider number fields still fit alongside their sliders at 320 pixels; the enlarged-text captures show complete values and wrapped labels. Both reported findings are closed, and no new blocker was observed.

The final inspection totals 41 images. The eight follow-up images have distinct control-fix filenames; earlier captures remain retained as evidence of the observed pre-fix state. Final runtime source hashes are recorded separately from the initial capture bindings. Root's beginner-control-layout-checks.json supplies the associated interaction/overflow checks; this record adds actual image inspection. No numerical behavior was changed or rerun by this visual reviewer.

## Boundaries

This review examines captured renderings, not a claim to have driven browser controls personally. Root's separate automation owns actual interactions, layout bounds, code/download behavior and production build acceptance. Source/program numerical checks remain in their existing receipts. No learner study or performance benchmark is implied.

