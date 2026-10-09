import { useCodeDownload } from "../content/LessonCodeDownloads.jsx";
import { pcaFiles } from "../../data/pca-file-catalog.js";

function FileRegistration({ file }) {
  useCodeDownload({ filename: file.filename, kind: 'asset',
    downloadUrl: file.url, title: file.description });
  return null;
}

// Register exact companion/output files in the shared index without duplicating
// its UI or fetching any source before the learner reaches its code view.
export function PcaSupportingFiles() {
  return <>{pcaFiles.map(file => <FileRegistration key={file.url} file={file} />)}</>;
}
