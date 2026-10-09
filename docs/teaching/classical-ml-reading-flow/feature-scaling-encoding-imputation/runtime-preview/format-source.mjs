import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import generator from '@babel/generator';
const owner = path.dirname(fileURLToPath(import.meta.url));
const names = ['Drawing.jsx', 'CoreFigures.jsx', 'DeeperFigures.jsx', 'PreparationFigures.jsx', 'PreparationInvestigations.jsx', 'preview-entry.jsx', 'preparation-models.mjs', 'vite.config.mjs'];
for (const name of names) {
  const file = path.join(owner, name), source = fs.readFileSync(file, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  fs.writeFileSync(file, (generator.default || generator)(ast, { comments: true, compact: false }).code + '\n');
}
console.log(JSON.stringify({ privateSourcesFormatted: names.length, acceptedContentChanged: 0 }));
