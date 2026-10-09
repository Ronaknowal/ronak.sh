import fs from 'node:fs';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';
// Newly authored, unfrozen runtime only. No manuscript/scientific program edits.
for (const path of ['src/learn/data/rlvr-models.js','src/learn/components/lesson-labs/RLVRFlow.jsx','src/learn/components/lesson-labs/RLVRCoreFigures.jsx','src/learn/components/lesson-labs/RLVRStudyFigures.jsx','scripts/render-rlvr-lesson.mjs']) {
  fs.writeFileSync(path,await format(fs.readFileSync(path,'utf8'),{parser:'babel',plugins:[babel,estree],singleQuote:true,printWidth:100}));
}
console.log('Formatted all newly authored RLVR JavaScript sources.');
