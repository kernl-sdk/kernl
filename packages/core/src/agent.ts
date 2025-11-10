import type { Context, UnknownContext } from "@/context";
import { LanguageModel, LanguageModelSettings } from "@/model";
import { InputGuardrail, OutputGuardrail } from "@/guardrail";
import { AgentHooks } from "@/lifecycle";
import { Toolkit } from "@/tool/toolkit";
import { DEFAULT_LANGUAGE_MODEL } from "@/providers/default";

import { MisconfiguredError } from "@/lib/error";

/* types */
import type { AgentConfig, AgentResponseType } from "@/types/agent";
import { TextResponse } from "@/types/thread";

export class Agent<
    TContext = UnknownContext,
    TResponse extends AgentResponseType = TextResponse,
  >
  extends AgentHooks<TContext, TResponse>
  implements AgentConfig<TContext, TResponse>
{
  readonly version: "1.0";
  id: string;
  name: string;
  instructions: (context: Context<TContext>) => Promise<string> | string;

  model: LanguageModel;
  modelSettings: LanguageModelSettings;
  toolkit: Toolkit<TContext>;

  // --- (TODO) ---
  // handoffDescription: string; // ??
  // handoffs: (Agent<any, TResponse> | Handoff<any, TResponse>)[];
  // ----------

  //  // (agent)
  // /* Process/thread-group–wide signal state shared by all threads in the group: shared pending signals, job control
  // (stops/cont, group exit), rlimits, etc. */
  // signal: *struct signal_struct;
  //  /* Table of signal handlers (sa_handler, sa_mask, flags) shared by threads (CLONE_SIGHAND). RCU-protected so readers can access it locklessly. */
  // sighand: *struct sighand_struct __rcu;

  guardrails: {
    input: InputGuardrail[];
    output: OutputGuardrail<AgentResponseType>[];
  };
  responseType: TResponse = "text" as TResponse;
  resetToolChoice: boolean;
  // toolUseBehavior: ToolUseBehavior; (TODO)

  // /**
  //  * Create an Agent with handoffs and automatically infer the union type for TResponse from the handoff agents' response types.
  //  */
  // static create<
  //   TResponse extends AgentResponseType = TextResponse,
  //   Handoffs extends readonly (Agent<any, any> | Handoff<any, any>)[] = [],
  // >(
  //   config: AgentConfigWithHandoffs<TResponse, Handoffs>,
  // ): Agent<UnknownContext, TResponse | HandoffsOutputUnion<Handoffs>> {
  //   return new Agent<UnknownContext, TResponse | HandoffsOutputUnion<Handoffs>>(
  //     {
  //       ...config,
  //       handoffs: config.handoffs as any,
  //       responseType: config.responseType,
  //       handoffresponseTypeWarningEnabled: false,
  //     },
  //   );
  // }

  constructor(config: AgentConfig<TContext, TResponse>) {
    super();
    if (typeof config.name !== "string" || config.name.trim() === "") {
      throw new MisconfiguredError("Agent must have a name.");
    }
    this.version = config.version;
    this.id = config.id;
    this.name = config.name;
    this.instructions =
      typeof config.instructions === "function"
        ? config.instructions
        : () => config.instructions as string;
    this.model = config.model ?? DEFAULT_LANGUAGE_MODEL;
    this.modelSettings = config.modelSettings ?? {};
    this.toolkit = new Toolkit<TContext>({
      tools: config.tools,
      mcpServers: config.mcpServers,
    });
    this.guardrails = config.guardrails ?? { input: [], output: [] };
    if (config.responseType) {
      this.responseType = config.responseType;
    }
    this.resetToolChoice = config.resetToolChoice ?? true;
    // this.toolUseBehavior = config.toolUseBehavior ?? "run_llm_again";

    // this.handoffDescription = config.handoffDescription ?? "";
    // this.handoffs = config.handoffs ?? [];

    // --- Runtime warning for handoff response type compatibility ---
    // if (
    //   config.handoffresponseTypeWarningEnabled === undefined ||
    //   config.handoffresponseTypeWarningEnabled
    // ) {
    //   if (this.handoffs && this.responseType) {
    //     const responseTypes = new Set<string>([
    //       JSON.stringify(this.responseType),
    //     ]);
    //     for (const h of this.handoffs) {
    //       if ("responseType" in h && h.responseType) {
    //         responseTypes.add(JSON.stringify(h.responseType));
    //       } else if ("agent" in h && h.agent.responseType) {
    //         responseTypes.add(JSON.stringify(h.agent.responseType));
    //       }
    //     }
    //     if (responseTypes.size > 1) {
    //       logger.warn(
    //         `[Agent] Warning: Handoff agents have different response types: ${Array.from(responseTypes).join(", ")}. You can make it type-safe by using Agent.create({ ... }) method instead.`,
    //       );
    //     }
    //   }
    // }
  }

  // async run<TContext>(
  //   input: string,
  //   options: SharedRunOptions<TContext>,
  // ): Promise<RunResult<TContext>> {
  //   // TODO
  //   // ...
  // }

  // async stream<TContext>(
  //   input: string,
  //   options: StreamOptions<TContext>,
  // ): Promise<StreamedRunResult<TContext>> {
  //   // TODO
  //   // ...
  // }
  //

  // ----------------------
  // Events
  // ----------------------

  // on(event: any, handler: Function): void {
  //   // TODO
  //   // ...
  // }

  // once(event: any, handler: Function): void {
  //   // TODO
  //   // ...
  // }

  // off(event: any, handler: Function): void {
  //   // TODO
  //   // ...
  // }
}
