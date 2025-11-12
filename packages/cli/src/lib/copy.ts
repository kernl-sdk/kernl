import { copyFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { sync as glob } from "fast-glob";

interface CopyOptions {
  cwd?: string;
  rename?: (name: string) => string;
  parents?: boolean;
}

/**
 * Copy files matching glob patterns from source to destination.
 *
 * @param patterns - Glob patterns to match files
 * @param destination - Destination directory
 * @param options - Copy options
 */
export async function copy(
  patterns: string[],
  destination: string,
  options: CopyOptions = {},
): Promise<void> {
  const { cwd, rename, parents = false } = options;

  const files = glob(patterns, {
    cwd,
    dot: true,
    absolute: false,
    stats: false,
  });

  for (const file of files) {
    const sourcePath = cwd ? join(cwd, file) : file;
    const filename = rename ? rename(file) : file;
    const destPath = join(destination, filename);

    // Create parent directories if needed
    if (parents) {
      await mkdir(dirname(destPath), { recursive: true });
    }

    await copyFile(sourcePath, destPath);
  }
}
