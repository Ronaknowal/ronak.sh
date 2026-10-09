import { flowNumber } from './LessonFlow.jsx';
import './recurrent-attention-flow.css';

const paint = {
  input: '#77c8da', parameter: '#e2b55a', computed: '#bc9ce7',
  forward: '#aaa', backward: '#edaa80', foreground: '#eee', muted: '#999',
};
const names = ['A', 'B', 'C'];
const number = (value, digits = 3) => flowNumber(value, digits);

// Coincident vectors share a geometrical endpoint; keep all identities readable there.
function endpointGroups(vectors) {
  const groups = new Map();
  vectors.forEach((vector, index) => {
    const key = vector.join(',');
    if (!groups.has(key)) groups.set(key, { vector, indices: [] });
    groups.get(key).indices.push(index);
  });
  return [...groups.values()];
}


function Drawing({ height, label, children }) {
  return <svg className="attention-flow-drawing" viewBox={`0 0 360 ${height}`}
    style={{ aspectRatio: `360 / ${height}` }} role="img" aria-label={label}>
    {children}
  </svg>;
}

function Arrow({ points, backward = false }) {
  const end = points.at(-1), before = points.at(-2);
  const angle = Math.atan2(end[1] - before[1], end[0] - before[0]);
  const head = [end, ...[-.55, .55].map(offset => [
    end[0] - 7 * Math.cos(angle + offset), end[1] - 7 * Math.sin(angle + offset),
  ])];
  const color = backward ? paint.backward : paint.forward;
  return <g fill={color} stroke={color}>
    <polyline points={points.map(point => point.join(',')).join(' ')} fill="none"
      strokeWidth="1.5" strokeDasharray={backward ? '5 4' : undefined} />
    <polygon points={head.map(point => point.join(',')).join(' ')} stroke="none" />
  </g>;
}

function Label({ x, y, children, role = 'foreground', anchor = 'middle', small = false }) {
  return <text x={x} y={y} textAnchor={anchor} fill={paint[role]}
    className={small ? 'attention-flow-small' : undefined}>{children}</text>;
}

function Operation({ x, y, width = 84, label }) {
  return <g><rect x={x} y={y} width={width} height="30" rx="5"
    fill="none" stroke={paint.foreground} />
    <Label x={x + width / 2} y={y + 20}>{label}</Label></g>;
}

function Cells({ x, y, rows, columns, cell = 24, values, role = 'input', selected }) {
  return <g>{Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    const value = values?.[row]?.[column];
    return <g key={index}>
      <rect x={x + column * cell} y={y + row * cell} width={cell} height={cell}
        fill="none" stroke={selected === index ? paint.foreground : paint[role]}
        strokeWidth={selected === index ? 2.5 : 1} />
      {value !== undefined && <Label x={x + (column + .5) * cell}
        y={y + (row + .65) * cell} small>{typeof value === 'number' ? number(value) : value}</Label>}
    </g>;
  })}</g>;
}

function Vector({ x, y, values, role = 'computed', label }) {
  return <g><Label x={x + 44} y={y - 12} role={role}>{label}</Label>
    <Cells x={x} y={y} rows={1} columns={values.length} cell={44}
      values={[values]} role={role} /></g>;
}

export function AttentionInformationDrawing({ attentive = true }) {
  const tokens = ['past', 'w', 'a', 'l', 'k', 'EOS'];
  return <figure data-figure={attentive ? 'attention-information-path' : 'fixed-information-path'}>
    <Drawing height={550} label={attentive
      ? 'Each saved encoder vector remains available to successive decoder reads; the final state also initializes the decoder.'
      : 'The final encoder state initializes a recurrent decoder; earlier states have no direct read route.'}>
      <Label x={180} y={20} role="input">Source: requested past form of walk</Label>
      {tokens.map((token, index) => {
        const x = 12 + index * 57;
        return <g key={index}>
          <Label x={x + 20} y={52} role="input">{token}</Label>
          <Arrow points={[[x + 20, 61], [x + 20, 83]]} />
          <Cells x={x} y={85} rows={2} columns={2} cell={20} role="computed" />
          <Label x={x + 20} y={142} small>state {index}</Label>
          {index < tokens.length - 1 && <Arrow points={[[x + 41, 104], [x + 54, 104]]} />}
        </g>;
      })}
      {attentive && <>
        {tokens.map((_, index) => <line key={index} x1={32 + index * 57} x2={32 + index * 57}
          y1="126" y2="164" stroke={paint.forward} />)}
        <polyline points="317,164 9,164 9,288 24,288" fill="none" stroke={paint.forward} />
        <Arrow points={[[9, 288], [24, 288]]} />
        <Label x={75} y={208} small>save all real rows</Label>
      </>}
      <Arrow points={[[337, 125], [350, 125], [350, 213], [254, 213]]} />
      <Label x={297} y={174} small>final state:</Label>
      <Label x={297} y={191} small>initialize once</Label>
      <Label x={169} y={193} anchor="end" small>previous writer state</Label>
      <Cells x={174} y={203} rows={1} columns={4} cell={20} role="input" />
      <Arrow points={[[254, 213], [290, 213], [290, 424], [282, 424]]} />
      {attentive && <>
        <Cells x={25} y={249} rows={6} columns={8} cell={13} role="input" />
        <Label x={79} y={348} small>saved memory</Label>
        <Arrow points={[[129, 289], [169, 289]]} />
        <Arrow points={[[214, 224], [214, 273]]} />
        <Label x={246} y={249} small>question</Label>
        <Operation x={171} y={275} width={82} label="one read" />
        <Arrow points={[[213, 306], [213, 343]]} />
        <Cells x={174} y={345} rows={1} columns={4} cell={20} role="computed" />
        <Label x={213} y={391} role="computed" small>fresh context</Label>
        <Arrow points={[[213, 397], [213, 408]]} />
      </>}
      <Operation x={171} y={409} width={110} label="writer update" />
      <Arrow points={[[143, 424], [171, 424]]} />
      <Label x={94} y={429} role="input" small>previous letter</Label>
      <Arrow points={[[226, 440], [226, 466]]} />
      <Cells x={186} y={468} rows={1} columns={4} cell={20} role="computed" />
      <Label x={226} y={514} role="computed">new writer state</Label>
      <Label x={180} y={544} small>New state becomes previous state next step.</Label>
    </Drawing>
    <figcaption>The source has six stored tokens; the answer has seven including EOS.
      {attentive ? 'The previous state supplies the current query; the returned context helps compute the new state.' : 'The final encoder state initializes the writer once. Each later update uses its previous state and token, with no fresh source read.'}
      The small feature grids show structure, not measured coordinates or assigned linguistic meanings.</figcaption>
  </figure>;
}

