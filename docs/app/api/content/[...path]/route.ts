import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = path.join('/')

  // Sanitize path to prevent directory traversal
  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const contentDir = join(process.cwd(), 'content')

  // Try direct path first, then index.mdx for folders
  const candidates = [
    join(contentDir, `${filePath}.mdx`),
    join(contentDir, filePath, 'index.mdx'),
  ]

  for (const fullPath of candidates) {
    try {
      const content = await readFile(fullPath, 'utf-8')

      // Strip the section-label span from the beginning
      const cleaned = content.replace(/^<span className="section-label">.*?<\/span>\s*\n*/m, '')

      return new NextResponse(cleaned, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    } catch {
      // Try next candidate
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
