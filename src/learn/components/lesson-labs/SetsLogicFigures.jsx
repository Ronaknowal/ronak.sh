import { BinaryBoard, LogicArrow, LogicFigure, Mark, RegionsDrawing } from './SetsLogicDrawings.jsx';
import { selectRoster } from '../../data/sets-logic-models.js';
import './sets-logic-labs.css';

const diagonal = [[true, false, false], [false, true, false], [false, false, true]];
const jobs = ['Scan', 'Label', 'Audit'];
const reviewers = ['Ada', 'Bo', 'Cam'];
function BoardFigure({ matrix, rows, columns, caption, label, highlight }) {
  return <figure className="sets-logic-figure"><BinaryBoard matrix={matrix} rowLabels={rows} columnLabels={columns} label={label} highlight={highlight} /><figcaption>{caption}</figcaption></figure>;
}
function TextAt({ x = 170, y, children, small = false }) { return <text x={x} y={y} textAnchor="middle" className={small ? 'sets-small' : undefined}>{children}</text>; }
function Mapping({ inputs, outputs, pairs, label, caption, selectedInputs = [], selectedOutputs = [], height = 340 }) {
  const inputY = index => 55 + index * (height - 95) / Math.max(1, inputs.length - 1);
  const outputY = index => 55 + index * (height - 95) / Math.max(1, outputs.length - 1);
  return <LogicFigure height={height} label={label} caption={caption}>{marker => <>
    <TextAt x={75} y={23}>input</TextAt><TextAt x={265} y={23}>output</TextAt>
    {pairs.map(([a, b], index) => <LogicArrow key={index} from={[75, inputY(a)]} to={[265, outputY(b)]} marker={marker} comparison={!selectedInputs.includes(a) && selectedInputs.length > 0} />)}
    {inputs.map((text, index) => <Mark key={index} x={75} y={inputY(index)} text={text} selected={selectedInputs.includes(index)} />)}
    {outputs.map((text, index) => <Mark key={index} x={265} y={outputY(index)} text={text} selected={selectedOutputs.includes(index)} />)}
  </>}</LogicFigure>;
}
export function SetRosterFigure() {
  const result = selectRoster(3, 6, 'intersection');
  return <figure className="sets-logic-figure"><RegionsDrawing {...result} /><figcaption>The four labelled people are the entire workshop universe. The overlap contains Bo; each other region contains one person.</figcaption></figure>;
}
export function RosterSequenceFigure() {
  return <LogicFigure height={240} label="An ordered list has Ada, Bo, Ada at positions zero, one, two; the corresponding set has only Ada and Bo." caption="Repeated occurrences and positions survive in a list. Set membership retains each distinct person once.">
    <TextAt y={25}>ordered list</TextAt>
    {['Ada', 'Bo', 'Ada'].map((name, index) => <g key={index}><Mark x={65 + index * 105} y={70} text={name} /><TextAt x={65 + index * 105} y={110} small>{index}</TextAt></g>)}
    <path d="M65 121L118 164M170 121L222 164M275 121L118 164" className="sets-edge sets-comparison" />
    <Mark x={118} y={184} text="Ada" selected /><Mark x={222} y={184} text="Bo" selected /><TextAt y={232}>set: no positions, no repeats</TextAt>
  </LogicFigure>;
}
export function NestedMembershipFigure() {
  return <LogicFigure height={340} label="C contains the number one and the singleton containing two. Two is not a direct element of C. The empty set has zero elements; its singleton has one." caption="Each enclosing boundary creates a set object. Look at the objects immediately inside that boundary.">
    <rect x="30" y="30" width="280" height="130" rx="5" className="sets-universe" /><TextAt x={52} y={56}>C</TextAt>
    <Mark x={100} y={95} text="1" /><rect x="185" y="65" width="80" height="65" rx="4" className="sets-region" /><Mark x={225} y={97} text="2" radius={17} />
    <TextAt y={185}>{'C = {1, {2}}'}</TextAt>
    <rect x="35" y="220" width="110" height="65" className="sets-universe" /><TextAt x={90} y={310}>∅: 0 elements</TextAt>
    <rect x="195" y="220" width="110" height="65" className="sets-universe" /><rect x="227" y="235" width="46" height="34" className="sets-region" /><TextAt x={250} y={310}>{'{∅}: 1 element'}</TextAt>
  </LogicFigure>;
}
export function CartesianPairsFigure() {
  return <figure className="sets-logic-figure"><div className="sets-logic-matrix-scroll" tabIndex={0} role="region" aria-label="All four ordered job-reviewer pairs"><table className="sets-logic-board"><caption>J × R: first role is job, second is reviewer</caption><thead><tr><th>job / reviewer</th><th>Ada</th><th>Bo</th></tr></thead><tbody>{['Scan', 'Label'].map(job => <tr key={job}><th scope="row">{job}</th>{['Ada', 'Bo'].map(person => <td key={person}>({job}, {person})</td>)}</tr>)}</tbody></table></div><figcaption>Every row choice pairs with every column choice: 2 × 2 = 4 pairs. Reversing the roles produces a different ordered product.</figcaption></figure>;
}
export function PowerSetChoicesFigure() {
  return <BoardFigure label="Four subsets from two independent membership choices" rows={['∅', '{Ada}', '{Bo}', '{Ada, Bo}']} columns={['include Ada', 'include Bo']} matrix={[[false, false], [true, false], [false, true], [true, true]]} caption="A subset is one complete row of choices. Two elements give four rows; choosing neither is still a subset." />;
}
export function MembershipBitsFigure() {
  return <BoardFigure label="Membership bits on the same four-person universe" rows={['T', 'B', 'T ∩ B', 'T ∪ B', 'T △ B', 'U ∖ T']} columns={['Ada', 'Bo', 'Cam', 'Dee']} matrix={[[true, true, false, false], [false, true, true, false], [false, true, false, false], [true, true, true, false], [true, false, true, false], [false, false, true, true]]} caption="Operations act down each person's column. Complement flips only these four membership bits, within the stated universe." />;
}
export function EmptyFamilyFigure() {
  return <LogicFigure height={255} label="An empty indexed family has union empty and intersection the entire specified universe U." caption="No set in the family can supply an element to the union. No set can exclude an element of U from the intersection. The universe remains specified.">
    <TextAt y={28}>family: zero indexed sets</TextAt><path d="M170 46L80 87M170 46L255 87" className="sets-edge" />
    <rect x="25" y="100" width="110" height="100" className="sets-universe" /><TextAt x={80} y={150}>∅</TextAt><TextAt x={80} y={231}>union</TextAt>
    <rect x="168" y="100" width="155" height="100" className="sets-universe" />{['Ada', 'Bo', 'Cam', 'Dee'].map((name, index) => <TextAt key={name} x={207 + index % 2 * 77} y={136 + Math.floor(index / 2) * 43}>{name}</TextAt>)}<TextAt x={246} y={231}>intersection: U</TextAt>
  </LogicFigure>;
}
export function ImplicationFigure() {
  const values = [[false, false], [false, true], [true, false], [true, true]];
  return <BoardFigure label="P means trained; Q means badged. One failing world per implication." rows={['P=0, Q=0', 'P=0, Q=1', 'P=1, Q=0', 'P=1, Q=1']} columns={['P → Q', 'Q → P', '¬Q → ¬P', 'P ↔ Q']} matrix={values.map(([p, q]) => [!p || q, !q || p, q || !p, p === q])} highlight={(row, col) => !([!values[row][0] || values[row][1], !values[row][1] || values[row][0], values[row][1] || !values[row][0], values[row][0] === values[row][1]][col])} caption="Amber 0 cells mark failure. The contrapositive has the same failing row as the original; the converse has a different one." />;
}
export function QuantifierWitnessFigure() {
  return <BoardFigure label="Three jobs, three reviewers: each row has a different witness" rows={jobs} columns={reviewers} matrix={diagonal} highlight={(r, c) => r === c} caption="Scan has Ada, Label has Bo, and Audit has Cam. Every row has a 1, while no column consists entirely of 1s." />;
}
export function WitnessNegationFigure() {
  return <BoardFigure label="An empty Label row witnesses failure of every job having a reviewer" rows={jobs} columns={reviewers} matrix={[[true, false, false], [false, false, false], [false, false, true]]} highlight={r => r === 1} caption="Label is one job with no reviewer: this row witnesses ∃ job ∀ reviewer, not assigned. Each column also has a missing entry, so no common reviewer covers all jobs." />;
}
export function OddWitnessFigure() {
  return <LogicFigure height={300} label="Negative and positive odd numbers each produce an integer witness for an odd square." caption="For n = 2k + 1, n² = 2[2k² + 2k] + 1. The square's witness 2k² + 2k is an integer for every integer k, including negative ones.">
    <TextAt y={28}>n = 2k + 1</TextAt>
    {[['k = −2', 'n = −3', 'n² = 9', '9 = 2·4 + 1'], ['k = 2', 'n = 5', 'n² = 25', '25 = 2·12 + 1']].map((row, index) => <g key={index}><TextAt x={index ? 255 : 85} y={70}>{row[0]}</TextAt><TextAt x={index ? 255 : 85} y={110}>{row[1]}</TextAt><path d={`M${index ? 255 : 85} 123v27`} className="sets-edge" /><TextAt x={index ? 255 : 85} y={180}>{row[2]}</TextAt><TextAt x={index ? 255 : 85} y={230}>{row[3]}</TextAt></g>)}
    <TextAt y={283}>integer witness: 2k² + 2k</TextAt>
  </LogicFigure>;
}
export function ProofScopeFigure() {
  return <LogicFigure height={365} label="A proof with an arbitrary integer k transforms the assumption n equals 2k plus one into a witness for n squared being odd." caption="The bracket keeps the temporary assumption visible. Discharging it yields an implication for every odd integer n, rather than just a numerical example.">
    <path d="M28 34H16V270H28" className="sets-edge sets-comparison" /><TextAt y={35}>choose arbitrary k ∈ ℤ</TextAt>
    {['n = 2k + 1', 'n² = 4k² + 4k + 1', 'n² = 2(2k² + 2k) + 1'].map((text, index) => <g key={text}><TextAt y={95 + index * 70}>{text}</TextAt>{index < 2 && <path d={`M170 ${108 + index * 70}v29m-5-7l5 7 5-7`} className="sets-edge" />}</g>)}
    <path d="M170 266v28m-5-7l5 7 5-7" className="sets-edge" /><TextAt y={330}>odd n ⇒ odd n²</TextAt>
  </LogicFigure>;
}
export function ProductParityFigure() {
  return <LogicFigure height={245} label="In consecutive factors n and n plus one, one is even in either parity case." caption="Both cases exhibit a factor 2. The two cases exhaust all integers; neither depends on checking a finite list.">
    <TextAt y={30}>n(n + 1)</TextAt><TextAt x={85} y={86}>n even</TextAt><TextAt x={255} y={86}>n odd</TextAt>
    <TextAt x={85} y={136}>2k · (2k + 1)</TextAt><TextAt x={255} y={136}>(2k + 1) · 2(k + 1)</TextAt>
    <path d="M85 152L145 192M255 152L195 192" className="sets-edge" /><TextAt y={226}>2 × an integer</TextAt>
  </LogicFigure>;
}
export function ContrapositivePathsFigure() {
  return <BoardFigure label="A claim and its contrapositive have exactly the same potential failing situation" rows={['n² even, n even', 'n² even, n odd', 'n² odd, n even', 'n² odd, n odd']} columns={['n² even → n even', 'n odd → n² odd']} matrix={[[true, true], [false, false], [true, true], [true, true]]} highlight={r => r === 1} caption="This table compares logical forms, not which numerical situations actually occur. The shared failing row would require an odd n with an even square; the direct odd-square proof rules it out." />;
}
export function DenominatorDescentFigure() {
  return <LogicFigure height={300} label="Under the hypothetical least-positive-denominator representation of square root two, parity forces a and b even and a smaller positive denominator b over two." caption="The drawing is conditional: no numerical rational representation of √2 is being asserted. The forced denominator b/2 contradicts b being least.">
    <TextAt y={32}>assume √2 = a/b, b least positive</TextAt><TextAt y={87}>a² = 2b² ⇒ a even ⇒ b even</TextAt>
    <TextAt y={137}>a/b = (a/2)/(b/2)</TextAt><path d="M35 218H305" className="sets-edge" />
    {[['0', 40], ['b/2', 170], ['b', 300]].map(([label, x]) => <g key={label}><path d={`M${x} 207v22`} className="sets-edge" /><TextAt x={x} y={252}>{label}</TextAt></g>)}
    <path d="M291 183H181m8-5l-8 5 8 5" className="sets-edge sets-comparison" /><TextAt y={291}>0 &lt; b/2 &lt; b</TextAt>
  </LogicFigure>;
}
export function DeMorganFigure() {
  return <BoardFigure label="Both sides of De Morgan's identity select precisely the neither-membership row" rows={['outside both', 'A only', 'B only', 'both']} columns={['in A', 'in B', 'not in A ∪ B', 'in Aᶜ ∩ Bᶜ']} matrix={[[false, false, true, true], [true, false, false, false], [false, true, false, false], [true, true, false, false]]} highlight={r => r === 0} caption="With one fixed universe U, the last two columns agree in every membership case. Reading an arbitrary element's column equality gives both containments." />;
}
export function FunctionImageFigure() {
  return <Mapping inputs={['−2', '−1', '0', '1', '2']} outputs={['0', '1', '4', '9']} pairs={[[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]]} label="Squaring five integer inputs has image zero, one, four; nine in the declared codomain is unused" caption="Every input has exactly one outgoing arrow. Collisions prevent injectivity; the unused 9 prevents surjectivity onto this declared codomain." />;
}
export function ImageIntersectionFigure() {
  return <LogicFigure height={250} label="Disjoint input subsets can have intersecting images under squaring" caption="S ∩ T is empty, so f(S ∩ T) is empty. Both images contain 4: f(S) ∩ f(T) = {4}. The collision makes the proposed image equality fail.">{marker => <>
    <TextAt x={75} y={23}>input</TextAt><TextAt x={265} y={23}>output</TextAt>
    <LogicArrow from={[75, 55]} to={[265, 55]} marker={marker} /><LogicArrow from={[75, 190]} to={[265, 55]} marker={marker} />
    <Mark x={75} y={55} text="−2" selected /><TextAt x={75} y={96} small>∈ S</TextAt>
    <Mark x={75} y={190} text="2" selected /><TextAt x={75} y={229} small>∈ T</TextAt>
    <Mark x={265} y={55} text="4" selected />
  </>}</LogicFigure>;
}
export function PreimageFigure() {
  return <Mapping inputs={['−2', '−1', '0', '1', '2']} outputs={['0', '1', '4']} pairs={[[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]]} selectedInputs={[0, 4]} selectedOutputs={[2]} label="The preimage of the target subset containing four is the two inputs minus two and two" caption="Select the target subset {4}, then collect every input whose arrow ends there. A preimage is a set operation; it does not require a unique inverse value." />;
}
export function FunctionCompositionFigure() {
  return <LogicFigure height={250} label="For f(x) equal to two x and g(y) equal to y plus three, the input two passes through four to seven." caption="The output of f becomes the input of g: (g ∘ f)(2) = 7. Solving backward gives (7 − 3)/2 = 2.">
    <TextAt y={35}>f(x) = 2x; g(y) = y + 3</TextAt>
    <Mark x={50} y={130} text="2" /><Mark x={170} y={130} text="4" /><Mark x={290} y={130} text="7" selected />
    <path d="M75 130h68m-8-5l8 5-8 5M195 130h68m-8-5l8 5-8 5" className="sets-edge" /><TextAt x={110} y={100}>× 2</TextAt><TextAt x={230} y={100}>+ 3</TextAt><TextAt y={221}>2x + 3 = 7 ⇒ x = 2</TextAt>
  </LogicFigure>;
}
export function DistanceChainFigure() {
  return <LogicFigure height={245} label="Distance at most one relates zero to one and one to two, but not zero to two." caption="Two present steps do not guarantee the endpoint pair. Distance ≤ 1 is reflexive and symmetric here, but fails transitivity at (0, 1, 2).">{marker => <>
    <LogicArrow from={[50, 100]} to={[170, 100]} marker={marker} /><LogicArrow from={[170, 100]} to={[290, 100]} marker={marker} /><LogicArrow from={[50, 100]} to={[290, 100]} marker={marker} bend={112} missing />
    {[0, 1, 2].map((n, index) => <Mark key={n} x={50 + index * 120} y={100} text={n} />)}<TextAt y={226}>|0 − 2| = 2 &gt; 1</TextAt>
  </>}</LogicFigure>;
}
export function ModuloPartitionFigure() {
  return <LogicFigure height={260} label="Modulo three partitions the integers zero through five into disjoint classes zero-three, one-four, two-five." caption="Each displayed integer occurs in exactly one class. Full integer classes continue by steps of 3; these boundaries display only the stated finite restriction.">
    {[[0, 3], [1, 4], [2, 5]].map((group, index) => <g key={index}><rect x={15 + index * 110} y="40" width="90" height="163" rx="8" className="sets-region" /><TextAt x={60 + index * 110} y={29}>[{index}]</TextAt>{group.map((n, row) => <Mark key={n} x={60 + index * 110} y={85 + row * 77} text={n} selected />)}</g>)}
    <TextAt y={245}>a ~ b when 3 divides a − b</TextAt>
  </LogicFigure>;
}
export function ClassOverlapFigure() {
  return <LogicFigure height={310} label="A shared class member c joins b to a by symmetry and transitivity; an arbitrary x related to a is therefore related to b." caption="The arrows are logical relation steps. Symmetry changes a ~ c to c ~ a; transitivity gives b ~ a. Combining b ~ a with a ~ x gives b ~ x for an arbitrary x in [a]. Reverse the roles to prove equality of classes.">{marker => <>
    <TextAt y={28}>shared c: a ~ c and b ~ c</TextAt><LogicArrow from={[55, 93]} to={[170, 93]} marker={marker} /><LogicArrow from={[285, 93]} to={[170, 93]} marker={marker} />
    {['a', 'c', 'b'].map((text, i) => <Mark key={text} x={55 + i * 115} y={93} text={text} />)}
    <TextAt y={170}>symmetry + transitivity: b ~ a</TextAt><LogicArrow from={[55, 227]} to={[170, 227]} marker={marker} /><LogicArrow from={[170, 227]} to={[285, 227]} marker={marker} />
    {['b', 'a', 'x'].map((text, i) => <Mark key={text} x={55 + i * 115} y={227} text={text} selected={text === 'x'} />)}<TextAt y={298}>therefore b ~ x; no partial overlap</TextAt>
  </>}</LogicFigure>;
}
export function RepresentativeAdditionFigure() {
  return <LogicFigure height={255} label="Modulo three, choosing representatives one and two gives three; choosing four and five gives nine. Both sums are in class zero." caption="Changing either representative by a multiple of 3 changes the sum by a multiple of 3. The result class is independent of those choices.">
    <TextAt y={28}>[1] + [2] → [0]</TextAt><TextAt y={88}>1 + 2 = 3</TextAt><TextAt y={139}>4 + 5 = 9</TextAt><path d="M110 154L135 187M230 154L205 187" className="sets-edge" /><TextAt y={227}>3 ~ 9 because 3 divides 9 − 3</TextAt>
  </LogicFigure>;
}
export function DivisibilityPairsFigure() {
  return <BoardFigure label="Full divisibility relation before removing self and transitive pairs for a Hasse diagram" rows={['2', '3', '6']} columns={['2', '3', '6']} matrix={[[true, false, true], [false, true, true], [false, false, true]]} caption="A 1 means the row divides the column. The three self-pairs remain part of the relation, even when a later Hasse picture omits their loops." />;
}
export function OrderExtensionsFigure() {
  return <LogicFigure height={350} label="Two incomparable preparation jobs must both precede assembly. Either preparation can come first in a total extension; integers have no smallest element." caption="A total extension chooses an order for incomparable jobs without changing the original obligations. Separately, every integer n has a smaller predecessor n − 1, so ℤ under ≤ has no minimal element.">{marker => <>
    <Mark x={65} y={52} text="A" /><Mark x={275} y={52} text="B" /><Mark x={170} y={128} text="join" />
    <LogicArrow from={[65, 52]} to={[170, 128]} marker={marker} /><LogicArrow from={[275, 52]} to={[170, 128]} marker={marker} />
    <TextAt y={195}>A, B, join   or   B, A, join</TextAt><path d="M25 275H315" className="sets-edge" />
    {['…', '−2', '−1', '0', '1', '…'].map((n, index) => <TextAt key={index} x={35 + index * 54} y={267}>{n}</TextAt>)}<TextAt y={326}>always another predecessor</TextAt>
  </>}</LogicFigure>;
}
export function BrokenInductionFigure() {
  return <LogicFigure height={300} label="An induction chain can fail to start because its base is false, or fail to continue because its step does not establish the next case." caption="A valid conditional step cannot repair a false base. A true base cannot repair a missing or false next-case implication.">
    <TextAt y={31}>claim: 3 divides 2ⁿ</TextAt><TextAt x={65} y={90}>n = 0</TextAt><TextAt x={260} y={90}>next n</TextAt><path d="M110 83H211" className="sets-edge sets-comparison" /><TextAt y={134}>false base: 3 does not divide 1</TextAt>
    <TextAt y={193}>claim: every n is 0</TextAt><TextAt x={65} y={246}>n = 0 ✓</TextAt><TextAt x={260} y={246}>n = 1 ✕</TextAt><path d="M110 239H211" className="sets-edge sets-missing" /><TextAt y={288}>the next-case obligation fails</TextAt>
  </LogicFigure>;
}
export function PrimeFactorInductionFigure() {
  return <LogicFigure height={300} label="Twelve splits into three and four; four splits into two and two. Each recursive factor is smaller than its parent and prime leaves stop." caption="Strong induction can use every already-proved smaller integer ≥ 2. Prime factors are the stopping cases; 1 lies outside this claim's domain.">
    <path d="M170 57L85 137M170 57L255 137M255 159L210 235M255 159L300 235" className="sets-edge" />
    {[[170, 45, '12', false], [85, 148, '3', true], [255, 148, '4', false], [210, 246, '2', true], [300, 246, '2', true]].map(([x, y, text, selected]) => <Mark key={`${x}-${y}`} {...{ x, y, text, selected }} />)}
    <TextAt y={294}>12 = 3 · 2 · 2</TextAt>
  </LogicFigure>;
}
export function BinaryTreeInductionFigure() {
  return <LogicFigure height={300} label="A full binary tree joins two full binary subtrees, each with two leaves and one internal node; the whole has four leaves and three internal nodes." caption="The constructor adds one internal node: L = L₁ + L₂ and I = I₁ + I₂ + 1. The leaf base has L = 1, I = 0. A one-child internal node is outside this class.">
    <path d="M170 45L90 123M170 45L250 123M90 123L45 215M90 123L130 215M250 123L210 215M250 123L300 215" className="sets-edge" />
    {[[170, 45], [90, 123], [250, 123]].map(([x, y]) => <Mark key={x} x={x} y={y} text="+" radius={17} />)}
    {[45, 130, 210, 300].map((x, index) => <Mark key={x} x={x} y={215} text={index + 1} selected radius={17} />)}<TextAt y={286}>L = 4 = I + 1</TextAt>
  </LogicFigure>;
}
export function FiniteTestingFigure() {
  return <LogicFigure height={255} label="The product q N of x minus zero through x minus N vanishes at all tested integers zero through N, but is positive at N plus one." caption="One zero factor explains every tested zero. At N + 1 the product is (N + 1)!, so any finite testing boundary can be crossed by this construction.">
    <TextAt y={30}>q_N(x) = x(x − 1)…(x − N)</TextAt>
    {[['N = 3', '0  0  0  0', 'x = 4: 24'], ['N = 6', '0  0  0  0  0  0  0', 'x = 7: 5040']].map((row, index) => <g key={index}><TextAt x={52} y={90 + index * 90}>{row[0]}</TextAt><TextAt x={215} y={90 + index * 90}>{row[1]}</TextAt><TextAt x={215} y={123 + index * 90}>{row[2]}</TextAt></g>)}
  </LogicFigure>;
}
export function NaturalEvenFigure() {
  return <Mapping inputs={['0', '1', '2', '3', '4', '…']} outputs={['0', '2', '4', '6', '8', '…']} pairs={Array.from({ length: 5 }, (_, i) => [i, i])} height={375} label="The general rule n maps to two n pairs all natural numbers with all nonnegative even integers" caption="The visible prefix illustrates the rule n ↦ 2n. Distinct n give distinct outputs; every even output 2k has the input k. The ellipses do not restrict either infinite domain." />;
}
export function CantorMembershipFigure() {
  return <BoardFigure label="For an arbitrary a, the diagonal subset reverses membership of a in the proposed row f of a" rows={['a ∉ f(a)', 'a ∈ f(a)']} columns={['a ∈ f(a)', 'a ∈ D']} matrix={[[false, true], [true, false]]} highlight={(r, c) => c === 1} caption="Define D = {a ∈ A : a ∉ f(a)}. Either membership case forces D and f(a) to differ at a itself. Since a was arbitrary, no proposed row equals D." />;
}
export function EmptyPowerSetFigure() {
  return <LogicFigure height={230} label="An empty domain has no inputs, while its power set contains one output, the empty subset." caption="P(∅) = {∅}: one subset exists even though there is no domain element to map to it. Thus no map from ∅ can be onto P(∅).">
    <rect x="30" y="40" width="105" height="120" className="sets-universe" /><TextAt x={82} y={26}>domain ∅</TextAt><rect x="205" y="40" width="105" height="120" className="sets-universe" /><Mark x={257} y={100} text="∅" selected /><TextAt x={257} y={26}>P(∅)</TextAt><TextAt y={212}>0 inputs · 1 subset</TextAt>
  </LogicFigure>;
}
