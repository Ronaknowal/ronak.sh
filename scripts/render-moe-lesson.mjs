import fs from 'node:fs';
import {parse} from '@babel/parser';
const id='mixture-of-experts-transformers-moe';
// Direct JSX is authoritative; the original writer remains in the protected baseline.
parse(fs.readFileSync(`src/learn/data/topics/${id}.jsx`,'utf8'),{sourceType:'module',plugins:['jsx']});
console.log(`${id}: authoritative direct-source lesson parses`);
