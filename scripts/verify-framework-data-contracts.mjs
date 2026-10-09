import assert from 'node:assert/strict';
import { annotationAgreement, initialAnnotations } from '../src/learn/data/annotation-agreement-model.js';
import { anchorText, inspectTextSpan, tokenizeWithOffsets } from '../src/learn/data/text-alignment-model.js';
import { initialPixels, validPixelFilter, cropFlipRectangle } from '../src/learn/data/vision-library-model.js';

const initial = annotationAgreement(initialAnnotations);
assert.deepEqual(initial.matrix, [[2,1],[1,2]]);
assert.ok(Math.abs(initial.kappa - 1/3) < 1e-12);
assert.equal(annotationAgreement(initialAnnotations.map(() => ['R','R','R'])).kappa, null);
assert.equal(annotationAgreement(initialAnnotations.map(() => ['','',''])).paired, 0);
assert.deepEqual(annotationAgreement([['U','R','']]).proposals, [null]);
const swapped = annotationAgreement(initialAnnotations.map(([a,b,c])=>[b,a,c]));
assert.equal(swapped.kappa,initial.kappa);
assert.equal(inspectTextSpan(anchorText,14,22).aligned,true);
assert.equal(inspectTextSpan(anchorText,15,22).aligned,false);
assert.equal(inspectTextSpan(anchorText,14,22,'whitespace').aligned,false);
assert.equal(inspectTextSpan('',0,0).aligned,false);
assert.deepEqual(tokenizeWithOffsets('🙂 Asha'),[{text:'🙂',start:0,end:1},{text:'Asha',start:2,end:6}]);
assert.deepEqual(inspectTextSpan(anchorText,14,22).tags,['O','O','O','B-PLACE','I-PLACE','O']);
validPixelFilter(initialPixels).forEach((result,i)=>assert.ok(Math.abs(result.value-[5,6,9,10][i])<1e-12));
assert.deepEqual(validPixelFilter(Array(16).fill(6),'difference').map(item=>item.value),[0,0,0,0]);
const changed = [...initialPixels]; changed[0]=9;
validPixelFilter(changed).forEach((result,i)=>assert.ok(Math.abs(result.value-[6,6,9,10][i])<1e-12));
assert.deepEqual(cropFlipRectangle(2,3),[0,1,2,3]);
assert.deepEqual(cropFlipRectangle(2,3,true),[1,1,3,3]);
assert.equal(cropFlipRectangle(4,2),null);
assert.deepEqual(cropFlipRectangle(0,6,true),[2,1,5,3]);
for(let left=0;left<6;left++) for(let width=1;width<=6-left;width++) for(const flip of [false,true]) {
  const box=cropFlipRectangle(left,width,flip);
  const sourceColumns=Array.from({length:width},(_,x)=>left+(flip?width-1-x:x)).map((source,x)=>source>=1&&source<4?x:null).filter(x=>x!==null);
  assert.equal(box===null,sourceColumns.length===0);
  if(box) assert.deepEqual([box[0],box[2]],[Math.min(...sourceColumns),Math.max(...sourceColumns)+1]);
}
console.log('Framework data contracts: annotation, Unicode span alignment, filters and all 42 crop/flip cases pass.');
