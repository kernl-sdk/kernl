import { readFile, writeFile, mkdir, cp } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

import { toolkits } from "./registry/toolkits";
import type { RegistryItem, RegistryType } from "./registry/types";

const DIST_DIR = "dist/toolkits";

interface OutputFile {
  path: string;
  content: string;
}

interface RegistryOutput {
  $schema: string;
  name: string;
  type: RegistryType;
  title: string;
  description: string;
  icon?: string;
  category?: string;
  dependencies: string[];
  env: string[];
  files: OutputFile[];
  registryVersion: string;
  updatedAt: string;
}

async function buildToolkit(item: RegistryItem): Promise<RegistryOutput> {
  const files: OutputFile[] = await Promise.all(
    item.files.map(async (file) => ({
      path: file.path,
      content: await readFile(file.path, "utf-8"),
    })),
  );

  return {
    $schema: "https://registry.kernl.sh/schema.json",
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    icon: item.icon,
    category: item.category,
    dependencies: item.dependencies || [],
    env: item.env || [],
    files,
    registryVersion: "1.0.0",
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  await mkdir(DIST_DIR, { recursive: true });

  console.log(`Building ${toolkits.length} toolkit(s)...\n`);

  for (const item of toolkits) {
    try {
      const output = await buildToolkit(item);
      const outPath = join(DIST_DIR, `${item.name}.json`);
      await writeFile(outPath, JSON.stringify(output, null, 2));
      console.log(`  ✓ ${item.name} → ${outPath}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`  ✗ ${item.name}: ${msg}`);
      process.exit(1);
    }
  }

  // copy icons
  if (existsSync("icons")) {
    await cp("icons", "dist/icons", { recursive: true });
    console.log("\n  ✓ icons → dist/icons");
  }

  console.log("\nDone!");
}

main();
