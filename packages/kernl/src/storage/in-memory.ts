/**
 * In-memory storage implementation for Kernl.
 *
 * Pure domain-level - no codecs, schemas, or DB records.
 *
 * Defined here so that it can be used as default and for testing.
 */

import { Agent } from "@/agent";
import { Thread } from "@/thread";
import { Context } from "@/context";
import { STOPPED } from "@kernl-sdk/protocol";
import { UnimplementedError } from "@kernl-sdk/shared/lib";

import type {
  KernlStorage,
  Transaction,
  ThreadStore,
  NewThread,
  ThreadUpdate,
  ThreadInclude,
  ThreadListOptions,
  ThreadHistoryOptions,
  ThreadFilter,
  SortOrder,
} from "@/storage";
import type { ThreadEvent, ThreadState } from "@/thread/types";
import type { IAgentRegistry, IModelRegistry } from "@/kernl/types";
import type {
  MemoryStore,
  MemoryRecord,
  NewMemory,
  MemoryRecordUpdate,
  MemoryListOptions,
  MemoryFilter,
} from "@/memory";

/**
 * In-memory storage implementation.
 */
export class InMemoryStorage implements KernlStorage {
  threads: InMemoryThreadStore;
  memories: InMemoryMemoryStore;

  constructor() {
    this.threads = new InMemoryThreadStore();
    this.memories = new InMemoryMemoryStore();
  }

  bind(registries: { agents: IAgentRegistry; models: IModelRegistry }): void {
    this.threads.bind(registries);
  }

  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    throw new UnimplementedError(
      "Transactions not supported in in-memory storage",
    );
  }

  async init(): Promise<void> {
    // no-op
  }

  async close(): Promise<void> {
    // no-op
  }

  async migrate(): Promise<void> {
    // no-op
  }
}

/**
 * In-memory thread data (minimal - just what can't be reconstructed from agent/model registries)
 */
interface ThreadData {
  tid: string;
  namespace: string;
  agentId: string;
  model: string; // "provider/modelId"
  context: unknown;
  tick: number;
  state: ThreadState;
  parentTaskId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory thread store implementation.
 */
export class InMemoryThreadStore implements ThreadStore {
  private threads = new Map<string, ThreadData>();
  private events = new Map<string, ThreadEvent[]>(); // tid -> events
  private registries: { agents: IAgentRegistry; models: IModelRegistry } | null =
    null;

  bind(registries: { agents: IAgentRegistry; models: IModelRegistry }): void {
    this.registries = registries;
  }

  async get(tid: string, include?: ThreadInclude): Promise<Thread | null> {
    const data = this.threads.get(tid);
    if (!data) return null;

    const history = include?.history
      ? this.filterHistory(tid, include.history)
      : [];

    try {
      return this.hydrate(data, history);
    } catch (error) {
      return null;
    }
  }

  async list(options?: ThreadListOptions): Promise<Thread[]> {
    let threads = Array.from(this.threads.values());

    // Apply filters
    if (options?.filter) {
      threads = this.applyFilters(threads, options.filter);
    }

    // Apply sorting
    threads = this.applySorting(threads, options?.order);

    // Apply pagination
    if (options?.offset) threads = threads.slice(options.offset);
    if (options?.limit) threads = threads.slice(0, options.limit);

    return threads
      .map((data) => {
        try {
          return this.hydrate(data, []);
        } catch (error) {
          // Skip threads with non-existent agent/model (graceful degradation)
          return null;
        }
      })
      .filter((thread): thread is Thread => thread !== null);
  }

  async insert(thread: NewThread): Promise<Thread> {
    const now = new Date();
    const data: ThreadData = {
      tid: thread.id,
      namespace: thread.namespace,
      agentId: thread.agentId,
      model: thread.model,
      context: thread.context ?? {},
      tick: thread.tick ?? 0,
      state: thread.state ?? STOPPED,
      parentTaskId: thread.parentTaskId ?? null,
      metadata: thread.metadata ?? null,
      createdAt: thread.createdAt ?? now,
      updatedAt: thread.updatedAt ?? now,
    };

    this.threads.set(thread.id, data);
    this.events.set(thread.id, []);

    return this.hydrate(data, []);
  }

  async update(tid: string, patch: ThreadUpdate): Promise<Thread> {
    const data = this.threads.get(tid);
    if (!data) throw new Error(`Thread ${tid} not found`);

    if (patch.tick !== undefined) data.tick = patch.tick;
    if (patch.state !== undefined) data.state = patch.state;
    if (patch.context !== undefined) {
      // Store raw context value, not the Context wrapper.
      data.context = patch.context.context;
    }
    if (patch.metadata !== undefined) data.metadata = patch.metadata;
    data.updatedAt = new Date();

    return this.hydrate(data, []);
  }

