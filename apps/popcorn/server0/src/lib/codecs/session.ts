import type { Codec } from "@kernl-sdk/shared/lib";
import type { Thread } from "kernl";

/**
 * OpenCode session format.
 */
export interface Session {
  id: string;
  projectID: string;
  directory: string;
  parentID?: string;
  title: string;
  version: string;
  time: {
    created: number;
    updated: number;
  };
}

/**
 * Codec for converting between kernl MThread and OpenCode Session.
 *
 * - encode: MThread → Session (for API responses)
 * - decode: Session → partial thread params (for creates/updates)
 */
export const SessionCodec: Codec<Thread, Session> = {
  encode(thread: Thread): Session {
    const ctx = thread.context as Record<string, unknown>;

    return {
      id: thread.tid,
      projectID: (ctx.projectID as string) ?? "default",
      directory: (ctx.directory as string) ?? process.cwd(),
      parentID: thread.parentTaskId ?? undefined,
      title: thread.title ?? "",
      version: "1",
      time: {
        created: thread.createdAt.getTime(),
        updated: thread.updatedAt.getTime(),
      },
    };
  },

  decode(session: Session): Thread {
    // Partial decode - returns enough to match the MThread shape
    // Used when we need to go from OpenCode → kernl params
    return {
      tid: session.id,
      namespace: "kernl",
      title: session.title || null,
      agentId: "", // filled by caller
      model: { provider: "", modelId: "" }, // filled by caller
      context: {
        projectID: session.projectID,
        directory: session.directory,
      },
      parentTaskId: session.parentID ?? null,
      state: "stopped",
      createdAt: new Date(session.time.created),
      updatedAt: new Date(session.time.updated),
    };
  },
};
