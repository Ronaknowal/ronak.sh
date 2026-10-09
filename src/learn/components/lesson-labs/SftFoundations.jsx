import { useState } from 'react';
import data from '../../data/sft-runtime-data.json';
import { roles, conditionalUpdate, contextTrace, selectedLoss, softmax } from '../../data/sft-models.js';
import { Figure, Controls, Select, Range, Check, Scroll, Lanes, Bars, Decoder, SftTable, fmt, vec } from './SftFlowShared.jsx';

const tokenNames = ['BOS', 'user', 'q', 'assistant', 'yes', 'EOS', 'no'];
const link = slug => `/learn/path/full-curriculum/${slug}?module=large-language-models`;

export function SftUpdate() {
  const [target, setTarget] = useState(4);
  const [rate, setRate] = useState(.5);
  const trace = conditionalUpdate(target, rate);
  return <Figure id="S01" caption="The decoder drawing shows unchanged architecture. The bars compute an explicit two-row conditional-logit fixture; this direct logit update illustrates the objective, not the fitted Pythia model.">
    <p className="sft-prompt">Prompt: user asks q → demonstrated answer {tokenNames[target]} → EOS</p>
    <div className="sft-comparison">
      <div><Decoder label="Before: fixed initial parameters" /><Bars names={tokenNames} values={trace.before[0]} selected={target} label="Initial first-answer distribution" />
        <p>p(EOS | gold answer) = {fmt(trace.before[1][5])}; mean NLL {fmt(trace.beforeLoss)}</p></div>
      <div><Decoder label="After: updated parameters" changed /><Bars names={tokenNames} values={trace.after[0]} selected={target} label="Updated first-answer distribution" />
        <p>p(EOS | gold answer) = {fmt(trace.after[1][5])}; mean NLL {fmt(trace.afterLoss)}</p></div>
    </div>
    <p className="sft-backward">Two target losses → dlogit = (p − one-hot target) / 2 → logit − rate × dlogit</p>
    <Controls reset={() => { setTarget(4); setRate(.5); }}>
      <Select label="Demonstrated answer" value={target} options={[[4, 'yes'], [6, 'no']]} onChange={value => setTarget(Number(value))} />
      <Range label="Illustrative SGD rate" value={rate} min={0} max={1} onChange={setRate} />
    </Controls>
  </Figure>;
}

export function SftChoices() {
  const [adapter, setAdapter] = useState(false);
  return <Figure id="S02" caption="Each row answers a different question. Restricting the parameters does not by itself alter the target mask or create a preference objective.">
    <div className="sft-choice-map">
      <div><b style={{ color: roles.tool }}>Source</b><span>Human reads verse</span><span>→ label: positive</span></div>
      <div><b style={{ color: roles.answer }}>Objective</b><span>answer / EOS positions</span><span>→ selected log probabilities</span></div>
      <div><b style={{ color: roles.gradient }}>Parameters</b><div className="sft-weight-grid" aria-label={adapter ? 'Frozen base matrix and a small trainable adapter' : 'All entries of the base matrix are trainable'}>
        {Array.from({ length: 24 }, (_, i) => <i key={i} style={{ background: adapter ? '#555b65' : roles.gradient }} />)}
        {adapter && <span className="sft-adapter">+ A × B<br />trainable</span>}
      </div><span>{adapter ? 'Frozen base + adapter matrices' : 'Every pretrained matrix updated'}</span></div>
      <div><b style={{ color: roles.prompt }}>Inference</b><span>Same literal verse prompt</span><span>→ model emits response</span></div>
    </div>
    <Controls><Check label="Use a separate adapter branch" checked={adapter} onChange={setAdapter} /></Controls>
    <p><a href={link('synthetic-data-generation-for-pre-training')}>Generated targets</a> change data origin. A <a href={link('dpo-direct-preference-optimization')}>preferred/rejected pair</a> supplies a different objective contract.</p>
  </Figure>;
}

