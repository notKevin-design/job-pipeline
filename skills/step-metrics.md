# Skill: step-metrics

Aggregates per-step token usage and time duration from completed pipeline skills. Outputs a summary table and writes a CSV report to `/tmp/`.

Triggers on: "show me step metrics", "how many tokens did we use", "show token usage", "pipeline report", "how long did each step take", or automatically at the end of `run-pipeline.md` Step 4.

Can be invoked mid-pipeline to show progress so far.

---

## How This Works

Each skill in this pipeline emits a `--- PIPELINE CONTEXT ---` block when it completes. That block includes four metrics fields logged by the skill itself:

- `step_start_time` — time noted at the beginning of the skill
- `step_end_time` — time noted at the end of the skill
- `step_duration_min` — elapsed minutes between start and end
- `output_tokens_est` — characters of output produced by the skill ÷ 4 (rough approximation)

This skill reads those fields from all PIPELINE CONTEXT blocks in conversation history and aggregates them into a report.

All numbers are labeled "(est.)" — actual token counts depend on the model's tokenizer and include input tokens that are not tracked here.

---

## Step 1 — Scan Conversation History

Find all `--- PIPELINE CONTEXT ---` / `--- END PIPELINE CONTEXT ---` blocks in the conversation. For each block, extract:
- `skill` name
- `step_start_time`, `step_end_time`, `step_duration_min`
- `output_tokens_est`
- Which job it ran for (from `company` field if present, else "all jobs")
- Status: ✓ completed / ✗ failed (infer from drive_url "save failed" or sheets_logged false)

Build an ordered list of completed steps, including repeats per job for multi-job runs.

---

## Step 2 — Compute Cumulative Totals

For each step in order, compute:
- **Cumulative output tokens (est.)** — running sum of `output_tokens_est` across all steps so far
- **Total duration** — sum of all `step_duration_min` values where available

---

## Step 3 — Output Summary Table

Print the following table (one row per step execution, including repeats per job):

| Step | Job | Output Tokens (est.) | Cumulative (est.) | Duration (min) | Start | End | Status |
|------|-----|----------------------|-------------------|----------------|-------|-----|--------|
| rate-and-add-jobs | all N jobs | X | X | X | HH:MM | HH:MM | ✓ |
| analyze-resume | [Company] | X | X | X | HH:MM | HH:MM | ✓ |
| customize-resume | [Company] | X | X | X | HH:MM | HH:MM | ✓ |
| linkedin-outreach | [Company] | X | X | X | HH:MM | HH:MM | ✓ |
| **TOTAL** | — | **X** | **X** | **X min** | — | — | — |

After the table, output two ASCII bar charts followed by an Optimization Flags section.

**Bar chart rules (apply to both):**
- Bar width = 20 characters. Filled chars = round((step_value / max_step_value) × 20). Empty = 20 − filled.
- Steps in execution order. Exact value right-aligned after the bar.
- Steps with N/A value: show empty bar `│░░░░░░░░░░░░░░░░░░░░│` with "N/A" label.

**Chart 1 — Token Consumption (output tokens est.)**
```
Token Consumption (output tokens est.)
──────────────────────────────────────────────────────
rate-and-add-jobs        │████████░░░░░░░░░░░░│   950
analyze-resume  (Job 1)  │████████████████████│ 1,200
customize-resume (Job 1) │██████░░░░░░░░░░░░░░│   700
linkedin-outreach (Job 1)│████░░░░░░░░░░░░░░░░│   400
──────────────────────────────────────────────────────
TOTAL                                           3,250
```

**Chart 2 — Time per Step (min est.)**
```
Time per Step (min est.)
──────────────────────────────────────────────────────
rate-and-add-jobs        │████████████░░░░░░░░│  3 min
analyze-resume  (Job 1)  │████████████████████│  5 min
customize-resume (Job 1) │████░░░░░░░░░░░░░░░░│  2 min
linkedin-outreach (Job 1)│████░░░░░░░░░░░░░░░░│  2 min
──────────────────────────────────────────────────────
TOTAL                                           12 min
```

**Optimization Flags** — flag the top token consumer, top time consumer, and compute token density (output_tokens_est ÷ step_duration_min) for all steps with valid duration. Sort density descending. Skip steps with N/A duration.

Format:
```
Optimization Flags:
⚡ Most tokens:  [step] ([Job]) — X tokens  → try: [1-line suggestion]
⏱ Most time:    [step] ([Job]) — X min     → try: [1-line suggestion]

📉 Token density (tokens/min) — lower = more wait time on external I/O; higher = more text generation:
   [step] (Job N)  │ XXX/min  ← [label: "mostly text generation" / "Q&A loop adds wait" / "API + Sheets overhead"]
   ...sorted descending
```

Density interpretation guide (use when writing labels):
- density > 400/min → mostly text generation → optimize by tightening output verbosity
- density 200–400/min → mix of generation + I/O wait
- density < 200/min → mostly waiting on external services (scraping, API, Sheets) → optimize by parallelizing I/O

---

## Step 4 — Write CSV

Write and execute `/tmp/write_step_metrics.py`:

```python
import csv, datetime

rows = [
    # Fill in from Step 1 data — one list per row:
    # ["step_name", "job", "output_tokens_est", "cumulative_tokens_est", "duration_min", "start_time", "end_time", "status"]
    # Example:
    # ["rate-and-add-jobs", "all jobs", 900, 900, 3, "14:02", "14:05", "completed"],
    # ["analyze-resume", "Acme Corp", 700, 1600, 5, "14:05", "14:10", "completed"],
]

filename = f"/tmp/step_metrics_{datetime.date.today().isoformat()}.csv"
with open(filename, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Step", "Job", "Output Tokens (est)", "Cumulative Tokens (est)", "Duration (min)", "Start", "End", "Status"])
    writer.writerows(rows)

print(f"Step metrics written to {filename}")
```

Confirm with the full filename written (e.g., `Step metrics written to /tmp/step_metrics_2026-03-13.csv`).

---

## Limitations

- **Output tokens only:** Input tokens (the full conversation context fed into each step) are not tracked here — they grow invisibly across the session and can be much larger than output tokens.
- **Estimates, not actuals:** `chars ÷ 4` is a rough approximation. Code blocks, non-English text, and special characters tokenize differently.
- **Time is self-reported:** `step_duration_min` is estimated by the model at the end of each skill, not measured by a clock. Treat it as a ballpark.
- For precise counts, use the Anthropic Console's usage dashboard or the API's `usage` response fields.
