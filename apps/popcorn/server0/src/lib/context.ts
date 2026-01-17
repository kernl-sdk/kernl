/**
 * Base context type for all tools.
 * Contains the session directory for path scoping.
 */
export interface BaseContext {
  sessionID: string;
  directory: string;
}
