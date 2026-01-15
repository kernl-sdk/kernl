import type { LanguageModel } from "@kernl-sdk/protocol";

import type { BaseAgent } from "@/agent/base";
import type { IAgentRegistry, IModelRegistry } from "./types";

/**
 * Registry for language models used by threads.
 *
 * Models are keyed by "{provider}/{modelId}" and must be registered before
 * storage can hydrate threads that reference them.
 */
export class ModelRegistry implements IModelRegistry {
  private readonly models: Map<string, LanguageModel> = new Map();

  /**
   * Register a model instance. Idempotent - only adds if not already present.
   */
  register(model: LanguageModel): void {
    const key = `${model.provider}/${model.modelId}`;
    if (!this.models.has(key)) {
      this.models.set(key, model);
    }
  }

  /**
   * Get a model by its composite key ("{provider}/{modelId}").
   */
  get(key: string): LanguageModel | undefined {
    return this.models.get(key);
  }
}

/**
 * Registry for agents.
 *
 * Agents are keyed by their id and must be registered before threads can
 * reference them.
 */
export class AgentRegistry implements IAgentRegistry {
  private readonly agents: Map<string, BaseAgent<any>> = new Map();

  /**
   * Register an agent instance. Replaces existing agent with same id.
   */
  register(agent: BaseAgent<any>): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Get an agent by its id.
   */
  get(id: string): BaseAgent<any> | undefined {
    return this.agents.get(id);
  }

  /**
   * Unregister an agent by id.
   */
  unregister(id: string): boolean {
    return this.agents.delete(id);
  }

  /**
   * List all registered agents.
   */
  values(): IterableIterator<BaseAgent<any>> {
    return this.agents.values();
  }
}
