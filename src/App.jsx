import React, { useState, useRef, useEffect } from "react";
import { Send, RotateCcw, MapPin, Mail, Phone, ArrowUpRight, Sparkles, MessageSquare, Linkedin, Check, Download, Compass, Target, Trophy, Coins } from "lucide-react";

/* =====================================================================
   EVERYTHING ABOUT YOU LIVES IN THIS ONE OBJECT.
   The resume, the AI agent, and the "Message Ben" form all read
   from here, edit once, update everywhere.
   ===================================================================== */
const CANDIDATE = {
  name: "Ben Phillips",
  title: "Global Compensation & Total Rewards Leader",
  tagline:
    "I turn compensation into a strategic business lever, through pay equity, transparency, and AI-enabled, decision-grade analytics.",
  location: "Detroit Metro, Michigan",
  email: "Bphill10@gmail.com",
  phone: "734-645-3508",
  openTo: "Open to senior Compensation & Total Rewards leadership roles",
  lookingFor: {
    summary:
      "Most of all, I'm looking for a culture where innovation and collaboration actually meet: the room to build, the trust to do the right thing for the business, and people I genuinely enjoy working with. On top of that, a senior compensation role where I can own global comp and total rewards end-to-end, tying compensation, AI, and analytics together into transparent, data-driven pay at scale. I want a place where knowledge is shared openly and AI is an ally, part of the team rather than something people are afraid of.",
    statement: "My biggest strength has never been the things I've built. It's the things I imagine, and the mentors, people, and AI that help build them.",
    roles: ["Director of Compensation", "Director, Total Rewards", "Senior Director, Global Compensation", "Head of Compensation", "Head of Total Rewards", "VP, Compensation", "VP, Total Rewards", "SVP, Compensation", "Compensation, AI & Analytics Leader", "Compensation COE Leader"],
  },
  signature: {
    headline: "Built and deployed a single global job architecture across 40+ countries",
    detail:
      "Consolidated 3,000+ legacy titles into one unified framework for 35,000+ employees, enabling consistent leveling, market pricing, and career paths worldwide.",
    metrics: [
      { value: "40+", label: "countries" },
      { value: "3,000+", label: "titles unified" },
      { value: "35,000+", label: "employees" },
    ],
  },
  approach:
    "Ben's throughline is simplifying complexity into decisions leaders can act on, using technology, analytics, and clear operating models to standardize processes. He treats change management, communication, and enablement as seriously as design and analytics, making complex compensation topics simple and trustworthy for managers, executives, and boards.",
  caseStudies: [
    {
      tag: "Job Architecture",
      title: "Unifying global compensation across 40+ countries",
      summary:
        "Replaced fragmented, spreadsheet-driven pay processes with a single global job architecture and modernized salary and incentive structures, consolidating 3,000+ legacy titles into one governed framework.",
      outcome: "Consistent leveling, market pricing, and career paths for 35,000+ employees, with faster, more defensible pay decisions.",
    },
    {
      tag: "AI & Analytics",
      title: "A decision-grade compensation analytics ecosystem",
      summary:
        "Built an AI-powered job-description and benchmarking engine mapping 3,500+ roles to external surveys, paired with automated Power BI pipelines.",
      outcome: "Executives gained real-time visibility into pay, headcount, and workforce cost, replacing manual analysis with governed, on-demand insight.",
    },
    {
      tag: "Equity & Governance",
      title: "Pre-IPO equity conversion in a regulated environment",
      summary:
        "At Ally Financial, managed the phantom-to-public equity conversion for 1,000+ employees and governed RSU/IRSU/DSU programs alongside executive compensation and proxy reporting.",
      outcome: "100% SEC/SOX compliance through a major transformation and IPO-related equity transition.",
    },
    {
      tag: "Pay Equity",
      title: "Pay equity and transparency governance",
      summary:
        "Built the governance, analysis, and reporting behind pay equity and pay transparency, aligned to U.S. and emerging EU requirements, and embedded equity checks directly into the regular compensation cycle.",
      outcome: "Defensible, audit-ready pay practices and a transparency framework leadership and the board could stand behind.",
    },
    {
      tag: "Process & Automation",
      title: "Automating the merit and incentive cycle",
      summary:
        "At MB Financial, redesigned and automated merit, incentive, and equity administration for 1,500+ employees, replacing manual, spreadsheet-heavy steps with a streamlined process.",
      outcome: "Cut administrative workload by roughly half while improving accuracy and speeding up the cycle.",
    },
    {
      tag: "Total Rewards Ops",
      title: "Modernizing benefits and open enrollment",
      summary:
        "Owned company-wide benefits administration and ran open enrollment with a focus on clear communication and employee self-service.",
      outcome: "Reached 98% enrollment completion while cutting benefits support requests by 30%.",
    },
  ],
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/benjamin-j-phillips", icon: "linkedin" },
  ],
  summary:
    "Strategic, AI-driven global compensation and total rewards leader with a strong track record of designing and scaling enterprise compensation, job architecture, and pay governance for complex, multi-country organizations. I partner with CHROs, CFOs, and executive leaders to align pay strategy with business objectives, and translate market, equity, and regulatory requirements into clear, practical decisions, building AI-enabled analytics platforms and governance frameworks that replace manual work with consistency, transparency, and control.",
  highlights: [
    "Deployed a single global job architecture across 40+ countries, 3,000+ legacy titles unified for 35,000+ employees",
    "Built an AI-powered job-description & benchmarking engine mapping 3,500+ roles to external market surveys",
    "Advise executives and boards on multi-million-dollar workforce and compensation investments",
  ],
  experience: [
    {
      role: "Senior Director, Global Compensation, North America & APAC",
      company: "Stefanini Group",
      period: "2016–Present",
      location: "Southfield, MI",
      points: [
        "Enterprise owner of global compensation strategy and analytics; lead design and governance of global job architecture, salary structures, market pricing, and incentive programs.",
        "Deployed a single global job architecture across 40+ countries, consolidating 3,000+ legacy titles into one framework supporting 35,000+ employees.",
        "Created an AI-powered JD and benchmarking engine mapping 3,500+ roles to surveys (Radford, Mercer, WTW, Aon, IPAS) and built a Power BI analytics ecosystem for real-time pay and labor-cost visibility.",
        "Lead pay equity and transparency governance aligned to U.S. and EU requirements; steward the global annual comp cycle and advise the board on major workforce investments.",
      ],
    },
    {
      role: "Manager, Compensation & Benefits | HR Operations",
      company: "MB Financial",
      period: "2015–2016",
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
      period: "2013–2015",
      location: "Detroit, MI",
      points: [
        "Ran enterprise market and pay-equity analysis across 4,000+ employees and redesigned job architecture for 600+ roles during major transformation.",
        "Managed the phantom-to-public equity conversion for 1,000+ employees ahead of IPO; governed RSUs/IRSUs/DSUs at 100% SEC/SOX compliance.",
        "Handled executive compensation reporting for TARP-covered executives and validated proxy (10-K) disclosures for named executive officers.",
      ],
    },
  ],
  earlier: [
    { role: "Analytic Consultant", company: "Truven Health Analytics", period: "2011–2013" },
    { role: "Finance & Accounting Associate", company: "EHIM", period: "2010–2011" },
  ],
  skills: [
    { group: "Compensation & Rewards", items: ["AI-driven compensation", "Global compensation strategy", "Job architecture & market pricing", "Pay equity & transparency", "Compensation governance", "Incentive & variable pay"] },
    { group: "Analytics & Systems", items: ["Analytics & decision support", "HRIS & compensation systems", "Power BI", "Financial & scenario modeling", "Workforce cost strategy"] },
    { group: "Leadership & Advisory", items: ["Executive & board advisory", "People & COE leadership", "Change leadership", "Stakeholder influence", "Executive communication", "Global program scaling"] },
  ],
  education: [
    { school: "University of Michigan–Dearborn", credential: "M.S. Finance (2013) · M.B.A. (2011)" },
    { school: "Eastern Michigan University", credential: "B.B.A., Magna Cum Laude (2009)" },
  ],
  coverLetter: [
    "Complexity often creeps into organizations, especially in compensation, data, and workforce decisions. My career has focused on doing the opposite: using technology, analytics, and clear operating models to simplify and standardize processes, turning complexity into decisions leaders can act on. For more than 15 years, I have built modern, scalable compensation and analytics platforms that replace manual work, reduce friction, and make change sustainable.",
    "In my current role as Senior Director of Global Compensation at Stefanini Group, I lead global compensation strategy and analytics for 35,000 employees across more than forty countries. I have built a unified global job architecture, modernized salary and incentive structures, and developed a decision-grade analytics ecosystem that gives executives real-time visibility into pay, headcount, and workforce costs. This work has shifted the organization from fragmented, spreadsheet-driven processes to a governed, technology-enabled approach that supports faster, clearer, and more defensible decisions.",
    "Systems only work if people understand and trust them. I focus on change management, communication, and enablement as much as I do on design and analytics, making complex topics simple and actionable for leaders and managers. This approach has supported pay equity and transparency efforts, strengthened global market pricing strategies, and enabled executive teams and boards to make informed decisions on significant workforce and compensation investments.",
    "Earlier in my career, I built a solid foundation in regulated, public company environments at Ally Financial and MB Financial, working across executive compensation governance, equity programs, IPO-related equity conversion, and large-scale program operations. Across each role, my focus has been consistent: using data, technology, and disciplined operating models to simplify complexity, improve decision quality, and build scalable solutions.",
    "I am drawn to organizations that value clarity, accountability, and continuous improvement. I would welcome the opportunity to bring my experience to a team looking to simplify how work gets done, strengthen decision-making, and position compensation as a true strategic advantage.",
  ],
};

/* ===================== COMPENSATION DOMAIN KNOWLEDGE =====================
   General total-rewards knowledge (in plain language) so the agent can give real,
   substantive answers on comp, not just talk about Ben. Synthesized professional
   knowledge; provider descriptions are factual, not copied from any report. */
const COMP_KNOWLEDGE = `TOTAL REWARDS & PAY COMPONENTS
- Total rewards = total cash + benefits + long-term incentives/equity + intangibles (career, recognition, flexibility). Total cash = base salary + short-term incentives (bonus). Total direct comp = total cash + long-term incentives.
- Base pay is fixed cash for the role; variable/at-risk pay (bonus, commission, incentives) flexes with performance.

MARKET PRICING METHODOLOGY (how a job gets benchmarked)
- Match the internal job to survey "benchmark" jobs by content and scope, not title. Use several reputable surveys, never just one.
- Age/trend survey data to a common date using an annual aging factor, since data is collected at a past point.
- Blend sources into a single market composite (a "market line"), often weighting by survey quality/relevance.
- Choose a market posture: lead, lag, or match (e.g., target the 50th percentile = match; 65th-75th = lead).
- Apply geographic differentials; decide national vs. local market and a remote-pay strategy.
- Read percentiles: 10th / 25th / 50th (median) / 75th / 90th. The median is the usual anchor for a range midpoint.

PAY STRUCTURES & KEY METRICS
- A salary structure is a set of grades, each with a range (minimum, midpoint, maximum) built around market midpoints.
- Range spread = (max - min) / min. Roughly 30-40% for support/ops, 40-50% for professional, 50%+ for executive.
- Midpoint progression = % gap between adjacent grade midpoints (often ~10-20%).
- Compa-ratio = pay / midpoint (or / market median). 1.00 = at midpoint/market; below ~0.80 lags; ~0.95-1.10 competitive; above ~1.20 well above market.
- Range penetration = (pay - min) / (max - min): where pay sits in the band (0% = min, 100% = max).

VARIABLE PAY & INCENTIVES
- Merit increase: annual base bump tied to performance and position-in-range (lower-in-range typically gets more).
- Short-term incentive (STI)/annual bonus: a target % of base, funded by company and individual results.
- Long-term incentive (LTI): stock options, RSUs, and performance share units (PSUs); vest over years to retain and align with shareholders.
- Sales comp: on-target earnings (OTE) = base + target incentive; "pay mix" is the base:incentive split (e.g., 60/40). Levers include quota, commission rate, accelerators (higher rate past quota), caps, draws, and SPIFFs. Commission-heavy mixes fit short transactional cycles; base-heavy fits long, complex, team-based sales.

JOB ARCHITECTURE & LEVELING
- Job architecture sorts roles into families and functions with consistent career levels (management vs. individual-contributor tracks) and global grades.
- Leveling frameworks (Mercer IPE, WTW Global Grading System, Aon/Radford leveling) size roles by scope, impact, knowledge, and accountability so jobs compare across countries.

PAY EQUITY
- Unadjusted (raw) gap vs. adjusted gap (controlling for legitimate factors like level, function, location, tenure).
- Measured with regression/cohort analysis; remediation closes unexplained gaps. EU rules treat an unexplained gap above 5% as a trigger for a corrective joint pay assessment.

GOVERNANCE & EXECUTIVE COMP
- The Board's Compensation Committee oversees executive pay using a defined peer group. Say-on-pay is the shareholder advisory vote; the CD&A (Compensation Discussion & Analysis) and pay-versus-performance tables live in the proxy.
- Proxy advisors ISS and Glass Lewis influence votes. Clawbacks recover incentive pay after restatements (Dodd-Frank/SEC).

MAJOR SURVEY & ADVISORY PROVIDERS (what each is known for)
- Mercer: broad global comp/benefits surveys, IPE leveling, total-rewards consulting.
- WTW (Willis Towers Watson; formed from Towers Watson, which had absorbed Watson Wyatt): global surveys, Global Grading System, executive comp.
- Aon: comp consulting; its Radford surveys are the standard for technology and life sciences, and McLagan for financial services.
- Payscale and Salary.com: large, tech-driven market data plus software; Payscale publishes the Compensation Best Practices Report.
- WorldatWork: the leading total-rewards professional body, certifications (e.g., CCP), the Salary Budget Survey, and standards of practice.
- Pearl Meyer (executive), ERI, Culpepper (tech), and Gartner are other respected sources.
- Best practice: triangulate multiple surveys; never price off a single source.`;

/* 2026 trends, single source of truth used by BOTH the agent and the visible section.
   Grounded in 2025-26 surveys (Mercer, WorldatWork, Payscale, WTW, Pearl Meyer) and EU/US law. */
const COMP_TRENDS_2026 = [
  { n: 1, title: "Budgets settled near 3.5%", detail: "After the 2021-23 spike, 2026 merit and total-increase budgets are stabilizing around 3.2-3.7% across the major surveys, a third straight year of disciplined, targeted spend rather than broad market-chasing." },
  { n: 2, title: "The return of 'peanut-butter' raises", detail: "A striking share of employers are spreading increases evenly instead of differentiating by performance. Payscale found fewer than half plan to differentiate, and Mercer reports most distribute budgets equally, trading pay-for-performance for less admin burden." },
  { n: 3, title: "Pay transparency goes global", detail: "The EU Pay Transparency Directive must be in national law by June 7, 2026: salary ranges in postings, no salary-history questions, gender pay-gap reporting, and a mandatory joint pay assessment where an unexplained gap tops 5%. US state momentum continues." },
  { n: 4, title: "Job architecture becomes a compliance asset", detail: "Transparency rules demand defensible, gender-neutral leveling and 'equal pay for work of equal value,' turning clean global job architecture and consistent leveling from good hygiene into a legal necessity." },
  { n: 5, title: "AI moves into the comp function", detail: "Agentic AI and analytics are automating benchmarking, plan modeling, and routine rewards work. Mercer estimates AI could absorb roughly half a rewards team's workload, shifting comp pros toward strategy, governance, and judgment." },
  { n: 6, title: "The AI-skills pay gap", detail: "Employers are rewriting job descriptions to require AI skills but mostly aren't paying premiums for them yet. Payscale found a majority offer no extra pay, even as AI fluency spreads well beyond engineering into finance, HR, and management." },
  { n: 7, title: "Skills-based pay gains ground", detail: "More organizations are pricing the market value of specific skills and capabilities, not just rigid job slots, and building those skill premiums into ranges." },
  { n: 8, title: "Real-time data challenges the annual survey", detail: "Live job-posting data and continuous 'compensation intelligence' are supplementing once-a-year surveys, pushing toward more dynamic, in-cycle pricing and faster market reads." },
  { n: 9, title: "Pay diverges by role and labor supply", detail: "Averages are flat, but the spread is wide: skilled trades and frontline roles command premiums while tech and professional-services pay cools, and remote workers see smaller increases and slower advancement." },
  { n: 10, title: "Total rewards beyond cash", detail: "With cash budgets tight and benefit costs climbing, employers lean on personalized benefits, wellbeing, equity, and better pay communication to stay competitive, and transparency rules now define 'pay' to include benefits, not just base salary." },
];

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

  return `You are the recruiting representative for ${c.name}, speaking with a recruiter or hiring manager evaluating them. Answer questions about ${c.name}'s background as a knowledgeable, professional advocate, warm, concise, specific.

CANDIDATE PROFILE
Name: ${c.name}
Focus: ${c.title}
Positioning: ${c.tagline}
Location: ${c.location}, ${c.openTo}
Looking for: ${c.lookingFor.summary} ${c.lookingFor.statement} Target roles: ${c.lookingFor.roles.join(", ")}.
Summary: ${c.summary}
Highlights: ${c.highlights.join("; ")}
Biggest accomplishment: ${c.signature.headline}: ${c.signature.detail}
Experience:
${exp}
Earlier roles: ${earlier}
Skills: ${skills}
Education: ${edu}
Approach & style: ${c.approach}
Selected case studies (use these when a recruiter asks about a specific project):
${cases}

COMPENSATION DOMAIN KNOWLEDGE
This is Ben's field. Use the knowledge below to answer general compensation and total-rewards questions accurately and substantively, even when the question isn't about Ben specifically. Where natural, connect it back to how Ben thinks or what he's built, but you don't have to force it.
${COMP_KNOWLEDGE}

2026 COMPENSATION TRENDS (you can speak to these credibly; drawn from 2025-26 surveys by Mercer, WorldatWork, Payscale, WTW, and Pearl Meyer, plus EU/US pay-transparency law):
${COMP_TRENDS_2026.map((t) => `${t.n}. ${t.title}: ${t.detail}`).join("\n")}

RULES
- Facts about Ben must be supported by the profile above. For anything it doesn't cover (exact salary expectations, relocation, references, availability dates, anything personal), say the recruiter can reach Ben directly via the "Message Ben" tab rather than guessing. Never invent employers, dates, or metrics about Ben.
- You MAY answer general comp/total-rewards questions using the knowledge and trends sections, that's the point of this agent. Keep it accurate; if asked for a precise current figure you're unsure of (e.g., this year's exact budget number), give the approximate range and note it's worth confirming against the latest survey.
- Keep answers concise, usually 2 to 6 sentences. Write the way a sharp professional talks: do not use em-dashes; use commas, periods, parentheses, or colons instead. Prose by default; a short list is fine when walking through a comp concept or the 2026 trends.
- Refer to the candidate as "Ben" or "they," not "I", you represent him.
- Stay on professional topics; politely redirect anything off-topic.`;
}

const SUGGESTED = [
  "Walk me through their global comp experience.",
  "How have they used AI in compensation?",
  "What are the big compensation trends for 2026?",
  "Explain compa-ratio and how market pricing works.",
  "Why should we interview them?",
];

/* ===================== TARGET JOB POSTINGS =====================
   Real roles Ben is targeting. When a recruiter types a company that matches
   one of these (by any keyword), the fit generator maps Ben's background to
   THIS posting's actual requirements. No match → general fit fallback.
   These are NOT shown on the page; they only power the fit generator.
   To add one: copy a block, fill in company, role, keywords (lowercase), and
   a short summary of the posting's key requirements. */