export function AttentionMemoryDrawing() {
  return <figure data-figure="attention-memory-anatomy">
    <div className="attention-flow-columns">
      <Drawing height={285} label="One source position contains a 64-coordinate feature vector; all 64 coordinates are shown as an eight by eight grid.">
        <Label x={180} y={24} role="input">One saved state hⱼ</Label>
        <Cells x={100} y={54} rows={8} columns={8} cell={20} />
        <Label x={180} y={242}>64 coordinates, not 64 source tokens</Label>
        <Label x={180} y={268} small>Coordinates are learned numerical features.</Label>
      </Drawing>
      <Drawing height={285} label="Source memory has one 64-coordinate row for each real position; the final row also initializes the decoder.">
        <Label x={180} y={24} role="input">Memory H: source positions × 64</Label>
        <Cells x={75} y={54} rows={6} columns={8} cell={24} />
        {Array.from({ length: 6 }, (_, row) => <Label key={row} x={54} y={72 + row * 24} small>h{row}</Label>)}
        <Label x={180} y={220} small>8 of 64 columns drawn; all six rows shown</Label>
        <Label x={180} y={248}>The last REAL row initializes the writer.</Label>
        <Label x={180} y={274}>All real rows remain available for reads.</Label>
      </Drawing>
    </div>
  </figure>;
}

export function AttentionLookupDrawing() {
  return <figure data-figure="attention-lookup">
    <Drawing height={335} label="A requested time is compared with time keys; the read returns their associated temperatures, which are distinct from the keys.">
      <Label x={180} y={24} role="input">Question: temperature at 14:00?</Label>
      <Label x={45} y={60} role="input" small>time key</Label>
      <Label x={164} y={60} role="computed" small>assigned share</Label>
      <Label x={287} y={60} role="input" small>returned value</Label>
      {['12:00', '14:00', '16:00'].map((time, index) => <g key={time}>
        <Label x={45} y={100 + index * 55} role="input">{time}</Label>
        <Arrow points={[[78, 95 + index * 55], [124, 95 + index * 55]]} />
        <Label x={164} y={100 + index * 55} role="computed">{[.25, .75, 0][index]}</Label>
        <Arrow points={[[195, 95 + index * 55], [255, 95 + index * 55]]} />
        <Label x={287} y={100 + index * 55} role="input">{[18, 24, 21][index]}°C</Label>
      </g>)}
      <Label x={180} y={266}>.25 × 18 + .75 × 24 + 0 × 21 = 22.5°C</Label>
      <Label x={180} y={298} small>Exact lookup: 24°C; equal average: 21°C.</Label>
      <Label x={180} y={323} small>Constructed shares; not a weather model.</Label>
    </Drawing>
  </figure>;
}

export function AttentionDotDrawing({ query = [1, 0], keys = [[1, 0], [0, 1], [-1, 0]] }) {
  return <figure data-figure="attention-dot-operation">
    <Drawing height={323} label="Corresponding query and key coordinates multiply; each memory's two products add into one score.">
      <Vector x={136} y={35} values={query} role="input" label="query q" />
      <Label x={180} y={108} small>Same query, separate comparison with each key</Label>
      {keys.map((key, index) => {
        const y = 149 + index * 67;
        return <g key={index}>
          <Label x={18} y={y + 5} role="input">{names[index]}</Label>
          <Label x={75} y={y - 14} small>key coordinates</Label>
          <Cells x={38} y={y - 8} rows={1} columns={2} cell={32} values={[key]} />
          <Arrow points={[[103, y + 8], [119, y + 8]]} />
          <Label x={181} y={y + 3} role="computed" small>{number(query[0])} × {number(key[0])}</Label>
          <Label x={181} y={y + 20} role="computed" small>+ {number(query[1])} × {number(key[1])}</Label>
          <Arrow points={[[239, y + 8], [256, y + 8]]} />
          <Operation x={258} y={y - 7} width={35} label="Σ" />
          <Label x={328} y={y + 13} role="computed">{number(query.reduce((sum, value, axis) => sum + value * key[axis], 0))}</Label>
        </g>;
      })}
    </Drawing>
  </figure>;
}

