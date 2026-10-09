import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(directory, '../content-programs/nmf_initialization.py');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const identify = file => { const bytes = fs.readFileSync(file); return { path: file, bytes: bytes.length, sha256: digest(bytes) }; };
const source = fs.readFileSync(sourcePath, 'utf8');
const templatePath = path.join(directory, 'section-nine-template.md');
const template = fs.readFileSync(templatePath, 'utf8');
const marker = '<!-- source:nmf_initialization.py -->';
const conditions = [];
function check(name, result) {
  conditions.push({ name, passed: Boolean(result) });
  if (!result) throw new Error(name);
}
const receiptPath = path.join(directory, 'initialization-checks.json');
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
check('original numerical receipt completed', receipt.status === 'PASS_NEW_INITIALIZER_AND_ONCE_ONLY_MAIN' && receipt.checks.length === 129 && receipt.checks.every(item => item.passed));
for (const input of receipt.inputs) {
  const current = identify(input.path);
  check(`executed input conserved: ${path.basename(input.path)}`, current.bytes === input.bytes && current.sha256 === input.sha256);
}
for (const role of ['stdout', 'stderr']) {
  const expected = receipt.main[role];
  check(`executed ${role} conserved`, identify(expected.path).sha256 === expected.sha256);
}
check('new main actual exit0', receipt.main.returncode === 0);
check('one complete source marker', template.split(marker).length === 2);
check('four original figure contracts', (template.match(/<!-- figure:D3[1-4] -->/g) ?? []).length === 4);
check('one section heading preserved', (template.match(/^## /gm) ?? []).length === 1);
const assembled = template.replace(marker, `\n\`\`\`python\n${source.trimEnd()}\n\`\`\`\n`);
check('literal full source is visible', assembled.includes(`\n\`\`\`python\n${source.trimEnd()}\n\`\`\`\n`));
check('source marker consumed', !assembled.includes(marker));
check('D31 picture before centered walkthrough', template.indexOf('<!-- figure:D31 -->') < template.indexOf('The left table is our original X0'));
check('D32 picture before signed-term walkthrough', template.indexOf('<!-- figure:D32 -->') < template.indexOf('We temporarily switch from X0'));
check('D33 picture before pair calculation', template.indexOf('<!-- figure:D33 -->') < template.indexOf('At the default setting, u and v'));
check('D34 picture before zero-cell walkthrough', template.indexOf('<!-- figure:D34 -->') < template.indexOf('The unfilled factors have two exact zero entries'));
const near = (a, b) => Math.abs(a - b) < 1e-10;
check('D31 all means recomputed', [0, 1, 2].every(j => near([[2,1,3],[1,3,4],[0,2,2]].reduce((total, row) => total + row[j], 0) / 3, [1,2,3][j])));
check('D32 known term addition recomputed', near(10*.8*.8 + 5*.6*.6, 8.2) && near(10*.8*.6 + 5*.6*(-.8), 2.4) && near(10*.6*.6 + 5*.8*.8, 6.8));
check('D32 rank-one positive part changes rank', 1.8 * 3.2 > 0);
check('retained strength and balanced scaling', near((4 / Math.sqrt(5)) ** 2, 16/5));
check('signed residual half loss recomputed', near((1.8**2 + 2.4**2 + 2.4**2) / 2, 7.38));
check('tie worked transfer strength', near(5*.8*.6, 2.4) && near(5*.6*.8, 2.4));
check('correct mean outside live fill interval', near((8.2+2.4+2.4+6.8)/4, 4.95) && 4.95 > 2);
for (const [index, initial, after] of [[0, '7.380000', '3.287531'], [1, '8.252700', '3.652713'], [2, '38.153002', '12.279289']]) {
  check(`printed D34 losses agree ${index}`, receipt.fill_cases[index].initial_loss.toFixed(6) === initial && receipt.fill_cases[index].after_loss.toFixed(6) === after && template.includes(initial) && template.includes(after));
}
const stdout = fs.readFileSync(receipt.main.stdout.path, 'utf8');
check('ordinary actual10 iterations printed', stdout.includes('ordinary_nndsvda_iterations 10 half_loss 4.630824246410104e-16') && template.includes('4.630824×10⁻¹⁶'));
check('same W-first actual factor correspondence printed', stdout.includes('same_W_first_factor_max_differences 0.0 4.440892098500626e-16') && template.includes('4.44×10⁻¹⁶'));
check('stderr is actually empty', fs.readFileSync(receipt.main.stderr.path).length === 0);
const manuscriptPath = path.join(directory, 'section-nine.md');
fs.writeFileSync(manuscriptPath, assembled);
fs.writeFileSync(path.join(directory, 'section-nine-author-checks.json'), JSON.stringify({
  status: 'PASS_SCOPED_SECTION9_ASSEMBLY_AND_PROSE_CHECKS', date: new Date().toISOString(),
  numericalEvidenceReplayed: false, conditions,
  bindings: [templatePath, sourcePath, receiptPath, manuscriptPath, path.join(directory, 'visual-specifications.md'), fileURLToPath(import.meta.url)].map(identify),
  limits: 'Source composition and targeted prose arithmetic only; not a native diagram, independent review or whole NMF completion.',
}, null, 2) + '\n');
console.log(JSON.stringify({ conditions: conditions.length, manuscript: identify(manuscriptPath) }));
