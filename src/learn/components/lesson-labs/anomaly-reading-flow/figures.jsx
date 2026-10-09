import React from 'react';
import {ObservationFigure} from './AnomalyObservationFigures.jsx';
import {IsolationFigure,IsolationProvider} from './IsolationFigures.jsx';
import {LofFigure} from './LofFigures.jsx';
import {OneClassFigure} from './OneClassFigures.jsx';
import {PolicyFigure,TemperatureProvider} from './AnomalyPolicyFigures.jsx';
export function AnomalyContext({children}){return <IsolationProvider><TemperatureProvider>{children}</TemperatureProvider></IsolationProvider>;}
export function Mechanism({id}){const n=Number(id.slice(1));if(n>=1&&n<=12)return <ObservationFigure id={id}/>;if(n<=27)return <IsolationFigure id={id}/>;if(n<=42)return <LofFigure id={id}/>;if(n<=55)return <OneClassFigure id={id}/>;if(n<=70)return <PolicyFigure id={id}/>;throw Error('Unknown accepted mechanism '+id);}
