# Threads :: Checkpoints

## Checkpoint strategies

a) _Per-tick (current default, “strong” semantics) - "tick"_.
  - Flush on: `start`, `terminal-tick`, `post-tools`, `stop`.
  - Use when: you care about durable auditability and controlled replay, and tool side-effects are non-trivial.

b) _Final-only (minimal DB writes, “weak” semantics) - "terminal"_.
  - Only flush on: `stop` (and maybe `start` to register the thread row).
  - Implications:
    - You can lose the whole conversation if process dies mid-thread.
    - Tools may be re-run if you later reconstruct from some partial log.
  - Reasonable for:
    - Short-lived, low-value threads (e.g. UI-only chat where you don’t care about replay).
    - Situations where your *real* source of truth is elsewhere (e.g. you just want a final transcript for analytics).

c) _Interval-based (“every N ticks”) - "tick-interval"_.
  - Flush on: `start`, `stop`, and every N ticks.
  - Tuning knob: amortize DB writes while bounding worst-case lost work to `N-1` ticks.
  - Good middle ground for long-running agents.

d) _Event-buffer-based (“max M events”) - "buffer-window"_.
  - Flush when `cpbuf.length >= M`, regardless of tick boundaries.
  - Lets you keep the event log reasonably granular without hammering DB per tick.
