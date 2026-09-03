/* eslint-disable no-console */
/**
 * Seed rich demo data for alex@timetoprogram.com / Test@1234
 *
 *   node scripts/seed.js
 *
 * Creates 4 resumes with multiple versions and analyses so the dashboard,
 * insights, versions, and history pages all have real data to render.
 *
 * Safe to re-run: clears the demo user's existing data before reseeding.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const { connectDB } = require("../src/config/db");
const User = require("../src/models/User");
const Resume = require("../src/models/Resume");
const ResumeVersion = require("../src/models/ResumeVersion");
const Analysis = require("../src/models/Analysis");

const DEMO = {
  email: "alex@timetoprogram.com",
  password: "Test@1234",
  name: "Alex Chen",
};

const MODEL = "gemini-2.5-flash";

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function buildRawText(p) {
  const lines = [];
  if (p.basics?.name) lines.push(p.basics.name);
  if (p.basics?.title) lines.push(p.basics.title);
  const contact = [p.basics?.location, p.basics?.email, p.basics?.phone].filter(Boolean);
  if (contact.length) lines.push(contact.join(" · "));
  for (const l of p.basics?.links || []) lines.push(`${l.label}: ${l.url}`);
  lines.push("");
  if (p.summary) {
    lines.push("PROFESSIONAL SUMMARY", p.summary, "");
  }
  if (p.experience?.length) {
    lines.push("EXPERIENCE");
    for (const e of p.experience) {
      lines.push(`${e.role}  —  ${e.company}  ·  ${e.period}`);
      if (e.location) lines.push(e.location);
      for (const b of e.bullets || []) lines.push(`• ${b}`);
      lines.push("");
    }
  }
  if (p.projects?.length) {
    lines.push("PROJECTS");
    for (const pr of p.projects) {
      lines.push(`${pr.name}${pr.tech?.length ? "  ·  " + pr.tech.join(" / ") : ""}`);
      if (pr.description) lines.push(pr.description);
      for (const l of pr.links || []) lines.push(`${l.label}: ${l.url}`);
      lines.push("");
    }
  }
  if (p.education?.length) {
    lines.push("EDUCATION");
    for (const ed of p.education) {
      lines.push(`${ed.degree}  —  ${ed.school}  ·  ${ed.period}`);
      if (ed.details) lines.push(ed.details);
      lines.push("");
    }
  }
  if (p.skills?.length) lines.push("SKILLS", p.skills.join(" · "), "");
  if (p.certifications?.length) {
    lines.push("CERTIFICATIONS");
    for (const c of p.certifications) {
      const meta = [c.issuer, c.year].filter(Boolean).join(" · ");
      lines.push(`${c.name}${meta ? "  —  " + meta : ""}`);
    }
    lines.push("");
  }
  if (p.languages?.length) lines.push("LANGUAGES", p.languages.join(" · "), "");
  if (p.interests?.length) lines.push("INTERESTS", p.interests.join(" · "));
  return lines.join("\n");
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Shared contact info                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

const BASICS_FE = {
  name: "Alex Chen",
  title: "Senior Frontend Engineer",
  location: "San Francisco, CA",
  email: "alex@timetoprogram.com",
  phone: "+1 (415) 555-0192",
  links: [
    { label: "LinkedIn", url: "https://linkedin.com/in/alexchen" },
    { label: "GitHub", url: "https://github.com/alexchen" },
    { label: "Portfolio", url: "https://alexchen.dev" },
  ],
};

const EDU = [
  {
    degree: "B.S. Computer Science",
    school: "University of California, Berkeley",
    location: "Berkeley, CA",
    period: "Sep 2016 - May 2020",
    details: "Magna Cum Laude · GPA 3.79 · CS Honors Society",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Resume 1 — Senior Frontend Engineer (3 versions: 58 → 74 → 86)             */
/* ────────────────────────────────────────────────────────────────────────── */

const FE_V1_PARSED = {
  basics: BASICS_FE,
  summary:
    "Software engineer with 7 years experience building web applications. Worked at multiple startups and big tech companies.",
  experience: [
    {
      company: "Stripe",
      role: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      period: "Mar 2023 - Present",
      bullets: [
        "Worked on the dashboard team to build new features.",
        "Helped migrate the codebase to React 19.",
        "Mentored junior engineers and reviewed pull requests.",
        "Collaborated with designers on UI improvements.",
      ],
    },
    {
      company: "Vercel",
      role: "Frontend Engineer",
      location: "Remote",
      period: "Jun 2020 - Feb 2023",
      bullets: [
        "Built features for the Next.js framework.",
        "Worked on the marketing website.",
        "Participated in on-call rotation.",
      ],
    },
    {
      company: "DoorDash",
      role: "Software Engineer Intern",
      location: "San Francisco, CA",
      period: "May 2019 - Aug 2019",
      bullets: [
        "Worked on the merchant portal.",
        "Wrote unit tests for existing modules.",
      ],
    },
  ],
  education: EDU,
  skills: ["JavaScript", "React", "TypeScript", "HTML", "CSS", "Git", "Node.js"],
  projects: [
    {
      name: "Personal Portfolio",
      description: "Built my portfolio website with React and Tailwind.",
      tech: ["React", "Tailwind"],
      links: [{ label: "Live", url: "https://alexchen.dev" }],
    },
    {
      name: "Recipe Sharing App",
      description: "A side project for sharing recipes with friends.",
      tech: ["Next.js", "Postgres"],
      links: [],
    },
  ],
  certifications: [],
  languages: ["English", "Mandarin"],
  interests: ["Photography", "Cycling", "Coffee"],
};

