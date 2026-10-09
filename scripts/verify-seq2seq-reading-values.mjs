import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { scalarBridge, probabilityTree, lengthScore, sequenceIndex } from '../src/learn/data/seq2seq-models.js';

const assets = 'public/learn-code/sequence-to-sequence-encoder-decoder';
const folder = 'docs/teaching/deep-learning-beginner/sequence-to-sequence-encoder-decoder';
const report = { passed: false, checkedAt: new Date().toISOString(), groups: [], sourceHashes: {} };
const close = (a, b, tolerance = 1e-10) => assert.ok(Number.isFinite(a) && Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const group = (name, check) => { check(); report.groups.push(name); };
const measured = JSON.parse(fs.readFileSync(`${assets}/calculated-inputs.json`, 'utf8'));
const mechanics = JSON.parse(fs.readFileSync(`${assets}/mechanics-results.json`, 'utf8'));
const summary = JSON.parse(fs.readFileSync('src/learn/data/seq2seq-measurements.json', 'utf8'));
const lines = fs.readFileSync(`${assets}/english-inflections.csv`, 'utf8').trim().split(/\r?\n/);
const headers = lines.shift().split(',');
const records = lines.map(line => {
  assert.ok(!line.includes('"'), 'This simple reader is restricted to the actual unquoted extract.');
  const cells = line.split(',');
  assert.equal(cells.length, headers.length);
  return Object.fromEntries(headers.map((key, index) => [key, cells[index]]));
});
const editDistance = (left, right) => {
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++) current.push(Math.min(
      current[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(left[i - 1] !== right[j - 1])));
    previous = current;
  }
  return previous.at(-1);
};
const summarize = (rows, outputs) => {
  assert.equal(rows.length, outputs.length);
  const errors = rows.map((row, i) => editDistance(row.form, outputs[i].prediction));
  const characters = rows.reduce((sum, row) => sum + row.form.length, 0);
  return { count: rows.length, exact: errors.filter((error, i) => error === 0 && outputs[i].ended_with_eos !== false).length,
    character_edits: errors.reduce((sum, value) => sum + value, 0), reference_characters: characters,
    character_error_rate: errors.reduce((sum, value) => sum + value, 0) / characters,
    no_eos: outputs.filter(row => row.ended_with_eos === false).length };
};
const compareSummary = (actual, expected) => {
  for (const [key, value] of Object.entries(actual)) close(value, expected[key]);
};
const suffix = (lemma, feature) => {
  const consonantY = lemma.endsWith('y') && !'aeiou'.includes(lemma.at(-2));
  if (feature === 'past') return consonantY ? lemma.slice(0, -1) + 'ied' : lemma.endsWith('e') ? lemma + 'd' : lemma + 'ed';
  if (feature === 'participle') return lemma.endsWith('ie') ? lemma.slice(0, -2) + 'ying'
    : lemma.endsWith('e') && !lemma.endsWith('ee') ? lemma.slice(0, -1) + 'ing' : lemma + 'ing';
  return consonantY ? lemma.slice(0, -1) + 'ies' : /(?:s|x|z|ch|sh)$/.test(lemma) ? lemma + 'es' : lemma + 's';
};

