---
layout: docs
---

# internal

## Classes

| Class | Description |
| ------ | ------ |
| [Thread](classes/Thread.md) | A thread drives the execution loop for an agent. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [IThread](interfaces/IThread.md) | Thread domain interface. |
| [ThreadEventBase](interfaces/ThreadEventBase.md) | Base fields for all thread events - added to every LanguageModelItem when stored in thread. |
| [ThreadSystemEvent](interfaces/ThreadSystemEvent.md) | System event - runtime state changes (not sent to model). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ThreadEvent](type-aliases/ThreadEvent.md) | Thread events are append-only log entries ordered by seq. |
| [ThreadEventInner](type-aliases/ThreadEventInner.md) | The inner data of a ThreadEvent without the headers |

## References

### PublicThreadEvent

Re-exports [PublicThreadEvent](../type-aliases/PublicThreadEvent.md)

***

### THREAD\_STATES

Re-exports [THREAD_STATES](../variables/THREAD_STATES.md)

***

### ThreadState

Re-exports [ThreadState](../type-aliases/ThreadState.md)
