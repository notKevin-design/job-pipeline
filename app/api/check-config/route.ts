import fs from 'fs'
import path from 'path'

export async function GET() {
  const filePath = path.join(process.cwd(), 'USER_CONFIG.md')
  const exists = fs.existsSync(filePath)
  return Response.json({ exists })
}
