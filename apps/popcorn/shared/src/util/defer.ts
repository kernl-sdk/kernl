export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

export function defer<T = void>(): Deferred<T>
export function defer(cleanup: () => void | Promise<void>): AsyncDisposable
export function defer<T = void>(cleanup?: () => void | Promise<void>): Deferred<T> | AsyncDisposable {
  if (cleanup) {
    return {
      [Symbol.asyncDispose]: async () => {
        await cleanup()
      },
    }
  }
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