  async delete(tid: string): Promise<void> {
    this.threads.delete(tid);
    this.events.delete(tid);
  }

  async history(
    tid: string,
    opts?: ThreadHistoryOptions,
  ): Promise<ThreadEvent[]> {
    return this.filterHistory(tid, opts);
  }

  async append(events: ThreadEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Group by tid
    const byThread = new Map<string, ThreadEvent[]>();
    for (const event of events) {
      if (!byThread.has(event.tid)) byThread.set(event.tid, []);
      byThread.get(event.tid)!.push(event);
    }

    // Append to each thread's event log (idempotent on event.id)
    for (const [tid, newEvents] of Array.from(byThread.entries())) {
      let existing = this.events.get(tid);
      if (!existing) {
        existing = [];
        this.events.set(tid, existing);
      }

      const existingIds = new Set(existing.map((e) => e.id));

      for (const event of newEvents) {
        if (!existingIds.has(event.id)) {
          existing.push(event);
        }
      }

      // Keep sorted by seq
      existing.sort((a, b) => a.seq - b.seq);
    }
  }

  /**
   * Hydrate a Thread instance from in-memory data.
   */
  private hydrate(data: ThreadData, history: ThreadEvent[]): Thread {
    if (!this.registries) {
      throw new Error(
        "Registries must be bound before hydrating threads (call bind() first)",
      );
    }

    const agent = this.registries.agents.get(data.agentId);
    const model = this.registries.models.get(data.model);

    if (!agent || !model) {
      throw new Error(
        `Thread ${data.tid} references non-existent agent/model (agent: ${data.agentId}, model: ${data.model})`,
      );
    }

    // safety: threads only exist for llm agents
    if (agent.kind !== "llm") {
      throw new Error(
        `Thread ${data.tid} references non-llm agent ${data.agentId} (kind: ${agent.kind})`,
      );
    }

    return new Thread({
      agent: agent as Agent,
      tid: data.tid,
      context: new Context(data.namespace, data.context),
      model,
      history,
      tick: data.tick,
      state: data.state,
      namespace: data.namespace,
      task: null, // TODO: load from TaskStore when it exists
      metadata: data.metadata,
      storage: this, // pass storage reference so resumed thread can persist
      persisted: true,
    });
  }

  /**
   * Filter and sort event history based on options.
   */
  private filterHistory(
    tid: string,
    opts?: boolean | ThreadHistoryOptions,
  ): ThreadEvent[] {
    let events = this.events.get(tid) ?? [];

    // Handle boolean flag: true = all events, false = no events
    if (typeof opts === "boolean") {
      return opts ? [...events] : [];
    }

    // No options provided = return all events
    if (opts === undefined) {
      return [...events];
    }

    // Apply filters
    if (opts.after !== undefined) {
      events = events.filter((e) => e.seq > opts.after!);
    }
    if (opts.kinds && opts.kinds.length > 0) {
      const kinds = new Set(opts.kinds);
      events = events.filter((e) => kinds.has(e.kind));
    }

    // Clone before sorting/slicing to avoid mutating the original
    events = [...events];

    // Apply ordering
    if (opts.order === "desc") {
      events.reverse();
    }

    // Apply limit
    if (opts.limit !== undefined) {
      events = events.slice(0, opts.limit);
    }

    return events;
  }

  /**
   * Apply filters to thread list.
   */
  private applyFilters(
    threads: ThreadData[],
    filter: ThreadFilter,
  ): ThreadData[] {
    return threads.filter((thread) => {
      // Filter by namespace
      if (filter.namespace !== undefined) {
        if (thread.namespace !== filter.namespace) return false;
      }

      // Filter by state
      if (filter.state !== undefined) {
        if (Array.isArray(filter.state)) {
          if (!filter.state.includes(thread.state)) return false;
        } else {
          if (thread.state !== filter.state) return false;
        }
      }

      // Filter by agentId
      if (filter.agentId !== undefined) {
        if (thread.agentId !== filter.agentId) return false;
      }

      // Filter by parentTaskId
      if (filter.parentTaskId !== undefined) {
        if (thread.parentTaskId !== filter.parentTaskId) return false;
      }

      // Filter by createdAfter
      if (filter.createdAfter !== undefined) {
        if (thread.createdAt <= filter.createdAfter) return false;
      }

      // Filter by createdBefore
      if (filter.createdBefore !== undefined) {
        if (thread.createdAt >= filter.createdBefore) return false;
      }

      return true;
    });
  }

