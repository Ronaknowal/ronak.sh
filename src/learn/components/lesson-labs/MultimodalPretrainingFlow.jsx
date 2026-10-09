import { useEffect, useRef, useState } from 'react';
import {
  FlowLab,
  FlowControls,
  FlowSlider,
  FlowChoice,
  FlowReadout,
  flowNumber as f,
} from './LessonFlow.jsx';
import {
  IMAGES,
  TEXTS,
  BASE_SCORES,
  dot,
  normalize,
  softmax,
  paired,
  alignmentStep,
  positiveSet,
  sigmoidPairs,
  savedForward,
  queryRead,
  qformerMask,
  detailCounts,
} from '../../data/multimodal-pretraining-models.js';
import './multimodal-pretraining-flow.css';

const BLUE = '#60a5fa',
  AMBER = '#e2b55a',
  VIOLET = '#c084fc',
  ROSE = '#f472b6',
  CYAN = '#67d4df';
const identities = [BLUE, ROSE, CYAN];
const digitNames = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const requests = new Map();
function useStudy(name = 'scratch') {
  const [state, setState] = useState({ data: null, error: false }),
    [attempt, retry] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ data: null, error: false });
    const url = `/learn-code/multimodal-pretraining/${name}-study.json`;
    if (!requests.has(url))
      requests.set(
        url,
        fetch(url)
          .then((r) => {
            if (!r.ok) throw new Error('unavailable');
            return r.json();
          })
          .catch((e) => {
            requests.delete(url);
            throw e;
          }),
      );
    requests
      .get(url)
      .then((data) => active && setState({ data, error: false }))
      .catch(() => active && setState({ data: null, error: true }));
    return () => {
      active = false;
    };
  }, [name, attempt]);
  return { ...state, retry: () => retry((n) => n + 1) };
}
function Loading({ state }) {
  return (
    <p role="status">
      {state.error ? (
        <>
          Saved study could not load. <button onClick={state.retry}>Retry saved study</button>
        </>
      ) : (
        'Loading saved study…'
      )}
    </p>
  );
}
function Figure({ name, children, caption }) {
  return (
    <figure className="mmp-figure" data-mmp-figure={name} aria-label={name}>
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
function Scroll({ label, children }) {
  const ref = useRef(null),
    [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = ref.current,
      measure = () => setOverflow(el.scrollWidth > el.clientWidth + 1),
      observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <div className="mmp-scroll-group">
      <div
        ref={ref}
        className="mmp-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${label}; scroll horizontally when needed`}
      >
        {children}
      </div>
      {overflow && (
        <small className="mmp-scroll-hint">
          ↔ Scroll to inspect the whole diagram; arrow keys work when focused.
        </small>
      )}
    </div>
  );
}
function Grid({ values, rows, columns, label, color = VIOLET, select, chosen, boolean = false }) {
  return (
    <div className="mmp-grid-wrap">
      <strong className="mmp-small">{label}</strong>
      <Scroll label={label}>
        <table className="mmp-matrix">
          <thead>
            <tr>
              <th scope="col">row ↓ / col →</th>
              {values[0]?.map((_, j) => (
                <th key={j} scope="col">
                  {columns?.[j] ?? j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((row, i) => (
              <tr key={i}>
                <th scope="row">{rows?.[i] ?? i}</th>
                {row.map((v, j) => (
                  <td
                    key={j}
                    style={{
                      '--mmp-hue': color,
                      '--mmp-alpha': boolean
                        ? v
                          ? 0.25
                          : 0
                        : 0.04 + Math.min(1, Math.abs(v) / 3) * 0.27,
                    }}
                    className={chosen?.[0] === i && chosen?.[1] === j ? 'mmp-chosen' : ''}
                  >
                    {select ? (
                      <button
                        onClick={() => select(i, j)}
                        aria-label={`${label}, row ${rows?.[i] ?? i}, column ${columns?.[j] ?? j}: ${boolean ? (v ? 'permitted' : 'blocked') : f(v, 3)}`}
                      >
                        {boolean ? (v ? '1' : '×') : f(v, 3)}
                      </button>
                    ) : boolean ? (
                      v ? (
                        '1'
                      ) : (
                        '×'
                      )
                    ) : (
                      f(v, 3)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Scroll>
    </div>
  );
}
function Pixels({ pixels, selected, onSelect, label = 'Measured 8 by 8 image' }) {
  return (
    <div className="mmp-pixels" role={onSelect ? 'group' : 'img'} aria-label={label}>
      {pixels.map((v, i) =>
        onSelect ? (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Pixel ${Math.floor(i / 8)}, ${i % 8}: ${v}`}
            aria-pressed={selected === i}
            style={{
              background: `rgb(${25 + (v / 16) * 220} ${25 + (v / 16) * 220} ${25 + (v / 16) * 220})`,
            }}
          />
        ) : (
          <span
            key={i}
            style={{
              background: `rgb(${25 + (v / 16) * 220} ${25 + (v / 16) * 220} ${25 + (v / 16) * 220})`,
            }}
          />
        ),
      )}
    </div>
  );
}
function Bars({
  values,
  labels,
  max = Math.max(1, ...values.map(Math.abs)),
  color = VIOLET,
  suffix = '',
}) {
  const signed = values.some((v) => v < 0);
  return (
    <div className="mmp-bars">
      {values.map((v, i) => (
        <div className="mmp-bar" key={i}>
          <span>{labels[i]}</span>
          <div className={`mmp-bar-track ${signed ? 'mmp-signed' : ''}`}>
            <i
              style={{
                width: `${(Math.abs(v) / max) * (signed ? 50 : 100)}%`,
                marginLeft: signed ? `${v < 0 ? 50 - (Math.abs(v) / max) * 50 : 50}%` : 0,
                background: color,
              }}
            />
          </div>
          <output>
            {f(v, 3)}
            {suffix}
          </output>
        </div>
      ))}
    </div>
  );
}
function Tokens({ label, words, colors = [], labels = [] }) {
  return (
    <div className="mmp-token-lane">
      <strong>{label}</strong>
      <div className="mmp-tokens">
        {words.map((w, i) => (
          <div className="mmp-token" key={i} style={{ '--mmp-hue': colors[i] || AMBER }}>
            <small>{labels[i] ?? `pos ${i}`}</small>
            <span>{w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function MatrixEditor({ scores, setScores, selected, setSelected }) {
  return (
    <>
      <Grid
        label="S: image rows × caption columns"
        values={scores}
        rows={['A', 'B', 'C']}
        columns={['a', 'b', 'c']}
        chosen={selected}
        select={(i, j) => setSelected([i, j])}
      />
      <FlowControls>
        <FlowSlider
          name={`Score S[${selected.join(',')}]`}
          value={scores[selected[0]][selected[1]]}
          min={-8}
          max={8}
          step={0.1}
          onChange={(v) =>
            setScores(
              scores.map((r, i) =>
                r.map((x, j) => (i === selected[0] && j === selected[1] ? v : x)),
              ),
            )
          }
        />
        <button onClick={() => setScores(BASE_SCORES.map((r) => [...r]))}>Reset scores</button>
        <button onClick={() => setScores(BASE_SCORES.map((r) => r.map(() => 0)))}>
          Equal scores
        </button>
      </FlowControls>
    </>
  );
}
function useScores() {
  const [scores, setScores] = useState(BASE_SCORES),
    [selected, setSelected] = useState([0, 0]);
  return { scores, setScores, selected, setSelected, p: paired(scores) };
}

export function PairedArchive() {
  const state = useStudy();
  if (!state.data) return <Loading state={state} />;
  const d = state.data,
    rows = [0, 20, 40];
  return (
    <Figure
      name="01 Paired archive"
      caption="Real optical-digit measurements. Captions are authored from supplied class labels; these are not natural-image web captions."
    >
      <div className="mmp-archive">
        {rows.map((r, i) => {
          const source = d.final.assessment.source_ids[r],
            label = d.data.labels[source];
          return (
            <div key={r} style={{ '--mmp-hue': identities[i] }}>
              <small>
                pair {String.fromCharCode(65 + i)} · source {source}
              </small>
              <Pixels pixels={d.assessment_pixels[r]} label={`Source ${source}: digit ${label}`} />
              <div className="mmp-pair-line">↕ paired supervision</div>
              <strong>“digit {digitNames[label]}”</strong>
              <small>class {label} ≠ source ID</small>
            </div>
          );
        })}
      </div>
    </Figure>
  );
}
export function OutputInterfaces() {
  return (
    <Figure
      name="02 Three output interfaces"
      caption="The same visual evidence can feed different output objects; a matching score alone does not generate text or pixels."
    >
      <div className="mmp-output-types">
        <div>
          <strong>Retrieve</strong>
          <Bars
            values={[0.8, 0.15, 0.05]}
            labels={['seven · rank 1', 'one · rank 2', 'nine · rank 3']}
            color={BLUE}
          />
          <small>Illustrative ranking over candidates</small>
        </div>
        <div>
          <strong>Answer</strong>
          <Tokens label="next IDs → words" words={['It', 'is', 'seven', 'EOS']} />
          <small>Autoregressive text decoder required</small>
        </div>
        <div>
          <strong>Draw</strong>
          <Grid
            label="Image code grid (constructed)"
            values={[
              [6, 7],
              [8, 9],
            ]}
            color={CYAN}
          />
          <div className="mmp-arrow">↓ image decoder → pixels</div>
        </div>
      </div>
    </Figure>
  );
}
export function FeatureAnatomy() {
  const state = useStudy(),
    [patch, setPatch] = useState(5);
  if (!state.data) return <Loading state={state} />;
  const pixels = state.data.assessment_pixels[0],
    r = Math.floor(patch / 4) * 2,
    c = (patch % 4) * 2,
    vector = [
      pixels[r * 8 + c],
      pixels[r * 8 + c + 1],
      pixels[(r + 1) * 8 + c],
      pixels[(r + 1) * 8 + c + 1],
    ];
  return (
    <FlowLab label="Trace one patch into feature rows">
      <Figure
        name="03 Spatial feature anatomy"
        caption="Pixel values are measured. Projection and encoder outputs below show shapes, not invented learned values."
      >
        <div className="mmp-feature-anatomy">
          <div>
            <Pixels pixels={pixels} />
            <p>8 × 8 pixels · grayscale 0–16</p>
          </div>
          <div>
            <div className="mmp-patch-grid">
              {Array.from({ length: 16 }, (_, i) => (
                <button key={i} aria-pressed={i === patch} onClick={() => setPatch(i)}>
                  p{i}
                </button>
              ))}
            </div>
            <p>4 × 4 spatial patch positions</p>
          </div>
          <div>
            <Tokens
              label={`Patch ${patch}, row-major values`}
              words={vector.map(String)}
              colors={vector.map(() => CYAN)}
              labels={['top left', 'top right', 'bottom left', 'bottom right']}
            />
            <div className="mmp-arrow">× Wᵀ + b → add position → encoder</div>
            <div className="mmp-feature-rows">
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} style={{ borderColor: i === 1 ? BLUE : undefined }}>
                  h{[0, patch, 14, 15][i]}: ▪ ▪ ▪ ▪ … dᵥ
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mmp-branches">
          <span>All spatial rows [16, dᵥ] → connector → LM</span>
          <span>CLS / declared pool [dᵥ] → projection → shared [d]</span>
        </div>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Patch index"
          value={patch}
          min={0}
          max={15}
          step={1}
          onChange={setPatch}
        />
        <button onClick={() => setPatch(5)}>Reset patch</button>
      </FlowControls>
      <FlowReadout>
        Patch {patch} begins at pixel ({r}, {c}). Spatial position is not a feature-channel index;
        pooling discards the explicit row list.
      </FlowReadout>
    </FlowLab>
  );
}
export function SharedDirections() {
  const [x, setX] = useState(0.6),
    [y, setY] = useState(0.8),
    v = normalize([x, y]);
  const texts = [TEXTS[0], v, TEXTS[2]];
  return (
    <FlowLab label="Normalize and compare directions">
      <Figure
        name="04 Shared unit directions"
        caption="Stipulated two-dimensional vectors. Image A overlaps text a; image C overlaps text c. The dashed text b direction is editable."
      >
        <Scroll label="Equal-axis unit-circle directions">
          <svg
            className="mmp-circle"
            viewBox="0 0 400 330"
            role="img"
            aria-label={
              v
                ? `Normalized text b ${f(v[0], 3)}, ${f(v[1], 3)}`
                : 'Text b has no cosine direction at zero norm'
            }
          >
            <line x1="30" y1="170" x2="365" y2="170" stroke="#777" />
            <line x1="200" y1="20" x2="200" y2="315" stroke="#777" />
            <circle cx="200" cy="170" r="115" fill="none" stroke="#555" />
            {IMAGES.map((a, i) => (
              <g key={i}>
                <line
                  x1="200"
                  y1="170"
                  x2={200 + 115 * a[0]}
                  y2={170 - 115 * a[1]}
                  stroke={BLUE}
                  strokeWidth="5"
                />
                <text x={200 + 140 * a[0]} y={175 - 140 * a[1]} fill={BLUE} textAnchor="middle">
                  {['A / a', 'B', 'C / c'][i]}
                </text>
              </g>
            ))}
            {v && (
              <>
                <line
                  x1="200"
                  y1="170"
                  x2={200 + 115 * v[0]}
                  y2={170 - 115 * v[1]}
                  stroke={AMBER}
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
                <circle cx={200 + 115 * v[0]} cy={170 - 115 * v[1]} r="6" fill={AMBER} />
                <text x="300" y="65" fill={AMBER}>
                  text b
                </text>
              </>
            )}
          </svg>
        </Scroll>
        {v ? (
          <Grid
            label="2 × cosine: image rows / text columns"
            rows={['A', 'B', 'C']}
            columns={['a', 'b', 'c']}
            values={IMAGES.map((a) => texts.map((t) => 2 * dot(a, t)))}
          />
        ) : (
          <p role="status">Zero vector: direction and cosine scores are undefined.</p>
        )}
      </Figure>
      <FlowControls>
        <FlowSlider name="Raw text b: x" value={x} min={-2} max={2} step={0.1} onChange={setX} />
        <FlowSlider name="Raw text b: y" value={y} min={-2} max={2} step={0.1} onChange={setY} />
        <button
          onClick={() => {
            setX(0);
            setY(0);
          }}
        >
          Zero vector
        </button>
        <button
          onClick={() => {
            setX(0.6);
            setY(0.8);
          }}
        >
          Reset direction
        </button>
      </FlowControls>
      <FlowReadout>
        Raw norm {f(Math.hypot(x, y), 3)}.{' '}
        {v
          ? 'Scaling both coordinates by the same positive factor preserves direction.'
          : 'No fallback vector is presented as a cosine direction.'}
      </FlowReadout>
    </FlowLab>
  );
}
export function PairMatrix() {
  const s = useScores(),
    i = s.selected[0];
  return (
    <FlowLab label="Inspect a paired score row">
      <Figure name="05 Pair scores and row probabilities">
        <MatrixEditor {...s} />
        <Bars
          values={s.p.rowP[i]}
          labels={['a', 'b', 'c'].map((x, j) => `${x}${j === i ? ' · paired target' : ''}`)}
          max={1}
        />
      </Figure>
      <FlowReadout>
        Image {['A', 'B', 'C'][i]}: target probability {f(s.p.rowP[i][i], 4)}, loss{' '}
        {f(s.p.rowLoss[i], 4)} nats. Denominator includes all three captions.
      </FlowReadout>
    </FlowLab>
  );
}
export function DirectionalReduction() {
  const s = useScores();
  return (
    <FlowLab label="Average both directional losses">
      <Figure name="06 Two directional reductions">
        <MatrixEditor {...s} />
        <div className="mmp-two">
          <Bars values={s.p.rowLoss} labels={['A → a', 'B → b', 'C → c']} color={BLUE} />
          <Bars values={s.p.colLoss} labels={['a → A', 'b → B', 'c → C']} color={AMBER} />
        </div>
        <div className="mmp-equation">
          ½ × {f(s.p.rowLoss.reduce((a, b) => a + b) / 3, 4)} + ½ ×{' '}
          {f(s.p.colLoss.reduce((a, b) => a + b) / 3, 4)} = <strong>{f(s.p.loss, 4)} nats</strong>
        </div>
      </Figure>
      <FlowControls>
        <button onClick={() => s.setScores(s.scores.map((r) => [r[2], r[1], r[0]]))}>
          Swap caption columns only
        </button>
        <button onClick={() => s.setScores([...s.scores].reverse().map((r) => [...r].reverse()))}>
          Reverse both paired axes
        </button>
      </FlowControls>
      <FlowReadout>
        Three row losses and three column losses contribute. Targets remain on the diagonal here, so
        swapping captions alone changes the supplied pair identities.
      </FlowReadout>
    </FlowLab>
  );
}
export function ScoreGradients() {
  const s = useScores(),
    [i, j] = s.selected,
    g = s.p.gradient[i][j];
  return (
    <FlowLab label="Inspect signed score derivatives">
      <Figure name="07 Score credit">
        <MatrixEditor {...s} />
        <Grid
          label="∂L / ∂S · negative raises score under descent"
          values={s.p.gradient}
          rows={['A', 'B', 'C']}
          columns={['a', 'b', 'c']}
          chosen={s.selected}
        />
        <div className="mmp-signed-gradient">
          <span>negative derivative → raise score</span>
          <div>
            <i
              style={{
                left: `${50 + Math.min(1, Math.max(-1, g)) * 45}%`,
                background: g < 0 ? BLUE : ROSE,
              }}
            />{' '}
            <b>0</b>
          </div>
          <span>positive derivative → lower score</span>
        </div>
      </Figure>
      <FlowReadout>
        Selected cell: ({f(s.p.rowP[i][j], 4)} + {f(s.p.colP[i][j], 4)} − {i === j ? 2 : 0}) / 6 ={' '}
        <strong>{f(g, 5)}</strong>. Update the logit by subtracting its derivative times the step
        size.
      </FlowReadout>
    </FlowLab>
  );
}
export function BackwardRoute() {
  const [rate, setRate] = useState(0.05),
    a = alignmentStep(rate);
  return (
    <FlowLab label="Follow an actual two-tower update">
      <Figure name="08 Backward route into both towers">
        <div className="mmp-two">
          <div>
            <Grid label="Image ∂L/∂u" values={a.before.du} />
            <div className="mmp-gradient-arrow">↓ remove radial component; divide by raw norm</div>
            <Grid label="Image ∂L/∂raw" values={a.before.drawU} color={BLUE} />
          </div>
          <div>
            <Grid label="Text ∂L/∂v" values={a.before.dv} />
            <div className="mmp-gradient-arrow">↓ remove radial component; divide by raw norm</div>
            <Grid label="Text ∂L/∂raw" values={a.before.drawV} color={AMBER} />
          </div>
        </div>
        <div className="mmp-gradient-arrow">
          ↓ outer products with tower inputs → parameter gradients
        </div>
        <div className="mmp-two">
          <Grid label="Updated image W [out,in]" values={a.wi} color={AMBER} />
          <Grid label="Updated text W [out,in]" values={a.wt} color={AMBER} />
        </div>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="SGD step size"
          value={rate}
          min={0}
          max={2}
          step={0.01}
          onChange={setRate}
        />
        <button onClick={() => setRate(0.05)}>Reset step</button>
      </FlowControls>
      <FlowReadout>
        Loss before {f(a.before.loss, 6)} → after {f(a.after?.loss, 6)}. Learned log scale updates
        too.{' '}
        {rate === 0
          ? 'Zero step leaves every parameter and loss unchanged.'
          : 'Both towers receive gradients, including the tower used as candidates.'}
      </FlowReadout>
    </FlowLab>
  );
}
export function CandidateClassifier() {
  const state = useStudy(),
    [candidates, setCandidates] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    [row, setRow] = useState(0);
  if (!state.data) return <Loading state={state} />;
  const d = state.data,
    result = savedForward(d, d.assessment_pixels[row]),
    scores = candidates.map((i) => result.scores[i]),
    p = scores.length ? softmax(scores) : [];
  return (
    <FlowLab label="Change the candidate set">
      <Figure name="09 Candidate-conditioned classification">
        <div className="mmp-image-and-result">
          <Pixels pixels={d.assessment_pixels[row]} />
          <div>
            {candidates.length ? (
              <Bars
                values={p}
                labels={candidates.map(
                  (i, j) => `${j}: digit ${digitNames[i]} · s=${f(scores[j], 2)}`,
                )}
                max={1}
              />
            ) : (
              <p>No candidates: no probability distribution.</p>
            )}
          </div>
        </div>
        {candidates.length > 0 && (
          <>
            <p>Text query “digit {digitNames[candidates[0]]}” → top three assessment images</p>
            <div className="mmp-gallery">
              {d.final.assessment.top5_gallery_rows_by_caption[candidates[0]]
                .slice(0, 3)
                .map((r, i) => (
                  <div key={r}>
                    <Pixels pixels={d.assessment_pixels[r]} />
                    <small>
                      Rank {i + 1} · source {d.final.assessment.source_ids[r]}
                    </small>
                  </div>
                ))}
            </div>
          </>
        )}
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Assessment image row"
          value={row}
          min={0}
          max={199}
          step={1}
          onChange={setRow}
        />
        <button
          disabled={candidates.length >= 12}
          onClick={() => setCandidates([...candidates, 7])}
        >
          Add duplicate “digit seven”
        </button>
        <button
          disabled={!candidates.length}
          onClick={() => setCandidates(candidates.slice(0, -1))}
        >
          Remove last candidate
        </button>
        <button onClick={() => setCandidates([...candidates].reverse())}>
          Reverse candidate order
        </button>
        <button onClick={() => setCandidates([])}>Empty candidates</button>
        <button
          onClick={() => {
            setCandidates([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            setRow(0);
          }}
        >
          Reset candidates
        </button>
      </FlowControls>
      <FlowReadout>
        {candidates.length
          ? `${candidates.length} candidate entries share the probability mass. Duplicate captions have identical vectors and scores, but each occupies a denominator entry.`
          : 'The model still computed the image vector. Candidate selection is undefined until at least one caption is supplied.'}{' '}
        Only the ten trained caption templates are offered; no unknown-word embedding is invented.
      </FlowReadout>
    </FlowLab>
  );
}
export function DatasetGroups() {
  const state = useStudy();
  if (!state.data) return <Loading state={state} />;
  const d = state.data;
  return (
    <Figure
      name="10 Source-grouped study splits"
      caption="UCI optical digits via scikit-learn: 1,797 real images; first 100 unique pixel groups per class retained. Exact pixel groups are formed before splitting. Writer IDs are unavailable."
    >
      <div className="mmp-data-stream">
        <div className="mmp-source-stack">
          {[0, 1, 2].map((i) => (
            <Pixels key={i} pixels={d.assessment_pixels[i]} label={`Actual retained image ${i}`} />
          ))}
        </div>
        <div className="mmp-arrow">pixel hash → unique source group → seed 17 split</div>
        <div className="mmp-split-lanes">
          {Object.entries(d.data.splits).map(([name, ids], i) => (
            <div key={name} style={{ '--mmp-hue': identities[i] }}>
              <span className="mmp-count-object">
                {Array.from({ length: ids.length / 20 }, (_, j) => (
                  <i key={j} />
                ))}
              </span>
              <strong>
                {name}: {ids.length}
              </strong>
              <small>Each mark = 20 image groups</small>
            </div>
          ))}
        </div>
        <div className="mmp-arrow">class label → authored caption “digit seven”</div>
      </div>
    </Figure>
  );
}
function LinePlot({ records, lines, max, label, suffix = '' }) {
  const width = 540,
    height = 255,
    x = (s) => 55 + (s / 400) * 455,
    y = (v) => 205 - (v / max) * 165;
  return (
    <Scroll label={label}>
      <svg
        className="mmp-plot"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label}. ${lines.map(([key, name]) => `${name}: ${records.map((r) => `${r.step} steps ${f(r[key], 4)}`).join('; ')}`).join('. ')}`}
      >
        <text x="55" y="20" fill="currentColor">
          {label}
        </text>
        {[0, 0.5, 1].map((frac) => (
          <g key={frac}>
            <line x1="55" y1={y(frac * max)} x2="515" y2={y(frac * max)} stroke="#444" />
            <text x="45" y={y(frac * max) + 4} textAnchor="end" fill="currentColor">
              {f(frac * max, 2)}
              {suffix}
            </text>
          </g>
        ))}
        {[0, 100, 200, 300, 400].map((s) => (
          <text key={s} x={x(s)} y="229" textAnchor="middle" fill="currentColor">
            {s}
          </text>
        ))}
        <text x="290" y="252" textAnchor="middle" fill="currentColor">
          optimizer steps
        </text>
        {lines.map(([key, name, color]) => (
          <g key={key}>
            <polyline
              points={records.map((r) => `${x(r.step)},${y(r[key])}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            {records.map((r) => (
              <circle key={r.step} cx={x(r.step)} cy={y(r[key])} r="4" fill={color} />
            ))}
          </g>
        ))}
      </svg>
    </Scroll>
  );
}
export function AlignmentStudy() {
  const [name, setName] = useState('scratch'),
    state = useStudy(name);
  return (
    <FlowLab label="Inspect executed alignment studies">
      <Figure
        name="11 Measured fit and held-out curves"
        caption="Every point comes from the retained once-only fit. Fixed duration: 400 steps; final checkpoint reported even when an earlier assessment point was higher."
      >
        {state.data ? (
          <>
            <LinePlot
              records={state.data.logs}
              lines={[['fixed_fit_loss', 'fixed fit loss', VIOLET]]}
              max={3}
              label="Fixed-fit symmetric loss · nats"
            />
            <LinePlot
              records={state.data.logs}
              lines={[
                ['development_accuracy', 'development', AMBER],
                ['assessment_accuracy', 'assessment', BLUE],
              ]}
              max={1}
              label="Classification accuracy · fraction"
            />
            <div className="mmp-legend">
              <span style={{ color: AMBER }}>● Development</span>
              <span style={{ color: BLUE }}>● Assessment</span>
            </div>
            <div className="mmp-equation">
              Final {state.data.final.assessment.correct} / 200 · pixel-centroid baseline 185 / 200
            </div>
            <Bars
              values={state.data.final.assessment.precision_at_5_by_caption}
              labels={digitNames.map((n) => `digit ${n} · P@5`)}
              max={1}
            />
          </>
        ) : (
          <Loading state={state} />
        )}
      </Figure>
      <FlowControls>
        <FlowChoice
          label="Executed model"
          value={name}
          onChange={setName}
          options={[
            ['scratch', 'MLP + mean words'],
            ['library', 'Tiny library CLIP'],
          ]}
        />
      </FlowControls>
      <FlowReadout>
        {state.data
          ? `${state.data.model}; seed 17, AdamW learning rate ${state.data.learning_rate}. Selection loads saved results and performs no training. Retrieval relevance means same class, not unique original pair.`
          : 'Waiting for the saved record.'}
      </FlowReadout>
    </FlowLab>
  );
}
export function SavedImageLab() {
  const state = useStudy(),
    [row, setRow] = useState(0),
    [pixel, setPixel] = useState(36),
    [edited, setEdited] = useState(null);
  if (!state.data) return <Loading state={state} />;
  const d = state.data,
    original = d.assessment_pixels[row],
    pixels = edited || original,
    result = savedForward(d, pixels);
  return (
    <FlowLab label="Edit pixels and run the full saved MLP">
      <Figure name="12 Saved-model pixel intervention">
        <div className="mmp-two">
          <div>
            <strong>Original · source {d.final.assessment.source_ids[row]}</strong>
            <Pixels pixels={original} />
          </div>
          <div>
            <strong>Current input · select a pixel</strong>
            <Pixels pixels={pixels} selected={pixel} onSelect={setPixel} />
          </div>
        </div>
        <div className="mmp-arrow">64 /16 → Linear 64 → tanh → Linear 32 → L2 normalize</div>
        <div
          className="mmp-vector-strip"
          aria-label={`Full 32-dimensional image vector: ${result.vector.map((v) => f(v, 4)).join(', ')}`}
        >
          {result.vector.map((v, i) => (
            <span
              key={i}
              title={`channel ${i}: ${v}`}
              style={{
                background: `color-mix(in srgb, ${BLUE} ${20 + Math.abs(v) * 75}%, transparent)`,
              }}
            >
              {f(v, 2)}
            </span>
          ))}
        </div>
        <Bars
          values={result.scores}
          labels={digitNames.map((n, i) => `${i === result.predicted ? '★ ' : ''}digit ${n}`)}
        />
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Assessment image row"
          value={row}
          min={0}
          max={199}
          step={1}
          onChange={(v) => {
            setRow(v);
            setEdited(null);
          }}
        />
        <FlowSlider
          name={`Pixel (${Math.floor(pixel / 8)}, ${pixel % 8}) value`}
          value={pixels[pixel]}
          min={0}
          max={16}
          step={1}
          onChange={(v) => setEdited(pixels.map((x, i) => (i === pixel ? v : x)))}
        />
        <button onClick={() => setEdited(Array(64).fill(0))}>Blank image</button>
        <button onClick={() => setEdited([...d.assessment_pixels[(row + 1) % 200]])}>
          Swap next image
        </button>
        <button
          onClick={() => {
            setEdited(null);
            setPixel(36);
          }}
        >
          Restore source pixels
        </button>
      </FlowControls>
      <FlowReadout>
        Current top caption: <strong>digit {digitNames[result.predicted]}</strong>. All saved MLP
        parameters and caption vectors participate. Pixel edits may change the true class; this
        interface does not relabel the image automatically.
      </FlowReadout>
    </FlowLab>
  );
}
export function PositiveSets() {
  const [mask, setMask] = useState([
      [true, true, false],
      [true, true, false],
      [false, false, true],
    ]),
    [score, setScore] = useState(1.2),
    s = BASE_SCORES.map((r, i) => r.map((x, j) => (i === 0 && j === 1 ? score : x))),
    loss = positiveSet(s, mask);
  return (
    <FlowLab label="Change which pairings are valid">
      <Figure name="13 More than one valid caption">
        <Grid
          label="Positive sets: 1 valid, × invalid; click to toggle"
          values={mask}
          rows={['A', 'B', 'C']}
          columns={['a', 'b', 'c']}
          boolean
          color={BLUE}
          select={(i, j) =>
            setMask(mask.map((r, k) => r.map((v, l) => (i === k && j === l ? !v : v))))
          }
        />
        <Grid
          label="Scores remain separate from target identity"
          values={s}
          rows={['A', 'B', 'C']}
          columns={['a', 'b', 'c']}
        />
        <div className="mmp-equation">
          Diagonal CE: {f(paired(s).loss, 4)} · set-mass loss: {f(loss, 4)}
        </div>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Score of A with caption b"
          min={-8}
          max={8}
          step={0.1}
          value={score}
          onChange={setScore}
        />
        <button onClick={() => setMask(mask.map((r) => r.map(() => true)))}>All pairs valid</button>
        <button onClick={() => setMask(mask.map((r) => r.map(() => false)))}>No positives</button>
        <button
          onClick={() => {
            setMask([
              [true, true, false],
              [true, true, false],
              [false, false, true],
            ]);
            setScore(1.2);
          }}
        >
          Reset positive sets
        </button>
      </FlowControls>
      <FlowReadout>
        {loss === null
          ? 'Invalid objective: every image row and caption column needs a nonempty positive set.'
          : `This loss rewards total probability assigned to each positive set. It does not require equal probability for every positive member. ${loss === 0 ? 'All entries valid makes this objective zero.' : ''}`}
      </FlowReadout>
    </FlowLab>
  );
}
export function SigmoidPairs() {
  const [score, setScore] = useState(2),
    [bias, setBias] = useState(-1),
    [positive, setPositive] = useState(true),
    [other, setOther] = useState(1.2);
  const s = BASE_SCORES.map((r) => [...r]);
  s[0][0] = score;
  s[0][1] = other;
  const mask = [
      [positive, false, false],
      [false, true, false],
      [false, false, true],
    ],
    r = sigmoidPairs(s, mask, bias),
    z = score + bias,
    y = positive ? 1 : -1;
  return (
    <FlowLab label="Inspect independent signed logistic terms">
      <Figure name="14 Pairwise sigmoid learning">
        <Grid
          label="Per-pair softplus terms"
          values={r.terms}
          rows={['A', 'B', 'C']}
          columns={['a', 'b', 'c']}
          chosen={[0, 0]}
        />
        <div className="mmp-equation">
          A,a: y={y > 0 ? '+1' : '−1'} · z={f(z, 2)} · sigmoid={f(1 / (1 + Math.exp(-z)), 4)}
        </div>
        <div className="mmp-equation">
          Σ nine terms / 3 = <strong>{f(r.loss, 4)}</strong> · an N² mean would be{' '}
          {f(r.loss / 3, 4)}
        </div>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Selected raw score"
          min={-40}
          max={40}
          step={0.5}
          value={score}
          onChange={setScore}
        />
        <FlowSlider
          name="Shared bias"
          min={-5}
          max={5}
          step={0.1}
          value={bias}
          onChange={setBias}
        />
        <FlowSlider
          name="Other cell A,b raw score"
          min={-8}
          max={8}
          step={0.1}
          value={other}
          onChange={setOther}
        />
        <label>
          <input
            type="checkbox"
            checked={positive}
            onChange={(e) => setPositive(e.target.checked)}
          />{' '}
          A,a is positive
        </label>
        <button
          onClick={() => {
            setScore(2);
            setBias(-1);
            setPositive(true);
            setOther(1.2);
          }}
        >
          Reset logistic pairs
        </button>
      </FlowControls>
      <FlowReadout>
        Selected term {f(r.terms[0][0], 5)}; derivative with respect to its z is{' '}
        {f(-y / (1 + Math.exp(y * z)), 5)}. Editing A,b alone changes the total but leaves this term
        unchanged.
      </FlowReadout>
    </FlowLab>
  );
}
export function VisualProjector() {
  const [count, setCount] = useState(4),
    [width, setWidth] = useState(6),
    [zero, setZero] = useState(false),
    [mlp, setMlp] = useState(false);
  const rows = Array.from({ length: count }, (_, i) => [0.1 * (i + 1), 0.2, -0.1]);
  const weights = Array.from({ length: width }, (_, j) => [0.1 * (j + 1), -0.2, 0.3]);
  const output = rows.map((r) => weights.map((w) => (zero ? 0.05 : dot(r, w) + 0.05)));
  return (
    <FlowLab label="Map continuous features into language width">
      <Figure name="15 Visual projector shapes">
        <div className="mmp-projector-values">
          <Grid
            label={`Selected visual rows [${count}, 3] · stipulated`}
            values={rows}
            color={BLUE}
          />
          <Grid
            label={`Linear outputs [${count}, ${width}] · bias .05`}
            values={output}
            color={CYAN}
          />
        </div>
        <div className="mmp-projector-anatomy">
          <span className="mmp-feature-block">N × dᵥ</span>
          <span>→</span>
          <span className="mmp-weight-block">{mlp ? 'W₁ → GELU → W₂' : 'W'}</span>
          <span>→</span>
          <span className="mmp-feature-block">N × dLM</span>
        </div>
        <p>
          {mlp
            ? 'LLaVA 1.5: two-layer MLP connector. The numeric matrix above continues to isolate the first linear map.'
            : 'Original LLaVA: linear connector. Per-row multiplication changes width, not the number of visual positions.'}
        </p>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Visual row count"
          min={1}
          max={6}
          step={1}
          value={count}
          onChange={setCount}
        />
        <FlowSlider
          name="Output feature width"
          min={2}
          max={8}
          step={1}
          value={width}
          onChange={setWidth}
        />
        <label>
          <input type="checkbox" checked={zero} onChange={(e) => setZero(e.target.checked)} /> Zero
          linear weights
        </label>
        <FlowChoice
          label="Published connector recipe"
          value={mlp}
          onChange={setMlp}
          options={[
            [false, 'Linear'],
            [true, 'GELU MLP'],
          ]}
        />
        <button
          onClick={() => {
            setCount(4);
            setWidth(6);
            setZero(false);
            setMlp(false);
          }}
        >
          Reset projector
        </button>
      </FlowControls>
      <FlowReadout>
        {zero
          ? 'All outputs equal the bias; no image-dependent variation survives this map.'
          : 'Distinct image rows remain separate positions.'}{' '}
        Matching widths makes the interface legal; learning must establish useful alignment.
      </FlowReadout>
    </FlowLab>
  );
}
export function PrefixTargets() {
  const [targets, setTargets] = useState(true),
    [placeholders, setPlaceholders] = useState(4),
    [query, setQuery] = useState(5);
  const words = ['v₀', 'v₁', 'v₂', 'v₃', 'Which', 'digit?', 'seven', 'EOS'],
    colors = words.map((_, i) => (i < 4 ? BLUE : i < 6 ? AMBER : ROSE)),
    mask = words.map((_, i) => words.map((_, j) => j <= i));
  return (
    <FlowLab label="Separate visual inputs, access and answer targets">
      <Figure name="16 Prefix inputs and shifted answer targets">
        <Scroll label="Aligned prefix, labels and predicted targets">
          <div className="mmp-sequence">
            <Tokens label="Input rows" words={words} colors={colors} />
            <Tokens
              label="Same-length labels"
              words={words.map((w, i) => (targets && i >= 6 ? w : '−100'))}
              colors={colors}
            />
            <Tokens
              label="Logit at this input scores"
              words={words.map((_, i) =>
                targets && i === 5 ? 'seven' : targets && i === 6 ? 'EOS' : 'ignored',
              )}
              colors={colors}
            />
            <svg
              className="mmp-shift-arcs"
              viewBox="0 0 800 70"
              aria-label="Logit at prompt position 5 predicts first answer at position 6"
              role="img"
            >
              <path
                d="M550 5 Q550 50 650 55 M650 5 Q650 35 750 55"
                stroke={ROSE}
                fill="none"
                strokeWidth="3"
              />
              <text x="20" y="45" fill="currentColor">
                one-position causal shift
              </text>
            </svg>
          </div>
        </Scroll>
        <Grid
          label="Causal permission: rows=query, columns=key"
          values={mask}
          boolean
          chosen={[query, query]}
          select={(i) => setQuery(i)}
        />
      </Figure>
      <FlowControls>
        <label>
          <input type="checkbox" checked={targets} onChange={(e) => setTargets(e.target.checked)} />{' '}
          Score answer and EOS
        </label>
        <FlowSlider
          name="Image placeholders supplied"
          min={2}
          max={6}
          step={1}
          value={placeholders}
          onChange={setPlaceholders}
        />
        <button
          onClick={() => {
            setTargets(true);
            setPlaceholders(4);
            setQuery(5);
          }}
        >
          Reset prefix
        </button>
      </FlowControls>
      <FlowReadout>
        {placeholders !== 4
          ? `Invalid assembly: ${placeholders} placeholder positions cannot accept 4 visual rows.`
          : !targets
            ? 'No selected targets: loss mean is undefined; skip the update.'
            : `Two targets. The final prompt logit at position 5 predicts answer seven at 6. Query ${query} can read keys 0 through ${query}; ignored visual targets remain readable inputs.`}
      </FlowReadout>
    </FlowLab>
  );
}
export function FrozenGradients() {
  const [detach, setDetach] = useState(false),
    [frozen, setFrozen] = useState(true),
    [upstream, setUpstream] = useState(2),
    x = upstream,
    w = 0.5,
    k = 3,
    h = w * x,
    y = k * h,
    loss = (y - 1) ** 2 / 2,
    grad = (y - 1) * k * x;
  return (
    <FlowLab label="Distinguish frozen parameters from detached computation">
      <Figure name="17 Frozen parameter and live input derivative">
        <div className="mmp-chain">
          <span className="mmp-feature-block">x = {x}</span>
          <b>→</b>
          <span className="mmp-weight-block">
            w = .5
            <br />
            trainable
          </span>
          <b>→</b>
          <span className="mmp-feature-block">h = {f(h)}</span>
          <b>→</b>
          <span className={`mmp-weight-block ${frozen ? 'mmp-frozen' : ''}`}>
            k = 3<br />
            {frozen ? 'frozen' : 'trainable'}
          </span>
          <b>→</b>
          <span className="mmp-feature-block">y = {f(y)}</span>
        </div>
        <div className={`mmp-gradient-route ${detach ? 'mmp-cut' : ''}`}>
          {detach
            ? '✕ detach at h: no derivative reaches w'
            : '← (y − 1) × k × x: derivative reaches w through fixed k'}
        </div>
        <Bars
          values={[detach ? 0 : grad, frozen ? 0 : (y - 1) * h]}
          labels={['w gradient', frozen ? 'k update: frozen' : 'k gradient']}
          color={AMBER}
        />
      </Figure>
      <FlowControls>
        <label>
          <input type="checkbox" checked={frozen} onChange={(e) => setFrozen(e.target.checked)} />{' '}
          Freeze receiver k
        </label>
        <label>
          <input type="checkbox" checked={detach} onChange={(e) => setDetach(e.target.checked)} />{' '}
          Detach projected h
        </label>
        <FlowSlider
          name="Upstream feature x"
          min={0}
          max={4}
          step={0.25}
          value={upstream}
          onChange={setUpstream}
        />
        <button
          onClick={() => {
            setDetach(false);
            setFrozen(true);
            setUpstream(2);
          }}
        >
          Reset derivatives
        </button>
      </FlowControls>
      <FlowReadout>
        Constructed scalar loss ½(y−1)² = {f(loss, 4)}.{' '}
        {detach
          ? 'Zero shown for w means no gradient path, not a computed zero derivative.'
          : `Receiver input derivative dy/dh = 3 whether k is frozen or trainable.`}{' '}
        Actual decoder/autograd behavior is verified by the programs.
      </FlowReadout>
    </FlowLab>
  );
}
export function TrainingStages() {
  return (
    <Figure
      name="18 Parameter owners across stages"
      caption="Published LLaVA-style stages. Frozen is dashed and named; these are update permissions, not measured relative parameter sizes."
    >
      <div className="mmp-stage-owners">
        {[
          ['Alignment', 'frozen', 'updates', 'frozen'],
          ['Instruction tuning', 'frozen', 'updates', 'updates'],
        ].map(([name, ...owners]) => (
          <div key={name}>
            <strong>{name}</strong>
            {owners.map((state, i) => (
              <span
                key={i}
                className={`mmp-weight-block ${state === 'frozen' ? 'mmp-frozen' : ''}`}
              >
                <span>{['Vision backbone', 'Projector', 'Language model'][i]}</span>
                <b>{state}</b>
                <i className="mmp-parameter-dots">▪ ▪ ▪ ▪</i>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mmp-receipt">
        <strong>Executed mini-LLaVA mechanism</strong>
        <span>16 visual rows · width 16 · one vision and one text layer</span>
        <span>Parameter counts: vision 2,640 · projector 544 · language backbone + head 3,632</span>
        <span>Projector gradient norm 2.720619 · frozen parameter bytes unchanged</span>
        <span>Library loss = explicit shifted CE: 3.665634 nats</span>
      </div>
    </Figure>
  );
}
export function LearnedQueries() {
  const [q, setQ] = useState(1),
    [value, setValue] = useState(-0.8),
    [permissions, setPermissions] = useState([
      [true, true, false, false],
      [false, true, true, true],
    ]),
    r = queryRead(q, value, permissions);
  return (
    <FlowLab label="Trace two learned queries into image memory">
      <Figure name="19 Learned query reads">
        <div className="mmp-two">
          <Grid
            label="Query vectors: learned positions, not image quadrants"
            values={[
              [q, 0],
              [0, 1],
            ]}
            rows={['q₀', 'q₁']}
            color={VIOLET}
          />
          <Grid
            label="Fixed image keys [4,2]"
            values={[
              [1, 0],
              [0, 1],
              [1, 1],
              [-1, 0],
            ]}
            rows={['m₀', 'm₁', 'm₂', 'm₃']}
            color={BLUE}
          />
        </div>
        <Grid
          label="Permission: click to toggle"
          values={permissions}
          rows={['q₀', 'q₁']}
          columns={['m₀', 'm₁', 'm₂', 'm₃']}
          boolean
          select={(i, j) =>
            setPermissions(
              permissions.map((row, a) => row.map((v, b) => (a === i && b === j ? !v : v))),
            )
          }
        />
        {r ? (
          <>
            <Grid
              label="Row-softmax attention shares"
              values={r.weights}
              rows={['q₀', 'q₁']}
              columns={['m₀', 'm₁', 'm₂', 'm₃']}
            />
            <div className="mmp-two">
              <Grid
                label="Projected values V · edit m₃ channel 0"
                values={r.values}
                rows={['m₀', 'm₁', 'm₂', 'm₃']}
                color={BLUE}
              />
              <Grid
                label="Returned image-dependent query states A V"
                values={r.output}
                rows={['q₀', 'q₁']}
                color={VIOLET}
              />
            </div>
          </>
        ) : (
          <p role="status">Invalid read: at least one query has no permitted memory row.</p>
        )}
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Learned q₀ coordinate"
          min={-3}
          max={3}
          step={0.1}
          value={q}
          onChange={setQ}
        />
        <FlowSlider
          name="Value m₃ channel 0"
          min={-3}
          max={3}
          step={0.1}
          value={value}
          onChange={setValue}
        />
        <button onClick={() => setPermissions(permissions.map((row) => row.map(() => false)))}>
          Block every donor
        </button>
        <button
          onClick={() => {
            setQ(1);
            setValue(-0.8);
            setPermissions([
              [true, true, false, false],
              [false, true, true, true],
            ]);
          }}
        >
          Reset query read
        </button>
      </FlowControls>
      <FlowReadout>
        {r
          ? 'Changing m₃’s value cannot change q₀ while that route is blocked. Keys remain fixed during this value-only edit; changing a key could change attention shares.'
          : 'No softmax is computed for an empty permitted set.'}{' '}
        This one-head read exposes the mechanism; full Q-Former includes repeated self-attention and
        feed-forward sublayers.
      </FlowReadout>
    </FlowLab>
  );
}
export function QFormerObjectives() {
  const [selection, setSelection] = useState(['ITG', 2, 4]);
  return (
    <FlowLab label="Compare Q-Former self-attention objectives">
      <Figure
        name="20 Q-Former blocks and objective masks"
        caption="q₀/q₁ are query rows; t₀/t₁/t₂ are text rows. Image cross-attention is a separate operation accessible to query rows. One block drawing stands for the repeated stack, not a single isolated cross-read."
      >
        <div className="mmp-qformer-anatomy">
          <Tokens
            label="Query and text rows"
            words={['q₀', 'q₁', 't₀', 't₁', 't₂']}
            colors={[VIOLET, VIOLET, AMBER, AMBER, AMBER]}
          />
          <div className="mmp-arrow">↓ objective-specific self-attention + residual / norm</div>
          <div className="mmp-two">
            <div>
              <div className="mmp-feature-rows">
                <span>query rows q′₀, q′₁</span>
                <span>image cross-attention ← vision K,V</span>
                <span>query FFN + residual / norm</span>
              </div>
            </div>
            <div className="mmp-feature-rows">
              <span>text rows t′₀, t′₁, t′₂</span>
              <span>text FFN + residual / norm</span>
              <span>no direct image cross-read</span>
            </div>
          </div>
          <div className="mmp-repeat">
            ↻ repeat transformer blocks; image cross-read in designated blocks
          </div>
          <div className="mmp-arrow">final query states → projection → frozen LM in stage 2</div>
        </div>
        <div className="mmp-objective-masks">
          {['ITC', 'ITM', 'ITG'].map((mode) => (
            <Grid
              key={mode}
              label={`${mode} self-attention permissions`}
              values={qformerMask(mode)}
              rows={['q₀', 'q₁', 't₀', 't₁', 't₂']}
              columns={['q₀', 'q₁', 't₀', 't₁', 't₂']}
              boolean
              select={(i, j) => setSelection([mode, i, j])}
              chosen={selection[0] === mode ? selection.slice(1) : null}
            />
          ))}
        </div>
        <div className="mmp-objective-heads">
          <span>ITC: image/text contrast · max query similarity</span>
          <span>ITM: fused query states → pair match classifier</span>
          <span>ITG: causal text states → next token CE</span>
        </div>
      </Figure>
      <FlowReadout>
        {selection[0]} query row {selection[1]} may{' '}
        {qformerMask(selection[0])[selection[1]][selection[2]] ? 'read' : 'not read'} key row{' '}
        {selection[2]}. ITG excludes future text; ITC separates query/text branches; ITM permits
        fusion.
      </FlowReadout>
    </FlowLab>
  );
}
export function VisualMemory() {
  const [gate, setGate] = useState(0),
    [b, setB] = useState(4),
    [boundary, setBoundary] = useState(3);
  const last = [-1, 0, 0, 0, 1, 1].map((v, i) => (i === 0 ? -1 : i < boundary ? 0 : 1)),
    memory = [1, 2, b, b + 1],
    ids = [0, 0, 1, 1],
    weights = last.map((id) => ids.map((x) => (id === x ? 0.5 : 0))),
    read = weights.map((r) => dot(r, memory)),
    output = read.map((v) => 1 + Math.tanh(gate) * v);
  return (
    <FlowLab label="Read only the currently available image memory">
      <Figure name="21 Interleaved image memory and gate">
        <Tokens
          label="Visual memory"
          words={memory.map((v) => f(v, 2))}
          labels={['A latent 0', 'A latent 1', 'B latent 0', 'B latent 1']}
          colors={[BLUE, BLUE, ROSE, ROSE]}
        />
        <Scroll label="Text timeline with image availability">
          <div className="mmp-sequence">
            <Tokens
              label="Text position"
              words={['BOS', 'look', 'at A', 'then', 'look B', 'answer']}
              colors={Array(6).fill(AMBER)}
              labels={last.map(
                (v, i) => `${i}: ${v < 0 ? 'no image' : v === 0 ? 'image A' : 'image B'}`,
              )}
            />
            <Tokens
              label="Allowed visual read"
              words={read.map((v, i) => (last[i] < 0 ? 'skip' : f(v, 3)))}
              colors={last.map((x) => (x === 0 ? BLUE : ROSE))}
            />
            <Tokens
              label="h + tanh(g) × read"
              words={output.map((v) => f(v, 3))}
              colors={Array(6).fill(VIOLET)}
            />
          </div>
        </Scroll>
        <Grid
          label="Text query × image-memory permission"
          values={weights.map((r) => r.map(Boolean))}
          columns={['A₀', 'A₁', 'B₀', 'B₁']}
          boolean
        />
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Visual gate g"
          min={-2}
          max={2}
          step={0.1}
          value={gate}
          onChange={setGate}
        />
        <FlowSlider
          name="Image B memory value"
          min={0}
          max={8}
          step={0.5}
          value={b}
          onChange={setB}
        />
        <FlowSlider
          name="First text position after image B"
          min={2}
          max={5}
          step={1}
          value={boundary}
          onChange={setBoundary}
        />
        <button
          onClick={() => {
            setGate(0);
            setB(4);
            setBoundary(3);
          }}
        >
          Reset memory
        </button>
      </FlowControls>
      <FlowReadout>
        Constructed scalar memory with equal permitted shares; base hidden value h=1.{' '}
        {gate === 0
          ? 'Gate zero preserves every original hidden value.'
          : 'Only positions after B can change when B changes.'}{' '}
        Before any image, the visual residual is explicitly skipped. Earlier image information may
        persist through text self-attention.
      </FlowReadout>
    </FlowLab>
  );
}
export function DetailBudget() {
  const [h, setH] = useState(280),
    [w, setW] = useState(420),
    [p, setP] = useState(14),
    [m, setM] = useState(32),
    [t, setT] = useState(80),
    n = detailCounts(h, w, p, m, t);
  return (
    <FlowLab label="Separate visual and language pair counts">
      <Figure name="22 Resolution and attention budget">
        <div
          className="mmp-resolution"
          style={{ aspectRatio: `${w}/${h}` }}
          aria-label={`${w} by ${h} image divided at patch size ${p}`}
        >
          <div style={{ backgroundSize: `${(p / w) * 100}% ${(p / h) * 100}%` }} />
          <span>
            {h} × {w} pixels · patch {p}
          </span>
        </div>
        {n ? (
          <>
            <div className="mmp-count-branches">
              <div>
                <strong>Vision backbone</strong>
                <span>{n.n} patch positions</span>
                <b>{n.vision.toLocaleString()} N² pairs</b>
              </div>
              <div>
                <strong>Direct prefix</strong>
                <span>{n.directPositions} LM positions</span>
                <b>{n.direct.toLocaleString()} (T+N)² pairs</b>
              </div>
              <div>
                <strong>Query prefix</strong>
                <span>{n.queryPositions} LM positions</span>
                <b>{n.queryPrefix.toLocaleString()} (T+M)² pairs</b>
              </div>
              <div>
                <strong>Separate memory</strong>
                <span>{t} text positions</span>
                <b>
                  {n.textOnly.toLocaleString()} T² + {n.memoryRead.toLocaleString()} TM
                </b>
              </div>
            </div>
            <p>
              One query-to-image read adds {n.queryRead.toLocaleString()} MN pairs; the vision
              backbone remains upstream in every route.
            </p>
          </>
        ) : (
          <p role="status">
            Nondivisible image shape: choose and declare a resize, crop or padding policy before
            counting patches.
          </p>
        )}
      </Figure>
      <FlowControls>
        {[
          ['Height', h, setH, 140, 420, 14],
          ['Width', w, setW, 140, 560, 14],
          ['Patch side', p, setP, 7, 28, 7],
          ['Learned queries M', m, setM, 8, 64, 8],
          ['Text positions T', t, setT, 16, 160, 8],
        ].map(([name, value, onChange, min, max, step]) => (
          <FlowSlider key={name} {...{ name, value, onChange, min, max, step }} />
        ))}
        <button onClick={() => setH(281)}>Nondivisible height 281</button>
        <button
          onClick={() => {
            setH(280);
            setW(420);
            setP(14);
            setM(32);
            setT(80);
          }}
        >
          Reset budget
        </button>
      </FlowControls>
      <FlowReadout>
        Each count is a full query–key pair proxy for one operation, excluding channels, layers,
        heads, MLPs and implementation savings. It is not a measured latency or memory result.
      </FlowReadout>
    </FlowLab>
  );
}
export function SupervisionReach() {
  const state = useStudy(),
    [crop, setCrop] = useState(8);
  if (!state.data) return <Loading state={state} />;
  const original = state.data.assessment_pixels[0],
    pixels = original.map((v, i) => (i % 8 < crop ? v : 0)),
    removed = original.reduce((s, v, i) => s + (i % 8 >= crop && v > 0 ? 1 : 0), 0);
  return (
    <FlowLab label="See which visual evidence survives preprocessing">
      <Figure name="23 Global match and local supervision">
        <div className="mmp-two">
          <div>
            <strong>Source measurement</strong>
            <Pixels pixels={original} />
          </div>
          <div>
            <strong>Retain columns 0–{crop - 1}; zero-fill the rest</strong>
            <Pixels pixels={pixels} />
          </div>
        </div>
        <div className="mmp-feature-map">
          <div className="mmp-patch-grid">
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                style={{
                  background: `color-mix(in srgb, ${BLUE} ${25 + (i % 4) * 10}%, transparent)`,
                }}
              >
                h{i}
              </span>
            ))}
          </div>
          <div className="mmp-supervision-paths">
            <span>all rows → global representation ↔ caption pair</span>
            <span>local rows → teacher–student feature targets</span>
            <span>masked rows → reconstruct teacher features</span>
            <span>visual evidence → caption / localization text targets</span>
          </div>
        </div>
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Retained image columns"
          min={1}
          max={8}
          step={1}
          value={crop}
          onChange={setCrop}
        />
        <button onClick={() => setCrop(8)}>Restore all columns</button>
      </FlowControls>
      <FlowReadout>
        {removed} nonzero measured pixels are removed. This zero-filled intervention illustrates
        evidence loss, not the complete SigLIP 2 crop pipeline. The lower routes summarize distinct
        SigLIP 2 supervision objectives; no trained attention is shown.
      </FlowReadout>
    </FlowLab>
  );
}
export function MixedSequence() {
  const [joint, setJoint] = useState(true),
    [order, setOrder] = useState(false);
  const ids = order ? [1, 4, 10, 6, 7, 8, 9, 11, 2] : [1, 10, 6, 7, 8, 9, 11, 4, 2],
    words = ids.map(
      (i) =>
        ({ 1: 'BOS', 2: 'EOS', 4: 'text:4', 10: 'IMG_START', 11: 'IMG_END' })[i] || `image:${i}`,
    ),
    isImage = (i) => i >= 6 && i <= 9,
    targets = ids.slice(1).map((i) => (joint || !isImage(i) ? String(i) : '−100'));
  return (
    <FlowLab label="Inspect a joint image and text ID stream">
      <Figure name="24 Mixed causal targets">
        <div className="mmp-legend">
          <span style={{ color: AMBER }}>Text IDs 0–5</span>
          <span style={{ color: BLUE }}>Image IDs 6–9</span>
          <span style={{ color: CYAN }}>Boundary IDs 10–11</span>
        </div>
        <Scroll label="Mixed sequence and shifted targets">
          <div className="mmp-sequence">
            <Tokens
              label="Input IDs"
              words={words}
              colors={ids.map((i) => (isImage(i) ? BLUE : i >= 10 ? CYAN : AMBER))}
            />
            <Tokens
              label="Next target"
              words={[...targets, 'no next token']}
              colors={ids.slice(1).map((i) => (isImage(i) ? BLUE : i >= 10 ? CYAN : AMBER))}
            />
          </div>
        </Scroll>
        <div className="mmp-two">
          <Grid
            label="Image code IDs → image decoder"
            values={[
              [6, 7],
              [8, 9],
            ]}
            color={BLUE}
          />
          <Grid
            label="Causal access remains lower triangular"
            values={ids.map((_, i) => ids.map((_, j) => j <= i))}
            boolean
          />
        </div>
      </Figure>
      <FlowControls>
        <FlowChoice
          label="Loss target family"
          value={joint}
          onChange={setJoint}
          options={[
            [true, 'Joint image + text'],
            [false, 'Text and boundaries only'],
          ]}
        />
        <FlowChoice
          label="Block ordering"
          value={order}
          onChange={setOrder}
          options={[
            [false, 'Image then text'],
            [true, 'Text then image'],
          ]}
        />
        <button
          onClick={() => {
            setJoint(true);
            setOrder(false);
          }}
        >
          Reset mixed stream
        </button>
      </FlowControls>
      <FlowReadout>
        {targets.filter((x) => x !== '−100').length} scored targets among 8 available next
        positions. BOS is an input; EOS is a target. Image codes require an image decoder to become
        pixels. The tiny namespaces are constructed teaching IDs, not Chameleon’s vocabulary.
      </FlowReadout>
    </FlowLab>
  );
}
export function EvaluationControls() {
  const state = useStudy(),
    [row, setRow] = useState(0),
    [swap, setSwap] = useState(20);
  if (!state.data) return <Loading state={state} />;
  const d = state.data,
    source = d.assessment_pixels[row],
    other = d.assessment_pixels[swap],
    inputs = [source, other, Array(64).fill(0)],
    results = inputs.map((x) => savedForward(d, x)),
    target = d.data.labels[d.final.assessment.source_ids[row]],
    otherLabel = d.data.labels[d.final.assessment.source_ids[swap]];
  return (
    <FlowLab label="Compare actual saved-model input controls">
      <Figure name="25 Evidence under image intervention">
        <div className="mmp-archive">
          {inputs.map((x, i) => (
            <div key={i} style={{ '--mmp-hue': identities[i] }}>
              <strong>{['Original', 'Swapped image', 'Blank image'][i]}</strong>
              <Pixels pixels={x} />
              <span>Prediction: {digitNames[results[i].predicted]}</span>
              <span>P(original caption): {f(results[i].probabilities[target], 4)}</span>
            </div>
          ))}
        </div>
        <Bars
          values={[
            d.final.assessment.accuracy,
            d.controls.shuffled.accuracy,
            d.controls.blank.accuracy,
          ]}
          labels={['Full assessment original', 'Full assessment shuffle', 'Full assessment blank']}
          max={1}
          color={BLUE}
        />
      </Figure>
      <FlowControls>
        <FlowSlider
          name="Original assessment row"
          value={row}
          min={0}
          max={199}
          step={1}
          onChange={setRow}
        />
        <FlowSlider
          name="Replacement assessment row"
          value={swap}
          min={0}
          max={199}
          step={1}
          onChange={setSwap}
        />
        <button onClick={() => setSwap(row)}>Use unchanged image</button>
        <button
          onClick={() => {
            setRow(0);
            setSwap(20);
          }}
        >
          Reset intervention
        </button>
      </FlowControls>
      <FlowReadout>
        Fixed target: digit {digitNames[target]}. Replacement label: digit {digitNames[otherLabel]};{' '}
        {target === otherLabel
          ? 'class relevance is preserved, so this is a weak class-level swap control.'
          : 'class relevance changes.'}{' '}
        The saved full shuffle preserved {d.controls.same_class_after_shuffle} of 200 labels; those
        aggregate values stay fixed while the selected examples change.
      </FlowReadout>
    </FlowLab>
  );
}
