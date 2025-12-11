const CANONICAL_ALIAS = "@/toolkits";

/**
 * Rewrite @/toolkits imports to user's alias.
 */
export function transformImports(content: string, alias: string): string {
  if (alias === CANONICAL_ALIAS) return content;

  // Match: from "@/toolkits/..." or from '@/toolkits/...'
  const regex = /(from\s+['"])@\/toolkits(\/[^'"]*)?(['"])/g;

  return content.replace(regex, (_, pre, path = "", suf) => {
    return `${pre}${alias}${path}${suf}`;
  });
}

/**
 * Extract relative path from registry path.
 * "toolkits/gmail/index.ts" → "gmail/index.ts"
 */
export function relPath(registryPath: string): string {
  return registryPath.replace(/^toolkits\//, "");
}