const FE_V2_PARSED = {
  ...FE_V1_PARSED,
  summary:
    "Senior Frontend Engineer with 7 years experience shipping production React applications at scale. Specialize in performance optimization, design systems, and TypeScript architecture. Mentored teams of 4-8 engineers across high-growth startups.",
  experience: [
    {
      ...FE_V1_PARSED.experience[0],
      bullets: [
        "Led migration of 240k LOC dashboard from CRA to Next.js App Router, reducing initial JS bundle by 42% and improving TTI by 38%.",
        "Architected and shipped internal design system adopted by 12 product teams, replacing 3 fragmented component libraries.",
        "Mentored 4 mid-level engineers; 3 promoted to senior within 18 months.",
        "Drove accessibility audit that lifted WCAG AA compliance from 71% to 96% across 50+ surfaces.",
      ],
    },
    {
      ...FE_V1_PARSED.experience[1],
      bullets: [
        "Shipped 8 major features for Next.js (App Router, Server Actions docs, Edge runtime examples) used by 200k+ developers.",
        "Cut marketing site bundle from 412KB to 198KB via code splitting and dynamic imports, lifting LCP from 3.2s to 1.4s.",
        "Owned on-call rotation for marketing.vercel.com; reduced incident count 60% YoY.",
      ],
    },
    {
      ...FE_V1_PARSED.experience[2],
      bullets: [
        "Shipped merchant analytics dashboard used by 8,000+ restaurants for daily sales tracking.",
        "Raised test coverage on order-flow module from 31% to 78% with 120+ unit and integration tests.",
      ],
    },
  ],
  skills: [
    "TypeScript", "React", "Next.js", "Node.js", "GraphQL", "Tailwind CSS",
    "Vitest", "Playwright", "Storybook", "Vite", "Web Vitals",
    "Design Systems", "Accessibility (WCAG)", "Performance Optimization",
  ],
};

