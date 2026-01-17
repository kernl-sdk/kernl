import { Hono } from "hono";
import type { Kernl } from "kernl";

type Variables = { kernl: Kernl };

export const agents = new Hono<{ Variables: Variables }>();

/**
 * List available agents.
 */
agents.get("/", async (cx) => {
  const kernl = cx.get("kernl");

  const agentList = kernl.agents
    .list()
    .filter((a) => a.id !== "titler")
    .map((agent) => {
      const instr = agent.instructions as unknown;
      const description = typeof instr === "string" ? instr.slice(0, 100) : "";
      const model = agent.model
        ? { providerID: agent.model.provider, modelID: agent.model.modelId }
        : undefined;
      return {
        id: agent.id,
        name: agent.name,
        description,
        model,
        mode: "primary" as const,
        hidden: false,
        permission: [],
        options: {},
      };
    });

  return cx.json(agentList);
});

/**
 * Get agent by ID.
 */
agents.get("/:id", async (cx) => {
  const kernl = cx.get("kernl");
  const id = cx.req.param("id");
  const agent = kernl.agents.get(id);

  if (!agent) {
    return cx.json({ error: "agent not found" }, 404);
  }

  const instr = agent.instructions as unknown;
  const description = typeof instr === "string" ? instr.slice(0, 100) : "";
  const model = agent.model
    ? { providerID: agent.model.provider, modelID: agent.model.modelId }
    : undefined;
  return cx.json({
    id: agent.id,
    name: agent.name,
    description,
    model,
    mode: "primary" as const,
    hidden: false,
    permission: [],
    options: {},
  });
});
