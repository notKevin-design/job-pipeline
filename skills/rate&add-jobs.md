# Skill: rate-and-add-jobs

Job post scorer and tracker. Scrapes job postings, extracts key info, scores each with a 5-dimension tier rating system, and logs results to Google Sheets.

Triggers on: "rate these jobs", "score these postings", "which jobs should I apply to", "tier these roles", "analyze these job postings", "which is the best fit", "add to my tracker", "score and log these jobs", "run my job tracker", or any message containing job board URLs.

---

## Resolve Inputs

**First action:** Run `date +%H:%M` via the Bash tool and store the result as `STEP_START_TIME`. Do this before anything else in this skill.

Load `USER_CONFIG.md` if not already in context. Use its values for all IDs and column references below.

**gws check:** Run `which gws` and `gws auth status`. If either fails, stop immediately: "⚠ gws CLI is not installed or not authenticated. Run `/setup` first."

Check the current conversation for existing context before asking.

If a resume is already in context (fetched from Google Docs or uploaded), infer the user's background from it — do not ask.

If no resume is in context, use `AskUserQuestion` to collect background in a single widget before scoring:
- Current role / role type (e.g., Senior Product Designer, UX Researcher)
- Years of experience
- Industry background (e.g., AI/ML tools, healthcare, fintech, B2B SaaS)
- Preferred company stage (e.g., Seed–Series B, Series C+, public)

Never ask one question at a time.

---

## Step 1 — Extract Job Info

**Mode A — URLs provided:** Use the speed-optimized extraction order below.
**Mode B — Tabs open:** Call `tabs_context_mcp`, filter to job tabs, use JavaScript extraction on already-open tabs without navigating away.

Pull 5 fields per posting: Company, Role, Compensation, Date Posted (mm/dd/yyyy), URL (plain text — never markdown links).

Maintain a `scrape_failures` list — add any URL that fails all extraction attempts. Do NOT skip or mark "Cannot Score" until Step 1.6.

---

### Speed-Optimized Extraction Order

**Step 1a — Non-LinkedIn URLs: fire all WebFetch calls in parallel**

Separate URLs into two groups: LinkedIn (`linkedin.com/jobs/view/...`) and everything else. For every non-LinkedIn URL, fire WebFetch calls **simultaneously in a single message** using this prompt:

> "Extract: job title, company name, date posted (exact string), compensation/salary range, full job description including responsibilities and requirements, and team/reporting structure. Return all available details."

Do NOT navigate the browser for non-LinkedIn jobs. WebFetch is faster, sufficient for all ATS platforms (Greenhouse, Ashby, Lever, YC), and avoids sequential wait times.

**Step 1b — LinkedIn URLs: browser extraction with fast-timeout logic**

For each LinkedIn URL, navigate to it and immediately check `document.body.innerText.length` without waiting:

```javascript
({ len: document.body.innerText.length, hasContent: document.body.innerText.includes('About the job') })
```

- If `len > 4000` and `hasContent` is true → extract immediately using the LinkedIn JS snippet below.
- If `len ≤ 4000` → wait **2 seconds**, then check once more.
- If still `len ≤ 4000` after the 2s check → **fall back to WebFetch** on the LinkedIn URL directly (skip Jina). WebFetch on LinkedIn often surfaces the job description even when the browser hasn't fully rendered.
- Do not wait longer than 2 seconds total before switching to the WebFetch fallback.

**LinkedIn browser JS (only when body has loaded):**
```javascript
({
  title:       document.querySelector('h1')?.innerText?.trim(),
  company:     document.querySelector('[class*="company-name"], .job-details-jobs-unified-top-card__company-name')?.innerText?.trim(),
  datePosted:  (() => { try { const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)).find(d => d.datePosted); return ld?.datePosted; } catch(e) { return null; } })() || document.querySelector('time[datetime]')?.getAttribute('datetime'),
  dateText:    (() => { const t = document.body.innerText; const m = t.match(/(\d+\s+(?:day|week|month|hour)s?\s+ago|reposted\s+\d+\s+(?:day|week|month|hour)s?\s+ago)/i); return m?.[0]; })(),
  comp:        (() => { const t = document.body.innerText; const m = t.match(/\$[\d,]+[KkMm]?\/yr\s*[-–]\s*\$[\d,]+[KkMm]?\/yr/i); return m?.[0]; })(),
  description: document.body.innerText.substring(0, 8000),
  pageTitle:   document.title
})
```

