import { Link } from "react-router-dom";
import { useScrambleOnHover } from "./useScrambleOnHover.js";
import { elsewhere, featuredProjects } from "./work.js";

function Name({ text, display }) {
  return <span className="home-row__name"><span aria-hidden="true">{display}</span><span className="sr-only">{text}</span></span>;
}

function ProjectRow({ project }) {
  const { display, scramble } = useScrambleOnHover(project.name);
  return (
    <Link className="home-row" to={project.href} onPointerEnter={scramble}>
      <span className="home-row__year">{project.year}</span>
      <span className="home-row__body"><Name text={project.name} display={display} /><span className="home-row__summary">{project.summary}</span></span>
      <span className="home-row__arrow" aria-hidden="true">→</span>
    </Link>
  );
}

function ElsewhereRow({ link }) {
  const { display, scramble } = useScrambleOnHover(link.name);
  return (
    <a className="home-row home-row--external" href={link.href} target="_blank" rel="noopener noreferrer" onPointerEnter={scramble}>
      <span className="home-row__body"><span className="home-row__where">{link.where}</span><Name text={link.name} display={display} /></span>
      <span className="home-row__arrow" aria-hidden="true">↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function WorkSection() {
  const links = elsewhere.filter(link => link.href);
  return (
    <section className="home-block" id="work" aria-labelledby="work-title">
      <div className="home-block__head">
        <p className="home-block__label">02 — Work</p>
        <div><h2 id="work-title">Things I’ve built, and where else to find me.</h2></div>
      </div>
      <div className="home-block__body home-work">
        <div>
          <h3 className="home-work__label">Projects</h3>
          {featuredProjects.map(project => <ProjectRow key={project.name} project={project} />)}
          <Link className="home-work__more" to="/portfolio#projects">All projects <span aria-hidden="true">→</span></Link>
        </div>
        <div>
          <h3 className="home-work__label">Elsewhere</h3>
          {links.map(link => <ElsewhereRow key={link.href} link={link} />)}
        </div>
      </div>
    </section>
  );
}
