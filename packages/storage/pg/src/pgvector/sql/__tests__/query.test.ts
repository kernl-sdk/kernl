import { describe, it, expect } from "vitest";
import { sqlize } from "../query";
import { SQL_SELECT } from "../select";
import { SQL_WHERE } from "../where";
import { SQL_ORDER } from "../order";
import { SQL_LIMIT } from "../limit";

describe("sqlize", () => {
  it("converts query with vector signal", () => {
    const vector = [0.1, 0.2, 0.3];
    const result = sqlize(
      { query: [{ embedding: vector }] },
      { pkey: "id", schema: "public", table: "docs" },
    );

    expect(result.select).toEqual({
      pkey: "id",
      signals: [{ embedding: vector }],
      binding: undefined,
      include: undefined,
    });
    expect(result.where).toEqual({ filter: undefined });
    expect(result.order).toEqual({
      signals: [{ embedding: vector }],
      orderBy: undefined,
      binding: undefined,
      schema: "public",
      table: "docs",
    });
    expect(result.limit).toEqual({ topK: 10, offset: 0 });
  });

  it("throws on multi-signal fusion (not supported by pgvector)", () => {
    expect(() =>
      sqlize(
        {
          max: [
            { content: "search", weight: 0.3 },
            { embedding: [0.1, 0.2], weight: 0.7 },
          ],
        },
        { pkey: "doc_id", schema: "public", table: "docs" },
      ),
    ).toThrow("pgvector does not support multi-signal fusion");
  });

  it("converts query with filter", () => {
    const result = sqlize(
      {
        query: [{ embedding: [0.1, 0.2] }],
        filter: { status: "active", views: { $gt: 100 } },
      },
      { pkey: "id", schema: "public", table: "docs" },
    );

    expect(result.where.filter).toEqual({
      status: "active",
      views: { $gt: 100 },
    });
  });

  it("converts query with orderBy", () => {
    const result = sqlize(
      {
        filter: { status: "active" },
        orderBy: { field: "created_at", direction: "desc" },
      },
      { pkey: "id", schema: "public", table: "docs" },
    );

    expect(result.order.orderBy).toEqual({
      field: "created_at",
      direction: "desc",
    });
  });

  it("converts query with pagination", () => {
    const result = sqlize(
      {
        query: [{ embedding: [0.1, 0.2] }],
        topK: 25,
        offset: 50,
      },
      { pkey: "id", schema: "public", table: "docs" },
    );

    expect(result.limit).toEqual({ topK: 25, offset: 50 });
  });

  it("uses default pagination values", () => {
    const result = sqlize({ query: [{ embedding: [0.1, 0.2] }] }, { pkey: "id", schema: "public", table: "docs" });

    expect(result.limit).toEqual({ topK: 10, offset: 0 });
  });

  it("passes binding through to all inputs", () => {
    const binding = {
      schema: "public",
      table: "docs",
      pkey: "id",
      fields: {
        embedding: {
          column: "vec_col",
          type: "vector" as const,
          dimensions: 3,
          similarity: "cosine" as const,
        },
      },
    };

    const result = sqlize(
      { query: [{ embedding: [0.1, 0.2, 0.3] }] },
      { pkey: "id", schema: "public", table: "docs", binding },
    );

    expect(result.select.binding).toBe(binding);
    expect(result.order.binding).toBe(binding);
  });

  it("uses custom pkey", () => {
    const result = sqlize(
      { query: [{ embedding: [0.1, 0.2] }] },
      { pkey: "document_id", schema: "public", table: "docs" },
    );

    expect(result.select.pkey).toBe("document_id");
  });

  it("handles empty query (filter-only)", () => {
    const result = sqlize(
      {
        filter: { status: "active" },
        orderBy: { field: "created_at", direction: "desc" },
        topK: 100,
      },
      { pkey: "id", schema: "public", table: "docs" },
    );

    expect(result.select.signals).toEqual([]);
    expect(result.order.signals).toEqual([]);
    expect(result.where.filter).toEqual({ status: "active" });
  });

  describe("signal priority", () => {
    it("prefers query over max when both present", () => {
      const querySignals = [{ embedding: [0.1, 0.2, 0.3] }];
      const maxSignals = [{ embedding: [0.4, 0.5, 0.6] }];

      const result = sqlize(
        { query: querySignals, max: maxSignals } as any,
        { pkey: "id", schema: "public", table: "docs" },
      );

      // query takes precedence over max
      expect(result.select.signals).toEqual(querySignals);
      expect(result.order.signals).toEqual(querySignals);
    });

    it("uses max when query is undefined", () => {
      const maxSignals = [{ embedding: [0.4, 0.5, 0.6] }];

      const result = sqlize(
        { max: maxSignals },
        { pkey: "id", schema: "public", table: "docs" },
      );

      expect(result.select.signals).toEqual(maxSignals);
      expect(result.order.signals).toEqual(maxSignals);
    });

    it("uses empty array when both query and max are undefined", () => {
      const result = sqlize(
        { filter: { status: "active" } },
        { pkey: "id", schema: "public", table: "docs" },
      );

      expect(result.select.signals).toEqual([]);
      expect(result.order.signals).toEqual([]);
    });
  });

  describe("filter-only with binding", () => {
    it("passes binding through for filter-only queries", () => {
      const binding = {
        schema: "public",
        table: "docs",
        pkey: "id",
        fields: {
          embedding: {
            column: "vec_col",
            type: "vector" as const,
            dimensions: 3,
            similarity: "cosine" as const,
          },
        },
      };

      const result = sqlize(
        { filter: { status: "active" }, topK: 50 },
        { pkey: "id", schema: "public", table: "docs", binding },
      );

      expect(result.select.binding).toBe(binding);
      expect(result.order.binding).toBe(binding);
      expect(result.select.signals).toEqual([]);
    });
  });

  describe("orderBy-only queries", () => {
    it("handles orderBy without query signals", () => {
      const result = sqlize(
        {
          orderBy: { field: "created_at", direction: "asc" },
          topK: 20,
        },
        { pkey: "id", schema: "public", table: "docs" },
      );

      expect(result.select.signals).toEqual([]);
      expect(result.order.signals).toEqual([]);
      expect(result.order.orderBy).toEqual({
        field: "created_at",
        direction: "asc",
      });
      expect(result.limit).toEqual({ topK: 20, offset: 0 });
    });
  });

  describe("edge cases", () => {
    it("handles query with empty signals array", () => {
      const result = sqlize(
        { query: [] },
        { pkey: "id", schema: "public", table: "docs" },
      );

      expect(result.select.signals).toEqual([]);
      expect(result.order.signals).toEqual([]);
    });

    it("handles all options together", () => {
      const binding = {
        schema: "public",
        table: "docs",
        pkey: "id",
        fields: {
          embedding: {
            column: "vec_col",
            type: "vector" as const,
            dimensions: 3,
            similarity: "euclidean" as const,
          },
        },
      };

      const result = sqlize(
        {
          query: [{ embedding: [0.1, 0.2, 0.3] }],
          filter: { status: "active", views: { $gt: 100 } },
          orderBy: { field: "created_at", direction: "desc" },
          topK: 50,
          offset: 25,
        },
        { pkey: "doc_id", schema: "public", table: "documents", binding },
      );

      expect(result.select.pkey).toBe("doc_id");
      expect(result.select.signals).toHaveLength(1);
      expect(result.select.binding).toBe(binding);
      expect(result.where.filter).toEqual({
        status: "active",
        views: { $gt: 100 },
      });
      expect(result.order.orderBy).toEqual({
        field: "created_at",
        direction: "desc",
      });
      expect(result.order.binding).toBe(binding);
      expect(result.limit).toEqual({ topK: 50, offset: 25 });
    });

    it("handles undefined filter", () => {
      const result = sqlize(
        { query: [{ embedding: [0.1, 0.2] }] },
        { pkey: "id", schema: "public", table: "docs" },
      );

      expect(result.where.filter).toBeUndefined();
    });

    it("handles undefined orderBy", () => {
      const result = sqlize(
        { query: [{ embedding: [0.1, 0.2] }] },
        { pkey: "id", schema: "public", table: "docs" },
      );

      expect(result.order.orderBy).toBeUndefined();
    });
  });
});

