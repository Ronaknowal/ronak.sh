import React,{useState} from 'react';
import {trailProvider,rankedSupport} from '../../../data/dbscan-reading-flow/dbscan-geometry-models.mjs';
import {Figure,Canvas,NumericControl,Table,hues,focus,line,number} from './DbscanDrawingPrimitives.jsx';

function SortedDistances({position,minimum}) {
  const values=trailProvider.rankedDistances(position),id=trailProvider.observations[position].id;
  return <section><h4>{id}: find the rank value</h4>
    <Canvas height={650} label={`All ten ${id} distances sorted by distance then input position; fixed epsilon1 cut and selected rank${minimum}`}>
      {({width,rem})=>{
        const left=4*rem,right=width-2*rem,X=value=>left+value/5*(right-left),Y=index=>(4+index*3.4)*rem;
        return <g><line x1={X(1)} x2={X(1)} y1={2*rem} y2={37*rem} stroke={focus} strokeDasharray="5 3"/><text x={X(1)} y={1.5*rem} textAnchor="middle">ε=1</text>
          {values.map((row,i)=><g key={row.id}><text x={.5*rem} y={Y(i)+.3*rem}>{i+1}: {row.id}</text><line x1={left} x2={X(row.distance)} y1={Y(i)} y2={Y(i)} stroke={line}/><rect x={X(row.distance)-(i===minimum-1?7:4)} y={Y(i)-(i===minimum-1?7:4)} width={i===minimum-1?14:8} height={i===minimum-1?14:8} fill={row.distance<=1?hues[0]:'#111'} stroke={i===minimum-1?focus:hues[0]} strokeWidth={i===minimum-1?3:1}/><text x={right} y={Y(i)+1.6*rem} textAnchor="end">{number(row.distance)}</text></g>)}
          <text x={left} y={39*rem}>0</text><text x={right} y={39*rem} textAnchor="end">5 length units</text>
        </g>;
      }}
    </Canvas>
    <p>Squares mark distance values on the common0–5 ruler. Filled squares lie within the cut; the amber frame selects one rank.</p>
    <Table caption={`${id}'s complete ranked cells; self and ties stay distinct`} headers={['Rank','ID','Distance','Selected?']} rows={values.map((row,i)=>[i+1,row.id,row.distance,i===minimum-1?'selected':''])}/>
  </section>;
}

function D10() {
  const [minimum,setMinimum]=useState(4),radii=rankedSupport(trailProvider,minimum);
  return <Figure id="D10" sentence={`Self-inclusive rank${minimum}: D needs ${radii[3].value}; I needs ${radii[8].value}. The fixed ε=1 cut makes D ${radii[3].value<=1?'core':'noncore'} and I ${radii[8].value<=1?'core':'noncore'}. Every sorted entry, including self0 and distinct equal-distance IDs, remains visible.`}>
    <div className="db-pair"><SortedDistances position={3} minimum={minimum}/><SortedDistances position={8} minimum={minimum}/></div>
    <NumericControl label="Self-inclusive rank m; radius stays1" value={minimum} onChange={setMinimum} min={1} max={10} onReset={()=>setMinimum(4)} resetValue={4}/>
  </Figure>;
}

export const supportDrawings={D10};
