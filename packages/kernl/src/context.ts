/**
 * Status of a tool call approval.
 */
export type ApprovalStatus = "approved" | "rejected" | "pending";

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

  constructor(
    namespace: string = "kernl",
    context: TContext = {} as TContext,
  ) {
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

  // /**
  //  * Rebuild the approvals map from a serialized state.
  //  * @internal
  //  *
  //  * @param approvals - The approvals map to rebuild.
  //  */
  // _rebuildApprovals(approvals: Record<string, ApprovalRecord>) {
  //   this.#approvals = new Map(Object.entries(approvals));
  // }

  // /**
  //  * Check if a tool call has been approved.
  //  *
  //  * @param approval - Details about the tool call being evaluated.
  //  * @returns `true` if the tool call has been approved, `false` if blocked and `undefined` if not yet approved or rejected.
  //  */
  // isToolApproved(approval: { toolName: string; callId: string }) {
  //   const { toolName, callId } = approval;
  //   const approvalEntry = this.#approvals.get(toolName);
  //   if (approvalEntry?.approved === true && approvalEntry.rejected === true) {
  //     logger.warn(
  //       "Tool is permanently approved and rejected at the same time. Approval takes precedence",
  //     );
  //     return true;
  //   }

  //   if (approvalEntry?.approved === true) {
  //     return true;
  //   }

  //   if (approvalEntry?.rejected === true) {
  //     return false;
  //   }

  //   const individualCallApproval = Array.isArray(approvalEntry?.approved)
  //     ? approvalEntry.approved.includes(callId)
  //     : false;
  //   const individualCallRejection = Array.isArray(approvalEntry?.rejected)
  //     ? approvalEntry.rejected.includes(callId)
  //     : false;

  //   if (individualCallApproval && individualCallRejection) {
  //     logger.warn(
  //       `Tool call ${callId} is both approved and rejected at the same time. Approval takes precedence`,
  //     );
  //     return true;
  //   }

  //   if (individualCallApproval) {
  //     return true;
  //   }

  //   if (individualCallRejection) {
  //     return false;
  //   }

  //   return undefined;
  // }

  // /**
  //  * Approve a tool call.
  //  *
  //  * @param approvalItem - The tool approval item to approve.
  //  * @param options - Additional approval behavior options.
  //  */
  // approveTool(
  //   approvalItem: RunToolApprovalItem,
  //   { alwaysApprove = false }: { alwaysApprove?: boolean } = {},
  // ) {
  //   const toolName = approvalItem.rawItem.name;
  //   if (alwaysApprove) {
  //     this.#approvals.set(toolName, {
  //       approved: true,
  //       rejected: [],
  //     });
  //     return;
  //   }

  //   const approvalEntry = this.#approvals.get(toolName) ?? {
  //     approved: [],
  //     rejected: [],
  //   };
  //   if (Array.isArray(approvalEntry.approved)) {
  //     // function tool has call_id, hosted tool call has id
  //     const callId =
  //       "callId" in approvalItem.rawItem
  //         ? approvalItem.rawItem.callId // function tools
  //         : approvalItem.rawItem.id!; // hosted tools
  //     approvalEntry.approved.push(callId);
  //   }
  //   this.#approvals.set(toolName, approvalEntry);
  // }

  // /**
  //  * Reject a tool call.
  //  *
  //  * @param approvalItem - The tool approval item to reject.
  //  */
  // rejectTool(
  //   approvalItem: RunToolApprovalItem,
  //   { alwaysReject = false }: { alwaysReject?: boolean } = {},
  // ) {
  //   const toolName = approvalItem.rawItem.name;
  //   if (alwaysReject) {
  //     this.#approvals.set(toolName, {
  //       approved: false,
  //       rejected: true,
  //     });
  //     return;
  //   }

  //   const approvalEntry = this.#approvals.get(toolName) ?? {
  //     approved: [] as string[],
  //     rejected: [] as string[],
  //   };

  //   if (Array.isArray(approvalEntry.rejected)) {
  //     // function tool has call_id, hosted tool call has id
  //     const callId =
  //       "callId" in approvalItem.rawItem
  //         ? approvalItem.rawItem.callId // function tools
  //         : approvalItem.rawItem.id!; // hosted tools
  //     approvalEntry.rejected.push(callId);
  //   }
  //   this.#approvals.set(toolName, approvalEntry);
  // }
}

/**
 * Context that is being passed around as part of the session is unknown
 */
export type UnknownContext = unknown;
