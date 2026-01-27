/**
 * Memory module.
 */

// Default composite implementation
export {
  Memory,
  DefaultMemorySnapshot as DefaultMemoryContext,
} from "./default/memory";
export { MemoryByteEncoder, ObjectTextCodec } from "./default/encoder";
export { buildMemoryIndexSchema } from "./default/schema";
export { MemoryIndexHandle } from "./default/handle";
export type { MemoryIndexHandleConfig } from "./default/handle";

// Core types
export type {
  // Byte types
  TextByte,
  ImageByte,
  AudioByte,
  VideoByte,
  MemoryByte,
  // Core types
  MemoryScope,
  MemoryKind,
  NewMemory,
  MemoryRecord,
  MemoryRecordUpdate,
  MemoryFilter,
  MemoryListOptions,
  MemorySearchQuery,
  MemorySearchResult,
  // kernl-specific types
  IndexableByte,
  MemoryByteCodec,
  AgentMemoryCreate,
  AgentMemoryUpdate,
  MemoryConfig,
  MemoryReindexParams,
  IndexMemoryRecord,
  IndexMemoryRecordPatch,
  WorkingMemorySnapshot,
  ShortTermMemorySnapshot,
} from "./default/types";

// Interfaces
export type {
  MemoryStore,
  MemoryProvider,
  Renderable,
  RenderFormat,
  MemorySnapshot,
} from "./interface";
export { BaseMemorySnapshot } from "./interface";

// Index interfaces (part of default implementation)
export type {
  MemoryIndexBase,
  MemorySearchIndex,
  MemoryGraphIndex,
  MemoryArchiveIndex,
  GraphTraversalQuery,
  GraphTraversalResult,
  ArchiveQuery,
  ArchiveResult,
} from "./default/indexes";
