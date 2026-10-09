import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Root-owned phase updates for the scoped tokenization revision. Never certifies
// content or implementation: those actions require the explicitly reviewed packet.
const root = process.cwd();
const recordRoot = 'docs/teaching/tokenization';
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const baselinePath = `${recordRoot}/reading-flow-baseline.json`;
const ids = [
  'byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram',
  'byte-level-tokenization-token-free-models',
  'vocabulary-design-multilingual-tokenization',
];
const digest = value => createHash('sha256').update(value).digest('hex');
const hashFile = file => digest(fs.readFileSync(path.resolve(root, file)));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const ledger = read(ledgerPath);
const action = process.argv[2];

if (action === 'open') {
  if (fs.existsSync(baselinePath)) throw new Error('Baseline already exists; do not overwrite it.');
  const manifest = read('src/learn/data/lesson-manifest.json');
  const originals = {};
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else originals[file.replaceAll('\\', '/')] = hashFile(file);
    }
  };
  walk(`${recordRoot}/original`);
  const baseline = {
    capturedAt: new Date().toISOString(),
    ids,
    topics: Object.fromEntries(ids.map(id => [id, structuredClone(ledger.topics[id])])),
    unrelated: Object.fromEntries(Object.entries(ledger.topics)
      .filter(([id]) => !ids.includes(id)).map(([id, entry]) => [id, digest(JSON.stringify(entry))])),
    manifest,
    manifestHash: hashFile('src/learn/data/lesson-manifest.json'),
    protectedOriginals: originals,
  };
  write(baselinePath, baseline);
  for (const id of ids) {
    const prior = ledger.topics[id];
    const { previousRevisions = [], ...history } = prior;
    ledger.topics[id] = {
      revision: prior.revision + 1,
      deliveryMode: 'full',
      record: `${recordRoot}/${id}/reading-flow-revision.md`,
      content: { status: 'in-progress' },
      implementation: { status: 'not-started' },
      nextAction: 'Complete independently reviewed design, full research and continuous lesson content; then implement the reading-flow drawings.',
      previousRevisions: [...previousRevisions, history],
    };
  }
  write(ledgerPath, ledger);
  console.log(JSON.stringify({ action, revisions: ids.map(id => [id, ledger.topics[id].revision]) }));
} else if (action === 'content') {
  const id = process.argv[3];
  if (!ids.includes(id)) throw new Error('Use an authorized stable topic ID.');
  const baseline = read(baselinePath);
  const manuscript = {
    [ids[0]]: 'src/learn/data/topics/tokenization.jsx',
    [ids[1]]: 'src/learn/data/topics/byte-level-tokenization.jsx',
    [ids[2]]: 'src/learn/data/topics/vocabulary-multilingual.jsx',
  }[id];
  const specifications = `${recordRoot}/${id}/reading-flow-revision.md`;
  const amendment = `${recordRoot}/${id}/reading-flow-design-amendment.md`;
  const files = [...new Set([
    manuscript, specifications, `${recordRoot}/visual-vocabulary.md`,
    ...(fs.existsSync(amendment) ? [amendment] : []),
    ...Object.keys(baseline.topics[id].implementation.reviewedFiles)
      .filter(file => file.startsWith('public/') ||
        file.startsWith('src/learn/data/') && !file.startsWith('src/learn/data/topics/')),
  ])];
  ledger.topics[id].content = { status: 'complete', manuscript,
    visualSpecifications: specifications, files: Object.fromEntries(files.map(file => [file, hashFile(file)])),
    completedAt: new Date().toISOString() };
  ledger.topics[id].implementation = { status: 'in-progress' };
  ledger.topics[id].nextAction = 'Complete authored drawings and interaction checks, then independent whole-source/paint review and production/loading integration.';
  write(ledgerPath, ledger);
  console.log(JSON.stringify({ action, id, revision: ledger.topics[id].revision,
    manuscriptHash: hashFile(manuscript), files: files.length }));
} else if (action === 'complete') {
  const integration = read(`${recordRoot}/reading-flow-integration.json`);
  if (integration.passed !== true || integration.independentAcceptance !== true) {
    throw new Error('Completion requires accepted independent review and passing final integration.');
  }
  for (const id of ids) {
    const checkpoint = integration.topicCheckpoints[id];
    if (!checkpoint || ledger.topics[id].revision !== 3) throw new Error(`Unexpected scoped revision: ${id}`);
    for (const [file, hash] of Object.entries({ ...checkpoint.content.files, ...checkpoint.implementation.reviewedFiles })) {
      if (hashFile(file) !== hash) throw new Error(`Reviewed source changed before completion: ${file}`);
    }
    ledger.topics[id].content = { ...checkpoint.content, status: 'complete', completedAt: integration.checkedAt };
    ledger.topics[id].implementation = { ...checkpoint.implementation, status: 'complete', completedAt: integration.checkedAt };
    ledger.topics[id].nextAction = 'Both phases complete; await user reading feedback. No further LLM topics are authorized by this scoped request.';
  }
  write(ledgerPath, ledger);
  // Freshly read this shared registry; preserve concurrent unrelated entries.
  const registryPath = 'docs/teaching/deep-research-registry.json';
  const registry = read(registryPath);
  for (const id of ids) registry.topics[id] = {
    basis: 'deep-dive coverage map', record: `${recordRoot}/${id}/reading-flow-revision.md`,
  };
  registry.updatedOn = '2026-10-06';
  write(registryPath, registry);
  console.log(JSON.stringify({ action, topics: ids, passed: true }));
} else if (action === 'check-conservation') {
  const baseline = read(baselinePath);
  const failures = [];
  const concurrentLedgerChanges = [];
  for (const [id, hash] of Object.entries(baseline.unrelated)) {
    if (digest(JSON.stringify(ledger.topics[id])) !== hash) concurrentLedgerChanges.push(id);
  }
  if (hashFile('src/learn/data/lesson-manifest.json') !== baseline.manifestHash) failures.push('Publication manifest changed');
  for (const [file, hash] of Object.entries(baseline.protectedOriginals)) {
    if (!fs.existsSync(file) || hashFile(file) !== hash) failures.push(`Protected original changed: ${file}`);
  }
  for (const id of ids) {
    const previous = ledger.topics[id].previousRevisions;
    const { previousRevisions: oldHistory, ...oldCurrent } = baseline.topics[id];
    if (JSON.stringify(previous.at(-1)) !== JSON.stringify(oldCurrent)) failures.push(`Previous revision changed: ${id}`);
  }
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(JSON.stringify({ action, unrelatedRows: Object.keys(baseline.unrelated).length,
    concurrentLedgerChanges,
    note: 'Concurrent unrelated rows are reported and preserved; this scoped task never restores them from its baseline.',
    protectedOriginals: Object.keys(baseline.protectedOriginals).length, topics: ids, passed: true }));
} else {
  throw new Error('Use open, content <ID>, complete, or check-conservation. Completion requires independent review and integration.');
}
