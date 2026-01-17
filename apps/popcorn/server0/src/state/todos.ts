import * as events from "./events";

export interface Todo {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
}

const store = new Map<string, Todo[]>();

export function get(sessionID: string): Todo[] {
  return store.get(sessionID) ?? [];
}

export function update(sessionID: string, todos: Todo[]): Todo[] {
  store.set(sessionID, todos);
  events.emit(process.cwd(), {
    type: "todo.updated",
    properties: { sessionID, todos },
  });
  return todos;
}

export function clear(sessionID: string): void {
  store.delete(sessionID);
}
