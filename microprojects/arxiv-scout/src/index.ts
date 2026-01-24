import * as core from "@actions/core";
import { Kernl } from "kernl";

import { arxiv, type Paper } from "@/lib/arxiv";
import { TRACKS, type Track } from "@/lib/criteria";
import { formatpapers, type AnalyzedPaper } from "@/lib/fmt";
import { harvester, type PaperRelevanceResult } from "@/agents/harvest";
import { analyst } from "@/agents/analyst";
import { write } from "@/write";

const BATCH_SIZE = 20;
const MAX_CONCURRENCY = 5;

function batch<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function parallel<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

interface Logger {
  log: (msg: string) => void;
  warn: (msg: string) => void;
}

async function scout(track: Track, logger: Logger): Promise<string | null> {
  const { log, warn } = logger;
  const trackInfo = TRACKS[track];

  log(`\n${"=".repeat(60)}`);
  log(`Track: ${trackInfo.name}`);
  log(`${"=".repeat(60)}\n`);

  // Stage 0: Fetch papers from arXiv
  log("Fetching papers from arXiv...");

  const papers = await arxiv.papers.list({
    categories: [...trackInfo.categories],
    daysBack: 2, // arXiv releases in batches, so we need a wider window
    maxResults: 200,
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  log(`Fetched ${papers.length} papers`);

  if (papers.length === 0) {
    log("No papers found for this track.");
    return null;
  }

  // Stage 1: Filter for relevance (batched + parallel)
  log("Stage 1: Filtering for relevance...");

  const batches = batch(papers, BATCH_SIZE);
  log(
    `Processing ${batches.length} batches of ${BATCH_SIZE} papers (max ${MAX_CONCURRENCY} concurrent)...`,
  );

  const batchResults = await parallel(
    batches,
    async (batchPapers, i) => {
      const prompt = `
Here are ${batchPapers.length} papers from arXiv (batch ${i + 1}/${batches.length}). Filter them for relevance to kernl.

${formatpapers(batchPapers)}
`;
      const result = await harvester.run(prompt);
      log(
        `Batch ${i + 1}/${batches.length}: found ${result.response.papers.length} relevant`,
      );
      return result.response.papers;
    },
    MAX_CONCURRENCY,
  );

  // Flatten and sort results
  const relevantPapers: PaperRelevanceResult[] = batchResults.flat();
  relevantPapers.sort((a, b) => b.score - a.score);

  log(`Found ${relevantPapers.length} relevant papers total`);

  if (relevantPapers.length === 0) {
    log("No relevant papers today. Writing empty digest.");
    const filepath = write([], { track, totalScanned: papers.length });
    log(`Wrote: ${filepath}`);
    return filepath;
  }

  // Build lookup map
  const paperMap = new Map<string, Paper>();
  for (const p of papers) {
    paperMap.set(p.id, p);
  }

  // Stage 2: Deep analysis of top papers (parallel)
  log("Stage 2: Analyzing relevant papers...");

  // Analyze top 5 papers max to control costs
  const toAnalyze = relevantPapers.slice(0, 5);

  const analyzed = await parallel(
    toAnalyze,
    async (rel, i) => {
      const paper = paperMap.get(rel.id);
      if (!paper) {
        warn(`Paper ${rel.id} not found in original list`);
        return null;
      }

      log(
        `Analyzing ${i + 1}/${toAnalyze.length}: ${paper.title.slice(0, 50)}...`,
      );

      const analysisPrompt = `
Analyze this paper for insights relevant to kernl.

**Paper ID:** ${paper.id}
**Full Paper URL:** https://arxiv.org/html/${paper.id}
**Title:** ${paper.title}
**Authors:** ${paper.authors.map((a) => a.name).join(", ")}
**Categories:** ${paper.categories.join(", ")}

**Abstract:**
${paper.abstract}

**Why it was flagged:** ${rel.reason}

First, fetch the full paper from arxiv to read it in its entirety. Then provide your analysis.
`;

      const result = await analyst.run(analysisPrompt);

      return {
        paper,
        relevance: rel,
        analysis: result.response,
      } as AnalyzedPaper;
    },
    MAX_CONCURRENCY,
  ).then((results) => results.filter((r): r is AnalyzedPaper => r !== null));

  // Write output
  log("Writing research digest...");
  const filepath = write(analyzed, { track, totalScanned: papers.length });
  log(`Wrote: ${filepath}`);

  return filepath;
}

async function main() {
  const isCI = !!process.env.GITHUB_ACTIONS;
  const log = isCI ? core.info : console.log;
  const warn = isCI ? core.warning : console.warn;

  try {
    // Get API key
    const apiKey = isCI
      ? core.getInput("anthropic_api_key")
      : process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    process.env.ANTHROPIC_API_KEY = apiKey;

    // Register agents
    const kernl = new Kernl();
    kernl.register(harvester);
    kernl.register(analyst);

    const logger: Logger = { log, warn };

    // Run each track sequentially
    for (const track of Object.keys(TRACKS) as Track[]) {
      await scout(track, logger);
    }

    log("\nDone!");
  } catch (error) {
    if (error instanceof Error) {
      if (isCI) {
        core.setFailed(error.message);
      } else {
        console.error("Error:", error.message);
        process.exit(1);
      }
    }
  }
}

main();
