import { spawn } from "child_process";
import { detect } from "@antfu/ni";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

/**
 * Install dependencies using the specified package manager.
 */
export function install(
  root: string,
  packageManager: PackageManager,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(packageManager, ["install"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${packageManager} install failed with code ${code}`));
        return;
      }
      resolve();
    });

    child.on("error", reject);
  });
}

/**
 * Add dependencies using the detected package manager.
 */
export async function addDeps(deps: string[], cwd: string): Promise<void> {
  if (!deps.length) return;

  const pm = await detectpm(cwd);
  const args = pm === "npm" ? ["install", ...deps] : ["add", ...deps];

  return new Promise((resolve, reject) => {
    const child = spawn(pm, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${pm} add failed with code ${code}`));
        return;
      }
      resolve();
    });

    child.on("error", reject);
  });
}

/**
 * Detect package manager from lockfile.
 */
export async function detectpm(cwd: string): Promise<PackageManager> {
  const pm = await detect({ programmatic: true, cwd });
  return (pm as PackageManager) || "npm";
}
