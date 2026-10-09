import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createLearningNavigation } from '../../../../src/learn/data/curriculum/navigation.js';
import { learningPaths, trackGroups } from '../../../../src/learn/data/curriculum/learning-paths.js';
import { getDeliveryState } from '../../../../scripts/lib/lesson-delivery.mjs';

const id = 't-sne-umap-manifold-learning';
const owner = 'docs/teaching/classical-ml-reading-flow/' + id;
const ledgerPath = 'docs/teaching/lesson-delivery-progress.json';
const ledgerBytes = fs.readFileSync(ledgerPath);
const ledger = JSON.parse(ledgerBytes);
const beforeLedger = structuredClone(ledger);
const row = ledger.topics[id];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = new Map();
const bind = path => {
  const bytes = fs.readFileSync(path);
  return { path, bytes: bytes.length, sha256: sha(bytes) };
};
let conditions = 0;
const equal = (a, b) => { assert.deepEqual(a, b); conditions += 1; };
const observe = path => { const result = bind(path); inputs.set(path, result); return result; };
const oldNav = 'docs/teaching/math-foundations-reading-flow/queueing-theory-m-m-1-m-g-1-little-s-law/normal-frozen-r4/src/learn/data/generated/navigation.js';
const nav = 'src/learn/data/generated/navigation.js';
const oldIca = 'docs/teaching/classical-ml-reading-flow/independent-component-analysis-ica/publication/predecessors/independent-component-analysis-ica.jsx';
const ica = 'src/learn/data/topics/independent-component-analysis-ica.jsx';
equal(observe(oldNav).sha256, row.content.files[nav]);
equal(observe(oldIca).sha256, row.content.files[ica]);
equal(observe(nav).sha256, 'fa181a95f1400250b22e75826478a285977937610e9e7efedad8696a70af460b');
equal(observe(ica).sha256, '7671964bcfaa6005301997c70ab730de9b5d5914679ac2f0b5ddace9ebc01579');
const decode = path => {
  const source = fs.readFileSync(path, 'utf8');
  const match = /export const allTopicsOrdered = ([\s\S]+?);\r?\nexport const tracks = ([\s\S]+?);\r?\n?$/.exec(source);
  assert.ok(match);
  return { allTopicsOrdered: JSON.parse(match[1]), tracks: JSON.parse(match[2]) };
};
const previous = decode(oldNav);
const current = decode(nav);
const oldMap = Object.fromEntries(previous.allTopicsOrdered.map(topic => [topic.id, topic]));
const newMap = Object.fromEntries(current.allTopicsOrdered.map(topic => [topic.id, topic]));
equal(previous.tracks, current.tracks);
equal(previous.allTopicsOrdered.map(topic => topic.id), current.allTopicsOrdered.map(topic => topic.id));
equal(oldMap[id], newMap[id]);
for (const prerequisite of newMap[id].prerequisiteIds) equal(oldMap[prerequisite], newMap[prerequisite]);
const differences = [];
for (const topic of previous.allTopicsOrdered) {
  for (const field of new Set([...Object.keys(topic), ...Object.keys(newMap[topic.id])])) {
    if (JSON.stringify(topic[field]) !== JSON.stringify(newMap[topic.id][field])) {
      differences.push({ id: topic.id, field, before: topic[field], after: newMap[topic.id][field] });
    }
  }
}
equal(differences.map(item => [item.id, item.field]), [
  ['queueing-theory-m-m-1-m-g-1-little-s-law', 'title'],
  ['dbscan-density-based-clustering', 'readTime'],
  ['dbscan-density-based-clustering', 'hasIntegratedGuide'],
  ['independent-component-analysis-ica', 'readTime'],
  ['independent-component-analysis-ica', 'hasIntegratedGuide'],
]);
const resolver = data => createLearningNavigation({ tracks: data.tracks, topicCatalogue: Object.fromEntries(data.allTopicsOrdered.map(topic => [topic.id, topic])), trackGroups });
const oldResolver = resolver(previous);
const newResolver = resolver(current);
const routes = [{ id: 'standalone-classical-ml', spec: ['classical-ml'] }, ...learningPaths.filter(route => ['ml-foundations', 'research-revision', 'full-curriculum'].includes(route.id)).map(route => ({ id: route.id, spec: route }))].map(route => {
  const oldRoute = oldResolver.getLearningRoute(route.spec);
  const currentRoute = newResolver.getLearningRoute(route.spec);
  equal(oldRoute, currentRoute);
  const at = currentRoute.steps.findIndex(step => step.topicId === id);
  equal(currentRoute.steps.filter(step => step.topicId === id).length, 1);
  const next = currentRoute.steps[at + 1];
  equal(next.topicId, 'independent-component-analysis-ica');
  equal(oldMap[next.topicId].title, newMap[next.topicId].title);
  return { id: route.id, steps: currentRoute.steps.length, uniqueTopics: currentRoute.topicIds.length, selectedIndex: at, next, fullRouteUnchanged: true };
});
const manuscript = fs.readFileSync(row.content.manuscript, 'utf8');
const bridge = manuscript.split(/\r?\n/).find(line => line.startsWith('The next topic, [Independent Component Analysis]'));
assert.ok(bridge);
equal(manuscript.match(/independent-component-analysis-ica/g)?.length, 1);
const icaRow = ledger.topics['independent-component-analysis-ica'];
equal(getDeliveryState(process.cwd(), icaRow).implementation, 'complete');
equal(icaRow.implementation.reviewedFiles[ica], bind(ica).sha256);
const acceptedIca = observe('docs/teaching/classical-ml-reading-flow/independent-component-analysis-ica/publication/root-final-acceptance.json');
const changes = [nav, ica].map(path => ({ path, before: row.content.files[path], after: bind(path).sha256 }));
for (const [path, expected] of Object.entries(row.content.files)) {
  if (path === nav || path === ica) continue;
  equal(observe(path).sha256, expected);
}
for (const path of ['src/learn/data/curriculum/navigation.js', 'src/learn/data/curriculum/learning-paths.js', 'src/learn/Reader.jsx', 'src/learn/components/ReaderSidebar.jsx', 'src/learn/components/LessonGuide.jsx', 'src/learn/components/TopicContent.jsx', 'src/learn/hooks/useTopicResource.js']) observe(path);
const receiptPath = owner + '/content-authoring/review-correction/current-source-role-acceptance.json';
assert.ok(!fs.existsSync(receiptPath));
let foreignRows = 0;
for (const [topicId, entry] of Object.entries(beforeLedger.topics)) {
  if (topicId === id) continue;
  equal(ledger.topics[topicId], entry);
  foreignRows += 1;
}
const receipt = {
  schema: 'root-manifold-current-content-role/v1', at: new Date().toISOString(), reviewer: '/root',
  status: 'ACCEPT_CURRENT_CONTENT_CONTEXT_PRESERVE_HISTORICAL_INSPECTION',
  topicId: id, revision: row.revision, changes, bridge, differences, routes,
  authenticPredecessors: [bind(oldNav), bind(oldIca)], currentIcaWholeAcceptance: acceptedIca,
  rootReading: [
    'Read the complete manuscript ending and its sole ICA connection. It asks a next-question about mixtures and statistical independence, not an imported algorithm or a prerequisite to this lesson.',
    'Read the authentic old ICA opening/mixture explanation and current ICA introduction plus sections1–3: both teach observed channels as weighted source mixtures, distinguish independence from covariance, and use named PCA/probability prerequisites.',
    'Current ICA starts with actual source traces, signed weighted branches, row/column mixing, a known inverse, identification ambiguities and joint-event independence. It supports the exact downstream question without treating neighborhood preservation as source recovery.',
    'The current accepted ICA whole-content/runtime review supplies its lesson authority; this focused reading is not a fresh review of every ICA programme or picture.',
    'The navigation comparison uses a physically retained full ad0eb4 source, not inferred fields. Selected metadata, prerequisites and four complete routes are unchanged. ICA guide/estimate changes are foreign header/guide metadata; its next-link title and URL remain unchanged. Queueing apostrophe and DBSCAN metadata changes do not alter the selected teaching or sequence.',
  ],
  inputs: [...inputs.values()], rootConditions: conditions, foreignRowsConserved: foreignRows,
  limits: ['No new whole-topic, native or normal-route acceptance', 'No source/main/fit/build/scientific replay', 'Historical bbb5/ad0 content inspections remain retained and are not relabelled current', 'Full t-SNE runtime/paint/code/normal integration still pending'],
};
for (const input of inputs.values()) equal(bind(input.path), input);
equal(fs.readFileSync(ledgerPath), ledgerBytes);
receipt.rootConditions = conditions;
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
for (const change of changes) row.content.files[change.path] = change.after;
row.content.files[receiptPath] = bind(receiptPath).sha256;
const reconstructed = structuredClone(row);
delete reconstructed.content.files[receiptPath];
for (const change of changes) reconstructed.content.files[change.path] = change.before;
equal(reconstructed, beforeLedger.topics[id]);
const state = getDeliveryState(process.cwd(), row);
equal(state.content, 'complete');
equal(state.implementation, 'in-progress');
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
equal(JSON.parse(fs.readFileSync(ledgerPath)), ledger);
console.log(JSON.stringify({ receipt: bind(receiptPath), conditions, foreignRows, content: state.content, implementation: state.implementation, differences: differences.length }));
