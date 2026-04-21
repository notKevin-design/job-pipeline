export async function GET() {
  return Response.json({ path: process.cwd() })
}
