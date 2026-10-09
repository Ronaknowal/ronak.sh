import { useState } from 'react';
import { easeWeights } from '../../data/recommender-flow-implicit-models.js';
import { RecFigure, RecMatrix, RecOperands, RecQuantity, RecSelect, formatRec as n , itemHue } from './RecommenderFlowControls.jsx';
import { RecWire as Wire, RecPort as Port } from './RecommenderFlowDrawing.jsx';

const defaults=()=>({X:[[1,1,0],[0,1,1],[1,0,0]],lambda:1,target:2,user:0,cell:[0,0]});
const options=(count,prefix)=>Array.from({length:count},(_,index)=>[index,`${prefix}${index}`]);

export function EaseReconstructionFigure(){
  const [state,setState]=useState(defaults),[revision,setRevision]=useState(0);
  const patch=values=>setState(previous=>({...previous,...values}));
  const reset=()=>{setState(defaults());setRevision(value=>value+1);};
  const users=state.X.length,items=state.X[0].length;
  const resize=(users,items)=>setState(previous=>({...previous,X:Array.from({length:users},(_,user)=>Array.from({length:items},(_,item)=>previous.X[user]?.[item]??0)),
    user:Math.min(previous.user,users-1),target:Math.min(previous.target,items-1),cell:[Math.min(previous.cell[0],users-1),Math.min(previous.cell[1],items-1)]}));
  const result=easeWeights(state.X,state.lambda,state.target),itemNames=options(items,'I').map(([,name])=>name),userNames=options(users,'U').map(([,name])=>name);
  return <RecFigure id="D33" label="Excluded EASE target input, direct ridge solve and constraint multiplier shortcut" reset={reset}
    controls={<><fieldset className="rec-flow-quantity"><legend>Binary X input object</legend>
      <RecQuantity label="EASE users" integer value={users} min={1} max={20} revision={revision} onChange={users=>resize(users,items)} />
      <RecQuantity label="EASE items" integer value={items} min={1} max={30} revision={revision} onChange={items=>resize(users,items)} />
      <button type="button" onClick={()=>{const X=state.X.map(row=>[...row]);X[state.cell[0]][state.cell[1]]=1-X[state.cell[0]][state.cell[1]];patch({X});}}>Toggle selected U{state.cell[0]}/I{state.cell[1]} binary value</button>
      <p>Select a cell in X above; binary 0 is an actual declared reconstruction target.</p></fieldset>
      <RecQuantity label="EASE penalty λ" value={state.lambda} min={0} max={10} revision={revision} onChange={lambda=>patch({lambda})} />
      <fieldset className="rec-flow-quantity"><legend>Reconstruction query</legend><RecSelect label="EASE target column" value={state.target} options={options(items,'I')} onChange={target=>patch({target:Number(target)})} />
        <RecSelect label="EASE query user" value={state.user} options={options(users,'U')} onChange={user=>patch({user:Number(user)})} /></fieldset></>}
    result={result.available?`U${state.user}/I${state.target} score ${n(result.scores[state.user][state.target])}; prohibited self coefficient 0. Direct excluded solve and P-column normalization agree. Full B stores ${items**2} weights; dense work terms UI²=${users*items**2}, I³=${items**3}.`:`Current λ ${n(state.lambda)}: ${result.reason} No hidden ridge or pseudoinverse is inserted.`}>
    <RecMatrix
      columnHues={Array.from({ length: items }, (_, k) => itemHue(k))} label="X: actual binary user×item data; selected editable cell" rows={state.X} columns={itemNames} rowNames={userNames} selected={state.cell} onSelect={(user,item)=>patch({cell:[user,item]})} />
    <div className="rec-flow-values"><Port hue={state.target}>Target column y = X_I{state.target}</Port><span>Prohibit B_{state.target},{state.target}=0 before solving</span><Wire /><strong>Z excludes I{state.target}</strong></div>
    {result.available?<><div className="rec-flow-parallel"><RecMatrix
      columnHues={result.others.map(itemHue)} label={`Z: allowed inputs ${result.others.map(item=>`I${item}`).join(', ')||'none'}`}
      rows={result.Z} columns={result.others.map(item=>`I${item}`)} rowNames={userNames} />
      <RecMatrix
      columnHues={[itemHue(state.target)]} label={`y: observed target I${state.target} column`} rows={result.y.map(value=>[value])} columns={[`I${state.target}`]} rowNames={userNames} /></div>
      <div className="rec-flow-values"><span>J(θ) = ‖y−Zθ‖² + λ‖θ‖²</span><Wire /><span>∇J = 2(ZᵀZ+λI)θ − 2Zᵀy = 0</span><Wire /><strong>A θ = b</strong></div>
      {result.others.length?<><div className="rec-flow-parallel"><RecMatrix
      columnHues={result.others.map(itemHue)} rowHues={result.others.map(itemHue)} label="Excluded-column A = ZᵀZ + λI" rows={result.A} columns={result.others.map(item=>`I${item}`)} rowNames={result.others.map(item=>`I${item}`)} />
        <RecMatrix
      rowHues={result.others.map(itemHue)} label="Excluded-column b = Zᵀy" rows={result.b.map(value=>[value])} columns={['b']} rowNames={result.others.map(item=>`I${item}`)} /></div>
        <RecOperands
      rowHues={result.others.map(itemHue)} label="Actual excluded equations, coefficient products and direct solved θ" headers={['Input coefficient','A row','θ vector','Left-side sum','b','Residual']}
          rows={result.A.map((row,k)=>[`I${result.others[k]}`,row.map(n).join(', '),result.excluded.p.map(n).join(', '),row.reduce((total,value,j)=>total+value*result.excluded.p[j],0),result.b[k],result.excluded.residual[k]])} /></>:<strong>One-item context has no allowed input; its sole coefficient is 0.</strong>}
      <div className="rec-flow-values"><span>Insert prohibited self coordinate as 0</span><Wire /><strong>B[:,I{state.target}] = ({result.column.map(n).join(', ')})</strong></div>
      <RecOperands
      rowHues={state.X[state.user].map((_, item) => itemHue(item))} label={`U${state.user}: allowed signed input products feed I${state.target}`} headers={['Input item','X user value','Direct coefficient','Product']}
        rows={state.X[state.user].map((value,item)=>[`I${item}${item===state.target?' self prohibited':''}`,value,result.column[item],value*result.column[item]])} />
      <div className="rec-flow-values"><span>Sum input products</span><Wire /><strong>{n(result.scores[state.user][state.target])}</strong></div>
      <RecMatrix
      columnHues={Array.from({ length: items }, (_, k) => itemHue(k))} rowHues={Array.from({ length: items }, (_, k) => itemHue(k))} label="G = XᵀX + λI: full item Gram for shared column actions" rows={result.G} columns={itemNames} rowNames={itemNames} />
      <div className="rec-flow-values"><span>G P = identity: solve each column action</span><Wire /><strong>P</strong></div>
      <RecMatrix
      columnHues={Array.from({ length: items }, (_, k) => itemHue(k))} rowHues={Array.from({ length: items }, (_, k) => itemHue(k))} label="P: full solved identity-column actions" rows={result.P} columns={itemNames} rowNames={itemNames} />
      <div className="rec-flow-array-operation"><div className="rec-flow-values"><Port hue={state.target}>Constraint e_jᵀB_j = 0</Port><span>Added term 2γ_j e_jᵀB_j</span><Wire /><span>G B_j = XᵀX_j − γ_j e_j</span></div>
        <div className="rec-flow-values"><span>X_j = X e_j</span><Wire /><span>B_j = e_j − (λ+γ_j) P_j</span><Wire /><span>Self entry: 0 = 1 − (λ+γ_j) P_jj</span></div>
        <div className="rec-flow-values"><Port hue={state.target}>P_jj {n(result.P[state.target][state.target])}</Port><Wire /><span>λ+γ = 1/P_jj {n(1/result.P[state.target][state.target])}</span><Wire /><strong>γ {n(result.gamma)}</strong></div>
      </div>
      <RecOperands
      rowHues={result.constraintResidual.map((_, item) => itemHue(item))} label="Multiplier enforces each gradient equation without a new tunable parameter" headers={['Coordinate','G B_j − XᵀX_j + γ e_j residual']}
        rows={result.constraintResidual.map((value,item)=>[`I${item}`,value])} />
      <RecMatrix
      columnHues={Array.from({ length: items }, (_, k) => itemHue(k))} rowHues={Array.from({ length: items }, (_, k) => itemHue(k))} label="B: each off-diagonal −P_ij/P_jj; crossed diagonal is prohibited self input 0" rows={result.B} columns={itemNames} rowNames={itemNames} zeroDiagonal />
      <RecMatrix
      columnHues={Array.from({ length: items }, (_, k) => itemHue(k))} label="All actual X B reconstruction scores; signed/asymmetric weights allowed" rows={result.scores} columns={itemNames} rowNames={userNames} selected={[state.user,state.target]} />
    </>:<><RecMatrix
      columnHues={Array.from({ length: items }, (_, k) => itemHue(k))} rowHues={Array.from({ length: items }, (_, k) => itemHue(k))} label="Unavailable current full Gram" rows={result.G} columns={itemNames} rowNames={itemNames} /><strong>{result.reason}</strong></>}
  </RecFigure>;
}
