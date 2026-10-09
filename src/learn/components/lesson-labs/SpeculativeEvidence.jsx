import React, { useState } from 'react';
import {
  Figure,
  Controls,
  Select,
  Slider,
  Readout,
  Table,
  Drawing,
  Wire,
  Box,
  Evidence,
  targetColour,
  draftColour,
  tokenColours,
  fmt,
} from './SpeculativeElements.jsx';

const argmax = (row) => row.indexOf(Math.max(...row));
function LogitComparison({ record }) {
  const points = [...record.actual, ...record.reference],
    low = Math.min(...points),
    high = Math.max(...points),
    scale = 180 / (high - low || 1);
  const y = (v) => 240 - (v - low) * scale,
    x = (i) => 90 + i * 38;
  return (
    <>
      <Drawing
        width={790}
        height={310}
        label="Actual cache and independent full-prefix next-token logits on the same axes"
      >
        <text x="20" y="25" fontSize="16">
          FP64 logits · blue cache ○, amber full-prefix ×
        </text>
        <path d="M70 45V240H760" fill="none" stroke="#aaa" />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <text x="60" y={245 - 180 * t} textAnchor="end" fontSize="14">
              {fmt(low + (high - low) * t, 2)}
            </text>
            <line x1="70" y1={240 - 180 * t} x2="760" y2={240 - 180 * t} stroke="#333" />
          </g>
        ))}
        {record.actual.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r="5" fill="none" stroke={targetColour} strokeWidth="2" />
            <path
              d={`M${x(i) - 4} ${y(record.reference[i]) - 4}l8 8m0 -8l-8 8`}
              stroke={draftColour}
              strokeWidth="1.8"
            />
            <text x={x(i)} y="265" textAnchor="middle" fontSize="12">
              {i}
            </text>
          </g>
        ))}
        <text x="385" y="299" fontSize="16">
          vocabulary ID
        </text>
      </Drawing>
      <Table
        label="Exact retained score operands"
        headers={['ID', 'Cache logit', 'Full reference', 'Absolute difference']}
        rows={record.actual.map((v, i) => [
          i,
          v.toPrecision(17),
          record.reference[i].toPrecision(17),
          fmt(Math.abs(v - record.reference[i])),
        ])}
      />
    </>
  );
}
function CachePane({ data }) {
  const [route, setRoute] = useState('3:true'),
    [comparison, setComparison] = useState('44');
  const [k, poison] = route.split(':'),
    result = data.stages.cache.greedy.find(
      (r) => r.lookahead === Number(k) && String(r.poison) === poison,
    ).result;
  const record = data.journal_evidence.cache[Number(comparison)],
    error = Math.max(...record.actual.map((x, i) => Math.abs(x - record.reference[i])));
  return (
    <>
      <LogitComparison record={record} />
      <Readout>
        Recorded comparison event {record.event_index}; prefix IDs [{record.prefix.join(', ')}].
        Maximum error {fmt(error)}; argmax equality{' '}
        {String(argmax(record.actual) === argmax(record.reference))}. Tolerances 10⁻¹² absolute and
        relative. A tiny nonzero difference is not bitwise equality.
      </Readout>
      <Table
        headers={[
          'Selected greedy route',
          'Returned IDs',
          'Final cache lengths',
          'Stop',
          'Capacity refusal atomic',
        ]}
        rows={[
          [
            `K ${k}, unused poison ${poison}`,
            result.ids.join(', '),
            result.cache_lengths.join(', '),
            result.stop,
            String(data.stages.cache.capacity_atomic),
          ],
        ]}
      />
      <Controls
        reset={() => {
          setRoute('3:true');
          setComparison('44');
        }}
      >
        <Select
          label="Retained greedy cache route"
          value={route}
          onChange={setRoute}
          options={data.stages.cache.greedy.map((r) => [
            `${r.lookahead}:${r.poison}`,
            `K ${r.lookahead}, ${r.poison ? 'poisoned' : 'clean'}`,
          ])}
        />
        <Select
          label="Retained score comparison"
          value={comparison}
          onChange={setComparison}
          options={[
            ['0', 'Continuing next-score event 18'],
            ['44', 'Rollback: 0 candidate rows retained'],
            ['45', 'Rollback: 2 candidate rows retained'],
          ]}
        />
      </Controls>
    </>
  );
}
export function CacheParity() {
  return (
    <Figure id="D18" label="Retained actual cache parity">
      <Evidence>{(data) => <CachePane data={data} />}</Evidence>
    </Figure>
  );
}