const TARGET_JOBS = [
  {
    company: "RGP (Resources Connection)",
    role: "Senior Director, Global Compensation",
    keywords: ["rgp", "resources connection", "resources global professionals"],
    requirements:
      "Manage a global career-track job structure and advanced market pricing of all jobs. Own global base-pay programs plus sales, functional, executive, management, and broad-based incentive plans, and equity programs. Administer quarterly/semi-annual/annual incentive plans globally (including sales incentive plans) and ensure accrual accuracy with Finance. Prepare quarterly Compensation Committee recommendations and presentations with the executive team and Legal. Run the annual compensation review (base-pay adjustments and promotions). Develop SOX controls with Accounting and Internal Audit. Requires Workday and Workday Advanced Comp Module (approver/configuration); Xactly sales-comp tool preferred. 10+ years of global executive, broad-based, and sales compensation design and administration, plus experience leading a global comp team. Reports to the Chief Legal Officer and Interim Head of HR.",
  },
  {
    company: "Elevate",
    role: "Director, Global Compensation",
    keywords: ["elevate", "oneelevate", "one elevate"],
    requirements:
      "Sports/media/entertainment consulting firm (~700 employees, 20 global locations); reports to the EVP, People. Develop and implement a comprehensive global compensation strategy and philosophy spanning base, variable, and long-term incentives for a distributed workforce, and serve as a trusted advisor to senior leadership. Lead design and execution of base salary structures, variable pay (bonus and sales commission planning/administration), and short- and long-term incentive plans. Run annual, mid-year, and off-cycle compensation cycles (merit, promotions, incentives), market benchmarking, and pay equity analysis. Own job architecture, job descriptions, salary bands and grades across global markets in compliance with global regulations. Deliver compensation analytics, dashboards, and survey participation; champion equitable pay; and lead change management. Requires 7+ years of progressive compensation experience (incentive and/or equity), 3+ years of leadership, global regulatory knowledge, and HRIS/compensation tools.",
  },
  {
    company: "Teladoc Health",
    role: "Senior Director, Compensation & Benefits",
    keywords: ["teladoc"],
    requirements:
      "Public company (virtual care). Reports to the Head of HR, Strategy & Governance and partners with the Chief Legal Officer, Controller, CFO, executive team, Board, and Compensation Committee. Lead strategy, design, governance, and execution of global compensation and benefits, with near-term emphasis on strengthening broad-based comp, executive comp, incentive design, equity administration partnership, and benefits. Build the foundation for a mature, scalable, integrated Total Rewards framework. Lead broad-based programs (salary structures, market benchmarking, merit and promotion guidelines, pay equity), design STI/LTI/equity, prepare Compensation Committee materials, and ensure public-company disclosure and SEC compliance with Legal, Finance, and Accounting. Oversee benefits strategy and administration, build analytics and dashboards, and lead a high-performing team. Requires 10+ years of compensation and benefits experience, public-company experience including Compensation Committee support, and executive/Board partnership.",
  },
  {
    company: "Sprinklr",
    role: "Senior Manager, Compensation",
    keywords: ["sprinklr"],
    requirements:
      "AI-native customer-experience SaaS platform; core member of the Global Total Rewards team. Own key elements of compensation governance, standards, and frameworks; design, maintain, and evolve broad-based programs with global consistency. Establish governance models, policies, and controls; partner with Legal and HR Risk on pay equity and regulatory compliance. Lead design and redesign of salary structures, job architecture components, incentive plans, and annual planning. Support benchmarking, survey selection, and participation. Apply strong analytics and executive-ready PowerPoint storytelling. Drive process improvement, automation, and responsible AI enablement (pay modeling, structure diagnostics, equity analysis), and enhance Workday for compensation planning and analytics. Requires 8+ years of compensation/total rewards with broad-based focus and Compensation COE experience; SaaS/tech and Workday preferred; CCP preferred. (Note: this is a Senior Manager role, a level below VP/Senior Director.)",
  },
  {
    company: "Fortitude Re",
    role: "AVP, Compensation",
    keywords: ["fortitude re", "fortitude reinsurance", "fortitude"],
    requirements:
      "Bermuda-based legacy reinsurance firm (~$111B general account; backed by The Carlyle Group and T&D). Member of the Total Rewards team; partners with the SVP, Total Rewards. Lead design, governance, and delivery of compensation programs: base salary structures, incentive plans, and equity programs, with frameworks, guidelines, and controls. Manage the end-to-end annual compensation cycle (salary increases, bonus, equity planning) and lead compensation communication and education. Oversee equity program administration and the third-party equity vendor, and partner with Accounting on equity reporting, expense, and compliance. Lead market benchmarking and analytics; lead pay-review analyses and remediation; ensure compliance including pay transparency. Lead enterprise job architecture and leveling frameworks. Requires 7-10+ years of compensation experience (program design and governance), broad-based comp including base/incentive/equity, familiarity with AI-driven tools, and Workday/HRIS; CCP a plus. (Financial-services/insurance context, which fits Ben's background. Note: AVP is a level below VP/Senior Director.)",
  },
  {
    company: "Avalara",
    role: "VP, Total Rewards",
    keywords: ["avalara"],
    requirements:
      "AI-first tax-compliance software company; fully remote. A highly visible role advising executive leadership on reward strategies that drive performance, engagement, and organizational success, connecting rewards decisions directly to business performance and company outcomes. Position Total Rewards as a function that helps the business stay ahead, balancing speed with rigor and simplicity with precision, and staying focused on what drives outcomes rather than theoretical perfection. Lead the strategy, design, and administration of compensation and benefits across the company. Because Avalara is AI-first, the role expects hands-on use of AI and AI-related technologies embedded in workflows, decision-making, and process efficiency. (Strong alignment with Ben's AI-driven compensation and benchmarking work.)",
  },
  {
    company: "Mapbox",
    role: "Senior Director, People Operations & Total Rewards",
    keywords: ["mapbox"],
    requirements:
      "Real-time location/geospatial software platform; remote (US), roughly $261K-$354K total cash. Lead global HR Operations, Total Rewards (compensation and benefits), and People Analytics, ensuring systems and processes are scalable. Manage a team (a Benefits lead, a Compensation individual contributor, and an Operations manager). Own the People technology roadmap and integrate AI into workflows to turn data and operations into a strategic, high-velocity asset. Evolve the total rewards philosophy into a strategic function and provide hands-on compensation strategy and execution (including modeling a complex equity refresh in Excel). Own the operational and compliance health of international entities (hubs in Helsinki, Belarus, Japan) and PEO relationships within a remote-first culture; act as functional architect for the HRIS (Rippling or similar); and build advanced, predictive people analytics (headcount trends, pay equity, org health). Requires 12+ years in People Ops and Total Rewards, ideally in high-growth remote-friendly tech, with hands-on HRIS/data architecture, AI/automation implementation, and global (especially Europe) experience. (Broader People-Ops + HRIS scope than pure comp, with strong AI alignment to Ben's work.)",
  },
  {
    company: "DraftKings",
    role: "Director, Compensation",
    keywords: ["draftkings", "draft kings", "dkng"],
    requirements:
      "Publicly traded (NASDAQ: DKNG), AI-forward technology/gaming company; remote (US) or Boston; base roughly $196,800-$246,000 plus bonus and equity. Works closely with the VP, Total Rewards to shape global compensation strategy and drive fair, equitable pay. Design, implement, and administer compensation policies, programs, and processes; lead the compensation review process and drive consistency across planning, administration, and performance cycles. Analyze market data and build compensation bands; own job architecture alignment. Coordinate production of data for the CD&A, including compensation tables. Build and run programs such as merit and annual equity awards using Radford data for benchmarking; deep knowledge of standard equity offerings; experience with the Workday compensation planning tool; and M&A and international compensation experience. Requires 8+ years of deep compensation experience (publicly traded company preferred) and strong analytics/spreadsheet skills. (Excellent fit: Radford benchmarking, CD&A, job architecture, and equity all map directly to Ben's background.)",
  },
  {
    company: "Fragomen",
    role: "Senior Director, Global Total Rewards",
    keywords: ["fragomen"],
    requirements:
      "Leading global immigration-services firm (6,000+ professionals, 70+ offices, 170+ countries); remote (US). Reports to the CHRO and serves as strategic advisor on reward and benefits philosophy and global program design. Develop and lead a global Total Rewards strategy aligned to the firm's professional-services operating model, and lead the global Compensation, Benefits, and HRIS teams. Oversee global compensation program design including base pay, variable pay, merit cycles, market benchmarking, global leveling, and job architecture; lead partner and executive compensation programs. Introduce modern compensation governance including pay transparency frameworks, pay equity analytics, and audit processes; guide compensation modeling, scenario planning, and budgeting with Finance. Lead global benefits strategy (health, welfare, retirement, wellness, leave), vendor management and negotiations, and compliance across global markets. (Strong fit: global comp, job architecture, pay equity/transparency, and executive comp all align with Ben's background.)",
  },
  {
    company: "Pluralsight",
    role: "Senior Director, Total Rewards",
    keywords: ["pluralsight"],
    requirements:
      "Cloud/edtech/software company (tech skills-development platform); remote (US) or Draper, UT; base roughly $166K-$205K. Key member of the People leadership team responsible for developing and leading comprehensive compensation, benefits, and rewards strategies that attract, retain, and motivate talent. Oversee global total rewards programs including base salary, bonus structures, long-term incentives, health and wellness benefits, recognition, and retirement plans, ensuring alignment with organizational goals and financial performance. Responsibilities span compensation structures, benefits administration, market analysis, employee communication, stakeholder management, and vendor relations. (Remote, Senior Director scope; good fit with Ben's compensation leadership and analytics.)",
  },
];

function matchJob(name) {
  const t = (name || "").toLowerCase().trim();
  if (!t) return null;
  return (
    TARGET_JOBS.find((j) =>
      j.keywords.some((k) => t.includes(k) || k.includes(t))
    ) || null
  );
}

/* ===================== "Design the Sales Commission Plan", a light, finance-driven game =====================
   Pick an industry vertical, set the real levers (revenue target, gross margin, OTE, headcount, pay mix),
   run the year, and get a P&L scorecard: cost of plan, comp-to-revenue, and EBIT. Illustrative + fun. */
const SALES_INDUSTRIES = [
  { id: "mortgage", name: "Mortgage Lending", blurb: "Loan officers, commission-driven and rate-sensitive.",
    gm: 50, quota: 700000, ote: 180000, hc: 25, idealMix: "aggressive",
    quotaRange: [300000, 1500000], oteRange: [120000, 300000], hcRange: [5, 200],
    compBand: [25, 40], oteBand: [140000, 260000], overhead: 20 },
  { id: "banking", name: "Banking (Retail / Commercial)", blurb: "Relationship managers, steady, regulated, balance-sheet driven.",
    gm: 60, quota: 900000, ote: 130000, hc: 40, idealMix: "conservative",
    quotaRange: [400000, 2000000], oteRange: [90000, 200000], hcRange: [10, 300],
    compBand: [12, 22], oteBand: [100000, 170000], overhead: 25 },
  { id: "consulting", name: "Technology Consulting", blurb: "Sellers of engagements, utilization and bill rates.",
    gm: 38, quota: 1200000, ote: 220000, hc: 30, idealMix: "balanced",
    quotaRange: [600000, 2500000], oteRange: [150000, 320000], hcRange: [5, 250],
    compBand: [15, 28], oteBand: [170000, 290000], overhead: 22 },
];

const PAY_MIXES = [
  { id: "conservative", name: "Conservative", sub: "70 / 30 base·variable", variable: 30 },
  { id: "balanced", name: "Balanced", sub: "60 / 40 base·variable", variable: 40 },
  { id: "aggressive", name: "Aggressive", sub: "40 / 60 base·variable", variable: 60 },
];

const SALES_EVENTS = [
  "Finance re-baselined the targets mid-year. Classic.",
  "A rate move blew up the forecast, sales adapted anyway.",
  "Your top producer got a counter-offer. The plan held them.",
  "Audit asked how the accrual was modeled. You had the answer.",
  "A competitor poached two reps with a richer OTE.",
];

const clampScore = (n) => Math.max(0, Math.min(100, Math.round(n)));
const fmtMoney = (n) => {
  const a = Math.abs(n), sign = n < 0 ? "-" : "";
  if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(1) + "B";
  if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return sign + "$" + Math.round(a / 1e3) + "k";
  return sign + "$" + Math.round(a);
};
const MIX_ORDER = ["conservative", "balanced", "aggressive"];

const KICKERS = [
  { id: "none", name: "No kicker", sub: "base plan", lift: 0, cost: 0 },
  { id: "spif", name: "Targeted SPIF", sub: "strategic / new-product wins", lift: 0.06, cost: 0.05 },
  { id: "accel", name: "Over-quota accelerator", sub: "higher rate past quota", lift: 0.11, cost: 0.13 },
];

