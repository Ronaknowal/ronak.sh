import React, { useEffect, useMemo, useRef, useState } from 'react';
import { softmax, filter, temperature, sum } from '../../data/decoding-strategies-models.js';
import {
  Figure,
  Controls,
  Select,
  Slider,
  Local,
  Bars,
  Strip,
  Readout,
  Table,
  colours,
  fmt,
  vector,
} from './DecodingElements.jsx';
const asset = '/learn-assets/decoding-strategies/';
const evidence = '/learn-code/decoding-strategies/evidence/';
const cache = new Map();
export function Recorded({ url, children }) {
  return (
    <RecordedSource key={url} url={url}>
      {children}
    </RecordedSource>
  );
}
function RecordedSource({ url, children }) {
  const ref = useRef(null),
    [near, setNear] = useState(false),
    [attempt, setAttempt] = useState(0),
    [state, setState] = useState({ data: cache.get(url), error: false });
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return;
    if (cache.has(url)) {
      setState({ data: cache.get(url), error: false });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, error: false });
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok || !response.headers.get('content-type')?.includes('json'))
          throw Error('Evidence unavailable');
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          cache.set(url, data);
          setState({ data, error: false });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ data: null, error: true });
      });
    return () => controller.abort();
  }, [url, near, attempt]);
  return (
    <div ref={ref}>
      {state.data ? (
        children(state.data)
      ) : state.error ? (
        <p role="alert">
          Saved evidence could not load.{' '}
          <button type="button" onClick={() => setAttempt((a) => a + 1)}>
            Retry
          </button>
        </p>
      ) : (
        <p role="status">
          {near ? 'Loading saved evidence…' : 'Saved evidence loads as this figure approaches.'}
        </p>
      )}
    </div>
  );
}
export function CorpusCounts() {
  return (
    <Figure id="D21" label="Fitted bigram counts">
      <Recorded url={asset + 'counts.json'}>{(data) => <CountRows data={data} />}</Recorded>
    </Figure>
  );
}
function CountRows({ data }) {
  const [context, setContext] = useState('455');
  const rows = data.counts[context] || {},
    total = sum(Object.values(rows)),
    denominator = total + data.alpha * data.vocabulary.length;
  const ids = Object.keys(rows)
    .map(Number)
    .sort((a, b) => rows[b] - rows[a] || a - b);
  const show = ids.slice(0, 8);
  if (context === '455' && !show.includes(data.vocabulary.indexOf('rabbit')))
    show.push(data.vocabulary.indexOf('rabbit'));
  if (!show.length) show.push(0, 1, 2, 3, 4);
  return (
    <>
      <p>Actual training text begins: “Alice was beginning to get very tired”.</p>
      <Strip values={['alice', 'was', 'beginning', 'to', 'get', 'very', 'tired']} />
      <Strip
        values={['adjacent pairs', 'alice → was', 'was → beginning', 'count context → next']}
      />
      <Table
        headers={['Context', 'Next token / ID', 'Observed count', 'Smoothed count', 'p']}
        rows={show.map((id) => [
          context === 'BOS' ? 'BOS' : data.vocabulary[Number(context)],
          `${data.vocabulary[id]} / ${id}`,
          rows[id] || 0,
          fmt((rows[id] || 0) + data.alpha),
          fmt(((rows[id] || 0) + data.alpha) / denominator),
        ])}
      />
      <Bars
        p={show.map((id) => ((rows[id] || 0) + data.alpha) / denominator)}
        names={show.map((id) => data.vocabulary[id])}
        label="Selected entries, full-vocabulary normalization"
      />
      <Controls reset={() => setContext('455')}>
        <Select
          label="Observed context"
          value={context}
          onChange={setContext}
          options={['455', '32', '22', '0', 'BOS'].map((id) => [
            id,
            id === 'BOS' ? 'BOS' : `${data.vocabulary[Number(id)]} (ID ${id})`,
          ])}
        />
      </Controls>
      <Readout>
        Vocabulary {data.vocabulary.length}; α={data.alpha}; total observed outgoing count {total};
        denominator {total} + {data.alpha} × {data.vocabulary.length} = {fmt(denominator)}.{' '}
        {total === 0 ? 'Unseen context: uniform output row.' : ''} The table is a selected slice;
        normalization includes every vocabulary entry.
      </Readout>
    </>
  );
}
const models = [
  ['count', 'Count model'],
  ['native', 'Pythia-14M'],
];
const methods = [
  'greedy',
  'beam2',
  'beam4',
  'temperature07',
  'temperature10',
  'temperature13',
  'top_k20',
  'top_p09',
  'min_p005',
];
function RecordPicker({
  records,
  model,
  setModel,
  prompt,
  setPrompt,
  method,
  setMethod,
  seed,
  setSeed,
  fixedModel = false,
}) {
  const selected = records.filter(
    (r) => r.model === (model === 'count' ? 'smoothed_word_bigram' : 'pythia-14m'),
  );
  const prompts = [...new Map(selected.map((r) => [r.prompt.id, r.prompt])).values()];
  const available = [...new Set(selected.map((r) => r.method.name))];
  const seeds = selected
    .filter((r) => r.prompt.id === prompt && r.method.name === method)
    .map((r) => r.seed);
  return (
    <>
      {!fixedModel && <Select label="Model" value={model} onChange={setModel} options={models} />}
      <Select
        label="Prompt"
        value={prompt}
        onChange={setPrompt}
        options={prompts.map((p) => [p.id, p.id])}
      />
      <Select
        label="Method"
        value={method}
        onChange={setMethod}
        options={available.map((m) => [m, m])}
      />
      {seeds.some((s) => s !== null) && (
        <Select
          label="Seed"
          value={seed}
          onChange={(v) => setSeed(Number(v))}
          options={seeds.map((s) => [s, s])}
        />
      )}
    </>
  );
}
function choose(records, model, prompt, method, seed) {
  return records.find(
    (r) =>
      r.model === (model === 'count' ? 'smoothed_word_bigram' : 'pythia-14m') &&
      r.prompt.id === prompt &&
      r.method.name === method &&
      (r.seed === null || r.seed === seed),
  );
}
export function ScratchTrace() {
  return (
    <Figure id="D22" label="Actual count-model decoding trace">
      <Recorded url={asset + 'outputs.json'}>
        {(records) => <ScratchChoice records={records} />}
      </Recorded>
    </Figure>
  );
}
function ScratchChoice({ records }) {
  const [prompt, setPrompt] = useState('heldout-line-2'),
    [method, setMethod] = useState('greedy'),
    [seed, setSeed] = useState(17),
    [step, setStep] = useState(0);
  const row = choose(records, 'count', prompt, method, seed);
  return (
    <>
      {row && (
        <Recorded url={evidence + 'count/' + row.run_id + '.json'}>
          {(record) => (
            <Recorded url={asset + 'counts.json'}>
              {(counts) => {
                const i = Math.min(step, record.steps.length - 1),
                  s = record.steps[i],
                  context = s.prefix_ids?.at(-1) ?? record.prompt_ids.at(-1);
                return (
                  <>
                    <p>Prompt: {record.prompt.prompt}</p>
                    <Strip
                      values={record.ids.map((id) => counts.vocabulary[id])}
                      identities={record.ids}
                      selected={i}
                    />
                    <p>
                      Current prefix IDs: {(s.prefix_ids || record.prompt_ids).join(', ')}. Last
                      context: {counts.vocabulary[context]}.
                    </p>
                    <Table
                      headers={[
                        'Selected token',
                        'p',
                        'q',
                        'draw u',
                        'accumulated log p',
                        'log q',
                        'support',
                      ]}
                      rows={[
                        [
                          counts.vocabulary[s.selected_id],
                          fmt(Math.exp(s.log_p)),
                          s.log_q === null ? 'not categorical' : fmt(Math.exp(s.log_q)),
                          fmt(s.uniform),
                          fmt(sum(record.steps.slice(0, i + 1).map((x) => x.log_p))),
                          s.log_q === null
                            ? 'not categorical'
                            : fmt(sum(record.steps.slice(0, i + 1).map((x) => x.log_q))),
                          s.support,
                        ],
                      ]}
                    />
                    {s.top && (
                      <Table
                        headers={['ID/token', 'model p', 'decoder q']}
                        rows={s.top.map((t) => [
                          `${t.id}: ${counts.vocabulary[t.id]}`,
                          fmt(t.p),
                          fmt(t.q),
                        ])}
                      />
                    )}
                    <p>Stop: {record.stop_reason}. Complete saved text:</p>
                    <pre className="decoding-output">
                      {record.text || '(Empty printed content; emitted EOS.)'}
                    </pre>
                    {record.beam && (
                      <p>
                        Beam width {record.beam.width}; retained ancestry and frontier are in the
                        complete record; q is not a local categorical distribution.
                      </p>
                    )}
                    <Slider
                      label="Recorded token step"
                      min={0}
                      max={record.steps.length - 1}
                      step={1}
                      value={i}
                      onChange={setStep}
                    />
                    <p>
                      <a href={evidence + 'count/' + row.run_id + '.json'}>Complete saved trace</a>
                    </p>
                  </>
                );
              }}
            </Recorded>
          )}
        </Recorded>
      )}
      <Controls
        reset={() => {
          setPrompt('heldout-line-2');
          setMethod('greedy');
          setSeed(17);
          setStep(0);
        }}
      >
        <RecordPicker
          records={records}
          model="count"
          fixedModel
          setModel={() => {}}
          prompt={prompt}
          setPrompt={setPrompt}
          method={method}
          setMethod={setMethod}
          seed={seed}
          setSeed={setSeed}
        />
      </Controls>
    </>
  );
}
export function NativePipeline() {
  return (
    <Figure id="D24" label="Actual native first-step pipeline">
      <Recorded url={asset + 'index.json'}>{(index) => <NativeChoice index={index} />}</Recorded>
    </Figure>
  );
}
function NativeChoice({ index }) {
  const [prompt, setPrompt] = useState(0),
    [method, setMethod] = useState('temperature10');
  return (
    <>
      <Recorded url={index.first_steps[prompt].url}>
        {(data) => <NativeRow data={data} method={method} />}
      </Recorded>
      <Controls
        reset={() => {
          setPrompt(0);
          setMethod('temperature10');
        }}
      >
        <Select
          label="Saved prompt row"
          value={prompt}
          onChange={(v) => setPrompt(Number(v))}
          options={index.first_steps.map((p, i) => [i, p.id])}
        />
        <Select
          label="Configured sampling strategy"
          value={method}
          onChange={setMethod}
          options={methods
            .filter((m) => !m.startsWith('beam') && m !== 'greedy')
            .map((m) => [m, m])}
        />
      </Controls>
      <p>
        <a href={index.first_steps[prompt].url}>Full 50,304-score row</a> · reconstructed in browser
        double precision, no model call.
      </p>
    </>
  );
}
function NativeRow({ data, method }) {
  const [id, setId] = useState(436);
  const result = useMemo(() => {
    const p = softmax(data.logits),
      t = method === 'temperature07' ? 0.7 : method === 'temperature13' ? 1.3 : 1;
    const heated = temperature(p, t);
    const rule =
      method === 'top_k20'
        ? ['k', 20]
        : method === 'top_p09'
          ? ['p', 0.9]
          : method === 'min_p005'
            ? ['min', 0.05]
            : null;
    const filtered = rule
      ? filter(heated, ...rule)
      : { q: heated, mask: p.map(() => true), mass: 1 };
    const top = p
      .map((value, i) => [value, i])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 8)
      .map((r) => r[1]);
    return { p, t, heated, ...filtered, top };
  }, [data, method]);
  const selected = Math.max(0, Math.min(data.logits.length - 1, id));
  return (
    <>
      <p>{data.prompt.prompt}</p>
      <Strip
        values={[
          '50,304 logits',
          `temperature ${result.t}`,
          method === 'top_k20' ? 'top-k 20' : 'top-k disabled',
          method === 'top_p09' ? 'top-p 0.9' : 'top-p disabled',
          method === 'min_p005' ? 'min-p 0.05' : 'min-p disabled',
          'normalize q',
        ]}
      />
      <Table
        headers={['ID', 'raw logit', 'model p', 'after T', 'kept?', 'q']}
        rows={[...new Set([...result.top, selected])].map((i) => [
          i,
          fmt(data.logits[i]),
          fmt(result.p[i]),
          fmt(result.heated[i]),
          result.mask[i] ? 'yes' : 'no',
          fmt(result.q[i]),
        ])}
      />
      <div className="decoding-columns">
        <Bars
          p={result.top.map((i) => result.p[i])}
          names={result.top.map((i) => `ID ${i}`)}
          label="Original p, top eight IDs"
        />
        <Bars
          p={result.top.map((i) => result.q[i])}
          names={result.top.map((i) => `ID ${i}`)}
          label="Processed q, same eight IDs"
        />
      </div>
      <label>
        Inspect token ID{' '}
        <input
          type="number"
          min="0"
          max="50303"
          step="1"
          value={selected}
          onChange={(e) => {
            if (e.target.value !== '' && e.target.checkValidity()) setId(Number(e.target.value));
          }}
        />
      </label>
      <Readout>
        ID {selected}: raw score {fmt(data.logits[selected])}; processed score{' '}
        {result.mask[selected] ? fmt(data.logits[selected] / result.t) : '−Infinity (excluded)'}.
        Retained support {result.mask.filter(Boolean).length}, intermediate mass {fmt(result.mass)}.
        Displayed p/q use the complete row; table shows only inspected entries.
      </Readout>
    </>
  );
}
export function BeamAncestry() {
  return (
    <Figure id="D25" label="Recorded native beam ancestry">
      <Recorded url={asset + 'beam.json'}>{(data) => <BeamRecord data={data} />}</Recorded>
    </Figure>
  );
}
function BeamRecord({ data }) {
  const [step, setStep] = useState(7);
  const s = data.steps[step];
  return (
    <>
      <Local label="Recorded parent beam at each emitted token">
        <svg
          viewBox="0 0 820 240"
          role="img"
          aria-label="Time columns following actual native parent beam indices"
        >
          {data.steps.map((row, i) => (
            <g key={i}>
              {i > 0 && (
                <path
                  d={`M${35 + (i - 1) * 98} ${65 + data.steps[i - 1].parent_beam * 50}L${35 + i * 98} ${65 + row.parent_beam * 50}`}
                  stroke={i <= step ? 'white' : '#888'}
                  strokeWidth="2"
                />
              )}
              <circle
                cx={35 + i * 98}
                cy={65 + row.parent_beam * 50}
                r="10"
                fill={colours[row.parent_beam % 5]}
                stroke={i === step ? 'white' : colours[row.parent_beam % 5]}
                strokeWidth="3"
              />
              <text x={35 + i * 98} y="25" textAnchor="middle" fontSize="14">
                t={i}
              </text>
              <text x={35 + i * 98} y="190" textAnchor="middle" fontSize="14">
                ID {row.selected_id}
              </text>
              <text x={35 + i * 98} y="218" textAnchor="middle" fontSize="14">
                parent {row.parent_beam}
              </text>
            </g>
          ))}
        </svg>
      </Local>
      <Table
        headers={['Step', 'Parent', 'ID', 'Native raw log p', 'Processed score']}
        rows={data.steps.map((r) => [
          r.position,
          r.parent_beam,
          r.selected_id,
          fmt(r.log_p, 8),
          fmt(r.processed_transition_score, 8),
        ])}
      />
      <Controls reset={() => setStep(7)}>
        <Slider
          label="Inspect recorded step"
          min={0}
          max={7}
          step={1}
          value={step}
          onChange={setStep}
        />
      </Controls>
      <Readout>
        Step {step}: parent beam {s.parent_beam}, ID {s.selected_id}. Eight generated tokens,
        capped; α=1. Returned score {fmt(data.sequence_score, 9)}, reconstructed{' '}
        {fmt(data.reconstructed_sequence_score, 9)}. Beam q is not categorical. The drawn line
        follows the returned final path, not every discarded native hypothesis.
      </Readout>
    </>
  );
}
export function OutputComparison() {
  return (
    <Figure id="D26" label="Actual output comparison">
      <Recorded url={asset + 'outputs.json'}>{(records) => <Outputs records={records} />}</Recorded>
    </Figure>
  );
}
function Output({ row }) {
  const pairs = row.ids.slice(0, -1).map((x, i) => `${x},${row.ids[i + 1]}`),
    repeated = new Set(pairs.filter((p, i) => pairs.indexOf(p) !== i));
  return (
    <div>
      <p>
        {row.method.name} · seed {row.seed ?? 'not used'} · {row.stop_reason} · {row.ids.length}{' '}
        generated tokens
      </p>
      <pre className="decoding-output">
        {row.text || '(Empty printed continuation: EOS emitted.)'}
      </pre>
      <div className="decoding-token-row">
        {row.ids.map((id, i) => (
          <span
            className="decoding-token"
            key={i}
            style={{
              '--entity':
                repeated.has(pairs[i]) || repeated.has(pairs[i - 1]) ? colours[2] : colours[0],
            }}
          >
            {i}: {id}
          </span>
        ))}
      </div>
      <p>
        Amber marks positions belonging to a repeated token-ID bigram. IDs expose actual boundaries;
        complete returned text above preserves whitespace.
      </p>
    </div>
  );
}
function Outputs({ records }) {
  const [model, setModel] = useState('count'),
    [prompt, setPrompt] = useState('heldout-line-2'),
    [method, setMethod] = useState('greedy'),
    [other, setOther] = useState('beam4'),
    [seed, setSeed] = useState(17);
  const a = choose(records, model, prompt, method, seed),
    b = choose(records, model, prompt, other, seed);
  const available = [...new Set(records.map((r) => r.method.name))];
  return (
    <>
      <p>Prompt: {a?.prompt.prompt}</p>
      <div className="decoding-columns">
        {a && <Output row={a} />} {b && <Output row={b} />}
      </div>
      <Controls
        reset={() => {
          setModel('count');
          setPrompt('heldout-line-2');
          setMethod('greedy');
          setOther('beam4');
          setSeed(17);
        }}
      >
        <RecordPicker
          records={records}
          model={model}
          setModel={setModel}
          prompt={prompt}
          setPrompt={setPrompt}
          method={method}
          setMethod={setMethod}
          seed={seed}
          setSeed={setSeed}
        />
        <Select
          label="Compare method"
          value={other}
          onChange={setOther}
          options={available.map((m) => [m, m])}
        />
      </Controls>
      <Readout>
        Only existing records are selected. No generation, replacement samples, or unrecorded
        quality score. EOS counts as a generated token, but is excluded from content diversity.
      </Readout>
    </>
  );
}
export function MeasuredTradeoffs() {
  return (
    <Figure id="D27" label="All retained per-sequence measurements">
      <Recorded url={asset + 'observations.json'}>
        {(data) => <Measurements data={data} />}
      </Recorded>
    </Figure>
  );
}
function DataPoint({ x, y, index, selected, label }) {
  const common = { fill: colours[index % 5], stroke: selected ? 'white' : 'none', strokeWidth: 2 };
  return index < 5 ? (
    <circle cx={x} cy={y} r={selected ? 7 : 4} {...common}>
      <title>{label}</title>
    </circle>
  ) : (
    <rect
      x={x - (selected ? 6 : 3)}
      y={y - (selected ? 6 : 3)}
      width={selected ? 12 : 6}
      height={selected ? 12 : 6}
      {...common}
    >
      <title>{label}</title>
    </rect>
  );
}
function DecisionScatter({ rows, methods, selected }) {
  const eligible = rows.filter((r) => r.mean_local_entropy !== null),
    maxH = Math.max(1, ...eligible.map((r) => r.mean_local_entropy)) * 1.08,
    maxS = Math.max(1, ...eligible.map((r) => r.mean_support)) * 1.08;
  return (
    <Local label="Actual local decision entropy and support">
      <svg
        viewBox="0 0 720 345"
        role="img"
        aria-label="Mean local support versus mean local entropy"
      >
        <path d="M85 30V270H670" fill="none" stroke="#aaa" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <text x="73" y={275 - t * 235} textAnchor="end" fontSize="14">
              {fmt(t * maxS, 0)}
            </text>
            <text x={85 + t * 580} y="296" textAnchor="middle" fontSize="14">
              {fmt(t * maxH, 1)}
            </text>
          </g>
        ))}
        <text x="85" y="19" fontSize="15">
          mean eligible support, token IDs
        </text>
        <text x="360" y="326" textAnchor="middle" fontSize="15">
          mean local decision entropy, nats
        </text>
        {eligible.map((r) => (
          <DataPoint
            key={r.run_id}
            x={85 + (r.mean_local_entropy / maxH) * 580}
            y={270 - (r.mean_support / maxS) * 235}
            index={methods.indexOf(r.method)}
            selected={r === selected}
            label={r.run_id}
          />
        ))}
      </svg>
      <p>
        {rows.length - eligible.length} beam records have no local categorical entropy and are
        excluded from this second plot.
      </p>
    </Local>
  );
}
function Measurements({ data }) {
  const [model, setModel] = useState('count'),
    [method, setMethod] = useState('all'),
    [prompt, setPrompt] = useState('all'),
    [selected, setSelected] = useState(0),
    [fixture, setFixture] = useState('recorded');
  const source = data.rows.filter(
    (r) => r.model === (model === 'count' ? 'smoothed_word_bigram' : 'pythia-14m'),
  );
  const methods = [...new Set(source.map((r) => r.method))],
    prompts = [...new Set(source.map((r) => r.prompt_id))];
  const rows = source.filter(
    (r) =>
      (method === 'all' || r.method === method) && (prompt === 'all' || r.prompt_id === prompt),
  );
  const row = rows[Math.min(selected, rows.length - 1)],
    xmax = Math.max(1, ...rows.map((r) => r.mean_model_nll)) * 1.08;
  return (
    <>
      {fixture === 'recorded' ? (
        <>
          <Local label="Every point is one actual output">
            <svg
              viewBox="0 0 720 375"
              role="img"
              aria-label="Per-output NLL and distinct bigram ratio"
            >
              <path d="M65 25V280H670" fill="none" stroke="#aaa" />
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <g key={t}>
                  <text x="53" y={285 - t * 250} textAnchor="end" fontSize="14">
                    {t}
                  </text>
                  <text x={65 + t * 600} y="307" textAnchor="middle" fontSize="14">
                    {fmt(t * xmax, 1)}
                  </text>
                </g>
              ))}
              <text x="65" y="18" fontSize="15">
                distinct-2 (content token IDs)
              </text>
              <text x="365" y="338" textAnchor="middle" fontSize="15">
                model NLL, nats / this model's token
              </text>
              {rows
                .filter((r) => r.distinct_2 !== null)
                .map((r) => (
                  <DataPoint
                    key={r.run_id}
                    x={65 + (r.mean_model_nll / xmax) * 600}
                    y={280 - r.distinct_2 * 250}
                    selected={row === r}
                    index={methods.indexOf(r.method)}
                    label={r.run_id}
                  />
                ))}
              <text x="65" y="370" fontSize="14">
                Undefined distinct-2 lane: {rows.filter((r) => r.distinct_2 === null).length} empty
                / one-token outputs
              </text>
            </svg>
          </Local>
          <div className="decoding-token-row" aria-label="Method legend">
            {methods.map((name, i) => (
              <span key={name} style={{ color: colours[i % 5] }}>
                {i < 5 ? '●' : '■'} {name}
              </span>
            ))}
          </div>
          <p>
            Undefined distinct-2 records:{' '}
            {rows
              .filter((r) => r.distinct_2 === null)
              .map((r) => r.run_id)
              .join('; ') || 'none'}
            .
          </p>
          <DecisionScatter rows={rows} methods={methods} selected={row} />
          <Table
            headers={['Selected record', 'NLL', 'distinct-2', 'local entropy', 'support']}
            rows={
              row
                ? [
                    [
                      row.run_id,
                      fmt(row.mean_model_nll),
                      fmt(row.distinct_2),
                      row.mean_local_entropy === null
                        ? 'not applicable (beam)'
                        : fmt(row.mean_local_entropy),
                      fmt(row.mean_support),
                    ],
                  ]
                : []
            }
          />
          <pre className="decoding-output">{row?.text || '(Empty printed content.)'}</pre>
        </>
      ) : (
        <Readout>
          Constructed {fixture === 'empty' ? 'empty' : 'one-token'} content has zero bigram
          positions. Distinct-2 is undefined. This is not an additional experimental record.
        </Readout>
      )}
      <Controls
        reset={() => {
          setModel('count');
          setMethod('all');
          setPrompt('all');
          setSelected(0);
          setFixture('recorded');
        }}
      >
        <Select
          label="Model vocabulary"
          value={model}
          onChange={(v) => {
            setModel(v);
            setSelected(0);
          }}
          options={models}
        />
        <Select
          label="Method filter"
          value={method}
          onChange={(v) => {
            setMethod(v);
            setSelected(0);
          }}
          options={[['all', 'All'], ...methods.map((m) => [m, m])]}
        />
        <Select
          label="Prompt filter"
          value={prompt}
          onChange={(v) => {
            setPrompt(v);
            setSelected(0);
          }}
          options={[['all', 'All'], ...prompts.map((p) => [p, p])]}
        />
        <Slider
          label="Inspect actual point"
          min={0}
          max={Math.max(0, rows.length - 1)}
          step={1}
          value={Math.min(selected, rows.length - 1)}
          onChange={setSelected}
          disabled={fixture !== 'recorded'}
        />
        <Select
          label="Data or definition edge"
          value={fixture}
          onChange={setFixture}
          options={[
            ['recorded', 'Actual records'],
            ['empty', 'Constructed empty content'],
            ['one', 'Constructed one-token content'],
          ]}
        />
      </Controls>
      <Readout>
        {rows.length} actual records match these filters. Each model has different token units; do
        not compare per-token NLL across models. No human-quality labels were collected.
      </Readout>
    </>
  );
}
