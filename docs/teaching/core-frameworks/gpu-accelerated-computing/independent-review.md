# Independent review — GPU-Accelerated Computing

Reviewer: frameworks_annotation_modalities · 28 September 2026.

Read the complete manuscript, both complete programs, lab components, model functions, scoped CSS, blueprint and author native evidence. The topic builds from host/device residency through a single-writer indexing proof to pointer/dtype contracts, fusion/traffic and synchronized measurement. Scratch CUDA source and ordinary CuPy route are supplied; CPU simulation is explicitly separated from unexecuted CUDA validation. The hypothetical accounting never masquerades as measured performance. Practice changes the mechanism rather than asking for memorized labels.

Three actionable findings were corrected by the author: discrete UI counts/selected-thread inputs needed integer validation; accounting needed finite/integer guards; a finite Python scalar outside float32 range needed rejection before casting. Reviewed the exact corrections, independently exercised seven JS invalid-input cases plus the native unrepresentable-scalar case, and checked nine traffic invariance fixtures (host residency ratio, three-to-one device-traffic ratio, zero launch term). All passed. Both canonical program hashes match the refreshed native receipt.

No remaining source correctness or teaching blocker found. Source identities and actual check scope are in independent-review.json. Parent owns rendered desktop/mobile/controls and should verify the fractional-input regression in the browser. No GPU device was available, so no CUDA compilation, device race, sanitizer or timing certification is implied.
