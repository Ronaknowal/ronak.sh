import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from '@babel/parser';
import generator from '@babel/generator';
const owner=path.dirname(fileURLToPath(import.meta.url));
const names=['Drawing.jsx','ArrayFigures.jsx','GeometryFigures.jsx','OptimizationFigures.jsx','SavedDataFigures.jsx','IdentifiabilityFigures.jsx','TransferFigures.jsx','NmfFigures.jsx','FileIndex.jsx','preview-entry.jsx','nmf-model.js'];
for(const name of names){const p=path.join(owner,name),source=fs.readFileSync(p,'utf8'),ast=parse(source,{sourceType:'module',plugins:['jsx']});fs.writeFileSync(p,(generator.default||generator)(ast,{comments:true,compact:false,retainLines:false}).code+'\n');}
console.log(JSON.stringify({formattedPrivateOwners:names.length,contentSourcesChanged:0}));
