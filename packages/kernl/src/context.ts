import type { Agent } from "@/agent";

/**
 * Context that is being passed around as part of the session is unknown
 */
export type UnknownContext = unknown;

/**
 * A propagation mechanism which carries execution-scoped values across API boundaries and between logically associated
 * execution units.
 */
export class Context<TContext = UnknownContext> {
  /**
   * The namespace that this context belongs to.
   */
  namespace: string;

  /**
   * The inner context object.
   */
  context: TContext;

  /**
   * The agent executing this context.
   * Set by the thread during execution.
   */
  agent?: Agent<TContext, any>;

  // ----------------------
  // TEMPORARY: Tool approval tracking until actions system is refined
  // ----------------------

  /**
   * Map of tool call IDs to their approval status.
   * (TEMPORARY) Used until the actions system is refined.
   */
  approvals: Map<string, ApprovalStatus>;

  /**
   * Approve a tool call by its call ID.
   * (TEMPORARY) Used until the actions system is refined.
   */
  approve(callId: string): void {
    this.approvals.set(callId, "approved");
  }

  /**
   * Reject a tool call by its call ID.
   * (TEMPORARY) Used until the actions system is refined.
   */
  reject(callId: string): void {
    this.approvals.set(callId, "rejected");
  }

  // ----------------------
  // End temporary approval tracking
  // ----------------------

  // /**
  //  * Serialization format in which to render the context to the agent
  //  */
  // private format: "md" | "yaml" | "json" | "html" | "xml";

  // /**
  //  * The usage of the agent run so far. For streamed responses, the usage will be stale until the
  //  * last chunk of the stream is processed.
  //  */
  // usage: Usage;

  // /**
  //  * A map of tool names to whether they have been approved.
  //  */
  // #approvals: Map<string, ApprovalRecord>;

  constructor(namespace: string = "kernl", context: TContext = {} as TContext) {
    this.namespace = namespace;
    this.context = context;
    this.approvals = new Map();
    // this.format = format; // (TODO): configure()
    // this.usage = new Usage();
    // this.#approvals = new Map();
  }

  /**
   * Renders the context as a prompt using the default format selected. Kernel would inject this info automatically, but exposed in case of control
   */
  render(self: Context<TContext>): string {
    throw new Error("UNIMPLEMENTED");
    // switch (self.format) {
    //   case "yaml":
    //     return self.yaml();
    //   // case "json":
    //   //   return self.json();
    //   // case "xml":
    //   //   return self.xml();
    //   case "md":
    //   default:
    //     return self.md();
    // }
  }

  /**
   * Render the context object as a markdown string:
   *
   *  <context>
   *    <user>
   *      <name>John</name>
   *      <email>john@gmail.com</email>
   *    </user>
   *    <org>
   *      <id>org_235234523</id>
   *      <name>Acme Corp.<name>
   *    </org>
   *  </context>
   *
   */
  md(): string {
    throw new Error("UNIMPLEMENTED");
  }

  /**
   *  Render the context object as a yaml string:
   *
   *  context:
   *    user:
   *      name: John
   *      email: john@gmail.com
   *    org:
   *      id: org_235234523
   *      name: Acme Corp.
   */
  yaml(): string {
    throw new Error("UNIMPLEMENTED");
  }

  toJSON(): {
    context: any;
    // usage: Usage;
    // approvals: Record<string, ApprovalRecord>;
  } {
    return {
      context: this.context,
      // usage: this.usage,
      // approvals: Object.fromEntries(this.#approvals.entries()),
    };
  }
}

/**
 * Status of a tool call approval.
 */
export type ApprovalStatus = "approved" | "rejected" | "pending";
