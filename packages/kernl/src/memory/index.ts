/**
 * Memory module.
 */

export { Memory } from "./memory";
export { MemoryByteEncoder, ObjectTextCodec } from "./encoder";
export { buildMemoryIndexSchema } from "./schema";
export { MemoryIndexHandle } from "./handle";
export type { MemoryIndexHandleConfig } from "./handle";

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
  IndexMemoryRecord,
  IndexMemoryRecordPatch,
  WorkingMemorySnapshot,
  ShortTermMemorySnapshot,
} from "./types";

export type { MemoryStore } from "./store";

export type {
  MemoryIndexBase,
  MemorySearchIndex,
  MemoryGraphIndex,
  MemoryArchiveIndex,
  GraphTraversalQuery,
  GraphTraversalResult,
  ArchiveQuery,
  ArchiveResult,
} from "./indexes";
