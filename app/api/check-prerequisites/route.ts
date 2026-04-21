import { execSync } from 'child_process'

export async function GET() {
  let gwsInstalled = false
  let gwsAuthenticated = false
  let gwsPath: string | undefined

  const env = { ...process.env, PATH: `/usr/local/bin:${process.env.PATH ?? ''}` }

  try {
    gwsPath = execSync('which gws', { timeout: 5000, env }).toString().trim()
    gwsInstalled = true
  } catch {
    return Response.json({ gwsInstalled: false, gwsAuthenticated: false })
  }

  try {
    execSync('gws auth status', { timeout: 5000, stdio: 'pipe', env })
    gwsAuthenticated = true
  } catch {
    gwsAuthenticated = false
  }

  const apiKeySet = Boolean(process.env.ANTHROPIC_API_KEY)

  return Response.json({ gwsInstalled, gwsAuthenticated, gwsPath, apiKeySet })
}
