import React, { useState, useRef, useEffect } from "react";
import { Send, RotateCcw, MapPin, Mail, Phone, ArrowUpRight, Sparkles, MessageSquare, Linkedin, Check, Download, Compass, Target, Trophy, Coins } from "lucide-react";

/* =====================================================================
   EVERYTHING ABOUT YOU LIVES IN THIS ONE OBJECT.
   The resume, the AI agent, and the "Message Ben" form all read
   from here — edit once, update everywhere.
   ===================================================================== */
const CANDIDATE = {
  name: "Ben Phillips",
  title: "Global Compensation & Total Rewards Leader",
  tagline:
    "I turn compensation into a strategic business lever — through pay equity, transparency, and AI-enabled, decision-grade analytics.",
  location: "Detroit Metro, Michigan",
  email: "Bphill10@gmail.com",
  phone: "734-645-3508",
  openTo: "Open to senior Compensation & Total Rewards leadership roles",
  lookingFor: {
    summary:
      "Senior leadership roles where I can own global compensation and total rewards strategy end-to-end and build AI-enabled, transparent pay systems at scale.",
    roles: ["VP / Head of Total Rewards", "Senior Director, Global Compensation", "Compensation COE Leader"],
  },
  signature: {
    headline: "Built and deployed a single global job architecture across 40+ countries",
    detail:
      "Consolidated 3,000+ legacy titles into one unified framework for 35,000+ employees — enabling consistent leveling, market pricing, and career paths worldwide.",
    metrics: [
      { value: "40+", label: "countries" },
      { value: "3,000+", label: "titles unified" },
      { value: "35,000+", label: "employees" },
    ],
  },
  approach:
    "Ben's throughline is simplifying complexity into decisions leaders can act on — using technology, analytics, and clear operating models to standardize processes. He treats change management, communication, and enablement as seriously as design and analytics, making complex compensation topics simple and trustworthy for managers, executives, and boards.",
  caseStudies: [
    {
      tag: "Job Architecture",
      title: "Unifying global compensation across 40+ countries",
      summary:
        "Replaced fragmented, spreadsheet-driven pay processes with a single global job architecture and modernized salary and incentive structures, consolidating 3,000+ legacy titles into one governed framework.",
      outcome: "Consistent leveling, market pricing, and career paths for 35,000+ employees — with faster, more defensible pay decisions.",
    },
    {
      tag: "AI & Analytics",
      title: "A decision-grade compensation analytics ecosystem",
      summary:
        "Built an AI-powered job-description and benchmarking engine mapping 1,500+ roles to external surveys, paired with automated Power BI pipelines.",
      outcome: "Executives gained real-time visibility into pay, headcount, and workforce cost — replacing manual analysis with governed, on-demand insight.",
    },
    {
      tag: "Equity & Governance",
      title: "Pre-IPO equity conversion in a regulated environment",
      summary:
        "At Ally Financial, managed the phantom-to-public equity conversion for 1,000+ employees and governed RSU/IRSU/DSU programs alongside executive compensation and proxy reporting.",
      outcome: "100% SEC/SOX compliance through a major transformation and IPO-related equity transition.",
    },
  ],
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/benjamin-j-phillips", icon: "linkedin" },
  ],
  summary:
    "Strategic, AI-driven global compensation and total rewards leader with a strong track record of designing and scaling enterprise compensation, job architecture, and pay governance for complex, multi-country organizations. I partner with CHROs, CFOs, and executive leaders to align pay strategy with business objectives, and translate market, equity, and regulatory requirements into clear, practical decisions — building AI-enabled analytics platforms and governance frameworks that replace manual work with consistency, transparency, and control.",
  highlights: [
    "Deployed a single global job architecture across 40+ countries — 3,000+ legacy titles unified for 35,000+ employees",
    "Built an AI-powered job-description & benchmarking engine mapping 1,500+ roles to external market surveys",
    "Advise executives and boards on multi-million-dollar workforce and compensation investments",
  ],
  experience: [
    {
      role: "Senior Director, Global Compensation — North America & APAC",
      company: "Stefanini Group",
      period: "2016 — Present",
      location: "Southfield, MI",
      points: [
        "Enterprise owner of global compensation strategy and analytics; lead design and governance of global job architecture, salary structures, market pricing, and incentive programs.",
        "Deployed a single global job architecture across 40+ countries, consolidating 3,000+ legacy titles into one framework supporting 35,000+ employees.",
        "Created an AI-powered JD and benchmarking engine mapping 1,500+ roles to surveys (Radford, Mercer, WTW, Aon, IPAS) and built a Power BI analytics ecosystem for real-time pay and labor-cost visibility.",
        "Lead pay equity and transparency governance aligned to U.S. and EU requirements; steward the global annual comp cycle and advise the board on major workforce investments.",
      ],
    },
    {
      role: "Manager, Compensation & Benefits | HR Operations",
      company: "MB Financial",
      period: "2015 — 2016",
      location: "Ann Arbor, MI",
      points: [
        "Owned company-wide compensation and benefits: annual cycles, market pricing, benefits administration, and HR operations.",
        "Led merit, incentive, and equity administration for 1,500+ employees; ran open enrollment to 98% completion while cutting benefits support requests 30%.",
        "Automated the merit process, reducing administrative workload ~50% while improving accuracy and cycle speed.",
      ],
    },
    {
      role: "Senior Compensation Analyst",
      company: "Ally Financial",
      period: "2013 — 2015",
      location: "Detroit, MI",
      points: [
        "Ran enterprise market and pay-equity analysis across 4,000+ employees and redesigned job architecture for 600+ roles during major transformation.",
        "Managed the phantom-to-public equity conversion for 1,000+ employees ahead of IPO; governed RSUs/IRSUs/DSUs at 100% SEC/SOX compliance.",
        "Handled executive compensation reporting for TARP-covered executives and validated proxy (10-K) disclosures for named executive officers.",
      ],
    },
  ],
  earlier: [
    { role: "Analytic Consultant", company: "Truven Health Analytics", period: "2011 — 2013" },
    { role: "Finance & Accounting Associate", company: "EHIM", period: "2010 — 2011" },
  ],
  skills: [
    { group: "Compensation & Rewards", items: ["AI-driven compensation", "Pay equity & transparency", "Job architecture", "Market pricing", "Comp governance", "Global strategy"] },
    { group: "Leadership & Advisory", items: ["Executive & board advisory", "COE leadership", "Change leadership", "Stakeholder influence"] },
    { group: "Analytics & Systems", items: ["Power BI", "HRIS & comp systems", "Scenario modeling", "Workforce cost strategy"] },
  ],
  education: [
    { school: "University of Michigan–Dearborn", credential: "M.S. Finance (2013) · M.B.A. (2011)" },
    { school: "Eastern Michigan University", credential: "B.B.A., Magna Cum Laude (2009)" },
  ],
};

