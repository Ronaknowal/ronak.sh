import { useId, useState } from "react";
import { NeuralTable, formatNeural as format } from "./NeuralLessonElements.jsx";
import { FlowLab, FlowControls, FlowReadout, FlowSlider } from "./LessonFlow.jsx";
import { SpellingSpans } from "./SubwordStructureFigures.jsx";
import { tokenIdentityStyle } from "./token-identity-colors.js";
import { BPE_END, CLASSIC_BPE_CORPUS, corpusCounts, trainBpe, encodeBpe, wordPieceTrace, validWordPiecePath, unigramPaths } from "../../data/subword-tokenization-models.js";
import "./neural-lesson-neutral.css";
import "./subword-tokenization-lessons.css";

function TokenStrip({ tokens, pair = null }) {
  const selected = tokens.flatMap((token, index) => pair && token === pair[0] && tokens[index + 1] === pair[1] ? [index, index + 1] : []);
  return tokens.length ? <SpellingSpans pieces={tokens} selected={selected} /> : <p className="subword-empty">Empty sequence</p>;
}

function InlineInvestigation({ id, title, children }) {
  return <div data-lab={id}><FlowLab id={id} label={title}>{children}</FlowLab></div>;
}

export function BpeMergeLab() {
  const id = useId();
  const [corpus, setCorpus] = useState(CLASSIC_BPE_CORPUS);
  const [draft, setDraft] = useState(CLASSIC_BPE_CORPUS);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("lowest");
  const model = trainBpe(corpusCounts(corpus), 20);
  const activeStep = Math.min(step, model.merges.length);
  const state = model.states[activeStep];
  const previous = model.states[Math.max(0, activeStep - 1)];
  const nextPair = state.pairs[0];
  const unseen = [...new Set([...query].filter(char => !model.alphabet.includes(char)))];
  const queryError = query.includes(BPE_END) ? "Reserved end marker in input." : /\s/u.test(query)
    ? "Enter one word without whitespace." : unseen.length ? `Unseen characters: ${unseen.join(", ")}. No IDs are invented.` : "";
  const queryTokens = query && !queryError ? encodeBpe(query, model.merges.slice(0, activeStep)) : [];
  const vocabularySize = new Set([...model.alphabet, ...model.merges.slice(0, activeStep).map(pair => pair.join(""))]).size;

  function editCorpus(value) {
    setDraft(value);
    try {
      corpusCounts(value);
      setCorpus(value);
      setError("");
    } catch (cause) {
      setError(cause.message);
    }
  }

  function reset() {
    setCorpus(CLASSIC_BPE_CORPUS);
    setDraft(CLASSIC_BPE_CORPUS);
    setError("");
    setStep(0);
    setQuery("lowest");
  }

  return <InlineInvestigation id="bpe-merge-trainer" title="Build a vocabulary, one merge at a time">
    <figure data-figure="bpe-word-segments" className="subword-figure">
      {state.words.length ? state.words.map(row => <div className="subword-word-row" key={row.word}>
        <strong>{row.word} × {row.count}</strong><TokenStrip tokens={row.tokens} pair={nextPair?.pair} />
      </div>) : <p>The corpus is empty: no words, counts or learned pieces.</p>}
      <figcaption>{nextPair ? `White outlines trace next pair ${nextPair.pair.join(" + ")} (weighted count ${format(nextPair.count)}).` : "No adjacent pairs remain."}</figcaption>
    </figure>
    <FlowControls>
      <FlowSlider name="Completed merges" value={activeStep} min={0} max={model.merges.length} step={1} onChange={setStep} />
      <button type="button" onClick={() => editCorpus("aaaa aaaa")}>Explore overlapping pairs</button>
      <button type="button" onClick={reset}>Reset corpus and query</button>
      <label className="subword-text-control" htmlFor={`${id}-corpus`}>Training corpus
        <textarea id={`${id}-corpus`} value={draft} onChange={event => editCorpus(event.target.value)} rows={3} aria-invalid={Boolean(error)} aria-describedby={`${id}-corpus-help`} />
      </label>
    </FlowControls>
    <p id={`${id}-corpus-help`} className="subword-help">Up to 600 Unicode characters, 24 distinct words and 32 characters per word. At most 20 merges are computed in this browser investigation.</p>
    {error && <p role="alert">{error} The diagram still uses the last valid corpus.</p>}
    <FlowReadout><strong>{activeStep === 0 ? "Initial character state" : `Last merge: ${state.merge.join(" + ")}`}</strong>
      {activeStep > 0 && `; selected pair count ${format(state.selectedCount)}, actual replacements ${format(previous.totalSymbols - state.totalSymbols)}.`}
      {` Total pieces ${format(state.totalSymbols)} from ${format(model.states[0].totalSymbols)} initially, including end markers. Dictionary entries: ${vocabularySize}.`}
    </FlowReadout>
    <NeuralTable caption="Which neighbors occur most often? Equal counts follow the fixed spelling order explained above."
      headers={["Neighboring pieces", "Occurrences in the training text"]} rows={state.pairs.slice(0, 8).map(row => [row.pair.join(" + "), format(row.count)])} />
    {state.pairs.length > 8 && <p>{state.pairs.length - 8} further candidates have lower priority.</p>}
    <figure className="subword-figure" data-figure="bpe-query-pieces">
      {queryError ? <p role="status">{queryError}</p> : <TokenStrip tokens={queryTokens} />}
      <figcaption>New-word encoding under the current saved-rule prefix.</figcaption>
    </figure>
    <FlowControls><label className="subword-text-control" htmlFor={`${id}-query`}>Encode a new word
      <input id={`${id}-query`} value={query} maxLength={64} onChange={event => setQuery([...event.target.value].slice(0, 32).join(""))} aria-invalid={Boolean(queryError)} />
    </label></FlowControls>
    <p>The word above uses the rules learned so far. Editing it does not teach the tokenizer new rules. With the original corpus and query, five merges turn lowest into low + est&lt;/w&gt;. Reset restores that example.</p>
    <NeuralTable caption="Learned merge ranks used by the query" headers={["Rank", "Learned pair"]}
      rows={model.merges.slice(0, activeStep).map((pair, rank) => [rank, pair.join(" + ")])} />
  </InlineInvestigation>;
}

