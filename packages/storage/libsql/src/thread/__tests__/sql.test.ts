import { describe, it, expect } from "vitest";

import { SQL_WHERE, SQL_ORDER, SQL_UPDATE } from "../sql";

describe("LibSQL thread SQL codecs", () => {
  describe("SQL_WHERE", () => {
    it("returns empty clause when no filters", () => {
      const result = SQL_WHERE.encode({ filter: undefined });
      expect(result.sql).toBe("");
      expect(result.params).toEqual([]);
    });

    it("encodes namespace filter", () => {
      const result = SQL_WHERE.encode({
        filter: { namespace: "default" },
      });
      expect(result.sql).toBe("namespace = ?");
      expect(result.params).toEqual(["default"]);
    });

    it("encodes agentId filter", () => {
      const result = SQL_WHERE.encode({
        filter: { agentId: "agent-1" },
      });
      expect(result.sql).toBe("agent_id = ?");
      expect(result.params).toEqual(["agent-1"]);
    });

    it("encodes single state filter", () => {
      const result = SQL_WHERE.encode({
        filter: { state: "stopped" },
      });
      expect(result.sql).toBe("state = ?");
      expect(result.params).toEqual(["stopped"]);
    });

    it("encodes state array filter with IN clause", () => {
      const result = SQL_WHERE.encode({
        filter: { state: ["stopped", "running", "interruptible"] },
      });
      expect(result.sql).toBe("state IN (?, ?, ?)");
      expect(result.params).toEqual(["stopped", "running", "interruptible"]);
    });

    it("encodes parentTaskId filter", () => {
      const result = SQL_WHERE.encode({
        filter: { parentTaskId: "task-1" },
      });
      expect(result.sql).toBe("parent_task_id = ?");
      expect(result.params).toEqual(["task-1"]);
    });

    it("encodes date range filters", () => {
      const after = new Date("2024-01-01");
      const before = new Date("2024-12-31");

      const result = SQL_WHERE.encode({
        filter: { createdAfter: after, createdBefore: before },
      });

      // Uses > and < not >= and <=
      expect(result.sql).toBe("created_at > ? AND created_at < ?");
      expect(result.params).toEqual([after.getTime(), before.getTime()]);
    });

    it("combines multiple filters with AND", () => {
      const result = SQL_WHERE.encode({
        filter: {
          namespace: "default",
          agentId: "agent-1",
          state: "stopped",
        },
      });

      // Order depends on filter processing order, check contains
      expect(result.sql).toContain("namespace = ?");
      expect(result.sql).toContain("agent_id = ?");
      expect(result.sql).toContain("state = ?");
      expect(result.sql).toContain(" AND ");
      expect(result.params).toContain("default");
      expect(result.params).toContain("agent-1");
      expect(result.params).toContain("stopped");
    });
  });

  describe("SQL_ORDER", () => {
    it("returns default ordering", () => {
      const result = SQL_ORDER.encode({ order: undefined });
      expect(result).toBe("created_at DESC");
    });

    it("encodes createdAt asc", () => {
      const result = SQL_ORDER.encode({ order: { createdAt: "asc" } });
      expect(result).toBe("created_at ASC");
    });

    it("encodes createdAt desc", () => {
      const result = SQL_ORDER.encode({ order: { createdAt: "desc" } });
      expect(result).toBe("created_at DESC");
    });

    it("encodes updatedAt asc", () => {
      const result = SQL_ORDER.encode({ order: { updatedAt: "asc" } });
      expect(result).toBe("updated_at ASC");
    });

    it("encodes updatedAt desc", () => {
      const result = SQL_ORDER.encode({ order: { updatedAt: "desc" } });
      expect(result).toBe("updated_at DESC");
    });
  });

  describe("SQL_UPDATE", () => {
    it("encodes tick update", () => {
      const result = SQL_UPDATE.encode({ patch: { tick: 5 } });
      expect(result.sql).toContain("tick = ?");
      expect(result.params).toContain(5);
    });

    it("encodes state update", () => {
      const result = SQL_UPDATE.encode({ patch: { state: "running" } });
      expect(result.sql).toContain("state = ?");
      expect(result.params).toContain("running");
    });

    it("encodes metadata update with JSON stringify", () => {
      const metadata = { title: "Test" };
      const result = SQL_UPDATE.encode({ patch: { metadata } });
      expect(result.sql).toContain("metadata = ?");
      expect(result.params).toContain(JSON.stringify(metadata));
    });

    it("always includes updated_at", () => {
      const before = Date.now();
      const result = SQL_UPDATE.encode({ patch: { tick: 1 } });
      const after = Date.now();

      expect(result.sql).toContain("updated_at = ?");
      const updatedAt = result.params.find(
        (p) => typeof p === "number" && p >= before && p <= after,
      );
      expect(updatedAt).toBeDefined();
    });

    it("combines multiple updates", () => {
      const result = SQL_UPDATE.encode({
        patch: { tick: 3, state: "interruptible" },
      });
      expect(result.sql).toContain("tick = ?");
      expect(result.sql).toContain("state = ?");
      expect(result.sql).toContain("updated_at = ?");
    });
  });
});
