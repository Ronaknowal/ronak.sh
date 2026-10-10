import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { collectLocalImports, localImportSpecifiers } from './repository-imports.mjs';

test('finds module references without treating lesson examples as imports', () => {
  assert.deepEqual(localImportSpecifiers(`
    import index from '../docs/index.json';
    export { value } from './shared.js';
    const lazy = () => import('./lazy.jsx');
    const raw = require('./example.py?raw');
    const prose = "import x from './not-a-dependency.js'";
    const view = <p>{prose}</p>;
  `), ['../docs/index.json', './shared.js', './lazy.jsx', './example.py?raw']);
});

test('follows imports into excluded authoring owners and fails if the file is absent', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'repository-imports-'));
  try {
    await mkdir(path.join(root, 'src'));
    await mkdir(path.join(root, 'docs'));
    await writeFile(path.join(root, 'src/main.jsx'), "export { default } from './files';");
    await writeFile(path.join(root, 'src/files.js'), "import data from '../docs/index.json'; export default data;");
    await writeFile(path.join(root, 'docs/index.json'), '{}');
    assert.deepEqual(new Set(await collectLocalImports(root, ['src/main.jsx'])), new Set(['src/files.js', 'docs/index.json']));
    await rm(path.join(root, 'docs/index.json'));
    await assert.rejects(collectLocalImports(root, ['src/main.jsx']), /Missing local import: src\/files.js -> ..\/docs\/index.json/);
    await writeFile(path.join(root, 'src/files.js'), "import raw from './invalid.js?raw'; export default raw;");
    await writeFile(path.join(root, 'src/invalid.js'), 'This is displayed text, not valid JavaScript.');
    assert.ok((await collectLocalImports(root, ['src/main.jsx'])).includes('src/invalid.js'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