function buildSystemPrompt(c) {
  const exp = c.experience
    .map((e) => `- ${e.role}, ${e.company} (${e.period}, ${e.location}):\n  ${e.points.join("\n  ")}`)
    .join("\n");
  const skills = c.skills.map((s) => `${s.group}: ${s.items.join(", ")}`).join("; ");
  const edu = c.education.map((e) => `${e.credential}, ${e.school}`).join("; ");
  const earlier = c.earlier.map((e) => `${e.role}, ${e.company} (${e.period})`).join("; ");
  const cases = c.caseStudies
    .map((cs) => `- ${cs.title} [${cs.tag}]: ${cs.summary} Outcome: ${cs.outcome}`)
    .join("\n");

  return `You are the recruiting representative for ${c.name}, speaking with a recruiter or hiring manager evaluating them. Answer questions about ${c.name}'s background as a knowledgeable, professional advocate — warm, concise, specific.

CANDIDATE PROFILE
Name: ${c.name}
Focus: ${c.title}
Positioning: ${c.tagline}
Location: ${c.location} — ${c.openTo}
Looking for: ${c.lookingFor.summary} Target roles: ${c.lookingFor.roles.join(", ")}.
Summary: ${c.summary}
Highlights: ${c.highlights.join("; ")}
Biggest accomplishment: ${c.signature.headline} — ${c.signature.detail}
Experience:
${exp}
Earlier roles: ${earlier}
Skills — ${skills}
Education: ${edu}
Approach & style: ${c.approach}
Selected case studies (use these when a recruiter asks about a specific project):
${cases}

RULES
- Only state things supported by the profile above. For anything it doesn't cover (exact salary expectations, relocation, references, availability dates, anything personal), say the recruiter can reach Ben directly via the "Message Ben" tab rather than guessing.
- Never invent employers, dates, or metrics.
- Keep answers to 2–5 sentences unless asked for more. No bullet lists unless requested.
- Refer to the candidate as "Ben" or "they," not "I" — you represent him.
- Stay on professional topics; politely redirect anything off-topic.`;
}

const SUGGESTED = [
  "Walk me through their global comp experience.",
  "How have they used AI in compensation?",
  "What's their biggest accomplishment?",
  "Why should we interview them?",
];

/* ===================== "Price the Role" — a fun comp game =====================
   Illustrative U.S. base-salary ranges for a guessing game. Not real data. */
