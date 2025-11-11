import { describe, it, expect } from "vitest";
import { z } from "zod";

import { json } from "../codec";

describe("json codec", () => {
  it("should parse valid JSON and validate against schema", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const codec = json(schema);
    const result = codec.decode('{"name": "Alice", "age": 30}');

    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("should reject invalid JSON syntax", () => {
    const schema = z.object({
      name: z.string(),
    });

    const codec = json(schema);

    expect(() => {
      codec.decode('{"name": "Alice"');
    }).toThrow();
  });

  it("should reject valid JSON that doesn't match schema", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const codec = json(schema);

    // Valid JSON but age is a string, not a number
    expect(() => {
      codec.decode('{"name": "Alice", "age": "30"}');
    }).toThrow();
  });

  it("should reject JSON missing required fields", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const codec = json(schema);

    // Valid JSON but missing age field
    expect(() => {
      codec.decode('{"name": "Alice"}');
    }).toThrow();
  });

  it("should handle nested objects", () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      metadata: z.object({
        createdAt: z.string(),
      }),
    });

    const codec = json(schema);
    const result = codec.decode(
      '{"user": {"name": "Bob", "email": "bob@example.com"}, "metadata": {"createdAt": "2024-01-01"}}',
    );

    expect(result).toEqual({
      user: { name: "Bob", email: "bob@example.com" },
      metadata: { createdAt: "2024-01-01" },
    });
  });

  it("should reject nested objects that don't match schema", () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    const codec = json(schema);

    // Invalid email format
    expect(() => {
      codec.decode('{"user": {"name": "Bob", "email": "not-an-email"}}');
    }).toThrow();
  });
});
