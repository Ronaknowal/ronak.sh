import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ID, PUBLISHED, SECTION, TITLE, TRACK } from "./route.js";

function Highlight({ text, query }) {
  const at = query ? text.toLowerCase().indexOf(query) : -1;
  if (at < 0) return text;
  return <>{text.slice(0, at)}<mark>{text.slice(at, at + query.length)}</mark>{text.slice(at + query.length)}</>;
}

function trackStatus(lessons) {
  const open = lessons.filter(lesson => lesson[PUBLISHED]).length;
  if (open === lessons.length) return { text: `all ${open} open`, full: true };
  return { text: open ? `${open} of ${lessons.length} open` : `${lessons.length} planned`, full: false };
}

export default function CurriculumIndex({ homeIndex, summary, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [openTracks, setOpenTracks] = useState(() => new Set());
  const panelId = useId();
  const { status, index, load } = homeIndex;
  const query = filter.trim().toLowerCase();

  const byTrack = useMemo(() => {
    const groups = new Map();
    index?.lessons.forEach(lesson => { if (!groups.has(lesson[TRACK])) groups.set(lesson[TRACK], []); groups.get(lesson[TRACK]).push(lesson); });
    return groups;
  }, [index]);

  const stages = useMemo(() => {
    if (!index) return [];
    const grouped = new Set(index.groups.flatMap(group => group.trackIds));
    const others = index.tracks.map(track => track.id).filter(id => !grouped.has(id) && byTrack.has(id));
    return others.length ? [...index.groups, { id: "other", label: "Other tracks", trackIds: others }] : index.groups;
  }, [index, byTrack]);

  const titles = useMemo(() => Object.fromEntries((index?.tracks ?? []).map(track => [track.id, track.title])), [index]);

  const toggleTrack = id => setOpenTracks(current => {
    const next = new Set(current);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const allExpanded = index && openTracks.size >= index.tracks.length;

  let anyVisible = false;
  const renderedStages = stages.map(stage => {
    const [number, ...rest] = stage.label.split("/");
    const name = rest.length ? rest.join("/").trim() : stage.label;
    const rows = stage.trackIds.map(trackId => {
      const all = byTrack.get(trackId) ?? [];
      const visible = all.filter(lesson => (!openOnly || lesson[PUBLISHED]) && (!query || lesson[TITLE].toLowerCase().includes(query)));
      if (!visible.length) return null;
      anyVisible = true;
      // While filtering, matching tracks start open and a click collapses them.
      const expanded = query ? !openTracks.has(trackId) : openTracks.has(trackId);
      const badge = query ? { text: `${visible.length} ${visible.length === 1 ? "match" : "matches"}`, full: true } : trackStatus(all);
      const lessonsId = `${panelId}-${trackId}`;
      const sections = new Map();
      if (expanded) visible.forEach(lesson => { if (!sections.has(lesson[SECTION])) sections.set(lesson[SECTION], []); sections.get(lesson[SECTION]).push(lesson); });
      return (
        <div className="home-track" key={trackId}>
          <button type="button" aria-expanded={expanded} aria-controls={lessonsId} onClick={() => toggleTrack(trackId)}>
            <span className="home-track__name">{titles[trackId] ?? trackId}</span>
            <span className={`home-track__status${badge.full ? " is-full" : ""}`}>{badge.text}</span>
            <span className="home-track__chevron" aria-hidden="true" />
          </button>
          {expanded && (
            <div className="home-track__lessons" id={lessonsId}>
              {[...sections].map(([section, lessons]) => (
                <div className="home-track__section" key={section}>
                  <h5>{section || "Lessons"}</h5>
                  {lessons.map(lesson => (
                    <button key={lesson[ID]} type="button" className={`home-lesson${lesson[PUBLISHED] ? " is-open" : ""}`} onClick={() => onSelect(lesson[ID])}>
                      <i aria-hidden="true" />
                      <span><Highlight text={lesson[TITLE]} query={query} /><span className="sr-only">{lesson[PUBLISHED] ? " (open now)" : " (planned)"}</span></span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }).filter(Boolean);
    if (!rows.length) return null;
    return (
      <div className="home-stage" key={stage.id}>
        <h4><span>{number.trim()}</span>{name}</h4>
        {rows}
      </div>
    );
  });

  return (
    <div className="home-curriculum">
      <button type="button" className="home-curriculum__toggle" aria-expanded={isOpen} aria-controls={panelId}
        onClick={() => { setIsOpen(open => !open); load(); }}>
        <span>
          <strong>Or open the whole curriculum</strong>
          <small>{summary.lessons.toLocaleString()} lessons · {summary.tracks} tracks · {summary.stages} stages · {summary.open} open now</small>
        </span>
        <span className="home-curriculum__plus" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="home-curriculum__panel" id={panelId}>
          {status === "error" ? <p className="home-curriculum__empty">Lessons could not load. <Link to="/learn/catalogue">Browse the catalogue →</Link></p>
            : status !== "ready" ? <p className="home-curriculum__empty">Loading lessons…</p>
            : (
              <>
                <div className="home-curriculum__tools">
                  <input type="search" aria-label="Filter lessons" placeholder="Filter every lesson…" value={filter} onChange={event => {
                    const next = event.target.value;
                    if (Boolean(next.trim()) !== Boolean(query)) setOpenTracks(new Set());
                    setFilter(next);
                  }} />
                  <button type="button" className="home-chip" aria-pressed={openOnly} onClick={() => setOpenOnly(value => !value)}>open now only</button>
                  {!query && <button type="button" className="home-chip" onClick={() => setOpenTracks(allExpanded ? new Set() : new Set(index.tracks.map(track => track.id)))}>{allExpanded ? "collapse all" : "expand all"}</button>}
                </div>
                {renderedStages}
                {!anyVisible && <p className="home-curriculum__empty">No lesson matches that yet.</p>}
              </>
            )}
        </div>
      )}
    </div>
  );
}
