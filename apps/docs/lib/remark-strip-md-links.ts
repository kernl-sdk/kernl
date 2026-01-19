import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import { dirname, join, normalize } from 'path';

/**
 * Remark plugin that converts relative .md links to absolute paths.
 * Only applies to files in the /reference/ directory (auto-generated TypeDoc output).
 */
export function remarkStripMdLinks() {
  return (tree: Root, vfile: VFile) => {
    if (!vfile.path?.includes('/reference/')) return;

    // Extract the URL path for this file (e.g., /reference/protocol for /reference/protocol/index.md)
    const match = vfile.path.match(/content\/docs(\/reference\/.*)$/);
    if (!match) return;

    // Get directory of current file as URL path
    const filePath = match[1];
    const fileDir = dirname(filePath);

    visit(tree, 'link', (node) => {
      if (!node.url) return;
      if (node.url.startsWith('http') || node.url.startsWith('#') || node.url.startsWith('/')) return;

      // Strip .md extension
      let url = node.url;
      if (url.endsWith('.md')) {
        url = url.slice(0, -3);
      }

      // Resolve relative path to absolute
      let resolved = normalize(join(fileDir, url)).replace(/\\/g, '/');

      // Strip /index suffix - fumadocs serves index pages at the directory path
      if (resolved.endsWith('/index')) {
        resolved = resolved.slice(0, -6);
      }

      node.url = resolved;
    });
  };
}
