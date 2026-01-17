import { Hono } from "hono";
import { homedir } from "os";

export const path = new Hono();

path.get("/", (cx) => {
  const cwd = process.cwd();
  return cx.json({
    state: cwd,
    config: cwd,
    worktree: cwd,
    directory: cwd,
    home: homedir(),
  });
});
