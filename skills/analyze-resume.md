# Skill: analyze-resume

Resume gap analysis for a single job: fetch resume → scrape job posting → ATS gap analysis → 5-second recruiter test → gap summary with user Q&A.

Triggers on: "analyze this job", "do a gap analysis", "how does my resume match this job", "what gaps do I have for this role", "help me apply to this job", "customize my resume and write outreach", "prep my full application", "tailor my resume and write a LinkedIn message", or when the orchestrator calls this step.

---

## Resolve Inputs

**First action:** Run `date +%H:%M` via the Bash tool and store the result as `STEP_START_TIME`. Do this before anything else in this skill.

Load `USER_CONFIG.md` if not already in context. Use its values for all IDs, column references, and user identity below.

**gws check:** Run `which gws` and `gws auth status`. If either fails, stop immediately: "⚠ gws CLI is not installed or not authenticated. Run `/setup` first."

Check conversation history for `global_context` in any `--- PIPELINE CONTEXT ---` block. If not found, follow all instructions in `skills/gather-context.md` **Step 1 only** (global preferences; skip the per-job gap question — Phase 2c handles gap questions after the full analysis).

Check the current conversation first — don't re-ask for anything already provided.

If a `--- PIPELINE CONTEXT ---` block from `rate-and-add-jobs` is in conversation history, the resume may already be fetched and a job URL may be available. Extract silently. If multiple jobs were scored, use `AskUserQuestion` to confirm which one to analyze — list options in Tier 1 → Tier 2 → Tier 3 order (score descending within tier). Each option must include:
- **label:** `[Company] — [Role] [Tier X | Y/15]`
- **description:** the job URL (plain text, so user can see where it links)

Required:
1. **Resume** — load from context, or fetch from Google Doc using the Resume Google Doc ID from USER_CONFIG.md via `google_drive_fetch`. Never ask the user to paste it.
2. **Job posting URL** (strongly preferred) or plain JD text
3. **Recipient name and title** — check if `recipient_name` is already present (and not `"not collected"`) in a `--- PIPELINE CONTEXT ---` block from `gather-context`. If so, use that value silently. Otherwise, include it in the widget below.

If any are missing, use `AskUserQuestion` to collect them in a single widget — never one at a time.

**Tier 3 gate:** If a `--- PIPELINE CONTEXT ---` block from `rate-and-add-jobs` is in conversation history and this job's tier is **3**, pause before proceeding. Use `AskUserQuestion`:
> "**[Company] — [Role]** scored **Tier 3** (speculative fit, score X/15).\n[URL]\nDo you want to generate a full gap analysis, tailored resume, and LinkedIn outreach for it?"
- Options: "Yes, proceed" / "Skip this job"

If the user chooses to skip, emit a minimal pipeline context block with `skipped: true` and move on. Do not run Phase 1 or Phase 2.

Once inputs are confirmed (and Tier 3 is approved if applicable), proceed directly to Phase 2 with no further prompts.

---

## Phase 1 — Fetch Inputs

- Resume: load from context or fetch via `google_drive_fetch` using the Resume Google Doc ID from USER_CONFIG.md. Keep in context for all subsequent steps.
- Job posting — check conversation history for the most recent `--- PIPELINE CONTEXT ---` block from `rate-and-add-jobs`. If this job's `jobs_scored[]` entry includes a `jd_file:` path (e.g. `/tmp/jd_<slug>.txt`), **`Read` that file and use its contents as the JD input for Phase 2 — do NOT re-fetch from the network.** The subagent already parsed the full JD when scoring; the cached file is the agreed-upon handoff.
- **Fallback:** If `jd_file` is missing from the yaml (standalone analyze-resume invocation without a Step 1 context), or the file at that path no longer exists (stale `/tmp` from a previous session), navigate to the URL and extract content using the same platform-specific JavaScript as `rate-and-add-jobs` Step 1 (Ashby, Greenhouse, LinkedIn, YC, Lever, or unknown platform fallback). If extraction fails, use Jina.ai (`https://r.jina.ai/[URL]`, skip for LinkedIn).

**Drive duplicate check:** After extracting the company name from the job posting, run:
```bash
gws drive files list --params '{"q": "name contains \"[Full Name]_Resume_[Company]\" and \"[Drive Folder ID]\" in parents and trashed=false", "fields": "files(id,name,webViewLink)"}'
```
Replace `[Full Name]` and `[Drive Folder ID]` with values from USER_CONFIG.md, and `[Company]` with the extracted company name. If one or more files are found, use `AskUserQuestion` before proceeding to Phase 2:
> "A tailored resume for **[Company]** was previously generated: **[file name]**\n[Drive URL]\nIt looks like this job may have been analyzed before. Do you want to run a fresh gap analysis, or skip ahead?"
- Options: "Re-run gap analysis" / "Skip to customize-resume" / "Skip to outreach only"

