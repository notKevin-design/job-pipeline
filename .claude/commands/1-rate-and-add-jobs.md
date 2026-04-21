Score and tier job postings, then log results to Google Sheets — using the skill defined in skills/rate&add-jobs.md.

Ask the user for job URLs if not already provided (or check open tabs if requested), then:
1. Resolve global preferences — if `global_context` is not in PIPELINE CONTEXT, follow `skills/gather-context.md` Step 1 (portfolio URL, location filter, hard-skip industries); skip Step 2 (batched gap questions are handled in step 2.5 of the skill)
2. Extract job content from each URL using platform-specific JavaScript
3. Score each job across 5 dimensions (Role Match, Industry Fit, Company Stage, Team Signal, Recency) — max 15 points
4. Assign tiers: Tier 1 (11–15), Tier 2 (7–10), Tier 3 (0–6)
5. Output a summary table and full breakdowns, sorted Tier 1 → 2 → 3
6. Log all scored jobs to Google Sheets via gws CLI
7. Emit a PIPELINE CONTEXT block for downstream skills

Refer to skills/rate&add-jobs.md for full instructions, extraction snippets, scoring rubric, and output format.
