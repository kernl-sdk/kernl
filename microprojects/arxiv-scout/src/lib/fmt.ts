import type { Paper } from "@/lib/arxiv";
import type { PaperRelevanceResult } from "@/agents/harvest";

export interface AnalyzedPaper {
  paper: Paper;
  relevance: PaperRelevanceResult;
  analysis: string;
}

/**
 * Format a date as YYYY-MM-DD.
 */
export function formatdate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Format papers for the harvester prompt.
 */
export function formatpapers(papers: Paper[]): string {
  return papers
    .map(
      (p, i) =>
        `
[${i + 1}] ID: ${p.id}
Title: ${p.title}
Categories: ${p.categories.join(", ")}
Abstract: ${p.abstract}
`.trim(),
    )
    .join("\n\n---\n\n");
}

/**
 * Format an analyzed paper as markdown.
 */
export function formatpaper(item: AnalyzedPaper): string {
  const { paper, relevance, analysis } = item;
  const authors = paper.authors.map((a) => a.name).join(", ");

  return `
### ${paper.title}

**arXiv:** [${paper.id}](${paper.links.abstract}) | **PDF:** [${paper.id}.pdf](${paper.links.pdf})
**Authors:** ${authors}
**Categories:** ${paper.categories.join(", ")}
**Relevance:** ${relevance.topic} (score: ${relevance.score.toFixed(2)})

> ${paper.abstract.slice(0, 300)}${paper.abstract.length > 300 ? "..." : ""}

#### Analysis

${analysis}
`.trim();
}
