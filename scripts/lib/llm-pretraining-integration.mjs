import fs from 'node:fs';
import assert from 'node:assert/strict';

export const llmIntegration = process.env.LLM_INTEGRATION_DIRECTORY;
assert.ok(llmIntegration, 'Set LLM_INTEGRATION_DIRECTORY to the guarded publication folder');
const publication = JSON.parse(fs.readFileSync(`${llmIntegration}/publication.json`, 'utf8'));
export const llmBuild = publication.build;
export const llmScope = publication.rows.map(row => ({ ...row, published: row.source }));
