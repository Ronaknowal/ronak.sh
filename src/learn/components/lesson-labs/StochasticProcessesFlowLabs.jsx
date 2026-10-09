import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MARKOV_PRESETS, finiteProcessLaw, markovState, absorptionState, arrivalState, integratedRate, jumpClockState, brownianState, bridgeState, parseProcessNumber, splitCountLaw } from "../../data/stochastic-processes-models.js";
import { coalAuditState } from "../../data/stochastic-processes-flow-models.js";
import { Canvas, Label, Dot, Compare, Figure, Histories, MassFlow, Matrix, Plot, Table, Bars, ReserveGraph, fmt } from "./StochasticProcessesDrawings.jsx";
import { EventStream, CountStairs, CountMass, RateClock } from "./StochasticProcessesClockFigures.jsx";
import { BridgeDistribution, Squares } from "./StochasticProcessesBrownianFigures.jsx";
import { CoalCalendar } from "./StochasticProcessesAuditFigures.jsx";
const defaultMarkov = { a: 0.2, b: 0.3, initialSunny: 1, step: 1, selected: 0 };
const defaultAbsorption = { boundary: 4, start: 2, upward: 0.5, horizon: 4, selected: 2 };
const defaultAnalysis = { rates: [2.5, 2.5], interval: [0, 1], seed: 11, routing: "independent", splitProbability: 0.5 };
const defaultJump = { alpha: 0.5, beta: 2, initial: 0, horizon: 4, seed: 11, selected: 0 };
const defaultBrownian = { seed: 11, horizon: 1, drift: 0, scale: 1, level: 4, pathIndex: 0, interval: 0 };
const FlowContext = createContext(null);
function StochasticFlowProvider({ children }) {
  const [markov, setMarkov] = useState(defaultMarkov);
  const [absorption, setAbsorption] = useState(defaultAbsorption);
  const [analysis, setAnalysis] = useState(defaultAnalysis);
  const [jump, setJump] = useState(defaultJump);
  const [brownian, setBrownian] = useState(defaultBrownian);
  const value = { markov, setMarkov, absorption, setAbsorption, analysis, setAnalysis, jump, setJump, brownian, setBrownian };
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}
function useFlow() {
  const context = useContext(FlowContext);
  if (!context) throw new Error("Stochastic investigations need the topic provider.");
  return context;
}
function Lab({ title, children, ...props }) {
  return <div className="sp-lab flow-lab" role="group" aria-label={title} {...props}>{children}</div>;
}
function Select({ label, value, onChange, options, disabled = false }) {
  return <label>{label}<select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
function Slider({ label, value, onChange, min, max, step = 1 }) {
  return <label>{label}<input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /><output>{fmt(value)}</output></label>;
}
function DraftNumber({ label, value, minimum, maximum, onApply, resetKey = 0 }) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState("");
  useEffect(() => {
    setDraft(String(value));
    setError("");
  }, [value, resetKey]);
  function apply() {
    try {
      onApply(parseProcessNumber(draft, minimum, maximum, label));
      setError("");
    } catch (problem) {
      setError(problem.message);
    }
  }
  return <div><label>{label}<input type="text" inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
    if (event.key === "Enter") apply();
  }} /></label><button onClick={apply}>Apply {label}</button>{error && <p role="alert" className="sp-error">{error} The applied value remains {fmt(value)}.</p>}</div>;
}
function Reset({ onClick }) {
  return <button onClick={onClick}>Reset</button>;
}
function Stepper({ value, onChange, maximum = 60 }) {
  return <><button disabled={value === 0} onClick={() => onChange(value - 1)}>Previous</button><output>Step {value}</output><button disabled={value === maximum} onClick={() => onChange(value + 1)}>Next</button><Slider label="Step" min={0} max={maximum} value={value} onChange={onChange} /></>;
}
const intervals = [["0,1", "(0,1] minute"], ["1,2", "(1,2] minutes"], ["2,3", "(2,3] minutes"], ["0,3", "(0,3] minutes"]];
const intervalKey = (interval) => interval.join(",");
const parseInterval = (value) => value.split(",").map(Number);
function PathLawLab(props) {
  const [kind, setKind] = useState("fresh");
  const [selected, setSelected] = useState("0000");
  const law = finiteProcessLaw(kind);
  const selectedMass = law.paths.find((path) => path.values.join("") === selected)?.probability ?? 0;
  return <Lab {...props} title="Select a complete binary history">
    <Histories law={law} selected={selected} onSelect={setSelected} />
    <div className="sp-controls"><Select label="Process law" value={kind} onChange={setKind} options={[["fresh", "Fresh redraws"], ["frozen", "Frozen initial bit"], ["alternating", "Alternating bits"]]} /><Select label="Selected history" value={selected} onChange={setSelected} options={Array.from({ length: 16 }, (_, i) => {
    const bits = i.toString(2).padStart(4, "0");
    return [bits, bits];
  })} /><Reset onClick={() => {
    setKind("fresh");
    setSelected("0000");
  }} /></div>
    <Table title="Exact support and selected event" headers={["Quantity", "Probability / count"]} rows={[["Supported histories", law.paths.length], [`Selected ${selected} mass`, selectedMass], ["First two bits agree", law.adjacentEqual], ["P(X\u2082=1)", law.marginalOne[2]]]} />
    <p>{selectedMass === 0 ? "The selected history is outside this law\u2019s support; its mass is zero." : "The highlighted history is a possible complete realization."} These are exact finite laws, not sample frequencies.</p>
  </Lab>;
}
function MarkovFlowLab(props) {
  const { markov, setMarkov } = useFlow();
  const result = markovState({ ...markov, steps: markov.step });
  const current = result.history.at(-1);
  const previous = result.history.at(-2);
  const patch = (update) => setMarkov((state) => ({ ...state, ...update }));
  return <Lab {...props} title="Follow one probability transition">
    {previous ? <MassFlow matrix={result.matrix} source={previous.distribution} step={markov.step} selected={markov.selected} onSelect={(selected) => patch({ selected })} /> : <Bars title="Initial law has no incoming transition" values={current.distribution} />}
    <div className="sp-controls"><Select label="Initial Sunny probability" value={markov.initialSunny} onChange={(value) => patch({ initialSunny: Number(value) })} options={[[1, "1: certainly Sunny"], [0.5, "\xBD"], [0, "0: certainly Rainy"]]} /><Stepper value={markov.step} onChange={(step) => patch({ step })} /><Select label="Inspected route" value={markov.selected} onChange={(value) => patch({ selected: Number(value) })} options={[[0, "Sunny \u2192 Sunny"], [1, "Sunny \u2192 Rainy"], [2, "Rainy \u2192 Sunny"], [3, "Rainy \u2192 Rainy"]]} /><Reset onClick={() => setMarkov((state) => ({ ...defaultMarkov, resetToken: (state.resetToken ?? 0) + 1 }))} /></div>
    <p>Current applied rates a={fmt(markov.a)}, b={fmt(markov.b)}. Destination law at step {markov.step}: ({current.distribution.map((value) => fmt(value)).join(", ")}). The later mixing investigation shares this matrix.</p>
  </Lab>;
}
function MixingLab(props) {
  const { markov, setMarkov } = useFlow();
  const result = markovState({ ...markov, steps: 60 });
  const patch = (update) => setMarkov((state) => ({ ...state, ...update }));
  const apply = (key, value) => {
    const next = { ...markov, [key]: value };
    markovState(next);
    patch({ [key]: value });
  };
  let total = 0;
  const occupation = result.history.map((entry, i) => {
    total += entry.distribution[0];
    return [i, total / (i + 1)];
  });
  return <Lab {...props} title="Separate invariant mass, convergence and average occupation">
    <Plot title="Current Sunny marginal and its finite Cesàro average" xDomain={[0, 60]} yDomain={[0, 1]} xLabel="Steps" yLabel="Sunny probability" series={[{ points: result.history.map((row) => [row.step, row.distribution[0]]) }, { points: occupation, className: "sp-secondary" }]} />
    <div className="sp-controls"><Select label="Applied transition preset" value={Object.keys(MARKOV_PRESETS).find((key) => MARKOV_PRESETS[key].a === markov.a && MARKOV_PRESETS[key].b === markov.b) ?? "custom"} onChange={(key) => {
    if (key !== "custom") patch({ a: MARKOV_PRESETS[key].a, b: MARKOV_PRESETS[key].b });
  }} options={[...Object.entries(MARKOV_PRESETS).map(([key, preset]) => [key, preset.name]), ["custom", "Custom applied rates"]]} /><DraftNumber label="a: Sunny → Rainy" value={markov.a} minimum={0} maximum={1} resetKey={markov.resetToken} onApply={(value) => apply("a", value)} /><DraftNumber label="b: Rainy → Sunny" value={markov.b} minimum={0} maximum={1} resetKey={markov.resetToken} onApply={(value) => apply("b", value)} /><Reset onClick={() => setMarkov((state) => ({ ...defaultMarkov, resetToken: (state.resetToken ?? 0) + 1 }))} /></div>
    <Table title="Current classification and shared initial law" headers={["Quantity", "Result"]} rows={[["Initial Sunny probability", markov.initialSunny], ["Fixed-point multiplier", result.multiplier], ["Irreducible?", result.irreducible ? "yes" : "no"], ["Period two?", result.periodTwo ? "yes" : "no"], ["Stationary law", result.stationary ? result.stationary.map((value) => fmt(value)).join(", ") : "every initial law is stationary"], ["Limit from current start", result.limitingDistribution ? result.limitingDistribution.map((value) => fmt(value)).join(", ") : "marginals do not converge"]]} />
    <p>The dashed curve averages the displayed marginal laws; it is not one simulated path’s empirical occupation. Change the shared initial law in the preceding investigation. An alternating chain can have convergent averages while its marginals alternate.</p>
  </Lab>;
}
function FirstHitLab(props) {
  const { absorption, setAbsorption } = useFlow();
  const result = absorptionState({ ...absorption, steps: absorption.horizon });
  const patch = (update) => setAbsorption((state) => ({ ...state, ...update, start: Math.min(update.start ?? state.start, update.boundary ?? state.boundary), selected: Math.min(update.selected ?? state.selected, update.boundary ?? state.boundary), horizon: ["boundary", "start", "upward"].some((key) => Object.prototype.hasOwnProperty.call(update, key)) ? 4 : state.horizon }));
  const i = absorption.selected;
  const interior = i > 0 && i < absorption.boundary;
  return <Lab {...props} title="Solve eventual boundary probability and duration">
    <ReserveGraph result={result} selected={i} onSelect={(selected) => patch({ selected })} />
    <div className="sp-controls"><Slider label="Upper boundary B" value={absorption.boundary} min={3} max={8} onChange={(boundary) => patch({ boundary })} /><Slider label="Starting reserve" value={absorption.start} min={0} max={absorption.boundary} onChange={(start) => patch({ start })} /><Select label="Upward probability" value={absorption.upward} onChange={(value) => patch({ upward: Number(value) })} options={[0.1, 0.25, 0.5, 0.75, 0.9].map((value) => [value, fmt(value)])} /><Reset onClick={() => setAbsorption(defaultAbsorption)} /></div>
    <Table title="Every reserve’s solved first-passage quantities" headers={["Reserve", "Upper success h", "Mean remaining steps t"]} rows={result.success.map((value, state) => [state, value, result.meanSteps[state]])} />
    {interior ? <Table title={`Actual equation operands at selected reserve ${i}`} headers={["Operand", "Value"]} rows={[["(1\u2212p) h\u1D62\u208B\u2081", (1 - result.upward) * result.success[i - 1]], ["p h\u1D62\u208A\u2081", result.upward * result.success[i + 1]], ["h\u1D62", result.success[i]], ["One consumed step", 1], ["(1\u2212p) t\u1D62\u208B\u2081 + p t\u1D62\u208A\u2081", (1 - result.upward) * result.meanSteps[i - 1] + result.upward * result.meanSteps[i + 1]], ["t\u1D62", result.meanSteps[i]]]} /> : <p>Selected reserve {i} is already a target: remaining duration 0 and known upper-success {fmt(result.success[i])}.</p>}
    <p>Starting at {absorption.start}: eventual upper success {fmt(result.success[absorption.start])}, expected duration {fmt(result.meanSteps[absorption.start])} steps.</p>
  </Lab>;
}
function AbsorptionHorizonLab(props) {
  const { absorption, setAbsorption } = useFlow();
  const result = absorptionState({ ...absorption, steps: absorption.horizon });
  const current = result.history.at(-1);
  return <Lab {...props} title="Distinguish finite-horizon survival from eventual success">
    <Bars title="Probability law at the selected finite horizon" values={current.distribution} selected={absorption.selected} onSelect={(selected) => setAbsorption((state) => ({ ...state, selected }))} />
    <Plot title="First-hit mass per step, lower and upper target" xDomain={[0, Math.max(1, absorption.horizon)]} yDomain={[0, 1]} xLabel="Step" yLabel="Newly absorbed mass" series={[{ points: result.history.map((row) => [row.step, row.firstLower]) }, { points: result.history.map((row) => [row.step, row.firstUpper]), className: "sp-secondary" }]} />
    <div className="sp-controls"><Stepper value={absorption.horizon} onChange={(horizon) => setAbsorption((state) => ({ ...state, horizon }))} /><Reset onClick={() => setAbsorption(defaultAbsorption)} /></div>
    <Table title="Three disjoint finite-horizon events" headers={["Event", "Mass"]} rows={[["Absorbed at lower target", current.distribution[0]], ["Absorbed at upper target", current.distribution[absorption.boundary]], ["Still transient (censored)", current.surviving], ["Total", current.distribution.reduce((a, b) => a + b, 0)]]} />
    <p>Shared B={absorption.boundary}, start={absorption.start}, p={fmt(absorption.upward)}. At horizon 0, an interior start has no first hit; a boundary start is already absorbed. Selected reserve {absorption.selected} has current mass {fmt(current.distribution[absorption.selected])}.</p>
    <Table title="New first-hit mass and accumulated absorption at every step" headers={["Step", "First lower", "First upper", "All lower hits", "All upper hits", "Surviving"]} rows={result.history.map((row) => [row.step, row.firstLower, row.firstUpper, row.distribution[0], row.distribution[absorption.boundary], row.surviving])} />
  </Lab>;
}
function ArrivalReadout({ result, selected = 0, onSelect, marked = false }) {
  const event = result.events[selected];
  return <><EventStream events={result.events} horizon={result.horizon} marked={marked} selected={selected} onSelect={onSelect} /><CountStairs events={result.events} horizon={result.horizon} />
    <Table title="Actual observed stream and model predictions" headers={["Quantity", "Value"]} rows={[["Selected interval", `(${result.interval.join(",")}] minutes`], ["Model expected count", result.intervalMean], ["Observed interval count", result.intervalCount], ["Model zero-count probability", result.zeroProbability], ["Observed exposure end", result.observedUntil], ["Simulation coverage complete?", result.complete ? "yes" : "no: cap reached"], ["Selected event time", event?.time ?? "no selected event"], ["Selected observed gap", event?.gap ?? "no observed complete gap"], ["Censored final gap", result.complete ? result.horizon - (result.events.at(-1)?.time ?? 0) : "exposure truncated by cap"]]} />
    <Table title="Every actual event keeps its time, wait and interval membership" headers={["Event", "Time (minutes)", "Gap (minutes)", "Selected interval?", ...marked ? ["Mark"] : []]} rows={result.events.map((value) => [value.index, value.time, value.gap, value.time > result.interval[0] && value.time <= result.interval[1] ? "yes" : "no", ...marked ? [value.mark === 0 ? "A" : "B"] : []])} />
  </>;
}
function ArrivalWindowLab(props) {
  const [config, setConfig] = useState({ rate: 2.5, interval: [0, 1], seed: 11, selected: 0 });
  const result = arrivalState({ rates: [config.rate, config.rate], interval: config.interval, seed: config.seed });
  const patch = (update) => setConfig((state) => ({ ...state, ...update }));
  return <Lab {...props} title="Observe a constant-rate arrival window">
    <ArrivalReadout result={result} selected={Math.min(config.selected, result.events.length - 1)} onSelect={(selected) => patch({ selected })} />
    <CountMass mean={result.intervalMean} limit={40} />
    <div className="sp-controls"><DraftNumber label="Constant rate / minute" value={config.rate} minimum={0} maximum={6} resetKey={config.resetToken} onApply={(rate) => {
    arrivalState({ rates: [rate, rate] });
    patch({ rate });
  }} /><Select label="Observation interval" value={intervalKey(config.interval)} onChange={(value) => patch({ interval: parseInterval(value) })} options={intervals} /><button onClick={() => patch({ seed: config.seed + 1 >>> 0, selected: 0 })}>New draw</button><Reset onClick={() => setConfig((state) => ({ rate: 2.5, interval: [0, 1], seed: 11, selected: 0, resetToken: (state.resetToken ?? 0) + 1 }))} /></div>
    <p>Synthetic stream, seed {config.seed}. The count distribution shows k=0–40; remaining probability {fmt(result.pmfTail)}{result.tailBelowFloatingPointRange ? " (below floating-point range, not mathematically zero)" : ""}. Changing the rate remaps the same underlying clock draws.</p>
  </Lab>;
}
function ArrivalMarksLab(props) {
  const { analysis, setAnalysis } = useFlow();
  const [selected, setSelected] = useState(0);
  const result = arrivalState(analysis);
  const patch = (update) => setAnalysis((state) => ({ ...state, ...update }));
  const counts = result.markedCounts;
  const selectedLaw = counts && counts.every((count) => count <= 30) ? splitCountLaw(result.intervalMean, counts[0], counts[1], analysis.splitProbability) : null;
  return <Lab {...props} title="Route the same events while preserving their identities">
    <ArrivalReadout result={result} selected={Math.min(selected, result.events.length - 1)} onSelect={setSelected} marked />
    <div className="sp-controls"><Select label="Routing rule" value={analysis.routing} onChange={(routing) => patch({ routing })} options={[["independent", "Independent marks"], ["alternating", "Alternating A/B"]]} /><Select label="A-mark probability" value={analysis.splitProbability} onChange={(value) => patch({ splitProbability: Number(value) })} disabled={analysis.routing === "alternating"} options={[0, 0.25, 0.5, 0.75, 1].map((value) => [value, fmt(value)])} /><button onClick={() => {
    patch({ seed: analysis.seed + 1 >>> 0 });
    setSelected(0);
  }}>New draw</button><Reset onClick={() => {
    setAnalysis((state) => ({ ...defaultAnalysis, resetToken: (state.resetToken ?? 0) + 1 }));
    setSelected(0);
  }} /></div>
    <Table title="Current marked observation" headers={["Quantity", "Value"]} rows={[["Observed A count", counts?.[0]], ["Observed B count", counts?.[1]], ["Total expected interval count", result.intervalMean], ["Conditional A-count mass", analysis.routing === "independent" ? selectedLaw?.conditional ?? (counts?.some((count) => count > 30) ? "outside the bounded 0\u201330 cell diagnostic" : "undefined") : "not a binomial marking law"], ["Joint product-Poisson mass", analysis.routing === "independent" ? selectedLaw?.joint ?? (counts?.some((count) => count > 30) ? "outside the bounded 0\u201330 cell diagnostic" : "undefined") : "not independent Poisson streams"]]} />
    <p>Current shared schedule {analysis.rates.map((rate) => fmt(rate)).join(" then ")} events/minute; current interval ({analysis.interval.join(",")}]. Later clock controls change those values. Alternating routing waits for two original arrivals between successive A events.</p>
  </Lab>;
}
function ScheduledClockLab(props) {
  const { analysis, setAnalysis } = useFlow();
  const result = arrivalState(analysis);
  const patch = (update) => setAnalysis((state) => ({ ...state, ...update }));
  const applyRate = (index, value) => {
    const rates = [...analysis.rates];
    rates[index] = value;
    arrivalState({ ...analysis, rates });
    patch({ rates });
  };
  return <Lab {...props} title="Map one operational clock through a scheduled rate">
    <RateClock rates={analysis.rates} /><EventStream events={result.events} />
    <div className="sp-controls"><Select label="Rate schedule" value={analysis.rates.join(",")} onChange={(value) => patch({ rates: parseInterval(value) })} options={[["2.5,2.5", "Constant 2.5 / minute"], ["1,4", "1 then 4 / minute"], ["0,4", "0 then 4 / minute"], ["0,0", "Zero throughout"], ...!["2.5,2.5", "1,4", "0,4", "0,0"].includes(analysis.rates.join(",")) ? [[analysis.rates.join(","), "Custom applied schedule"]] : []]} /><DraftNumber label="First rate / minute" value={analysis.rates[0]} minimum={0} maximum={6} resetKey={analysis.resetToken} onApply={(value) => applyRate(0, value)} /><DraftNumber label="Second rate / minute" value={analysis.rates[1]} minimum={0} maximum={6} resetKey={analysis.resetToken} onApply={(value) => applyRate(1, value)} /><Select label="Observation interval" value={intervalKey(analysis.interval)} onChange={(value) => patch({ interval: parseInterval(value) })} options={intervals} /><Reset onClick={() => setAnalysis((state) => ({ ...defaultAnalysis, resetToken: (state.resetToken ?? 0) + 1 }))} /></div>
    <Table title="Accumulated operational clock and unchanged draws" headers={["Quantity", "Value"]} rows={[["Switch time, minutes", 2], ["Total intensity at minute 3", result.totalIntensity], ["Selected interval mean", result.intervalMean], ["Zero-count probability", result.zeroProbability], ["Draw seed", result.seed], ["Current routing", result.routing], ["Simulation complete?", result.complete ? "yes" : "no: report only observed exposure"]]} />
    <Table title="The same operational event coordinates mapped to minutes" headers={["Event", "Operational time", "Physical time (min)"]} rows={result.events.map((event) => [event.index, event.unitTime, event.time])} />
  </Lab>;
}
function HoldingSegments({ result, selected = 0, onSelect }) {
  return <Plot title="Observed holding segments with physical clock lengths" xDomain={[0, result.horizon]} yDomain={[-0.35, 1.35]} xLabel="Elapsed hours" yLabel="On = 0; Off = 1">{({ x, y }) => result.segments.map((segment, i) => <g key={i} className={selected === i ? "sp-selected" : ""} role={onSelect ? "button" : void 0} tabIndex={onSelect ? 0 : void 0} aria-label={`Select holding segment ${i + 1}`} onClick={() => onSelect?.(i)} onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(i);
    }
  }}>
    <line x1={x(segment.start)} x2={x(segment.end)} y1={y(segment.state)} y2={y(segment.state)} className={`sp-line ${segment.state === 1 ? "sp-secondary" : ""}`} />
    <circle cx={x(segment.start)} cy={y(segment.state)} r="4" className="sp-bit" />
    <circle cx={x(segment.end)} cy={y(segment.state)} r="4" fill="#171717" stroke="#edc267" />
    {segment.jumped && <line x1={x(segment.end)} x2={x(segment.end)} y1={y(segment.state)} y2={y(1 - segment.state)} className="sp-grid" />}
  </g>)}</Plot>;
}
function StateClockLab(props) {
  const { jump, setJump } = useFlow();
  const result = jumpClockState(jump);
  const selected = Math.min(jump.selected, result.segments.length - 1);
  const segment = result.segments[selected];
  const patch = (update) => setJump((state) => ({ ...state, ...update }));
  const apply = (key, value) => {
    jumpClockState({ ...jump, [key]: value });
    patch({ [key]: value });
  };
  const rate = segment.state === 0 ? jump.alpha : jump.beta;
  return <Lab {...props} title="Inspect a state-specific holding interval">
    <HoldingSegments result={result} selected={selected} onSelect={(value) => patch({ selected: value })} />
    <div className="sp-controls"><DraftNumber label="α: On → Off / hour" value={jump.alpha} minimum={0.05} maximum={6} resetKey={jump.resetToken} onApply={(value) => apply("alpha", value)} /><DraftNumber label="β: Off → On / hour" value={jump.beta} minimum={0.05} maximum={6} resetKey={jump.resetToken} onApply={(value) => apply("beta", value)} /><Select label="Initial state" value={jump.initial} onChange={(value) => patch({ initial: Number(value), selected: 0 })} options={[[0, "On"], [1, "Off"]]} /><Reset onClick={() => setJump((state) => ({ ...defaultJump, resetToken: (state.resetToken ?? 0) + 1 }))} /></div>
    <Table title={`Selected observed segment ${selected + 1}`} headers={["Quantity", "Value"]} rows={[["Current state", segment.state === 0 ? "On" : "Off"], ["Departure rate / hour", rate], ["Observed start, hours", segment.start], ["Observed end, hours", segment.end], ["Observed duration, hours", segment.end - segment.start], ["Observed departure?", segment.jumped ? "yes" : "no: right-censored"], ["Complete wait \u2212log(U)/rate", segment.jumped ? segment.holdingTime : "not observed"], ["Underlying U for a complete wait", segment.jumped ? Math.exp(-rate * segment.holdingTime) : "not inferred from a censored interval"]]} />
    <p>Shared horizon {jump.horizon} hours and seed {jump.seed}. Coverage reaches {fmt(result.observedUntil)} hours{result.complete ? "." : "; the jump cap truncates exposure."}</p>
  </Lab>;
}
function OccupationExposureLab(props) {
  const { jump, setJump } = useFlow();
  const result = jumpClockState(jump);
  return <Lab {...props} title="Compare visit counts with duration exposure">
    <HoldingSegments result={result} />
    <Canvas title="Actual elapsed exposure allocated to On and Off" height={190}>{[0, 1].map((state) => <g key={state}><Label x="28" y={60 + 82 * state}>{state === 0 ? "On" : "Off"}</Label><rect x="65" y={42 + 82 * state} width={270 * result.exposure[state] / jump.horizon} height="26" className="sp-area" /><Label x="190" y={91 + 82 * state}>{fmt(result.exposure[state])} hours</Label></g>)}</Canvas>
    <div className="sp-controls"><Select label="Observation horizon" value={jump.horizon} onChange={(value) => setJump((state) => ({ ...state, horizon: Number(value), selected: 0 }))} options={[[1, "1 hour"], [4, "4 hours"], [12, "12 hours"]]} /><button onClick={() => setJump((state) => ({ ...state, seed: state.seed + 1 >>> 0, selected: 0 }))}>New draw</button><Reset onClick={() => setJump((state) => ({ ...defaultJump, resetToken: (state.resetToken ?? 0) + 1 }))} /></div>
    <Table title="Departures divided by observed exposure" headers={["State", "Exposure (h)", "Departures", "Fitted rate / h"]} rows={[0, 1].map((state) => [state === 0 ? "On" : "Off", result.exposure[state], result.departures[state], result.exposure[state] === 0 ? "unidentified" : result.departures[state] / result.exposure[state]])} />
    <Table title="Exact expectations differ from one synthetic realization" headers={["Quantity", "Value"]} rows={[["Applied \u03B1 / h", jump.alpha], ["Applied \u03B2 / h", jump.beta], ["Stationary On time fraction", result.stationaryOn], ["Exact expected On exposure, hours", result.expectedOnExposure], ["Realized On exposure, hours", result.exposure[0]], ["Embedded On visit fraction", result.segments.filter((segment) => segment.state === 0).length / result.segments.length], ["Observed exposure coverage", result.complete ? "complete" : "truncated by jump cap"]]} />
    <Table title="The complete observed visit sequence" headers={["Visit", "State", "Start h", "End h", "Departed?"]} rows={result.segments.map((segment, i) => [i + 1, segment.state === 0 ? "On" : "Off", segment.start, segment.end, segment.jumped ? "yes" : "censored"])} />
  </Lab>;
}
function useBrownianResult() {
  const { brownian, setBrownian } = useFlow();
  const result = useMemo(() => brownianState(brownian), [brownian.seed, brownian.horizon, brownian.drift, brownian.scale, brownian.level, brownian.pathIndex]);
  const fine = useMemo(() => brownianState({ ...brownian, level: 8 }), [brownian.seed, brownian.horizon, brownian.drift, brownian.scale, brownian.pathIndex]);
  return { brownian, setBrownian, result, fine };
}
function BrownianIncrementLab(props) {
  const { brownian, setBrownian, result } = useBrownianResult();
  const interval = Math.min(brownian.interval, result.count - 1);
  const increment = result.increments[interval];
  const drift = brownian.drift * result.dt;
  const noise = increment - drift;
  const sigma = brownian.scale * Math.sqrt(result.dt);
  const extent = Math.max(1, Math.abs(drift), Math.abs(noise), Math.abs(increment)) * 1.2;
  const patch = (update) => setBrownian((state) => ({ ...state, ...update }));
  return <Lab {...props} title="Decompose one actual Brownian increment">
    <Plot title="One selected displacement and its drift/noise components" xDomain={[-extent, extent]} yDomain={[0, 3]} xLabel="Position displacement" yLabel="Noise (1), drift (2), total (3)">{({ x, y }) => [[noise, 1], [drift, 2], [increment, 3]].map(([value, row]) => <g key={row}><line x1={x(0)} x2={x(value)} y1={y(row - 0.25)} y2={y(row - 0.25)} className={row === 2 ? "sp-line sp-secondary" : "sp-line"} /><circle cx={x(value)} cy={y(row - 0.25)} r="4" className="sp-bit" /></g>)}</Plot>
    <div className="sp-controls"><Select label="Duration T" value={brownian.horizon} onChange={(value) => patch({ horizon: Number(value) })} options={[[1, "1 time unit"], [2, "2 time units"], [4, "4 time units"]]} /><Select label="Drift μ" value={brownian.drift} onChange={(value) => patch({ drift: Number(value) })} options={[-0.5, 0, 0.5].map((value) => [value, fmt(value)])} /><Select label="Diffusion scale σ" value={brownian.scale} onChange={(value) => patch({ scale: Number(value) })} options={[0.5, 1, 2].map((value) => [value, fmt(value)])} /><Reset onClick={() => setBrownian(defaultBrownian)} /></div>
    <Table title="Selected shared interval and its population increment law" headers={["Quantity", "Value"]} rows={[["Shared path index", brownian.pathIndex], ["Shared interval index", interval], ["\u0394t", result.dt], ["Actual normalized normal draw Z", noise / sigma], ["Drift \u03BC\u0394t", drift], ["Noise \u03C3\u221A\u0394t Z", noise], ["Actual \u0394X", increment], ["Population mean increment", drift], ["Population standard deviation", sigma], ["Population variance", sigma * sigma]]} />
    <p>The later interval selector changes which shared increment is inspected. Applied parameters change the scale and drift of the same underlying finest normals.</p>
  </Lab>;
}
function BrownianFamilyLab(props) {
  const { brownian, setBrownian, result, fine } = useBrownianResult();
  const extent = Math.max(...fine.paths.flat().map(Math.abs), Math.abs(brownian.drift * brownian.horizon) + 1.95996398454 * brownian.scale * Math.sqrt(brownian.horizon), 0.1) * 1.08;
  const envelope = (sign) => fine.times.map((t) => [t, brownian.drift * t + sign * 1.95996398454 * brownian.scale * Math.sqrt(t)]);
  return <Lab {...props} title="One stable family of Brownian realizations">
    <Plot title="Eight shared paths and a pointwise population envelope" xDomain={[0, brownian.horizon]} yDomain={[-extent, extent]} xLabel="Elapsed time" yLabel="Position" series={[...result.paths.map((path, i) => ({ points: path.map((value, j) => [result.times[j], value]), className: i === brownian.pathIndex ? "" : "sp-secondary sp-family-muted" })), { points: envelope(1), className: "sp-secondary" }, { points: envelope(-1), className: "sp-secondary" }, { points: [[0, 0], [brownian.horizon, brownian.drift * brownian.horizon]], className: "sp-mean" }]} />
    <div className="sp-controls"><Select label="Selected path index" value={brownian.pathIndex} onChange={(value) => setBrownian((state) => ({ ...state, pathIndex: Number(value) }))} options={Array.from({ length: 8 }, (_, i) => [i, String(i)])} /><button onClick={() => setBrownian((state) => ({ ...state, seed: state.seed + 1 >>> 0 }))}>New family</button><Reset onClick={() => setBrownian(defaultBrownian)} /></div>
    <p>Current seed {brownian.seed}, T={brownian.horizon}, μ={fmt(brownian.drift)}, σ={fmt(brownian.scale)}, observations={result.count}. The common extent includes every finest observation and both pointwise envelope curves, and remains fixed when grid level changes. Straight connections interpolate observed grid values; they are not measurements of the unobserved continuous trace.</p>
    <Table title="Selected realization versus population endpoint law" headers={["Quantity", "Value"]} rows={[["Selected endpoint", result.selected.at(-1)], ["Population endpoint mean", result.terminalMean], ["Population endpoint variance", result.terminalVariance], ["Grid-observed minimum", result.sampledMinimum], ["Grid-observed maximum", result.sampledMaximum]]} />
  </Lab>;
}
function BridgeBarrierLab(props) {
  const [config, setConfig] = useState({ preset: "standard", fraction: 0.5, barrier: 1 });
  const operands = config.preset === "standard" ? { left: 0, right: 0, duration: 1, scale: 1 } : { left: 0.2, right: -0.1, duration: 0.5, scale: 0.8 };
  const result = bridgeState({ ...operands, fraction: config.fraction, barrier: config.barrier });
  const endpoint = Math.max(operands.left, operands.right);
  const barrierOptions = [.../* @__PURE__ */ new Set([endpoint - 0.25, endpoint, endpoint + 0.25, config.preset === "standard" ? 1 : 0.7, 3, 10])].map((value) => [value, value < endpoint ? `${fmt(value)}: below an endpoint` : value === endpoint ? `${fmt(value)}: at highest endpoint` : `${fmt(value)}: above endpoints`]);
  return <Lab {...props} title="Condition on endpoints and ask a separate barrier question">
    <BridgeDistribution result={result} />
    <div className="sp-controls"><Select label="Endpoint / scale preset" value={config.preset} onChange={(preset) => setConfig((state) => ({ ...state, preset, barrier: preset === "standard" ? 1 : 0.7 }))} options={[["standard", "Standard: 0,0,1,1"], ["changed", "Changed: .2,\u2212.1,.5,.8"]]} /><Select label="Time fraction u" value={config.fraction} onChange={(value) => setConfig((state) => ({ ...state, fraction: Number(value) }))} options={[0, 0.25, 0.5, 0.75, 1].map((value) => [value, fmt(value)])} /><Select label="Barrier b" value={config.barrier} onChange={(value) => setConfig((state) => ({ ...state, barrier: Number(value) }))} options={barrierOptions} /><Reset onClick={() => setConfig({ preset: "standard", fraction: 0.5, barrier: 1 })} /></div>
    <p>{result.logCrossing === 0 ? "A known endpoint is at or above the barrier, so crossing probability is already 1." : "The continuous bridge can cross between observations; interpolating the endpoints misses that event."} {result.probabilityBelowFloatingPointRange && `The probability underflows in this arithmetic; log probability ${fmt(result.logCrossing)} remains available.`}</p>
  </Lab>;
}
function CommonGridVariationLab(props) {
  const { brownian, setBrownian, result, fine } = useBrownianResult();
  const interval = Math.min(brownian.interval, result.count - 1);
  const increment = result.increments[interval];
  const centered = increment - brownian.drift * result.dt;
  const stride = 256 / result.count;
  const finePieces = fine.increments.slice(interval * stride, (interval + 1) * stride);
  const squareScale = 80 / Math.max(0.05, Math.abs(increment), Math.abs(centered));
  return <Lab {...props} title="Refine one fixed path and inspect its quadratic sums">
    <Squares values={[increment, centered]} multiplier={squareScale} title="Raw and centered selected increment squares share one length scale" />
    <div className="sp-controls"><Slider label="Common-grid level" value={brownian.level} min={2} max={8} onChange={(level) => setBrownian((state) => ({ ...state, level, interval: Math.min(state.interval, 2 ** level - 1) }))} /><Slider label="Selected interval index" value={interval} min={0} max={result.count - 1} onChange={(value) => setBrownian((state) => ({ ...state, interval: value }))} /><Reset onClick={() => setBrownian(defaultBrownian)} /></div>
    <Table title="Selected group of finest increments" headers={["Quantity", "Value"]} rows={[["Finest pieces in this interval", stride], ["Sum of those actual pieces", finePieces.reduce((a, b) => a + b, 0)], ["Actual coarse \u0394X", increment], ["Centered \u0394X\u2212\u03BC\u0394t", centered], ["Raw squared area", increment * increment], ["Centered squared area", centered * centered], ["Raw realized Q", result.rawVariation], ["Centered realized Q", result.centeredVariation], ["Population mean raw Q", result.rawVariationExpectation], ["Population variance raw Q", result.rawVariationVariance], ["Population mean centered Q", result.centeredVariationExpectation], ["Population variance centered Q", result.centeredVariationVariance]]} />
    <Table title="All actual interval increments at this resolution" headers={["Interval", "Start time", "End time", "\u0394X", "Centered \u0394X", "Squared \u0394X"]} rows={result.increments.map((value, i) => [i, result.times[i], result.times[i + 1], value, value - brownian.drift * result.dt, value * value])} />
    <p>Path {brownian.pathIndex}, seed {brownian.seed}; {result.count} intervals. A realized squared sum may move either way. The same finest endpoint {fmt(fine.selected.at(-1))} is retained at every resolution. Square side scale is explicitly {fmt(squareScale)} drawing units per position unit for both displayed operands.</p>
  </Lab>;
}
function TemporalAuditLab(props) {
  const [split, setSplit] = useState(1907);
  const state = coalAuditState(split);
  return <Lab {...props} title="Fit one calendar exposure and freeze its held-out predictions">
    <CoalCalendar state={state} records />
    <div className="sp-controls"><Select label="Frozen training cut year" value={split} onChange={(value) => setSplit(Number(value))} options={[1907, 1887, 1927].map((year) => [year, String(year)])} /><Reset onClick={() => setSplit(1907)} /></div>
    <Table title="Full training and held-out exposure diagnostic" headers={["Quantity", "Value"]} rows={[["Training years", state.trainingYears], ["Training events", state.trainingEvents], ["Training \u03BB\u0302, events/year", state.rate], ["Held-out years", state.testYears], ["Observed held-out events", state.testEvents], ["Predicted held-out events", state.predictedTestEvents], ["Observed empty held-out years", state.actualEmptyYears], ["Predicted empty held-out years", state.predictedEmptyYears], ["One-year P(no event)", state.zero], ["One-year P(at least 4)", state.fourOrMore]]} />
    <Table title="All 191 canonical records, with original row identity" headers={["Row ID", "Recorded decimal year"]} rows={state.records.map((record) => [record.rowId, String(record.date)])} />
    <Table title="All 112 annual counts and fixed train/test roles" headers={["Calendar bin [year,year+1)", "Count", "Role"]} rows={state.years.map((year, i) => [year, state.counts[i], year < split ? "train" : "held out"])} />
    <p>The window [1851,1963) is an analysis choice, not an inferred claim of complete surveillance. Events meet the source’s explosion threshold; duplicate dates remain separate records. The training numerator contains no held-out records.</p>
  </Lab>;
}
export {
  AbsorptionHorizonLab,
  ArrivalMarksLab,
  ArrivalWindowLab,
  BridgeBarrierLab,
  BrownianFamilyLab,
  BrownianIncrementLab,
  CommonGridVariationLab,
  FirstHitLab,
  MarkovFlowLab,
  MixingLab,
  OccupationExposureLab,
  PathLawLab,
  ScheduledClockLab,
  StateClockLab,
  StochasticFlowProvider,
  TemporalAuditLab
};
