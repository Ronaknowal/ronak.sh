import fs from 'node:fs';
import {scalarTrace,modeTrace,pairTrace,restartTrace,groupTrace,meanVariance} from '../src/learn/data/diagnostics-reading-models.js';
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const output={scalar:input.scalar.map(c=>scalarTrace(c.rows.map(([x,y],i)=>({id:i+1,x,y})),c.weight,c.rate)),mode:input.mode.map(modeTrace),pairs:input.pairs.map(c=>pairTrace(c.rows.map(([a,b],i)=>({id:i+1,a,b})),c.direction)),restart:input.restart.map(restartTrace),group:input.group.map(c=>groupTrace(c.rows.map(([x,y],i)=>({id:i+1,x,y})),c.weight,c.rate,c.cursor)),variance:input.variance.map(c=>meanVariance(c.common,c.count))};
process.stdout.write(JSON.stringify(output));
