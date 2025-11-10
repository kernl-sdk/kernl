import { z } from "zod";

import * as events from "@/types/thread";

/**
 * Utilities and schemas for serializing the run-state so that it can be paused / resumed later.
 *
 * (TODO): should be able to define this as a codec for the ThreadState schema
 */

/**
 * The schema version of the serialized run state. This is used to ensure that the serialized
 * run state is compatible with the current version of the SDK.
 * If anything in this schema changes, the version will have to be incremented.
 */
export const CURRENT_SCHEMA_VERSION = "1.0" as const;
const $schemaVersion = z.literal(CURRENT_SCHEMA_VERSION);

const serializedAgentSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

const serializedSpanBase = z.object({
  object: z.literal("trace.span"),
  id: z.string(),
  trace_id: z.string(),
  parent_id: z.string().nullable(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  error: z
    .object({
      message: z.string(),
      data: z.record(z.string(), z.any()).optional(),
    })
    .nullable(),
  span_data: z.record(z.string(), z.any()),
});

type SerializedSpanType = z.infer<typeof serializedSpanBase> & {
  previous_span?: SerializedSpanType;
};

const SerializedSpan: z.ZodType<SerializedSpanType> = serializedSpanBase.extend(
  {
    previous_span: z.lazy(() => SerializedSpan).optional(),
  },
);

const usageSchema = z.object({
  requests: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
});

const modelResponseSchema = z.object({
  usage: usageSchema,
  events: z.array(events.ThreadEvent),
  responseId: z.string().optional(),
  providerData: z.record(z.string(), z.any()).optional(),
});

const itemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("message"),
    rawItem: events.AssistantMessage,
    agent: serializedAgentSchema,
  }),
  z.object({
    kind: z.literal("tool-call"),
    // rawItem: events.ToolCall.or(events.HostedToolCall),
    rawItem: events.ToolCall,
    agent: serializedAgentSchema,
  }),
  z.object({
    kind: z.literal("tool-result"),
    rawItem: events.ToolResultEvent,
    agent: serializedAgentSchema,
    output: z.string(),
  }),
  z.object({
    kind: z.literal("reasoning"),
    rawItem: events.Reasoning,
    agent: serializedAgentSchema,
  }),
]);

const serializedTraceSchema = z.object({
  object: z.literal("trace"),
  id: z.string(),
  workflow_name: z.string(),
  group_id: z.string().nullable(),
  metadata: z.record(z.string(), z.any()),
});

const serializedProcessedResponseSchema = z.object({
  newItems: z.array(itemSchema),
  toolsUsed: z.array(z.string()),
  functions: z.array(
    z.object({
      toolCall: z.any(),
      tool: z.any(),
    }),
  ),
  mcpApprovalRequests: z
    .array(
      z.object({
        requestItem: z.object({
          // protocol.HostedToolCallItem
          rawItem: z.object({
            type: z.literal("hosted_tool_call"),
            name: z.string(),
            arguments: z.string().optional(),
            status: z.string().optional(),
            output: z.string().optional(),
            // this always exists but marked as optional for early version compatibility; when releasing 1.0, we can remove the nullable and optional
            providerData: z.record(z.string(), z.any()).nullable().optional(),
          }),
        }),
        // HostedMCPTool
        mcpTool: z.object({
          type: z.literal("hosted_tool"),
          name: z.literal("hosted_mcp"),
          providerData: z.record(z.string(), z.any()),
        }),
      }),
    )
    .optional(),
});

const guardrailFunctionOutputSchema = z.object({
  tripwireTriggered: z.boolean(),
  outputInfo: z.any(),
});

const inputGuardrailResultSchema = z.object({
  guardrail: z.object({
    type: z.literal("input"),
    name: z.string(),
  }),
  output: guardrailFunctionOutputSchema,
});

const outputGuardrailResultSchema = z.object({
  guardrail: z.object({
    type: z.literal("output"),
    name: z.string(),
  }),
  agentOutput: z.any(),
  agent: serializedAgentSchema,
  output: guardrailFunctionOutputSchema,
});

// (TODO): define z.codec
export const SerializedThread = z.object({
  $schemaVersion,
  currentTurn: z.number(),
  currentAgent: serializedAgentSchema, // (TODO): in our case we probably don't need to serialize the whole agent - an ID would suffice
  originalInput: z.string().or(z.array(events.ThreadEvent)),
  modelResponses: z.array(modelResponseSchema),
  context: z.object({
    usage: usageSchema, // (TODO): move to stats
    // (TODO): belongs elsewhere
    approvals: z.record(
      z.string(),
      z.object({
        approved: z.array(z.string()).or(z.boolean()),
        rejected: z.array(z.string()).or(z.boolean()),
      }),
    ),
    context: z.record(z.string(), z.any()),
  }),
  toolUseTracker: z.record(z.string(), z.array(z.string())),
  maxTurns: z.number(),
  currentAgentSpan: SerializedSpan.nullable().optional(),
  noActiveAgentRun: z.boolean(),
  inputGuardrailResults: z.array(inputGuardrailResultSchema),
  outputGuardrailResults: z.array(outputGuardrailResultSchema),
  // (TODO): currentStep: nextStepSchema.optional(),
  lastModelResponse: modelResponseSchema.optional(),
  generatedItems: z.array(itemSchema),
  lastProcessedResponse: serializedProcessedResponseSchema.optional(),
  currentTurnPersistedItemCount: z.number().int().min(0).optional(),
  trace: serializedTraceSchema.nullable(),
});

export type SerializedThread = z.infer<typeof SerializedThread>;