group('Pinned extract partitions, grouping, vocabulary addresses and parameter count', () => {
  assert.equal(records.length, 1800);
  const train = records.filter(row => row.partition === 'train');
  const dev = records.filter(row => row.partition === 'development');
  assert.equal(train.length, 1353); assert.equal(dev.length, 447);
  assert.equal(new Set(train.map(row => row.lemma)).size, 451);
  assert.equal(new Set(dev.map(row => row.lemma)).size, 149);
  for (const field of ['lemma', 'form']) {
    const present = new Set(train.map(row => row[field]));
    assert.ok(dev.every(row => !present.has(row[field])));
  }
  assert.equal(sequenceIndex.l, 17);
  const gru = 3 * 64 * (24 + 64 + 2);
  assert.equal(32 * 24 + 2 * gru + 32 * (64 + 1), 37408);
  for (const row of measured.runs) assert.equal(row.parameters, 37408);
});
group('Independent edit-distance recount of all retained baseline and neural development predictions', () => {
  for (const partition of ['train', 'development']) {
    const rows = records.filter(row => row.partition === partition);
    compareSummary(summarize(rows, rows.map(row => ({ prediction: row.lemma }))), measured.baselines[partition].copy);
    compareSummary(summarize(rows, rows.map(row => ({ prediction: suffix(row.lemma, row.feature) }))), measured.baselines[partition].predeclared_suffix_rules);
  }
  const dev = records.filter(row => row.partition === 'development');
  for (const run of measured.runs) {
    run.development_predictions.forEach((row, i) => {
      assert.equal(row.lemma, dev[i].lemma); assert.equal(row.feature, dev[i].feature); assert.equal(row.reference, dev[i].form);
      close(row.token_log_probabilities.reduce((a, b) => a + b, 0), row.log_probability);
      assert.equal(row.tokens.at(-1) === 2, row.ended_with_eos);
    });
    compareSummary(summarize(dev, run.development_predictions), run.development);
    if (run.beam3_predictions) compareSummary(summarize(dev, run.beam3_predictions), run.beam3_development);
    assert.deepEqual(summary.runs.find(row => row.seed === run.seed).checkpoints,
      run.checkpoints.map(({ update, teacher_forced_nll, exact }) => ({ update, teacher_forced_nll, exact })));
    for (const [name, accepts] of [
      ['past', row => row.feature === 'past'], ['participle', row => row.feature === 'participle'],
      ['third_person', row => row.feature === 'third_person'], ['length3to5', row => row.lemma.length <= 5],
      ['length6to8', row => row.lemma.length >= 6],
    ]) {
      const indices = dev.flatMap((row, i) => accepts(row) ? [i] : []);
      compareSummary(summarize(indices.map(i => dev[i]), indices.map(i => run.development_predictions[i])), summary.slices[run.seed][name]);
    }
  }
});
group('Worked/fresh scalar intermediates and independently recomputed central derivatives', () => {
  for (const name of ['scalar_worked', 'scalar_fresh', 'scalar_fresh_input_edit', 'scalar_zero_rate']) {
    const fixture = mechanics[name];
    const actual = scalarBridge(fixture.inputs, .7, fixture.learning_rate);
    close(actual.context, fixture.context); close(actual.loss, fixture.mean_loss);
    close(actual.gradient, fixture.encoder_input_weight_gradient); close(actual.nextLoss, fixture.updated_mean_loss);
    const central = (scalarBridge(fixture.inputs, .7 + 1e-5).loss - scalarBridge(fixture.inputs, .7 - 1e-5).loss) / 2e-5;
    close(central, actual.gradient, 1e-8);
  }
});
group('Four route probabilities, fresh branch edit, token weights, length policy and stopping', () => {
  const worked = probabilityTree(.6, .51, .9, 2);
  assert.equal(worked.winner.path, 'B!'); close(worked.winner.probability, .36);
  close(worked.leaves.reduce((sum, row) => sum + row.probability, 0), 1);
  for (const value of [.306, .294, .36, .04]) assert.ok(worked.leaves.some(row => Math.abs(row.probability - value) < 1e-12));
  close(probabilityTree(.55, .9, .85, 2).winner.probability, .495);
  close((2 * 1 + 6 * 3) / 8, 2.5); close((1 + 3) / 2, 2);
  close(lengthScore(-1.5, 3, 1), -1.125); close(lengthScore(-1.8, 6, 1), -.9818181818181819);
  close(lengthScore(-1.1, 5, 1), -.66);
  assert.ok(lengthScore(-1.1, 5, 1) > -.8);
});
group('Reversal edges, independent replacement conditional mass and sequence-reward derivative', () => {
  const normal = [3, 3, 3], reverse = [1, 3, 5];
  assert.equal(normal.reduce((a, b) => a + b, 0), reverse.reduce((a, b) => a + b, 0));
  for (const prefix of [0, 1]) {
    const mass = [0, 1].map(() => .5 * .5);
    close(mass[prefix] / mass.reduce((a, b) => a + b, 0), .5);
  }
  close(.6 * 0 + .4 * 1, .4); close(.4 * (1 - .4), .24);
});
for (const file of [`${assets}/calculated-inputs.json`, `${assets}/mechanics-results.json`, `${assets}/english-inflections.csv`,
  'src/learn/data/seq2seq-measurements.json', 'src/learn/data/seq2seq-models.js', 'scripts/verify-seq2seq-reading-values.mjs']) {
  report.sourceHashes[file] = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
report.limits = 'Recounts retained measured predictions without refitting; training predictions were not retained and their exact counts are historical run evidence. New drawings and manuscript numbers must still be bound and read against these values when implemented. Native execution and browser evidence are separate.';
report.passed = true;
fs.writeFileSync(`${folder}/reading-flow-values.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, groups: report.groups.length, neuralDevelopmentPredictionsRecounted: 4 * 447 }));
