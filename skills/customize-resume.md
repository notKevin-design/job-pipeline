# Skill: customize-resume

Resume customization and Google Drive save for a single job application. Modifies only the summary, PROFESSIONAL EXPERIENCE bullets, and KEY SKILLS sections to preserve all original formatting.

Triggers on: "customize my resume", "tailor my resume for this job", "save my resume to Drive", or when the orchestrator calls this step.

---

## Resolve Inputs

**First action:** Run `date +%H:%M` via the Bash tool and store the result as `STEP_START_TIME`. Do this before anything else in this skill.

Load `USER_CONFIG.md` if not already in context. Use its values for all IDs, column references, user name, and resume section anchors below.

**gws check:** Run `which gws` and `gws auth status`. If either fails, stop immediately: "⚠ gws CLI is not installed or not authenticated. Run `/setup` first."

Check conversation history for `global_context` in any `--- PIPELINE CONTEXT ---` block. If not found, follow all instructions in `skills/gather-context.md` **Step 1 only**.

Scan conversation history for the most recent `--- PIPELINE CONTEXT ---` block from `analyze-resume`. If found, extract silently: company, role, job_url, gap_summary, ats_keywords_missing. Do not re-announce.

If no `analyze-resume` context is found, use `AskUserQuestion` to collect in a single widget:
- Job posting URL or plain JD text
- Top 3–5 gaps (ask user to describe or paste gap analysis output)
- Resume (load from context or fetch using the Resume Google Doc ID from USER_CONFIG.md)

Once resolved, proceed directly — no "shall I continue?" prompt.

---

## Phase 3 — Resume Revision

- Preserve original voice — rephrase only to strengthen impact or close gaps
- Quantify everything: "Accomplished [X] as measured by [Y], by doing [Z]." Flag missing metrics as [VERIFY: suggested placeholder]
- Embed JD keywords naturally — no stuffing
- Front-load impact: strong action verb + business outcome
- Remove "responsible for," "helped with," "worked on"
- No dash characters in body — use periods, pipes ( | ), or colons
- Plain text, ALL CAPS section headers, one page only
- Do NOT prefix bullet lines with a period or any symbol — each bullet line starts directly with the action verb, no `. ` or `- ` prefix

**Sections to modify (all others stay exactly as-is):**
- **Summary paragraph** — rewrite to lead with the most relevant angle for this job; bold phrases that show impact and JD alignment so a hiring manager can scan in 5 seconds
- **PROFESSIONAL EXPERIENCE bullet points** — bold phrases showing measurable impact and direct JD alignment; rephrase only where needed to strengthen or close a gap
- **KEY SKILLS** — reorder to front-load skills most relevant to this JD; fix any redundant entries

**Do NOT output the full revised resume text.** Revise internally, then proceed directly to Phase 3.5 to save to Google Drive.

After saving, output in this order:

📄 Saved to Drive: [URL]

**Change Log:**
1. **[Section name]** — [what changed and why it closes a gap or strengthens JD alignment]
2. **[Section name]** — [what changed and why]
3. **[Section name]** — [what changed and why]
(one numbered line per changed section; bold the section name so the user can scan which parts of the resume were touched at a glance)

**Remaining Risks** (2–3 items):
- [risk + concrete suggestion]
- [risk + concrete suggestion]

---

## Phase 3.5 — Save Resume to Google Drive

**Drive duplicate check:** Before saving, run:
```bash
gws drive files list --params '{"q": "name contains \"[Full Name]_Resume_[Company]\" and \"[Drive Folder ID]\" in parents and trashed=false", "fields": "files(id,name,webViewLink)"}'
```
Replace `[Full Name]` and `[Drive Folder ID]` with values from USER_CONFIG.md, and `[Company]` with the company name. If a file is found, use `AskUserQuestion`:
> "A tailored resume for **[Company]** already exists in Drive: **[file name]**\n[Drive URL]\nDo you want to regenerate it, or use the existing one?"
- "Regenerate resume" — proceed with save (creates a new file alongside the existing one)
- "Use existing resume" — skip the save, emit pipeline context with the existing Drive URL

