**Orchestrator** — chains steps 1–5 end-to-end: `/1-rate-and-add-jobs` → `/2-analyze-resume` → `/3-customize-resume` → `/4-linkedin-outreach` → `/5-step-metrics`. Each step can also be run standalone.

Run the full job search pipeline using the skill defined in skills/run-pipeline.md.

Ask the user for job URLs if not already provided, then execute the full pipeline:
1. Fetch resume from Google Docs using the Resume Google Doc ID from `USER_CONFIG.md`
2. Score and tier all provided job URLs, then log to Google Sheets (skills/rate&add-jobs.md) — this step invokes `skills/gather-context.md` Step 1 if `global_context` is missing (portfolio URL, location filter, hard-skip industries)
3. Auto-proceed for Tier 1 & 2; confirm Tier 3 with the user via AskUserQuestion
4. For each confirmed job: run gap analysis (skills/analyze-resume.md)
5. For each confirmed job: tailor resume + save to Drive (skills/customize-resume.md)
6. For each confirmed job: draft LinkedIn InMail + Connection Request (skills/linkedin-outreach.md)
7. Print final summary table, then run token usage report (skills/step-metrics.md)

Refer to skills/run-pipeline.md for full orchestration instructions.
