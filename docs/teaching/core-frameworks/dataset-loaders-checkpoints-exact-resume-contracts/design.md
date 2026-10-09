# Dataset Loaders, Checkpoints & Exact Resume Contracts

Content checkpoint28September2026. Actual complete JSX manuscript plus `exact_resume.py` and `stateful_loader_resume.py` in the canonical public directory. Fixed stable title/id and supplied cross-domain outcomes retained. No open destination notes. Current scope extends data-processing/loading and mini-batch loop boundaries; does not repeat their complete sampler/collator/accumulation lessons.

## Ownership and measured boundaries

Local ownership: resumable permutation+cursor+generator iterator, consistent update-boundary snapshot, complete stochastic CPU training restart, controlled omitted-state branches, scalar state mechanism and prefetch-issued/committed distinction. Standard route uses Torch state_dict/save/load and TorchData StatefulDataLoader. Distributed elastic state, nondeterministic kernels and GPU portability explicitly outside executed claims. Real-data requirement not applicable: constructed rows are for state semantics, not a predictive/generalization demonstration.

## Complete visual contracts before runtime implementation

1. Semantic update-boundary figure: fetch→forward/backward→optimizer step→scheduler step→clear gradients→snapshot. Label snapshot as after completed update, all consumed IDs applied, no partial gradient; branching before completion requires additionalstate.
2. Live scalar restart lab: code-owned scalar_trace reproduced in JS; x=row+1+LCGnoise, y=2(row+1), gradient(wx-y)x, momentum.8, lr.02*.5**floor(clock/3), order[2,0,3,1]. Statew=.5,v0,cursor0,rng7,clock0. Control interruption1..7, momentum0..9, omittednone/momentum/cursor/rng/schedule. Display frozen checkpoint inventory and next6updates baseline/resumed, row/noise/lr/loss/w, firstdifference. Weight comparison plot with fixed pairedaxis and exacttable, no decorative performance claim. Defaults interruption3 allstate: wcheckpoint1.5148435588798672,next1.736062871259191. Emptydifferencevalid forspecialsettings. Independent Python/JS trace parity required. Reset.
3. Prefetch queue lab:12IDs,batchsize2, completedupdatesdefault3(0..5),prefetchedbatchesdefault2(0..3), issued=min12,committed+2prefetch. Three visually labeled lanes committed/pending/unissued; nextID and skippedIDlist under strategiesissued-only/committed-replay/queue-restored. Controlsshowactualsemantics; committedreplay disclaimerdeterministictransform/restoredRNG; queue-restored meanspendingqueueincluded. Defaultissued-onlyskips6..9. Narrowwraprecordcells, markeridentitynotcoloralone. Reset.

## Initial native observations

PyTorch2.14.0+cpu,float64,singlethread,deterministicalgorithms. Interruptedafter5, next7updates match exact IDs/loss/rate/allparams. NextIDs[0,2],loss.1142057191623769. Omissionoptimizer/loader/RNG divergeupdate6,schedule7. Fixed independentbranch aliasing by deepcopy before eachrestore. TorchData0.11.0 deterministic17rowmapdatasetworkers0; nextbatches[13,10,12],[1,7,14],[8,9,6],[16,2]. Workers2also passed same-configuration ordered replay, with different tail[0,9,13],[6,5,14],[1,4,2],[7,3]. Manuscript explicitly distinguishes those sequences. No crossrank orrandomtransformclaim.

## Remaining

Implement visual models/figures/blueprint; save native and JSparityevidence; reviewers independentlyinspect snapshot/omission/testlogic; parent browser/control/narrow/theme/codeaccess/build. Do not claim preparedcontentreviewasindependent implementationreview.


## Author implementation checkpoint — 28 September 2026

All specified figures/labs, pure engines and topic blueprint implemented. Native semantic comparisons passed; see `native-evidence.json`, source identities in `author-evidence.json`. Independent review is assigned to the training/data agent; parent owns actual browser/control/narrow/Copy/download/build integration. Do not interpret author readiness as those checks already completed. Parent feedback corrected provenance, added explicit scratch coarse indexing, clarified figure labels, guarded malformed audit inputs and kept resume branches independent.
