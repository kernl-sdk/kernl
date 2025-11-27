import type {
  ThreadStore,
  ThreadListOptions,
  ThreadHistoryOptions,
} from "@/storage";
import type { ThreadEvent } from "@/thread/types";
import { isPublicEvent } from "@/thread/utils";
import { Context } from "@/context";
import { randomID } from "@kernl-sdk/shared/lib";
import { RUNNING } from "@kernl-sdk/protocol";

import type { MThread, MThreadEvent } from "@/api/models";
import { CursorPage, type CursorPageResponse } from "@kernl-sdk/shared";

import { RThreadEvents } from "./events";
import type {
  RThreadCreateParams,
  RThreadGetOptions,
  RThreadHistoryParams,
  RThreadsListParams,
  RThreadUpdateParams,
} from "./types";
import { MThreadCodec, ThreadsFilterCodec, ThreadsOrderCodec } from "./utils";

/**
 * Threads resource.
 *
 * Provides a structured API for listing, inspecting, and deleting threads.
 */
export class RThreads {
  readonly events: RThreadEvents;

  constructor(private readonly store: ThreadStore) {
    this.events = new RThreadEvents(store);
  }

  /**
   * Get a single thread by ID.
   *
   * When `options.history` is set, the returned thread will include a
   * `history` field containing public events for that thread.
   */
  async get(tid: string, options?: RThreadGetOptions): Promise<MThread | null> {
    const thread = await this.store.get(tid);
    if (!thread) return null;

    const model = MThreadCodec.encode(thread);

    if (options?.history) {
      const historyParams =
        options.history === true ? undefined : options.history;
      const history = await this.history(tid, historyParams);
      model.history = history; // attach history lazily so callers can opt-in.
    }

    return model;
  }

  /**
   * Create a new thread.
   */
  async create(params: RThreadCreateParams): Promise<MThread> {
    const now = new Date();
    const tid = params.tid ?? `tid_${randomID()}`;
    const namespace = params.namespace ?? "kernl";

    // merge caller-supplied metadata with optional title
    const baseMetadata: Record<string, unknown> = {
      ...(params.metadata ?? {}),
    };

    if (params.title !== undefined) {
      const trimmed = params.title.trim();
      if (trimmed) {
        baseMetadata.title = trimmed;
      } else {
        delete baseMetadata.title;
      }
    }

    const metadata: Record<string, unknown> | null =
      Object.keys(baseMetadata).length > 0 ? baseMetadata : null;

    const thread = await this.store.insert({
      id: tid,
      namespace,
      agentId: params.agentId,
      model: `${params.model.provider}/${params.model.modelId}`,
      context: params.context,
      parentTaskId: params.parentTaskId ?? null,
      metadata,
      createdAt: now,
      updatedAt: now,
    });

    return MThreadCodec.encode(thread);
  }

  /**
   * List threads with optional filtering and cursor-based pagination.
   *
   * @example
   * ```ts
   * const threads = await kernl.threads.list({ limit: 20 });
   *
   * for await (const thread of threads) {
   *   console.log(thread.tid);
   * }
   * ```
   */
  async list(
    params: RThreadsListParams = {},
  ): Promise<CursorPage<MThread, RThreadsListParams>> {
    const loader = async (
      p: RThreadsListParams,
    ): Promise<CursorPageResponse<MThread>> => {
      const offset = p.cursor ? Number(p.cursor) : 0;
      const limit = p.limit;
      const effectiveLimit = limit !== undefined ? limit + 1 : undefined;

      const filter = ThreadsFilterCodec.encode(p);
      const order = ThreadsOrderCodec.encode(p.order);

      const options: ThreadListOptions = {
        filter,
        order,
        limit: effectiveLimit,
        offset,
      };

      const threads = await this.store.list(options);

      if (limit === undefined) {
        // No limit requested → treat as a single, non-paginated page.
        const data = threads.map((t) => MThreadCodec.encode(t));
        return {
          data,
          next: null,
          last: true,
        };
      }

      const hasExtra = threads.length > limit;
      const pageThreads = hasExtra ? threads.slice(0, limit) : threads;
      const data = pageThreads.map((t) => MThreadCodec.encode(t));

      const nextOffset = offset + data.length;
      const last = !hasExtra || data.length === 0;
      const next = last ? null : String(nextOffset);

      return { data, next, last };
    };

    const response = await loader(params);

    return new CursorPage<MThread, RThreadsListParams>({
      params,
      response,
      loader,
    });
  }

  /**
   * Delete a thread and all associated events.
   */
  async delete(tid: string): Promise<void> {
    await this.store.delete(tid);
  }

  /**
   * Convenience wrapper around `events.list()` for fetching a thread's history.
   *
   * History is returned in descending sequence order by default (latest first).
   */
  async history(
    tid: string,
    params?: RThreadHistoryParams,
  ): Promise<MThreadEvent[]> {
    const opts: ThreadHistoryOptions = {
      after: params?.after,
      limit: params?.limit,
      order: params?.order ?? "desc",
      kinds: params?.kinds,
    };

    const events: ThreadEvent[] = await this.store.history(tid, opts);
    return events.filter(isPublicEvent).map((e) => e as MThreadEvent);
  }

  /**
   * Update mutable thread fields.
   *
   * Currently only supports updating the human-readable `title`, which is
   * stored in thread metadata as `metadata.title`.
   */
  async update(
    tid: string,
    patch: RThreadUpdateParams,
  ): Promise<MThread | null> {
    const current = await this.store.get(tid);
    if (!current) return null;

    // Prevent context mutation while the thread is running.
    if (patch.context !== undefined && current.state === RUNNING) {
      throw new Error("Cannot update thread context while thread is running");
    }

    // build context patch
    let contextPatch: Context<unknown> | undefined;
    if ("context" in patch) {
      const nextContextValue =
        patch.context === null
          ? {}
          : (patch.context ?? current.context.context);
      contextPatch = new Context(
        current.namespace,
        nextContextValue as unknown,
      );
    }

    // build metadata base according to caller intent
    let metadata: Record<string, unknown>;
    if ("metadata" in patch) {
      if (patch.metadata === null) {
        metadata = {};
      } else if (patch.metadata === undefined) {
        metadata = current.metadata ? { ...current.metadata } : {};
      } else {
        metadata = { ...patch.metadata };
      }
    } else {
      metadata = current.metadata ? { ...current.metadata } : {};
    }

    // apply title overlay on top of metadata
    if ("title" in patch) {
      const value = patch.title;
      const trimmed =
        typeof value === "string" ? value.trim() : (value ?? undefined);

      if (!trimmed) {
        delete metadata.title; // clear title
      } else {
        metadata.title = trimmed;
      }
    }

    const nextMetadata = Object.keys(metadata).length > 0 ? metadata : null;

    const updated = await this.store.update(tid, {
      ...(contextPatch ? { context: contextPatch } : {}),
      metadata: nextMetadata,
    });
    return MThreadCodec.encode(updated);
  }
}
