import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const owner = path.dirname(fileURLToPath(import.meta.url));
const preview = path.resolve(owner, '../../..'), app = path.resolve(preview, '../../../../..');
const bind = file => {
  const raw = fs.readFileSync(file);
  return { path: path.relative(app, file).replaceAll('\\', '/'), bytes: raw.length, sha256: crypto.createHash('sha256').update(raw).digest('hex') };
};
const packet = JSON.parse(fs.readFileSync(path.join(owner, 'author-ready-source.json'), 'utf8'));
for (const row of [...packet.currentSourceBindings, ...packet.prebuildSharedSourceBindings, ...packet.acceptedContentReferences]) assert.deepEqual(bind(path.join(app, row.path)), row);
for (const row of packet.completeDelivery) assert.deepEqual(bind(path.join(app, row.source.path)), row.source);
const reviewerFile = process.argv[2]; assert.ok(reviewerFile, 'Independent receipt required before build probe');
const reviewer = JSON.parse(fs.readFileSync(path.resolve(app, reviewerFile), 'utf8'));
assert.ok(JSON.stringify(reviewer).includes(packet.overlayModule.sha256), 'Independent receipt must bind actual overlay');
assert.ok(JSON.stringify(reviewer).includes(bind(path.join(owner, 'author-ready-source.json')).sha256), 'Independent receipt must bind source packet');
assert.ok(!fs.existsSync(path.join(owner, 'build-private')), 'One new output must be absent before build');
const sockets = [];
for (const host of ['127.0.0.1', '::1']) {
  await new Promise((resolve, reject) => {
    const server = net.createServer(); server.once('error', reject);
    server.listen({ host, port: 5196, exclusive: true }, () => server.close(error => error ? reject(error) : resolve()));
  });
  sockets.push({ host, port: 5196, actualBindAndRelease: true });
}
const disk = fs.statfsSync(app), freeBytes = Number(disk.bavail) * Number(disk.bsize);
assert.ok(freeBytes > 100_000_000);
const receipt = {
  schema: 'manifold-probability-arrow-prebuild-probe/v1', status: 'PASS_ONE_OUTPUT_ABSENT_PORT_FREE_SOURCE_BOUND_INDEPENDENT_CONFIRMATION_PRESENT', at: new Date().toISOString(),
  sourceFreeze: bind(path.join(owner, 'author-ready-source.json')), independentConfirmation: bind(path.resolve(app, reviewerFile)),
  reviewerStatus: reviewer.status, protectedCurrentSources: packet.currentSourceBindings.length,
  sharedPrebuildDependencySources: packet.prebuildSharedSourceBindings.length, contentBindings: packet.acceptedContentReferences.length,
  payloadBindings: packet.completeDelivery.length, freeBytes, sockets, outputAbsent: true,
  publicDir: false, unchangedScientificCampaignReplayed: false, checker: bind(fileURLToPath(import.meta.url))
};
const output = path.join(owner, 'prebuild-probe.json'); assert.ok(!fs.existsSync(output));
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