If "Skip to customize-resume": emit a minimal `analyze-resume` pipeline context block using any available info (job URL, company, role, tier from rate-and-add-jobs context) and hand off.
If "Skip to outreach only": emit minimal context and jump directly to `linkedin-outreach`.
If no files found or user chooses "Re-run gap analysis": proceed normally to Phase 2.

---

## Phase 2 — Gap Analysis

### 2a. ATS Perspective
Which required JD keywords, skills, and qualifications are missing or weakly represented in the resume? Score alignment 🔴 Low / 🟡 Medium / 🟢 High per major requirement. Sort lowest → highest so the most critical gaps appear first. Use the emoji label in the table Alignment column, e.g.:

| Requirement | Alignment | Notes |
|---|---|---|
| [requirement] | 🔴 Low | [why it's missing] |
| [requirement] | 🟡 Medium | [partial match] |
| [requirement] | 🟢 High | [strong match] |

### 2b. Human Recruiter "5-Second Test"
Skim the resume as a busy hiring manager would in under 5 seconds. What's immediately clear? What's buried or flat?

### 2c. Gap Summary
Top 3–5 gaps labeled Gap 1, Gap 2, etc.

**Check for pre-collected gap context:** Scan conversation history for a `--- PIPELINE CONTEXT ---` block from `rate-and-add-jobs`. If found and this job's entry includes a `gap_context` value other than "none":
- **Skip the per-gap question loop entirely.**
- Incorporate the `gap_context` answer directly into the gap summary and ATS alignment adjustments (e.g., if the user confirmed portfolio work not on their resume, upgrade the relevant row from 🔴 Low → 🟡 Medium or 🟡 Medium → 🟢 High as appropriate).
- Reference `global_context.portfolio_url` (from the same PIPELINE CONTEXT block) in the outreach hooks section of the gap summary.

**If gap_context is not available** (running analyze-resume standalone without a prior rate-and-add-jobs context), use `AskUserQuestion` to ask for context on each gap. Prepend the job context to each question so the user can orient quickly:
> "**[Company] — [Role] [Tier X]** ([URL])\n\nGap 1 is that your resume doesn't show [X]. Have you used this in any project, even informally or as part of another role?"

Use multiple-choice options wherever possible to reduce typing friction. Wait for responses before emitting pipeline context.

---

## Emit Pipeline Context

Run `date +%H:%M` via the Bash tool and store as `STEP_END_TIME`. Estimate output tokens by counting the characters in all text you produced during this skill and dividing by 4.

**ALWAYS** output the following block in a **fenced code block** (` ```yaml `) — never skip or omit it, even if the analysis was short or the job was skipped by the user:

```yaml
--- PIPELINE CONTEXT ---
skill: analyze-resume
company: [company name]
role: [role title]
job_url: [url]
recipient_name: [name and title if collected, else "not collected"]
gap_summary:
  gap1: [label and one-line description]
  gap2: [label and one-line description]
  gap3: [label and one-line description]
ats_keywords_missing: [comma-separated list]
five_second_finding: [one sentence]
step_start_time: [HH:MM or "N/A"]
step_end_time: [HH:MM or "N/A"]
step_duration_min: [estimated minutes elapsed or "N/A"]
output_tokens_est: [chars of output ÷ 4, rounded]
--- END PIPELINE CONTEXT ---
```

This block lets `customize-resume` and `linkedin-outreach` proceed without re-asking.

---

## Telemetry (Optional)

Read USER_CONFIG.md. If "Share anonymous pipeline metrics" is `true` and "PostHog key" is not `none`, run the following via Bash. Never include company names, job titles, URLs, or resume content.

**Skill-edit check:** Run via Bash:
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

```bash
curl -s -X POST https://us.i.posthog.com/capture/ \
  -H 'Content-Type: application/json' \
  -d '{
    "api_key": "<PostHog key from USER_CONFIG.md>",
    "event": "pipeline_step_completed",
    "distinct_id": "<Anonymous user ID from USER_CONFIG.md>",
    "properties": {
      "pipeline_step": "analyze-resume",
      "duration_min": <step_duration_min>,
      "output_tokens_est": <output_tokens_est>,
      "gap_count": <number of gaps in gap_summary>,
      "skipped": <true if job was skipped, else false>
    }
  }' > /dev/null
```
