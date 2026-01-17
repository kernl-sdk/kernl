/**
 * Snapshot types for file diffs
 */
export namespace Snapshot {
  export interface FileDiff {
    file: string
    before: string
    after: string
    additions: number
    deletions: number
  }

  export interface Hunk {
    oldStart: number
    oldLines: number
    newStart: number
    newLines: number
    lines: string[]
  }
}
