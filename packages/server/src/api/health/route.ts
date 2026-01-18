import { Hono } from "hono";
import { version } from "../../../package.json";

export const health = new Hono();

health.get("/", (c) => c.json({ healthy: true, version }));
