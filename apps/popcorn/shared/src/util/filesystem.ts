import fs from "fs"
import path from "path"

export namespace Filesystem {
  export function exists(filepath: string): boolean {
    try {
      fs.accessSync(filepath)
      return true
    } catch {
      return false
    }
  }

  export function isDirectory(filepath: string): boolean {
    try {
      return fs.statSync(filepath).isDirectory()
    } catch {
      return false
    }
  }

  export function isFile(filepath: string): boolean {
    try {
      return fs.statSync(filepath).isFile()
    } catch {
      return false
    }
  }

  export function ensureDir(dir: string): void {
    fs.mkdirSync(dir, { recursive: true })
  }

  export function readText(filepath: string): string | undefined {
    try {
      return fs.readFileSync(filepath, "utf-8")
    } catch {
      return undefined
    }
  }

  export function writeText(filepath: string, content: string): void {
    const dir = path.dirname(filepath)
    ensureDir(dir)
    fs.writeFileSync(filepath, content, "utf-8")
  }

  export function remove(filepath: string): boolean {
    try {
      fs.rmSync(filepath, { recursive: true, force: true })
      return true
    } catch {
      return false
    }
  }

  export async function* up(opts: { targets: string[]; start: string }): AsyncGenerator<string> {
    let dir = opts.start
    const root = path.parse(dir).root

    while (dir !== root) {
      for (const target of opts.targets) {
        const candidate = path.join(dir, target)
        if (exists(candidate)) {
          yield dir
          break
        }
      }
      dir = path.dirname(dir)
    }
  }

  export function normalizePath(filepath: string): string {
    return path.normalize(filepath).replace(/\\/g, "/")
  }
}
