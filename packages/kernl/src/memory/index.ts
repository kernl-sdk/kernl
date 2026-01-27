/**
 * Memory module.
 */

// Default composite implementation
export { Memory } from "./default/memory";
export { MemoryByteEncoder, ObjectTextCodec } from "./default/encoder";
export { buildMemoryIndexSchema } from "./default/schema";
export { MemoryIndexHandle } from "./default/handle";
export type { MemoryIndexHandleConfig } from "./default/handle";

// Shared types
export type {
  // Byte types
  TextByte,
  ImageByte,
  AudioByte,
  VideoByte,
  MemoryByte,
  IndexableByte,
  MemoryByteCodec,
  // Core types
  MemoryScope,
  MemoryKind,
  NewMemory,
  AgentMemoryCreate,
  AgentMemoryUpdate,
  MemoryConfig,
  MemoryReindexParams,
  MemoryRecord,
  MemoryRecordUpdate,
  MemoryFilter,
  MemoryListOptions,
  MemorySearchQuery,
  MemorySearchResult,
  IndexMemoryRecord,
  IndexMemoryRecordPatch,
  WorkingMemorySnapshot,
  ShortTermMemorySnapshot,
} from "./types";

// Interface
export type { MemoryStore } from "./store";

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
