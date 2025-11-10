import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  ListToolsResultSchema,
  CallToolResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { getLogger } from "@/lib/logger";

import { BaseMCPServer, DEFAULT_STDIO_MCP_CLIENT_LOGGER_NAME } from "./base";
import type {
  MCPTool,
  CallToolResultContent,
  MCPServerStdioOptions,
  DefaultMCPServerStdioOptions,
  InitializeResult,
} from "./types";

/**
 * MCP server client that communicates over stdio (standard input/output).
 */
export class MCPServerStdio extends BaseMCPServer {
  protected session: Client | null = null;
  protected timeout: number;
  protected serverInitializeResult: InitializeResult | null = null;

  params: DefaultMCPServerStdioOptions;
  private _name: string;
  private transport: any = null;

  constructor(options: MCPServerStdioOptions) {
    super({
      cacheToolsList: options.cacheToolsList,
      toolFilter: options.toolFilter,
      logger: options.logger ?? getLogger(DEFAULT_STDIO_MCP_CLIENT_LOGGER_NAME),
    });

    this.timeout = options.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;

    // Parse command if using fullCommand format
    if ("fullCommand" in options) {
      const elements = options.fullCommand.split(" ");
      const command = elements.shift();
      if (!command) {
        throw new Error("Invalid fullCommand: " + options.fullCommand);
      }
      this.params = {
        ...options,
        command,
        args: elements,
        encoding: options.encoding || "utf-8",
        encodingErrorHandler: options.encodingErrorHandler || "strict",
      };
    } else {
      this.params = options;
    }

    this._name = options.name || `stdio: ${this.params.command}`;
  }

  /**
   * The unique name identifier for this MCP server.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Establishes connection to the MCP server.
   */
  async connect(): Promise<void> {
    try {
      this.transport = new StdioClientTransport({
        command: this.params.command,
        args: this.params.args,
        env: this.params.env,
        cwd: this.params.cwd,
      });

      this.session = new Client({
        name: this._name,
        version: "1.0.0",
      });

      await this.session.connect(this.transport);

      this.serverInitializeResult = {
        serverInfo: { name: this._name, version: "1.0.0" },
      } as InitializeResult;

      this.logger.debug(`Connected to MCP server: ${this._name}`);
    } catch (e) {
      this.logger.error("Error initializing MCP server:", e);
      await this.close();
      throw e;
    }
  }

  /**
   * Internal implementation: Fetches tools from the server.
   */
  protected async _listTools(): Promise<MCPTool[]> {
    if (!this.session) {
      throw new Error(
        "Server not initialized. Make sure you call connect() first.",
      );
    }

    const response = await this.session.listTools();
    this.logger.debug(`Listed tools: ${JSON.stringify(response)}`);
    return ListToolsResultSchema.parse(response).tools;
  }

  /**
   * Executes a tool on the server with the provided arguments.
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown> | null,
  ): Promise<CallToolResultContent> {
    if (!this.session) {
      throw new Error(
        "Server not initialized. Make sure you call connect() first.",
      );
    }

    const response = await this.session.callTool(
      {
        name: toolName,
        arguments: args ?? {},
      },
      undefined,
      {
        timeout: this.timeout,
      },
    );

    const parsed = CallToolResultSchema.parse(response);
    const result = parsed.content;

    this.logger.debug(
      `Called tool ${toolName} (args: ${JSON.stringify(args)}, result: ${JSON.stringify(result)})`,
    );

    return result as CallToolResultContent;
  }

  /**
   * Closes the connection and cleans up resources.
   */
  async close(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
  }
}