**Other platform JS snippets (used only if WebFetch fails for non-LinkedIn):**

Ashby (`jobs.ashbyhq.com/...`):
```javascript
({
  title:       document.querySelector('h1')?.innerText?.trim(),
  comp:        document.querySelector('[class*="compensation"], [class*="salary"], [class*="pay"]')?.innerText?.trim(),
  datePosted:  (() => { try { const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)).find(d => d.datePosted); return ld?.datePosted; } catch(e) { return null; } })() || document.querySelector('[class*="posted"], [class*="date"]')?.innerText?.trim(),
  description: document.querySelector('[class*="posting-content"], [class*="prose"], main article')?.innerText?.trim(),
  pageTitle:   document.title
})
```

Greenhouse (`job-boards.greenhouse.io/...`):
```javascript
({
  title:       document.querySelector('h1')?.innerText?.trim(),
  datePosted:  (() => { try { const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)).find(d => d.datePosted); return ld?.datePosted; } catch(e) { return null; } })(),
  description: document.querySelector('#content')?.innerText?.trim(),
  fillDate:    [...document.querySelectorAll('p')].find(p => p.innerText.includes('fill by'))?.innerText?.trim(),
  pageTitle:   document.title
})
```

YC (`ycombinator.com/companies/.../jobs/...`):
```javascript
({
  title:       document.querySelector('h1')?.innerText?.trim(),
  comp:        document.querySelector('[class*="salary"], [class*="compensation"]')?.innerText?.trim(),
  equity:      document.querySelector('[class*="equity"]')?.innerText?.trim(),
  teamSize:    document.querySelector('[class*="team-size"], [class*="headcount"]')?.innerText?.trim(),
  datePosted:  (() => { try { const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)).find(d => d.datePosted); return ld?.datePosted; } catch(e) { return null; } })() || document.querySelector('[class*="posted"], time')?.innerText?.trim(),
  description: document.querySelector('.prose, main article')?.innerText?.trim(),
  pageTitle:   document.title
})
```

Lever (`jobs.lever.co/...`):
```javascript
({
  title:       document.querySelector('h2')?.innerText?.trim(),
  datePosted:  (() => { try { const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)).find(d => d.datePosted); return ld?.datePosted; } catch(e) { return null; } })() || document.querySelector('time[datetime]')?.getAttribute('datetime'),
  description: document.querySelector('.content')?.innerText?.trim(),
  pageTitle:   document.title
})
```

Unknown platform:
```javascript
({
  title:       document.querySelector('h1')?.innerText?.trim(),
  datePosted:  (() => { try { const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)).find(d => d.datePosted); return ld?.datePosted; } catch(e) { return null; } })() || document.querySelector('time[datetime]')?.getAttribute('datetime') || document.querySelector('[class*="posted-date"], [class*="date-posted"]')?.innerText?.trim(),
  description: document.querySelector('main')?.innerText?.trim(),
  pageTitle:   document.title
})
```

**Fallback cascade for any URL:** WebFetch (already done in Step 1a for non-LinkedIn) → Jina.ai (`https://r.jina.ai/[URL]`, skip for LinkedIn) → add to `scrape_failures` list. No retries beyond this.

---

### Step 1.6 — Paste Fallback for Failed URLs

If `scrape_failures` is not empty after all extraction attempts, use `AskUserQuestion` to collect job text — up to 4 failed jobs per widget call:

- One question per failed URL, framed as: "I couldn't access [URL]. Please paste the full job description text in the Other field so I can still score it." — replace `[URL]` with the actual failed URL in each question.
- Options: `["Skip this job"]` — user types the paste text via the Other field.

Wait for all responses before proceeding to Step 2. Use any pasted text as the job description for scoring. If the user selects "Skip this job," exclude it from scoring and note it in the pipeline context as `skipped: true`.

