import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { Kernl } from "kernl";

import { codex } from "@/agents/codex";
import { sandex } from "@/agents/sandex";
import { titler } from "@/agents/titler";
import { claudmin } from "@/agents/claudmin";
import * as eventBus from "@/state/events";

import { global } from "@/api/global";
import { events } from "@/api/events";
import { sessions } from "@/api/sessions";
import { providers } from "@/api/providers";
import { auth } from "@/api/auth";
import { agents } from "@/api/agents";
import { permissions } from "@/api/permissions";
import { files } from "@/api/files";
import { project } from "@/api/project";
import { config } from "@/api/config";
import { path } from "@/api/path";
import { app as appRoutes } from "@/api/app";
import { command } from "@/api/command";
import { mcp } from "@/api/mcp";
import { lsp } from "@/api/lsp";
import { vcs } from "@/api/vcs";
import { find } from "@/api/find";

type Variables = {
  kernl: Kernl;
  directory: string;
};

/**
 * Hono app builder for OpenCode-compatible adapter server.
 * This server translates OpenCode contract endpoints → kernl primitives.
 */
export function build(): Hono<{ Variables: Variables }> {
  const kernl = new Kernl();

  // --- agents ---
  kernl.register(codex);
  kernl.register(sandex);
  kernl.register(titler);
  kernl.register(claudmin);

  const app = new Hono<{ Variables: Variables }>();

  // --- CORS ---
  app.use(
    "/*",
    cors({
      origin: "*",
      credentials: true,
    }),
  );

  // --- inject kernl into context ---
  app.use("/*", async (cx, next) => {
    cx.set("kernl", kernl);
    await next();
  });

  // --- inject directory into context ---
  app.use("/*", async (cx, next) => {
    // Priority: query param > header > process.cwd()
    const directory =
      cx.req.query("directory") ||
      cx.req.header("x-opencode-directory") ||
      process.cwd();
    cx.set("directory", directory);
    await next();
  });

  // --- error handler ---
  app.onError(handleError);

  // --- routes ---
  app.route("/global", global);
  app.route("/event", events);
  app.route("/session", sessions);
  app.route("/provider", providers);
  app.route("/auth", auth);
  app.route("/agent", agents);
  app.route("/permission", permissions);
  app.route("/file", files);
  app.route("/project", project);
  app.route("/config", config);
  app.route("/path", path);
  app.route("/app", appRoutes);
  app.route("/command", command);
  app.route("/mcp", mcp);
  app.route("/lsp", lsp);
  app.route("/vcs", vcs);
  app.route("/find", find);

  return app;
}

function handleError(
  err: Error,
  cx: Context<{ Variables: Variables }>,
): Response {
  console.error("[error]", err.message);

  const directory = cx.get("directory") ?? "";
  const message = err.message || "An unexpected error occurred";

  // Emit error event for TUI toast
  eventBus.emit(directory, {
    type: "app.error",
    properties: {
      error: {
        name: "UnknownError",
        data: { message },
      },
    },
  });

  return cx.json(
    {
      error: {
        code: "internal_server_error",
        message,
      },
    },
    500,
  );
}