export function AttentionSoftmaxDrawing({ scores = [1, 0, -1], valid = [true, true, true] }) {
  const maximum = Math.max(...scores.filter((_, index) => valid[index]));
  const mass = scores.map((score, index) => valid[index] ? Math.exp(score - maximum) : 0);
  const total = mass.reduce((sum, value) => sum + value, 0);
  return <figure data-figure="attention-shared-denominator">
    <Drawing height={435} label="Allowed scores subtract the same maximum, exponentiate, then divide by one shared sum; excluded scores contribute zero mass.">
      <Label x={180} y={25}>Turn scores into shares of one read</Label>
      {scores.map((score, index) => <g key={index}>
        <Label x={60 + index * 120} y={61} role="input">{names[index]}</Label>
        <Label x={60 + index * 120} y={91} role="computed">score {number(score)}</Label>
        <Arrow points={[[60 + index * 120, 105], [60 + index * 120, 130]]} />
        <Label x={60 + index * 120} y={151} role="computed">{valid[index] ? number(score - maximum) : 'excluded ×'}</Label>
        <Arrow points={[[60 + index * 120, 162], [60 + index * 120, 186]]} />
        <Label x={60 + index * 120} y={207} role="computed">exp → {number(mass[index])}</Label>
        <Arrow points={[[60 + index * 120, 219], [60 + index * 120, 238], [180, 238], [180, 251]]} />
        <Arrow points={[[60 + index * 120, 219], [index === 1 ? 105 : 15 + index * 120, 219], [index === 1 ? 105 : 15 + index * 120, 328], [20 + index * 120, 328]]} />
      </g>)}
      <Operation x={130} y={253} width={100} label={`Σ = ${number(total)}`} />
      {mass.map((value, index) => <g key={index}>
        <Arrow points={[[180, 284], [180, 298], [60 + index * 120, 298], [60 + index * 120, 312]]} />
        <Operation x={20 + index * 120} y={313} width={80} label="÷ total" />
        <Label x={60 + index * 120} y={367} role="computed">{number(value)} ÷ {number(total)}</Label>
        <Label x={60 + index * 120} y={392} role="computed">α{names[index]} = {number(value / total)}</Label>
      </g>)}
      <Label x={180} y={418} small>Left input = own mass; top input = shared total.</Label>
    </Drawing>
  </figure>;
}

export function AttentionValueDrawing({ values = [[2, 0], [0, 2], [-1, 1]], attention = [.665240955775, .244728471055, .09003057317] }) {
  const scale = 35;
  const point = vector => [180 + scale * vector[0], 158 - scale * vector[1]];
  const context = values[0].map((_, axis) => values.reduce((sum, value, index) => sum + attention[index] * value[axis], 0));
  let accumulated = [0, 0];
  return <figure data-figure="attention-value-geometry">
    <Drawing height={305} label="The normalized read adds weighted value vectors head to tail; its endpoint lies within the original values' triangle. Both axes use the same physical scale.">
      <Label x={180} y={22}>Add weighted values</Label>
      <line x1="54" x2="306" y1="158" y2="158" stroke={paint.muted} />
      <line x1="180" x2="180" y1="32" y2="284" stroke={paint.muted} />
      <Label x={292} y={180} small>coord. 1</Label>
      <Label x={181} y={301} small>coordinate 2 increases upward; both axes −3.6 to 3.6</Label>
      <polygon points={values.map(value => point(value).join(',')).join(' ')}
        fill="none" stroke={paint.input} strokeDasharray="3 4" />
      {values.map((value, index) => {
        const old = accumulated;
        accumulated = old.map((coordinate, axis) => coordinate + attention[index] * value[axis]);
        return <g key={index}>
          {attention[index] > 0 && value.some(coordinate => coordinate !== 0) && <Arrow points={[point(old), point(accumulated)]} />}
          {attention[index] > 0 && value.some(coordinate => coordinate !== 0) && <><circle cx={(point(old)[0] + point(accumulated)[0]) / 2}
            cy={(point(old)[1] + point(accumulated)[1]) / 2 + 13} r="9" fill="#080808" />
          <Label x={(point(old)[0] + point(accumulated)[0]) / 2}
            y={(point(old)[1] + point(accumulated)[1]) / 2 + 17} role="computed" small>{index + 1}</Label></>}
        </g>;
      })}
      {endpointGroups(values).map(({ vector, indices }) => {
        const endpoint = point(vector);
        return <g key={indices.join('-')}>
          <circle cx={endpoint[0]} cy={endpoint[1]} r="4" fill={paint.input} />
          <Label x={endpoint[0]} y={endpoint[1] - 12} anchor={endpoint[0] > 250 ? 'end' : endpoint[0] < 100 ? 'start' : 'middle'} role="input" small>{indices.map(index => names[index]).join(' / ')}</Label>
        </g>;
      })}
      <polygon points={`${point(context)[0]},${point(context)[1] - 7} ${point(context)[0] + 7},${point(context)[1]} ${point(context)[0]},${point(context)[1] + 7} ${point(context)[0] - 7},${point(context)[1]}`}
        fill="none" stroke={paint.computed} strokeWidth="2" />
      <Label x={point(context)[0] + 20} y={point(context)[1] + 21} role="computed">c</Label>
    </Drawing>
    <figcaption>The cyan triangle joins original values; gray arrows add weighted contributions;
      the violet diamond is c = ({number(context[0], 6)}, {number(context[1], 6)}).
      Arrows 1, 2 and 3 add αA × vA, αB × vB and αC × vC in that order.
      Coincident values share an endpoint labelled with every name. Zero contributions add no arrow; their exact values remain in the contribution table. Coordinates are constructed, not named linguistic features.</figcaption>
  </figure>;
}

export function AttentionQueryPlane({ query = [1, 0], keys = [[1, 0], [0, 1], [-1, 0]] }) {
  const origin = [180, 166], scale = 48;
  const endpoint = vector => [origin[0] + scale * vector[0], origin[1] - scale * vector[1]];
  return <figure data-figure="attention-query-key-plane">
    <Drawing height={307} label="Query and keys are arrows on the same two-coordinate plane. A dot score depends on both their direction and magnitude.">
      <Label x={180} y={22}>Compare query and key directions</Label>
      <line x1="60" y1="166" x2="300" y2="166" stroke={paint.muted} />
      <line x1="180" y1="46" x2="180" y2="286" stroke={paint.muted} />
      {endpointGroups(keys).map(({ vector, indices }) => <g key={indices.join('-')}><Arrow points={[origin, endpoint(vector)]} />
        <circle cx={endpoint(vector)[0]} cy={endpoint(vector)[1]} r="5" fill={paint.input} />
        <Label x={endpoint(vector)[0]} y={endpoint(vector)[1] - 16} anchor={endpoint(vector)[0] > 245 ? 'end' : endpoint(vector)[0] < 115 ? 'start' : 'middle'} role="input" small>{indices.map(index => `k${names[index]}`).join(' / ')}</Label></g>)}
      <line x1={origin[0]} y1={origin[1]} x2={endpoint(query)[0]} y2={endpoint(query)[1]}
        stroke={paint.input} strokeWidth="3" />
      <circle cx={endpoint(query)[0]} cy={endpoint(query)[1]} r="8" fill="none" stroke={paint.input} />
      <Label x={endpoint(query)[0]} y={endpoint(query)[1] + 23} role="input">q</Label>
      <Label x={180} y={300} small>Equal scales: both axes −2.5…2.5.</Label>
    </Drawing>
    <figcaption>Cyan marks supplied coordinates. The thick arrow with an open endpoint is the query q; filled endpoints are the keys kA, kB and kC. Coincident keys share one endpoint with all their labels.</figcaption>
  </figure>;
}