**Method: copy the source doc, then surgically modify only the 3 sections above.** This preserves all fonts, sizes, line spacing, margins, and page numbers exactly.

**Before writing the script — resolve section anchors:**

The script uses `find_para(substr)` to locate paragraphs by substring match. Determine the correct anchor strings now, before filling in the script:

- **Summary anchor:** Use `summary_anchor` from USER_CONFIG.md if it is not `"none"`. Otherwise, identify the summary paragraph from the doc's paragraph list (the prose paragraph near the top describing the candidate's background — skip name, contact info, and ALL-CAPS headers) and take its first 6–8 unique words.
- **Experience anchor:** Use `experience_anchor` from USER_CONFIG.md if it is not `"none"`. Otherwise, identify the PROFESSIONAL EXPERIENCE section header (ALL-CAPS or bold heading introducing the work history) and take its first 4–6 unique words. This anchor scopes bullet searches to the correct region.
- **KEY SKILLS anchor:** Use `key_skills_anchor` from USER_CONFIG.md if it is not `"none"`. Otherwise, identify the KEY SKILLS line (pipe- or comma-separated tools/technologies list) and take its first 5 unique words.
- **`_ks_label`:** Use `key_skills_label` from USER_CONFIG.md if it is not `"none"`. Otherwise, inspect the KEY SKILLS paragraph's first `textRun` element — if `textStyle.bold` is true, that segment is the label; copy it exactly. If not bold, use `""`.
- **`BULLET_BOLDS` keys:** For each experience bullet you rewrote in Phase 3, use the first 4–6 unique words of that bullet's *original* text (from the paragraph list) as the dict key.

Write and execute `/tmp/save_resume_kit.py`:

