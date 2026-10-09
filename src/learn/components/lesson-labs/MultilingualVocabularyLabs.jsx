import { useState } from "react";
import { formatNeural as format } from "./NeuralLessonElements.jsx";
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from "./LessonFlow.jsx";
import { mixtureExperiment, vocabularyBudget, multilingualResults } from "../../data/multilingual-vocabulary-models.js";
import { tokenIdentityStyle } from "./token-identity-colors.js";
import "./neural-lesson-neutral.css";
import "./multilingual-vocabulary.css";
import "./token-identity-colors.css";
const count = value => value.toLocaleString("en-US");
const embeddingRows = [["c", .1, .4, -.2], ["a", .3, -.1, .5], ["t", -.2, .6, .1], ["s", .4, .2, -.3], ["cat", .5, .1, .2]];
function corpusStyle(identity) {
  const style = tokenIdentityStyle(identity);
  return {
    "--token-identity-color": style["--token-identity-color"],
    "--token-identity-background": style["--token-identity-background"],
    "--token-identity-border": style["--token-identity-border"]
  };
}
function joinCorpusStyle(pair) {
  const joined = pair.join("");
  const identity = /\p{Script=Devanagari}/u.test(joined)
    ? "corpus:hindi"
    : /\p{Script=Han}/u.test(joined) ? "corpus:chinese" : "corpus:english";
  return corpusStyle(identity);
}
function Pieces({
  tokens,
  traced = false
}) {
  return <div className="vocabulary-pieces">
  {tokens ? tokens.map((token, index) => <bdi className={`vocabulary-piece token-identity${traced ? " vocabulary-traced" : ""}`} style={{ ...tokenIdentityStyle(token), ...(traced ? { borderBottomColor: "#fff" } : {}) }} key={index}>
    {token}
  </bdi>) : <span className="vocabulary-missing">Cannot encode: these characters are absent from training.</span>}
</div>;
}
function WordPieces({
  word,
  tokens
}) {
  return <div className="vocabulary-word-group">
  <span>Word: 
    <bdi>
      {word}
    </bdi>
  </span>
  <Pieces tokens={tokens} />
  <span>
    {tokens.length} pieces
  </span>
</div>;
}
function Drawing({
  id,
  label,
  children
}) {
  return <figure className="vocabulary-figure" data-figure={id} aria-label={label}>
  {children}
</figure>;
}
function Arrow({
  children
}) {
  return <div className="vocabulary-arrow">
  <span>
    {children}
  </span>
  <svg viewBox="0 0 80 24" aria-hidden="true">
    <path d="M2 12H73M64 4l10 8-10 8" />
  </svg>
</div>;
}
function Matrix({
  rows = embeddingRows,
  selected = 4,
  label = "Five rows, three columns"
}) {
  return <div className="vocabulary-matrix-table" role="table" aria-label={label}>
  <div className="vocabulary-matrix-header" role="row">
    <span role="columnheader">ID</span>
    <span role="columnheader">Piece</span>
    <span role="columnheader">Three values per row</span>
  </div>
  {rows.map(([piece, ...values], index) => <div className={index === selected ? "vocabulary-traced-row" : ""} role="row" key={piece}>
    <span role="cell" className="vocabulary-computed">
      {index}
    </span>
    <bdi role="cell" className="token-identity vocabulary-identity-label" style={tokenIdentityStyle(piece)}>
      {piece}
    </bdi>
    <span role="cell" className="vocabulary-vector">
      {values.map((value, i) => <span key={i}>
        {typeof value === "number" ? format(value, 2) : value}
      </span>)}
    </span>
  </div>)}
</div>;
}
export function VocabularyChoiceFigure() {
  const choices = [["Four entries", ["c", "a", "t", "s"], ["c", "a", "t"], ["c", "a", "t", "s"]], ["Add cat: five entries", ["c", "a", "t", "s", "cat"], ["cat"], ["cat", "s"]], ["Add cats: five entries", ["c", "a", "t", "s", "cats"], ["c", "a", "t"], ["cats"]]];
  return <Drawing id="vocabulary-dictionary-choice" label="Three dictionaries encode the same two words">
  {choices.map(([label, dictionary, first, second]) => <div className="vocabulary-choice-row" key={label}>
    <div>
      <span>
        {label}
      </span>
      <Pieces tokens={dictionary} />
    </div>
    <Arrow>select pieces</Arrow>
    <div className="vocabulary-word-groups">
      <WordPieces word="cat" tokens={first} />
      <WordPieces word="cats" tokens={second} />
    </div>
    <output>
      {first.length + second.length} pieces sent
    </output>
  </div>)}
  <div className="vocabulary-reuse-drawing">
    <bdi className="vocabulary-piece token-identity vocabulary-traced" style={{ ...tokenIdentityStyle("cat"), borderBottomColor: "#fff" }}>Stored cat</bdi>
    <svg viewBox="0 0 120 64" aria-hidden="true">
      <path d="M3 32H36L106 10M36 32L106 54M97 4l10 6-10 7M97 47l10 7-10 7" />
    </svg>
    <div>
      <Pieces tokens={["cat"]} traced />
      <Pieces tokens={["cat", "s"]} traced />
    </div>
  </div>
  <p className="flow-note">The same literal piece keeps its hue across dictionaries and messages; hues do not assign distinct IDs or show similarity. One stored cat is reused in two words. Hand-chosen longest match within each word; spaces are excluded. Adding cat here is not one BPE merge.</p>
</Drawing>;
}
export function VocabularyCoverageFigure() {
  return <Drawing id="vocabulary-coverage" label="Two Chinese characters align with six UTF-8 bytes and three possible segmentations">
  <div className="vocabulary-coverage-groups">
    {[0, 1].map(index => <div key={index}>
      <bdi className="vocabulary-input-char">猫</bdi>
      <span>U+732B</span>
      <svg viewBox="0 0 120 30" aria-hidden="true">
        <path d="M60 1v12M15 13h90M15 13v14M60 13v14M105 13v14" />
      </svg>
      <div className="vocabulary-byte-group">
        {["E7", "8C", "AB"].map(byte => <span key={byte}>
          {byte}
        </span>)}
      </div>
    </div>)}
  </div>
  {[["Byte pieces: 6", ["E7", "8C", "AB", "E7", "8C", "AB"]], ["Character pieces: 2", ["猫", "猫"]], ["Hypothetical whole-string piece: 1", ["猫猫"]]].map(([label, tokens]) => <div className="vocabulary-coverage-row" key={label}>
    <span>
      {label}
    </span>
    <Pieces tokens={tokens} />
  </div>)}
  <p className="flow-note">Every row joins and decodes to 猫猫. Byte labels are hexadecimal; token boundaries count model positions.</p>
</Drawing>;
}
export function VocabularyFertilityFigure() {
  return <Drawing id="vocabulary-fertility" label="Three pieces for two words, one split word">
  <div className="vocabulary-word-groups">
    <WordPieces word="cat" tokens={["cat"]} />
    <WordPieces word="cats" tokens={["cat", "s"]} />
  </div>
  <div className="vocabulary-arithmetic">
    <span>Pieces: 1+2=3</span>
    <span>Words: 2</span>
    <strong>3÷2=1.5 pieces/word</strong>
    <span>Split words: 1÷2=50%</span>
  </div>
</Drawing>;
}
export function VocabularyParallelFigure() {
  return <Drawing id="vocabulary-parallel-denominators" label="Twelve versus eighteen model positions, eight versus six counted words">
  {[["Reference", 12, 8], ["Translation", 18, 6]].map(([name, tokens, words]) => <div className="vocabulary-parallel-row" key={name}>
    <span>
      {name}: 
      {tokens} positions
    </span>
    <div className="vocabulary-position-cells" aria-hidden="true">
      {Array.from({
          length: tokens
        }, (_, i) => <i key={i} />)}
    </div>
    <span>
      {words} counted words
    </span>
  </div>)}
  <p className="flow-note">Each equal-sized cell is one position. Constructed matching messages; word counts use the declared rules.</p>
</Drawing>;
}
export function VocabularySamplingFigure() {
  return <Drawing id="vocabulary-sampling-steps" label="Nine-to-one weights become three-to-one after square roots, then seventy-five and twenty-five percent shares">
  <div className="vocabulary-sampling-operation">
    <div>
      <span>Starting A=9, B=1</span>
      <div className="vocabulary-dot-line">
        {Array.from({
            length: 9
          }, (_, i) => <i className="token-identity" style={tokenIdentityStyle("corpus:A")} key={i}>A</i>)}
        <i className="vocabulary-dot-b token-identity" style={tokenIdentityStyle("corpus:B")}>B</i>
      </div>
    </div>
    <Arrow>square root (α=.5)</Arrow>
    <div>
      <span>Transformed A=3, B=1</span>
      <div className="vocabulary-dot-line">
        {[0, 1, 2].map(i => <i className="token-identity" style={tokenIdentityStyle("corpus:A")} key={i}>A</i>)}
        <i className="vocabulary-dot-b token-identity" style={tokenIdentityStyle("corpus:B")}>B</i>
      </div>
    </div>
  </div>
  {[["Original shares", 90], ["Divide by total 4", 75]].map(([label, a]) => <div className="vocabulary-share-strip" key={label}>
    <span>
      {label}
    </span>
    <div>
      <i className="token-identity" style={{
          ...tokenIdentityStyle("corpus:A"),
          backgroundColor: tokenIdentityStyle("corpus:A")["--token-identity-color"],
          color: "#151515",
          width: `${a}%`
        }}>A 
        {a}%
      </i>
      <i className="token-identity" style={{
          ...tokenIdentityStyle("corpus:B"),
          backgroundColor: tokenIdentityStyle("corpus:B")["--token-identity-color"],
          width: `${100 - a}%`
        }} />
    </div>
    <span>B 
      {100 - a}%
    </span>
  </div>)}
  <p className="flow-note">Common 0–100% scale. Exposure shares influence the shared trainer; they do not reserve vocabulary slots.</p>
</Drawing>;
}
function MixtureView({
  masses,
  alpha,
  merges
}) {
  const result = mixtureExperiment(masses, alpha, merges);
  const baseline = mixtureExperiment(masses, 1, merges);
  if (!result) return <p role="status" className="vocabulary-missing">No collection has positive weight. Raise a weight to supply training text.</p>;
  return <>
  <div className="vocabulary-live-shares">
    {result.rows.map((row, index) => <div className="vocabulary-corpus-series" style={corpusStyle(["corpus:english", "corpus:hindi", "corpus:chinese"][index])} key={row.id}>
      <span>
        {row.name}: 
        {format(row.share * 100, 2)}%
      </span>
      <div className="vocabulary-bar-track">
        <span style={{
            width: `${row.share * 100}%`
          }} />
      </div>
      <small>α=1 reference: 
        {format(baseline.shares[index] * 100, 2)}%
      </small>
    </div>)}
  </div>
  <div className="vocabulary-mixture-words">
    {result.rows.map((row, index) => <div className="vocabulary-corpus-series" style={corpusStyle(["corpus:english", "corpus:hindi", "corpus:chinese"][index])} key={row.id}>
      <span>
        {row.name}
      </span>
      {row.pieces.map((piece, wordIndex) => <div className="vocabulary-word" key={piece.word}>
        <bdi className="vocabulary-input-text">
          {piece.word}
        </bdi>
        <span>α=1 reference</span>
        <Pieces tokens={baseline.rows[index].pieces[wordIndex].tokens} />
        <span>Current α=
          {alpha}
        </span>
        <Pieces tokens={piece.tokens} />
      </div>)}
    </div>)}
  </div>
  <div className="vocabulary-merge-sequence" aria-label="Actual learned joins in order">
    {result.model.merges.map((pair, index) => <div className="vocabulary-corpus-series" style={joinCorpusStyle(pair)} key={index}>
      <small>Join 
        {index + 1}
      </small>
      <Pieces tokens={pair} />
      <Arrow>join</Arrow>
      <Pieces tokens={[pair.join("")]} />
    </div>)}
    {!result.model.merges.length && <p>No joins: keep characters and end marker separate.</p>}
  </div>
  <FlowReadout>
    {result.model.merges.length} joins learned. English cat: 
    {result.rows[0].pieces[0].tokens?.length ?? "cannot encode"}; Hindi घर: 
    {result.rows[1].pieces[0].tokens?.length ?? "cannot encode"}. Counts include every end-marker tile.
  </FlowReadout>
</>;
}
export function VocabularyMixtureLab() {
  const [alpha, setAlpha] = useState(.5);
  return <div data-lab="vocabulary-mixture">
  <FlowLab id="vocabulary-mixture" label="How does alpha change actual BPE pieces?">
    <p>Fixed words: cat×8/cats×2; घर×8/घरों×2; 猫×8/猫咪×2. Starting weights 80:15:5; four joins. Each collection has the same 8:2 pattern.</p>
    <MixtureView masses={[80, 15, 5]} alpha={alpha} merges={4} />
    <FlowControls>
      <FlowSlider name="Rebalance α" value={alpha} min={0} max={1} step={.01} onChange={setAlpha} />
      <button type="button" onClick={() => setAlpha(.5)}>Reset α</button>
    </FlowControls>
    <p className="flow-note">Try α=1, then 0. At 1 both displays match. A small change may leave the same winning pair; a crossover changes the join. Share bars use 0–100%.</p>
  </FlowLab>
</div>;
}
export function VocabularyMassLab() {
  const [masses, setMasses] = useState([80, 15, 5]);
  return <div data-lab="vocabulary-masses">
  <FlowLab id="vocabulary-masses" label="Change collection masses with alpha and joins fixed">
    <MixtureView masses={masses} alpha={.5} merges={4} />
    <FlowControls>
      {["English mass", "Hindi mass", "Chinese mass"].map((name, index) => <FlowSlider key={name} name={name} value={masses[index]} min={0} max={100} step={1} onChange={value => setMasses(masses.map((mass, i) => i === index ? value : mass))} />)}
      <button type="button" onClick={() => setMasses([80, 15, 5])}>Reset masses</button>
    </FlowControls>
    <p className="flow-note">α=.5 and four joins stay fixed. Zero excludes a collection; all-zero mass supplies no text. Constructed strings show allocation, not language rankings.</p>
  </FlowLab>
</div>;
}
export function VocabularyJoinsLab() {
  const [merges, setMerges] = useState(4);
  return <div data-lab="vocabulary-joins">
  <FlowLab id="vocabulary-joins" label="Vary only the finite join budget">
    <MixtureView masses={[80, 15, 5]} alpha={.5} merges={merges} />
    <FlowControls>
      <FlowSlider name="Allowed BPE joins" value={merges} min={0} max={16} step={1} onChange={setMerges} />
      <button type="button" onClick={() => setMerges(4)}>Reset joins</button>
    </FlowControls>
    <p className="flow-note">Weights 80:15:5 and α=.5 stay fixed. The α=1 reference has the same allowed joins. Zero joins removes weighting's effect on lengths; pairs may run out before 16.</p>
  </FlowLab>
</div>;
}
export function VocabularyAllocationFigure() {
  return <Drawing id="vocabulary-integer-allocation" label="Twelve sampling slots: floor ten A and one B, then allocate last slot to A">
  <p>Targets: 12×.9=10.8 A; 12×.1=1.2 B.</p>
  <div className="vocabulary-allocation">
    {Array.from({
        length: 12
      }, (_, i) => <span key={i} className={i === 11 ? "vocabulary-missing" : "token-identity"} style={i === 11 ? undefined : tokenIdentityStyle(i < 10 ? "corpus:A" : "corpus:B")}>
      {i < 10 ? "A" : i === 10 ? "B" : "?"}
    </span>)}
  </div>
  <p>Floors: 10 A+1 B=11 assigned. Remainders: .8 A versus .2 B.</p>
  <Arrow>remaining slot goes to A</Arrow>
  <div className="vocabulary-allocation">
    {Array.from({
        length: 12
      }, (_, i) => <span key={i} className={`token-identity${i === 11 ? " vocabulary-traced" : ""}`} style={{ ...tokenIdentityStyle(i === 10 ? "corpus:B" : "corpus:A"), ...(i === 11 ? { borderBottomColor: "#fff" } : {}) }}>
      {i === 10 ? "B" : "A"}
    </span>)}
  </div>
  <p className="flow-note">Final: 11 A,1 B. The white underline marks the extra slot.</p>
</Drawing>;
}
export function VocabularyEmbeddingFigure() {
  return <Drawing id="vocabulary-embedding-rows" label="Cat maps to ID four then row four in a five by three matrix">
  <div className="vocabulary-embedding">
    <div>
      <Pieces tokens={["cat"]} />
      <Arrow>dictionary lookup</Arrow>
      <span className="token-identity vocabulary-identity-label" style={tokenIdentityStyle("cat")}>ID 4</span>
      <Arrow>retrieve row 4</Arrow>
    </div>
    <Matrix />
  </div>
  <p className="flow-note">V=5 rows, d=3 columns: 15 parameters. Row 4 is traced. Values illustrate shape and lookup, not trained semantic features.</p>
</Drawing>;
}
export function VocabularyOutputFigure() {
  const h = [.2, .4, .1];
  const scores = embeddingRows.map(([, ...values]) => values.reduce((sum, value, index) => sum + value * h[index], 0));
  const total = scores.reduce((sum, score) => sum + Math.exp(score), 0);
  return <Drawing id="vocabulary-output-dot-products" label="Same hidden vector scores all five candidate rows">
  <div className="vocabulary-output-path">
    <div>
      <span>Hidden state h</span>
      <div className="vocabulary-vector">
        {h.map((value, i) => <span key={i}>
          {value}
        </span>)}
      </div>
      <svg viewBox="0 0 140 150" aria-hidden="true">
        <path d="M10 75H40M40 15v120M40 15H130M40 45H130M40 75H130M40 105H130M40 135H130" />
      </svg>
      <small>Same h reaches every row</small>
    </div>
    <Matrix />
    <div className="vocabulary-score-rows">
      <span>Logit h·row → probability</span>
      {scores.map((score, i) => <div key={i} className={i === 4 ? "vocabulary-traced" : ""}>
        <bdi className="token-identity vocabulary-identity-label" style={tokenIdentityStyle(embeddingRows[i][0])}>
          {embeddingRows[i][0]}
        </bdi>
        <span>
          {format(score, 2)} → 
          {format(100 * Math.exp(score) / total, 2)}%
        </span>
      </div>)}
    </div>
  </div>
  <p className="flow-note">Cat: .2×.5+.4×.1+.1×.2=.16. Softmax divides each exp(score) by the sum of all five exponentials. This example has no output bias.</p>
</Drawing>;
}
function WorkGrid({
  rows,
  columns,
  label
}) {
  return <div className="vocabulary-work-space">
  <div className="vocabulary-work-grid" style={{
      gridTemplateColumns: `repeat(${columns}, var(--vocabulary-cell-size))`
    }} role="img" aria-label={label}>
    {Array.from({
        length: rows * columns
      }, (_, i) => <span key={i} />)}
  </div>
</div>;
}
export function VocabularyWorkFigure() {
  return <Drawing id="vocabulary-output-attention-work" label="Equal output-score counts and unequal full-attention pairs">
  <div className="vocabulary-work-comparison">
    {[[5, 4], [10, 2]].map(([v, t]) => <div key={v}>
      <p>V=
        {v} choices; T=
        {t} positions
      </p>
      <span>Output: positions×choices</span>
      <WorkGrid rows={t} columns={v} label={`${t} by ${v} output scores`} />
      <strong>
        {t}×
        {v}=
        {t * v} scores
      </strong>
      <p>Attention: positions×positions</p>
      <WorkGrid rows={t} columns={t} label={`${t} by ${t} unrestricted pairs`} />
      <strong>
        {t}×
        {t}=
        {t * t} pairs
      </strong>
    </div>)}
  </div>
  <p className="flow-note">Equal cell size. One score costs d MACs; one attention cell is a position pair per head. No causal mask. Shorter text is an assumed measured outcome, not guaranteed by V.</p>
</Drawing>;
}
function StorageRectangle({
  vocabulary,
  width,
  label
}) {
  return <div className="vocabulary-storage-rectangle">
  <span>
    {label}: V=
    {count(vocabulary)}, d=
    {count(width)}
  </span>
  <div className="vocabulary-storage-space">
    <div style={{
        height: `${vocabulary / 256000 * 10}em`,
        width: `${width / 8192 * 100}%`
      }} />
  </div>
  <span>
    {count(vocabulary * width)} parameters
  </span>
</div>;
}
export function VocabularyStorageLab() {
  const [vocabulary, setVocabulary] = useState(128000);
  const [width, setWidth] = useState(4096);
  const [tied, setTied] = useState(true);
  const result = vocabularyBudget({
    vocabulary,
    width,
    tied,
    baselineTokens: 1000,
    candidateTokens: 750
  });
  return <div data-lab="vocabulary-storage">
  <FlowLab id="vocabulary-storage" label="Table storage under vocabulary, width and tying edits">
    <div className="vocabulary-storage-tables">
      {(tied ? ["Shared table"] : ["Input table", "Output table"]).map(label => <StorageRectangle key={label} label={label} vocabulary={vocabulary} width={width} />)}
    </div>
    <FlowReadout>
      {count(result.parameters)} parameters ×2 bytes = 
      <strong>
        {format(result.mebibytes, 3)} MiB
      </strong>.
    </FlowReadout>
    <FlowControls>
      <FlowSlider name="Vocabulary entries V" value={vocabulary} min={32000} max={256000} step={1000} onChange={setVocabulary} format={count} />
      <FlowSlider name="Values per row d" value={width} min={256} max={8192} step={256} onChange={setWidth} format={count} />
      <label className="vocabulary-checkbox">
        <input type="checkbox" checked={tied} onChange={event => setTied(event.target.checked)} />Tie input/output weights
      </label>
      <button type="button" onClick={() => {
          setVocabulary(128000);
          setWidth(4096);
          setTied(true);
        }}>Reset storage</button>
    </FlowControls>
    <p className="flow-note">Height: 0–256,000 rows; width: 0–8,192 columns. Grid marks abbreviate cells. Untying stores another table; optimizer/gradient storage is additional.</p>
  </FlowLab>
</div>;
}
export function VocabularyBudgetLab() {
  const [vocabulary, setVocabulary] = useState(128000);
  const [candidateTokens, setCandidateTokens] = useState(750);
  const result = vocabularyBudget({
    vocabulary,
    width: 4096,
    tied: true,
    baselineTokens: 1000,
    candidateTokens
  });
  return <div data-lab="vocabulary-budget">
  <FlowLab id="vocabulary-budget" label="Head work versus attention pairs at fixed baseline">
    <div className="vocabulary-budget-bars">
      {[["Head work / baseline", result.headRatio], ["Full-attention pairs / baseline", result.attentionPairRatio]].map(([label, ratio]) => <div key={label}>
        <span>
          {label}: 
          {format(ratio, 4)}×
        </span>
        <div className="vocabulary-ratio-track">
          <i style={{
              width: `${ratio / 16 * 100}%`
            }} />
          <span style={{
              left: `${100 / 16}%`
            }}>1×</span>
        </div>
      </div>)}
    </div>
    <FlowReadout>Candidate head: 
      <strong>
        {count(result.headMacs)} MACs
      </strong>; baseline: 
      {count(result.baselineHeadMacs)}. Candidate pairs: 
      {count(candidateTokens ** 2)}; baseline: 1,000,000.
    </FlowReadout>
    <FlowControls>
      <FlowSlider name="Candidate V" value={vocabulary} min={32000} max={256000} step={1000} onChange={setVocabulary} format={count} />
      <FlowSlider name="Same text: candidate T" value={candidateTokens} min={1} max={2000} step={1} onChange={setCandidateTokens} format={count} />
      <button type="button" onClick={() => {
          setVocabulary(128000);
          setCandidateTokens(750);
        }}>Reset work</button>
    </FlowControls>
    <p className="flow-note">Baseline: V=32,000,T=1,000; fixed d=4,096. Common 0–16× tracks, 1× baseline tick. Try V=64,000,T=500: equal head work, quarter pairs. T is independently measured or hypothetical.</p>
  </FlowLab>
</div>;
}
export function VocabularyNormalizationFigure() {
  return <Drawing id="vocabulary-normalization-loss" label="Two spellings converge under accent stripping">
  <div className="vocabulary-normalization">
    <div>
      <bdi>résumé</bdi>
      <bdi>resume</bdi>
    </div>
    <svg viewBox="0 0 130 90" aria-hidden="true">
      <path d="M3 20L60 45M3 70L60 45H120M111 37l10 8-10 8" />
    </svg>
    <div>
      <span>Strip accents</span>
      <bdi>resume</bdi>
    </div>
  </div>
  <p className="flow-note">Two original spellings reach one output, which cannot identify the original.</p>
</Drawing>;
}
export function VocabularyBoundaryFigure() {
  return <Drawing id="vocabulary-pretokenizer-boundaries" label="Three pretokenized regions block cross-boundary pieces">
  <div className="vocabulary-boundaries">
    {["solar", "-", "panel"].map((text, i) => <div key={text}>
      <span>Region 
        {i + 1}
      </span>
      <div>
        {Array.from(text).map((char, index) => <bdi key={index}>
          {char}
        </bdi>)}
      </div>
      <span>joins inside</span>
    </div>)}
  </div>
  <div className="vocabulary-blocked-piece">
    <span>solar-panel</span>
    <i>×</i>
    <span>crosses cuts: blocked</span>
  </div>
  <p className="flow-note">Constructed punctuation-splitting policy. Dashed cuts are boundaries; all eleven characters remain.</p>
</Drawing>;
}
export function VocabularyCountsFigure() {
  return <Drawing id="vocabulary-shared-word-count" label="Solar combines weighted occurrence contributions from both corpora">
  <div className="vocabulary-counts-branches">
    {[["a", ["solar", "panel", "solar"], ".75", "2/3", ".5"], ["b", ["solar", "cell", "cell"], ".25", "1/3", "1/12"]].map(([name, words, share, fraction, result]) => <div key={name}>
      <span>Collection 
        {name}
      </span>
      <Pieces tokens={words} />
      <span>solar fraction: 
        {fraction}
      </span>
      <Arrow>× share 
        {share}
      </Arrow>
      <output>
        {result}
      </output>
    </div>)}
  </div>
  <div className="vocabulary-converge">
    <svg viewBox="0 0 180 48" aria-hidden="true">
      <path d="M20 1L90 35M160 1L90 35v10" />
    </svg>
    <strong>solar: .5+1/12=7/12≈.583333</strong>
  </div>
  <p className="flow-note">panel=1/4, cell=1/6. Sum 7/12+3/12+2/12=1. Weighted occurrences, not embeddings.</p>
</Drawing>;
}
function DataSheets({
  amount
}) {
  return <div className="vocabulary-data-sheets">
  {["English", "Hindi", "Chinese"].map((language, index) => <div className="vocabulary-corpus-series" style={corpusStyle(["corpus:english", "corpus:hindi", "corpus:chinese"][index])} key={language}>
    <div className="vocabulary-sheet-grid">
      {Array.from({
          length: amount === 100 ? 20 : 10
        }, (_, i) => <i key={i} />)}
    </div>
    <span>
      {language}: 
      {amount} sentences
    </span>
  </div>)}
</div>;
}
export function VocabularyExperimentFigure() {
  return <Drawing id="vocabulary-train-holdout" label="Training feeds four fitting settings; unseen text feeds encoding only">
  <span>Training: 300 distinct sentences</span>
  <DataSheets amount={100} />
  <Arrow>repeat collections; fit four artifacts</Arrow>
  <div className="vocabulary-fit-grid">
    {[[1, 1600], [.5, 1600], [1, 2400], [.5, 2400]].map(([alpha, size]) => <div key={`${alpha}-${size}`}>
      <div className="vocabulary-artifact-grid">
        {Array.from({
            length: 12
          }, (_, i) => <i key={i} />)}
      </div>
      <span>α=
        {alpha}, V=
        {count(size)}
      </span>
      <span>one trained tokenizer</span>
    </div>)}
  </div>
  <div className="vocabulary-heldout-route">
    <DataSheets amount={20} />
    <Arrow>same unseen inputs into all four encoders</Arrow>
    <span className="vocabulary-computed">Four audits: tokens, fallback, roundtrip</span>
  </div>
  <p className="flow-note">Heldout: 60 sentences,20 matched IDs per language. Grid cells abbreviate records; exact counts are labelled. Heldout feeds encoding only, never fitting. No model training.</p>
</Drawing>;
}
export function VocabularyCompatibilityFigure() {
  const rows = [["[UNK]", "e00", "e01", "e02"], ["solar", "e10", "e11", "e12"], ["panel", "e20", "e21", "e22"], ["cost", "e30", "e31", "e32"]];
  return <Drawing id="vocabulary-row-identity" label="Appended fifth row preserves old addresses, wrong ID selects wrong row">
  <div className="vocabulary-migration">
    <div>
      <span>Original table</span>
      <Matrix rows={rows} selected={1} label="Original four rows" />
    </div>
    <Arrow>copy rows; append ID4</Arrow>
    <div>
      <span>Extended table</span>
      <Matrix rows={[...rows, ["photovoltaic", "μ₀", "μ₁", "μ₂"]]} selected={4} label="Five rows; four old rows exact" />
    </div>
  </div>
  <div className="vocabulary-address-drawing">
    <bdi className="token-identity vocabulary-identity-label" style={tokenIdentityStyle("solar")}>solar</bdi>
    <Arrow>original ID1</Arrow>
    <span className="vocabulary-traced vocabulary-identity-label" style={tokenIdentityStyle("solar")}>[e10,e11,e12] solar row</span>
  </div>
  <div className="vocabulary-address-drawing vocabulary-wrong-route">
    <bdi className="token-identity vocabulary-identity-label" style={tokenIdentityStyle("solar")}>solar</bdi>
    <Arrow>wrong replacement ID3</Arrow>
    <span className="vocabulary-identity-label" style={tokenIdentityStyle("cost")}>[e30,e31,e32] cost row</span>
  </div>
  <p className="flow-note">ID addresses a physical row. μ₀, μ₁, μ₂ are the old rows' column means. They initialize the appended row, whose meaning still needs training.</p>
</Drawing>;
}
export function VocabularySoftmaxFigure() {
  return <Drawing id="vocabulary-softmax-expansion" label="Four zero logits yield twenty-five percent each, five yield twenty percent">
  {[4, 5].map(size => <div className="vocabulary-softmax-row" key={size}>
    <span>
      {size} logits: all 0 → exponential sum 
      {size}
    </span>
    <div className="vocabulary-probability-strip">
      {Array.from({
          length: size
        }, (_, i) => <span key={i} style={{
          width: `${100 / size}%`
        }}>ID
        {i}
        <br />
        {100 / size}%
      </span>)}
    </div>
  </div>)}
  <p className="flow-note">Both strips cover 0–100%. Added ID4 takes20%; old scores remain0 while their shares shrink.</p>
</Drawing>;
}
export function MultilingualResultsFigure() {
  return <Drawing id="multilingual-heldout-counts" label="Recorded SentencePiece0.2.2 heldout token totals">
  <div className="vocabulary-results">
    {["English", "Hindi", "Simplified Chinese"].map((language, index) => <div className="vocabulary-corpus-series" style={corpusStyle(["corpus:english", "corpus:hindi", "corpus:chinese"][index])} key={language}>
      <p>
        {language}
      </p>
      {multilingualResults.map(result => <div className="vocabulary-result" key={`${result.alpha}-${result.vocabulary}`}>
        <span>V=
          {count(result.vocabulary)}, α=
          {result.alpha}
        </span>
        <strong>
          {count(result.counts[index])} tokens
        </strong>
        <div className="vocabulary-bar-track">
          <span className={result.alpha === 1 ? "vocabulary-baseline-bar" : ""} style={{
              width: `${result.counts[index] / 2500 * 100}%`
            }} />
        </div>
      </div>)}
    </div>)}
  </div>
  <p className="flow-note">Common 0–2,500 scale. Gray: α=1 reference; each labelled language keeps its hue for α=.5. Recorded CPU run, SentencePiece0.2.2, exact inputs/configuration supplied.</p>
</Drawing>;
}
export function VocabularyRetrievalFigure() {
  return <Drawing id="vocabulary-retrieval-budget" label="Four thousand positions reserve five hundred for template, leaving thirty-five hundred source positions">
  <div className="vocabulary-context-strip">
    <span style={{
        width: "12.5%"
      }} />
    <i style={{
        width: "87.5%"
      }} />
  </div>
  <div className="vocabulary-budget-labels">
    <span>Template+question:500</span>
    <span>Source capacity:3,500</span>
    <span>Total:4,000</span>
  </div>
  {[["Reference source", 3200], ["Translated source", 3800]].map(([label, length]) => <div className="vocabulary-source-capacity" key={label}>
    <span>
      {label}: 
      {count(length)} tokens
    </span>
    <div>
      <i style={{
          width: `${Math.min(length, 3500) / 4000 * 100}%`
        }} />
      <i className="vocabulary-excess" style={{
          width: `${Math.max(0, length - 3500) / 4000 * 100}%`
        }} />
      <b style={{
          left: "87.5%"
        }} />
    </div>
    <span>
      {length > 3500 ? `${length - 3500} over capacity` : `${3500 - length} left`}
    </span>
  </div>)}
  <p className="flow-note">All strips: 0–4,000 positions. White tick: source capacity; dashed excess needs smaller chunks or larger allocation. Constructed counts.</p>
</Drawing>;
}
