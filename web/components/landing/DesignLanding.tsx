import { OperationalStatusLink } from '@/components/status/OperationalStatusLink'

const landingStyles = `
.dome-landing {
  --green: #143F33;
  --green-2: #1E5244;
  --lime: #CFE937;
  --white: #FFFFFF;
  --muted: #C7D8D0;
  --font: "Trebuchet MS", "Segoe UI", Tahoma, "Helvetica Neue", Arial, sans-serif;
  height: 100dvh;
  overflow: auto;
  scroll-behavior: smooth;
  background: var(--green);
  color: var(--white);
  font-family: var(--font);
  font-size: 19px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-align: center;
}
.dome-landing .wrap { max-width: 1040px; margin: 0 auto; padding-inline: 24px; }
.dome-landing h1,
.dome-landing h2 { margin: 0; font-weight: 700; line-height: 1.2; text-wrap: balance; }
.dome-landing h2 { font-size: clamp(1.6rem, 3.6vw, 2.5rem); }
.dome-landing p { margin: 0; }
.dome-landing section { padding-block: clamp(72px, 11vw, 130px); }
.dome-landing .hero {
  min-height: 88svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: 48px;
}
.dome-landing .hero .wrap { display: grid; justify-items: center; gap: 22px; }
.dome-landing .hero img { width: min(320px, 70vw); height: auto; }
.dome-landing .hero h1 { font-size: clamp(1.5rem, 3.4vw, 2.3rem); font-weight: 400; }
.dome-landing .btn {
  display: inline-block;
  background: var(--lime);
  color: var(--green);
  font: inherit;
  font-weight: 700;
  border-radius: 12px;
  padding: 14px 26px;
  text-decoration: none;
  margin-top: 14px;
}
.dome-landing .btn:hover { background: #E1F36B; }
.dome-landing .btn:focus-visible { outline: 3px solid var(--white); outline-offset: 3px; }
.dome-landing .icons {
  display: flex;
  justify-content: center;
  gap: clamp(18px, 4vw, 44px);
  margin-block: clamp(40px, 6vw, 64px);
}
.dome-landing .ic {
  width: clamp(96px, 14vw, 160px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--lime);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dome-landing .ic svg { width: 52%; height: auto; }
.dome-landing .list {
  display: grid;
  gap: 18px;
  justify-content: center;
  text-align: left;
  margin: 0 auto;
  padding: 0;
  list-style: none;
  counter-reset: n;
}
.dome-landing .list li {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 18px;
  align-items: center;
  counter-increment: n;
}
.dome-landing .list li::before {
  content: counter(n);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--lime);
  color: var(--green);
  font-weight: 700;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dome-landing .list b { display: block; font-size: 1.3rem; }
.dome-landing .list span { color: var(--muted); font-size: 1rem; }
.dome-landing .coop { background: var(--green-2); }
.dome-landing .coop p { color: var(--muted); max-width: 40rem; margin: 20px auto 0; }
.dome-landing footer {
  padding-block: 28px 40px;
  font-size: .9rem;
  color: var(--muted);
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  justify-content: center;
}
.dome-landing footer a { color: inherit; text-decoration: none; }
.dome-landing footer a:hover { text-decoration: underline; }
.dome-landing .status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--lime);
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
}
.dome-landing .status:hover { text-decoration: underline; }
.dome-landing .status:focus-visible { outline: 3px solid var(--white); outline-offset: 3px; border-radius: 4px; }
.dome-landing .status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--lime);
  flex: none;
}
@media (prefers-reduced-motion: reduce) {
  .dome-landing { scroll-behavior: auto; }
}
`

export const DesignLanding = () => (
  <div className="dome-landing">
    <style>{landingStyles}</style>
    <main>
      <section className="hero">
        <div className="wrap">
          <img src="/dome-landing-logo.svg" alt="dome.ms" />
          <h1>Die IT-Abteilung, die Münster gehört.</h1>
          <a className="btn" href="/login">Mitmachen</a>
          <OperationalStatusLink appearance="landing" label="Alle Systeme betriebsbereit" />
        </div>
      </section>
      <section>
        <div className="wrap">
          <h2>Wir kümmern uns um eure Website,<br />damit ihr euch um euer Geschäft kümmern könnt.</h2>
          <div className="icons" aria-hidden="true">
            <div className="ic">
              <svg viewBox="0 0 24 24" fill="#143F33">
                <rect x="2" y="5" width="9" height="4" rx=".6" />
                <rect x="13" y="5" width="9" height="4" rx=".6" />
                <rect x="2" y="10.5" width="4" height="4" rx=".6" />
                <rect x="7.5" y="10.5" width="9" height="4" rx=".6" />
                <rect x="18" y="10.5" width="4" height="4" rx=".6" />
                <rect x="2" y="16" width="9" height="4" rx=".6" />
                <rect x="13" y="16" width="9" height="4" rx=".6" />
              </svg>
            </div>
            <div className="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="#143F33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
                <circle cx="12" cy="12" r="7" />
              </svg>
            </div>
            <div className="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="#143F33" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.5l8 3v6c0 5-3.5 8.6-8 10-4.5-1.4-8-5-8-10v-6z" />
                <path d="M8.5 12l2.5 2.5 4.5-5" />
              </svg>
            </div>
          </div>
          <ol className="list">
            <li><div><b>Souverän und Open Source</b><span>Der Code ist offen, die Daten bleiben in Münster.</span></div></li>
            <li><div><b>Kostengünstig</b><span>Keine Rendite, keine Lizenzen. Vereine sind mit kleinen Beiträgen dabei.</span></div></li>
            <li><div><b>Lokal und nah</b><span>Partner aus Münster betreiben die Server. Hilfe von Menschen, die man kennt.</span></div></li>
          </ol>
        </div>
      </section>
      <section className="coop" id="mitmachen">
        <div className="wrap">
          <h2>Wir gründen kein weiteres Unternehmen.<br />Wir geben dome.ms dahin, wo es hingehört.</h2>
          <p>dome.ms wird eine Genossenschaft. Wer mitmacht, besitzt mit, und jedes Mitglied hat eine Stimme.</p>
          <a className="btn" href="#mitmachen">Mitglied werden</a>
        </div>
      </section>
    </main>
    <footer>
      <span>dome.ms · Münsterhack 2026</span>
      <a href="#impressum">Impressum</a>
      <a href="#datenschutz">Datenschutz</a>
    </footer>
  </div>
)