export function AttentionAdditiveDrawing() {
  return <figure data-figure="attention-additive-maps">
    <Drawing height={784} label="Actual two-coordinate query and memory pass through separate learned two-by-two maps, add, bend through tanh and reduce through a learned row into one score. Original memory bypasses scoring as value.">
      <Vector x={36} y={45} values={[1, 0]} role="input" label="query q" />
      <Vector x={235} y={45} values={[1, 0]} role="input" label="memory hA" />
      <Arrow points={[[80, 90], [80, 125]]} /><Arrow points={[[279, 90], [279, 125]]} />
      <Cells x={36} y={147} rows={2} columns={2} cell={44} role="parameter" values={[[.5, 0], [-.5, .5]]} />
      <Cells x={235} y={147} rows={2} columns={2} cell={44} role="parameter" values={[[1, 0], [.5, 1]]} />
      <Label x={80} y={140} role="parameter">Wq</Label><Label x={279} y={140} role="parameter">Wh</Label>
      <Arrow points={[[80, 237], [80, 267]]} /><Arrow points={[[279, 237], [279, 267]]} />
      <Vector x={36} y={289} values={[.5, -.5]} label="Wq q" />
      <Vector x={235} y={289} values={[1, .5]} label="Wh hA" />
      <Arrow points={[[80, 334], [80, 357], [155, 357]]} />
      <Arrow points={[[279, 334], [279, 357], [205, 357]]} />
      <circle cx="180" cy="357" r="24" fill="none" stroke={paint.foreground} />
      <Label x={180} y={363}>+</Label>
      <Arrow points={[[180, 381], [180, 409]]} />
      <Vector x={136} y={432} values={[1.5, 0]} label="sum → tanh" />
      <Arrow points={[[180, 477], [180, 505]]} />
      <Vector x={136} y={526} values={[Math.tanh(1.5), 0]} label="bent features" />
      <Arrow points={[[180, 571], [180, 594]]} />
      <Vector x={136} y={616} values={[2, -1]} role="parameter" label="learned scoring row va" />
      <Label x={180} y={693} role="computed">2 × .905148 − 1 × 0</Label>
      <Label x={180} y={724} role="computed">one score = 1.810297</Label>
      <Arrow points={[[323, 66], [345, 66], [345, 755], [286, 755]]} />
      <Cells x={197} y={737} rows={1} columns={2} cell={44} values={[[1, 0]]} role="input" />
      <Label x={102} y={764} small>original value bypass</Label>
    </Drawing>
    <figcaption>The amber grids are constructed learned maps, with every row and column drawn.
      The projected query and key share width 2. The memory remains the value;
      these scorer operations do not replace its returned coordinates.</figcaption>
  </figure>;
}

export function AttentionScheduleDrawing({ kind = 'additive', feeding = false }) {
  const additive = kind === 'additive';
  return <figure data-figure={`attention-${kind}-schedule${feeding ? '-feeding' : ''}`}>
    <Drawing height={additive ? 600 : 575} label={additive
      ? 'Previous decoder state queries source memory first. Context and previous token enter the GRU, together with previous state. New state and context enter the output head.'
      : 'Previous token and previous state enter the GRU first. New state queries source memory. New state and context enter the output head. Optional previous combined vector accompanies the token.'}>
      <Label x={72} y={24} role="input">old state sₜ₋₁</Label>
      <Cells x={28} y={43} rows={1} columns={4} cell={22} />
      <Label x={275} y={24} role="input">previous token</Label>
      <Cells x={253} y={43} rows={1} columns={2} cell={22} />
      <Label x={275} y={82} small>embedding E(yₜ₋₁)</Label>
      {additive ? <>
        <Arrow points={[[72, 67], [72, 111], [118, 111]]} />
        <Operation x={120} y={96} width={120} label="read source H" />
        <Arrow points={[[180, 126], [180, 156]]} />
        <Cells x={136} y={157} rows={1} columns={4} cell={22} role="computed" />
        <Label x={180} y={199} role="computed">context cₜ</Label>
        <Arrow points={[[180, 211], [180, 246]]} />
        <Arrow points={[[275, 93], [323, 93], [323, 261], [236, 261]]} />
        <Arrow points={[[28, 55], [12, 55], [12, 261], [122, 261]]} />
        <Operation x={124} y={247} width={110} label="GRU update" />
        <Arrow points={[[180, 278], [180, 309]]} />
        <Cells x={136} y={310} rows={1} columns={4} cell={22} role="computed" />
        <Label x={180} y={351} role="computed">new state sₜ</Label>
        <Arrow points={[[180, 362], [180, 397]]} />
        <Arrow points={[[224, 168], [340, 168], [340, 412], [240, 412]]} />
        <Operation x={120} y={398} width={120} label="join sₜ and cₜ" />
      </> : <>
        <Arrow points={[[72, 66], [72, 126], [123, 126]]} />
        <Arrow points={[[275, 93], [275, 126], [236, 126]]} />
        <Operation x={124} y={111} width={110} label="GRU update" />
        <Arrow points={[[180, 142], [180, 170]]} />
        <Cells x={136} y={171} rows={1} columns={4} cell={22} role="computed" />
        <Label x={180} y={211} role="computed">new state = query sₜ</Label>
        <Arrow points={[[180, 223], [180, 251]]} />
        <Operation x={120} y={252} width={120} label="read source H" />
        <Arrow points={[[180, 283], [180, 310]]} />
        <Cells x={136} y={311} rows={1} columns={4} cell={22} role="computed" />
        <Label x={180} y={351} role="computed">context cₜ</Label>
        <Arrow points={[[180, 363], [180, 397]]} />
        <Arrow points={[[136, 181], [20, 181], [20, 412], [118, 412]]} />
        <Operation x={120} y={398} width={120} label="join sₜ and cₜ" />
      </>}
      <Arrow points={[[180, 429], [180, 451]]} />
      <Operation x={107} y={452} width={146} label="linear map → tanh" />
      <Label x={180} y={508} role="computed">combined vector s̃ₜ</Label>
      <Arrow points={[[180, 519], [180, 538]]} />
      <Label x={180} y={561} role="computed">output scores → shares → next token</Label>
      {feeding && <><Arrow points={[[253, 467], [350, 467], [350, 93], [276, 93]]} />
        <Label x={299} y={390} small>next step:</Label><Label x={299} y={407} small>also feed s̃ₜ</Label></>}
    </Drawing>
    <figcaption>{additive ? 'Read before update' : 'Read after update'}: four cells denote
      a feature cutaway, not width 4. Gray arrows carry forward values.
      {feeding && ' The extra loop carries the combined state-and-context vector into the next token’s update; its first value is zero.'}</figcaption>
  </figure>;
}

