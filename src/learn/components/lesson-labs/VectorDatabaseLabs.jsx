import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, NeuralTable, formatNeural as f } from './NeuralLessonElements.jsx';
import { vectorRecords, coarseRecords, coarseCentroids, filteredRetrieval, coarseRetrieval } from '../../data/vector-database-models.js';
import './neural-lesson-neutral.css';
import './vector-database-labs.css';
function VectorPlane({
  records,
  query,
  winners,
  eligible = records,
  centers = []
}) {
  const x = value => 35 + value * 50,
    y = value => 280 - value * 50;
  return <figure className="vector-plane"><figcaption>Coordinates and current candidates</figcaption><svg viewBox="0 0 315 315" role="img" aria-label="Two-dimensional vector map. Query is a diamond; records are labeled circles; lines connect the returned neighbors. Exact coordinates and ranks follow.">
    {[0, 1, 2, 3, 4, 5].map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1="30" y2="280" stroke="#303030" /><line x1="35" x2="285" y1={y(t)} y2={y(t)} stroke="#303030" /><text x={x(t)} y="301" textAnchor="middle">{t}</text><text x="20" y={y(t) + 4} textAnchor="middle">{t}</text></g>)}
    {winners.map(record => <line key={record.id} x1={x(query.x)} y1={y(query.y)} x2={x(record.x)} y2={y(record.y)} stroke="#e4b752" strokeDasharray="4 3" />)}
    {centers.map(center => <g key={center.id}><rect x={x(center.x) - 5} y={y(center.y) - 5} width="10" height="10" fill="#777" /><text x={x(center.x) - (center.id === 'L0' ? -12 : 15)} y={y(center.y) - 36} textAnchor="middle">{center.id}</text></g>)}
    {records.map(record => {
        const offset = centers.length && record.id === 'A' ? -14 : centers.length && record.id === 'B' ? 14 : 0;
        return <g key={record.id}><circle cx={x(record.x)} cy={y(record.y)} r="5" fill={eligible.some(r => r.id === record.id) ? '#e7e7e7' : '#111'} stroke="#eee" />{offset !== 0 && <line x1={x(record.x)} y1={y(record.y) - 5} x2={x(record.x) + offset} y2={y(record.y) - 15} stroke="#888" />}<text x={x(record.x) + offset} y={y(record.y) - 19} textAnchor="middle">{record.id}</text></g>;
      })}
    <path d={`M${x(query.x)},${y(query.y) - 8} l8,8 -8,8 -8,-8 Z`} fill="#e4b752" stroke="#111" />
  </svg><p>Diamond = query q=({f(query.x, 2)}, {f(query.y, 2)}). x is horizontal; y is vertical. Filled circle = candidate; hollow = excluded. {centers.length > 0 && 'Squares mark fixed coarse centroids.'}</p></figure>;
}
export function RetrievalContractFigure() {
  return <figure className="vector-contract"><figcaption>A result must trace back to the evidence</figcaption><ol><li><strong>Source</strong><span>Record ID + original content + version</span></li><li><strong>Representation</strong><span>Compatible encoder → d coordinates</span></li><li><strong>Search</strong><span>Eligibility → candidates → scores</span></li><li><strong>Return</strong><span>Ranked IDs + permitted current source</span></li></ol></figure>;
}
export function VectorMetricLab() {
  const [qx, setX] = useState(1),
    [qy, setY] = useState(1),
    [metric, setMetric] = useState('cosine'),
    [access, setAccess] = useState('public'),
    [k, setK] = useState(2);
  const query = {
      x: qx,
      y: qy
    },
    result = filteredRetrieval(query, metric, access, k);
  const reset = () => {
    setX(1);
    setY(1);
    setMetric('cosine');
    setAccess('public');
    setK(2);
  };
  return <NeuralLab id="vector-metric-filter" title="Change the geometry and the eligible records"><div className="neural-controls"><NeuralNumber label="Query x" value={qx} onChange={setX} min={0} max={5} step={0.1} /><NeuralNumber label="Query y" value={qy} onChange={setY} min={0} max={5} step={0.1} /><NeuralSelect label="Scoring geometry" value={metric} onChange={setMetric} options={[['cosine', 'Cosine'], ['dot', 'Dot product'], ['l2', 'Squared L2']]} /><NeuralSelect label="Eligible access" value={access} onChange={setAccess} options={[['public', 'Public only'], ['all', 'All records']]} /><NeuralNumber label="Requested neighbors" value={k} onChange={setK} min={1} max={4} step={1} integer /></div>
    <div className="vector-lab-grid"><VectorPlane records={vectorRecords} query={query} winners={result?.winners ?? []} eligible={vectorRecords.filter(r => access === 'all' || r.access === access)} /><div><h4>Filter before selecting k</h4><p className="vector-result">{result ? result.winners.map(r => r.id).join(' → ') : 'Undefined cosine: zero query has no direction.'}</p><h4>Take global top-k, then filter</h4><p>{result ? result.postfiltered.map(r => r.id).join(' → ') || 'No records' : 'No cosine ranking'}</p><p>{result && `${result.eligible.length} eligible records. ${result.postfiltered.length < result.winners.length ? 'Post-filtering lost an eligible result.' : 'These results happen to have equal length; that is not a general guarantee.'}`}</p><p>Score column shows {metric === 'l2' ? 'positive squared distance: smaller is better' : 'similarity: larger is better'}. Equal scores use ID order.</p></div></div>
    <NeuralTable caption="All six records under the current query" headers={['Record', 'Coordinates / access', 'Score']} rows={(result?.ranking ?? vectorRecords).map(r => [r.id, `(${r.x}, ${r.y}) · ${r.access}`, result ? f(metric === 'l2' ? -r.score : r.score, 4) : 'undefined'])} /><div className="neural-actions"><button type="button" onClick={reset}>Reset retrieval</button></div>
  </NeuralLab>;
}
export function VectorCandidateLab() {
  const [qx, setX] = useState(2.1),
    [qy, setY] = useState(0),
    [probes, setProbes] = useState(1);
  const query = {
      x: qx,
      y: qy
    },
    result = coarseRetrieval(query, probes);
  return <NeuralLab id="vector-coarse-candidates" title="Cross a list boundary; recover a missing neighbor"><p>Fixed constructed lists; k=2, squared L2. These counts measure work in this example, not milliseconds.</p><div className="neural-controls"><NeuralNumber label="Candidate query x" value={qx} onChange={setX} min={0} max={5} step={0.1} /><NeuralNumber label="Candidate query y" value={qy} onChange={setY} min={0} max={5} step={0.1} /><NeuralNumber label="Lists probed" value={probes} onChange={setProbes} min={1} max={3} step={1} integer /></div>
    <div className="vector-lab-grid"><VectorPlane records={coarseRecords} query={query} winners={result.approximate} eligible={result.candidates} centers={coarseCentroids} /><div className="vector-lists">{result.lists.map(list => <div key={list.id} className={result.selected.some(s => s.id === list.id) ? 'vector-selected' : ''}><h4>{list.id} · centroid ({list.x},{list.y})</h4><p>{list.records.map(r => `${r.id} (${r.x},${r.y})`).join(' · ')}</p><small>{result.selected.some(s => s.id === list.id) ? 'Searched' : 'Not searched'}</small></div>)}</div></div>
    <div className="vector-summary"><p>Exact top-2<strong>{result.exact.map(r => r.id).join(' → ')}</strong></p><p>Candidate top-2<strong>{result.approximate.map(r => r.id).join(' → ')}</strong></p><p>Recall@2<strong>{f(result.recall)}</strong></p><p>Vectors scored<strong>{result.candidates.length} / 6</strong></p></div>
    <p>{result.recall < 1 ? 'A true neighbor is outside the searched lists. More precise scoring inside these lists cannot recover it.' : 'All exact top-2 IDs are present for this query. Try moving the query before concluding that this probe count always suffices.'}</p><div className="neural-actions"><button type="button" onClick={() => {
        setX(2.1);
        setY(0);
        setProbes(1);
      }}>Reset candidate search</button></div>
  </NeuralLab>;
}
