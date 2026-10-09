import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import TopicContent from '../../../../../src/learn/components/TopicContent.jsx';
import { topicMap } from '../../../../../src/learn/data/catalogue.js';
import '../../../../../src/learn/learning-base.css';
import './manifold-reader.css';
const id = 't-sne-umap-manifold-learning';
const topic = { ...topicMap[id], status: 'published', readTime: '~100 min read + 120 min practice' };
function PreviewReader() {
  const [complete, setComplete] = useState(false);
  return <div className="manifold-private-shell"><p className="manifold-private-label">Private author preview · complete manuscript and mechanisms · publication remains with Root</p><TopicContent topic={topic} context={{ href: '/learn/path/full-curriculum', title: 'Classical Machine Learning' }} basePath="/learn/path/full-curriculum" isComplete={() => complete} toggleComplete={() => setComplete(v => !v)} /></div>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><PreviewReader /></BrowserRouter>);
