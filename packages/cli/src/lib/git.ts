import { execSync } from "child_process";

function isInGitRepository(root: string): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function isInMercurialRepository(root: string): boolean {
  try {
    execSync("hg --cwd . root", {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to initialize a git repository.
 * Returns true if successful, false otherwise.
 */
export function tryGitInit(root: string): boolean {
  try {
    // Check if already in a git or mercurial repository
    if (isInGitRepository(root) || isInMercurialRepository(root)) {
      return false;
    }

    execSync("git init", { cwd: root, stdio: "ignore" });
    execSync("git add -A", { cwd: root, stdio: "ignore" });
    execSync('git commit -m "Initial commit from kernl init"', {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}
