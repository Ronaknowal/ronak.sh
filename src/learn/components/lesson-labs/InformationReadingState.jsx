import {createContext,useContext,useMemo,useState} from 'react';
import {binaryChannel,finiteInformation,bottleneckRepresentation,bottleneckIterations,variationalInformationBounds,sampledInformation} from '../../data/mutual-information-models.js';
import {iterationTraces,sampleWithDonors} from '../../data/information-reading-models.js';
const Context=createContext(null);
const defaults={joint:{preset:'channel',prevalence:.5,error:.2,row:0,cell:0},xor:{bias:.5,reveal:'a'},processing:{label:.1,encoder:.2},plane:{mode:'signal',beta:3,noise:.2},iteration:{start:'signal',beta:3,error:.1,step:0,row:0},bounds:{reference:.5,decoder:.26,beta:3},gaussian:{sigma:.5,scale:1,draft:'.5',message:''},sample:{mode:'independent',categories:4,count:100,seed:831,draft:'831',message:'',permutation:0},observed:{year:'all',grouping:'full'}};
export function InformationProvider({children}){
 const [state,setState]=useState(defaults),[revision,setRevision]=useState({});
 const update=(name,patch)=>setState(old=>({...old,[name]:{...old[name],...patch}}));
 const reset=name=>{setState(old=>({...old,[name]:{...defaults[name]}}));setRevision(old=>({...old,[name]:(old[name]||0)+1}));};
 const it=state.iteration,sa=state.sample;
 const traces=useMemo(()=>iterationTraces(it),[it.beta,it.error,it.start]);
 const sample=useMemo(()=>sampleWithDonors(sa),[sa.mode,sa.categories,sa.count,sa.seed]);
 return <Context.Provider value={{state,update,reset,revision,traces,sample}}>{children}</Context.Provider>;
}
export function useInvestigation(name){const context=useContext(Context);return [context.state[name],patch=>context.update(name,patch),()=>context.reset(name),context.revision[name]||0];}
export function jointLaw(s){return s.preset==='unequal'?finiteInformation([[.675,.075],[.125,.125]]):s.preset==='equal'?finiteInformation([[.45,.15],[.1,.3]]):binaryChannel(s.prevalence,s.error);}
export function useIteration(){return useContext(Context).traces;}
export function useSample(){return useContext(Context).sample;}
export {bottleneckRepresentation,variationalInformationBounds,sampledInformation};
