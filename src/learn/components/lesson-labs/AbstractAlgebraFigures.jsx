import { squareVertices, squareGroup, rotationGroup, composeSquare, inverseSquare, squarePermutation, moveSquareData, leftCosets, vertexImage, orbitState, permutationCycles, fixedColoringCount, squareMatrix, permutationMatrix, matrixProduct, applyMatrix, averageSquareMap, rawSquareWeights, equivarianceState, modularState } from "../../data/abstract-algebra-models.js";
import { Figure, Square, Panel, Compare, PermutationWires, Route, Table, Matrix, Products, Blocks, SegmentGeometry, MapRows, MoveGraph, States, Canvas, Text, Arrow, names, vector, num } from "./AbstractAlgebraDrawings.jsx";
import "./abstract-algebra-figures.css";
const letters = ["A", "B", "C", "D"];
const groupNames = (members) => members.map((g) => names[g]).join(", ");
const cosets = (H) => leftCosets(H).map((row) => row.members);
const path = (start, moves) => [start, ...moves.map((_, i) => moves.slice(0, i + 1).reduce((values, g) => moveSquareData(g, values), start))];
function SquareLayersFigure() {
  return <Figure job="G01" title="Locations, position addresses and attached labels" caption="Every position number addresses the same geometric location. Attached A/B/C/D follow the move; A travels from 0 to 1 under r."><Compare><Panel title="Geometric square"><Square values={["A", "B", "C", "D"]} coordinate /></Panel><Panel title="Addresses 0–3"><Square selected={0} /></Panel><Panel title="Attached labels after r"><Square map={1} selected={1} /></Panel></Compare><PermutationWires g={1} /></Figure>;
}
function GeometryPreservationFigure() {
  return <Figure job="G02" title="A bijection can change a distance" caption="One common coordinate scale: the quarter-turn keeps diagonal length 2, but swapping only 0 and 1 makes the same addressed pair an edge of length √2."><Compare><Panel title="Original 0–2"><SegmentGeometry from={squareVertices[0]} to={squareVertices[2]} label="Original diagonal 0–2" /></Panel><Panel title="Quarter-turn 1–3"><SegmentGeometry from={squareVertices[1]} to={squareVertices[3]} label="Rotated diagonal 1–3" /></Panel><Panel title="Swap 0↔1; resulting pair 1–2"><SegmentGeometry from={squareVertices[1]} to={squareVertices[2]} label="Swapped pair becomes an edge" tone="rose" /></Panel></Compare></Figure>;
}
function EightSquareMapsFigure() {
  return <Figure job="G03" title="Eight complete destination rules" caption="Each move carries all four attached identities. The destination table distinguishes a map from its resulting value arrangement."><div className="aa-state-grid">{squareGroup.map((g) => <Panel key={g} title={names[g]}><Square map={g} label={`${names[g]} applied to all four labels`} /></Panel>)}</div><Table label="All four destinations for every move" headers={["Move", "0 \u2192", "1 \u2192", "2 \u2192", "3 \u2192"]} rows={squareGroup.map((g) => [names[g], ...squarePermutation(g)])} /></Figure>;
}
function EncodedSquareRuleFigure() {
  return <Figure job="G04" title="Reflect, reduce and turn one addressed input" caption="For rs, k=1 and b=1: position 1 becomes −1, wraps to 3, then becomes 4 and wraps to 0. Encoded element 5 names this complete move, not a fifth position."><Route states={path(letters, [4, 1])} moves={["s: i\u2192\u2212i mod 4", "r: add 1 mod 4"]} label="Full rs route" tracked={1} /><Table label="Integer intermediates and residues" headers={["Step", "Unreduced integer", "Position residue"]} rows={[["Start", 1, 1], ["Reflect", -1, 3], ["Add turn", 4, 0]]} /></Figure>;
}
function InverseWordFigure() {
  return <Figure job="G06" title="Undo the last move first" caption="The forward rs route 1→3→0 returns through r⁻¹ then s: 0→3→1. Every attached label returns, not only the inspected vertex."><Route states={path(letters, [4, 1, 3, 4])} moves={["s", "r", "r\u207B\xB9", "s\u207B\xB9=s"]} label="Forward word followed by its reversed inverse word" /><Table label="Tracked vertex route" headers={["Move just applied", "Position"]} rows={[["Start", 1], ["s", 3], ["r", 0], ["r\u207B\xB9", 3], ["s\u207B\xB9", 1]]} /></Figure>;
}
function ClosedOperationFigure() {
  return <Figure job="G07" title="Where does a product land?" caption="The full allowed D4 set contains rs. In the proposed subset {e,r}, rr=r² leaves the boundary of the declared set."><Compare><Panel title="Full D4"><Blocks blocks={[squareGroup]} label="Allowed eight moves" /><Square map={composeSquare(1, 4)} label="rs is an allowed square map" /><p>r ∘ s = rs ∈ D4</p></Panel><Panel title="Proposed {e,r}"><Blocks blocks={[[0, 1]]} label="Only e and r allowed" /><Square map={2} label="rr output r² is outside the proposed subset" /><p className="aa-error">r ∘ r = r² ∉ {"{"}e,r{"}"}</p></Panel></Compare></Figure>;
}
function AssociativePathFigure() {
  const moves = [1, 4, 1];
  return <Figure job="G08" title="Parentheses preserve the same three operations" caption="Both paths apply k=r, h=s, g=r in that order. Grouping the first or last pair changes neither intermediate function evaluation nor the complete final arrangement."><Compare><Panel title="(gh)k"><Route states={path(letters, moves)} moves={["k=r", "h=s", "g=r"]} label="Left-parenthesized composition route" /></Panel><Panel title="g(hk)"><Route states={path(letters, moves)} moves={["k=r", "h=s", "g=r"]} label="Right-parenthesized composition route" /></Panel></Compare><p>At every input x: g(h(k(x))). The order remains k, h, g.</p></Figure>;
}
function IdentityAndInverseFigure() {
  return <Figure job="G09" title="Identity keeps all labels; an inverse returns all labels" caption="The empty change e preserves every address. Both rr⁻¹ and r⁻¹r return the complete initial labeling."><Compare><Panel title="Identity on either side"><Route states={path(letters, [0, 1, 0])} moves={["e", "r", "e"]} label="Identity leaves the r result unchanged" /></Panel><Panel title="r then r⁻¹"><Route states={path(letters, [1, 3])} moves={["r", "r\u207B\xB9"]} label="r followed by its inverse" /></Panel><Panel title="r⁻¹ then r"><Route states={path(letters, [3, 1])} moves={["r\u207B\xB9", "r"]} label="Inverse followed by r" /></Panel></Compare></Figure>;
}
function CancellationFigure() {
  return <Figure job="G10" title="Undoing recovers an input; merging destroys that information" caption="The inverse permutation recovers every distinct position. Squaring instead sends both −1 and 1 to 1, so there is no inverse function that recovers both inputs from that common output."><Compare><Panel title="Permutation and recovery"><PermutationWires g={1} values={[0, 1, 2, 3]} /><PermutationWires g={3} values={[3, 0, 1, 2]} /></Panel><Panel title="Squaring merges"><MapRows inputs={[-1, 1]} outputs={[1, 1]} label="Distinct inputs merged by squaring" /><p>No single-valued inverse at output 1 can return both inputs.</p></Panel></Compare></Figure>;
}
function FailedGroupContractsFigure() {
  return <Figure job="G11" title="Locate the missing guarantee in a real operation" caption="These counterexamples fail different requirements: closure in {e,r}, an integer inverse for 2, and reversibility of clipping."><Compare><Panel title="Closure failure"><Blocks blocks={[[0, 1]]} /><Square map={2} label="r² lies outside e/r subset" /><p>r·r=r² outside the set.</p></Panel><Panel title="Required inverse outside integers"><Products weights={[0.5]} values={[2]} unit="scalar units" label="The missing factor 1/2 gives 2×(1/2)=1" /><p>2×(1/2)=1; 1/2 ∉ ℤ.</p></Panel><Panel title="Clipping merges"><MapRows inputs={[-2, -1, 0, 1]} outputs={[0, 0, 0, 1]} label="Different negative values clipped to zero" /></Panel></Compare></Figure>;
}
function GeneratedRotationFigure() {
  return <Figure job="G12" title="Repeating one generator reaches four distinct moves" caption="The r-labeled cycle follows e→r→r²→r³→e. One supplied generator produces a group of four elements; adding s reaches the other four."><MoveGraph labels={rotationGroup.map((g) => names[g])} edges={rotationGroup.map((g) => ({ from: g, to: composeSquare(1, g), move: "r", tone: "blue" }))} label="Generated rotation cycle" /><Blocks blocks={[rotationGroup, squareGroup.filter((g) => g >= 4)]} label="Rotations and additional reflected moves" /></Figure>;
}
function OrderAndIsomorphismFigure() {
  return <Figure job="G13" title="First return distinguishes two four-element groups" caption="A C4 generator first returns after four products. Every nonzero C2×C2 element returns after two additions. A product-preserving relabeling must preserve these return counts."><Compare><Panel title="C4 powers of r"><MoveGraph labels={rotationGroup.map((g) => names[g])} edges={rotationGroup.map((g) => ({ from: g, to: (g + 1) % 4, move: "r" }))} label="Order-four element in C4" /></Panel><Panel title="Pairs added modulo 2"><MoveGraph labels={["00", "10", "01", "11"]} edges={[{ from: 0, to: 1, move: "+10" }, { from: 1, to: 0, move: "+10" }, { from: 2, to: 3, move: "+10" }, { from: 3, to: 2, move: "+10" }]} label="Order-two translation in C2×C2" /><Table label="All nonidentity first returns" headers={["Element", "Double", "Order"]} rows={["10", "01", "11"].map((x) => [x, "00", 2])} /></Panel></Compare></Figure>;
}
function SubgroupTestFigure() {
  return <Figure job="G14" title="The one product supplies identity, inverses and ordinary products" caption="The visible nonempty H permits a=b to produce e. Using e as the first input produces b⁻¹; using that inverse as the second input then gives ab. These are the actual substitutions in the general test."><Blocks blocks={[rotationGroup]} label="Concrete nonempty H=C4" /><Compare><Panel title="a=b=r"><Route states={path(letters, [3, 1])} moves={["b\u207B\xB9=r\u207B\xB9", "a=r"]} label="aa inverse gives identity" /><p>a b⁻¹ = e</p></Panel><Panel title="a=e,b=r"><Route states={path(letters, [3, 0])} moves={["b\u207B\xB9=r\u207B\xB9", "a=e"]} label="Identity as first input obtains inverse" /><p>e b⁻¹ = r⁻¹ ∈ H</p></Panel><Panel title="Second input is b⁻¹"><Route states={path(letters, [1, 2])} moves={["(b\u207B\xB9)\u207B\xB9=b=r", "a=r\xB2"]} label="Using known inverse obtains ordinary product" /><p>a (b⁻¹)⁻¹ = ab = r³ ∈ H</p></Panel></Compare></Figure>;
}
function LeftCosetFigure() {
  const H = [0, 4];
  return <Figure job="G15" title="Translate every subgroup member" caption="H={e,s} has four complete left cosets. Multiplication by r sends e→r and s→rs; multiplication by r⁻¹ brings both members home."><Blocks blocks={cosets(H)} label="All complete left cosets of e/s" /><Table label="Forward translation and inverse recovery" headers={["h in H", "rh", "r\u207B\xB9(rh)"]} rows={H.map((h) => [names[h], names[composeSquare(1, h)], names[composeSquare(3, composeSquare(1, h))]])} /><Compare><Panel title="h=e then r"><Route states={path(letters, [0, 1])} moves={["e", "r"]} label="First translated member r" /></Panel><Panel title="h=s then r"><Route states={path(letters, [4, 1])} moves={["s", "r"]} label="Second translated member rs" /></Panel></Compare></Figure>;
}
function CosetPartitionProofFigure() {
  return <Figure job="G16" title="A shared member forces the whole cosets to agree" caption="For H={e,s}, rH=(rs)H={r,rs}. The shared element r expresses r=(rs)s. Multiplying either representative by both H members reaches the same full block, and inverse multiplication recovers H."><Compare><Panel title="rH"><Blocks blocks={[cosets([0, 4])[1]]} /><Table label="All rH members" headers={["h", "rh"]} rows={[0, 4].map((h) => [names[h], names[composeSquare(1, h)]])} /></Panel><Panel title="(rs)H"><Blocks blocks={[[composeSquare(5, 0), composeSquare(5, 4)]]} /><Table label="All rsH members" headers={["h", "(rs)h"]} rows={[0, 4].map((h) => [names[h], names[composeSquare(5, h)]])} /></Panel></Compare><p>Shared x=g h₁=k h₂ ⇒ g=k h₂ h₁⁻¹. For every h∈H, gh=k(h₂ h₁⁻¹ h) ∈ kH.</p></Figure>;
}
function FiniteLagrangeFigure() {
  return <Figure job="G17" title="Count whole equal-sized blocks" caption="The disjoint complete blocks cover all eight moves: four blocks of two for {e,s}, or two blocks of four for rotations. The block count is distinct from the size of one block."><Compare><Panel title="H={e,s}:4×2=8"><Blocks blocks={cosets([0, 4])} /></Panel><Panel title="H=C4:2×4=8"><Blocks blocks={cosets(rotationGroup)} /></Panel></Compare></Figure>;
}
function GroupActionFigure() {
  const opposite = orbitState([1, 0, 1, 0]);
  return <Figure job="G18" title="Transformation nodes and configuration nodes are different sets" caption="The full move graphs have eight transformation nodes. The opposite-coloring action has two configuration nodes; r exchanges them and s supplies a real loop at each. Every edge applies its generator on the left."><Compare>{[1, 4].map((generator) => <Panel key={generator} title={`Eight moves, generator ${names[generator]}`}><MoveGraph labels={names} edges={squareGroup.map((g) => ({ from: g, to: composeSquare(generator, g), move: names[generator], tone: generator === 1 ? "blue" : "rose" }))} label={`Cayley generator ${names[generator]}: g\u2192${names[generator]}g`} /></Panel>)}</Compare><Compare><Panel title="Two reached configurations"><States states={opposite.states.map((row) => row.colors)} /></Panel><Panel title="Action transitions"><MoveGraph labels={["x0", "x1"]} edges={[{ from: 0, to: 1, move: "r", tone: "blue" }, { from: 1, to: 0, move: "r", tone: "blue" }, { from: 0, to: 0, move: "s", tone: "rose" }, { from: 1, to: 1, move: "s", tone: "rose" }]} label="Action on the two opposite patterns" /></Panel></Compare></Figure>;
}
function ActionInputsFigure() {
  const x = [1, 0, 0, 0];
  return <Figure job="G19" title="One input is a move; the other is a configuration" caption="The transformation r is an element of G. The marked-square input and its transformed output are states in X. Applying the rule does not turn the output into another group element."><Compare><Panel title="Move input r ∈ G"><PermutationWires g={1} /></Panel><Panel title="State input x ∈ X"><Square values={x} painted /></Panel><Panel title="State output r·x ∈ X"><Square values={moveSquareData(1, x)} painted /></Panel></Compare><p>G × X → X; (r, (1,0,0,0)) ↦ (0,1,0,0).</p></Figure>;
}
function ActionLawFigure() {
  const x = [1, 0, 0, 0], h = 4, g = 1;
  return <Figure job="G20" title="Two actions agree with their product action" caption="Every attached value reaches the same address under h then g as under gh. The identity gives the original complete state; reversing the move recovers it."><Compare><Panel title="h=s, then g=r"><Route states={path(x, [h, g])} moves={["h=s", "g=r"]} label="Successive full actions on one-mark input" /></Panel><Panel title="Product gh=rs"><Route states={path(x, [composeSquare(g, h)])} moves={["gh=rs"]} label="Single product action" /></Panel></Compare><Table label="All addressed outputs agree" headers={["Address", "g\xB7(h\xB7x)", "(gh)\xB7x"]} rows={moveSquareData(composeSquare(g, h), x).map((value, i) => [i, value, moveSquareData(g, moveSquareData(h, x))[i]])} /></Figure>;
}
function FourOrbitExamplesFigure() {
  const patterns = [[1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 1, 1]];
  return <Figure job="G21" title="Reachable states and fixing moves have different counts" caption="The vertex and one-mark state each have orbit 4 and stabilizer 2; opposite marks have 2 and 4; a constant state has 1 and 8. Each pair multiplies to the same group size 8."><Panel title="A vertex reaches four addresses"><MoveGraph labels={["0", "1", "2", "3"]} edges={[0, 1, 2, 3].map((i) => ({ from: i, to: (i + 1) % 4, move: "r" }))} label="Vertex orbit under quarter-turns" /></Panel><Compare>{patterns.map((x, i) => {
    const state = orbitState(x);
    return <Panel key={i} title={`${["One mark", "Opposite marks", "Constant"][i]}: ${state.orbitSize} reached, ${state.stabilizer.length} fixing`}><States states={state.states.map((row) => row.colors)} title="Reached state" /><p>Fixing moves: {groupNames(state.stabilizer)}</p></Panel>;
  })}</Compare></Figure>;
}
function StabilizerFigure() {
  const x = [1, 0, 1, 0], state = orbitState(x);
  return <Figure job="G22" title="Four moves fix this one state" caption="The same pattern survives e, r², s and r²s. The other four maps exchange its two marked positions. Fixing one state is different from fixing every possible input."><div className="aa-state-grid">{squareGroup.map((g) => <Panel key={g} title={`${names[g]}: ${state.stabilizer.includes(g) ? "fixes" : "changes"}`}><Square values={x} map={g} painted /></Panel>)}</div><Blocks blocks={[state.stabilizer, squareGroup.filter((g) => !state.stabilizer.includes(g))]} label="Fixing and changing transformations" /></Figure>;
}
function CosetOrbitBijectionFigure() {
  const x = [1, 0, 1, 0], state = orbitState(x), blocks = leftCosets(state.stabilizer);
  return <Figure job="G23" title="A whole stabilizer coset has one configuration output" caption="Each complete four-member block sends x to its displayed state. Equal output states mean the representatives differ by a fixing move; two blocks therefore correspond to two reached configurations."><Compare>{blocks.map((block, i) => <Panel key={i} title={`Coset ${i} \u2192 configuration ${i}`}><Blocks blocks={[block.members]} label={`All representatives of stabilizer coset ${i}`} /><Square values={moveSquareData(block.representative, x)} painted /><Table label={`Every member has the same output in coset ${i}`} headers={["g", "g\xB7x"]} rows={block.members.map((g) => [names[g], vector(moveSquareData(g, x))])} /></Panel>)}</Compare></Figure>;
}
function KernelVersusStabilizerFigure() {
  const x = [1, 0, 1, 0], basis = [1, 0, 0, 0];
  return <Figure job="G24" title="A fixing move can fail on another input" caption="r² fixes the opposite pattern but moves the one-mark input from position 0 to position 2. Testing all four addressed one-mark inputs leaves only e in the kernel of the full binary-coloring action."><Compare><Panel title="r² fixes this state"><Square values={x} painted /><Square values={x} map={2} painted /></Panel><Panel title="r² changes this addressed input"><Square values={basis} painted /><Square values={basis} map={2} painted /></Panel></Compare><Table label="Fixing every addressed one-mark input" headers={["Move", "Destinations of 0,1,2,3", "Fixes all four?"]} rows={squareGroup.map((g) => [names[g], vector(squarePermutation(g)), g === 0 ? "yes" : "no"])} /></Figure>;
}
const binaryStates = () => Array.from({ length: 16 }, (_, n) => [3, 2, 1, 0].map((bit) => n >> bit & 1));
function binaryClasses() {
  const unseen = new Set(binaryStates().map((x) => x.join(","))), classes = [];
  while (unseen.size) {
    const x = [...unseen][0].split(",").map(Number), states = orbitState(x).states.map((row) => row.colors);
    classes.push(states);
    states.forEach((row) => unseen.delete(row.join(",")));
  }
  return classes;
}
function BinaryColoringClassesFigure() {
  const classes = binaryClasses();
  return <Figure job="G25" title="Six orbits contain all sixteen binary states" caption="Each addressed coloring is shown once. The block sizes 1,4,4,2,4,1 distinguish adjacent and opposite marks and expose why 16/8 does not count the designs.">{classes.map((states, i) => <Panel key={i} title={`Orbit ${i}: ${states.length} complete states`}><States states={states} /></Panel>)}</Figure>;
}
function CycleColorConstraintsFigure() {
  return <Figure job="G26" title="Each full permutation cycle shares one color" caption="The cycle arrows cover every position, including fixed-position cycles. r has one cycle, r² two, and s three. Each independent cycle chooses one of q named colors, giving qᶜ fixed colorings."><Compare>{[0, 1, 2, 4].map((g) => {
    const cycles = permutationCycles(g), values = [0, 0, 0, 0];
    cycles.forEach((cycle, i) => cycle.forEach((v) => values[v] = i));
    return <Panel key={g} title={`${names[g]}: ${cycles.length} cycles`}><Square values={values} painted /><PermutationWires g={g} values={values} label={`All addressed arrows in ${names[g]}`} /><p>{cycles.map((cycle) => `(${cycle.join(" ")})`).join(" ")}; q^{cycles.length} independent assignments.</p></Panel>;
  })}</Compare></Figure>;
}
function BurnsideDoubleCountFigure() {
  const all = binaryStates(), sample = [all[0], [1, 0, 0, 0], [1, 0, 1, 0], all[15]], fix = (g, x) => moveSquareData(g, x).every((v, i) => v === x[i]), counts = squareGroup.map((g) => all.filter((x) => fix(g, x)).length);
  return <Figure job="G27" title="Count actual fixed move–state pairs by rows or columns" caption="A filled dot means the row move fixes that complete column state. The addressed four-column view introduces the relation; the full sixteen-column table preserves every pair. All fixed-pair row counts sum to 48, so 48/8=6 orbits."><Canvas label="Four addressed columns of the fixed-pair incidence relation" height={340}>{({ width }) => <>{sample.map((_, j) => <Text key={j} x={38 + (width - 46) * (j + 0.5) / 4} y={19}>{j}</Text>)}{squareGroup.map((g) => <g key={g}><Text x={27} y={52 + g * 36} anchor="end">{names[g]}</Text>{sample.map((x, j) => <circle key={j} cx={38 + (width - 46) * (j + 0.5) / 4} cy={47 + g * 36} r={5} className={fix(g, x) ? "aa-node gold" : "aa-outline"}><title>{[names[g], fix(g, x) ? "fixes" : "changes", "column", j, ":", vector(x)].join(" ")}</title></circle>)}</g>)}</>}</Canvas><Table label="Addressed column identities" headers={["Column", "Complete state"]} rows={sample.map((x, i) => [i, vector(x)])} /><Table label="Complete 8×16 fixed-pair relation and row counts" headers={["Move", ...all.map((x) => x.join("")), "Row count"]} rows={squareGroup.map((g) => [names[g], ...all.map((x) => Number(fix(g, x))), counts[g]])} /></Figure>;
}
function TernaryChiralityFigure() {
  const x = [0, 0, 1, 2], reflected = moveSquareData(4, x);
  return <Figure job="G29" title="Reflection reaches a state outside the rotation orbit" caption="The four rotated versions of (0,0,1,2) are individually addressed. Its reflection (0,2,1,0) equals none of them. Named colors stay fixed while positions move."><Panel title="Four rotations"><States states={rotationGroup.map((g) => moveSquareData(g, x))} /></Panel><Panel title="Horizontal reflection s"><Square values={reflected} painted /></Panel><Table label="Three-color class counts" headers={["Allowed moves", "Fixed-pair sum", "Group size", "Classes"]} rows={[["C4", fixedColoringCount(3, true).numerator, 4, 24], ["D4", fixedColoringCount(3, false).numerator, 8, 21]]} /></Figure>;
}
function NamedColorsFigure() {
  return <Figure job="G30" title="Moving positions never renames the colors" caption="Every positional move fixes the all-0 state separately from the all-1 state. The two distinct singleton orbits cannot merge unless a different color-renaming action is introduced."><Compare><Panel title="All 0 remains all 0"><Square values={[0, 0, 0, 0]} painted /><PermutationWires g={1} values={[0, 0, 0, 0]} /></Panel><Panel title="All 1 remains all 1"><Square values={[1, 1, 1, 1]} painted /><PermutationWires g={1} values={[1, 1, 1, 1]} /></Panel></Compare></Figure>;
}
const sign = (g) => g < 4 ? 1 : -1;
function HomomorphismSquareFigure() {
  return <Figure job="G31" title="Combining moves and combining signs reach the same result" caption="For g=r and h=s, gh=rs has sign −1. Keeping signs first gives (+1)×(−1)=−1. The full product audit shows the same agreement for every pair, not only this input."><Compare><Panel title="Compose inside D4"><Route states={path(letters, [4, 1])} moves={["h=s", "g=r"]} label="Compose first: rs" /><p>φ(rs) = −1</p></Panel><Panel title="Keep orientation, then multiply"><MapRows inputs={["++", "+-", "-+", "--"]} outputs={[1, -1, -1, 1]} label="Multiplication in the sign group" /><p>φ(r)φ(s) = (+1)(−1) = −1</p></Panel></Compare><Table label="Orientation of every full product" headers={["g \u2193 / h \u2192", ...names]} rows={squareGroup.map((g) => [names[g], ...squareGroup.map((h) => sign(composeSquare(g, h)))])} /></Figure>;
}
function KernelImageFigure() {
  return <Figure job="G32" title="The identity fiber is the kernel; reached signs form the image" caption="All four rotations reach the target identity +1. All reflections reach −1. These are both elements of the stated sign-group target; a larger general target need not equal the image."><MapRows inputs={names} outputs={squareGroup.map(sign)} label="Complete orientation homomorphism" inputName="Square move" outputName="Reached sign" /><Blocks blocks={[rotationGroup, squareGroup.filter((g) => g >= 4)]} label="Identity fiber and the other fiber" /></Figure>;
}
function OrientationQuotientFigure() {
  return <Figure job="G33" title="Compose whole orientation classes" caption="Each input is a full four-member coset. Rotation×rotation and reflection×reflection land in the rotation class; mixed classes land in the reflection class. The class table matches sign multiplication."><Blocks blocks={cosets(rotationGroup)} label="Two complete cosets of the rotation kernel" /><MapRows inputs={["RR", "RF", "FR", "FF"]} outputs={["R", "F", "F", "R"]} label="Complete quotient class products" /><Table label="Orientation quotient operation" headers={["Outer / inner", "Rotations R", "Reflections F"]} rows={[["Rotations R", "R", "F"], ["Reflections F", "F", "R"]]} /></Figure>;
}
function ConjugateSubgroupFigure() {
  const conjugate = (h) => composeSquare(1, composeSquare(h, 3));
  return <Figure job="G34" title="Undo the reference change, act, then restore it" caption="The route r⁻¹, s, r turns horizontal reflection into r²s. Every conjugated rotation remains inside C4, while the complete reflection subgroup {e,s} changes to {e,r²s}."><Route states={path(letters, [3, 4, 1])} moves={["r\u207B\xB9", "s", "r"]} label="Conjugating s by r" /><Compare><Panel title="Rotation subgroup retained"><Blocks blocks={[rotationGroup, rotationGroup.map(conjugate).sort((a, b) => a - b)]} label="Original and conjugated rotations" /></Panel><Panel title="Reflection subgroup changes"><Blocks blocks={[[0, 4], [0, 6]]} label="Original e/s and conjugated e/r²s" /></Panel></Compare><Table label="All subgroup-member images under conjugation" headers={["h", "r h r\u207B\xB9"]} rows={[0, 1, 2, 3, 4].map((h) => [names[h], names[conjugate(h)]])} /></Figure>;
}
function FailedCosetMultiplicationFigure() {
  return <Figure job="G35" title="Same input block, different product blocks" caption="e and s are both members of H={e,s}. With the same right factor r, er=r reaches rH, while sr=r³s reaches srH. Different full output blocks refute representative independence."><Blocks blocks={[[0, 4]]} label="Unchanged first input coset eH=sH" /><Compare><Panel title="Choose representative e"><Route states={path(letters, [1, 0])} moves={["r", "e"]} label="er=r route" /><Blocks blocks={[[1, 5]]} label="Result rH={r,rs}" /></Panel><Panel title="Choose representative s"><Route states={path(letters, [1, 4])} moves={["r", "s"]} label="sr=r³s route" /><Blocks blocks={[[3, 7]]} label="Result srH={r³,r³s}" /></Panel></Compare></Figure>;
}
function RepresentativeIndependenceFigure() {
  return <Figure job="G37" title="Conjugation moves the inner normal factor without commuting it" caption="Take g=r,h=s,n₁=r,n₂=r². Moving n₁ past h changes it to h⁻¹n₁h=r³. Both full words produce s, and the trailing factors stay in the rotation subgroup. Their order is retained."><Compare><Panel title="g n₁ h n₂"><Route states={path(letters, [2, 4, 1, 1])} moves={["n\u2082=r\xB2", "h=s", "n\u2081=r", "g=r"]} label="Original four-factor product" /></Panel><Panel title="g h (h⁻¹n₁h) n₂"><Route states={path(letters, [2, 3, 4, 1])} moves={["n\u2082=r\xB2", "h\u207B\xB9n\u2081h=r\xB3", "h=s", "g=r"]} label="Reordered product with conjugated factor" /></Panel></Compare><Blocks blocks={[rotationGroup]} label="Both trailing normal factors remain in N=C4" /><p>gn₁hn₂ = gh(h⁻¹n₁h)n₂ ∈ ghN.</p></Figure>;
}
function FirstIsomorphismFigure() {
  return <Figure job="G38" title="Each kernel coset names exactly one image element" caption="The two complete rotation-kernel cosets map bijectively to the reached signs +1 and −1. Their products agree with the sign products, so collapsing exactly the kernel preserves the image group structure."><Blocks blocks={cosets(rotationGroup)} label="Domain G/kerφ consists of complete cosets" /><MapRows inputs={["R", "F"]} outputs={[1, -1]} label="Kernel-coset to image bijection" inputName="Complete coset" outputName="Image sign" /><Table label="Product preservation on all quotient pairs" headers={["Input classes", "Output class", "Image product"]} rows={[["R,R", "R", 1], ["R,F", "F", -1], ["F,R", "F", -1], ["F,F", "R", 1]]} /></Figure>;
}
function GeometricVectors({ vectors, label, extent = 2 }) {
  return <><Canvas label={label} height={270}>{({ width }) => {
    const scale = Math.min((width - 36) / 2, 100) / extent, cx = width / 2, cy = 134;
    return <><line className="aa-axis" x1={12} x2={width - 12} y1={cy} y2={cy} /><line className="aa-axis" x1={cx} x2={cx} y1={20} y2={244} /><Text x={cx - 12} y={cy + 21}>0</Text><Text x={width - 14} y={cy + 22} anchor="end">x</Text><Text x={cx + 15} y={20}>y</Text>{vectors.map((row, i) => <g key={i}><Arrow x1={cx} y1={cy} x2={cx + row.values[0] * scale} y2={cy - row.values[1] * scale} tone={["blue", "rose", "gold", "white"][i]} label={`${row.name} = ${vector(row.values)}`} /><circle cx={cx + row.values[0] * scale} cy={cy - row.values[1] * scale} r={4} className={`aa-node ${["blue", "rose", "gold", "white"][i]}`} /></g>)}</>;
  }}</Canvas><ul>{vectors.map((row, i) => <li key={i} className={["blue", "rose", "gold", "white"][i]}>{row.name}: {vector(row.values)} coordinate units</li>)}</ul><p>Common axis scale: {extent} coordinate units per outer radius.</p></>;
}
function TwoRepresentationsFigure() {
  const x = [1, 0], data = [1, 2, 4, 8];
  return <Figure job="G39" title="The same moves act on two different vector spaces" caption="The geometric 2-vector rotates its coordinate endpoint. The four-channel representation moves values among fixed positions. Both represent the same group; their dimensions and matrix addresses differ."><Compare>{[1, 4].map((g) => <Panel key={g} title={`Geometric ${names[g]}: R\xB2\u2192R\xB2`}><GeometricVectors vectors={[{ name: "Input", values: x }, { name: "Output", values: applyMatrix(squareMatrix(g), x) }]} label={`Geometric action of ${names[g]}`} /><Matrix values={squareMatrix(g)} rowNames={["x", "y"]} columnNames={["x", "y"]} label={`Geometric 2\xD72 matrix for ${names[g]}`} /></Panel>)}</Compare><Compare>{[1, 4].map((g) => <Panel key={g} title={`Data ${names[g]}: R\u2074\u2192R\u2074`}><Square values={data} map={g} /><PermutationWires g={g} values={data} /><Matrix values={permutationMatrix(g)} label={`Addressed 4\xD74 matrix for ${names[g]}`} /></Panel>)}</Compare></Figure>;
}
function DataPullbackFigure() {
  return <Figure job="G40" title="Find the old source of each new destination" caption="The old value at i travels to r(i). At destination j, looking backward therefore uses r⁻¹(j). The matrix 1 in destination row j/source column i records exactly that connection."><Compare><Panel title="Original fixed-position readings"><Square values={[1, 2, 4, 8]} /></Panel><Panel title="Push values by r"><PermutationWires g={1} values={[1, 2, 4, 8]} /></Panel><Panel title="Read the new fixed positions"><Square values={[8, 1, 2, 4]} /></Panel></Compare><Matrix label="Pᵣ: destination rows / old source columns" values={permutationMatrix(1)} /><Table label="Backward source lookup at all destinations" headers={["j", "r\u207B\xB9(j)", "Old value at source", "New value at j"]} rows={[0, 1, 2, 3].map((j) => [j, vertexImage(3, j), [1, 2, 4, 8][vertexImage(3, j)], [8, 1, 2, 4][j]])} /></Figure>;
}
function InvariantEquivariantRoutesFigure() {
  const state = equivarianceState();
  return <Figure job="G41" title="A vector transforms; a pooled scalar stays fixed" caption="For W tied to square relations and g=s, both full vector routes end at the same transformed output. The mean uses the trivial scalar output action: its value is unchanged, while the vector's addresses move."><Compare><Panel title="Pₛ then W"><Route states={[state.values, state.transformedInput, state.transformThenMap]} moves={["P\u209B", "W"]} label="Transform then map all four readings" /></Panel><Panel title="W then Qₛ=Pₛ"><Route states={[state.values, state.mapped, state.mapThenTransform]} moves={["W", "Q\u209B"]} label="Map then transform all four outputs" /></Panel></Compare><Compare><Panel title="Pool original mapped output"><Products weights={[0.25, 0.25, 0.25, 0.25]} values={state.mapped} label="Four contributions to the mean" /></Panel><Panel title="Pool transformed output"><Products weights={[0.25, 0.25, 0.25, 0.25]} values={state.transformThenMap} label="The same scalar after permutation" /></Panel></Compare><p>Both means are {num(state.poolBefore)} V. The scalar output action is 1.</p></Figure>;
}
function AllInputMatrixFigure() {
  const p = permutationMatrix(4), W = equivarianceState().matrix, left = matrixProduct(W, p), right = matrixProduct(p, W);
  return <Figure job="G42" title="Every column tests one addressed basis input" caption="Column i is the entire output on eᵢ, with 1 at position i and 0 elsewhere. Equality of all four columns gives WPₛ=PₛW and thus agreement for every real input. The entries of these operators are dimensionless."><Compare><Panel title="WPₛ: transform input, then map"><Matrix values={left} label="All columns of WPₛ" /></Panel><Panel title="PₛW: map, then transform output"><Matrix values={right} label="All columns of PₛW" /></Panel></Compare><div className="aa-state-grid">{[0, 1, 2, 3].map((i) => {
    const basis = [0, 0, 0, 0];
    basis[i] = 1;
    return <Panel key={i} title={`Basis input e${i}`}><Route states={[basis, applyMatrix(p, basis), applyMatrix(left, basis)]} moves={["P\u209B", "W"]} label={`Complete first route on basis ${i}`} /><Table label={`Both route outputs on basis ${i}`} headers={["Output address", "WP\u209Be\u1D62", "P\u209BWe\u1D62"]} rows={left.map((row, j) => [j, row[i], right[j][i]])} /></Panel>;
  })}</div></Figure>;
}
function PointwiseNonlinearityFigure() {
  const x = [-1, 2, -3, 4], relu = (v) => v.map((value) => Math.max(0, value));
  return <Figure job="G43" title="Entrywise clipping commutes with permutations, but not every representation" caption="The four-channel routes both end at (4,0,2,0). For the geometric half-turn −I, clipping after rotation gives (0,1), whereas rotating the clipped (1,0) gives (−1,0). The allowed action matters."><Compare><Panel title="Permutation then ReLU"><Route states={[x, moveSquareData(1, x), relu(moveSquareData(1, x))]} moves={["P\u1D63", "ReLU"]} label="Permutation before entrywise nonlinearity" /></Panel><Panel title="ReLU then permutation"><Route states={[x, relu(x), moveSquareData(1, relu(x))]} moves={["ReLU", "P\u1D63"]} label="Entrywise nonlinearity before permutation" /></Panel></Compare><GeometricVectors vectors={[{ name: "Original x", values: [1, -1] }, { name: "ReLU(\u2212x)", values: [0, 1] }, { name: "\u2212ReLU(x)", values: [-1, 0] }]} label="Actual half-turn counterexample" /></Figure>;
}
const pairClass = (i, j) => i === j ? 0 : (j - i + 4) % 4 === 2 ? 2 : 1;
function PairOrbitWeightsFigure() {
  const weights = [2, 0.5, 0], W = equivarianceState().matrix;
  return <Figure job="G44" title="Three relation orbits tie all sixteen ordered matrix cells" caption="Self pairs are blue (4 cells), neighbors gold (8), and opposite pairs rose (4). Simultaneously moving destination and source preserves each relation. These are membership colors, independent of the numerical coefficient."><Compare>{[0, 1, 2].map((kind) => <Panel key={kind} title={`${["Self", "Neighbor", "Opposite"][kind]} relation: coefficient ${weights[kind]}`}><Canvas label={`${["Self", "Neighbor", "Opposite"][kind]} ordered pairs from destination 0`} height={230}>{({ width }) => {
    const cx = width / 2, cy = 110, r = Math.min(width * 0.3, 65), at = (i) => [cx + squareVertices[i][0] * r, cy - squareVertices[i][1] * r];
    return <><polygon className="aa-outline" points={squareVertices.map((_, i) => at(i).join(",")).join(" ")} />{[0, 1, 2, 3].filter((j) => pairClass(0, j) === kind).map((j) => j === 0 ? <circle key={j} cx={at(0)[0]} cy={at(0)[1]} r={18} className="aa-stroke blue" /> : <Arrow key={j} x1={at(j)[0]} y1={at(j)[1]} x2={at(0)[0]} y2={at(0)[1]} tone={["blue", "gold", "rose"][kind]} label={`Source ${j} to destination 0: ${["self", "neighbor", "opposite"][kind]}`} />)}{[0, 1, 2, 3].map((i) => <g key={i}><circle cx={at(i)[0]} cy={at(i)[1]} r={8} className="aa-node white" /><Text x={at(i)[0]} y={at(i)[1] + 5}>{i}</Text></g>)}</>;
  }}</Canvas></Panel>)}</Compare><Matrix values={W} label="All sixteen tied cells, addressed by destination/source" classFor={(i, j) => ["blue", "gold", "rose"][pairClass(i, j)]} /><Products weights={W[0]} values={[1, 2, 4, 8]} label="Destination 0: self and two neighbor contributions" /><Table label="All tied output readings" headers={["Destination", "Output V"]} rows={[7, 6.5, 13, 18.5].map((v, i) => [i, v])} /></Figure>;
}
function RotationVersusSquareWeightsFigure() {
  const raw = [[1, 2, 3, 4], [4, 1, 2, 3], [3, 4, 1, 2], [2, 3, 4, 1]], state = equivarianceState([1, 2, 4, 8], "shift", 4);
  return <Figure job="G46" title="Reflection joins the two directed neighbor offsets" caption="C4 keeps four ordered offsets separate. D4 identifies the two neighbor offsets, giving three parameters. The one-position shift commutes with rotations but its two reflection routes end at different full readings."><Matrix values={raw} label="Four independent C4 offsets" classFor={(i, j) => ["blue", "gold", "rose", "white"][(j - i + 4) % 4]} /><Compare><Panel title="Clockwise neighbor"><PermutationWires g={1} values={[1, 2, 4, 8]} /></Panel><Panel title="Counterclockwise neighbor"><PermutationWires g={3} values={[1, 2, 4, 8]} /></Panel></Compare><Compare><Panel title="s then shift r"><Route states={[state.values, state.transformedInput, state.transformThenMap]} moves={["s", "r"]} label="Reflection before directed shift" /></Panel><Panel title="Shift r then s"><Route states={[state.values, state.mapped, state.mapThenTransform]} moves={["r", "s"]} label="Directed shift before reflection" /></Panel></Compare><Matrix values={state.commutators[4].residual} label="Complete dimensionless shift/reflection commutator" /></Figure>;
}
function EightAlignedAveragesFigure() {
  return <Figure job="G47" title="Transform, apply the raw map, and undo each of eight moves" caption="Every displayed summand has the same destination/source addresses after alignment. Add corresponding entries of all eight complete matrices, then divide by 8. The route shows actual default readings, separate from the all-input matrix construction."><div className="aa-state-grid">{squareGroup.map((g) => {
    const x = [1, 2, 4, 8], after = moveSquareData(g, x), mapped = applyMatrix(rawSquareWeights, after), undo = moveSquareData(inverseSquare(g), mapped), term = matrixProduct(matrixProduct(permutationMatrix(inverseSquare(g)), rawSquareWeights), permutationMatrix(g));
    return <Panel key={g} title={`Summand g=${names[g]}`}><Route states={[x, after, mapped, undo]} moves={[`P${names[g]}`, "W", `P${names[g]}\u207B\xB9`]} label={`Complete aligned contribution for ${names[g]}`} /><Matrix values={term} label={`P${names[g]}\u207B\xB9 W P${names[g]}; all sixteen aligned entries`} /></Panel>;
  })}</div><Matrix values={averageSquareMap(rawSquareWeights)} label="Entrywise sum divided by 8" /></Figure>;
}
function AveragingReindexFigure() {
  const h = 4, tied = equivarianceState().matrix;
  return <Figure job="G48" title="Right multiplication permutes the full eight-index sum" caption="For h=s, each g points to gh, with every target reached once. Conjugation by Pₕ therefore reorders the same eight summands. A tied fixed point has identical aligned contributions, so averaging it again leaves it unchanged."><MapRows inputs={names} outputs={squareGroup.map((g) => names[composeSquare(g, h)])} label="Complete bijection g→gs" inputName="Old summand index g" outputName="New summand index gs" /><Table label="Actual reindexing in every position" headers={["g", "gh", "h\u207B\xB9g\u207B\xB9", "(gh)\u207B\xB9"]} rows={squareGroup.map((g) => [names[g], names[composeSquare(g, h)], names[composeSquare(inverseSquare(h), inverseSquare(g))], names[inverseSquare(composeSquare(g, h))]])} /><Compare><Panel title="Original tied fixed point"><Matrix values={tied} label="Tied W" /></Panel><Panel title="Its average is the same fixed point"><Matrix values={averageSquareMap(tied)} label="Average of tied W" /></Panel></Compare></Figure>;
}
const subtract = (A, B) => A.map((row, i) => row.map((value, j) => value - B[i][j]));
const inner = (A, B) => A.reduce((sum, row, i) => sum + row.reduce((s, value, j) => s + value * B[i][j], 0), 0);
function FrobeniusProjectionFigure() {
  const A = averageSquareMap(rawSquareWeights), T = equivarianceState().matrix, R = subtract(rawSquareWeights, A), D = subtract(T, A), r = Math.sqrt(inner(R, R)), d = Math.sqrt(inner(D, D));
  return <Figure job="G49" title="Squared-entry distance decomposes into two perpendicular parts" caption="The actual entrywise residual W−A is perpendicular to every tied direction, including T−A. This orthogonal 2D slice represents Frobenius matrix distance, not sensor voltage. Its legs have lengths computed from all sixteen entries."><Canvas label="True Frobenius-distance triangle in an orthogonal slice" height={250}>{({ width }) => {
    const scale = Math.min((width - 36) / d, 180 / r), x = 18, y = 218, ax = x + d * scale, wy = y - r * scale;
    return <><line className="aa-axis" x1={x} x2={width - 12} y1={y} y2={y} /><path d={`M${ax},${y}H${x}V${wy}Z`} className="aa-stroke gold" /><path d={`M${x + 10},${y}v-10h-10`} className="aa-stroke rose" /><Text x={x + 8} y={y + 22}>A</Text><Text x={ax} y={y + 22}>T</Text><Text x={x + 12} y={wy - 10}>W</Text></>;
  }}</Canvas><Table label="Exact squared distances and orthogonality" headers={["Quantity", "Squared-entry value"]} rows={[["\u2016W\u2212A\u2016\xB2", inner(R, R)], ["\u2016T\u2212A\u2016\xB2", inner(D, D)], ["\u27E8W\u2212A,T\u2212A\u27E9", inner(R, D)], ["\u2016W\u2212T\u2016\xB2", inner(subtract(rawSquareWeights, T), subtract(rawSquareWeights, T))]]} /><Compare><Panel title="Actual residual W−A"><Matrix values={R} label="All sixteen residual entries" /></Panel><Panel title="Actual tied direction T−A"><Matrix values={D} label="All sixteen tied direction entries" /></Panel></Compare></Figure>;
}
function CompleteSensorAuditFigure() {
  const raw = equivarianceState([1, 2, 4, 8], "raw", 4), avg = equivarianceState([1, 2, 4, 8], "averaged", 4);
  return <Figure job="G50" title="Complete before-and-after audit of the same raw operator" caption="The D4 average has self 17/2, neighbor 35/4, opposite 33/4. It gives (129,507/4,519/4,513/4) V and mean 2055/16 V. The matrix defect changes from 14 to 0; the larger output scale reflects these historical weights and is not a calibration recommendation."><Compare><Panel title="Original raw map"><Matrix values={raw.matrix} label="Original sixteen weights" /><Square values={raw.mapped} /><p>All-input matrix defect: {raw.allInputDefect}</p></Panel><Panel title="D4-aligned average"><Matrix values={avg.matrix} label="Averaged sixteen weights" /><Square values={avg.mapped} /><p>All-input matrix defect: {avg.allInputDefect}; pooled output {num(avg.poolBefore)} V</p></Panel></Compare><Products values={avg.mapped} weights={[0.25, 0.25, 0.25, 0.25]} label="Actual four terms of the invariant mean" /></Figure>;
}
function TwoOperationRingFigure() {
  const I = [[1, 0], [0, 1]], Z = [[0, 0], [0, 0]];
  return <Figure job="G51" title="One set carries two different operations and identities" caption="Integers and 2×2 matrices each support addition and multiplication. The additive identity is zero; the multiplicative identity is one or I. Nonzero matrix elements need not be invertible, and matrix multiplication need not commute."><Compare><Panel title="Integer addition and multiplication"><MapRows inputs={["2+3", "3+2", "2\xD73", "3\xD72"]} outputs={[5, 5, 6, 6]} label="Concrete two-operation routes on integers" /></Panel><Panel title="Different matrix identities"><Matrix values={Z} label="Additive zero 0" /><Matrix values={I} label="Multiplicative identity I" /></Panel></Compare><Table label="Requirements of the stated unital-ring convention" headers={["Operation", "Identity", "Requirement"]} rows={[["Addition", "0", "Abelian group"], ["Multiplication", "1", "Associative; inversion not required"], ["Both", "Distinct roles", "Two distributive laws"], ["Field", "0\u22601", "Every nonzero scalar has an inverse"]]} /></Figure>;
}
function DistributiveExpansionFigure() {
  const A = [[0, 1], [0, 0]], B = [[0, 0], [1, 0]], C = [[1, 0], [0, 1]], sum = (a, b) => a.map((row, i) => row.map((v, j) => v + b[i][j]));
  return <Figure job="G52" title="Distribute without exchanging the order of matrix factors" caption="A(B+I)=AB+AI, but AB and BA have different diagonal entries. The additive-zero argument cancels a0 from a0=a0+a0; it never divides by zero."><Compare><Panel title="Original operands"><Matrix values={A} label="A" /><Matrix values={B} label="B" /></Panel><Panel title="Product AB: B acts first"><Matrix values={matrixProduct(A, B)} label="AB" /></Panel><Panel title="Reversed order"><Matrix values={matrixProduct(B, A)} label="BA" /></Panel></Compare><Compare><Panel title="One product over the sum"><Matrix values={sum(B, C)} label="B+I" /><Matrix values={matrixProduct(A, sum(B, C))} label="A(B+I)" /></Panel><Panel title="Two complete contributions"><Matrix values={matrixProduct(A, B)} label="AB contribution" /><Matrix values={A} label="AI contribution" /><Matrix values={sum(matrixProduct(A, B), A)} label="AB+AI" /></Panel></Compare><Products weights={[3, 3]} values={[2, 4]} unit="scalar units" label="Scalar distributivity: 3·2+3·4=3·6" /></Figure>;
}
function ResidueRepresentativesFigure() {
  return <Figure job="G53" title="Replacing representatives preserves both output residues" caption="Modulo 6, replace a=2 by 8 and b=3 by 9. Sums 5 and 17 differ by 12; products 6 and 72 differ by 66. Both differences are actual multiples of 6, so each operation reaches the same residue class."><MapRows inputs={[-4, 2, 8, -3, 3, 9]} outputs={[2, 2, 2, 3, 3, 3]} label="Distinct integer representatives reach the same two residue classes" /><Compare><Panel title="Addition representatives"><MapRows inputs={["2+3", "8+9"]} outputs={[5, 5]} label="Both sum residues modulo 6" /></Panel><Panel title="Product representatives"><MapRows inputs={["2\xD73", "8\xD79"]} outputs={[0, 0]} label="Both product residues modulo 6" /></Panel></Compare><Table label="Whole integer changes before reduction" headers={["Operation", "Old integer", "New integer", "Difference", "Multiple of 6"]} rows={[["Addition", 5, 17, 12, 2], ["Multiplication", 6, 72, 66, 11]]} /></Figure>;
}
function UnitsAndZeroDivisorsFigure() {
  return <Figure job="G54" title="A nonunit merges inputs; a unit permutes them" caption="Multiplication by 2 modulo 6 merges 0 with 3 and annihilates the nonzero element 3. Multiplication by 5 is a permutation; applying it twice recovers every input because 5²=1 modulo 6."><Compare>{[2, 5].map((a) => <Panel key={a} title={`Multiply by ${a} modulo 6`}><MapRows inputs={[0, 1, 2, 3, 4, 5]} outputs={modularState(6, a, 4).outputs} label={`Complete multiplication-by-${a} map`} /></Panel>)}</Compare><Table label="Exact inverse or zero-divisor witness" headers={["Element", "Witness", "Product modulo 6", "Meaning"]} rows={[[2, 3, 0, "Nonzero partner annihilated"], [5, 5, 1, "Two-sided multiplicative inverse"]]} /></Figure>;
}
function ModularDivisionFigure() {
  return <Figure job="G55" title="Read every preimage instead of deleting solutions by division" caption="For 2x=4, the solution is 2 modulo 5; 2 or 5 modulo 6; 2 or 6 modulo 8. Multiplication by 3 modulo 8 has inverse 3 and gives the unique solution 4. Full arrows reveal the nonunit fibers."><Compare>{[5, 6, 8].map((m) => <Panel key={m} title={`2x=4 modulo ${m}`}><MapRows inputs={Array.from({ length: m }, (_, i) => i)} outputs={modularState(m, 2, 4).outputs} label={`Every residue under multiplication by 2 modulo ${m}`} /><p>Exact preimages of 4: {modularState(m, 2, 4).solutions.join(", ")}</p></Panel>)}</Compare><Panel title="3x=4 modulo 8"><MapRows inputs={Array.from({ length: 8 }, (_, i) => i)} outputs={modularState(8, 3, 4).outputs} label="Invertible multiplication by 3 modulo 8" /><p>Inverse 3; solution x=4.</p></Panel></Figure>;
}
function BezoutBackSubstitutionFigure() {
  return <Figure job="G56" title="The remainders yield an explicit inverse" caption="Cut 8 into 3+3+2, then 3 into 2+1. Back substitution gives 1=3−(8−2·3)=3·3−8, so 3 is its own inverse modulo 8. The noncoprime route 6=2·3 ends at gcd 3 and cannot produce 1."><Canvas label="Common-scale Euclidean remainder segments" height={210}>{({ width }) => {
    const scale = (width - 30) / 8;
    return <>{[[3, 3, 2], [2, 1], [3, 3]].map((pieces, row) => {
      let used = 0;
      return <g key={row}>{pieces.map((value, i) => {
        const x = 15 + used * scale;
        used += value;
        return <g key={i}><rect x={x} y={30 + row * 58} width={value * scale} height={14} className={`aa-stroke ${["blue", "gold", "rose"][i]}`} /><Text x={x + value * scale / 2} y={67 + row * 58}>{value}</Text></g>;
      })}</g>;
    })}</>;
  }}</Canvas><Table label="Quotients, remainders and complete back substitution" headers={["Step", "Equation", "Meaning"]} rows={[[1, "8=2\xB73+2", "Remainder 2"], [2, "3=1\xB72+1", "Remainder 1"], [3, "1=3\u22122", "Substitute remainder 2"], [4, "1=3\xB73\u22128", "B\xE9zout coefficients 3,\u22121"], [5, "6=2\xB73+0", "Noncoprime gcd 3; no inverse"]]} /></Figure>;
}
function PrimeFieldBoundaryFigure() {
  return <Figure job="G57" title="All nonzero residues modulo 5 have inverses" caption="The complete inverse list is 1↔1, 2↔3, 3↔2, 4↔4 modulo 5. Modulo 4 the nonzero 2 squares to 0. A field of four elements requires a different construction; these integer residue operations do not make one."><Compare><Panel title="All nonzero units modulo 5"><MapRows inputs={[1, 2, 3, 4]} outputs={[1, 3, 2, 4]} label="The complete inverse map modulo 5" /><Table label="All four inverse witnesses" headers={["a", "a\u207B\xB9", "Product modulo 5"]} rows={[1, 2, 3, 4].map((a, i) => [a, [1, 3, 2, 4][i], 1])} /></Panel><Panel title="A nonzero zero divisor modulo 4"><MapRows inputs={[0, 1, 2, 3]} outputs={[0, 2, 0, 2]} label="Multiplication by 2 modulo 4" /><p>2·2=0 with both factors nonzero.</p></Panel></Compare></Figure>;
}
function SymPyConventionFigure() {
  return <Figure job="G58" title="Complete arrays make the library's product order explicit" caption="Both permutations have size 4. SymPy's h*g implements the lesson's gh: apply h, then g. The complete generated set has eight moves; vertex orbit size 4 and vertex stabilizer size 2 refer to vertices, not coloring states."><Table label="The entire generated permutation set" headers={["Lesson move", "Images of 0,1,2,3"]} rows={squareGroup.map((g) => [names[g], vector(squarePermutation(g))])} /><Compare><Panel title="Lesson rs; SymPy s*r"><Route states={path(letters, [4, 1])} moves={["s", "r"]} tracked={1} label="Vertex 1 follows 1→3→0" /></Panel><Panel title="Lesson sr; SymPy r*s"><Route states={path(letters, [1, 4])} moves={["r", "s"]} tracked={1} label="Vertex 1 follows 1→2→2" /></Panel></Compare><p>r=[1,2,3,0], s=[0,3,2,1]; group order 8, vertex orbit {"{0,1,2,3}"}, vertex-0 stabilizer {"{e,s}"}.</p></Figure>;
}
function HiddenDefectBasisFigure() {
  return <Figure job="G59" title="A constant input hides the defect that a basis input exposes" caption="The directed shift and reflection agree on a constant input but fail on (1,2,4,8) V. An addressed basis input exposes a nonzero commutator column; checking all four columns certifies the full operator identity.">{[[1, 1, 1, 1], [1, 2, 4, 8], [1, 0, 0, 0]].map((x, i) => {
    const state = equivarianceState(x, "shift", 4);
    return <Panel key={i} title={`${["Constant input", "Changed task-F input", "Basis input e0"][i]}: input defect ${state.inputSpecificDefect} V`}><Compare><Panel title="s then r"><Route states={[x, state.transformedInput, state.transformThenMap]} moves={["s", "r"]} label={`First full route on input ${i}`} /></Panel><Panel title="r then s"><Route states={[x, state.mapped, state.mapThenTransform]} moves={["r", "s"]} label={`Second full route on input ${i}`} /></Panel></Compare></Panel>;
  })}<Matrix values={equivarianceState([1, 0, 0, 0], "shift", 4).commutators[4].residual} label="All four dimensionless basis-witness columns" /></Figure>;
}
function ContinuousRotationFigure() {
  const angle = Math.PI / 3, phi = Math.PI / 4, point = (t) => [Math.cos(t), Math.sin(t)], values = [point(0), point(angle), point(angle + phi)];
  return <Figure job="G60" title="Two continuous turns reach the same summed-angle endpoint" caption="A 60° turn followed by 45° reaches 105°, as does one summed-angle turn. Angles are identified modulo a full turn. The entire circle of possible moves has extra topology and smoothness beyond the finite four-rotation group."><Canvas label="True unit-circle endpoints at 0°,60°,105°" height={290}>{({ width }) => {
    const r = Math.min((width - 32) / 2, 105), cx = width / 2, cy = 145;
    return <><circle cx={cx} cy={cy} r={r} className="aa-outline" /><line x1={cx - r - 8} x2={cx + r + 8} y1={cy} y2={cy} className="aa-axis" /><line x1={cx} x2={cx} y1={cy - r - 8} y2={cy + r + 8} className="aa-axis" />{values.map((value, i) => <Arrow key={i} x1={cx} y1={cy} x2={cx + value[0] * r} y2={cy - value[1] * r} tone={["blue", "gold", "rose"][i]} label={`${[0, 60, 105][i]} degrees; endpoint ${vector(value)}`} />)}<path d={`M${cx + r * 0.7},${cy}A${r * 0.7},${r * 0.7} 0 0 0 ${cx + r * 0.7 * Math.cos(angle)},${cy - r * 0.7 * Math.sin(angle)}`} className="aa-stroke gold" /><path d={`M${cx + r * 0.85 * Math.cos(angle)},${cy - r * 0.85 * Math.sin(angle)}A${r * 0.85},${r * 0.85} 0 0 0 ${cx + r * 0.85 * Math.cos(angle + phi)},${cy - r * 0.85 * Math.sin(angle + phi)}`} className="aa-stroke rose" /><Text x={cx - 10} y={cy + 22}>0</Text></>;
  }}</Canvas><Table label="Addressed endpoints and turns" headers={["Stage", "Angle degrees", "Endpoint"]} rows={[["Initial blue", 0, vector(values[0])], ["After \u03B8 gold", 60, vector(values[1])], ["After \u03C6 rose", 105, vector(values[2])]]} /><p>θ=π/3 rad, φ=π/4 rad; θ+φ=7π/12 rad.</p></Figure>;
}
export {
  ActionInputsFigure,
  ActionLawFigure,
  AllInputMatrixFigure,
  AssociativePathFigure,
  AveragingReindexFigure,
  BezoutBackSubstitutionFigure,
  BinaryColoringClassesFigure,
  BurnsideDoubleCountFigure,
  CancellationFigure,
  ClosedOperationFigure,
  CompleteSensorAuditFigure,
  ConjugateSubgroupFigure,
  ContinuousRotationFigure,
  CosetOrbitBijectionFigure,
  CosetPartitionProofFigure,
  CycleColorConstraintsFigure,
  DataPullbackFigure,
  DistributiveExpansionFigure,
  EightAlignedAveragesFigure,
  EightSquareMapsFigure,
  EncodedSquareRuleFigure,
  FailedCosetMultiplicationFigure,
  FailedGroupContractsFigure,
  FiniteLagrangeFigure,
  FirstIsomorphismFigure,
  FourOrbitExamplesFigure,
  FrobeniusProjectionFigure,
  GeneratedRotationFigure,
  GeometryPreservationFigure,
  GroupActionFigure,
  HiddenDefectBasisFigure,
  HomomorphismSquareFigure,
  IdentityAndInverseFigure,
  InvariantEquivariantRoutesFigure,
  InverseWordFigure,
  KernelImageFigure,
  KernelVersusStabilizerFigure,
  LeftCosetFigure,
  ModularDivisionFigure,
  NamedColorsFigure,
  OrderAndIsomorphismFigure,
  OrientationQuotientFigure,
  PairOrbitWeightsFigure,
  PointwiseNonlinearityFigure,
  PrimeFieldBoundaryFigure,
  RepresentativeIndependenceFigure,
  ResidueRepresentativesFigure,
  RotationVersusSquareWeightsFigure,
  SquareLayersFigure,
  StabilizerFigure,
  SubgroupTestFigure,
  SymPyConventionFigure,
  TernaryChiralityFigure,
  TwoOperationRingFigure,
  TwoRepresentationsFigure,
  UnitsAndZeroDivisorsFigure
};
