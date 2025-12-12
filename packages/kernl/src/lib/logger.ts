import { env } from "./env";

/**
 * A logger instance with namespace support and sensitive data flags.
 */
export type Logger = {
  /**
   * The namespace used for the logger.
   */
  namespace: string;

  trace: (message: any, ...args: any[]) => void;
  debug: (message: any, ...args: any[]) => void;
  info: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
  fatal: (message: any, ...args: any[]) => void;

  /**
   * Whether to log model data.
   */
  dontLogModelData: boolean;

  /**
   * Whether to log tool data.
   */
  dontLogToolData: boolean;
};

/**
 * Get a logger for a given namespace.
 *
 * @param namespace - the namespace to use for the logger (e.g., 'kernl:core', 'kernl:agent').
 * @returns A logger object with console-based logging and sensitive data flags.
 */
export function getLogger(namespace: string = "kernl"): Logger {
  const prefix = `[${namespace}]`;

  return {
    namespace,
    trace: (msg, ...args) => console.debug(prefix, msg, ...args),
    debug: (msg, ...args) => console.debug(prefix, msg, ...args),
    info: (msg, ...args) => console.info(prefix, msg, ...args),
    warn: (msg, ...args) => console.warn(prefix, msg, ...args),
    error: (msg, ...args) => console.error(prefix, msg, ...args),
    fatal: (msg, ...args) => console.error(prefix, "[FATAL]", msg, ...args),
    dontLogModelData: !env.KERNL_LOG_MODEL_DATA,
    dontLogToolData: !env.KERNL_LOG_TOOL_DATA,
  };
}

/**
 * Default logger instance for the core library.
 */
export const logger = getLogger("kernl");

export default logger;
