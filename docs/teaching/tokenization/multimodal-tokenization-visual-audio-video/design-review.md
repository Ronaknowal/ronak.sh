# Independent design review

Reviewer `/root/multimodal_reviewer`, 6 October 2026. Reviewed the entire `design.md` at SHA256 `03597905148f9bda7f23f113b7316b02999f62633bd92be6401d42c15b09434a`, after the complete original-source audit. This is a design assessment, not implementation/browser/native acceptance. Reviewer owns this record; root owns design amendments and phases.

## Assessment

The design repairs the foundational misconception at the first step: IDs retrieve vectors; continuous encoders can supply vectors. Patches follow locally with actual grid/flatten/shared-projection geometry, then continuous interfaces, nearest-code geometry, stopped-gradient routes and training, before utilization, RVQ, modality-specific sequence structures and budgets. This reading order is coherent and preserves the old useful mechanisms while removing its invented generalizations.

Foundation jobs are explicit: actual 2D pixels and feature widths; a codebook plane and index-to-vector return; separate forward/backward paths; residual vectors and level×time matrix; 3D video grouping and a sampled-event timeline; named namespace ranges and causal-target alignment. No plan relies on a downstream plot to introduce the basic object. Native scratch/maintained-library ownership and the held-out real-digit dataset make the computational outcomes concrete.

Colour is appropriate to the mechanism: labelled global modality hues, local explicitly renamed patch/code identities, grayscale pixel magnitude and selection outlines that do not replace identity. The review should later trace the same patch and k3 through actual painted views, rather than certify a palette from this specification. Planned phone recomposition, textual alternatives and zero/edited/tie states are adequate design contracts pending actual inspection.

Independent algebra confirms:

```text
VQ z=(.8,.6), selected e=(1,1): squared error .04+.16=.2
RVQ next code=(-.5,-.5): residual=(.3,.1), squared error .09+.01=.1
RVQ third code=(.25,.25): residual=(.05,-.15), squared error .0025+.0225=.025
Scalar target0,z=.8,e=1,beta=.25:
reconstruction1, derivative forwarded to encoder through STE2
codebook loss.04, derivative to selected code .4
weighted commitment .01, derivative to encoder -.1
combined encoder gradient1.9; selected-code gradient .4 for the stated routes
P2 on4x4:4 patches; P1:16; P4:1
4 frames,4x4,P2,tau2:8 tubelets versus16 frame patches
75 frames/s *8 levels *10 fixed-width bits =6000 bits/s;600 IDs/s
T2,L8 budget:20+4+16+2*75*8=1240;2048-1240=808
T0:40 positions
```

These are independently derived design values, not a claim of executing successor code.

## Findings requiring a bounded amendment

| ID | Location / consequence | Required closure |
| --- | --- | --- |
| D1 | Video-timeline figure specifies four4fps samples0,.25,.5,.75 while acceptance claims interval[0,2). A learner could infer inconsistent durations/counts. | State all eight4fps timestamps0,.25,.5,.75,1,1.25,1.5,1.75, or explicitly label the short list an excerpt. Preserve1fps timestamps0,1, event[.45,.55] and half-open interval. |
| D2 | Ending map calls a positional-embedding owner the next route. Actual LLM syllabus follows this topic with Dynamic Tokenization. | Use next-in-module `dynamic-tokenization-adat-boundlessbpe-litetoken`; positional encodings can remain a separately labelled deeper connection. Checked `track-definitions.js`259–260 and `lesson-manifest.json`72/179. |

Nonblocking implementation reminder: distinguish VQ tokenizer training from subsequent learned-prior/LM training before claiming generated codes decode into images; mask input-only visual targets according to the actual configured objective, not as a universal multimodal rule. The written design already gives these concepts homes; final whole-source review will inspect the actual explanations.

Status: design is acceptable subject to D1/D2 amendment. No final acceptance or phase completion is inferred. Root has received both findings directly. This record will append exact amendment closure after it exists.

## D1/D2 amendment closure

Read the amended complete design at SHA256 `a83126fb4f4abc5b7b757b9a7bc87930882f7a6f252739b5e66f48ad899c2de7`. D1 now explicitly lists eight4fps instants on[0,2), and D2 identifies the actual next-in-module Dynamic Tokenization route while keeping positional encodings a separate connection. Confirmed next topic in `src/learn/data/track-definitions.js`259–260 and stable ID `dynamic-tokenization-adat-boundlessbpe-litetoken` in `lesson-manifest.json`72. Both design findings closed. The design is independently accepted as an actionable writing/implementation contract; actual manuscript/native/runtime acceptance remains separate.