function SalesPlanGame() {
  const [step, setStep] = useState("pick");
  const [ind, setInd] = useState(null);
  const [quota, setQuota] = useState(0);
  const [gm, setGm] = useState(0);
  const [ote, setOte] = useState(0);
  const [hc, setHc] = useState(0);
  const [mixId, setMixId] = useState("balanced");
  const [kicker, setKicker] = useState("none");
  const [result, setResult] = useState(null);

  function choose(i) {
    setInd(i); setQuota(i.quota); setGm(i.gm); setOte(i.ote); setHc(i.hc); setMixId(i.idealMix); setKicker("none"); setStep("build");
  }
  function restart() { setStep("pick"); setInd(null); setResult(null); }

  function run() {
    const k = KICKERS.find((x) => x.id === kicker);
    const baseRevenue = quota * hc;
    const revenue = baseRevenue * (1 + k.lift);
    const grossProfit = revenue * (gm / 100);
    const basePlanCost = ote * hc;
    const planCost = basePlanCost + basePlanCost * k.cost;
    const compRatio = revenue > 0 ? (planCost / revenue) * 100 : 0;
    const overheadCost = revenue * (ind.overhead / 100);
    const ebit = grossProfit - planCost - overheadCost;
    const ebitMargin = revenue > 0 ? (ebit / revenue) * 100 : 0;
    const baseEbit = baseRevenue * (gm / 100) - basePlanCost - baseRevenue * (ind.overhead / 100);
    const kickerDelta = ebit - baseEbit;

    let score = 0;
    if (ebitMargin >= 20) score += 40; else if (ebitMargin >= 12) score += 32; else if (ebitMargin >= 5) score += 20; else if (ebitMargin >= 0) score += 8;
    const [clo, chi] = ind.compBand;
    if (compRatio >= clo && compRatio <= chi) score += 25; else if (compRatio >= clo - 5 && compRatio <= chi + 5) score += 12; else score += 3;
    const [olo, ohi] = ind.oteBand;
    if (ote >= olo && ote <= ohi) score += 20; else if (ote >= olo * 0.85 && ote <= ohi * 1.15) score += 10; else score += 3;
    if (mixId === ind.idealMix) score += 15;
    else if (Math.abs(MIX_ORDER.indexOf(mixId) - MIX_ORDER.indexOf(ind.idealMix)) === 1) score += 8; else score += 3;
    if (k.id !== "none") score += kickerDelta >= 0 ? 5 : -4;
    score = clampScore(score);

    const repLine = ote < olo
      ? "Reps: 'This OTE won't beat the offer across the street.'"
      : mixId === "aggressive"
        ? "Reps: 'Big upside on the table, let's hunt.'"
        : "Reps: 'Steady and fair. We can work with this.'";
    const cfoLine = ebit < 0
      ? "CFO: 'We're underwater on this plan. Pull it.'"
      : compRatio > chi
        ? "CFO: 'Comp is eating our margin. Tighten it.'"
        : compRatio < clo
          ? "CFO: 'Cheap, but are we even competitive?'"
          : "CFO: 'Numbers hold. Ship it.'";

    let verdict;
    if (score >= 85) verdict = "Board-ready. Profitable, competitive, and motivating.";
    else if (score >= 70) verdict = "Solid plan. It pencils out and reps will run through walls.";
    else if (score >= 50) verdict = "Workable, with trade-offs, tune the mix or the OTE.";
    else if (score >= 30) verdict = "Shaky. The math or the market is off.";
    else verdict = "Back to the drawing board, this loses money or talent.";

    const kickerLine = k.id === "none" ? null
      : kickerDelta >= 0
        ? `Kicker: the ${k.name.toLowerCase()} added ${fmtMoney(kickerDelta)} to EBIT, it paid for itself.`
        : `Kicker: the ${k.name.toLowerCase()} cost ${fmtMoney(-kickerDelta)} more than it returned, trim it or tie it to margin.`;
    const event = SALES_EVENTS[Math.floor(Math.random() * SALES_EVENTS.length)];
    setResult({ score, verdict, revenue, grossProfit, planCost, compRatio, ebit, ebitMargin, repLine, cfoLine, kickerLine, event });
    setStep("result");
  }

  if (step === "pick") {
    return (
      <div className="rz-game-inner">
        <p className="rz-game-q">Pick an industry to design a plan for:</p>
        <div className="rz-game-products">
          {SALES_INDUSTRIES.map((i) => (
            <button key={i.id} className="rz-game-product" onClick={() => choose(i)}>
              <strong>{i.name}</strong>
              <span>{i.blurb}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "build") {
    const k = KICKERS.find((x) => x.id === kicker);
    const modeled = quota * hc * (1 + k.lift);
    return (
      <div className="rz-game-inner">
        <button className="rz-game-link" onClick={restart}>← change industry</button>
        <h3 className="rz-game-role">{ind.name}</h3>
        <p className="rz-game-blurb">{ind.blurb}</p>

        <div className="rz-game-srow">
          <div className="rz-game-slabel"><span>Revenue target / rep (quota)</span><b>{fmtMoney(quota)}</b></div>
          <input className="rz-game-slider" type="range" min={ind.quotaRange[0]} max={ind.quotaRange[1]} step={10000} value={quota} onChange={(e) => setQuota(Number(e.target.value))} aria-label="Revenue target per rep" />
        </div>
        <div className="rz-game-srow">
          <div className="rz-game-slabel"><span>Gross margin</span><b>{gm}%</b></div>
          <input className="rz-game-slider" type="range" min={15} max={80} step={1} value={gm} onChange={(e) => setGm(Number(e.target.value))} aria-label="Gross margin" />
        </div>
        <div className="rz-game-srow">
          <div className="rz-game-slabel"><span>Target OTE / rep</span><b>{fmtMoney(ote)}</b></div>
          <input className="rz-game-slider" type="range" min={ind.oteRange[0]} max={ind.oteRange[1]} step={5000} value={ote} onChange={(e) => setOte(Number(e.target.value))} aria-label="Target OTE per rep" />
        </div>
        <div className="rz-game-srow">
          <div className="rz-game-slabel"><span>Headcount</span><b>{hc} reps</b></div>
          <input className="rz-game-slider" type="range" min={ind.hcRange[0]} max={ind.hcRange[1]} step={1} value={hc} onChange={(e) => setHc(Number(e.target.value))} aria-label="Headcount" />
        </div>

        <p className="rz-game-q">Pay mix</p>
        <div className="rz-game-opts">
          {PAY_MIXES.map((m) => (
            <button key={m.id} className={mixId === m.id ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setMixId(m.id)}>
              {m.name} <em className="rz-arch-sub">{m.sub}</em>
            </button>
          ))}
        </div>

        <p className="rz-game-q">Kicker on targeted sales</p>
        <div className="rz-game-opts">
          {KICKERS.map((kk) => (
            <button key={kk.id} className={kicker === kk.id ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setKicker(kk.id)}>
              {kk.name} <em className="rz-arch-sub">{kk.sub}</em>
            </button>
          ))}
        </div>

        <p className="rz-game-hint">Modeled book: {fmtMoney(modeled)} revenue across {hc} reps · {ind.name}{kicker !== "none" ? ` · +${Math.round(k.lift * 100)}% targeted lift` : ""}</p>
        <button className="rz-game-btn" onClick={run}>Run the year</button>
      </div>
    );
  }

  const r = result;
  const tiles = [
    { l: "Revenue", v: fmtMoney(r.revenue) },
    { l: "Gross profit", v: fmtMoney(r.grossProfit) },
    { l: "Cost of plan", v: fmtMoney(r.planCost) },
    { l: "Comp \u00f7 revenue", v: r.compRatio.toFixed(1) + "%" },
    { l: "EBIT", v: fmtMoney(r.ebit), neg: r.ebit < 0 },
    { l: "EBIT margin", v: r.ebitMargin.toFixed(1) + "%", neg: r.ebitMargin < 0 },
  ];
  return (
    <div className="rz-game-inner">
      <div className="rz-game-final">
        <Trophy size={26} />
        <p className="rz-game-finalscore">{r.score}<span> / 100</span></p>
        <p className="rz-game-rank">{r.verdict}</p>
      </div>
      <div className="rz-game-scorecard">
        {tiles.map((t) => (
          <div className="rz-game-metric" key={t.l}>
            <p className={t.neg ? "rz-game-mval neg" : "rz-game-mval"}>{t.v}</p>
            <p className="rz-game-mlabel">{t.l}</p>
          </div>
        ))}
      </div>
      <div className="rz-game-lines">
        <p>{r.repLine}</p>
        <p>{r.cfoLine}</p>
        {r.kickerLine && <p>{r.kickerLine}</p>}
        <p className="rz-game-event">{r.event}</p>
      </div>
      <button className="rz-game-btn" onClick={restart}><RotateCcw size={15} /> Build another plan</button>
    </div>
  );
}

/* ===================== Market-price a role, light, interactive demo =====================
   Illustrative U.S. base-pay ranges (annual). NOT real survey data, for demonstration of
   position-to-market / compa-ratio mechanics. Markets apply geographic differentials. */
/* ~400-role catalog generated from job families x levels. Illustrative US-national base
   midpoints; ranges derive from the midpoint, then scale by market (location) and industry. */
const MP_FAMILIES = [
  { id: "swe", fn: "Software Engineering", base: "Software Engineer", anchor: 165000 },
  { id: "fe", fn: "Frontend Engineering", base: "Frontend Engineer", anchor: 160000 },
  { id: "be", fn: "Backend Engineering", base: "Backend Engineer", anchor: 168000 },
  { id: "de", fn: "Data Engineering", base: "Data Engineer", anchor: 162000 },
  { id: "sre", fn: "Site Reliability", base: "Site Reliability Engineer", anchor: 172000 },
  { id: "sec", fn: "Security Engineering", base: "Security Engineer", anchor: 170000 },
  { id: "qa", fn: "Quality Engineering", base: "QA Engineer", anchor: 120000 },
  { id: "mob", fn: "Mobile Engineering", base: "Mobile Engineer", anchor: 162000 },
  { id: "ml", fn: "Machine Learning", base: "Machine Learning Engineer", anchor: 188000 },
  { id: "ds", fn: "Data Science", base: "Data Scientist", anchor: 158000 },
  { id: "daa", fn: "Data Analytics", base: "Data Analyst", anchor: 100000 },
  { id: "pm", fn: "Product Management", base: "Product Manager", anchor: 150000 },
  { id: "ux", fn: "Product Design", base: "Product Designer", anchor: 135000 },
  { id: "uxr", fn: "UX Research", base: "UX Researcher", anchor: 130000 },
  { id: "tpm", fn: "Technical Program Management", base: "Technical Program Manager", anchor: 155000 },
  { id: "it", fn: "IT & Infrastructure", base: "IT Specialist", anchor: 85000 },
  { id: "acct", fn: "Accounting", base: "Accountant", anchor: 88000 },
  { id: "fpa", fn: "Financial Planning & Analysis", base: "Financial Analyst", anchor: 100000 },
  { id: "treas", fn: "Treasury", base: "Treasury Analyst", anchor: 105000 },
  { id: "audit", fn: "Internal Audit", base: "Internal Auditor", anchor: 98000 },
  { id: "tax", fn: "Tax", base: "Tax Analyst", anchor: 98000 },
  { id: "proc", fn: "Procurement", base: "Procurement Specialist", anchor: 92000 },
  { id: "legal", fn: "Legal", base: "Counsel", anchor: 165000 },
  { id: "comp", fn: "Compliance", base: "Compliance Analyst", anchor: 100000 },
  { id: "hrg", fn: "Human Resources", base: "HR Generalist", anchor: 88000 },
  { id: "cmp", fn: "Compensation", base: "Compensation Analyst", anchor: 98000 },
  { id: "ta", fn: "Talent Acquisition", base: "Recruiter", anchor: 92000 },
  { id: "ld", fn: "Learning & Development", base: "L&D Specialist", anchor: 92000 },
  { id: "hrbp", fn: "HR Business Partnership", base: "HR Business Partner", anchor: 118000 },
  { id: "bizops", fn: "Business Operations", base: "Business Operations Analyst", anchor: 112000 },
  { id: "proj", fn: "Project Management", base: "Project Manager", anchor: 108000 },
  { id: "ae", fn: "Sales", base: "Account Executive", anchor: 120000 },
  { id: "sdr", fn: "Sales Development", base: "Sales Development Rep", anchor: 72000 },
  { id: "se", fn: "Solutions Engineering", base: "Solutions Engineer", anchor: 148000 },
  { id: "cs", fn: "Customer Success", base: "Customer Success Manager", anchor: 112000 },
  { id: "sup", fn: "Customer Support", base: "Support Specialist", anchor: 68000 },
  { id: "mkt", fn: "Marketing", base: "Marketing Manager", anchor: 112000 },
  { id: "pmm", fn: "Product Marketing", base: "Product Marketing Manager", anchor: 138000 },
  { id: "content", fn: "Content & Communications", base: "Content Strategist", anchor: 98000 },
  { id: "dg", fn: "Demand Generation", base: "Demand Generation Manager", anchor: 118000 },
  { id: "brand", fn: "Brand & Creative", base: "Brand Designer", anchor: 105000 },
  { id: "clin", fn: "Clinical Operations", base: "Clinical Research Associate", anchor: 98000 },
  { id: "reg", fn: "Regulatory Affairs", base: "Regulatory Affairs Specialist", anchor: 112000 },
  { id: "biostat", fn: "Biostatistics", base: "Biostatistician", anchor: 132000 },
  { id: "nurse", fn: "Nursing", base: "Registered Nurse", anchor: 92000 },
  { id: "pharm", fn: "Pharmacy", base: "Pharmacist", anchor: 132000 },
  { id: "meche", fn: "Mechanical Engineering", base: "Mechanical Engineer", anchor: 102000 },
  { id: "elece", fn: "Electrical Engineering", base: "Electrical Engineer", anchor: 106000 },
  { id: "proce", fn: "Process Engineering", base: "Process Engineer", anchor: 100000 },
  { id: "scm", fn: "Supply Chain", base: "Supply Chain Analyst", anchor: 94000 },
  { id: "opsm", fn: "Operations", base: "Operations Analyst", anchor: 92000 },
];
const MP_LEVELS = [
  { key: "I", mult: 0.62, spread: 0.18, title: (b) => `${b} I` },
  { key: "II", mult: 0.78, spread: 0.18, title: (b) => `${b} II` },
  { key: "Sr", mult: 1.00, spread: 0.18, title: (b) => `Senior ${b}` },
  { key: "Lead", mult: 1.22, spread: 0.20, title: (b) => `Lead ${b}` },
  { key: "Prin", mult: 1.48, spread: 0.20, title: (b) => `Principal ${b}` },
  { key: "Mgr", mult: 1.35, spread: 0.22, title: (b, fn) => `${fn} Manager` },
  { key: "SrMgr", mult: 1.68, spread: 0.22, title: (b, fn) => `Senior ${fn} Manager` },
  { key: "Dir", mult: 2.10, spread: 0.24, title: (b, fn) => `Director, ${fn}` },
];
const MARKET_ROLES = [];
MP_FAMILIES.forEach((f) => {
  MP_LEVELS.forEach((L) => {
    MARKET_ROLES.push({ id: f.id + "-" + L.key, name: L.title(f.base, f.fn), mid: Math.round((f.anchor * L.mult) / 500) * 500, spread: L.spread });
  });
});
function bandFromMid(mid, s) {
  return {
    min: mid * (1 - s), p25: mid * (1 - s * 0.45), p50: mid,
    p75: mid * (1 + s * 0.45), p90: mid * (1 + s * 0.80), max: mid * (1 + s),
  };
}

const MARKETS = [
  { id: "us",  name: "US National",     factor: 1.00 },
  { id: "sf",  name: "SF Bay Area",     factor: 1.25 },
  { id: "ny",  name: "New York City",   factor: 1.18 },
  { id: "rem", name: "Remote (US avg)", factor: 0.97 },
  { id: "in",  name: "India (offshore)",factor: 0.32 },
];

const fmtUSD = (n) => "$" + Math.round(n).toLocaleString();
const r100 = (n) => Math.round(n / 100) * 100;

function scaleRole(role, factor) {
  return {
    min: r100(role.min * factor), p25: r100(role.p25 * factor), p50: r100(role.p50 * factor),
    p75: r100(role.p75 * factor), p90: r100(role.p90 * factor), max: r100(role.max * factor),
  };
}
function percentileOf(v, p) {
  const xs = [p.min, p.p25, p.p50, p.p75, p.p90, p.max];
  const ys = [0, 25, 50, 75, 90, 100];
  if (v <= xs[0]) return 0;
  if (v >= xs[5]) return 100;
  for (let i = 0; i < xs.length - 1; i++) {
    if (v <= xs[i + 1]) { const t = (v - xs[i]) / (xs[i + 1] - xs[i]); return Math.round(ys[i] + t * (ys[i + 1] - ys[i])); }
  }
  return 100;
}
function readMarket(compa) {
  if (compa < 80) return { label: "Well below market", note: "A likely attraction and retention risk." };
  if (compa < 90) return { label: "Below midpoint", note: "Lagging the market, fine for a developing hire, watch for flight risk." };
  if (compa < 110) return { label: "Competitive", note: "Right around the market median, a defensible, market-aligned rate." };
  if (compa < 120) return { label: "Above midpoint", note: "Leading the market, typical for strong performers or hot skills." };
  return { label: "Premium", note: "Well above market, confirm it's justified by impact and internal equity." };
}

function Gauge({ compa }) {
  const v = Math.max(70, Math.min(130, compa));
  const cx = 100, cy = 100, r = 78;
  const ang = (val) => Math.PI * (1 - (val - 70) / 60);          // 70->PI (left), 130->0 (right)
  const pt = (val) => ({ x: cx + r * Math.cos(ang(val)), y: cy - r * Math.sin(ang(val)) });
  const arc = (a, b, color, key, w) => {
    const pa = pt(a), pb = pt(b);
    return <path key={key} d={`M ${pa.x.toFixed(1)} ${pa.y.toFixed(1)} A ${r} ${r} 0 0 1 ${pb.x.toFixed(1)} ${pb.y.toFixed(1)}`}
      stroke={color} strokeWidth={w || 15} fill="none" strokeLinecap="round" />;
  };
  const deg = ((v - 100) / 30) * 90;
  return (
    <svg viewBox="0 0 200 122" className="rz-gauge-svg" role="img" aria-label={`Compa-ratio ${compa}% of market median`}>
      <defs>
        <filter id="rzGlow" filterUnits="userSpaceOnUse" x="0" y="0" width="200" height="122">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {arc(70, 130, "rgba(255,255,255,0.06)", "track", 17)}
      {arc(70, 90, "#E0556B", "z1")}
      {arc(90, 96, "#FFC36B", "z2")}
      {arc(96, 110, "#5FE3B3", "z3")}
      {arc(110, 120, "#FFC36B", "z4")}
      {arc(120, 130, "#E0556B", "z5")}
      <g className="rz-gauge-needle" transform={`rotate(${deg} ${cx} ${cy})`}>
        <line x1={cx} y1={cy} x2={cx} y2="30" stroke="#5FE3B3" strokeOpacity="0.3" strokeWidth="7" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx} y2="30" stroke="#5FE3B3" strokeWidth="2.5" strokeLinecap="round" filter="url(#rzGlow)" />
      </g>
      <circle cx={cx} cy={cy} r="6" fill="#5FE3B3" filter="url(#rzGlow)" />
      <text x="22" y="116" className="rz-gauge-end">70</text>
      <text x="100" y="14" className="rz-gauge-end" textAnchor="middle">100</text>
      <text x="178" y="116" className="rz-gauge-end" textAnchor="end">130</text>
    </svg>
  );
}

function MarketPriceTool() {
  const [roleId, setRoleId] = useState(MARKET_ROLES[0].id);
  const [marketId, setMarketId] = useState(MARKETS[0].id);
  const [industryId, setIndustryId] = useState("tech");
  const [q, setQ] = useState(() => MARKET_ROLES[0].name);
  const [open, setOpen] = useState(false);

  const role = MARKET_ROLES.find((x) => x.id === roleId);
  const market = MARKETS.find((m) => m.id === marketId);
  const industry = ARCH_INDUSTRIES.find((i) => i.id === industryId);
  const indFactor = ARCH_PAYFACTOR[industryId];

  const band = bandFromMid(role.mid * market.factor * indFactor, role.spread);
  const sliderMin = r100(band.min * 0.82);
  const sliderMax = r100(band.max * 1.15);

  const [pay, setPay] = useState(Math.round(band.p50));
  useEffect(() => { setPay(Math.round(band.p50)); // reset to midpoint when role / market / industry changes
    // eslint-disable-next-line
  }, [roleId, marketId, industryId]);

  const pctile = percentileOf(pay, band);
  const compa = Math.round((pay / band.p50) * 100);
  const verdict = readMarket(compa);
  const barPos = (v) => Math.max(0, Math.min(100, ((v - band.min) / (band.max - band.min)) * 100));
  const ticks = [["25th", band.p25], ["50th", band.p50], ["75th", band.p75], ["90th", band.p90]];

  const matches = MARKET_ROLES.filter((x) => x.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 14);
  function pickRole(x) { setRoleId(x.id); setQ(x.name); setOpen(false); }

  return (
    <div className="rz-mpt">
      <div className="rz-mpt-controls">
        <div className="rz-mpt-field rz-mpt-search-field">
          <span>Role (search 400+)</span>
          <input className="rz-mpt-select rz-mpt-search" value={q} placeholder="Type a role, e.g. Senior Data Engineer"
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onBlur={() => setTimeout(() => { setOpen(false); setQ(role.name); }, 150)} />
          {open && (
            <div className="rz-mpt-results">
              {matches.length ? matches.map((x) => (
                <button key={x.id} type="button" className="rz-mpt-resultitem" onMouseDown={() => pickRole(x)}>{x.name}</button>
              )) : <p className="rz-mpt-noresult">No roles match that.</p>}
            </div>
          )}
        </div>
        <label className="rz-mpt-field">
          <span>Industry (your company's sector)</span>
          <select className="rz-mpt-select" value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
            {ARCH_INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
        <label className="rz-mpt-field">
          <span>Market</span>
          <select className="rz-mpt-select" value={marketId} onChange={(e) => setMarketId(e.target.value)}>
            {MARKETS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
      </div>

      <p className="rz-mpt-q">Proposed base pay: {role.name}</p>
      <p className="rz-game-guess">{fmtUSD(pay)}</p>
      <input className="rz-game-slider" type="range" min={sliderMin} max={sliderMax} step={500}
        value={pay} onChange={(e) => setPay(Number(e.target.value))} aria-label="Proposed base pay" />

      <div className="rz-mpt-bar">
        <div className="rz-mpt-bar-track">
          {ticks.map(([lbl, val]) => (
            <span key={lbl} className="rz-mpt-tick" style={{ left: barPos(val) + "%" }}>
              <i /><em>{lbl}</em>
            </span>
          ))}
          <span className="rz-mpt-marker" style={{ left: barPos(pay) + "%" }} />
        </div>
        <div className="rz-mpt-ends">
          <span>{fmtUSD(band.min)}</span>
          <span>{fmtUSD(band.max)}</span>
        </div>
      </div>

      <div className="rz-mpt-result">
        <div className="rz-mpt-gauge">
          <Gauge compa={compa} />
          <p className="rz-mpt-gauge-val">{compa}<span>%</span></p>
          <p className="rz-mpt-gauge-cap">compa-ratio · pay ÷ median</p>
          <span className={compa >= 100 ? "rz-mpt-delta up" : "rz-mpt-delta down"}>{compa >= 100 ? "+" : ""}{compa - 100}% vs midpoint</span>
        </div>
        <div className="rz-mpt-readout">
          <div className="rz-mpt-stat">
            <span className="rz-mpt-statval">{pctile}<em>th</em></span>
            <span className="rz-mpt-statlabel">percentile · {industry.name} · {market.name}</span>
          </div>
          <p className="rz-mpt-verdict">{verdict.label}</p>
          <p className="rz-mpt-note">{verdict.note}</p>
        </div>
      </div>

      <p className="rz-mpt-disclaimer">Illustrative data for demonstration, ~400 roles generated from family and level midpoints, then adjusted for industry and location. Real pricing pulls multiple surveys (Radford, Mercer, WTW), ages the data, and blends sources with defensible methodology.</p>
    </div>
  );
}

/* ===================== Job Architecture Builder, interactive demo =====================
   Leveling spine adapted from Ben's global job-architecture template (EN/PT/ES multilingual),
   with the Associate Director (M10A) level removed and M10 = Director. Generates a size- and
   industry-appropriate architecture with 2026 pay-transparency guidance for the US and EMEA. */
const ARCH_TITLES = {
  E16: "President & CEO", E15: "Hemisphere CEO", E14: "Global C-Level", E13: "Regional C-Level", E12: "Vice President",
  M11: "Senior Director", M10: "Director", M9: "Senior Manager", M8: "Manager", M7: "Supervisor / Sr Team Leader", M6: "Team Leader",
  P10: "Senior Principal", P9: "Principal", P8: "Lead", P7: "Senior", P6: "Level II", P5: "Junior / I",
  S6: "Principal", S5: "Lead", S4: "Senior", S3: "Level II", S2: "Junior / I",
};

// Levels included per company size, authored top-down for direct rendering.
const ARCH_SIZES = [
  { id: "startup", name: "Startup", sub: "Under 100",
    exec: ["E12"], mgmt: ["M11", "M10", "M9", "M8"], prof: ["P9", "P8", "P7", "P6", "P5"], support: ["S4", "S3", "S2"] },
  { id: "mid", name: "Mid-market", sub: "100–1,000",
    exec: ["E14", "E13", "E12"], mgmt: ["M11", "M10", "M9", "M8", "M7", "M6"], prof: ["P10", "P9", "P8", "P7", "P6", "P5"], support: ["S6", "S5", "S4", "S3", "S2"] },
  { id: "large", name: "Large", sub: "1,000–10,000",
    exec: ["E15", "E14", "E13", "E12"], mgmt: ["M11", "M10", "M9", "M8", "M7", "M6"], prof: ["P10", "P9", "P8", "P7", "P6", "P5"], support: ["S6", "S5", "S4", "S3", "S2"] },
  { id: "ent", name: "Enterprise", sub: "10,000+",
    exec: ["E16", "E15", "E14", "E13", "E12"], mgmt: ["M11", "M10", "M9", "M8", "M7", "M6"], prof: ["P10", "P9", "P8", "P7", "P6", "P5"], support: ["S6", "S5", "S4", "S3", "S2"] },
];

const ARCH_INDUSTRIES = [
  { id: "tech",   name: "Technology / SaaS",         survey: "Aon Radford",                note: "the market standard for technology and engineering benchmarking", family: "Software Engineering",    base: "Software Engineer" },
  { id: "fs",     name: "Financial Services",        survey: "Aon McLagan + WTW",          note: "specialist financial-services and capital-markets pay data",      family: "Risk & Analytics",        base: "Risk Analyst" },
  { id: "life",   name: "Healthcare / Life Sciences",survey: "Radford Life Sciences + Mercer", note: "deep clinical, R&D, and commercial coverage",                 family: "Clinical Operations",     base: "Clinical Research Associate" },
  { id: "mfg",    name: "Manufacturing",             survey: "Mercer + WTW",               note: "broad industrial, engineering, and operations data",             family: "Manufacturing Engineering", base: "Process Engineer" },
  { id: "prof",   name: "Professional Services",     survey: "WTW + Mercer",               note: "consulting, delivery, and corporate functions",                  family: "Consulting & Delivery",   base: "Consultant" },
  { id: "retail", name: "Retail / Consumer",         survey: "Mercer + WorldatWork",       note: "high-volume frontline plus corporate functions",                 family: "Store Operations",        base: "Operations Specialist" },
];

const ARCH_REGIONS = [
  { id: "us", name: "United States" },
  { id: "emea", name: "EMEA (EU)" },
  { id: "global", name: "Global (US + EMEA)" },
];

const ARCH_COMPLIANCE = {
  us: [
    "Publish good-faith pay ranges in job postings, required in CA, CO, NY, WA, IL and a growing list of states.",
    "Drop salary-history questions; they're banned in many states and a bias risk everywhere.",
    "Document job-related reasons for any pay differences to satisfy the federal Equal Pay Act and state pay-equity laws.",
  ],
  emea: [
    "Give candidates the pay range before the interview or in the posting, and stop asking salary history, EU Pay Transparency Directive, in national law by 7 June 2026.",
    "Use gender-neutral level criteria and titles so pay reflects 'equal pay for work of equal value.'",
    "Report the gender pay gap (employers of 100+, phasing to 150+); an unexplained gap above 5% triggers a joint pay assessment.",
    "Treat 'pay' broadly, the Directive's definition includes benefits, not just base salary.",
  ],
  spine: "Run one global leveling spine, then map it to local titles and languages (this framework ships EN / PT / ES) so pay comparisons hold across every country.",
};

function famTitle(code, base) {
  if (code === "P5") return `${base} I`;
  if (code === "P6") return `${base} II`;
  if (code === "P7") return `Senior ${base}`;
  if (code === "P8") return `Lead ${base}`;
  if (code === "P9") return `Principal ${base}`;
  if (code === "P10") return `Senior Principal ${base}`;
  return base;
}

function famMgmtTitle(code, family) {
  if (code === "M11") return `Senior Director, ${family}`;
  if (code === "M10") return `Director, ${family}`;
  if (code === "M9") return `Senior ${family} Manager`;
  if (code === "M8") return `${family} Manager`;
  if (code === "M7") return `${family} Supervisor`;
  if (code === "M6") return `${family} Team Lead`;
  return family;
}

// Illustrative US base-salary midpoints per level (annual). Not real data, for the range-band visual.
const LEVEL_PAY = {
  S2: 42000, S3: 50000, S4: 60000, S5: 72000, S6: 86000,
  P5: 70000, P6: 88000, P7: 110000, P8: 135000, P9: 165000, P10: 200000,
  M6: 80000, M7: 95000, M8: 120000, M9: 150000, M10: 190000, M11: 240000,
  E12: 300000, E13: 380000, E14: 480000, E15: 620000, E16: 850000,
};
const ARCH_PAYFACTOR = { tech: 1.12, fs: 1.15, life: 1.05, mfg: 0.98, prof: 1.00, retail: 0.90 };
const fmtK = (n) => "$" + Math.round(n / 1000) + "k";
function bandFor(code, factor) {
  const mid = LEVEL_PAY[code] * factor;
  const s = code[0] === "E" ? 0.30 : code[0] === "M" ? 0.22 : 0.18; // wider spread higher up
  return { min: mid * (1 - s), mid, max: mid * (1 + s) };
}

function JobArchTool() {
  const [sizeId, setSizeId] = useState("mid");
  const [industryId, setIndustryId] = useState("tech");
  const [regionId, setRegionId] = useState("global");
  const [copied, setCopied] = useState(false);

  const size = ARCH_SIZES.find((s) => s.id === sizeId);
  const industry = ARCH_INDUSTRIES.find((i) => i.id === industryId);
  const region = ARCH_REGIONS.find((r) => r.id === regionId);

  const streams = [
    { name: "Executive", codes: size.exec },
    { name: "Management", codes: size.mgmt },
    { name: "Professional", codes: size.prof },
    { name: "Support", codes: size.support },
  ];
  const totalLevels = streams.reduce((sum, s) => sum + s.codes.length, 0);

  const famFactor = ARCH_PAYFACTOR[industry.id];
  const famCodes = [...size.prof, ...size.mgmt];
  const famBands = {};
  famCodes.forEach((cd) => { famBands[cd] = bandFor(cd, famFactor); });
  const famLo = Math.min(...famCodes.map((cd) => famBands[cd].min));
  const famHi = Math.max(...famCodes.map((cd) => famBands[cd].max));
  const bandPos = (v) => ((Math.log(v) - Math.log(famLo)) / (Math.log(famHi) - Math.log(famLo))) * 100;
  const compliance = regionId === "us" ? ARCH_COMPLIANCE.us
    : regionId === "emea" ? ARCH_COMPLIANCE.emea
    : [...ARCH_COMPLIANCE.emea, ...ARCH_COMPLIANCE.us];

  function copyArch() {
    const lines = [];
    lines.push(`JOB ARCHITECTURE: ${size.name} · ${industry.name} · ${region.name}`);
    lines.push(`Recommended benchmark: ${industry.survey}`);
    lines.push("");
    streams.forEach((s) => {
      lines.push(s.name.toUpperCase());
      s.codes.forEach((code) => lines.push(`  ${code}\t${ARCH_TITLES[code]}`));
      lines.push("");
    });
    lines.push(`SAMPLE FAMILY: ${industry.family} (illustrative US base)`);
    lines.push("  Individual contributor:");
    size.prof.forEach((code) => { const b = famBands[code]; lines.push(`    ${code}\t${famTitle(code, industry.base)}\t${fmtK(b.min)}–${fmtK(b.max)} (mid ${fmtK(b.mid)})`); });
    lines.push("  People management:");
    size.mgmt.forEach((code) => { const b = famBands[code]; lines.push(`    ${code}\t${famMgmtTitle(code, industry.family)}\t${fmtK(b.min)}–${fmtK(b.max)} (mid ${fmtK(b.mid)})`); });
    const text = lines.join("\n");
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      } else { fallbackCopy(text, done); }
    } catch (e) { fallbackCopy(text, done); }
  }
  function fallbackCopy(text, done) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta); done();
    } catch (e) { /* clipboard unavailable */ }
  }

  return (
    <div className="rz-arch">
      <div className="rz-arch-controls">
        <div className="rz-arch-group">
          <p className="rz-mpt-q">Company size</p>
          <div className="rz-game-opts">
            {ARCH_SIZES.map((s) => (
              <button key={s.id} className={sizeId === s.id ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setSizeId(s.id)}>
                {s.name} <em className="rz-arch-sub">{s.sub}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="rz-arch-group">
          <p className="rz-mpt-q">Industry</p>
          <div className="rz-game-opts">
            {ARCH_INDUSTRIES.map((i) => (
              <button key={i.id} className={industryId === i.id ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setIndustryId(i.id)}>{i.name}</button>
            ))}
          </div>
        </div>
        <div className="rz-arch-group">
          <p className="rz-mpt-q">Region scope</p>
          <div className="rz-game-opts">
            {ARCH_REGIONS.map((r) => (
              <button key={r.id} className={regionId === r.id ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setRegionId(r.id)}>{r.name}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="rz-arch-summary">
        <div className="rz-arch-stat"><span className="rz-arch-statval">{totalLevels}</span><span className="rz-arch-statlabel">levels · 4 career streams</span></div>
        <div className="rz-arch-stat"><span className="rz-arch-statval rz-arch-statsmall">{industry.survey}</span><span className="rz-arch-statlabel">recommended benchmark: {industry.note}</span></div>
      </div>

      <div className="rz-arch-spine">
        {streams.map((s) => (
          <div className="rz-arch-col" key={s.name}>
            <p className="rz-arch-colhead">{s.name} <span>{s.codes.length}</span></p>
            {s.codes.map((code) => (
              <div className="rz-arch-level" key={code}>
                <span className="rz-arch-code">{code}</span>
                <span className="rz-arch-title">{ARCH_TITLES[code]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="rz-arch-fam">
        <p className="rz-arch-famhead">Sample family: {industry.family}</p>
        <p className="rz-arch-caption">Illustrative US base ranges, adjusted for industry, bars share a log scale to show progression.</p>
        <div className="rz-arch-tracks">
          <div className="rz-arch-track">
            <p className="rz-arch-tracklabel">Individual contributor</p>
            <div className="rz-arch-famrows-col">
              {size.prof.map((code) => {
                const b = famBands[code];
                return (
                  <div className="rz-arch-famrow" key={code}>
                    <div className="rz-arch-famtop">
                      <span className="rz-arch-code">{code}</span>
                      <span className="rz-arch-title">{famTitle(code, industry.base)}</span>
                      <span className="rz-arch-mid">{fmtK(b.mid)}</span>
                    </div>
                    <div className="rz-arch-band">
                      <span className="rz-arch-band-fill" style={{ left: bandPos(b.min) + "%", width: (bandPos(b.max) - bandPos(b.min)) + "%" }} />
                      <span className="rz-arch-band-mid" style={{ left: bandPos(b.mid) + "%" }} />
                    </div>
                    <span className="rz-arch-bandrange">{fmtK(b.min)} – {fmtK(b.max)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rz-arch-track">
            <p className="rz-arch-tracklabel">People management</p>
            <div className="rz-arch-famrows-col">
              {size.mgmt.map((code) => {
                const b = famBands[code];
                return (
                  <div className="rz-arch-famrow" key={code}>
                    <div className="rz-arch-famtop">
                      <span className="rz-arch-code">{code}</span>
                      <span className="rz-arch-title">{famMgmtTitle(code, industry.family)}</span>
                      <span className="rz-arch-mid">{fmtK(b.mid)}</span>
                    </div>
                    <div className="rz-arch-band">
                      <span className="rz-arch-band-fill" style={{ left: bandPos(b.min) + "%", width: (bandPos(b.max) - bandPos(b.min)) + "%" }} />
                      <span className="rz-arch-band-mid" style={{ left: bandPos(b.mid) + "%" }} />
                    </div>
                    <span className="rz-arch-bandrange">{fmtK(b.min)} – {fmtK(b.max)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button className="rz-arch-copy" onClick={copyArch}>
          {copied ? <><Check size={14} /> Copied to clipboard</> : <><Download size={14} /> Copy architecture as text</>}
        </button>
      </div>

      <div className="rz-arch-comp">
        <p className="rz-arch-famhead">2026 pay-transparency checklist: {region.name}</p>
        {compliance.map((item, i) => (
          <p className="rz-arch-compitem" key={i}><Check size={15} /> <span>{item}</span></p>
        ))}
        <p className="rz-arch-compitem rz-arch-spine-item"><Compass size={15} /> <span>{ARCH_COMPLIANCE.spine}</span></p>
      </div>

      <p className="rz-mpt-disclaimer">Illustrative blueprint for demonstration, survey recommendations and level counts are starting points a real design would validate against current data, internal equity, and local law.</p>
    </div>
  );
}

/* ===================== Analytics dashboards, bonus showcase =====================
   Three illustrative HR/comp dashboards (turnover, market position, pay equity) with
   hand-rolled SVG/CSS charts, no chart library, so it stays dependency-free. */
const AN_TABS = [
  { id: "turnover", name: "Turnover" },
  { id: "market", name: "Market" },
  { id: "equity", name: "Pay equity" },
  { id: "sweet", name: "Sweet spot" },
];
const AN_C = { cool: "#7C9CFF", warm: "#FFC36B", mint: "#5FE3B3", red: "#E0556B" };

function AnBars({ items, max, suffix }) {
  const m = max || Math.max(...items.map((i) => i.v));
  return (
    <div className="rz-an-bars">
      {items.map((it) => (
        <div className="rz-an-barrow" key={it.l}>
          <span className="rz-an-barlabel">{it.l}</span>
          <div className="rz-an-bartrack"><span className="rz-an-barfill" style={{ width: (it.v / m) * 100 + "%", background: it.c || AN_C.cool }} /></div>
          <span className="rz-an-barval">{it.v}{suffix || ""}</span>
        </div>
      ))}
    </div>
  );
}
function AnArea({ data, color }) {
  const w = 280, h = 80, pad = 6;
  const max = Math.max(...data), min = Math.min(...data);
  const xs = (i) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const ys = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const line = data.map((v, i) => `${i ? "L" : "M"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${xs(data.length - 1).toFixed(1)} ${(h - pad).toFixed(1)} L ${xs(0).toFixed(1)} ${(h - pad).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="rz-an-spark" preserveAspectRatio="none">
      <defs><linearGradient id="rzAnFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#rzAnFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AnStack({ segments }) {
  return (
    <div className="rz-an-stack">
      {segments.map((s) => (
        <div className="rz-an-seg" key={s.l} style={{ width: s.v + "%", background: s.c }}><span>{s.v}%</span></div>
      ))}
    </div>
  );
}

function SweetSpot() {
  const [a0, setA0] = useState(0.16);
  const [R, setR] = useState(1.5);
  const [kId, setKId] = useState("med");
  const [M, setM] = useState(30000);
  const k = { low: 4, med: 7, high: 11 }[kId];
  const af = a0 * 0.3;
  const attr = (c) => af + (a0 - af) * Math.exp(-k * (c - 1));

  const C0 = 0.80, C1 = 1.30, step = 0.005;
  const pts = [];
  let best = null;
  for (let c = C0; c <= C1 + 1e-9; c += step) {
    const pay = c * M, turn = attr(c) * R * M, total = pay + turn;
    pts.push({ c, pay, turn, total });
    if (!best || total < best.total) best = { c, pay, turn, total, a: attr(c) };
  }
  const cStar = best.c;
  const pctVsMkt = Math.round((cStar - 1) * 100);

  const W = 340, H = 190, padL = 8, padR = 8, padT = 14, padB = 22;
  const allY = pts.flatMap((p) => [p.pay, p.turn, p.total]);
  const yMin = Math.min(...allY), yMax = Math.max(...allY);
  const X = (c) => padL + ((c - C0) / (C1 - C0)) * (W - padL - padR);
  const Y = (v) => H - padB - ((v - yMin) / (yMax - yMin || 1)) * (H - padT - padB);
  const poly = (key) => pts.map((p) => `${X(p.c).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(" ");

  const zoneNote = cStar <= 0.985
    ? "The model puts the optimum a touch below market, your turnover isn't costly or pay-sensitive enough to justify paying up."
    : cStar >= 1.015
      ? "The model wants you a touch above market, turnover here is costly and pay-sensitive enough to pay for itself."
      : "The optimum sits right around market, competitive pay, no premium needed.";

  return (
    <div className="rz-an-body">
      <div className="rz-ss-controls">
        <div className="rz-game-srow"><div className="rz-game-slabel"><span>Attrition at market</span><b>{Math.round(a0 * 100)}%</b></div>
          <input className="rz-game-slider" type="range" min={5} max={30} step={1} value={Math.round(a0 * 100)} onChange={(e) => setA0(Number(e.target.value) / 100)} aria-label="Attrition at market" /></div>
        <div className="rz-game-srow"><div className="rz-game-slabel"><span>Replacement cost per exit</span><b>{Math.round(R * 100)}% of salary</b></div>
          <input className="rz-game-slider" type="range" min={25} max={200} step={5} value={Math.round(R * 100)} onChange={(e) => setR(Number(e.target.value) / 100)} aria-label="Replacement cost per exit" /></div>
        <div className="rz-game-srow"><div className="rz-game-slabel"><span>Median salary</span><b>{fmtMoney(M)}</b></div>
          <input className="rz-game-slider" type="range" min={20000} max={300000} step={5000} value={M} onChange={(e) => setM(Number(e.target.value))} aria-label="Median salary" /></div>
        <p className="rz-game-q">How sensitive is turnover to pay?</p>
        <div className="rz-game-opts">
          {[["low", "Low"], ["med", "Medium"], ["high", "High"]].map(([id, lbl]) => (
            <button key={id} className={kId === id ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setKId(id)}>{lbl}</button>
          ))}
        </div>
      </div>

      <div className="rz-an-card">
        <p className="rz-an-cardtitle">Total cost vs. compa-ratio</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="rz-ss-chart">
          <line x1={X(1)} y1={padT} x2={X(1)} y2={H - padB} stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={X(cStar)} y1={padT} x2={X(cStar)} y2={H - padB} stroke="#5FE3B3" strokeWidth="1.5" strokeDasharray="4 3" />
          <polyline points={poly("pay")} fill="none" stroke="#7C9CFF" strokeWidth="2" />
          <polyline points={poly("turn")} fill="none" stroke="#FFC36B" strokeWidth="2" />
          <polyline points={poly("total")} fill="none" stroke="#E9ECF2" strokeWidth="2.5" />
          <circle cx={X(cStar)} cy={Y(best.total)} r="4.5" fill="#5FE3B3" />
          <text x={X(0.8)} y={H - 6} className="rz-ss-ax">0.80</text>
          <text x={X(1.0)} y={H - 6} className="rz-ss-ax" textAnchor="middle">1.00 (market)</text>
          <text x={X(1.3)} y={H - 6} className="rz-ss-ax" textAnchor="end">1.30</text>
        </svg>
        <div className="rz-an-legend">
          <span><i style={{ background: "#7C9CFF" }} />Pay cost</span>
          <span><i style={{ background: "#FFC36B" }} />Turnover cost</span>
          <span><i style={{ background: "#E9ECF2" }} />Total</span>
          <span><i style={{ background: "#5FE3B3" }} />Sweet spot</span>
        </div>
      </div>

      <div className="rz-an-kpis rz-ss-kpis">
        <div className="rz-an-kpi"><p className="rz-an-kpival rz-an-good">{cStar.toFixed(2)}</p><p className="rz-an-kpilabel">Sweet-spot compa-ratio</p><span className="rz-an-kpidelta">{pctVsMkt >= 0 ? "+" : ""}{pctVsMkt}% vs market</span></div>
        <div className="rz-an-kpi"><p className="rz-an-kpival">{Math.round(best.a * 100)}%</p><p className="rz-an-kpilabel">Attrition at the optimum</p></div>
        <div className="rz-an-kpi"><p className="rz-an-kpival">{fmtMoney(best.total)}</p><p className="rz-an-kpilabel">Total cost / employee</p></div>
      </div>

      <p className="rz-ss-note">{zoneNote} Left of the green line you're underpaying: turnover cost outweighs the payroll savings. Right of it you're overpaying, and the extra pay no longer pays for itself.</p>

      <div className="rz-ss-formula">
        <p className="rz-ss-formula-h">The easy rule</p>
        <p className="rz-ss-formula-t">Raise pay until one more dollar of pay saves one more dollar of avoided turnover. The optimum is where the attrition curve's slope equals -1/R, with R = replacement cost as a multiple of salary, so the costlier and more pay-sensitive your turnover, the higher the sweet spot.</p>
        <p className="rz-ss-formula-c">c* = 1 + (1/k) * ln( R * k * (a0 - a_floor) )</p>
      </div>

      <p className="rz-mpt-disclaimer">Illustrative model, a simple attrition-vs-pay curve to show the trade-off. Real optimization also weighs role criticality, time-to-fill, productivity ramp, and internal equity.</p>
    </div>
  );
}

function AnalyticsDashboards() {
  const [tab, setTab] = useState("turnover");
  return (
    <div className="rz-an">
      <div className="rz-an-tabs">
        {AN_TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "rz-an-tab on" : "rz-an-tab"} onClick={() => setTab(t.id)}>{t.name}</button>
        ))}
      </div>

      {tab === "turnover" && (
        <div className="rz-an-body">
          <div className="rz-an-kpis">
            <div className="rz-an-kpi"><p className="rz-an-kpival">12.4%</p><p className="rz-an-kpilabel">Annualized attrition</p><span className="rz-an-kpidelta">▼ 1.8 pts YoY</span></div>
            <div className="rz-an-kpi"><p className="rz-an-kpival">8.7%</p><p className="rz-an-kpilabel">Voluntary</p></div>
            <div className="rz-an-kpi"><p className="rz-an-kpival">4.1%</p><p className="rz-an-kpilabel">Regrettable</p><span className="rz-an-kpidelta">▼ 0.6 pts</span></div>
          </div>
          <div className="rz-an-charts">
            <div className="rz-an-card">
              <p className="rz-an-cardtitle">Monthly attrition trend</p>
              <AnArea data={[1.4, 1.2, 1.3, 1.1, 1.0, 1.2, 0.9, 1.0, 0.8, 0.9, 0.7, 0.8]} color={AN_C.cool} />
              <p className="rz-an-cardcap">Jan → Dec · % of headcount</p>
            </div>
            <div className="rz-an-card">
              <p className="rz-an-cardtitle">Attrition by function</p>
              <AnBars items={[{ l: "Support", v: 21, c: AN_C.red }, { l: "Sales", v: 18, c: AN_C.warm }, { l: "Operations", v: 14, c: AN_C.warm }, { l: "Engineering", v: 11, c: AN_C.cool }, { l: "Corporate", v: 7, c: AN_C.mint }]} max={25} suffix="%" />
            </div>
          </div>
        </div>
      )}

      {tab === "market" && (
        <div className="rz-an-body">
          <div className="rz-an-kpis">
            <div className="rz-an-kpi"><p className="rz-an-kpival">0.98</p><p className="rz-an-kpilabel">Group compa-ratio</p></div>
            <div className="rz-an-kpi"><p className="rz-an-kpival">62%</p><p className="rz-an-kpilabel">At or above market</p><span className="rz-an-kpidelta">▲ 4 pts</span></div>
            <div className="rz-an-kpi"><p className="rz-an-kpival">1,480</p><p className="rz-an-kpilabel">Roles benchmarked</p></div>
          </div>
          <div className="rz-an-charts">
            <div className="rz-an-card">
              <p className="rz-an-cardtitle">Employees by compa-ratio band</p>
              <AnStack segments={[{ l: "Below", v: 22, c: AN_C.red }, { l: "At", v: 55, c: AN_C.mint }, { l: "Above", v: 23, c: AN_C.cool }]} />
              <div className="rz-an-legend"><span><i style={{ background: AN_C.red }} />Below market</span><span><i style={{ background: AN_C.mint }} />At market</span><span><i style={{ background: AN_C.cool }} />Above market</span></div>
            </div>
            <div className="rz-an-card">
              <p className="rz-an-cardtitle">Market index by function</p>
              <AnBars items={[{ l: "Engineering", v: 103 }, { l: "Finance", v: 99 }, { l: "HR", v: 97 }, { l: "Sales", v: 96 }, { l: "Operations", v: 94 }]} max={110} />
              <p className="rz-an-cardcap">Index 100 = at market median</p>
            </div>
          </div>
        </div>
      )}

      {tab === "equity" && (
        <div className="rz-an-body">
          <div className="rz-an-kpis">
            <div className="rz-an-kpi"><p className="rz-an-kpival">6.8%</p><p className="rz-an-kpilabel">Unadjusted gap</p></div>
            <div className="rz-an-kpi"><p className="rz-an-kpival rz-an-good">1.2%</p><p className="rz-an-kpilabel">Adjusted gap</p><span className="rz-an-kpidelta">within tolerance</span></div>
            <div className="rz-an-kpi"><p className="rz-an-kpival">0</p><p className="rz-an-kpilabel">Groups over 5% unexplained</p></div>
          </div>
          <div className="rz-an-charts">
            <div className="rz-an-card">
              <p className="rz-an-cardtitle">Adjusted gap by gender</p>
              <AnBars items={[{ l: "Women", v: 1.1, c: AN_C.mint }, { l: "Non-binary", v: 1.6, c: AN_C.mint }]} max={5} suffix="%" />
              <p className="rz-an-cardcap">Gap vs. men (reference) after controlling for level, function, location, tenure</p>
            </div>
            <div className="rz-an-card">
              <p className="rz-an-cardtitle">Adjusted gap by race / ethnicity</p>
              <AnBars items={[{ l: "Asian", v: 0.4, c: AN_C.mint }, { l: "Black", v: 1.8, c: AN_C.mint }, { l: "Hispanic", v: 1.3, c: AN_C.mint }, { l: "Two+ races", v: 0.9, c: AN_C.mint }]} max={5} suffix="%" />
              <p className="rz-an-cardcap">Gap vs. largest group (reference), same controls applied</p>
            </div>
            <div className="rz-an-card wide">
              <p className="rz-an-cardtitle">Remediation: unadjusted vs adjusted</p>
              <AnBars items={[{ l: "Unadjusted", v: 6.8, c: AN_C.warm }, { l: "Adjusted", v: 1.2, c: AN_C.mint }]} max={8} suffix="%" />
              <p className="rz-an-cardcap">EU Pay Transparency Directive: any group over 5% unexplained triggers a joint pay assessment</p>
            </div>
          </div>
        </div>
      )}

      {tab === "sweet" && <SweetSpot />}

      {tab !== "sweet" && (
        <p className="rz-mpt-disclaimer">Illustrative dashboards, sample data modeled to show the decision-grade analytics Ben builds (Power BI, automated pipelines). Not real company data.</p>
      )}
    </div>
  );
}

function MeritMatrix() {
  const [budget, setBudget] = useState(3.5);
  const [heads, setHeads] = useState(500);
  const [avg, setAvg] = useState(80000);
  const [tiers, setTiers] = useState(5);

  const RATINGS = {
    3: [{ n: "Below", m: 0.0 }, { n: "Meets", m: 1.0 }, { n: "Exceeds", m: 1.9 }],
    4: [{ n: "Below", m: 0.0 }, { n: "Meets", m: 0.8 }, { n: "Exceeds", m: 1.4 }, { n: "Outstanding", m: 2.0 }],
    5: [{ n: "Below", m: 0.0 }, { n: "Developing", m: 0.6 }, { n: "Meets", m: 1.0 }, { n: "Exceeds", m: 1.5 }, { n: "Outstanding", m: 2.0 }],
  };
  const BANDS = [
    { l: "< 0.90", f: 1.30 },
    { l: "0.90–0.99", f: 1.10 },
    { l: "1.00–1.09", f: 0.90 },
    { l: "≥ 1.10", f: 0.70 },
  ];
  const rows = RATINGS[tiers];
  const fmtP = (x) => (x % 1 === 0 ? x.toFixed(0) : x.toFixed(1));
  const range = (m, f) => {
    if (m === 0) return { low: 0, high: 0, mid: 0 };
    const low = Math.floor(budget * m * f * 2) / 2;
    return { low, high: low + 0.5, mid: low + 0.25 };
  };
  const allMids = rows.flatMap((r) => BANDS.map((b) => range(r.m, b.f).mid));
  const maxMid = Math.max(...allMids, 0.1);
  const meanCell = allMids.reduce((a, v) => a + v, 0) / allMids.length;
  const totalSpend = heads * avg * (budget / 100);

  return (
    <div className="rz-an-body">
      <div className="rz-mm-controls">
        <div className="rz-game-srow"><div className="rz-game-slabel"><span>Merit budget</span><b>{budget.toFixed(1)}%</b></div>
          <input className="rz-game-slider" type="range" min={2} max={6} step={0.1} value={budget} onChange={(e) => setBudget(Number(e.target.value))} aria-label="Merit budget" /></div>
        <div className="rz-game-srow"><div className="rz-game-slabel"><span>Employees</span><b>{heads.toLocaleString()}</b></div>
          <input className="rz-game-slider" type="range" min={50} max={5000} step={50} value={heads} onChange={(e) => setHeads(Number(e.target.value))} aria-label="Employees" /></div>
        <div className="rz-game-srow"><div className="rz-game-slabel"><span>Average base salary</span><b>{fmtMoney(avg)}</b></div>
          <input className="rz-game-slider" type="range" min={30000} max={250000} step={5000} value={avg} onChange={(e) => setAvg(Number(e.target.value))} aria-label="Average base salary" /></div>
        <div className="rz-mm-scalecell">
          <p className="rz-game-q">Rating scale</p>
          <div className="rz-game-opts">
            {[3, 4, 5].map((t) => (
              <button key={t} className={tiers === t ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setTiers(t)}>{t}-point</button>
            ))}
          </div>
        </div>
      </div>

      <div className="rz-an-card">
        <p className="rz-an-cardtitle">Merit increase by rating and compa-ratio</p>
        <div className="rz-mm-scroll">
          <div className="rz-mm-grid" style={{ gridTemplateColumns: `minmax(84px,1.1fr) repeat(${BANDS.length}, 1fr)` }}>
            <div className="rz-mm-corner">Rating / Compa</div>
            {BANDS.map((b) => <div className="rz-mm-colh" key={b.l}>{b.l}</div>)}
            {rows.flatMap((r) => [
              <div className="rz-mm-rowh" key={r.n}>{r.n}</div>,
              ...BANDS.map((b) => {
                const rg = range(r.m, b.f);
                const label = rg.high === 0 ? "0%" : `${fmtP(rg.low)}–${fmtP(rg.high)}%`;
                return <div className="rz-mm-cell" key={r.n + b.l} style={{ background: `rgba(95,227,179,${(rg.mid / maxMid) * 0.30})` }}>{label}</div>;
              }),
            ])}
          </div>
        </div>
        <p className="rz-an-cardcap">Each cell is a guideline range, giving managers room to differentiate within budget. Lower compa-ratios and higher ratings earn more; below-expectations earns no merit.</p>
      </div>

      <div className="rz-an-kpis rz-ss-kpis">
        <div className="rz-an-kpi"><p className="rz-an-kpival">{fmtMoney(totalSpend)}</p><p className="rz-an-kpilabel">Total merit spend</p><span className="rz-an-kpidelta">{budget.toFixed(1)}% of base</span></div>
        <div className="rz-an-kpi"><p className="rz-an-kpival">{meanCell.toFixed(1)}%</p><p className="rz-an-kpilabel">Matrix average</p></div>
        <div className="rz-an-kpi"><p className="rz-an-kpival">{heads.toLocaleString()}</p><p className="rz-an-kpilabel">Employees in plan</p></div>
      </div>

      <p className="rz-mpt-disclaimer">Illustrative merit matrix. A real calibration weights each cell by the actual headcount across ratings and compa-ratio bands, then tunes cells so total spend equals the approved budget.</p>
    </div>
  );
}

const AIP_LEVELS = [
  { id: "exec", name: "Executive", target: 60, wCo: 80, base: 300000 },
  { id: "dir", name: "Director", target: 35, wCo: 60, base: 185000 },
  { id: "mgr", name: "Manager", target: 20, wCo: 50, base: 120000 },
  { id: "prof", name: "Professional", target: 12, wCo: 30, base: 85000 },
  { id: "ic", name: "Individual", target: 8, wCo: 20, base: 65000 },
];

function AipTool() {
  const [lvlId, setLvlId] = useState("dir");
  const [mode, setMode] = useState("weighted");
  const [co, setCo] = useState(100);
  const [ind, setInd] = useState(100);

  const lvl = AIP_LEVELS.find((l) => l.id === lvlId);
  const wCo = lvl.wCo, wInd = 100 - lvl.wCo;
  const curve = (a) => (a < 90 ? 0 : a <= 100 ? 0.5 + ((a - 90) / 10) * 0.5 : a <= 120 ? 1.0 + ((a - 100) / 20) * 1.0 : 2.0);
  const coF = curve(co);
  const indMod = Math.max(0, Math.min(1.5, ind / 100));
  const targetDollar = (lvl.base * lvl.target) / 100;
  const corpPiece = targetDollar * (wCo / 100) * coF;
  const indPiece = targetDollar * (wInd / 100) * indMod;
  let rawFactor, payoutDollar;
  if (mode === "weighted") {
    payoutDollar = corpPiece + indPiece;
    rawFactor = payoutDollar / targetDollar;
  } else {
    rawFactor = coF * indMod;
    payoutDollar = targetDollar * rawFactor;
  }
  const payoutFactor = Math.min(rawFactor, 2.0);
  if (rawFactor > 2.0) payoutDollar = targetDollar * 2.0;
  const capped = rawFactor > 2.0;
  const formula = mode === "weighted"
    ? `corp ${wCo}% x ${coF.toFixed(2)} + individual ${wInd}% x ${indMod.toFixed(2)} = ${rawFactor.toFixed(2)}x target`
    : `pool funds at ${coF.toFixed(2)}x, individual modifier ${indMod.toFixed(2)}x = ${(coF * indMod).toFixed(2)}x target`;

  const W = 340, H = 158, padL = 8, padR = 8, padT = 12, padB = 22;
  const C0 = 80, C1 = 130, F1 = 2.0;
  const X = (a) => padL + ((a - C0) / (C1 - C0)) * (W - padL - padR);
  const Y = (f) => H - padB - (f / F1) * (H - padT - padB);
  const linePts = [];
  for (let a = C0; a <= C1; a += 1) linePts.push(`${X(a).toFixed(1)},${Y(curve(a)).toFixed(1)}`);

  return (
    <div className="rz-an-body">
      <div className="rz-ss-controls">
        <p className="rz-game-q">Level</p>
        <div className="rz-game-opts">
          {AIP_LEVELS.map((l) => (
            <button key={l.id} className={lvlId === l.id ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setLvlId(l.id)}>{l.name}</button>
          ))}
        </div>
        <p className="rz-aip-readout">Target <b>{lvl.target}%</b> of base · <b>{wCo}%</b> company / <b>{wInd}%</b> individual · typical base {fmtMoney(lvl.base)}</p>

        <p className="rz-game-q">Plan structure</p>
        <div className="rz-game-opts">
          <button className={mode === "weighted" ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setMode("weighted")}>Weighted average</button>
          <button className={mode === "fund" ? "rz-game-opt on" : "rz-game-opt"} onClick={() => setMode("fund")}>Fund, then modify</button>
        </div>

        <div className="rz-game-srow"><div className="rz-game-slabel"><span>Company performance</span><b>{co}% of goal</b></div>
          <input className="rz-game-slider" type="range" min={70} max={130} step={1} value={co} onChange={(e) => setCo(Number(e.target.value))} aria-label="Company performance" /></div>
        <div className="rz-game-srow"><div className="rz-game-slabel"><span>Individual performance</span><b>{ind}% of goals</b></div>
          <input className="rz-game-slider" type="range" min={0} max={150} step={5} value={ind} onChange={(e) => setInd(Number(e.target.value))} aria-label="Individual performance" /></div>
      </div>

      <div className="rz-an-card">
        <p className="rz-an-cardtitle">Company payout curve</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="rz-ss-chart">
          <line x1={X(90)} y1={padT} x2={X(90)} y2={H - padB} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={X(100)} y1={padT} x2={X(100)} y2={H - padB} stroke="rgba(255,255,255,0.16)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={X(120)} y1={padT} x2={X(120)} y2={H - padB} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="3 3" />
          <polyline points={linePts.join(" ")} fill="none" stroke="#7C9CFF" strokeWidth="2.5" />
          <circle cx={X(co)} cy={Y(coF)} r="4.5" fill="#5FE3B3" />
          <text x={X(90)} y={H - 6} className="rz-ss-ax" textAnchor="middle">90 thr</text>
          <text x={X(100)} y={H - 6} className="rz-ss-ax" textAnchor="middle">100 tgt</text>
          <text x={X(120)} y={H - 6} className="rz-ss-ax" textAnchor="middle">120 max</text>
        </svg>
        <p className="rz-an-cardcap">Below 90% of goal nothing funds; payout scales to 200% at stretch. The green dot is your company result.</p>
      </div>

      <div className="rz-an-kpis rz-ss-kpis">
        <div className="rz-an-kpi"><p className="rz-an-kpival rz-an-good">{Math.round(payoutFactor * 100)}%</p><p className="rz-an-kpilabel">Payout, % of target</p>{capped && <span className="rz-an-kpidelta">capped at 200%</span>}</div>
        <div className="rz-an-kpi"><p className="rz-an-kpival">{fmtMoney(payoutDollar)}</p><p className="rz-an-kpilabel">Bonus paid</p></div>
        <div className="rz-an-kpi"><p className="rz-an-kpival">{fmtMoney(targetDollar)}</p><p className="rz-an-kpilabel">Target bonus ({lvl.target}%)</p></div>
      </div>

      {mode === "weighted" ? (
        <p className="rz-aip-readout">Corporate {fmtMoney(corpPiece)} (gated by company) · Individual {fmtMoney(indPiece)} (pays on what they control)</p>
      ) : (
        <p className="rz-aip-readout">Pool funded at {coF.toFixed(2)}x · individual modifier {indMod.toFixed(2)}x</p>
      )}

      <div className="rz-ss-formula">
        <p className="rz-ss-formula-h">{mode === "weighted" ? "Split funding" : "Fund, then modify"}</p>
        <p className="rz-ss-formula-t">{mode === "weighted"
          ? "Two components. The corporate piece is gated by company performance and zeros out below threshold, while the individual piece keeps paying on what the employee actually controls. The common design below the executive level."
          : "Company performance funds the entire pool first, then individual performance only modifies each share. Miss the company threshold and nothing funds. Common for executives, whose whole bonus should track enterprise results."}</p>
        <p className="rz-ss-formula-c">{formula}</p>
      </div>

      <p className="rz-mpt-disclaimer">Illustrative incentive model. Real plans layer in a company scorecard (revenue, EBITDA, strategic), a funding gate, segment weighting, and committee discretion, all governed and tied to the approved budget.</p>
    </div>
  );
}

export default function App() {
  const c = CANDIDATE;
  const [tab, setTab] = useState("agent"); // agent | contact
  const [showCover, setShowCover] = useState(false);
  const [showResume, setShowResume] = useState(false);
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
  const [fitRole, setFitRole] = useState(null);
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
    setFitRole(null);
    setFitLoading(true);
    const job = matchJob(name);
    try {
      const userMsg = job
        ? `A recruiter from "${name}" is evaluating Ben for this specific open role:\n` +
          `Role: ${job.role}\n` +
          `Key requirements from their posting:\n${job.requirements}\n\n` +
          `Using ONLY Ben's real background from the profile, map his experience to these specific requirements. Be concrete, for each major requirement area, say how Ben meets it. Where his fit is lighter, frame transferable strengths honestly without overclaiming or inventing anything.\n\n` +
          `Respond with ONLY a JSON object, no markdown and no preamble:\n` +
          `{"intro": "one-sentence positioning of Ben for this exact role", "points": [{"area": "requirement area", "apply": "1-2 sentences on how Ben meets it"}]}\n` +
          `Include 3 to 5 points.`
        : `A recruiter or hiring manager from "${name}"` +
          (coRole.trim() ? ` (hiring for: ${coRole.trim()})` : "") +
          ` wants to understand why Ben is a strong fit for their team.\n\n` +
          `Using ONLY Ben's real background from the profile, write a tailored fit summary that maps his experience to the kind of compensation / total rewards needs a company like this likely has. Do not invent facts about Ben, and do not claim specific knowledge of the company's internal details, frame it as how his background would apply.\n\n` +
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
      if (job) setFitRole(job.role);
    } catch (e) {
      setFitError("Couldn't generate the fit just now, please try again in a moment.");
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
      `${form.message}\n\n${form.name}\n${form.email}${form.company ? `\n${form.company}` : ""}`
    );
    window.location.href = `mailto:${c.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  const first = c.name.split(" ")[0];

  return (
    <div className={"rz" + (showCover ? " rz--cover" : "") + (showResume ? " rz--resume" : "")}>
      <style>{CSS}</style>
      {showCover && (
        <div className="rz-cover" role="dialog" aria-modal="true" aria-label="Cover letter">
          <div className="rz-cover-backdrop" onClick={() => setShowCover(false)} />
          <div className="rz-cover-sheet">
            <div className="rz-cover-actions">
              <button className="rz-cover-print" onClick={() => window.print()}><Download size={15} /> Print / Save PDF</button>
              <button className="rz-cover-close" onClick={() => setShowCover(false)} aria-label="Close cover letter">×</button>
            </div>
            <div className="rz-cover-paper">
              <div className="rz-cover-head">
                <p className="rz-cover-name">Ben Phillips</p>
                <p className="rz-cover-contact">bphill10@gmail.com · 734-645-3508 · linkedin.com/in/benjamin-j-phillips</p>
              </div>
              <p className="rz-cover-greet">Dear Hiring Manager,</p>
              {c.coverLetter.map((p, i) => <p className="rz-cover-p" key={i}>{p}</p>)}
              <p className="rz-cover-signoff">Sincerely,<br />Ben Phillips</p>
            </div>
          </div>
        </div>
      )}
      {showResume && (
        <div className="rz-resume" role="dialog" aria-modal="true" aria-label="Résumé">
          <div className="rz-resume-backdrop" onClick={() => setShowResume(false)} />
          <div className="rz-resume-sheet">
            <div className="rz-resume-actions">
              <button className="rz-resume-print" onClick={() => window.print()}><Download size={15} /> Print / Save PDF</button>
              <button className="rz-resume-close" onClick={() => setShowResume(false)} aria-label="Close résumé">×</button>
            </div>
            <div className="rz-resume-paper">
              <div className="rz-rp-head">
                <p className="rz-rp-name">{c.name}</p>
                <p className="rz-rp-title">{c.title}</p>
                <p className="rz-rp-contact">{c.location} · {c.email} · {c.phone} · linkedin.com/in/benjamin-j-phillips</p>
              </div>

              <div className="rz-rp-stats">
                {[
                  { v: "15+", l: "Years in rewards" },
                  { v: "40+", l: "Countries" },
                  { v: "35K+", l: "Employees" },
                  { v: "3,500+", l: "Roles benchmarked" },
                ].map((st) => (
                  <div className="rz-rp-stat" key={st.l}>
                    <span className="rz-rp-statval">{st.v}</span>
                    <span className="rz-rp-statlabel">{st.l}</span>
                  </div>
                ))}
              </div>

              <div className="rz-rp-section">
                <p className="rz-rp-h">Professional Summary</p>
                <p className="rz-rp-summary">{c.summary}</p>
              </div>

              <div className="rz-rp-section">
                <p className="rz-rp-h">Areas of Expertise</p>
                <div className="rz-rp-exp">
                  {c.skills.map((g) => (
                    <div className="rz-rp-expcol" key={g.group}>
                      <p className="rz-rp-expgroup">{g.group}</p>
                      <ul className="rz-rp-explist">
                        {g.items.map((it) => <li key={it}>{it}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rz-rp-section">
                <p className="rz-rp-h">Professional Experience</p>
                {c.experience.map((j) => (
                  <div className="rz-rp-job" key={j.company}>
                    <div className="rz-rp-jobhead">
                      <span className="rz-rp-role">{j.role}</span>
                      <span className="rz-rp-period">{j.period}</span>
                    </div>
                    <p className="rz-rp-co">{j.company} · {j.location}</p>
                    <ul className="rz-rp-bullets">
                      {j.points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="rz-rp-section">
                <p className="rz-rp-h">Earlier Career</p>
                {c.earlier.map((e) => (
                  <div className="rz-rp-earlierrow" key={e.company}>
                    <span><b>{e.role}</b>, {e.company}</span><span className="rz-rp-period">{e.period}</span>
                  </div>
                ))}
              </div>

              <div className="rz-rp-section">
                <p className="rz-rp-h">Education</p>
                {c.education.map((ed) => (
                  <div className="rz-rp-edurow" key={ed.school}>
                    <span className="rz-rp-school">{ed.school}</span><span className="rz-rp-cred">{ed.credential}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
              <button className="rz-download" onClick={() => setShowResume(true)}>
                <Download size={14} /> Download résumé
              </button>
              <button className="rz-coverbtn" onClick={() => setShowCover(true)}>
                <Mail size={14} /> Cover letter
              </button>
            </div>
          </header>

          <section className="rz-manifesto">
            <p className="rz-manifesto-eyebrow"><Sparkles size={14} /> How I think</p>
            <p className="rz-manifesto-quote">My biggest strength has never been the things I've built. It's the things I <span>imagine</span>, and the mentors, people, and AI that help build them.</p>
            <p className="rz-manifesto-cite">Ben Phillips, with 22.4% credit to AI <span>(formatting only)</span></p>
          </section>

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
                <h2 className="rz-fit-title">See how Ben Phillips fits <span>your team</span></h2>
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
                {fitRole && <p className="rz-fit-role">For your open role: {fitRole}</p>}
                {fitResult.intro && <p className="rz-fit-lead">{fitResult.intro}</p>}
                <div className="rz-fit-rows">
                  {(fitResult.points || []).map((p, i) => (
                    <div className="rz-fit-row" key={i}>
                      <p className="rz-fit-area">{p.area}</p>
                      <p className="rz-fit-apply">{p.apply}</p>
                    </div>
                  ))}
                </div>
                <button className="rz-fit-reset" onClick={() => { setFitResult(null); setFitRole(null); setCoName(""); setCoRole(""); }}>
                  Try another company
                </button>
                <p className="rz-fit-disclaimer">Generated from Ben's real background and tailored to your company, verify specifics with Ben directly.</p>
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
            <p className="rz-case-note">Illustrative case studies, figures are Ben's own published metrics; no confidential data is shared.</p>
          </section>

          <section className="rz-section rz-demos">
            <p className="rz-game-eyebrow"><Sparkles size={14} /> Interactive · Built by Ben</p>
            <h2 className="rz-game-title">Everything below is a working demo of real work</h2>
            <p className="rz-game-intro">These are sample versions of tools I've actually built and shipped in the comp function. The on-screen display may look different from the production versions, but the approach and underlying logic are the same, running here on illustrative data, with nothing confidential.</p>
            <div className="rz-demos-grid">
              <div className="rz-demos-item"><span className="rz-demos-k">Decision-grade dashboards</span><span className="rz-demos-v">From the Power BI analytics ecosystem I built: real-time visibility into turnover, market position, and pay equity, plus the pay-vs-turnover sweet-spot model.</span></div>
              <div className="rz-demos-item"><span className="rz-demos-k">Build a merit matrix</span><span className="rz-demos-v">From the annual merit cycle: turning a budget into defensible increases by performance and compa-ratio.</span></div>
              <div className="rz-demos-item"><span className="rz-demos-k">Design the sales commission plan</span><span className="rz-demos-v">From hands-on plan design: turning OTE, gross margin, and headcount into a P&amp;L leaders can defend.</span></div>
              <div className="rz-demos-item"><span className="rz-demos-k">Design the annual incentive plan</span><span className="rz-demos-v">From AIP design: level-based weighting of company and individual goals, with payout curves and funding logic.</span></div>
              <div className="rz-demos-item"><span className="rz-demos-k">Market-price a role</span><span className="rz-demos-v">From the AI-powered benchmarking engine that maps 3,500+ roles to Radford, Mercer, WTW, and Aon surveys.</span></div>
              <div className="rz-demos-item"><span className="rz-demos-k">Build a job architecture</span><span className="rz-demos-v">From the single global job architecture I designed across 40+ countries, 3,000+ titles unified for 35,000+ employees.</span></div>
            </div>
          </section>

          <section className="rz-section rz-an-section">
            <p className="rz-game-eyebrow"><Sparkles size={14} /> Analytics</p>
            <h2 className="rz-game-title">Decision-grade dashboards</h2>
            <p className="rz-game-intro">A look at the analytics Ben builds the way executives see them: turnover, market position, and pay equity at a glance. Sample data, real structure.</p>
            <AnalyticsDashboards />
          </section>

          <section className="rz-section rz-mm-section">
            <p className="rz-game-eyebrow"><Trophy size={14} /> Live demo</p>
            <h2 className="rz-game-title">Build a merit matrix</h2>
            <p className="rz-game-intro">Turn a merit budget into defensible increases by performance and compa-ratio.</p>
            <MeritMatrix />
          </section>

          <section className="rz-section rz-game">
            <p className="rz-game-eyebrow"><Coins size={14} /> Coffee break</p>
            <h2 className="rz-game-title">Design the Sales Commission Plan</h2>
            <p className="rz-game-intro">Pick an industry (mortgage, banking, or tech consulting), then set the real levers: revenue target, gross margin, OTE, headcount, and pay mix. Run the year and get a P&amp;L scorecard with the cost of the plan and its EBIT. Illustrative, but it plays by real rules.</p>
            <SalesPlanGame />
          </section>

          <section className="rz-section rz-aip-section">
            <p className="rz-game-eyebrow"><Coins size={14} /> Live demo</p>
            <h2 className="rz-game-title">Design the annual incentive plan</h2>
            <p className="rz-game-intro">Pick a level and a plan structure, then set company and individual performance. Weighting follows line of sight: more company at the top, more individual lower down. In the weighted design the funding gate hits only the corporate piece, so people still earn on what they control; in the fund-then-modify design the whole bonus is company-gated. Toggle to compare.</p>
            <AipTool />
          </section>

          <section className="rz-section rz-mpt-section">
            <p className="rz-game-eyebrow"><Target size={14} /> Live demo</p>
            <h2 className="rz-game-title">Market-price a role</h2>
            <p className="rz-game-intro">Search 400+ roles, set the industry (your company's sector) and the market, then slide the proposed base. The gauge shows compa-ratio against the market median; the band shows where the pay lands across the range, the same position-to-market read I build into pricing tools.</p>
            <MarketPriceTool />
          </section>

          <section className="rz-section rz-arch-section">
            <p className="rz-game-eyebrow"><Compass size={14} /> Live demo</p>
            <h2 className="rz-game-title">Build a job architecture</h2>
            <p className="rz-game-intro">Pick a company size, industry, and region. The builder generates a leveling spine across four career streams, recommends the right survey to benchmark it, and checks it against 2026 pay-transparency rules in the US and EMEA, the global-architecture work Ben does, in miniature.</p>
            <JobArchTool />
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

          <section className="rz-section rz-trends-section">
            <p className="rz-game-eyebrow"><Sparkles size={14} /> Industry outlook</p>
            <h2 className="rz-game-title">10 compensation trends shaping 2026</h2>
            <p className="rz-game-intro">What Ben is watching this year, synthesized from the 2025–26 surveys and reports by Mercer, WorldatWork, Payscale, WTW, and Pearl Meyer, plus the EU and US pay-transparency landscape.</p>
            <ol className="rz-trends">
              {COMP_TRENDS_2026.map((t) => (
                <li className="rz-trend" key={t.n}>
                  <span className="rz-trend-n">{String(t.n).padStart(2, "0")}</span>
                  <div className="rz-trend-body">
                    <p className="rz-trend-title">{t.title}</p>
                    <p className="rz-trend-detail">{t.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="rz-mpt-disclaimer">Figures are approximate industry ranges for context, not a forecast, exact budget numbers vary by survey, industry, and geography.</p>
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
                      <p>Ask anything about {first}'s background, start here:</p>
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
                <p className="rz-disclaimer">Answers are generated and may be imperfect, reach {first} directly for specifics.</p>
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
                      <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Hi Ben, we're hiring a Head of Total Rewards and…" />
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
  --bg:#0E1118; --bg2:#0B0E14; --panel:#161A24; --panel-2:#1C2230;
  --line:rgba(255,255,255,0.08); --line2:rgba(255,255,255,0.16);
  --text:#E9ECF2; --muted:#8A93A6; --dim:#5C6678;
  --cool:#7C9CFF; --cool-deep:#5B79E6; --warm:#FFC36B; --mint:#5FE3B3;
  --sans:'Inter Tight','Inter',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace;
  position:relative; min-height:100vh; background:var(--bg); color:var(--text);
  font-family:var(--sans); line-height:1.55; -webkit-font-smoothing:antialiased; overflow-x:hidden;
}
.rz *{box-sizing:border-box;}
.rz::before{content:""; position:fixed; inset:-20% -10% auto -10%; height:85vh; pointer-events:none; z-index:0;
  background:radial-gradient(40% 60% at 18% 8%, rgba(124,156,255,0.20), transparent 70%),
             radial-gradient(45% 55% at 86% 26%, rgba(255,195,107,0.12), transparent 70%);
  filter:blur(24px); animation:rzAurora 36s ease-in-out infinite alternate;}
.rz::after{content:""; position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.6;
  background-image:linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
  background-size:64px 64px;
  -webkit-mask-image:radial-gradient(circle at 50% 16%, black, transparent 88%);
  mask-image:radial-gradient(circle at 50% 16%, black, transparent 88%);}
@keyframes rzAurora{from{transform:translate3d(-4%,0,0) scale(1);}to{transform:translate3d(6%,3%,0) scale(1.12);}}

.rz-wrap{position:relative; z-index:1; display:grid; grid-template-columns:1fr; max-width:1240px; margin:0 auto;}
@media(min-width:920px){ .rz-wrap{grid-template-columns:1fr 400px; align-items:start;} }

.rz-doc{padding:46px 26px 80px;}
@media(min-width:920px){ .rz-doc{padding:72px 60px;} }
.rz-doc > *{animation:rzUp .7s cubic-bezier(.2,.7,.2,1) both;}
.rz-doc>*:nth-child(1){animation-delay:0.02s;}
.rz-doc>*:nth-child(2){animation-delay:0.08s;}
.rz-doc>*:nth-child(3){animation-delay:0.14s;}
.rz-doc>*:nth-child(4){animation-delay:0.20s;}
.rz-doc>*:nth-child(5){animation-delay:0.26s;}
.rz-doc>*:nth-child(6){animation-delay:0.32s;}
.rz-doc>*:nth-child(7){animation-delay:0.38s;}
.rz-doc>*:nth-child(8){animation-delay:0.44s;}
.rz-doc>*:nth-child(9){animation-delay:0.50s;}
.rz-doc>*:nth-child(10){animation-delay:0.56s;}

.rz-eyebrow{font-family:var(--mono); font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:var(--cool); margin:0 0 20px; display:flex; align-items:center; gap:11px;}
.rz-eyebrow::before{content:""; width:28px; height:2px; border-radius:2px; background:linear-gradient(90deg,var(--cool),var(--warm));}
.rz-name{font-size:clamp(44px,7.2vw,78px); font-weight:800; letter-spacing:-.035em; line-height:.95; margin:0;
  background:linear-gradient(96deg,#ffffff 28%, #CBD6FF 58%, var(--cool)); -webkit-background-clip:text; background-clip:text; color:transparent;}
.rz-title{font-size:17px; color:var(--muted); margin:16px 0 0; font-weight:500;}
.rz-tagline{font-size:20px; color:var(--text); margin:18px 0 0; max-width:42ch; font-weight:450;}
.rz-contact{display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:26px; font-size:12.5px; color:var(--muted); align-items:center;}
.rz-contact span,.rz-contact a{display:inline-flex; align-items:center; gap:7px; color:inherit; text-decoration:none; font-family:var(--mono); letter-spacing:.02em;}
.rz-contact a:hover{color:var(--cool);}
.rz-contact svg{opacity:.8;}
.rz-download{display:inline-flex; align-items:center; gap:7px; font-family:var(--mono); font-size:11.5px; letter-spacing:.05em; color:#0E1118; background:linear-gradient(90deg,var(--cool),#9DB2FF); border:none; border-radius:999px; padding:8px 16px; cursor:pointer; transition:transform .15s, box-shadow .15s;}
.rz-download:hover{transform:translateY(-1px); box-shadow:0 10px 26px -10px rgba(124,156,255,.7);}
.rz-download svg{opacity:1;}

.rz-section{padding-top:42px; margin-top:42px; border-top:1px solid var(--line);}
.rz-h2{font-family:var(--mono); font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:var(--muted); margin:0 0 22px; display:flex; align-items:center; gap:10px;}
.rz-h2::before{content:""; width:8px; height:8px; border-radius:2px; background:linear-gradient(135deg,var(--cool),var(--warm)); box-shadow:0 0 12px rgba(124,156,255,.55);}
.rz-body{font-size:16px; color:#C7CDDA; margin:0; max-width:64ch;}
.rz-highlights{list-style:none; padding:0; margin:24px 0 0; display:grid; gap:12px;}
.rz-highlights li{display:flex; gap:14px; align-items:baseline; font-size:15px; color:#C7CDDA;}
.rz-tick{width:14px; height:3px; flex:0 0 14px; border-radius:2px; background:linear-gradient(90deg,var(--cool),var(--warm)); transform:translateY(-2px);}

.rz-manifesto{position:relative; margin-top:30px; padding:40px 34px; border:1px solid var(--line); border-radius:18px; overflow:hidden; background:radial-gradient(130% 130% at 0% 0%, rgba(124,156,255,0.12), transparent 52%), radial-gradient(130% 130% at 100% 100%, rgba(255,195,107,0.09), transparent 52%), rgba(255,255,255,0.015);}
.rz-manifesto::after{content:""; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px); background-size:34px 34px; -webkit-mask:radial-gradient(75% 75% at 50% 50%, #000, transparent 78%); mask:radial-gradient(75% 75% at 50% 50%, #000, transparent 78%); pointer-events:none; opacity:.6;}
.rz-manifesto-eyebrow{position:relative; font-family:var(--mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--cool); margin:0 0 18px; display:flex; align-items:center; gap:8px;}
.rz-manifesto-quote{position:relative; font-family:var(--sans); font-weight:650; font-size:clamp(18px,2.6vw,26px); line-height:1.3; letter-spacing:-.01em; color:var(--text); margin:0; max-width:46ch;}
.rz-manifesto-quote span{background:linear-gradient(120deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text; color:transparent;}
.rz-manifesto-cite{position:relative; text-align:right; font-family:var(--sans); font-style:italic; font-size:13px; color:var(--muted); margin:20px 0 0;}
.rz-manifesto-cite span{color:var(--dim); font-style:normal;}
.rz-looking{margin-top:30px; padding:22px 24px; background:linear-gradient(180deg, rgba(124,156,255,0.06), rgba(124,156,255,0.015)); border:1px solid var(--line); border-left:2px solid var(--cool); border-radius:6px 16px 16px 6px;}
.rz-looking-label{font-family:var(--mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--cool); margin:0 0 12px; display:flex; align-items:center; gap:8px;}
.rz-looking-text{font-size:15.5px; color:#D5DAE6; margin:0 0 16px; max-width:62ch;}
.rz-tags{display:flex; flex-wrap:wrap; gap:8px;}
.rz-tag{font-size:12.5px; padding:5px 12px; border:1px solid var(--line2); border-radius:999px; color:var(--muted); background:rgba(255,255,255,0.02);}
.rz-tag-role{border-color:rgba(124,156,255,0.4); color:#C9D4FF; background:rgba(124,156,255,0.08);}

.rz-signature{margin-top:32px; padding:28px; border:1px solid var(--line); border-radius:20px; background:linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012)); position:relative; overflow:hidden;}
.rz-signature::before{content:""; position:absolute; inset:0; border-radius:20px; padding:1px;
  background:linear-gradient(120deg, rgba(124,156,255,.55), transparent 42%, rgba(255,195,107,.45));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; opacity:.7;}
.rz-sig-headline{font-size:clamp(22px,3.2vw,30px); font-weight:730; letter-spacing:-.02em; line-height:1.18; margin:10px 0 0; max-width:26ch; color:var(--text);}
.rz-sig-detail{font-size:15px; color:#B7BECD; margin:14px 0 0; max-width:60ch;}
.rz-metrics{display:flex; flex-wrap:wrap; gap:26px 44px; margin-top:26px;}
.rz-metric{display:flex; flex-direction:column;}
.rz-metric-val{font-size:clamp(32px,5vw,46px); font-weight:800; letter-spacing:-.03em; line-height:1; background:linear-gradient(120deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text; color:transparent;}
.rz-metric-label{font-family:var(--mono); font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--dim); margin-top:9px;}

.rz-job{margin-bottom:28px;}
.rz-job-head{display:flex; justify-content:space-between; gap:16px; align-items:baseline; flex-wrap:wrap;}
.rz-role{font-size:19px; font-weight:650; margin:0; color:var(--text); letter-spacing:-.01em;}
.rz-company{font-size:14px; color:var(--muted); margin:4px 0 0;}
.rz-period{font-family:var(--mono); font-size:11.5px; color:var(--cool); letter-spacing:.04em; white-space:nowrap;}
.rz-points{margin:14px 0 0; padding-left:0; list-style:none; display:grid; gap:9px;}
.rz-points li{position:relative; padding-left:20px; font-size:14.5px; color:#B7BECD;}
.rz-points li::before{content:""; position:absolute; left:0; top:9px; width:11px; height:2px; border-radius:2px; background:linear-gradient(90deg,var(--cool),var(--warm));}
.rz-earlier{margin-top:24px; padding-top:18px; border-top:1px dashed var(--line);}
.rz-earlier-row{display:flex; justify-content:space-between; gap:12px; font-size:14px; color:var(--muted); margin:7px 0;}

.rz-grid{display:grid; gap:0;}
@media(min-width:620px){ .rz-grid{grid-template-columns:1fr 1fr; gap:44px;} .rz-grid .rz-section{border-top:1px solid var(--line);} }
.rz-skillgroup{margin-bottom:18px;}
.rz-skilllabel{font-size:13px; font-weight:650; color:var(--text); margin:0 0 9px;}
.rz-edu{margin-bottom:14px;}

.rz-cases{display:grid; gap:14px;}
.rz-case{padding:22px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.025); transition:border-color .18s, transform .18s, background .18s;}
.rz-case:hover{border-color:var(--line2); transform:translateY(-2px); background:rgba(255,255,255,0.045);}
.rz-case-tag{font-family:var(--mono); font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--cool); margin:0 0 10px;}
.rz-case-title{font-size:19px; font-weight:680; margin:0; line-height:1.22; color:var(--text); letter-spacing:-.01em;}
.rz-case-summary{font-size:14.5px; color:#B7BECD; margin:11px 0 0;}
.rz-case-outcome{font-size:13.5px; color:var(--text); margin:14px 0 0; display:flex; gap:10px; align-items:baseline;}
.rz-case-outcome b{font-weight:650; color:var(--warm);}
.rz-case-note{font-size:12px; color:var(--dim); margin:16px 0 0; font-style:italic;}

.rz-fit{margin-top:30px; padding:28px; border-radius:20px; background:linear-gradient(165deg, rgba(124,156,255,0.10), rgba(255,195,107,0.05)); border:1px solid var(--line2); position:relative; overflow:hidden;}
.rz-fit-eyebrow{font-family:var(--mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--warm); margin:0 0 12px; display:flex; align-items:center; gap:8px;}
.rz-fit-title{font-size:clamp(22px,3.1vw,30px); font-weight:780; letter-spacing:-.02em; margin:0 0 16px; line-height:1.15; color:#fff;}
.rz-fit-title span{background:linear-gradient(100deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text; color:transparent;}
.rz-fit-lead{font-size:14.5px; color:#C2C9D6; margin:0 0 18px; max-width:56ch; line-height:1.55;}
.rz-fit-role{font-family:var(--mono); font-size:12px; letter-spacing:.04em; color:var(--warm); margin:-8px 0 14px;}
.rz-fit-form{display:flex; flex-wrap:wrap; gap:10px; align-items:center; padding-bottom:8px;}
.rz-fit-input{flex:1 1 200px; background:rgba(8,10,16,0.6); color:var(--text); border:1px solid var(--line2); border-radius:12px; padding:12px 14px; font-family:var(--sans); font-size:14.5px; outline:none;}
.rz-fit-input::placeholder{color:var(--dim);}
.rz-fit-input:focus-visible{border-color:var(--cool);}
.rz-fit-btn{flex:0 0 auto; background:linear-gradient(90deg,var(--warm),#FFD79A); color:#1a1300; border:none; border-radius:12px; padding:12px 22px; font-family:var(--sans); font-size:14.5px; font-weight:700; cursor:pointer; transition:transform .15s, box-shadow .15s;}
.rz-fit-btn:hover:not(:disabled){transform:translateY(-1px); box-shadow:0 12px 28px -10px rgba(255,195,107,.7);}
.rz-fit-btn:disabled{opacity:.45; cursor:default;}
.rz-fit-error{font-size:13px; color:#FF9B9B; margin:12px 0 0;}
.rz-fit-rows{display:grid; gap:0;}
.rz-fit-row{padding:16px 0; border-top:1px solid rgba(255,255,255,0.12);}
.rz-fit-area{font-size:14px; font-weight:680; color:#fff; margin:0;}
.rz-fit-apply{font-size:14px; color:#C2C9D6; margin:6px 0 0; line-height:1.5;}
.rz-fit-reset{background:rgba(255,255,255,0.06); border:1px solid var(--line2); color:var(--text); border-radius:999px; padding:8px 18px; font-family:var(--sans); font-size:13px; cursor:pointer; margin-top:8px; transition:border-color .15s;}
.rz-fit-reset:hover{border-color:var(--cool);}
.rz-fit-disclaimer{font-size:11.5px; color:var(--dim); margin:14px 0 0; font-style:italic;}

.rz-agent{background:linear-gradient(180deg,#0C0F16,#0A0D13); border-left:1px solid var(--line);}
@media(min-width:920px){ .rz-agent{position:sticky; top:0; height:100vh;} }
.rz-agent-inner{display:flex; flex-direction:column; height:100%; min-height:580px; padding:28px 22px 16px;}
@media(min-width:920px){ .rz-agent-inner{height:100vh;} }
.rz-agent-head{flex:0 0 auto; padding-bottom:16px; border-bottom:1px solid var(--line);}
.rz-status{font-family:var(--mono); font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--mint); margin:0 0 14px; display:flex; align-items:center; gap:8px;}
.rz-dot{width:8px; height:8px; border-radius:50%; background:var(--mint); box-shadow:0 0 12px var(--mint); animation:rzpulse 2.4s infinite;}
@keyframes rzpulse{0%{box-shadow:0 0 0 0 rgba(95,227,179,.5);}70%{box-shadow:0 0 0 8px rgba(95,227,179,0);}100%{box-shadow:0 0 0 0 rgba(95,227,179,0);}}
.rz-tabs{display:flex; gap:6px; background:rgba(255,255,255,0.04); padding:4px; border-radius:12px; border:1px solid var(--line);}
.rz-tab{flex:1; display:flex; align-items:center; justify-content:center; gap:7px; font-family:var(--sans); font-size:12.5px; font-weight:550; color:var(--muted); background:transparent; border:none; border-radius:9px; padding:9px 6px; cursor:pointer; transition:background .15s,color .15s;}
.rz-tab.on{background:linear-gradient(180deg, rgba(124,156,255,0.20), rgba(124,156,255,0.07)); color:#fff;}
.rz-tab svg{color:var(--cool);}
.rz-thread{flex:1 1 auto; overflow-y:auto; padding:20px 2px; display:flex; flex-direction:column; gap:14px;}
.rz-empty p{font-size:13px; color:var(--muted); margin:0 0 12px;}
.rz-chips{display:flex; flex-direction:column; gap:8px;}
.rz-chip{text-align:left; font-family:var(--sans); font-size:13.5px; color:var(--text); background:rgba(255,255,255,0.03); border:1px solid var(--line); border-radius:12px; padding:12px 14px; cursor:pointer; transition:border-color .15s,transform .1s,background .15s;}
.rz-chip:hover{border-color:var(--cool); transform:translateX(3px); background:rgba(124,156,255,0.07);}
.rz-msg{max-width:90%; font-size:14.5px;}
.rz-msg p{margin:0; white-space:pre-wrap;}
.rz-msg-user{align-self:flex-end; background:linear-gradient(135deg,var(--cool-deep),var(--cool)); color:#fff; padding:11px 15px; border-radius:16px 16px 5px 16px;}
.rz-msg-bot{align-self:flex-start;}
.rz-msg-tag{font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--dim); display:block; margin-bottom:6px;}
.rz-msg-bot p{background:rgba(255,255,255,0.045); border:1px solid var(--line); padding:12px 15px; border-radius:5px 16px 16px 16px; color:var(--text); line-height:1.55;}
.rz-typing{display:inline-flex; gap:5px; align-items:center;}
.rz-typing i{width:6px; height:6px; border-radius:50%; background:var(--muted); animation:rzbounce 1.2s infinite;}
.rz-typing i:nth-child(2){animation-delay:.18s;} .rz-typing i:nth-child(3){animation-delay:.36s;}
@keyframes rzbounce{0%,60%,100%{opacity:.3; transform:translateY(0);}30%{opacity:1; transform:translateY(-3px);}}
.rz-error{font-size:13px; color:#FF9B9B; margin:4px 0;}
.rz-inputbar{flex:0 0 auto; display:flex; align-items:flex-end; gap:8px; padding-top:14px; border-top:1px solid var(--line);}
.rz-input{flex:1; resize:none; max-height:120px; background:rgba(255,255,255,0.04); color:var(--text); border:1px solid var(--line2); border-radius:12px; padding:11px 13px; font-family:var(--sans); font-size:14.5px; line-height:1.45; outline:none;}
.rz-input::placeholder{color:var(--dim);}
.rz-input:focus-visible{border-color:var(--cool);}
.rz-send,.rz-reset{flex:0 0 auto; width:42px; height:42px; border-radius:12px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform .15s, box-shadow .15s;}
.rz-send{background:linear-gradient(135deg,var(--cool),#9DB2FF); color:#0E1118;}
.rz-send:hover:not(:disabled){transform:translateY(-1px); box-shadow:0 10px 24px -10px rgba(124,156,255,.7);}
.rz-send:disabled{opacity:.4; cursor:default;}
.rz-reset{background:transparent; color:var(--muted); border:1px solid var(--line2);}
.rz-reset:hover{color:var(--text); border-color:var(--cool);}
.rz-disclaimer{font-size:11px; color:var(--dim); margin:10px 2px 0; text-align:center; line-height:1.4;}
.rz-contactpane{flex:1 1 auto; overflow-y:auto; padding:20px 2px 8px; display:flex; flex-direction:column; gap:14px;}
.rz-contactintro{font-size:13.5px; color:var(--muted); margin:0; line-height:1.55;}
.rz-field{display:flex; flex-direction:column; gap:6px;}
.rz-field span{font-size:12px; color:var(--muted); font-weight:550;}
.rz-field em{color:var(--dim); font-style:normal;}
.rz-field input,.rz-field textarea{background:rgba(255,255,255,0.04); color:var(--text); border:1px solid var(--line2); border-radius:10px; padding:10px 12px; font-family:var(--sans); font-size:14px; outline:none; resize:none;}
.rz-field input::placeholder,.rz-field textarea::placeholder{color:var(--dim);}
.rz-field input:focus-visible,.rz-field textarea:focus-visible{border-color:var(--cool);}
.rz-mailbtn{display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(90deg,var(--warm),#FFD79A); color:#1a1300; border:none; border-radius:12px; padding:13px; font-family:var(--sans); font-size:14.5px; font-weight:700; cursor:pointer; margin-top:4px; transition:transform .15s, box-shadow .15s;}
.rz-mailbtn:hover:not(:disabled){transform:translateY(-1px); box-shadow:0 12px 28px -10px rgba(255,195,107,.7);}
.rz-mailbtn:disabled{opacity:.4; cursor:default;}
.rz-directlinks{display:flex; justify-content:center; gap:20px; margin-top:6px; padding-top:14px; border-top:1px solid var(--line);}
.rz-directlinks a{display:inline-flex; align-items:center; gap:6px; font-size:12.5px; color:var(--muted); text-decoration:none; font-family:var(--mono);}
.rz-directlinks a:hover{color:var(--cool);}
.rz-confirm{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:12px; padding:24px;}
.rz-confirm-icon{width:48px; height:48px; border-radius:50%; background:rgba(95,227,179,0.14); color:var(--mint); display:flex; align-items:center; justify-content:center;}
.rz-confirm h3{font-size:20px; font-weight:720; margin:0; color:#fff;}
.rz-confirm p{font-size:13.5px; color:var(--muted); margin:0; line-height:1.55;}
.rz-confirm a{color:var(--cool);}
.rz-textbtn{background:none; border:none; color:var(--warm); font-size:13.5px; cursor:pointer; margin-top:4px; font-family:var(--sans);}

.rz-game-eyebrow{font-family:var(--mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--warm); margin:0 0 10px; display:flex; align-items:center; gap:8px;}
.rz-game-title{font-size:28px; font-weight:780; letter-spacing:-.02em; margin:0 0 8px; color:var(--text);}
.rz-game-intro{font-size:14.5px; color:#B7BECD; margin:0 0 22px; max-width:60ch;}
.rz-game-inner{background:rgba(255,255,255,0.025); border:1px solid var(--line); border-radius:18px; padding:26px;}
.rz-game-role{font-size:24px; font-weight:720; margin:14px 0 2px; color:var(--text); letter-spacing:-.01em;}
.rz-game-blurb{font-size:14px; color:var(--muted); margin:0;}
.rz-game-q{font-size:12px; font-family:var(--mono); letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin:20px 0 8px;}
.rz-game-q b{color:var(--text);}
.rz-game-guess{font-size:38px; font-weight:800; letter-spacing:-.02em; color:transparent; background:linear-gradient(120deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text; margin:0; line-height:1;}
.rz-game-sub{font-family:var(--mono); font-size:15px; font-weight:400; color:var(--dim); -webkit-text-fill-color:var(--dim);}
.rz-game-slider{-webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:999px; background:linear-gradient(90deg, rgba(124,156,255,.45), rgba(255,195,107,.45)); margin:16px 0 4px; outline:none;}
.rz-game-slider::-webkit-slider-thumb{-webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:#fff; border:3px solid var(--cool); box-shadow:0 2px 8px rgba(0,0,0,.4); cursor:pointer;}
.rz-game-slider::-moz-range-thumb{width:22px; height:22px; border-radius:50%; background:#fff; border:3px solid var(--cool); cursor:pointer;}
.rz-game-products{display:grid; grid-template-columns:1fr; gap:10px;}
@media(min-width:520px){ .rz-game-products{grid-template-columns:1fr 1fr;} }
.rz-game-product{text-align:left; padding:15px 16px; border:1px solid var(--line); border-radius:14px; background:rgba(255,255,255,0.02); cursor:pointer; transition:border-color .15s, transform .12s, background .15s;}
.rz-game-product:hover{border-color:var(--cool); transform:translateY(-2px); background:rgba(124,156,255,0.07);}
.rz-game-product strong{display:block; font-size:16px; font-weight:680; color:var(--text); margin-bottom:3px;}
.rz-game-product span{font-size:12.5px; color:var(--muted);}
.rz-game-link{background:none; border:none; color:var(--cool); font-size:13px; cursor:pointer; padding:0; margin-bottom:8px; font-family:var(--mono);}
.rz-game-special{font-size:13px; color:var(--warm); font-style:italic; margin:6px 0 0; background:rgba(255,195,107,0.08); padding:9px 12px; border-radius:8px; border:1px solid rgba(255,195,107,0.2);}
.rz-game-opts{display:flex; flex-wrap:wrap; gap:8px; margin-top:2px;}
.rz-game-opt{padding:9px 15px; border:1px solid var(--line2); border-radius:999px; background:rgba(255,255,255,0.02); cursor:pointer; font-family:var(--sans); font-size:13.5px; color:var(--muted); transition:border-color .15s, background .15s, color .15s;}
.rz-game-opt.on{border-color:var(--cool); background:rgba(124,156,255,0.12); color:#fff; font-weight:600;}
.rz-game-btn{display:inline-flex; align-items:center; gap:8px; background:linear-gradient(90deg,var(--cool),#9DB2FF); color:#0E1118; border:none; border-radius:12px; padding:12px 22px; font-family:var(--sans); font-size:14.5px; font-weight:700; cursor:pointer; margin-top:14px; transition:transform .15s, box-shadow .15s;}
.rz-game-btn:hover:not(:disabled){transform:translateY(-1px); box-shadow:0 12px 28px -10px rgba(124,156,255,.7);}
.rz-game-btn:disabled{opacity:.4; cursor:default;}
.rz-game-lines{display:grid; gap:8px; margin:16px 0 4px;}
.rz-game-lines p{font-size:14px; color:#C2C9D6; margin:0;}
.rz-game-event{font-style:italic; color:var(--dim) !important;}
.rz-game-final{text-align:center; padding:16px 8px;}
.rz-game-finalscore{font-size:48px; font-weight:800; letter-spacing:-.03em; margin:12px 0 0; line-height:1; color:transparent; background:linear-gradient(120deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text;}
.rz-game-finalscore span{font-size:22px; color:var(--dim); -webkit-text-fill-color:var(--dim);}
.rz-game-rank{font-size:18px; font-weight:600; color:var(--text); margin:12px auto 18px; max-width:34ch;}

.rz a:focus-visible,.rz button:focus-visible,.rz textarea:focus-visible,.rz input:focus-visible{outline:2px solid var(--cool); outline-offset:2px;}
@keyframes rzUp{from{opacity:0; transform:translateY(16px);}to{opacity:1; transform:translateY(0);}}
@media(prefers-reduced-motion:reduce){ .rz *,.rz::before{animation:none !important; transition:none !important;} .rz-doc>*{opacity:1 !important; transform:none !important;} }

.rz-mpt{background:rgba(255,255,255,0.025); border:1px solid var(--line); border-radius:18px; padding:26px;}
.rz-mpt-controls{display:grid; grid-template-columns:1fr; gap:14px; margin-bottom:8px;}
@media(min-width:520px){ .rz-mpt-controls{grid-template-columns:1fr 1fr;} }
.rz-mpt-field{display:flex; flex-direction:column; gap:7px;}
.rz-mpt-field span{font-family:var(--mono); font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--muted);}
.rz-mpt-select{appearance:none; -webkit-appearance:none; background:rgba(8,10,16,0.55); color:var(--text); border:1px solid var(--line2); border-radius:12px; padding:12px 38px 12px 14px; font-family:var(--sans); font-size:14.5px; cursor:pointer; outline:none;
  background-image:linear-gradient(45deg,transparent 50%,var(--cool) 50%),linear-gradient(135deg,var(--cool) 50%,transparent 50%); background-position:calc(100% - 20px) 19px,calc(100% - 14px) 19px; background-size:6px 6px,6px 6px; background-repeat:no-repeat;}
.rz-mpt-select:focus-visible{border-color:var(--cool);}
.rz-mpt-q{font-family:var(--mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin:22px 0 8px;}

.rz-mpt-bar{margin:22px 0 6px;}
.rz-mpt-bar-track{position:relative; height:8px; border-radius:999px; background:linear-gradient(90deg, rgba(124,156,255,.55), rgba(255,195,107,.55)); margin:26px 0 30px;}
.rz-mpt-tick{position:absolute; top:50%; transform:translate(-50%,-50%); display:flex; flex-direction:column; align-items:center;}
.rz-mpt-tick i{width:2px; height:16px; background:rgba(255,255,255,0.35); border-radius:2px;}
.rz-mpt-tick em{position:absolute; top:16px; font-family:var(--mono); font-size:10px; letter-spacing:.06em; color:var(--dim); font-style:normal; white-space:nowrap;}
.rz-mpt-marker{position:absolute; top:50%; width:18px; height:18px; border-radius:50%; background:#fff; border:3px solid var(--cool); box-shadow:0 0 0 4px rgba(124,156,255,.18),0 2px 8px rgba(0,0,0,.4); transform:translate(-50%,-50%); transition:left .12s ease;}
.rz-mpt-ends{display:flex; justify-content:space-between; font-family:var(--mono); font-size:11px; color:var(--muted);}

.rz-mpt-result{display:grid; grid-template-columns:1fr; gap:8px 26px; align-items:center; margin-top:24px; padding-top:22px; border-top:1px solid var(--line);}
@media(min-width:520px){ .rz-mpt-result{grid-template-columns:200px 1fr;} }
.rz-mpt-gauge{position:relative; text-align:center;}
.rz-gauge-svg{width:100%; max-width:200px; display:block; margin:0 auto;}
.rz-gauge-end{fill:var(--dim); font-family:var(--mono); font-size:9px; letter-spacing:.05em;}
.rz-mpt-gauge-val{font-size:34px; font-weight:800; letter-spacing:-.02em; line-height:1; margin:-30px 0 0; color:transparent; background:linear-gradient(120deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text;}
.rz-mpt-gauge-val span{font-size:18px;}
.rz-mpt-gauge-cap{font-family:var(--mono); font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--dim); margin:8px 0 0;}
.rz-mpt-readout{display:flex; flex-direction:column; gap:4px;}
.rz-mpt-stat{display:flex; align-items:baseline; gap:9px; flex-wrap:wrap;}
.rz-mpt-statval{font-size:30px; font-weight:800; letter-spacing:-.02em; color:var(--text); line-height:1;}
.rz-mpt-statval em{font-size:15px; font-weight:600; color:var(--muted); font-style:normal;}
.rz-mpt-statlabel{font-size:13px; color:var(--muted);}
.rz-mpt-verdict{font-size:18px; font-weight:720; letter-spacing:-.01em; margin:12px 0 0; color:var(--warm);}
.rz-mpt-note{font-size:13.5px; color:#B7BECD; margin:5px 0 0; line-height:1.5;}
.rz-mpt-rolenote{font-size:12.5px; color:var(--dim); font-style:italic; margin:9px 0 0;}
.rz-mpt-disclaimer{font-size:11.5px; color:var(--dim); margin:20px 0 0; padding-top:16px; border-top:1px solid var(--line); line-height:1.5; font-style:italic;}

.rz-trends{list-style:none; counter-reset:none; padding:0; margin:6px 0 0; display:grid; gap:0;}
.rz-trend{display:flex; gap:18px; align-items:flex-start; padding:18px 0; border-top:1px solid var(--line);}
.rz-trend:first-child{border-top:none;}
.rz-trend-n{flex:0 0 auto; font-family:var(--mono); font-size:13px; font-weight:600; letter-spacing:.04em; line-height:1.5;
  background:linear-gradient(135deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text; color:transparent; min-width:24px;}
.rz-trend-body{flex:1;}
.rz-trend-title{font-size:16.5px; font-weight:680; color:var(--text); margin:0; letter-spacing:-.01em;}
.rz-trend-detail{font-size:14px; color:#B7BECD; margin:6px 0 0; line-height:1.55; max-width:68ch;}

.rz-arch{background:rgba(255,255,255,0.025); border:1px solid var(--line); border-radius:18px; padding:26px;}
.rz-arch-controls{display:grid; gap:18px; margin-bottom:6px;}
.rz-arch-group .rz-mpt-q{margin-top:0;}
.rz-arch-sub{font-style:normal; font-size:10.5px; color:var(--dim); margin-left:5px;}
.rz-game-opt.on .rz-arch-sub{color:rgba(255,255,255,0.7);}
.rz-arch-summary{display:grid; gap:14px; margin:22px 0 6px; padding:18px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line);}
@media(min-width:560px){ .rz-arch-summary{grid-template-columns:auto 1fr; gap:14px 28px; align-items:center;} }
.rz-arch-stat{display:flex; flex-direction:column; gap:4px;}
.rz-arch-statval{font-size:30px; font-weight:800; letter-spacing:-.02em; line-height:1; background:linear-gradient(120deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text; color:transparent;}
.rz-arch-statsmall{font-size:18px;}
.rz-arch-statlabel{font-size:12.5px; color:var(--muted); line-height:1.4;}
.rz-arch-spine{display:grid; grid-template-columns:1fr; gap:18px; margin-top:22px;}
@media(min-width:560px){ .rz-arch-spine{grid-template-columns:1fr 1fr;} }
@media(min-width:860px){ .rz-arch-spine{grid-template-columns:repeat(4,1fr);} }
.rz-arch-col{display:flex; flex-direction:column; gap:6px;}
.rz-arch-colhead{font-family:var(--mono); font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--cool); margin:0 0 6px; display:flex; align-items:center; justify-content:space-between;}
.rz-arch-colhead span{color:var(--dim); background:rgba(255,255,255,0.05); border-radius:6px; padding:1px 7px;}
.rz-arch-level,.rz-arch-famrow{display:flex; align-items:center; gap:10px; padding:9px 11px; border:1px solid var(--line); border-radius:10px; background:rgba(255,255,255,0.02);}
.rz-arch-code{font-family:var(--mono); font-size:11px; font-weight:600; color:var(--warm); flex:0 0 auto; min-width:30px;}
.rz-arch-title{font-size:13.5px; color:var(--text); line-height:1.3;}
.rz-arch-fam{margin-top:24px; padding-top:20px; border-top:1px solid var(--line);}
.rz-arch-famhead{font-size:14px; font-weight:680; color:var(--text); margin:0 0 12px;}
.rz-arch-famrows{display:grid; grid-template-columns:1fr; gap:8px;}
@media(min-width:560px){ .rz-arch-famrows{grid-template-columns:1fr 1fr;} }
.rz-arch-comp{margin-top:24px; padding-top:20px; border-top:1px solid var(--line);}
.rz-arch-compitem{display:flex; gap:11px; align-items:flex-start; font-size:13.5px; color:#B7BECD; margin:0 0 11px; line-height:1.5;}
.rz-arch-compitem svg{flex:0 0 auto; margin-top:2px; color:var(--mint);}
.rz-arch-spine-item{color:var(--text); margin-top:14px; padding-top:14px; border-top:1px dashed var(--line);}
.rz-arch-spine-item svg{color:var(--cool);}

.rz-arch-tracks{display:grid; grid-template-columns:1fr; gap:18px;}
@media(min-width:560px){ .rz-arch-tracks{grid-template-columns:1fr 1fr;} }
.rz-arch-tracklabel{font-family:var(--mono); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); margin:0 0 10px;}
.rz-arch-caption{font-family:var(--mono); font-size:10.5px; color:var(--dim); margin:-6px 0 16px; line-height:1.5;}
.rz-arch-famrows-col{display:grid; gap:10px;}
.rz-arch-famrow{flex-direction:column; align-items:stretch; gap:8px;}
.rz-arch-famtop{display:flex; align-items:center; gap:10px;}
.rz-arch-mid{margin-left:auto; font-family:var(--mono); font-size:12.5px; font-weight:600; color:var(--text);}
.rz-arch-band{position:relative; height:7px; border-radius:999px; background:rgba(255,255,255,0.06);}
.rz-arch-band-fill{position:absolute; top:0; height:100%; border-radius:999px; background:linear-gradient(90deg,var(--cool),var(--warm));}
.rz-arch-band-mid{position:absolute; top:50%; width:10px; height:10px; border-radius:50%; background:#fff; border:2px solid var(--cool); transform:translate(-50%,-50%); box-shadow:0 1px 4px rgba(0,0,0,.4);}
.rz-arch-bandrange{font-family:var(--mono); font-size:10.5px; color:var(--dim);}
.rz-arch-copy{margin-top:18px; display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); border:1px solid var(--line2); color:var(--text); border-radius:10px; padding:9px 16px; font-family:var(--sans); font-size:13px; cursor:pointer; transition:border-color .15s, background .15s;}
.rz-arch-copy:hover{border-color:var(--cool); background:rgba(124,156,255,0.08);}

.rz-game-srow{margin:16px 0;}
.rz-game-slabel{display:flex; justify-content:space-between; align-items:baseline; gap:10px; font-size:13px; color:var(--muted); margin-bottom:4px;}
.rz-game-slabel b{font-family:var(--mono); font-size:16px; color:var(--text); font-weight:600;}
.rz-game-hint{font-family:var(--mono); font-size:12px; color:var(--cool); margin:18px 0 4px;}
.rz-game-scorecard{display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:14px 0 4px;}
@media(min-width:520px){ .rz-game-scorecard{grid-template-columns:repeat(3,1fr);} }
.rz-game-metric{border:1px solid var(--line); border-radius:12px; padding:13px 14px; background:rgba(255,255,255,0.025);}
.rz-game-mval{font-family:var(--mono); font-size:18px; font-weight:700; color:var(--text); margin:0;}
.rz-game-mval.neg{color:#FF9B9B;}
.rz-game-mlabel{font-family:var(--mono); font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--dim); margin:5px 0 0;}

.rz-mpt-search-field{position:relative;}
@media(min-width:520px){ .rz-mpt-search-field{grid-column:1 / -1;} }
.rz-mpt-search{background-image:none !important; cursor:text;}
.rz-mpt-results{position:absolute; top:100%; left:0; right:0; margin-top:6px; background:#11151E; border:1px solid var(--line2); border-radius:12px; max-height:244px; overflow-y:auto; z-index:30; box-shadow:0 16px 44px -14px rgba(0,0,0,.75);}
.rz-mpt-resultitem{display:block; width:100%; text-align:left; background:none; border:none; color:var(--text); font-family:var(--sans); font-size:14px; padding:10px 14px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05);}
.rz-mpt-resultitem:last-child{border-bottom:none;}
.rz-mpt-resultitem:hover{background:rgba(124,156,255,0.14);}
.rz-mpt-noresult{font-size:13px; color:var(--muted); padding:12px 14px; margin:0;}

.rz-coverbtn{display:inline-flex; align-items:center; gap:7px; font-family:var(--mono); font-size:11.5px; letter-spacing:.05em; color:var(--warm); background:rgba(255,195,107,0.10); border:1px solid rgba(255,195,107,0.35); border-radius:999px; padding:8px 16px; cursor:pointer; transition:transform .15s, background .15s;}
.rz-coverbtn:hover{transform:translateY(-1px); background:rgba(255,195,107,0.18);}

.rz-cover{position:fixed; inset:0; z-index:1000; display:flex; align-items:flex-start; justify-content:center; overflow-y:auto; padding:40px 16px;}
.rz-cover-backdrop{position:fixed; inset:0; background:rgba(6,8,12,0.78); -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);}
.rz-cover-sheet{position:relative; z-index:1; width:100%; max-width:760px; margin:auto 0; animation:rzUp .4s ease both;}
.rz-cover-actions{display:flex; justify-content:flex-end; gap:10px; align-items:center; margin-bottom:12px;}
.rz-cover-print{display:inline-flex; align-items:center; gap:8px; background:linear-gradient(90deg,var(--cool),#9DB2FF); color:#0E1118; border:none; border-radius:10px; padding:10px 18px; font-family:var(--sans); font-size:14px; font-weight:700; cursor:pointer; transition:box-shadow .15s;}
.rz-cover-print:hover{box-shadow:0 10px 26px -10px rgba(124,156,255,.7);}
.rz-cover-close{width:38px; height:38px; border-radius:10px; background:rgba(255,255,255,0.08); border:1px solid var(--line2); color:var(--text); font-size:22px; line-height:1; cursor:pointer;}
.rz-cover-close:hover{border-color:var(--cool);}
.rz-cover-paper{background:#fff; color:#1a1a1a; border-radius:8px; padding:56px 60px; box-shadow:0 30px 80px -20px rgba(0,0,0,.7); font-family:'Cambria','Georgia',serif; line-height:1.6;}
.rz-cover-head{margin-bottom:26px; padding-bottom:18px; border-bottom:1px solid #e6e6e6;}
.rz-cover-name{font-size:24px; font-weight:700; margin:0; color:#111;}
.rz-cover-contact{font-size:12.5px; color:#555; margin:6px 0 0; font-family:'Calibri','Arial',sans-serif;}
.rz-cover-greet{font-size:15px; margin:0 0 16px; color:#1a1a1a;}
.rz-cover-p{font-size:14.5px; margin:0 0 14px; color:#222;}
.rz-cover-signoff{font-size:14.5px; margin:22px 0 0; color:#1a1a1a; line-height:1.8;}
@media(max-width:560px){ .rz-cover-paper{padding:34px 24px;} }
.rz-resume{position:fixed; inset:0; z-index:1000; display:flex; align-items:flex-start; justify-content:center; overflow-y:auto; padding:40px 16px;}
.rz-resume-backdrop{position:fixed; inset:0; background:rgba(6,8,12,0.78); -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);}
.rz-resume-sheet{position:relative; z-index:1; width:100%; max-width:820px; margin:auto 0; animation:rzUp .4s ease both;}
.rz-resume-actions{display:flex; justify-content:flex-end; gap:10px; align-items:center; margin-bottom:12px;}
.rz-resume-print{display:inline-flex; align-items:center; gap:8px; background:linear-gradient(90deg,var(--cool),#9DB2FF); color:#0E1118; border:none; border-radius:10px; padding:10px 18px; font-family:var(--sans); font-size:14px; font-weight:700; cursor:pointer; transition:box-shadow .15s;}
.rz-resume-print:hover{box-shadow:0 10px 26px -10px rgba(124,156,255,.7);}
.rz-resume-close{width:38px; height:38px; border-radius:10px; background:rgba(255,255,255,0.08); border:1px solid var(--line2); color:var(--text); font-size:22px; line-height:1; cursor:pointer;}
.rz-resume-close:hover{border-color:var(--cool);}
.rz-resume-paper{background:#fff; color:#222; border-radius:8px; padding:48px 52px; box-shadow:0 30px 80px -20px rgba(0,0,0,.7); font-family:'Calibri','Segoe UI','Arial',sans-serif; line-height:1.5;}
.rz-rp-head{padding-bottom:16px; border-bottom:2.5px solid #15294d;}
.rz-rp-name{font-size:30px; font-weight:800; margin:0; color:#15294d; letter-spacing:-.01em; line-height:1;}
.rz-rp-title{font-size:12.5px; font-weight:700; color:#2b5fa5; margin:8px 0 0; text-transform:uppercase; letter-spacing:.16em;}
.rz-rp-contact{font-size:11.5px; color:#555; margin:11px 0 0; letter-spacing:.01em;}
.rz-rp-stats{display:grid; grid-template-columns:repeat(4,1fr); margin:16px 0 4px; border:1px solid #e2e7ef; border-radius:8px; overflow:hidden; background:#f7f9fc;}
.rz-rp-stat{padding:11px 8px; text-align:center; border-right:1px solid #e2e7ef;}
.rz-rp-stat:last-child{border-right:none;}
.rz-rp-statval{display:block; font-size:19px; font-weight:800; color:#2b5fa5; line-height:1;}
.rz-rp-statlabel{display:block; font-size:9px; color:#6a7484; text-transform:uppercase; letter-spacing:.07em; margin-top:5px;}
.rz-rp-section{margin-top:20px;}
.rz-rp-h{font-size:11.5px; font-weight:800; color:#15294d; text-transform:uppercase; letter-spacing:.13em; margin:0 0 11px; padding-bottom:6px; border-bottom:1.5px solid #15294d;}
.rz-rp-summary{font-size:12.5px; color:#333; margin:0; line-height:1.6;}
.rz-rp-exp{display:grid; grid-template-columns:repeat(3,1fr); gap:16px;}
.rz-rp-expgroup{font-size:11px; font-weight:800; color:#2b5fa5; margin:0 0 6px; text-transform:uppercase; letter-spacing:.05em;}
.rz-rp-explist{margin:0; padding:0; list-style:none;}
.rz-rp-explist li{font-size:11.5px; color:#333; padding:2.5px 0 2.5px 12px; position:relative; line-height:1.35;}
.rz-rp-explist li::before{content:""; position:absolute; left:0; top:9px; width:4px; height:4px; border-radius:50%; background:#2b5fa5;}
.rz-rp-job{margin-bottom:14px; break-inside:avoid;}
.rz-rp-jobhead{display:flex; justify-content:space-between; align-items:baseline; gap:12px;}
.rz-rp-role{font-size:14px; font-weight:800; color:#15294d;}
.rz-rp-period{font-size:11.5px; color:#555; white-space:nowrap; font-weight:700;}
.rz-rp-co{font-size:12px; font-weight:700; color:#2b5fa5; margin:3px 0 7px;}
.rz-rp-bullets{margin:0; padding:0; list-style:none;}
.rz-rp-bullets li{font-size:12px; color:#333; margin-bottom:5px; line-height:1.5; padding-left:15px; position:relative;}
.rz-rp-bullets li::before{content:""; position:absolute; left:1px; top:6px; width:5px; height:5px; background:#2b5fa5; transform:rotate(45deg);}
.rz-rp-earlierrow,.rz-rp-edurow{display:flex; justify-content:space-between; gap:12px; padding:5px 0; font-size:12px; color:#333; border-bottom:1px solid #eef1f6;}
.rz-rp-earlierrow:last-child,.rz-rp-edurow:last-child{border-bottom:none;}
.rz-rp-school{font-weight:800; color:#15294d;}
.rz-rp-cred{color:#555;}
@media(max-width:560px){ .rz-resume-paper{padding:30px 22px;} .rz-rp-stats{grid-template-columns:repeat(2,1fr);} .rz-rp-stat:nth-child(2n){border-right:none;} .rz-rp-exp{grid-template-columns:1fr;} .rz-rp-jobhead{flex-direction:column; gap:1px; align-items:flex-start;} }

.rz-gauge-needle{transition:transform .5s cubic-bezier(.2,.8,.2,1);}
.rz-mpt-delta{display:inline-block; margin-top:9px; font-family:var(--mono); font-size:11px; font-weight:600; padding:3px 11px; border-radius:999px;}
.rz-mpt-delta.up{color:var(--mint); background:rgba(95,227,179,0.12);}
.rz-mpt-delta.down{color:#FFB47A; background:rgba(255,180,122,0.12);}
.rz-mpt{position:relative;}
.rz-mpt::before{content:""; position:absolute; inset:0; border-radius:18px; padding:1px; background:linear-gradient(130deg, rgba(124,156,255,.5), transparent 45%, rgba(255,195,107,.4)); -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; opacity:.55;}

.rz-an{position:relative; background:rgba(255,255,255,0.025); border:1px solid var(--line); border-radius:18px; padding:24px;}
.rz-an::before{content:""; position:absolute; inset:0; border-radius:18px; padding:1px; background:linear-gradient(130deg, rgba(124,156,255,.5), transparent 45%, rgba(255,195,107,.4)); -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; opacity:.55;}
.rz-an-tabs{display:flex; gap:6px; background:rgba(255,255,255,0.04); padding:4px; border-radius:12px; border:1px solid var(--line); margin-bottom:20px;}
.rz-an-tab{flex:1; font-family:var(--sans); font-size:13px; font-weight:550; color:var(--muted); background:transparent; border:none; border-radius:9px; padding:9px 8px; cursor:pointer; transition:background .15s,color .15s;}
.rz-an-tab.on{background:linear-gradient(180deg, rgba(124,156,255,0.20), rgba(124,156,255,0.07)); color:#fff;}
.rz-an-kpis{display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:18px;}
@media(max-width:520px){ .rz-an-kpis{grid-template-columns:1fr;} }
.rz-an-kpi{border:1px solid var(--line); border-radius:12px; padding:14px 15px; background:rgba(255,255,255,0.015);}
.rz-an-kpival{font-size:28px; font-weight:800; letter-spacing:-.02em; margin:0; line-height:1; background:linear-gradient(120deg,var(--cool),var(--warm)); -webkit-background-clip:text; background-clip:text; color:transparent;}
.rz-an-kpival.rz-an-good{background:linear-gradient(120deg,var(--mint),var(--cool)); -webkit-background-clip:text; background-clip:text;}
.rz-an-kpilabel{font-family:var(--mono); font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin:8px 0 0;}
.rz-an-kpidelta{font-family:var(--mono); font-size:10.5px; color:var(--mint); margin-top:6px; display:inline-block;}
.rz-an-charts{display:grid; grid-template-columns:1fr; gap:14px;}
@media(min-width:600px){ .rz-an-charts{grid-template-columns:1fr 1fr;} }
.rz-an-card{border:1px solid var(--line); border-radius:14px; padding:16px; background:rgba(255,255,255,0.015);}
.rz-an-card.wide{grid-column:1 / -1;}
.rz-an-cardtitle{font-size:13.5px; font-weight:650; color:var(--text); margin:0 0 14px;}
.rz-an-cardcap{font-family:var(--mono); font-size:10px; color:var(--dim); margin:12px 0 0; line-height:1.4;}
.rz-an-spark{width:100%; height:80px; display:block;}
.rz-an-bars{display:grid; gap:9px;}
.rz-an-barrow{display:grid; grid-template-columns:90px 1fr 44px; align-items:center; gap:10px;}
.rz-an-barlabel{font-size:12px; color:var(--muted);}
.rz-an-bartrack{height:8px; border-radius:999px; background:rgba(255,255,255,0.06); overflow:hidden;}
.rz-an-barfill{display:block; height:100%; border-radius:999px;}
.rz-an-barval{font-family:var(--mono); font-size:12px; color:var(--text); text-align:right;}
.rz-an-stack{display:flex; height:36px; border-radius:8px; overflow:hidden; gap:2px;}
.rz-an-seg{display:flex; align-items:center; justify-content:center; min-width:0;}
.rz-an-seg span{font-family:var(--mono); font-size:11px; font-weight:700; color:#0E1118;}
.rz-an-legend{display:flex; flex-wrap:wrap; gap:14px; margin-top:11px;}
.rz-an-legend span{display:inline-flex; align-items:center; gap:6px; font-size:11px; color:var(--muted);}
.rz-an-legend i{width:10px; height:10px; border-radius:3px; display:inline-block;}
.rz-ss-controls{display:grid; gap:4px; margin-bottom:18px;}
.rz-ss-chart{width:100%; height:auto; display:block; margin-top:4px;}
.rz-ss-ax{fill:var(--dim); font-family:var(--mono); font-size:8px;}
.rz-ss-kpis{margin-top:14px;}
.rz-ss-note{font-size:13px; color:#B7BECD; margin:16px 0 0; line-height:1.55;}
.rz-ss-formula{margin-top:16px; padding:16px; border:1px solid var(--line); border-radius:12px; background:rgba(124,156,255,0.05);}
.rz-ss-formula-h{font-family:var(--mono); font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--cool); margin:0 0 8px;}
.rz-ss-formula-t{font-size:13.5px; color:#C2C9D6; margin:0 0 12px; line-height:1.55;}
.rz-ss-formula-c{font-family:var(--mono); font-size:13px; color:var(--text); margin:0; background:rgba(0,0,0,0.25); padding:10px 12px; border-radius:8px; overflow-x:auto;}

.rz-demos-grid{display:grid; grid-template-columns:1fr; gap:12px; margin-top:22px;}
@media(min-width:640px){ .rz-demos-grid{grid-template-columns:1fr 1fr;} }
.rz-demos-item{position:relative; border:1px solid var(--line); border-radius:14px; padding:16px 17px 16px 19px; background:rgba(255,255,255,0.015); display:flex; flex-direction:column; gap:7px; overflow:hidden;}
.rz-demos-item::before{content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,var(--cool),var(--mint));}
.rz-demos-k{font-size:13.5px; font-weight:650; color:var(--text); letter-spacing:-.01em;}
.rz-demos-v{font-size:13px; color:var(--muted); line-height:1.5;}

.rz-mm-scroll{overflow-x:auto; margin-top:2px;}
.rz-mm-grid{display:grid; gap:6px; min-width:392px;}
.rz-mm-corner{font-family:var(--mono); font-size:9px; letter-spacing:.04em; color:var(--dim); display:flex; align-items:center; padding:6px 8px; text-transform:uppercase;}
.rz-mm-colh{font-family:var(--mono); font-size:10px; color:var(--cool); text-align:center; display:flex; align-items:center; justify-content:center; padding:8px 4px; background:rgba(124,156,255,0.09); border-radius:8px; letter-spacing:.02em;}
.rz-mm-rowh{font-size:11.5px; font-weight:650; color:var(--text); display:flex; align-items:center; padding:8px 10px; background:rgba(255,255,255,0.03); border-radius:8px;}
.rz-mm-cell{display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:11.5px; font-weight:600; color:var(--text); padding:13px 3px; border-radius:8px; border:1px solid var(--line); white-space:nowrap;}
.rz-aip-readout{font-size:12.5px; color:#B7BECD; margin:2px 0 4px; padding:9px 12px; border:1px solid var(--line); border-radius:10px; background:rgba(124,156,255,0.05);}
.rz-aip-readout b{color:var(--text); font-weight:700;}
.rz-mm-controls{display:grid; grid-template-columns:1fr; gap:14px 24px; margin-bottom:16px;}
@media(min-width:560px){ .rz-mm-controls{grid-template-columns:1fr 1fr;} }
.rz-mm-scalecell{display:flex; flex-direction:column; justify-content:center;}
.rz-mm-scalecell .rz-game-q{margin:0 0 8px;}

/* ===== type-scale alignment + flare ===== */
.rz-h2{font-size:11px; letter-spacing:.2em; margin:0 0 16px; gap:8px;}
.rz-game-eyebrow,.rz-fit-eyebrow,.rz-manifesto-eyebrow{margin:0 0 14px;}
.rz-game-title{font-size:clamp(22px,3.1vw,30px); font-weight:760; line-height:1.15; margin:0 0 10px;}
.rz-fit-title{font-weight:760; color:var(--text);}
.rz-sig-headline{font-weight:760;}
.rz-game-intro{font-size:14.5px; color:#B7BECD; line-height:1.55; max-width:62ch;}
.rz-fit-lead{color:#B7BECD; max-width:62ch;}
.rz-sig-detail{font-size:14.5px; color:#B7BECD; line-height:1.55;}
.rz-section{position:relative;}
.rz-section::before{content:""; position:absolute; top:-1px; left:0; width:46px; height:2px; background:linear-gradient(90deg,var(--cool),var(--mint)); border-radius:0 0 2px 0; box-shadow:0 0 14px rgba(124,156,255,.45);}
.rz-an-card,.rz-demos-item{transition:transform .18s ease, border-color .18s ease, box-shadow .18s ease;}
.rz-an-card:hover,.rz-demos-item:hover,.rz-case:hover{transform:translateY(-2px); border-color:rgba(124,156,255,0.35); box-shadow:0 14px 34px -18px rgba(124,156,255,0.55);}

/* mobile hardening: stop horizontal overflow on phones */
.rz{ overflow-wrap:break-word; }
.rz a,.rz-cover-contact,.rz-rp-contact{ overflow-wrap:anywhere; }
@media(max-width:919px){
  html,body,.rz{ overflow-x:hidden; }
  .rz-wrap,.rz-doc{ max-width:100%; min-width:0; }
}
@media(max-width:400px){
  .rz-doc{ padding-left:18px; padding-right:18px; }
}

@media print{
  .rz-section::before{display:none !important;}
  .rz{background:#fff !important; color:#111 !important;}
  .rz--cover .rz-wrap{display:none !important;}
  .rz--cover .rz-cover{position:static; display:block; padding:0; overflow:visible;}
  .rz--cover .rz-cover-backdrop,.rz--cover .rz-cover-actions{display:none !important;}
  .rz--cover .rz-cover-sheet{max-width:none; margin:0; animation:none;}
  .rz--cover .rz-cover-paper{box-shadow:none; border-radius:0; padding:0; max-width:none; color:#111 !important;}
  .rz--cover .rz-cover-name,.rz--cover .rz-cover-greet,.rz--cover .rz-cover-p,.rz--cover .rz-cover-signoff{color:#111 !important;}
  .rz--resume .rz-wrap{display:none !important;}
  .rz--resume .rz-resume{position:static; display:block; padding:0; overflow:visible;}
  .rz--resume .rz-resume-backdrop,.rz--resume .rz-resume-actions{display:none !important;}
  .rz--resume .rz-resume-sheet{max-width:none; margin:0; animation:none;}
  .rz--resume .rz-resume-paper{box-shadow:none; border-radius:0; padding:0; max-width:none; color:#111 !important;}
  .rz::before,.rz::after,.rz-signature::before{display:none !important;}
  .rz-wrap{grid-template-columns:1fr !important; display:block; max-width:none;}
  .rz-agent,.rz-download,.rz-fit,.rz-game,.rz-mpt-section,.rz-trends-section,.rz-arch-section,.rz-an-section,.rz-demos,.rz-manifesto,.rz-mm-section,.rz-aip-section{display:none !important;}
  .rz-doc{padding:0 !important;}
  .rz-doc>*{animation:none !important; opacity:1 !important; transform:none !important;}
  .rz-signature,.rz-looking{background:#fff !important; border-color:#ddd !important;}
  .rz-name,.rz-metric-val{color:#111 !important; -webkit-text-fill-color:#111 !important; background:none !important;}
  .rz-name,.rz-title,.rz-tagline,.rz-body,.rz-role,.rz-company,.rz-points li,.rz-sig-headline,.rz-sig-detail,.rz-case-title,.rz-case-summary,.rz-skilllabel,.rz-edu,.rz-looking-text,.rz-highlights li,.rz-earlier-row{color:#111 !important;}
  .rz-period,.rz-eyebrow,.rz-h2,.rz-case-tag,.rz-metric-label,.rz-looking-label,.rz-company{color:#555 !important;}
  .rz-tick,.rz-points li::before,.rz-h2::before,.rz-eyebrow::before{background:#999 !important; box-shadow:none !important;}
  .rz-section,.rz-job,.rz-looking,.rz-signature,.rz-case{break-inside:avoid; border-color:#ddd !important;}
  a{color:inherit !important; text-decoration:none;}
  @page{margin:14mm;}
}
`;