export function SftSerialization() {
  const [verse, setVerse] = useState('The morning brings a gentle light.');
  const [label, setLabel] = useState('positive');
  const prompt = `Classify the verse sentiment as negative, no impact, or positive.\nVerse: ${verse}\nAnswer:`;
  return <Figure id="S03" caption="This editable verse is a constructed record, demo-A. Its label and text are separate fields. The rendered text is exact; these word lanes are not Pythia token IDs.">
    <div className="sft-source-fields"><b>demo-A</b><dl><dt>verse</dt><dd>{verse || '(empty verse)'}</dd><dt>raw label</dt><dd>{({ negative: -1, 'no impact': 0, positive: 1 })[label]}</dd><dt>named label</dt><dd>{label}</dd></dl></div>
    <p className="sft-arrow">Fields fill the literal template ↓</p>
    <pre className="sft-text-view">{prompt}</pre>
    <Lanes rows={[{ name: 'Response text', values: ['leading space', label, 'EOS'], colors: [roles.answer, roles.answer, roles.boundary] }]} />
    <Controls reset={() => { setVerse('The morning brings a gentle light.'); setLabel('positive'); }}>
      <label className="sft-control sft-control-wide"><span>Constructed verse</span><textarea value={verse} rows={2} maxLength={180} onChange={event => setVerse(event.target.value)} /></label>
      <Select label="Annotation" value={label} options={['negative', 'no impact', 'positive'].map(value => [value, value])} onChange={setLabel} />
    </Controls>
  </Figure>;
}

export function SftFamilies() {
  const [leak, setLeak] = useState(true);
  const [repair, setRepair] = useState(false);
  const positions = [repair ? 325 : 70, repair ? 325 : 70, repair || leak ? 325 : 70, 560, 560];
  const names = ['A original', 'A rewrite', 'A translation', 'B original', 'B rewrite'];
  return <Figure id="S04" caption="Colored circles encode source family; columns encode the split. A derived record crossing a split retains its family relation. The poem TSV has no poem-level parent IDs, so this stronger check cannot be inferred from its row IDs.">
    <Scroll label="Family graph across train, development and test">
      <svg className="sft-wide-svg" viewBox="0 0 690 330" role="img" aria-label={repair ? 'All A records moved to development' : leak ? 'Family A crosses training and development' : 'Family A stays in training'}>
        {['Train', 'Development', 'Test'].map((name, i) => <g key={name}>
          <text x={70 + i * 245} y="25" textAnchor="middle">{name}</text>
          <path d={`M${180 + i * 245} 42 V310`} stroke="#50535d" strokeDasharray="4 5" />
        </g>)}
        {[1, 2, 4].map(i => <path key={i} d={`M${positions[i === 4 ? 3 : 0]} ${i === 4 ? 235 : 80} L${positions[i]} ${[80, 140, 200, 235, 295][i]}`}
          stroke={i === 4 ? roles.tool : roles.prompt} strokeWidth="2" fill="none" />)}
        {names.map((name, i) => <g key={name} transform={`translate(${positions[i]},${[80, 140, 200, 235, 295][i]})`}>
          <circle r="8" fill={i < 3 ? roles.prompt : roles.tool} />
          <text x="15" y="5">{name}</text>
        </g>)}
      </svg>
    </Scroll>
    <p>{repair ? 'Whole family A assigned to development; independent training data must now replace it.' : leak ? 'A translation leaks family A across train/development.' : 'Family A is wholly within training.'}</p>
    <Controls reset={() => { setLeak(true); setRepair(false); }}>
      <Check label="Move A translation to development" checked={leak} onChange={value => { setLeak(value); setRepair(false); }} />
      <button type="button" onClick={() => { setRepair(true); setLeak(true); }}>Repair by assigning all A to development</button>
    </Controls>
  </Figure>;
}

export function SftShift() {
  const [long, setLong] = useState(false);
  const tokens = ['BOS', 'user', 'q', 'assistant', 'yes', ...(long ? ['indeed'] : []), 'EOS'];
  const colors = tokens.map((token, j) => token === 'EOS' || token === 'BOS' ? roles.boundary : j >= 4 ? roles.answer : roles.prompt);
  return <Figure id="S05" caption="Columns align by storage position. Every selected target at j uses the logit at j−1. The last input has a logit but no following token in this example.">
    <Lanes rows={[
      { name: 'Position j', values: tokens.map((_, j) => j) },
      { name: 'Input xⱼ', values: tokens, colors },
      { name: 'Aligned label', values: tokens.map((token, j) => j < 4 ? '−100' : token), colors },
      { name: 'Prediction from', values: tokens.map((_, j) => j < 4 ? 'ignored' : `logit ${j - 1}`), colors },
    ]} />
    <Scroll label="One-step diagonal prediction arrows" start="right"><svg className="sft-shift-svg" viewBox={`0 0 ${tokens.length * 94} 140`} role="img" aria-label="Each selected logit points diagonally to the next token position">
      {tokens.map((token, j) => <g key={j}><text x={j * 94 + 44} y="22" textAnchor="middle">z{j}</text>
        <text x={j * 94 + 44} y="126" textAnchor="middle" fill={colors[j]}>{token}</text>
        {j >= 3 && j < tokens.length - 1 && <path d={`M${j * 94 + 44} 35 L${(j + 1) * 94 + 44} 103 l-12 -5 m12 5 l-3 -13`} stroke={roles.answer} strokeWidth="2" fill="none" />}
      </g>)}
    </svg></Scroll>
    <Controls><Check label="Use the longer answer: yes indeed" checked={long} onChange={setLong} /></Controls>
  </Figure>;
}

