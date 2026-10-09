# PyTorch — independent source review

Reviewer: frameworks_annotation_modalities; author: root. Date: 28 September 2026. Scope: complete manuscript, all three runtime investigations, pure model, CSS, both complete programs and design/native-evidence handoff. This is an independent source/teaching review, not a browser or observed beginner study. Author native runs were reused rather than rerun.

## Findings and closure

The original practice section hid each entire exercise behind a disclosure. This prevented visible independent practice and violated the shared ending contract. Author changed all seven outer containers to visible lesson-exercise blocks with H3 titles, retaining only inner hint/feedback disclosures, and added explicit practice/next metadata. Closure verified in the final source; no numerical behavior changed. The alternatives now use the shared list structure.

## Complementary correctness assessment

- Traced transposed strides and the alias/copy address calculation; physical-cell and logical views agree. The copy option changes ownership rather than just rendering.
- Independently followed the half-squared scalar derivative and SGD update (initial loss1.25, derivative−2.5, weight1.25, new loss.703125), separate backward contributions and detach failure. The high-learning-rate practice boundary0.8 follows from the stated quadratic.
- Inspected stable softmax/cross-entropy, explicit two-layer gradients, weight transposition in the matched library bridge, train-only normalization, weighted minibatch loss, train/validation/test identity and best-state cloning. Inference export is accurately distinguished from arbitrary-mid-epoch resumption.
- Followed mode versus gradient recording, registered buffers, checkpoint restoration, directional derivative composition and weighted custom-backward testing. No unresolved material mathematical or API-contract discrepancy found. Native parity/finite-difference results remain the author's executed evidence.

## Learning-experience and inline-visual pass

The opening names a practical ownership/control question and the route/prerequisites are grouped. Tensor shape is supported by worked contraction dimensions and the storage investigation before API detail. The backward buffer view refreshes the meaning of accumulation before the complete training program. Manual and library routes explicitly match state, loss and gradients rather than comparing unrelated fits. State/mode distinctions use a concrete runnable experiment; deeper derivative transforms are labeled and tied to their use. Exercises change inputs, dimensions and failure conditions and include numerical or invariant feedback. All three labs show the present result, allow continuous/entity edits, and explain their supported boundary cases without a learner prediction gate. No repeated unsupported timing or generalization claims were found.

Code remains visible and uses shared download/copy controls. Keyboard/reset execution and the complete interactive browser receipt remain the parent's separate work; source inspection does not certify them. Current source review has no open blocking finding.

## Complementary painted-output inspection

Viewed all three parent-captured PyTorch labs at desktop and 320px (six images). The alias investigation preserves both original and transposed cells and the selected physical slot while stacking views on the phone. The residual display, exact state table and controls remain distinct and readable; static rulers are explicitly described as values changed using the controls. The dropout investigation retains each activation's uniform, keep/drop operation and output in its two-column phone layout. No clipped label, misleading shared-state depiction or unreadable intermediate calculation found in these captures. This independent visual reading pass does not claim the reviewer personally operated the controls; root owns that execution evidence.

## Reviewed source identities

- `src/learn/data/topics/pytorch.jsx`: `de493d364dba4508976ed339a2366a8a419f9a8812bf569d7ad48232c7eacf5d`
- `src/learn/components/lesson-labs/PyTorchLabs.jsx`: `46dd755be0d4268e46ff4fc7c25fff7a55aecd91625fcc19694ed02deb83b36c`
- `src/learn/components/lesson-labs/pytorch-models.js`: `eba2ccbd42e89c27567a2dc93ae3596c5a7221b829ef1ff92906a836be97fd80`
- `src/learn/components/lesson-labs/pytorch-labs.css`: `42e92361df021bf1f9ff47f7aeb0bd376d44c2e6baa6ca40d1b5d9925a4c094b`
- `public/learn-code/pytorch/pytorch_workflow.py`: `93c56fe1d32d10a83407a4092add1f7cb88d384007e2febe0f480ef9b4681677`
- `public/learn-code/pytorch/pytorch_state_and_gradients.py`: `c86b0256bd4a1096895a16f8e1cd682db4d8a7a4621db01e460c977e097dbb9a`
