import { Toolkit } from "kernl";

import { read } from "./read";
import { write, type TodoContext } from "./write";

export type { TodoContext };

export const todo = new Toolkit<TodoContext>({
  id: "todo",
  description: "Task management: create, update, and track todos",
  tools: [read, write],
});
