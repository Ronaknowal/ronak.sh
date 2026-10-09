# Visualization — full authoring record

Full mode, stable title retained. Preflight28 September2026: planned/unstarted, no destination note; unrelated resolved inbox excluded. Canonical content checkpoint is `src/learn/data/topics/visualization.jsx` plus two complete programs in `public/learn-code/visualization/` and these specifications. Parent owns checkpoint hashing before runtime work.

Outcome: trace scientific questions through observation unit, statistic, encoding, scale and output; implement histogram/coordinate mechanics and ordinary Matplotlib/seaborn/Plotly routes. Reused NumPy arrays and existing Wine CSV provenance from training diagnostics/PyTorch. No plotting-engine reconstruction promised. New ownership is exact bin assignment/density/coordinate mapping, not a new inferential estimator. Title fits scoped tooling lesson.

Canonical coverage reviewed: Wilke distributions, coordinate systems and uncertainty; Matplotlib Quick Start section structure; NumPy histogram; seaborn uncertainty; Plotly HTML export. Sources read28 September2026. Include encodings, linear/log and baseline semantics, density/ECDF, observation spread vs intervals, grouped normalization, missing/outlier/overplotting, color and accessibility, reproducible export. Geographic projections, interactive dashboard architecture and inference derivations remain separate deeper topics, not advertised local implementations. Wilke's equal-width count discussion is adapted with independently verified unequal-width density treatment rather than copied as a universal histogram constraint. No video assessed substantively enough to endorse.

Real data: canonical178-row UCI Wine file under `public/learn-assets/neural-training-diagnostics-reproducible-experiments/wine.csv`, CC BY4.0, Aeberhard/Forina. Exploratory alcohol-by-cultivar comparison; all-data plotting is descriptive, no claimed held-out accuracy. The exact hand fixture is constructed and explicitly labeled.

| Hurdle | Local bridge | Representation / evidence |
|---|---|---|
| Observation versus statistic versus mark | §1 one wine and concrete questions | Static pipeline diagram with quantities at each step |
| Bin ownership / unequal widths | §2 exact8 values and edges | Histogram lab plus exact counts/areas; NumPy parity |
| Difference versus ratio / pixel mapping | §3 explicit affine mapping | Linear/log dual ruler with editable value; endpoints/midpoint checks |
| Spread versus inference | §4 equal means/different data, interval table | Real-data mean±SD explicitly labeled; changed practice |
| Own mechanism / use renderer | §5 complete binning and SVG scales | Same counts/density to scratch SVG and Matplotlib |
| Group normalization / study limits | §6 same edges, counts59/71/48 | Real exports and recoverable JSON |
| API layers / output lifetime | §§7–8 actual seaborn/Plotly workflow | Offline HTML and static output with units, provenance |

## Visual and investigation specifications

Pipeline figure at§1: HTML lanes observation[alcohol13.2,cultivar0]→declared bin assignment→count/density→rectangle with explicit axes. Arrows are operations, not timing. Reflow vertically on phones; no hidden explanation.

Histogram lab at§2: initial fixed first7 values[1,1,2,2,3,4,7] plus editable eighth value8 in[0,8] step.25. Bin policy unequal[0,2,4,8] or equal[0,2,4,6,8], height count or density. Source observations shown in readable chips; true x widths in histogram, zero y baseline, current max determines labeled y axis. Exact table exposes each interval,count,width,height,area. Explain count areas misleading under unequal widths; density area1. Edit value across a boundary affects exactly one old/new bin; boundary8 included; reset all. Numeric keyboard twin. Model is exactly calculated, no data inference. Observe current outcome immediately. At equal widths count areas proportional; this is the intended null contrast.

Scale lab at§3: values1,floating editable10,100 with middle value1–100. Two horizontal rulers same fixed pixel width, linear domain1–100 and log10 domain0–2. Endpoints1/100 and selected value shown; labels outside geometry, avoid collisions when selected value coincides with endpoints. Exact normalized positions are in HTML. Geometric midpoint10 is centered on log ruler and9/99 on linear. Endpoints coincide as null; reset10. No fake timings or synthetic benchmark.

Real-data figure at §6 was added during author review so the question is visibly answered on the page. `visualization-wine-summary.json` is generated from the canonical CSV by the executed program and bound to its SHA256. Three separate cultivar histograms share edges10.5–15.5 and density axis0–1, all actual densities below1. Panels reflow, sample sizes and mean/SD appear in HTML, and an exact table preserves the bin counts. The visible mean differences and overlap support descriptive interpretation, without requiring a code run to see the result.

## Author verification and continuation

`node scripts/verify-visualization-models.mjs`:132 bin/control configurations pass count conservation, density area and independently worked boundaries/scale positions. `scratch/framework-lesson-runtime/Scripts/python.exe -B scripts/verify-visualization-native.py --write-summary` executes both public programs and compares40 random unequal-edge fixtures including every endpoint to NumPy, plus empty/outside/nonfinite/invalid-edge cases. SVG exports parse. Wine counts59/71/48, means13.74474576/12.27873239/13.15375 and total178 are actual output. NumPy2.3.5, Matplotlib3.11.2, seaborn0.13.2 and Plotly7.1.0; self-contained HTML4.83MB is a local learner export, never bundled into the lesson. Source hashes and full results are in native-evidence.json.

Author learning pass: no prediction gates or hidden teaching; each representation is introduced before its API, data/aggregation/scale remain distinct, unequal bins expose the misleading-count-area case, log midpoint and coincident endpoints show contrast/null, real data is visible and source-bound. Corrected prose number-spacing and reformatted the public library workflow for readability. Core plots remain bounded and no plotting packages ship to the browser. This is author assessment, not independent/browser certification. Next: independent review and parent-owned rendered/build/integration checks.
