import { Hono } from "hono";

type Variables = {
  directory: string;
};

export const project = new Hono<{ Variables: Variables }>();

project.get("/current", (cx) => {
  return cx.json({ id: "default" });
});

project.get("/", (cx) => {
  const directory = cx.get("directory");
  return cx.json([
    {
      id: "default",
      worktree: directory,
      time: {
        created: Date.now(),
        updated: Date.now(),
      },
    },
  ]);
});

project.get("/:id", (cx) => {
  const id = cx.req.param("id");
  const directory = cx.get("directory");
  return cx.json({
    id,
    worktree: directory,
    time: {
      created: Date.now(),
      updated: Date.now(),
    },
  });
});

project.patch("/:id", async (cx) => {
  const id = cx.req.param("id");
  const directory = cx.get("directory");
  const body = await cx.req.json();
  return cx.json({
    id,
    worktree: directory,
    time: {
      created: Date.now(),
      updated: Date.now(),
    },
    ...body,
  });
});
