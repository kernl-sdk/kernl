#!/usr/bin/env node
/**
 * Generates SPEC.md from openapi-kernl.json
 *
 * Usage: node scripts/gen-spec.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const input = join(root, "openapi.json");
const output = join(root, "SPEC.md");

const spec = JSON.parse(readFileSync(input, "utf-8"));

// Group paths by domain
const domains = {
  Health: ["/health"],
  Agents: ["/agents"],
  Threads: ["/threads"],
  Tools: ["/tools"],
  Toolkits: ["/toolkits"],
  Realtime: ["/realtime"],
  Providers: ["/providers"],
  MCP: ["/mcps"],
};

function getDomain(path) {
  for (const [domain, prefixes] of Object.entries(domains)) {
    if (prefixes.some((p) => path.startsWith(p))) {
      return domain;
    }
  }
  return "Other";
}

function schemaToExample(schema, schemas = {}, depth = 0) {
  if (!schema || depth > 5) return null;

  if (schema.$ref) {
    const name = schema.$ref.replace("#/components/schemas/", "");
    return schemaToExample(schemas[name], schemas, depth + 1);
  }

  if (schema.type === "string") {
    if (schema.enum) return schema.enum.join(" | ");
    return "string";
  }
  if (schema.type === "number" || schema.type === "integer") return 0;
  if (schema.type === "boolean") return true;
  if (schema.type === "array") {
    const item = schemaToExample(schema.items, schemas, depth + 1);
    return item ? [item] : [];
  }
  if (schema.type === "object" || schema.properties) {
    const obj = {};
    for (const [key, val] of Object.entries(schema.properties || {})) {
      obj[key] = schemaToExample(val, schemas, depth + 1);
    }
    return obj;
  }

  return null;
}

function formatJson(obj) {
  return JSON.stringify(obj, null, 2);
}

// Group endpoints by domain
const grouped = {};
for (const [path, methods] of Object.entries(spec.paths)) {
  const domain = getDomain(path);
  if (!grouped[domain]) grouped[domain] = [];

  for (const [method, op] of Object.entries(methods)) {
    grouped[domain].push({ path, method: method.toUpperCase(), op });
  }
}

// Generate markdown
let md = `# Kernl Server API Specification

## Conventions

### Naming
- All field names use **camelCase** (e.g., \`agentId\`, \`createdAt\`)
- Query parameters use **camelCase** (e.g., \`?agentId=...\`)
- Path parameters use **ID suffix** (e.g., \`{tid}\`, \`{agentID}\`)

### Timestamps
All timestamps are **ISO-8601** format: \`2024-01-15T09:30:00.000Z\`

### Pagination
List endpoints support cursor-based pagination:
\`\`\`
GET /threads?limit=20&cursor=abc123
\`\`\`
Response includes \`next\` cursor (null if no more results).

### Errors
All errors return:
\`\`\`json
{
  "error": {
    "code": "not_found",
    "message": "Thread not found"
  }
}
\`\`\`

| Code | HTTP Status |
|------|-------------|
| \`validation_error\` | 400 |
| \`unauthorized\` | 401 |
| \`not_found\` | 404 |
| \`internal_error\` | 500 |

### Success Responses
Mutations return:
\`\`\`json
{ "success": true }
\`\`\`

### Streaming
Endpoints marked as streaming return **Server-Sent Events (SSE)**:
\`\`\`
Content-Type: text/event-stream
\`\`\`

---

`;

const domainOrder = ["Health", "Agents", "Threads", "Tools", "Toolkits", "Realtime", "Providers", "MCP", "Other"];

for (const domain of domainOrder) {
  const endpoints = grouped[domain];
  if (!endpoints || endpoints.length === 0) continue;

  md += `## ${domain}\n\n`;

  for (const { path, method, op } of endpoints) {
    md += `### \`${method} ${path}\`\n\n`;

    if (op.summary) {
      md += `${op.summary}.\n\n`;
    }
    if (op.description && op.description !== op.summary) {
      md += `${op.description}\n\n`;
    }

    // Path parameters
    const pathParams = (op.parameters || []).filter((p) => p.in === "path");
    if (pathParams.length > 0) {
      md += `**Path Parameters**\n`;
      for (const p of pathParams) {
        md += `- \`${p.name}\` — ${p.description || p.name}\n`;
      }
      md += `\n`;
    }

    // Query parameters
    const queryParams = (op.parameters || []).filter((p) => p.in === "query");
    if (queryParams.length > 0) {
      md += `**Query Parameters**\n`;
      for (const p of queryParams) {
        const req = p.required ? "" : " (optional)";
        md += `- \`${p.name}\`${req} — ${p.description || p.name}\n`;
      }
      md += `\n`;
    }

    // Request body
    const reqBody = op.requestBody?.content?.["application/json"]?.schema;
    if (reqBody) {
      const example = schemaToExample(reqBody, spec.components?.schemas || {});
      if (example) {
        md += `**Request Body**\n\`\`\`json\n${formatJson(example)}\n\`\`\`\n\n`;
      }
    }

    // Response
    const res200 = op.responses?.["200"];
    if (res200) {
      const resSchema = res200.content?.["application/json"]?.schema;
      if (resSchema) {
        const example = schemaToExample(resSchema, spec.components?.schemas || {});
        if (example) {
          md += `**Response**\n\`\`\`json\n${formatJson(example)}\n\`\`\`\n\n`;
        }
      }
    }

    md += `---\n\n`;
  }
}

writeFileSync(output, md);
console.log(`Generated: ${output}`);
