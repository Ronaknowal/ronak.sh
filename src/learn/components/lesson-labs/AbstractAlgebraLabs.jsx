import { useState } from "react";
import { FlowLab } from "./LessonFlow.jsx";
import { squareGroup, rotationGroup, compositionState, orbitState, fixedColoringCount, permutationCycles, cosetProductState, equivarianceState, parseSensorReadings, vertexImage } from "../../data/abstract-algebra-models.js";
import { Square, Panel, Compare, Route, Table, Matrix, PermutationWires, Products, Blocks, States, names, vector, num } from "./AbstractAlgebraDrawings.jsx";
import "./abstract-algebra-figures.css";
function ElementSelect({ label, value, onChange, group = squareGroup }) {
  return <label>{label}<select aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}>{group.map((g) => <option key={g} value={g}>{names[g]}</option>)}</select></label>;
}
function Readouts({ rows }) {
  return <dl className="aa-readouts" aria-live="polite">{rows.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>;
}
function Reset({ onClick }) {
  return <div className="aa-buttons"><button type="button" onClick={onClick}>Reset</button></div>;
}
function SquareCompositionLab() {
  const [g, setG] = useState(1), [h, setH] = useState(4), [vertex, setVertex] = useState(1), [stage, setStage] = useState(2);
  const state = compositionState(g, h, vertex);
  const reset = () => {
    setG(1);
    setH(4);
    setVertex(1);
    setStage(2);
  };
  return <FlowLab id="algebra-composition" label="Follow both orders of a square move">
    <Compare><Panel title="h, then g"><Route states={state.firstStates} moves={[names[h], names[g]]} tracked={state.firstRoute} stage={stage} label="All three first-order states" /></Panel><Panel title="g, then h"><Route states={state.secondStates} moves={[names[g], names[h]]} tracked={state.secondRoute} stage={stage} label="All three reverse-order states" /></Panel></Compare>
    <div className="aa-controls"><ElementSelect label="Outer move g" value={g} onChange={setG} /><ElementSelect label="Inner move h" value={h} onChange={setH} /><label>Tracked position<select aria-label="Tracked position" value={vertex} onChange={(e) => setVertex(Number(e.target.value))}>{[0, 1, 2, 3].map((i) => <option key={i} value={i}>{i}</option>)}</select></label></div>
    <div className="aa-buttons"><button type="button" disabled={stage === 0} onClick={() => setStage(stage - 1)}>Previous stage</button><button type="button" disabled={stage === 2} onClick={() => setStage(stage + 1)}>Next stage</button><button type="button" onClick={reset}>Reset</button></div>
    <Readouts rows={[["Highlighted stage", `${stage} of 2`], ["gh: h then g", names[state.product]], ["hg: g then h", names[state.reversed]], ["(gh)\u207B\xB9", names[state.inverse]], ["Tracked first route", state.firstRoute.join(" \u2192 ")], ["Tracked reverse-order route", state.secondRoute.join(" \u2192 ")]]} />
    <p>Each white outline tracks the same attached object. Changing stage highlights a state; all six complete states stay visible.</p>
    <Table label="Complete row-after-column square-group table" headers={["Outer g / inner h", ...names]} rows={state.table.map((row, i) => [names[i], ...row.map((value) => names[value])])} cellClass={(value, i, j) => i === g && j === h + 1 ? "gold" : ""} />
  </FlowLab>;
}
function ColoringOrbitLab() {
  const [q, setQ] = useState(2), [colors, setColors] = useState([1, 0, 1, 0]), [rotationsOnly, setRotationsOnly] = useState(false), [g, setG] = useState(4);
  const state = orbitState(colors, rotationsOnly), count = fixedColoringCount(q, rotationsOnly), transformed = state.states.find((row) => row.transformations.includes(g));
  const changeQ = (value) => {
    setQ(value);
    setColors((old) => old.map((color) => color % value));
  };
  const changeGroup = (value) => {
    setRotationsOnly(value);
    if (value && g >= 4) setG(0);
  };
  const reset = () => {
    setQ(2);
    setColors([1, 0, 1, 0]);
    setRotationsOnly(false);
    setG(4);
  };
  return <FlowLab id="algebra-coloring" label="Paint an addressed configuration and inspect its orbit">
    <Compare><Panel title="Painted input"><Square values={colors} painted /></Panel><Panel title={`Apply ${names[g]}`}><Square values={transformed.colors} painted /><PermutationWires g={g} values={colors} label={`Every cycle arrow in ${names[g]}`} /><p>Cycles: {permutationCycles(g).map((cycle) => `(${cycle.join(" ")})`).join(" ")}. Fixed coloring requires one color per cycle.</p></Panel></Compare>
    <div className="aa-controls"><label>Named colors<select aria-label="Named colors" value={q} onChange={(e) => changeQ(Number(e.target.value))}><option value={2}>2</option><option value={3}>3</option></select></label><label>Allowed group<select aria-label="Allowed group" value={rotationsOnly ? "C4" : "D4"} onChange={(e) => changeGroup(e.target.value === "C4")}><option>D4</option><option>C4</option></select></label><ElementSelect label="Inspected move" value={g} group={state.group} onChange={setG} />{colors.map((value, i) => <label key={i}>Paint position {i}<select aria-label={`Paint position ${i}`} value={value} onChange={(e) => setColors((old) => old.map((color, j) => j === i ? Number(e.target.value) : color))}>{Array.from({ length: q }, (_, c) => <option key={c} value={c}>Color {c}</option>)}</select></label>)}</div>
    <div className="aa-buttons"><button type="button" onClick={() => setColors([1, 1, 0, 0])}>Adjacent marks</button><button type="button" onClick={() => setColors([0, 0, 0, 0])}>Constant state</button><button type="button" onClick={() => {
    setQ(3);
    setColors([0, 0, 1, 2]);
  }}>Ternary state</button><button type="button" onClick={reset}>Reset</button></div>
    <p>Switching to two colors reduces existing indices modulo 2. Switching to C4 replaces an inspected reflection by e. Color names stay fixed.</p>
    <Readouts rows={[["Selected orbit size", state.orbitSize], ["Selected stabilizer size", state.stabilizer.length], ["Group size", state.group.length], ["All possible addressed colorings", count.totalColorings], ["All-coloring class count", count.orbitCount]]} />
    <Panel title="Complete selected orbit"><States states={state.states.map((row) => row.colors)} /></Panel>
    <p>Moves fixing this state: {state.stabilizer.map((value) => names[value]).join(", ")}.</p>
    <Table label="All-coloring Burnside tally, distinct from this state's orbit" headers={["Move", "Cycles", "Fixed addressed colorings"]} rows={count.rows.map((row) => [names[row.g], row.cycles.map((cycle) => `(${cycle.join(" ")})`).join(" "), row.fixed])} />
    <p>Fixed-pair sum {count.numerator} ÷ group size {state.group.length} = {count.orbitCount} classes.</p>
  </FlowLab>;
}
function CosetProductLab() {
  const [normal, setNormal] = useState(false), [choice, setChoice] = useState(0), state = cosetProductState(normal, choice);
  const reset = () => {
    setNormal(false);
    setChoice(0);
  };
  const outputIndex = state.cosets.findIndex((block) => block.members.includes(state.product));
  const letters = ["A", "B", "C", "D"];
  return <FlowLab id="algebra-coset-product" label="Test the product of whole cosets">
    <Blocks blocks={[state.subgroup]} label="Whole unchanged first input block H" />
    <Compare><Panel title="Right r, then chosen left representative"><Route states={compositionState(state.representative, 1, 0).firstStates} moves={["r", names[state.representative]]} label="Complete product route" /></Panel><Panel title="Baseline er=r"><Route states={[letters, compositionState(0, 1, 0).firstStates[1], compositionState(0, 1, 0).firstStates[2]]} moves={["r", "e"]} label="Unchanged baseline route" /></Panel></Compare>
    <Blocks blocks={state.cosets.map((block) => block.members)} selected={outputIndex} label="Entire output partition; underline selects the reached block" />
    <div className="aa-controls"><label>Subgroup H<select aria-label="Subgroup H" value={normal ? "rotations" : "reflection"} onChange={(e) => {
    setNormal(e.target.value === "rotations");
    setChoice(0);
  }}><option value="reflection">Reflection {"{e,s}"}</option><option value="rotations">Rotations C4</option></select></label><label>Left representative in H<select aria-label="Left representative in H" value={choice} onChange={(e) => setChoice(Number(e.target.value))}>{state.subgroup.map((value, i) => <option key={value} value={i}>{names[value]}</option>)}</select></label></div><Reset onClick={reset} />
    <Readouts rows={[["Fixed right factor", "r"], ["Actual product", names[state.product]], ["Output members", state.output.map((value) => names[value]).join(", ")], ["Same block as er?", state.sameOutput ? "yes" : "no"]]} />
    <Table label="Every representative choice, with the same right factor r" headers={["Left representative", "Product", "Output block"]} rows={state.subgroup.map((value, i) => {
    const probe = cosetProductState(normal, i);
    return [names[value], names[probe.product], probe.output.map((g) => names[g]).join(", ")];
  })} />
    <p>Membership colors belong to the complete blocks. Selection underlines a block and does not change its members.</p>
  </FlowLab>;
}
function EquivarianceLab() {
  const [draft, setDraft] = useState("1,2,4,8"), [values, setValues] = useState([1, 2, 4, 8]), [error, setError] = useState(""), [mode, setMode] = useState("tied"), [g, setG] = useState(4), [weights, setWeights] = useState([2, 0.5, 0]);
  const state = equivarianceState(values, mode, g, weights);
  const edit = (text) => {
    setDraft(text);
    try {
      setValues(parseSensorReadings(text));
      setError("");
    } catch (problem) {
      setError(problem.message);
    }
  };
  const reset = () => {
    setDraft("1,2,4,8");
    setValues([1, 2, 4, 8]);
    setError("");
    setMode("tied");
    setG(4);
    setWeights([2, 0.5, 0]);
  };
  return <FlowLab id="algebra-equivariance" label="Compare complete sensor-processing routes">
    <Compare><Panel title={`Apply ${names[g]}, then map`}><Route states={[values, state.transformedInput, state.transformThenMap]} moves={[`P${names[g]}`, "W"]} label="All three transform-then-map states" /></Panel><Panel title={`Map, then apply ${names[g]}`}><Route states={[values, state.mapped, state.mapThenTransform]} moves={["W", `P${names[g]}`]} label="All three map-then-transform states" /></Panel></Compare>
    <Table label="Complete output differences at every position" headers={["Position", "Transform then map V", "Map then transform V", "Difference V"]} rows={state.difference.map((difference, i) => [i, state.transformThenMap[i], state.mapThenTransform[i], difference])} />
    <div className="aa-controls"><label>Four readings, V<input aria-label="Four readings, V" value={draft} onChange={(e) => edit(e.target.value)} aria-invalid={Boolean(error)} aria-describedby="algebra-reading-error" /></label><label>Processing rule<select aria-label="Processing rule" value={mode} onChange={(e) => setMode(e.target.value)}><option value="tied">Three tied coefficients</option><option value="raw">Raw weights</option><option value="rotations">C4 average</option><option value="averaged">D4 average</option><option value="shift">One-position shift</option></select></label><ElementSelect label="Applied move" value={g} onChange={setG} />{mode === "tied" && weights.map((value, i) => <label key={i}>{["Self", "Neighbor", "Opposite"][i]} coefficient <output>{num(value)}</output><input type="range" aria-label={`${["Self", "Neighbor", "Opposite"][i]} coefficient`} min={-4} max={4} step={0.25} value={value} onChange={(e) => setWeights((old) => old.map((weight, j) => j === i ? Number(e.target.value) : weight))} /></label>)}</div><Reset onClick={reset} />
    <p id="algebra-reading-error" className={error ? "aa-error" : ""} aria-live="polite">{error || "Enter four decimal multiples of 0.25 from \u221220 to 20 V. Valid edits update immediately."}{error && " The complete results retain the last valid readings."}</p>
    <Readouts rows={[["Input-specific output defect", `${num(state.inputSpecificDefect)} V`], ["All-input matrix defect", num(state.allInputDefect)], ["Mean before output transform", `${num(state.poolBefore)} V`], ["Mean after transform-then-map", `${num(state.poolAfter)} V`]]} />
    <Matrix values={state.matrix} label="Actual complete dimensionless W; tied controls apply in tied mode" />
    <div className="aa-state-grid">{state.matrix.map((row, i) => <Panel key={i} title={`Output destination ${i}`}><Products weights={row} values={values} label={`Every contribution to output ${i}`} /></Panel>)}</div>
    <Products values={state.mapped} weights={[0.25, 0.25, 0.25, 0.25]} label="Four actual contributions to the original output mean" />
    <Table label="All eight all-input commutator maxima" headers={["Move", "Largest |WPg\u2212PgW| entry"]} rows={state.commutators.map((row) => [names[row.g], row.maximum])} />
    <div className="aa-state-grid">{state.commutators.map((row) => <Panel key={row.g} title={`All-input test ${names[row.g]}`}><Matrix values={row.residual} label={`Entire WP${names[row.g]}\u2212P${names[row.g]}W`} /></Panel>)}</div>
  </FlowLab>;
}
export {
  ColoringOrbitLab,
  CosetProductLab,
  EquivarianceLab,
  SquareCompositionLab
};
