import { useEffect, useState } from 'react';
import useLessonViewport from './useLessonViewport.js';

const acceptResource = value => value;

export function useSavedStudyResource(url, validate = acceptResource) {
  const [anchor, ready] = useLessonViewport();
  const [resource, setResource] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!ready) return undefined;
    const controller = new AbortController();
    setResource(null);
    setError(false);
    fetch(url, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Saved resource unavailable.');
      return response.json();
    }).then(value => {
      const checked = validate(value);
      if (!controller.signal.aborted) setResource({ url, value: checked });
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [url, ready, attempt, validate]);
  return { anchor, ready, data: resource?.url === url ? resource.value : null,
    error, retry: () => setAttempt(value => value + 1) };
}

export function SavedStudyStatus({ resource }) {
  return resource.error
    ? <p role="alert">The saved graph evidence could not be loaded. <button type="button" onClick={resource.retry}>Retry saved graph evidence</button></p>
    : <p role="status">{resource.ready ? 'Loading the saved graph evidence…' : 'Saved graph evidence loads as this explanation approaches.'}</p>;
}