export function SftLoss() {
  const [answer, setAnswer] = useState(.5);
  const [eos, setEos] = useState(.25);
  const [owned, setOwned] = useState('both');
  const trace = selectedLoss([answer, eos], [owned === 'both' || owned === 'answer', owned === 'both']);
  return <Figure id="S06" caption="Each selected term is −log of the target probability. A zero denominator is an invalid objective, not a zero-loss success.">
    <div className="sft-loss-tree">
      <div className="sft-two-terms">{trace.terms.map((term, i) => <div key={i} className="sft-loss-term" data-muted={!term.selected || undefined}>
        <span>{i ? 'EOS' : 'answer'}: p = {fmt(term.p)}</span><span>↓ −log</span><strong>{fmt(term.nll, 6)}</strong><span>{term.selected ? 'selected' : 'ignored'}</span>
      </div>)}</div>
      <div className="sft-converge" aria-hidden="true" /><p>Selected sum = <b>{fmt(trace.numerator, 6)}</b></p>
      <p>÷ selected count <b>{trace.count}</b></p><output className="sft-result">{trace.count ? `Mean NLL = ${fmt(trace.mean, 6)}` : 'Invalid: no selected targets'}</output>
    </div>
    <Controls reset={() => { setAnswer(.5); setEos(.25); setOwned('both'); }}>
      <Range label="Answer probability" value={answer} min={.05} max={1} onChange={setAnswer} />
      <Range label="EOS probability" value={eos} min={.05} max={1} onChange={setEos} />
      <Select label="Target ownership" value={owned} options={[["both", 'Answer and EOS'], ['answer', 'Answer only'], ['none', 'None: invalid batch']]} onChange={setOwned} />
    </Controls>
  </Figure>;
}

export function SftPromptCredit() {
  const [visible, setVisible] = useState(true);
  const [full, setFull] = useState(false);
  const fixture = data.context_fixture;
  const graph = fixture.ids.map((_, j) => fixture.ids.map((__, k) => k <= j && (visible || k !== 1 || j === 1)));
  const labels = full ? [-100, ...fixture.ids.slice(1)] : fixture.labels;
  const trace = contextTrace({ ...fixture, labels, visible: graph });
  return <Figure id="S07" caption="Actual manual mean-context fixture: token ID 1 is the user marker. Solid blue paths carry context, pink dashed paths carry credit; target ownership and context visibility are separate decisions. The drawing traces one answer-loss branch; the numeric gradient sums every selected loss term.">
    <Scroll label="Prompt context and backward credit graph"><svg className="sft-wide-svg" viewBox="0 0 690 280" role="img" aria-label={visible ? 'Answer loss backpropagates through the user embedding despite its ignored output loss' : 'Removing the user marker from later context cuts its answer-loss path'}>
      <g fill="none" strokeWidth="2">
        <path d="M90 205 L270 145 L440 85 L610 85" stroke={visible ? roles.prompt : '#555'} strokeDasharray={visible ? undefined : '3 5'} />
        <path d="M90 205 L265 240" stroke={full ? roles.answer : '#666'} />
        {visible && <path d="M600 107 L445 107 L278 168 L99 224" stroke={roles.gradient} strokeDasharray="7 5" />}
      </g>
      {[['E[user]', 90, 205, roles.prompt], ['mean context H₃', 270, 145, roles.prompt], ['logit₃[yes]', 440, 85, roles.answer], ['answer loss', 610, 85, roles.answer]].map(([name,x,y,color]) => <g key={name}>
        <circle cx={x} cy={y} r="10" fill={color} /><text x={x} y={y-23} textAnchor="middle">{name}</text>
      </g>)}
      <text x="270" y="268" textAnchor="middle">{full ? 'user-position output: selected' : 'user-position output: ignored ×'}</text>
      <text x="395" y="199" fill={roles.gradient}>backward through permitted context</text>
    </svg></Scroll>
    <Lanes rows={[
      { name: 'User embedding', values: fixture.embedding[1], colors: Array(3).fill(roles.prompt) },
      { name: 'dE[user]', values: trace.dembedding[1], colors: Array(3).fill(roles.gradient) },
      { name: 'User context weight at z₃', values: [trace.mixing[3][1]] },
    ]} />
    <p>{trace.count} selected targets; mean NLL {fmt(trace.loss, 6)}. The output at the user position predicts q; its direct loss is {full ? 'selected' : 'ignored'}.</p>
    <Controls reset={() => { setVisible(true); setFull(false); }}>
      <Check label="User marker remains visible in later context" checked={visible} onChange={setVisible} />
      <Check label="Select full-sequence targets too" checked={full} onChange={setFull} />
    </Controls>
  </Figure>;
}