const ROLES = [
  { title: "Senior Software Engineer", blurb: "Big tech · San Francisco Bay Area", low: 180000, mid: 215000, high: 250000 },
  { title: "Registered Nurse", blurb: "Hospital system · U.S. Midwest", low: 68000, mid: 80000, high: 95000 },
  { title: "Compensation Analyst", blurb: "Mid-size company · Detroit, MI", low: 70000, mid: 82000, high: 96000 },
  { title: "VP of Sales", blurb: "SaaS startup · base only (OTE is higher)", low: 190000, mid: 225000, high: 265000 },
  { title: "Public School Teacher", blurb: "Elementary · Michigan", low: 48000, mid: 58000, high: 70000 },
  { title: "Data Scientist", blurb: "Financial services · New York City", low: 145000, mid: 170000, high: 200000 },
  { title: "Warehouse Associate", blurb: "Distribution center · U.S.", low: 36000, mid: 43000, high: 52000 },
  { title: "Chief People Officer", blurb: "Mid-market company · base only", low: 270000, mid: 330000, high: 390000 },
  { title: "UX Designer", blurb: "Mid-level · remote", low: 100000, mid: 122000, high: 148000 },
  { title: "Mechanical Engineer", blurb: "Automotive · Detroit, MI", low: 82000, mid: 96000, high: 112000 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUNDS = 5;
const usd = (n) => "$" + Math.round(n).toLocaleString();
const SMIN = 20000, SMAX = 500000;
const pct = (v) => Math.max(0, Math.min(100, ((v - SMIN) / (SMAX - SMIN)) * 100));

function CompGame() {
  const [deck, setDeck] = useState(() => shuffle([...Array(ROLES.length).keys()]).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(100000);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [lastPts, setLastPts] = useState(0);
  const [lastMsg, setLastMsg] = useState("");

  const finished = round >= deck.length;
  const role = !finished ? ROLES[deck[round]] : null;

  function reveal() {
    if (revealed || !role) return;
    const err = Math.abs(guess - role.mid) / role.mid;
    let pts, msg;
    if (err <= 0.05) { pts = 1000; msg = "Spot on — you priced it like a pro."; }
    else if (err <= 0.15) { pts = 700; msg = "Great read of the market."; }
    else if (err <= 0.30) { pts = 400; msg = "In the ballpark."; }
    else if (err <= 0.50) { pts = 150; msg = "A bit off — markets are tricky."; }
    else { pts = 0; msg = "Way off — this is why comp pros exist."; }
    setLastPts(pts); setLastMsg(msg); setScore((s) => s + pts); setRevealed(true);
  }
  function next() { setRevealed(false); setGuess(100000); setRound((r) => r + 1); }
  function restart() {
    setDeck(shuffle([...Array(ROLES.length).keys()]).slice(0, ROUNDS));
    setRound(0); setGuess(100000); setRevealed(false); setScore(0);
  }

  function rank(s) {
    if (s >= 4000) return "Total Rewards Legend";
    if (s >= 2500) return "Market-Pricing Pro";
    if (s >= 1200) return "Solid Recruiter Instincts";
    return "Comp Rookie — Ben can help with that";
  }

  if (finished) {
    return (
      <div className="rz-game-inner">
        <div className="rz-game-final">
          <Trophy size={26} />
          <p className="rz-game-finalscore">{score.toLocaleString()} <span>/ {ROUNDS * 1000}</span></p>
          <p className="rz-game-rank">{rank(score)}</p>
          <button className="rz-game-btn" onClick={restart}><RotateCcw size={15} /> Play again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rz-game-inner">
      <div className="rz-game-top">
        <span className="rz-game-round">Round {round + 1} of {deck.length}</span>
        <span className="rz-game-score">Score {score.toLocaleString()}</span>
      </div>
      <h3 className="rz-game-role">{role.title}</h3>
      <p className="rz-game-blurb">{role.blurb}</p>
      <p className="rz-game-q">What's the market <b>base salary</b>?</p>

      <p className="rz-game-guess">{usd(guess)}</p>
      <input className="rz-game-slider" type="range" min={SMIN} max={SMAX} step={1000}
        value={guess} disabled={revealed} onChange={(e) => setGuess(Number(e.target.value))}
        aria-label="Your salary guess" />

      <div className="rz-game-track">
        {revealed && (
          <span className="rz-game-band" style={{ left: pct(role.low) + "%", width: (pct(role.high) - pct(role.low)) + "%" }} />
        )}
        <span className="rz-game-marker" style={{ left: pct(guess) + "%" }} />
      </div>

      {revealed ? (
        <div className="rz-game-result">
          <p className="rz-game-reveal">Market range: <b>{usd(role.low)} – {usd(role.high)}</b> · mid {usd(role.mid)}</p>
          <p className="rz-game-msg">{lastMsg} <b>+{lastPts}</b></p>
          <button className="rz-game-btn" onClick={next}>
            {round + 1 >= deck.length ? "See your score" : "Next role"}
          </button>
        </div>
      ) : (
        <button className="rz-game-btn" onClick={reveal}>Lock in guess</button>
      )}
    </div>
  );
}

export default function App() {
  const c = CANDIDATE;
  const [tab, setTab] = useState("agent"); // agent | contact
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  // contact form
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);

  // interactive company-fit
  const [coName, setCoName] = useState("");
  const [coRole, setCoRole] = useState("");
  const [fitLoading, setFitLoading] = useState(false);
  const [fitResult, setFitResult] = useState(null);
  const [fitError, setFitError] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(c),
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error("status " + res.status);
      const data = await res.json();
      const reply = (data.content || [])
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n")
        .trim();
      setMessages([...next, { role: "assistant", content: reply || "…" }]);
    } catch (e) {
      setError("The agent couldn't respond just now. Try again in a moment.");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function generateFit() {
    const name = coName.trim();
    if (!name || fitLoading) return;
    setFitError(null);
    setFitResult(null);
    setFitLoading(true);
    try {
      const userMsg =
        `A recruiter or hiring manager from "${name}"` +
        (coRole.trim() ? ` (hiring for: ${coRole.trim()})` : "") +
        ` wants to understand why Ben is a strong fit for their team.\n\n` +
        `Using ONLY Ben's real background from the profile, write a tailored fit summary that maps his experience to the kind of compensation / total rewards needs a company like this likely has. Do not invent facts about Ben, and do not claim specific knowledge of the company's internal details — frame it as how his background would apply.\n\n` +
        `Respond with ONLY a JSON object, no markdown and no preamble:\n` +
        `{"intro": "one-sentence positioning of Ben for this company", "points": [{"area": "short skill/area label", "apply": "1-2 sentences on how it applies to them"}]}\n` +
        `Include 3 or 4 points.`;
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(c),
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      if (!res.ok) throw new Error("status " + res.status);
      const data = await res.json();
      let text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      text = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      setFitResult(parsed);
    } catch (e) {
      setFitError("Couldn't generate the fit just now — please try again in a moment.");
    } finally {
      setFitLoading(false);
    }
  }

  function onFitKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      generateFit();
    }
  }

  function sendEmail() {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    const subject = encodeURIComponent(
      `Recruiting inquiry from ${form.name}${form.company ? ` (${form.company})` : ""}`
    );
    const body = encodeURIComponent(
      `${form.message}\n\n— ${form.name}\n${form.email}${form.company ? `\n${form.company}` : ""}`
    );
    window.location.href = `mailto:${c.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  const first = c.name.split(" ")[0];

  return (
    <div className="rz">
      <style>{CSS}</style>
      <div className="rz-wrap">
        {/* ============ RESUME ============ */}
        <main className="rz-doc">
          <header className="rz-head">
            <p className="rz-eyebrow">Candidate Dossier</p>
            <h1 className="rz-name">{c.name}</h1>
            <p className="rz-title">{c.title}</p>
            <p className="rz-tagline">{c.tagline}</p>
            <div className="rz-contact">
              <span><MapPin size={14} /> {c.location}</span>
              <a href={`mailto:${c.email}`}><Mail size={14} /> {c.email}</a>
              <span><Phone size={14} /> {c.phone}</span>
              {c.links.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer">
                  {l.icon === "linkedin" ? <Linkedin size={14} /> : null} {l.label} <ArrowUpRight size={13} />
                </a>
              ))}
              <button className="rz-download" onClick={() => window.print()}>
                <Download size={14} /> Download résumé
              </button>
            </div>
          </header>

          <section className="rz-signature">
            <p className="rz-h2">Signature accomplishment</p>
            <p className="rz-sig-headline">{c.signature.headline}</p>
            <p className="rz-sig-detail">{c.signature.detail}</p>
            <div className="rz-metrics">
              {c.signature.metrics.map((m) => (
                <div className="rz-metric" key={m.label}>
                  <span className="rz-metric-val">{m.value}</span>
                  <span className="rz-metric-label">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="rz-looking">
            <p className="rz-looking-label"><Compass size={14} /> What I'm looking for</p>
            <p className="rz-looking-text">{c.lookingFor.summary}</p>
            <div className="rz-tags">
              {c.lookingFor.roles.map((r) => <span className="rz-tag rz-tag-role" key={r}>{r}</span>)}
            </div>
          </div>

          <section className="rz-fit">
            <p className="rz-fit-eyebrow"><Target size={14} /> Tailored fit</p>
            {!fitResult ? (
              <>
                <h2 className="rz-fit-title">See how Ben fits <span>your team</span></h2>
                <p className="rz-fit-lead">Enter your company and I'll map Ben's background to what you likely need.</p>
                <div className="rz-fit-form">
                  <input className="rz-fit-input" placeholder="Your company" value={coName}
                    onChange={(e) => setCoName(e.target.value)} onKeyDown={onFitKey} aria-label="Your company name" />
                  <input className="rz-fit-input" placeholder="Role you're hiring for (optional)" value={coRole}
                    onChange={(e) => setCoRole(e.target.value)} onKeyDown={onFitKey} aria-label="Role you are hiring for, optional" />
                  <button className="rz-fit-btn" onClick={generateFit} disabled={fitLoading || !coName.trim()}>
                    {fitLoading ? "Thinking…" : "Show the fit"}
                  </button>
                </div>
                {fitError && <p className="rz-fit-error">{fitError}</p>}
              </>
            ) : (
              <>
                <h2 className="rz-fit-title">Why Ben is a fit for <span>{coName}</span></h2>
                {fitResult.intro && <p className="rz-fit-lead">{fitResult.intro}</p>}
                <div className="rz-fit-rows">
                  {(fitResult.points || []).map((p, i) => (
                    <div className="rz-fit-row" key={i}>
                      <p className="rz-fit-area">{p.area}</p>
                      <p className="rz-fit-apply">{p.apply}</p>
                    </div>
                  ))}
                </div>
                <button className="rz-fit-reset" onClick={() => { setFitResult(null); setCoName(""); setCoRole(""); }}>
                  Try another company
                </button>
                <p className="rz-fit-disclaimer">Generated from Ben's real background and tailored to your company — verify specifics with Ben directly.</p>
              </>
            )}
          </section>

          <section className="rz-section">
            <h2 className="rz-h2">Profile</h2>
            <p className="rz-body">{c.summary}</p>
            <ul className="rz-highlights">
              {c.highlights.map((h, i) => (<li key={i}><span className="rz-tick" />{h}</li>))}
            </ul>
          </section>

          <section className="rz-section">
            <h2 className="rz-h2">Experience</h2>
            {c.experience.map((e, i) => (
              <article className="rz-job" key={i}>
                <div className="rz-job-head">
                  <div>
                    <h3 className="rz-role">{e.role}</h3>
                    <p className="rz-company">{e.company} · {e.location}</p>
                  </div>
                  <p className="rz-period">{e.period}</p>
                </div>
                <ul className="rz-points">{e.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
              </article>
            ))}
            <div className="rz-earlier">
              <p className="rz-skilllabel">Earlier</p>
              {c.earlier.map((e, i) => (
                <p key={i} className="rz-earlier-row"><span>{e.role}, {e.company}</span><span className="rz-period">{e.period}</span></p>
              ))}
            </div>
          </section>

          <section className="rz-section">
            <h2 className="rz-h2">Selected work</h2>
            <div className="rz-cases">
              {c.caseStudies.map((cs, i) => (
                <article className="rz-case" key={i}>
                  <p className="rz-case-tag">{cs.tag}</p>
                  <h3 className="rz-case-title">{cs.title}</h3>
                  <p className="rz-case-summary">{cs.summary}</p>
                  <p className="rz-case-outcome"><span className="rz-tick" /><span><b>Outcome:</b> {cs.outcome}</span></p>
                </article>
              ))}
            </div>
            <p className="rz-case-note">Illustrative case studies — figures are Ben's own published metrics; no confidential data is shared.</p>
          </section>

          <div className="rz-grid">
            <section className="rz-section">
              <h2 className="rz-h2">Skills</h2>
              {c.skills.map((s, i) => (
                <div className="rz-skillgroup" key={i}>
                  <p className="rz-skilllabel">{s.group}</p>
                  <div className="rz-tags">{s.items.map((it) => <span className="rz-tag" key={it}>{it}</span>)}</div>
                </div>
              ))}
            </section>
            <section className="rz-section">
              <h2 className="rz-h2">Education</h2>
              {c.education.map((e, i) => (
                <div className="rz-edu" key={i}>
                  <p className="rz-role">{e.school}</p>
                  <p className="rz-company">{e.credential}</p>
                </div>
              ))}
            </section>
          </div>

          <section className="rz-section rz-game">
            <p className="rz-game-eyebrow"><Coins size={14} /> Coffee break</p>
            <h2 className="rz-game-title">Price the Role</h2>
            <p className="rz-game-intro">A quick game for the comp-curious — guess the market base salary and see how your instincts stack up. Numbers are illustrative, just for fun.</p>
            <CompGame />
          </section>
        </main>

        {/* ============ AGENT / CONTACT ============ */}
        <aside className="rz-agent">
          <div className="rz-agent-inner">
            <div className="rz-agent-head">
              <p className="rz-status"><span className="rz-dot" /> Available for questions</p>
              <div className="rz-tabs">
                <button className={tab === "agent" ? "rz-tab on" : "rz-tab"} onClick={() => setTab("agent")}>
                  <Sparkles size={14} /> Ask the agent
                </button>
                <button className={tab === "contact" ? "rz-tab on" : "rz-tab"} onClick={() => setTab("contact")}>
                  <MessageSquare size={14} /> Message {first}
                </button>
              </div>
            </div>

            {tab === "agent" ? (
              <>
                <div className="rz-thread">
                  {messages.length === 0 && !loading && (
                    <div className="rz-empty">
                      <p>Ask anything about {first}'s background — start here:</p>
                      <div className="rz-chips">
                        {SUGGESTED.map((s) => (
                          <button key={s} className="rz-chip" onClick={() => send(s)}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`rz-msg ${m.role === "user" ? "rz-msg-user" : "rz-msg-bot"}`}>
                      {m.role !== "user" && <span className="rz-msg-tag">Agent</span>}
                      <p>{m.content}</p>
                    </div>
                  ))}
                  {loading && (
                    <div className="rz-msg rz-msg-bot">
                      <span className="rz-msg-tag">Agent</span>
                      <p className="rz-typing"><i /><i /><i /></p>
                    </div>
                  )}
                  {error && <p className="rz-error">{error}</p>}
                  <div ref={endRef} />
                </div>
                <div className="rz-inputbar">
                  {messages.length > 0 && (
                    <button className="rz-reset" onClick={() => { setMessages([]); setError(null); }} aria-label="Clear conversation">
                      <RotateCcw size={15} />
                    </button>
                  )}
                  <textarea className="rz-input" rows={1} placeholder="Ask a question…" value={input}
                    onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
                    aria-label="Ask the recruiting agent a question" />
                  <button className="rz-send" onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send">
                    <Send size={16} />
                  </button>
                </div>
                <p className="rz-disclaimer">Answers are generated and may be imperfect — reach {first} directly for specifics.</p>
              </>
            ) : (
              <div className="rz-contactpane">
                {sent ? (
                  <div className="rz-confirm">
                    <div className="rz-confirm-icon"><Check size={22} /></div>
                    <h3>Your email is ready</h3>
                    <p>Your mail app should have opened with the message to {first}. If it didn't, email him directly at <a href={`mailto:${c.email}`}>{c.email}</a>.</p>
                    <button className="rz-textbtn" onClick={() => { setSent(false); setForm({ name: "", email: "", company: "", message: "" }); }}>Write another</button>
                  </div>
                ) : (
                  <>
                    <p className="rz-contactintro">Send {first} a question and he'll reply directly. This opens your email app with everything filled in.</p>
                    <label className="rz-field">
                      <span>Your name</span>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Recruiter" />
                    </label>
                    <label className="rz-field">
                      <span>Your email</span>
                      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
                    </label>
                    <label className="rz-field">
                      <span>Company <em>(optional)</em></span>
                      <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
                    </label>
                    <label className="rz-field">
                      <span>Your message</span>
                      <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Hi Ben — we're hiring a Head of Total Rewards and…" />
                    </label>
                    <button className="rz-mailbtn" onClick={sendEmail}
                      disabled={!form.name.trim() || !form.email.trim() || !form.message.trim()}>
                      <Mail size={15} /> Send to {first}
                    </button>
                    <div className="rz-directlinks">
                      <a href={`mailto:${c.email}`}><Mail size={13} /> {c.email}</a>
                      <a href={c.links[0].url} target="_blank" rel="noreferrer"><Linkedin size={13} /> LinkedIn</a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const CSS = `
.rz{
  --paper:#F7F5F0; --ink:#1B2A30; --ink-soft:#44565E; --muted:#7A878D;
  --line:rgba(27,42,48,0.12); --pine:#2E6E5E; --pine-deep:#235445;
  --panel:#13212A; --panel-2:#1C2E38; --gold:#D9A434; --on-dark:#EBEEE9;
  --serif:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif;
  --sans:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,'SF Mono',Menlo,Consolas,monospace;
  background:var(--paper); color:var(--ink); font-family:var(--sans);
  min-height:100vh; line-height:1.55; -webkit-font-smoothing:antialiased;
}
.rz *{box-sizing:border-box;}
.rz-wrap{display:grid; grid-template-columns:1fr; max-width:1180px; margin:0 auto;}
@media(min-width:900px){ .rz-wrap{grid-template-columns:1fr 380px; align-items:start;} }

.rz-doc{padding:48px 30px 64px;}
@media(min-width:900px){ .rz-doc{padding:64px 56px;} }
.rz-eyebrow{font-family:var(--mono); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--pine); margin:0 0 18px;}
.rz-name{font-family:var(--serif); font-weight:600; font-size:clamp(38px,6.5vw,60px); line-height:1.03; letter-spacing:-.01em; margin:0;}
.rz-title{font-size:17px; color:var(--ink-soft); margin:10px 0 0; font-weight:500;}
.rz-tagline{font-family:var(--serif); font-style:italic; font-size:19px; color:var(--ink); margin:18px 0 0; max-width:42ch;}
.rz-contact{display:flex; flex-wrap:wrap; gap:8px 20px; margin-top:24px; font-size:13.5px; color:var(--ink-soft);}
.rz-contact span,.rz-contact a{display:inline-flex; align-items:center; gap:6px; color:inherit; text-decoration:none;}
.rz-contact a:hover{color:var(--pine);}
.rz-contact svg{opacity:.7;}
.rz-download{display:inline-flex; align-items:center; gap:6px; font-family:var(--sans); font-size:13px; font-weight:500; color:var(--pine-deep); background:rgba(46,110,94,0.07); border:1px solid var(--pine); border-radius:999px; padding:5px 13px; cursor:pointer; transition:background .15s,color .15s;}
.rz-download:hover{background:var(--pine); color:#fff;}
.rz-download svg{opacity:1;}

.rz-looking{margin-top:28px; padding:20px 22px; background:rgba(46,110,94,0.06); border:1px solid var(--line); border-left:3px solid var(--pine); border-radius:4px 12px 12px 4px;}
.rz-looking-label{font-family:var(--mono); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--pine-deep); margin:0 0 10px; display:flex; align-items:center; gap:7px; font-weight:600;}
.rz-looking-text{font-size:15px; color:var(--ink); margin:0 0 14px; max-width:62ch;}
.rz-tag-role{background:#fff; border-color:var(--pine); color:var(--pine-deep); font-weight:500;}

.rz-signature{margin-top:30px; padding-top:26px; border-top:1px solid var(--line);}
.rz-sig-headline{font-family:var(--serif); font-size:clamp(22px,3.4vw,30px); line-height:1.22; font-weight:600; margin:8px 0 0; max-width:26ch; letter-spacing:-.01em;}
.rz-sig-detail{font-size:15px; color:var(--ink-soft); margin:14px 0 0; max-width:60ch;}
.rz-metrics{display:flex; flex-wrap:wrap; gap:24px 42px; margin-top:24px;}
.rz-metric{display:flex; flex-direction:column;}
.rz-metric-val{font-family:var(--serif); font-size:clamp(30px,5vw,42px); font-weight:600; color:var(--pine-deep); line-height:1;}
.rz-metric-label{font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin-top:8px;}

.rz-cases{display:grid; gap:14px;}
.rz-case{padding:20px 22px; border:1px solid var(--line); border-left:3px solid var(--pine); border-radius:4px 14px 14px 4px; background:#fff;}
.rz-case-tag{font-family:var(--mono); font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--pine); margin:0 0 8px; font-weight:600;}
.rz-case-title{font-family:var(--serif); font-size:19px; font-weight:600; margin:0; line-height:1.25;}
.rz-case-summary{font-size:14.5px; color:var(--ink-soft); margin:10px 0 0;}
.rz-case-outcome{font-size:13.5px; color:var(--ink); margin:13px 0 0; display:flex; gap:9px; align-items:baseline;}
.rz-case-outcome b{font-weight:600; color:var(--pine-deep);}
.rz-case-note{font-size:12px; color:var(--muted); margin:14px 0 0; font-style:italic;}

.rz-fit{margin-top:26px; padding:24px 24px 8px; background:var(--ink); color:var(--on-dark); border-radius:14px;}
.rz-fit-eyebrow{font-family:var(--mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--gold); margin:0 0 10px; display:flex; align-items:center; gap:7px;}
.rz-fit-title{font-family:var(--serif); font-size:clamp(22px,3.2vw,28px); font-weight:600; margin:0 0 18px; line-height:1.2; color:#fff;}
.rz-fit-title span{color:#8FD0BE;}
.rz-fit-rows{display:grid; gap:0;}
.rz-fit-row{padding:15px 0; border-top:1px solid rgba(255,255,255,0.12);}
.rz-fit-area{font-size:14px; font-weight:600; color:#fff; margin:0;}
.rz-fit-apply{font-size:14px; color:#A9B7BC; margin:5px 0 0; line-height:1.5;}
.rz-fit-lead{font-size:14.5px; color:#A9B7BC; margin:0 0 18px; max-width:56ch; line-height:1.55;}
.rz-fit-form{display:flex; flex-wrap:wrap; gap:10px; align-items:center; padding-bottom:8px;}
.rz-fit-input{flex:1 1 200px; background:var(--panel-2); color:var(--on-dark); border:1px solid rgba(255,255,255,0.14); border-radius:10px; padding:11px 13px; font-family:var(--sans); font-size:14.5px; outline:none;}
.rz-fit-input::placeholder{color:#7E8C93;}
.rz-fit-input:focus-visible{border-color:#8FD0BE;}
.rz-fit-btn{flex:0 0 auto; background:var(--gold); color:#1B2A30; border:none; border-radius:10px; padding:11px 20px; font-family:var(--sans); font-size:14.5px; font-weight:600; cursor:pointer; transition:opacity .15s, filter .15s;}
.rz-fit-btn:hover:not(:disabled){filter:brightness(1.06);}
.rz-fit-btn:disabled{opacity:.5; cursor:default;}
.rz-fit-error{font-size:13px; color:#E8A0A0; margin:12px 0 0;}
.rz-fit-reset{background:none; border:1px solid rgba(255,255,255,0.2); color:var(--on-dark); border-radius:999px; padding:7px 16px; font-family:var(--sans); font-size:13px; cursor:pointer; margin-top:6px; transition:border-color .15s;}
.rz-fit-reset:hover{border-color:#8FD0BE;}
.rz-fit-disclaimer{font-size:11.5px; color:#7E8C93; margin:14px 0 0; font-style:italic;}

.rz-game{}
.rz-game-eyebrow{font-family:var(--mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--gold); margin:0 0 8px; display:flex; align-items:center; gap:7px; font-weight:600;}
.rz-game-title{font-family:var(--serif); font-size:26px; font-weight:600; margin:0 0 8px; color:var(--ink);}
.rz-game-intro{font-size:14.5px; color:var(--ink-soft); margin:0 0 20px; max-width:60ch;}
.rz-game-inner{background:#fff; border:1px solid var(--line); border-radius:16px; padding:24px;}
.rz-game-top{display:flex; justify-content:space-between; font-family:var(--mono); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted);}
.rz-game-score{color:var(--pine-deep); font-weight:600;}
.rz-game-role{font-family:var(--serif); font-size:24px; font-weight:600; margin:14px 0 2px; color:var(--ink);}
.rz-game-blurb{font-size:14px; color:var(--muted); margin:0;}
.rz-game-q{font-size:14.5px; color:var(--ink-soft); margin:18px 0 6px;}
.rz-game-q b{color:var(--ink);}
.rz-game-guess{font-family:var(--serif); font-size:38px; font-weight:600; color:var(--pine-deep); margin:0; line-height:1;}
.rz-game-slider{-webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:999px; background:rgba(46,110,94,0.2); margin:16px 0 4px; outline:none;}
.rz-game-slider::-webkit-slider-thumb{-webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:var(--pine); border:3px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.2); cursor:pointer;}
.rz-game-slider::-moz-range-thumb{width:22px; height:22px; border-radius:50%; background:var(--pine); border:3px solid #fff; cursor:pointer;}
.rz-game-slider:disabled{opacity:.7;}
.rz-game-track{position:relative; height:10px; border-radius:999px; background:rgba(27,42,48,0.06); margin:10px 0 4px;}
.rz-game-band{position:absolute; top:0; height:10px; border-radius:999px; background:rgba(46,110,94,0.35);}
.rz-game-marker{position:absolute; top:-3px; width:3px; height:16px; border-radius:2px; background:var(--gold); transform:translateX(-50%);}
.rz-game-result{margin-top:14px;}
.rz-game-reveal{font-size:14px; color:var(--ink-soft); margin:0 0 6px;}
.rz-game-reveal b{color:var(--ink);}
.rz-game-msg{font-size:15px; color:var(--ink); margin:0 0 16px;}
.rz-game-msg b{color:var(--pine-deep);}
.rz-game-btn{display:inline-flex; align-items:center; gap:8px; background:var(--pine); color:#fff; border:none; border-radius:11px; padding:11px 20px; font-family:var(--sans); font-size:14.5px; font-weight:600; cursor:pointer; margin-top:8px; transition:background .15s;}
.rz-game-btn:hover{background:var(--pine-deep);}
.rz-game-final{text-align:center; padding:16px 8px; color:var(--pine-deep);}
.rz-game-finalscore{font-family:var(--serif); font-size:44px; font-weight:600; margin:12px 0 0; color:var(--ink); line-height:1;}
.rz-game-finalscore span{font-size:22px; color:var(--muted);}
.rz-game-rank{font-family:var(--serif); font-style:italic; font-size:19px; color:var(--pine-deep); margin:10px 0 18px;}

.rz-section{padding-top:38px; margin-top:38px; border-top:1px solid var(--line);}
.rz-h2{font-family:var(--mono); font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--pine-deep); margin:0 0 18px; font-weight:600;}
.rz-body{font-size:15.5px; color:var(--ink); margin:0; max-width:64ch;}
.rz-highlights{list-style:none; padding:0; margin:22px 0 0; display:grid; gap:11px;}
.rz-highlights li{display:flex; gap:12px; align-items:baseline; font-size:15px; color:var(--ink-soft);}
.rz-tick{width:7px; height:7px; flex:0 0 7px; border-radius:50%; background:var(--gold); transform:translateY(-1px);}

.rz-job{margin-bottom:26px;}
.rz-job-head{display:flex; justify-content:space-between; gap:16px; align-items:baseline; flex-wrap:wrap;}
.rz-role{font-family:var(--serif); font-size:19px; font-weight:600; margin:0; line-height:1.25;}
.rz-company{font-size:14px; color:var(--muted); margin:3px 0 0;}
.rz-period{font-family:var(--mono); font-size:12px; color:var(--ink-soft); letter-spacing:.04em; white-space:nowrap;}
.rz-points{margin:12px 0 0; padding-left:0; list-style:none; display:grid; gap:8px;}
.rz-points li{position:relative; padding-left:18px; font-size:14.5px; color:var(--ink-soft);}
.rz-points li:before{content:""; position:absolute; left:0; top:10px; width:8px; height:1px; background:var(--pine);}
.rz-earlier{margin-top:22px; padding-top:18px; border-top:1px dashed var(--line);}
.rz-earlier-row{display:flex; justify-content:space-between; gap:12px; font-size:14px; color:var(--ink-soft); margin:6px 0;}

.rz-grid{display:grid; gap:0;}
@media(min-width:620px){ .rz-grid{grid-template-columns:1fr 1fr; gap:40px;} .rz-grid .rz-section{border-top:1px solid var(--line);} }
.rz-skillgroup{margin-bottom:16px;}
.rz-skilllabel{font-size:13px; font-weight:600; color:var(--ink); margin:0 0 8px;}
.rz-tags{display:flex; flex-wrap:wrap; gap:7px;}
.rz-tag{font-size:12.5px; padding:4px 10px; border:1px solid var(--line); border-radius:999px; color:var(--ink-soft); background:rgba(46,110,94,0.05);}
.rz-edu{margin-bottom:14px;}

.rz-agent{background:var(--panel); color:var(--on-dark);}
@media(min-width:900px){ .rz-agent{position:sticky; top:0; height:100vh;} }
.rz-agent-inner{display:flex; flex-direction:column; height:100%; min-height:560px; padding:30px 24px 18px;}
@media(min-width:900px){ .rz-agent-inner{height:100vh;} }
.rz-agent-head{flex:0 0 auto; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.09);}
.rz-status{font-family:var(--mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#8FB7AB; margin:0 0 14px; display:flex; align-items:center; gap:8px;}
.rz-dot{width:8px; height:8px; border-radius:50%; background:#4CC79E; animation:rzpulse 2.4s infinite;}
@keyframes rzpulse{0%{box-shadow:0 0 0 0 rgba(76,199,158,.5);}70%{box-shadow:0 0 0 7px rgba(76,199,158,0);}100%{box-shadow:0 0 0 0 rgba(76,199,158,0);}}
.rz-tabs{display:flex; gap:6px; background:rgba(255,255,255,0.05); padding:4px; border-radius:11px;}
.rz-tab{flex:1; display:flex; align-items:center; justify-content:center; gap:7px; font-family:var(--sans); font-size:13px; font-weight:500; color:#9DAAB0; background:transparent; border:none; border-radius:8px; padding:9px 6px; cursor:pointer; transition:background .15s,color .15s;}
.rz-tab.on{background:var(--panel-2); color:#fff;}
.rz-tab svg{color:var(--gold);}

.rz-thread{flex:1 1 auto; overflow-y:auto; padding:20px 2px; display:flex; flex-direction:column; gap:14px;}
.rz-empty p{font-size:13px; color:#8C99A0; margin:0 0 12px;}
.rz-chips{display:flex; flex-direction:column; gap:8px;}
.rz-chip{text-align:left; font-family:var(--sans); font-size:13.5px; color:var(--on-dark); background:var(--panel-2); border:1px solid rgba(255,255,255,0.08); border-radius:11px; padding:11px 14px; cursor:pointer; transition:border-color .15s,transform .1s;}
.rz-chip:hover{border-color:var(--pine); transform:translateX(2px);}
.rz-msg{max-width:88%; font-size:14.5px;}
.rz-msg p{margin:0; white-space:pre-wrap;}
.rz-msg-user{align-self:flex-end; background:var(--pine); color:#fff; padding:11px 14px; border-radius:14px 14px 4px 14px;}
.rz-msg-bot{align-self:flex-start;}
.rz-msg-tag{font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#7E8C93; display:block; margin-bottom:5px;}
.rz-msg-bot p{background:var(--panel-2); padding:12px 15px; border-radius:4px 14px 14px 14px; color:var(--on-dark); line-height:1.55;}
.rz-typing{display:inline-flex; gap:5px; align-items:center;}
.rz-typing i{width:6px; height:6px; border-radius:50%; background:#6E7E85; animation:rzbounce 1.2s infinite;}
.rz-typing i:nth-child(2){animation-delay:.18s;} .rz-typing i:nth-child(3){animation-delay:.36s;}
@keyframes rzbounce{0%,60%,100%{opacity:.3; transform:translateY(0);}30%{opacity:1; transform:translateY(-3px);}}
.rz-error{font-size:13px; color:#E8A0A0; margin:4px 0;}

.rz-inputbar{flex:0 0 auto; display:flex; align-items:flex-end; gap:8px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.09);}
.rz-input{flex:1; resize:none; max-height:120px; background:var(--panel-2); color:var(--on-dark); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:11px 13px; font-family:var(--sans); font-size:14.5px; line-height:1.45; outline:none;}
.rz-input::placeholder{color:#6E7E85;}
.rz-input:focus-visible{border-color:var(--pine);}
.rz-send,.rz-reset{flex:0 0 auto; width:42px; height:42px; border-radius:11px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:opacity .15s,background .15s;}
.rz-send{background:var(--pine); color:#fff;}
.rz-send:hover:not(:disabled){background:var(--pine-deep);}
.rz-send:disabled{opacity:.4; cursor:default;}
.rz-reset{background:transparent; color:#8C99A0; border:1px solid rgba(255,255,255,0.12);}
.rz-reset:hover{color:var(--on-dark); border-color:rgba(255,255,255,0.25);}
.rz-disclaimer{font-size:11px; color:#67757C; margin:10px 2px 0; text-align:center; line-height:1.4;}

.rz-contactpane{flex:1 1 auto; overflow-y:auto; padding:20px 2px 8px; display:flex; flex-direction:column; gap:14px;}
.rz-contactintro{font-size:13.5px; color:#9DAAB0; margin:0; line-height:1.55;}
.rz-field{display:flex; flex-direction:column; gap:6px;}
.rz-field span{font-size:12px; color:#9DAAB0; font-weight:500;}
.rz-field em{color:#67757C; font-style:normal;}
.rz-field input,.rz-field textarea{background:var(--panel-2); color:var(--on-dark); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px 12px; font-family:var(--sans); font-size:14px; outline:none; resize:none;}
.rz-field input::placeholder,.rz-field textarea::placeholder{color:#67757C;}
.rz-field input:focus-visible,.rz-field textarea:focus-visible{border-color:var(--pine);}
.rz-mailbtn{display:flex; align-items:center; justify-content:center; gap:8px; background:var(--pine); color:#fff; border:none; border-radius:11px; padding:12px; font-family:var(--sans); font-size:14.5px; font-weight:600; cursor:pointer; margin-top:4px; transition:background .15s,opacity .15s;}
.rz-mailbtn:hover:not(:disabled){background:var(--pine-deep);}
.rz-mailbtn:disabled{opacity:.4; cursor:default;}
.rz-directlinks{display:flex; justify-content:center; gap:20px; margin-top:6px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.09);}
.rz-directlinks a{display:inline-flex; align-items:center; gap:6px; font-size:12.5px; color:#9DAAB0; text-decoration:none;}
.rz-directlinks a:hover{color:var(--on-dark);}
.rz-confirm{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:12px; padding:24px;}
.rz-confirm-icon{width:46px; height:46px; border-radius:50%; background:rgba(76,199,158,0.15); color:#4CC79E; display:flex; align-items:center; justify-content:center;}
.rz-confirm h3{font-family:var(--serif); font-size:20px; margin:0; color:#fff;}
.rz-confirm p{font-size:13.5px; color:#9DAAB0; margin:0; line-height:1.55;}
.rz-confirm a{color:#8FB7AB;}
.rz-textbtn{background:none; border:none; color:var(--gold); font-size:13.5px; cursor:pointer; margin-top:4px; font-family:var(--sans);}

.rz a:focus-visible,.rz button:focus-visible,.rz textarea:focus-visible,.rz input:focus-visible{outline:2px solid var(--gold); outline-offset:2px;}
@media(prefers-reduced-motion:reduce){ .rz *{animation:none !important; transition:none !important;} }

@media print{
  .rz{ background:#fff !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .rz-wrap{ grid-template-columns:1fr !important; max-width:none; display:block; }
  .rz-agent, .rz-download, .rz-fit, .rz-game{ display:none !important; }
  .rz-doc{ padding:0 !important; }
  .rz-section, .rz-job, .rz-looking, .rz-signature, .rz-case, .rz-fit{ break-inside:avoid; }
  .rz-section{ padding-top:20px; margin-top:20px; }
  a{ color:inherit !important; text-decoration:none; }
  @page{ margin:14mm; }
}
`;
