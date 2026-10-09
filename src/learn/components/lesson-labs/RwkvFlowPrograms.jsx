import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';

/** Load one requested programme near its instructional position. */
export function RwkvProgram({
  file,
  title
}) {
  return <RemoteCodeBlock source={`/learn-code/rwkv-linear-attention-models/${file}`} language="python" filename={file} title={title} />;
}
