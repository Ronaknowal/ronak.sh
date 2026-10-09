import { inspectContraction, attentionFixtures, attentionRow, basisChange } from '../../data/einsum-models.js';
import iris from '../../data/einsum-recorded-data.json';
import { Figure, Panels, Panel, Scene, Arrow, Matrix, TensorSlabs, ProductJoin, ContractionDrawing, Plane, NumericTable, SignedAreas, X, W, transformX, f, pair, dot, mm, mv, transpose, sum } from './EinsumDrawings';
const A = [[1, 2], [3, 4]],
  B = [[5, 6], [7, 8]];
const nonsquareA = [[1, 2, 3], [-1, 0, 2]],
  nonsquareB = [[2, 1], [0, 4], [1, -1]];
const contraction = (expression, operands, cellIndex = 0) => <ContractionDrawing state={inspectContraction(expression, operands)} operands={operands} cellIndex={cellIndex} />;
export function AxisContractFigure() {
  return <Figure name="axis-contract" caption="Each original observation fiber keeps b,n. Only its d entries pair with one W column to produce a new f entry.">
    <TensorSlabs /><Panels><Matrix values={W} label="W[d,f]; four input features, two outputs" kind="right" selected={[[0, 0], [1, 0], [2, 0], [3, 0]]} /><Matrix values={transformX[1]} label="Y[1,n,f]; second experiment" selected={[[0, 0]]} /></Panels>
    <ProductJoin label="Y[1,0,0]: four addressed feature products" terms={X[1][0].map((a, d) => ({
      a,
      b: W[d][0],
      product: a * W[d][0],
      name: `d=${d}: X[1,0,${d}] with W[${d},0]`
    }))} />
  </Figure>;
}
export function OuterMatchingFigure() {
  return <Figure name="outer-matching" caption="Independent i,j choices make every pair. Matching both matrix labels instead keeps one joint cell choice; it does not sum a row against a column.">
    <Panels><Panel title="Outer: independent vector choices"><Scene label="All four edges in the outer product" width={320} height={260}>{[1, 2].map((x, i) => <g key={i}><circle className="ef-node left" cx={40} cy={70 + i * 130} r={23} /><text x={40} y={75 + i * 130} textAnchor="middle">{x}</text>{[3, 4].map((y, j) => <Arrow key={j} from={[65, 70 + i * 130]} to={[250, 70 + j * 130]} />)}</g>)}{[3, 4].map((y, j) => <g key={j}><circle className="ef-node right" cx={280} cy={70 + j * 130} r={23} /><text x={280} y={75 + j * 130} textAnchor="middle">{y}</text></g>)}<text x={25} y={23}>i: left vector</text><text x={210} y={23}>j: right vector</text></Scene><Matrix values={[[3, 4], [6, 8]]} label="i,j → all four products" /></Panel><Panel title="Matching-cell: shared i,j"><Panels><Matrix values={A} label="A[i,j]" /><Matrix values={B} label="B[i,j]" kind="right" /></Panels><Matrix values={[[5, 12], [21, 32]]} label="A[i,j] B[i,j]; each cell is one product" /></Panel></Panels>
  </Figure>;
}
export function RetainedProductsFigure() {
  const products = A.map(row => row.map((a, k) => B[k].map(b => a * b)));
  return <Figure name="retained-products" caption="Keeping k stores the product at each k separately. The two selected cells 6 and16 become22 only when k is later removed by addition."><TensorSlabs values={products} label="Products P[i,k,j]" axes={['i', 'k', 'j']} selected={[0, 0, 1]} /><ProductJoin label="Remove k only in the later sum" terms={[{
      a: 1,
      b: 6,
      product: 6,
      name: 'k=0; P[0,0,1]'
    }, {
      a: 2,
      b: 8,
      product: 16,
      name: 'k=1; P[0,1,1]'
    }]} /></Figure>;
}
export function DummyRenameFigure() {
  return <Figure name="dummy-renaming" caption="Renaming the internal choice k to r visits the same two addresses. Reusing a free label i instead ties it to the row and changes the operation."><Panels><Panel title="k=0,1; fixed i=0,j=1">{contraction('ik,kj->ij', [A, B], 1)}</Panel><Panel title="r=0,1; same addressed products">{contraction('ir,rj->ij', [A, B], 1)}</Panel><Panel title="i is fixed; tied input axes"><Matrix values={A} label="A[i,i]; row 0 selects only A[0,0]" selected={[[0, 0]]} /><ProductJoin label="Tied i at output(0,1)" terms={[{
          a: 1,
          b: 6,
          product: 6,
          name: 'A[0,0] B[0,1]'
        }]} /></Panel></Panels></Figure>;
}
export function DiagonalFigure() {
  return <Figure name="diagonal" caption="Equality of the two i positions selects only cells(0,0) and(1,1). Keeping i gives a vector; omitting it adds the selected values."><Panels><Matrix values={A} label="A[i,i]; diagonal equality" selected={[[0, 0], [1, 1]]} /><Matrix values={[1, 4]} label="ii→i; keep two choices" /><Panel title="ii→; omit and add"><ProductJoin label="Sum only the selected diagonal" terms={[{
          a: 1,
          b: 1,
          product: 1,
          name: 'i=0'
        }, {
          a: 4,
          b: 1,
          product: 4,
          name: 'i=1'
        }]} /></Panel></Panels></Figure>;
}
export function ColumnReductionFigure() {
  return <Figure name="column-reduction" caption="The omitted i choice visits every row. No local repeated label is needed to request reduction."><Matrix values={A} label="A[i,j]; both column sums" /><Panels>{[0, 1].map(j => <Panel key={j} title={`Keep j=${j}`}><ProductJoin label={`Column ${j} receives both rows`} terms={A.map((row, i) => ({
          a: row[j],
          b: 1,
          product: row[j],
          name: `i=${i}, j=${j}`
        }))} /></Panel>)}</Panels><Matrix values={[4, 6]} label="Output j; column totals" /></Figure>;
}
function AddressMoves({
  rows,
  columns,
  destination,
  label
}) {
  const entries = Array.from({
    length: rows
  }, (_, i) => Array.from({
    length: columns
  }, (_, j) => [i, j])).flat();
  return <Scene label={label} width={440} height={entries.length * 46 + 36}>{entries.map(([i, j], t) => <g key={t}><rect className="ef-tree-matrix left" x={15} y={12 + t * 46} width={135} height={34} /><text x={82} y={34 + t * 46} textAnchor="middle">source({i},{j})</text><Arrow from={[155, 29 + t * 46]} to={[282, 29 + t * 46]} /><rect className="ef-tree-matrix right" x={289} y={12 + t * 46} width={135} height={34} /><text x={356} y={34 + t * 46} textAnchor="middle">target{pair(destination(i, j))}</text></g>)}</Scene>;
}
export function PermutationFigure() {
  return <Figure name="permutation" caption="Every source cell moves to one transposed address. Unequal axis lengths show the change from2×3 to3×2; the values are neither multiplied nor added."><Panels><Matrix values={nonsquareA} label="Input i,j;2×3" /><Matrix values={transpose(nonsquareA)} label="Output j,i;3×2" kind="right" /></Panels><AddressMoves rows={2} columns={3} destination={(i, j) => [j, i]} label="All six source-to-target address links" /></Figure>;
}
export function ImplicitOrderFigure() {
  return <Figure name="implicit-order" caption="The input's first axis is called j and its second i. Alphabetically sorting surviving labels to i,j transposes this grid; explicitly keeping j,i preserves it."><Panels><Matrix values={A} label="Input j,i" /><Matrix values={transpose(A)} label="Implicit ji → sorted i,j" kind="right" /><Matrix values={A} label="Explicit ji→ji; input order retained" /></Panels><AddressMoves rows={2} columns={2} destination={(j, i) => [i, j]} label="Implicit output reorders surviving labels" /></Figure>;
}
export function ScratchLoopFigure() {
  return <Figure name="scratch-loop" caption="The output traversal fixes(1,1). The omitted k traversal fetches three distinct source pairs and accumulates−3. A singleton source axis would always fetch coordinate0.">{contraction('ik,kj->ij', [nonsquareA, nonsquareB], 3)}<Scene label="Output and omitted-index traversals on the actual cells" width={400} height={205}><path className="ef-reference" d="M20,35 H380 V85 H20 V135 H380" /><Arrow from={[360, 135]} to={[360, 177]} /><text x={20} y={23}>Output traversal:(0,0),(0,1),(1,0),(1,1)</text><text x={30} y={76}>At(1,1), reset the omitted choice k to0.</text><text x={30} y={127}>Fetch k=0, then1, then2; add each product.</text><text x={30} y={182}>Store−3 in a fresh output cell.</text></Scene></Figure>;
}
export function BatchPairFigure() {
  return <Figure name="batch-pairs" caption="Matching b joins the aligned case rows only. Separate b,c choices create all four comparisons, including two cross-case results."><Panels><Matrix values={[[1, 0], [0, 1]]} label="X; row identities case0,case1" /><Matrix values={[[2, 5], [7, 11]]} label="Y; same row identities" kind="right" /></Panels><Scene label="Aligned versus all-pairs row connections" width={400} height={280}>{[0, 1].map(i => <g key={i}><circle className="ef-node left" cx={55} cy={65 + 135 * i} r={26} /><text x={55} y={70 + 135 * i} textAnchor="middle">X{i}</text><circle className="ef-node right" cx={345} cy={65 + 135 * i} r={26} /><text x={345} y={70 + 135 * i} textAnchor="middle">Y{i}</text><Arrow from={[83, 65 + 135 * i]} to={[316, 65 + 135 * i]} /><Arrow from={[83, 65 + 135 * i]} to={[316, 65 + 135 * (1 - i)]} kind="right" dashed /></g>)}<text x={20} y={254}>Solid: paired b. Dashed: extra independent pairs.</text></Scene><Panels><Matrix values={[2, 11]} label="bi,bi→b; aligned only" /><Matrix values={[[2, 7], [5, 11]]} label="bi,ci→bc; all pairs" kind="right" /></Panels></Figure>;
}
export function SharedMapFigure() {
  const slabs = [[[1, 0], [0, 1]], [[1, 2], [0, 1]]],
    maps = [[[2, 0], [0, 1]], [[1, 0], [0, 3]]];
  return <Figure name="shared-map" caption="A per-batch map follows the same b choice as its observation slab. A map without b is reused for both batches; it does not combine batches.">{slabs.map((slab, b) => <Panel key={b} title={`Batch b=${b}`}><Panels><Matrix values={slab} label={`X[${b},i,k]`} /><Matrix values={maps[b]} label={`W[${b},k,j]; per-batch`} kind="right" /><Matrix values={mm(slab, maps[b])} label="Per-batch output" /><Matrix values={mm(slab, maps[0])} label="Output with common W=[[2,0],[0,1]]" kind="right" /></Panels></Panel>)}</Figure>;
}
export function SingletonFigure() {
  return <Figure name="singleton" caption="Both output b choices visit the singleton operand's source row0. Its feature entries still pair separately with the matching i positions."><Panels><Matrix values={[[2, 3]]} label="Singleton operand; b length1" /><Matrix values={[[1, 0], [0, 1]]} label="Other operand; b length2" kind="right" /></Panels><Scene label="Two target rows share source row0" width={340} height={230}><circle className="ef-node left" cx={65} cy={115} r={27} /><text x={65} y={120} textAnchor="middle">b=0</text>{[0, 1].map(b => <g key={b}><Arrow from={[95, 115]} to={[244, 55 + 125 * b]} /><circle className="ef-node right" cx={277} cy={55 + 125 * b} r={29} /><text x={277} y={60 + 125 * b} textAnchor="middle">b={b}</text></g>)}<text x={20} y={220}>Read[2,3] again; no extra source row exists.</text></Scene><Matrix values={[2, 3]} label="bi,bi→b; full output" /></Figure>;
}
export function LocalRepeatedAxisFigure() {
  return <Figure name="local-repeat" caption="Inside one operand, ii means the same coordinate on both axes and requires equal axis lengths. Cross-operand singleton reuse is a different rule."><Panels><Panel title="Local ii on a1×3 array is invalid"><Matrix values={[[2, 3, 4]]} label="First i length1; second i length3" /><Scene label="Local diagonal equality cannot visit all three second-axis choices" width={330} height={130}><path className="ef-reference" d="M35,20 L145,85 M145,20 L35,85" /><text x={165} y={38}>ii needs equal lengths.</text><text x={165} y={75}>1 and3 differ.</text></Scene></Panel><Panel title="Separate operands can reuse source0"><Matrix values={[[2, 3]]} label="bi; length1 batch" /><Matrix values={[[1, 0], [0, 1]]} label="bi; length2 batch" kind="right" /><Matrix values={[2, 3]} label="Admitted cross-operand result" /></Panel></Panels></Figure>;
}
const ellipsisX = [[[0, 1, 2]], [[3, 4, 5]]],
  ellipsisY = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]];
