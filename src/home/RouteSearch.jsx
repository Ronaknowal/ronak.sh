import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ID, PUBLISHED, TITLE, ancestors, searchLessons } from "./route.js";

export default function RouteSearch({ homeIndex, onSelect }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const { status, index, load } = homeIndex;
  const results = status === "ready" ? searchLessons(index.lessons, query) : [];
  const showList = open && query.trim() !== "";

  const choose = position => {
    const lesson = index.lessons[results[position]];
    setQuery(lesson[TITLE]);
    setOpen(false);
    onSelect(lesson[ID]);
  };

  const onKeyDown = event => {
    if (event.key === "Escape") { setOpen(false); return; }
    if (!showList || !results.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(current => (current + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
    }
    if (event.key === "Enter") { event.preventDefault(); choose(active); }
  };

  return (
    <div className="home-ask" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <span aria-hidden="true">→</span>
      <input
        role="combobox" aria-label="Search for a concept" aria-autocomplete="list" aria-expanded={showList} aria-controls={listId}
        aria-activedescendant={showList && results.length ? `${listId}-${active}` : undefined}
        placeholder="transformers, backprop, CUDA kernels…" autoComplete="off" value={query}
        onFocus={load} onKeyDown={onKeyDown}
        onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); load(); }}
      />
      {showList && (
        <ul id={listId} role="listbox" className="home-ask__results">
          {status === "error" ? <li className="home-ask__status">Lessons could not load. <Link to="/learn/catalogue">Browse the catalogue →</Link></li>
            : status !== "ready" ? <li className="home-ask__status">Loading lessons…</li>
            : !results.length ? <li className="home-ask__status">No lesson by that name yet</li>
            : results.map((lessonIndex, position) => {
              const lesson = index.lessons[lessonIndex];
              const stops = ancestors(index.lessons, lessonIndex).size;
              return (
                <li key={lesson[ID]} id={`${listId}-${position}`} role="option" aria-selected={position === active}
                  className={position === active ? "is-active" : undefined}
                  onPointerDown={event => event.preventDefault()} onClick={() => choose(position)}>
                  <span>{lesson[TITLE]}</span>
                  <small>{stops ? `${stops} stops` : "start point"} · {lesson[PUBLISHED] ? "open" : "planned"}</small>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
