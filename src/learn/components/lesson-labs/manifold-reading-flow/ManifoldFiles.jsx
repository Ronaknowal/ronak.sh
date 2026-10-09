import React, { useCallback } from 'react';
import { useCodeDownload } from '../../content/LessonCodeDownloads.jsx';
import bundle from '../../../data/manifold-reading-flow/file-index.json';
export const assetPrefix = '/learn-assets/manifold-learning/';
function RegisterFile({ file }) {
  const text = useCallback(() => '', []);
  useCodeDownload({ filename: file.destination.split('/').at(-1), downloadUrl: assetPrefix + file.destination, title: file.role, language: file.destination.endsWith('.py') ? 'python' : 'text', kind: 'asset', getText: text });
  return null;
}
export default function PrivateFiles() { return bundle.files.map(file => <RegisterFile key={file.destination} file={file} />); }