export function AttentionMaskDrawing({ admitted = false }) {
  const shares = admitted ? [1 / 3, 1 / 3, 1 / 3] : [.5, .5, 0];
  return <figure data-figure="attention-padding-anatomy">
    <Drawing height={310} label="Two real values and one PAD storage slot have equal raw scores. Masking excludes PAD before normalization, so it receives no share.">
      <Label x={180} y={24}>Real rows versus storage</Label>
      {['real A', 'real B', 'PAD'].map((label, index) => <g key={label}>
        <Label x={60 + index * 120} y={63} role="input">{label}</Label>
        <Cells x={39 + index * 120} y={80} rows={1} columns={1} cell={42}
          values={[[[2, 4, 0][index]]]} role={index === 2 ? 'muted' : 'input'} />
        <Label x={60 + index * 120} y={150} small>score 0</Label>
        <Arrow points={[[60 + index * 120, 161], [60 + index * 120, 188]]} />
        <Label x={60 + index * 120} y={210} role="computed">{index === 2 && !admitted ? 'excluded: 0' : `share ${number(shares[index])}`}</Label>
        <Arrow points={[[60 + index * 120, 222], [60 + index * 120, 245], [180, 245], [180, 266]]} />
      </g>)}
      <Label x={180} y={291} role="computed">read = {admitted ? 2 : 3}</Label>
    </Drawing>
  </figure>;
}

export function AttentionOutputDrawing({ context = [1.240451338, .579487515] }) {
  const maximum = Math.max(...context), masses = context.map(value => Math.exp(value - maximum));
  const probability = masses[1] / (masses[0] + masses[1]);
  return <figure data-figure="attention-target-loss-path">
    <Drawing height={359} label="Constructed context coordinates become two class logits, normalize over classes, and meet a target only at the loss. The target never enters the read.">
      <Vector x={136} y={48} values={context} label="returned context c" />
      <Arrow points={[[180, 93], [180, 119]]} />
      <Operation x={93} y={120} width={174} label="identity two-class head" />
      <Arrow points={[[180, 151], [180, 178]]} />
      <Operation x={126} y={179} width={108} label="class softmax" />
      <Label x={180} y={238} role="computed">p₂ = {number(probability, 6)}</Label>
      <Arrow points={[[180, 250], [180, 277]]} />
      <Operation x={125} y={278} width={110} label="− log p₂" />
      <Label x={52} y={277} role="input" small>target 2</Label>
      <Arrow points={[[78, 289], [123, 289]]} />
      <Label x={180} y={342} role="computed">loss {number(-Math.log(probability), 6)}</Label>
    </Drawing>
  </figure>;
}

export function AttentionGradientDrawing({ result }) {
  return <figure data-figure="attention-backward-credit">
    <div className="attention-flow-columns">
    <Drawing height={363} label="Loss credit goes backward to context, each value and each score. Query credit adds score credits times keys.">
      <Label x={180} y={23}>Loss tells the read which changes help</Label>
      <Label x={180} y={58} role="computed">loss L = {number(result.loss, 6)}</Label>
      <Arrow points={[[180, 70], [180, 93]]} backward />
      <Vector x={136} y={114} values={result.contextGradient} role="backward" label="context credit g" />
      {result.scoreGradient.map((value, index) => <g key={index}>
        <Arrow points={[[180, 159], [180, 182], [60 + index * 120, 182], [60 + index * 120, 210]]} backward />
        <Label x={60 + index * 120} y={233} role="backward">∂L/∂e{names[index]}</Label>
        <Label x={60 + index * 120} y={258} role="backward">{number(value, 6)}</Label>
        <Arrow points={[[60 + index * 120, 270], [60 + index * 120, 290], [180, 290], [180, 310]]} backward />
      </g>)}
      <Label x={180} y={334} role="backward">query credit {result.queryGradient.map(value => number(value)).join(', ')}</Label>
      <Label x={180} y={359} small>Multiply by each key; then add.</Label>
    </Drawing>
    <Drawing height={377} label="Context credit also reaches each returned value through its current share; each of the value's two coordinates receives the corresponding context derivative times that share.">
      <Vector x={136} y={49} values={result.contextGradient} role="backward" label="same context credit g" />
      {result.attention.map((share, index) => <g key={index}>
        <Arrow points={[[180, 94], [180, 118], [60 + 120 * index, 118], [60 + 120 * index, 145]]} backward />
        <Operation x={17 + 120 * index} y={146} width={86} label={`× ${number(share)}`} />
        <Arrow points={[[60 + 120 * index, 177], [60 + 120 * index, 211]]} backward />
        <Cells x={16 + 120 * index} y={213} rows={2} columns={1} cell={44}
          role="backward" values={result.contextGradient.map(value => [share * value])} />
        <Label x={38 + 120 * index} y={330} role="backward">value {names[index]}</Label>
      </g>)}
      <Label x={180} y={373} small>Same credit direction × donor share.</Label>
    </Drawing>
    </div>
    <figcaption>Orange dashed wires carry backward loss derivatives, not forward values.
      Left: changing a score reallocates the read, and score credits sum through keys to the query.
      Right: each returned value receives context credit multiplied by its share.</figcaption>
  </figure>;
}

