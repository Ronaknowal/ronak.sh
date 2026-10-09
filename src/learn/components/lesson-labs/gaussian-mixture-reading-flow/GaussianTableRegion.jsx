import { Children, cloneElement, isValidElement, useId } from 'react';
import './gaussian-table-readability.css';

// Keep each table's existing caption and header relationships. The caption also
// names its keyboard-scrollable viewport without adding a second visible title.
export function GaussianTableRegion({ children }) {
  const captionId = useId();
  const tableChildren = Children.map(children.props.children, child =>
    isValidElement(child) && child.type === 'caption'
      ? cloneElement(child, { id: captionId })
      : child
  );
  return (
    <div className="gmm-readable-table-region" role="region" tabIndex={0} aria-labelledby={captionId}>
      {cloneElement(children, null, tableChildren)}
    </div>
  );
}
