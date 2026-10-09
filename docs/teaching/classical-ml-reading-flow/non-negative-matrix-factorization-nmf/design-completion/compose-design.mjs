// Additive design composition only; no original source, scientific main or ledger edits.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const owner = path.dirname(here);
const input = path.join(owner, 'reading-flow-design.md');
const output = path.join(here, 'reading-flow-design.md');
let text = fs.readFileSync(input, 'utf8');
const swaps = [
  ['Status: **DRAFT, not design-ready**. This is complete scope/sequence planning in progress. Individual drawings and solved-program/practice contracts must be completed and source-bound before the DIFFERENT whole design review. No manuscript or runtime exists for this proposal.',
   'Status: **COMPLETE PROPOSED DESIGN, awaiting DIFFERENT entire design review and Root release**. The full individual drawing, programme, reuse, changed-practice and research contracts are composed by the sibling design-completion files named below. This is not a manuscript or implemented programme/runtime packet.'],
  ['Exact anchors/source bindings are pending in `programs-and-practice.md`; titles alone will not close these dependencies.',
   'Exact actual source interfaces, public anchors, supplied sibling packaging and historical-fragment compatibility are resolved in `dependencies-and-anchors.md` and `programs-and-practice.md`. Only selected neighboring source roles are assessed here; no neighboring lesson acceptance is inferred.'],
  ['individual implementation geometry, accessible/narrow composition, exact null states and few local controls remain to be completed in `visual-and-investigation-contracts.md`.',
   'individual actual-object geometry, default/changed/null states, colour/label/accessibility/narrow composition and one-to-three local controls are specified completely in `visual-and-investigation-contracts.md`. They remain proposed implementation contracts, not native acceptance.'],
  ['Draw currentW→fixedW H sweep→fixednewH W sweep, preserving dimensions.',
   'Draw fixedH W sweep→fixednewW H sweep, preserving dimensions and fresh cached operands.'],
  ['Strongest norm/angle residual greedy step has exact supplied fixture',
   'Largest residual squared-norm/orthogonal-projection greedy step has an exact supplied fixture'],
  ['Explain one nonnegative rank1 tensor element and fullarraycontract, route generalCP/Tucker implementation to proper tensorfactorization owner. STFT magnitude alone doesn\'t supply waveformphase; link appropriate audiosignal owner.',
   'Explain one nonnegative rank1 tensor element, a Tucker core and the full array/address contract. Current Tensor Algebra supplies the actual unfolding/rank-one prerequisite, while general CP/Tucker optimizers are maintained external further learning and a documented curriculum gap. STFT magnitude alone does not supply waveform phase; link actual Fourier foundations and qualified external audio tools.'],
  ['Keep extra axes and know the next owner', 'Keep extra axes and recognize what is missing']
];
const deltas = [];
for (const [before, after] of swaps) {
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`Expected one conserved replacement: ${before}; got ${count}`);
  text = text.replace(before, after);
  deltas.push({ before, after, count });
}
const boundary = text.indexOf('## Remaining completion boundary');
if (boundary < 0) throw new Error('Missing predecessor boundary');
const removedBoundary = text.slice(boundary);
text = text.slice(0, boundary) + `## Effective complete design composition

Read this whole file together with the complete sibling \`visual-and-investigation-contracts.md\`, \`programs-and-practice.md\`, \`dependencies-and-anchors.md\`, \`research-and-claim-disposition.md\` and \`author-review.md\`. The preserved parent assessment/research/baseline receipts retain historical identities and access/execution limits; they are not overwritten or relabelled current acceptance. Exact current inputs and additive deltas are bound in the final proposed-design packet.

Every computation promised here has a full local prospective source/interface, ordinary route, supported state/domain and time/workspace contract. All24 A–X tasks have actual operands, hints, reasoned solutions, wrong routes and success criteria. Each of66 visual jobs has explicit fixed/editable state, corresponding objects and supported revealing/null cases. Programmes/manuscript/native diagrams are not implemented by this design. Independent design review must precede authoring them.

## Whole teaching ladder and scope decisions

The opening question is how positive pattern amounts can explain measured bins without cancellation. D01–D04 introduce the measured object, its parts, one operation and matrix context. A novice first multiplies a pattern by an amount and adds the binwise contributions; notation follows those drawings. Amount, component, observed value, reconstruction, residual and objective each receive a separate first-use bridge. Zero is an observed value unless a separate mask marks absence. Matrix indices/shape are local foundations, not hidden external prerequisites.

The move into fitting asks what can change while other quantities stay fixed. Cone geometry precedes constrained encoding, scalar residual change precedes a derivative, literal paired cells precede cached Gram products, a cyclic trace precedes vectorized code, and the boundary arrow precedes KKT/projected gradient. Show descent and stationarity separately. The recommended coordinate route is W-first/new-W H, whereas the conserved MU route is H-first/new-H W. Do not accidentally use the old factor at an update port.

The optimizer variants each get a fresh build-up. Ratio multiplication precedes MU, a reachable locked zero precedes its failure qualification, literal count allocations precede generalized KL, touching upper curves precede the descent chain, and a squared difference precedes PSD notation. The positive-interior Frobenius proof visibly derives diagonal bound and weighted-square nonnegativity before using it; its domain and stationarity limitation stay adjacent to the proof. Beta-MM defines the loss/domain first and derives its exponent from the inspected primary formula, rather than claiming the Frobenius proof covers every beta. Signed singular lobes precede NNDSVD sign-pair products; known singular pairs and modified illustrations have distinct roles. Penalty slopes/mask cells precede changed objectives and their code.

The real-data return asks whether additive parts provide a useful reconstruction. Actual saved8×8 patterns precede amount/contribution/sum/residual correspondence; all views preserve component IDs and common intensity rulers. Then actual source-row/split roles precede candidate/error plots. The measured task is reconstruction, not handwriting recognition or writer generalization. The original mean/PCA/NMF result is retained even though PCA wins, and the inspection component count is not disguised as validation selection. New saved calculations are descriptive; no trained intervention or refreshed study is claimed.

Visible specialist depth keeps local questions answerable. The same-product shear motivates identifiability, forbidden-zero rectangles motivate nonnegative rank, normalized observed pure rows motivate anchors, and residual directions expose rank/conditioning failure. General exact NMF is computationally hard (NP-hard with variable rank), as discussed in Gillis's canonical treatment; efficient products and convex fixed-block solves do not give a polynomial global solver for the joint arbitrary-rank problem. Teach that scope without asserting every special separable or fixed-rank case is equally hard. No hardness proof beyond the cited treatment is promised. The full4-cycle rank3/rank-plus4 proof and exact anchor-selection induction are visible deeper explanations, with exact-separability/full-rank premises. No noisy recovery theorem is borrowed from merely reading its definition.

Text, spectra, streaming and extra axes deliberately restate their entities and assumptions. Counts differ from frozen TF-IDF weights; topic amounts differ from LDA posteriors. Constructed three-band endmembers differ from validated physical substances; simplex abundance constraints differ from cone NNLS. Historical online encodings differ from newly optimal encodings, and accumulator surrogate differs from full-history refit. Tensors add a named axis and address map; spectral magnitudes omit phase. Every branch has a concrete worked switch, visible object and solved transfer; deeper does not mean an unexplained list of applications.

Endings contain the full solved practice, readiness questions, complete file index, precise technical references and separately annotated alternative learning resources. Teaching/code/derivations remain visible. Only practice hints/solutions use disclosures. No prediction gates, generic compare/rescore/mode grids or printed author-caution text. Author source/proof/fit history stays in technical provenance. Reading/practice estimates await the actual complete manuscript, rather than being invented from the design count.

## Original and destination conservation

Preserve every existing useful numerical claim and all three complete original programmes/stdout. Current physical containing-source bytes and decoded historical source/stream identities are separate. The28 originals and28 copies remain protected; immutable parent checkpoints stay unchanged. No central/public/shared record is written by this proposal. The title and ID remain stable, with explicit alias destinations for the ten old headings.

The ownership map in \`dependencies-and-anchors.md\` closes all prior title-only routes. PCA supplies the exact finite-table helper and projection contrast; matrix calculus supplies optional shaped gradients; ICA supplies only the actual independence comparison; Feature20 is later further learning with local train-only preparation taught first. Tensor Algebra and Fourier supply inspected foundations, while general tensor optimizers, phase recovery, probabilistic topic inference and physical spectral validation are scoped destinations. Their absence is not concealed by declaring a local owner complete or expanding this lesson into unpromised algorithms.

## Review boundary

Author self-reading evaluates this complete proposed sequence/contracts as a beginner heuristic and as a specialist coverage/correctness check; it is not independent acceptance or an observed learner study. New supplied-state arithmetic runs are documented once with source/inputs and actual terminal receipts. No original fit/main/study/checker, browser campaign or runtime build was replayed. The next action is DIFFERENT whole design review and Root design decision, followed only then by the full manuscript and programme authoring if released.
`;
// Template strings above intentionally use escaped literal backticks.
text = text.replaceAll('\\`', '`');
fs.writeFileSync(output, text, { flag: 'wx' });
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
fs.writeFileSync(path.join(here, 'design-composition-deltas.json'), JSON.stringify({
  predecessor: { path: input, sha256: sha(fs.readFileSync(input)) },
  successor: { path: output, sha256: sha(fs.readFileSync(output)) },
  replacements: deltas, removedPartialBoundary: removedBoundary,
  appendedText: text.slice(boundary), scope: 'Complete additive design only; no manuscript/runtime/science changes'
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, bytes: fs.statSync(output).size, sha256: sha(fs.readFileSync(output)) }));
