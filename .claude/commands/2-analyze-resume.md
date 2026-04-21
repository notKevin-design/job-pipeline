Run a gap analysis between the user's resume and a specific job posting — using the skill defined in skills/analyze-resume.md.

Ask the user for the job URL and recipient name if not already provided, then:
1. Resolve inputs — check for upstream PIPELINE CONTEXT; if `global_context` is missing, follow `skills/gather-context.md` Step 1 only (skip Step 2 — per-gap questions are handled in phase 2c after full analysis)
2. Fetch resume from Google Docs using the Resume Google Doc ID from `USER_CONFIG.md`
3. Scrape the job posting using platform-specific JavaScript
4. Run ATS gap analysis — score each major JD requirement Low / Medium / High
5. Apply the 5-second recruiter test
6. Summarize top 3–5 gaps and ask the user for context via AskUserQuestion
7. Emit a PIPELINE CONTEXT block for downstream skills

Refer to skills/analyze-resume.md for full instructions and output format.
