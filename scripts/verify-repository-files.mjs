import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { collectLocalImports } from './lib/repository-imports.mjs';

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const excludedDirectories = new Set(["node_modules", "__pycache__", ".venv", "venv", ".git"]);
const machineArtifact = file => /(?:^|\/)\.env(?:\.|$)/.test(file) && !/\.example$/.test(file) || /\.(?:pyc|pyo|pyd|swp)$/.test(file) || /(?:^|\/)(?:\.DS_Store|Thumbs\.db|desktop\.ini)$/.test(file);
// Only these local authoring classes may be absent from a clean checkout.
// Do not skip arbitrary ignored files: that would hide an accidental source exclusion.
function localAuthoringArtifact(file) {
  if (!file.startsWith('docs/teaching/')) return false;
  const parts = file.slice('docs/teaching/'.length).split('/');
  const stoppedWorkspaces = {
    'classical-ml-reading-flow': ['t-sne-umap-manifold-learning', 'non-negative-matrix-factorization-nmf', 'feature-scaling-encoding-imputation', 'cross-validation-hyperparameter-tuning', 'regularization-l1-l2-elastic-net-dropout'],
    'math-foundations-reading-flow': ['entropy-cross-entropy-kl-divergence', 'mutual-information-information-bottleneck', 'rate-distortion-theory', 'f-divergences-integral-probability-metrics', 'dynamical-systems-theory-chaos', 'it-calculus-stochastic-differential-equations'],
    'deep-learning-beginner': [], 'deep-learning-completion': [], 'llm-architecture-training': [],
  };
  if (Object.hasOwn(stoppedWorkspaces, parts[0]) && parts[1] && !stoppedWorkspaces[parts[0]].includes(parts[1])) {
    const index = parts.length === 2 && (parts[1].endsWith('.md') ||
      (parts[0] === 'llm-architecture-training' ? /scope.*\.json$/.test(parts[1]) : parts[0] !== 'deep-learning-completion' && parts[1] === 'scope.json'));
    if (!index) return true;
  }
  if (parts.slice(0, -1).some(part => part.includes('frozen') || part.includes('-snapshot') || part.includes('-before-') ||
    ['copies', 'snapshot', 'snapshots', 'original', 'node_modules', 'site-packages', 'packages', 'production', 'prototype-dist', 'playwright-report', 'test-results', 'screenshots', 'captures'].includes(part) ||
    /^optional-.*-packages$/.test(part) || part.startsWith('production-'))) return true;
  if (file.includes('/runtime-preview/assets/')) return true;
  return /\/(?:check|verify|freeze|capture)-[^/]+\.(?:py|cjs|mjs)$/.test(file) || /\/(?:patch|install|assemble|prepare)-[^/]+\.py$/.test(file);
}
const localArtifacts = [];
async function collect(directory, files = []) {
  for (const entry of await readdir(path.join(repositoryRoot, directory), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const file = `${directory}/${entry.name}`;
    if (localAuthoringArtifact(file + (entry.isDirectory() ? '/' : ''))) {
      localArtifacts.push(file + (entry.isDirectory() ? '/artifact.json' : ''));
      continue;
    }
    if (entry.isDirectory()) {
      if (/^apps\/[^/]+$/.test(directory) && ["dist", "build", ".next", ".vite", "playwright-report", "test-results"].includes(entry.name)) continue;
      if (!excludedDirectories.has(entry.name) && !entry.name.endsWith(".egg-info")) await collect(file, files);
    } else if (!machineArtifact(file)) files.push(file);
  }
  return files;
}
function ignored(files) {
  // Check repository rules deterministically, independent of a machine's global excludes.
  const globalExcludes = process.platform === "win32" ? "NUL" : "/dev/null";
  const result = spawnSync("git", ["-c", `core.excludesFile=${globalExcludes}`, "check-ignore", "--no-index", "--stdin", "-z"], {
    cwd: repositoryRoot, input: files.join("\0") + "\0", encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  if (![0, 1].includes(result.status)) throw new Error(result.stderr || result.error?.message || "git check-ignore failed");
  return result.stdout.split("\0").filter(Boolean);
}
const roots = ["src", "public", "content", "apps", "scripts", "docs", "skills", ".github"];
const required = (await Promise.all(roots.map(directory => collect(directory)))).flat();
for (const entry of await readdir(repositoryRoot, { withFileTypes: true })) {
  if (entry.isFile() && (/\.md$/i.test(entry.name) || ["package.json", "package-lock.json", "vite.config.js", "index.html", ".gitignore", ".gitattributes", "wrangler.jsonc", ".env.example"].includes(entry.name))) required.push(entry.name);
}
const futureFiles = ["content/articles/my-article/body.md", "content/articles/my-article/metadata.json", "public/articles/my-article/build.log", "public/learn-assets/example.py", "src/articles/generated/catalogue.js", "docs/archive/scratch/evidence.json", "docs/archive/dist/example.md", "apps/example/src/main.ts", ".env.production.example", "docs/teaching/topic-notes/future-topic.md", "docs/teaching/drafts/future-topic/manuscript.md", "docs/teaching/drafts/future-topic/visual-specifications.json", "docs/teaching/math-foundations-reading-flow/rate-distortion-theory/programmes/solver.py", "docs/teaching/math-foundations-reading-flow/f-divergences-integral-probability-metrics/runtime-private/src/lesson.jsx", "public/learn-code/example/check-model.py"];
// An ignored authoring folder can still be a build dependency. Inspect imports
// independently of the artifact classification so those exclusions cannot hide it.
const buildEntrypoints = ['vite.config.js', 'scripts/generate-learning-artifacts.mjs', 'scripts/generate-articles.mjs', 'scripts/verify-repository-files.mjs', 'scripts/verify-articles.mjs', 'scripts/verify-site-build.mjs'];
const dependencies = await collectLocalImports(repositoryRoot, ['src/main.jsx', ...buildEntrypoints]);
required.push(...dependencies.filter(file => !required.includes(file)));
assert.deepEqual(ignored([...required, ...futureFiles]), [], "Required source, documentation or public assets are ignored by repository rules");
console.log(`Local import coverage passed for ${dependencies.length} dependencies.`);
const disposable = ["node_modules/example/index.js", "dist/index.html", "scratch/report.json", "scratch_local.py", "apps/example/dist/index.html", ".env", ".env.production", "apps/example/.env.local", "public/learn-assets/__pycache__/example.cpython-312.pyc", "docs/teaching/example/content-frozen-r1/src/topic.jsx", "docs/teaching/example/optional-faiss-packages/faiss/index.py", "docs/teaching/example/review/check-initial-schema-failure.py", "docs/teaching/example/runtime-preview/assets/main.js", ...localArtifacts];
assert.deepEqual(new Set(ignored(disposable)), new Set(disposable), "Caches, builds or secrets are no longer ignored");
async function verifyPublicDirectory(directory) {
  for (const entry of await readdir(path.join(repositoryRoot, directory), { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    assert.ok(!entry.isSymbolicLink(), `Public assets must not link outside their tree: ${file}`);
    assert.ok(!excludedDirectories.has(entry.name) && !machineArtifact(file), `Vite would deploy a cache or private machine file: ${file}`);
    if (entry.isDirectory()) await verifyPublicDirectory(file);
  }
}
await verifyPublicDirectory("public");
if (process.argv.includes('--staged')) {
  const listing = spawnSync('git', ['ls-files', '--cached', '-z'], { cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (listing.status !== 0) throw new Error(listing.stderr || 'Cannot inspect Git index');
  const indexed = new Set(listing.stdout.split('\0').filter(Boolean));
  const missing = required.filter(file => !indexed.has(file));
  assert.deepEqual(missing, [], 'Required website, tooling or durable authoring files are missing from the Git index');
  assert.deepEqual(ignored([...indexed]), [], 'Local artifacts remain tracked; remove only those paths with git rm --cached');
  console.log(`Git index coverage passed for all ${required.length} required current files; no excluded artifacts are tracked.`);
}
console.log(`Repository ignore checks passed for ${required.length} current files and ${futureFiles.length} future-path probes; caches and secrets remain excluded. Machine-global excludes are outside this check.`);
