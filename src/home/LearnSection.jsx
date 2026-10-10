import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { curriculumSummary, exampleRoute } from "../learn/data/generated/home-summary.js";
import CurriculumIndex from "./CurriculumIndex.jsx";
import RouteLine from "./RouteLine.jsx";
import RouteSearch from "./RouteSearch.jsx";
import { ID, planRoute, toRouteView } from "./route.js";
import { suggestions } from "./suggestions.js";
import { useHomeIndex } from "./useHomeIndex.js";
import { useReducedMotion } from "./useReducedMotion.js";

export default function LearnSection() {
  const homeIndex = useHomeIndex();
  const reduced = useReducedMotion();
  const [view, setView] = useState(exampleRoute);
  const [chip, setChip] = useState(exampleRoute.goal.id);
  const [request, setRequest] = useState(null);
  const routeRef = useRef(null);

  useEffect(() => {
    if (!request || homeIndex.status !== "ready") return;
    const { lessons, tracks } = homeIndex.index;
    const goal = lessons.findIndex(lesson => lesson[ID] === request.id);
    setRequest(null);
    if (goal < 0) return;
    setView(toRouteView(lessons, planRoute(lessons, goal), Object.fromEntries(tracks.map(track => [track.id, track.title]))));
    if (request.scroll) routeRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }, [request, homeIndex.status, homeIndex.index, reduced]);

  const select = (id, { chipId = null, scroll = false } = {}) => {
    setChip(chipId);
    setRequest({ id, scroll });
    homeIndex.load();
  };

  return (
    <section className="home-block" aria-labelledby="learn-title">
      <div className="home-block__head">
        <p className="home-block__label">01 — Learn</p>
        <div>
          <h2 id="learn-title">Where do you want to go?</h2>
          <p>Name a concept. You’ll get the lessons that lead to it, in order, across every track they pass through.</p>
        </div>
      </div>
      <div className="home-block__body">
        <RouteSearch homeIndex={homeIndex} onSelect={id => select(id)} />
        <div className="home-chips" role="group" aria-label="Suggested destinations">
          {suggestions.map(suggestion => (
            <button key={suggestion.id} type="button" className="home-chip" aria-pressed={chip === suggestion.id} onClick={() => select(suggestion.id, { chipId: suggestion.id })}>{suggestion.label}</button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{`Route to ${view.goal.title}: ${view.stops.length} stops before it.`}</p>
        <div ref={routeRef}><RouteLine key={view.goal.id} view={view} /></div>
        <CurriculumIndex homeIndex={homeIndex} summary={curriculumSummary} onSelect={id => select(id, { scroll: true })} />
        <nav className="home-also" aria-label="More ways to learn">
          <Link to="/learn/paths">Follow a guided path <span aria-hidden="true">→</span></Link>
          <Link to="/learn/projects">Build a project end to end <span aria-hidden="true">→</span></Link>
        </nav>
      </div>
    </section>
  );
}
