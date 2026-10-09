import fs from 'node:fs';
const b='src/learn/components/lesson-labs/';
const edit=(file,fn)=>{const p=b+file;fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));};
edit('ConstrainedDecodingFoundations.jsx',s=>s
 .replace('n=Math.min(step,text.length),state=trace[n]','n=Math.min(step,trace.length-1),state=trace[n]')
 .replace('text.slice(0,n)','Array.from(text).slice(0,n).join(\'\')')
 .replace('max={text.length} onChange={setStep}','max={trace.length-1} onChange={setStep}')
 .replace('disabled={n===text.length}','disabled={n===trace.length-1}')
 .replace('color={colors[i]} active={allowed[i]}/><text x={x+40} y={y+5}>ID {i}</text>','color={colors[i]}/>{allowed[i]&&<circle cx={x} cy={y} r={32} fill="none" stroke="white"/>}<text x={x} y={y+53} textAnchor="middle" style={{fill:colors[i]}}>ID {i}</text>')
 .replace('A token can end at an internal trie node; the byte path and token ID remain distinct.','Colour identifies the token; an outer white ring means it is allowed. A token can end at an internal trie node; byte paths and token IDs remain distinct.')
 .replace("<text x=\"505\" y={39+row*100}>→ €</text>","<text x=\"505\" y={39+row*100}>→ €</text>{(row?[[170,455,2,'token 0']]:[[170,255,0,'token 0'],[270,455,1,'token 1']]).map(([a,b,c,label])=><g key={label}><path d={`M${a} ${60+row*100} v8 H${b} v-8`} fill=\"none\" stroke={colors[c]}/><text x={(a+b)/2} y={88+row*100} textAnchor=\"middle\" style={{fill:colors[c]}}>{label}</text></g>)}"));
edit('ConstrainedDecodingState.jsx',s=>s
 .replace('height={320}','height={350}').replace('y="310">Arrays','y="340">Arrays')
 .replaceAll('colors[f.id%5]','colors[(frames.length-i-1)%5]')
 .replace("const n=Math.min(step,t.length),trace=nestedTrace(t),cur=trace[n];","const bytes=Array.from(t),n=Math.min(step,bytes.length),trace=nestedTrace(t),cur=trace[n];let depth=0;const byteColors=bytes.map(c=>{if(c==='[')return colors[depth++%5];if(c===']')return colors[Math.max(0,--depth)%5];return c===','?'#929baa':c==='2'?colors[2]:c==='3'?colors[3]:c==='4'?colors[4]:'#e3e7ee';});")
 .replace('colors[i%5]}}>{c}','byteColors[i]}}>{c}')
 .replace('The explicit teaching guard permits at most eight pending arrays.','Array depth retains its colour from the tree through opening/closing brackets and return frames. Punctuation is grey. The teaching guard permits at most eight pending arrays.')
 .replace('JSON.stringify(t.slice(0,n))',"JSON.stringify(bytes.slice(0,n).join(''))")
 .replace('n<t.length?`Next byte: ${t[n]}`','n<bytes.length?`Next byte: ${bytes[n]}`')
 .replace('max={t.length}','max={bytes.length}').replace('disabled={n===t.length}','disabled={n===bytes.length}')
 .replace('Each action changes only its own branch; rollback restores A\'s fork checkpoint.','Cyan and rose identify requests; blue and violet retain array-depth identity. Each action changes only its own branch; rollback restores A\'s fork checkpoint.')
 .replace('x="95" y="35" style={{fill:colors[0]}}','x="95" y="35" style={{fill:colors[3]}}').replace('x="435" y="35" style={{fill:colors[1]}}','x="435" y="35" style={{fill:colors[4]}}')
 .replace('label="value" r={45} color={colors[0]}','label="value" r={45} color={colors[3]}').replace("label={digit?'after':'value'} r={45} color={colors[1]}","label={digit?'after':'value'} r={45} color={colors[4]}")
 .replace('label="frame 4" r={40} color={colors[3]}','label="frame 4" r={40} color={colors[1]}').replace("label={'frame '+shared.id} r={40} color={colors[2]}","label={'frame '+shared.id} r={40} color={colors[0]}")
 .replace('M300 315 L300 375 L115 375 L115 175 M395 315 L395 375 L570 375 L570 175','M300 315 L300 375 L115 375 L115 190 M395 315 L395 375 L570 375 L570 190')
 .replace('stroke={colors[3]}/><text x="25" y="410">','stroke={colors[3]}/><Edge x1={115} y1={190} x2={115} y2={162} color={colors[3]}/><Edge x1={570} y1={190} x2={570} y2={162} color={colors[3]}/><text x="25" y="410">'));
edit('ConstrainedDecodingEvidence.jsx',s=>s
 .replace('independent.\"><Drawing label="Serial execution compared with ideal overlapping model and mask work" height={320}','independent.\"><Drawing label="Serial execution compared with ideal overlapping model and mask work" height={390}')
 .replace('<text x="5" y="305">Transfer</text>','<text x="5" y="305">Transfer</text><line x1={x(0)} x2={x(max)} y1="337" y2="337" stroke="#929baa"/>{[0,max/4,max/2,max*3/4,max].map(t=><g key={t}><line x1={x(t)} x2={x(t)} y1="333" y2="342" stroke="#929baa"/><text x={x(t)} y="360" textAnchor="middle">{fmt(t)}</text></g>)}<text x="400" y="383">Elapsed time (ms)</text>')
 .replace('<text x="10" y="25">Total ms</text>','<text x="10" y="25">Total ms</text>{[0,.25,.5,.75,1].map(fraction=>{const value=fraction*Math.max(max.constrained,max.retries);return <g key={fraction}><line x1="65" x2="590" y1={y(value)} y2={y(value)} stroke="#353b45"/><text x="60" y={y(value)+5} textAnchor="end">{Math.round(value)}</text></g>;})}'));
console.log('Consolidated author paint/Unicode-control corrections saved; original evidence retained.');
