import { describe, it, expect } from "vitest";
import { RegistryItemSchema } from "../schema";

describe("RegistryItemSchema", () => {
  const validItem = {
    name: "gmail",
    type: "kernl:toolkit" as const,
    title: "Gmail Toolkit",
    description: "Send and read emails",
    files: [
      {
        path: "toolkits/gmail/index.ts",
        type: "kernl:toolkit:source",
        content: "export const gmail = {};",
      },
    ],
  };

  it("parses valid registry item", () => {
    const result = RegistryItemSchema.parse(validItem);
    expect(result.name).toBe("gmail");
    expect(result.files).toHaveLength(1);
  });

  it("provides defaults for optional arrays", () => {
    const result = RegistryItemSchema.parse(validItem);
    expect(result.dependencies).toEqual([]);
    expect(result.env).toEqual([]);
  });

  it("preserves dependencies and env when provided", () => {
    const result = RegistryItemSchema.parse({
      ...validItem,
      dependencies: ["@googleapis/gmail@^5.0.0"],
      env: ["GMAIL_CLIENT_ID"],
    });
    expect(result.dependencies).toEqual(["@googleapis/gmail@^5.0.0"]);
    expect(result.env).toEqual(["GMAIL_CLIENT_ID"]);
  });

  it("rejects invalid type", () => {
    expect(() =>
      RegistryItemSchema.parse({
        ...validItem,
        type: "kernl:agent",
      }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => RegistryItemSchema.parse({ name: "gmail" })).toThrow();
  });

  it("rejects empty files array", () => {
    expect(() =>
      RegistryItemSchema.parse({
        ...validItem,
        files: [],
      }),
    ).toThrow();
  });
});
