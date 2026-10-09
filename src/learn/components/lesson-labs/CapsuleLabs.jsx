import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';

export const capsuleAsset = '/learn-assets/capsule-networks/';

export function CapsuleProgram({ file = 'capsule-learning.py', title = 'Read the complete trainable capsule program' }) {
  return <RemoteCodeBlock source={capsuleAsset + file} language="python" filename={file} title={title} />;
}
