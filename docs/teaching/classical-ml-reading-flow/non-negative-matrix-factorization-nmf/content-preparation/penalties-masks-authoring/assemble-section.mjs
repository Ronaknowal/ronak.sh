import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(directory, '../content-programs/nmf_penalties_masks.py');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const identify = file => {
  const bytes = fs.readFileSync(file);
  return { path: file, bytes: bytes.length, sha256: hash(bytes) };
};
const read = name => fs.readFileSync(path.resolve(directory, name), 'utf8');
const numerical = JSON.parse(read('penalties-masks-checks.json'));
const correction = JSON.parse(read('streamed-loss-correction/streamed-loss-checks.json'));
const conditions = [];
function check(name, result) {
  conditions.push({ name, passed: Boolean(result) });
  if (!result) throw new Error(name);
}
check('original119 scoped checks passed on predecessor', numerical.status === 'PASS_NEW_PENALTIES_MASKS_AND_ONCE_ONLY_MAIN' && numerical.checks.length === 119 && numerical.checks.every(item => item.passed));
check('once-only new main exited0 with unchanged execution inputs', numerical.main.returncode === 0 && numerical.inputs_unchanged);
check('predecessor retained with original source identity', identify(path.resolve(directory, 'streamed-loss-correction/nmf_penalties_masks.before.py')).sha256 === numerical.inputs[0].sha256);
check('original receipt retained byte exactly', identify(path.resolve(directory, 'streamed-loss-correction/checks.before.json')).sha256 === identify(path.resolve(directory, 'penalties-masks-checks.json')).sha256);
for (const input of numerical.inputs.slice(1)) {
  check(`original dependency conserved: ${path.basename(input.path)}`, identify(input.path).sha256 === input.sha256);
}
for (const role of ['stdout', 'stderr']) {
  check(`original ${role} conserved`, identify(numerical.main[role].path).sha256 === numerical.main[role].sha256);
}
check('correction32 pure-loss conditions passed', correction.status === 'PASS_EXACT_STREAMED_LOSS_CORRECTION_NO_FIT_REPLAY' && correction.checks.length === 32 && correction.checks.every(item => item.passed));
for (const input of correction.bindings) {
  check(`correction binding conserved: ${path.basename(input.path)}`, identify(input.path).sha256 === input.sha256);
}
const source = fs.readFileSync(sourcePath, 'utf8');
const before = read('streamed-loss-correction/nmf_penalties_masks.before.py');
const restored = source.replace(/\r\n/g, '\n').replace('    reconstruction, require_finite, stable_norm,', '    reconstruction, require_finite, stable_norm, weighted_half_square,')
  .replace('else masked_data_cost(x, w, h, weights))', 'else weighted_half_square(x, w, h, weights, block_rows))')
  .replace(correction.sourceAddition, '')
  .replace('2 * masked_data_cost(x, w, h, weights) / denominator', '2 * weighted_half_square(x, w, h, weights) / denominator');
