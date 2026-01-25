import { describe, it, expect } from "vitest";

import { SQL_WHERE, ORDER, SQL_UPDATE } from "../sql";

describe("LibSQL memory SQL codecs", () => {
  describe("SQL_WHERE", () => {
    it("returns empty clause when no filters", () => {
      const result = SQL_WHERE.encode({ filter: undefined });
      expect(result.sql).toBe("");
      expect(result.params).toEqual([]);
    });

    it("encodes scope namespace filter", () => {
      const result = SQL_WHERE.encode({
        filter: { scope: { namespace: "default" } },
      });
      expect(result.sql).toBe("namespace = ?");
      expect(result.params).toEqual(["default"]);
    });

    it("encodes scope entityId filter", () => {
      const result = SQL_WHERE.encode({
        filter: { scope: { entityId: "user-1" } },
      });
      expect(result.sql).toBe("entity_id = ?");
      expect(result.params).toEqual(["user-1"]);
    });

    it("encodes scope agentId filter", () => {
      const result = SQL_WHERE.encode({
        filter: { scope: { agentId: "agent-1" } },
      });
      expect(result.sql).toBe("agent_id = ?");
      expect(result.params).toEqual(["agent-1"]);
    });

    it("encodes full scope filter", () => {
      const result = SQL_WHERE.encode({
        filter: {
          scope: {
            namespace: "default",
            entityId: "user-1",
            agentId: "agent-1",
          },
        },
      });
      expect(result.sql).toBe("namespace = ? AND entity_id = ? AND agent_id = ?");
      expect(result.params).toEqual(["default", "user-1", "agent-1"]);
    });

    it("encodes collections filter with IN clause", () => {
      const result = SQL_WHERE.encode({
        filter: { collections: ["facts", "preferences"] },
      });
      expect(result.sql).toBe("collection IN (?, ?)");
      expect(result.params).toEqual(["facts", "preferences"]);
    });

    it("encodes wmem filter", () => {
      const result = SQL_WHERE.encode({ filter: { wmem: true } });
      expect(result.sql).toBe("wmem = ?");
      expect(result.params).toEqual([1]); // SQLite boolean
    });

    it("encodes smem filter (has valid expiration)", () => {
      const before = Date.now();
      const result = SQL_WHERE.encode({ filter: { smem: true } });
      const after = Date.now();

      // smem=true means has expiration AND not expired
      expect(result.sql).toBe("(smem_expires_at IS NOT NULL AND smem_expires_at > ?)");
      expect(result.params.length).toBe(1);
      expect(result.params[0]).toBeGreaterThanOrEqual(before);
      expect(result.params[0]).toBeLessThanOrEqual(after);
    });

    it("encodes smem=false filter (no expiration or expired)", () => {
      const before = Date.now();
      const result = SQL_WHERE.encode({ filter: { smem: false } });
      const after = Date.now();

      // smem=false means no expiration OR already expired
      expect(result.sql).toBe("(smem_expires_at IS NULL OR smem_expires_at <= ?)");
      expect(result.params.length).toBe(1);
      expect(result.params[0]).toBeGreaterThanOrEqual(before);
      expect(result.params[0]).toBeLessThanOrEqual(after);
    });

    it("encodes timestamp range filters", () => {
      const result = SQL_WHERE.encode({
        filter: { after: 1700000000000, before: 1700100000000 },
      });
      expect(result.sql).toBe("timestamp > ? AND timestamp < ?");
      expect(result.params).toEqual([1700000000000, 1700100000000]);
    });

    it("combines multiple filters with AND", () => {
      const result = SQL_WHERE.encode({
        filter: {
          scope: { namespace: "default" },
          wmem: true,
          collections: ["facts"],
        },
      });

      expect(result.sql).toContain("namespace = ?");
      expect(result.sql).toContain("wmem = ?");
      expect(result.sql).toContain("collection IN (?)");
      expect(result.sql.match(/AND/g)?.length).toBe(2);
    });
  });

  describe("ORDER", () => {
    it("returns default ordering (desc)", () => {
      const result = ORDER.encode({ order: undefined });
      expect(result).toBe("timestamp DESC");
    });

    it("encodes asc order", () => {
      const result = ORDER.encode({ order: "asc" });
      expect(result).toBe("timestamp ASC");
    });

    it("encodes desc order", () => {
      const result = ORDER.encode({ order: "desc" });
      expect(result).toBe("timestamp DESC");
    });
  });

  describe("SQL_UPDATE", () => {
    it("encodes content update with JSON stringify", () => {
      const content = { text: "Updated content" };
      const result = SQL_UPDATE.encode({ patch: { id: "m1", content } });
      expect(result.sql).toContain("content = ?");
      expect(result.params).toContain(JSON.stringify(content));
    });

    it("encodes wmem flag update", () => {
      const result = SQL_UPDATE.encode({ patch: { id: "m1", wmem: true } });
      expect(result.sql).toContain("wmem = ?");
      expect(result.params).toContain(1); // SQLite boolean
    });

    it("encodes smem expiration update", () => {
      const result = SQL_UPDATE.encode({
        patch: { id: "m1", smem: { expiresAt: 1700100000000 } },
      });
      expect(result.sql).toContain("smem_expires_at = ?");
      expect(result.params).toContain(1700100000000);
    });

    it("encodes metadata update", () => {
      const metadata = { confidence: 0.95 };
      const result = SQL_UPDATE.encode({ patch: { id: "m1", metadata } });
      expect(result.sql).toContain("metadata = ?");
      expect(result.params).toContain(JSON.stringify(metadata));
    });

    it("always includes updated_at", () => {
      const before = Date.now();
      const result = SQL_UPDATE.encode({ patch: { id: "m1", wmem: false } });
      const after = Date.now();

      expect(result.sql).toContain("updated_at = ?");
      const updatedAt = result.params.find(
        (p) => typeof p === "number" && p >= before && p <= after,
      );
      expect(updatedAt).toBeDefined();
    });

    it("combines multiple updates", () => {
      const result = SQL_UPDATE.encode({
        patch: {
          id: "m1",
          content: { text: "New" },
          wmem: true,
          metadata: { edited: true },
        },
      });
      expect(result.sql).toContain("content = ?");
      expect(result.sql).toContain("wmem = ?");
      expect(result.sql).toContain("metadata = ?");
      expect(result.sql).toContain("updated_at = ?");
    });
  });
});
