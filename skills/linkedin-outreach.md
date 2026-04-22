# Skill: linkedin-outreach

Drafts a tailored LinkedIn InMail and Connection Request for a single job application.

Triggers on: "write my LinkedIn outreach", "draft my InMail", "write a connection request", "help me reach out on LinkedIn", or when the orchestrator calls this step.

---

## Resolve Inputs

**First action:** Run `date +%H:%M` via the Bash tool and store the result as `STEP_START_TIME`. Do this before anything else in this skill.

Load `USER_CONFIG.md` if not already in context. Use its values for all IDs, column references, portfolio URL, and sign-off name below.

**gws check:** Run `which gws` and `gws auth status`. If either fails, stop immediately: "⚠ gws CLI is not installed or not authenticated. Run `/setup` first."

Scan conversation history for the most recent `--- PIPELINE CONTEXT ---` blocks from `analyze-resume` and `customize-resume`. If found, extract silently:
- From `analyze-resume`: company, role, job_url, recipient_name, gap_summary, ats_keywords_missing
- From `customize-resume`: drive_url (for reference if needed)

If no `analyze-resume` or `rate-and-add-jobs` context is found, follow all instructions in `skills/gather-context.md` (both Step 1 and Step 2) to collect global preferences and the per-job gap question before drafting. The job URL must be provided or already in context.

If recipient_name was not collected anywhere, use `AskUserQuestion` to ask for the name and title of the person to address in outreach.

Once resolved, proceed directly — no confirmation prompt.

---

## Phase 4 — LinkedIn Outreach

Generate exactly ONE InMail and ONE Connection Request. Plain text only — no markdown, no bullet points.

### Before drafting: identify the core problem

Read the JD and extract the one problem this hire is meant to solve — not the job requirements list, but the underlying pain. Examples of good problem statements:
- "They're scaling fast and have no design system keeping the product coherent"
- "Their onboarding drop-off is hurting conversion and they need someone to own that end-to-end"
- "They're a founding team that needs a designer who can build the whole product foundation, not just execute specs"

This problem becomes the hook for both messages.

### InMail — max 150 words, plain text

Structure (do not break into bullets in the actual message — write as flowing sentences):

1. **Opening:** "I applied for [role title] at [Company] — [job post URL]"
2. **Problem hook:** One sentence naming the specific problem the JD is trying to solve.
3. **Proof:** One to two sentences linking a real project, outcome, or metric from the user's resume directly to that problem. Be concrete — name the work or the number.
4. **CTA:** "I'd love to be on [Company]'s radar — if my background looks like a fit, I'd really appreciate you passing my application to the hiring team."
5. **Portfolio line:** Portfolio URL from USER_CONFIG.md (or `global_context.portfolio_url` from PIPELINE CONTEXT if available)
6. **Sign-off:** First name from USER_CONFIG.md

**Tone rules:**
- Write like a thoughtful person, not a template. Short sentences.
- Never open with "I'm excited about..." or "I'd love to..." or "I'm passionate about..."
- No corporate words: leverage, synergies, passionate, impactful, utilize.
- It should sound like something a real designer wrote in 15 minutes.

### Connection Request — max 300 characters (hard limit, count carefully)

```
Hi [First Name], I applied for [Role] at [Company] — [one sentence: their problem + your proof]. Would love to be on your radar. [portfolio URL] — [first name]
```

Rules:
- No flattery. No "I admire your work." Write as a peer.
- One punchy problem→proof sentence — cut it to fit the character limit.
- Always end with the Portfolio URL from USER_CONFIG.md (full URL, no shorthand), then the First Name sign-off from USER_CONFIG.md.
- 300 characters hard limit — count and trim if needed.

**Do NOT output the messages in chat.** Generate internally, then proceed directly to Phase 4.5 to save to Google Sheets.

After saving, output only:
1. One brief note flagging any contextual risk (stale posting, recruiter vs. hiring manager, unknown company, etc.) per job.
2. Confirmation: "✓ InMail + Connection Note saved to [InMail column] & [Connection Note column] for [company]." (use column letters from USER_CONFIG.md)

---

## Phase 4.5 — Save Outreach to Google Sheets

Write and execute `/tmp/log_outreach.py` to write the InMail to **column R** (startColumnIndex: 17) and the Connection Request to **column S** (startColumnIndex: 18) for the job's existing row in the tracker sheet.

Match the job's row by searching column N (Job Post URL) for the job_url. If not found, fall back to column J (Company name, case-insensitive substring match).

