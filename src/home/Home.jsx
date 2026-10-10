import { useEffect } from "react";
import { homeTitle } from "../app/pageMeta.js";
import SiteHeader from "../shared/layout/SiteHeader.jsx";
import HeroMotto from "./HeroMotto.jsx";
import LearnSection from "./LearnSection.jsx";
import WorkSection from "./WorkSection.jsx";
import "./home.css";

const external = { target: "_blank", rel: "noopener noreferrer" };

export default function Home() {
  useEffect(() => { document.title = homeTitle; }, []);

  return (
    <div className="site-home">
      <SiteHeader />
      <main id="site-main" className="home-main" tabIndex={-1}>
        <section className="home-hero" aria-labelledby="home-title">
          <p className="home-hello">Hello, I’m</p>
          <h1 id="home-title">Ronak Sharma<span aria-hidden="true">.</span></h1>
          <p className="home-role">Data Science Engineer <span aria-hidden="true">/</span> AI Builder</p>
          <HeroMotto />
          <div className="home-bio">
            <p>I build AI systems and learn by taking ideas apart. My work spans machine learning, deep learning, NLP, and systems.</p>
            <p>This is my corner of the internet for the things I build and the things I want to understand deeply.</p>
          </div>
          <nav className="home-links" aria-label="Profiles">
            <a href="https://github.com/Ronaknowal" {...external}>GitHub <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
            <a href="https://www.linkedin.com/in/ronak-sharma-a6455a1b5/" {...external}>LinkedIn <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
            <a href="#work">My work <span aria-hidden="true">↓</span></a>
          </nav>
        </section>
        <LearnSection />
        <WorkSection />
      </main>
      <footer className="home-footer">
        <p>Ronak Sharma — always learning.</p>
        <a href="#site-main">Back to top <span aria-hidden="true">↑</span></a>
      </footer>
    </div>
  );
}
