import { tool, FunctionToolkit } from "kernl";
import { z } from "zod";

export const math = new FunctionToolkit({
  id: "math",
  tools: [add, subtract, multiply, divide],
});

export const add = tool({
  id: "add",
  name: "add",
  description: "Add two numbers",
  parameters: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
  execute: async (context, { a, b }) => {
    return a + b;
  },
});

export const subtract = tool({
  id: "subtract",
  name: "subtract",
  description: "Subtract two numbers",
  parameters: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
  execute: async (context, { a, b }) => {
    return a - b;
  },
});

export const multiply = tool({
  id: "multiply",
  name: "multiply",
  description: "Multiply two numbers",
  parameters: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
  execute: async (context, { a, b }) => {
    return a * b;
  },
});

export const divide = tool({
  id: "divide",
  name: "divide",
  description: "Divide two numbers",
  parameters: z.object({
    a: z.number().describe("Numerator"),
    b: z.number().describe("Denominator"),
  }),
  execute: async (context, { a, b }) => {
    if (b === 0) {
      throw new Error("Division by zero");
    }
    return a / b;
  },
});
