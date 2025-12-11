import { describe, it, expect } from "vitest";
import { transformImports, relPath } from "../transform";

describe("transformImports", () => {
  it("rewrites @/toolkits to custom alias", () => {
    const input = `import { client } from "@/toolkits/gmail/client";`;
    const output = transformImports(input, "~/toolkits");
    expect(output).toBe(`import { client } from "~/toolkits/gmail/client";`);
  });

  it("handles single quotes", () => {
    const input = `import { client } from '@/toolkits/gmail/client';`;
    const output = transformImports(input, "~/toolkits");
    expect(output).toBe(`import { client } from '~/toolkits/gmail/client';`);
  });

  it("leaves other imports unchanged", () => {
    const input = `import { z } from "zod";`;
    const output = transformImports(input, "~/toolkits");
    expect(output).toBe(`import { z } from "zod";`);
  });

  it("skips transform when alias matches canonical", () => {
    const input = `import { client } from "@/toolkits/gmail/client";`;
    const output = transformImports(input, "@/toolkits");
    expect(output).toBe(input);
  });

  it("handles multiple imports in same file", () => {
    const input = `import { a } from "@/toolkits/gmail/a";
import { b } from "@/toolkits/gmail/b";
import { z } from "zod";`;
    const output = transformImports(input, "~/t");
    expect(output).toBe(`import { a } from "~/t/gmail/a";
import { b } from "~/t/gmail/b";
import { z } from "zod";`);
  });
});

describe("relPath", () => {
  it("strips toolkits/ prefix", () => {
    expect(relPath("toolkits/gmail/index.ts")).toBe("gmail/index.ts");
  });

  it("handles nested paths", () => {
    expect(relPath("toolkits/gmail/utils/client.ts")).toBe(
      "gmail/utils/client.ts",
    );
  });

  it("returns unchanged if no prefix", () => {
    expect(relPath("gmail/index.ts")).toBe("gmail/index.ts");
  });
});
