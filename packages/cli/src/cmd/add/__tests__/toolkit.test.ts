import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import type { Command } from "commander";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import * as clack from "@clack/prompts";

import { loadcfg } from "@/lib/config/load";
import { fetchItem } from "@/registry/fetch";

// Mock dependencies
vi.mock("fs/promises", () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
  log: {
    step: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@/lib/config/load", () => ({
  loadcfg: vi.fn(),
}));

vi.mock("@/registry/fetch", () => ({
  buildUrl: vi.fn(
    (name: string) => `https://registry.kernl.sh/toolkits/${name}.json`,
  ),
  fetchItem: vi.fn(),
}));

vi.mock("@/lib/install", () => ({
  addDeps: vi.fn(),
}));

// Import after mocks - use beforeAll to avoid top-level await
let toolkit: Command;

beforeAll(async () => {
  const mod = await import("../toolkit");
  toolkit = mod.toolkit;
});

const mockConfig = {
  toolkitsDir: "src/toolkits",
  aliases: { toolkits: "@/toolkits" },
  registries: { "@kernl": "https://registry.kernl.sh/toolkits/{name}.json" },
};

const mockRegistryItem = {
  name: "gmail",
  type: "registry:toolkit" as const,
  title: "Gmail Toolkit",
  description: "Gmail operations",
  dependencies: ["@googleapis/gmail@^5.0.0"],
  env: ["GMAIL_CLIENT_ID"],
  files: [
    {
      path: "toolkits/gmail/index.ts",
      type: "kernl:toolkit:source",
      content: `import { Toolkit } from "kernl";\nexport const gmail = new Toolkit({ id: "gmail" });`,
    },
    {
      path: "toolkits/gmail/send.ts",
      type: "kernl:toolkit:source",
      content: `import { tool } from "kernl";\nimport { client } from "@/toolkits/gmail/client";`,
    },
  ],
};

describe("toolkit command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadcfg).mockResolvedValue(mockConfig);
    vi.mocked(fetchItem).mockResolvedValue(mockRegistryItem);
    vi.mocked(existsSync).mockReturnValue(false);
  });

  it("creates directories and writes files", async () => {
    await toolkit.parseAsync(["node", "test", "gmail"]);

    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining("src/toolkits/gmail"),
      { recursive: true },
    );
    expect(writeFile).toHaveBeenCalledTimes(2);
  });

  it("transforms imports to user alias", async () => {
    vi.mocked(loadcfg).mockResolvedValue({
      ...mockConfig,
      aliases: { toolkits: "~/toolkits" },
    });

    await toolkit.parseAsync(["node", "test", "gmail"]);

    // Check the second file which has an @/toolkits import
    const writeCall = vi
      .mocked(writeFile)
      .mock.calls.find((call) => (call[0] as string).includes("send.ts"));
    expect(writeCall?.[1]).toContain("~/toolkits/gmail/client");
    expect(writeCall?.[1]).not.toContain("@/toolkits");
  });

  it("skips if directory exists and user declines", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(clack.confirm).mockResolvedValue(false);

    await toolkit.parseAsync(["node", "test", "gmail"]);

    expect(writeFile).not.toHaveBeenCalled();
  });

  it("overwrites if directory exists and user confirms", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(clack.confirm).mockResolvedValue(true);

    await toolkit.parseAsync(["node", "test", "gmail"]);

    expect(writeFile).toHaveBeenCalled();
  });

  it("skips prompt with -y flag when directory exists", async () => {
    vi.mocked(existsSync).mockReturnValue(true);

    await toolkit.parseAsync(["node", "test", "gmail", "-y"]);

    expect(clack.confirm).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("handles multiple toolkits", async () => {
    const slackItem = {
      ...mockRegistryItem,
      name: "slack",
      files: [mockRegistryItem.files[0]],
    };
    vi.mocked(fetchItem)
      .mockResolvedValueOnce(mockRegistryItem)
      .mockResolvedValueOnce(slackItem);

    await toolkit.parseAsync(["node", "test", "gmail", "slack"]);

    expect(fetchItem).toHaveBeenCalledTimes(2);
    expect(writeFile).toHaveBeenCalledTimes(3); // 2 for gmail, 1 for slack
  });
});