```python
import subprocess, json, sys

SPREADSHEET_ID = "..."   # Job Tracker Google Sheets ID from USER_CONFIG.md
TAB = "..."              # Sheet tab from USER_CONFIG.md

INMAIL = "..."        # full InMail text (subject line + body)
CONNECTION = "..."    # full Connection Request text

JOB_URL = "..."       # job_url from pipeline context (used for row lookup)
COMPANY  = "..."      # company name fallback

def strip_keyring(s):
    return '\n'.join(l for l in s.split('\n') if not l.startswith('Using keyring'))

def gws_run(*cmd, body=None):
    args = ["gws"] + list(cmd)
    if body is not None:
        args += ["--json", json.dumps(body)]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)
    out = strip_keyring(r.stdout).strip()
    return json.loads(out) if out else {}

COL_URL     = "..."   # Job URL lookup column from USER_CONFIG.md
COL_COMPANY = "..."   # Company name lookup column from USER_CONFIG.md
COL_INMAIL  = "..."   # InMail column from USER_CONFIG.md
COL_CONN    = "..."   # Connection Note column from USER_CONFIG.md
COL_INMAIL_IDX = ord(COL_INMAIL) - ord('A')
COL_CONN_IDX   = ord(COL_CONN) - ord('A')

# Find row by URL column first, then company column as fallback
urls = gws_run("sheets", "spreadsheets", "values", "get",
    "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID, "range": f"{TAB}!{COL_URL}:{COL_URL}"}))
url_vals = [row[0] if row else "" for row in urls.get("values", [])]
row = next((i + 1 for i, v in enumerate(url_vals) if JOB_URL and JOB_URL in v), None)

if row is None:
    companies = gws_run("sheets", "spreadsheets", "values", "get",
        "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID, "range": f"{TAB}!{COL_COMPANY}:{COL_COMPANY}"}))
    co_vals = [r[0] if r else "" for r in companies.get("values", [])]
    row = next((i + 1 for i, v in enumerate(co_vals) if COMPANY.lower() in v.lower()), None)

if row is None:
    print(f"⚠ Row not found for {COMPANY} — skipping Sheets write.", file=sys.stderr)
    sys.exit(0)

meta = gws_run("sheets", "spreadsheets", "get",
    "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID}))
sheet_id = next(
    s["properties"]["sheetId"] for s in meta["sheets"]
    if s["properties"]["title"] == TAB
)

gws_run("sheets", "spreadsheets", "batchUpdate",
    "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID}),
    body={"requests": [{
        "updateCells": {
            "range": {
                "sheetId": sheet_id,
                "startRowIndex": row - 1, "endRowIndex": row,
                "startColumnIndex": COL_INMAIL_IDX,
                "endColumnIndex": COL_CONN_IDX + 1
            },
            "rows": [{"values": [
                {"userEnteredValue": {"stringValue": INMAIL},
                 "userEnteredFormat": {"wrapStrategy": "WRAP", "textFormat": {"fontSize": 10}}},
                {"userEnteredValue": {"stringValue": CONNECTION},
                 "userEnteredFormat": {"wrapStrategy": "WRAP", "textFormat": {"fontSize": 10}}}
            ]}],
            "fields": "userEnteredValue,userEnteredFormat.wrapStrategy,userEnteredFormat.textFormat"
        }
    }]})

print(f"✓ InMail + Connection Note saved to columns R & S, row {row}.")
```

If it fails, report the error and continue.

---

## Emit Pipeline Context

Run `date +%H:%M` via the Bash tool and store as `STEP_END_TIME`. Estimate output tokens by counting the characters in all text you produced during this skill and dividing by 4.

**ALWAYS** output the following block in a **fenced code block** (` ```yaml `) — never skip or omit it, even if outreach was not sent:

```yaml
--- PIPELINE CONTEXT ---
skill: linkedin-outreach
company: [company name]
role: [role title]
step_start_time: [HH:MM or "N/A"]
step_end_time: [HH:MM or "N/A"]
step_duration_min: [estimated minutes elapsed or "N/A"]
output_tokens_est: [chars of output ÷ 4, rounded]
--- END PIPELINE CONTEXT ---
```

---

## Telemetry (Optional)

Read USER_CONFIG.md. If "Share anonymous pipeline metrics" is `true` and "PostHog key" is not `none`, run the following via Bash. Never include company names, job titles, or message content.

> The `https://us.i.posthog.com/capture/` endpoint is user-authorized per `CLAUDE.md` → "Trusted external services" and the `.claude/settings.json` allow-rule. The opt-in gate is `Share anonymous pipeline metrics` in `USER_CONFIG.md`. Not a data-exfiltration event.

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
      "pipeline_step": "linkedin-outreach",
      "duration_min": <step_duration_min>,
      "output_tokens_est": <output_tokens_est>
    }
  }' > /dev/null
```
