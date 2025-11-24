import { describe, it, expect, vi } from "vitest";
import {
  OffsetPage,
  type OffsetPageResponse,
  type OffsetPageParams,
} from "../pagination/offset";

describe("OffsetPage", () => {
  describe("construction", () => {
    it("should initialize with response data", () => {
      const response: OffsetPageResponse<string> = {
        data: ["a", "b", "c"],
        offset: 0,
        limit: 10,
        total: 100,
      };

      const loader = vi.fn();
      const page = new OffsetPage({
        params: { offset: 0, limit: 10 },
        response,
        loader,
      });

      expect(page.data).toEqual(["a", "b", "c"]);
      expect(page.items).toEqual(["a", "b", "c"]);
      expect(page.offset).toBe(0);
      expect(page.limit).toBe(10);
      expect(page.total).toBe(100);
    });

    it("should handle empty data array", () => {
      const response: OffsetPageResponse<string> = {
        data: [],
        offset: 0,
        limit: 10,
      };

      const loader = vi.fn();
      const page = new OffsetPage({
        params: {},
        response,
        loader,
      });

      expect(page.data).toEqual([]);
      expect(page.items).toEqual([]);
      expect(page.last).toBe(true);
    });

    it("should handle null data gracefully", () => {
      const response: OffsetPageResponse<string> = {
        data: null as any,
        offset: 0,
        limit: 10,
      };

      const loader = vi.fn();
      const page = new OffsetPage({
        params: {},
        response,
        loader,
      });

      expect(page.data).toEqual([]);
      expect(page.items).toEqual([]);
    });

    it("should handle response without total", () => {
      const response: OffsetPageResponse<string> = {
        data: ["a", "b"],
        offset: 0,
        limit: 10,
      };

      const page = new OffsetPage({
        params: {},
        response,
        loader: vi.fn(),
      });

      expect(page.total).toBeUndefined();
    });
  });

  describe("items getter", () => {
    it("should return exact reference to data array", () => {
      const data = ["a", "b", "c"];
      const response: OffsetPageResponse<string> = {
        data,
        offset: 0,
        limit: 10,
      };

      const page = new OffsetPage({
        params: {},
        response,
        loader: vi.fn(),
      });

      expect(page.items).toBe(page.data);
    });
  });

  describe("last getter", () => {
    it("should return true when data is empty", () => {
      const page = new OffsetPage({
        params: {},
        response: { data: [], offset: 0, limit: 10 },
        loader: vi.fn(),
      });

      expect(page.last).toBe(true);
    });

    it("should return true when offset + limit >= total", () => {
      const page = new OffsetPage({
        params: {},
        response: { data: ["a"], offset: 90, limit: 10, total: 100 },
        loader: vi.fn(),
      });

      expect(page.last).toBe(true);
    });

    it("should return true when offset + limit equals total exactly", () => {
      const page = new OffsetPage({
        params: {},
        response: { data: ["a", "b"], offset: 98, limit: 2, total: 100 },
        loader: vi.fn(),
      });

      expect(page.last).toBe(true);
    });

    it("should return false when offset + limit < total", () => {
      const page = new OffsetPage({
        params: {},
        response: { data: ["a", "b"], offset: 0, limit: 10, total: 100 },
        loader: vi.fn(),
      });

      expect(page.last).toBe(false);
    });

    it("should return false when total is undefined and data exists", () => {
      const page = new OffsetPage({
        params: {},
        response: { data: ["a", "b"], offset: 0, limit: 10 },
        loader: vi.fn(),
      });

      expect(page.last).toBe(false);
    });

    it("should handle offset and limit of 0", () => {
      const page = new OffsetPage({
        params: {},
        response: { data: ["a"], offset: 0, limit: 0 },
        loader: vi.fn(),
      });

      // With limit 0, next would be 0, so it can't progress
      expect(page.last).toBe(false);
    });

    it("should handle undefined offset and limit", () => {
      const page = new OffsetPage({
        params: {},
        response: {
          data: ["a"],
          offset: undefined as any,
          limit: undefined as any,
        },
        loader: vi.fn(),
      });

      expect(page.last).toBe(false);
    });
  });

  describe("next()", () => {
    it("should return null when last is true", async () => {
      const page = new OffsetPage({
        params: {},
        response: { data: [], offset: 0, limit: 10 },
        loader: vi.fn(),
      });

      const nextPage = await page.next();
      expect(nextPage).toBe(null);
    });

    it("should fetch next page with incremented offset", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["d", "e", "f"],
        offset: 10,
        limit: 10,
        total: 100,
      });

      const page = new OffsetPage({
        params: { offset: 0, limit: 10 },
        response: { data: ["a", "b", "c"], offset: 0, limit: 10, total: 100 },
        loader,
      });

      const nextPage = await page.next();

      expect(loader).toHaveBeenCalledTimes(1);
      expect(loader).toHaveBeenCalledWith({
        offset: 10,
        limit: 10,
      });

      expect(nextPage).not.toBe(null);
      expect(nextPage!.data).toEqual(["d", "e", "f"]);
      expect(nextPage!.offset).toBe(10);
    });

    it("should calculate next offset correctly", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["x"],
        offset: 25,
        limit: 5,
        total: 100,
      });

      const page = new OffsetPage({
        params: { offset: 20, limit: 5 },
        response: { data: ["a"], offset: 20, limit: 5, total: 100 },
        loader,
      });

      await page.next();

      expect(loader).toHaveBeenCalledWith({
        offset: 25,
        limit: 5,
      });
    });

    it("should preserve params across pagination", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["x"],
        offset: 10,
        limit: 10,
      });

      const page = new OffsetPage({
        params: { offset: 0, limit: 10 },
        response: { data: ["a"], offset: 0, limit: 10 },
        loader,
      });

      await page.next();

      expect(loader).toHaveBeenCalledWith({
        offset: 10,
        limit: 10,
      });
    });

    it("should return instance of OffsetPage", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["d"],
        offset: 10,
        limit: 10,
      });

      const page = new OffsetPage({
        params: { offset: 0, limit: 10 },
        response: { data: ["a"], offset: 0, limit: 10 },
        loader,
      });

      const nextPage = await page.next();
      expect(nextPage).toBeInstanceOf(OffsetPage);
    });

    it("should handle undefined offset and limit", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["b"],
        offset: 0,
        limit: 0,
      });

      const page = new OffsetPage({
        params: {},
        response: {
          data: ["a"],
          offset: undefined as any,
          limit: undefined as any,
        },
        loader,
      });

      await page.next();

      // offset ?? 0 + limit ?? 0 = 0
      expect(loader).toHaveBeenCalledWith({
        offset: 0,
      });
    });
  });

  describe("pages() generator", () => {
    it("should yield only current page when last", async () => {
      const page = new OffsetPage({
        params: {},
        response: { data: [], offset: 0, limit: 10 },
        loader: vi.fn(),
      });

      const pages = [];
      for await (const p of page.pages()) {
        pages.push(p);
      }

      expect(pages).toHaveLength(1);
      expect(pages[0]).toBe(page);
    });

    it("should yield multiple pages until last", async () => {
      const loader = vi
        .fn()
        .mockResolvedValueOnce({
          data: ["d", "e"],
          offset: 3,
          limit: 3,
          total: 8,
        })
        .mockResolvedValueOnce({
          data: ["f", "g"],
          offset: 6,
          limit: 3,
          total: 8,
        });

      const page = new OffsetPage({
        params: { offset: 0, limit: 3 },
        response: { data: ["a", "b", "c"], offset: 0, limit: 3, total: 8 },
        loader,
      });

      const pages = [];
      for await (const p of page.pages()) {
        pages.push(p);
      }

      expect(pages).toHaveLength(3);
      expect(pages[0].data).toEqual(["a", "b", "c"]);
      expect(pages[1].data).toEqual(["d", "e"]);
      expect(pages[2].data).toEqual(["f", "g"]);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it("should stop when next() returns null", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: [],
        offset: 10,
        limit: 10,
      });

      const page = new OffsetPage({
        params: { offset: 0, limit: 10 },
        response: { data: ["a"], offset: 0, limit: 10 },
        loader,
      });

      const pages = [];
      for await (const p of page.pages()) {
        pages.push(p);
      }

      expect(pages).toHaveLength(2); // original + one fetched (which is empty/last)
    });
  });

  describe("Symbol.asyncIterator", () => {
    it("should iterate over items in single page", async () => {
      const page = new OffsetPage({
        params: {},
        response: { data: ["a", "b", "c"], offset: 0, limit: 10, total: 3 },
        loader: vi.fn(),
      });

      const items: string[] = [];
      for await (const item of page) {
        items.push(item);
      }

      expect(items).toEqual(["a", "b", "c"]);
    });

    it("should iterate over items across multiple pages", async () => {
      const loader = vi.fn().mockResolvedValueOnce({
        data: ["d", "e"],
        offset: 3,
        limit: 3,
        total: 5,
      });

      const page = new OffsetPage({
        params: { offset: 0, limit: 3 },
        response: { data: ["a", "b", "c"], offset: 0, limit: 3, total: 5 },
        loader,
      });

      const items: string[] = [];
      for await (const item of page) {
        items.push(item);
      }

      expect(items).toEqual(["a", "b", "c", "d", "e"]);
    });

    it("should handle empty pages gracefully", async () => {
      const page = new OffsetPage({
        params: {},
        response: { data: [], offset: 0, limit: 10 },
        loader: vi.fn(),
      });

      const items: string[] = [];
      for await (const item of page) {
        items.push(item);
      }

      expect(items).toEqual([]);
    });

    it("should work with complex objects", async () => {
      type User = { id: number; name: string };
      const users: User[] = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];

      const page = new OffsetPage<User>({
        params: {},
        response: { data: users, offset: 0, limit: 10, total: 2 },
        loader: vi.fn(),
      });

      const collected: User[] = [];
      for await (const user of page) {
        collected.push(user);
      }

      expect(collected).toEqual(users);
      expect(collected[0]).toEqual({ id: 1, name: "Alice" });
    });
  });

  describe("collect()", () => {
    it("should collect all items from single page", async () => {
      const page = new OffsetPage({
        params: {},
        response: { data: ["a", "b", "c"], offset: 0, limit: 10, total: 3 },
        loader: vi.fn(),
      });

      const items = await page.collect();
      expect(items).toEqual(["a", "b", "c"]);
    });

    it("should collect all items from multiple pages", async () => {
      const loader = vi
        .fn()
        .mockResolvedValueOnce({
          data: ["d", "e", "f"],
          offset: 3,
          limit: 3,
          total: 8,
        })
        .mockResolvedValueOnce({
          data: ["g", "h"],
          offset: 6,
          limit: 3,
          total: 8,
        });

      const page = new OffsetPage({
        params: { offset: 0, limit: 3 },
        response: { data: ["a", "b", "c"], offset: 0, limit: 3, total: 8 },
        loader,
      });

      const items = await page.collect();
      expect(items).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it("should return empty array for empty page", async () => {
      const page = new OffsetPage({
        params: {},
        response: { data: [], offset: 0, limit: 10 },
        loader: vi.fn(),
      });

      const items = await page.collect();
      expect(items).toEqual([]);
    });

    it("should preserve item order across pages", async () => {
      const loader = vi
        .fn()
        .mockResolvedValueOnce({
          data: [4, 5, 6],
          offset: 3,
          limit: 3,
          total: 6,
        });

      const page = new OffsetPage({
        params: { offset: 0, limit: 3 },
        response: { data: [1, 2, 3], offset: 0, limit: 3, total: 6 },
        loader,
      });

      const items = await page.collect();
      expect(items).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe("edge cases", () => {
    it("should handle consecutive next() calls correctly", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["next"],
        offset: 10,
        limit: 10,
      });

      const page = new OffsetPage({
        params: { offset: 0, limit: 10 },
        response: { data: ["a"], offset: 0, limit: 10 },
        loader,
      });

      const next1 = await page.next();
      const next2 = await page.next();

      expect(next1).not.toBe(null);
      expect(next2).not.toBe(null);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it("should handle loader throwing error", async () => {
      const loader = vi.fn().mockRejectedValue(new Error("Database error"));

      const page = new OffsetPage({
        params: { offset: 0, limit: 10 },
        response: { data: ["a"], offset: 0, limit: 10 },
        loader,
      });

      await expect(page.next()).rejects.toThrow("Database error");
    });

    it("should not call loader when last is true", async () => {
      const loader = vi.fn();

      const page = new OffsetPage({
        params: {},
        response: { data: [], offset: 0, limit: 10 },
        loader,
      });

      await page.next();
      expect(loader).not.toHaveBeenCalled();
    });

    it("should handle params with custom properties", async () => {
      interface CustomParams extends OffsetPageParams {
        agentId?: string;
        filter?: string;
      }

      const loader = vi.fn().mockResolvedValue({
        data: ["b"],
        offset: 10,
        limit: 10,
      });

      const page = new OffsetPage<string, CustomParams>({
        params: { agentId: "agent-1", filter: "active", offset: 0, limit: 10 },
        response: { data: ["a"], offset: 0, limit: 10 },
        loader,
      });

      await page.next();

      expect(loader).toHaveBeenCalledWith({
        agentId: "agent-1",
        filter: "active",
        offset: 10,
        limit: 10,
      });
    });

    it("should handle large offsets correctly", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["x"],
        offset: 1000010,
        limit: 10,
        total: 2000000,
      });

      const page = new OffsetPage({
        params: { offset: 1000000, limit: 10 },
        response: { data: ["a"], offset: 1000000, limit: 10, total: 2000000 },
        loader,
      });

      await page.next();

      expect(loader).toHaveBeenCalledWith({
        offset: 1000010,
        limit: 10,
      });
    });
  });
});
