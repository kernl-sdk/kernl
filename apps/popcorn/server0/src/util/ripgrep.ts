/**
 * Ripgrep utility with auto-download support.
 *
 * Provides file listing and content search using ripgrep.
 * Automatically downloads ripgrep if not found in PATH.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Global } from "@popcorn/shared/global";

const VERSION = "14.1.1";

const PLATFORM: Record<
  string,
  { platform: string; extension: string } | undefined
> = {
  "arm64-darwin": { platform: "aarch64-apple-darwin", extension: "tar.gz" },
  "arm64-linux": { platform: "aarch64-unknown-linux-gnu", extension: "tar.gz" },
  "x64-darwin": { platform: "x86_64-apple-darwin", extension: "tar.gz" },
  "x64-linux": { platform: "x86_64-unknown-linux-musl", extension: "tar.gz" },
  "x64-win32": { platform: "x86_64-pc-windows-msvc", extension: "zip" },
};

// Lazy singleton for ripgrep path
let cachedPath: string | undefined;

/**
 * Get the ripgrep binary path, downloading if necessary.
 */
async function getRipgrepPath(): Promise<string> {
  if (cachedPath) return cachedPath;

  // Check if rg is in PATH
  const systemPath = Bun.which("rg");
  if (systemPath) {
    cachedPath = systemPath;
    return systemPath;
  }

  // Check if we've already downloaded it
  const binDir = Global.Path.bin;
  const exeName = process.platform === "win32" ? "rg.exe" : "rg";
  const localPath = path.join(binDir, exeName);

  const file = Bun.file(localPath);
  if (await file.exists()) {
    cachedPath = localPath;
    return localPath;
  }

  // Download ripgrep
  await download(localPath);
  cachedPath = localPath;
  return localPath;
}

/**
 * Download and extract ripgrep.
 */
async function download(destPath: string): Promise<void> {
  const platformKey = `${process.arch}-${process.platform}`;
  const config = PLATFORM[platformKey];

  if (!config) {
    throw new Error(`Unsupported platform: ${platformKey}`);
  }

  const binDir = path.dirname(destPath);
  await fs.mkdir(binDir, { recursive: true });

  const filename = `ripgrep-${VERSION}-${config.platform}.${config.extension}`;
  const url = `https://github.com/BurntSushi/ripgrep/releases/download/${VERSION}/${filename}`;

  console.log(`[ripgrep] Downloading from ${url}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download ripgrep: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const archivePath = path.join(binDir, filename);
  await Bun.write(archivePath, buffer);

  console.log(`[ripgrep] Extracting...`);

  // Extract using system tar (works on macOS, Linux, and Windows 10+)
  const isWindows = process.platform === "win32";
  const args = isWindows
    ? ["tar", "-xzf", archivePath, "--strip-components=1", "-C", binDir]
    : [
        "tar",
        "-xzf",
        archivePath,
        "--strip-components=1",
        "-C",
        binDir,
        "--include=*/rg",
      ];

  const proc = Bun.spawn(args, {
    cwd: binDir,
    stderr: "pipe",
    stdout: "pipe",
  });

  await proc.exited;

  if (proc.exitCode !== 0) {
    const stderr = await Bun.readableStreamToText(proc.stderr);
    throw new Error(`Failed to extract ripgrep: ${stderr}`);
  }

  // Cleanup archive
  await fs.unlink(archivePath);

  // Make executable on unix
  if (!isWindows) {
    await fs.chmod(destPath, 0o755);
  }

  console.log(`[ripgrep] Installed to ${destPath}`);
}

export namespace Ripgrep {
  /**
   * Get the path to the ripgrep binary.
   */
  export async function filepath(): Promise<string> {
    return getRipgrepPath();
  }

  /**
   * List files in a directory using ripgrep.
   * Respects .gitignore and common ignore patterns.
   */
  export async function* files(input: {
    cwd: string;
    glob?: string[];
    hidden?: boolean;
    follow?: boolean;
    maxDepth?: number;
  }): AsyncGenerator<string> {
    const rgPath = await getRipgrepPath();

    const args = [rgPath, "--files", "--glob=!.git/*"];
    if (input.follow !== false) args.push("--follow");
    if (input.hidden !== false) args.push("--hidden");
    if (input.maxDepth !== undefined)
      args.push(`--max-depth=${input.maxDepth}`);
    if (input.glob) {
      for (const g of input.glob) {
        args.push(`--glob=${g}`);
      }
    }

    // Verify directory exists
    const stat = await fs.stat(input.cwd).catch(() => undefined);
    if (!stat?.isDirectory()) {
      throw Object.assign(new Error(`No such directory: '${input.cwd}'`), {
        code: "ENOENT",
        path: input.cwd,
      });
    }

    const proc = Bun.spawn(args, {
      cwd: input.cwd,
      stdout: "pipe",
      stderr: "ignore",
    });

    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line) yield line;
        }
      }

      if (buffer) yield buffer;
    } finally {
      reader.releaseLock();
      await proc.exited;
    }
  }

  /**
   * Search file contents using ripgrep.
   * Returns matches with file path, line number, and content.
   */
  export async function search(input: {
    cwd: string;
    pattern: string;
    glob?: string[];
    limit?: number;
    follow?: boolean;
  }): Promise<
    Array<{
      path: string;
      lineNumber: number;
      lineText: string;
      submatches: Array<{ text: string; start: number; end: number }>;
    }>
  > {
    const rgPath = await getRipgrepPath();

    const args = [rgPath, "--json", "--hidden", "--glob=!.git/*"];
    if (input.follow !== false) args.push("--follow");
    if (input.glob) {
      for (const g of input.glob) {
        args.push(`--glob=${g}`);
      }
    }
    if (input.limit) {
      args.push(`--max-count=${input.limit}`);
    }
    args.push("--", input.pattern);

    const proc = Bun.spawn(args, {
      cwd: input.cwd,
      stdout: "pipe",
      stderr: "ignore",
    });

    const output = await Bun.readableStreamToText(proc.stdout);
    await proc.exited;

    if (proc.exitCode !== 0 || !output.trim()) {
      return [];
    }

    const results: Array<{
      path: string;
      lineNumber: number;
      lineText: string;
      submatches: Array<{ text: string; start: number; end: number }>;
    }> = [];

    for (const line of output.trim().split(/\r?\n/)) {
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === "match") {
          results.push({
            path: parsed.data.path.text,
            lineNumber: parsed.data.line_number,
            lineText: parsed.data.lines.text,
            submatches: parsed.data.submatches.map((s: any) => ({
              text: s.match.text,
              start: s.start,
              end: s.end,
            })),
          });
        }
      } catch {
        // Skip malformed JSON lines
      }
    }

    return results;
  }
}