const FE_V3_PARSED = {
  ...FE_V2_PARSED,
  basics: { ...BASICS_FE, title: "Senior Frontend Engineer · Design Systems & Performance" },
  summary:
    "Senior Frontend Engineer with 7+ years shipping React applications at scale to millions of users. Deep expertise in performance optimization, design systems, and TypeScript architecture. Track record of leading platform migrations and mentoring high-performing teams at Stripe and Vercel.",
  skills: [
    ...FE_V2_PARSED.skills,
    "React Server Components", "Edge Runtime", "Observability", "OpenTelemetry",
  ],
  certifications: [
    { name: "AWS Certified Solutions Architect — Associate", issuer: "Amazon Web Services", year: "2024" },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Resume 2 — Full Stack Engineer (2 versions: 64 → 79)                       */
/* ────────────────────────────────────────────────────────────────────────── */

const FS_BASICS = { ...BASICS_FE, title: "Full Stack Engineer" };

const FS_V1_PARSED = {
  basics: FS_BASICS,
  summary:
    "Full stack engineer building products across React frontends and Node backends. Comfortable working with databases, APIs, and cloud infra.",
  experience: [
    {
      company: "Stripe",
      role: "Senior Engineer",
      location: "San Francisco, CA",
      period: "Mar 2023 - Present",
      bullets: [
        "Built end-to-end features touching React frontend and Node services.",
        "Worked with Postgres and Redis to support new dashboard views.",
        "Wrote integration tests and ran data migrations.",
      ],
    },
    {
      company: "Vercel",
      role: "Software Engineer",
      location: "Remote",
      period: "Jun 2020 - Feb 2023",
      bullets: [
        "Worked on internal tools and CLI commands.",
        "Helped maintain the deployment infrastructure.",
        "Wrote technical docs for new features.",
      ],
    },
  ],
  education: EDU,
  skills: [
    "TypeScript", "React", "Node.js", "Postgres", "Redis", "Docker", "AWS",
  ],
  projects: [
    {
      name: "Cookbook",
      description: "Recipe app with real-time collaborative editing.",
      tech: ["Next.js", "tRPC", "Postgres"],
      links: [{ label: "Code", url: "https://github.com/alexchen/cookbook" }],
    },
  ],
  certifications: [],
  languages: ["English", "Mandarin"],
  interests: ["Photography", "Cycling"],
};

const FS_V2_PARSED = {
  ...FS_V1_PARSED,
  summary:
    "Full stack engineer with 7 years experience shipping end-to-end features at Stripe and Vercel. Expertise spans React/TypeScript frontends, Node/Postgres services, and cloud infra (AWS, Docker). Comfortable owning a feature from RFC through monitoring.",
  experience: [
    {
      ...FS_V1_PARSED.experience[0],
      bullets: [
        "Owned end-to-end ledger reconciliation feature: React UI, Node service, Postgres schema; processed $42M/day at p99 latency of 180ms.",
        "Designed Postgres schema and Redis cache tier supporting 18k QPS for the merchant dashboard with zero downtime migration.",
        "Authored RFC and led rollout of feature-flag system used by 14 engineering teams to ship safely.",
      ],
    },
    {
      ...FS_V1_PARSED.experience[1],
      bullets: [
        "Built `vercel logs` CLI command used by 30k+ developers monthly for log streaming and filtering.",
        "Maintained Kubernetes deployment pipelines; cut average deploy time from 11min to 4min.",
        "Authored 14 RFCs and 22 docs across the platform team, adopted by 6 surrounding teams.",
      ],
    },
  ],
  skills: [
    "TypeScript", "React", "Node.js", "Postgres", "Redis", "Docker", "Kubernetes",
    "AWS", "GraphQL", "tRPC", "OpenTelemetry", "Terraform", "CI/CD",
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Resume 3 — Engineering Manager (2 versions: 71 → 83)                       */
/* ────────────────────────────────────────────────────────────────────────── */

const EM_BASICS = { ...BASICS_FE, title: "Engineering Manager" };

const EM_V1_PARSED = {
  basics: EM_BASICS,
  summary:
    "Engineering manager and tech lead with experience growing teams and shipping products at scale.",
  experience: [
    {
      company: "Stripe",
      role: "Engineering Manager",
      location: "San Francisco, CA",
      period: "Aug 2024 - Present",
      bullets: [
        "Manage a team of frontend engineers.",
        "Run weekly 1:1s and quarterly reviews.",
        "Helped plan the team roadmap.",
      ],
    },
    {
      company: "Stripe",
      role: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      period: "Mar 2023 - Aug 2024",
      bullets: [
        "Led the dashboard migration to App Router.",
        "Mentored junior engineers.",
        "Worked with design and PM partners.",
      ],
    },
    {
      company: "Vercel",
      role: "Frontend Engineer",
      location: "Remote",
      period: "Jun 2020 - Feb 2023",
      bullets: [
        "Shipped features for Next.js framework.",
        "Worked on the marketing website performance.",
      ],
    },
  ],
  education: EDU,
  skills: [
    "Team Leadership", "Engineering Management", "Mentoring", "Roadmapping",
    "React", "TypeScript", "Node.js",
  ],
  projects: [],
  certifications: [],
  languages: ["English", "Mandarin"],
  interests: ["Photography", "Cycling", "Coffee"],
};

const EM_V2_PARSED = {
  ...EM_V1_PARSED,
  summary:
    "Engineering Manager building high-performing product teams. Promoted from IC at Stripe after leading a 240k-LOC platform migration. Hire, coach, and ship — currently manage a team of 8 frontend engineers driving Stripe Dashboard's product velocity.",
  experience: [
    {
      ...EM_V1_PARSED.experience[0],
      bullets: [
        "Built and lead a team of 8 frontend engineers shipping for Stripe Dashboard; team velocity +28% QoQ over 3 quarters.",
        "Hired 4 mid/senior engineers across two quarters with a 92% offer-accept rate; reduced time-to-hire from 41 to 23 days.",
        "Drove quarterly roadmap planning across 3 product partners; shipped 9 of 11 committed features on schedule.",
        "Coached 2 engineers to senior promotion and 1 to staff promotion within 14 months.",
      ],
    },
    {
      ...EM_V1_PARSED.experience[1],
      bullets: [
        "Led migration of 240k LOC dashboard from CRA to Next.js App Router, reducing initial JS bundle by 42% and improving TTI by 38%.",
        "Mentored 4 mid-level engineers; 3 promoted within 18 months.",
        "Owned design-system rollout adopted by 12 product teams.",
      ],
    },
    {
      ...EM_V1_PARSED.experience[2],
      bullets: [
        "Shipped 8 major features for Next.js used by 200k+ developers.",
        "Cut marketing site LCP from 3.2s to 1.4s through aggressive code splitting.",
      ],
    },
  ],
  skills: [
    "People Management", "Team Building", "Hiring & Recruiting", "Roadmapping",
    "1:1 Coaching", "Performance Reviews", "Cross-functional Leadership",
    "React", "TypeScript", "System Design", "RFCs",
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Resume 4 — Startup Founder (1 version, not yet analyzed)                   */
/* ────────────────────────────────────────────────────────────────────────── */

const FOUNDER_PARSED = {
  basics: { ...BASICS_FE, title: "Co-founder & CTO" },
  summary:
    "Engineer turned founder. Currently building a developer tools startup. Looking to apply technical depth + product instinct to a leadership role at a fast-growing company.",
  experience: [
    {
      company: "Pixel Labs (Y Combinator W25)",
      role: "Co-founder & CTO",
      location: "San Francisco, CA",
      period: "Jan 2025 - Present",
      bullets: [
        "Co-founded AI dev tools startup; admitted to YC W25 batch.",
        "Built the v1 product (Next.js + Node + Postgres) and shipped to first 200 paying customers.",
        "Hired first 2 engineers and set initial eng culture / hiring bar.",
      ],
    },
    {
      company: "Stripe",
      role: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      period: "Mar 2023 - Dec 2024",
      bullets: [
        "Led dashboard migration to Next.js App Router.",
        "Built design system used by 12 product teams.",
        "Mentored 4 engineers, 3 promoted to senior.",
      ],
    },
  ],
  education: EDU,
  skills: ["Product", "TypeScript", "React", "Next.js", "Node.js", "Postgres", "Fundraising"],
  projects: [],
  certifications: [],
  languages: ["English", "Mandarin"],
  interests: ["Long-form writing", "Cycling"],
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Analyses                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const FE_V1_ANALYSIS = {
  atsScore: 58,
  scoreBreakdown: { keywords: 12, formatting: 17, impact: 12, clarity: 17 },
  summary:
    "Solid foundation and strong companies on the resume, but the bullets read like a job description rather than a record of impact. The biggest unlock is rewriting bullets with metrics and adding senior-frontend keywords like Next.js, Server Components, and Web Vitals.",
  issues: [
    { title: "Vague bullet language", severity: "high", explanation: "Most bullets begin with 'Worked on', 'Helped with', or 'Collaborated'. ATS and recruiters look for ownership verbs.", fix: "Open every bullet with an active ownership verb (Led, Architected, Shipped, Drove) and a specific scope." },
    { title: "Missing role-critical keywords", severity: "high", explanation: "Resume mentions React but not Next.js, Server Components, Web Vitals, or Tailwind — all expected for a senior frontend role in 2026.", fix: "Add the missing keywords organically where they belong (skills + bullets), not as a stuff list." },
    { title: "No quantified achievements", severity: "high", explanation: "Bullets describe activities but not impact. Out of 9 bullets, only 0 contain a number.", fix: "Add at least one metric per bullet — % saved, ms reduced, users reached, $ moved, team size led." },
    { title: "Generic professional summary", severity: "medium", explanation: "Summary doesn't communicate what makes you specifically valuable — could describe any 7-year engineer.", fix: "Anchor your summary in 2-3 specific strengths (e.g. performance, design systems) and a recent quantified win." },
    { title: "Skills section underweight for senior role", severity: "medium", explanation: "Only 7 skills listed; missing modern frontend stack signals.", fix: "Expand to 14-18 skills covering frameworks, testing, infra, and observability." },
  ],
  strengths: [
    { title: "Strong upward career trajectory", evidence: "Intern → Vercel → Stripe in 5 years is a textbook senior path." },
    { title: "Top-tier education signal", evidence: "UC Berkeley CS is well-recognized by ATS keyword filters." },
    { title: "Side projects show initiative", evidence: "Portfolio + Recipe Sharing App demonstrate building beyond work." },
    { title: "Industry-standard tools present", evidence: "React, TypeScript, Git all explicitly listed." },
    { title: "Complete contact + links", evidence: "LinkedIn, GitHub, and Portfolio all present — recruiters can verify quickly." },
  ],
  bulletRewrites: [
    { section: "experience", original: "Worked on the dashboard team to build new features.", rewritten: "Led migration of 240k LOC dashboard from CRA to Next.js App Router, reducing initial JS bundle by 42% and improving TTI by 38%.", rationale: "Specific scope (LOC), ownership verb, and two concrete metrics." },
    { section: "experience", original: "Helped migrate the codebase to React 19.", rewritten: "Architected and shipped internal design system adopted by 12 product teams, replacing 3 fragmented component libraries.", rationale: "Adoption metric proves cross-team impact." },
    { section: "experience", original: "Mentored junior engineers and reviewed pull requests.", rewritten: "Mentored 4 mid-level engineers; 3 promoted to senior within 18 months.", rationale: "Quantifies people-development outcomes." },
    { section: "experience", original: "Built features for the Next.js framework.", rewritten: "Shipped 8 major features for Next.js (App Router, Server Actions docs, Edge runtime examples) used by 200k+ developers.", rationale: "Names features and shows reach." },
    { section: "experience", original: "Worked on the marketing website.", rewritten: "Cut marketing site bundle from 412KB to 198KB via code splitting and dynamic imports, lifting LCP from 3.2s to 1.4s.", rationale: "Before/after metrics make the win undeniable." },
    { section: "experience", original: "Wrote unit tests for existing modules.", rewritten: "Raised test coverage on order-flow module from 31% to 78% with 120+ unit and integration tests.", rationale: "Specific coverage delta + test count." },
    { section: "experience", original: "Worked on the merchant portal.", rewritten: "Shipped merchant analytics dashboard used by 8,000+ restaurants for daily sales tracking.", rationale: "Adds scale (users) and product specificity." },
  ],
  keywordsPresent: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Git", "Node.js"],
  keywordsMissing: [
    "Next.js", "GraphQL", "Tailwind CSS", "Web Vitals", "Performance Optimization",
    "Design Systems", "Accessibility (WCAG)", "Testing", "CI/CD", "Server Components",
  ],
  model: MODEL,
  promptTokens: 2100,
  responseTokens: 1280,
};

const FE_V2_ANALYSIS = {
  atsScore: 74,
  scoreBreakdown: { keywords: 19, formatting: 18, impact: 19, clarity: 18 },
  summary:
    "Major step up: bullets now read as impact rather than activity, and the skill block is dense enough to clear most ATS filters. Remaining work is sharpening the summary, surfacing platform-level wins (Server Components, observability), and adding a certification.",
  issues: [
    { title: "Summary still doesn't differentiate", severity: "medium", explanation: "Reads like any senior FE — no 'why hire you over the next applicant'.", fix: "Lead with a single specialty (e.g. 'design systems and performance at scale') and one trophy metric." },
    { title: "Missing modern platform keywords", severity: "medium", explanation: "No mention of React Server Components, Edge runtime, or observability tools — all expected at senior tier in 2026.", fix: "Where you've used them, name them; otherwise mention adjacent platform work." },
    { title: "No certifications listed", severity: "low", explanation: "Senior roles increasingly expect at least one industry cert (AWS, GCP, security).", fix: "Add any relevant certs you hold, or note in-progress ones." },
    { title: "Interest section reads generic", severity: "low", explanation: "Photography / Cycling / Coffee is fine but doesn't differentiate.", fix: "If keeping, make them specific (e.g. 'Landscape photography — published in X')." },
    { title: "Side projects could showcase newer tech", severity: "low", explanation: "Portfolio and Recipe app are solid but don't demonstrate Server Components / Edge / AI tooling.", fix: "Either modernize the project descriptions or add a small AI/RSC side project." },
  ],
  strengths: [
    { title: "Strong quantified impact across roles", evidence: "Every senior bullet now contains a metric (LOC, %, KB, users)." },
    { title: "Owned platform-level wins", evidence: "Bundle reduction (412→198KB) and TTI improvement (3.2s→1.4s) read as platform engineering." },
    { title: "Cross-functional adoption stories", evidence: "Design system 'adopted by 12 product teams' shows influence across the org." },
    { title: "Mentorship outcomes quantified", evidence: "'3 promoted within 18 months' converts vague mentoring into measurable impact." },
    { title: "Specific frameworks and tooling listed", evidence: "Vitest, Playwright, Storybook, Vite, Web Vitals all flagged for ATS." },
  ],
  bulletRewrites: [
    { section: "summary", original: "Senior Frontend Engineer with 7 years experience shipping production React applications at scale.", rewritten: "Senior Frontend Engineer focused on design systems and performance — shipped a 42% bundle reduction across Stripe Dashboard's 240k LOC migration.", rationale: "Anchors the summary in a specialty and a trophy metric." },
    { section: "experience", original: "Owned on-call rotation for marketing.vercel.com; reduced incident count 60% YoY.", rewritten: "Owned on-call rotation for marketing.vercel.com; reduced p1 incident count 60% YoY by adding SLO-based alerting and runbook automation.", rationale: "Names the mechanism behind the win." },
    { section: "skills", original: "Design Systems", rewritten: "Design Systems (tokens, theming, CLI codegen)", rationale: "Adds depth signals next to the keyword." },
  ],
  keywordsPresent: [
    "TypeScript", "React", "Next.js", "Node.js", "GraphQL", "Tailwind CSS",
    "Vitest", "Playwright", "Storybook", "Vite", "Web Vitals",
    "Design Systems", "Accessibility (WCAG)", "Performance Optimization",
  ],
  keywordsMissing: [
    "React Server Components", "Edge Runtime", "Observability", "OpenTelemetry",
    "AWS Certified", "Kubernetes",
  ],
  model: MODEL,
  promptTokens: 2240,
  responseTokens: 1100,
};

const FE_V3_ANALYSIS = {
  atsScore: 86,
  scoreBreakdown: { keywords: 23, formatting: 19, impact: 22, clarity: 22 },
  summary:
    "Excellent — top decile for a senior frontend role. The summary now has a clear specialty, the skill block is dense without being a stuff-list, and you've added a recognized cert. The remaining 14 pts to perfect are largely cosmetic (cover-letter pairing, recruiter follow-through).",
  issues: [
    { title: "No leadership / cross-functional bullets in 2024+ roles", severity: "low", explanation: "Recent bullets are great IC work, but limit you to senior-IC ladders.", fix: "Add one bullet that names a cross-team initiative you drove (RFC, working group, hiring loop)." },
    { title: "Could quantify mentorship in absolute terms", severity: "low", explanation: "'3 promoted' is good; '3 of 4 mentees promoted' is better.", fix: "Add the denominator." },
    { title: "Sparse project section", severity: "low", explanation: "Only 2 projects listed; both predate Server Components era.", fix: "Add a small Server Components or AI-tooling side project to signal currency." },
    { title: "Education details could lead with honors", severity: "low", explanation: "Magna Cum Laude is buried mid-line.", fix: "Lead with honors then GPA." },
    { title: "Languages styled inconsistently", severity: "low", explanation: "'English (Native)' vs 'Mandarin (Fluent)' is fine, but consider CEFR levels for European recruiters.", fix: "Use either both descriptive or both leveled — consistency wins." },
  ],
  strengths: [
    { title: "Top-decile keyword density", evidence: "23/25 on keywords with no obvious stuff-list smell." },
    { title: "Specialty-anchored summary", evidence: "'Design systems and performance at scale' positions clearly for senior FE." },
    { title: "Strong scale signals", evidence: "240k LOC migration, 12 teams adopted design system, 200k+ developer reach." },
    { title: "Recognized certification present", evidence: "AWS SAA cert added in V3 — expected at senior level." },
    { title: "Clean formatting and parseable layout", evidence: "Section headers, periods, and metric placement all consistent." },
  ],
  bulletRewrites: [
    { section: "experience", original: "Mentored 4 mid-level engineers; 3 promoted to senior within 18 months.", rewritten: "Mentored 4 mid-level engineers across 18 months; 3 of 4 promoted to senior — highest mentor success rate in the org.", rationale: "Adds denominator and competitive context." },
    { section: "education", original: "Magna Cum Laude · GPA 3.79 · CS Honors Society", rewritten: "Magna Cum Laude, CS Honors Society · GPA 3.79", rationale: "Leads with the honor before the GPA." },
  ],
  keywordsPresent: [
    "TypeScript", "React", "Next.js", "Node.js", "GraphQL", "Tailwind CSS",
    "React Server Components", "Edge Runtime", "Observability", "OpenTelemetry",
    "Design Systems", "Accessibility (WCAG)", "Web Vitals",
    "Performance Optimization", "AWS Certified",
  ],
  keywordsMissing: ["Kubernetes", "gRPC"],
  model: MODEL,
  promptTokens: 2310,
  responseTokens: 980,
};

const FS_V1_ANALYSIS = {
  atsScore: 64,
  scoreBreakdown: { keywords: 16, formatting: 18, impact: 13, clarity: 17 },
  summary:
    "Good breadth signals (frontend + backend + infra) but bullets stay surface-level. Recruiters can't tell what you actually shipped vs. participated in. Convert at least one bullet per role into a system-level win with metrics.",
  issues: [
    { title: "Bullets describe activity, not ownership", severity: "high", explanation: "'Built end-to-end features', 'Wrote integration tests' — the work, not the impact.", fix: "Name the feature, the surface area, and the metric." },
    { title: "No traffic / scale signals", severity: "high", explanation: "Full stack roles are judged on the load and complexity you've handled.", fix: "Cite QPS, daily volume, $ processed, latency, or table sizes." },
    { title: "Missing modern backend keywords", severity: "medium", explanation: "GraphQL, tRPC, Kubernetes, OpenTelemetry not present.", fix: "Add where applicable in skills and bullets." },
    { title: "Summary doesn't claim a specialty", severity: "medium", explanation: "'Full stack' alone is generic — hiring managers want a flavor.", fix: "Pick one (payments, dev tools, real-time, infra) and lead with it." },
    { title: "Projects section thin", severity: "low", explanation: "Only one project listed for someone with 7 years of side-project potential.", fix: "Add 1-2 more demonstrating backend depth." },
  ],
  strengths: [
    { title: "Full-stack breadth", evidence: "React, Node, Postgres, Redis, Docker, AWS all listed." },
    { title: "Top employer signal", evidence: "Stripe + Vercel reads strongly to ATS and recruiters." },
    { title: "Project shows judgment", evidence: "tRPC + Drizzle stack signals modern type-safe choices." },
    { title: "Consistent recent industry experience", evidence: "Continuous role since 2020, no gaps." },
    { title: "Solid contact and links footprint", evidence: "LinkedIn, GitHub, Portfolio all live." },
  ],
  bulletRewrites: [
    { section: "experience", original: "Built end-to-end features touching React frontend and Node services.", rewritten: "Owned end-to-end ledger reconciliation feature: React UI, Node service, Postgres schema; processed $42M/day at p99 latency of 180ms.", rationale: "Names the feature, surface area, scale, and latency budget." },
    { section: "experience", original: "Worked with Postgres and Redis to support new dashboard views.", rewritten: "Designed Postgres schema and Redis cache tier supporting 18k QPS for the merchant dashboard with zero downtime migration.", rationale: "Cites QPS, gives a concrete platform achievement." },
    { section: "experience", original: "Wrote integration tests and ran data migrations.", rewritten: "Authored RFC and led rollout of feature-flag system used by 14 engineering teams to ship safely.", rationale: "Replaces a maintenance line with a leadership signal." },
    { section: "experience", original: "Worked on internal tools and CLI commands.", rewritten: "Built `vercel logs` CLI command used by 30k+ developers monthly for log streaming and filtering.", rationale: "Names product and reach." },
    { section: "experience", original: "Helped maintain the deployment infrastructure.", rewritten: "Maintained Kubernetes deployment pipelines; cut average deploy time from 11min to 4min.", rationale: "Quantifies the reliability + speed win." },
  ],
  keywordsPresent: ["TypeScript", "React", "Node.js", "Postgres", "Redis", "Docker", "AWS"],
  keywordsMissing: [
    "Kubernetes", "GraphQL", "tRPC", "OpenTelemetry", "Terraform", "CI/CD",
    "Distributed Systems", "Microservices",
  ],
  model: MODEL,
  promptTokens: 1980,
  responseTokens: 1140,
};

const FS_V2_ANALYSIS = {
  atsScore: 79,
  scoreBreakdown: { keywords: 21, formatting: 19, impact: 20, clarity: 19 },
  summary:
    "Strong rewrite — bullets now read as system-level wins with scale numbers, and the skill block hits all the modern backend signals. Remaining gap is showing leadership / RFC ownership at the senior level.",
  issues: [
    { title: "Limited cross-team leadership signal", severity: "medium", explanation: "Bullets prove you build things; less proof you align others around what to build.", fix: "Add one bullet per role for an RFC, working group, or hiring effort you led." },
    { title: "No SRE / on-call ownership claim", severity: "low", explanation: "Full stack engineers at senior+ usually own on-call for their service.", fix: "If applicable, add SLI/SLO ownership or on-call rotation specifics." },
    { title: "Project still only one entry", severity: "low", explanation: "Could showcase wider range.", fix: "Add a backend-heavy project or OSS contribution." },
  ],
  strengths: [
    { title: "Strong system metrics across roles", evidence: "$42M/day, 18k QPS, 30k+ users — clear scale ownership." },
    { title: "Backend keyword density on point", evidence: "tRPC, OpenTelemetry, Terraform, Kubernetes, GraphQL all present." },
    { title: "Specific product naming", evidence: "Ledger reconciliation, vercel logs CLI — recruiters can verify." },
    { title: "Authored RFCs and docs", evidence: "Leadership signal beyond IC code-shipping." },
    { title: "Pipeline / infra credibility", evidence: "Deploy time 11→4min is a concrete infra win." },
  ],
  bulletRewrites: [],
  keywordsPresent: [
    "TypeScript", "React", "Node.js", "Postgres", "Redis", "Docker", "Kubernetes",
    "AWS", "GraphQL", "tRPC", "OpenTelemetry", "Terraform", "CI/CD",
  ],
  keywordsMissing: ["Distributed Systems", "Microservices", "gRPC"],
  model: MODEL,
  promptTokens: 2080,
  responseTokens: 920,
};

const EM_V1_ANALYSIS = {
  atsScore: 71,
  scoreBreakdown: { keywords: 18, formatting: 18, impact: 16, clarity: 19 },
  summary:
    "Coverage of EM and senior-IC experience is here, but the bullets don't yet demonstrate the leadership outcomes hiring managers screen for: team growth, hiring throughput, roadmap delivery, promotions. Tightening these will move you up a tier fast.",
  issues: [
    { title: "Management bullets read generic", severity: "high", explanation: "'Run 1:1s', 'Run reviews' describe job functions, not outcomes.", fix: "Replace each with team-level outcome: growth, retention, velocity, promotions, hires." },
    { title: "Missing hiring impact", severity: "high", explanation: "No mention of hires made, time-to-hire, offer-accept rate.", fix: "Add at least one hiring metric per management role." },
    { title: "No team size or velocity claims", severity: "medium", explanation: "EM hiring managers screen for team-size + delivery rhythm.", fix: "Name your team size and a velocity/delivery metric." },
    { title: "Skills overlap with IC role", severity: "low", explanation: "Management-specific skills are listed but feel light.", fix: "Add: Performance Management, Calibration, Career Conversations, Hiring Pipelines, Sprint Planning." },
    { title: "Summary doesn't claim a managerial specialty", severity: "low", explanation: "Generic 'EM and tech lead'.", fix: "Anchor on team type (frontend, infra, platform) and a hiring/scaling story." },
  ],
  strengths: [
    { title: "Clean IC-to-EM progression", evidence: "Visible promotion at Stripe; recruiters love internal progression." },
    { title: "Recent senior IC track record stays visible", evidence: "Maintains technical credibility for hands-on EM roles." },
    { title: "Top-tier employer history", evidence: "Stripe + Vercel + Berkeley CS reads strong end-to-end." },
    { title: "Mentorship indicator", evidence: "'Mentored junior engineers' appears in IC role." },
    { title: "Standard contact + links present", evidence: "Recruiters can verify quickly." },
  ],
  bulletRewrites: [
    { section: "experience", original: "Manage a team of frontend engineers.", rewritten: "Built and lead a team of 8 frontend engineers shipping for Stripe Dashboard; team velocity +28% QoQ over 3 quarters.", rationale: "Adds team size, what they ship, and a velocity metric." },
    { section: "experience", original: "Run weekly 1:1s and quarterly reviews.", rewritten: "Hired 4 mid/senior engineers across two quarters with a 92% offer-accept rate; reduced time-to-hire from 41 to 23 days.", rationale: "Replaces a job-description bullet with a hiring outcome." },
    { section: "experience", original: "Helped plan the team roadmap.", rewritten: "Drove quarterly roadmap planning across 3 product partners; shipped 9 of 11 committed features on schedule.", rationale: "Quantifies delivery rate against commitments." },
    { section: "experience", original: "Mentored junior engineers.", rewritten: "Coached 2 engineers to senior promotion and 1 to staff promotion within 14 months.", rationale: "Promotions are the cleanest mentorship metric." },
    { section: "experience", original: "Worked on the marketing website performance.", rewritten: "Cut marketing site LCP from 3.2s to 1.4s through aggressive code splitting.", rationale: "Concrete performance win." },
  ],
  keywordsPresent: ["Team Leadership", "Mentoring", "React", "TypeScript", "Node.js", "Roadmapping"],
  keywordsMissing: [
    "Performance Management", "Hiring", "Career Coaching", "Calibration",
    "Cross-functional Leadership", "OKRs", "Sprint Planning", "Engineering Culture",
  ],
  model: MODEL,
  promptTokens: 1900,
  responseTokens: 1060,
};

const EM_V2_ANALYSIS = {
  atsScore: 83,
  scoreBreakdown: { keywords: 22, formatting: 19, impact: 21, clarity: 21 },
  summary:
    "Excellent — this version actually reads like an EM resume. Team size, hiring throughput, promotion outcomes, and quarterly delivery are all on-page. Remaining work is mostly cosmetic and adding 1 cross-functional / org-wide story.",
  issues: [
    { title: "No org-level / cross-functional bullet", severity: "low", explanation: "Strong team-level outcomes but no 'changed how the org operates' story.", fix: "Add one bullet on a cross-team initiative (eng-wide hiring loop, calibration process, etc.)." },
    { title: "Could add retention / attrition metric", severity: "low", explanation: "Hiring is covered; the flip side (kept the team together) isn't.", fix: "Add team retention % or voluntary attrition rate." },
  ],
  strengths: [
    { title: "Team size + velocity stated upfront", evidence: "'Team of 8 ... +28% QoQ' is the EM-equivalent of a trophy metric." },
    { title: "Hiring throughput quantified", evidence: "4 hires, 92% accept, 41→23 days TTH." },
    { title: "Promotion outcomes proven", evidence: "2 to senior, 1 to staff in 14 months." },
    { title: "Delivery rate against commitments", evidence: "9 of 11 features on schedule is unusually honest and credible." },
    { title: "Maintains technical credibility", evidence: "Senior IC migration bullet stays visible — important for hands-on EM roles." },
  ],
  bulletRewrites: [],
  keywordsPresent: [
    "People Management", "Team Building", "Hiring & Recruiting", "Roadmapping",
    "1:1 Coaching", "Performance Reviews", "Cross-functional Leadership",
    "React", "TypeScript", "System Design", "RFCs",
  ],
  keywordsMissing: ["OKRs", "Calibration", "Engineering Culture"],
  model: MODEL,
  promptTokens: 2010,
  responseTokens: 880,
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Master spec                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

const RESUMES = [
  {
    title: "Senior Frontend Engineer Resume",
    versions: [
      { sourceType: "upload", parsed: FE_V1_PARSED, analysis: FE_V1_ANALYSIS },
      { sourceType: "rewrite", parsed: FE_V2_PARSED, analysis: FE_V2_ANALYSIS },
      { sourceType: "rewrite", parsed: FE_V3_PARSED, analysis: FE_V3_ANALYSIS },
    ],
  },
  {
    title: "Full Stack Engineer Resume",
    versions: [
      { sourceType: "upload", parsed: FS_V1_PARSED, analysis: FS_V1_ANALYSIS },
      { sourceType: "rewrite", parsed: FS_V2_PARSED, analysis: FS_V2_ANALYSIS },
    ],
  },
  {
    title: "Engineering Manager Resume",
    versions: [
      { sourceType: "upload", parsed: EM_V1_PARSED, analysis: EM_V1_ANALYSIS },
      { sourceType: "rewrite", parsed: EM_V2_PARSED, analysis: EM_V2_ANALYSIS },
    ],
  },
  {
    title: "Startup Founder Resume",
    versions: [
      { sourceType: "upload", parsed: FOUNDER_PARSED, analysis: null },
    ],
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Run                                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

async function ensureUser() {
  const passwordHash = await User.hashPassword(DEMO.password);
  let user = await User.findOne({ email: DEMO.email });
  if (user) {
    user.name = DEMO.name;
    user.passwordHash = passwordHash;
    await user.save();
    console.log(`User ready: ${DEMO.email} (existing)`);
  } else {
    user = await User.create({
      name: DEMO.name,
      email: DEMO.email,
      passwordHash,
    });
    console.log(`User ready: ${DEMO.email} (created)`);
  }
  return user;
}

async function clearUserData(userId) {
  const resumeIds = await Resume.find({ userId }).distinct("_id");
  const [v, a, r] = await Promise.all([
    ResumeVersion.deleteMany({ resumeId: { $in: resumeIds } }),
    Analysis.deleteMany({ userId }),
    Resume.deleteMany({ userId }),
  ]);
  console.log(
    `Cleared: ${r.deletedCount} resumes, ${v.deletedCount} versions, ${a.deletedCount} analyses`
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Mongoose's `timestamps: true` auto-overrides any manual createdAt/updatedAt
// on save/create. We need to force-write them at the driver level after.
async function forceTimestamps(Model, id, createdAt, updatedAt) {
  await Model.collection.updateOne(
    { _id: id },
    { $set: { createdAt, updatedAt: updatedAt || createdAt } }
  );
}

async function seedResume(userId, spec, indexFromNewest) {
  // Stagger timestamps so the activity feed and trends look realistic.
  // indexFromNewest = 0 → most recent resume on the dashboard.
  // Spread of 5 days between resumes; first one 4 days old gives V3 (≈1.6d ago)
  // enough breathing room to never land in the future.
  const baseDaysAgo = 4 + indexFromNewest * 5;

  const resume = await Resume.create({
    userId,
    title: spec.title,
    latestVersionNumber: spec.versions.length,
  });

  let prevVersionId = null;
  let currentVersionId = null;
  let firstVersionAt = null;
  let lastVersionAt = null;

  for (let i = 0; i < spec.versions.length; i++) {
    const v = spec.versions[i];
    const parsed = v.parsed;
    const rawText = buildRawText(parsed);

    const versionAt = new Date(Date.now() - (baseDaysAgo - i * 1.2) * DAY_MS);
    if (i === 0) firstVersionAt = versionAt;
    lastVersionAt = versionAt;

    const version = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: i + 1,
      label: `V${i + 1}`,
      rawText,
      parsedSections: parsed,
      sourceType: v.sourceType,
      parentVersionId: prevVersionId,
    });

    if (v.analysis) {
      const analysisAt = new Date(versionAt.getTime() + 30 * 60 * 1000);
      const analysis = await Analysis.create({
        userId,
        resumeId: resume._id,
        versionId: version._id,
        ...v.analysis,
      });
      await forceTimestamps(Analysis, analysis._id, analysisAt);

      version.latestAnalysisId = analysis._id;
      await version.save();
    }

    // Force version timestamps AFTER any save() above (which would clobber updatedAt)
    await forceTimestamps(ResumeVersion, version._id, versionAt);

    prevVersionId = version._id;
    currentVersionId = version._id;
  }

  resume.currentVersionId = currentVersionId;
  await resume.save();
  await forceTimestamps(Resume, resume._id, firstVersionAt, lastVersionAt);

  console.log(
    `  ✓ ${spec.title}  (${spec.versions.length} version${spec.versions.length > 1 ? "s" : ""})`
  );
}

async function run() {
  console.log(`\nSeeding demo data for ${DEMO.email}...\n`);
  await connectDB();
  const user = await ensureUser();
  await clearUserData(user._id);

  // Resumes are seeded from oldest to newest by passing indexFromNewest descending.
  // RESUMES is most-recent-first, so reverse to seed oldest first, but pass index as-is for timestamps.
  for (let i = 0; i < RESUMES.length; i++) {
    await seedResume(user._id, RESUMES[i], i);
  }

  console.log("\n✅ Seed complete.\n");
  console.log("   Login:    " + DEMO.email);
  console.log("   Password: " + DEMO.password);
  console.log("");

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("\n❌ Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    /* noop */
  }
  process.exit(1);
});
