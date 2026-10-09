import { useState } from 'react';
import { CODEBOOKS, SOURCE, prefixTrace } from '../../data/entropy-reading-models.js';
import { Figure, Key, Drawing, Arrow, Mark, Table, Strip, Controls, Draft, Choice, Bars, CostGap, COLORS, number } from './EntropyDrawingElements.jsx';
export function PrefixTree({
  words = ['0', '10', '110', '111'],
  path = '',
  label = 'Prefix code tree',
  resetLeaf = null
}) {
  const prefixes = [...new Set(['', ...words.flatMap(word => Array.from({
    length: word.length
  }, (_, i) => word.slice(0, i + 1)))])];
  const position = prefix => {
    const leaves = [...words].sort();
    const children = leaves.map((word, index) => ({
      word,
      x: 60 + index * 120
    })).filter(item => item.word.startsWith(prefix));
    return [children.reduce((sum, item) => sum + item.x, 0) / children.length, 25 + prefix.length * 72];
  };
  return <Drawing label={label} width={480} height={100 + Math.max(...words.map(w => w.length)) * 72} minWidth={0}>{prefixes.filter(Boolean).map(prefix => {
      const [x, y] = position(prefix),
        [px, py] = position(prefix.slice(0, -1));
      return <g key={prefix}><Arrow x1={px} y1={py + 5} x2={x} y2={y - 9} color={path.startsWith(prefix) ? COLORS[0] : '#888'} /><text x={(x + px) / 2 + (prefix.endsWith('0') ? -12 : 12)} y={(y + py) / 2} textAnchor="middle" stroke="#121212" strokeWidth="4" paintOrder="stroke">{prefix.at(-1)}</text></g>;
    })}{prefixes.map(prefix => {
      const [x, y] = position(prefix),
        leaf = words.indexOf(prefix);
      return <g key={prefix}>{leaf < 0 ? <circle cx={x} cy={y} r={prefix === path ? 7 : 4} fill={prefix === path ? COLORS[0] : '#ddd'} /> : <><Mark x={x} y={y} index={leaf} size={8} /><text x={x} y={y + 46} textAnchor="middle" style={{
            fill: COLORS[leaf]
          }}>{'ABCD'[leaf]}</text>{resetLeaf === leaf && <path d={`M${x - 14} ${y - 8}q-20 -22 -25 0l-5 -7m5 7l8 -4`} fill="none" stroke={COLORS[leaf]} strokeWidth="2" />}</>}</g>;
    })}</Drawing>;
}
export function Prefix() {
  return <Figure id="E08" title="Leaves are complete codewords"><Key /><PrefixTree path="110" /><p>C follows 1 → 1 → 0. A leaf ends the word; decoding restarts at the root.</p><Drawing label="Invalid prefix collision: A ends at zero but B would continue along zero then one" minWidth={0} height={150}><circle cx="60" cy="30" r="5" fill="#ddd" /><Arrow x1={65} y1={30} x2={200} y2={30} /><text x="125" y="20">0</text><Mark x={210} y={30} /><text x="210" y="62" textAnchor="middle">A</text><Arrow x1={215} y1={35} x2={365} y2={105} color={COLORS[1]} dash /><text x="292" y="62">1</text><Mark x={375} y={110} index={1} /><text x="400" y="117">B</text></Drawing><p>Collision: A = 0 is already complete when B = 01 still requires another digit.</p></Figure>;
}
export function Decoder() {
  const [message, setMessage] = useState('AAAABBCD'),
    [book, setBook] = useState('matched'),
    [step, setStep] = useState(0),
    s = prefixTrace(message, book, step);
  const reset = () => {
    setMessage('AAAABBCD');
    setBook('matched');
    setStep(0);
  };
  const current = s.trace[s.consumed - 1];
  return <Figure id="E09" title="Encode completely, then inspect the decoder"><Key /><p>Complete encoded message ({s.bits.length} bits):</p><div className="en-codebits">{s.chunks.length ? s.chunks.map((chunk, i) => <span key={i} style={{
        color: COLORS['ABCD'.indexOf(message[i])]
      }}>{[...chunk].map((bit, j) => {
          const position = s.chunks.slice(0, i).reduce((sum, c) => sum + c.length, 0) + j;
          return <span key={j} className={position === s.consumed - 1 ? 'en-current' : undefined}>{bit}</span>;
        })} </span>) : 'Empty string'}</div><p>Complete decoded result: <strong className="en-longword">{s.completeOutput || 'Empty string'}</strong>. This output is visible before stepping.</p><p className="en-status">Expected length {number(s.expectedLength)} bits per symbol. Realized length {s.messageAverage === null ? 'unavailable for an empty message' : number(s.messageAverage)}. Fixed two-bit length: {s.fixedLength}.</p><PrefixTree words={s.words} path={current?.path ?? ''} resetLeaf={current?.leaf ?? null} />{current?.leaf >= 0 && <p>Leaf {'ABCD'[current.leaf]} emits that symbol; the local return arrow means restart at the root before the next bit.</p>}<Table caption="Codewords and lengths" headers={['Symbol', 'Word', 'Length']} rows={s.words.map((w, i) => ['ABCD'[i], w, w.length])} /><p aria-live="polite">Inspection {s.consumed}/{s.bits.length}: decoded prefix “{s.decoded}”; unfinished tree prefix “{s.buffer}”.</p><Controls onReset={reset}><Draft label="Message" value={message} parse={text => {
        prefixTrace(text, book);
        return text;
      }} onApply={v => {
        setMessage(v);
        setStep(0);
      }} /><Choice label="Codebook" value={book} onChange={v => {
        setBook(v);
        setStep(0);
      }} options={Object.entries(CODEBOOKS).map(([key, v]) => [key, v.label])} /><div className="en-actions"><button disabled={s.consumed === 0} onClick={() => setStep(s.consumed - 1)}>Previous bit</button><button disabled={s.consumed === s.bits.length} onClick={() => setStep(s.consumed + 1)}>Next bit</button></div></Controls><details><summary>Inspect every bit and decoded prefix</summary><Table caption="Actual decoder trace" headers={['Bit index', 'Digit', 'Tree path', 'Decoded prefix', 'Unfinished prefix']} rows={s.trace.map(r => [r.index + 1, r.bit, r.path, r.output || 'empty', r.remainingPrefix || 'root'])} /></details></Figure>;
}
export function CodeLengths() {
  return <Figure id="E10" title="The same source, three different trees">{Object.entries(CODEBOOKS).map(([key, book]) => <section key={key}><h4>{book.label}</h4><PrefixTree words={book.words} /><Table caption={`${key} code accounting`} headers={['Symbol', 'Probability', 'Word', 'Weighted length']} rows={book.words.map((w, i) => ['ABCD'[i], SOURCE[i], w, SOURCE[i] * w.length])} /><p>Expected length = {number(book.words.reduce((sum, w, i) => sum + SOURCE[i] * w.length, 0))} bits per symbol.</p></section>)}<Bars maximum={3} title="Source-weighted mean lengths" rows={[{
      label: 'Matched',
      value: 1.75
    }, {
      label: 'Fixed',
      value: 2
    }, {
      label: 'Reversed',
      value: 2.625
    }]} /><Bars maximum={3} title="Realized length for the one-symbol message D" rows={[{
      label: 'Matched',
      value: 3
    }, {
      label: 'Fixed',
      value: 2
    }, {
      label: 'Reversed',
      value: 1
    }]} /><p>One D costs 3 bits with the matched tree and 2 with the fixed tree. The matched tree wins on the specified average, not on every string.</p></Figure>;
}
export function RoundLengths() {
  return <Figure id="E11" title="Ideal prices need not be integer word lengths"><Drawing label="Common 0 to 4 bit ruler comparing ideal Bernoulli lengths with rounded lengths" height={220}>{[.9, .1].map((p, i) => {
        const ideal = -Math.log2(p),
          ceil = Math.ceil(ideal),
          y = 45 + 100 * i;
        return <g key={p}><line x1="45" y1={y} x2="435" y2={y} stroke="#888" />{[0, 1, 2, 3, 4].map(n => <g key={n}><line x1={45 + n * 97.5} y1={y - 5} x2={45 + n * 97.5} y2={y + 5} stroke="#aaa" /><text x={45 + n * 97.5} y={y + 30} textAnchor="middle">{n}</text></g>)}<Mark x={45 + ideal * 97.5} y={y} index={i} /><path d={`M${45 + ideal * 97.5},${y - 12}H${45 + ceil * 97.5}`} fill="none" stroke={COLORS[i]} strokeWidth="3" /><line x1={45 + ceil * 97.5} y1={y - 19} x2={45 + ceil * 97.5} y2={y - 5} stroke={COLORS[i]} /></g>;
      })}</Drawing><Table caption="Ideal, rounded and optimal binary lengths" headers={['Outcome', 'Probability', 'Ideal', 'Ceiling', 'Optimal word']} rows={[[0, .9, number(-Math.log2(.9)), 1, '0 (length 1)'], [1, .1, number(-Math.log2(.1)), 4, '1 (length 1)']]} /><p>The ceiling construction is a bound, not the best code. Dyadic masses (½,¼,⅛,⅛) already have integer prices (1,2,3,3), so rounding adds zero.</p></Figure>;
}
export function Blocks() {
  const rows = [1, 2, 4, 8].map(n => {
    let total = 0;
    for (let k = 0; k <= n; k++) {
      let choose = 1;
      for (let j = 1; j <= k; j++) choose *= (n - j + 1) / j;
      const p = .9 ** (n - k) * .1 ** k;
      total += choose * p * Math.ceil(-Math.log2(p));
    }
    return [n, number(total, 9), number(total / n, 9), number(.468995593589 + 1 / n, 9)];
  });
  return <Figure id="E12" title="A block is one larger alphabet symbol"><Drawing label="Two binary draws form the four distinct block symbols 00, 01, 10, 11" minWidth={0} height={230}><circle cx="240" cy="15" r="4" fill="#ddd" />{[0, 1].map(a => <g key={a}><Arrow x1={240} y1={20} x2={120 + 240 * a} y2={85} /><text x={140 + 140 * a} y="48">{a === 0 ? '.9' : '.1'}</text><text x={120 + 240 * a} y="110" textAnchor="middle">{a}</text>{[0, 1].map(b => <g key={b}><Arrow x1={120 + 240 * a} y1={117} x2={60 + 120 * b + 240 * a} y2={185} /><text x={60 + 120 * b + 240 * a} y="220" textAnchor="middle">{a}{b}</text></g>)}</g>)}</Drawing><Strip title="Two-symbol block probabilities" labels={['00', '01', '10', '11']} values={[.81, .09, .09, .01]} /><div className="en-steps"><span>One block length Lₙ</span>÷<span>n source symbols</span>→<span>Lₙ/n per symbol</span></div><Table caption="Exact finite enumeration; Bernoulli .9/.1 ceiling construction" headers={['Block n', 'Bits per block', 'Bits per symbol', 'H + 1/n bound']} rows={rows} /><p>The gap is bounded by 1/n; this does not assert that every particular code family improves monotonically.</p></Figure>;
}
function Capacity({
  words
}) {
  return <>{words.map((w, i) => {
      const left = parseInt(w, 2) / 2 ** w.length,
        width = 2 ** -w.length;
      return <div key={w}><p><b style={{
            color: COLORS[i]
          }}>{'ABCD'[i]}</b> = {w}; interval [{number(left)}, {number(left + width)})</p><div className="en-capacity-row"><span style={{
            left: `${100 * left}%`,
            width: `${100 * width}%`,
            background: COLORS[i]
          }} /></div></div>;
    })}<div className="en-density-label"><span>0</span><span>Binary interval capacity</span><span>1</span></div></>;
}
export function KraftCapacity() {
  return <Figure id="E21" title="Codewords occupy disjoint binary intervals"><p>Matched code: every split halves the available interval.</p><PrefixTree /><Capacity words={CODEBOOKS.matched.words} /><p>Incomplete code: A=0110, B=0111, C=010, D=00.</p><PrefixTree words={['0110', '0111', '010', '00']} /><Capacity words={['0110', '0111', '010', '00']} /><Strip title="Occupied capacity K = ½; the right half is unused" labels={['D', 'C', 'A', 'B']} identities={[3, 2, 0, 1]} values={[1 / 4, 1 / 8, 1 / 16, 1 / 16]} /><p>The geometric ordering is D, C, A, B; symbol identities and their codewords stay unchanged.</p></Figure>;
}
export function KraftGap() {
  return <Figure id="E22" title="Normalize occupied capacity, then account for both gaps"><Table caption="The incomplete code's capacities become a probability law" headers={['Symbol', 'Word length', 'Capacity 2⁻ˡ', 'Divide by K=½: R']} rows={[["A", 4, 1 / 16, 1 / 8], ['B', 4, 1 / 16, 1 / 8], ['C', 3, 1 / 8, 1 / 4], ['D', 2, 1 / 4, 1 / 2]]} /><Strip title="Raw capacity; half the tree unused" values={[1 / 16, 1 / 16, 1 / 8, 1 / 4]} /><Strip title="Normalized R; symbol order A–D" values={[1 / 8, 1 / 8, 1 / 4, 1 / 2]} /><div className="en-steps"><span>L − H = 3.625 − 1.75</span>=<span>1.875</span>=<span>D(P‖R) .875</span>+<span>−log₂K = 1</span></div><CostGap title="Incomplete code: two separate overheads" entropy={1.75} total={3.625} totalLabel="L" parts={[{
      label: "Mismatch KL(P‖R)",
      value: .875
    }, {
      label: "Unused capacity −log₂K",
      value: 1
    }]} /><CostGap title="Matched complete code: zero comparison" entropy={1.75} total={1.75} totalLabel="L" parts={[{
      label: "Mismatch KL(P‖P)",
      value: 0
    }, {
      label: "Unused capacity −log₂1",
      value: 0
    }]} /><p>For the matched complete code, R=P and K=1: both costs vanish.</p></Figure>;
}