export function AttentionGroupingDrawing() {
  return <figure data-figure="attention-grouped-development">
    <Drawing height={293} label="All requested forms of a lemma and aliases sharing a target are grouped before partitioning; complete groups go to training or development, never across both.">
      <Label x={180} y={24}>Partition groups, not individual requests</Label>
      <Label x={80} y={63} role="input">walk</Label><Label x={264} y={63} role="input">work + worke</Label>
      <Cells x={18} y={83} rows={1} columns={3} cell={40} values={[["past", "ing", "s"]]} />
      <Cells x={214} y={83} rows={2} columns={3} cell={35} />
      <Label x={264} y={176} small>shared-form group</Label>
      <Arrow points={[[78, 124], [78, 201]]} />
      <Arrow points={[[266, 153], [266, 202]]} />
      <Label x={78} y={228} role="computed">one partition</Label>
      <Label x={266} y={228} role="computed">one partition</Label>
      <Label x={180} y={268} small>451 / 149 lemmas; 1,353 / 447 records</Label>
      <Label x={180} y={286} small>Observed counts; schematic arrows.</Label>
    </Drawing>
  </figure>;
}

export function AttentionWindowDrawing({ result, center, radius }) {
  return <figure data-figure="attention-window-ruler">
    <Drawing height={362} label="Five real source positions lie on a fixed ruler. Eligibility clips the window; Gaussian factors multiply the eligible softmax shares.">
      <Label x={180} y={23}>Choose donors, then weight their distance</Label>
      <rect x={30 + 60 * Math.max(0, center - radius - 1)} y="49"
        width={60 * (Math.min(5, center + radius) - Math.max(1, center - radius))}
        height="63" fill={paint.computed} fillOpacity=".1" />
      <line x1="30" y1="85" x2="330" y2="85" stroke={paint.forward} />
      <line x1={30 + 60 * (center - 1)} x2={30 + 60 * (center - 1)} y1="45" y2="117" stroke={paint.computed} />
      {result.positions.map((position, index) => <g key={position}>
        <circle cx={30 + 60 * index} cy="85" r="6" fill={result.valid[index] ? paint.input : paint.muted} />
        <Label x={30 + 60 * index} y={140}>{position}</Label>
        <Label x={30 + 60 * index} y={168} small>{result.valid[index] ? 'eligible' : 'out'}</Label>
        <rect x={17 + 60 * index} y={251 - 65 * result.gaussian[index]} width="26"
          height={65 * result.gaussian[index]} fill={paint.computed} />
        <Label x={30 + 60 * index} y={275} small>{number(result.gaussian[index])}</Label>
        <Label x={30 + 60 * index} y={321} small>{number(result.weights[index])}</Label>
      </g>)}
      <Label x={180} y={191} small>Gaussian factors: bar height 0…1</Label>
      <Label x={180} y={299} small>Final weights = eligible shares × distance factors</Label>
      <Label x={180} y={346} small>Center {number(center)}, radius {number(radius)}; values = positions.</Label>
    </Drawing>
  </figure>;
}

export function AttentionCopyDrawing({ output, pGenerate }) {
  return <figure data-figure="attention-copy-aggregation">
    <Drawing height={395} label="Two Ada source occurrences aggregate into one word's copy probability; a separate vocabulary route mixes with copying.">
      <Label x={180} y={24}>Repeated positions, same word</Label>
      {['Ada .2', 'met .3', 'Ada .5'].map((token, index) => <Label key={index} x={60 + 120 * index} y={72} role="input">{token}</Label>)}
      <Arrow points={[[60, 86], [60, 132], [118, 132]]} />
      <Arrow points={[[300, 86], [300, 132], [203, 132]]} />
      <Operation x={120} y={117} width={82} label="Ada .7" />
      <Arrow points={[[180, 86], [180, 97], [270, 97], [270, 188]]} />
      <Label x={270} y={212} role="computed">met .3</Label>
      <Arrow points={[[161, 148], [161, 212], [103, 212], [103, 240]]} />
      <Label x={180} y={260} small>copy × {number(1 - pGenerate)} + vocabulary × {number(pGenerate)}</Label>
      {output.map((item, index) => <g key={item.word}>
        <Label x={30} y={300 + index * 25} anchor="start">{item.word}</Label>
        <rect x="95" y={286 + index * 25} width={180 * item.generated} height="17" fill={paint.parameter} />
        <rect x={95 + 180 * item.generated} y={286 + index * 25} width={180 * item.copied} height="17" fill={paint.computed} />
        <Label x={323} y={300 + index * 25} role="computed">{number(item.probability)}</Label>
      </g>)}
      <Label x={180} y={378} small>Amber = vocabulary; violet = copy; full track = 1.</Label>
    </Drawing>
  </figure>;
}

