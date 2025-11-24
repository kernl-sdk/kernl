import { UnimplementedError, type Codec } from "@kernl-sdk/shared/lib";

import type { Thread } from "@/thread";
import type { ThreadFilter, ThreadListOptions } from "@/storage";
import type { MThread } from "@/api/models";
import type { RThreadsListParams } from "./types";

/**
 * Converts an internal `Thread` runtime instance into an `MThread` model.
 */
export const MThreadCodec: Codec<Thread, MThread> = {
  encode(thread: Thread): MThread {
    const rawTitle = thread.metadata?.title;
    const title = typeof rawTitle === "string" ? rawTitle : null;

    return {
      tid: thread.tid,
      namespace: thread.namespace,
      agentId: thread.agent.id,
      title,
      model: {
        provider: thread.model.provider,
        modelId: thread.model.modelId,
      },
      context: thread.context.context as Record<string, unknown>,
      parentTaskId: thread.parent?.id ?? null,
      state: thread.state,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  },

  decode(_model: MThread): Thread {
    throw new UnimplementedError();
  },
};

/**
 * Converts `RThreadsListParams` into a `ThreadFilter` for the store.
 */
export const ThreadsFilterCodec: Codec<
  RThreadsListParams,
  ThreadFilter | undefined
> = {
  encode(params: RThreadsListParams): ThreadFilter | undefined {
    const filter: ThreadFilter = {};

    if (params.namespace !== undefined) {
      filter.namespace = params.namespace;
    }
    if (params.state !== undefined) {
      filter.state = params.state;
    }
    if (params.agentId !== undefined) {
      filter.agentId = params.agentId;
    }
    if (params.parentTaskId !== undefined) {
      filter.parentTaskId = params.parentTaskId;
    }
    if (params.after !== undefined) {
      filter.createdAfter = params.after;
    }
    if (params.before !== undefined) {
      filter.createdBefore = params.before;
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  },

  decode(_filter: ThreadFilter | undefined): RThreadsListParams {
    throw new UnimplementedError();
  },
};

/**
 * Converts list `order` params into `ThreadListOptions["order"]` for the store.
 */
export const ThreadsOrderCodec: Codec<
  RThreadsListParams["order"],
  ThreadListOptions["order"] | undefined
> = {
  encode(
    order: RThreadsListParams["order"],
  ): ThreadListOptions["order"] | undefined {
    if (!order) return undefined;

    const result: NonNullable<ThreadListOptions["order"]> = {};

    if (order.createdAt !== undefined) {
      result.createdAt = order.createdAt;
    }
    if (order.updatedAt !== undefined) {
      result.updatedAt = order.updatedAt;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  },

  decode(
    _order: ThreadListOptions["order"] | undefined,
  ): RThreadsListParams["order"] {
    throw new UnimplementedError();
  },
};
