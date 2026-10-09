import { BPE_END, CLASSIC_BPE_CORPUS, corpusCounts, trainBpe, encodeBpe } from "../../data/subword-tokenization-models.js";
import { tokenIdentityStyle } from "./token-identity-colors.js";
import "./token-identity-colors.css";
import "./subword-structure-figures.css";

// Boundary metadata stays visible while the underlying spelling keeps its hue.
function pieceIdentity(piece) {
  const literal = String(piece);
  return literal.replace(/^(?:##|▁)/u, "").replace(/<\/w>$/u, "") || literal;
}

// Input spans preserve their source width; markers occupy one labelled cell.
export function SpellingSpans({ pieces, selected = [], kind = "parameter", identityKeys = null }) {
  return <div className={`subword-spans subword-spans--${kind}`}>
    {pieces.map((piece, index) => {
      const key = piece === "[UNK]" || kind === "missing" ? null : identityKeys?.[index] ?? (kind === "input" || kind === "parameter" ? piece : null);
      const identity = key !== null ? pieceIdentity(key) : null;
      return <span key={index} data-token-identity={identity} className={`${identity !== null ? "token-identity" : ""} ${piece === "[UNK]" ? "is-missing" : ""} ${selected.includes(index) ? "is-traced" : ""}`}
        style={{ flexGrow: Math.max(1, [...piece.replace(/^##/, "")].length), ...(identity !== null ? tokenIdentityStyle(identity) : {}) }}>{piece}</span>;
    })}
  </div>;
}

function Drawing({ name, label, children, caption }) {
  return <figure className="subword-drawing" data-figure={name} aria-label={label}>
    {children}{caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

function Graph({ label, height = 220, children }) {
  return <svg className="subword-graph" viewBox={`0 0 320 ${height}`} role="img" aria-label={label}>{children}</svg>;
}

function Arrow({ x1, y1, x2, y2, dashed = false, identityKey = null }) {
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length;
  const points = `${x2},${y2} ${x2 - 8 * ux + 4 * uy},${y2 - 8 * uy - 4 * ux} ${x2 - 8 * ux - 4 * uy},${y2 - 8 * uy + 4 * ux}`;
  return <g className={`subword-edge${dashed ? " is-missing" : ""}${identityKey !== null ? " subword-identity-edge" : ""}`} style={identityKey !== null ? tokenIdentityStyle(identityKey) : undefined}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} /><polygon points={points} />
  </g>;
}

function Node({ x, y, text, role = "parameter", terminal = false, identityKey = null }) {
  const key = identityKey ?? (role === "parameter" || (role === "input" && !/^\d+$/u.test(text)) ? text : null);
  const identity = key !== null ? pieceIdentity(key) : null;
  return <g className={`subword-node subword-node--${role}${identity !== null ? " token-identity-node" : ""}`} data-token-identity={identity} style={identity !== null ? tokenIdentityStyle(identity) : undefined}>
    <circle cx={x} cy={y} r={terminal ? 19 : 16} />
    {terminal && <circle cx={x} cy={y} r="23" className="subword-terminal" />}
    <text x={x} y={y + 6} textAnchor="middle">{text}</text>
  </g>;
}

export function TextToIdsFigure() {
  return <Drawing name="text-vocabulary-id-correspondence" label="Lowest uses low and est; the illustrated vocabulary maps low to ID 7 and est to ID 12.">
    <div className="subword-correspondence">
      <div><span className="subword-figure-label">Text supplied</span><SpellingSpans pieces={["lowest"]} kind="input" />
        <span className="subword-down-arrow">↓ choose boundaries</span><SpellingSpans pieces={["low", "est"]} /></div>
      <table className="subword-dictionary"><caption>Illustrated vocabulary</caption><thead><tr><th>Piece</th><th>ID</th></tr></thead><tbody>
        <tr className="token-identity" style={tokenIdentityStyle("low")}><th>low</th><td>7</td></tr><tr className="token-identity" style={tokenIdentityStyle("est")}><th>est</th><td>12</td></tr>
      </tbody></table>
      <div><span className="subword-figure-label">Model input, in order</span><SpellingSpans pieces={["7", "12"]} kind="computed" identityKeys={["low", "est"]} />
        <span className="subword-down-arrow">↑ look up each piece</span></div>
    </div>
    <figcaption>The two rows belong to a small constructed dictionary. Each ID is a row label. Colours follow piece identity across text, dictionary and IDs; white outlines mark the selected pieces.</figcaption>
  </Drawing>;
}

export function SubwordChoiceFigure() {
  return <Drawing name="same-spelling-three-units" label="Three constructed dictionaries encode lowest as an unknown word, six letters, or two reusable pieces.">
    <div className="subword-aligned-rows">
      <div><span>Whole word absent</span><SpellingSpans pieces={["[UNK]"]} kind="missing" /><small>Spelling lost</small></div>
      <div><span>Individual letters</span><SpellingSpans pieces={[..."lowest"]} /><small>6 positions</small></div>
      <div><span>Reusable pieces</span><SpellingSpans pieces={["low", "est"]} /><small>2 positions</small></div>
    </div>
  </Drawing>;
}

const firstMerge = trainBpe(corpusCounts(CLASSIC_BPE_CORPUS), 1);

export function FirstMergeFigure() {
  return <Drawing name="weighted-corpus-first-merge" label="Newest occurs six times and widest three. Their e and s join to es; low and lower stay unchanged.">
    {firstMerge.states[0].words.map((row, index) => <div className="subword-merge-row" key={row.word}>
      <span className="subword-figure-label">{row.word} × {row.count}</span>
      <SpellingSpans pieces={row.tokens} kind="input" selected={row.tokens.flatMap((token, i) => token === "e" && row.tokens[i + 1] === "s" ? [i, i + 1] : [])} />
      <span className="subword-down-arrow">↓ {row.word === "newest" || row.word === "widest" ? "join traced e + s" : "no e + s neighbors"}</span>
      <SpellingSpans pieces={firstMerge.states[1].words[index].tokens} />
    </div>)}
    <div className="subword-contribution-bars" aria-label="Six occurrences plus three occurrences equals nine">
      <span>newest</span><div style={{ width: "66.6667%" }}>6</div>
      <span>widest</span><div style={{ width: "33.3333%" }}>3</div>
    </div>
    <figcaption>White outlines trace selected occurrences. Counts include repeated words; marker {BPE_END} occupies one cell.</figcaption>
  </Drawing>;
}

export function BpeMergeTreeFigure() {
  return <Drawing name="bpe-suffix-merge-tree" label="First join e and s to es; then join t to make est; then join the end marker to make est end marker.">
    <Graph height={245} label="A branching merge tree, with the three suffix merges in training order.">
      <Arrow x1={55} y1={39} x2={91} y2={77} /><Arrow x1={145} y1={39} x2={109} y2={77} />
      <Arrow x1={111} y1={106} x2={146} y2={145} /><Arrow x1={220} y1={39} x2={176} y2={145} />
      <Arrow x1={173} y1={175} x2={210} y2={215} /><Arrow x1={292} y1={43} x2={235} y2={215} />
      <Node x={45} y={25} text="e" role="input" /><Node x={155} y={25} text="s" role="input" />
      <Node x={100} y={92} text="es" /><Node x={220} y={25} text="t" role="input" />
      <Node x={160} y={160} text="est" /><Node x={292} y={25} text="E" role="input" identityKey={BPE_END} />
      <g className="token-identity-node" style={tokenIdentityStyle("est")}><rect x="170" y="211" width="105" height="32" className="subword-parameter-cell" /><text x="222" y="233" textAnchor="middle">est + E</text></g>
      <text x="30" y="94">1</text><text x="70" y="164">2</text><text x="105" y="233">3</text>
    </Graph>
    <figcaption>E denotes the single {BPE_END} marker. The new piece becomes an input to the next merge.</figcaption>
  </Drawing>;
}

export function BpeEncodingFigure() {
  const trained = trainBpe(corpusCounts(CLASSIC_BPE_CORPUS), 5);
  return <Drawing name="saved-rank-new-word-trace" label="Five saved merges change the boundaries of lowest without changing its spelling.">
    {[0, 1, 2, 3, 4, 5].map(step => <div className="subword-rank-frame" key={step}>
      <span>{step === 0 ? "Characters" : `Rank ${step - 1}: ${trained.merges[step - 1].join(" + ")}`}</span>
      <SpellingSpans pieces={encodeBpe("lowest", trained.merges.slice(0, step))} kind={step === 0 ? "input" : "parameter"} />
    </div>)}
    <figcaption>Only piece boundaries change. The saved rules came from the training corpus.</figcaption>
  </Drawing>;
}

export function BpeIndexFigure() {
  return <Drawing name="bpe-index-neighbor-links" label="An e+s index points only to newest and widest. Joining their neighboring e and s repairs the local linked sequence.">
    <Graph height={160} label="The pair-to-words index has two outgoing links for e+s.">
      <rect x="15" y="57" width="80" height="38" className="subword-parameter-cell" /><text x="55" y="82" textAnchor="middle">e + s</text>
      <Arrow x1={95} y1={65} x2={183} y2={33} /><Arrow x1={95} y1={87} x2={183} y2={121} />
      <text x="190" y="39" className="subword-input-text">newest ×6</text><text x="190" y="128" className="subword-input-text">widest ×3</text>
      <text x="17" y="145">affected-word index</text>
    </Graph>
    <div className="subword-linked-lanes">
      <div><span>Before, inside newest</span><SpellingSpans pieces={["w", "e", "s", "t"]} selected={[1, 2]} /></div>
      <span className="subword-down-arrow">↓ repair w↔es and es↔t</span>
      <div><span>After this occurrence</span><SpellingSpans pieces={["w", "es", "t"]} selected={[1]} /></div>
    </div>
    <figcaption>The arrows between cells denote neighbor links; the letters outside this local window remain in place.</figcaption>
  </Drawing>;
}

export function WordPieceWalkthroughFigure() {
  return <Drawing name="wordpiece-ordinary-success" label="The dictionary contains low, lowest, continuation er and continuation est. Lower uses low then continuation er; lowest uses its longest whole entry.">
    <div className="subword-wordpiece-success">
      <div><SpellingSpans pieces={["lower"]} kind="input" /><span className="subword-down-arrow">↓ longest starting match, then continuation</span><SpellingSpans pieces={["low", "##er"]} /></div>
      <div><SpellingSpans pieces={["lowest"]} kind="input" /><span className="subword-down-arrow">↓ longest starting match finishes the word</span><SpellingSpans pieces={["lowest"]} /></div>
    </div>
    <figcaption>Constructed vocabulary: low, lowest, ##er, ##est. The ## prefix is dictionary metadata.</figcaption>
  </Drawing>;
}

export function WordPieceTrieFigure() {
  return <Drawing name="wordpiece-two-prefix-trees" label="Starting pieces a and ab share one trie branch. Continuation pieces b, bc and c use a separate root. Double circles mark complete vocabulary entries.">
    <Graph height={225} label="Two actual prefix trees, one for starting entries and one for continuation entries.">
      <text x="15" y="22">Start</text><text x="177" y="22">Continue (##)</text>
      <Arrow x1={63} y1={66} x2={63} y2={102} /><Arrow x1={63} y1={141} x2={63} y2={175} />
      <Arrow x1={231} y1={65} x2={202} y2={102} /><Arrow x1={249} y1={65} x2={280} y2={102} />
      <Arrow x1={191} y1={141} x2={191} y2={175} />
      <Node x={63} y={50} text="•" role="operation" /><Node x={63} y={121} text="a" terminal /><Node x={63} y={194} text="b" terminal identityKey="ab" />
      <Node x={240} y={50} text="•" role="operation" /><Node x={191} y={121} text="b" terminal identityKey="##b" /><Node x={291} y={121} text="c" terminal identityKey="##c" /><Node x={191} y={194} text="c" terminal identityKey="##bc" />
      <text x="95" y="128">a</text><text x="95" y="201">ab</text>
    </Graph>
    <figcaption>Read edge/node letters from the root. A double circle marks a complete entry; the continuation root supplies ##.</figcaption>
  </Drawing>;
}

export function UnigramPrefixFigure() {
  const totals = [1, .2, .64, .128, .4096];
  return <Drawing name="unigram-shared-prefix-dp" label="The spelling abab has five positions. Prefix totals are 1, .2, .64, .128 and .4096. Single edges a,b have weight .2; two-step ab edges .6.">
    <Graph height={210} label="A lattice for abab with reusable totals under each position.">
      <path d="M25 105 Q90 12 155 105 M155 105 Q220 12 285 105" fill="none" className="subword-parameter-edge subword-identity-path" style={tokenIdentityStyle("ab")} />
      <text x="90" y="52" textAnchor="middle" className="subword-identity-label" style={tokenIdentityStyle("ab")}>ab:<tspan className="subword-computed-text"> .6</tspan></text><text x="220" y="52" textAnchor="middle" className="subword-identity-label" style={tokenIdentityStyle("ab")}>ab:<tspan className="subword-computed-text"> .6</tspan></text>
      {[25, 90, 155, 220].map((x, index) => <g key={x} className="subword-identity-label" style={tokenIdentityStyle(index % 2 ? "b" : "a")}><Arrow x1={x + 5} y1={105} x2={x + 60} y2={105} identityKey={index % 2 ? "b" : "a"} />
        <text x={x + 32} y="92" textAnchor="middle">{index % 2 ? "b" : "a"}</text></g>)}
      {[25, 90, 155, 220, 285].map((x, index) => <g key={x}>
        <circle cx={x} cy="105" r="5" className="subword-position" /><text x={x} y="136" textAnchor="middle">{index}</text>
        <text x={x} y={index % 2 ? 192 : 168} textAnchor="middle" className="subword-computed-text">{totals[index]}</text>
      </g>)}
    </Graph>
    <div className="subword-credit-calculation"><span>Best complete path: ab | ab → .6 × .6 = <strong>.36</strong></span></div>
    <figcaption>Single-letter edges have weight .2. Numbers below positions are total prefix weights F, with F(0)=1. Total weight .4096 includes every path; the best path has weight .36.</figcaption>
  </Drawing>;
}

export function UnigramCreditFigure() {
  return <Drawing name="unigram-forward-backward-credit" label="Expected usage of a is its forward prefix weight 1 times probability .2 times suffix weight .2, divided by total .64, yielding .0625. Ab receives .9375.">
    <Graph height={190} label="Forward and suffix weights meet at a traced edge in the ab lattice.">
      <path d="M30 100 Q160 -8 290 100" fill="none" className="subword-parameter-edge subword-identity-path" style={tokenIdentityStyle("ab")} /><text x="160" y="35" textAnchor="middle" className="subword-identity-label" style={tokenIdentityStyle("ab")}>ab:<tspan className="subword-computed-text"> .6</tspan></text>
      <Arrow x1={35} y1={100} x2={150} y2={100} identityKey="a" /><Arrow x1={170} y1={100} x2={285} y2={100} identityKey="b" />
      <line x1="40" y1="110" x2="145" y2="110" className="subword-trace-line" />
      <text x="91" y="84" textAnchor="middle" className="subword-identity-label" style={tokenIdentityStyle("a")}>a:<tspan className="subword-computed-text"> .2</tspan></text><text x="230" y="84" textAnchor="middle" className="subword-identity-label" style={tokenIdentityStyle("b")}>b:<tspan className="subword-computed-text"> .2</tspan></text>
      {[30, 160, 290].map((x, i) => <g key={x}><circle cx={x} cy="100" r="5" className="subword-position" /><text x={x} y="139" textAnchor="middle">{i}</text></g>)}
      <text x="30" y="171" textAnchor="start">F(0)=1</text><text x="173" y="171">B(1)=.2</text>
    </Graph>
    <div className="subword-credit-calculation"><span>Trace a: 1 × .2 × .2 / .64 = <strong>.0625</strong></span>
      <span>Trace ab: 1 × .6 × 1 / .64 = <strong>.9375</strong></span></div>
    <div className="subword-probability-update"><span>ab → 15/17</span><span>a → 1/17</span><span>b → 1/17</span></div>
    <figcaption>F collects preceding paths; B collects completing paths. Updated probabilities divide expected uses by 17/16.</figcaption>
  </Drawing>;
}

export function UnigramPruningFigure() {
  return <Drawing name="fixed-weight-path-removal" label="At fixed weights a=b=.2 and ab=.6, removing the ab edge reduces the total weight from .64 to .04.">
    <Graph height={215} label="Before and after removing the whole-piece edge, with the split path unchanged.">
      {[60, 165].map((y, row) => <g key={y}>
        <path d={`M40 ${y} Q160 ${y - 75} 280 ${y}`} fill="none" className={`subword-parameter-edge${row ? " is-missing" : " subword-identity-path"}`} style={row ? undefined : tokenIdentityStyle("ab")} />
        <text x="160" y={y - 44} textAnchor="middle" className={row ? "" : "subword-identity-label"} style={row ? undefined : tokenIdentityStyle("ab")}>{row ? "ab removed" : <>ab:<tspan className="subword-computed-text"> .6</tspan></>}</text>
        <Arrow x1={45} y1={y} x2={155} y2={y} identityKey="a" /><Arrow x1={165} y1={y} x2={275} y2={y} identityKey="b" />
        <text x="100" y={y - 6} textAnchor="middle" className="subword-identity-label" style={tokenIdentityStyle("a")}>a</text><text x="220" y={y - 6} textAnchor="middle" className="subword-identity-label" style={tokenIdentityStyle("b")}>b</text>
        {[40, 160, 280].map(x => <circle key={x} cx={x} cy={y} r="5" className="subword-position" />)}
        <text x="160" y={y + 28} textAnchor="middle" className="subword-computed-text">{row ? ".2 × .2 = .04" : ".6 + .04 = .64"}</text>
      </g>)}
    </Graph>
    <figcaption>Removal comparison holds surviving weights fixed. Refit and renormalization follow as a separate step.</figcaption>
  </Drawing>;
}

export function UnigramSamplingFigure() {
  return <Drawing name="unigram-posterior-sampling-tree" label="Sampling conditioned on ab follows the whole-piece path with probability 15/16 or the a then b path with probability 1/16.">
    <Graph height={225} label="Two conditional sampling branches with complete outputs.">
      <Node x={160} y={32} text="0" role="input" />
      <Arrow x1={148} y1={46} x2={67} y2={118} identityKey="ab" /><Arrow x1={172} y1={46} x2={254} y2={118} identityKey="a" />
      <text x="76" y="68" textAnchor="middle" className="subword-computed-text">15/16</text><text x="247" y="68" textAnchor="middle" className="subword-computed-text">1/16</text>
      <Node x={55} y={140} text="ab" /><Node x={265} y={140} text="a" />
      <Arrow x1={265} y1={157} x2={265} y2={192} identityKey="b" /><text x="230" y="182">1</text><Node x={265} y={210} text="b" />
      <text x="18" y="196">finished</text>
    </Graph>
    <figcaption>Each sample spells the same ab. After choosing a, only b completes this vocabulary path.</figcaption>
  </Drawing>;
}

export function SentencePieceSpaceFigure() {
  return <Drawing name="sentencepiece-space-span" label="Low space low corresponds to low followed by visible space marker low; replacing the marker with a space recovers the input.">
    <div className="subword-rank-frame"><span>Text, one space</span><SpellingSpans pieces={["low", "␠", "low"]} kind="input" /></div>
    <span className="subword-down-arrow">↓ make that space part of a piece</span>
    <div className="subword-rank-frame"><span>Illustrated pieces</span><SpellingSpans pieces={["low", "▁low"]} /></div>
    <span className="subword-down-arrow">↓ join pieces, then ▁ becomes ␠</span>
    <div className="subword-rank-frame"><span>Decoded text</span><SpellingSpans pieces={["low", "␠", "low"]} kind="computed" identityKeys={["low", "␠", "low"]} /></div>
    <figcaption>␠ displays an ordinary space. Constructed dictionary, no added leading-space marker.</figcaption>
  </Drawing>;
}

export function TokenizerPipelineFigure() {
  return <Drawing name="text-transform-id-row-pipeline" label="The selected pipeline lowercases LOW two spaces low, then splits whitespace, losing case and exact spacing. Low maps to ID 7 twice, selecting embedding row 7 twice.">
    <div className="subword-rank-frame"><span>Source</span><SpellingSpans pieces={["LOW", "␠", "␠", "low"]} kind="input" /></div>
    <span className="subword-down-arrow">↓ lowercase</span>
    <div className="subword-rank-frame"><span>Normalized</span><SpellingSpans pieces={["low", "␠", "␠", "low"]} kind="computed" identityKeys={["low", "␠", "␠", "low"]} /></div>
    <span className="subword-down-arrow">↓ split whitespace; separator cells disappear</span>
    <div className="subword-rank-frame"><span>Regions/pieces</span><SpellingSpans pieces={["low", "low"]} /></div>
    <span className="subword-down-arrow">↓ illustrated vocabulary: low ↦ 7</span>
    <div className="subword-rank-frame"><span>IDs</span><SpellingSpans pieces={["7", "7"]} kind="computed" identityKeys={["low", "low"]} /></div>
    <span className="subword-down-arrow">↓ each 7 selects the same model row</span>
    <div className="subword-row-lookup"><span>[7, 7]</span><span>→</span><table className="subword-matrix"><caption>Illustrated learned embedding rows</caption><tbody>
      {[6, 7, 8].map(row => <tr key={row} className={row === 7 ? "is-traced" : ""}><th>{row}</th>{[0, 1, 2].map(column => <td key={column}>{row === 7 ? [.2, -.4, .1][column] : "·"}</td>)}</tr>)}
    </tbody></table></div>
    <figcaption>This chosen pipeline discards case and separator count. The small row values illustrate lookup, not measured model weights.</figcaption>
  </Drawing>;
}

export function RecordedTokenizerFigure() {
  return <Drawing name="recorded-native-pieces-space-contrast" label="The exact recorded Alice was curious outputs differ by visible space markers while both have eight pieces.">
    <div className="subword-rank-frame"><span>Input</span><SpellingSpans pieces={["Alice was curious."]} kind="input" /></div>
    <div className="subword-native-output"><span>HF BPE, whitespace split</span><SpellingSpans pieces={["Alice", "was", "c", "ur", "i", "ou", "s", "."]} /></div>
    <div className="subword-native-output"><span>SentencePiece BPE, spaces represented</span><SpellingSpans pieces={["Alice", "▁was", "▁c", "ur", "i", "ou", "s", "."]} /></div>
    <figcaption>Recorded Alice fits, vocabulary target 160. Literal ▁ marks distinguish the space-preserving output.</figcaption>
  </Drawing>;
}

function PairGrid({ length }) {
  return <div className="subword-pair-grid" role="img" aria-label={`${length} positions by ${length} positions gives ${length * length} ordered pairs.`}>
    <span>{length} × {length} = {length * length} pairs</span>
    <div style={{ gridTemplateColumns: `repeat(${length}, 1fr)` }}>{Array.from({ length: length * length }, (_, index) => <i key={index} />)}</div>
  </div>;
}

export function TokenizerBudgetFigure() {
  return <Drawing name="vocabulary-matrix-attention-pair-grids" label="Four vocabulary rows of width three store twelve values. Six positions need thirty-six ordered attention pairs; two positions need four, on the same cell scale.">
    <table className="subword-matrix subword-budget-matrix"><caption>V=4 rows, d=3 values per row</caption><thead><tr><th>Entry</th><th>0</th><th>1</th><th>2</th></tr></thead><tbody>
      {[0, 1, 2, 3].map(row => <tr key={row}><th>{row}</th>{[0, 1, 2].map(column => <td key={column}>•</td>)}</tr>)}
    </tbody></table>
    <div className="subword-pair-comparison"><PairGrid length={6} /><PairGrid length={2} /></div>
    <figcaption>Each square is one ordered position pair. Both pair grids use identical physical cell sizes; dense full attention is the accounting model.</figcaption>
  </Drawing>;
}

export function TokenizerMismatchFigure() {
  return <Drawing name="same-id-wrong-piece-and-fragment-boundary" label="Original low and replacement est both map to ID 7, but the model still selects its learned low row. Encoding fragments a and b separately misses the merge ab.">
    <div className="subword-compatibility-rows"><div><span>Original dictionary</span><code className="token-identity" style={tokenIdentityStyle("low")}>low → 7</code></div><div><span>Replacement dictionary</span><code className="token-identity" style={tokenIdentityStyle("est")}>est → 7</code></div></div>
    <div className="subword-row-lookup"><span>ID 7 →</span><table className="subword-matrix"><caption>Original model row for low</caption><tbody><tr className="is-traced"><th>7</th><td>.2</td><td>−.4</td><td>.1</td></tr></tbody></table></div>
    <div className="subword-fragment-comparison"><div><span>Whole input ab, learned a+b merge</span><SpellingSpans pieces={["ab"]} /></div><div><span>Separately encoded fragments</span><SpellingSpans pieces={["a", "b"]} /></div></div>
    <figcaption>The original model row values are illustrative. A fragment boundary prevents this otherwise eligible merge.</figcaption>
  </Drawing>;
}
