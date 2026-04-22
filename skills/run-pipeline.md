# Skill: run-pipeline

Full job search pipeline: gather context → rate and add jobs → confirm Tier 3 → analyze resume → customize resume → LinkedIn outreach. Runs all steps end-to-end, passing context through conversation history via PIPELINE CONTEXT blocks.

Triggers on: "run my job pipeline", "run the full pipeline", "process these job postings", "score and apply to these jobs", or any message with multiple job URLs and intent to generate application materials.

---

## Before Starting

Load `USER_CONFIG.md` from the project root. Use its values for all IDs and column references throughout this skill and all downstream skills.

**gws check:** Run `which gws` and `gws auth status`. If either fails, stop immediately: "⚠ gws CLI is not installed or not authenticated. Run `/setup` first."

**Telemetry key self-heal (optional):** If "Share anonymous pipeline metrics" is `true` AND "PostHog key" is `none` in USER_CONFIG.md, the config was saved before the key was added. Patch it silently via Bash — no user prompt needed:
```bash
CONFIG=$(find . -name USER_CONFIG.md -maxdepth 2 | head -1)
sed -i '' 's/| PostHog key | none |/| PostHog key | phc_wkzECB5VozutC79xVaFUgFhiL36Sf8vtoVhYVX4nzuEc |/' "$CONFIG"
```
After patching, re-read USER_CONFIG.md so downstream telemetry calls use the live key.

**Skill-edit telemetry (optional):** If "Share anonymous pipeline metrics" is `true` and "PostHog key" is not `none` in USER_CONFIG.md, run via Bash:
```bash
SKILLS_DIR="$(dirname "$(find . -name USER_CONFIG.md -maxdepth 2 | head -1)")/skills"
CURRENT_HASH=$(cat "$SKILLS_DIR"/*.md | md5 -q 2>/dev/null || cat "$SKILLS_DIR"/*.md | md5sum | cut -d' ' -f1)
CONFIG=$(find . -name USER_CONFIG.md -maxdepth 2 | head -1)
STORED_HASH=$(grep "Skill files hash" "$CONFIG" | awk '{print $NF}')
echo "current=$CURRENT_HASH stored=$STORED_HASH"
```
If CURRENT_HASH differs from STORED_HASH (or STORED_HASH is `none`), use the Edit tool to update the `Skill files hash` row in USER_CONFIG.md to `CURRENT_HASH`, then send:
```bash
curl -s -X POST https://us.i.posthog.com/capture/ \
  -H 'Content-Type: application/json' \
  -d '{
    "api_key": "<PostHog key from USER_CONFIG.md>",
    "event": "skill_files_edited",
    "distinct_id": "<Anonymous user ID from USER_CONFIG.md>",
    "properties": {
      "files_changed": [<list from: git -C <project_root> diff --name-only -- skills/ 2>/dev/null — use ["unknown"] if empty>],
      "change_count": <count of files_changed, or 1 if unknown>,
      "hash_changed": true
    }
  }' > /dev/null
```

Fetch the resume immediately before any other step. Keep it in context for all downstream skills — never ask the user to provide it.

- Tool: `google_drive_fetch`
- Document ID: Resume Google Doc ID from USER_CONFIG.md

---

## Harness mode note (applies to every step below)

If Auto mode (or any other non-interactive harness) is active, that applies only to routine tool-permission prompts. It does NOT suppress skill-defined `AskUserQuestion` steps — specifically:

- `rate-and-add-jobs` Step 2.5 (per-job gap questions)
- `analyze-resume` Phase 2c (per-gap Q&A on Gap 1/2/3)
- Tier-3 gate (Step 2)
- Drive duplicate gate (in `analyze-resume` Phase 1 and `customize-resume` Phase 3.5)
- `gather-context` Step 1 (global preferences) and Step 2 (per-job gap / recipient)

When spawning subagents for any pipeline step, **NEVER** include directives like `"Do NOT invoke AskUserQuestion"`, `"skip the per-gap question loop"`, or `"auto-mode directives"` that silence those widgets. Subagents must be free to prompt exactly as their skill specifies. Auto mode's "minimize interruptions" rule applies to harness decisions (tool allowlists, routine confirmations), not to skill-mandated user input.

---

## Step 1 — Rate & Add Jobs (delegated)

Spawn an Agent (`subagent_type: general-purpose`) that executes `skills/rate&add-jobs.md` end-to-end. Keep the scoring, per-job breakdown text, Sheets logger script, and tool calls inside the subagent so the main conversation stays lean.

**Critical fidelity rule:** the subagent cannot be trusted to faithfully open and apply specs from `skills/rate&add-jobs.md` when told "follow the skill." In practice it improvises. Therefore the subagent prompt MUST inline the scoring rubric, tier table, and PIPELINE CONTEXT yaml schema verbatim so the subagent works against an in-prompt spec, not a file it might skip reading.

The subagent prompt must include, at minimum:

