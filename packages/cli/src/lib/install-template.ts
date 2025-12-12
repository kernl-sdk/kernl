import os from "os";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import * as p from "@clack/prompts";

import { copy } from "@/lib/copy";
import { install, type PackageManager } from "@/lib/install";
import { tryGitInit } from "@/lib/git";

export type Provider = "openai" | "anthropic" | "google";

const PROVIDERS: Record<
  Provider,
  {
    pkg: string;
    version: string;
    fn: string;
    model: string;
    env: string;
  }
> = {
  openai: {
    pkg: "@ai-sdk/openai",
    version: "^3.0.0-beta.57",
    fn: "openai",
    model: "gpt-5.1",
    env: "OPENAI_API_KEY",
  },
  anthropic: {
    pkg: "@ai-sdk/anthropic",
    version: "^3.0.0-beta.53",
    fn: "anthropic",
    model: "claude-sonnet-4-5",
    env: "ANTHROPIC_API_KEY",
  },
  google: {
    pkg: "@ai-sdk/google",
    version: "^3.0.0-beta.43",
    fn: "google",
    model: "gemini-2.5-pro",
    env: "GOOGLE_GENERATIVE_AI_API_KEY",
  },
};

interface InstallTemplateOptions {
  appName: string;
  root: string;
  packageManager: PackageManager;
  provider: Provider;
  apiKey?: string;
  silent?: boolean;
}

/**
 * Install the default kernl template to the target directory.
 */
export async function installTemplate({
  appName,
  root,
  packageManager,
  provider,
  apiKey,
  silent = false,
}: InstallTemplateOptions): Promise<void> {
  const providerConfig = PROVIDERS[provider];

  // copy template files (excluding jarvis.ts - we generate it dynamically)
  const templatePath = join(__dirname, "../templates/default");
  await copy(["**", "!src/agents/jarvis.ts"], root, {
    cwd: templatePath,
    parents: true,
    rename(name) {
      // rename dotfiles (can't include dots in template names)
      if (name === "gitignore") return ".gitignore";
      if (name === "env.example") return ".env.example";
      return name;
    },
  });

  // generate jarvis.ts with selected provider
  const jarvisContent = `import { Agent } from "kernl";
import { ${providerConfig.fn} } from "@kernl-sdk/ai/${provider}";
import { math } from "@/toolkits/math";

export const jarvis = new Agent({
  id: "jarvis",
  name: "Jarvis",
  instructions:
    "You are Jarvis, a helpful AI assistant with access to mathematical tools. " +
    "Use the math toolkit to perform calculations when needed.",
  model: ${providerConfig.fn}("${providerConfig.model}"),
  toolkits: [math],
});
`;

  await mkdir(join(root, "src/agents"), { recursive: true });
  await writeFile(join(root, "src/agents/jarvis.ts"), jarvisContent);

  // generate .env if API key provided
  if (apiKey) {
    await writeFile(
      join(root, ".env"),
      `${providerConfig.env}=${apiKey}${os.EOL}`,
    );
  }

  if (!silent) {
    p.log.step("Project structure created");
  }

  // generate package.json with provider-specific dependency
  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "tsx watch src/index.ts",
      start: "tsx src/index.ts",
    },
    dependencies: {
      kernl: "^0.8.3",
      "@kernl-sdk/ai": "^0.3.0",
      [providerConfig.pkg]: providerConfig.version,
      zod: "^4.1.12",
    },
    devDependencies: {
      "@types/node": "^24.10.0",
      tsx: "^4.7.0",
      typescript: "^5.9.2",
    },
  };

  await writeFile(
    join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL,
  );

  // install dependencies
  const s = p.spinner();
  s.start(`Installing dependencies via ${packageManager}`);

  try {
    await install(root, packageManager, true);
    s.stop(`Dependencies installed via ${packageManager}`);
  } catch (error) {
    s.stop("Failed to install dependencies");
    throw error;
  }

  // initialize git
  if (tryGitInit(root) && !silent) {
    p.log.step("Initialized git repository");
  }
}