check('exact inverse restores whole executed predecessor with universal newline reading', restored === before.replace(/\r\n/g, '\n'));
const templatePath = path.join(directory, 'section-eleven-template.md');
const template = fs.readFileSync(templatePath, 'utf8');
const marker = '<!-- source:nmf_penalties_masks.py -->';
check('one source insertion', template.split(marker).length === 2);
check('one accepted section11 heading', (template.match(/^## /gm) ?? []).length === 1 && template.startsWith('## 11. Control penalties and incomplete observations'));
check('four exact accepted visual jobs', (template.match(/<!-- figure:D(?:38|39|40|41) -->/g) ?? []).length === 4);
for (const [job, text] of [['D38', 'The observed scalar is 2'], ['D39', 'Return to the exact W'], ['D40', 'The row is R0'], ['D41', 'The all-missing row']]) {
  check(`${job} picture before walkthrough`, template.indexOf(`<!-- figure:${job} -->`) < template.indexOf(text));
}
check('source follows all four taught objects', template.indexOf(marker) > template.indexOf('<!-- figure:D41 -->'));
const near = (a, b) => Math.abs(a - b) < 1e-10;
check('scalar linear optimum0/1/3', [0, 1, 3].every((price, index) => Math.max(0, 2-price) === [2, 1, 0][index]));
check('scalar boundary slope at price3', 0 - 2 + 3 === 1);
check('squared penalty optimum', 2 / (1 + 1) === 1);
check('D39 actual scale costs', [[1,5.1],[2,5.85],[.5,5.4]].every(([s,cost]) => near(.3*(3/s+6)+.6*(2*s+2),cost)));
check('D40 fractional actual products', near(1+.25,1.25) && near(2+3*.25,2.75) && near(1+3*.25,1.75));
check('observed-zero/missing/L2 exercise outputs', 2/2 === 1 && 2/1 === 2 && 2/(1+1) === 1);
check('D41 actual zero observations versus undefined quality', template.includes('actual measurements `[0,0,0]`') && 0/3 === 0 && !Number.isFinite(0/0));
const stdout = fs.readFileSync(numerical.main.stdout.path, 'utf8');
check('original scratch count/data/total align with manuscript', stdout.includes('(385, 0.00900556233913971,') && stdout.includes('1.0158005819863103') && template.includes('385 updates') && template.includes('1.01580058'));
check('ordinary recomputed total actual retained', stdout.includes('1.0158005819863003'));
check('masked total and missing row actual retained', stdout.includes('(270, 0.002098482690384905,') && stdout.includes('0.2958182192770571') && stdout.includes('unsupported_row [0.0, 0.0]') && template.includes('270 updates') && template.includes('0.29581822'));
check('actual weighted query and ordinary result retained', stdout.includes('1.7796610170284894') && stdout.includes('0.6779661016508391') && stdout.includes('1.7796610169491525') && template.includes('1.779661017,0.677966102'));
check('actual None/retained-state/empty output retained', stdout.includes('missing_quality None') && stdout.includes('old_dictionary_equal True') && stdout.includes('empty_query_shape (0, 2)'));
check('stderr retained actually empty', fs.readFileSync(numerical.main.stderr.path).length === 0);
check('current loss excludes full mask validation', correction.sourceAddition.includes('def masked_data_cost') && !correction.sourceAddition.includes('observation_weights('));
check('public library routes visible', source.includes('from scipy.optimize import nnls') && source.includes('from sklearn.decomposition import NMF'));
check('all code literal visible and marker consumed', !source.includes('<!-- source:'));
const manuscriptPath = path.join(directory, 'section-eleven.md');
const assembled = template.replace(marker, `\n\`\`\`python\n${source.trimEnd()}\n\`\`\`\n`);
check('complete exact current source embedded', assembled.includes(`\n\`\`\`python\n${source.trimEnd()}\n\`\`\`\n`) && !assembled.includes(marker));
fs.writeFileSync(manuscriptPath, assembled);
fs.writeFileSync(path.join(directory, 'section-eleven-author-checks.json'), JSON.stringify({
  status: 'PASS_SCOPED_SECTION11_COMPOSITION_AND_PROSE', date: new Date().toISOString(), conditions,
  numericalMainReplayed: false,
  qualification: 'Original119/main bind retained executed predecessor;32 pure-loss checks plus exact whole-source inverse support current loss-only correction. No numerical fit/main re-execution here.',
  bindings: [templatePath, sourcePath, manuscriptPath, path.join(directory, 'visual-specifications.md'), path.join(directory, 'README.md'), path.join(directory, 'penalties-masks-checks.json'), path.join(directory, 'streamed-loss-correction/streamed-loss-checks.json'), fileURLToPath(import.meta.url)].map(identify),
  limits: 'Author composition/arithmetic checks only. No native visuals, independent content review or whole-topic acceptance.',
}, null, 2) + '\n');
console.log(JSON.stringify({ conditions: conditions.length, manuscript: identify(manuscriptPath) }));
