/**
 * Simple RPC utility for Bun Worker communication.
 *
 * Protocol:
 * - rpc.request: { type, method, input, id } - Call from client to worker
 * - rpc.result: { type, result, id } - Response from worker to client
 * - rpc.event: { type, event, data } - Event from worker to client
 */
export namespace Rpc {
  type Definition = {
    [method: string]: (input: any) => any
  }

  /**
   * Set up RPC listener in the worker thread.
   * Call this with your RPC method definitions.
   */
  export function listen(rpc: Definition) {
    onmessage = async (evt) => {
      const parsed = JSON.parse(evt.data)
      if (parsed.type === "rpc.request") {
        const result = await rpc[parsed.method](parsed.input)
        postMessage(JSON.stringify({ type: "rpc.result", result, id: parsed.id }))
      }
    }
  }

  /**
   * Emit an event from the worker to the main thread.
   */
  export function emit(event: string, data: unknown) {
    postMessage(JSON.stringify({ type: "rpc.event", event, data }))
  }

  /**
   * Create an RPC client in the main thread to communicate with a worker.
   */
  export function client<T extends Definition>(target: {
    postMessage: (data: string) => void | null
    onmessage: ((this: Worker, ev: MessageEvent<any>) => any) | null
  }) {
    const pending = new Map<number, (result: any) => void>()
    const listeners = new Map<string, Set<(data: any) => void>>()
    let id = 0

    target.onmessage = async (evt) => {
      const parsed = JSON.parse(evt.data)
      if (parsed.type === "rpc.result") {
        const resolve = pending.get(parsed.id)
        if (resolve) {
          resolve(parsed.result)
          pending.delete(parsed.id)
        }
      }
      if (parsed.type === "rpc.event") {
        const handlers = listeners.get(parsed.event)
        if (handlers) {
          for (const handler of handlers) {
            handler(parsed.data)
          }
        }
      }
    }

    return {
      call<Method extends keyof T>(method: Method, input: Parameters<T[Method]>[0]): Promise<ReturnType<T[Method]>> {
        const requestId = id++
        return new Promise((resolve) => {
          pending.set(requestId, resolve)
          target.postMessage(JSON.stringify({ type: "rpc.request", method, input, id: requestId }))
        })
      },
      on<Data>(event: string, handler: (data: Data) => void) {
        let handlers = listeners.get(event)
        if (!handlers) {
          handlers = new Set()
          listeners.set(event, handlers)
        }
        handlers.add(handler)
        return () => {
          handlers!.delete(handler)
        }
      },
    }
  }
}
