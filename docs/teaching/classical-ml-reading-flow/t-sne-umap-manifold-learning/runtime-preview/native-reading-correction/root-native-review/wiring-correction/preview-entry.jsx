import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import TopicContent from '../../../../../../../../src/learn/components/TopicContent.jsx';
import {topicMap} from '../../../../../../../../src/learn/data/catalogue.js';
import '../../../../../../../../src/learn/learning-base.css';
import '../../manifold-reader.css';
import './wiring.css';
const id='t-sne-umap-manifold-learning';
const topic={...topicMap[id],status:'published',readTime:'~100 min read + 120 min practice'};
function PreviewReader() {
  const [complete,setComplete]=useState(false),[textSize,setTextSize]=useState('16');
  useEffect(()=>{
    const previous=document.documentElement.style.fontSize;
    document.documentElement.style.fontSize=`${textSize}px`;
    return ()=>{document.documentElement.style.fontSize=previous;};
  },[textSize]);
  return <div className="manifold-private-shell">
    <p className="manifold-private-label">Private author preview · complete manuscript and mechanisms · publication remains with Root</p>
    <label className="manifold-preview-controls">Preview text size<select aria-label="Preview text size" value={textSize} onChange={event=>setTextSize(event.target.value)}><option value="16">100% ·16px</option><option value="32">200% ·32px</option></select></label>
    <TopicContent topic={topic} context={{href:'/learn/path/full-curriculum',title:'Classical Machine Learning'}} basePath="/learn/path/full-curriculum" isComplete={()=>complete} toggleComplete={()=>setComplete(value=>!value)}/>
  </div>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><PreviewReader/></BrowserRouter>);