**End-of-task reminder:** After Step 7 (Emit Pipeline Context), if any URLs were in `scrape_failures`, print:

> ⚠ URL access issues: The following job(s) could not be automatically scraped and [were scored from user-provided text / were skipped]: [list of URLs]. Verify these postings are still active.

### Step 1.5 — Confirm Unknown Dates

After extracting all jobs, check whether `datePosted` is null or could not be determined for any posting.

**Before asking the user, attempt an HTML-source fallback** for each job with an unknown date.

Run a single Bash call that `curl`s each missing-date URL and greps the raw HTML for JSON-LD date fields. Parallelize via shell (`&` background jobs + `wait`, or a loop that fires all curls then collects).

```bash
curl -sL "<url>" | grep -oE '"datePosted"[[:space:]]*:[[:space:]]*"[^"]*"|"published_at"[[:space:]]*:[[:space:]]*"[^"]*"|"publishedDate"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1
```

Parse the matched field as mm/dd/yyyy or ISO date. This works because Ashby, Greenhouse, and most ATS platforms embed `datePosted`, `published_at`, or `publishedDate` in JSON-LD or inline JS that Jina strips but a direct curl can surface.

Do not use `WebFetch` for this fallback — its summarizer strips JSON-LD, which causes the date-extraction step to return "not found" even when the field is present in the raw HTML.

**Lever-specific exception:** Lever job pages are JS-rendered and return only CSS via direct fetch. For any `jobs.lever.co/[company]/[jobId]` URL, use the Lever public API instead:

Fetch `https://api.lever.co/v0/postings/[company]/[jobId]` and read the `createdAt` field — it is a Unix timestamp in **milliseconds**. Convert to a date with `datetime.utcfromtimestamp(createdAt / 1000)`. Example: `1773225515097 ms → 03/11/2026`.

If the date is still null after the HTML-source fallback, use `AskUserQuestion` to ask the user to manually verify. Collect all remaining unknown dates in a single widget — never one at a time.

One question per job with unknown date. Frame each as:
> "I couldn't find the posting date for **[Company] — [Role]** even after checking the page source. Can you check [URL] and let me know when it was posted? This affects the Recency score."

Wait for the user's response before proceeding to Step 2. Once dates are confirmed, use them for scoring. If the user cannot find a date either, score Recency as 0.

---

## Step 1.7 — Stale Job Gate

After all dates are resolved, compute each job's age: `today − date_posted` in full months.

If any job was posted **more than 12 months ago**, collect all stale jobs in a single `AskUserQuestion` widget (multiSelect: true):

> "These jobs were posted more than 12 months ago and are likely already filled. Select any you still want to include:"
> - One option per stale job — **label:** `[Company] — [Role]`, **description:** `Posted [Month YYYY] · [URL]`

- Jobs the user **checks**: keep in pipeline as normal.
- Jobs the user **leaves unchecked** (default unchecked): mark `status: skipped-stale`. Exclude from scoring, the Sheets log, and all downstream steps. Still note them in the PIPELINE CONTEXT.
- If **no jobs** are stale → skip this widget entirely (no interruption).
- If **all jobs** are stale → still show the widget (never auto-skip everything without asking).

---

## Step 1.8 — Cache JD Text for Downstream Skills

For every job that survived Steps 1.5 and 1.7 (i.e. `status: scored`), write the cleaned plain-text JD to a file in `/tmp/` so `skills/analyze-resume.md` can read it without re-hitting the job board.

**File path:** `/tmp/jd_<slug>.txt`, where `<slug>` is built from company + role + a short URL hash:

```python
import re, hashlib

def jd_slug(company: str, role: str, url: str) -> str:
    def sluggify(s):
        return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:40]
    h = hashlib.md5(url.encode()).hexdigest()[:6]
    return f"{sluggify(company)}_{sluggify(role)}_{h}"
```

Example: `/tmp/jd_objection_agentic-product-designer_9f2b3a.txt`

