import { describe, it, expect } from "vitest";
import { buildUrl } from "../fetch";
import { OFFICIAL_REGISTRY } from "@/lib/config/schema";

const mockConfig = {
  toolkitsDir: "src/toolkits",
  aliases: { toolkits: "@/toolkits" },
  registries: {
    "@kernl": OFFICIAL_REGISTRY,
    "@myco": "https://registry.myco.com/toolkits/{name}.json",
  },
};

describe("buildUrl", () => {
  it("builds URL for unscoped toolkit using @kernl", () => {
    const url = buildUrl("gmail", mockConfig);
    expect(url).toBe("https://registry.kernl.sh/toolkits/gmail.json");
  });

  it("builds URL for scoped toolkit", () => {
    const url = buildUrl("@myco/internal", mockConfig);
    expect(url).toBe("https://registry.myco.com/toolkits/internal.json");
  });

  it("handles nested scoped names", () => {
    const url = buildUrl("@myco/utils/auth", mockConfig);
    expect(url).toBe("https://registry.myco.com/toolkits/utils/auth.json");
  });
});
