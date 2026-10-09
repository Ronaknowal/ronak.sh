// Adapt explicit repository-root asset paths without mutating frozen publication evidence.
import { llmScope } from './lib/llm-pretraining-integration.mjs';
for (const topic of llmScope) {
  topic.assetRoots = topic.assetRoots.map(path => path.replace(/^public\//, ''));
  topic.assetFiles = (topic.assetFiles ?? []).map(path => path.replace(/^public\//, ''));
  // A whole-root check already includes these byte-exact files. Keep only
  // separately reused assets outside those roots in the individual-file pass.
  topic.assetFiles = topic.assetFiles.filter(file => !topic.assetRoots.some(root => file.startsWith(`${root}/`)));
}
await import('./verify-llm-pretraining-integration.mjs');
