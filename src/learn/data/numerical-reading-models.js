import { derivativeEstimate, pumpCalibration, pumpVolume, compositeQuadrature } from './numerical-methods-models.js';

export function finiteDifference(x, exponent, stencil, offset) {
  const h = 10 ** -exponent;
  const denominator = h ** (stencil === 'second' ? 2 : 1);
  const result = derivativeEstimate(x, h, stencil, offset);
  if (!Number.isFinite(denominator) || denominator === 0 || result.estimate !== null && !Number.isFinite(result.estimate)) {
    return { ...result, h, estimate: null, error: null, status: 'unrepresentable denominator or nonfinite quotient' };
  }
  return { ...result, h, denominator };
}

export function quadratureState(fixture, n, method) {
  const f = fixture === 'sine' ? Math.sin : x => x*x;
  const upper = fixture === 'sine' ? Math.PI : 1;
  return { ...compositeQuadrature(f, 0, upper, n, method), f, upper, reference: fixture === 'sine' ? 2 : 1/3 };
}

export function nestedSearch(target=.8, tolerance=.01, maximum=128) {
  if (!Number.isFinite(target) || !(pumpVolume(2)<target && target<pumpVolume(4))) throw new RangeError('Target must be strictly between V(2) and V(4).');
  if (!Number.isFinite(tolerance) || tolerance<.0001 || tolerance>1) throw new RangeError('Use a time tolerance from .0001 through 1 minute.');
  if (!Number.isInteger(maximum) || maximum<8 || maximum>1024) throw new RangeError('Maximum panels must be an integer from 8 through 1024.');
  let lower=2,upper=4;
  const rows=[];
  for (let outer=0;outer<60;outer++) {
    const candidate=lower+(upper-lower)/2,radius=(upper-lower)/2;
    if (radius<=tolerance || candidate===lower || candidate===upper) {
      rows.push({lower,upper,candidate,radius,outer,panels:null,status:radius<=tolerance?'bracket time tolerance':'arithmetic stagnation',action:'stop',after:[lower,upper]});
      return rows;
    }
    let panels=8;
    while (true) {
      const state=pumpCalibration(target,panels,candidate);
      const row={...state,lower,upper,radius,outer,status:'inner evaluation',action:'refine integral',after:[lower,upper]};
      rows.push(row);
      // Branch order matches the preserved locate_target programme exactly.
      if (state.timeBound<=tolerance) { row.status='conditional time tolerance';row.action='stop';return rows; }
      if (state.residual>state.integralBound) { upper=candidate;row.action='retain lower half';row.after=[lower,upper];break; }
      if (state.residual < -state.integralBound) { lower=candidate;row.action='retain upper half';row.after=[lower,upper];break; }
      if (panels===maximum) { row.status='unresolved integral sign';row.action='stop at panel limit';return rows; }
      panels=Math.min(2*panels,maximum);
    }
  }
  rows.push({lower,upper,candidate:lower+(upper-lower)/2,radius:(upper-lower)/2,outer:60,panels:null,status:'outer step limit',action:'stop',after:[lower,upper]});
  return rows;
}

export function panelDetail(f,a,b) {
  const m=(a+b)/2,l=(a+m)/2,r=(m+b)/2;
  const xs=[a,l,m,r,b],values=xs.map(f);
  const coarse=(b-a)/6*(values[0]+4*values[2]+values[4]);
  const refined=(b-a)/12*(values[0]+4*values[1]+2*values[2]+4*values[3]+values[4]);
  return { xs,values,coarse,refined,difference:refined-coarse,error:Math.abs(refined-coarse)/15,corrected:refined+(refined-coarse)/15 };
}

export const discharge = [9640,9640,9730,9730,9640,9640,9640,9640,9640];
export const dischargeTimes = discharge.map((_,i)=>900*i);