function NativePane({ data }) {
  const [mode, setMode] = useState('sample'),
    [round, setRound] = useState('0'),
    [condition, setCondition] = useState('supported');
  const native = data.stages.native,
    failed = mode === 'greedy';
  const failedRound = native.failed_greedy_events.find(
    (r) => r.event === 'native-round-update',
  )?.round;
  const row = native.rows[0],
    rounds = failed ? [failedRound] : row.work.rounds,
    current = rounds[Math.min(Number(round), rounds.length - 1)];
  const error = native.failed_greedy.failure.trim().split('\n').at(-1);
  return (
    <>
      <Drawing
        width={970}
        height={315}
        label="Actual native generate call and candidate-to-verification-to-crop data path"
      >
        <Box x={20} y={45} w={240} label="target: Pythia, six blocks" colour={targetColour} />
        <Box x={20} y={185} w={240} label="assistant: copied three blocks" colour={draftColour} />
        <Wire x1={260} y1={63} x2={350} y2={123} colour={targetColour} />
        <Wire x1={260} y1={203} x2={350} y2={147} colour={draftColour} />
        <Box
          x={355}
          y={112}
          w={270}
          h={50}
          label="generate(assistant_model=draft)"
          colour={targetColour}
        />
        <Wire x1={625} y1={136} x2={690} y2={136} />
        <Box
          x={695}
          y={112}
          w={250}
          h={50}
          label="test → emit → crop caches"
          colour={targetColour}
        />
        <text x="310" y="225" fontSize="15">
          candidate q rows → K + 1 target score rows
        </text>
        <text x="20" y="285" fontSize="15">
          Fixed K = 3; constant schedule; confidence = 0; ensemble = None; batch = 1.
        </text>
      </Drawing>
      {condition !== 'supported' ? (
        <Readout>
          {condition === 'batch'
            ? 'Unavailable route: this pinned assisted call requires batch size one.'
            : 'Unavailable route: a static cache is not supported by the inspected assisted-generation branch.'}{' '}
          This is a source-checked restriction, not a newly attempted model call.
        </Readout>
      ) : (
        <>
          <Readout>
            {failed
              ? `Original greedy diagnostic failed during its second candidate round: ${error} No complete greedy response or valid response timing exists.`
              : 'The sampled diagnostic completed eight outputs over seven rounds using the default-created/reused DynamicCache.'}
          </Readout>
          <p>Prompt IDs: [{(current?.prefix_ids ?? row.prompt_ids).join(', ')}]</p>
          <Table
            headers={['Candidate position', 'ID', 'Actual selected q', 'Actual selected p']}
            rows={(current?.candidate_ids ?? []).map((id, i) => [
              i + 1,
              id,
              fmt(current.q_selected?.[i]),
              fmt(current.p_selected_candidates?.[i]),
            ])}
          />
          <Table
            headers={[
              'Emitted this round',
              'Proposal score shape',
              'Target score shape',
              'Target cache after crop',
            ]}
            rows={[
              [
                current?.emitted_ids?.join(', ') ?? 'not returned',
                current?.proposal_score_shape?.join(' × ') ?? 'not returned',
                current?.processed_target_score_shape?.join(' × ') ?? 'not returned',
                current?.target_cache_after_crop ?? 'not recorded',
              ],
            ]}
          />
          <Readout>
            Configuration correction: explicit cache_implementation="dynamic" conflicted with an
            existing assistant cache; the continuation uses None. The failed greedy attempt was
            retained and not rerun. A separate constructed native endpoint probe accepted p = 0, q =
            1 at u = 0 under ≤; the strict reference rejects.
          </Readout>
        </>
      )}
      <Controls
        reset={() => {
          setMode('sample');
          setRound('0');
          setCondition('supported');
        }}
      >
        <Select
          label="Recorded diagnostic"
          value={mode}
          onChange={(v) => {
            setMode(v);
            setRound('0');
          }}
          options={[
            ['sample', 'Completed sampled diagnostic'],
            ['greedy', 'Original failed greedy diagnostic'],
          ]}
        />
        <Select
          label="Recorded round"
          value={String(Math.min(Number(round), rounds.length - 1))}
          onChange={setRound}
          disabled={failed || condition !== 'supported'}
          options={rounds.map((_, i) => [String(i), String(i + 1)])}
        />
        <Select
          label="Native configuration boundary"
          value={condition}
          onChange={setCondition}
          options={[
            ['supported', 'Supported batch-one route'],
            ['batch', 'Unsupported batch > 1'],
            ['static', 'Unsupported static cache'],
          ]}
        />
      </Controls>
    </>
  );
}
export function NativeCall() {
  return (
    <Figure id="D29" label="Actual native call, failure and crop">
      <Evidence>{(data) => <NativePane data={data} />}</Evidence>
    </Figure>
  );
}