**What to write:** the fully-extracted plain-text JD you used for scoring — not raw HTML, not WebFetch markdown chrome. If the text came from the Step 1.6 paste fallback, write the pasted text. If multiple routes produced text (WebFetch + Jina + curl), use the most complete version.

**Record the path** in each job's entry so the Step 7 PIPELINE CONTEXT yaml can carry it — see the `jd_file:` field in Step 7's schema.

Skip this step for any job with `status: skipped-stale` or `status: skipped-hard-filter` — those jobs never reach analyze-resume.

---

## Step 2 — Global Preferences

Resolve `global_context` in this order — the **first** source that yields all three values (`portfolio_url`, `location_filter`, `hard_skips`) wins, and the remaining checks are skipped:

1. **Inline pre-pass in this skill's invocation prompt.** If the caller (typically `run-pipeline.md` Step 1) supplied a fenced block of the form:
   ```
   ## Pre-resolved global_context (use directly, do not re-prompt)
   portfolio_url: <value>
   location_filter: <value>
   hard_skips: <value>
   ```
   parse those three values verbatim and proceed to Step 2.5. Do NOT show the widget.
2. **`--- PIPELINE CONTEXT ---` block from `gather-context`** in conversation history. If found, use its `global_context` values directly and proceed to Step 2.5.
3. **Fallback:** follow all instructions in `skills/gather-context.md` **Step 1 only** — skip its Step 2 (per-job gap questions are handled in Step 2.5 below, after JD extraction).

**Apply hard_skips immediately:** Matching jobs are auto-scored 0, marked `status: skipped-hard-filter`, excluded from the Sheets log and all downstream steps. Show them at the bottom of the scoring table flagged "⛔ Hard skip."

**Apply location_filter immediately:** Jobs explicitly requiring onsite attendance that violate the filter are marked `location_mismatch: true`, capped at Tier 2, and Team Signal capped at 1.

---

## Step 2.5 — Per-Job Gap Questions

For each job that passed the stale and hard-skip gates, compare the JD requirements to the resume and identify the **single most impactful gap** — the requirement where the user's context would most change the score or the downstream resume/outreach output. Only generate a question if the gap is material (would plausibly shift Role Match or Industry Fit by ≥1 point, or surface a concrete portfolio or outreach angle).

**Good questions** (specific, JD-derived, actionable):
- `"[Acme AI — Lead Designer] JD requires Framer + motion design, which isn't on your resume. Any relevant motion work in your portfolio?"`
- `"[Lumen Education — Sr. Designer] Role emphasizes owning mixed-methods research solo. Does your portfolio show generative research leadership?"`
- `"[Orbit Labs — Product Designer] JD says 'ship what you design' and lists HTML/CSS. Should frontend dev be listed on your resume?"`
- `"[Nimbus — Founding Designer] Wants brand + visual identity ownership from day one. Any brand work beyond product UI to mention?"`

**Skip the question** if the answer is already clear from the resume, or if the question is too generic to change the score (e.g. "Are you comfortable in fast-paced environments?").

**Batching:** Group up to 4 jobs per `AskUserQuestion` call (one question per job). For N jobs with material gaps:
- ≤4 jobs with gaps → 1 widget call
- 5–8 → 2 widget calls
- 9–12 → 3 widget calls

If no jobs have material gap questions, skip this step entirely (no interruption). "Material gap" means a JD requirement that would plausibly shift Role Match or Industry Fit by ≥1 point, or surface a specific portfolio or outreach angle — err on the side of asking when in doubt. Auto mode does NOT lower this threshold or suppress the widget; it is a skill-mandated collection step, not a routine confirmation.

Each question in the widget:
- **header:** Company name (12 chars max, truncate if needed)
- **question:** The specific JD-derived question, framed as: `"[Company — Role] [gap description and ask]"`
- `multiSelect: false`
- **options:** Dynamically generated per question. Before showing the widget, Claude scans the resume and portfolio (via `global_context.portfolio_url`) and infers specific items that could address the gap:
  - Up to 2 specific options, e.g.: `"[Case study name] in portfolio"` (description: `"at <portfolio URL from USER_CONFIG.md> — no typing needed"`) or `"[Role/project] at [Company] — transferable"` (description: `"Select to flag as relevant context"`)
  - `"Other context"` — description: `"I'll describe in the Other field"`
  - `"Genuine gap — nothing to add"`
