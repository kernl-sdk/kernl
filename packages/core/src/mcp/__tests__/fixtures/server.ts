#!/usr/bin/env node
/**
 * Simple test server combining math and string operations for MCP testing.
 *
 * Provides deterministic operations for comprehensive test coverage.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "test-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Math tools
    {
      name: "add",
      description: "Add two numbers",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" },
        },
        required: ["a", "b"],
      },
    },
    {
      name: "multiply",
      description: "Multiply two numbers",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" },
        },
        required: ["a", "b"],
      },
    },
    {
      name: "divide",
      description: "Divide two numbers",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "number", description: "Numerator" },
          b: { type: "number", description: "Denominator" },
        },
        required: ["a", "b"],
      },
    },
    // String tools
    {
      name: "echo",
      description: "Echo back the input text",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to echo" },
        },
        required: ["text"],
      },
    },
    {
      name: "uppercase",
      description: "Convert text to uppercase",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to convert" },
        },
        required: ["text"],
      },
    },
    {
      name: "reverse",
      description: "Reverse the text",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to reverse" },
        },
        required: ["text"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // Math operations
    case "add":
      return {
        content: [
          {
            type: "text",
            text: String((args as any).a + (args as any).b),
          },
        ],
      };

    case "multiply":
      return {
        content: [
          {
            type: "text",
            text: String((args as any).a * (args as any).b),
          },
        ],
      };

    case "divide":
      if ((args as any).b === 0) {
        throw new Error("Division by zero");
      }
      return {
        content: [
          {
            type: "text",
            text: String((args as any).a / (args as any).b),
          },
        ],
      };

    // String operations
    case "echo":
      return {
        content: [
          {
            type: "text",
            text: (args as any).text,
          },
        ],
      };

    case "uppercase":
      return {
        content: [
          {
            type: "text",
            text: (args as any).text.toUpperCase(),
          },
        ],
      };

    case "reverse":
      return {
        content: [
          {
            type: "text",
            text: (args as any).text.split("").reverse().join(""),
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
