import fs from 'node:fs';
import crypto from 'node:crypto';

const root = 'public/learn-code/p-tuning';
const inputs = {};
function read(file) {
  const bytes = fs.readFileSync(`${root}/${file}`);
  inputs[`${root}/${file}`] = crypto.createHash('sha256').update(bytes).digest('hex');
  return file.endsWith('.json') ? JSON.parse(bytes) : bytes.toString('utf8');
}
const summary = read('results/study-summary.json');
const evaluation = read('results/study-evaluation.json');
const preflight = read('results/study-preflight.json');
const records = read('data/test.tsv').trimEnd().split(/\r?\n/).map(line => {
  const [id, verse, label] = line.split('\t');
  return { id: Number(id), verse, label: Number(label) };
});
const exampleIds = [5, 6, 0, 2, 1, 10];
const runs = summary.map(row => {
  const key = `${row.method}-${row.seed}`;
  const completed = read(`results/${key}-complete.json`);
  const initial = read(`results/${key}-initial.json`);
  const results = evaluation.results[key];
  return { ...row, key, history: completed.history, initial,
    confusion: results.generation.confusion,
    examples: exampleIds.map(id => ({ ...records.find(record => record.id === id),
      generation: results.generation.rows.find(record => record.id === id),
      candidate: results.constrained.rows.find(record => record.id === id),
      response: results.response.rows.find(record => record.id === id) })) };
});
const base = evaluation.results.base;
const projection = {
  provenance: 'Exact projection of frozen observations; no fit, model generation or new quality measurement.',
  inputs, runs, initialization: preflight.initialization,
  baseline: { nll: base.response.nll, accuracy: base.generation.accuracy,
    candidateAccuracy: base.constrained.accuracy, macroF1: base.generation.macro_f1,
    valid: base.generation.valid_label_rate, eos: base.generation.eos_stop_rate },
  majority: evaluation.majority,
};
const destination = 'public/learn-assets/p-tuning-soft-prompt-methods';
fs.mkdirSync(destination, { recursive: true });
fs.writeFileSync(`${destination}/observations.json`, `${JSON.stringify(projection, null, 2)}\n`);
console.log(JSON.stringify({ runs: runs.length, boundSources: Object.keys(inputs).length, examples: runs.reduce((total, row) => total + row.examples.length, 0) }));