export function AttentionCoverageDrawing() {
  const rows = [[.6, .3, .1], [.2, .5, .3], [.8, .8, .4], [.1, .2, .7], [.1, .2, .4]];
  return <figure data-figure="attention-coverage-tally">
    <Drawing height={368} label="Past source shares add into a coverage tally. Current shares overlap that tally coordinatewise; their minima add into a penalty.">
      <Label x={180} y={24}>Previous reads by source position</Label>
      {['previous 1', 'previous 2', 'sum: coverage', 'current read', 'min overlap'].map((label, index) => <g key={label}>
        <Label x={112} y={64 + index * 52} anchor="end" small>{label}</Label>
        <Cells x={130} y={44 + index * 52} rows={1} columns={3} cell={42} values={[rows[index]]}
          role={index === 2 || index === 4 ? 'computed' : 'input'} />
      </g>)}
      <Label x={180} y={332} role="computed">penalty .1 + .2 + .4 = .7</Label>
      <Label x={180} y={360} small>Next tally = (.9, 1, 1.1), not another softmax row.</Label>
    </Drawing>
  </figure>;
}

export function AttentionLocationDrawing() {
  return <figure data-figure="attention-location-convolution">
    <Drawing height={352} label="A three-tap filter multiplies a window of previous source shares and sums them. That position feature joins the current query and key before the nonlinear scorer.">
      <Label x={180} y={24}>Where was the previous read?</Label>
      <Cells x={47} y={48} rows={1} columns={5} cell={53} values={[[0, .1, .7, .2, 0]]} role="input" />
      <rect x="99" y="44" width="163" height="62" fill="none" stroke={paint.foreground} strokeWidth="2" />
      <Label x={180} y={131} small>Selected three-position window: (.1, .7, .2)</Label>
      <Arrow points={[[180, 145], [180, 166]]} />
      <Cells x={117} y={192} rows={1} columns={3} cell={42} values={[[.25, .5, .25]]} role="parameter" />
      <Label x={180} y={184} role="parameter">three filter taps</Label>
      <Arrow points={[[180, 235], [180, 259]]} />
      <Label x={180} y={284} role="computed">.025 + .35 + .05 = .425</Label>
      <Label x={180} y={316}>current tanh(query + key + location)</Label>
      <Label x={180} y={342} small>One constructed filter; real systems learn more.</Label>
    </Drawing>
  </figure>;
}

export function AttentionMonotonicDrawing({ probabilities = [.5, .5, .5] }) {
  let remaining = 1;
  const chosen = probabilities.map(probability => { const mass = remaining * probability; remaining *= 1 - probability; return mass; });
  return <figure data-figure="attention-monotonic-scan">
    <Drawing height={308} label="A scan starts with reaching mass one. At each visited source position it chooses with a Bernoulli probability or passes the remaining mass forward; no selection returns zero.">
      <Label x={180} y={24}>One scan: choose here, or continue right</Label>
      <Label x={60} y={62} role="input">reach 1</Label>
      {probabilities.map((probability, index) => <g key={index}>
        <Operation x={16 + index * 120} y={94} width={87} label={`p${index}=${number(probability)}`} />
        {index < 2 && <Arrow points={[[105 + index * 120, 110], [133 + index * 120, 110]]} />}
        <Arrow points={[[60 + index * 120, 126], [60 + index * 120, 174]]} />
        <Label x={60 + index * 120} y={198} role="computed">choose</Label>
        <Label x={60 + index * 120} y={224} role="computed">{number(chosen[index])}</Label>
      </g>)}
      <Label x={180} y={272}>unselected mass {number(remaining)} → zero value</Label>
      <Label x={180} y={302} small>Right edge passes reach × (1 − p).</Label>
    </Drawing>
  </figure>;
}

export function AttentionGeneralDrawing() {
  return <figure data-figure="attention-general-map">
    <Drawing height={430} label="A three-coordinate memory is projected into the two-coordinate query space before a dot comparison; its original three coordinates bypass the scorer as returned value.">
      <Label x={86} y={24} role="input">memory h</Label>
      <Cells x={26} y={45} rows={1} columns={3} cell={40} values={[[1, 2, 3]]} />
      <Label x={277} y={24} role="input">query q</Label>
      <Cells x={237} y={45} rows={1} columns={2} cell={40} values={[[1, 0]]} />
      <Arrow points={[[86, 86], [86, 115]]} />
      <Label x={86} y={138} role="parameter">Wh: 2 × 3</Label>
      <Cells x={26} y={149} rows={2} columns={3} cell={40} role="parameter" values={[[1, 0, 0], [0, 1, 0]]} />
      <Arrow points={[[86, 230], [86, 257]]} />
      <Cells x={46} y={259} rows={1} columns={2} cell={40} role="computed" values={[[1, 2]]} />
      <Arrow points={[[128, 280], [235, 280]]} />
      <Arrow points={[[278, 86], [278, 263]]} />
      <Operation x={237} y={265} width={81} label="dot → 1" />
      <Label x={180} y={340} small>Return (1, 2, 3), not projected (1, 2).</Label>
      <Arrow points={[[26, 65], [9, 65], [9, 390], [77, 390]]} />
      <Cells x={79} y={370} rows={1} columns={3} cell={40} values={[[1, 2, 3]]} role="input" />
      <Label x={283} y={395} small>value bypass</Label>
    </Drawing>
  </figure>;
}

export function AttentionTensorDrawing() {
  return <figure data-figure="attention-tensor-axes">
    <div className="attention-flow-columns">
      <Drawing height={290} label="Two batched source memories have distinct real lengths but share rectangular storage; each position contains feature coordinates.">
        <Label x={180} y={24}>Batch N = B = 2; storage S = 5</Label>
        {[3, 5].map((length, example) => <g key={length}>
          <Cells x={example ? 193 : 22} y={62} rows={5} columns={4} cell={29} role="input" />
          {example === 0 && <rect x="22" y="149" width="116" height="58" fill="#080808" fillOpacity=".8" stroke={paint.muted} strokeDasharray="4 3" />}
          <Label x={example ? 251 : 80} y={238}>real length {length}</Label>
        </g>)}
        <Label x={180} y={278} small>Four feature columns are a cutaway; PAD is gray.</Label>
      </Drawing>
      <Drawing height={290} label="Source attention is target step by source position; output probabilities are target step by output vocabulary. These are different normalization axes.">
        <Label x={180} y={24}>One example, T = 3 writing steps</Label>
        <Cells x={18} y={73} rows={3} columns={5} cell={27} role="computed" />
        <Cells x={216} y={73} rows={3} columns={4} cell={27} role="computed" />
        <Label x={86} y={62} small>source positions S</Label>
        <Label x={270} y={62} small>output vocabulary V</Label>
        <Label x={86} y={191}>attention T × S</Label>
        <Label x={270} y={191}>output T × V</Label>
        <Label x={180} y={231} small>Each row sums across its own columns.</Label>
        <Label x={180} y={269} small>The four vocabulary columns are a cutaway.</Label>
      </Drawing>
    </div>
  </figure>;
}

