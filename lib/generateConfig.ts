import type { WizardConfig } from './types'

export function generateConfig(c: WizardConfig): string {
  return `# Job Pipeline — User Configuration

Edit this file to update your config. Claude loads it at the start of every session.

---

## Identity

| Setting | Value |
|---------|-------|
| Full name | ${c.full_name} |
| First name (LinkedIn sign-off) | ${c.first_name} |
| Email | ${c.email} |
| Portfolio URL | ${c.portfolio_url} |

---

## Google IDs

| Setting | Value |
|---------|-------|
| Resume Google Doc ID | ${c.resume_doc_id} |
| Job Tracker Google Sheets ID | ${c.sheets_id} |
| Resume Drive Folder ID | ${c.drive_folder_id} |

---

## Google Sheets Structure

### Tab name

| Setting | Value |
|---------|-------|
| Sheet tab | ${c.sheet_tab} |

### Column mapping

| Field | Column |
|-------|--------|
| Company | ${c.col_company} |
| Role | ${c.col_role} |
| Compensation | ${c.col_compensation} |
| Date Posted | ${c.col_date_posted} |
| Job Post URL | ${c.col_url} |
| Tier | ${c.col_tier} |
| Reason / Score summary | ${c.col_reason} |
| Full breakdown | ${c.col_breakdown} |
| InMail | ${c.col_inmail} |
| Connection Note | ${c.col_connection_note} |

### Lookup columns

| Purpose | Column |
|---------|--------|
| Job URL (primary lookup) | ${c.col_url} |
| Company name (fallback) | ${c.col_company} |

---

## Resume Section Anchors

Used by \`customize-resume\` to locate sections in your Google Doc.

| Section | Opening string |
|---------|----------------|
| Summary paragraph | ${c.summary_anchor} |
| PROFESSIONAL EXPERIENCE section | ${c.experience_anchor} |
| KEY SKILLS line | ${c.key_skills_anchor} |
| KEY SKILLS bold label | ${c.key_skills_label} |

---

## Resume File Naming

| Setting | Value |
|---------|-------|
| Filename pattern | ${c.full_name}_Resume_[Company]_[Role] |

---

## Pipeline Telemetry (Opt-In)

Anonymous usage data (step durations, token counts, job tier distribution) helps improve this tool.
No PII, resume content, job titles, or company names are ever sent.
Set "Share anonymous metrics" to \`false\` to disable at any time.

| Setting | Value |
|---------|-------|
| Share anonymous pipeline metrics | ${c.telemetry_opt_in ?? true} |
| Anonymous user ID | ${c.anonymous_user_id ?? 'none'} |
| PostHog key | ${c.telemetry_opt_in !== false ? 'phc_wkzECB5VozutC79xVaFUgFhiL36Sf8vtoVhYVX4nzuEc' : 'none'} |
`
}
