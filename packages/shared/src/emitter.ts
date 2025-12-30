/**
 * Type-safe event emitter.
 *
 * A minimal, dependency-free emitter that works in Node, browsers, and React Native.
 * Provides compile-time enforcement of event names and argument types.
 */

/**
 * Map of event names to their argument tuples.
 */
export type EventMap = Record<string, unknown[]>;

/**
 * Interface for a typed event emitter.
 */
export interface TypedEmitter<Events extends EventMap> {
  on<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): this;

  off<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): this;

  once<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): this;

  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean;
}

type Listener = (...args: unknown[]) => void;

/**
 * Minimal typed event emitter implementation.
 */
export class Emitter<Events extends EventMap> implements TypedEmitter<Events> {
  private listeners = new Map<keyof Events, Set<Listener>>();

  on<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener);
    return this;
  }

  off<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): this {
    this.listeners.get(event)?.delete(listener as Listener);
    return this;
  }

  once<K extends keyof Events>(
    event: K,
    listener: (...args: Events[K]) => void,
  ): this {
    const wrapped = ((...args: Events[K]) => {
      this.off(event, wrapped);
      listener(...args);
    }) as (...args: Events[K]) => void;
    return this.on(event, wrapped);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return false;
    for (const listener of set) {
      listener(...args);
    }
    return true;
  }
}
