import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collapseRoute } from "./route.js";

export default function RouteLine({ view }) {
  const [expanded, setExpanded] = useState(false);
  const lineRef = useRef(null);
  const all = [...view.stops, view.goal];
  const items = expanded ? all.map(item => ({ item })) : collapseRoute(all);
  const trackCount = new Set(all.map(lesson => lesson.trackId)).size;
  const open = view.stops.filter(lesson => lesson.published).length;
  const first = view.stops[0] ?? view.goal;
  let previousTrack = null;

  useEffect(() => { if (expanded) lineRef.current?.focus(); }, [expanded]);

  return (
    <div className="home-route">
      <div className="home-route__meta">
        <h3>Route to <strong>{view.goal.title}</strong></h3>
        <p>{view.stops.length} {view.stops.length === 1 ? "stop" : "stops"} before it · {trackCount} {trackCount === 1 ? "track" : "tracks"} · {open} open now</p>
      </div>
      {view.fallback && <p className="home-route__note">No prerequisites are recorded for this lesson yet, so this shows the lessons before it in its section.</p>}
      {!view.stops.length && <p className="home-route__note">This is a starting point: nothing is required before it.</p>}
      <ol className="home-route__line" ref={lineRef} tabIndex={-1} aria-label={`Route to ${view.goal.title}`}>
        {items.map((entry, position) => {
          if (entry.gap) {
            previousTrack = null;
            return (
              <li key="gap" className="home-stop home-stop--gap" style={{ "--stop-delay": `${position * 60}ms` }}>
                <span className="home-stop__track" />
                <i aria-hidden="true" />
                <button type="button" onClick={() => setExpanded(true)}>+{entry.gap} stops</button>
              </li>
            );
          }
          const lesson = entry.item;
          const changed = lesson.trackId !== previousTrack;
          previousTrack = lesson.trackId;
          const isGoal = lesson === view.goal;
          return (
            <li key={lesson.id} className={`home-stop${lesson.published ? " home-stop--open" : ""}${isGoal ? " home-stop--goal" : ""}`} style={{ "--stop-delay": `${position * 60}ms` }}>
              <span className="home-stop__track">{changed ? lesson.trackTitle : ""}</span>
              <i aria-hidden="true" />
              <span className="home-stop__title">{lesson.title}<span className="sr-only">{lesson.published ? " (open now)" : " (planned)"}</span></span>
            </li>
          );
        })}
      </ol>
      <div className="home-route__foot">
        <p className="home-route__legend" aria-hidden="true"><span><i className="is-open" />open now</span><span><i />planned</span></p>
        <Link className="home-route__start" to={`/learn/topic/${first.id}`}>{view.stops.length ? "Start this route" : "Open the lesson"} <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}
