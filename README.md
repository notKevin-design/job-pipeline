# Job Pipeline

**Automate your job search with Claude Code.** An opinionated pipeline that scrapes job postings, scores fit, gap-analyzes your resume, tailors it per job, and drafts LinkedIn outreach — all logged to Google Sheets + Drive via the `gws` CLI.

<!-- TODO: add a screenshot of the onboarding wizard and/or a demo GIF of a full pipeline run -->

---

## What this is

I'm a product designer who got tired of retyping the same things into every application. This repo is my setup: a Next.js onboarding wizard that generates your config, plus a set of Claude Code skills that do the actual work. It's built around my workflow — fork it, change the skills to match yours.

## How it works

```
┌─────────────────────────────┐       ┌──────────────────────────────────┐
│  Next.js wizard (this repo) │  →    │  USER_CONFIG.md                  │
│  npm run dev  @ :3100       │       │  (identity, Google IDs,          │
│                             │       │   sheet layout, resume anchors)  │
└─────────────────────────────┘       └─────────────────┬────────────────┘
                                                        │
                                                        ▼
                                   ┌─────────────────────────────────────┐
                                   │  Claude Code skills (in /skills)    │
                                   │    /0-run-pipeline     (full run)   │
                                   │    /1-rate-and-add-jobs             │
                                   │    /2-analyze-resume                │
                                   │    /3-customize-resume              │
                                   │    /4-linkedin-outreach             │
                                   │    /5-step-metrics                  │
                                   └─────────────────────────────────────┘
                                                        │
                                                        ▼
                                   ┌─────────────────────────────────────┐
                                   │  Your Google Sheets + Drive         │
                                   │  (tracker rows, tailored resumes,   │
                                   │   InMails + connection notes)       │
                                   └─────────────────────────────────────┘
```

The wizard is the setup; the skills are the daily driver.

## Prerequisites

- **Node 18.17+** (Next.js 14.2 requirement)
- **[Claude Code](https://claude.com/claude-code)** CLI installed
- **[`gws` CLI](https://github.com/googleworkspace/cli)** installed and authenticated (`gws auth login`)
- **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com/))
- A Google account with:
  - A resume in Google Docs
  - A job tracker Sheet (easiest: duplicate [the template](https://docs.google.com/spreadsheets/d/1vifOnKWyAfLgdeqT48xGsSJALeQZAOcxlPpfRbT5xSI/edit?usp=sharing))
  - A Drive folder where tailored resumes get saved

## Quick start

```bash
# 1. Clone
git clone git@github.com:notKevin-design/job-pipeline.git
cd job-pipeline

# 2. Set your Anthropic key
cp .env.example .env.local
# edit .env.local → fill in ANTHROPIC_API_KEY

# 3. Install + run the wizard
npm install
npm run dev
# open http://localhost:3100
```

Walk through the wizard (Welcome → Prerequisites → Identity → Google IDs → Sheet Setup → Resume Anchors → Review). It writes `USER_CONFIG.md` to the repo root.

Then open Claude Code in this directory and:

```
/0-run-pipeline
```

Paste job URLs when prompted. The pipeline will score, tier, and — for jobs you confirm — produce a tailored resume in Drive and an outreach draft in your Sheet.

## The skills

| Skill | What it does |
|-------|--------------|
| `/0-run-pipeline` | Orchestrator. Chains the five steps below end-to-end. |
| `/1-rate-and-add-jobs` | Scrapes each job URL, scores it on 5 dimensions (Role Match, Industry Fit, Company Stage, Team Signal, Recency), assigns Tier 1/2/3, logs to your Sheet. |
| `/2-analyze-resume` | Per job: ATS keyword alignment table, 5-second-test read, 3–5 gaps summary. |
| `/3-customize-resume` | Per job: tailors summary + experience bullets + key skills; saves a new Doc to your Drive folder. |
| `/4-linkedin-outreach` | Per job: drafts one InMail + one Connection Request; writes both to your Sheet row. |
| `/5-step-metrics` | Token usage + wall-clock time per step across the run. |

Each skill lives in `skills/` as a single markdown file. Edit them directly to change behavior.

## Case study — what I've shipped with this

<!-- TODO: fill in with personal metrics once you're ready to share
- N job applications processed over M weeks
- K tailored resumes in Drive, all scored and tiered in the Sheet
- Example Sheet row screenshot
-->

## Privacy & data

- Your Anthropic key stays in `.env.local` (gitignored, never committed).
- All Sheets and Drive writes land in **your** Google account via the `gws` CLI you authenticated.
- Pipeline telemetry is **opt-in** at the wizard's final step. When enabled, anonymized step durations + token counts are sent to a PostHog project — no resume content, no job titles, no company names, no URLs, no email. Opt out anytime by setting `Share anonymous pipeline metrics` to `false` in `USER_CONFIG.md`.
- Fork-and-use tip: to point telemetry at your own PostHog project, override `NEXT_PUBLIC_POSTHOG_KEY` in `.env.local` and update the default in `lib/generateConfig.ts:94`.

## Tech stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Radix UI · PostHog · Anthropic SDK

## Contributing

PRs welcome. For non-trivial changes, open an issue first so we can talk through it. Run `npm run build` before submitting.

## License

[MIT](./LICENSE)