function MeasurementPane({ data }) {
  const [mode, setMode] = useState('greedy'),
    [prompt, setPrompt] = useState('all'),
    [unit, setUnit] = useState('whole');
  const rows = data.stages.study.records.filter(
    (r) => r.mode === mode && (prompt === 'all' || r.prompt_id === prompt),
  );
  const value = (r) => (unit === 'whole' ? r.elapsed_ns / 1e6 : r.ns_per_emitted_token / 1e6),
    maximum = Math.max(...rows.map(value)) * 1.08;
  const arms = [0, 1, 3, 5],
    x = (k) => 150 + arms.indexOf(k) * 190,
    y = (v) => 275 - (220 * v) / maximum;
  return (
    <>
      <Drawing
        width={870}
        height={355}
        label={`Every retained ${mode} ${unit === 'whole' ? 'whole-call' : 'per-output-token'} timing point`}
      >
        <text x="65" y="25" fontSize="16">
          {unit === 'whole' ? 'Whole-call milliseconds' : 'Milliseconds per emitted ID'} · each
          point is one actual call
        </text>
        <path d="M80 45V275H830" stroke="#aaa" fill="none" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1="80" y1={275 - t * 220} x2="830" y2={275 - t * 220} stroke="#333" />
            <text x="68" y={280 - t * 220} textAnchor="end" fontSize="14">
              {fmt(maximum * t, 1)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => (
          <g key={`${r.prompt_id}:${r.lookahead}:${r.repetition}`}>
            <circle
              cx={x(r.lookahead) + (Number(r.prompt_id.at(-1)) - 2.5) * 10 + r.repetition * 3}
              cy={y(value(r))}
              r="5"
              fill={tokenColours[r.repetition]}
              stroke="#fff"
              strokeWidth=".7"
            >
              <title>{`${r.prompt_id}, K${r.lookahead}, repeat${r.repetition}: ${value(r)} ms`}</title>
            </circle>
          </g>
        ))}
        {arms.map((k) => (
          <text key={k} x={x(k)} y="310" textAnchor="middle" fontSize="16">
            {k ? `K = ${k}` : 'Target only'}
          </text>
        ))}
        <text x="80" y="345" fontSize="15">
          Repeat 0 cyan · repeat 1 violet · repeat 2 rose; horizontal offsets separate prompts.
        </text>
      </Drawing>
      <Table
        label="All currently selected measured rows, including outliers"
        headers={['Prompt', 'K', 'Repeat', 'Emitted IDs', 'Call ms', 'ms/ID', 'Paired speedup']}
        rows={rows.map((r) => {
          const paired = data.stages.study.paired.find(
            (p) =>
              p.prompt_id === r.prompt_id &&
              p.mode === r.mode &&
              p.repetition === r.repetition &&
              p.lookahead === r.lookahead,
          );
          return [
            r.prompt_id,
            r.lookahead,
            r.repetition,
            r.ids.length,
            fmt(r.elapsed_ns / 1e6, 3),
            fmt(r.ns_per_emitted_token / 1e6, 4),
            paired ? fmt(paired.whole_call_speedup) : 'baseline',
          ];
        })}
      />
      <Readout>
        {rows.length} measured rows shown. Every retained call emitted 24 IDs. All 72
        speculative/baseline pairs in the complete study were slower; the model weights stayed
        unchanged. Sampled strings need not match. These CPU measurements include common
        forward-hook overhead.
      </Readout>
      <Controls
        reset={() => {
          setMode('greedy');
          setPrompt('all');
          setUnit('whole');
        }}
      >
        <Select
          label="Sampling policy"
          value={mode}
          onChange={setMode}
          options={[
            ['greedy', 'Greedy'],
            ['sample', 'Sampled T = 0.8'],
          ]}
        />
        <Select
          label="Prompt subset"
          value={prompt}
          onChange={setPrompt}
          options={[
            ['all', 'All four prompts'],
            ...['1', '2', '3', '4'].map((n) => [`line-${n}`, `Line ${n}`]),
          ]}
        />
        <Select
          label="Displayed time unit"
          value={unit}
          onChange={setUnit}
          options={[
            ['whole', 'Whole call, ms'],
            ['token', 'Per emitted ID, ms'],
          ]}
        />
      </Controls>
    </>
  );
}
export function PairedObservations() {
  return (
    <Figure id="D30" label="Actual paired CPU measurements">
      <Evidence>{(data) => <MeasurementPane data={data} />}</Evidence>
    </Figure>
  );
}

