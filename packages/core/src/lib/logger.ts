import pino from "pino";

import { env } from "./env";

/**
 * By default we don't log LLM inputs/outputs, to prevent exposing sensitive data.
 * Set KERNL_LOG_MODEL_DATA=true to enable.
 */
const dontLogModelData = !env.KERNL_LOG_MODEL_DATA;

/**
 * By default we don't log tool inputs/outputs, to prevent exposing sensitive data.
 * Set KERNL_LOG_TOOL_DATA=true to enable.
 */
const dontLogToolData = !env.KERNL_LOG_TOOL_DATA;

/**
 * Base pino logger instance
 */
const base = pino({
  level: env.LOG_LEVEL,
});

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
 * @returns A logger object with all pino log levels and sensitive data flags.
 */
export function getLogger(namespace: string = "kernl"): Logger {
  const child = base.child({ namespace });

  return {
    namespace,
    trace: child.trace.bind(child),
    debug: child.debug.bind(child),
    info: child.info.bind(child),
    warn: child.warn.bind(child),
    error: child.error.bind(child),
    fatal: child.fatal.bind(child),
    dontLogModelData,
    dontLogToolData,
  };
}

/**
 * Default logger instance for the core library.
 */
export const logger = getLogger("kernl");

export default logger;
