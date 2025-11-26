import { describe, it, expect, vi } from "vitest";

import {
  CursorPage,
  type CursorPageResponse,
  type CursorPageParams,
} from "../cursor";

describe("CursorPage", () => {
  describe("construction", () => {
    it("should initialize with response data", () => {
      const response: CursorPageResponse<string> = {
        data: ["a", "b", "c"],
        next: "cursor_123",
        last: false,
      };

      const loader = vi.fn();
      const page = new CursorPage({
        params: {},
        response,
        loader,
      });

      expect(page.data).toEqual(["a", "b", "c"]);
      expect(page.items).toEqual(["a", "b", "c"]);
      expect(page.last).toBe(false);
    });

    it("should handle empty data array", () => {
      const response: CursorPageResponse<string> = {
        data: [],
        next: null,
        last: true,
      };

      const loader = vi.fn();
      const page = new CursorPage({
        params: {},
        response,
        loader,
      });

      expect(page.data).toEqual([]);
      expect(page.items).toEqual([]);
      expect(page.last).toBe(true);
    });

    it("should handle null data gracefully", () => {
      const response: CursorPageResponse<string> = {
        data: null as any, // simulate backend returning null
        next: null,
        last: true,
      };

      const loader = vi.fn();
      const page = new CursorPage({
        params: {},
        response,
        loader,
      });

      expect(page.data).toEqual([]);
      expect(page.items).toEqual([]);
    });
  });

  describe("items getter", () => {
    it("should return exact reference to data array", () => {
      const data = ["a", "b", "c"];
      const response: CursorPageResponse<string> = {
        data,
        next: null,
        last: false,
      };

      const page = new CursorPage({
        params: {},
        response,
        loader: vi.fn(),
      });

      expect(page.items).toBe(page.data);
    });
  });

  describe("last getter", () => {
    it("should return true when response.last is true", () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: "cursor", last: true },
        loader: vi.fn(),
      });

      expect(page.last).toBe(true);
    });

    it("should return true when next cursor is null", () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: null, last: false },
        loader: vi.fn(),
      });

      expect(page.last).toBe(true);
    });

    it("should return true when data is empty", () => {
      const page = new CursorPage({
        params: {},
        response: { data: [], next: "cursor", last: false },
        loader: vi.fn(),
      });

      expect(page.last).toBe(true);
    });

    it("should return false when has next cursor and data", () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a", "b"], next: "cursor_123", last: false },
        loader: vi.fn(),
      });

      expect(page.last).toBe(false);
    });

    it("should prioritize response.last over next cursor", () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: "cursor", last: true },
        loader: vi.fn(),
      });

      expect(page.last).toBe(true);
    });
  });

  describe("next()", () => {
    it("should return null when last is true", async () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: null, last: true },
        loader: vi.fn(),
      });

      const nextPage = await page.next();
      expect(nextPage).toBe(null);
    });

    it("should return null when no next cursor", async () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: null, last: false },
        loader: vi.fn(),
      });

      const nextPage = await page.next();
      expect(nextPage).toBe(null);
    });

    it("should fetch next page with cursor in params", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["d", "e", "f"],
        next: "cursor_456",
        last: false,
      });

      const page = new CursorPage({
        params: { limit: 10 },
        response: { data: ["a", "b", "c"], next: "cursor_123", last: false },
        loader,
      });

      const nextPage = await page.next();

      expect(loader).toHaveBeenCalledTimes(1);
      expect(loader).toHaveBeenCalledWith({
        limit: 10,
        cursor: "cursor_123",
      });

      expect(nextPage).not.toBe(null);
      expect(nextPage!.data).toEqual(["d", "e", "f"]);
      expect(nextPage!.items).toEqual(["d", "e", "f"]);
    });

    it("should preserve params across pagination", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["x"],
        next: null,
        last: true,
      });

      const page = new CursorPage({
        params: { limit: 5, cursor: "initial" },
        response: { data: ["a"], next: "cursor_next", last: false },
        loader,
      });

      await page.next();

      expect(loader).toHaveBeenCalledWith({
        limit: 5,
        cursor: "cursor_next", // cursor gets updated
      });
    });

    it("should return instance of CursorPage", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: ["d"],
        next: null,
        last: true,
      });

      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: "cursor", last: false },
        loader,
      });

      const nextPage = await page.next();
      expect(nextPage).toBeInstanceOf(CursorPage);
    });
  });

  describe("pages() generator", () => {
    it("should yield only current page when last", async () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: null, last: true },
        loader: vi.fn(),
      });

      const pages: CursorPage<string>[] = [];
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
          next: "cursor_2",
          last: false,
        })
        .mockResolvedValueOnce({
          data: ["f"],
          next: null,
          last: true,
        });

      const page = new CursorPage({
        params: {},
        response: { data: ["a", "b", "c"], next: "cursor_1", last: false },
        loader,
      });

      const pages: CursorPage<string>[] = [];
      for await (const p of page.pages()) {
        pages.push(p);
      }

      expect(pages).toHaveLength(3);
      expect(pages[0].data).toEqual(["a", "b", "c"]);
      expect(pages[1].data).toEqual(["d", "e"]);
      expect(pages[2].data).toEqual(["f"]);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it("should stop when next() returns null", async () => {
      const loader = vi.fn().mockResolvedValue({
        data: [],
        next: null,
        last: true,
      });

      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: "cursor", last: false },
        loader,
      });

      const pages: CursorPage<string>[] = [];
      for await (const p of page.pages()) {
        pages.push(p);
      }

      expect(pages).toHaveLength(2); // original + one fetched
    });
  });

  describe("Symbol.asyncIterator", () => {
    it("should iterate over items in single page", async () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a", "b", "c"], next: null, last: true },
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
        next: null,
        last: true,
      });

      const page = new CursorPage({
        params: {},
        response: { data: ["a", "b", "c"], next: "cursor_1", last: false },
        loader,
      });

      const items: string[] = [];
      for await (const item of page) {
        items.push(item);
      }

      expect(items).toEqual(["a", "b", "c", "d", "e"]);
    });

    it("should handle empty pages gracefully", async () => {
      const page = new CursorPage({
        params: {},
        response: { data: [], next: null, last: true },
        loader: vi.fn(),
      });

      const items: string[] = [];
      for await (const item of page) {
        items.push(item);
      }

      expect(items).toEqual([]);
    });

    it("should work with complex objects", async () => {
      type User = { id: string; name: string };
      const users: User[] = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ];

      const page = new CursorPage<User>({
        params: {},
        response: { data: users, next: null, last: true },
        loader: vi.fn(),
      });

      const collected: User[] = [];
      for await (const user of page) {
        collected.push(user);
      }

      expect(collected).toEqual(users);
      expect(collected[0]).toEqual({ id: "1", name: "Alice" });
    });
  });

  describe("collect()", () => {
    it("should collect all items from single page", async () => {
      const page = new CursorPage({
        params: {},
        response: { data: ["a", "b", "c"], next: null, last: true },
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
          next: "cursor_2",
          last: false,
        })
        .mockResolvedValueOnce({
          data: ["g", "h"],
          next: null,
          last: true,
        });

      const page = new CursorPage({
        params: {},
        response: { data: ["a", "b", "c"], next: "cursor_1", last: false },
        loader,
      });

      const items = await page.collect();
      expect(items).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it("should return empty array for empty page", async () => {
      const page = new CursorPage({
        params: {},
        response: { data: [], next: null, last: true },
        loader: vi.fn(),
      });

      const items = await page.collect();
      expect(items).toEqual([]);
    });

    it("should preserve item order across pages", async () => {
      const loader = vi
        .fn()
        .mockResolvedValueOnce({ data: [4, 5, 6], next: null, last: true });

      const page = new CursorPage({
        params: {},
        response: { data: [1, 2, 3], next: "cursor", last: false },
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
        next: null,
        last: true,
      });

      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: "cursor", last: false },
        loader,
      });

      const next1 = await page.next();
      const next2 = await page.next();

      expect(next1).not.toBe(null);
      expect(next2).not.toBe(null);
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it("should handle loader throwing error", async () => {
      const loader = vi.fn().mockRejectedValue(new Error("Network error"));

      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: "cursor", last: false },
        loader,
      });

      await expect(page.next()).rejects.toThrow("Network error");
    });

    it("should not call loader when last is true", async () => {
      const loader = vi.fn();

      const page = new CursorPage({
        params: {},
        response: { data: ["a"], next: null, last: true },
        loader,
      });

      await page.next();
      expect(loader).not.toHaveBeenCalled();
    });

    it("should handle params with custom properties", async () => {
      interface CustomParams extends CursorPageParams {
        agentId?: string;
        filter?: string;
      }

      const loader = vi.fn().mockResolvedValue({
        data: ["b"],
        next: null,
        last: true,
      });

      const page = new CursorPage<string, CustomParams>({
        params: { agentId: "agent-1", filter: "active", limit: 10 },
        response: { data: ["a"], next: "cursor", last: false },
        loader,
      });

      await page.next();

      expect(loader).toHaveBeenCalledWith({
        agentId: "agent-1",
        filter: "active",
        limit: 10,
        cursor: "cursor",
      });
    });
  });
});
