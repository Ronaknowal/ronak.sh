# Tensor Shapes, Autograd Graphs & Device Boundaries

28 September 2026 · full mode · ID preserved.

## Scope and content checkpoint

Preflight confirmed planned/unpublished, no prepared content/destination note. Stable title fits. Reuse exact NumPy/PyTorch array and stride reasoning; read actual `pytorch_state_and_gradients.py`. Read `teaching-autodiff.py` and `engine-library-bridge.py` from Backpropagation: its `reduce_to_shape` owns general broadcast pullbacks and its `Tensor` owns reverse traversal. This lesson explicitly derives the local affine pullbacks and compares an ordinary nn.Linear loop; it does not fork the autodiff engine. Module next is Dataset Loaders, Checkpoints & Exact Resume Contracts, not an inferred publication order.

Complete topic JSX, individual blueprint and both complete canonical Python programs saved before runtime labs. Parent owns central phase/publication. No outcome is deferred to later writing: manuscript includes explanations, scratch/program routes, solved practice and annotated authoritative alternatives.

## Research and learning hurdles

Official PyTorch 2.14 broadcasting, tensor views, autograd mechanics, detach/clone/to/grad contracts and leaf/non-leaf/tensors/autograd tutorials were inspected 28 September 2026. Use concrete cross-pairing and two independent graphs (storage vs derivative) instead of an API glossary. Source-to-runtime limits: tested CPU runtime is 2.14.0+cpu; CUDA transfer gradient branch conditional and no GPU execution claim.

- Axis names before operations: X[B,F] × W[F,O] + b[O] → predictions[B,O] → paired Y[B,O] → scalar half mean squared loss. Semantic figure uses reflowing labeled arrows and a separate reduction line. Permute vs reshape, squeeze with B=1, stack vs concatenation all have local intuition.
- Silent broadcasting: live lab predictions p0/p1 default1/3 and targets y0/y1 default2/4, range−4..6 step.25. Always show paired [2,1] residual column and erroneous [2,2] matrix, matching losses and derivatives. Default L=.5 vs1.5; gradients[−.5,−.5] vs[−1,0]. Changing y1 changes only paired p1 derivative but both cross derivatives. Reset restores all4. Direct labels and fixed cell semantics; color optional reinforcement only.
- Reversing operations: local G=R/(B×O); dW=X.T@G, db=sumrowsG, dX=G@W.T. Explicit reason sum reverses reused bias, not an extra mean. Complete matched30step loop with nn.Linear orientation explained. General engine linked, not duplicated.
- Dependency versus storage: live scalar w×x+b, half-square residual. Controls w default2, x3, b1, target0; routing connected/clone/detach/detached-copy. Same forward/loss across modes. Graph steps expose product/output/residual/loss and reverse derivatives. Default gradw21,gradb7; detached weight is None while bias remains7. Storage allocation same/new shown separately. At fitted target=output connected gradients0, detached remainsNone. Reset restores default. No answer gate and no draggable-looking static marks.
- Missing gradients: leaf vs nonleaf storage, grad buffer accumulation, no_grad/eval/retain/create graph differentiated; actual VJP/HVP prerequisite linked. Device/dtype changes include differentiable floating copy, integer cutoff, new detached leaf, alias mutation saved-value rejection. Mask/reduction denominator and temporary device creation briefly bridged without duplicating later training/state owners.

## Review contract

Planned native tests: manual gradients vs PyTorch + independent central finite differences across multiple shapes; bad targets reject; paired/cross default and edited values; four graph modes; zero-vs-unused; alias/clone mutation; dtype copy/leaf behavior; saved-value mutation error. Optional CUDA branch remains unexecuted if no hardware. Browser labs need all sliders and selects plus reset, coherent matrix labels on320px, no overflow at enlarged text. Parent owns browser/build/publication; independent reviewer checks complete manuscript and semantic code.

## Author implementation checkpoint

Manuscript, topic-specific residual/gradient/storage visuals, two immediately playable labs and both programs are implemented. Author learning review confirmed conceptual transitions, named axes, changed-case interpretation, complete implementation ownership and solved independent practice. Native checks: both programs pass on torch2.14.0+cpu/NumPy2.3.5; thirty matched manual/nn.Linear steps; eighteen affine shapes and192 independent central finite-difference derivatives (max error8.42e-11); three invalid target shapes rejected. JS model checker passes240 finite-difference derivatives plus dependency/route/null cases. Commands: `node scripts/verify-tensor-boundary-models.mjs`; `scratch/lesson-tools/Scripts/python.exe -B scripts/verify-tensor-boundary-native.py`. Receipt owns actual program hashes and outputs. Runtime files formatted conventionally; no numerical behavior changed. Remaining: complementary independent review and parent rendered/integration checks. CUDA branch remains explicitly unexecuted.
