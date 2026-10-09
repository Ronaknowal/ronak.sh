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
  colours,
  fmt,
  Local,
} from './InferenceEngineElements.jsx';
import {
  qkvPermutation,
  reusablePrefix,
  composedCost,
  nativeRequest,
} from '../../data/inference-engine-models.js';
import nativeInputPieces from '../../data/inference-engine-input-pieces.json';

const requests = Object.keys(colours).map((id) => [id, `Request ${id}`]);

export function EngineBoundaryFigure() {
  const [selected, setSelected] = useState('request');
  return (
    <Figure id="D01" label="Files, process and request connection">
      <Drawing
        width={900}
        height={365}
        label="Client bytes enter a process containing the queue, runner and KV storage. Weights load from a separate file store."
      >
        <rect
          x="220"
          y="20"
          width="655"
          height="315"
          fill="none"
          stroke="#bbb"
          strokeDasharray="6 4"
        />
        <text x="235" y="48" fontSize="17">
          Engine process · owns unfinished requests
        </text>
        <Box
          x={15}
          y={140}
          w={170}
          h={55}
          label="Client connection"
          colour={colours.A}
          selected={selected === 'request'}
        />
        <Box x={255} y={130} w={160} h={65} label="Queue: A, B" colour={colours.A} />
        <Box x={480} y={130} w={150} h={65} label="Model runner" colour={colours.D} />
        <rect x="680" y="115" width="170" height="120" fill="#191919" stroke={colours.B} />
        <text x="695" y="141" fontSize="15" style={{ fill: colours.B }}>
          KV position storage
        </text>
        {[0, 1].map((row) => (
          <g key={row}>
            <text x="689" y={172 + row * 30} fontSize="14">
              {row ? 'V' : 'K'}
            </text>
            {Array.from({ length: 5 }, (_, i) => (
              <rect
                key={i}
                x={715 + i * 25}
                y={154 + row * 30}
                width="20"
                height="24"
                fill="#262138"
                stroke={colours.B}
              />
            ))}
          </g>
        ))}
        <text x="723" y="222" fontSize="13">
          Positions 0…4
        </text>
        <Wire x1={185} y1={158} x2={250} y2={158} colour={colours.A} />
        <Wire x1={415} y1={158} x2={475} y2={158} colour={colours.A} />
        <Wire x1={630} y1={158} x2={675} y2={158} colour={colours.B} />
        <path
          d="M555 200V265H100V200"
          fill="none"
          stroke={colours.A}
          strokeWidth={selected === 'request' ? 3 : 1.5}
        />
        <text x="285" y="290" fontSize="15" style={{ fill: colours.A }}>
          Repeated request path: IDs → scores → selected IDs → bytes
        </text>
        <rect
          x="20"
          y="20"
          width="165"
          height="92"
          fill="#191919"
          stroke={selected === 'load' ? '#fff' : colours.D}
          strokeWidth={selected === 'load' ? 3 : 1.5}
        />
        <text x="40" y="44" fontSize="16" style={{ fill: colours.D }}>
          Weight tensors
        </text>
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 7 }, (_, column) => (
            <rect
              key={`${row}-${column}`}
              x={40 + column * 18}
              y={54 + row * 12}
              width="15"
              height="9"
              fill="#203242"
              stroke={colours.D}
              strokeWidth=".5"
            />
          )),
        )}
        <path
          d="M185 55H555V123"
          fill="none"
          stroke={colours.D}
          strokeWidth={selected === 'load' ? 3 : 1.5}
          strokeDasharray="5 4"
        />
        <text x="275" y="87" fontSize="14" style={{ fill: colours.D }}>
          Startup load · distinct from each request
        </text>
        <text x="22" y="355" fontSize="14">
          Disk files persist after this connection or process ends.
        </text>
      </Drawing>
      <Readout>
        Weights on disk, a running engine and a client connection are separate objects. The
        highlighted path changes emphasis; both paths remain visible.
      </Readout>
      <Controls reset={() => setSelected('request')}>
        <Select
          label="Follow path"
          value={selected}
          onChange={setSelected}
          options={[
            ['request', 'Repeated request'],
            ['load', 'Startup weight load'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function RequestFieldsFigure() {
  const [id, setId] = useState('A');
  const [cap, setCap] = useState(3);
  return (
    <Figure id="D02" label="Literal completion request and result">
      <Evidence>
        {(data) => {
          const row = nativeRequest(data, id);
          return (
            <>
              <Table
                label="Actual native fields, kept distinct from the constructed cap below"
                headers={[
                  'Request field',
                  'Actual supplied value',
                  'Result field',
                  'Recorded value',
                ]}
                rows={[
                  ['prompt', row.input_ids.join(', '), 'content', row.output],
                  ['n_predict', 16, 'output ID count', row.output_ids.length],
                  ['stream', 'true', 'stop_type', row.terminal.stop_type],
                  ['samplers', 'temperature', 'terminal tokens', '[]'],
                ]}
              />
              <Drawing
                width={650}
                height={130}
                label={`Constructed output-slot budget: ${cap} new outputs allowed; this does not alter the recorded native result.`}
              >
                <text x="20" y="28" fontSize="16">
                  Separate constructed cap: maximum new output positions
                </text>
                {Array.from({ length: cap }, (_, i) => (
                  <Box
                    key={i}
                    x={20 + i * 70}
                    y={55}
                    w={58}
                    h={38}
                    label={`+${i + 1}`}
                    colour={colours[id]}
                  />
                ))}
              </Drawing>
              <Readout>
                Native {id} was actually run with cap 16. The editable {cap}-slot example
                illustrates a budget only; EOS can stop before all slots are used.
              </Readout>
            </>
          );
        }}
      </Evidence>
      <Controls
        reset={() => {
          setId('A');
          setCap(3);
        }}
      >
        <Select label="Recorded request" value={id} onChange={setId} options={requests} />
        <Slider
          label="Constructed new-token cap"
          value={cap}
          onChange={setCap}
          min={1}
          max={8}
          step={1}
        />
      </Controls>
    </Figure>
  );
}

export function InputIdentityFigure() {
  const [source, setSource] = useState('authored');
  const [bos, setBos] = useState('no');
  return (
    <Figure id="D03" label="Pieces, token IDs and positions">
      <Evidence>
        {(data) => {
          const actual = source === 'authored' ? null : nativeRequest(data, source);
          const ids = actual ? actual.input_ids : [...(bos === 'yes' ? [1] : []), 11, 12, 13];
          const pieces = actual
            ? actual.terminal.prompt
            : 'Constructed vocabulary: optional BOS=1, then IDs11/12/13';
          return (
            <>
              <p>{pieces}</p>
              <Drawing
                width={Math.max(650, ids.length * 82 + 70)}
                height={180}
                label="Every token ID has its own sequence position, including an inserted special token when present."
              >
                <text x="12" y="33" fontSize="14">
                  Position
                </text>
                <text x="12" y="97" fontSize="14">
                  ID
                </text>
                {ids.map((token, i) => (
                  <g key={i}>
                    <text x={110 + i * 80} y="33" textAnchor="middle" fontSize="16">
                      {i}
                    </text>
                    <Wire x1={110 + i * 80} y1={42} x2={110 + i * 80} y2={64} />
                    <Box
                      x={78 + i * 80}
                      y={72}
                      w={65}
                      h={43}
                      label={token}
                      colour={colours[actual?.id ?? 'A']}
                    />
                    <text x={110 + i * 80} y="146" textAnchor="middle" fontSize="14">
                      {!actual && token === 1 ? 'BOS' : `token ${i}`}
                    </text>
                  </g>
                ))}
              </Drawing>
              {actual && (
                <Table
                  label="Actual native piece-to-ID correspondence"
                  headers={['Position', 'Exact piece', 'Token ID']}
                  rows={nativeInputPieces[actual.id].map((entry, i) => [
                    i,
                    JSON.stringify(entry.piece),
                    entry.id,
                  ])}
                />
              )}
              <Readout>
                {ids.length} input IDs.{' '}
                {actual
                  ? 'Actual native tokenization, with add_special=true; this checkpoint inserted no extra beginning ID. The authored special-token control is disabled.'
                  : 'These authored IDs are not Pythia tokenization. Adding the declared beginning ID shifts later positions and increases the count.'}
              </Readout>
            </>
          );
        }}
      </Evidence>
      <Controls
        reset={() => {
          setSource('authored');
          setBos('no');
        }}
      >
        <Select
          label="Sequence source"
          value={source}
          onChange={setSource}
          options={[['authored', 'Constructed three-token prompt'], ...requests]}
        />
        <Select
          label="Constructed beginning token"
          value={bos}
          onChange={setBos}
          options={[
            ['no', 'Absent'],
            ['yes', 'Insert BOS ID1'],
          ]}
          disabled={source !== 'authored'}
        />
      </Controls>
    </Figure>
  );
}

export function ConversionFigure() {
  const [head, setHead] = useState(0);
  const rows = qkvPermutation();
  return (
    <Figure id="D17" label="Tensor layout conversion and actual model structure">
      <Drawing
        width={940}
        height={190}
        label="The checkpoint has six sequential decoder blocks, final normalization and an output head."
      >
        <text x="20" y="25" fontSize="15">
          Pythia: hidden 128 · four heads · head dimension 32 · MLP 512
        </text>
        <Box x={15} y={60} w={95} label="Embedding" colour={colours.A} />
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i}>
            <Wire x1={110 + i * 105} y1={78} x2={124 + i * 105} y2={78} />
            <Box x={125 + i * 105} y={60} w={90} label={`Block ${i}`} colour={colours.D} />
          </g>
        ))}
        <Wire x1={740} y1={78} x2={759} y2={78} />
        <Box x={760} y={60} w={75} label="Norm" colour={colours.B} />
        <Wire x1={835} y1={78} x2={853} y2={78} />
        <Box x={855} y={60} w={75} label="Head" colour={colours.C} />
        <text x="20" y="135" fontSize="15">
          Each block: residual + attention(norm input) + MLP(norm input), parallel branches.
        </text>
        <text x="20" y="165" fontSize="15">
          Actual QKV weight reshape [4,3,32,128] · rotary channels .25×32 = 8
        </text>
      </Drawing>
      <Drawing
        width={800}
        height={265}
        label="Expanded actual GPTNeoX block: parallel attention and MLP branches use the same block input, then sum with its residual."
      >
        <Box x={20} y={108} w={85} h={43} label="Input x" colour={colours.A} />
        <path
          d="M105 130H145V48H205M145 130V210H205"
          fill="none"
          stroke={colours.A}
          strokeWidth="1.7"
        />
        <Box x={210} y={27} w={130} h={42} label="Attention norm" colour={colours.D} />
        <Wire x1={340} y1={48} x2={380} y2={48} />
        <Box x={385} y={27} w={140} h={42} label="4-head attention" colour={colours.D} />
        <Box x={210} y={189} w={130} h={42} label="MLP norm" colour={colours.B} />
        <Wire x1={340} y1={210} x2={380} y2={210} />
        <Box x={385} y={189} w={140} h={42} label="128→512→128" colour={colours.B} />
        <path
          d="M525 48H595V112M525 210H595V148M105 130H572"
          fill="none"
          stroke="#ddd"
          strokeWidth="1.7"
        />
        <circle cx="595" cy="130" r="21" fill="#191919" stroke="#eee" />
        <text x="595" y="136" fontSize="21" textAnchor="middle">
          +
        </text>
        <Wire x1={616} y1={130} x2={664} y2={130} />
        <Box x={670} y={108} w={100} h={43} label="Block output" colour={colours.C} />
        <text x="305" y="118" fontSize="14">
          Residual x
        </text>
        <text x="20" y="258" fontSize="14">
          The MLP does not consume attention output in this checkpoint's parallel-residual block.
        </text>
      </Drawing>
      <Drawing
        width={690}
        height={440}
        label="Toy two-head, two-channel QKV row permutation. Every source row connects to its exact destination."
      >
        <text x="25" y="25" fontSize="16">
          Head-major source rows
        </text>
        <text x="420" y="25" fontSize="16">
          Projection-major destination
        </text>
        {rows.map((row) => {
          const colour = row.head === 0 ? colours.A : colours.B;
          return (
            <g key={row.source}>
              <Wire
                x1={240}
                y1={52 + row.source * 30}
                x2={418}
                y2={52 + row.destination * 30}
                colour={colour}
                dashed={head !== row.head}
              />
              <Box
                x={25}
                y={38 + row.source * 30}
                w={210}
                h={27}
                label={`${row.source}: H${row.head} ${row.projection}${row.channel}`}
                colour={colour}
                selected={head === row.head}
              />
              <Box
                x={423}
                y={38 + row.destination * 30}
                w={220}
                h={27}
                label={`${row.destination}: ${row.projection} H${row.head} c${row.channel}`}
                colour={colour}
                selected={head === row.head}
              />
            </g>
          );
        })}
        <text x="25" y="421" fontSize="14">
          Toy dimensions only; acquired converter performs the actual four-head permutation.
        </text>
      </Drawing>
      <Evidence>
        {(data) => (
          <Readout>
            Actual inventory: {data.gguf_inventory.tensor_types.F16} F16 and{' '}
            {data.gguf_inventory.tensor_types.F32} F32 tensors. Endpoint label “(guessed) all F32”
            counts tensor types because general.file_type is absent; it does not mean every tensor
            is F32.
          </Readout>
        )}
      </Evidence>
      <Controls reset={() => setHead(0)}>
        <Select
          label="Highlight toy head"
          value={head}
          onChange={(x) => setHead(Number(x))}
          options={[
            [0, 'Head 0'],
            [1, 'Head 1'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function NativeObservationFigure() {
  const [id, setId] = useState('A');
  const [event, setEvent] = useState(0);
  return (
    <Figure id="D18" label="Actual native event correspondence">
      <Evidence>
        {(data) => {
          const row = nativeRequest(data, id);
          const selected = row.events[event];
          return (
            <>
              <p>
                <strong style={{ color: colours[id] }}>Recorded request {id}</strong>: {row.prompt}
              </p>
              <pre className="engine-output">{row.output}</pre>
              <Drawing
                width={910}
                height={215}
                label="Sixteen one-ID native events followed by an empty terminal event; separate client timestamps."
              >
                {row.events.map((e, i) => (
                  <g key={i}>
                    <Box
                      x={20 + i * 51}
                      y={45}
                      w={45}
                      h={38}
                      label={i + 1}
                      colour={colours[id]}
                      selected={i === event}
                      dashed={e.data.stop}
                    />
                    <text x={42 + i * 51} y="109" textAnchor="middle" fontSize="13">
                      {e.data.stop ? 'stop' : e.data.tokens[0]}
                    </text>
                  </g>
                ))}
                <text x="20" y="27" fontSize="15">
                  SSE event number · token ID beneath (no terminal ID)
                </text>
                <text x="20" y="155" fontSize="15">
                  First content {fmt(row.first_content_seconds, 6)} s → terminal{' '}
                  {fmt(row.terminal_seconds, 6)} s
                </text>
                <text x="20" y="186" fontSize="15">
                  EOF {fmt(row.connection_end_seconds, 6)} s · client perf_counter, one-byte reads
                </text>
              </Drawing>
              <Table
                label="Selected event and immutable native run identity"
                headers={['Field', 'Retained value']}
                rows={[
                  ['Selected event', event + 1],
                  ['Content', JSON.stringify(selected.data.content)],
                  ['Token IDs', selected.data.tokens.join(', ') || '[]'],
                  ['Receive seconds', fmt(selected.receive_seconds, 9)],
                  ['Stop', String(selected.data.stop)],
                  ['Prompt IDs', row.input_ids.join(', ')],
                  ['GGUF SHA256', data.conversion.gguf.sha256],
                  ['Server exit after owned termination', data.native.server_final_exit_code],
                ]}
              />
              <Readout>
                All17 events remain visible; selection inspects one exact record. Empty terminal IDs
                are not counted twice. Native output quality is poor and unscored. Termination code1
                records process exit, not graceful application shutdown.
              </Readout>
            </>
          );
        }}
      </Evidence>
      <Controls
        reset={() => {
          setId('A');
          setEvent(0);
        }}
      >
        <Select label="Native request" value={id} onChange={setId} options={requests} />
        <Slider label="Inspect event" value={event} onChange={setEvent} min={0} max={16} step={1} />
      </Controls>
    </Figure>
  );
}

const engines = [
  {
    name: 'vLLM',
    first: 'API process',
    middle: 'Engine core',
    last: 'GPU workers',
    side: 'KV manager',
    note: 'Offline LLM is an alternative entrypoint; V1 roles are source-specific.',
  },
  {
    name: 'SGLang',
    first: 'Request frontend',
    middle: 'Scheduler',
    last: 'Model runner',
    side: 'Radix cache',
    note: 'Native /generate cumulative text needs a suffix-aware client.',
  },
  {
    name: 'TensorRT-LLM',
    first: 'trtllm-serve',
    middle: 'Executor',
    last: 'PyTorch backend',
    side: 'Runtime state',
    note: 'At this pin the TensorRT engine backend is removed.',
  },
  {
    name: 'TGI',
    first: 'HTTP router',
    middle: 'Model service',
    last: 'Model execution',
    side: 'Request state',
    note: 'Pinned README: maintenance mode; image digest is a separate identity.',
  },
  {
    name: 'llama.cpp',
    first: 'HTTP server',
    middle: 'Slot/context',
    last: 'GGML execution',
    side: 'KV context',
    note: 'Observed Windows CPU route uses one slot; other backends not tested.',
  },
  {
    name: 'DeepSpeed-MII',
    first: 'Pipeline / client',
    middle: 'Deployment',
    last: 'FastGen runner',
    side: 'Request state',
    note: 'Offline pipeline and persistent gRPC deployment have different lifetimes.',
  },
];

export function EngineAtlasFigure() {
  const [selected, setSelected] = useState('llama.cpp');
  return (
    <Figure id="D19" label="Six engine architecture boundaries">
      <div className="engine-atlas">
        {engines.map((engine) => (
          <div
            key={engine.name}
            className="engine-atlas-entry"
            data-selected={selected === engine.name}
          >
            <h3>{engine.name}</h3>
            <Drawing
              width={780}
              height={250}
              label={`${engine.name}: documented entrypoints, state and execution relationships.`}
            >
              {engine.name === 'vLLM' && (
                <>
                  <Box x={10} y={20} w={160} label="HTTP API" colour={colours.A} />
                  <Box x={10} y={100} w={160} label="Offline LLM" colour={colours.A} />
                  <Wire x1={170} y1={38} x2={250} y2={80} />
                  <Wire x1={170} y1={118} x2={250} y2={80} />
                  <Box x={250} y={60} w={170} h={44} label="Engine core" colour={colours.B} />
                  <Wire x1={420} y1={82} x2={520} y2={40} />
                  <Wire x1={420} y1={82} x2={520} y2={125} />
                  <Box x={520} y={20} w={210} label="Worker / execution" colour={colours.D} />
                  <Box x={520} y={105} w={210} label="Worker / execution" colour={colours.D} />
                  <Wire x1={335} y1={104} x2={335} y2={160} colour={colours.C} />
                  <text x="215" y="186" fontSize="15" fill={colours.C}>
                    KV page manager
                  </text>
                  {[0, 1, 2, 3].map((i) => (
                    <rect
                      key={i}
                      x={400 + i * 38}
                      y={166}
                      width={29}
                      height={25}
                      fill="none"
                      stroke={colours.C}
                    />
                  ))}
                  <text x="10" y="229" fontSize="14">
                    Two alternative entrypoints; worker count depends on the deployment.
                  </text>
                </>
              )}
              {engine.name === 'SGLang' && (
                <>
                  <Box x={10} y={20} w={180} label="Request frontend" colour={colours.A} />
                  <Wire x1={190} y1={38} x2={260} y2={38} />
                  <Box x={260} y={20} w={180} label="Scheduler" colour={colours.B} />
                  <Wire x1={440} y1={38} x2={525} y2={38} />
                  <Box x={525} y={20} w={210} label="Model runner" colour={colours.D} />
                  <Wire x1={350} y1={56} x2={350} y2={91} colour={colours.C} />
                  <Box x={300} y={95} w={100} label="prefix" colour={colours.C} />
                  <Wire x1={330} y1={131} x2={255} y2={171} colour={colours.C} />
                  <Wire x1={375} y1={131} x2={455} y2={171} colour={colours.C} />
                  <Box x={210} y={175} w={90} label="suffix A" colour={colours.A} />
                  <Box x={410} y={175} w={90} label="suffix B" colour={colours.B} />
                  <text x="15" y="152" fontSize="15" fill={colours.C}>
                    Radix ancestry
                  </text>
                  <text x="520" y="130" fontSize="15">
                    Native text snapshots:
                  </text>
                  <text x="520" y="162" fontSize="15">
                    “a” → “ab” → “abc”
                  </text>
                  <text x="520" y="194" fontSize="14">
                    Illustrative cumulative text
                  </text>
                </>
              )}
              {engine.name === 'TensorRT-LLM' && (
                <>
                  <Box x={10} y={80} w={175} label="trtllm-serve" colour={colours.A} />
                  <Wire x1={185} y1={98} x2={275} y2={98} />
                  <rect
                    x={265}
                    y={20}
                    width={470}
                    height={180}
                    fill="none"
                    stroke={colours.B}
                    strokeDasharray="5 4"
                  />
                  <text x="285" y="48" fontSize="15" fill={colours.B}>
                    Current PyTorch executor route
                  </text>
                  <Box x={285} y={80} w={180} label="Executor" colour={colours.B} />
                  <Wire x1={465} y1={98} x2={535} y2={98} />
                  <Box x={540} y={80} w={175} label="PyTorch model" colour={colours.D} />
                  <Box x={540} y={148} w={175} label="Checkpoint" colour={colours.C} />
                  <Wire x1={625} y1={148} x2={625} y2={122} colour={colours.C} />
                  <text x="10" y="231" fontSize="14">
                    The pinned version removed the older TensorRT engine backend.
                  </text>
                </>
              )}
              {engine.name === 'TGI' && (
                <>
                  <Box x={10} y={50} w={150} label="HTTP client" colour={colours.A} />
                  <Wire x1={160} y1={68} x2={240} y2={68} />
                  <Box x={240} y={50} w={170} label="Router" colour={colours.B} />
                  <Wire x1={410} y1={68} x2={510} y2={68} />
                  <rect
                    x={500}
                    y={15}
                    width={235}
                    height={145}
                    fill="none"
                    stroke={colours.D}
                    strokeDasharray="5 4"
                  />
                  <Box x={520} y={50} w={195} label="Model service" colour={colours.D} />
                  <Box x={540} y={111} w={155} label="Model execution" colour={colours.D} />
                  <Wire x1={618} y1={86} x2={618} y2={106} />
                  <Wire x1={320} y1={165} x2={90} y2={165} colour={colours.C} />
                  <text x="90" y="199" fontSize="15" fill={colours.C}>
                    Router streams SSE events to the client
                  </text>
                  <text x="10" y="232" fontSize="14">
                    Role/service boundary; maintenance mode is a release-status distinction.
                  </text>
                </>
              )}
              {engine.name === 'llama.cpp' && (
                <>
                  <Box x={10} y={28} w={175} label="HTTP server" colour={colours.A} />
                  <Wire x1={185} y1={46} x2={265} y2={46} />
                  <Box x={265} y={28} w={185} label="Slot / context" colour={colours.B} />
                  <Wire x1={450} y1={46} x2={535} y2={46} />
                  <Box x={535} y={28} w={195} label="GGML CPU" colour={colours.D} />
                  <Wire x1={350} y1={64} x2={350} y2={121} colour={colours.C} />
                  <text x="245" y="154" fontSize="15" fill={colours.C}>
                    KV context
                  </text>
                  {[0, 1, 2, 3].map((i) => (
                    <rect
                      key={i}
                      x={345 + i * 37}
                      y={132}
                      width={28}
                      height={36}
                      fill="none"
                      stroke={colours.C}
                    />
                  ))}
                  <Box x={545} y={132} w={175} label="GGUF weights" colour={colours.D} />
                  <Wire x1={630} y1={132} x2={630} y2={72} colour={colours.D} />
                  <text x="10" y="223" fontSize="14">
                    Observed route: one slot, CPU, one request at a time.
                  </text>
                </>
              )}
              {engine.name === 'DeepSpeed-MII' && (
                <>
                  <text x="10" y="24" fontSize="15">
                    Offline lifetime
                  </text>
                  <Box x={10} y={42} w={175} label="mii.pipeline" colour={colours.A} />
                  <Wire x1={185} y1={60} x2={270} y2={60} />
                  <Box
                    x={275}
                    y={42}
                    w={310}
                    label="In-process FastGen execution"
                    colour={colours.D}
                  />
                  <text x="10" y="127" fontSize="15">
                    Persistent service lifetime
                  </text>
                  <Box x={10} y={148} w={175} label="Client" colour={colours.A} />
                  <Wire x1={185} y1={166} x2={260} y2={166} />
                  <Box x={265} y={148} w={195} label="gRPC deployment" colour={colours.B} />
                  <Wire x1={460} y1={166} x2={535} y2={166} />
                  <Box x={540} y={148} w={195} label="FastGen worker" colour={colours.D} />
                  <text x="10" y="229" fontSize="14">
                    Alternative interfaces; a client call does not create the offline pipeline.
                  </text>
                </>
              )}
            </Drawing>
            <p>{engine.note}</p>
          </div>
        ))}
      </div>
      <Readout>
        All six remain visible. These diagrams locate documented roles; they do not assign speed,
        support scores or identical internals. Section 10 links each exact source pin and complete
        ordinary recipe.
      </Readout>
      <Controls reset={() => setSelected('llama.cpp')}>
        <Select
          label="Outline an engine"
          value={selected}
          onChange={setSelected}
          options={engines.map((e) => [e.name, e.name])}
        />
      </Controls>
    </Figure>
  );
}

export function PrefixIdentityFigure() {
  const [change, setChange] = useState('none');
  const stored = [11, 12, 13, 14];
  const requested = change === 'token' ? [11, 99, 13, 14] : stored;
  const count = reusablePrefix(stored, requested, change !== 'adapter');
  return (
    <Figure id="D21" label="Prefix identity and ancestry">
      <Drawing
        width={760}
        height={290}
        label="Compatible identity and every preceding token are needed for reusable descendant KV."
      >
        <Box
          x={20}
          y={20}
          w={700}
          h={42}
          label={`Model + tokenizer + positions + adapter: ${change === 'adapter' ? 'ADAPTER DIFFERS' : 'same identity'}`}
          colour={colours.D}
        />
        <text x="20" y="108" fontSize="15">
          Stored
        </text>
        <text x="20" y="198" fontSize="15">
          Request
        </text>
        {stored.map((token, i) => (
          <g key={i}>
            <Box x={110 + i * 145} y={82} w={110} h={40} label={token} colour={colours.A} />
            <Box
              x={110 + i * 145}
              y={173}
              w={110}
              h={40}
              label={requested[i]}
              colour={colours.B}
              dashed={i >= count}
            />
            {i < 3 && (
              <>
                <Wire x1={220 + i * 145} y1={101} x2={250 + i * 145} y2={101} colour={colours.A} />
                <Wire x1={220 + i * 145} y1={193} x2={250 + i * 145} y2={193} colour={colours.B} />
              </>
            )}
            <Wire
              x1={165 + i * 145}
              y1={129}
              x2={165 + i * 145}
              y2={166}
              colour={i < count ? colours.D : colours.C}
              dashed={i >= count}
            />
          </g>
        ))}
        <text x="20" y="260" fontSize="15">
          Reusable initial positions: {count}/4. Matching later IDs cannot repair an earlier
          mismatch.
        </text>
      </Drawing>
      <Readout>
        {change === 'adapter'
          ? 'Different adapter identity invalidates the complete match even though visible IDs agree.'
          : change === 'token'
            ? 'Position 1 differs, so positions 1–3 need compatible recomputation; the matching suffix 13/14 is insufficient.'
            : 'Identity and all four preceding IDs match in this constructed example.'}
      </Readout>
      <Controls reset={() => setChange('none')}>
        <Select
          label="Change request"
          value={change}
          onChange={setChange}
          options={[
            ['none', 'Exact prefix'],
            ['token', 'Change earlier ID'],
            ['adapter', 'Change adapter'],
          ]}
        />
      </Controls>
    </Figure>
  );
}

export function CommitCompositionFigure() {
  return (
    <Figure id="D22" label="Grammar and speculative cache frontier">
      <Drawing
        width={820}
        height={370}
        label="Draft suffix and target commit follow the same prefix and grammar; a rejected candidate discards its later suffix."
      >
        <text x="20" y="28" fontSize="16">
          Constructed trace: committed prefix [11,12], accept 21, reject 22, repair 24
        </text>
        <Box x={20} y={65} w={140} h={45} label="Prefix 11,12" colour={colours.A} />
        <Wire x1={160} y1={88} x2={217} y2={88} />
        <Box x={220} y={65} w={100} h={45} label="Draft 21" colour={colours.B} />
        <Wire x1={320} y1={88} x2={377} y2={88} />
        <Box x={380} y={65} w={110} h={45} label="Draft 22" colour={colours.B} dashed />
        <Wire x1={490} y1={88} x2={547} y2={88} dashed />
        <Box x={550} y={65} w={120} h={45} label="Suffix 23" colour={colours.B} dashed />
        <Box
          x={210}
          y={157}
          w={490}
          h={42}
          label="After 21: same grammar allows {22,24} for p and q"
          colour={colours.D}
        />
        <Wire x1={270} y1={111} x2={270} y2={150} colour={colours.D} />
        <Box x={20} y={244} w={190} h={45} label="Computed KV 11,12,21" colour={colours.A} />
        <Wire x1={210} y1={266} x2={290} y2={266} />
        <Box x={295} y={244} w={190} h={45} label="Committed output 24" colour={colours.C} dashed />
        <text x="520" y="261" fontSize="15">
          24 pending its own forward
        </text>
        <text x="520" y="286" fontSize="15">
          Discard provisional 22/23 state
        </text>
        <text x="20" y="336" fontSize="15">
          Rejection here is a supplied speculative outcome, not an illegal grammar proposal or a
          simulated probability.
        </text>
      </Drawing>
      <Readout>
        Both processed policies must use the grammar state of the same candidate prefix. A valid ID
        can still be rejected by speculative correction. Repair24 changes subsequent history;
        suffix23 cannot be reused. The full distribution proof belongs to the speculative lesson.
      </Readout>
    </Figure>
  );
}

export function WorkCompositionFigure() {
  const [prefill, setPrefill] = useState(0.5);
  const [decode, setDecode] = useState(0.5);
  const value = composedCost(prefill, decode);
  const rows = [
    ['Baseline', 20, 80],
    ['Prefix only', value.prefill, 80],
    ['Decode only', 20, value.decode],
    ['Combined', value.prefill, value.decode],
  ];
  return (
    <Figure id="D23" label="Combine changes to separate work portions">
      <Drawing
        width={820}
        height={305}
        label="Constructed separable milliseconds: each bar contains prefill and decode exactly once."
      >
        {[0, 20, 40, 60, 80, 100].map((tick) => (
          <g key={tick}>
            <line x1={155 + tick * 5.6} y1={28} x2={155 + tick * 5.6} y2={260} stroke="#444" />
            <text x={155 + tick * 5.6} y="286" fontSize="14" textAnchor="middle">
              {tick}
            </text>
          </g>
        ))}
        {rows.map(([name, p, d], i) => (
          <g key={name}>
            <text x="15" y={61 + i * 55} fontSize="15">
              {name}
            </text>
            <rect x="155" y={38 + i * 55} width={p * 5.6} height="34" fill={colours.A} />
            <rect x={155 + p * 5.6} y={38 + i * 55} width={d * 5.6} height="34" fill={colours.B} />
            <text x={165 + (p + d) * 5.6} y={61 + i * 55} fontSize="14">
              {fmt(p + d)} ms
            </text>
          </g>
        ))}
        <text x="20" y="302" fontSize="14">
          Cyan prefill, violet decode; constructed time axis in milliseconds, not a benchmark.
        </text>
      </Drawing>
      <Readout>
        Combined {fmt(value.total)} ms; speedup{' '}
        {value.speedup === null ? 'undefined at zero supplied work' : `${fmt(value.speedup)}×`}.
        Product of separately measured ratios: {fmt(value.independentProduct)}×. Distinct totals
        answer distinct questions; real features may interact beyond this supplied separable model.
      </Readout>
      <Controls
        reset={() => {
          setPrefill(0.5);
          setDecode(0.5);
        }}
      >
        <Slider
          label="Prefill fraction retained"
          value={prefill}
          onChange={setPrefill}
          min={0}
          max={1}
          step={0.1}
        />
        <Slider
          label="Decode fraction retained"
          value={decode}
          onChange={setDecode}
          min={0}
          max={1}
          step={0.1}
        />
      </Controls>
    </Figure>
  );
}

export function WholeRequestFigure() {
  const [stage, setStage] = useState('commit');
  const labels = [
    ['input', 'IDs 11,12,13'],
    ['admit', 'Reserve 3 pages'],
    ['prefill', 'Feed 3→21'],
    ['decode', 'Feed 21→22'],
    ['commit', 'Feed 22→EOS'],
    ['release', 'Free 3 pages'],
  ];
  return (
    <Figure id="D32" label="One complete request and the next system boundary">
      <Drawing
        width={910}
        height={245}
        label="A concrete request keeps identity through input, admission, three outputs and exactly-once logical release."
      >
        {labels.map(([key, label], i) => (
          <g key={key}>
            <Box
              x={15 + i * 147}
              y={60}
              w={132}
              h={48}
              label={label}
              colour={colours.A}
              selected={stage === key}
            />
            {i < 5 && (
              <Wire x1={147 + i * 147} y1={84} x2={159 + i * 147} y2={84} colour={colours.A} />
            )}
            <text x={81 + i * 147} y="137" textAnchor="middle" fontSize="14">
              {key}
            </text>
          </g>
        ))}
        <path d="M25 42V25H885V42" fill="none" stroke="#aaa" />
        <text x="340" y="19" fontSize="15">
          One local engine owns A
        </text>
        <path d="M300 175H885V221H300Z" fill="none" stroke={colours.D} strokeDasharray="6 4" />
        <text x="322" y="204" fontSize="15">
          External: router / replicas / partial-output retry contract
        </text>
        <text x="20" y="190" fontSize="14">
          3 outputs · 5 cached inputs
        </text>
        <text x="20" y="218" fontSize="14">
          Final EOS is not fed again.
        </text>
      </Drawing>
      <Readout>
        The entire local path stays visible while an outline follows a stage. Neither three logical
        pages returned nor one terminal transition defines cross-replica replay or exactly-once
        delivery.
      </Readout>
      <Controls reset={() => setStage('commit')}>
        <Select
          label="Follow stage"
          value={stage}
          onChange={setStage}
          options={labels.map(([key, label]) => [key, `${key}: ${label}`])}
        />
      </Controls>
    </Figure>
  );
}

export const nativeEvidenceFigures = {
  D01: EngineBoundaryFigure,
  D02: RequestFieldsFigure,
  D03: InputIdentityFigure,
  D17: ConversionFigure,
  D18: NativeObservationFigure,
  D19: EngineAtlasFigure,
  D21: PrefixIdentityFigure,
  D22: CommitCompositionFigure,
  D23: WorkCompositionFigure,
  D32: WholeRequestFigure,
};
