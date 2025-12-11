import { readdirSync } from "fs";
import { access, constants } from "fs/promises";
import * as p from "@clack/prompts";

/**
 * Check if a directory is writable.
 */
export async function isWriteable(directory: string): Promise<boolean> {
  try {
    await access(directory, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a folder is empty or only contains safe files.
 * Returns true if empty/safe, false if there are conflicts.
 */
export function isFolderEmpty(
  root: string,
  name: string,
  silent = false,
): boolean {
  const ignore = [
    ".DS_Store",
    ".git",
    ".gitattributes",
    ".gitignore",
    ".gitlab-ci.yml",
    ".hg",
    ".hgcheck",
    ".hgignore",
    ".idea",
    ".npmignore",
    ".travis.yml",
    "LICENSE",
    "Thumbs.db",
    "docs",
    "mkdocs.yml",
    "npm-debug.log",
    "yarn-debug.log",
    "yarn-error.log",
  ];

  const conflicts = readdirSync(root)
    .filter((file) => !ignore.includes(file))
    .filter((file) => !/\.iml$/.test(file));

  if (conflicts.length > 0) {
    if (!silent) {
      p.log.error(`Directory ${name} contains conflicting files:`);
      for (const file of conflicts) {
        p.log.message(`  ${file}`);
      }
      p.log.message(
        "Either use a new directory name, or remove the files listed above.",
      );
    }
    return false;
  }

  return true;
}
