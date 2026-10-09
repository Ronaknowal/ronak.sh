// Execute the existing meaningful model checks with current native references.
// Historical verifiers and their receipts remain byte-for-byte untouched.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
const folder = 'docs/teaching/deep-learning-beginner/convnext-modern-cnn-designs';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const jobs = [
  ['scripts/verify-convnext-models.mjs', 'convnext-models.json', 'reading-flow-models.json'],
  ['scripts/verify-convnext-independent.mjs', 'convnext-independent.json', 'reading-flow-independent-models.json'],
];
for (const [file, previous, output] of jobs) {
  let source = fs.readFileSync(file, 'utf8');
  source = source.replaceAll('docs/teaching/evidence/convnext-native.json', `${folder}/reading-flow-native.json`)
    .replaceAll('docs/teaching/evidence/convnext-independent-native.json', `${folder}/reading-flow-independent-native.json`)
    .replaceAll(`docs/teaching/evidence/${previous}`, `${folder}/${output}`)
    .replace(/from (['"])(\.\.\/[^'"]+)\1/g, (_match, quote, target) => `from ${quote}${pathToFileURL(path.resolve(path.dirname(file), target)).href}${quote}`);
  // Suppress only the huge console receipt; assertions and disk evidence are unchanged.
  source = source.replace('console.log(JSON.stringify(report,null,2));', '');
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const reportPath = `${folder}/${output}`;
  const report = JSON.parse(fs.readFileSync(reportPath));
  report.executionWrapper = {
    path: 'scripts/verify-convnext-flow-models.mjs', sha256: hash('scripts/verify-convnext-flow-models.mjs'),
    originalVerifier: file, originalVerifierSha256: hash(file),
    changes: 'Native-reference and receipt path redirection, absolute imports, suppressed console serialization only',
  };
  if (report.reviewer) report.reviewer = 'Parent integration replay of previously independent numerical checks; new independent source review is reading-flow-review.md';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, receipt: reportPath, checks: (report.checks || report.groups).length }));
}
