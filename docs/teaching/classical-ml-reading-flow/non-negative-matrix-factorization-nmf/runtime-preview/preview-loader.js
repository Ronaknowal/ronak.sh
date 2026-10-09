let current;
export function loadTopicResource(){current ||= import('./nmf-lesson.jsx').then(module=>module.default).catch(error=>{current=null;throw error;});return current;}
