import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import TopicContent from '../../../../../../../../src/learn/components/TopicContent.jsx';
import { topicMap } from '../../../../../../../../src/learn/data/catalogue.js';
import '../../../../../../../../src/learn/learning-base.css';
import '../../lesson.css';
import '../../preview.css';
import './readability.css';

const topic = {
  ...topicMap['non-negative-matrix-factorization-nmf'],
  status: 'published',
  readTime: '~120 min core reading · code and practice in separate sittings'
};
function Preview() {
  const [complete, setComplete] = useState(false);
  const [textSize, setTextSize] = useState('16');
  useEffect(() => {
    const previous = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = `${textSize}px`;
    return () => { document.documentElement.style.fontSize = previous; };
  }, [textSize]);
  return <div className="nmf-private-shell">
    <label className="nmf-preview-text-control">Preview text size
      <select value={textSize} onChange={event => setTextSize(event.target.value)}>
        <option value="16">100% text</option><option value="32">200% text</option>
      </select>
    </label>
    <p className="nmf-private-label">Private NMF author preview</p>
    <TopicContent topic={topic} context={{ href: '/learn/path/full-curriculum', title: 'Classical Machine Learning' }}
      basePath="/learn/path/full-curriculum" isComplete={() => complete} toggleComplete={() => setComplete(v => !v)} />
  </div>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><Preview /></BrowserRouter>);
