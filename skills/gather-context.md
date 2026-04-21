# Skill: gather-context

Pre-flight context collection for the job pipeline. Collects global preferences (portfolio URL, location filter, hard-skip industries) and optionally a per-job gap question for a specific role.

Triggers on: "gather context", "set my preferences", "set pipeline preferences", or when invoked by another skill that needs context before proceeding.

---

## Resolve Inputs

**First action:** Run `date +%H:%M` via the Bash tool and store the result as `STEP_START_TIME`. Do this before anything else in this skill.

Load `USER_CONFIG.md` if not already in context. Use its Portfolio URL as the default for `global_context.portfolio_url`.

Check conversation history:
- If `global_context` is already in a `--- PIPELINE CONTEXT ---` block → skip Step 1, use existing values.
- If a job URL or JD text is available in context → run Step 2 after Step 1.

If the resume is not already in context, fetch it via `google_drive_fetch` using the Resume Google Doc ID from USER_CONFIG.md before Step 2.

---

## Step 1 — Global Preferences

Infer background from the resume if in context. Then use `AskUserQuestion` to ask whether to use defaults or customize:

- **header:** `"Preferences"` — **question:** `"Set global preferences, or use resume-inferred defaults?"` — options:
  - `"Use defaults"` — description: show portfolio URL, location, and hard skips from USER_CONFIG.md (e.g. `"Portfolio: [portfolio_url] · Location: no filter · Hard skips: none"`)
  - `"Customize"` — description: `"Set portfolio URL, location constraint, and hard-skip industries"`

**If "Use defaults":** Set programmatically and skip the widget below:
- `global_context.portfolio_url` = Portfolio URL from USER_CONFIG.md
- `global_context.location_filter = "none"`
- `global_context.hard_skips = "none"`

**If "Customize":** Show the following three-question widget:
- **Q1 header:** `"Portfolio"` — **question:** `"Portfolio URL to use in all LinkedIn outreach?"` — options: show the Portfolio URL from USER_CONFIG.md as the first option (description: Default), `"Other (type below)"` (description: Enter URL in the Other field)
- **Q2 header:** `"Location filter"` — **question:** `"Which location constraint applies when scoring roles?"` — options: `"Remote only"` (any role explicitly requiring onsite is flagged; capped at Tier 2 and Team Signal ≤ 1), `"NYC metro OK"` (remote + NYC onsite both fine), `"Any US city"` (open to US relocation), `"No filter"` (score all locations equally)
- **Q3 header:** `"Hard skips"` — **question:** `"Any industries or company types to exclude entirely?"` — `multiSelect: true` — options: `"None"`, `"Crypto / Web3"`, `"Govt / defense"`, `"Other (type below)"` (specify in the Other field). If "None" is selected (alone or with others), treat as no skips. Otherwise store all selected values as a comma-separated list.

Store answers as `global_context.portfolio_url`, `global_context.location_filter`, and `global_context.hard_skips`.

---

## Step 2 — Per-Job Gap Question (optional)

**Only run if** a specific job URL or JD text is available in the current context.

If a job URL is provided but the JD has not been fetched yet, fetch it now via `WebFetch` with prompt: "Extract: job title, company name, full job description including responsibilities and requirements."

Compare the JD to the resume. Identify the **single most impactful gap** — the one requirement where additional context from Kexin would most change the downstream resume or outreach output (e.g., portfolio work not on resume, adjacent experience, an informal project that addresses a listed requirement).

**Good questions** (specific, JD-derived):
- "JD requires Framer + motion design, which isn't on your resume. Any relevant motion work in your portfolio?"
- "Role emphasizes owning mixed-methods research solo. Does your portfolio show generative research leadership?"
- "JD says 'ship what you design' and lists HTML/CSS. Should frontend dev be listed on your resume?"

**Skip Step 2** if: (a) no job URL or JD is available, (b) the answer is already clear from the resume, or (c) the gap is too generic to change the output (e.g., "Are you comfortable in fast-paced environments?").

Use `AskUserQuestion` with **2 questions** in a single widget call:

**Q1 — Gap context** (only include if a material gap exists; omit entirely if no material gap):
- **header:** Company name (12 chars max)
- **question:** `"[Company — Role] [specific JD-derived gap and ask]"`
- `multiSelect: false`
- **options:** Dynamically generated — same logic as rate&add-jobs Step 2.5: infer up to 2 specific portfolio/resume items that could address the gap, then `"Other context"` (description: `"I'll describe in the Other field"`) and `"Genuine gap — nothing to add"` as fixed anchors. If no specific items can be inferred, fall back to just those two anchors.

**Q2 — LinkedIn recipient** (always include, unless `recipient_name` is already present and not `"not collected"` in an existing `--- PIPELINE CONTEXT ---` block):
- **header:** Company name (12 chars max), or `"Outreach"` if company is unknown
- **question:** `"Who should the LinkedIn InMail be addressed to? (name + title)"`
- **options:** `"I'll type in the Other field"` (description: `"Enter name and title below"`), `"Not sure — I'll find them later"` (description: `"Sets recipient to 'not collected'"`)

If neither Q1 nor Q2 applies, skip the widget entirely.

Store Q1 response as `gap_context`. If "Genuine gap — nothing to add" is selected (or Q1 was omitted), set `gap_context: "none"`.
Store Q2 response as `recipient_name`. If user selects "Not sure — I'll find them later," set `recipient_name: "not collected"`.

---

## Emit Pipeline Context

Run `date +%H:%M` via the Bash tool and store as `STEP_END_TIME`.

**ALWAYS** output the following block in a **fenced code block** (` ```yaml `) — never skip or omit it:

```yaml
--- PIPELINE CONTEXT ---
skill: gather-context
global_context:
  portfolio_url: [URL]
  location_filter: [remote-only|nyc-ok|any-us|none]
  hard_skips: [text or "none"]
gap_context: [user answer or "none"]
recipient_name: [name and title, or "not collected"]
step_start_time: [HH:MM or "N/A"]
step_end_time: [HH:MM or "N/A"]
--- END PIPELINE CONTEXT ---
```
