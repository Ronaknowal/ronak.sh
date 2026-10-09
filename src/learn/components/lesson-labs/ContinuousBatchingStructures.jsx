import { requestColor } from '../../data/continuous-batching-models.js';
import { fmt, Scroll, Table } from './ContinuousBatchingShared.jsx';
export function Identity({
  id,
  children
}) {
  return <span className="cb-id" style={{
    '--cb-identity': requestColor(id)
  }}>{children || id}</span>;
}
export function Timeline({
  title,
  intervals,
  slots = 4,
  maximum,
  limit,
  cursor,
  events = [],
  dependencies = [],
  unit = 'work units',
  legend = false
}) {
  const end = limit || maximum;
  const left = 75,
    width = 650,
    height = 46 + slots * 38;
  const x = value => left + width * value / end;
  return <div><p>{title}</p><Scroll label={title}>
    <svg className="cb-timeline" viewBox={`0 0 760 ${height}`} role="img" aria-label={`${title}; axis 0 to ${fmt(end)} ${unit}. ${intervals.map(row => `${row.label || row.id}, lane ${row.slot}, ${fmt(row.begin)} to ${fmt(row.end)}`).join('; ')}`}>
      {Array.from({
          length: slots
        }, (_, slot) => <g key={slot}>
        <text x="0" y={28 + slot * 38}>lane {slot}</text>
        <rect x={left} y={10 + slot * 38} width={width} height="25" fill="#242731" />
      </g>)}
      {intervals.filter(row => row.begin < end).map((row, index) => <g key={index}>
        <rect x={x(row.begin)} y={10 + row.slot * 38} width={Math.max(.5, x(Math.min(end, row.end)) - x(row.begin))} height="25" fill={requestColor(row.id)} fillOpacity=".55" stroke={requestColor(row.id)} />
        {Math.min(end, row.end) - row.begin > end / 30 && <text x={x(row.begin) + 4} y={28 + row.slot * 38}>{row.label || row.id}</text>}
      </g>)}
      {events.filter(row => row.time <= end).map((row, index) => <g key={`event-${index}`}>
        <path d={`M${x(row.time)} ${7 + row.slot * 38}v31`} stroke="#fff" strokeWidth="1.5" />
        <circle cx={x(row.time)} cy={10 + row.slot * 38} r="3" fill={requestColor(row.id)} stroke="white" />
      </g>)}
      {dependencies.map((row, index) => <path key={`dependency-${index}`} d={`M${x(row.from)} ${35 + row.fromSlot * 38}L${x(row.to)} ${10 + row.toSlot * 38}`} stroke={requestColor(row.id)} strokeWidth="2" strokeDasharray="3 2" />)}
      {[0, .25, .5, .75, 1].map(fraction => <text key={fraction} x={x(end * fraction)} y={height - 7} textAnchor="middle">{fmt(end * fraction, 2)}</text>)}
      {cursor != null && <path d={`M${x(cursor)} 4V${height - 25}`} stroke="white" strokeWidth="2" />}
    </svg>
  </Scroll><p>Shared horizontal scale: {unit}; dark intervals are idle.</p>
    {legend && <Table label="Every colored interval, including short requests" headers={['request', 'lane', 'begin', 'end']} rows={intervals.map((row, index) => [<Identity key={index} id={row.id} />, row.slot, row.begin, row.end])} />}
  </div>;
}
export function EventLine({
  title,
  events,
  maximum,
  spans = []
}) {
  const x = t => 55 + t / maximum * 650;
  return <div><p>{title}</p><Scroll label={title}><svg className="cb-timeline" viewBox={`0 0 760 ${Math.max(220, 190 + spans.length * 24)}`} role="img" aria-label={`${title}. ${events.map(e => `${e.label} at ${fmt(e.time)}`).join('; ')}. ${spans.map(s => `${s.label}: ${fmt(s.end - s.begin)}`).join('; ')}`}>
    <path d="M55 75H705" stroke="#bfc1cb" strokeWidth="2" />
    {events.map((e, i) => <g key={i}>
      <path d={`M${x(e.time)} 70V${i % 2 ? 115 : 30}`} stroke={requestColor(e.id || 'A')} />
      <circle cx={x(e.time)} cy="75" r="5" fill={requestColor(e.id || 'A')} />
      <text x={x(e.time)} y={i % 2 ? 132 : 20} textAnchor="middle">{e.label}</text>
      <text x={x(e.time)} y={i % 2 ? 150 : 38} textAnchor="middle">{fmt(e.time)} s</text>
    </g>)}
    {spans.map((s, i) => <g key={i}>
      <path d={`M${x(s.begin)} ${171 + i * 24}v6H${x(s.end)}v-6`} stroke={requestColor('BCD'[i % 3])} fill="none" />
      <text x={(x(s.begin) + x(s.end)) / 2} y={171 + i * 24} textAnchor="middle">{s.label}: {fmt(s.end - s.begin)} s</text>
    </g>)}
  </svg></Scroll></div>;
}
export function Pool({
  pool,
  title = 'Physical K/V storage',
  selected,
  showFree = true,
  origins
}) {
  const state = pool.snapshot ? pool.snapshot() : pool;
  const size = state.keys[0].length;
  const owners = page => Object.entries(state.tables).filter(([, table]) => table.includes(page)).map(([id]) => id);
  const valid = (page, offset) => Object.entries(state.tables).some(([id, table]) => {
    const logical = table.indexOf(page);
    return logical >= 0 && logical * size + offset < state.lengths[id];
  });
  return <div><Table label="Request tables: logical block → physical page" headers={['ID', 'valid length', 'table']} rows={Object.entries(state.tables).map(([id, table]) => [<Identity id={id} key={id} />, state.lengths[id], `[${table.join(', ')}]`])} />
    <Scroll label="Colored request-table paths to physical page addresses"><svg className="cb-timeline" viewBox={`0 0 760 ${Math.max(state.keys.length * 37 + 30, Object.keys(state.tables).length * 85 + 30)}`} role="img" aria-label={Object.entries(state.tables).map(([id, table]) => `${id} logical blocks map to physical pages ${table.join(', ')}`).join('; ') || 'No live request tables'}>
      {state.keys.map((_, page) => <g key={page}>
        <rect x="545" y={12 + page * 37} width="145" height="26" rx="2" fill="#242731" stroke="#777b88" />
        <text x="555" y={30 + page * 37}>page {page} · refs {state.refs[page]}</text>
      </g>)}
      {Object.entries(state.tables).map(([id, table], row) => <g key={id}>
        <text x="8" y={35 + row * 85} style={{
            fill: requestColor(id)
          }}>{id} table · valid {state.lengths[id]}</text>
        {table.map((page, block) => <g key={block}>
          <rect x={8 + block * 54} y={43 + row * 85} width="44" height="25" fill="#242731" stroke={requestColor(id)} />
          <text x={30 + block * 54} y={61 + row * 85} textAnchor="middle">{page}</text>
          <path d={`M${30 + block * 54} ${68 + row * 85}C${340 + block * 12} ${80 + row * 85},440 ${25 + page * 37},545 ${25 + page * 37}`} fill="none" stroke={requestColor(id)} strokeWidth="1.5" />
        </g>)}
      </g>)}
    </svg></Scroll>
    <p>{title}: one displayed layer, head and feature coordinate. Each cell contains K and V.</p>
    <Scroll label={title}><div className="cb-pool" style={{
        minWidth: `${9 + size * 5}em`
      }}>
      {state.keys.map((keys, page) => (showFree || state.refs[page] > 0) && <div className="cb-page" key={page}>
        <span>page {page}<br /><small>refs {state.refs[page]} · {owners(page).join('/') || 'free'}</small></span>
        <div className="cb-page-cells">{keys.map((key, offset) => <div key={offset} style={{
              '--cb-identity': owners(page).length ? requestColor(origins?.[page] || owners(page)[0]) : '#9498a6'
            }} className={`cb-cell ${valid(page, offset) ? '' : 'cb-invalid'} ${selected?.[0] === page && selected?.[1] === offset ? 'cb-selected' : ''}`}>
          <small>offset {offset}</small><span>K {fmt(key)}</span><span>V {fmt(state.values[page][offset])}</span>
        </div>)}</div>
      </div>)}
    </div></Scroll><p>Free page addresses: [{state.free.join(', ')}]. Hatching means no live request may read that cell.</p>
  </div>;
}
