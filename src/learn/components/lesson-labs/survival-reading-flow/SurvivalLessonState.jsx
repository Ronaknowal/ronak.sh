import { createContext, useContext, useMemo, useState } from 'react';
const SurvivalState=createContext(null);
export function SurvivalLessonState({children}) {
  const [coefficient,setCoefficient]=useState(Math.log(2)),[jointLogitChange,setJointLogitChange]=useState(0);
  const value=useMemo(()=>({coefficient,setCoefficient,jointLogitChange,setJointLogitChange}),[coefficient,jointLogitChange]);
  return <SurvivalState.Provider value={value}>{children}</SurvivalState.Provider>;
}
export function useSurvivalState(){const state=useContext(SurvivalState);if(!state)throw Error('Survival shared-state figures need their lesson provider.');return state;}
