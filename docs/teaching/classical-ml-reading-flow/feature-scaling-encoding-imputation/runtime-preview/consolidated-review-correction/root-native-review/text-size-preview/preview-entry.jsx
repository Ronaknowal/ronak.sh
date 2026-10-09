import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import TopicContent from '../../../../../../../../src/learn/components/TopicContent.jsx';
import { topicMap } from '../../../../../../../../src/learn/data/catalogue.js';
import '../../../../../../../../src/learn/learning-base.css';
import '../../lesson.css';
import '../../preview.css';
const topic = {
  ...topicMap['feature-scaling-encoding-imputation'],
  status: 'published',
  readTime: '~110 min core reading · deeper code and practice in separate sittings'
};
function Preview() {
  const [complete, setComplete] = useState(false);
  const [textSize, setTextSize] = useState('16');
  useEffect(() => {
    const previous = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = `${textSize}px`;
    return () => { document.documentElement.style.fontSize = previous; };
  }, [textSize]);
  return <div className="prep-private-shell">
    <label htmlFor="feature20-preview-text-size">Preview text size</label>
    <select id="feature20-preview-text-size" value={textSize} onChange={event => setTextSize(event.target.value)}>
      <option value="16">100% text</option>
      <option value="32">200% text</option>
    </select>
    <p className="prep-private-label">Private Feature Scaling, Encoding &amp; Imputation author preview</p><TopicContent topic={topic} context={{
      href: '/learn/path/full-curriculum',
      title: 'Classical Machine Learning'
    }} basePath="/learn/path/full-curriculum" isComplete={() => complete} toggleComplete={() => setComplete(value => !value)} /></div>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><Preview /></BrowserRouter>);