```python
import subprocess, json, sys

SOURCE_DOC_ID = "..."   # Resume Google Doc ID from USER_CONFIG.md
FOLDER_ID     = "..."   # Resume Drive Folder ID from USER_CONFIG.md
DOC_TITLE     = "..."   # [Full Name]_Resume_[Company]_[Role] — Full Name from USER_CONFIG.md

# ── Tailored content (fill in from Phase 3 output) ───────────────────────────

NEW_SUMMARY = "..."   # rewritten summary paragraph (no trailing newline)

SUMMARY_BOLD = [
    # substrings within NEW_SUMMARY to bold — impact metrics + JD-aligned phrases
]

NEW_KEY_SKILLS = "..."  # reordered skills line (no trailing newline)

# key: unique substring identifying the bullet paragraph in the original doc
# value: list of substrings within that bullet to bold
BULLET_BOLDS = {
    "Led zero-to-one strategy": ["zero-to-one strategy, design, and evaluation",
                                  "76.5% user satisfaction", "100% safety and guardrail compliance"],
    "Designed data-intensive":  ["data-intensive", "30+ Stanford teams", "4×", "Nature Medicine"],
    "Drove product direction":  ["product direction and roadmap prioritization"],
    # add / remove entries to match this specific job's focus
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def strip_keyring(s):
    return "\n".join(l for l in s.split("\n") if not l.startswith("Using keyring"))

def gws(*cmd, body=None):
    args = ["gws"] + list(cmd)
    if body is not None:
        args += ["--json", json.dumps(body)]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr)
    out = strip_keyring(r.stdout).strip()
    return json.loads(out) if out else {}

def bold_reqs(base, text, phrases):
    reqs = []
    for phrase in phrases:
        i = text.find(phrase)
        if i == -1:
            print(f"  ⚠ phrase not found: {phrase!r}", file=sys.stderr)
            continue
        reqs.append({"updateTextStyle": {
            "range": {"startIndex": base + i, "endIndex": base + i + len(phrase)},
            "textStyle": {"bold": True}, "fields": "bold"
        }})
    return reqs

# ── 1. Copy source doc ────────────────────────────────────────────────────────
result = gws("drive", "files", "copy",
    "--params", json.dumps({"fileId": SOURCE_DOC_ID}),
    body={"name": DOC_TITLE, "parents": [FOLDER_ID]})
new_id = result["id"]

# ── 2. Read doc structure ─────────────────────────────────────────────────────
doc = gws("docs", "documents", "get", "--params", json.dumps({"documentId": new_id}))

paras = []
for elem in doc["body"]["content"]:
    if "paragraph" not in elem:
        continue
    text = "".join(e.get("textRun", {}).get("content", "")
                   for e in elem["paragraph"].get("elements", []))
    paras.append({"start": elem["startIndex"], "end": elem["endIndex"], "text": text})

def find_para(substr):
    for p in paras:
        if substr in p["text"]:
            return p
    raise ValueError(f"Paragraph not found: {substr!r}")

# ── 3. Build batchUpdate requests (end → start to avoid index drift) ──────────
requests = []

# KEY SKILLS (last in doc → process first)
# Insert the full line including the "Design & Research:" label, then explicitly
# bold the label and un-bold the skills — prevents the skills from inheriting
# the label's bold formatting from the insertion point.
ks = find_para("...")   # KEY SKILLS line anchor from USER_CONFIG.md
_ks_label = "..."       # KEY SKILLS bold label from USER_CONFIG.md (or "" if none)
_ks_full = (_ks_label + " " if _ks_label else "") + NEW_KEY_SKILLS
requests.append({"deleteContentRange": {"range": {"startIndex": ks["start"], "endIndex": ks["end"] - 1}}})
requests.append({"insertText": {"location": {"index": ks["start"]}, "text": _ks_full}})
requests.append({"updateTextStyle": {
    "range": {"startIndex": ks["start"], "endIndex": ks["start"] + len(_ks_label)},
    "textStyle": {"bold": True}, "fields": "bold"
}})
requests.append({"updateTextStyle": {
    "range": {"startIndex": ks["start"] + len(_ks_label), "endIndex": ks["start"] + len(_ks_full)},
    "textStyle": {"bold": False}, "fields": "bold"
}})

# Bullet bold highlights (process end → start within experience section)
for key in reversed(list(BULLET_BOLDS.keys())):
    b = find_para(key)
    requests += bold_reqs(b["start"], b["text"], BULLET_BOLDS[key])

# Summary (replace + bold — process last since it's earliest in doc)
s = find_para("...")   # Summary paragraph anchor from USER_CONFIG.md
requests.append({"deleteContentRange": {"range": {"startIndex": s["start"], "endIndex": s["end"] - 1}}})
requests.append({"insertText": {"location": {"index": s["start"]}, "text": NEW_SUMMARY}})
requests += bold_reqs(s["start"], NEW_SUMMARY, SUMMARY_BOLD)

# ── 4. Apply all changes ──────────────────────────────────────────────────────
gws("docs", "documents", "batchUpdate",
    "--params", json.dumps({"documentId": new_id}),
    body={"requests": requests})

print(f"https://docs.google.com/document/d/{new_id}/edit")
```

Display as: `📄 Saved to Drive: [URL]`

If it fails, report the error and continue to the next step without blocking.

---

## Emit Pipeline Context

Run `date +%H:%M` via the Bash tool and store as `STEP_END_TIME`. Estimate output tokens by counting the characters in all text you produced during this skill and dividing by 4.

**ALWAYS** output the following block in a **fenced code block** (` ```yaml `) — never skip or omit it, even if the save failed:

```yaml
--- PIPELINE CONTEXT ---
skill: customize-resume
drive_url: [Google Doc URL or "save failed"]
step_start_time: [HH:MM or "N/A"]
step_end_time: [HH:MM or "N/A"]
step_duration_min: [estimated minutes elapsed or "N/A"]
output_tokens_est: [chars of output ÷ 4, rounded]
--- END PIPELINE CONTEXT ---
```

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
      "pipeline_step": "customize-resume",
      "duration_min": <step_duration_min>,
      "output_tokens_est": <output_tokens_est>,
      "drive_save_succeeded": <true if drive_url is not "save failed", else false>,
      "duplicate_found": <true if Drive duplicate check found an existing file, else false>
    }
  }' > /dev/null
```