- If no specific items can be inferred, fall back to: `"Something not listed — Other field"` / `"Genuine gap — nothing to add"`.
- Selecting a specific inferred option = that item is confirmed as relevant context; Claude incorporates it into gap_context automatically without requiring the user to type.
- Claude interpretation: specific portfolio option → reference in outreach hooks; specific resume option → surface/strengthen in resume bullets; "Other context" → read Other field; "Genuine gap" → treat as unaddressed gap.

**After collecting all answers**, store the selected item per job as `gap_context`. If "Genuine gap — nothing to add" is selected (or Q1 was omitted), set `gap_context: "none"`. Jobs with no material gap get `gap_context: "none"`.

---

## Step 3 — Score Each Job (0–3 per dimension, max 15)

Be honest — default to lower score when info is missing.

**Role Match** — title, responsibilities, seniority
- 3: Exact title match, responsibilities mirror past work
- 2: Slightly off title, meaningful overlap
- 1: Different title, somewhat related
- 0: Fundamentally different or missing key specializations

If `gap_context` is set for this job with a substantive user answer (not "nothing to add"), incorporate it: relevant context that addresses a gap (e.g., portfolio work not on resume, adjacent experience) can raise Role Match by up to +1 point.

**Industry Fit** — product category, user base, business model
- 3: Exact same space
- 2: Adjacent domain, shared behavior patterns
- 1: Different industry but patterns transfer
- 0: Steep domain knowledge gap

**Company Stage** — headcount, funding, JD language
- 3: Same headcount magnitude AND funding stage as where user has thrived
- 2: One step away
- 1: Noticeable but bridgeable
- 0: Completely different operating environment

**Team Signal** — reporting line, team size, design culture
- 3: Reports to Head/VP Design; design systems, research culture mentioned
- 2: Reports to a designer; design mentioned meaningfully
- 1: Reports to PM or engineer; design feels secondary
- 0: First designer hire, no design leadership

**Recency** — datePosted from JSON-LD, LinkedIn text, Greenhouse fillDate
- 3: 1–3 days ago
- 2: 4–7 days ago
- 1: 1–2 weeks ago
- 0: 2+ weeks ago, no date, or stale

---

## Step 4 — Assign Tier

| Total Score | Tier |
|-------------|------|
| 11–15 | Tier 1 — High Fit |
| 7–10 | Tier 2 — Stretch Fit |
| 0–6 | Tier 3 — Speculative |

---

## Step 5 — Output Scoring Table

**Summary Table** (Tier 1 → 2 → 3, score descending within tier). Dates in mm/dd/yyyy. URLs as plain text only.

| Company | Role | Compensation | Date Posted | URL | Tier |
|---------|------|-------------|-------------|-----|------|

Do NOT add a "Reasoning" column here — the one-sentence reason is written once to the Sheets `Reason / Score summary` column in Step 6, and duplicating it in chat is wasted generation. Do NOT output full per-job breakdown blocks in chat either; those go to the Sheets Breakdown column only (see Step 6).

End with a 2–3 sentence priority summary: which Tier 2s are closest to Tier 1, where to focus energy this week.

---

## Step 6 — Log to Google Sheets

After presenting the scoring table, write and execute `/tmp/log_jobs.py`:

