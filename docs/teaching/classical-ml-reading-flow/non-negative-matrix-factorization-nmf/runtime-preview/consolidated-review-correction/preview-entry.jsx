import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import TopicContent from '../../../../../../src/learn/components/TopicContent.jsx';
import { topicMap } from '../../../../../../src/learn/data/catalogue.js';
import '../../../../../../src/learn/learning-base.css';
import './lesson.css';
import './preview.css';
const topic = {
  ...topicMap['non-negative-matrix-factorization-nmf'],
  status: 'published',
  readTime: '~120 min core reading · code and practice in separate sittings'
};
function Preview() {
  const [complete, setComplete] = useState(false);
  return <div className="nmf-private-shell"><p className="nmf-private-label">Private NMF author preview</p><TopicContent topic={topic} context={{
      href: '/learn/path/full-curriculum',
      title: 'Classical Machine Learning'
    }} basePath="/learn/path/full-curriculum" isComplete={() => complete} toggleComplete={() => setComplete(v => !v)} /></div>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><Preview /></BrowserRouter>);