function WorkPane({ data }) {
  const [mode, setMode] = useState('greedy'),
    [arm, setArm] = useState('3'),
    [round, setRound] = useState('0');
  const summary = data.summary.find((r) => r.mode === mode && r.lookahead === Number(arm)),
    native = data.stages.native.rows[0],
    current = native.work.rounds[Number(round)];
  const max = Math.max(
    summary.target_calls,
    summary.draft_calls,
    summary.target_rows,
    summary.draft_rows,
    1,
  );
  return (
    <>
      <Drawing
        width={860}
        height={300}
        label="Actual aggregate forward calls and input rows measure different kinds of work"
      >
        {[
          ['Target calls', summary.target_calls, targetColour],
          ['Draft calls', summary.draft_calls, draftColour],
          ['Target input rows', summary.target_rows, targetColour],
          ['Draft input rows', summary.draft_rows, draftColour],
        ].map(([label, n, colour], i) => (
          <g key={label}>
            <text x="20" y={60 + i * 60} fontSize="15">
              {label}
            </text>
            <rect
              x="195"
              y={38 + i * 60}
              width={(560 * n) / max}
              height="30"
              fill={colour}
              fillOpacity=".65"
            />
            <text x={205 + (560 * n) / max} y={59 + i * 60} fontSize="15">
              {n}
            </text>
          </g>
        ))}
        <text x="20" y="292" fontSize="15">
          Sum over 12 measured calls for this mode/arm; calls and input rows are separate counts.
        </text>
      </Drawing>
      <Table
        headers={[
          'Native sampled diagnostic round',
          'Candidates',
          'Emitted',
          'Score rows',
          'Cache after crop',
          'Post-stop internal n_matches',
        ]}
        rows={[
          [
            Number(round) + 1,
            current.candidate_ids.length,
            current.emitted_ids.length,
            current.processed_target_score_shape[1],
            current.target_cache_after_crop,
            current.native_post_stop_n_matches,
          ],
        ]}
      />
      <p>
        Candidate IDs: [{current.candidate_ids.join(', ')}] → emitted IDs: [
        {current.emitted_ids.join(', ')}].
      </p>
      <Readout>
        The detailed round comes from the separate eight-output sampled diagnostic. The timing study
        retains forward counters and IDs but no rich per-round trace. Native post-stop n_matches
        equals emitted count − 1 here; it is not relabelled as literal accepted proposals.
      </Readout>
      <Controls
        reset={() => {
          setMode('greedy');
          setArm('3');
          setRound('0');
        }}
      >
        <Select
          label="Measured mode"
          value={mode}
          onChange={setMode}
          options={[
            ['greedy', 'Greedy'],
            ['sample', 'Sampled'],
          ]}
        />
        <Select
          label="Measured arm"
          value={arm}
          onChange={setArm}
          options={['0', '1', '3', '5'].map((x) => [x, x === '0' ? 'Target only' : `K = ${x}`])}
        />
        <Select
          label="Separate diagnostic round"
          value={round}
          onChange={setRound}
          options={native.work.rounds.map((_, i) => [String(i), String(i + 1)])}
        />
      </Controls>
    </>
  );
}
export function WorkLedger() {
  return (
    <Figure id="D31" label="Measured work and separately recorded native round">
      <Evidence>{(data) => <WorkPane data={data} />}</Evidence>
    </Figure>
  );
}