/**
 * Full pipeline integration tests.
 * These tests verify that sqlize → all codecs → assembled SQL works correctly.
 */
describe("full pipeline integration", () => {
  it("assembles complete SQL with vector search, filter, and pagination", () => {
    const vector = [0.1, 0.2, 0.3];
    const binding = {
      schema: "public",
      table: "documents",
      pkey: "id",
      fields: {
        embedding: {
          column: "vec_col",
          type: "vector" as const,
          dimensions: 3,
          similarity: "cosine" as const,
        },
      },
    };

    // Step 1: sqlize the query
    const query = sqlize(
      {
        query: [{ embedding: vector }],
        filter: { status: "active", views: { $gt: 100 } },
        topK: 25,
        offset: 50,
      },
      { pkey: "doc_id", schema: "public", table: "documents", binding },
    );

    // Step 2: encode each clause (include: false to exclude extra columns)
    const select = SQL_SELECT.encode({ ...query.select, include: false });
    const whereStartIdx = 1 + select.params.length;
    const where = SQL_WHERE.encode({ ...query.where, startIdx: whereStartIdx });
    const order = SQL_ORDER.encode(query.order);
    const limitStartIdx = whereStartIdx + where.params.length;
    const limit = SQL_LIMIT.encode({ ...query.limit, startIdx: limitStartIdx });

    // Step 3: verify individual clauses
    expect(select.sql).toBe(
      '"doc_id" as id, 1 - ("vec_col" <=> $1::vector) as score',
    );
    expect(select.params).toEqual([JSON.stringify(vector)]);

    expect(where.sql).toBe('"status" = $2 AND "views" > $3');
    expect(where.params).toEqual(["active", 100]);

    expect(order.sql).toBe('"vec_col" <=> $1::vector');

    expect(limit.sql).toBe("LIMIT $4 OFFSET $5");
    expect(limit.params).toEqual([25, 50]);

    // Step 4: verify assembled params array
    const allParams = [...select.params, ...where.params, ...limit.params];
    expect(allParams).toEqual([
      JSON.stringify(vector), // $1
      "active", // $2
      100, // $3
      25, // $4
      50, // $5
    ]);

    // Step 5: verify param indices are correct
    expect(whereStartIdx).toBe(2);
    expect(limitStartIdx).toBe(4);
  });

  it("assembles SQL with filter-only query (no vector)", () => {
    const query = sqlize(
      {
        filter: {
          status: "published",
          $or: [{ featured: true }, { views: { $gte: 1000 } }],
        },
        orderBy: { field: "created_at", direction: "desc" },
        topK: 10,
      },
      { pkey: "id", schema: "public", table: "docs" },
    );

    const select = SQL_SELECT.encode(query.select);
    const whereStartIdx = 1 + select.params.length;
    const where = SQL_WHERE.encode({ ...query.where, startIdx: whereStartIdx });
    const order = SQL_ORDER.encode(query.order);
    const limitStartIdx = whereStartIdx + where.params.length;
    const limit = SQL_LIMIT.encode({ ...query.limit, startIdx: limitStartIdx });

    // No vector signal, so no params from SELECT
    expect(select.sql).toBe('"id" as id, 1 as score');
    expect(select.params).toEqual([]);

    // WHERE starts at $1 since SELECT has no params
    expect(where.sql).toBe(
      '"status" = $1 AND (("featured" = $2) OR ("views" >= $3))',
    );
    expect(where.params).toEqual(["published", true, 1000]);

    // ORDER BY uses explicit field (table-qualified to avoid ambiguity)
    expect(order.sql).toBe('"public"."docs"."created_at" DESC');

    // LIMIT starts at $4
    expect(limit.sql).toBe("LIMIT $4");
    expect(limit.params).toEqual([10]);
  });

  it("assembles SQL with complex nested filter", () => {
    const vector = [0.5, 0.5];

    const query = sqlize(
      {
        query: [{ embedding: vector }],
        filter: {
          $and: [
            { type: "article" },
            {
              $or: [
                { status: "published" },
                { $and: [{ status: "draft" }, { author_id: 123 }] },
              ],
            },
          ],
          deleted_at: null,
        },
        topK: 5,
      },
      { pkey: "id", schema: "public", table: "docs" },
    );

    const select = SQL_SELECT.encode(query.select);
    const whereStartIdx = 1 + select.params.length;
    const where = SQL_WHERE.encode({ ...query.where, startIdx: whereStartIdx });
    const limitStartIdx = whereStartIdx + where.params.length;
    const limit = SQL_LIMIT.encode({ ...query.limit, startIdx: limitStartIdx });

    // SELECT uses $1
    expect(select.params).toHaveLength(1);

    // WHERE uses $2-$6
    expect(where.sql).toBe(
      '(("type" = $2) AND ((("status" = $3) OR ((("status" = $4) AND ("author_id" = $5)))))) AND "deleted_at" IS NULL',
    );
    expect(where.params).toEqual(["article", "published", "draft", 123]);

    // LIMIT uses $6
    expect(limit.sql).toBe("LIMIT $6");
    expect(limit.params).toEqual([5]);
  });

  it("handles euclidean distance correctly through pipeline", () => {
    const vector = [1.0, 2.0, 3.0];
    const binding = {
      schema: "public",
      table: "docs",
      pkey: "id",
      fields: {
        embedding: {
          column: "embedding",
          type: "vector" as const,
          dimensions: 3,
          similarity: "euclidean" as const,
        },
      },
    };

    const query = sqlize(
      { query: [{ embedding: vector }], topK: 10 },
      { pkey: "id", schema: "public", table: "docs", binding },
    );

    const select = SQL_SELECT.encode({ ...query.select, include: false });
    const order = SQL_ORDER.encode(query.order);

    // Euclidean uses <-> operator
    expect(select.sql).toBe(
      '"id" as id, 1 / (1 + ("embedding" <-> $1::vector)) as score',
    );
    expect(order.sql).toBe('"embedding" <-> $1::vector');
  });

  it("handles dot product correctly through pipeline", () => {
    const vector = [1.0, 2.0, 3.0];
    const binding = {
      schema: "public",
      table: "docs",
      pkey: "id",
      fields: {
        embedding: {
          column: "embedding",
          type: "vector" as const,
          dimensions: 3,
          similarity: "dot_product" as const,
        },
      },
    };

    const query = sqlize(
      { query: [{ embedding: vector }], topK: 10 },
      { pkey: "id", schema: "public", table: "docs", binding },
    );

    const select = SQL_SELECT.encode({ ...query.select, include: false });
    const order = SQL_ORDER.encode(query.order);

    // Dot product uses <#> operator
    expect(select.sql).toBe(
      '"id" as id, -("embedding" <#> $1::vector) as score',
    );
    expect(order.sql).toBe('"embedding" <#> $1::vector');
  });

  it("guards against parameter index drift", () => {
    // This test ensures that when we chain all codecs together,
    // the parameter indices don't drift or overlap

    const query = sqlize(
      {
        query: [{ embedding: [0.1, 0.2] }],
        filter: { a: 1, b: 2, c: 3 },
        topK: 10,
        offset: 20,
      },
      { pkey: "id", schema: "public", table: "docs" },
    );

    const select = SQL_SELECT.encode(query.select);
    const whereStartIdx = 1 + select.params.length;
    const where = SQL_WHERE.encode({ ...query.where, startIdx: whereStartIdx });
    const limitStartIdx = whereStartIdx + where.params.length;
    const limit = SQL_LIMIT.encode({ ...query.limit, startIdx: limitStartIdx });

    // Verify no gaps in indices
    // SELECT: $1 (vector)
    // WHERE: $2, $3, $4 (a, b, c)
    // LIMIT: $5, $6 (topK, offset)

    expect(select.params).toHaveLength(1); // $1
    expect(whereStartIdx).toBe(2);
    expect(where.params).toHaveLength(3); // $2, $3, $4
    expect(limitStartIdx).toBe(5);
    expect(limit.params).toHaveLength(2); // $5, $6

    // Total params should be 6
    const allParams = [...select.params, ...where.params, ...limit.params];
    expect(allParams).toHaveLength(6);
  });
});