const WORDPIECE_VOCABULARY = "a, ab, ##b, ##bc, ##c";

export function WordPieceLab() {
  const id = useId();
  const [word, setWord] = useState("abc");
  const [draft, setDraft] = useState(WORDPIECE_VOCABULARY);
  const [vocabulary, setVocabulary] = useState(WORDPIECE_VOCABULARY.split(", "));
  const [error, setError] = useState("");
  const result = wordPieceTrace(word, vocabulary);
  const alternative = validWordPiecePath(word, vocabulary);

  function editVocabulary(value) {
    setDraft(value);
    const tokens = value.split(/[,\s]+/u).filter(Boolean);
    if (tokens.length > 24 || tokens.some(token => [...token].length > 16 || token === "##")) {
      setError("Use at most 24 pieces, each at most 16 characters; ## alone is not a piece. The last valid vocabulary remains active.");
    } else {
      setVocabulary([...new Set(tokens)]);
      setError("");
    }
  }

  function reset() {
    setWord("abc");
    editVocabulary(WORDPIECE_VOCABULARY);
  }

  return <InlineInvestigation id="wordpiece-greedy-path" title="Where a greedy path commits">
    <figure className="subword-figure" data-figure="wordpiece-path">
      <span className="subword-figure-label">Input spelling</span><SpellingSpans pieces={word ? [word] : []} kind="input" />
      <span className="subword-figure-label">Greedy output</span><TokenStrip tokens={result.tokens} />
      {result.steps.map((step, i) => <div className="subword-greedy-step" key={i}><span>Position {step.start}</span><span>→</span><code className={step.selected ? "token-identity" : "is-missing"} style={step.selected ? tokenIdentityStyle(step.selected.replace(/^##/u, "")) : undefined}>{step.selected || "failure"}</code></div>)}
      <figcaption>{result.failed ? "A suffix failed, so the entire word becomes [UNK]. Earlier attempted pieces are discarded." : "Each chosen piece reaches a valid next position."}</figcaption>
    </figure>
    <FlowControls>
      <label className="subword-text-control" htmlFor={`${id}-word`}>Word to encode
        <input id={`${id}-word`} value={word} maxLength={64} onChange={event => setWord([...event.target.value].slice(0, 32).join(""))} />
      </label>
      <label className="subword-text-control" htmlFor={`${id}-vocabulary`}>Vocabulary pieces (comma separated)
        <textarea id={`${id}-vocabulary`} rows={2} value={draft} onChange={event => editVocabulary(event.target.value)} aria-invalid={Boolean(error)} />
      </label>
      <button type="button" onClick={() => editVocabulary("a, ab, ##b, ##bc")}>Remove ##c</button>
      <button type="button" onClick={reset}>Reset word and vocabulary</button>
    </FlowControls>
    {error && <p role="alert">{error}</p>}
    <NeuralTable caption="Greedy decisions, including a failed attempt" headers={["Start position", "Remaining spelling", "Valid candidates", "Committed piece"]}
      rows={result.steps.map(step => [step.start, step.remaining, step.matches.map(match => match.token).join(", ") || "None", step.selected || "Failure → whole-word [UNK]"])} />
    <p><strong>Does any complete vocabulary path exist?</strong> {alternative === null ? "No." : alternative.length ? alternative.join(" | ") : "Empty input needs no pieces."}</p>
    <p>{result.failed && alternative ? "A valid alternative exists, but finding it requires revisiting the greedy choice. WordPiece does not perform that search." : result.failed ? "The available pieces cannot spell this input under the start/continuation rules." : "Here greedy commitment reaches a complete path. A different vocabulary can change that."}</p>
  </InlineInvestigation>;
}

export function UnigramLatticeLab() {
  const id = useId();
  const [percent, setPercent] = useState(60);
  const [includeWhole, setIncludeWhole] = useState(true);
  const model = unigramPaths(percent / 100, includeWhole);
  const paths = [
    ...(includeWhole ? [{ name: "ab", weight: model.whole, posterior: model.wholePosterior }] : []),
    { name: "a | b", weight: model.split, posterior: model.splitPosterior },
  ];
  return <InlineInvestigation id="unigram-segmentation-lattice" title="One spelling, competing probability paths">
    <figure className="subword-figure" data-figure="unigram-position-lattice">
      <svg className="subword-lattice" viewBox="0 0 340 180" role="img" aria-label={`The a edge goes from position 0 to 1, b from 1 to 2.${includeWhole ? " The ab edge goes directly from 0 to 2." : " The ab edge is absent."} Exact path weights appear below.`}>
        {includeWhole && <><path d="M 35 115 Q 170 -15 305 115" fill="none" stroke="#e4b752" strokeWidth="2" className="subword-piece-edge" style={tokenIdentityStyle("ab")} /><text x="170" y="29" textAnchor="middle" className="token-identity-text" style={tokenIdentityStyle("ab")}>ab</text></>}
        <line x1="35" y1="115" x2="170" y2="115" stroke="#b58b45" strokeWidth="2" className="subword-piece-edge" style={tokenIdentityStyle("a")} />
        <line x1="170" y1="115" x2="305" y2="115" stroke="#b58b45" strokeWidth="2" className="subword-piece-edge" style={tokenIdentityStyle("b")} />
        <text x="102" y="103" textAnchor="middle" className="token-identity-text" style={tokenIdentityStyle("a")}>a</text><text x="238" y="103" textAnchor="middle" className="token-identity-text" style={tokenIdentityStyle("b")}>b</text>
        {[35, 170, 305].map((x, index) => <g key={index}><circle cx={x} cy="115" r="5" fill="#e9e9e9" /><text x={x} y="145" textAnchor="middle">{index}</text></g>)}
      </svg>
      {paths.map(path => <div className="subword-path-mass" key={path.name}>
        <strong>{path.name}: weight {format(path.weight, 6)}</strong>
        <div className="subword-mass-track"><span style={{ width: `${path.posterior * 100}%` }} /></div>
        <span>{format(path.posterior * 100, 4)}% share among the ways to spell ab (posterior)</span>
      </div>)}
      <figcaption>Positions lie between letters; edges spell the letters they cover. Bars share a 0–100% scale.</figcaption>
    </figure>
    <FlowControls>
      {includeWhole && <FlowSlider name="Whole-piece probability (%)" value={percent} min={1} max={99} step={1} onChange={setPercent} />}
      <label className="subword-checkbox" htmlFor={`${id}-whole`}><input type="checkbox" id={`${id}-whole`} checked={includeWhole} onChange={event => setIncludeWhole(event.target.checked)} />Include ab in the vocabulary</label>
      <button type="button" onClick={() => { setPercent(60); setIncludeWhole(true); }}>Reset probabilities and vocabulary</button>
    </FlowControls>
    <FlowReadout>p(a) = p(b) = {format(model.single)}; {includeWhole ? `p(ab) = ${format(model.whole)}.` : "ab is absent. Only the split path remains."}
      {` Total path weight ${format(model.mass, 6)}. Best segmentation: `}<strong>{model.best.join(" | ")}</strong>.
    </FlowReadout>
  </InlineInvestigation>;
}
