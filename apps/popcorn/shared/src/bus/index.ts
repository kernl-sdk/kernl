export { BusEvent } from "./bus-event"

export namespace Bus {
  type Handler = (event: unknown) => void
  const handlers = new Map<string, Set<Handler>>()

  export function on(type: string, handler: Handler): () => void {
    if (!handlers.has(type)) handlers.set(type, new Set())
    handlers.get(type)!.add(handler)
    return () => handlers.get(type)?.delete(handler)
  }

  export function emit(type: string, data: unknown): void {
    handlers.get(type)?.forEach((h) => h(data))
  }
}