export function AttentionTrainingDrawing() {
  return <figure data-figure="attention-training-fork">
    <Drawing height={448} label="Source alone forms memory and decoder initialization. Shifted target prefix supplies previous tokens in training. Desired next targets enter cross entropy only, with target padding ignored.">
      <Label x={80} y={24} role="input">source</Label><Label x={276} y={24} role="input">reference answer</Label>
      <Cells x={18} y={47} rows={1} columns={3} cell={40} values={[["past", "…", "EOS"]]} />
      <Cells x={216} y={47} rows={1} columns={3} cell={40} values={[["w", "…", "EOS"]]} />
      <Arrow points={[[78, 89], [78, 120]]} />
      <Operation x={20} y={121} width={116} label="encoder" />
      <Arrow points={[[78, 152], [78, 188]]} />
      <Operation x={20} y={189} width={116} label="memory + init" />
      <Arrow points={[[276, 89], [276, 120]]} />
      <Operation x={216} y={121} width={118} label="shift prefix" />
      <Label x={276} y={175} small>BOS, w, …</Label>
      <Arrow points={[[276, 187], [276, 240], [240, 240]]} />
      <Arrow points={[[78, 220], [78, 240], [119, 240]]} />
      <Operation x={121} y={226} width={118} label="decoder/read" />
      <Arrow points={[[180, 257], [180, 283]]} />
      <Operation x={104} y={284} width={152} label="masked output logits" />
      <Arrow points={[[180, 315], [180, 352]]} />
      <Operation x={117} y={353} width={126} label="cross-entropy" />
      <Arrow points={[[336, 68], [350, 68], [350, 368], [244, 368]]} />
      <Label x={292} y={333} small>next target only</Label>
      <Label x={180} y={430} small>Ignore PAD rows; forbid PAD output.</Label>
    </Drawing>
  </figure>;
}

export function AttentionAmbiguityDrawing() {
  return <figure data-figure="attention-ambiguous-mixtures">
    <div className="attention-flow-columns">
      {[ [.4, .4, .2], [.2, .2, .6] ].map((weights, index) => <AttentionValueDrawing key={index}
        values={[[1, 0], [0, 1], [.5, .5]]} attention={weights} />)}
    </div>
    <figcaption>The two actual contribution paths differ but end at the same diamond (.5, .5).
      Left shares (.4, .4, .2); right shares (.2, .2, .6). With the same other inputs, a head receiving only this context cannot distinguish them.</figcaption>
  </figure>;
}

export function AttentionPyramidDrawing() {
  return <figure data-figure="attention-speech-pyramid">
    <Drawing height={343} label="Adjacent feature vectors concatenate into pairs before a bidirectional recurrent layer. Two original time positions become one lower-resolution position; backward arrows reveal future access.">
      <Label x={180} y={24}>Pair adjacent time vectors</Label>
      {Array.from({ length: 4 }, (_, index) => <g key={index}>
        <Cells x={28 + index * 82} y={54} rows={2} columns={1} cell={28} />
        <Label x={42 + index * 82} y={139} small>time {index}</Label>
      </g>)}
      <Arrow points={[[42, 111], [42, 156], [99, 156], [99, 179]]} />
      <Arrow points={[[124, 111], [124, 156], [99, 156]]} />
      <Arrow points={[[206, 111], [206, 156], [263, 156], [263, 179]]} />
      <Arrow points={[[288, 111], [288, 156], [263, 156]]} />
      <Cells x={44} y={181} rows={1} columns={4} cell={28} />
      <Cells x={208} y={181} rows={1} columns={4} cell={28} />
      <Arrow points={[[156, 195], [207, 195]]} />
      <Arrow points={[[207, 226], [157, 226]]} />
      <Label x={180} y={260} small>Forward → and backward ← recurrent dependencies</Label>
      <Label x={180} y={304}>Four positions → two; feature width doubles</Label>
      <Label x={180} y={337} small>Three such reductions shorten time by 2³ = 8.</Label>
    </Drawing>
  </figure>;
}

export function AttentionCacheDrawing() {
  return <figure data-figure="attention-cache-ownership">
    <Drawing height={380} label="One fixed source memory and projected key cache fans into distinct candidate reads. Each candidate owns its query, recurrent state, previous combined vector and prefix.">
      <Label x={180} y={24}>One source, separate histories</Label>
      <Cells x={120} y={49} rows={4} columns={4} cell={30} role="input" />
      <Label x={180} y={196} small>memory H and projected keys (feature cutaways)</Label>
      <Arrow points={[[180, 170], [180, 215], [83, 215], [83, 245]]} />
      <Arrow points={[[180, 215], [279, 215], [279, 245]]} />
      <Operation x={26} y={246} width={114} label="candidate A" />
      <Operation x={222} y={246} width={114} label="candidate B" />
      <Label x={83} y={304} small>query A, state A</Label><Label x={279} y={304} small>query B, state B</Label>
      <Label x={83} y={330} small>fed A, prefix A</Label><Label x={279} y={330} small>fed B, prefix B</Label>
      <Label x={180} y={373} small>Share source, separate candidate states.</Label>
    </Drawing>
  </figure>;
}
