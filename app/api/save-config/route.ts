import fs from 'fs'
import path from 'path'
import { generateConfig } from '@/lib/generateConfig'
import type { WizardConfig } from '@/lib/types'

const REQUIRED_FIELDS: (keyof WizardConfig)[] = [
  'full_name',
  'first_name',
  'email',
  'resume_doc_id',
  'sheets_id',
  'drive_folder_id',
  'sheet_tab',
  'col_company',
  'col_role',
  'col_compensation',
  'col_date_posted',
  'col_url',
  'col_tier',
  'col_reason',
  'col_breakdown',
  'col_inmail',
  'col_connection_note',
]

export async function POST(request: Request) {
  let config: Partial<WizardConfig>
  try {
    const body = await request.json()
    config = body.config
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const missing = REQUIRED_FIELDS.filter((f) => !config[f])
  if (missing.length > 0) {
    return Response.json(
      { success: false, error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  // Fill optional fields with "none" if absent
  const full: WizardConfig = {
    portfolio_url: 'none',
    summary_anchor: 'none',
    experience_anchor: 'none',
    key_skills_anchor: 'none',
    key_skills_label: 'none',
    ...config,
  } as WizardConfig

  try {
    const content = generateConfig(full)
    const filePath = path.join(process.cwd(), 'USER_CONFIG.md')
    fs.writeFileSync(filePath, content, 'utf8')
    return Response.json({ success: true, path: filePath })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