export function TokenizerBoundary() {
  const [mode, setMode] = useState('cross');
  const text = mode === 'cross' ? 'unhappy' : 'unhappiness';
  const target =
    mode === 'cross'
      ? [
          [0, 2, '12: un'],
          [2, 7, '49: happy'],
        ]
      : [
          [0, 2, '12: un'],
          [2, 7, '50: happi'],
          [7, 11, '81: ness'],
        ];
  const draft =
    mode === 'cross'
      ? [
          [0, 3, '7: unh'],
          [3, 7, '31: appy'],
        ]
      : [
          [0, 3, '7: unh'],
          [3, 11, '44: appiness'],
        ];
  return (
    <Figure id="D32" label="Character spans connect incompatible token IDs">
      <Drawing
        width={980}
        height={305}
        label="Constructed tokenizations align by character spans, not integer IDs"
      >
        {[...text].map((char, i) => (
          <text key={i} x={190 + i * 62} y="45" textAnchor="middle" fontSize="23">
            {char}
          </text>
        ))}
        {[
          ['Target', target, targetColour, 95],
          ['Draft', draft, draftColour, 200],
        ].map(([name, tokens, colour, y]) => (
          <g key={name}>
            <text x="20" y={y + 30} fontSize="16" style={{ fill: colour }}>
              {name}
            </text>
            {tokens.map(([start, end, label]) => (
              <g key={start}>
                <rect
                  x={160 + start * 62}
                  y={y}
                  width={(end - start) * 62 - 8}
                  height="48"
                  fill="#191919"
                  stroke={colour}
                  strokeWidth="2"
                />
                <text
                  x={160 + (start + end) * 31 - 4}
                  y={y + 30}
                  textAnchor="middle"
                  fontSize="16"
                  style={{ fill: colour }}
                >
                  {label}
                </text>
                <line
                  x1={160 + start * 62}
                  y1="57"
                  x2={160 + start * 62}
                  y2={y}
                  stroke={colour}
                  strokeDasharray="3 4"
                />
              </g>
            ))}
          </g>
        ))}
        <text x="20" y="287" fontSize="15">
          Numbers are invented IDs in two separate vocabularies. Dashed guides mark character
          boundaries.
        </text>
      </Drawing>
      <Readout>
        {mode === 'cross'
          ? 'The target boundary after “un” crosses the draft piece “unh”. No direct integer-ID substitution preserves the text segmentation.'
          : 'After changing the ending to “unhappiness”, both tokenizations revise their suffix pieces. Re-encoding can invalidate more than the final old ID.'}{' '}
        This depicts the alignment problem; maintained universal assisted decoding owns the general
        algorithm.
      </Readout>
      <Controls reset={() => setMode('cross')}>
        <Select
          label="Text and boundaries"
          value={mode}
          onChange={setMode}
          options={[
            ['cross', 'unhappy'],
            ['changed', 'unhappiness'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
export function ResourceCompetition() {
  const [mode, setMode] = useState('shared');
  const shared = mode === 'shared';
  return (
    <Figure id="D33" label="Draft work competes with other requests">
      <Drawing
        width={930}
        height={330}
        label="Constructed compute schedule and independent cache occupancy"
      >
        <text x="180" y="25" fontSize="16">
          Constructed time units, not measured service latency
        </text>
        {[0, 1, 2, 3, 4, 5, 6].map((t) => (
          <text key={t} x={190 + t * 95} y="53" textAnchor="middle" fontSize="14">
            {t}
          </text>
        ))}
        <text x="15" y="105" fontSize="15">
          Target resource
        </text>
        {(shared
          ? [
              ['A draft', 0, 2, draftColour],
              ['B target', 2, 4, tokenColours[1]],
              ['A verify', 4, 6, targetColour],
            ]
          : [
              ['B target', 0, 2, tokenColours[1]],
              ['A verify', 2, 4, targetColour],
            ]
        ).map(([label, start, end, colour]) => (
          <g key={label}>
            <rect
              x={190 + start * 95}
              y="75"
              width={(end - start) * 95 - 6}
              height="48"
              fill={colour}
              fillOpacity=".35"
              stroke={colour}
            />
            <text x={190 + (start + end) * 47.5 - 3} y="105" textAnchor="middle" fontSize="16">
              {label}
            </text>
          </g>
        ))}
        <text x="15" y="181" fontSize="15">
          Separate draft
        </text>
        {!shared && (
          <>
            <rect
              x="190"
              y="151"
              width="184"
              height="48"
              fill={draftColour}
              fillOpacity=".35"
              stroke={draftColour}
            />
            <text x="282" y="181" textAnchor="middle" fontSize="16">
              A draft
            </text>
          </>
        )}
        <text x="20" y="242" fontSize="16">
          Cache allocations coexist:
        </text>
        <Box x={280} y={220} w={180} label="A target K/V" colour={targetColour} />
        <Box x={470} y={220} w={180} label="A draft K/V" colour={draftColour} />
        <Box x={660} y={220} w={180} label="B target K/V" colour={tokenColours[1]} />
        <text x="20" y="305" fontSize="15">
          Changing compute placement does not make the assistant's weights or K/V disappear.
        </text>
      </Drawing>
      <Readout>
        {shared
          ? 'A’s draft occupies the shared compute resource before B can run. B completes at time 4 and A at 6 in this constructed serial schedule.'
          : 'With a separate available draft resource, B and A’s draft overlap; B completes at 2 and A verification at 4.'}{' '}
        Different hardware, queueing or memory limits can reverse the benefit; no optimal-policy
        claim follows.
      </Readout>
      <Controls reset={() => setMode('shared')}>
        <Select
          label="Constructed resource placement"
          value={mode}
          onChange={setMode}
          options={[
            ['shared', 'Draft shares the busy resource'],
            ['separate', 'Separate idle draft resource'],
          ]}
        />
      </Controls>
    </Figure>
  );
}
