import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  ListToolsResultSchema,
  CallToolResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { getLogger } from "@/lib/logger";

import {
  BaseMCPServer,
  DEFAULT_STREAMABLE_HTTP_MCP_CLIENT_LOGGER_NAME,
} from "./base";
import type {
  MCPTool,
  CallToolResultContent,
  MCPServerStreamableHttpOptions,
  InitializeResult,
} from "./types";

/**
 * MCP server client that communicates over streamable HTTP protocol.
 */
export class MCPServerStreamableHttp extends BaseMCPServer {
  readonly id: string;
  protected session: Client | null = null;
  protected timeout: number;
  protected serverInitializeResult: InitializeResult | null = null;

  params: MCPServerStreamableHttpOptions;
  private transport: any = null;

  constructor(options: MCPServerStreamableHttpOptions) {
    super({
      cacheToolsList: options.cacheToolsList,
      toolFilter: options.toolFilter,
      logger:
        options.logger ??
        getLogger(DEFAULT_STREAMABLE_HTTP_MCP_CLIENT_LOGGER_NAME),
    });

    this.params = options;
    this.id = options.id || `streamable-http: ${this.params.url}`;
    this.timeout = options.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
  }

  /**
   * Establishes connection to the MCP server.
   */
  async connect(): Promise<void> {
    try {
      this.transport = new StreamableHTTPClientTransport(
        new URL(this.params.url),
        {
          authProvider: this.params.authProvider,
          requestInit: this.params.requestInit,
          fetch: this.params.fetch,
          reconnectionOptions: this.params.reconnectionOptions,
          sessionId: this.params.sessionId,
        },
      );

      this.session = new Client({
        name: this.id,
        version: "1.0.0",
      });

      await this.session.connect(this.transport);

      this.serverInitializeResult = {
        serverInfo: { name: this.id, version: "1.0.0" },
      } as InitializeResult;
    } catch (e) {
      this.logger.error("Error initializing MCP server:", e);
      await this.close();
      throw e;
    }

    this.logger.debug(`Connected to MCP server: ${this.id}`);
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

  /**
   * Internal implementation: Fetches tools from the server.
   *
   * Cached via the abstract base class.
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
}
