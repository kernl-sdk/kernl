import Attio from "attio-crm";

/**
 * Attio CRM client singleton.
 * Requires ATTIO_API_KEY environment variable.
 */
export const attio = new Attio();

/**
 * Context for Attio toolkit operations.
 */
export interface AttioContext {
  workspaceId?: string;
}
