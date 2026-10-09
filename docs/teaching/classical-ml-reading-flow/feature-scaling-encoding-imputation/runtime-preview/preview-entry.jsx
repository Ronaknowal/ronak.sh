import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import TopicContent from '../../../../../src/learn/components/TopicContent.jsx';
import { topicMap } from '../../../../../src/learn/data/catalogue.js';
import '../../../../../src/learn/learning-base.css';
import './lesson.css';
import './preview.css';
const topic = {
  ...topicMap['feature-scaling-encoding-imputation'],
  status: 'published',
  readTime: '~110 min core reading · deeper code and practice in separate sittings'
};
function Preview() {
  const [complete, setComplete] = useState(false);
  return <div className="prep-private-shell"><p className="prep-private-label">Private Feature Scaling, Encoding &amp; Imputation author preview</p><TopicContent topic={topic} context={{
      href: '/learn/path/full-curriculum',
      title: 'Classical Machine Learning'
    }} basePath="/learn/path/full-curriculum" isComplete={() => complete} toggleComplete={() => setComplete(value => !value)} /></div>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><Preview /></BrowserRouter>);
