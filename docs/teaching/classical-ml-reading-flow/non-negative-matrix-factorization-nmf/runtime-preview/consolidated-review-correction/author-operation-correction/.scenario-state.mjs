import React from 'react';export function scenarioState(initial){const s=globalThis.__nmfScopedState,i=s.index++;return React.useState(i<s.values.length?s.values[i]:initial);}
