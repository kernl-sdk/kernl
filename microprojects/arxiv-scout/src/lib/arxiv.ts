import { XMLParser } from "fast-xml-parser";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: Author[];
  categories: string[];
  primaryCategory: string;
  published: Date;
  updated: Date;
  links: Links;
}

export interface Author {
  name: string;
  affiliation?: string;
}

export interface Links {
  abstract: string;
  pdf: string;
  html?: string;
}

export type SortBy = "relevance" | "lastUpdatedDate" | "submittedDate";
export type SortOrder = "ascending" | "descending";

export interface ListParams {
  /** Search query (title, abstract, author, etc.) */
  query?: string;
  /** Filter by categories (e.g., ["cs.AI", "cs.LG"]) */
  categories?: string[];
  /** Maximum number of results (default: 100, max: 2000) */
  maxResults?: number;
  /** Offset for pagination (default: 0) */
  start?: number;
  /** Sort field */
  sortBy?: SortBy;
  /** Sort direction */
  sortOrder?: SortOrder;
  /** Filter papers submitted in last N days */
  daysBack?: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Internal XML parsing
// ────────────────────────────────────────────────────────────────────────────

interface RawEntry {
  id: string;
  title: string;
  summary: string;
  author: { name: string; "arxiv:affiliation"?: string } | { name: string; "arxiv:affiliation"?: string }[];
  category: { "@_term": string } | { "@_term": string }[];
  "arxiv:primary_category": { "@_term": string };
  published: string;
  updated: string;
  link: { "@_href": string; "@_title"?: string; "@_type"?: string }[] | { "@_href": string; "@_title"?: string; "@_type"?: string };
}

interface RawFeed {
  feed: {
    entry?: RawEntry | RawEntry[];
    "opensearch:totalResults": number;
    "opensearch:startIndex": number;
    "opensearch:itemsPerPage": number;
  };
}

function toarray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function parseid(url: string): string {
  const match = url.match(/abs\/(.+?)(?:v\d+)?$/);
  return match ? match[1] : url;
}

function parseentry(entry: RawEntry): Paper {
  const authors = toarray(entry.author).map((a) => ({
    name: a.name,
    affiliation: a["arxiv:affiliation"],
  }));

  const categories = toarray(entry.category).map((c) => c["@_term"]);
  const links = toarray(entry.link);

  const pdfLink = links.find((l) => l["@_title"] === "pdf" || l["@_type"] === "application/pdf");
  const htmlLink = links.find((l) => l["@_title"] === "html");
  const absLink = links.find((l) => l["@_type"] === "text/html" || (!l["@_type"] && !l["@_title"]));

  const id = parseid(entry.id);

  return {
    id,
    title: entry.title.replace(/\s+/g, " ").trim(),
    abstract: entry.summary.replace(/\s+/g, " ").trim(),
    authors,
    categories,
    primaryCategory: entry["arxiv:primary_category"]["@_term"],
    published: new Date(entry.published),
    updated: new Date(entry.updated),
    links: {
      abstract: absLink?.["@_href"] ?? `https://arxiv.org/abs/${id}`,
      pdf: pdfLink?.["@_href"] ?? `https://arxiv.org/pdf/${id}.pdf`,
      html: htmlLink?.["@_href"],
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Papers resource
// ────────────────────────────────────────────────────────────────────────────

class Papers {
  private baseUrl = "https://export.arxiv.org/api/query";

  /**
   * List papers matching the given criteria.
   *
   * @example
   * ```ts
   * const papers = await arxiv.papers.list({
   *   categories: ["cs.AI", "cs.LG"],
   *   daysBack: 1,
   *   maxResults: 100,
   * });
   * ```
   */
  async list(params: ListParams = {}): Promise<Paper[]> {
    const {
      query,
      categories,
      maxResults = 100,
      start = 0,
      sortBy = "submittedDate",
      sortOrder = "descending",
      daysBack,
    } = params;

    const parts: string[] = [];

    if (query) {
      parts.push(`all:${encodeURIComponent(query)}`);
    }

    if (categories?.length) {
      const catQuery = categories.map((c) => `cat:${c}`).join(" OR ");
      parts.push(`(${catQuery})`);
    }

    if (daysBack) {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - daysBack);
      // arXiv expects YYYYMMDDHHMM format with full day ranges
      const fmtDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
      parts.push(`submittedDate:[${fmtDate(from)}0000 TO ${fmtDate(now)}2359]`);
    }

    const searchQuery = parts.join(" AND ") || "all:*";

    const url = new URL(this.baseUrl);
    url.searchParams.set("search_query", searchQuery);
    url.searchParams.set("start", String(start));
    url.searchParams.set("max_results", String(Math.min(maxResults, 2000)));
    url.searchParams.set("sortBy", sortBy);
    url.searchParams.set("sortOrder", sortOrder);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new ArxivError(`API request failed: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const parsed = parser.parse(xml) as RawFeed;
    const entries = toarray(parsed.feed.entry);

    return entries.map(parseentry);
  }

  /**
   * Get a single paper by ID.
   *
   * @example
   * ```ts
   * const paper = await arxiv.papers.get("2401.12345");
   * ```
   */
  async get(id: string): Promise<Paper | null> {
    const url = `${this.baseUrl}?id_list=${id}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new ArxivError(`API request failed: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const parsed = parser.parse(xml) as RawFeed;
    const entries = toarray(parsed.feed.entry);

    if (entries.length === 0) return null;
    return parseentry(entries[0]);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Client
// ────────────────────────────────────────────────────────────────────────────

export class ArxivError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArxivError";
  }
}

class Arxiv {
  readonly papers = new Papers();
}

/**
 * arXiv API client.
 *
 * @example
 * ```ts
 * import { arxiv } from "./lib/arxiv";
 *
 * // List recent AI papers
 * const papers = await arxiv.papers.list({
 *   categories: ["cs.AI", "cs.LG", "cs.CL"],
 *   daysBack: 1,
 *   maxResults: 100,
 * });
 *
 * // Get a specific paper
 * const paper = await arxiv.papers.get("2401.12345");
 * ```
 */
export const arxiv = new Arxiv();
