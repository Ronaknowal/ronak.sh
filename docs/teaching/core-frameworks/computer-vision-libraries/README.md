# Computer Vision Libraries — full delivery

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Stable title retained. Core outcome is a correct, inspectable image/annotation pipeline with ordinary tools and scratch coordinate/filter mechanisms. Existing convolution, PyTorch and transfer-learning lessons own architectural derivations and model fitting; this topic must explain its new image-library contracts without recreating those whole lessons.

## Content checkpoint — 28 September 2026

Complete manuscript `src/learn/data/topics/computer-vision-libraries.jsx`; program `public/learn-code/computer-vision-libraries/vision_pipeline.py`. Constructed pixel and annotation fixtures are deliberately exact arithmetic/interface experiments, not purported natural-image learning results. The pretrained inference pattern is a separate explicit image+weights-dependent example, not the offline execution claim. Parent owns ledger/publication.

| Concept hurdle | Teaching support | Scratch / ordinary tool ownership |
| --- | --- | --- |
| Same shape, different meaning | Selected RGB/BGR pixel, HWC→CHW→batch, range/normalization (§1) | Explicit arrays/permutation/scaling, Pillow/OpenCV/torchvision |
| Hidden local products | 4×4 ramp, 3×3patch, multiply-sum and signed filter (§2) | NumPy sliding-window correlation and cv2.filter2D |
| Geometry changes frame | Pixel-edge XYXY crop/clip/flip, full removal (§3) | Explicit coordinate function vs typed torchvision joint transform |
| Image and label interpolate differently | Discrete [0,2] mask counterexample, shared random event (§4) | Explained typed-mask route; further native fixture in verifier |
| Working operator → complete pipeline | Full executable same-input assertions (§6) | No model/large dataset download required |
| Training/inference contract | Explicit weights enum, transforms, eval/inference_mode, deployment unit (§7) | Earlier owners linked, real-file/weights snippet explicitly scoped |

## Visual specifications

**Image contract figure (§1):** show the constructed 6×4 pixel grid, highlighted location(y1,x1), and values RGB[255,64,0]↔BGR[0,64,255]; separate reflowing HWC[4,6,3]→CHW[3,4,6]→batch[1,3,4,6]. Geometry represents pixels, not text flow. Actual orange object is data, neutral/amber interface. Show values in HTML, SVG only short labels/rectangles.

**Pixel/filter lab (§2):** input4×4ramp0..15, input pixel selection with real number/range editor0..15, kernel selector mean versus signed horizontal difference; select one of four valid output windows. Show source patch boundaries, 3×3weights, individual products and summed result; other outputs update too. Initial top-left mean5; changing input(0,0) to9 adds1 to that output but not the other three; zero image gives zero for both; constant nonzero image gives that value for mean and zero for edge. Output scale fixed for0..15and−45..45; signs shown numerically. Bounded16cells, no training. Real controls, no prediction feature. Restore original image/kernel/window on reset. Phone stacks grids/products; no thumbnailing long labels.

**Crop/flip lab (§3):** original6×4frame, object pixels columns1..3 rows1..2, box[1,1,4,3]. Controls crop-left0..5, width1..(6−left), horizontal flip. Show original frame with crop boundary and selected object, then output frame and transformed box. Exact formula/readout, visible area and object retained/removed state. Initial crop-left2,width3,flipfalse yields[0,1,2,3]; flip yields[1,1,3,3]; left4width2 fully removes; fullwidthflip yields[2,1,5,3]. Do not silently relabel older results after a setting change. Limits are integral pixel-edge horizontal crops; arbitrary rotation/projective geometry is explained, not simulated. Reset restores defaultcrop. Phone stack and fixedcellscale preserve box correspondence.

## Research and native evidence scope

Primary pages checked 28 September 2026: Pillow concepts/ImageOps EXIF transpose; OpenCV filter2D API explicitly says correlation, unlike the broader tutorial wording; torchvision v2 transforms dtype/ranges/typed targets and official end-to-end example; model weights metadata and PyTorch transfer-learning tutorial. The tutorial pages supply original explanatory support; no video viewing claim. Library versions are stated rather than treating current docs as evidence of installed behavior.

URLs: `https://pillow.readthedocs.io/en/stable/handbook/concepts.html`, `https://pillow.readthedocs.io/en/stable/reference/ImageOps.html#PIL.ImageOps.exif_transpose`, `https://docs.opencv.org/4.x/d4/d86/group__imgproc__filter.html`, `https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html`, `https://docs.pytorch.org/vision/stable/transforms.html`, `https://docs.pytorch.org/vision/stable/auto_examples/transforms/plot_transforms_e2e.html`, `https://docs.pytorch.org/vision/stable/models.html`, `https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html`.

Native complete pipeline executed: RGB/BGR, CHW-scaled values, joint image/box flip, crop function and mean-filter equality pass. `scripts/verify-framework-data-contracts.py` additionally compares an asymmetric filter to OpenCV, verifies the removed-box and changed-frame practice cases, and checks typed mask resize preserves discrete IDs0/7. Exact environment, public-program identities and results for the three adjacent interface lessons are retained in `native-evidence.json`; `author-evidence.json` binds this lesson's source/runtime/blueprint. `node scripts/verify-framework-data-contracts.mjs` passed changed-pixel locality, signed/constant filters and all42 supported crop/flip choices against independently mapped pixel columns.

Author heuristic learning review: a colored pixel distinguishes channel order from shape; the filter's source patch/products/output expose correlation rather than only naming an operation; the crop figure keeps pixels and box in one coordinate frame; mask interpolation has a numerical counterexample; the library route reuses the same data and explains exact outcomes. The pretrained snippet is clearly separate from executed fixtures. Both investigations update immediately with entity edits and reset. SVG image cells retain their scale for narrow crops rather than stretching a one-column crop into a giant visual. Practice changes channel values, frame and kernel, with visible prompts and separate feedback. This is an author assessment, not independent review or a learner study.

Parent reported successful desktop/narrow interaction and shared code-control checks; final source-bound browser/production receipt remains parent-owned. This author record does not label those checks independent.

[Independent review](independent-review.md) by frameworks_functional_tracking is complete with no open source blocker; `independent-review.json` records source identities and 128 independent perturbation/locality comparisons. The author inspected both labs in desktop, 320px and edited states: source patch, individual products, signed output, crop pixels, transformed boxes and formula/readout agree. A concrete narrow-width finding—list markers outside the contribution panel and small equation type—was fixed with explicit 14px calculation text and inline-start padding. Parent owns the targeted recapture and final integration receipt; numerical evidence is unchanged.

Targeted painted closure: the author viewed the corrected filter lab in desktop, 320px and signed-kernel/edited-pixel captures under `scratch/core-frameworks/final-corrections/`. All nine list markers and products are inside the panel, the 14px calculation text is readable, and the highlighted patch, kernel and output still agree. The marker/type finding is closed; no further source change is needed. Own lesson/runtime/program sources are frozen. Root additionally reports the scoped load-boundary and shared recovery checks passed.
