import fs from 'node:fs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';
// These are new, unfrozen author sources. Canonical scientific programs and the
// accepted manuscript are deliberately outside this formatting operation.
for (const path of [
  'src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx',
  'src/learn/data/rlaif-methods-models.js',
]) {
  const source = fs.readFileSync(path, 'utf8');
  fs.writeFileSync(path, await format(source, { parser: 'babel', plugins: [babel, estree], singleQuote: true, printWidth: 100 }));
}
console.log('Formatted the two newly authored RLAIF runtime sources.');