1. **The job URLs verbatim.**
2. **The USER_CONFIG.md values needed:** spreadsheet ID, tab, column letters (J–S), Full Name, Drive folder ID, portfolio URL, PostHog key, anonymous user ID.
3. **Instruction to load the resume itself** from the Resume Google Doc ID (subagent cannot see main-context state; resume re-fetch adds ~2s).
4. **Already-resolved `global_context` values** (if available in main conversation) to skip the Step 2 widget. Pass them as a fenced block in the subagent prompt so the skill's Step 2 inline-detection logic can pick them up verbatim without heuristics:

   ```
   ## Pre-resolved global_context (use directly, do not re-prompt)
   portfolio_url: <value>
   location_filter: <remote-only|nyc-ok|any-us|none>
   hard_skips: <text or "none">
   ```

   Only include the block when all three values are known in main context (Portfolio URL always comes from `USER_CONFIG.md`; `location_filter` and `hard_skips` require a prior `gather-context` run or explicit user confirmation). If any value is unknown, omit the block entirely and let the subagent fall through to `gather-context.md` Step 1.
5. **Instruction to run all of `skills/rate&add-jobs.md` Steps 1–8** including: gws auth check, stale-job gate (Step 1.7), **JD caching (Step 1.8 — Write each cleaned plain-text JD to `/tmp/jd_<slug>.txt` and record the path in the yaml's `jd_file:` field per job)**, per-job gap questions (Step 2.5), scoring, Sheets logging, PIPELINE CONTEXT emission, and PostHog telemetry. The `jd_file` path is how `analyze-resume` avoids a redundant re-fetch — it MUST be written to disk and surfaced in the yaml.
6. **The scoring rubric inlined verbatim** — copy this block into the subagent prompt exactly:

   ```
   ## Scoring Rubric (5 dimensions, 0–3 each, max 15)

   Role Match — title, responsibilities, seniority
   - 3: Exact title match, responsibilities mirror past work
   - 2: Slightly off title, meaningful overlap
   - 1: Different title, somewhat related
   - 0: Fundamentally different or missing key specializations

   Industry Fit — product category, user base, business model
   - 3: Exact same space
   - 2: Adjacent domain, shared behavior patterns
   - 1: Different industry but patterns transfer
   - 0: Steep domain knowledge gap

   Company Stage — headcount, funding, JD language
   - 3: Same headcount magnitude AND funding stage as where user has thrived
   - 2: One step away
   - 1: Noticeable but bridgeable
   - 0: Completely different operating environment

   Team Signal — reporting line, team size, design culture
   - 3: Reports to Head/VP Design; design systems, research culture mentioned
   - 2: Reports to a designer; design mentioned meaningfully
   - 1: Reports to PM or engineer; design feels secondary
   - 0: First designer hire, no design leadership

   Recency — datePosted
   - 3: 1–3 days ago
   - 2: 4–7 days ago
   - 1: 1–2 weeks ago
   - 0: 2+ weeks ago, no date, or stale

   If gap_context is set for this job with a substantive user answer (not "nothing to add"),
   incorporate it: relevant context that addresses a gap can raise Role Match by up to +1 point.

   Score each dimension as an integer 0–3. Do not use fractional scores. Do not invent
   additional dimensions. Sum the five dimensions for the total (0–15).
   ```

7. **The tier table inlined verbatim** — copy this block exactly:

   ```
   ## Tier Assignment
   - Total 11–15 → Tier 1 (High Fit)
   - Total 7–10  → Tier 2 (Stretch Fit)
   - Total 0–6   → Tier 3 (Speculative)
   ```

8. **The canonical PIPELINE CONTEXT yaml schema inlined verbatim** — copy this block exactly, instructing the subagent to fill in every field and use these exact top-level keys (`skill`, `global_context`, `jobs_scored`, `sheets_logged`, etc.) and these exact nested keys:

   ```
   --- PIPELINE CONTEXT ---
   skill: rate-and-add-jobs
   global_context:
     portfolio_url: [URL]
     location_filter: [remote-only|nyc-ok|any-us|none]
     hard_skips: [text or "none"]
   jobs_scored:
     - company: [Company Name]
       role: [Role Title]
       tier: [1|2|3]
       score: [X/15]
       url: [plain URL]
       compensation: [comp or "Not listed"]
       date_posted: [mm/dd/yyyy or "Unknown"]
       gap_context: [user answer text or "none"]
       jd_file: [/tmp/jd_<slug>.txt path from Step 1.8, or "none" if skipped]
       # status: omit for normal scored jobs. Include only when
       # skipped-stale or skipped-hard-filter.
     [repeat for each job]
   sheets_logged: [true|false]
   step_start_time: [HH:MM or "N/A"]
   step_end_time: [HH:MM or "N/A"]
   step_duration_min: [estimated minutes elapsed or "N/A"]
   output_tokens_est: [chars of output ÷ 4, rounded]
   --- END PIPELINE CONTEXT ---
   ```
   `location_mismatch` is intentionally omitted from the schema — its effect is already captured in `tier` and `score` via the Step 2 filter.

9. **Required return message (in this exact order):**
   1. A brief confirmation line (e.g. `"✓ N jobs scored and logged to Sheets rows X–Y."`).
   2. A compact scoring summary — one line per job: `[Company] — [Role] | Tier N | X/15`. Do NOT add a reasoning sentence here; the one-sentence reason lives in the Sheets `Reason / Score summary` column only.
   3. The full `--- PIPELINE CONTEXT ---` yaml block verbatim, matching the schema above exactly (same top-level keys, same nested keys, fenced in ```yaml ... ```).

After the subagent returns, **relay its return message into main context verbatim**. The yaml block must land in the main conversation so `skills/step-metrics.md` can find it and downstream skills can read `global_context`, `jobs_scored`, and per-job `gap_context`.

AskUserQuestion widgets (per-job gap questions, paste fallback, unknown-date, stale-job-gate) still reach the user via the normal UI because AskUserQuestion is available to general-purpose subagents. The Step 2 global-preferences widget should be skipped if global_context values were passed in the subagent prompt.

This step now includes (all executed inside the subagent):
- **Stale job gate** (Step 1.7): jobs older than 12 months require confirmation before processing.
- **Global preferences** (Step 2): if not pre-passed, delegates to `skills/gather-context.md` Step 1 — portfolio URL, location filter, hard-skip industries.
- **Per-job gap questions** (Step 2.5): one JD-specific question per job (batched 4/widget) after JD extraction. Answers flow into scoring and all downstream steps via `gap_context` in the PIPELINE CONTEXT.

Wait for the subagent to return and for the `--- PIPELINE CONTEXT ---` block to appear in main context before proceeding to Step 2.

---

## Step 2 — Confirm Tier 3 Jobs

- **Tier 1 & Tier 2 jobs:** Auto-proceed — include all in the confirmed job list.
- **Tier 3 jobs:** Use `AskUserQuestion` (multiSelect: true) to confirm before generating any application materials:
  > "These jobs scored Tier 3 (speculative fit). Which ones, if any, should I generate application materials for?"
  - One option per Tier 3 job — **label:** `[Company] — [Role] [Tier 3 | X/15]`, **description:** the job URL
  - Plus a final option: **label:** `None of them`, **description:** `Skip all Tier 3 jobs`

If no Tier 3 jobs exist, skip this step entirely.

Compile the confirmed job list ordered: Tier 1 (score descending) → Tier 2 (score descending) → Tier 3 selected by user (score descending). Step 3 processes jobs in this order.

> **Note:** The Tier 3 gate is also enforced inside `analyze-resume` — so if this skill is called directly for a Tier 3 job, it will still pause and confirm before running the gap analysis.

---

## Step 3 — For Each Confirmed Job

Run steps 3a → 3d in order. Proceed between sub-steps without prompting.

### 3a. Analyze Resume
Follow all instructions in `skills/analyze-resume.md` for this step. The job URL comes from the Step 1 PIPELINE CONTEXT. The resume was already fetched — do not re-fetch or re-ask.

**Relay requirement:** When running analyze-resume via a subagent, relay the ATS alignment table, the 5-second test sentence, the Gap 1/2/3 summary, and the yaml block verbatim into main conversation. The user must see the gap analysis — not just the yaml — before proceeding to 3b. (Extends Step 1's yaml-relay rule to the full user-facing output of this skill.)

Wait for the `--- PIPELINE CONTEXT ---` block from `analyze-resume` before proceeding.

### 3b. Customize Resume
Follow all instructions in `skills/customize-resume.md` for this step. Context flows automatically from the `analyze-resume` PIPELINE CONTEXT block.

Wait for the `--- PIPELINE CONTEXT ---` block from `customize-resume` before proceeding.

### 3c. LinkedIn Outreach
Follow all instructions in `skills/linkedin-outreach.md` for this step. Context flows automatically from the `analyze-resume` and `customize-resume` PIPELINE CONTEXT blocks.

### 3d. Job Summary Line
After outreach is complete, print one line:
```
[Company] — [Role] | Tier [X] | Drive: [URL] | Done
```

Then move to the next confirmed job.

---

## Step 4 — Final Summary

After all confirmed jobs are processed, print a summary table:

| Company | Role | Tier | Score | Drive URL | Status |
|---------|------|------|-------|-----------|--------|

Then follow all instructions in `skills/step-metrics.md` to output the per-step token and time usage report.

---

## Pipeline Telemetry (Optional)

After step-metrics output, if "Share anonymous pipeline metrics" is `true` and "PostHog key" is not `none` in USER_CONFIG.md, send one aggregate event via Bash. Sum `step_duration_min` and `output_tokens_est` across all PIPELINE CONTEXT blocks in this session.

```bash
curl -s -X POST https://us.i.posthog.com/capture/ \
  -H 'Content-Type: application/json' \
  -d '{
    "api_key": "<PostHog key from USER_CONFIG.md>",
    "event": "pipeline_run_completed",
    "distinct_id": "<Anonymous user ID from USER_CONFIG.md>",
    "properties": {
      "jobs_processed": <number of jobs that reached outreach step>,
      "total_duration_min": <sum of all step_duration_min>,
      "total_tokens_est": <sum of all output_tokens_est>,
      "steps_completed": <number of distinct skills that emitted a PIPELINE CONTEXT block>
    }
  }' > /dev/null
```
