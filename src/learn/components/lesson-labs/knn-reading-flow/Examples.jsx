import { createContext, useContext, useState } from 'react';
import { Prose } from "../../content";
import { RunnableExample } from "../RunnableExample.jsx";
import examples from "../../../data/knn-reading-flow-examples.js";
import "./reading-flow.css";
const State = createContext(null);
export function ReadingState({
  children
}) {
  const [query, setQuery] = useState([3.1, 2.9]),
    [k, setK] = useState(5),
    [metric, setMetric] = useState('euclidean'),
    [weight, setWeight] = useState('uniform'),
    [resetKey, setResetKey] = useState(0);
  function reset() {
    setQuery([3.1, 2.9]);
    setK(5);
    setMetric('euclidean');
    setWeight('uniform');
    setResetKey(x => x + 1);
  }
  return <State.Provider value={{
    query,
    setQuery,
    k,
    setK,
    metric,
    setMetric,
    weight,
    setWeight,
    reset,
    resetKey
  }}>{children}</State.Provider>;
}
export const useReadingState = () => useContext(State);
export function NewExample({
  id,
  children
}) {
  const example = examples.find(row => row.id === id);
  if (!example) throw new Error('Missing complete example: ' + id);
  return <><Prose><strong>Before running:</strong> {example.question}</Prose><RunnableExample example={example}>{children}</RunnableExample></>;
}
export function FileLinks() {
  return <Prose>For offline reproduction, save the <a href="/learn-code/k-nearest-neighbors/wine-data.csv">Wine CSV</a>, its <a href="/learn-code/k-nearest-neighbors/wine-provenance.json">attribution and source hash</a>, and <a href="/learn-code/k-nearest-neighbors/wine-result.json">saved experiment and inspector state</a> with the complete programs. The reader's file index gathers code, outputs and supporting assets; Copy and Download report their status beside each code block.</Prose>;
}
