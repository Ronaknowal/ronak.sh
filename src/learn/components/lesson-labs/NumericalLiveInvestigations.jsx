import { useId, useState } from 'react';
import { C, Figure, Plot, Facts, Equation, Table, Weighted, number } from './NumericalDrawingPrimitives.jsx';
import { bracketTrace, newtonTrace, rootProblems, adaptiveSimpson, integralProblems, pumpCalibration, pumpVolume } from '../../data/numerical-methods-models.js';
import { finiteDifference, quadratureState, nestedSearch, panelDetail } from '../../data/numerical-reading-models.js';
import { PumpPanels } from './NumericalTransferDrawings.jsx';
function useInvestigation(initial, build) {
  const [draft, setDraft] = useState(initial),
    [active, setActive] = useState(initial),
    [model, setModel] = useState(() => build(initial)),
    [error, setError] = useState(''),
    [index, setIndex] = useState(0);
  function change(key, text, numeric = true) {
    const next = {
      ...draft,
      [key]: text
    };
    setDraft(next);
    try {
      const parsed = {
        ...next
      };
      for (const name of Object.keys(initial)) if (typeof initial[name] === 'number') {
        if (String(parsed[name]).trim() === '') throw new Error(`${name}: enter a finite number. The last valid calculation remains visible.`);
        parsed[name] = Number(parsed[name]);
        if (!Number.isFinite(parsed[name])) throw new Error(`${name}: enter a finite number.`);
      }
      const result = build(parsed);
      setModel(result);
      setActive(parsed);
      setError('');
      setIndex(0);
    } catch (e) {
      setError(e.message + ' The last valid calculation remains visible.');
    }
  }
  function reset() {
    setDraft(initial);
    setActive(initial);
    setModel(build(initial));
    setError('');
    setIndex(0);
  }
  return {
    draft,
    active,
    model,
    error,
    index,
    setIndex,
    change,
    reset
  };
}
function Field({
  lab,
  name,
  label,
  options
}) {
  const id = useId();
  return <label htmlFor={id}>{label}{options ? <select id={id} value={lab.draft[name]} onChange={e => lab.change(name, e.target.value, false)}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select> : <input id={id} type="number" step="any" value={lab.draft[name]} onChange={e => lab.change(name, e.target.value)} aria-invalid={!!lab.error} />}</label>;
}
function Controls({
  lab,
  fields,
  children
}) {
  return <div className="nm-controls">{fields.map(field => <Field key={field.name} lab={lab} {...field} />)}{children}<button type="button" onClick={lab.reset}>Reset</button>{lab.error && <p className="nm-error" role="alert">{lab.error}</p>}</div>;
}
function Steps({
  lab,
  length
}) {
  return <><button type="button" disabled={lab.index === 0} onClick={() => lab.setIndex(i => i - 1)}>Back</button><button type="button" disabled={lab.index >= length - 1} onClick={() => lab.setIndex(i => i + 1)}>Step</button></>;
}
function validInterval(a, b) {
  if (!(a < b) || !Number.isFinite(b - a)) throw new Error('Use an increasing interval of finite width.');
}
function bounds(values, padding = .12) {
  const finite = values.filter(Number.isFinite),
    lo = Math.min(...finite),
    hi = Math.max(...finite),
    span = hi - lo || Math.max(1, Math.abs(lo));
  return [lo - padding * span, hi + padding * span];
}
// A sample is a coordinate in one trace, not its current left/right/selected role.
function sampleIdentities(coordinates, palette = ['a', 'c', 'b']) {
  const unique = [...new Set(coordinates)];
  return coordinate => {
    const index = unique.indexOf(coordinate);
    const role = palette[index] || 'neutral';
    return {
      id: `S${index}`,
      role,
      label: `${`S${index}`} (${role === 'a' ? 'cyan circle' : role === 'b' ? 'amber square' : role === 'c' ? 'violet diamond' : 'neutral circle'})`
    };
  };
}
const fixtureOptions = [['cycle', 'Cubic x³−2x+2'], ['square', 'x²−2'], ['repeated', '(x−1)²']];
export function BracketLab() {
  const lab = useInvestigation({
    c: 2,
    lower: 0,
    upper: 2,
    tolerance: .001,
    fixture: 'ordinary'
  }, s => {
    validInterval(s.lower, s.upper);
    if (s.tolerance <= 0) throw new Error('Tolerance must be positive.');
    const f = s.fixture === 'touching' ? x => (x - 1) ** 2 : x => x * x - s.c;
    return {
      ...bracketTrace(f, s.lower, s.upper, {
        tolerance: s.tolerance,
        maximumSteps: 128
      }),
      f
    };
  });
  const m = lab.model,
    a = lab.active,
    row = m.steps[lab.index],
    domain = [a.lower, a.upper],
    ys = Array.from({
      length: 101
    }, (_, i) => m.f(a.lower + (a.upper - a.lower) * i / 100)),
    range = bounds([...ys, 0]),
    sample = sampleIdentities([a.lower, a.upper, ...m.steps.map(r => r.midpoint)]);
  return <Figure id="NM10" caption="Step and Back inspect the deterministic midpoint trace. Only rows through the current position are shown; changing inputs starts a new trace. White outline marks the current midpoint without replacing its identity."><Plot domain={domain} range={range} xLabel="input x" yLabel={a.fixture === 'touching' ? '(x−1)²' : `x²−${number(a.c)}`}>{p => <>{p.curve(m.f)}{row && <>{p.line([row.lower, 0], [row.upper, 0], C.neutral, {
            strokeWidth: 5
          })}{[[row.lower, row.leftValue, 'left'], [row.upper, row.rightValue, 'right'], [row.midpoint, row.value, 'midpoint']].map(([x, y, role]) => <g key={role} data-sample-id={sample(x).id} data-sample-coordinate={x} data-sample-role={sample(x).role}>{p.mark([x, y], sample(x).role, '', role === 'midpoint')}</g>)}{p.line([row.midpoint, 0], [row.midpoint, row.value], C[sample(row.midpoint).role], {
            strokeDasharray: '4 4'
          })}</>}{m.root !== undefined && !row && p.mark([m.root, 0], 'reference', 'root')}</>}</Plot>{row && <Facts rows={[[`Left · ${sample(row.lower).id}`,`x=${number(row.lower)}; f=${number(row.leftValue)}`,sample(row.lower).role],[`Midpoint · ${sample(row.midpoint).id}`,`x=${number(row.midpoint)}; f=${number(row.value)}`,sample(row.midpoint).role],[`Right · ${sample(row.upper).id}`,`x=${number(row.upper)}; f=${number(row.rightValue)}`,sample(row.upper).role]]}/>}<p className="nm-status">{row ? `After ${row.iteration} completed halvings: [${number(row.lower)}, ${number(row.upper)}], midpoint ${number(row.midpoint)}, f=${number(row.value)}, radius ${number(row.radius)}. ${lab.index === m.steps.length - 1 ? m.status : 'Evaluate and compare signs before the next replacement.'}` : m.status + (m.root !== undefined ? `: x=${number(m.root)}` : '')}</p><Controls lab={lab} fields={[{
      name: 'c',
      label: 'c in x²−c'
    }, {
      name: 'lower',
      label: 'Lower endpoint'
    }, {
      name: 'upper',
      label: 'Upper endpoint'
    }, {
      name: 'tolerance',
      label: 'Radius tolerance'
    }, {
      name: 'fixture',
      label: 'Function',
      options: [['ordinary', 'x²−c'], ['touching', 'Touching-root check']]
    }]}><Steps lab={lab} length={m.steps.length} /></Controls><Table caption="Inspected midpoint calculations" headers={['halves', 'bracket sample IDs', 'midpoint sample ID', 'value', 'next sign decision']} rows={m.steps.slice(0, lab.index + 1).map(r => [r.iteration, `${sample(r.lower).id}=${number(r.lower)} … ${sample(r.upper).id}=${number(r.upper)}`, <span style={{
      color: C[sample(r.midpoint).role]
    }}>{sample(r.midpoint).label}: {number(r.midpoint)}</span>, number(r.value), r.value === 0 ? 'computed zero' : r.leftValue < 0 !== r.value < 0 ? 'replace upper' : 'replace lower'])} /></Figure>;
}
export function NewtonLab() {
  const lab = useInvestigation({
    start: 0,
    lower: -2,
    upper: 0,
    fixture: 'cycle',
    method: 'plain'
  }, s => {
    validInterval(s.lower, s.upper);
    if (s.method === 'safe' && (s.start < s.lower || s.start > s.upper)) throw new Error('A safeguarded start must lie in the entered bracket.');
    const problem = {
      ...rootProblems[s.fixture],
      lower: s.lower,
      upper: s.upper
    };
    return {
      ...newtonTrace(problem, s.start, {
        safeguarded: s.method === 'safe',
        maximumSteps: 20
      }),
      problem
    };
  });
  const m = lab.model,
    a = lab.active,
    row = m.steps[lab.index],
    f = m.problem.f,
    x = row?.current ?? m.current ?? a.start,
    value = f(x),
    slope = m.problem.derivative(x);
  const base = m.problem.domain,
    domain = bounds([...base, x, ...(row && Math.abs(row.next) < 100 ? [row.next] : [])]),
    values = Array.from({
      length: 101
    }, (_, i) => f(domain[0] + (domain[1] - domain[0]) * i / 100)),
    range = bounds([...values, 0]),
    sample = sampleIdentities([a.start, ...m.steps.map(r => r.next)], ['a', 'b', 'c']);
  return <Figure id="NM17" caption="Each visited coordinate keeps its sample ID, colour and shape when it becomes current. The root bracket and central 80% acceptance span are separate. A hollow P marks the proposal, not an evaluated visit. Plot sample IDs match the role-labelled ledger."><Plot domain={domain} range={range} xLabel="input x" yLabel="function and current tangent">{p => <>
    {p.curve(f)}{p.curve(t => value + slope * (t - x), C.neutral)}
    {a.method === 'safe' && row && <>{p.line([row.lower, 0], [row.upper, 0], C.neutral, {
            strokeWidth: 5
          })}{p.line([row.lower + .1 * (row.upper - row.lower), range[0] + .12 * (range[1] - range[0])], [row.upper - .1 * (row.upper - row.lower), range[0] + .12 * (range[1] - range[0])], C.c, {
            strokeWidth: 5
          })}</>}
    <g data-sample-id={sample(x).id} data-sample-coordinate={x} data-sample-role={sample(x).role}>{p.mark([x,value],sample(x).role,'',true)}<text x={p.x(x)} y={p.y(value)-.9*p.f} fill={C[sample(x).role]} textAnchor="middle">{sample(x).id}</text></g>
    {row && <><g data-sample-id={sample(row.next).id} data-sample-coordinate={row.next} data-sample-role={sample(row.next).role}>{p.mark([row.next,row.nextValue],sample(row.next).role)}<text x={p.x(row.next)} y={p.y(row.nextValue)+1.5*p.f} fill={C[sample(row.next).role]} textAnchor="middle">{sample(row.next).id}</text>{p.line([row.next, 0], [row.next, row.nextValue], C[sample(row.next).role], {
              strokeDasharray: '4 4'
            })}</g>
    {row.proposal !== null && (row.proposal >= domain[0] && row.proposal <= domain[1] ? p.mark([row.proposal,0],'reference','P') : <>{p.arrow([row.proposal < domain[0] ? domain[0] + .1 * (domain[1] - domain[0]) : domain[1] - .1 * (domain[1] - domain[0]), 0], [row.proposal < domain[0] ? domain[0] : domain[1], 0], C.reference)}{p.mark([row.proposal < domain[0] ? domain[0] : domain[1], 0], 'reference', row.proposal < domain[0] ? '← P' : 'P →')}</>)}
    </>}
  </>}</Plot>{a.method === 'safe' && row && <Equation>Gray root bracket [{number(row.lower)}, {number(row.upper)}]. Violet lower rail: central 80% acceptance span [{number(row.lower + .1 * (row.upper - row.lower))}, {number(row.upper - .1 * (row.upper - row.lower))}]. Full proposal {row.proposal === null ? 'undefined' : number(row.proposal)}{row.proposal !== null && (row.proposal < domain[0] || row.proposal > domain[1]) ? ' lies beyond the plotted axis; the continuation arrow marks its direction.' : '.'} Actual evaluated visit {sample(row.next).id}: x={number(row.next)}.</Equation>}<p className="nm-status">At x={number(x)}, f={number(value)}, slope={number(slope)}. {row ? `Full proposal ${row.proposal === null ? 'undefined (zero slope)' : number(row.proposal)}; actual next ${number(row.next)}, f(next)=${number(row.nextValue)}: ${row.reason}.` : `${m.status}.`} {row && lab.index === m.steps.length - 1 ? m.status : ''}</p><Controls lab={lab} fields={[{
      name: 'fixture',
      label: 'Function',
      options: fixtureOptions
    }, {
      name: 'start',
      label: 'Starting input'
    }, {
      name: 'method',
      label: 'Step policy',
      options: [['plain', 'Plain Newton'], ['safe', 'Safeguarded']]
    }, {
      name: 'lower',
      label: 'Safeguard lower'
    }, {
      name: 'upper',
      label: 'Safeguard upper'
    }]}><Steps lab={lab} length={m.steps.length} /></Controls><Table caption="Inspected proposals and actual visits" headers={['step', 'current sample', 'proposal', 'actual next sample', 'decision']} rows={m.steps.slice(0, lab.index + 1).map(r => [r.iteration, `${sample(r.current).id}: ${number(r.current)}`, r.proposal === null ? 'undefined' : number(r.proposal), <span style={{
      color: C[sample(r.next).role]
    }}>{sample(r.next).label}: {number(r.next)}</span>, r.reason])} /><Equation>The cubic default bracket is [−2,0]. For x²−2, use [0,2] when safeguarding. A touching root cannot supply the required opposite signs. Work limit:20 rows.</Equation></Figure>;
}
export function DifferenceLab() {
  const lab = useInvestigation({
    x: 1,
    exponent: 1,
    offset: 0,
    stencil: 'central'
  }, s => {
    if (s.x < -5 || s.x > 5 || s.exponent < 1 || s.exponent > 20 || Math.abs(s.offset) > 1e12) throw new Error('Use x in [−5,5], exponent in [1,20], and offset in [−10¹²,10¹²].');
    return {
      selected: finiteDifference(s.x, s.exponent, s.stencil, s.offset),
      sweep: Array.from({
        length: 45
      }, (_, i) => {
        const exponent = 1 + i / 4;
        return {
          exponent,
          ...finiteDifference(s.x, exponent, s.stencil, s.offset)
        };
      })
    };
  });
  const m = lab.model.selected,
    a = lab.active,
    roles = m.nodes.length === 2 ? ['a', 'c'] : ['a', 'b', 'c'],
    local = m.nodes.map(n => n.x),
    domain = bounds(local),
    offset = a.offset;
  return <Figure id="NM26" caption="The local curve removes the displayed offset only for geometry; the arithmetic uses actual stored values. The fixed exponent sweep is unchanged by an h-only edit. White marks indicate selection, not a new method."><Plot domain={domain} range={bounds(local.map(Math.sin))} xLabel="sample coordinate x" yLabel="sin x, offset removed">{p => <>{p.curve(Math.sin)}{m.nodes.map((n, i) => <g key={i}>{p.mark([n.x, Math.sin(n.x)], roles[i], '', true)}</g>)}</>}</Plot><p className="nm-status">h={number(m.h)}; {m.status}. {m.estimate !== null ? `Estimate ${number(m.estimate)}, reference ${number(m.reference)}, absolute error ${number(m.error)}.` : 'No numerical derivative is reported.'}</p><Controls lab={lab} fields={[{
      name: 'x',
      label: 'Evaluation x'
    }, {
      name: 'exponent',
      label: 'Exponent: h=10⁻ᵉ'
    }, {
      name: 'offset',
      label: 'Added function offset'
    }, {
      name: 'stencil',
      label: 'Stencil',
      options: [['forward', 'Forward first'], ['central', 'Central first'], ['second', 'Central second'], ['boundary', 'One-sided second-order first']]
    }]} /><Weighted nodes={m.nodes.map((n, i) => ({
      ...n,
      role: roles[i],
      label: `sample x=${number(n.x)}`
    }))} divisor={m.denominator} available={m.estimate !== null} unavailableReason={m.status} /><Equation>{m.estimate === null ? 'The stored numerator remains inspectable. Coincident coordinates do not supply distinct samples, so division stops and the derivative is unavailable.' : a.stencil === 'second' ? 'Second derivative: function units per input².' : 'First derivative: function units per input.'} Actual sampled offset: {number(offset)}.</Equation><ErrorSweep rows={lab.model.sweep} selected={a.exponent} /></Figure>;
}
function ErrorSweep({
  rows,
  selected
}) {
  const valid = rows.filter(r => r.error !== null && r.error > 0 && Number.isFinite(r.error));
  const yr = valid.length ? bounds(valid.map(r => Math.log10(r.error)), .1) : [-16, 0];
  return <><Plot domain={[1, 12]} range={yr} xLabel="exponent e in h=10⁻ᵉ" yLabel="log₁₀ absolute error">{p => <>{valid.map((r, i) => <g key={r.exponent}>{i > 0 && valid[i - 1].exponent === r.exponent - .25 && p.line([valid[i - 1].exponent, Math.log10(valid[i - 1].error)], [r.exponent, Math.log10(r.error)], C.a)}{p.mark([r.exponent, Math.log10(r.error)], 'a', '', Math.abs(r.exponent - selected) < 1e-10)}</g>)}{selected <= 12 && p.line([selected, yr[0]], [selected, yr[1]], C.selection, {
          strokeDasharray: '4 4'
        })}</>}</Plot><p>Computed-zero error rail: {rows.filter(r => r.error === 0).map(r => number(r.exponent)).join(', ') || 'none'}. Unavailable entries: {rows.filter(r => r.error === null).map(r => number(r.exponent)).join(', ') || 'none'}. {selected > 12 ? `Selected exponent ${selected} lies beyond this fixed sweep.` : ''}</p></>;
}
export function QuadratureLab() {
  const lab = useInvestigation({
    n: 4,
    method: 'trapezoid',
    fixture: 'polynomial'
  }, s => {
    if (!Number.isInteger(s.n) || s.n < 2 || s.n > 32) throw new Error('Use an integer n from 2 through 32.');
    if (s.method === 'simpson' && s.n % 2) return {
      unavailable: true,
      reason: 'Classic composite Simpson needs even n.'
    };
    return quadratureState(s.fixture, s.n, s.method);
  });
  const m = lab.model,
    a = lab.active,
    step = a.method === 'simpson' ? 2 : 1,
    count = m.unavailable ? 0 : a.n / step,
    index = Math.min(lab.index, Math.max(0, count - 1));
  const role = i => i === 0 ? 'a' : i === a.n ? 'c' : i === Math.floor(a.n / 2) ? 'b' : 'neutral';
  const selected = i => i >= index * step && i <= index * step + step;
  const currentRole = i => i === index * step ? 'selected left' : i === index * step + step ? 'selected right' : step === 2 && i === index * step + 1 ? 'selected middle' : 'outside selected panel';
  const interpolant = (i, x) => {
    const l = m.nodes[i],
      r = m.nodes[i + step];
    if (step === 1) return l.value + (r.value - l.value) * (x - l.x) / (r.x - l.x);
    const mid = m.nodes[i + 1],
      u = (x - mid.x) / m.h;
    return l.value * u * (u - 1) / 2 + mid.value * (1 - u * u) + r.value * u * (u + 1) / 2;
  };
  return <Figure id="NM32" caption="Panel selection follows one trapezoid interval or one Simpson pair. The coloured sample identities carry into the contribution table; a white outline adds selection.">{m.unavailable ? <p className="nm-status">{m.reason} No estimate is substituted.</p> : <><Plot domain={[0, m.upper]} range={a.fixture === 'sine' ? [-.1, 1.1] : [-.1, 1.1]} xLabel="x" yLabel={a.fixture === 'sine' ? 'sin x' : 'x²'}>{p => <>{Array.from({
            length: count
          }, (_, k) => {
            const i = k * step;
            return <g key={i}>{p.area(x => interpolant(i, x), m.nodes[i].x, m.nodes[i + step].x, k === index ? C.a : C.neutral)}{p.curve(x => interpolant(i, x), k === index ? C.a : C.neutral, m.nodes[i].x, m.nodes[i + step].x)}</g>;
          })}{p.curve(m.f)}{m.nodes.map((n, i) => <g key={i} data-sample-id={'S' + i} data-sample-coordinate={n.x} data-sample-role={role(i)}>{p.mark([n.x, n.value], role(i), selected(i) ? 'S' + i : '', selected(i))}</g>)}</>}</Plot><p className="nm-status">Estimate {number(m.estimate)}; analytic reference {number(m.reference)}; estimate−reference {number(m.estimate - m.reference)}. Selected {step === 1 ? 'interval' : 'pair'} {index + 1}/{count}.</p></>}<Controls lab={lab} fields={[{
      name: 'n',
      label: 'Subinterval count n'
    }, {
      name: 'method',
      label: 'Method',
      options: [['trapezoid', 'Trapezoid'], ['simpson', 'Paired Simpson']]
    }, {
      name: 'fixture',
      label: 'Function and interval',
      options: [['polynomial', 'x² on [0,1]'], ['sine', 'sin on [0,π]']]
    }]}><button type="button" disabled={index === 0} onClick={() => lab.setIndex(i => i - 1)}>Previous panel</button><button type="button" disabled={index >= count - 1} onClick={() => lab.setIndex(i => i + 1)}>Next panel</button></Controls>{!m.unavailable && <Table caption="Complete sample weights and area contributions" headers={['sample ID / x', 'f(x)', 'weight', 'area contribution', 'persistent identity', 'current role']} rows={m.nodes.map((n, i) => [`S${i}: ${number(n.x)}`, number(n.value), n.weight, number(n.value * n.weight * m.h / (step === 2 ? 3 : 1)), <span style={{
      color: C[role(i)]
    }}>{role(i) === 'a' ? 'cyan circle' : role(i) === 'b' ? 'amber square' : role(i) === 'c' ? 'violet diamond' : 'neutral circle'}</span>, currentRole(i)])} />}</Figure>;
}
export function AdaptiveLab() {
  const lab = useInvestigation({
    tolerance: 1e-6,
    depth: 1,
    fixture: 'peak'
  }, s => {
    if (s.tolerance < 1e-8 || s.tolerance > 1e-2 || !Number.isInteger(s.depth) || s.depth < 1 || s.depth > 8) throw new Error('Use tolerance 10⁻⁸…10⁻² and integer depth 1…8.');
    const f = integralProblems[s.fixture].f;
    return {
      ...adaptiveSimpson(f, 0, 1, {
        tolerance: s.tolerance,
        maximumDepth: s.depth,
        maximumEvaluations: 4097
      }),
      f
    };
  });
  const m = lab.model,
    a = lab.active,
    leaf = m.leaves[Math.min(lab.index, m.leaves.length - 1)],
    detail = leaf ? panelDetail(m.f, leaf.lower, leaf.upper) : null,
    scale = a.fixture === 'blind' ? 1e5 : 1;
  return <Figure id="NM39" caption="Only the actual cache is marked as algorithm observations. Smooth curve samples are separate drawing work. Select an existing leaf to inspect its estimate versus allocated budget."><Plot domain={[0, 1]} range={[0, a.fixture === 'blind' ? 1.5 : 1.1]} xLabel="x" yLabel={a.fixture === 'blind' ? '10⁵ × g (display scale)' : 'resolved peak'}>{p => <>{p.curve(x => scale * m.f(x))}{leaf && p.polygon([[leaf.lower, 0], [leaf.upper, 0], [leaf.upper, a.fixture === 'blind' ? 1.5 : 1.1], [leaf.lower, a.fixture === 'blind' ? 1.5 : 1.1]], C.selection, {
          fillOpacity: .06,
          stroke: C.selection
        })}{m.samples.map(n => <g key={n.x}>{p.mark([n.x, scale * n.value], 'a')}</g>)}</>}</Plot><p className="nm-status">{m.status}; {m.samples.length} cached evaluations, {m.leaves.length} leaves. Estimate {number(m.estimate)}, sum of estimated errors {number(m.estimatedError)}.</p><Controls lab={lab} fields={[{
      name: 'tolerance',
      label: 'Error tolerance'
    }, {
      name: 'depth',
      label: 'Maximum depth'
    }, {
      name: 'fixture',
      label: 'Function',
      options: [['peak', 'Resolved peak'], ['blind', 'Five-node blind polynomial']]
    }]}><button disabled={lab.index === 0} type="button" onClick={() => lab.setIndex(i => i - 1)}>Previous leaf</button><button disabled={lab.index >= m.leaves.length - 1} type="button" onClick={() => lab.setIndex(i => i + 1)}>Next leaf</button></Controls>{leaf && <><Facts rows={[["selected leaf", `[${number(leaf.lower)},${number(leaf.upper)}]`], ['coarse', number(detail.coarse)], ['refined', number(detail.refined)], ['|difference|/15', number(detail.error)], ['budget', number(leaf.budget)], ['decision', leaf.accepted ? 'estimated acceptance' : 'depth exhausted; tolerance not met']]} /><Table caption="Selected leaf: actual cached values in both Simpson sums" headers={['x', 'f(x)', 'coarse weight', 'refined weight']} rows={detail.xs.map((x, i) => [number(x), number(detail.values[i]), [1, 0, 4, 0, 1][i], [1, 4, 2, 4, 1][i]])} /></>}<Plot domain={[0, 1]} range={[0, 1]} xLabel="leaf partition x" yLabel="selected leaf outline">{p => <>{m.leaves.map((r, i) => <g key={r.lower}>{p.polygon([[r.lower, .2], [r.upper, .2], [r.upper, .8], [r.lower, .8]], r.accepted ? C.a : C.invalid, {
            fillOpacity: .15,
            stroke: i === lab.index ? C.selection : C.neutral,
            strokeWidth: i === lab.index ? 3 : 1
          })}</g>)}</>}</Plot><Equation>Rose intervals have exhausted depth while their estimate exceeds their budget. The blind fixture can pass its first estimator regardless of greater depth allowance.</Equation></Figure>;
}
function VolumeInterval({
  state,
  target
}) {
  const lo = state.estimate - state.integralBound,
    hi = state.estimate + state.integralBound,
    domain = bounds([lo, hi, target]);
  return <Plot domain={domain} range={[0, 1]} xLabel="volume (L), local scale" yLabel="conditional volume interval">{p => <>{p.line([lo, .5], [hi, .5], C.a, {
        strokeWidth: 5
      })}{p.mark([lo, .5], 'a')}{p.mark([hi, .5], 'c')}{p.mark([state.estimate, .5], 'b')}{p.line([target, 0], [target, 1], C.reference, {
        strokeDasharray: '5 4'
      })}</>}</Plot>;
}
export function CalibrationLab() {
  const lab = useInvestigation({
    target: .8,
    candidate: 3,
    n: 8
  }, s => {
    if (!Number.isInteger(s.n) || s.n < 8 || s.n > 256) throw new Error('Use integer panels from 8 through 256.');
    return pumpCalibration(s.target, s.n, s.candidate);
  });
  const m = lab.model;
  return <Figure id="NM48" caption="Refining the inner panel count changes the interval and sign evidence, while candidate time stays fixed. This conditional discretization bound does not enclose all floating-point or physical uncertainty."><VolumeInterval state={m} target={lab.active.target} /><p className="nm-status">T={number(m.candidate)} min, V̂={number(m.estimate)} L ± {number(m.integralBound)} L: {m.sign}. Conditional time bound {number(m.timeBound)} min.</p><Controls lab={lab} fields={[{
      name: 'target',
      label: 'Target volume (L)'
    }, {
      name: 'candidate',
      label: 'Candidate time (min)'
    }, {
      name: 'n',
      label: 'Panel count'
    }]} /><PumpPanels candidate={m.candidate} panels={m.panels} /><Facts rows={[["model-only analytic assessment", number(m.volume) + ' L'], ['residual plus integral bound', number(Math.abs(m.residual) + m.integralBound) + ' L'], ['divide by lower slope', number(m.slopeLowerBound) + ' L/min']]} /></Figure>;
}
export function NestedSearchLab() {
  const lab = useInvestigation({
    target: .8,
    tolerance: .01,
    maximum: 128
  }, s => nestedSearch(s.target, s.tolerance, s.maximum));
  const rows = lab.model,
    row = rows[lab.index],
    calls = rows.slice(0, lab.index + 1).filter(r => r.panels !== null).length,
    sample = sampleIdentities([2, 4, ...rows.map(r => r.candidate)]);
  const nextOuter = () => {
    const found = rows.findIndex((r, i) => i > lab.index && r.outer > row.outer);
    lab.setIndex(found < 0 ? rows.length - 1 : found);
  };
  return <Figure id="NM49" caption="Controls inspect a precomputed bounded trace: the current row alone drives the diagram and readout. Future results are not presented as already performed. A final refinement uses min(2n, maximum), including non-power-of-two budgets."><Plot domain={[2, 4]} range={[0, 1]} xLabel="time (min), retained outer bracket" yLabel="current outer state">{p => <>{p.line([row.lower, .5], [row.upper, .5], C.c, {
          strokeWidth: 5
        })}{[[row.lower, 'left'], [row.upper, 'right'], [row.candidate, 'candidate']].map(([x, role]) => <g key={role} data-sample-id={sample(x).id} data-sample-coordinate={x} data-sample-role={sample(x).role}>{p.mark([x, .5], sample(x).role, '', role === 'candidate')}</g>)}</>}</Plot><Facts rows={[[`Left · ${sample(row.lower).id}`,`T=${number(row.lower)}`,sample(row.lower).role],[`Candidate · ${sample(row.candidate).id}`,`T=${number(row.candidate)}`,sample(row.candidate).role],[`Right · ${sample(row.upper).id}`,`T=${number(row.upper)}`,sample(row.upper).role]]}/>{row.panels !== null && <VolumeInterval state={row} target={lab.active.target} />}<p className="nm-status">Row {lab.index + 1}: outer updates {row.outer}, inspected integral calls {calls}; candidate {number(row.candidate)}, radius {number(row.radius)}. {row.panels !== null ? `n=${row.panels}; ${row.sign}; next action: ${row.action}; retained after decision [${row.after.map(v => number(v)).join(',')}].` : `${row.status}.`} {row.status !== 'inner evaluation' ? row.status : ''}</p><Controls lab={lab} fields={[{
      name: 'target',
      label: 'Target volume (L)'
    }, {
      name: 'tolerance',
      label: 'Time tolerance (min)'
    }, {
      name: 'maximum',
      label: 'Maximum inner panels'
    }]}><button type="button" disabled={lab.index === 0} onClick={() => lab.setIndex(i => i - 1)}>Back</button><button type="button" disabled={lab.index === rows.length - 1} onClick={() => lab.setIndex(i => i + 1)}>Step inner/action</button><button type="button" disabled={lab.index === rows.length - 1} onClick={nextOuter}>Next outer</button></Controls><Table caption="Inspected work only; no future rows" headers={['outer', 'T', 'panels', 'estimate ± E', 'action']} rows={rows.slice(0, lab.index + 1).map(r => [r.outer, `${sample(r.candidate).id}: ${number(r.candidate)}`, r.panels ?? '—', r.panels === null ? 'no inner call' : `${number(r.estimate)} ± ${number(r.integralBound)}`, r.action])} /></Figure>;
}
