import { useState } from 'react';
import {
  Figure,
  Controls,
  Select,
  Table,
  Status,
  Plot,
  useEvidence,
  EvidenceState,
  colors,
  fmt,
} from './TestTimeShared.jsx';

export function CandidateInspector() {
  const state = useEvidence(),
    [question, setQuestion] = useState(1),
    [seed, setSeed] = useState(29),
    [count, setCount] = useState(8);
  if (!state.data)
    return (
      <Figure id="D14" caption="Saved fixed-model outputs">
        <EvidenceState state={state} />
      </Figure>
    );
  const { detail, questions } = state.data,
    q = questions[question];
  const row = detail.find(
      (r) => r.question_id === q.id && r.seed === seed && r.method === `vote${count}`,
    ),
    greedy = detail.find((r) => r.question_id === q.id && r.method === 'greedy');
  const groups = [...new Set(row.candidates.map((c) => c.answer).filter((a) => a != null))];
  return (
    <Figure
      id="D14"
      caption="Actual recorded CPU outputs from the pinned Flan-T5-small model. Selection uses candidate text; gold joins below the evaluation boundary. Sample colours preserve identity within the current pool."
    >
      <p>
        <strong>Question {question + 1}.</strong> {q.question}
      </p>
      <Table
        headers={['Sample', 'Raw text', 'Numeric group', 'Generated tokens', 'CPU seconds']}
        rows={row.candidates.map((c, i) => [
          <span style={{ color: colors[i] }}>{i + 1}</span>,
          c.text || '(empty)',
          <span className={c.answer != null && c.answer === row.answer ? 'ttc-selected' : ''}>
            {c.answer ?? 'invalid'}
            {c.answer === row.answer && c.answer != null ? ' · selected group' : ''}
          </span>,
          c.generated_tokens,
          fmt(c.cpu_seconds, 4),
        ])}
      />
      <div className="ttc-token-row">
        {groups.map((a) => (
          <span
            className={`ttc-token ${a === row.answer ? 'ttc-selected' : ''}`}
            style={{ '--token-color': '#929aa9' }}
            key={a}
          >
            {a} ←{' '}
            {row.candidates.map((c, i) =>
              c.answer === a ? (
                <span key={i} style={{ color: colors[i] }}>
                  sample {i + 1}{' '}
                </span>
              ) : null,
            )}
          </span>
        ))}
      </div>
      <Status>
        Selected: {row.answer ?? 'abstain'} · total {row.tokens} generated tokens ·{' '}
        {fmt(row.cpu_seconds)} serial CPU seconds. Greedy returned{' '}
        {greedy.candidates[0].text || '(empty)'}, parsed {greedy.answer ?? 'invalid'}, at{' '}
        {greedy.tokens} tokens.
      </Status>
      <hr style={{ border: 0, borderTop: '1px dashed #ffc56b' }} />
      <p>
        Evaluation boundary · gold {row.gold}: sampled selection{' '}
        {row.correct ? '✓ correct' : '× wrong / abstain'}; correct candidate in pool{' '}
        {row.oracle ? 'yes' : 'no'}; greedy {greedy.correct ? '✓ correct' : '× wrong / abstain'}.
      </p>
      <Controls
        reset={() => {
          setQuestion(1);
          setSeed(29);
          setCount(8);
        }}
      >
        <Select
          label="Question"
          value={question}
          options={questions.map((_, i) => [i, String(i + 1)])}
          onChange={(v) => setQuestion(Number(v))}
        />
        <Select
          label="Seed"
          value={seed}
          options={[17, 29, 43].map((v) => [v, String(v)])}
          onChange={(v) => setSeed(Number(v))}
        />
        <Select
          label="Candidates N"
          value={count}
          options={[1, 4, 8].map((v) => [v, String(v)])}
          onChange={(v) => setCount(Number(v))}
        />
      </Controls>
    </Figure>
  );
}
export function OutcomeGrid() {
  const state = useEvidence();
  if (!state.data)
    return (
      <Figure id="D15" caption="Actual question-by-method outcomes">
        <EvidenceState state={state} />
      </Figure>
    );
  const { detail, questions, summary } = state.data;
  function marks(id, method) {
    return detail
      .filter((r) => r.question_id === id && r.method === method)
      .map((r) => (
        <span
          key={r.seed ?? 'greedy'}
          className={`ttc-cell ${r.correct ? 'ttc-selected' : ''}`}
          style={{ color: r.correct ? colors[0] : r.coverage ? colors[2] : '#adb3be' }}
        >
          {r.seed != null ? `${r.seed}: ` : ''}
          {r.correct ? '✓' : r.coverage ? '×' : '∅'}
        </span>
      ));
  }
  return (
    <Figure
      id="D15"
      caption="✓ correct; × wrong numeric answer; ∅ abstain. Sampling cells label seeds 17/29/43; these repeats are not independent questions."
    >
      <Table
        headers={['Question', 'Greedy', 'N = 1', 'N = 4', 'N = 8']}
        rows={questions.map((q, i) => [
          i + 1,
          ...['greedy', 'vote1', 'vote4', 'vote8'].map((m) => marks(q.id, m)),
        ])}
      />
      <Table
        headers={['Method', 'Correct / all trials', 'Parsed / all trials']}
        rows={summary.map((r) => [
          r.method,
          `${Math.round(r.correct * r.question_seed_rows)} / ${r.question_seed_rows}`,
          `${Math.round(r.coverage * r.question_seed_rows)} / ${r.question_seed_rows}`,
        ])}
      />
    </Figure>
  );
}
export function ObservedCost() {
  const state = useEvidence(),
    [metric, setMetric] = useState('tokens');
  if (!state.data)
    return (
      <Figure id="D16" caption="Four observed policy means">
        <EvidenceState state={state} />
      </Figure>
    );
  const rows = state.data.summary,
    label = metric === 'tokens' ? 'Mean generated tokens' : 'Mean serial CPU seconds',
    max = metric === 'tokens' ? 20 : 1;
  return (
    <Figure
      id="D16"
      caption="Four observed policy means, no fitted scaling curve. Only the sampled N=1/4/8 points are connected. The nearby greedy/N=1 coordinates are distinguished by their exact table values."
    >
      <Plot
        xMax={max}
        yMax={5}
        xLabel={label}
        yLabel="Selected accuracy (%)"
        series={[
          { name: 'Greedy', color: colors[2], points: [[rows[0][metric], rows[0].correct * 100]] },
          {
            name: 'Sampled plurality N=1 → 4 → 8',
            color: colors[0],
            line: true,
            points: rows.slice(1).map((r) => [r[metric], r.correct * 100]),
          },
        ]}
      />
      <Table
        headers={['Method', label, 'Accuracy %', 'Question-bootstrap 95% interval %']}
        rows={rows.map((r) => [
          r.method,
          fmt(r[metric], 6),
          fmt(r.correct * 100, 6),
          r.question_bootstrap95.map((x) => fmt(x * 100, 3)).join(' to '),
        ])}
      />
      <Status>
        Sampled accuracy stays at 1/36 while mean token work grows from {fmt(rows[1].tokens)} to{' '}
        {fmt(rows[3].tokens)}. The zero-width greedy interval does not prove population accuracy is
        zero.
      </Status>
      <Controls reset={() => setMetric('tokens')}>
        <Select
          label="Observed cost axis"
          value={metric}
          options={[
            ['tokens', 'Generated tokens'],
            ['cpu_seconds', 'Serial CPU seconds'],
          ]}
          onChange={setMetric}
        />
      </Controls>
    </Figure>
  );
}
