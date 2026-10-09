let current;
export function loadTopicResource() {
  current ||= import('./manifold-lesson.jsx').then(module => module.default).catch(error => { current = null; throw error; });
  return current;
}