const ellipsisResult = ellipsisX.map(batch => ellipsisY.map(row => dot(batch[0], row)));
export function EllipsisFigure() {
  return <Figure name="ellipsis" caption="Leading groups(2,1) and(4) right-align to(2,1) and(1,4). Each target b,c reads one actual X[b,0,:] and Y[c,:] fiber."><Panels><Matrix values={ellipsisX.map(b => b[0])} label="X; leading axes2,1, then i=3" /><Matrix values={ellipsisY} label="Y; leading axis4, then i=3" kind="right" /><Matrix values={ellipsisResult} label="Retained ellipsis; full2×4 output" /></Panels><NumericTable label="All eight leading source-address pairings" headers={['Target b,c', 'X leading source', 'Y leading source', 'Dot result']} rows={ellipsisResult.flatMap((row, b) => row.map((value, c) => [pair([b, c]), pair([b, 0]), pair([c]), value]))} /></Figure>;
}
export function TorchEllipsisFigure() {
  return <Figure name="torch-ellipsis" caption="The retained2×4 result agrees across the two tested frameworks. Reducing those leading axes is a separate expression: Torch admits it; NumPy requires a later sum of the retained result."><Matrix values={ellipsisResult} label="Both frameworks:…i,…i→…" /><ProductJoin label="All eight retained cells merge to 346" terms={ellipsisResult.flat().map((x, i) => ({
      a: x,
      b: 1,
      product: x,
      name: `retained cell ${pair([Math.floor(i / 4), i % 4])}`
    }))} sumLabel="Torch reduced ellipsis; NumPy retained.sum()" /></Figure>;
}
export function MultiAxisFigure() {
  const AA = Array.from({
    length: 2
  }, (_, i) => Array.from({
    length: 3
  }, (_, j) => [6 * i + 2 * j, 6 * i + 2 * j + 1]));
  const BB = Array.from({
    length: 3
  }, (_, j) => Array.from({
    length: 2
  }, (_, i) => [4 * j + 2 * i - 3, 4 * j + 2 * i - 2]));
  const terms = AA.flatMap((slab, i) => slab.map((row, j) => ({
    a: row[1],
    b: BB[j][i][0],
    product: row[1] * BB[j][i][0],
    name: `A[${i},${j},1] × B[${j},${i},0]`
  })));
  return <Figure name="multi-axis" caption="The same i,j choices occur in reversed input-axis order. Matching their identities visits six pairs before storing one k,l output; swapping only axis positions would pair different cells."><Panels><TensorSlabs values={AA} label="A[i,j,k]" axes={['i', 'j', 'k']} selected={[1, 2, 1]} /><TensorSlabs values={BB} label="B[j,i,l]" axes={['j', 'i', 'l']} selected={[2, 1, 0]} /></Panels><ProductJoin label="k=1,l=0; six i,j products" terms={terms} /><Matrix values={[[110, 140], [122, 158]]} label="Output k,l; two surviving axes" selected={[[1, 0]]} /></Figure>;
}
export function UnfoldingFigure() {
  const nMode = Array.from({
    length: 3
  }, (_, n) => X.flatMap(slab => slab[n]));
  return <Figure name="unfolding" caption="These are two explicit bijections of all 24 addresses. For n-mode rows, the flattened column4b+d keeps the selected value14 at row0,column6."><TensorSlabs /><Panels><Matrix values={X.map(slab => slab.flat())} label="b-mode: rows b, columns4n+d" selected={[[1, 2]]} /><Matrix values={nMode} label="n-mode: rows n, columns4b+d" selected={[[0, 6]]} kind="right" /></Panels><NumericTable label="All 24 source addresses and both flattened targets" headers={['Source(b,n,d)', 'Value', 'b-mode(row,col)', 'n-mode(row,col)']} rows={X.flatMap((slab, b) => slab.flatMap((row, n) => row.map((value, d) => [pair([b, n, d]), value, pair([b, 4 * n + d]), pair([n, 4 * b + d])])))} /></Figure>;
}
export function ModeFiberFigure() {
  return <Figure name="mode-fibers" caption="Each of the six four-entry fibers crosses the same feature map. The highlighted fiber[12,13,14,15] becomes[56,−1]; the conventional mode matrix is the transposed orientation Wᵀ[f,d]."><Matrix values={W} label="W[d,f]; reused for every fiber" kind="right" /><Panels>{X.flatMap((slab, b) => slab.map((row, n) => <Panel key={`${b},${n}`} title={`Fiber(b=${b},n=${n})`}><Matrix values={row} label="Input d" selected={b === 1 && n === 0 ? row.map((_, d) => [0, d]) : []} /><Matrix values={transformX[b][n]} label="Output f" kind="right" /></Panel>))}</Panels></Figure>;
}
export function RankOneFigure() {
  const u = [1, 2],
    v = [3, -1],
    z = [2, 0, 4],
    tensor = u.map(a => v.map(b => z.map(c => a * b * c)));
  return <Figure name="rank-one" caption="One outer product of three nonzero whole vectors gives these proportional fibers. Zero components make zero entries; a zero whole vector would instead give the rank-zero tensor."><Panels><Matrix values={u} label="u; first choice" /><Matrix values={v} label="v; second choice" kind="right" /><Matrix values={z} label="z; third choice" /></Panels><TensorSlabs values={tensor} label="u[i]v[j]z[k]" axes={['i', 'j', 'k']} selected={[1, 0, 2]} /><NumericTable label="Four proportional fibers" headers={['i,j', 'Scale u[i]v[j]', 'Fiber = scale×z']} rows={u.flatMap((a, i) => v.map((b, j) => [pair([i, j]), a * b, pair(z.map(c => a * b * c))]))} /></Figure>;
}
export function CrossProductFigure() {
  return <Figure name="cross-products" caption="Each rectangle's area is the product magnitude; the displayed sign comes from the two offsets. The off-diagonal receives0+0+4, then division by2 gives 2."><SignedAreas terms={[[-2, 0], [0, -2], [2, 2]]} label="Selected covariance of features0,1" /><ProductJoin label="Three centered cross-products" terms={[{
      a: -2,
      b: 0,
      product: 0,
      name: 'row0'
    }, {
      a: 0,
      b: -2,
      product: 0,
      name: 'row1'
    }, {
      a: 2,
      b: 2,
      product: 4,
      name: 'row2'
    }]} sumLabel="Cross-product numerator (before division by 2)" /><Matrix values={[[4, 2], [2, 4]]} label="Sample covariance; all entries divided by2" selected={[[0, 1]]} /></Figure>;
}
export function GramPsdFigure() {
  return <Figure name="gram-psd" caption="The direction a=[1,−1] projects the centered rows to−2,2,0. Squaring removes signs and gives(4+4+0)/2=4, the same value as aᵀCa."><Matrix values={[[-2, 0], [0, -2], [2, 2]]} label="Centered rows Z[n,i]" /><ProductJoin label="Za; projection of each row, then squared" terms={[-2, 2, 0].map((a, n) => ({
      a,
      b: a,
      product: a * a,
      name: `row${n}; projection ${a}`
    }))} sumLabel="Squared-projection numerator (before division by 2)" /><Scene label="Nonnegative squared projection areas" width={320} height={210}>{[4, 4, 0].map((value, i) => <g key={i}><rect className="ef-area left" x={20 + 100 * i} y={35} width={Math.sqrt(value) * 30} height={Math.sqrt(value) * 30} /><text x={20 + 100 * i} y={135}>square {value}</text></g>)}<text x={20} y={190}>Positive divisor 2 preserves nonnegativity.</text></Scene></Figure>;
}
export function IrisRecordedFigure() {
  return <Figure name="iris-recorded" caption="Both scatterplots contain all 150 corrected recorded rows. The highlighted first plant contributes1.75278cm²; the covariance uses the sum of all 150 products divided by149."><Panels><Panel title="Recorded sepal length / petal length"><Plane label="All 150 recorded Iris sepal/petal lengths; cm" domain={[0, 8]} points={iris.rows.map((row, i) => ({
          value: [row[0], row[2]],
          selected: i === 0
        }))} xLabel="sepal length(cm)" yLabel="petal length(cm)" lines={[{
          points: [[iris.means[0], 0], [iris.means[0], 8]]
        }, {
          points: [[0, iris.means[2]], [8, iris.means[2]]]
        }]} /></Panel><Panel title="Same rows centered at the recorded means"><Plane label="All 150 centered Iris points; offsets in cm" domain={[-4, 4]} points={iris.centered.map((row, i) => ({
          value: [row[0], row[2]],
          selected: i === 0
        }))} xLabel="sepal offset(cm)" yLabel="petal offset(cm)" /></Panel></Panels><Matrix values={iris.covariance} label="Four-feature sample covariance(cm²)" columnLabels={['SL', 'SW', 'PL', 'PW']} rowLabels={['SL', 'SW', 'PL', 'PW']} selected={[[0, 2]]} cellWidth={96} /><NumericTable label="All 150 recorded rows and the selected centered product" headers={['Row', 'SL(cm)', 'SW(cm)', 'PL(cm)', 'PW(cm)', 'SL offset', 'PL offset', 'Offset product(cm²)']} tall rows={iris.rows.map((row, i) => [i, ...row, iris.centered[i][0], iris.centered[i][2], iris.centered[i][0] * iris.centered[i][2]])} /><p className="ef-readout">SL=sepal length, SW=sepal width, PL=petal length, PW=petal width. Full cross sum {f(iris.crossProductSum)}cm² /149 = {f(iris.sepalPetalCovariance)}cm². <a href="/learn-code/eigenvalues-eigenvectors/iris-corrected.csv">Exact CSV</a> · <a href="/learn-code/eigenvalues-eigenvectors/iris-provenance.json">Provenance and license</a>.</p></Figure>;
}
export function IrisUnitsFigure() {
  const scales = [1, 1, 10, 1],
    changed = iris.covariance.map((row, i) => row.map((x, j) => x * scales[i] * scales[j]));
  return <Figure name="iris-units" caption="A tenfold numerical petal-length unit change multiplies its row and column factors by10. The PL diagonal receives both factors, so its variance is100 times larger; every unrelated entry is unchanged."><Panels><Matrix values={iris.covariance} label="Original four-feature covariance" columnLabels={['SL', 'SW', 'PL', 'PW']} rowLabels={['SL', 'SW', 'PL', 'PW']} cellWidth={96} /><Matrix values={changed} label="PL numeric values×10; mixed numerical units" kind="right" columnLabels={['SL', 'SW', '10PL', 'PW']} rowLabels={['SL', 'SW', '10PL', 'PW']} cellWidth={105} /></Panels><Matrix values={scales.map(a => scales.map(b => a * b))} label="Entrywise unit factors; row factor×column factor" selected={[[2, 2]]} /></Figure>;
}
export function QueryKeyValueFigure() {
  const fixture = attentionFixtures[0],
    scores = fixture.queries.map(q => fixture.keys.map(k => dot(q, k) / Math.sqrt(2))),
    weights = scores.map(row => {
      const masses = row.map(s => Math.exp(s - Math.max(...row)));
      return masses.map(x => x / sum(masses));
    });
  return <Figure name="query-key-value" caption="Each query row compares its D features with every key row. Normalized weights over the S keys then multiply their F-entry values. Q and K share features; K and V share key identities."><Panels><Matrix values={fixture.queries} label="Q[t,d]; T=2,D=2" /><Matrix values={fixture.keys} label="K[s,d]; S=3,D=2" kind="right" /><Matrix values={fixture.values} label="V[s,f]; S=3,F=2" /><Matrix values={scores} label="QKᵀ/√D; scores[t,s], no mask" kind="right" /><Matrix values={mm(weights, fixture.values)} label="Normalized all-key context[t,f];2×2" /></Panels><Scene label="One query comparison and one weighted value retrieval" width={420} height={220}><circle className="ef-node left" cx={50} cy={55} r={25} /><text x={50} y={60} textAnchor="middle">q₀</text>{[0, 1, 2].map(s => <g key={s}><Arrow from={[79, 55]} to={[171, 45 + s * 63]} /><circle className="ef-node right" cx={201} cy={45 + s * 63} r={24} /><text x={201} y={50 + s * 63} textAnchor="middle">k{s}</text><Arrow from={[228, 45 + s * 63]} to={[307, 45 + s * 63]} kind="right" /><circle className="ef-node left" cx={338} cy={45 + s * 63} r={24} /><text x={338} y={50 + s * 63} textAnchor="middle">v{s}</text></g>)}<text x={12} y={214}>Compare q with k; weight the corresponding v.</text></Scene></Figure>;
}
export function AttentionScoreFigure() {
  return <Figure name="attention-scores" caption="For q=[1,0], the two feature products add to1,0,1 across the three keys. Dividing by√2 changes their scale without changing which feature addresses meet."><Panels>{attentionFixtures[0].keys.map((key, s) => <Panel key={s} title={`Key s=${s}`}><ProductJoin label={`q·k${s}; two feature products`} terms={key.map((b, d) => ({
          a: [1, 0][d],
          b,
          product: [1, 0][d] * b,
          name: `feature d=${d}`
        }))} /></Panel>)}</Panels><NumericTable label="Dot products and scaled scores" headers={['Key', 'Dot', 'Divide by√2']} rows={[[0, 1, 1 / Math.sqrt(2)], [1, 0, 0], [2, 1, 1 / Math.sqrt(2)]]} /></Figure>;
}
export function StableExponentialFigure() {
  const points = Array.from({
    length: 81
  }, (_, i) => {
    const x = -2 + i / 40;
    return [x, Math.exp(x)];
  });
  return <Figure name="stable-exponential" caption="Exp is positive and exp(0)=1. With only keys0 and2 allowed, subtracting their shared maximum leaves two zero scores, two unit masses and denominator 2; the blocked key has mass 0 by policy."><Plane label="Positive exponential on scores−2 through 0" domain={[[-2, 0], [0, 1]]} curves={[{
      points
    }]} points={[{
      value: [0, 1],
      selected: true
    }]} xLabel="score s" yLabel="mass exp(s)" /><NumericTable label="Allowed-only normalization on the default query" headers={['Key', 'Allowed', 'Score', 'Shifted', 'Mass', 'Weight']} rows={[[0, 'yes', 1 / Math.sqrt(2), 0, 1, .5], [1, 'no', 0, 'not evaluated', 0, 0], [2, 'yes', 1 / Math.sqrt(2), 0, 1, .5]]} /><ProductJoin label="Add allowed exponential masses" terms={[{
      a: 1,
      b: 1,
      product: 1,
      name: 'key0 mass'
    }, {
      a: 1,
      b: 1,
      product: 1,
      name: 'key2 mass'
    }]} sumLabel="denominator 2" /></Figure>;
}
export function NormalizedRetrievalFigure() {
  return <Figure name="normalized-retrieval" caption="Two allowed contributions join head to tail. Their weights sum to1, and the blocked value contributes zero. The endpoint[2,1] is a vector in value-feature space."><Plane label="Head-to-tail weighted value retrieval" domain={[[-1, 11], [-1, 7]]} vectors={[{
      to: [1, 0],
      label: 'key0:½[2,0]=[1,0]'
    }, {
      from: [1, 0],
      to: [2, 1],
      kind: 'right',
      label: 'key2:½[2,2]=[1,1]'
    }, {
      to: [2, 1],
      kind: 'result',
      dashed: true,
      label: 'context=[2,1]'
    }]} xLabel="value feature0" yLabel="value feature1" /><Matrix values={[2, 1]} label="Context; two retained value features" /></Figure>;
}
export function NonlinearOrderFigure() {
  const q = [1, 0],
    keys = attentionFixtures[0].keys,
    values = attentionFixtures[0].values,
    scale = Math.sqrt(2),
    scores = keys.map(k => dot(q, k) / scale),
    masses = scores.map(s => Math.exp(s - Math.max(...scores))),
    weights = masses.map(x => x / sum(masses));
  const raw = values[0].map((_, f) => sum(scores.map((s, k) => s * values[k][f]))),
    normalized = mv(transpose(values), weights);
  return <Figure name="nonlinear-order" caption="Both linear parenthesizations use the identical√D factor and agree. Row softmax changes the score coefficients before V is combined, so its output differs even with the same q,K,V and no mask."><Panels><Matrix values={[scores]} label="qKᵀ/√2; linear coefficients" /><Matrix values={[weights]} label="row softmax of those same scores" kind="right" /><Matrix values={values} label="Same V in every route" /></Panels><NumericTable label="Same inputs, different operations" headers={['Route', 'Output vector']} rows={[['(qKᵀ/√2)V', pair(raw)], ['q(KᵀV)/√2', pair(mv(transpose(mm(transpose(keys), values)), q).map(x => x / scale))], ['softmax(qKᵀ/√2)V', pair(normalized)]]} /></Figure>;
}
export function PlannerListFigure() {
  return <Figure name="planner-list" caption="Planner indices refer to the current list. Remove the selected inputs and append their product: left-first leaves[C,AB], so its next pair is cd,ac→ad; right-first leaves[A,BC]."><Panels>{[['Left-first', [['A:ab', 'B:bc', 'C:cd'], ['C:cd', 'AB:ac'], ['result:ad']], ['(0,1)', '(0,1)']], ['Right-first', [['A:ab', 'B:bc', 'C:cd'], ['A:ab', 'BC:bd'], ['result:ad']], ['(1,2)', '(0,1)']]].map(([title, lists, pairs]) => <Panel key={title} title={title}><Scene label={title + ' current operand-list evolution'} width={420} height={330}>{lists.map((list, t) => <g key={t}>{list.map((name, j) => <g key={j}><rect className={'ef-tree-matrix ' + (j ? 'right' : 'left')} x={18 + j * 132} y={22 + t * 113} width={120} height={49} /><text x={78 + j * 132} y={43 + t * 113} textAnchor="middle">index{j}</text><text x={78 + j * 132} y={62 + t * 113} textAnchor="middle">{name}</text></g>)}{t < 2 && <><Arrow from={[190, 77 + t * 113]} to={[190, 123 + t * 113]} /><text x={213} y={103 + t * 113}>pair{pairs[t]}</text></>}</g>)}</Scene></Panel>)}</Panels></Figure>;
}
export function EliminationFigure() {
  const a = [[1, 2], [0, 1]],
    b = [[2, 0], [1, 3]],
    c = [[1, 2], [4, 0]],
    ab = mm(a, b),
    result = mm(ab, c);
  return <Figure name="elimination" caption="This finite fixture first eliminates b into a2×2 temporary, then eliminates c. The four-index product is not stored; the two pair outputs are enough."><Panels><Matrix values={a} label="A[a,b]" /><Matrix values={b} label="B[b,c]" kind="right" /><Matrix values={ab} label="Temporary T[a,c]=Σb Aab Bbc" /><Matrix values={c} label="C[c,d]" kind="right" /><Matrix values={result} label="Final Σc Tac Ccd" /></Panels><ProductJoin label="First T[0,0]; b disappears" terms={[{
      a: 1,
      b: 2,
      product: 2,
      name: 'b=0'
    }, {
      a: 2,
      b: 1,
      product: 2,
      name: 'b=1'
    }]} /><ProductJoin label="Then result[0,0]; c disappears" terms={[{
      a: 4,
      b: 1,
      product: 4,
      name: 'c=0'
    }, {
      a: 6,
      b: 4,
      product: 24,
      name: 'c=1'
    }]} /></Figure>;
}
export function EnergyFigure() {
  const masses = [2, 3],
    velocities = [[[1, 0], [0, 2], [1, 1]], [[0, 2], [1, 0], [2, 0]]];
  return <Figure name="kinetic-energy" caption="In orthonormal Cartesian axes, each body's squared component sum gives speed squared. Multiply by½ its mass and add bodies while keeping time. The invented states give 7,5.5,8J."><Panels>{[0, 1, 2].map(t => <Panel key={t} title={`Time choice t=${t}`}><Plane label={`Two Cartesian velocity vectors at time ${t}`} domain={[-.5, 2.5]} vectors={masses.map((m, n) => ({
          to: velocities[n][t],
          kind: n ? 'right' : 'left',
          label: `body${n}; mass${m}kg, v=${pair(velocities[n][t])}m/s`
        }))} xLabel="vx(m/s)" yLabel="vy(m/s)" /><NumericTable label="Body contributions in joules" headers={['Body', '½m', 'vx²+vy²', 'Energy']} rows={masses.map((m, n) => [n, m / 2, dot(velocities[n][t], velocities[n][t]), m / 2 * dot(velocities[n][t], velocities[n][t])])} /></Panel>)}</Panels></Figure>;
}
export function MapBasisFigure() {
  const state = basisChange('shear', [3, 2]);
  return <Figure name="map-basis" caption="The active map changes the physical vector from[3,2] to[8,2]. The passive coordinate change represents each endpoint with a different list; A and A′ act on their corresponding coordinate lists."><Panels><Plane label="Physical map action; fixed old axes" domain={[-8.5, 8.5]} vectors={[{
        to: [3, 2],
        label: 'v=[3,2]'
      }, {
        to: [8, 2],
        kind: 'right',
        label: 'Av=[8,2]'
      }]} /><Matrix values={[[2, 1], [0, 1]]} label="A; columns in old coordinates" /><Matrix values={state.newMap} label="A′=S⁻¹AS; new coordinates" kind="right" /></Panels><NumericTable label="Each map action in its own coordinates" headers={['Representation', 'Input', 'Output']} rows={[['Old', '[3,2]', pair(state.mapped)], ['New', pair(state.coordinates), pair(state.mappedNew)]]} /><ProductJoin label="A′[1,2] output0; both new-coordinate contributions" terms={[{
      a: 2,
      b: 1,
      product: 2,
      name: 'column0 contribution'
    }, {
      a: 2,
      b: 2,
      product: 4,
      name: 'column1 contribution'
    }]} /></Figure>;
}
export function MetricContourFigure() {
  const circle = Array.from({
      length: 121
    }, (_, i) => [Math.cos(i * Math.PI / 60), Math.sin(i * Math.PI / 60)]),
    changed = circle.map(([x, y]) => [x - y, y]);
  return <Figure name="metric-contour" caption="The same physical unit circle is described by an ellipse in sheared coordinates. Every transformed point satisfies qᵀG′q=1, with G′=[[1,1],[1,2]]; the axes share the same numerical scale."><Panels><Plane label="Physical unit circle in orthonormal coordinates" domain={[-2, 2]} curves={[{
        points: circle
      }]} xLabel="old coordinate0" yLabel="old coordinate1" /><Plane label="Same unit contour in sheared coordinates" domain={[-2, 2]} curves={[{
        points: changed,
        kind: 'right'
      }]} xLabel="new coordinate0" yLabel="new coordinate1" /><Matrix values={[[1, 1], [1, 2]]} label="G′=SᵀS" /></Panels></Figure>;
}
export function SlotFactorsFigure() {
  const inv = [[1, -1], [0, 1]],
    S = [[1, 1], [0, 1]],
    old = [[-3, -2], [6, 4]],
    next = mm(mm(inv, old), transpose(inv));
  return <Figure name="slot-factors" caption="Each index position receives its own factor. Two vector-type slots in an outer product receive two S⁻¹ factors; a covector's lower components receive the S factor in their index sum. Array shape does not select a transformation law."><Panels><Matrix values={inv} label="Upper component factor S⁻¹" /><Matrix values={S} label="Lower component factor S" kind="right" /><Matrix values={old} label="Two-upper-slot outer T=u⊗v" /><Matrix values={next} label="T′=S⁻¹T S⁻ᵀ" kind="right" /></Panels><Scene label="Separate transformation factors on two tensor slots" width={400} height={210}><circle className="ef-node left" cx={65} cy={55} r={28} /><text x={65} y={60} textAnchor="middle">slot i</text><circle className="ef-node right" cx={65} cy={155} r={28} /><text x={65} y={160} textAnchor="middle">slot j</text><Arrow from={[95, 55]} to={[270, 55]} /><Arrow from={[95, 155]} to={[270, 155]} kind="right" /><rect className="ef-tree-matrix left" x={276} y={27} width={96} height={57} /><text x={324} y={60} textAnchor="middle">S⁻¹</text><rect className="ef-tree-matrix right" x={276} y={127} width={96} height={57} /><text x={324} y={160} textAnchor="middle">S⁻¹</text></Scene></Figure>;
}
export function ViewAliasFigure() {
  return <Figure name="view-alias" caption="The matrix and its diagonal view name the same underlying cells. A copied transpose names new storage; changing that copy leaves the source's9 unchanged."><Scene label="Two names share matrix cells; a copied name has its own cells" width={430} height={300}><text x={12} y={25}>A</text><text x={12} y={95}>diagonal view</text><Arrow from={[35, 35]} to={[206, 66]} /><Arrow from={[115, 101]} to={[206, 66]} kind="right" /><rect className="ef-tree-matrix left" x={217} y={40} width={175} height={90} /><text x={304} y={69} textAnchor="middle">same source cells</text><text x={304} y={102} textAnchor="middle">[[9,2],[3,4]]</text><text x={12} y={209}>copied transpose</text><Arrow from={[149, 215]} to={[207, 232]} kind="right" /><rect className="ef-tree-matrix right" x={217} y={184} width={175} height={90} /><text x={304} y={213} textAnchor="middle">fresh copied cells</text><text x={304} y={246} textAnchor="middle">[[-1,3],[2,4]]</text></Scene><Panels><Matrix values={[[9, 2], [3, 4]]} label="Source after view edit; A[0,0]=9" selected={[[0, 0]]} /><Matrix values={[[-1, 3], [2, 4]]} label="Copied transpose after independent edit" kind="right" selected={[[0, 0]]} /></Panels></Figure>;
}
export function ComplexPairFigure() {
  return <Figure name="complex-pair" caption="Conjugation reflects each complex point across the real axis. Multiplying without that reflection gives5−2i; multiplying each conjugate by its original gives the nonnegative squared magnitudes5+10=15."><Plane label="Complex inputs and conjugate reflections" domain={[-3.5, 3.5]} points={[{
      value: [1, 2],
      label: '1+2i',
      slot: [210, 59]
    }, {
      value: [3, -1],
      label: '3−i',
      slot: [303, 210]
    }, {
      value: [1, -2],
      kind: 'right',
      label: '1−2i',
      slot: [210, 267]
    }, {
      value: [3, 1],
      kind: 'right',
      label: '3+i',
      slot: [303, 109]
    }]} lines={[{
      points: [[1, 2], [1, -2]]
    }, {
      points: [[3, -1], [3, 1]]
    }]} xLabel="real part" yLabel="imaginary part" /><NumericTable label="Separate product recipes" headers={['Entry', 'z×z', 'conjugate(z)×z']} rows={[[0, '−3+4i', 5], [1, '8−6i', 10], ['Sum', '5−2i', 15]]} /></Figure>;
}
export function AccumulatorFigure() {
  const px = x => 35 + (x + 128) * 330 / 328;
  return <Figure name="accumulator" caption="Both100 inputs fit int8, whose largest value is127. Their mathematical total200 crosses the boundary and wraps by256 to−56; a wider accumulation retains200."><Scene label="Signed int8 range and a sum outside that range" width={420} height={235}><rect className="ef-area left" x={px(-128)} y={50} width={px(127) - px(-128)} height={50} /><line className="ef-axis" x1={px(-128)} x2={px(200)} y1={116} y2={116} />{[-128, -56, 0, 100, 127, 200].map((x, i) => <g key={x}><line className="ef-reference" x1={px(x)} x2={px(x)} y1={110} y2={126} /><text x={px(x)} y={i % 2 ? 157 : 139} textAnchor="middle">{x}</text></g>)}<Arrow from={[px(100), 43]} to={[px(200), 43]} /><Arrow from={[px(200), 190]} to={[px(-56), 190]} kind="right" /><text x={35} y={222}>int8:200−256=−56. int64 accumulator:200.</text></Scene></Figure>;
}
export function CheckMeaningFigure() {
  return <Figure name="check-meaning" caption="This nonsquare oracle names every matched k address and derives one exact output cell independently. Compatible shapes alone would not establish the intended data identities or units.">{contraction('ik,kj->ij', [nonsquareA, nonsquareB], 3)}<NumericTable label="Independent loops at output(1,1)" headers={['k', 'A[1,k]', 'B[k,1]', 'Product']} rows={[[0, -1, 1, -1], [1, 0, 4, 0], [2, 2, -1, -2], ['Sum', '', '', -3]]} /></Figure>;
}