export function SftHistories() {
  const [first, setFirst] = useState('no');
  const distributions = { yes: [.1, .15, .75], no: [.3, .5, .2] };
  return <Figure id="S08" caption="A declared lookup fixture isolates history dependence. The same conditional table is used on both paths; its numbers are illustrative, not outputs from the fitted model.">
    <div className="sft-comparison">
      <div><strong>Teacher forcing</strong><div className="sft-history"><span>q</span><b>→</b><span style={{ color: roles.answer }}>gold yes</span><b>→</b><span>predict EOS</span></div>
        <Bars names={['yes', 'no', 'EOS']} values={distributions.yes} selected={2} label="Distribution given gold yes" /></div>
      <div><strong>Inference</strong><div className="sft-history"><span>q</span><b>→</b><span style={{ color: roles.gradient }}>emitted {first}</span><b>→</b><span>new distribution</span></div>
        <Bars names={['yes', 'no', 'EOS']} values={distributions[first]} selected={2} color={roles.gradient} label="Distribution given emitted token" /></div>
    </div>
    <Controls><Select label="First emitted token in fixture" value={first} options={[['no', 'no: differs from demonstration'], ['yes', 'yes: matches demonstration']]} onChange={setFirst} /></Controls>
  </Figure>;
}

export function SftRoles() {
  const [policy, setPolicy] = useState('all');
  const native = data.reports['native-trainer-report.json'].assistant_record;
  const text = ['user', 'blue', 'EOS', 'assistant', 'negative', 'EOS', 'tool', 'red', 'EOS', 'assistant', 'positive', 'EOS'];
  const selected = text.map((_, j) => (policy === 'all' && [4, 5].includes(j)) || [10, 11].includes(j));
  const colors = text.map((token, j) => token === 'EOS' ? roles.boundary : j < 3 ? roles.prompt : j < 6 ? roles.answer : j < 9 ? roles.tool : roles.answer);
  return <Figure id="S09" caption="Actual native template fixture. Role markers and tool content remain valid context. Only assistant content and its EOS belong to this loss policy.">
    <Lanes rows={[
      { name: 'Position', values: text.map((_, j) => j) },
      { name: 'Role / content', values: text, colors, selected },
      { name: 'Actual token ID', values: native.input_ids, colors },
      { name: 'Aligned labels', values: native.input_ids.map((id, j) => selected[j] ? id : '−100'), colors, selected },
    ]} />
    <p>Selected positions {vec(selected.flatMap((value, i) => value ? [i] : []))}; count {selected.filter(Boolean).length}. Outline = loss selected; color = role or boundary.</p>
    <Controls><Select label="Assistant target policy" value={policy} options={[['all', 'All assistant messages'], ['last', 'Last assistant message']]} onChange={setPolicy} /></Controls>
  </Figure>;
}

export function SftBoundary() {
  const [joint, setJoint] = useState(true);
  const row = data.tokenized_record;
  return <Figure id="S10" caption="The small BPE merge and the pinned Pythia prefix check answer the same question: did tokenization preserve the intended boundary? Pythia IDs below are actual stored tokenizer output.">
    <div className="sft-bpe"><div><span>a</span><i>| boundary |</i><span>b</span></div>
      <span className="sft-arrow">↓ {joint ? 'joint merge rank applies' : 'separate tokenization'}</span>
      <div>{joint ? <b className="sft-bpe-merged">[ab] crosses boundary</b> : <><b>[a]</b><i>+</i><b>[b]</b></>}</div>
    </div>
    <Controls><Check label="Tokenize both fragments jointly" checked={joint} onChange={setJoint} /></Controls>
    <p>Actual test record {row.id}: joint IDs start with all {row.boundary} prompt IDs. Completion begins at position {row.boundary}.</p>
    <Lanes rows={[
      { name: 'Position', values: row.ids.map((_, j) => j) },
      { name: 'Joint IDs + EOS', values: row.ids, colors: row.ids.map((_, j) => j < row.boundary ? roles.prompt : j === row.ids.length - 1 ? roles.boundary : roles.answer) },
      { name: 'Prompt prefix', values: row.ids.map((_, j) => j < row.boundary ? row.prompt_ids[j] : '—') },
    ]} />
    <div className="sft-template-traces"><p><b>Training:</b> literal prompt + space + gold label + EOS</p><p><b>Generation:</b> identical literal prompt → model emits the label</p></div>
  </Figure>;
}
