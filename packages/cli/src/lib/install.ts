import { spawn } from "child_process";

export type PackageManager = "pnpm" | "npm" | "yarn";

/**
 * Install dependencies using the specified package manager.
 */
export function install(
  root: string,
  packageManager: PackageManager
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = packageManager;
    const args = ["install"];

    const child = spawn(command, args, {
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

    child.on("error", (err) => {
      reject(err);
    });
  });
}