  /**
   * Apply sorting to thread list.
   */
  private applySorting(
    threads: ThreadData[],
    order?: { createdAt?: SortOrder; updatedAt?: SortOrder },
  ): ThreadData[] {
    if (!order) {
      // Default: most recent first
      return threads.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    }

    return threads.sort((a, b) => {
      // Sort by createdAt first if specified
      if (order.createdAt) {
        const diff = a.createdAt.getTime() - b.createdAt.getTime();
        if (diff !== 0) {
          return order.createdAt === "asc" ? diff : -diff;
        }
      }

      // Then by updatedAt if specified
      if (order.updatedAt) {
        const diff = a.updatedAt.getTime() - b.updatedAt.getTime();
        return order.updatedAt === "asc" ? diff : -diff;
      }

      return 0;
    });
  }
}

/**
 * In-memory memory store implementation.
 */
export class InMemoryMemoryStore implements MemoryStore {
  private memories = new Map<string, MemoryRecord>();

  async get(id: string): Promise<MemoryRecord | null> {
    return this.memories.get(id) ?? null;
  }

  async list(options?: MemoryListOptions): Promise<MemoryRecord[]> {
    let records = Array.from(this.memories.values());

    // Apply filters
    if (options?.filter) {
      records = this.applyFilters(records, options.filter);
    }

    // Apply sorting
    records = this.applySorting(records, options?.order);

    // Apply pagination
    if (options?.offset) records = records.slice(options.offset);
    if (options?.limit) records = records.slice(0, options.limit);

    return records;
  }

  async create(memory: NewMemory): Promise<MemoryRecord> {
    const now = Date.now();
    const record: MemoryRecord = {
      id: memory.id,
      scope: memory.scope,
      kind: memory.kind,
      collection: memory.collection ?? null,
      content: memory.content,
      wmem: memory.wmem ?? false,
      smem: memory.smem ?? { expiresAt: null },
      timestamp: memory.timestamp ?? now,
      createdAt: now,
      updatedAt: now,
      metadata: memory.metadata ?? null,
    };

    this.memories.set(memory.id, record);
    return record;
  }

  async update(id: string, patch: MemoryRecordUpdate): Promise<MemoryRecord> {
    const record = this.memories.get(id);
    if (!record) throw new Error(`Memory ${id} not found`);

    const updated: MemoryRecord = {
      ...record,
      ...(patch.scope && { scope: patch.scope }),
      ...(patch.collection && { collection: patch.collection }),
      ...(patch.content && { content: patch.content }),
      ...(patch.wmem !== undefined && { wmem: patch.wmem }),
      ...(patch.smem && { smem: patch.smem }),
      ...(patch.timestamp && { timestamp: patch.timestamp }),
      ...(patch.metadata !== undefined && { metadata: patch.metadata }),
      updatedAt: patch.updatedAt ?? Date.now(),
    };

    this.memories.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.memories.delete(id);
  }

  async mdelete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.memories.delete(id);
    }
  }

  /**
   * Apply filters to memory list.
   */
  private applyFilters(
    records: MemoryRecord[],
    filter: MemoryFilter,
  ): MemoryRecord[] {
    return records.filter((record) => {
      // Filter by scope
      if (filter.scope) {
        if (
          filter.scope.namespace !== undefined &&
          record.scope.namespace !== filter.scope.namespace
        ) {
          return false;
        }
        if (
          filter.scope.entityId !== undefined &&
          record.scope.entityId !== filter.scope.entityId
        ) {
          return false;
        }
        if (
          filter.scope.agentId !== undefined &&
          record.scope.agentId !== filter.scope.agentId
        ) {
          return false;
        }
      }

      // Filter by collections
      if (
        filter.collections &&
        (record.collection === null ||
          !filter.collections.includes(record.collection))
      ) {
        return false;
      }

      // Filter by wmem
      if (filter.wmem !== undefined && record.wmem !== filter.wmem) {
        return false;
      }

      // Filter by smem
      if (filter.smem !== undefined) {
        const hasSmem = record.smem.expiresAt !== null;
        if (filter.smem !== hasSmem) return false;
      }

      // Filter by timestamp range
      if (filter.after !== undefined && record.timestamp <= filter.after) {
        return false;
      }
      if (filter.before !== undefined && record.timestamp >= filter.before) {
        return false;
      }

      // Filter by metadata (simple equality check for now)
      if (filter.metadata) {
        const recordMeta = record.metadata ?? {};
        for (const [key, value] of Object.entries(filter.metadata)) {
          if (recordMeta[key] !== value) return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting to memory list.
   */
  private applySorting(
    records: MemoryRecord[],
    order?: "asc" | "desc",
  ): MemoryRecord[] {
    return records.sort((a, b) => {
      const diff = a.timestamp - b.timestamp;
      return order === "desc" ? -diff : diff;
    });
  }
}
