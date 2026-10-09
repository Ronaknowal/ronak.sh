import{createContext,useContext,useMemo,useState}from'react';
import{RATE_DISTORTION_SCENARIOS}from'../../data/rate-distortion-models.js';
import{baHistory}from'../../data/rate-distortion-reading-models.js';
const defaults={book:{p:.5,words:[0,7],selected:3,message:''},backward:{p:.2,D:.1,cell:1},frontier:{p:.5,D:.25,lambda:2},ba:{scenario:'binary',lambda:2,start:'positive',mass:.5,step:0,row:0},gaussian:{v:9,D:2.25,x:3},allocation:{v1:9,v2:1,D:3,message:''},fidelity:{rule:'independent',prevalence:.5,cell:1},cost:{multiplier:1,lambda:.1,zero:false,row:2},bytes:{source:'000001010011100101110111',block:0,mode:'valid'}};
const Context=createContext(null);
export function RateDistortionProvider({children}){const[state,setState]=useState(defaults),[revision,setRevision]=useState({});const update=(name,patch)=>setState(old=>({...old,[name]:{...old[name],...patch}}));const reset=name=>{setState(old=>({...old,[name]:{...defaults[name]}}));setRevision(old=>({...old,[name]:(old[name]||0)+1}));};const b=state.ba,c=state.cost;
const ba=useMemo(()=>{const s=RATE_DISTORTION_SCENARIOS[b.scenario];return baHistory({...s,lambda:b.lambda,initial:b.start==='locked'?s.source.map((_,i)=>i===0?1:0):b.scenario==='binary'?[1-b.mass,b.mass]:null})},[b.scenario,b.lambda,b.start,b.mass]);
const cost=useMemo(()=>baHistory({source:[.7,.2,.1],costs:[0,1,3].map((x,i)=>[0,1,3].map(y=>c.zero?0:(x-y)**2*(i===2?c.multiplier:1))),lambda:c.lambda,iterations:500,fixed:true}),[c.multiplier,c.lambda,c.zero]);
return <Context.Provider value={{state,update,reset,revision,ba,cost}}>{children}</Context.Provider>}
export function useInvestigation(name){const c=useContext(Context);return[c.state[name],patch=>c.update(name,patch),()=>c.reset(name),c.revision[name]||0]}
export const useBA=()=>useContext(Context).ba;
export const useCost=()=>useContext(Context).cost;
