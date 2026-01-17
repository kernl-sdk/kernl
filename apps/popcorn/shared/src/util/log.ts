export namespace Log {
  export const Default = {
    debug: (...args: unknown[]) => debug(...args),
    info: (...args: unknown[]) => info(...args),
    warn: (...args: unknown[]) => warn(...args),
    error: (...args: unknown[]) => error(...args),
  }

  export function create(opts: { service: string }) {
    const prefix = `[${opts.service}]`
    return {
      debug: (...args: unknown[]) => debug(prefix, ...args),
      info: (...args: unknown[]) => info(prefix, ...args),
      warn: (...args: unknown[]) => warn(prefix, ...args),
      error: (...args: unknown[]) => error(prefix, ...args),
    }
  }

  export function debug(...args: unknown[]): void {
    if (process.env.DEBUG) {
      console.debug("[debug]", ...args)
    }
  }

  export function info(...args: unknown[]): void {
    console.info("[info]", ...args)
  }

  export function warn(...args: unknown[]): void {
    console.warn("[warn]", ...args)
  }

  export function error(...args: unknown[]): void {
    console.error("[error]", ...args)
  }
}
