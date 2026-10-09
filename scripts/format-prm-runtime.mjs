import fs from 'node:fs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';
for (const path of [
  'src/learn/components/lesson-labs/PRMFlow.jsx',
  'src/learn/data/prm-models.js',
  'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/lesson.jsx',
]) {
  const source = fs.readFileSync(path, 'utf8');
  fs.writeFileSync(path, await format(source, { parser: 'babel', plugins: [babel, estree], singleQuote: true, printWidth: 100 }));
}
console.log('Formatted three newly authored PRM runtime sources.');
