import { useEffect, useId, useRef, useState } from 'react';
import './measure-reading-flow.css';

export const mt = (value, digits = 6) =>
  value === null || value === undefined || Number.isNaN(value)
    ? 'undefined'
    : !Number.isFinite(value)
      ? value < 0
        ? '−∞'
        : '∞'
      : (value === 0
          ? '0'
          : Math.abs(value) < 1e-4 || Math.abs(value) >= 1e6
            ? value.toExponential(digits - 1)
            : String(Number(value.toFixed(digits)))
        ).replace(/-/g, '−');
export const mc = ['#e7b54a', '#70bdcc', '#d89ca9', '#b2a0d7'];
export function MFigure({ id, children, caption }) {
  return (
    <figure className="mt-figure" data-mechanism={id} aria-label={id}>
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
export function MRegion({ label, kind = 'drawing', className = '', children }) {
  const ref = useRef(null),
    hint = useId();
  const [axes, setAxes] = useState([false, false]);
  useEffect(() => {
    const node = ref.current;
    const measure = () => {
      const next = [
        node.scrollWidth > node.clientWidth + 2,
        node.scrollHeight > node.clientHeight + 2,
      ];
      setAxes((old) => (old[0] === next[0] && old[1] === next[1] ? old : next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [children]);
  const scrolling = axes.some(Boolean);
  return (
    <div className="mt-reading-region">
      {scrolling && (
        <p className="mt-scroll-hint" id={hint}>
          Scroll to see the complete {kind}. Focus this region and use{' '}
          {axes[0] && axes[1] ? 'Left/Right and Up/Down' : axes[0] ? 'Left/Right' : 'Up/Down'} arrow
          keys.
        </p>
      )}
      <div
        ref={ref}
        className={className}
        role="region"
        tabIndex={0}
        aria-label={label}
        aria-describedby={scrolling ? hint : undefined}
      >
        {children}
      </div>
    </div>
  );
}
export function MScene({ label, width = 680, height = 320, children }) {
  const title = useId();
  return (
    <MRegion label={label} className="mt-scene-region">
      <svg
        className="mt-scene"
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: `${width / 16}rem`, maxWidth: '100%' }}
        role="img"
        aria-labelledby={title}
      >
        <title id={title}>{label}</title>
        {children}
      </svg>
    </MRegion>
  );
}
export function MResponsive({ maximum = 680, children }) {
  const ref = useRef(null),
    probe = useRef(null);
  const [width, setWidth] = useState(240);
  useEffect(() => {
    const node = ref.current,
      remNode = probe.current;
    const measure = () => {
      if (ref.current !== node) return;
      const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
      const next = Math.max(180, Math.min(maximum, Math.floor(node.clientWidth / unit)));
      setWidth((old) => (old === next ? old : next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observer.observe(remNode);
    measure();
    return () => observer.disconnect();
  }, [maximum]);
  return (
    <div className="mt-responsive" ref={ref}>
      <span ref={probe} className="mt-rem-probe" aria-hidden="true" />
      {children(width)}
    </div>
  );
}
export function MLabel({ x, y, colour = '#ddd', anchor = 'start', children, halo = false }) {
  return (
    <text
      x={x}
      y={y}
      fill={colour}
      textAnchor={anchor}
      className="mt-label"
      stroke={halo ? '#171717' : undefined}
      strokeWidth={halo ? 5 : undefined}
      paintOrder="stroke fill"
    >
      {children}
    </text>
  );
}
export function MArrow({ x1, y1, x2, y2, colour = '#aaa', dashed = false }) {
  if (Math.hypot(x2 - x1, y2 - y1) < 0.01) return null;
  const angle = Math.atan2(y2 - y1, x2 - x1),
    r = 7;
  const points = [
    [x2, y2],
    [x2 - r * Math.cos(angle - 0.5), y2 - r * Math.sin(angle - 0.5)],
    [x2 - r * Math.cos(angle + 0.5), y2 - r * Math.sin(angle + 0.5)],
  ];
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={colour}
        strokeWidth={2}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <polygon points={points.map((p) => p.join(',')).join(' ')} fill={colour} />
    </g>
  );
}
export function MTable({ label, columns, rows, tall = false }) {
  return (
    <div className="mt-table">
      <p className="mt-table-label">{label}</p>
      <MRegion
        label={label}
        kind="table"
        className={`mt-table-region${tall ? ' mt-table-region--tall' : ''}`}
      >
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th scope="col" key={i}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th scope="row" key={j}>
                      {cell}
                    </th>
                  ) : (
                    <td key={j}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </MRegion>
    </div>
  );
}
export function MPlot({
  label,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  series = [],
  references = [],
  width = 680,
  height = 330,
  equal = false,
  background,
  children,
}) {
  const clip = useId();
  const named = [
    ...series.map((s, i) =>
      s.name
        ? {
            name: s.name,
            colour: s.colour || mc[i % 4],
            dash: s.dash,
            dots: s.dots,
            marker: s.marker,
            connect: s.connect !== false,
          }
        : null,
    ),
    ...references.map((r) =>
      r.name
        ? { name: r.name + ' (dashed)', colour: r.colour || '#888', dash: '5 4', connect: true }
        : null,
    ),
  ].filter(Boolean);
  return (
    <MResponsive maximum={width}>
      {(canvas) => {
        const left = Math.max(78, ...[yDomain[0], yDomain[1]].map((v) => mt(v, 3).length * 9 + 20)),
          right = canvas - 22,
          top = 16;
        const drawable = right - left;
        const plotHeight = equal
          ? (drawable * (yDomain[1] - yDomain[0])) / (xDomain[1] - xDomain[0])
          : Math.min(260, Math.max(180, height - 117));
        const bottom = top + plotHeight,
          sceneHeight = bottom + 48;
        const sx = drawable / (xDomain[1] - xDomain[0]),
          sy = plotHeight / (yDomain[1] - yDomain[0]);
        const scale = equal ? Math.min(sx, sy) : null;
        const x = (v) =>
          left +
          (drawable - (scale ? scale * (xDomain[1] - xDomain[0]) : drawable)) / 2 +
          (v - xDomain[0]) * (scale || sx);
        const y = (v) =>
          bottom -
          (plotHeight - (scale ? scale * (yDomain[1] - yDomain[0]) : plotHeight)) / 2 -
          (v - yDomain[0]) * (scale || sy);
        // Keep true endpoint anchors. Include an interior zero only when its label clears both ends.
        const showXZero =
          xDomain[0] < 0 &&
          xDomain[1] > 0 &&
          xDomain.every((v) => Math.abs(x(v) - x(0)) >= (mt(v, 3).length + 1) * 4.5 + 12);
        const showYZero =
          yDomain[0] < 0 && yDomain[1] > 0 && yDomain.every((v) => Math.abs(y(v) - y(0)) >= 24);
        const xt = [...new Set([xDomain[0], ...(showXZero ? [0] : []), xDomain[1]])];
        const yt = [...new Set([yDomain[0], ...(showYZero ? [0] : []), yDomain[1]])];
        return (
          <>
            {named.length > 0 && (
              <p className="mt-series-key">
                {named.map((s, i) => (
                  <span key={i} style={{ color: s.colour }}>
                    <svg
                      width="42"
                      height="18"
                      viewBox="0 0 42 18"
                      aria-hidden="true"
                      style={{ width: '2.625rem', height: '1.125rem', flexShrink: 0 }}
                    >
                      {s.connect && (
                        <line
                          x1="2"
                          x2="40"
                          y1="9"
                          y2="9"
                          stroke={s.colour}
                          strokeWidth="2"
                          strokeDasharray={s.dash}
                        />
                      )}
                      {s.dots && (
                        <circle
                          cx="21"
                          cy="9"
                          r="5"
                          fill={s.marker === 'ring' ? 'none' : s.colour}
                          stroke={s.colour}
                          strokeWidth="2"
                        />
                      )}
                    </svg>
                    {s.name}
                  </span>
                ))}
              </p>
            )}
            <p className="mt-axis-label">Vertical axis: {yLabel}</p>
            <MScene label={label} width={canvas} height={sceneHeight}>
              <defs>
                <clipPath id={clip}>
                  <rect
                    x={x(xDomain[0])}
                    y={y(yDomain[1])}
                    width={x(xDomain[1]) - x(xDomain[0])}
                    height={y(yDomain[0]) - y(yDomain[1])}
                  />
                </clipPath>
              </defs>
              <line
                x1={x(xDomain[0])}
                x2={x(xDomain[1])}
                y1={y(yDomain[0])}
                y2={y(yDomain[0])}
                stroke="#888"
              />
              <line
                x1={x(xDomain[0])}
                x2={x(xDomain[0])}
                y1={y(yDomain[0])}
                y2={y(yDomain[1])}
                stroke="#888"
              />
              <g clipPath={`url(#${clip})`}>
                {typeof background === 'function'
                  ? background({ x, y, left, right, top, bottom })
                  : background}
                {references.map((r, i) =>
                  r.axis === 'x' ? (
                    <line
                      key={i}
                      x1={x(r.value)}
                      x2={x(r.value)}
                      y1={y(yDomain[0])}
                      y2={y(yDomain[1])}
                      stroke={r.colour || '#888'}
                      strokeDasharray="5 4"
                    />
                  ) : (
                    <line
                      key={i}
                      x1={x(xDomain[0])}
                      x2={x(xDomain[1])}
                      y1={y(r.value)}
                      y2={y(r.value)}
                      stroke={r.colour || '#888'}
                      strokeDasharray="5 4"
                    />
                  ),
                )}
                {series.map((s, i) => (
                  <g key={i}>
                    {s.area && (
                      <polygon
                        points={[
                          `${x(s.points[0][0])},${y(0)}`,
                          ...s.points.map((p) => `${x(p[0])},${y(p[1])}`),
                          `${x(s.points.at(-1)[0])},${y(0)}`,
                        ].join(' ')}
                        fill={s.colour || mc[i % 4]}
                        opacity={0.22}
                      />
                    )}
                    {s.connect !== false && (
                      <polyline
                        points={s.points
                          .filter((p) => p.every(Number.isFinite))
                          .map((p) => `${x(p[0])},${y(p[1])}`)
                          .join(' ')}
                        fill="none"
                        stroke={s.colour || mc[i % 4]}
                        strokeWidth={2}
                        strokeDasharray={s.dash}
                      />
                    )}
                  </g>
                ))}
                {typeof children === 'function'
                  ? children({ x, y, left, right, top, bottom })
                  : children}
              </g>
              {series.map(
                (s, i) =>
                  s.dots &&
                  s.points
                    .filter(
                      (p) =>
                        p.every(Number.isFinite) &&
                        p[0] >= xDomain[0] &&
                        p[0] <= xDomain[1] &&
                        p[1] >= yDomain[0] &&
                        p[1] <= yDomain[1],
                    )
                    .map((p, j) => (
                      <circle
                        key={i + '-' + j}
                        cx={x(p[0])}
                        cy={y(p[1])}
                        r={s.marker === 'ring' ? 7 : 4}
                        fill={s.marker === 'ring' ? 'none' : s.colour || mc[i % 4]}
                        stroke={s.marker === 'ring' ? s.colour || mc[i % 4] : undefined}
                        strokeWidth={s.marker === 'ring' ? 2 : undefined}
                      />
                    )),
              )}
              {xt.map((v) => (
                <g key={v}>
                  <line x1={x(v)} x2={x(v)} y1={bottom} y2={bottom + 6} stroke="#888" />
                  <MLabel x={x(v)} y={bottom + 27} anchor="middle" halo>
                    {mt(v, 3)}
                  </MLabel>
                </g>
              ))}
              {yt.map((v) => (
                <g key={v}>
                  <line x1={left - 6} x2={left} y1={y(v)} y2={y(v)} stroke="#888" />
                  <MLabel x={left - 12} y={y(v) + 5} anchor="end" halo>
                    {mt(v, 3)}
                  </MLabel>
                </g>
              ))}
            </MScene>
            <p className="mt-axis-label">Horizontal axis: {xLabel}</p>
          </>
        );
      }}
    </MResponsive>
  );
}
export function MBars({
  label,
  columns,
  rows,
  signed = false,
  max = null,
  controls = null,
  colours = mc,
  rowColours = null,
}) {
  const values = rows.flatMap((r) =>
    r.slice(1).filter((v) => typeof v === 'number' && Number.isFinite(v)),
  );
  const extent = max || Math.max(0.001, ...values.map(Math.abs));
  return (
    <MResponsive>
      {(width) => {
        const left = 12,
          right = width - 12,
          zero = signed ? width / 2 : left,
          unit = (right - left) / (signed ? 2 : 1) / extent;
        return (
          <>
            <p className="mt-series-key">
              {columns.slice(1).map((column, i) => (
                <span key={i} style={{ color: rowColours ? '#ddd' : colours[i % colours.length] }}>
                  {column}
                </span>
              ))}
            </p>
            <p className="mt-axis-label">
              Common quantitative axis:{' '}
              {signed ? mt(-extent) + ' through 0 to ' + mt(extent) : '0 to ' + mt(extent)}. The
              vertical line marks zero.
            </p>
            {rows.map((row, i) => (
              <div className="mt-bar-row" key={i}>
                <p className="mt-bar-name">{row[0]}</p>
                <MScene
                  label={label + '; ' + row[0]}
                  width={width}
                  height={26 + row.slice(1).length * 30}
                >
                  <line
                    x1={zero}
                    x2={zero}
                    y1={2}
                    y2={22 + row.slice(1).length * 30}
                    stroke="#888"
                  />
                  {row
                    .slice(1)
                    .map((value, j) =>
                      Number.isFinite(value) ? (
                        <rect
                          key={j}
                          x={zero + Math.min(0, value * unit)}
                          y={12 + j * 30}
                          width={Math.abs(value) * unit}
                          height={12}
                          fill={rowColours?.[i] || colours[j % colours.length]}
                        />
                      ) : null,
                    )}
                </MScene>
                <p className="mt-bar-values">
                  {row.slice(1).map((value, j) => (
                    <span key={j} style={{ color: rowColours?.[i] || colours[j % colours.length] }}>
                      {columns[j + 1]}: {mt(value)}
                    </span>
                  ))}
                </p>
              </div>
            ))}
            {controls}
            <MTable
              label={label + '; complete numerical values'}
              columns={columns}
              rows={rows.map((row) => row.map((v) => (typeof v === 'number' ? mt(v) : v)))}
            />
          </>
        );
      }}
    </MResponsive>
  );
}