```python
import subprocess, json, sys, re

SPREADSHEET_ID = "..."   # Job Tracker Google Sheets ID from USER_CONFIG.md
TAB = "..."              # Sheet tab from USER_CONFIG.md
# Columns [Company]–[Reason]: Company | Role | Compensation | Date Posted | Job Post URL | Tier | Reason
# (use column letters from USER_CONFIG.md; convert letter to 0-based index: ord(letter) - ord('A'))
# Column [Breakdown]: Full Breakdown (bullet points, dimension labels bolded inline)

jobs = [
    # Fill in from scoring table — one list per job, matching column order above.
    # ORDER: Tier 1 first (score descending), then Tier 2 (score descending), then Tier 3 (score descending).
]

# Full breakdown text for each job — same order as `jobs` (Tier 1 → 2 → 3).
# Format each entry as:
#   • Role Match: X/3 — sentence.\n• Industry Fit: ...\n...\n⚠ Watch out: ...\n→ Action: ...
breakdowns = [
    # One multi-line string per job
]

BOLD_LABELS = [
    "Role Match:", "Industry Fit:", "Company Stage:",
    "Team Signal:", "Recency:", "⚠ Watch out:", "→ Action:",
]

def strip_keyring(s):
    return '\n'.join(l for l in s.split('\n') if not l.startswith('Using keyring'))

def make_text_format_runs(text, bold_phrases):
    """Return textFormatRuns that bold each occurrence of bold_phrases in text."""
    positions = []
    for phrase in bold_phrases:
        for m in re.finditer(re.escape(phrase), text):
            positions.append((m.start(), m.end()))
    positions.sort()
    runs = []
    last_end = 0
    for start, end in positions:
        if start > last_end:
            runs.append({"startIndex": last_end, "format": {"bold": False}})
        runs.append({"startIndex": start, "format": {"bold": True}})
        last_end = end
    if last_end < len(text):
        runs.append({"startIndex": last_end, "format": {"bold": False}})
    # Drop leading non-bold run at index 0 (implied default)
    if runs and runs[0]["startIndex"] == 0 and not runs[0]["format"]["bold"]:
        runs = runs[1:]
    return runs

# Find next empty row in Company column (from USER_CONFIG.md)
COL_COMPANY = "..."      # Company column letter from USER_CONFIG.md
COL_REASON  = "..."      # Reason column letter from USER_CONFIG.md (last job data column)
COL_BREAKDOWN = "..."    # Breakdown column letter from USER_CONFIG.md
COL_COMPANY_IDX   = ord(COL_COMPANY) - ord('A')
COL_REASON_IDX    = ord(COL_REASON) - ord('A')
COL_BREAKDOWN_IDX = ord(COL_BREAKDOWN) - ord('A')

r = subprocess.run(
    ["gws", "sheets", "spreadsheets", "values", "get",
     "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID, "range": f"{TAB}!{COL_COMPANY}:{COL_COMPANY}"})],
    capture_output=True, text=True
)
if r.returncode != 0:
    print(f"Error reading sheet: {r.stderr}", file=sys.stderr)
    sys.exit(1)

data = json.loads(strip_keyring(r.stdout))
next_row = len(data.get("values", [])) + 1  # 1-indexed, first empty row
write_range = f"{TAB}!{COL_COMPANY}{next_row}:{COL_REASON}{next_row + len(jobs) - 1}"

# Write job data columns
result = subprocess.run(
    ["gws", "sheets", "spreadsheets", "values", "update",
     "--params", json.dumps({
         "spreadsheetId": SPREADSHEET_ID,
         "range": write_range,
         "valueInputOption": "USER_ENTERED"
     }),
     "--json", json.dumps({"values": jobs})],
    capture_output=True, text=True
)
if result.returncode != 0:
    print(f"Error writing to sheet: {result.stderr}", file=sys.stderr)
    sys.exit(1)

# Get sheetId for formatting
r2 = subprocess.run(
    ["gws", "sheets", "spreadsheets", "get",
     "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID})],
    capture_output=True, text=True
)
sheet_id = next(
    s["properties"]["sheetId"]
    for s in json.loads(strip_keyring(r2.stdout))["sheets"]
    if s["properties"]["title"] == TAB
)

fmt_requests = [
    # Job data columns: font size 10, not bold
    {
        "repeatCell": {
            "range": {
                "sheetId": sheet_id,
                "startRowIndex": next_row - 1,
                "endRowIndex": next_row - 1 + len(jobs),
                "startColumnIndex": COL_COMPANY_IDX,
                "endColumnIndex": COL_REASON_IDX + 1
            },
            "cell": {
                "userEnteredFormat": {
                    "textFormat": {"bold": False, "fontSize": 10}
                }
            },
            "fields": "userEnteredFormat.textFormat.bold,userEnteredFormat.textFormat.fontSize"
        }
    }
]

# Column G: full breakdowns with inline bold on dimension labels
for i, breakdown in enumerate(breakdowns):
    row_idx = next_row - 1 + i  # 0-indexed
    runs = make_text_format_runs(breakdown, BOLD_LABELS)
    cell = {
        "userEnteredValue": {"stringValue": breakdown},
        "userEnteredFormat": {
            "wrapStrategy": "WRAP",
            "textFormat": {"fontSize": 10, "bold": False}
        }
    }
    if runs:
        cell["textFormatRuns"] = runs
    fmt_requests.append({
        "updateCells": {
            "range": {
                "sheetId": sheet_id,
                "startRowIndex": row_idx,
                "endRowIndex": row_idx + 1,
                "startColumnIndex": COL_BREAKDOWN_IDX,
                "endColumnIndex": COL_BREAKDOWN_IDX + 1
            },
            "rows": [{"values": [cell]}],
            "fields": "userEnteredValue,textFormatRuns,userEnteredFormat.wrapStrategy,userEnteredFormat.textFormat"
        }
    })

r3 = subprocess.run(
    ["gws", "sheets", "spreadsheets", "batchUpdate",
     "--params", json.dumps({"spreadsheetId": SPREADSHEET_ID}),
     "--json", json.dumps({"requests": fmt_requests})],
    capture_output=True, text=True
)
if r3.returncode != 0:
    print(f"Error applying formatting (breakdown column bold labels): {r3.stderr}", file=sys.stderr)
    sys.exit(1)

print(f"✓ {len(jobs)} job(s) logged at rows {next_row}–{next_row + len(jobs) - 1} ({COL_COMPANY}–{COL_REASON} + {COL_BREAKDOWN} breakdowns).")
```

