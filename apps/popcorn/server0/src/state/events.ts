type Listener = (event: { directory: string; payload: unknown }) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emit(directory: string, payload: unknown): void {
  const event = { directory, payload };
  for (const listener of listeners) {
    listener(event);
  }
}
