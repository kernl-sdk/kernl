import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

const store = new Map<string, Todo[]>();

interface Todo {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
}

export interface TodoContext {
  threadId?: string;
}

const TodoSchema = z.object({
  id: z.string().describe("Unique identifier"),
  content: z.string().describe("Task description"),
  status: z.enum(["pending", "in_progress", "completed"]),
  priority: z.enum(["high", "medium", "low"]),
});

const read = tool({
  id: "todo_read",
  description: "Read the current todo list",
  parameters: z.object({}),
  execute: async (ctx: Context<TodoContext>) => {
    const key = ctx.context.threadId ?? "default";
    const todos = store.get(key) ?? [];
    const pending = todos.filter((t) => t.status !== "completed").length;
    return { message: `${pending} todos remaining`, todos };
  },
});

const write = tool({
  id: "todo_write",
  description: "Update the todo list",
  parameters: z.object({
    todos: z.array(TodoSchema).describe("The complete updated todo list"),
  }),
  execute: async (ctx: Context<TodoContext>, { todos }) => {
    const key = ctx.context.threadId ?? "default";
    store.set(key, todos);
    const pending = todos.filter((t) => t.status !== "completed").length;
    return { message: `${pending} todos remaining`, todos };
  },
});

export const todo = new Toolkit<TodoContext>({
  id: "todo",
  description: "Task management: create, update, and track todos",
  tools: [read, write],
});
