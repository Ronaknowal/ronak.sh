import { useCodeDownload } from '../content/LessonCodeDownloads.jsx';

function FileRegistration({ file }) {
  useCodeDownload({ filename: file.filename, language: file.filename.endsWith('.py') ? 'python' : 'text', kind: 'asset', downloadUrl: '/learn-code/multi-label-multi-output-learning/' + file.filename, title: file.title });
  return null;
}

// Register exact supporting assets in the Reader's single shared file index.
// Registration neither fetches code/data nor creates a second local index.
export function MultiLabelSupportingFiles({ files }) {
  return <>{files.map(file => <FileRegistration key={file.filename} file={file} />)}</>;
}
