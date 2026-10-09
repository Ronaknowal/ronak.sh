// Keep this revision's loading receipt without replacing prior scratch evidence.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const sharedReceipt = 'scratch/learning-performance/load-boundaries.json';
const output = 'docs/teaching/deep-learning-beginner/convnext-modern-cnn-designs/reading-flow-loading.json';
const original = fs.existsSync(sharedReceipt) ? fs.readFileSync(sharedReceipt) : null;
const hash = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
try {
  execFileSync(process.execPath, ['scripts/verify-learning-load-boundaries.cjs', '--topics', 'convnext-modern-cnn-designs,depthwise-separable-dilated-convolutions'], {
    stdio: 'pipe', env: { ...process.env, PERFORMANCE_BASE_URL: process.env.PERFORMANCE_BASE_URL || 'http://127.0.0.1:4812' },
  });
  const report = JSON.parse(fs.readFileSync(sharedReceipt));
  report.executionWrapper = {
    path: 'scripts/verify-convnext-flow-loading.cjs', sha256: hash('scripts/verify-convnext-flow-loading.cjs'),
    verifier: 'scripts/verify-learning-load-boundaries.cjs', verifierSha256: hash('scripts/verify-learning-load-boundaries.cjs'),
    scope: 'ConvNeXt current revision; integration follow-up for the unchanged, previously blocked Depthwise revision7. Shared loader contracts are checked by the existing verifier.',
    previousScratchReceiptPreserved: true,
  };
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, checks: report.results.length, receipt: output }));
} finally {
  if (original) fs.writeFileSync(sharedReceipt, original);
  else if (fs.existsSync(sharedReceipt)) fs.unlinkSync(sharedReceipt);
}