Confirm with "✓ N jobs logged to your tracker sheet." If it fails, report error and continue.

---

## Step 7 — Emit Pipeline Context

Run `date +%H:%M` via the Bash tool and store as `STEP_END_TIME`. Estimate output tokens by counting the characters in all text you produced during this skill and dividing by 4.

**ALWAYS** output the following block in a **fenced code block** (` ```yaml `) — never skip or omit it, even if logging failed:

```yaml
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
    jd_file: [/tmp/jd_<slug>.txt path from Step 1.8, or "none" if job was skipped]
    # status: omit entirely for normal scored jobs. Only include when skipped:
    # status: skipped-stale        (for jobs opted out at the Step 1.7 stale gate)
    # status: skipped-hard-filter  (for jobs caught by the Step 2 hard_skips filter)
  [repeat for each job]
sheets_logged: [true|false]
step_start_time: [HH:MM or "N/A"]
step_end_time: [HH:MM or "N/A"]
step_duration_min: [estimated minutes elapsed or "N/A"]
output_tokens_est: [chars of output ÷ 4, rounded]
--- END PIPELINE CONTEXT ---
```

**Removed from a prior schema version** (do not re-introduce):
- `location_mismatch` — downstream skills don't read it; the location-violation effect is already baked into `tier` and `score` via the Step 2 filter, so the field was pure duplication in main context.

---

## Step 8 — Telemetry (Optional)

Read USER_CONFIG.md. If "Share anonymous pipeline metrics" is `true` and "PostHog key" is not `none`, run the following via Bash. Replace placeholders with values from USER_CONFIG.md and the PIPELINE CONTEXT block above. Never include job titles, company names, URLs, or resume content.

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
      "pipeline_step": "rate-and-add-jobs",
      "duration_min": <step_duration_min>,
      "output_tokens_est": <output_tokens_est>,
      "job_count": <total jobs scored, excluding skipped>,
      "tier_1_count": <Tier 1 count>,
      "tier_2_count": <Tier 2 count>,
      "tier_3_count": <Tier 3 count>,
      "stale_skipped": <stale-skipped count>,
      "sheets_logged": <true or false>
    }
  }' > /dev/null
```
