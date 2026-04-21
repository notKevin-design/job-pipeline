import { execSync } from 'child_process'

function stripKeyring(s: string): string {
  return s
    .split('\n')
    .filter((l) => !l.startsWith('Using keyring'))
    .join('\n')
}

export async function POST(request: Request) {
  let firstName: string
  try {
    const body = await request.json()
    firstName = (body.first_name ?? '').toString().trim()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const templateId = process.env.TEMPLATE_SHEET_ID
  if (!templateId) {
    return Response.json(
      { error: 'TEMPLATE_SHEET_ID is not configured on the server.' },
      { status: 500 }
    )
  }

  const newName = firstName
    ? `Job Pipeline — ${firstName}`
    : 'Job Pipeline'

  const env = { ...process.env, PATH: `/usr/local/bin:${process.env.PATH ?? ''}` }

  try {
    let raw: string
    const cmd = `gws drive files copy --params '${JSON.stringify({ fileId: templateId })}' --json '${JSON.stringify({ name: newName })}'`
    try {
      raw = execSync(cmd, { timeout: 20000, stdio: 'pipe', env }).toString()
    } catch (execErr: unknown) {
      const e = execErr as { stdout?: Buffer | string }
      if (e.stdout) {
        raw = e.stdout.toString()
      } else {
        throw execErr
      }
    }

    const cleaned = stripKeyring(raw).trim()
    if (!cleaned) {
      return Response.json(
        { error: 'gws returned an empty response. Make sure gws is authenticated (`gws auth login`).' },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(cleaned)
    const result = parsed?.result ?? parsed
    if (result?.error) {
      return Response.json({ error: `gws error: ${JSON.stringify(result.error)}` }, { status: 500 })
    }
    if (!result?.id) {
      return Response.json({
        error: `Unexpected gws response shape. Keys: [${Object.keys(result ?? {}).join(', ')}]`,
      }, { status: 500 })
    }

    const id = result.id as string
    const webViewLink = (result.webViewLink as string | undefined) ?? `https://docs.google.com/spreadsheets/d/${id}/edit`

    return Response.json({ success: true, id, name: newName, webViewLink })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Failed to copy template sheet: ${msg}` }, { status: 500 })
  }
}
